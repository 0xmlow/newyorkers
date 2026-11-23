/* ================================================================
   v193 THE LOOK: THE RIBBON'S EDGES (2026-11-23)
   The census walk's long curving wall ended in a raw cut at the top and stood straight on the grass. It now has
   a thin metal coping that follows its rise and fall, a shadow gap at its foot so it seems to float a finger's
   width above the ground, and a warm line of light tucked under the coping on both faces that comes up at
   dusk and draws the curve across the island at night. ?ribbon=0 off.
   ================================================================ */
(function ribbonEdges() {
  if (!FAC_ON || /ribbon=0/.test(location.search)) return;
  FACM.cope = new THREE.MeshStandardMaterial({ color: 0x8e8b84, roughness: 0.35, metalness: 0.7 }); FACM.gap = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 1 });
  FACM.led = new THREE.MeshStandardMaterial({ color: 0x2a241c, emissive: 0xffd7a0, emissiveIntensity: 0 }); window.__RIBLED = FACM.led;
  const pts = []; for (let i = 0; i <= 24; i++) { const z = 46 + i * 1.6; pts.push([-11 - 2.2 * Math.sin(i / 24 * PI * 2), z]); }
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], mx = (ax + bx) / 2, mz = (az + bz) / 2, dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    const gg = ground(mx, mz), hh = 6.2 + Math.sin(i / 24 * PI) * 2.4, ry = Math.atan2(-dz, dx), nx = dz / len, nz = -dx / len;
    facPut('cope', mx, gg + hh + 0.05, mz, len + 0.1, 0.1, 0.62, ry); facPut('gap', mx, gg + 0.06, mz, len + 0.09, 0.12, 0.52, ry);
    [-1, 1].forEach(s => facPut('led', mx + nx * s * 0.272, gg + hh - 0.06, mz + nz * s * 0.272, len + 0.06, 0.035, 0.03, ry)); }
  facFlush();
})();
window.__FRAMES.push(() => { try { if (window.__RIBLED) __RIBLED.emissiveIntensity = 2.2 * Math.min(1, Math.max(0, (L.lamps || 0) - 0.1) * 1.4); } catch (e) { } });
