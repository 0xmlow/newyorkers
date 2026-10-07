/* Near-plane probe: rays from the camera through the frame centre and four corners; reports whatever sits closer than 2.5 m. */
window.__probeNear = function (i) {
  const g = window.__game, cam = g.camera, r = g.TOUR[i], N = Math.round(r.dur * 30), rc = new THREE.Raycaster(), out = [];
  rc.far = 2.5; g.playRail(Object.assign({}, r, { done: null }));
  const nm = o => { for (let p = o; p; p = p.parent) if (p.name) return p.name; return o.type + ':' + o.geometry.type + (o.material && o.material.color ? '#' + o.material.color.getHexString() : ''); };
  for (let f = 0; f < N; f++) {
    g.step(1 / 30, 1); if (f % 3) continue; cam.updateMatrixWorld();
    for (const [x, y] of [[0, 0], [-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
      rc.setFromCamera({ x, y }, cam); const h = rc.intersectObjects(g.scene.children, true).filter(h => h.object.visible)[0];
      if (h) { const p = h.object.getWorldPosition(new THREE.Vector3()); out.push((f / 30).toFixed(1) + 's ' + nm(h.object) + ' d=' + h.distance.toFixed(2) + ' obj@' + [p.x, p.y, p.z].map(v => v.toFixed(0)).join(',') + ' cam@' + [cam.position.x, cam.position.y, cam.position.z].map(v => v.toFixed(1)).join(',')); break; }
    }
  }
  return out;
};
