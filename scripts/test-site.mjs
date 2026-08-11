import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://agents.anipotts.com';
const canonicalH1 = 'a guide to coding agents in production software (projects, startups & big tech)';
const requiredHomepageCopy = [
  'understand the layers of every agentic system',
  "it's important to know which layer holds the solution space to your bottlenecks",
  'cli, ide & app tradeoffs',
  'tools, runtime & memory',
  'valuing inference',
  'how parallel work is planned & coordinated',
  'compare setups most commonly used',
];
const fieldRunFiles = (await readdir(path.join(root, 'docs', 'field-lab', 'runs')))
  .filter((file) => file.endsWith('.json'))
  .sort();
const fieldRunRoutes = fieldRunFiles.map(
  (file) => `/field-lab/runs/${file.replace(/\.json$/, '')}/`,
);
const requiredRoutes = [
  '/',
  '/guides/',
  '/guides/codex/',
  '/guides/claude-code/',
  '/guides/operating-system/',
  '/market/',
  '/market/hardware/',
  '/field-lab/',
  ...fieldRunRoutes,
  '/method/',
  '/changes/',
  '/legacy/',
];

const routeFile = (route) =>
  route === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.replace(/^\//, ''), 'index.html');
const failures = [];
try {
  await access(path.join(root, 'public', 'favicon.svg'));
} catch {
  failures.push('favicon source is missing');
}
const changesSource = await readFile(path.join(root, 'docs', 'changes.md'), 'utf8');
const latestChangeBlock = changesSource.match(/^latestChange:\n((?:  .*\n)+)/m)?.[1] ?? '';
const latestChange = Object.fromEntries(
  [...latestChangeBlock.matchAll(/^  (date|title|summary):\s*(.+)$/gm)].map((match) => {
    const value = match[2].trim();
    const unquoted = /^(["'])(.*)\1$/.exec(value)?.[2] ?? value;
    return [match[1], unquoted];
  }),
);
for (const field of ['date', 'title', 'summary']) {
  if (!latestChange[field]) failures.push(`changes frontmatter is missing latestChange.${field}`);
}

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
  if (!/<link\s+rel="(?:shortcut )?icon"\s+href="\/favicon\.svg"\s+type="image\/svg\+xml"\s*\/?\s*>/.test(html)) {
    failures.push(`${route}: favicon metadata is missing`);
  }
  if (html.includes('·')) {
    failures.push(`${route}: mid-dot divider appears in public output`);
  }
  if (!/coding agent tips on GitHub, \d+ stars/.test(html)) {
    failures.push(`${route}: GitHub star count is missing from the site header`);
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
const homeText = home
  .replace(/<[^>]+>/g, ' ')
  .replaceAll('&amp;', '&')
  .replace(/\s+/g, ' ')
  .trim();
const h1Values = [...home.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((match) =>
  match[1].replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').trim(),
);
if (h1Values.length !== 1 || h1Values[0] !== canonicalH1) {
  failures.push(`/: expected one exact canonical h1, received ${JSON.stringify(h1Values)}`);
}
for (const copy of requiredHomepageCopy) {
  if (!homeText.includes(copy)) failures.push(`/: annotated homepage copy is missing: ${copy}`);
}
if (latestChange.date && !home.includes(`<time datetime="${latestChange.date}">${latestChange.date}</time>`)) {
  failures.push('/: latest material change date does not match changes frontmatter');
}
for (const field of ['title', 'summary']) {
  if (latestChange[field] && !homeText.includes(latestChange[field])) {
    failures.push(`/: latest material change ${field} does not match changes frontmatter`);
  }
}

for (const route of ['/', ...fieldRunRoutes]) {
  const html = await readFile(routeFile(route), 'utf8');
  const mobileNavigation = html.match(/<nav id="mobile-primary-menu"[^>]*>(.*?)<\/nav>/s)?.[1] ?? '';
  const mobileLinks = [...mobileNavigation.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => match[1]);
  if (mobileLinks.join(',') !== '/guides/,/market/,/field-lab/,/method/') {
    failures.push(`${route}: standalone mobile navigation is missing or incomplete`);
  }
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
