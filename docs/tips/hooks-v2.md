<!-- tested with: claude code v2.1.94 -->

# hooks v2: the four handler types

hooks come in four flavors. pick the wrong one and you burn tokens, add latency, or silently fail.

## the four types

| type | what it is | timeout | cost | best for |
|------|-----------|---------|------|----------|
| `command` | shell script, receives JSON on stdin | 600s | free | safety checks, logging, file ops |
| `http` | POST to a URL, JSON body | 30s | free | external services, webhooks, metrics |
| `prompt` | single-turn LLM eval | 30s | tokens | nuanced decisions, context-aware checks |
| `agent` | subagent with full tool access (Read, Grep, Glob) | 60s | expensive | complex decisions that need file reads |

`command` handles 90%+ of cases. it's the fastest, cheapest, and most predictable. the others exist for when bash can't make the decision alone.

### command

the workhorse. runs a shell command, reads JSON from stdin, returns exit 0 (allow) or exit 2 (block). every hook in this repo is a command hook.

```json
{
  "type": "command",
  "command": "~/.claude/hooks/safety-guard.sh"
}
```

performance target: under 50ms for PreToolUse hooks. these fire on every single tool call. a slow command hook adds latency to everything.

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

[FILL: break down your 11 hooks by type. something like "all 11 are command hooks. i tried a prompt hook for code review gating and it added 2-3s per tool call. not worth it for the marginal improvement over regex matching. the only case where i'd reach for prompt/agent hooks is..."]

## try it

1. start with a command hook on PreToolUse. [safety-guard.sh](../../hooks/safety-guard.sh) is a good first hook.
2. add `"async": true` to any SessionStart hooks that don't need to block startup.
3. always set a specific matcher. `"Bash"` is better than matching everything.

[full hooks guide &rarr;](../hooks.md) | [hook scripts &rarr;](../../hooks/)
