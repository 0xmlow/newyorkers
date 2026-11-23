/* ================================================================
   v74 THE CANAL STREET TABLE (2026-11-22)
   A folding table at (-16, -28) under a beach umbrella, covered in knockoffs: plush PEEPE frogs, a DOGGE in a
   box, ROLEKS watches on a card, sunglasses, and a stack of framed JPEGs that are just printouts. The man behind
   it says bags, watches, jpegs. E haggles. Haggle three times and you walk away with a BORED APE (BOOTLEG).
   ================================================================ */
const BOOT = { h: 0 };
window.__BOOT = BOOT;
const BOOT_AT = { x: -16, z: -28 };
(function bootlegTable() {
  const x0 = BOOT_AT.x, z0 = BOOT_AT.z, g0 = ground(x0, z0), ry = Math.atan2(-x0, -z0); BOOT.ry = ry;
  const g = new THREE.Group(); g.position.set(x0, g0, z0); g.rotation.y = ry; scene.add(g);
  const steel = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.4, metalness: 0.7 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.8), new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.8 })); top.position.y = 0.75; g.add(top);
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.5, 0.82), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 1 })); cloth.position.y = 0.52; g.add(cloth);
  [[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 6), steel); l.position.set(x, 0.37, z); g.add(l); });
  // umbrella
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.3, 6), steel); pole.position.set(-0.7, 1.15, -0.5); g.add(pole);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.45, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.8, side: THREE.DoubleSide })); canopy.position.set(-0.7, 2.3, -0.5); g.add(canopy);
  // the goods
  const frog = (x, z, s) => { const f = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0x5d9b3a, roughness: 1 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.11 * s, 12, 10), m); b.scale.set(1, 0.85, 1); f.add(b);
    [-1, 1].forEach(k => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045 * s, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })); e.position.set(k * 0.05 * s, 0.08 * s, 0.07 * s); f.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.02 * s, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); p.position.set(k * 0.05 * s, 0.08 * s, 0.11 * s); f.add(p); });
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.05 * s, 0.012 * s, 6, 12, PI), new THREE.MeshStandardMaterial({ color: 0xb04a3a })); lip.position.set(0, -0.01 * s, 0.1 * s); lip.rotation.z = PI; f.add(lip); f.position.set(x, 0.86, z); g.add(f); };
  frog(-0.6, 0.15, 1); frog(-0.35, 0.2, 0.8); frog(-0.5, -0.1, 0.9);
  const lab = (t, sub, col) => signTex([{ t, s: 0.4 }, { t: sub, s: 0.15 }], 512, 320, col, '#0D0D0D');
  const boxM = (t, sub, col) => new THREE.MeshStandardMaterial({ map: lab(t, sub, col), roughness: 0.7 });
  const dog = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.18), [boxM('DOGGE', 'MUCH OFFICIAL', '#e9c46a'), boxM('DOGGE', 'MUCH OFFICIAL', '#e9c46a'), boxM('DOGGE', '', '#e9c46a'), boxM('DOGGE', '', '#e9c46a'), boxM('DOGGE', 'WOW', '#e9c46a'), boxM('DOGGE', 'WOW', '#e9c46a')]); dog.position.set(0.0, 0.87, 0.1); g.add(dog);
  const watch = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshStandardMaterial({ map: lab('ROLEKS', 'GENUINE REAL', '#efe8da'), roughness: 0.7 })); watch.rotation.x = -PI / 2 + 0.35; watch.position.set(0.45, 0.8, 0.2); g.add(watch);
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.4 })); s.position.set(0.3 + i * 0.12, 0.79, -0.15); s.rotation.x = PI / 2; g.add(s); const s2 = s.clone(); s2.position.x += 0.075; g.add(s2); }
  for (let i = 0; i < 3; i++) { const m = memeMesh(MEME_NS[(i * 53 + 7) % MEME_NS.length], 0.34); if (m) { m.position.set(0.75, 0.95 + i * 0.01, 0.0 - i * 0.12); m.rotation.x = -0.6; g.add(m); } }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'BAGS WATCHES JPEGS', s: 0.17 }, { t: 'ALL REAL', s: 0.22 }], 512, 220, '#efe8da', '#0D0D0D'), toneMapped: false, side: THREE.DoubleSide })); sign.position.set(0, 0.55, 0.42); g.add(sign);
  const v = person(0x15161a, 0x2a2f45, SKIN[1], 'wiseguy'); v.g.position.set(x0 - Math.sin(ry) * 0.9, g0 - 0.35, z0 - Math.cos(ry) * 0.9); v.g.rotation.y = ry; BOOT.v = v;
  boxWalls(x0, z0, 1.95, 0.85, ry, -5, g0 + 0.8);
  interact(x0 + Math.sin(ry) * 1.2, z0 + Math.cos(ry) * 1.2, 1.7, 'E · HAGGLE', () => bootHaggle());
  if (window.__MAP) MAP.places.push(['CANAL ST TABLE', x0, z0, x0 + Math.sin(ry) * 2, z0 + Math.cos(ry) * 2]);
})();
const bootSecret = secret('bootleg', () => { toast('YOU BOUGHT A BORED APE (BOOTLEG). IT IS A PRINTOUT IN A FRAME. THE FRAME IS NICE. PROVENANCE: THIS TABLE.', 'blue'); });
function bootHaggle() { BOOT.h++; const lines = ['HE SAYS FORTY. YOU SAY TEN. HE LAUGHS LIKE YOU INSULTED HIS MOTHER.', 'HE SAYS TWENTY FIVE, FINAL. HE SAYS FINAL TWICE.', 'HE SAYS FINE, FIFTEEN, BUT YOU DID NOT GET IT HERE.'];
  if (BOOT.h <= 3) toast(lines[BOOT.h - 1]); if (BOOT.h === 3) setTimeout(() => bootSecret(), 2200); if (BOOT.h > 3) toast(['HE SAYS COME BACK TOMORROW, NEW STOCK.', 'HE IS ON THE PHONE. HE HOLDS UP ONE FINGER.', 'HE SAYS YOU AGAIN.'][BOOT.h % 3]); }
EGGS.canalstreet = EGGS.bootleg = () => { teleport(BOOT_AT.x + Math.sin(BOOT.ry) * 2, BOOT_AT.z + Math.cos(BOOT.ry) * 2, BOOT.ry + PI); toast('PSST. BAGS. WATCHES. JPEGS.'); }; EGGS.canalstreet.__s = true;
