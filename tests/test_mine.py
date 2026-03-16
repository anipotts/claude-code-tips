"""Tests for mine.py -- the Claude Code session parser."""

from __future__ import annotations

import json
import pathlib
import sqlite3
import tempfile
import textwrap

import pytest

# ---------------------------------------------------------------------------
# Import mine.py functions under test
# ---------------------------------------------------------------------------

import sys

SCRIPTS_DIR = pathlib.Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

import mine  # noqa: E402

FIXTURES = pathlib.Path(__file__).resolve().parent / "fixtures"


# ===========================================================================
# Helpers
# ===========================================================================


def parse(fixture_name: str, is_subagent: bool = False) -> dict:
    """Shorthand to parse a fixture file."""
    return mine.parse_jsonl_file((str(FIXTURES / fixture_name), is_subagent))


def make_db(tmp_path: pathlib.Path) -> sqlite3.Connection:
    """Create a fresh in-memory-style DB at tmp_path using the real schema."""
    db_path = tmp_path / "test.db"
    # Temporarily override SCHEMA_PATH to use the real schema.sql
    original = mine.SCHEMA_PATH
    mine.SCHEMA_PATH = SCRIPTS_DIR / "schema.sql"
    try:
        conn = mine.init_db(db_path)
    finally:
        mine.SCHEMA_PATH = original
    return conn


# ===========================================================================
# extract_tool_summary
# ===========================================================================


class TestExtractToolSummary:
    def test_read_file_path(self):
        assert mine.extract_tool_summary("Read", {"file_path": "/a/b.py"}) == "/a/b.py"

    def test_write_file_path(self):
        assert mine.extract_tool_summary("Write", {"file_path": "/x.txt"}) == "/x.txt"

    def test_edit_file_path(self):
        assert mine.extract_tool_summary("Edit", {"file_path": "/e.rs"}) == "/e.rs"

    def test_bash_command(self):
        assert mine.extract_tool_summary("Bash", {"command": "ls -la"}) == "ls -la"

    def test_bash_description_fallback(self):
        assert mine.extract_tool_summary("Bash", {"description": "list files"}) == "list files"

    def test_glob_pattern(self):
        assert mine.extract_tool_summary("Glob", {"pattern": "**/*.py"}) == "**/*.py"

    def test_grep_pattern_and_path(self):
        result = mine.extract_tool_summary("Grep", {"pattern": "TODO", "path": "src/"})
        assert result == "TODO in src/"

    def test_grep_pattern_only(self):
        assert mine.extract_tool_summary("Grep", {"pattern": "TODO"}) == "TODO"

    def test_task_description(self):
        assert mine.extract_tool_summary("Task", {"description": "run tests"}) == "run tests"

    def test_unknown_tool_json_fallback(self):
        result = mine.extract_tool_summary("CustomTool", {"key": "value"})
        assert '"key"' in result
        assert '"value"' in result

    def test_non_dict_input(self):
        result = mine.extract_tool_summary("Read", "just a string")
        assert result == "just a string"

    def test_truncation_at_300(self):
        long_cmd = "x" * 500
        result = mine.extract_tool_summary("Bash", {"command": long_cmd})
        # command is returned as-is (no truncation for command field)
        assert result == long_cmd

    def test_fallback_truncation(self):
        long_val = "y" * 500
        result = mine.extract_tool_summary("Unknown", {"data": long_val})
        assert len(result) <= 300


# ===========================================================================
# extract_content_preview
# ===========================================================================


