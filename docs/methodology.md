# methodology

<!-- guide-meta: {"products":["cross-runtime"],"last_verified":"2026-08-07","evidence":["hands-on","source-verified","inference","retired"],"source_ids":[]} -->

last verified: 2026-08-07

## evidence labels

every material recommendation uses one of four labels:

| label | meaning |
|---|---|
| hands-on | reproduced by the author in a named environment and version |
| source-verified | confirmed in current primary documentation or source code |
| inference | a judgment derived from observed capabilities, labeled as such |
| retired | preserved for compatibility or history and no longer recommended |

vendor benchmark results remain vendor claims unless independently reproduced. they can describe a model release, but they do not establish the best workflow for a reader.

## source order

use sources in this order:

1. official product documentation or specification.
2. official repository, release notes, or package metadata.
3. reproducible local observation.
4. third-party reporting for context, clearly identified.

product pricing and availability can change quickly. link to the live official page instead of copying a large table when a static value is not essential to the decision.

## freshness

the source registry uses these review windows:

| material | maximum age |
|---|---|
| pricing and plan limits | 14 days |
| core codex and claude code guidance | 30 days |
| source-verified watchlist products | 45 days |
| stable cross-runtime principles | 90 days |

an upstream version change triggers review even when a page remains inside its time window.

the freshness workflow is intentionally read-only. it reports drift by failing with a concise summary. it cannot commit content, update state, open issues, or merge changes.

## hands-on protocol

the same disposable repository should be used to evaluate a primary coding harness:

1. inspect an unfamiliar code path and explain the architecture with file references.
2. plan a multi-file change without writing, then incorporate review feedback.
3. implement the change and run the relevant tests.
4. resume the session and recover the important constraints.
5. delegate independent analysis without polluting the main thread.
6. isolate a second implementation in a worktree and compare the results.
7. exercise permission denial, interruption, and a failed command.
8. review the final diff and completion evidence from the product surface.

record the product version, model, reasoning setting, machine, surface, repository state, elapsed time, and failures. one successful demo is not enough to make a reliability claim.

## editorial standard

the guide is opinionated, but the reasoning must remain inspectable.

- facts receive sources.
- observations receive dates and environments.
- recommendations explain the decision they optimize.
- unknowns stay visible.
- products are compared at the same layer.
- personal taste is stated directly instead of being disguised as consensus.
