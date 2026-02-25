# claude-code-tips

claude code plugins, hooks, agents, and resources. all tested

by [ani potts](https://github.com/anipotts)

## whats here

### [plugins](./plugins/)

installable claude code plugins:

| plugin | what it does |
|---|---|
| [context-handoff](./plugins/context-handoff/) | saves your context to markdown before claude compresses it|
| [panopticon](./plugins/panopticon/) | logs every single tool action to sqlite. know exactly what claude did |
| [broadcast](./plugins/broadcast/) | async notifications when claude ships something |
| [subagent-orchestrator](./plugins/subagent-orchestrator/) | tracks subagent lifecycle and rebalances work when teammates go idle |
| [session-analytics](./plugins/session-analytics/) | tracks session patterns (duration, frequency, time-of-day, tool usage) |

### [hooks](./hooks/)

ready-to-use hook scripts. copy em in:

- **safety-guard.sh** — blocks force-push to main, `rm -rf /`, DROP TABLE, the stuff that ruins your day
- **panopticon.sh** — logs every tool action to sqlite
- **context-save.sh** — saves context before compression so you never lose your plan
- **rudy-notify.sh** — custom notification routing (macos/slack/twilio template)

### [docs](./docs/)

- [the complete claude code hooks guide](./docs/hooks-guide.md) — every hook event, tested examples, advanced patterns
- [how to create claude code plugins](./docs/plugin-creation.md) — plugin.json spec, full walkthrough, marketplace publishing
- [battle-tested subagent patterns](./docs/subagent-patterns.md) — parallel research, specialist delegation, scout pattern, anti-patterns

### [agents](./agents/)

reusable subagent definitions — drop in `.claude/agents/` and go:

| agent | what it does |
|---|---|
| [code-sweeper](./agents/code-sweeper.md) | finds dead code, unused imports, stale TODOs — returns a cleanup report |
| [pr-narrator](./agents/pr-narrator.md) | reads your diff and writes a PR description that actually sounds like you |
| [dep-checker](./agents/dep-checker.md) | scans deps for outdated versions, security advisories, version conflicts |
| [vibe-check](./agents/vibe-check.md) | quick architecture review — tells you if something smells off |
| [test-writer](./agents/test-writer.md) | generates the edge case tests the original dev probably missed |

### [skills](./skills/)

multi-step workflows, one slash command:

| skill | what it does |
|---|---|
| [/ship](./skills/ship.md) | stage, commit, push, open a PR in one shot |
| [/sweep](./skills/sweep.md) | find and clean up dead code with interactive confirmation |
| [/quicktest](./skills/quicktest.md) | find and run the test file for whatever you're working on |

### [commands](./commands/)

| command | what it does |
|---|---|
| [/deps](./commands/deps.md) | check all deps for updates and security issues |
| [/stats](./commands/stats.md) | project health dashboard — loc, git activity, coverage |

## quick start

copy a hook:

```bash
cp hooks/safety-guard.sh /path/to/your/project/.claude/hooks/
```

add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": ".claude/hooks/safety-guard.sh"}]
      }
    ]
  }
}
```

## install as plugin

```bash
claude plugin add anipotts/claude-code-tips
```

## license

MIT
