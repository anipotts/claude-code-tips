-- miner schema v1
-- Claude Code conversation history mining database
-- PRAGMA journal_mode=WAL set by mine.py at connection time

PRAGMA foreign_keys = ON;

-- ============================================================
-- META: schema versioning
-- ============================================================
CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
);
INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO meta (key, value) VALUES ('created_at', datetime('now'));

-- ============================================================
-- SESSIONS: one row per JSONL file (main session or subagent)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    slug TEXT,
    project_dir TEXT,
    cwd TEXT,
    project_name TEXT,
    git_branch TEXT,
    model TEXT,
    version TEXT,
    permission_mode TEXT,
    start_time TEXT,
    end_time TEXT,
    duration_wall_seconds INTEGER,
    duration_active_seconds INTEGER,
    message_count INTEGER DEFAULT 0,
    user_message_count INTEGER DEFAULT 0,
    assistant_message_count INTEGER DEFAULT 0,
    tool_use_count INTEGER DEFAULT 0,
    thinking_block_count INTEGER DEFAULT 0,
    user_prompt_count INTEGER DEFAULT 0,
    api_call_count INTEGER DEFAULT 0,
    compaction_count INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cache_creation_tokens INTEGER DEFAULT 0,
    total_cache_read_tokens INTEGER DEFAULT 0,
    is_subagent BOOLEAN DEFAULT FALSE,
    parent_session_id TEXT,
    agent_id TEXT,
    first_user_prompt TEXT,
    file_path TEXT,
    file_size_bytes INTEGER,
    file_mtime TEXT,
    parsed_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- MESSAGES: every user and assistant message
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    uuid TEXT,
    parent_uuid TEXT,
    type TEXT NOT NULL,
    role TEXT,
    model TEXT,
    content_preview TEXT,
    has_tool_use BOOLEAN DEFAULT FALSE,
    has_thinking BOOLEAN DEFAULT FALSE,
    stop_reason TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cache_creation_tokens INTEGER,
    cache_read_tokens INTEGER,
    service_tier TEXT,
    inference_geo TEXT,
    request_id TEXT,
    is_sidechain BOOLEAN DEFAULT FALSE,
    agent_id TEXT,
    user_type TEXT,
    line_number INTEGER,
    timestamp TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- ============================================================
-- TOOL_CALLS: every tool invocation from assistant messages
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_uuid TEXT,
    tool_use_id TEXT,
    tool_name TEXT NOT NULL,
    input_summary TEXT,
    timestamp TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- ============================================================
-- SUBAGENTS: subagent lifecycle tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS subagents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_session_id TEXT NOT NULL,
    agent_id TEXT,
    agent_type TEXT,
    transcript_path TEXT,
    start_time TEXT,
    end_time TEXT,
    duration_seconds INTEGER,
    message_count INTEGER DEFAULT 0,
    tool_use_count INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    FOREIGN KEY (parent_session_id) REFERENCES sessions(id)
);

-- ============================================================
-- ERRORS: tool failures (from PostToolUseFailure or JSONL)
-- ============================================================
CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    tool_name TEXT,
    input_summary TEXT,
    error_message TEXT,
    is_interrupt BOOLEAN DEFAULT FALSE,
    timestamp TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- ============================================================
-- PROJECT_PATHS: tracks every location a project has lived
-- ============================================================
CREATE TABLE IF NOT EXISTS project_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    project_dir TEXT NOT NULL,
    cwd TEXT,
    first_seen TEXT,
    last_seen TEXT,
    session_count INTEGER DEFAULT 1,
    UNIQUE(project_name, project_dir)
);

-- ============================================================
-- PARSE_LOG: incremental tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS parse_log (
    file_path TEXT PRIMARY KEY,
    file_size INTEGER,
    file_mtime TEXT,
    session_id TEXT,
    parsed_at TEXT DEFAULT (datetime('now')),
    parse_duration_ms INTEGER,
    line_count INTEGER,
    error_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ok'
);

-- ============================================================
-- FTS5: full-text search across prompts and responses
-- ============================================================
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    content_preview,
    content='messages',
    content_rowid='id'
);

-- triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(rowid, content_preview) VALUES (new.id, new.content_preview);
END;
CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content_preview) VALUES('delete', old.id, old.content_preview);
END;
CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content_preview) VALUES('delete', old.id, old.content_preview);
    INSERT INTO messages_fts(rowid, content_preview) VALUES (new.id, new.content_preview);
END;

-- ============================================================
-- COSTS VIEW: auto-computed USD per session
-- ============================================================
CREATE VIEW IF NOT EXISTS session_costs AS
SELECT
    s.id,
    s.project_name,
    s.model,
    s.start_time,
    s.total_input_tokens,
    s.total_output_tokens,
    s.total_cache_creation_tokens,
    s.total_cache_read_tokens,
    -- total_input_tokens is already the non-cached portion (API's input_tokens field)
    -- so no subtraction needed — just price each bucket separately
    -- model names include version suffixes (e.g. claude-opus-4-5-20251101) so use LIKE
    CASE
        WHEN s.model LIKE 'claude-opus-4-%' THEN
            COALESCE(s.total_input_tokens, 0) * 15.0 / 1e6
            + COALESCE(s.total_cache_read_tokens, 0) * 1.5 / 1e6
            + COALESCE(s.total_cache_creation_tokens, 0) * 18.75 / 1e6
            + COALESCE(s.total_output_tokens, 0) * 75.0 / 1e6
        WHEN s.model LIKE 'claude-sonnet-4-%' THEN
            COALESCE(s.total_input_tokens, 0) * 3.0 / 1e6
            + COALESCE(s.total_cache_read_tokens, 0) * 0.30 / 1e6
            + COALESCE(s.total_cache_creation_tokens, 0) * 3.75 / 1e6
            + COALESCE(s.total_output_tokens, 0) * 15.0 / 1e6
        WHEN s.model LIKE 'claude-haiku-4-%' THEN
            COALESCE(s.total_input_tokens, 0) * 0.80 / 1e6
            + COALESCE(s.total_cache_read_tokens, 0) * 0.08 / 1e6
            + COALESCE(s.total_cache_creation_tokens, 0) * 1.0 / 1e6
            + COALESCE(s.total_output_tokens, 0) * 4.0 / 1e6
        ELSE 0
    END AS estimated_cost_usd
FROM sessions s;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_name);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_model ON sessions(model);
CREATE INDEX IF NOT EXISTS idx_sessions_cwd ON sessions(cwd);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_name ON tool_calls(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_calls_timestamp ON tool_calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_errors_session ON errors(session_id);
CREATE INDEX IF NOT EXISTS idx_subagents_parent ON subagents(parent_session_id);
CREATE INDEX IF NOT EXISTS idx_parse_log_session ON parse_log(session_id);
CREATE INDEX IF NOT EXISTS idx_project_paths_name ON project_paths(project_name);
