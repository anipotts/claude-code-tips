# claude code cost analysis

**understand where your tokens go and stop overspending.**

---

## how billing works

every claude code interaction is an API call. you send tokens in (your prompt + conversation history + tool results), you get tokens out (claude's response). thats it -- but the details matter.

**the context window fills up over a session.** turn 1 might send 5K tokens. turn 20 sends 150K tokens bc the entire conversation history is re-sent every time. this is why long sessions get expensive fast -- its not the individual prompt, its the accumulated context.

**every tool call adds tokens.** when claude calls Read, Grep, Bash, etc., the tool result gets added to the context. reading a 10K line file dumps thousands of tokens into the window. those tokens get re-sent on every subsequent turn.

**prompt caching helps.** content that stays the same across turns (CLAUDE.md, tool definitions, system prompt) gets cached. subsequent turns read from cache at 90% discount. but only if the cached content exceeds 4,096 tokens.

**compaction resets context -- but costs tokens itself.** `/compact` summarizes your conversation into a shorter version. this reduces future turn costs but the compaction itself is a full round trip. use it strategically, not reflexively.

---

## model pricing (march 2026)

| model | input (per M tokens) | output (per M tokens) | cache read | cache write |
|---|---|---|---|---|
| haiku 4.5 | $0.80 | $4.00 | $0.08 | $1.00 |
| sonnet 4.6 | $3.00 | $15.00 | $0.30 | $3.75 |
| opus 4.6 | $15.00 | $75.00 | $1.50 | $18.75 |

the API reports four token buckets per request: `input_tokens` (non-cached input), `cache_read_input_tokens` (90% discount), `cache_creation_input_tokens` (25% premium), and `output_tokens`. in a typical session, 90%+ of cost comes from cache tokens bc every tool call re-sends the conversation context.

> [pricing docs](https://docs.anthropic.com/en/docs/about-claude/models)

---

## what actually costs money

ranked by impact:

**1. long sessions.** the number one cost driver. by turn 30, every message sends 100K+ tokens of context. cache helps, but the sheer volume adds up. a 1-hour session can cost 10-50x what five 12-minute sessions cost for the same work.

**2. opus usage.** opus is 5x sonnet for the same work. thats not 5% more -- its 500% more. a 30-minute opus session costs what a full day of sonnet costs.

**3. subagents and agent teams.** each subagent has its own context window. three subagents = three separate billing streams running in parallel. agent teams multiply this further.

**4. large file reads.** reading a 10K line file eats thousands of tokens. those tokens persist in the context for the rest of the session. reading 5 large files you dont need is like leaving the lights on in rooms you never enter.

**5. unfocused tool calls.** grepping the entire project when you know the file. globbing `**/*` when you know the directory. every unnecessary tool result bloats the context.

---

## cost optimization strategies

### model switching

the biggest lever you have. use `/model` mid-session:

```
/model haiku     # lookups, file reads, simple questions
/model sonnet    # implementation, refactoring, most work
/model opus      # architecture, complex multi-file design
```

haiku is 19x cheaper than sonnet on input. sonnet is 5x cheaper than opus. match the model to the task, not the session.

### session hygiene

start fresh sessions for new tasks. dont let context bloat by doing 5 unrelated things in one session. a clean context window is cheaper than a bloated one, even accounting for the startup cost of a new session.

### prompt caching

CLAUDE.md content over 4,096 tokens gets cached. subsequent turns read from cache at 90% discount. this means a well-written CLAUDE.md actually *saves* money -- you pay to cache it once, then get 90% off on every turn for the rest of the session.

how to hit the minimum:
- substantive CLAUDE.md with project structure, conventions, examples
- `@path` imports pulling in additional context files
- tools and MCP server definitions count toward cached content

measure your cache hit rate with `/sift cache efficiency` (requires miner). above 60% is good, above 80% is excellent.

### targeted file reads

tell claude which file to look at instead of "find the bug." compare:

| prompt | cost |
|---|---|
| "find the bug in the auth module" | claude reads 15 files, greps 20 patterns |
| "the bug is in src/auth/token.ts around line 140" | claude reads 1 file |

targeted reads can be 10-20x cheaper than exploratory ones.

### the scout pattern

send haiku to explore, sonnet to implement. haiku reads 30 files for pennies. sonnet reads the 4 files that matter. see [subagent-patterns.md](./subagent-patterns.md) for the full pattern.

### compact strategically

`/compact` when context is bloated but you want to continue the session. good triggers:
- you've been working for 20+ turns and the topic is shifting
- you just finished a subtask and are starting a new one
- you notice claude repeating itself or losing track of earlier context

dont compact after every 5 turns -- the compaction itself costs a full round trip.

---

## tracking costs with miner

the [miner plugin](../plugins/miner/) logs every session to sqlite at `~/.claude/miner.db`. it tracks input tokens, output tokens, cache creation, and cache read -- per session, per model, per project.

### quick commands

| command | what it shows |
|---|---|
| `/ledger` | daily dashboard -- sessions, tokens, cost, tools |
| `/stats` | project health snapshot |
| `/sift cost this month` | monthly spend breakdown |
| `/sift cache efficiency` | cache hit rate analysis |

### cost queries

**how much did i spend this week?**

```sql
sqlite3 ~/.claude/miner.db "SELECT printf('\$%,.2f', SUM(estimated_cost_usd)) FROM session_costs WHERE start_time >= date('now', '-7 days');"
```

**whats my average cost per session?**

```sql
sqlite3 ~/.claude/miner.db "SELECT printf('\$%,.2f', AVG(estimated_cost_usd)) FROM session_costs WHERE start_time >= date('now', '-30 days');"
```

**which model am i using most?**

```sql
sqlite3 ~/.claude/miner.db "SELECT model, COUNT(*) as sessions, printf('\$%,.2f', SUM(estimated_cost_usd)) as cost FROM session_costs WHERE start_time >= date('now', '-30 days') GROUP BY model ORDER BY cost DESC;"
```

**daily spend trend:**

```sql
sqlite3 ~/.claude/miner.db "SELECT date, printf('\$%,.2f', estimated_cost_usd) as cost FROM daily_costs WHERE date >= date('now', '-14 days');"
```

**cost by project:**

```sql
sqlite3 ~/.claude/miner.db "SELECT project_name, printf('\$%,.2f', estimated_cost_usd) as cost FROM project_costs ORDER BY estimated_cost_usd DESC LIMIT 10;"
```

miner also exposes convenience views: `session_costs`, `project_costs`, `daily_costs`, and `tool_usage`. see the [miner README](../plugins/miner/) for the full schema.

---

## real cost benchmarks

ballpark estimates at API pricing. actual costs vary with context size, tool call count, and cache hit rate.

| task | model | duration | estimated cost |
|---|---|---|---|
| simple bug fix | sonnet | ~10 min | $0.30-0.80 |
| feature implementation | sonnet | ~30 min | $1-3 |
| large refactor | sonnet + subagents | ~1 hr | $5-15 |
| architecture session | opus | ~30 min | $5-20 |
| agent team (3 teammates) | sonnet | ~30 min | $10-30 |

the wide ranges are real -- a 30-minute sonnet session that stays focused costs $1. the same 30 minutes with unfocused exploration, large file reads, and no caching costs $3. context discipline matters.

---

## the 80/20 rule

sonnet handles 80% of work. haiku handles 15%. opus handles 5%.

thats not a suggestion -- its what cost-effective usage actually looks like. if your opus usage is above 10%, you're probably overspending. opus is for architecture decisions, complex multi-file design, and situations where sonnet genuinely cant handle the reasoning. its not for writing CRUD endpoints.

check your model mix:

```sql
sqlite3 ~/.claude/miner.db "SELECT model, COUNT(*) as sessions, printf('%.0f%%', COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sessions WHERE start_time >= date('now', '-30 days'))) as pct FROM sessions WHERE start_time >= date('now', '-30 days') GROUP BY model ORDER BY sessions DESC;"
```

---

## budget tips for teams

**set spending limits.** claude code settings support monthly spend caps. set them before someone discovers opus for the first time.

**restrict opus via managed policies.** if you're managing a team, use organization policies to limit opus access to senior engineers or specific use cases. most team members dont need it.

**monitor with miner.** the miner plugin works per-machine, but the sqlite database can be aggregated across team members for org-wide visibility. set up a cron job that ships `~/.claude/miner.db` snapshots to a shared location.

**establish model guidelines in CLAUDE.md.** add something like:

```markdown
## model usage
- default: sonnet for all implementation work
- haiku: lookups, file reads, scouting subagents
- opus: architecture decisions only, requires justification
```

this gets cached into every session and nudges the right behavior from the start.

> [usage controls docs](https://docs.anthropic.com/en/docs/claude-code/manage-costs)

---

*for deeper cost tracking, see the [miner plugin](../plugins/miner/). for model-switching patterns with subagents, see [subagent-patterns.md](./subagent-patterns.md). for the full cost overview in the guide, see [section 24](./guide.md#24-cost-optimization----real-numbers).*
