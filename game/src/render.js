import { drawArena } from './arena.js';
import { drawBot } from './bots.js';
import { colors } from './palette.js';
import { drawEffects } from './particles.js';
import { drawPlayer } from './player.js';

// Sky, drifting scrap, arena, robots, and effects.
export function renderScene(ctx, game) {
  ctx.save();
  ctx.fillStyle = colors.sky;
  ctx.fillRect(0, 0, 1280, 800);
  drawCloud(ctx, 210, 154, 1.1);
  drawCloud(ctx, 1000, 120, 0.85);
  drawCloud(ctx, 835, 230, 0.65);
  drawScrap(ctx, game.elapsed);
  const offsetX = game.effects.shake ? (Math.random() - 0.5) * game.effects.shake : 0;
  const offsetY = game.effects.shake ? (Math.random() - 0.5) * game.effects.shake : 0;
  ctx.translate(offsetX, offsetY);
  drawArena(ctx, game.elapsed, game.spectators, game.round, game.piston);
  drawBot(ctx, game.bot, game.elapsed);
  drawPlayer(ctx, game.player, game.elapsed);
  drawEffects(ctx, game.effects);
  ctx.restore();
  if (game.state === 'defeat') {
    ctx.fillStyle = 'rgba(25, 43, 55, 0.34)';
    ctx.fillRect(0, 0, 1280, 800);
  }
  if (game.effects.flash > 0) {
    ctx.fillStyle = `rgba(255, 250, 210, ${game.effects.flash * 0.48})`;
    ctx.fillRect(0, 0, 1280, 800);
  }
}

function drawCloud(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = colors.cloudShade;
  ctx.beginPath();
  ctx.ellipse(0, 10, 62, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cloud;
  ctx.beginPath();
  ctx.arc(-28, 2, 22, 0, Math.PI * 2);
  ctx.arc(0, -8, 30, 0, Math.PI * 2);
  ctx.arc(30, 3, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScrap(ctx, time) {
  for (let index = 0; index < 11; index += 1) {
    const x = 72 + ((index * 127 + time * (9 + index % 4)) % 1130);
    const y = 294 + Math.sin(time * 0.55 + index * 2) * 42 + (index % 3) * 17;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.16 + index);
    ctx.fillStyle = index % 2 ? '#eaa856' : '#78a9a0';
    if (index % 3 === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill('evenodd');
    } else {
      ctx.fillRect(-13, -8, 26, 16);
      ctx.fillStyle = '#fff0b1';
      ctx.beginPath();
      ctx.arc(-8, -3, 2, 0, Math.PI * 2);
      ctx.arc(8, 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
