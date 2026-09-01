import { randomUUID } from 'node:crypto';
import { execFile, execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildCatalog, isCopyReviewBranch, LEDGER_PATH, loadBatch, loadDocument, readLedger, saveBatch, writeLedger } from './model';
import type { PublishRun, PublishStage, ReviewLedger } from './types';

const execFileAsync = promisify(execFile);
const REPOSITORY = 'anipotts/coding-agent-tips';
const REQUIRED_CHECKS = new Set(['site', 'handbook', 'markdown', 'compatibility']);
const runs = new Map<string, PublishRun>();
const inFlight = new Map<string, Promise<void>>();

type CommandResult = { stdout: string; stderr: string };
export type PublisherCommandRunner = (command: string, args: string[], options?: { cwd?: string; maxBuffer?: number }) => Promise<CommandResult>;

const defaultRunner: PublisherCommandRunner = async (command, args, options = {}) => {
  const result = await execFileAsync(command, args, { cwd: options.cwd, encoding: 'utf8', maxBuffer: options.maxBuffer ?? 20 * 1024 * 1024, env: process.env });
  return { stdout: result.stdout, stderr: result.stderr };
};

const resolveBun = () => {
  const candidates = [process.env.npm_execpath, process.env.BUN_INSTALL ? path.join(process.env.BUN_INSTALL, 'bin/bun') : undefined, path.join(os.homedir(), '.bun/bin/bun')].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try { if (path.basename(candidate) === 'bun') { execFileSync('test', ['-x', candidate]); return candidate; } } catch {}
  }
  return 'bun';
};

const runFile = (root: string, id: string) => path.join(root, '.astro/copy-review-runs', `${id}.json`);
async function persist(root: string, run: PublishRun) {
  run.updatedAt = new Date().toISOString();
  runs.set(run.id, structuredClone(run));
  await mkdir(path.dirname(runFile(root, run.id)), { recursive: true });
  await writeFile(runFile(root, run.id), `${JSON.stringify(run, null, 2)}\n`, { mode: 0o600 });
}

async function advance(root: string, run: PublishRun, stage: PublishStage, message: string) {
  run.stage = stage;
  run.message = message;
  await persist(root, run);
}

const parseJson = <T>(value: string): T => JSON.parse(value) as T;
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function validateProtectionRuleset(rulesets: unknown) {
  if (!Array.isArray(rulesets)) return false;
  return rulesets.some((raw) => {
    const ruleset = raw as { enforcement?: string; conditions?: { ref_name?: { include?: string[] } }; rules?: Array<{ type?: string; parameters?: Record<string, unknown> }>; bypass_actors?: unknown[] };
    if (ruleset.enforcement !== 'active' || !ruleset.conditions?.ref_name?.include?.includes('~DEFAULT_BRANCH') || (ruleset.bypass_actors?.length ?? 0) > 0) return false;
    const types = new Set((ruleset.rules ?? []).map((rule) => rule.type));
    if (!types.has('deletion') || !types.has('non_fast_forward') || !types.has('pull_request') || !types.has('required_status_checks') || !types.has('required_signatures')) return false;
    const checksRule = ruleset.rules?.find((rule) => rule.type === 'required_status_checks');
    const parameters = checksRule?.parameters as { strict_required_status_checks_policy?: boolean; required_status_checks?: Array<{ context?: string }> } | undefined;
    if (!parameters?.strict_required_status_checks_policy) return false;
    const contexts = new Set(parameters.required_status_checks?.map((check) => check.context));
    return [...REQUIRED_CHECKS].every((context) => contexts.has(context));
  });
}

async function assertProtection(runner: PublisherCommandRunner) {
  const { stdout } = await runner('gh', ['api', `repos/${REPOSITORY}/rulesets`, '--paginate']);
  const summaries = parseJson<Array<{ id: number }>>(stdout);
  const full = [];
  for (const summary of summaries) full.push(parseJson((await runner('gh', ['api', `repos/${REPOSITORY}/rulesets/${summary.id}`])).stdout));
  if (!validateProtectionRuleset(full)) throw new Error('main protection no longer satisfies the protected publishing contract');
}

async function gitOutput(runner: PublisherCommandRunner, root: string, args: string[]) {
  return (await runner('git', args, { cwd: root })).stdout.trim();
}

async function expectedFiles(root: string) {
  const batch = await loadBatch(root);
  return new Set([...Object.values(batch.changes).map((change) => change.owner), LEDGER_PATH]);
}

