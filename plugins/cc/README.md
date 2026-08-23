> archive compatibility notice: `cc` is frozen and supported only for security, data-loss, and installation blockers through 2026-11-05. see [archived tools](../../docs/archive.md).

<!-- tested with: claude code v2.1.220 -->

# cc

historical documentation for a local claude code session-messaging plugin. `cc` records session presence, awareness digests, file-overlap signals, and direct messages in local state. it can reduce coordination mistakes, but it does not prevent concurrent edits or replace worktree ownership and review.

## install

```
/plugin marketplace add anipotts/claude-code-tips
/plugin install cc@anipotts
```

zero configuration. works on macos, linux, wsl.

**runtime:** [bun](https://bun.sh) 1.1+. install with `curl -fsSL https://bun.sh/install | bash` (~15s, one-time). bun replaces node + tsx + better-sqlite3 with a single binary; cold-start is ~13× faster and there is no native-module compile step.

## quickstart

cc is **one tool with four actions**. invoke via the `cc` MCP tool directly,
or trigger the `sessions` skill via `/cc:sessions` or natural language.

```
# list peers
cc({ action: "sessions" })

# DM a peer (asking a question)
cc({ action: "send", to: "abcd1234", message: "30d vs 90d refresh?", urgency: "question" })

# broadcast status to all peers
cc({ action: "announce", summary: "refactoring auth.ts on feat/oauth" })

# pull awareness digest
cc({ action: "check" })
```

## how awareness works (the gmail-cc metaphor)

cc is the email cc line for claude code sessions. it keeps you informed while
you retain control. when another session does something relevant, you see it in
context when you start your next turn. you decide whether to act.

when you call `cc(action='check')`, cc returns an awareness digest: direct
messages, peers' recent file activity, and file-overlap alerts. only new
items since your last check are surfaced (delta semantics). empty digests
return "(no new cc activity)".

the digest looks like:

```
cc digest (2 other sessions active)

direct:
- abcd1234 (4m, question) "30d vs 90d refresh?": auth refactor, legal wants shorter window...

activity:
- abcd1234 @ ~/repo-a (src/auth.ts, src/tokens.ts): refactoring session storage [7m]
- ef567890 @ ~/repo-b (lib/deploy/staging.ts): investigating failed CF deploy [12m]

file overlap:
- src/auth.ts: also touched by abcd1234 within 8m. coordinate via cc(action='send').
```

active turn cost: ~200-400 tokens. quiet turn cost: 0 tokens.

## actions

cc 3.1 is **one tool, four actions**. dispatched on the `action`
discriminator; the model never has to choose between cousin tools.

| action | does |
|---|---|
| `sessions` | list live sessions (`include_self?: boolean`). returns id, short_id, cwd_basename, recent_files, last_seen_s |
| `send` | direct-message a peer. fields: `to` (short id, full id, or cwd basename), `message`, optional `subject` / `urgency` (`low`/`normal`/`urgent`/`question`) / `meta` |
| `announce` | broadcast status visible in peers' next digest. fields: `summary`, optional `detail` |
| `check` | pull awareness digest (peers' recent files, file overlaps, unread DMs). delta-semantic by default; `since_s` forces lookback |

## file-overlap alerts (the killer feature)

the mcp server passively reads your own session transcript and publishes the
last ~10 files your tools touched into `sessions.db`. when any other session
has touched a file you've touched within the last ~10 minutes, your next
digest surfaces an alert. this is what stops two claude code sessions from
silently clobbering each other's work.

no PostToolUse hook. no extra tokens inside the conversation. the transcript
read is filesystem-level and never enters your context.

## hooks

cc v3 has **no hooks**. presence registration happens at MCP-connect time;
heartbeat keeps the row fresh; cleanup runs at process shutdown. The
SessionStart / UserPromptSubmit / SessionEnd hook trio that v2 used has
been replaced by:

- explicit `cc(action='check')` calls (when the model wants the digest)
- channel push notifications (when `--channels` is on, mid-turn)

This means cc's per-prompt cost is exactly zero unless the model decides
the digest is relevant.

## realtime push (tier 2, opt-in)

by default cc is pull-only. if you want inbound direct messages to land
mid-turn rather than at the next prompt, launch claude with `--channels`:

```bash
alias claude-cc-live='claude --channels'
claude-cc-live
```

trade-off: claude code disables plan mode and `AskUserQuestion` while
`--channels` is active (per v2.1.117). most users should leave this off
and stay on tier 1 (pull), where every deferred tool works normally. the
mcp server supports both modes from the same install; there is no code
change to switch.

## structure

```
plugins/cc/
├── .claude-plugin/plugin.json
├── server.ts                       mcp server (single 'cc' tool, 4 actions)
├── lib/
│   ├── action.ts                   verb surface: zod discriminated union + JSON schema
│   ├── lifecycle.ts                start/stop coordinator for heartbeat/tail/watcher/db
│   ├── cache.ts                    TTLCache for byte-stable hot paths
│   ├── render.ts                   Digest → text
│   └── transcript-tail.ts          watches own transcript, publishes recent_files
├── db/
│   ├── schema.sql                  sessions, recent_files, announcements (+ legacy topics/subs/questions)
│   └── migrate.ts                  opens db, applies schema, migrates legacy state dir
├── skills/sessions/SKILL.md        natural-language trigger surface
└── tests/                          bun test for action / cache / lifecycle
```

state at `${CLAUDE_CONFIG_DIR:-~/.claude}/channels/cc/`:

```
sessions.db            sqlite metadata (wal mode)
inbox/<sid>/           direct-message files (atomic rename)
```

(legacy `~/.claude/cc/` is migrated automatically on first start; a symlink
stays at the old path so external tooling pointing there keeps working.)

messages bodies stay on filesystem so directory-based delivery still works
if sqlite is unavailable. metadata is sqlite so concurrent writes from many
sessions converge safely.

## troubleshooting

- **no digest shows up:** check that the plugin is enabled (`/plugin` menu).
  if your cc state dir didn't exist, it's created on first launch; run any
  tool that loads the mcp server, then try `/cc:sessions`.
- **"session X not found":** recipient session needs cc enabled and must be
  live (heartbeat every 30s). use `/cc:sessions` to see what's live.
- **session name shows as 8-char id:** cc pulls the native session name from
  `~/.claude/sessions/<pid>.json` when available; falls back to `basename(cwd)`
  otherwise.
- **plan mode is missing when running `--channels`:** expected. tier 2
  trade-off. switch back to default `claude` launch for tier 1 behavior.
- **file-overlap alerts empty even though two sessions are editing the same
  file:** the transcript-tail watcher needs ~10-15s after a tool call to
  publish the file path. very fast back-and-forth edits may race.
- **sqlite database corrupted:** remove `${CLAUDE_CONFIG_DIR:-~/.claude}/cc/sessions.db*`
  and restart any session; schema is recreated.

## upgrading from cc 2.x

if you used `/cc:time-estimate`, `/cc:time-calibrate`, `/cc:time-benchmark`, or the SessionStart project-timing hint, those moved out of cc into a focused `time` plugin in this same marketplace. install it with:

```
/plugin install time@anipotts
```

cc 3.0 is **session mesh, period.** email-cc semantics for agents.

## uninstall / rollback

three options, in increasing order of thoroughness.

**1. CC's built-in (CC 2.1.121+)** — flips `enabledPlugins` and removes
the marketplace install, with optional dependency cascade:

```
claude plugin uninstall cc --prune
```

`--prune` runs `claude plugin autoremove` after, cleaning up any
auto-installed deps that are no longer needed (none for cc today, but
correct hygiene). Add `-y` if you're invoking from a script or
non-TTY context. This does **not** touch runtime data at
`~/.claude/channels/cc/` or the version cache at
`~/.claude/plugins/cache/cc/cc/`.

**2. /plugin uninstall cc inside Claude Code** — same as the CLI form
but no `--prune` flag is plumbed through; data and cache stay.

**3. Cascade uninstall (full reset)** — for a true clean slate
including runtime state, run the script that ships with the plugin:

```bash
bash "$CLAUDE_PLUGIN_ROOT/bin/uninstall.sh"
```

(or, if `$CLAUDE_PLUGIN_ROOT` isn't set in your shell, point it at the
plugin source directly: `bash plugins/cc/bin/uninstall.sh`)

The script:

1. stops any running `cc-server` child processes (compiled binary or
   bun-source forms),
2. wipes `~/.claude/channels/cc/` (`--keep-data` to preserve it),
3. removes the cc version cache under `~/.claude/plugins/cache/cc/cc/`,
4. removes `cc@anipotts` from `enabledPlugins` in `settings.local.json`.

> **Important: restart Claude Code afterwards.** If you run the script
> from inside a CC session that has the cc plugin loaded, the parent CC
> process will respawn the MCP child on the next hook fire and
> recreate `~/.claude/channels/cc/`. The script prints a warning when it
> detects this. For a true reset: run the script, then quit and
> relaunch CC.

To reinstall fresh:

```
/plugin install cc@anipotts
```

The script is idempotent and safe to run multiple times.

## reliability notes

**MCP auto-retry (CC 2.1.121+).** If cc's MCP server fails to start —
bun not installed, dependency install timed out, transient port issue
— Claude Code retries automatically with exponential backoff. You no
longer need to `/reload-plugins` after a flaky first start. Look for
`cc: ...` lines in CC's MCP debug output (`claude --mcp-debug`) if
something looks off.

**Eager load.** cc declares `alwaysLoad: true` in its `.mcp.json`, so
its single tool surface is available the moment the session starts
rather than being deferred behind tool-search. cc is foundational infra
(every session sends/receives messages) so the ~2KB of tool schema at
startup is the right tradeoff.

**Prompt-cache stability.** cc 3.1 collapsed five tools into one with a
discriminated-union schema. The single tool surface is byte-stable
across every session that uses cc, so Anthropic's 5-min prompt cache
hits across consecutive turns. The in-process TTL cache (200ms) on
`liveSessions` and `recentFilesFor` further guarantees byte-identical
output when the same call fires twice within an agent turn.

## quality

- 35 unit tests in `tests/` covering schema, cache, lifecycle. run with
  `bun test tests/` from `plugins/cc/`.
- `bun smoke` end-to-end checks the MCP protocol round-trip (initialize
  through tools/list and tools/call).
- TypeScript strict mode; the dispatcher's switch is exhaustiveness-
  checked at compile time so adding a verb without wiring it up fails
  the build.
- Every `cc(action='send')` and `cc(action='announce')` payload runs
  through the exfil guard before hitting disk; refusing paths under
  `~/.claude/channels/cc/` blocks prompt-injection attempts to leak
  channel state.
