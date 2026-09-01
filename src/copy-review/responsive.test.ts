import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [page, styles, client] = await Promise.all([
  readFile(new URL('pages-dev/copy-review.astro', root), 'utf8'),
  readFile(new URL('pages-dev/copy-review.css', root), 'utf8'),
  readFile(new URL('copy-review/client.ts', root), 'utf8'),
]);

describe('copy review responsive workspace', () => {
  test('exposes one labeled mobile tab for each workbench pane', () => {
    expect(page).toContain('aria-label="copy review workspace"');
    expect(page.match(/data-mobile-panel-target=/g)).toHaveLength(3);
    expect(page).toContain('aria-controls="copy-review-pages"');
    expect(page).toContain('aria-controls="copy-review-editor"');
    expect(page).toContain('aria-controls="copy-review-review"');
  });

  test('removes the desktop minimum width and uses a single-pane layout', () => {
    expect(styles).toContain('@media(max-width:68rem)');
    expect(styles).toContain('min-width:0; min-height:0; width:100%; height:100%');
    expect(styles).toContain("body[data-mobile-panel='tree'] .writing-rail");
    expect(styles).toContain("body[data-mobile-panel='editor'] .editor-workspace");
    expect(styles).toContain("body[data-mobile-panel='review'] .publish-rail");
  });

  test('keeps inactive mobile panes out of keyboard and screen-reader flow', () => {
    expect(client).toContain("window.matchMedia('(max-width: 68rem)')");
    expect(client).toContain("surface.toggleAttribute('inert', !active)");
    expect(client).toContain("surface.setAttribute('aria-hidden', String(!active))");
    expect(client).toContain("if (mobileMedia.matches) setMobilePanel('editor')");
  });
});
