/* ================================================================
   v108 REAL RATS (2026-11-23)
   The Pizza Rat (PIZZA) is now the rigged CC0 rat, running with his slice. And after dark, rats come out along the
   curb of the ring road: a few at a time, scurrying in short dashes, stopping to sniff, darting off again when you
   get close. They never come onto the paths. They are New Yorkers too.
   ================================================================ */
const RATS = { r: [] };
window.__RATS = RATS;
(function realRats() {
  try { CC0.dress(RAT.g, 'rat', { h: 0.17, keep: o => o.material && o.material.color && (o.material.color.getHex() === 0xf2c14e || o.material.color.getHex() === 0xa8321e), runAt: 1.5, runSp: 4 }); } catch (e) { }
  for (let i = 0; i < (isMobile ? 4 : 8); i++) { const h = CC0.make('rat', { h: 0.15, runAt: 1.2, runSp: 3.5, far: 50, tint: [0xffffff, 0xc8beb4, 0x8a8078][i % 3] }); h.root.visible = false;
    RATS.r.push({ h, a: Math.random() * PI * 2, side: Math.random() < 0.5 ? -1 : 1, t: Math.random() * 3, run: 0, dir: Math.random() < 0.5 ? -1 : 1 }); }
})();
function ratsFrame(dt) {
  const night = (L.lamps || 0) > 0.5;
  RATS.r.forEach(r => { r.h.root.visible = night; if (!night) return; const R = 100 + r.side * 4.4, x = Math.sin(r.a) * R, z = Math.cos(r.a) * R, d = Math.hypot(P.x - x, P.z - z);
    r.t -= dt; if (r.t <= 0) { r.run = r.run > 0 ? 0 : 0.6 + Math.random() * 1.6; r.t = r.run || (0.8 + Math.random() * 2.5); if (Math.random() < 0.3) r.dir = -r.dir; }
    if (d < 4 && r.run <= 0) { r.run = 1.4; r.t = 1.4; r.dir = Math.sign(Math.sin(r.a) * (P.z - z) - Math.cos(r.a) * (P.x - x)) || 1; }
    const sp = r.run > 0 ? 2.6 : 0; r.a += r.dir * sp / R * dt; r.h.root.position.set(x, ground(x, z) + 0.02, z); r.h.root.rotation.y = r.a + (r.dir > 0 ? PI / 2 : -PI / 2); });
}
window.__FRAMES.push(dt => { try { ratsFrame(dt); } catch (e) { if (!RATS.err) { RATS.err = e; console.warn('v108 rats', e); } } });
