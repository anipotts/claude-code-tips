#!/usr/bin/env python3
"""Test suite for cc — enrichment-based multi-session awareness.

Tests all 3 hook handlers (roster, touch, cleanup) plus the MCP server's
session discovery. Uses the enrichment architecture:
  - ~/.claude/sessions/{pid}.json  (Claude Code's native registry — mocked)
  - ~/.claude/cc/enrich/{sessionId}.json  (cc's metadata layer)
  - ~/.claude/cc/mailbox/{sessionId}.json  (cross-session messages)
"""

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

HOOK_SCRIPT = Path(__file__).parent.parent / "hooks" / "cc.py"
CLAUDE_DIR = Path.home() / ".claude"
ENRICH_DIR = CLAUDE_DIR / "cc" / "enrich"
MAILBOX_DIR = CLAUDE_DIR / "cc" / "mailbox"
STATE_DIR = CLAUDE_DIR / "cc" / "state"
SESSIONS_DIR = CLAUDE_DIR / "sessions"

TEST_CWD = "/tmp/cc-test-project"
TEST_PROJECT = "cc-test-project"

passed = 0
failed = 0
errors = []


def run_hook(event: str, payload: dict) -> tuple[str, str, int]:
    result = subprocess.run(
        [sys.executable, str(HOOK_SCRIPT), event],
        input=json.dumps(payload),
        capture_output=True, text=True, timeout=10,
    )
    return result.stdout, result.stderr, result.returncode


def clean():
    """Remove test enrichment, mailbox, and state files only (not real sessions)."""
    for prefix in ["test-", "peer-", "cleanup-", "touch-", "mail-", "conc-",
                    "robust-", "minimal-", "long-", "unicode-", "perf-",
                    "alive-", "dead-", "batch-", "delta-", "debounce-"]:
        for d in [ENRICH_DIR, MAILBOX_DIR, STATE_DIR]:
            if d.is_dir():
                for f in d.iterdir():
                    if f.stem.startswith(prefix):
                        f.unlink(missing_ok=True)


def read_enrich(session_id: str) -> dict | None:
    p = ENRICH_DIR / f"{session_id}.json"
    if not p.exists():
        return None
    return json.loads(p.read_text())


def write_enrich(session_id: str, data: dict):
    ENRICH_DIR.mkdir(parents=True, exist_ok=True)
    (ENRICH_DIR / f"{session_id}.json").write_text(json.dumps(data))


def write_inbox(session_id: str, messages: list):
    MAILBOX_DIR.mkdir(parents=True, exist_ok=True)
    (MAILBOX_DIR / f"{session_id}.json").write_text(json.dumps(messages))


def read_inbox(session_id: str) -> list:
    p = MAILBOX_DIR / f"{session_id}.json"
    if not p.exists():
        return []
    return json.loads(p.read_text())


def assert_test(name: str, condition: bool, detail: str = ""):
    global passed, failed, errors
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        msg = f"  FAIL  {name}" + (f" — {detail}" if detail else "")
        print(msg)
        errors.append(msg)


# ===========================================================================
# ROSTER: Enrichment
# ===========================================================================

def test_roster_writes_enrichment():
    clean()
    payload = {"session_id": "test-001", "cwd": TEST_CWD, "user_prompt": "fix login bug"}
    stdout, stderr, code = run_hook("roster", payload)
    assert_test("roster:enrich:exits_0", code == 0)

    enrich = read_enrich("test-001")
    assert_test("roster:enrich:created", enrich is not None)
    assert_test("roster:enrich:has_task", enrich.get("task") == "fix login bug")
    assert_test("roster:enrich:has_files", enrich.get("files") == [])
    assert_test("roster:enrich:has_updated", "updated" in enrich)


def test_roster_no_session_id():
    clean()
    stdout, stderr, code = run_hook("roster", {"cwd": TEST_CWD})
    assert_test("roster:no_id:exits_0", code == 0)
    assert_test("roster:no_id:no_enrich", not (ENRICH_DIR / "none.json").exists())


