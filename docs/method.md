---
title: where this comes from
description: the projects, source checks, examples, and open questions behind this handbook.
products: [cross runtime]
updatedAt: "2026-08-22T19:55:02-04:00"
status: current
evidence: [tested, official-source, analysis, open-question]
sources: []
redirects: [/field-lab/]
voice: personal
navigation:
  scope: general
  order: 50
---

this is a personal handbook built from using coding agents on real repositories,
then checking the product details that can change underneath those experiences.
examples support the tips. they are not a badge of authority.

## what i actually use

i link the repository, field runs, commits, screenshots, failures, and source
material that shaped a recommendation when those receipts are useful. some
advice comes from repeated use. some comes from an official product update i
have not reproduced yet. the label beside the source list keeps that distinction
visible without taking over the page.

## how current claims get checked

date sensitive product claims begin with an exact date. the source registry
points to official documentation, release notes, repositories, and papers. a
weekly read only check looks for upstream changes. a person still reviews the
meaning before public copy changes.

| label | what it means |
|---|---|
| tested | i reproduced it in a named environment |
| official source | the current product documentation or source states it |
| analysis | this is my conclusion from the examples shown |
| open question | the current evidence is incomplete |

## how a run is recorded

field runs preserve the task, pass condition, what worked, what failed, human
interventions, machine context, artifacts, redactions, and limitations in one
record. a run can be partial and still be useful when the missing proof stays
visible.

the current Codex runs cover publishing this handbook and dependency
maintenance. the equivalent Claude Code run is still open, so those pages rely
on official sources instead of pretending i tested the latest release.

## what this does not settle

one successful task does not establish the best agent, model, or workflow.
vendor benchmarks describe a release under their own conditions. the guidance
here becomes stronger when the same practice survives different repositories,
machines, and failure modes.
