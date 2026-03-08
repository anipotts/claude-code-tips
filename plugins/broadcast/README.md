<!-- tested with: claude code v1.0.34 -->

# broadcast

async notifications when claude ships something

fires on `git commit` and `git push` — sends to slack, discord, or any webhook. completely non-blocking, all requests are backgrounded so claude never waits

## why

bc you shouldn't have to watch claude work. set it up once and get pinged when something ships. fire and forget

## setup

set your webhook endpoint:

```bash
export BROADCAST_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export BROADCAST_CHANNEL="#shipped"  # optional
```

supports:
- **slack** — detects `hooks.slack.com` urls automatically
- **discord** — detects `discord.com` webhook urls
- **generic** — any url gets a POST with `{message, project, branch}`
- **macos** — always fires a native notification banner if you're on mac

## install

copy the hook or install the plugin:

```bash
claude plugin add anipotts/claude-code-tips --plugin broadcast
```

or manually add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "path/to/broadcast.sh"}]
      }
    ]
  }
}
```

## what it sends

- on commit: `"committed in rudy: fix streaming draft reconnection"`
- on push: `"pushed to main in rudy"`

thats it. no noise, just signal
