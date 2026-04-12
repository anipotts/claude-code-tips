# mine

claude code plugin that mines every session into a local sqlite database.

## structure

- `.claude-plugin/plugin.json` — plugin manifest
- `hooks/hook.py` — unified hook dispatcher (all events, one file)
- `hooks/hooks.json` — hook event registrations
- `scripts/mine.py` — bulk session parser (backfill, incremental, export)
- `scripts/schema.sql` — database schema
- `skills/mine/SKILL.md` — /mine skill (query intent routing)
- `skills/help/SKILL.md` — /mine:help skill
- `tests/` — 125 tests for mine.py

## conventions

- all hooks handled by hook.py — no bash, no jq
- stdout = visible to claude (warnings, search recall)
- stderr = debug logging only
- database at ~/.claude/mine.db
- all SQL uses parameterized queries
