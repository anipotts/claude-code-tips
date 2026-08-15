import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRepositoryEvidenceUrl } from './repository-evidence-url.mjs';

const repositoryBlobPrefix = 'https://github.com/anipotts/coding-agent-tips/blob/main/';
const baseUrl = `${repositoryBlobPrefix}docs/field-lab/runs/example-run/`;

test('resolves relative run evidence beneath the run directory', () => {
  assert.deepEqual(parseRepositoryEvidenceUrl('checks.md', { baseUrl, repositoryBlobPrefix }), {
    repositoryPath: 'docs/field-lab/runs/example-run/checks.md',
  });
});

test('removes query strings and fragments from repository paths', () => {
  assert.deepEqual(parseRepositoryEvidenceUrl('checks.md?plain=1#results', { baseUrl, repositoryBlobPrefix }), {
    repositoryPath: 'docs/field-lab/runs/example-run/checks.md',
  });
});

test('rejects raw repository links that normalize outside blob main', () => {
  assert.deepEqual(
    parseRepositoryEvidenceUrl(`${repositoryBlobPrefix}../README.md`, { baseUrl, repositoryBlobPrefix }),
    { error: 'path-escape' },
  );
});

test('rejects relative references that escape blob main', () => {
  assert.deepEqual(parseRepositoryEvidenceUrl('../../../../../../README.md', { baseUrl, repositoryBlobPrefix }), {
    error: 'path-escape',
  });
});

test('reports malformed percent encoding and ignores external URLs', () => {
  assert.deepEqual(parseRepositoryEvidenceUrl(`${repositoryBlobPrefix}%E0%A4%A`, { baseUrl, repositoryBlobPrefix }), {
    error: 'malformed-path',
  });
  assert.deepEqual(parseRepositoryEvidenceUrl('https://example.com/evidence', { baseUrl, repositoryBlobPrefix }), {
    external: true,
  });
});
