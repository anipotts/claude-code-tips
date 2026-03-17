#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v2.1.77
# =============================================================================
# Commit Nudge — PostToolUse soft reminder
# =============================================================================
# after N file mutations without a commit, gently reminds the user.
# non-blocking — prints to stderr as a notification, never exits 2.
#
# Hook type: PostToolUse (matcher: "Write", "Edit")
# =============================================================================

THRESHOLD=8
COUNTER_FILE="/tmp/.claude-commit-nudge-$$"

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

# only count Write and Edit
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

# increment counter
COUNT=0
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE")
fi
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# check for uncommitted changes
if [ "$COUNT" -ge "$THRESHOLD" ]; then
  DIRTY=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
  TOTAL=$((DIRTY + UNTRACKED))

  if [ "$TOTAL" -gt 0 ]; then
    echo "nudge: $TOTAL uncommitted file(s) after $COUNT edits — consider committing" >&2
    # reset counter after nudge
    echo "0" > "$COUNTER_FILE"
  fi
fi

exit 0
