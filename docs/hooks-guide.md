# The Complete Claude Code Hooks Guide

**A practical reference for every hook event, with tested examples.**

---

## What Are Hooks?

Hooks are shell scripts (or LLM prompts) that fire on Claude Code lifecycle events. They let you intercept, validate, block, or extend what Claude does at every stage -- from session start to tool execution to context compaction to shutdown.

Think of them as Git hooks, but for your AI coding agent.

## Hook Anatomy

A hook is a shell script that:

1. **Receives JSON on stdin** -- session ID, tool name, tool input, transcript path, and more
2. **Runs your logic** -- inspect the input, check conditions, log, call APIs, whatever you need
3. **Returns via exit code and stdout:**
   - `exit 0` -- allow (proceed normally). Stdout is parsed for optional JSON control fields
   - `exit 2` -- block (stop this action). Stderr is shown to Claude as the reason
   - Any other exit code -- non-blocking error (logged in verbose mode, execution continues)

Stdout text on `exit 0` is added as context to the conversation for `SessionStart` and `UserPromptSubmit`. For other events, stdout is only visible in verbose mode (`Ctrl+O`) unless you return structured JSON.

## Configuration

Hooks live in JSON settings files. There are three levels of nesting:

1. Choose a **hook event** (`PreToolUse`, `Stop`, etc.)
2. Add a **matcher** to filter when it fires (tool name, session type, etc.)
3. Define one or more **hook handlers** to run when matched

### Config Locations

| Location | Scope | Shareable |
|---|---|---|
| `~/.claude/settings.json` | All your projects | No (local to your machine) |
| `.claude/settings.json` | Single project | Yes (commit to repo) |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Managed policy settings | Organization-wide | Yes (admin-controlled) |

Project settings override user-level settings. Enterprise admins can use `allowManagedHooksOnly` to block user and project hooks.

### Basic Config Structure

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

### Matcher Syntax

The `matcher` field is a **regex** that filters when hooks fire. Each event type matches on a different field:

| Events | What matcher filters | Examples |
|---|---|---|
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest` | Tool name | `Bash`, `Edit\|Write`, `mcp__memory__.*` |
| `SessionStart` | How session started | `startup`, `resume`, `clear`, `compact` |
| `SessionEnd` | Why session ended | `clear`, `logout`, `prompt_input_exit` |
| `Notification` | Notification type | `permission_prompt`, `idle_prompt` |
| `SubagentStart`, `SubagentStop` | Agent type | `Bash`, `Explore`, `Plan` |
| `PreCompact` | What triggered compaction | `manual`, `auto` |
| `ConfigChange` | Config source | `user_settings`, `project_settings` |
| `UserPromptSubmit`, `Stop`, `TeammateIdle`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove` | No matcher support | Always fires |

Use `"*"`, `""`, or omit `matcher` entirely to match all occurrences.

MCP tools follow the naming pattern `mcp__<server>__<tool>` (e.g., `mcp__memory__create_entities`). Match them with regex: `mcp__memory__.*` matches all tools from the memory server.

### Hook Handler Types

Claude Code supports four handler types:

| Type | Description | Default Timeout |
|---|---|---|
| `command` | Runs a shell command. Receives JSON on stdin, returns via exit codes and stdout | 600s |
| `prompt` | Sends a prompt to a fast Claude model for single-turn evaluation | 30s |
| `agent` | Spawns a subagent with access to Read, Grep, Glob for multi-turn verification | 60s |
| `http` | POSTs JSON payload to a URL, receives JSON response. No shell required | 30s |

Not all events support all types. `prompt` and `agent` hooks are supported for: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `Stop`, `SubagentStop`, `TaskCompleted`, `UserPromptSubmit`. All other events support only `command` hooks.

### Common Input Fields

Every hook receives these fields via stdin as JSON:

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/you/.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse"
}
```

Each event adds its own fields on top of these.

### JSON Output (Advanced Control)

Instead of just using exit codes, you can `exit 0` and print a JSON object to stdout for finer-grained control:

```json
{
  "continue": false,
  "stopReason": "Build failed, fix errors before continuing",
  "suppressOutput": false,
  "systemMessage": "Warning: approaching rate limit"
}
```

| Field | Default | Description |
|---|---|---|
| `continue` | `true` | If `false`, Claude stops processing entirely |
| `stopReason` | none | Message shown to user when `continue` is `false` |
| `suppressOutput` | `false` | If `true`, hides stdout from verbose mode |
| `systemMessage` | none | Warning message shown to the user |

---

## All Hook Events -- Complete Reference

### SessionStart

**When it fires:** When a session begins, resumes, or restarts after `/clear` or compaction.

**Matcher values:** `startup`, `resume`, `clear`, `compact`

**Use it for:** Loading context (git status, TODO lists), setting environment variables, logging session starts, injecting project state.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "SessionStart",
  "source": "startup",
  "model": "claude-sonnet-4-6"
}
```

