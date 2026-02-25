#!/usr/bin/env bash
# ingest.sh -- SessionEnd (async)
# Parses the session transcript and all subagent transcripts into miner.db
# Runs async so it never blocks the session teardown.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MINE_PY="${SCRIPT_DIR}/../../scripts/mine.py"
DB="${HOME}/.claude/miner.db"
CONFIG="${HOME}/.claude/miner.json"

# check feature toggle
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(jq -r '.ingest // true' "$CONFIG" 2>/dev/null || echo "true")
  if [[ "$ENABLED" == "false" ]]; then
    exit 0
  fi
fi

# read hook payload from stdin
INPUT=$(cat)

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

if [[ -z "$TRANSCRIPT_PATH" ]]; then
  echo "[miner] ingest: no transcript_path in payload, skipping" >&2
  exit 0
fi

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "[miner] ingest: transcript not found: $TRANSCRIPT_PATH" >&2
  exit 0
fi

if [[ ! -f "$MINE_PY" ]]; then
  echo "[miner] ingest: mine.py not found at $MINE_PY" >&2
  exit 0
fi

# ingest the main session transcript
echo "[miner] ingest: parsing $TRANSCRIPT_PATH" >&2
python3 "$MINE_PY" --file "$TRANSCRIPT_PATH" 2>&1 | while read -r line; do
  echo "[miner] $line" >&2
done

# walk the subagents/ directory next to the transcript and ingest each
TRANSCRIPT_DIR="$(dirname "$TRANSCRIPT_PATH")"
SUBAGENTS_DIR="${TRANSCRIPT_DIR}/subagents"

if [[ -d "$SUBAGENTS_DIR" ]]; then
  for sub in "$SUBAGENTS_DIR"/*.jsonl; do
    [[ -f "$sub" ]] || continue
    echo "[miner] ingest: parsing subagent $sub" >&2
    python3 "$MINE_PY" --file "$sub" 2>&1 | while read -r line; do
      echo "[miner] $line" >&2
    done
  done
fi

echo "[miner] ingest: done" >&2
exit 0
