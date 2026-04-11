> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

mi setup de Claude Code, open source. hooks, agentes, tips y un plugin que mina tus datos de uso.

si esto te ahorra tiempo, [dale una estrella](https://github.com/anipotts/claude-code-tips). ayuda a que otros lo encuentren.

## inicio rapido

```bash
claude plugin install anipotts/mine   # install the mine plugin
```

despues: copia [safety-guard.sh](./hooks/safety-guard.sh) para bloquear comandos peligrosos. lee un [tip](./docs/tips/). listo.

---

## los numeros

cientos de sesiones en docenas de proyectos. plan max de $200/mes.

el mismo uso costaria ~$12K en la API con cache, ~$95K sin cache. sin loops autonomos. sin cron jobs. cada sesion empieza conmigo escribiendo un prompt. [como funciona la matematica de costos &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## instala el plugin mine

```bash
claude plugin install anipotts/mine
```

obtienes **[mine](https://github.com/anipotts/mine)** · mineria de sesiones a sqlite. costos, busqueda, memoria de errores, deteccion de patrones. todos los datos se quedan en local en `~/.claude/mine.db`.

```
/mine                     sesiones de hoy, costo, herramientas mas usadas
/mine search "websocket"  busqueda full-text en todas las conversaciones
/mine mistakes            patrones de error que claude sigue repitiendo
/mine hotspots            archivos mas editados entre sesiones
/mine loops               patrones repetidos entre sesiones
```

empieza con `mine` + el hook `safety-guard`. agrega mas conforme avanzas. **[docs de mine &rarr;](https://github.com/anipotts/mine)**

---

## las 3 cosas que cambiaron como programo

### hooks

los hooks son la diferencia entre "claude hace lo que yo quiero" y "claude hace lo que se le da la gana." CLAUDE.md da orientacion. los hooks dan cumplimiento. uno es una sugerencia, el otro es un muro.

este repo tiene 9 hooks que puedes meter en cualquier proyecto. safety-guard bloquea force pushes, `rm -rf /` y `curl | bash`. no-squash bloquea squash merges. context-save preserva el estado antes de la compactacion. elige los que encajen en tu flujo de trabajo. [guia de hooks &rarr;](./docs/hooks.md)

### equipos de agentes

multiples instancias de claude trabajando simultaneamente en el mismo codebase, cada una en su propio git worktree. el coordinador asigna tareas, recopila resultados y hace merge del mejor enfoque.

yo lo uso para investigacion en paralelo, probar cambios riesgosos de forma segura y comparar enfoques lado a lado sin tocar mi working tree. [como uso equipos de agentes &rarr;](./docs/agents.md)

### prompt caching

esta es la razon por la que el plan de $200/mes es la mejor oferta en AI coding. Claude Code cachea tu system prompt, herramientas y CLAUDE.md como prefijo. el 91% de mis tokens de entrada dan en el cache, lo que significa que pago el 10% del costo de entrada en el 91% de mis lecturas.

la clave: manten tu CLAUDE.md corto y estable. cada edicion rompe el cache de prefijo. el mio tiene 30 lineas y cambia quiza una vez por semana. [el desglose completo de costos &rarr;](./docs/cost.md)

---

## tips

tecnicas cortas e independientes. cada una es algo que puedes usar en tu proxima sesion.

| tip | que aprendes |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | obtener 97%+ de cache hit rate, reducir tu factura |
| [safety hooks](./docs/tips/safety-hooks.md) | bloquear force pushes y rm -rf en 5 minutos |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | settings de proyecto vs global vs local |
| [session length](./docs/tips/session-length.md) | por que las sesiones cortas son mas eficientes (con datos) |
| [ultrathink](./docs/tips/ultrathink.md) | forzar pensamiento extendido para problemas complejos |
| [context management](./docs/tips/context-management.md) | estrategias de compactacion, active tool rate, sesiones ajustadas |
| [plan mode](./docs/tips/plan-mode.md) | cuando planear ahorra tiempo vs cuando lo desperdicia |
| [fast mode](./docs/tips/fast-mode.md) | mismo modelo, output mas rapido, el tradeoff |
| [plugins](./docs/tips/plugins.md) | construir un plugin desde cero, que hace que valga la pena instalarlo |
| [subagents](./docs/tips/subagents.md) | equipos de agentes, aislamiento con worktree, cuando el paralelismo vale la pena |
| [mcp integration](./docs/tips/mcp-integration.md) | conectar servidores MCP, usarlos dentro de sesiones |
| [hooks v2](./docs/tips/hooks-v2.md) | hooks de command vs http vs prompt, el patron asincrono |

---

## hooks

copia uno, conectalo, listo. cada uno es un script bash independiente. [guia completa &rarr;](./docs/hooks.md)

| hook | evento | que hace |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | bloquea force push, `rm -rf /`, DROP TABLE, curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | bloquea squash merges |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | registra cada tool call en sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | guarda el contexto antes de la compresion |
| [notify](./hooks/notify.sh) | Notification | envia a macOS, Slack, ntfy |

<details>
<summary>4 hooks mas</summary>

| hook | evento | que hace |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | te recuerda hacer commit despues de N ediciones |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | actualiza automaticamente los stamps de "tested with" |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | avisa sobre tracking branches eliminados |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | corrige automaticamente el lint de markdown al guardar |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## agentes de ejemplo

copia a `.claude/agents/` e invoca con `/agent <nombre>`. cada uno ensena un patron diferente. [guia &rarr;](./docs/agents.md)

| agente | patron | que hace |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | observa archivos, corre tests, propone fixes |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | prueba cambios riesgosos en worktrees aislados |
| [arch-review](./examples/agents/arch-review.md) | revision rapida | revision rapida de olores arquitectonicos |
| [write-pr](./examples/agents/write-pr.md) | integracion git | descripciones de PR a partir de tu diff |

## comandos que uso

| comando | que hace |
|---|---|
| `/mine` | datos de uso · costos, sesiones, busqueda, patrones |
| `/ship` | stage, commit, push, abrir PR en un solo comando |
| `/improve` | proponer actualizaciones a CLAUDE.md a partir del historial git |

mas [2 comandos de ejemplo](./examples/commands/) que puedes copiar: `/sweep`, `/quicktest`.

---

## mis opiniones personales

| | que |
|---|---|
| [realidad de costos](./docs/cost.md) | lo que Claude Code realmente cuesta, la matematica de prompt caching |
| [errores que cometi](./docs/mistakes.md) | lo que me quemo para que te lo puedas saltar |
| [automatizacion](./docs/automation.md) | los 12 pipelines de CI que mantienen este repo |
| [flujo de sesion](./docs/session-workflow.md) | como trabajo dia a dia con Claude Code |
| [worktrees](./docs/worktrees.md) | exploracion en paralelo con la app de escritorio |

## vs las alternativas

diplomatico, basado en datos, sin FUD. cada afirmacion cita una fuente.

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [precios](./docs/comparisons/pricing.md)

---

## ejemplos

- [plantillas de CLAUDE.md](./examples/claude-md/) · configs iniciales para TypeScript, Python, Rust, Next.js
- [agentes de ejemplo](./examples/agents/) · 4 agentes, cada uno ensena un patron diferente
- [comandos de ejemplo](./examples/commands/) · 2 comandos que puedes copiar a cualquier proyecto
- [plugin handoff](./examples/plugins/handoff/) · preservacion de contexto en PreCompact
- [plugin broadcast](./examples/plugins/broadcast/) · notificaciones asincronas en eventos git

---

## como funciona este repo

este repo corre con sus propios patrones.

- **12 workflows de CI** · auditoria de docs, inteligencia competitiva, resumen de comunidad, chequeo de frescura, limpieza de stale, dependabot, releases, smoke test de plugins, quality gate de PRs, validacion, claude responder, upstream watcher
- **11 hooks** corriendo en cada sesion
- **<$1/mes** de costo de CI · los workflows con AI usan haiku
- **0 mantenimiento manual** · todo lo que no requiere criterio esta automatizado

[detalles de automatizacion &rarr;](./docs/automation.md)

---

## herramientas que construi con estos patrones

todas salieron de vivir en Claude Code todos los dias. cada una resuelve un problema especifico que me seguia apareciendo.

- **[mine](https://github.com/anipotts/mine)** · mineria de sesiones a sqlite. costos, busqueda, memoria de errores, deteccion de patrones
- **[claudemon](https://github.com/anipotts/claudemon)** · monitoreo de sesiones en tiempo real entre proyectos y maquinas
- **[cc](https://github.com/anipotts/cc)** · awareness multi-sesion. ve lo que otras sesiones estan haciendo, envia mensajes entre ellas
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · servidor MCP para historial de iMessage en modo lectura. 26 herramientas, cero requests de red

## mas de mi

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · formato largo
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · newsletter
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · formato corto

---

MIT &middot; hecho por [anipotts](https://anipotts.com)
