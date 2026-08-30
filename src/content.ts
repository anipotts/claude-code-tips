import { getCollection, type CollectionEntry } from 'astro:content';
import { handbookScopes, type NavigationScope } from './site';

export type HandbookEntry = CollectionEntry<'docs'>;

export const routeForEntry = (entry: HandbookEntry) => `/${entry.id.replace(/\/$/, '')}/`;

export async function getHandbookPages(options: { includeHidden?: boolean; includeArchive?: boolean; includeDrafts?: boolean; scope?: NavigationScope } = {}) {
  const { includeHidden = false, includeArchive = true, includeDrafts = !import.meta.env.PROD, scope } = options;
  const scopeOrder = new Map(handbookScopes.map((item) => [item.id, item.order]));
  const entries = await getCollection('docs');

  return entries
    .filter((entry) => includeDrafts || !entry.data.draft)
    .filter((entry) => includeHidden || !entry.data.navigation.hidden)
    .filter((entry) => includeArchive || entry.data.status !== 'archive')
    .filter((entry) => !scope || entry.data.navigation.scope === scope)
    .sort((left, right) => {
      const leftScope = scopeOrder.get(left.data.navigation.scope) ?? Number.MAX_SAFE_INTEGER;
      const rightScope = scopeOrder.get(right.data.navigation.scope) ?? Number.MAX_SAFE_INTEGER;
      return leftScope - rightScope || left.data.navigation.order - right.data.navigation.order;
    });
}

export async function getHomepagePages() {
  const pages = await getHandbookPages({ includeArchive: false });
  return pages;
}
