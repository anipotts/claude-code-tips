#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v2.1.77
# =============================================================================
# No Squash — PreToolUse command blocker
# =============================================================================
# Blocks any squash merge attempt. regular merges only — preserve commit history.
#
# Hook type: PreToolUse (matcher: "Bash")
#
# Exit codes:
#   0 = allow the command to proceed
#   2 = block the command
# =============================================================================

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if [ -z "$COMMAND" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -qiE '(git\s+merge|gh\s+pr\s+merge).*--squash'; then
  echo "BLOCKED by no-squash: squash merges are not allowed. use regular merge to preserve commit history." >&2
  exit 2
fi

exit 0
