import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function inlineList(markdown, key) {
  const match = markdown.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'));
  if (!match || match[1].trim() === '') return [];
  return match[1].split(',').map((value) => value.trim().replace(/^['"]|['"]$/g, ''));
}

function scalar(markdown, key) {
  return markdown.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function isDraft(file) {
  return scalar(readFileSync(file, 'utf8'), 'draft') === 'true';
}

function routeForFile(file) {
  const contentPath = relative(resolve(root, 'content'), file).replace(/\.md$/, '');
  return `/${contentPath}/`;
}

function markdownFiles(directory) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => resolve(entry.parentPath, entry.name));
}

function handbookFiles() {
  return ['handbook', 'guides', 'archive'].flatMap((directory) => markdownFiles(resolve(root, 'content', directory)));
}

export function canonicalContentFiles() {
  return [
    { route: '/', file: resolve(root, 'content/home.md'), kind: 'home' },
    ...handbookFiles().filter((file) => !isDraft(file)).map((file) => ({
      route: routeForFile(file),
      file,
      kind: relative(resolve(root, 'content'), file).startsWith('archive/') ? 'archive' : 'guide',
    })),
  ];
}

export function contentRedirects() {
  const files = handbookFiles().filter((file) => !isDraft(file));
  const redirects = {};
  for (const file of files) {
    const target = routeForFile(file);
    for (const alias of inlineList(readFileSync(file, 'utf8'), 'redirects')) redirects[alias] = target;
  }
  const home = resolve(root, 'content/home.md');
  for (const alias of inlineList(readFileSync(home, 'utf8'), 'redirects')) redirects[alias] = '/';
  return redirects;
}
