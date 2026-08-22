---
title: how this guide is verified
description: the sources, examples, field runs, and open questions behind the recommendations in this guide.
products: [cross runtime]
lastVerified: 2026-08-22
status: current
evidence: [tested, official-source, analysis, open-question]
sources: []
redirects: [/field-lab/]
voice: evidence
navigation:
  group: evidence
  order: 50
---

evidence here means the example behind a recommendation: a source, repository,
field run, screenshot, code sample, failure, or other inspectable artifact. it
shows what shaped the tip so you can decide whether it transfers to your work.

this guide comes from my own use. the receipts keep that perspective grounded
and make its limits visible.

vendor benchmark results remain vendor claims unless independently reproduced.
they can describe a model release, but they do not establish the best workflow
for a reader.

## source order

use sources in this order:

1. official product documentation or specification.
2. official repository, release notes, or package metadata.
3. reproducible local observation.
4. third party reporting for context, clearly identified.

product pricing and availability can change quickly. reserve copied static values for decisions that require them; otherwise link to the live official page.

## freshness

the source registry uses these review windows:

| material | maximum age |
|---|---|
| pricing and plan limits | 14 days |
| core codex and claude code guidance | 30 days |
| official source watchlist products | 45 days |
| stable cross runtime principles | 90 days |

an upstream version change triggers review even when a page remains inside its time window.

the freshness workflow has read only permissions and reports drift through a concise failed check. publication remains a human reviewed workflow.

## field run protocol

the same disposable repository should be used to evaluate a primary coding harness:

1. inspect an unfamiliar code path and explain the architecture with file references.
2. plan a multi file change without writing, then incorporate review feedback.
3. implement the change and run the relevant tests.
4. resume the session and recover the important constraints.
5. delegate independent analysis without polluting the main thread.
6. isolate a second implementation in a worktree and compare the results.
7. exercise permission denial, interruption, and a failed command.
8. review the final diff and completion evidence from the product surface.

record the product version, model, reasoning setting, machine, surface, repository state, elapsed time, and failures. reliability claims require repeated, comparable evidence.

## editorial standard

the guide is opinionated, but the reasoning must remain inspectable.

- facts receive sources.
- observations receive dates and environments.
- recommendations explain the decision they optimize.
- open questions stay visible.
- products are compared at the same layer.
- personal taste is stated directly instead of being disguised as consensus.
- repeat a title, route, or surrounding label only when the repetition improves understanding.
- omit mid dot dividers from public copy and interface labels.
- state claims directly and omit litotes or negative comparison frames.

## field runs

field runs evaluate coding agent systems through repeatable engineering work. each run records what the operator must understand, supervise, recover, and verify. the result is inspectable evidence rather than a winner score.

each primary harness is evaluated against the same repository state and task specification. the task defines pass conditions before the agent begins. failed scenarios and operator interventions remain in the record.

the published codex runs cover the first public edition and a dependency maintenance task. the equivalent claude code run remains an open question. current claude code guidance stays based on official sources until that run is complete.

each run keeps its task, result, interventions, artifacts, machine context, privacy decisions, limitations, and open questions in one validated Markdown record. the run inventory below is generated from those records.
