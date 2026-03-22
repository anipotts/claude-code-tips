# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.77-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

practical patterns for agentic coding -- hooks, agents, automation. built from 4,000+ claude code sessions, applicable to any AI coding tool.

**this repo maintains itself using the patterns it teaches.** 12 CI workflows, 11 hooks, 10 agents, 9 commands -- all running on this repo. [see how &rarr;](./docs/claude-code/this-repo.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## install the plugin

```bash
claude plugin add anipotts/claude-code-tips
```

you get **mine** -- session mining to sqlite. costs, search, error memory, pattern detection. all data stays local at `~/.claude/mine.db`.

```
/mine                     today's sessions, cost, top tools
/mine search "websocket"  full-text search across all conversations
/mine mistakes            error patterns claude keeps repeating
/mine hotspots            most-edited files across sessions
/mine loops               repeated patterns across sessions
```

start with `mine` + the `safety-guard` hook. add more as you go. **[mine docs &rarr;](./plugins/mine/README.md)**

---

## hooks

copy one, wire it up, done. each hook is a standalone bash script. [hooks reference &rarr;](./docs/claude-code/hooks-reference.md)

| hook | event | what it does |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE, curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | blocks squash merges |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | logs every tool call to sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | saves context before compression |
| [notify](./hooks/notify.sh) | Notification | routes to macOS, Slack, ntfy |
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | reminds you to commit after N edits |
| [replay-capture](./hooks/replay-capture.sh) | PostToolUse | captures file changes for VHS replays |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | auto-updates "tested with" stamps |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | warns about gone tracking branches |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | auto-fixes markdown lint on save |
| [knowledge-builder](./hooks/knowledge-builder/) | PostToolUse | builds a codebase knowledge graph |

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## agents

drop these in `.claude/agents/` and invoke with `/agent <name>`.

| agent | what it does |
|---|---|
| [explorer](./.claude/agents/explorer.md) | parallel worktree exploration -- try risky changes safely |
| [analyst](./.claude/agents/analyst.md) | free-form SQL against mine.db |
| [test-writer](./.claude/agents/test-writer.md) | generates edge case tests you missed |
| [guardian](./.claude/agents/guardian.md) | watches your project, proposes fixes |
| [code-sweeper](./.claude/agents/code-sweeper.md) | finds dead code, unused imports |
| [pr-narrator](./.claude/agents/pr-narrator.md) | writes PR descriptions from your diff |
| [vibe-check](./.claude/agents/vibe-check.md) | quick architecture review |
| [changelog-writer](./.claude/agents/changelog-writer.md) | generates changelogs from merged PRs |
| [link-checker](./.claude/agents/link-checker.md) | validates all internal links before committing |
| [dep-checker](./.claude/agents/dep-checker.md) | scans deps for outdated, vulnerable, conflicting |

## commands

| command | what it does |
|---|---|
| `/mine` | usage data -- costs, sessions, search |
| `/ship` | stage, commit, push, open PR |
| `/sweep` | clean dead code, unused imports |
| `/quicktest` | find and run tests for current file |
| `/deps` | dependency updates and security audit |
| `/improve` | propose CLAUDE.md updates from git history |
| `/stats` | project health dashboard |
| `/replay` | generate a VHS tape replay of session changes |
| `/mine:help` | what /mine can do |

---

## docs

| | what | who it's for |
|---|---|---|
| **concepts** | [subagent patterns](./docs/concepts/subagent-patterns.md), [automation](./docs/concepts/automation.md), [cost optimization](./docs/concepts/cost-optimization.md) | anyone using agentic coding tools |
| **claude code** | [guide](./docs/claude-code/guide.md), [hooks](./docs/claude-code/hooks-reference.md), [plugins](./docs/claude-code/plugin-creation.md), [MCP](./docs/claude-code/mcp-servers.md), [CLI](./docs/claude-code/cli-tools.md), [agent teams](./docs/claude-code/agent-teams.md), [ecosystem](./docs/claude-code/ecosystem.md) | claude code users |
| **comparisons** | [vs cursor](./docs/comparisons/cursor.md), [vs codex](./docs/comparisons/codex.md), [vs gemini](./docs/comparisons/gemini.md), [vs antigravity](./docs/comparisons/antigravity.md), [pricing](./docs/comparisons/pricing.md) | choosing a tool |
| **tips** | [why hooks matter](./docs/tips/why-hooks-matter.md), [my stack](./docs/tips/my-automation-stack.md), [mistakes i made](./docs/tips/mistakes-i-made.md), [cost reality](./docs/tips/cost-reality.md), [session workflow](./docs/tips/session-workflow.md) | my personal takes |

concepts/ is tool-agnostic. tips/ is me.

---

## examples

- [CLAUDE.md templates](./examples/claude-md/) -- starter configs for TypeScript, Python, Rust, Next.js
- [handoff plugin](./examples/plugins/handoff/) -- PreCompact context preservation
- [broadcast plugin](./examples/plugins/broadcast/) -- async notifications on git events

---

## how this repo works

this repo is its own best example. [what's running &rarr;](./docs/claude-code/this-repo.md)

- **12 CI workflows** -- upstream watcher, competitive intel, community digest, docs audit, freshness, stale cleanup, dependabot, releases, plugin smoke test, PR quality gate, validation, claude responder
- **11 hooks**, **10 agents**, **9 commands** -- all running on this repo
- **0 manual maintenance** -- everything that doesn't require taste is automated
- **<$1/month** -- CI uses haiku for the AI-powered workflows

---

MIT &middot; built by [anipotts](https://anipotts.com) from 4,000+ sessions
