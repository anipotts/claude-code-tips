---
name: improve
description: analyze recent sessions and git history to propose CLAUDE.md improvements
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# /improve

looks at your recent git history, session data, and current CLAUDE.md to figure out what instructions are missing, outdated, or wrong. proposes a diff -- never auto-commits.

credit: Boris Cherny tip #2 (self-improvement loops).

## what it does

1. reads git log for the last N commits (default 20)
2. identifies patterns -- what got reverted, what got fixed immediately after, what caused loops
3. reads your CLAUDE.md and checks if it covers the patterns it found
4. cross-references miner.db session data if available (error patterns, wasted sessions)
5. proposes additions, removals, and edits to CLAUDE.md
6. presents the diff for your approval -- **never auto-commits**

## how to use it

analyze the last 20 commits (default):

```
/improve
```

analyze more history:

```
/improve last 200 commits
```

focus on a specific area:

```
/improve focus on testing patterns
```

## the prompt

```
When the user runs /improve, analyze recent project history and propose improvements to CLAUDE.md (or create one if it doesn't exist).

## Phase 1: Gather evidence

1. Read the current CLAUDE.md (or note that it doesn't exist):
   ```bash
   cat CLAUDE.md 2>/dev/null || echo "NO CLAUDE.md FOUND"
   ```

2. Read recent git history (default 20 commits, or whatever the user specified):
   ```bash
   git log --oneline -20
   ```

3. Find reverts and immediate fix-ups -- these reveal instructions Claude keeps getting wrong:
   ```bash
   git log --oneline -200 | grep -iE 'revert|fix|undo|oops|wrong|broken'
   ```

4. Find commit pairs where a fix came within 5 minutes of a change (rapid fire-fix cycles):
   ```bash
   git log --format='%H %ai %s' -100
   ```

5. Check for patterns in commit messages -- repeated phrases suggest repeated issues:
   ```bash
   git log --oneline -200 | sed 's/^[a-f0-9]* //' | sort | uniq -c | sort -rn | head -20
   ```

6. Check for conversation patterns -- what does the user keep telling Claude?
   Look at recent git diffs for signs of repeated corrections:
   ```bash
   git log --all --oneline -50 | grep -iE 'style|format|convention|pattern|always|never|dont|do not'
   ```

7. If ~/.claude/miner.db exists, check for error patterns:
   ```bash
   sqlite3 -header -column ~/.claude/miner.db "
     SELECT tool_name, error_message, COUNT(*) as occurrences
     FROM errors
     WHERE session_id IN (
       SELECT id FROM sessions
       WHERE project_dir LIKE '%$(basename $PWD)%'
       AND start_time >= date('now', '-14 days')
     )
     GROUP BY tool_name, error_message
     ORDER BY occurrences DESC
     LIMIT 10;
   " 2>/dev/null
   ```

8. Check for wasted sessions (high tokens + many errors):
   ```bash
   sqlite3 -header -column ~/.claude/miner.db "
     SELECT s.first_user_prompt,
            s.total_input_tokens + s.total_output_tokens AS tokens,
            (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) AS errors
     FROM sessions s
     WHERE s.project_dir LIKE '%$(basename $PWD)%'
     AND s.start_time >= date('now', '-14 days')
     AND (SELECT COUNT(*) FROM errors e WHERE e.session_id = s.id) >= 3
     ORDER BY tokens DESC
     LIMIT 5;
   " 2>/dev/null
   ```

## Phase 2: Analyze patterns

Look for these signals:

1. **Reverted changes** -- Claude did something wrong that had to be undone. CLAUDE.md should have a rule preventing it
2. **Rapid fix cycles** -- Claude made a change and it immediately broke something. Missing context about project constraints
3. **Repeated errors** -- same tool failures across sessions. Claude doesn't know about a project quirk
4. **Expensive loops** -- sessions that burned lots of tokens on errors. Claude was missing crucial information
5. **Stale instructions** -- CLAUDE.md references files, tools, or patterns that no longer exist
6. **Missing conventions** -- the codebase follows patterns that CLAUDE.md doesn't document (naming, structure, testing)

## Phase 3: Propose changes

For each finding, propose a specific change to CLAUDE.md:

### additions
- New rules based on reverted changes ("never do X because Y")
- Missing context about project structure
- Common commands that Claude should know
- Testing patterns specific to this project
- File/directory conventions

### removals
- Instructions that reference files/dirs that don't exist anymore
- Rules that contradict current project patterns
- Overly specific instructions that are now out of date

### edits
- Rules that are too vague to be actionable
- Instructions that need updating for current project state

## Output format

## analysis

[summary of what you found -- 3-5 sentences about the patterns]

## evidence

| signal | count | example |
|---|---|---|
| reverted changes | 3 | "revert: remove broken auth middleware" |
| rapid fix cycles | 5 | fix committed 2 min after initial change |
| repeated errors | 4 | "Edit failed: old_string not found" |

## proposed diff

```diff
# CLAUDE.md

+ ## testing
+ - always run `npm test` before committing
+ - test files live in __tests__/ next to source files, not in a top-level tests/ dir
+
  ## structure
- - API routes are in pages/api/
+ - API routes are in app/api/ (migrated from pages/ in commit abc123)
+
+ ## gotchas
+ - the auth middleware expects req.headers.authorization, not req.headers.auth
+ - sqlite3 commands need --header --column flags for readable output
+ - never use `git add .` -- stage specific files to avoid committing .env
```

## Rules

- **NEVER auto-commit changes to CLAUDE.md** -- always present the diff and let the user decide
- Show the evidence for each proposed change so the user can evaluate it
- If CLAUDE.md doesn't exist, propose creating one from scratch
- Be specific -- "always run tests" is useless. "run `npm test -- --watch` before committing changes to lib/" is actionable
- Don't propose rules for one-off mistakes -- only for patterns (2+ occurrences)
- Keep proposed additions concise -- CLAUDE.md should be a quick reference, not a novel
- If miner.db isn't available, that's fine -- git history alone is enough
```

## why this exists

CLAUDE.md is the most powerful file in your project for shaping Claude's behavior, but it goes stale fast. new patterns emerge, old ones stop being relevant, and the mistakes Claude keeps making are exactly the things that should be documented as rules.

this automates the feedback loop: session data -> pattern recognition -> instruction updates. the diff-not-commit approach means you stay in control of what goes into your instructions.

run it weekly or after any session where claude did something annoying. the patterns add up.
