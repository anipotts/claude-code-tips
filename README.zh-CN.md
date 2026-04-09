> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

我的 Claude Code 配置，完全开源。hooks、agents、实用技巧，还有一个能挖掘你使用数据的插件。

如果这个仓库帮到了你，[给个 star](https://github.com/anipotts/claude-code-tips) 吧。能帮更多人发现它。

## 快速开始

```bash
claude plugin add anipotts/mine   # install the mine plugin
```

然后：把 [safety-guard.sh](./hooks/safety-guard.sh) 复制过去，拦截危险命令。读一篇 [tip](./docs/tips/)。搞定。

---

## 数据说话

数百个会话，横跨几十个项目。$200/月的 Max 计划。

同样的用量在 API 上大概要花 ~$12K（有缓存），没缓存的话 ~$95K。没有自动循环，没有定时任务。每个会话都是我手动输入 prompt 开始的。[费用计算详解 &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## 安装 mine 插件

```bash
claude plugin add anipotts/mine
```

你会得到 **[mine](https://github.com/anipotts/mine)** · 会话数据挖掘到 sqlite。费用、搜索、错误记忆、模式检测。所有数据都留在本地 `~/.claude/mine.db`。

```
/mine                     今日会话、费用、常用工具
/mine search "websocket"  全文搜索所有对话
/mine mistakes            claude 反复犯的错误模式
/mine hotspots            跨会话编辑最多的文件
/mine loops               跨会话的重复模式
```

先装 `mine` 和 `safety-guard` hook，后面按需加。**[mine 文档 &rarr;](https://github.com/anipotts/mine)**

---

## 改变我编码方式的 3 件事

### hooks

hooks 决定了"claude 按我的意思来"和"claude 想干啥干啥"的区别。CLAUDE.md 给的是建议，hooks 给的是强制执行。一个是提示，一个是铁墙。

这个仓库有 9 个 hooks，可以直接丢进任何项目。safety-guard 拦截 force push、`rm -rf /` 和 `curl | bash`。no-squash 阻止 squash merge。context-save 在压缩前保存上下文状态。挑适合你工作流的用就行。[hook 指南 &rarr;](./docs/hooks.md)

### agent 团队

多个 Claude 实例在同一个代码库上同时工作，每个在自己的 git worktree 里。协调者分配任务、收集结果、合并最优方案。

我用这个来并行调研、安全地试高风险改动、以及不碰工作目录的情况下对比不同方案。[我怎么用 agent 团队 &rarr;](./docs/agents.md)

### prompt 缓存

这就是为什么 $200/月的计划是 AI 编程里最划算的。Claude Code 把你的 system prompt、工具和 CLAUDE.md 作为前缀缓存。我 91% 的 input tokens 命中缓存，意味着 91% 的读取只付 10% 的 input 费用。

关键：保持 CLAUDE.md 简短且稳定。每次修改都会打破前缀缓存。我的 CLAUDE.md 只有 30 行，大概一周改一次。[完整费用拆解 &rarr;](./docs/cost.md)

---

## 实用技巧

短小独立的技巧。每一条都能在你下一个会话里直接用上。

| 技巧 | 你能学到什么 |
|-----|---------------|
| [prompt 缓存](./docs/tips/prompt-caching.md) | 达到 97%+ 的缓存命中率，大幅降低费用 |
| [安全 hooks](./docs/tips/safety-hooks.md) | 5 分钟内拦截 force push 和 rm -rf |
| [配置层级](./docs/tips/settings-hierarchy.md) | 项目级 vs 全局 vs 本地配置 |
| [会话时长](./docs/tips/session-length.md) | 为什么短会话更高效（附数据） |
| [ultrathink](./docs/tips/ultrathink.md) | 对复杂问题强制开启深度思考 |
| [上下文管理](./docs/tips/context-management.md) | 压缩策略、活跃工具频率、保持会话精简 |
| [plan 模式](./docs/tips/plan-mode.md) | 什么时候规划能省时间，什么时候是浪费 |
| [fast 模式](./docs/tips/fast-mode.md) | 同样的模型，更快的输出，代价是什么 |
| [插件](./docs/tips/plugins.md) | 从零构建插件，什么样的插件值得装 |
| [subagents](./docs/tips/subagents.md) | agent 团队、worktree 隔离、什么时候并行有用 |
| [MCP 集成](./docs/tips/mcp-integration.md) | 接入 MCP 服务器，在会话中使用 |
| [hooks v2](./docs/tips/hooks-v2.md) | command vs http vs prompt hooks，异步模式 |

---

## hooks

复制一个，配置好，搞定。每个都是独立的 bash 脚本。[完整指南 &rarr;](./docs/hooks.md)

| hook | 事件 | 功能 |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | 拦截 force push、`rm -rf /`、DROP TABLE、curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | 阻止 squash merge |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | 把每次工具调用记录到 sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | 压缩前保存上下文 |
| [notify](./hooks/notify.sh) | Notification | 推送到 macOS、Slack、ntfy |

<details>
<summary>还有 4 个 hooks</summary>

| hook | 事件 | 功能 |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | 编辑 N 次后提醒你 commit |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | 自动更新 "tested with" 标记 |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | 提醒已失效的远程追踪分支 |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | 保存时自动修复 markdown lint 问题 |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## 示例 agents

复制到 `.claude/agents/`，用 `/agent <name>` 调用。每个展示不同的模式。[指南 &rarr;](./docs/agents.md)

| agent | 模式 | 功能 |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | 守护进程 | 监控文件、运行测试、提出修复 |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | 在隔离的 worktree 中尝试高风险改动 |
| [arch-review](./examples/agents/arch-review.md) | 快速审查 | 快速架构问题嗅探 |
| [write-pr](./examples/agents/write-pr.md) | git 集成 | 从你的 diff 生成 PR 描述 |

## 我常用的命令

| 命令 | 功能 |
|---|---|
| `/mine` | 使用数据 · 费用、会话、搜索、模式 |
| `/ship` | 暂存、提交、推送、开 PR 一气呵成 |
| `/improve` | 从 git 历史中建议 CLAUDE.md 更新 |

另外还有 [2 个示例命令](./examples/commands/) 可以直接复制：`/sweep`、`/quicktest`。

---

## 我的个人观点

| | 内容 |
|---|---|
| [费用真相](./docs/cost.md) | Claude Code 到底花多少钱，prompt 缓存的数学原理 |
| [我踩过的坑](./docs/mistakes.md) | 我踩过的雷，帮你跳过 |
| [自动化](./docs/automation.md) | 维护这个仓库的 12 条 CI 流水线 |
| [会话工作流](./docs/session-workflow.md) | 我日常怎么用 Claude Code 干活 |
| [worktrees](./docs/worktrees.md) | 用桌面端进行并行探索 |

## 对比其他方案

态度中立，数据驱动，不搞 FUD。每个结论都有出处。

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [定价对比](./docs/comparisons/pricing.md)

---

## 示例

- [CLAUDE.md 模板](./examples/claude-md/) · TypeScript、Python、Rust、Next.js 的初始配置
- [示例 agents](./examples/agents/) · 4 个 agent，每个展示不同模式
- [示例命令](./examples/commands/) · 2 个可以复制到任何项目的命令
- [handoff 插件](./examples/plugins/handoff/) · PreCompact 上下文保存
- [broadcast 插件](./examples/plugins/broadcast/) · git 事件的异步通知

---

## 这个仓库怎么运转的

这个仓库自己吃自己的狗粮。

- **12 条 CI 流水线** · 文档审计、竞品情报、社区摘要、新鲜度检查、过期清理、dependabot、发版、插件冒烟测试、PR 质量门禁、验证、claude 自动回复、上游监控
- **11 个 hooks** 每个会话都在跑
- **<$1/月** CI 成本 · AI 驱动的工作流用的是 haiku
- **零人工维护** · 不需要审美判断的东西全部自动化

[自动化详情 &rarr;](./docs/automation.md)

---

## 我从这些模式中造出的工具

这些都是天天泡在 Claude Code 里的产物。每个都解决了我反复碰到的具体问题。

- **[mine](https://github.com/anipotts/mine)** · 会话数据挖掘到 sqlite。费用、搜索、错误记忆、模式检测
- **[claudemon](https://github.com/anipotts/claudemon)** · 跨项目、跨机器的实时会话监控
- **[cc](https://github.com/anipotts/cc)** · 多会话感知。看其他会话在干什么，会话间发消息
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · iMessage 历史的只读 MCP 服务器。26 个工具，零网络请求

## 更多内容

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · 长文
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · 电子报
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · 短内容

---

MIT &middot; 由 [anipotts](https://anipotts.com) 构建
