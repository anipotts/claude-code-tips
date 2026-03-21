# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.77-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)

i've run 4,000+ claude code sessions. this is everything i learned — a plugin, hooks, agents, and my actual takes on what works.

**this repo maintains itself using the patterns it teaches.**

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

## install

```bash
claude plugin add anipotts/claude-code-tips
```

you get **mine** — session mining to sqlite. costs, search, error memory, pattern detection. data stays local at `~/.claude/mine.db`.

```
/mine                          → today's sessions, cost, top tools
/mine search "websocket"       → full-text search across all conversations
/mine mistakes                 → error patterns claude keeps repeating
/mine hotspots                 → most-edited files across sessions
```

start with `mine` + `safety-guard` hook. add more as you go. **[mine docs →](./plugins/mine/README.md)**

---

## hooks

copy one, wire it up, done. see [hooks reference →](./docs/claude-code/hooks-reference.md)

| hook | event | what it does |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | blocks squash merges |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | logs every tool call to sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | saves context before compression |
| [notify](./hooks/notify.sh) | Notification | routes to macOS, Slack, ntfy |
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | reminds you to commit after N edits |
| [replay-capture](./hooks/replay-capture.sh) | PostToolUse | captures file changes for VHS replays |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | auto-updates tested-with stamps |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | warns about gone tracking branches |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | auto-fixes markdown lint on save |
| [knowledge-builder](./hooks/knowledge-builder/) | PostToolUse | builds a codebase knowledge graph |

## agents

| agent | what it does |
|---|---|
| [explorer](./.claude/agents/explorer.md) | parallel worktree exploration — try risky changes safely |
| [analyst](./.claude/agents/analyst.md) | free-form SQL against mine.db |
| [test-writer](./.claude/agents/test-writer.md) | generates edge case tests you missed |
| [guardian](./.claude/agents/guardian.md) | watches your project, proposes fixes |
| [code-sweeper](./.claude/agents/code-sweeper.md) | finds dead code, unused imports |
| [pr-narrator](./.claude/agents/pr-narrator.md) | writes PR descriptions from your diff |
| [vibe-check](./.claude/agents/vibe-check.md) | quick architecture review |

## commands

| command | what it does |
|---|---|
| `/mine` | usage data — costs, sessions, search |
| `/ship` | stage, commit, push, open PR |
| `/sweep` | clean dead code, unused imports |
| `/quicktest` | find and run tests for current file |
| `/deps` | dependency updates and security audit |
| `/improve` | propose CLAUDE.md updates from git history |

---

## docs

| | what | who it's for |
|---|---|---|
| **concepts** | [subagent patterns](./docs/concepts/subagent-patterns.md), [automation](./docs/concepts/automation.md), [cost optimization](./docs/concepts/cost-optimization.md) | anyone using agentic coding tools |
| **claude code** | [guide](./docs/claude-code/guide.md), [hooks](./docs/claude-code/hooks-reference.md), [plugins](./docs/claude-code/plugin-creation.md), [MCP](./docs/claude-code/mcp-servers.md), [CLI](./docs/claude-code/cli-tools.md) | claude code users |
| **comparisons** | [vs cursor](./docs/comparisons/cursor.md), [vs codex](./docs/comparisons/codex.md), [vs gemini](./docs/comparisons/gemini.md), [pricing](./docs/comparisons/pricing.md) | choosing a tool |
| **my tips** | [why hooks matter](./docs/tips/why-hooks-matter.md), [my stack](./docs/tips/my-automation-stack.md), [mistakes i made](./docs/tips/mistakes-i-made.md), [cost reality](./docs/tips/cost-reality.md) | my personal takes |

concepts/ is tool-agnostic. tips/ is me.

---

## how this repo works

this repo is its own best example. [what's running →](./docs/claude-code/this-repo.md)

- **8 CI pipelines** — upstream watcher, competitive intel, community digest, docs audit, freshness, stale cleanup, dependabot, releases
- **11 hooks**, **10 agents**, **8 commands** — all running on this repo
- **0 manual maintenance** — everything that doesn't require taste is automated

---

## examples

- [CLAUDE.md templates](./examples/claude-md/) — starter configs for TypeScript, Python, Rust, Next.js
- [handoff plugin](./examples/plugins/handoff/) — PreCompact context preservation
- [broadcast plugin](./examples/plugins/broadcast/) — async notifications on git events

---

MIT · built by [anipotts](https://anipotts.com) from 4,000+ sessions
