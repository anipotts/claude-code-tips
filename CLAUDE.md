# claude-code-tips

personal claude code setup, open source. one installable plugin (mine), hooks, example agents/commands, and opinionated docs.

## Structure

- `plugins/mine/` -- flagship: mines sessions to sqlite (search, mistakes, burn, hotspots, loops)
- `hooks/` -- standalone hook scripts (safety-guard, panopticon, context-save, notify, no-squash, version-stamp, md-lint-fix, stale-branch, commit-nudge, replay-capture, knowledge-builder)
- `.claude/commands/` -- slash commands i actually use (mine, mine-help, ship, improve)
- `examples/agents/` -- example agents (watch-tests, try-worktree, arch-review, write-pr)
- `examples/commands/` -- example commands (sweep, quicktest, replay)
- `examples/claude-md/` -- CLAUDE.md templates for different stacks
- `examples/plugins/` -- demo plugins (handoff, broadcast)
- `docs/` -- personal takes (hooks, agents, automation, worktrees, cost, mistakes, session-workflow, my-stack)
- `docs/comparisons/` -- competitor comparisons (cursor, codex, gemini, antigravity, pricing)
- `scripts/` -- mine.py (bulk parser), schema.sql, dashboard.py
- `tests/` -- 125 tests for mine.py
- `gifs/` -- VHS tape files and demo recordings
- `content/` -- GITIGNORED, personal drafts
- `data/` -- GITIGNORED, local mining data
- `handoffs/` -- GITIGNORED, private handoff prompts (course, monetization, etc)

## Conventions

- All hook scripts use `#!/usr/bin/env bash` with `set -euo pipefail`
- Hook scripts read JSON from stdin via `jq`
- Exit codes: 0 = allow, 2 = block
- Documentation is practical and opinionated -- no fluff
- Lowercase voice, "bc" not "because"
- Comparison docs: diplomatic, data-driven. cite sources (pricing pages, changelogs). no FUD, no unsourced claims
- Every doc/hook/plugin should include "tested with Claude Code vX.Y.Z"
- CI validates: markdown lint, link check, hook syntax, JSON, python syntax, plugin smoke test

## Private content boundaries

- `handoffs/` is GITIGNORED -- never commit, push, or reference handoff files in public docs
- `content/` is GITIGNORED -- personal drafts, never commit
- `data/` is GITIGNORED -- local mining data, never commit
- course-related dev files live in `handoffs/` and stay local
- never create handoff/course files outside of `handoffs/`
