// Complete state machine, seeded demo scenes, wave director, and combat loop.
import { damagePlayer, makePlayer, updatePlayer } from './player.js';
import { enemyRadius, spawnEnemy, spawnEnemyAt, updateEnemies } from './enemies.js';
import { collectPickups, makeShard, spawnShardField } from './shards.js';
import { dist2, rng } from './utils.js';
import { sound, toggleMute } from './audio.js';

const WAVE_QUOTA = [5, 5, 6, 6, 6, 7, 7, 7, 8, 8];
const WAVE_MIX = [
  ['drifter'],
  ['drifter', 'darter'],
  ['drifter', 'darter', 'weaver'],
  ['drifter', 'darter', 'weaver', 'mine'],
];

function newScore(shot) {
  return {
    value: shot === 'win' ? 24680 : shot === 'lose' ? 7280 : 0,
    combo: shot === 'play' ? 1.8 : 1,
    comboIdle: 0,
    shards: shot === 'win' ? 35 : shot === 'lose' ? 18 : 0,
    waveShards: 0,
    heart: false,
  };
}

function addParticles(game, x, y, color, count = 18) {
  for (let i = 0; i < count; i++) {
    const angle = game.random() * Math.PI * 2;
    const speed = 1.2 + game.random() * 4;
    game.particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 32 + game.random() * 28, color,
    });
  }
}

function makeGame(seed, shot) {
  const random = rng(seed);
  const demo = ['start', 'play', 'win', 'lose'].includes(shot);
  const wave = shot === 'play' ? 3 : shot === 'win' ? 10 : shot === 'lose' ? 5 : 1;
  const quota = WAVE_QUOTA[wave - 1];
  const game = {
    mode: shot === 'start' ? 'title' : shot === 'win' ? 'victory' : shot === 'lose' ? 'defeat' : 'playing',
    player: makePlayer(), enemies: [], shards: [], pickups: [], bolts: [], enemyBolts: [],
    particles: [], texts: [], score: newScore(shot), wave, quota,
    cleared: shot === 'win' ? 10 : shot === 'lose' ? 4 : 0,
    banner: 145, waveClearTimer: 0, waveBonus: 0, shake: 0, flash: 0,
    random, elapsed: 0, spawnTimer: 0, spawnCount: 0, muted: false,
    demo, demoShot: shot, demoBoltTimer: 0,
  };

  if (shot === 'start') {
    game.player.x = 640;
    game.player.y = 640;
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      game.shards.push(makeShard(640 + Math.cos(angle) * 112, 640 + Math.sin(angle) * 38, random));
    }
    spawnEnemyAt(game.enemies, 'drifter', 980, 380, random);
    game.enemies[0].warning = 0;
  }

  if (shot === 'play') {
    game.score.waveShards = 2;
    game.score.shards = 2;
    game.score.value = Math.round((2 * 100 + 90) * game.score.combo);
    game.banner = 110;
    spawnShardField(game, 8);
    spawnEnemyAt(game.enemies, 'drifter', 420, 285, random);
    spawnEnemyAt(game.enemies, 'drifter', 865, 505, random);
    const darter = spawnEnemyAt(game.enemies, 'darter', 835, 286, random);
    darter.telegraph = 22;
    darter.aimX = -0.8;
    darter.aimY = 0.6;
    spawnEnemyAt(game.enemies, 'weaver', 1010, 400, random);
    for (let i = 0; i < 4; i++) {
      game.bolts.push({
        x: 580 + i * 38, y: 400 - i * 20, vx: 10, vy: -2.4,
        life: 45, trail: [],
      });
    }
    addParticles(game, 900, 300, '#ff875e', 20);
    game.particles.push({ x: 880, y: 330, vx: 0, vy: 0, life: 45, color: '#fff0b0' });
  }

  if (shot === 'win') {
    game.score.waveShards = quota;
    game.player.hull = 100;
    game.player.x = 640;
    game.player.y = 520;
    game.player.angle = -Math.PI / 2;
  }

  if (shot === 'lose') {
    game.score.waveShards = 3;
    game.player.hull = 0;
    game.player.x = 640;
    game.player.y = 520;
    for (let i = 0; i < 18; i++) {
      const x = 170 + random() * 940;
      const y = 140 + random() * 470;
      game.particles.push({ x, y, vx: (random() - 0.5) * 0.7, vy: -0.25 - random() * 0.5, life: 100, color: '#ff704d' });
    }
  }

  return game;
}

