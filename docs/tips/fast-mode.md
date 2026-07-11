<!-- tested with: claude code v2.1.140 -->

# fast mode

## what it is

fast mode keeps you on opus. it does not switch to a cheaper or smaller model. what changes is the compute budget: less extended thinking time, faster tool calls, quicker responses. claude still has full access to every tool and every file. it just spends less time reasoning before acting.

this is the most common misconception: people assume fast mode = dumber model. it's not. it's the same opus with a tighter thinking budget.


### interaction with auto mode (v2.1.207+)

if auto mode is enabled, fast mode toggles may interact unexpectedly with model switching. auto mode may override your fast mode choice if it detects a task needing a different model. check your settings with `disableAutoMode` if you need consistent model behavior.

## version notes

### effort levels (v2.1.140+)

fast mode now coexists with effort levels (`--effort low|medium|high|xhigh|max`). effort controls throughput and reasoning depth; fast mode is a narrow toggle on output speed. they compose: `--effort low --fast` minimizes both reasoning and output latency. **avoid `--effort max --fast`** -- max effort expects time to think, fast mode tries to skip it. these are contradictory and may behave unexpectedly.

### model restrictions (v2.1.176+)

if `enforceAvailableModels` is enabled in settings, `/fast` will refuse to toggle if it would switch to a model outside the allowlist. this prevents bypassing model restrictions via fast mode. design your fast-mode workflows to stay within your configured available models.

## why i don't use it

never use fast mode. i mean it. the only scenario where fast mode makes sense is if you're at a hackathon with 30 minutes left before demo, or you're someone who literally doesn't care about burning through usage. fast mode can easily run up over a hundred dollars of usage in half an hour.

with effort levels (v2.1.140+) now available, effort controls are the preferred way to manage throughput and reasoning depth. avoid combining `--effort max --fast` -- they contradict each other. design your sessions around effort level, not around toggling fast mode mid-conversation.

the tradeoff isn't worth it for normal development. you get slightly faster output at the cost of shallower reasoning, which means more mistakes, which means more corrections, which means you end up spending MORE time and tokens than if you'd just let Opus think. keep it off.

### with effort levels (v2.1.140+)

effort levels add another dimension. at `--effort low --fast`, you get minimal reasoning + minimal latency. at `--effort max`, you want deep thinking, so toggling fast mode into that state is self-defeating. design your sessions around effort level, not around toggling fast mode mid-conversation.

## cost note

fast mode doesn't change your cost on the max plan. you're paying $200/mo flat regardless. the only thing that changes is speed. on per-token billing, fast mode can actually cost MORE bc the mistakes and corrections generate extra tokens that dwarf any savings from reduced thinking.

## the one exception

hackathon. 30 minutes to demo. you need something that compiles, not something that's correct. that's the only time speed legitimately matters more than depth.

[cost breakdown &rarr;](../cost.md)


Note: v2.1.132 fixed an issue where `--permission-mode` flag was ignored when resuming a plan-mode session with `--continue`/`--resume`. if you use plan mode with fast mode in resumable workflows, verify your permission settings are preserved on resume.