async function assertOwnedChanges(root: string, runner: PublisherCommandRunner) {
  const allowed = await expectedFiles(root);
  const status = (await runner('git', ['status', '--porcelain=v1'], { cwd: root })).stdout.replace(/\n$/, '');
  const dirty = status.split('\n').filter(Boolean).map((line) => (line.slice(3).includes(' -> ') ? line.slice(3).split(' -> ').at(-1)! : line.slice(3)));
  const unrelated = dirty.filter((file) => !allowed.has(file));
  if (unrelated.length > 0) throw new Error(`publishing is blocked by unrelated working-tree changes: ${unrelated.join(', ')}`);
  return dirty;
}

async function approveExactBatch(root: string) {
  const batch = await loadBatch(root);
  const changes = Object.values(batch.changes);
  if (changes.length === 0) throw new Error('the review batch is empty');
  const ledger = await readLedger(root);
  const current = [];
  for (const change of changes) {
    const document = await loadDocument(root, change.owner);
    const block = document.blocks.find((candidate) => candidate.id === change.blockId);
    if (!block) throw new Error(`the reviewed block moved or disappeared: ${change.owner} ${change.blockId}`);
    if (block.fingerprint !== change.afterFingerprint) throw new Error(`the reviewed batch changed after it was opened: ${change.owner} ${change.blockId}`);
    const existing = ledger.entries[block.key];
    if (existing?.decision === 'needs-revision' && existing.fingerprint === block.fingerprint) throw new Error(`resolve the needs revision decision before publishing: ${change.owner} line ${block.lineStart}`);
    current.push({ change, block });
  }
  const now = new Date().toISOString();
  for (const { block } of current) ledger.entries[block.key] = { blockKey: block.key, owner: block.owner, blockId: block.id, decision: 'vetted', fingerprint: block.fingerprint, reviewedAt: now, batchId: batch.id };
  await writeLedger(root, ledger as ReviewLedger);
  return { batch, current };
}

async function waitForPullRequest(root: string, runner: PublisherCommandRunner, run: PublishRun, number: number) {
  const deadline = Date.now() + 30 * 60 * 1000;
  let lastUpdateSha = '';
  while (Date.now() < deadline) {
    const result = parseJson<{
      state: string;
      merged: boolean;
      merge_commit_sha: string | null;
      mergeable_state: string;
      head: { sha: string };
    }>((await runner('gh', ['api', `repos/${REPOSITORY}/pulls/${number}`])).stdout);
    if (result.merged && result.merge_commit_sha) return result.merge_commit_sha;
    if (result.state === 'closed') throw new Error('the publication pull request closed without merging');
    if (result.mergeable_state === 'behind' && result.head.sha !== lastUpdateSha) {
      await runner('gh', ['api', '--method', 'PUT', `repos/${REPOSITORY}/pulls/${number}/update-branch`, '-f', `expected_head_sha=${result.head.sha}`]);
      lastUpdateSha = result.head.sha;
      run.message = 'main advanced; updating the exact batch and rerunning required checks';
      await persist(root, run);
    }
    const checks = parseJson<{ check_runs: Array<{ name: string; status: string; conclusion: string | null }> }>((await runner('gh', ['api', `repos/${REPOSITORY}/commits/${result.head.sha}/check-runs`])).stdout).check_runs;
    const required = checks.filter((check) => REQUIRED_CHECKS.has(check.name));
    const failed = required.find((check) => check.status === 'completed' && check.conclusion !== 'success' && check.conclusion !== 'neutral' && check.conclusion !== 'skipped');
    if (failed) throw new Error(`required check failed: ${failed.name}`);
    const passed = new Set(required.filter((check) => check.status === 'completed' && check.conclusion === 'success').map((check) => check.name));
    run.message = `${passed.size} of ${REQUIRED_CHECKS.size} required checks passed`;
    await persist(root, run);
    await sleep(8_000);
  }
  throw new Error('timed out waiting for the protected pull request');
}

