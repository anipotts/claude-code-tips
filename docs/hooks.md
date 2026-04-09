<!-- tested with: claude code v2.1.77 -->

# hooks

i run 11 hooks on every session. here's why -- and how to build your own.

hooks are the difference between "claude code does what i want" and "claude code does whatever it feels like." CLAUDE.md gives guidance. hooks give enforcement. one is a suggestion, the other is a wall.

---

## what hooks actually are

hooks are shell scripts (or LLM prompts) that fire on claude code lifecycle events. they intercept, validate, block, or extend what claude does -- from session start to tool execution to context compaction to shutdown.

think of them as git hooks, but for your AI coding agent.

a hook:
1. **receives JSON on stdin** -- session ID, tool name, tool input, transcript path
2. **runs your logic** -- inspect input, check conditions, log, call APIs
3. **returns via exit code:**
   - `exit 0` -- allow (proceed normally)
   - `exit 2` -- block (stop this action, stderr shown to claude)
   - anything else -- non-blocking error (logged, execution continues)

---

## the hooks i can't live without

| hook | event | what it does |
|------|-------|-------------|
| safety-guard | PreToolUse | blocks 6 categories of destructive bash commands |
| no-squash | PreToolUse | blocks squash merges -- preserves commit history |
| context-save | PreCompact | saves session state before context compression |
| panopticon | PostToolUse | logs every tool call to sqlite for later analysis |
| commit-nudge | PostToolUse | soft reminder after 8+ edits without a commit |
| md-lint-fix | PostToolUse | auto-runs markdownlint-fix on saved .md files |
| version-stamp | SessionEnd | updates "tested with" version stamps in changed files |
| stale-branch | SessionStart | warns about local branches with deleted remotes |
| notify | Notification | routes claude code alerts to macOS notifications |
hook fire frequency is driven by tool usage. from real session data:

| tool event | fires | what triggers hooks |
|------------|-------|-------------------|
| Bash (10,153) | most hook-triggering | safety-guard, no-squash, commit-nudge all fire on Bash |
| Read (9,187) | panopticon logs these | panopticon tracks all read operations |
| Edit (5,010) | panopticon tracks | md-lint-fix fires on .md edits, commit-nudge counts edits |
| Write (1,696) | panopticon tracks | version-stamp checks written files at SessionEnd |

PreToolUse hooks (safety-guard, no-squash) fire on every Bash call -- 10K+ times across all sessions. that's why they need to be fast (< 50ms).

---

## what hooks actually prevent

three categories of damage:

**destructive commands** -- safety-guard.sh blocks force-pushes to main, `rm -rf /`, `DROP TABLE`, `chmod 777` on sensitive paths, and `curl | bash` remote execution. exit code 2 = hard block, no override.

**bad merges** -- no-squash.sh blocks `--squash` on any merge. one CLAUDE.md rule saying "don't squash" gets ignored eventually. a hook that exits 2 never does.

**context loss** -- context-save.sh fires on PreCompact and writes a handoff markdown before compression. without it, every `/compact` wipes your plan. with it, claude reads the handoff and picks up where it left off.

---

## hooks vs CLAUDE.md rules

use CLAUDE.md when you want to **guide behavior** -- coding style, naming conventions, preferred patterns. claude reads it, usually follows it, occasionally forgets.

use hooks when you want to **enforce behavior** -- things that must never happen, things that must always happen. hooks don't forget. they don't get creative. they run every time.

rule of thumb: if you'd be angry when it's violated, make it a hook. if you'd be mildly annoyed, put it in CLAUDE.md.

```
CLAUDE.md:  "prefer conventional commits"     -- guidance
hook:       block force-push to main           -- enforcement
```

---

## how to set up hooks

hooks live in JSON settings files at three levels:

| location | scope | shareable |
|---|---|---|
| `~/.claude/settings.json` | all your projects | no (local) |
| `.claude/settings.json` | single project | yes (commit it) |
| `.claude/settings.local.json` | single project | no (gitignored) |