class TestExtractContentPreview:
    def test_none_returns_none(self):
        assert mine.extract_content_preview(None, 100) is None

    def test_string_truncation(self):
        assert mine.extract_content_preview("hello world", 5) == "hello"

    def test_string_under_limit(self):
        assert mine.extract_content_preview("hi", 100) == "hi"

    def test_list_with_text_blocks(self):
        content = [{"type": "text", "text": "hello"}, {"type": "text", "text": "world"}]
        result = mine.extract_content_preview(content, 100)
        assert "hello" in result
        assert "world" in result

    def test_list_with_thinking_block(self):
        content = [{"type": "thinking", "thinking": "deep thoughts"}, {"type": "text", "text": "answer"}]
        result = mine.extract_content_preview(content, 200)
        assert "[thinking]" in result
        assert "answer" in result

    def test_list_with_tool_use_block(self):
        content = [{"type": "tool_use", "name": "Read", "id": "t1", "input": {}}]
        result = mine.extract_content_preview(content, 200)
        assert "[tool_use: Read]" in result

    def test_list_with_tool_result_block(self):
        content = [{"type": "tool_result", "content": [{"type": "text", "text": "file contents"}]}]
        result = mine.extract_content_preview(content, 200)
        assert "file contents" in result

    def test_list_with_tool_result_string_content(self):
        content = [{"type": "tool_result", "content": "simple result"}]
        result = mine.extract_content_preview(content, 200)
        assert "simple result" in result

    def test_list_with_string_blocks(self):
        content = ["hello", "world"]
        result = mine.extract_content_preview(content, 100)
        assert "hello" in result

    def test_non_standard_type(self):
        result = mine.extract_content_preview(12345, 100)
        assert result == "12345"

    def test_limit_respected(self):
        content = [{"type": "text", "text": "a" * 200}]
        result = mine.extract_content_preview(content, 50)
        assert len(result) <= 50


# ===========================================================================
# sanitize_string
# ===========================================================================


class TestSanitizeString:
    def test_none_returns_none(self):
        assert mine.sanitize_string(None) is None

    def test_no_secrets_unchanged(self):
        assert mine.sanitize_string("hello world") == "hello world"

    def test_redacts_sk_key(self):
        result = mine.sanitize_string("key is sk-abcdefghijklmnopqrstuvwxyz")
        assert "sk-" not in result
        assert "[REDACTED]" in result

    def test_redacts_github_token(self):
        result = mine.sanitize_string("token ghp_abcdefghijklmnopqrstuvwxyz0123456789")
        assert "ghp_" not in result
        assert "[REDACTED]" in result

    def test_redacts_aws_key(self):
        result = mine.sanitize_string("aws AKIAIOSFODNN7EXAMPLE")
        assert "AKIA" not in result
        assert "[REDACTED]" in result

    def test_redacts_password_param(self):
        result = mine.sanitize_string("url?password=mysecret&foo=bar")
        assert "mysecret" not in result
        assert "[REDACTED]" in result

    def test_redacts_token_param(self):
        result = mine.sanitize_string("api?token=abc123xyz")
        assert "abc123xyz" not in result

    def test_redacts_secret_param(self):
        result = mine.sanitize_string("config secret=topsecret123")
        assert "topsecret123" not in result

    def test_multiple_secrets(self):
        text = "sk-longkeyhere12345678901234 and ghp_anotherlongkey1234567890123456789012"
        result = mine.sanitize_string(text)
        assert result.count("[REDACTED]") >= 2


# ===========================================================================
# sanitize_result
# ===========================================================================


class TestSanitizeResult:
    def test_sanitizes_first_user_prompt(self):
        result = {
            "first_user_prompt": "deploy with token=secret123",
            "cwd": "/safe/path",
            "project_dir": "/safe/dir",
            "messages": [],
            "tool_calls": [],
            "errors": [],
        }
        sanitized = mine.sanitize_result(result)
        assert "secret123" not in sanitized["first_user_prompt"]

    def test_sanitizes_messages(self):
        result = {
            "first_user_prompt": "hello",
            "cwd": "/path",
            "project_dir": "/dir",
            "messages": [{"content_preview": "key sk-abcdefghijklmnopqrstuvwxyz"}],
            "tool_calls": [],
            "errors": [],
        }
        sanitized = mine.sanitize_result(result)
        assert "sk-" not in sanitized["messages"][0]["content_preview"]

    def test_sanitizes_tool_calls(self):
        result = {
            "first_user_prompt": None,
            "cwd": None,
            "project_dir": None,
            "messages": [],
            "tool_calls": [{"input_summary": "password=hunter2"}],
            "errors": [],
        }
        sanitized = mine.sanitize_result(result)
        assert "hunter2" not in sanitized["tool_calls"][0]["input_summary"]

    def test_sanitizes_errors(self):
        result = {
            "first_user_prompt": None,
            "cwd": None,
            "project_dir": None,
            "messages": [],
            "tool_calls": [],
            "errors": [
                {"error_message": "token=leaked123", "input_summary": "secret=oops"},
            ],
        }
        sanitized = mine.sanitize_result(result)
        assert "leaked123" not in sanitized["errors"][0]["error_message"]
        assert "oops" not in sanitized["errors"][0]["input_summary"]


