<!-- tested with: claude code v2.1.77 -->
<!-- CACHE NOTE: this entire skill prompt is static content. dynamic data
     (query results, user preferences) arrives via conversation messages.
     this maximizes prompt cache hit rate per Thariq's caching lessons. -->
---
name: mine
description: usage stats, costs, search, tools
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
  - CronCreate
  - CronDelete
  - CronList
---

<!-- PROMPT:START — keep in sync with .claude/commands/mine.md -->
When the user runs /mine, interpret their intent and query ~/.claude/mine.db accordingly.

## Step 0: Check database exists and is fresh

Run this FIRST as a single Bash call:

`````bash
DB=~/.claude/mine.db
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
  for p in ./scripts/mine.py ./plugins/mine/scripts/mine.py \
    $(find ~/.claude/plugins -path "*/mine/scripts/mine.py" 2>/dev/null | head -1); do
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
`````

- If NO_DB: run an interactive first-time setup:

  1. Use AskUserQuestion to ask:
     title: "no mine.db found — want to create it now?"
     Select from:
     - "yes, mine my sessions now" → find and run mine.py (search ./scripts/mine.py, ./plugins/mine/scripts/mine.py, then ~/.claude/plugins/*/mine/scripts/mine.py). Run it with --incremental. Show progress. When done, re-run the dashboard query and show results.
     - "just show me how" → explain: `python3 scripts/mine.py` parses ~/.claude/projects/ JSONL logs into ~/.claude/mine.db. show the one-liner they need to run. mention --dry-run to preview first.
     - "change db path" → use AskUserQuestion with a text input to ask for their preferred path. then explain how to set MINE_DB env var or use --db flag.

  Keep it fast — the "yes" option should just work with no further questions.
- If STALE: the backfill ran automatically. note it briefly ("backfilled X sessions") then proceed
- If FRESH: proceed directly
- Save FIRST, LATEST, TOTAL for the freshness line

## Step 1: Intent routing

Interpret the user's message and choose the appropriate analysis. If no argument is given, show the dashboard.

**CRITICAL: run ALL queries for an intent in a SINGLE Bash call using a heredoc or semicolons. Parse the output yourself and present ONE clean formatted result. NEVER show raw SQL output or intermediate bash calls to the user.**

### DASHBOARD (no argument, or "status", "overview")

**Default time window: last 7 days.** After showing the dashboard, use AskUserQuestion: "want last 30 days? last 90? all time?"

Run all dashboard queries in one call:
`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- summary (7 days)
SELECT 'SUMMARY' s, COUNT(*) sessions,
  COALESCE(SUM(total_input_tokens + total_output_tokens), 0) tokens,
  COALESCE(SUM(duration_active_seconds), 0) secs,
  (SELECT COALESCE(ROUND(SUM(estimated_cost_usd), 2), 0) FROM session_costs WHERE start_time >= date('now', '-7 days') AND is_subagent = 0) api_value,
  (SELECT ROUND(SUM(total_cache_read_tokens) * 100.0 / NULLIF(SUM(total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens), 0), 1) FROM sessions WHERE start_time >= date('now', '-7 days') AND is_subagent = 0 AND (total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens) > 0) cache_pct
FROM sessions WHERE start_time >= date('now', '-7 days') AND is_subagent = 0;

-- top projects (7d) with API value and top model
SELECT 'PROJ' s, s.project_name, COUNT(*) sessions,
  ROUND(SUM(sc.estimated_cost_usd), 2) api_value,
  (SELECT model FROM sessions s2 WHERE s2.project_name = s.project_name AND s2.is_subagent = 0 AND s2.start_time >= date('now', '-7 days') GROUP BY model ORDER BY COUNT(*) DESC LIMIT 1) top_model
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.start_time >= date('now', '-7 days') AND s.is_subagent = 0 AND s.project_name IS NOT NULL
GROUP BY s.project_name ORDER BY api_value DESC LIMIT 5;

-- project "other" count
SELECT 'PROJ_OTHER' s, COUNT(*) projects, SUM(sessions) sessions, ROUND(SUM(api_value), 2) api_value FROM (
  SELECT s.project_name, COUNT(*) sessions, SUM(sc.estimated_cost_usd) api_value,
    ROW_NUMBER() OVER (ORDER BY SUM(sc.estimated_cost_usd) DESC) rn
  FROM sessions s JOIN session_costs sc ON s.id = sc.id
  WHERE s.start_time >= date('now', '-7 days') AND s.is_subagent = 0 AND s.project_name IS NOT NULL
  GROUP BY s.project_name
) WHERE rn > 5;

-- top 5 tools + "other" (7d)
SELECT 'TOOLS' s, tool_name, uses, sessions FROM (
  SELECT tc.tool_name, COUNT(*) uses, COUNT(DISTINCT tc.session_id) sessions,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) rn
  FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
  WHERE tc.timestamp >= date('now', '-7 days') AND s.is_subagent = 0
  GROUP BY tc.tool_name
) WHERE rn <= 5;

SELECT 'TOOLS_OTHER' s, COUNT(*) tools, SUM(uses) uses, SUM(sessions) sessions FROM (
  SELECT tc.tool_name, COUNT(*) uses, COUNT(DISTINCT tc.session_id) sessions,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) rn
  FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
  WHERE tc.timestamp >= date('now', '-7 days') AND s.is_subagent = 0
  GROUP BY tc.tool_name
) WHERE rn > 5;

-- models (7d, exclude synthetic/empty)
SELECT 'MODELS' s, s.model, COUNT(*) sessions,
  ROUND(SUM(sc.estimated_cost_usd), 2) api_value,
  ROUND(AVG(s.total_output_tokens), 0) avg_output
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.start_time >= date('now', '-7 days') AND s.is_subagent = 0
  AND s.model IS NOT NULL AND s.model != '' AND s.model != '<synthetic>'
GROUP BY s.model ORDER BY sessions DESC;

-- busiest day insight (7d)
SELECT 'INSIGHT' s, SUBSTR(start_time, 1, 10) day, COUNT(*) sessions
FROM sessions WHERE start_time >= date('now', '-7 days') AND is_subagent = 0
GROUP BY day ORDER BY sessions DESC LIMIT 1;

-- total API value (all time) for context line
SELECT 'TOTAL' s, ROUND(SUM(estimated_cost_usd), 2) all_time_value
FROM session_costs WHERE is_subagent = 0;
SQL
`````

Format as a compact dashboard:

1. **Freshness line**: `data: <first_date> → <latest_date> (<N> sessions)`
2. **7-day summary table**: sessions | active time | API value | tokens (in/out) | cache hit rate
3. **Top projects table**: project | sessions | API value | top model | % of 7d total
   - End with: `+N other projects ($X API value)` if there are more
4. **Top tools table**: tool | uses | sessions | avg/session
   - End with: `+N more tools (X total calls)` if there are more
5. **Models table**: model | sessions | API value | avg output/session
6. **Insight line**: "busiest day this week: [day] ([N] sessions). cache rate saved ~$X vs uncached. all-time API value: $Y."

Then use AskUserQuestion: "want last 30 days? last 90 days? all time?" — if selected, re-run with adjusted date filter.

**Cache savings estimate**: compute from the summary data. `cache_savings = cache_read_tokens * (model_uncached_rate - model_cached_rate) / 1e6`. For opus 4.6: uncached $5/M, cached $0.50/M, so savings per M cache-read tokens = $4.50.

### VALUE ("value", "roi", "inference", "how much is my usage worth", "api value")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- per-model breakdown with cost categories
SELECT 'MODEL' s, model, COUNT(*) sessions,
  SUM(total_input_tokens) input_tok,
  SUM(total_output_tokens) output_tok,
  SUM(total_cache_read_tokens) cache_read_tok,
  SUM(total_cache_creation_tokens) cache_write_tok,
  ROUND(SUM(sc.estimated_cost_usd), 2) total_value
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.model IS NOT NULL AND s.model != '' AND s.model != '<synthetic>' AND s.is_subagent = 0
GROUP BY s.model ORDER BY total_value DESC;

-- per-project breakdown (top 10 + other)
SELECT 'PROJ' s, s.project_name, COUNT(*) sessions,
  ROUND(SUM(sc.estimated_cost_usd), 2) api_value,
  (SELECT model FROM sessions s2 WHERE s2.project_name = s.project_name AND s2.is_subagent = 0 GROUP BY model ORDER BY COUNT(*) DESC LIMIT 1) top_model
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.is_subagent = 0 AND s.project_name IS NOT NULL
GROUP BY s.project_name ORDER BY api_value DESC LIMIT 10;

SELECT 'PROJ_OTHER' s, COUNT(*) projects, SUM(sessions) sessions, ROUND(SUM(api_value), 2) api_value FROM (
  SELECT s.project_name, COUNT(*) sessions, SUM(sc.estimated_cost_usd) api_value,
    ROW_NUMBER() OVER (ORDER BY SUM(sc.estimated_cost_usd) DESC) rn
  FROM sessions s JOIN session_costs sc ON s.id = sc.id
  WHERE s.is_subagent = 0 AND s.project_name IS NOT NULL
  GROUP BY s.project_name
) WHERE rn > 10;

-- time span for ROI calculation
SELECT 'SPAN' s, MIN(start_time) first, MAX(start_time) latest,
  ROUND(JULIANDAY(MAX(start_time)) - JULIANDAY(MIN(start_time)), 0) days,
  ROUND((JULIANDAY(MAX(start_time)) - JULIANDAY(MIN(start_time))) / 30.44, 1) months
FROM sessions WHERE is_subagent = 0;

-- grand total
SELECT 'GRAND' s, ROUND(SUM(estimated_cost_usd), 2) total FROM session_costs WHERE is_subagent = 0;

-- monthly trend (last 6 months)
SELECT 'MONTHLY' s, SUBSTR(start_time, 1, 7) month,
  COUNT(*) sessions, ROUND(SUM(sc.estimated_cost_usd), 2) api_value
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.is_subagent = 0
GROUP BY SUBSTR(start_time, 1, 7) ORDER BY month DESC LIMIT 6;
SQL
`````

Show:
1. **Per-model table** with columns: model | sessions | input $ | output $ | cache read $ | cache write $ | total $
   - Calculate dollar amounts: `tokens * rate / 1e6`. Use model_pricing table if available, else hardcoded rates
2. **Per-project table** (top 10): project | sessions | API value | top model | % of total
   - End with: `+N other projects ($X, Y%)` if more exist
3. **Monthly trend**: month | sessions | API value (with arrow ↑/↓ vs previous month)
4. **Grand total + ROI**: `$X total API value over Y months (Z sessions)`
   - `monthly avg: $A → Bx Pro ($20) · Cx Max 5x ($100) · Dx Max 20x ($200)`
   - One-line: "anthropic subsidizes this significantly. you're getting $X of compute for $Y/mo."

### COST ("cost", "spent", "spend", "how much", "billing", "expensive")

Show API inference value (not "cost") with plan ROI context.

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- by project (this month, top 10)
SELECT 'PROJ' s, project_name, COUNT(*) sessions,
  ROUND(SUM(estimated_cost_usd), 2) api_value
FROM session_costs
WHERE start_time >= date('now', 'start of month') AND is_subagent = 0
GROUP BY project_name ORDER BY api_value DESC LIMIT 10;

-- project "other" count
SELECT 'PROJ_OTHER' s, COUNT(*) projects, SUM(sessions) sessions, ROUND(SUM(api_value), 2) api_value FROM (
  SELECT project_name, COUNT(*) sessions, SUM(estimated_cost_usd) api_value,
    ROW_NUMBER() OVER (ORDER BY SUM(estimated_cost_usd) DESC) rn
  FROM session_costs
  WHERE start_time >= date('now', 'start of month') AND is_subagent = 0
  GROUP BY project_name
) WHERE rn > 10;

-- by model (this month)
SELECT 'MODEL' s, model, COUNT(*) sessions,
  ROUND(SUM(estimated_cost_usd), 2) api_value
FROM session_costs
WHERE start_time >= date('now', 'start of month') AND is_subagent = 0
GROUP BY model ORDER BY api_value DESC;

-- daily trend (last 14 days)
SELECT 'DAILY' s, SUBSTR(start_time, 1, 10) day, COUNT(*) sessions,
  ROUND(SUM(estimated_cost_usd), 2) api_value
FROM session_costs WHERE start_time >= date('now', '-14 days') AND is_subagent = 0
GROUP BY day ORDER BY day DESC;

-- this month total
SELECT 'MONTH_TOTAL' s, ROUND(SUM(estimated_cost_usd), 2) api_value
FROM session_costs WHERE start_time >= date('now', 'start of month') AND is_subagent = 0;
SQL
`````

Include one-line ROI summary: `this month: $X API value → Yx Pro · Zx Max 5x · Wx Max 20x`

### SEARCH ("search", "find", or any quoted term)

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
SELECT m.session_id, s.project_name, m.role, m.timestamp,
       snippet(messages_fts, 0, '>>>', '<<<', '...', 40) AS match
FROM messages_fts
JOIN messages m ON m.id = messages_fts.rowid
JOIN sessions s ON m.session_id = s.id
WHERE messages_fts MATCH '<term>' AND s.is_subagent = 0
ORDER BY m.timestamp DESC LIMIT 20;

-- total matches for "other" accounting
SELECT 'TOTAL' s, COUNT(*) total_matches
FROM messages_fts
JOIN messages m ON m.id = messages_fts.rowid
JOIN sessions s ON m.session_id = s.id
WHERE messages_fts MATCH '<term>' AND s.is_subagent = 0;
SQL
`````

Escape single quotes in the search term by doubling them. Show results with project context. Group by session when multiple hits in the same session. If >20 matches, show: `+N more matches (use a narrower search or add a project filter)`.

### CACHE ("cache", "caching", "cache efficiency", "cache hit")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- per-model cache stats (7d)
SELECT 'CACHE' s, model,
  SUM(total_cache_read_tokens) cache_reads,
  SUM(total_cache_creation_tokens) cache_writes,
  SUM(total_input_tokens) uncached,
  ROUND(SUM(total_cache_read_tokens) * 100.0 /
    NULLIF(SUM(total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens), 0), 1
  ) hit_pct
FROM sessions WHERE start_time >= date('now', '-7 days') AND is_subagent = 0
  AND (total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens) > 0
GROUP BY model ORDER BY hit_pct DESC;

-- savings calculation data
SELECT 'SAVINGS' s,
  SUM(total_cache_read_tokens) total_cache_reads,
  SUM(total_input_tokens) total_uncached,
  SUM(total_cache_creation_tokens) total_cache_writes
FROM sessions WHERE start_time >= date('now', '-7 days') AND is_subagent = 0;

-- cache trend (last 4 weeks, weekly)
SELECT 'TREND' s,
  CASE
    WHEN start_time >= date('now', '-7 days') THEN 'this week'
    WHEN start_time >= date('now', '-14 days') THEN 'last week'
    WHEN start_time >= date('now', '-21 days') THEN '2 weeks ago'
    ELSE '3 weeks ago'
  END AS period,
  ROUND(SUM(total_cache_read_tokens) * 100.0 /
    NULLIF(SUM(total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens), 0), 1
  ) hit_pct
FROM sessions WHERE start_time >= date('now', '-28 days') AND is_subagent = 0
  AND (total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens) > 0
GROUP BY period ORDER BY MIN(start_time) DESC;
SQL
`````

Show:
1. **Per-model cache table**: model | cache reads | cache writes | uncached | hit rate
2. **Savings estimate**: "your X% cache rate saved ~$Y vs fully uncached this week"
   - Calculate: for opus, uncached costs $5/M, cached costs $0.50/M. savings = cache_reads * ($5 - $0.50) / 1e6
   - For sonnet: savings = cache_reads * ($3 - $0.30) / 1e6
3. **What-if table**: at 60%/80%/95% cache rate, what would weekly savings be
4. **Trend**: weekly cache hit rate over last 4 weeks (arrow ↑/↓)
5. **Tips**: "stable CLAUDE.md = more cache hits. avoid mid-session model switches. use subagents instead."

Above 60% is good, above 80% is excellent, above 90% is optimal.

### PROJECTS ("projects", "top projects", "which projects")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
SELECT 'PROJ' s, s.project_name, COUNT(*) sessions,
  ROUND(SUM(sc.estimated_cost_usd), 2) api_value,
  MAX(s.start_time) last_active,
  SUM(s.tool_use_count) tool_calls,
  (SELECT model FROM sessions s2 WHERE s2.project_name = s.project_name AND s2.is_subagent = 0 GROUP BY model ORDER BY COUNT(*) DESC LIMIT 1) top_model,
  ROUND(SUM(s.total_cache_read_tokens) * 100.0 / NULLIF(SUM(s.total_input_tokens + s.total_cache_creation_tokens + s.total_cache_read_tokens), 0), 1) cache_pct
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name IS NOT NULL AND s.is_subagent = 0
GROUP BY s.project_name ORDER BY api_value DESC LIMIT 15;

-- total for percentage calculation
SELECT 'TOTAL' s, ROUND(SUM(estimated_cost_usd), 2) total FROM session_costs WHERE is_subagent = 0;

-- "other" projects not in top 15
SELECT 'PROJ_OTHER' s, COUNT(*) projects, SUM(sessions) sessions, ROUND(SUM(api_value), 2) api_value FROM (
  SELECT s.project_name, COUNT(*) sessions, SUM(sc.estimated_cost_usd) api_value,
    ROW_NUMBER() OVER (ORDER BY SUM(sc.estimated_cost_usd) DESC) rn
  FROM sessions s JOIN session_costs sc ON s.id = sc.id
  WHERE s.project_name IS NOT NULL AND s.is_subagent = 0
  GROUP BY s.project_name
) WHERE rn > 15;
SQL
`````

Show: project | sessions | API value | % of total | top model | cache rate | last active
End with: `+N other projects ($X API value, Y% of total)` if more exist.

Add insight: "your most expensive project is [X] at Y% of total API value. highest cache rate: [Z] at W%."

### TOOLS ("tools", "top tools", "what tools")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
SELECT 'TOOLS' s, tc.tool_name, COUNT(*) uses,
  COUNT(DISTINCT tc.session_id) sessions,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT tc.session_id), 1) avg_per_session
FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
WHERE tc.timestamp >= date('now', '-30 days') AND s.is_subagent = 0
GROUP BY tc.tool_name ORDER BY uses DESC;

-- "other" tools beyond top 10
SELECT 'OTHER' s, COUNT(*) tools, SUM(uses) uses, SUM(sessions) sessions FROM (
  SELECT tc.tool_name, COUNT(*) uses, COUNT(DISTINCT tc.session_id) sessions,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) rn
  FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
  WHERE tc.timestamp >= date('now', '-30 days') AND s.is_subagent = 0
  GROUP BY tc.tool_name
) WHERE rn > 10;
SQL
`````

Show top 10 tools, then: `+N more tools (X calls across Y sessions)`

Add insight: "you use [tool] X.Xx more per session than average. your Read-to-Write ratio is X:1."

### MODELS ("models", "model usage", "compare models")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
SELECT model, COUNT(*) AS sessions,
       SUM(total_output_tokens) AS output_tok,
       ROUND(SUM(sc.estimated_cost_usd), 2) AS api_value,
       ROUND(AVG(total_output_tokens), 0) AS avg_output,
       ROUND(AVG(duration_active_seconds), 0) AS avg_active_secs
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.start_time >= date('now', '-30 days') AND s.is_subagent = 0
  AND s.model IS NOT NULL AND s.model != '' AND s.model != '<synthetic>'
GROUP BY model ORDER BY sessions DESC;
SQL
`````

### WASTED ("wasted", "failures", "expensive failures", "mistakes")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- high-token sessions with errors
SELECT 'WASTED' s, s.project_name, s.start_time,
  s.total_input_tokens + s.total_output_tokens AS tokens,
  ROUND(sc.estimated_cost_usd, 2) AS api_value,
  (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) AS errors,
  SUBSTR(s.first_user_prompt, 1, 80) AS prompt
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.is_subagent = 0
  AND (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) >= 2
  AND s.total_input_tokens + s.total_output_tokens > 30000
ORDER BY tokens DESC LIMIT 10;

-- most expensive sessions (regardless of errors)
SELECT 'EXPENSIVE' s, s.project_name, s.start_time,
  ROUND(sc.estimated_cost_usd, 2) AS api_value,
  s.total_input_tokens + s.total_output_tokens AS tokens,
  s.tool_use_count,
  SUBSTR(s.first_user_prompt, 1, 80) AS prompt
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.is_subagent = 0
ORDER BY sc.estimated_cost_usd DESC LIMIT 5;

-- error-to-token ratio (worst offenders)
SELECT 'RATIO' s, s.project_name, s.start_time,
  (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) AS errors,
  s.total_input_tokens + s.total_output_tokens AS tokens,
  ROUND((SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) * 1000.0 / NULLIF(s.total_input_tokens + s.total_output_tokens, 0), 2) AS errors_per_1k_tok
FROM sessions s
WHERE s.is_subagent = 0
  AND (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) >= 2
  AND s.start_time >= date('now', '-30 days')
ORDER BY errors_per_1k_tok DESC LIMIT 5;
SQL
`````

Show three sections:
1. **Error-heavy sessions**: sessions with 2+ errors AND 30K+ tokens (lowered from 3/50K for better coverage)
2. **Most expensive sessions**: top 5 by API value regardless of errors
3. **Worst error ratio**: highest errors-per-1K-tokens in last 30 days

If the errors table is empty (mine.py may not have extracted errors yet), say so clearly: "no error data available — the errors table is empty. error extraction may not be enabled in your mine.py version. the most expensive sessions section still works since it uses token/cost data only."

Add narrative: "your most expensive session was on [date] in [project] ($X). [first prompt snippet]."

### WORKFLOWS ("workflows", "patterns", "tool chains")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- top 15 tool transitions
WITH ordered AS (
  SELECT tc.session_id, tc.tool_name,
         LAG(tc.tool_name) OVER (PARTITION BY tc.session_id ORDER BY tc.timestamp, tc.id) AS prev
  FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
  WHERE tc.timestamp >= date('now', '-7 days') AND s.is_subagent = 0
)
SELECT 'FLOW' s, prev || ' → ' || tool_name AS flow, COUNT(*) AS n
FROM ordered WHERE prev IS NOT NULL
GROUP BY prev, tool_name ORDER BY n DESC LIMIT 15;

-- total transitions for "other" accounting
WITH ordered AS (
  SELECT tc.session_id, tc.tool_name,
         LAG(tc.tool_name) OVER (PARTITION BY tc.session_id ORDER BY tc.timestamp, tc.id) AS prev
  FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
  WHERE tc.timestamp >= date('now', '-7 days') AND s.is_subagent = 0
)
SELECT 'TOTAL' s, COUNT(DISTINCT prev || ' → ' || tool_name) total_patterns, COUNT(*) total_transitions
FROM ordered WHERE prev IS NOT NULL;
SQL
`````

Show top 15 transitions, then: `+N more patterns (X total transitions)`. Add insight: identify the most common self-loop (Read → Read, Edit → Edit) and the dominant workflow pattern (e.g., "your most common flow is Read → Edit → Read — classic review-fix-verify").

### PROJECT-SPECIFIC ("project X", "about X", specific project name)

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
SELECT 'PATHS' s, project_dir, session_count, first_seen, last_seen
FROM project_paths WHERE project_name LIKE '%<name>%';

SELECT 'SESSIONS' s, s.start_time, s.model,
       s.total_input_tokens + s.total_output_tokens AS tokens,
       ROUND(sc.estimated_cost_usd, 2) AS api_value,
       SUBSTR(s.first_user_prompt, 1, 80) AS prompt
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
ORDER BY s.start_time DESC LIMIT 20;

SELECT 'TOTAL' s, COUNT(*) total_sessions, ROUND(SUM(sc.estimated_cost_usd), 2) total_value
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0;
SQL
`````

If showing 20 sessions out of more, add: `showing 20 most recent of N total sessions ($X total API value)`.

### STORY ("story", "history of", "tell me about project")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- project overview
SELECT 'OVERVIEW' s, s.project_name, COUNT(*) sessions,
  MIN(s.start_time) first_session, MAX(s.start_time) last_session,
  ROUND(SUM(sc.estimated_cost_usd), 2) total_value,
  SUM(s.tool_use_count) tool_calls,
  SUM(s.duration_active_seconds) active_secs
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
GROUP BY s.project_name;

-- model evolution
SELECT 'MODELS' s, SUBSTR(s.start_time, 1, 7) month, s.model, COUNT(*) sessions,
  ROUND(SUM(sc.estimated_cost_usd), 2) api_value
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
GROUP BY month, s.model ORDER BY month;

-- monthly cost trajectory
SELECT 'TRAJECTORY' s, SUBSTR(s.start_time, 1, 7) month, COUNT(*) sessions,
  ROUND(SUM(sc.estimated_cost_usd), 2) api_value
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
GROUP BY month ORDER BY month;

-- top tools for this project
SELECT 'TOOLS' s, tc.tool_name, COUNT(*) uses
FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
GROUP BY tc.tool_name ORDER BY uses DESC LIMIT 10;

-- common errors
SELECT 'ERRORS' s, e.tool_name, SUBSTR(e.error_message, 1, 80) error, COUNT(*) occurrences
FROM errors e JOIN sessions s ON e.session_id = s.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
GROUP BY e.tool_name, e.error_message ORDER BY occurrences DESC LIMIT 5;

-- tools "other" accounting
SELECT 'TOOLS_OTHER' s, COUNT(*) tools, SUM(uses) uses FROM (
  SELECT tc.tool_name, COUNT(*) uses,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) rn
  FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
  WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
  GROUP BY tc.tool_name
) WHERE rn > 10;

-- errors "other" accounting
SELECT 'ERRORS_OTHER' s, COUNT(*) patterns, SUM(occurrences) total FROM (
  SELECT e.tool_name, SUBSTR(e.error_message, 1, 80) error, COUNT(*) occurrences,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) rn
  FROM errors e JOIN sessions s ON e.session_id = s.id
  WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
  GROUP BY e.tool_name, e.error_message
) WHERE rn > 5;

-- peak activity days
SELECT 'PEAK' s, SUBSTR(s.start_time, 1, 10) day, COUNT(*) sessions,
  ROUND(SUM(sc.estimated_cost_usd), 2) api_value
FROM sessions s JOIN session_costs sc ON s.id = sc.id
WHERE s.project_name LIKE '%<name>%' AND s.is_subagent = 0
GROUP BY day ORDER BY sessions DESC LIMIT 5;
SQL
`````

Present as a **project narrative**:
1. "you started [project] on [date]. [N] sessions over [M] months, $X total API value."
2. "model evolution: started with [model A], moved to [model B] in [month]."
3. "monthly trajectory" — table with month | sessions | API value (arrows for trend)
4. "peak days" — your busiest days on this project
5. "top tools" — how you use this project differently from your average
6. "common errors" — if any, what keeps failing

### COMPARE ("compare", "vs", "diff")

Supports two comparison types:
- Time: `/mine compare this week vs last week` or `/mine compare march vs february`
- Projects: `/mine compare project-a vs project-b`

For time comparisons, run the dashboard queries with two different date filters and show side-by-side:

| metric | period A | period B | delta |
|---|---|---|---|
| sessions | 34 | 28 | +6 (↑21%) |
| API value | $847 | $612 | +$235 (↑38%) |
| cache rate | 87% | 82% | +5pp (↑) |

For project comparisons, show the same table with project names instead of periods.

### TIME-FILTERED ("this week", "last 30 days", "today", "january", "2026-01")

Apply the time filter to whichever analysis makes sense. If just a time period with no other intent, show a mini dashboard for that period using the same dashboard format but with the adjusted date filter.

### BACKFILL ("backfill", "refresh", "update data", "sync", "re-mine")

Explicitly re-mine recent sessions:
```bash
for p in ./scripts/mine.py ./plugins/mine/scripts/mine.py \
  $(find ~/.claude/plugins -path "*/mine/scripts/mine.py" 2>/dev/null | head -1); do
  if [ -f "$p" ]; then python3 "$p" --incremental 2>&1; break; fi
done
```

Show the backfill output, then a mini dashboard with the updated data.

### HEALTH / STATS ("health", "stats", "project health", "codebase", "lines of code")

This intent uses the filesystem and git — NOT mine.db. Run these via Bash:

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

### HOTSPOTS ("hotspots", "hot files", "most edited", "complexity")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
SELECT 'EDITS' s, tc.input_summary AS file_path,
  COUNT(*) AS edits, COUNT(DISTINCT tc.session_id) AS sessions
FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
WHERE tc.tool_name IN ('Edit', 'Write') AND s.is_subagent = 0
  AND tc.input_summary IS NOT NULL AND tc.timestamp >= date('now', '-30 days')
GROUP BY tc.input_summary ORDER BY edits DESC LIMIT 10;

SELECT 'READS' s, tc.input_summary AS file_path,
  COUNT(*) AS reads, COUNT(DISTINCT tc.session_id) AS sessions
FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
WHERE tc.tool_name = 'Read' AND s.is_subagent = 0
  AND tc.input_summary IS NOT NULL AND tc.timestamp >= date('now', '-30 days')
GROUP BY tc.input_summary ORDER BY reads DESC LIMIT 10;
SQL
`````

Present as "files you keep touching" and "files you keep reading". Add insight: "high reads + low edits = the file is hard to understand. high edits + low reads = you keep changing it blindly."

### LOOPS ("loops", "repeated", "retries", "stuck")

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- tool call loops
SELECT 'LOOPS' s, s.project_name, tc.tool_name, tc.input_summary,
  COUNT(*) AS repeats, s.start_time
FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
WHERE s.is_subagent = 0 AND tc.input_summary IS NOT NULL
  AND tc.timestamp >= date('now', '-7 days')
GROUP BY tc.session_id, tc.tool_name, tc.input_summary
HAVING repeats >= 3 ORDER BY repeats DESC LIMIT 15;

-- error loops
SELECT 'ERRORS' s, s.project_name, e.tool_name,
  SUBSTR(e.error_message, 1, 100) AS error, COUNT(*) AS repeats
FROM errors e JOIN sessions s ON e.session_id = s.id
WHERE s.is_subagent = 0 AND e.timestamp >= date('now', '-7 days')
GROUP BY s.project_name, e.tool_name, e.error_message
HAVING repeats >= 2 ORDER BY repeats DESC LIMIT 10;

-- cross-session patterns (same file stuck across multiple sessions)
SELECT 'CROSS' s, tc.input_summary file_path, tc.tool_name,
  COUNT(*) total_touches, COUNT(DISTINCT tc.session_id) sessions
FROM tool_calls tc JOIN sessions s ON tc.session_id = s.id
WHERE s.is_subagent = 0 AND tc.input_summary IS NOT NULL
  AND tc.timestamp >= date('now', '-7 days')
  AND tc.tool_name IN ('Edit', 'Write')
GROUP BY tc.input_summary, tc.tool_name
HAVING sessions >= 3 AND total_touches >= 10
ORDER BY total_touches DESC LIMIT 5;
SQL
`````

Present as:
1. **Tool call loops** (within a session): file | tool | repeats | project
2. **Error loops**: project | tool | error | repeats
3. **Cross-session stuck points** (NEW): files edited across 3+ sessions with 10+ touches — these are your real complexity magnets

Add narrative: "you got stuck on [file] in [project] — [N] edits across [M] sessions. consider breaking it into smaller components or giving claude a clearer spec upfront."

### WATCH ("watch", "monitor", "keep checking", "every N minutes", "scheduled", "cron")

Set up a recurring dashboard refresh using CronCreate. Use AskUserQuestion to ask the interval:
- "every 10 minutes" (default)
- "every 30 minutes"
- "every hour"
- "stop watching" → use CronList to find the mine cron, then CronDelete to remove it

When creating the cron, use CronCreate with:
- name: "mine-watch"
- the user's chosen interval
- prompt: "/mine" (this re-runs the dashboard on schedule)

Tell the user: "dashboard will refresh every X minutes. say `/mine stop watching` to cancel."

If the user says "stop watching" or "stop monitoring", list crons with CronList, find the mine-watch cron, and delete it with CronDelete.

### FREEFORM (anything else)

If the user's question doesn't match a known intent, construct a reasonable SQL query. The schema has: sessions, messages, tool_calls, subagents, errors, project_paths, model_pricing, daily_rollups, session_costs (view), project_costs (view), daily_costs (view), tool_usage (view), messages_fts (FTS5).

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

## Presentation rules

- **All session counts, costs, tokens, and model breakdowns default to user sessions (is_subagent = 0).** Subagent data may be shown as secondary/subtext but never as the primary number
- Start every output with a data freshness line: `data: <first_date> → <latest_date> (<N> sessions)`
- Run ALL queries for an intent in ONE Bash call. Present ONE formatted result. No intermediate outputs
- Format dollar amounts with commas and 2 decimal places
- Format token counts with K/M suffixes (142K, 1.2M, 12.1B)
- If a query returns no results, say so clearly
- Read-only. NEVER write to the database (except during backfill via mine.py)
- Label dollar amounts as "API value" not "cost" — see plan awareness section above
- When showing API value: real numbers from published anthropic pricing. don't hedge or disclaim
- If the user asks something you can't answer from the data, say what data would be needed
- Escape single quotes by doubling them (O'Brien → O''Brien) in SQL strings

## Narrative rules (NEW)

Every intent output MUST include at least one **insight line** after the data. These are short, specific observations derived from the query results:

- Compare current period to previous: "API value up 23% vs last week"
- Highlight outliers: "your most expensive session ($142) was in rudy-api on Tuesday"
- Surface patterns: "you use Bash 2.3x more than Read — power user pattern"
- Give actionable advice: "fullstack has 48% cache rate (vs 87% average) — check if CLAUDE.md is changing frequently"
- Use relative comparisons: "claude-code-tips is your cheapest project per session ($1.20 avg) — stable CLAUDE.md = high cache efficiency"

Keep insights to 1-2 lines. No filler. Only say something if the data supports it.

## "Other" accounting rules (NEW)

Every top-N list MUST end with a summary of what was excluded:

- Tools: `+7 more tools (412 calls across 18 sessions)`
- Projects: `+5 other projects ($3,456 API value, 13.6% of total)`
- Models: show all models (only 4-6 exist, no cutoff needed)
- Errors: `+12 other error patterns (34 occurrences)`

Never silently truncate. The reader should always know the full picture.
<!-- PROMPT:END -->
