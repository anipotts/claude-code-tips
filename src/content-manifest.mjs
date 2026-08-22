import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function inlineList(markdown, key) {
  const match = markdown.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'));
  if (!match || match[1].trim() === '') return [];
  return match[1].split(',').map((value) => value.trim().replace(/^['"]|['"]$/g, ''));
}

function routeForFile(file) {
  const path = relative(resolve(root, 'docs'), file).replace(/\.md$/, '');
  return `/${path}/`;
}

function handbookFiles() {
  const guideDirectory = resolve(root, 'docs/guides');
  return [
    ...readdirSync(guideDirectory).filter((file) => file.endsWith('.md')).map((file) => resolve(guideDirectory, file)),
    ...['market.md', 'method.md', 'legacy.md'].map((file) => resolve(root, 'docs', file)),
  ];
}

export function canonicalContentFiles() {
  const runs = readdirSync(resolve(root, 'content/runs')).filter((file) => file.endsWith('.md'));
  return [
    { route: '/', file: resolve(root, 'content/home.md'), kind: 'home' },
    ...handbookFiles().map((file) => ({ route: routeForFile(file), file, kind: file.endsWith('legacy.md') ? 'legacy' : 'guide' })),
    ...runs.map((file) => ({ route: `/field-lab/runs/${file.replace(/\.md$/, '')}/`, file: resolve(root, 'content/runs', file), kind: 'run' })),
  ];
}

export function contentRedirects() {
  const files = handbookFiles();
  const redirects = {};
  for (const file of files) {
    const target = routeForFile(file);
    for (const alias of inlineList(readFileSync(file, 'utf8'), 'redirects')) redirects[alias] = target;
  }
  const home = resolve(root, 'content/home.md');
  for (const alias of inlineList(readFileSync(home, 'utf8'), 'redirects')) redirects[alias] = '/';
  return redirects;
}
