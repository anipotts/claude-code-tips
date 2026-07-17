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



### v2.1.212: additional safety layers

v2.1.212 adds automatic safety controls beyond hook-based blocking:
- plan mode now requires permission prompts before executing file-modifying bash commands (`touch`, `rm`, etc.)
- WebSearch is capped at 200 calls per session (configurable via `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`) to stop search loops
- MCP tool calls running >2 minutes move to background automatically (configurable via `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`) so your session stays responsive

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
