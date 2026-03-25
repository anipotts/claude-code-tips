# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.77-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

my claude code setup, open source. 190 hours of active coding. $2.88/hr.

---

## the numbers

450+ sessions across 137 projects in 3 months. $548 paid on the $200/mo max plan. $30,000 worth of API compute at a 91% prompt cache hit rate. that's **55x the value** of what i paid.

872 commits across 35 active days. no autonomous loops. no cron jobs generating commits. every session starts with me typing a prompt.

without prompt caching, the same usage would've cost **$158,000**. caching brought it to $30K. i paid $548. [how prompt caching works &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## install the plugin

```bash
claude plugin add anipotts/claude-code-tips
```

you get **mine** -- session mining to sqlite. costs, search, error memory, pattern detection. all data stays local at `~/.claude/mine.db`.

```
/mine                     today's sessions, cost, top tools
/mine search "websocket"  full-text search across all conversations
/mine mistakes            error patterns claude keeps repeating
/mine hotspots            most-edited files across sessions
/mine loops               repeated patterns across sessions
```

start with `mine` + the `safety-guard` hook. add more as you go. **[mine docs &rarr;](./plugins/mine/README.md)**

---

## the 3 things that changed how i code

### hooks

hooks are the difference between "claude does what i want" and "claude does whatever it feels like." CLAUDE.md gives guidance. hooks give enforcement. one is a suggestion, the other is a wall.

i run 11 hooks on every session. safety-guard blocks force pushes, `rm -rf /`, and `curl | bash`. no-squash blocks squash merges. context-save preserves state before compaction. [my full hook philosophy &rarr;](./docs/hooks.md)

### agent teams

multiple claude instances working simultaneously on the same codebase, each in its own git worktree. the coordinator assigns tasks, collects results, merges the best approach.

i use this for parallel research, trying risky changes safely, and comparing approaches side-by-side without touching my working tree. [how i use agent teams &rarr;](./docs/agents.md)

### prompt caching

this is why the $200/mo plan is the best deal in AI coding. claude code caches your system prompt, tools, and CLAUDE.md as a prefix. 91% of my input tokens hit the cache -- meaning i pay 10% of the input cost on 91% of my reads.

the key: keep your CLAUDE.md short and stable. every edit breaks the prefix cache. mine is 30 lines and changes maybe once a week. [the full cost breakdown &rarr;](./docs/cost.md)

---

## hooks

copy one, wire it up, done. each is a standalone bash script. [full guide &rarr;](./docs/hooks.md)

| hook | event | what it does |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | blocks force push, `rm -rf /`, DROP TABLE, curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | blocks squash merges |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | logs every tool call to sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | saves context before compression |
| [notify](./hooks/notify.sh) | Notification | routes to macOS, Slack, ntfy |

<details>
<summary>6 more hooks</summary>

| hook | event | what it does |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | reminds you to commit after N edits |
| [replay-capture](./hooks/replay-capture.sh) | PostToolUse | captures file changes for VHS replays |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | auto-updates "tested with" stamps |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | warns about gone tracking branches |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | auto-fixes markdown lint on save |
| [knowledge-builder](./hooks/knowledge-builder/) | PostToolUse | builds a codebase knowledge graph |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## example agents

copy to `.claude/agents/` and invoke with `/agent <name>`. each teaches a different pattern. [guide &rarr;](./docs/agents.md)

| agent | pattern | what it does |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | watches files, runs tests, proposes fixes |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | tries risky changes in isolated worktrees |
| [arch-review](./examples/agents/arch-review.md) | quick review | fast architecture smell-test |
| [write-pr](./examples/agents/write-pr.md) | git integration | PR descriptions from your diff |

## commands i use

| command | what it does |
|---|---|
| `/mine` | usage data -- costs, sessions, search, patterns |
| `/ship` | stage, commit, push, open PR in one command |
| `/improve` | propose CLAUDE.md updates from git history |

plus [3 example commands](./examples/commands/) you can copy: `/sweep`, `/quicktest`, `/replay`.

---

## my personal takes

| | what |
|---|---|
| [cost reality](./docs/cost.md) | what claude code actually costs, the prompt caching math |
| [mistakes i made](./docs/mistakes.md) | what burned me so you can skip it |
| [my stack](./docs/my-stack.md) | the automation setup i actually run |
| [session workflow](./docs/session-workflow.md) | how i work day-to-day with claude code |
| [worktrees](./docs/worktrees.md) | parallel exploration with the desktop app |

## vs the alternatives

diplomatic, data-driven, no FUD. every claim cites a source.

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [pricing](./docs/comparisons/pricing.md)

---

## examples

- [CLAUDE.md templates](./examples/claude-md/) -- starter configs for TypeScript, Python, Rust, Next.js
- [example agents](./examples/agents/) -- 4 agents, each teaching a different pattern
- [example commands](./examples/commands/) -- 3 commands you can copy to any project
- [handoff plugin](./examples/plugins/handoff/) -- PreCompact context preservation
- [broadcast plugin](./examples/plugins/broadcast/) -- async notifications on git events

---

## how this repo works

this repo runs on its own patterns.

- **12 CI workflows** -- docs audit, competitive intel, community digest, freshness check, stale cleanup, dependabot, releases, plugin smoke test, PR quality gate, validation, claude responder, upstream watcher
- **11 hooks** running on every session
- **<$1/month** CI cost -- AI-powered workflows use haiku
- **0 manual maintenance** -- everything that doesn't require taste is automated

[automation details &rarr;](./docs/automation.md)

---

MIT &middot; built by [anipotts](https://anipotts.com) from 450+ sessions
