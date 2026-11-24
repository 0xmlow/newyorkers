/* ================================================================
   v428 THE BOARDWALK'S STRING LIGHTS (2026-11-24)
   Festoon lights swag along the N3W Boardwalk from lamp post to shopfront to lamp post, warm bulbs on a sagging
   black cable, the way Coney Island's walk is strung. Dark by day, on at dusk, the odd bulb gone.
   ================================================================ */
(function festoon() {
  if (!window.__BWALK || !BWALK.ok) return; const P = (deg, r, y) => { const a = deg * PI / 180; return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r); };
  const g = ground(P(240, 106, 0).x, P(240, 106, 0).z), anchors = [P(223.8, 104.9, g + 3.6), P(226, 104.9, g + 3.9), P(233, 107.6, g + 3.3), P(240.5, 104.9, g + 3.9), P(248, 107.6, g + 3.3), P(255.5, 104.9, g + 3.9), P(260.5, 104.9, g + 3.6)];
  const pts = [], cable = []; for (let i = 0; i < anchors.length - 1; i++) { const a = anchors[i], b = anchors[i + 1], L = a.distanceTo(b), n = Math.round(L / 0.55);
    for (let k = 0; k <= n; k++) { const t = k / n, p = a.clone().lerp(b, t); p.y -= Math.sin(t * PI) * L * 0.07; cable.push(p.clone()); if (k > 0 && k < n) pts.push(p); } }
  const cg = new THREE.BufferGeometry().setFromPoints(cable); scene.add(new THREE.Line(cg, new THREE.LineBasicMaterial({ color: 0x111111 })));
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), pts.length), o = new THREE.Object3D(), c = new THREE.Color();
  pts.forEach((p, i) => { o.position.set(p.x, p.y - 0.07, p.z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(0x4a4236)); }); im.instanceMatrix.needsUpdate = true; scene.add(im);
  BWALK.fest = im; BWALK.fn = pts.length; BWALK.dead = new Set(pts.map((_, i) => i).filter(i => (i * 37) % 23 === 0));
})();
window.__FRAMES.push(dt => { try { if (!BWALK.fest) return; const k = Math.min(1, (L.lamps || 0) * 1.3); if (Math.abs(k - (BWALK.fk || -1)) < 0.02) return; BWALK.fk = k; const on = new THREE.Color(0x3a3226).lerp(new THREE.Color(1.0, 0.82, 0.52), k), off = new THREE.Color(0x3a3226);
  for (let i = 0; i < BWALK.fn; i++) BWALK.fest.setColorAt(i, BWALK.dead.has(i) ? off : on); BWALK.fest.instanceColor.needsUpdate = true; } catch (e) { } });
