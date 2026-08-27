import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

export function resolveBun() {
  const candidates = [
    process.env.npm_execpath,
    process.env.BUN_INSTALL ? path.join(process.env.BUN_INSTALL, 'bin/bun') : undefined,
    path.join(os.homedir(), '.bun/bin/bun'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (path.basename(candidate) === 'bun' && existsSync(candidate)) return candidate;
  }

  return 'bun';
}
