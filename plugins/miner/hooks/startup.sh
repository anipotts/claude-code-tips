#!/usr/bin/env bash
# startup.sh -- SessionStart (3-in-1: project move detection + echo + imprint)
# All stdout from this hook becomes context visible to Claude.
# Runs on every session start to surface relevant history.

set -euo pipefail

DB="${HOME}/.claude/miner.db"
CONFIG="${HOME}/.claude/miner.json"

# feature toggles (default: all enabled)
ECHO_ENABLED=true
IMPRINT_ENABLED=true
MOVE_DETECT_ENABLED=true

if [[ -f "$CONFIG" ]]; then
  ECHO_ENABLED=$(jq -r '.echo // true' "$CONFIG" 2>/dev/null || echo "true")
  IMPRINT_ENABLED=$(jq -r '.imprint // true' "$CONFIG" 2>/dev/null || echo "true")
  MOVE_DETECT_ENABLED=$(jq -r '.move_detect // true' "$CONFIG" 2>/dev/null || echo "true")
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
    echo "[miner] Project '${PROJECT_NAME}' was previously at ${OLD_CWD} (${OLD_COUNT} sessions). All history preserved in miner."
  fi
fi

# ============================================================
# 2. ECHO -- solution recall from past sessions
# ============================================================
if [[ "$ECHO_ENABLED" == "true" ]]; then
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
      echo "[miner:echo] ${SESSION_COUNT} previous sessions on '${PROJECT_NAME}'. Last: ${LAST_SESSION:-unknown}."

      # show the most recent prompts as brief context
      PROMPT_SUMMARY=$(echo "$RECENT_PROMPTS" | head -3 | while read -r line; do
        # truncate each to 120 chars
        echo "  - $(echo "$line" | head -c 120)"
      done)

      if [[ -n "$PROMPT_SUMMARY" ]]; then
        echo "[miner:echo] Recent work:"
        echo "$PROMPT_SUMMARY"
      fi
    fi
  fi
fi

# ============================================================
# 3. IMPRINT -- stack recall across projects
# ============================================================
if [[ "$IMPRINT_ENABLED" == "true" ]]; then
  STACK_HINTS=""

  # detect stack from manifest files in cwd
  if [[ -f "${CWD}/package.json" ]]; then
    # extract key deps (top 5 by name)
    DEPS=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) | keys | .[:10] | join(", ")' "${CWD}/package.json" 2>/dev/null || echo "")
    if [[ -n "$DEPS" ]]; then
      STACK_HINTS="node/npm: ${DEPS}"
    fi
  elif [[ -f "${CWD}/Cargo.toml" ]]; then
    DEPS=$(grep -A 50 '^\[dependencies\]' "${CWD}/Cargo.toml" 2>/dev/null | grep -E '^[a-zA-Z]' | head -10 | cut -d= -f1 | tr '\n' ', ' | sed 's/,$//' || echo "")
    if [[ -n "$DEPS" ]]; then
      STACK_HINTS="rust/cargo: ${DEPS}"
    fi
  elif [[ -f "${CWD}/requirements.txt" ]]; then
    DEPS=$(head -10 "${CWD}/requirements.txt" | grep -v '^#' | cut -d= -f1 | cut -d'>' -f1 | cut -d'<' -f1 | tr '\n' ', ' | sed 's/,$//' || echo "")
    if [[ -n "$DEPS" ]]; then
      STACK_HINTS="python: ${DEPS}"
    fi
  elif [[ -f "${CWD}/go.mod" ]]; then
    DEPS=$(grep -E '^\t' "${CWD}/go.mod" 2>/dev/null | head -10 | awk '{print $1}' | xargs -I{} basename {} | tr '\n' ', ' | sed 's/,$//' || echo "")
    if [[ -n "$DEPS" ]]; then
      STACK_HINTS="go: ${DEPS}"
    fi
  fi

  if [[ -n "$STACK_HINTS" ]]; then
    # find other projects with sessions that share similar stack
    # use a broad match on the first major dependency keyword
    FIRST_DEP=$(echo "$STACK_HINTS" | cut -d: -f2 | cut -d, -f1 | xargs)

    if [[ -n "$FIRST_DEP" ]]; then
      SIMILAR_PROJECTS=$(sqlite3 "$DB" "
        SELECT DISTINCT s.project_name, COUNT(*) as cnt
        FROM sessions s
        WHERE s.project_name != '${SAFE_PROJECT}'
          AND s.project_name IS NOT NULL
          AND s.is_subagent = 0
        GROUP BY s.project_name
        HAVING cnt >= 2
        ORDER BY cnt DESC
        LIMIT 5;
      " 2>/dev/null || echo "")

      if [[ -n "$SIMILAR_PROJECTS" ]]; then
        PROJECT_COUNT=$(echo "$SIMILAR_PROJECTS" | wc -l | tr -d ' ')
        echo "[miner:imprint] Stack detected: ${STACK_HINTS}"
        echo "[miner:imprint] You've worked on ${PROJECT_COUNT} other projects with claude. Common tools across your sessions may apply here."
      fi
    fi
  fi
fi

exit 0
