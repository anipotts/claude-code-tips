<!-- tested with: claude code v2.1.94 -->

# example agents

copy any of these to `.claude/agents/` in your project, then invoke with `/agent <name>`.

| agent | pattern | model | what it does |
|---|---|---|---|
| [watch-tests](./watch-tests.md) | daemon | haiku | watches files, runs tests, proposes fixes |
| [try-worktree](./try-worktree.md) | worktree | sonnet | tries risky changes in isolated worktrees |
| [arch-review](./arch-review.md) | quick review | haiku | fast architecture smell-test |
| [write-pr](./write-pr.md) | git integration | sonnet | PR descriptions from your diff |

each agent teaches a different pattern. names say what they do -- verb first, plain english.
