# daemon and cron patterns for claude code

**persistent agents, scheduled maintenance, and the guardrails that keep them from wrecking your repo.**

credit: Boris Cherny tips #1 and #12, with safety guardrails added bc the originals were reckless.

---

> **the golden rule: never auto-commit to main. never. not even "just this once."**

---

## what is automation

claude code runs interactively by default -- you type, it responds, you approve. automation removes the human from the loop. that makes things faster and also makes things dangerous.

three flavors:

| pattern | what it does | risk level |
|---|---|---|
| daemon | watches files, reacts to changes in real-time | medium-high |
| cron | runs on a schedule (nightly, weekly) | medium |
| github actions | runs on PR events, comments, pushes | low-medium |

the theme: automate the analysis, leave the action to humans. let claude find problems, propose fixes, draft PRs. let a human click merge.

---

## the daemon pattern

a file watcher (fswatch, chokidar, FSEvents) monitors your project for changes and pipes them to claude code for automated responses -- running tests, fixing lint errors, updating docs, etc.

sounds amazing. can also destroy your project if you're not careful.

### basic daemon (tmux + claude --resume)

```bash
#!/bin/bash
# persistent claude session that stays alive across file changes
# run this in a tmux pane: tmux new-session -s guardian

PROJECT_DIR="/path/to/your/project"
cd "$PROJECT_DIR"

# start a claude session that can be resumed
claude --resume
```

the `--resume` flag reconnects to your last session. pair it with tmux and you have a persistent claude that maintains context across your entire workday. but for automation, you usually want headless mode instead.

### file watcher daemon

```bash
#!/bin/bash
# watch for source file changes, run tests on each save
fswatch -0 --exclude '.git' --include '\.ts$' src/ | while IFS= read -r -d '' file; do
  echo "changed: $file"
  claude -p "the file $file was just modified. run the tests related to it and report any failures." \
    --allowedTools Bash,Read,Grep \
    --model claude-haiku-4-5
done
```

### safety version (recommended)

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

key differences from the unsafe version:
- `--allowedTools` explicitly excludes Write and Edit
- prompt says "DO NOT modify any files"
- output logged so you can review what it did

### WARNING: --dangerously-skip-permissions

some daemon patterns require `--dangerously-skip-permissions` to run without user confirmation. this flag does exactly what it says -- **it skips ALL permission checks.** claude can run any bash command, write any file, delete anything.

**never use this flag** unless:
- the agent has no Write/Edit tools (read-only)
- the agent runs in a dedicated worktree or container
- you've audited every possible prompt injection path
- you're willing to lose everything in the working directory

even then, think twice. the guardian agent pattern below is a safer alternative.

---

## cron maintenance

use cron to run periodic maintenance tasks: dependency updates, code quality checks, changelog generation. the key: **always work on a branch, open a PR, never touch main directly.**

### safe cron pattern

```bash
#!/bin/bash
# weekly dependency check -- runs on a branch, opens a PR
set -euo pipefail

PROJECT_DIR="/Users/you/my-project"
cd "$PROJECT_DIR"

BRANCH="maintenance/deps-$(date +%Y%m%d)"

# create a clean branch
git checkout main
git pull origin main
git checkout -b "$BRANCH"

# let claude check and update deps
claude -p "check for outdated dependencies and security vulnerabilities. \
  if there are any critical security updates, apply them. \
  for minor/patch updates, apply up to 5 of the safest ones. \
  run tests after each update to verify nothing breaks. \
  if tests fail, revert that update and move on." \
  --allowedTools Bash,Read,Write,Edit,Grep,Glob

# only push if there are actual changes
if git diff --quiet; then
  echo "no updates needed"
  git checkout main
  git branch -D "$BRANCH"
  exit 0
fi

# commit, push, PR -- never merge automatically
git add -A
git commit -m "chore: dependency updates $(date +%Y-%m-%d)"
git push -u origin "$BRANCH"
gh pr create \
  --title "chore: dependency updates $(date +%Y-%m-%d)" \
  --body "automated dependency check. review before merging." \
  --base main

# notify
echo "PR created on branch $BRANCH" | mail -s "dep update PR" you@email.com

# return to main
git checkout main
```

