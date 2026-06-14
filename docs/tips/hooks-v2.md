<!-- tested with: claude code v2.1.122 -->

# hooks v2: the five handler types

hooks come in five flavors now (v2.1.118 added `mcp_tool`). pick the wrong one and you burn tokens, add latency, or silently fail.

## the five types





### managed settings in hooks (v2.1.175+)

### managed settings in hooks (v2.1.175+, stable through v2.1.176)

when `enforceAvailableModels` is enabled, prompt and agent hooks that select models may not get their requested model. a hook that tries to use opus when only sonnet is allowed will silently fall back to sonnet. design hooks that are agnostic to model, or check the active model in your hook logic before making model-specific assumptions.

this affects hooks at all handler types (command, http, prompt, agent, mcp_tool). test hook behavior in your permission-restricted environment before deploying.

### safety prompts for sensitive file writes (v2.1.160+)

v2.1.160 added prompts before writing to:
- Shell startup files (`.zshenv`, `.zlogin`, `.bash_login`)
- Git config (`~/.config/git/`)
- Build-tool config files (`.npmrc`, `.yarnrc*`, `bunfig.toml`, `.bazelrc`, `.pre-commit-config.yaml`, `.devcontainer/`)

These prompts apply in `acceptEdits` mode and prevent unintended command execution. Hooks that attempt writes to these paths will trigger user confirmation before proceeding.

### the five types

| type | what it is | timeout | cost | best for |
|------|-----------|---------|------|----------|
| `command` | shell script, receives JSON on stdin | 600s | free | safety checks, logging, file ops |
| `http` | POST to a URL, JSON body | 30s | free | external services, webhooks, metrics |
| `prompt` | single-turn LLM eval | 30s | tokens | nuanced decisions, context-aware checks |
| `agent` | subagent with full tool access (Read, Grep, Glob) | 60s | expensive | complex decisions that need file reads |
| `mcp_tool` (v2.1.118+) | directly invoke an MCP tool on a connected server | 60s | free (no child process) | hook work that an MCP server already owns the state for |



**note (v2.1.172+):** hook behavior and available types may have evolved. consult `/doctor` or the official docs at code.claude.com/docs to verify current hook capabilities and parameters.

### effort.level in hooks (v2.1.133+)

all hooks now receive the active effort setting via two channels:

- **JSON input**: `effort.level` field (one of: `low`, `medium`, `high`, `xhigh`, `max`)
- **Bash environment**: `$CLAUDE_EFFORT` variable

use this to adjust hook behavior based on effort mode. example: safety-guard might be stricter at `low` effort but more permissive at `max`.

### PostToolUse output replacement (v2.1.121+)

PostToolUse hooks can replace tool output before claude sees it. return `{"hookSpecificOutput": {"PostToolUse": {"updatedToolOutput": "your replacement"}}}` to modify what claude receives. use case: filter sensitive output, normalize error messages, add context.

### Stop and SubagentStop context (v2.1.145+)

Stop and SubagentStop hooks now receive `background_tasks` and `session_crons` fields. use this to warn before exiting with active background work or log task completion state.

### effort level in hooks (v2.1.133+)

hooks now receive the active effort setting via two channels:

- **JSON input**: `effort.level` field (one of: `low`, `medium`, `high`, `xhigh`, `max`)
- **Bash environment**: `$CLAUDE_EFFORT` variable

use this to adjust hook behavior based on effort mode. example: safety-guard might be stricter at `low` effort but more permissive at `max`.

```bash
#!/usr/bin/env bash
INPUT=$(cat)
EFFORT=$(echo "$INPUT" | jq -r '.effort.level // "medium"')
# or from bash env:
EFFORT="$CLAUDE_EFFORT"

if [[ "$EFFORT" == "max" ]]; then
  # relax some constraints at max effort
  exit 0
fi
```

### updatedToolOutput (PostToolUse, v2.1.121+)

PostToolUse hooks can now replace tool output before claude sees it. return `{"hookSpecificOutput": {"PostToolUse": {"updatedToolOutput": "your replacement text"}}}` to modify what claude receives from the tool.

use case: filter sensitive output (API keys, internal IPs), normalize error messages, add context. example: a bash hook that catches test failures and appends a link to the failing test file in your CI dashboard.



### Stop and SubagentStop hook fields (v2.1.145+)

Stop and SubagentStop hooks now receive additional context about background tasks and session crons:

```bash
#!/usr/bin/env bash
INPUT=$(cat)
BACKGROUND_TASKS=$(echo "$INPUT" | jq -r '.background_tasks // []')
SESSION_CRONS=$(echo "$INPUT" | jq -r '.session_crons // []')

# react to active background work when session ends
if [[ $(echo "$BACKGROUND_TASKS" | jq 'length') -gt 0 ]]; then
  echo "warning: background tasks still running, check status before exiting"
  exit 1
fi
exit 0
```

