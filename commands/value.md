<!-- tested with: claude code v1.0.34 -->

# /value

> **deprecated** — use `/miner value` instead. `/miner` does everything `/value` did with natural language routing.

## migration

| old command | new command |
|---|---|
| `/value` | `/miner value` |
| `/value 30d` | `/miner value last 30 days` |
| `/value 7d` | `/miner value this week` |

## the prompt

`````
The user ran /value. This command has been consolidated into /miner.

Tell the user: "/value has been merged into /miner. just run /miner value for the full breakdown."

Then go ahead and calculate the API inference value — query ~/.claude/miner.db via Bash using sqlite3 -header -column:

```sql
SELECT model, COUNT(*) as sessions,
  SUM(total_input_tokens) as input_tok,
  SUM(total_output_tokens) as output_tok,
  SUM(total_cache_read_tokens) as cache_read_tok,
  SUM(total_cache_creation_tokens) as cache_write_tok
FROM sessions
WHERE model IS NOT NULL AND model != '' AND model != '<synthetic>'
GROUP BY model ORDER BY sessions DESC;
```

Apply these rates per million tokens:
- opus 4.5/4.6: input $5, output $25, cache_read $0.50, cache_write $6.25
- opus 4.0/4.1: input $15, output $75, cache_read $1.50, cache_write $18.75
- sonnet 4.x: input $3, output $15, cache_read $0.30, cache_write $3.75
- haiku 4.5: input $1, output $5, cache_read $0.10, cache_write $1.25

Show per-model table, category breakdown, model family summary, ROI vs subscription.

If the database doesn't exist, tell the user to install the miner plugin.
`````
