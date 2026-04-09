<!-- tested with: claude code v2.1.77 -->

# automation

my repo maintains itself. here's the full stack -- daemons, cron, github actions, and the guardrails that keep them from wrecking things.

---

> **the golden rule: never auto-commit to main. never. not even "just this once."**

---

## my 12 pipelines

i spend less than 30 minutes a week on maintenance. twelve CI workflows handle validation, freshness, competitive intel, community monitoring, and release management.

| workflow | trigger | what it does | cost/run |
|----------|---------|-------------|----------|
| validate | push, PR | markdown lint, link check, hook syntax, JSON, python, plugin smoke | $0 |
| pr-quality-gate | PR | checks "tested with" stamps, hook conventions, PR description | $0 |
| plugin-smoke-test | PR + push | validates mine plugin install, hook structure, permissions | $0 |
| claude-responder | issue, PR | auto-triages issues and reviews external PRs via headless claude | ~$0.05 |
| freshness-check | weekly cron | flags files with version stamps >2 versions behind | ~$0.01 |
| docs-audit | weekly cron | checks docs for outdated info, missing cross-refs | ~$0.05 |
| competitive-update | weekly cron | monitors cursor, copilot, codex, gemini-cli releases and pricing | $0 |
| community-digest | weekly cron | summarizes reddit, HN, trending repos into a github issue | $0 |
| official-watcher | cron | monitors official claude code releases, changelog, docs | ~$0.02 |
| stale-cleanup | daily cron | closes old auto/ PRs, prunes orphan branches, supersedes old issues | $0 |
| dependabot-auto-merge | dependabot PR | auto-merges patch/minor bumps, labels major for review | $0 |
| release | tag push | bumps plugin.json version, generates changelog, creates GH release | $0 |

**the philosophy:** automate everything that doesn't require taste. validation, linting, version stamps, stale branch cleanup -- mechanical. content decisions, naming, architecture -- manual.

the goal: when i open the repo on monday, there's an issue summarizing what changed in the ecosystem, a digest of community activity, and any staleness flags. i read, decide, act.

---

## the daemon pattern

a file watcher monitors your project for changes and pipes them to claude code. sounds amazing. can also destroy your project.

### safe daemon (recommended)

```bash
#!/bin/bash
# watch + test, but NEVER write files or commit
fswatch -0 --exclude '.git' --include '\.ts$' src/ | while IFS= read -r -d '' file; do
  echo "changed: $file"
  claude -p "the file $file was just modified. run its tests and report results. DO NOT modify any files." \
    --allowedTools Bash,Read,Grep,Glob \
    --model claude-haiku-4-5 \
    2>&1 | tee -a /tmp/claude-daemon.log
done
```

key: `--allowedTools` explicitly excludes Write and Edit. prompt says "DO NOT modify." output is logged for review.

### the guardian agent pattern

safer than raw daemons. watches for test failures and proposes fixes, but never applies them automatically:

1. fswatch detects a file change
2. guardian runs the related tests
3. if tests fail, it writes a proposed fix to `.claude/guardian-proposals/` as a diff
4. you review and apply when ready

```bash
#!/bin/bash
fswatch -0 --exclude '.git' --include '\.(ts|js|py|rs)$' src/ | while IFS= read -r -d '' file; do
  claude -p "file changed: $file. run related tests. if any fail, write a proposed fix to .claude/guardian-proposals/$(date +%s).md. DO NOT apply the fix directly." \
    --allowedTools Bash,Read,Grep,Glob,Write \
    --model claude-haiku-4-5
done
```

---

## cron maintenance

use cron to run periodic tasks: dependency updates, code quality checks, changelog generation. **always work on a branch, open a PR, never touch main directly.**

### safe cron pattern

```bash
#!/bin/bash
set -euo pipefail

PROJECT_DIR="/path/to/your/project"
cd "$PROJECT_DIR"

BRANCH="maintenance/deps-$(date +%Y%m%d)"

git checkout main && git pull origin main
git checkout -b "$BRANCH"

claude -p "check for outdated dependencies and security vulnerabilities. \
  apply up to 5 of the safest updates. run tests after each." \
  --allowedTools Bash,Read,Write,Edit,Grep,Glob

if git diff --quiet; then
  echo "no updates needed"
  git checkout main && git branch -D "$BRANCH"
  exit 0
fi

git add -A
git commit -m "chore: dependency updates $(date +%Y-%m-%d)"
git push -u origin "$BRANCH"
gh pr create --title "chore: dependency updates $(date +%Y-%m-%d)" \
  --body "automated dependency check. review before merging." --base main
git checkout main
```

```bash
# cron entry: weekly on sundays at 3am
0 3 * * 0 /path/to/dep-update.sh >> /var/log/claude-cron.log 2>&1
```

---

## github actions (claude-code-action)

the official [claude-code-action](https://github.com/anthropics/claude-code-action) lets you trigger claude from PR events and comments.

```yaml
# .github/workflows/claude.yml
name: Claude Code
on:
  pull_request:
    types: [opened, synchronize]
  issue_comment:
    types: [created]

jobs:
  claude:
    if: |
      github.event_name == 'pull_request' ||
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude'))
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

## safety guardrails

before running any automated claude pattern:

- [ ] never pushes to main -- always works on a branch
- [ ] never auto-merges -- opens a PR for human review
- [ ] `--allowedTools` is set -- no Write/Edit unless necessary
- [ ] output is logged -- you can review after the fact
- [ ] prompts include negative constraints -- "DO NOT modify files"
- [ ] timeout is set -- cron jobs can't run forever
- [ ] tested on a throwaway repo first

### kill switch

every daemon should have one:

```bash
KILL_FILE=".claude/guardian-kill"
if [ -f "$KILL_FILE" ]; then
  echo "kill switch activated, shutting down"
  exit 0
fi
```

to stop: `touch .claude/guardian-kill`. to restart: `rm .claude/guardian-kill` and relaunch.

---

## when automation makes sense

| scenario | safe? | approach |
|---|---|---|
| run tests on file change | yes | daemon with read-only tools |
| update deps weekly | yes with PR | cron + branch + PR |
| fix lint errors on save | risky | guardian pattern with proposals |
| auto-commit on test pass | **no** | just don't |
| PR review on open | yes | github actions (read-only) |
| nightly security audit | yes | cron + issue creation |

the pattern that works: **automate the analysis, leave the action to humans.** let claude find problems, propose fixes, draft PRs. let a human click merge.

total monthly cost: **< $1**. github actions free tier covers all 12 workflows. the AI-powered ones (claude-responder, docs-audit, official-watcher) use haiku at ~$0.05/run and fire weekly or on events. the rest are pure bash/python with zero API cost.

---

## further reading

- [hooks](./hooks.md) -- enforcement hooks that protect against automation mistakes
- [official docs](https://docs.anthropic.com/en/docs/claude-code/github-actions) -- github actions setup
