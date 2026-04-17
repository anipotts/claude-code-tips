<!-- tested with: claude code v2.1.94 -->

# fast mode

same model, less thinking. toggle with `/fast`. my recommendation: don't.

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

## why i don't use it

## effort levels: the better alternative

fast mode exists but `/effort` is the better control. fast mode is a binary toggle (on/off). effort levels give you granular control:

```
/effort low      # fast, minimal thinking (like fast mode)
/effort medium   # balanced
/effort high     # extended thinking (default for complex work)
/effort xhigh    # maximum thinking (opus 4.7 only)
```

use `/effort low` for mechanical tasks (file moves, renames, simple edits). use `/effort high` or `/effort xhigh` for anything that needs reasoning.

my recommendation: don't use fast mode. use `/effort low` for simple work and `/effort high` for everything else. xhigh is for when you're genuinely stuck and need the model to think harder.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)
