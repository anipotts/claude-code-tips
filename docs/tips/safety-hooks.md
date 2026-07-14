<!-- tested with: claude code v2.1.122 -->

# safety hooks in 5 minutes

block force pushes, `rm -rf /`, DROP TABLE, and `curl | bash` with one hook script.

## setup

1. copy the script:

```bash
cp hooks/safety-guard.sh ~/.claude/hooks/safety-guard.sh
chmod +x ~/.claude/hooks/safety-guard.sh
```

2. register it in your global settings:

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/safety-guard.sh"
          }
        ]
      }
    ]
  }
}
```

3. done. every Bash command claude runs now gets checked first.

## what it blocks

| pattern | why |
|---------|-----|
| `git push --force` to main/master | protects shared branches |
| `rm -rf /` and variants | prevents catastrophic deletes |
| `DROP TABLE`, `DROP DATABASE` | protects databases |
| `chmod 777` on sensitive paths | prevents permission disasters |
| `curl \| bash`, `wget \| sh` | blocks remote code execution |



**note (v2.1.160+):** in addition to safety-guard.sh blocking, claude code now prompts before writing to shell startup files and build-tool config files. this provides a second layer of protection for sensitive writes.



### screen reader compatibility (v2.1.208+)

if you run claude code with `--ax-screen-reader` or `CLAUDE_AX_SCREEN_READER=1` for accessibility, safety-guard.sh output remains functional. however, the hook's exit codes (0, 2) are what matter to claude — the stderr message is for your logs, not for screen reader users. if you're integrating with a screen reader, test that hook blocks still work as expected (exit 2 should always block, regardless of terminal rendering mode).

## how it works

the hook receives JSON on stdin with the tool name and input. it checks the bash command against known dangerous patterns. exit 0 = allow, exit 2 = block.

```bash
#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# check for dangerous patterns
if echo "$CMD" | grep -qiE 'push.*--force|push.*-f'; then
  echo "blocked: force push detected" >&2
  exit 2
fi
```

the full [safety-guard.sh](../../hooks/safety-guard.sh) covers 6 categories. this example shows the pattern.

## try it

after setup, test it:

```
> run: git push --force origin main
```

claude will see: "blocked: force push detected" and won't execute it.

[full hooks guide &rarr;](../hooks.md)
