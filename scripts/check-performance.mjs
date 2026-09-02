import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';
import sharp from 'sharp';
import { canonicalContentFiles } from '../src/content-manifest.mjs';

const root = process.cwd();
const mediaRoot = path.join(root, 'public/media/publications');
const manifestPath = path.join(mediaRoot, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];
const maxDerivativeBytes = 150 * 1024;
const maxProviderBytes = 400 * 1024;
const maxFeaturedProviderBytes = 1024 * 1024;
const maxGuideHtmlGzipBytes = 24 * 1024;
const maxGuideCssGzipBytes = 32 * 1024;
const maxGuideJavaScriptGzipBytes = 72 * 1024;
const maxFontBytes = 80 * 1024;
const maxFontFiles = 4;
const maxAgentIndexGzipBytes = 32 * 1024;
const canonicalRoutes = new Set(canonicalContentFiles().map(({ route }) => route));
const providerRoutes = ['/guides/codex/', '/guides/claude-code/', '/guides/grok/'];
const providerRouteSet = new Set(providerRoutes);
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const attribute = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.retrievedAt)) failures.push('media manifest retrieval date is missing or invalid');
if (manifest.derivativeFormat !== 'webp') failures.push('media manifest derivative format must be webp');
if (JSON.stringify(manifest.derivativeWidths) !== '[640,1200]') failures.push('media manifest derivative widths must be 640 and 1200');

