# freshness watcher - sub-hour Claude Code changelog SLA

Status: draft - v3 horizon

## summary

claude-code-tips exists to be current. if Anthropic ships a Claude Code release on tuesday at 2pm and this repo still says "tested with vX" for the previous version at 3pm, the repo is visibly stale. today freshness is manual: someone sees a changelog, runs the version-stamp script, opens a PR.

the freshness watcher makes this automatic. target SLA: within one hour of a Claude Code changelog entry, a draft PR exists on this repo with version-stamp updates and a changelog excerpt. safe changes auto-merge on green CI. anything touching runtime plugin code or semantics waits for review.

## scope

### targets

- **SLA**: p50 under 30 minutes, p95 under 60 minutes from Anthropic publish to PR open.
- **auto-merge for safe changes**: green CI + matching a trusted rule -> merged without Ani touching it.
- **no GitHub Actions for the watcher loop**: Actions has queue lag (often 1-5 minutes cold), which eats the SLA budget. watcher runs on the operator machine (see `mini-control-plane.md`).

### triggers

three independent signals, each on its own schedule:

1. **npm poll**: every 5 minutes, `npm view @anthropic-ai/claude-code version`. if version differs from last recorded, fire a trigger event.
2. **docs scraper**: every 15 minutes, fetch key pages under `docs.anthropic.com/en/docs/claude-code` and diff against last snapshot. if diff is non-trivial (more than whitespace), fire a trigger event with the diff attached.
3. **changelog poller**: every 10 minutes, poll GitHub releases for `anthropics/claude-code` and the anthropic blog rss. fire a trigger event per new entry.

all three run as launchd jobs on the operator, writing to a local dedupe log. the job `pro-freshness-watcher` drives them.

### auto-merge rule matrix

each PR opened by the watcher is tagged with a rule category. CI gates on the category.

**trusted (auto-merge on green CI)**:
- stamp-bump only: PR diff is limited to `docs/**` + `examples/**` version strings.
- version-bump in a single file (e.g. `.claude-plugin/plugin.json` patch bump mirroring upstream).
- dependabot action-group patches (already handled today, rolled into the same matrix for consistency).

**review-required (PR stays open, notifies Ani)**:
- changelog mentions new features (regex on "new", "added", "support for", "introduces").
- changelog mentions deprecations or breaking changes.
- content updates to `docs/tips/` or `docs/comparisons/` where wording might need Ani's voice.
- anything touching `plugins/cc/server.ts`, `plugins/lore/hooks/hook.py`, or any runtime hook script under `hooks/`.

the classifier is a small script with deterministic rules. no LLM in the critical path (adds latency, adds failure modes). LLM can draft PR body copy async, but merge decision is code.

### integration with existing stamp-bump workflow

`stamp-bump.yml` already exists and handles the version-stamp update mechanics. the watcher doesn't duplicate that logic. instead:

- watcher detects the event.
- watcher triggers `stamp-bump.yml` via `workflow_dispatch` with the new version as input.
- stamp-bump runs, opens the PR, sets labels.
- watcher polls the PR, applies the auto-merge label if the rule matrix says so, monitors CI, merges when green.

this keeps the watcher stateless in terms of git operations. git stays inside GitHub Actions where it's already configured.

## non-goals

- proactive feature tracking ("claude added feature X, what should we build in response"). that's a different muscle, closer to creative ideation. Phase C of Phase C.
- cross-repo watching. this watcher is scoped to upstream Claude Code only. other repos can adopt the pattern.
- notifying the outside world (newsletter, twitter, etc.) on update. separate system owns content distribution.

## open questions

- **rate limiting**: npm and GitHub are fine. anthropic.com isn't rate-documented for our use case. add backoff, log 429s, alert on sustained failure.
- **dedupe across triggers**: if npm, docs, and changelog all fire within the same hour for the same version, the watcher should open one PR, not three. dedupe key: upstream version string. if docs scraper fires without a version change, that's a content-only update and gets its own PR track.
- **false positives**: docs scraper will catch benign rewrites (typo fixes, formatting). threshold tuning needed. initial heuristic: ignore diffs under 20 characters or only whitespace. refine once we have data.
- **operator offline**: if the operator is down, SLA breaks silently. need a heartbeat from the creator machine that alerts after 2 missed polls.

## links

- related: `docs/rfcs/mini-control-plane.md` (watcher runs on operator, not laptop, not Actions).
- related: `docs/rfcs/mine-v2-observability.md` (watcher publishes events to mine for audit trail).

---

### skill collection monitoring

with the introduction of skill collection repositories and the /workflows:skill-collections command, the watcher should also track skill collection repo updates (stars, forks, description changes) and trigger changelog entries when significant activity is detected. this feeds into the broader "what's trending in the agent skills ecosystem" reporting that complements development workflows.
