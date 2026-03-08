<!-- tested with: claude code v1.0.34 -->

# agent teams

**run 2-5 claude instances in parallel on the same codebase using git worktrees.**

---

## what agent teams are

an agent team is multiple claude instances working simultaneously on the same project. each instance gets its own git worktree -- a full, isolated copy of the repo where it can read, write, and run commands without affecting anyone else. one coordinator spawns the team, assigns tasks, collects results, and merges.

this is native to claude code. the coordinator uses the `Task` tool with `isolation: "worktree"` to spawn teammates, and the runtime handles worktree creation, isolation, and cleanup automatically.

the mental model: hand a project to 3 developers in different rooms, each with their own copy of the code. they work independently, come back with results, you decide what to merge.

---

## when to use teams vs a single agent

agent teams are for **truly independent, parallelizable work**. the moment task B depends on task A's output, you need sequential execution, not a team.

| scenario | team? | why |
|---|---|---|
| refactor 3 independent modules | yes | no shared state between modules |
| add API endpoint + write tests for it | no | tests depend on the endpoint code |
| research 3 competing approaches | yes | each approach is self-contained |
| fix a bug then update docs about the fix | no | docs depend on knowing the fix |
| write migration + seed data + API route | yes | if they touch different files |
| implement feature A that calls feature B | no | runtime dependency |

**rule of thumb:** if you could assign the tasks to 3 developers who never talk to each other, use a team. if developer B would need to slack developer A a question, use sequential subagents.

---

## how they work under the hood

1. **coordinator spawns teammates** via the `Task` tool:

```json
{
  "prompt": "Refactor src/billing/ to use the new pricing engine. Update all 6 files. Run tests.",
  "description": "refactor billing module",
  "isolation": "worktree"
}
```

2. **each teammate gets its own worktree** -- a real git checkout in a temp directory. changes are completely isolated.
3. **teammates cannot see each other.** no shared memory, no message passing, no mid-flight coordination.
4. **coordinator collects results** when teammates finish -- text output and the worktree branch they created.
5. **you review and merge** the worktree branches into your main tree.

spawn multiple Task calls at once and they run in parallel automatically:

```json
{"prompt": "...", "description": "refactor auth module", "isolation": "worktree"}
{"prompt": "...", "description": "refactor billing module", "isolation": "worktree"}
{"prompt": "...", "description": "refactor notifications module", "isolation": "worktree"}
```

