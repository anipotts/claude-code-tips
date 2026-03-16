#!/usr/bin/env bash
# subagent.sh -- SubagentStop
# Parses a single subagent transcript into mine.db when it finishes.

set -euo pipefail
# tested with: claude code v1.0.34

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# plugin-local first (marketplace installs), then repo layout fallback
MINE_PY="${SCRIPT_DIR}/../scripts/mine.py"
if [[ ! -f "$MINE_PY" ]]; then
  MINE_PY="${SCRIPT_DIR}/../../scripts/mine.py"
fi
CONFIG="${HOME}/.claude/mine.json"

# check feature toggle
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(jq -r '.ingest // true' "$CONFIG" 2>/dev/null || echo "true")
  if [[ "$ENABLED" == "false" ]]; then
    exit 0
  fi
fi

# read hook payload from stdin
INPUT=$(cat)

AGENT_TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.agent_transcript_path // empty')

if [[ -z "$AGENT_TRANSCRIPT_PATH" ]]; then
  echo "[mine] subagent: no agent_transcript_path in payload, skipping" >&2
  exit 0
fi

if [[ ! -f "$AGENT_TRANSCRIPT_PATH" ]]; then
  echo "[mine] subagent: transcript not found: $AGENT_TRANSCRIPT_PATH" >&2
  exit 0
fi

if [[ ! -f "$MINE_PY" ]]; then
  echo "[mine] subagent: mine.py not found at $MINE_PY" >&2
  exit 0
fi

echo "[mine] subagent: parsing $AGENT_TRANSCRIPT_PATH" >&2
python3 "$MINE_PY" --file "$AGENT_TRANSCRIPT_PATH" 2>&1 | while read -r line; do
  echo "[mine] $line" >&2
done

exit 0
