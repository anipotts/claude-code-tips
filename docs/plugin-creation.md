<!-- tested with: claude code v1.0.34 -->

# how to create claude code plugins

**everything you need to ship a plugin, from scratch to marketplace.**

---

## what is a plugin

a plugin is a directory with a `plugin.json` and one or more hook scripts. thats it. no build step, no framework, no npm publish. just a folder that claude code can install and wire up automatically.

when someone runs `claude plugin add your-name/your-plugin`, claude code clones the repo (or copies the directory), reads `plugin.json`, and registers the hooks. the user never touches their `settings.json` -- the plugin handles all the wiring.

think of it like a git hook, but packaged and shareable.

## the plugin.json spec

every plugin needs exactly one `plugin.json` at its root. here is the full spec:

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "One-line description of what this plugin does",
  "author": "Your Name",
  "license": "MIT",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "type": "command",
        "command": "./hooks/my-hook.sh"
      }
    ]
  },
  "keywords": ["safety", "bash", "guard"]
}
```

### field reference

| Field | Required | Description |
|---|---|---|
| `name` | yes | Lowercase, hyphenated. Must match the directory name. No spaces. |
| `version` | yes | Semver string. Start at `0.1.0`. |
| `description` | yes | One sentence. Shows up in marketplace listings and `claude plugin list`. |
| `author` | yes | Your name or handle. |
| `license` | yes | SPDX identifier. `MIT` is the safe default. |
| `hooks` | yes | Object mapping hook event names to arrays of hook handlers. Same structure as `settings.json` hooks. |
| `keywords` | no | Array of strings for marketplace search. Keep it to 3-5 relevant terms. |

### hooks format

the `hooks` field uses the exact same format as your `settings.json`, with one key difference: **paths are relative to the plugin root**, not to the project root.

so `"command": "./hooks/my-hook.sh"` resolves to `<plugin-install-dir>/hooks/my-hook.sh`.

you can use any hook event: `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, `PreCompact`, etc. see the [hooks guide](./hooks-guide.md) for the full list.

### hooks with matchers

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "type": "command",
        "command": "./hooks/bash-guard.sh"
      },
      {
        "matcher": "Write|Edit",
        "type": "command",
        "command": "./hooks/file-guard.sh"
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "./hooks/on-stop.sh"
      }
    ]
  }
}
```

matchers are regex, same as `settings.json`. omit `matcher` to fire on all tool calls for that event.

### hooks with different handler types

plugins support all three handler types:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "type": "command",
        "command": "./hooks/check-command.sh"
      }
    ],
    "Stop": [
      {
        "type": "prompt",
        "prompt": "Check if all tasks are complete. $ARGUMENTS"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "type": "agent",
        "prompt": "Verify the written file follows project conventions. $ARGUMENTS"
      }
    ]
  }
}
```

`command` hooks are the most common. `prompt` and `agent` hooks are powerful but burn tokens -- use them when shell logic is not enough.

## directory structure

here is the standard layout:

```
my-plugin/
  plugin.json              # required -- plugin manifest
  hooks/                   # your hook scripts
    my-hook.sh
  README.md                # optional but recommended for marketplace
  LICENSE                  # optional, matches the license field
```

thats the minimum. some plugins are more complex:

```
panopticon/
  plugin.json
  hooks/
    panopticon.sh          # PostToolUse logger
  scripts/
    query.sh               # helper for querying the SQLite DB
  README.md
  LICENSE
```

```
context-handoff/
  plugin.json
  hooks/
    context-save.sh        # PreCompact hook
    session-state.sh       # Stop hook
  README.md
  LICENSE
```

keep it flat. one level of nesting is plenty.

## how hooks work inside plugins

### relative paths

all `command` paths in `plugin.json` are relative to the plugin root. when claude code installs your plugin, it sets `$CLAUDE_PLUGIN_ROOT` to the plugin directory. your hook scripts can use this:

```bash
#!/usr/bin/env bash
# this script lives at ./hooks/my-hook.sh
# CLAUDE_PLUGIN_ROOT points to the plugin's install directory

CONFIG_FILE="${CLAUDE_PLUGIN_ROOT}/config/defaults.json"
```

