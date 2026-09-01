---
title: configuration
description: the current official configuration surfaces for grok build.
products: [grok]
updatedAt: "2026-08-29T19:04:00-04:00"
status: pending
evidence: [official-source, open-question]
sources: [grok-build, grok-build-settings, grok-build-permissions]
redirects: []
voice: evidence
navigation:
  scope: grok
  order: 30
---

## the current configuration map

| scope | canonical place |
|---|---|
| personal defaults | `~/.grok/config.toml` |
| repository tools and permission rules | `.grok/config.toml` |
| shared agent instructions | `AGENTS.md` |
| extensions | `.grok/` skills, plugins, hooks, and MCP servers |

`grok inspect` shows the configuration discovered for the current directory.
project configuration is intentionally narrower than user configuration.
Grok Build [documents these settings](https://docs.x.ai/build/settings).

Grok documents approval mode and sandbox access as separate controls. ask,
auto, and always approve decide which tool calls may run. the sandbox still
limits what an approved call can reach. Grok Build [documents that permission boundary](https://docs.x.ai/build/features/permissions).

this page records the official shape. field tested defaults are coming later.
