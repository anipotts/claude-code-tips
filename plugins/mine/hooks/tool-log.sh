#!/usr/bin/env bash
# tool-log.sh -- PostToolUse
# Inserts a row into tool_calls for every tool invocation.
# MUST be fast (<100ms) -- fires on every single tool call.
# Uses a single python3 -c call for JSON parsing (faster than 5 jq calls).
# No jq dependency.

set -euo pipefail

DB="${HOME}/.claude/mine.db"
CONFIG="${HOME}/.claude/mine.json"

# check feature toggle (python3 inline — no jq)
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(python3 -c "import json; print(json.load(open('$CONFIG')).get('tool_log', True))" 2>/dev/null || echo "True")
  if [[ "$ENABLED" == "False" ]]; then
    exit 0
  fi
fi

# bail if db does not exist
if [[ ! -f "$DB" ]]; then
  exit 0
fi

# read hook payload from stdin, extract all fields in one python3 call
INPUT=$(cat)
FIELDS=$(python3 -c "
import json, sys
d = json.loads(sys.stdin.read())
tn = d.get('tool_name', '')
si = d.get('session_id', '')
ti = d.get('tool_use_id', '')
ts = d.get('timestamp', '')
inp = d.get('tool_input', {})
if tn in ('Read', 'Write', 'Edit'):
    s = inp.get('file_path', '')
elif tn == 'Bash':
    s = inp.get('command', '')[:200]
elif tn in ('Grep', 'Glob'):
    s = inp.get('pattern', '')
elif tn == 'Task':
    s = (inp.get('description') or inp.get('prompt') or '')[:200]
elif tn in ('TodoRead', 'TodoWrite'):
    s = tn
else:
    vals = list(inp.values())
    s = str(vals[0])[:200] if vals else ''
print(f'{tn}\t{si}\t{ti}\t{ts}\t{s}')
" <<< "$INPUT" 2>/dev/null)

if [[ -z "$FIELDS" ]]; then
  exit 0
fi

IFS=$'\t' read -r TOOL_NAME SESSION_ID TOOL_USE_ID TIMESTAMP INPUT_SUMMARY <<< "$FIELDS"

if [[ -z "$TOOL_NAME" || -z "$SESSION_ID" ]]; then
  exit 0
fi

# escape single quotes for sqlite safety
escape() { echo "$1" | sed "s/'/''/g"; }

S_SESSION=$(escape "$SESSION_ID")
S_TOOL_USE_ID=$(escape "$TOOL_USE_ID")
S_TOOL_NAME=$(escape "$TOOL_NAME")
S_INPUT_SUMMARY=$(escape "$INPUT_SUMMARY")
S_TIMESTAMP=$(escape "${TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}")

sqlite3 "$DB" ".timeout 5000" "INSERT INTO tool_calls (session_id, tool_use_id, tool_name, input_summary, timestamp) VALUES ('${S_SESSION}', '${S_TOOL_USE_ID}', '${S_TOOL_NAME}', '${S_INPUT_SUMMARY}', '${S_TIMESTAMP}');"

exit 0
