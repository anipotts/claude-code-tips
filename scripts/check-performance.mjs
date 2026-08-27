import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { canonicalContentFiles } from '../src/content-manifest.mjs';

const root = process.cwd();
const mediaRoot = path.join(root, 'public/media/publications');
const manifestPath = path.join(mediaRoot, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];
const maxDerivativeBytes = 150 * 1024;
const maxProviderBytes = 400 * 1024;
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

const trackedMedia = (await readdir(mediaRoot)).filter((file) => file.endsWith('.webp')).map((file) => `/media/publications/${file}`);
for (const file of trackedMedia) if (!derivativePaths.has(file)) failures.push(`${file}: derivative is absent from the manifest`);
for (const file of derivativePaths) if (!trackedMedia.includes(file)) failures.push(`${file}: manifest entry has no derivative file`);

const originalUrls = new Set();
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

const imageLcpRoutes = new Set(['/guides/claude-code/', '/guides/grok/']);
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
  if (bytes > maxProviderBytes) failures.push(`${route}: ${bytes} mobile image bytes exceeds 400 KiB`);
}

for (const tag of tagsByRoute.get('/history/') ?? []) {
  if (attribute(tag, 'loading') !== 'lazy') failures.push('/history/: publication images must remain lazy');
  if (attribute(tag, 'fetchpriority')) failures.push('/history/: below-fold images must not set fetch priority');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated ${manifest.assets.length} original media records and ${derivativePaths.size} responsive derivatives against performance budgets`);
