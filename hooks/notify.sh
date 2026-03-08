#!/usr/bin/env bash
set -euo pipefail
# tested with: claude code v1.0.34
# =============================================================================
# Notify — Custom notification routing for Claude Code
# =============================================================================
# Fires when Claude Code sends a notification (e.g., task complete, waiting
# for input, error encountered).
#
# Hook type: Notification
#
# This template uses macOS native notifications. Replace the notification
# logic below with your own integration:
#
#   Slack:     curl -X POST -H 'Content-type: application/json' \
#                --data "{\"text\":\"$MESSAGE\"}" "$SLACK_WEBHOOK_URL"
#
#   Pushover:  curl -s --form-string "token=$PUSHOVER_TOKEN" \
#                --form-string "user=$PUSHOVER_USER" \
#                --form-string "message=$MESSAGE" \
#                https://api.pushover.net/1/messages.json
#
#   Twilio:    curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$SID/Messages.json" \
#                --data-urlencode "Body=$MESSAGE" \
#                -d "From=$FROM" -d "To=$TO" \
#                -u "$SID:$AUTH_TOKEN"
#
#   ntfy:      curl -d "$MESSAGE" "https://ntfy.sh/your-topic"
# =============================================================================

# Read the hook payload from stdin
INPUT=$(cat)

# Parse the notification message and session ID
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude Code notification"')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
SHORT_SESSION="${SESSION_ID:0:8}"

# ---------------------------------------------------------------------------
# macOS notification banner (replace this block with your own integration)
# ---------------------------------------------------------------------------
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\" subtitle \"Session: $SHORT_SESSION\""
fi

# Optional: play a notification sound (macOS)
if [ -f /System/Library/Sounds/Glass.aiff ]; then
  afplay /System/Library/Sounds/Glass.aiff &
fi

exit 0
