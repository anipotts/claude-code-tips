# monetization + distribution research — march 2026

research date: 2026-03-15. all pricing/links verified via web search.

---

## 1. plugin distribution channels

### 1a. claude code official marketplace

**submission process**: use the in-app form at `platform.claude.com/plugins/submit` or through the Console. anthropic performs automated review, then optionally manual review for the "Anthropic Verified" badge.

**what gets reviewed**: quality, security, functionality. verified badge = extra manual review from anthropic's team.

**official directory repo**: [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — the canonical list anthropic manages.

**your current status**: you already have a properly formatted `marketplace.json` at repo root AND `.claude-plugin/marketplace.json`. you're structured correctly for submission.

**action items**:
1. submit mine plugin via `platform.claude.com/plugins/submit`
2. aim for "Anthropic Verified" — your test coverage + hook safety patterns make a strong case
3. apply to be listed in anthropics/claude-plugins-official

### 1b. self-hosted marketplace (already done)

your repo IS a marketplace. anyone can run:
```
/plugin marketplace add anipotts/claude-code-tips
```
this is the decentralized model — no approval needed. you own distribution.

### 1c. community marketplaces / awesome lists

| marketplace | url | status |
|---|---|---|
| ccplugins/awesome-claude-code-plugins | github | submit PR |
| hesreallyhim/awesome-claude-code | github | submit PR |
| ComposioHQ/awesome-claude-plugins | github | submit PR |
| ananddtyagi/cc-marketplace | github | submit PR |
| claudemarketplaces.com | web directory | submit listing |
| buildwithclaude.com | web directory | submit listing |

**ecosystem size**: 9,000+ plugins exist as of feb 2026. the marketplace is npm-like and decentralized — anyone can host one.

### 1d. npm / pip / github marketplace

**npm**: not relevant for claude code plugins. plugins install via `plugin add`, not npm. the `@anthropic-ai/claude-code` npm package is claude code itself (and deprecated in favor of native installer).

**pip**: not relevant.

**github marketplace**: not relevant for claude code plugins. github marketplace is for github actions/apps, not claude extensions.

**verdict**: stick with claude's native plugin system + self-hosted marketplace. the others are dead ends.

### 1e. direct install

always works, always will:
```
git clone https://github.com/anipotts/claude-code-tips
```
plus your repo serves as both plugin source and marketplace — clean setup.

---

## 2. course platform comparison

### hosted platforms

| platform | monthly cost | transaction fee | total take on $79 sale | best for |
|---|---|---|---|---|
| **gumroad** | $0 | 10% | $7.90 + payment processing | simplest start, worst economics |
| **lemon squeezy** | $0 | 5% + $0.50 | $4.45 | developer-friendly, handles global tax (MoR) |
| **polar.sh** | $0 | 4% + $0.40 | $3.56 | built for devs, open source, cheapest MoR |
| **podia** | $33/mo free plan: 5% | 5% on free, 0% on paid | $3.95 (free) or $33/mo flat | courses + community |
| **teachable** | $0-159/mo | 10% free, 5% basic, 0% pro | varies wildly | established, clunky |
| **kajabi** | $149-399/mo | 0% | $0 + monthly overhead | overkill for this |

### self-hosted options

| stack | cost | effort | best for |
|---|---|---|---|
| **astro + polar.sh** | hosting only (~$0-20/mo) | medium | content-first site with dev-native payments |
| **astro + lemon squeezy** | hosting only | medium | same, slightly more payment features |
| **next.js + stripe** | hosting + stripe fees (2.9% + $0.30) | high | maximum control, you handle tax |
| **robin wieruch model** (custom) | hosting only | very high | josh comeau style — custom platform |

### recommendation: polar.sh (payments) + astro (site)

**why polar.sh**:
- 4% + $0.40 = cheapest MoR option (handles all global tax compliance)
- built specifically for developers selling to developers
- open source themselves — philosophical alignment
- supports one-time purchases, subscriptions, and usage billing
- github integration for gated repo access (useful for pro/cohort tiers)
- 20% cheaper than lemon squeezy

**why astro**:
- ships zero JS by default (fast course pages)
- MDX support (you already write markdown — natural fit)
- your existing docs are markdown — migrate trivially
- cloudflare acquired astro's hosting partner — strong ecosystem
- SSR when needed for auth/payments, static for content

**fallback if you want zero dev work**: lemon squeezy standalone. no site needed, just product pages. launch in a day.

---

## 3. pricing research

### comparable AI tool courses (march 2026)

| course | price | model | audience |
|---|---|---|---|
| cursor courses (various) | $29-149 | one-time | cursor users |
| copilot mastery courses | $39-99 | one-time | github users |
| josh comeau CSS-for-JS | $149-399 | tiered (base/ultimate) | JS devs |
| wes bos courses | $89-139 | one-time, PPP | web devs |
| kent c dodds epicreact | $299-599 | tiered | react devs |
| frontend masters | $39/mo | subscription | all devs |

### your planned tiers — validation + adjustments

| tier | your plan | market validation | adjustment |
|---|---|---|---|
| **free** (7 lessons) | $0 | strong — wes bos + josh comeau both use free content as funnel. wes's free JS30 has 682K enrollments | keep. this IS the funnel |
| **core** | $49-79 | $49 is sweet spot. $79 feels high vs cursor courses at $29-149. the mine plugin alone doesn't justify $79 without video | **$49** one-time. anchor here |
| **pro** | $149-199 | matches josh comeau's base tier. justified IF it includes video, interactive content, templates | **$149** one-time. needs clear differentiation from core |
| **cohort** | $499+ | reasonable for live cohort. corporate training runs $500-3,500/seat. pair programming rates are $100-200/hr = 3-5 hrs of consulting value | **$499** for cohort. offer enterprise at $999/seat for teams of 5+ |

### purchasing power parity — yes, offer it

**why**: wes bos does it. josh comeau implied it. it works.
- generates 10-20% additional revenue from customers who'd otherwise never buy
- one implementation generated $10K+ additional revenue across two launches
- discounts: 25-75% based on country

**implementation**: use [paritykit.com](https://www.paritykit.com/) — 5 min setup, connects to your payment provider, one line of code. or polar.sh may support location-based discounts natively.

### team/enterprise licensing

| tier | price | includes |
|---|---|---|
| team (5 seats) | $199 | core course + mine plugin setup for team |
| team (10 seats) | $349 | core + pro courses + slack support |
| enterprise (25+ seats) | $99/seat | all courses + 2hr kickoff call + custom mine dashboard |
| corporate training | $3,000-5,000/day | on-site or virtual, full-day workshop |

corporate training benchmark: AI training services price $50-100/developer for self-paced, $500-3,500/seat for instructor-led. your $99/seat enterprise tier is well within range.

---

## 4. revenue diversification

### 4a. github sponsors

**structure**: up to 10 monthly tiers + 10 one-time tiers.

recommended tiers:

| tier | price | perk |
|---|---|---|
| supporter | $5/mo | name in README, sponsor badge |
| user | $15/mo | early access to new plugins + docs |
| power user | $29/mo | private discord channel, priority bug fixes |
| team | $99/mo | private repo access for team-specific configs |
| enterprise | $299/mo | monthly 30-min call, custom hook development |

**key tactic**: gate a private repo per tier. github sponsors handles access automatically — adds on sponsor, removes on cancel.

**realistic revenue**: for a niche this size, $200-800/mo from sponsors is realistic early on. grows with course audience.

### 4b. consulting / pair programming

**market rates**: claude code freelancers charge $100-200/hr (550-900 EUR/day in EU markets).

recommended offerings:

| service | price | scope |
|---|---|---|
| claude code audit | $500 | 2hr async review of team's claude code setup, written report |
| pair programming session | $200/hr | live 1:1 optimization of workflows, hooks, CLAUDE.md |
| team workshop (half-day) | $2,000 | 4hr hands-on for 5-15 devs |
| full-day workshop | $4,000 | 8hr deep dive, custom plugin development |
| retainer | $2,000/mo | 4hrs/mo of async support + quarterly review |

### 4c. anthropic partnership

**claude partner network**: anthropic committed $100M to this in 2026. it's designed for organizations helping enterprises adopt claude.

- membership is FREE
- partners get: training, technical support, joint market development, co-marketing
- anthropic is scaling partner-facing team 5x
- first certification: "Claude Certified Architect, Foundations"
- anchor partners: accenture, deloitte, cognizant, infosys

**your angle**: you're not accenture, but the network is open to "any organization bringing claude to market." your plugin + course + consulting package could qualify as an independent training partner. worth applying.

**no traditional affiliate program found** — anthropic doesn't appear to offer commission-based referral fees for claude signups. the partner network is the closest thing.

### 4d. revenue model summary

| stream | year 1 estimate | year 2 estimate | effort |
|---|---|---|---|
| course sales (free -> core -> pro) | $5K-15K | $20K-50K | high upfront, passive after |
| cohort (2x/year) | $5K-10K | $15K-25K | high per cohort |
| github sponsors | $2K-5K | $5K-10K | low — builds with audience |
| consulting | $5K-20K | $10K-30K | trades time for money |
| corporate training | $0-10K | $10K-30K | high per engagement |
| **total** | **$17K-60K** | **$60K-145K** |  |

these numbers assume a niche audience of ~500-2,000 active claude code power users growing to 5,000-10,000 by year 2. conservative — the 9,000+ plugin ecosystem suggests the addressable market is larger.

---

## 5. content atomization strategy

### 5a. docs -> social content

you have 19 docs. each one can produce:

| doc | tweets/threads | shorts | blog posts |
|---|---|---|---|
| guide.md | 5-8 tip threads | 3-4 shorts | 1 long-form |
| hooks reference | 3-4 threads | 2-3 shorts | 1 long-form |
| each comparison doc (5) | 1 thread each | 1 short each | cross-post each |
| troubleshooting | 5+ individual tips | 2-3 shorts | 1 long-form |
| glossary | 1 "did you know" series | - | - |

**total potential**: ~50-70 pieces of social content from existing docs alone.

### 5b. youtube shorts from VHS tapes

you have VHS tape files in `gifs/`. these can generate shorts:

- `query-cost.tape` -> "see exactly what claude code costs per session" (15-30s)
- `query-daily.tape` -> "your daily claude code dashboard in 1 command" (15-30s)
- `sift-search.tape` -> "search every claude code session you've ever had" (15-30s)

**youtube shorts stats**: 200B+ daily views in 2026. channels using shorts + long-form grow 41% faster. 15-30 second range drives highest completion rates.

**strategy**: 60% long-form (deep dives on hooks, plugins, workflows) + 40% shorts (quick tips, VHS tape demos). post 2-3 shorts/week to build discovery, 1 long-form/week for depth.

### 5c. newsletter

**platform recommendation: beehiiv**

| platform | free tier | paid features | best for |
|---|---|---|---|
| **beehiiv** | 2,500 subs | built-in ads, referral program, analytics | monetization + growth |
| substack | unlimited | network discovery, notes | writing-first, discovery |
| convertkit (kit) | 1,000 subs | course selling, automations | product-based business |

**recommendation**: beehiiv. reasons:
- built-in referral program (readers recruit readers)
- ad network for additional revenue
- better analytics than substack
- you can sell courses directly OR link out to polar.sh

**cadence**: weekly. "this week in claude code" format — 1 tip, 1 plugin update, 1 link. short. high-value. the wes bos model (165K subs, 30-70% open rates) proves developer newsletters work when they're actually useful.

### 5d. cross-posting strategy

**publish order** (canonical URL matters for SEO):

1. your own site (astro) — canonical URL lives here
2. wait 24-48hrs for google to index
3. cross-post to dev.to (set canonical_url)
4. cross-post to hashnode (set originalArticleURL)
5. medium — only if you want the medium audience, lowest priority

**automation**: use github actions to auto-cross-post via dev.to API + hashnode API when you publish to your blog. canonical URLs prevent duplicate content penalties.

**tags**: use 4-6 precise tags. respond to every comment within 24h to keep posts circulating.

---

## 6. comparable success stories

### proven models

| creator | product | revenue | strategy |
|---|---|---|---|
| **wes bos** | JS/web courses | $10M+ total, 55K+ paid copies | free courses as funnel, PPP pricing, 165K email list |
| **josh comeau** | CSS-for-JS | $550K in first week pre-sale | 1yr twitter audience building -> pre-sale. built custom platform |
| **kent c dodds** | epicreact, epicweb | $2M+ (company revenue) | left $150K paypal job, tiered pricing (base/ultimate) |
| **cal.com** | scheduling (OSS) | $10K+ MRR within year 1 | open core: free OSS + paid hosted |
| **indie median** | various | $500/mo median | 46% of indie projects hit $500-1K/mo band |

### what the winners have in common

1. **free content as funnel** — wes bos: 682K enrollments on free JS30. josh comeau: year of free twitter tips before selling anything
2. **audience before product** — josh comeau grew to 32K twitter followers BEFORE building the course. kent dodds built reputation through egghead.io first
3. **tiered pricing** — every successful course creator uses base/premium tiers. $50-100 base, $200-600 premium
4. **custom platform (optional but powerful)** — josh comeau built his own platform. doubled dev time but he believes it's why sales were so high
5. **pre-selling** — josh comeau pre-sold halfway through development. validated demand, funded completion. his goal was $50K, he hit $550K

### realistic revenue for this niche

**conservative (year 1)**: $15-30K
- smaller niche than react/CSS (claude code power users vs all web devs)
- but GROWING niche — 9,000+ plugins, claude code is anthropic's fastest-growing product
- early mover advantage is real — there are no established claude code courses yet

**moderate (year 2)**: $50-100K
- assumes course + consulting + sponsors + 1-2 cohorts
- assumes audience of 2,000-5,000 newsletter subscribers

**optimistic (year 2-3)**: $100K+
- assumes claude code continues growing
- assumes corporate training takes off
- assumes anthropic partner network amplifies reach

---

## 7. recommended tech stack + launch plan

### tech stack

| layer | choice | why |
|---|---|---|
| **site** | astro | fast, markdown-native, zero-JS default, cloudflare hosting |
| **payments** | polar.sh | cheapest MoR (4% + $0.40), dev-native, github integration |
| **email** | beehiiv | referral program, ad revenue, good free tier |
| **course hosting** | astro (self-hosted pages) + polar for access | gated content via polar subscriptions |
| **video** | youtube (public) + unlisted/polar-gated (paid) | no extra hosting cost |
| **community** | discord (free tier) or github discussions | keep it simple |
| **analytics** | plausible or umami (self-hosted) | privacy-friendly, lightweight |
| **PPP** | paritykit.com | 5-min setup |

### launch sequence

| phase | what | CC time | your time |
|---|---|---|---|
| **1. submit plugin** | submit mine to official marketplace + 3 awesome lists | **`CC: 30 min`** | 15 min review |
| **2. set up polar.sh** | create products for each tier, connect github | **`CC: 1 session`** | 30 min config |
| **3. atomize existing docs** | turn 19 docs into 50+ social posts, schedule | **`CC: 2 sessions`** | 1hr review |
| **4. build astro course site** | landing page + free tier content + gated access | **`CC: 3-4 sessions`** ~~1-2 week sprint~~ | 2hrs review |
| **5. launch free tier** | 7 lessons live, email capture, social push | **`CC: 1 session`** | 1hr launch day |
| **6. github sponsors** | set up 5 tiers with perks | **`CC: 30 min`** | 15 min review |
| **7. newsletter** | beehiiv setup, first 4 editions drafted | **`CC: 1 session`** | 30 min review |
| **8. pre-sell core** | josh comeau playbook: announce, collect emails, limited pre-sale | **`CC: 1 session`** | 2hrs marketing |
| **9. ship core ($49)** | course content complete, polar checkout live | **`CC: 3-4 sessions`** ~~1-2 weeks~~ | 3hrs review |
| **10. first cohort** | announce $499 cohort, cap at 15 people | manual | 8-12hrs live teaching |

**total CC time for phases 1-9**: ~12-14 sessions (~6-7 hrs of CC work)
**total your time**: ~8-10 hrs spread across 2-3 weeks
**~~human equivalent~~**: 4-6 weeks of part-time dev work

---

## 8. key risks + mitigations

| risk | likelihood | mitigation |
|---|---|---|
| claude code plugin API changes break mine | medium | pin to tested CC versions, automate upstream watching (you already have this CI workflow) |
| anthropic ships native analytics (competes with mine) | medium | differentiate on cross-session intelligence, custom queries, privacy (local sqlite). native tools tend to be basic |
| small addressable market | low-medium | market is growing fast. be the definitive resource early |
| course content goes stale quickly | high | design for evergreen principles + updatable modules. astro makes updates trivial |
| price sensitivity in dev audience | medium | PPP pricing + generous free tier + ROI calculator showing time saved |

---

## sources

- [Claude Code Plugin Marketplace Docs](https://code.claude.com/docs/en/discover-plugins)
- [Anthropic Official Plugin Directory](https://github.com/anthropics/claude-plugins-official)
- [Polar.sh](https://polar.sh)
- [Lemon Squeezy Pricing](https://www.lemonsqueezy.com/pricing)
- [Lemon Squeezy Fees Docs](https://docs.lemonsqueezy.com/help/getting-started/fees)
- [Platform Comparison (iimagined.ai)](https://iimagined.ai/blog/online-course-platform-comparison-teachable-gumroad-thinkific)
- [Wes Bos $10M Course Empire](https://www.foundershut.com/explore/wes-bos-coding-empire)
- [Josh Comeau $550K Pre-Sale](https://www.failory.com/interview/css-for-js-developers)
- [Kent C Dodds Course Business](https://newsletter.dominuskelvin.dev/p/kent-c-dodds-leaving-150k-at-paypal)
- [Claude Partner Network ($100M)](https://www.anthropic.com/news/claude-partner-network)
- [GitHub Sponsors Docs](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-tiers)
- [PPP Pricing (ParityKit)](https://www.paritykit.com/)
- [Wes Bos PPP Implementation](https://wesbos.com/parity-purchasing-power)
- [AI Training Pricing Guide](https://setupbots.com/blog/ai-training-services-pricing-guide)
- [Corporate AI Training Costs](https://aiforbusiness.courses/ai-training-costs-for-businesses/)
- [Claude Code Freelance Rates](https://institute.sfeir.com/en/claude-code/claude-code-resources/salary/)
- [YouTube Shorts Stats 2026](https://www.loopexdigital.com/blog/youtube-shorts-statistics)
- [YouTube Shorts Best Practices 2026](https://miraflow.ai/blog/youtube-shorts-best-practices-2026-complete-guide)
- [Beehiiv vs Substack vs ConvertKit](https://www.beehiiv.com/blog/beehiiv-vs-substack-vs-converkit)
- [Cross-Posting Strategy](https://dev.to/navinvarma/blog-syndication-cross-publishing-blog-posts-to-devto-hashnode-and-medium-1a5d)
- [Robin Wieruch Self-Hosted Course Platform](https://www.robinwieruch.de/how-to-build-your-own-course-platform/)
- [Indie Maker Analytics](https://indielaunches.com/indie-maker-analytics-2024-2025-projects/)
- [Payment Processor Fees Compared](https://userjot.com/blog/stripe-polar-lemon-squeezy-gumroad-transaction-fees)
- [Astro Course Platform (codewithandrea)](https://codewithandrea.com/articles/how-i-built-a-modern-course-platform-in-2024/)
