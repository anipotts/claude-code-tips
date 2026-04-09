<!-- tested with: claude code v2.1.94 -->

# context management

the context window is a shared budget. every file read, every tool result, every turn of conversation eats into it. manage it or it manages you.

## the compaction cliff

| session length | compaction rate |
|---------------|----------------|
| <10 min | 0% |
| 10-30 min | 10% |
| 30-60 min | 32% |
| 1-2 hr | 51% |
| 2 hr+ | 54% |

each compaction loses context. after 2 compactions, you're fighting drift. claude starts forgetting your constraints, repeating earlier mistakes, losing track of what's been done.

the sweet spot is 10-30 min. high throughput, low compaction, minimal context loss.

## claude doesn't slow down. you do.

active tool rate is flat at ~3.4 calls/min across all session lengths over 10 min. that holds steady whether you're 15 minutes in or 3 hours deep. claude's throughput doesn't degrade.

the wall-time tool rate drops 8.8x from short to marathon sessions. that's 100% human idle time. longer review gaps, context switching, decision fatigue. the bottleneck is never claude. it's you.

## what shares the context window

everything in a session competes for the same space:

- **CLAUDE.md** and project rules (loaded every session, cached if stable)
- **tool definitions** (fixed cost, always present)
- **conversation history** (grows every turn, the biggest consumer)
- **file reads** (each one dumps content into the window permanently)
- **tool results** (grep output, bash output, all of it persists)

a single large file read can eat more context than 10 turns of conversation. reading 5 files you don't need is like leaving lights on in rooms you never enter.

## targeted vs exploratory reads

| approach | context cost | when to use |
|----------|-------------|-------------|
| `read src/auth/token.ts lines 130-160` | low | you know where the problem is |
| `grep "validateToken" across all files` | medium | you know what, not where |
| `read the entire src/ directory` | very high | never, if you can help it |

targeted reads are 10-20x cheaper on context than exploratory ones. the more specific your prompt, the fewer files claude needs to read.

bad: "find the bug in the auth module"
good: "the bug is in src/auth/token.ts around line 140, the JWT expiry check"

## five strategies that work

### 1. scope before you start

"implement the auth module" is a 2hr session. "add the JWT validation middleware" is 15 min. the tighter your scope, the less context you burn and the lower your compaction risk.

### 2. commit often

the data shows 1 commit every 3.4 active minutes. small commits give you rollback points if a session goes wrong. they also create natural breakpoints for splitting into new sessions.

### 3. split at natural boundaries

when you finish a subtask, start a new session. a fresh context window is free. a bloated one costs you accuracy and speed. don't do 5 unrelated things in one session.

### 4. keep CLAUDE.md short and stable

CLAUDE.md is part of the cache prefix. every edit breaks the cache for the rest of that session. keep it under 30 lines. move task lists, WIP notes, and anything that changes frequently to a separate file.

### 5. use a context-save hook

a PreCompact hook fires before compression and writes session state to a file. without it, compaction wipes your plan. with it, claude reads the handoff and picks up where it left off.

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/context-save.sh"
          }
        ]
      }
    ]
  }
}
```

the [context-save.sh](../../hooks/context-save.sh) hook in this repo does exactly this.

## compaction data from my sessions

across hundreds of sessions, roughly a fifth of them hit compaction. the pattern is predictable: short sessions almost never compact. once you're past 30 minutes, about a third of sessions will compact. past an hour, it's a coin flip. my rule is simple: if a session compacts twice, finish the immediate task and start fresh. three compactions means the original plan is gone and you're flying blind. sessions that compact once still ship at the same rate as sessions that don't. sessions that compact twice ship at half the rate. keep sessions focused and under an hour. if a task needs two hours, split it into three focused sessions.

## try it

1. run `/mine` to check your compaction rate by session length. if most 30-min sessions are compacting, your prompts are too broad.
2. add a PreCompact hook to save state before compression hits.
3. scope your next task to 15 minutes of work and see if the session stays clean.

[session length data &rarr;](./session-length.md) | [full cost analysis &rarr;](../cost.md)
