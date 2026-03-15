#!/usr/bin/env bash
# startup.sh -- SessionStart (2-in-1: project move detection + search)
# All stdout from this hook becomes context visible to Claude.
# Runs on every session start to surface relevant history.

set -euo pipefail
# tested with: claude code v1.0.34

DB="${HOME}/.claude/mine.db"
CONFIG="${HOME}/.claude/mine.json"

# one-time migration: miner → mine
if [[ -f "${HOME}/.claude/miner.db" && ! -f "$DB" ]]; then
  mv "${HOME}/.claude/miner.db" "$DB"
  [[ -f "${HOME}/.claude/miner.json" ]] && mv "${HOME}/.claude/miner.json" "$CONFIG"
  [[ -f "${HOME}/.claude/.minerignore" ]] && mv "${HOME}/.claude/.minerignore" "${HOME}/.claude/.mineignore"
  echo "[mine] migrated miner.db → mine.db"
fi

# feature toggles (default: all enabled)
SEARCH_ENABLED=true
MOVE_DETECT_ENABLED=true
BACKFILL_ENABLED=true

if [[ -f "$CONFIG" ]]; then
  SEARCH_ENABLED=$(jq -r '.search // true' "$CONFIG" 2>/dev/null || echo "true")
  MOVE_DETECT_ENABLED=$(jq -r '.move_detect // true' "$CONFIG" 2>/dev/null || echo "true")
  BACKFILL_ENABLED=$(jq -r '.auto_backfill // true' "$CONFIG" 2>/dev/null || echo "true")
fi

# bail if db does not exist yet (no history to surface)
if [[ ! -f "$DB" ]]; then
  exit 0
fi

# read hook payload from stdin
INPUT=$(cat)

CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$CWD" ]]; then
  CWD=$(pwd)
fi

PROJECT_NAME=$(basename "$CWD")
SAFE_PROJECT=$(echo "$PROJECT_NAME" | sed "s/'/''/g")
SAFE_CWD=$(echo "$CWD" | sed "s/'/''/g")

# ============================================================
# 0. FRESHNESS CHECK + AUTO-BACKFILL
# ============================================================
if [[ "$BACKFILL_ENABLED" == "true" ]]; then
  LATEST_SESSION=$(sqlite3 "$DB" "
    SELECT MAX(start_time) FROM sessions WHERE is_subagent = 0;
  " 2>/dev/null || echo "")

  if [[ -n "$LATEST_SESSION" && "$LATEST_SESSION" != "" ]]; then
    # cross-platform epoch conversion
    if [[ "$(uname)" == "Darwin" ]]; then
      LATEST_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${LATEST_SESSION%%.*}" "+%s" 2>/dev/null || echo "0")
    else
      LATEST_EPOCH=$(date -d "${LATEST_SESSION}" "+%s" 2>/dev/null || echo "0")
    fi
    NOW_EPOCH=$(date "+%s")
    GAP=$(( NOW_EPOCH - LATEST_EPOCH ))

    if [[ "$GAP" -gt 86400 ]]; then
      # resolve mine.py: plugin-local first, then repo layout
      SCRIPT_DIR_SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
      BF_MINE_PY="${SCRIPT_DIR_SELF}/../scripts/mine.py"
      if [[ ! -f "$BF_MINE_PY" ]]; then
        BF_MINE_PY="${SCRIPT_DIR_SELF}/../../scripts/mine.py"
      fi

      if [[ -f "$BF_MINE_PY" ]]; then
        GAP_DAYS=$(( GAP / 86400 ))
        echo "[mine:heal] data is ${GAP_DAYS}d stale. backfilling in background..."

        # background backfill — does not block session start
        (python3 "$BF_MINE_PY" --incremental >> "${HOME}/.claude/mine-backfill.log" 2>&1) &
      fi
    fi
  fi
fi

# ============================================================
# 1. PROJECT MOVE DETECTION
# ============================================================
if [[ "$MOVE_DETECT_ENABLED" == "true" ]]; then
  MOVED=$(sqlite3 "$DB" "
    SELECT cwd, session_count FROM project_paths
    WHERE project_name = '${SAFE_PROJECT}'
      AND cwd != '${SAFE_CWD}'
    ORDER BY last_seen DESC
    LIMIT 1;
  " 2>/dev/null || echo "")

  if [[ -n "$MOVED" ]]; then
    OLD_CWD=$(echo "$MOVED" | cut -d'|' -f1)
    OLD_COUNT=$(echo "$MOVED" | cut -d'|' -f2)
    echo "[mine] Project '${PROJECT_NAME}' was previously at ${OLD_CWD} (${OLD_COUNT} sessions). All history preserved in mine."
  fi
fi

# ============================================================
# 2. SEARCH -- solution recall from past sessions
# ============================================================
if [[ "$SEARCH_ENABLED" == "true" ]]; then
  # get the most recent user prompts from this project to find patterns
  RECENT_PROMPTS=$(sqlite3 "$DB" "
    SELECT m.content_preview FROM messages m
    JOIN sessions s ON s.id = m.session_id
    WHERE s.project_name = '${SAFE_PROJECT}'
      AND m.role = 'user'
      AND m.content_preview IS NOT NULL
      AND m.content_preview != ''
    ORDER BY m.timestamp DESC
    LIMIT 5;
  " 2>/dev/null || echo "")

  if [[ -n "$RECENT_PROMPTS" ]]; then
    SESSION_COUNT=$(sqlite3 "$DB" "
      SELECT COUNT(*) FROM sessions
      WHERE project_name = '${SAFE_PROJECT}' AND is_subagent = 0;
    " 2>/dev/null || echo "0")

    LAST_SESSION=$(sqlite3 "$DB" "
      SELECT start_time FROM sessions
      WHERE project_name = '${SAFE_PROJECT}' AND is_subagent = 0
      ORDER BY start_time DESC
      LIMIT 1;
    " 2>/dev/null || echo "")

    if [[ "$SESSION_COUNT" -gt 0 ]]; then
      echo "[mine:search] ${SESSION_COUNT} previous sessions on '${PROJECT_NAME}'. Last: ${LAST_SESSION:-unknown}."

      # show the most recent prompts as brief context
      PROMPT_SUMMARY=$(echo "$RECENT_PROMPTS" | head -3 | while read -r line; do
        # truncate each to 120 chars
        echo "  - $(echo "$line" | head -c 120)"
      done)

      if [[ -n "$PROMPT_SUMMARY" ]]; then
        echo "[mine:search] Recent work:"
        echo "$PROMPT_SUMMARY"
      fi
    fi
  fi
fi

exit 0