**Key behavior:** Anything your hook prints to stdout is added as context that Claude can see and act on. This is one of only two events (along with `UserPromptSubmit`) where plain stdout becomes conversation context.

**Special feature:** SessionStart hooks have access to `CLAUDE_ENV_FILE`. Write `export` statements to this file to persist environment variables for all subsequent Bash commands in the session:

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"
  echo 'export DEBUG=true' >> "$CLAUDE_ENV_FILE"
fi

# Print context for Claude
echo "Project: $(basename "$PWD")"
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'not a git repo')"
echo "Node: $(node -v 2>/dev/null || echo 'not installed')"
exit 0
```

**Can block?** No. Exit 2 shows stderr to user only.

---

### UserPromptSubmit

**When it fires:** When the user submits a prompt, before Claude processes it.

**Matcher:** Not supported (fires on every prompt).

**Use it for:** Injecting dynamic context based on the prompt, validating or blocking certain types of requests, adding sprint/project context automatically.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Write a function to calculate the factorial of a number"
}
```

**Decision control:** Return JSON with `"decision": "block"` to prevent processing:

```json
{
  "decision": "block",
  "reason": "This request requires admin approval"
}
```

Plain text stdout is added as context (same as SessionStart).

**Can block?** Yes. Exit 2 blocks and erases the prompt.

---

### PreToolUse

**When it fires:** After Claude generates tool parameters, before executing the tool call.

**Matcher values:** Tool names -- `Bash`, `Edit`, `Write`, `Read`, `Glob`, `Grep`, `Task`, `WebFetch`, `WebSearch`, and any MCP tool names (`mcp__server__tool`).

**Use it for:** Blocking dangerous commands, enforcing coding standards before writes, auto-approving safe operations, modifying tool inputs before execution.

**Input JSON (Bash example):**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test",
    "description": "Run test suite",
    "timeout": 120000
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

**Tool input fields by tool:**

| Tool | Key Fields |
|---|---|
| `Bash` | `command`, `description`, `timeout`, `run_in_background` |
| `Write` | `file_path`, `content` |
| `Edit` | `file_path`, `old_string`, `new_string`, `replace_all` |
| `Read` | `file_path`, `offset`, `limit` |
| `Glob` | `pattern`, `path` |
| `Grep` | `pattern`, `path`, `glob`, `output_mode` |
| `WebFetch` | `url`, `prompt` |
| `WebSearch` | `query`, `allowed_domains`, `blocked_domains` |
| `Task` | `prompt`, `description`, `subagent_type`, `model` |

**Decision control:** PreToolUse uses `hookSpecificOutput` (not top-level `decision`):

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Force-push to main is not allowed"
  }
}
```

Three outcomes: `"allow"` (bypass permission system), `"deny"` (block the tool call), `"ask"` (prompt the user to confirm).

You can also **modify tool inputs** before execution with `updatedInput`:

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

**Can block?** Yes. Exit 2 or `permissionDecision: "deny"` blocks the tool call.

---

### PermissionRequest

**When it fires:** When a permission dialog is about to be shown to the user.

**Matcher values:** Tool names (same as PreToolUse).

**Use it for:** Auto-approving safe commands (`npm test`, `npm run lint`), auto-denying risky operations, removing permission friction for known-safe workflows.

**Key difference from PreToolUse:** PreToolUse fires before every tool execution regardless of permission status. PermissionRequest only fires when the user would actually see a permission dialog.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "PermissionRequest",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf node_modules",
    "description": "Remove node_modules directory"
  },
  "permission_suggestions": [
    { "type": "toolAlwaysAllow", "tool": "Bash" }
  ]
}
```

**Decision control:**

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": {
        "command": "npm run lint"
      }
    }
  }
}
```

For deny:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "This operation requires manual approval",
      "interrupt": true
    }
  }
}
```

