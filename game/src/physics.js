import { arena, isOutside } from './arena.js';
import { startFall } from './player.js';
import { length, normalize } from './utils.js';

// Circle contact, shove force, and ring-out checks.
export function resolveBots(player, bot, effects, audio, spectators, round = 1) {
  if (player.falling || bot.falling) {
    return null;
  }
  const dx = bot.x - player.x;
  const dy = bot.y - player.y;
  const gap = length(dx, dy);
  const reach = player.radius + bot.radius;
  if (gap >= reach) {
    return null;
  }
  const normal = normalize(dx, dy);
  const overlap = reach - gap;
  player.x -= normal.x * overlap * 0.48;
  player.y -= normal.y * overlap * 0.48;
  bot.x += normal.x * overlap * 0.52;
  bot.y += normal.y * overlap * 0.52;
  const relative = Math.max(0, (player.vx - bot.vx) * normal.x + (player.vy - bot.vy) * normal.y);
  const dashPower = player.dashTime > 0 ? 2.3 : 1;
  if (relative > 16 || player.dashTime > 0) {
    const force = (100 + relative * 0.65) * dashPower * player.shovePower;
    const resistance = bot.stunned > 0 ? bot.weight * 0.5 : bot.weight;
    bot.vx += normal.x * force / resistance;
    bot.vy += normal.y * force / resistance;
    player.vx -= normal.x * force * 0.13;
    player.vy -= normal.y * force * 0.13;
    effects.spark((player.x + bot.x) / 2, (player.y + bot.y) / 2, normal.x, normal.y);
    effects.shake = Math.max(effects.shake, 7 + dashPower * 3);
    audio.play('thud');
    for (const fan of spectators) {
      fan.react = 0.72;
    }
    audio.play('cheer');
    if (bot.boss && relative > 48) {
      bot.stability = Math.max(0, bot.stability - 14 - relative * 0.08);
      if (bot.stability === 0) {
        bot.stunned = 1.5;
      }
    }
  }
  const botPush = bot.shove * (bot.name === 'HEAVY' ? 1.35 : 1);
  const forceToPlayer = (65 + relative * 0.35) * botPush;
  player.vx -= normal.x * forceToPlayer / player.weight;
  player.vy -= normal.y * forceToPlayer / player.weight;
  bot.vx += normal.x * 32;
  bot.vy += normal.y * 32;
  if (isOutside(player, arena.edgeMargin, round)) {
    startFall(player);
    effects.knockout = 0.38;
    effects.shake = 20;
    effects.flash = 0.45;
    audio.play('crash');
    return 'player';
  }
  if (isOutside(bot, arena.edgeMargin, round)) {
    startFall(bot);
    effects.knockout = 0.38;
    effects.shake = 20;
    effects.flash = 0.45;
    audio.play('crash');
    return 'bot';
  }
  return null;
}

export function checkRingOut(player, bot, effects, audio, round = 1) {
  if (!player.falling && isOutside(player, arena.edgeMargin, round)) {
    startFall(player);
    effects.shake = 20;
    effects.flash = 0.45;
    audio.play('crash');
    return 'player';
  }
  if (!bot.falling && isOutside(bot, arena.edgeMargin, round)) {
    startFall(bot);
    effects.shake = 20;
    effects.flash = 0.45;
    audio.play('crash');
    return 'bot';
  }
  return null;
}

// Boss shockwave and centre piston force.
export function resolveBossSlam(player, boss, effects, audio) {
  effects.wave(boss.x, boss.y, 250, '#ffe477');
  effects.shake = Math.max(effects.shake, 13);
  audio.play('thud');
  if (!player.falling && length(player.x - boss.x, player.y - boss.y) < 270) {
    const direction = normalize(player.x - boss.x, player.y - boss.y);
    player.vx += direction.x * 390;
    player.vy += direction.y * 390;
  }
}

export function resolvePistonPulse(player, bot, effects, audio) {
  effects.wave(arena.x, arena.y, 175, '#ffdc58');
  effects.shake = Math.max(effects.shake, 9);
  audio.play('thud');
  for (const unit of [player, bot]) {
    if (unit.falling) {
      continue;
    }
    const dx = unit.x - arena.x;
    const dy = unit.y - arena.y;
    const gap = length(dx, dy);
    if (gap < 145) {
      const direction = normalize(dx, dy);
      const strength = 340 / (unit.weight || 1);
      unit.vx += direction.x * strength;
      unit.vy += direction.y * strength;
    }
  }
}
