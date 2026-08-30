import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('../../docs/sources.json', import.meta.url), 'utf8'));
const publisherById = new Map(registry.publishers.map((publisher) => [publisher.id, publisher]));

const normalizeUrl = (value) => {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return value;
  }
};

const sourceByUrl = new Map();
for (const source of registry.sources) {
  for (const value of [source.url, ...(source.aliases ?? [])]) sourceByUrl.set(normalizeUrl(value), source);
}

const textContent = (node) => (node.children ?? []).map((child) => child.type === 'text' ? child.value : textContent(child)).join('').trim();
const humanize = (value) => decodeURIComponent(value).replace(/^#|\/$/g, '').split('/').pop()?.replace(/[-_]/g, ' ') || 'coding agent tips';

function annotate(node) {
  if (node?.type === 'element' && node.tagName === 'a' && typeof node.properties?.href === 'string') {
    const href = node.properties.href;
    const label = textContent(node) || humanize(href);
    const source = sourceByUrl.get(normalizeUrl(href));
    const internal = href.startsWith('/') || href.startsWith('#') || href.startsWith('./') || href.startsWith('../');
    if (source || internal) {
      const publisher = source ? publisherById.get(source.publisher) : undefined;
      const icon = publisher?.icon ?? '/favicon.svg';
      const title = source?.title ?? (href.startsWith('#') ? humanize(href) : label);
      const domain = source ? new URL(href).hostname : 'agents.anipotts.com';
      const publisherLabel = publisher?.label ?? 'coding agent tips';
      const kind = source?.evidence === 'official-source' ? 'official source' : source ? 'external source' : 'internal page';
      const currentClasses = Array.isArray(node.properties.className)
        ? node.properties.className
        : typeof node.properties.className === 'string' ? node.properties.className.split(/\s+/) : [];
      node.properties.className = [...currentClasses, 'registered-link'];
      node.properties['data-link-title'] = title;
      node.properties['data-link-domain'] = domain;
      node.properties['data-link-publisher'] = publisherLabel;
      node.properties['data-link-icon'] = icon;
      node.properties['data-link-kind'] = kind;
    }
  }
  for (const child of node?.children ?? []) annotate(child);
}

export default function linkMetadata() {
  return (tree) => annotate(tree);
}
