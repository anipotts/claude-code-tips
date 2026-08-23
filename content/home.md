---
title: coding agent tips
description: practical guidance for choosing, operating, and reviewing coding agents when the work has real users, real constraints, and consequences.
products: [cross runtime]
updatedAt: "2026-08-22T19:55:02-04:00"
status: current
evidence: [tested, official-source, analysis]
sources: []
redirects: [/guides/]
voice: personal
navigation:
  scope: general
  order: 0
  hidden: true
---

# a guide to <mark class="keyword-highlight">coding agents</mark> in production software (projects, startups & big tech)

practical guidance for choosing, operating, and reviewing coding agents when the
work has real users, real constraints, and consequences.

## why i keep this guide

i spend an unreasonable amount of time using coding agents, figuring out where
they actually help, recovering when they get something wrong, and documenting
the patterns that survive more than one task.

agents already handle meaningful parts of my work. they also lose context,
misunderstand scope, produce plausible mistakes, and need supervision when the
stakes rise. nobody knows the date or slope of the next capability jump. that
uncertainty makes it worth understanding which parts of your work or life benefit
now, where your judgment carries the load, how permissions change the risk, and
which workflows remain reliable.

the credibility here comes from the work itself. i link the [repository](https://github.com/anipotts/coding-agent-tips),
[field runs](/method/#field-runs), [recorded failures](/field-lab/runs/codex-dependency-maintenance-2026-08-11/),
code, and other artifacts behind the tips. you can inspect the receipts and
decide what transfers to your own work.

## understand the layers of every agentic system

it's important to know which layer holds the solution space to your bottlenecks.

| layer | what it covers | examples |
|---|---|---|
| surface | cli, ide, and app tradeoffs | terminal, desktop app, ide, web |
| harness | tools, runtime, and memory | codex, claude code, qwen code |
| model | valuing inference | hosted, open weight, local |
| orchestration | how parallel work is planned and coordinated | worktrees, agents, control planes |

## compare setups most commonly used

| setup | advantage | cost |
|---|---|---|
| terminal plus first party app | deep local control with one supervision surface | extra app and execution location complexity |
| ide integrated agent | selection context, diagnostics, and inline review | editor coupling and local resource pressure |
| terminal only agent | low interface overhead and scriptability | more manual coordination across concurrent work |
| local or open stack | model choice, privacy, and infrastructure control | hardware, serving, and evaluation ownership |