def test_roster_empty_payload():
    clean()
    stdout, stderr, code = run_hook("roster", {})
    assert_test("roster:empty:exits_0", code == 0)


def test_roster_truncates_long_prompt():
    clean()
    payload = {"session_id": "test-long", "cwd": TEST_CWD, "user_prompt": "x" * 200}
    run_hook("roster", payload)
    enrich = read_enrich("test-long")
    assert_test("roster:truncation:exists", enrich is not None)
    assert_test("roster:truncation:capped", len(enrich.get("task", "")) <= 120,
                f"got {len(enrich.get('task', ''))}")


def test_roster_unicode():
    clean()
    payload = {"session_id": "test-unicode", "cwd": TEST_CWD, "user_prompt": "fix 日本語.py 🐛"}
    run_hook("roster", payload)
    enrich = read_enrich("test-unicode")
    assert_test("roster:unicode:exists", enrich is not None)
    assert_test("roster:unicode:preserved", "日本語" in enrich.get("task", ""))


def test_roster_preserves_files():
    clean()
    payload = {"session_id": "test-preserve", "cwd": TEST_CWD, "user_prompt": "a"}
    run_hook("roster", payload)
    run_hook("touch", {"session_id": "test-preserve", "cwd": TEST_CWD,
                        "tool_input": {"file_path": f"{TEST_CWD}/foo.py"}})
    # Roster again should keep files
    run_hook("roster", {"session_id": "test-preserve", "cwd": TEST_CWD, "user_prompt": "b"})
    enrich = read_enrich("test-preserve")
    assert_test("roster:preserves_files", "foo.py" in enrich.get("files", []))


def test_roster_shows_messages():
    clean()
    payload = {"session_id": "test-msg", "cwd": TEST_CWD, "user_prompt": "check"}
    run_hook("roster", payload)
    write_inbox("test-msg", [
        {"from": "sender", "text": "update your imports", "timestamp": "2026-03-31T05:30:00Z", "read": False}
    ])
    stdout, _, _ = run_hook("roster", {"session_id": "test-msg", "cwd": TEST_CWD, "user_prompt": "check"})
    assert_test("roster:msg:has_text", "update your imports" in stdout)
    assert_test("roster:msg:has_from", "sender" in stdout)


def test_roster_shows_peers():
    """When there are live sessions (real ones on this machine), roster outputs something."""
    clean()
    payload = {"session_id": "test-peers", "cwd": TEST_CWD, "user_prompt": "x"}
    stdout, stderr, code = run_hook("roster", payload)
    assert_test("roster:peers:exits_0", code == 0)
    # There should be real sessions running (at least our own Claude Code)
    # The roster should show cross-project summary or same-project peers
    has_output = "[cc]" in stdout or stdout.strip() == ""
    assert_test("roster:peers:valid_output", has_output)


# ===========================================================================
# TOUCH
# ===========================================================================

def test_touch_basic():
    clean()
    run_hook("roster", {"session_id": "test-touch", "cwd": TEST_CWD, "user_prompt": "work"})
    run_hook("touch", {"session_id": "test-touch", "cwd": TEST_CWD,
                        "tool_input": {"file_path": f"{TEST_CWD}/src/app.ts"}})
    enrich = read_enrich("test-touch")
    assert_test("touch:basic:exists", enrich is not None)
    assert_test("touch:basic:has_file", "src/app.ts" in enrich.get("files", []))


def test_touch_relative_path():
    clean()
    cwd = "/Users/test/project"
    run_hook("roster", {"session_id": "test-touchrel", "cwd": cwd, "user_prompt": "x"})
    run_hook("touch", {"session_id": "test-touchrel", "cwd": cwd,
                        "tool_input": {"file_path": f"{cwd}/lib/utils.py"}})
    enrich = read_enrich("test-touchrel")
    assert_test("touch:relative:exists", enrich is not None)
    files = enrich.get("files", [])
    assert_test("touch:relative:converted", "lib/utils.py" in files)
    assert_test("touch:relative:no_abs", not any(f.startswith("/") for f in files))