**Can block?** Yes. `"behavior": "deny"` or exit 2 denies the permission.

---

### PostToolUse

**When it fires:** Immediately after a tool completes successfully.

**Matcher values:** Tool names (same as PreToolUse).

**Use it for:** Running formatters/linters after file writes, logging changes, triggering notifications, validating output.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

**Decision control:** Use top-level `decision`:

```json
{
  "decision": "block",
  "reason": "Linter found 3 errors in the written file"
}
```

**Can block?** No (tool already ran). Exit 2 shows stderr to Claude as feedback.

---

### PostToolUseFailure

**When it fires:** After a tool execution fails (throws errors or returns failure).

**Matcher values:** Tool names (same as PreToolUse).

**Use it for:** Alerting on failures, logging errors, providing corrective context to Claude, suggesting alternatives.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUseFailure",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  },
  "tool_use_id": "toolu_01ABC123...",
  "error": "Command exited with non-zero status code 1",
  "is_interrupt": false
}
```

**Can block?** No (tool already failed). Exit 2 shows stderr to Claude.

---

### Notification

**When it fires:** When Claude Code sends a notification.

**Matcher values:** `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`

**Use it for:** Custom notification routing (Slack, Discord, macOS sounds), monitoring idle state, tracking permission requests.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "Notification",
  "message": "Claude needs your permission to use Bash",
  "title": "Permission needed",
  "notification_type": "permission_prompt"
}
```

**Can block?** No. Used for side effects only.

---

### SubagentStart

**When it fires:** When a Claude Code subagent is spawned via the Task tool.

**Matcher values:** Agent type names -- `Bash`, `Explore`, `Plan`, or custom agent names from `.claude/agents/`.

**Use it for:** Tracking parallel work, injecting context into subagents, logging resource usage.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStart",
  "agent_id": "agent-abc123",
  "agent_type": "Explore"
}
```

**Decision control:** Cannot block subagent creation, but can inject context:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SubagentStart",
    "additionalContext": "Follow security guidelines for this task"
  }
}
```

**Can block?** No. Exit 2 shows stderr to user only.

---

### SubagentStop

**When it fires:** When a subagent finishes responding.

**Matcher values:** Agent type names (same as SubagentStart).

**Use it for:** Aggregating results, triggering next steps, validating subagent output, logging completion.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../abc123.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false,
  "agent_id": "def456",
  "agent_type": "Explore",
  "agent_transcript_path": "~/.claude/projects/.../abc123/subagents/agent-def456.jsonl",
  "last_assistant_message": "Analysis complete. Found 3 potential issues..."
}
```

**Decision control:** Same as Stop hooks -- `"decision": "block"` prevents the subagent from stopping.

**Can block?** Yes. Exit 2 or `"decision": "block"` prevents the subagent from stopping.

---

### Stop

**When it fires:** When the main Claude Code agent finishes responding. Does NOT fire on user interrupts.

**Matcher:** Not supported (fires on every stop).

**Use it for:** Keep-alive loops (force Claude to continue), auto-saving state, verifying task completion, running final checks.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": true,
  "last_assistant_message": "I've completed the refactoring. Here's a summary..."
}
```

**Critical field:** `stop_hook_active` is `true` when Claude is already continuing as a result of a previous Stop hook. **You must check this** to prevent infinite loops.

**Decision control:**

```json
{
  "decision": "block",
  "reason": "Tests are still failing. Fix the remaining 2 errors."
}
```

**Can block?** Yes. Exit 2 or `"decision": "block"` prevents Claude from stopping and continues the conversation with the reason as Claude's next instruction.

> **Warning:** Exit 2 in a Stop hook means "keep going" -- this is counterintuitive. In most hooks, exit 2 means "stop this." In Stop hooks, it means "don't stop."

---

### TeammateIdle

**When it fires:** When an agent team teammate is about to go idle after finishing its turn.

**Matcher:** Not supported (fires on every occurrence).

**Use it for:** Enforcing quality gates before a teammate stops, requiring passing lint/tests, verifying output files exist.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "TeammateIdle",
  "teammate_name": "researcher",
  "team_name": "my-project"
}
```

**Decision control:** Exit codes only (no JSON decision control).

```bash
#!/bin/bash
if [ ! -f "./dist/output.js" ]; then
  echo "Build artifact missing. Run the build before stopping." >&2
  exit 2
