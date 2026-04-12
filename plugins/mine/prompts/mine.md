---
name: mine
description: your usage data — sessions, costs, tools, projects, search, and patterns
tools: Bash, Read, AskUserQuestion, CronCreate, CronDelete, CronList
---
When the user runs /mine, interpret their intent and query ~/.claude/mine.db accordingly.
<!-- tested with: claude code v2.1.81 -->

## Step 0: Check database exists and is fresh

Run this FIRST:

`````bash
MISSING=""
command -v sqlite3 >/dev/null 2>&1 || MISSING="$MISSING sqlite3"
command -v python3 >/dev/null 2>&1 || MISSING="$MISSING python3"
if [ -n "$MISSING" ]; then echo "MISSING_DEPS|$MISSING"; exit 0; fi

DB=~/.claude/mine.db
if [ ! -f "$DB" ]; then echo "NO_DB"; exit 0; fi
LATEST=$(sqlite3 -noheader "$DB" "SELECT MAX(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
TOTAL=$(sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
FIRST=$(sqlite3 -noheader "$DB" "SELECT MIN(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
NEWEST_JSONL=$(find ~/.claude/projects -name "*.jsonl" -newer "$DB" 2>/dev/null | head -1)
if [ -n "$NEWEST_JSONL" ]; then
  echo "STALE|$FIRST|$LATEST|$TOTAL"
  for p in ./scripts/mine.py $(find ~/.claude/plugins -path "*/mine/scripts/mine.py" 2>/dev/null | head -1); do
    if [ -f "$p" ]; then python3 "$p" --incremental 2>&1; break; fi
  done
  LATEST=$(sqlite3 -noheader "$DB" "SELECT MAX(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
  TOTAL=$(sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
  FIRST=$(sqlite3 -noheader "$DB" "SELECT MIN(start_time) FROM sessions WHERE is_subagent = 0;" 2>/dev/null)
  echo "REFRESHED|$FIRST|$LATEST|$TOTAL"
else
  echo "FRESH|$FIRST|$LATEST|$TOTAL"
fi
`````

- If MISSING_DEPS: tell user how to install (`sqlite3` ships with macOS; `python3` via brew/python.org)
- If NO_DB: find and run mine.py (`./scripts/mine.py` or search `~/.claude/plugins/*/mine/scripts/mine.py`). Use `--incremental`. If mine.py not found, explain: `python3 scripts/mine.py` parses `~/.claude/projects/` JSONL logs into `~/.claude/mine.db`
- If STALE: backfill ran automatically, note briefly then proceed
- If FRESH: proceed

## Step 0.5: Scope detection

`````bash
CWD_SAFE="${PWD//\'/\'\'}"
MATCH=$(sqlite3 -noheader ~/.claude/mine.db "SELECT project_name, COUNT(*) FROM sessions WHERE (project_dir = '$CWD_SAFE' OR cwd = '$CWD_SAFE') AND is_subagent = 0 GROUP BY project_name ORDER BY COUNT(*) DESC LIMIT 1;" 2>/dev/null)
if [ -z "$MATCH" ]; then
  PROJECT=$(basename "$PWD" | tr -dc 'a-zA-Z0-9._-')
  MATCH=$(sqlite3 -noheader ~/.claude/mine.db "SELECT project_name, COUNT(*) FROM sessions WHERE project_name = '$PROJECT' AND is_subagent = 0 GROUP BY project_name LIMIT 1;" 2>/dev/null)
fi
echo "SCOPE|$MATCH"
`````

- If user names a project explicitly, scope to that project
- If user says "global" or "all", scope globally
- If cwd matches a project in mine.db, default to project scope
- Otherwise default to global
- When project-scoped, add `AND project_name = '<project>'` to WHERE clauses

## Step 1: Intent routing

Three core intents, plus search and freeform. If no argument is given, show the dashboard.