const derivativePaths = new Set();
const derivativeByPath = new Map();
const featuredImageByPath = new Map();
for (const [setId, derivatives] of Object.entries(manifest.derivativeSets)) {
  if (derivatives.length !== 2) failures.push(`${setId}: expected two responsive derivatives`);
  if (JSON.stringify(derivatives.map(({ width }) => width).sort((a, b) => a - b)) !== '[640,1200]') failures.push(`${setId}: derivative widths do not match the responsive policy`);
  for (const derivative of derivatives) {
    const file = path.join(root, 'public', derivative.path.replace(/^\//, ''));
    derivativePaths.add(derivative.path);
    derivativeByPath.set(derivative.path, derivative);
    let buffer;
    try { buffer = await readFile(file); } catch { failures.push(`${derivative.path}: derivative file is missing`); continue; }
    const metadata = await sharp(buffer).metadata();
    if (buffer.length !== derivative.bytes) failures.push(`${derivative.path}: byte count differs from the manifest`);
    if (buffer.length > maxDerivativeBytes) failures.push(`${derivative.path}: ${buffer.length} bytes exceeds 150 KiB`);
    if (sha256(buffer) !== derivative.sha256) failures.push(`${derivative.path}: sha256 differs from the manifest`);
    if (metadata.format !== 'webp') failures.push(`${derivative.path}: expected webp, received ${metadata.format}`);
    if (metadata.width !== derivative.width || metadata.height !== derivative.height) failures.push(`${derivative.path}: intrinsic dimensions differ from the manifest`);
  }
}

for (const image of manifest.featuredImages ?? []) {
  const file = path.join(root, 'public', image.path.replace(/^\//, ''));
  featuredImageByPath.set(image.path, image);
  let buffer;
  try { buffer = await readFile(file); } catch { failures.push(`${image.path}: featured image file is missing`); continue; }
  const metadata = await sharp(buffer).metadata();
  if (buffer.length !== image.bytes) failures.push(`${image.path}: byte count differs from the manifest`);
  if (buffer.length > maxFeaturedProviderBytes) failures.push(`${image.path}: ${buffer.length} bytes exceeds 1 MiB`);
  if (sha256(buffer) !== image.sha256) failures.push(`${image.path}: sha256 differs from the manifest`);
  if (metadata.format !== 'png') failures.push(`${image.path}: expected png, received ${metadata.format}`);
  if (metadata.width !== image.width || metadata.height !== image.height) failures.push(`${image.path}: intrinsic dimensions differ from the manifest`);
  for (const route of image.canonicalPages ?? []) if (!canonicalRoutes.has(route)) failures.push(`${image.id}: unknown canonical page ${route}`);
}

const trackedMedia = (await readdir(mediaRoot)).filter((file) => file.endsWith('.webp')).map((file) => `/media/publications/${file}`);
for (const file of trackedMedia) if (!derivativePaths.has(file)) failures.push(`${file}: derivative is absent from the manifest`);
for (const file of derivativePaths) if (!trackedMedia.includes(file)) failures.push(`${file}: manifest entry has no derivative file`);

const originalUrls = new Set();
const sourceAssetIds = new Set(manifest.assets.map((asset) => asset.id));
for (const asset of manifest.assets) {
  if (originalUrls.has(asset.originalUrl)) failures.push(`${asset.id}: original URL is duplicated in the manifest`);
  originalUrls.add(asset.originalUrl);
  if (!Array.isArray(asset.sourcePages) || asset.sourcePages.length === 0) failures.push(`${asset.id}: source pages are missing`);
  if (!Array.isArray(asset.canonicalPages) || asset.canonicalPages.length === 0) failures.push(`${asset.id}: canonical pages are missing`);
  for (const route of asset.canonicalPages) if (!canonicalRoutes.has(route)) failures.push(`${asset.id}: unknown canonical page ${route}`);
  if (!asset.original?.width || !asset.original?.height || !/^[a-f0-9]{64}$/.test(asset.original?.sha256 ?? '')) failures.push(`${asset.id}: original dimensions or hash are invalid`);
  if (!manifest.derivativeSets[asset.derivativeSet]) failures.push(`${asset.id}: derivative set ${asset.derivativeSet} is missing`);
}
const tagsByRoute = new Map();
for (const { route, file } of canonicalContentFiles()) {
  const source = await readFile(file, 'utf8');
  const tags = [...source.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
  tagsByRoute.set(route, tags);
  for (const tag of tags) {
    const src = attribute(tag, 'src');
    if (providerRouteSet.has(route) && /^https?:\/\//.test(src ?? '')) failures.push(`${route}: external raster image remains in provider overview`);
    if (featuredImageByPath.has(src)) {
      const image = featuredImageByPath.get(src);
      if (attribute(tag, 'decoding') !== 'async') failures.push(`${route}: ${src} must decode asynchronously`);
      if (!['eager', 'lazy'].includes(attribute(tag, 'loading'))) failures.push(`${route}: ${src} has no loading policy`);
      if (Number(attribute(tag, 'width')) !== image.width || Number(attribute(tag, 'height')) !== image.height) failures.push(`${route}: ${src} markup dimensions differ from the featured image manifest`);
      continue;
    }
    if (!src?.startsWith('/media/publications/')) continue;
    const srcset = attribute(tag, 'srcset') ?? '';
    const sizes = attribute(tag, 'sizes');
    const width = Number(attribute(tag, 'width'));
    const height = Number(attribute(tag, 'height'));
    const derivative = derivativeByPath.get(src);
    if (!derivative) failures.push(`${route}: ${src} is absent from the manifest`);
    if (!srcset.includes(' 640w') || !srcset.includes(' 1200w')) failures.push(`${route}: ${src} lacks both responsive candidates`);
    if (!sizes) failures.push(`${route}: ${src} lacks an accurate sizes attribute`);
    if (attribute(tag, 'decoding') !== 'async') failures.push(`${route}: ${src} must decode asynchronously`);
    if (!['eager', 'lazy'].includes(attribute(tag, 'loading'))) failures.push(`${route}: ${src} has no loading policy`);
    if (derivative && (width !== derivative.width || height !== derivative.height)) failures.push(`${route}: ${src} markup dimensions differ from the fallback derivative`);
  }
}

const imageLcpRoutes = new Set(providerRoutes);
for (const route of providerRoutes) {
  const tags = tagsByRoute.get(route) ?? [];
  const eager = tags.filter((tag) => attribute(tag, 'loading') === 'eager');
  const high = tags.filter((tag) => attribute(tag, 'fetchpriority') === 'high');
  if (imageLcpRoutes.has(route)) {
    if (eager.length !== 1 || high.length !== 1 || eager[0] !== tags[0] || high[0] !== tags[0]) failures.push(`${route}: only the traced first image may be eager and high priority`);
  } else if (eager.length !== 0 || high.length !== 0) failures.push(`${route}: non-image LCP route must not prioritize publication images`);
  for (const tag of tags.slice(imageLcpRoutes.has(route) ? 1 : 0)) if (attribute(tag, 'loading') !== 'lazy' || attribute(tag, 'fetchpriority')) failures.push(`${route}: non-LCP images must remain lazy and normal priority`);
  const mobileFiles = new Set(tags.map((tag) => (attribute(tag, 'srcset') ?? '').split(',').map((candidate) => candidate.trim()).find((candidate) => candidate.endsWith(' 640w'))?.split(' ')[0]).filter(Boolean));
  let bytes = 0;
  for (const file of mobileFiles) bytes += (await stat(path.join(root, 'public', file.replace(/^\//, '')))).size;
  for (const tag of tags) {
    const src = attribute(tag, 'src');
    if (featuredImageByPath.has(src)) bytes += (await stat(path.join(root, 'public', src.replace(/^\//, '')))).size;
  }
  const providerBudget = tags.some((tag) => featuredImageByPath.has(attribute(tag, 'src'))) ? maxFeaturedProviderBytes : maxProviderBytes;
  if (bytes > providerBudget) failures.push(`${route}: ${bytes} mobile image bytes exceeds ${providerBudget / 1024} KiB`);
}

for (const tag of tagsByRoute.get('/handbook/history/') ?? []) {
  if (attribute(tag, 'loading') !== 'lazy') failures.push('/handbook/history/: publication images must remain lazy');
  if (attribute(tag, 'fetchpriority')) failures.push('/handbook/history/: below-fold images must not set fetch priority');
}

const distRoot = path.join(root, 'dist');
const agentIndexGzipBytes = gzipSync(await readFile(path.join(distRoot, 'agent-index.json'))).length;
if (agentIndexGzipBytes > maxAgentIndexGzipBytes) failures.push(`${agentIndexGzipBytes} compressed agent index bytes exceeds 32 KiB`);
const assetRoot = path.join(distRoot, '_astro');
const guideStylesheets = new Set();
const guideScripts = new Set();
for (const { route } of canonicalContentFiles().filter(({ route }) => route.startsWith('/guides/'))) {
  const htmlPath = path.join(distRoot, route.replace(/^\//, ''), 'index.html');
  const html = await readFile(htmlPath);
  const htmlGzipBytes = gzipSync(html).length;
  if (htmlGzipBytes > maxGuideHtmlGzipBytes) failures.push(`${route}: ${htmlGzipBytes} compressed HTML bytes exceeds 24 KiB`);
  const source = html.toString();
  if (new RegExp(`origin${'-'}trial|navigator\\.modelContext`).test(source)) failures.push(`${route}: unsupported WebMCP compatibility code is present`);
  if (source.includes('--surface-canvas:') || source.includes('--rail-expanded-width:')) failures.push(`${route}: shared site CSS is inlined into generated HTML`);
  for (const [tag] of source.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)) {
    if (tag.includes('media="print"')) continue;
    const href = attribute(tag, 'href');
    if (href?.startsWith('/_astro/') && href.endsWith('.css')) guideStylesheets.add(href);
  }
  const routeScripts = [...source.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
    .map((match) => match[1])
    .filter((src) => src.startsWith('/_astro/') && src.endsWith('.js'));
  if (routeScripts.length !== new Set(routeScripts).size) failures.push(`${route}: duplicate component script assets are rendered`);
  for (const src of routeScripts) guideScripts.add(src);
}

let guideCssGzipBytes = 0;
for (const href of guideStylesheets) guideCssGzipBytes += gzipSync(await readFile(path.join(distRoot, href.replace(/^\//, '')))).length;
if (guideCssGzipBytes > maxGuideCssGzipBytes) failures.push(`${guideCssGzipBytes} compressed guide CSS bytes exceeds 32 KiB`);

const reachableScripts = new Set();
const scriptQueue = [...guideScripts];
while (scriptQueue.length > 0) {
  const src = scriptQueue.pop();
  if (!src || reachableScripts.has(src)) continue;
  reachableScripts.add(src);
  const source = (await readFile(path.join(distRoot, src.replace(/^\//, '')))).toString();
  if (/\b(?:react|react-dom)\b/.test(source)) failures.push(`${src}: React runtime code is prohibited`);
  for (const match of source.matchAll(/(?:from\s*|import\s*\()?["'](\.\/[^"']+\.js)["']/g)) {
    scriptQueue.push(`/_astro/${path.basename(match[1])}`);
  }
}
let guideJavaScriptGzipBytes = 0;
for (const src of reachableScripts) guideJavaScriptGzipBytes += gzipSync(await readFile(path.join(distRoot, src.replace(/^\//, '')))).length;
if (guideJavaScriptGzipBytes > maxGuideJavaScriptGzipBytes) failures.push(`${guideJavaScriptGzipBytes} compressed reachable guide JavaScript bytes exceeds 72 KiB`);

const fontFiles = (await readdir(assetRoot)).filter((file) => /\.(?:woff2?|ttf|otf)$/.test(file));
let fontBytes = 0;
for (const file of fontFiles) fontBytes += (await stat(path.join(assetRoot, file))).size;
if (fontFiles.length > maxFontFiles) failures.push(`${fontFiles.length} generated font files exceeds the ${maxFontFiles} file budget`);
if (fontBytes > maxFontBytes) failures.push(`${fontBytes} generated font bytes exceeds 80 KiB`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated media, guide HTML, ${agentIndexGzipBytes} compressed agent-index bytes, ${guideStylesheets.size} shared stylesheets, ${reachableScripts.size} reachable scripts, and ${fontFiles.length} font files against performance budgets`);
