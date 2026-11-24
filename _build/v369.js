/* ================================================================
   v369 REALISM: STEAM2 FROM THE STREETS (2026-11-24)
   The New York thing: on a cold day, steam rising from the manholes (v181). Soft billowing plumes from four of them,
   rising, drifting with the wind and thinning out, thickest on cold mornings and at night in November. Billboards
   of soft noise, additive, a few dozen sprites, no lights.
   ================================================================ */
const STEAM2 = { p: [] };
window.__STEAM = STEAM2;
(function steam() {
  if (!LOOK.on || /steam=0/.test(location.search) || !window.__MANH || !MANH.list.length) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); if (!c || !c.createRadialGradient) return; const g = c.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(240,242,246,0.8)'); g.addColorStop(1, 'rgba(235,238,242,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  const tx = new THREE.CanvasTexture(cv); const srcs = MANH.list.slice(0, 4);
  srcs.forEach(src => { for (let i = 0; i < 9; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0 })); scene.add(m); STEAM2.p.push({ m, src, t: i / 9 * 4, sp: 0.8 + Math.random() * 0.4 }); } });
})();
window.__FRAMES.push(dt => { try { if (!STEAM2.p.length) return; const h = nycTime(TIME.utc).hours, cold = (h < 10 || h > 17 ? 1 : 0.55) * ((typeof WX !== 'undefined' && WX.wet > 0.3) ? 1.2 : 1);
  STEAM2.p.forEach(s => { const near = Math.hypot(camera.position.x - s.src.position.x, camera.position.z - s.src.position.z) < 90; s.m.visible = near; if (!near) return; s.t += dt * s.sp; if (s.t > 4) s.t -= 4; const k = s.t / 4;
    s.m.position.set(s.src.position.x + k * 1.6 + Math.sin(s.t * 2 + s.sp * 9) * 0.2, s.src.position.y + 0.2 + k * 3.2, s.src.position.z + k * 0.6); const sc = 0.6 + k * 2.6; s.m.scale.set(sc, sc, 1); s.m.material.opacity = cold * 0.9 * Math.sin(k * PI) * (1 - k * 0.4); }); } catch (e) { } });
