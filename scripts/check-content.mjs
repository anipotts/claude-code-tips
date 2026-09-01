import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { resolveBun } from './runtime.mjs';

const root = process.cwd();
const bun = resolveBun();
const childEnvironment = {
  ...process.env,
  PATH: `${path.dirname(bun)}:${process.env.PATH ?? ''}`,
};
const checks = [
  [bun, ['run', 'test:copy-review']],
  [bun, ['run', 'check']],
  [bun, ['run', 'check:handbook']],
  [bun, ['run', 'check:completeness']],
  [bun, ['run', 'check:readme']],
  [bun, ['run', 'check:links']],
  ['python3', ['.github/scripts/check_sources.py']],
];
let failure = null;

for (const [command, args] of checks) {
  const label = [command, ...args].join(' ');
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: childEnvironment });
  const passed = result.status === 0;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (!passed) {
    failure = label;
    break;
  }
}

if (failure) {
  console.error(`content checks failed at: ${failure}`);
  process.exit(1);
}

console.log('content checks passed');
