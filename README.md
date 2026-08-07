# codex + claude code field guide

opinionated field notes for engineers using coding agents as part of real software work.

this repository focuses on two first-party systems, codex and claude code, then places them inside the wider market of editors, agent harnesses, orchestration apps, hosted models, and local inference.

status as of 2026-08-07:

- codex is the current hands-on system and was tested locally with `codex-cli 0.146.0`; public guidance was checked against 0.147.0 and the official codex manual.
- claude code 2.1.220 is installed locally, but the current hands-on protocol has not been rerun; public guidance was checked against 2.1.224 and the official claude code documentation.
- products outside those two guides are labeled by evidence level. source-verified products are not presented as hands-on recommendations.

## start here

| path | use it for |
|---|---|
| [codex](./docs/codex/README.md) | cli, app, ide, worktrees, subagents, plugins, hooks, memories, and scheduled work |
| [claude code](./docs/claude-code/README.md) | terminal, desktop, ide, skills, hooks, plugins, subagents, agent teams, and remote work |
| [shared operating system](./docs/shared/operating-system.md) | durable instructions, verification, approvals, git isolation, and handoffs |
| [market map](./docs/market/README.md) | choosing a surface, harness, model, and orchestration layer |
| [hardware economics](./docs/market/hardware.md) | ram, ssd, worktree, concurrency, and local-inference tradeoffs |
| [methodology](./docs/methodology.md) | evidence labels, freshness windows, and the hands-on test protocol |

## the core distinction

an agent setup has several independent layers:

1. the surface where you direct and review work: terminal, first-party app, ide, or dashboard.
2. the harness that runs the agent loop: codex, claude code, cursor agent, opencode, kimi code, qwen code, or grok build.
3. the model that supplies reasoning and generation.
4. the orchestration layer that manages sessions, worktrees, diffs, checks, and pull requests.

many comparisons flatten those layers into a single leaderboard. that leads to weak recommendations. a good setup starts with the work you need to supervise, the state you need to preserve, and the failure modes you are willing to accept.

## defaults for experienced builders

- use a first-party codex or claude code app plus its terminal runtime when continuity and low context-switch cost matter most.
- use cursor or vscode when the active editor, debugger, and inline diff are the center of the work.
- add an orchestration app after parallel branches and review queues become a recurring coordination problem.
- use a provider-flexible or local-model harness when privacy, offline work, model control, or infrastructure research justifies the additional setup.

the [market chooser](./docs/market/README.md) explains the tradeoffs behind these defaults.

## what this repository is

the active project is a maintained handbook. it records:

- workflows reproduced by the author, with the tested product and date identified.
- capabilities verified against primary documentation.
- judgments that are labeled as judgments.
- current unknowns and products that still need hands-on evaluation.

the repository does not use commit frequency, generated translations, automated prose, or bot-created issues as evidence that its guidance is current.

## legacy claude code tools

this repository previously led with three claude code plugins and a set of standalone hooks. those tools are frozen while the guide becomes the primary project.

existing install paths remain available through 2026-11-05. during that window, changes are limited to security issues, data-loss risks, and installation blockers. no codex ports are planned.

see [legacy tools](./docs/legacy-tools.md) for the compatibility policy and migration guidance.

## source policy

product facts come from official documentation, release notes, or source repositories. each guide records its evidence level and verification date. the machine-readable registry is in [`docs/sources.json`](./docs/sources.json).

subjective recommendations are based on direct use or are marked as inference. benchmark claims from vendors are not treated as neutral proof of workflow quality.

## author

built and maintained by [ani potts](https://anipotts.com). corrections with primary sources are welcome.

MIT
