import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { evidenceLabels } from '../src/evidence';

const root = resolve(import.meta.dirname, '..');
const readmePath = resolve(root, 'README.md');
const origin = 'https://agents.anipotts.com';

function scalar(markdown: string, key: string) {
  return markdown.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function replaceBlock(markdown: string, name: string, body: string) {
  const start = `<!-- generated:${name}:start -->`;
  const end = `<!-- generated:${name}:end -->`;
  return markdown.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${body}\n${end}`);
}

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  });
}

const guideFiles = [
  ...markdownFiles(resolve(root, 'content/guides')),
  ...markdownFiles(resolve(root, 'content/handbook')),
];
const scopeOrder = new Map([['codex', 10], ['claude-code', 20], ['grok', 30], ['handbook', 40]]);
const guides = guideFiles
  .map((file) => {
    const markdown = readFileSync(file, 'utf8');
    const path = relative(resolve(root, 'content'), file).replace(/\.md$/, '');
    return { title: scalar(markdown, 'title'), scope: scalar(markdown, 'scope'), order: Number(scalar(markdown, 'order')), route: `/${path}/`, draft: scalar(markdown, 'draft') === 'true' };
  })
  .filter((guide) => !guide.draft && (guide.scope === 'handbook' || guide.order === 10))
  .sort((left, right) => (scopeOrder.get(left.scope) ?? 99) - (scopeOrder.get(right.scope) ?? 99) || left.order - right.order || left.route.localeCompare(right.route));
const guideBlock = guides.map((guide) => `- [${guide.title}](${origin}${guide.route})`).join('\n');
const evidenceBlock = Object.values(evidenceLabels).map((item) => `- \`${item.label}\`: ${item.description}`).join('\n');

let next = readFileSync(readmePath, 'utf8');
next = replaceBlock(next, 'guides', guideBlock);
next = replaceBlock(next, 'evidence', evidenceBlock);

if (process.argv.includes('--check')) {
  if (next !== readFileSync(readmePath, 'utf8')) {
    console.error('README.md generated sections are stale; run bun run sync:readme');
    process.exit(1);
  }
} else {
  writeFileSync(readmePath, next);
}
