/* ================================================================
   v70 SHOWTIME (2026-11-22)
   Three dancers and a boombox where the east path meets the ring. Walk up and one of them yells SHOWTIME: the box
   drops a beat, one throws back flips, one goes upside down and spins on his head, one hits poses on the beat, and
   the crowd of residents nearby stops to look. Then the hat comes round: E puts a TDH in it. SHOWTIME starts one.
   ================================================================ */
const SHOW = { d: [], t: 0, on: 0, cool: 0, beat: 0, next: 0 };
window.__SHOW = SHOW;
const SHOW_AT = { x: 41, z: 0 };
(function showtime() {
  const x0 = SHOW_AT.x, z0 = SHOW_AT.z, g0 = ground(x0, z0); SHOW.g0 = g0; SHOW.ry = Math.atan2(-x0, -z0);
  [[0xe2581c, 0x15161a, 'cabbie'], [0x15161a, 0x2a2f45, 'writer'], [0x2962FF, 0x15161a, 'editor']].forEach(([sh, pa, cast], i) => {
    const p = person(sh, pa, SKIN[(i * 2 + 5) % SKIN.length], cast); const a = SHOW.ry + PI + (i - 1) * 0.9, r = i === 1 ? 0 : 1.8;
    SHOW.d.push({ P: p, bx: x0 + Math.sin(a) * r, bz: z0 + Math.cos(a) * r, role: ['flips', 'headspin', 'poses'][i] }); });
  const box = new THREE.Group(); box.position.set(x0 + Math.sin(SHOW.ry) * 1.2, g0, z0 + Math.cos(SHOW.ry) * 1.2); box.rotation.y = SHOW.ry; scene.add(box);
  const bm = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.5, metalness: 0.3 }); const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.38, 0.2), bm); body.position.y = 0.19; box.add(body);
  [-0.2, 0.2].forEach(x => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.9 })); s.rotation.x = PI / 2; s.position.set(x, 0.19, 0.105); box.add(s); SHOW.cones = (SHOW.cones || []).concat(s); });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 16, PI), new THREE.MeshStandardMaterial({ color: 0xbfc3c7, metalness: 0.9, roughness: 0.3 })); handle.position.y = 0.38; box.add(handle);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.9, side: THREE.DoubleSide })); hat.position.set(x0 + Math.sin(SHOW.ry) * 1.5 + Math.cos(SHOW.ry) * 0.6, g0 + 0.04, z0 + Math.cos(SHOW.ry) * 1.5 - Math.sin(SHOW.ry) * 0.6); scene.add(hat);
  interact(x0 + Math.sin(SHOW.ry) * 2, z0 + Math.cos(SHOW.ry) * 2, 2.6, 'E · TIP THE CREW (1 TDH)', () => { state.tdh = Math.max(0, state.tdh - 1); try { hud(); } catch (e) { } showSecret(); toast('THEY SAY THANK YOU, EVERYBODY, NO PHOTOS WITHOUT A DOLLAR, THANK YOU.'); });
  if (window.__MAP) MAP.places.push(['SHOWTIME', x0, z0, x0 + Math.sin(SHOW.ry) * 4, z0 + Math.cos(SHOW.ry) * 4]);
})();
const showSecret = secret('showtime', () => { }, []);
function showStart(word) { if (SHOW.on > 0) return; SHOW.on = 22; SHOW.t = 0; SHOW.next = 0; SHOW.beat = 0; toast(word ? 'SHOWTIME! (YOU ASKED.)' : 'WHAT TIME IS IT? SHOWTIME!', 'blue'); }
EGGS.showtime = () => showStart(true); EGGS.showtime.__s = true;
function showDrum(type, t0, vol) { if (!AC) return; try { if (type === 'k') { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.14); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + 0.25); }
  else { const n = Math.floor(AC.sampleRate * (type === 's' ? 0.16 : 0.04)), b = AC.createBuffer(1, n, AC.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, type === 's' ? 2 : 4);
    const s = AC.createBufferSource(); s.buffer = b; const f = AC.createBiquadFilter(); f.type = type === 's' ? 'bandpass' : 'highpass'; f.frequency.value = type === 's' ? 1800 : 7000; const g = AC.createGain(); g.gain.value = vol * (type === 's' ? 0.9 : 0.35); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t0); } } catch (e) { } }
function showFrame(dt) {
  const d = Math.hypot(P.x - SHOW_AT.x, P.z - SHOW_AT.z); if (d > 90) return;
  SHOW.cool = Math.max(0, SHOW.cool - dt); if (SHOW.on <= 0 && d < 8 && SHOW.cool <= 0) showStart(false);
  const on = SHOW.on > 0; if (on) { SHOW.on -= dt; SHOW.t += dt; if (SHOW.on <= 0) { SHOW.cool = 50; toast('THE HAT COMES ROUND. E TO TIP.'); } }
  const bpm = 98, spb = 60 / bpm, bt = SHOW.t / spb;
  // the beat, scheduled a little ahead, only if sound is on and you are close
  if (on && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0 && d < 30) { const vol = Math.min(0.12, 2 / (d + 3)); while (SHOW.next < SHOW.t + 0.25) { const step = Math.round(SHOW.next / (spb / 2)), t0 = AC.currentTime + (SHOW.next - SHOW.t);
      if (t0 >= AC.currentTime) { if (step % 8 === 0 || step % 8 === 5) showDrum('k', t0, vol); if (step % 4 === 2) showDrum('s', t0, vol); showDrum('h', t0, vol * 0.8); } SHOW.next += spb / 2; } }
  if (SHOW.cones) SHOW.cones.forEach(c => c.scale.setScalar(on ? 1 + Math.max(0, Math.cos(bt * PI * 2)) * 0.12 : 1));
  SHOW.d.forEach((s, i) => { const g = s.P.g; let y = SHOW.g0 - 0.35, rx = 0, ry = SHOW.ry + PI, rz = 0;
    if (!on) { ry += Math.sin(LIFE.t * 0.5 + i) * 0.2; y += Math.abs(Math.sin(LIFE.t * 2 + i)) * 0.02; }
    else if (s.role === 'flips') { const ph = (bt / 4) % 1; if (ph < 0.35) { const u = ph / 0.35; rx = -u * PI * 2; y += Math.sin(u * PI) * 1.2 + 0.9 * (1 - Math.cos(rx)); } else y += Math.abs(Math.sin(bt * PI)) * 0.06; }
    else if (s.role === 'headspin') { const ph = (SHOW.t % 11) / 11; if (ph > 0.15 && ph < 0.85) { rx = PI; y += 1.9; ry += SHOW.t * 9; } else y += Math.abs(Math.sin(bt * PI)) * 0.08; }
    else { ry += Math.round(bt / 2) % 2 ? 0.7 : -0.7; rz = Math.round(bt) % 2 ? 0.12 : -0.12; y += Math.abs(Math.sin(bt * PI)) * 0.1; }
    g.position.set(s.bx, y, s.bz); g.rotation.set(rx, ry, rz, 'YXZ'); });
}
window.__FRAMES.push(dt => { try { showFrame(dt); } catch (e) { if (!SHOW.err) { SHOW.err = e; console.warn('v70 showtime', e); } } });
