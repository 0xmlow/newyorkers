/* ================================================================
   v252 WALLPAPER AFTER DARK (2026-11-23)
   A painted wall in the city at night is lit from below by whatever is near it. Each Firefly mural (v247, v249) now
   gets a wash of warm light thrown up its face after dusk, brightest at the foot and fading by the top, painted
   on as additive light so the light budget does not change. ?wallpaper=0 off.
   ================================================================ */
const WNIGHT = { mats: [] };
window.__WNIGHT = WNIGHT;
(function muralUplights() {
  if (!WALLS.on) return;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d');
  if (c && c.createLinearGradient) { const g = c.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, 'rgba(255,214,160,0.85)'); g.addColorStop(0.25, 'rgba(255,200,140,0.25)'); g.addColorStop(0.6, 'rgba(255,190,130,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); }
  const t = new THREE.CanvasTexture(cv); const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }); WNIGHT.mat = mat;
  scene.traverse(o => { if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.wall) return; if (o.geometry.type !== 'PlaneGeometry') return;
    const p = o.geometry.parameters; const w = new THREE.Mesh(new THREE.PlaneGeometry(p.width, p.height), mat); w.position.copy(o.position); w.quaternion.copy(o.quaternion); w.translateZ(0.01); w.renderOrder = 5; scene.add(w); WNIGHT.mats.push(w); });
})();
window.__FRAMES.push(() => { try { if (!WNIGHT.mat) return; const k = Math.min(1, (L.lamps || 0) * 1.3); WNIGHT.mat.opacity = 0.2 * k; WNIGHT.mat.visible = k > 0.01; } catch (e) { } });
