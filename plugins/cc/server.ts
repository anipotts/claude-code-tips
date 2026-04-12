#!/usr/bin/env npx tsx
/**
 * cc MCP server + channel — cross-session awareness and real-time messaging.
 *
 * As an MCP server: exposes cc_peers, cc_roster, cc_send tools.
 * As a channel: polls mailbox and pushes messages into the session via
 * notifications/claude/channel — Claude sees them immediately.
 *
 * Primary data: ~/.claude/sessions/*.json (Claude Code's concurrentSessions)
 * Enrichment: ~/.claude/cc/enrich/{sessionId}.json
 * Mailbox: ~/.claude/cc/mailbox/{sessionId}.json
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

const CLAUDE_DIR =
  process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const SESSIONS_DIR = path.join(CLAUDE_DIR, "sessions");
const ENRICH_DIR = path.join(CLAUDE_DIR, "cc", "enrich");
const MAILBOX_DIR = path.join(CLAUDE_DIR, "cc", "mailbox");
const POLL_INTERVAL_MS = 2000;

// Discover our session ID: env var first, then match parent PID to session registry
function discoverSessionId(): string {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  // Walk up process tree to find a PID that matches a session file
  let pid = process.ppid;
  for (let i = 0; i < 5; i++) {
    const f = path.join(SESSIONS_DIR, `${pid}.json`);
    try {
      const data = JSON.parse(fs.readFileSync(f, "utf-8"));
      if (data.sessionId) return data.sessionId;
    } catch {}
    // Try parent's parent via ps
    try {
      const ppid = execSync(`ps -o ppid= -p ${pid}`, { encoding: "utf-8", timeout: 500 }).trim();
      if (!ppid || ppid === "0" || ppid === "1") break;
      pid = parseInt(ppid, 10);
    } catch { break; }
  }
  return "";
}

const MY_SESSION_ID = discoverSessionId();

// --- Types ---

type SessionFile = {
  pid: number;
  sessionId: string;
  cwd: string;
  name?: string;
  kind?: string;
  startedAt?: number;
};

type Session = SessionFile & {
  busy: boolean;
  files: string[];
  task: string;
};

type InboxMessage = {
  from: string;
  text: string;
  timestamp: string;
  read: boolean;
  summary?: string;
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

function getCpu(pid: number): number {
  try {
    return (
      parseFloat(
        execSync(`ps -p ${pid} -o %cpu=`, {
          encoding: "utf-8",
          timeout: 1000,
        }).trim()
      ) || 0
    );
  } catch {
    return 0;
  }
}

function readLiveSessions(): Session[] {
  let files: string[];
  try {
    files = fs.readdirSync(SESSIONS_DIR);
  } catch {
    return [];
  }
  const sessions: Session[] = [];
  for (const f of files) {
    if (!/^\d+\.json$/.test(f)) continue;
    const pid = parseInt(f.slice(0, -5), 10);
    if (!isAlive(pid)) continue;
    try {
      let raw = fs.readFileSync(path.join(SESSIONS_DIR, f), "utf-8").trim();
      // Fix truncated JSON from Claude Code's concurrent writes
      // Files are often padded with null bytes and trailing commas
      raw = raw.replace(/[\x00\s]+$/g, ""); // strip trailing nulls + whitespace
      if (!raw.endsWith("}")) {
        raw = raw.replace(/,\s*$/, "") + "}";
      }
      raw = raw.replace(/,\s*}/g, "}");
      const data: SessionFile = JSON.parse(raw);
      let enrichFiles: string[] = [];
      let enrichTask = "";
      try {
        const e = JSON.parse(
          fs.readFileSync(
            path.join(ENRICH_DIR, `${data.sessionId}.json`),
            "utf-8"
          )
        );
        enrichFiles = e.files || [];
        enrichTask = e.task || "";
      } catch {}
      sessions.push({
        ...data,
        pid,
        busy: getCpu(pid) > 5,
        files: enrichFiles,
        task: enrichTask,
      });
    } catch {
      continue;
    }
  }
  return sessions;
}

function findSession(query: string): Session | undefined {
  const sessions = readLiveSessions();

  // Support "project:name" syntax (e.g., "spring:interactive", "cc:YEO")
  if (query.includes(":")) {
    const [proj, name] = query.split(":", 2);
    return sessions.find(
      (s) => path.basename(s.cwd) === proj && (s.name === name || s.kind === name)
    );
  }

  // Exact name match (unique names like "DMS", "YEO")
  const byName = sessions.filter((s) => s.name === query);
  if (byName.length === 1) return byName[0];

  // Case-insensitive unique match
  const byNameCI = sessions.filter((s) => s.name?.toLowerCase() === query.toLowerCase());
  if (byNameCI.length === 1) return byNameCI[0];

  // Project name match (e.g., "spring" matches the session in ~/spring)
  const byProj = sessions.filter((s) => path.basename(s.cwd) === query);
  if (byProj.length === 1) return byProj[0];

  // Session ID prefix or PID
  return (
    sessions.find((s) => s.sessionId.startsWith(query)) ||
    sessions.find((s) => String(s.pid) === query)
  );
}

function readInbox(sessionId: string): InboxMessage[] {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(MAILBOX_DIR, `${sessionId}.json`), "utf-8")
    );
  } catch {
    return [];
  }
}

function writeInbox(sessionId: string, messages: InboxMessage[]): void {
  fs.mkdirSync(MAILBOX_DIR, { recursive: true });
  const p = path.join(MAILBOX_DIR, `${sessionId}.json`);
  const tmp = `${p}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(messages));
  fs.renameSync(tmp, p);
}

/**
 * Atomic read-modify-write for inbox with advisory file locking.
 * Prevents race conditions when multiple sessions write to the same mailbox.
 */