async function waitForPages(root: string, runner: PublisherCommandRunner, run: PublishRun, mergeSha: string) {
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    const workflowRuns = parseJson<Array<{ databaseId: number; headSha: string; status: string; conclusion: string | null; url: string }>>((await runner('gh', ['run', 'list', '--repo', REPOSITORY, '--workflow', 'deploy.yml', '--branch', 'main', '--limit', '15', '--json', 'databaseId,headSha,status,conclusion,url'])).stdout);
    const workflow = workflowRuns.find((candidate) => candidate.headSha === mergeSha);
    if (workflow?.conclusion === 'failure' || workflow?.conclusion === 'cancelled') throw new Error(`GitHub Pages workflow ${workflow.conclusion}`);
    if (workflow?.status === 'completed' && workflow.conclusion === 'success') {
      run.receipt.workflowUrl = workflow.url;
      return;
    }
    run.message = workflow ? 'GitHub Pages is deploying the merged commit' : 'waiting for the GitHub Pages workflow';
    await persist(root, run);
    await sleep(8_000);
  }
  throw new Error('timed out waiting for GitHub Pages');
}

async function verifyLiveRoutes(root: string, run: PublishRun) {
  const batch = await loadBatch(root);
  const routeExpectations = new Map<string, string[]>();
  for (const change of Object.values(batch.changes)) {
    if (!change.route || !change.plainText || change.beforeFingerprint === change.afterFingerprint) continue;
    const values = routeExpectations.get(change.route) ?? [];
    values.push(change.plainText);
    routeExpectations.set(change.route, values);
  }
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    const verified: string[] = [];
    for (const [route, expectations] of routeExpectations) {
      const response = await fetch(`https://agents.anipotts.com${route}?copy-review=${run.receipt.mergeSha}`, { cache: 'no-store' });
      if (!response.ok) continue;
      const text = (await response.text()).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').toLowerCase();
      if (expectations.every((expectation) => text.includes(expectation.replace(/\s+/g, ' ').toLowerCase()))) verified.push(route);
    }
    if (verified.length === routeExpectations.size) { run.receipt.liveRoutes = verified; return; }
    run.message = `verified ${verified.length} of ${routeExpectations.size} edited live routes`;
    await persist(root, run);
    await sleep(8_000);
  }
  throw new Error('the Pages deployment succeeded, but the edited live routes did not match before verification timed out');
}

