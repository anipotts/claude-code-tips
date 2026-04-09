<!-- tested with: claude code v2.1.94 -->

# mcp integration

model context protocol lets you extend what claude code can see and do. but you probably don't need it.

## start with zero

honestly, don't worry too much about MCP servers. they blow context. every MCP server registers its tools in the system prompt, and that prompt bloat compounds when you're using subagents, because each subagent inherits the full tool list. subagents need as much context as they can get for actual work, not for tool definitions they'll never use.

start with zero MCP servers. add one only when you hit a task that genuinely can't be done with the built-in tools. most people never need any.

i run a handful (Playwright for browser automation, Google Workspace, AppleScript), and even that's more than most people need. my cache hit rate stays high because the server set is stable between sessions, but if you're constantly adding and removing servers, your cache hit rate will tank.

## if you do need one

one command:

```bash
claude mcp add <name> -- <command> <args>
```

real example:

```bash
claude mcp add imessage -- npx -y imessage-mcp
```

for project-level config, add an `.mcp.json` file to your repo root:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/mydb"
      }
    }
  }
}
```

anyone who clones the repo gets the same MCP setup. no manual `claude mcp add` needed.

## three patterns

### 1. read-only data access

give claude eyes into systems it can't normally see. the server exposes read tools, claude queries them. these are the safest MCP servers bc they can't modify anything. pair them with `readOnlyHint` annotations for auto-approval.

### 2. action tools

let claude trigger real operations. deployments, CI pipelines, API calls. higher risk. every action tool should have clear guardrails.

### 3. hybrid (read + act)

servers that both observe and modify. playwright is the canonical example: claude reads the page (screenshots, DOM), then acts on it (click, type, navigate). the feedback loop is powerful but the context cost is high.

## gotchas

**startup latency.** MCP servers launch on first tool call. the first invocation takes 1-5 seconds. subsequent calls are fast.

**system prompt bloat.** more tools means a larger prompt prefix. this hurts cache hit rates if the tool set changes between sessions. keep your active server count minimal.

**`readOnlyHint` for auto-approval.** MCP tools with the `readOnlyHint` annotation skip the confirmation step. set this on every read-only tool your server exposes. it removes friction without adding risk.

**environment variables.** use the `env` field in `.mcp.json` for secrets. never hardcode credentials in the command args.

## try it

only if you actually need to. if the built-in tools (Read, Write, Edit, Bash, Grep, Glob) do the job, you don't need MCP.

[imessage-mcp (real example) &rarr;](https://github.com/anipotts/imessage-mcp)
