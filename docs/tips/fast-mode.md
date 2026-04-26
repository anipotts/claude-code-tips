<!-- tested with: claude code v2.1.118 -->

# fast mode

same model, less thinking. toggle with `/fast`. my recommendation: don't.

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

## why i don't use it

## why i don't use it

fast mode uses extra-usage billing (v2.1.36+), which means cost is no longer flat on the Max plan. you pay overage rates when fast mode pushes usage above your subscription bucket. the speed gain (2.5x faster Opus 4.6) trades accuracy for velocity in a way that usually backfires.

the exception: you're at a hackathon with 30 minutes until demo, and a slow-but-correct implementation loses the time constraint completely. fast mode + extra billing for 30 minutes is cheaper than missing the deadline. otherwise, let opus think.

## cost note

## cost note

fast mode (v2.1.36+) is not included in the Max plan's flat $200/mo budget. instead, it uses extra-usage billing: you pay overage rates when fast mode pushes usage beyond your subscription tier's included tokens. check your settings for `fastMode` and `extraUsageBilling` to understand your billing model. on per-token API billing, fast mode's speed gain rarely outweighs the extra tokens burned on corrections.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)
