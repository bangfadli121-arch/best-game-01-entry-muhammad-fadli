// Edge director and distinct Drifter, Darter, Weaver, and Mine brains.
import { TAU } from './utils.js';

const RADII = { drifter: 16, darter: 15, weaver: 19, mine: 14 };

export function spawnEnemyAt(list, type, x, y, random, elite = false) {
  const enemy = {
    type, x, y, vx: 0, vy: 0, hp: elite ? 10 : type === 'weaver' ? 4 : type === 'mine' ? 1 : 2,
    maxHp: elite ? 10 : type === 'weaver' ? 4 : type === 'mine' ? 1 : 2,
    phase: random() * TAU, age: 0, warning: 42, shotTimer: 110,
    telegraph: 0, charge: 0, aimX: 0, aimY: 0, elite,
  };
  list.push(enemy);
  return enemy;
}

// Enemies spawn on an edge outside a 260-pixel safety radius with a visible warning.
export function spawnEnemy(list, type, player, random, speedScale = 1, elite = false) {
  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 20; attempt++) {
    const angle = random() * TAU;
    const side = Math.floor(random() * 4);
    x = side === 0 ? 32 : side === 1 ? 1248 : 80 + random() * 1120;
    y = side === 2 ? 32 : side === 3 ? 768 : 80 + random() * 640;
    const dx = x - player.x;
    const dy = y - player.y;
    if (dx * dx + dy * dy > 260 * 260) break;
  }
  const safetyX = x - player.x;
  const safetyY = y - player.y;
  if (safetyX * safetyX + safetyY * safetyY <= 260 * 260) {
    x = Math.max(32, Math.min(1248, 1280 - player.x));
    y = Math.max(32, Math.min(768, 800 - player.y));
  }
  const enemy = spawnEnemyAt(list, type, x, y, random, elite);
  enemy.speedScale = speedScale;
  return enemy;
}

// AI movement and ranged attacks; collision and explosions are resolved by sim.js.
export function updateEnemies(enemies, player, dt, enemyBolts, random) {
  for (const enemy of enemies) {
    enemy.age += dt;
    enemy.phase += 0.035 * dt;
    enemy.warning = Math.max(0, enemy.warning - dt);
    enemy.shotTimer -= dt;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const scale = enemy.speedScale || 1;

    if (enemy.type === 'drifter') {
      enemy.vx += (nx * 1.05 * scale - enemy.vx) * 0.025 * dt;
      enemy.vy += (ny * 1.05 * scale - enemy.vy) * 0.025 * dt;
    }

    if (enemy.type === 'darter') {
      if (enemy.telegraph > 0) {
        enemy.telegraph -= dt;
        enemy.vx *= 0.94;
        enemy.vy *= 0.94;
        if (enemy.telegraph <= 0) {
          enemy.charge = 36;
          enemy.vx = enemy.aimX * 6.2 * scale;
          enemy.vy = enemy.aimY * 6.2 * scale;
        }
      } else if (enemy.charge > 0) {
        enemy.charge -= dt;
        if (enemy.charge <= 0) enemy.telegraph = 75 + random() * 45;
      } else {
        enemy.vx += (nx * 1.1 * scale - enemy.vx) * 0.018 * dt;
        enemy.vy += (ny * 1.1 * scale - enemy.vy) * 0.018 * dt;
        enemy.telegraph = 75 + random() * 45;
      }
      if (enemy.telegraph > 0 && enemy.telegraph <= 30) {
        enemy.aimX = nx;
        enemy.aimY = ny;
      }
    }

    if (enemy.type === 'weaver') {
      const radial = distance < 290 ? -1 : distance > 370 ? 1 : 0;
      const strafe = Math.sin(enemy.phase) * 0.72;
      enemy.vx += ((nx * radial - ny * strafe) * 1.45 * scale - enemy.vx) * 0.035 * dt;
      enemy.vy += ((ny * radial + nx * strafe) * 1.45 * scale - enemy.vy) * 0.035 * dt;

      if (enemy.shotTimer <= 0 && distance < 560) {
        const spread = enemy.elite ? [-0.19, 0, 0.19] : [0];
        for (const offset of spread) {
          const angle = Math.atan2(dy, dx) + offset;
          enemyBolts.push({
            x: enemy.x, y: enemy.y,
            vx: Math.cos(angle) * (enemy.elite ? 2.35 : 2.1),
            vy: Math.sin(angle) * (enemy.elite ? 2.35 : 2.1),
            life: 250, trail: [],
          });
        }
        enemy.shotTimer = enemy.elite ? 145 : 150;
      }
    }

    if (enemy.type === 'mine') {
      enemy.vx += (Math.sin(enemy.phase) * 0.25 - enemy.vx) * 0.012 * dt;
      enemy.vy += (Math.cos(enemy.phase * 0.8) * 0.25 - enemy.vy) * 0.012 * dt;
      enemy.blink = distance < 230 ? 0.15 + (230 - distance) / 120 : 0.65;
    }

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.x = Math.max(35, Math.min(1245, enemy.x));
    enemy.y = Math.max(35, Math.min(765, enemy.y));
  }
}

export function enemyRadius(enemy) {
  return RADII[enemy.type] || 16;
}
