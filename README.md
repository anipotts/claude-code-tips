# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.77-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)

a toolkit for claude code power users. one installable plugin, a library of hooks/agents/commands you can copy, and docs that go deeper than the official ones.

built from 500+ real sessions. everything is tested and opinionated.

---

## mine — the plugin

mines every claude code session into a local sqlite database. costs, search, error memory, pattern detection.

```bash
claude plugin add anipotts/claude-code-tips
```

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

once installed, `/mine` becomes your single entry point:

```
/mine                          → today's sessions, weekly cost, top tools
/mine how much have i spent    → cost breakdown by project, model, time period
/mine search "websocket"       → full-text search across all conversations
/mine what's my cache hit rate → cache efficiency analysis
/mine hotspots                 → most-edited files across sessions
/mine mistakes                 → error patterns claude keeps repeating
```

7 hooks across the full session lifecycle. zero config after install. data stays local at `~/.claude/mine.db`.

**[full mine docs →](./plugins/mine/README.md)**

---

## hooks

standalone scripts. copy one, wire it up, done.

| hook | event | what it does |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE |
| [context-save](./hooks/context-save.sh) | PreCompact | saves context before compression |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | logs every tool call to sqlite |
| [knowledge-builder](./hooks/knowledge-builder/) | PostToolUse | builds a codebase knowledge graph |
| [notify](./hooks/notify.sh) | Notification | routes to macOS, Slack, Pushover, ntfy |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | blocks squash merges |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | auto-updates tested-with stamps |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | auto-fixes markdown lint on save |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | warns about gone tracking branches |
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | reminds you to commit after N edits |
| [replay-capture](./hooks/replay-capture.sh) | PostToolUse | captures file changes for VHS replays |

```bash
cp hooks/safety-guard.sh ~/.claude/hooks/
```

then add to your `~/.claude/settings.json`. see the [hooks guide](./docs/hooks-guide.md) for setup.

---

## agents

autonomous subagents for longer-running tasks. drop into `.claude/agents/` and they're auto-discovered.

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

```
/agent explorer try three approaches to this refactor
```

---

## commands

slash commands auto-discovered from `.claude/commands/`.

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

[docs/guide.md](./docs/guide.md) — three-tier progressive guide from beginner to advanced.

| doc | what it covers |
|---|---|
| [hooks guide](./docs/hooks-guide.md) | every hook event, tested examples, advanced patterns |
| [plugin creation](./docs/plugin-creation.md) | plugin.json spec, full walkthrough, marketplace publishing |
| [subagent patterns](./docs/subagent-patterns.md) | parallel research, scout pattern, worktree isolation |
| [mcp servers](./docs/mcp-servers.md) | playwright, context7, building your own |
| [cli tools](./docs/cli-tools.md) | headless `claude -p` as a shell function factory |
| [automation](./docs/automation.md) | daemons, cron, file watchers, guardian agent |
| [cost analysis](./docs/cost-analysis.md) | token economics, cache mechanics, budget strategies |
| [agent teams](./docs/agent-teams.md) | multi-agent coordination patterns |
| [comparisons](./docs/comparisons/) | vs cursor, codex, gemini — data-driven, no FUD |

---

## examples

reference implementations you can study and adapt:

- [CLAUDE.md templates](./examples/claude-md/) — starter configs for TypeScript, Python, Rust, Next.js
- [handoff plugin](./examples/plugins/handoff/) — PreCompact context preservation
- [broadcast plugin](./examples/plugins/broadcast/) — async notifications on git events

---

## structure

```
plugins/mine/        the mine plugin (installable)
hooks/               standalone hook scripts (copy-paste ready)
.claude/agents/      autonomous subagents
.claude/commands/    slash commands
docs/                guides and reference
examples/            CLAUDE.md templates, demo plugins
scripts/             mine.py parser, schema.sql, dashboard
tests/               125 tests for mine.py
gifs/                demo recordings
```

---

## contributing

PRs welcome. see [CONTRIBUTING.md](./CONTRIBUTING.md).

## license

MIT
