> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

mi configuración de Claude Code, código abierto. hooks, agents, consejos, y un plugin que analiza tus datos de uso.

si esto te ahorra tiempo, [ponle una estrella](https://github.com/anipotts/claude-code-tips). ayuda a que otros lo encuentren.

## inicio rápido

```bash
/plugin marketplace add anipotts/claude-code-tips   # agregar marketplace (una sola vez)
/plugin install mine@cc                             # instalar mine (análisis de sesiones)
/plugin install cc@cc                               # instalar cc (mensajería entre sesiones)
```

luego: copia [safety-guard.sh](./hooks/safety-guard.sh) para bloquear comandos peligrosos. lee un [consejo](./docs/tips/). listo.

---

## los números

cientos de sesiones en docenas de proyectos. máximo plan de $200/mes.

el mismo uso costaría ~$12K en la API con caching, ~$95K sin él. sin bucles autónomos. sin cron jobs. cada sesión comienza con que yo escribo un prompt. [cómo funciona la matemática de costos &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="estadísticas de mine mostrando sesiones, tokens, costos y proyectos" />

---

## instalar el plugin mine

```bash
/plugin marketplace add anipotts/claude-code-tips   # agregar marketplace (una sola vez)
/plugin install mine@cc                             # instalar mine (análisis de sesiones)
/plugin install cc@cc                               # instalar cc (mensajería entre sesiones)
```

obtienes **[mine](./plugins/mine/)** · análisis de sesiones en sqlite. costos, búsqueda, memoria de errores, detección de patrones. todos los datos se quedan locales en `~/.claude/mine.db`.

```
/mine                     sesiones de hoy, costo, herramientas principales
/mine search "websocket"  búsqueda de texto completo en todas las conversaciones
/mine mistakes            patrones de errores que Claude sigue repitiendo
/mine hotspots            archivos más editados en todas las sesiones
/mine loops               patrones repetidos en todas las sesiones
```

comienza con `mine` + el hook `safety-guard`. agrega más conforme vayas avanzando. **[documentación de mine &rarr;](./plugins/mine/)**

---

## plugin cc

mensajería entre sesiones. ve qué están haciendo otras sesiones de Claude Code, envía mensajes entre ellas.

```bash
/plugin install cc@cc
```

```
/cc                          mostrar sesiones activas
/cc send merizo "pause"      enviar mensaje a otra sesión
```

---

## las 3 cosas que cambiaron cómo codifico

### hooks

los hooks son la diferencia entre "Claude hace lo que quiero" y "Claude hace lo que se le antoja". CLAUDE.md da orientación. los hooks dan cumplimiento. uno es una sugerencia, el otro es un muro.

este repositorio tiene 9 hooks que puedes incorporar en cualquier proyecto. safety-guard bloquea push forzados, `rm -rf /`, y `curl | bash`. no-squash bloquea merges por squash. context-save preserva el estado antes de compactación. elige los que se adapten a tu flujo de trabajo. [guía de hooks &rarr;](./docs/hooks.md)

### equipos de agents

múltiples instancias de Claude trabajando simultáneamente en el mismo repositorio, cada una en su propio git worktree. el coordinador asigna tareas, recopila resultados, fusiona el mejor enfoque.

uso esto para investigación paralela, intentar cambios riesgosos de forma segura, y comparar enfoques lado a lado sin tocar mi árbol de trabajo. [cómo uso equipos de agents &rarr;](./docs/agents.md)

### prompt caching

esto es por qué el plan de $200/mes es la mejor oferta en codificación con IA. Claude Code cachea tu sistema prompt, herramientas, y CLAUDE.md como prefijo. el 91% de mis tokens de entrada golpean el caché, lo que significa que pago el 10% del costo de entrada en el 91% de mis lecturas.

la clave: mantén tu CLAUDE.md corto y estable. cada edición rompe el caché de prefijo. el mío tiene 30 líneas y cambia quizás una vez a la semana. [el desglose de costos completo &rarr;](./docs/cost.md)

---

## consejos

técnicas cortas y autónomas. cada una es algo que puedes usar en tu próxima sesión.

| consejo | qué aprendes |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | obtén tasas de impacto de caché superiores al 97%, reduce tu factura |
| [safety hooks](./docs/tips/safety-hooks.md) | bloquea push forzados y rm -rf en 5 minutos |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | configuraciones de proyecto vs globales vs locales |
| [session length](./docs/tips/session-length.md) | por qué sesiones más cortas son más eficientes (con datos) |
| [ultrathink](./docs/tips/ultrathink.md) | fuerza pensamiento extendido para problemas complejos |
| [context management](./docs/tips/context-management.md) | estrategias de compactación, tasa de herramientas activas, mantener sesiones ajustadas |
| [plan mode](./docs/tips/plan-mode.md) | cuándo la planificación ahorra tiempo vs cuándo lo desperdicia |
| [fast mode](./docs/tips/fast-mode.md) | mismo modelo, salida más rápida, el trueque |
| [plugins](./docs/tips/plugins.md) | crea un plugin desde cero, qué hace que uno valga la pena instalar |
| [subagents](./docs/tips/subagents.md) | equipos de agents, aislamiento de worktree, cuándo lo paralelo vale la pena |
| [mcp integration](./docs/tips/mcp-integration.md) | conecta servidores MCP, úsalos dentro de sesiones |
| [hooks v2](./docs/tips/hooks-v2.md) | hooks de comando vs http vs prompt, el patrón asincrónico |

---

## hooks

copia uno, conéctalo, listo. cada uno es un script bash autónomo. [guía completa &rarr;](./docs/hooks.md)

| hook | evento | qué hace |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | bloquea push forzado, `rm -rf /`, DROP TABLE, curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | bloquea merges por squash |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | registra cada llamada de herramienta en sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | guarda contexto antes de compresión |
| [notify](./hooks/notify.sh) | Notification | dirige a macOS, Slack, ntfy |

<details>
<summary>4 hooks más</summary>

| hook | evento | qué hace |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | te recuerda hacer commit después de N ediciones |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | actualiza automáticamente sellos de "probado con" |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | advierte sobre ramas de rastreo desaparecidas |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | corrige automáticamente lint de markdown al guardar |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard bloqueando un comando peligroso" />

## agents de ejemplo

copia a `.claude/agents/` e invoca con `/agent <name>`. cada uno enseña un patrón diferente. [guía &rarr;](./docs/agents.md)

| agent | patrón | qué hace |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | vigila archivos, ejecuta pruebas, propone correcciones |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | intenta cambios riesgosos en worktrees aislados |
| [arch-review](./examples/agents/arch-review.md) | revisión rápida | prueba rápida de olor de arquitectura |
| [write-pr](./examples/agents/write-pr.md) | integración git | descripciones de PR desde tu diff |

## comandos que uso

| comando | qué hace |
|---|---|
| `/mine` | datos de uso · costos, sesiones, búsqueda, patrones |
| `/ship` | stage, commit, push, abrir PR en un comando |
| `/improve` | proponer actualizaciones de CLAUDE.md desde historial git |

más [2 comandos de ejemplo](./examples/commands/) que puedes copiar: `/sweep`, `/quicktest`.

---

## mis opiniones personales

| | qué |
|---|---|
| [realidad de costos](./docs/cost.md) | qué cuesta realmente Claude Code, la matemática del prompt caching |
| [errores que cometí](./docs/mistakes.md) | qué me quemó para que lo puedas evitar |
| [automatización](./docs/automation.md) | los 12 pipelines CI que mantienen este repositorio |
| [flujo de trabajo de sesión](./docs/session-workflow.md) | cómo trabajo día a día con Claude Code |
| [worktrees](./docs/worktrees.md) | exploración paralela con la app de escritorio |

## vs las alternativas

diplomático, impulsado por datos, sin FUD. cada afirmación cita una fuente.

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [precios](./docs/comparisons/pricing.md)

---

## ejemplos

- [plantillas CLAUDE.md](./examples/claude-md/) · configuraciones iniciales para TypeScript, Python, Rust, Next.js
- [agents de ejemplo](./examples/agents/) · 4 agents, cada uno enseñando un patrón diferente
- [comandos de ejemplo](./examples/commands/) · 2 comandos que puedes copiar a cualquier proyecto
- [plugin de handoff](./examples/plugins/handoff/) · preservación de contexto PreCompact
- [plugin de broadcast](./examples/plugins/broadcast/) · notificaciones asincrónicas en eventos git

---

## cómo funciona este repositorio

este repositorio funciona con sus propios patrones.

- **12 flujos de trabajo CI** · auditoría de docs, inteligencia competitiva, resumen comunitario, verificación de frescura, limpieza obsoleta, dependabot, lanzamientos, prueba de humo de plugin, compuerta de calidad de PR, validación, respondedor de Claude, vigilante upstream
- **11 hooks** ejecutándose en cada sesión
- **<$1/mes** costo de CI · flujos de trabajo impulsados por IA usan haiku
- **0 mantenimiento manual** · todo lo que no requiere gusto está automatizado

[detalles de automatización &rarr;](./docs/automation.md)

---

## herramientas que construí a partir de estos patrones

todas salieron de vivir en Claude Code todos los días. cada una resuelve un problema específico que seguía encontrando.

- **[mine](./plugins/mine/)** · análisis de sesiones en sqlite. costos, búsqueda, memoria de errores, detección de patrones
- **[claudemon](https://github.com/anipotts/claudemon)** · monitoreo de sesiones en tiempo real en proyectos y máquinas
- **[cc](./plugins/cc/)** · conciencia multi-sesión. ve qué están haciendo otras sesiones, envía mensajes entre ellas
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · servidor MCP para historial de iMessage de solo lectura. 26 herramientas, cero solicitudes de red

## más de mí

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · formato largo
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · boletín
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · formato corto

---

MIT &middot; construido por [anipotts](https://anipotts.com)

<!-- translated from README.md @ 77e88e7 -->
