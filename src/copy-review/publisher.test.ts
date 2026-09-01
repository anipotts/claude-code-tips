import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { findPublishRunByIdempotency, validateProtectionRuleset } from './publisher';
import type { PublishRun } from './types';

const qualifying = [{
  enforcement: 'active', conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } }, bypass_actors: [],
  rules: [
    { type: 'deletion' }, { type: 'non_fast_forward' }, { type: 'pull_request' }, { type: 'required_signatures' },
    { type: 'required_status_checks', parameters: { strict_required_status_checks_policy: true, required_status_checks: ['site', 'handbook', 'markdown', 'compatibility'].map((context) => ({ context })) } },
  ],
}];

describe('protected publisher gate', () => {
  test('accepts the exact protected current-head contract', () => expect(validateProtectionRuleset(qualifying)).toBe(true));
  test('rejects bypass actors, missing checks, and non-strict checks', () => {
    expect(validateProtectionRuleset([{ ...qualifying[0], bypass_actors: [{ actor_id: 1 }] }])).toBe(false);
    expect(validateProtectionRuleset([{ ...qualifying[0], rules: qualifying[0].rules.filter((rule) => rule.type !== 'required_signatures') }])).toBe(false);
    const relaxed = structuredClone(qualifying); relaxed[0].rules.at(-1)!.parameters!.strict_required_status_checks_policy = false;
    expect(validateProtectionRuleset(relaxed)).toBe(false);
  });
  test('reuses a persisted idempotent run after a server restart', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'copy-review-publisher-'));
    try {
      const directory = path.join(root, '.astro/copy-review-runs');
      await mkdir(directory, { recursive: true });
      const run: PublishRun = {
        id: '1fda08f0-5f7e-4463-85ec-4643523d71e3',
        idempotencyKey: 'batch-publish-12345',
        batchId: '4bbedaf1-fc64-448d-b2ec-603ab9625a25',
        status: 'complete',
        stage: 'github-pages-live',
        message: 'the exact merged copy is live and verified',
        startedAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:01:00.000Z',
        error: null,
        receipt: { mergeSha: 'abc123' },
      };
      await writeFile(path.join(directory, `${run.id}.json`), JSON.stringify(run));
      expect(await findPublishRunByIdempotency(root, run.idempotencyKey)).toEqual(run);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  test('stops an interrupted persisted run instead of duplicating its side effects', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'copy-review-interrupted-'));
    try {
      const directory = path.join(root, '.astro/copy-review-runs');
      await mkdir(directory, { recursive: true });
      const run: PublishRun = {
        id: '0c3578f9-6abc-4b63-bcf0-2fccf47a5ed8',
        idempotencyKey: 'interrupted-publish-12345',
        batchId: 'f27f9b39-ae68-4466-9f98-6d404d573794',
        status: 'running',
        stage: 'pushed-branch',
        message: 'pushing',
        startedAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:01:00.000Z',
        error: null,
        receipt: { commitSha: 'abc123' },
      };
      await writeFile(path.join(directory, `${run.id}.json`), JSON.stringify(run));
      const recovered = await findPublishRunByIdempotency(root, run.idempotencyKey);
      expect(recovered?.status).toBe('failed');
      expect(recovered?.error).toContain('interrupted');
      expect(recovered?.receipt.commitSha).toBe('abc123');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
