/* ================================================================
   v57 N3W BIKE (2026-11-22)
   A bike share dock at (-18, 84), on the way down to GM BEACH: six evil eye blue bikes in a row and a kiosk. E takes
   one out and you ride: a little over twice walking speed, the bars and the basket in front of you swaying as you
   pedal, B rings the bell. E at the dock again puts it back. BIKE (or CITIBIKE) finds you one leaning on a pole.
   ================================================================ */
const BIKE = { on: false, dist: 0, docked: [], lx: 0, lz: 0, sway: 0 };
window.__BIKE_ = BIKE;
const BIKE_AT = { x: -5, z: 76 };
function bikeModel(scale) {
  const g = new THREE.Group(), blue = new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.35, metalness: 0.3 }), black = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 }), chrome = new THREE.MeshStandardMaterial({ color: 0xbfc3c7, roughness: 0.25, metalness: 0.9 });
  const tube = (a, b, r, m) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), m); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(c); return c; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wheels = [-0.52, 0.52].map(x => { const w = new THREE.Group(); w.position.set(x, 0.33, 0); const t = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 8, 28), black); w.add(t);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.4, transparent: true, opacity: 0.85 })); hub.rotation.x = PI / 2; w.add(hub); g.add(w); return w; });
  tube(V(-0.52, 0.33, 0), V(-0.1, 0.36, 0), 0.03, blue); tube(V(-0.1, 0.36, 0), V(0.42, 0.78, 0), 0.04, blue); tube(V(-0.52, 0.33, 0), V(-0.22, 0.8, 0), 0.025, blue);
  tube(V(-0.1, 0.36, 0), V(-0.24, 0.86, 0), 0.035, blue); tube(V(0.52, 0.33, 0), V(0.42, 0.95, 0), 0.03, chrome);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.13), black); seat.position.set(-0.26, 0.9, 0); g.add(seat);
  tube(V(0.4, 0.98, -0.28), V(0.4, 0.98, 0.28), 0.018, chrome);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.34), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.6, wireframe: false })); basket.position.set(0.66, 0.86, 0); g.add(basket);
  const chainring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16), chrome); chainring.position.set(-0.1, 0.36, 0.05); g.add(chainring);
  g.scale.setScalar(scale || 1); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); g.userData.wheels = wheels; return g;
}
(function bikeDock() {
  const x0 = BIKE_AT.x, z0 = BIKE_AT.z, g0 = ground(x0, z0), ry = PI / 2; BIKE.ry = ry;
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.45, metalness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.08, 0.5), steel); base.position.set(x0, g0 + 0.04, z0); base.rotation.y = ry; scene.add(base);
  const fx = Math.sin(ry), fz = Math.cos(ry), rx = Math.cos(ry), rz = -Math.sin(ry);
  for (let i = 0; i < 6; i++) { const o = -3 + i * 1.2 + 0.6, x = x0 + rx * o, z = z0 + rz * o;
    const pst = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.22), steel); pst.position.set(x, g0 + 0.35, z); pst.rotation.y = ry; scene.add(pst);
    const b = bikeModel(1); b.position.set(x + fx * 0.75, g0, z + fz * 0.75); b.rotation.y = ry + PI / 2; scene.add(b); BIKE.docked.push(b); }
  // the kiosk: a blue pillar with a lit screen and a map
  const k = new THREE.Group(); k.position.set(x0 + rx * 4.3, g0, z0 + rz * 4.3); k.rotation.y = ry; scene.add(k);
  const pill = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.7, 0.36), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.4 })); pill.position.y = 0.85; k.add(pill);
  const scr = signTex([{ t: 'N3W BIKE', s: 0.3 }, { t: 'E TO RIDE', s: 0.16 }, { t: 'B RINGS THE BELL', s: 0.12 }], 512, 512, '#0D0D0D', '#efe8da');
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.38), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })); sm.position.set(0, 1.3, 0.181); k.add(sm);
  post(x0 + rx * 4.3, z0 + rz * 4.3, 0.35, -5, 2);
  interact(x0 + fx * 1.4, z0 + fz * 1.4, 4.2, 'E · N3W BIKE (RIDE OR DOCK)', () => { BIKE.on ? bikeDockIt() : bikeRent(); });
  // the bars in front of you while riding (children of the camera)
  const bars = new THREE.Group(), chrome = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, roughness: 0.25, metalness: 0.9 }), grip = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 });
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 10), chrome); hb.rotation.z = PI / 2; bars.add(hb);
  [-0.29, 0.29].forEach(x => { const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.12, 10), grip); gr.rotation.z = PI / 2; gr.position.x = x; bars.add(gr); });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), chrome); stem.position.set(0, -0.15, -0.03); bars.add(stem);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.22), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.5 })); bk.position.set(0, -0.14, -0.24); bars.add(bk);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8, 0, PI * 2, 0, PI / 2), chrome); bell.position.set(0.18, 0.02, 0); bars.add(bell);
  const fwheel = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 8, 28, PI * 0.7), grip); fwheel.rotation.set(0, PI / 2, PI * 0.15); fwheel.position.set(0, -0.5, -0.36); bars.add(fwheel);
  bars.position.set(0, -0.36, -0.6); bars.visible = false; BIKE.bars = bars; bars.traverse(m => { if (m.isMesh) m.frustumCulled = false; });
  if (!camera.parent) scene.add(camera); camera.add(bars);
  if (window.__MAP) MAP.places.push(['N3W BIKE', x0, z0, x0 + fx * 2, z0 + fz * 2]);
})();
const bikeSecret = secret('bike', () => { }, []); BIKE.dock = () => bikeDockIt();
function bikeRent(found) {
  if (BIKE.on) return; const b = BIKE.docked.find(b => b.visible); if (b && !found) b.visible = false; BIKE.from = found ? null : b;
  BIKE.on = true; BIKE.bars.visible = true; window.__BIKE = 2.15; BIKE.lx = P.x; BIKE.lz = P.z; bikeSecret();
  toast(found ? 'A N3W BIKE WAS LEANING ON A POLE. NOBODY SAW. RETURN IT TO THE DOCK ON THE BEACH PATH.' : 'BIKE UNLOCKED. FIRST 45 MINUTES FREE. THE ISLAND IS FOUR MINUTES WIDE.', 'blue'); bikeBell();
}
function bikeDockIt() { if (!BIKE.on) return; BIKE.on = false; BIKE.bars.visible = false; window.__BIKE = 1; const b = BIKE.docked.find(b => !b.visible); if (b) b.visible = true;
  toast('DOCKED. YOU RODE ' + (BIKE.dist / 1000).toFixed(2) + ' KM. THE DOCK BEEPS THE GREEN BEEP.'); BIKE.dist = 0; try { beep(1320, 0.08, 'square', 0.04); beep(1760, 0.1, 'square', 0.04, 0.1); } catch (e) { } }
