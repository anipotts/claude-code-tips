#!/usr/bin/env bash
# scar.sh -- PostToolUseFailure (mistake memory)
# Records every tool failure and surfaces patterns of repeated mistakes.
# If the same tool has failed with similar input in this project before,
# prints a warning so Claude can avoid the same trap.

set -euo pipefail

DB="${HOME}/.claude/miner.db"
CONFIG="${HOME}/.claude/miner.json"

# check feature toggle
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(jq -r '.scar // true' "$CONFIG" 2>/dev/null || echo "true")
  if [[ "$ENABLED" == "false" ]]; then
    exit 0
  fi
fi

# bail if db does not exist yet
if [[ ! -f "$DB" ]]; then
  exit 0
fi

# read hook payload from stdin
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
ERROR_MSG=$(echo "$INPUT" | jq -r '.error // empty')

if [[ -z "$TOOL_NAME" || -z "$SESSION_ID" ]]; then
  exit 0
fi

# extract input_summary based on tool type (same logic as tool-log.sh)
case "$TOOL_NAME" in
  Read|Write|Edit)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    ;;
  Bash)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.command // empty' | head -c 200)
    ;;
  Grep|Glob)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input.pattern // empty')
    ;;
  *)
    INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input | to_entries | .[0].value // empty' 2>/dev/null | head -c 200)
    ;;
esac

# truncate error message for storage
ERROR_SHORT=$(echo "$ERROR_MSG" | head -c 500)

# escape single quotes for sqlite
escape() { echo "$1" | sed "s/'/''/g"; }

S_SESSION=$(escape "$SESSION_ID")
S_TOOL=$(escape "$TOOL_NAME")
S_INPUT=$(escape "$INPUT_SUMMARY")
S_ERROR=$(escape "$ERROR_SHORT")
S_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# look up this project name from the session
PROJECT_NAME=$(sqlite3 "$DB" "
  SELECT project_name FROM sessions WHERE id = '${S_SESSION}' LIMIT 1;
" 2>/dev/null || echo "")

SAFE_PROJECT=$(echo "$PROJECT_NAME" | sed "s/'/''/g")

# query for similar past failures: same tool, same project
if [[ -n "$PROJECT_NAME" ]]; then
  PAST_FAILURES=$(sqlite3 "$DB" "
    SELECT e.error_message, e.input_summary, e.timestamp
    FROM errors e
    JOIN sessions s ON s.id = e.session_id
    WHERE e.tool_name = '${S_TOOL}'
      AND s.project_name = '${SAFE_PROJECT}'
    ORDER BY e.timestamp DESC
    LIMIT 5;
  " 2>/dev/null || echo "")

  if [[ -n "$PAST_FAILURES" ]]; then
    FAILURE_COUNT=$(echo "$PAST_FAILURES" | wc -l | tr -d ' ')

    # stdout goes to Claude as context
    echo "[miner:scar] ${TOOL_NAME} has failed ${FAILURE_COUNT} time(s) before in '${PROJECT_NAME}'."

    # show the most recent past failure for context
    LAST_FAILURE=$(echo "$PAST_FAILURES" | head -1)
    LAST_ERROR=$(echo "$LAST_FAILURE" | cut -d'|' -f1 | head -c 200)
    LAST_INPUT=$(echo "$LAST_FAILURE" | cut -d'|' -f2 | head -c 100)
    LAST_TIME=$(echo "$LAST_FAILURE" | cut -d'|' -f3)

    if [[ -n "$LAST_ERROR" ]]; then
      echo "[miner:scar] Previous failure (${LAST_TIME}): input='${LAST_INPUT}' error='${LAST_ERROR}'"
    fi
  fi
fi

# always record the current failure
sqlite3 "$DB" "INSERT INTO errors (session_id, tool_name, input_summary, error_message, is_interrupt, timestamp) VALUES ('${S_SESSION}', '${S_TOOL}', '${S_INPUT}', '${S_ERROR}', 0, '${S_TIMESTAMP}');"

echo "[miner] scar: recorded ${TOOL_NAME} failure" >&2
exit 0
