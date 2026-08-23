import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { canonicalContentFiles } from '../src/content-manifest.mjs';

const origin = 'http://127.0.0.1:4173';
const routes = canonicalContentFiles().map((entry) => entry.route);
const viewports = [
  { name: 'mobile small', width: 375, height: 812 },
  { name: 'mobile wide', width: 768, height: 1024 },
  { name: 'tablet square', width: 942, height: 942 },
  { name: 'desktop compact', width: 1024, height: 900 },
  { name: 'desktop annotated', width: 1191, height: 942 },
  { name: 'desktop wide', width: 1440, height: 1024 },
];
spawnSync('bun', ['x', 'astro', 'preview', 'stop'], { stdio: 'ignore' });
const server = spawn('bun', ['x', 'astro', 'preview', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'inherit' });
const failures = [];
let browser;

try {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    if (attempt === 39) throw new Error('astro preview did not become ready');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  browser = await chromium.launch({ headless: true });
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) failures.push(`${viewport.name} ${route}: horizontal overflow`);
      const report = await new AxeBuilder({ page }).analyze();
      for (const violation of report.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')) failures.push(`${viewport.name} ${route}: ${violation.impact} ${violation.id}`);
    }
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  spawnSync('bun', ['x', 'astro', 'preview', 'stop'], { stdio: 'ignore' });
}

if (failures.length > 0) { console.error(failures.join('\n')); process.exit(1); }
console.log(`axe found no serious or critical issues across ${routes.length} routes at ${viewports.length} required widths`);