but in most cases you do not need it -- relative paths in `plugin.json` just work.

### stdin JSON

hooks receive JSON on stdin, same as standalone hooks. the format depends on the event:

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)

# extract fields with jq
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
```

every event includes `session_id`, `transcript_path`, `cwd`, `permission_mode`, and `hook_event_name`. each event type adds its own fields on top. see the [hooks guide](./hooks-guide.md) for per-event input schemas.

### exit codes

same rules as standalone hooks:

| Exit code | Meaning |
|---|---|
| `0` | Allow. Stdout is parsed for optional JSON control fields. |
| `2` | Block. Stderr is shown to Claude as the reason. |
| Any other | Non-blocking error. Logged in verbose mode, execution continues. |

exception: in `Stop` hooks, `exit 2` means "keep going" (do not stop). this is counterintuitive but consistent -- you are blocking the "stop" action.

### stdout JSON

for finer control, print JSON to stdout on `exit 0`:

```bash
# PreToolUse: deny a tool call
jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "This command is blocked by the plugin"
  }
}'
exit 0
```

```bash
# Stop: force continuation
echo '{"decision":"block","reason":"Tests are still failing"}'
exit 0
```

---

## walkthrough: build a plugin from scratch

lets build a simple plugin called `session-logger` that logs a message to stderr when sessions start and prints project context that Claude can see.

### step 1: create the directory

```bash
mkdir -p session-logger/hooks
cd session-logger
```

### step 2: write plugin.json

```bash
cat > plugin.json << 'EOF'
{
  "name": "session-logger",
  "version": "0.1.0",
  "description": "Logs session starts and injects project context into the conversation.",
  "author": "Your Name",
  "license": "MIT",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "type": "command",
        "command": "./hooks/on-session-start.sh"
      }
    ]
  },
  "keywords": ["session", "logging", "context"]
}
EOF
```

this registers a single `SessionStart` hook that fires on fresh startups (not resumes or compactions).

### step 3: write the hook script

```bash
cat > hooks/on-session-start.sh << 'HOOKEOF'
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
CWD=$(echo "$INPUT" | jq -r '.cwd')
MODEL=$(echo "$INPUT" | jq -r '.model // "unknown"')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Log to stderr (visible in verbose mode, does not interfere with stdout)
echo "[session-logger] session started: ${SESSION_ID} at ${TIMESTAMP}" >&2
echo "[session-logger] model: ${MODEL}, cwd: ${CWD}" >&2

# Print context to stdout -- this becomes visible to Claude
echo "Session started at ${TIMESTAMP}"
echo "Project: $(basename "$CWD")"
echo "Branch: $(cd "$CWD" && git branch --show-current 2>/dev/null || echo 'not a git repo')"
echo "Node: $(node -v 2>/dev/null || echo 'not installed')"

exit 0
HOOKEOF
chmod +x hooks/on-session-start.sh
```

key things:
- `set -euo pipefail` -- fail fast, do not swallow errors
- `INPUT=$(cat)` -- read the full JSON payload from stdin
- stderr for logging (does not interfere with JSON parsing)
- stdout for context that Claude sees (SessionStart and UserPromptSubmit only)
- `exit 0` -- allow the session to proceed

### step 4: test it locally

you do not need to install the plugin to test it. pipe sample JSON into the script:

```bash
echo '{
  "session_id": "test-123",
  "transcript_path": "/tmp/test.jsonl",
  "cwd": "/Users/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "SessionStart",
  "source": "startup",
  "model": "claude-sonnet-4-6"
}' | ./hooks/on-session-start.sh
```

you should see:
- stderr: `[session-logger] session started: test-123 at ...`
- stdout: project context lines
- exit code: 0

verify the exit code:

```bash
echo $?
# should be 0
```

### step 5: test as a local plugin

install from a local path to test with a real session:

```bash
claude plugin add /path/to/session-logger
```

start a new session and check that your context appears. use verbose mode (`Ctrl+O`) to see stderr output.

to uninstall:

```bash
claude plugin remove session-logger
```

### step 6: your final directory

```
session-logger/
  plugin.json
  hooks/
    on-session-start.sh
