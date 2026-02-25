# /stats

quick project health dashboard. lines of code, file counts, git activity, test coverage if available

> also available as `/ledger project` — same data, single entry point

## what it does

gives you a snapshot of your project in one command. how big is it, what languages, how active, how tested. the stuff you'd want to know when you open a codebase for the first time

## the command

```
/stats
```

scope to a directory:

```
/stats lib/
```

## the prompt

```
When the user runs /stats, generate a project health dashboard.

## Codebase size

Run these via Bash:

1. File count by type:
   find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/.next/*' | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -15

2. Lines of code (exclude generated/vendor):
   find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' -o -name '*.rs' -o -name '*.go' -o -name '*.css' -o -name '*.html' \) -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' | xargs wc -l 2>/dev/null | tail -1

3. Largest files:
   find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.py' -o -name '*.rs' \) -not -path '*/node_modules/*' -not -path '*/.git/*' | xargs wc -l 2>/dev/null | sort -rn | head -6

## Git activity

1. Recent activity:
   git log --oneline -20 --format='%h %ar %s'

2. Contributors:
   git shortlog -sn --no-merges | head -10

3. Activity this week:
   git log --since='7 days ago' --oneline | wc -l

4. Last commit:
   git log -1 --format='%ar by %an: %s'

5. Branch count:
   git branch -a | wc -l

## Test coverage (if available)

Check for coverage reports:
- coverage/lcov-report/index.html
- htmlcov/index.html
- coverage.json
- .coverage

If a coverage report exists, extract the summary. If not, check if a test runner is configured and report test count:
- For Jest/Vitest: count *.test.ts and *.spec.ts files
- For pytest: count test_*.py files
- For cargo: count #[test] annotations

## Package info

If package.json exists, extract: name, version, dependency count (deps + devDeps), scripts available

If Cargo.toml exists: name, version, edition, dependency count

## Output format

# project stats

**codebase**
| metric | value |
|---|---|
| total files | X |
| lines of code | X |
| primary language | TypeScript (X%) |
| dependencies | X deps + X devDeps |

**largest files**
| file | lines |
|---|---|
| lib/personas.ts | 847 |
| lib/contacts.ts | 423 |

**git activity**
| metric | value |
|---|---|
| total commits | X |
| contributors | X |
| commits this week | X |
| last commit | 2 hours ago by ani |
| branches | X |

**testing**
| metric | value |
|---|---|
| test files | X |
| coverage | 74% (or "no coverage report found") |

**available scripts**
`dev` · `build` · `test` · `typecheck`

## Rules
- Keep it compact — this is a dashboard, not an essay
- If a metric can't be computed (no git, no tests), skip it gracefully
- Round percentages to nearest integer
- For lines of code, exclude blank lines if easy to do, but don't overthink it
- If the project is a monorepo, note it and show top-level stats
```

## example output

```
project stats

codebase
| metric           | value                  |
|------------------|------------------------|
| total files      | 47                     |
| lines of code    | 3,812                  |
| primary language | TypeScript (89%)       |
| dependencies     | 8 deps + 12 devDeps    |

largest files
| file                | lines |
|---------------------|-------|
| lib/personas.ts     | 847   |
| lib/contacts.ts     | 423   |
| scripts/daemon.ts   | 312   |

git activity
| metric            | value                              |
|-------------------|------------------------------------|
| total commits     | 142                                |
| contributors      | 1                                  |
| commits this week | 7                                  |
| last commit       | 3 hours ago — "fix streaming bug"  |

testing
| metric     | value                     |
|------------|---------------------------|
| test files | 4                         |
| coverage   | no coverage report found  |

scripts: dev · build · test · typecheck · deploy
```

good for onboarding, standup prep, or just satisfying your curiosity about a project without digging through files
