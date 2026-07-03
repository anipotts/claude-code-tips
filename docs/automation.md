<!-- tested with: claude code v2.1.122 -->

# automation

my repo maintains itself. here's the full stack -- daemons, cron, github actions, and the guardrails that keep them from wrecking things.

---

> **the golden rule: never auto-commit to main. never. not even "just this once."**

---

## the philosophy

automate everything that doesn't require taste. validation, linting, version stamps, stale-branch cleanup -- mechanical. content decisions, naming, architecture -- manual. the goal of a maintenance setup is that when you open the repo on monday, there's a digest of what changed in the ecosystem, what the community is talking about, and any staleness flags. you read, decide, act.

categories of automation worth setting up early:

- **validation on every PR** -- markdown lint, link check, hook syntax, JSON, python, plugin smoke
- **freshness checks** -- flag files whose version stamps fall behind upstream
- **release pipeline** -- tag push -> bump manifests -> generate changelog -> create GH release
- **stale cleanup** -- close ancient auto-PRs, prune orphan branches
- **dependabot auto-merge** -- patch/minor bumps merge themselves; major bumps get a label and wait for a human

ai-powered maintenance is also viable on the cheap: weekly competitive-intel, docs audits, official-changelog watching. on haiku these run for cents per execution. only spin them up once your manual versions are working -- otherwise you're debugging a bot debugging your repo.

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



### permission mode in v2.1.200+

starting v2.1.200, the default permission mode is `manual`. daemons that expect auto-execution must explicitly set `--permission-mode auto` or `"defaultMode": "auto"` in `.claude/settings.json`. update your daemon scripts:

```bash
claude --permission-mode auto -p "..."
```

without this, daemons will prompt before every tool execution, blocking unattended workflows.

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

a sensible monthly target: **under $2/month** for a hobby-scale repo. github actions free tier covers most validation. ai-powered jobs (review bots, docs audits, watchers) on haiku run for cents per execution. the cheap ones are pure bash/python at zero api cost.

---

## further reading

- [hooks](./hooks.md) -- enforcement hooks that protect against automation mistakes
- [official docs](https://docs.anthropic.com/en/docs/claude-code/github-actions) -- github actions setup
