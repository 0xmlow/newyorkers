/* ================================================================
   v152 SEA GLASS (2026-11-23)
   Twenty four pieces of sea glass lie along the wet sand of GM BEACH, frosted and rounded by the harbour:
   bottle green, brown, white, the odd aqua, and one cobalt blue, the rare one. They catch the light as you walk.
   Walk over one to pick it up. Find twelve and it counts; the cobalt one gets its own word. New pieces wash up
   every day.
   ================================================================ */
const GLASS = { p: [], got: 0, day: -1, cobalt: false };
window.__GLASS = GLASS;
(function seaGlass() {
  const cols = [0x3f7a4a, 0x3f7a4a, 0x6a4a2a, 0x6a4a2a, 0xe8eee8, 0xe8eee8, 0x7fc8c0];
  for (let i = 0; i < 24; i++) { const cobalt = i === 13, c = cobalt ? 0x1f3ac8 : cols[i % cols.length]; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035, 0), new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.1, transparent: true, opacity: 0.85, emissive: c, emissiveIntensity: 0 }));
    m.scale.set(1.3, 0.45, 1); scene.add(m); GLASS.p.push({ m, cobalt, ph: Math.random() * 6, on: false }); }
})();
const glassSecret = secret('seaglass', () => { toast('TWELVE PIECES OF SEA GLASS IN YOUR POCKET. EACH ONE WAS A BOTTLE ONCE, SOMEWHERE IN THE CITY, YEARS AGO.', 'blue'); });
const cobaltSecret = secret('cobalt', () => { toast('COBALT. THE RARE ONE. MAYBE AN OLD MEDICINE BOTTLE, MAYBE A MILK OF MAGNESIA JAR. YOU ARE KEEPING IT FOREVER.', 'blue'); });
function glassScatter() { GLASS.p.forEach((g, i) => { let x; do { x = -60 + Math.random() * 115; } while (Math.abs(x) < 5); const z = shoreZ(x) - 0.6 - Math.random() * 3.2, f = floorAt(x, z, 3); g.m.position.set(x, (f.f === null ? 0 : f.f) + 0.012, z); g.m.rotation.y = Math.random() * 6; g.on = true; g.m.visible = true; }); }
function glassFrame(dt) {
  const t = nycTime(TIME.utc); if (t.days !== GLASS.day) { GLASS.day = t.days; glassScatter(); } if (P.z < 98) return; const glint = Math.max(0, 1 - (L.lamps || 0) * 1.3);
  GLASS.p.forEach(g => { if (!g.on) return; g.m.material.emissiveIntensity = glint * Math.pow(Math.max(0, Math.sin(LIFE.t * 1.7 + g.ph)), 30) * 2.5;
    if (Math.hypot(P.x - g.m.position.x, P.z - g.m.position.z) < 0.75 && Math.abs(P.y - g.m.position.y) < 1) { g.on = false; g.m.visible = false; GLASS.got++; try { beep(1900 + Math.random() * 400, 0.06, 'sine', 0.03); } catch (e) { }
      if (g.cobalt) cobaltSecret(); else toast('SEA GLASS · ' + GLASS.got); if (GLASS.got >= 12) glassSecret(); } });
}
window.__FRAMES.push(dt => { try { glassFrame(dt); } catch (e) { if (!GLASS.err) { GLASS.err = e; console.warn('v152 sea glass', e); } } });