# ===========================================================================
# parse_iso
# ===========================================================================


class TestParseIso:
    def test_valid_z_suffix(self):
        result = mine.parse_iso("2025-03-01T10:00:00Z")
        assert result is not None
        assert isinstance(result, float)

    def test_valid_offset(self):
        result = mine.parse_iso("2025-03-01T10:00:00+00:00")
        assert result is not None

    def test_none_returns_none(self):
        assert mine.parse_iso(None) is None

    def test_empty_returns_none(self):
        assert mine.parse_iso("") is None

    def test_garbage_returns_none(self):
        assert mine.parse_iso("not a date") is None

    def test_z_and_offset_equivalent(self):
        a = mine.parse_iso("2025-03-01T10:00:00Z")
        b = mine.parse_iso("2025-03-01T10:00:00+00:00")
        assert a == b


# ===========================================================================
# parse_jsonl_file -- normal session
# ===========================================================================


class TestParseNormalSession:
    @pytest.fixture
    def result(self):
        return parse("normal_session.jsonl")

    def test_session_id(self, result):
        assert result["session_id"] == "sess-abc123"

    def test_project_name(self, result):
        assert result["project_name"] == "myproject"

    def test_cwd(self, result):
        assert result["cwd"] == "/Users/test/myproject"

    def test_model(self, result):
        assert "sonnet" in result["model"]

    def test_version(self, result):
        assert result["version"] == "1.0.6"

    def test_permission_mode(self, result):
        assert result["permission_mode"] == "default"

    def test_git_branch(self, result):
        assert result["git_branch"] == "main"

    def test_slug(self, result):
        assert result["slug"] == "test-session"

    def test_not_subagent(self, result):
        assert result["is_subagent"] is False

    def test_message_count(self, result):
        # 3 user + 3 assistant = 6
        # but tool_result user messages are included
        assert len(result["messages"]) == 6

    def test_user_messages(self, result):
        user_msgs = [m for m in result["messages"] if m["type"] == "user"]
        assert len(user_msgs) == 3

    def test_assistant_messages(self, result):
        asst_msgs = [m for m in result["messages"] if m["type"] == "assistant"]
        assert len(asst_msgs) == 3

    def test_tool_calls_extracted(self, result):
        assert len(result["tool_calls"]) == 2

    def test_tool_names(self, result):
        names = {tc["tool_name"] for tc in result["tool_calls"]}
        assert names == {"Read", "Edit"}

    def test_tool_summary_read(self, result):
        read_tc = next(tc for tc in result["tool_calls"] if tc["tool_name"] == "Read")
        assert read_tc["input_summary"] == "/Users/test/myproject/src/login.py"

    def test_tool_summary_edit(self, result):
        edit_tc = next(tc for tc in result["tool_calls"] if tc["tool_name"] == "Edit")
        assert edit_tc["input_summary"] == "/Users/test/myproject/src/login.py"

    def test_first_user_prompt(self, result):
        assert result["first_user_prompt"] == "Fix the login bug"

    def test_first_user_prompt_not_tool_result(self, result):
        # The second user message is a tool_result -- it should NOT become first_user_prompt
        assert "tool_result" not in (result["first_user_prompt"] or "")

    def test_token_accumulation(self, result):
        assert result["total_input_tokens"] == 1500 + 2000 + 2500
        assert result["total_output_tokens"] == 200 + 150 + 100
        assert result["total_cache_creation_tokens"] == 100 + 50 + 0
        assert result["total_cache_read_tokens"] == 800 + 1200 + 2000

    def test_timestamps(self, result):
        assert result["start_time"] == "2025-03-01T10:00:00Z"
        assert result["end_time"] == "2025-03-01T10:00:25Z"

    def test_wall_duration(self, result):
        assert result["duration_wall_seconds"] == 25

    def test_active_duration(self, result):
        # All gaps are 5 seconds, well under 300s threshold
        assert result["duration_active_seconds"] == 25

    def test_thinking_detected(self, result):
        asst_msgs = [m for m in result["messages"] if m["type"] == "assistant"]
        thinking_msgs = [m for m in asst_msgs if m["has_thinking"]]
        assert len(thinking_msgs) == 1

    def test_tool_use_flag(self, result):
        asst_msgs = [m for m in result["messages"] if m["type"] == "assistant"]
        tool_msgs = [m for m in asst_msgs if m["has_tool_use"]]
        assert len(tool_msgs) == 2

    def test_stop_reasons(self, result):
        asst_msgs = [m for m in result["messages"] if m["type"] == "assistant"]
        reasons = [m["stop_reason"] for m in asst_msgs]
        assert "tool_use" in reasons
        assert "end_turn" in reasons

    def test_request_ids(self, result):
        asst_msgs = [m for m in result["messages"] if m["type"] == "assistant"]
        rids = [m["request_id"] for m in asst_msgs if m["request_id"]]
        assert len(rids) == 3

    def test_status_ok(self, result):
        assert result["status"] == "ok"

    def test_compaction_count_zero(self, result):
        assert result["compaction_count"] == 0


