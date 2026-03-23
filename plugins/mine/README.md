<!-- tested with: claude code v2.1.81 -->
# mine

mines every claude code session into a local sqlite database. total recall for your dev work.

## what it does

mine runs 5 hooks across the claude code session lifecycle via a single python dispatcher (`hook.py`), building a searchable history of everything you do. the database lives at `~/.claude/mine.db`.

### hooks

| event | handler | behavior |
|---|---|---|
| SessionEnd | `ingest` | parses session + subagent transcripts into mine.db (async) |
| SubagentStop | `subagent` | parses a single subagent transcript on completion |
| PreCompact | `precompact` | increments compaction_count + cost anomaly warning if >2x average |
| SessionStart | `startup` | project move detection, solution recall, auto-backfill |
| PostToolUseFailure | `mistakes` | records errors, surfaces past similar failures to prevent repeats |

all hooks are handled by `hooks/hook.py` — one file, zero bash scripts, zero jq dependency.

### query skill

`/mine` gives you 20 query intents: dashboard, cost, value, search, cache, projects, tools, models, mistakes, hotspots, loops, workflows, story, compare, and more. just ask in plain language.

## install

```bash
claude plugin marketplace add anipotts/claude-code-tips
claude plugin install mine@claude-code-tips
```

## requirements

- `python3` — for transcript parsing and hook handlers (stdlib only, no pip packages)
- `sqlite3` — for `/mine` skill queries (ships with macOS and most linux)

## config

create `~/.claude/mine.json` to toggle individual features:

```json
{
  "ingest": true,
  "search": true,
  "mistakes": true,
  "burn": true,
  "move_detect": true,
  "compact": true,
  "auto_backfill": true
}
```

all features default to enabled. set any to `false` to disable.

## database

schema: `scripts/schema.sql`. key views:

| view | what it does |
|---|---|
| `user_session_costs` | per-session cost (user sessions only, no subagents) |
| `user_tool_calls` | tool calls with project context (user sessions only) |
| `project_top_model` | most-used model per project |
| `project_costs` | per-project cost, session count, date range |
| `daily_costs` | per-day cost and token totals |

```bash
# quick stats
python3 scripts/mine.py --stats

# total lifetime API value
sqlite3 ~/.claude/mine.db "SELECT printf('\$%,.2f', SUM(estimated_cost_usd)) FROM user_session_costs;"

# backfill all history
python3 scripts/mine.py --workers 8
```
