---
title: claude code
description: a practical map of claude code across terminal, desktop, editor, web, and remote workflows.
products: [claude-code]
updatedAt: "2026-08-29T19:04:00-04:00"
checkedAt: "2026-08-28T00:00:00-04:00"
status: pending
evidence: [official-source, open-question]
sources: [anthropic-claude-overview, anthropic-how-claude-code-works, anthropic-platforms, anthropic-features-overview, anthropic-memory, anthropic-settings, anthropic-skills, anthropic-mcp, anthropic-subagents, anthropic-hooks, anthropic-plugins, anthropic-desktop, anthropic-web, anthropic-remote-control, anthropic-cowork]
redirects: []
voice: personal
navigation:
  scope: claude-code
  order: 10
---

## this is claude code

[Claude Code](https://code.claude.com/docs/en/overview) is Anthropic’s software engineering agent. it runs in the terminal,
[desktop app](https://code.claude.com/docs/en/desktop), [supported editors](https://code.claude.com/docs/en/platforms), [web](https://code.claude.com/docs/en/claude-code-on-the-web), and [Remote Control](https://code.claude.com/docs/en/remote-control) surfaces while keeping
[repository instructions](https://code.claude.com/docs/en/memory) and [tool configuration](https://code.claude.com/docs/en/settings) close to the code.

Claude Code is where I started building my habits around coding agents. I have
used Codex more recently, while Claude Code still gives me the clearest example
of how much an agent can become part of a repository. its value comes from the
loop around the model: instructions, tools, permissions, memory, and the way a
session can keep investigating after the first answer.

### one engineering loop, several interfaces

Anthropic describes the core as an [agentic loop](https://code.claude.com/docs/en/how-claude-code-works) that gathers context, takes an
action, and checks the result. that same loop can appear in a terminal, an IDE,
the desktop app, a web session, or a remotely controlled local session.

I use that as the stable mental model. each interface changes the review
experience:

- terminal makes commands and working directory state immediate
- IDE keeps selections, diagnostics, and neighboring code in view
- desktop makes parallel sessions and visual review easier to coordinate
- web gives long running work an isolated cloud environment
- Remote Control lets another device steer a session that stays on my machine

the interface is part of the workflow, while the actual unit of work remains a
repository change, an investigation, or a verified engineering decision.

### the repository gives the task its shape

<!-- Ani voice pass: add the dated repository first observation here. -->

## where claude code lives

<div class="surface-bento">
  <figure><a href="https://code.claude.com/docs/en/overview"><img src="/media/publications/claude-code-1200.webp" srcset="/media/publications/claude-code-640.webp 640w, /media/publications/claude-code-1200.webp 1200w" sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 72rem) calc((100vw - 20rem) / 2), 32rem" alt="Claude Code working in its coding interface" loading="eager" fetchpriority="high" decoding="async" width="1200" height="728" /><figcaption>code and repository work</figcaption></a></figure>
  <figure><a href="https://code.claude.com/docs/en/desktop"><img src="/media/publications/claude-cowork-1200.webp" srcset="/media/publications/claude-cowork-640.webp 640w, /media/publications/claude-cowork-1200.webp 1200w" sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 72rem) calc((100vw - 20rem) / 2), 32rem" alt="the Claude Cowork task interface" loading="lazy" decoding="async" width="1200" height="842" /><figcaption>desktop tasks and visual review</figcaption></a></figure>
  <figure><a href="https://code.claude.com/docs/en/remote-control"><img src="/media/publications/claude-chat-1200.webp" srcset="/media/publications/claude-chat-640.webp 640w, /media/publications/claude-chat-1200.webp 1200w" sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 72rem) calc((100vw - 20rem) / 2), 32rem" alt="Claude available through a remote conversation surface" loading="lazy" decoding="async" width="1200" height="728" /><figcaption>web and remote control</figcaption></a></figure>
</div>

as of august 22, 2026, Claude Code documents terminal, desktop, IDE, web, and
remote workflows plus skills, hooks, subagents, plugins, MCP, memory, and scoped
permissions. this guide treats those as current official capabilities. a paired
hands on field run remains open.

### terminal and IDE keep the evidence close

the terminal is where Claude Code feels closest to the repository. I can see the
current directory, interrupt a direction, inspect a command, and compare its
summary with the actual diff. it works especially well when the task has a
specific pass condition and the repository already explains how to verify it.

the IDE is useful when the task begins with visual context: a selected function,
a diagnostic, a group of open files, or a review comment. I still want the
session to finish with commands and a diff that can stand on their own. the
editor helps me point; the repository evidence helps me decide.

### desktop coordinates parallel work

the [desktop app](https://code.claude.com/docs/en/desktop) brings sessions,
worktrees, a terminal, file review, previews, and visual diffs into one place.
that makes it a strong surface for several related tasks that each have a clear
boundary. it also makes it tempting to create more sessions than I can review.

I want each session to answer a small set of questions before it starts:

- what exact outcome does this session own
- which checkout or worktree can it change
- what evidence marks the task complete
- where should a conflict or approval return to me

parallelism is valuable when the answers stay visible. the review queue is the
real limit, because every additional session can produce another diff, another
assumption, and another decision.

### web, mobile, and Remote Control change where you steer

[Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
runs work in an isolated cloud environment that can continue after I leave the
page. [Remote Control](https://code.claude.com/docs/en/remote-control) keeps the
session running locally and turns the browser or phone into another window onto
it. one moves execution to the cloud; the other moves the steering surface.

that distinction matters whenever a task depends on local tools, credentials,
uncommitted state, or a machine specific environment. I decide where execution
should live first, then choose how I want to monitor it. the environment
decision comes before the convenience of a phone or browser.

## the interface is not the whole system

I separate the interaction interface from the interaction layer. terminal,
IDE, desktop, web, and Remote Control are interfaces for steering and review.
`CLAUDE.md`, rules, settings, memory, skills, hooks, MCP, subagents, and
permissions form layers that shape what the agent sees and how it acts. the
interface decides how I participate in the session. the interaction layers
decide how the session behaves.

### the interface changes what you can see

<!-- Ani voice pass: compare the review experience without repeating surface mechanics. -->

### the interaction layer changes how claude code behaves

Claude Code becomes much more useful when the important context can survive one
conversation. `CLAUDE.md`, scoped rules, settings, skills, hooks, MCP servers,
subagents, and memory all shape future behavior. they also compete for attention
and create maintenance work.

I treat context as a budget. permanent instructions should explain facts that
matter across many tasks. a skill should carry a repeatable procedure. a
subagent should receive a bounded problem and its own context. a hook should
enforce an event that needs deterministic behavior. MCP should connect a real
external system. this keeps the main session readable and gives every extension
a reason to exist.

Claude Code exposes several ways to make future work more capable. the names
sound adjacent, while their jobs are meaningfully different. Anthropic
separates persistent [project context](https://code.claude.com/docs/en/memory), reusable [skills](https://code.claude.com/docs/en/skills), external [MCP services](https://code.claude.com/docs/en/mcp), isolated
[subagents](https://code.claude.com/docs/en/sub-agents), lifecycle [hooks](https://code.claude.com/docs/en/hooks), and distributable [plugins](https://code.claude.com/docs/en/plugins).

my practical version is simpler:

- write a rule when the repository needs to remember something
- write a skill when the agent needs to know how to perform something
- use a hook when an event should always trigger deterministic code
- use MCP when the work needs a system outside the repository
- use a subagent when a problem deserves its own context and owner
- package a plugin when several of those pieces should travel together

the interesting part is how these choices compose. a short `CLAUDE.md` can route
the agent to a skill. that skill can use MCP. a hook can verify what changed. a
subagent can investigate one branch of the problem without filling the main
conversation. every layer can help, and every layer also needs a clear owner,
scope, and reason to remain.

## controlling claude code across devices

### steering is different from hosting

<!-- Ani voice pass: distinguish the control surface from the execution host. -->

### web and Remote Control use different execution models

<!-- Ani voice pass: deepen the current web and Remote Control distinction. -->

### mobile keeps the control loop close

<!-- Ani voice pass: record the current mobile capabilities and limitations. -->

## start with what you are trying to finish

Claude Code is the engineering surface. [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) handles broader tasks and
deliverables through cloud or desktop execution. Claude’s other domain
experiences should be evaluated by the artifact they produce and the systems
they can safely reach, rather than folded into coding guidance.

### code should end in the repository

I use Claude Code when the work should resolve into repository evidence: a
diff, a command result, a diagnosis tied to source, or a reviewable engineering
decision. Cowork fits broader computer work and finished deliverables. the
surface choice becomes clearer when I name what I expect to review at the end.

### Cowork begins with a finished deliverable

<!-- Ani voice pass: develop the finished knowledge work boundary here. -->

that review should include the remaining uncertainty. Claude Code can make a
large amount of progress while carrying one wrong assumption about the branch,
environment, or intended behavior. a useful final message shows the artifact,
the verification, the choices it made, and the decision it still needs from me.

I assume you know how to open Claude Code and ask it to work. these chapters
focus on the choices that become important after the first successful session.
getting started builds one complete repository loop. configuration separates
settings, instructions, rules, and memory. workflows cover parallel sessions,
background work, handoffs, and remote steering. extensions go deeper on the
composition above. safety covers permissions, identity, secrets, and final
authority. recommendations are where I explain what I personally keep, switch,
and avoid.

continue with [configuration](/guides/claude-code/configuration/) or
[recommendations](/guides/claude-code/recommendations/).
