> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

मेरी claude code सेटअप, पूरी तरह open source। hooks, agents, tips, और एक plugin जो आपके usage data को mine करता है।

अगर ये आपका समय बचाता है, तो [इसे star करें](https://github.com/anipotts/claude-code-tips)। इससे दूसरों को खोजने में मदद मिलती है।

## शुरुआत

```bash
/plugin marketplace add anipotts/claude-code-tips   # marketplace जोड़ें (एक बार)
/plugin install mine@cc                             # mine install करें (session analytics)
/plugin install cc@cc                               # cc install करें (cross-session messaging)
```

फिर: [safety-guard.sh](./hooks/safety-guard.sh) को कॉपी करें खतरनाक कमांड ब्लॉक करने के लिए। एक [tip](./docs/tips/) पढ़ें। हो गया।

---

## आंकड़े

दर्जनों projects में सैकड़ों sessions। $200/माह का maximum plan।

उसी usage की API के साथ caching के साथ ~$12K खर्च होता, बिना caching के ~$95K। कोई autonomous loops नहीं। कोई cron jobs नहीं। हर session मेरे द्वारा prompt टाइप करने से शुरू होता है। [cost का गणित कैसे काम करता है &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## mine plugin install करें

```bash
/plugin marketplace add anipotts/claude-code-tips   # marketplace जोड़ें (एक बार)
/plugin install mine@cc                             # mine install करें (session analytics)
/plugin install cc@cc                               # cc install करें (cross-session messaging)
```

आपको **[mine](./plugins/mine/)** मिलता है · session mining to sqlite। costs, search, error memory, pattern detection। सभी data locally `~/.claude/mine.db` पर रहता है।

```
/mine                     आज के sessions, cost, top tools
/mine search "websocket"  सभी conversations में full-text search
/mine mistakes            error patterns जो Claude बार-बार repeat करता है
/mine hotspots            sessions के बीच most-edited files
/mine loops               sessions के बीच repeated patterns
```

`mine` और `safety-guard` hook से शुरुआत करें। जरूरत के अनुसार बाकी जोड़ते रहें। **[mine docs &rarr;](./plugins/mine/)**

---

## cc plugin

cross-session messaging। देखें कि दूसरे claude code sessions क्या कर रहे हैं, उनके बीच संदेश भेजें।

```bash
/plugin install cc@cc
```

```
/cc                          active sessions दिखाएं
/cc send merizo "pause"      दूसरे session को message भेजें
```

---

## 3 चीजें जिन्होंने मेरे coding का तरीका बदला

### hooks

Hooks का फर्क "claude वो करता है जो मैं चाहता हूं" और "claude जो भी कर दे" के बीच होता है। CLAUDE.md guidance देता है। Hooks enforcement देते हैं। एक suggestion होता है, दूसरा एक दीवार है।

इस repo में 9 hooks हैं जिन्हें आप किसी भी project में डाल सकते हैं। safety-guard force pushes, `rm -rf /`, और `curl | bash` को ब्लॉक करता है। no-squash squash merges को ब्लॉक करता है। context-save compaction से पहले state save करता है। वे hooks चुनें जो आपके workflow के लिए फिट हों। [hook guide &rarr;](./docs/hooks.md)

### agent teams

कई Claude instances एक ही समय पर एक ही codebase पर काम करते हैं, हर एक अपने git worktree में। coordinator tasks assign करता है, परिणाम collect करता है, सबसे अच्छे approach को merge करता है।

मैं इसे parallel research, risky changes को safely try करने, और अपने working tree को छुए बिना approaches को side-by-side compare करने के लिए use करता हूं। [मैं agent teams कैसे use करता हूं &rarr;](./docs/agents.md)

### prompt caching

यही है कि $200/माह का plan AI coding में सबसे अच्छा deal क्यों है। Claude Code आपके system prompt, tools, और CLAUDE.md को एक prefix के रूप में cache करता है। मेरे 91% input tokens cache को hit करते हैं, मतलब मैं अपने 91% reads पर input cost का 10% pay करता हूं।

कुंजी: अपना CLAUDE.md छोटा और stable रखें। हर edit prefix cache को तोड़ देता है। मेरा 30 lines का है और शायद एक हफ्ते में एक बार बदलता है। [पूरा cost breakdown &rarr;](./docs/cost.md)

---

## टिप्स

छोटी, standalone techniques। हर एक कुछ ऐसा है जो आप अपने अगले session में use कर सकते हैं।

| tip | आप क्या सीखते हैं |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | 97%+ cache hit rates प्राप्त करें, अपना bill कम करें |
| [safety hooks](./docs/tips/safety-hooks.md) | 5 मिनट में force pushes और rm -rf को ब्लॉक करें |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | project vs global vs local settings |
| [session length](./docs/tips/session-length.md) | क्यों छोटे sessions अधिक efficient हैं (data के साथ) |
| [ultrathink](./docs/tips/ultrathink.md) | complex problems के लिए extended thinking force करें |
| [context management](./docs/tips/context-management.md) | compaction strategies, active tool rate, sessions को tight रखना |
| [plan mode](./docs/tips/plan-mode.md) | कब planning समय बचाता है बनाम कब waste करता है |
| [fast mode](./docs/tips/fast-mode.md) | same model, तेजी से output, trade-off |
| [plugins](./docs/tips/plugins.md) | scratch से plugin बनाएं, कौन सा install करने लायक है |
| [subagents](./docs/tips/subagents.md) | agent teams, worktree isolation, कब parallel return देता है |
| [mcp integration](./docs/tips/mcp-integration.md) | MCP servers को wire करें, sessions के अंदर उपयोग करें |
| [hooks v2](./docs/tips/hooks-v2.md) | command vs http vs prompt hooks, async pattern |

---

## hooks

एक को कॉपी करें, wire करें, हो गया। हर एक standalone bash script है। [पूरी guide &rarr;](./docs/hooks.md)

| hook | event | यह क्या करता है |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | force push, `rm -rf /`, DROP TABLE, curl-pipe-sh को ब्लॉक करता है |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | squash merges को ब्लॉक करता है |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | हर tool call को sqlite में log करता है |
| [context-save](./hooks/context-save.sh) | PreCompact | compression से पहले context save करता है |
| [notify](./hooks/notify.sh) | Notification | macOS, Slack, ntfy में route करता है |

<details>
<summary>4 और hooks</summary>

| hook | event | यह क्या करता है |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | N edits के बाद commit करने की याद दिलाता है |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | auto-updates "tested with" stamps |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | gone tracking branches के बारे में warning देता है |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | save पर markdown lint को auto-fix करता है |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## उदाहरण agents

`.claude/agents/` में कॉपी करें और `/agent <name>` से invoke करें। हर एक एक अलग pattern सिखाता है। [guide &rarr;](./docs/agents.md)

| agent | pattern | यह क्या करता है |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | files को watch करता है, tests चलाता है, fixes propose करता है |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | isolated worktrees में risky changes try करता है |
| [arch-review](./examples/agents/arch-review.md) | quick review | तेजी से architecture smell-test |
| [write-pr](./examples/agents/write-pr.md) | git integration | आपके diff से PR descriptions |

## कमांड जो मैं use करता हूं

| कमांड | यह क्या करता है |
|---|---|
| `/mine` | usage data · costs, sessions, search, patterns |
| `/ship` | एक कमांड में stage, commit, push, open PR |
| `/improve` | git history से CLAUDE.md updates propose करता है |

साथ ही [2 उदाहरण कमांड](./examples/commands/) जिन्हें आप कॉपी कर सकते हैं: `/sweep`, `/quicktest`।

---

## मेरे निजी विचार

| | क्या |
|---|---|
| [cost reality](./docs/cost.md) | claude code की असल cost, prompt caching math |
| [mistakes मैंने की](./docs/mistakes.md) | क्या मुझे जला, ताकि आप इसे skip कर सकें |
| [automation](./docs/automation.md) | 12 CI pipelines जो इस repo को maintain करती हैं |
| [session workflow](./docs/session-workflow.md) | मैं day-to-day कैसे claude code के साथ काम करता हूं |
| [worktrees](./docs/worktrees.md) | desktop app के साथ parallel exploration |

## विकल्पों की तुलना में

diplomatic, data-driven, कोई FUD नहीं। हर claim एक source cite करता है।

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [pricing](./docs/comparisons/pricing.md)

---

## उदाहरण

- [CLAUDE.md templates](./examples/claude-md/) · TypeScript, Python, Rust, Next.js के लिए starter configs
- [example agents](./examples/agents/) · 4 agents, हर एक एक अलग pattern सिखाता है
- [example commands](./examples/commands/) · 2 कमांड जिन्हें आप किसी भी project में कॉपी कर सकते हैं
- [handoff plugin](./examples/plugins/handoff/) · PreCompact context preservation
- [broadcast plugin](./examples/plugins/broadcast/) · git events पर async notifications

---

## यह repo कैसे काम करता है

यह repo अपने ही patterns पर चलता है।

- **12 CI workflows** · docs audit, competitive intel, community digest, freshness check, stale cleanup, dependabot, releases, plugin smoke test, PR quality gate, validation, claude responder, upstream watcher
- **11 hooks** हर session पर चलते हैं
- **<$1/माह** CI cost · AI-powered workflows haiku use करते हैं
- **0 manual maintenance** · सब कुछ जिसमें taste की जरूरत नहीं है automated है

[automation details &rarr;](./docs/automation.md)

---

## tools जो मैंने इन patterns से बनाए

ये सभी claude code में हर दिन रहने से आए। हर एक एक specific problem solve करता है जो मुझे बार-बार आता था।

- **[mine](./plugins/mine/)** · session mining to sqlite। costs, search, error memory, pattern detection
- **[claudemon](https://github.com/anipotts/claudemon)** · real-time session monitoring projects और machines के बीच
- **[cc](./plugins/cc/)** · multi-session awareness। देखें कि दूसरे sessions क्या कर रहे हैं, उनके बीच messages भेजें
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · MCP server iMessage history के लिए read-only। 26 tools, zero network requests

## मुझसे और

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · long-form
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · newsletter
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · short-form

---

MIT &middot; built by [anipotts](https://anipotts.com)

<!-- translated from README.md @ 77e88e7 -->
