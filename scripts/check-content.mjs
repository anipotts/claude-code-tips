import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { resolveBun } from './runtime.mjs';

const root = process.cwd();
const startedAt = Date.now();
const bun = resolveBun();
const childEnvironment = {
  ...process.env,
  PATH: `${path.dirname(bun)}:${process.env.PATH ?? ''}`,
};
const checks = [
  [bun, ['run', 'check']],
  [bun, ['run', 'check:handbook']],
  [bun, ['run', 'check:completeness']],
  [bun, ['run', 'check:field-runs']],
  [bun, ['run', 'check:readme']],
  [bun, ['run', 'check:links']],
  ['python3', ['.github/scripts/check_sources.py']],
];
const results = [];
let failure = null;

for (const [command, args] of checks) {
  const label = [command, ...args].join(' ');
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: childEnvironment });
  const passed = result.status === 0;
  results.push({ command: label, passed });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (!passed) {
    failure = label;
    break;
  }
}

const status = {
  status: failure ? 'failed' : 'passed',
  checkedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  failure,
  results,
  workingTree: spawnSync('git', ['status', '--porcelain=v1'], { cwd: root, encoding: 'utf8' }).stdout ?? '',
};
const statusDirectory = path.join(root, '.astro');
await mkdir(statusDirectory, { recursive: true });
await writeFile(path.join(statusDirectory, 'copy-review-status.json'), `${JSON.stringify(status, null, 2)}\n`);

if (failure) {
  console.error(`content checks failed at: ${failure}`);
  process.exit(1);
}

console.log(`content checks passed in ${(status.durationMs / 1000).toFixed(1)}s`);
