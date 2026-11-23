/* ================================================================
   v222 THE LOOK: PARK LIGHTS (2026-11-23)
   The handball court, the skate plaza and the dog run go dark at night like nobody uses them. Now each has the
   tall galvanised poles with flat LED heads that light every New York park court, and after dusk a cool white
   pool of light lies on the asphalt under them. No real lights are added (the v177 light budget stays at eight):
   the heads glow and the pools are painted on, additive, faded in with the street lamps.
   ?parklights=0 turns it off.
   ================================================================ */
const PLT = { heads: null, pool: null, n: 0 };
window.__PLT = PLT;
(function parkLights() {
  if (!FAC_ON || /parklights=0/.test(location.search)) return;
  const head = new THREE.MeshStandardMaterial({ color: 0x2a2c2e, roughness: 0.4, emissive: 0xe8f0ff, emissiveIntensity: 0 }); PLT.heads = head; FACM.ledHead = head;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { const g = c.createRadialGradient(64, 64, 2, 64, 64, 64); g.addColorStop(0, 'rgba(225,235,255,0.85)'); g.addColorStop(0.45, 'rgba(200,215,245,0.4)'); g.addColorStop(1, 'rgba(180,200,240,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }
  const pool = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, polygonOffset: true, polygonOffsetFactor: -4 }); PLT.pool = pool;
  // pole at (x,z), arm toward (tx,tz), pool of radius r at the target
  const pole = (x, z, tx, tz, r) => { const gy = ground(x, z), H = 6.4, ry = Math.atan2(tx - x, tz - z);
    facPut('galv', x, gy + H / 2, z, 0.14, H, 0.14, 0); facPut('galv', x, gy + 0.3, z, 0.3, 0.6, 0.3, 0);
    facPut('galv', x + Math.sin(ry) * 0.5, gy + H - 0.1, z + Math.cos(ry) * 0.5, 0.06, 0.06, 1.0, ry);
    facPut('ledHead', x + Math.sin(ry) * 1.05, gy + H - 0.18, z + Math.cos(ry) * 1.05, 0.62, 0.08, 0.36, ry);
    const tg = ground(tx, tz), p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), pool); p.rotation.x = -PI / 2; p.position.set(tx, Math.max(tg, gy) + 0.08, tz); p.renderOrder = 4; scene.add(p); PLT.n++; };
  try { if (window.__HB2 && HB2.L2W) { const W = HB2.L2W; [-1, 1].forEach(s => { const [x, z] = W(s * 4.75, 3.6), [tx, tz] = W(s * 1.2, 4.4); pole(x, z, tx, tz, 4.2); }); } } catch (e) { }
  try { if (window.__SK2 && SK2.ok) { const W = SK.L2W; [[-8.6, -3.5, -4, -1], [8.6, 4.4, 4, 4.5], [-8.6, 8.6, -4.5, 8]].forEach(([u, v, tu, tv]) => { const [x, z] = W(u, v), [tx, tz] = W(tu, tv); pole(x, z, tx, tz, 4.6); }); } } catch (e) { }
  try { if (window.__DR2 && DR2.ok) { const x = DRUN_AT.x - DRUN_AT.w / 2 - 1.0, z = DRUN_AT.z - DRUN_AT.l / 2 - 1.0; pole(x, z, DRUN_AT.x - 1, DRUN_AT.z - 1, 4.4); } } catch (e) { }
  facFlush();
})();
window.__FRAMES.push(() => { try { if (!PLT.pool) return; const k = Math.min(1, (L.lamps || 0) * 1.3); PLT.heads.emissiveIntensity = 0.05 + 2.4 * k; PLT.pool.opacity = 0.42 * k; PLT.pool.visible = k > 0.01; } catch (e) { } });
