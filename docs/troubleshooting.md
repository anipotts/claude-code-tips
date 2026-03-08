# troubleshooting

common problems and fixes. organized by feature area.

<!-- tested with: claude code v1.0.34 -->

---

## general

### "permission denied" when running hooks

- cause: hook scripts aren't executable
- fix: `chmod +x hooks/*.sh`
- for miner: `chmod +x plugins/miner/hooks/*.sh`

### claude code hangs on startup

- try: `claude --no-plugins` to rule out plugin issues
- check: `~/.claude/settings.json` for malformed JSON
- validate: `python3 -c "import json; json.load(open('$HOME/.claude/settings.json'))"`

### context window fills up too fast

- use the [handoff plugin](../plugins/handoff/) to save context before compaction
- use the [context-save hook](../hooks/context-save.sh) for automatic preservation
- consider splitting large tasks into smaller sessions
- check if verbose MCP servers are dumping large payloads into context

### settings not taking effect

- project settings (`.claude/settings.json`) override user settings (`~/.claude/settings.json`)
- `.claude/settings.local.json` overrides both for local-only config
- restart claude code after editing settings -- they're read at session start
- check for duplicate keys in the JSON (later keys silently win)

### "model not available" or unexpected model

- check: `/model` in-session to see what's active
- some models require specific API plans
- gauge (miner feature) may suggest a model switch -- it's a suggestion, not a change

---

## plugins

### miner plugin won't install

- check: `claude plugin list` to see what's installed
- try: `claude plugin remove miner && claude plugin add anipotts/miner`
- verify: sqlite3 is available -- `which sqlite3`
- verify: jq is available -- `which jq`

### miner database is empty

- check: the session hooks are wired up in settings
- run: `sqlite3 ~/.claude/miner.db "SELECT count(*) FROM sessions;"`
- if 0 rows: run a session, exit cleanly, then check again -- ingest fires on SessionEnd
- if the table doesn't exist: run `sqlite3 ~/.claude/miner.db < scripts/schema.sql`

### miner echo/scar/gauge not firing

- echo and imprint fire on SessionStart -- they won't show mid-session
- scar fires on PostToolUseFailure -- it only activates when a tool fails
- gauge fires on UserPromptSubmit -- it needs at least one prior session to have data
- check: `sqlite3 ~/.claude/miner.db "SELECT session_id, event FROM hook_log ORDER BY ts DESC LIMIT 20;"`

### plugin.json validation errors

- run: `python3 -c "import json; json.load(open('plugin.json'))"`
- common issue: trailing commas (not valid JSON)
- common issue: wrong `tool_input_schema` format
- common issue: `name` field doesn't match the directory name

### plugin hooks not running after install

- check: `claude plugin list` shows the plugin as active
- some plugins need a fresh session to pick up new hooks
- verify hook paths in plugin.json are relative to the plugin root

---

## hooks

### hook doesn't fire

- check: the event name matches exactly -- `PreToolUse`, `PostToolUse`, `PreCompact`, `Notification`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`
- check: the hook is registered in `~/.claude/settings.json` or `.claude/settings.json`
- check: the matcher matches the tool name (case-sensitive)
- test manually:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | bash hooks/safety-guard.sh
echo $?  # 0 = allow, 2 = block
```

### hook blocks everything

- check exit codes -- `exit 0` = allow, `exit 2` = block
- if using `jq` to extract values, a failed `jq` command returns exit 1 (non-blocking error) but a `set -e` script will crash and may behave unpredictably
- debug: add `echo "DEBUG: tool=$tool" >&2` lines -- stderr is visible in verbose mode

### hook blocks nothing (should be blocking)

- make sure you're using `exit 2`, not `exit 1` -- only 2 means "block"
- check: the matcher is correct -- a `Bash` matcher won't fire on `Write` calls
- check: your condition logic isn't inverted

### hook JSON parsing fails

- ensure jq is installed: `which jq`
- test: `echo '{"test":"value"}' | jq .`
- common issue: the hook reads stdin twice -- stdin can only be read once, store it in a variable:

```bash
input=$(cat)
tool=$(echo "$input" | jq -r '.tool')
```

### hook stderr output showing up in conversation

- stderr from hooks shows as a block reason when exit code is 2
- for debug logging, use `>&2` but only during development
- in production, log to a file instead: `echo "debug info" >> /tmp/hook-debug.log`

---

## agents

### subagent times out

- default timeout may not be enough for complex tasks
- check if the agent is stuck in a loop (look at the transcript)
- try running the agent prompt directly in a fresh session to isolate the issue

### worktree agent can't find files

- worktrees have their own working directory -- it's not your main checkout
- use absolute paths or pass the project root explicitly in the agent prompt
- check: `git worktree list` to see active worktrees

### agent produces no output

- check: the agent markdown file has a clear instruction and expected output format
- check: the agent has permission to use the tools it needs
- try: simplify the agent prompt and add explicit "write your findings to a file" instructions

---

## MCP servers

### MCP server connection refused

- check: the server process is running -- `ps aux | grep mcp`
- check: the port/command matches what's in your settings
- try: restart claude code (MCP connections are established at session start)
- for npx-based servers: check your npm/node version and network access

### MCP tools not appearing in session

- check: the server is listed in your MCP config (`settings.json` or `settings.local.json`)
- try: `claude mcp list` to see registered servers
- restart claude code after adding a new MCP server
- check: the server's tool definitions are valid JSON Schema

### MCP tool calls failing silently

- enable verbose mode (`Ctrl+O`) to see MCP traffic
- check: environment variables (API keys, etc.) are set in the `env` field of the server config
- put secrets in `.claude/settings.local.json` so they're gitignored

---

## skills & commands

### custom skill not loading

- check: file is in `.claude/skills/` with `.md` extension
- check: frontmatter is valid YAML (no tabs, proper indentation)
- restart claude code after adding new skills
- check: the skill name doesn't conflict with a built-in command

### /sift returns no results

- check: miner database exists and has data
- try: `sqlite3 ~/.claude/miner.db "SELECT count(*) FROM sessions;"`
- if the database exists but queries return nothing, you may need to re-ingest -- see miner docs

### custom command not found

- check: the command file is in `.claude/commands/` with `.md` extension
- check: the filename matches what you're typing (e.g., `stats.md` for `/stats`)
- restart claude code after adding new commands

---

## environment issues

### jq not installed

```bash
# macOS
brew install jq

# ubuntu/debian
sudo apt-get install jq

# check version
jq --version
```

### sqlite3 not available

```bash
# macOS -- usually pre-installed
sqlite3 --version

# ubuntu/debian
sudo apt-get install sqlite3
```

### node version too old

claude code requires Node.js 18+. check with `node --version`. upgrade via nvm:

```bash
nvm install 20
nvm use 20
```

---

## still stuck?

- run with verbose mode (`Ctrl+O`) to see detailed hook and tool execution
- check `~/.claude/logs/` for session logs
- search past sessions with miner: use the `/sift` skill or query the database directly
- open an issue on this repo with your settings (redact secrets) and the error output
