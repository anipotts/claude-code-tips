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
**Trigger:** PreCompact

## Current Plan
- Refactoring the auth module to use JWT
- Migrating tests from Jest to Vitest

## Progress
- [x] Extracted token validation into lib/auth/validate.ts
- [x] Updated 12 of 18 test files
- [ ] Remaining: 6 test files + integration tests

## Blockers
- CI pipeline expects Jest config -- need to update .github/workflows

## Next Steps
1. Finish test migration
2. Update CI config
3. Run full suite locally before pushing
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
2. `context-save.sh` receives the transcript as JSON on stdin
3. The script extracts the last several assistant messages, identifies plan/progress/blocker patterns
4. Writes structured markdown to `.claude/handoff.md`
5. On `Stop`, `session-state.sh` does a lighter-weight capture of the final session state

The handoff file persists across sessions. Next time you start Claude Code in that project, you (or Claude) can read `.claude/handoff.md` to pick up exactly where you left off.

## Dependencies

- `jq` for JSON parsing
- Standard POSIX shell utilities
