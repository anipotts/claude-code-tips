---
title: choosing a coding agent setup
description: compare surfaces, harnesses, models, orchestration, and hardware before choosing a setup.
products: [market]
updatedAt: "2026-08-29T19:04:00-04:00"
checkedAt: "2026-08-29T18:57:04-04:00"
status: current
evidence: [tested, official-source, analysis, open-question]
sources: [openai-codex-manual, anthropic-claude-overview, vscode-agent-host, cursor-docs, openai-cursor-contract, conductor-harnesses, t3-code, opencode, kimi-code, qwen-code, git-worktrees]
redirects: [/market/hardware/]
voice: evidence
navigation:
  scope: general
  order: 40
---

choose the setup around the work you need to review, the machines you already
own, and the amount of parallel state you can supervise.

## choose the layer first

| layer | question | examples |
|---|---|---|
| surface | where do you direct and review work? | terminal, app, IDE, web |
| harness | what runs the agent loop and tools? | Codex, Claude Code, OpenCode, Qwen Code |
| model | what supplies reasoning and generation? | hosted, open weight, local |
| orchestration | what coordinates parallel work? | worktrees, subagents, dashboards, control planes |

one product can occupy several layers. Cursor combines an editor with an agent
harness. Codex and Claude Code span several surfaces. Grok now has its own
[product guide](/guides/grok/) so its model, coding harness, and cloud agents do
not get flattened into one row here.

model access inside a third party harness can also change independently of the
editor or agent loop. on august 28, 2026, OpenAI said it had [proposed winding
down its custom model access contract](https://openai.com/index/our-decision-on-cursor-following-its-acquisition-by-spacex/)
with Cursor on november 12, 2026 and would not provide future models. that is a
contract change with a proposed cutoff date, not evidence that every OpenAI
model disappeared from Cursor immediately. it is one reason I treat the editor,
harness, and model as separate choices.

## common setups

| setup | good fit | cost to notice |
|---|---|---|
| terminal plus first party app | deep local control with a visual supervision surface | another application and more execution state |
| IDE centered agent | selection context, diagnostics, and inline review | editor coupling and local resource pressure |
| terminal only agent | low interface overhead and scriptability | more manual coordination across concurrent work |
| provider flexible harness | model choice and infrastructure control | more evaluation and configuration ownership |

begin with the simplest setup that makes the final diff, tests, and outstanding
questions easy to inspect. add an orchestration layer after independent tasks
actually compete for your attention.

## hardware and local analysis

hosting the model moves inference away from your computer. local repositories
still use memory, storage, CPU, and network for worktrees, builds, browsers,
language servers, terminals, and file indexing.

| execution pattern | model compute | code execution | main local pressure |
|---|---|---|---|
| hosted model, local agent | provider | your machine | builds, browsers, worktrees, and indexing |
| hosted model, remote agent | provider | remote environment | local review is light, environment parity is harder |
| local model, local agent | your machine | your machine | model weights, cache, memory, builds, and terminals |
| hosted model, many local agents | provider | your machine | duplicated workspaces and simultaneous processes |

### memory

browser tabs, an IDE, language servers, local databases, containers, and several
agent worktrees can pressure a machine before model inference becomes relevant.
local models add weights and runtime cache to the same memory budget.

### storage

worktrees duplicate checked out files. build output, package caches, container
images, model weights, logs, and browser profiles can grow faster than source
code. leave enough free space for temporary build output and operating system
updates.

### attention

parallel agents multiply review queues as well as compute. a desktop app can
reduce switching between terminals, while an IDE keeps code context close.
choose the surface that makes it easiest to notice a bad assumption before it
spreads across several branches.

## a practical default

use a hosted model, local repository, one first party harness, and the review
surface you already understand. keep a terminal available for deterministic
checks. move execution remote when local resources or environment consistency
become the measured bottleneck. run models locally when privacy, offline use, or
inference control justifies the hardware and evaluation work.
