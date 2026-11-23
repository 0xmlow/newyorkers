/* ================================================================
   v131 SPIN CYCLE 420 (2026-11-23)
   A laundromat at (-86, -4) on the west side, its glass front to the island: a row of front loaders and stacked
   dryers along the back wall, clothes tumbling behind every round door (each machine on its own cycle: wash,
   rinse, a long rattling spin, then still), a folding table with the attendant folding, a laundry cart, a cat
   asleep on the warm dryers, and the hard white strip light that makes a laundromat glow on a dark street.
   Open six in the morning to eleven at night. E at the window to do a load.
   ================================================================ */
const LAUND = { m: [], load: 0, cat: null };
window.__LAUND = LAUND;
(function laundromat() {
  const x0 = -86, z0 = -4, D = 5, W = 8, H = 3.6, g0 = ground(x0, z0), fx = x0 + D / 2; LAUND.g0 = g0; LAUND.fx = fx; LAUND.z0 = z0;
  const wallM = new THREE.MeshStandardMaterial({ color: 0xd9e4dc, roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0 }), outM = new THREE.MeshStandardMaterial({ map: tex('assets/brick_c.webp', [2, 2]), color: 0x7a6a5e, roughness: 0.85 });
  const B = (w, h, d, m, x, y, z, ry) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); if (ry) o.rotation.y = ry; o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
  B(0.25, H, W, outM, x0 - D / 2 + 0.12, g0 + H / 2, z0); [-1, 1].forEach(s => B(D, H, 0.25, outM, x0, g0 + H / 2, z0 + s * (W / 2 - 0.12))); B(D, 0.3, W, outM, x0, g0 + H + 0.15, z0);
  B(0.04, H - 0.2, W - 0.5, wallM, x0 - D / 2 + 0.27, g0 + H / 2, z0); B(D - 0.3, 0.04, W - 0.5, wallM, x0, g0 + H - 0.05, z0);
  const fl = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); if (c && c.fillRect) { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#e9e6dc' : '#2c3a34'; c.fillRect(i * 16, j * 16, 16, 16); } } const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 6); t.encoding = THREE.sRGBEncoding; return t; })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(D - 0.4, W - 0.4), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.35 })); floor.rotation.x = -PI / 2; floor.position.set(x0, g0 + 0.04, z0); floor.receiveShadow = true; scene.add(floor);
  // the glass front, mullions, a sign band
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.5, H - 0.9), new THREE.MeshStandardMaterial({ color: 0xbfd6e0, roughness: 0.03, metalness: 0.3, transparent: true, opacity: 0.16, depthWrite: false })); glass.position.set(fx - 0.05, g0 + (H - 0.9) / 2 + 0.2, z0); glass.rotation.y = PI / 2; scene.add(glass);
  const alu = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.9 }); [-3.75, -1.25, 1.25, 3.75].forEach(dz => B(0.08, H - 0.9, 0.08, alu, fx - 0.05, g0 + (H - 0.9) / 2 + 0.2, z0 + dz)); B(0.1, 0.1, W - 0.4, alu, fx - 0.05, g0 + 0.2, z0); B(0.1, 0.1, W - 0.4, alu, fx - 0.05, g0 + H - 0.7, z0);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.3, 0.62), new THREE.MeshStandardMaterial({ map: signTex([{ t: 'SPIN CYCLE 420', s: 0.5, f: 'Georgia, serif' }, { t: 'WASH · DRY · FOLD · OPEN 6AM TO 11PM', s: 0.16 }], 1024, 160, '#12302a', '#f2e6c8'), roughness: 0.6, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 })); band.position.set(fx + 0.01, g0 + H - 0.32, z0); band.rotation.y = PI / 2; scene.add(band); LAUND.band = band; band.material.emissiveMap = band.material.map;
  boxWalls(x0, z0, D, W, 0, -5, g0 + H);
  // strip lights
  LAUND.strips = []; [-1, 1].forEach(s => { const m = new THREE.MeshBasicMaterial({ color: 0xf4fbff, toneMapped: false }); const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, W - 1.5), m); l.position.set(x0 + s * 0.9, g0 + H - 0.1, z0); scene.add(l); LAUND.strips.push(m); });
  // the machines: clothes in each drum, a canvas of coloured shapes
  const clothes = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); if (c && c.arc) { c.fillStyle = '#1b2430'; c.fillRect(0, 0, 128, 128); const cols = ['#e8e2d4', '#2962FF', '#b3121b', '#1f5a36', '#e8c45a', '#ff3fa4', '#8a8f99', '#151515']; for (let i = 0; i < 26; i++) { c.fillStyle = cols[(Math.random() * cols.length) | 0]; c.beginPath(); c.ellipse(Math.random() * 128, 64 + (Math.random() - 0.2) * 70, 10 + Math.random() * 22, 6 + Math.random() * 12, Math.random() * 3, 0, PI * 2); c.fill(); } } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; };
  const white = new THREE.MeshStandardMaterial({ color: 0xeef0ee, roughness: 0.35, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0 }), steel = new THREE.MeshStandardMaterial({ color: 0xa8adb2, roughness: 0.25, metalness: 0.85 }), ringM = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.3, metalness: 0.7 });
  const bx = x0 - D / 2 + 0.7;
  for (let i = 0; i < 7; i++) { const z = z0 - W / 2 + 0.85 + i * 0.95; [0, 1].forEach(lv => { if (lv && i < 3) return; const y = g0 + 0.45 + lv * 0.95; const body = B(0.75, 0.9, 0.85, lv ? steel : white, bx, y, z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 24), ringM); ring.position.set(bx + 0.39, y + 0.05, z); ring.rotation.y = PI / 2; scene.add(ring);
      const drum = new THREE.Mesh(new THREE.CircleGeometry(0.25, 24), new THREE.MeshBasicMaterial({ map: clothes() })); drum.position.set(bx + 0.385, y + 0.05, z); drum.rotation.y = PI / 2; scene.add(drum);
      const gl = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), new THREE.MeshStandardMaterial({ color: 0x9fc6d8, roughness: 0.02, metalness: 0.5, transparent: true, opacity: 0.25, depthWrite: false })); gl.position.set(bx + 0.4, y + 0.05, z); gl.rotation.y = PI / 2; scene.add(gl);
      LAUND.m.push({ drum, body, ph: Math.random() * 400, dry: !!lv, y, z }); }); }
  // folding table, the attendant, a cart, the cat
  B(0.9, 0.06, 3.0, steel, x0 + 0.4, g0 + 0.9, z0 - 0.3); [-1.3, 1.1].forEach(dz => B(0.06, 0.86, 0.06, steel, x0 + 0.4, g0 + 0.45, z0 - 0.3 + dz));
  const pile = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.5), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.95 })); pile.position.set(x0 + 0.4, g0 + 1.02, z0 - 1.2); scene.add(pile);
  const att = person(0x7a1f2a, 0x2a2a3a, SKIN[1], 'workgirl'); att.g.position.set(x0 - 0.4, g0 - 0.35, z0 - 0.3); att.g.rotation.y = PI / 2; LAUND.att = att;
  const cart = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: 0xb8bec4, roughness: 0.4, metalness: 0.7, wireframe: true })); cart.position.set(x0 + 1.3, g0 + 0.55, z0 + 2.2); scene.add(cart);
  const orange = new THREE.MeshStandardMaterial({ color: 0xc8742a, roughness: 0.9 }), cat = new THREE.Group(); cat.position.set(bx, g0 + 1.92, z0 - W / 2 + 0.85 + 5 * 0.95); scene.add(cat); LAUND.cat = cat;
  const cb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 9), orange); cb.scale.set(1, 0.6, 1.5); cb.position.y = 0.1; cat.add(cb); LAUND.catBody = cb;
  const chd = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), orange); chd.position.set(0.02, 0.1, 0.24); cat.add(chd);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 4), orange); e.position.set(s * 0.05, 0.18, 0.25); cat.add(e); });
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12, PI), orange); tail.rotation.x = PI / 2; tail.position.set(0, 0.05, -0.1); cat.add(tail);
  interact(fx + 1.1, z0, 1.9, 'E · DO A LOAD', () => laundLoad());
  if (window.__MAP) MAP.places.push(['SPIN CYCLE 420', x0, z0, fx + 2, z0]);
})();
const laundSecret = secret('laundry', () => { toast('YOUR LOAD IS DONE. ONE SOCK IS MISSING. IT IS ALWAYS ONE SOCK. NOBODY KNOWS WHERE THEY GO. THE CAT KNOWS.', 'blue'); });
function laundLoad() { if (LAUND.load > 0) { toast('YOUR LOAD IS STILL GOING. MACHINE FOUR. DO NOT OPEN IT.'); return; } const t = nycTime(TIME.utc).hours; if (t < 6 || t >= 23) { toast('CLOSED. THE CAT LOOKS AT YOU THROUGH THE GLASS.'); return; } LAUND.load = 40; const m = LAUND.m[3]; try { const n = MEME_NS[(Math.random() * MEME_NS.length) | 0], mm = memeMesh(n, 0.4, {}); if (mm) { m.drum.material.map = mm.material.map; m.drum.material.needsUpdate = true; } } catch (e) { } toast('QUARTERS IN. MACHINE FOUR. FORTY MINUTES (FORTY SECONDS).'); }
function laundFrame(dt) {
  const h = nycTime(TIME.utc).hours, open = h >= 6 && h < 23, night = Math.min(1, (L.lamps || 0) * 1.4), d = Math.hypot(P.x - LAUND.fx, P.z - LAUND.z0);
  LAUND.strips.forEach(m => m.color.setScalar(open ? 1.4 : 0.05)); LAUND.band.material.emissiveIntensity = open ? 0.25 + night * 0.9 : 0;
  const glow = open ? 0.15 + night * 0.45 : 0; LAUND.m.forEach(m => { m.body.material.emissiveIntensity !== undefined && (m.body.material.emissiveIntensity = m.dry ? 0 : glow * 0.4); });
  if (d > 70) return; if (LAUND.load > 0) { LAUND.load -= dt; if (LAUND.load <= 0) { if (d < 30) laundSecret(); try { LAUND.m[3].drum.material.map = LAUND.m[2].drum.material.map; } catch (e) { } } }
  LAUND.m.forEach((m, i) => { m.ph += dt; const c = (m.ph % 120) / 120; let w = 0;
    if (i === 3 && LAUND.load > 0) { const k = LAUND.load; w = k < 10 ? 28 : Math.sin(k * 0.8) * 4; }
    else if (!open) w = 0; else if (m.dry) w = c < 0.8 ? 3.2 : 0; else w = c < 0.45 ? Math.sign(Math.sin(m.ph * 0.4)) * 3 : c < 0.6 ? Math.sin(m.ph) * 2 : c < 0.75 ? 26 : 0;
    m.drum.rotation.z += w * dt; m.body.position.x = LAUND.fx - 5 + 0.7 + (Math.abs(w) > 20 ? (Math.random() - 0.5) * 0.008 : 0); });
  LAUND.catBody.scale.y = 0.6 + Math.sin(LIFE.t * 1.6) * 0.03; const a = LAUND.att; a.arms[0].rotation.x = -0.9 + Math.sin(LIFE.t * 1.4) * 0.35; a.arms[1].rotation.x = -0.9 + Math.sin(LIFE.t * 1.4 + 1) * 0.35;
}
window.__FRAMES.push(dt => { try { laundFrame(dt); } catch (e) { if (!LAUND.err) { LAUND.err = e; console.warn('v131 laundromat', e); } } });
