# claude-code-tips

plugins, hooks, agents, skills, and a comprehensive guide for claude code. all tested.

by [ani potts](https://github.com/anipotts)

## whats here

| thing | what it does |
|---|---|
| [miner](./plugins/miner/) | flagship plugin. mines every session to sqlite -- echo, scar, gauge, imprint |
| [handoff](./plugins/handoff/) | saves your context before compression hits |
| [broadcast](./plugins/broadcast/) | async notifications when claude ships something |
| [/sift](./skills/sift.md) | search and analyze your session history via miner.db |
| [/ledger](./commands/ledger.md) | quick session dashboard -- tokens, costs, tools, projects |
| [/improve](./skills/improve.md) | CLAUDE.md self-improvement from git history |
| [/ship](./skills/ship.md), [/sweep](./skills/sweep.md), [/quicktest](./skills/quicktest.md) | workflow skills -- commit+PR, dead code cleanup, run relevant tests |
| [analyst](./agents/analyst.md), [explorer](./agents/explorer.md), [guardian](./agents/guardian.md) + [5 more](./agents/) | reusable subagent definitions |
| [hooks](./hooks/) | safety-guard, context-save, knowledge-builder, panopticon |
| [the guide](./docs/guide.md) | comprehensive claude code guide (beginner to crazy) |

## quick start

install the miner plugin:

```bash
claude plugin add anipotts/miner
```

or copy a hook:

```bash
cp hooks/safety-guard.sh ~/.claude/hooks/
```

add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "~/.claude/hooks/safety-guard.sh"}]
      }
    ]
  }
}
```

## the guide

[docs/guide.md](./docs/guide.md) -- a three-tier progressive guide to claude code:

- **beginner** -- install, CLAUDE.md, permissions, settings
- **intermediate** -- extensibility stack, hooks, plugins, subagents, MCP
- **claude code crazy** -- miner, headless CLI tools, self-improvement loops, daemons, github actions

## docs

- [hooks guide](./docs/hooks-guide.md) -- every hook event, tested examples, advanced patterns
- [plugin creation](./docs/plugin-creation.md) -- plugin.json spec, full walkthrough, marketplace publishing
- [subagent patterns](./docs/subagent-patterns.md) -- parallel research, scout pattern, worktree isolation, anti-patterns
- [mcp servers](./docs/mcp-servers.md) -- playwright, context7, building your own
- [cli tools](./docs/cli-tools.md) -- headless claude as a shell function factory
- [automation](./docs/automation.md) -- daemons, cron, file watchers, guardian agent

## license

MIT
