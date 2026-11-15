export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const length = (x, y) => Math.hypot(x, y);

export const normalize = (x, y) => {
  const size = length(x, y) || 1;
  return { x: x / size, y: y / size };
};

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export const rounded = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};
