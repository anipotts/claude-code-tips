import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('../../editorial/sources.json', import.meta.url), 'utf8'));
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
const element = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

const wrapSourceLink = (link, { icon, kind, publisherLabel, title, domain }) => element('span', {
  className: ['registered-link-hover-card'],
  'data-sw-preview-card': '',
  'data-close-delay': '180',
  'data-close-on-escape': 'true',
  'data-close-on-outside-interact': 'true',
  'data-content-hoverable': 'true',
  'data-open-delay': '320',
  'data-state': 'closed',
}, [
  link,
  element('span', {
    'data-sw-preview-card-portal': '',
    'data-sw-portal-placement': 'runtime',
    'data-placement': 'pending',
  }, [element('span', {
    className: ['registered-link-card-positioner'],
    'data-sw-preview-card-positioner': '',
    'data-state': 'closed',
    'data-side': 'top',
    'data-align': 'start',
    'data-side-offset': '8',
    'data-avoid-collisions': 'true',
  }, [element('span', {
    className: ['registered-link-card'],
    'data-sw-preview-card-popup': '',
    'data-state': 'closed',
    'data-side': 'top',
    'data-align': 'start',
    'data-side-offset': '8',
    'data-avoid-collisions': 'true',
    role: 'tooltip',
    hidden: true,
  }, [
    element('span', { className: ['registered-link-card-heading'] }, [
      element('img', { src: icon, alt: '', width: 24, height: 24, loading: 'lazy' }),
      element('span', {}, [
        element('strong', {}, [text(title)]),
        element('small', {}, [text(`${publisherLabel}, ${domain}`)]),
      ]),
    ]),
    element('span', { className: ['registered-link-card-kind'] }, [text(kind)]),
  ])])]),
]);

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
      node.properties['data-sw-preview-card-trigger'] = '';
      node.properties['data-state'] = 'closed';
      node.data = { ...(node.data ?? {}), previewCard: source ? { icon, kind, publisherLabel, title, domain } : undefined };
    }
  }
  if (!Array.isArray(node?.children)) return;
  node.children = node.children.map((child) => {
    annotate(child);
    return child?.data?.previewCard ? wrapSourceLink(child, child.data.previewCard) : child;
  });
}

export default function linkMetadata() {
  return (tree) => annotate(tree);
}