# ===========================================================================
# parse_jsonl_file -- malformed input
# ===========================================================================


class TestParseMalformedSession:
    @pytest.fixture
    def result(self):
        return parse("malformed.jsonl")

    def test_session_id_still_extracted(self, result):
        assert result["session_id"] == "sess-bad"

    def test_error_count_captures_bad_lines(self, result):
        # "this is not json at all", [1,2,3] (not a dict), and broken JSON = 3 errors
        assert result["error_count"] == 3

    def test_valid_messages_still_parsed(self, result):
        # 1 user + 2 assistant = 3 valid messages
        assert len(result["messages"]) == 3

    def test_status_ok(self, result):
        # Parser doesn't set status=error for individual line failures
        assert result["status"] == "ok"

    def test_tokens_from_valid_lines(self, result):
        assert result["total_input_tokens"] == 100 + 200
        assert result["total_output_tokens"] == 50 + 30


# ===========================================================================
# parse_jsonl_file -- empty file
# ===========================================================================


class TestParseEmptySession:
    @pytest.fixture
    def result(self):
        return parse("empty_session.jsonl")

    def test_no_messages(self, result):
        assert len(result["messages"]) == 0

    def test_no_tool_calls(self, result):
        assert len(result["tool_calls"]) == 0

    def test_zero_tokens(self, result):
        assert result["total_input_tokens"] == 0
        assert result["total_output_tokens"] == 0

    def test_session_id_fallback_to_stem(self, result):
        # No sessionId in file, so it falls back to filename stem
        assert result["session_id"] == "empty_session"

    def test_zero_duration(self, result):
        assert result["duration_wall_seconds"] == 0
        assert result["duration_active_seconds"] == 0


# ===========================================================================
# parse_jsonl_file -- compaction tracking
# ===========================================================================


class TestParseCompactionSession:
    @pytest.fixture
    def result(self):
        return parse("compaction_session.jsonl")

    def test_compaction_count(self, result):
        assert result["compaction_count"] == 2

    def test_message_count(self, result):
        # 3 user + 3 assistant = 6
        assert len(result["messages"]) == 6

    def test_model_is_opus(self, result):
        assert "opus" in result["model"]

    def test_wall_duration(self, result):
        # 09:00:00 to 10:00:30 = 3630 seconds
        assert result["duration_wall_seconds"] == 3630

    def test_active_duration_excludes_gaps(self, result):
        # Gaps between messages are: 30s, ~1795s (compaction), 5s, 25s, ~1795s, 5s, 25s
        # Only gaps < 300s count: 30 + 5 + 25 + 5 + 25 = 90
        assert result["duration_active_seconds"] == 90

    def test_token_totals(self, result):
        assert result["total_input_tokens"] == 5000 + 3000 + 4000
        assert result["total_output_tokens"] == 2000 + 1500 + 1000


