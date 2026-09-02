import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const localOrigin = 'http://127.0.0.1:4331';
const isolatedOrigin = 'http://127.0.0.1:4177';
const astro = path.join(process.cwd(), 'node_modules/astro/bin/astro.mjs');
const build = spawnSync(process.execPath, [astro, 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
let origin = isolatedOrigin;
let server;
let serverExit;
let browser;

try {
  try {
    if ((await fetch(localOrigin)).ok) origin = localOrigin;
  } catch {}

  if (origin === isolatedOrigin) {
    server = spawn(process.execPath, [astro, 'dev', '--host', '127.0.0.1', '--port', '4177'], { stdio: 'inherit' });
    serverExit = once(server, 'exit');
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try { if ((await fetch(origin)).ok) break; } catch {}
      if (attempt === 39) throw new Error('astro development server did not become ready');
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 820, height: 856 } });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  await page.locator('.header-search [data-open-modal]').click();
  const search = page.locator('.header-search site-search dialog');
  await search.waitFor({ state: 'visible' });
  const input = search.locator('input[type="text"], input[type="search"]').first();
  const inputSpacing = await input.evaluate((element) => {
    const inputStyles = getComputedStyle(element);
    const form = element.closest('form');
    const iconStyles = getComputedStyle(form, '::before');
    return Number.parseFloat(inputStyles.paddingInlineStart)
      - Number.parseFloat(iconStyles.left)
      - Number.parseFloat(iconStyles.width);
  });
  if (inputSpacing < 8) throw new Error('local search query text overlaps the search icon');
  await input.fill('configuration');
  const result = search.locator('.pagefind-ui__result').first();
  await result.waitFor({ state: 'visible', timeout: 5000 });
  if (!(await result.textContent())?.toLowerCase().includes('configuration')) throw new Error('local search did not return the expected guide result');
  if (errors.length) throw new Error(`local search console errors: ${errors.join(' | ')}`);
} finally {
  await browser?.close();
  if (server && server.exitCode === null && server.signalCode === null) server.kill('SIGTERM');
  if (serverExit) await serverExit;
}

console.log('local development search loaded the Pagefind index and returned results');
