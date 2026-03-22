# what this actually costs

here's what claude code actually costs me per month.

most cost discussions online are deadass just vibes. "it's expensive" or "it's worth it" without numbers. here are mine.

## the numbers

<!-- [FILL: real cost data. pull from /mine or your anthropic dashboard. format: -->

<!-- | metric | value | -->
<!-- |--------|-------| -->
<!-- | monthly API spend | $XXX | -->
<!-- | sessions/month | ~XXX | -->
<!-- | avg cost/session | $X.XX | -->
<!-- | avg cost/commit | $X.XX | -->
<!-- | max plan cost | $XXX/month | -->
<!-- | cache hit rate | XX% | -->
<!-- | total monthly (plan + overages) | $XXX | -->

<!-- include 2-3 months of data if you have it to show trends ] -->

## what drives cost

four things determine your bill:

**model choice** -- opus costs more per token than sonnet. most sessions don't need opus. use sonnet as default, opus for complex reasoning tasks.

**cache hit rate** -- CLAUDE.md and project context get cached. higher cache hit = lower cost. stable CLAUDE.md files that don't change often = more cache hits. this is why you want your CLAUDE.md to be comprehensive but stable.

**session length** -- short focused sessions are cheaper per unit of output than marathon sessions. after ~45 minutes, context gets large, cache efficiency drops, and compaction cycles start. the sweet spot is 20-40 minute sessions with clear scope.

**extended thinking** -- thinking tokens are billed. complex prompts that trigger long chain-of-thought reasoning cost more. clear, specific prompts cost less than vague ones.

## the burn hook

the mine plugin includes a cost anomaly detector that fires on PreCompact. it compares current session token usage against your project averages and warns if you're burning significantly more than usual.

```
# burn fires automatically -- you see this in stderr:
burn: this session used ~3.2x your average token count.
      avg: 45k tokens, this session: 144k tokens.
      consider breaking large tasks into smaller sessions.
```

it doesn't block anything. just awareness. knowing you're on an expensive session lets you decide whether to continue or split the work.

## is the max plan worth it?

<!-- [FILL: honest take. things to address: -->
<!-- - what plan are you on? (max, pro, team?) -->
<!-- - do you hit rate limits on pro? how often? -->
<!-- - what's your effective hourly rate of time saved? -->
<!-- - would you recommend max plan to someone doing X sessions/day? -->
<!-- - at what usage level does max plan break even vs pro? ] -->

## cost per commit

<!-- [FILL: this is the metric that actually matters. -->
<!-- cost per commit = total monthly spend / total commits -->
<!-- pull from: git log --since="30 days ago" --oneline | wc -l -->
<!-- and your monthly bill. -->
<!-- -->
<!-- example framing: -->
<!-- "$X.XX per commit. each commit averages Y lines changed. -->
<!-- that's $X.XX per line of code that ships. -->
<!-- a junior dev at $XX/hr producing similar output would cost $XXX/month." -->
<!-- -->
<!-- be honest -- if the number is high, say so and explain why ] -->

## further reading

- [cost optimization guide](../concepts/cost-optimization.md) -- techniques to reduce spend
- [mine plugin](../../plugins/mine/README.md) -- burn feature docs, usage tracking

tested with: claude code v2.1.77
