import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const blueprint = JSON.parse(await readFile(path.join(root, 'editorial/handbook-blueprints.json'), 'utf8'));
const sourceRegistry = JSON.parse(await readFile(path.join(root, 'editorial/sources.json'), 'utf8'));
const sourceIds = new Set(sourceRegistry.sources.map((source) => source.id));
const failures = [];

function scalar(markdown, key) {
  return markdown.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function headings(markdown) {
  return [...markdown.matchAll(/^(##|###) (.+)$/gm)].map((match) => `${match[1]} ${match[2]}`);
}

function isOrderedSubset(actual, expected) {
  let cursor = 0;
  for (const heading of actual) {
    cursor = expected.indexOf(heading, cursor);
    if (cursor === -1) return false;
    cursor += 1;
  }
  return true;
}

function anchorFor(heading) {
  return heading
    .replace(/^###?\s+/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

for (const guide of blueprint.guides) {
  const relative = guide.file;
  const markdown = await readFile(path.join(root, relative), 'utf8');
  const expected = guide.headings;
  const actual = headings(markdown);
  const completion = scalar(markdown, 'completion');
  const draft = scalar(markdown, 'draft') === 'true';
  const status = scalar(markdown, 'status');

  if (!['outline', 'excerpt', 'complete'].includes(completion)) {
    failures.push(`${relative}: completion must be outline, excerpt, or complete`);
    continue;
  }

  if (completion === 'excerpt') {
    if (!isOrderedSubset(actual, expected)) failures.push(`${relative}: excerpt headings are not an ordered subset of the blueprint`);
  } else if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${relative}: ${completion} headings do not match the blueprint`);
  }

  if (completion === 'outline' && (!draft || status !== 'pending')) {
    failures.push(`${relative}: outline pages must be draft and pending`);
  }
  if (completion !== 'outline' && (draft || status !== 'current')) {
    failures.push(`${relative}: public excerpt and complete pages must be non-draft and current`);
  }
  if (!/^checkedAt:\s*"\d{4}-\d{2}-\d{2}T[^\n]+"$/m.test(markdown)) {
    failures.push(`${relative}: checkedAt is required`);
  }

  const anchors = actual.map(anchorFor);
  const duplicateAnchors = anchors.filter((anchor, index) => anchors.indexOf(anchor) !== index);
  if (duplicateAnchors.length) failures.push(`${relative}: duplicate heading anchors: ${[...new Set(duplicateAnchors)].join(', ')}`);

  if (!guide.provider || !guide.chapter || !guide.evidenceType) failures.push(`${relative}: blueprint metadata is incomplete`);
  if (!Array.isArray(guide.experienceQuestions) || !guide.experienceQuestions.length) failures.push(`${relative}: blueprint experience questions are required`);
  for (const sourceId of guide.sourceIds ?? []) {
    if (!sourceIds.has(sourceId)) failures.push(`${relative}: blueprint source ${sourceId} is absent from editorial/sources.json`);
  }

  if (guide.chapter === 'overview') {
    const firstHeading = markdown.search(/^## /m);
    const firstBody = firstHeading === -1 ? -1 : markdown.indexOf('\n', firstHeading);
    const nextHeading = firstBody === -1 ? -1 : markdown.indexOf('\n## ', firstBody + 1);
    const firstSection = firstBody === -1 ? '' : markdown.slice(firstBody + 1, nextHeading === -1 ? markdown.length : nextHeading);
    if (!firstSection.includes('surface-bento')) failures.push(`${relative}: product visual must appear in the introductory section`);
    const firstImage = firstSection.match(/<img\b[^>]*>/)?.[0] ?? '';
    if (!firstImage.includes('loading="eager"') || !firstImage.includes('fetchpriority="high"')) {
      failures.push(`${relative}: introductory product visual must prioritize the first image`);
    }
    if (guide.provider === 'codex') {
      const imageCount = (firstSection.match(/<img\b/g) ?? []).length;
      if (!firstSection.trimStart().startsWith('<div class="surface-bento intro-visual">')) failures.push(`${relative}: Codex visual must immediately follow its introductory heading`);
      if (imageCount !== 1 || !firstImage.includes('src="/media/guides/codex-handbook-workspace.png"')) failures.push(`${relative}: Codex introduction must use exactly one local image`);
      if (!firstImage.includes('width="3600"') || !firstImage.includes('height="2260"')) failures.push(`${relative}: Codex introduction must retain the supplied image at full resolution`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated handbook publication contracts for ${blueprint.guides.length} guides`);
