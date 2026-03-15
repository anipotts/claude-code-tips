#!/usr/bin/env bash
# burn.sh -- PreCompact (cost anomaly detection)
# Fires when context is about to be compressed. Compares current session
# token usage against project averages and warns if this session is burning
# significantly more than usual.

set -euo pipefail
# tested with: claude code v1.0.34

DB="${HOME}/.claude/mine.db"
CONFIG="${HOME}/.claude/mine.json"

# check feature toggle
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(jq -r '.burn // true' "$CONFIG" 2>/dev/null || echo "true")
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

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

if [[ -z "$SESSION_ID" ]]; then
  exit 0
fi

# escape single quotes for sqlite
escape() { echo "$1" | sed "s/'/''/g"; }

S_SESSION=$(escape "$SESSION_ID")

# get current session token totals and project name
CURRENT=$(sqlite3 "$DB" "
  SELECT
    COALESCE(total_input_tokens, 0) + COALESCE(total_output_tokens, 0)
      + COALESCE(total_cache_creation_tokens, 0) + COALESCE(total_cache_read_tokens, 0),
    project_name
  FROM sessions
  WHERE id = '${S_SESSION}'
  LIMIT 1;
" 2>/dev/null || echo "")

if [[ -z "$CURRENT" ]]; then
  exit 0
fi

CURRENT_TOKENS=$(echo "$CURRENT" | cut -d'|' -f1)
PROJECT_NAME=$(echo "$CURRENT" | cut -d'|' -f2)

if [[ -z "$PROJECT_NAME" || "$CURRENT_TOKENS" -eq 0 ]]; then
  exit 0
fi

SAFE_PROJECT=$(escape "$PROJECT_NAME")

# get project average total tokens for sessions that had at least one compaction
# (compaction_count > 0 means the session was long enough to compress)
AVG_TOKENS=$(sqlite3 "$DB" "
  SELECT CAST(AVG(
    COALESCE(total_input_tokens, 0) + COALESCE(total_output_tokens, 0)
      + COALESCE(total_cache_creation_tokens, 0) + COALESCE(total_cache_read_tokens, 0)
  ) AS INTEGER)
  FROM sessions
  WHERE project_name = '${SAFE_PROJECT}'
    AND is_subagent = 0
    AND compaction_count > 0
    AND id != '${S_SESSION}';
" 2>/dev/null || echo "")

# if no historical data, compare against global average
if [[ -z "$AVG_TOKENS" || "$AVG_TOKENS" == "" || "$AVG_TOKENS" -eq 0 ]]; then
  AVG_TOKENS=$(sqlite3 "$DB" "
    SELECT CAST(AVG(
      COALESCE(total_input_tokens, 0) + COALESCE(total_output_tokens, 0)
        + COALESCE(total_cache_creation_tokens, 0) + COALESCE(total_cache_read_tokens, 0)
    ) AS INTEGER)
    FROM sessions
    WHERE is_subagent = 0
      AND compaction_count > 0
      AND id != '${S_SESSION}';
  " 2>/dev/null || echo "")
fi

# still no data — skip (first sessions ever)
if [[ -z "$AVG_TOKENS" || "$AVG_TOKENS" == "" || "$AVG_TOKENS" -eq 0 ]]; then
  exit 0
fi

# calculate ratio
# bash can't do floating point, so multiply first
RATIO_X10=$(( CURRENT_TOKENS * 10 / AVG_TOKENS ))

# only warn if > 2x average (ratio_x10 > 20)
if [[ "$RATIO_X10" -gt 20 ]]; then
  # format tokens as human-readable
  if [[ "$CURRENT_TOKENS" -gt 1000000000 ]]; then
    TOKEN_FMT="$(( CURRENT_TOKENS / 1000000000 )).$(( (CURRENT_TOKENS / 100000000) % 10 ))B"
  elif [[ "$CURRENT_TOKENS" -gt 1000000 ]]; then
    TOKEN_FMT="$(( CURRENT_TOKENS / 1000000 )).$(( (CURRENT_TOKENS / 100000) % 10 ))M"
  else
    TOKEN_FMT="$(( CURRENT_TOKENS / 1000 ))K"
  fi

  RATIO_WHOLE=$(( RATIO_X10 / 10 ))
  RATIO_FRAC=$(( RATIO_X10 % 10 ))

  # estimate cost (rough: use opus 4.5 cache-read rate as dominant cost)
  # most tokens in a long session are cache reads at $0.50/1M
  COST_CENTS=$(( CURRENT_TOKENS * 50 / 1000000000 ))
  COST_DOLLARS=$(( COST_CENTS / 100 ))
  COST_REMAINING=$(( COST_CENTS % 100 ))

  echo "[mine:burn] this session is at ${TOKEN_FMT} tokens — ${RATIO_WHOLE}.${RATIO_FRAC}x your avg for '${PROJECT_NAME}' (~\$${COST_DOLLARS}.$(printf '%02d' $COST_REMAINING) estimated)"
fi

exit 0
