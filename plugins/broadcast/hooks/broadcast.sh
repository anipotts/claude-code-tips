#!/bin/bash
set -euo pipefail

# tested with: claude code v1.0.34
# broadcast — async notification on git commit/push
# fires a webhook and exits immediately. completely non-blocking.
#
# configure your endpoint:
#   export BROADCAST_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
#   export BROADCAST_CHANNEL="#shipped"  (optional, for slack)
#
# supports: slack, discord, generic webhook, macOS notification
# just set BROADCAST_WEBHOOK and it figures out the format

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# only fire on git commit or git push
if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

IS_COMMIT=false
IS_PUSH=false

if echo "$COMMAND" | grep -qE 'git\s+commit'; then
  IS_COMMIT=true
fi

if echo "$COMMAND" | grep -qE 'git\s+push'; then
  IS_PUSH=true
fi

if [[ "$IS_COMMIT" == "false" && "$IS_PUSH" == "false" ]]; then
  exit 0
fi

# build the message
PROJECT=$(basename "$(pwd)")
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
COMMIT_MSG=$(git log -1 --pretty=%s 2>/dev/null || echo "")

if [[ "$IS_PUSH" == "true" ]]; then
  MSG="pushed to $BRANCH in $PROJECT"
elif [[ "$IS_COMMIT" == "true" ]]; then
  MSG="committed in $PROJECT: $COMMIT_MSG"
fi

# --- notification targets (all async, all fire-and-forget) ---

# slack webhook
if [[ -n "${BROADCAST_WEBHOOK:-}" ]]; then
  if echo "$BROADCAST_WEBHOOK" | grep -q "hooks.slack.com"; then
    CHANNEL="${BROADCAST_CHANNEL:-}"
    PAYLOAD=$(jq -n --arg text "$MSG" --arg channel "$CHANNEL" \
      'if $channel != "" then {text: $text, channel: $channel} else {text: $text} end')
    curl -s -X POST -H 'Content-Type: application/json' -d "$PAYLOAD" "$BROADCAST_WEBHOOK" &>/dev/null &

  # discord webhook
  elif echo "$BROADCAST_WEBHOOK" | grep -q "discord.com"; then
    curl -s -X POST -H 'Content-Type: application/json' \
      -d "{\"content\": \"$MSG\"}" "$BROADCAST_WEBHOOK" &>/dev/null &

  # generic webhook (POST with json body)
  else
    curl -s -X POST -H 'Content-Type: application/json' \
      -d "{\"message\": \"$MSG\", \"project\": \"$PROJECT\", \"branch\": \"$BRANCH\"}" \
      "$BROADCAST_WEBHOOK" &>/dev/null &
  fi
fi

# macos notification (always fires if on mac)
if command -v osascript &>/dev/null; then
  osascript -e "display notification \"$MSG\" with title \"claude code\"" &>/dev/null &
fi

exit 0
