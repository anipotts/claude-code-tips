# claude-code-tips

[![stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v1.0.34-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![auto-updated](https://img.shields.io/badge/auto--updated-2x%20daily-000?style=flat-square&labelColor=22c55e)](https://github.com/anipotts/claude-code-tips/actions)
[![sessions tested](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fanipotts%2F09d9588bef3bba1aa6831df12e7629e7%2Fraw%2Fsessions.json&style=flat-square&labelColor=D4A574&color=000&logo=anthropic&logoColor=white)](https://github.com/anipotts/claude-code-tips)
[![max plan spend](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fanipotts%2F09d9588bef3bba1aa6831df12e7629e7%2Fraw%2Fplan_spend.json&style=flat-square&labelColor=6b7280&color=000)](https://github.com/anipotts/claude-code-tips)
[![API inference received](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fanipotts%2F09d9588bef3bba1aa6831df12e7629e7%2Fraw%2Fapi_value.json&style=flat-square&labelColor=22c55e&color=000)](https://github.com/anipotts/claude-code-tips)

**ships working code. updates itself.**

<img src="./gifs/mine-stats.gif" width="100%" alt="mine.py --stats dashboard showing sessions, tokens, costs, and projects" />
<!-- TODO: replace with real terminal demo (hero.tape) -->

## why this repo

- **tested across 4,012 sessions ($9K+ in API inference)** -- not tutorial code, production patterns extracted from real daily usage
- **ships working code** -- every hook, plugin, agent, and skill is copy-paste ready
- **updates itself** -- upstream watcher monitors official releases, competitor changes, and community trends, then merges autonomously when CI passes

## quick start

```bash
claude plugin add anipotts/miner
```

miner is the flagship plugin. it mines every claude code session to sqlite -- tracks costs, tokens, cache efficiency, and gives you four power features: **echo** (solution recall), **scar** (mistake memory), **gauge** (model advisor), and **imprint** (stack recall). one command, immediate value.

## what's inside

### plugins

installable via `claude plugin add`:

| plugin | description |
|---|---|
| **[miner](./plugins/miner/)** | mines every session to sqlite with FTS5 search. tracks costs, tokens, cache efficiency. four power features: **echo** (solution recall), **scar** (mistake memory), **gauge** (model advisor), **imprint** (stack recall) |
| [handoff](./plugins/handoff/) | saves context before compression hits -- never lose your plan |
| [broadcast](./plugins/broadcast/) | async notifications when claude ships something |

### hooks

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

### skills & commands

drop into `.claude/skills/` or `.claude/commands/`:

| name | description |
|---|---|
| **[/miner](./skills/miner.md)** | **ask anything about your usage -- costs, value, search, tools, projects. one command, plain language** |
| [/sift](./skills/sift.md) | explicit subcommands for session history (search, cache, workflows, wasted) |
| [/ledger](./commands/ledger.md) | quick usage dashboard -- tokens, costs, tools, projects |
| [/value](./commands/value.md) | per-model API inference value, cost breakdown, ROI |
| [/improve](./skills/improve.md) | CLAUDE.md self-improvement from git history |
| [/ship](./skills/ship.md) | stage, commit, push, open a PR |
| [/sweep](./skills/sweep.md) | find and clean dead code |
| [/quicktest](./skills/quicktest.md) | run tests for what you're working on |
| [/stats](./commands/stats.md) | project health -- LOC, git activity, test coverage |
| [/deps](./commands/deps.md) | dependency updates and security audit |

### agents

drop into `.claude/agents/`:

| agent | description |
|---|---|
| [analyst](./agents/analyst.md) | deep session analysis -- free-form SQL against miner.db |
| [explorer](./agents/explorer.md) | parallel worktree exploration |
| [guardian](./agents/guardian.md) | persistent daemon / file watcher |
| [code-sweeper](./agents/code-sweeper.md) | dead code, unused imports, stale TODOs |
| [pr-narrator](./agents/pr-narrator.md) | writes PR descriptions from your diff |
| [dep-checker](./agents/dep-checker.md) | outdated deps, security advisories |
| [test-writer](./agents/test-writer.md) | edge case tests the original dev missed |
| [vibe-check](./agents/vibe-check.md) | quick architecture review |

### docs

[docs/guide.md](./docs/guide.md) -- a three-tier progressive guide to claude code:

- **beginner** -- install, CLAUDE.md, permissions, settings
- **intermediate** -- extensibility stack, hooks, plugins, subagents, MCP
- **advanced** -- miner, headless CLI tools, self-improvement loops, daemons, github actions

reference docs:

- [hooks guide](./docs/hooks-guide.md) -- every hook event, tested examples, advanced patterns
- [plugin creation](./docs/plugin-creation.md) -- plugin.json spec, full walkthrough, marketplace publishing
- [subagent patterns](./docs/subagent-patterns.md) -- parallel research, scout pattern, worktree isolation
- [mcp servers](./docs/mcp-servers.md) -- playwright, context7, building your own
- [cli tools](./docs/cli-tools.md) -- headless `claude -p` as a shell function factory
- [automation](./docs/automation.md) -- daemons, cron, file watchers, guardian agent

## comparisons

diplomatic, data-driven comparison docs for codex, cursor, gemini, and antigravity. every claim cites a pricing page, changelog, or official doc -- no FUD. see [docs/comparisons/](./docs/comparisons/).

## how it stays fresh

the upstream watcher polls official claude code releases, competitor changelogs, and community repos 2x daily via github actions. when it detects changes, it processes them through the claude API (haiku) and opens a draft PR with proposed doc updates. if CI passes and the diff is clean, it merges autonomously. the whole pipeline costs pennies -- github actions is free for public repos, and each haiku call runs ~$0.01-0.05.

## contributing

tips, fixes, and new content welcome -- see [CONTRIBUTING.md](./CONTRIBUTING.md).

## license

MIT
