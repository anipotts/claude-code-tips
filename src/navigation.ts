type TocNode = { depth: number; slug: string; text: string; children: TocNode[] };

/** Both navigation surfaces use the same Starlight heading order and depth. */
export function pageOutline(items: TocNode[] = [], isOutline = false) {
  const flatten = (nodes: TocNode[]): Omit<TocNode, 'children'>[] => nodes.flatMap(({ children, ...heading }) => [
    heading,
    ...flatten(children),
  ]);
  return isOutline ? [] : flatten(items).filter(({ slug, depth }) => slug !== '_top' && depth <= 3);
}
