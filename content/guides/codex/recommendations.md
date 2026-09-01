---
title: recommendations
description: simple codex defaults for different levels of technical familiarity and workflow intensity.
products: [codex]
updatedAt: "2026-08-22T19:55:02-04:00"
checkedAt: "2026-08-28T00:00:00-04:00"
status: current
completion: excerpt
evidence: [tested, official-source, analysis]
sources: [openai-codex-product, openai-codex-manual, openai-codex-cli, openai-codex-ide, openai-chatgpt-desktop-app, openai-codex-agents-md, openai-codex-mobile, openai-codex-app, openai-work-and-codex, git-worktrees]
redirects: []
voice: personal
navigation:
  scope: codex
  order: 70
---

## my default codex setup

<dl class="editorial-rows recommendation-rows">
  <div>
    <dt>you are learning and want to see every command</dt>
    <dd><span class="row-label">begin here</span>one repository in the <a href="https://learn.chatgpt.com/docs/app">desktop app</a> with approvals on</dd>
  </div>
  <div>
    <dt>you already live in a terminal</dt>
    <dd><span class="row-label">begin here</span><a href="https://learn.chatgpt.com/docs/codex/cli">Codex CLI</a> plus <a href="https://learn.chatgpt.com/docs/agent-configuration/agents-md"><code>AGENTS.md</code></a> and one clear verification command</dd>
  </div>
  <div>
    <dt>you review through an editor</dt>
    <dd><span class="row-label">begin here</span>the <a href="https://learn.chatgpt.com/docs/codex/ide">IDE extension</a>, with the terminal available for deeper checks</dd>
  </div>
  <div>
    <dt>you coordinate several projects or machines</dt>
    <dd><span class="row-label">begin here</span>the desktop app, isolated worktrees, and <a href="https://openai.com/index/work-with-codex-from-anywhere/">mobile steering</a></dd>
  </div>
</dl>

## when i switch surfaces

### the review surface follows the evidence

use [ChatGPT Work](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) when the output is primarily a report, spreadsheet,
presentation, or research artifact. use [Codex](https://openai.com/codex/) when the source of truth is a
repository and the result must survive tests, review, and version control.

## what i would avoid

### parallelism that outruns review

for consequential work, start with one outcome and one pass condition. add
parallel agents after the repository has deterministic checks and clear file
ownership.
