# hooks

standalone scripts that plug into claude code's hook system. copy to `~/.claude/hooks/` or reference from your project, then wire up in settings.

## available hooks

| hook | event | description |
|---|---|---|
| [safety-guard.sh](./safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE, and other dangerous commands |
| [context-save.sh](./context-save.sh) | PreCompact | saves session context to markdown before compression — never lose your plan |
| [panopticon.sh](./panopticon.sh) | PostToolUse | logs every tool action to a local SQLite audit trail |
| [knowledge-builder/](./knowledge-builder/) | PostToolUse | builds a codebase knowledge graph as claude explores your project |
| [notify.sh](./notify.sh) | Notification | routes notifications to macOS banners, Slack, Pushover, or ntfy |

## installation

copy the hook you want:

```bash
cp hooks/safety-guard.sh ~/.claude/hooks/
```

then add the matching config to your `.claude/settings.json` or `~/.claude/settings.json`.

## individual hook configs

### safety-guard (PreToolUse)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/safety-guard.sh"
          }
        ]
      }
    ]
  }
}
```

### context-save (PreCompact)

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/context-save.sh"
          }
        ]
      }
    ]
  }
}
```

### panopticon (PostToolUse)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/panopticon.sh"
          }
        ]
      }
    ]
  }
}
```

### knowledge-builder (PostToolUse)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/knowledge-builder/knowledge-builder.sh"
          }
        ]
      }
    ]
  }
}
```

### notify (Notification)

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/notify.sh"
          }
        ]
      }
    ]
  }
}
```

## install all

combined snippet — add the `hooks` object to your settings file:

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
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/panopticon.sh" },
          { "type": "command", "command": "~/.claude/hooks/knowledge-builder/knowledge-builder.sh" }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/context-save.sh" }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/notify.sh" }
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
- see the [hooks guide](../docs/hooks-guide.md) for full reference