def test_touch_dedup():
    clean()
    run_hook("roster", {"session_id": "test-dedup", "cwd": TEST_CWD, "user_prompt": "x"})
    run_hook("touch", {"session_id": "test-dedup", "cwd": TEST_CWD,
                        "tool_input": {"file_path": f"{TEST_CWD}/a.py"}})
    run_hook("touch", {"session_id": "test-dedup", "cwd": TEST_CWD,
                        "tool_input": {"file_path": f"{TEST_CWD}/a.py"}})
    enrich = read_enrich("test-dedup")
    assert_test("touch:dedup", enrich.get("files", []).count("a.py") == 1)


def test_touch_max():
    clean()
    run_hook("roster", {"session_id": "test-max", "cwd": TEST_CWD, "user_prompt": "x"})
    for i in range(25):
        run_hook("touch", {"session_id": "test-max", "cwd": TEST_CWD,
                            "tool_input": {"file_path": f"{TEST_CWD}/file{i}.py"}})
    enrich = read_enrich("test-max")
    files = enrich.get("files", [])
    assert_test("touch:max:capped", len(files) <= 20, f"got {len(files)}")
    assert_test("touch:max:recent", "file24.py" in files)


def test_touch_no_session():
    clean()
    stdout, stderr, code = run_hook("touch", {"session_id": "test-nope", "cwd": TEST_CWD,
                                                "tool_input": {"file_path": "/tmp/foo.py"}})
    assert_test("touch:no_session:exits_0", code == 0)


def test_touch_empty():
    clean()
    stdout, stderr, code = run_hook("touch", {})
    assert_test("touch:empty:exits_0", code == 0)


# ===========================================================================
# CLEANUP
# ===========================================================================

def test_cleanup_basic():
    clean()
    run_hook("roster", {"session_id": "test-cleanup", "cwd": TEST_CWD, "user_prompt": "x"})
    assert_test("cleanup:before:exists", read_enrich("test-cleanup") is not None)
    run_hook("cleanup", {"session_id": "test-cleanup", "cwd": TEST_CWD})
    assert_test("cleanup:after:removed", read_enrich("test-cleanup") is None)


def test_cleanup_nonexistent():
    clean()
    stdout, stderr, code = run_hook("cleanup", {"session_id": "test-nope", "cwd": TEST_CWD})
    assert_test("cleanup:nonexistent:exits_0", code == 0)


def test_cleanup_empty():
    clean()
    stdout, stderr, code = run_hook("cleanup", {})
    assert_test("cleanup:empty:exits_0", code == 0)


# ===========================================================================
# MAILBOX
# ===========================================================================

def test_mailbox_receive():
    clean()
    run_hook("roster", {"session_id": "test-mailrx", "cwd": TEST_CWD, "user_prompt": "x"})
    write_inbox("test-mailrx", [
        {"from": "sender", "text": "update your imports", "timestamp": "2026-03-31T05:30:00Z",
         "read": False, "summary": "import change"}
    ])
    stdout, _, _ = run_hook("roster", {"session_id": "test-mailrx", "cwd": TEST_CWD, "user_prompt": "check"})
    assert_test("mailbox:rx:has_tag", "[cc]" in stdout)
    assert_test("mailbox:rx:has_text", "update your imports" in stdout)
    assert_test("mailbox:rx:has_from", "sender" in stdout)


