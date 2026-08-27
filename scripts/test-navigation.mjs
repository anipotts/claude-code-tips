import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const previewPort = 4175;
const origin = `http://127.0.0.1:${previewPort}`;
const astro = path.join(process.cwd(), 'node_modules/astro/bin/astro.mjs');
const vite = path.join(process.cwd(), 'node_modules/vite/bin/vite.js');
const failures = [];
const build = spawnSync(process.execPath, [astro, 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'], { stdio: 'inherit' });
const serverExit = once(server, 'exit');
let browser;

const expect = (condition, message) => { if (!condition) failures.push(message); };
const traverse = async (page, direction) => {
  await page.evaluate((nextDirection) => {
    window.__navigationTraversalComplete = new Promise((resolve) => document.addEventListener('astro:page-load', resolve, { once: true }));
    history[nextDirection]();
  }, direction);
  await page.evaluate(() => window.__navigationTraversalComplete);
};

try {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    if (attempt === 39) throw new Error('astro preview did not become ready');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.addInitScript(() => { window.__navigationDocumentToken = crypto.randomUUID(); });
  await page.goto(origin, { waitUntil: 'networkidle' });
  const documentToken = await page.evaluate(() => window.__navigationDocumentToken);
  expect(await page.title() === 'coding agent tips', 'homepage title is incorrect');
  expect(await page.locator('meta[name="astro-view-transitions-enabled"]').count() === 1, 'homepage ClientRouter marker is missing');
  await page.locator('.site-header').evaluate((header) => header.setAttribute('data-stale-navigation-test', 'true'));

  await page.locator('.provider-tabs a[href="/guides/codex/"]').click();
  await page.waitForURL('**/guides/codex/');
  await page.waitForSelector('.astro-route-announcer');
  await page.waitForTimeout(100);
  expect(documentToken === await page.evaluate(() => window.__navigationDocumentToken), 'homepage to document navigation caused a full reload');
  expect(await page.title() === 'codex | coding agent tips', 'document title did not update after navigation');
  expect((await page.locator('.astro-route-announcer').textContent())?.trim() === 'codex | coding agent tips', 'route announcement did not report the destination title');
  expect((await page.locator('.provider-tabs [aria-current="page"]').textContent())?.trim() === 'codex', 'provider navigation did not update its active state');
  expect(await page.locator('.site-header').getAttribute('data-stale-navigation-test') === null, 'the router retained stale header DOM');
  expect(await page.evaluate(() => document.activeElement === document.body), 'focus did not return to the document body after the route swap');
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length) === 0, 'decorative route motion remains active');

  await page.locator('.mobile-site-menu summary').click();
  expect(await page.locator('.mobile-site-menu').getAttribute('open') !== null, 'mobile menu did not open');
  await page.locator('.mobile-site-menu a[href="/guides/codex/configuration/"]').click();
  await page.waitForURL('**/guides/codex/configuration/');
  expect(await page.locator('.mobile-site-menu').getAttribute('open') === null, 'mobile menu state persisted into the destination');
  expect((await page.locator('.handbook-sidebar [aria-current="page"]').textContent())?.trim() === 'configuration', 'nested navigation active state is incorrect');

  await traverse(page, 'back');
  await page.waitForURL('**/guides/codex/');
  expect(documentToken === await page.evaluate(() => window.__navigationDocumentToken), 'back navigation caused a full reload');
  const expectedScroll = await page.evaluate(() => {
    const next = Math.min(700, document.documentElement.scrollHeight - innerHeight);
    scrollTo(0, next);
    return scrollY;
  });
  await page.locator('.provider-tabs a[href="/guides/claude-code/"]').evaluate((link) => link.click());
  await page.waitForURL('**/guides/claude-code/');
  await traverse(page, 'back');
  await page.waitForURL('**/guides/codex/');
  await page.waitForTimeout(50);
  expect(Math.abs(await page.evaluate(() => scrollY) - expectedScroll) <= 2, 'back navigation did not restore scroll position');
  await traverse(page, 'forward');
  await page.waitForURL('**/guides/claude-code/');
  expect(documentToken === await page.evaluate(() => window.__navigationDocumentToken), 'forward navigation caused a full reload');

  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.locator('.provider-tabs a[href="/guides/codex/"]').click();
  await page.waitForURL('**/guides/codex/');
  const hashLinks = page.locator('.right-sidebar a[href^="#"]:not([href="#_top"]):visible');
  const hashHref = await hashLinks.first().getAttribute('href');
  expect(Boolean(hashHref), 'document table of contents has no hash link');
  if (hashHref) {
    await hashLinks.first().click();
    await page.waitForURL(`**/guides/codex/${hashHref}`);
    expect(documentToken === await page.evaluate(() => window.__navigationDocumentToken), 'hash navigation caused a full reload');
    expect(await page.locator(hashHref).count() === 1, 'hash navigation target is missing');
  }
  expect((await page.locator('.github-link').getAttribute('href')) === 'https://github.com/anipotts/coding-agent-tips', 'external GitHub URL changed');

  const artifactDirectory = process.env.NAVIGATION_ARTIFACT_DIR;
  if (artifactDirectory) {
    await mkdir(artifactDirectory, { recursive: true });
    await page.screenshot({ path: path.join(artifactDirectory, 'codex-desktop.png'), fullPage: false });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(artifactDirectory, 'codex-mobile.png'), fullPage: false });
  }
  await context.close();

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto(origin, { waitUntil: 'domcontentloaded' });
  expect(await noScriptPage.locator('.provider-tabs a[href="/guides/codex/"]').getAttribute('href') === '/guides/codex/', 'ordinary internal URL changed without JavaScript');
  await noScriptPage.locator('.provider-tabs a[href="/guides/codex/"]').click();
  await noScriptPage.waitForURL('**/guides/codex/');
  expect((await noScriptPage.locator('h1').textContent())?.trim() === 'codex', 'progressive navigation failed without JavaScript');
  await noScriptContext.close();

  for (const error of consoleErrors) failures.push(`browser console: ${error}`);
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGTERM');
  await serverExit;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { await fetch(origin); } catch { break; }
    if (attempt === 39) throw new Error(`preview port ${previewPort} was not released after shutdown`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('client navigation, announcements, focus, history, hashes, scroll restoration, active state, mobile menu reset, external URLs, and no-script fallback passed');
