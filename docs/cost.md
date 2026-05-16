<!-- tested with: claude code v2.1.122 -->

# cost

what claude code actually costs, how caching saves 81% of it, and the strategies that keep my bill sane.

---

## my real numbers

most cost discussions are vibes. "it's expensive" or "it's worth it" without data. here are mine.

### monitor changes to background process cost

prior to monitor (v<2.1.98), watching background processes required `/loop` polling -- full API calls on a timer, expensive when idle. monitor (v2.1.98+) is event-driven: the script runs continuously, tokens consumed only when output matches a filter. idle monitoring costs zero tokens.

if you're on v2.1.98+, use monitor instead of `/loop` for all long-running process watching (test runners, dev servers, deploy status). it reduces cost by ~90% on idle processes.

### note on monitoring

the `/monitor` tool (v2.1.98+) changes cost dynamics for long-running background processes. stream filters and poll filters emit events only when conditions are met, not on a schedule. idle monitoring costs zero tokens. this reduces the cost of watching test runners, build processes, and deploy status checks compared to `/loop` polling.

monitor is now a stable feature (v2.1.98+) and is the preferred method for long-running background process watching. it replaces the earlier `/loop` polling pattern for most use cases.

### what i pay

**$200/mo.** Max plan. flat rate. no per-token billing. no surprises.

that $200 covers everything. hundreds of sessions, thousands of subagent spawns. run `/lore` to see your own numbers.

### what your plan costs

| plan | monthly | how billing works |
|------|---------|------------------|
| pro | $20 | flat rate, rate-limited. you'll hit limits with heavy use. |
| max | $200 | flat rate, 20x Pro limits. generous enough that most users won't hit them. |
| API (pay-per-use) | variable | billed per token. caching saves ~87% on input costs. |

on pro or max, **you don't pay per token.** the lore.db cost estimates are hypothetical: they show what your usage would cost at API list prices, not what you actually pay. legacy `~/.claude/mine.db` is auto-migrated by lore on first run.

### why caching still matters on a flat plan

even though you don't pay per token, caching affects:
- **speed**: cached prefixes return faster (less compute to process)
- **rate limits**: fewer tokens consumed per turn = more headroom before throttling
- **context quality**: stable CLAUDE.md = stable cache prefix = consistent behavior

my cache hit rate is 95% overall (83% for short sessions, 96% for long ones).

caching is everything. Thariq Shuja (creator of claude code) put it best: put static content first, don't change CLAUDE.md often. the cache hit rate is the single biggest lever on your bill.

---

## how billing works

every claude code interaction is an API call. you send tokens in (prompt + conversation history + tool results), you get tokens out (claude's response).

**the context window fills up over a session.** turn 1 sends 5K tokens. turn 20 sends 150K+ bc the entire conversation history is re-sent. long sessions get expensive fast -- it's the accumulated context, not individual prompts.

**every tool call adds tokens.** reading a 10K line file dumps thousands of tokens into the window. those persist for the rest of the session.

**prompt caching helps.** content that stays the same across turns (CLAUDE.md, tool definitions, system prompt) gets cached at 90% discount. minimum cacheable size varies by model: 2,048 tokens for Sonnet 4.6, 4,096 tokens for Opus 4.6 and Haiku 4.5.

**compaction resets context -- but costs tokens itself.** `/compact` summarizes your conversation. reduces future turn costs but the compaction is a full round trip. use it strategically.

---



### bedrock and service tiers (v2.1.122+)

if you're using anthropic bedrock, set `ANTHROPIC_BEDROCK_SERVICE_TIER` to control priority:
- `default` -- standard rate limits
- `flex` -- flexible capacity, lower cost
- `priority` -- guaranteed capacity, higher cost

this env var is sent as `X-Amzn-Bedrock-Service-Tier` header on all requests. on subscription plans, tier choice doesn't affect your monthly bill but does affect throughput and latency.

## model pricing (march 2026)

## model pricing (may 2026)

> **always reference [anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/models) for current rates.** this snapshot goes stale fast. last verified may 2026 (claude code v2.1.140). anthropic updates pricing regularly -- check official docs before recommending rates to users.

## model pricing

> **always reference [anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/models) for current rates.** last verified may 13 2026 (claude code v2.1.140). anthropic updates pricing regularly.

## model pricing

> **always reference [anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/models) for current rates.** this repo's prices snapshot frequently and go stale. last verified may 2026 but anthropic updates pricing regularly.

## model pricing (may 2026)

> [current pricing](https://docs.anthropic.com/en/docs/about-claude/models) - last verified may 2026, may have changed. check official pricing for v2.1.122+ rates.

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

the lore plugin includes a cost anomaly detector that fires on PreCompact. it compares current session token usage against project averages and warns if you're burning more than usual.

```
burn: this session used ~3.2x your average token count.
      avg: 45k tokens, this session: 144k tokens.
      consider breaking large tasks into smaller sessions.
```

it doesn't block anything. just awareness. knowing you're on an expensive session lets you decide whether to continue or split the work.

---

## tracking costs with lore

the lore plugin logs every session to sqlite at `~/.claude/lore/lore.db`. tracks input tokens, output tokens, cache creation, cache read -- per session, per model, per project.

```
/lore                          # daily dashboard
/lore intent: cost this month  # monthly spend breakdown
/lore intent: cache efficiency # cache hit rate analysis
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

- [lore plugin](../plugins/lore/) -- burn feature, cost tracking, usage analysis, knowledge graph
- [agents](./agents.md) -- cost considerations for agent teams
- [official pricing](https://docs.anthropic.com/en/docs/about-claude/models) -- current model pricing

---

> pricing last verified april 2026 against [official anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/models). rates may have changed since publication. run `claude --version` to confirm your installed version.

---

### session resumption improvements (v2.1.132+)

v2.1.132 fixed `--resume` failing when emoji splits in tool error truncation and now sanitizes pre-corrupted sessions on load. this means longer sessions with more tool errors are now more reliable to resume, reducing context loss on recovery.
