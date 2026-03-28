<!-- tested with: claude code v2.1.77 -->

# settings hierarchy

claude code reads settings from three levels. knowing which to use where saves you from "why isn't my hook firing" debugging sessions.

## the three levels

```
~/.claude/settings.json          → global (all projects, your machine)
.claude/settings.json            → project (committed, shared with team)
.claude/settings.local.json      → local (gitignored, just you)
```

they merge in that order. local overrides project overrides global.

## when to use which

| setting | where | why |
|---------|-------|-----|
| safety-guard hook | global | you want this everywhere, always |
| project-specific hooks (test runner, linter) | project | team should share these |
| personal hooks (panopticon, notify) | local | your workflow, not the team's |
| permission overrides | local | never commit permission bypasses |
| API keys in env | local | never commit secrets |

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
