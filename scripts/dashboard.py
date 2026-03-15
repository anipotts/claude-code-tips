#!/usr/bin/env python3
"""
dashboard.py -- Live terminal dashboard for Claude Code sessions.

Watches ~/.claude/projects/ and shows real-time stats as you work in
Claude Code. Auto-detects the most recently active session and tails
the JSONL transcript for live updates.

Requirements:
    pip install textual

Usage:
    python3 scripts/dashboard.py
    python3 scripts/dashboard.py --refresh 5   # poll every 5s (default: 2s)

Tested with Claude Code v2.1.74
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from textual import work
from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.reactive import reactive
from textual.widgets import Footer, Header, Static

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CLAUDE_DIR = pathlib.Path.home() / ".claude"
PROJECTS_DIR = CLAUDE_DIR / "projects"

TOOL_NAMES = ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "Agent"]

SPARKLINE_CHARS = " ▁▂▃▄▅▆▇█"

# human-equivalent time saved per tool call (minutes)
TIME_SAVED: dict[str, float] = {
    "Write": 5.0,
    "Edit": 5.0,
    "Bash": 2.0,
    "Agent": 15.0,
    "Task": 15.0,
}
DEFAULT_TIME_SAVED = 1.0  # Read, Grep, Glob, etc.


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class ToolCall:
    """A single tool invocation extracted from a JSONL line."""

    name: str
    timestamp: float  # epoch seconds
    file_path: str | None = None  # for Write/Edit


@dataclass
class SessionData:
    """Parsed data for a single Claude Code session."""

    session_id: str = ""
    file_path: str = ""
    project_name: str = ""
    start_time: float = 0.0
    last_activity: float = 0.0
    tool_calls: list[ToolCall] = field(default_factory=list)
    lines_read: int = 0

    @property
    def duration_seconds(self) -> float:
        if self.start_time <= 0:
            return 0.0
        end = self.last_activity if self.last_activity > 0 else time.time()
        return max(0, end - self.start_time)

    @property
    def tool_breakdown(self) -> dict[str, int]:
        counts: dict[str, int] = defaultdict(int)
        for tc in self.tool_calls:
            counts[tc.name] += 1
        return dict(counts)

    @property
    def files_mutated(self) -> list[str]:
        seen: dict[str, None] = {}
        for tc in self.tool_calls:
            if tc.name in ("Write", "Edit") and tc.file_path:
                seen[tc.file_path] = None
        return list(seen.keys())

    def tools_per_minute(self, window_seconds: int = 300) -> float:
        """Rolling tool calls per minute over the given window."""
        if not self.tool_calls:
            return 0.0
        now = time.time()
        cutoff = now - window_seconds
        recent = [tc for tc in self.tool_calls if tc.timestamp >= cutoff]
        elapsed = min(window_seconds, now - self.start_time)
        if elapsed <= 0:
            return 0.0
        return len(recent) / (elapsed / 60.0)

    def sparkline_data(self, bucket_seconds: int = 30, max_buckets: int = 40) -> list[int]:
        """Tool calls per bucket for sparkline rendering."""
        if not self.tool_calls:
            return []
        now = time.time()
        buckets: list[int] = [0] * max_buckets
        for tc in self.tool_calls:
            age = now - tc.timestamp
            idx = max_buckets - 1 - int(age / bucket_seconds)
            if 0 <= idx < max_buckets:
                buckets[idx] += 1
        # trim leading zeros
        first_nonzero = next((i for i, v in enumerate(buckets) if v > 0), len(buckets))
        return buckets[first_nonzero:]

    def human_equivalent_minutes(self) -> float:
        total = 0.0
        for tc in self.tool_calls:
            total += TIME_SAVED.get(tc.name, DEFAULT_TIME_SAVED)
        return total


# ---------------------------------------------------------------------------
# JSONL parsing
# ---------------------------------------------------------------------------

def parse_iso(ts: str | None) -> float:
    """Parse ISO 8601 timestamp to epoch seconds. Returns 0 on failure."""
    if not ts:
        return 0.0
    try:
        clean = ts.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        return dt.timestamp()
    except Exception:
        return 0.0


def parse_jsonl_lines(
    file_path: str, start_line: int = 0
) -> tuple[list[ToolCall], str, str, float, float, int]:
    """
    Parse a JSONL transcript file starting from a given line.

    Returns:
        (tool_calls, session_id, project_name, first_ts, last_ts, lines_read)
    """
    tool_calls: list[ToolCall] = []
    session_id = ""
    project_name = ""
    first_ts = 0.0
    last_ts = 0.0
    lines_read = 0

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            for i, raw_line in enumerate(f):
                if i < start_line:
                    continue
                lines_read = i + 1
                raw_line = raw_line.strip()
                if not raw_line:
                    continue

                try:
                    record = json.loads(raw_line)
                except json.JSONDecodeError:
                    continue

                if not isinstance(record, dict):
                    continue

                # extract session metadata
                if not session_id:
                    session_id = record.get("sessionId", "")
                if not project_name:
                    cwd = record.get("cwd", "")
                    if cwd:
                        project_name = pathlib.Path(cwd).name

                ts_str = record.get("timestamp")
                ts_epoch = parse_iso(ts_str)
                if ts_epoch > 0:
                    if first_ts <= 0:
                        first_ts = ts_epoch
                    last_ts = ts_epoch

                rtype = record.get("type")
                if rtype != "assistant":
                    continue

                message = record.get("message", {})
                if not isinstance(message, dict):
                    continue

                content = message.get("content")
                if not isinstance(content, list):
                    continue

                for block in content:
                    if not isinstance(block, dict):
                        continue
                    if block.get("type") != "tool_use":
                        continue

                    tool_name = block.get("name", "unknown")
                    tool_input = block.get("input", {})
                    file_path_val = None
                    if tool_name in ("Write", "Edit"):
                        file_path_val = tool_input.get(
                            "file_path", tool_input.get("path")
                        )

                    tool_calls.append(
                        ToolCall(
                            name=tool_name,
                            timestamp=ts_epoch if ts_epoch > 0 else time.time(),
                            file_path=file_path_val,
                        )
                    )
    except (OSError, IOError):
        pass

    return tool_calls, session_id, project_name, first_ts, last_ts, lines_read


def find_recent_sessions(limit: int = 5) -> list[pathlib.Path]:
    """Find the most recently modified JSONL files (non-subagent)."""
    if not PROJECTS_DIR.exists():
        return []

    jsonl_files: list[tuple[float, pathlib.Path]] = []
    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue
        for item in project_dir.iterdir():
            if item.suffix == ".jsonl" and item.is_file():
                try:
                    mtime = item.stat().st_mtime
                    jsonl_files.append((mtime, item))
                except OSError:
                    continue

    jsonl_files.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in jsonl_files[:limit]]


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def format_duration(seconds: float) -> str:
    """Format seconds as HH:MM:SS or MM:SS."""
    seconds = max(0, int(seconds))
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def format_time(epoch: float) -> str:
    """Format epoch as local time string."""
    if epoch <= 0:
        return "---"
    dt = datetime.fromtimestamp(epoch)
    return dt.strftime("%-I:%M %p")


def format_date_time(epoch: float) -> str:
    """Format epoch as date + time."""
    if epoch <= 0:
        return "---"
    dt = datetime.fromtimestamp(epoch)
    return dt.strftime("%m/%d %-I:%M %p")


def make_sparkline(data: list[int]) -> str:
    """Render a text sparkline from integer data."""
    if not data:
        return ""
    max_val = max(data) if data else 1
    if max_val == 0:
        return SPARKLINE_CHARS[0] * len(data)
    result = []
    for v in data:
        idx = int(v / max_val * (len(SPARKLINE_CHARS) - 1))
        result.append(SPARKLINE_CHARS[idx])
    return "".join(result)


def make_bar(count: int, max_count: int, width: int = 12) -> str:
    """Render a horizontal bar."""
    if max_count <= 0:
        return ""
    filled = int(count / max_count * width)
    return "\u2588" * filled


def shorten_path(path: str, max_len: int = 40) -> str:
    """Shorten a file path for display."""
    if len(path) <= max_len:
        return path
    parts = pathlib.Path(path).parts
    if len(parts) <= 2:
        return path[-max_len:]
    return ".../" + "/".join(parts[-2:])


# ---------------------------------------------------------------------------
# Textual widgets
# ---------------------------------------------------------------------------

class LiveIndicator(Static):
    """Pulsing live/idle indicator."""

    is_live: reactive[bool] = reactive(False)

    def render(self) -> str:
        if self.is_live:
            return "[bold green]● LIVE[/bold green]"
        return "[dim]○ IDLE[/dim]"


class SessionPanel(Static):
    """Current session info panel."""

    session: reactive[SessionData | None] = reactive(None)

    def render(self) -> str:
        s = self.session
        if s is None:
            return "[dim]No active session detected.[/dim]\n[dim]Start Claude Code to see live stats.[/dim]"

        sid = s.session_id[:12] + "..." if len(s.session_id) > 12 else s.session_id
        started = format_time(s.start_time)
        duration = format_duration(s.duration_seconds)
        project = s.project_name or "unknown"

        return (
            f"[bold]Session:[/bold] {sid}  "
            f"[bold]Project:[/bold] {project}  "
            f"[bold]Started:[/bold] [cyan]{started}[/cyan]  "
            f"[bold]Duration:[/bold] [cyan]{duration}[/cyan]"
        )


class ThroughputPanel(Static):
    """Tools/min with sparkline."""

    session: reactive[SessionData | None] = reactive(None)

    def render(self) -> str:
        s = self.session
        if s is None:
            return "[dim]Tools/min: ---[/dim]"

        tpm = s.tools_per_minute()
        spark_data = s.sparkline_data()
        sparkline = make_sparkline(spark_data)

        return (
            f"[bold]Tools/min:[/bold] [cyan]{tpm:.1f}[/cyan]    "
            f"[green]{sparkline}[/green]"
        )


class ToolBreakdownPanel(Static):
    """Tool usage breakdown with bars."""

    session: reactive[SessionData | None] = reactive(None)

    def render(self) -> str:
        s = self.session
        if s is None:
            return "[dim]No tool data.[/dim]"

        breakdown = s.tool_breakdown
        if not breakdown:
            return "[dim]No tool calls yet.[/dim]"

        total = sum(breakdown.values())
        max_count = max(breakdown.values()) if breakdown else 1

        lines = [f"[bold]Tool Breakdown[/bold]  (total: {total})"]
        # show known tools first, then others
        for name in TOOL_NAMES:
            count = breakdown.get(name, 0)
            if count > 0:
                bar = make_bar(count, max_count)
                lines.append(f"  {name:<7} {count:>4}  [green]{bar}[/green]")

        # other tools
        other_count = sum(
            c for n, c in breakdown.items() if n not in TOOL_NAMES
        )
        if other_count > 0:
            bar = make_bar(other_count, max_count)
            lines.append(f"  {'other':<7} {other_count:>4}  [yellow]{bar}[/yellow]")

        return "\n".join(lines)


class FilesMutatedPanel(Static):
    """Files changed this session."""

    session: reactive[SessionData | None] = reactive(None)

    def render(self) -> str:
        s = self.session
        if s is None:
            return "[dim]No file data.[/dim]"

        files = s.files_mutated
        count = len(files)
        lines = [f"[bold]Files Mutated[/bold]  ({count})"]

        if not files:
            lines.append("  [dim]none yet[/dim]")
        else:
            # show last 5 (most recently mutated)
            display = files[-5:]
            for fp in reversed(display):
                lines.append(f"  {shorten_path(fp)}")
            if count > 5:
                lines.append(f"  [dim]...{count - 5} more[/dim]")

        return "\n".join(lines)


class TimeSavedPanel(Static):
    """CC time vs human equivalent."""

    session: reactive[SessionData | None] = reactive(None)

    def render(self) -> str:
        s = self.session
        if s is None:
            return "[dim]---[/dim]"

        cc_minutes = s.duration_seconds / 60.0
        human_minutes = s.human_equivalent_minutes()
        human_hours = human_minutes / 60.0

        if cc_minutes < 1:
            cc_str = f"{int(s.duration_seconds)}s"
        else:
            cc_str = f"{cc_minutes:.0f} min"

        if human_hours >= 1:
            human_str = f"~{human_hours:.1f} hrs"
        else:
            human_str = f"~{human_minutes:.0f} min"

        multiplier = human_minutes / cc_minutes if cc_minutes > 0 else 0

        return (
            f"  CC Time: [cyan]{cc_str}[/cyan]  |  "
            f"  Human equiv: [bold yellow]{human_str}[/bold yellow]  |  "
            f"  Multiplier: [bold green]{multiplier:.1f}x[/bold green]"
        )


class SessionHistoryPanel(Static):
    """Recent sessions list."""

    history: reactive[list[SessionData]] = reactive(list, always_update=True)

    def render(self) -> str:
        lines = ["[bold]Recent Sessions[/bold]"]

        if not self.history:
            lines.append("  [dim]No session history found.[/dim]")
            return "\n".join(lines)

        for s in self.history[:5]:
            date_str = format_date_time(s.start_time)
            dur = format_duration(s.duration_seconds)
            tools = len(s.tool_calls)
            files = len(s.files_mutated)
            project = s.project_name or "?"
            lines.append(
                f"  {date_str}  {dur:>8}  "
                f"{tools:>4} tools  {files:>3} files  "
                f"[dim]{project}[/dim]"
            )

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main app
# ---------------------------------------------------------------------------

DASH_CSS = """
Screen {
    background: $surface;
}

