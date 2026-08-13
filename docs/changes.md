---
title: latest changes
description: material changes to the guide, its evidence, and its recommendations.
latestChange:
  date: 2026-08-11
  title: "the evidence and toolchain stay current"
  summary: "refreshed the claude code guide through 2.1.227 and updated the publication toolchain through an inspectable codex run."
products: [cross-runtime]
lastVerified: 2026-08-11
status: current
evidence: [hands-on, source-verified]
sources: [openai-codex-manual, anthropic-claude-overview, anthropic-changelog]
evidenceRail:
  - kind: source-verified
    label: claude code 2.1.227 review
    section: '2026-08-11'
    sourceId: anthropic-changelog
  - kind: hands-on
    label: codex dependency maintenance run
    section: '2026-08-11'
  - kind: hands-on
    label: publication shell review
    section: '2026-08-09'
  - kind: source-verified
    label: codex manual review
    section: '2026-08-07'
    sourceId: openai-codex-manual
  - kind: source-verified
    label: claude code 2.1.224 review
    section: '2026-08-07'
    sourceId: anthropic-claude-overview
  - kind: hands-on
    label: v4 publication reset
    section: '2026-08-07'
---

## 2026-08-11

### dependency maintenance

- updated astro to 7.2.1 and `@axe-core/playwright` to 4.13.0.
- kept typescript at 6.0.3 within the current astro checker peer range.
- added a [codex maintenance run](/field-lab/runs/codex-dependency-maintenance-2026-08-11/)
  with the task boundary, skipped scenarios, evidence, and limitations.
- made the route regression suite discover every field-run page from its data file.
- made the homepage latest-change section read from this changelog metadata.

### claude code source refresh

- verified package 2.1.227 against the current official changelog.
- recorded the 2.1.225 workspace trust prompt for `claude agents`.
- documented named remote control session messaging across machines.
- kept the hands-on claude code field run visibly pending.

### repository signal

- confirmed the published 27-star count against the renamed github repository.

## 2026-08-09

### publication shell

- unified the homepage and guide headers at 64 pixels.
- aligned the homepage and guide content columns on desktop.
- removed the decorative homepage evidence rail and unused mobile navigation spacer.
- made article evidence a full-height desktop rail and a closed mobile disclosure.
- kept primary navigation available on mobile homepage and field-run routes.
- tightened the first article-section gap after short introductory notes.
- added the github icon with a 27-star count verified on 2026-08-09.
- removed redundant page labels and prohibited mid-dot dividers in public copy.

## 2026-08-07

### v4 publication reset

- reframed the repository around codex and claude code as co-equal primary guides.
- added the surface, harness, model, and orchestration taxonomy.
- replaced activity automation with read-only source and build verification.
- established the field lab, evidence rail, and public decision record.
- froze historical claude code tools through 2026-11-05.

### source review

- codex guidance was checked against the official manual and package 0.147.0.
- claude code guidance was checked against official documentation and package 2.1.224.
- current claude code hands-on comparison remains pending.

earlier tool releases and migration notes remain available in the repository
[legacy tool changelog](https://github.com/anipotts/coding-agent-tips/blob/main/plugins/CHANGELOG.md),
signed tags, and git history.