### cron entry

```bash
# run weekly on sundays at 3am
0 3 * * 0 /path/to/dep-update.sh >> /var/log/claude-cron.log 2>&1
```

### other cron ideas

```bash
# nightly: check for security vulnerabilities
0 2 * * * cd /path/to/project && claude -p "run npm audit. if critical vulnerabilities exist, create a github issue with gh issue create" --allowedTools Bash,Read >> /tmp/claude-audit.log 2>&1

# weekly: stale TODO cleanup report
0 4 * * 1 cd /path/to/project && claude -p "find all TODO/FIXME comments. for each one, check git blame to see how old it is. report any older than 90 days" --allowedTools Bash,Read,Grep,Glob >> /tmp/claude-todos.log 2>&1

# monthly: generate changelog from commit history
0 3 1 * * cd /path/to/project && claude -p "generate a changelog for the last month from git log. group by feature/fix/chore. write to CHANGELOG-draft.md" --allowedTools Bash,Read,Write >> /tmp/claude-changelog.log 2>&1
```

### what NOT to do with cron

```bash
# DO NOT DO THIS
claude -p "update all deps" && git add -A && git commit -m "updates" && git push origin main
```

this is how you wake up to a broken main branch on monday morning. always branch, always PR, always human review.

---

## file watchers (fswatch + claude)

fswatch is the standard for macOS. on linux, inotifywait works too. the pattern is the same -- detect a change, run claude in headless mode.

### fswatch basics

```bash
# watch typescript files in src/
fswatch -0 --exclude '.git' --include '\.ts$' src/

# watch everything except node_modules and .git
fswatch -0 --exclude '.git' --exclude 'node_modules' .

# watch with a debounce (300ms, prevents rapid-fire on save-all)
fswatch -0 -l 0.3 --exclude '.git' src/
```

### practical file watcher patterns

```bash
# rebuild docs on markdown change
fswatch -0 --include '\.md$' docs/src/ | while IFS= read -r -d '' file; do
  claude -p "rebuild the documentation site. run npm run docs:build and check for broken links" \
    --allowedTools Bash,Read \
    --model claude-haiku-4-5
done

# lint fix on save (careful -- this writes files)
fswatch -0 --include '\.(ts|tsx)$' src/ | while IFS= read -r -d '' file; do
  claude -p "run eslint --fix on $file. report what was fixed." \
    --allowedTools Bash,Read \
    --model claude-haiku-4-5
done

# type check on save (read-only, safe)
fswatch -0 --include '\.ts$' src/ | while IFS= read -r -d '' file; do
  npx tsc --noEmit 2>&1 | claude -p "these are typescript errors after $file was modified. explain the top 3 errors and suggest fixes. DO NOT modify files." \
    --allowedTools Read \
    --model claude-haiku-4-5
done
```

---

## the guardian agent pattern

a safer alternative to raw daemons. the guardian agent watches for test failures and proposes fixes, but never applies them automatically. see [agents/guardian.md](../agents/guardian.md) for the full agent definition.

### how it works

1. fswatch detects a file change
2. guardian runs the related tests
3. if tests fail, it analyzes the failure and proposes a fix
4. it writes the proposal to `.claude/guardian-proposals/` as a diff
5. you review and apply when ready

```bash
#!/bin/bash
# guardian daemon -- watches, tests, proposes. never commits.
fswatch -0 --exclude '.git' --include '\.(ts|js|py|rs)$' src/ | while IFS= read -r -d '' file; do
  claude -p "file changed: $file. run related tests. if any fail, write a proposed fix to .claude/guardian-proposals/$(date +%s).md -- include the failing test output, your analysis, and a diff of the fix. DO NOT apply the fix directly." \
    --allowedTools Bash,Read,Grep,Glob,Write \
    --model claude-haiku-4-5
done
```

