<!-- tested with: claude code v2.1.122 -->

<!-- tested with: claude code v2.1.140 -->

## what it is

## what it is

fast mode keeps you on opus (now opus 4.8 by default). it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception i see. people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.

### opus 4.8 fast mode pricing (v2.1.154+)

opus 4.8 fast mode costs 2x the standard rate for 2.5x output speed. this is a meaningful improvement over previous versions. for some workflows (tight deadlines, high throughput exploration), the cost/speed tradeoff is worth it.

### interaction with effort levels (v2.1.140+)

fast mode (lower thinking budget) now coexists with effort levels (`--effort low|medium|high|xhigh|max`). effort controls throughput, model selection, and reasoning depth across the session. fast mode is a narrow toggle on output speed. they compose: `--effort low --fast` minimizes both reasoning and output latency. `--effort max --fast` may behave unexpectedly -- max effort expects time to think, fast mode tries to skip it. avoid that combination.

## why i don't use it

## when fast mode makes sense

fast mode is useful for:
- **tight deadlines**: when 2.5x speed justifies 2x cost (hackathons, demos, time-critical pushes)
- **high-throughput exploration**: parallel reads across large codebases where speed lets you ask more questions in less time
- **low-token tasks**: small edits or refactors where the base cost is low enough that doubling it doesn't hurt

fast mode is NOT useful for:
- **complex reasoning**: where deep thinking catches edge cases. fast mode trades depth for speed.
- **multi-file refactors**: where subtle bugs hide in the details. the mistakes cost more than the time saved.
- **marathon sessions**: context is already degraded in long sessions; compounding that with shallow reasoning is a bad bet.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)


Note: v2.1.132 fixed an issue where `--permission-mode` flag was ignored when resuming a plan-mode session with `--continue`/`--resume`. if you use plan mode with fast mode in resumable workflows, verify your permission settings are preserved on resume.
