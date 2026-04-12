#!/usr/bin/env npx tsx
/**
 * cc MCP server + channel — cross-session messaging for Claude Code.
 *
 * One tool ("cc") with two actions: peers + send.
 * fs.watch() on inbox directory for instant message delivery via channel.
 *
 * Data: ~/.claude/cc/inbox/{sessionId}/ (one file per message)
 * Sessions: ~/.claude/sessions/*.json (read-only, Claude Code native)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const CLAUDE_DIR =
  process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const SESSIONS_DIR = path.join(CLAUDE_DIR, "sessions");
const INBOX_DIR = path.join(CLAUDE_DIR, "cc", "inbox");
const MY_SESSION_ID = process.env.CLAUDE_SESSION_ID || "";

// --- Types ---

type SessionFile = {
  pid: number;
  sessionId: string;
  cwd: string;
  name?: string;
  kind?: string;
  startedAt?: number;
};

// --- Helpers ---

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLiveSessions(): SessionFile[] {
  let files: string[];
  try {
    files = fs.readdirSync(SESSIONS_DIR);
  } catch {
    return [];
  }
  const sessions: SessionFile[] = [];
  for (const f of files) {
    if (!/^\d+\.json$/.test(f)) continue;
    const pid = parseInt(f.slice(0, -5), 10);
    if (!isAlive(pid)) continue;
    try {
      let raw = fs.readFileSync(path.join(SESSIONS_DIR, f), "utf-8").trim();
      // fix truncated JSON from Claude Code's concurrent writes
      raw = raw.replace(/[\x00\s]+$/g, "");
      if (!raw.endsWith("}")) raw = raw.replace(/,\s*$/, "") + "}";
      raw = raw.replace(/,\s*}/g, "}");
      const data: SessionFile = JSON.parse(raw);
      sessions.push({ ...data, pid });
    } catch {
      continue;
    }
  }
  return sessions;
}

function findSession(query: string): SessionFile | undefined {
  const sessions = readLiveSessions();
  const q = query.toLowerCase();
  return (
    sessions.find((s) => s.name?.toLowerCase() === q) ||
    sessions.find((s) => s.name?.toLowerCase().includes(q)) ||
    sessions.find((s) => path.basename(s.cwd).toLowerCase() === q) ||
    sessions.find((s) => s.sessionId.startsWith(query))
  );
}

function hasInbox(sessionId: string): boolean {
  try {
    return fs.statSync(path.join(INBOX_DIR, sessionId)).isDirectory();
  } catch {
    return false;
  }
}

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

// --- Server ---

const server = new Server(
  { name: "cc", version: "1.0.0" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
    instructions:
      "Messages from other Claude Code sessions arrive as " +
      '<channel source="cc" from="SESSION_NAME">. Read and acknowledge them. ' +
      "To reply, use the cc tool with action send.",
  }
);

// --- Single tool: cc ---

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cc",
      description:
        "Cross-session messaging. Use action 'peers' to list sessions, or 'send' to message one.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["peers", "send"],
            description: "peers = list sessions, send = message a session",
          },
          to: {
            type: "string",
            description: "Recipient session name (for send)",
          },
          message: {
            type: "string",
            description: "Message text (for send)",
          },
        },
        required: ["action"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const args = (req.params.arguments || {}) as Record<string, string>;

  if (args.action === "peers") {
    const sessions = readLiveSessions();
    if (sessions.length === 0) return text("No live sessions found.");

    const lines = [`${sessions.length} session(s) active:`, ""];
    for (const s of sessions) {
      const name = s.name || s.kind || s.sessionId.slice(0, 8);
      const proj = path.basename(s.cwd);
      const cc = hasInbox(s.sessionId) ? " [cc]" : "";
      const me = s.sessionId === MY_SESSION_ID ? " (you)" : "";
      lines.push(`  ${name} — ${proj}${cc}${me}`);
    }
    return text(lines.join("\n"));
  }

  if (args.action === "send") {
    if (!args.to || !args.message) {
      return text("Both 'to' and 'message' are required for send.");
    }

    const target = findSession(args.to);
    if (!target) {
      const sessions = readLiveSessions();
      const names = sessions
        .map((s) => s.name || s.kind || s.sessionId.slice(0, 8))
        .join(", ");
      return text(
        `Session '${args.to}' not found. Available: ${names || "none"}`
      );
    }

    if (!hasInbox(target.sessionId)) {
      return text(
        `Session '${target.name || args.to}' doesn't have the cc plugin active.`
      );
    }

    // build message content
    const sessions = readLiveSessions();
    const me = sessions.find((s) => s.sessionId === MY_SESSION_ID);
    const myName = me?.name || path.basename(process.cwd());

    const body = `From: ${myName} (${MY_SESSION_ID})\n---\n${args.message}`;
    const filename = `${Date.now()}-${MY_SESSION_ID}.msg`;
    const targetDir = path.join(INBOX_DIR, target.sessionId);
    const tmpFile = path.join(targetDir, `.${filename}.tmp`);
    const finalFile = path.join(targetDir, filename);

    fs.writeFileSync(tmpFile, body);
    fs.renameSync(tmpFile, finalFile);

    return text(`Sent to ${target.name || args.to}.`);
  }

  return text("Unknown action. Use 'peers' or 'send'.");
});

// --- Connect ---

const transport = new StdioServerTransport();
await server.connect(transport);

// --- Channel: watch inbox for instant delivery ---

if (MY_SESSION_ID) {
  const myInbox = path.join(INBOX_DIR, MY_SESSION_ID);
  fs.mkdirSync(myInbox, { recursive: true });

  try {
    fs.watch(myInbox, (event, filename) => {
      if (!filename || !filename.endsWith(".msg")) return;
      const filePath = path.join(myInbox, filename);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        fs.unlinkSync(filePath); // consume it

        // parse header
        const sep = content.indexOf("\n---\n");
        const header = sep >= 0 ? content.slice(0, sep) : "";
        const body = sep >= 0 ? content.slice(sep + 5) : content;
        const fromMatch = header.match(/^From:\s*(.+?)(?:\s*\(|$)/);
        const from = fromMatch ? fromMatch[1] : "unknown";

        server.notification({
          method: "notifications/claude/channel",
          params: { content: body, meta: { from } },
        });
      } catch {
        // file may have been consumed already
      }
    });
  } catch (err) {
    process.stderr.write(`cc: inbox watch failed: ${err}\n`);
  }
} else {
  process.stderr.write("cc: CLAUDE_SESSION_ID not set, inbox disabled\n");
}
