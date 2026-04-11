> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

मेरा claude code setup, खुला स्रोत। hooks, agents, सुझाव, और एक plugin जो आपके उपयोग डेटा को माइन करता है।

अगर इससे आपका समय बचता है, तो [इसे स्टार करें](https://github.com/anipotts/claude-code-tips)। इससे दूसरों को इसे खोजने में मदद मिलती है।

## शुरुआत करें

```bash
/plugin marketplace add anipotts/claude-code-tips   # marketplace जोड़ें (एक बार)
/plugin install mine@anipotts                       # mine plugin इंस्टॉल करें
```

फिर: [safety-guard.sh](./hooks/safety-guard.sh) को कॉपी करें ताकि खतरनाक कमांड्स को ब्लॉक किया जा सके। एक [सुझाव](./docs/tips/) पढ़ें। बस।

---

## संख्याएं

दर्जनों प्रोजेक्ट्स में सैकड़ों सेशन्स। $200/महीना अधिकतम प्लान।

वही उपयोग API पर कैशिंग के साथ ~$12K खर्च करेगा, बिना कैशिंग के ~$95K। कोई autonomous loops नहीं। कोई cron jobs नहीं। हर सेशन मेरे प्रॉम्प्ट टाइप करने से शुरू होता है। [लागत गणित कैसे काम करता है &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## mine plugin इंस्टॉल करें

```bash
/plugin marketplace add anipotts/claude-code-tips   # marketplace जोड़ें (एक बार)
/plugin install mine@anipotts                       # mine इंस्टॉल करें
```

आप **[mine](https://github.com/anipotts/mine)** पाते हैं · session mining को sqlite में। लागतें, खोज, त्रुटि स्मृति, पैटर्न डिटेक्शन। सभी डेटा स्थानीय रहता है `~/.claude/mine.db` पर।

```
/mine                     आज के सेशन्स, लागत, शीर्ष tools
/mine search "websocket"  सभी बातचीत में पूर्ण-पाठ खोज
/mine mistakes            त्रुटि पैटर्न जो claude दोहराता रहता है
/mine hotspots            सेशन्स में सबसे अधिक संपादित फाइलें
/mine loops               सेशन्स में दोहराए गए पैटर्न
```

`mine` + `safety-guard` hook से शुरू करें। जैसे आप आगे बढ़ें, अधिक जोड़ें। **[mine डॉक्स &rarr;](https://github.com/anipotts/mine)**

---

## 3 चीजें जो मेरे कोडिंग तरीके को बदल गईं

### hooks

hooks "claude वह करता है जो मैं चाहता हूं" और "claude जो भी वह चाहे करता है" के बीच का अंतर हैं। CLAUDE.md मार्गदर्शन देता है। hooks कार्यान्वयन देते हैं। एक सुझाव है, दूसरा एक दीवार है।

इस repo में 9 hooks हैं जिन्हें आप किसी भी प्रोजेक्ट में ड्रॉप कर सकते हैं। safety-guard force pushes, `rm -rf /`, और `curl | bash` को ब्लॉक करता है। no-squash squash merges को ब्लॉक करता है। context-save संपीड़न से पहले स्थिति को संरक्षित करता है। जो भी आपके workflow से मेल खाएं चुनें। [hook गाइड &rarr;](./docs/hooks.md)

### agent teams

एक ही codebase पर एक साथ काम करने वाले कई claude इंस्टेंस, प्रत्येक अपने git worktree में। समन्वयक कार्य असाइन करता है, परिणाम एकत्र करता है, सर्वोत्तम दृष्टिकोण को मर्ज करता है।

मैं इसे समानांतर शोध, जोखिम भरे परिवर्तनों को सुरक्षित रूप से आजमाने, और अपने working tree को छुए बिना side-by-side दृष्टिकोण की तुलना करने के लिए उपयोग करता हूं। [मैं agent teams का उपयोग कैसे करता हूं &rarr;](./docs/agents.md)

### prompt caching

यह कारण है कि $200/महीने का प्लान AI कोडिंग में सबसे अच्छा डील है। claude code आपके system prompt, tools, और CLAUDE.md को prefix के रूप में कैश करता है। मेरे 91% input tokens कैश में आते हैं, जिसका अर्थ है कि मैं अपने 91% reads पर input cost का 10% भुगतान करता हूं।

कुंजी: अपना CLAUDE.md संक्षिप्त और स्थिर रखें। हर संपादन prefix cache को तोड़ता है। मेरा 30 लाइनें है और शायद हफ्ते में एक बार बदलता है। [पूरी लागत breakdown &rarr;](./docs/cost.md)

---

## सुझाव

छोटे, स्वतंत्र तकनीकें। प्रत्येक कुछ ऐसा है जिसे आप अपने अगले सेशन में उपयोग कर सकते हैं।

| सुझाव | आप क्या सीखते हैं |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | 97%+ कैश हिट दरें प्राप्त करें, अपना बिल कम करें |
| [safety hooks](./docs/tips/safety-hooks.md) | 5 मिनट में force pushes और rm -rf को ब्लॉक करें |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | प्रोजेक्ट बनाम global बनाम local सेटिंग्स |
| [session length](./docs/tips/session-length.md) | क्यों छोटे सेशन अधिक कुशल होते हैं (डेटा के साथ) |
| [ultrathink](./docs/tips/ultrathink.md) | जटिल समस्याओं के लिए extended thinking को लागू करें |
| [context management](./docs/tips/context-management.md) | संपीड़न रणनीति, active tool rate, सेशन्स को तंग रखना |
| [plan mode](./docs/tips/plan-mode.md) | कब planning समय बचाता है बनाम कब यह बर्बाद करता है |
| [fast mode](./docs/tips/fast-mode.md) | same model, तेजी से output, trade-off |
| [plugins](./docs/tips/plugins.md) | scratch से plugin बनाएं, कौन सा एक इंस्टॉल करने लायक है |
| [subagents](./docs/tips/subagents.md) | agent teams, worktree अलगाव, कब समानांतर लाभदायक है |
| [mcp integration](./docs/tips/mcp-integration.md) | MCP servers को wire करें, उन्हें सेशन्स में उपयोग करें |
| [hooks v2](./docs/tips/hooks-v2.md) | command बनाम http बनाम prompt hooks, async पैटर्न |

---

## hooks

एक कॉपी करें, इसे wire करें, बस। प्रत्येक एक स्वतंत्र bash script है। [पूरी गाइड &rarr;](./docs/hooks.md)

| hook | event | यह क्या करता है |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | force push, `rm -rf /`, DROP TABLE, curl-pipe-sh को ब्लॉक करता है |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | squash merges को ब्लॉक करता है |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | हर tool call को sqlite में लॉग करता है |
| [context-save](./hooks/context-save.sh) | PreCompact | संपीड़न से पहले context को सहेजता है |
| [notify](./hooks/notify.sh) | Notification | macOS, Slack, ntfy में route करता है |

<details>
<summary>4 और hooks</summary>

| hook | event | यह क्या करता है |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | N edits के बाद आपको commit करने की याद दिलाता है |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | "tested with" stamps को auto-update करता है |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | gone tracking branches के बारे में चेतावनी देता है |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | save पर markdown lint को auto-fix करता है |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## उदाहरण agents

`.claude/agents/` में कॉपी करें और `/agent <name>` से invoke करें। प्रत्येक एक अलग पैटर्न सिखाता है। [गाइड &rarr;](./docs/agents.md)

| agent | पैटर्न | यह क्या करता है |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | फाइलों को देखता है, tests चलाता है, fixes प्रस्तावित करता है |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | isolated worktrees में जोखिम भरे परिवर्तनों को आजमाता है |
| [arch-review](./examples/agents/arch-review.md) | quick review | तेजी से architecture smell-test |
| [write-pr](./examples/agents/write-pr.md) | git integration | आपके diff से PR विवरण |

## commands जो मैं उपयोग करता हूं

| command | यह क्या करता है |
|---|---|
| `/mine` | उपयोग डेटा · लागतें, सेशन्स, खोज, पैटर्न |
| `/ship` | एक command में stage, commit, push, PR खोलें |
| `/improve` | git history से CLAUDE.md updates प्रस्तावित करें |

साथ ही [2 example commands](./examples/commands/) जिन्हें आप कॉपी कर सकते हैं: `/sweep`, `/quicktest`।

---

## मेरे व्यक्तिगत विचार

| | क्या |
|---|---|
| [लागत वास्तविकता](./docs/cost.md) | claude code वास्तव में क्या खर्च करता है, prompt caching गणित |
| [गलतियां जो मैंने की](./docs/mistakes.md) | क्या मुझे जलाया ताकि आप इसे छोड़ सकें |
| [स्वचालन](./docs/automation.md) | 12 CI pipelines जो इस repo को बनाए रखते हैं |
| [session workflow](./docs/session-workflow.md) | मैं claude code के साथ दिन-प्रतिदिन कैसे काम करता हूं |
| [worktrees](./docs/worktrees.md) | desktop app के साथ समानांतर अन्वेषण |

## बनाम विकल्प

राजनयिक, डेटा-संचालित, कोई FUD नहीं। हर दावा एक स्रोत का हवाला देता है।

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [मूल्य निर्धारण](./docs/comparisons/pricing.md)

---

## उदाहरण

- [CLAUDE.md टेम्प्लेट](./examples/claude-md/) · TypeScript, Python, Rust, Next.js के लिए शुरुआती कॉन्फ़िगरेशन
- [उदाहरण agents](./examples/agents/) · 4 agents, प्रत्येक एक अलग पैटर्न सिखाता है
- [उदाहरण commands](./examples/commands/) · 2 commands जिन्हें आप किसी भी प्रोजेक्ट में कॉपी कर सकते हैं
- [handoff plugin](./examples/plugins/handoff/) · PreCompact context संरक्षण
- [broadcast plugin](./examples/plugins/broadcast/) · git events पर async notifications

---

## यह repo कैसे काम करता है

यह repo अपने स्वयं के पैटर्न पर चलता है।

- **12 CI workflows** · docs audit, competitive intel, community digest, freshness check, stale cleanup, dependabot, releases, plugin smoke test, PR quality gate, validation, claude responder, upstream watcher
- **11 hooks** हर सेशन पर चलते हैं
- **<$1/महीना** CI लागत · AI-powered workflows haiku का उपयोग करते हैं
- **0 manual maintenance** · सब कुछ जिसे स्वाद की आवश्यकता नहीं है स्वचालित है

[स्वचालन विवरण &rarr;](./docs/automation.md)

---

## tools जो मैंने इन पैटर्न से बनाए

ये सभी हर दिन claude code में रहने से निकले। प्रत्येक एक विशिष्ट समस्या को हल करता है जिससे मैं बार-बार टकराया।

- **[mine](https://github.com/anipotts/mine)** · session mining को sqlite में। लागतें, खोज, त्रुटि स्मृति, पैटर्न डिटेक्शन
- **[claudemon](https://github.com/anipotts/claudemon)** · प्रोजेक्ट्स और मशीन्स में real-time session monitoring
- **[cc](https://github.com/anipotts/cc)** · multi-session awareness। देखें कि अन्य सेशन्स क्या कर रहे हैं, उनके बीच संदेश भेजें
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · iMessage history के लिए MCP server read-only। 26 tools, zero network requests

## मुझसे अधिक

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · long-form
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · न्यूजलेटर
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · short-form

---

MIT &middot; [anipotts](https://anipotts.com) द्वारा निर्मित

<!-- translated from README.md @ 25b25ac -->
