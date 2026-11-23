/* ================================================================
   v214 THE LOOK: N3W HARDWARE (2026-11-23)
   The water tower building's ground floor on the street side becomes a shop, the hardware store every New York
   block has: a deep green awning, a sign band reading N3W HARDWARE · KEYS CUT · PAINT · SINCE 2021, and a window
   of brooms, paint cans, rope and a rack of keys. ?hardware=0 off.
   ================================================================ */
(function hardware() {
  if (!FAC_ON || /hardware=0/.test(location.search) || !window.__WT || !WT.top) return;
  const x0 = WT_AT.x + 1.8, z0 = WT_AT.z, S = 7, g0 = WT.top - 7, fz = z0 + S / 2 + 0.19;   // the right half: One N3W Place's canopy (v88) holds the left
  const band = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.5), new THREE.MeshStandardMaterial({ map: signTex([{ t: 'N3W HARDWARE', s: 0.46, f: 'Georgia, serif' }, { t: 'KEYS CUT · PAINT · SINCE 2021', s: 0.2 }], 768, 116, '#1f3a2a', '#efe8da'), roughness: 0.6 })); band.position.set(x0, g0 + 3.05, fz + 0.05); scene.add(band);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.9), new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.05, metalness: 0.2, envMapIntensity: 0.8, transparent: true, opacity: 0.32, depthWrite: false })); glass.position.set(x0, g0 + 1.55, fz + 0.03); scene.add(glass);
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.1), new THREE.MeshStandardMaterial({ color: 0x1f4a32, roughness: 0.85, side: THREE.DoubleSide })); awn.position.set(x0, g0 + 2.62, fz + 0.5); awn.rotation.x = -PI / 2 + 0.55; awn.castShadow = true; scene.add(awn);
  const val = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.22), awn.material); val.position.set(x0, g0 + 2.22, fz + 0.97); scene.add(val);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.9), new THREE.MeshStandardMaterial({ color: 0x2a2620, emissive: 0xffd9a0, emissiveIntensity: 0.18, roughness: 0.9 })); back.position.set(x0, g0 + 1.55, fz - 0.4); scene.add(back);
  const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.2 });
  [0xd8d0c0, 0x2962ff, 0xc8102e, 0xf2c200, 0x2f4a33].forEach((c, i) => { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 14), M(c)); can.position.set(x0 - 1.3 + i * 0.26, g0 + 0.7, fz - 0.18); scene.add(can); });
  for (let i = 0; i < 4; i++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), M(0xb08a58)); br.position.set(x0 + 0.7 + i * 0.16, g0 + 1.3, fz - 0.2); br.rotation.z = 0.08 * (i - 1.5); scene.add(br); const bh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.05), M(0xc23a24)); bh.position.set(x0 + 0.7 + i * 0.16, g0 + 0.62, fz - 0.2); scene.add(bh); }
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 18), M(0xc8a46a)); rope.position.set(x0 - 0.7, g0 + 1.6, fz - 0.15); scene.add(rope);
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshStandardMaterial({ map: signTex([{ t: 'KEYS', s: 0.3 }, { t: '· · · · · · · ·', s: 0.2, c: '#d9b45a' }], 256, 192, '#1a1a1a', '#efe8da'), roughness: 0.5 })); keys.position.set(x0 + 0.1, g0 + 1.75, fz - 0.12); scene.add(keys);
})();
