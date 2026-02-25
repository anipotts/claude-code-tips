#!/usr/bin/env bash
# session-state.sh — Stop hook
# Lighter-weight session state capture on Stop event.
# Appends to .claude/handoff.md rather than overwriting,
# so PreCompact data is preserved.

set -euo pipefail

HANDOFF_DIR=".claude"
HANDOFF_FILE="${HANDOFF_DIR}/handoff.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Read JSON payload from stdin
INPUT=$(cat)

# Ensure .claude directory exists
mkdir -p "${HANDOFF_DIR}"

# Extract session ID and stop reason
SESSION_ID=$(echo "${INPUT}" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
STOP_REASON=$(echo "${INPUT}" | jq -r '.stop_reason // "unknown"' 2>/dev/null || echo "unknown")

# Extract the final assistant message if available
LAST_MESSAGE=$(echo "${INPUT}" | jq -r '
  .transcript // .messages // []
  | map(select(.role == "assistant"))
  | .[-1].content // "No final message captured."
' 2>/dev/null || echo "No final message captured.")

# Append session end state (don't overwrite PreCompact data if it exists)
cat >> "${HANDOFF_FILE}" << EOF

---

## Session End
**Timestamp:** ${TIMESTAMP}
**Session:** ${SESSION_ID}
**Stop Reason:** ${STOP_REASON}

### Final State

${LAST_MESSAGE}

---
*Appended by context-handoff/session-state on Stop*
EOF

echo "context-handoff: session state appended to ${HANDOFF_FILE}" >&2
