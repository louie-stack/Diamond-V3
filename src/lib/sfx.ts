/**
 * Sound for the site: a looping theme track plus a tiny synthesized kit.
 * Off until the user turns it on.
 *   thud  - rubber stamp hitting paper
 *   tick  - typewriter key
 *   flip  - a sheet of paper turning
 *   ching - a sale going through
 *   buzz  - denied
 *   hum   - a neon sign buzzing on
 *   strike - a match dragged and catching
 *   crackle - paper burning, for a few seconds
 *   swing - a hanging lamp knocked
 *   click - a dial notch / a pin popping
 *   chime - something quietly unlocked
 */
let ctx: AudioContext | null = null;
let on = false;
const listeners = new Set<(v: boolean) => void>();

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noise(dur: number, vol: number, hp = 400, lp = 8000) {
  if (!on || !ctx) return;
  const c = ctx;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const h = c.createBiquadFilter();
  h.type = "highpass";
  h.frequency.value = hp;
  const l = c.createBiquadFilter();
  l.type = "lowpass";
  l.frequency.value = lp;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(h).connect(l).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur);
}

function tone(freq: number, to: number, dur: number, vol: number, type: OscillatorType = "sine") {
  if (!on || !ctx) return;
  const c = ctx;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/* the theme: "Spy Detective Robbery" by Solarflex, looped under the site */
let theme: HTMLAudioElement | null = null;
let fade = 0;
let ducked = false;
const THEME_VOL = 0.42;
function music(play: boolean) {
  if (typeof window === "undefined") return;
  if (!theme) {
    theme = new Audio("/audio/theme.mp3");
    theme.loop = true;
    theme.preload = "auto";
    theme.volume = 0;
  }
  const a = theme;
  cancelAnimationFrame(fade);
  if (play) a.play().catch(() => {});
  const from = a.volume;
  const to = play ? THEME_VOL : 0;
  const t0 = performance.now();
  const dur = play ? 1200 : 600;
  const step = (now: number) => {
    const k = Math.min(1, Math.max(0, (now - t0) / dur));
    a.volume = Math.min(1, Math.max(0, from + (to - from) * k));
    if (k < 1) fade = requestAnimationFrame(step);
    else if (!play) a.pause();
  };
  fade = requestAnimationFrame(step);
}

export const sfx = {
  /** pause the theme while something else (the teaser) plays with sound */
  duck(v: boolean) {
    ducked = v;
    if (on) music(!v);
  },
  enabled: () => on,
  subscribe(fn: (v: boolean) => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  toggle(v?: boolean) {
    on = v ?? !on;
    if (on) ensure();
    music(on && !ducked);
    listeners.forEach((fn) => fn(on));
    return on;
  },
  thud() {
    tone(150, 38, 0.2, 0.5);
    noise(0.09, 0.28, 300, 3000);
  },
  tick() {
    noise(0.025, 0.14, 1800, 9000);
  },
  flip() {
    noise(0.14, 0.09, 700, 6000);
  },
  ching() {
    tone(1320, 1320, 0.08, 0.12, "triangle");
    setTimeout(() => tone(1760, 1760, 0.35, 0.12, "triangle"), 70);
  },
  buzz() {
    tone(110, 95, 0.32, 0.22, "square");
  },
  hum() {
    tone(120, 118, 0.55, 0.05, "sawtooth");
    noise(0.04, 0.06, 1500, 6000);
  },
  strike() {
    noise(0.22, 0.2, 1200, 7000);
    setTimeout(() => noise(0.5, 0.12, 200, 2400), 200);
  },
  crackle(seconds = 3) {
    if (!on) return;
    const end = performance.now() + seconds * 1000;
    const pop = () => {
      if (performance.now() > end) return;
      noise(0.012 + Math.random() * 0.03, 0.05 + Math.random() * 0.12, 900 + Math.random() * 2500, 9000);
      setTimeout(pop, 25 + Math.random() * 110);
    };
    noise(seconds, 0.035, 150, 900);
    pop();
  },
  swing() {
    tone(420, 380, 0.5, 0.04, "triangle");
    noise(0.05, 0.08, 600, 4000);
  },
  click() {
    noise(0.018, 0.16, 2500, 10000);
  },
  chime() {
    tone(880, 880, 0.12, 0.08, "triangle");
    setTimeout(() => tone(1175, 1175, 0.18, 0.08, "triangle"), 90);
    setTimeout(() => tone(1568, 1568, 0.5, 0.07, "triangle"), 180);
  },
};
