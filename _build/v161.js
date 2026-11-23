/* ================================================================
   v161 THE GULL (2026-11-23)
   Take food down to the beach or out on the pier and a herring gull will watch you from somewhere, and then
   come in low from behind, fast, and take it out of your hand. You see it go off over the water with your
   lunch. It only happens out there, never more than once every couple of minutes, and you can see it coming if
   you keep turning round.
   ================================================================ */
const THIEF = { st: 'idle', t: 0, wait: 12, cool: 0, g: null, food: null };
window.__THIEF = THIEF;
(function gullThief() { try { const src = GULL.g[0], wi = src.wings.map(w => src.g.children.indexOf(w)); const c = src.g.clone(true); c.scale.setScalar(1.25); c.visible = false; scene.add(c); THIEF.g = c; THIEF.wings = wi.map(j => c.children[j]); } catch (e) { } })();
const thiefSecret = secret('gullthief', () => { toast('A GULL TOOK IT RIGHT OUT OF YOUR HAND. THE OTHER GULLS SAW. THEY ARE ALL LOOKING AT YOU NOW. BEACH RULES.', 'blue'); });
const _tq = new V3();
function thiefFrame(dt) {
  if (!THIEF.g) return; THIEF.cool -= dt; const out = (P.z > 103 || (Math.abs(P.x) < 4 && P.z > 128)) && FOOD.held && FOOD.held !== 'gone' && HELD.visible;
  if (THIEF.st === 'idle') { if (out && THIEF.cool <= 0) { THIEF.wait -= dt; if (THIEF.wait <= 0) { THIEF.st = 'in'; THIEF.t = 0; const f = new V3(0, 0, -1).applyQuaternion(camera.quaternion); f.y = 0; f.normalize(); THIEF.from = new V3(P.x - f.x * 26 + f.z * 8, P.y + 14, P.z - f.z * 26 - f.x * 8); THIEF.g.visible = true; try { gullCry(P.x, P.z); } catch (e) { } } } else THIEF.wait = 8 + Math.random() * 14; return; }
  THIEF.t += dt; const W = THIEF.wings;
  if (THIEF.st === 'in') { if (!(FOOD.held && HELD.visible)) { THIEF.st = 'out'; THIEF.t = 0; THIEF.p0 = THIEF.g.position.clone(); } else { HELD.getWorldPosition(_tq); const u = Math.min(1, THIEF.t / 2.2), e = u * u; const p = THIEF.from.clone().lerp(_tq, e); p.y += Math.sin(u * PI) * -1.5; const v = p.clone().sub(THIEF.g.position);
      THIEF.g.position.copy(p); if (v.lengthSq() > 1e-6) THIEF.g.rotation.set(0, Math.atan2(-v.z, v.x), -0.2); W.forEach((w, k) => w.rotation.x = (k ? -1 : 1) * (u > 0.7 ? 1.1 : Math.sin(THIEF.t * 9) * 0.5));
      if (u >= 1) { const kind = FOOD.held; THIEF.food = HELD.children[0] ? HELD.children[0].clone(true) : null; if (THIEF.food) { THIEF.food.position.set(0.15, -0.05, 0); THIEF.g.add(THIEF.food); } HELD.visible = false; FOOD.held = null; FOOD.heldT = 0; toast('A GULL JUST TOOK YOUR ' + String(kind || 'FOOD').toUpperCase() + '.'); thiefSecret(); try { gullCry(P.x, P.z); } catch (e) { } THIEF.st = 'out'; THIEF.t = 0; THIEF.p0 = THIEF.g.position.clone(); } } }
  else { const dir = new V3(Math.sin(THIEF.t * 0.2) * 0.3, 0.35, 1).normalize(); const p = THIEF.p0.clone().addScaledVector(dir, THIEF.t * 9); THIEF.g.position.copy(p); THIEF.g.rotation.set(0, Math.atan2(-dir.z, dir.x), 0.15); W.forEach((w, k) => w.rotation.x = (k ? -1 : 1) * Math.sin(THIEF.t * 10) * 0.7);
    if (THIEF.t > 9) { THIEF.st = 'idle'; THIEF.g.visible = false; THIEF.cool = 120; THIEF.wait = 10; if (THIEF.food) { THIEF.g.remove(THIEF.food); THIEF.food = null; } } }
}
window.__FRAMES.push(dt => { try { thiefFrame(dt); } catch (e) { if (!THIEF.err) { THIEF.err = e; console.warn('v161 gull thief', e); } } });
