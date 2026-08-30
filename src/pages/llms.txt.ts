import { getCollection } from 'astro:content';
import { site } from '../site';

export async function GET() {
  const home = await getCollection('home');
  const docs = (await getCollection('docs')).filter((entry) => !entry.data.draft);
  const pages = [
    ...home.map((entry) => ({ route: '/', title: entry.data.title, description: entry.data.description })),
    ...docs.map((entry) => ({ route: `/${entry.id}/`, title: entry.data.title, description: entry.data.description })),
  ].sort((left, right) => left.route === '/' ? -1 : right.route === '/' ? 1 : left.route.localeCompare(right.route)).map(({ route, title, description }) => {
    const markdownPath = `${route.replace(/\/$/, '') || '/index'}.md`;
    return `- [${title}](${new URL(markdownPath, site.url).href}): ${description}`;
  });

  const body = [
    '# coding agent tips',
    '',
    '> approved public handbook pages in Markdown for readers, agents, and language models.',
    '',
    ...pages,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