async function publish(root: string, run: PublishRun, runner: PublisherCommandRunner) {
  const bun = resolveBun();
  try {
    const catalog = await buildCatalog(root);
    if (!isCopyReviewBranch(catalog.repository.branch)) throw new Error('publishing requires an editor-owned codex/copy-review branch');
    if (!catalog.batch.branch || catalog.batch.branch !== catalog.repository.branch) throw new Error('the active review batch does not own the current branch');
    await assertProtection(runner);
    await assertOwnedChanges(root, runner);
    await advance(root, run, 'local-draft', 'validating the exact local batch');
    await runner(bun, ['run', 'check:content'], { cwd: root, maxBuffer: 50 * 1024 * 1024 });
    const { batch } = await approveExactBatch(root);
    await advance(root, run, 'validated', 'content checks passed and the exact batch is approved');
    const dirty = await assertOwnedChanges(root, runner);
    if (dirty.length === 0) throw new Error('the approved batch has no repository changes');
    await runner('git', ['add', '--', ...[...new Set([...Object.values(batch.changes).map((change) => change.owner), LEDGER_PATH])]], { cwd: root });
    await runner('git', ['commit', '-S', '-m', 'docs: approve copy review batch', '-m', `Reviewed in local copy review batch ${batch.id}.\n\nVerification: bun run check:content`], { cwd: root });
    let commitSha = await gitOutput(runner, root, ['rev-parse', 'HEAD']);
    run.receipt.commitSha = commitSha;
    run.receipt.branch = catalog.repository.branch;
    await advance(root, run, 'signed-commit', 'created the signed batch commit');
    await runner('git', ['fetch', 'origin', 'main'], { cwd: root });
    const mergeBase = await gitOutput(runner, root, ['merge-base', 'HEAD', 'origin/main']);
    const originMain = await gitOutput(runner, root, ['rev-parse', 'origin/main']);
    if (mergeBase !== originMain) {
      await runner('git', ['rebase', 'origin/main'], { cwd: root });
      await runner(bun, ['run', 'check:content'], { cwd: root, maxBuffer: 50 * 1024 * 1024 });
      commitSha = await gitOutput(runner, root, ['rev-parse', 'HEAD']);
      run.receipt.commitSha = commitSha;
      await persist(root, run);
    }
    await runner('git', ['push', '--set-upstream', 'origin', catalog.repository.branch], { cwd: root });
    const verification = parseJson<{ commit: { verification: { verified: boolean; reason: string } } }>((await runner('gh', ['api', `repos/${REPOSITORY}/commits/${commitSha}`])).stdout).commit.verification;
    if (!verification.verified) throw new Error(`GitHub did not verify the signed commit: ${verification.reason}`);
    await advance(root, run, 'pushed-branch', 'pushed the GitHub-verified batch branch');
    await assertProtection(runner);
    const bodyPath = path.join(root, '.astro', `copy-review-pr-${batch.id}.md`);
    const routes = [...new Set(Object.values(batch.changes).map((change) => change.route).filter(Boolean))];
    const owners = [...new Set(Object.values(batch.changes).map((change) => change.owner))];
    const body = `## rationale\n\napprove the exact local copy review batch across ${routes.length} public routes.\n\n## evidence\n\n- reviewed routes: ${routes.join(', ') || 'shared interface copy'}\n- canonical owners: ${owners.join(', ')}\n- review batch: ${batch.id}\n\n## verification\n\n- [x] bun run check:content\n- [x] GitHub verified the signed commit\n- [ ] protected current-head checks\n- [ ] GitHub Pages live verification\n\n## boundary\n\nmerge activates the reviewed copy through the protected GitHub Pages workflow.\n`;
    await writeFile(bodyPath, body, { mode: 0o600 });
    await runner('gh', ['pr', 'create', '--repo', REPOSITORY, '--base', 'main', '--head', catalog.repository.branch, '--title', 'Approve local copy review batch', '--body-file', bodyPath]);
    const pr = parseJson<{ number: number; url: string }>((await runner('gh', ['pr', 'view', catalog.repository.branch, '--repo', REPOSITORY, '--json', 'number,url'])).stdout);
    run.receipt.pullRequestNumber = pr.number;
    run.receipt.pullRequestUrl = pr.url;
    await advance(root, run, 'pull-request', `opened protected pull request #${pr.number}`);
    await assertProtection(runner);
    await runner('gh', ['pr', 'merge', String(pr.number), '--repo', REPOSITORY, '--auto', '--merge']);
    await advance(root, run, 'required-checks', 'auto-merge is waiting for strict required checks');
    const mergeSha = await waitForPullRequest(root, runner, run, pr.number);
    run.receipt.mergeSha = mergeSha;
    await advance(root, run, 'merged', `merged the protected pull request at ${mergeSha.slice(0, 7)}`);
    await waitForPages(root, runner, run, mergeSha);
    run.receipt.deploymentUrl = 'https://agents.anipotts.com/';
    await verifyLiveRoutes(root, run);
    await advance(root, run, 'github-pages-live', 'the exact merged copy is live and verified');
    run.status = 'complete';
    await persist(root, run);
    try {
      await runner('git', ['switch', 'main'], { cwd: root });
      await runner('git', ['pull', '--ff-only', 'origin', 'main'], { cwd: root });
      await runner('git', ['branch', '-d', catalog.repository.branch], { cwd: root });
      const now = new Date().toISOString();
      await saveBatch(root, { id: randomUUID(), branch: null, baseSha: mergeSha, createdAt: now, updatedAt: now, changes: {} });
    } catch {
      run.message = 'publication is live; local branch cleanup needs attention';
      await persist(root, run);
    }
  } catch (error) {
    run.status = 'failed';
    run.error = error instanceof Error ? error.message : String(error);
    run.message = run.error;
    await persist(root, run);
  }
}

export async function startPublish(root: string, idempotencyKey: string, runner: PublisherCommandRunner = defaultRunner) {
  if (!/^[a-zA-Z0-9_-]{12,128}$/.test(idempotencyKey)) throw new Error('invalid publication idempotency key');
  for (const run of runs.values()) if (run.idempotencyKey === idempotencyKey) return run;
  const run: PublishRun = { id: randomUUID(), idempotencyKey, batchId: (await loadBatch(root)).id, status: 'running', stage: 'local-draft', message: 'preparing the exact review batch', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: null, receipt: {} };
  await persist(root, run);
  const task = publish(root, run, runner).finally(() => inFlight.delete(run.id));
  inFlight.set(run.id, task);
  return run;
}

export async function getPublishRun(root: string, id: string) {
  const memory = runs.get(id);
  if (memory) return memory;
  try { return JSON.parse(await readFile(runFile(root, id), 'utf8')) as PublishRun; } catch { return null; }
}

export async function waitForPublishForTest(id: string) { await inFlight.get(id); }
