import { getCollection, type CollectionEntry } from 'astro:content';

type Props = { entry: CollectionEntry<'docs'> };

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return entries
    .filter((entry) => !entry.data.draft)
    .map((entry) => ({
      params: { markdown: entry.id },
      props: { entry },
    }));
}

export function GET({ props }: { props: Props }) {
  const { entry } = props;
  const markdown = `# ${entry.data.title}\n\n${(entry.body ?? '').trim()}\n`;
  return new Response(markdown, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
