# claude-code-tips

Claude Code plugins, hooks, agents, skills, and resources. All tested.

## Structure

- `plugins/miner/` -- flagship: mines sessions to sqlite (echo, scar, gauge, imprint)
- `plugins/handoff/` -- context preservation before compaction
- `plugins/broadcast/` -- async notifications
- `hooks/` -- standalone hook scripts (safety-guard, panopticon, context-save, knowledge-builder, notify)
- `docs/` -- guide, hooks reference, plugin creation, subagent patterns, cli-tools, automation, mcp-servers
- `agents/` -- analyst, explorer, guardian, code-sweeper, dep-checker, pr-narrator, test-writer, vibe-check
- `skills/` -- sift, improve, ship, sweep, quicktest
- `commands/` -- ledger, stats, deps
- `scripts/` -- mine.py (bulk parser), schema.sql, README
- `gifs/` -- VHS tape files for demo GIF recordings
- `content/` -- GITIGNORED, personal drafts
- `data/` -- GITIGNORED, local mining data

## Conventions

- All hook scripts use `#!/usr/bin/env bash` with `set -euo pipefail`
- Hook scripts read JSON from stdin via `jq`
- Exit codes: 0 = allow, 2 = block
- Documentation is practical and opinionated -- no fluff
- Lowercase voice, "bc" not "because"
