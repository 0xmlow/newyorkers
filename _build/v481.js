/* ================================================================
   v481 THE LOOK: HEADLIGHTS ON A WET ROAD (2026-11-24)
   A wet road at night mirrors every headlight into a long bright smear toward you. When it rains (or the road is
   still wet after), the headlight pools (v446) stretch out ahead of each car, brighten, and pick up a thin bright
   core, and the tail lights drag red streaks behind. ?headlights=0 off.
   ================================================================ */
window.__FRAMES.push(() => { try { if (!window.__HEADL || !HEADL.p.length) return; const w = Math.min(1, WX.wet || 0), k = Math.min(1, (L.lamps || 0) * 1.3); if (k < 0.02) return;
  HEADL.p.forEach(h => { h.f.scale.set(1 - 0.35 * w, 1 + 1.4 * w, 1); h.f.material.opacity = (0.3 + 0.3 * w) * k; h.r.scale.set(1, 1 + 2.5 * w, 1); h.r.material.opacity = (0.22 + 0.25 * w) * k;
    if (w > 0.01) { const root = h.car.h.root, ry = root.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry); h.f.position.x = root.position.x + fx * (6.8 + 7 * w); h.f.position.z = root.position.z + fz * (6.8 + 7 * w); h.r.position.x = root.position.x - fx * (3.1 + 3 * w); h.r.position.z = root.position.z - fz * (3.1 + 3 * w); } }); } catch (e) { } });
