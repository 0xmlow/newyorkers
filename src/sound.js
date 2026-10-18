// Every sound is synthesised in the browser: no audio files, nothing to license.
// Beds per room (the N train at 3 a.m., the cooler hum and a radio two rooms away, a heart, a dome), and one shots:
// coos, the whoosh of falling into an eye, a chime, a door, a heartbeat thump.
export class Sound {
  constructor() { this.on = true; this.ctx = null; this.beds = {}; this.cur = null; this.want = null; }
  start() {
    if (this.ctx) return;
    const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = C.createGain(); this.master.gain.value = 0.7;
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -18; this.master.connect(comp); comp.connect(C.destination);
    const n = C.createBuffer(1, C.sampleRate * 2, C.sampleRate), d = n.getChannelData(0);
    let b = 0; for (let i = 0; i < d.length; i++) { b = 0.98 * b + 0.02 * (Math.random() * 2 - 1); d[i] = b * 6; }
    this.brown = n;
    const w = C.createBuffer(1, C.sampleRate, C.sampleRate), wd = w.getChannelData(0); for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1; this.white = w;
    if (this.want) this.room(this.want);
  }
  toggle() { this.on = !this.on; if (this.master) this.master.gain.setTargetAtTime(this.on ? 0.7 : 0, this.ctx.currentTime, 0.1); }
  noise(buf, f, q, type = 'lowpass') { const C = this.ctx, s = C.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = Math.random(); const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); s.start(0, Math.random()); return fl; }
  bed(name) {
    const C = this.ctx, g = C.createGain(); g.gain.value = 0; g.connect(this.master);
    const add = (node, v) => { const k = C.createGain(); k.gain.value = v; node.connect(k); k.connect(g); return k; };
    const hum = (f, v, type = 'sawtooth') => { const o = C.createOscillator(); o.frequency.value = f; o.type = type; const fl = C.createBiquadFilter(); fl.frequency.value = f * 3; o.connect(fl); o.start(); return add(fl, v); };
    const lfo = (param, f, depth) => { const o = C.createOscillator(); o.frequency.value = f; const k = C.createGain(); k.gain.value = depth; o.connect(k); k.connect(param); o.start(); };
    const pad = (fs, v) => fs.forEach((f) => { const o = C.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const k = C.createGain(); k.gain.value = v; lfo(k.gain, 0.05 + Math.random() * 0.08, v * 0.6); o.connect(k); k.connect(g); o.start(); });
    if (name === 'train') { const r = add(this.noise(this.brown, 120, 0.7), 0.55); lfo(r.gain, 0.21, 0.12); hum(48, 0.03); add(this.noise(this.white, 3200, 3, 'bandpass'), 0.008); pad([110, 164.8, 220], 0.012); }
    if (name === 'platform') { add(this.noise(this.brown, 160, 0.5), 0.25); add(this.noise(this.white, 900, 0.6, 'bandpass'), 0.015); pad([98, 146.8], 0.01); }
    if (name === 'bodega') { hum(60, 0.025); hum(120, 0.01); add(this.noise(this.brown, 300, 0.5), 0.12); const radio = add(this.noise(this.white, 1400, 2, 'bandpass'), 0.01); lfo(radio.gain, 2.1, 0.008); }
    if (name === 'cold') { hum(55, 0.03, 'square'); add(this.noise(this.white, 6000, 0.7, 'highpass'), 0.006); add(this.noise(this.brown, 200, 0.5), 0.1); }
    if (name === 'stairs') { add(this.noise(this.brown, 90, 0.8), 0.3); pad([65.4, 98, 130.8], 0.016); }
    if (name === 'nave') { pad([130.8, 196, 261.6, 329.6], 0.012); add(this.noise(this.brown, 220, 0.4), 0.08); }
    if (name === 'crop') { const s = add(this.noise(this.brown, 140, 1.2), 0.3); lfo(s.gain, 0.15, 0.2); pad([87.3, 130.8], 0.012); }
    if (name === 'heart') { add(this.noise(this.brown, 80, 0.9), 0.2); pad([73.4, 110], 0.014); }
    if (name === 'wing') { const w = add(this.noise(this.white, 500, 0.6, 'bandpass'), 0.05); lfo(w.gain, 0.3, 0.04); pad([146.8, 220, 293.7], 0.01); }
    if (name === 'dome') { pad([110, 138.6, 164.8, 220, 277.2], 0.009); add(this.noise(this.white, 7000, 1, 'highpass'), 0.003); }
    if (name === 'museum') { add(this.noise(this.brown, 260, 0.4), 0.06); hum(60, 0.006); }
    if (name === 'shop') { pad([261.6, 329.6, 392, 523.3], 0.006); add(this.noise(this.brown, 300, 0.4), 0.05); }
    return g;
  }
  room(name) {
    this.want = name; if (!this.ctx) return;
    const C = this.ctx;
    if (this.cur && this.cur !== name && this.beds[this.cur]) this.beds[this.cur].gain.setTargetAtTime(0, C.currentTime, 0.6);
    if (!name) { this.cur = null; return; }
    if (!this.beds[name]) this.beds[name] = this.bed(name);
    this.beds[name].gain.setTargetAtTime(1, C.currentTime, 0.8); this.cur = name;
  }
  env(node, a, d, v) { const C = this.ctx, t = C.currentTime, g = C.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); g.connect(this.master); return g; }
  tone(f, d = 0.3, v = 0.15, type = 'sine', slide) { if (!this.ctx) return; const C = this.ctx, o = C.createOscillator(); o.type = type; o.frequency.value = f; if (slide) o.frequency.exponentialRampToValueAtTime(slide, C.currentTime + d); this.env(o, 0.005, d, v); o.start(); o.stop(C.currentTime + d + 0.05); }
  click() { this.tone(1800, 0.05, 0.06, 'square'); }
  ding() { [1318.5, 1760, 2637].forEach((f, i) => setTimeout(() => this.tone(f, 0.7, 0.08), i * 70)); }
  coo(pitch = 1) { if (!this.ctx) return; const C = this.ctx; for (let i = 0; i < 3; i++) setTimeout(() => { const o = C.createOscillator(); o.type = 'sine'; o.frequency.value = 330 * pitch; o.frequency.linearRampToValueAtTime(260 * pitch, C.currentTime + 0.32); const lf = C.createOscillator(); lf.frequency.value = 28; const lg = C.createGain(); lg.gain.value = 18; lf.connect(lg); lg.connect(o.frequency); lf.start(); o.start(); this.env(o, 0.04, 0.34, 0.13); o.stop(C.currentTime + 0.45); lf.stop(C.currentTime + 0.45); }, i * 380); }
  whoosh() { if (!this.ctx) return; const s = this.noise(this.white, 300, 1.5, 'bandpass'); s.frequency.exponentialRampToValueAtTime(3800, this.ctx.currentTime + 2); this.env(s, 1.2, 1.4, 0.4); }
  thump(v = 0.6) { if (!this.ctx) return; this.tone(62, 0.22, v, 'sine', 38); setTimeout(() => this.tone(55, 0.18, v * 0.7, 'sine', 34), 170); }
  chime() { [523.3, 659.3, 784, 1046.5].forEach((f, i) => setTimeout(() => this.tone(f, 1.2, 0.06, 'triangle'), i * 120)); }
  door() { if (!this.ctx) return; const s = this.noise(this.brown, 400, 1); this.env(s, 0.01, 0.4, 0.5); this.tone(2400, 0.25, 0.04, 'triangle'); }
  bell() { [1568, 2093].forEach((f, i) => setTimeout(() => this.tone(f, 0.9, 0.08, 'triangle'), i * 160)); }
}
