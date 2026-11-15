export function makeAudio() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        context = new AudioContextClass();
      }
    }
    if (context && context.state === 'suspended') {
      context.resume();
    }
    return context;
  }

  function tone(frequency, duration, type = 'sine', volume = 0.08, endFrequency = frequency) {
    const audio = ensureContext();
    if (!audio || muted) {
      return;
    }
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), audio.currentTime + duration);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function play(name) {
    if (name === 'dash') tone(460, 0.22, 'sawtooth', 0.06, 120);
    if (name === 'thud') tone(115, 0.16, 'triangle', 0.12, 48);
    if (name === 'horn') tone(260, 0.55, 'square', 0.07, 440);
    if (name === 'crash') tone(180, 0.5, 'sawtooth', 0.12, 35);
    if (name === 'cheer') tone(640, 0.12, 'sine', 0.035, 900);
    if (name === 'win') {
      tone(523, 0.45, 'triangle', 0.09, 784);
      setTimeout(() => tone(659, 0.5, 'triangle', 0.08, 1047), 110);
      setTimeout(() => tone(784, 0.7, 'triangle', 0.08, 1175), 220);
    }
    if (name === 'lose') tone(135, 1.2, 'sine', 0.1, 55);
  }

  return {
    play,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    unlock: ensureContext,
    get muted() { return muted; }
  };
}
