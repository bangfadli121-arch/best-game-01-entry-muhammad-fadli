import { colors } from './palette.js';
import { clamp, length, normalize, rounded } from './utils.js';

export function makePlayer() {
  return { x: 485, y: 410, vx: 0, vy: 0, radius: 29, faceX: 1, faceY: 0, dash: 0, dashMax: 2.5, dashTime: 0, falling: false, fallTime: 0, angle: 0, weight: 1, shovePower: 1, speedCap: 260, friction: 0.91, upgrades: {} };
}

// Scrap upgrade levels and derived movement stats.
export function applyUpgrade(player, upgrade) {
  player.upgrades[upgrade] = (player.upgrades[upgrade] || 0) + 1;
  const levels = player.upgrades;
  player.weight = 1 * (1 + (levels['HEAVY PLATING'] || 0) * 0.25);
  player.shovePower = (1 + (levels['HEAVY PLATING'] || 0) * 0.1) * Math.pow(1.3, levels['SPIKE BUMPER'] || 0);
  player.dashMax = Math.max(1.1, 2.5 - (levels['LONG DASH'] || 0) * 0.7);
  player.dashBurst = 540 * Math.pow(1.4, levels['LONG DASH'] || 0);
  player.speedCap = 260 * Math.pow(1.2, levels['SWIFT TREADS'] || 0);
  player.friction = Math.max(0.75, 0.91 - (levels['GRIP TIRES'] || 0) * 0.035);
}

// Momentum and dash movement.
export function updatePlayer(player, input, dt, audio) {
  player.dash = Math.max(0, player.dash - dt);
  player.dashTime = Math.max(0, player.dashTime - dt);
  if (player.falling) {
    player.fallTime += dt;
    player.angle += dt * 9;
    player.vy += 260 * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    return;
  }
  let mx = input.x;
  let my = input.y;
  if (mx || my) {
    const move = normalize(mx, my);
    mx = move.x;
    my = move.y;
    player.faceX = mx;
    player.faceY = my;
    player.vx += mx * 520 * dt;
    player.vy += my * 520 * dt;
  }
  if (input.dash && player.dash <= 0) {
    const dir = length(player.vx, player.vy) > 20 ? normalize(player.vx, player.vy) : { x: player.faceX, y: player.faceY };
    const burst = player.dashBurst || 540;
    player.vx += dir.x * burst;
    player.vy += dir.y * burst;
    player.dash = player.dashMax;
    player.dashTime = 0.24;
    audio.play('dash');
  }
  const drag = Math.pow(player.friction, dt * 60);
  player.vx *= drag;
  player.vy *= drag;
  const speed = length(player.vx, player.vy);
  if (speed > player.speedCap) {
    player.vx = (player.vx / speed) * player.speedCap;
    player.vy = (player.vy / speed) * player.speedCap;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
}

export function startFall(bot) {
  bot.falling = true;
  bot.fallTime = 0;
  bot.vx *= 1.1;
  bot.vy *= 1.1;
}

// Player bot drawing.
export function drawPlayer(ctx, player, time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.falling ? player.angle : Math.atan2(player.vy, player.vx) * 0.05);
  const bob = player.falling ? 0 : Math.sin(time * 9) * 2;
  ctx.translate(0, bob);
  ctx.fillStyle = '#243d53';
  rounded(ctx, -31, 17, 26, 20, 8);
  ctx.fill();
  rounded(ctx, 5, 17, 26, 20, 8);
  ctx.fill();
  ctx.fillStyle = '#63b9d7';
  rounded(ctx, -27, 20, 18, 10, 4);
  ctx.fill();
  rounded(ctx, 9, 20, 18, 10, 4);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-25, -3);
  ctx.lineTo(-41, 9);
  ctx.moveTo(25, -3);
  ctx.lineTo(41, 9);
  ctx.stroke();
  ctx.fillStyle = colors.player;
  rounded(ctx, -29, -29, 58, 52, 13);
  ctx.fill();
  ctx.strokeStyle = '#2a528e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = colors.playerTrim;
  rounded(ctx, -22, -21, 44, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#fff8d9';
  ctx.beginPath();
  ctx.arc(-11, -5, 7, 0, Math.PI * 2);
  ctx.arc(11, -5, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(-9, -4, 3, 0, Math.PI * 2);
  ctx.arc(13, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -29);
  ctx.lineTo(0, -43);
  ctx.stroke();
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(0, -47, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
