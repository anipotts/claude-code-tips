// tested with: claude code v2.1.133 + bun 1.3

import { Database } from "bun:sqlite";
import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixtures: string[] = [];
const script = join(import.meta.dir, "..", "bin", "cc-quick");

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

function makeFixture(): {
  root: string;
  dbPath: string;
  now: number;
} {
  const root = mkdtempSync(join(tmpdir(), "cc-quick-"));
  fixtures.push(root);
  const ccDir = join(root, "channels", "cc");
  mkdirSync(ccDir, { recursive: true });
  const dbPath = join(ccDir, "sessions.db");
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      name TEXT,
      cwd TEXT,
      project_root TEXT,
      branch TEXT,
      worktree_root TEXT,
      role TEXT,
      pid INTEGER,
      started_at_ms INTEGER NOT NULL,
      last_seen_at_ms INTEGER NOT NULL,
      last_checked_at_ms INTEGER,
      ended_at_ms INTEGER
    );
    CREATE TABLE announcements (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail TEXT,
      created_at_ms INTEGER NOT NULL
    );
    CREATE TABLE recent_files (
      session_id TEXT NOT NULL,
      path TEXT NOT NULL,
      touched_at_ms INTEGER NOT NULL
    );
  `);
  const now = Date.now();
  const insert = db.prepare(
    `INSERT INTO sessions
      (id, cwd, branch, started_at_ms, last_seen_at_ms, ended_at_ms)
     VALUES (?, ?, ?, ?, ?, NULL)`,
  );
  insert.run("fresh-session", "/tmp/fresh", "main", now - 1000, now - 1000);
  insert.run("stale-session", "/tmp/stale", "main", now - 600000, now - 600000);
  db.close();
  return { root, dbPath, now };
}

describe("cc-quick live roster", () => {
  it("shows fresh rows and marks stale rows ended", () => {
    const fixture = makeFixture();
    const result = Bun.spawnSync(["bash", script, "roster"], {
      env: {
        ...process.env,
        CLAUDE_CODE_SESSION_ID: "fixture-caller",
        CLAUDE_CONFIG_DIR: fixture.root,
        CC_STALE_SESSION_MS: "300000",
      },
    });

    expect(result.exitCode).toBe(0);
    const output = result.stdout.toString();
    expect(output).toContain("fresh-se");
    expect(output).not.toContain("stale-se");

    const db = new Database(fixture.dbPath);
    const stale = db
      .query("SELECT last_seen_at_ms, ended_at_ms FROM sessions WHERE id = ?")
      .get("stale-session") as {
      last_seen_at_ms: number;
      ended_at_ms: number | null;
    };
    expect(stale.ended_at_ms).toBe(stale.last_seen_at_ms);
    db.close();
  });

  it("rejects a non-numeric stale-session window", () => {
    const fixture = makeFixture();
    const result = Bun.spawnSync(["bash", script, "roster"], {
      env: {
        ...process.env,
        CLAUDE_CODE_SESSION_ID: "fixture-caller",
        CLAUDE_CONFIG_DIR: fixture.root,
        CC_STALE_SESSION_MS: "unsafe",
      },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr.toString()).toContain(
      "CC_STALE_SESSION_MS must be a positive integer",
    );
  });
});
