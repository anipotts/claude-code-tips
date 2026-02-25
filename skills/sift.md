---
name: sift
description: query your claude code usage history from miner.db — search, costs, tools, patterns
allowed-tools:
  - Bash
  - Read
---

# /sift

dig into your claude code usage data. search conversations, check costs, find patterns, spot waste. all powered by sqlite3 queries against `~/.claude/miner.db`

## what it does

takes a subcommand and runs the right query against your miner database. think of it as a CLI for your usage history — everything from full-text search to cost analysis to tool usage patterns

## subcommands

### search

full-text search across all your conversations:

```
/sift search <term>
```

### top tools

what tools you use most:

```
/sift top tools
```

### cost this month

how much you've spent:

```
/sift cost this month
```

### projects

project activity breakdown:

```
/sift projects
```

### cache efficiency

how well prompt caching is working:

```
/sift cache efficiency
```

### workflows

most common tool-to-tool sequences:

```
/sift workflows
```

### wasted

sessions with high token usage and lots of errors (the ones that hurt):

```
/sift wasted
```

### models

model usage breakdown:

```
/sift models
```

### project (specific)

everything about one project across all paths:

```
/sift project <name>
```

## the prompt

```
When the user runs /sift, parse the subcommand and run the appropriate sqlite3 query against ~/.claude/miner.db.

If the database doesn't exist, tell the user to install the miner plugin and stop.

Always run queries via Bash: sqlite3 -header -column ~/.claude/miner.db "<query>"

## Subcommands

### /sift search <term>

Full-text search across conversation content:

```sql
SELECT m.id, m.session_id, m.role, m.timestamp,
       snippet(messages_fts, 0, '>>>', '<<<', '...', 40) AS match
FROM messages_fts
JOIN messages m ON m.id = messages_fts.rowid
WHERE messages_fts MATCH '<term>'
ORDER BY m.timestamp DESC
LIMIT 20;
```

Format results as a table showing timestamp, role (user/assistant), and the matched snippet with context.

### /sift top tools

Tool usage frequency from the last 30 days:

```sql
SELECT tool_name,
       COUNT(*) AS total_uses,
       COUNT(DISTINCT session_id) AS sessions_used_in,
       ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT session_id), 1) AS avg_per_session
FROM tool_calls
WHERE timestamp >= date('now', '-30 days')
GROUP BY tool_name
ORDER BY total_uses DESC
LIMIT 15;
```

### /sift cost this month

Token costs from the session_costs view:

```sql
SELECT project_name,
       COUNT(*) AS sessions,
       SUM(total_input_tokens) AS input_tokens,
       SUM(total_output_tokens) AS output_tokens,
       ROUND(SUM(estimated_cost_usd), 2) AS cost_usd
FROM session_costs
WHERE start_time >= date('now', 'start of month')
GROUP BY project_name
ORDER BY cost_usd DESC;
```

Also show the total:

```sql
SELECT COUNT(*) AS total_sessions,
       SUM(total_input_tokens) AS total_input,
       SUM(total_output_tokens) AS total_output,
       ROUND(SUM(estimated_cost_usd), 2) AS total_cost
FROM session_costs
WHERE start_time >= date('now', 'start of month');
```

### /sift projects

Project activity overview:

```sql
SELECT s.project_name,
       COUNT(*) AS sessions,
       SUM(s.total_input_tokens + s.total_output_tokens) AS total_tokens,
       ROUND(SUM(sc.estimated_cost_usd), 2) AS cost_usd,
       MAX(s.start_time) AS last_active,
       SUM(s.tool_use_count) AS tool_calls
FROM sessions s
JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name IS NOT NULL
  AND s.is_subagent = 0