function bikeBell() { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return;
  try { [0, 0.16].forEach(w => { const t0 = AC.currentTime + w, g = AC.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6); g.connect(AC.destination);
    [2093, 2637, 4180].forEach((f, i) => { const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f; const gg = AC.createGain(); gg.gain.value = [1, 0.5, 0.25][i]; o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + 0.62); }); }); } catch (e) { }
  BIKE.ring = 0.25; }
EGGS.bike = EGGS.citibike = EGGS.n3wbike = () => { BIKE.on ? toast('YOU ARE ALREADY ON A BIKE. LOOK DOWN.') : bikeRent(true); }; EGGS.bike.__s = true;
addEventListener('keydown', e => { if (!BIKE.on || e.code !== 'KeyB' || e.repeat || $('chat').style.display === 'block') return; bikeBell(); });
function bikeFrame(dt) {
  if (!BIKE.on) return; const d = Math.hypot(P.x - BIKE.lx, P.z - BIKE.lz); BIKE.lx = P.x; BIKE.lz = P.z; if (d < 5) BIKE.dist += d;
  const v = d / Math.max(dt, 1e-3); BIKE.sway += dt * (1.2 + v * 0.35);
  const s = Math.min(1, v / 9); BIKE.ring = Math.max(0, (BIKE.ring || 0) - dt);
  BIKE.bars.position.set(Math.sin(BIKE.sway) * 0.012 * s, -0.36 + Math.abs(Math.cos(BIKE.sway)) * 0.008 * s, -0.6); BIKE.bars.rotation.set(0.06, Math.sin(BIKE.sway) * 0.03 * s, Math.sin(BIKE.sway) * 0.025 * s + (BIKE.ring > 0 ? Math.sin(LIFE.t * 80) * 0.01 : 0));
  if (window.__BIKE !== 2.15) window.__BIKE = 2.15;
}
window.__FRAMES.push(dt => { try { bikeFrame(dt); } catch (e) { if (!BIKE.err) { BIKE.err = e; console.warn('v57 bike', e); } } });
