# why hooks matter

i run 11 hooks on every session. here's why.

hooks are the difference between "claude code does what i want" and "claude code does whatever it feels like." CLAUDE.md gives guidance. hooks give enforcement. one is a suggestion, the other is a wall.

## what hooks actually prevent

hooks catch three categories of damage:

**destructive commands** -- safety-guard.sh blocks force-pushes to main, `rm -rf /`, `DROP TABLE`, `chmod 777` on sensitive paths, and `curl | bash` remote execution. these are things that should never happen, period. exit code 2 = hard block, no override.

**bad merges** -- no-squash.sh blocks `--squash` on any merge. i care about commit history. one CLAUDE.md rule saying "don't squash" gets ignored eventually. a hook that exits 2 never does.

**context loss** -- context-save.sh fires on PreCompact and writes a handoff markdown before compression. without this, every `/compact` wipes your plan. with it, claude reads the handoff and picks up where it left off.

## the hooks i can't live without

| hook | type | what it does |
|------|------|-------------|
| safety-guard | PreToolUse | blocks 6 categories of destructive bash commands |
| no-squash | PreToolUse | blocks squash merges — preserves commit history |
| context-save | PreCompact | saves session state before context compression |
| panopticon | PostToolUse | logs every tool call to sqlite for later analysis |
| replay-capture | PostToolUse | logs file mutations to JSONL for VHS animations |
| commit-nudge | PostToolUse | soft reminder after 8+ edits without a commit |
| md-lint-fix | PostToolUse | auto-runs markdownlint-fix on saved .md files |
| version-stamp | SessionEnd | updates "tested with" version stamps in changed files |
| stale-branch | SessionStart | warns about local branches with deleted remotes |
| notify | Notification | routes claude code alerts to macOS notifications |
| knowledge-builder | PostToolUse | builds a codebase knowledge graph from tool calls |

<!-- [FILL: reorder this table by how often each hook fires for you. -->
<!-- add a "fires/session" column with real numbers from panopticon data] -->

## hooks vs CLAUDE.md rules

use CLAUDE.md when you want to **guide behavior** -- coding style, naming conventions, preferred patterns. claude reads it, usually follows it, occasionally forgets.

use hooks when you want to **enforce behavior** -- things that must never happen, things that must always happen. hooks don't forget. they don't get creative. they run every time.

rule of thumb: if you'd be angry when it's violated, make it a hook. if you'd be mildly annoyed, put it in CLAUDE.md.

```
CLAUDE.md:  "prefer conventional commits"     -- guidance
hook:       block force-push to main           -- enforcement
```

## further reading

- [hooks directory](../../hooks/) -- all 11 hook scripts with full source
- [hooks reference](../claude-code/hooks-reference.md) -- setup, registration, patterns

tested with: claude code v2.1.77
