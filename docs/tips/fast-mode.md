<!-- tested with: claude code v2.1.94 -->

# fast mode

same model, faster output. toggle with `/fast` when speed matters more than depth.

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

## when to use it

tasks where correctness is obvious and speed matters:

- batch file reads across a large codebase
- simple find-and-replace edits
- known-pattern refactors (rename a variable across 20 files)
- writing boilerplate (test scaffolding, config files, type definitions)
- mechanical changes where the pattern is clear after the first file

fast mode is great for the "just do this 15 times" category of work. claude doesn't need deep reasoning to rename a function. it needs to be fast.

## when not to use it

anything where thinking catches edge cases you'd miss:

- complex debugging with multiple possible root causes
- architecture decisions with tradeoffs
- security reviews
- writing logic with subtle state management
- first-time implementation in an unfamiliar codebase

if the task requires judgment, give claude the full thinking budget. the few extra seconds per response pay for themselves in avoided mistakes.

## the toggle pattern

the best workflow i've found: start in normal mode to understand the problem, switch to fast for execution, switch back to normal for review.

```
[normal] "read the auth module and explain how sessions work"
[normal] "design the migration to add refresh tokens"
/fast
[fast]   "implement the migration"
[fast]   "update all the tests"
/fast
[normal] "review what we just did, check for edge cases"
```

this lets you get the best of both. deep thinking where it matters, speed where it doesn't.

[FILL: how often i toggle between modes in a typical session, and whether i have a default preference]

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode might actually cost slightly less bc of reduced thinking tokens, but the difference is marginal.

## try it

1. start a session in normal mode. ask claude to read and explain a module
2. toggle `/fast` and ask it to make a mechanical change across multiple files
3. notice the speed difference. decide where that tradeoff makes sense for your workflow

[cost breakdown &rarr;](../cost.md)
