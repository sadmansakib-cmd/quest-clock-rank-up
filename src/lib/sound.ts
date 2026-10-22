// Synthesized sound effects (Web Audio) — no audio files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from a click handler so later sounds (alarms) are allowed to play. */
export function unlockAudio() {
  getCtx();
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "square",
  vol = 0.12,
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export function playComplete() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 784, t, 0.12, "triangle", 0.16);
  tone(c, 1175, t + 0.08, 0.24, "triangle", 0.16);
}

export function playRankUp() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.11, 0.18, "square", 0.08));
  [1046.5, 1318.5, 1568].forEach((f) => tone(c, f, t + 0.48, 1.1, "triangle", 0.1));
  tone(c, 261.6, t + 0.48, 1.1, "sawtooth", 0.05);
  for (let i = 0; i < 7; i++) tone(c, 2093 + i * 180, t + 0.6 + i * 0.06, 0.09, "sine", 0.05);
}

/** Starts a looping alarm. Returns a stop function. */
export function startAlarm(): () => void {
  const c = getCtx();
  if (!c) return () => {};
  const ring = () => {
    const t = c.currentTime;
    [0, 0.17, 0.34].forEach((o) => tone(c, 988, t + o, 0.12, "square", 0.14));
    tone(c, 1319, t + 0.55, 0.28, "square", 0.12);
  };
  ring();
  const id = window.setInterval(ring, 1200);
  return () => window.clearInterval(id);
}
