# mistakes i made

450+ sessions. here are the mistakes i keep making -- and the fixes.

some of these are my mistakes. some are patterns where claude code reliably does the wrong thing unless you set up guardrails. the distinction matters less than the fix.

## the expensive mistakes

<!-- [FILL: pull real patterns from `/mine mistakes`. format like this: -->

<!-- | mistake | frequency | cost | -->
<!-- |---------|-----------|------| -->
<!-- | forgot to commit before /compact, lost 20 min of work | 12 times | ~4 hours total | -->
<!-- | let claude refactor a file it didn't fully understand | 8 times | ~3 hours fixing | -->
<!-- | ran a session without CLAUDE.md, got wildly off-convention | 5 times | ~2 hours cleanup | -->
<!-- | squash-merged a PR and lost granular history | 3 times | permanent | -->

<!-- be honest. include the ones that hurt. ] -->

## the CLAUDE.md rules that fixed them

each mistake above earned a rule. here's the mapping:

<!-- [FILL: match each mistake to the rule that prevents it. format: -->

<!-- **lost work on /compact** -->
<!-- fix: context-save.sh hook (PreCompact) writes handoff.md automatically. -->
<!-- now every compact preserves the plan. zero lost sessions since adding it. -->

<!-- **squash merges** -->
<!-- fix: no-squash.sh hook (PreToolUse) blocks `--squash` flag. -->
<!-- also: CLAUDE.md rule "NEVER squash merge" as backup guidance. -->

<!-- **off-convention code** -->
<!-- fix: CLAUDE.md conventions section with explicit style rules. -->
<!-- also: pr-quality-gate workflow catches missing stamps on PR. -->

<!-- add 3-5 real mistake->fix pairs ] -->

## error patterns claude repeats

<!-- [FILL: things claude code does wrong repeatedly across sessions. examples: -->
<!-- - uses `git add .` instead of specific files (caught by CLAUDE.md rule) -->
<!-- - forgets to run tests after refactoring -->
<!-- - overwrites files without reading them first -->
<!-- - creates README.md files nobody asked for -->
<!-- - uses emojis in commit messages -->
<!-- - adds relative imports that break from different working dirs -->
<!-- pull these from real session data -- /mine mistakes or panopticon queries ] -->

## what /mine mistakes actually shows

the `mistakes` feature in the mine plugin tracks error patterns across sessions. it watches for tool calls that fail, commands that get blocked by hooks, and patterns that repeat.

```
/mine mistakes

# example output format:
┌──────────────────────────┬───────┬────────────┐
│ pattern                  │ count │ last seen  │
├──────────────────────────┼───────┼────────────┤
│ Write without Read first │    14 │ 2026-03-19 │
│ blocked: force push main │     3 │ 2026-03-15 │
│ blocked: squash merge    │     7 │ 2026-03-20 │
│ test failure after edit  │    11 │ 2026-03-18 │
└──────────────────────────┴───────┴────────────┘
```

<!-- [FILL: replace the example table above with real output from your mine.db] -->

the value isn't seeing individual errors. it's seeing which errors are *systematic* -- the ones worth building a hook or rule to prevent.

## further reading

- [mine plugin](../plugins/mine/) -- full feature docs including mistakes, search, burn
- [hooks](./hooks.md) -- the enforcement hooks that prevent recurring mistakes

tested with: claude code v2.1.77
