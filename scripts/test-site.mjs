import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { canonicalContentFiles, contentRedirects } from '../src/content-manifest.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://agents.anipotts.com';
const failures = [];

const scalar = (markdown, key) => markdown.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '');
const inlineList = (markdown, key) => (markdown.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'))?.[1] ?? '').split(',').map((item) => item.trim()).filter(Boolean);
const ampersandEntities = new Set(['&amp;', '&#x26;', '&#38;']);
const text = (html) => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:amp|#x26|#38);/g, (entity) => ampersandEntities.has(entity) ? '&' : entity)
  .replace(/\s+/g, ' ')
  .trim();
const homeSource = await readFile(path.join(root, 'content/home.md'), 'utf8');
const canonicalH1 = text(homeSource.match(/^#\s+(.+)$/m)?.[1] ?? '');
const routeFile = (route) => route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.replace(/^\//, ''), 'index.html');
const publicFile = (pathname) => pathname.endsWith('.md') ? path.join(dist, pathname.replace(/^\//, '')) : routeFile(pathname.endsWith('/') ? pathname : `${pathname}/`);
const markdownFiles = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => {
  const absolute = path.join(directory, entry.name);
  if (entry.isDirectory()) return markdownFiles(absolute);
  return entry.isFile() && entry.name.endsWith('.md') ? [absolute] : [];
}))).flat();

const contentFiles = canonicalContentFiles().map(({ route, file }) => [route, file]);

try { await access(path.join(root, 'public/favicon.svg')); } catch { failures.push('favicon source is missing'); }
try { await access(path.join(root, 'public/social-card.png')); } catch { failures.push('social card source is missing'); }
try { await access(path.join(root, 'public/robots.txt')); } catch { failures.push('robots source is missing'); }
for (const icon of ['codex-light.png', 'codex-dark.png', 'claude-code.png', 'grok.png']) {
  try { await access(path.join(root, 'public/icons/products', icon)); } catch { failures.push(`product icon is missing: ${icon}`); }
}

const registry = JSON.parse(await readFile(path.join(root, 'editorial/sources.json'), 'utf8'));
const metadata = [];
for (const [route, source] of contentFiles) {
  const markdown = await readFile(source, 'utf8');
  const title = scalar(markdown, 'title');
  const description = scalar(markdown, 'description');
  const scope = markdown.match(/^navigation:\s*\n(?:  .*\n)*?  scope:\s*([^\n]+)/m)?.[1].trim();
  const order = Number(markdown.match(/^navigation:\s*\n(?:  .*\n)*?  order:\s*(\d+)/m)?.[1]);
  metadata.push({ route, source, title, description, scope, order });
  const file = routeFile(route);
  try { await access(file); } catch { failures.push(`${route}: generated page is missing`); continue; }
  const html = await readFile(file, 'utf8');
  const publicText = text(html);
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
  if (canonical !== `${origin}${route}`) failures.push(`${route}: canonical url is missing or incorrect`);
  if (!html.includes('<meta property="og:title"')) failures.push(`${route}: open graph title is missing`);
  if (!html.includes(`<meta property="og:image" content="${origin}/social-card.png"`)) failures.push(`${route}: social preview image is missing`);
  if (!html.includes(`<meta name="twitter:image" content="${origin}/social-card.png"`)) failures.push(`${route}: twitter preview image is missing`);
  if (!html.includes(`content="${description.replaceAll('&', '&amp;')}"`) && !text(html).includes(description)) failures.push(`${route}: canonical description is absent from rendered metadata`);
  if (!publicText.includes(title)) failures.push(`${route}: canonical title is absent from the rendered page`);
  if (route !== '/') {
    const sourceIds = inlineList(markdown, 'sources');
    if (!/<div\b(?=[^>]*\bdata-sw-accordion\b)(?=[^>]*\bdata-state="closed")(?=[^>]*\bclass="[^"]*\bpage-sources\b)[^>]*>/.test(html)) failures.push(`${route}: collapsed Starwind sources accordion is missing`);
    if (/TESTED \/ OFFICIAL SOURCE \/ ANALYSIS/i.test(publicText)) failures.push(`${route}: retired evidence microcopy appears in the source footer`);
    for (const id of sourceIds) {
      const source = registry.sources.find((candidate) => candidate.id === id);
      if (!source || !publicText.includes(source.title)) failures.push(`${route}: registered source is absent from the source disclosure: ${id}`);
    }
    if (sourceIds.length > 0 && (!html.includes('source-summary-badge') || !html.includes('source-summary-count'))) failures.push(`${route}: source icon count badge is missing`);
  }
  if (!publicText.includes('last updated')) failures.push(`${route}: exact update metadata is missing`);
  if ((route.startsWith('/guides/codex') || route.startsWith('/guides/claude-code')) && publicText.includes('last checked')) failures.push(`${route}: internal source check metadata is exposed in the public page header`);
  for (const label of ['handbook', 'codex', 'claude code', 'grok']) if (!publicText.includes(label)) failures.push(`${route}: provider scope tab is missing: ${label}`);
  if (/\bproduct guides\b/i.test(publicText)) failures.push(`${route}: retired product guides label appears in public output`);
  if (html.includes('·')) failures.push(`${route}: mid dot appears in public output`);
  if (!html.includes('coding agent tips on GitHub')) failures.push(`${route}: GitHub link is missing from the site header`);
  if (/GitHub stars|github-stars|\d+ stars, checked/i.test(html)) failures.push(`${route}: stale GitHub star metadata appears in the site header`);

  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of links) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const pathname = new URL(href, origin).pathname;
    try { await access(publicFile(pathname)); } catch { failures.push(`${route}: internal link does not resolve: ${href}`); }
  }
  const registeredLinks = [...html.matchAll(/<a\b[^>]*class="[^"]*\bregistered-link\b[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
  for (const link of registeredLinks) {
    if (!link.includes('data-link-title=') || !link.includes('data-link-domain=') || !link.includes('data-link-publisher=') || !link.includes('data-link-icon=') || !link.includes('data-link-kind=')) failures.push(`${route}: registered link metadata is incomplete`);
    const href = link.match(/\bhref="([^"]+)"/)?.[1];
    const domain = link.match(/\bdata-link-domain="([^"]+)"/)?.[1];
    if (href?.startsWith('http') && domain !== new URL(href.replaceAll('&amp;', '&')).hostname) failures.push(`${route}: registered link domain does not match its actual hostname: ${href}`);
    if (/\blink-favicon\b/.test(link)) failures.push(`${route}: article link still includes an inline publisher icon`);
  }
  if (html.includes('link-favicon')) failures.push(`${route}: retired inline link favicon class appears in rendered HTML`);
}

