#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v1.0.34
# =============================================================================
# Safety Guard — PreToolUse command blocker
# =============================================================================
# Intercepts Bash tool calls before execution and blocks dangerous commands.
# Returns exit code 2 to tell Claude Code to REJECT the tool call.
#
# Hook type: PreToolUse (matcher: "Bash")
#
# Exit codes:
#   0 = allow the command to proceed
#   2 = block the command (Claude Code will not execute it)
#
# Blocked patterns:
#   - git push --force to main/master
#   - rm -rf / or rm -rf ~ (catastrophic deletes)
#   - git reset --hard on main/master
#   - DROP TABLE / DROP DATABASE (SQL destruction)
#   - chmod 777 on sensitive paths
#   - curl piped to sh/bash (remote code execution)
# =============================================================================

# Read the hook payload from stdin
INPUT=$(cat)

# Extract the command string from the tool input
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# If no command found, allow (not a Bash call we care about)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Helper: block with a reason
block() {
  echo "BLOCKED by safety-guard: $1" >&2
  exit 2
}

# ---------------------------------------------------------------------------
# git push --force to main/master
# Catches: --force, -f, --force-with-lease targeting main or master
# ---------------------------------------------------------------------------
if echo "$COMMAND" | grep -qiE 'git\s+push\s+.*(-f|--force)' ; then
  if echo "$COMMAND" | grep -qiE '\b(main|master)\b'; then
    block "Force push to main/master is not allowed. Use a feature branch."
  fi
fi

# ---------------------------------------------------------------------------
# rm -rf / or rm -rf ~ (catastrophic filesystem deletion)
# ---------------------------------------------------------------------------
if echo "$COMMAND" | grep -qiE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+(/|~|\$HOME)\s*$'; then
  block "Recursive force delete on root or home directory is not allowed."
fi

if echo "$COMMAND" | grep -qiE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+/\s*$'; then
  block "rm -rf / is not allowed."
fi

# ---------------------------------------------------------------------------
# git reset --hard on main/master
# ---------------------------------------------------------------------------
if echo "$COMMAND" | grep -qiE 'git\s+reset\s+--hard'; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    block "git reset --hard on $CURRENT_BRANCH is not allowed. Checkout a feature branch first."
  fi
fi

# ---------------------------------------------------------------------------
# DROP TABLE / DROP DATABASE (SQL destruction)
# Catches these in any context: inline sqlite3, psql, mysql, etc.
# ---------------------------------------------------------------------------
if echo "$COMMAND" | grep -qiE 'DROP\s+(TABLE|DATABASE)'; then
  block "DROP TABLE / DROP DATABASE detected. Remove this from the command if intentional."
fi

# ---------------------------------------------------------------------------
# chmod 777 on sensitive paths
# ---------------------------------------------------------------------------
if echo "$COMMAND" | grep -qiE 'chmod\s+777\s+(/|~|\$HOME|/etc|/usr)'; then
  block "chmod 777 on sensitive paths is not allowed."
fi

# ---------------------------------------------------------------------------
# curl/wget piped to sh/bash (remote code execution)
# ---------------------------------------------------------------------------
if echo "$COMMAND" | grep -qiE '(curl|wget)\s+.*\|\s*(sudo\s+)?(bash|sh|zsh)'; then
  block "Piping remote content to a shell is not allowed. Download first, review, then execute."
fi

# All checks passed — allow the command
exit 0
