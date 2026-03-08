<!-- tested with: claude code v1.0.34 -->

# /ledger

> **deprecated** — use `/miner` instead. `/miner` does everything `/ledger` did with natural language routing.

## migration

| old command | new command |
|---|---|
| `/ledger` | `/miner` (shows dashboard) |
| `/ledger project` | `/miner health` |

## the prompt

`````
The user ran /ledger. This command has been consolidated into /miner.

Tell the user: "/ledger has been merged into /miner. just run /miner for the dashboard, or /miner health for project stats."

Then go ahead and show the dashboard — query ~/.claude/miner.db via Bash using sqlite3 -header -column:

1. Today's sessions:
```sql
SELECT COUNT(*) AS sessions,
       COALESCE(SUM(total_input_tokens + total_output_tokens), 0) AS total_tokens,
       COALESCE(SUM(duration_active_seconds), 0) AS active_seconds
FROM sessions
WHERE date(start_time) = date('now') AND is_subagent = 0;
```

2. This week's cost:
```sql
SELECT COALESCE(SUM(estimated_cost_usd), 0) AS week_cost,
       COUNT(*) AS sessions
FROM session_costs WHERE start_time >= date('now', '-7 days');
```

3. Top 5 tools (7d):
```sql
SELECT tool_name, COUNT(*) AS uses FROM tool_calls
WHERE timestamp >= date('now', '-7 days')
GROUP BY tool_name ORDER BY uses DESC LIMIT 5;
```

If the database doesn't exist, tell the user to install the miner plugin.
`````