try {
  const llms = await readFile(path.join(dist, 'llms.txt'), 'utf8');
  for (const { route, file, kind } of canonicalContentFiles().filter((entry) => entry.kind === 'home' || entry.kind === 'guide')) {
    const markdown = await readFile(file, 'utf8');
    const title = scalar(markdown, 'title');
    const markdownPath = `${route.replace(/\/$/, '') || '/index'}.md`;
    if (!llms.includes(`[${title}](${origin}${markdownPath})`)) failures.push(`/llms.txt: missing public Markdown route ${markdownPath}`);
    if (kind === 'guide' && scalar(markdown, 'draft') === 'true') failures.push(`/llms.txt: draft route entered canonical content ${route}`);
  }
  if (llms.includes('/changes/') || llms.includes('/field-lab/')) failures.push('/llms.txt: redirected route is present');
} catch { failures.push('/llms.txt: generated index is missing'); }

const activeGuideText = (await Promise.all(contentFiles.map(([, source]) => readFile(source, 'utf8')))).join('\n');
for (const version of Object.values(registry.product_versions)) {
  const occurrences = activeGuideText.split(String(version)).length - 1;
  if (occurrences > 0) failures.push(`current product version ${version} is duplicated outside editorial/sources.json`);
}

const home = await readFile(routeFile('/'), 'utf8');
for (const expected of [
  'control rooms and surfaces',
  'config.toml, trust, and approvals',
  'remote, cloud, and mobile steering',
  'repository context and interfaces',
  'config, settings, rules, and memory',
  'web, Remote Control, and mobile',
  'Grok Build and Grok Bot',
  'settings and permissions',
  'what still needs hands on testing',
  'shared foundations',
]) if (!text(home).includes(expected)) failures.push(`/: homepage comparison is missing: ${expected}`);
if (text(home).includes('across agents')) failures.push('/: retired shared-guide framing appears on the homepage');
for (const icon of ['codex-light.png', 'claude-code.png', 'grok.png']) {
  if (!home.includes(`/icons/products/${icon}`)) failures.push(`/: product icon is absent from the homepage: ${icon}`);
}
const draftGuides = (await Promise.all((await markdownFiles(path.join(root, 'content'))).map(async (file) => ({ file, markdown: await readFile(file, 'utf8') }))))
  .filter(({ markdown }) => scalar(markdown, 'draft') === 'true')
  .map(({ file }) => `/${path.relative(path.join(root, 'content'), file).replace(/\.md$/, '')}/`);
