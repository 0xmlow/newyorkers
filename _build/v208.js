/* ================================================================
   v208 THE LOOK: THE MARKET AT NIGHT (2026-11-23)
   At night the kiosks were dark boxes under the string lights. Now each glows from inside the way a winter market
   does: a warm light panel under the roof, the back wall and the goods lit up, a soft pool of light spilling onto
   the ground in front of each counter, and the string light bulbs a little bigger and brighter. ?marketnight=0 off.
   ================================================================ */
const MNIGHT = { mats: [] };
window.__MNIGHT = MNIGHT;
(function marketNight() {
  if (!LOOK.on || /marketnight=0/.test(location.search) || !window.__MKT || !MKT.k) return;
  const panel = new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc98a, emissiveIntensity: 0 }); MNIGHT.mats.push(panel);
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); if (c && c.createRadialGradient) { const g = c.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,200,140,0.9)'); g.addColorStop(1, 'rgba(255,170,100,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }
  const pool = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); MNIGHT.pool = pool;
  MKT.k.forEach(k => { const gy = ground(k.x, k.z); const p = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.9), panel); p.rotation.x = PI / 2; p.position.set(k.x, gy + 2.44, k.z); scene.add(p);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), pool); pl.rotation.x = -PI / 2; pl.position.set(k.x, gy + 0.05, k.z - 2.2); pl.renderOrder = 4; scene.add(pl); });
  try { if (MKT.warm) MNIGHT.warm = MKT.warm; } catch (e) { }
})();
window.__FRAMES.push(() => { try { if (!MNIGHT.pool) return; const k = Math.min(1, (L.lamps || 0) * 1.3); MNIGHT.mats.forEach(m => m.emissiveIntensity = 0.15 + 1.6 * k); MNIGHT.pool.opacity = 0.55 * k; } catch (e) { } });
