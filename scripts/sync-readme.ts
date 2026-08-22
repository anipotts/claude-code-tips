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

const guideFiles = [
  ...readdirSync(resolve(root, 'docs/guides')).filter((file) => file.endsWith('.md')).map((file) => resolve(root, 'docs/guides', file)),
  resolve(root, 'docs/history.md'),
  resolve(root, 'docs/market.md'),
  resolve(root, 'docs/method.md'),
];
const guides = guideFiles
  .map((file) => {
    const markdown = readFileSync(file, 'utf8');
    const path = relative(resolve(root, 'docs'), file).replace(/\.md$/, '');
    return { title: scalar(markdown, 'title'), order: Number(scalar(markdown, 'order')), route: `/${path}/` };
  })
  .sort((left, right) => left.order - right.order);
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
