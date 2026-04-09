# mistakes i made

hundreds of sessions across dozens of projects. here are the mistakes i keep making -- and the fixes.

some of these are my mistakes. some are patterns where claude code reliably does the wrong thing unless you set up guardrails. the distinction matters less than the fix.

## the expensive mistakes

from real session data -- these are the patterns that actually cost me time:

| mistake | frequency | fix |
|---------|-----------|-----|
| ran `rm -rf` on directories without thinking twice | 8 times | safety-guard.sh hook blocks `rm -rf /` and other destructive patterns |
| used `--force` push and clobbered remote branches | 4 times | safety-guard.sh blocks force push; CLAUDE.md rule as backup |
| let marathon sessions run 2+ hours, context degraded | 101 sessions (23%) | compaction happened 1.7x avg in long sessions -- split work into <1hr chunks |
| edited files without reading them first | common (Write→Write is the 11th most common bigram) | CLAUDE.md rule: always Read before Write |
| left sessions running in background (50x+ wall/active ratio) | 19 sessions (5%) | not a "mistake" per se, but it skews your stats and wastes token budget |

## the CLAUDE.md rules that fixed them

each mistake above earned a rule. here's the mapping:

**destructive commands (rm -rf, DROP TABLE, curl | bash)**
fix: [safety-guard.sh](../hooks/safety-guard.sh) hook (PreToolUse) intercepts Bash calls and blocks dangerous patterns. exit 2 stops the action cold, stderr tells claude why.

**force pushes and squash merges**
fix: safety-guard blocks `--force` on push. [no-squash.sh](../hooks/no-squash.sh) blocks `--squash` flag. CLAUDE.md rule "NEVER squash merge" as guidance backup. between the hook and the rule, this hasn't happened since.

**context loss on long sessions**
fix: [context-save.sh](../hooks/context-save.sh) hook (PreCompact) writes a handoff summary before compaction. 32% of 30-60 min sessions and 54% of 2hr+ sessions hit compaction -- this hook saves the plan every time.

**off-convention code**
fix: CLAUDE.md conventions section with explicit style rules. pr-quality-gate workflow catches missing version stamps on PR. the combination of guidance + enforcement catches most drift.

## error patterns claude repeats

these are the tool-level patterns that show up in the data:

- **Bash errors** are the most common failure (multiple exit code 1 patterns). most are benign (command not found, test failures) but some are missed pushes or broken builds
- **Read errors**: tried to read a directory instead of a file (EISDIR), hit token limits on large files (>10K tokens). fix: use `offset` and `limit` params
- **WebFetch 403s**: external URLs returning forbidden. not much you can do except handle it gracefully
- **File not found**: reading files that don't exist yet or were moved. usually happens when claude assumes a file path from context

the real insight: only 8 errors were captured across hundreds of sessions. the error *rate* is low. the expensive mistakes aren't errors -- they're bad decisions that succeed (like force-pushing or editing without reading).

## what /mine mistakes actually shows

the `mistakes` feature in the mine plugin tracks error patterns across sessions. it watches for tool calls that fail, commands that get blocked by hooks, and patterns that repeat.

```
/mine mistakes
```

real patterns from this user's mine.db:

| pattern | what it means |
|---------|---------------|
| `clasp push --force` (8 occurrences) | google apps script deploys with force flag -- a habit, not a mistake |
| `rm -rf` commands (8 occurrences) | directory cleanup -- usually intentional but worth catching |
| Read on directory/oversized file (3 errors) | claude tried to read too much at once |
| failed git push (1 error) | remote was ahead -- needed fetch first |

the value isn't seeing individual errors. it's seeing which errors are *systematic* -- the ones worth building a hook or rule to prevent.

## further reading

- [mine plugin](https://github.com/anipotts/mine) -- full feature docs including mistakes, search, burn
- [hooks](./hooks.md) -- the enforcement hooks that prevent recurring mistakes

tested with: claude code v2.1.94
