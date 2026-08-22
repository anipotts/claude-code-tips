---
title: choosing a coding agent setup
description: compare surfaces, harnesses, models, orchestration, and hardware costs before choosing a coding agent setup.
products: [market]
lastVerified: 2026-08-07
status: current
evidence: [tested, official-source, analysis, open-question]
sources: [openai-codex-manual, anthropic-claude-overview, vscode-agent-host, cursor-docs, conductor-harnesses, t3-code, opencode, kimi-code, kimi-k3, qwen-code, qwen-models, grok-build, grok-4-5]
redirects: [/market/hardware/]
voice: evidence
navigation:
  group: decision
  order: 40
---

this appendix helps experienced builders choose an operating environment through workflow and operating model evidence.

## choose the layer first

| layer | question | examples |
|---|---|---|
| surface | where do you direct, inspect, and review work? | terminal, first party app, vscode, cursor, dashboard |
| harness | what runs the agent loop and tools? | codex, claude code, opencode, kimi code, qwen code, grok build |
| model | what supplies reasoning and generation? | openai, anthropic, xai, kimi, qwen, local open weights |
| orchestration | what manages parallel sessions and review? | first party task views, conductor, t3 code |

a product can occupy more than one layer. cursor combines an editor surface with its own agent harness. vscode is an editor and increasingly an agent host. conductor and t3 code sit above several harnesses. kimi, qwen, and xai each offer both models and coding agent products.

## chooser with defaults

### choose a first party app plus terminal when

- you want one account and one native session model.
- browser, computer, preview, scheduled, or remote capabilities matter.
- reducing attention spent moving among terminal, editor, browser, and pull request pages is valuable.
- you prefer provider native support over harness portability.

default: codex app plus codex cli, or claude desktop plus claude code terminal.

### choose an ide centered system when

- the active file, selection, debugger, diagnostics, and inline diff drive most decisions.
- you already spend the day inside one editor.
- session management should remain close to code navigation.
- switching models or harnesses inside the editor is more useful than provider native app features.

default: cursor for an integrated commercial system, or vscode when its extension ecosystem and agent host direction fit the team.

### add an orchestration app when

- several isolated workspaces run at once.
- branch, port, process, and pull request state are becoming hard to supervise.
- one screen for attention routing is more valuable than another agent feature.
- the team accepts an additional layer between the harness and repository.

default: remain on first party worktrees until coordination becomes a measured problem. evaluate conductor or t3 code after that point.

### choose a provider flexible harness when

- model choice, custom endpoints, or local analysis is a core requirement.
- open source inspectability matters.
- the team can own provider configuration, authentication, updates, and compatibility.
- losing some first party integration is an acceptable tradeoff.

default: evaluate opencode before building a custom harness. evaluate kimi code, qwen code, or grok build when their model integration or protocol support matches a specific need.

## contender map

