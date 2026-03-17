# automation recommendations for claude-code-tips

practical automations to add across this repo and anipotts.com. prioritized by value and effort.

---

## what already exists (inventory)

### hooks (6)
| hook | trigger | purpose |
|------|---------|---------|
| safety-guard.sh | PreToolUse | blocks destructive commands (rm -rf, force push, etc) |
| panopticon.sh | PostToolUse | logs every tool call to audit trail |
| context-save.sh | PreCompact | saves context before compaction |
| notify.sh | Stop | desktop notification when session ends |
| replay-capture.sh | PostToolUse | captures file changes for VHS replays |
| knowledge-builder.sh | Stop | extracts learnings into knowledge base |

### mine plugin hooks (7)
| hook | trigger | purpose |
|------|---------|---------|
| startup.sh | SessionStart | one-time db migration + ingest |
| ingest.sh | SessionEnd | parse session jsonl into sqlite |
| compact.sh | PreCompact | save context before compaction |
| burn.sh | PreCompact | cost anomaly detection |
| mistakes.sh | PostToolUse | track error patterns |
| subagent.sh | SubagentStop | track subagent usage |
| tool-log.sh | PostToolUse | log tool calls |

### agents (8)
analyst, explorer, guardian, code-sweeper, dep-checker, pr-narrator, test-writer, vibe-check

### commands (10)
content-idea, dashboard, deps, improve, mine, quicktest, replay, ship, stats, sweep

### CI workflows (8)
validate, upstream-watcher, quick-merge, claude-responder, pr-quality-gate, freshness-check, docs-audit, comparison-update

---

## recommended new automations

### tier 1: high value, low effort

**1. SessionEnd hook: auto-update version stamps**
when a session modifies files in `docs/`, `hooks/`, `plugins/`, or `scripts/`, auto-update the `tested with: claude code vX.Y.Z` stamp to the current version. prevents version-stamps CI failures from accumulating.
```bash
# hooks/version-stamp.sh — SessionEnd
# reads git diff --name-only, updates stamps in modified files
```

**2. PreToolUse hook: prevent squash merge**
you've been burned by squash merges. add a hook that blocks any `git merge --squash` or `gh pr merge --squash` command.
```bash
# hooks/no-squash.sh — PreToolUse (Bash)
# check if command contains --squash, exit 2 to block
```

**3. PostToolUse hook: auto-fix markdown lint on save**
when a .md file is written, run markdownlint-fix on it inline. prevents the constant markdown-lint CI failures.
```bash
# hooks/md-lint-fix.sh — PostToolUse (Write, Edit)
# npx markdownlint-cli2-fix on the modified file
```

**4. UserPromptSubmit hook: remind about /mine on cost questions**
when user asks about costs, spending, usage — remind them about `/mine` intents instead of raw sqlite queries.

### tier 2: medium value, medium effort

**5. CI workflow: auto-version-bump on release**
a workflow that bumps `plugin.json` version on tagged releases and creates a github release with changelog.

**6. SessionStart hook: stale branch reminder**
on session start, check if there are any local branches with tracking branch `[gone]`. notify user to clean up with `/clean-gone`.

**7. agent: changelog-writer**
after merging PRs, generates a human-readable changelog entry. pairs well with the existing pr-narrator agent.

**8. CI workflow: plugin install smoke test**
a workflow that actually installs the mine plugin into a fresh claude code environment and verifies the hooks fire correctly. catches broken plugin.json, missing scripts, etc.

### tier 3: nice to have

**9. hook: auto-commit on significant changes**
after N file mutations without a commit, gently remind the user to commit. not blocking, just a notification via notify.sh.

**10. agent: link-checker**
a local agent that validates all internal links before committing. faster than waiting for CI.

---

## automations for anipotts.com (course platform)

these go in the anipotts.com repo, not here. include them in the course-platform-handoff session.

**1. PostToolUse hook: supabase migration guard**
block any direct `ALTER TABLE` or `DROP` commands in code. force migrations through supabase migration files.

**2. SessionStart hook: check vercel deployment status**
on session start, check if the latest vercel deployment is healthy. warn if deployment is failing.

**3. CI workflow: lighthouse audit on PR**
run lighthouse on key pages (/, /claude, /course) and fail if scores drop below thresholds.

**4. PreToolUse hook: env var protection**
block any command that would echo or cat .env files. guard against accidentally committing secrets.

---

## implementation order

for this repo:
1. no-squash hook (5 min, prevents a known pain point)
2. version-stamp auto-updater (15 min, eliminates recurring CI noise)
3. md-lint-fix hook (10 min, eliminates markdown-lint failures)
4. stale branch reminder (10 min, already have the logic in upstream-watcher)

for anipotts.com:
- include recommendations 1-4 in the course-platform-handoff session

---

<!-- tested with: claude code v2.1.77 -->
