/* ================================================================
   v112 LAMPLIGHT (2026-11-23)
   After dark the street lamps finally light the ground: a warm pool of light on the paving under each of the
   thirty six lamps round the ring road and the paths, falling off softly, with a faint halo round every bulb, and
   smaller pools under the market, the shed and the stoop. They come up with the lamps at dusk and go at dawn.
   ================================================================ */
const LAMP = { pools: null, halos: null, n: 0 };
window.__LAMP = LAMP;
(function lamplight() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,214,150,1)'); g.addColorStop(0.35, 'rgba(255,190,120,.45)'); g.addColorStop(1, 'rgba(255,170,100,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }
  const tx = new THREE.CanvasTexture(cv);
  const pts = []; scene.traverse(o => { if (o.isInstancedMesh && o.material === MAT.bulb && o.count <= 60) { const m = new THREE.Matrix4(), v = new THREE.Vector3(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); pts.push([v.x, v.y, v.z, 6.5]); } } });
  [[MKT_AT.x, MKT_AT.z - 2, 3.1, 5], [SHED_AT.x, SHED_AT.z, 3, 4], [BROWN.fx - 2, BROWN_AT.z - 2.4, 2.5, 3.5], [BUS.shel[0].x, BUS.shel[0].z, 2.5, 3], [BUS.shel[1].x, BUS.shel[1].z, 2.5, 3], [NEWS_AT.x, NEWS_AT.z, 2.5, 3.5], [LINE_AT.x - 4, LINE_AT.z - 3, 3, 4]].forEach(([x, z, y, r]) => pts.push([x, ground(x, z) + y, z, r]));
  LAMP.n = pts.length; const N = pts.length;
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }), N);
  const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), N);
  const o = new THREE.Object3D(); pts.forEach(([x, y, z, r], i) => { const f = floorAt(x, z, y - 0.5); const gy = (f.f === null ? ground(x, z) : f.f) + 0.08; o.position.set(x, gy, z); o.rotation.set(-PI / 2, 0, 0); o.scale.set(r * 2, r * 2, 1); o.updateMatrix(); pools.setMatrixAt(i, o.matrix); });
  pools.frustumCulled = halos.frustumCulled = false; pools.renderOrder = 3; halos.renderOrder = 6; scene.add(pools); scene.add(halos); LAMP.pools = pools; LAMP.halos = halos; LAMP.pts = pts; LAMP.o = o;
})();
function lampFrame(dt) {
  const k = Math.min(1, Math.max(0, ((L.lamps || 0) - 0.15) * 1.4)); LAMP.pools.visible = LAMP.halos.visible = k > 0.01; if (k <= 0.01) return;
  LAMP.pools.material.opacity = 0.42 * k; LAMP.halos.material.opacity = 0.5 * k;
  const o = LAMP.o; LAMP.pts.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.quaternion.copy(camera.quaternion); o.scale.setScalar(1.1 + Math.sin(LIFE.t * 1.7 + i) * 0.04); o.updateMatrix(); LAMP.halos.setMatrixAt(i, o.matrix); }); LAMP.halos.instanceMatrix.needsUpdate = true;
}
window.__FRAMES.push(dt => { try { lampFrame(dt); } catch (e) { if (!LAMP.err) { LAMP.err = e; console.warn('v112 lamps', e); } } });
