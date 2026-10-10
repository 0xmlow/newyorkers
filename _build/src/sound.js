// Every sound is synthesised in the browser: no audio files, nothing to license.
export class Sound {
  constructor() { this.on = true; this.ctx = null; this.beds = {}; this.cur = null; }
  start() {
    if (this.ctx) return;
    const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = C.createGain(); this.master.gain.value = 0.7; this.master.connect(C.destination);
    const n = C.createBuffer(1, C.sampleRate * 2, C.sampleRate), d = n.getChannelData(0);
    let b = 0; for (let i = 0; i < d.length; i++) { b = 0.98 * b + 0.02 * (Math.random() * 2 - 1); d[i] = b * 6; }
    this.brown = n;
    const w = C.createBuffer(1, C.sampleRate, C.sampleRate), wd = w.getChannelData(0); for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1; this.white = w;
    if (this.want) this.room(this.want);
    this.loop();
  }
  toggle() { this.on = !this.on; if (this.master) this.master.gain.setTargetAtTime(this.on ? 0.7 : 0, this.ctx.currentTime, 0.1); }
  noise(buf, f, q, type = 'lowpass') { const C = this.ctx, s = C.createBufferSource(); s.buffer = buf; s.loop = true; const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); s.start(); return fl; }
  bed(name) {
    const C = this.ctx, g = C.createGain(); g.gain.value = 0; g.connect(this.master);
    const add = (node, v) => { const k = C.createGain(); k.gain.value = v; node.connect(k); k.connect(g); return k; };
    const hum = (f, v) => { const o = C.createOscillator(); o.frequency.value = f; o.type = 'sawtooth'; const fl = C.createBiquadFilter(); fl.frequency.value = f * 3; o.connect(fl); o.start(); add(fl, v); };
    if (name === 'street') { add(this.noise(this.brown, 260, 0.5), 0.5); add(this.noise(this.white, 3200, 0.3, 'bandpass'), 0.015); }
    if (name === 'deli') { hum(60, 0.05); hum(120, 0.02); add(this.noise(this.brown, 180, 0.6), 0.12); }
    if (name === 'subway') { add(this.noise(this.brown, 90, 0.8), 0.7); hum(50, 0.03); }
    if (name === 'archive') { add(this.noise(this.brown, 140, 0.5), 0.15); }
    if (name === 'alley') { add(this.noise(this.brown, 200, 0.5), 0.3); hum(55, 0.015); }
    if (name === 'theater') { add(this.noise(this.brown, 300, 0.4), 0.18); }
    if (name === 'roof') { add(this.noise(this.white, 500, 0.6, 'bandpass'), 0.06); add(this.noise(this.brown, 120, 0.4), 0.35); }
    return (this.beds[name] = g);
  }
  room(name) {
    this.want = name; if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const k in this.beds) this.beds[k].gain.setTargetAtTime(0, t, 0.6);
    (this.beds[name] || this.bed(name)).gain.setTargetAtTime(1, t, 0.8);
    this.cur = name;
  }
  // little random events per room so the night never sits still
  loop() {
    const C = this.ctx; if (!C) return;
    const r = this.cur;
    if (r === 'street' && Math.random() < 0.25) this.horn(0.12);
    if (r === 'archive' && Math.random() < 0.6) this.tick();
    if (r === 'alley' && Math.random() < 0.5) this.drip();
    if (r === 'deli' && Math.random() < 0.15) this.beep(1800, 0.05, 0.06);
    if (r === 'roof' && Math.random() < 0.3) this.boom(0.25);
    setTimeout(() => this.loop(), 900 + Math.random() * 1800);
  }
  env(node, v, a, d) { const C = this.ctx, g = C.createGain(), t = C.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); g.connect(this.master); return g; }
  beep(f, v = 0.1, d = 0.12, type = 'square') { if (!this.ctx) return; const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; this.env(o, v, 0.005, d); o.start(); o.stop(this.ctx.currentTime + d + 0.05); }
  click() { this.beep(900, 0.05, 0.04, 'triangle'); }
  ding() { if (!this.ctx) return; [1320, 1760, 2640].forEach((f, i) => setTimeout(() => this.beep(f, 0.08, 0.5, 'sine'), i * 90)); }
  horn(v = 0.25) { if (!this.ctx) return; const C = this.ctx; [370, 466].forEach((f) => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const fl = C.createBiquadFilter(); fl.frequency.value = 1400; o.connect(fl); this.env(fl, v, 0.02, 0.5); o.start(); o.stop(C.currentTime + 0.6); }); }
  tick() { if (!this.ctx) return; const s = this.ctx.createBufferSource(); s.buffer = this.white; const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000; s.connect(f); this.env(f, 0.12, 0.001, 0.03); s.start(); s.stop(this.ctx.currentTime + 0.05); }
  drip() { if (!this.ctx) return; const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(500, t + 0.08); this.env(o, 0.06, 0.002, 0.1); o.start(); o.stop(t + 0.15); }
  boom(v = 0.4) { if (!this.ctx) return; const s = this.ctx.createBufferSource(); s.buffer = this.brown; const f = this.ctx.createBiquadFilter(); f.frequency.value = 160; s.connect(f); this.env(f, v, 0.01, 1.4); s.start(); s.stop(this.ctx.currentTime + 1.6); }
  whoosh(v = 0.8, d = 3) { if (!this.ctx) return; const C = this.ctx, s = C.createBufferSource(), t = C.currentTime; s.buffer = this.white; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7; f.frequency.setValueAtTime(200, t); f.frequency.linearRampToValueAtTime(1600, t + d * 0.5); f.frequency.linearRampToValueAtTime(150, t + d); s.connect(f); this.env(f, v, d * 0.45, d * 0.55); s.start(); s.stop(t + d + 0.1); }
  thud(v = 0.7) { if (!this.ctx) return; const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25); this.env(o, v, 0.003, 0.3); o.start(); o.stop(t + 0.35); this.boom(0.2); }
  applause(d = 4) { if (!this.ctx) return; const C = this.ctx, s = C.createBufferSource(), t = C.currentTime; s.buffer = this.white; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.4; const g = C.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.4); g.gain.setValueAtTime(0.35, t + d - 1); g.gain.linearRampToValueAtTime(0, t + d); const am = C.createGain(); s.connect(f); f.connect(am); am.connect(g); g.connect(this.master); const lfo = C.createOscillator(); lfo.frequency.value = 11; const lg = C.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain); lfo.start(); s.start(); s.stop(t + d); lfo.stop(t + d); }
  meow() { if (!this.ctx) return; const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(500, t); o.frequency.linearRampToValueAtTime(820, t + 0.15); o.frequency.linearRampToValueAtTime(380, t + 0.5); const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 3; o.connect(f); this.env(f, 0.3, 0.05, 0.5); o.start(); o.stop(t + 0.6); }
  coo() { if (!this.ctx) return; const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(320, t); o.frequency.linearRampToValueAtTime(260, t + 0.3); o.frequency.linearRampToValueAtTime(300, t + 0.5); this.env(o, 0.12, 0.05, 0.45); o.start(); o.stop(t + 0.6); }
  squeak() { if (!this.ctx) return; [0, 120].forEach((d) => setTimeout(() => { const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.frequency.setValueAtTime(2800, t); o.frequency.linearRampToValueAtTime(3600, t + 0.06); this.env(o, 0.06, 0.005, 0.07); o.start(); o.stop(t + 0.1); }, d)); }
  turnstile() { this.beep(1046, 0.08, 0.1, 'sine'); setTimeout(() => this.thud(0.3), 120); }
  ticket() { this.beep(2093, 0.06, 0.08, 'square'); setTimeout(() => this.beep(1568, 0.06, 0.12, 'square'), 90); }
  crack() { if (!this.ctx) return; for (let i = 0; i < 6; i++) setTimeout(() => this.tick(), i * 30 + Math.random() * 40); this.thud(0.5); }
}
