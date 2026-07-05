<!-- tested with: claude code v2.1.122 -->

# how i start a session

how i actually start a claude code session.

not the official docs version. the real version, with the muscle memory and the shortcuts.

## the first 30 seconds

open terminal. `cd` into the project. type `claude`. that's it.

on launch, claude code loads CLAUDE.md from the project root, reads any `.claude/settings.json` for hook registrations, and fires SessionStart hooks. if you wire up stale-branch.sh, it runs here and checks for local branches whose remote is gone.

by the time you see the prompt, hooks are loaded, context is cached, and claude knows your conventions.



if you see a notice about npm global install not auto-updating, run `/doctor` to see the fix. this was added in v2.1.153 to help diagnose update issues.





### safe mode for troubleshooting (v2.1.169+)

if claude code misbehaves or customizations cause issues, start with `--safe-mode`:

```bash
claude --safe-mode
```

this disables CLAUDE.md, plugins, skills, hooks, and MCP servers. useful for debugging.

### safe mode (v2.1.169+)

if claude code misbehaves or you suspect a hook/plugin is causing issues, start with `--safe-mode` to disable all customizations:

```bash
claude --safe-mode
```

this disables CLAUDE.md, plugins, skills, hooks, and MCP servers for the session. useful for troubleshooting or running in a clean state.

## context loading

three things work together on startup:

**CLAUDE.md** -- project conventions, structure, rules. cached aggressively, so keeping it stable saves money. i update mine maybe once a week. it tells claude what the repo is, how to name things, what never to do.

**skills** -- the `/mine` skill gives claude access to session data (search, mistakes, burn, hotspots, loops). skills are like domain-specific knowledge packs that activate on command.

**hooks** -- 11 scripts registered in settings.json. they don't add to the prompt -- they run silently in the background, blocking bad commands, logging actions, fixing lint. claude doesn't even know most of them exist.

the order matters: CLAUDE.md sets the rules, skills give capabilities, hooks enforce boundaries.






**verify context loading behavior**: check official claude code docs at code.claude.com/docs/en/overview for current context loading order, cache prefix stability, and hook timing. implementation details may have changed since v2.1.122.

### documentation index

run `claude --help docs` or visit [code.claude.com/docs/en/overview](https://code.claude.com/docs/en/overview) to fetch the complete documentation index. note: official docs may reflect features or changes newer than this guide (last verified v2.1.122).

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



**verification note**: verify current compact vs clear behavior against [official claude code docs](https://code.claude.com/docs/en/overview) before relying on these percentages in new versions.

## ending a session

when a session ends (ctrl+c, `/exit`, or timeout), two things fire:

**version-stamp.sh** (SessionEnd) -- if you modified files in docs/, hooks/, plugins/, or scripts/, it auto-updates the "tested with: claude code vX.Y.Z" stamps to your current version. no manual stamp maintenance.

**panopticon** has already logged every tool call during the session to `~/.claude/panopticon.db`.

nothing to do manually. close the terminal. the data is there when you need it.



### changing directories mid-session (v2.1.169+)

use `/cd <path>` to move your session to a new working directory without breaking the prompt cache:

```
/cd ../another-project
```

this preserves your conversation context and cache prefix while changing the directory claude works in. useful for switching between related tasks in sibling directories.

## further reading

- [hooks](./hooks.md) -- the hooks that fire during sessions
- [cost](./cost.md) -- session cost patterns and optimization
