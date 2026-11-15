import { colors } from './palette.js';
import { rounded } from './utils.js';

// Match HUD and screens.
export function drawHud(ctx, game, muted) {
  drawScore(ctx, game);
  drawPips(ctx, game);
  drawTimer(ctx, game);
  drawDash(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'draft') drawDraft(ctx, game);
  if (game.state === 'paused') drawPanel(ctx, 'PAUSED', 'Press P to jump back in');
  if (game.state === 'roundEnd') drawPanel(ctx, game.roundWinner === 'player' ? 'ROUND WON!' : 'ROUND LOST', 'Next duel is getting ready');
  if (game.state === 'victory') drawResults(ctx, game, 'CHAMPION OF THE YARD');
  if (game.state === 'defeat') drawResults(ctx, game, 'TOSSED OUT');
  if (game.state === 'playing' && game.roundBanner > 0.55) drawRoundBanner(ctx, game);
  ctx.textAlign = 'center';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillStyle = colors.cream;
  ctx.fillText('WASD / ARROWS MOVE   •   SPACE DASH   •   P PAUSE   •   M SOUND', 640, 778);
  ctx.textAlign = 'right';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(muted ? 'SOUND OFF' : 'SOUND ON', 1220, 34);
}

function drawScore(ctx, game) {
  ctx.textAlign = 'left';
  ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(`SCORE ${game.score}`, 46, 50);
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillStyle = colors.cream;
  ctx.fillText('YARD CHAMP', 48, 72);
  ctx.textAlign = 'right';
  ctx.fillStyle = colors.ink;
  ctx.font = '900 19px system-ui, sans-serif';
  ctx.fillText(game.bot.name, 1228, 70);
  if (game.bot.boss) drawStability(ctx, game.bot);
}

function drawPips(ctx, game) {
  ctx.textAlign = 'left';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText('YOU', 49, 104);
  for (let index = 0; index < 2; index += 1) {
    drawPip(ctx, 102 + index * 26, 99, index < game.playerWins, colors.player);
  }
  ctx.textAlign = 'right';
  ctx.fillText('RIVAL', 1228, 104);
  for (let index = 0; index < 2; index += 1) {
    drawPip(ctx, 1145 + index * 26, 99, index < game.botWins, colors.charger);
  }
}

