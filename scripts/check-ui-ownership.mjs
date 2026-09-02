import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const read = (file) => readFile(path.join(root, file), 'utf8');

const walk = async (directory) => (await Promise.all((await readdir(path.join(root, directory), { withFileTypes: true })).map(async (entry) => {
  const relative = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(relative) : [relative];
}))).flat();

const config = JSON.parse(await read('starwind.config.json'));
const packageJson = JSON.parse(await read('package.json'));
const registered = new Set(config.components.map(({ name }) => name));
const installed = new Set((await readdir(path.join(root, config.componentDir), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name));

for (const name of installed) if (!registered.has(name)) failures.push(`unregistered Starwind component source: ${name}`);
for (const name of registered) if (!installed.has(name)) failures.push(`registered Starwind component source is missing: ${name}`);

const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
for (const name of Object.keys(dependencies)) {
  if (name === 'react' || name === 'react-dom' || name.startsWith('@types/react')) failures.push(`React dependency is prohibited: ${name}`);
  if (name === 'astro-icon' || name.startsWith('@iconify/')) failures.push(`retired icon dependency remains: ${name}`);
}

const retiredFiles = [
  'src/components/AccessibleTables.astro',
  'src/components/RailHead.astro',
  'src/components/SearchAccess.astro',
  'src/components/ThemeControl.astro',
  'src/components/ThemeHead.astro',
  'src/pages-dev/copy-review.astro',
  'src/pages-dev/copy-review-api.ts',
  'scripts/start-copy-review.mjs',
];
const files = await walk('src');
const repositoryFiles = [...files, ...(await walk('scripts'))];
const repositoryText = new Map(await Promise.all(repositoryFiles
  .filter((file) => /\.(?:astro|css|js|mjs|ts)$/.test(file))
  .map(async (file) => [file, await read(file)])));

for (const file of retiredFiles) if (repositoryText.has(file)) failures.push(`retired UI source remains: ${file}`);

const prohibited = [
  ['legacy theme storage', /coding-agent-tips:theme/],
  ['legacy rail storage', /coding-agent-tips:reading-rails/],
  ['copy review UI', /copy-review/],
  ['native dialog state machine', /\.showModal\s*\(/],
  ['custom page-action disclosure', /<details[^>]+page-action/],
  ['custom mobile navigation disclosure', /<details[^>]+mobile-site-menu/],
];

for (const [file, source] of repositoryText) {
  if (file === 'scripts/check-ui-ownership.mjs') continue;
  if (file.startsWith('src/components/starwind/')) continue;
  for (const [label, pattern] of prohibited) if (pattern.test(source)) failures.push(`${file}: ${label} is prohibited`);
}

const allowedControllers = new Set([
  'src/components/PublicationEnhancements.astro',
  'src/components/StarlightPageSidebar.astro',
  'src/components/StarlightPageTitle.astro',
  'src/components/StarlightThemeProvider.astro',
  'src/components/ThemeBridge.astro',
]);
for (const [file, source] of repositoryText) {
  if (file.startsWith('src/components/starwind/') || !file.startsWith('src/components/')) continue;
  if (/<script(?:\s|>)/i.test(source) && !allowedControllers.has(file)) failures.push(`${file}: custom browser controller is not in the ownership allowlist`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated ${registered.size} registered Starwind components and public UI ownership boundaries`);