fi
exit 0
```

**Can block?** Yes. Exit 2 prevents the teammate from going idle.

---

### TaskCompleted

**When it fires:** When a task is being marked as completed (via TaskUpdate tool or when a teammate finishes with in-progress tasks).

**Matcher:** Not supported (fires on every occurrence).

**Use it for:** Enforcing completion criteria (tests must pass, lint must be clean, output files must exist).

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "TaskCompleted",
  "task_id": "task-001",
  "task_subject": "Implement user authentication",
  "task_description": "Add login and signup endpoints",
  "teammate_name": "implementer",
  "team_name": "my-project"
}
```

**Decision control:** Exit codes only. Exit 2 prevents task completion and feeds stderr back as feedback.

**Can block?** Yes. Exit 2 prevents the task from being marked as completed.

---

### ConfigChange

**When it fires:** When a configuration file changes during a session.

**Matcher values:** `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills`

**Use it for:** Auditing settings changes, enforcing security policies, blocking unauthorized config modifications.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "ConfigChange",
  "source": "project_settings",
  "file_path": "/Users/.../my-project/.claude/settings.json"
}
```

**Can block?** Yes (except `policy_settings`, which always take effect). Exit 2 or `"decision": "block"` prevents the change.

---

### PreCompact

**When it fires:** Before Claude Code runs a context compaction operation.

**Matcher values:** `manual` (user ran `/compact`), `auto` (context window is full).

**Use it for:** Saving full context before it is lost. **This is the key hook for context handoffs.** When auto-compaction hits, your conversation history gets summarized and compressed. A PreCompact hook lets you preserve the full transcript, your current plan, and your progress before that happens.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreCompact",
  "trigger": "auto",
  "custom_instructions": ""
}
```

For manual compaction (`/compact save the API design decisions`), `custom_instructions` contains the user's text.

**Can block?** No. Used for side effects (saving state, archiving transcripts).

---

### SessionEnd

**When it fires:** When a Claude Code session terminates.

**Matcher values:** `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`

**Use it for:** Saving state, cleaning up temp files, logging session statistics, persisting notes.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "SessionEnd",
  "reason": "prompt_input_exit"
}
```

**Can block?** No. Cannot prevent session termination.

---

### WorktreeCreate

**When it fires:** When a worktree is being created via `--worktree` or `isolation: "worktree"`.

**Matcher:** Not supported.

**Use it for:** Setting up isolated environments, using non-git VCS (SVN, Perforce, Mercurial).

**Key behavior:** This hook **replaces** the default `git worktree` behavior. Your hook must print the absolute path to the created worktree directory on stdout. Only `type: "command"` hooks are supported.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "hook_event_name": "WorktreeCreate",
  "name": "feature-auth"
}
```

**Can block?** Yes. Any non-zero exit code causes worktree creation to fail.

---

### WorktreeRemove

**When it fires:** When a worktree is being removed (session exit or subagent finish).

**Matcher:** Not supported.

**Use it for:** Cleaning up VCS state, archiving changes, removing directories.

**Input JSON:**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/you/my-project",
  "hook_event_name": "WorktreeRemove",
  "worktree_path": "/Users/.../my-project/.claude/worktrees/feature-auth"
}
```

**Can block?** No. Failures are logged in debug mode only. Only `type: "command"` hooks are supported.

---

## Practical Examples

### 1. Safety Guard -- Block Force-Push to Main

Prevents `git push --force` to the main branch.

**Script:** `~/.claude/hooks/block-force-push.sh`

```bash
#!/bin/bash
# Block force-push to main
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ "$TOOL" == "Bash" ]] && echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force.*\bmain\b|git\s+push\s+.*\bmain\b.*--force'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Force-push to main is not allowed. Use a feature branch."
    }
  }'
fi

exit 0
```

**Config:** `~/.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-force-push.sh"
          }
        ]
      }
    ]
  }
}
```

---

### 2. Auto-Save -- Write Progress on Stop

Saves a snapshot of the current session state every time Claude finishes responding.

**Script:** `~/.claude/hooks/auto-save-state.sh`

```bash
#!/bin/bash
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
CWD=$(echo "$INPUT" | jq -r '.cwd')
LAST_MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // "No message"')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

STATE_DIR="$CWD/.claude"
mkdir -p "$STATE_DIR"

