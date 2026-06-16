// Web Audio API sound engine — no external files needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.4,
  delay = 0
): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, c.currentTime + delay);

    gain.gain.setValueAtTime(0, c.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.05);
  } catch {
    // Silently fail if audio not available
  }
}

export const SFX = {
  // Single beep for each countdown tick (last 10 sec)
  tick(): void {
    playTone(880, 0.08, 'square', 0.25);
  },

  // Urgent triple beep for last 3 seconds
  urgentTick(): void {
    playTone(1200, 0.1, 'square', 0.35);
  },

  // Happy fanfare for correct guess
  correct(): void {
    playTone(523, 0.12, 'sine', 0.4, 0);      // C5
    playTone(659, 0.12, 'sine', 0.4, 0.1);    // E5
    playTone(784, 0.12, 'sine', 0.4, 0.2);    // G5
    playTone(1047, 0.25, 'sine', 0.45, 0.32); // C6
  },

  // Buzzer for time up
  timeUp(): void {
    playTone(220, 0.15, 'sawtooth', 0.4, 0);
    playTone(180, 0.15, 'sawtooth', 0.4, 0.18);
    playTone(140, 0.3, 'sawtooth', 0.35, 0.36);
  },

  // Soft click for skip
  skip(): void {
    playTone(400, 0.08, 'triangle', 0.2);
  },

  // Game start jingle
  gameStart(): void {
    playTone(440, 0.1, 'sine', 0.3, 0);
    playTone(550, 0.1, 'sine', 0.3, 0.12);
    playTone(660, 0.2, 'sine', 0.35, 0.24);
  },

  // Winner fanfare
  winner(): void {
    const notes = [523, 659, 784, 1047, 784, 1047];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.58];
    notes.forEach((f, i) => playTone(f, i === notes.length - 1 ? 0.5 : 0.15, 'sine', 0.4, times[i]));
  },
};

// Vibration helper
export const VIB = {
  tick(): void {
    if ('vibrate' in navigator) navigator.vibrate(30);
  },
  urgentTick(): void {
    if ('vibrate' in navigator) navigator.vibrate(60);
  },
  correct(): void {
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50, 30, 100]);
  },
  timeUp(): void {
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
  },
  buttonPress(): void {
    if ('vibrate' in navigator) navigator.vibrate(15);
  },
};

// Guard helpers — call these from components to respect user prefs
export function playSFX(key: keyof typeof SFX, enabled: boolean): void {
  if (enabled) SFX[key]();
}

export function playVIB(key: keyof typeof VIB, enabled: boolean): void {
  if (enabled) VIB[key]();
}
