<!-- tested with: claude code v1.0.34 -->

# /value

your actual API inference value from claude code. per-model breakdown, cost categories, ROI on your subscription

## what it does

queries `~/.claude/miner.db` and calculates what your usage would have cost at direct API rates. breaks down by model family (opus/sonnet/haiku), by cost category (input/output/cache read/cache write), and shows your effective ROI vs subscription price. this is the real number -- not an estimate, not a guess

## the command

```
/value
```

with time range:

```
/value 30d
/value 7d
/value 2026-01
```

## the prompt

```
When the user runs /value, query ~/.claude/miner.db and calculate the full API inference value of their Claude Code usage.

If the database doesn't exist, tell the user to install the miner plugin first and stop.

## Check DB exists

```bash
if [ ! -f ~/.claude/miner.db ]; then
  echo "no miner.db found — install the miner plugin first: claude plugin add anipotts/miner"
  exit 1
fi
```

## Parse arguments

If the user provides a time range:
- "7d" or "7 days" → WHERE start_time >= date('now', '-7 days')
- "30d" or "30 days" → WHERE start_time >= date('now', '-30 days')
- "2026-01" → WHERE start_time LIKE '2026-01%'
- no argument → all time

Store the WHERE clause in a variable for reuse across queries.

## Query 1: Per-model token breakdown

```sql
SELECT
  model,
  COUNT(*) as sessions,
  SUM(total_input_tokens) as input_tokens,
  SUM(total_output_tokens) as output_tokens,
  SUM(total_cache_read_tokens) as cache_read_tokens,
  SUM(total_cache_creation_tokens) as cache_write_tokens
FROM sessions
WHERE model IS NOT NULL AND model != '' AND model != '<synthetic>'
GROUP BY model
ORDER BY COUNT(*) DESC;
```

## Query 2: Aggregate stats

```sql
SELECT
  COUNT(*) as total_sessions,
  COUNT(DISTINCT project_name) as projects,
  SUM(tool_use_count) as tool_uses,
  ROUND(SUM(duration_wall_seconds) / 3600.0, 1) as hours,
  MIN(start_time) as first_session,
  MAX(start_time) as last_session
FROM sessions;
```

## Calculate API value

Apply these rates per million tokens (official anthropic API pricing):

### opus 4.x (claude-opus-4-6, claude-opus-4-5-*)
- input: $15.00/MTok
- output: $75.00/MTok
- cache read: $1.50/MTok
- cache write: $18.75/MTok

### sonnet 4.x (claude-sonnet-4-6, claude-sonnet-4-5-*)
- input: $3.00/MTok
- output: $15.00/MTok
- cache read: $0.30/MTok
- cache write: $3.75/MTok

### haiku 4.5 (claude-haiku-4-5-*)
- input: $0.80/MTok
- output: $4.00/MTok
- cache read: $0.08/MTok
- cache write: $1.00/MTok

For each model row, calculate:
- input_cost = input_tokens × rate / 1,000,000
- output_cost = output_tokens × rate / 1,000,000
- cache_read_cost = cache_read_tokens × rate / 1,000,000
- cache_write_cost = cache_write_tokens × rate / 1,000,000
- subtotal = sum of above

## Calculate ROI

Ask or infer the user's plan:
- If total sessions > 1000 or heavy opus usage → likely Max 20x ($200/mo)
- Otherwise assume Pro ($20/mo)
- Calculate months from first_session to last_session
- ROI = total_value / (monthly_cost × months)

## Output format

Present as a table with one row per model, showing sessions and dollar amounts.
Then show category breakdown (what % is input vs output vs cache).
Then show model family summary (opus vs sonnet vs haiku).
Then show ROI calculation.

Example:

# value — API inference breakdown

**period**: all time (first session: 2025-09-15, last session: 2026-03-08)

| model | sessions | input $ | output $ | cache read $ | cache write $ | total $ |
|-------|----------|---------|----------|--------------|---------------|---------|
| claude-opus-4-6 | 1,466 | $87.58 | $368.32 | $9,091.73 | $7,015.10 | $16,562.73 |
| claude-opus-4-5 | 560 | $75.66 | $119.18 | $3,772.55 | $4,090.93 | $8,058.32 |
| claude-haiku-4-5 | 1,473 | $6.57 | $2.44 | $242.33 | $378.72 | $630.06 |
| claude-sonnet-4-5 | 208 | $1.84 | $7.02 | $120.04 | $142.24 | $271.14 |
| claude-sonnet-4-6 | 21 | $0.17 | $1.03 | $21.84 | $32.33 | $55.37 |

**total API value: $25,577.61**

cost breakdown:
| category | amount | % |
|----------|--------|---|
| cache read tokens | $13,248.50 | 51.8% |
| cache write tokens | $11,659.32 | 45.6% |
| output tokens | $497.99 | 1.9% |
| input tokens | $171.81 | 0.7% |

model families:
| family | sessions | value | avg/session |
|--------|----------|-------|-------------|
| opus | 2,026 | $24,621.05 (96.3%) | $12.15 |
| haiku | 1,473 | $630.06 (2.5%) | $0.43 |
| sonnet | 229 | $326.50 (1.3%) | $1.43 |

ROI:
| metric | value |
|--------|-------|
| subscription | ~$1,200 (6 months × $200/mo Max 20x) |
| API inference value | $25,577.61 |
| ROI | 21x |
| you saved | $24,377.61 |

## Rules
- Format all dollar amounts with commas and 2 decimal places
- Format token counts with commas or K/M suffixes
- Sort models by session count descending
- Sort cost breakdown by amount descending
- Calculate ROI only if the time range spans at least 1 month
- If a model has no matching rate (unknown model), skip it and note it
- Read-only. Never write to the database
- This is the real number. Don't hedge or disclaim -- the rates are from anthropic's published API pricing. the tokens are from the actual API responses logged in the session transcripts
```

## why cache tokens dominate

most of your inference value comes from cache tokens, not input/output. here's why:

claude code uses prompt caching aggressively -- your system prompt, CLAUDE.md, file contents, and conversation history get cached. every turn re-reads that cache (cache_read_tokens) and occasionally updates it (cache_creation_tokens). a single 30-turn session might accumulate 50M+ cache read tokens.

at API rates, cache reads are 90% cheaper than input tokens, but the volume is enormous. 12B cache read tokens at opus rates ($1.50/MTok) = $18K. your subscription absorbs all of this.

## pairing with /ledger

`/ledger` shows you daily/weekly operational metrics (sessions today, top tools, active projects). `/value` shows you the lifetime financial picture. use `/ledger` to monitor burn rate, `/value` to justify the subscription.
