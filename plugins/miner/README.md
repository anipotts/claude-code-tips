# miner

mines every claude code session into a local sqlite database. total recall for your dev work.

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

the database lives at `~/.claude/miner.db`. schema is defined in `scripts/schema.sql`. query it directly:

```bash
# sessions today
sqlite3 ~/.claude/miner.db "SELECT project_name, model, start_time FROM sessions WHERE date(start_time) = date('now');"

# most used tools
sqlite3 ~/.claude/miner.db "SELECT tool_name, COUNT(*) as n FROM tool_calls GROUP BY tool_name ORDER BY n DESC LIMIT 10;"

# search past prompts
sqlite3 ~/.claude/miner.db "SELECT content_preview FROM messages_fts WHERE messages_fts MATCH 'streaming';"

# cost per project
sqlite3 ~/.claude/miner.db "SELECT project_name, printf('$%.2f', SUM(estimated_cost_usd)) FROM session_costs GROUP BY project_name ORDER BY SUM(estimated_cost_usd) DESC;"
```
