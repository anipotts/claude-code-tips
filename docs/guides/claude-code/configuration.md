---
title: configuration
description: where claude code instructions, settings, permissions, hooks, and reusable workflows belong.
products: [claude-code]
updatedAt: "2026-08-29T19:04:00-04:00"
checkedAt: "2026-08-28T00:00:00-04:00"
status: pending
evidence: [official-source, open-question]
sources: [anthropic-features-overview, anthropic-permissions, anthropic-memory, anthropic-settings, anthropic-changelog]
redirects: []
voice: evidence
navigation:
  scope: claude-code
  order: 30
---

## configuration has separate jobs

### CLAUDE.md explains the repository

- repository instructions: `CLAUDE.md` and imported project rules
- reusable workflow knowledge: skills and subagents
- lifecycle enforcement and external tools: hooks, plugins, and MCP servers

### settings choose behavior

- shared project settings: `.claude/settings.json`
- personal project overrides: `.claude/settings.local.json`

[permission rules](https://code.claude.com/docs/en/permissions) decide which tools may run automatically, ask, or stay denied.
keep sensitive machine details and credentials outside shared repository files.
Claude Code documents the permission system.

## understand the scope before changing a value

### user settings follow you

<!-- Ani voice pass follows this approved structure. -->

### project settings travel with the repository

<!-- Ani voice pass follows this approved structure. -->

### local and managed settings change precedence

<!-- Ani voice pass follows this approved structure. -->

## separate instructions from memory

### shared rules have one canonical source

when a repository supports several agents, keep the shared operating rules in
one canonical file. make `CLAUDE.md` import those rules, then add only genuine
Claude Code differences. this prevents the same verification command or safety
boundary from drifting between agent specific files.

### auto memory records useful experience

<!-- Ani voice pass follows this approved structure. -->

## permissions answer two questions

### rules define allow, ask, and deny

<!-- Ani voice pass follows this approved structure. -->

### modes define the session posture

<!-- Ani voice pass follows this approved structure. -->

## keep identity and secrets outside the repository

### authentication belongs to the account

<!-- Ani voice pass follows this approved structure. -->

### credentials belong in external storage

<!-- Ani voice pass follows this approved structure. -->

## inspect the effective configuration

### imports and precedence can hide the source

the current Claude Code content here is source reviewed. configuration advice
that depends on current runtime behavior stays marked as an open question until
the paired field run is complete.