use this to warn before stopping a session with active background work, or to log task completion state.



### safe mode disables hooks (v2.1.169+)

starting claude code with `--safe-mode` disables all hooks, plugins, skills, and MCP servers. this is useful for troubleshooting when customizations are causing problems. hooks will not fire during safe mode sessions.

### mcp_tool event hooks (v2.1.126+)

MCP tool handlers can now be invoked from hooks using the `mcp_tool` type with event-driven logic. this lets you intercept and react to MCP calls without spinning up a shell or http process.

### updatedToolOutput (PostToolUse, v2.1.121+)

PostToolUse hooks can now replace tool output before claude sees it. return `{"hookSpecificOutput": {"PostToolUse": {"updatedToolOutput": "your replacement text"}}}` to modify what claude receives from the tool.

use case: filter sensitive output (API keys, internal IPs), normalize error messages, add context. example: a bash hook that catches test failures and appends a link to the failing test file in your CI dashboard.

```json
{
  "type": "command",
  "command": "~/.claude/hooks/test-failure-context.sh",
  "events": ["PostToolUse"],
  "matcher": "Bash"
}
```

the script receives the tool result as `tool_result.content[0].text` in the stdin JSON. output the modified text and exit 0. claude sees your version, not the original.





example: filter API keys and internal IPs from bash output:

```bash
#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
OUTPUT=$(echo "$INPUT" | jq -r '.tool_result.content[0].text // empty')

# redact sensitive patterns
REDACTED=$(echo "$OUTPUT" | sed -E 's/(api[_-]?key|authorization)[:=] *[^ ]+/\1: [REDACTED]/gi')

echo "{\"hookSpecificOutput\": {\"PostToolUse\": {\"updatedToolOutput\": \"$REDACTED\"}}}"
```

### mcp_tool event hooks (v2.1.126+)

MCP tool handlers can now be invoked from hooks using the `mcp_tool` type. this lets you intercept and react to MCP calls without spinning up a shell or http process:

```json
{
  "type": "mcp_tool",
  "server": "database",
  "tool": "query_audit",
  "input": { "table": "users", "limit": 10 }
}
```

use case: a PreToolUse hook that calls an MCP audit tool to log sensitive queries before they execute. no shell overhead, no http latency.

### command

the workhorse. runs a shell command, reads JSON from stdin, returns exit 0 (allow) or exit 2 (block). every hook in this repo is a command hook.

```json
{
  "type": "command",
  "command": "~/.claude/hooks/safety-guard.sh"
}
```

performance target: under 50ms for PreToolUse hooks. these fire on every single tool call. a slow command hook adds latency to everything.



### accessing session ID in hooks

v2.1.132 added `CLAUDE_CODE_SESSION_ID` environment variable to the Bash tool subprocess. hooks can now use this to correlate tool calls with sessions. set it in your hook scripts for logging or external service integration:

```bash
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
# or from Bash subprocess env:
echo "$CLAUDE_CODE_SESSION_ID"
```

### http

POST to a URL with the hook's JSON payload. good for sending events to logging services, Slack, or custom dashboards. 30s timeout.

```json
{
  "type": "http",
  "url": "https://your-service.com/hooks/tool-use"
}
```

one caveat: http hooks are silently blocked for SessionStart and Setup events. if you need to hit an external service on session start, use a command hook that runs `curl` instead.

### prompt

sends the hook context to claude for a single-turn evaluation. claude reads the tool name, input, and your instruction, then returns allow/block/modify. costs tokens but can make nuanced decisions a regex can't.

```json
{
  "type": "prompt",
  "prompt": "block any bash command that modifies files outside the current git repo"
}
```

only works on: PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Stop, SubagentStop, TaskCompleted, UserPromptSubmit.

### agent

a full subagent that can read files, grep, glob. the most powerful type and the most expensive. use it when the decision requires understanding code context, not just the tool input.

```json
{
  "type": "agent",
  "prompt": "check if this edit follows the project's testing conventions by reading the test files"
}
```

same event restrictions as prompt hooks. 60s timeout. each invocation spins up its own context window.

### mcp_tool (v2.1.118+)

directly invoke a tool on an already-connected MCP server. no shell child process, no http round-trip. the hook executes inside the running mcp server's process.

```json
{
  "type": "mcp_tool",
  "server": "cc",
  "tool": "cc",
  "input": { "action": "check" },
  "timeout": 5
}
```

fields:

- `server`: the mcp server name as configured in the plugin's `mcpServers` block (or user `settings.json`).
- `tool`: the tool name exposed by that server.
- `input`: the tool arguments. string values support `${path}` substitution from the hook's stdin payload, e.g. `"file_path": "${tool_input.file_path}"`.
- `timeout`: seconds, default 60.

