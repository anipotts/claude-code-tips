---
name: miner
description: usage stats, costs, search, tools
allowed-tools:
  - Bash
  - Read
---

# /miner

one command for everything in your usage data. just ask what you want to know in plain language

## examples

```
/miner                          → dashboard: today's sessions, weekly cost, top tools
/miner how much have i spent    → cost breakdown by project, model, time period
/miner value                    → full API inference value at published rates, ROI
/miner search "websocket"       → full-text search across all conversations
/miner what's my cache hit rate → cache efficiency analysis
/miner wasted sessions          → expensive failures with high errors
/miner top projects             → project activity ranking
/miner this week                → everything from the last 7 days
/miner compare models           → model usage and cost comparison
/miner health                   → project health: codebase size, git activity, tests
/miner backfill                 → re-mine recent sessions into the database
```

<!-- PROMPT:START — keep in sync with plugins/miner/skills/miner/SKILL.md -->
`````
When the user runs /miner, interpret their intent and query ~/.claude/miner.db accordingly.

## Step 0: Check database exists and is fresh

Run this FIRST as a single Bash call:

```bash
DB=~/.claude/miner.db
if [ ! -f "$DB" ]; then
  echo "NO_DB"
  exit 0
fi
LATEST=$(sqlite3 -noheader "$DB" "SELECT MAX(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
TOTAL=$(sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
FIRST=$(sqlite3 -noheader "$DB" "SELECT MIN(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
NEWEST_JSONL=$(find ~/.claude/projects -name "*.jsonl" -newer "$DB" 2>/dev/null | head -1)
if [ -n "$NEWEST_JSONL" ]; then
  echo "STALE|$FIRST|$LATEST|$TOTAL"
  # try to auto-backfill
  for p in ./scripts/mine.py ./plugins/miner/scripts/mine.py \
    $(find ~/.claude/plugins -path "*/miner/scripts/mine.py" 2>/dev/null | head -1); do
    if [ -f "$p" ]; then python3 "$p" --incremental 2>&1; break; fi
  done
  # re-read after backfill
  LATEST=$(sqlite3 -noheader "$DB" "SELECT MAX(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
  TOTAL=$(sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
  FIRST=$(sqlite3 -noheader "$DB" "SELECT MIN(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
  echo "REFRESHED|$FIRST|$LATEST|$TOTAL"
else
  echo "FRESH|$FIRST|$LATEST|$TOTAL"
fi
```

- If NO_DB: tell the user "no miner.db found — install the miner plugin or run `python3 scripts/mine.py` from the repo"
- If STALE: the backfill ran automatically. note it briefly ("backfilled X sessions") then proceed
- If FRESH: proceed directly
- Save FIRST, LATEST, TOTAL for the freshness line

## Step 1: Intent routing

Interpret the user's message and choose the appropriate analysis. If no argument is given, show the dashboard.

**CRITICAL: run ALL queries for an intent in a SINGLE Bash call using a heredoc or semicolons. Parse the output yourself and present ONE clean formatted result. NEVER show raw SQL output or intermediate bash calls to the user.**

### DASHBOARD (no argument, or "status", "overview", "today")

Run all dashboard queries in one call:
```bash
sqlite3 -header -separator '|' ~/.claude/miner.db <<'SQL'
SELECT 'TODAY' s, COUNT(*) sessions, COALESCE(SUM(total_input_tokens + total_output_tokens), 0) tokens, COALESCE(SUM(duration_active_seconds), 0) secs FROM sessions WHERE date(start_time) = date('now') AND is_subagent = 0;
SELECT 'WEEK' s, COALESCE(ROUND(SUM(estimated_cost_usd), 2), 0) cost, COUNT(*) sessions FROM session_costs WHERE start_time >= date('now', '-7 days') AND is_subagent = 0;
SELECT 'TOOLS' s, tc.tool_name, COUNT(*) uses FROM tool_calls tc JOIN sessions s2 ON tc.session_id = s2.id WHERE tc.timestamp >= date('now', '-7 days') AND s2.is_subagent = 0 GROUP BY tc.tool_name ORDER BY uses DESC LIMIT 5;
SELECT 'MODELS' s, model, COUNT(*) sessions FROM sessions WHERE date(start_time) = date('now') AND is_subagent = 0 GROUP BY model;
SQL
```

Format as a compact dashboard with sections. Start with the data freshness line.

### VALUE ("value", "roi", "inference", "how much is my usage worth", "api value")

```sql
SELECT model, COUNT(*) as sessions,
  SUM(total_input_tokens) as input_tok,
  SUM(total_output_tokens) as output_tok,
  SUM(total_cache_read_tokens) as cache_read_tok,
  SUM(total_cache_creation_tokens) as cache_write_tok
FROM sessions
WHERE model IS NOT NULL AND model != '' AND model != '<synthetic>' AND is_subagent = 0
GROUP BY model ORDER BY sessions DESC;
```

Apply these rates per million tokens:
- opus 4.5/4.6: input $5, output $25, cache_read $0.50, cache_write $6.25
- opus 4.0/4.1: input $15, output $75, cache_read $1.50, cache_write $18.75
- sonnet 4.x: input $3, output $15, cache_read $0.30, cache_write $3.75
- haiku 4.5: input $1, output $5, cache_read $0.10, cache_write $1.25

Show:
1. Per-model table with dollar amounts and category breakdown (input/output/cache)
2. Total API inference value across all models
3. ROI comparison against every plan tier:
   - `$X total API value → Xx Pro ($20/mo) · Xx Max 5x ($100/mo) · Xx Max 20x ($200/mo)`
   - Calculate ROI using the number of months the data spans (first session to last session)
4. Monthly average API value and per-plan ROI

### COST ("cost", "spent", "spend", "how much", "billing", "expensive")

Show API inference value (not "cost") with plan ROI context. Include a one-line ROI summary at the bottom: `monthly avg: $X API value → Xx Pro · Xx Max 5x · Xx Max 20x`

```sql
SELECT project_name, COUNT(*) AS sessions,
       ROUND(SUM(estimated_cost_usd), 2) AS cost_usd
FROM session_costs
WHERE start_time >= date('now', 'start of month') AND is_subagent = 0
GROUP BY project_name ORDER BY cost_usd DESC;
```

```sql
SELECT model, COUNT(*) AS sessions,
       ROUND(SUM(estimated_cost_usd), 2) AS cost_usd
FROM session_costs
WHERE start_time >= date('now', 'start of month') AND is_subagent = 0
GROUP BY model ORDER BY cost_usd DESC;
```

### SEARCH ("search", "find", or any quoted term)

```sql
SELECT m.session_id, m.role, m.timestamp,
       snippet(messages_fts, 0, '>>>', '<<<', '...', 40) AS match
FROM messages_fts
JOIN messages m ON m.id = messages_fts.rowid
WHERE messages_fts MATCH '<term>'
ORDER BY m.timestamp DESC LIMIT 20;
```

### CACHE ("cache", "caching", "cache efficiency", "cache hit")

```sql
SELECT model,
       SUM(total_cache_read_tokens) AS cache_hits,
       SUM(total_cache_creation_tokens) AS cache_writes,
       SUM(total_input_tokens) AS uncached,
       ROUND(SUM(total_cache_read_tokens) * 100.0 /
         NULLIF(SUM(total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens), 0), 1
       ) AS hit_pct
FROM sessions WHERE start_time >= date('now', '-7 days') AND is_subagent = 0
  AND (total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens) > 0
GROUP BY model ORDER BY hit_pct DESC;
```

Above 60% is good, above 80% is excellent.

### PROJECTS ("projects", "top projects", "which projects")

```sql
SELECT project_name, COUNT(*) AS sessions,
       ROUND(SUM(sc.estimated_cost_usd), 2) AS cost_usd,
       MAX(s.start_time) AS last_active
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name IS NOT NULL AND s.is_subagent = 0
GROUP BY s.project_name ORDER BY last_active DESC LIMIT 15;
```

### TOOLS ("tools", "top tools", "what tools")

```sql
SELECT tool_name, COUNT(*) AS uses,
       COUNT(DISTINCT session_id) AS sessions,
       ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT session_id), 1) AS avg_per_session
FROM tool_calls WHERE timestamp >= date('now', '-30 days')
GROUP BY tool_name ORDER BY uses DESC LIMIT 15;
```

### MODELS ("models", "model usage", "compare models")

```sql
SELECT model, COUNT(*) AS sessions,
       SUM(total_output_tokens) AS output_tok,
       ROUND(SUM(sc.estimated_cost_usd), 2) AS cost_usd,
       ROUND(AVG(total_output_tokens), 0) AS avg_output
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.start_time >= date('now', '-30 days') AND s.is_subagent = 0
GROUP BY model ORDER BY sessions DESC;
```

### WASTED ("wasted", "failures", "expensive failures", "mistakes")

```sql
SELECT s.project_name, s.start_time,
       s.total_input_tokens + s.total_output_tokens AS tokens,
       ROUND(sc.estimated_cost_usd, 2) AS cost_usd,
       (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) AS errors,
       SUBSTR(s.first_user_prompt, 1, 80) AS prompt
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.is_subagent = 0
  AND (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) >= 3
  AND s.total_input_tokens + s.total_output_tokens > 50000
ORDER BY tokens DESC LIMIT 10;
```

### WORKFLOWS ("workflows", "patterns", "tool chains")

```sql
WITH ordered AS (
  SELECT session_id, tool_name,
         LAG(tool_name) OVER (PARTITION BY session_id ORDER BY timestamp, id) AS prev
  FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
  WHERE tc.timestamp >= date('now', '-7 days') AND s.is_subagent = 0
)
SELECT prev || ' -> ' || tool_name AS flow, COUNT(*) AS n
FROM ordered WHERE prev IS NOT NULL
GROUP BY prev, tool_name ORDER BY n DESC LIMIT 15;
```

### PROJECT-SPECIFIC ("project X", "about X", specific project name)

```sql
SELECT project_dir, session_count, first_seen, last_seen
FROM project_paths WHERE project_name LIKE '%<name>%';

SELECT s.start_time, s.model,
       s.total_input_tokens + s.total_output_tokens AS tokens,
       ROUND(sc.estimated_cost_usd, 2) AS cost_usd,
       SUBSTR(s.first_user_prompt, 1, 80) AS prompt
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
ORDER BY s.start_time DESC LIMIT 20;
```

### TIME-FILTERED ("this week", "last 30 days", "today", "january", "2026-01")

Apply the time filter to whichever analysis makes sense. If just a time period with no other intent, show a mini dashboard for that period.

### BACKFILL ("backfill", "refresh", "update data", "sync", "re-mine")

Explicitly re-mine recent sessions:
```bash
for p in ./scripts/mine.py ./plugins/miner/scripts/mine.py \
  $(find ~/.claude/plugins -path "*/miner/scripts/mine.py" 2>/dev/null | head -1); do
  if [ -f "$p" ]; then python3 "$p" --incremental 2>&1; break; fi
done
```

Show the backfill output, then a mini dashboard with the updated data.

### HEALTH / STATS ("health", "stats", "project health", "codebase", "lines of code")

This intent uses the filesystem and git — NOT miner.db. Run these via Bash:

1. File count by type:
   find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/.next/*' | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -15

2. Lines of code:
   find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' -o -name '*.rs' -o -name '*.go' -o -name '*.css' -o -name '*.html' \) -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' | xargs wc -l 2>/dev/null | tail -1

3. Largest files:
   find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.py' -o -name '*.rs' \) -not -path '*/node_modules/*' -not -path '*/.git/*' | xargs wc -l 2>/dev/null | sort -rn | head -6

4. Git activity: git log --oneline -20, shortlog -sn, commits this week, branch count

5. Test coverage: check for coverage reports, count test files

6. Package info: package.json deps/devDeps/scripts, Cargo.toml, pyproject.toml

Output as compact dashboard tables.

### FREEFORM (anything else)

If the user's question doesn't match a known intent, construct a reasonable SQL query. The schema has: sessions, messages, tool_calls, subagents, errors, project_paths, session_costs (view), project_costs (view), daily_costs (view), tool_usage (view), messages_fts (FTS5).

## Subscription plan awareness

The `estimated_cost_usd` field is the **API inference value** — what this usage would cost at published per-token API rates. Most Claude Code users are on a subscription, not paying per-token.

**Claude Code plans (current as of 2026):**
| plan | price | notes |
|---|---|---|
| Pro | $20/month | Claude Code included with usage limits |
| Max 5x | $100/month | 5x the Pro usage allowance |
| Max 20x | $200/month | 20x the Pro usage allowance |
| Team | $25-100/user/month | Pro or Max tiers |
| Enterprise | custom pricing | custom usage tiers |
| API direct | per-token | billed at published rates |

**How to label costs:**
- NEVER call the `estimated_cost_usd` value "cost" or "spend" without qualification — subscription users aren't paying that amount
- Use **"API value"** or **"inference value"** as the primary label (what this usage would cost at API rates)
- When showing totals, add ROI context: `API value: $2,055 (10.3x your $200/mo Max 20x plan)`
- For the VALUE intent, always show the ROI comparison against known plan prices
- If you don't know the user's plan, show the value and list what it would mean across plans:
  - `$2,055 API value this week → 103x Pro ($20) · 21x Max 5x ($100) · 10x Max 20x ($200)`

**Subsidization context:** Anthropic subsidizes Claude Code subscription usage significantly. A Max 20x user generating $25K of API value paid $200/month — that's ~125x ROI. This is real value. Frame it positively.

## Rules
- **All session counts, costs, tokens, and model breakdowns default to user sessions (is_subagent = 0).** Subagent data may be shown as secondary/subtext but never as the primary number
- Start every output with a data freshness line: `data: <first_date> to <latest_date> (<N> sessions)`
- Run ALL queries for an intent in ONE Bash call. Present ONE formatted result. No intermediate outputs
- Format dollar amounts with commas and 2 decimal places
- Format token counts with K/M suffixes (142K, 1.2M, 12.1B)
- If a query returns no results, say so clearly
- Read-only. NEVER write to the database (except during backfill via mine.py)
- Keep output compact — dashboard, not essay
- Label dollar amounts as "API value" not "cost" — see plan awareness section above
- When showing API value: real numbers from published anthropic pricing. don't hedge or disclaim
- If the user asks something you can't answer from the data, say what data would be needed
- Escape single quotes by doubling them (O'Brien → O''Brien) in SQL strings
`````
<!-- PROMPT:END -->