# ===========================================================================
# parse_jsonl_file -- skip types
# ===========================================================================


class TestParseSkipTypes:
    @pytest.fixture
    def result(self):
        return parse("skip_types.jsonl")

    def test_skipped_progress_and_snapshot(self, result):
        # Only user + assistant messages should be captured
        assert len(result["messages"]) == 2

    def test_queue_operation_skipped(self, result):
        # queue-operation is not in MESSAGE_TYPES, so it's skipped
        types = {m["type"] for m in result["messages"]}
        assert types == {"user", "assistant"}


# ===========================================================================
# parse_jsonl_file -- sidechain and agent tracking
# ===========================================================================


class TestParseSidechainSession:
    @pytest.fixture
    def result(self):
        return parse("sidechain_session.jsonl")

    def test_sidechain_flagged(self, result):
        sidechain_msgs = [m for m in result["messages"] if m["is_sidechain"]]
        assert len(sidechain_msgs) == 1

    def test_agent_id_on_sidechain(self, result):
        sidechain = next(m for m in result["messages"] if m["is_sidechain"])
        assert sidechain["agent_id"] == "agent-xyz"

    def test_non_sidechain_exists(self, result):
        non_side = [m for m in result["messages"] if not m["is_sidechain"]]
        assert len(non_side) == 2


# ===========================================================================
# parse_jsonl_file -- subagent file
# ===========================================================================


class TestParseSubagentFile:
    def test_subagent_session_id_includes_agent_id(self, tmp_path):
        # Create a subagent-like file structure
        subagent_dir = tmp_path / "sess-parent" / "subagents"
        subagent_dir.mkdir(parents=True)
        agent_file = subagent_dir / "agent-abc123.jsonl"
        agent_file.write_text(
            '{"type":"user","sessionId":"sess-parent","timestamp":"2025-03-01T10:00:00Z","uuid":"u1","message":{"role":"user","content":"subagent task"}}\n'
            '{"type":"assistant","sessionId":"sess-parent","timestamp":"2025-03-01T10:00:05Z","uuid":"a1","requestId":"req-001","message":{"role":"assistant","model":"claude-sonnet-4-6-20250514","content":"done","stop_reason":"end_turn","usage":{"input_tokens":100,"output_tokens":50}}}\n'
        )

        result = mine.parse_jsonl_file((str(agent_file), True))
        assert result["is_subagent"] is True
        assert result["agent_id"] == "abc123"
        assert result["parent_session_id"] == "sess-parent"
        # Session ID should be unique: parent_id::agent_id
        assert "::abc123" in result["session_id"]


# ===========================================================================
# sanitize on parsed results
# ===========================================================================


class TestSanitizeParsedSession:
    def test_secrets_redacted(self):
        result = parse("secrets_session.jsonl")
        sanitized = mine.sanitize_result(result)

        # Check first_user_prompt
        assert "secret123" not in (sanitized["first_user_prompt"] or "")
        assert "sk-" not in (sanitized["first_user_prompt"] or "")

        # Check assistant message content_preview
        for msg in sanitized["messages"]:
            preview = msg.get("content_preview", "") or ""
            assert "ghp_" not in preview
            assert "AKIA" not in preview

        # Check tool call summaries
        for tc in sanitized["tool_calls"]:
            summary = tc.get("input_summary", "") or ""
            assert "password=" not in summary.lower() or "[REDACTED]" in summary


# ===========================================================================
# Database: init_db and write_result_to_db
# ===========================================================================


