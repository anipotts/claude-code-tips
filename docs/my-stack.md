<!-- tested with: claude code v2.1.77 -->

# my automation stack

this repo maintains itself. here's the full stack.

i spend less than 30 minutes a week on maintenance. twelve CI workflows handle validation, freshness, competitive intel, community monitoring, and release management. most run on cron. most cost nothing.

## the 12 pipelines

| workflow | trigger | what it does | cost/run |
|----------|---------|-------------|----------|
| validate | push, PR | markdown lint, link check, hook syntax, JSON, python, plugin smoke | $0 |
| pr-quality-gate | PR | checks "tested with" stamps, hook conventions, PR description | $0 |
| plugin-smoke-test | PR + push | validates mine plugin install, hook structure, permissions | $0 |
| claude-responder | issue, PR | auto-triages issues and reviews external PRs via headless claude | ~$0.05 |
| freshness-check | weekly cron | flags files with version stamps >2 versions behind | ~$0.01 |
| docs-audit | weekly cron | checks docs for outdated info, missing cross-refs, structural issues | ~$0.05 |
| competitive-update | weekly cron | monitors cursor, copilot, codex, gemini-cli releases and pricing | $0 |
| community-digest | weekly cron | summarizes reddit, HN, trending repos into a github issue | $0 |
| official-watcher | cron | monitors official claude code releases, changelog, docs | ~$0.02 |
| stale-cleanup | daily cron | closes old auto/ PRs, prunes orphan branches, supersedes old issues | $0 |
| dependabot-auto-merge | dependabot PR | auto-merges patch/minor bumps, labels major for review | $0 |
| release | tag push | bumps plugin.json version, generates changelog, creates GH release | $0 |

## the philosophy

automate everything that doesn't require taste.

validation, linting, version stamps, stale branch cleanup -- these are mechanical. no judgment needed. let CI do it.

content decisions, naming, architecture, what to write next -- these require taste. keep those manual.

the goal: when i open the repo on monday, there's an issue summarizing what changed in the ecosystem, a digest of community activity, and any staleness flags. i read, decide, act. the repo already did the research.

## what i'd automate next

## cost of running all this

| cost | monthly |
|------|---------|
| github actions | free tier covers it (all workflows combined < 2,000 min/month) |
| claude API (responder + audits) | ~$0.15/month (haiku-powered, fires on issues and PRs) |
| total CI cost | **< $1/month** |

less than a gas station coffee. the haiku-powered workflows (claude-responder, docs-audit) cost pennies bc haiku is $1/M input tokens and these workflows process tiny payloads.

## further reading

- [automation](./automation.md) -- daemons, cron, github actions patterns
- [hooks](./hooks.md) -- the enforcement layer behind the automation

tested with: claude code v2.1.77
