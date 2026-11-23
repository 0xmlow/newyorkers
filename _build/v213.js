/* ================================================================
   v213 THE LOOK: THE STOOP (2026-11-23)
   The walk up's stoop gets what stoops get: pots of chrysanthemums on the steps for the season (pumpkins after
   October, a little tree in December), a doormat at the top, and a brass lantern beside the door that lights at
   dusk. ?stoop2=0 off.
   ================================================================ */
const STOOP2 = {};
window.__STOOP2 = STOOP2;
(function stoopLife() {
  if (!LOOK.on || /stoop2=0/.test(location.search) || !window.__BROWN || !BROWN.H) return;
  const x0 = BROWN_AT.x, z0 = BROWN_AT.z, g0 = BROWN.g0, D = 7, fx = x0 - D / 2, zs = z0 - 2.4;
  const pot = new THREE.MeshStandardMaterial({ color: 0x3c3a36, roughness: 0.7 }), mums = [0xd98a1e, 0xb8332a, 0xe8c447].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })), pumpkin = new THREE.MeshStandardMaterial({ color: 0xe06d17, roughness: 0.6 });
  const mo = (() => { try { return nycTime(TIME.utc).mo; } catch (e) { return 11; } })();
  for (let s = 1; s < 7; s += 2) { const sx = fx - 0.4 - (6 - s) * 0.36 - 0.6, y = g0 + 0.2 * (s + 1); [-0.62, 0.62].forEach((o, j) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.22, 12), pot); p.position.set(sx, y + 0.11, zs + o); scene.add(p);
      const top = mo >= 11 && s === 1 ? new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), pumpkin) : new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), mums[(s + j) % 3]); top.scale.set(1, 0.75, 1); top.position.set(sx, y + 0.32, zs + o); top.castShadow = true; scene.add(top); }); }
  const mat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.015, 0.9), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 })); mat.position.set(fx - 0.45, g0 + 1.41, zs); scene.add(mat);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.16), new THREE.MeshStandardMaterial({ color: 0x3a2e1a, emissive: 0xffc070, emissiveIntensity: 0, roughness: 0.4, metalness: 0.6 })); lamp.position.set(fx - 0.1, g0 + 3.3, zs + 0.85); scene.add(lamp); STOOP2.lamp = lamp.material;
})();
window.__FRAMES.push(() => { try { if (STOOP2.lamp) STOOP2.lamp.emissiveIntensity = 0.05 + 2.0 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
