#!/usr/bin/env python3
"""cc.py — multi-session awareness hooks for Claude Code.

Primary data source: ~/.claude/sessions/*.json (Claude Code's own registry).
Enrichment: ~/.claude/cc/enrich/{sessionId}.json (files, task — written by hooks).
Mailbox: ~/.claude/cc/mailbox/{sessionId}.json (cross-session messages).
State: ~/.claude/cc/state/{sessionId}.json (roster hash + debounce timestamp).

Respects CLAUDE_CONFIG_DIR for portability across all environments.

Context budget strategy:
  - Roster output is DELTA-ONLY: only emits when peers/messages change
  - Time-debounced: skips if last check was < DEBOUNCE_SECONDS ago
  - Enrichment writes are conditional: skips if data unchanged
  This prevents repetitive context accumulation in long sessions.

Events:
  roster  — UserPromptSubmit: read sessions, write enrichment, output roster
  touch   — PostToolUse (Edit/Write): update files in enrichment
  cleanup — SessionEnd: remove enrichment + state files
"""

from __future__ import annotations

import fcntl
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Resolve paths the same way Claude Code does (src/utils/envUtils.ts)
CLAUDE_DIR = Path(os.environ.get("CLAUDE_CONFIG_DIR", Path.home() / ".claude"))
SESSIONS_DIR = CLAUDE_DIR / "sessions"
ENRICH_DIR = CLAUDE_DIR / "cc" / "enrich"
MAILBOX_DIR = CLAUDE_DIR / "cc" / "mailbox"
STATE_DIR = CLAUDE_DIR / "cc" / "state"
MAX_TRACKED_FILES = 20
DEBOUNCE_SECONDS = 3  # skip roster if last check was this recent

PID_FILE_RE = re.compile(r"^\d+\.json$")


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def context(msg: str) -> None:
    print(msg)


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# File locking
# ---------------------------------------------------------------------------

_ensured_dirs: set[str] = set()


def locked_write(path: Path, updater, default=None):
    """Atomic read-modify-write with advisory file locking."""
    parent = str(path.parent)
    if parent not in _ensured_dirs:
        path.parent.mkdir(parents=True, exist_ok=True)
        _ensured_dirs.add(parent)

    lock_path = path.with_suffix(path.suffix + ".lock")
    with open(lock_path, "w") as lock_fd:
        fcntl.flock(lock_fd, fcntl.LOCK_EX)
        try:
            try:
                data = json.loads(path.read_text())
            except (json.JSONDecodeError, OSError, FileNotFoundError):
                data = default() if callable(default) else default
            result = updater(data)
            tmp = path.with_suffix(f".tmp.{os.getpid()}")
            tmp.write_text(json.dumps(result))
            tmp.rename(path)
            return result
        finally:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)


# ---------------------------------------------------------------------------
# Session discovery (reads Claude Code's native registry)
# ---------------------------------------------------------------------------

def pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def read_live_sessions() -> list[dict]:
    """Read all live sessions from ~/.claude/sessions/*.json."""
    if not SESSIONS_DIR.is_dir():
        return []
    sessions = []
    for f in SESSIONS_DIR.iterdir():
        if not PID_FILE_RE.match(f.name):
            continue
        pid = int(f.stem)
        if not pid_alive(pid):
            continue
        try:
            raw = f.read_text()
            # Claude Code pads PID files with null bytes on partial writes
            raw = raw.rstrip("\x00").strip()
            if not raw.endswith("}"):
                raw = raw.rstrip().rstrip(",") + "}"
            raw = re.sub(r",\s*}", "}", raw)
            data = json.loads(raw)
            data["_pid"] = pid
            sessions.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    return sessions


# ---------------------------------------------------------------------------
# Enrichment (our metadata layer on top of Claude Code's registry)
# ---------------------------------------------------------------------------

def enrich_path(session_id: str) -> Path:
    return ENRICH_DIR / f"{session_id}.json"


