/* ================================================================
   v153 THE TELESCOPE (2026-11-23)
   An amateur astronomer sets up a big white refractor on the north lawn at (-52, -64) every clear night and lets
   anyone look. E puts your eye to the eyepiece: when the moon is up you see it, at tonight's real phase, craters
   along the terminator, drifting slowly out of the field as the earth turns; when it is down he has swung round
   to Saturn and its rings. By day the tube wears a solar filter and you see the sun, orange, with today's
   sunspots. Any move key or E to look away.
   ================================================================ */
const SCOPE = { X: -52, Z: -64, open: false, t: 0 };
window.__SCOPE = SCOPE;
(function telescope() {
  const X = SCOPE.X, Z = SCOPE.Z, g0 = ground(X, Z); SCOPE.g0 = g0; const g = new THREE.Group(); g.position.set(X, g0, Z); scene.add(g); SCOPE.g = g;
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.6 }), white = new THREE.MeshStandardMaterial({ color: 0xf0f0ec, roughness: 0.3, metalness: 0.2 });
  [0, 2.1, 4.2].forEach(a => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 1.4, 6), black); l.position.set(Math.cos(a) * 0.3, 0.65, Math.sin(a) * 0.3); l.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); g.add(l); });
  const head = new THREE.Group(); head.position.y = 1.35; g.add(head); SCOPE.head = head; const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 1.4, 16), white); tube.rotation.x = PI / 2; tube.position.z = 0.25; head.add(tube);
  const dew = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.3, 16), black); dew.rotation.x = PI / 2; dew.position.z = 1.0; head.add(dew); SCOPE.filter = new THREE.Mesh(new THREE.CircleGeometry(0.095, 16), new THREE.MeshStandardMaterial({ color: 0x8a7a4a, metalness: 1, roughness: 0.2 })); SCOPE.filter.position.z = 1.151; head.add(SCOPE.filter);
  const ep = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), black); ep.position.set(0, 0.06, -0.42); head.add(ep);
  const astro = person(0x2a2f45, 0x15161a, SKIN[0], 'writer'); scene.remove(astro.g); astro.g.position.set(0.7, -0.35, -0.3); astro.g.rotation.y = -0.6; g.add(astro.g); SCOPE.astro = astro;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false })); lamp.position.set(0.95, 1.05, -0.1); g.add(lamp); SCOPE.lamp = lamp;
  post(X, Z, 0.35, -5, g0 + 1.5);
  const div = document.createElement('div'); div.id = 'scopeView'; div.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#000;z-index:60;pointer-events:none';
  const cv = document.createElement('canvas'); cv.width = cv.height = 720; cv.style.cssText = 'width:min(86vh,86vw);height:min(86vh,86vw);border-radius:50%;box-shadow:0 0 80px 20px #000 inset'; div.appendChild(cv);
  const cap = document.createElement('div'); cap.style.cssText = 'position:absolute;bottom:4vh;left:0;right:0;text-align:center;color:#c8c8c8;font:12px/1.4 monospace;letter-spacing:.2em'; div.appendChild(cap); SCOPE.cap = cap;
  document.body.appendChild(div); SCOPE.div = div; SCOPE.cv = cv;
  interact(X - 0.6, Z - 0.5, 1.6, 'E · LOOK THROUGH THE TELESCOPE', () => scopeToggle());
  if (window.__MAP) MAP.places.push(['THE TELESCOPE', X, Z, X - 1, Z - 1]);
})();
const scopeSecret = secret('telescope', () => { toast('YOU LOOKED AT THE MOON THROUGH A STRANGER\x27S TELESCOPE IN THE MIDDLE OF THE CITY. HE SAYS EVERYONE GASPS THE FIRST TIME. YOU DID.', 'blue'); });
function scopeAge() { const jd = TIME.utc / 86400 + 2440587.5; return (((jd - 2451550.1) / 29.530588853) % 1 + 1) % 1; }
function scopeToggle() { SCOPE.open = !SCOPE.open; SCOPE.div.style.display = SCOPE.open ? 'flex' : 'none'; SCOPE.t = 0; SCOPE.p0 = [P.x, P.z]; if (SCOPE.open) { SCOPE.seed = 7; scopeDraw(); } }
function scopeTarget() { if (SKY.el > -3) return 'sun'; if (SKY.moonDir && SKY.moonDir.y > 0.05) return 'moon'; return 'saturn'; }
function scopeDraw() {
  const c = SCOPE.cv.getContext('2d'); if (!c || !c.arc) return; const W = 720, tgt = scopeTarget(), drift = SCOPE.t * 4; c.fillStyle = '#000'; c.fillRect(0, 0, W, W); const cx = W / 2 + drift - 40, cy = W / 2 + drift * 0.3;
  let rs = 1; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
  if (tgt === 'moon') { const R = 260, age = scopeAge(); c.save(); c.beginPath(); c.arc(cx, cy, R, 0, PI * 2); c.clip(); const g = c.createRadialGradient(cx - 60, cy - 60, 20, cx, cy, R); g.addColorStop(0, '#e8e6df'); g.addColorStop(1, '#a8a69e'); c.fillStyle = g; c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      c.fillStyle = 'rgba(80,80,78,.35)'; [[-80, -60, 90], [40, 70, 70], [90, -90, 50], [-40, 110, 40], [-120, 40, 60]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(cx + x, cy + y, r, r * 0.8, 0.4, 0, PI * 2); c.fill(); });
      for (let i = 0; i < 160; i++) { const a = rnd() * PI * 2, d = Math.sqrt(rnd()) * R, r = 2 + rnd() * rnd() * 22, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; c.strokeStyle = 'rgba(60,60,58,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.stroke(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.25, r * 0.6, 0, PI * 2); c.fill(); }
      // the shadow: a terminator ellipse for tonight's phase (waxing lit on the right)
      const ph = Math.cos(age * 2 * PI), lightRight = age < 0.5; c.fillStyle = 'rgba(0,0,0,.94)'; c.beginPath(); if (lightRight) { c.arc(cx, cy, R, PI / 2, PI * 1.5); c.ellipse(cx, cy, Math.abs(ph) * R, R, 0, PI * 1.5, PI / 2, ph < 0); } else { c.arc(cx, cy, R, -PI / 2, PI / 2); c.ellipse(cx, cy, Math.abs(ph) * R, R, 0, PI / 2, PI * 1.5, ph < 0); } c.fill(); c.restore();
      SCOPE.cap.textContent = 'THE MOON · ' + Math.round((1 - ph) * 50) + '% LIT · ' + Math.round(age * 29.53) + ' DAYS OLD'; }
  else if (tgt === 'saturn') { c.fillStyle = '#fff'; for (let i = 0; i < 60; i++) c.fillRect(rnd() * W, rnd() * W, 1.5, 1.5); const R = 46; c.save(); c.translate(cx, cy); c.rotate(-0.4); c.strokeStyle = 'rgba(220,200,150,.85)'; c.lineWidth = 10; c.beginPath(); c.ellipse(0, 0, R * 2.3, R * 0.55, 0, PI, PI * 2); c.stroke();
      const g = c.createRadialGradient(-12, -12, 4, 0, 0, R); g.addColorStop(0, '#f2dca0'); g.addColorStop(1, '#a8885a'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(0, 0, R * 2.3, R * 0.55, 0, 0, PI); c.stroke(); c.restore(); SCOPE.cap.textContent = 'SATURN · THE MOON IS DOWN, SO HE FOUND YOU SOMETHING BETTER'; }
  else { const R = 250, g = c.createRadialGradient(cx, cy, 10, cx, cy, R); g.addColorStop(0, '#ffb24a'); g.addColorStop(0.85, '#f08a1a'); g.addColorStop(1, '#a8480a'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, PI * 2); c.fill(); rs = nycTime(TIME.utc).days;
      for (let i = 0; i < 7; i++) { const a = rnd() * PI * 2, d = rnd() * R * 0.7, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.5, r = 4 + rnd() * 9; c.fillStyle = 'rgba(120,50,10,.7)'; c.beginPath(); c.arc(x, y, r * 1.8, 0, PI * 2); c.fill(); c.fillStyle = '#2a1006'; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); } SCOPE.cap.textContent = 'THE SUN · THROUGH A SOLAR FILTER · TODAY\x27S SUNSPOTS'; }
}
function scopeFrame(dt) {
  const night = (L.lamps || 0) > 0.4, tgt = scopeTarget(); SCOPE.astro.g.visible = night; SCOPE.filter.visible = tgt === 'sun'; SCOPE.lamp.visible = night;
  const dir = tgt === 'moon' ? SKY.moonDir : tgt === 'sun' ? SKY.sunDir : _scd.set(-0.4, 0.45, 0.8).normalize(); if (dir) { const yaw = Math.atan2(dir.x, dir.z), pit = Math.asin(Math.max(-1, Math.min(1, dir.y))); SCOPE.head.rotation.set(-Math.max(0.1, pit), yaw, 0, 'YXZ'); }
  if (!SCOPE.open) return; SCOPE.t += dt; if (SCOPE.t > 0.4 && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || joy.x || joy.y || Math.hypot(P.x - SCOPE.p0[0], P.z - SCOPE.p0[1]) > 1)) { scopeToggle(); return; }
  scopeDraw(); if (tgt === 'moon' && SCOPE.t > 3) scopeSecret();
}
const _scd = new V3();
window.__FRAMES.push(dt => { try { scopeFrame(dt); } catch (e) { if (!SCOPE.err) { SCOPE.err = e; console.warn('v153 telescope', e); } } });
