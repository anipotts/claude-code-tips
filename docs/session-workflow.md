# how i start a session

how i actually start a claude code session.

not the official docs version. the real version, with the muscle memory and the shortcuts.

## the first 30 seconds

open terminal. `cd` into the project. type `claude`. that's it.

on launch, claude code loads CLAUDE.md from the project root, reads any `.claude/settings.json` for hook registrations, and fires SessionStart hooks. in my setup, stale-branch.sh runs here -- it checks for local branches whose remote is gone and prints a cleanup reminder.

by the time i see the prompt, hooks are loaded, context is cached, and claude knows my conventions.

## context loading

three things work together on startup:

**CLAUDE.md** -- project conventions, structure, rules. cached aggressively, so keeping it stable saves money. i update mine maybe once a week. it tells claude what the repo is, how to name things, what never to do.

**skills** -- the `/mine` skill gives claude access to session data (search, mistakes, burn, hotspots, loops). skills are like domain-specific knowledge packs that activate on command.

**hooks** -- 11 scripts registered in settings.json. they don't add to the prompt -- they run silently in the background, blocking bad commands, logging actions, fixing lint. claude doesn't even know most of them exist.

the order matters: CLAUDE.md sets the rules, skills give capabilities, hooks enforce boundaries.

## the cascade method

<!-- TODO: parallel agent workflow details -->

## when to /compact vs /clear

from real data: 32% of 30-60 min sessions needed compaction, 54% of 2hr+ sessions did. here's when to use each:

**/compact when:**
- 20+ turns and you're shifting topics
- context-save.sh hook is active (it preserves state before compression)
- you see claude repeating itself or losing track of earlier decisions

**/clear when:**
- starting a completely new task
- the previous task is done and committed
- you want a fresh context window (cheaper than carrying dead context)

the data says: sessions that hit compaction average 1.7 compactions. if you're compacting more than twice, the session is too long -- split it.

<!-- TODO: personal compact vs clear decision framework -->
<!-- /clear when: -->
<!-- - switching to a completely different task -->
<!-- - claude is stuck in a loop and retrying the same approach -->
<!-- - you want a fresh start with no baggage -->
<!-- -->
<!-- never /compact when: -->
<!-- - you have uncommitted changes that aren't captured in handoff -->
<!-- - you're about to switch branches ] -->

## ending a session

when a session ends (ctrl+c, `/exit`, or timeout), two things fire:

**version-stamp.sh** (SessionEnd) -- if you modified files in docs/, hooks/, plugins/, or scripts/, it auto-updates the "tested with: claude code vX.Y.Z" stamps to your current version. no manual stamp maintenance.

**panopticon** has already logged every tool call during the session to `~/.claude/panopticon.db`. replay-capture has logged every file mutation to `~/.claude/replay/SESSION_ID.jsonl`.

nothing to do manually. close the terminal. the data is there when you need it.

## further reading

- [hooks](./hooks.md) -- the 11 hooks that fire during sessions
- [cost](./cost.md) -- session cost patterns and optimization

tested with: claude code v2.1.77