return value: whatever the mcp tool returns as text is treated as the hook's stdout. for context-injecting events (SessionStart, UserPromptSubmit, UserPromptExpansion, PreToolUse, PostToolUse, PostToolUseFailure), the returned text is wrapped by claude code into the `{hookSpecificOutput: {hookEventName: ..., additionalContext: "..."}}` envelope and injected. for other events (like SessionEnd), output is logged but not surfaced to the model.

when to reach for mcp_tool: your plugin already ships an MCP server, and some hook work (e.g. reading the session roster, marking an inbox read) is really a tool call in disguise. removing the shell/node shim cuts a child process per hook fire and removes a file that can drift from the server's state model. the `cc` plugin in this repo uses three mcp_tool hooks (SessionStart, UserPromptSubmit, SessionEnd) to talk to its own `cc` server.

one gotcha: SessionStart hooks sometimes fire before the MCP server is fully connected, in which case the call produces a non-blocking error. design the server's own startup to self-bootstrap (don't rely on SessionStart hook success for correctness).

## the async pattern

command hooks support `"async": true`. this makes them non-blocking. the hook fires, but claude doesn't wait for it to finish.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/monitoring-start.sh",
            "async": true
          }
        ]
      }
    ]
  }
}
```

critical for SessionStart hooks where blocking delays startup. claudemon uses async command hooks for monitoring bc http hooks are silently blocked for SessionStart and Setup events. without async, you'd add seconds of latency to every session start.

only `command` hooks support async. prompt, agent, and http hooks always run synchronously.

## the matcher system

matchers are regex filters that control when hooks fire. without a matcher, the hook fires on every event.

```json
{
  "matcher": "Bash",
  "hooks": [{ "type": "command", "command": "safety-guard.sh" }]
}
```

| matcher | fires on |
|---------|----------|
| `"Bash"` | Bash tool calls only |
| `"Edit\|Write"` | Edit or Write calls |
| `"mcp__memory__.*"` | any MCP memory tool |
| `""` or omitted | everything |

what matchers filter depends on the event:

| event | matcher filters by |
|-------|-------------------|
| PreToolUse, PostToolUse | tool name |
| SessionStart | start type (`startup`, `resume`, `clear`, `compact`) |
| SessionEnd | end reason (`clear`, `logout`, `prompt_input_exit`) |
| Notification | notification type |
| PreCompact | trigger (`manual`, `auto`) |

**performance note:** PreToolUse hooks fire on every tool call. across real sessions, that's 10K+ Bash calls alone. matchers keep irrelevant hooks from running, but the hooks that do match still need to be fast. target under 50ms for command hooks on PreToolUse.

## hook events

| event | when it fires | common use |
|-------|--------------|------------|
| SessionStart | session begin, resume, clear, compact | load project state, set env vars |
| SessionEnd | session close | cleanup, version stamps |
| PreToolUse | before every tool call | safety checks, input validation |
| PostToolUse | after tool execution | logging, linting, formatting |
| PreCompact | before context compression | save session state |
| Notification | permission prompts, idle alerts | custom notification routing |
| Stop | claude finishes responding | post-response validation |
| Setup | first install | one-time setup tasks |

SessionStart stdout becomes conversation context. PreToolUse can block (exit 2) or modify inputs. PostToolUse can only observe, the tool already ran.

## which type i use and why

day-to-day: command hooks handle safety checks, logging, file ops, and session sync. they're fast (sub-50ms with jq), cheap (no tokens), and predictable. prompt hooks cost tokens and latency per fire, and i only reach for them when i genuinely need a judgment call ("is this change architecturally safe?") rather than a regex match. agent hooks are heavier still and reserved for cases that need code context to decide.

mcp_tool hooks (new in v2.1.118) are the right call when my plugin already ships an MCP server and some hook work is literally "call one of my server's tools." the `cc` plugin in this repo is the canonical example: its SessionStart, UserPromptSubmit, and SessionEnd hooks all invoke the `cc` server's `cc` tool with different `action` verbs. no shell shim, no drift between hook code and server state, one fewer child process per hook fire.

start with a command hook on PreToolUse. safety-guard.sh in this repo is a good first hook. consider mcp_tool for any hook whose body is "shell out to call my own MCP server."

## try it

1. start with a command hook on PreToolUse. [safety-guard.sh](../../hooks/safety-guard.sh) is a good first hook.
2. add `"async": true` to any SessionStart hooks that don't need to block startup.
3. always set a specific matcher. `"Bash"` is better than matching everything.

[full hooks guide &rarr;](../hooks.md) | [hook scripts &rarr;](../../hooks/)

---

### v2.1.163 changes to hook event data

v2.1.163+ may include additional event context for hooks. verify your hook inputs if upgrading from v2.1.122. check `/doctor` for hook compatibility warnings.

---

### verification note (v2.1.172+)

hook behavior and available types may have evolved since v2.1.118. verify current hook capabilities via `/doctor` or the official docs at code.claude.com/docs. the five types documented here reflect v2.1.122+ behavior; check your version for any changes to handler types, timeout values, or JSON schema.
