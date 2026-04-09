<!-- tested with: claude code v2.1.94 -->

# subagents

the fastest way to parallelize work in claude code. spawn separate claude instances for substantial tasks, keep the small stuff in your own context window.

## the decision tree

```
task needs 1-3 tool calls?
  yes -> do it yourself. spawning an agent is overhead.

task needs 5+ tool calls and is independent?
  yes -> spawn a subagent.

need multiple perspectives or parallel exploration?
  yes -> use agent teams (2-4 agents, each in its own worktree).
```

the rule is simple: if the task is worth explaining to another person from scratch, it's worth a subagent. if you can just do it, do it.

## worktree isolation

`isolation: "worktree"` is the key parameter. it creates a full git worktree for the agent, with its own branch and working directory. changes stay isolated until you explicitly merge.

```json
{
  "prompt": "refactor src/api/handlers.ts to use the new middleware pattern. update all route registrations.",
  "description": "refactor api handlers",
  "isolation": "worktree"
}
```

the agent works on a separate branch. your working tree is untouched. if the refactor goes sideways, nothing happened. if it works, you merge the branch.

use worktree isolation for:
- risky refactors where rollback matters
- experimental approaches you want to evaluate before committing
- any change that could break your current working state

skip it for read-only research. worktree setup adds overhead you don't need when the agent is just reading files.

## the scout pattern

send a cheap model to explore, then a capable model to act. each subagent is its own billing stream, so model choice matters.

**step 1: haiku scouts the codebase**

```json
{
  "prompt": "find all files related to payment processing. list each file, its exports, and its dependencies. DO NOT make changes.",
  "description": "scout payment code",
  "model": "claude-haiku-4-5"
}
```

**step 2: sonnet implements the change**

take haiku's findings and write a targeted prompt for sonnet. haiku is roughly 60x cheaper on input tokens. a 5-minute exploration that reads 30 files costs almost nothing.

this pattern works bc exploration and implementation require different capabilities. exploration needs breadth and speed. implementation needs judgment and precision. match the model to the job.

## cost reality

each subagent loads its own context window. that means paying the context-loading tax per agent.

| role | model | est. cost |
|---|---|---|
| coordinator | sonnet | ~$0.40 |
| researcher | haiku | ~$0.09 |
| implementer | sonnet | ~$2.30 |
| test writer | sonnet | ~$1.75 |
| **total** | | **~$4.54** |

a single sonnet doing all this sequentially might cost $3-4 bc it reuses context. teams trade cost for speed and isolation.

i've spawned thousands of subagents across hundreds of sessions. the average agent runs around 15-20 tool calls. the insight that matters: many short agents are cheaper and more effective than a few long-running ones. a team of 3 focused Explore agents finishing in a couple minutes each will outperform one agent trying to do everything in a 30-minute marathon. on the Max plan, agent teams don't cost extra. they're a throughput multiplier, not a billing event. the real cost is context: each agent gets its own context window, so you're trading parent context space for parallel execution. keep agents focused, give them clear prompts, and let them finish fast.

on the Max plan ($200/mo flat), per-agent cost is absorbed by the subscription. agent teams become a throughput question, not a billing question.

## the `subagent_type` parameter

specialized agent types get tailored system prompts and tool access:

- `explore`: read-only tools, optimized for codebase research
- `plan`: analysis tools, produces structured plans without making changes
- default: full tool access for implementation work

match the type to the job. an explore agent that can't write files won't accidentally modify anything.

## try it

1. next time you're about to do a 10+ step task, spawn a subagent instead. compare how long it takes vs doing it inline
2. try the scout pattern: haiku to map, sonnet to act. check the cost difference
3. for risky changes, always use `isolation: "worktree"`. the safety net is worth the setup time

[full agents guide &rarr;](../agents.md) | [copyable agent examples &rarr;](../../examples/agents/)
