import { getEntry } from 'astro:content';

export async function GET() {
  const home = await getEntry('home', 'home');
  if (!home) return new Response('homepage Markdown is unavailable\n', { status: 404 });
  return new Response(`${(home.body ?? '').trim()}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
