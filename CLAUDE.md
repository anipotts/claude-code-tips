# claude-code-tips

personal claude code setup, open source. hooks, example agents/commands, opinionated docs. the mine plugin lives at [anipotts/mine](https://github.com/anipotts/mine).

## Structure

- `hooks/` · standalone hook scripts (safety-guard, panopticon, context-save, notify, no-squash, version-stamp, md-lint-fix, stale-branch, commit-nudge)
- `.claude/commands/` · slash commands i actually use (ship, improve)
- `examples/agents/` · example agents (watch-tests, try-worktree, arch-review, write-pr)
- `examples/commands/` · example commands (sweep, quicktest, replay)
- `examples/claude-md/` · CLAUDE.md templates for different stacks
- `examples/plugins/` · demo plugins (handoff, broadcast)
- `docs/` · personal takes (hooks, agents, automation, worktrees, cost, mistakes, session-workflow, my-stack)
- `docs/tips/` · standalone tips (prompt-caching, ultrathink, settings-hierarchy, safety-hooks, session-length, plugins, subagents, mcp-integration, plan-mode, fast-mode, hooks-v2, context-management)
- `docs/comparisons/` · competitor comparisons (cursor, codex, gemini, antigravity, pricing)
- `gifs/` · VHS tape files and demo recordings
- `content/` · GITIGNORED, personal drafts
- `data/` · GITIGNORED, local mining data
- `handoffs/` · GITIGNORED, private handoff prompts

## Conventions

- All hook scripts use `#!/usr/bin/env bash` with `set -euo pipefail`
- Hook scripts read JSON from stdin via `jq`
- Exit codes: 0 = allow, 2 = block
- Documentation is practical and opinionated · no fluff
- Lowercase voice, "bc" not "because"
- Comparison docs: diplomatic, data-driven. cite sources (pricing pages, changelogs). no FUD, no unsourced claims
- Every doc/hook/plugin should include "tested with Claude Code vX.Y.Z"
- CI validates: markdown lint, link check, hook syntax, JSON, python syntax, plugin smoke test

## Private content boundaries

- `handoffs/` is GITIGNORED · never commit, push, or reference handoff files in public docs
- `content/` is GITIGNORED · personal drafts, never commit
- `data/` is GITIGNORED · local mining data, never commit
- course-related dev files live in `handoffs/` and stay local
- never create handoff/course files outside of `handoffs/`
