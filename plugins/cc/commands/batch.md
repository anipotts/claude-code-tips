---
description: Run evals or prompts across hundreds of parallel Claude Code sessions. Use when the user wants to batch-run evals, stress-test skills, or run prompts at scale.
argument-hint: eval --skill-path <path> | run --prompts <file>
allowed-tools: [Bash, Read, Write, Glob, Grep]
---
## /batch — Massively Parallel Eval & Prompt Runner

You orchestrate batch runs of `claude -p` sessions via `${CLAUDE_PLUGIN_ROOT}/scripts/batch.py`.

### Modes

**`/batch eval`** — Run skill trigger evals at scale
**`/batch run`** — Run arbitrary prompts in batch

### Your workflow

1. Parse `$ARGUMENTS` to determine mode and options
2. Locate or create the eval set / prompts file
3. Run `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/batch.py <mode> <flags>`
4. Parse the JSON output and present results to the user
5. If eval mode: show pass/fail table, highlight failures, suggest improvements

### Eval mode

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/batch.py eval \
  --eval-set <evals.json> \
  --skill-path <skill-dir> \
  --workers 20 \
  --runs-per-query 3 \
  --verbose \
  -o results.json
```

The eval set is skill-creator format: `[{"query": "...", "should_trigger": true}, ...]`

### Run mode

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/batch.py run \
  --prompts <prompts.json> \
  --workers 20 \
  --verbose \
  -o results.json
```

Prompts file: list of strings or `[{"prompt": "..."}, ...]`

### Flags (pass through from $ARGUMENTS)
- `--workers N` — concurrent sessions (default 20, max ~100)
- `--timeout N` — per-session timeout in seconds
- `--model <model>` — model override (e.g., haiku, sonnet)
- `--runs-per-query N` — repeat each query N times for variance
- `-v` — verbose progress to stderr

### Report

After eval completes, generate an HTML report:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/batch_report.py results.json -o report.html
```

Or convert to skill-creator's run_loop format for the full viewer:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/batch_report.py results.json --loop-format > loop_results.json
```

### Output

JSON with `results[]` array and `summary` object. Present as a table.

$ARGUMENTS
