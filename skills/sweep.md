<!-- tested with: claude code v1.0.34 -->

---
name: sweep
description: find and clean up dead code, unused imports, and stale TODOs with confirmation
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Edit
---

# /sweep

runs a cleanup pass on your codebase and applies safe fixes. interactive — confirms before each change so you stay in control

## what it does

1. scans for unused imports, dead exports, stale TODOs, unreachable code
2. sorts findings by confidence level (safe to remove vs needs review)
3. shows you each proposed cleanup and waits for confirmation
4. applies the fix using Edit if you approve
5. gives you a summary at the end

## how to use it

sweep the whole project:

```
/sweep
```

scope it to a directory:

```
/sweep lib/
```

only look for specific issues:

```
/sweep imports only
```

dry run — just report, don't fix:

```
/sweep --dry-run
```

## the prompt

```
When the user runs /sweep, do the following:

## Phase 1: Scan

1. Use Glob to find all source files (*.ts, *.tsx, *.js, *.jsx, *.py, *.rs — match the project's language)
2. Skip node_modules, dist, build, .git, and generated directories
3. For each file, check for:
   - **Unused imports**: imported names that don't appear elsewhere in the file
   - **Dead code**: commented-out code blocks (3+ consecutive commented lines), unreachable code after returns
   - **Stale TODOs**: TODO/FIXME/HACK comments (note them, flag for review)
   - **Empty catch blocks**: try/catch with no error handling
   - **Unused variables**: declared but never referenced

4. For each finding, classify confidence:
   - **SAFE**: unused imports, commented-out code blocks — can be removed without behavior change
   - **REVIEW**: TODOs, empty catches, dead exports — might be intentional

## Phase 2: Report

Present findings grouped by confidence level:

**Safe to remove (auto-fixable):**
- file.ts:14 — unused import: `lodash`
- file.ts:87-93 — commented-out code block

**Needs review:**
- utils.ts:45 — TODO: "fix this later" (no context)
- api.ts:120 — empty catch block

## Phase 3: Fix (interactive)

For each SAFE finding:
1. Show the code that will be removed (with 2 lines of context above and below)
2. Ask "remove this? (y/n/all/skip-rest)"
3. If yes, use the Edit tool to remove it
4. If "all", apply remaining safe fixes without asking
5. If "skip-rest", stop fixing but finish the report

For REVIEW findings, just list them — don't offer to auto-fix

## Phase 4: Summary

- X issues found (Y safe, Z needs review)
- X fixes applied
- X lines removed
- List any files that were modified

## Rules
- Never remove code you're not confident is dead
- Never modify test files without explicit confirmation
- If a file has only unused import removals, batch them into one edit
- If you're unsure whether an import is used (dynamic imports, re-exports), skip it
- When removing an import, check if it leaves a blank line — clean that up too
```

## why this exists

every codebase accumulates cruft. commented-out experiments, imports from that thing you tried and reverted, TODOs from six months ago that nobody remembers. this takes 30 seconds to run instead of spending an afternoon with a linter report

the interactive confirmation is key — fully automated cleanup is scary, but reviewing each change yourself is tedious. this hits the middle ground