cat > "$STATE_DIR/session-state.md" << EOF
# Session State
**Last updated:** $TIMESTAMP
**Session ID:** $SESSION_ID
**Working directory:** $CWD

## Last Response Summary
$LAST_MSG
EOF

exit 0
```

**Config:** `~/.claude/settings.json`

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/auto-save-state.sh"
          }
        ]
      }
    ]
  }
}
```

---

### 3. Context Handoff -- Preserve State Before Compaction

This is the most valuable hook. When Claude's context window fills up, auto-compaction summarizes and discards your conversation history. This hook saves the full transcript and a handoff summary before that happens.

**Script:** `~/.claude/hooks/pre-compact-handoff.sh`

```bash
#!/bin/bash
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path')
CWD=$(echo "$INPUT" | jq -r '.cwd')
TRIGGER=$(echo "$INPUT" | jq -r '.trigger')
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

HANDOFF_DIR="$CWD/.claude/handoffs"
mkdir -p "$HANDOFF_DIR"

# Copy the full transcript before it gets compacted
if [ -f "$TRANSCRIPT_PATH" ]; then
  cp "$TRANSCRIPT_PATH" "$HANDOFF_DIR/transcript-$TIMESTAMP.jsonl"
fi

# Generate a handoff summary
cat > "$HANDOFF_DIR/handoff-$TIMESTAMP.md" << EOF
# Context Handoff
**Trigger:** $TRIGGER compaction
**Timestamp:** $(date '+%Y-%m-%d %H:%M:%S')
**Session:** $SESSION_ID
**Working directory:** $CWD

## Transcript
Saved to: $HANDOFF_DIR/transcript-$TIMESTAMP.jsonl

## Instructions for Next Context
Read the transcript above to reconstruct:
1. What task was in progress
2. What has been completed so far
3. What remains to be done
4. Any decisions or constraints established
EOF

exit 0
```

**Config:** `~/.claude/settings.json`

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/pre-compact-handoff.sh"
          }
        ]
      }
    ]
  }
}
```

---

### 4. Notification Sound -- Play Sound When Tests Pass

Plays a macOS system sound when a Bash command succeeds (great for long-running test suites).

**Script:** `~/.claude/hooks/success-sound.sh`

```bash
#!/bin/bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
RESPONSE=$(echo "$INPUT" | jq -r '.tool_response // empty')

# Only trigger for test/build commands
if [[ "$TOOL" == "Bash" ]] && echo "$COMMAND" | grep -qE '(npm test|npm run build|pytest|cargo test|go test)'; then
  # Check if the command succeeded (tool_response exists and no error)
  ERROR=$(echo "$INPUT" | jq -r '.tool_response.stderr // empty')
  if [ -z "$ERROR" ] || echo "$RESPONSE" | jq -e '.success // false' > /dev/null 2>&1; then
    afplay /System/Library/Sounds/Glass.aiff &
  else
    afplay /System/Library/Sounds/Basso.aiff &
  fi
fi

exit 0
```

**Config:** `~/.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/success-sound.sh"
          }
        ]
      }
    ]
  }
}
```

---

### 5. Permission Auto-Approve -- Skip Prompts for Safe Commands

Auto-allows `npm test`, `npm run lint`, and similar safe commands so you do not get prompted every time.

**Script:** `~/.claude/hooks/auto-approve-safe.sh`

```bash
#!/bin/bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only handle Bash commands
if [[ "$TOOL" != "Bash" ]]; then
  exit 0
fi

# Define safe command patterns
SAFE_PATTERNS=(
  '^npm test'
  '^npm run (lint|typecheck|check|format|build)'
  '^npx tsc'
  '^npx eslint'
  '^npx prettier'
  '^cat '
  '^echo '
  '^ls '
  '^pwd$'
  '^git status'
  '^git diff'
  '^git log'
)

for pattern in "${SAFE_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: {
          behavior: "allow"
        }
      }
    }'
    exit 0
  fi
done