class TestDatabaseOperations:
    def test_init_db_creates_tables(self, tmp_path):
        conn = make_db(tmp_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}
        assert "sessions" in tables
        assert "messages" in tables
        assert "tool_calls" in tables
        assert "errors" in tables
        assert "subagents" in tables
        assert "parse_log" in tables
        assert "project_paths" in tables
        assert "meta" in tables
        conn.close()

    def test_init_db_creates_views(self, tmp_path):
        conn = make_db(tmp_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='view'")
        views = {row[0] for row in cursor.fetchall()}
        assert "session_costs" in views
        assert "project_costs" in views
        assert "daily_costs" in views
        assert "tool_usage" in views
        conn.close()

    def test_init_db_creates_fts(self, tmp_path):
        conn = make_db(tmp_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='messages_fts'")
        assert cursor.fetchone() is not None
        conn.close()

    def test_write_and_read_session(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT id, project_name, model FROM sessions WHERE id = ?", (result["session_id"],))
        row = cursor.fetchone()
        assert row is not None
        assert row[0] == "sess-abc123"
        assert row[1] == "myproject"
        assert "sonnet" in row[2]
        conn.close()

    def test_write_messages(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM messages WHERE session_id = ?", (result["session_id"],))
        count = cursor.fetchone()[0]
        assert count == len(result["messages"])
        conn.close()

    def test_write_tool_calls(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT tool_name FROM tool_calls WHERE session_id = ?", (result["session_id"],))
        tools = {row[0] for row in cursor.fetchall()}
        assert tools == {"Read", "Edit"}
        conn.close()

    def test_write_updates_parse_log(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT status FROM parse_log WHERE file_path = ?", (result["file_path"],))
        row = cursor.fetchone()
        assert row is not None
        assert row[0] == "ok"
        conn.close()

    def test_write_updates_project_paths(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT project_name FROM project_paths")
        row = cursor.fetchone()
        assert row is not None
        assert row[0] == "myproject"
        conn.close()

    def test_reparse_replaces_data(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")

        # Write once
        mine.write_result_to_db(conn, result)
        conn.commit()

        # Write again (simulating re-parse)
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sessions WHERE id = ?", (result["session_id"],))
        assert cursor.fetchone()[0] == 1  # not duplicated

        cursor.execute("SELECT COUNT(*) FROM messages WHERE session_id = ?", (result["session_id"],))
        assert cursor.fetchone()[0] == len(result["messages"])  # not doubled
        conn.close()

    def test_session_counts(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_message_count, assistant_message_count, "
            "tool_use_count, thinking_block_count, compaction_count "
            "FROM sessions WHERE id = ?",
            (result["session_id"],),
        )
        row = cursor.fetchone()
        assert row[0] == 3  # user messages
        assert row[1] == 3  # assistant messages
        assert row[2] == 2  # tool calls
        assert row[3] == 1  # thinking blocks
        assert row[4] == 0  # compactions
        conn.close()

    def test_session_tokens_in_db(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            "SELECT total_input_tokens, total_output_tokens, "
            "total_cache_creation_tokens, total_cache_read_tokens "
            "FROM sessions WHERE id = ?",
            (result["session_id"],),
        )
        row = cursor.fetchone()
        assert row[0] == 6000  # 1500 + 2000 + 2500
        assert row[1] == 450  # 200 + 150 + 100
        assert row[2] == 150  # 100 + 50
        assert row[3] == 4000  # 800 + 1200 + 2000
        conn.close()


# ===========================================================================
# FTS5 full-text search
# ===========================================================================


class TestFTSSearch:
    def test_fts_search_finds_content(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM messages_fts WHERE messages_fts MATCH 'login'"
        )
        count = cursor.fetchone()[0]
        assert count >= 1
        conn.close()

    def test_fts_search_no_match(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM messages_fts WHERE messages_fts MATCH 'xyznonexistent'"
        )
        count = cursor.fetchone()[0]
        assert count == 0
        conn.close()


# ===========================================================================
# session_costs view
# ===========================================================================


class TestSessionCostsView:
    def test_sonnet_cost_calculation(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            "SELECT estimated_cost_usd FROM session_costs WHERE id = ?",
            (result["session_id"],),
        )
        row = cursor.fetchone()
        cost = row[0]
        # Sonnet pricing: $3/MTok input, $15/MTok output,
        #   $0.30/MTok cache_read, $3.75/MTok cache_creation
        # input: 6000 * 3.0/1e6 = 0.018
        # cache_read: 4000 * 0.30/1e6 = 0.0012
        # cache_creation: 150 * 3.75/1e6 = 0.0005625
        # output: 450 * 15.0/1e6 = 0.00675
        # total ~= 0.0265
        assert cost > 0
        assert cost < 1.0  # sanity check
        conn.close()

    def test_opus_cost_higher(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("opus_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            "SELECT estimated_cost_usd FROM session_costs WHERE id = ?",
            (result["session_id"],),
        )
        cost = cursor.fetchone()[0]
        # Opus 4.5+: $5/$25 per MTok, cache read $0.50, cache write $6.25
        # input: 10000 * 5.0/1e6 = 0.05
        # cache_read: 8000 * 0.50/1e6 = 0.004
        # cache_creation: 2000 * 6.25/1e6 = 0.0125
        # output: 5000 * 25.0/1e6 = 0.125
        # total ~= 0.1915
        assert cost > 0.1
        conn.close()


# ===========================================================================
# Incremental filtering
# ===========================================================================


class TestIncrementalFilter:
    def test_filters_unchanged_files(self, tmp_path):
        conn = make_db(tmp_path)

        fixture_path = str(FIXTURES / "normal_session.jsonl")
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        # Now filter -- the file hasn't changed, so it should be excluded
        files = [(fixture_path, False)]
        filtered = mine.filter_incremental(conn, files)
        assert len(filtered) == 0
        conn.close()

    def test_includes_new_files(self, tmp_path):
        conn = make_db(tmp_path)

        # Don't write anything to parse_log first
        fixture_path = str(FIXTURES / "normal_session.jsonl")
        files = [(fixture_path, False)]
        filtered = mine.filter_incremental(conn, files)
        assert len(filtered) == 1
        conn.close()


# ===========================================================================
# File discovery helpers
# ===========================================================================


class TestFileDiscoveryHelpers:
    def test_load_mineignore_missing_file(self):
        original = mine.MINEIGNORE_PATH
        mine.MINEIGNORE_PATH = pathlib.Path("/nonexistent/.mineignore")
        try:
            result = mine.load_mineignore()
            assert result == []
        finally:
            mine.MINEIGNORE_PATH = original

    def test_load_mineignore_with_content(self, tmp_path):
        ignore_file = tmp_path / ".mineignore"
        ignore_file.write_text("# comment\npattern1\npattern2\n\n")
        original = mine.MINEIGNORE_PATH
        mine.MINEIGNORE_PATH = ignore_file
        try:
            result = mine.load_mineignore()
            assert result == ["pattern1", "pattern2"]
        finally:
            mine.MINEIGNORE_PATH = original

    def test_should_ignore_matches(self):
        assert mine.should_ignore("my-secret-project", ["secret"]) is True

    def test_should_ignore_no_match(self):
        assert mine.should_ignore("my-project", ["secret"]) is False

    def test_should_ignore_empty_patterns(self):
        assert mine.should_ignore("anything", []) is False


# ===========================================================================
# Date filtering
# ===========================================================================


class TestDateFilter:
    def test_filters_old_files(self, tmp_path):
        # Create a file with an old mtime
        old_file = tmp_path / "old.jsonl"
        old_file.write_text('{"type":"user"}\n')
        import os
        # Set mtime to 2020-01-01
        os.utime(str(old_file), (1577836800, 1577836800))

        files = [(str(old_file), False)]
        filtered = mine.filter_by_date(files, "2025-01-01")
        assert len(filtered) == 0

    def test_includes_recent_files(self, tmp_path):
        new_file = tmp_path / "new.jsonl"
        new_file.write_text('{"type":"user"}\n')
        # mtime is now, which is after 2020-01-01

        files = [(str(new_file), False)]
        filtered = mine.filter_by_date(files, "2020-01-01")
        assert len(filtered) == 1


# ===========================================================================
# Edge cases
# ===========================================================================


class TestEdgeCases:
    def test_missing_file_returns_error_status(self):
        result = mine.parse_jsonl_file(("/nonexistent/path/file.jsonl", False))
        assert result["status"] == "error"
        assert result["parse_error"] is not None

    def test_content_preview_list_with_empty_blocks(self):
        content = [{"type": "unknown_type"}, {"type": "text", "text": "hello"}]
        result = mine.extract_content_preview(content, 100)
        assert "hello" in result

    def test_cache_tokens_nested_fallback(self):
        """Test the nested cache_creation fallback path."""
        fixture = tmp_fixture_with_nested_cache()
        result = mine.parse_jsonl_file((str(fixture), False))
        # Should have picked up tokens from nested object
        assert result["total_cache_creation_tokens"] > 0

    def test_user_message_all_tool_results_skipped_for_first_prompt(self, tmp_path):
        """When the first user message is all tool_result blocks, first_user_prompt stays None."""
        f = tmp_path / "tool_result_first.jsonl"
        f.write_text(json.dumps({
            "type": "user",
            "sessionId": "sess-tr",
            "timestamp": "2025-03-01T10:00:00Z",
            "uuid": "u1",
            "message": {
                "role": "user",
                "content": [{"type": "tool_result", "tool_use_id": "t1", "content": "result"}],
            },
        }) + "\n")
        result = mine.parse_jsonl_file((str(f), False))
        assert result["first_user_prompt"] is None

    def test_usage_not_dict(self, tmp_path):
        """When usage is not a dict, tokens default to 0."""
        f = tmp_path / "bad_usage.jsonl"
        f.write_text(json.dumps({
            "type": "assistant",
            "sessionId": "sess-bu",
            "timestamp": "2025-03-01T10:00:00Z",
            "uuid": "a1",
            "requestId": "req-1",
            "message": {
                "role": "assistant",
                "model": "claude-sonnet-4-6-20250514",
                "content": "hi",
                "stop_reason": "end_turn",
                "usage": "not a dict",
            },
        }) + "\n")
        result = mine.parse_jsonl_file((str(f), False))
        assert result["total_input_tokens"] == 0
        assert result["total_output_tokens"] == 0


def tmp_fixture_with_nested_cache() -> pathlib.Path:
    """Create a temp fixture that uses nested cache_creation object."""
    import tempfile
    tmp = tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False)
    tmp.close()
    f = pathlib.Path(tmp.name)
    f.write_text(json.dumps({
        "type": "assistant",
        "sessionId": "sess-nested",
        "timestamp": "2025-03-01T10:00:00Z",
        "uuid": "a1",
        "requestId": "req-1",
        "message": {
            "role": "assistant",
            "model": "claude-sonnet-4-6-20250514",
            "content": "test",
            "stop_reason": "end_turn",
            "usage": {
                "input_tokens": 100,
                "output_tokens": 50,
                "cache_creation": {
                    "ephemeral_5m_input_tokens": 200,
                    "ephemeral_1h_input_tokens": 300,
                },
                "cache_read_input_tokens": 0,
            },
        },
    }) + "\n")
    return f


# ===========================================================================
# Multiple sessions in one DB
# ===========================================================================


class TestMultipleSessions:
    def test_multiple_sessions_coexist(self, tmp_path):
        conn = make_db(tmp_path)
        for fixture in ["normal_session.jsonl", "compaction_session.jsonl", "sidechain_session.jsonl"]:
            result = parse(fixture)
            mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sessions")
        assert cursor.fetchone()[0] == 3

        cursor.execute("SELECT COUNT(DISTINCT session_id) FROM messages")
        assert cursor.fetchone()[0] == 3
        conn.close()

    def test_project_costs_view(self, tmp_path):
        conn = make_db(tmp_path)
        result = parse("normal_session.jsonl")
        mine.write_result_to_db(conn, result)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute("SELECT project_name, sessions FROM project_costs")
        row = cursor.fetchone()
        assert row is not None
        assert row[0] == "myproject"
        assert row[1] >= 1
        conn.close()
