<!-- tested with: claude code v2.1.122 -->

# subagents

the fastest way to parallelize work in claude code. spawn separate claude instances for substantial tasks, keep the small stuff in your own context window.

## the decision tree

```
task needs 1-3 tool calls?
  yes -> do it yourself. spawning an agent is overhead.

task needs 5+ tool calls and is independent?
  yes -> use `/subtask` (in-session) or `/fork` (background).
  - `/subtask`: shares context, tighter feedback, synchronous
  - `/fork`: separate session, parallel work, asynchronous

need multiple perspectives or parallel exploration?
  yes -> use agent teams (2-4 agents with `/fork`, each in its own worktree).
  note: per-session cap is 200 subagents (configurable via `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`)
```

## worktree isolation

worktree isolation is one approach. v2.1.212 introduces two complementary commands:

**`/subtask`** -- runs an in-session subagent that shares your context window. faster, cheaper, tighter feedback loop. good for focused delegated work where you want the parent agent to track progress.

**`/fork`** -- copies your conversation into a new background session (separate row in `claude agents`). you keep working while the forked session runs independently. good for long-running parallel work where you don't want to block.

worktrees (`isolation: "worktree"`) are still the isolation mechanism for both -- they just use different session topology.

### worktree cloning with skipLfs (v2.1.153+)

when spawning agents with `isolation: "worktree"`, large repos with git lfs files can be slow to clone. set `skipLfs: true` in your agent config to skip lfs downloads:

```json
{
  "prompt": "refactor src/api/handlers.ts",
  "description": "refactor api handlers",
  "isolation": "worktree",
  "gitConfig": {
    "skipLfs": true
  }
}
```

this speeds up worktree creation for repos with large binary assets.

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



### v2.1.212: subagent budget constraints

v2.1.212 adds hard limits:
- per-session subagent cap: 200 (default, override with `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`)
- `/clear` resets the budget for the session

this prevents runaway delegation loops. if you hit the limit, create a new session or use `/clear` to reset.

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
