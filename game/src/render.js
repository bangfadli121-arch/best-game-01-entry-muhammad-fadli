// Canvas art systems: nebula clouds, layered stars, combat silhouettes, and light.
import { C } from './palette.js';

const STAR_COUNT = 168;
const CLOUD_COLORS = [
  'rgba(104, 69, 190, 0.22)',
  'rgba(30, 153, 157, 0.17)',
  'rgba(178, 50, 139, 0.16)',
];

function drawBackground(ctx, game, time) {
  const gradient = ctx.createLinearGradient(0, 0, 1280, 800);
  gradient.addColorStop(0, '#080a22');
  gradient.addColorStop(0.48, '#15163d');
  gradient.addColorStop(1, '#080a24');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1280, 800);

  // Three broad clouds drift slowly behind the action.
  for (let i = 0; i < 3; i++) {
    const x = 235 + i * 405 + Math.sin(time * 0.00007 + i * 2) * 90;
    const y = 355 + Math.cos(time * 0.00006 + i * 2.4) * 85;
    const radius = 325 + i * 22;
    const cloud = ctx.createRadialGradient(x, y, 18, x, y, radius);
    cloud.addColorStop(0, CLOUD_COLORS[i]);
    cloud.addColorStop(0.55, CLOUD_COLORS[i].replace(/0\.\d+\)/, '0.07)'));
    cloud.addColorStop(1, 'rgba(20, 24, 60, 0)');
    ctx.fillStyle = cloud;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // Parallax star layers use fixed positions, so screenshots remain reproducible.
  for (let i = 0; i < STAR_COUNT; i++) {
    const layer = i < 112 ? 0 : 1;
    const speed = layer === 0 ? 0.008 : 0.023;
    const size = layer === 0 ? 1 : 2;
    const x = (i * 157.37 + time * speed) % 1280;
    const y = (i * 83.91 + (i % 7) * 17) % 800;
    const alpha = 0.25 + (i % 5) * 0.12;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 9 === 0 ? C.cyan : '#dceaff';
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;

  // The center glow brightens for the reignited-heart scene.
  const center = ctx.createRadialGradient(640, 395, 8, 640, 395, 560);
  if (game.mode === 'victory') {
    center.addColorStop(0, 'rgba(255, 212, 105, 0.65)');
    center.addColorStop(0.42, 'rgba(255, 184, 83, 0.19)');
  } else {
    center.addColorStop(0, 'rgba(91, 124, 198, 0.16)');
    center.addColorStop(0.48, 'rgba(71, 82, 156, 0.06)');
  }
  center.addColorStop(1, 'rgba(8, 10, 36, 0)');
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, 1280, 800);

  if (game.mode === 'defeat') {
    ctx.fillStyle = 'rgba(4, 5, 20, 0.42)';
    ctx.fillRect(0, 0, 1280, 800);
  }
}

function drawShard(ctx, shard, time) {
  const size = shard.heart ? 21 : 12;
  ctx.save();
  ctx.translate(shard.x, shard.y);
  ctx.rotate(shard.angle);
  ctx.shadowBlur = shard.heart ? 35 : 18;
  ctx.shadowColor = shard.heart ? C.gold : C.cyan;
  ctx.fillStyle = shard.heart ? '#fff0a2' : C.cyan;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.58, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.58, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shard.heart ? '#fff9d7' : '#e4ffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Small sparkle rays keep shard silhouettes legible at a glance.
  const sparkle = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.006 + shard.sparkle));
  ctx.globalAlpha = sparkle;
  ctx.strokeStyle = shard.heart ? C.gold : '#d5ffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(shard.x - 17, shard.y - 20);
  ctx.lineTo(shard.x - 12, shard.y - 15);
  ctx.moveTo(shard.x + 15, shard.y + 18);
  ctx.lineTo(shard.x + 20, shard.y + 13);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function enemyColor(enemy) {
  if (enemy.type === 'weaver') return '#b895ff';
  if (enemy.type === 'darter') return '#ff596c';
  if (enemy.type === 'mine') return '#a77a83';
  return '#ff925f';
}