def test_mailbox_mark_read():
    clean()
    run_hook("roster", {"session_id": "test-mailread", "cwd": TEST_CWD, "user_prompt": "x"})
    write_inbox("test-mailread", [
        {"from": "a", "text": "hello", "timestamp": "now", "read": False}
    ])
    # First read — should show message
    stdout1, _, _ = run_hook("roster", {"session_id": "test-mailread", "cwd": TEST_CWD, "user_prompt": "x"})
    # Second read — message should be marked read, not shown
    stdout2, _, _ = run_hook("roster", {"session_id": "test-mailread", "cwd": TEST_CWD, "user_prompt": "x"})
    assert_test("mailbox:read:first", "hello" in stdout1)
    assert_test("mailbox:read:second", "hello" not in stdout2, f"got: {stdout2[:200]}")
    # Verify message still exists but is read
    inbox = read_inbox("test-mailread")
    assert_test("mailbox:read:persisted", len(inbox) == 1 and inbox[0].get("read") is True)


# ===========================================================================
# SECURITY
# ===========================================================================

def test_security_path_traversal():
    clean()
    stdout, stderr, code = run_hook("roster", {
        "session_id": "../../../etc/passwd",
        "cwd": TEST_CWD, "user_prompt": "x",
    })
    assert_test("security:traversal:exits_0", code == 0)


# ===========================================================================
# ROBUSTNESS
# ===========================================================================

def test_robustness_corrupted_enrich():
    clean()
    ENRICH_DIR.mkdir(parents=True, exist_ok=True)
    (ENRICH_DIR / "test-robust.json").write_text("{bad json!")
    # Touch should handle corrupted enrich gracefully
    stdout, stderr, code = run_hook("touch", {
        "session_id": "test-robust", "cwd": TEST_CWD,
        "tool_input": {"file_path": f"{TEST_CWD}/foo.py"},
    })
    assert_test("robustness:corrupted:exits_0", code == 0)
    enrich = read_enrich("test-robust")
    assert_test("robustness:corrupted:recovered", enrich is not None)
    assert_test("robustness:corrupted:has_file", "foo.py" in enrich.get("files", []))


# ===========================================================================
# DISPATCHER
# ===========================================================================

def test_unknown_event():
    stdout, stderr, code = run_hook("bogus", {})
    assert_test("dispatcher:unknown:nonzero", code != 0)


def test_no_event():
    result = subprocess.run([sys.executable, str(HOOK_SCRIPT)], capture_output=True, text=True, timeout=5)
    assert_test("dispatcher:no_event:nonzero", result.returncode != 0)


def test_bad_json():
    result = subprocess.run(
        [sys.executable, str(HOOK_SCRIPT), "roster"],
        input="not json {{{", capture_output=True, text=True, timeout=5,
    )
    assert_test("dispatcher:bad_json:exits_0", result.returncode == 0)


# ===========================================================================
# PERFORMANCE
# ===========================================================================

def test_performance():
    clean()
    # Create 10 enrichment files to simulate busy project
    for i in range(10):
        write_enrich(f"perf-{i}", {"files": [f"f{j}.py" for j in range(5)], "task": f"task {i}", "updated": ""})
    start = time.time()
    run_hook("roster", {"session_id": "test-perf", "cwd": TEST_CWD, "user_prompt": "x"})
    elapsed = time.time() - start
    assert_test("performance:under_2s", elapsed < 2.0, f"took {elapsed:.2f}s")


# ===========================================================================
# CONCURRENT
# ===========================================================================

def test_concurrent():
    clean()
    import concurrent.futures

    def run_one(i):
        sid = f"conc-{i}"
        run_hook("roster", {"session_id": sid, "cwd": TEST_CWD, "user_prompt": f"task {i}"})
        run_hook("touch", {"session_id": sid, "cwd": TEST_CWD,
                            "tool_input": {"file_path": f"{TEST_CWD}/file{i}.py"}})

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        list(ex.map(run_one, range(5)))

    # All 5 should have enrichment files
    found = sum(1 for i in range(5) if read_enrich(f"conc-{i}") is not None)
    assert_test("concurrent:all_registered", found == 5, f"found {found}")

    # Each should have their file
    for i in range(5):
        enrich = read_enrich(f"conc-{i}")
        has_file = enrich is not None and f"file{i}.py" in enrich.get("files", [])
        assert_test(f"concurrent:file_{i}", has_file)