function lockedInboxUpdate(
  sessionId: string,
  updater: (msgs: InboxMessage[]) => InboxMessage[]
): void {
  fs.mkdirSync(MAILBOX_DIR, { recursive: true });
  const p = path.join(MAILBOX_DIR, `${sessionId}.json`);
  const lockPath = `${p}.lock`;
  const lockFd = fs.openSync(lockPath, "w");
  try {
    // Advisory exclusive lock (blocks until acquired)
    const { flockSync } = require("fs-ext") as { flockSync: (fd: number, flags: string) => void };
    flockSync(lockFd, "ex");
  } catch {
    // fs-ext not available — fall back to atomic rename (best-effort)
  }
  try {
    let msgs: InboxMessage[] = [];
    try {
      msgs = JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch {}
    const result = updater(msgs);
    const tmp = `${p}.tmp.${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(result));
    fs.renameSync(tmp, p);
  } finally {
    try {
      const { flockSync } = require("fs-ext") as { flockSync: (fd: number, flags: string) => void };
      flockSync(lockFd, "un");
    } catch {}
    fs.closeSync(lockFd);
  }
}

function readUnread(sessionId: string): InboxMessage[] {
  return readInbox(sessionId).filter((m) => !m.read);
}

function markRead(sessionId: string, deliveredTimestamps: Set<string>): void {
  // Only mark messages we actually delivered — prevents marking messages
  // that arrived between read and mark as "read" without delivery
  lockedInboxUpdate(sessionId, (msgs) => {
    for (const m of msgs) {
      if (!m.read && deliveredTimestamps.has(m.timestamp)) {
        m.read = true;
      }
    }
    return msgs;
  });
}

// --- Server with channel capability ---

const server = new Server(
  { name: "cc", version: "0.6.0" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
    instructions:
      "Messages from other Claude Code sessions arrive as " +
      '<channel source="cc" from="SESSION_NAME">. Read and acknowledge them. ' +
      "To reply, use the cc_send tool with the sender's name as the `to` parameter.",
  }
);

// --- Tools ---

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cc_peers",
      description:
        "Discover all live Claude Code sessions on this machine with busy/idle status.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cc_roster",
      description:
        "Show sessions for a specific project with file conflict detection.",
      inputSchema: {
        type: "object" as const,
        properties: {
          project: {
            type: "string",
            description: "Project name (defaults to cwd basename)",
          },
        },
      },
    },
    {
      name: "cc_send",
      description:
        "Send a message to another Claude Code session. They see it immediately if channels are enabled, or on their next prompt via hooks.",
      inputSchema: {
        type: "object" as const,
        properties: {
          to: { type: "string", description: "Recipient session name, ID prefix, or PID" },
          text: { type: "string", description: "Message content" },
          summary: { type: "string", description: "5-10 word preview" },
        },
        required: ["to", "text"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name } = req.params;
  const args = (req.params.arguments || {}) as Record<string, string>;

  if (name === "cc_peers") {
    const sessions = readLiveSessions();
    if (sessions.length === 0)
      return { content: [{ type: "text" as const, text: "No live sessions." }] };

    const busy = sessions.filter((s) => s.busy);
    const idle = sessions.filter((s) => !s.busy);
    const byProj = new Map<string, Session[]>();
    for (const s of sessions) {
      const proj = path.basename(s.cwd);
      if (!byProj.has(proj)) byProj.set(proj, []);
      byProj.get(proj)!.push(s);
    }

    const lines = [
      `cc — ${sessions.length} sessions (${busy.length} busy, ${idle.length} idle)`,
      "",
    ];
    for (const [proj, members] of byProj) {
      lines.push(`  ${proj} (${members.length})`);
      for (let i = 0; i < members.length; i++) {
        const m = members[i]!;
        const conn = i === members.length - 1 ? "└" : "├";
        const status = m.busy ? "▶" : "·";
        const n = m.name || m.kind || m.sessionId.slice(0, 8);
        const f = m.files.length > 0 ? `  ${m.files.slice(-3).join(", ")}` : "";
        const t = m.task ? `  "${m.task.slice(0, 50)}"` : "";
        lines.push(`  ${conn} ${status} ${n}${f}${t}`);
      }
      lines.push("");
    }
    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  }

  if (name === "cc_roster") {
    const proj = args.project || path.basename(process.cwd());
    const sessions = readLiveSessions();
    const matching = sessions.filter((s) => path.basename(s.cwd) === proj);
    if (matching.length === 0)
      return {
        content: [{ type: "text" as const, text: `No sessions on '${proj}'.` }],
      };

    const lines = [`[cc] ${matching.length} session(s) on '${proj}'`];
    const fileOwners = new Map<string, string[]>();
    for (const m of matching)
      for (const f of m.files) {
        if (!fileOwners.has(f)) fileOwners.set(f, []);
        fileOwners.get(f)!.push(m.name || m.sessionId.slice(0, 8));
      }
    for (const m of matching) {
      const status = m.busy ? "▶" : "·";
      const n = m.name || m.sessionId.slice(0, 8);
      const f = m.files.length > 0 ? m.files.slice(-3).join(", ") : "no files";
      const t = m.task ? ` — "${m.task.slice(0, 50)}"` : "";
      lines.push(`  └ ${status} ${n}  ${f}${t}`);
    }
    for (const [file, owners] of fileOwners)
      if (owners.length > 1)
        lines.push(`  !! ${owners.join(" + ")} both touching ${file}`);

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  }

  if (name === "cc_send") {
    const target = findSession(args.to);
    if (!target)
      return {
        content: [
          {
            type: "text" as const,
            text: `Session '${args.to}' not found. Use cc_peers to see available sessions.`,
          },
        ],
      };

    const sessions = readLiveSessions();
    const me = sessions.find((s) => s.sessionId === MY_SESSION_ID);
    const myName = me?.name || path.basename(process.cwd());

    lockedInboxUpdate(target.sessionId, (msgs) => {
      msgs.push({
        from: myName,
        text: args.text,
        timestamp: new Date().toISOString(),
        read: false,
        summary: args.summary,
      });
      return msgs;
    });

    return {
      content: [{ type: "text" as const, text: `Sent to ${target.name || args.to}.` }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// --- Connect ---

const transport = new StdioServerTransport();
await server.connect(transport);

// --- Channel: poll mailbox and push messages into session ---

if (MY_SESSION_ID) {
  setInterval(() => {
    try {
      const unread = readUnread(MY_SESSION_ID);
      if (unread.length === 0) return;

      // Batch all messages into a single channel notification
      // This reduces context overhead from N notifications to 1
      const deliveredTimestamps = new Set<string>();
      if (unread.length === 1) {
        const msg = unread[0]!;
        server.notification({
          method: "notifications/claude/channel",
          params: {
            content: msg.text,
            meta: {
              from: msg.from,
              ...(msg.summary ? { summary: msg.summary } : {}),
            },
          },
        });
        deliveredTimestamps.add(msg.timestamp);
      } else {
        // Batch: combine into one notification
        const lines = unread.map(
          (m) => `${m.from}: ${m.text}`
        );
        const senders = [...new Set(unread.map((m) => m.from))];
        server.notification({
          method: "notifications/claude/channel",
          params: {
            content: lines.join("\n"),
            meta: {
              from: senders.join(", "),
              summary: `${unread.length} messages from ${senders.join(", ")}`,
            },
          },
        });
        for (const m of unread) deliveredTimestamps.add(m.timestamp);
      }
      markRead(MY_SESSION_ID, deliveredTimestamps);
    } catch {
      // Non-fatal: mailbox might not exist yet
    }
  }, POLL_INTERVAL_MS);
}
