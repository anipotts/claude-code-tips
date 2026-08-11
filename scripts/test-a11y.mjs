import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import process from 'node:process';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const origin = 'http://127.0.0.1:4173';
const fieldRunFiles = (await readdir(new URL('../docs/field-lab/runs/', import.meta.url)))
  .filter((file) => file.endsWith('.json'))
  .sort();
const routes = [
  '/',
  '/guides/codex/',
  '/guides/claude-code/',
  ...fieldRunFiles.map((file) => `/field-lab/runs/${file.replace(/\.json$/, '')}/`),
];
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 1024 },
];

const server = spawn(
  'bun',
  ['x', 'astro', 'preview', '--host', '127.0.0.1', '--port', '4173'],
  { stdio: 'inherit' },
);

const waitForServer = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // the preview is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('astro preview did not become ready');
};

const failures = [];
let browser;

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    for (const route of routes) {
      await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      if (overflow) failures.push(`${viewport.name} ${route}: horizontal overflow`);

      const report = await new AxeBuilder({ page }).analyze();
      for (const violation of report.violations) {
        if (violation.impact === 'serious' || violation.impact === 'critical') {
          const targets = violation.nodes.flatMap((node) => node.target).join(', ');
          failures.push(
            `${viewport.name} ${route}: ${violation.impact} ${violation.id} on ${violation.nodes.length} node(s) at ${targets}`,
          );
        }
      }
    }

    await context.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`axe found no serious or critical issues across ${routes.length} routes at mobile and desktop widths`);