the Write tool is allowed but scoped to the proposals directory by the prompt. not bulletproof -- use `--dangerously-skip-permissions` only if you've also set up PreToolUse hooks to enforce the directory constraint. see the [hooks guide](./hooks-guide.md) for how.

---

## github actions (claude-code-action)

claude code works in CI/CD via the official [claude-code-action](https://github.com/anthropics/claude-code-action). the main use case: `@claude` in PR comments triggers claude to review, suggest changes, or implement feedback.

### basic setup

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

### auto-review on PR open

```yaml
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          direct_prompt: |
            Review this PR for:
            1. Security issues
            2. Missing error handling
            3. Performance concerns
            4. Test coverage gaps
            Post a review comment with findings.
```

### headless claude in CI

you can also just run `claude -p` in a CI step for custom checks:

```yaml
- name: Check for security issues
  run: |
    npm install -g @anthropic-ai/claude-code
    claude -p "review the changes in this PR for security issues. output JSON with {issues: [{file, line, severity, description}]}" \
      --output-format json > security-report.json
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

## safety guardrails

before running any automated claude code pattern:

- [ ] **never pushes to main** -- always works on a branch
- [ ] **never auto-merges** -- opens a PR for human review
- [ ] **--allowedTools is set** -- explicitly lists allowed tools, no Write/Edit unless necessary
- [ ] **output is logged** -- you can review what it did after the fact
- [ ] **prompts include negative constraints** -- "DO NOT modify files", "DO NOT commit"
- [ ] **cron jobs notify on completion** -- email, slack, pushover, whatever
- [ ] **file write hooks guard sensitive paths** -- PreToolUse hook blocks writes to .env, main branch, etc.
- [ ] **timeout is set** -- cron jobs have a wallclock limit so they can't run forever
- [ ] **tested on a throwaway repo first** -- never test automation on your real codebase

### kill switch

every daemon should have a kill switch. simplest version:

```bash
#!/bin/bash
# add this check at the top of your daemon loop
KILL_FILE=".claude/guardian-kill"

fswatch -0 ... | while IFS= read -r -d '' file; do
  if [ -f "$KILL_FILE" ]; then
    echo "kill switch activated, shutting down"
    exit 0
  fi
  # ... rest of daemon logic
done
```

to stop the daemon: `touch .claude/guardian-kill`. to restart: `rm .claude/guardian-kill` and relaunch.

### template: safe automation wrapper

use this as a starting point for any automated pattern:

```bash
#!/bin/bash
set -euo pipefail

PROJECT_DIR="${1:?usage: $0 <project-dir>}"
LOG_FILE="/tmp/claude-auto-$(date +%Y%m%d-%H%M%S).log"
TIMEOUT=300  # 5 minute max

cd "$PROJECT_DIR"

# safety checks
if [ "$(git branch --show-current)" = "main" ] || [ "$(git branch --show-current)" = "master" ]; then
  echo "ERROR: refusing to run automation on main/master branch" >&2
  exit 1
fi

if ! git diff --quiet; then
  echo "ERROR: working tree is dirty. commit or stash first" >&2
  exit 1
fi

# run with timeout and logging
timeout "$TIMEOUT" claude -p "your prompt here" \
  --allowedTools Bash,Read,Grep,Glob \
  --model claude-haiku-4-5 \
  2>&1 | tee "$LOG_FILE"

echo "done. log: $LOG_FILE"
```

---

## when automation makes sense

| scenario | safe? | approach |
|---|---|---|
| run tests on file change | yes | daemon with read-only tools |
| update deps weekly | yes with PR | cron + branch + PR |
| fix lint errors on save | risky | guardian pattern with proposals |
| auto-commit on test pass | **no** | just don't |
| auto-deploy on PR merge | depends | use CI/CD for this, not claude |
| generate changelogs | yes with PR | cron + branch + PR |
| PR review on open | yes | github actions (read-only) |
| nightly security audit | yes | cron + issue creation |

the pattern that works: **automate the analysis, leave the action to humans.** let claude find the problems, propose fixes, draft PRs. let a human click the merge button.
