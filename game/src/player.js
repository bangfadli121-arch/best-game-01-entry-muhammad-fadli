// Kestrel acceleration, drift, aiming, dash invulnerability, and lance fire.
import { clamp } from './utils.js';
import { sound } from './audio.js';

export function makePlayer() {
  return {
    x: 640, y: 400, vx: 0, vy: 0, angle: 0,
    hull: 100, dashCooldown: 0, invulnerable: 0,
    fireCooldown: 0, overcharge: 0, thrusting: false,
  };
}

// Damage is ignored during the brief post-hit and dash invulnerability windows.
export function damagePlayer(player, amount) {
  if (player.invulnerable > 0) return false;
  player.hull = Math.max(0, player.hull - amount);
  player.invulnerable = 48;
  return true;
}

// Movement keeps inertia; thrust changes velocity rather than teleporting the ship.
export function updatePlayer(player, input, dt, bolts) {
  const keys = input.keys;
  const horizontal = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  const vertical = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  player.thrusting = horizontal !== 0 || vertical !== 0;

  if (player.thrusting) {
    const length = Math.hypot(horizontal, vertical) || 1;
    player.vx += horizontal / length * 0.22 * dt;
    player.vy += vertical / length * 0.22 * dt;
  }

  player.vx *= Math.pow(0.993, dt);
  player.vy *= Math.pow(0.993, dt);
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > 5.2) {
    player.vx = player.vx / speed * 5.2;
    player.vy = player.vy / speed * 5.2;
  }

  // Dash follows current drift, falling back to the direction the ship faces.
  if (keys[' '] && player.dashCooldown <= 0) {
    let direction = Math.atan2(player.vy, player.vx);
    if (Math.hypot(player.vx, player.vy) < 0.3) direction = player.angle;
    player.vx += Math.cos(direction) * 8.5;
    player.vy += Math.sin(direction) * 8.5;
    player.dashCooldown = 180;
    player.invulnerable = Math.max(player.invulnerable, 16);
    keys[' '] = false;
    sound('dash');
  }

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.overcharge = Math.max(0, player.overcharge - dt);
  player.x = clamp(player.x + player.vx * dt, 42, 1238);
  player.y = clamp(player.y + player.vy * dt, 42, 758);
  player.angle = Math.atan2(input.mouse.y - player.y, input.mouse.x - player.x);

  // A lance fires six times a second, or twelve times under overcharge.
  player.fireCooldown -= dt;
  if (input.mouse.down && player.fireCooldown <= 0) {
    const speed = 13;
    bolts.push({
      x: player.x + Math.cos(player.angle) * 22,
      y: player.y + Math.sin(player.angle) * 22,
      vx: Math.cos(player.angle) * speed + player.vx * 0.35,
      vy: Math.sin(player.angle) * speed + player.vy * 0.35,
      life: 58,
      trail: [],
    });
    player.fireCooldown = player.overcharge > 0 ? 5 : 10;
    sound('shot');
  }
}
