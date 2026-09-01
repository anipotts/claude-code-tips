import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { canonicalContentFiles } from '../src/content-manifest.mjs';

const previewPort = 4176;
const origin = `http://127.0.0.1:${previewPort}`;
const vite = path.join(process.cwd(), 'node_modules/vite/bin/vite.js');
const routes = canonicalContentFiles().map((entry) => entry.route);
const viewports = [
  { name: 'reflow narrow', width: 320, height: 800 },
  { name: 'mobile small', width: 375, height: 812 },
  { name: '200% browser zoom equivalent', width: 720, height: 500 },
  { name: 'mobile wide', width: 768, height: 1024 },
  { name: 'tablet square', width: 942, height: 942 },
  { name: 'desktop compact', width: 1024, height: 900 },
  { name: 'desktop annotated', width: 1191, height: 942 },
  { name: 'desktop wide', width: 1440, height: 1024 },
];
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'], { stdio: 'inherit' });
const serverExit = once(server, 'exit');
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
      const typographyFailures = await page.evaluate(({ route, viewportWidth }) => {
        const findings = [];
        const ink = 'rgb(16, 17, 20)';
        const slate = 'rgb(80, 87, 96)';
        const close = (actual, expected, tolerance = 0.25) => Math.abs(actual - expected) <= tolerance;
        const visible = (element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
        const directText = (element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        const style = (element) => getComputedStyle(element);
        const number = (value) => Number.parseFloat(value);
        const checkRole = (elements, expected, label) => {
          for (const element of elements.filter(visible)) {
            const computed = style(element);
            if (expected.size !== undefined && !close(number(computed.fontSize), expected.size)) findings.push(`${label} font-size ${computed.fontSize}: ${element.textContent.trim().slice(0, 60)}`);
            if (expected.line !== undefined && !close(number(computed.lineHeight), expected.line)) findings.push(`${label} line-height ${computed.lineHeight}: ${element.textContent.trim().slice(0, 60)}`);
            if (expected.weight !== undefined && computed.fontWeight !== String(expected.weight)) findings.push(`${label} font-weight ${computed.fontWeight}: ${element.textContent.trim().slice(0, 60)}`);
            if (expected.family && !computed.fontFamily.includes(expected.family)) findings.push(`${label} font-family ${computed.fontFamily}: ${element.textContent.trim().slice(0, 60)}`);
            if (expected.color && computed.color !== expected.color) findings.push(`${label} color ${computed.color}: ${element.textContent.trim().slice(0, 60)}`);
          }
        };
        const elements = (selector) => [...document.querySelectorAll(selector)];

        const textElements = elements('body *').filter((element) => visible(element) && directText(element));
        for (const element of textElements) {
          const computed = style(element);
          if (number(computed.fontSize) < 12) findings.push(`public text below 12px (${computed.fontSize}): ${element.textContent.trim().slice(0, 60)}`);
          if (computed.fontFamily.includes('Instrument Sans') && !['400', '600'].includes(computed.fontWeight)) findings.push(`unsupported sans weight ${computed.fontWeight}: ${element.textContent.trim().slice(0, 60)}`);
        }

        const displaySize = Math.min(64, Math.max(44, viewportWidth * .05));
        const titleSize = Math.min(48, Math.max(36, viewportWidth * .04));
        const headingSize = Math.min(32, Math.max(28, viewportWidth * .02));
        if (route === '/') checkRole(elements('.home-content h1'), { size: displaySize, line: displaySize, weight: 600, family: 'Instrument Sans', color: ink }, 'display h1');
        else checkRole(elements('main h1'), { size: titleSize, line: titleSize * 1.05, weight: 600, family: 'Instrument Sans', color: ink }, 'page h1');
        if (route !== '/' && elements('.home-content h1').length > 0) findings.push('display h1 appears outside the homepage');
        checkRole(elements('main h2'), { size: headingSize, line: headingSize * 1.15, weight: 600, family: 'Instrument Sans', color: ink }, 'content h2');
        checkRole(elements('main h3:not(.source-publisher h3)'), { size: 22, line: 27.5, weight: 600, family: 'Instrument Sans', color: ink }, 'content h3');
        checkRole(elements('.source-publisher h3'), { size: 16, line: 24, weight: 600, family: 'Instrument Sans', color: ink }, 'source publisher heading');

        const reading = elements('.home-content p, .home-guides p, .sl-markdown-content p, .run-page p, .source-groups > p')
          .filter((element) => !element.matches('.section-label, .history-year, .run-header > p:first-child, .source-kinds, .page-meta, [data-slot="item-description"]'));
        checkRole(reading, { size: 18, line: 30, weight: 400, family: 'Instrument Sans', color: ink }, 'reading prose');
        for (const element of reading.filter(visible)) if (element.getBoundingClientRect().width > 816) findings.push(`reading measure exceeds 68ch: ${element.textContent.trim().slice(0, 60)}`);

        checkRole(elements('td, .page-sources li, .run-inventory li, .artifact-list li, .run-page dd'), { size: 16, line: 24, weight: 400, family: 'Instrument Sans', color: ink }, 'dense content');
        checkRole(elements('[data-slot="item-description"]'), { size: 16, line: 24, weight: 400, family: 'Instrument Sans', color: slate }, 'guide description');
        const metadata = elements('.section-label, .home-guide-list span, .footer-meta, .sidebar-label, .page-meta, figcaption, .history-year, .run-header > p:first-child, .run-page dt, .run-evidence, .run-inventory span, .source-kinds, th');
        checkRole(metadata, { size: 12, line: 18, weight: 400, family: 'IBM Plex Mono', color: slate }, 'metadata');
        checkRole(elements('.site-name, .provider-tabs a, .search-trigger, .right-sidebar a, .right-sidebar h2, .site-footer a'), { size: 14, line: 20, family: 'Instrument Sans' }, 'navigation');
        checkRole(elements('.handbook-sidebar a'), { size: 13, line: 18, family: 'Instrument Sans' }, 'guide navigation');
        return findings;
      }, { route, viewportWidth: viewport.width });
      for (const finding of typographyFailures) failures.push(`${viewport.name} ${route}: ${finding}`);

      if (viewport.width === 375 && route === '/') {
        const menu = page.locator('.mobile-site-menu-trigger');
        const sheet = page.locator('.mobile-site-menu[role="dialog"]');
        await menu.focus();
        await page.keyboard.press('Enter');
        await sheet.waitFor({ state: 'visible' });
        if (await sheet.getAttribute('data-state') !== 'open') failures.push(`${viewport.name} ${route}: mobile Sheet does not open with Enter`);
        await page.keyboard.press('Escape');
        await sheet.waitFor({ state: 'hidden' });
        if (!(await menu.evaluate((trigger) => document.activeElement === trigger))) failures.push(`${viewport.name} ${route}: mobile Sheet does not restore focus after Escape`);
      }

      const report = await new AxeBuilder({ page }).analyze();
      for (const violation of report.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')) failures.push(`${viewport.name} ${route}: ${violation.impact} ${violation.id}`);

      const checkClipping = async (label) => {
        if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) failures.push(`${viewport.name} ${route}: ${label} causes horizontal overflow`);
        const clipped = await page.evaluate(() => {
          const directText = (element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          return [...document.querySelectorAll('body *')]
            .filter((element) => directText(element) && element.getClientRects().length > 0)
            .filter((element) => {
              const style = getComputedStyle(element);
              const clippedInline = element.scrollWidth > element.clientWidth + 1 && ['clip', 'hidden'].includes(style.overflowX);
              const clippedBlock = element.scrollHeight > element.clientHeight + 1 && ['clip', 'hidden'].includes(style.overflowY);
              return clippedInline || clippedBlock;
            })
            .map((element) => element.textContent.trim().slice(0, 60));
        });
        for (const text of clipped) failures.push(`${viewport.name} ${route}: ${label} clips text: ${text}`);
      };

      if (viewport.width === 375) {
        const spacing = await page.addStyleTag({ content: `
          :where(p, li, dd, td, figcaption) {
            line-height: 1.5 !important;
            letter-spacing: .12em !important;
            word-spacing: .16em !important;
          }
          p { margin-bottom: 2em !important; }
        ` });
        await checkClipping('text spacing override');
        await spacing.evaluate((element) => element.remove());
      }

      if (viewport.width === 720) await checkClipping('200% browser zoom equivalent');
    }
    await context.close();
  }
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGTERM');
  await serverExit;
}

if (failures.length > 0) { console.error(failures.join('\n')); process.exit(1); }
console.log(`typography, reflow, text spacing, text resize, and axe checks passed across ${routes.length} routes at ${viewports.length} required widths`);