**CRITICAL: run ALL queries for an intent in a SINGLE Bash call. Present ONE clean formatted result. NEVER show raw SQL, table names, or intermediate output.**

---

### DASHBOARD (default — no argument, or "status", "overview", "today")

The answer to "what's happening?" Recent activity, where compute goes, whether sessions are productive.

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- summary (7d)
SELECT 'SUMMARY' s, COUNT(*) sessions,
  ROUND(SUM(duration_active_seconds) / 3600.0, 1) active_hrs,
  ROUND(SUM(estimated_cost_usd), 2) api_value,
  ROUND(SUM(total_cache_read_tokens) * 100.0 / NULLIF(SUM(total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens), 0), 1) cache_pct,
  SUM(CASE WHEN compaction_count > 0 THEN 1 ELSE 0 END) compacted,
  (SELECT COUNT(*) FROM tool_calls tc JOIN sessions s2 ON tc.session_id=s2.id WHERE s2.is_subagent=0 AND tc.tool_name='Bash' AND tc.input_summary LIKE '%git commit%' AND s2.start_time >= date('now', '-7 days')) commits
FROM user_session_costs WHERE start_time >= date('now', '-7 days');

-- top projects (7d)
WITH ranked AS (
  SELECT project_name, COUNT(*) sessions,
    ROUND(SUM(estimated_cost_usd), 2) api_value,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) rn
  FROM user_session_costs
  WHERE start_time >= date('now', '-7 days') AND project_name IS NOT NULL
  GROUP BY project_name
)
SELECT 'PROJ' s, project_name, sessions, api_value FROM ranked WHERE rn <= 5
UNION ALL
SELECT 'PROJ_OTHER' s, COUNT(*)||' more', SUM(sessions), ROUND(SUM(api_value),2) FROM ranked WHERE rn > 5;

-- session health (7d)
SELECT 'HEALTH' s,
  SUM(CASE WHEN tool_use_count > 20 AND (SELECT COUNT(*) FROM tool_calls tc WHERE tc.session_id=user_session_costs.id AND tc.tool_name='Bash' AND tc.input_summary LIKE '%git commit%') = 0 THEN 1 ELSE 0 END) burned,
  SUM(CASE WHEN compaction_count > 0 THEN 1 ELSE 0 END) compacted,
  COUNT(*) total
FROM user_session_costs WHERE start_time >= date('now', '-7 days');
SQL
`````

Format:
1. **Freshness line**: `data: <first_date> → <latest_date> · scope: <project|global>`
2. **7-day summary**: sessions | active hours | commits | API value | cache hit %
3. **Top projects**: project | sessions | API value
4. **Health line**: "X of Y sessions shipped commits. Z needed compaction."
5. **Insight**: one specific observation from the data (compare to prior week, flag outliers, surface patterns)

---

### SEARCH ("search", "find", or any quoted term)

The answer to "what happened?" Full-text search across every conversation.

`````bash
TERM='<escaped_search_term>'
sqlite3 -header -separator '|' ~/.claude/mine.db <<SQL
SELECT m.session_id, s.project_name, s.start_time, m.role,
       snippet(messages_fts, 0, '>>>', '<<<', '...', 40) AS match
FROM messages_fts
JOIN messages m ON m.id = messages_fts.rowid
JOIN sessions s ON m.session_id = s.id
WHERE messages_fts MATCH '"$TERM"' AND s.is_subagent = 0
ORDER BY m.timestamp DESC LIMIT 20;

