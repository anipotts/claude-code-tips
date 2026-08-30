import { readFile } from 'node:fs/promises';
import process from 'node:process';
import registry from '../docs/sources.json' with { type: 'json' };
import { canonicalContentFiles } from '../src/content-manifest.mjs';

const normalizeUrl = (value) => {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return value;
  }
};

const sourceByUrl = new Map();
for (const source of registry.sources) {
  for (const value of [source.url, ...(source.aliases ?? [])]) sourceByUrl.set(normalizeUrl(value), source);
}

const normalizedLabel = (value) => value
  .replace(/[`_*]/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const wordCount = (value) => normalizedLabel(value).split(/\s+/).filter(Boolean).length;
const genericLabel = /^(?:read(?: the)? (?:paper|announcement|documentation)|official (?:overview|documentation)|documentation|learn more|click here|source|more)$/i;
const pairedGuide = (file) => /docs\/guides\/(?:codex|claude-code)(?:\/|\.md$)/.test(file.replaceAll('\\', '/'));
const sentenceBounds = (markdown, index) => {
  const before = markdown.slice(0, index);
  const after = markdown.slice(index);
  const startMatch = [...before.matchAll(/(?:[.!?]\s+|\n\s*\n)/g)].at(-1);
  const endMatch = after.match(/[.!?](?=\s|\n|$)|\n\s*\n/);
  return {
    start: startMatch ? startMatch.index + startMatch[0].length : 0,
    end: endMatch ? index + endMatch.index + endMatch[0].length : markdown.length,
  };
};
const sentenceFor = (markdown, index) => {
  const { start, end } = sentenceBounds(markdown, index);
  return markdown.slice(start, end)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const failures = [];

for (const { file, kind } of canonicalContentFiles()) {
  if (kind === 'run') continue;
  const markdown = await readFile(file, 'utf8');
  const links = [
    ...[...markdown.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map((match) => ({
      label: match[1],
      url: match[2],
      index: match.index,
      media: false,
      markdownLink: true,
    })),
    ...[...markdown.matchAll(/<a\b[^>]*href="(https?:\/\/[^\"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((match) => ({
      label: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: match[1],
      index: match.index,
      media: /<img\b/i.test(match[2]),
      markdownLink: false,
    })),
  ];

  for (const { label, url, index, media, markdownLink } of links) {
    const normalizedUrl = normalizeUrl(url);
    const source = sourceByUrl.get(normalizedUrl);
    if (!source) failures.push(`${file}: external editorial link is not registered: ${url}`);
    if (!label || media) continue;
    const cleanLabel = normalizedLabel(label);
    if (genericLabel.test(cleanLabel)) failures.push(`${file}: generic editorial link label: ${JSON.stringify(cleanLabel)}`);
    const words = wordCount(cleanLabel);
    const officialTitle = source && cleanLabel.toLowerCase() === source.title.toLowerCase();
    const hardLimit = pairedGuide(file) ? 6 : 8;
    if (words > hardLimit && !officialTitle) failures.push(`${file}: editorial link label exceeds ${hardLimit} words: ${JSON.stringify(cleanLabel)}`);
    if (pairedGuide(file) && words > 4 && !officialTitle) {
      const sentenceWords = wordCount(sentenceFor(markdown, index));
      if (sentenceWords > 0 && words / sentenceWords > 0.5) failures.push(`${file}: long editorial link covers more than half its sentence: ${JSON.stringify(cleanLabel)}`);
    }
    if (pairedGuide(file) && markdownLink && officialTitle) {
      const tail = markdown.slice(index).match(/^\[[^\]]+\]\([^)]+\)([.!?]?)(?=\s*(?:\n\s*\n|$))/);
      if (tail) failures.push(`${file}: trailing source-title citation should be embedded in the claim: ${JSON.stringify(cleanLabel)}`);
    }
  }

  if (pairedGuide(file)) {
    const sentenceGroups = new Map();
    for (const link of links) {
      if (link.media) continue;
      const bounds = sentenceBounds(markdown, link.index);
      const key = `${bounds.start}:${bounds.end}`;
      const urls = sentenceGroups.get(key) ?? [];
      urls.push(normalizeUrl(link.url));
      sentenceGroups.set(key, urls);
    }
    for (const urls of sentenceGroups.values()) {
      const duplicate = urls.find((url, index) => urls.indexOf(url) !== index);
      if (duplicate) failures.push(`${file}: one sentence repeats the same normalized link: ${duplicate}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('validated registered, concise, claim-led editorial links with paired-provider citation grammar');
