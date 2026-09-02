import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

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

function routeForFile(file, rootDirectory = root) {
  const contentPath = relative(resolve(rootDirectory, 'content'), file).replace(/\.md$/, '');
  return `/${contentPath}/`;
}

function markdownFiles(directory) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => resolve(entry.parentPath, entry.name));
}

function handbookFiles(rootDirectory = root) {
  return ['handbook', 'guides', 'archive'].flatMap((directory) => markdownFiles(resolve(rootDirectory, 'content', directory)));
}

export function canonicalContentFiles(rootDirectory = root) {
  return [
    { route: '/', file: resolve(rootDirectory, 'content/home.md'), kind: 'home' },
    ...handbookFiles(rootDirectory).filter((file) => !isDraft(file)).map((file) => ({
      route: routeForFile(file, rootDirectory),
      file,
      kind: relative(resolve(rootDirectory, 'content'), file).startsWith('archive/') ? 'archive' : 'guide',
    })),
  ];
}

export function contentRedirects(rootDirectory = root) {
  const files = handbookFiles(rootDirectory).filter((file) => !isDraft(file));
  const redirects = {};
  for (const file of files) {
    const target = routeForFile(file, rootDirectory);
    for (const alias of inlineList(readFileSync(file, 'utf8'), 'redirects')) redirects[alias] = target;
  }
  const home = resolve(rootDirectory, 'content/home.md');
  for (const alias of inlineList(readFileSync(home, 'utf8'), 'redirects')) redirects[alias] = '/';
  return redirects;
}
