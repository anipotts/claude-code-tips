import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import os from 'node:os';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origin = 'http://127.0.0.1:4177';
const output = process.env.ASCII_QA_DIR || path.join(os.tmpdir(), 'ascii-homepage-qa');
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4177', '--strictPort'], { stdio: 'inherit' });
const exit = once(server, 'exit');
let browser;
const results = [], errors = [];
try {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(origin)).ok) break; } catch {} if (i === 49) throw Error('preview unavailable'); await new Promise(r => setTimeout(r, 200)); }
  browser = await chromium.launch();
  for (const width of [320, 375, 768, 942, 959, 960, 1024, 1191, 1440]) for (const theme of ['light', 'dark']) for (const reduced of [false, true]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin);
    const host = page.locator('.ascii-background');
    await page.waitForFunction(() => ['running', 'reduced'].includes(document.querySelector('.ascii-background')?.dataset.motion));
    assert.equal(await host.getAttribute('data-motion'), reduced ? 'reduced' : 'running');
    assert.equal(await page.title(), 'coding agent tips');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}`);
    const contrast = await page.evaluate(() => {
      const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
      const lum = a => a.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s,v,i) => s + v * [.2126,.7152,.0722][i],0);
      const results = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode, el = n.parentElement;
        if (!n.textContent.trim() || el.closest('script,style,[aria-hidden="true"]') || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
        let bg = el, color;
        while (bg && bg !== document.body) { color = rgb(getComputedStyle(bg).backgroundColor); if (color.length === 3 || color[3] === 1) break; bg = bg.parentElement; }
        // A body background alone is insufficient: the animated canvas is above it.
        if (!bg || bg === document.body) throw Error(`Unprotected text: ${n.textContent.slice(0,80)}`);
        const style = getComputedStyle(el), f = lum(rgb(style.color)), b = lum(color);
        const ratio = (Math.max(f,b) + .05) / (Math.min(f,b) + .05);
        const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseFloat(style.fontWeight) >= 700);
        if (ratio < (large ? 3 : 4.5)) throw Error(`Contrast ${ratio}: ${n.textContent.slice(0,80)}`);
        results.push(ratio);
      }
      return { minimum: Math.min(...results), textNodes: results.length };
    });
    const canvas = page.locator('.ascii-canvas');
    if (reduced) {
      const before = await canvas.screenshot(); await page.waitForTimeout(200);
      assert.deepEqual(await canvas.screenshot(), before, 'reduced motion pixels changed');
      assert.equal(await page.locator('.ascii-motion-control').isVisible(), false);
    }
    if ([375,1440].includes(width)) {
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      assert.deepEqual(axe.violations, [], `axe ${width} ${theme} ${reduced}`);
      await page.screenshot({ path: path.join(output, `${width}-${theme}-${reduced ? 'reduced' : 'moving'}.png`), fullPage: true });
      if (!reduced) {
        await page.getByRole('button', { name: 'pause animation', exact: true }).click();
        await page.waitForTimeout(100);
        const paused = await canvas.screenshot(); await page.waitForTimeout(200);
        assert.deepEqual(await canvas.screenshot(), paused, 'paused pixels changed');
        await page.getByRole('button', { name: 'resume animation', exact: true }).press('Enter');
        await page.waitForTimeout(300);
        assert.notDeepEqual(await canvas.screenshot(), paused, 'resume did not move');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(100);
        const frozen = await canvas.screenshot(); await page.waitForTimeout(200);
        assert.deepEqual(await canvas.screenshot(), frozen, 'live reduction did not freeze');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.locator('.provider-tabs a[href="/guides/codex/"]').click();
        await page.waitForURL('**/guides/codex/');
        assert.equal(await canvas.count(), 0);
        await page.goBack(); await page.waitForURL(origin + '/');
        await page.waitForFunction(() => document.querySelector('.ascii-background')?.dataset.motion === 'running');
        assert.equal(await canvas.count(), 1, 'duplicate canvas after navigation');
      }
    }
    results.push({ width, theme, reduced, ...contrast });
    await context.close();
  }
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const page = await nojs.newPage(); await page.goto(origin);
  assert.ok(await page.locator('h1').isVisible());
  assert.equal(await page.locator('.ascii-motion-control').isVisible(), false);
  await nojs.close();
  const fallback = await browser.newContext();
  await fallback.addInitScript(() => { HTMLCanvasElement.prototype.transferControlToOffscreen = undefined; });
  const fp = await fallback.newPage(); await fp.goto(origin);
  await fp.waitForFunction(() => document.querySelector('.ascii-background')?.dataset.motion === 'static');
  const f1 = await fp.locator('canvas').screenshot(); await fp.waitForTimeout(200);
  assert.deepEqual(await fp.locator('canvas').screenshot(), f1);
  await fallback.close();
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'matrix.json'), JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} viewport/theme/motion combinations, contrast, pause, live preference, navigation, no-script, and fallback checks. Artifacts: ${output}`);
} finally { await browser?.close(); server.kill('SIGTERM'); await exit; }
