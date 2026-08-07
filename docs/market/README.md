# market map for coding-agent systems

<!-- guide-meta: {"products":["market"],"last_verified":"2026-08-07","evidence":["hands-on","source-verified","inference"],"source_ids":["openai-codex-manual","anthropic-claude-overview","vscode-agent-host","cursor-docs","conductor-harnesses","t3-code","opencode","kimi-code","kimi-k3","qwen-code","qwen-models","grok-build","grok-4-5"]} -->

evidence: codex is current hands-on; claude code combines historical use with current source verification; other products are source-verified

last verified: 2026-08-07

this appendix helps experienced builders choose an operating environment. it does not rank model benchmark scores.

## choose the layer first

| layer | question | examples |
|---|---|---|
| surface | where do you direct, inspect, and review work? | terminal, first-party app, vscode, cursor, dashboard |
| harness | what runs the agent loop and tools? | codex, claude code, opencode, kimi code, qwen code, grok build |
| model | what supplies reasoning and generation? | openai, anthropic, xai, kimi, qwen, local open weights |
| orchestration | what manages parallel sessions and review? | first-party task views, conductor, t3 code |

a product can occupy more than one layer. cursor combines an editor surface with its own agent harness. vscode is an editor and increasingly an agent host. conductor and t3 code sit above several harnesses. kimi, qwen, and xai each offer both models and coding-agent products.

## chooser with defaults

### choose a first-party app plus terminal when

- you want one account and one native session model.
- browser, computer, preview, scheduled, or remote capabilities matter.
- reducing attention spent moving among terminal, editor, browser, and pull-request pages is valuable.
- you prefer provider-native support over harness portability.

default: codex app plus codex cli, or claude desktop plus claude code terminal.

### choose an ide-centered system when

- the active file, selection, debugger, diagnostics, and inline diff drive most decisions.
- you already spend the day inside one editor.
- session management should remain close to code navigation.
- switching models or harnesses inside the editor is more useful than provider-native app features.

default: cursor for an integrated commercial system, or vscode when its extension ecosystem and agent-host direction fit the team.

### add an orchestration app when

- several isolated workspaces run at once.
- branch, port, process, and pull-request state are becoming hard to supervise.
- one screen for attention routing is more valuable than another agent feature.
- the team accepts an additional layer between the harness and repository.

default: remain on first-party worktrees until coordination becomes a measured problem. evaluate conductor or t3 code after that point.

### choose a provider-flexible harness when

- model choice, custom endpoints, or local inference is a core requirement.
- open-source inspectability matters.
- the team can own provider configuration, authentication, updates, and compatibility.
- losing some first-party integration is an acceptable tradeoff.

default: evaluate opencode before building a custom harness. evaluate kimi code, qwen code, or grok build when their model integration or protocol support matches a specific need.

## contender map

| product | layer | evidence | current read |
|---|---|---|---|
| codex | harness plus first-party app, ide, cli, and cloud surfaces | hands-on | primary guide |
| claude code | harness plus terminal, desktop, ide, web, and remote surfaces | historical hands-on, current source-verified | primary guide; rerun the current protocol before a direct ranking |
| [cursor](https://cursor.com/) | editor plus agent harness and cloud-agent surface | source-verified | strong ide-centered option; needs a separate hands-on pass |
| [vscode agent host](https://code.visualstudio.com/docs/agents/concepts/agent-host) | editor and multi-harness session host | source-verified, preview | important direction; rollout and billing paths remain product-dependent |
| [conductor](https://www.conductor.build/docs/reference/harnesses) | local mac orchestration over codex, claude code, cursor, and opencode | source-verified | evaluate when first-party worktrees stop being enough |
| [t3 code](https://t3.codes/) | open-source orchestration over several harnesses | source-verified | promising control-plane option; needs hands-on verification |
| [opencode](https://github.com/anomalyco/opencode) | open-source provider-flexible harness | source-verified | sensible baseline for provider portability or local inference |
| [kimi code](https://www.kimi.com/code/docs/) | terminal and ide harness optimized for kimi models | source-verified watchlist | separate from the Kimi K3 model family |
| [qwen code](https://github.com/QwenLM/qwen-code) | open-source terminal and ide-friendly harness | source-verified watchlist | separate from Qwen model releases |
| [grok build](https://docs.x.ai/build/overview) | open-source terminal harness with dashboard and acp support | source-verified watchlist | xai's coding harness; separate from Grok 4.5 |
| [Kimi K3](https://github.com/MoonshotAI/Kimi-K3) | hosted and open-weight model family | source-verified watchlist | model layer, not an ide |
| [Qwen models](https://github.com/QwenLM) | hosted and open-weight model family | source-verified watchlist | model layer, commonly used through Qwen Code or compatible harnesses |
| [Grok 4.5](https://docs.x.ai/developers/grok-4-5) | hosted xai model | source-verified watchlist | model layer; available through Grok Build, api, and Cursor |

cline and continue are intentionally outside this edition. absence does not imply a negative recommendation.

## xai naming

xai's first-party coding product is [Grok Build](https://docs.x.ai/build/overview), a terminal agent that can also run headlessly or through the Agent Client Protocol. [Grok 4.5](https://docs.x.ai/developers/grok-4-5) is the model used by that harness and is also offered in Cursor.

current primary sources do not establish a separate xai-built Cursor-style editor. describe the harness and model separately until such a product is documented.

## costs that pricing pages miss

subscription or token price is only one part of the system:

- attention cost: how often work forces a surface change or loses state.
- review cost: how clearly the system presents diffs, commands, evidence, and failures.
- local resource cost: worktrees, dependencies, builds, browsers, watchers, and dev servers.
- coordination cost: ownership, merge conflicts, ports, credentials, and external side effects.
- maintenance cost: config, plugins, provider adapters, updates, and policy.
- reliability cost: recovery when a session, model, network request, or tool call fails.

the [hardware guide](./hardware.md) covers the local resource side.

## recommendation

for a power user on macos, begin with one provider-native system and learn its app and terminal surfaces deeply. add an ide host when editor context earns its place. add an orchestration layer when parallel supervision is the proven constraint. adopt local or provider-flexible inference when its control benefits justify the hardware and maintenance burden.

that sequence keeps each new layer attached to an observed problem.
