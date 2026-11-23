/* ================================================================
   v114 CONTACT SHADOWS (2026-11-23)
   The sun's shadow map is too coarse to ground anything small, so people, dogs, pigeons and cars used to look as if
   they hovered a centimetre over the paving. Now everything that moves gets a soft dark contact shadow right under
   it, the kind ambient occlusion gives in a real render: tight and dark under the feet, fading out in a hand's
   width, stronger in the day, gentler at night. One instanced layer for the whole island, updated every frame for
   whatever is within sixty metres.
   ================================================================ */
const BLOB = { t: [], N: 220 };
window.__BLOB = BLOB;
(function contactShadows() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(0.45, 'rgba(0,0,0,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c ? cv : document.createElement('canvas')), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, opacity: 0.8 }), BLOB.N);
  im.frustumCulled = false; im.renderOrder = 2; im.count = 0; scene.add(im); BLOB.im = im; BLOB.o = new THREE.Object3D();
  // who gets one: every person (residents, crowds, vendors), every CC0 animal and car
  setTimeout(() => { try { scene.traverse(o => { if (o.isGroup && o.userData && o.userData.cast) BLOB.t.push({ o, r: 0.55 }); }); } catch (e) { } }, 3000);
})();
const _bw = new THREE.Vector3(), _bd = new THREE.Vector3();
function blobFrame(dt) {
  const list = BLOB.t.concat(CC0.live.filter(h => h.ready).map(h => ({ o: h.root, r: h.name === 'taxi' || h.name === 'car_b' ? 2.6 : h.name === 'horse' ? 1.3 : h.name === 'pigeon' ? 0.22 : h.name === 'rat' ? 0.18 : 0.5, car: h.name === 'taxi' || h.name === 'car_b' })));
  const day = Math.max(0, Math.min(1, ((SKY.el || 0) + 4) / 18)); BLOB.im.material.opacity = 0.45 + 0.4 * day;
  let n = 0; const o = BLOB.o;
  for (const t of list) { if (n >= BLOB.N) break; if (t.o.userData && t.o.userData.cast && t.o.parent !== scene) continue; if (!cc0Visible(t.o)) continue; t.o.getWorldPosition(_bw); if (Math.abs(_bw.x - P.x) > 60 || Math.abs(_bw.z - P.z) > 60) continue;
    const f = floorAt(_bw.x, _bw.z, _bw.y + 1.0); let gy = f.f === null ? ground(_bw.x, _bw.z) : f.f; if (t.o.userData && t.o.userData.cast) gy = Math.max(gy, _bw.y + 0.35 - 0.05); if (_bw.y - gy > 1.5) continue;
    o.position.set(_bw.x, gy + 0.04, _bw.z); let yaw = 0; if (t.car) { t.o.getWorldDirection(_bd); yaw = Math.atan2(_bd.x, _bd.z); } o.rotation.set(-PI / 2, yaw, 0, 'YXZ'); o.scale.set(t.car ? t.r * 0.75 : t.r, t.r * (t.car ? 1.6 : 1), 1); o.updateMatrix(); BLOB.im.setMatrixAt(n++, o.matrix); }
  BLOB.im.count = n; BLOB.im.instanceMatrix.needsUpdate = true;
}
window.__FRAMES.push(dt => { try { blobFrame(dt); } catch (e) { if (!BLOB.err) { BLOB.err = e; console.warn('v114 blobs', e); } } });