> [official docs](https://docs.anthropic.com/en/docs/claude-code/overview)

---

## the /batch command

if you dont need a coordinator agent orchestrating things, `/batch` is the simpler path. describe multiple independent tasks and claude runs them in parallel worktrees. you review the diffs.

```
/batch
1. add input validation to all API routes in src/routes/
2. convert the 4 utility files in src/utils/ from commonjs to esm
3. add jsdoc comments to all exported functions in src/lib/
```

each task runs in its own worktree. when theyre done you get a summary of changes and can accept, reject, or cherry-pick per task. no tmux setup, no manual worktree management.

**when /batch vs full agent teams:**

| | /batch | agent teams |
|---|---|---|
| setup | zero | coordinator prompt needed |
| coordination logic | none (just parallel execution) | coordinator can synthesize results |
| mid-flight decisions | none | coordinator can react to early results |
| best for | bulk independent changes | complex parallel workflows |

use `/batch` for "do these 5 things independently." use agent teams when you need a coordinator that reasons about the combined results.

---

## tmux setup for manual orchestration

sometimes you want to run multiple claude sessions yourself -- one per tmux pane, each working on a different part of the project. this is the manual version of agent teams.

### create worktrees and tmux panes

```bash
# create worktrees
git worktree add ../myproject-auth   -b team/auth
git worktree add ../myproject-billing -b team/billing
git worktree add ../myproject-ui     -b team/ui

# tmux session with 3 panes, one per worktree
tmux new-session -s team -c ../myproject-auth
tmux split-window -h -c ../myproject-billing
tmux split-window -v -c ../myproject-ui
# start claude in each pane
```

### useful tmux commands

| command | what it does |
|---|---|
| `Ctrl+b %` | split pane vertically |
| `Ctrl+b "` | split pane horizontally |
| `Ctrl+b o` | switch to next pane |
| `Ctrl+b z` | zoom current pane (toggle) |
| `Ctrl+b :setw synchronize-panes on` | type in all panes at once |

### headless alternative

```bash
cd ../myproject-auth && claude -p "refactor auth module to use new middleware" &
cd ../myproject-billing && claude -p "migrate billing to stripe v2 sdk" &
cd ../myproject-ui && claude -p "convert class components to hooks" &
wait
```

`&` backgrounds each process. `wait` blocks until all finish.

---

## TeammateIdle and TaskCompleted hooks

two hook events let you add quality gates to agent teams.

### TeammateIdle

fires when a teammate is about to go idle. use it to enforce standards before a teammate stops.

```json
{
  "hooks": {
    "TeammateIdle": [
      { "hooks": [{ "type": "command", "command": "/path/to/hooks/require-tests-pass.sh" }] }
    ]
  }
}
```

```bash
#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
WORKTREE=$(echo "$INPUT" | jq -r '.worktree_path // empty')
if [ -n "$WORKTREE" ]; then
  cd "$WORKTREE"
  if ! npm test --silent 2>/dev/null; then
    echo '{"decision":"block","reason":"tests are failing. fix them before finishing."}' >&2
    exit 2
  fi
fi
```

### TaskCompleted

fires when a task is marked done. use it for logging, notifications, or triggering downstream work.

```bash
#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
TASK_DESC=$(echo "$INPUT" | jq -r '.description // "unknown"')
echo "[$(date)] task completed: $TASK_DESC" >> /tmp/team-log.txt
```

both hooks have no matcher support -- they always fire for every teammate/task.

> [hooks reference](./hooks-guide.md)

---

## coordination patterns

### fan-out / fan-in

coordinator sends independent tasks, waits for all results, synthesizes.

```
coordinator
  |-- spawns --> teammate A (refactor auth)
  |-- spawns --> teammate B (refactor billing)
  |-- spawns --> teammate C (refactor notifications)
  waits... reviews results, resolves conflicts, merges
```

best for: bulk refactors, parallel research, independent feature work.

### pipeline (not a team pattern)

each phase feeds the next. thats sequential, not parallel. use subagents, not teams.

```
scout (haiku)  -->  findings  -->  implementer (sonnet)  -->  code  -->  reviewer (haiku)
```

this is the [scout pattern](./subagent-patterns.md). mentioning it here bc people try to force it into a team. dont.

### specialist teams

each teammate has a role defined by its prompt and model.

```
coordinator
  |-- researcher (haiku): "find all usages of the deprecated API"
  |-- implementer (sonnet): "rewrite src/core/engine.ts to use the new API"
  |-- test-writer (sonnet): "write integration tests for the new engine API"
```

researcher runs on haiku bc its just reading and searching. implementer and test-writer run on sonnet bc they generate code. see cost considerations below.

---

## cost considerations

agent teams are expensive. each teammate has its own context window and loads its own files. a 3-agent team costs roughly 3x a single agent.

| role | model | est. input | est. output | est. cost |
|---|---|---|---|---|
| coordinator | sonnet | 50k | 5k | ~$0.40 |
| researcher | haiku | 80k | 3k | ~$0.09 |
| implementer | sonnet | 100k | 20k | ~$2.30 |
| test-writer | sonnet | 80k | 15k | ~$1.75 |
| **total** | | **310k** | **43k** | **~$4.54** |

a single sonnet doing all this sequentially might cost $3-4 bc it reuses context. teams pay the context-loading tax per teammate.

### saving money

- **haiku for research teammates.** ~19x cheaper on input, great at reading and searching.
- **sonnet for implementation.** code generation needs the bigger model.
- **keep teams to 2-3.** 5 is almost never justified.
- **scope prompts tightly.** tell teammates exactly which directories to touch.

---

## merging worktree results

when teammates finish, their changes live in worktree branches.

```bash
# review
git diff main..team/auth -- src/auth/
git diff main..team/billing -- src/billing/

# clean merge (no overlapping files)
git merge team/auth && git merge team/billing && git merge team/ui

# or cherry-pick specific files
git checkout team/auth -- src/auth/middleware.ts src/auth/token.ts

# or apply as patches (most control)
git diff main..team/auth > /tmp/auth.patch
git apply --check /tmp/auth.patch   # dry run
git apply /tmp/auth.patch
```

if teammates touched overlapping files, your task decomposition was wrong. fix conflicts manually or re-run with better boundaries.

### cleanup

```bash
git worktree remove ../myproject-auth
git worktree remove ../myproject-billing
git worktree remove ../myproject-ui
git branch -d team/auth team/billing team/ui
```

native claude code worktrees (via `isolation: "worktree"`) clean up automatically. manual worktrees need manual cleanup.

---

## real examples

### refactor 3 independent modules simultaneously

`src/auth/`, `src/billing/`, and `src/notifications/` all need to migrate from callbacks to async/await. zero shared code between them. spawn 3 teammates, each targeting one directory. each rewrites its module, updates imports, runs tests. coordinator merges the three branches. 30 minutes of single-agent work done in 12.

### research approach A, B, C in parallel

you need a caching layer but arent sure whether to use redis, lru-cache, or sqlite. the [explorer agent](../agents/explorer.md) in this repo does exactly this:

```
/agent explorer try implementing the cache with redis, lru-cache, and better-sqlite3
```

three agents build three implementations simultaneously. explorer compares benchmarks, test results, and code complexity, then recommends a winner with evidence.

### tests + implementation in parallel

this works **only if** you define the interface first. both teammates need the same contract.

1. define the interface in a shared type file (do this yourself, its a design decision)
2. spawn test-writer: "write tests against this interface in src/cache/\_\_tests\_\_/"
3. spawn implementer: "implement this interface in src/cache/index.ts"
4. merge both. run tests. iterate if needed.

the risk: different assumptions. mitigate by making the interface contract extremely specific -- types, error cases, edge cases, all in the shared file.

---

## checklist before using agent teams

- [ ] tasks are truly independent (no shared mutable state)
- [ ] each task is substantial enough to justify its own context window
- [ ] file boundaries are clear (teammates wont edit the same files)
- [ ] the budget justifies parallel execution
- [ ] you have a plan for merging results
- [ ] your repo is a git repository (worktrees require git)

if any of these fail, use a single agent or sequential subagents instead.

> [subagent patterns](./subagent-patterns.md) | [explorer agent](../agents/explorer.md) | [hooks guide](./hooks-guide.md)
