// Guarded WebAudio synthesis that initializes after the first game gesture.
let audioContext = null;
let muted = false;

function getContext() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

function oscillator(frequency, duration, type = 'sine', volume = 0.04, endFrequency = frequency) {
  const context = getContext();
  if (!context || muted) return;

  try {
    const source = context.createOscillator();
    const gain = context.createGain();
    source.type = type;
    source.frequency.setValueAtTime(frequency, context.currentTime);
    source.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    source.stop(context.currentTime + duration);
  } catch {
    // Unsupported audio devices never interrupt the game.
  }
}

function noiseBurst(duration = 0.2, volume = 0.08) {
  const context = getContext();
  if (!context || muted) return;

  try {
    const size = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, size, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
  } catch {
    // Browsers without audio support remain fully playable.
  }
}

// Named sounds keep audio cues consistent across simulation systems.
export function sound(kind, intensity = 1) {
  if (kind === 'shot') oscillator(1100, 0.055, 'sawtooth', 0.016, 280);
  if (kind === 'pickup') oscillator(450 + intensity * 85, 0.24, 'sine', 0.055, 900);
  if (kind === 'kill') oscillator(170, 0.12, 'triangle', 0.07, 65);
  if (kind === 'boom') noiseBurst(0.28, 0.11);
  if (kind === 'dash') oscillator(420, 0.22, 'sawtooth', 0.035, 80);
  if (kind === 'horn') {
    oscillator(220, 0.42, 'triangle', 0.045, 330);
    setTimeout(() => oscillator(330, 0.45, 'triangle', 0.045, 440), 140);
  }
  if (kind === 'win') {
    [440, 554, 659, 880].forEach((note, index) => {
      setTimeout(() => oscillator(note, 0.35, 'sine', 0.06, note * 1.04), index * 115);
    });
  }
  if (kind === 'lose') oscillator(90, 1.1, 'triangle', 0.07, 38);
  if (kind === 'shield') {
    oscillator(520, 0.36, 'sine', 0.04, 680);
    oscillator(660, 0.36, 'sine', 0.03, 880);
  }
}

// The M key changes this shared mute state.
export function toggleMute() {
  muted = !muted;
  return muted;
}
