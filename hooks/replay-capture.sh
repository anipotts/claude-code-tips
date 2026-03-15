#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v1.0.34
# =============================================================================
# Replay Capture — PostToolUse file mutation logger
# =============================================================================
# Silently logs every Edit/Write tool call to a session-specific JSONL file.
# Used by /replay to generate VHS tape animations of session activity.
#
# Hook type: PostToolUse
#
# To register, add this to your ~/.claude/settings.json or .claude/settings.json:
#
#   {
#     "hooks": {
#       "PostToolUse": [
#         {
#           "hooks": [
#             { "type": "command", "command": "/path/to/hooks/replay-capture.sh" }
#           ]
#         }
#       ]
#     }
#   }
#
# Output: ~/.claude/replay/SESSION_ID.jsonl
# Exit codes: always 0 (never blocks)
# =============================================================================

# read hook payload from stdin
INPUT=$(cat)

# only act on file-mutating tools
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
case "$TOOL_NAME" in
  Edit|Write) ;;
  *) exit 0 ;;
esac

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
if [[ -z "$SESSION_ID" ]]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# estimate lines changed based on tool type
case "$TOOL_NAME" in
  Edit)
    # count newlines in new_string as a rough proxy for lines changed
    LINES_CHANGED=$(echo "$INPUT" | jq -r '.tool_input.new_string // ""' | wc -l | tr -d ' ')
    ;;
  Write)
    # count newlines in content
    LINES_CHANGED=$(echo "$INPUT" | jq -r '.tool_input.content // ""' | wc -l | tr -d ' ')
    ;;
  *)
    LINES_CHANGED=0
    ;;
esac

# timestamp: use hook payload timestamp if available, otherwise generate one
TS=$(echo "$INPUT" | jq -r '.timestamp // empty')
if [[ -z "$TS" ]]; then
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
fi

# ensure replay directory exists
REPLAY_DIR="${HOME}/.claude/replay"
mkdir -p "$REPLAY_DIR"

# append one JSON line -- use jq -c for compact, valid JSON
jq -n -c \
  --arg ts "$TS" \
  --arg tool "$TOOL_NAME" \
  --arg file "$FILE_PATH" \
  --argjson lines "${LINES_CHANGED:-0}" \
  '{ts: $ts, tool: $tool, file: $file, lines_changed: $lines}' \
  >> "${REPLAY_DIR}/${SESSION_ID}.jsonl"

exit 0
