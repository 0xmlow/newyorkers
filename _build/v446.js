/* ================================================================
   v446 THE LOOK: HEADLIGHTS (2026-11-24)
   At night the traffic drove dark. Each car on the ring road now throws two pools of warm light down the asphalt
   ahead of it (soft at the edges, longest straight ahead) and a red wash behind, so you see the cars coming round
   the bend before you see the cars, and the road shines where they pass. Light, not lamps: additive pools on the
   road, no extra light sources. ?headlights=0 off.
   ================================================================ */
const HEADL = { p: [] };
window.__HEADL = HEADL;
(function headlights() {
  if (!LOOK.on || /headlights=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { c.save(); c.translate(64, 128); c.scale(1, 2); const g = c.createRadialGradient(0, 0, 0, 0, 0, 62); g.addColorStop(0, 'rgba(255,240,215,1)'); g.addColorStop(0.4, 'rgba(255,225,180,0.5)'); g.addColorStop(0.75, 'rgba(255,210,160,0.15)'); g.addColorStop(1, 'rgba(255,200,150,0)'); c.fillStyle = g; c.fillRect(-64, -64, 128, 128); c.restore(); }
  const t = new THREE.CanvasTexture(cv);
  const mk = (col, w, l) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: t, color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: false })); m.rotation.x = -PI / 2; m.visible = false; scene.add(m); return m; };
  try { TRAF.c.forEach(car => HEADL.p.push({ car, f: mk(0xffe2b0, 4.2, 11), r: mk(0xff2a18, 2.4, 2.6) })); } catch (e) { }
})();
const _hl = new V3();
window.__FRAMES.push(() => { try { if (!HEADL.p.length) return; const k = Math.min(1, (L.lamps || 0) * 1.3), on = k > 0.02;
  HEADL.p.forEach(h => { h.f.visible = h.r.visible = on; if (!on) return; const root = h.car.h.root, ry = root.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry), x = root.position.x, z = root.position.z, y = ground(x, z) + 0.06;
    h.f.position.set(x + fx * 6.8, y, z + fz * 6.8); h.f.rotation.z = ry + PI; h.f.material.opacity = 0.3 * k;
    h.r.position.set(x - fx * 3.1, y, z - fz * 3.1); h.r.rotation.z = ry; h.r.material.opacity = 0.22 * k; }); } catch (e) { } });
