#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v1.0.34
# =============================================================================
# Panopticon — PostToolUse audit trail
# =============================================================================
# Logs every Claude Code tool action to a local SQLite database.
# Database location: ~/.claude/panopticon.db
#
# Hook type: PostToolUse (matcher: "" to capture all tools)
#
# What gets logged:
#   - Timestamp (UTC)
#   - Session ID
#   - Tool name (Bash, Read, Write, Edit, Glob, Grep, etc.)
#   - Tool input (truncated to 500 chars)
#   - Output status code from the tool execution
#
# Query your history:
#   sqlite3 ~/.claude/panopticon.db "SELECT * FROM actions ORDER BY timestamp DESC LIMIT 20;"
#   sqlite3 ~/.claude/panopticon.db "SELECT tool_name, COUNT(*) FROM actions GROUP BY tool_name;"
# =============================================================================

DB="$HOME/.claude/panopticon.db"

# Ensure the directory exists
mkdir -p "$(dirname "$DB")"

# Create table if it does not exist
sqlite3 "$DB" "CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT (datetime('now')),
  session_id TEXT,
  tool_name TEXT,
  tool_input TEXT,
  exit_code INTEGER
);"

# Read the hook payload from stdin
INPUT=$(cat)

# Parse fields from the JSON payload
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input | tostring' | head -c 500)
EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_output.exit_code // 0')

# Escape single quotes for safe SQL insertion
SAFE_INPUT=$(echo "$TOOL_INPUT" | sed "s/'/''/g")
SAFE_SESSION=$(echo "$SESSION_ID" | sed "s/'/''/g")
SAFE_TOOL=$(echo "$TOOL_NAME" | sed "s/'/''/g")

# Insert the record
sqlite3 "$DB" "INSERT INTO actions (session_id, tool_name, tool_input, exit_code)
  VALUES ('$SAFE_SESSION', '$SAFE_TOOL', '$SAFE_INPUT', $EXIT_CODE);"

exit 0
