import { readFile } from 'node:fs/promises';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import YAML from 'yaml';
import sourceRegistry from '../editorial/sources.json' with { type: 'json' };
import { canonicalContentFiles } from './content-manifest.mjs';
import { AGENT_INDEX_VERSION } from './agent-index-version.mjs';

export { AGENT_INDEX_VERSION } from './agent-index-version.mjs';

const namedEntities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodeEntities = (value) => value.replace(/&(?:amp|lt|gt|quot|apos|#39|#\d+|#x[\da-f]+);/gi, (entity) => {
  const token = entity.slice(1, -1).toLocaleLowerCase();
  if (token in namedEntities) return namedEntities[token];
  if (token === '#39') return "'";
  const codePoint = token.startsWith('#x') ? Number.parseInt(token.slice(2), 16) : Number(token.slice(1));
  return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
});

export const normalizePublicText = (value) => decodeEntities(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function splitCanonicalMarkdown(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error('canonical Markdown is missing frontmatter');
  return { data: YAML.parse(match[1]), body: markdown.slice(match[0].length) };
}

function sectionIndex(body) {
  const tree = unified().use(remarkParse).parse(body);
  const children = tree.children ?? [];
  const slugger = new GithubSlugger();
  const sections = [];

  for (let index = 0; index < children.length; index += 1) {
    const heading = children[index];
    if (heading.type !== 'heading') continue;
    const title = normalizePublicText(toString(heading));
    const content = [];
    for (let cursor = index + 1; cursor < children.length; cursor += 1) {
      const node = children[cursor];
      if (node.type === 'heading' && node.depth <= heading.depth) break;
      content.push(node);
    }
    sections.push({
      anchor: slugger.slug(title),
      title,
      depth: heading.depth,
      text: normalizePublicText(content.map((node) => toString(node)).join(' ')),
    });
  }

  return {
    text: normalizePublicText(toString(tree)),
    sections,
  };
}

const markdownUrlForRoute = (route) => `${route.replace(/\/$/, '') || '/index'}.md`;

export async function buildAgentIndex(rootDirectory) {
  const pages = [];
  const referencedSourceIds = new Set();

  for (const { route, file, kind } of canonicalContentFiles(rootDirectory)) {
    const markdown = await readFile(file, 'utf8');
    const { data, body } = splitCanonicalMarkdown(markdown);
    const content = sectionIndex(body);
    const sourceIds = [...(data.sources ?? [])];
    for (const sourceId of sourceIds) referencedSourceIds.add(sourceId);
    pages.push({
      route,
      markdownUrl: markdownUrlForRoute(route),
      kind,
      title: data.title,
      description: data.description,
      updatedAt: data.updatedAt,
      status: data.status,
      evidence: [...(data.evidence ?? [])],
      sourceIds,
      scope: data.navigation?.scope ?? 'handbook',
      order: data.navigation?.order ?? 0,
      text: content.text,
      sections: content.sections,
    });
  }

  pages.sort((left, right) => left.route === '/' ? -1 : right.route === '/' ? 1 : left.route.localeCompare(right.route));
  const publisherById = new Map(sourceRegistry.publishers.map((publisher) => [publisher.id, publisher]));
  const sources = sourceRegistry.sources
    .filter((source) => referencedSourceIds.has(source.id))
    .map((source) => {
      const publisher = publisherById.get(source.publisher);
      return {
        id: source.id,
        title: source.title,
        url: source.url,
        publisher: publisher ? { id: publisher.id, label: publisher.label, domain: publisher.domain } : null,
        evidence: source.evidence,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    schemaVersion: AGENT_INDEX_VERSION,
    name: 'coding agent tips',
    discovery: { llms: '/llms.txt', index: '/agent-index.json' },
    pages,
    sources,
  };
}
