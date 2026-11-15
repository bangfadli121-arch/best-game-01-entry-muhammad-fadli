// Seeded shard, support pickup, combo, and score-label systems.
import { dist2 } from './utils.js';
import { sound } from './audio.js';

export function makeShard(x, y, random, heart = false) {
  return {
    x, y, vx: (random() - 0.5) * 0.55, vy: (random() - 0.5) * 0.55,
    angle: random() * Math.PI * 2, heart, sparkle: random() * 30,
  };
}

export function spawnShardField(game, amount) {
  for (let i = 0; i < amount; i++) {
    game.shards.push(makeShard(110 + game.random() * 1060, 100 + game.random() * 600, game.random));
  }
}

function addPickupBurst(game, x, y, color) {
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI * 2 / 16;
    const speed = 1.4 + game.random() * 3.1;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 36, color });
  }
}

function scoreText(game, x, y, text) {
  game.texts.push({ x, y, text, life: 78 });
}

function raiseCombo(game) {
  const score = game.score;
  if (score.comboIdle <= 180) score.combo = Math.min(5, score.combo + 0.25);
  score.comboIdle = 0;
}

// Collect shard and support pickups with circular collision and visible feedback.
export function collectPickups(game, dt) {
  const player = game.player;
  const score = game.score;
  score.comboIdle += dt;

  for (let index = game.shards.length - 1; index >= 0; index--) {
    const shard = game.shards[index];
    shard.angle += 0.035 * dt;
    shard.sparkle += dt;
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    shard.vx *= 0.997;
    shard.vy *= 0.997;

    if (dist2(shard, player) > 27 * 27) continue;
    game.shards.splice(index, 1);
    raiseCombo(game);
    score.shards++;
    score.waveShards++;
    const points = Math.round((shard.heart ? 500 : 100) * score.combo);
    score.value += points;
    scoreText(game, shard.x, shard.y, `+${points}`);
    addPickupBurst(game, shard.x, shard.y, shard.heart ? '#ffd579' : '#8df5ff');
    sound('pickup', score.combo);
    if (shard.heart) {
      score.heart = true;
      game.mode = 'victory';
      sound('win');
    }
  }

  for (let index = game.pickups.length - 1; index >= 0; index--) {
    const pickup = game.pickups[index];
    pickup.angle += 0.04 * dt;
    if (dist2(pickup, player) > 31 * 31) continue;
    game.pickups.splice(index, 1);

    if (pickup.type === 'cell') {
      player.hull = Math.min(100, player.hull + 25);
      scoreText(game, pickup.x, pickup.y, '+25 HULL');
      addPickupBurst(game, pickup.x, pickup.y, '#72ffc5');
      sound('shield');
    } else {
      player.overcharge = 480;
      scoreText(game, pickup.x, pickup.y, 'OVERCHARGE');
      addPickupBurst(game, pickup.x, pickup.y, '#ffd579');
      sound('pickup', 3);
    }
  }

  if (score.comboIdle > 180) {
    score.combo = Math.max(1, score.combo - 0.006 * dt);
  }

  for (let index = game.texts.length - 1; index >= 0; index--) {
    const label = game.texts[index];
    label.y -= 0.42 * dt;
    label.life -= dt;
    if (label.life <= 0) game.texts.splice(index, 1);
  }
}
