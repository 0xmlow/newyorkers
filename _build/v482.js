/* ================================================================
   v482 THE SPIRAL THAT FLOWS (2026-11-24)
   The Fraser spiral now turns very slowly on its frame. Turning, the leaning cords seem to pour inward along a
   spiral that is still not there, which makes the lie stronger: the rings never move toward the middle at all.
   ================================================================ */
window.__FRAMES.push(dt => { try { if (!EASTB.fraser || camera.position.distanceTo(EASTB.fraser.position) > 60) return; EASTB.fraser.material.map.rotation = (EASTB.fraser.material.map.rotation || 0) - dt * 0.12; EASTB.fraser.material.map.center.set(0.5, 0.5); } catch (e) { } });
