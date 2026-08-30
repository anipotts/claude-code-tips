---
title: configuration
description: where codex instructions, permissions, tools, and reusable workflows belong.
products: [codex]
updatedAt: "2026-08-29T19:04:00-04:00"
checkedAt: "2026-08-28T00:00:00-04:00"
status: current
completion: excerpt
evidence: [tested, official-source, analysis]
sources: [openai-codex-manual, openai-codex-agents-md, openai-codex-skills, openai-codex-plugins, openai-codex-mcp, openai-codex-config, openai-codex-security]
redirects: []
voice: evidence
navigation:
  scope: codex
  order: 30
---

## configuration has separate jobs

### AGENTS.md explains the repository

- repository instructions and verification commands: `AGENTS.md`
- reusable workflow and reference material: a skill
- distributable tools and extensions: a plugin or MCP server

### config.toml chooses defaults

- personal defaults: `~/.codex/config.toml`
- trusted repository settings: `.codex/config.toml`

Codex loads project configuration only after the project is trusted. project
files also cannot override provider, authentication, or profile keys. this
keeps shared repository configuration narrower than personal account settings.
the [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) describes each value.

## permissions are two different questions

### the sandbox defines reach

filesystem and network access describe what a command can reach. approval
policy describes when Codex needs your decision before running it. final
authority to merge, publish, send, pay, or delete remains a separate human
decision.

### approval policy defines interruption

current Codex releases expose the established `sandbox_mode` and
`approval_policy` settings alongside newer permission profiles. inspect the
effective configuration before relying on a profile, especially when a desktop
app and CLI installation may be on different versions. the [security guide](https://learn.chatgpt.com/docs/security) explains the current controls.

## keep identity and secrets outside the repository

### credentials belong in external storage

keep stable team rules in version control. keep machine specific paths,
credentials, and account choices outside the repository. after any handoff
between terminal, app, editor, or remote machine, confirm the working directory,
branch, permissions, and verification command before editing.
