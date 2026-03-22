<!-- tested with: claude code v2.1.77 -->

# the claude code ecosystem

> last updated: 2026-03-21 | sources: [interactive mode docs](https://code.claude.com/docs/en/interactive-mode), [VS Code docs](https://code.claude.com/docs/en/vs-code), [web docs](https://code.claude.com/docs/en/claude-code-on-the-web), [chrome docs](https://code.claude.com/docs/en/chrome), [remote control docs](https://code.claude.com/docs/en/remote-control), [cowork docs](https://support.claude.com/en/articles/13345190-get-started-with-cowork)

six surfaces, one ecosystem, wildly different experience. this is the stuff nobody tells you until you've wasted an hour fighting the wrong interface.

---

## at a glance

| capability | terminal CLI | VS Code ext | JetBrains ext | web (cloud) | mobile (remote) | chrome / cowork |
|---|---|---|---|---|---|---|
| **full tool access** | yes — all tools | yes — all tools | yes — most tools | cloud VM tools | local via remote | browser tools only |
| **file read/write** | full filesystem | workspace scoped | workspace scoped | cloud VM repo | local via remote | page context only |
| **bash execution** | yes | yes (integrated terminal) | yes | cloud VM | local via remote | no |
| **MCP servers** | yes | yes (add via CLI) | yes | repo-level only | local via remote | *is* an MCP server |
| **hooks** | yes — all events | yes — shared config | partial | repo-level only | local via remote | no |
| **plugins** | yes | yes (GUI) | yes | repo config only | local via remote | n/a |
| **agents/subagents** | yes — up to 10 | yes — up to 10 | yes | yes — up to 10 | yes via remote | n/a |
| **git integration** | native (shell) | native + VS Code git | native + IDE git | GitHub only (cloud) | local via remote | n/a |
| **image paste in chat** | yes (Ctrl+V) | yes (drag/drop) | yes | limited upload | camera/upload | screenshots |
| **image paste in AskUserQuestion** | **yes** | **no** ([#22377](https://github.com/anthropics/claude-code/issues/22377)) | **no** | **no** | limited | n/a |
| **context window** | 200k / 1M on max | 200k / 1M on max | 200k / 1M on max | 200k / 1M on max | matches local session | page-scoped |
| **model selection** | opus/sonnet/haiku (Alt+P) | opus/sonnet/haiku | opus/sonnet/haiku | opus/sonnet/haiku | matches local session | plan-dependent |
| **voice input** | yes (hold Space) | no | no | no | no | no |
| **vim mode** | yes (`/vim`) | no | no | no | no | no |
| **keyboard shortcuts** | full customization | VS Code keybindings | IDE keybindings | browser defaults | phone keyboard | none |
| **multi-file editing** | unlimited | unlimited | unlimited | unlimited (cloud) | via remote | n/a |
| **async / fire-and-forget** | no (session stays open) | no | no | **yes** — close laptop, come back | monitor only | no |
| **cost model** | API / max plan | API / max plan | API / max plan | plan-based | shares local plan | plan-based |

---

## 1. terminal CLI

**command:** `claude` in any terminal

this is the power user surface. everything else is a subset of what the terminal can do.

### why terminal wins

**image pasting in AskUserQuestion responses.** the single biggest hidden advantage. when claude uses AskUserQuestion and you want to give custom input (not one of the provided options), the terminal lets you paste images directly into your response with Ctrl+V / Cmd+V / Alt+V. VS Code extension [can't do this](https://github.com/anthropics/claude-code/issues/22377) (filed feb 2026). for design/UI work, terminal is the only surface that doesn't break your flow.

**full tool access.** every tool works: Bash, Read, Write, Edit, Glob, Grep, Agent (up to 10 subagents), WebSearch, WebFetch, MCP tools, LSP, CronCreate, TaskCreate, everything. no restrictions beyond what you configure with `--sandbox`.

**hooks and plugins.** all hook events fire: PreToolUse, PostToolUse, Stop, SubagentStart, SubagentStop, SessionStart, SessionEnd, PreCompact, Notification. plugins install and run natively. this is the only surface where you get the full automation stack.

**voice input.** hold Space for push-to-talk dictation. 20 languages supported as of march 2026. useful for describing what you want while looking at code.

**vim mode.** `/vim` gives you full modal editing with navigation, text objects, and editing commands. not available anywhere else.

**remote control.** start with `claude --remote-control` or `claude remote-control`, then connect from claude.ai/code or the mobile app. your local session, accessible from anywhere. `--spawn worktree` supports up to 32 concurrent remote sessions.

**shell is the context.** you're already in your terminal. `git status`, `docker ps`, `kubectl get pods` — no context switching. `!` prefix runs bash directly without claude interpretation.

### terminal-only features

| feature | shortcut | what it does |
|---|---|---|
| image paste | Ctrl+V / Alt+V | paste clipboard images into prompts and AskUserQuestion responses |
| voice input | hold Space | push-to-talk dictation |
| vim mode | `/vim` | full modal editing |
| background bash | Ctrl+B | background a running command |
| kill all agents | Ctrl+F (2x) | stop all background subagents |
| task list | Ctrl+T | view/manage tasks |
| side question | `/btw` | ask without polluting main conversation |
| bash shortcut | `! command` | run shell command directly |
| model switch | Alt+P | change model mid-session |
| thinking toggle | Alt+T | toggle extended thinking |
| reverse search | Ctrl+R | search conversation history |
| editor mode | Ctrl+G | open $EDITOR for long inputs |
| remote control | `--remote-control` | connect from web/mobile |

### terminal gotchas

- no syntax highlighting in diffs (raw `+`/`-` lines)
- long outputs scroll past — you're reading a stream, not a panel
- no inline file preview — paths and line numbers, not rendered files
- image paste requires iTerm2, kitty, or similar (most basic terminals don't render images)
- session transcript is JSON, not a pretty chat log
- no tab completion for code (that's cursor's thing)

### best for

- **design/UI work** — paste screenshots when claude asks questions
- **infrastructure work** — already in terminal for docker/k8s/terraform
- **power users** — hooks, plugins, agents, MCP, full automation
- **multi-repo work** — `cd` into any project, `claude` is ready
- **overnight autonomous loops** — set it and walk away
- **parallel sessions** — 5 iTerm2 tabs = 5 concurrent claude sessions (the Boris Cherny workflow)

---

## 2. VS Code extension

**install:** extensions marketplace → "Claude Code"

the most popular surface. gets you 90% of terminal capabilities with a visual IDE.

### what's better than terminal

**visual diffs.** edits show as VS Code diffs — green/red highlighting, inline changes, accept/reject buttons. genuinely better for reviewing multi-file changes.

**@-mentions.** reference files with fuzzy matching and line ranges: `@auth.ts#5-10`. terminal has no equivalent.

**plan mode with inline comments.** Shift+Tab enters plan mode. claude writes a full markdown plan. you can comment inline on specific parts before it executes. in terminal, plan mode is text-only.

**file navigation.** click a file path in claude's output → opens in editor. terminal gives you `file_path:line_number` but you navigate manually.

**multiple conversations.** open tabs or windows with independent claude sessions. terminal requires separate terminal tabs.

**checkpoints.** fork or rewind to any point in the conversation. terminal has no visual checkpoint system.

**`@terminal:name` references.** point claude at terminal output by name. `@browser` for chrome automation.

**built-in IDE MCP.** auto-runs an `ide` MCP server with `getDiagnostics` (language server errors) and `executeCode` (Jupyter). terminal doesn't have this.

### VS Code gotchas

- **no image paste in AskUserQuestion.** [github issue #22377](https://github.com/anthropics/claude-code/issues/22377). when claude asks a question with options, you can only type text or click a button. no screenshots. workaround: community extension "Claude Code Image Paste" saves clipboard to file + inserts path. ugly but works
- **no voice input.** no hold-Space dictation
- **no vim mode.** you have VS Code's vim extension, but not claude's `/vim`
- **no `!` bash prefix.** can't run shell commands directly from the chat
- extension updates lag behind CLI by days/weeks
- memory pressure — VS Code + claude + language server + your code = rough on 16GB machines
- cursor (forked VS Code) works but some keybindings conflict
- Alt+V works for image paste in the integrated terminal, not the extension panel

### VS Code shortcuts

| shortcut | what it does |
|---|---|
| Cmd+Esc / Ctrl+Esc | toggle focus between editor and claude |
| Cmd+Shift+Esc | open new conversation tab |
| Alt+K / Option+K | insert @-mention from current selection |
| Cmd+N / Ctrl+N | new conversation (when claude focused) |
| Shift+Tab | enter plan mode |

### best for

- **daily coding** — visual diffs, file navigation, familiar IDE
- **code review** — side-by-side layout, getDiagnostics integration
- **teams** — lower barrier to entry than terminal for junior devs
- **plan-heavy work** — inline commenting on plans before execution
- **Jupyter workflows** — executeCode MCP for notebook cells

---

## 3. JetBrains extension

**install:** JetBrains marketplace → "Claude Code"

same as VS Code in spirit, adapted for IntelliJ/PyCharm/WebStorm/GoLand/etc.

### what's different

- leverages JetBrains' refactoring engine for some operations
- integrated with JetBrains' git tooling (better merge conflict UI)
- most hooks and plugins work, but some edge cases with JetBrains' terminal emulator
- same AskUserQuestion image limitation as VS Code — **no image paste**
- no `@terminal:name` references (VS Code specific)

### best for

- **java/kotlin/python devs** who live in JetBrains and don't want to switch
- you get most terminal benefits without leaving your IDE

---

## 4. claude code on the web (cloud)

**url:** claude.ai/code

this is NOT the same as claude.ai chat. this is full claude code running on anthropic-managed cloud VMs. separate product.

### what you get

- **full claude code** running in a cloud sandbox — file read/write, bash, git, subagents
- **async execution** — start a task, close your laptop, come back later. this is the killer feature
- **parallel sessions** — multiple `--remote` tasks across different repos simultaneously
- **diff viewer** — review changes file by file, comment on diffs before PR
- **session sharing** — team/enterprise: team visibility; pro/max: public visibility
- **pre-installed toolchains** — python, node.js, ruby, PHP, java, go, rust, C++, PostgreSQL 16, Redis 7.0
- **teleport** — `/teleport` moves a web session to your local terminal
- **setup scripts** — custom environment config that runs before claude starts

### what's different from terminal

- **no local filesystem.** runs in cloud VM. can only access the cloned repo
- **GitHub only.** no GitLab, no Bitbucket, no self-hosted. requires claude GitHub app
- **repo-level hooks only.** hooks committed to `.claude/settings.json` run. your user-level `~/.claude/settings.json` does NOT carry over
- **no user-level MCP servers.** only MCP servers configured in the repo
- **network restrictions.** three levels: no internet, limited (default — allowlisted package registries/cloud platforms), full. all traffic goes through a security proxy
- **one-way teleport.** web → terminal only. can't push an existing terminal session to web
- **Bun doesn't work** with the security proxy
- **git push restricted** to current working branch only. credentials never enter the sandbox

### best for

- **async fire-and-forget tasks** — "fix these 5 bugs" then go to lunch
- **parallel bug fixes** across multiple repos simultaneously
- **repos you haven't cloned locally** — cloud VM handles it
- **backend work** where claude can write + run tests autonomously
- **CI-like workflows** — full test suite execution in cloud

---

## 5. mobile app (remote control)

**how:** terminal runs `claude --remote-control`, then connect from claude app on phone

this is NOT a standalone mobile coding tool. it's a window into your running local terminal session. your local machine does the work.

### what you get

- full conversation history from your terminal session
- send messages, answer AskUserQuestion prompts, approve/reject changes
- monitor tool activity and connection status
- **all local capabilities** — bc execution happens on your machine, not the phone

### what's limited

- terminal must stay open on your machine
- if laptop sleeps or network drops for ~10 min, session times out
- code review on a phone screen is impractical for detailed work
- one remote session per interactive process (unless using `--spawn` server mode)
- requires claude.ai OAuth (API keys not supported)
- not available through Bedrock/Vertex/Foundry

### availability

all paid plans. team/enterprise requires admin to enable Remote Control toggle.

### best for

- **monitoring long-running tasks** from the couch or commute
- **quick approvals** — "yes, merge it" / "no, try the other approach"
- **steering** — "focus on tests first" while away from desk
- **starting at desk, continuing oversight from phone**

---

## 6. chrome extension + cowork (desktop app)

two related but different things. both are lighter-touch surfaces.

### chrome extension ("claude in chrome")

**install:** chrome web store → "Claude" (chrome and edge only — not brave, arc, or other chromium)

this is NOT a standalone interface. it's a browser automation tool that integrates with terminal CLI or VS Code as an MCP server.

**what it does:**
- navigate pages, click buttons, fill forms, type text
- read console logs, monitor network requests
- record GIFs of browser interactions
- extract data from web pages
- multi-tab, multi-site workflows
- shares your browser login state (access any site you're signed into)
- CAPTCHA/login pages: pauses and asks you to handle manually

**how to enable:**
- CLI: `claude --chrome` or `/chrome` within a session
- VS Code: automatically available when extension installed
- shows up as `claude-in-chrome` MCP server (run `/mcp` to see it)

**gotchas:**
- beta status — service worker can idle during long sessions (`/chrome` to reconnect)
- enabling by default increases context usage (browser tools always loaded)
- JavaScript dialogs (alert/confirm) block browser events

**best for:**
- testing local web apps (localhost:3000) with console debugging
- design verification against Figma mocks
- data extraction from authenticated web apps (Google Docs, Notion, Gmail)
- recording demo GIFs of browser interactions

### cowork (claude desktop app)

**install:** claude.ai → download desktop app

cowork uses the same agentic architecture as claude code but is oriented toward knowledge work, not pure coding.

**what it does:**
- multi-step tasks with subagent coordination
- file creation: Excel with formulas, PowerPoint, formatted documents
- 38+ connectors: Gmail, Drive, Microsoft 365, Slack, Notion, Figma, etc.
- scheduled/recurring tasks
- projects for persistent workspaces
- local file read/write via MCP filesystem server
- dispatch remote control (new march 18, 2026)

**what it doesn't do:**
- no terminal/bash execution
- no hooks from `.claude/settings.json`
- different plugin system than claude code
- conversation history stored locally, not in audit logs (don't use for regulated workloads)
- macOS x64 and Windows x64 only (no arm64 Windows)

**best for:**
- **knowledge work** — research, report generation, document processing
- **scheduled tasks** — weekly reports, data pulls
- **multi-app workflows** — email + docs + spreadsheets in one flow
- **non-developers** who need agentic capabilities

---

## decision matrix

| your situation | use this | why |
|---|---|---|
| building features, fixing bugs | **terminal** or **VS Code** | full tool access, visual diffs |
| design/UI iteration with screenshots | **terminal** | only surface with image paste in AskUserQuestion |
| infrastructure, DevOps | **terminal** | already in terminal for docker/k8s/terraform |
| junior dev, first time | **VS Code** | visual diffs, @-mentions, familiar IDE |
| java/kotlin shop | **JetBrains** | stay in your IDE |
| fire-and-forget async tasks | **web (cloud)** | close laptop, come back to results |
| parallel work across repos | **web (cloud)** | multiple concurrent cloud sessions |
| overnight autonomous loops | **terminal** | local execution, full hooks |
| monitoring from couch/commute | **mobile (remote)** | quick approvals, steering |
| reviewing PRs on GitHub | **chrome extension** | browser context + claude |
| testing local web apps | **chrome extension** (via CLI/VS Code) | console logs, form filling |
| knowledge work, reports, docs | **cowork (desktop)** | Excel/PowerPoint, 38+ app connectors |
| whiteboard sketch → code | **mobile** (camera) → **terminal** | photo capture then implementation |
| maximum control and customization | **terminal** | all hooks, vim, voice, keybindings |
| plan-heavy architectural work | **VS Code** | inline plan commenting |

---

## the image paste thing (deep dive)

this deserves its own section bc it's the most commonly misunderstood difference and it determines where you should do UI work.

**the scenario:** claude is working on your UI. it uses `AskUserQuestion` to ask "which of these two layouts do you prefer?" with options A, B, and a custom input field.

**in terminal:** you select the custom input option and paste a screenshot with Ctrl+V. "actually, neither — make it look like this" + image. claude sees the image and adjusts. this is an incredibly powerful workflow for iterative design.

**in VS Code / JetBrains / web / mobile:** you can only type text. "make the header bigger and move the nav to the left" — but you can't show what you mean. you end up playing telephone with words when a screenshot would be 10x faster.

**why this matters:**
- UI/UX work is visual. words are lossy. screenshots aren't
- iterative design means many rounds of "no, more like this"
- the terminal's image paste turns those rounds from 5 back-and-forths into 1
- experienced claude code users doing frontend work almost always use terminal for this reason

**workarounds:**
- **VS Code:** keep a terminal tab open alongside VS Code. switch to terminal for image-heavy AskUserQuestion interactions
- **VS Code community extension:** "Claude Code Image Paste" saves clipboard images to a file and inserts the path. clunky but functional
- **any surface:** save screenshot to file, reference it by path in your text response. claude can read image files. but it's 5 steps instead of 1

**status:** VS Code image paste is tracked in [github issue #22377](https://github.com/anthropics/claude-code/issues/22377) (filed feb 2026). no ETA.

---

## feature parity over time

claude code's surfaces are converging. features ship to terminal first, then IDE extensions, then web. some gaps may close:

- image paste in AskUserQuestion for VS Code — frequently requested, tracked
- web claude.ai/code gaining more agentic capabilities (already has cloud VMs)
- mobile remote control expanding beyond monitor-and-steer
- cowork getting more developer-oriented connectors

but as of march 2026, the terminal is the only surface with the full feature set. plan accordingly.

---

## further reading

- [claude code guide](./guide.md) — comprehensive setup and usage
- [hooks reference](./hooks-reference.md) — what hooks work on which surface
- [plugin creation](./plugin-creation.md) — plugins are terminal/IDE only
- [cli tools](./cli-tools.md) — terminal-specific tooling
- [cost reality](../tips/cost-reality.md) — what all this actually costs

tested with: claude code v2.1.77
