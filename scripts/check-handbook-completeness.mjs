import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const blueprint = JSON.parse(await readFile(path.join(root, 'editorial/handbook-blueprints.json'), 'utf8'));
const failures = [];

function scalar(markdown, key) {
  return markdown.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function withoutComments(lines) {
  let inComment = false;
  return lines.filter((line) => {
    if (line.includes('<!--')) inComment = true;
    const keep = !inComment && line.trim().length > 0;
    if (line.includes('-->')) inComment = false;
    return keep;
  });
}

function indexedHeadings(lines) {
  const result = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(##|###) (.+)$/);
    if (match) result.push({ index, level: match[1].length, text: match[2] });
  }
  return result;
}

for (const guide of blueprint.guides) {
  const markdown = await readFile(path.join(root, guide.file), 'utf8');
  const completion = scalar(markdown, 'completion');
  if (completion === 'outline') continue;

  if (/Ani voice pass/i.test(markdown)) failures.push(`${guide.file}: public page contains an Ani voice placeholder`);
  if (scalar(markdown, 'status') === 'pending') failures.push(`${guide.file}: public page cannot have pending status`);

  const lines = markdown.split(/\r?\n/);
  const headings = indexedHeadings(lines);
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const nextHeading = headings[index + 1];
    const end = nextHeading?.index ?? lines.length;
    const body = withoutComments(lines.slice(heading.index + 1, end));

    if (heading.level === 3 && body.length === 0) {
      failures.push(`${guide.file}:${heading.index + 1}: empty H3 "${heading.text}"`);
    }

    if (heading.level === 2) {
      const nextH2 = headings.slice(index + 1).find((candidate) => candidate.level === 2);
      const sectionEnd = nextH2?.index ?? lines.length;
      const children = headings.filter((candidate) => candidate.level === 3 && candidate.index > heading.index && candidate.index < sectionEnd);
      if (!children.length && withoutComments(lines.slice(heading.index + 1, sectionEnd)).length === 0) {
        failures.push(`${guide.file}:${heading.index + 1}: empty H2 "${heading.text}"`);
      }
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('validated substantive content for every public handbook heading');