# Not a safe command -- let the normal permission dialog show
exit 0
```

**Config:** `~/.claude/settings.json`

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/auto-approve-safe.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Dos and Don'ts

### DO

- **Keep hooks fast.** Target under 1-2 seconds. Every hook adds latency to Claude's workflow. Use `async: true` for anything slow.
- **Use exit codes correctly.** `0` = allow, `2` = block. Any other code is a non-blocking error.
- **Use `matcher` to scope hooks.** Do not run your Bash validator on every Write call.
- **Store scripts outside the repo** if they contain secrets or machine-specific paths. `~/.claude/hooks/` is a good location.
- **Test hooks in isolation** before deploying. Pipe sample JSON into your script: `echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | ./your-hook.sh`
- **Check `stop_hook_active`** in Stop hooks to prevent infinite loops.
- **Use `$CLAUDE_PROJECT_DIR`** to reference project-relative scripts in your config.

### DON'T

- **Create Stop hooks that never let Claude stop.** Always check `stop_hook_active` in the input JSON. If it is `true`, your hook has already triggered a continuation -- let Claude stop this time or you will loop forever.
- **Make hooks that take more than 60 seconds** (default timeout for command hooks is 600s, but long hooks block Claude). Use `async: true` for long-running work.
- **Put secrets in hook scripts that get committed.** Use `.claude/settings.local.json` (gitignored) or `~/.claude/settings.json` (machine-local) for sensitive hooks.
- **Forget that exit 2 in a Stop hook means "keep going."** This is the most common gotcha. In every other hook, exit 2 means "block this action." In Stop hooks, the action is "stopping" -- so blocking it means continuing.
- **Over-hook.** Every hook adds latency. Start with one or two high-value hooks (safety guard + auto-save) and add more only when you have a specific need.
- **Print non-JSON text to stdout** in hooks that expect JSON parsing. If your shell profile prints a welcome message, it will break JSON output. Redirect shell profile noise or use a clean environment.

---

## Advanced Patterns

### Chaining Hooks

Multiple hooks on the same event run in parallel. All must pass for the action to proceed (for blocking events):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/security-check.sh"
          },
          {
            "type": "command",
            "command": "~/.claude/hooks/audit-log.sh"
          }
        ]
      }
    ]
  }
}
```

You can also have multiple matcher groups on the same event:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/bash-guard.sh" }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/file-guard.sh" }
        ]
      }
    ]
  }
}
```

### Conditional Hooks Per Project

Use project-level `.claude/settings.json` for project-specific hooks and `~/.claude/settings.json` for global hooks. They merge together. Project settings take precedence.

```
~/.claude/settings.json              Global safety guards (always active)
my-project/.claude/settings.json     Project-specific formatting hooks
my-project/.claude/settings.local.json  Your personal project hooks (gitignored)
```

### Async Hooks for Long-Running Tasks

For test suites, deployments, or API calls that take time, use `async: true` so Claude keeps working while the hook runs in the background:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/run-tests.sh",
            "async": true,
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

When the async hook finishes, its `systemMessage` or `additionalContext` output is delivered to Claude on the next conversation turn.

### Prompt-Based Hooks (LLM as Gatekeeper)

Instead of writing bash logic, let a fast Claude model evaluate whether to allow an action:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if Claude should stop: $ARGUMENTS. Check if all requested tasks are complete and no errors remain. Respond with {\"ok\": true} to allow stopping, or {\"ok\": false, \"reason\": \"explanation\"} to continue.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Agent-Based Hooks (Subagent Verification)

For complex verification that requires reading files and searching code:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify that all unit tests pass and no TODO comments remain in modified files. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

The agent can use Read, Grep, and Glob tools to investigate before returning `{ "ok": true/false }`.

### HTTP Hooks (Remote Endpoints)

as of v2.1.63, hooks can POST to URLs instead of running shell commands. the hook payload is sent as the JSON body, and the response is parsed the same way as command hook stdout.

**config:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "http",
            "url": "https://your-server.com/hooks/on-file-change",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**when to use HTTP hooks instead of command hooks:**

| scenario | command hook | HTTP hook |
|---|---|---|
| local scripts, simple logic | yes | overkill |
| team-shared webhooks | no (machine-specific paths) | yes |
| notification services (slack, discord) | works but verbose | cleaner |
| cloud-hosted validation | no | yes |
| CI/CD integration | bash + curl | native |
| environments without shell (remote, sandboxed) | won't work | works |

the payload is the same JSON that command hooks receive on stdin -- session_id, tool_name, tool_input, etc. the response should be JSON with the same control fields (decision, hookSpecificOutput, continue, etc.).

**practical example -- slack notification on file changes:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "http",
            "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

note: this sends the raw hook payload to slack. for formatted messages, put a small proxy (cloudflare worker, aws lambda) between claude code and slack that transforms the payload.

**security:** HTTP hooks respect workspace trust settings. untrusted projects cannot add HTTP hooks that fire automatically. the URL must be HTTPS in production.

### Hooks in Skills and Agents

Hooks can be defined in skill/agent YAML frontmatter, scoped to the component's lifecycle:

```yaml
---
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

