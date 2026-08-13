# legacy tool changelog

this record preserves marketplace and migration history for the compatibility
window. current publication changes live at [agents.anipotts.com/changes](https://agents.anipotts.com/changes/).

## 2026-04-28c

### docs: correct install syntax to use `@anipotts` (github owner) not `@claude-code-tips`
- **the actual fact**: when a marketplace is added via `/plugin marketplace add anipotts/claude-code-tips`, Claude Code registers it locally under the github **owner** (`anipotts`), not the `name` field in marketplace.json. So the canonical install syntax is `<plugin>@anipotts`. The `name` field in marketplace.json is display metadata only.
- the 2026-04-28b entry below documented `<plugin>@claude-code-tips` as the install syntax. That was wrong and broke installs for anyone who tried it. Corrected across README (en + 5 translated), plugin READMEs, docs/tips/plugins.md, root plugin.json description, CLAUDE.md / AGENTS.md inline phrase.
- canonical: `/plugin marketplace add anipotts/claude-code-tips` then `/plugin install cc@anipotts`, `/plugin install lore@anipotts`, `/plugin install time@anipotts`.
- if you tried the broken syntax: `/plugin marketplace remove anipotts` then `rm -rf ~/.claude/plugins/marketplaces/anipotts` (clean stale cache) then re-add and install with `@anipotts`.

## 2026-04-28b

### marketplace rename: `cc` -> `claude-code-tips`
- single-source-of-truth: there were three separate things named `cc` (marketplace internal name, plugin name, and a stale standalone github repo `anipotts/cc`). marketplace internal name renamed to `claude-code-tips` to remove that overload. plugin names unchanged (cc, lore, time still install the same way).
- the standalone `anipotts/cc` github repo is being archived; do not use it. the canonical and only source is `anipotts/claude-code-tips`.
- (note: see 2026-04-28c above; this entry originally included incorrect install-syntax instructions that have since been corrected.)

## 2026-04-28

### cc plugin v3.1.0
- single `cc` tool with 4 actions (`sessions`, `send`, `announce`, `check`); replaces the earlier 5-tool surface. backwards-compat tool names (`cc_sessions`, `cc_send`, `cc_announce`, `cc_check`) still work with a stderr deprecation note; planned to remove in v3.2.
- `/cc:sessions` slash command moved to `skills/sessions/SKILL.md` (model-invocable + user-invocable).
- in-process TTL cache for `liveSessions` and `recentFilesFor` keeps `tools/list` byte-stable across sessions, preserving prompt cache hits.
- unified `Lifecycle` registry (heartbeat, transcript-tail, watcher, db) with deterministic LIFO shutdown.
- 35 unit tests across `tests/{action,cache,lifecycle}.test.ts`.
- alwaysLoad declared in `.mcp.json` so cc starts before tool-search defers it.
- session identity resolved via parent-pid walk (CC does not pass `CLAUDE_SESSION_ID` to MCP children).

### plugin renames
- **mine -> lore** (v2.0): the session-mining plugin is now `lore`, framed as a deterministic knowledge graph (sessions, files, projects, tools, resumes as nodes/edges). new commands `/lore`, `/lore:remember`, `/lore:graph`, `/lore:export`, `/lore:help`. database moved to `~/.claude/lore/lore.db`. legacy `~/.claude/mine.db` is auto-migrated on first run, kept as backup. internal `mine.py` filename retained for source-import compatibility through v2.x; rename to `lore.py` deferred until the bun port lands.
- **fuel/pulse -> time** (v2.0): the resource-meter plugin's manifest name is now `time`. user-facing slash command stays `/fuel` (with sub-actions `state | handoff | quiet | loud`). adds `/time-estimate`, `/time-calibrate`, `/time-benchmark` skills (model-invocable, not surfaced in slash menu). install via `/plugin install time@cc`.

### versions
- cc plugin manifest aligned to 3.1.0 (was lagging at 3.0.1 vs `package.json` 3.1.0).
- root `.claude-plugin/plugin.json` and marketplace `metadata.version` aligned to 3.1.0.
- `release.yml` workflow updated to bump cc plugin.json + cc package.json + root plugin.json + marketplace metadata on tag push (was hardcoded to deleted `plugins/mine/...` path).

### docs consolidation
- removed: `docs/auto-merge.md`, `docs/rfcs/mini-control-plane.md`, `docs/rfcs/freshness-watcher.md` -- repo-specific operational policy that did not generalize as teaching content.
- scrubbed: `docs/automation.md` reframed as patterns for daemons / cron / github actions instead of listing this repo's specific CI workflows.
- renamed: `docs/rfcs/mine-v2-observability.md` -> `docs/rfcs/lore-v2-observability.md` and updated to match the lore namespace.
- updated: `docs/cost.md`, `docs/mistakes.md`, `docs/tips/plugins.md`, all five `docs/comparisons/*.md` to use `lore` (was `mine`) and `lore.db` (was `mine.db`).
- updated: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md` to reference the three-plugin shape (cc / lore / time) and the bun-test path for cc.

### README
- `tested with` badge bumped to v2.1.122 (was v2.1.94).
- `fuel@cc` -> `time@cc` in the install block; added the time install line.
- "12 CI workflows" detail-list replaced with a generic automation summary.
- non-English READMEs (`README.{es,hi,ja,pt-BR,zh-CN}.md`) regenerated by `translate.yml` on push (haiku-backed) using an updated glossary that includes `lore`, `time`, `fuel`.

## 2026-04-22

### cc plugin v2.1.0
- time subsystem folded in: a `time` rule, SessionStart `time-project-hint` hook, and three skills (`/time-estimate`, `/time-calibrate`, `/time-benchmark`)
- rule content: bimodal session modes (quick, standard, marathon), model x effort throughput matrix (Opus 4.7/4.6/Sonnet 4.6 x low/medium/high/xhigh/max, Haiku 4.5 no-effort), 3-tier parallelism (main agent, subagent via Task, agent teammate via experimental agent-teams), relaxed compaction warnings for the 1M context era
- hook: reads `~/.claude/mine.db` if present, resolves cwd to git repo root, injects last-5-sessions-in-project timing on SessionStart, silent on missing db or zero matches, exits 0 on any failure path
- skills resolve model and effort level at call time (dynamic), so estimates match your actual `/effort` setting

### naming
- subsystem renamed from `claude-time` to `time` (now under the cc namespace: `plugins/cc/rules/time.md`, `/cc:time-*` skill paths). Legacy references retired; historical artifacts (commit history, backups) untouched.

### versions
- `plugins/cc/.claude-plugin/plugin.json`, `plugins/cc/server.ts`, and top-level `.claude-plugin/plugin.json` aligned to 2.1.0 to match marketplace metadata

### fuel plugin
- resurrected as the third plugin in the marketplace (shipped briefly as v1.0.0 earlier in april, orphaned during the cc rewrite)
- three meters: 5-hour session window, 7-day rolling weekly cap, and current conversation's 200k context. driven off the statusline stdin JSON (the only programmatic surface anthropic exposes for rate limits)
- pattern: statusline writes `~/.claude/.fuel_cache`, UserPromptSubmit hook reads cache and injects threshold-tier text into additionalContext. silent under 60%, compact meter line 60-80%, proactive nudge 80-90%, personalized p50 from mine.db 90-95%, dramatic intervention + handoff suggestion 95%+
- command surface: `/fuel state` reads the cache directly, `/fuel handoff` drafts a clean stopping point + next-session opening prompt, `/fuel quiet` and `/fuel loud` toggle suppression via a flag file
- version bumped to 2.1.0 to align with this marketplace release. em dashes removed, version stamps refreshed to v2.1.118
- shipped as `pulse` earlier in the day, renamed to `fuel` before release.

### slash command UX
- plugin slash command renamed from `/cc:cc` to `/cc:sessions` (removes the ugly duplicate-name form in the slash menu)
- `time-*` skills marked `user-invocable: false` so they stop cluttering the slash menu; still fully model-callable
- `/cc:sessions` replaces every example in `plugins/cc/README.md`

### docs and governance
- README "what's inside" teaser above the quickstart with a `/cc:time-estimate` example
- README subtitle rewritten: positioning (patterns battle-tested across yc startups, public tech companies, unicorns) replaces "my claude code setup"; star-CTA removed in favor of "start here" tip links
- cc README documents namespaced (`/cc:time-*`) as canonical; bare form works when no collision
- em dashes removed from shipped mine plugin files, `plugins/mine/.claude-plugin/plugin.json`, `CHANGELOG.md`, and `docs/cost.md`
- added `CONTRIBUTING.md` (PR checklist, test-locally guidance), `SECURITY.md` (private advisory path, known risks), `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)
- drafted v3-horizon RFCs in `docs/rfcs/`: `mine-v2-observability.md`, `freshness-watcher.md`, `mini-control-plane.md`

