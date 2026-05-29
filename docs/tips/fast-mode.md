<!-- tested with: claude code v2.1.122 -->

<!-- tested with: claude code v2.1.140 -->

## what it is

## what it is

fast mode reduces compute budget for faster output. as of v2.1.154, fast mode on opus 4.8 costs 2x the standard rate for 2.5x the speed -- a much better tradeoff than earlier versions.

fast mode keeps you on the same model (no downgrade to haiku/sonnet). what changes is the reasoning time budget: less extended thinking, faster tool calls, quicker responses. claude still has full access to every tool and every file.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

### interaction with effort levels (v2.1.140+)

fast mode (lower thinking budget) now coexists with effort levels (`--effort low|medium|high|xhigh|max`). effort controls throughput, model selection, and reasoning depth across the session. fast mode is a narrow toggle on output speed. they compose: `--effort low --fast` minimizes both reasoning and output latency. `--effort max --fast` may behave unexpectedly -- max effort expects time to think, fast mode tries to skip it. avoid that combination.

## why i don't use it

## when to use it

fast mode on opus 4.8 (v2.1.154+) is worth considering for:
- mechanical refactors where speed matters more than edge case detection
- exploratory coding where you iterate rapidly and catch mistakes in review
- time-constrained scenarios (demos, time-boxed work sessions)

still avoid fast mode when:
- you're working on security-critical code
- the task requires deep reasoning (complex algorithms, architectural decisions)
- you're on per-token billing and cost per token matters more than speed

the old advice ("never use fast mode, it's too expensive") is outdated as of v2.1.154. the speed/cost tradeoff is now reasonable. but it's still a tradeoff -- faster output at the cost of shallower reasoning.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)


Note: v2.1.132 fixed an issue where `--permission-mode` flag was ignored when resuming a plan-mode session with `--continue`/`--resume`. if you use plan mode with fast mode in resumable workflows, verify your permission settings are preserved on resume.
