/* ================================================================
   v198 THE LOOK: BUIDL IN STEEL (2026-11-23)
   The unfinished building was thin poles holding up planks. It is now what a New York site really looks like
   halfway up: wide flange columns in red oxide primer, steel beams framing every floor that has been decked,
   X bracing in the end bays, a yellow guardrail round each open floor edge and orange safety netting hung down
   the north face. Same grid, same heights, same floors, still never finished. ?buidl=0 off.
   ================================================================ */
const BUIDL2 = {};
window.__BUIDL2 = BUIDL2;
(function buidlSteel() {
  if (!FAC_ON || /buidl=0/.test(location.search)) return; let pm = null;
  scene.traverse(o => { if (o.isInstancedMesh && o.material === MAT.steel && o.geometry && o.geometry.parameters && o.geometry.parameters.radiusTop === 0.07 && o.count > 10 && o.count <= 40) pm = o; });
  if (!pm) return; FACM.primer = new THREE.MeshStandardMaterial({ color: 0x7e3324, roughness: 0.7, metalness: 0.25 }); FACM.rail = new THREE.MeshStandardMaterial({ color: 0xe8b819, roughness: 0.55 });
  const cols = new Map(), m4 = new THREE.Matrix4(), p = new V3(), q = new THREE.Quaternion(), s = new V3();
  for (let i = 0; i < pm.count; i++) { pm.getMatrixAt(i, m4); m4.decompose(p, q, s); cols.set(Math.round(p.x) + ',' + Math.round(p.z), { x: p.x, z: p.z, top: p.y + s.y / 2, bot: p.y - s.y / 2 }); }
  pm.visible = false; const g = ground(-48, -47), x0 = -56, x1 = -40, z0 = -54, z1 = -40;
  cols.forEach(c => { const h = c.top - c.bot, y = (c.top + c.bot) / 2; facPut('primer', c.x - 0.11, y, c.z, 0.03, h, 0.24); facPut('primer', c.x + 0.11, y, c.z, 0.03, h, 0.24); facPut('primer', c.x, y, c.z, 0.22, h, 0.025); facPut('primer', c.x, c.bot + 0.03, c.z, 0.45, 0.06, 0.45); });
  const C = (x, z) => cols.get(Math.round(x) + ',' + Math.round(z));
  [4, 8, 12].forEach((yy, li) => { const xEnd = x1 - li * 4; for (let x = x0; x <= xEnd + 0.01; x += 4) for (let z = z0; z <= z1 + 0.01; z += 3.5) { const a = C(x, z); if (!a || a.top < g + yy) continue;
      const b = C(x + 4, z); if (b && b.top >= g + yy && x + 4 <= xEnd + 0.01) facPut('primer', x + 2, g + yy - 0.2, z, 4, 0.28, 0.16);
      const c = C(x, z + 3.5); if (c && c.top >= g + yy) facPut('primer', x, g + yy - 0.2, z + 1.75, 0.16, 0.28, 3.5); }
    // guardrail round the open edge of this floor
    const xa = x0 - 0.2, xb = xEnd + 4 - 0.2, za = z0 - 0.4, zb = z1 + 0.4; [0.55, 1.05].forEach(h => { facPut('rail', (xa + xb) / 2, g + yy + h, za, xb - xa, 0.05, 0.05); facPut('rail', (xa + xb) / 2, g + yy + h, zb, xb - xa, 0.05, 0.05); facPut('rail', xb, g + yy + h, (za + zb) / 2, 0.05, 0.05, zb - za); });
    for (let x = xa; x <= xb; x += 2) { facPut('rail', x, g + yy + 0.55, za, 0.05, 1.1, 0.05); facPut('rail', x, g + yy + 0.55, zb, 0.05, 1.1, 0.05); } });
  // X bracing in the west end bays
  [[x0, z0, x0, z0 + 3.5], [x0, z1 - 3.5, x0, z1]].forEach(([ax, az, bx, bz]) => { [[g + 0.3, g + 4], [g + 4, g + 8]].forEach(([ya, yb]) => { facBar(FACM.primer, new V3(ax, ya, az), new V3(bx, yb, bz), 0.05, 0.05); facBar(FACM.primer, new V3(ax, yb, az), new V3(bx, ya, bz), 0.05, 0.05); }); });
  // safety netting down the north face (z0), upper floors
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); if (c && c.fillRect) { c.clearRect(0, 0, 64, 64); c.fillStyle = '#fff'; for (let i = 0; i < 64; i += 8) { c.fillRect(i, 0, 2, 64); c.fillRect(0, i, 64, 2); } }
  const nt = new THREE.CanvasTexture(cv); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(40, 16);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xff6b1a, alphaMap: nt, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 })); net.position.set((x0 + x1) / 2, g + 8.5, z0 - 0.55); net.rotation.y = PI; scene.add(net);
  facFlush(); BUIDL2.n = cols.size;
})();
