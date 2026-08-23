---
title: configuration
description: where claude code instructions, settings, permissions, hooks, and reusable workflows belong.
products: [claude-code]
updatedAt: "2026-08-22T19:55:02-04:00"
status: pending
evidence: [official-source, open-question]
sources: [anthropic-features-overview, anthropic-permissions, anthropic-memory, anthropic-changelog]
redirects: []
voice: evidence
navigation:
  scope: claude-code
  order: 20
---

## configuration has separate jobs

| need | canonical place |
|---|---|
| repository instructions | `CLAUDE.md` and imported project rules |
| shared project settings | `.claude/settings.json` |
| personal project overrides | `.claude/settings.local.json` |
| reusable workflow knowledge | skills and subagents |
| lifecycle enforcement and external tools | hooks, plugins, and MCP servers |

permission rules decide which tools may run automatically, ask, or stay denied.
keep sensitive machine details and credentials outside shared repository files.
[Claude Code permissions](https://code.claude.com/docs/en/permissions)

## keep one repository instruction source

when a repository supports several agents, keep the shared operating rules in
one canonical file. make `CLAUDE.md` import those rules, then add only genuine
Claude Code differences. this prevents the same verification command or safety
boundary from drifting between agent specific files.

the current Claude Code content here is source reviewed. configuration advice
that depends on current runtime behavior stays marked as an open question until
the paired field run is complete.
