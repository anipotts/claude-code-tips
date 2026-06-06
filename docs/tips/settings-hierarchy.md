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







### fallback model configuration (v2.1.166+)

add a `fallbackModel` array to your settings to specify up to three models to try in order when the primary model is overloaded or unavailable:

```json
{
  "fallbackModel": ["claude-sonnet-4-5", "claude-haiku-4-5"]
}
```

this applies to both interactive sessions (`claude`) and `--fallback-model` flag. auth, rate-limit, request-size, and transport errors surface immediately without fallback.

### worktree configuration (v2.1.133+)

add a `worktree` section to control how new worktrees are created:

```json
{
  "worktree": {
    "baseRef": "fresh"  // or "head" to keep unpushed local commits
  }
}
```

default is `fresh` (branches from `origin/<default>`). set to `head` if you want new worktrees to include unpushed local commits.

### migration note: ~/.claude.json → settings.json (v2.1.119+)

starting v2.1.119, display settings moved from `~/.claude.json` to the settings.json scope:

- `autoScrollEnabled`
- `editorMode`
- `showTurnDuration`
- `teammateMode`
- `terminalProgressBarEnabled`

if you have `~/.claude.json`, these settings still work but are deprecated. migrate them to `~/.claude/settings.json` under a new `display` key. the migration is one-time: check your old config, copy relevant keys, delete the deprecated file.



### new in v2.1.126: provider-managed auth

if you're using claude code through an embedding host platform (IDE plugin, platform integration), `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST` will be set by the host. when this env var is present, provider/auth settings in `.claude/settings.json` are ignored -- the host manages authentication instead. this prevents config conflicts between user settings and platform-managed auth.



### new in v2.1.133: worktree baseRef setting

by default, new worktrees branch from `origin/<default-branch>` (fresh remote state). set `worktree.baseRef: "head"` to branch from local `HEAD` instead, preserving unpushed commits in new worktrees.

```json
{
  "worktree": {
    "baseRef": "head"
  }
}
```

this setting changed default behavior in v2.1.133. if you relied on old behavior (local HEAD), set it explicitly.

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