GROUP BY s.project_name
ORDER BY last_active DESC
LIMIT 15;
```

### /sift cache efficiency

Cache hit ratio — how well prompt caching is working:

```sql
SELECT model,
       SUM(total_cache_read_tokens) AS cache_hits,
       SUM(total_cache_creation_tokens) AS cache_writes,
       SUM(total_input_tokens - total_cache_read_tokens - total_cache_creation_tokens) AS uncached,
       ROUND(
         SUM(total_cache_read_tokens) * 100.0 /
         NULLIF(SUM(total_cache_read_tokens + total_cache_creation_tokens +
                    (total_input_tokens - total_cache_read_tokens - total_cache_creation_tokens)), 0),
         1
       ) AS cache_hit_pct
FROM sessions
WHERE start_time >= date('now', '-7 days')
  AND total_input_tokens > 0
GROUP BY model
ORDER BY cache_hit_pct DESC;
```

Add a note: above 60% is good, above 80% is excellent. Below 40% means your system prompts might not be hitting the 4096 token cache minimum.

### /sift workflows

Tool call bigrams — most common tool-to-tool sequences:

```sql
WITH ordered AS (
  SELECT session_id, tool_name,
         LAG(tool_name) OVER (PARTITION BY session_id ORDER BY timestamp, id) AS prev_tool
  FROM tool_calls
  WHERE timestamp >= date('now', '-7 days')
)
SELECT prev_tool || ' -> ' || tool_name AS workflow,
       COUNT(*) AS occurrences
FROM ordered
WHERE prev_tool IS NOT NULL
GROUP BY prev_tool, tool_name
ORDER BY occurrences DESC
LIMIT 15;
```

### /sift wasted

Sessions with high token usage and many errors — the expensive failures:

```sql
SELECT s.id,
       s.project_name,
       s.start_time,
       s.total_input_tokens + s.total_output_tokens AS total_tokens,
       ROUND(sc.estimated_cost_usd, 2) AS cost_usd,
       (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) AS error_count,
       s.first_user_prompt
FROM sessions s
JOIN session_costs sc ON s.id = sc.id
WHERE (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) >= 3
  AND s.total_input_tokens + s.total_output_tokens > 50000
ORDER BY total_tokens DESC
LIMIT 10;
```

### /sift models

Model usage breakdown:

```sql
SELECT model,
       COUNT(*) AS sessions,
       SUM(total_input_tokens) AS input_tokens,
       SUM(total_output_tokens) AS output_tokens,
       ROUND(SUM(sc.estimated_cost_usd), 2) AS cost_usd,
       ROUND(AVG(total_output_tokens), 0) AS avg_output
FROM sessions s
JOIN session_costs sc ON s.id = sc.id
WHERE s.start_time >= date('now', '-30 days')
GROUP BY model
ORDER BY sessions DESC;
```

### /sift project <name>

All sessions for a specific project, across ALL paths it's ever lived at:

```sql
-- first show all known paths
SELECT project_dir, cwd, session_count, first_seen, last_seen
FROM project_paths
WHERE project_name LIKE '%<name>%';

-- then show recent sessions
SELECT s.id, s.start_time, s.model,
       s.total_input_tokens + s.total_output_tokens AS tokens,
       s.tool_use_count,
       ROUND(sc.estimated_cost_usd, 2) AS cost,
       s.first_user_prompt
FROM sessions s
JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%'
ORDER BY s.start_time DESC
LIMIT 20;
```

## Rules
- Always use `-header -column` flags for readable output
- Format the output as clean markdown tables
- If a subcommand isn't recognized, list available subcommands
- Read-only. Never write to the database
- If a query returns no results, say so — don't show empty tables
- For token counts over 10K, use K/M suffixes (e.g. "142K", "1.2M")
```

## why this exists

miner.db is a goldmine but raw sql is tedious. these are the queries you'd write yourself after staring at your token bill. the cache efficiency one alone has saved me real money — turns out half my projects weren't hitting the cache minimum

`/sift wasted` is brutal but useful. shows you exactly which sessions burned tokens spinning in circles. learn from those
