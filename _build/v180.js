/* ================================================================
   v180 THE LOOK: KERBS (2026-11-23)
   The ring road ran into the grass with no edge at all. It now has granite kerbs on both sides, the way every New
   York street does: a dressed top, a rounded arris, a face standing a few inches proud of the asphalt, in stone
   that weathers. The promenade ring gets a flush granite edging on its inner side. ?kerbs=0 off.
   ================================================================ */
const KERB = {};
window.__KERB = KERB;
(function kerbs() {
  if (!LOOK.on || /kerbs=0/.test(location.search)) return;
  const gran = new THREE.MeshStandardMaterial({ color: 0x6f6c66, roughness: 0.86 }); KERB.m = gran;
  const ring = (rIn, rOut, y0, y1, seg) => { const pts = [[rIn, y0], [rIn, y1 - 0.02], [rIn + 0.02, y1], [rOut - 0.02, y1], [rOut, y1 - 0.02], [rOut, y0]].map(([r, y]) => new THREE.Vector2(r, y));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, seg), gran); m.receiveShadow = true; m.castShadow = false; scene.add(m); return m; };
  KERB.inner = ring(95.62, 96.0, 0.5, 0.79, 360); KERB.outer = ring(104.0, 104.38, 0.5, 0.79, 380);
  const e = new THREE.Mesh(new THREE.RingGeometry(37.25, 37.5, 200, 1), new THREE.MeshStandardMaterial({ color: 0x76736c, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  e.rotation.x = -PI / 2; e.position.y = 0.67; e.receiveShadow = true; scene.add(e); KERB.edge = e;
  if (typeof weathMat === 'function') try { weathMat(gran); } catch (er) { }
})();