export function createGame(seed = 1, shot = '') {
  return makeGame(seed, shot);
}

function typeForWave(game) {
  const mix = WAVE_MIX[Math.min(3, Math.floor((game.wave - 1) / 2))];
  return mix[Math.floor(game.random() * mix.length)];
}

// Each wave begins with enough quota shards and one scheduled support pickup.
function beginWave(game, wave) {
  game.wave = wave;
  game.quota = WAVE_QUOTA[wave - 1];
  game.score.waveShards = 0;
  game.mode = 'playing';
  game.banner = 150;
  game.spawnCount = 0;
  game.spawnTimer = 30;
  game.waveClearTimer = 0;
  game.waveBonus = 0;
  spawnShardField(game, game.quota);
  game.pickups.push({ x: 150 + game.random() * 980, y: 150 + game.random() * 500, type: 'cell', angle: 0 });

  if (wave % 2 === 0) {
    game.pickups.push({ x: 150 + game.random() * 980, y: 150 + game.random() * 500, type: 'over', angle: 0 });
  }

  if (wave === 10) {
    const guardian = spawnEnemy(game.enemies, 'weaver', game.player, game.random, 1.25, true);
    guardian.hp = guardian.maxHp = 10;
    game.shards.push(makeShard(640, 170, game.random, true));
    for (const type of ['drifter', 'drifter', 'darter', 'weaver', 'mine']) {
      spawnEnemy(game.enemies, type, game.player, game.random, 1.5);
    }
  }

  sound('horn');
}

// Kills score, advance combo, drop support, and produce a readable particle burst.
function killEnemy(game, enemy, reward = true) {
  const index = game.enemies.indexOf(enemy);
  if (index < 0) return;
  game.enemies.splice(index, 1);
  const points = Math.round(90 * game.score.combo);
  if (reward) {
    game.score.value += points;
    if (game.score.comboIdle <= 180) game.score.combo = Math.min(5, game.score.combo + 0.2);
    game.score.comboIdle = 0;
    game.texts.push({ x: enemy.x, y: enemy.y, text: `+${points}`, life: 78 });
  }
  addParticles(game, enemy.x, enemy.y, enemy.type === 'weaver' ? '#bb91ff' : '#ff865d', 20);
  if (game.random() < 0.14) {
    game.pickups.push({ x: enemy.x, y: enemy.y, type: 'cell', angle: 0 });
  }
  sound('kill');
}

function explodeMine(game, mine) {
  const index = game.enemies.indexOf(mine);
  if (index < 0) return;
  game.enemies.splice(index, 1);
  addParticles(game, mine.x, mine.y, '#ff765e', 24);
  game.shake = Math.max(game.shake, 8);
  sound('boom');

  const playerDistance = Math.sqrt(dist2(mine, game.player));
  if (playerDistance < 155 && damagePlayer(game.player, 30 * (1 - playerDistance / 190))) {
    game.flash = 1;
    game.shake = 13;
  }

  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const enemy = game.enemies[i];
    const distance = Math.sqrt(dist2(mine, enemy));
    if (distance < 145) {
      enemy.hp -= Math.max(1, 3 - distance / 60);
      if (enemy.hp <= 0) killEnemy(game, enemy);
    }
  }
}

