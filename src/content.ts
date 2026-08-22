import { getCollection, type CollectionEntry } from 'astro:content';
import { navigationGroups } from './site';

export type HandbookEntry = CollectionEntry<'docs'>;

export const routeForEntry = (entry: HandbookEntry) => `/${entry.id.replace(/\/$/, '')}/`;

export async function getHandbookPages(options: { includeHidden?: boolean; includeLegacy?: boolean } = {}) {
  const { includeHidden = false, includeLegacy = true } = options;
  const groupOrder = new Map(navigationGroups.map((group) => [group.id, group.order]));
  const entries = await getCollection('docs');

  return entries
    .filter((entry) => includeHidden || !entry.data.navigation.hidden)
    .filter((entry) => includeLegacy || entry.data.status !== 'legacy')
    .sort((left, right) => {
      const leftGroup = groupOrder.get(left.data.navigation.group) ?? Number.MAX_SAFE_INTEGER;
      const rightGroup = groupOrder.get(right.data.navigation.group) ?? Number.MAX_SAFE_INTEGER;
      return leftGroup - rightGroup || left.data.navigation.order - right.data.navigation.order;
    });
}
