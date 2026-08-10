---
title: hardware economics
description: memory, storage, concurrency, and attention costs for hosted and local coding-agent workflows.
products: [cross-runtime]
lastVerified: 2026-08-07
status: current
evidence: [hands-on, source-verified, inference]
sources: [git-worktrees]
evidenceRail:
  - kind: hands-on
    label: macos agent workflows
    section: concurrency-is-multiplicative
  - kind: source-verified
    label: git worktree behavior
    section: ssd-pressure
    sourceId: git-worktrees
  - kind: inference
    label: practical planning bands
    section: memory-planning-bands
---

coding-agent hardware cost depends on where inference runs and how much development work happens in parallel.

## four execution patterns

| pattern | model compute | code execution | main local pressure |
|---|---|---|---|
| hosted model, local agent | provider | your machine | builds, tests, browsers, worktrees, and file indexing |
| hosted model, remote agent | provider | remote environment | local review is light; environment parity and transfer become harder |
| local model, local agent | your machine | your machine | model weights, key-value cache, runtime memory, builds, and thermal load |
| hosted model, many local agents | provider | your machine | duplicated workspaces and simultaneous development processes |

hosted inference moves model compute away from the mac while repository work remains local.

## memory planning bands

use these practical planning bands as a starting point for a modern mac, then measure the actual development stack:

| unified memory | reasonable expectation |
|---|---|
| 16 gb | one active hosted-model agent with a moderate development stack; browser and container-heavy work can become constrained |
| 24 to 36 gb | a comfortable hosted-model setup with several worktrees, browsers, and normal local services |
| 48 to 64 gb | heavier parallel builds, several active agents, larger containers, or exploratory small-model inference |
| 96 gb and above | serious local-model experiments or unusually broad local concurrency |

repository language and build system can dominate these bands. a large mobile build, several databases, or a browser test fleet may use more memory than the agent clients themselves.

## ssd pressure

each worktree has another copy of tracked files and often another dependency tree, build output, test cache, local database, and log set.

a useful estimate is:

```text
workspace storage = base repository + worktrees × (dependencies + build output + local state)
```

shared package caches reduce downloads while installed dependencies may still duplicate. measure one prepared worktree before assuming that ten parallel tasks will fit.

local model storage starts with model weights:

```text
weight bytes ≈ parameter count × quantization bits ÷ 8
```

allow additional space for metadata, tokenizer files, multiple quantizations, runtime cache, and temporary downloads. memory use also includes the inference runtime and context cache, so a model that fits on disk may still be impractical at the desired context length.

## concurrency is multiplicative

parallel agents can independently start:

- language servers and file watchers.
- package installations and compilers.
- test runners and development servers.
- browsers, simulators, containers, and databases.
- repository indexing and search processes.
- logging, screenshots, and generated artifacts.

the harness may appear lightweight while the processes it launches consume the machine. dashboards make concurrency easier to start, so they should also make idle sessions and resource ownership easy to see.

## local inference tradeoffs

local models can improve privacy, offline availability, provider independence, inspectability, and predictable marginal cost. the tradeoffs include:

- substantial unified memory or gpu memory.
- model download and ssd capacity.
- lower throughput or capability than the strongest hosted coding models on many machines.
- quantization and serving configuration.
- thermal load and power use during long agent loops.
- responsibility for model, runtime, and harness compatibility.

local inference is most convincing when one of those control benefits is a real requirement. buying hardware only to avoid a subscription can have a long payback period and a higher maintenance cost.

## attention and context switching

hardware throughput is only useful when the operator can review the output.

first-party apps and agent dashboards can reduce switching by combining sessions, terminals, diffs, previews, and attention indicators. ide-centered systems reduce switching when the editor and debugger are already the main workplace.

the wrong surface can increase cognitive load even when it saves clicks. evaluate how quickly you can answer:

- which agent is waiting for me?
- what changed, and in which worktree?
- what command is still running?
- what evidence supports completion?
- which external action still needs approval?
- how do i stop or recover the work?

## buying guidance

for hosted codex or claude code use, prioritize enough memory for the development stack and enough ssd for several prepared worktrees. move beyond that baseline when measurements show sustained memory pressure, swap, thermal throttling, or storage churn.

for local inference, choose the target model sizes and context requirements first. calculate weight and cache needs, then select hardware. a useful coding-agent experience also depends on bandwidth, cooling, and supported runtimes.
