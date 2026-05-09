<!-- tested with: claude code v2.1.122 -->

# fast mode

same model, less thinking. toggle with `/fast`. my recommendation: don't.

## what it is

fast mode has been replaced by effort levels (low, medium, high, xhigh, max). these control compute allocation and thinking budget, not model selection. all levels use the same base model (opus by default). you can set effort with `/effort` or in settings.

this is the most common misconception. people assume effort=low means dumber model. it doesn't. it's the same model with a tighter (or more generous) thinking budget.

## why i don't use it

i run at effort=high or effort=max. never low or medium. the only scenario where low effort makes sense is if you're at a hackathon with 30 minutes left before demo, or you're someone who literally doesn't care about quality. low effort can easily run up a hundred dollars of usage in half an hour on per-token billing.

the tradeoff isn't worth it for normal development. you get slightly faster output at the cost of shallower reasoning, which means more mistakes, which means more corrections, which means you end up spending MORE time and tokens than if you'd just let the model think. keep effort at high or max.

## cost note

effort level doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is thinking budget and response speed. on per-token billing, low effort can actually cost MORE because the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)


Note: v2.1.132 fixed an issue where `--permission-mode` flag was ignored when resuming a plan-mode session with `--continue`/`--resume`. if you use plan mode with fast mode in resumable workflows, verify your permission settings are preserved on resume.
