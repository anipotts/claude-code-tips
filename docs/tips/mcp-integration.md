<!-- tested with: claude code v2.1.94 -->

# mcp integration

model context protocol is how you extend what claude code can see and do. not just a spec. it's the mechanism for giving claude access to databases, APIs, browsers, and anything else that speaks the protocol.

## setup

one command:

```bash
claude mcp add <name> -- <command> <args>
```

real example:

```bash
claude mcp add imessage -- npx -y imessage-mcp
```

that registers a server called `imessage` that claude can now call tools from. the server starts when claude needs it and stays running for the session.

for project-level config, add an `.mcp.json` file to your repo root:

```json
{
  "mcpServers": {
    "imessage": {
      "command": "npx",
      "args": ["-y", "imessage-mcp"]
    },
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

give claude eyes into systems it can't normally see. the server exposes read tools, claude queries them.

examples: imessage-mcp (search and read messages), database inspectors (schema and query access), log viewers.

these are the safest MCP servers bc they can't modify anything. pair them with `readOnlyHint` annotations for auto-approval.

### 2. action tools

let claude trigger real operations. deployments, CI pipelines, API calls, file system operations beyond the local repo.

examples: deployment triggers, github actions, cloud resource management.

higher risk. every action tool should have clear guardrails. consider wrapping destructive operations behind confirmation hooks.

### 3. hybrid (read + act)

servers that both observe and modify. the most powerful pattern, and the most dangerous.

the canonical example is playwright. claude reads the page (screenshots, DOM inspection), then acts on it (click, type, navigate). the feedback loop between reading and acting is what makes it effective.

other hybrids: CMS tools that read content and publish updates, monitoring tools that read metrics and trigger alerts.

## gotchas

**startup latency.** MCP servers are processes that launch on first tool call. the first invocation takes 1-5 seconds while the server boots. subsequent calls are fast. if you run many servers, first-call latency stacks.

**system prompt bloat.** every MCP server registers its tools in the system prompt. more tools means a larger prompt prefix. this can hurt cache hit rates if the tool set changes between sessions. keep your active server count reasonable.

[FILL: how many MCP servers do you run in a typical session? which ones? what's the impact on cache hit rate with all of them loaded?]

**`readOnlyHint` for auto-approval.** MCP tools with the `readOnlyHint` annotation can be auto-approved, skipping the confirmation step. set this on every read-only tool your server exposes. it removes friction without adding risk.

**environment variables.** use the `env` field in `.mcp.json` for secrets. never hardcode credentials in the command args. for local dev, point to a `.env` file or use your system keychain.

## try it

1. install one MCP server: `claude mcp add imessage -- npx -y imessage-mcp`
2. ask claude to use it in your next session. watch the first-call latency, then the speed of subsequent calls
3. add an `.mcp.json` to a project repo so teammates get the same tools automatically

[imessage-mcp (real example) &rarr;](https://github.com/anipotts/imessage-mcp)
