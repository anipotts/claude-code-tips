---
name: quicktest
description: run tests for current file
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Write
---

# /quicktest

finds the test file for your current file, runs just that test, and reports results. if no test file exists, offers to create one

## what it does

1. figures out which file you're working on from recent context
2. finds the corresponding test file using common naming conventions
3. runs only that test file (not the whole suite)
4. reports pass/fail with relevant output
5. if no test file exists, offers to scaffold one using the test-writer pattern

## how to use it

test whatever file you were just editing:

```
/quicktest
```

test a specific file:

```
/quicktest lib/auth.ts
```

create the test file if it doesn't exist:

```
/quicktest lib/auth.ts --create
```

## the prompt

```
When the user runs /quicktest, do the following:

## Step 1: Identify the target file

- If the user specified a file, use that
- If not, look at the recent conversation for the last file that was edited or discussed
- If you still can't tell, ask

## Step 2: Find the test file

Search for matching test files using these conventions (try all, use the first match):

For `src/lib/auth.ts`:
- `src/lib/auth.test.ts`
- `src/lib/auth.spec.ts`
- `src/lib/__tests__/auth.test.ts`
- `src/lib/__tests__/auth.spec.ts`
- `tests/lib/auth.test.ts`
- `test/lib/auth.test.ts`
- `tests/lib/auth_test.ts`

For Python `src/auth.py`:
- `src/test_auth.py`
- `tests/test_auth.py`
- `src/auth_test.py`

For Rust `src/auth.rs`:
- Check for `#[cfg(test)]` module inside the file itself
- `tests/auth.rs`

Use Glob to search. Adapt the patterns to match the project's existing test structure.

## Step 3: Run the test

Detect the test runner from the project:
- **package.json** with jest/vitest: `npx vitest run <test-file>` or `npx jest <test-file>`
- **pytest**: `python -m pytest <test-file> -v`
- **cargo**: `cargo test --lib <module> -- --nocapture` or `cargo test --test <name>`
- **go**: `go test -v -run <TestFunc> ./<package>`

Run with verbose output so individual test results are visible. Set a 60-second timeout.

## Step 4: Report results

If tests pass:
- Show count: "4/4 tests passed"
- Show runtime

If tests fail:
- Show which tests failed with the error message
- Show the relevant assertion or error, not the full stack trace
- Read the failing test to understand what it expected
- Briefly suggest what might be wrong

## Step 5: No test file? Create one

If no test file was found:
1. Tell the user: "no test file found for <file>"
2. If --create flag or user confirms, scaffold a test file:
   - Read the source file to understand exports
   - Create test file following the project's existing test conventions
   - Write basic test structure with describe blocks for each exported function
   - Add 2-3 edge case tests per function (empty input, error path, boundary)
   - Don't write the actual assertions — use TODO comments so the user fills in expected values
3. Run the new test file to verify it at least loads without syntax errors

## Rules
- Only run the single test file, never the full test suite
- If tests take longer than 60 seconds, kill and report timeout
- Don't modify source code to make tests pass — just report what failed
- If the project has no test runner configured, say so and suggest one
```

## why this exists

running the full test suite takes forever. you just want to know if the thing you changed still works. this finds the right test file and runs it in like 3 seconds instead of you remembering the exact test command and file path every time

the --create flag is clutch for those files that somehow never got tests. scaffolds the boring boilerplate so you can focus on writing the actual assertions
