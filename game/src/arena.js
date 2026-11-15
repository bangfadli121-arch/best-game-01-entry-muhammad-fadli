import { colors } from './palette.js';

export const arena = { x: 640, y: 414, rx: 470, ry: 300, edgeMargin: 24 };

export function getArena(round = 1) {
  const scale = round >= 2 ? 0.85 : 1;
  return { x: arena.x, y: arena.y, rx: arena.rx * scale, ry: arena.ry * scale, edgeMargin: arena.edgeMargin };
}

// Spectator placement and reactions.
export function makeSpectators(random, count = 14) {
  return Array.from({ length: count }, (_, index) => ({
    angle: (index / count) * Math.PI * 2,
    phase: random() * Math.PI * 2,
    color: [colors.gold, colors.pink, colors.mint, '#8fe9eb'][index % 4],
    react: 0,
    jump: 0
  }));
}

export function updateSpectators(list, dt) {
  for (const fan of list) {
    fan.phase += dt * 3;
    fan.react = Math.max(0, fan.react - dt);
    fan.jump = Math.max(0, fan.jump - dt);
  }
}

export function cheer(list) {
  for (const fan of list) {
    fan.react = 0.72;
  }
}

export function isOutside(point, extra = arena.edgeMargin, round = 1) {
  const size = getArena(round);
  const dx = (point.x - size.x) / (size.rx + extra);
  const dy = (point.y - size.y) / (size.ry + extra);
  return dx * dx + dy * dy > 1;
}

export function constrainToPlatform(bot, round = 1) {
  const size = getArena(round);
  const dx = bot.x - size.x;
  const dy = bot.y - size.y;
  const nx = dx / size.rx;
  const ny = dy / size.ry;
  const metric = Math.hypot(nx, ny);
  if (metric > 0.91 && !bot.falling) {
    const scale = 0.91 / metric;
    bot.x = size.x + dx * scale;
    bot.y = size.y + dy * scale;
    bot.vx *= 0.94;
    bot.vy *= 0.94;
  }
}

// Arena floor drawing.
export function drawArena(ctx, time, spectators, round = 1, piston = null) {
  const size = getArena(round);
  ctx.save();
  ctx.fillStyle = '#259fa8';
  ctx.beginPath();
  ctx.ellipse(arena.x, arena.y + 26, size.rx + 12, size.ry + 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ring;
  ctx.beginPath();
  ctx.ellipse(arena.x, arena.y, size.rx + 7, size.ry + 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.rustDark;
  ctx.beginPath();
  ctx.ellipse(arena.x, arena.y + 5, size.rx, size.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.rust;
  ctx.beginPath();
  ctx.ellipse(arena.x, arena.y - 1, size.rx - 9, size.ry - 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.rustBright;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(arena.x, arena.y - 1, size.rx - 36, size.ry - 36, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawHazards(ctx, size);
  drawRivets(ctx, size);
  drawSpectators(ctx, time, spectators, size);
  if (round >= 3) {
    drawPiston(ctx, piston);
  }
  ctx.restore();
}

function drawHazards(ctx, size) {
  ctx.save();
  ctx.translate(640, 414);
  ctx.rotate(-0.08);
  ctx.fillStyle = '#973e2d';
  ctx.fillRect(-size.rx * 0.2, -10, size.rx * 0.4, 20);
  ctx.fillStyle = colors.stripe;
  for (let x = -size.rx * 0.2 + 8; x < size.rx * 0.2; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + 12, -10);
    ctx.lineTo(x + 2, 10);
    ctx.lineTo(x - 10, 10);
    ctx.fill();
  }
  ctx.restore();
}

function drawRivets(ctx, size) {
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    const x = arena.x + Math.cos(angle) * (size.rx - 19);
    const y = arena.y + Math.sin(angle) * (size.ry - 19);
    ctx.fillStyle = '#ffbc6a';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.rustDark;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpectators(ctx, time, list, size) {
  for (const fan of list) {
    const bob = Math.sin(fan.phase) * 4 + (fan.react > 0 ? Math.sin(time * 25 + fan.angle) * 8 : 0) - fan.jump * 28;
    const x = arena.x + Math.cos(fan.angle) * (size.rx - 1);
    const y = arena.y + Math.sin(fan.angle) * (size.ry - 2) + bob;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(fan.angle + Math.PI / 2);
    ctx.fillStyle = fan.color;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.lineTo(-15, fan.react > 0 ? -12 : 7);
    ctx.moveTo(8, 1);
    ctx.lineTo(15, fan.react > 0 ? -12 : 7);
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.fillRect(-5, -3, 3, 3);
    ctx.fillRect(3, -3, 3, 3);
    ctx.restore();
  }
}

function drawPiston(ctx, piston) {
  const warning = piston?.phase === 'warn';
  const active = piston?.phase === 'push';
  ctx.save();
  ctx.translate(arena.x, arena.y);
  ctx.fillStyle = active ? colors.gold : '#526b70';
  ctx.beginPath();
  ctx.arc(0, 0, active ? 45 : 37, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = warning ? colors.pink : colors.ink;
  ctx.lineWidth = warning ? 9 : 6;
  ctx.beginPath();
  ctx.arc(0, 0, 47, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#a9c4c2';
  ctx.beginPath();
  ctx.arc(0, 0, active ? 28 : 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
