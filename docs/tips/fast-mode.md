<!-- tested with: claude code v2.1.122 -->

<!-- tested with: claude code v2.1.140 -->

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.





**note (v2.1.140+)**: fast mode now coexists with effort levels (`--effort low|medium|high|xhigh|max`). effort controls throughput and reasoning depth; fast mode is a narrow toggle on output speed. avoid `--effort max --fast` (contradictory): max effort expects time to think, fast mode tries to skip it.



### fallbackModel interaction (v2.1.166+)

fast mode now coexists with the `fallbackModel` setting introduced in v2.1.166. if your primary model becomes overloaded, claude code retries on a fallback model (if configured). fast mode does not disable this fallback behavior -- you get the speed benefit plus the reliability of fallback retry.

### interaction with effort levels (v2.1.140+)

fast mode (lower thinking budget) now coexists with effort levels (`--effort low|medium|high|xhigh|max`). effort controls throughput, model selection, and reasoning depth across the session. fast mode is a narrow toggle on output speed. they compose: `--effort low --fast` minimizes both reasoning and output latency. `--effort max --fast` may behave unexpectedly -- max effort expects time to think, fast mode tries to skip it. avoid that combination.

## why i don't use it

never use fast mode. i mean it. the only scenario where fast mode makes sense is if you're at a hackathon with 30 minutes left before demo, or you're someone who literally doesn't care about burning through usage. fast mode can easily run up over a hundred dollars of usage in half an hour.

the tradeoff isn't worth it for normal development. you get slightly faster output at the cost of shallower reasoning, which means more mistakes, which means more corrections, which means you end up spending MORE time and tokens than if you'd just let Opus think. keep it off.

the "toggle pattern" sounds nice in theory (start normal, switch to fast for execution, switch back for review). in practice, the execution phase is exactly where you need deep reasoning. mechanical refactors across 20 files are where subtle bugs hide. fast mode skips the edge case thinking that catches them.



### fallback retry behavior (v2.1.166+)

v2.1.166 added automatic fallback model retry for unexpected API errors (not rate-limit, auth, or request-size errors). fast mode does not interact with this -- if your primary model fails with an unexpected error, it will retry once on the fallback model if configured. this is transparent to fast mode.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)


Note: v2.1.132 fixed an issue where `--permission-mode` flag was ignored when resuming a plan-mode session with `--continue`/`--resume`. if you use plan mode with fast mode in resumable workflows, verify your permission settings are preserved on resume.
