# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![docs freshness](https://github.com/anipotts/claude-code-tips/actions/workflows/freshness-check.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/freshness-check.yml)
[![upstream watch](https://github.com/anipotts/claude-code-tips/actions/workflows/official-watcher.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/official-watcher.yml)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.77-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)

i've run 4,000+ claude code sessions. this is everything i learned — packaged as a plugin, a reference library, and notes on what actually works.

the plugin mines my sessions. the hooks guard my code. the docs stay current automatically. **this repo maintains itself using the patterns it teaches.**

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

## get started

```bash
claude plugin add anipotts/claude-code-tips
```

this installs **mine** — a plugin that mines every claude code session into a local sqlite database. costs, search, error memory, pattern detection. data stays local at `~/.claude/mine.db`.

```
/mine                          → today's sessions, weekly cost, top tools
/mine how much have i spent    → cost breakdown by project, model, time period
/mine search "websocket"       → full-text search across all conversations
/mine what's my cache hit rate → cache efficiency analysis
/mine hotspots                 → most-edited files across sessions
/mine mistakes                 → error patterns claude keeps repeating
```

**[full mine docs →](./plugins/mine/README.md)** · **[5-minute setup →](./SETUP.md)**

---

## what's in here

### hooks — copy one, wire it up, done

**safety**

| hook | event | what it does |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | blocks squash merges |

**observability**

| hook | event | what it does |
|---|---|---|
| [panopticon](./hooks/panopticon.sh) | PostToolUse | logs every tool call to sqlite |
| [knowledge-builder](./hooks/knowledge-builder/) | PostToolUse | builds a codebase knowledge graph |
| [replay-capture](./hooks/replay-capture.sh) | PostToolUse | captures file changes for VHS replays |

**preservation**

| hook | event | what it does |
|---|---|---|
| [context-save](./hooks/context-save.sh) | PreCompact | saves context before compression |
| [notify](./hooks/notify.sh) | Notification | routes to macOS, Slack, Pushover, ntfy |

**hygiene**

| hook | event | what it does |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | reminds you to commit after N edits |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | auto-fixes markdown lint on save |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | warns about gone tracking branches |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | auto-updates tested-with stamps |

### agents — autonomous subagents for longer tasks

| agent | model | what it does |
|---|---|---|
| [explorer](./.claude/agents/explorer.md) | sonnet | parallel worktree exploration — try risky changes safely |
| [guardian](./.claude/agents/guardian.md) | haiku | daemon that watches your project and proposes fixes |
| [analyst](./.claude/agents/analyst.md) | sonnet | free-form SQL investigator against mine.db |
| [code-sweeper](./.claude/agents/code-sweeper.md) | haiku | finds dead code, unused imports, stale TODOs |
| [test-writer](./.claude/agents/test-writer.md) | sonnet | generates edge case tests you missed |
| [pr-narrator](./.claude/agents/pr-narrator.md) | sonnet | writes PR descriptions from your diff |
| [changelog-writer](./.claude/agents/changelog-writer.md) | sonnet | generates changelogs from merged PRs |
| [link-checker](./.claude/agents/link-checker.md) | haiku | validates internal doc links before commit |
| [dep-checker](./.claude/agents/dep-checker.md) | haiku | outdated deps and security advisories |
| [vibe-check](./.claude/agents/vibe-check.md) | haiku | quick, opinionated architecture review |

### commands — slash commands, auto-discovered

| command | what it does |
|---|---|
| `/mine` | query usage data — costs, sessions, search, tools |
| `/improve` | analyze sessions + git history, propose CLAUDE.md updates |
| `/ship` | stage, commit, push, open PR in one shot |
| `/sweep` | find and clean dead code, unused imports |
| `/quicktest` | find and run tests for current file |
| `/deps` | dependency updates and security audit |
| `/stats` | project health dashboard |
| `/replay` | generate VHS tape replay of session changes |

---

## docs

organized by what you need:

| | what | who it's for |
|---|---|---|
| **concepts** | [subagent patterns](./docs/concepts/subagent-patterns.md), [automation](./docs/concepts/automation.md), [cost optimization](./docs/concepts/cost-optimization.md) | anyone using agentic coding tools |
| **claude code** | [guide](./docs/claude-code/guide.md), [hooks](./docs/claude-code/hooks-reference.md), [plugins](./docs/claude-code/plugin-creation.md), [MCP](./docs/claude-code/mcp-servers.md), [CLI](./docs/claude-code/cli-tools.md), [agents](./docs/claude-code/agent-teams.md) | claude code users |
| **comparisons** | [pricing](./docs/comparisons/pricing.md), [cursor](./docs/comparisons/cursor.md), [codex](./docs/comparisons/codex.md), [gemini](./docs/comparisons/gemini.md) | choosing a tool |
| **tips** | [why hooks matter](./docs/tips/why-hooks-matter.md), [my stack](./docs/tips/my-automation-stack.md), [mistakes i made](./docs/tips/mistakes-i-made.md), [cost reality](./docs/tips/cost-reality.md) | my personal takes |
| **notes** | [community](./docs/notes/community.md), [changelog](./docs/notes/changelog.md) | staying current |

concepts/ is tool-agnostic — applies to cursor, codex, gemini, whatever you use. tips/ is me.

---

## examples

reference implementations to study and adapt:

- [CLAUDE.md templates](./examples/claude-md/) — starter configs for TypeScript, Python, Rust, Next.js
- [handoff plugin](./examples/plugins/handoff/) — PreCompact context preservation
- [broadcast plugin](./examples/plugins/broadcast/) — async notifications on git events

---

## how this repo works

this repo is its own best example. [see what's running →](./docs/claude-code/this-repo.md)

- **8 CI/CD pipelines** — official upstream watcher, competitive intelligence, community digest, docs audit, freshness checks, stale cleanup, dependabot auto-merge, release automation
- **11 hooks** — safety, observability, preservation, hygiene
- **10 agents** — exploration, analysis, code quality, documentation
- **0 manual maintenance** — everything that doesn't require taste is automated

---

## contributing

PRs welcome. see [CONTRIBUTING.md](./CONTRIBUTING.md).

## license

MIT

---

<sub>built by [anipotts](https://anipotts.com) from 4,000+ claude code sessions · [setup guide →](./SETUP.md)</sub>
