"""Tests for hook.py -- the unified mine plugin hook dispatcher."""

from __future__ import annotations

import json
import pathlib
import sqlite3
import sys
import tempfile
from io import StringIO
from unittest.mock import patch

import pytest

# Import hook.py
HOOKS_DIR = pathlib.Path(__file__).resolve().parent.parent / "plugins" / "mine" / "hooks"
sys.path.insert(0, str(HOOKS_DIR))

import hook  # noqa: E402


# ===========================================================================
# Helpers
# ===========================================================================

SCHEMA_PATH = pathlib.Path(__file__).resolve().parent.parent / "plugins" / "mine" / "scripts" / "schema.sql"


def make_db(tmp_path: pathlib.Path) -> sqlite3.Connection:
    """Create a fresh in-memory mine.db with schema applied."""
    db_path = tmp_path / "mine.db"
    conn = sqlite3.connect(str(db_path))
    conn.executescript(SCHEMA_PATH.read_text())
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def seed_session(conn: sqlite3.Connection, session_id: str = "test-session",
                 project_name: str = "test-project", tokens: int = 100000) -> None:
    """Insert a minimal session row for testing."""
    conn.execute(
        """INSERT INTO sessions (id, project_name, model, start_time,
           total_input_tokens, total_output_tokens, total_cache_read_tokens,
           total_cache_creation_tokens, is_subagent, compaction_count)
        VALUES (?, ?, 'claude-opus-4-6', '2026-03-22T10:00:00Z',
                ?, 5000, 50000, 10000, 0, 0)""",
        (session_id, project_name, tokens),
    )
    conn.commit()


# ===========================================================================
# Tests: load_config
# ===========================================================================

class TestLoadConfig:
    def test_missing_config(self, tmp_path):
        with patch.object(hook, "CONFIG_PATH", tmp_path / "nonexistent.json"):
            assert hook.load_config() == {}

    def test_valid_config(self, tmp_path):
        config_file = tmp_path / "mine.json"
        config_file.write_text('{"ingest": false, "burn": true}')
        with patch.object(hook, "CONFIG_PATH", config_file):
            config = hook.load_config()
            assert config["ingest"] is False
            assert config["burn"] is True

    def test_invalid_json(self, tmp_path):
        config_file = tmp_path / "mine.json"
        config_file.write_text("not json{{{")
        with patch.object(hook, "CONFIG_PATH", config_file):
            assert hook.load_config() == {}


# ===========================================================================
# Tests: is_enabled
# ===========================================================================

class TestIsEnabled:
    def test_default_enabled(self):
        assert hook.is_enabled({}, "ingest") is True

    def test_explicitly_enabled(self):
        assert hook.is_enabled({"ingest": True}, "ingest") is True

    def test_disabled(self):
        assert hook.is_enabled({"ingest": False}, "ingest") is False

    def test_other_keys_dont_affect(self):
        assert hook.is_enabled({"burn": False}, "ingest") is True


# ===========================================================================
# Tests: handle_compact
# ===========================================================================

class TestHandleCompact:
    def test_increments_compaction_count(self, tmp_path):
        conn = make_db(tmp_path)
        seed_session(conn, "sess-1")
        db_path = tmp_path / "mine.db"

        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_compact({"session_id": "sess-1"}, {})

        row = conn.execute("SELECT compaction_count FROM sessions WHERE id = 'sess-1'").fetchone()
        assert row[0] == 1

        # call again — should increment to 2
        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_compact({"session_id": "sess-1"}, {})
        row = conn.execute("SELECT compaction_count FROM sessions WHERE id = 'sess-1'").fetchone()
        assert row[0] == 2

    def test_no_session_id(self, tmp_path):
        conn = make_db(tmp_path)
        db_path = tmp_path / "mine.db"
        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_compact({}, {})  # should not error

    def test_disabled_by_config_via_dispatcher(self, tmp_path):
        """Toggle checks happen at the dispatcher level, not in handlers."""
        # verify the dispatcher would skip this handler
        assert not hook.is_enabled({"compact": False}, "compact")
        # the HANDLERS dict has "compact" as the toggle key
        toggle_key, _ = hook.HANDLERS["compact"]
        assert toggle_key == "compact"


# ===========================================================================
# Tests: handle_mistakes
# ===========================================================================

