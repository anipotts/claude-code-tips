<!-- tested with: claude code v2.1.140 -->

## what it is

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

**note (v2.1.140+)**: fast mode now coexists with effort levels (`--effort low|medium|high|xhigh|max`). do not use them together in contradictory ways. effort controls throughput and reasoning depth globally; fast mode is a narrow toggle on output speed only. they are orthogonal controls but using `--effort max --fast` together is self-contradictory and should be avoided.

### interaction with effort levels (v2.1.140+)

fast mode (lower thinking budget) now coexists with effort levels (`--effort low|medium|high|xhigh|max`). effort controls throughput, model selection, and reasoning depth across the session. fast mode is a narrow toggle on output speed. they compose: `--effort low --fast` minimizes both reasoning and output latency. `--effort max --fast` may behave unexpectedly -- max effort expects time to think, fast mode tries to skip it. avoid that combination.

## why i don't use it

never use fast mode. i mean it. the only scenario where fast mode makes sense is if you're at a hackathon with 30 minutes left before demo, or you're someone who literally doesn't care about burning through usage. fast mode can easily run up over a hundred dollars of usage in half an hour.

the tradeoff isn't worth it for normal development. you get slightly faster output at the cost of shallower reasoning, which means more mistakes, which means more corrections, which means you end up spending MORE time and tokens than if you'd just let Opus think. keep it off.

the "toggle pattern" sounds nice in theory (start normal, switch to fast for execution, switch back for review). in practice, the execution phase is exactly where you need deep reasoning. mechanical refactors across 20 files are where subtle bugs hide. fast mode skips the edge case thinking that catches them.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)


Note: v2.1.132 fixed an issue where `--permission-mode` flag was ignored when resuming a plan-mode session with `--continue`/`--resume`. if you use plan mode with fast mode in resumable workflows, verify your permission settings are preserved on resume.
