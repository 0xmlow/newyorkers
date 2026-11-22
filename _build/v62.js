/* ================================================================
   v62 HARBOUR FOG (2026-11-22)
   On some mornings (one in three, decided by the date) a fog bank sits on the harbour round the island from first
   light until the sun is up: long soft walls of it lying on the water, drifting, thinning as they come near the
   shore, and the lighthouse answers with a two tone foghorn every half minute. FOG rolls it in at any hour.
   ================================================================ */
const FOGB = { b: [], k: 0, want: 0, until: 0, t: 0, horn: 12 };
window.__FOGB = FOGB;
(function fogBank() {
  const n = isMobile ? 26 : 54;
  for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + Math.random() * 0.1, r = 112 + Math.random() * 70, w = 50 + Math.random() * 60, h = 9 + Math.random() * 10;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: LIFE.soft, transparent: true, opacity: 0, depthWrite: false, color: 0xd8dde0, fog: false }));
    m.renderOrder = 4; m.visible = false; scene.add(m); FOGB.b.push({ m, a, r, y: h * 0.32 + Math.random() * 3, sp: (Math.random() - 0.5) * 0.004, ph: Math.random() * 6, o: 0.6 + Math.random() * 0.3 }); }
})();
const fogSecret = secret('fog', () => { FOGB.until = FOGB.t + 120; toast('THE HARBOUR PULLS A BLANKET OVER ITSELF. THE LIGHTHOUSE STARTS COMPLAINING.', 'blue'); }, ['fog', 'foghorn', 'fogbank']);
function fogHorn() { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; const d = Math.hypot(P.x - 0, P.z + 126), vol = Math.max(0.015, Math.min(0.1, 30 / (d + 10)));
  try { [[175, 0, 1.6], [131, 1.7, 2.2]].forEach(([hz, w, len]) => { const t0 = AC.currentTime + w + Math.min(1, d / 343), o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = hz; o2.frequency.value = hz * 1.005; f.type = 'lowpass'; f.frequency.value = 420; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.3); g.gain.setValueAtTime(vol, t0 + len - 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(AC.destination); o.start(t0); o2.start(t0); o.stop(t0 + len + 0.05); o2.stop(t0 + len + 0.05); }); } catch (e) { } }
function fogFrame(dt) {
  FOGB.t += dt; const h = (SKY.t && SKY.t.h) || 12, el = SKY.el || 0, d = SKY.t && SKY.t.d ? SKY.t.d : (new Date()).getDate();
  const morning = h >= 4 && h < 11 && el < 12 && (d % 3 === 0); FOGB.want = (morning ? Math.min(1, (12 - el) / 8) : 0); if (FOGB.until > FOGB.t) FOGB.want = 1;
  if (window.__CALM) FOGB.want *= 0.6; FOGB.k += (FOGB.want - FOGB.k) * Math.min(1, dt * 0.25);
  const on = FOGB.k > 0.01; const day = Math.max(0, Math.min(1, (el + 6) / 16)), night = Math.min(1, (L.lamps || 0) * 1.4);
  const cr = 0.3 + 0.6 * day, cg = 0.32 + 0.6 * day, cb = 0.38 + 0.56 * day;
  FOGB.b.forEach(b => { b.m.visible = on; if (!on) return; b.a += b.sp * dt; const r = b.r + Math.sin(FOGB.t * 0.02 + b.ph) * 14, x = Math.sin(b.a) * r, z = Math.cos(b.a) * r;
    b.m.position.set(x, b.y + Math.sin(FOGB.t * 0.05 + b.ph) * 0.6, z); b.m.lookAt(camera.position.x, b.m.position.y, camera.position.z);
    const dc = Math.hypot(camera.position.x - x, camera.position.z - z), near = Math.min(1, Math.max(0, (dc - 12) / 35));   // thin out when you are in it
    b.m.material.opacity = b.o * FOGB.k * near; b.m.material.color.setRGB(cr + 0.1 * night, cg + 0.08 * night, cb + 0.04 * night); });
  if (on && FOGB.k > 0.35) { FOGB.horn -= dt; if (FOGB.horn <= 0) { FOGB.horn = 30; fogHorn(); } } else FOGB.horn = Math.min(FOGB.horn, 6);
}
window.__FRAMES.push(dt => { try { fogFrame(dt); } catch (e) { if (!FOGB.err) { FOGB.err = e; console.warn('v62 fog', e); } } });
