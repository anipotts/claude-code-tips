<!-- tested with: claude code v2.1.122 -->

# settings hierarchy

claude code reads settings from three levels. knowing which to use where saves you from "why isn't my hook firing" debugging sessions.

## the three levels

```
~/.claude/settings.json          → global (all projects, your machine)
.claude/settings.json            → project (committed, shared with team)
.claude/settings.local.json      → local (gitignored, just you)
```

they merge in that order. local overrides project overrides global.







**note (v2.1.172+):** settings schema may have changed. run `claude --help` or check `.claude/settings.json` examples in the claude-code-tips repo for current field names and structure.

### migration note: ~/.claude.json → settings.json (v2.1.119+)

starting v2.1.119, display settings moved from `~/.claude.json` to the settings.json scope:

- `autoScrollEnabled`
- `editorMode`
- `showTurnDuration`
- `teammateMode`
- `terminalProgressBarEnabled`

if you have `~/.claude.json`, these settings still work but are deprecated. migrate them to `~/.claude/settings.json` under a new `display` key. the migration is one-time: check your old config, copy relevant keys, delete the deprecated file.







### verify schema against current version (v2.1.197+)

if you're on v2.1.195 or later, check the official claude code docs or run `claude --help settings` to verify the current settings.json schema. structure may have changed since v2.1.122 documentation.

### new in v2.1.195: environment variable controls

v2.1.195 added two new environment variables for runtime control:

- `CLAUDE_CODE_DISABLE_MOUSE_CLICKS` -- disable mouse click handling in terminal UI
- `OTEL_LOG_ASSISTANT_RESPONSES` -- enable OpenTelemetry logging of assistant responses (for observability/debugging)

these apply globally and cannot be overridden per-session. set them in your shell rc file if needed.

### new in v2.1.126: provider-managed auth

if you're using claude code through an embedding host platform (IDE plugin, platform integration), `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST` will be set by the host. when this env var is present, provider/auth settings in `.claude/settings.json` are ignored -- the host manages authentication instead. this prevents config conflicts between user settings and platform-managed auth.

## worktree baseRef setting (v2.1.133+)

by default, new worktrees branch from `origin/<default-branch>` (the fresh remote state). set `worktree.baseRef: "head"` in your settings to branch from local `HEAD` instead, preserving unpushed commits in new worktrees:

```json
{
  "worktree": {
    "baseRef": "head"
  }
}
```

add this to `~/.claude/settings.json`, `.claude/settings.json`, or `.claude/settings.local.json` depending on scope. this setting matters if you have local commits not yet pushed; the default changed in v2.1.133.

## when to use which

| setting | where | why |
|---------|-------|-----|
| safety-guard hook | global | you want this everywhere, always |
| project-specific hooks (test runner, linter) | project | team should share these |
| personal hooks (panopticon, notify) | local | your workflow, not the team's |
| permission overrides | local | never commit permission bypasses |
| API keys in env | local | never commit secrets |



### new in v2.1.121: status line input fields

two new display settings control what appears in the input status line:

- `effort.level` -- shows current effort setting (low/medium/high/xhigh/max)
- `thinking.enabled` -- shows whether extended thinking is active

add to your `~/.claude/settings.json` if you want these fields visible:

```json
{
  "display": {
    "statusLineInputFields": ["effort.level", "thinking.enabled"]
  }
}
```



### new in v2.1.126: notification channel control

add `preferredNotifChannel` to your `~/.claude/settings.json` display settings to control where task-complete and permission notifications appear:

```json
{
  "display": {
    "preferredNotifChannel": "auto"
  }
}
```

valid values: `auto` (desktop in iTerm2/Ghostty/Kitty, fallback to stdout), `desktop`, `stdout`, `none`. default is `auto`, which detects your terminal and uses desktop notifications if available.

## the rule

**hooks that protect → global.** safety-guard, no-squash. these are guardrails you want on every project.

**hooks that build → project.** test runners, linters, CI validators. the team benefits from these.

**hooks that personalize → local.** notifications, logging, personal workflows. nobody else needs your macOS notification hook.

## try it

```bash
# check what's active right now
cat ~/.claude/settings.json | jq '.hooks'
cat .claude/settings.json | jq '.hooks'
cat .claude/settings.local.json | jq '.hooks'
```

if you have hooks in the wrong level, move them. one `mv` command, and your settings are clean.

[full hooks guide &rarr;](../hooks.md)

---

### managed settings and enforcement (v2.1.175+)

when `enforceAvailableModels` is enabled by an admin or platform provider, the `availableModels` allowlist constrains not just model selection but also the Default model. if Default would resolve to a disallowed model, it falls back to the first allowed model instead. additionally, user and project settings can no longer widen a managed allowlist—they can only narrow it further.

this affects: `/model` picker behavior, default model selection, and cross-session model resumption. if you see unexpected model fallback or can't select a previously-available model, check whether `enforceAvailableModels` is active in your global or managed settings.

---

### schema verification (v2.1.172+)

run `claude --help settings` or check the official docs at [code.claude.com/docs](https://code.claude.com/docs/en/overview) to verify current settings schema. field names and structure may have changed since this document was written.
