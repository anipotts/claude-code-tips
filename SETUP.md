# setup

> get everything running in 5 minutes. pick what you want.

## 1. install the mine plugin

```bash
claude plugin add anipotts/claude-code-tips
```

what it gives you: session mining to sqlite, `/mine` command for search, error memory, cost tracking, hotspots, and loop detection.

## 2. add hooks you want

copy the hook config into your project's `.claude/settings.json` hooks section. pick what you need:

| hook | what it does | hook type |
|------|-------------|-----------|
| `safety-guard` | blocks force push, `rm -rf`, `DROP TABLE`, other dangerous commands | PreToolUse |
| `context-save` | saves a handoff markdown before context compaction so you never lose progress | PreCompact |
| `panopticon` | logs every tool action to `~/.claude/panopticon.db` for audit | PostToolUse |
| `notify` | routes claude code notifications (task complete, errors) to your system | Notification |
| `commit-nudge` | reminds you to commit after N file mutations (non-blocking) | PostToolUse |
| `replay-capture` | logs file mutations to JSONL for session replay animations | PostToolUse |
| `no-squash` | blocks squash merges — preserves commit history | PreToolUse |
| `version-stamp` | auto-updates "tested with" version stamps on session end | SessionEnd |
| `md-lint-fix` | auto-runs markdownlint-fix on any written/edited `.md` file | PostToolUse |
| `stale-branch` | reminds you to clean up branches with deleted remotes on session start | SessionStart |

start with `safety-guard` + `context-save`. add more as needed.

## 3. try the agents

agents auto-discover from the plugin. the three most useful:

- **analyst** -- analyzes your session data, surfaces patterns and costs
- **guardian** -- reviews code for security and quality issues before merge
- **test-writer** -- generates tests for changed files

run any agent with `/agents` in claude code.

## 4. explore the docs

- beginner: [docs/guide.md](docs/guide.md) -- concepts, mental model, first steps
- intermediate: [docs/hooks-reference.md](docs/hooks-reference.md) -- every hook explained with examples
- advanced: [docs/subagent-patterns.md](docs/subagent-patterns.md) -- orchestrating multiple agents

## what NOT to do

- don't install everything at once -- start with mine + safety-guard, expand from there
- don't skip the hooks guide -- it explains the mental model (hook types, matchers, exit codes)

---

tested with: claude code v2.1.77
