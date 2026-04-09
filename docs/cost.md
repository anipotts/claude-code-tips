<!-- tested with: claude code v2.1.94 -->

# cost

what claude code actually costs, how caching saves 81% of it, and the strategies that keep my bill sane.

---

## my real numbers

most cost discussions are vibes. "it's expensive" or "it's worth it" without data. here are mine.

### what i pay

**$200/mo.** Max plan. flat rate. no per-token billing. no surprises.

that $200 covers everything — hundreds of sessions, thousands of subagent spawns. run `/mine` to see your own numbers.

### what your plan costs

| plan | monthly | how billing works |
|------|---------|------------------|
| pro | $20 | flat rate, rate-limited. you'll hit limits with heavy use. |
| max | $200 | flat rate, no rate limits in practice. what i use. |
| API (pay-per-use) | variable | billed per token. caching saves ~87% on input costs. |

on pro or max, **you don't pay per token.** the mine.db cost estimates are hypothetical — they show what your usage would cost at API list prices, not what you actually pay.

### why caching still matters on a flat plan

even though you don't pay per token, caching affects:
- **speed** — cached prefixes return faster (less compute to process)
- **rate limits** — fewer tokens consumed per turn = more headroom before throttling
- **context quality** — stable CLAUDE.md = stable cache prefix = consistent behavior

my cache hit rate is 95% overall (83% for short sessions, 96% for long ones).

caching is everything. Thariq Shuja (creator of claude code) put it best: put static content first, don't change CLAUDE.md often. the cache hit rate is the single biggest lever on your bill.

---

## how billing works

every claude code interaction is an API call. you send tokens in (prompt + conversation history + tool results), you get tokens out (claude's response).

**the context window fills up over a session.** turn 1 sends 5K tokens. turn 20 sends 150K+ bc the entire conversation history is re-sent. long sessions get expensive fast -- it's the accumulated context, not individual prompts.

**every tool call adds tokens.** reading a 10K line file dumps thousands of tokens into the window. those persist for the rest of the session.

**prompt caching helps.** content that stays the same across turns (CLAUDE.md, tool definitions, system prompt) gets cached at 90% discount. but only if the cached content exceeds 4,096 tokens.

**compaction resets context -- but costs tokens itself.** `/compact` summarizes your conversation. reduces future turn costs but the compaction is a full round trip. use it strategically.

---

## model pricing (march 2026)

| model | input (per M) | output (per M) | cache read | cache write |
|---|---|---|---|---|
| haiku 4.5 | $1.00 | $5.00 | $0.10 | $1.25 |
| sonnet 4.6 | $3.00 | $15.00 | $0.30 | $3.75 |
| opus 4.6 | $5.00 | $25.00 | $0.50 | $6.25 |

> [current pricing](https://docs.anthropic.com/en/docs/about-claude/models)

---

## what actually costs money

ranked by impact:

**1. long sessions.** the number one cost driver. by turn 30, every message sends 100K+ tokens of context. a 1-hour session can cost 10-50x what five 12-minute sessions cost for the same work.

**2. opus usage.** ~1.7x sonnet on both input and output. a 30-minute opus session costs what a longer sonnet session costs.

**3. subagents and agent teams.** each subagent has its own context window. three subagents = three billing streams in parallel.

**4. large file reads.** reading a 10K line file eats thousands of tokens that persist for the rest of the session. reading 5 files you don't need is like leaving lights on in rooms you never enter.

**5. unfocused tool calls.** grepping the entire project when you know the file. every unnecessary tool result bloats the context.

---

## cost optimization strategies

### model switching -- the biggest lever

```
/model haiku     # lookups, file reads, simple questions
/model sonnet    # implementation, refactoring, most work
/model opus      # architecture, complex multi-file design
```

haiku is 3x cheaper than sonnet. sonnet is ~2x cheaper than opus. match the model to the task, not the session.

### the 80/20 rule

sonnet handles 80% of work. haiku handles 15%. opus handles 5%. if your opus usage is above 10%, you're probably overspending. opus is for architecture decisions and complex multi-file design -- not writing CRUD endpoints.

### session hygiene

start fresh sessions for new tasks. don't let context bloat by doing 5 unrelated things in one session. a clean context window is cheaper than a bloated one.

### prompt caching

a well-written CLAUDE.md actually *saves* money -- you pay to cache it once, then get 90% off on every turn. keep it comprehensive but stable. don't change it every session.

### targeted file reads

| prompt | cost |
|---|---|
| "find the bug in the auth module" | claude reads 15 files, greps 20 patterns |
| "the bug is in src/auth/token.ts around line 140" | claude reads 1 file |

targeted reads can be 10-20x cheaper than exploratory ones.

### the scout pattern

send haiku to explore, sonnet to implement. haiku reads 30 files for pennies. sonnet reads the 4 that matter. see [agents.md](./agents.md) for the full pattern.

### compact strategically

`/compact` when context is bloated but you want to continue. good triggers:
- 20+ turns and topic is shifting
- just finished a subtask, starting a new one
- claude is repeating itself or losing track

don't compact every 5 turns -- the compaction itself costs a full round trip.

---

## the burn hook

the mine plugin includes a cost anomaly detector that fires on PreCompact. it compares current session token usage against project averages and warns if you're burning more than usual.

```
burn: this session used ~3.2x your average token count.
      avg: 45k tokens, this session: 144k tokens.
      consider breaking large tasks into smaller sessions.
```

it doesn't block anything. just awareness. knowing you're on an expensive session lets you decide whether to continue or split the work.

---

## tracking costs with mine

the mine plugin logs every session to sqlite at `~/.claude/mine.db`. tracks input tokens, output tokens, cache creation, cache read -- per session, per model, per project.

```
/mine                          # daily dashboard
/mine intent: cost this month  # monthly spend breakdown
/mine intent: cache efficiency  # cache hit rate analysis
```

---

## real cost benchmarks

| task | model | duration | estimated cost |
|---|---|---|---|
| simple bug fix | sonnet | ~10 min | $0.30-0.80 |
| feature implementation | sonnet | ~30 min | $1-3 |
| large refactor | sonnet + subagents | ~1 hr | $5-15 |
| architecture session | opus | ~30 min | $5-20 |
| agent team (3 teammates) | sonnet | ~30 min | $10-30 |

the wide ranges are real -- a focused 30-minute session costs $1. the same 30 minutes with unfocused exploration costs $3. context discipline matters.

### is the max plan worth it?

yes. $200/mo flat vs ~$12K worth of API compute. if you're running 5+ sessions/day, max pays for itself immediately.

i've never hit a rate limit on max. on pro, i'd have been throttled in the first week.

---

## further reading

- [mine plugin](https://github.com/anipotts/mine) -- burn feature, cost tracking, usage analysis
- [agents](./agents.md) -- cost considerations for agent teams
- [official pricing](https://docs.anthropic.com/en/docs/about-claude/models) -- current model pricing
