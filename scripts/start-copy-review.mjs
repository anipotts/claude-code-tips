import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const requestedRoot = process.cwd();
const useMain = process.env.COPY_REVIEW_MAIN === '1';
let root = requestedRoot;

if (useMain) {
  const worktrees = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: requestedRoot, encoding: 'utf8' }).trim().split('\n\n');
  const main = worktrees.map((record) => Object.fromEntries(record.split('\n').map((line) => [line.split(' ')[0], line.slice(line.indexOf(' ') + 1)]))).find((record) => record.branch === 'refs/heads/main');
  if (main?.worktree) root = main.worktree;
}

const astro = path.join(root, 'node_modules/astro/bin/astro.mjs');
const child = spawn(process.execPath, [astro, 'dev', '--host', '127.0.0.1', '--port', '4330', '--open', '/__copy-review/'], { cwd: root, stdio: 'inherit', env: { ...process.env, COPY_REVIEW_ENABLED: '1' } });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exit(code ?? 0); });
