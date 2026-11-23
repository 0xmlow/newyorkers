/* ================================================================
   v116 THE COYOTE AND THE DEER (2026-11-23)
   Two true New York wildlife stories. After midnight a coyote (they really do live in this city) trots the edge
   of the beach, stops when it notices you, looks at you for a long second and lopes off. And at dawn a doe and a
   stag (Staten Island is full of them) graze on the west beach; walk closer than ten metres and they bolt.
   All three are rigged CC0 animals. COYOTE and DEER bring them out at any hour.
   ================================================================ */
const WILD = { coy: null, ca: 0.4, cst: 'trot', ct: 0, deer: [], until: { coy: 0, deer: 0 } };
window.__WILD = WILD;
(function wildlife() {
  WILD.coy = CC0.make('wolf', { h: 0.62, tint: 0xc9a77a, runAt: 3, runSp: 7, walkSp: 1.3, far: 120 }); WILD.coy.root.visible = false;
  [['deer', 1.25, -58, 108], ['stag', 1.45, -61, 111]].forEach(([n, h, x, z], i) => { const hh = CC0.make(n, { h, runAt: 2.8, runSp: 8, idleAlt: 'eat', far: 120 }); hh.root.visible = false; WILD.deer.push({ h: hh, hx: x, hz: z, x, z, yaw: 2.2 + i * 0.4, flee: 0, ph: i * 3 }); });
})();
const coySecret = secret('coyote', () => { toast('A COYOTE. IN NEW YORK. IT LOOKED AT YOU LIKE YOU WERE THE ONE WHO DID NOT BELONG.', 'blue'); });
const deerSecret = secret('deer', () => { toast('THE DEER BOLT DOWN THE BEACH. STATEN ISLAND HAS THOUSANDS. NOBODY KNOWS WHAT TO DO ABOUT IT.', 'blue'); });
EGGS.coyote = () => { WILD.until.coy = LIFE.t + 180; WILD.ca = Math.atan2(P.x, P.z) + 0.4; toast('SOMETHING IS MOVING ALONG THE BEACH.'); }; EGGS.coyote.__s = true;
EGGS.deer = () => { WILD.until.deer = LIFE.t + 180; toast('THE DEER ARE ON THE WEST BEACH.'); }; EGGS.deer.__s = true;
function wildFrame(dt) {
  const h = SKY.t ? SKY.t.hours : 12; const coyOn = h < 4.5 || h >= 23.5 || WILD.until.coy > LIFE.t, deerOn = (h >= 5.5 && h < 8.5) || WILD.until.deer > LIFE.t;
  const C = WILD.coy; C.root.visible = coyOn;
  if (coyOn) { const R = 128, x = Math.sin(WILD.ca) * R, z = Math.cos(WILD.ca) * R, d = Math.hypot(P.x - x, P.z - z); WILD.ct -= dt;
    if (WILD.cst === 'trot') { WILD.ca += 1.6 / R * dt; if (d < 18) { WILD.cst = 'look'; WILD.ct = 2.2; } }
    else if (WILD.cst === 'look') { if (WILD.ct <= 0) { WILD.cst = 'run'; WILD.ct = 6; coySecret(); } }
    else { WILD.ca += 7 / R * dt; if (WILD.ct <= 0) WILD.cst = 'trot'; }
    C.root.position.set(x, ground(x, z), z); const ty = WILD.cst === 'look' ? Math.atan2(P.x - x, P.z - z) : Math.atan2(Math.cos(WILD.ca), -Math.sin(WILD.ca)); C.root.rotation.y = ty; }
  WILD.deer.forEach(D => { D.h.root.visible = deerOn; if (!deerOn) return; const d = Math.hypot(P.x - D.x, P.z - D.z);
    if (d < 10 && D.flee <= 0) { D.flee = 5; D.fy = Math.atan2(D.x - P.x, D.z - P.z); deerSecret(); }
    if (D.flee > 0) { D.flee -= dt; D.x += Math.sin(D.fy) * 8 * dt; D.z += Math.cos(D.fy) * 8 * dt; D.yaw = D.fy; if (Math.hypot(D.x, D.z) > 134) { D.fy += PI * 0.6 * dt; } }
    else { const dx = D.hx - D.x, dz = D.hz - D.z, dd = Math.hypot(dx, dz); if (dd > 0.5) { D.x += dx / dd * 0.6 * dt; D.z += dz / dd * 0.6 * dt; D.yaw = Math.atan2(dx, dz); } else D.yaw += Math.sin(LIFE.t * 0.2 + D.ph) * 0.1 * dt; }
    D.h.root.position.set(D.x, ground(D.x, D.z), D.z); D.h.root.rotation.y = D.yaw; });
}
window.__FRAMES.push(dt => { try { wildFrame(dt); } catch (e) { if (!WILD.err) { WILD.err = e; console.warn('v116 wild', e); } } });
