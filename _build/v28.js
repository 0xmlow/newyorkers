/* ================================================================
   v28 THE NIGHT SKY (2026-11-22)
   After dark: shooting stars every so often (type WISH within six seconds of one and it counts), satellites
   that cross slowly, the jet gets its blinking wingtip lights. METEORS starts a shower; STARS joins the stars
   into an evil eye constellation overhead for a little while.
   ================================================================ */
const NSKY = { streaks: [], next: 12, lastStar: -99, shower: 0, sats: [], eye: null, eyeT: 0 };
window.__NSKY = NSKY;
(function streaks() {
  for (let i = 0; i < 8; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })); l.frustumCulled = false; l.visible = false; scene.add(l); NSKY.streaks.push({ l, t: -1 }); }
  const sm = new THREE.PointsMaterial({ size: 2.2, color: 0xffffff, sizeAttenuation: false, transparent: true, toneMapped: false, fog: false });
  for (let i = 0; i < 3; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3), 3)); const p = new THREE.Points(g, sm); p.frustumCulled = false; scene.add(p); NSKY.sats.push({ p, ph: i * 2.1, sp: 0.012 + i * 0.004, tilt: 0.3 + i * 0.4 }); }
  // the constellation: a ring of twelve stars, a pupil, joined by faint lines
  const pts = []; const C = new THREE.Vector3(0, 520, -260); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; pts.push(new THREE.Vector3(C.x + Math.cos(a) * 160, C.y + Math.sin(a) * 90, C.z + Math.sin(a) * 40)); }
  const seg = []; for (let i = 0; i < 12; i++) seg.push(pts[i], pts[(i + 1) % 12]); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; seg.push(new THREE.Vector3(C.x + Math.cos(a) * 45, C.y + Math.sin(a) * 30, C.z), new THREE.Vector3(C.x + Math.cos(a + PI / 3) * 45, C.y + Math.sin(a + PI / 3) * 30, C.z)); }
  const lg = new THREE.BufferGeometry().setFromPoints(seg); const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x7fb0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })); lines.frustumCulled = false; scene.add(lines);
  const sg = new THREE.BufferGeometry().setFromPoints(seg); const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 4, color: 0xffffff, sizeAttenuation: false, transparent: true, opacity: 0, toneMapped: false, fog: false })); stars.frustumCulled = false; scene.add(stars);
  NSKY.eye = { lines, stars };
})();
function shootingStar() {
  const s = NSKY.streaks.find(q => q.t < 0); if (!s) return; const a = Math.random() * PI * 2, r = 250 + Math.random() * 300, y = 260 + Math.random() * 200;
  s.x = Math.cos(a) * r + P.x; s.z = Math.sin(a) * r + P.z; s.y = y; const d = Math.random() * PI * 2; s.dx = Math.cos(d) * 260; s.dz = Math.sin(d) * 260; s.dy = -90 - Math.random() * 60; s.t = 0; s.dur = 0.6 + Math.random() * 0.5; s.l.visible = true; NSKY.lastStar = LIFE.t;
}
const wishSecret = secret('wish', () => { }, []);
EGGS.wish = () => { if (LIFE.t - NSKY.lastStar < 6) { wishSecret(); toast('WISH MADE. THE SHOOTING STAR SAID IT IS NOT FINANCIAL ADVICE.', 'blue'); flash('#0D0D0D'); } else toast((L.lamps || 0) > 0.5 ? 'WAIT FOR A SHOOTING STAR, THEN TYPE WISH.' : 'WISHES WORK BETTER AFTER DARK.'); };
EGGS.wish.__s = true;
secret('meteors', () => { NSKY.shower = 20; toast('A METEOR SHOWER OVER THE HARBOUR. LOOK UP. MAKE A WISH.'); }, ['meteors', 'meteor', 'shootingstar']);
secret('stars', () => { NSKY.eyeT = 18; toast('THE STARS ARRANGE THEMSELVES INTO AN EVIL EYE. THEY HAVE BEEN WATCHING THE WHOLE TIME.'); }, ['stars', 'constellation']);
function nskyFrame(dt) {
  const night = Math.min(1, Math.max(0, (L.lamps || 0) * 1.4 - 0.2));
  if (NSKY.shower > 0) NSKY.shower -= dt;
  NSKY.next -= dt * (NSKY.shower > 0 ? 12 : 1); if (NSKY.next <= 0) { NSKY.next = 18 + Math.random() * 25; if (night > 0.4 || NSKY.shower > 0) shootingStar(); }
  NSKY.streaks.forEach(s => { if (s.t < 0) return; s.t += dt; const k = s.t / s.dur; if (k >= 1) { s.t = -1; s.l.visible = false; return; }
    const p = s.l.geometry.attributes.position, hx = s.x + s.dx * k, hy = s.y + s.dy * k, hz = s.z + s.dz * k, tail = Math.min(k, 0.25); p.setXYZ(0, hx, hy, hz); p.setXYZ(1, hx - s.dx * tail, hy - s.dy * tail, hz - s.dz * tail); p.needsUpdate = true;
    const c = s.l.geometry.attributes.color, b = Math.sin(k * PI); c.setXYZ(0, b * 1.4, b * 1.4, b * 1.6); c.needsUpdate = true; });
  NSKY.sats.forEach(q => { const a = LIFE.t * q.sp + q.ph; const p = q.p.geometry.attributes.position; p.setXYZ(0, Math.cos(a) * 600, 380 + Math.sin(a * 2) * 20, Math.sin(a) * 600 * Math.cos(q.tilt)); p.needsUpdate = true; q.p.visible = night > 0.5 && Math.sin(a * 0.5) > 0; });
  if (NSKY.eyeT > 0) NSKY.eyeT -= dt; const eo = NSKY.eyeT > 0 ? Math.min(1, NSKY.eyeT / 3, (18 - NSKY.eyeT) / 3) : 0; NSKY.eye.lines.material.opacity = eo * 0.55 * Math.max(0.35, night); NSKY.eye.stars.material.opacity = eo; NSKY.eye.lines.visible = NSKY.eye.stars.visible = eo > 0;
}
window.__FRAMES.push(dt => { try { nskyFrame(dt); } catch (e) { if (!NSKY.err) { NSKY.err = e; console.warn('v28 sky', e); } } });
