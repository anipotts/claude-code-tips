---
name: deps
description: dependency updates and security
allowed-tools:
  - Bash
  - Read
  - Glob
---

# /deps

check all project dependencies for updates and security issues. one command, clean output

## what it does

scans your dependency manifests, checks for outdated packages, runs security audits, and outputs a priority-sorted table. works with node, python, rust, and go

## the command

```
/deps
```

## the prompt

```
When the user runs /deps, check all project dependencies for updates and security issues.

## Step 1: Detect ecosystem

Use Glob to find dependency files:
- package.json, yarn.lock, pnpm-lock.yaml → Node.js
- requirements.txt, pyproject.toml, Pipfile → Python
- Cargo.toml → Rust
- go.mod → Go

Report which ecosystem(s) you found.

## Step 2: Check for updates

Node.js:
- Run `npm outdated --json 2>/dev/null` and parse the output
- If yarn.lock exists, run `yarn outdated --json 2>/dev/null` instead
- If pnpm-lock.yaml exists, run `pnpm outdated --format json 2>/dev/null` instead

Python:
- Run `pip list --outdated --format=json 2>/dev/null`

Rust:
- Run `cargo outdated --depth 1 2>/dev/null` (if cargo-outdated is installed)
- Otherwise, read Cargo.toml and note "install cargo-outdated for automatic checks"

Go:
- Run `go list -u -m all 2>/dev/null`

## Step 3: Security audit

Node.js:
- Run `npm audit --json 2>/dev/null`
- Parse severity levels from output

Python:
- Run `pip-audit --format=json 2>/dev/null` if installed
- Otherwise note "install pip-audit for security scanning"

Rust:
- Run `cargo audit 2>/dev/null` if installed

## Step 4: Output

Print a clean, scannable report:

**Security Issues** (if any)
| Severity | Package | Vulnerability | Fix |
|---|---|---|---|

**Outdated Dependencies**
| Package | Current | Latest | Update type |
|---|---|---|---|

Where update type is: patch (safe), minor (usually safe), major (breaking)

**Summary line:**
X packages outdated (Y major, Z minor, W patch) · X security issues (Y critical, Z high)

If everything is up to date and clean: "all clear — X packages checked, no issues found"

## Rules
- Sort security issues by severity (critical first)
- Sort outdated by update type (major first)
- If a command isn't available, skip it gracefully — don't error out
- Don't suggest updating everything at once. If there are major updates, note them separately
- Keep output compact. No verbose explanations unless there's a critical security issue
```

## example output

```
Security Issues
| Severity | Package    | Vulnerability          | Fix       |
|----------|------------|------------------------|-----------|
| high     | lodash     | Prototype pollution    | >= 4.17.21|

Outdated Dependencies
| Package         | Current | Latest | Update type |
|-----------------|---------|--------|-------------|
| typescript      | 5.3.2   | 5.7.3  | minor       |
| @types/node     | 20.10.0 | 22.1.0 | major       |
| prettier        | 3.1.0   | 3.4.2  | minor       |
| esbuild         | 0.19.8  | 0.24.0 | minor       |

4 packages outdated (1 major, 3 minor) · 1 security issue (1 high)
```

takes 10 seconds to run. way better than remembering to check manually
