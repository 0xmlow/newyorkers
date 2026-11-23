/* ================================================================
   v143 THE BELL TOWER (2026-11-23)
   A white clapboard bell tower at (55, 33) with an open belfry, a bronze bell, a spire and a weather vane that
   turns to the wind. From seven in the morning to ten at night it chimes the Westminster quarters on the
   quarter hours and strikes the hour on the big bell, and you can see the bell swing for every note. The bell is
   synthesised the way real bells sound (a hum an octave down, the strike, the minor third that makes a bell a
   bell, the quint and the upper partials, each dying at its own rate). E at the door climbs to the belfry; be
   up there when it rings.
   ================================================================ */
const BELLS = { X: 55, Z: 33, lastQ: -1, hits: [], swing: 0 };
window.__BELLS = BELLS;
(function bellTower() {
  const X = BELLS.X, Z = BELLS.Z, g0 = ground(X, Z), S = 3.2, H1 = 9, H2 = 3; BELLS.g0 = g0;
  const clap = (() => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d'); if (c && c.fillRect) { c.fillStyle = '#f2f0ea'; c.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 16) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, y + 13, 64, 3); } } const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 4); t.encoding = THREE.sRGBEncoding; return t; })();
  const white = new THREE.MeshStandardMaterial({ map: clap, roughness: 0.7 }), trim = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.6 }), roof = new THREE.MeshStandardMaterial({ color: 0x2f3a3a, roughness: 0.6, metalness: 0.3 }), bronze = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.3, metalness: 1 });
  const B = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
  B(S, H1, S, white, X, g0 + H1 / 2, Z); B(S + 0.3, 0.25, S + 0.3, trim, X, g0 + H1, Z);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => B(0.35, H2, 0.35, trim, X + a * (S / 2 - 0.17), g0 + H1 + H2 / 2, Z + b * (S / 2 - 0.17)));
  B(S + 0.3, 0.3, S + 0.3, trim, X, g0 + H1 + H2, Z); [-1, 1].forEach(s => { B(S, 0.9, 0.08, trim, X, g0 + H1 + 0.45, Z + s * (S / 2 - 0.04)); B(0.08, 0.9, S, trim, X + s * (S / 2 - 0.04), g0 + H1 + 0.45, Z); });
  const sp = new THREE.Mesh(new THREE.ConeGeometry(S * 0.72, 4.5, 4), roof); sp.rotation.y = PI / 4; sp.position.set(X, g0 + H1 + H2 + 2.4, Z); sp.castShadow = true; scene.add(sp);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.5 })); door.position.set(X - S / 2 - 0.01, g0 + 1.1, Z); door.rotation.y = -PI / 2; scene.add(door);
  const pts = []; [[0, 0], [0.14, 0], [0.16, 0.08], [0.2, 0.3], [0.32, 0.62], [0.44, 0.86], [0.47, 0.92], [0.45, 0.94], [0, 0.94]].forEach(([r, y]) => pts.push(new THREE.Vector2(r * 1.6, -y * 1.6)));
  const bell = new THREE.Group(); bell.position.set(X, g0 + H1 + H2 - 0.45, Z); scene.add(bell); BELLS.bell = bell; const bm = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), Object.assign(bronze.clone(), { side: THREE.DoubleSide })); bm.castShadow = true; bell.add(bm);
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(S - 0.5, 0.18, 0.22), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 })); yoke.position.set(X, g0 + H1 + H2 - 0.38, Z); scene.add(yoke);
  const vane = new THREE.Group(); vane.position.set(X, g0 + H1 + H2 + 4.8, Z); scene.add(vane); BELLS.vane = vane; const vm = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), vm); rod.position.y = 0.4; vane.add(rod); const arrow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.04), vm); arrow.position.y = 0.6; vane.add(arrow);
  const tailv = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.3), vm); tailv.position.set(-0.6, 0.65, 0); vane.add(tailv); const ro = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), vm); ro.scale.set(1.3, 1, 1); ro.position.set(0.05, 0.95, 0); vane.add(ro);
  boxWalls(X, Z, S, S, 0, -5, g0 + H1 + 0.95); padRect(X - S / 2 + 0.2, X + S / 2 - 0.2, Z - S / 2 + 0.2, Z + S / 2 - 0.2, g0 + H1 + 0.13, g0 + H1 - 0.6);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => post(X + a * (S / 2 - 0.17), Z + b * (S / 2 - 0.17), 0.22, g0 + H1, g0 + H1 + H2));
  BELLS.H1 = H1; interact(X + 0.7, Z, 1.3, "E · CLIMB DOWN", () => { teleport(X - S / 2 - 1.4, Z, -PI / 2); }, g0 + H1 + 0.13); interact(X - S / 2 - 0.9, Z, 1.6, 'E · CLIMB TO THE BELFRY', () => { teleport(X, Z, PI / 2, H1 + 3); P.y = g0 + H1 + 0.13; toast('NINETY TWO STEPS UP A LADDER. THE ISLAND FROM THE BELFRY.'); });
  if (window.__MAP) MAP.places.push(['THE BELL TOWER', X, Z, X - S / 2 - 1.5, Z]);
})();
const bellSecret = secret('bells', () => { toast('YOU WERE IN THE BELFRY WHEN IT RANG. YOUR EARS WILL BE FINE IN A DAY OR TWO.', 'blue'); });
function bellStrike(f, when, vol) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; const t0 = AC.currentTime + when;
  try { [[0.5, 0.5, 9], [1, 1, 4], [1.2, 0.55, 3.2], [1.5, 0.35, 2.4], [2, 0.42, 2], [2.5, 0.2, 1.4], [3, 0.16, 1.1], [4.2, 0.1, 0.7]].forEach(([r, a, dec]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f * r; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol * a, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dec); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + dec + 0.05); }); } catch (e) { } }
