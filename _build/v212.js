/* ================================================================
   v212 THE LOOK: LIFE ON THE FIRE ESCAPE (2026-11-23)
   In summer and in November alike, New Yorkers live on their fire escapes. The walk up's landings now hold pots of
   herbs and geraniums, a folding chair, a milk crate, a towel over the rail and, on the top landing, a small
   string of lights that comes on at dusk. ?escape=0 off.
   ================================================================ */
const ESCLIFE = {};
window.__ESCLIFE = ESCLIFE;
(function escapeLife() {
  if (!FAC_ON || /escape=0/.test(location.search) || !window.__BROWN || !BROWN.H) return;
  const x0 = BROWN_AT.x, z0 = BROWN_AT.z, g0 = BROWN.g0, xb = x0 + 3.5;   // back face, landings out to +1.17
  const winY = f => g0 + 1.9 + f * 3.1, pot = new THREE.MeshStandardMaterial({ color: 0xb0603a, roughness: 0.8 }), leaf = new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 0.8 }), red = new THREE.MeshStandardMaterial({ color: 0xd8312a, roughness: 0.7 });
  const add = (geo, mat, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; scene.add(m); return m; };
  const P = new THREE.CylinderGeometry(0.11, 0.08, 0.18, 10), B = new THREE.SphereGeometry(0.14, 8, 6);
  for (let f = 1; f < 4; f++) { const y = winY(f) - 1.03 + 0.03;   // landing deck top
    [[0.85, -2.9], [0.95, -2.5]].forEach(([w, zz], j) => { add(P, pot, xb + w, y + 0.09, z0 + zz + f * 0.1); const b = add(B, j ? red : leaf, xb + w, y + 0.26, z0 + zz + f * 0.1); b.scale.set(1, 0.8, 1); });
    if (f === 1) { const seat = add(new THREE.BoxGeometry(0.4, 0.03, 0.4), new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.5, metalness: 0.4 }), xb + 0.7, y + 0.45, z0 + 0.6); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => add(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 4), seat.material, xb + 0.7 + a, y + 0.22, z0 + 0.6 + b)); add(new THREE.BoxGeometry(0.4, 0.4, 0.03), seat.material, xb + 0.7, y + 0.68, z0 + 0.8); }
    if (f === 2) { add(new THREE.BoxGeometry(0.33, 0.28, 0.33), new THREE.MeshStandardMaterial({ color: 0x1f5fbf, roughness: 0.6 }), xb + 0.6, y + 0.14, z0 + 0.5); const tw = add(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshStandardMaterial({ color: 0xe89a3a, roughness: 0.9, side: THREE.DoubleSide }), xb + 1.19, y + 0.65, z0 - 1.2, 0, PI / 2); }
    if (f === 3) { const bulbs = new THREE.MeshStandardMaterial({ color: 0x3a3020, emissive: 0xffd28a, emissiveIntensity: 0 }); ESCLIFE.bulbs = bulbs; for (let k = 0; k < 10; k++) add(new THREE.SphereGeometry(0.035, 6, 5), bulbs, xb + 1.17, y + 0.95 - Math.sin(k / 9 * PI) * 0.12, z0 + 0.75 - k * 0.39); } }
})();
window.__FRAMES.push(() => { try { if (ESCLIFE.bulbs) ESCLIFE.bulbs.emissiveIntensity = 0.1 + 2.4 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
