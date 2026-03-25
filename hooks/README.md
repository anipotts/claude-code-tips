<!-- tested with: claude code v2.1.77 -->

# hooks

standalone scripts that plug into claude code's hook system. copy one, wire it up, done.

## safety

| hook | event | what it does |
|---|---|---|
| [safety-guard.sh](./safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE, and other dangerous commands |
| [no-squash.sh](./no-squash.sh) | PreToolUse | blocks squash merges — preserves commit history |

## observability

| hook | event | what it does |
|---|---|---|
| [panopticon.sh](./panopticon.sh) | PostToolUse | logs every tool action to a local sqlite audit trail |
| [knowledge-builder/](./knowledge-builder/) | PostToolUse | builds a codebase knowledge graph as claude explores |
| [replay-capture.sh](./replay-capture.sh) | PostToolUse | captures file changes for VHS session replays |

## preservation

| hook | event | what it does |
|---|---|---|
| [context-save.sh](./context-save.sh) | PreCompact | saves session context to markdown before compression |
| [notify.sh](./notify.sh) | Notification | routes to macOS banners, Slack, Pushover, or ntfy |

## hygiene

| hook | event | what it does |
|---|---|---|
| [commit-nudge.sh](./commit-nudge.sh) | PostToolUse | reminds you to commit after N edits without one |
| [md-lint-fix.sh](./md-lint-fix.sh) | PostToolUse | auto-fixes markdown lint when .md files are saved |
| [stale-branch.sh](./stale-branch.sh) | SessionStart | warns about local branches with gone tracking refs |
| [version-stamp.sh](./version-stamp.sh) | SessionEnd | auto-updates "tested with" stamps in modified files |

## installation

copy the hook you want:

```bash
cp hooks/safety-guard.sh ~/.claude/hooks/
```

then add the matching config to your `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/safety-guard.sh" }
        ]
      }
    ]
  }
}
```

## how hooks work

- hooks read JSON from stdin via `jq`
- exit code `0` = allow, exit code `2` = block (PreToolUse only)
- all scripts use `#!/usr/bin/env bash` with `set -euo pipefail`
- see the [hooks guide](../docs/hooks.md) for full reference
