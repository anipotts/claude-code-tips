<!-- tested with: claude code v2.1.122 -->

<!-- tested with: claude code v2.1.122 -->

# lore v2 - observability as a service

Status: draft - v3 horizon

## summary

lore today is a local sqlite analytics layer: one file at `~/.claude/lore/lore.db`, hooks that append rows, a few intents on top. v2 reframes lore as a first-class observability service that other plugins (cc, time, future ones) consume through a stable interface instead of poking at the db directly.

the bet: once dimensions are rich enough to answer "what combo of model + thinking level + feature stack + billing method produces my best sessions," lore becomes load-bearing for the whole toolkit, not just a reporting tool.

## scope

### schema expansion

new dimensions to capture per session, per event, or per tool call (decided case by case during implementation):

- **model**: sonnet-4.6, opus-4.7, haiku-4.5, etc. versioned.
- **thinking level**: none, think, megathink, ultrathink.
- **cli version**: `claude --version` at session start.
- **permission mode**: default, auto, plan, bypassPermissions.
- **fast mode**: fast vs normal (user-set or session-inherited).
- **compaction state**: fresh session, post-compaction, manual-clear.
- **billing method**: subscription tier (pro / max-5x / max-20x), direct API, Vertex AI, Bedrock, Foundry, enterprise SSO. captured once per session, cached.
- **feature stack in use**: plugins enabled, MCP servers connected, hooks firing, skills invoked, agents spawned, slash commands used. the stack is captured as a session-level vector.
- **session -> outcome mapping**: commits made, files changed, PRs opened, tests run, exit reason (user-stop, compact, crash, timeout).

dimensions stay additive. nothing existing gets dropped or renamed.

### MCP interface

lore exposes three tool surfaces instead of the current "intents" model.

- `lore.query(sql | intent)` - run a named intent ("burn", "hotspots", "loops") or a raw SQL string against a view layer. rationale: intents stay ergonomic, SQL stays an escape hatch.
- `lore.subscribe(topic, filter)` - long-lived stream of events matching a filter (e.g. "tool=Bash, exit_code!=0"). rationale: other plugins need push, not poll, to react in-session.
- `lore.summary(range)` - pre-aggregated rollups over a time range (day / week / month / custom). rationale: common dashboards + content stats shouldn't require each caller to write their own group-by.

each surface is documented with example payloads in the implementation RFC that follows.

### decouple cc from direct db reads

today cc's `time-project-hint.sh` (in the time plugin) shells out to `sqlite3 -readonly ~/.claude/lore/lore.db` to compute historical throughput per project. this couples cc/time to lore's on-disk schema, breaks if lore moves the file, and duplicates query logic across plugins.

migration path:

1. lore v2 ships the MCP interface with an intent like `lore.query("time.project_hint", {project})` that returns the same shape time currently parses.
2. time's hook gets updated to call the MCP endpoint. fallback: if lore isn't installed, the hook returns an empty hint (fail-soft, no error).
3. `sqlite3 -readonly` path is kept for one release cycle behind a feature flag, then removed.

### backward compat

- existing `~/.claude/lore/lore.db` stays. v2 adds columns and tables, never drops them.
- legacy `~/.claude/mine.db` continues to be auto-migrated on first run (kept since v2.0).
- existing intents (`/lore`, `/lore:graph`, `/lore:remember`, `/lore:export`) keep working unchanged.
- pre-v2 sessions that lack new dimensions show up as `null` in queries. no backfill.

## non-goals

- per-token cost alerts. most users are on subscription plans where token cost isn't the metric that matters. direct API users can layer their own alerts on top of `lore.subscribe`.
- real-time UI. the existing dashboard script stays as-is. a proper web UI is a separate project.
- cross-host federation in v2. see open questions.

## open questions

- **index strategy for feature-stack dimension**: the plugins/MCPs/hooks vector is high-cardinality and mostly sparse. options: (a) normalized join table + GIN-style index, (b) denormalized JSON blob with sqlite JSON1 indexing, (c) materialized view per common query shape. TBD by benchmark.
- **privacy model for shared lore.db across hosts**: if a user runs lore on multiple machines, do the dbs merge, replicate, or stay separate? merge implies a sync mechanism and a privacy story (what leaves the creator machine). staying separate means dashboards have to union two sources. leaning toward separate-with-union in v2, merge in v3.
- **retention policy**: current lore.db is uncapped. at what size do we start rolling sessions older than N days into a compacted summary table? no answer yet.
