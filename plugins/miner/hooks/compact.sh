#!/usr/bin/env bash
# compact.sh -- PreCompact
# Increments the compaction_count for this session in miner.db.
# Lightweight counter so you can track how often context gets compressed.

set -euo pipefail

DB="${HOME}/.claude/miner.db"
CONFIG="${HOME}/.claude/miner.json"

# check feature toggle
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(jq -r '.compact // true' "$CONFIG" 2>/dev/null || echo "true")
  if [[ "$ENABLED" == "false" ]]; then
    exit 0
  fi
fi

# read hook payload from stdin
INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

if [[ -z "$SESSION_ID" ]]; then
  echo "[miner] compact: no session_id in payload, skipping" >&2
  exit 0
fi

if [[ ! -f "$DB" ]]; then
  echo "[miner] compact: database not found at $DB, skipping" >&2
  exit 0
fi

# escape single quotes for sqlite
SAFE_SESSION_ID=$(echo "$SESSION_ID" | sed "s/'/''/g")

sqlite3 "$DB" "UPDATE sessions SET compaction_count = compaction_count + 1 WHERE id = '${SAFE_SESSION_ID}';"

echo "[miner] compact: incremented compaction_count for session $SESSION_ID" >&2
exit 0
