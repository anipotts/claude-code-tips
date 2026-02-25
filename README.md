# claude-code-tips

plugins, hooks, agents, and a comprehensive guide for claude code. tested across 4,000+ sessions.

by [ani potts](https://github.com/anipotts)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine.py --stats dashboard showing sessions, tokens, costs, and projects" />

## plugins

installable via `claude plugin add`:

| plugin | description |
|---|---|
| **[miner](./plugins/miner/)** | mines every session to sqlite with FTS5 search. tracks costs, tokens, cache efficiency. four power features: **echo** (solution recall), **scar** (mistake memory), **gauge** (model advisor), **imprint** (stack recall) |
| [handoff](./plugins/handoff/) | saves context before compression hits — never lose your plan |
| [broadcast](./plugins/broadcast/) | async notifications when claude ships something |

```bash
claude plugin add anipotts/miner
```

<img src="./gifs/query-cost.gif" width="100%" alt="project_costs VIEW showing spending by project" />

## hooks

standalone scripts. copy to `~/.claude/hooks/` and wire up in settings:

| hook | event | description |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE |
| [context-save](./hooks/context-save.sh) | PreCompact | saves context to markdown before compression |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | logs every tool action to sqlite |
| [knowledge-builder](./hooks/knowledge-builder/) | PostToolUse | builds a codebase knowledge graph as claude explores |
| [notify](./hooks/notify.sh) | Notification | routes to macOS, Slack, Pushover, ntfy |

```bash
cp hooks/safety-guard.sh ~/.claude/hooks/
```

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard hook blocking a force push" />

## skills & commands

drop into `.claude/skills/` or `.claude/commands/`:

| name | description |
|---|---|
| [/sift](./skills/sift.md) | search and analyze session history — costs, tools, patterns, FTS5 search |
| [/ledger](./commands/ledger.md) | quick usage dashboard — tokens, costs, tools, projects |
| [/improve](./skills/improve.md) | CLAUDE.md self-improvement from git history |
| [/ship](./skills/ship.md) | stage, commit, push, open a PR |
| [/sweep](./skills/sweep.md) | find and clean dead code |
| [/quicktest](./skills/quicktest.md) | run tests for what you're working on |
| [/stats](./commands/stats.md) | project health — LOC, git activity, test coverage |
| [/deps](./commands/deps.md) | dependency updates and security audit |

<img src="./gifs/sift-search.gif" width="100%" alt="FTS5 full-text search across all sessions" />

## agents

drop into `.claude/agents/`:

| agent | description |
|---|---|
| [analyst](./agents/analyst.md) | deep session analysis — free-form SQL against miner.db |
| [explorer](./agents/explorer.md) | parallel worktree exploration |
| [guardian](./agents/guardian.md) | persistent daemon / file watcher |
| [code-sweeper](./agents/code-sweeper.md) | dead code, unused imports, stale TODOs |
| [pr-narrator](./agents/pr-narrator.md) | writes PR descriptions from your diff |
| [dep-checker](./agents/dep-checker.md) | outdated deps, security advisories |
| [test-writer](./agents/test-writer.md) | edge case tests the original dev missed |
| [vibe-check](./agents/vibe-check.md) | quick architecture review |

## the guide

[docs/guide.md](./docs/guide.md) — a three-tier progressive guide to claude code:

- **beginner** — install, CLAUDE.md, permissions, settings
- **intermediate** — extensibility stack, hooks, plugins, subagents, MCP
- **advanced** — miner, headless CLI tools, self-improvement loops, daemons, github actions

## docs

- [hooks guide](./docs/hooks-guide.md) — every hook event, tested examples, advanced patterns
- [plugin creation](./docs/plugin-creation.md) — plugin.json spec, full walkthrough, marketplace publishing
- [subagent patterns](./docs/subagent-patterns.md) — parallel research, scout pattern, worktree isolation
- [mcp servers](./docs/mcp-servers.md) — playwright, context7, building your own
- [cli tools](./docs/cli-tools.md) — headless `claude -p` as a shell function factory
- [automation](./docs/automation.md) — daemons, cron, file watchers, guardian agent

## license

MIT
