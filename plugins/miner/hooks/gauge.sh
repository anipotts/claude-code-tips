#!/usr/bin/env bash
# gauge.sh -- UserPromptSubmit (model advisor)
# Classifies prompt complexity and suggests model switches when appropriate.
# Simple prompts on expensive models get a nudge to haiku.
# Complex prompts on haiku get a nudge to sonnet.
# stdout goes to Claude as context.

set -euo pipefail

DB="${HOME}/.claude/miner.db"
CONFIG="${HOME}/.claude/miner.json"

# check feature toggle
if [[ -f "$CONFIG" ]]; then
  ENABLED=$(jq -r '.gauge // true' "$CONFIG" 2>/dev/null || echo "true")
  if [[ "$ENABLED" == "false" ]]; then
    exit 0
  fi
fi

# read hook payload from stdin
INPUT=$(cat)

PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')
MODEL=$(echo "$INPUT" | jq -r '.model // empty')

if [[ -z "$PROMPT" || -z "$MODEL" ]]; then
  exit 0
fi

# normalize prompt to lowercase for keyword matching
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

# classify prompt complexity based on leading intent keywords
IS_SIMPLE=false
IS_COMPLEX=false

# simple patterns: quick lookups, reads, status checks
SIMPLE_KEYWORDS="^(read |show |list |check |what |find |where |status|version|help|look at|open |cat |print |display |how many|count |which )"
if echo "$PROMPT_LOWER" | grep -qE "$SIMPLE_KEYWORDS"; then
  IS_SIMPLE=true
fi

# complex patterns: multi-step work, architecture, creation
COMPLEX_KEYWORDS="(refactor|architect|design|implement|build|create|migrate|rewrite|restructure|overhaul|port |convert|integrate|set up|scaffold|optimize|rearchitect|full |complete |entire )"
if echo "$PROMPT_LOWER" | grep -qE "$COMPLEX_KEYWORDS"; then
  IS_COMPLEX=true
fi

# if both match, complexity wins (create > show)
if [[ "$IS_SIMPLE" == "true" && "$IS_COMPLEX" == "true" ]]; then
  IS_SIMPLE=false
fi

# short prompts (<30 chars) are likely simple regardless
PROMPT_LEN=${#PROMPT}
if [[ "$PROMPT_LEN" -lt 30 && "$IS_COMPLEX" == "false" ]]; then
  IS_SIMPLE=true
fi

# long prompts (>500 chars) are likely complex regardless
if [[ "$PROMPT_LEN" -gt 500 && "$IS_SIMPLE" == "false" ]]; then
  IS_COMPLEX=true
fi

# model classification
IS_EXPENSIVE=false
IS_CHEAP=false

case "$MODEL" in
  *opus*|*sonnet*)
    IS_EXPENSIVE=true
    ;;
  *haiku*)
    IS_CHEAP=true
    ;;
esac

# output advice to stdout (visible to Claude)
if [[ "$IS_EXPENSIVE" == "true" && "$IS_SIMPLE" == "true" ]]; then
  echo "[miner:gauge] This looks like a quick lookup -- haiku would save ~95%. Use /model haiku."
elif [[ "$IS_CHEAP" == "true" && "$IS_COMPLEX" == "true" ]]; then
  echo "[miner:gauge] This is complex work -- consider /model sonnet for better results."
fi

exit 0