### review automation
- replaces CodeRabbit with an ai-review-team: `anthropics/claude-code-action` (prose, voice, contract shape) plus a codex reviewer (openai responses api, o3-mini) for bugs, security, shell/python correctness
- historical rubric at `.github/AI_REVIEW_RUBRIC.md` gave both reviewers a fixed output format, lane split, and auto-dismiss list for voice-conflicting style nits
- historical workflow at `.github/workflows/ai-review.yml` ran on pull requests, issues, and manual dispatch; it was concurrency-gated and skipped drafts
- `.coderabbit.yaml` disables CodeRabbit auto-reviews; full uninstall is a one-click action in repo settings.

## 2026-03-15

### mine plugin
- renamed plugin: miner → mine
- renamed features: scar → mistakes
- removed: gauge (regex model advisor)
- added: burn cost-anomaly hook (fires on PreCompact)
- added: hotspots and loops query intents
- updated parser with user-centric metrics
- added 125-test suite (pytest)

### new tools
- live session dashboard (`scripts/dashboard.py`) - textual TUI
- replay capture hook + /replay command
- /dashboard slash command

### docs
- refreshed all 5 comparison docs with current pricing
- updated guide, cost analysis, troubleshooting, glossary

### CI
- fixed broken paths in docs-audit.yml and validate.yml
- added upstream-watcher PR permission docs
- added tests/ to python-check validation

### infra
- added .gitleaks.toml for test fixture allowlisting

## 2026-03-08

### initial release
- mine plugin v1.0: search, mistakes, burn, hotspots, loops
- 19 docs covering beginner to advanced claude code patterns
- 9 slash commands, 8 agents
- 8 CI workflows for autonomous maintenance
- standalone hooks: safety-guard, panopticon, context-save, notify

<!-- tested with: claude code v2.1.122 -->