```

thats the whole plugin. two files.

---

## how to publish to the marketplace

### 1. push to github

your repo should have `plugin.json` at the root:

```bash
cd session-logger
git init
git add .
git commit -m "session-logger plugin v0.1.0"
gh repo create your-name/session-logger --public --push
```

### 2. add the github topic

add the `claude-code-plugin` topic to your repo. this is how the marketplace discovers plugins:

```bash
gh repo edit --add-topic claude-code-plugin
```

### 3. add to marketplace.json (optional)

for featured listings, submit a PR to the marketplace registry:

```json
{
  "name": "session-logger",
  "repo": "your-name/session-logger",
  "description": "Logs session starts and injects project context into the conversation.",
  "author": "Your Name",
  "version": "0.1.0",
  "keywords": ["session", "logging", "context"],
  "hooks": ["SessionStart"]
}
```

### 4. users install with one command

```bash
claude plugin add your-name/session-logger
```

no configuration needed. the plugin handles everything.

---

## common mistakes and how to avoid them

### 1. forgetting `chmod +x` on hook scripts

**symptom:** hook silently fails, nothing happens.

**fix:** always `chmod +x` your scripts. add it to your README.

```bash
chmod +x hooks/*.sh
```

### 2. printing non-JSON to stdout in hooks that expect JSON

**symptom:** `JSON validation failed` errors in verbose mode.

**fix:** use stderr for logging, stdout for JSON or context only.

```bash
# wrong
echo "debug: processing..."
jq -n '{ hookSpecificOutput: { ... } }'

# right
echo "debug: processing..." >&2
jq -n '{ hookSpecificOutput: { ... } }'
```

### 3. using absolute paths in plugin.json

**symptom:** works on your machine, breaks everywhere else.

**fix:** always use relative paths in `plugin.json`. `./hooks/my-hook.sh`, never `/Users/you/...`.

### 4. missing jq dependency

**symptom:** hook crashes on systems without `jq`.

**fix:** either document jq as a requirement in your README, or parse JSON with built-in tools:

```bash
# if jq is not available, fall back to grep
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
```

but honestly just require jq. everyone should have it.

### 5. not handling missing fields

**symptom:** `null` or empty values break your logic.

**fix:** always use jq defaults:

```bash
# bad -- returns literal "null" string if missing
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# good -- returns empty string if missing
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
```

### 6. infinite loops in Stop hooks

**symptom:** claude never stops responding. your token bill goes up. you panic.

**fix:** always check `stop_hook_active`:

```bash
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [[ "$STOP_ACTIVE" == "true" ]]; then
  exit 0  # let it stop this time
fi
# your actual logic here
```

### 7. slow hooks blocking claude

**symptom:** every tool call takes 5+ seconds bc your hook is doing network requests.

**fix:** keep hooks under 1-2 seconds. for anything slow, use `async: true` in your hook config or offload to a background process:

```bash
# fire and forget
curl -s "https://your-webhook.com/log" -d "$INPUT" &
exit 0
```

### 8. naming collision with other plugins

**symptom:** two plugins both define `./hooks/guard.sh` and weird things happen.

**fix:** use unique, descriptive names. prefix with your plugin name: `./hooks/session-logger-start.sh`.

---

## plugin development checklist

before you ship:

- [ ] `plugin.json` has all required fields (name, version, description, author, license, hooks)
- [ ] all hook scripts are `chmod +x`
- [ ] all paths in `plugin.json` are relative (`./hooks/...`)
- [ ] tested locally with piped JSON input
- [ ] tested as a local plugin install (`claude plugin add /path/to/plugin`)
- [ ] scripts use `set -euo pipefail`
- [ ] scripts use `jq` defaults for optional fields (`// empty`)
- [ ] stderr for logging, stdout for JSON/context
- [ ] Stop hooks check `stop_hook_active`
- [ ] README documents any system dependencies (jq, sqlite3, etc.)
- [ ] github topic `claude-code-plugin` is set

thats it. no noise, just signal.

---

*For the full hooks reference, see [The Complete Claude Code Hooks Guide](./hooks-guide.md).*