SELECT 'TOTAL' s, COUNT(*) total_matches
FROM messages_fts
JOIN messages m ON m.id = messages_fts.rowid
JOIN sessions s ON m.session_id = s.id
WHERE messages_fts MATCH '"$TERM"' AND s.is_subagent = 0;
SQL
`````

Escape single quotes by doubling them. Wrap search term in double quotes inside MATCH to treat as literal phrase. Group results by session. Show: project, date, prompt snippet, match count.

---

### HEALTH ("health", "mistakes", "wasted", "loops", "stuck", "burned")

The answer to "am I using this well?" Measures session OUTCOMES, not individual tool errors. A session's health is determined by what it produced, not which commands failed.

`````bash
sqlite3 -header -separator '|' ~/.claude/mine.db <<'SQL'
-- session outcome classification (last 30 days)
WITH session_outcomes AS (
  SELECT
    u.id,
    u.project_name,
    u.start_time,
    u.tool_use_count,
    u.compaction_count,
    u.duration_active_seconds,
    ROUND(u.estimated_cost_usd, 2) as api_value,
    SUBSTR(u.first_user_prompt, 1, 80) as prompt,
    (SELECT COUNT(*) FROM tool_calls tc
     WHERE tc.session_id = u.id AND tc.tool_name = 'Bash'
     AND tc.input_summary LIKE '%git commit%') as commits,
    (SELECT COUNT(DISTINCT tc.input_summary) FROM tool_calls tc
     WHERE tc.session_id = u.id AND tc.tool_name IN ('Write','Edit')) as files_mutated
  FROM user_session_costs u
  WHERE u.start_time >= date('now', '-30 days')
    AND u.duration_wall_seconds < 86400
),
classified AS (
  SELECT *,
    CASE
      WHEN commits > 0 THEN 'shipped'
      WHEN files_mutated = 0 AND tool_use_count > 5 THEN 'explored'
      WHEN tool_use_count > 20 AND commits = 0 AND files_mutated > 0 THEN 'burned'
      WHEN tool_use_count <= 5 THEN 'quick'
      ELSE 'worked'
    END as outcome
  FROM session_outcomes
)
SELECT 'OUTCOMES' s, outcome, COUNT(*) n,
  ROUND(AVG(api_value), 2) avg_value,
  ROUND(AVG(duration_active_seconds / 60.0), 1) avg_active_min
FROM classified GROUP BY outcome ORDER BY n DESC;

-- burned sessions detail (high effort, no commits, wrote files)
SELECT 'BURNED' s, c.project_name, c.start_time, c.tool_use_count tools,
  c.compaction_count compactions, c.api_value, c.prompt
FROM (
  SELECT so.*,
    CASE WHEN so.commits > 0 THEN 'shipped'
      WHEN so.files_mutated = 0 AND so.tool_use_count > 5 THEN 'explored'
      WHEN so.tool_use_count > 20 AND so.commits = 0 AND so.files_mutated > 0 THEN 'burned'
      WHEN so.tool_use_count <= 5 THEN 'quick'
      ELSE 'worked' END as outcome
  FROM session_outcomes so
) c WHERE c.outcome = 'burned'
ORDER BY c.api_value DESC LIMIT 5;

-- loop detection: files edited 5+ times in a single session (last 30d)
SELECT 'LOOPS' s, s.project_name, tc.input_summary file,
  COUNT(*) edits, s.start_time
FROM tool_calls tc
JOIN sessions s ON tc.session_id = s.id
WHERE s.is_subagent = 0 AND tc.tool_name IN ('Write','Edit')
  AND tc.input_summary IS NOT NULL
  AND s.start_time >= date('now', '-30 days')
GROUP BY tc.session_id, tc.input_summary
HAVING edits >= 5
ORDER BY edits DESC LIMIT 10;

-- compaction as complexity signal
SELECT 'COMPACTION' s,
  CASE WHEN duration_wall_seconds < 1800 THEN '<30m'
    WHEN duration_wall_seconds < 3600 THEN '30-60m'
    ELSE '1hr+' END as bucket,
  COUNT(*) sessions,
  SUM(CASE WHEN compaction_count > 0 THEN 1 ELSE 0 END) compacted,
  ROUND(AVG(compaction_count), 1) avg_compactions
