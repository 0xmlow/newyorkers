// LIVE FROM THE SEWERS: every room plays its own groove. All of it is synthesised here, note by note,
// from scratch: no samples, no recordings, no melody anybody wrote before. A step sequencer with a lookahead
// scheduler (sixteen steps a bar), a handful of voices, and one style per room.
// music.play(style) crossfades to a style; music.level(v) rides the room's volume (the Vanguard swell, the break);
// music.mute(true) drops the music for a trick (the break stops when you stop feeding it).
const N = (m) => 440 * Math.pow(2, (m - 69) / 12);   // midi to Hz

// progressions as midi roots, one chord a bar, and a chord quality
const STYLES = {
  // arrivals: water dripping in time, a customs hall lounge on the PA, slow and damp
  drip: { bpm: 84, swing: 0.2, prog: [[45, 'm7'], [41, 'maj7'], [43, '7'], [40, 'm7']], kick: 'x.......x.x.....', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x.......x...x...', comp: '....x.......x...', voice: 'epiano', vol: 0.42 },
  // the slice: a holy organ for a saint who carried dinner
  saint: { bpm: 66, swing: 0, prog: [[48, 'maj'], [53, 'maj'], [55, '7'], [48, 'maj']], kick: '', snare: '', hat: '', bass: 'x.......x.......', drone: true, comp: 'x.......x.......', voice: 'organ', harp: true, vol: 0.42 },
  // flushed: an aquarium waltz, music box bright, slightly underwater
  aqua: { bpm: 120, swing: 0, bar: 12, prog: [[60, 'maj7'], [57, 'm7'], [62, 'm7'], [55, '7']], waltz: true, voice: 'epiano', harp: true, vol: 0.4 },
  // the gator room: a smoky lounge, brushes, a walking bass, horns that take their time
  lounge: { bpm: 96, swing: 0.34, prog: [[50, 'm7'], [43, '7'], [48, 'maj7'], [45, '7']], ride: true, walk: true, kick: '', snare: '', hat: '....x.......x...', comp: '..x.....x..x....', voice: 'horn', vol: 0.48 },
  // the fatberg: a cathedral organ holding one chord for too long, like grease
  choir: { bpm: 54, swing: 0, prog: [[38, 'm'], [41, 'maj'], [36, 'maj'], [43, 'maj']], kick: 'x...............', snare: '', hat: '', bass: 'x...............', drone: true, comp: 'x.......x.......', voice: 'organ', vol: 0.42 },
  // the crumb exchange: a ticker, a clav on the off beats, a kick like a heartbeat under a bad trade
  ticker: { bpm: 132, swing: 0, prog: [[40, 'm7'], [40, 'm7'], [43, 'm7'], [38, 'm7']], kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.xxx.x.x.xxx.', bass: 'x.x...x.x.x...x.', comp: '.x.x.x.x.x.x.x.x', voice: 'clav', vol: 0.5 },
  // lost property: a hold music loop, polite, endless
  lost: { bpm: 104, swing: 0.1, prog: [[48, 'maj7'], [45, 'm7'], [50, 'm7'], [43, '7']], kick: 'x.......x.......', snare: '', hat: 'x.x.x.x.x.x.x.x.', bass: 'x...x...x...x...', comp: 'x...x...x...x...', voice: 'piano', vol: 0.4 },
  // beach pneumatic: a Victorian parlour waltz on an out of tune upright
  parlour: { bpm: 84, swing: 0, bar: 12, prog: [[57, 'm'], [52, '7'], [57, 'm'], [64, '7']], waltz: true, voice: 'piano', vol: 0.45 },
  // the steam baths: spa pads, a bell, nothing in a hurry
  spa: { bpm: 60, swing: 0, prog: [[48, 'maj7'], [53, 'maj7'], [45, 'm7'], [50, 'maj7']], kick: '', snare: '', hat: '', bass: '', drone: true, comp: 'x...............', harp: true, voice: 'epiano', vol: 0.4 },
  // city hall: a civic march, brass, the same four bars forever
  council: { bpm: 108, swing: 0, prog: [[46, 'maj'], [41, '7'], [46, 'maj'], [41, '7']], kick: 'x...x...x...x...', snare: '..x...x...x.x.x.', hat: '', bass: 'x...x...x...x...', stab: 'x.......x.......', voice: 'horn', vol: 0.45 },
  // the border: the bodega radio, a dusty boom bap through the floor
  bodega: { bpm: 92, swing: 0.22, prog: [[41, 'm7'], [41, 'm7'], [44, '7'], [43, '7']], kick: 'x.....x...x.....', snare: '....x.......x..x', hat: 'xxx.xxx.xxx.xxx.', bass: 'x.....x...x.....', stab: '..........x.....', voice: 'horn', vol: 0.55 },
  // the throne: a fanfare for a landlord
  throne: { bpm: 110, swing: 0, prog: [[43, '5'], [43, '5'], [48, '5'], [46, '5']], kick: 'x.x.x...x.x.x...', snare: '....x.......x...', hat: 'x...x...x...x...', bass: 'x.......x.......', stab: '......x.......x.', voice: 'horn', bongo: true, vol: 0.52 },
};
const Q = { maj: [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], '6': [0, 4, 7, 9], '5': [0, 7, 12] };

export function Music(sound) {
  const S = { style: null, step: 0, next: 0, bar: 0, lvl: 1, muted: false, out: null, timer: 0 };
  const C = () => sound.ctx;
  function bus() {
    if (S.out) return S.out;
    const c = C(); S.out = c.createGain(); S.out.gain.value = 0; S.out.connect(sound.master);
    // a short room: three taps of feedback delay, low passed, so the synth reads as a band in a room
    const d = c.createDelay(0.5); d.delayTime.value = 0.09; const fb = c.createGain(); fb.gain.value = 0.28; const lp = c.createBiquadFilter(); lp.frequency.value = 2400;
    S.out.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(sound.master);
    return S.out;
  }
  function env(node, t, v, a, d, dest = bus()) { const g = C().createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); g.connect(dest); return g; }
  function osc(type, f, t, v, a, d, filt) {
    const c = C(), o = c.createOscillator(); o.type = type; o.frequency.value = f;
    let n = o; if (filt) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filt; o.connect(fl); n = fl; }
    env(n, t, v, a, d); o.start(t); o.stop(t + a + d + 0.05); return o;
  }
  function noise(t, v, d, f, type = 'highpass') { const c = C(), s = c.createBufferSource(); s.buffer = sound.white; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; s.connect(fl); env(fl, t, v, 0.002, d); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05); }
  const kick = (t, v = 0.5) => { const c = C(), o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.08); env(o, t, v * 0.8, 0.002, 0.12); o.start(t); o.stop(t + 0.2); osc('triangle', 190, t, v * 0.35, 0.001, 0.03); noise(t, v * 0.12, 0.012, 2500); };   // phones: a 190 Hz knock, an 80 ms body, a click
  const snare = (t, v = 0.25) => { noise(t, v, 0.16, 1400); osc('triangle', 190, t, v * 0.4, 0.002, 0.08); };
  const hat = (t, v = 0.06, open) => noise(t, v, open ? 0.2 : 0.035, 7000);
  const ride = (t, v = 0.05) => { noise(t, v, 0.35, 5200, 'bandpass'); osc('square', 3100, t, v * 0.08, 0.002, 0.3, 6000); };
  const bongo = (t, f) => { const c = C(), o = c.createOscillator(); o.frequency.setValueAtTime(f * 1.4, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04); env(o, t, 0.12, 0.002, 0.14); o.start(t); o.stop(t + 0.2); };
  function voice(kind, f, t, v, d) {
    if (kind === 'guitar') { osc('triangle', f, t, v, 0.003, d * 1.6, 2600); osc('sawtooth', f * 2, t, v * 0.12, 0.003, d * 0.6, 1800); return; }
    if (kind === 'dist') { for (const k of [1, 1.005, 0.5]) osc('sawtooth', f * k, t, v * 0.5, 0.004, d, 1500); return; }
    if (kind === 'horn') { osc('sawtooth', f, t, v * 0.6, 0.03, d, 1800); osc('square', f * 1.003, t, v * 0.2, 0.03, d, 1200); return; }
    if (kind === 'clav') { osc('square', f, t, v * 0.5, 0.002, d * 0.5, 2400); return; }
    if (kind === 'organ') { for (const k of [1, 2, 3]) osc('sine', f * k, t, v * (0.5 / k), 0.01, d); return; }
    if (kind === 'epiano') { osc('sine', f, t, v * 0.8, 0.004, d * 2); osc('sine', f * 4, t, v * 0.1, 0.002, d * 0.3); return; }
    if (kind === 'piano1') { osc('triangle', f, t, v, 0.002, d * 0.8, 3000); return; }
    // piano: a hammered triangle with a slightly out of tune second string
    osc('triangle', f, t, v, 0.002, d * 1.8, 3400); osc('triangle', f * 1.004, t, v * 0.5, 0.002, d * 1.4, 2400);
  }
  function chordAt(st, bar) { const [root, q] = st.prog[bar % st.prog.length]; return Q[q].map((i) => root + i); }
  function play16(st, i, t, spb) {
    const bar = S.bar, notes = chordAt(st, bar), root = notes[0], on = (pat) => pat && pat[i % pat.length] === 'x', L = S.lvl;
    if (on(st.kick)) kick(t, 0.45 * L);
    if (on(st.snare)) snare(t, 0.22 * L);
    if (on(st.hat)) hat(t, 0.05 * L, i === 14);
    if (st.ride && i % 4 === 0) ride(t, 0.045 * L); if (st.ride && i % 8 === 6) ride(t, 0.03 * L);
    if (st.bongo && (i === 3 || i === 7 || i === 11 || i === 14)) bongo(t, i % 2 ? 240 : 320);
    if (st.walk && i % 4 === 0) { const w = [0, 4, 7, 9, 10, 7, 5, 2], n = root + w[(i / 4 + bar * 4) % 8]; voice('piano1', N(n), t, 0.2 * L, spb * 3.2); osc('triangle', N(n), t, 0.22 * L, 0.01, spb * 3.4, 1400); }
    if (on(st.bass)) osc('sawtooth', N(root + (st.chug ? 0 : (i === 10 ? 7 : 0))), t, 0.16 * L, 0.004, spb * (st.chug ? 0.8 : 1.6), 1100);
    if (st.pick) { const p = st.pick[i]; const chord = [notes[0], notes[1], notes[2], notes[0] + 12]; voice('guitar', N(chord[p]), t, 0.13 * L, spb * 2); }
    if (st.harp && i === 0 && bar % 2 === 1) { osc('square', N(root + 24), t, 0.03 * L, 0.2, spb * 6, 1600); osc('square', N(root + 28), t, 0.025 * L, 0.2, spb * 6, 1600); }
    if (st.riff && i % 2 === 0) { const r = st.riff[(i / 2 + bar * 8) % 8]; voice('dist', N(40 + r), t, 0.11 * L, spb * 1.6); }
    if (st.chug && i % 2 === 0) for (const n of notes) voice('dist', N(n), t, 0.05 * L, spb * 1.2);
    if (on(st.comp)) for (const n of notes) voice(st.voice, N(n + 12), t, (st.voice === 'piano1' ? 0.09 : 0.06) * L, spb * 2.2);
    if (on(st.stab)) for (const n of notes) voice(st.voice, N(n + 12), t, 0.07 * L, spb * 1.4);
    if (st.drone && i === 0) { osc('sawtooth', N(root + 12), t, 0.06 * L, 0.6, spb * 15, 900); osc('sawtooth', N(root + 19), t, 0.03 * L, 0.6, spb * 15, 900); }
  }
  function playWaltz(st, i, t, spb) {
    // twelve steps a bar: bass on one, chord on two and three, a little tune over the top
    const notes = chordAt(st, S.bar), L = S.lvl;
    if (i === 0) voice('piano', N(notes[0]), t, 0.16 * L, spb * 4);
    if (i === 4 || i === 8) for (const n of notes) voice('piano', N(n), t, 0.06 * L, spb * 3);
    if (i % 4 === 2 && Math.random() < 0.7) voice('piano', N(notes[(Math.random() * notes.length) | 0] + 12), t, 0.07 * L, spb * 3);
  }
  function pump() {
    const c = C(); if (!c || !S.style) return;
    const st = STYLES[S.style], spb = 60 / st.bpm / 4, steps = st.bar || 16;
    while (S.next < c.currentTime + 0.15) {
      const i = S.step, sw = i % 2 ? spb * st.swing : 0;
      if (!S.muted) (st.waltz ? playWaltz : play16)(st, i, S.next + sw, spb);
      S.step = (S.step + 1) % steps; if (S.step === 0) S.bar++;
      S.next += spb;
    }
  }
  return {
    STYLES,
    play(style) {
      if (!C() || style === S.style) { S.want = style; return; }
      S.style = style; S.bar = 0; S.step = 0; S.next = C().currentTime + 0.1;
      const out = bus(); out.gain.cancelScheduledValues(C().currentTime); out.gain.setTargetAtTime(style ? (STYLES[style]?.vol ?? 0.5) : 0, C().currentTime, 0.6);
      clearInterval(S.timer); if (style) S.timer = setInterval(pump, 40);
    },
    start() { if (S.want !== undefined) { const w = S.want; S.want = undefined; this.play(w); } },
    level(v) { S.lvl = v; },
    mute(m) { S.muted = m; },
    get style() { return S.style; },
    get beat() { const c = C(); if (!c || !S.style) return 0; const st = STYLES[S.style]; return 60 / st.bpm; },
    // offline: schedule a medley into an OfflineAudioContext, [[style, t0, t1, level]] in seconds, each style from its own
    // bar one at t0 (the hype film renders the rooms' songs this way, note for note, and cuts the picture to them)
    offline(segs) {
      const out = bus(); out.gain.setValueAtTime(0, 0);
      for (const [style, t0, t1, lvl = 1] of segs) {
        const st = STYLES[style]; if (!st) continue; S.style = style; S.step = 0; S.bar = 0; S.next = t0; S.lvl = lvl; S.muted = false;
        out.gain.setValueAtTime(st.vol, t0);
        const spb = 60 / st.bpm / 4, steps = st.bar || 16;
        while (S.next < t1 - 1e-6) { const i = S.step, sw = i % 2 ? spb * st.swing : 0; (st.waltz ? playWaltz : play16)(st, i, S.next + sw, spb); S.step = (S.step + 1) % steps; if (S.step === 0) S.bar++; S.next += spb; }
      }
      S.style = null;
    },
    barLength(style) { const st = STYLES[style]; return (st.bar || 16) * 60 / st.bpm / 4; },
    // seconds to the nearest beat, for the rhythm game: negative early, positive late
    offBeat() { const c = C(); if (!c || !S.style) return 1; const b = 60 / STYLES[S.style].bpm, ph = (c.currentTime - (S.next - S.step * b / 4)) % b; return ph > b / 2 ? ph - b : ph; },
  };
}
