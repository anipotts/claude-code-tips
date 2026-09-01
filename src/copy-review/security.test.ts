import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { authorizeCopyReviewRequest, MAX_COPY_REVIEW_BODY, parseCopyReviewJson } from './security';

const valid = { requestUrl: 'http://127.0.0.1:4330/__copy-review/api/catalog', method: 'GET', token: 'secret', expectedToken: 'secret', origin: null, referer: 'http://127.0.0.1:4330/__copy-review/', clientAddress: '127.0.0.1' };

describe('copy review request boundary', () => {
  test('accepts loopback same-origin requests with the session token', () => expect(() => authorizeCopyReviewRequest(valid)).not.toThrow());
  test('rejects remote hosts, bad tokens, and cross-origin mutations', () => {
    expect(() => authorizeCopyReviewRequest({ ...valid, requestUrl: 'https://example.com/__copy-review/api/catalog' })).toThrow('loopback');
    expect(() => authorizeCopyReviewRequest({ ...valid, clientAddress: '192.0.2.1' })).toThrow('loopback client');
    expect(() => authorizeCopyReviewRequest({ ...valid, token: 'wrong' })).toThrow('token');
    expect(() => authorizeCopyReviewRequest({ ...valid, method: 'POST', origin: 'https://example.com' })).toThrow('cross-origin');
    expect(() => authorizeCopyReviewRequest({ ...valid, referer: null })).toThrow('cross-origin');
    expect(() => authorizeCopyReviewRequest({ ...valid, referer: 'https://example.com/__copy-review/' })).toThrow('cross-origin');
  });
  test('requires JSON and enforces the body limit', () => {
    expect(parseCopyReviewJson<{ ok: boolean }>('{"ok":true}', 'application/json').ok).toBe(true);
    expect(() => parseCopyReviewJson('{}', 'text/plain')).toThrow('application/json');
    expect(() => parseCopyReviewJson(`"${'x'.repeat(MAX_COPY_REVIEW_BODY)}"`, 'application/json')).toThrow('too large');
  });
  test('injects the editor only through the loopback launcher', async () => {
    const [config, launcher, page] = await Promise.all([
      readFile(new URL('../../astro.config.mjs', import.meta.url), 'utf8'),
      readFile(new URL('../../scripts/start-copy-review.mjs', import.meta.url), 'utf8'),
      readFile(new URL('../pages-dev/copy-review.astro', import.meta.url), 'utf8'),
    ]);
    expect(config).toContain("process.env.COPY_REVIEW_ENABLED === '1'");
    expect(launcher).toContain("'--host', '127.0.0.1'");
    expect(launcher).toContain("COPY_REVIEW_ENABLED: '1'");
    expect(page).toContain('sandbox="allow-same-origin"');
    expect(page).not.toContain('allow-scripts');
  });
});
