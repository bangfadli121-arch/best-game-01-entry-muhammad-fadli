// Keyboard and pointer state, including one-frame click events.
export function makeInput(canvas) {
  const keys = Object.create(null);
  const state = {
    keys,
    mouse: { x: 640, y: 400, down: false, clicked: false },
  };

  function updatePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    state.mouse.x = (event.clientX - bounds.left) * 1280 / bounds.width;
    state.mouse.y = (event.clientY - bounds.top) * 800 / bounds.height;
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keys[key] = true;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
  });

  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerdown', (event) => {
    updatePointer(event);
    state.mouse.down = true;
    state.mouse.clicked = true;
    canvas.setPointerCapture(event.pointerId);
  });

  window.addEventListener('pointerup', () => {
    state.mouse.down = false;
  });

  state.consumeClick = () => {
    const clicked = state.mouse.clicked;
    state.mouse.clicked = false;
    return clicked;
  };

  return state;
}
