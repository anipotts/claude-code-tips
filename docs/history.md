---
title: how coding agents got here
description: a personal history of the models, agent loops, benchmarks, interfaces, and products behind today’s coding agents.
products: [cross runtime]
updatedAt: "2026-08-29T19:04:00-04:00"
status: current
evidence: [official-source, analysis]
sources: [transformer-paper, openai-gpt3, openai-codex-paper, github-copilot-preview, react-paper, aider-docs, cursor-2023-problems, swe-bench-paper, github-copilot-workspace, swe-agent-paper, anthropic-mcp-launch, github-copilot-agent-mode, anthropic-claude-code-preview, openai-codex-launch, openai-codex-app, cursor-3]
redirects: []
tableOfContents: false
voice: personal
navigation:
  scope: general
  order: 35
---

this is the line of development i use to understand the tools i am working with
now. it is selective because a complete history would bury the useful thread:
models learned to follow instructions, work with code, call tools, operate inside
repositories, and return changes for review.

i entered this story after many of these ideas had already become products.
writing the timeline gives the newest interface its proper place in a longer
story.

<ol class="history-timeline">
  <li>
    <p class="history-year"><time datetime="2017">2017</time></p>
    <h2>the transformer creates the foundation</h2>
    <p><cite>Attention Is All You Need</cite> <a href="https://arxiv.org/abs/1706.03762">introduced the Transformer</a>, an attention based architecture designed for parallel training. later large language models built on that architecture.</p>
    <p>every coding agent in this guide depends on a model that can carry instructions, code, and tool results through a sequence.</p>
    <figure><img src="https://ar5iv.labs.arxiv.org/html/1706.03762/assets/x1.png" alt="the Transformer model architecture from Attention Is All You Need" loading="lazy" width="1290" height="1638" /><figcaption>the Transformer architecture in the original paper</figcaption></figure>
  </li>
  <li>
    <p class="history-year"><time datetime="2020">2020</time></p>
    <h2>prompts become a general interface</h2>
    <p>GPT-3 <a href="https://arxiv.org/abs/2005.14165">showed</a> that one scaled language model could perform new tasks from instructions or a small number of examples, using one model across tasks.</p>
    <p>programming a model through language started to look like a general interface. reliable action loops came later.</p>
  </li>
  <li>
    <p class="history-year"><time datetime="2021">2021</time></p>
    <h2>code generation reaches the editor</h2>
    <p>OpenAI <a href="https://arxiv.org/abs/2107.03374">published Codex</a>, a GPT model trained on public code, while GitHub <a href="https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/">introduced Copilot</a> as an editor product powered by it. the Codex paper also introduced HumanEval as a way to measure code generation from docstrings.</p>
    <p>generation moved from a research result into the place many developers already worked.</p>
  </li>
  <li>
    <p class="history-year"><time datetime="2022">2022</time></p>
    <h2>the model gets an action loop</h2>
    <p>ReAct <a href="https://arxiv.org/abs/2210.03629">described</a> an interleaved loop of reasoning and actions against external systems.</p>
    <p>the core pattern now appears across agent systems: inspect state, decide what to do, use a tool, read the result, and continue.</p>
    <figure><img src="https://ar5iv.labs.arxiv.org/html/2210.03629/assets/x1.png" alt="a diagram from the ReAct paper showing reasoning and action" loading="lazy" width="1800" height="1000" /><figcaption>reasoning and action joined in one loop</figcaption></figure>
  </li>
  <li>
    <p class="history-year"><time datetime="2023">2023</time></p>
    <h2>the terminal and editor become agent surfaces</h2>
    <p>aider <a href="https://aider.chat/docs/">brought repository editing</a>, diffs, git commits, and undo into a terminal workflow. Cursor <a href="https://www.cursor.com/blog/problems-2023">was building</a> around codebase context, inline edits, and constrained agents inside its editor.</p>
    <p>these tools made the surrounding interface part of the value. context selection, change review, and recovery became product decisions.</p>
  </li>
  <li>
    <p class="history-year"><time datetime="2023">2023</time></p>
    <h2>the benchmark becomes a real repository</h2>
    <p>SWE-bench <a href="https://arxiv.org/abs/2310.06770">collected</a> 2,294 real GitHub issues and their pull requests from twelve Python repositories. the original best reported result resolved 1.96 percent of the issues.</p>
    <p>the low result gave the field a harder target. repository work required long context, execution environments, and coordinated edits across files.</p>
    <figure><img src="https://ar5iv.labs.arxiv.org/html/2310.06770/assets/x1.png" alt="the SWE bench task collection process" loading="lazy" width="1800" height="1000" /><figcaption>real repository issues become a benchmark</figcaption></figure>
  </li>
  <li>
    <p class="history-year"><time datetime="2024-04-29">april 2024</time></p>
    <h2>the task becomes the unit of work</h2>
    <p>GitHub <a href="https://github.blog/news-insights/product-news/github-copilot-workspace/">previewed Copilot Workspace</a> as a task based environment that could move from an issue or prompt through planning, implementation, testing, and execution.</p>
    <p>the interface moved above individual completions and toward a reviewable sequence of agent work.</p>
  </li>
  <li>
    <p class="history-year"><time datetime="2024-05">may 2024</time></p>
    <h2>the harness becomes its own engineering problem</h2>
    <p>SWE-agent <a href="https://arxiv.org/abs/2405.15793">showed</a> that the interface between a model and a computer materially affects results. its custom interface let the agent navigate repositories, edit files, and run tests.</p>
    <p>this made the harness legible as its own engineering layer alongside model capability.</p>
    <figure><img src="https://ar5iv.labs.arxiv.org/html/2405.15793/assets/x1.png" alt="the SWE agent computer interface design" loading="lazy" width="1800" height="1000" /><figcaption>the agent computer interface becomes an explicit design choice</figcaption></figure>
  </li>
  <li>
    <p class="history-year"><time datetime="2024-11-25">november 2024</time></p>
    <h2>tools get a shared protocol</h2>
    <p>Anthropic <a href="https://www.anthropic.com/news/model-context-protocol">released the Model Context Protocol</a> as an open standard for connecting assistants to tools and data sources. the launch included a specification, software development kits, local server support, and an open repository of servers.</p>
    <p>agent capability started depending more visibly on the connections around the model.</p>
  </li>
  <li>
    <p class="history-year"><time datetime="2025">2025</time></p>
    <h2>coding agents become products</h2>
    <p>GitHub <a href="https://github.blog/news-insights/product-news/github-copilot-the-agent-awakens/">introduced agent mode</a> for Copilot in VS Code in February. Anthropic <a href="https://www.anthropic.com/news/claude-3-7-sonnet">launched Claude Code</a> as a terminal research preview later that month. OpenAI <a href="https://openai.com/index/introducing-codex/">launched Codex</a> as a cloud software engineering agent in May.</p>
    <p>the product decision now included execution location, permissions, context, and review surface.</p>
  </li>
  <li>
    <p class="history-year"><time datetime="2026-02-02">february 2026</time></p>
    <h2>supervision gets a dedicated surface</h2>
    <p>OpenAI <a href="https://openai.com/index/introducing-the-codex-app/">launched the Codex app</a> for supervising agents across projects, threads, and isolated worktrees. Cursor later <a href="https://cursor.com/blog/cursor-3">introduced a workspace</a> centered on parallel local and cloud agents, review, and handoffs.</p>
    <p>this is where my current practice sits: defining scope, providing context, setting permissions, and reviewing changes across parallel work.</p>
    <figure><a href="https://openai.com/index/introducing-the-codex-app/"><img src="https://images.ctfassets.net/kftzwdyauwt9/7eyalGUXstkzzzJ3Pb008m/9f71260a3f127dc142cc8c479d0cf68f/Installer4.png?fm=webp&q=90&w=1600" alt="the Codex app supervising agent work" loading="lazy" width="1600" height="900" /></a><figcaption>supervision becomes a dedicated product surface</figcaption></figure>
  </li>
</ol>

## what i take from the timeline

today’s coding agents are the result of model scaling, code focused training,
action loops, repository benchmarks, tool protocols, and product surfaces
arriving in sequence.

the model matters. the harness, environment, permissions, and review loop decide
whether capability becomes useful work. i keep testing that boundary because it
already affects my projects, and because the next jump will land unevenly across
jobs and industries. knowing where agents help today is the practical way to
prepare.
