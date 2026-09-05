import sharp from 'sharp';
import { handbookScopes } from '../../site';

/** Sample the registered source marks at build time; no image decoding on the client. */
export async function providerMasks() {
  return Promise.all(['codex', 'claude-code', 'grok'].map(async (id) => {
    const provider = handbookScopes.find((scope) => scope.id === id)!;
    const { data, info } = await sharp(`public${provider.providerIcon}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ink = (i: number) => {
      const [r, g, b, a] = data.subarray(i, i + 4);
      return a > 160 && (id === 'codex' ? b - r > 18 && b - g > 8 : id === 'claude-code' ? r > 110 && r > g * 1.35 : r > 180 && g > 180 && b > 180);
    };
    let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (!ink((y * info.width + x) * 4)) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    if (x0 >= x1 || y0 >= y1) throw new Error(`Empty ASCII source mask: ${id}`);
    const side = Math.max(x1 - x0 + 1, y1 - y0 + 1);
    const mask = Buffer.alloc(800);
    for (let y = 0; y < 80; y++) for (let x = 0; x < 80; x++) {
      const sx = Math.round((x0 + x1) / 2 + (x / 79 - .5) * side);
      const sy = Math.round((y0 + y1) / 2 + (y / 79 - .5) * side);
      if (sx >= 0 && sx < info.width && sy >= 0 && sy < info.height && ink((sy * info.width + sx) * 4)) mask[(y * 80 + x) >> 3] |= 1 << ((y * 80 + x) & 7);
    }
    return { id, bits: mask.toString('base64') };
  }));
}
