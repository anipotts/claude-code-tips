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



### migration note: ~/.claude.json → settings.json (v2.1.119+)

starting v2.1.119, display settings moved from `~/.claude.json` to the settings.json scope:

- `autoScrollEnabled`
- `editorMode`
- `showTurnDuration`
- `teammateMode`
- `terminalProgressBarEnabled`

if you have `~/.claude.json`, these settings still work but are deprecated. migrate them to `~/.claude/settings.json` under a new `display` key. the migration is one-time: check your old config, copy relevant keys, delete the deprecated file.



### new in v2.1.126: claude project purge

clean up all claude code state for a project with one command:

```bash
claude project purge /path/to/project
```

flags:
- `--dry-run` -- show what would be deleted
- `-y/--yes` -- skip confirmation
- `-i/--interactive` -- pick what to delete
- `--all` -- purge from all projects

purges transcripts, tasks, file history, and config entries. useful for resetting a project or cleaning up stale state without touching your source code.

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
