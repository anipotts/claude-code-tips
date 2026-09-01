---
title: codex
description: a practical map of the codex terminal, app, editor, cloud, and mobile surfaces.
products: [codex]
updatedAt: "2026-08-30T14:33:21-04:00"
checkedAt: "2026-08-30T14:33:21-04:00"
status: current
completion: complete
evidence: [tested, official-source, analysis]
sources: [openai-chatgpt-overview, openai-codex-product, openai-codex-manual, openai-codex-cli, openai-codex-ide, openai-chatgpt-desktop-app, openai-codex-app, openai-codex-cloud, openai-codex-mobile, openai-remote-connections, openai-codex-agents-md, openai-codex-skills, openai-codex-plugins, openai-codex-hooks, openai-codex-mcp, openai-codex-subagents, openai-work-and-codex]
redirects: []
voice: personal
navigation:
  scope: codex
  order: 10
---

## this is codex

<div class="surface-bento intro-visual">
  <figure><img src="/media/guides/codex-handbook-workspace.png" alt="Codex beside a coding agent tips task and its GitHub pull request with passing checks" loading="eager" fetchpriority="high" decoding="async" width="3600" height="2260" /><figcaption>a screenshot of me working on some personal projects and some content for a brand deal.</figcaption></figure>
</div>

codex is [OpenAI’s agent](https://learn.chatgpt.com/docs) for [software development](https://openai.com/codex/) and [technical work](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex). the same
account reaches a [terminal interface](https://learn.chatgpt.com/docs/codex/cli), [editor extension](https://learn.chatgpt.com/docs/codex/ide), [desktop app](https://learn.chatgpt.com/docs/app), [cloud
tasks](https://learn.chatgpt.com/docs/cloud), and [mobile review](https://openai.com/index/work-with-codex-from-anywhere/). each surface changes how you steer and inspect the
work more than it changes the underlying job.

Codex is the coding agent I have been using most recently, so I tend to notice
its surfaces before I notice its feature list. I can begin in a terminal, move
the same kind of work into the desktop app, send a task to the cloud, and check
it from my phone. that range is useful once every surface has a clear job. it
gets confusing when every surface becomes another place where work might be
running.

### one engineering loop, several control rooms

I think of Codex as one engineering loop with several control rooms. it reads
the repository, takes actions through tools, shows evidence, and waits for a
decision. the interface changes how much of that loop I can see at once and how
directly I can intervene.

the control loop around the first prompt matters most. before I let a task
expand, I want four things to stay obvious:

- which repository and worktree it can reach
- which instructions and permissions are active
- which command proves the requested change works
- which final action still belongs to me

that is the practical difference between asking for code and running an agent.
Codex can keep going through files, commands, browsers, and reviews. the work
becomes dependable when the environment gives that motion a visible boundary.

### the task can be its own workspace

Codex does not always need a repository before it can become useful. I can
begin with a file, a question, a browser, or a piece of visual context and let
the task become a temporary workspace around the problem. that is useful for
triage, comparison, and the work that decides which repository should change.

I still name the durable destination as soon as the task becomes code. a
projectless conversation can hold the investigation, while the implementation
should settle into a repository, a checkout, and a verification command that
another person can inspect.

## where codex lives

as of august 22, 2026, the Codex documentation describes [skills](https://learn.chatgpt.com/docs/build-skills), [plugins](https://learn.chatgpt.com/docs/build-plugins), [hooks](https://learn.chatgpt.com/docs/hooks), [MCP](https://learn.chatgpt.com/docs/extend/mcp), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents),
memory, worktrees, browser and computer use, scheduled tasks, and remote access
across its supported surfaces. the useful question is which controls belong in
your daily loop.

<dl class="editorial-rows">
  <div>
    <dt>terminal</dt>
    <dd><span class="row-label">best when</span>commands and output are the main evidence</dd>
    <dd><span class="row-label">watch for</span>parallel sessions need manual coordination</dd>
  </div>
  <div>
    <dt>desktop app</dt>
    <dd><span class="row-label">best when</span>several tasks, previews, browsers, or worktrees need one review surface</dd>
    <dd><span class="row-label">watch for</span>more state lives outside the editor</dd>
  </div>
  <div>
    <dt>editor</dt>
    <dd><span class="row-label">best when</span>selection context, diagnostics, and inline review dominate</dd>
    <dd><span class="row-label">watch for</span>the editor becomes the session shell</dd>
  </div>
  <div>
    <dt>cloud or mobile</dt>
    <dd><span class="row-label">best when</span>work should continue away from your primary machine</dd>
    <dd><span class="row-label">watch for</span>environment parity and remote state need review</dd>
  </div>
</dl>

### terminal and editor keep the evidence close

the [Codex CLI](https://learn.chatgpt.com/docs/codex/cli) is my clearest surface
for a focused repository pass. commands, failures, diffs, and the current
directory are all close enough to inspect without changing context. I prefer it
when the pass condition is already concrete: fix this test, explain this module,
trace this regression, or prepare this exact patch.

the editor earns its place when the important context already lives in a
selection, a diagnostic, or a set of neighboring files. I still want the
terminal commands in the final receipt. inline context makes steering faster;
the command output makes the result easier to trust.

### desktop coordinates parallel work

the [Codex app](https://learn.chatgpt.com/docs/app) makes more sense to me when I
have several bounded pieces of work moving at once. it gives tasks, diffs,
terminals, previews, and browser review a shared visual home. that can reduce
the mental cost of remembering which terminal belongs to which job.

parallel work also multiplies state. every task should have one owner, one
checkout, and one pass condition. I want the app to help me see those boundaries
instead of turning concurrency into a wall of activity. the number of running
agents is activity. the reviewed work is the achievement.

### cloud and mobile change where you steer

[Codex cloud](https://learn.chatgpt.com/docs/cloud) is useful when a task should
continue in an isolated environment while I move on. mobile is useful when I
need to inspect progress, answer a narrow question, or make an approval decision
away from my desk. together they make the work less dependent on one open
terminal.

remote work raises the standard for the handoff. I want the task to name the
repository state, setup assumptions, verification command, and expected
artifact before it leaves my machine. when it returns, I review the diff and the
evidence as a new input. continued execution is context. the diff and its
verification provide proof.

## the interface is not the whole system

I separate the interaction interface from the interaction layer. the interface
is where I steer and review Codex: terminal, editor, desktop, web, or mobile.
the interaction layer is what shapes the loop around that interface:
instructions, permissions, tools, memory, automation, delegation, and the
evidence I expect back. changing interfaces can make the same job easier to
supervise. changing the interaction layer can change how the job is understood
and executed.

### the interface changes what you can see

the transcript is only one part of the state. the repository, current diff,
terminal output, browser state, configured tools, and approval history can all
change what happens next. a clean looking answer can still point at the wrong
checkout. a short answer can be backed by a complete implementation and a real
test run.

I therefore judge a Codex session by the artifact and its receipts. I want the
exact files, the exact commands, the branch or task boundary, and the remaining
decision. this keeps the conversation useful even when the work moves between
local and remote surfaces.

### the interaction layer changes what codex can reach

the best surface can change during a task, while the repository remains the
shared object everyone can inspect. project instructions explain the local
rules. version control shows the actual change. verification commands turn an
agent claim into something another person can reproduce.

I try to keep the durable knowledge close to that center:

- repository conventions belong in [`AGENTS.md`](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- repeatable verification belongs in commands the project can run again
- reusable operating knowledge belongs in a [skill](https://learn.chatgpt.com/docs/build-skills) or another explicit tool
- personal defaults belong in personal configuration
- credentials, provider identity, and final authority stay outside the repository

this division becomes more valuable as Codex reaches more surfaces. it lets me
switch interfaces without rebuilding the rules of the project from memory.

## controlling codex across devices

### steering is different from hosting

the device in my hand does not have to be the machine doing the work. with
[Remote](https://learn.chatgpt.com/docs/remote-connections), my phone or another
desktop can send prompts, approvals, and follow up instructions to a connected
host. the host still supplies the files, shell, credentials, permissions,
skills, MCP servers, browser setup, and local tools.

this distinction keeps remote work understandable. I first ask where the
process is running and which environment it can reach. only then do I decide
which screen is the most convenient place to steer it.

### local, remote, and cloud execution are different

local work uses the machine in front of me. Control Other Devices keeps the
work on a connected desktop host and moves the controls somewhere else. an SSH
project goes further: the desktop app starts Codex through SSH, then reads,
writes, and runs commands against the remote machine. [Codex
cloud](https://learn.chatgpt.com/docs/cloud) uses a separate hosted environment
that can continue after I close the desktop app.

those options solve different problems. a connected host preserves the setup I
already trust. SSH is useful when the repository and its dependencies already
live on another machine. cloud work is useful when the task should be isolated
from my computer and continue independently. convenience comes after choosing
the right execution boundary.

### mobile keeps the control loop close

mobile Codex is genuinely useful to me because it keeps much more of the control
loop available than a simple notification screen. I can start or continue
chats, choose branches and worktrees, inspect diffs and terminal output, manage
goals, leave review comments, answer questions, and approve actions while the
connected host keeps its full environment.

the phone works best for steering and review. I still return to a larger screen
for a wide diff, a long terminal trace, or a decision that depends on several
files at once. mobile shortens the distance between the task needing attention
and me making the next decision without pretending that every review belongs on
a phone.

## start with what you are trying to finish

[ChatGPT Work](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) sits next to Codex and handles longer knowledge work and finished
deliverables. Codex remains the software development surface. that boundary is
useful because both can use tools while asking you to review very different
kinds of output.

### code should end in the repository

I send repository changes, command driven investigation, and software review to
Codex. I send research synthesis, documents, spreadsheets, and finished
knowledge work to ChatGPT Work. both products can cross those lines, so the
artifact is the useful test: source code should end in an inspectable diff and a
verification result; knowledge work should end in a deliverable I can read,
edit, and share.

### ChatGPT Work begins with a finished deliverable

the final authority stays easy to name in either case. an agent can prepare a
commit, a pull request, a deployment, a message, or a deletion. preparing that
action and taking that action are separate decisions. I want the handoff to say
which side of that line the task reached.

I assume you can install Codex and send a prompt. the rest of this guide starts
where the quickstart ends: choosing a review surface, making repository context
durable, deciding how extensions should compose, and keeping powerful access
understandable.

read the chapters horizontally. getting started establishes one complete loop.
configuration decides where rules live. workflows cover parallel and
longer running work. extensions separate skills, plugins, hooks, MCP, and
subagents by the job each one performs. safety covers reach, identity, secrets,
and human authority. recommendations are where I make the personal choices
explicit.

continue with [configuration](/guides/codex/configuration/) or
[recommendations](/guides/codex/recommendations/).
