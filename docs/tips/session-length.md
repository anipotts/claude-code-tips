<!-- tested with: claude code v2.1.77 -->

# session length: the data

shorter sessions are more efficient. here's the data.

## the numbers

| session length | n | tools/min (wall) | tools/min (active) | compaction rate | avg cost |
|---------------|---|-----------------|-------------------|----------------|----------|
| <10 min | 121 | 6.4 | 6.5 | 0% | $1.96 |
| 10-30 min | 77 | 2.7 | 3.4 | 10% | $5.59 |
| 30-60 min | 57 | 2.0 | 3.7 | 32% | $10.92 |
| 1-2 hr | 43 | 1.6 | 3.3 | 51% | $16.74 |
| 2 hr+ | 101 | 0.73 | 3.4 | 54% | $27.72 |

## what this means

**active tool rate is flat at ~3.4/min.** claude doesn't slow down in long sessions. the wall-time rate drops 8.8x bc *you* slow down. longer review gaps, context switching, decision fatigue.

**compaction is the cliff.** 0% of <10 min sessions need compaction. 54% of 2hr+ sessions do. each compaction loses context. after 2 compactions, you're fighting drift.

**the sweet spot is 10-30 min.** high throughput, low compaction, $5.59 avg cost. you stay focused, claude stays in context.

## what to do

1. **scope before you start.** "implement the auth module" is a 2hr session. "add the JWT validation middleware" is 15 min.
2. **commit often.** the data shows 1 commit every 3.4 active minutes. small commits = easy rollback if a session goes wrong.
3. **split at natural boundaries.** when you finish a subtask, start a new session. don't let context bloat.
4. **if you're past 1 hour, stop and assess.** 51% of 1-2hr sessions needed compaction. either split the work or accept the context cost.

## try it

run `/mine` to check your own session length distribution. if most of your sessions are 2hr+, you're probably working harder than you need to.

[full cost analysis &rarr;](../cost.md)
