> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

मेरा Claude Code setup, open source। hooks, agents, tips, और एक plugin जो आपके usage data को mine करता है।

अगर इससे आपका time बचता है, तो [star कर दो](https://github.com/anipotts/claude-code-tips)। इससे दूसरों को भी ये मिल पाता है।

## शुरू कैसे करें

```bash
claude plugin install anipotts/mine   # mine plugin install करो
```

फिर: [safety-guard.sh](./hooks/safety-guard.sh) copy करो ताकि dangerous commands block हो जाएं। एक [tip](./docs/tips/) पढ़ो। बस।

---

## आंकड़े

दर्जनों projects में सैकड़ों sessions। $200/mo max plan।

same usage API पर ~$12K पड़ता caching के साथ, ~$95K बिना caching के। कोई autonomous loops नहीं। कोई cron jobs नहीं। हर session मेरे prompt type करने से शुरू होता है। [cost math कैसे काम करता है &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## mine plugin install करें

```bash
claude plugin install anipotts/mine
```

आपको मिलता है **[mine](https://github.com/anipotts/mine)** · sqlite में session mining। costs, search, error memory, pattern detection। सारा data local रहता है `~/.claude/mine.db` में।

```
/mine                     आज के sessions, cost, top tools
/mine search "websocket"  सभी conversations में full-text search
/mine mistakes            error patterns जो claude बार-बार दोहराता है
/mine hotspots            sessions में सबसे ज़्यादा edit की गई files
/mine loops               sessions में repeated patterns
```

`mine` + `safety-guard` hook से शुरू करो। बाकी ज़रूरत के हिसाब से add करो। **[mine docs &rarr;](https://github.com/anipotts/mine)**

---

## 3 चीज़ें जिन्होंने मेरा coding तरीका बदल दिया

### hooks

hooks वो फ़र्क हैं "claude वही करता है जो मैं चाहता हूं" और "claude जो मन करे वो करता है" के बीच। CLAUDE.md guidance देता है। hooks enforcement देते हैं। एक suggestion है, दूसरा दीवार।

इस repo में 9 hooks हैं जो किसी भी project में drop-in कर सकते हो। safety-guard force pushes, `rm -rf /`, और `curl | bash` block करता है। no-squash squash merges block करता है। context-save compaction से पहले state preserve करता है। अपने workflow के हिसाब से चुनो। [hook guide &rarr;](./docs/hooks.md)

### agent teams

एक ही codebase पर multiple claude instances एक साथ काम करते हैं, हर एक अपने git worktree में। coordinator tasks assign करता है, results collect करता है, best approach merge करता है।

मैं इसे parallel research, risky changes safely try करने, और approaches को side-by-side compare करने के लिए use करता हूं बिना working tree को छुए। [मैं agent teams कैसे use करता हूं &rarr;](./docs/agents.md)

### prompt caching

इसीलिए $200/mo plan AI coding में सबसे बढ़िया deal है। Claude Code आपके system prompt, tools, और CLAUDE.md को prefix के तौर पर cache करता है। मेरे 91% input tokens cache hit करते हैं, मतलब 91% reads पर मैं input cost का सिर्फ 10% pay करता हूं।

key बात: अपना CLAUDE.md छोटा और stable रखो। हर edit prefix cache तोड़ देता है। मेरा 30 lines का है और हफ़्ते में शायद एक बार बदलता है। [पूरा cost breakdown &rarr;](./docs/cost.md)

---

## tips

छोटी, standalone techniques। हर एक ऐसी चीज़ है जो आप अपने अगले session में use कर सकते हो।

| tip | आप क्या सीखोगे |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | 97%+ cache hit rates पाओ, bill घटाओ |
| [safety hooks](./docs/tips/safety-hooks.md) | 5 minutes में force pushes और rm -rf block करो |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | project vs global vs local settings |
| [session length](./docs/tips/session-length.md) | छोटे sessions ज़्यादा efficient क्यों हैं (data के साथ) |
| [ultrathink](./docs/tips/ultrathink.md) | complex problems के लिए extended thinking force करो |
| [context management](./docs/tips/context-management.md) | compaction strategies, active tool rate, sessions tight रखना |
| [plan mode](./docs/tips/plan-mode.md) | कब planning time बचाती है vs कब waste करती है |
| [fast mode](./docs/tips/fast-mode.md) | same model, faster output, tradeoff क्या है |
| [plugins](./docs/tips/plugins.md) | scratch से plugin बनाओ, कौन सा install करने लायक है |
| [subagents](./docs/tips/subagents.md) | agent teams, worktree isolation, कब parallel फ़ायदेमंद है |
| [mcp integration](./docs/tips/mcp-integration.md) | MCP servers connect करो, sessions में use करो |
| [hooks v2](./docs/tips/hooks-v2.md) | command vs http vs prompt hooks, async pattern |

---

## hooks

एक copy करो, wire up करो, बस। हर एक standalone bash script है। [पूरी guide &rarr;](./docs/hooks.md)

| hook | event | क्या करता है |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | force push, `rm -rf /`, DROP TABLE, curl-pipe-sh block करता है |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | squash merges block करता है |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | हर tool call sqlite में log करता है |
| [context-save](./hooks/context-save.sh) | PreCompact | compression से पहले context save करता है |
| [notify](./hooks/notify.sh) | Notification | macOS, Slack, ntfy पर route करता है |

<details>
<summary>4 और hooks</summary>

| hook | event | क्या करता है |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | N edits के बाद commit करने की याद दिलाता है |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | "tested with" stamps auto-update करता है |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | gone tracking branches की warning देता है |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | save पर markdown lint auto-fix करता है |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## example agents

`.claude/agents/` में copy करो और `/agent <name>` से invoke करो। हर एक अलग pattern सिखाता है। [guide &rarr;](./docs/agents.md)

| agent | pattern | क्या करता है |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | files watch करता है, tests run करता है, fixes suggest करता है |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | isolated worktrees में risky changes try करता है |
| [arch-review](./examples/agents/arch-review.md) | quick review | तेज़ architecture smell-test |
| [write-pr](./examples/agents/write-pr.md) | git integration | आपके diff से PR descriptions बनाता है |

## commands जो मैं use करता हूं

| command | क्या करता है |
|---|---|
| `/mine` | usage data · costs, sessions, search, patterns |
| `/ship` | stage, commit, push, एक command में PR open करो |
| `/improve` | git history से CLAUDE.md updates suggest करो |

plus [2 example commands](./examples/commands/) जो copy कर सकते हो: `/sweep`, `/quicktest`।

---

## मेरी राय

| | क्या है |
|---|---|
| [cost reality](./docs/cost.md) | Claude Code असल में कितना cost करता है, prompt caching math |
| [mistakes i made](./docs/mistakes.md) | मुझे क्या-क्या झेलना पड़ा ताकि आपको न पड़े |
| [automation](./docs/automation.md) | 12 CI pipelines जो इस repo को maintain करती हैं |
| [session workflow](./docs/session-workflow.md) | रोज़ाना Claude Code के साथ मैं कैसे काम करता हूं |
| [worktrees](./docs/worktrees.md) | desktop app के साथ parallel exploration |

## alternatives से comparison

diplomatic, data-driven, कोई FUD नहीं। हर claim के पीछे source है।

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [pricing](./docs/comparisons/pricing.md)

---

## examples

- [CLAUDE.md templates](./examples/claude-md/) · TypeScript, Python, Rust, Next.js के लिए starter configs
- [example agents](./examples/agents/) · 4 agents, हर एक अलग pattern सिखाता है
- [example commands](./examples/commands/) · 2 commands जो किसी भी project में copy कर सकते हो
- [handoff plugin](./examples/plugins/handoff/) · PreCompact context preservation
- [broadcast plugin](./examples/plugins/broadcast/) · git events पर async notifications

---

## ये repo कैसे काम करती है

ये repo अपने ही patterns पर चलती है।

- **12 CI workflows** · docs audit, competitive intel, community digest, freshness check, stale cleanup, dependabot, releases, plugin smoke test, PR quality gate, validation, claude responder, upstream watcher
- **11 hooks** हर session पर चलते हैं
- **<$1/month** CI cost · AI-powered workflows haiku use करती हैं
- **0 manual maintenance** · जो चीज़ taste नहीं मांगती, वो automated है

[automation details &rarr;](./docs/automation.md)

---

## इन patterns से बने मेरे tools

ये सब रोज़ाना Claude Code में रहने से निकले हैं। हर एक एक specific problem solve करता है जो बार-बार आती थी।

- **[mine](https://github.com/anipotts/mine)** · sqlite में session mining। costs, search, error memory, pattern detection
- **[claudemon](https://github.com/anipotts/claudemon)** · projects और machines पर real-time session monitoring
- **[cc](https://github.com/anipotts/cc)** · multi-session awareness। देखो दूसरे sessions क्या कर रहे हैं, उनके बीच messages भेजो
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · read-only iMessage history के लिए MCP server। 26 tools, zero network requests

## और मेरा content

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · long-form
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · newsletter
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · short-form

---

MIT &middot; [anipotts](https://anipotts.com) द्वारा बनाया गया
