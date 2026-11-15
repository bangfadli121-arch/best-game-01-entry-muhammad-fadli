import { makeAudio } from './audio.js';
import { drawHud } from './hud.js';
import { makeInput } from './input.js';
import { renderScene } from './render.js';
import { makeGame, restartGame, selectDraft, startGame, updateGame } from './sim.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const query = new URLSearchParams(window.location.search);
const shot = query.get('shot') || '';
const seed = Number(query.get('seed') || 1);
const audio = makeAudio();
const game = makeGame(seed, shot);
const STEP = 1 / 60;
let accumulator = 0;
let previous = 0;
let muted = false;

function action(name, value) {
  if (name === 'draftPick') {
    selectDraft(game, value);
    return;
  }
  if (name === 'click') {
    if (game.state === 'draft') {
      const firstX = 172;
      for (let index = 0; index < game.draftOffers.length; index += 1) {
        const left = firstX + index * 312;
        if (value.x >= left && value.x <= left + 286 && value.y >= 282 && value.y <= 570) {
          selectDraft(game, index);
          return;
        }
      }
      return;
    }
    action('start');
    return;
  }
  if (name === 'mute') {
    muted = audio.toggleMute();
    return;
  }
  if (name === 'pause') {
    if (game.state === 'playing') game.state = 'paused';
    else if (game.state === 'paused') game.state = 'playing';
    return;
  }
  if (name === 'restart' && (game.state === 'victory' || game.state === 'defeat')) {
    restartGame(game);
    return;
  }
  if (name === 'start') {
    audio.unlock();
    if (game.state === 'victory' || game.state === 'defeat') {
      restartGame(game);
      startGame(game, audio);
      return;
    }
    startGame(game, audio);
  }
}

const input = makeInput(canvas, action);

function frame(timestamp) {
  if (!previous) previous = timestamp;
  const elapsed = Math.min(0.1, (timestamp - previous) / 1000);
  previous = timestamp;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    updateGame(game, input.read(), STEP, audio);
    accumulator -= STEP;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderScene(ctx, game);
  window.gameScore = game.score;
  drawHud(ctx, game, muted);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
