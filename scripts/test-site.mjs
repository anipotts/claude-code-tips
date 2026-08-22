import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { canonicalContentFiles, contentRedirects } from '../src/content-manifest.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://agents.anipotts.com';
const canonicalH1 = 'a guide to coding agents in production software (projects, startups & big tech)';
const failures = [];

const scalar = (markdown, key) => markdown.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '');
const inlineList = (markdown, key) => (markdown.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'))?.[1] ?? '').split(',').map((item) => item.trim()).filter(Boolean);
const text = (html) => html.replace(/<[^>]+>/g, ' ').replaceAll('&amp;', '&').replace(/\s+/g, ' ').trim();
const routeFile = (route) => route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.replace(/^\//, ''), 'index.html');

const contentFiles = canonicalContentFiles().map(({ route, file }) => [route, file]);

try { await access(path.join(root, 'public/favicon.svg')); } catch { failures.push('favicon source is missing'); }

const registry = JSON.parse(await readFile(path.join(root, 'docs/sources.json'), 'utf8'));
const metadata = [];
for (const [route, source] of contentFiles) {
  const markdown = await readFile(source, 'utf8');
  const title = scalar(markdown, 'title');
  const description = scalar(markdown, 'description');
  metadata.push({ route, source, title, description });
  const file = routeFile(route);
  try { await access(file); } catch { failures.push(`${route}: generated page is missing`); continue; }
  const html = await readFile(file, 'utf8');
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
  if (canonical !== `${origin}${route}`) failures.push(`${route}: canonical url is missing or incorrect`);
  if (!html.includes('<meta property="og:title"')) failures.push(`${route}: open graph title is missing`);
  if (!html.includes(`content="${description.replaceAll('&', '&amp;')}"`) && !text(html).includes(description)) failures.push(`${route}: canonical description is absent from rendered metadata`);
  if (!text(html).includes(title)) failures.push(`${route}: canonical title is absent from the rendered page`);
  if (route.startsWith('/guides/') || route === '/history/' || route === '/market/' || route === '/method/' || route === '/legacy/') {
    for (const kind of inlineList(markdown, 'evidence')) {
      const definition = registry?.evidence_labels?.[kind];
      if (!definition || !text(html).includes(definition.label) || !text(html).includes(definition.description)) failures.push(`${route}: evidence summary does not derive ${kind} from the source registry`);
    }
  }
  if (html.includes('·')) failures.push(`${route}: mid dot appears in public output`);
  if (!/coding agent tips on GitHub, \d+ stars/.test(html)) failures.push(`${route}: GitHub star count is missing from the site header`);

  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of links) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const pathname = new URL(href, origin).pathname;
    const candidate = pathname.endsWith('/') ? pathname : `${pathname}/`;
    try { await access(routeFile(candidate)); } catch { failures.push(`${route}: internal link does not resolve: ${href}`); }
  }
}

const activeGuideText = (await Promise.all(contentFiles.filter(([route]) => !route.startsWith('/field-lab/')).map(([, source]) => readFile(source, 'utf8')))).join('\n');
for (const version of Object.values(registry.product_versions)) {
  const occurrences = activeGuideText.split(String(version)).length - 1;
  if (occurrences > 0) failures.push(`current product version ${version} is duplicated outside docs/sources.json`);
}

const home = await readFile(routeFile('/'), 'utf8');
const h1Values = [...home.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((match) => text(match[1]));
if (h1Values.length !== 1 || h1Values[0] !== canonicalH1) failures.push(`/: expected one exact canonical h1, received ${JSON.stringify(h1Values)}`);
for (const item of metadata.filter((item) => item.route !== '/' && !item.route.startsWith('/field-lab/') && item.route !== '/legacy/')) {
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
  for (const alias of [...Object.keys(contentRedirects()), '/changes/', '/__copy-review/']) if (locations.has(`${origin}${alias}`)) failures.push(`${alias}: redirect or local review route appears in sitemap`);
}

try { await access(path.join(dist, '__copy-review')); failures.push('/__copy-review/: production output exists'); } catch {}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated ${metadata.length} canonical routes, derived metadata, redirects, links, sitemap, and homepage identity`);
