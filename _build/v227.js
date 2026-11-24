/* ================================================================
   v227 THE LOOK: THE BLOCK GROWS, THE BODEGA (2026-11-23)
   Every bodega in New York has a building on top of it. The 6529 BODEGA was a one storey box with a sign; now
   two floors of apartments stand over it in the same brick as the walk up: stone sills and lintels, a window
   unit here and there, rooms behind the lit windows at night (v209), a belt course at the floor line, a full
   cornice with brackets and dentils, a black fire escape down the front over the sign, and a stair bulkhead,
   condensers and a vent on the new roof. The rooftop gear that sat on the old flat roof moves up with it.
   tenementAbove() is shared: v228 and v229 use it for the laundromat and the N3W DROP shop.
   ?block=0 turns it off.
   ================================================================ */
const BLK = { n: 0, hidden: 0 };
window.__BLK = BLK;
const BLK_ON = FAC_ON && !/block=0/.test(location.search);
// hide anything already standing inside a box (the old roof gear), FAC instanced parts and small meshes only
function blkHideIn(xa, xb, za, zb, ya, yb) {
  const facMats = new Set(Object.values(FACM)), v = new THREE.Vector3(), m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const inside = p => p.x > xa && p.x < xb && p.z > za && p.z < zb && p.y > ya && p.y < yb;
  scene.traverse(o => { if (!o.isMesh) return;
    if (o.isInstancedMesh) { if (!facMats.has(o.material)) return; let hit = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4); if (inside(v)) { o.setMatrixAt(i, zero); hit++; } } if (hit) { o.instanceMatrix.needsUpdate = true; BLK.hidden += hit; } return; }
    if (o.parent !== scene || !o.geometry || !o.geometry.parameters) return; const p = o.geometry.parameters; if ((p.height || 0) > 2 || (p.width || 0) > 2) return;
    o.getWorldPosition(v); if (inside(v)) { o.visible = false; BLK.hidden++; } });
}
// two (or more) floors of brick apartments over a shop: centre cx cz, w along x, d along z, from y0, front normal fn
function tenementAbove(o) {
  const { cx, cz, w, d, y0, floors = 2, fh = 3.2, fn = [-1, 0], escape = true, roofGear = true } = o, H = floors * fh, top = y0 + H;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), MAT.brick); body.position.set(cx, y0 + H / 2, cz); body.castShadow = body.receiveShadow = true; scene.add(body);
  const winY = f => y0 + 1.6 + f * fh;
  const faces = [[1, 0, w / 2, d], [-1, 0, w / 2, d], [0, 1, d / 2, w], [0, -1, d / 2, w]];
  const blank = o.blank || []; faces.forEach(([nx, nz, hd, fw]) => { if (blank.some(b => b[0] === nx && b[1] === nz)) { (BLK.party = BLK.party || []).push({ cx, cz, nx, nz, hd, fw, y0, H }); return; } const F = facFace(cx, cz, nx, nz, hd), n = Math.max(2, Math.floor(fw / 2.6)), sp = fw / n;
    for (let f = 0; f < floors; f++) for (let k = 0; k < n; k++) facWindow(F, -fw / 2 + sp * (k + 0.5), winY(f), Math.min(1.15, sp * 0.45), 1.8, { ac: 0.22, litP: 0.5 }); });
  facBelts(cx, cz, w, d, [y0 + 0.08].concat(Array.from({ length: floors - 1 }, (_, f) => y0 + (f + 1) * fh - 0.05)));
  facCornice(cx, cz, w, d, top + 0.1, { big: true });
  if (escape) { const [nx, nz] = fn, hd = Math.abs(nx) ? w / 2 : d / 2, fw = Math.abs(nx) ? d : w, F = facFace(cx, cz, nx, nz, hd), tx = nz, tz = -nx, LW = Math.min(4.2, fw - 1.2), uL = -LW / 2, uR = LW / 2;
    const W = (u, y, ww) => new THREE.Vector3(cx + nx * (hd + ww) + tx * u, y, cz + nz * (hd + ww) + tz * u);
    for (let f = 0; f < floors; f++) { const y = winY(f) - 0.98;
      F.at(0, y, 0.62, LW, 0.05, 1.15, 'steel'); F.at(0, y + 0.95, 1.17, LW, 0.04, 0.04, 'steel'); F.at(0, y + 0.5, 1.17, LW, 0.03, 0.03, 'steel');
      [uL, uR].forEach(u => { F.at(u, y + 0.48, 0.62, 0.04, 0.04, 1.1, 'steel'); F.at(u, y + 0.95, 0.62, 0.04, 0.04, 1.1, 'steel'); F.at(u, y + 0.48, 0.62, 0.04, 0.95, 0.04, 'steel'); });
      for (let u = uL; u <= uR + 0.01; u += 0.26) F.at(u, y + 0.48, 1.17, 0.025, 0.95, 0.025, 'steel');
      [uL + 0.2, uR - 0.2].forEach(u => facBar(FACM.steel, W(u, y - 0.6, 0), W(u, y - 0.02, 1.0), 0.05, 0.05));
      if (f < floors - 1) { const y2 = winY(f + 1) - 0.98; for (let s = 1; s < 9; s++) { const t = s / 9; F.at(uL + 0.4 + t * 1.7, y + t * (y2 - y), 0.92, 0.24, 0.03, 0.5, 'steel'); }
        [0.66, 1.16].forEach(ww => facBar(FACM.steel, W(uL + 0.4, y, ww), W(uL + 2.1, y2, ww), 0.07, 0.035)); }
      else { F.at(uR - 0.6, y + 1.0 + (top - y) / 2 - 0.4, 0.3, 0.04, top - y - 0.2, 0.04, 'steel'); F.at(uR - 0.2, y + 1.0 + (top - y) / 2 - 0.4, 0.3, 0.04, top - y - 0.2, 0.04, 'steel');
        for (let s = 0; s < 6; s++) F.at(uR - 0.4, y + 1.2 + s * 0.3, 0.3, 0.4, 0.03, 0.03, 'steel'); } }
    // the drop ladder, folded up under the first landing
    const y1 = winY(0) - 0.98; [uR - 0.6, uR - 0.2].forEach(u => F.at(u, y1 - 0.65, 1.05, 0.04, 1.3, 0.04, 'steel')); for (let s = 0; s < 4; s++) F.at(uR - 0.4, y1 - 0.25 - s * 0.3, 1.05, 0.4, 0.03, 0.03, 'steel'); }
  if (roofGear) { const r = top + 0.12; const [nx, nz] = fn;
    // stair bulkhead toward the back, two condensers, a vent
    facPut('stoneD', cx - nx * (w / 2 - 1.6), r + 1.2, cz - nz * (d / 2 - 1.6) + (nx ? d / 4 : 0), 2.2, 2.4, 2.2); facPut('stone', cx - nx * (w / 2 - 1.6), r + 2.45, cz - nz * (d / 2 - 1.6) + (nx ? d / 4 : 0), 2.4, 0.12, 2.4);
    [[0.6, -1.2], [0.6, 0.3]].forEach(([a, b]) => { const x = cx + (nx ? a : b), z = cz + (nx ? b : a); facPut('ac', x, r + 0.42, z, 1.0, 0.84, 0.72, nx ? 0 : PI / 2); facPut('frameK', x, r + 0.86, z, 0.62, 0.04, 0.62, nx ? 0 : PI / 2); facPut('steel', x, r + 0.04, z, 1.1, 0.08, 0.8, nx ? 0 : PI / 2); });
    facPut('steel', cx + 1.2 * (nx ? 0 : 1), r + 0.5, cz - 1.4 * (nx ? 1 : 0) - 1.4 * (nz ? 0 : 0), 0.18, 1.0, 0.18, 0);
    facPut('tar', cx, r - 0.06, cz, w - 0.6, 0.02, d - 0.6, 0); }
  BLK.n++; return { top, body };
}
window.tenementAbove = tenementAbove;
(function bodegaUpstairs() {
  if (!BLK_ON) return;
  FACM.tar = FACM.tar || new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.95 });
  const bx = 17, bz = 66, w = 10, d = 14, bg = ground(bx, bz) + 0.02;
  blkHideIn(bx - w / 2 + 0.1, bx + w / 2 - 0.1, bz - d / 2 + 0.1, bz + d / 2 - 0.1, bg + 4.88, bg + 12);
  const r = tenementAbove({ cx: bx, cz: bz, w, d, y0: bg + 4.96, floors: 2, fn: [-1, 0], blank: [[1, 0]] });
  BLK.bodega = r.top;   // flushed once, with v228, v229 and v233
})();
