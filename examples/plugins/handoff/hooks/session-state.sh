#!/usr/bin/env bash
# session-state.sh — Stop hook
# Lighter-weight session state capture on Stop event.
# Appends to .claude/handoff.md rather than overwriting,
# so PreCompact data is preserved.

set -euo pipefail
# tested with: claude code v2.1.77

HANDOFF_DIR=".claude"
HANDOFF_FILE="${HANDOFF_DIR}/handoff.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Read JSON payload from stdin
INPUT=$(cat)

# Ensure .claude directory exists
mkdir -p "${HANDOFF_DIR}"

# Extract stop reason from the Stop payload
STOP_REASON=$(printf '%s' "${INPUT}" | jq -r '.stop_reason // "unknown"' 2>/dev/null || echo "unknown")

# Append session end state (don't overwrite PreCompact data if it exists)
cat >> "${HANDOFF_FILE}" << EOF

---

## Session End
**Timestamp:** ${TIMESTAMP}
**Stop Reason:** ${STOP_REASON}

<!-- Add notes about what was accomplished and what's next -->

---
*Appended by context-handoff/session-state on Stop*
EOF

echo "context-handoff: session state appended to ${HANDOFF_FILE}" >&2