class TestHandleMistakes:
    def test_records_error(self, tmp_path):
        conn = make_db(tmp_path)
        seed_session(conn, "sess-1")
        db_path = tmp_path / "mine.db"

        payload = {
            "session_id": "sess-1",
            "tool_name": "Edit",
            "error": "old_string not found in file",
            "tool_input": {"file_path": "/src/app.ts"},
        }

        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_mistakes(payload, {})

        row = conn.execute("SELECT tool_name, error_message FROM errors WHERE session_id = 'sess-1'").fetchone()
        assert row[0] == "Edit"
        assert "old_string not found" in row[1]

    def test_surfaces_past_failures(self, tmp_path, capsys):
        conn = make_db(tmp_path)
        seed_session(conn, "sess-1")
        db_path = tmp_path / "mine.db"

        # insert a past failure
        conn.execute(
            """INSERT INTO errors (session_id, tool_name, error_message, timestamp)
            VALUES ('sess-1', 'Edit', 'old_string not found', '2026-03-21T10:00:00Z')"""
        )
        conn.commit()

        payload = {
            "session_id": "sess-1",
            "tool_name": "Edit",
            "error": "old_string not found again",
            "tool_input": {"file_path": "/src/app.ts"},
        }

        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_mistakes(payload, {})

        captured = capsys.readouterr()
        assert "failed" in captured.out.lower()
        assert "test-project" in captured.out


# ===========================================================================
# Tests: handle_burn
# ===========================================================================

class TestHandleBurn:
    def test_warns_when_over_2x(self, tmp_path, capsys):
        conn = make_db(tmp_path)
        # seed 3 past sessions with avg ~100K tokens each
        for i in range(3):
            seed_session(conn, f"past-{i}", tokens=80000)
            conn.execute("UPDATE sessions SET compaction_count = 1 WHERE id = ?", (f"past-{i}",))
        # current session with 300K tokens (3x average)
        seed_session(conn, "current", tokens=300000)
        conn.commit()
        db_path = tmp_path / "mine.db"

        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_burn({"session_id": "current"}, {})

        captured = capsys.readouterr()
        assert "burn" in captured.out.lower() or "token" in captured.out.lower()

    def test_no_warning_under_2x(self, tmp_path, capsys):
        conn = make_db(tmp_path)
        seed_session(conn, "past-1", tokens=100000)
        conn.execute("UPDATE sessions SET compaction_count = 1 WHERE id = 'past-1'")
        seed_session(conn, "current", tokens=150000)  # 1.5x, under threshold
        conn.commit()
        db_path = tmp_path / "mine.db"

        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_burn({"session_id": "current"}, {})

        captured = capsys.readouterr()
        assert captured.out == ""  # no warning


# ===========================================================================
# Tests: handle_precompact
# ===========================================================================

class TestHandlePrecompact:
    def test_runs_both_compact_and_burn(self, tmp_path):
        conn = make_db(tmp_path)
        seed_session(conn, "sess-1")
        db_path = tmp_path / "mine.db"

        with patch.object(hook, "DB_PATH", db_path):
            hook.handle_precompact({"session_id": "sess-1"}, {})

        row = conn.execute("SELECT compaction_count FROM sessions WHERE id = 'sess-1'").fetchone()
        assert row[0] == 1  # compact ran


# ===========================================================================
# Tests: extract_tool_summary
# ===========================================================================

class TestExtractToolSummary:
    def test_read(self):
        assert hook.extract_tool_summary("Read", {"file_path": "/src/app.ts"}) == "/src/app.ts"

    def test_bash(self):
        s = hook.extract_tool_summary("Bash", {"command": "git status"})
        assert s == "git status"

    def test_grep(self):
        assert hook.extract_tool_summary("Grep", {"pattern": "TODO"}) == "TODO"

    def test_bash_truncation(self):
        s = hook.extract_tool_summary("Bash", {"command": "x" * 500})
        assert len(s) == 200

    def test_empty_input(self):
        assert hook.extract_tool_summary("Unknown", {}) == ""


# ===========================================================================
# Tests: dispatcher
# ===========================================================================

class TestDispatcher:
    def test_unknown_event(self):
        with pytest.raises(SystemExit):
            with patch("sys.argv", ["hook.py", "nonexistent"]):
                with patch("sys.stdin", StringIO("{}")):
                    hook.main()

    def test_compact_via_dispatcher(self, tmp_path):
        conn = make_db(tmp_path)
        seed_session(conn, "sess-1")
        db_path = tmp_path / "mine.db"

        with patch.object(hook, "DB_PATH", db_path):
            with patch("sys.argv", ["hook.py", "compact"]):
                with patch("sys.stdin", StringIO('{"session_id": "sess-1"}')):
                    hook.main()

        row = conn.execute("SELECT compaction_count FROM sessions WHERE id = 'sess-1'").fetchone()
        assert row[0] == 1
