import { readFile, readdir } from 'node:fs/promises';
import process from 'node:process';

const directory = new URL('../content/runs/', import.meta.url);
const files = (await readdir(directory)).filter((file) => file.endsWith('.md'));
const requiredSections = ['## what worked & what failed', '## interpretation'];
const requiredFields = ['title', 'date', 'product', 'model', 'version', 'surface', 'baseCommit', 'task', 'passCondition', 'humanInterventions', 'artifacts', 'machine', 'privacy', 'limitations', 'openQuestions'];
const failures = [];

for (const file of files) {
  const markdown = await readFile(new URL(file, directory), 'utf8');
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  for (const field of requiredFields) if (!new RegExp(`^${field}:`, 'm').test(frontmatter)) failures.push(`${file}: missing ${field}`);
  for (const section of requiredSections) if (!markdown.includes(section)) failures.push(`${file}: missing ${section}`);
}

if (failures.length > 0) { console.error(failures.join('\n')); process.exit(1); }
console.log(`validated ${files.length} canonical Markdown field runs`);
