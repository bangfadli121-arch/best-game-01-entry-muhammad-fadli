// Arcade HUD, damage vignette, wave notices, and title and ending overlays.
import { C } from './palette.js';

let previousCombo = 1;
let comboBanner = 0;

function drawDamageVignette(ctx, game) {
  if (game.flash <= 0) return;
  const edge = ctx.createRadialGradient(640, 400, 190, 640, 400, 700);
  edge.addColorStop(0, 'rgba(255, 35, 72, 0)');
  edge.addColorStop(1, `rgba(255, 35, 72, ${Math.min(0.58, game.flash * 0.62)})`);
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 1280, 800);
}

function drawStatus(ctx, game) {
  const player = game.player;
  ctx.fillStyle = 'rgba(6, 10, 31, 0.78)';
  ctx.fillRect(24, 22, 310, 112);
  ctx.fillRect(946, 22, 310, 112);

  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillStyle = C.white;
  ctx.fillText(`SCORE  ${String(game.score.value).padStart(7, '0')}`, 42, 51);
  ctx.fillStyle = C.gold;
  ctx.fillText(`COMBO  ×${game.score.combo.toFixed(1)}`, 42, 81);
  ctx.fillStyle = C.blue;
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText(player.dashCooldown > 0 ? `DASH  ${(player.dashCooldown / 60).toFixed(1)}s` : 'DASH READY', 42, 112);

  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillStyle = C.muted;
  ctx.fillText(`WAVE ${String(game.wave).padStart(2, '0')}   SHARDS ${game.score.waveShards} / ${game.quota}`, 966, 51);
  ctx.fillStyle = '#252d4a';
  ctx.fillRect(966, 70, 244, 15);

  // Critical hull pulses in red; ordinary hull remains clear mint green.
  const pulse = player.hull <= 25 ? 0.68 + 0.32 * (0.5 + 0.5 * Math.sin(performance.now() * 0.012)) : 1;
  ctx.fillStyle = player.hull <= 25 ? `rgba(255, 73, 109, ${pulse})` : '#65edbd';
  ctx.fillRect(966, 70, 244 * player.hull / 100, 15);
  ctx.fillStyle = C.white;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(`HULL ${Math.ceil(player.hull)}%`, 966, 108);

  if (player.overcharge > 0) {
    ctx.fillStyle = C.gold;
    ctx.fillText(`OVERCHARGE ${(player.overcharge / 60).toFixed(1)}s`, 1080, 108);
  }
}

function drawBanners(ctx, game) {
  if (game.score.combo > previousCombo + 0.04) {
    comboBanner = 82;
    previousCombo = game.score.combo;
  }
  comboBanner = Math.max(0, comboBanner - 1);

  if (game.mode === 'wave-clear') {
    ctx.textAlign = 'center';
    ctx.fillStyle = C.gold;
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.fillText('WAVE CLEAR', 640, 168);
    ctx.font = '700 21px system-ui, sans-serif';
    ctx.fillText(`+${game.waveBonus} STARLIGHT BONUS`, 640, 202);
  } else if (game.banner > 0 && game.mode === 'playing') {
    ctx.globalAlpha = Math.min(1, game.banner / 42);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.cyan;
    ctx.font = '900 33px system-ui, sans-serif';
    ctx.fillText(game.wave === 10 ? 'HEART WAVE' : `WAVE ${game.wave}`, 640, 166);
    ctx.globalAlpha = 1;
  }

  if (comboBanner > 0 && game.mode === 'playing') {
    ctx.globalAlpha = Math.min(1, comboBanner / 20);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.gold;
    ctx.font = '800 21px system-ui, sans-serif';
    ctx.fillText(`COMBO ×${game.score.combo.toFixed(1)}!`, 640, 207);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

function drawOverlay(ctx, title, subtitle, details, prompt, gold = false) {
  ctx.fillStyle = 'rgba(5, 7, 24, 0.76)';
  ctx.fillRect(0, 0, 1280, 800);
  const glow = ctx.createRadialGradient(640, 360, 20, 640, 360, 450);
  glow.addColorStop(0, gold ? 'rgba(255, 208, 104, 0.34)' : 'rgba(66, 131, 190, 0.3)');
  glow.addColorStop(1, 'rgba(10, 12, 36, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(150, 0, 980, 800);
  ctx.textAlign = 'center';
  ctx.shadowBlur = 28;
  ctx.shadowColor = gold ? C.gold : '#62dfff';
  ctx.fillStyle = C.white;
  ctx.font = '900 67px system-ui, sans-serif';
  ctx.fillText(title, 640, 294);
  ctx.shadowBlur = 0;
  ctx.fillStyle = gold ? '#ffe8a6' : C.cyan;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText(subtitle, 640, 355);

  ctx.fillStyle = '#d3defc';
  ctx.font = '600 17px system-ui, sans-serif';
  details.forEach((line, index) => ctx.fillText(line, 640, 417 + index * 30));
  ctx.fillStyle = C.gold;
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillText(prompt, 640, 566);
  ctx.textAlign = 'left';
}

// HUD draws after the world so status stays legible and clear of the help strip.
export function drawHud(ctx, game) {
  ctx.save();
  drawDamageVignette(ctx, game);
  drawStatus(ctx, game);
  drawBanners(ctx, game);

  ctx.fillStyle = 'rgba(220, 235, 255, 0.72)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / ARROWS thrust  ·  MOUSE aim + fire  ·  SPACE dash  ·  P pause  ·  M mute', 640, 784);

  if (game.mode === 'title') {
    drawOverlay(ctx, 'LUMEN DRIFT', 'The Shattered Star is breaking. Gather its shards before the void swallows its heart.', [
      'WASD / ARROWS thrust  ·  MOUSE aim and fire  ·  SPACE dash',
      'P pause  ·  M mute',
    ], 'PRESS ENTER OR CLICK TO START');
  }
  if (game.mode === 'paused') {
    drawOverlay(ctx, 'PAUSED', 'The nebula holds its breath.', [], 'PRESS P TO RESUME');
  }
  if (game.mode === 'victory') {
    drawOverlay(ctx, 'STAR REIGNITED', 'THE STAR BURNS BRIGHT AGAIN', [
      `FINAL SCORE ${game.score.value.toLocaleString()}  ·  10 WAVES CLEARED  ·  ${game.score.shards} SHARDS`,
      `HULL ${Math.ceil(game.player.hull)}%`,
    ], 'PRESS R OR CLICK TO RESTART', true);
  }
  if (game.mode === 'defeat') {
    drawOverlay(ctx, 'LOST TO THE VOID', `FINAL SCORE ${game.score.value.toLocaleString()}`, [
      `BEST WAVE ${game.wave}  ·  ${game.score.shards} SHARDS  ·  HULL ${Math.ceil(game.player.hull)}`,
      'The Kestrel’s light fades into the nebula.',
    ], 'PRESS R OR CLICK TO RESTART');
  }
  ctx.restore();
}
