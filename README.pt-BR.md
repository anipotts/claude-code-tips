> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub estrelas](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![último commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![testado com](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![licença](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

minha configuração Claude Code, open source. hooks, agents, dicas, e um plugin que analisa seus dados de uso.

se isso economizar seu tempo, [dê uma estrela](https://github.com/anipotts/claude-code-tips). ajuda outras pessoas a encontrar.

## início rápido

```bash
/plugin marketplace add anipotts/claude-code-tips   # adiciona marketplace (uma vez)
/plugin install mine@anipotts                       # instala o plugin mine
```

depois: copie [safety-guard.sh](./hooks/safety-guard.sh) para bloquear comandos perigosos. leia uma [dica](./docs/tips/). pronto.

---

## os números

centenas de sessões em dezenas de projetos. plano máximo $200/mês.

o mesmo uso custaria ~$12K na API com caching, ~$95K sem. sem loops autônomos. sem cron jobs. cada sessão começa com você digitando um prompt. [como funciona a matemática de custos &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="estatísticas de mine mostrando sessões, tokens, custos e projetos" />

---

## instale o plugin mine

```bash
/plugin marketplace add anipotts/claude-code-tips   # adiciona marketplace (uma vez)
/plugin install mine@anipotts                       # instala mine
```

você ganha **[mine](https://github.com/anipotts/mine)** · análise de sessões para sqlite. custos, busca, memória de erros, detecção de padrões. todos os dados ficam locais em `~/.claude/mine.db`.

```
/mine                     sessões de hoje, custo, ferramentas principais
/mine search "websocket"  busca em texto completo em todas as conversas
/mine mistakes            padrões de erro que Claude mantém repetindo
/mine hotspots            arquivos mais editados entre sessões
/mine loops               padrões repetidos entre sessões
```

comece com `mine` + o hook `safety-guard`. adicione mais conforme avança. **[documentação do mine &rarr;](https://github.com/anipotts/mine)**

---

## as 3 coisas que mudaram como codigo

### hooks

hooks são a diferença entre "Claude faz o que quero" e "Claude faz o que bem entende." CLAUDE.md oferece orientação. hooks oferecem execução. um é uma sugestão, o outro é uma parede.

este repo tem 9 hooks que você pode adicionar a qualquer projeto. safety-guard bloqueia force pushes, `rm -rf /`, e `curl | bash`. no-squash bloqueia squash merges. context-save preserva estado antes da compactação. escolha os que combinam com seu fluxo de trabalho. [guia de hooks &rarr;](./docs/hooks.md)

### equipes de agents

múltiplas instâncias Claude trabalhando simultaneamente no mesmo repositório, cada uma em sua própria worktree git. o coordenador atribui tarefas, coleta resultados, mescla a melhor abordagem.

uso isso para pesquisa paralela, tentando mudanças arriscadas com segurança, e comparando abordagens lado a lado sem tocar na minha worktree de trabalho. [como uso equipes de agents &rarr;](./docs/agents.md)

### prompt caching

é por isso que o plano $200/mês é o melhor negócio em codificação com IA. Claude Code cacheia seu prompt de sistema, ferramentas e CLAUDE.md como prefixo. 91% dos meus tokens de entrada batem no cache, o que significa que pago 10% do custo de entrada em 91% das minhas leituras.

a chave: mantenha seu CLAUDE.md curto e estável. cada edição quebra o cache de prefixo. o meu tem 30 linhas e muda talvez uma vez por semana. [o breakdown de custo completo &rarr;](./docs/cost.md)

---

## dicas

técnicas curtas e independentes. cada uma é algo que você pode usar na sua próxima sessão.

| dica | o que você aprende |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | obter taxas de cache de 97%+, reduza sua conta |
| [safety hooks](./docs/tips/safety-hooks.md) | bloqueie force pushes e rm -rf em 5 minutos |
| [hierarquia de configurações](./docs/tips/settings-hierarchy.md) | configurações de projeto vs global vs local |
| [comprimento de sessão](./docs/tips/session-length.md) | por que sessões mais curtas são mais eficientes (com dados) |
| [ultrathink](./docs/tips/ultrathink.md) | force extended thinking para problemas complexos |
| [gerenciamento de contexto](./docs/tips/context-management.md) | estratégias de compactação, taxa de ferramentas ativas, mantendo sessões ajustadas |
| [modo plano](./docs/tips/plan-mode.md) | quando planejar economiza tempo vs quando desperdição |
| [modo rápido](./docs/tips/fast-mode.md) | mesmo modelo, saída mais rápida, o tradeoff |
| [plugins](./docs/tips/plugins.md) | construa um plugin do zero, o que torna um digno de instalação |
| [subagents](./docs/tips/subagents.md) | equipes de agents, isolamento de worktree, quando paralelo compensa |
| [integração MCP](./docs/tips/mcp-integration.md) | configure servidores MCP, use-os dentro de sessões |
| [hooks v2](./docs/tips/hooks-v2.md) | hooks de comando vs http vs prompt, o padrão assíncrono |

---

## hooks

copie um, configure, pronto. cada é um script bash independente. [guia completo &rarr;](./docs/hooks.md)

| hook | evento | o que faz |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | bloqueia force push, `rm -rf /`, DROP TABLE, curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | bloqueia squash merges |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | registra cada chamada de ferramenta em sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | salva contexto antes da compressão |
| [notify](./hooks/notify.sh) | Notification | roteia para macOS, Slack, ntfy |

<details>
<summary>4 hooks a mais</summary>

| hook | evento | o que faz |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | lembra você de fazer commit após N edições |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | atualiza automaticamente stamps "testado com" |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | avisa sobre branches de rastreamento idos |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | corrige automaticamente markdown lint ao salvar |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard bloqueando um comando perigoso" />

## agents de exemplo

copie para `.claude/agents/` e invoque com `/agent <name>`. cada um ensina um padrão diferente. [guia &rarr;](./docs/agents.md)

| agent | padrão | o que faz |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | monitora arquivos, executa testes, propõe correções |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | tenta mudanças arriscadas em worktrees isoladas |
| [arch-review](./examples/agents/arch-review.md) | revisão rápida | teste rápido de cheiros de arquitetura |
| [write-pr](./examples/agents/write-pr.md) | integração git | descrições de PR a partir de seu diff |

## comandos que uso

| comando | o que faz |
|---|---|
| `/mine` | dados de uso · custos, sessões, busca, padrões |
| `/ship` | stage, commit, push, abra PR em um comando |
| `/improve` | propõe atualizações de CLAUDE.md a partir do histórico git |

mais [2 comandos de exemplo](./examples/commands/) que você pode copiar: `/sweep`, `/quicktest`.

---

## minhas opiniões pessoais

| | o quê |
|---|---|
| [realidade de custos](./docs/cost.md) | o que Claude Code realmente custa, a matemática de prompt caching |
| [erros que cometi](./docs/mistakes.md) | o que queimou você para que possa pular |
| [automação](./docs/automation.md) | os 12 pipelines de CI que mantêm este repo |
| [fluxo de trabalho de sessão](./docs/session-workflow.md) | como trabalho dia-a-dia com Claude Code |
| [worktrees](./docs/worktrees.md) | exploração paralela com o aplicativo de desktop |

## vs as alternativas

diplomático, orientado por dados, sem FUD. cada afirmação cita uma fonte.

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [preço](./docs/comparisons/pricing.md)

---

## exemplos

- [templates CLAUDE.md](./examples/claude-md/) · configurações iniciais para TypeScript, Python, Rust, Next.js
- [agents de exemplo](./examples/agents/) · 4 agents, cada um ensinando um padrão diferente
- [comandos de exemplo](./examples/commands/) · 2 comandos que você pode copiar para qualquer projeto
- [plugin handoff](./examples/plugins/handoff/) · preservação de contexto PreCompact
- [plugin broadcast](./examples/plugins/broadcast/) · notificações assíncronas em eventos git

---

## como este repo funciona

este repo funciona em seus próprios padrões.

- **12 workflows de CI** · auditoria de docs, inteligência competitiva, resumo da comunidade, verificação de atualização, limpeza obsoleta, dependabot, releases, teste de smoke do plugin, portão de qualidade de PR, validação, respondente Claude, observador upstream
- **11 hooks** rodando em cada sessão
- **<$1/mês** custo de CI · workflows alimentados por IA usam haiku
- **0 manutenção manual** · tudo que não requer gosto é automatizado

[detalhes de automação &rarr;](./docs/automation.md)

---

## ferramentas que construí a partir desses padrões

todas saíram de viver em Claude Code todos os dias. cada uma resolve um problema específico que continuava batendo.

- **[mine](https://github.com/anipotts/mine)** · análise de sessões para sqlite. custos, busca, memória de erros, detecção de padrões
- **[claudemon](https://github.com/anipotts/claudemon)** · monitoramento de sessão em tempo real em projetos e máquinas
- **[cc](https://github.com/anipotts/cc)** · consciência de múltiplas sessões. veja o que outras sessões estão fazendo, envie mensagens entre elas
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · servidor MCP para histórico iMessage somente leitura. 26 ferramentas, zero requisições de rede

## mais de mim

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · long-form
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · newsletter
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · short-form

---

MIT &middot; construído por [anipotts](https://anipotts.com)

<!-- translated from README.md @ 25b25ac -->
