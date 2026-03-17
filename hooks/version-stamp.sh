#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v2.1.77
# =============================================================================
# Version Stamp — SessionEnd auto-updater
# =============================================================================
# when a session modifies files in docs/, hooks/, plugins/, or scripts/,
# auto-updates "tested with: claude code vX.Y.Z" stamps to current version.
#
# Hook type: SessionEnd
# =============================================================================

# get current claude code version
CC_VERSION=$(claude --version 2>/dev/null || echo "")
if [ -z "$CC_VERSION" ]; then
  exit 0
fi

# find modified files in tracked dirs
MODIFIED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only 2>/dev/null || echo "")
if [ -z "$MODIFIED" ]; then
  exit 0
fi

# filter to relevant dirs and file types
TARGETS=$(echo "$MODIFIED" | grep -E '^(docs/|hooks/|plugins/|scripts/)' | grep -E '\.(sh|md|py|json)$' || true)
if [ -z "$TARGETS" ]; then
  exit 0
fi

# update stamps
while IFS= read -r file; do
  if [ -f "$file" ] && grep -q 'tested with: claude code v' "$file"; then
    sed -i '' "s/tested with: claude code v[0-9][0-9.]*[0-9]/tested with: claude code v${CC_VERSION}/" "$file"
  fi
done <<< "$TARGETS"

exit 0
