# the claude code guide

**beginner to claude-code-crazy in one document.**

everything here is tested. opinions are earned. links go to official docs and to files in this repo.

---

## table of contents

- [beginner](#beginner) -- install, CLAUDE.md, permissions, settings, your first real task, understanding costs
- [intermediate](#intermediate) -- extensibility stack, hooks, plugins, commands, skills, agents, subagents, MCP
- [claude code crazy](#claude-code-crazy) -- miner, headless CLI, self-improvement loops, daemons, parallel exploration, cost optimization

---

## beginner

### 1. what claude code actually is

claude code is not a chatbot. it is an agent with tools.

when you open a session, claude gets access to your filesystem, your terminal, and a set of tools -- Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, and more. it reads your code, runs commands, writes files, and executes multi-step plans. you talk to it in natural language, but under the hood its making tool calls just like a developer would.

the difference between this and pasting code into a chat window is night and day. claude code *sees* your project. it can `grep` for usage, read related files, run your tests, and iterate on its own mistakes. its a collaborator with access to your whole dev environment.

you are the architect. claude is the implementer.

---

### 2. installing and first run

```bash
npm install -g @anthropic-ai/claude-code
```

start a session in any project directory:

```bash
cd your-project
claude
```

thats it. you're in. type natural language, claude reads your files, writes code, runs commands. it asks permission before anything destructive.

first session tips:
- start with something concrete: "read the codebase and explain the architecture" or "find and fix the bug in auth.ts"
- claude sees your file tree and can read/write/run anything you allow
- use `/help` for available commands, `/model` to check/change the model
- `Ctrl+C` to interrupt, `Escape` to cancel the current input
- `--continue` resumes your last session right where you left off

the default model is sonnet. you can change it per-session with `/model` or globally in settings.

> [quickstart docs](https://docs.anthropic.com/en/docs/claude-code/overview)

---

### 3. CLAUDE.md -- your project's brain

CLAUDE.md is the single most important file in your project for shaping claude's behavior. it persists across sessions. its more valuable than your README because claude actually reads it every time a session starts.

**where it goes:**

| location | scope | shareable |
|---|---|---|
| `~/.claude/CLAUDE.md` | global -- all projects on your machine | no |
| `.claude/CLAUDE.md` | project -- shared with your team | yes (commit it) |
| `CLAUDE.md` | project root -- also works, more visible | yes |

**what to include:**
- project structure and architecture (the "map")
- conventions: naming, file organization, testing patterns
- build/test/lint commands (`npm test`, `cargo build`, etc.)
- things claude gets wrong repeatedly (fix them here once)
- preferred libraries and tools

**what to exclude:**
- implementation details that change constantly
- anything thats obvious from reading package.json or similar
- long prose -- claude processes instructions, not essays

**treat it as a living document.** every time claude makes the same mistake twice, add a rule. every time you find yourself repeating the same instruction, write it down. CLAUDE.md is not a one-time config file -- its project memory that evolves with your codebase.

```markdown
# my-project

typescript monorepo. pnpm workspaces. vitest for testing.

## structure
- packages/api/ -- express backend
- packages/web/ -- next.js frontend
- packages/shared/ -- shared types and utils

## commands
- `pnpm test` -- run all tests
- `pnpm -F api test` -- api tests only
- `pnpm typecheck` -- tsc across all packages

## conventions
- all new files use .ts not .js
- tests go next to source: foo.ts -> foo.test.ts
- prefer zod for validation, never manual type guards
- error messages are lowercase, no periods

@docs/api-conventions.md
@docs/testing-patterns.md
```

guidelines:
- aim for ~150 lines. if its longer, split into `@path` imports that pull in sub-files
- put the most important stuff first -- context windows have attention gradients
- be specific. "always run tests" is useless. "run `pnpm -F api test` before committing changes to packages/api/" is actionable

> [memory docs](https://docs.anthropic.com/en/docs/claude-code/memory)

---

### 4. permissions -- the four modes

claude code asks before doing anything risky. there are four permission modes and the one you pick determines how much friction you deal with:

| mode | what it does | when to use it |
|---|---|---|
| `default` | asks permission for file writes, bash commands, etc. | everyday work. the sane default |
| `plan` | read-only. claude can read and search but cannot write or run commands | codebase exploration, architecture review |
| `acceptEdits` | auto-approves file edits, still asks for bash commands | when you trust the edits but want to vet commands |
| `bypassPermissions` | auto-approves everything | **never on shared machines or with untrusted code** |

set the mode with `--permission-mode` or in settings. for most work, `default` is right.

the real power move is **allowlist patterns** -- auto-approve specific tools without going full bypass:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test*)",
      "Bash(npm run lint*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Read(*)"
    ]
  }
}
```

this auto-approves test/lint/git-read commands and all file reads while still prompting for writes and other bash commands. much better than `bypassPermissions` and eliminates the most annoying permission prompts.

> [permissions docs](https://docs.anthropic.com/en/docs/claude-code/security)

---

### 5. settings.json

settings live in JSON files at three levels. later overrides earlier:

1. `~/.claude/settings.json` -- user-level (your machine, all projects)
2. `.claude/settings.json` -- project-level (shared with team, commit it)
3. `.claude/settings.local.json` -- local project (gitignored, your overrides)

anything you can configure: permissions, hooks, model, theme, environment variables, MCP servers, allowed tools.

**key CLI flags:**

| flag | what it does |
|---|---|
| `--model sonnet` | use a specific model for this session |
| `--continue` | resume your last session |
| `--print` / `-p` | one-shot mode: answer and exit (no interactive session) |
| `--output-format json` | machine-readable output (pairs with `-p`) |
| `--verbose` | show tool inputs/outputs, hook activity, token counts |
| `--permission-mode plan` | read-only mode |

> [settings docs](https://docs.anthropic.com/en/docs/claude-code/settings)

---

### 6. your first real task

heres a real workflow for fixing a bug. this is how most sessions go:

**step 1: describe the problem**
```
the login endpoint returns 500 when the email contains a plus sign like test+1@example.com
```

claude will read relevant files, find the bug, and propose a fix. you'll see tool calls (Read, Grep, Bash) as it works.

**step 2: review and approve**

claude asks before writing files. read the diff, approve if it looks right.

**step 3: verify**
```
run the tests
```

claude runs your test suite and reports results.

**step 4: ship it**
```
commit this with a good message and push
```

the whole loop -- diagnose, fix, test, commit -- happens in one session.

tips for getting good results:
- be specific about what's wrong, not how to fix it
- if claude goes down the wrong path, interrupt (`Ctrl+C`) and redirect
- break large tasks into smaller steps: "first read the auth module and explain how it works" then "now add token revocation"
- use plan mode (`/plan`) to explore before committing to changes

---

### 7. understanding the conversation

every claude code session is a sequence of three things:

1. **messages** -- your prompts and claude's responses
2. **tool calls** -- Read, Write, Edit, Bash, Grep, Glob, etc. each one shows up in the UI
3. **thinking blocks** -- claude's internal reasoning (visible in extended thinking mode)

the context window is finite. as the conversation grows, claude eventually hits the limit and triggers **auto-compaction** -- it summarizes the conversation and continues with the summary. you'll notice this when claude seems to "forget" something you discussed earlier.

when compaction happens:
- your conversation history gets summarized
- file contents claude read earlier are gone from context
- the summary retains key decisions and progress

you can manually trigger this with `/compact`. pair it with the [handoff plugin](../plugins/handoff/) to preserve the full transcript before compression.

---

### 8. token costs and model selection

this is real money. here's what the models cost:

| model | input (per M tokens) | output (per M tokens) | best for |
|---|---|---|---|
| haiku 4.5 | $0.80 | $4.00 | lookups, file reads, simple tasks, scouting |
| sonnet 4.6 | $3.00 | $15.00 | code generation, refactoring, most work |
| opus 4.6 | $15.00 | $75.00 | architecture, complex reasoning, multi-file design |

the `/model` command switches models mid-conversation. this is one of the most underused features:

```
/model haiku     # switch to haiku for a quick lookup
/model sonnet    # back to sonnet for implementation
/model opus      # opus for the hard design question
```

**practical cost tips:**
- haiku for anything that's mostly reading: "what does this function do?" "find all files that import lodash"
- sonnet for most actual coding work. its the workhorse
- opus when you're stuck or designing something complex. save it for the 10% that actually needs it
- prompt caching saves money -- long system prompts (CLAUDE.md, few-shot examples) that exceed 4,096 tokens get cached. subsequent turns read from cache at 90% discount
- watch your token usage with `/sift cost this month` (requires the miner plugin)

> [pricing docs](https://docs.anthropic.com/en/docs/about-claude/models)

---

## intermediate

### 9. the extensibility stack

claude code has a lot of extension points. this is the hierarchy from simplest to most powerful:

| layer | what it is | effort | when to use it |
|---|---|---|---|
| CLAUDE.md | project memory | 2 min | always. every project should have one |
| rules (`.claude/rules/*.md`) | conditional instructions | 5 min | context-specific guidance by file pattern |
| commands (`.claude/commands/`) | slash commands | 5 min | simple prompts you trigger manually |
| skills (`.claude/skills/`) | workflow prompts | 15 min | complex workflows with YAML config |
| agents (`.claude/agents/`) | autonomous subagents | 30 min | specialized roles that work independently |
| hooks | lifecycle scripts | 30 min+ | intercept/validate/block actions programmatically |
| plugins | shareable hook bundles | 1 hr+ | hooks packaged for `claude plugin add` |
| MCP servers | external tool providers | 1 hr+ | connect claude to databases, browsers, APIs |

**rules of thumb:**
- if its project context, put it in CLAUDE.md
- if its a reusable prompt, make it a command
- if it needs tool restrictions or model overrides, make it a skill
- if it runs autonomously with its own context, make it an agent
- if it needs to intercept tool calls programmatically, use a hook
- if you want to share hooks with others, make it a plugin
- if you need to connect to external services, use MCP

> [extending docs](https://docs.anthropic.com/en/docs/claude-code/extending)

---

### 10. commands, skills, and agents -- when to use which

**commands** are the simplest. a markdown file in `.claude/commands/` becomes a slash command. no config, no YAML, just a prompt:

```markdown
<!-- .claude/commands/review.md -->
review the staged changes. check for:
1. security issues
2. missing error handling
3. inconsistent naming
output a structured report with severity levels.
```

now `/review` triggers that prompt. done. use commands for things like `/review`, `/deps`, `/stats` -- quick one-shot prompts.

**skills** add YAML frontmatter for more control -- tool restrictions, model overrides, descriptions with arguments:

```yaml
---
name: ship
description: stage, commit, push, and open a PR in one shot
allowed-tools:
  - Bash
  - Read
---

When the user runs /ship, do the following:
1. Run `git status` and `git diff --stat`
2. Stage changed files by name (never `git add .`)
3. Write a commit message matching the repo's style
4. Push and create a PR with `gh pr create`
```

skills are for multi-step workflows: [/ship](../skills/ship.md) (commit and PR), [/sweep](../skills/sweep.md) (dead code cleanup), [/quicktest](../skills/quicktest.md) (run the right test), [/sift](../skills/sift.md) (query your history), [/improve](../skills/improve.md) (evolve CLAUDE.md).

**agents** are autonomous workers with their own context window. they work independently, have their own model, and return results:

```yaml
---
name: code-sweeper
description: finds dead code, unused imports, stale TODOs
model: claude-haiku-4-5
tools:
  - Read
  - Glob
  - Grep
  - Bash
---
```

run with `/agent code-sweeper scan this project`. agents are for specialized roles: [analyst](../agents/analyst.md) (data investigation), [explorer](../agents/explorer.md) (parallel worktree exploration), [test-writer](../agents/test-writer.md), [pr-narrator](../agents/pr-narrator.md).

**the decision:** if you find yourself typing the same 3-sentence prompt often, make it a command. if it needs tool restrictions or arguments, make it a skill. if it needs to work independently with its own context window and model, make it an agent.

---

### 11. hooks deep dive

hooks are shell scripts (or LLM prompts) that fire on claude code lifecycle events. they intercept, validate, block, or extend what claude does at every stage.

**the anatomy:**
1. receives JSON on stdin (session ID, tool name, tool input, etc.)
2. runs your logic
3. returns via exit code: `0` = allow, `2` = block

there are 17 hook events. here are the ones that matter most:

| event | fires when | killer use case |
|---|---|---|
| `PreToolUse` | before any tool executes | block dangerous commands |
| `PostToolUse` | after any tool succeeds | audit logging (panopticon) |
| `Stop` | claude finishes responding | quality gates (tests must pass) |
| `PreCompact` | before context compression | save state before it's lost |
| `SessionStart` | session begins | inject project context |
| `SessionEnd` | session terminates | save stats, clean up |
| `UserPromptSubmit` | user sends a prompt | enrich prompts with context |
| `PostToolUseFailure` | tool call fails | track error patterns |
| `PermissionRequest` | permission dialog about to show | auto-approve safe commands |

**PreToolUse for safety** -- the most common hook. block force-push to main, prevent `rm -rf /`, catch SQL DROP statements:

```bash
#!/bin/bash
set -euo pipefail
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# block force-push to main
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*(-f|--force)'; then
  if echo "$COMMAND" | grep -qE '\b(main|master)\b'; then
    echo "force-push to main blocked" >&2
    exit 2
  fi
fi
exit 0
```

see [hooks/safety-guard.sh](../hooks/safety-guard.sh) for a production version that blocks 6 categories of dangerous commands.

**PostToolUse for logging** (the panopticon pattern) -- log every tool call to a SQLite database. gives you a complete audit trail of everything claude did:

```bash
#!/bin/bash
set -euo pipefail
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input | tostring' | head -c 500)

sqlite3 ~/.claude/panopticon.db "INSERT INTO actions (session_id, tool_name, tool_input)
  VALUES ('$SESSION_ID', '$TOOL_NAME', '$TOOL_INPUT');"
exit 0
```

see [hooks/panopticon.sh](../hooks/panopticon.sh) for the full version.

**Stop hooks for quality gates** -- prevent claude from stopping until tests pass. critical: always check `stop_hook_active` to prevent infinite loops:

```bash
#!/bin/bash
INPUT=$(cat)
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')

# if we already triggered a continuation, let it stop this time
if [[ "$STOP_ACTIVE" == "true" ]]; then
  exit 0
fi

# run tests -- if they fail, force claude to continue
npm test > /tmp/test-results.txt 2>&1
if [ $? -ne 0 ]; then
  echo '{"decision":"block","reason":"Tests are failing. Fix them before stopping."}'
  exit 0
fi
exit 0
```

> **warning:** exit 2 in a Stop hook means "keep going" -- this is counterintuitive. in every other hook, exit 2 means "block this action." in Stop hooks, the action IS stopping, so blocking it means continuing.

**PreCompact for context handoffs** -- save the full transcript before auto-compaction summarizes it away. this is the key hook for long sessions:

```bash
#!/bin/bash
INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path')
CWD=$(echo "$INPUT" | jq -r '.cwd')
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

mkdir -p "$CWD/.claude/handoffs"
cp "$TRANSCRIPT_PATH" "$CWD/.claude/handoffs/transcript-$TIMESTAMP.jsonl"
exit 0
```

**config:** hooks live in settings.json. three levels: event -> matcher -> handlers:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {"type": "command", "command": "~/.claude/hooks/safety-guard.sh"}
        ]
      }
    ]
  }
}
```

the `matcher` is a regex that filters which tool triggers the hook. `"Bash"` only fires for Bash tool calls. `"Write|Edit"` fires for both. omit it to fire on everything.

three handler types: `command` (shell script), `prompt` (LLM evaluation), `agent` (subagent with tools). command hooks are the most common and the fastest.

see [hooks-guide.md](./hooks-guide.md) for the complete reference -- all 17 events, every input field, tested examples, and advanced patterns.

> [hooks docs](https://docs.anthropic.com/en/docs/claude-code/hooks)

---

### 12. plugins

plugins package hooks into installable bundles. no config needed -- the plugin handles all the wiring.

**install:**

```bash
claude plugin add anipotts/miner
```

**create your own:**

1. make a directory with `plugin.json` and hook scripts
2. `plugin.json` defines name, version, description, and hooks (same format as settings.json)
3. all paths in `plugin.json` are relative to the plugin root
4. push to github, add the `claude-code-plugin` topic
5. anyone installs with `claude plugin add your-name/your-plugin`

minimal `plugin.json`:

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "one-line description",
  "author": "Your Name",
  "license": "MIT",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "type": "command",
        "command": "./hooks/guard.sh"
      }
    ]
  }
}
```

see [plugin-creation.md](./plugin-creation.md) for the full walkthrough, the spec, and the 8 most common mistakes.

> [plugins docs](https://docs.anthropic.com/en/docs/claude-code/plugins)

---

### 13. subagent patterns

the `Task` tool spawns a subagent -- a separate claude instance with its own context window. powerful but expensive. here's when each pattern makes sense:

| pattern | when to use it | cost |
|---|---|---|
| parallel research | explore multiple parts of a codebase simultaneously | moderate |
| specialist delegation | delegate tests, reviews, migrations to focused agents | moderate |
| scout pattern | haiku explores cheap, sonnet implements expensive | low then moderate |
| worktree isolation | agent works in a git worktree, you review the diff | moderate |
| agent teams | 2-5 truly independent tasks in parallel | high |

**the scout pattern is the money move.** send haiku (~19x cheaper than sonnet for input, ~4x for output) to map the territory, then send sonnet to do the real work with targeted context. a 5-minute haiku exploration that reads 30 files costs almost nothing. a sonnet agent reading the same 30 files costs real money.

```
step 1: "haiku, find all files related to auth and list their exports"
step 2: "sonnet, refactor these 4 specific files to use the new middleware"
```

**anti-patterns to avoid:**
- spawning agents for simple grep/glob (just do it yourself -- thats one tool call)
- chaining agents that depend on each other in parallel (they can't see each other's results)
- using opus for quick lookups (haiku or just Read the file)
- delegating tasks that need context from your current conversation (the subagent starts with zero context)

**rule of thumb:** if the task can be done with 1-3 tool calls, do it yourself. subagents are for tasks that require 10+ steps, complex reasoning, or can run while you do other work.

see [subagent-patterns.md](./subagent-patterns.md) for the full playbook with real examples and a decision flowchart.

> [sub-agents docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

---

### 14. MCP servers

MCP (model context protocol) lets claude connect to external tools and data sources. an MCP server exposes tools that claude can call just like built-in tools.

**recommended servers:**

- **playwright MCP** -- browser automation. testing, scraping, visual verification. the chrome extension exists. i've tried it. it's unreliable -- disconnects, misses elements, can't handle SPAs. playwright MCP controls a real browser programmatically. for anything recurring, write actual playwright scripts instead of describing clicks in natural language.

- **context7** -- live documentation lookup. fetches current docs from the source instead of relying on training data.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-playwright"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

**when to build your own:**
- you have an internal API that claude should be able to query
- you want claude to interact with a database directly (with guardrails)
- you need a tool that doesn't exist as a public MCP server

**when not to bother:**
- a Bash command would do the same thing
- the tool is a simple HTTP call (use WebFetch)
- you'd only use it once

see [mcp-servers.md](./mcp-servers.md) for the deep dive on setup and building your own.

> [MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp-servers)

---

### 15. the .claude/ directory structure

here's what lives in `.claude/` and why:

```
.claude/
  settings.json          # project settings (commit this)
  settings.local.json    # local overrides (gitignored)
  CLAUDE.md              # project memory (commit this)
  commands/              # slash command definitions
    review.md
    stats.md
  skills/                # workflow skill definitions
    ship.md
    sweep.md
  agents/                # subagent definitions
    analyst.md
    explorer.md
  rules/                 # conditional instructions
    frontend.md          # loads when working on frontend files
  memories/              # claude's auto-generated memories
  handoffs/              # saved transcripts from PreCompact hooks
```

the user-level equivalent lives at `~/.claude/` with the same structure but applies to all projects.

---

### 16. task execution patterns

how to get the most out of a session:

**research-plan-implement** -- the most reliable workflow for anything non-trivial:
1. research: "read the auth module and explain how token refresh works"
2. plan: "propose a plan to add token revocation. list every file that needs to change"
3. implement: "implement the plan. start with the database migration, then the service layer, then the API route"

breaking work into phases prevents claude from diving into implementation before understanding the problem. you'd be surprised how often this saves a full restart.

**keep subtasks small.** if a change touches more than ~300 lines across many files, break it into smaller tasks. large diffs are harder for claude to get right and harder for you to review.

**know when to /compact.** if claude starts repeating itself, losing context, or making mistakes it made earlier, the context window is full. `/compact` summarizes and frees space.

**plan mode** (`--permission-mode plan` or toggle with `Shift+Tab`): claude reads and thinks but cannot modify anything. use this to explore a codebase, understand a bug, or design an approach before committing to changes.

> [best practices docs](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

## claude code crazy

### 17. the miner -- total recall for your dev work

the flagship plugin in this repo. every session you run gets parsed and stored in a local sqlite database at `~/.claude/miner.db`. it runs 7 hooks across the session lifecycle, building a searchable history of everything you do.

**install:**

```bash
claude plugin add anipotts/miner
```

**what the database captures:**

| table | what it stores |
|---|---|
| `sessions` | metadata: start/end time, model, project, duration, tokens, compaction count |
| `messages` | every user and assistant message with token counts |
| `tool_calls` | every tool invocation with input summary and timestamp |
| `errors` | tool failures with error messages |
| `subagents` | subagent lifecycle (linked to parent sessions) |
| `project_paths` | every location a project has ever lived (handles moves/renames) |
| `session_costs` | auto-computed USD cost per session (view) |
| `messages_fts` | FTS5 full-text search across all conversation content |

**the four named features:**

- **echo** (solution recall) -- fires on SessionStart. queries past sessions for this project and surfaces recent context so claude knows what you were working on. no more re-explaining
- **scar** (mistake memory) -- fires on PostToolUseFailure. records tool failures and looks for patterns. if the same tool has failed the same way before, it warns claude before it repeats the mistake
- **gauge** (model advisor) -- fires on UserPromptSubmit. classifies your prompt as simple or complex and nudges you if your current model is overkill or underpowered
- **imprint** (stack recall) -- fires on SessionStart. detects your project stack from manifest files and connects it to patterns from your other projects

**querying your history:**

```bash
# sessions today
sqlite3 ~/.claude/miner.db "SELECT project_name, model, start_time FROM sessions WHERE date(start_time) = date('now');"

# most used tools
sqlite3 ~/.claude/miner.db "SELECT tool_name, COUNT(*) as n FROM tool_calls GROUP BY tool_name ORDER BY n DESC LIMIT 10;"

# full-text search across all conversations
sqlite3 ~/.claude/miner.db "SELECT content_preview FROM messages_fts WHERE messages_fts MATCH 'streaming';"

# cost per project
sqlite3 ~/.claude/miner.db "SELECT project_name, printf('\$%.2f', SUM(estimated_cost_usd)) FROM session_costs GROUP BY project_name ORDER BY SUM(estimated_cost_usd) DESC;"
```

**the `/sift` skill** wraps these into canned subcommands: `/sift search <term>`, `/sift cost this month`, `/sift top tools`, `/sift cache efficiency`, `/sift wasted`, `/sift workflows`. see [sift.md](../skills/sift.md).

**the `/ledger` command** is the quick dashboard -- today's sessions, weekly spend, top tools, active projects. see [ledger.md](../commands/ledger.md).

**the `analyst` agent** writes arbitrary SQL queries to investigate whatever you're curious about. it's the difference between canned reports and free-form investigation:

```
/agent analyst am i spending more this week than last week?
/agent analyst which project has the worst cache hit rate and why?
/agent analyst compare my sonnet vs haiku usage
```

see [miner README](../plugins/miner/README.md) for install details and [analyst.md](../agents/analyst.md) for the agent definition.

---

### 18. headless CLI -- claude as a shell function factory

`claude -p "<prompt>"` runs claude code in non-interactive mode -- no session, no UI, just stdin/stdout. pipe stuff in, get answers out. once you internalize this pattern, you start piping everything through claude.

```bash
# add these to ~/.zshrc or ~/.bashrc

fix() {
  local output
  output=$(eval "$@" 2>&1)
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "$output"
    return 0
  fi

  echo "command failed (exit $exit_code). asking claude..." >&2
  echo "$output" | claude -p "this command failed: \`$*\`

here's the output:

\$(cat)

explain what went wrong and give me the exact command to fix it. be concise."
}

explain() {
  if [ -z "$1" ]; then
    echo "usage: explain <file> [function_name]" >&2
    return 1
  fi
  cat "$1" | claude -p "explain what this file does at a high level. what's its role, main exports, and how to use it. keep it under 200 words."
}

review() {
  git diff --cached | claude -p "review this diff. focus on bugs, security issues, and missing edge cases. rate severity: critical/warning/nit. be concise."
}
```

**usage:**

```bash
fix npm run build              # failed build? claude reads the error and tells you the fix
explain lib/auth.ts            # two-sentence summary of any file
review                         # code review staged changes before commit
```

more ideas -- anything you can pipe works:

```bash
git diff --merge | claude -p "explain this merge conflict and suggest a resolution"
npm test 2>&1 | claude -p "summarize what failed and why"
kubectl logs pod-name | tail -50 | claude -p "what's going wrong with this pod?"
```

tip: add `--model claude-haiku-4-5` to fix() and explain() -- they're fast lookups, not complex reasoning. save tokens.

see [cli-tools.md](./cli-tools.md) for more patterns.

---

### 19. the self-improvement loop

your CLAUDE.md should get better over time. the `/improve` skill automates this:

1. analyzes recent git history for revert patterns (where claude made a change and you undid it)
2. finds rapid fix cycles (a fix committed 2 minutes after the initial change = something was wrong)
3. cross-references miner.db error patterns if available
4. proposes specific additions, removals, and edits to CLAUDE.md
5. you review and approve -- it never auto-commits

```
/improve                          # analyze last 20 commits
/improve last 200 commits         # deeper analysis
/improve focus on testing patterns # scoped investigation
```

the output is a diff:

```diff
# CLAUDE.md

+ ## testing
+ - always run `npm test` before committing
+ - test files live in __tests__/ next to source files

  ## structure
- - API routes are in pages/api/
+ - API routes are in app/api/ (migrated from pages/ in commit abc123)

+ ## gotchas
+ - the auth middleware expects req.headers.authorization, not req.headers.auth
+ - never use `git add .` -- stage specific files to avoid committing .env
```

the feedback loop: claude makes mistake -> git history captures it -> /improve detects the pattern -> you add the rule -> claude never makes that mistake again. run it weekly or after any session where claude did something annoying.

you can also do this manually. after any session where claude keeps getting something wrong, add a rule to CLAUDE.md. the patterns add up fast.

see [improve.md](../skills/improve.md) for the full skill definition.

---

### 20. parallel worktree exploration

the explorer agent tries multiple approaches simultaneously in isolated git worktrees, then compares results so you can pick the winner.

```
/agent explorer should i use a class or a factory function for the auth middleware?
/agent explorer try implementing the cache with Map, WeakMap, and lru-cache
/agent explorer refactor the router -- try flat file structure vs nested feature folders
```

it works by spawning 2-4 Task subagents with `isolation: "worktree"`. each agent works in its own git worktree, makes changes, runs tests. when they all finish, explorer compares them on correctness, simplicity, performance, maintainability, and risk.

why this is powerful: instead of committing to one approach and potentially having to revert, you try 2-3 approaches simultaneously and pick the best one with evidence. costs more tokens, saves more time.

see [explorer.md](../agents/explorer.md) for the agent definition and [subagent-patterns.md](./subagent-patterns.md) for worktree isolation details.

---

### 21. daemons and cron

claude code can run headless on a schedule or in response to file changes. powerful but dangerous if you skip the safety guardrails.

**the golden rule: never auto-commit to main. never. not even "just this once."**

**file watcher daemon:**

```bash
#!/bin/bash
# watch for source changes, run tests on each save (read-only -- cannot modify files)
fswatch -0 --exclude '.git' --include '\.ts$' src/ | while IFS= read -r -d '' file; do
  echo "changed: $file"
  claude -p "the file $file was just modified. run its tests and report results. DO NOT modify any files." \
    --allowedTools Bash,Read,Grep,Glob \
    --model claude-haiku-4-5 \
    2>&1 | tee -a /tmp/claude-daemon.log
done
```

key safety: `--allowedTools` explicitly excludes Write and Edit.

**safe cron pattern -- weekly dependency check:**

```bash
#!/bin/bash
set -euo pipefail
cd /path/to/project
BRANCH="maintenance/deps-$(date +%Y%m%d)"
git checkout main && git pull origin main
git checkout -b "$BRANCH"

claude -p "check for outdated deps and security vulnerabilities. apply critical updates, run tests after each." \
  --allowedTools Bash,Read,Write,Edit,Grep,Glob

if git diff --quiet; then
  git checkout main && git branch -D "$BRANCH"
  exit 0
fi

git add -A && git commit -m "chore: dependency updates $(date +%Y-%m-%d)"
git push -u origin "$BRANCH"
gh pr create --title "chore: dep updates" --body "automated check. review before merging." --base main
git checkout main
```

always branch, always PR, always human review.

**safety checklist for any automation:**
- `--allowedTools` is set (no Write/Edit unless absolutely necessary)
- output is logged to a file
- prompts include negative constraints ("DO NOT modify files")
- never pushes to main directly
- never auto-merges -- opens a PR
- has a timeout (`timeout 300 claude -p "..."`)

see [automation.md](./automation.md) for the full playbook including the guardian agent pattern.

---

### 22. github actions

claude code works in CI/CD. `@claude` in PR comments triggers claude to review or implement feedback:

```yaml
# .github/workflows/claude-review.yml
name: Claude Review
on:
  pull_request:
    types: [opened, synchronize]
  issue_comment:
    types: [created]

jobs:
  review:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

you can also run `--print` mode in CI for automated security reviews, changelog generation, or PR descriptions:

```yaml
- name: Security check
  run: |
    claude --print "review changes for security issues. output JSON: {issues: [{file, line, severity, description}]}" --output-format json > report.json
```

> [github actions docs](https://docs.anthropic.com/en/docs/claude-code/github-actions)

---

### 23. prompt caching strategies

prompt caching gives you a 90% discount on input tokens for content that stays the same across turns. the catch: your cached content must exceed 4,096 tokens to qualify.

**how to hit the minimum:**
- CLAUDE.md with real substance (project structure, conventions, examples) -- not just 10 lines
- few-shot examples in your system prompt push you past the threshold
- use `@path` imports to pull in additional context files
- tools and MCP server definitions count toward the cached content

**measuring your cache hit rate:**

```
/sift cache efficiency
```

this queries miner.db for cache read vs creation vs uncached tokens. above 60% is good, above 80% is excellent. below 40% means your system prompts aren't hitting the 4,096 token minimum.

**real numbers:** on a project with a 200-line CLAUDE.md and 20 few-shot examples, cache hit rates typically run 70-85%. on a minimal CLAUDE.md (under 4,096 tokens), cache hits are near zero and you're paying full price for every turn.

---

### 24. cost optimization -- real numbers

after thousands of sessions, here's what actually moves the needle on costs:

**model selection is the biggest lever:**

| task type | recommended model | why |
|---|---|---|
| file lookups, simple questions | haiku ($0.80/$4) | 19x cheaper input than sonnet, fast |
| code generation, refactoring | sonnet ($3/$15) | the workhorse, best cost/quality ratio |
| architecture, complex design | opus ($15/$75) | 5x more than sonnet, worth it for the hard 10% |
| codebase scouting (subagents) | haiku ($0.80/$4) | scout with haiku, strike with sonnet |

**other optimizations:**
- prompt caching (see above) -- 90% discount on repeated content
- `/compact` before context gets too long -- long conversations burn tokens on every turn
- break large tasks into smaller sessions -- fresh context is cheaper than carrying 200K tokens
- use `/model haiku` for quick lookups mid-session, then switch back
- avoid subagents for simple tasks (each one has startup overhead)
- use `--allowedTools` in headless mode to prevent unnecessary tool calls

**tracking your spend:** `/ledger` for daily glance, `/sift cost this month` for the bill, `/agent analyst` for deep dives into where your tokens are going.

---

### 25. the project move problem

you rename a directory. or you clone the repo to a different path. or you switch machines. suddenly all your session history is orphaned because claude code uses the filesystem path to identify projects.

the `project_paths` table in miner.db solves this. it tracks every location a project has ever lived:

```sql
SELECT project_name, project_dir, cwd, session_count, first_seen, last_seen
FROM project_paths
WHERE project_name = 'my-project';
```

the miner's `startup.sh` hook detects when a project has moved (same name, different path) and links the new path to existing history. your sessions follow the project, not the directory.

`/sift project my-project` queries across ALL paths the project has ever lived at.

---

### 26. advanced hook patterns

**hook chains** -- multiple hooks on the same event run in parallel. all must pass for blocking events:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {"type": "command", "command": "~/.claude/hooks/security-check.sh"},
          {"type": "command", "command": "~/.claude/hooks/audit-log.sh"}
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {"type": "command", "command": "~/.claude/hooks/file-guard.sh"}
        ]
      }
    ]
  }
}
```

**conditional hooks per project** -- use project-level settings for project-specific hooks, user-level for global guards. they merge together:

```
~/.claude/settings.json              global safety guards (always active)
my-project/.claude/settings.json     project-specific formatting hooks
my-project/.claude/settings.local.json  your personal project hooks (gitignored)
```

**prompt-based hooks** -- let a fast claude model evaluate whether to allow an action instead of writing bash logic:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all requested tasks are complete and no errors remain. Respond {\"ok\": true} to allow stopping or {\"ok\": false, \"reason\": \"explanation\"} to continue.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**agent-based hooks** -- spawn a subagent with Read/Grep/Glob access for complex verification:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify that all unit tests pass and no TODO comments remain in modified files.",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

**async hooks** -- for slow work that shouldn't block claude:

```json
{
  "type": "command",
  "command": "~/.claude/hooks/run-tests.sh",
  "async": true,
  "timeout": 300
}
```

see [hooks-guide.md](./hooks-guide.md) for the full reference.

---

### 27. writing your own plugins

if you've built hooks that others would find useful, package them as a plugin:

1. create a directory with `plugin.json` + hook scripts
2. test locally: `claude plugin add /path/to/your-plugin`
3. push to github and add the `claude-code-plugin` topic
4. anyone installs with `claude plugin add your-name/your-plugin`

the full walkthrough with the plugin.json spec, directory structure conventions, and the 8 most common mistakes is in [plugin-creation.md](./plugin-creation.md).

key tips:
- all paths in `plugin.json` must be relative (`./hooks/guard.sh`, not absolute paths)
- `chmod +x` your scripts -- the #1 silent failure
- use `$CLAUDE_PLUGIN_ROOT` in scripts if you need to reference plugin-local files
- test by piping sample JSON into your hook before installing

---

## credits

this guide draws from hands-on experience and community knowledge.

**boris cherny's claude code tips** -- several patterns in this guide were inspired by or refined from boris's excellent tips. specifically:
- daemon patterns (section 21) -- tip #1
- self-improvement loops / `/improve` (section 19) -- tip #2
- headless CLI shell functions (section 18) -- tip #4
- parallel worktree exploration / explorer agent (section 20) -- tip #5
- knowledge graphs and project mapping -- tip #6
- CLAUDE.md as a living document (section 3) -- tip #10
- cron maintenance patterns (section 21) -- tip #12

**claude code official docs** -- the hook events reference, permission modes, settings schema, and MCP server configuration are documented at [docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code/overview). the [hooks reference](https://docs.anthropic.com/en/docs/claude-code/hooks) was the primary source for section 11 and the [hooks-guide.md](./hooks-guide.md).

**anthropic blog** -- the [hooks customization post](https://claude.com/blog/how-to-configure-hooks) provided additional context on hook patterns and best practices.

---

*this guide covers claude code as of february 2026. for the latest, check the [official docs](https://docs.anthropic.com/en/docs/claude-code/overview).*
