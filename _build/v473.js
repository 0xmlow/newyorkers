/* ================================================================
   v473 THE HOLLOW FACE, LIT FROM BELOW (2026-11-24)
   The hollow mask works best lit from underneath, because a real face lit from below looks wrong and the brain
   works harder to keep it convex. A warm uplight sits in the column's cap: a soft pool on the marble and a glow
   under the chin at night, faint by day. ?eastbeach=0 off.
   ================================================================ */
(function faceUplight() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return; const P = eastAt(40, 120);
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'); if (c && c.createRadialGradient) { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,220,170,1)'); g.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: 0xffd9a8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); sp.scale.set(1.6, 1.6, 1); sp.position.set(P.x + P.nx * 0.35, P.g + 1.45, P.z + P.nz * 0.35); scene.add(sp); EASTB.up = sp;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: 0xffe2b8, toneMapped: false })); lens.rotation.x = -PI / 2; lens.position.set(P.x + P.nx * 0.3, P.g + 1.335, P.z + P.nz * 0.3); scene.add(lens);
})();
window.__FRAMES.push(() => { try { if (!EASTB.up) return; const k = Math.min(1, (L.lamps || 0) * 1.3); EASTB.up.material.opacity = 0.12 + 0.6 * k; if (EASTB.face) EASTB.face.children.forEach(m => { if (m.material && m.material.emissive) { m.material.emissive.setRGB(0.25, 0.17, 0.1); m.material.emissiveIntensity = k * 0.5; } }); } catch (e) { } });