#title-bar {
    dock: top;
    height: 1;
    background: $primary;
    color: $text;
    content-align: center middle;
}

#live-indicator {
    dock: right;
    width: 12;
    content-align: right middle;
}

#session-panel {
    height: 3;
    padding: 0 1;
    border-bottom: solid $primary-lighten-2;
}

#throughput-panel {
    height: 3;
    padding: 0 1;
    border-bottom: solid $primary-lighten-2;
}

#middle-row {
    height: auto;
    max-height: 14;
    padding: 0 1;
    border-bottom: solid $primary-lighten-2;
}

#tool-breakdown {
    width: 1fr;
}

#files-mutated {
    width: 1fr;
}

#time-saved-panel {
    height: 3;
    padding: 0 1;
    border-bottom: solid $primary-lighten-2;
}

#history-panel {
    height: auto;
    min-height: 5;
    padding: 0 1;
}
"""


class DashboardApp(App):
    """Live Claude Code session dashboard."""

    CSS = DASH_CSS
    TITLE = "CLAUDE CODE DASHBOARD"
    BINDINGS = [("q", "quit", "Quit"), ("r", "force_refresh", "Refresh")]

    current_session: SessionData | None = None
    session_history: list[SessionData] = []
    _refresh_interval: float = 2.0

    def __init__(self, refresh_interval: float = 2.0) -> None:
        super().__init__()
        self._refresh_interval = refresh_interval

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            with Horizontal(id="title-bar"):
                yield Static(
                    "[bold]CLAUDE CODE DASHBOARD[/bold]", id="title-text"
                )
                yield LiveIndicator(id="live-indicator")
            yield SessionPanel(id="session-panel")
            yield ThroughputPanel(id="throughput-panel")
            with Horizontal(id="middle-row"):
                yield ToolBreakdownPanel(id="tool-breakdown")
                yield FilesMutatedPanel(id="files-mutated")
            yield TimeSavedPanel(id="time-saved-panel")
            yield SessionHistoryPanel(id="history-panel")
        yield Footer()

    def on_mount(self) -> None:
        self.poll_sessions()
        self.set_interval(self._refresh_interval, self.poll_sessions)
        # tick the duration counter every second
        self.set_interval(1.0, self.tick_display)

    def tick_display(self) -> None:
        """Update time-dependent displays every second."""
        if self.current_session is not None:
            self.query_one("#session-panel", SessionPanel).session = self.current_session
            self.query_one("#time-saved-panel", TimeSavedPanel).session = self.current_session

    @work(thread=True, exclusive=True, group="poll")
    def poll_sessions(self) -> None:
        """Poll for session changes in a background thread."""
        recent_files = find_recent_sessions(limit=10)
        if not recent_files:
            self.app.call_from_thread(self._update_ui, None, [])
            return

        # the most recently modified file is the candidate active session
        active_path = recent_files[0]

        # check if we're already tracking this file
        if (
            self.current_session is not None
            and self.current_session.file_path == str(active_path)
        ):
            # incremental parse from where we left off
            new_tools, _, _, _, last_ts, lines_read = parse_jsonl_lines(
                str(active_path), start_line=self.current_session.lines_read
            )
            if new_tools:
                self.current_session.tool_calls.extend(new_tools)
            if last_ts > 0:
                self.current_session.last_activity = last_ts
            self.current_session.lines_read = lines_read
        else:
            # parse the full file
            tool_calls, sid, project, first_ts, last_ts, lines_read = (
                parse_jsonl_lines(str(active_path))
            )
            self.current_session = SessionData(
                session_id=sid,
                file_path=str(active_path),
                project_name=project,
                start_time=first_ts,
                last_activity=last_ts,
                tool_calls=tool_calls,
                lines_read=lines_read,
            )

        # parse history (skip the active one)
        history: list[SessionData] = []
        for fp in recent_files[1:6]:
            tool_calls, sid, project, first_ts, last_ts, lines_read = (
                parse_jsonl_lines(str(fp))
            )
            if sid:
                history.append(
                    SessionData(
                        session_id=sid,
                        file_path=str(fp),
                        project_name=project,
                        start_time=first_ts,
                        last_activity=last_ts,
                        tool_calls=tool_calls,
                        lines_read=lines_read,
                    )
                )

        self.app.call_from_thread(self._update_ui, self.current_session, history)

    def _update_ui(
        self,
        session: SessionData | None,
        history: list[SessionData],
    ) -> None:
        """Update all widgets from the main thread."""
        self.session_history = history

        # live indicator: active if file modified in last 30s
        is_live = False
        if session is not None:
            try:
                mtime = pathlib.Path(session.file_path).stat().st_mtime
                is_live = (time.time() - mtime) < 30
            except OSError:
                pass

        self.query_one("#live-indicator", LiveIndicator).is_live = is_live
        self.query_one("#session-panel", SessionPanel).session = session
        self.query_one("#throughput-panel", ThroughputPanel).session = session
        self.query_one("#tool-breakdown", ToolBreakdownPanel).session = session
        self.query_one("#files-mutated", FilesMutatedPanel).session = session
        self.query_one("#time-saved-panel", TimeSavedPanel).session = session
        self.query_one("#history-panel", SessionHistoryPanel).history = history

    def action_force_refresh(self) -> None:
        """Force a refresh."""
        self.current_session = None
        self.poll_sessions()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Live terminal dashboard for Claude Code sessions."
    )
    parser.add_argument(
        "--refresh",
        type=float,
        default=2.0,
        help="Poll interval in seconds (default: 2)",
    )
    args = parser.parse_args()

    app = DashboardApp(refresh_interval=args.refresh)
    app.run()


if __name__ == "__main__":
    main()
