/* ================================================================
   v422 THE BARBER POLE AT NIGHT (2026-11-24)
   A lit barber pole throws its colour on the wall behind it. After dusk a soft halo of red, bone and cobalt spreads
   on N3W CUTS' pilaster round the pole, pulsing faintly as the stripes turn.
   ================================================================ */
(function poleHalo() {
  if (!window.__CUTS || !CUTS.pole) return; const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const c = cv.getContext('2d'); if (!c || !c.createRadialGradient) return;
  const gr = c.createRadialGradient(64, 128, 4, 64, 128, 64); gr.addColorStop(0, 'rgba(255,200,200,.9)'); gr.addColorStop(0.5, 'rgba(160,120,255,.35)'); gr.addColorStop(1, 'rgba(80,110,255,0)'); c.save(); c.scale(1, 2); c.translate(0, -64); c.fillStyle = gr; c.fillRect(0, 0, 128, 256); c.restore();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const [x, z] = CUTS.at(-CUTS.W / 2 + 0.25, CUTS.D / 2 + 0.25); m.position.set(x, CUTS.g + 2.05, z); m.rotation.y = CUTS.ry; scene.add(m); CUTS.halo = m;
})();
window.__FRAMES.push(() => { try { if (!CUTS.halo) return; const k = Math.min(1, (L.lamps || 0) * 1.3); CUTS.halo.visible = k > 0.02; CUTS.halo.material.opacity = k * (0.5 + 0.08 * Math.sin(performance.now() / 300)); } catch (e) { } });
