> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

meu setup de Claude Code, open source. hooks, agents, dicas e um plugin que minera seus dados de uso.

se isso te economizar tempo, [da uma estrela](https://github.com/anipotts/claude-code-tips). ajuda outras pessoas a encontrar.

## inicio rapido

```bash
claude plugin install anipotts/mine   # instala o plugin mine
```

depois: copie o [safety-guard.sh](./hooks/safety-guard.sh) pra bloquear comandos perigosos. leia uma [dica](./docs/tips/). pronto.

---

## os numeros

centenas de sessoes em dezenas de projetos. plano max de $200/mes.

o mesmo uso custaria ~$12K na API com cache, ~$95K sem. nenhum loop autonomo. nenhum cron job. toda sessao comeca comigo digitando um prompt. [como a matematica de custo funciona &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats mostrando sessoes, tokens, custos e projetos" />

---

## instale o plugin mine

```bash
claude plugin install anipotts/mine
```

voce ganha o **[mine](https://github.com/anipotts/mine)** · mineracao de sessoes em sqlite. custos, busca, memoria de erros, deteccao de padroes. todos os dados ficam locais em `~/.claude/mine.db`.

```
/mine                     sessoes de hoje, custo, ferramentas mais usadas
/mine search "websocket"  busca full-text em todas as conversas
/mine mistakes            padroes de erro que o claude fica repetindo
/mine hotspots            arquivos mais editados entre sessoes
/mine loops               padroes repetidos entre sessoes
```

comece com `mine` + o hook `safety-guard`. adicione mais conforme precisar. **[docs do mine &rarr;](https://github.com/anipotts/mine)**

---

## as 3 coisas que mudaram como eu codifico

### hooks

hooks sao a diferenca entre "claude faz o que eu quero" e "claude faz o que ele quiser." CLAUDE.md da orientacao. hooks dao imposicao. um e uma sugestao, o outro e uma parede.

esse repo tem 9 hooks que voce pode colocar em qualquer projeto. safety-guard bloqueia force pushes, `rm -rf /`, e `curl | bash`. no-squash bloqueia squash merges. context-save preserva o estado antes da compactacao. escolha os que combinam com seu fluxo de trabalho. [guia de hooks &rarr;](./docs/hooks.md)

### agent teams

multiplas instancias do claude trabalhando simultaneamente no mesmo codebase, cada uma em seu proprio git worktree. o coordenador atribui tarefas, coleta resultados, faz merge da melhor abordagem.

eu uso isso pra pesquisa paralela, testar mudancas arriscadas com seguranca e comparar abordagens lado a lado sem tocar na minha working tree. [como eu uso agent teams &rarr;](./docs/agents.md)

### prompt caching

e por isso que o plano de $200/mes e o melhor negocio em codificacao com IA. o Claude Code faz cache do seu system prompt, ferramentas e CLAUDE.md como prefixo. 91% dos meus tokens de input acertam o cache, ou seja, eu pago 10% do custo de input em 91% das minhas leituras.

o segredo: mantenha seu CLAUDE.md curto e estavel. cada edicao quebra o cache de prefixo. o meu tem 30 linhas e muda talvez uma vez por semana. [o detalhamento completo de custos &rarr;](./docs/cost.md)

---

## dicas

tecnicas curtas e independentes. cada uma e algo que voce pode usar na sua proxima sessao.

| dica | o que voce aprende |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | consiga 97%+ de cache hit rate, reduza sua conta |
| [safety hooks](./docs/tips/safety-hooks.md) | bloqueie force pushes e rm -rf em 5 minutos |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | configuracoes de projeto vs global vs local |
| [session length](./docs/tips/session-length.md) | por que sessoes mais curtas sao mais eficientes (com dados) |
| [ultrathink](./docs/tips/ultrathink.md) | force pensamento estendido pra problemas complexos |
| [context management](./docs/tips/context-management.md) | estrategias de compactacao, taxa de ferramentas ativas, mantendo sessoes enxutas |
| [plan mode](./docs/tips/plan-mode.md) | quando planejar economiza tempo vs quando desperica |
| [fast mode](./docs/tips/fast-mode.md) | mesmo modelo, output mais rapido, o tradeoff |
| [plugins](./docs/tips/plugins.md) | construa um plugin do zero, o que faz valer a pena instalar |
| [subagents](./docs/tips/subagents.md) | agent teams, isolamento com worktree, quando paralelismo compensa |
| [mcp integration](./docs/tips/mcp-integration.md) | conecte servidores MCP, use dentro das sessoes |
| [hooks v2](./docs/tips/hooks-v2.md) | hooks de comando vs http vs prompt, o padrao async |

---

## hooks

copie um, configure, pronto. cada um e um script bash independente. [guia completo &rarr;](./docs/hooks.md)

| hook | evento | o que faz |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | bloqueia force push, `rm -rf /`, DROP TABLE, curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | bloqueia squash merges |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | registra toda chamada de ferramenta no sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | salva contexto antes da compressao |
| [notify](./hooks/notify.sh) | Notification | encaminha pra macOS, Slack, ntfy |

<details>
<summary>mais 4 hooks</summary>

| hook | evento | o que faz |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | lembra voce de commitar depois de N edicoes |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | atualiza automaticamente os stamps "tested with" |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | avisa sobre branches de tracking que sumiram |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | corrige lint de markdown automaticamente ao salvar |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard bloqueando um comando perigoso" />

## agents de exemplo

copie pra `.claude/agents/` e invoque com `/agent <nome>`. cada um ensina um padrao diferente. [guia &rarr;](./docs/agents.md)

| agent | padrao | o que faz |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | monitora arquivos, roda testes, propoe correcoes |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | testa mudancas arriscadas em worktrees isoladas |
| [arch-review](./examples/agents/arch-review.md) | revisao rapida | analise rapida de problemas de arquitetura |
| [write-pr](./examples/agents/write-pr.md) | integracao git | descricoes de PR a partir do seu diff |

## comandos que eu uso

| comando | o que faz |
|---|---|
| `/mine` | dados de uso · custos, sessoes, busca, padroes |
| `/ship` | stage, commit, push, abrir PR em um comando |
| `/improve` | propor atualizacoes no CLAUDE.md a partir do historico git |

mais [2 comandos de exemplo](./examples/commands/) que voce pode copiar: `/sweep`, `/quicktest`.

---

## minhas opinicoes pessoais

| | o que |
|---|---|
| [realidade de custos](./docs/cost.md) | quanto o Claude Code realmente custa, a matematica do prompt caching |
| [erros que cometi](./docs/mistakes.md) | o que me queimou pra voce poder pular |
| [automacao](./docs/automation.md) | os 12 pipelines de CI que mantem esse repo |
| [fluxo de sessao](./docs/session-workflow.md) | como eu trabalho no dia a dia com Claude Code |
| [worktrees](./docs/worktrees.md) | exploracao paralela com o app desktop |

## vs as alternativas

diplomatico, baseado em dados, sem FUD. toda afirmacao cita uma fonte.

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [precos](./docs/comparisons/pricing.md)

---

## exemplos

- [templates de CLAUDE.md](./examples/claude-md/) · configs iniciais pra TypeScript, Python, Rust, Next.js
- [agents de exemplo](./examples/agents/) · 4 agents, cada um ensinando um padrao diferente
- [comandos de exemplo](./examples/commands/) · 2 comandos que voce pode copiar pra qualquer projeto
- [plugin handoff](./examples/plugins/handoff/) · preservacao de contexto no PreCompact
- [plugin broadcast](./examples/plugins/broadcast/) · notificacoes async em eventos git

---

## como esse repo funciona

esse repo roda nos seus proprios padroes.

- **12 workflows de CI** · auditoria de docs, inteligencia competitiva, resumo da comunidade, checagem de frescor, limpeza de stale, dependabot, releases, smoke test de plugin, quality gate de PR, validacao, responder do claude, watcher de upstream
- **11 hooks** rodando em toda sessao
- **<$1/mes** custo de CI · workflows com IA usam haiku
- **0 manutencao manual** · tudo que nao exige bom gosto e automatizado

[detalhes da automacao &rarr;](./docs/automation.md)

---

## ferramentas que eu construi a partir desses padroes

todas vieram de viver dentro do Claude Code todo dia. cada uma resolve um problema especifico que eu encontrava sempre.

- **[mine](https://github.com/anipotts/mine)** · mineracao de sessoes em sqlite. custos, busca, memoria de erros, deteccao de padroes
- **[claudemon](https://github.com/anipotts/claudemon)** · monitoramento de sessoes em tempo real entre projetos e maquinas
- **[cc](https://github.com/anipotts/cc)** · consciencia multi-sessao. veja o que outras sessoes estao fazendo, envie mensagens entre elas
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · servidor MCP pra historico de iMessage somente leitura. 26 ferramentas, zero requisicoes de rede

## mais de mim

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · formato longo
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · newsletter
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · formato curto

---

MIT &middot; feito por [anipotts](https://anipotts.com)
