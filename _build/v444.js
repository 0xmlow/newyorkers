/* ================================================================
   v444 THE LOOK: THE TIDE LINE (2026-11-24)
   Every real beach has a line where the last high tide gave up: a ragged band of dried seaweed, eel grass, sticks
   and the odd bit of driftwood, a metre or two up the sand from the wet. Without it the sand ran from the lawn to
   the sea as one clean colour. Now the wrack line runs right round the island (wavering in and out, thick in
   places, gone in others, kept clear of the pier, the boardwalk and the paths), dark olive and bleached brown,
   with grey driftwood every so often. ?wrack=0 off.
   ================================================================ */
const WRACK = {};
window.__WRACK = WRACK;
(function wrackLine() {
  if (!LOOK.on || /wrack=0/.test(location.search)) return;
  let sd = 9161; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  // one strand: a thin wavy ribbon, flat on the sand
  const strand = (() => { const p = [], ix = []; const n = 6; for (let i = 0; i <= n; i++) { const t = i / n, x = (t - 0.5), w = 0.5 * (1 - Math.abs(t - 0.5) * 1.2), y = Math.sin(t * 6.0) * 0.18; p.push(x, 0, y - w * 0.5, x, 0, y + w * 0.5); if (i) { const b = (i - 1) * 2; ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeVertexNormals(); return g; })();
  const N = 2600, mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const im = new THREE.InstancedMesh(strand, mat, N); im.frustumCulled = false; const o = new THREE.Object3D(), c = new THREE.Color();
  const pals = [0x3b3a22, 0x4a4628, 0x2c2b1a, 0x6b5a3c, 0x8a7a5a, 0x564a30];
  const keepOut = a => { const d = a * 180 / PI; const deg = ((d % 360) + 360) % 360; return (deg > 222 && deg < 262) || (deg > 172 && deg < 188); };
  let k = 0;
  for (let i = 0; i < N * 3 && k < N; i++) { const a = rnd() * PI * 2; if (keepOut(a)) continue;
    const thick = 0.5 + 0.5 * Math.sin(a * 5 + 1.7) * Math.sin(a * 11 - 0.4); if (rnd() > thick + 0.15) continue;
    const r = SHORE - 5.2 + 1.3 * Math.sin(a * 9 + 0.5) + 0.8 * Math.sin(a * 23) + (rnd() - 0.5) * 1.4 * (0.5 + thick);
    const x = Math.sin(a) * r, z = Math.cos(a) * r; o.position.set(x, ground(x, z) + 0.035, z); o.rotation.set(0, rnd() * PI, 0); const s = 0.3 + rnd() * 0.9; o.scale.set(s, 1, s * (0.6 + rnd() * 0.6)); o.updateMatrix(); im.setMatrixAt(k, o.matrix);
    c.setHex(pals[(rnd() * pals.length) | 0]).convertSRGBToLinear(); im.setColorAt(k, c); k++; }
  im.count = k; im.receiveShadow = true; scene.add(im); WRACK.im = im;
  // driftwood: grey sticks and the odd log
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.9 }), wg = new THREE.CylinderGeometry(0.05, 0.07, 1, 6); wg.rotateZ(PI / 2);
  const W = 70, wm = new THREE.InstancedMesh(wg, wood, W); wm.frustumCulled = false; let j = 0;
  for (let i = 0; i < 400 && j < W; i++) { const a = rnd() * PI * 2; if (keepOut(a)) continue; const r = SHORE - 5.5 + (rnd() - 0.5) * 3, x = Math.sin(a) * r, z = Math.cos(a) * r, L2 = 0.6 + rnd() * (rnd() < 0.15 ? 2.6 : 1.0), th = L2 > 2 ? 2.6 : 1;
    o.position.set(x, ground(x, z) + 0.05 * th, z); o.rotation.set(0, rnd() * PI, (rnd() - 0.5) * 0.1); o.scale.set(L2, th, th); o.updateMatrix(); wm.setMatrixAt(j++, o.matrix); }
  wm.count = j; wm.castShadow = true; wm.receiveShadow = true; scene.add(wm); WRACK.wood = wm;
  try { if (window.__SNOWL && SNOWL.add) setTimeout(() => { SNOWL.add(mat); SNOWL.add(wood); }, 32000); } catch (e) { }
})();
