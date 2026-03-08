# scripts

## mine.py

parses all Claude Code JSONL conversation logs from `~/.claude/projects/` into a normalized SQLite database at `~/.claude/miner.db`. extracts sessions, messages, tool calls, token usage, costs, and subagent relationships with full-text search.

### quick start

```bash
# full backfill — parse everything
python3 scripts/mine.py

# incremental — only new/modified files
python3 scripts/mine.py --incremental

# check what you've got
python3 scripts/mine.py --stats
```

### flags

| flag | description | example |
|---|---|---|
| *(none)* | full backfill — parse all JSONL files | `python3 mine.py` |
| `--incremental` | only parse new or modified files | `python3 mine.py --incremental` |
| `--file PATH` | parse a single JSONL file | `python3 mine.py --file ~/.claude/projects/.../abc.jsonl` |
| `--project NAME` | parse one project (partial match) | `python3 mine.py --project rudy` |
| `--since DATE` | only files modified after date | `python3 mine.py --since 2025-01-01` |
| `--workers N` | parallel workers (default: cpu count) | `python3 mine.py --workers 8` |
| `--dry-run` | report what would be parsed, don't write | `python3 mine.py --dry-run` |
| `--stats` | print DB summary and exit | `python3 mine.py --stats` |
| `--verify` | spot-check 10 random sessions against raw JSONL | `python3 mine.py --verify` |
| `--sanitize` | redact secrets (sk-..., ghp_..., etc.) | `python3 mine.py --sanitize` |
| `--export-csv` | export sessions and tool_calls as CSV | `python3 mine.py --export-csv` |
| `--vacuum` | compact the database (reclaim space) | `python3 mine.py --vacuum` |
| `--db PATH` | custom database path | `python3 mine.py --db ./local.db` |

### what `--stats` shows

- total sessions, messages, tool calls, errors
- database size and last parse time
- cost breakdown by model tier (opus, sonnet, haiku)
- top 10 projects by estimated cost
- cache efficiency (hit rate, savings multiplier)

## schema.sql

defines the full SQLite schema. applied automatically by mine.py, or manually:

```bash
sqlite3 ~/.claude/miner.db < scripts/schema.sql
```

### tables

| table | description |
|---|---|
| `sessions` | one row per JSONL file — tokens, model, timestamps, project info |
| `messages` | every user and assistant message with token usage |
| `tool_calls` | every tool invocation (name, input summary, timestamp) |
| `subagents` | subagent lifecycle tracking (parent, type, duration) |
| `errors` | tool failures and interrupts |
| `project_paths` | every location a project has lived (handles renames/moves) |
| `parse_log` | incremental parsing state (file path, mtime, status) |
| `meta` | schema version and creation time |
| `messages_fts` | FTS5 virtual table for full-text search |

### views

| view | description |
|---|---|
| `session_costs` | auto-computed USD per session (opus/sonnet/haiku pricing) |
| `project_costs` | aggregated cost, tokens, and session counts per project |
| `daily_costs` | daily spending trend (sessions, tokens, cost) |
| `tool_usage` | tool name, total uses, sessions used in, avg per session |

### querying

```bash
# total spend
sqlite3 ~/.claude/miner.db "SELECT ROUND(SUM(estimated_cost_usd), 2) FROM session_costs"

# top projects by cost
sqlite3 ~/.claude/miner.db "SELECT project_name, ROUND(estimated_cost_usd, 2) AS cost FROM project_costs ORDER BY cost DESC LIMIT 10"

# daily spending
sqlite3 ~/.claude/miner.db "SELECT * FROM daily_costs ORDER BY date DESC LIMIT 7"

# full-text search
sqlite3 ~/.claude/miner.db "SELECT m.session_id, m.content_preview FROM messages m JOIN messages_fts f ON m.id = f.rowid WHERE messages_fts MATCH 'streaming bug' LIMIT 5"

# most used tools
sqlite3 ~/.claude/miner.db "SELECT * FROM tool_usage ORDER BY total_uses DESC LIMIT 10"
```
