---
description: session roster and messaging
argument-hint: [name] [message]
model: haiku
allowed-tools: [Bash, mcp__plugin_cc_cc__cc_send]
---
No args: `bash ${CLAUDE_PLUGIN_ROOT}/scripts/roster.sh "$(pwd)"`
With name+message: call cc_send, to=first word, text=rest.
$ARGUMENTS
