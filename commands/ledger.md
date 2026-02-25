# /ledger

quick dashboard for your claude code usage. sessions, tokens, costs, tools — all from miner.db

## what it does

runs sqlite3 queries against `~/.claude/miner.db` (populated by the miner plugin) and gives you a snapshot of today's activity, weekly spend, top tools, and most active projects. read-only, fast, no side effects

## the command

```
/ledger
```

## the prompt

```
When the user runs /ledger, query ~/.claude/miner.db and present a usage dashboard.

Run all queries via Bash using sqlite3. If the database doesn't exist, tell the user to install the miner plugin first and stop.

## Check DB exists

```bash
if [ ! -f ~/.claude/miner.db ]; then
  echo "no miner.db found — install the miner plugin first"
  exit 1
fi
```

## Query 1: Today's sessions

```sql
SELECT COUNT(*) AS sessions,
       COALESCE(SUM(total_input_tokens + total_output_tokens), 0) AS total_tokens,
       COALESCE(SUM(total_output_tokens), 0) AS output_tokens,
       COALESCE(SUM(duration_active_seconds), 0) AS active_seconds
FROM sessions
WHERE date(start_time) = date('now')
  AND is_subagent = 0;
```

## Query 2: Token spend this week

```sql
SELECT COALESCE(SUM(estimated_cost_usd), 0) AS week_cost,
       COALESCE(SUM(total_input_tokens + total_output_tokens), 0) AS week_tokens
FROM session_costs
WHERE start_time >= date('now', '-7 days');
```

## Query 3: Top 5 tools (last 7 days)

```sql
SELECT tool_name, COUNT(*) AS uses
FROM tool_calls
WHERE timestamp >= date('now', '-7 days')
GROUP BY tool_name
ORDER BY uses DESC
LIMIT 5;
```

## Query 4: Top 3 active projects (last 7 days)

```sql
SELECT project_name, COUNT(*) AS sessions,
       COALESCE(SUM(total_input_tokens + total_output_tokens), 0) AS tokens
FROM sessions
WHERE start_time >= date('now', '-7 days')
  AND project_name IS NOT NULL
  AND is_subagent = 0
GROUP BY project_name
ORDER BY sessions DESC
LIMIT 3;
```

## Query 5: Model breakdown today

```sql
SELECT model, COUNT(*) AS sessions,
       COALESCE(SUM(total_output_tokens), 0) AS output_tokens
FROM sessions
WHERE date(start_time) = date('now')
  AND is_subagent = 0
GROUP BY model;
```

## Output format

# ledger

**today**
| metric | value |
|---|---|
| sessions | X |
| total tokens | X |
| output tokens | X |
| active time | Xm |

**this week**
| metric | value |
|---|---|
| estimated cost | $X.XX |
| total tokens | X |

**top tools** (7d)
| tool | uses |
|---|---|
| Bash | 142 |
| Read | 98 |

**active projects** (7d)
| project | sessions | tokens |
|---|---|---|
| rudy | 12 | 340K |

**models today**
| model | sessions | output tokens |
|---|---|---|
| claude-sonnet-4-6 | 5 | 12K |

## Rules
- Format token counts with commas (1,234,567) or K/M suffixes for readability
- Round cost to 2 decimal places
- Format active time as minutes (e.g. "47m") or hours+minutes ("2h 13m")
- If any query returns no results, show "—" not empty tables
- Keep it compact — this is a glance-at dashboard, not a report
- Read-only. Never write to the database
```

## example output

```
ledger

today
| metric        | value   |
|---------------|---------|
| sessions      | 4       |
| total tokens  | 127K    |
| output tokens | 18K     |
| active time   | 47m     |

this week
| metric         | value   |
|----------------|---------|
| estimated cost | $3.42   |
| total tokens   | 892K    |

top tools (7d)
| tool   | uses |
|--------|------|
| Bash   | 142  |
| Read   | 98   |
| Edit   | 67   |
| Grep   | 54   |
| Write  | 31   |

active projects (7d)
| project           | sessions | tokens |
|-------------------|----------|--------|
| rudy              | 12       | 340K   |
| claude-code-tips  | 8        | 210K   |
| hey               | 3        | 45K    |

models today
| model             | sessions | output tokens |
|-------------------|----------|---------------|
| claude-sonnet-4-6 | 3        | 14K           |
| claude-haiku-4-5  | 1        | 4K            |
```

fast way to check if you're burning tokens or if your cache is actually working. pairs well with `/sift cache efficiency` for deeper analysis
