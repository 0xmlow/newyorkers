/* ================================================================
   v86 THE PIGEON COOP (2026-11-22)
   On the water tower roof, a wooden pigeon coop with a wire front and a flag on a bamboo pole, the old rooftop
   hobby. E on the roof lets the birds out: twenty pigeons spiral up together, circle the roof in a wide loop
   for half a minute, and drop back into the coop one by one. COOP takes you up there.
   ================================================================ */
const COOP = { b: [], t: 0, out: 0 };
window.__COOP = COOP;
(function coop() {
  const x0 = WT_AT.x - 2.2, z0 = WT_AT.z - 2.2, y0 = WT.top + 0.28; COOP.x = x0; COOP.z = z0; COOP.y = y0;
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.9 }), wire = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.5, metalness: 0.7, wireframe: true });
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 1.2), wood); box.position.set(x0, y0 + 0.85, z0); scene.add(box);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.5), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9 })); roof.position.set(x0, y0 + 1.55, z0 + 0.05); roof.rotation.x = 0.12; scene.add(roof);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.1, 16, 10), wire); front.position.set(x0, y0 + 0.85, z0 + 0.61); scene.add(front);
  [[-0.95, -0.55], [0.95, -0.55], [-0.95, 0.55], [0.95, 0.55]].forEach(([dx, dz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), wood); l.position.set(x0 + dx, y0 + 0.1, z0 + dz); scene.add(l); });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 3.4, 6), new THREE.MeshStandardMaterial({ color: 0xc9b07a, roughness: 0.8 })); pole.position.set(x0 - 1.3, y0 + 1.7, z0 - 0.3); scene.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45, 8, 1), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.8, side: THREE.DoubleSide })); flag.position.set(x0 - 0.95, y0 + 3.15, z0 - 0.3); scene.add(flag); COOP.flag = flag;
  boxWalls(x0, z0, 2.0, 1.2, 0, y0 - 1, y0 + 1.5);
  const bodyG = new THREE.SphereGeometry(0.11, 8, 6), wingG = new THREE.BoxGeometry(0.06, 0.012, 0.22);
  const cols = [0x6d7480, 0x8a8f96, 0x4b5058, 0xe6e3dc, 0x7a6a5a];
  for (let i = 0; i < 20; i++) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: cols[i % 5], roughness: 0.8 }); const b = new THREE.Mesh(bodyG, m); b.scale.set(1.5, 0.9, 0.9); g.add(b);
    const wings = [-1, 1].map(s => { const w = new THREE.Mesh(wingG, m); w.position.set(0, 0.04, s * 0.12); g.add(w); return w; }); g.visible = false; scene.add(g); COOP.b.push({ g, wings, ph: i / 20 * PI * 2, r: 7 + Math.random() * 6, h: 4 + Math.random() * 5, lag: i * 0.25 }); }
  interact(x0, z0 + 1.6, 1.8, 'E · LET THE BIRDS OUT', () => coopRelease(), y0);
  if (window.__MAP) MAP.places.push(['THE COOP', x0, z0, null, null]);
})();
const coopSecret = secret('coop', () => { }, []);
function coopRelease() { if (COOP.out > 0) { toast('THEY ARE ALREADY UP. LOOK.'); return; } COOP.out = 32; COOP.t = 0; coopSecret(); toast('THE DOOR OPENS AND TWENTY PIGEONS GO UP LIKE ONE THOUGHT.', 'blue'); }
EGGS.coop = EGGS.pigeoncoop = () => { teleport(COOP.x + 0.5, COOP.z + 2.0, 0, COOP.y + 1); toast('THE COOP. THE OWNER SAYS DO NOT TOUCH THE FLAG.'); }; EGGS.coop.__s = true;
function coopFrame(dt) {
  if (Math.hypot(P.x - COOP.x, P.z - COOP.z) > 160) return; COOP.flag.rotation.y = Math.sin(LIFE.t * 2) * 0.25;
  if (COOP.out <= 0) { COOP.b.forEach(b => b.g.visible = false); return; } COOP.out -= dt; COOP.t += dt;
  COOP.b.forEach(b => { const t = COOP.t - b.lag, home = COOP.out < 6 ? Math.min(1, (6 - COOP.out) / 5 + b.lag / 20) : 0; if (t < 0) { b.g.visible = false; return; } b.g.visible = home < 0.98;
    const a = b.ph + t * 0.9, rise = Math.min(1, t / 3), r = b.r * rise * (1 - home), x = COOP.x + Math.cos(a) * r, z = COOP.z + Math.sin(a) * r, y = COOP.y + 1 + (b.h + Math.sin(t * 0.7 + b.ph) * 1.2) * rise * (1 - home);
    b.g.position.set(x, y, z); b.g.rotation.set(0, -a - PI / 2, -0.3 * (1 - home)); const f = Math.sin(t * 22 + b.ph) * 0.8; b.wings[0].rotation.x = f; b.wings[1].rotation.x = -f; });
}
window.__FRAMES.push(dt => { try { coopFrame(dt); } catch (e) { if (!COOP.err) { COOP.err = e; console.warn('v86 coop', e); } } });
