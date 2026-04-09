#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v2.1.94
# =============================================================================
# Stale Branch Reminder — SessionStart notification
# =============================================================================
# on session start, checks for local branches whose tracking branch is gone.
# prints a reminder to clean up.
#
# Hook type: SessionStart
# =============================================================================

GONE_BRANCHES=$(git branch -vv 2>/dev/null | grep ': gone]' | awk '{print $1}' || true)

if [ -n "$GONE_BRANCHES" ]; then
  COUNT=$(echo "$GONE_BRANCHES" | wc -l | tr -d ' ')
  echo "stale branches ($COUNT): $(echo "$GONE_BRANCHES" | tr '\n' ', ' | sed 's/,$//')" >&2
  echo "clean up with: git branch -d <branch>" >&2
fi

exit 0
