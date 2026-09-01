const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
export const MAX_COPY_REVIEW_BODY = 256_000;

export function authorizeCopyReviewRequest(input: { requestUrl: string; method: string; token: string | null; expectedToken: string; origin: string | null; referer: string | null }) {
  const url = new URL(input.requestUrl);
  if (!LOOPBACK_HOSTS.has(url.hostname)) throw new Error('copy review is available only on the loopback interface');
  if (!input.token || input.token !== input.expectedToken) throw new Error('copy review session token is missing or invalid');
  if (input.method !== 'GET' && input.origin !== url.origin) throw new Error('copy review rejected a cross-origin mutation');
  if (input.method === 'GET' && !input.referer?.startsWith(`${url.origin}/__copy-review/`)) throw new Error('copy review rejected a cross-origin read');
}

export function parseCopyReviewJson<T>(source: string, contentType: string | null): T {
  if (!contentType?.startsWith('application/json')) throw new Error('request must use application/json');
  if (Buffer.byteLength(source, 'utf8') > MAX_COPY_REVIEW_BODY) throw new Error('request body is too large');
  return JSON.parse(source) as T;
}