FROM user_session_costs
WHERE start_time >= date('now', '-30 days') AND duration_wall_seconds < 86400
GROUP BY 1 ORDER BY 1;
SQL
`````

Format:
1. **Session outcomes** (last 30 days):

| outcome | what it means | sessions | avg API value | avg active min |
|---------|---------------|----------|---------------|----------------|
| shipped | committed code | N | $X | Ym |
| explored | read-heavy, no mutations — research | N | $X | Ym |
| burned | wrote files but never committed — effort wasted | N | $X | Ym |
| worked | mutated files, <20 tool calls — small task | N | $X | Ym |
| quick | ≤5 tool calls — trivial | N | $X | Ym |

2. **Burned sessions** (top 5 by API value): project, date, tool count, compactions, cost, first prompt
3. **Loops**: files edited 5+ times in one session — these are where Claude got stuck
4. **Compaction by session length**: when does context overflow start?
5. **Insight**: "X% of sessions shipped commits. burned sessions cost $Y total — consider splitting these into smaller tasks."

---

### FREEFORM (anything else)

If the user's question doesn't match dashboard, search, or health — use the schema to construct a read-only SELECT query. Claude is great at this. Just follow the rules.

**Schema reference** (key tables and views):

| table/view | what it has |
|---|---|
| `sessions` | id, project_name, model, start_time, duration_wall_seconds, duration_active_seconds, tool_use_count, compaction_count, first_user_prompt, is_subagent |
| `tool_calls` | session_id, tool_name, input_summary, timestamp |
| `errors` | session_id, tool_name, error_message, timestamp |
| `subagents` | parent_session_id, agent_type, duration_seconds, tool_use_count |
| `messages` | session_id, role, content_preview, input_tokens, output_tokens, cache_read_tokens |
| `messages_fts` | FTS5 full-text index on messages (use MATCH) |
| `user_session_costs` | **main view** — sessions with costs, durations, tokens (is_subagent=0, valid model) |
| `user_tool_calls` | tool calls with project_name (main sessions only) |
| `project_costs` | per-project aggregates |
| `daily_costs` | per-day aggregates |
| `session_costs` | per-session cost with model pricing applied |

Common freeform queries people ask:
- "how much did project X cost" → SUM(estimated_cost_usd) WHERE project_name
- "top tools" → GROUP BY tool_name ORDER BY COUNT(*) DESC
- "cache hit rate" → cache_read_tokens / (input + cache_creation + cache_read)
- "compare this week vs last" → two CTEs with different date filters
- "most edited files" → GROUP BY input_summary WHERE tool_name IN ('Write','Edit')
- "story of project X" → sessions ordered by start_time with first_user_prompt

NEVER write to the database. NEVER show SQL to the user. If a query fails, describe what data was unavailable, not which table was missing.

---

## Subscription plan awareness

`estimated_cost_usd` is the **API inference value** — what usage would cost at per-token rates. Most Claude Code users are on a subscription.

| plan | price | notes |
|---|---|---|
| Pro | $20/month | usage-limited |
| Max 5x | $100/month | 5x Pro allowance |
| Max 20x | $200/month | 20x Pro allowance |
| API direct | per-token | billed at published rates |

- Label dollar amounts as **"API value"** not "cost" — subscription users aren't paying per-token
- When showing totals, add ROI context: `$2,055 API value → 103x Pro · 21x Max 5x · 10x Max 20x`

## Presentation rules

- All counts default to main sessions (is_subagent = 0). Show subagent data as secondary only
- Start every output with a freshness line: `data: <first_date> → <latest_date> · scope: <project|global>`
- Run ALL queries in ONE Bash call. Present ONE formatted result
- Format: dollars with commas + 2 decimals, tokens with K/M/B suffixes
- Every top-N list ends with a summary of what was excluded ("+N more...")
- Every output includes at least one **insight line** — a short observation derived from the data
- Read-only. NEVER write to the database
- Escape single quotes by doubling them in SQL strings
- NEVER show SQL, table names, or raw query output to the user
