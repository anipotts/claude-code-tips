<!-- tested with: claude code v2.1.118 -->

# fast mode

same model, less thinking. toggle with `/fast`. my recommendation: don't.

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

## why i don't use it

## when to consider fast mode

my original stance was "never use fast mode." that's still the right baseline for normal development work. the reasoning: fast mode trades depth of reasoning for speed, and the mistakes you make from shallower thinking usually cost more tokens in corrections than you saved in faster initial execution.

however, there are legitimate edge cases beyond hackathons:

- mechanical refactors where the approach is already proven (you're executing a plan, not designing one)
- low-stakes exploration where you're just spiking an idea and will rewrite anyway
- cost-sensitive scenarios on per-token billing where speed genuinely matters

the rule: if you're designing, architecting, or debugging, keep fast mode off. if you're executing a known plan, it may save time. test both in your workflow and measure the total token cost (initial + corrections) to know which is cheaper for your work style.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)
