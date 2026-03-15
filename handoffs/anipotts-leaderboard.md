# Claude Code Time Leaderboard for anipotts.com

## Context

You're adding a page to anipotts.com (a Next.js site) that shows a live coding leaderboard — like a fitness tracker but for AI-assisted coding. The data comes from Claude Code session transcripts stored in `~/.claude/projects/`.

This is part of a "Claude Code time" concept: visualizing how AI coding compresses human-equivalent development timelines. The page should feel like a personal dashboard that's impressive to show people.

## Data sources

1. **Session transcripts**: `~/.claude/projects/PROJECT_HASH/SESSION_ID.jsonl` — each line is a JSON object containing tool uses, messages, etc.
2. **Git history**: scan repos in `~/Code/active/` and `~/Code/organizations/` for commit timestamps to correlate with sessions
3. **Optional**: `~/.claude/mine.db` (SQLite) if it exists — has pre-parsed session data with tool counts, costs, etc.

## What to build

### Page: `/claude` or `/code` (your choice on what fits the site)

**Hero stats (big numbers, always visible):**
- Total sessions lifetime
- Total tool calls lifetime
- Total files mutated lifetime
- "Human equivalent time saved" — calculated using: each Write/Edit = ~5 min, each Bash = ~2 min, each Agent = ~15 min saved
- Current streak (consecutive days with at least 1 session)

**Throughput chart:**
- X-axis: days (last 30 days)
- Y-axis: tool calls per day
- Overlay line: files mutated per day
- Use any chart lib already in the project, or recharts/chart.js

**Session history table (last 20 sessions):**
- Date/time, duration, tool calls, files changed, project name (derived from path)
- Sortable columns

**"Burst records" section:**
- Fastest commit cadence (commits/hour)
- Most files changed in a single session
- Longest session
- Most tool calls in a single session

**Live indicator:**
- If a session JSONL was modified in the last 60 seconds, show a pulsing green dot with "coding now"

### Data pipeline

Two options depending on what's simpler for the site:

**Option A: Static generation (recommended)**
- A script (`scripts/generate-claude-stats.ts` or `.js`) that parses transcripts and outputs a JSON file
- `getStaticProps` reads that JSON at build time
- Run the script in a pre-build hook or manually with `npm run update-stats`

**Option B: API route**
- `/api/claude-stats` endpoint that parses transcripts on demand
- Cache the result for 5 minutes
- More complex but always fresh

### Design direction

- Dark theme (matches terminal aesthetic)
- Monospace font for numbers
- Green accent color (#22c55e) for active/positive indicators
- Minimal, data-dense — think GitHub contribution graph meets Strava
- Mobile responsive (stats stack vertically)
- No auth needed — this is a public flex page

## Key metrics calculations

```
Human time saved per tool call:
  Write: 5 min (human would read context, think, type, review)
  Edit: 5 min (same reasoning)
  Bash: 2 min (human would type, wait, interpret)
  Agent: 15 min (human would context-switch, research, synthesize)
  Read: 0.5 min (human would navigate, open, scroll)
  Grep/Glob: 1 min (human would think about search, type, scan results)

Session duration: last_message_timestamp - first_message_timestamp

Tools/min: total_tool_calls / session_duration_minutes

Throughput sparkline: group tool calls by 30-second buckets within a session
```

## JSONL parsing notes

Each line in the transcript is a JSON object. Tool uses appear as:
```json
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Edit","input":{...}}]}}
```

Parse each line, look for `tool_use` content blocks, extract `name` for the tool name. Count by type. Extract `file_path` from `input` when available (Edit, Write, Read have it).

Some lines may be malformed or incomplete (if session was interrupted). Wrap parsing in try/catch per line.

## What NOT to do

- Don't add auth or private data — this is public stats only (no conversation content)
- Don't parse message text content — only tool use metadata
- Don't over-engineer the data pipeline — static JSON generation is fine
- Don't add a CMS or admin panel
- Don't show cost data publicly (keep that private to /mine)
