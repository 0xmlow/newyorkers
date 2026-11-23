/* ================================================================
   v101 SUNRISE YOGA (2026-11-22)
   On GM BEACH at (-52, 120), from first light until about nine, a class of six on mats facing the water with the
   teacher in front, moving together through a slow sequence: mountain, raised arms, forward fold, warrior, tree,
   and back. E joins: you get a mat and the camera settles; stay for a full round and the island counts it.
   ================================================================ */
const YOGA = { p: [], t: 0 };
window.__YOGA = YOGA;
const YOGA_AT = { x: -52, z: 120 };
(function yoga() {
  const x0 = YOGA_AT.x, z0 = YOGA_AT.z, g0 = ground(x0, z0); YOGA.g0 = g0; const cols = [0x2962FF, 0xff3fa4, 0x08deff, 0x6a4cff, 0xe9c46a, 0x2f4a33, 0xefe8da];
  const spots = [[0, 3.9, 'T'], [-2.4, 0], [0, 0], [2.4, 0], [-1.2, 1.8], [1.2, 1.8], [3.6, 1.8]];
  spots.forEach(([dx, dz, tch], i) => { const x = x0 + dx, z = z0 + dz; const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.8), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 })); mat.rotation.x = -PI / 2; mat.position.set(x, ground(x, z) + 0.03, z); scene.add(mat);
    if (i === 6) { YOGA.you = [x, z]; return; } const p = person([0xefe8da, 0x15161a, 0x7a1f2a, 0x3b4a5c, 0xe2581c, 0x2f4a33][i], 0x15161a, SKIN[(i * 2) % SKIN.length], ['workgirl', 'actress', 'annieh', 'editor', 'writer', 'cabbie'][i]);
    p.g.position.set(x, ground(x, z) - 0.35, z); p.g.rotation.y = tch ? PI : 0; YOGA.p.push({ P: p, x, z, ph: i * 0.08, teacher: !!tch }); });
  interact(YOGA.you[0], YOGA.you[1] + 1.4, 1.8, 'E · JOIN THE CLASS', () => yogaJoin());
  if (window.__MAP) MAP.places.push(['SUNRISE YOGA', x0, z0, x0 + 2, z0 + 3.5]);
})();
const yogaSecret = secret('yoga', () => { toast('ONE FULL ROUND. THE TEACHER SAYS NAMASTE. THE GULLS SAY SOMETHING ELSE.', 'blue'); });
function yogaJoin() { if (!YOGA.on) { toast('THE CLASS IS AT SUNRISE. COME BACK AT DAWN. OR TYPE YOGA AND PRETEND.'); return; } teleport(YOGA.you[0], YOGA.you[1], PI, YOGA.g0 + 1); YOGA.joined = 0.001; toast('YOU UNROLL A MAT. BREATHE IN. NOBODY IS LOOKING. EVERYONE IS LOOKING.'); }
EGGS.yoga = () => { YOGA.force = LIFE.t + 240; toast('CLASS IS IN SESSION. GM BEACH.'); }; EGGS.yoga.__s = true;
function yogaFrame(dt) {
  const h = SKY.t ? SKY.t.hours : 12, el = SKY.el || 0; YOGA.on = (h >= 5 && h < 9 && el > -6) || (YOGA.force > LIFE.t);
  YOGA.p.forEach(q => q.P.g.visible = YOGA.on); if (!YOGA.on || Math.hypot(P.x - YOGA_AT.x, P.z - YOGA_AT.z) > 90) return;
  YOGA.t += dt; const seq = 30, k = (YOGA.t % seq) / seq;
  YOGA.p.forEach(q => { const u = (k + q.ph * 0.02) % 1; let rx = 0, y = 0, rz = 0, s = 1;   // pose from the sequence position
    if (u < 0.2) { } else if (u < 0.35) { y = 0.05; } else if (u < 0.5) { rx = 1.2; y = 0.9 * (1 - Math.cos(1.2)); } else if (u < 0.7) { rz = 0.15; y = -0.25; s = 0.95; } else if (u < 0.85) { rz = -0.06; y = 0.02; } else { }
    q.P.g.rotation.set(rx, q.teacher ? PI : 0, rz, 'YXZ'); q.P.g.position.y = ground(q.x, q.z) - 0.35 + y; q.P.g.scale.set(1, s, 1); });
  if (YOGA.joined) { if (Math.hypot(P.x - YOGA.you[0], P.z - YOGA.you[1]) > 2.5) YOGA.joined = 0; else { YOGA.joined += dt; if (YOGA.joined > seq) yogaSecret(); } }
}
window.__FRAMES.push(dt => { try { yogaFrame(dt); } catch (e) { if (!YOGA.err) { YOGA.err = e; console.warn('v101 yoga', e); } } });
