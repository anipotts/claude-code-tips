<!-- tested with: claude code v1.0.34 -->

# claude code vs openai codex CLI

> last verified: 2026-03-08 | sources: [openai codex CLI](https://github.com/openai/codex), [codex pricing](https://developers.openai.com/codex/pricing/), [anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/models), [claude.ai plans](https://claude.com/pricing), [claude code docs](https://docs.anthropic.com/en/docs/claude-code/overview)

---

## at a glance

| feature | claude code | openai codex CLI |
|---------|------------|-----------------|
| pricing | free tier / $20 pro / $100 max 5x / $200 max 20x per month | $20/mo ChatGPT Plus / $200/mo Pro (includes codex access) |
| model | opus 4.6, sonnet 4.6, haiku 4.5 | GPT-5.3-Codex, codex-mini, GPT-5.4 |
| context | 200K tokens (standard), managed window with compaction | varies by model |
| interaction | real-time interactive terminal | real-time terminal + async cloud agent (web) |
| platform | terminal CLI, VS Code, JetBrains | terminal CLI, VS Code, Cursor, Windsurf, macOS app |
| extensibility | hooks, plugins, skills, agents, commands, MCP servers | MCP support (stdio), approval modes, limited extension |
| open source | yes ([anthropics/claude-code](https://github.com/anthropics/claude-code)) | yes ([openai/codex](https://github.com/openai/codex)), Rust + TypeScript |
| sandbox | runs locally, hooks for safety controls | cloud sandbox (web agent), local execution (CLI) |

---

## where claude code wins

### extensibility is not close

claude code has a full developer platform: hooks that intercept tool calls, plugins that persist data across sessions, skills that encode reusable workflows, agents that run as subprocesses, and commands you can invoke with `/`. codex CLI has MCP support and approval modes, but nothing equivalent to the hook/plugin/agent ecosystem.

this matters bc extensibility is what turns a coding tool into *your* coding tool. hooks that block dangerous commands, plugins that mine session data, agents that run code sweeps -- these compound over time.

### conversation continuity

`claude --continue` resumes your last session exactly where you left off. `--resume` lets you pick any past session. combined with the miner plugin, you get a searchable sqlite database of every session, every tool call, every file touched. codex has session history but no equivalent mining/analysis layer.

### established patterns at scale

4000+ session-tested patterns in this repo alone. community plugins, documented agent architectures, subagent coordination patterns, cost optimization strategies. the claude code ecosystem has had more time to mature and it shows in the depth of available tooling.

### model switching mid-session

`/model` switches between opus, sonnet, and haiku mid-conversation. use haiku for lookups, sonnet for implementation, opus for architecture -- all in one session. codex supports `/model` for switching between GPT models too, but claude code's tiered pricing (haiku at $1/M input vs opus at $5/M) gives you more cost control.

---

## where codex wins

### cloud sandbox by default

the codex web agent runs in a cloud sandbox -- your local machine is never at risk. claude code runs locally, which means a bad `rm -rf` could hit your filesystem (though hooks can prevent this). codex CLI also runs locally, but the web agent's sandbox is a genuine safety advantage for risky tasks.

### multi-surface access

codex ships as a CLI, VS Code extension, Cursor extension, Windsurf extension, and macOS desktop app. claude code covers terminal, VS Code, and JetBrains -- solid coverage, but codex has more surfaces.

### token efficiency

codex reportedly uses fewer tokens per task for comparable results, based on community reports. this could translate to lower API costs if you're on pay-per-token pricing. real-world results vary by task type.

### async cloud agent

the codex web agent accepts a task, works on it in the background, and presents results when done. for large batch refactors or tasks where you don't need to watch, this is a different (sometimes better) workflow. claude code is always interactive -- you're either watching or it's waiting.

---

## the numbers

### pricing breakdown

| plan | claude code | codex |
|------|------------|-------|
| free | limited usage | limited (ChatGPT Free, temporary) |
| entry | $20/mo (Pro) | $20/mo (ChatGPT Plus) |
| power user | $100/mo (Max 5x) | -- |
| heavy use | $200/mo (Max 20x) | $200/mo (ChatGPT Pro) |

note: anthropic heavily subsidizes power users on the $200/mo plan. actual API costs for a heavy claude code session can exceed what you pay. openai's $200/mo Pro plan includes codex with 2x rate limits, plus access to GPT-5, o3-pro, and other models.

both entry tiers at $20/mo are comparable in value. the difference is in the middle -- claude code's $100/mo Max 5x tier has no codex equivalent.

### API pricing (if using direct API access)

| model | input (per M tokens) | output (per M tokens) |
|-------|---------------------|----------------------|
| claude haiku 4.5 | $1.00 | $5.00 |
| claude sonnet 4.6 | $3.00 | $15.00 |
| claude opus 4.6 | $5.00 | $25.00 |
| codex-mini-latest | $1.50 | $6.00 |
| GPT-5 | $1.25 | $10.00 |

codex-mini is cheaper than sonnet per token. whether that matters depends on how many tokens each tool uses to complete the same task -- and that varies significantly by task.

### interaction model

**claude code**: type -> watch claude work -> interrupt -> redirect -> iterate. seconds between actions. you see every tool call as it happens. `Ctrl+C` to interrupt, natural language to redirect.

**codex CLI**: similar real-time terminal interaction. type -> watch -> redirect. comparable to claude code's terminal experience.

**codex web agent**: submit task -> wait 1-10 minutes -> review result -> accept/reject. minutes between actions. better for "fire and forget" workflows.

for hotfixes and iterative development, real-time interaction wins. for large batch refactors where you don't need to watch, the async web agent can work. claude code is real-time only -- there's no "submit and come back later" mode (though headless CLI with `--print` gets close).

---

## verdict

claude code is the better choice for developers who want deep extensibility, real-time interactive workflows, and a mature ecosystem of plugins, hooks, and agents. the extensibility gap is the biggest differentiator -- claude code's plugin/hook/agent system has no codex equivalent, and it compounds over time as you build custom tooling around your workflow.

codex is worth considering if you want cloud-sandboxed execution, async batch workflows via the web agent, or you're already deep in the openai ecosystem. the CLI experience is solid and the multi-surface availability (VS Code, Cursor, Windsurf, desktop app) is broader than claude code's.

if you're choosing between the two, the question is: do you want a tool you can deeply customize and extend (claude code), or a tool with more deployment surfaces and a cloud sandbox (codex)? for power users who invest in their tools, claude code's extensibility is hard to match.

> see also: [pricing comparison across all tools](pricing.md)
