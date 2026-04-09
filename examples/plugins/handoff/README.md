<!-- tested with: claude code v2.1.77 -->

# context-handoff

Session preservation via PreCompact and Stop hooks. Automatically captures your plan, progress, and context before it gets lost.

## Why this matters

`PreCompact` is the most important hook event in Claude Code. When the context window fills up, Claude compresses the conversation to make room. That compression **destroys information** -- your current plan, what you've tried, what failed, what's next. This plugin intercepts that moment and writes a structured handoff file before anything is lost.

The `Stop` hook provides a second safety net, capturing session state when Claude finishes responding.

## What it creates

The plugin writes to `.claude/handoff.md` in your project root:

```markdown
# Session Handoff
**Saved:** 2026-02-25T14:32:01Z
**Trigger:** PreCompact (context window about to be compressed)
**Session:** abc123

## What to do with this file

This was auto-generated when the context window filled up. Read it at the
start of your next session to pick up where you left off. Add your own notes
below before starting a new session.

## Recent Context

(recent transcript lines extracted from the session file)

## Your Notes

<!-- Add your plan, progress, and blockers here before starting a new session -->
```

## Install

Copy the plugin directory into your project's `.claude/plugins/` or reference it from your hooks config:

```json
{
  "hooks": {
    "PreCompact": [{ "type": "command", "command": ".claude/plugins/context-handoff/hooks/context-save.sh" }],
    "Stop": [{ "type": "command", "command": ".claude/plugins/context-handoff/hooks/session-state.sh" }]
  }
}
```

Make the hook scripts executable:

```bash
chmod +x .claude/plugins/context-handoff/hooks/*.sh
```

## How it works

1. Claude Code fires `PreCompact` when the context window is about to be compressed
2. `context-save.sh` receives a JSON payload with `session_id` and `transcript_path`
3. The script reads recent context from the transcript file at that path
4. Writes a handoff template to `.claude/handoff.md` with the extracted context
5. On `Stop`, `session-state.sh` appends the stop reason and timestamp

The handoff file persists across sessions. Next time you start Claude Code in that project, you (or Claude) can read `.claude/handoff.md` to pick up exactly where you left off.

## Dependencies

- `jq` for JSON parsing
- Standard POSIX shell utilities
