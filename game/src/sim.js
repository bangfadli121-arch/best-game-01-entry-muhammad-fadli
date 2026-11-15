import { arena, getArena, makeSpectators, updateSpectators } from './arena.js';
import { makeBot, updateBot } from './bots.js';
import { makeEffects, confettiBurst, sparkBurst, updateEffects } from './particles.js';
import { applyUpgrade, makePlayer, updatePlayer } from './player.js';
import { checkRingOut, resolveBots, resolveBossSlam, resolvePistonPulse } from './physics.js';
import { clamp, distance, mulberry32 } from './utils.js';

export function makeGame(seed = 1, shot = '') {
  const random = mulberry32(seed);
  const player = makePlayer();
  const bot = makeBot(1);
  const game = {
    state: 'title',
    player,
    bot,
    round: 1,
    time: 45,
    score: 0,
    playerWins: 0,
    botWins: 0,
    roundBanner: 0,
    roundWinner: '',
    roundBannerText: '',
    results: [],
    upgradesTaken: [],
    draftOffers: [],
    piston: { clock: 0, phase: 'rest' },
    hitStop: 0,
    elapsed: 0,
    spectators: makeSpectators(random, 16),
    effects: makeEffects(random),
    shot,
    seed,
    muted: false
  };
  if (shot) prepareDemo(game, shot);
  return game;
}

// Round construction and scoring.
function startRound(game, round) {
  game.round = round;
  game.time = 45;
  game.roundBanner = 1.25;
  game.roundBannerText = round === 2 ? 'THE RING SHRINKS' : round === 3 ? 'SCRAP KING ENTERS THE YARD' : `ROUND ${round}`;
  game.roundWinner = '';
  game.player = makePlayer();
  game.player.x = 470;
  game.player.y = 414;
  for (const upgrade of game.upgradesTaken) {
    applyUpgrade(game.player, upgrade);
  }
  game.bot = makeBot(round, Math.floor((round - 1) / 3));
  game.bot.x = 810;
  game.bot.y = 414;
  game.piston = { clock: 0, phase: 'rest' };
  game.state = 'playing';
}

function finishRound(game, winner, knockout, audio) {
  if (game.state !== 'playing') {
    return;
  }
  game.roundWinner = winner;
  game.state = 'roundEnd';
  game.roundBanner = 1.7;
  const duration = Math.round(45 - game.time);
  const koBonus = winner === 'player' && knockout ? 1000 : 0;
  const timeBonus = winner !== 'player' ? 0 : knockout ? Math.floor(game.time) * 20 : 500;
  game.results.push({ round: game.round, winner, knockout, koBonus, timeBonus, duration });
  if (winner === 'player') {
    game.playerWins += 1;
    game.score += koBonus + timeBonus;
  } else {
    game.botWins += 1;
  }
  if (game.playerWins >= 2) {
    game.state = 'victory';
    confettiBurst(game.effects);
    audio.play('win');
  } else if (game.botWins >= 2) {
    game.state = 'defeat';
    audio.play('lose');
  } else if (winner === 'player') {
    game.state = 'draft';
    game.draftOffers = chooseUpgrades(game.effects.random);
  }
  if (knockout) {
    const knocked = winner === 'player' ? game.bot : game.player;
    game.effects.spark(knocked.x, knocked.y, knocked.vx, knocked.vy);
    game.effects.koText(knocked.x, knocked.y - knocked.radius - 18);
    game.effects.flash = 0.45;
    game.effects.knockout = 0.38;
    game.effects.shake = 20;
    game.hitStop = 0.09;
    for (const fan of game.spectators) {
      fan.jump = 1;
    }
  }
}

const upgradeNames = ['HEAVY PLATING', 'LONG DASH', 'SPIKE BUMPER', 'SWIFT TREADS', 'GRIP TIRES'];

function chooseUpgrades(random) {
  const options = [...upgradeNames];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [options[index], options[swap]] = [options[swap], options[index]];
  }
  return options.slice(0, 3);
}

export function selectDraft(game, index) {
  if (game.state !== 'draft' || !game.draftOffers[index]) {
    return false;
  }
  const upgrade = game.draftOffers[index];
  applyUpgrade(game.player, upgrade);
  game.upgradesTaken.push(upgrade);
  game.draftOffers = [];
  startRound(game, game.round + 1);
  return true;
}

function updatePiston(game, dt, audio) {
  if (game.round < 3) {
    return;
  }
  game.piston.clock = (game.piston.clock + dt) % 4;
  const phase = game.piston.clock >= 3.9 ? 'push' : game.piston.clock >= 3.4 ? 'warn' : 'rest';
  if (phase === 'push' && game.piston.phase !== 'push') {
    resolvePistonPulse(game.player, game.bot, game.effects, audio);
  }
  game.piston.phase = phase;
}

export function restartGame(game) {
  const fresh = makeGame(game.seed);
  Object.assign(game, fresh);
}

export function startGame(game, audio) {
  if (game.state === 'title') {
    startRound(game, 1);
    audio.play('horn');
  } else if (game.state === 'roundEnd') {
    startRound(game, game.round + 1);
    audio.play('horn');
  }
}

