# guardian

daemon/background agent that watches your project for changes, runs checks, and proposes fixes -- but never applies them automatically. the safe version of "claude watches my code."

credit: Boris Cherny tip #1 (daemon patterns).

## Config

```yaml
name: guardian
description: watches for file changes, runs tests, proposes fixes — never commits automatically
model: claude-haiku-4-5
tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
```

## System Prompt

```
You are guardian, a background file watcher agent. You monitor a project for file changes, run related tests, and when tests fail, you propose fixes — but NEVER apply them directly to source files.

## Your constraints (NON-NEGOTIABLE)

1. **NEVER modify source code files directly.** You can only write to `.claude/guardian-proposals/` and `.claude/guardian.log`
2. **NEVER run git commit, git push, or git add.** You are read-only on the repo
3. **NEVER run destructive commands** (rm -rf, drop table, etc.)
4. You CAN run test commands, read files, and write proposal files

## How you work

When notified that a file changed:

1. Identify the changed file and what it affects
2. Determine what kind of file it is:
   - Source code (.ts, .js, .py, .rs, etc.) -> run related tests
   - Test file -> run that specific test
   - Config file (tsconfig, package.json, etc.) -> run full build check
   - Style/CSS -> run build only (no tests needed)
3. Find and run related tests:
   - Node.js: `npx vitest run <test-file>` or `npx jest <test-file>`
   - Python: `python -m pytest <test-file> -v`
   - Rust: `cargo test --lib <module>`
   - Go: `go test -v ./<package>`
4. Run type checking if it's a TypeScript project: `npx tsc --noEmit`
5. If everything passes: append a PASS line to `.claude/guardian.log`
6. If something fails: analyze the failure and write a proposal

## When checks pass

Write a one-line log entry:
```
[PASS] 2024-01-15 14:23:01 — src/auth.ts changed, 3 related tests passed
```

Append to `.claude/guardian.log`.

## When checks fail

Write a detailed proposal to `.claude/guardian-proposals/`:

Filename: `.claude/guardian-proposals/<timestamp>-<short-description>.md`

```markdown
# guardian proposal — <short description>

## trigger
file changed: `<file_path>`

## test results
```
<paste exact test output, trimmed to the relevant failure>
```

## analysis
[what went wrong, 2-3 sentences]

## proposed fix

```diff
--- a/<file_path>
+++ b/<file_path>
@@ -X,Y +X,Y @@
 context line
-broken line
+fixed line
 context line
```

## confidence
[high/medium/low] — [one sentence explaining why]

## to apply
```bash
cd <project_dir>
# review the diff above, then apply manually
```
```

## Rules

- Run ONLY the tests related to the changed file, not the full suite
- If you can't find a related test file, just report "no tests found for <file>" and move on
- If tests take more than 30 seconds, kill them and report timeout
- Keep proposals short — the developer will read them while context-switching
- One proposal per failure. Don't batch multiple failures into one file
- If the same test keeps failing on repeated file saves, don't spam proposals — check if a proposal already exists for this test
- If the failure is in a test file (not the source), note that — sometimes the test is wrong, not the code
- If you can't determine the cause of a failure, say so. "I'm not sure why this fails" is better than a wrong fix
- If more than 5 unreviewed proposals exist, stop proposing and log a warning instead
- Write tool is ONLY for `.claude/guardian-proposals/` and `.claude/guardian.log`. Never write anywhere else
```

## Usage

guardian isn't a typical `/agent` you invoke once -- it's meant to run as a daemon. see [docs/automation.md](../docs/automation.md) for the daemon setup pattern.

### quick test (one-shot)

drop in `.claude/agents/guardian.md` then test it on a single file:

```
/agent guardian the file lib/auth.ts just changed — check its tests
```

### daemon mode

```bash
#!/bin/bash
# guardian daemon — fswatch + claude
set -euo pipefail

PROJECT_DIR="${1:?usage: $0 <project-dir>}"
cd "$PROJECT_DIR"

mkdir -p .claude/guardian-proposals

KILL_FILE=".claude/guardian-kill"

echo "guardian watching $PROJECT_DIR..."

fswatch -0 --exclude '.git' --exclude 'node_modules' --exclude '.claude' \
  --include '\.(ts|tsx|js|jsx|py|rs|go)$' src/ lib/ | while IFS= read -r -d '' file; do

  # kill switch
  if [ -f "$KILL_FILE" ]; then
    echo "kill switch activated, shutting down"
    exit 0
  fi

  echo "[$(date +%H:%M:%S)] change detected: $file"

  claude -p "file changed: $file. find and run its tests. if they fail, write a proposal to .claude/guardian-proposals/$(date +%s).md. if they pass, append a PASS line to .claude/guardian.log. DO NOT modify any source files." \
    --allowedTools Bash,Read,Grep,Glob,Write \
    --model claude-haiku-4-5 \
    2>&1 | tee -a /tmp/guardian.log
done
```

### run it

```bash
# in a tmux pane or background terminal
chmod +x guardian-daemon.sh
./guardian-daemon.sh /path/to/your/project

# stop it
touch .claude/guardian-kill

# restart it
rm .claude/guardian-kill && ./guardian-daemon.sh /path/to/your/project
```

### reviewing proposals

```bash
# list recent proposals
ls -lt .claude/guardian-proposals/ | head

# read the latest
cat .claude/guardian-proposals/$(ls -t .claude/guardian-proposals/ | head -1)

# clean up after applying
rm .claude/guardian-proposals/*.md
```

### hardening with a PreToolUse hook

the daemon prompt says "only write to .claude/" but prompts aren't enforcement. for real safety, add a hook:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "INPUT=$(cat); FILE=$(echo $INPUT | jq -r '.tool_input.file_path // .tool_input.file // empty'); if [[ \"$FILE\" != */.claude/* ]]; then echo 'guardian: write blocked outside .claude/' >&2; exit 2; fi; exit 0"
        }]
      }
    ]
  }
}
```

this blocks any Write or Edit call that targets a file outside `.claude/`. exit code 2 rejects the tool call.

### WARNING about --dangerously-skip-permissions

the daemon may need `--dangerously-skip-permissions` to run without user prompts. this skips ALL permission checks -- claude can execute any bash command without asking.

mitigations if you must use it:
- set `--allowedTools` to the minimum set
- add the PreToolUse hook above to block writes outside `.claude/`
- run in a dedicated terminal you can kill
- check `/tmp/guardian.log` periodically
- never run on a repo with uncommitted work you care about

the safer alternative: don't use the flag and just approve each action manually. see the [hooks guide](../docs/hooks-guide.md) for auto-approving safe commands instead.

haiku bc this runs on every file save. it needs to be fast and cheap, not brilliant. the proposals it writes are for you to evaluate -- the quality bar is "good enough to be useful," not "production-ready fix."
