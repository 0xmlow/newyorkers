/* ================================================================
   v136 PAPER PLANES (2026-11-23)
   F folds a dart out of a Meme card and throws it from where you stand, in the direction you are looking. It
   flies on a small real flight model (lift against gravity, drag, a slow pitch oscillation like a real paper
   plane, a little drift in the breeze), glides down, skids and lies on the ground for a while. Throw from a
   roof. A throw that flies forty metres counts.
   ================================================================ */
const PAPER = { list: [], max: 14, cool: 0 };
window.__PAPER = PAPER;
(function paperPlanes() {
  const v = [0, 0, 0.32, -0.16, 0.01, -0.18, 0, 0, -0.18, 0, 0, 0.32, 0.16, 0.01, -0.18, 0, 0, -0.18, 0, 0, 0.32, 0, 0, -0.18, 0, -0.06, -0.14];
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 1, 0, 0, 0.5, 0, 0.5, 1, 1, 0, 0.5, 0, 0.5, 1, 0.5, 0, 0.3, 0.1], 2)); geo.computeVertexNormals(); PAPER.geo = geo;
})();
const paperSecret = secret('paperplane', () => { toast('FORTY METRES ON A FOLDED MEME. SOMEBODY ON THE OTHER SIDE OF THE ISLAND PICKS IT UP AND READS IT.', 'blue'); });
function paperThrow() {
  if (PAPER.cool > 0) return; PAPER.cool = 0.35; let mat;
  try { const n = MEME_NS[(Math.random() * MEME_NS.length) | 0], mm = memeMesh(n, 0.4, {}); mat = new THREE.MeshStandardMaterial({ map: mm.material.map, roughness: 0.85, side: THREE.DoubleSide }); } catch (e) { mat = new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.85, side: THREE.DoubleSide }); }
  const m = new THREE.Mesh(PAPER.geo, mat); m.castShadow = true; scene.add(m);
  const f = new V3(0, 0, -1).applyQuaternion(camera.quaternion); const sp = 8.5; const p = camera.position.clone().addScaledVector(f, 0.5); p.y -= 0.12;
  const q = { m, p, v: f.multiplyScalar(sp), turn: (Math.random() - 0.5) * 0.25, t: 0, land: -1, start: p.clone() }; q.v.y += 0.6; PAPER.list.push(q);
  if (PAPER.list.length > PAPER.max) { const o = PAPER.list.shift(); scene.remove(o.m); o.m.material.dispose(); }
  try { beep(1800, 0.05, 'triangle', 0.02); } catch (e) { }
}
addEventListener('keydown', e => { if (e.code !== 'KeyF' || e.repeat || ($('chat') && $('chat').style.display === 'block')) return; paperThrow(); });
const _pv = new THREE.Vector3(), _pu = new THREE.Vector3(0, 1, 0), _ppm = new THREE.Matrix4();
function paperFrame(dt) {
  PAPER.cool -= dt; const h = Math.min(dt, 1 / 30);
  PAPER.list.forEach(q => { q.t += dt;
    if (q.land >= 0) { q.land += dt; if (q.land > 25) { q.m.visible = false; } return; }
    const v = q.v, s = v.length(), dir = _pv.copy(v).divideScalar(Math.max(s, 1e-4)), gam = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    const Cl = 9.8 / 64, Cd = Cl / 5.5, along = -9.8 * Math.sin(gam) - Cd * s * s, normal = Cl * s * s - 9.8 * Math.cos(gam);
    const ns = Math.max(0.5, s + along * h), ng = gam + normal / Math.max(s, 0.5) * h, hd = Math.atan2(v.x, v.z) + q.turn * h; const ch = Math.cos(ng);
    v.set(Math.sin(hd) * ch * ns, Math.sin(ng) * ns, Math.cos(hd) * ch * ns); v.x += 0.25 * h; q.p.addScaledVector(v, h);
    q.m.position.copy(q.p); _ppm.lookAt(q.p, _pv.copy(q.p).sub(v), _pu); q.m.quaternion.setFromRotationMatrix(_ppm); q.m.rotateZ(q.turn * 1.5);
    const fl = floorAt(q.p.x, q.p.z, q.p.y + 0.5), fy = fl.f === null ? -0.05 : fl.f; if (q.p.y <= fy + 0.03 || q.t > 30) { q.p.y = fy + 0.03; q.m.position.copy(q.p); q.m.rotation.set(0, Math.atan2(v.x, v.z), 0.15); q.land = 0; const dist = Math.hypot(q.p.x - q.start.x, q.p.z - q.start.z); if (dist > 40) paperSecret(); if (dist > 6) toast('YOUR PLANE FLEW ' + Math.round(dist) + ' METRES.'); } });
}
window.__FRAMES.push(dt => { try { paperFrame(dt); } catch (e) { if (!PAPER.err) { PAPER.err = e; console.warn('v136 paper planes', e); } } });
