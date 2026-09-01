import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildCatalog, editBlock, fingerprint, loadDocument, reviewBlock } from './model';

let fixture = '';
const repository = process.cwd();

beforeAll(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'copy-review-model-'));
  for (const entry of ['content', 'editorial']) await cp(path.join(repository, entry), path.join(fixture, entry), { recursive: true });
  await cp(path.join(repository, 'src/site.ts'), path.join(fixture, 'src/site.ts'), { recursive: true });
  execFileSync('git', ['init', '-b', 'feature'], { cwd: fixture });
  execFileSync('git', ['config', 'user.name', 'Copy Review Test'], { cwd: fixture });
  execFileSync('git', ['config', 'user.email', 'copy-review@example.test'], { cwd: fixture });
  execFileSync('git', ['add', '.'], { cwd: fixture });
  execFileSync('git', ['commit', '-m', 'fixture'], { cwd: fixture });
});

afterAll(async () => { if (fixture) await rm(fixture, { recursive: true, force: true }); });

async function expectFailure(operation: Promise<unknown>, message: string) {
  let failure: unknown;
  try {
    await operation;
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(Error);
  expect((failure as Error).message).toContain(message);
}

describe('copy review content model', () => {
  test('catalog starts with explicit needs-review coverage and keeps archive frozen', async () => {
    const catalog = await buildCatalog(fixture);
    expect(catalog.surfaces.length).toBeGreaterThan(25);
    expect(catalog.totals['needs-review']).toBeGreaterThan(100);
    expect(catalog.totals.vetted).toBe(0);
    expect(catalog.surfaces.find((surface) => surface.owner === 'content/archive/claude-code-tools.md')?.frozen).toBe(true);
  });

  test('parses markdown, interface, and evidence copy through constrained adapters', async () => {
    const markdown = await loadDocument(fixture, 'content/guides/codex/configuration.md');
    expect(markdown.blocks.some((block) => block.kind === 'frontmatter')).toBe(true);
    expect(markdown.blocks.some((block) => block.kind === 'heading')).toBe(true);
    expect(markdown.blocks.some((block) => block.kind === 'list')).toBe(true);
    const site = await loadDocument(fixture, 'src/site.ts');
    expect(site.blocks.find((block) => block.id === 'site:interfaceCopy.search')?.value).toBe('search');
    const evidence = await loadDocument(fixture, 'editorial/sources.json');
    expect(evidence.blocks.some((block) => block.id.includes('evidence_labels.tested.description'))).toBe(true);
    await expectFailure(loadDocument(fixture, '../../etc/passwd'), 'unknown writing surface');
  });

  test('uses exact fingerprints for atomic edits and review state', async () => {
    const owner = 'content/guides/codex/configuration.md';
    const initial = await loadDocument(fixture, owner);
    const paragraph = initial.blocks.find((block) => block.kind === 'paragraph')!;
    const nextValue = paragraph.value.replace('Codex loads', 'Copy review confirms Codex loads');
    const result = await editBlock(fixture, { owner, blockId: paragraph.id, baseFingerprint: paragraph.fingerprint, value: nextValue });
    const edited = result.document.blocks.find((block) => block.id === paragraph.id)!;
    expect(edited.value).toContain('Copy review confirms');
    expect(edited.status).toBe('needs-review');
    await expectFailure(editBlock(fixture, { owner, blockId: paragraph.id, baseFingerprint: paragraph.fingerprint, value: 'stale overwrite' }), 'content changed');
    const reviewed = await reviewBlock(fixture, { owner, blockId: edited.id, fingerprint: edited.fingerprint, decision: 'vetted' });
    expect(reviewed.document.blocks.find((block) => block.id === edited.id)?.status).toBe('vetted');
    const source = await readFile(path.join(fixture, owner), 'utf8');
    expect(fingerprint(source)).toMatch(/^[a-f0-9]{64}$/);
  });
});
