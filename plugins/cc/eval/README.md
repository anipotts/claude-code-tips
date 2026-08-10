<!-- tested with: claude code v2.1.133 (bun 1.3) -->

# cc eval harness

multi-peer simulation framework for cc plugin. spawns synthetic cc-server
children under an isolated `CLAUDE_CONFIG_DIR`, drives them via stdio
MCP JSON-RPC, captures real timing measurements, asserts on outcomes.

every number in the output is a `performance.now()`-derived measurement
of an actual operation. nothing is averaged from a single sample. nothing
is rounded before display.

## run

```bash
cd plugins/cc

# all scenarios, single iteration each (fastest sanity check)
bun eval/run.ts

# a specific scenario by number prefix
bun eval/run.ts 03

# scenarios whose name contains a substring
bun eval/run.ts --filter delta

# bench mode: 10 iterations per scenario, real p50/p95/p99
bun eval/run.ts --bench 10

# keep per-scenario logs even on success (default cleans them on pass)
bun eval/run.ts --keep-logs
```

## what each scenario measures

| scenario | real metrics |
|---|---|
| `01-cold-start` | spawn→MCP-ready (peer.boot), first cc.sessions roundtrip, sessions.db row exists for self |
| `02-multi-peer-roster` | both peers boot, latency from bob.spawn until alice.sessions includes bob |
| `03-digest-delta` | alice.announce roundtrip, latency from announce sent until bob's check shows it |
| `04-effort-verbosity` | char count of low-effort vs high-effort rendered digest, check roundtrip per effort |

extend by dropping a new file at `eval/scenarios/<NN>-<name>.ts` exporting
a `default async function (h: Harness, pluginRoot: string)` and a const
`scenarioName`.

## logs structure

every run gets a fresh `eval/logs/<runId>/` dir:

```
eval/logs/20260508154836-46s3v5__01-cold-start/
  alice-traffic.jsonl     ← every JSON-RPC line in/out, timestamped
  alice.stderr            ← cc-server stderr (CC_DEBUG trace lines)
  claude-config/          ← isolated CLAUDE_CONFIG_DIR for this scenario
    channels/cc/
      sessions.db
      sessions.db-wal
      ...
eval/logs/20260508154836-46s3v5/
  summary.md              ← markdown report (rendered to stdout too)
  summary.json            ← structured results
```

`<peer>.stderr` is full-fidelity raw cc-server output. when you set
`ccDebug: true` in a scenario (default for `01`), it includes
`[cc.trace] ts=... phase=... ms=...` lines so you can reconstruct
per-phase service time inside the cc-server itself. round-trip
measurements (in `summary.md`) are wall-clock from the harness side.

## fresh-install runbook

`eval/INSTALL_TRIAL.md` documents the manual fresh-clone path —
pretending you're a new user installing cc for the first time. that's
the only test that exercises the actual `/plugin install` UX, since
slash commands only run in interactive Claude Code.

## design notes

- peers share one `CLAUDE_CONFIG_DIR` per scenario (not per peer) so
  they can see each other in the roster — that's the scenario's whole
  point. each scenario gets a fresh dir; no cross-run state leaks.
- the harness does NOT pretend to be Claude Code's hook dispatcher.
  if a scenario depends on `SessionStart` writing the row, it'll find
  the row only because the cc-server's own self-register runs on boot.
  the production hook + server paths are idempotent UPSERTs — same
  row, same shape.
- `peer.callAction()` returns both parsed result AND round-trip ms.
  scenarios should record the ms via `h.recordSample(label, ms)` so it
  surfaces in the bench-mode distribution.
- `h.waitFor(label, predicate)` returns the actual converge time. scenarios
  assert against the recorded milliseconds and the predicate result.
- `--bench N` runs each scenario N times in fresh dirs. samples
  accumulate into measured percentile distributions.

## known limitations

- this harness drives cc-server directly. it does NOT exercise
  Claude Code's hook system, MCP tool registration, or slash commands.
  use `INSTALL_TRIAL.md` for those.
- per-scenario directories take ~1MB each. with `--keep-logs` and
  `--bench 100`, that's ~100MB per scenario. clean periodically.
- on macOS, `Bun.spawn` boot time (~200ms) dominates short scenarios.
  this overhead is in the measurement; subtract `peer.boot` samples
  from totals if you want pure cc work.
