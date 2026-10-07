/* Which meshes does each tour rail's camera pass inside? Samples the real rail (step the game) and tests the camera against
   every visible mesh's world box, shrunk 5% so grazing passes don't count. Ground, sea, sky and island base are skipped by size. */
window.__probeRails = function (idxs) {
  const g = window.__game, cam = g.camera, out = {}, box = new THREE.Box3(), sz = new THREE.Vector3();
  const named0 = o => { for (let p = o; p; p = p.parent) if (p.name) return p.name; return o.geometry.type + (o.material && o.material.color ? '#' + o.material.color.getHexString() : ''); };
  const boxes = []; g.scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh) return; for (let p = o; p; p = p.parent) if (!p.visible) return;
    const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()); if (s.x > 120 || s.z > 120) return; b.expandByScalar(-Math.min(s.x, s.y, s.z) * 0.05);
    const c = b.getCenter(new THREE.Vector3()); boxes.push({ b, k: named0(o) + ' @' + [c.x, c.y, c.z].map(v => v.toFixed(1)).join(',') + ' size ' + [s.x, s.y, s.z].map(v => v.toFixed(1)).join(',') }); });
  const named = o => { for (let p = o; p; p = p.parent) if (p.name) return p.name; return o.geometry.type + (o.material && o.material.color ? '#' + o.material.color.getHexString() : ''); };
  idxs.forEach(i => {
    const r = g.TOUR[i], N = Math.round(r.dur * 30); g.playRail(Object.assign({}, r, { done: null })); const hits = {};
    for (let f = 0; f < N; f++) {
      g.step(1 / 30, 1); const c = cam.position;
      for (const { b, k } of boxes) if (b.containsPoint(c)) (hits[k] = hits[k] || []).push(+(f / 30).toFixed(2));
    }
    out[r.name] = Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, [v[0], v[v.length - 1], v.length]]));
  });
  return out;
};
