import type { APIRoute } from 'astro';
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildCatalog, editBlock, getSessionToken, loadBatch, loadDocument, reviewBlock } from '../copy-review/model';
import { getPublishRun, startPublish } from '../copy-review/publisher';
import { authorizeCopyReviewRequest, MAX_COPY_REVIEW_BODY, parseCopyReviewJson } from '../copy-review/security';
import type { ReviewDecision } from '../copy-review/types';

export const prerender = false;
const root = process.cwd();
const execFileAsync = promisify(execFile);
let mutationTail = Promise.resolve<unknown>(undefined);

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function authorize(request: Request, clientAddress: string, requireOrigin = false) {
  const expected = await getSessionToken(root);
  const token = request.headers.get('x-copy-review-token');
  authorizeCopyReviewRequest({ requestUrl: request.url, method: requireOrigin ? 'POST' : 'GET', token, expectedToken: expected, origin: request.headers.get('origin'), referer: request.headers.get('referer'), clientAddress });
}

async function body<T>(request: Request): Promise<T> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_COPY_REVIEW_BODY) throw new Error('request body is too large');
  const source = await request.text();
  return parseCopyReviewJson<T>(source, request.headers.get('content-type'));
}

async function locked<T>(operation: () => Promise<T>) {
  const next = mutationTail.then(operation, operation);
  mutationTail = next.catch(() => undefined);
  return next;
}

const resolveBun = () => {
  const candidates = [process.env.npm_execpath, process.env.BUN_INSTALL ? path.join(process.env.BUN_INSTALL, 'bin/bun') : undefined, path.join(os.homedir(), '.bun/bin/bun')].filter(Boolean) as string[];
  for (const candidate of candidates) if (path.basename(candidate) === 'bun') return candidate;
  return 'bun';
};

export const GET: APIRoute = async ({ params, request, clientAddress }) => {
  try {
    await authorize(request, clientAddress);
    const url = new URL(request.url);
    switch (params.action) {
      case 'catalog': return json(await buildCatalog(root));
      case 'document': {
        const owner = url.searchParams.get('owner');
        if (!owner) return json({ error: 'owner is required' }, 400);
        return json(await loadDocument(root, owner));
      }
      case 'batch': return json(await loadBatch(root));
      case 'run': {
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'run id is required' }, 400);
        const run = await getPublishRun(root, id);
        return run ? json(run) : json({ error: 'publication run was not found' }, 404);
      }
      default: return json({ error: 'unknown copy review action' }, 404);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 403);
  }
};

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  try {
    await authorize(request, clientAddress, true);
    switch (params.action) {
      case 'edit': {
        const input = await body<{ owner: string; blockId: string; baseFingerprint: string; value: string }>(request);
        return json(await locked(() => editBlock(root, input)));
      }
      case 'review': {
        const input = await body<{ owner: string; blockId: string; fingerprint: string; decision: ReviewDecision }>(request);
        if (input.decision !== 'vetted' && input.decision !== 'needs-revision') return json({ error: 'invalid review decision' }, 400);
        return json(await locked(() => reviewBlock(root, input)));
      }
      case 'validate': {
        await body<Record<string, never>>(request);
        const result = await locked(async () => {
          const startedAt = Date.now();
          try {
            const completed = await execFileAsync(resolveBun(), ['run', 'check:content'], { cwd: root, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
            return { status: 'passed', durationMs: Date.now() - startedAt, output: `${completed.stdout}${completed.stderr}`.trim().slice(-8_000) };
          } catch (error) {
            const failure = error as Error & { stdout?: string; stderr?: string };
            return { status: 'failed', durationMs: Date.now() - startedAt, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`.trim().slice(-8_000), error: failure.message };
          }
        });
        return json(result, result.status === 'passed' ? 200 : 422);
      }
      case 'publish': {
        const input = await body<{ idempotencyKey: string }>(request);
        return json(await locked(() => startPublish(root, input.idempotencyKey)), 202);
      }
      default: return json({ error: 'unknown copy review action' }, 404);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /cross-origin|token|loopback/.test(message) ? 403 : 409;
    return json({ error: message }, status);
  }
};
