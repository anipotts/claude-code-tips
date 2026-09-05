import { AsciiField, glyphs, type Mask } from './field';

export function mountAsciiBackground() {
  const host = document.querySelector<HTMLElement>('.ascii-background');
  let canvas = host?.querySelector<HTMLCanvasElement>('canvas');
  const button = document.querySelector<HTMLButtonElement>('.ascii-motion-control');
  if (!host || !canvas || !button) return;
  const abort = new AbortController();
  const { signal } = abort;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const masks: Mask[] = JSON.parse(host.dataset.masks!);
  let worker: Worker | undefined, fallback: AsciiField | undefined, ready = false, dead = false;
  let paused = false, scheduled = 0, revision = 0;
  try { paused = localStorage.getItem('ascii-background-paused') === 'true'; } catch { /* Storage is optional. */ }
  const size = () => ({ width: innerWidth, height: innerHeight, dpr: Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(2_500_000 / (innerWidth * innerHeight))) });
  const sync = () => {
    button.hidden = !ready || media.matches || !worker;
    button.textContent = paused ? button.dataset.resume! : button.dataset.pause!;
    worker?.postMessage({ type: 'state', active: !paused && !document.hidden, reduced: media.matches });
    host.dataset.motion = media.matches ? 'reduced' : !worker ? 'static' : paused ? 'paused' : document.hidden ? 'suspended' : 'running';
  };
  async function atlas() {
    const style = getComputedStyle(host!);
    await document.fonts.load(`${style.fontSize} ${style.fontFamily}`).catch(() => {});
    const sheet = document.createElement('canvas'); sheet.width = glyphs.length * 24; sheet.height = 32;
    const c = sheet.getContext('2d')!;
    c.font = `24px ${style.fontFamily}`;
    c.fillStyle = style.color; c.textAlign = 'center'; c.textBaseline = 'middle';
    [...glyphs].forEach((glyph, i) => c.fillText(glyph, i * 24 + 12, 16));
    return sheet;
  }
  async function staticFallback() {
    worker?.terminate(); worker = undefined;
    // A transferred canvas cannot be reclaimed after a worker failure.
    const replacement = document.createElement('canvas'); replacement.className = 'ascii-canvas';
    canvas!.replaceWith(replacement); canvas = replacement;
    const sheet = await atlas();
    if (dead) return;
    const c = canvas.getContext('2d'); if (!c) return;
    fallback = new AsciiField(canvas, c, sheet, masks);
    fallback.resize(size()); fallback.draw(12, true); ready = true; sync();
  }
  async function start() {
    if (dead) return;
    try {
      const sheet = await atlas(); if (dead) return;
      if (!canvas!.transferControlToOffscreen || !window.Worker) { await staticFallback(); return; }
      const bitmap = await createImageBitmap(sheet); if (dead) { bitmap.close(); return; }
      worker = new Worker(new URL('./field.worker.ts', import.meta.url), { type: 'module' });
      worker.onerror = (event) => { event.preventDefault(); void staticFallback(); };
      worker.onmessage = (event) => {
        if (event.data.type === 'unavailable') { void staticFallback(); return; }
        if (event.data.type === 'ready') { ready = true; worker?.postMessage({ type: 'size', size: size() }); sync(); }
      };
      const offscreen = canvas!.transferControlToOffscreen();
      worker.postMessage({ type: 'init', canvas: offscreen, atlas: bitmap, masks, size: size(), reduced: media.matches }, [offscreen, bitmap]);
    } catch { if (!dead) await staticFallback(); }
  }
  button.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('ascii-background-paused', String(paused)); } catch { /* Storage is optional. */ }
    sync();
  }, { signal });
  media.addEventListener('change', sync, { signal });
  document.addEventListener('visibilitychange', sync, { signal });
  // Redraw only on layout changes, never on scroll. The field is viewport fixed.
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(() => { worker?.postMessage({ type: 'size', size: size() }); fallback?.resize(size()); fallback?.draw(12, true); });
  });
  resize.observe(document.documentElement);
  window.addEventListener('resize', () => { worker?.postMessage({ type: 'size', size: size() }); fallback?.resize(size()); fallback?.draw(12, true); }, { signal });
  const theme = new MutationObserver(async () => {
    if (!ready) return;
    const version = ++revision;
    const sheet = await atlas(); if (dead || version !== revision) return;
    if (worker) { const bitmap = await createImageBitmap(sheet); if (dead || version !== revision) { bitmap.close(); return; } worker?.postMessage({ type: 'atlas', atlas: bitmap }, [bitmap]); }
    else { fallback?.setAtlas(sheet); fallback?.draw(12, true); }
  });
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // Yield through two paints. Optional artwork never sits on the content's startup path.
  let idle = 0, startupFrame = 0;
  const defer = requestAnimationFrame(() => {
    startupFrame = requestAnimationFrame(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => { void start(); }, { timeout: 1500 });
      else void start();
    });
  });
  return () => { dead = true; abort.abort(); cancelAnimationFrame(defer); cancelAnimationFrame(startupFrame); cancelAnimationFrame(scheduled); if (idle) window.cancelIdleCallback(idle); resize.disconnect(); theme.disconnect(); worker?.terminate(); };
}