for (const route of draftGuides) {
  try { await access(routeFile(route)); failures.push(`${route}: draft route exists in production output`); } catch {}
  if (home.includes(`href="${route}"`)) failures.push(`${route}: draft route is linked from the production homepage`);
}
const h1Values = [...home.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((match) => text(match[1]));
if (h1Values.length !== 1 || h1Values[0] !== canonicalH1) failures.push(`/: expected one exact canonical h1, received ${JSON.stringify(h1Values)}`);
for (const item of metadata.filter((item) => item.route !== '/' && !item.source.includes(`${path.sep}archive${path.sep}`) && (item.scope === 'handbook' || item.order === 10))) {
  if (!home.includes(`href="${item.route}"`)) failures.push(`/: canonical guide link is missing: ${item.route}`);
  if (!text(home).includes(item.description)) failures.push(`/: canonical guide description is missing: ${item.description}`);
}

for (const [alias] of Object.entries(contentRedirects())) {
  try { await access(routeFile(alias)); } catch { failures.push(`${alias}: redirect output is missing`); }
}
try { await access(routeFile('/changes/')); } catch { failures.push('/changes/: release history redirect is missing'); }

const sitemapFiles = (await readdir(dist)).filter((file) => file.startsWith('sitemap') && file.endsWith('.xml'));
if (sitemapFiles.length === 0) failures.push('sitemap output is missing');
else {
  const sitemap = await readFile(path.join(dist, sitemapFiles[0]), 'utf8');
  const locations = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  for (const { route } of metadata) if (!locations.has(`${origin}${route}`)) failures.push(`${route}: absent from sitemap`);
  for (const route of draftGuides) if (locations.has(`${origin}${route}`)) failures.push(`${route}: draft route appears in sitemap`);
  for (const alias of [...Object.keys(contentRedirects()), '/changes/']) if (locations.has(`${origin}${alias}`)) failures.push(`${alias}: redirect route appears in sitemap`);
}

try {
  const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
  if (!robots.includes('User-agent: *') || !robots.includes('Allow: /')) failures.push('robots.txt does not permit public crawling');
  if (!robots.includes(`${origin}/sitemap-index.xml`)) failures.push('robots.txt does not reference the sitemap index');
} catch { failures.push('generated robots.txt is missing'); }

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated ${metadata.length} canonical routes, derived metadata, redirects, links, sitemap, and homepage identity`);
