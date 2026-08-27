import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const owner = path.join(sourceRoot, 'styles', 'typography.css');
const controlledDeclaration = /(?:^|[;{])\s*(font|font-family|font-size|font-weight|line-height|letter-spacing|text-transform)\s*:/gm;
const controlledInlineDeclaration = /\b(font|font-family|font-size|font-weight|line-height|letter-spacing|text-transform)\s*:/gm;
const failures = [];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  }))).flat();
};

const lineFor = (source, offset) => source.slice(0, offset).split('\n').length;

for (const file of await walk(sourceRoot)) {
  if (file === owner || !/\.(?:astro|css)$/.test(file)) continue;
  const source = await readFile(file, 'utf8');
  const regions = file.endsWith('.astro')
    ? [
        ...[...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)]
          .map((match) => ({ source: match[1], offset: match.index + match[0].indexOf(match[1]), matcher: controlledDeclaration })),
        ...[...source.matchAll(/<[^>]*\bstyle\s*=[^>]*>/gs)]
          .map((match) => ({ source: match[0], offset: match.index, matcher: controlledInlineDeclaration })),
      ]
    : [{ source, offset: 0, matcher: controlledDeclaration }];

  for (const region of regions) {
    for (const match of region.source.matchAll(region.matcher)) {
      failures.push(`${path.relative(root, file)}:${lineFor(source, region.offset + match.index)} declares ${match[1]} outside src/styles/typography.css`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('validated centralized ownership of project typography declarations');
