import { describe, expect, test } from 'bun:test';
import { authorizeCopyReviewRequest, MAX_COPY_REVIEW_BODY, parseCopyReviewJson } from './security';

const valid = { requestUrl: 'http://127.0.0.1:4330/__copy-review/api/catalog', method: 'GET', token: 'secret', expectedToken: 'secret', origin: null, referer: 'http://127.0.0.1:4330/__copy-review/' };

describe('copy review request boundary', () => {
  test('accepts loopback same-origin requests with the session token', () => expect(() => authorizeCopyReviewRequest(valid)).not.toThrow());
  test('rejects remote hosts, bad tokens, and cross-origin mutations', () => {
    expect(() => authorizeCopyReviewRequest({ ...valid, requestUrl: 'https://example.com/__copy-review/api/catalog' })).toThrow('loopback');
    expect(() => authorizeCopyReviewRequest({ ...valid, token: 'wrong' })).toThrow('token');
    expect(() => authorizeCopyReviewRequest({ ...valid, method: 'POST', origin: 'https://example.com' })).toThrow('cross-origin');
  });
  test('requires JSON and enforces the body limit', () => {
    expect(parseCopyReviewJson<{ ok: boolean }>('{"ok":true}', 'application/json').ok).toBe(true);
    expect(() => parseCopyReviewJson('{}', 'text/plain')).toThrow('application/json');
    expect(() => parseCopyReviewJson(`"${'x'.repeat(MAX_COPY_REVIEW_BODY)}"`, 'application/json')).toThrow('too large');
  });
});

