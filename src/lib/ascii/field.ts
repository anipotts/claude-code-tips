export type Mask = { id: string; bits: string };
export type FieldSize = { width: number; height: number; dpr: number };
export const glyphs = '.,:;+=xX#@';
const TAU = Math.PI * 2;
const ease = (a: number, b: number, t: number) => { const v = Math.max(0, Math.min(1, (t - a) / (b - a))); return v * v * (3 - 2 * v); };
const hash = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

/** Shared by the worker and the one-frame fallback. All motion is elapsed-time based. */
export class AsciiField {
  private points: number[][][];
  private size: FieldSize = { width: 1, height: 1, dpr: 1 };
  constructor(private canvas: OffscreenCanvas | HTMLCanvasElement, private context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, private atlas: CanvasImageSource, masks: Mask[]) {
    this.points = masks.map(({ bits }) => {
      const bytes = atob(bits), points: number[][] = [];
      for (let i = 0; i < 6400; i++) if (bytes.charCodeAt(i >> 3) & (1 << (i & 7))) points.push([(i % 80) / 79 - .5, Math.floor(i / 80) / 79 - .5]);
      // Angular ordering lets adjacent streams pull into neighboring parts of the mark.
      return points.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]) || Math.hypot(...a) - Math.hypot(...b));
    });
  }
  resize(size: FieldSize) {
    this.size = size;
    this.canvas.width = Math.round(size.width * size.dpr);
    this.canvas.height = Math.round(size.height * size.dpr);
    this.context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  }
  setAtlas(atlas: CanvasImageSource) { this.atlas = atlas; }
  draw(time: number, still = false) {
    const { width: w, height: h } = this.size;
    const c = this.context;
    c.clearRect(0, 0, w, h);
    const mobile = w < 768;
    const count = mobile ? 1500 : 3000;
    const cycle = Math.floor(time / 22);
    const phase = still ? 12 : time % 22;
    const points = this.points[still ? 0 : cycle % this.points.length];
    const gather = ease(2, 9, phase) * (1 - ease(15, 22, phase));
    const scale = mobile ? Math.min(w * .86, 370) : Math.min(w * .47, h * .83, 760);
    const cx = mobile ? w * .5 : w * .765;
    const cy = mobile ? 255 : h * .50;
    const drift = still ? 0 : time;
    const glyphSize = mobile ? 12 : 18;
    for (let i = 0; i < count; i++) {
      const seed = hash(i + 1), depth = hash(i + 701);
      const u = (i / count + drift * .017) % 1;
      const band = i % 11;
      const angle = u * TAU * 1.7 + band * .13 + drift * .11;
      const fx = (u * 1.45 - .225) * w + Math.sin(angle * 1.3 + drift * .07) * w * .12;
      const fy = h * .52 + Math.sin(angle) * h * .32 + Math.cos(u * TAU * 3 - drift * .19) * h * .075 + (band - 5) * (mobile ? 4 : 7);
      const p = points[Math.floor(i / count * points.length)];
      // Outer filaments keep circulating while the dense center becomes identifiable.
      const belonging = i % 9 === 0 ? gather * .18 : gather;
      const wave = Math.sin(drift * .85 + p[0] * 8 + p[1] * 6);
      const tx = cx + p[0] * scale + wave * (2 + (1 - gather) * 24);
      const ty = cy + p[1] * scale + Math.cos(drift * .7 + p[0] * 9) * (2 + (1 - gather) * 20);
      const x = fx + (tx - fx) * belonging;
      const y = fy + (ty - fy) * belonging;
      const density = Math.min(9, Math.floor(1 + depth * 4 + belonging * 4 + Math.sin(seed * TAU + drift * .65)));
      c.globalAlpha = .30 + depth * .30 + belonging * .40;
      c.drawImage(this.atlas, Math.max(0, density) * 24, 0, 24, 32, x - glyphSize / 2, y - glyphSize * .65, glyphSize, glyphSize * 1.33);
    }
    c.globalAlpha = 1;
  }
}
