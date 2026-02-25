#!/usr/bin/env bash
# =============================================================================
# Knowledge Builder -- PostToolUse knowledge graph
# =============================================================================
# Builds a lightweight knowledge graph in .claude/knowledge.md as Claude
# explores a codebase. Tracks file relationships, imports, exports, and
# dependency patterns discovered through Read, Grep, and Glob calls.
#
# Hook type: PostToolUse (matcher: "Read|Grep|Glob")
#
# Credit: Boris Cherny tip #6 (knowledge graphs).
#
# What gets tracked:
#   - Files discovered (with first-seen timestamp and type)
#   - Import/export relationships between files
#   - Module dependency chains
#   - Key patterns (test files, config files, entry points)
#
# View the knowledge graph:
#   cat .claude/knowledge.md
#
# Reset it:
#   rm .claude/knowledge.md
#
# Hook config (add to .claude/settings.json):
#   "PostToolUse": [{
#     "matcher": "Read|Grep|Glob",
#     "hooks": [{ "type": "command", "command": "~/.claude/hooks/knowledge-builder.sh" }]
#   }]
# =============================================================================

set -euo pipefail

# Read the hook payload from stdin
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')

# Only process Read, Grep, Glob
case "$TOOL_NAME" in
  Read|Grep|Glob) ;;
  *) exit 0 ;;
esac

# Get working directory from hook payload or fall back to PWD
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$CWD" ]]; then
  CWD="${PWD}"
fi

KNOWLEDGE_FILE="${CWD}/.claude/knowledge.md"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M")

# Ensure .claude directory exists
mkdir -p "$(dirname "$KNOWLEDGE_FILE")"

# Initialize knowledge file if it doesn't exist
if [ ! -f "$KNOWLEDGE_FILE" ]; then
  cat > "$KNOWLEDGE_FILE" << 'HEADER'
# knowledge graph

auto-generated map of codebase relationships. built by the knowledge-builder hook as claude explores files.

## files discovered

| file | type | first seen |
|---|---|---|

## relationships

HEADER
fi

# Helper: classify file type
classify_file() {
  local filepath="$1"
  case "$filepath" in
    *.test.*|*.spec.*|*_test.*|*_spec.*|*__tests__*) echo "test" ;;
    *config*|*rc.*|*.config.*|*tsconfig*|*package.json) echo "config" ;;
    *index.*|*main.*|*app.*|*server.*|*entry*) echo "entry" ;;
    *) echo "source" ;;
  esac
}

# Helper: add a file to the discovery table if not already tracked
add_file() {
  local filepath="$1"
  # Make path relative to project
  local rel_path="${filepath#$CWD/}"

  # Only track source-like files
  case "$rel_path" in
    *.ts|*.tsx|*.js|*.jsx|*.py|*.rs|*.go|*.rb|*.java|*.vue|*.svelte) ;;
    *) return 0 ;;
  esac

  # Skip node_modules, .git, dist, build
  case "$rel_path" in
    node_modules/*|.git/*|dist/*|build/*|.next/*|target/*) return 0 ;;
  esac

  # Only add if not already tracked
  if ! grep -qF "| ${rel_path} |" "$KNOWLEDGE_FILE" 2>/dev/null; then
    local file_type
    file_type=$(classify_file "$rel_path")
    # Insert before "## relationships" line
    sed -i'' -e "/^## relationships$/i\\
| ${rel_path} | ${file_type} | ${TIMESTAMP} |" "$KNOWLEDGE_FILE"
  fi
}

# Helper: add a relationship if not already tracked
add_relationship() {
  local from="$1"
  local to="$2"
  local rel_from="${from#$CWD/}"
  local relationship="${rel_from} -> ${to}"

  if ! grep -qF "$relationship" "$KNOWLEDGE_FILE" 2>/dev/null; then
    echo "- \`${relationship}\`" >> "$KNOWLEDGE_FILE"
  fi
}

# ---- Handle Read tool: extract file info and imports ----
if [ "$TOOL_NAME" = "Read" ]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
  [ -z "$FILE_PATH" ] && exit 0

  add_file "$FILE_PATH"

  # Extract import relationships from the tool output
  TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output.content // empty' 2>/dev/null | head -c 5000)

  if [ -n "$TOOL_OUTPUT" ]; then
    # JS/TS imports: import ... from './path' or require('./path')
    echo "$TOOL_OUTPUT" | grep -oE "(from|require\()\s*['\"]\.?\.?/[^'\"]+['\"]" 2>/dev/null | \
      sed "s/from\s*['\"]//; s/require(['\"]//; s/['\")]//g" | \
      sort -u | head -15 | while IFS= read -r imp; do
        [ -z "$imp" ] && continue
        add_relationship "$FILE_PATH" "$imp"
      done

    # Python imports: from module import ... or import module
    echo "$TOOL_OUTPUT" | grep -oE "^(from\s+\S+|import\s+\S+)" 2>/dev/null | \
      sed 's/from[[:space:]]\{1,\}//; s/import[[:space:]]\{1,\}//' | \
      grep -v '^[A-Z]' | sort -u | head -15 | while IFS= read -r imp; do
        [ -z "$imp" ] && continue
        add_relationship "$FILE_PATH" "$imp"
      done
  fi
fi

# ---- Handle Grep tool: note discovered files ----
if [ "$TOOL_NAME" = "Grep" ]; then
  TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output.content // empty' 2>/dev/null | head -c 3000)

  if [ -n "$TOOL_OUTPUT" ]; then
    # Extract file paths from grep results (lines like "path/to/file.ts:123:content")
    echo "$TOOL_OUTPUT" | grep -oE "^[^:]+\.(ts|tsx|js|jsx|py|rs|go|rb|java)" 2>/dev/null | \
      sort -u | head -10 | while IFS= read -r found_file; do
        [ -z "$found_file" ] && continue
        add_file "${CWD}/${found_file}"
      done
  fi
fi

# ---- Handle Glob tool: note discovered files ----
if [ "$TOOL_NAME" = "Glob" ]; then
  TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output.content // empty' 2>/dev/null | head -c 3000)

  if [ -n "$TOOL_OUTPUT" ]; then
    echo "$TOOL_OUTPUT" | grep -oE "[^\s]+\.(ts|tsx|js|jsx|py|rs|go|rb|java)" 2>/dev/null | \
      sort -u | head -20 | while IFS= read -r found_file; do
        [ -z "$found_file" ] && continue
        add_file "${CWD}/${found_file}"
      done
  fi
fi

exit 0
