> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub 星标](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![最后提交](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![测试工具](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

我的 Claude Code 设置，开源。hooks、agents、技巧，以及一个挖掘你的使用数据的插件。

如果这节省了你的时间，[给它加星](https://github.com/anipotts/claude-code-tips)。这能帮助其他人找到它。

## 快速开始

```bash
/plugin marketplace add anipotts/claude-code-tips   # 添加商城（仅一次）
/plugin install mine@cc                             # 安装 mine（会话分析）
/plugin install cc@cc                               # 安装 cc（跨会话消息传递）
```

然后：复制 [safety-guard.sh](./hooks/safety-guard.sh) 来阻止危险命令。读一个[技巧](./docs/tips/)。完成。

---

## 数据

数十个项目中的数百个会话。$200/月的最高计划。

同样的使用量在 API 上用缓存要花约 $12K，不用缓存约 $95K。没有自主循环。没有 cron 任务。每个会话都由我输入提示开始。[成本计算如何运作 &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## 安装 mine 插件

```bash
/plugin marketplace add anipotts/claude-code-tips   # 添加商城（仅一次）
/plugin install mine@cc                             # 安装 mine（会话分析）
/plugin install cc@cc                               # 安装 cc（跨会话消息传递）
```

你会得到 **[mine](./plugins/mine/)** · 会话挖掘到 sqlite。成本、搜索、错误记忆、模式检测。所有数据保留在本地 `~/.claude/mine.db`。

```
/mine                     今日会话、成本、热门工具
/mine search "websocket"  全文搜索所有对话
/mine mistakes            Claude 不断重复的错误模式
/mine hotspots            跨会话最常编辑的文件
/mine loops               跨会话的重复模式
```

从 `mine` 和 `safety-guard` hook 开始。根据需要添加更多。**[mine 文档 &rarr;](./plugins/mine/)**

---

## cc 插件

跨会话消息传递。查看其他 Claude Code 会话正在做什么，在它们之间发送消息。

```bash
/plugin install cc@cc
```

```
/cc                          显示活跃会话
/cc send merizo "pause"      给另一个会话发送消息
```

---

## 改变我编码方式的 3 件事

### hooks

hooks 是"Claude 做我想要的"和"Claude 做它喜欢的"之间的区别。CLAUDE.md 给出指导。hooks 给出执行。一个是建议，另一个是墙。

这个仓库有 9 个 hooks 你可以放入任何项目。safety-guard 阻止强制推送、`rm -rf /` 和 `curl | bash`。no-squash 阻止 squash 合并。context-save 在压缩前保留状态。选择适合你工作流的。[hook 指南 &rarr;](./docs/hooks.md)

### agent 团队

多个 Claude 实例同时在同一代码库上工作，每个在自己的 git worktree 中。协调员分配任务，收集结果，合并最佳方案。

我用这个进行并行研究、安全地尝试风险变更，以及并排比较方法而不触及我的工作树。[我如何使用 agent 团队 &rarr;](./docs/agents.md)

### prompt caching

这是为什么 $200/月计划是 AI 编码中最好的交易。Claude Code 将你的系统提示、工具和 CLAUDE.md 缓存为前缀。我 91% 的输入令牌命中缓存，意味着在 91% 的读取中我只支付 10% 的输入成本。

关键：保持 CLAUDE.md 简短且稳定。每次编辑都会破坏前缀缓存。我的是 30 行，大约一周改一次。[完整的成本分析 &rarr;](./docs/cost.md)

---

## 技巧

短小、独立的技术。每一个都是你在下一次会话中可以使用的东西。

| 技巧 | 你学到的 |
|-----|--------|
| [prompt caching](./docs/tips/prompt-caching.md) | 获得 97%+ 缓存命中率，降低账单 |
| [安全 hooks](./docs/tips/safety-hooks.md) | 5 分钟内阻止强制推送和 rm -rf |
| [设置层次结构](./docs/tips/settings-hierarchy.md) | 项目级 vs 全局 vs 本地设置 |
| [会话长度](./docs/tips/session-length.md) | 为什么更短的会话更高效（有数据） |
| [ultrathink](./docs/tips/ultrathink.md) | 为复杂问题强制扩展思考 |
| [上下文管理](./docs/tips/context-management.md) | 压缩策略、活跃工具率、保持会话紧凑 |
| [计划模式](./docs/tips/plan-mode.md) | 何时计划节省时间 vs 何时浪费时间 |
| [快速模式](./docs/tips/fast-mode.md) | 相同的模型、更快的输出、权衡 |
| [插件](./docs/tips/plugins.md) | 从头构建插件，什么让一个值得安装 |
| [subagents](./docs/tips/subagents.md) | agent 团队、worktree 隔离、何时并行有收益 |
| [MCP 集成](./docs/tips/mcp-integration.md) | 接入 MCP 服务器，在会话中使用它们 |
| [hooks v2](./docs/tips/hooks-v2.md) | 命令 vs http vs 提示 hooks、异步模式 |

---

## hooks

复制一个，接入它，完成。每一个都是独立的 bash 脚本。[完整指南 &rarr;](./docs/hooks.md)

| hook | 事件 | 它做什么 |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | 阻止强制推送、`rm -rf /`、DROP TABLE、curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | 阻止 squash 合并 |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | 将每个工具调用记录到 sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | 在压缩前保存上下文 |
| [notify](./hooks/notify.sh) | Notification | 路由到 macOS、Slack、ntfy |

<details>
<summary>4 个更多的 hooks</summary>

| hook | 事件 | 它做什么 |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | 在 N 次编辑后提醒你提交 |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | 自动更新"测试工具"时间戳 |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | 警告消失的跟踪分支 |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | 保存时自动修复 markdown lint |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## 示例 agents

复制到 `.claude/agents/` 并用 `/agent <name>` 调用。每一个教授不同的模式。[指南 &rarr;](./docs/agents.md)

| agent | 模式 | 它做什么 |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | 守护进程 | 监视文件、运行测试、提出修复 |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | 在隔离的 worktrees 中尝试风险变更 |
| [arch-review](./examples/agents/arch-review.md) | 快速审查 | 快速架构异味测试 |
| [write-pr](./examples/agents/write-pr.md) | git 集成 | 从你的差异生成 PR 描述 |

## 我使用的命令

| 命令 | 它做什么 |
|---|---|
| `/mine` | 使用数据 · 成本、会话、搜索、模式 |
| `/ship` | 在一个命令中暂存、提交、推送、打开 PR |
| `/improve` | 从 git 历史提议 CLAUDE.md 更新 |

加上 [2 个示例命令](./examples/commands/)，你可以复制：`/sweep`、`/quicktest`。

---

## 我的个人观点

| | 什么 |
|---|---|
| [成本现实](./docs/cost.md) | Claude Code 的实际成本，prompt caching 数学 |
| [我犯的错误](./docs/mistakes.md) | 什么让我吃亏，所以你可以跳过它 |
| [自动化](./docs/automation.md) | 维护这个仓库的 12 个 CI 管道 |
| [会话工作流](./docs/session-workflow.md) | 我如何每天与 Claude Code 一起工作 |
| [worktrees](./docs/worktrees.md) | 使用桌面应用进行并行探索 |

## vs 替代品

外交性的、数据驱动的、没有虚假宣传。每个声明都引用来源。

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [定价](./docs/comparisons/pricing.md)

---

## 示例

- [CLAUDE.md 模板](./examples/claude-md/) · TypeScript、Python、Rust、Next.js 的初始配置
- [示例 agents](./examples/agents/) · 4 个 agents，每个教授不同的模式
- [示例命令](./examples/commands/) · 2 个命令你可以复制到任何项目
- [handoff 插件](./examples/plugins/handoff/) · PreCompact 上下文保留
- [broadcast 插件](./examples/plugins/broadcast/) · git 事件上的异步通知

---

## 这个仓库如何工作

这个仓库运行在自己的模式上。

- **12 个 CI 工作流** · 文档审计、竞争情报、社区摘要、新鲜度检查、陈旧清理、dependabot、发布、插件冒烟测试、PR 质量门、验证、Claude 响应者、上游监视
- **11 个 hooks** 在每个会话上运行
- **<$1/月** CI 成本 · AI 动力工作流使用 haiku
- **0 手动维护** · 一切不需要品味的东西都是自动化的

[自动化详情 &rarr;](./docs/automation.md)

---

## 我从这些模式构建的工具

这些都来自每天生活在 Claude Code 中。每一个解决一个我不断遇到的特定问题。

- **[mine](./plugins/mine/)** · 会话挖掘到 sqlite。成本、搜索、错误记忆、模式检测
- **[claudemon](https://github.com/anipotts/claudemon)** · 跨项目和机器的实时会话监控
- **[cc](./plugins/cc/)** · 多会话感知。查看其他会话正在做什么，在它们之间发送消息
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · iMessage 历史的只读 MCP 服务器。26 个工具，零网络请求

## 更多来自我

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · 长篇
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · 新闻通讯
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · 短篇

---

MIT &middot; 由 [anipotts](https://anipotts.com) 构建

<!-- translated from README.md @ 77e88e7 -->
