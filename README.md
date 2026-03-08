# claude-code-tips

[![stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v1.0.34-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)

plugins, hooks, slash commands, agents, and docs for claude code. everything is copy-paste ready.

<img src="./gifs/mine-stats.gif" width="100%" alt="mine.py --stats dashboard showing sessions, tokens, costs, and projects" />

## miner plugin

the flagship. mines every claude code session to sqlite -- tracks costs, tokens, cache efficiency, and gives you four power features: **echo** (solution recall), **scar** (mistake memory), **gauge** (model advisor), and **imprint** (stack recall).

```bash
claude plugin add anipotts/miner
```

once installed, use `/miner` in any session to query your usage in plain language:

```
/miner                          → dashboard: today's sessions, weekly cost, top tools
/miner how much have i spent    → cost breakdown by project, model, time period
/miner value                    → API inference value at published rates
/miner search "websocket"       → full-text search across all conversations
/miner what's my cache hit rate → cache efficiency analysis
```

## plugins

installable via `claude plugin add`:

| plugin | description |
|---|---|
| **[miner](./plugins/miner/)** | mines sessions to sqlite with FTS5 search, cost tracking, and four power features |
| [handoff](./plugins/handoff/) | saves context before compression -- never lose your plan |
| [broadcast](./plugins/broadcast/) | async notifications when claude ships something |

## slash commands

these live in `.claude/commands/` and are auto-discovered by claude code. clone this repo and they're available in any session started from within it.

| command | description |
|---|---|
| `/miner` | query your usage data in plain language -- costs, sessions, search, tools, projects |
| `/improve` | analyze recent sessions and git history to propose CLAUDE.md improvements |
| `/ship` | stage, commit, push, and open a PR in one shot |
| `/sweep` | find and clean dead code, unused imports, stale TODOs |
| `/quicktest` | find and run the test file for whatever you're working on |
| `/stats` | project health -- LOC, git activity, test coverage |
| `/deps` | dependency updates and security audit (node, python, rust, go) |

deprecated commands (`/sift`, `/ledger`, `/value`) still work but route through `/miner` now.

## agents

these live in `.claude/agents/` and are auto-discovered. use them for longer-running, autonomous tasks.

| agent | description |
|---|---|
| [analyst](./.claude/agents/analyst.md) | free-form SQL investigator against your miner.db |
| [explorer](./.claude/agents/explorer.md) | parallel worktree exploration -- try risky changes safely |
| [guardian](./.claude/agents/guardian.md) | daemon that watches your project and proposes fixes |
| [code-sweeper](./.claude/agents/code-sweeper.md) | finds dead code, unused imports, stale TODOs |
| [pr-narrator](./.claude/agents/pr-narrator.md) | writes PR descriptions from your diff |
| [dep-checker](./.claude/agents/dep-checker.md) | outdated deps, security advisories, priority-sorted |
| [test-writer](./.claude/agents/test-writer.md) | generates edge case tests you probably missed |
| [vibe-check](./.claude/agents/vibe-check.md) | quick, opinionated architecture review |

## hooks

standalone scripts you can copy into your own setup. each one is a single file:

| hook | event | description |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE |
| [context-save](./hooks/context-save.sh) | PreCompact | saves context to markdown before compression |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | logs every tool action to sqlite |
| [knowledge-builder](./hooks/knowledge-builder/) | PostToolUse | builds a codebase knowledge graph as claude explores |
| [notify](./hooks/notify.sh) | Notification | routes to macOS, Slack, Pushover, ntfy |

to use a hook, copy it and wire it up in your claude code settings:

```bash
cp hooks/safety-guard.sh ~/.claude/hooks/
```

then add it to `~/.claude/settings.json` under the appropriate hook event. see [hooks guide](./docs/hooks-guide.md) for the full setup.

## docs

[docs/guide.md](./docs/guide.md) is a three-tier progressive guide:

- **beginner** -- install, CLAUDE.md, permissions, settings
- **intermediate** -- hooks, plugins, subagents, MCP
- **advanced** -- miner, headless CLI tools, self-improvement loops, daemons, github actions

reference docs:

- [hooks guide](./docs/hooks-guide.md) -- every hook event, tested examples, advanced patterns
- [plugin creation](./docs/plugin-creation.md) -- plugin.json spec, full walkthrough, marketplace publishing
- [subagent patterns](./docs/subagent-patterns.md) -- parallel research, scout pattern, worktree isolation
- [mcp servers](./docs/mcp-servers.md) -- playwright, context7, building your own
- [cli tools](./docs/cli-tools.md) -- headless `claude -p` as a shell function factory
- [automation](./docs/automation.md) -- daemons, cron, file watchers, guardian agent

## repo structure

```
plugins/miner/       miner plugin (installable via marketplace)
plugins/handoff/     handoff plugin
plugins/broadcast/   broadcast plugin
.claude/commands/    slash commands (auto-discovered)
.claude/agents/      agents (auto-discovered)
hooks/               standalone hook scripts
docs/                guides and reference
scripts/             mine.py bulk parser, schema.sql
gifs/                VHS tape files and demo recordings
```

## contributing

tips, fixes, and new content welcome -- see [CONTRIBUTING.md](./CONTRIBUTING.md).

## license

MIT
