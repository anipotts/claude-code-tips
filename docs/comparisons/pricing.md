<!-- tested with: claude code v2.1.122 -->

# AI coding tool pricing matrix

> last verified: 2026-04-09 | updated: 2026-06-25 (github copilot added) | sources: [claude.ai plans](https://claude.com/pricing), [cursor pricing](https://cursor.com/pricing), [github copilot pricing](https://github.com/features/copilot/pricing), [codex pricing](https://developers.openai.com/codex/pricing/), [gemini subscriptions](https://gemini.google/subscriptions/), [antigravity](https://antigravity.google/pricing)

---

## subscription pricing

| tool | free tier | $10-20/mo | $39-60/mo | $100-200/mo | enterprise |
|------|-----------|-----------|-----------|------------|-----------|
| claude code | limited usage | Pro ($20) | Max 5x ($100) | Max 20x ($200) | API-based |
| cursor | 2-week trial, 2000 completions | Pro ($20) | Pro+ ($60) | Ultra ($200) | custom |
| copilot | Free ($0, 2k completions) | Pro ($10) | Pro+ ($39) | Max ($100) | custom |
| codex | limited | ChatGPT Plus ($20) | -- | ChatGPT Pro ($200) | -- |
| gemini | 60 req/min, 1k req/day | AI Pro ($19.99) | -- | AI Ultra ($249.99) | custom |
| antigravity | free (public preview -- verify current status) | pricing TBD (contact sales) | -- | custom (enterprise) | custom |

## what each tier actually includes

### free tiers

| tool | what you get | verdict |
|------|-------------|---------|
| claude code | limited requests, rate-throttled | evaluation only |
| cursor | 2-week pro trial, 2000 completions, 50 slow requests | trial, not sustained use |
| copilot | 2000 completions/month, haiku 4.5, GPT-5 mini | real daily usage |
| codex | limited codex access (temporary offer) | trial |
| gemini | 60 req/min, 1000 req/day, no credit card | real daily usage |
| antigravity | free during public preview, weekly quotas, multi-model access | real daily usage (best free tier) |

**winner**: antigravity. free access to gemini 3.1 pro, claude opus/sonnet, and GPT-OSS 120B during public preview. copilot free tier is solid -- 2000 completions/month is substantial for light use.

### $15-20/mo tier

| tool | plan | what you get |
|------|------|-------------|
| claude code | Pro ($20) | full claude code access, all models, rate-limited |
| cursor | Pro ($20) | unlimited completions, 500 fast premium requests, credit pool |
| copilot | Pro ($10) | unlimited completions, cloud agent, code review, 3rd party agents, $15 credits |
| codex | ChatGPT Plus ($20) | codex access, GPT-4o, web browsing, plugins |
| gemini | AI Pro ($19.99) | higher limits, workspace AI, 2TB storage |
| antigravity | $0 (preview) | free access to frontier models, weekly quotas |

**winner**: copilot Pro at $10/mo is the best value at this tier -- unlimited completions, cloud agent, and model selection for the lowest price. cursor Pro and claude code Pro are comparable depending on workflow preference.

### $100-200/mo tier

| tool | plan | what you get |
|------|------|-------------|
| claude code | Max 5x ($100) / Max 20x ($200) | 5x or 20x Pro rate limits, max priority |
| cursor | Pro+ ($60) / Ultra ($200) | larger credit pools, higher rate limits |
| copilot | Pro+ ($39) / Max ($100) | Pro+ adds opus/premium models + audit logs + 4x usage; Max adds priority access + 2.9x+ usage |
| codex | ChatGPT Pro ($200) | 2x codex limits, o3-pro, GPT-5, all openai models |
| gemini | AI Ultra ($249.99) | highest-tier models, all google AI features |
| antigravity | $0 (preview) / custom (enterprise) | free access continues, enterprise pricing TBD |

**winner for individuals**: copilot Max at $100/mo offers model selection + priority access, a middle ground between copilot Pro+ ($39) and claude code Max 5x ($100). claude code Max 5x still best for pure throughput.

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

### note on competitor activity (march 2026)

openai codex continues alpha releases (0.115.0-alpha.15-17) but no stable version bumps. gemini-cli active development with oauth2 and headless fixes. no pricing changes detected across codex, gemini, or antigravity. claude code remains the dominant terminal agent for cost-conscious teams.

### $0/mo (free)
use antigravity (free preview, includes frontier models) as your primary tool. supplement with gemini free tier for terminal workflows.

### $15-20/mo
**if terminal-first**: claude code Pro ($20)
**if IDE-first**: cursor Pro ($20), copilot Pro ($10), or antigravity (still free)
**best value at this tier**: copilot Pro ($10)
**if you want everything openai**: ChatGPT Plus ($20)

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
