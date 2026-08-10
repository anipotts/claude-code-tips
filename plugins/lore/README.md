> legacy compatibility notice: `lore` is frozen and supported only for security, data-loss, and installation blockers through 2026-11-05. see [legacy tools](../../docs/legacy-tools.md).

<!-- tested with: claude code v2.1.220 -->

# lore

historical documentation for a local claude code transcript-analysis plugin. `lore` ingests session records into sqlite for search and derived relationships. the database stays local by default, but it can contain sensitive source, prompt, and usage metadata. review retention and backup behavior before installation.

## install

```bash
/plugin marketplace add anipotts/claude-code-tips
/plugin install lore@anipotts
```

## usage

```
/lore                       today's sessions, cost, top tools (dashboard)
/lore search "websocket"    full-text search across all conversations
/lore hotspots              files you keep editing across sessions
/lore loops                 repeated patterns across sessions
/lore:help                  full intent menu
```

knowledge-graph commands (schema v3+):

```
/lore:remember "decision: chose D1 over Supabase"  capture a decision/lesson/reminder/todo
/lore:remember list --tag d1                        list tagged notes
/lore:graph cooccurrence hook.py                    files that show up alongside hook.py
/lore:graph project lore                            top files + sessions for a project
/lore:graph summary                                 graph-wide counts
/lore:export notes                                  json snapshot of your notes
/lore:export project anipotts.com                   bundled json for a project
```

`/lore:remember` writes to a user-controlled `notes` table; `/lore:graph` reads the live `file_cooccurrences` view (computed from `tool_calls`, no extra storage); `/lore:export` writes portable snapshots. Session-resume edges and error-resolution edges are intentionally deferred -- they would need heuristics that are easier to validate once tagged data exists.

## how it works

a single python hook (`hooks/hook.py`) dispatches all events:

| event | what it does |
|---|---|
| SessionEnd | ingests the session transcript into sqlite |
| SessionStart | recalls relevant past sessions for the current project |
| PreCompact | flags cost anomalies before context compression |
| PostToolUseFailure | logs error patterns for `/lore` health intent |
| SubagentStop | tracks subagent usage |

data lives at `~/.claude/lore/lore.db`. legacy users on the v1.x `mine` plugin: `~/.claude/mine.db` is migrated automatically on first run, kept in place as a backup until you remove it manually. nothing leaves your machine.

## coverage: matching `/usage` exactly

`/lore` (default dashboard) shows two summary lines:

```
LIFETIME: 1,373 sessions · 661,949 messages · 105 active days · favorite Opus 4.6
COVERAGE: 691 / 1,373 main sessions (50.3%) — older transcripts deleted by CC retention sweep
```

**LIFETIME** is the canonical lifetime total, mirrored from Anthropic's pre-computed `~/.claude/stats-cache.json` and matches what Claude Code's built-in `/usage` shows.

**COVERAGE** is how much of the lifetime total lore has full transcript data for. The gap is the difference between sessions that ever happened (LIFETIME) and sessions whose JSONL transcripts are still on disk (lore can ingest). Two reasons the gap exists:

1. **CC's retention sweep deleted older JSONLs.** Claude Code periodically deletes transcripts older than the `cleanupPeriodDays` setting. Default is 30 days. If you set 30 and have a year of history, the sweep deleted 11 months of transcripts before lore could ingest them.
2. **You installed lore after some sessions had already happened.** Sessions before lore was installed never had their JSONLs ingested while they existed.

LIFETIME doesn't have these problems because Anthropic's `stats-cache.json` is computed from the same JSONLs but with a different retention rule (it accumulates totals into a single file before deleting).

### increase coverage going forward (set `cleanupPeriodDays` higher)

To stop CC from deleting transcripts so lore can ingest them all:

1. Open your Claude Code settings file at `~/.claude/settings.json`.
2. Set `cleanupPeriodDays` to a large number. `9999` is "effectively forever" without tripping any validation.

```json
{
  "cleanupPeriodDays": 9999
}
```

3. Save. The next CC SessionStart picks up the new value. No restart needed.

You can also set it per-project in `.claude/settings.json` (project) or `.claude/settings.local.json` (project, gitignored), or globally via the user file above. Local-project value wins over user-global per CC's standard precedence.

**Trade-off:** disk space. Each main session JSONL is typically 50 KB - 5 MB; subagent transcripts can run larger. With `cleanupPeriodDays: 9999` and heavy use, `~/.claude/projects/` can grow to several gigabytes per year. Run `du -sh ~/.claude/projects/` periodically to monitor.

**Constraint:** `cleanupPeriodDays: 0` is rejected by CC v2.1.83+ as an invalid value. Use `1` for "yesterday only" if you really want minimal retention; otherwise prefer 90, 180, 365, or 9999.

### environment variables

`cleanupPeriodDays` currently loads from `settings.json`. If a future CC release adds an environment-variable override (for example, `CLAUDE_CODE_CLEANUP_PERIOD_DAYS`), this README will document it.

### verify your setting

```bash
jq '.cleanupPeriodDays // "not set (defaults to 30)"' ~/.claude/settings.json
```

### what about historical gap (sessions deleted before you raised the setting)?

The transcript bytes are gone from `~/.claude/projects/`, so lore can never reconstruct them. But the per-session METADATA (sessionId, project, message count, created/modified timestamps, first prompt) still exists in `~/.claude/projects/<project>/sessions-index.json` files for as long as CC keeps those indexes around. Lore ingests these into the `anthropic_session_index` table on every SessionStart, so even sessions whose transcripts were deleted have their metadata preserved.

Query: `sqlite3 ~/.claude/lore/lore.db "SELECT session_id, project_path, message_count, created FROM anthropic_session_index ORDER BY created DESC LIMIT 20;"`

## structure

- `.claude-plugin/plugin.json` - plugin manifest
- `hooks/hook.py` - unified hook dispatcher
- `hooks/hooks.json` - hook event registrations
- `scripts/mine.py` - bulk session parser (backfill, incremental, export). filename retained for v2.x source compatibility; will be renamed once the bun port lands
- `scripts/schema.sql` - database schema
- `commands/lore.md` - `/lore` slash command (routes to skills/query)
- `skills/query/SKILL.md` - intent routing
- `skills/help/SKILL.md` - `/lore:help`
- `tests/` - pytest suite

## upgrading from mine 1.x

the `mine` plugin was renamed to `lore` in v2.0 and repositioned around its knowledge-graph dimension. the slash command is now `/lore` (not `/mine`). the database moved from `~/.claude/mine.db` to `~/.claude/lore/lore.db`; the migration is automatic on first launch and your old file is left in place as a backup. no data loss, no manual steps.
