/* ================================================================
   v272 THE ILLUSIONS AFTER DARK (2026-11-23)
   At night the hollow eye's bowl is lit from the rim by a ring of small warm lamps (emissive, no real light) so the
   inverted shading that makes it follow you still works in the dark; the well's bronze rim glows faintly; the
   impossible triangle's three beams pick up a cobalt edge glow so it still closes against the night sky.
   ================================================================ */
(function illusionsNight() {
  const mats = []; window.__ILN = { mats };
  try { if (window.__HOLLOW && HOLLOW.G) { const m = new THREE.MeshStandardMaterial({ color: 0x3a3020, emissive: 0xffd9a0, emissiveIntensity: 0 }); mats.push([m, 2.2]);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m); b.position.set(Math.cos(a) * 0.7, 2.9 + Math.sin(a) * 0.7, 0.05); HOLLOW.G.add(b); } } } catch (e) { }
  try { scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.material && [0x2962FF, 0x08b8e0, 0xefe8da].includes(o.material.color && o.material.color.getHex()) && o.geometry.parameters.width > 0.9 && o.geometry.parameters.depth > 8) { if (!o.material.userData.iln) { o.material.userData.iln = 1; o.material.emissive = new THREE.Color(0x2962FF); mats.push([o.material, 0.35]); } } }); } catch (e) { }
})();
window.__FRAMES.push(() => { try { const k = Math.min(1, (L.lamps || 0) * 1.3); window.__ILN.mats.forEach(([m, s]) => m.emissiveIntensity = s * k); } catch (e) { } });
