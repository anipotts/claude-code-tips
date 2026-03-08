#!/usr/bin/env bash
set -euo pipefail

# stats-sync.sh -- SessionEnd hook that pushes live usage stats to a GitHub Gist
#
# updates three shields.io-compatible JSON files in a public Gist:
#   sessions.json   -- total session count
#   plan_spend.json -- estimated plan spend ($200/mo × months)
#   api_value.json  -- total API inference value at published rates
#
# setup:
#   1. create a public Gist with 3 empty JSON files (sessions.json, plan_spend.json, api_value.json)
#   2. set CLAUDE_STATS_GIST_ID in your environment or ~/.claude/settings.json
#   3. add this hook to SessionEnd in your settings
#
# requires: sqlite3, gh (GitHub CLI authenticated), python3
#
# hook event: SessionEnd
# tested with: claude code v1.0.34

DB="$HOME/.claude/miner.db"
GIST_ID="${CLAUDE_STATS_GIST_ID:-}"
MONTHLY_PLAN_COST="${CLAUDE_PLAN_COST:-200}"

# bail if no db or no gist configured
[[ -f "$DB" ]] || exit 0
[[ -n "$GIST_ID" ]] || exit 0

# read stdin (SessionEnd payload) but we don't need it
cat > /dev/null

# --- query miner.db ---

sessions=$(sqlite3 "$DB" "SELECT COUNT(*) FROM sessions;")
first_session=$(sqlite3 "$DB" "SELECT MIN(start_time) FROM sessions WHERE start_time IS NOT NULL;")

# per-model API value with correct rates (march 2026)
api_value=$(sqlite3 "$DB" "
SELECT CAST(ROUND(SUM(
  CASE
    WHEN model LIKE 'claude-opus-4-5%' OR model LIKE 'claude-opus-4-6%' THEN
      COALESCE(total_input_tokens, 0) * 5.0 / 1e6
      + COALESCE(total_cache_read_tokens, 0) * 0.50 / 1e6
      + COALESCE(total_cache_creation_tokens, 0) * 6.25 / 1e6
      + COALESCE(total_output_tokens, 0) * 25.0 / 1e6
    WHEN model LIKE 'claude-opus-4%' THEN
      COALESCE(total_input_tokens, 0) * 15.0 / 1e6
      + COALESCE(total_cache_read_tokens, 0) * 1.50 / 1e6
      + COALESCE(total_cache_creation_tokens, 0) * 18.75 / 1e6
      + COALESCE(total_output_tokens, 0) * 75.0 / 1e6
    WHEN model LIKE 'claude-sonnet%' THEN
      COALESCE(total_input_tokens, 0) * 3.0 / 1e6
      + COALESCE(total_cache_read_tokens, 0) * 0.30 / 1e6
      + COALESCE(total_cache_creation_tokens, 0) * 3.75 / 1e6
      + COALESCE(total_output_tokens, 0) * 15.0 / 1e6
    WHEN model LIKE 'claude-haiku-4%' THEN
      COALESCE(total_input_tokens, 0) * 1.0 / 1e6
      + COALESCE(total_cache_read_tokens, 0) * 0.10 / 1e6
      + COALESCE(total_cache_creation_tokens, 0) * 1.25 / 1e6
      + COALESCE(total_output_tokens, 0) * 5.0 / 1e6
    WHEN model LIKE 'claude-haiku-3%' OR model LIKE 'claude-3-haiku%' THEN
      COALESCE(total_input_tokens, 0) * 0.80 / 1e6
      + COALESCE(total_cache_read_tokens, 0) * 0.08 / 1e6
      + COALESCE(total_cache_creation_tokens, 0) * 1.0 / 1e6
      + COALESCE(total_output_tokens, 0) * 4.0 / 1e6
    ELSE 0
  END
)) AS INTEGER)
FROM sessions
WHERE model IS NOT NULL AND model != '' AND model != '<synthetic>';
")

# --- calculate plan spend ---

months=$(python3 -c "
from datetime import datetime
try:
    first = datetime.fromisoformat('${first_session}'.replace('Z','+00:00'))
    now = datetime.now(first.tzinfo) if first.tzinfo else datetime.now()
    months = max(1, (now.year - first.year) * 12 + now.month - first.month)
    print(months)
except:
    print(2)
" 2>/dev/null || echo "2")

plan_spend=$((months * MONTHLY_PLAN_COST))

# --- format values ---

sessions_fmt=$(printf "%'d" "$sessions")
plan_fmt=$(printf "\$%'d" "$plan_spend")

if (( api_value >= 1000 )); then
  api_fmt=$(python3 -c "print(f'\${${api_value}/1000:.1f}K')")
else
  api_fmt="\$${api_value}"
fi

# --- update gist (single API call for all 3 files) ---

gh api --method PATCH "gists/$GIST_ID" \
  --input <(python3 -c "
import json, sys
data = {
    'files': {
        'sessions.json': {
            'content': json.dumps({
                'schemaVersion': 1,
                'label': 'sessions tested',
                'message': '${sessions_fmt}',
                'color': 'D4A574'
            })
        },
        'plan_spend.json': {
            'content': json.dumps({
                'schemaVersion': 1,
                'label': 'max plan spend',
                'message': '${plan_fmt}',
                'color': '6b7280'
            })
        },
        'api_value.json': {
            'content': json.dumps({
                'schemaVersion': 1,
                'label': 'API inference received',
                'message': '${api_fmt}',
                'color': '22c55e'
            })
        }
    }
}
json.dump(data, sys.stdout)
") > /dev/null 2>&1 || true
