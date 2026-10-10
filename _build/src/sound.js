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
    const lfo = (node, f, depth) => { const o = C.createOscillator(); o.frequency.value = f; const k = C.createGain(); k.gain.value = depth; o.connect(k); k.connect(node.gain); o.start(); };
    if (name === 'lobby') { add(this.noise(this.brown, 300, 0.4), 0.16); hum(60, 0.01); }
    if (name === 'taxi') { add(this.noise(this.brown, 220, 0.5), 0.4); add(this.noise(this.white, 2600, 0.4, 'bandpass'), 0.012); hum(120, 0.008); }
    if (name === 'big') { hum(60, 0.02); add(this.noise(this.brown, 400, 0.4), 0.1); }
    if (name === 'itch') { add(this.noise(this.brown, 260, 0.5), 0.35); }
    if (name === 'heat') { add(this.noise(this.brown, 240, 0.5), 0.3); const cic = add(this.noise(this.white, 5200, 6, 'bandpass'), 0.05); lfo(cic, 7, 0.04); }
    if (name === 'ghost') { hum(60, 0.04); hum(90, 0.015); add(this.noise(this.brown, 160, 0.5), 0.15); }
    if (name === 'natm') { add(this.noise(this.brown, 140, 0.5), 0.14); }
    if (name === 'coney') { const w = add(this.noise(this.brown, 420, 0.4), 0.5); lfo(w, 0.12, 0.35); }
    if (name === 'stairs') { add(this.noise(this.white, 600, 0.5, 'bandpass'), 0.03); add(this.noise(this.brown, 180, 0.4), 0.2); }
    if (name === 'tiffany') { add(this.noise(this.brown, 220, 0.5), 0.18); add(this.noise(this.white, 3000, 0.4, 'bandpass'), 0.006); }
    if (name === 'rear') { add(this.noise(this.brown, 200, 0.5), 0.12); const cic = add(this.noise(this.white, 4800, 6, 'bandpass'), 0.03); lfo(cic, 6, 0.02); }
    if (name === 'disco') { add(this.noise(this.brown, 160, 0.5), 0.2); }
    if (name === 'copa') { hum(60, 0.02); add(this.noise(this.brown, 320, 0.5), 0.2); }
    if (name === 'walking') { add(this.noise(this.brown, 280, 0.5), 0.55); add(this.noise(this.white, 2400, 0.4, 'bandpass'), 0.02); }
    if (name === 'katz') { add(this.noise(this.brown, 420, 0.4), 0.35); add(this.noise(this.white, 1800, 0.5, 'bandpass'), 0.02); }
    if (name === 'feast') { add(this.noise(this.brown, 380, 0.4), 0.4); }
    if (name === 'westside') { add(this.noise(this.brown, 260, 0.5), 0.3); }
    if (name === 'loft') { add(this.noise(this.brown, 180, 0.5), 0.12); }
    if (name === 'wallst') { add(this.noise(this.brown, 500, 0.4), 0.45); add(this.noise(this.white, 2200, 0.5, 'bandpass'), 0.03); }
    if (name === 'pigeons') { add(this.noise(this.white, 700, 0.6, 'bandpass'), 0.05); }
    if (name === 'rink') { add(this.noise(this.brown, 300, 0.4), 0.25); add(this.noise(this.white, 5000, 0.6, 'bandpass'), 0.01); }
    if (name === 'moon') { add(this.noise(this.brown, 200, 0.4), 0.18); }
    if (name === 'pelham') { add(this.noise(this.brown, 110, 0.7), 0.6); hum(50, 0.03); }
    if (name === 'manhattan') { add(this.noise(this.brown, 240, 0.4), 0.2); }
    if (name === 'silence') { }
    if (name === 'clover') { add(this.noise(this.brown, 140, 0.6), 0.5); add(this.noise(this.white, 900, 0.6, 'bandpass'), 0.04); }
    if (name === 'library') { add(this.noise(this.white, 500, 0.5, 'bandpass'), 0.07); add(this.noise(this.brown, 150, 0.5), 0.15); }
    if (name === 'dogday') { add(this.noise(this.brown, 320, 0.4), 0.3); }
    if (name === 'fame') { add(this.noise(this.brown, 300, 0.4), 0.35); }
    if (name === 'annie') { add(this.noise(this.brown, 380, 0.4), 0.22); }
    if (name === 'unisphere') { add(this.noise(this.white, 700, 0.6, 'bandpass'), 0.03); hum(110, 0.01); }
    if (name === 'mcmlow') { hum(60, 0.03); add(this.noise(this.brown, 400, 0.4), 0.25); }
    if (name === 'bramford') { hum(55, 0.02); add(this.noise(this.brown, 120, 0.5), 0.08); }
    if (name === 'apartment') { add(this.noise(this.brown, 500, 0.4), 0.2); }
    if (name === 'chase') { add(this.noise(this.brown, 200, 0.5), 0.45); }
    if (name === 'birdman') { add(this.noise(this.brown, 300, 0.4), 0.4); add(this.noise(this.white, 1800, 0.5, 'bandpass'), 0.03); }
    if (name === 'network') { add(this.noise(this.white, 1200, 0.4, 'bandpass'), 0.08); add(this.noise(this.brown, 140, 0.5), 0.2); }
    if (name === 'gems') { hum(60, 0.02); add(this.noise(this.brown, 400, 0.4), 0.2); }
    if (name === 'smoke') { add(this.noise(this.brown, 260, 0.4), 0.2); }
    if (name === 'mail') { add(this.noise(this.brown, 220, 0.4), 0.1); }
    if (name === 'batteries') { hum(60, 0.02); add(this.noise(this.brown, 300, 0.4), 0.12); }
    if (name === 'susan') { add(this.noise(this.brown, 360, 0.4), 0.25); }
    if (name === 'dumbo') { add(this.noise(this.brown, 200, 0.5), 0.25); }
    if (name === 'bronx') { add(this.noise(this.brown, 300, 0.4), 0.3); }
    if (name === 'kramer') { hum(60, 0.015); add(this.noise(this.brown, 240, 0.4), 0.08); }
    if (name === 'zoolander') { hum(80, 0.01); add(this.noise(this.brown, 400, 0.4), 0.08); }
    if (name === 'wildstyle') { add(this.noise(this.brown, 220, 0.5), 0.35); }
    if (name === 'ragingbull') { add(this.noise(this.brown, 500, 0.4), 0.45); add(this.noise(this.white, 1500, 0.5, 'bandpass'), 0.03); }
    if (name === 'ferry') { const w = add(this.noise(this.brown, 300, 0.4), 0.45); lfo(w, 0.15, 0.25); }
    if (name === 'tenenbaums') { add(this.noise(this.brown, 200, 0.4), 0.08); }
    if (name === 'meanstreets') { hum(60, 0.02); add(this.noise(this.brown, 380, 0.4), 0.25); }
    if (name === 'barefoot') { add(this.noise(this.white, 500, 0.5, 'bandpass'), 0.04); }
    if (name === 'crooklyn') { add(this.noise(this.brown, 320, 0.4), 0.18); }
    if (name === 'legend') { add(this.noise(this.white, 600, 0.6, 'bandpass'), 0.03); }
    if (name === 'llewyn') { add(this.noise(this.brown, 260, 0.4), 0.1); }
    if (name === 'fisherking') { add(this.noise(this.brown, 380, 0.4), 0.35); add(this.noise(this.white, 1800, 0.6, 'bandpass'), 0.01); }
    if (name === 'waituntildark') { hum(50, 0.012); add(this.noise(this.brown, 140, 0.5), 0.08); }
    if (name === 'tootsie') { hum(60, 0.01); add(this.noise(this.brown, 300, 0.4), 0.08); }
    if (name === 'insideman') { hum(120, 0.006); add(this.noise(this.brown, 180, 0.4), 0.1); }
    if (name === 'prada') { add(this.noise(this.brown, 500, 0.4), 0.12); add(this.noise(this.white, 3000, 0.6, 'bandpass'), 0.006); }
    if (name === 'blackswan') { add(this.noise(this.brown, 200, 0.4), 0.06); }
    if (name === 'cocktail') { add(this.noise(this.brown, 420, 0.4), 0.3); hum(55, 0.01); }
    if (name === 'gangs') { const w = add(this.noise(this.white, 500, 0.5, 'bandpass'), 0.05); lfo(w, 0.08, 0.04); add(this.noise(this.brown, 160, 0.5), 0.2); }
    if (name === 'oddcouple') { add(this.noise(this.brown, 300, 0.4), 0.1); }
    if (name === 'ontown') { const w = add(this.noise(this.brown, 380, 0.4), 0.35); lfo(w, 0.1, 0.25); }
    if (name === 'godfather') { add(this.noise(this.brown, 240, 0.4), 0.14); hum(60, 0.006); }
    if (name === 'crowd') { hum(120, 0.012); add(this.noise(this.brown, 320, 0.4), 0.1); }
    if (name === 'producers') { const w = add(this.noise(this.white, 900, 0.5, 'bandpass'), 0.05); lfo(w, 0.2, 0.02); add(this.noise(this.brown, 260, 0.4), 0.15); }
    if (name === 'devils') { add(this.noise(this.brown, 140, 0.5), 0.12); hum(55, 0.008); }
    if (name === 'diehard') { add(this.noise(this.brown, 380, 0.4), 0.3); const cic = add(this.noise(this.white, 5200, 6, 'bandpass'), 0.04); lfo(cic, 6, 0.03); }
    if (name === 'dundee') { add(this.noise(this.brown, 260, 0.5), 0.3); add(this.noise(this.white, 1800, 0.5, 'bandpass'), 0.01); }
    if (name === 'dolly') { add(this.noise(this.brown, 420, 0.4), 0.35); }
    if (name === 'stuart') { const w = add(this.noise(this.brown, 520, 0.4), 0.25); lfo(w, 0.15, 0.15); }
    if (name === 'sweetsmell') { add(this.noise(this.white, 1400, 0.4, 'bandpass'), 0.05); add(this.noise(this.brown, 260, 0.4), 0.25); }
    if (name === 'scent') { add(this.noise(this.brown, 300, 0.4), 0.12); }
    if (name === 'splash') { hum(60, 0.008); const w = add(this.noise(this.brown, 300, 0.4), 0.15); lfo(w, 0.3, 0.06); }
    if (name === 'afterhours') { add(this.noise(this.brown, 200, 0.5), 0.2); add(this.noise(this.white, 2400, 0.6, 'bandpass'), 0.008); }
    if (name === 'crown') { add(this.noise(this.brown, 380, 0.4), 0.12); }
    if (name === 'trading') { add(this.noise(this.brown, 520, 0.4), 0.45); add(this.noise(this.white, 1200, 0.5, 'bandpass'), 0.03); }
    if (name === 'miracle') { add(this.noise(this.brown, 300, 0.4), 0.1); }
    if (name === 'treebrooklyn') { add(this.noise(this.brown, 260, 0.4), 0.18); const b = add(this.noise(this.white, 4200, 8, 'bandpass'), 0.02); lfo(b, 3, 0.015); }
    if (name === 'gatsby') { const w = add(this.noise(this.brown, 180, 0.5), 0.35); lfo(w, 0.07, 0.25); }
    if (name === 'bigdaddy') { add(this.noise(this.brown, 420, 0.4), 0.3); }
    if (name === 'serendipity') { hum(60, 0.006); add(this.noise(this.brown, 300, 0.4), 0.08); }
    if (name === 'bigbusiness') { add(this.noise(this.brown, 340, 0.4), 0.08); }
    if (name === 'kong') { add(this.noise(this.white, 420, 0.6, 'bandpass'), 0.08); add(this.noise(this.brown, 110, 0.4), 0.4); }
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
    if (r === 'taxi' && Math.random() < 0.2) this.horn(0.08);
    if (r === 'itch' && Math.random() < 0.12) this.boom(0.3);
    if (r === 'lobby' && Math.random() < 0.5) { for (let i = 0; i < 8; i++) setTimeout(() => this.tick(), i * 45); }
    if (r === 'natm' && Math.random() < 0.15) this.drip();
    if (r === 'coney' && Math.random() < 0.25) this.gull();
    if (r === 'ghost' && Math.random() < 0.1) this.beep(880, 0.03, 0.3, 'sine');
    if (r === 'kong' && Math.random() < 0.3) this.drone();
    if (r === 'pigeons' && Math.random() < 0.4) this.coo();
    if (r === 'apartment' && Math.random() < 0.7) { for (let i = 0; i < 6; i++) setTimeout(() => this.tick(), i * 70); }
    if (r === 'mcmlow' && Math.random() < 0.2) this.beep(1200, 0.04, 0.2, 'sine');
    if (r === 'feast' && Math.random() < 0.3) this.ding();
    if (r === 'katz' && Math.random() < 0.3) this.clink(2600);
    if (r === 'walking' && Math.random() < 0.35) this.horn(0.06 + Math.random() * 0.08);
    if (r === 'copa' && Math.random() < 0.3) this.clink(1800 + Math.random() * 1500);
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
  // the floor piano: an equal tempered note, a little music box bell on top
  note(f, v = 0.22) { if (!this.ctx) return; const C = this.ctx, t = C.currentTime; [[f, 'triangle', v], [f * 2, 'sine', v * 0.35], [f * 3, 'sine', v * 0.12]].forEach(([fr, ty, vv]) => { const o = C.createOscillator(); o.type = ty; o.frequency.value = fr; this.env(o, vv, 0.004, 1.1); o.start(); o.stop(t + 1.2); }); }
  gull() { if (!this.ctx) return; const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(1300, t); o.frequency.linearRampToValueAtTime(1900, t + 0.12); o.frequency.linearRampToValueAtTime(1100, t + 0.35); const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 4; o.connect(f); this.env(f, 0.05, 0.03, 0.35); o.start(); o.stop(t + 0.45); }
  drone() { if (!this.ctx) return; const C = this.ctx, o = C.createOscillator(), t = C.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(95, t + 2.5); const f = C.createBiquadFilter(); f.frequency.value = 500; o.connect(f); this.env(f, 0.07, 1.2, 1.6); o.start(); o.stop(t + 3); }
  clink(f = 2600) { if (!this.ctx) return; [1, 2.76, 5.4].forEach((k, i) => this.beep(f * k, 0.05 / (i + 1), 0.6, 'sine')); }
  roar(v = 0.6) { if (!this.ctx) return; const C = this.ctx, s = C.createBufferSource(), t = C.currentTime; s.buffer = this.brown; const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(200, t + 1.6); s.connect(f); this.env(f, v, 0.08, 1.6); s.start(); s.stop(t + 1.8); const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.linearRampToValueAtTime(60, t + 1.5); this.env(o, v * 0.25, 0.05, 1.5); o.start(); o.stop(t + 1.7); }
  pop() { this.beep(3200, 0.05, 0.03, 'square'); setTimeout(() => this.tick(), 20); }
  // the boombox: a little boom bap, kick snare hat, 92 bpm, until stopped
  beat(on) { if (!this.ctx) return; clearInterval(this._beat); if (!on) return; let i = 0; const st = 60 / 92 / 2 * 1000; this._beat = setInterval(() => { const k = i % 8; if (k === 0 || k === 5) this.thud(0.35); if (k === 2 || k === 6) { this.tick(); this.boom(0.12); } else this.tick(); i++; }, st); }
  // four on the floor at 120, open hat on the off beat, a bass that walks
  disco(on) { if (!this.ctx) return; clearInterval(this._disco); if (!on) return; let i = 0; const B = [55, 55, 65.4, 73.4]; this._disco = setInterval(() => { const k = i % 4; this.thud(0.32); if (k % 2) this.tick(); const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = B[(i >> 2) % 4] * (k === 2 ? 2 : 1); const f = this.ctx.createBiquadFilter(); f.frequency.value = 500; o.connect(f); this.env(f, 0.12, 0.005, 0.2); o.start(); o.stop(this.ctx.currentTime + 0.25); i++; }, 250); }
  screech() { if (!this.ctx) return; const C = this.ctx, s = C.createBufferSource(), t = C.currentTime; s.buffer = this.white; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 8; f.frequency.setValueAtTime(2600, t); f.frequency.linearRampToValueAtTime(1500, t + 1.2); s.connect(f); this.env(f, 0.5, 0.02, 1.2); s.start(); s.stop(t + 1.3); }
  // a slow swell of major sevenths for the long take
  chords(d = 12) { if (!this.ctx) return; const C = this.ctx, t0 = C.currentTime; [[261.6, 329.6, 392, 493.9], [220, 277.2, 329.6, 415.3], [293.7, 370, 440, 554.4], [196, 246.9, 293.7, 370]].forEach((ch, k) => ch.forEach((f) => { const o = C.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = C.createGain(), a = t0 + k * d / 4; g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(0.035, a + 0.6); g.gain.linearRampToValueAtTime(0, a + d / 4 + 0.4); o.connect(g); g.connect(this.master); o.start(a); o.stop(a + d / 4 + 0.5); })); }
  howl() { if (!this.ctx) return; const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(620, t + 0.6); o.frequency.linearRampToValueAtTime(420, t + 2.2); const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 3; o.connect(f); this.env(f, 0.08, 0.4, 1.8); o.start(); o.stop(t + 2.4); }
  // a clarinet trill and the long climb that opens Rhapsody in Blue (Gershwin, 1924, in the public domain)
  rhapsody() { if (!this.ctx) return; const C = this.ctx, t = C.currentTime, o = C.createOscillator(); o.type = 'triangle'; const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; o.connect(f);
    for (let k = 0; k < 14; k++) o.frequency.setValueAtTime(k % 2 ? 196 : 174.6, t + k * 0.07);
    o.frequency.setValueAtTime(174.6, t + 1.0); o.frequency.exponentialRampToValueAtTime(932.3, t + 2.3);
    [[932.3, 2.3], [880, 2.7], [784, 2.9], [698.5, 3.1], [622.3, 3.3], [698.5, 3.6], [932.3, 3.9]].forEach(([fr, at]) => o.frequency.setValueAtTime(fr, t + at));
    this.env(f, 0.12, 0.05, 4.4); o.start(); o.stop(t + 4.6); }
  // a crowd chanting two syllables, far off
  chant(v = 0.2) { if (!this.ctx) return; [0, 0.32].forEach((d, k) => setTimeout(() => { const C = this.ctx, s = C.createBufferSource(), t = C.currentTime; s.buffer = this.white; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = k ? 520 : 760; f.Q.value = 2; s.connect(f); this.env(f, v, 0.03, 0.25); s.start(); s.stop(t + 0.35); }, d * 1000)); }
  // a 56k modem handshake, roughly
  modem() { if (!this.ctx) return; const C = this.ctx, t = C.currentTime; [[1270, 0, 0.6], [2225, 0.7, 0.5], [1650, 1.3, 0.4], [980, 1.8, 0.3]].forEach(([f, at, d]) => { const o = C.createOscillator(); o.type = 'square'; o.frequency.value = f; const g = C.createGain(); g.gain.setValueAtTime(0, t + at); g.gain.linearRampToValueAtTime(0.05, t + at + 0.02); g.gain.setValueAtTime(0.05, t + at + d); g.gain.linearRampToValueAtTime(0, t + at + d + 0.02); o.connect(g); g.connect(this.master); o.start(t + at); o.stop(t + at + d + 0.05); }); const s = C.createBufferSource(); s.buffer = this.white; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1; s.connect(f); const g2 = C.createGain(); g2.gain.setValueAtTime(0, t + 2.2); g2.gain.linearRampToValueAtTime(0.08, t + 2.4); g2.gain.setValueAtTime(0.08, t + 4.6); g2.gain.linearRampToValueAtTime(0, t + 5); f.connect(g2); g2.connect(this.master); s.start(t + 2.2); s.stop(t + 5.1); }
  foghorn() { if (!this.ctx) return; const C = this.ctx, t = C.currentTime; [73.4, 110].forEach((f) => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const fl = C.createBiquadFilter(); fl.frequency.value = 400; o.connect(fl); this.env(fl, 0.25, 0.2, 2.2); o.start(); o.stop(t + 2.6); }); }
  pant() { if (!this.ctx) return; const C = this.ctx, s = C.createBufferSource(), t = C.currentTime; s.buffer = this.white; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.5; s.connect(f); this.env(f, 0.06, 0.05, 0.25); s.start(); s.stop(t + 0.35); }
  bark() { if (!this.ctx) return; [0, 260].forEach((d) => setTimeout(() => { const o = this.ctx.createOscillator(), t = this.ctx.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.12); const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; o.connect(f); this.env(f, 0.3, 0.005, 0.14); o.start(); o.stop(t + 0.2); }, d)); }
  // a waltz in three, oom pah pah, in D: for the concourse
  waltz(on) { if (!this.ctx) return; clearInterval(this._waltz); if (!on) return; let i = 0; const B = [146.8, 110, 146.8, 110, 130.8, 98, 146.8, 110], M = [587.3, 659.3, 740, 880, 784, 740, 659.3, 587.3, 659.3, 740, 587.3, 493.9]; this._waltz = setInterval(() => { const bar = (i / 3) | 0, beat = i % 3; if (beat === 0) this.note(B[bar % 8], 0.16); else [1.26, 1.5].forEach((k) => this.note(B[bar % 8] * 2 * k, 0.05)); if (beat === 0 || i % 6 === 4) this.note(M[(i >> 1) % 12], 0.08); i++; }, 230); }
  // a little bell for each catch
  catch_(n) { this.beep(660 * Math.pow(1.06, n % 12), 0.06, 0.2, 'sine'); }
  // a whistle for the shore leave clock
  whistle() { if (!this.ctx) return; const C = this.ctx, o = C.createOscillator(), t = C.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(1800, t); o.frequency.linearRampToValueAtTime(2100, t + 0.15); o.frequency.setValueAtTime(1800, t + 0.3); this.env(o, 0.08, 0.02, 0.9); o.start(); o.stop(t + 1.1); }
  // a brass band march in B flat, oom pah, for the parade
  march(on) { if (!this.ctx) return; clearInterval(this._march); if (!on) return; let i = 0; const B = [116.5, 174.6, 116.5, 174.6, 155.6, 233.1, 174.6, 233.1], M = [466.2, 466.2, 523.3, 587.3, 698.5, 587.3, 523.3, 466.2, 392, 440, 466.2, 349.2]; this._march = setInterval(() => { this.note(B[i % 8], i % 2 ? 0.08 : 0.16); if (i % 2 === 0) this.note(M[(i >> 1) % 12], 0.09); if (i % 4 === 0) this.thud(0.25); i++; }, 270); }
  // a tango: habanera bass, a bandoneon chord on the and
  tango(on) { if (!this.ctx) return; clearInterval(this._tango); if (!on) return; let i = 0; const R = [146.8, 0, 0, 146.8, 220, 0, 146.8, 0], C = [[293.7, 349.2, 440], [277.2, 329.6, 440]]; this._tango = setInterval(() => { const b = R[i % 8]; if (b) this.note(b, 0.16); if (i % 8 === 2 || i % 8 === 6) C[(i >> 4) % 2].forEach((f) => this.beep(f, 0.03, 0.25, 'sawtooth')); i++; }, 180); }
  // the opening bell of a trading floor
  bell() { if (!this.ctx) return; for (let k = 0; k < 10; k++) setTimeout(() => this.beep(1250, 0.07, 0.09, 'square'), k * 110); }
  // a lift arriving
  lift() { if (!this.ctx) return; this.beep(1568, 0.07, 0.6, 'sine'); }
}