// Contact damage uses per-enemy damage values and a separating knockback impulse.
function collidePlayerEnemies(game) {
  const player = game.player;
  for (const enemy of game.enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (enemy.type === 'mine' && distance < 70) {
      explodeMine(game, enemy);
      continue;
    }
    const radius = enemyRadius(enemy) + 15;
    if (distance >= radius) continue;

    const damage = enemy.type === 'darter' && enemy.charge > 0 ? 18 : enemy.type === 'drifter' ? 12 : 10;
    if (!damagePlayer(player, damage)) continue;
    player.vx += dx / distance * 5;
    player.vy += dy / distance * 5;
    enemy.vx -= dx / distance * 2;
    enemy.vy -= dy / distance * 2;
    game.flash = 1;
    game.shake = 11;
  }
}

// Bolts travel through the scene, leave trails, and resolve enemy health.
function updateBolts(game, dt) {
  for (let i = game.bolts.length - 1; i >= 0; i--) {
    const bolt = game.bolts[i];
    bolt.trail.push({ x: bolt.x, y: bolt.y });
    if (bolt.trail.length > 5) bolt.trail.shift();
    bolt.x += bolt.vx * dt;
    bolt.y += bolt.vy * dt;
    bolt.life -= dt;
    let consumed = false;

    for (const enemy of [...game.enemies]) {
      const radius = enemyRadius(enemy) + 5;
      if (dist2(bolt, enemy) > radius * radius) continue;
      enemy.hp--;
      consumed = true;
      if (enemy.hp <= 0) {
        if (enemy.type === 'mine') explodeMine(game, enemy);
        else killEnemy(game, enemy);
      }
      break;
    }

    if (consumed || bolt.life <= 0 || bolt.x < 0 || bolt.x > 1280 || bolt.y < 0 || bolt.y > 800) {
      game.bolts.splice(i, 1);
    }
  }
}

// Enemy orbs and mine blasts can damage the ship, with invulnerability preventing repeats.
function updateEnemyBolts(game, dt) {
  for (let i = game.enemyBolts.length - 1; i >= 0; i--) {
    const bolt = game.enemyBolts[i];
    bolt.trail.push({ x: bolt.x, y: bolt.y });
    if (bolt.trail.length > 6) bolt.trail.shift();
    bolt.x += bolt.vx * dt;
    bolt.y += bolt.vy * dt;
    bolt.life -= dt;

    if (dist2(bolt, game.player) < 24 * 24) {
      if (damagePlayer(game.player, 10)) {
        game.flash = 0.8;
        game.shake = 7;
      }
      game.enemyBolts.splice(i, 1);
    } else if (bolt.life <= 0 || bolt.x < 0 || bolt.x > 1280 || bolt.y < 0 || bolt.y > 800) {
      game.enemyBolts.splice(i, 1);
    }
  }
}

// A surviving wave always replaces missing quota shards and escalates the spawn rate.
function updateDirector(game, dt) {
  if (game.waveClearTimer > 0) {
    game.waveClearTimer -= dt;
    if (game.waveClearTimer <= 0 && game.wave < 10) beginWave(game, game.wave + 1);
    return;
  }

  const remaining = game.quota - game.score.waveShards;
  while (game.shards.length < remaining) {
    game.shards.push(makeShard(100 + game.random() * 1080, 100 + game.random() * 600, game.random));
  }

  if (game.wave >= 10) return;
  game.spawnTimer -= dt;
  const interval = Math.max(44, 180 - game.wave * 12);
  const limit = 3 + game.wave * 2;
  if (game.spawnTimer <= 0 && game.enemies.length < limit && game.spawnCount < limit + 2) {
    const speedScale = 0.85 + game.wave * 0.075;
    spawnEnemy(game.enemies, typeForWave(game), game.player, game.random, speedScale);
    game.spawnCount++;
    game.spawnTimer = interval;
  }
}

