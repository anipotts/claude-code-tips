#!/usr/bin/env node
// cc-hook.mjs — session lifecycle for cc plugin

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const action = process.argv[2]; // "register" or "cleanup"
const sessionId = process.env.CLAUDE_SESSION_ID;
const ccDir = join(homedir(), ".claude", "cc", "inbox");

if (!sessionId) process.exit(0);

if (action === "register") {
  mkdirSync(join(ccDir, sessionId), { recursive: true });
} else if (action === "cleanup") {
  try {
    rmSync(join(ccDir, sessionId), { recursive: true, force: true });
  } catch {
    // already gone
  }
}
