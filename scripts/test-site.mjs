import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://agents.anipotts.com';
const canonicalH1 = 'a guide to coding agents in production software (projects, startups & big tech)';
const requiredRoutes = [
  '/',
  '/guides/',
  '/guides/codex/',
  '/guides/claude-code/',
  '/guides/operating-system/',
  '/market/',
  '/market/hardware/',
  '/field-lab/',
  '/field-lab/runs/codex-publication-baseline-2026-08-07/',
  '/method/',
  '/changes/',
  '/legacy/',
];

const routeFile = (route) =>
  route === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.replace(/^\//, ''), 'index.html');
const failures = [];

for (const route of requiredRoutes) {
  const file = routeFile(route);
  try {
    await access(file);
  } catch {
    failures.push(`${route}: generated page is missing`);
    continue;
  }

  const html = await readFile(file, 'utf8');
  const expectedCanonical = `${origin}${route}`;
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
  if (canonical !== expectedCanonical) {
    failures.push(`${route}: canonical url is missing or incorrect`);
  }
  if (!html.includes('<meta property="og:title"')) {
    failures.push(`${route}: open graph title is missing`);
  }

  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of links) {
    if (href.includes('.md') && !href.startsWith('https://')) {
      failures.push(`${route}: source-file link leaks into the built site: ${href}`);
    }
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const pathname = new URL(href, origin).pathname;
    try {
      await access(routeFile(pathname.endsWith('/') ? pathname : `${pathname}/`));
    } catch {
      failures.push(`${route}: internal link does not resolve: ${href}`);
    }
  }
}

const home = await readFile(routeFile('/'), 'utf8');
const h1Values = [...home.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((match) =>
  match[1].replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').trim(),
);
if (h1Values.length !== 1 || h1Values[0] !== canonicalH1) {
  failures.push(`/: expected one exact canonical h1, received ${JSON.stringify(h1Values)}`);
}

const sitemapFiles = (await readdir(dist)).filter((file) => file.startsWith('sitemap') && file.endsWith('.xml'));
if (sitemapFiles.length === 0) {
  failures.push('sitemap output is missing');
} else {
  const sitemap = await readFile(path.join(dist, sitemapFiles[0]), 'utf8');
  if (!sitemap.includes(origin)) failures.push('sitemap does not use the custom hostname');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated ${requiredRoutes.length} public routes, canonical metadata, links, sitemap, and homepage identity`);