// Screenshot scenes keep their defining action visible while still moving gently.
function updateDemoScene(game, dt) {
  if (game.demoShot === 'start') {
    for (const shard of game.shards) {
      shard.angle += 0.012 * dt;
      shard.x += Math.sin(game.elapsed * 0.012 + shard.sparkle) * 0.18 * dt;
      shard.y += Math.cos(game.elapsed * 0.01 + shard.sparkle) * 0.14 * dt;
    }
  }

  if (game.demoShot === 'lose') {
    for (const ember of game.particles) {
      ember.x += ember.vx * dt;
      ember.y += ember.vy * dt;
      if (ember.y < 100) ember.y = 680;
    }
  }

  if (game.demoShot === 'play') {
    updateEnemies(game.enemies, game.player, dt, game.enemyBolts, game.random);
    for (const bolt of game.bolts) {
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;
    }
    for (let i = game.bolts.length - 1; i >= 0; i--) {
      if (game.bolts[i].life <= 0 || game.bolts[i].x > 1220 || game.bolts[i].y < 80) {
        game.bolts.splice(i, 1);
      }
    }
    game.demoBoltTimer -= dt;
    if (game.bolts.length < 3 && game.demoBoltTimer <= 0) {
      game.bolts.push({
        x: 570, y: 410 + game.random() * 80, vx: 11, vy: -3.2,
        life: 55, trail: [],
      });
      game.demoBoltTimer = 7;
    }
    for (const particle of game.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) {
        particle.x = 890 + game.random() * 28;
        particle.y = 300 + game.random() * 28;
        particle.life = 35 + game.random() * 25;
      }
    }
  }
}

// Fixed-step frame updates move every system and transition between game states.
export function step(game, input, dt = 1) {
  game.elapsed += dt;
  const click = input.consumeClick();

  if (input.keys.m) {
    input.keys.m = false;
    game.muted = toggleMute();
  }

  if (game.demo && ['start', 'play', 'lose'].includes(game.demoShot)) {
    updateDemoScene(game, dt);
  }
  if (game.demo && game.demoShot === 'play') return;

  if (game.mode === 'victory' || game.mode === 'defeat') {
    if (click || input.keys.r) {
      input.keys.r = false;
      Object.assign(game, makeGame((game.elapsed | 0) + 1, ''));
    }
    return;
  }

  if (game.mode === 'title') {
    if (input.keys.enter || click) {
      input.keys.enter = false;
      game.mode = 'playing';
      beginWave(game, 1);
    }
    return;
  }

  if (input.keys.p) {
    input.keys.p = false;
    game.mode = game.mode === 'paused' ? 'playing' : game.mode === 'playing' ? 'paused' : game.mode;
  }
  if (game.mode === 'paused') return;

  if (game.mode === 'wave-clear') {
    game.waveClearTimer -= dt;
    if (game.waveClearTimer <= 0) {
      if (game.wave >= 10) {
        game.mode = 'playing';
        game.banner = 180;
      } else {
        beginWave(game, game.wave + 1);
      }
    }
    return;
  }

  updatePlayer(game.player, input, dt, game.bolts);
  updateEnemies(game.enemies, game.player, dt, game.enemyBolts, game.random);
  collidePlayerEnemies(game);
  updateBolts(game, dt);
  updateEnemyBolts(game, dt);
  collectPickups(game, dt);

  for (let i = game.particles.length - 1; i >= 0; i--) {
    const particle = game.particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.life -= dt;
    if (particle.life <= 0) game.particles.splice(i, 1);
  }

  game.banner = Math.max(0, game.banner - dt);
  game.flash = Math.max(0, game.flash - 0.025 * dt);
  game.shake = Math.max(0, game.shake - 0.3 * dt);
  updateDirector(game, dt);

  if (game.score.waveShards >= game.quota && game.mode === 'playing' && !(game.wave === 10 && game.cleared >= 10)) {
    game.waveBonus = 500 * game.wave;
    game.score.value += game.waveBonus;
    game.cleared = game.wave;
    game.mode = 'wave-clear';
    game.waveClearTimer = 105;
    game.banner = 105;
    sound('horn');
  }

  if (game.player.hull <= 0) {
    game.mode = 'defeat';
    game.player.hull = 0;
    sound('lose');
  }
}
