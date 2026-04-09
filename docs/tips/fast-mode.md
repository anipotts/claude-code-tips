<!-- tested with: claude code v2.1.94 -->

# fast mode

same model, less thinking. toggle with `/fast`. my recommendation: don't.

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

## why i don't use it

never use fast mode. i mean it. the only scenario where fast mode makes sense is if you're at a hackathon with 30 minutes left before demo, or you're someone who literally doesn't care about burning through usage. fast mode can easily run up over a hundred dollars of usage in half an hour.

the tradeoff isn't worth it for normal development. you get slightly faster output at the cost of shallower reasoning, which means more mistakes, which means more corrections, which means you end up spending MORE time and tokens than if you'd just let Opus think. keep it off.

the "toggle pattern" sounds nice in theory (start normal, switch to fast for execution, switch back for review). in practice, the execution phase is exactly where you need deep reasoning. mechanical refactors across 20 files are where subtle bugs hide. fast mode skips the edge case thinking that catches them.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)
