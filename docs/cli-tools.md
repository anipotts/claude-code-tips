# headless claude code patterns

**shell functions that pipe things into `claude -p` for instant answers without opening a session.**

credit: Boris Cherny tip #4, refined implementations.

---

## what is headless mode

`claude -p "<prompt>"` runs claude code in non-interactive mode — no session, no UI, just stdin/stdout. pipe stuff in, get answers out. perfect for wrapping in shell functions you call 20 times a day.

the key flags:

| flag | what it does |
|---|---|
| `-p "<prompt>"` | headless mode — runs the prompt and exits |
| `--output-format stream-json` | streams JSON objects with type, content, cost |
| `--model claude-haiku-4-5` | override the model (haiku for fast stuff) |
| `--allowedTools` | restrict which tools the agent can use |

---

## fix() — pipe errors into claude for a fix

the most useful one. run a command, and if it fails, pipe the error output to claude for analysis and a fix suggestion.

```bash
fix() {
  local output
  output=$(eval "$@" 2>&1)
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "$output"
    return 0
  fi

  echo "command failed (exit $exit_code). asking claude..." >&2
  echo "$output" | claude -p "this command failed:

\`$*\`

here's the output:

\$(cat)

explain what went wrong and give me the exact command to fix it. be concise."
}
```

### usage

```bash
fix npm run build
fix cargo test
fix python manage.py migrate
```

if the command succeeds, you get normal output. if it fails, claude reads the error and tells you what to do. saves you from googling cryptic error messages.

---

## explain() — explain a file or function

point it at a file and get a plain-english explanation. good for onboarding or reading someone else's code.

```bash
explain() {
  if [ -z "$1" ]; then
    echo "usage: explain <file> [function_name]" >&2
    return 1
  fi

  local file="$1"
  local func="$2"

  if [ ! -f "$file" ]; then
    echo "file not found: $file" >&2
    return 1
  fi

  if [ -n "$func" ]; then
    cat "$file" | claude -p "explain the function '$func' in this file. what does it do, what are the inputs/outputs, and any non-obvious behavior. keep it under 200 words."
  else
    cat "$file" | claude -p "explain what this file does at a high level. what's its role in the project, what are the main exports, and how would someone use it. keep it under 200 words."
  fi
}
```

### usage

```bash
explain lib/auth.ts
explain lib/auth.ts validateToken
explain src/db/migrations/003_add_index.sql
```

---

## review() — code review with structured output

runs a code review on staged changes or a specific file. uses `--output-format stream-json` so you can parse the output programmatically or just read it.

```bash
review() {
  local target="${1:-staged}"

  if [ "$target" = "staged" ]; then
    local diff
    diff=$(git diff --cached)
    if [ -z "$diff" ]; then
      echo "no staged changes. stage files with git add first." >&2
      return 1
    fi
    echo "$diff" | claude -p "review this git diff. focus on:
1. bugs or logic errors
2. security issues
3. missing edge cases
4. naming/clarity issues

for each issue, cite the file and line. rate severity: critical/warning/nit.
skip style nitpicks unless they affect readability. be concise." --output-format stream-json
  else
    if [ ! -f "$target" ]; then
      echo "file not found: $target" >&2
      return 1
    fi
    cat "$target" | claude -p "review this code. focus on bugs, security issues, missing edge cases, and clarity problems. rate each issue as critical/warning/nit. be concise." --output-format stream-json
  fi
}
```

### usage

```bash
# review staged changes (default)
review

# review a specific file
review lib/auth.ts

# pipe stream-json to jq for just the text content
review | jq -r 'select(.type == "text") | .content'
```

### parsing stream-json output

the `stream-json` format emits newline-delimited JSON objects. useful for programmatic consumption:

```bash
# just the review text
review | jq -r 'select(.type == "text") | .content'

# get the cost
review | jq -r 'select(.type == "usage") | .usage'
```

---

## installation

add these functions to your shell config:

```bash
# add to ~/.zshrc or ~/.bashrc
source ~/path/to/claude-shell-functions.sh
```

or just paste them directly into your rc file.

after adding:

```bash
source ~/.zshrc  # or ~/.bashrc
```

---

## tips

- **use haiku for explain() and fix()** — they're fast lookups, not complex reasoning. add `--model claude-haiku-4-5` to the claude calls if you want to save tokens
- **pipe chains work** — `git log --oneline -20 | claude -p "summarize what happened this week"`
- **combine with watch** — `watch -n 60 'claude -p "check if my build server at localhost:3000 is responding" --model claude-haiku-4-5'` (dont actually do this lol but you could)
- **limit tools for safety** — `claude -p "..." --allowedTools Read,Grep` prevents the headless call from writing files
- **background review** — `review > /tmp/review.md &` runs the review in the background while you keep working

---

## more ideas

these are just starting points. anything you can pipe into stdin works with `claude -p`:

```bash
# explain a git conflict
git diff --merge | claude -p "explain this merge conflict and suggest a resolution"

# summarize test failures
npm test 2>&1 | claude -p "summarize what failed and why"

# translate error messages
kubectl logs pod-name | tail -50 | claude -p "what's going wrong with this pod?"
```

the pattern is always the same: `<some output> | claude -p "<what do you want to know>"`. once you internalize that, you start piping everything through claude
