import { colors } from './palette.js';

export function makeEffects(random) {
  const effects = { sparks: [], confetti: [], shockwaves: [], koTexts: [], shake: 0, flash: 0, knockout: 0, random };
  effects.spark = (x, y, nx, ny) => sparkBurst(effects, x, y, nx, ny);
  effects.wave = (x, y, radius, color) => effects.shockwaves.push({ x, y, radius, age: 0, color });
  effects.koText = (x, y) => effects.koTexts.push({ x, y, age: 0 });
  return effects;
}

// Shove sparks, match confetti, and screen effects.
export function sparkBurst(effects, x, y, nx = 0, ny = 0) {
  for (let index = 0; index < 18; index += 1) {
    const angle = effects.random() * Math.PI * 2;
    const speed = 75 + effects.random() * 230;
    effects.sparks.push({ x, y, vx: Math.cos(angle) * speed + nx * 60, vy: Math.sin(angle) * speed + ny * 60, life: 0.2 + effects.random() * 0.35, max: 0.55, size: 2 + effects.random() * 4, color: [colors.gold, '#fff6cf', colors.pink, colors.mint][Math.floor(effects.random() * 4)] });
  }
}

export function confettiBurst(effects) {
  for (let index = 0; index < 130; index += 1) {
    effects.confetti.push({ x: 110 + effects.random() * 1060, y: -20 - effects.random() * 360, vx: (effects.random() - 0.5) * 100, vy: 100 + effects.random() * 260, spin: effects.random() * 8, life: 5 + effects.random() * 4, color: [colors.gold, colors.pink, colors.mint, '#fff6cf', '#48bde1'][Math.floor(effects.random() * 5)] });
  }
}

export function updateEffects(effects, dt) {
  effects.shake = Math.max(0, effects.shake - dt * 25);
  effects.flash = Math.max(0, effects.flash - dt);
  effects.knockout = Math.max(0, effects.knockout - dt);
  for (const part of effects.sparks) {
    part.life -= dt;
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.vx *= 0.94;
    part.vy *= 0.94;
  }
  effects.sparks = effects.sparks.filter((part) => part.life > 0);
  for (const bit of effects.confetti) {
    bit.life -= dt;
    bit.x += bit.vx * dt;
    bit.y += bit.vy * dt;
    bit.spin += dt * 8;
    bit.vy += dt * 38;
  }
  effects.confetti = effects.confetti.filter((bit) => bit.life > 0 && bit.y < 820);
  for (const wave of effects.shockwaves) {
    wave.age += dt;
  }
  effects.shockwaves = effects.shockwaves.filter((wave) => wave.age < 0.48);
  for (const label of effects.koTexts) {
    label.age += dt;
    label.y -= dt * 45;
  }
  effects.koTexts = effects.koTexts.filter((label) => label.age < 1.25);
}

export function drawEffects(ctx, effects) {
  for (const wave of effects.shockwaves) {
    ctx.globalAlpha = Math.max(0, 1 - wave.age / 0.48);
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 8 - wave.age * 8;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, 20 + wave.age * wave.radius * 2.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const part of effects.sparks) {
    ctx.globalAlpha = Math.max(0, part.life / part.max);
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const bit of effects.confetti) {
    ctx.save();
    ctx.translate(bit.x, bit.y);
    ctx.rotate(bit.spin);
    ctx.fillStyle = bit.color;
    ctx.fillRect(-4, -7, 8, 14);
    ctx.restore();
  }
  for (const label of effects.koTexts) {
    ctx.globalAlpha = Math.max(0, 1 - label.age / 1.25);
    ctx.textAlign = 'center';
    ctx.font = '1000 31px system-ui, sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#8c3929';
    ctx.strokeText('+1000 KO!', label.x, label.y);
    ctx.fillStyle = colors.gold;
    ctx.fillText('+1000 KO!', label.x, label.y);
  }
  ctx.globalAlpha = 1;
}
