# miner

mines every claude code session into a local sqlite database. total recall for your dev work.

<img src="../../gifs/query-cost.gif" width="100%" alt="project_costs VIEW showing spending by project" />

## what it does

miner runs 7 hooks across the claude code session lifecycle, building a searchable history of everything you do. the database lives at `~/.claude/miner.db` and uses the schema from `scripts/schema.sql`.

four named features surface that history back to you:

### echo (solution recall)

fires on SessionStart. queries your past sessions for this project and surfaces recent prompts and context so claude knows what you were working on. no more re-explaining.

### scar (mistake memory)

fires on PostToolUseFailure. records every tool failure and looks for patterns. if the same tool has failed the same way before in this project, it warns claude before it makes the same mistake again.

### gauge (model advisor)

fires on UserPromptSubmit. classifies your prompt as simple or complex and nudges you if your current model is overkill or underpowered. saves money on lookups, saves time on architecture.

### imprint (stack recall)

fires on SessionStart. detects your project stack from manifest files (package.json, Cargo.toml, requirements.txt, go.mod) and connects it to patterns from your other projects.

## all hooks

| hook | event | behavior |
|---|---|---|
| `ingest.sh` | SessionEnd (async) | parses session + subagent transcripts into miner.db |
| `subagent.sh` | SubagentStop | parses a single subagent transcript on completion |
| `compact.sh` | PreCompact | increments compaction_count for the session |
| `tool-log.sh` | PostToolUse | logs every tool call (<100ms, fires on every tool) |
| `startup.sh` | SessionStart | project move detection + echo + imprint (3-in-1) |
| `scar.sh` | PostToolUseFailure | mistake memory + pattern surfacing |
| `gauge.sh` | UserPromptSubmit | model advisor |

## install

```bash
claude plugin add anipotts/claude-code-tips --plugin miner
```

or manually copy the plugin directory and add to `.claude/settings.json`.

after installing, make the hooks executable:

```bash
chmod +x plugins/miner/hooks/*.sh
```

## config

create `~/.claude/miner.json` to toggle individual features:

```json
{
  "ingest": true,
  "echo": true,
  "scar": true,
  "gauge": true,
  "imprint": true,
  "move_detect": true,
  "tool_log": true,
  "compact": true
}
```

all features default to enabled. set any to `false` to disable.

## requirements

- `jq` -- for parsing hook payloads (standard on most systems)
- `sqlite3` -- for database operations (ships with macOS and most linux)
- `python3` -- for `scripts/mine.py` transcript parsing (ingest + subagent hooks only)

## database

the database lives at `~/.claude/miner.db`. schema is defined in `scripts/schema.sql`.

### quick stats

```bash
python3 scripts/mine.py --stats
```

shows sessions, messages, tool calls, tokens, cost breakdown by model and project, cache efficiency.

### cost tracking

<img src="../../gifs/query-daily.gif" width="100%" alt="daily_costs VIEW showing spending trend" />

miner tracks all token usage per session: input, output, cache creation, and cache read. the `session_costs` view auto-computes USD estimates at API pricing (opus $15/$75, sonnet $3/$15, haiku $0.80/$4 per 1M tokens, with cache discounts).

this tells you what your usage _would_ cost at API rates — useful for understanding the value of a Max subscription or tracking actual API spend.

convenience views:

| view | what it does |
|---|---|
| `session_costs` | per-session cost estimate with token breakdown |
| `project_costs` | per-project cost, session count, date range |
| `daily_costs` | per-day cost and token totals (for trends) |
| `tool_usage` | tool frequency, sessions used in, avg per session |

```bash
# total lifetime cost
sqlite3 ~/.claude/miner.db "SELECT printf('\$%,.2f', SUM(estimated_cost_usd)) FROM session_costs;"

# cost by project
sqlite3 ~/.claude/miner.db "SELECT project_name, printf('\$%,.2f', estimated_cost_usd) AS cost FROM project_costs ORDER BY estimated_cost_usd DESC LIMIT 10;"

# daily spend this week
sqlite3 ~/.claude/miner.db "SELECT date, printf('\$%,.2f', estimated_cost_usd) AS cost FROM daily_costs WHERE date >= date('now', '-7 days');"

# cache efficiency
sqlite3 ~/.claude/miner.db "SELECT printf('%.1f%%', SUM(cache_read_tokens) * 100.0 / SUM(input_tokens + cache_creation_tokens + cache_read_tokens)) AS hit_rate FROM project_costs;"
```

### how costs are calculated

the API reports four token buckets per request:

| bucket | what it is | opus price |
|---|---|---|
| `input_tokens` | non-cached input | $15/1M |
| `cache_read_input_tokens` | context re-read from cache | $1.50/1M (90% off) |
| `cache_creation_input_tokens` | new context written to cache | $18.75/1M (25% premium) |
| `output_tokens` | claude's response | $75/1M |

in a typical claude code session, **90%+ of the cost is cache tokens** — every tool call re-sends the conversation context. a long opus session with 100+ tool calls can easily generate billions of cache read tokens.

**important:** `input_tokens` is already the non-cached portion. the total input sent to the model = `input_tokens + cache_creation + cache_read`. don't subtract cache from input — they're separate buckets.

### raw queries

```bash
# sessions today
sqlite3 ~/.claude/miner.db "SELECT project_name, model, start_time FROM sessions WHERE date(start_time) = date('now');"

# most used tools
sqlite3 ~/.claude/miner.db "SELECT tool_name, total_uses FROM tool_usage ORDER BY total_uses DESC LIMIT 10;"

# full-text search past prompts
sqlite3 ~/.claude/miner.db "SELECT content_preview FROM messages_fts WHERE messages_fts MATCH 'streaming';"

# backfill all history
python3 scripts/mine.py --workers 8
```
