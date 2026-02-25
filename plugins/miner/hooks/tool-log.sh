#!/usr/bin/env bash
# tool-log.sh -- PostToolUse
# Inserts a row into tool_calls for every tool invocation.
# MUST be fast (<100ms) -- fires on every single tool call.
# No network calls. Minimal sqlite. No jq pipelines beyond field extraction.

set -euo pipefail

DB="${HOME}/.claude/miner.db"
CONFIG="${HOME}/.claude/miner.json"

# check feature toggle
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(jq -r '.tool_log // true' "$CONFIG" 2>/dev/null || echo "true")
  if [[ "$ENABLED" == "false" ]]; then
    exit 0
  fi
fi

# bail early if db does not exist (mine.py creates it on first run)
if [[ ! -f "$DB" ]]; then
  exit 0
fi

# read hook payload from stdin
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TOOL_USE_ID=$(echo "$INPUT" | jq -r '.tool_use_id // empty')
TIMESTAMP=$(echo "$INPUT" | jq -r '.timestamp // empty')

if [[ -z "$TOOL_NAME" || -z "$SESSION_ID" ]]; then
  exit 0
fi

# extract a meaningful input_summary based on tool type
# keep this fast -- single jq call with tool-specific extraction
case "$TOOL_NAME" in
  Read)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    ;;
  Write)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    ;;
  Edit)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    ;;
  Bash)
    # truncate long commands to 200 chars
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.command // empty' | head -c 200)
    ;;
  Grep)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.pattern // empty')
    ;;
  Glob)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.pattern // empty')
    ;;
  Task)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.description // .tool_input.prompt // empty' | head -c 200)
    ;;
  TodoRead|TodoWrite)
    INPUT_SUMMARY="$TOOL_NAME"
    ;;
  *)
    # generic: grab the first string value from tool_input
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input | to_entries | .[0].value // empty' 2>/dev/null | head -c 200)
    ;;
esac

# escape single quotes for sqlite safety
escape() { echo "$1" | sed "s/'/''/g"; }

S_SESSION=$(escape "$SESSION_ID")
S_TOOL_USE_ID=$(escape "$TOOL_USE_ID")
S_TOOL_NAME=$(escape "$TOOL_NAME")
S_INPUT_SUMMARY=$(escape "$INPUT_SUMMARY")
S_TIMESTAMP=$(escape "${TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}")

sqlite3 "$DB" "INSERT INTO tool_calls (session_id, tool_use_id, tool_name, input_summary, timestamp) VALUES ('${S_SESSION}', '${S_TOOL_USE_ID}', '${S_TOOL_NAME}', '${S_INPUT_SUMMARY}', '${S_TIMESTAMP}');"

exit 0
