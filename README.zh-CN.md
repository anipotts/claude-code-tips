> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

我的 Claude Code 设置，开源分享。hooks、agents、提示，还有一个能挖掘你使用数据的 plugin。

如果这个项目节省了你的时间，[请给我个星](https://github.com/anipotts/claude-code-tips)。这能帮助更多人发现它。

## 快速开始

```bash
/plugin marketplace add anipotts/claude-code-tips   # 添加 marketplace（一次性）
/plugin install mine@anipotts                       # 安装 mine plugin
```

然后：复制 [safety-guard.sh](./hooks/safety-guard.sh) 来阻止危险命令。读一篇[提示](./docs/tips/)。完成。

---

## 数据说话

数十个项目，数百场对话。最高套餐 $200/月。

同样的用量在 API 上花费约 $12K（有 prompt caching），约 $95K（没有）。没有自主循环。没有定时任务。每次会话都从我输入提示开始。[成本计算逻辑 &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine 统计显示会话、token、成本和项目" />

---

## 安装 mine plugin

```bash
/plugin marketplace add anipotts/claude-code-tips   # 添加 marketplace（一次性）
/plugin install mine@anipotts                       # 安装 mine
```

你将获得 **[mine](https://github.com/anipotts/mine)** · 会话数据挖掘到 sqlite。成本、搜索、错误记忆、模式检测。所有数据都保存在本地 `~/.claude/mine.db`。

```
/mine                     今天的会话、成本、热门工具
/mine search "websocket"  在所有对话中全文搜索
/mine mistakes            Claude 反复出现的错误模式
/mine hotspots            跨会话编辑最频繁的文件
/mine loops               跨会话的重复模式
```

先从 `mine` 和 `safety-guard` hook 开始。然后根据需要添加更多。**[mine 文档 &rarr;](https://github.com/anipotts/mine)**

---

## 改变我编码方式的 3 件事

### hooks

hooks 是"Claude 做我想要的事"和"Claude 做任何它想做的事"之间的区别。CLAUDE.md 提供指导。hooks 提供强制执行。一个是建议，另一个是墙。

这个项目有 9 个 hook，你可以放到任何项目中。safety-guard 阻止强制推送、`rm -rf /` 和 `curl | bash`。no-squash 阻止 squash 合并。context-save 在压缩前保留状态。选择适合你工作流的。[hook 指南 &rarr;](./docs/hooks.md)

### agent 团队

多个 Claude 实例同时在同一代码库上工作，每个都在自己的 git worktree 中。协调器分配任务，收集结果，合并最佳方案。

我用这个做并行研究、安全地尝试风险变更，以及不触及我工作树就能并排比较方案。[我如何使用 agent 团队 &rarr;](./docs/agents.md)

### prompt caching

这就是为什么 $200/月套餐是 AI 编码中最划算的。Claude Code 将你的系统提示、工具和 CLAUDE.md 作为前缀缓存。我 91% 的输入 token 命中缓存，意味着在 91% 的读取上我只支付 10% 的输入成本。

关键：保持你的 CLAUDE.md 简短且稳定。每次编辑都会破坏前缀缓存。我的是 30 行，大概一周改一次。[完整的成本分解 &rarr;](./docs/cost.md)

---

## 提示

简短、独立的技巧。每一个都是你在下一场会话中能用上的东西。

| 提示 | 你会学到 |
|-----|---------|
| [prompt caching](./docs/tips/prompt-caching.md) | 获得 97%+ 缓存命中率，降低账单 |
| [safety hooks](./docs/tips/safety-hooks.md) | 在 5 分钟内阻止强制推送和 rm -rf |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | 项目设置 vs 全局设置 vs 本地设置 |
| [session length](./docs/tips/session-length.md) | 为什么更短的会话更高效（附数据） |
| [ultrathink](./docs/tips/ultrathink.md) | 强制扩展思考处理复杂问题 |
| [context management](./docs/tips/context-management.md) | 压缩策略、活跃工具率、保持会话紧凑 |
| [plan mode](./docs/tips/plan-mode.md) | 什么时候规划能省时间，什么时候浪费时间 |
| [fast mode](./docs/tips/fast-mode.md) | 同样的模型，更快的输出，权衡是什么 |
| [plugins](./docs/tips/plugins.md) | 从零开始构建一个 plugin，什么才值得安装 |
| [subagents](./docs/tips/subagents.md) | agent 团队、worktree 隔离、什么时候并行值得 |
| [mcp integration](./docs/tips/mcp-integration.md) | 连接 MCP 服务器，在会话中使用它们 |
| [hooks v2](./docs/tips/hooks-v2.md) | command vs http vs prompt hooks、异步模式 |

---

## hooks

复制一个，连接好，完成。每个都是独立的 bash 脚本。[完整指南 &rarr;](./docs/hooks.md)

| hook | 事件 | 作用 |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | 阻止强制推送、`rm -rf /`、DROP TABLE、curl-pipe-sh |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | 阻止 squash 合并 |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | 把每次工具调用记录到 sqlite |
| [context-save](./hooks/context-save.sh) | PreCompact | 压缩前保存上下文 |
| [notify](./hooks/notify.sh) | Notification | 路由到 macOS、Slack、ntfy |

<details>
<summary>4 个更多的 hooks</summary>

| hook | 事件 | 作用 |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | N 次编辑后提醒你提交 |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | 自动更新"tested with"标签 |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | 警告关于已删除的跟踪分支 |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | 保存时自动修复 markdown lint |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard 阻止危险命令" />

## 示例 agents

复制到 `.claude/agents/` 并用 `/agent <name>` 调用。每个教授不同的模式。[指南 &rarr;](./docs/agents.md)

| agent | 模式 | 作用 |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | 监视文件、运行测试、提出修复 |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | 在隔离的 worktree 中尝试风险变更 |
| [arch-review](./examples/agents/arch-review.md) | quick review | 快速架构问题测试 |
| [write-pr](./examples/agents/write-pr.md) | git integration | 从你的 diff 生成 PR 描述 |

## 我使用的命令

| 命令 | 作用 |
|---|---|
| `/mine` | 使用数据 · 成本、会话、搜索、模式 |
| `/ship` | 一次性暂存、提交、推送、打开 PR |
| `/improve` | 从 git 历史提议 CLAUDE.md 更新 |

加上[2 个示例命令](./examples/commands/)你可以复制：`/sweep`、`/quicktest`。

---

## 我的个人看法

| | 什么 |
|---|---|
| [成本现实](./docs/cost.md) | Claude Code 的实际成本、prompt caching 数学 |
| [我犯的错误](./docs/mistakes.md) | 什么让我踩了坑，所以你可以跳过 |
| [自动化](./docs/automation.md) | 维护这个项目的 12 个 CI 管道 |
| [会话工作流](./docs/session-workflow.md) | 我每天如何与 Claude Code 一起工作 |
| [worktrees](./docs/worktrees.md) | 用桌面应用的并行探索 |

## vs 其他选项

外交、数据驱动、没有 FUD。每个声明都引用来源。

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [定价](./docs/comparisons/pricing.md)

---

## 示例

- [CLAUDE.md 模板](./examples/claude-md/) · TypeScript、Python、Rust、Next.js 的初始配置
- [示例 agents](./examples/agents/) · 4 个 agent，每个教授不同的模式
- [示例命令](./examples/commands/) · 2 个你可以复制到任何项目的命令
- [handoff plugin](./examples/plugins/handoff/) · PreCompact 上下文保留
- [broadcast plugin](./examples/plugins/broadcast/) · git 事件上的异步通知

---

## 这个项目如何工作

这个项目运行在自己的模式上。

- **12 个 CI 工作流** · 文档审计、竞争情报、社区摘要、新鲜度检查、陈旧清理、dependabot、发布、plugin 烟雾测试、PR 质量把关、验证、claude 响应器、上游观察者
- **11 个 hooks** 在每个会话上运行
- **<$1/月** CI 成本 · AI 驱动的工作流使用 haiku
- **0 手动维护** · 所有不需要品味的东西都自动化了

[自动化详情 &rarr;](./docs/automation.md)

---

## 我从这些模式构建的工具

这些都来自于每天都活在 Claude Code 中。每一个都解决了我不断碰到的特定问题。

- **[mine](https://github.com/anipotts/mine)** · 会话数据挖掘到 sqlite。成本、搜索、错误记忆、模式检测
- **[claudemon](https://github.com/anipotts/claudemon)** · 跨项目和机器的实时会话监控
- **[cc](https://github.com/anipotts/cc)** · 多会话意识。看到其他会话在做什么，在它们之间发送消息
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · 用于只读 iMessage 历史的 MCP 服务器。26 个工具，零网络请求

## 更多来自我

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · 长篇幅
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · 通讯
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · 短篇幅

---

MIT &middot; 由 [anipotts](https://anipotts.com) 构建

<!-- translated from README.md @ 25b25ac -->
