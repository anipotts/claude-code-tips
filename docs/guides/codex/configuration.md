---
title: configuration
description: where codex instructions, permissions, tools, and reusable workflows belong.
products: [codex]
updatedAt: "2026-08-22T19:55:02-04:00"
status: current
evidence: [tested, official-source, analysis]
sources: [openai-codex-manual, openai-codex-config, openai-codex-security]
redirects: []
voice: evidence
navigation:
  scope: codex
  order: 20
---

## configuration has separate jobs

| need | canonical place |
|---|---|
| repository instructions and verification commands | `AGENTS.md` |
| personal defaults | `~/.codex/config.toml` |
| trusted repository settings | `.codex/config.toml` |
| reusable workflow and reference material | a skill |
| distributable tools and extensions | a plugin or MCP server |

Codex loads project configuration only after the project is trusted. project
files also cannot override provider, authentication, or profile keys. this
keeps shared repository configuration narrower than personal account settings.
[configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)

## permissions are two different questions

filesystem and network access describe what a command can reach. approval
policy describes when Codex needs your decision before running it. broad access
does not automatically grant final authority to merge, publish, send, pay, or
delete.

current Codex releases expose the established `sandbox_mode` and
`approval_policy` settings alongside newer permission profiles. inspect the
effective configuration before relying on a profile, especially when a desktop
app and CLI installation may be on different versions. [Codex security](https://learn.chatgpt.com/docs/security)

## a durable default

keep stable team rules in version control. keep machine specific paths,
credentials, and account choices outside the repository. after any handoff
between terminal, app, editor, or remote machine, confirm the working directory,
branch, permissions, and verification command before editing.
