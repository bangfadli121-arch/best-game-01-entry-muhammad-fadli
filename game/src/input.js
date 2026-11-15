export function makeInput(canvas, onAction) {
  const held = new Set();
  const state = { x: 0, y: 0, dash: false };
  const preventKeys = new Set([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

  window.addEventListener('keydown', (event) => {
    if (preventKeys.has(event.key)) {
      event.preventDefault();
    }
    held.add(event.key.toLowerCase());
    if (event.repeat) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') onAction('start');
    if (event.key.toLowerCase() === 'r') onAction('restart');
    if (event.key.toLowerCase() === 'p') onAction('pause');
    if (event.key.toLowerCase() === 'm') onAction('mute');
    if (event.key === '1' || event.key === '2' || event.key === '3') onAction('draftPick', Number(event.key) - 1);
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.key.toLowerCase());
  });

  canvas.addEventListener('pointerdown', (event) => {
    const bounds = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - bounds.left) * 1280 / bounds.width, y: (event.clientY - bounds.top) * 800 / bounds.height };
    onAction('click', point);
  });

  return {
    read() {
      const x = Number(held.has('d') || held.has('arrowright')) - Number(held.has('a') || held.has('arrowleft'));
      const y = Number(held.has('s') || held.has('arrowdown')) - Number(held.has('w') || held.has('arrowup'));
      state.x = x;
      state.y = y;
      state.dash = held.has(' ');
      return state;
    }
  };
}