const WESTM = [[415.3, 370, 329.6, 246.9], [329.6, 415.3, 370, 246.9], [329.6, 370, 415.3, 329.6], [415.3, 329.6, 370, 246.9], [246.9, 370, 415.3, 329.6]];
function bellsRing(q, hour) { const sets = q === 1 ? [0] : q === 2 ? [1, 2] : q === 3 ? [3, 4, 0] : [1, 2, 3, 4]; const d = Math.hypot(P.x - BELLS.X, P.z - BELLS.Z), vol = Math.min(0.09, 9 / (d + 12)); if (d > 260) return; let t = 0;
  sets.forEach(s => { WESTM[s].forEach(f => { bellStrike(f, t, vol * 0.7); BELLS.hits.push(LIFE.t + t); t += 0.8; }); t += 0.9; });
  if (q === 0) { t += 1.2; const n = hour % 12 || 12; for (let i = 0; i < n; i++) { bellStrike(164.8, t, vol); BELLS.hits.push(LIFE.t + t); t += 2.2; } }
  BELLS.until = LIFE.t + t + 2; }
EGGS.BELLS = () => { const h = nycTime(TIME.utc).h; bellsRing(0, h); };
function bellsFrame(dt) {
  const t = nycTime(TIME.utc), qm = t.m % 15 === 0 ? t.m / 15 : -1, key = t.days * 100 + t.h * 4 + (qm < 0 ? 0 : qm);
  if (qm >= 0 && key !== BELLS.lastQ && (t.sec % 60) < 5 && t.hours >= 7 && t.hours < 22.01) { BELLS.lastQ = key; bellsRing(qm, t.h); }
  BELLS.vane.rotation.y += (Math.sin(LIFE.t * 0.05) * 0.8 + 2.2 - BELLS.vane.rotation.y) * Math.min(1, dt * 0.5) + Math.sin(LIFE.t * 1.3) * 0.004;
  let sw = 0; BELLS.hits = BELLS.hits.filter(h => LIFE.t - h < 3); BELLS.hits.forEach(h => { const u = LIFE.t - h; if (u > 0) sw += Math.sin(u * 5) * Math.exp(-u * 1.6) * 0.18; }); BELLS.bell.rotation.x = sw;
  const up = P.y > BELLS.g0 + BELLS.H1 - 0.5 && Math.hypot(P.x - BELLS.X, P.z - BELLS.Z) < 2.5; if (up && BELLS.until && LIFE.t < BELLS.until) bellSecret();
}
window.__FRAMES.push(dt => { try { bellsFrame(dt); } catch (e) { if (!BELLS.err) { BELLS.err = e; console.warn('v143 bells', e); } } });