---

## Quick Reference Table

| Event | Can Block? | Matcher? | Hook Types | Key Use Case |
|---|---|---|---|---|
| `SessionStart` | No | Yes (source) | command | Load context, set env vars |
| `UserPromptSubmit` | Yes | No | all | Validate/enrich prompts |
| `PreToolUse` | Yes | Yes (tool) | all | Block dangerous commands |
| `PermissionRequest` | Yes | Yes (tool) | all | Auto-approve safe commands |
| `PostToolUse` | No | Yes (tool) | all | Run formatters, log changes |
| `PostToolUseFailure` | No | Yes (tool) | all | Alert on failures |
| `Notification` | No | Yes (type) | command | Custom notification routing |
| `SubagentStart` | No | Yes (agent) | command | Track parallel work |
| `SubagentStop` | Yes | Yes (agent) | all | Validate subagent output |
| `Stop` | Yes | No | all | Keep-alive, auto-save |
| `TeammateIdle` | Yes | No | command | Enforce quality gates |
| `TaskCompleted` | Yes | No | all | Enforce completion criteria |
| `ConfigChange` | Yes* | Yes (source) | command | Audit config changes |
| `PreCompact` | No | Yes (trigger) | command | Save context before compression |
| `SessionEnd` | No | Yes (reason) | command | Cleanup, save state |
| `WorktreeCreate` | Yes | No | command | Custom VCS setup |
| `WorktreeRemove` | No | No | command | Cleanup worktrees |

*ConfigChange cannot block `policy_settings` changes.

---

## Environment Variables

These are available to hook scripts:

| Variable | Description |
|---|---|
| `CLAUDE_PROJECT_DIR` | Project root path |
| `CLAUDE_CODE_REMOTE` | `"true"` in remote web environments |
| `CLAUDE_ENV_FILE` | File path for persisting env vars (SessionStart only) |
| `CLAUDE_TOOL_INPUT_FILE_PATH` | File path being written/edited |
| `CLAUDE_PLUGIN_ROOT` | Plugin's root directory (plugin hooks only) |
| `CLAUDE_CODE_ACCOUNT_UUID` | Account identification in hooks |
| `CLAUDE_CODE_USER_EMAIL` | User email in hooks |
| `CLAUDE_CODE_ORGANIZATION_UUID` | Org identification in hooks |

---

## Debugging

### View hook activity

Run Claude Code in verbose mode (`Ctrl+O`) to see hook stdout and non-blocking errors.

### Test hooks manually

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"},"hook_event_name":"PreToolUse","session_id":"test","cwd":"/tmp","permission_mode":"default","transcript_path":"/tmp/test.jsonl"}' | ./your-hook.sh
echo "Exit code: $?"
```

### Watch the transcript

```bash
tail -f ~/.claude/projects/*/transcript.jsonl | jq
```

### Common issues

**JSON validation failed:** Your shell profile (`.bashrc`, `.zshrc`) prints text on startup that gets mixed into stdout. Either redirect profile output or use `#!/bin/bash --norc` in your hook scripts.

**Hook not firing:** Check that `matcher` is case-sensitive and matches exactly. `"bash"` will not match the `Bash` tool.

**Hook changes not taking effect:** Claude Code snapshots hooks at startup. If you edit a settings file mid-session, you need to review changes in the `/hooks` menu before they apply.

---

## The `/hooks` Menu

Type `/hooks` in Claude Code to manage hooks interactively. You can view, add, and delete hooks without editing JSON files. Each hook is labeled with its source: `[User]`, `[Project]`, `[Local]`, or `[Plugin]`.

To temporarily disable all hooks without removing them, set `"disableAllHooks": true` in your settings file or use the toggle in the `/hooks` menu.

---

*This guide covers Claude Code hooks as of March 2026, including HTTP hooks (v2.1.63). For the latest updates, see the [official hooks reference](https://code.claude.com/docs/en/hooks).*

Sources:
- [Hooks reference - Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [Claude Code power user customization: How to configure hooks](https://claude.com/blog/how-to-configure-hooks)
