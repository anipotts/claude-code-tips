import { AsciiField, type FieldSize, type Mask } from './field';
let field: AsciiField | undefined;
let atlas: ImageBitmap | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let active = false, reduced = false, time = 10, last = 0, interval = 1000 / 30;
function stop() { active = false; clearTimeout(timer); timer = undefined; }
function tick() {
  if (!active || !field) return;
  const now = performance.now();
  time += Math.min((now - last) / 1000, .1); last = now;
  const start = performance.now();
  field.draw(time);
  // One timer, no catch-up work. Slow devices naturally use less CPU.
  timer = setTimeout(tick, Math.max(16, interval - (performance.now() - start)));
}
self.onmessage = (event: MessageEvent) => {
  const m = event.data;
  if (m.type === 'init') {
    const context = (m.canvas as OffscreenCanvas).getContext('2d');
    if (!context) { self.postMessage({ type: 'unavailable' }); return; }
    atlas = m.atlas;
    field = new AsciiField(m.canvas, context, atlas!, m.masks as Mask[]);
    field.resize(m.size); reduced = m.reduced;
    field.draw(time, reduced);
    self.postMessage({ type: 'ready' });
  } else if (m.type === 'size') {
    const size = m.size as FieldSize;
    interval = 1000 / (size.width < 768 ? 24 : 30);
    field?.resize(size); field?.draw(time, reduced);
  } else if (m.type === 'atlas') {
    atlas?.close(); atlas = m.atlas; field?.setAtlas(atlas!); field?.draw(time, reduced);
  } else if (m.type === 'state') {
    stop(); reduced = m.reduced;
    if (reduced) field?.draw(time, true);
    else if (m.active) { active = true; last = performance.now(); tick(); }
  }
};
