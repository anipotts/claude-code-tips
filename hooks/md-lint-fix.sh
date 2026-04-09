#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v2.1.94
# =============================================================================
# Markdown Lint Fix — PostToolUse auto-fixer
# =============================================================================
# when a .md file is written or edited, runs markdownlint-fix on it.
# prevents markdown-lint CI failures from accumulating.
#
# Hook type: PostToolUse (matcher: "Write", "Edit")
# =============================================================================

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

# only act on Write and Edit
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

# get the file path
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# only act on markdown files
if [[ "$FILE_PATH" != *.md ]]; then
  exit 0
fi

# only fix if the file exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# run markdownlint-fix (silently — don't block on failure)
npx --yes markdownlint-cli2-fix "$FILE_PATH" 2>/dev/null || true

exit 0
