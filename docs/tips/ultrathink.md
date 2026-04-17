<!-- tested with: claude code v2.1.94 -->

# ultrathink

force claude code into extended thinking mode for complex problems. more thinking tokens = better reasoning on hard tasks.

## how to use it

## how to use it

use `/effort` to set your thinking budget. `xhigh` enables extended thinking:

```
/effort xhigh
design the database schema for a multi-tenant SaaS with row-level security
```

or in one command:

```
/effort xhigh; design the database schema...
```

effort levels (from fast to deep):
- `low` -- minimal thinking, fastest output
- `medium` -- balanced
- `high` -- extended thinking (default for complex work)
- `xhigh` -- maximum thinking tokens (opus 4.7 only)

## when it helps

- architecture decisions with multiple tradeoffs
- complex multi-file refactors where you need a plan first
- debugging subtle issues where the first intuition is usually wrong
- any prompt where you'd say "think carefully about this"



## the xhigh vs high tradeoff

`xhigh` costs more tokens (extended thinking is expensive). use it for:
- novel problems where you have no intuition
- multi-file architecture decisions
- debugging that requires deep reasoning

use `high` (the default) for most work. it includes extended thinking without the maximum token spend.

## when it doesn't help

- simple file edits, renames, or config changes
- tasks where you already know exactly what you want
- exploratory reads (grep, glob, read)

## what it actually does

claude code's extended thinking allocates more compute to reasoning before generating a response. the model "thinks out loud" internally, exploring multiple approaches before committing to one. you don't see the thinking tokens but you benefit from the better output.

## try it

next time you're about to ask claude for something complex, prefix it with "ultrathink" and compare the quality of the plan. you'll notice it considers more edge cases and catches tradeoffs you didn't mention.
