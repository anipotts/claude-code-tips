#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v2.1.77
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
#   - Tool name (Bash, Read, Write, Edit, Glob, Grep, etc.)
#   - Tool input (truncated to 500 chars)
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
  tool_name TEXT,
  tool_input TEXT
);"

# Read the hook payload from stdin
INPUT=$(cat)

# Parse fields from the JSON payload
# PostToolUse provides: tool_name, tool_input, tool_result
TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // "unknown"')
TOOL_INPUT=$(printf '%s' "$INPUT" | jq -r '.tool_input | tostring' | head -c 500)

# Escape single quotes for safe SQL insertion
SAFE_INPUT=$(printf '%s' "$TOOL_INPUT" | sed "s/'/''/g")
SAFE_TOOL=$(printf '%s' "$TOOL_NAME" | sed "s/'/''/g")

# Insert the record
sqlite3 "$DB" ".timeout 5000" "INSERT INTO actions (tool_name, tool_input)
  VALUES ('$SAFE_TOOL', '$SAFE_INPUT');"

exit 0
