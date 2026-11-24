/* ================================================================
   v367 REALISM: CONTACT SHADOWS UNDER THE PROPS (2026-11-24)
   A scanned bin or crate standing on paving with no darkening under it looks pasted on. Every CC0 prop (v238 on)
   now sits on a soft contact shadow: a dark radial decal the size of its footprint, darkest at the centre, one
   instanced draw per prop kind. The AO pass handles the large scale; this handles the last few centimetres.
   ================================================================ */
const CSH = { n: 0 };
window.__CSH = CSH;
(function contactShadows() {
  if (!window.__PH || !PH.on || /contact=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); if (!c || !c.createRadialGradient) return;
  const gr = c.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.62)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
  CSH.mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }); CSH.geo = new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2);
})();
function cshBuild() { if (!CSH.mat || CSH.done) return; CSH.done = true; const seen = new Set(), m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), out = [];
  PH.ims.forEach(im => { const key = im.geometry.uuid + '|' + im.count; if (!im.geometry.boundingBox) im.geometry.computeBoundingBox(); const b = im.geometry.boundingBox; if (!b) return; const fw = Math.max(b.max.x - b.min.x, b.max.z - b.min.z), h = b.max.y - b.min.y; if (fw < 0.25 || h < 0.15) return;
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); m4.decompose(p, q, s); const k = Math.round(p.x * 5) + ',' + Math.round(p.z * 5); if (seen.has(k)) continue; seen.add(k); const y = p.y + b.min.y * s.y; out.push([p.x, y, p.z, fw * s.x * 1.25]); } });
  const im = new THREE.InstancedMesh(CSH.geo, CSH.mat, Math.max(1, out.length)), o = new THREE.Object3D(); out.forEach(([x, y, z, w], i) => { o.position.set(x, y + 0.012, z); o.scale.set(w, 1, w); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.count = out.length; im.renderOrder = 3; scene.add(im); try { cullBound(im); } catch (e) { } CSH.n = out.length; }
window.__FRAMES.push(dt => { try { CSH.t = (CSH.t || 0) + dt; if (!CSH.done && CSH.t > 10) cshBuild(); } catch (e) { CSH.done = true; } });
