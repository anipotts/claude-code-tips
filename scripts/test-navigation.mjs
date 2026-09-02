import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const previewPort = 4175;
const origin = `http://127.0.0.1:${previewPort}`;
const astro = path.join(process.cwd(), 'node_modules/astro/bin/astro.mjs');
const vite = path.join(process.cwd(), 'node_modules/vite/bin/vite.js');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const build = spawnSync(process.execPath, [astro, 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'], { stdio: 'inherit' });
const serverExit = once(server, 'exit');
let browser;

try {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    if (attempt === 39) throw new Error('astro preview did not become ready');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.addInitScript(() => { window.__navigationDocumentToken = crypto.randomUUID(); });

  await page.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  const documentToken = await page.evaluate(() => window.__navigationDocumentToken);
  expect(await page.title() === 'codex | coding agent tips', 'guide title is incorrect');
  expect(await page.locator('meta[name="astro-view-transitions-enabled"]').count() === 1, 'ClientRouter marker is missing');
  expect(await page.locator('.provider-tabs a[data-astro-prefetch="hover"]').count() === 4, 'provider tabs are missing selective hover prefetching');
  expect(await page.locator('.publication-sidebar [data-sidebar="menu-button"][data-astro-prefetch="hover"]').count() === 3, 'desktop chapters are missing selective hover prefetching');
  expect(await page.locator('.mobile-site-menu nav > a[data-astro-prefetch="tap"]').count() === 3, 'mobile chapters are missing selective tap prefetching');
  expect(await page.locator('.sidebar-page-outline a[data-astro-prefetch]').count() === 0, 'hash links must not be prefetched');

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sidebar: getComputedStyle(document.querySelector('.sidebar-pane')).display,
      mobileTrigger: getComputedStyle(document.querySelector('.mobile-site-menu-trigger')).display,
      progress: getComputedStyle(document.querySelector('.reading-progress-rail')).display,
      dualBar: document.querySelectorAll('.mobile-toc, .guide-context-bar').length,
      headerHeight: document.querySelector('.site-header').getBoundingClientRect().height,
      tabsHeight: Math.max(...[...document.querySelectorAll('.provider-tabs a')].map((link) => link.getBoundingClientRect().height)),
      searchHeight: document.querySelector('.header-search site-search > button').getBoundingClientRect().height,
      headerControlHeights: [...document.querySelectorAll('.site-header-control')]
        .map((control) => control.getBoundingClientRect())
        .filter((bounds) => bounds.width > 0)
        .map((bounds) => bounds.height),
      pageActionHeights: [...document.querySelectorAll('.page-actions button')].map((control) => control.getBoundingClientRect().height),
      headerGroupsOverlap: (() => {
        const groups = [...document.querySelectorAll('.site-name, .provider-tabs, .header-actions')]
          .map((element) => element.getBoundingClientRect());
        return groups.some((first, index) => groups.slice(index + 1).some((second) =>
          first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
        ));
      })(),
    }));
    expect(layout.overflow === 0, `${viewport.width}px layout has horizontal overflow: ${layout.overflow}`);
    expect(layout.dualBar === 0, `${viewport.width}px layout renders the retired intermediate navigation bar`);
    expect(layout.tabsHeight <= 32, `${viewport.width}px provider tabs exceed the compact 32px rhythm`);
    expect(layout.searchHeight === 32, `${viewport.width}px search trigger does not use the compact 32px height`);
    expect(layout.headerControlHeights.every((height) => height === 32), `${viewport.width}px header actions do not share the compact 32px height`);
    expect(layout.pageActionHeights.every((height) => height === 32), `${viewport.width}px page actions do not share the compact 32px height`);
    expect(!layout.headerGroupsOverlap, `${viewport.width}px header groups overlap`);
    expect(Math.abs(layout.headerHeight - (viewport.width < 960 ? 92 : 64)) <= 1, `${viewport.width}px header height does not match its responsive row layout`);
    if (viewport.width < 768) {
      expect(layout.sidebar === 'none', 'mobile layout renders the desktop sidebar');
      expect(layout.mobileTrigger !== 'none', 'mobile layout hides the Sheet trigger');
    } else {
      expect(layout.sidebar !== 'none', `${viewport.width}px layout hides the persistent sidebar`);
      expect(layout.mobileTrigger === 'none', `${viewport.width}px layout renders the mobile Sheet trigger`);
    }
    expect((viewport.width >= 1024) === (layout.progress !== 'none'), `${viewport.width}px reading progress visibility is incorrect`);

    const theme = await page.locator('html').getAttribute('data-theme');
    await page.locator('[data-slot="theme-toggle"]').click();
    const toggled = await page.locator('html').getAttribute('data-theme');
    expect(toggled !== theme, `${viewport.width}px theme toggle did not change theme`);
    expect(await page.locator('html').evaluate((root) => root.classList.contains('dark') === (root.dataset.theme === 'dark')), `${viewport.width}px Starwind and Starlight theme state diverged`);
    await page.locator('[data-slot="theme-toggle"]').click();
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  const sheetTrigger = page.locator('.mobile-site-menu-trigger');
  await sheetTrigger.click();
  const sheet = page.locator('.mobile-site-menu[role="dialog"]');
  await sheet.waitFor({ state: 'visible' });
  expect((await sheet.locator('nav a').allTextContents()).map((text) => text.trim()).join('|') === 'overview|configuration|recommendations', 'mobile Sheet chapter order is incorrect');
  expect(await page.evaluate(() => document.querySelector('.mobile-site-menu')?.contains(document.activeElement)), 'mobile Sheet does not move focus inside');
  await page.keyboard.press('Escape');
  await sheet.waitFor({ state: 'hidden' });
  expect(await sheetTrigger.evaluate((trigger) => document.activeElement === trigger), 'mobile Sheet does not restore trigger focus');
  await sheetTrigger.click();
  await sheet.locator('a[href="/guides/codex/configuration/"]').click();
  await page.waitForURL('**/guides/codex/configuration/');
  await sheet.waitFor({ state: 'hidden' });
  await page.goBack();
  await page.waitForURL('**/guides/codex/');
  await page.waitForFunction(() => document.querySelector('[data-copy-page]'));

  await page.locator('.header-search [data-open-modal]').click();
  const search = page.locator('.header-search site-search dialog');
  await search.waitFor({ state: 'visible' });
  await page.waitForTimeout(180);
  const searchBox = await search.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const trigger = document.querySelector('.header-search [data-open-modal]').getBoundingClientRect();
    const backdrop = getComputedStyle(element, '::backdrop');
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      innerWidth,
      innerHeight,
      triggerTop: trigger.top,
      triggerLeft: trigger.left,
      triggerRight: trigger.right,
      triggerWidth: trigger.width,
      backdropColor: backdrop.backgroundColor,
      backdropFilter: backdrop.backdropFilter,
    };
  });
  expect(Math.abs(searchBox.y - searchBox.triggerTop) <= 2 && searchBox.x <= searchBox.triggerLeft && searchBox.x + searchBox.width >= searchBox.triggerRight, 'mobile search does not expand through the header trigger');
  expect(searchBox.width > searchBox.triggerWidth * 4, 'mobile search does not expand into an input surface');
  expect(searchBox.x >= 15 && searchBox.width <= searchBox.innerWidth - 30 && searchBox.height < searchBox.innerHeight * .75, 'mobile search is not a compact inset popover');
  expect(searchBox.backdropColor === 'rgba(0, 0, 0, 0)' && searchBox.backdropFilter === 'none', 'mobile search still obscures or blurs the page');
  await search.locator('input[type="text"], input[type="search"]').first().fill('codex');
  await search.locator('.pagefind-ui__result').first().waitFor({ state: 'visible', timeout: 5000 });
  await page.keyboard.press('Escape');
  await search.waitFor({ state: 'hidden' });

  const sources = page.locator('.page-sources');
  const sourceTrigger = sources.locator('[data-sw-accordion-trigger]');
  expect(await sources.getAttribute('data-state') === 'closed', 'sources accordion is open by default');
  await sourceTrigger.click();
  expect(await sources.getAttribute('data-state') === 'open', 'sources accordion did not open');
  expect(await sources.locator('.source-publisher').count() > 0, 'sources accordion has no publisher groups');
  await sourceTrigger.click();
  expect(await sources.getAttribute('data-state') === 'closed', 'sources accordion did not close');

  await page.locator('[aria-label="more page actions"]').click();
  const menu = page.locator('[role="menu"]:visible');
  await menu.waitFor({ state: 'visible' });
  expect((await menu.locator('[role="menuitem"]').allTextContents()).map((text) => text.trim()).join('|') === 'view Markdown|copy page link|edit on GitHub', 'page action menu contents are incorrect');
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'hidden' });
  await page.locator('[data-copy-page]').click();
  await page.waitForFunction(() => navigator.clipboard.readText().then((text) => text.startsWith('# codex')));

  const figure = page.locator('.surface-bento figure').first();
  expect(await figure.locator('figcaption').evaluate((caption) => getComputedStyle(caption).display) === 'none', 'dialog-enabled image caption is visible in the reading flow');
  const imageTrigger = figure.locator('[data-publication-image-trigger]');
  await imageTrigger.click();
  const imageDialog = page.locator('#publication-image-dialog[role="dialog"]');
  await imageDialog.waitFor({ state: 'visible' });
  expect((await imageDialog.locator('[data-publication-dialog-caption]').textContent())?.trim() === 'a screenshot of me working on some personal projects and some content for a brand deal.', 'enlarged image is missing its caption');
  await page.keyboard.press('Escape');
  await imageDialog.waitFor({ state: 'hidden' });
  expect(await imageTrigger.evaluate((trigger) => document.activeElement === trigger), 'image dialog does not restore trigger focus');

  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  const sourcePreview = page.locator('.sl-markdown-content .registered-link-hover-card').first();
  await sourcePreview.locator('[data-sw-preview-card-trigger]').hover();
  await page.waitForFunction(() => document.querySelector('.sl-markdown-content .registered-link-hover-card')?.getAttribute('data-state') === 'open');
  await page.locator('.registered-link-card[data-state="open"]').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('.sl-markdown-content .registered-link-hover-card')?.getAttribute('data-state') === 'closed');

  const sidebar = page.locator('.publication-sidebar-provider');
  const sidebarTrigger = sidebar.locator('[data-sw-sidebar-trigger]').first();
  const chromeStyles = await page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      const styles = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return {
        borderStyle: styles.borderStyle,
        height: bounds.height,
        width: bounds.width,
      };
    };
    const siteMark = document.querySelector('.site-name img').getBoundingClientRect();
    const railMark = document.querySelector('.sidebar-provider-icon').getBoundingClientRect();
    return {
      controls: [
        box('[data-slot="theme-toggle"]'),
        box('.github-link'),
        box('[data-sw-sidebar-trigger]'),
      ],
      listMarkers: [...document.querySelectorAll('.publication-sidebar li')]
        .filter((item) => getComputedStyle(item).listStyleType !== 'none').length,
      outlineRule: getComputedStyle(document.querySelector('.sidebar-page-outline')).borderInlineStartWidth,
      railHeaderHeight: document.querySelector('.handbook-rail-head').getBoundingClientRect().height,
      siteHeaderHeight: document.querySelector('.site-header').getBoundingClientRect().height,
      leftAlignmentDelta: Math.abs(siteMark.left - railMark.left),
    };
  });
  expect(chromeStyles.controls.every((control) => control.width === 32 && control.height === 32), 'header and sidebar controls do not share a compact 32px footprint');
  expect(chromeStyles.controls.every((control) => control.borderStyle !== 'outset'), 'native browser borders leak into Starwind controls');
  expect(chromeStyles.listMarkers === 0, 'browser list markers leak into the guide sidebar');
  expect(chromeStyles.outlineRule === '0px', 'the retired heading connector rule remains visible');
  expect(chromeStyles.railHeaderHeight === chromeStyles.siteHeaderHeight, 'sidebar and site headers use different vertical rhythms');
  expect(chromeStyles.leftAlignmentDelta < 1, 'sidebar identity does not align with the site header gutter');

  await page.locator('[data-slot="theme-toggle"]').click();
  const darkChrome = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--surface-subtle)';
    document.body.append(probe);
    const surfaceSubtle = getComputedStyle(probe).color;
    probe.remove();
    return {
      kbdBackground: getComputedStyle(document.querySelector('.header-search kbd')).backgroundColor,
      surfaceSubtle,
      sidebarBackground: getComputedStyle(document.querySelector('.publication-sidebar [data-slot="sidebar-inner"]')).backgroundColor,
      canvasBackground: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(darkChrome.kbdBackground === darkChrome.surfaceSubtle, 'dark search shortcut does not use the dark subtle surface');
  expect(darkChrome.sidebarBackground === darkChrome.canvasBackground, 'dark sidebar uses a mismatched surface color');
  await page.locator('[data-slot="theme-toggle"]').click();

  expect(await sidebar.getAttribute('data-state') === 'expanded', 'desktop sidebar is not expanded initially');
  await sidebarTrigger.click();
  expect(await sidebar.getAttribute('data-state') === 'collapsed', 'desktop sidebar did not collapse');
  await page.waitForFunction(() => Math.abs(document.querySelector('.publication-sidebar')?.getBoundingClientRect().width - 56) < 1);
  const collapsedAlignment = await page.evaluate(() => {
    const visible = (selector) => [...document.querySelectorAll(selector)].find((element) => element.getClientRects().length > 0);
    const rail = visible('.publication-sidebar').getBoundingClientRect();
    const trigger = visible('[data-sw-sidebar-trigger]').getBoundingClientRect();
    const chapterButtons = [...document.querySelectorAll('[data-sidebar="menu-button"]')]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => element.getBoundingClientRect());
    const center = (bounds) => bounds.left + bounds.width / 2;
    return {
      triggerDelta: Math.abs(center(trigger) - center(rail)),
      chapterDeltas: chapterButtons.map((button) => Math.abs(center(button) - center(rail))),
      horizontalInset: (rail.width - trigger.width) / 2,
      verticalInset: (visible('.handbook-rail-head').getBoundingClientRect().height - trigger.height) / 2,
    };
  });
  expect(collapsedAlignment.triggerDelta < 1, 'collapsed sidebar trigger is not centered in the rail');
  expect(collapsedAlignment.chapterDeltas.every((delta) => delta < 1), 'collapsed chapter buttons are not centered in the rail');
  expect(Math.abs(collapsedAlignment.horizontalInset - collapsedAlignment.verticalInset) < 1, 'collapsed sidebar trigger does not have equal vertical and horizontal spacing');
  expect(await page.locator('[aria-label="codex handbook chapters"] .sidebar-page-outline').evaluate((outline) => getComputedStyle(outline).display) === 'none', 'heading outline remains visible in icon-collapse mode');
  expect(await page.locator('.right-sidebar-container').evaluate((rail) => rail.getBoundingClientRect().width) === 0, 'retired right sidebar retains width');
  await sidebarTrigger.click();
  expect(await sidebar.getAttribute('data-state') === 'expanded', 'desktop sidebar did not expand');

  const desktopDocumentToken = await page.evaluate(() => window.__navigationDocumentToken);
  await page.locator('[aria-label="codex handbook chapters"] a[href="/guides/codex/configuration/"]').click();
  await page.waitForURL('**/guides/codex/configuration/');
  expect(desktopDocumentToken === await page.evaluate(() => window.__navigationDocumentToken), 'chapter navigation caused a full reload');
  expect(await page.locator('html').evaluate((root) => root.classList.contains('dark') === (root.dataset.theme === 'dark')), 'Starwind and Starlight theme state diverged after chapter navigation');
  expect((await page.locator('[aria-label="codex handbook chapters"] [aria-current="page"]').textContent())?.trim() === 'configuration', 'sidebar active chapter did not update');
  await page.goBack();
  await page.waitForURL('**/guides/codex/');
  await page.waitForFunction(() => document.querySelector('[aria-label="codex handbook chapters"] [aria-current="page"]')?.getAttribute('href') === '/guides/codex/');
  const hash = await page.locator('[aria-label="codex handbook chapters"] .sidebar-page-outline a[href^="#"]').first().getAttribute('href');
  expect(Boolean(hash), 'page outline has no heading links');
  if (hash) {
    await page.locator(`[aria-label="codex handbook chapters"] .sidebar-page-outline a[href="${hash}"]`).evaluate((link) => link.click());
    await page.waitForURL(`**/guides/codex/${hash}`);
    expect(await page.locator(hash).count() === 1, 'hash target is missing');
  }
  await page.evaluate(() => scrollTo(0, Math.max(1, (document.documentElement.scrollHeight - innerHeight) * .5)));
  await page.waitForTimeout(100);
  expect(Number(await page.locator('.reading-progress').getAttribute('aria-valuenow')) > 0, 'reading progress did not react to scrolling');

  await page.goto(`${origin}/guides/grok/configuration/`, { waitUntil: 'networkidle' });
  const tableArea = page.locator('.publication-scroll-area').first();
  expect(await tableArea.locator('table[tabindex="0"][aria-label="scrollable comparison table"]').count() === 1, 'wide table is not wrapped in a build-time Starwind ScrollArea');

  await page.goto(`${origin}/archive/claude-code-tools/`, { waitUntil: 'networkidle' });
  const codeCopy = page.locator('[data-code-copy]').first();
  await codeCopy.click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).includes('claude-code'), 'code copy did not write code to the clipboard');

  const reducedContext = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  expect(await reducedPage.locator('.provider-tabs a').first().evaluate((link) => Number.parseFloat(getComputedStyle(link).transitionDuration) <= .001), 'reduced motion does not suppress interface transitions');
  await reducedContext.close();

  expect(consoleErrors.length === 0, `browser console errors: ${consoleErrors.join(' | ')}`);
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGTERM');
  await serverExit;
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Starwind navigation, controls, publication primitives, routing, progress, and reduced-motion checks passed');
