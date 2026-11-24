/* ================================================================
   v442 THE LOOK: CAR PAINT (2026-11-24)
   Every car on the island (the six in traffic, the N3W cab, the parked pair, the bus) was painted in the scan
   kit's flat matte, roughness 0.9 on everything, so the cars read as plastic toys in every street shot. They now
   wear real finishes: a clear coat over the paint (the sky and the buildings slide across the bonnet and the
   doors as they drive), metallic flake in the colours that would have it, dark mirrored glass, bright work on
   the trim, rubber that stays matte. After dusk the headlights burn warm and the tail lights red.
   ?carpaint=0 off.
   ================================================================ */
const CPAINT = { lamps: [] };
window.__CPAINT = CPAINT;
(function carPaint() {
  if (!LOOK.on || /carpaint=0/.test(location.search) || !THREE.MeshPhysicalMaterial) return;
  const done = new Map();
  const swap = m => { if (done.has(m)) return done.get(m); let n = m; const nm = (m.name || '').toLowerCase();
    if (/window|glass/.test(nm)) { n = new THREE.MeshPhysicalMaterial({ color: 0x0c0f13, roughness: 0.04, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 }); }
    else if (/head/.test(nm)) { n = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.2, metalness: 0.3, emissive: 0xffd9a0, emissiveIntensity: 0 }); CPAINT.lamps.push([n, 2.2]); }
    else if (/tail/.test(nm)) { n = new THREE.MeshStandardMaterial({ color: 0x8a0d0b, roughness: 0.25, metalness: 0.1, emissive: 0xff1a10, emissiveIntensity: 0 }); CPAINT.lamps.push([n, 1.6]); }
    else if (/black|tyre|tire|rubber/.test(nm)) { n = m.clone(); n.roughness = 0.82; }
    else if (/grey|gray|material\.00|chrome|silver/.test(nm)) { n = new THREE.MeshPhysicalMaterial({ color: m.color.clone().lerp(new THREE.Color(0xd8dde3), 0.6), roughness: 0.22, metalness: 0.95, clearcoat: 0.5 }); }
    else if (m.color) { const c = m.color.clone(), l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11, cab = /yellow/.test(nm);
      n = new THREE.MeshPhysicalMaterial({ color: c, roughness: cab ? 0.42 : 0.34, metalness: cab || l > 0.75 ? 0.05 : 0.55, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2, map: m.map || null }); }
    if (n !== m) n.name = m.name; done.set(m, n); return n; };
  const dress = g => { if (!g) return; g.traverse(o => { if (!o.isMesh || o.userData.cpaint) return; o.userData.cpaint = 1; o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material); }); };
  const all = () => { try { TRAF.c.forEach(c => dress(c.h.root)); } catch (e) { } try { dress(CAB.g); } catch (e) { } try { CARS.c.forEach(c => dress(c.g)); } catch (e) { } try { dress(BUS.g); } catch (e) { } };
  // the scans load in the background: dress again for the first minute as their meshes arrive
  all(); let n = 0; const iv = setInterval(() => { all(); if (++n > 20) clearInterval(iv); }, 3000); CPAINT.all = all;
})();
window.__FRAMES.push(() => { try { const k = Math.min(1, (L.lamps || 0) * 1.4); CPAINT.lamps.forEach(([m, s]) => m.emissiveIntensity = k * s); } catch (e) { } });