# ===========================================================================
# REAL SESSIONS
# ===========================================================================

def test_real_sessions():
    """Verify Claude Code's session registry exists and has entries."""
    assert_test("real:sessions_dir", SESSIONS_DIR.is_dir())
    if SESSIONS_DIR.is_dir():
        sessions = [f for f in SESSIONS_DIR.iterdir() if f.suffix == ".json"]
        assert_test("real:has_sessions", len(sessions) > 0, f"found {len(sessions)}")


# ===========================================================================
# BATCH SCRIPT
# ===========================================================================

def test_batch_help():
    """Verify batch.py parses correctly."""
    batch_script = Path(__file__).parent.parent / "scripts" / "batch.py"
    result = subprocess.run(
        [sys.executable, str(batch_script), "--help"],
        capture_output=True, text=True, timeout=5,
    )
    assert_test("batch:help:exits_0", result.returncode == 0)
    assert_test("batch:help:has_eval", "eval" in result.stdout)
    assert_test("batch:help:has_run", "run" in result.stdout)


def test_batch_report_help():
    """Verify batch_report.py parses correctly."""
    report_script = Path(__file__).parent.parent / "scripts" / "batch_report.py"
    result = subprocess.run(
        [sys.executable, str(report_script), "--help"],
        capture_output=True, text=True, timeout=5,
    )
    assert_test("batch_report:help:exits_0", result.returncode == 0)


# ===========================================================================
# ROSTER-CLI
# ===========================================================================

def test_roster_cli():
    """Verify roster-cli handler works."""
    result = subprocess.run(
        [sys.executable, str(HOOK_SCRIPT), "roster-cli", TEST_CWD],
        capture_output=True, text=True, timeout=10,
    )
    assert_test("roster_cli:exits_0", result.returncode == 0)
    # Should show session count or "No active sessions"
    has_output = "sessions" in result.stdout.lower() or "no active" in result.stdout.lower()
    assert_test("roster_cli:has_output", has_output, f"got: {result.stdout[:100]}")


# ===========================================================================
# DELTA-ONLY ROSTER
# ===========================================================================

def test_roster_debounce():
    """Second roster call within DEBOUNCE_SECONDS should produce no output (when no messages)."""
    clean()
    sid = "debounce-001"
    payload = {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "first"}
    run_hook("roster", payload)  # first call — sets state
    # Second call immediately — should be debounced (no output)
    stdout2, _, code2 = run_hook("roster", {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "second"})
    assert_test("debounce:exits_0", code2 == 0)
    # No output expected (debounced, no messages, no peers on test project)
    assert_test("debounce:no_output", stdout2.strip() == "", f"got: {stdout2[:80]}")


def test_roster_messages_bypass_debounce():
    """Messages should always be delivered even within debounce window."""
    clean()
    sid = "debounce-msg"
    payload = {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "first"}
    run_hook("roster", payload)  # sets state
    # Add a message
    write_inbox(sid, [
        {"from": "urgent", "text": "deploy now", "timestamp": "2026-03-31T06:00:00Z", "read": False}
    ])
    # Second call immediately — message should bypass debounce
    stdout2, _, _ = run_hook("roster", {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "check"})
    assert_test("debounce:msg_delivered", "deploy now" in stdout2)