function drawEnemy(ctx, enemy, time) {
  const color = enemyColor(enemy);
  const pulse = enemy.type === 'mine' ? 1 + Math.sin(time * 0.012 / Math.max(0.12, enemy.blink || 0.5)) * 0.12 : 1;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.type === 'darter' ? Math.atan2(enemy.vy, enemy.vx) : enemy.phase * 0.3);
  ctx.shadowBlur = enemy.elite ? 28 : 17;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.strokeStyle = enemy.telegraph > 0 && enemy.telegraph < 32 && Math.floor(time / 55) % 2 ? '#ffffff' : color;
  ctx.lineWidth = enemy.elite ? 3 : 2;
  ctx.beginPath();

  if (enemy.type === 'drifter') {
    ctx.moveTo(0, -16);
    ctx.lineTo(14, -8);
    ctx.lineTo(17, 5);
    ctx.lineTo(7, 15);
    ctx.lineTo(-12, 11);
    ctx.lineTo(-16, -4);
  } else if (enemy.type === 'darter') {
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -13);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 13);
  } else if (enemy.type === 'weaver') {
    ctx.moveTo(0, -19 * pulse);
    ctx.lineTo(17, 0);
    ctx.lineTo(0, 19 * pulse);
    ctx.lineTo(-17, 0);
  } else {
    ctx.arc(0, 0, 13 * pulse, 0, Math.PI * 2);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      ctx.moveTo(Math.cos(angle) * 11, Math.sin(angle) * 11);
      ctx.lineTo(Math.cos(angle) * 19, Math.sin(angle) * 19);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#17152e';
  ctx.beginPath();
  ctx.arc(0, 0, enemy.elite ? 6 : 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (enemy.warning > 0) {
    ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(time * 0.018));
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (enemy.elite || enemy.hp < enemy.maxHp) {
    ctx.fillStyle = '#242442';
    ctx.fillRect(enemy.x - 20, enemy.y - 29, 40, 4);
    ctx.fillStyle = enemy.elite ? C.gold : C.red;
    ctx.fillRect(enemy.x - 20, enemy.y - 29, 40 * enemy.hp / enemy.maxHp, 4);
  }
}

function drawBolt(ctx, bolt, color, width) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < bolt.trail.length; i++) {
    const point = bolt.trail[i];
    ctx.globalAlpha = (i + 1) / (bolt.trail.length + 2) * 0.58;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (i + 1) / bolt.trail.length;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(bolt.x, bolt.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.strokeStyle = '#f4ffff';
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(bolt.x - bolt.vx * 1.6, bolt.y - bolt.vy * 1.6);
  ctx.lineTo(bolt.x, bolt.y);
  ctx.stroke();
  ctx.restore();
}

function drawShip(ctx, player, time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Engine aura and animated thrust flame sit behind the hull.
  const engine = ctx.createRadialGradient(-13, 0, 2, -13, 0, 29);
  engine.addColorStop(0, 'rgba(114, 230, 255, 0.75)');
  engine.addColorStop(1, 'rgba(69, 142, 255, 0)');
  ctx.fillStyle = engine;
  ctx.fillRect(-45, -35, 55, 70);
  if (player.thrusting) {
    const flame = 24 + Math.sin(time * 0.045) * 7;
    ctx.fillStyle = 'rgba(73, 208, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-13, -6);
    ctx.lineTo(-flame, 0);
    ctx.lineTo(-13, 6);
    ctx.closePath();
    ctx.fill();
  }

  // Angular hull facets make the Kestrel read as a sleek salvage craft.
  ctx.shadowBlur = 19;
  ctx.shadowColor = C.blue;
  ctx.fillStyle = player.invulnerable > 0 && Math.floor(player.invulnerable / 3) % 2 ? '#ffffff' : '#d9f7ff';
  ctx.beginPath();
  ctx.moveTo(23, 0);
  ctx.lineTo(-9, -12);
  ctx.lineTo(-15, -9);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-15, 9);
  ctx.lineTo(-9, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#4688b9';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-8, -5);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// All world entities are rendered inside the fixed 1280 by 800 arena.
export function drawWorld(ctx, game, time) {
  ctx.save();
  const shake = game.shake;
  ctx.translate(Math.sin(time * 0.12) * shake, Math.cos(time * 0.15) * shake);
  drawBackground(ctx, game, time);

  for (const shard of game.shards) drawShard(ctx, shard, time);
  for (const enemy of game.enemies) drawEnemy(ctx, enemy, time);

  for (const bolt of game.bolts) drawBolt(ctx, bolt, '#70eaff', 3.5);
  for (const bolt of game.enemyBolts) {
    drawBolt(ctx, bolt, '#ff805e', 5);
    const pulse = 6 + Math.sin(time * 0.02 + bolt.x) * 1.5;
    ctx.fillStyle = '#ffb07a';
    ctx.shadowBlur = 17;
    ctx.shadowColor = '#ff754f';
    ctx.beginPath();
    ctx.arc(bolt.x, bolt.y, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const pickup of game.pickups) {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.rotate(pickup.angle);
    ctx.shadowBlur = 20;
    ctx.shadowColor = pickup.type === 'cell' ? '#6dffc2' : C.gold;
    ctx.strokeStyle = pickup.type === 'cell' ? '#6dffc2' : C.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();
  }

  for (const particle of game.particles) {
    ctx.globalAlpha = Math.min(1, particle.life / 18);
    ctx.fillStyle = particle.color || C.gold;
    ctx.shadowBlur = 9;
    ctx.shadowColor = particle.color || C.gold;
    ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  drawShip(ctx, game.player, time);

  for (const label of game.texts) {
    ctx.globalAlpha = Math.min(1, label.life / 20);
    ctx.fillStyle = C.gold;
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label.text, label.x, label.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  // A restrained edge vignette frames the play area without hiding it.
  const vignette = ctx.createRadialGradient(640, 400, 290, 640, 400, 730);
  vignette.addColorStop(0, 'rgba(0, 0, 8, 0)');
  vignette.addColorStop(1, 'rgba(1, 2, 14, 0.46)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1280, 800);
  ctx.restore();
}