def read_enrichment(session_id: str) -> dict | None:
    try:
        return json.loads(enrich_path(session_id).read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return None


# ---------------------------------------------------------------------------
# Mailbox
# ---------------------------------------------------------------------------

def read_unread(session_id: str) -> list[dict]:
    try:
        return [m for m in json.loads((MAILBOX_DIR / f"{session_id}.json").read_text()) if not m.get("read")]
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return []


def mark_read(session_id: str) -> None:
    def updater(msgs):
        for m in msgs:
            m["read"] = True
        return msgs
    locked_write(MAILBOX_DIR / f"{session_id}.json", updater, default=list)


# ---------------------------------------------------------------------------
# State (delta detection + debounce)
# ---------------------------------------------------------------------------

def state_path(session_id: str) -> Path:
    return STATE_DIR / f"{session_id}.json"


def read_state(session_id: str) -> dict:
    try:
        return json.loads(state_path(session_id).read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return {}


def write_state(session_id: str, state: dict) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    sp = state_path(session_id)
    tmp = sp.with_suffix(f".tmp.{os.getpid()}")
    tmp.write_text(json.dumps(state))
    tmp.rename(sp)


def should_debounce(session_id: str) -> bool:
    """Return True if roster was checked too recently."""
    st = read_state(session_id)
    last = st.get("last_check", 0)
    return (time.time() - last) < DEBOUNCE_SECONDS


def roster_hash(lines: list[str]) -> str:
    """Hash roster output to detect changes."""
    return hashlib.md5("\n".join(lines).encode()).hexdigest()[:12]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_session_id(payload: dict) -> str:
    return payload.get("session_id") or os.environ.get("CLAUDE_SESSION_ID", "")


def get_cwd(payload: dict) -> str:
    return payload.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())


# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------

def handle_roster(payload: dict) -> None:
    """UserPromptSubmit: delta-only roster with debounce.

    Context budget strategy:
    1. Debounce: skip entirely if last check < DEBOUNCE_SECONDS ago
       (unless there are unread messages — those always get delivered)
    2. Delta-only: hash roster output, skip if identical to last emission
    3. Conditional enrichment: only rewrite file when data actually changed
    """
    session_id = get_session_id(payload)
    if not session_id:
        log("[cc] no session_id, skipping")
        return

    cwd = get_cwd(payload)
    my_project = os.path.basename(cwd)

    # Always check for messages (cheap, high-priority)
    messages = read_unread(session_id)

    # Debounce roster (but not messages)
    if not messages and should_debounce(session_id):
        return

    # Read all live sessions from Claude Code's registry
    all_sessions = read_live_sessions()

    # Conditional enrichment write: only if data changed
    prompt = payload.get("user_prompt", "")
    existing = read_enrichment(session_id) or {}
    new_task = prompt[:120] if prompt else existing.get("task", "")
    if new_task != existing.get("task", "") or not existing:
        enrich = {
            "files": existing.get("files", []),
            "task": new_task,
            "updated": now_iso(),
        }
        ENRICH_DIR.mkdir(parents=True, exist_ok=True)
        ep = enrich_path(session_id)
        tmp = ep.with_suffix(f".tmp.{os.getpid()}")
        tmp.write_text(json.dumps(enrich))
        tmp.rename(ep)
        existing = enrich

    # Build roster lines
    peers = [s for s in all_sessions if s.get("sessionId") != session_id]

    if not peers and not messages:
        # Update state timestamp even when no output
        write_state(session_id, {"last_check": time.time(), "last_hash": ""})
        return

    lines: list[str] = []
    my_files = set(existing.get("files", []))
    same_project = []
    other_projects: dict[str, int] = {}

    for peer in peers:
        peer_cwd = peer.get("cwd", "")
        peer_proj = os.path.basename(peer_cwd)
        if peer_proj == my_project:
            same_project.append(peer)
        else:
            other_projects[peer_proj] = other_projects.get(peer_proj, 0) + 1

    if same_project:
        lines.append(f"[cc] {len(same_project) + 1} on {my_project}")
        for peer in same_project:
            name = peer.get("name") or peer.get("sessionId", "?")[:8]
            peer_enrich = read_enrichment(peer.get("sessionId", "")) or {}
            files = peer_enrich.get("files", [])
            task = peer_enrich.get("task", "")
            parts = [f"  └ {name}"]
            if files:
                parts.append(", ".join(files[-3:]))
            if task:
                parts.append(f'"{task[:40]}"')
            lines.append("  ".join(parts))

            # File conflicts (always show — these are critical)
            for cf in my_files & set(files):
                lines.append(f"  !! conflict: {cf} ({name})")

    if other_projects:
        parts = [f"{p}({c})" for p, c in sorted(other_projects.items(), key=lambda x: -x[1])[:3]]
        lines.append(f"[cc] +{', '.join(parts)}")

    # Delta check: skip if roster unchanged since last emission
    st = read_state(session_id)
    current_hash = roster_hash(lines)
    if current_hash == st.get("last_hash", "") and not messages:
        # Roster unchanged, no messages — suppress output
        write_state(session_id, {"last_check": time.time(), "last_hash": current_hash})
        return

    # Emit roster
    for line in lines:
        context(line)

    # Messages (always delivered, never suppressed)
    if messages:
        for msg in messages:
            context(f"[cc] {msg.get('from', '?')}: {msg.get('text', msg.get('content', ''))[:120]}")
        mark_read(session_id)

    # Update state
    write_state(session_id, {"last_check": time.time(), "last_hash": current_hash})


def handle_touch(payload: dict) -> None:
    """PostToolUse (Edit/Write): update files in enrichment."""
    session_id = get_session_id(payload)
    if not session_id:
        return

    tool_input = payload.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    if not file_path:
        return

    cwd = get_cwd(payload)
    if file_path.startswith(cwd):
        file_path = file_path[len(cwd):].lstrip("/")

    def updater(data):
        if not data:
            data = {"files": [], "task": "", "updated": now_iso()}
        files = data.get("files", [])
        if file_path not in files:
            files.append(file_path)
            if len(files) > MAX_TRACKED_FILES:
                files = files[-MAX_TRACKED_FILES:]
            data["files"] = files
            data["updated"] = now_iso()
        return data

    locked_write(enrich_path(session_id), updater, default=dict)


def handle_cleanup(payload: dict) -> None:
    """SessionEnd: remove enrichment + state files."""
    session_id = get_session_id(payload)
    if not session_id:
        return
    for p in [enrich_path(session_id), state_path(session_id)]:
        try:
            p.unlink(missing_ok=True)
        except OSError:
            pass
    log(f"[cc] cleaned up {session_id[:8]}")


def get_cpu(pid: int) -> float:
    """Get CPU % for a PID. Returns 0.0 on any error."""
    try:
        import subprocess
        out = subprocess.run(
            ["ps", "-p", str(pid), "-o", "%cpu="],
            capture_output=True, text=True, timeout=1,
        ).stdout.strip()
        return float(out) if out else 0.0
    except (ValueError, OSError, subprocess.TimeoutExpired):
        return 0.0


def handle_roster_cli(payload: dict) -> None:
    """CLI roster: python3 cc.py roster-cli [cwd]

    Reads Claude Code's native session registry, enriches with cc metadata.
    Outputs formatted roster to stdout. Zero external deps.
    """
    my_cwd = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
    my_project = os.path.basename(my_cwd)

    sessions = read_live_sessions()
    if not sessions:
        print("No active sessions.")
        return

    # Add CPU + enrichment to each session
    busy_count = 0
    for s in sessions:
        cpu = get_cpu(s["_pid"])
        s["_busy"] = cpu > 5
        if s["_busy"]:
            busy_count += 1
        sid = s.get("sessionId", "")
        e = read_enrichment(sid) or {}
        s["_files"] = e.get("files", [])
        s["_task"] = e.get("task", "")

    idle_count = len(sessions) - busy_count
    print(f"cc — {len(sessions)} sessions ({busy_count} busy, {idle_count} idle)")
    print()

    # Group by project
    by_proj: dict[str, list[dict]] = {}
    for s in sessions:
        proj = os.path.basename(s.get("cwd", ""))
        by_proj.setdefault(proj, []).append(s)

    # Sort: current project first, then by count
    sorted_projs = sorted(by_proj.keys(), key=lambda p: (-1 if p == my_project else 0, -len(by_proj[p])))

    for proj in sorted_projs:
        members = by_proj[proj]
        marker = "  ← YOU ARE HERE" if proj == my_project else ""
        print(f"  {proj} ({len(members)}){marker}")

        for i, m in enumerate(members):
            conn = "└" if i == len(members) - 1 else "├"
            status = "▶" if m.get("_busy") else "·"
            name = m.get("name") or m.get("kind", "session")
            name = name[:22] + "..." if len(name) > 25 else name
            files = ", ".join(m["_files"][-3:]) if m["_files"] else ""
            task = m["_task"]
            task = task[:42] + "..." if len(task) > 45 else task

            line = f"  {conn} {status} {name}"
            if files:
                line += f"  {files}"
            if task:
                line += f'  "{task}"'
            print(line)

        print()


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

HANDLERS = {
    "roster": handle_roster,
    "touch": handle_touch,
    "cleanup": handle_cleanup,
    "roster-cli": handle_roster_cli,
}


def main() -> None:
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <roster|touch|cleanup|roster-cli>", file=sys.stderr)
        sys.exit(1)

    event = sys.argv[1]
    if event not in HANDLERS:
        print(f"[cc] unknown event: {event}", file=sys.stderr)
        sys.exit(1)

    # roster-cli reads args, not stdin
    if event == "roster-cli":
        try:
            HANDLERS[event]({})
        except Exception as e:
            log(f"[cc] roster-cli error: {e}")
            sys.exit(0)
        return

    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        payload = {}

    try:
        HANDLERS[event](payload)
    except Exception as e:
        log(f"[cc] {event} error: {e}")
        sys.exit(0)


if __name__ == "__main__":
    main()