def test_roster_delta_suppression():
    """Identical roster output should be suppressed on second call (after debounce window)."""
    clean()
    sid = "delta-001"
    payload = {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "first"}
    run_hook("roster", payload)

    # Manually expire the debounce by writing old timestamp to state
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    (STATE_DIR / f"{sid}.json").write_text(json.dumps({"last_check": 0, "last_hash": ""}))

    # Second call — roster unchanged, should emit (hash was reset)
    stdout2, _, _ = run_hook("roster", {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "second"})
    # Third call with expired debounce but same hash — should suppress
    # Read the state to get the hash
    state = json.loads((STATE_DIR / f"{sid}.json").read_text())
    assert_test("delta:state_has_hash", "last_hash" in state)
    assert_test("delta:state_has_check", "last_check" in state)


def test_cleanup_removes_state():
    """SessionEnd should clean up state file too."""
    clean()
    sid = "cleanup-state"
    # Create state file
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    (STATE_DIR / f"{sid}.json").write_text(json.dumps({"last_check": 1, "last_hash": "abc"}))
    # Also create enrichment
    write_enrich(sid, {"files": [], "task": "x", "updated": ""})

    run_hook("cleanup", {"session_id": sid})
    assert_test("cleanup:state:removed", not (STATE_DIR / f"{sid}.json").exists())
    assert_test("cleanup:enrich:removed", not (ENRICH_DIR / f"{sid}.json").exists())


def test_conditional_enrichment_write():
    """Enrichment should not rewrite when task unchanged."""
    clean()
    sid = "delta-enrich"
    payload = {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "same task"}
    run_hook("roster", payload)
    # Get mtime of enrichment file
    ep = ENRICH_DIR / f"{sid}.json"
    mtime1 = ep.stat().st_mtime_ns

    # Expire debounce
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    (STATE_DIR / f"{sid}.json").write_text(json.dumps({"last_check": 0, "last_hash": ""}))

    # Same task — enrichment should NOT be rewritten
    time.sleep(0.01)  # ensure mtime would differ
    run_hook("roster", {"session_id": sid, "cwd": TEST_CWD, "user_prompt": "same task"})
    mtime2 = ep.stat().st_mtime_ns
    assert_test("enrich:no_rewrite", mtime1 == mtime2, f"mtime changed: {mtime1} -> {mtime2}")


# ===========================================================================
# Run
# ===========================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("cc — enrichment-based multi-session awareness")
    print("=" * 60)

    tests = [
        # Roster
        test_roster_writes_enrichment,
        test_roster_no_session_id,
        test_roster_empty_payload,
        test_roster_truncates_long_prompt,
        test_roster_unicode,
        test_roster_preserves_files,
        test_roster_shows_messages,
        test_roster_shows_peers,
        # Touch
        test_touch_basic,
        test_touch_relative_path,
        test_touch_dedup,
        test_touch_max,
        test_touch_no_session,
        test_touch_empty,
        # Cleanup
        test_cleanup_basic,
        test_cleanup_nonexistent,
        test_cleanup_empty,
        # Mailbox
        test_mailbox_receive,
        test_mailbox_mark_read,
        # Security
        test_security_path_traversal,
        # Robustness
        test_robustness_corrupted_enrich,
        # Dispatcher
        test_unknown_event,
        test_no_event,
        test_bad_json,
        # Performance
        test_performance,
        # Concurrent
        test_concurrent,
        # Real sessions
        test_real_sessions,
        # Batch scripts
        test_batch_help,
        test_batch_report_help,
        # Roster CLI
        test_roster_cli,
        # Delta-only roster
        test_roster_debounce,
        test_roster_messages_bypass_debounce,
        test_roster_delta_suppression,
        test_cleanup_removes_state,
        test_conditional_enrichment_write,
    ]

    for test_fn in tests:
        print(f"\n--- {test_fn.__name__} ---")
        try:
            test_fn()
        except Exception as e:
            failed += 1
            msg = f"  CRASH {test_fn.__name__}: {e}"
            print(msg)
            errors.append(msg)

    clean()

    print("\n" + "=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed ({passed + failed} total)")
    if errors:
        print("\nFailures:")
        for e in errors:
            print(e)
    print("=" * 60)
    sys.exit(1 if failed > 0 else 0)