| product | layer | evidence | current read |
|---|---|---|---|
| codex | harness plus first party app, ide, cli, and cloud surfaces | tested | primary guide |
| claude code | harness plus terminal, desktop, ide, web, and remote surfaces | historical tested, current official source | primary guide; rerun the current protocol before a direct ranking |
| [cursor](https://cursor.com/) | editor plus agent harness and cloud agent surface | official source | strong ide centered option; needs a separate tested pass |
| [vscode agent host](https://code.visualstudio.com/docs/agents/concepts/agent-host) | editor and multi harness session host | official source, preview | important direction; rollout and billing paths remain product dependent |
| [conductor](https://www.conductor.build/docs/reference/harnesses) | local mac orchestration over codex, claude code, cursor, and opencode | official source | evaluate when first party worktrees stop being enough |
| [t3 code](https://t3.codes/) | open source orchestration over several harnesses | official source | promising control plane option; needs tested verification |
| [opencode](https://github.com/anomalyco/opencode) | open source provider flexible harness | official source | sensible baseline for provider portability or local inference |
| [kimi code](https://www.kimi.com/code/docs/) | terminal and ide harness optimized for kimi models | official source watchlist | separate from the Kimi K3 model family |
| [qwen code](https://github.com/QwenLM/qwen-code) | open source terminal and ide friendly harness | official source watchlist | separate from Qwen model releases |
| [grok build](https://docs.x.ai/build/overview) | open source terminal harness with dashboard and acp support | official source watchlist | xai's coding harness; separate from Grok 4.5 |
| [Kimi K3](https://github.com/MoonshotAI/Kimi-K3) | hosted and open weight model family | official source watchlist | model layer |
| [Qwen models](https://github.com/QwenLM) | hosted and open weight model family | official source watchlist | model layer, commonly used through Qwen Code or compatible harnesses |
| [Grok 4.5](https://docs.x.ai/developers/grok-4-5) | hosted xai model | official source watchlist | model layer; available through Grok Build, api, and Cursor |

cline and continue are outside this edition and remain unevaluated here.

## xai naming

xai's first party coding product is [Grok Build](https://docs.x.ai/build/overview), a terminal agent that can also run headlessly or through the Agent Client Protocol. [Grok 4.5](https://docs.x.ai/developers/grok-4-5) is the model used by that harness and is also offered in Cursor.

current primary sources establish xai's model and harness layers. evaluate them separately while evidence for an xai built Cursor style editor remains absent.

## costs that pricing pages miss

subscription or token price is only one part of the system:

- attention cost: how often work forces a surface change or loses state.
- review cost: how clearly the system presents diffs, commands, evidence, and failures.
- local resource cost: worktrees, dependencies, builds, browsers, watchers, and dev servers.
- coordination cost: ownership, merge conflicts, ports, credentials, and external side effects.
- maintenance cost: config, plugins, provider adapters, updates, and policy.
- reliability cost: recovery when a session, model, network request, or tool call fails.

## hardware and local analysis

coding agent hardware cost depends on where analysis runs and how much development work happens in parallel.

### four execution patterns

| pattern | model compute | code execution | main local pressure |
|---|---|---|---|
| hosted model, local agent | provider | your machine | builds, tests, browsers, worktrees, and file indexing |
| hosted model, remote agent | provider | remote environment | local review is light; environment parity and transfer become harder |
| local model, local agent | your machine | your machine | model weights, key value cache, runtime memory, builds, and thermal load |
| hosted model, many local agents | provider | your machine | duplicated workspaces and simultaneous development processes |

hosted analysis moves model compute away from the mac while repository work remains local.

### memory planning bands

use these practical planning bands as a starting point for a modern mac, then measure the actual development stack:

| unified memory | reasonable expectation |
|---|---|
| 16 gb | one active hosted model agent with a moderate development stack; browser and container heavy work can become constrained |
| 24 to 36 gb | a comfortable hosted model setup with several worktrees, browsers, and normal local services |
| 48 to 64 gb | heavier parallel builds, several active agents, larger containers, or exploratory small model analysis |
| 96 gb and above | serious local model experiments or unusually broad local concurrency |

repository language and build system can dominate these bands. a large mobile build, several databases, or a browser test fleet may use more memory than the agent clients themselves.

### ssd pressure

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

allow additional space for metadata, tokenizer files, multiple quantizations, runtime cache, and temporary downloads. memory use also includes the analysis runtime and context cache, so a model that fits on disk may still be practical only at shorter context lengths.

### concurrency is multiplicative

parallel agents can independently start:

- language servers and file watchers.
- package installations and compilers.
- test runners and development servers.
- browsers, simulators, containers, and databases.
- repository indexing and search processes.
- logging, screenshots, and generated artifacts.

the harness may appear lightweight while the processes it launches consume the machine. dashboards make concurrency easier to start, so they should also make idle sessions and resource ownership easy to see.

### local analysis tradeoffs

local models can improve privacy, offline availability, provider independence, inspectability, and predictable marginal cost. the tradeoffs include:

- substantial unified memory or gpu memory.
- model download and ssd capacity.
- lower throughput or capability than the strongest hosted coding models on many machines.
- quantization and serving configuration.
- thermal load and power use during long agent loops.
- responsibility for model, runtime, and harness compatibility.

local analysis is most convincing when one of those control benefits is a real requirement. buying hardware only to avoid a subscription can have a long payback period and a higher maintenance cost.

### attention and context switching

hardware throughput is useful when the operator can review the output.

first party apps and agent dashboards can reduce switching by combining sessions, terminals, diffs, previews, and attention indicators. ide centered systems reduce switching when the editor and debugger are already the main workplace.

evaluate how quickly you can answer:

- which agent is waiting for me?
- what changed, and in which worktree?
- what command is still running?
- what evidence supports completion?
- which external action still needs approval?
- how do i stop or recover the work?

### buying guidance

for hosted codex or claude code use, prioritize enough memory for the development stack and enough ssd for several prepared worktrees. move beyond that baseline when measurements show sustained memory pressure, swap, thermal throttling, or storage churn.

for local analysis, choose the target model sizes and context requirements first. calculate weight and cache needs, then select hardware. a useful coding agent experience also depends on bandwidth, cooling, and supported runtimes.

## recommendation

for a power user on macos, begin with one provider native system and learn its app and terminal surfaces deeply. add an ide host when editor context earns its place. add an orchestration layer when parallel supervision is the proven constraint. adopt local or provider flexible inference when its control benefits justify the hardware and maintenance burden.

that sequence keeps each new layer attached to an observed problem.
