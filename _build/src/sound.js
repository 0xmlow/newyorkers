// THE GARDEN: every sound is synthesised, nothing is sampled. A crowd bed (two noise bands), swells, the organ, the bell, the horn.
let ctx = null, master = null, bed = null, bedGain = null, on = true;
export const SND = { get on() { return on; } };
function noiseBuf(sec = 2) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
  let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 + w * 0.15; }
  return b;
}
export function startSound() {
  if (ctx) return; ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  bed = ctx.createBufferSource(); bed.buffer = noiseBuf(4); bed.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.6;
  bedGain = ctx.createGain(); bedGain.gain.value = 0.0; bed.connect(f).connect(bedGain).connect(master); bed.start();
}
export function toggleSound() { on = !on; if (master) master.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.1); return on; }
// how loud the crowd bed is: 0 on the avenue, full in the bowl
export function crowdLevel(v) { if (bedGain) bedGain.gain.setTargetAtTime(v * 0.22, ctx.currentTime, 0.4); }
export function cheer(power = 1, len = 2.6) {
  if (!ctx) return; const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf(len + 0.5);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.5;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 * power, t + 0.35); g.gain.exponentialRampToValueAtTime(0.001, t + len);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + len + 0.5);
}
function tone(freq, t, dur, type = 'sine', vol = 0.2, dest = master) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.setValueAtTime(vol, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
// the arena organ: a drawbar voice (fundamental, octave, twelfth) through a little rotary wobble
function organNote(freq, t, dur, vol = 0.07) { for (const [m, v] of [[1, 1], [2, 0.6], [3, 0.35], [0.5, 0.4]]) tone(freq * m, t, dur, m === 3 ? 'square' : 'sine', vol * v); }
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
export function organCharge() { // the old ballpark call: four rising notes, a held fifth, then everybody yells
  if (!ctx) return; const t = ctx.currentTime + 0.05;
  [[67, 0, 0.18], [72, 0.2, 0.18], [76, 0.4, 0.18], [79, 0.6, 0.38], [76, 1.0, 0.18], [79, 1.2, 0.9]].forEach(([n, at, d]) => organNote(N(n), t + at, d));
  setTimeout(() => cheer(1.1, 2.2), 2150);
}
export function organVamp() { if (!ctx) return; const t = ctx.currentTime + 0.05; [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]].forEach((ch, i) => ch.forEach((n) => organNote(N(n), t + i * 0.5, 0.45, 0.04))); }
export function bell(times = 3) { // the ringside bell: two inharmonic partials, long decay
  if (!ctx) return; for (let k = 0; k < times; k++) { const t = ctx.currentTime + k * 0.42;
    for (const [f, v] of [[1180, 0.3], [2950, 0.12], [4400, 0.06]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 1.6); o.connect(g).connect(master); o.start(t); o.stop(t + 1.7); } }
}
export function horn() { if (!ctx) return; const t = ctx.currentTime; tone(233, t, 1.1, 'sawtooth', 0.12); tone(277, t, 1.1, 'sawtooth', 0.1); }
export function swish() { if (!ctx) return; const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf(0.5); const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500; const g = ctx.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.4); }
export function thud(v = 0.4) { if (!ctx) return; const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g).connect(master); o.start(t); o.stop(t + 0.2); }
export function clank() { if (!ctx) return; const t = ctx.currentTime; tone(620, t, 0.08, 'square', 0.06); tone(900, t + 0.01, 0.06, 'square', 0.04); }
export function rumble(sec = 3) { // a train under the floor
  if (!ctx) return; const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf(sec + 0.5); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.7, t + sec * 0.4); g.gain.linearRampToValueAtTime(0, t + sec); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + sec + 0.5);
}
export function flipClack(n = 24) { if (!ctx) return; for (let i = 0; i < n; i++) { const t = ctx.currentTime + i * 0.11 + Math.random() * 0.05; tone(180 + Math.random() * 80, t, 0.05, 'triangle', 0.08); } }
export function beat(on2) { // the concert: a kick and a pad under the lights
  if (!ctx) return; const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(master); o.start(t); o.stop(t + 0.32);
  if (on2) [57, 64, 69].forEach((n) => tone(N(n), t, 1.8, 'sawtooth', 0.018));
}
