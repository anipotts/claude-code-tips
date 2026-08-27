---
title: codex
description: a practical map of the codex terminal, app, editor, cloud, and mobile surfaces.
products: [codex]
updatedAt: "2026-08-22T19:55:02-04:00"
status: current
evidence: [tested, official-source, analysis]
sources: [openai-codex-manual, openai-codex-app, openai-codex-mobile, openai-work-and-codex]
redirects: []
voice: evidence
navigation:
  scope: codex
  order: 10
---

## this is codex

codex is OpenAI’s agent for software development and technical work. the same
account reaches a terminal interface, editor extension, desktop app, cloud
tasks, and mobile review. each surface changes how you steer and inspect the
work more than it changes the underlying job. [OpenAI’s Codex overview](https://openai.com/codex/)

<div class="surface-bento">
  <figure><a href="https://github.com/openai/codex"><img src="/media/publications/codex-cli-1200.webp" srcset="/media/publications/codex-cli-640.webp 640w, /media/publications/codex-cli-1200.webp 1200w" sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 72rem) calc((100vw - 20rem) / 2), 32rem" alt="the Codex command line interface" loading="lazy" decoding="async" width="1200" height="753" /><figcaption>terminal and scripts</figcaption></a></figure>
  <figure><a href="https://openai.com/index/introducing-the-codex-app/"><img src="/media/publications/codex-app-1200.webp" srcset="/media/publications/codex-app-640.webp 640w, /media/publications/codex-app-1200.webp 1200w" sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 72rem) calc((100vw - 20rem) / 2), 32rem" alt="the Codex desktop app showing agent work" loading="lazy" decoding="async" width="1200" height="722" /><figcaption>desktop app and parallel work</figcaption></a></figure>
  <figure><a href="https://openai.com/codex/"><img src="/media/publications/codex-app-1200.webp" srcset="/media/publications/codex-app-640.webp 640w, /media/publications/codex-app-1200.webp 1200w" sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 72rem) calc((100vw - 20rem) / 2), 32rem" alt="Codex changes and review inside its visual workspace" loading="lazy" decoding="async" width="1200" height="722" /><figcaption>editor context and visual review</figcaption></a></figure>
  <figure><a href="https://openai.com/index/work-with-codex-from-anywhere/"><img src="/media/publications/codex-mobile-1200.webp" srcset="/media/publications/codex-mobile-640.webp 640w, /media/publications/codex-mobile-1200.webp 1200w" sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 72rem) calc((100vw - 20rem) / 2), 32rem" alt="Codex running through the ChatGPT mobile app" loading="lazy" decoding="async" width="1200" height="675" /><figcaption>mobile steering and approvals</figcaption></a></figure>
</div>

as of august 22, 2026, Codex supports skills, plugins, hooks, MCP, subagents,
memory, worktrees, browser and computer use, scheduled tasks, and remote access
across its supported surfaces. the useful question is which controls belong in
your daily loop. [official Codex documentation](https://learn.chatgpt.com/docs/codex)

## where each surface fits

| surface | use it when | watch for |
|---|---|---|
| terminal | commands and output are the main evidence | parallel sessions need manual coordination |
| desktop app | several tasks, previews, browsers, or worktrees need one review surface | more state lives outside the editor |
| editor | selection context, diagnostics, and inline review dominate | the editor becomes the session shell |
| cloud or mobile | work should continue away from your primary machine | environment parity and remote state need review |

ChatGPT Work sits next to Codex and handles longer knowledge work and finished
deliverables. Codex remains the software development surface. that boundary is
useful because both can use tools while asking you to review very different
kinds of output. [ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex)

continue with [configuration](/guides/codex/configuration/) or
[recommendations](/guides/codex/recommendations/).
