# claude-code-tips

Claude Code toolkit: one installable plugin (mine), a reference library of hooks/agents/commands, and docs.

## Structure

- `plugins/mine/` -- flagship: mines sessions to sqlite (search, mistakes, burn, hotspots, loops)
- `hooks/` -- standalone hook scripts (safety-guard, panopticon, context-save, notify, no-squash, version-stamp, md-lint-fix, stale-branch, commit-nudge, replay-capture, knowledge-builder)
- `.claude/agents/` -- agents (analyst, explorer, guardian, code-sweeper, dep-checker, pr-narrator, test-writer, vibe-check, changelog-writer, link-checker)
- `.claude/commands/` -- slash commands (mine, improve, ship, sweep, quicktest, stats, deps, replay)
- `docs/concepts/` -- tool-agnostic content (subagent-patterns, automation, cost-optimization)
- `docs/claude-code/` -- Claude Code specific (guide, hooks-reference, plugin-creation, mcp-servers, cli-tools, agent-teams, troubleshooting)
- `docs/comparisons/` -- competitor comparisons (cursor, codex, gemini, antigravity, pricing)
- `docs/tips/` -- personal takes and opinionated workflow advice
- `examples/` -- CLAUDE.md templates, demo plugins (handoff, broadcast)
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
