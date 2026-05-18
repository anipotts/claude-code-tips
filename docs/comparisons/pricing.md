<!-- tested with: claude code v2.1.122 -->

# AI coding tool pricing matrix

> last verified: 2026-05-18 | sources: [claude.ai plans](https://claude.com/pricing), [cursor pricing](https://cursor.com/pricing), [github copilot pricing](https://github.com/features/copilot/pricing), [gemini subscriptions](https://gemini.google/subscriptions/), [antigravity](https://antigravity.google/pricing)

---

## subscription pricing

| tool | free | entry | mid-tier | heavy use | teams |
|------|------|-------|----------|-----------|-------|
| claude code | limited | $20/mo (Pro) | $100/mo (Max 5x) | $200/mo (Max 20x) | enterprise (API) |
| cursor | limited (2-week trial) | $20/mo (Pro) | $60/mo (Pro+) | $200/mo (Ultra) | $40/user/mo |
| copilot | $0 | $10/mo (Pro) | $39/mo (Pro+) | -- | custom (enterprise) | <!-- updated 2026-05-18 -->
| gemini | generous (60 req/min) | $19.99/mo (AI Pro) | -- | $249.99/mo (AI Ultra) | Vertex AI / GCP pricing |
| antigravity | free (public preview) | $0 (preview) | -- | custom (enterprise) | custom |

---



> note: antigravity pricing marked as TBD. verify current status at antigravity.google/pricing before recommending to users.

## what each tier actually includes

### free tiers

| tool | what you get | verdict |
|------|-------------|---------|
| claude code | limited requests, rate-throttled | evaluation only |
| cursor | 2-week pro trial, 2000 completions, 50 slow requests | trial, not sustained use |
| copilot | 50 agent requests/mo, 2000 completions/mo, access to Haiku 4.5, GPT-5 mini | real daily usage (best free tier) | <!-- updated 2026-05-18 -->
| gemini | 60 req/min, 1000 req/day, no credit card | real daily usage |
| antigravity | free during public preview, weekly quotas, multi-model access | real daily usage (best free tier) |

**winner**: copilot. 50 agent requests/mo plus 2000 completions is practical daily usage. antigravity matches with multi-model access. gemini is second with 1000 requests/day on its own models.

### $15-20/mo tier

| tool | plan | what you get |
|------|------|-------------|
| claude code | Pro ($20) | full claude code access, all models, rate-limited |
| cursor | Pro ($20) | unlimited completions, 500 fast premium requests, credit pool |
| copilot | Pro ($10) | 300 premium requests/mo, unlimited agent mode with GPT-5 mini, Claude/Codex on GitHub and VS Code | <!-- updated 2026-05-18 -->
| gemini | AI Pro ($19.99) | higher limits, workspace AI, 2TB storage |
| antigravity | $0 (preview) | free access to frontier models, weekly quotas |

**winner**: depends on workflow. cursor gives you tab completion + chat + agent. claude code gives you terminal agent + extensibility. copilot gives you IDE-integrated agents and code review at $10/mo. gemini gives you cloud storage and workspace integration. antigravity is still free (preview).

### $100-200/mo tier

| tool | plan | what you get |
|------|------|-------------|
| claude code | Max 5x ($100) / Max 20x ($200) | 5x or 20x Pro rate limits, max priority |
| cursor | Pro+ ($60) / Ultra ($200) | larger credit pools, higher rate limits |
| copilot | Pro+ ($39) / enterprise (custom) | 5x premium requests vs Pro, access to all models (Claude Opus 4.7, etc), GitHub Spark | <!-- updated 2026-05-18 -->
| gemini | AI Ultra ($249.99) | highest-tier models, all google AI features |
| antigravity | $0 (preview) / custom (enterprise) | free access continues, enterprise pricing TBD |

**winner for individuals**: claude code Max 5x at $100/mo hits a sweet spot -- 5x the throughput of Pro for real power users. cursor's Pro+ at $60/mo is strong for IDE users. copilot's Pro+ at $39/mo undercuts both for extended access but is lower throughput.

---

## what you actually pay per session

subscription pricing tells you the monthly bill. but effective cost depends on how much you use the tool.

### claude code session economics

session cost varies widely based on model, duration, and cache efficiency -- use `/lore` to see your actual per-session costs. on the $20/mo Pro plan, even moderate usage typically exceeds the subscription cost in raw API value. on Max 20x at $200/mo, anthropic is subsidizing heavy users -- a full day of opus sessions can exceed $200 in raw API costs.

the lore plugin in this repo tracks actual per-session costs, so you can measure this precisely.

### cursor session economics

cursor's credit system makes this harder to calculate. a Pro user gets $20 worth of credits. using claude opus burns credits faster than cursor-small. heavy cursor users report running out of credits mid-month and needing to upgrade or switch to slower models.

### codex session economics

ChatGPT Plus at $20/mo includes codex with rate limits. heavy users report hitting limits during sustained coding sessions and needing to wait or upgrade to Pro at $200/mo. the jump from $20 to $200 with no middle tier is steep.

### gemini session economics

the free tier is generous enough that many developers never need to pay. 1000 requests/day is hard to exhaust in normal use. if you do need more, API key access with pay-per-token is available as an alternative to subscription.

### antigravity session economics

currently free during public preview. weekly quotas limit heavy usage but most developers won't hit them. when google announces post-preview pricing, session economics will depend on the pricing model they choose. google AI Pro/Ultra subscribers get priority access and higher quotas.

---

## hidden costs and gotchas

### claude code
- opus is 5x the cost of sonnet. switching to opus mid-session for "just one question" can spike costs
- long sessions (30+ turns) accumulate context that increases per-turn cost even with caching
- subagents multiply billing -- each runs its own context window

### cursor
- credit system makes costs unpredictable -- depends on model mix
- running out of credits mid-month forces model downgrades or upgrade
- annual billing saves 20% but locks you in

### codex
- no middle tier between $20 and $200 -- the jump is 10x
- API key usage has separate pricing from ChatGPT subscription
- cloud agent execution time counts against limits

### gemini
- AI Ultra at $249.99/mo is the most expensive individual tier across all tools
- google ecosystem lock-in -- Vertex AI auth, GCP integration create switching costs
- free tier limits may tighten as adoption grows

### antigravity
- public preview pricing will change -- google hasn't committed to free forever
- weekly quotas throttle heavy users during preview
- post-preview pricing model is unknown -- could be subscription, credits, or usage-based

---

## recommendation by budget

### note on competitor activity (may 2026)

**github copilot pricing restructured**: free tier now $0 (was limited trial), pro dropped from $20 to $10/mo, pro+ added at $39/mo. major price reduction across entry tiers. gemini-cli active development continues. no pricing changes detected for cursor, gemini, or antigravity. claude code remains the dominant terminal agent for cost-conscious teams.

### $0/mo (free)
use antigravity (free preview, includes frontier models) as your primary tool. supplement with gemini free tier for terminal workflows.

### $15-20/mo
**if terminal-first**: claude code Pro ($20)
**if IDE-first**: cursor Pro ($20) or copilot Pro ($10) or antigravity (still free) <!-- updated 2026-05-18 -->
**if you want github integration**: copilot Pro ($10)

### $60-100/mo
**power user**: claude code Max 5x ($100) -- best value at this tier
**IDE power user**: cursor Pro+ ($60)

### $200/mo
**claude code Max 20x**: best for developers who live in claude code all day
**cursor Ultra**: best for developers who live in cursor all day
**ChatGPT Pro**: best for openai ecosystem access beyond just coding

### $200+/mo
if you're spending this much, you should be tracking per-session costs. use the [lore plugin](../../plugins/lore/) to measure actual usage and optimize model selection.

> individual comparison docs: [codex](codex.md) | [cursor](cursor.md) | [gemini](gemini.md) | [antigravity](antigravity.md)
