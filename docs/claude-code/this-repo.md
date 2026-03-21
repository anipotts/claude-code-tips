# what's running on this repo

<!-- tested with: claude code v2.1.77 -->

this repo maintains itself using the same patterns it teaches. every hook, agent, and workflow listed below is real and running. if something breaks, the repo fixes it -- or tells me.

## ci/cd pipelines

12 workflows. most cost nothing. the ones that call claude use haiku to keep it cheap.

| workflow | trigger | what it does | cost/run |
|----------|---------|--------------|----------|
| **validate** | push, PR | markdown lint, link check, hook syntax, json/python validation, plugin smoke test | $0 |
| **pr quality gate** | PR open/sync | checks "tested with" stamps, hook conventions, non-empty PR descriptions | $0 |
| **plugin smoke test** | push/PR touching plugins/ | validates plugin.json, scripts, permissions, imports | $0 |
| **claude responder** | issue/PR opened | auto-triages issues, reviews external PRs via headless claude | ~$0.01-0.03 |
| **official watcher** | 2x daily (06:00, 18:00 UTC) | monitors claude code releases/changelog/docs, auto-applies updates. small changes commit directly, big ones open a draft PR | ~$0.01-0.05 |
| **freshness check** | weekly (monday) | scans for stale "tested with" version stamps, opens a tracking issue | ~$0.01 |
| **docs audit** | weekly (sunday) | reads all docs, checks for outdated info, missing cross-refs, structural issues. small fixes auto-commit, big ones open a PR | ~$0.05-0.15 |
| **competitive update** | weekly (wednesday) | checks competitor releases (codex, cursor, gemini-cli) and pricing pages, updates comparison docs | ~$0.02-0.05 |
| **community digest** | weekly (friday) | creates a github issue summarizing reddit, HN, and trending repos | $0 |
| **dependabot auto-merge** | on dependabot PR | auto-merges patch/minor bumps when CI passes, labels major bumps for review | $0 |
| **stale cleanup** | daily (04:00 UTC) | closes stale auto/ PRs, deletes orphan branches, prunes old freshness issues | $0 |
| **release** | version tag push | creates github release, bumps plugin.json, generates changelog from merged PRs | $0 |

**total monthly cost**: under $1. most of it is the docs audit and official watcher calling haiku.

## hooks i use

these run locally during every claude code session. all bash, all reading json from stdin via `jq`.

| hook | type | what it catches | why i keep it |
|------|------|-----------------|---------------|
| **safety-guard** | PreToolUse (Bash) | dangerous commands (rm -rf, force push, etc) | blocks before execution. exit 2 = hard stop |
| **panopticon** | PostToolUse (all) | logs every tool action to ~/.claude/panopticon.db | full audit trail. useful for debugging and the /mine plugin |
| **context-save** | PreCompact | fires before context compression | the most important hook. saves a handoff.md so you never lose your plan mid-session |
| **no-squash** | PreToolUse (Bash) | blocks squash merge attempts | i want full commit history, always |
| **version-stamp** | SessionEnd | outdated "tested with" stamps | auto-updates version stamps in docs/hooks/plugins when a session touches them |
| **md-lint-fix** | PostToolUse (Write, Edit) | markdown formatting issues | auto-runs markdownlint-fix on .md files so CI never fails on lint |
| **commit-nudge** | PostToolUse (Write, Edit) | going too long without committing | soft reminder after 8 file mutations. non-blocking |
| **notify** | Notification | task complete, waiting for input | routes claude code notifications to macos native alerts |
| **stale-branch** | SessionStart | orphan local branches | reminds me to clean up branches whose remote is gone |
| **replay-capture** | PostToolUse | file mutations | silently logs every edit/write to JSONL for generating VHS tape animations |
| **knowledge-builder** | PostToolUse (Read, Grep, Glob) | file relationships discovered during exploration | builds a lightweight knowledge graph in .claude/knowledge.md |

## agents

10 subagents in `.claude/agents/`. i don't use all of them daily -- some are situational.

| agent | what it does | when i reach for it |
|-------|--------------|---------------------|
| **analyst** | free-form sql investigator for usage data | when i want to ask questions about my claude code sessions |
| **explorer** | parallel worktree experiments | testing risky changes without touching main |
| **guardian** | watches for changes, runs checks, proposes fixes (never auto-applies) | background safety net during long sessions |
| **code-sweeper** | finds dead code | periodic cleanup, usually before releases |
| **dep-checker** | scans dependencies for outdated/vulnerable/conflicting packages | before merging dependency-heavy PRs |
| **pr-narrator** | writes PR descriptions from diffs | every PR. saves 5 min each time |
| **test-writer** | generates edge-case tests (boundary conditions, error paths) | after writing new features |
| **vibe-check** | fast opinionated architecture review | pointing at a directory and asking "is this good?" |
| **changelog-writer** | generates changelog entries from merged PRs | release prep |
| **link-checker** | validates internal links and anchors | before committing docs changes, faster than waiting for CI |

## the automation philosophy

automate everything that doesn't require taste. leave the taste to me.

the workflows handle freshness, validation, competitive intel, and community monitoring. the hooks enforce conventions and capture data. the agents do the grunt work of reviews, tests, and changelogs. none of them make design decisions -- they surface information and enforce rules i already set.

my actual time investment: under 30 minutes per week reviewing what the automation produces. if CI passes, most things auto-merge.

---

tested with: claude code v2.1.77
