<!-- tested with: claude code v2.1.122 -->

<!-- tested with: claude code v2.1.140 -->

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. as of v2.1.142, fast mode uses Opus 4.7 by default (previously Opus 4.6). claude still has full access to every tool and every file. it just spends less time reasoning before acting.

if you need to pin fast mode to Opus 4.6, set `CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE=1`.

## why i don't use it

never use fast mode. i mean it. the only scenario where fast mode makes sense is if you're at a hackathon with 30 minutes left before demo, or you're someone who literally doesn't care about burning through usage. fast mode can easily run up over a hundred dollars of usage in half an hour.

note: fast mode now defaults to Opus 4.7, which is a newer model. the original reasoning about shallower thinking may have shifted, but the core tradeoff remains: you get speed at the cost of reduced reasoning depth on complex tasks. test it yourself against your baseline to decide if the new model changes the calculus.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)


Note: v2.1.132 fixed an issue where `--permission-mode` flag was ignored when resuming a plan-mode session with `--continue`/`--resume`. if you use plan mode with fast mode in resumable workflows, verify your permission settings are preserved on resume.
