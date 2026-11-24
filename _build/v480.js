/* ================================================================
   v480 THE ILLUSION BEACH SITS DOWN (2026-11-24)
   Soft contact shadows under every east beach piece where it meets the sand (the column, the plinth, the wall, the
   cube's post, the wheel, the spiral's frame, the fence), the way v419 sat the sideshow down, and snow settles on
   the duckboards like the boardwalk's.
   ================================================================ */
(function eastSit() {
  if (!window.__EASTB) return; const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'); if (!c || !c.createRadialGradient) return;
  const gr = c.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(0.55, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
  const put = (deg, r, w, d) => { const P = eastAt(deg, r), m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.order = 'YXZ'; m.rotation.set(-PI / 2, P.ry, 0); m.position.set(P.x, P.g + 0.02, P.z); m.renderOrder = 3; scene.add(m); };
  put(40, 120, 1.4, 1.4); put(89, 121, 0.7, 0.7); put(134, 121, 1.0, 0.8); put(150, 120.5, 4.2, 1.6); put(118, 124.5, 11.8, 1.0);
  try { if (window.__SNOWL && SNOWL.add && EASTB.path) setTimeout(() => SNOWL.add(EASTB.path.material), 33000); } catch (e) { }
})();
