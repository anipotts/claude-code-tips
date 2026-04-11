> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

mi configuración de Claude Code, código abierto. hooks, agentes, consejos y un plugin que analiza tus datos de uso.

si esto te ahorra tiempo, [dale una estrella](https://github.com/anipotts/claude-code-tips). ayuda a que otros lo encuentren.

## inicio rápido

```bash
/plugin marketplace add anipotts/claude-code-tips   # agrega marketplace (una vez)
/plugin install mine@anipotts                       # instala el plugin mine
```

luego: copia [safety-guard.sh](./hooks/safety-guard.sh) para bloquear comandos peligrosos. lee un [consejo](./docs/tips/). listo.

---

## los números

cientos de sesiones en docenas de proyectos. plan máximo de $200/mes.

el mismo uso costaría ~$12K en la API con caching, ~$95K sin. sin loops autónomos. sin cron jobs. cada sesión comienza cuando escribo un prompt. [cómo funciona la matemática de costos &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="estadísticas de mine mostrando sesiones, tokens, costos y proyectos" />

---

## instala el plugin mine

```bash
/plugin marketplace add anipotts/claude-code-tips   # agrega marketplace (una vez)
/plugin install mine@anipotts                       # instala mine
```

obtienes **[mine](https://github.com/anipotts/mine)** · análisis de sesiones a sqlite. costos, búsqueda, memoria de errores, detección de patrones. todos los datos se quedan locales en `~/.claude/mine.db`.

```
/mine                     sesiones de hoy, costo, herramientas más usadas
/mine search "websocket"  búsqueda de texto completo en todas las conversaciones
/mine mistakes            patrones de errores que Claude sigue repitiendo
/mine hotspots            archivos más editados en todas las sesiones
/mine loops               patrones repetidos en todas las sesiones
```

comienza con `mine` + el hook `safety-guard`. agrega más conforme avances. **[docs de mine &rarr;](https://github.com/anipotts/mine)**

---

## las 3 cosas que cambiaron cómo codifico

### hooks

los hooks son la diferencia entre "Claude hace lo que quiero" y "Claude hace lo que se le antoja". CLAUDE.md da guía. los hooks dan fuerza. uno es una sugerencia, el otro es una pared.

este repo tiene 9 hooks que puedes soltar en cualquier proyecto. safety-guard bloquea push forzados, `rm -rf /` y `curl | bash`. no-squash bloquea squash merges. context-save preserva estado antes de compactación. elige los que se adapten a tu flujo. [guía de hooks &rarr;](./docs/hooks.md)

### equipos de agentes

múltiples instancias de Claude trabajando simultáneamente en el mismo código, cada una en su propio git worktree. el coordinador asigna tareas, recolecta resultados, fusiona el mejor enfoque.

lo uso para investigación paralela, intentar cambios riesgosos de forma segura y comparar enfoques lado a lado sin tocar mi árbol de trabajo. [cómo uso equipos de agentes &rarr;](./docs/agents.md)

### prompt caching

esto es por qué el plan de $200/mes es el mejor deal en coding con IA. Claude Code cachea tu system prompt, herramientas y CLAUDE.md como prefijo. el 91% de mis tokens de entrada golpean el cache, significa que pago 10% del costo de entrada en 91% de mis lecturas.

la clave: mantén tu CLAUDE.md corto y estable. cada edición rompe el cache de prefijo. el mío tiene 30 líneas y cambia quizá una vez a la semana. [el desglose de costos completo &rarr;](./docs/cost.md)

---

## consejos

técnicas cortas y autónomas. cada una es algo que puedes usar en tu próxima sesión.

| consejo | qué aprendes |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | obtén tasas de cache hit de 97%+, reduce tu factura |
| [safety hooks](./docs/tips/safety-hooks.md) | bloquea push forzados y rm -rf en 5 minutos |
| [jerarquía de configuración](./docs/tips/settings-hierarchy.md) | configuración por proyecto vs global vs local |
| [duración de sesión](./docs/tips/session-length.md) | por qué sesiones más cortas son más eficientes (con datos) |
| [ultrathink](./docs/tips/ultrathink.md) | fuerza pensamiento extendido para problemas complejos |
| [gestión de contexto](./docs/tips/context-management.md) | estrategias de compactación, tasa de herramientas activas, mantener sesiones ajustadas |
| [modo planificación](./docs/tips/plan-mode.md) | cuándo planificar ahorra tiempo vs cuándo lo desperdicia |
| [modo rápido](./docs/tips/fast-mode.md) | mismo modelo, salida más rápida, el tradeoff |
| [plugins](./docs/tips/plugins.md) | construye un plugin desde cero, qué lo hace valer la pena instalar |
| [subagentes](./docs/tips/subagents.md) | equipos de agentes, aislamiento de worktree, cuándo lo paralelo paga |
| [integración MCP](./docs/tips/mcp-integration.md) | conecta servidores MCP, úsalos dentro de sesiones |
| [hooks v2](./docs/tips/hooks-v2.md) | hooks de comando vs http vs prompt, el patrón asíncrono |

---

## hooks

copia uno, conéctalo, listo. cada uno es un script bash autónomo. [guía completa &rarr;](./docs/hooks.md)

| hook | evento | qué hace |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | bloquea push forzado, `rm -rf /`, DROP TABLE, curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | bloquea squash merges |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | registra cada llamada de herramienta a sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | guarda contexto antes de compresión |
| [notify](./hooks/notify.sh) | Notification | enruta a macOS, Slack, ntfy |

<details>
<summary>4 hooks más</summary>

| hook | evento | qué hace |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | te recuerda hacer commit después de N ediciones |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | actualiza automáticamente stamps de "testeado con" |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | advierte sobre ramas de seguimiento desaparecidas |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | corrige automáticamente markdown lint al guardar |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard bloqueando un comando peligroso" />

## agentes de ejemplo

copia a `.claude/agents/` e invoca con `/agent <name>`. cada uno enseña un patrón diferente. [guía &rarr;](./docs/agents.md)

| agente | patrón | qué hace |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | observa archivos, ejecuta pruebas, propone correcciones |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | intenta cambios riesgosos en worktrees aislados |
| [arch-review](./examples/agents/arch-review.md) | revisión rápida | prueba de olor de arquitectura rápida |
| [write-pr](./examples/agents/write-pr.md) | integración git | descripciones de PR desde tu diff |

## comandos que uso

| comando | qué hace |
|---|---|
| `/mine` | datos de uso · costos, sesiones, búsqueda, patrones |
| `/ship` | stage, commit, push, abre PR en un comando |
| `/improve` | propone actualizaciones de CLAUDE.md desde el historial git |

más [2 comandos de ejemplo](./examples/commands/) que puedes copiar: `/sweep`, `/quicktest`.

---

## mis opiniones personales

| | qué |
|---|---|
| [realidad de costos](./docs/cost.md) | qué Claude Code realmente cuesta, la matemática de prompt caching |
| [errores que cometí](./docs/mistakes.md) | qué me quemó para que lo saltes |
| [automatización](./docs/automation.md) | los 12 pipelines CI que mantienen este repo |
| [flujo de trabajo de sesión](./docs/session-workflow.md) | cómo trabajo día a día con Claude Code |
| [worktrees](./docs/worktrees.md) | exploración paralela con la aplicación desktop |

## vs las alternativas

diplomático, basado en datos, sin FUD. cada afirmación cita una fuente.

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [costos](./docs/comparisons/pricing.md)

---

## ejemplos

- [plantillas CLAUDE.md](./examples/claude-md/) · configuraciones iniciales para TypeScript, Python, Rust, Next.js
- [agentes de ejemplo](./examples/agents/) · 4 agentes, cada uno enseñando un patrón diferente
- [comandos de ejemplo](./examples/commands/) · 2 comandos que puedes copiar a cualquier proyecto
- [plugin handoff](./examples/plugins/handoff/) · preservación de contexto PreCompact
- [plugin broadcast](./examples/plugins/broadcast/) · notificaciones asincrónicas en eventos git

---

## cómo funciona este repo

este repo se ejecuta en sus propios patrones.

- **12 workflows CI** · auditoría de docs, inteligencia competitiva, digestión comunitaria, verificación de actualización, limpieza de obsoletos, dependabot, releases, prueba de smoke de plugin, puerta de calidad de PR, validación, respondedor de Claude, observador de upstream
- **11 hooks** ejecutándose en cada sesión
- **<$1/mes** costo CI · los workflows potenciados por IA usan haiku
- **0 mantenimiento manual** · todo lo que no requiere gusto está automatizado

[detalles de automatización &rarr;](./docs/automation.md)

---

## herramientas que construí desde estos patrones

todas salieron de vivir en Claude Code cada día. cada una resuelve un problema específico que sigo golpeando.

- **[mine](https://github.com/anipotts/mine)** · análisis de sesiones a sqlite. costos, búsqueda, memoria de errores, detección de patrones
- **[claudemon](https://github.com/anipotts/claudemon)** · monitoreo de sesiones en tiempo real en proyectos y máquinas
- **[cc](https://github.com/anipotts/cc)** · conciencia multi-sesión. ve qué otras sesiones están haciendo, envía mensajes entre ellas
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · servidor MCP para historial de iMessage de solo lectura. 26 herramientas, cero solicitudes de red

## más de mí

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · forma larga
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · newsletter
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · forma corta

---

MIT &middot; construido por [anipotts](https://anipotts.com)

<!-- translated from README.md @ 25b25ac -->
