# MCP servers for claude code

**practical guide to connecting claude code to external tools via MCP.**

---

## what MCP servers are and why they matter

model context protocol. it lets claude call tools hosted by external servers -- browsers, databases, APIs, documentation lookups, whatever. an MCP server exposes tools with a schema, claude discovers them at session start, and calls them like built-in tools. the tool shows up as `mcp__<server>__<tool>` in hooks and logs.

why it matters:
- claude's training data has a cutoff. MCP servers give it live information
- some tasks (browser testing, database queries, API calls) are clunky through Bash but native through MCP
- you can build custom tools tailored to your workflow and share them with your team
- MCP tools are discoverable -- claude sees them in its tool list and knows when to use them

you configure MCP servers in `settings.json` and they're available in every session for that scope.

---

## configuring MCP servers

MCP servers go in your `settings.json`. they can be user-level (all projects) or project-level.

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["@some-org/mcp-server-package"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

settings file locations:

| file | scope |
|---|---|
| `~/.claude/settings.json` | all projects on your machine |
| `.claude/settings.json` | this project (shared with team) |
| `.claude/settings.local.json` | this project (gitignored, your overrides) |

put API keys in `settings.local.json` so they don't get committed.

### verifying servers are connected

start a claude session and run `/mcp`. it shows all connected servers and their available tools. if a server isn't listed, check the command path and that the package is installed.

---

## playwright MCP

**the recommended browser automation server.** testing, scraping, visual verification, screenshot comparison.

### why playwright MCP over chrome extensions

the chrome extension MCP exists. i've tried it. it's unreliable -- disconnects mid-session, misses elements on dynamic pages, can't handle SPAs that render client-side, and has timing issues with pages that load async content.

playwright MCP is the move. it controls a real browser programmatically. no flaky connections, no missed elements, deterministic behavior.

### setup

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-playwright"]
    }
  }
}
```

add this to `~/.claude/settings.json` (global) or `.claude/settings.json` (project).

### what you can do with it

```
open localhost:3000 and check if the login form renders correctly
```

```
navigate to the dashboard, click the settings tab, and verify the form fields match our schema
```

```
take a screenshot of the signup page at mobile viewport (375px wide)
```

```
fill out the registration form with test data and submit. verify the success page loads
```

### the real power move: writing actual playwright scripts

using playwright MCP interactively is fine for exploration. but for anything you'll do more than once, have claude write a real playwright test:

```
write a playwright test that:
1. navigates to /login
2. fills in test@example.com and password123
3. clicks submit
4. verifies the dashboard loads with the user's name
5. checks that the sidebar navigation has all expected links

put it in tests/e2e/login.spec.ts
```

now you have a permanent, reproducible test that runs in CI:

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page.locator('.dashboard-header')).toContainText('Welcome');

  const navLinks = page.locator('.sidebar-nav a');
  await expect(navLinks).toHaveCount(5);
});
```

the workflow: use playwright MCP to explore and understand the page structure, then have claude write permanent test scripts from what it learned. MCP for exploration, scripts for automation.

the hierarchy:
1. **best**: actual playwright test scripts (permanent, reproducible, CI-friendly)
2. **good**: playwright MCP for one-off exploration and ad-hoc testing
3. **avoid**: chrome extension MCP tools

### hooking into playwright MCP calls

you can use hooks to intercept MCP tool calls:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__playwright__.*",
        "hooks": [
          {"type": "command", "command": "~/.claude/hooks/log-browser-action.sh"}
        ]
      }
    ]
  }
}
```

the matcher `mcp__playwright__.*` catches all playwright MCP tools. useful for auditing what pages claude visits.

---

## context7

**live documentation lookup.** instead of relying on training data (which might be months old), context7 fetches current docs from the source.

### setup

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

### when to use it

- checking the latest API for a library you don't use often
- verifying that a function signature hasn't changed in a recent release
- looking up config options for tools like vite, tailwind, prisma
- any time you'd normally tab out to docs.whatever.com
- migrating between library versions and need to know what changed

### example

```
use context7 to check the latest next.js 15 docs for the app router middleware API.
then update our middleware.ts to use the current API.
```

without context7, claude might give you the next.js 13 middleware API (from training data). with context7, it pulls the live docs.

works best for popular libraries with good documentation. less useful for niche or poorly-documented packages.

---

## writing your own MCP server

for when the existing servers don't cover your workflow. an MCP server is just a program that speaks the MCP protocol over stdio.

### the simplest possible MCP server (node)

```typescript
// my-mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-tools", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// define a tool
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "check_deploy_status",
      description: "Check the current deploy status of a service by name",
      inputSchema: {
        type: "object",
        properties: {
          service: { type: "string", description: "Service name to check" }
        },
        required: ["service"]
      }
    }
  ]
}));

// handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "check_deploy_status") {
    const service = request.params.arguments?.service;
    // your logic here -- hit an API, check a database, whatever
    const status = await fetchDeployStatus(service);
    return {
      content: [{ type: "text", text: JSON.stringify(status) }]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// start
const transport = new StdioServerTransport();
await server.connect(transport);
```

### register it

```json
{
  "mcpServers": {
    "my-tools": {
      "command": "npx",
      "args": ["tsx", "/path/to/my-mcp-server.ts"]
    }
  }
}
```

for HTTP-based servers (useful for shared/remote tools):

```json
{
  "mcpServers": {
    "my-remote-tool": {
      "type": "url",
      "url": "https://my-mcp-server.example.com/mcp"
    }
  }
}
```

### when to build your own

- you have internal APIs that claude should be able to query (deploy status, feature flags, metrics)
- you want to wrap a CLI tool with better ergonomics (instead of claude running 5 bash commands, give it one MCP tool)
- you need to enforce access controls that bash can't (read-only database access, API rate limiting)
- you want to share tools across your team (commit the MCP server to your repo)

### when not to bother

- a Bash command would do the same thing (just let claude run the command)
- the tool is a simple HTTP call (use WebFetch or curl)
- you'd only use it once (not worth the setup)

### tips for writing good MCP tools

- **one tool, one job.** don't make a tool that does 10 things based on a "mode" parameter. make 10 tools
- **good descriptions matter.** claude reads the tool description to decide when to use it. "Check the current deploy status of a service by name" is better than "deploy_check"
- **validate inputs.** use JSON Schema properly. claude will send garbage sometimes
- **return structured data.** JSON is better than prose. claude can parse JSON; it guesses at prose
- **handle errors gracefully.** return an error message, don't crash. claude can work with "service not found" but not with a stack trace
- **keep it fast.** MCP tool calls happen in the middle of a conversation. a 30-second API call will frustrate everyone

---

## other useful MCP servers

### postgres / sqlite

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

gives claude direct database access. useful for debugging data issues, writing migrations, or exploring schema. **use read-only credentials** unless you want claude running UPDATE statements on your production db.

### filesystem (restricted access)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-filesystem", "/path/to/allowed/dir"]
    }
  }
}
```

restricts file access to specific directories. useful when you want claude to have access to docs or data files outside the project without giving it your whole filesystem.

---

## MCP vs hooks vs bash

sometimes you're not sure whether to use MCP, a hook, or just a bash command:

| situation | use |
|---|---|
| claude should be able to call it during conversation | MCP server |
| you want to intercept/validate claude's actions | hook |
| it's a one-off command | bash |
| it needs to run on every tool call automatically | hook |
| it connects to an external service with auth | MCP server |
| it's a simple shell script | bash |
| you want to share it with your team | MCP server (commit to repo) |
| it needs to block dangerous operations | hook (exit code 2) |

the overlap zone: you can do almost anything with Bash that you can do with MCP. the advantage of MCP is discoverability -- claude sees MCP tools in its tool list and knows when to use them. with Bash, you have to tell claude "run this command" or hope it figures it out.

---

## environment variables and secrets

some MCP servers need credentials. put them in `.claude/settings.local.json` (gitignored) to avoid committing secrets:

```json
{
  "mcpServers": {
    "my-db": {
      "command": "node",
      "args": ["./mcp-servers/db-query.js"],
      "env": {
        "DATABASE_URL": "postgres://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

---

## tips

- **scope servers appropriately.** a database tool should be project-level, not global. playwright can be global
- **use hooks to audit MCP calls.** match `mcp__.*` in PreToolUse to log or block specific MCP tool invocations
- **MCP tools count toward permissions.** if you're in default permission mode, claude will ask before calling MCP tools that modify state
- **check server health.** if an MCP server crashes mid-session, its tools disappear. claude won't tell you -- it just stops using them. restart the session
- **keep servers lightweight.** MCP servers run as child processes. a heavy server slows down session startup

---

*for MCP server development, see the [MCP specification](https://spec.modelcontextprotocol.io/) and the [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk). for claude code's MCP integration, see the [official docs](https://docs.anthropic.com/en/docs/claude-code/mcp-servers).*
