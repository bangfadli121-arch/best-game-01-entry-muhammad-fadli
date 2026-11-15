import { colors } from './palette.js';
import { clamp, length, normalize, rounded } from './utils.js';

const kinds = [
  { name: 'CHARGER', color: colors.charger, radius: 29, weight: 1, speed: 175, shove: 1.15 },
  { name: 'DODGER', color: colors.dodger, radius: 26, weight: 0.8, speed: 155, shove: 0.85 },
  { name: 'SCRAP KING', color: colors.gold, radius: 56, weight: 4.6, speed: 115, shove: 2.1, boss: true }
];

export function makeBot(round, cycle = 0) {
  const kind = kinds[(round - 1) % 3];
  return { ...kind, x: 795, y: 410, vx: 0, vy: 0, faceX: -1, faceY: 0, falling: false, fallTime: 0, angle: 0, lunge: 0, round, cycle, radius: kind.radius, weight: kind.weight + cycle * 0.2, shove: kind.shove + cycle * 0.08, speed: kind.speed + cycle * 8, stability: kind.boss ? 100 : 0, maxStability: kind.boss ? 100 : 0, stunned: 0, slamCooldown: 2.6, slamWindup: 0, flash: 0 };
}

// Personality steering.
export function updateBot(bot, player, dt, roundTime, effects) {
  if (bot.falling) {
    bot.fallTime += dt;
    bot.angle += dt * 8;
    bot.vy += 260 * dt;
    bot.x += bot.vx * dt;
    bot.y += bot.vy * dt;
    return;
  }
  const dx = player.x - bot.x;
  const dy = player.y - bot.y;
  const gap = length(dx, dy);
  if (bot.boss) {
    bot.stability = Math.min(bot.maxStability, bot.stability + dt * 4);
    bot.flash = Math.max(0, bot.flash - dt);
    if (bot.stunned > 0) {
      bot.stunned = Math.max(0, bot.stunned - dt);
      return false;
    }
    if (bot.slamWindup > 0) {
      bot.slamWindup -= dt;
      bot.flash = 0.12;
      effects.shake = Math.max(effects.shake, 2 + Math.sin((0.6 - bot.slamWindup) * 45) * 3);
      if (bot.slamWindup <= 0) {
        bot.slamCooldown = 3.4;
        return true;
      }
      return false;
    }
    bot.slamCooldown -= dt;
    if (bot.slamCooldown <= 0) {
      bot.slamWindup = 0.6;
      bot.flash = 0.6;
      return false;
    }
  }
  let desire = { x: dx, y: dy };
  if (bot.name === 'DODGER') {
    const tangent = normalize(-dy, dx);
    const toward = gap > 205 ? 0.4 : -0.35;
    desire = { x: tangent.x + (dx / (gap || 1)) * toward, y: tangent.y + (dy / (gap || 1)) * toward };
    const edge = Math.hypot((player.x - 640) / 445, (player.y - 414) / 275);
    bot.lunge = edge > 0.72 ? 0.65 : Math.max(0, bot.lunge - dt);
    if (bot.lunge > 0) {
      desire = { x: dx, y: dy };
    }
  }
  if (bot.name === 'SCRAP KING') {
    desire = { x: dx, y: dy };
  }
  const steer = normalize(desire.x, desire.y);
  bot.faceX = steer.x;
  bot.faceY = steer.y;
  const cycleBoost = 1 + bot.cycle * 0.055;
  bot.vx += steer.x * bot.speed * cycleBoost * dt * (bot.boss ? 0.85 : 1.25);
  bot.vy += steer.y * bot.speed * cycleBoost * dt * (bot.boss ? 0.85 : 1.25);
  const cap = bot.speed * cycleBoost * (bot.boss ? 0.8 : 1);
  const speed = length(bot.vx, bot.vy);
  if (speed > cap) {
    bot.vx = (bot.vx / speed) * cap;
    bot.vy = (bot.vy / speed) * cap;
  }
  const drag = bot.boss ? 0.96 : 0.93;
  bot.vx *= Math.pow(drag, dt * 60);
  bot.vy *= Math.pow(drag, dt * 60);
  bot.x += bot.vx * dt;
  bot.y += bot.vy * dt;
  return false;
}

// Opponent drawing.
export function drawBot(ctx, bot, time) {
  if (bot.boss && bot.slamWindup > 0) {
    ctx.strokeStyle = `rgba(255, 226, 93, ${0.45 + Math.sin(time * 24) * 0.25})`;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, 110 + Math.sin(time * 24) * 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(bot.x, bot.y);
  ctx.rotate(bot.falling ? bot.angle : Math.atan2(bot.vy, bot.vx) * 0.04);
  const bob = bot.falling ? 0 : Math.sin(time * 7 + bot.round) * 1.5;
  ctx.translate(0, bob);
  ctx.fillStyle = '#243d53';
  rounded(ctx, -bot.radius, bot.radius - 5, bot.radius * 0.75, 17, 7);
  ctx.fill();
  rounded(ctx, 3, bot.radius - 5, bot.radius * 0.75, 17, 7);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-bot.radius + 2, 0);
  ctx.lineTo(-bot.radius - 12, 10);
  ctx.moveTo(bot.radius - 2, 0);
  ctx.lineTo(bot.radius + 12, 10);
  ctx.stroke();
  ctx.fillStyle = bot.flash > 0 ? '#fff7cd' : bot.color;
  if (bot.name === 'DODGER') {
    ctx.beginPath();
    ctx.moveTo(-27, -22);
    ctx.lineTo(22, -25);
    ctx.lineTo(30, 12);
    ctx.lineTo(-20, 23);
    ctx.closePath();
  } else if (bot.boss) {
    rounded(ctx, -58, -48, 116, 94, 22);
  } else if (bot.name === 'HEAVY') {
    rounded(ctx, -35, -28, 70, 58, 16);
  } else {
    rounded(ctx, -29, -26, 58, 54, 12);
  }
  ctx.fill();
  ctx.strokeStyle = '#713c38';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#fff8d9';
  ctx.beginPath();
  ctx.arc(-10, -4, bot.boss ? 10 : 7, 0, Math.PI * 2);
  ctx.arc(10, -4, bot.boss ? 10 : 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(-8 + bot.faceX * 2, -3 + bot.faceY * 2, bot.boss ? 4 : 3, 0, Math.PI * 2);
  ctx.arc(12 + bot.faceX * 2, -3 + bot.faceY * 2, bot.boss ? 4 : 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -bot.radius);
  ctx.lineTo(bot.name === 'DODGER' ? 10 : 0, -bot.radius - (bot.boss ? 22 : 13));
  ctx.stroke();
  ctx.fillStyle = bot.boss ? colors.pink : '#fff2a5';
  ctx.beginPath();
  ctx.arc(bot.name === 'DODGER' ? 10 : 0, -bot.radius - (bot.boss ? 26 : 17), bot.boss ? 9 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
