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
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
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
  await page.evaluate(() => {
    window.__providerTabTransitionDurations = [];
    document.addEventListener('astro:after-swap', () => requestAnimationFrame(() => {
      window.__providerTabTransitionDurations = document.getAnimations().map((animation) => animation.effect?.getTiming().duration).filter(Number.isFinite);
    }), { once: true });
  });

  await page.locator('.provider-tabs a[href="/guides/codex/"]').click();
  await page.waitForURL('**/guides/codex/');
  await page.waitForSelector('.astro-route-announcer');
  await page.waitForTimeout(220);
  expect(documentToken === await page.evaluate(() => window.__navigationDocumentToken), 'homepage to document navigation caused a full reload');
  expect(await page.title() === 'codex | coding agent tips', 'document title did not update after navigation');
  expect((await page.locator('.astro-route-announcer').textContent())?.trim() === 'codex | coding agent tips', 'route announcement did not report the destination title');
  expect((await page.locator('.provider-tabs [aria-current="page"]').textContent())?.trim() === 'codex', 'provider navigation did not update its active state');
  expect(await page.locator('.provider-tabs [aria-current="page"]').evaluate((link) => getComputedStyle(link).viewTransitionName) === 'provider-tab-active', 'active provider tab is missing its shared cobalt pill transition');
  const providerTransitionDurations = await page.evaluate(() => window.__providerTabTransitionDurations);
  expect(providerTransitionDurations.some((duration) => duration > 0 && duration <= 160), `provider tab transition is missing or too slow: ${providerTransitionDurations.join(', ')}`);
  expect(await page.locator('.site-header').getAttribute('data-stale-navigation-test') === null, 'the router retained stale header DOM');
  expect(await page.evaluate(() => document.activeElement === document.body), 'focus did not return to the document body after the route swap');
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length) === 0, 'decorative route motion remains active');
  const mobileHeaderGeometry = await page.evaluate(() => {
    const header = document.querySelector('.site-header').getBoundingClientRect();
    const tabs = document.querySelector('.provider-tabs').getBoundingClientRect();
    const tabLinks = [...document.querySelectorAll('.provider-tabs a')].map((link) => link.getBoundingClientRect());
    const controls = ['.search-trigger', '.theme-control', '.mobile-site-menu summary'].map((selector) => document.querySelector(selector).getBoundingClientRect());
    return {
      headerHeight: header.height,
      tabsX: tabs.x,
      tabsWidth: tabs.width,
      tabCenterDelta: ((tabLinks[0].left + tabLinks.at(-1).right) / 2) - (header.x + header.width / 2),
      controlSizes: controls.map(({ width, height }) => ({ width, height })),
      actionRailHeight: document.querySelector('.header-actions').getBoundingClientRect().height,
    };
  });
  expect(mobileHeaderGeometry.headerHeight >= 106 && mobileHeaderGeometry.headerHeight <= 108, `mobile header does not retain its readable two-row height: ${mobileHeaderGeometry.headerHeight}`);
  expect(mobileHeaderGeometry.tabsX === 0 && mobileHeaderGeometry.tabsWidth === 375, 'mobile provider tabs do not occupy their full second row');
  expect(Math.abs(mobileHeaderGeometry.tabCenterDelta) <= .5, `mobile provider tabs are not centered as a group: ${mobileHeaderGeometry.tabCenterDelta}`);
  expect(mobileHeaderGeometry.controlSizes.every(({ width, height }) => width === 36 && height === 36), `mobile header controls do not share one 36px geometry: ${JSON.stringify(mobileHeaderGeometry.controlSizes)}`);
  expect(mobileHeaderGeometry.actionRailHeight === 44, `mobile header utility rail is not a compact 44px group: ${mobileHeaderGeometry.actionRailHeight}`);
  const initialTheme = await page.locator('html').getAttribute('data-theme');
  const themeButton = page.locator('.theme-control');
  await themeButton.click();
  const toggledTheme = await page.locator('html').getAttribute('data-theme');
  expect(toggledTheme !== initialTheme, `one-click theme control did not change theme: ${initialTheme}`);
  expect((await themeButton.getAttribute('aria-label')) === `switch to ${initialTheme} mode`, 'theme control does not describe its next action');
  expect(await page.locator('.theme-menu').count() === 0, 'legacy two-click theme menu is still rendered');
  await themeButton.click();
  expect(await page.locator('html').getAttribute('data-theme') === initialTheme, 'second theme click did not restore the original theme');
  const sources = page.locator('.page-sources');
  expect(await sources.getAttribute('open') === null, 'sources disclosure is not collapsed by default');
  expect(await sources.getAttribute('data-disclosure-motion') === 'ready', 'sources disclosure motion is not initialized');
  expect(await sources.locator('.source-summary-publishers img').count() > 0, 'sources summary is missing publisher icons');
  expect(await sources.locator('.source-summary-badge .source-summary-count').count() === 1, 'source count is not attached to the publisher icon stack');
  await sources.locator('summary').click();
  expect(await sources.getAttribute('open') !== null, 'sources disclosure did not open');
  expect(!(await sources.textContent())?.includes('TESTED / OFFICIAL SOURCE / ANALYSIS'), 'legacy source evidence microcopy is still public');
  expect(await sources.locator('.source-publisher').count() > 0, 'expanded sources are not grouped by publisher');
  const mobileSourceLayout = await sources.evaluate((details) => {
    const groups = details.querySelector('.source-groups');
    const item = details.querySelector('li');
    const frame = details.querySelector('.publisher-icon-frame');
    return {
      columns: groups ? getComputedStyle(groups).gridTemplateColumns.split(' ').length : 0,
      itemBorder: item ? getComputedStyle(item).borderBottomWidth : '',
      itemUnderline: item ? getComputedStyle(item.querySelector('a')).textDecorationLine : '',
      frameRadius: frame ? getComputedStyle(frame).borderRadius : '',
    };
  });
  expect(mobileSourceLayout.columns === 1, `mobile sources do not collapse to one column: ${mobileSourceLayout.columns}`);
  expect(mobileSourceLayout.itemBorder === '0px', `source rows retain separator lines: ${mobileSourceLayout.itemBorder}`);
  expect(mobileSourceLayout.itemUnderline === 'none', `source links retain default underlines: ${mobileSourceLayout.itemUnderline}`);
  expect(mobileSourceLayout.frameRadius !== '50%', 'publisher icon frame is circular');
  await sources.locator('summary').click();
  await page.waitForFunction(() => !document.querySelector('.page-sources')?.hasAttribute('open'));

  const actionMenu = page.locator('[data-page-action-menu]');
  const pageActionGeometry = await page.locator('.page-actions').evaluate((actions) => {
    const copy = actions.querySelector('[data-copy-page]').getBoundingClientRect();
    const summary = actions.querySelector('summary').getBoundingClientRect();
    return {
      segmentGap: summary.left - copy.right,
      borderWidth: getComputedStyle(actions).borderTopWidth,
      menuDivider: getComputedStyle(actions.querySelector('[data-page-action-menu]')).borderLeftWidth,
    };
  });
  expect(Math.abs(pageActionGeometry.segmentGap) <= 1 && pageActionGeometry.borderWidth === '1px' && pageActionGeometry.menuDivider === '1px', `page actions are not one divided control: ${JSON.stringify(pageActionGeometry)}`);
  await actionMenu.locator('summary').click();
  expect(await actionMenu.getAttribute('open') !== null, 'secondary page action menu did not open');
  const mobileActionPanel = await actionMenu.locator('.page-action-menu-panel').evaluate((panel) => {
    const box = panel.getBoundingClientRect();
    return { left: box.left, right: box.right };
  });
  expect(mobileActionPanel.left >= 10 && mobileActionPanel.right <= 365, `mobile page action menu escapes the viewport: ${JSON.stringify(mobileActionPanel)}`);
  expect(await actionMenu.locator('a, button').allTextContents().then((items) => items.map((item) => item.trim()).join('|')) === 'view Markdown|copy page link|edit on GitHub', 'secondary page actions are missing or out of order');
  const markdownAction = actionMenu.locator('a').filter({ hasText: 'view Markdown' });
  expect(await markdownAction.getAttribute('target') === '_blank' && (await markdownAction.getAttribute('rel'))?.includes('noopener'), 'view Markdown does not open safely in a new tab');
  await actionMenu.locator('[data-copy-page-link]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText()) === `${origin}/guides/codex/`, 'copy page link did not copy the canonical URL');
  expect(await actionMenu.getAttribute('open') === null, 'secondary page action menu stayed open after copying the link');
  await page.locator('[data-copy-page]').click();
  await page.waitForFunction(() => document.querySelector('[data-copy-page-status]')?.textContent?.trim() === 'copied as Markdown');
  expect((await page.locator('[data-copy-page-status]').textContent())?.trim() === 'copied as Markdown', 'copy page did not announce the Markdown result');
  expect((await page.evaluate(() => navigator.clipboard.readText())).startsWith('# codex'), 'copy page did not place page Markdown on the clipboard');

  expect(await page.locator('.sl-markdown-content .registered-link').count() > 0, 'registered article links are missing');
  expect(await page.locator('.sl-markdown-content .link-favicon').count() === 0, 'mobile article links still include inline publisher icons');

  await page.locator('.mobile-site-menu summary').click();
  expect(await page.locator('.mobile-site-menu').getAttribute('open') !== null, 'mobile menu did not open');
  expect(await page.locator('.mobile-site-menu').getAttribute('data-disclosure-motion') === 'ready', 'mobile menu disclosure motion is not initialized');
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
  await page.waitForTimeout(500);
  const desktopHeaderGeometry = await page.evaluate(() => {
    const header = document.querySelector('.site-header').getBoundingClientRect();
    const tabs = document.querySelector('.provider-tabs').getBoundingClientRect();
    return { headerHeight: header.height, centerDelta: (tabs.x + tabs.width / 2) - (header.x + header.width / 2) };
  });
  expect(desktopHeaderGeometry.headerHeight === 64, `desktop header is not a single 64px row: ${desktopHeaderGeometry.headerHeight}`);
  expect(Math.abs(desktopHeaderGeometry.centerDelta) <= .5, `desktop provider tabs are not centered in the viewport: ${desktopHeaderGeometry.centerDelta}`);
  const searchControl = await page.locator('.search-trigger').evaluate((button) => {
    const box = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    const icon = button.querySelector('svg')?.getBoundingClientRect();
    return {
      height: box.height,
      width: box.width,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      iconSize: icon?.width ?? 0,
    };
  });
  expect(searchControl.height === 36 && searchControl.width >= 124, `desktop search control is not aligned to the header control geometry: ${JSON.stringify(searchControl)}`);
  expect(searchControl.fontFamily.includes('Instrument Sans') && searchControl.fontSize === '14px', `desktop search control does not use header typography: ${JSON.stringify(searchControl)}`);
  expect(searchControl.iconSize === 16, `desktop search icon is not aligned to the header icon scale: ${searchControl.iconSize}`);
  await page.waitForFunction(() => [...document.querySelectorAll('.reading-rail li')].every((item) => item.style.getPropertyValue('--heading-offset')));
  const overviewMarkerOffsets = await page.locator('.reading-rail li').evaluateAll((items) => items.map((item) => Number.parseFloat(item.style.getPropertyValue('--heading-offset'))));
  const overviewFirstMarker = overviewMarkerOffsets[0];
  expect(Math.abs(overviewFirstMarker - 32) <= .5, `overview first reading marker is not normalized: ${overviewFirstMarker}`);
  expect(overviewMarkerOffsets.every((offset, index) => index === 0 || offset - overviewMarkerOffsets[index - 1] >= 37.5), 'overview reading marker labels do not preserve collision spacing');
  const compactReadingPanel = await page.locator('.right-rail-panel').evaluate((panel) => ({ bottom: panel.getBoundingClientRect().bottom, viewport: innerHeight }));
  expect(compactReadingPanel.bottom < compactReadingPanel.viewport - 80, `reading path still stretches to the full viewport: ${compactReadingPanel.bottom} of ${compactReadingPanel.viewport}`);
  const leftRowHeight = await page.locator('.handbook-sidebar a[aria-current="page"]').evaluate((link) => getComputedStyle(link).minHeight);
  const rightRowHeight = await page.locator('.reading-rail a').first().evaluate((link) => getComputedStyle(link).minHeight);
  expect(leftRowHeight === rightRowHeight, `left and right rail rows use different sizing: ${leftRowHeight} versus ${rightRowHeight}`);
  expect(await page.locator('.handbook-sidebar a[aria-current="page"] .sidebar-active-marker').evaluate((marker) => getComputedStyle(marker).viewTransitionName) === 'handbook-chapter-active', 'left chapter marker is missing its shared transition');
  const darkAccent = await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    const style = getComputedStyle(document.documentElement);
    const active = document.querySelector('.provider-tabs [aria-current="page"]');
    return {
      primary: style.getPropertyValue('--accent-primary').trim(),
      soft: style.getPropertyValue('--accent-soft').trim(),
      strong: style.getPropertyValue('--accent-strong').trim(),
      onSolid: style.getPropertyValue('--accent-on-solid').trim(),
      activeColor: active ? getComputedStyle(active).color : '',
    };
  });
  expect(JSON.stringify(darkAccent) === JSON.stringify({ primary: '#5279f2', soft: '#18254f', strong: '#c1ccff', onSolid: '#0b0c0f', activeColor: 'rgb(11, 12, 15)' }), `dark cobalt tokens or solid text are incorrect: ${JSON.stringify(darkAccent)}`);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.evaluate(() => {
    window.__chapterTransitionDurations = [];
    document.addEventListener('astro:after-swap', () => requestAnimationFrame(() => {
      window.__chapterTransitionDurations = document.getAnimations().map((animation) => animation.effect?.getTiming().duration).filter(Number.isFinite);
    }), { once: true });
  });
  await page.locator('.handbook-sidebar a[href="/guides/codex/configuration/"]').click();
  await page.waitForURL('**/guides/codex/configuration/');
  await page.waitForTimeout(220);
  const chapterTransitionDurations = await page.evaluate(() => window.__chapterTransitionDurations);
  expect(chapterTransitionDurations.some((duration) => duration > 0 && duration <= 180), `left chapter marker transition is missing or too slow: ${chapterTransitionDurations.join(', ')}`);
  const configurationFirstMarker = await page.locator('.reading-rail li').first().evaluate((item) => Number.parseFloat(getComputedStyle(item).insetBlockStart));
  expect(Math.abs(configurationFirstMarker - overviewFirstMarker) <= 1, `first reading marker changes between pages: ${overviewFirstMarker} versus ${configurationFirstMarker}`);
  await page.locator('[data-rail-toggle="right"]').click();
  expect(await page.locator('html[data-left-rail="collapsed"][data-right-rail="collapsed"]').count() === 1, 'paired reading rails did not collapse together');
  await page.locator('[data-rail-toggle="right"]').click();
  expect(await page.locator('html[data-left-rail="expanded"][data-right-rail="expanded"]').count() === 1, 'paired reading rails did not expand together');
  await page.locator('.handbook-sidebar a[href="/guides/codex/"]').click();
  await page.waitForURL('**/guides/codex/');
  const initialReadingProgress = await page.locator('.reading-track-progress').evaluate((track) => track.getBoundingClientRect().height);
  await page.evaluate(() => scrollTo(0, Math.max(1, (document.documentElement.scrollHeight - innerHeight) * .5)));
  await page.waitForTimeout(150);
  const progressedReadingPath = await page.locator('.reading-track-progress').evaluate((track) => ({
    height: track.getBoundingClientRect().height,
    color: getComputedStyle(track).backgroundColor,
  }));
  expect(progressedReadingPath.height > initialReadingProgress, 'cobalt reading-path highlight does not follow scroll distance');
  expect(progressedReadingPath.color !== 'rgba(0, 0, 0, 0)', 'reading-path progress highlight is transparent');
  await page.evaluate(() => scrollTo(0, 0));
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

  await page.setViewportSize({ width: 1525, height: 700 });
  await page.goto(`${origin}/guides/codex/recommendations/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.reading-rail')?.style.getPropertyValue('--rail-label-size'));
  const compactRailLabels = await page.locator('.reading-rail .reading-label').evaluateAll((labels) => labels
    .map((label) => {
      const box = label.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, opacity: Number.parseFloat(getComputedStyle(label).opacity) };
    }));
  expect(compactRailLabels.every((label) => label.opacity > 0), 'short-height reading rail hides subsection labels');
  expect(compactRailLabels.every((label, index) => index === 0 || label.top >= compactRailLabels[index - 1].bottom), 'short-height reading rail leaves visible labels overlapping');
  const inactiveSubsectionNodes = await page.locator('.reading-rail li[style*="--heading-depth: 1"] a:not([aria-current="true"]) .reading-node').evaluateAll((nodes) => nodes.map((node) => ({
    width: node.getBoundingClientRect().width,
    height: node.getBoundingClientRect().height,
    opacity: Number.parseFloat(getComputedStyle(node).opacity),
  })));
  expect(inactiveSubsectionNodes.every((node) => node.width === 0 && node.height === 0 && node.opacity === 0), 'inactive subsection dots are still visible');
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });

  const artifactDirectory = process.env.NAVIGATION_ARTIFACT_DIR;
  if (artifactDirectory) {
    await mkdir(artifactDirectory, { recursive: true });
    await page.screenshot({ path: path.join(artifactDirectory, 'codex-desktop.png'), fullPage: false });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(artifactDirectory, 'codex-mobile.png'), fullPage: false });
  }
  await context.close();

  const responsiveContext = await browser.newContext({ viewport: { width: 767, height: 900 } });
  const responsivePage = await responsiveContext.newPage();
  await responsivePage.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  const geometry = async () => responsivePage.evaluate(() => {
    const measure = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        visible: style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0,
        x: Math.round(box.x),
        width: Math.round(box.width),
      };
    };
    return {
      sidebar: measure('.sidebar-pane'),
      leftToggle: measure('[data-rail-toggle="left"]'),
      rightToggle: measure('[data-rail-toggle="right"]'),
      rightRail: measure('.right-rail-panel'),
      mobileMenu: measure('.mobile-site-menu summary'),
      search: measure('.search-trigger'),
      mobileToc: measure('.handbook-mobile-toc'),
      main: measure('main'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const mobileEdge = await geometry();
  expect(mobileEdge.mobileMenu?.visible && mobileEdge.mobileToc?.visible, '767px mobile controls are missing');
  expect(!mobileEdge.sidebar?.visible && mobileEdge.mobileToc?.x === 0, '767px mobile layout retains a desktop rail inset');
  expect(await responsivePage.locator('.site-header').evaluate((header) => header.getBoundingClientRect().height) >= 106, '767px header leaves the mobile two-row layout too early');

  for (const width of [320, 375, 430]) {
    await responsivePage.setViewportSize({ width, height: 900 });
    await responsivePage.waitForTimeout(50);
    const compactHeader = await responsivePage.evaluate(() => {
      const links = [...document.querySelectorAll('.provider-tabs a')].map((link) => link.getBoundingClientRect());
      const brand = document.querySelector('.site-name').getBoundingClientRect();
      const actions = document.querySelector('.header-actions').getBoundingClientRect();
      return {
        tabCenterDelta: ((links[0].left + links.at(-1).right) / 2) - (innerWidth / 2),
        overlap: brand.right - actions.left,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(Math.abs(compactHeader.tabCenterDelta) <= .5, `${width}px provider tabs are not centered: ${compactHeader.tabCenterDelta}`);
    expect(compactHeader.overlap <= 0, `${width}px brand overlaps the header utility rail: ${compactHeader.overlap}`);
    expect(compactHeader.overflow === 0, `${width}px header introduces horizontal overflow: ${compactHeader.overflow}`);
  }

  await responsivePage.setViewportSize({ width: 768, height: 900 });
  await responsivePage.waitForTimeout(220);
  const tabletStart = await geometry();
  expect(await responsivePage.locator('.site-header').evaluate((header) => header.getBoundingClientRect().height) === 64, '768px header does not enter the unified single-row layout');
  expect(tabletStart.search?.width === 36, '768px tablet header does not use the compact search control');
  expect(tabletStart.sidebar?.width === 68 && tabletStart.leftToggle?.visible, '768px tablet chapter rail cannot be reopened');
  expect(tabletStart.mobileToc?.visible && tabletStart.mobileToc.x === 68 && tabletStart.mobileToc.width === 700, '768px reading path does not account for the compact chapter rail');
  expect(!tabletStart.rightRail?.visible && !tabletStart.rightToggle?.visible, '768px tablet layout exposes the desktop reading rail');

  const tabletMainBefore = tabletStart.main;
  await responsivePage.locator('[data-rail-toggle="left"]').click();
  await responsivePage.waitForTimeout(220);
  const tabletExpanded = await geometry();
  expect(tabletExpanded.sidebar?.width === 272, 'tablet chapter rail does not expand');
  expect(tabletExpanded.main?.x === tabletMainBefore?.x && tabletExpanded.main?.width === tabletMainBefore?.width, 'tablet chapter rail pushes or resizes the article instead of overlaying it');
  expect(tabletExpanded.mobileToc?.x === 68 && tabletExpanded.mobileToc?.width === 700, 'overlay tablet reading path does not retain the compact rail inset');
  expect(await responsivePage.locator('.rail-scrim').evaluate((scrim) => getComputedStyle(scrim).pointerEvents === 'auto'), 'overlay tablet rail does not expose its dismissing scrim');
  await responsivePage.keyboard.press('Escape');
  await responsivePage.waitForTimeout(220);
  expect((await geometry()).sidebar?.width === 68, 'Escape does not collapse the tablet chapter rail');
  expect(await responsivePage.locator('[data-rail-toggle="left"]').evaluate((button) => document.activeElement === button), 'Escape does not return focus to the tablet rail control');

  await responsivePage.setViewportSize({ width: 896, height: 800 });
  await responsivePage.waitForTimeout(220);
  const pushCollapsed = await geometry();
  await responsivePage.locator('[data-rail-toggle="left"]').click();
  await responsivePage.waitForTimeout(220);
  const pushExpanded = await geometry();
  expect(pushExpanded.main?.x !== pushCollapsed.main?.x || pushExpanded.main?.width !== pushCollapsed.main?.width, '896px chapter rail does not push the article');
  expect(pushExpanded.mobileToc?.x === 272 && pushExpanded.mobileToc?.width === 624, '896px reading path does not follow the expanded chapter rail');
  await responsivePage.locator('[data-rail-toggle="left"]').click();

  for (const width of [1024, 1151, 1152, 1279]) {
    await responsivePage.setViewportSize({ width, height: 800 });
    await responsivePage.waitForTimeout(220);
    const state = await geometry();
    expect(state.leftToggle?.visible, `${width}px chapter rail toggle is missing`);
    expect(state.mobileToc?.visible && state.mobileToc.x === 68 && state.mobileToc.width === width - 68, `${width}px reading path is missing or misaligned`);
    expect(!state.rightRail?.visible && state.overflow === 0, `${width}px compact layout exposes a right rail or overflows horizontally`);
    if (width === 1024) {
      const titleActions = await responsivePage.locator('.page-title-row').evaluate((row) => {
        const title = row.querySelector('h1').getBoundingClientRect();
        const actions = row.querySelector('.page-actions').getBoundingClientRect();
        const bounds = row.getBoundingClientRect();
        return { topDelta: actions.top - title.top, rightDelta: bounds.right - actions.right, columns: getComputedStyle(row).gridTemplateColumns.split(' ').length };
      });
      expect(Math.abs(titleActions.topDelta) <= 4 && titleActions.rightDelta >= 0 && titleActions.rightDelta <= 1 && titleActions.columns === 2, `1024px title actions are not right aligned beside the title: ${JSON.stringify(titleActions)}`);
    }
  }

  await responsivePage.setViewportSize({ width: 1280, height: 800 });
  await responsivePage.waitForTimeout(220);
  const desktopEdge = await geometry();
  expect(desktopEdge.leftToggle?.visible && desktopEdge.rightToggle?.visible && desktopEdge.rightRail?.visible, '1280px desktop rail controls are missing');
  expect(!desktopEdge.mobileToc?.visible, '1280px desktop layout retains the tablet reading path');
  expect(desktopEdge.overflow <= 1, `1280px desktop layout overflows by ${desktopEdge.overflow}px`);
  await responsivePage.locator('[data-rail-toggle="right"]').click();
  await responsivePage.waitForTimeout(220);
  expect(await responsivePage.locator('html[data-left-rail="expanded"][data-right-rail="expanded"]').count() === 1, '1280px desktop rails do not expand together');
  await responsiveContext.close();

  const previewContext = await browser.newContext({ viewport: { width: 1172, height: 1044 } });
  const previewPage = await previewContext.newPage();
  await previewPage.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  await previewPage.locator('[data-rail-toggle="left"]').click();
  await previewPage.waitForTimeout(220);
  const previewLink = previewPage.locator('.sl-markdown-content a[href="https://openai.com/codex/"]').first();
  await previewLink.evaluate((link) => {
    const paragraph = link.closest('p');
    if (paragraph) paragraph.style.inlineSize = '9rem';
    link.scrollIntoView({ block: 'center' });
  });
  const previewPoint = await previewLink.evaluate((link) => {
    const rects = [...link.getClientRects()];
    const rect = rects[Math.min(1, rects.length - 1)];
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, fragments: rects.length, left: rect.left, top: rect.top };
  });
  await previewPage.mouse.move(previewPoint.x, previewPoint.y);
  await previewPage.waitForFunction(() => {
    const preview = document.querySelector('[data-link-preview]');
    if (!preview?.classList.contains('is-visible') || getComputedStyle(preview).opacity !== '1') return false;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(preview).transform);
    return matrix.a >= .99999 && matrix.d >= .99999;
  });
  const previewGeometry = await previewPage.locator('[data-link-preview]').evaluate((preview) => {
    const box = preview.getBoundingClientRect();
    const overlay = preview.parentElement;
    const header = document.querySelector('.site-header');
    const sidebar = document.querySelector('.sidebar-pane');
    return {
      bottom: box.bottom,
      placement: preview.dataset.placement,
      right: box.right,
      left: box.left,
      meta: preview.querySelector('small')?.textContent?.trim(),
      opacity: getComputedStyle(preview).opacity,
      transitionDuration: getComputedStyle(preview).transitionDuration,
      overlayUnderBody: overlay?.parentElement === document.body,
      overlayZ: Number.parseInt(getComputedStyle(overlay).zIndex, 10),
      headerZ: Number.parseInt(getComputedStyle(header).zIndex, 10),
      sidebarZ: Number.parseInt(getComputedStyle(sidebar).zIndex, 10),
    };
  });
  expect(previewPoint.fragments > 1, '1172px preview test link did not wrap to multiple rendered fragments');
  expect(previewGeometry.overlayUnderBody, 'citation preview is not hosted in a document-level body overlay');
  expect(previewGeometry.overlayZ > previewGeometry.headerZ && previewGeometry.overlayZ > previewGeometry.sidebarZ, `citation preview does not paint above the header and rail: ${JSON.stringify(previewGeometry)}`);
  expect(previewGeometry.placement === 'above' && previewGeometry.bottom <= previewPoint.top - 5, `citation preview overlaps its active line fragment: ${JSON.stringify(previewGeometry)}`);
  expect(Math.abs(previewGeometry.left - previewPoint.left) <= 1, `citation preview is not left aligned to the active line fragment: ${JSON.stringify({ previewGeometry, previewPoint })}`);
  expect(previewGeometry.right <= 1162 && previewGeometry.left >= 10, `citation preview escaped the 1172px viewport: ${JSON.stringify(previewGeometry)}`);
  expect(previewGeometry.meta === 'openai.com', `citation preview does not show only the actual hostname: ${previewGeometry.meta}`);
  expect(previewGeometry.opacity === '1' && previewGeometry.transitionDuration !== '0s', `citation preview entrance is not animated: ${JSON.stringify(previewGeometry)}`);
  await previewPage.keyboard.press('Escape');
  await previewPage.waitForFunction(() => document.querySelector('[data-link-preview]')?.hasAttribute('hidden'));
  expect(await previewPage.locator('[data-link-preview]').getAttribute('hidden') !== null, 'Escape does not dismiss the citation preview after its exit transition');
  await previewLink.focus();
  await previewPage.waitForFunction(() => {
    const preview = document.querySelector('[data-link-preview]');
    if (!preview?.classList.contains('is-visible') || getComputedStyle(preview).opacity !== '1') return false;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(preview).transform);
    return matrix.a >= .99999 && matrix.d >= .99999;
  });
  const focusAlignment = await previewPage.evaluate(() => {
    const link = document.activeElement;
    const first = link.getClientRects()[0];
    const preview = document.querySelector('[data-link-preview]').getBoundingClientRect();
    const expectedLeft = Math.min(innerWidth - preview.width - 10, Math.max(10, first.left));
    return { delta: preview.left - expectedLeft, describedBy: link.getAttribute('aria-describedby') };
  });
  expect(Math.abs(focusAlignment.delta) <= 1.25 && focusAlignment.describedBy === 'active-link-preview', `keyboard preview is not aligned to the first fragment: ${JSON.stringify(focusAlignment)}`);
  await previewPage.evaluate(() => scrollBy(0, 1));
  await previewPage.waitForFunction(() => document.querySelector('[data-link-preview]')?.hasAttribute('hidden'));
  await previewPage.setViewportSize({ width: 1171, height: 1044 });
  expect(await previewPage.locator('[data-link-preview]').getAttribute('hidden') !== null, 'resize does not dismiss the citation preview');
  await previewContext.close();

  const touchContext = await browser.newContext({ hasTouch: true, viewport: { width: 768, height: 900 } });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  const touchLink = touchPage.locator('.sl-markdown-content .registered-link').first();
  await touchLink.focus();
  expect(await touchPage.locator('[data-link-preview]').getAttribute('hidden') !== null, 'touch layout exposes a citation preview');
  expect(await touchPage.locator('.sl-markdown-content .link-favicon').count() === 0, 'touch article links include retired inline icons');
  await touchContext.close();

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto(origin, { waitUntil: 'domcontentloaded' });
  expect(await noScriptPage.locator('.provider-tabs a[href="/guides/codex/"]').getAttribute('href') === '/guides/codex/', 'ordinary internal URL changed without JavaScript');
  await noScriptPage.locator('.provider-tabs a[href="/guides/codex/"]').click();
  await noScriptPage.waitForURL('**/guides/codex/');
  expect((await noScriptPage.locator('h1').textContent())?.trim() === 'codex', 'progressive navigation failed without JavaScript');
  await noScriptContext.close();

  const noScriptDesktopContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1024 } });
  const noScriptDesktopPage = await noScriptDesktopContext.newPage();
  await noScriptDesktopPage.goto(`${origin}/guides/codex/`, { waitUntil: 'domcontentloaded' });
  const noScriptMarkerOffsets = await noScriptDesktopPage.locator('.reading-rail li').evaluateAll((items) => items.map((item) => {
    const box = item.getBoundingClientRect();
    return box.top + (box.height / 2);
  }));
  expect(noScriptMarkerOffsets.length > 0, 'no-script reading rail has no markers');
  expect(noScriptMarkerOffsets.every((offset, index) => index === 0 || offset - noScriptMarkerOffsets[index - 1] >= 37.5), 'no-script reading rail labels overlap before enhancement');
  await noScriptDesktopContext.close();

  const reducedMotionContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1024 } });
  const reducedMotionPage = await reducedMotionContext.newPage();
  await reducedMotionPage.goto(`${origin}/guides/codex/`, { waitUntil: 'networkidle' });
  expect(await reducedMotionPage.locator('[data-link-preview]').evaluate((preview) => getComputedStyle(preview).transitionDuration.split(',').every((duration) => Number.parseFloat(duration) <= .00001)), 'citation preview retains perceptible motion under reduced motion');
  await reducedMotionPage.evaluate(() => {
    window.__providerTabTransitionDurations = [];
    document.addEventListener('astro:after-swap', () => requestAnimationFrame(() => {
      window.__providerTabTransitionDurations = document.getAnimations().map((animation) => animation.effect?.getTiming().duration).filter(Number.isFinite);
    }), { once: true });
  });
  await reducedMotionPage.locator('.provider-tabs a[href="/guides/claude-code/"]').click();
  await reducedMotionPage.waitForURL('**/guides/claude-code/');
  await reducedMotionPage.waitForTimeout(50);
  const reducedMotionDurations = await reducedMotionPage.evaluate(() => window.__providerTabTransitionDurations);
  expect(reducedMotionDurations.every((duration) => duration <= 1), `provider tab transition ignores reduced motion: ${reducedMotionDurations.join(', ')}`);
  await reducedMotionContext.close();

  const directLoadContext = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const directLoadPage = await directLoadContext.newPage();
  await directLoadPage.goto(`${origin}/guides/claude-code/#where-claude-code-lives`, { waitUntil: 'networkidle' });
  await directLoadPage.waitForTimeout(150);
  expect((await directLoadPage.locator('.reading-rail a[aria-current="true"]').textContent())?.trim() === 'where claude code lives', 'direct document load did not initialize the active reading marker');
  expect(await directLoadPage.locator('.reading-track-progress').evaluate((track) => track.getBoundingClientRect().height) > 0, 'direct document load did not initialize cobalt reading progress');
  await directLoadPage.locator('[data-rail-toggle="right"]').click();
  expect(await directLoadPage.locator('html[data-left-rail="collapsed"][data-right-rail="collapsed"]').count() === 1, 'direct document load did not initialize rail controls');
  await directLoadContext.close();

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

console.log('client navigation, rail positioning, announcements, focus, history, hashes, scroll restoration, active state, mobile menu reset, external URLs, and no-script fallback passed');
