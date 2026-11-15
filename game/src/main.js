// Browser bootstrap and fixed 60 Hz simulation-to-render loop.
import { createGame, step } from './sim.js';
import { makeInput } from './input.js';
import { drawWorld } from './render.js';
import { drawHud } from './hud.js';

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const input = makeInput(canvas);
const query = new URLSearchParams(location.search);
const shot = query.get('shot') || '';
const seed = Number(query.get('seed') || 1);
const game = createGame(seed, shot);
const STEP_MS = 1000 / 60;
let previousTime = performance.now();
let accumulator = 0;
let simulationTime = 0;

function frame(now) {
  const frameTime = Math.min(100, now - previousTime);
  previousTime = now;
  accumulator += frameTime;

  while (accumulator >= STEP_MS) {
    step(game, input, 1);
    accumulator -= STEP_MS;
    simulationTime += STEP_MS;
  }

  context.clearRect(0, 0, 1280, 800);
  drawWorld(context, game, simulationTime);
  drawHud(context, game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
