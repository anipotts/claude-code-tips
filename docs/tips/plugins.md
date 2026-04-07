<!-- tested with: claude code v2.1.94 -->

# plugins

a plugin is a portable bundle of claude code customizations. hooks, commands, skills, agents, all in one package you can install with a single command.

## what a plugin is

at its core, a plugin is a `plugin.json` manifest plus one or more directories:

```
my-plugin/
  plugin.json       # name, version, hooks, commands
  hooks/             # lifecycle hooks (shell or LLM)
  commands/          # slash commands
  skills/            # skill definitions
  agents/            # agent configs
```

the manifest ties it together:

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "what it does in one line",
  "author": { "name": "your name" },
  "license": "MIT",
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/my-hook.sh"
          }
        ]
      }
    ]
  },
  "keywords": ["category", "relevant-tag"]
}
```

`${CLAUDE_PLUGIN_ROOT}` resolves to wherever the plugin is installed. use it for all internal paths.

## minimum viable plugin

you need exactly two things: one hook and one manifest.

```bash
mkdir my-plugin && cd my-plugin

# the hook
mkdir hooks
cat > hooks/safety.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')
if [[ "$tool" == "Bash" ]]; then
  cmd=$(echo "$input" | jq -r '.tool_input.command // empty')
  if echo "$cmd" | grep -qE 'rm\s+-rf\s+/'; then
    echo "blocked: rm -rf on root path" >&2
    exit 2
  fi
fi
exit 0
EOF
chmod +x hooks/safety.sh

# the manifest
cat > plugin.json << 'EOF'
{
  "name": "my-safety-plugin",
  "version": "0.1.0",
  "description": "blocks dangerous rm commands",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/safety.sh" }]
      }
    ]
  }
}
EOF
```

test it locally:

```bash
claude plugin add ./my-plugin
```

publish it by pushing to github, then anyone can install:

```bash
claude plugin add yourname/my-plugin
```

that's it. one hook, one manifest, installable everywhere.

## when to extract a plugin

the signal is copy-pasting. if you're copying the same hook between projects, it's time for a plugin.

my threshold: three files. one hook in a project is fine. two hooks, maybe. once you hit three related files doing the same job across repos, extract.

[FILL: story about extracting your first plugin. what hooks were you duplicating? how many repos had copies before you bundled it?]

## this repo is a plugin

this repo itself is a plugin. check `/.claude-plugin/plugin.json`. when you run `claude plugin add anipotts/claude-code-tips`, you get the hooks, commands, and agents as a single install.

the plugin manifest:

```json
{
  "name": "claude-code-tips",
  "version": "2.0.0",
  "description": "Claude Code toolkit"
}
```

## try it

1. create a single-hook plugin using the template above
2. test locally with `claude plugin add ./your-plugin`
3. push to github and install from remote with `claude plugin add yourname/repo`

[example plugins (handoff, broadcast) &rarr;](../../examples/plugins/)