export function updateGame(game, input, dt, audio) {
  if (game.hitStop > 0) {
    game.hitStop = Math.max(0, game.hitStop - dt);
    updateEffects(game.effects, dt);
    return;
  }
  game.elapsed += dt;
  updateEffects(game.effects, dt);
  updateSpectators(game.spectators, dt);
  if (game.state === 'paused' || game.state === 'victory' || game.state === 'defeat' || game.state === 'title' || game.state === 'draft') {
    return;
  }
  if (game.state === 'roundEnd') {
    game.roundBanner -= dt;
    if (game.roundBanner <= 0) {
      startRound(game, game.round + 1);
      audio.play('horn');
    }
    return;
  }
  game.time = Math.max(0, game.time - dt);
  game.roundBanner = Math.max(0, game.roundBanner - dt);
  updatePlayer(game.player, input, dt, audio);
  const slam = updateBot(game.bot, game.player, dt, game.time, game.effects);
  if (slam) {
    resolveBossSlam(game.player, game.bot, game.effects, audio);
  }
  updatePiston(game, dt, audio);
  const contactWinner = resolveBots(game.player, game.bot, {
    spark: (x, y, nx, ny) => sparkBurst(game.effects, x, y, nx, ny),
    get shake() { return game.effects.shake; },
    set shake(value) { game.effects.shake = value; },
    set knockout(value) { game.effects.knockout = value; },
    set flash(value) { game.effects.flash = value; }
  }, audio, game.spectators, game.round);
  const ringWinner = contactWinner || checkRingOut(game.player, game.bot, game.effects, audio, game.round);
  if (ringWinner) {
    finishRound(game, ringWinner === 'bot' ? 'player' : 'bot', true, audio);
  } else if (game.time <= 0) {
    const playerCenter = distance(game.player, arena);
    const botCenter = distance(game.bot, arena);
    finishRound(game, playerCenter < botCenter ? 'player' : 'bot', false, audio);
  }
}

// Fixed states for operator capture scenes.
function prepareDemo(game, shot) {
  game.playerWins = 0;
  game.botWins = 0;
  game.score = 0;
  game.results = [];
  game.upgradesTaken = [];
  game.draftOffers = [];
  game.round = 1;
  game.player.x = 548;
  game.player.y = 412;
  game.bot.x = 610;
  game.bot.y = 412;
  game.bot.vx = -36;
  game.bot.vy = 5;
  game.effects.spark(578, 412, 1, 0);
  if (shot === 'play') {
    game.state = 'playing';
    game.round = 2;
    game.bot = makeBot(2);
    game.bot.x = 760;
    game.bot.y = 350;
    game.bot.vx = -70;
    game.bot.vy = 45;
    game.player.x = 600;
    game.player.y = 450;
    game.playerWins = 1;
    game.results = [{ round: 1, winner: 'player', knockout: true, koBonus: 1000, timeBonus: 240, duration: 33 }];
    game.score = game.results[0].koBonus + game.results[0].timeBonus;
    game.time = 31;
    game.player.dash = 1.25;
    game.effects.spark(676, 394, 1, 0);
  }
  if (shot === 'win') {
    game.state = 'victory';
    game.playerWins = 2;
    game.upgradesTaken = ['HEAVY PLATING'];
    applyUpgrade(game.player, 'HEAVY PLATING');
    game.results = [
      { round: 1, winner: 'player', knockout: true, koBonus: 1000, timeBonus: 360, duration: 27 },
      { round: 2, winner: 'player', knockout: true, koBonus: 1000, timeBonus: 120, duration: 39 }
    ];
    game.score = game.results.reduce((total, result) => total + result.koBonus + result.timeBonus, 0);
    game.round = 2;
    game.bot = makeBot(2);
    game.bot.x = 970;
    game.bot.y = 515;
    game.bot.falling = true;
    game.effects.knockout = 0.8;
    confettiBurst(game.effects);
  }
  if (shot === 'lose') {
    game.state = 'defeat';
    game.playerWins = 1;
    game.botWins = 2;
    game.upgradesTaken = ['HEAVY PLATING'];
    applyUpgrade(game.player, 'HEAVY PLATING');
    game.results = [
      { round: 1, winner: 'player', knockout: true, koBonus: 1000, timeBonus: 360, duration: 27 },
      { round: 2, winner: 'bot', knockout: false, koBonus: 0, timeBonus: 0, duration: 45 },
      { round: 3, winner: 'bot', knockout: false, koBonus: 0, timeBonus: 0, duration: 45 }
    ];
    game.score = game.results.reduce((total, result) => total + result.koBonus + result.timeBonus, 0);
    game.round = 3;
    game.bot = makeBot(3);
    game.bot.x = 800;
    game.bot.y = 420;
    game.piston = { clock: 3.62, phase: 'warn' };
    game.player.x = 960;
    game.player.y = 510;
    game.player.falling = true;
  }
  game.player.x = clamp(game.player.x, 100, 1180);
  game.player.y = clamp(game.player.y, 100, 700);
}
