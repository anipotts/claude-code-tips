<!-- tested with: claude code v2.1.94 -->

# plugins

a plugin is a portable bundle of claude code customizations. hooks, commands, skills, agents, all in one package you can install with a single command.

## what a plugin is

at its core, a plugin is a `.claude-plugin/plugin.json` manifest plus one or more directories:

```
my-plugin/
  .claude-plugin/
    plugin.json      # name, version, hooks, commands
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
        "matcher": "Bash",
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
mkdir .claude-plugin
cat > .claude-plugin/plugin.json << 'EOF'
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
/plugin marketplace add ./my-plugin
```

## distributing via marketplace

to share your plugin, create a marketplace. push your plugin to github, then create a `.claude-plugin/marketplace.json`:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "your-marketplace",
  "owner": { "name": "your name" },
  "plugins": [
    {
      "name": "my-plugin",
      "description": "what it does",
      "source": { "source": "github", "repo": "yourname/my-plugin" }
    }
  ]
}
```

then anyone can install:

```bash
/plugin marketplace add yourname/your-marketplace-repo
/plugin install my-plugin@your-marketplace
```

two steps: add the marketplace (once), then install individual plugins from it.

## when to extract a plugin

the signal is copy-pasting. if you're copying the same hook between projects, it's time for a plugin.

my threshold: three files. one hook in a project is fine. two hooks, maybe. once you hit three related files doing the same job across repos, extract.

my first extraction was mine (session analytics). i had the same SQLite parsing script copy-pasted across a few projects, each slightly different, each falling behind when i improved one copy. the hook that feeds session data was duplicated in every project's settings. once i hit the third copy, i extracted everything into a plugin: one hook dispatcher, one parser, one schema, one skill definition. now it's installed globally and every session feeds the same database. the rule of three works. one copy is fine. two copies, tolerable. three copies of the same hook across repos and you're maintaining divergent forks of your own tooling.

## this repo is a marketplace

this repo is a plugin marketplace. check `/.claude-plugin/marketplace.json`. to install the mine plugin:

```bash
/plugin marketplace add anipotts/claude-code-tips
/plugin install mine@anipotts
```

## try it

1. create a single-hook plugin using the template above
2. test locally with `/plugin marketplace add ./your-plugin`
3. push to github, create a marketplace.json, and share with `/plugin marketplace add yourname/repo`

[example plugins (handoff, broadcast) &rarr;](../../examples/plugins/)
