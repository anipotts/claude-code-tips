# claude-code-tips

Claude Code plugins, hooks, agents, skills, and resources. All tested.

## Structure

- `plugins/mine/` -- flagship: mines sessions to sqlite (search, mistakes, burn, hotspots, loops)
- `plugins/handoff/` -- context preservation before compaction
- `plugins/broadcast/` -- async notifications
- `hooks/` -- standalone hook scripts (safety-guard, panopticon, context-save, notify, no-squash, version-stamp, md-lint-fix, stale-branch)
- `docs/` -- guide, hooks reference, plugin creation, subagent patterns, cli-tools, automation, mcp-servers, comparisons, troubleshooting, glossary, resources
- `.claude/commands/` -- slash commands (mine, improve, ship, sweep, quicktest, stats, deps, sift, ledger, value)
- `.claude/agents/` -- agents (analyst, explorer, guardian, code-sweeper, dep-checker, pr-narrator, test-writer, vibe-check)
- `scripts/` -- mine.py (bulk parser), schema.sql, README
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
- CI validates: markdown lint, link check, hook syntax, JSON, python syntax
