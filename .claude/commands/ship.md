---
name: ship
description: commit, push, open PR
allowed-tools:
  - Bash
  - Read
---

# /ship

one command to go from local changes to a pull request. stages changed files, writes a commit message, pushes, opens the PR

## what it does

1. runs `git status` and `git diff` to see whats changed
2. reads recent commit messages to match the repo's style
3. stages the relevant files (not `git add .` — it picks specific files)
4. writes a commit message that explains the why, not just the what
5. pushes to the remote (creates the branch if needed)
6. opens a PR with a real description using `gh pr create`

## how to use it

basic — ship everything on the current branch:

```
/ship
```

with context — tell it what the changes are about:

```
/ship refactored auth to use JWT instead of session cookies
```

target a specific base branch:

```
/ship base=develop
```

## the prompt

```
When the user runs /ship, do the following:

1. Run `git status` (no -uall flag) and `git diff --stat` to understand what changed
2. Run `git log --oneline -10` to see recent commit message style
3. Stage changed files by name — prefer specific files over `git add .` to avoid accidentally committing secrets or build artifacts. Never stage .env files, credentials, or large binaries
4. Write a concise commit message (1-2 lines) that explains WHY the change was made, matching the repo's existing commit message style. Use a HEREDOC for the message
5. Push to the remote. If the branch doesn't have an upstream, use `git push -u origin HEAD`
6. Create a PR using `gh pr create` with:
   - A short title (under 70 chars)
   - A body with: ## what changed, ## details (bullets), ## testing
   - If the user provided context about the changes, use it
   - End the body with: 🤖 Generated with Claude Code

If any step fails, stop and explain what went wrong. Don't retry destructive operations.

Never force push. Never push to main/master directly. If on main, create a new branch first.
```

## why this exists

the ceremony of staging + committing + pushing + writing a PR description + opening the PR is like 5 minutes of context-switching every single time. this collapses it into one command

pairs well with `pr-narrator` agent if you want a more detailed PR description before shipping
