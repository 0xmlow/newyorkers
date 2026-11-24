/* ================================================================
   v469 THE LOOK: RED LIGHTS ON THE TOWERS (2026-11-24)
   Every tall thing in New York wears red at night: the aviation lights on the tops of towers, slow blinking, the
   one detail that makes a night skyline read as real. The island's tall structures (anything over thirty metres:
   the screen tower, the dark tower, the cranes, the eye) now carry one, blinking out of step with each other,
   only after dusk. ?redlights=0 off.
   ================================================================ */
const REDL = { list: [] };
window.__REDL = REDL;
function redLightsBuild() {
  const b = new THREE.Box3(), tops = []; scene.updateMatrixWorld(true);
  scene.traverse(o => { if (!o.isMesh || !o.visible || !o.geometry || o.isInstancedMesh || o === PANO.mesh || (o.material && o.material.isShaderMaterial)) return; b.setFromObject(o); if (!isFinite(b.max.y)) return; const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z;
    if (b.max.y > 30 && b.max.y < 160 && sx < 40 && sz < 40 && b.min.y < 25 && Math.hypot((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2) < 150) tops.push([(b.min.x + b.max.x) / 2, b.max.y + 0.4, (b.min.z + b.max.z) / 2]); });
  const keep = []; tops.sort((a, c) => c[1] - a[1]).forEach(t => { if (!keep.some(k => Math.hypot(k[0] - t[0], k[2] - t[2]) < 8)) keep.push(t); });
  const N = Math.min(keep.length, 16); if (!N) return;
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N), o = new THREE.Object3D(), c = new THREE.Color(0);
  for (let i = 0; i < N; i++) { o.position.set(keep[i][0], keep[i][1], keep[i][2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c); }
  im.frustumCulled = false; scene.add(im); REDL.im = im; REDL.n = N; REDL.ph = keep.slice(0, N).map((k, i) => i * 0.37);
}
window.__FRAMES.push(() => { try { if (/redlights=0/.test(location.search)) return; if (!REDL.built) { REDL.f = (REDL.f || 0) + 1; if (REDL.f < 900) return; REDL.built = true; redLightsBuild(); } if (!REDL.im) return;
  const k = Math.min(1, Math.max(0, (L.lamps || 0) * 1.5 - 0.2)), t = performance.now() / 1000, c = REDL.c || (REDL.c = new THREE.Color()); REDL.im.visible = k > 0.01; if (!REDL.im.visible) return;
  for (let i = 0; i < REDL.n; i++) { const p = (t / 1.6 + REDL.ph[i]) % 1, on = p < 0.45 ? 1 : 0.06; c.setRGB(4 * on * k, 0.15 * on * k, 0.1 * on * k); REDL.im.setColorAt(i, c); } REDL.im.instanceColor.needsUpdate = true; } catch (e) { if (!REDL.err) { REDL.err = e; console.warn('v469', e); } } });