function drawPip(ctx, x, y, active, color) {
  ctx.fillStyle = active ? color : 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTimer(ctx, game) {
  ctx.textAlign = 'center';
  ctx.font = '900 36px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(`${Math.ceil(game.time)}`, 640, 60);
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.fillText('SECONDS', 640, 77);
}

function drawDash(ctx, game) {
  const x = 46;
  const y = 128;
  const width = 176;
  ctx.fillStyle = colors.ink;
  rounded(ctx, x, y, width, 17, 8);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  rounded(ctx, x + 3, y + 3, (width - 6) * (1 - game.player.dash / game.player.dashMax), 11, 6);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(game.player.dash > 0 ? 'DASH RECHARGING' : 'DASH READY', x, y + 34);
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(255, 247, 218, 0.83)';
  rounded(ctx, 286, 112, 708, 184, 28);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = '1000 70px system-ui, sans-serif';
  ctx.lineWidth = 13;
  ctx.strokeStyle = colors.rustDark;
  ctx.strokeText('RUST RUMBLE', 640, 191);
  ctx.fillStyle = colors.gold;
  ctx.fillText('RUST RUMBLE', 640, 191);
  ctx.font = '900 18px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText('JUNKYARD SUMO BOTS', 640, 224);
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText('Shove them off the edge to win the round', 640, 260);
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillStyle = colors.cream;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 5;
  ctx.strokeText('PRESS ENTER OR CLICK TO RUMBLE', 640, 691);
  ctx.fillText('PRESS ENTER OR CLICK TO RUMBLE', 640, 691);
}

function drawRoundBanner(ctx, game) {
  ctx.fillStyle = 'rgba(255, 247, 218, 0.9)';
  rounded(ctx, 441, 104, 398, 88, 20);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.rustDark;
  ctx.font = game.roundBannerText.length > 24 ? '1000 18px system-ui, sans-serif' : '1000 20px system-ui, sans-serif';
  ctx.fillText(game.roundBannerText, 640, 137);
  ctx.fillStyle = colors.ink;
  ctx.font = '1000 34px system-ui, sans-serif';
  ctx.fillText(game.bot.name, 640, 175);
}

function drawStability(ctx, bot) {
  const x = 1070;
  const y = 119;
  const width = 154;
  ctx.textAlign = 'right';
  ctx.font = '900 11px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(bot.stunned > 0 ? 'STUNNED' : 'STABILITY', x + width, y - 5);
  ctx.fillStyle = colors.ink;
  rounded(ctx, x, y, width, 12, 6);
  ctx.fill();
  ctx.fillStyle = bot.stunned > 0 ? colors.pink : colors.mint;
  rounded(ctx, x + 2, y + 2, (width - 4) * (bot.stability / bot.maxStability), 8, 4);
  ctx.fill();
}

// Three-card scrap draft.
function drawDraft(ctx, game) {
  const descriptions = {
    'HEAVY PLATING': 'Mass up 25%; shoves hit harder',
    'LONG DASH': 'Dash burst +40%; cooldown 1.8s',
    'SPIKE BUMPER': 'Shove power up 30%',
    'SWIFT TREADS': 'Top speed up 20%',
    'GRIP TIRES': 'More friction; less sliding'
  };
  ctx.fillStyle = 'rgba(24, 57, 68, 0.36)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = colors.cream;
  rounded(ctx, 142, 180, 996, 454, 30);
  ctx.fill();
  ctx.strokeStyle = colors.rustDark;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.rustDark;
  ctx.font = '1000 42px system-ui, sans-serif';
  ctx.fillText('CHOOSE YOUR SCRAP', 640, 238);
  ctx.fillStyle = colors.ink;
  ctx.font = '800 18px system-ui, sans-serif';
  ctx.fillText(`ROUND SCORE  ${game.score}`, 640, 272);
  game.draftOffers.forEach((name, index) => {
    const x = 172 + index * 312;
    ctx.fillStyle = ['#f4bb4f', '#76cfbf', '#e89076'][index];
    rounded(ctx, x, 300, 286, 246, 22);
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.font = '1000 22px system-ui, sans-serif';
    ctx.fillText(String(index + 1), x + 143, 344);
    ctx.font = name.length > 14 ? '1000 17px system-ui, sans-serif' : '1000 20px system-ui, sans-serif';
    ctx.fillText(name, x + 143, 398);
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(descriptions[name], x + 143, 444, 250);
    ctx.font = '900 14px system-ui, sans-serif';
    ctx.fillText(`PRESS ${index + 1} OR CLICK`, x + 143, 510);
  });
  ctx.fillStyle = colors.ink;
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText('Scrap stacks when you find it again.', 640, 584);
}

// Data-driven match results.
function drawResults(ctx, game, title) {
  const topPadding = 64;
  const bottomPadding = 48;
  const scoreOffset = 110;
  const resultStart = 162;
  const resultStep = 34;
  const upgradeOffset = resultStart + game.results.length * resultStep + 8;
  const fastest = [...game.results].sort((a, b) => a.duration - b.duration || a.round - b.round)[0];
  const fastestOffset = upgradeOffset + 36;
  const restartOffset = fastest ? fastestOffset + 54 : upgradeOffset + 54;
  const panelHeight = restartOffset + bottomPadding;
  const panelTop = (800 - panelHeight) / 2;
  ctx.fillStyle = 'rgba(24, 57, 68, 0.45)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = colors.cream;
  rounded(ctx, 112, panelTop, 1056, panelHeight, 30);
  ctx.fill();
  ctx.strokeStyle = colors.rustDark;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.rustDark;
  ctx.font = title.length > 16 ? '1000 40px system-ui, sans-serif' : '1000 52px system-ui, sans-serif';
  ctx.fillText(title, 640, panelTop + topPadding);
  ctx.fillStyle = colors.ink;
  ctx.font = '1000 27px system-ui, sans-serif';
  ctx.fillText(`FINAL SCORE  ${game.score}     ROUNDS  ${game.playerWins}-${game.botWins}`, 640, panelTop + scoreOffset);
  ctx.textAlign = 'left';
  ctx.font = '900 14px system-ui, sans-serif';
  ctx.fillStyle = colors.rustDark;
  game.results.forEach((result, index) => {
    const outcome = result.winner === 'player' ? 'WON' : 'LOST';
    const text = `ROUND ${result.round} — ${outcome} • KO +${result.koBonus} • TIME +${result.timeBonus} • ${result.duration}s`;
    ctx.fillText(text, 176, panelTop + resultStart + index * resultStep);
  });
  const upgrades = game.upgradesTaken.length ? game.upgradesTaken.join('  →  ') : 'NONE';
  ctx.font = '900 15px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(`UPGRADES — ${upgrades}`, 176, panelTop + upgradeOffset);
  if (fastest) {
    ctx.fillText(`FASTEST ROUND — ROUND ${fastest.round}, ${fastest.duration}s`, 176, panelTop + fastestOffset);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.rustDark;
  ctx.font = '900 16px system-ui, sans-serif';
  ctx.fillText('PRESS ENTER, R, OR CLICK TO PLAY AGAIN', 640, panelTop + restartOffset);
}

function drawPanel(ctx, title, prompt) {
  ctx.fillStyle = 'rgba(24, 57, 68, 0.38)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = colors.cream;
  rounded(ctx, 250, 250, 780, 290, 32);
  ctx.fill();
  ctx.strokeStyle = colors.rustDark;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.rustDark;
  ctx.font = title.length > 16 ? '1000 44px system-ui, sans-serif' : '1000 58px system-ui, sans-serif';
  ctx.fillText(title, 640, 370);
  ctx.fillStyle = colors.ink;
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillText(prompt, 640, 435);
  ctx.font = '900 26px system-ui, sans-serif';
  ctx.fillText(`SCORE ${window.gameScore ?? ''}`, 640, 486);
}
