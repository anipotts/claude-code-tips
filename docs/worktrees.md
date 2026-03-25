<!-- tested with: claude code v2.1.77 -->

# worktrees

git worktrees are the secret weapon for parallel claude code work. the desktop app makes them even better.

---

## what worktrees are

a git worktree is a second (or third, or fourth) checkout of the same repo in a different directory. each worktree has its own working tree and index, but shares the same `.git` history. changes in one worktree don't affect another until you merge.

```bash
# create a worktree
git worktree add ../myproject-experiment -b experiment/new-approach

# now you have two checkouts:
# /path/to/myproject          -- your main working tree
# /path/to/myproject-experiment -- isolated copy on a new branch
```

claude code uses worktrees for agent isolation. when you spawn a subagent with `isolation: "worktree"`, it gets its own worktree automatically. changes stay isolated until you review and merge.

---

## why worktrees matter for claude code

without worktrees, parallel agents would step on each other -- editing the same files, creating merge conflicts, corrupting each other's work. worktrees give each agent its own sandbox.

three use cases:

**1. safe experimentation** -- try a risky refactor in a worktree. if it works, merge. if not, delete the worktree. your main tree never gets touched.

**2. parallel agent work** -- spawn 3 agents, each in its own worktree, each working on a different module. they can't conflict bc they have separate file systems.

**3. review before merge** -- agent makes changes in a worktree. you review the diff against your branch. cherry-pick what you want, discard the rest.

---

## the desktop app advantage

the claude code desktop app has a built-in UI for managing worktrees. you can see all active worktrees, their branches, and their status in one view. it's significantly better than managing worktrees from the CLI.

<!-- [FILL: describe the desktop app worktree UI. what does it show? -->
<!-- how do you use it day-to-day? screenshots would be great here. -->
<!-- compare to CLI workflow -- what's better about the UI?] -->

### when to use desktop vs CLI

| scenario | desktop | CLI |
|---|---|---|
| agent teams (2-5 parallel agents) | yes -- visual tracking | works but harder to follow |
| quick one-off worktree experiment | either | slightly faster |
| reviewing worktree diffs before merge | yes -- side-by-side view | `git diff` works fine |
| long-running background agents | yes -- status at a glance | need to check manually |

<!-- [FILL: adjust this table based on your actual experience with both] -->

---

## worktrees in practice

### the try-worktree agent

this repo includes a [try-worktree agent](../examples/agents/) that automates the "try an approach in a worktree" pattern:

```
/agent try-worktree "refactor the billing module to use the new pricing engine"
```

it creates a worktree, makes the changes, runs tests, and reports back. you review the diff and decide whether to merge.

### manual worktree workflow

```bash
# create worktrees for parallel work
git worktree add ../myproject-auth   -b team/auth
git worktree add ../myproject-billing -b team/billing

# run claude in each (separate terminals or tmux panes)
cd ../myproject-auth && claude
cd ../myproject-billing && claude

# review when done
git diff main..team/auth -- src/auth/
git diff main..team/billing -- src/billing/

# merge
git merge team/auth
git merge team/billing

# cleanup
git worktree remove ../myproject-auth
git worktree remove ../myproject-billing
git branch -d team/auth team/billing
```

### tmux + worktrees

for the CLI power users -- split your terminal into panes, one per worktree:

```bash
tmux new-session -s team -c ../myproject-auth
tmux split-window -h -c ../myproject-billing
tmux split-window -v -c ../myproject-ui
# start claude in each pane
```

---

## worktree gotchas

**merge conflicts** -- if two worktree agents edit the same file, you'll get conflicts when merging. this usually means your task decomposition was wrong. fix: give each agent clear, non-overlapping file boundaries.

**stale worktrees** -- worktrees created by claude code's `isolation: "worktree"` are cleaned up automatically if no changes are made. manual worktrees need manual cleanup. run `git worktree list` periodically.

**disk space** -- each worktree is a full checkout (minus `.git`). on large repos, 5 worktrees = 5x the disk usage. usually fine, but worth knowing.

**node_modules / venv** -- each worktree needs its own `node_modules` or virtual environment. `npm install` in one doesn't affect another. this is a feature, not a bug -- but it adds setup time.

<!-- [FILL: any other gotchas you've hit? worktree experiments that went wrong?] -->

---

## further reading

- [agents](./agents.md) -- agent teams and worktree isolation patterns
- [example agents](../examples/agents/) -- try-worktree, watch-tests
- [official docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents#worktree-isolation) -- worktree isolation reference