### basic config structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/your-script.sh"
          }
        ]
      }
    ]
  }
}
```

### matcher syntax

the `matcher` field is a regex that filters when hooks fire:

| events | what matcher filters | examples |
|---|---|---|
| PreToolUse, PostToolUse | tool name | `Bash`, `Edit\|Write`, `mcp__memory__.*` |
| SessionStart | how session started | `startup`, `resume`, `clear`, `compact` |
| SessionEnd | why session ended | `clear`, `logout`, `prompt_input_exit` |
| Notification | notification type | `permission_prompt`, `idle_prompt` |
| SubagentStart, SubagentStop | agent type | `Bash`, `Explore`, `Plan` |
| PreCompact | what triggered compaction | `manual`, `auto` |
| UserPromptSubmit, Stop | no matcher support | always fires |

use `"*"`, `""`, or omit `matcher` entirely to match all.

### handler types

| type | description | default timeout |
|---|---|---|
| `command` | shell command, receives JSON on stdin | 600s |
| `prompt` | single-turn LLM evaluation | 30s |
| `agent` | subagent with Read, Grep, Glob access | 60s |
| `http` | POST JSON to a URL | 30s |

`prompt` and `agent` hooks only work on: PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Stop, SubagentStop, TaskCompleted, UserPromptSubmit. everything else is `command` only.

---

## hook events quick reference

**SessionStart** -- fires on session begin/resume/clear/compact. stdout becomes conversation context. use for loading git status, TODOs, project state. can set env vars via `CLAUDE_ENV_FILE`.

**UserPromptSubmit** -- fires before claude processes each prompt. stdout becomes context. can block with exit 2.

**PreToolUse** -- fires before every tool call. this is your safety layer. can block (`exit 2`), allow, or modify tool inputs via `updatedInput` JSON.

**PermissionRequest** -- fires only when user would see a permission dialog. use for auto-approving safe commands (`npm test`) or auto-denying risky ones.

**PostToolUse** -- fires after successful tool execution. use for formatting, logging, linting. can't block (tool already ran).

**PreCompact** -- fires before context compression. use for saving session state.

**Stop** -- fires when claude finishes responding. use for post-response validation.

**Notification** -- fires on permission prompts, idle alerts. use for custom notification routing.

**SessionEnd** -- fires on session close. use for cleanup, version stamps.

> [official hooks docs](https://docs.anthropic.com/en/docs/claude-code/hooks) -- full event reference, input schemas, advanced patterns

---

## writing a hook script

every hook script in this repo follows the same pattern:

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)

# extract what you need from the JSON
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# your logic here
if echo "$COMMAND" | grep -q "git push.*--force.*main"; then
  echo "blocked: force-push to main is not allowed" >&2
  exit 2  # hard block
fi

exit 0  # allow
```

key patterns:
- always `set -euo pipefail` at the top
- read all of stdin into a variable (hooks get JSON on stdin)
- use `jq` to extract fields
- `exit 2` to block, `exit 0` to allow
- stderr on `exit 2` is shown to claude as the reason

### advanced: JSON output

instead of just exit codes, you can print JSON to stdout for finer control:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Force-push to main is not allowed"
  }
}
```

three decisions: `"allow"` (bypass permission system), `"deny"` (block), `"ask"` (prompt user).

you can also modify tool inputs before execution:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "command": "npm test -- --coverage"
    }
  }
}
```

---

## my philosophy

hooks should be:
- **invisible when things go right** -- you shouldn't notice them firing
- **loud when things go wrong** -- exit 2 with a clear reason
- **cheap to run** -- bash + jq, not python + imports
- **standalone** -- each hook is one script, no shared libraries


---

## further reading

- [hooks directory](../hooks/) -- all 11 hook scripts with full source
- [official hooks docs](https://docs.anthropic.com/en/docs/claude-code/hooks) -- complete reference
