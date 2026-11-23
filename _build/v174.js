/* ================================================================
   v174 THE LOOK: THE BIG THREE (2026-11-23)
   The three largest buildings on the island get the v173 treatment.
   - THE FIRST NATIONAL BANK OF JPGs: a rusticated base (stone courses with deep joints), tall windows on the sides
     and the back in moulded surrounds with a hood on consoles, a keystone and a bronze grid, an entablature with
     dentils and modillions round the whole building, fluted columns, a raking cornice up the pediment with the
     Open Eye in the tympanum, and a stone door surround with a bronze transom grille.
   - N3W SQUARE: a glass curtain wall above the screens (steel fins, spandrels, offices lit at night), a parapet,
     and at the foot a real storefront: bronze mullions, a stone head band and a lit marquee over the plaza door.
   - THE MEME FACTORY: a brick base with a concrete coping, steel I beam pilasters between the clerestory bays,
     a steel coping along the top, and a faded painted sign on the back wall, the way old New York factories wear
     theirs.
   ?facades=0 turns it off with v173.
   ================================================================ */
FACM.lime = new THREE.MeshStandardMaterial({ color: 0xe6e0d3, roughness: 0.85 });
FACM.limeD = new THREE.MeshStandardMaterial({ color: 0xbdb6a8, roughness: 0.9 });
FACM.bronze = new THREE.MeshStandardMaterial({ color: 0x5a4126, roughness: 0.38, metalness: 0.85 });
FACM.brickP = new THREE.MeshStandardMaterial({ color: 0x6a3828, roughness: 0.92 });
const FAC2 = {};
window.__FAC2 = FAC2;
function facBar(mat, a, b, t, d) { const v = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(FAC_BOX, mat); m.scale.set(v.length(), t, d); m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), v.clone().normalize()); m.position.copy(a).addScaledVector(v, 0.5); m.castShadow = m.receiveShadow = true; scene.add(m); return m; }
(function bigThree() {
  if (!FAC_ON) return;
  // ---------------- the bank: walls 0.6 thick on a 16 x 18 plan, front (+x) open behind the portico
  { const cx = -66, cz = 0, w = 16, d = 18, h = 10, g = ground(cx, cz) + 0.02, y0 = g + 0.3;
    const W = facFace(cx, cz, -1, 0, w / 2 + 0.3), N = facFace(cx, cz, 0, 1, d / 2 + 0.3), Sth = facFace(cx, cz, 0, -1, d / 2 + 0.3), Fr = facFace(cx, cz, 1, 0, w / 2 + 0.3);
    // rustication: courses with deep joints up to 3.8 m
    const rust = (F, u, fw) => { for (let y = y0 + 0.25; y < g + 3.8; y += 0.55) F.at(u, y, 0.05, fw, 0.45, 0.1, 'lime'); F.at(u, g + 3.95, 0.09, fw + 0.06, 0.18, 0.18, 'limeD'); };
    rust(W, 0, d + 0.7); rust(N, 0, w + 0.7); rust(Sth, 0, w + 0.7); rust(Fr, 5.85, 7.0); rust(Fr, -5.85, 7.0);
    // tall windows with surrounds, hoods on consoles, keystones and bronze grids
    const tall = (F, u) => { const y = g + 6.3, ww = 1.8, wh = 3.6;
      F.at(u, y, 0.015, ww, wh, 0.02, Math.random() < 0.5 ? 'lit' : 'glass');
      [-0.45, 0, 0.45].forEach(m => F.at(u + m, y, 0.04, 0.05, wh, 0.05, 'bronze')); [-1.2, -0.4, 0.4, 1.2].forEach(m => F.at(u, y + m, 0.04, ww, 0.05, 0.05, 'bronze'));
      F.at(u - ww / 2 - 0.16, y, 0.08, 0.32, wh + 0.3, 0.16, 'lime'); F.at(u + ww / 2 + 0.16, y, 0.08, 0.32, wh + 0.3, 0.16, 'lime');
      F.at(u, y + wh / 2 + 0.16, 0.08, ww + 0.64, 0.32, 0.16, 'lime'); F.at(u, y + wh / 2 + 0.2, 0.14, 0.36, 0.5, 0.2, 'limeD');
      F.at(u, y + wh / 2 + 0.62, 0.2, ww + 1.1, 0.2, 0.42, 'lime'); F.at(u, y + wh / 2 + 0.76, 0.22, ww + 1.2, 0.08, 0.46, 'limeD');
      [-1, 1].forEach(s => F.at(u + s * (ww / 2 + 0.38), y + wh / 2 + 0.3, 0.14, 0.18, 0.5, 0.26, 'limeD'));
      F.at(u, y - wh / 2 - 0.08, 0.12, ww + 0.6, 0.16, 0.26, 'lime'); F.at(u, y - wh / 2 - 0.55, 0.05, ww + 0.2, 0.7, 0.08, 'limeD'); };
    [-5, 0, 5].forEach(u => { tall(N, u); tall(Sth, u); }); [-5.5, 0, 5.5].forEach(u => tall(W, u));
    facCornice(cx, cz, w + 0.6, d + 0.6, g + h + 0.3, { big: true, key: 'lime', keyD: 'limeD' });
    // door surround and bronze transom grille in the 4 m opening
    const fx = cx + w / 2 + 0.3; [-1, 1].forEach(s => facPut('lime', fx + 0.1, y0 + 2.2, cz + s * 2.3, 0.2, 4.4, 0.6));
    facPut('lime', fx + 0.12, g + 4.85, cz, 0.24, 0.6, 5.2); facPut('limeD', fx + 0.2, g + 5.2, cz, 0.4, 0.12, 5.5);
    facPut('bronze', cx + w / 2, g + 3.3, cz, 0.08, 0.08, 4); facPut('bronze', cx + w / 2, g + 3.9, cz, 0.06, 0.06, 4);
    for (let z = -1.8; z <= 1.81; z += 0.4) facPut('bronze', cx + w / 2, g + 3.9, cz + z, 0.04, 1.2, 0.04);
    // fluted columns: sixteen arrises round each shaft
    for (let i = 0; i < 6; i++) { const z = cz - 7.5 + i * 3, x = cx + w / 2 + 3; for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; facPut('lime', x + Math.sin(a) * 0.585, g + h / 2, z + Math.cos(a) * 0.585, 0.08, h - 1.9, 0.08, a); } }
    // dentils along the portico entablature, raking cornice, the Open Eye in the tympanum
    const px = cx + w / 2 + 4; for (let z = -9.35; z <= 9.36; z += 0.3) facPut('lime', px + 0.06, g + h + 0.6, cz + z, 0.12, 0.14, 0.14);
    const top = new THREE.Vector3(px + 0.12, g + h + 0.7 + 3.2 + 0.12, cz);
    [-1, 1].forEach(s => { const e = new THREE.Vector3(px + 0.12, g + h + 0.7 + 0.12, cz + s * (d / 2 + 0.7)); facBar(FACM.lime, e, top, 0.3, 0.34); facBar(FACM.limeD, e.clone().add(new THREE.Vector3(0.05, 0.2, 0)), top.clone().add(new THREE.Vector3(0.05, 0.2, 0)), 0.1, 0.4); });
    const eye = new THREE.Group(); eye.position.set(px + 0.03, g + h + 0.7 + 1.25, cz); eye.rotation.y = PI / 2; scene.add(eye);
    [[0.95, MAT.gold || FACM.bronze, 0], [0.82, new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.4 }), 0.01], [0.48, new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.3 }), 0.02], [0.2, new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.2 }), 0.03]].forEach(([r, m, zz]) => { const c = new THREE.Mesh(new THREE.CircleGeometry(r, 40), m); c.position.z = zz; eye.add(c); });
    FAC2.bank = true; }
  // ---------------- N3W SQUARE: W 9, H 44, screens up to 31.6 m
  if (window.__SQ) { const x = SQ.x, z = SQ.z, g0 = ground(x, z), Wd = 9, H = 44;
    for (let f = 0; f < 4; f++) { const ry = f * PI / 2, F = facFace(x, z, Math.sin(ry), Math.cos(ry), Wd / 2);
      for (let fl = 0; fl < 4; fl++) { const yb = g0 + 32.2 + fl * 2.95; for (let b = 0; b < 6; b++) F.at(-3.75 + b * 1.5, yb + 1.35, 0.02, 1.4, 2.3, 0.02, Math.random() < 0.35 ? 'lit' : 'glass'); F.at(0, yb, 0.06, Wd + 0.1, 0.5, 0.12, 'frameK'); }
      for (let b = 0; b <= 6; b++) F.at(-4.5 + b * 1.5, g0 + 38.1, 0.16, 0.09, 11.8, 0.3, 'steel');
      F.at(0, g0 + H - 0.15, 0.2, Wd + 0.6, 0.35, 0.4, 'steel');
      // the storefront below the screens
      for (let b = 0; b < 6; b++) { const u = -3.75 + b * 1.5; F.at(u, g0 + 1.8, 0.02, 1.4, 3.1, 0.02, f === 3 && (b === 2 || b === 3) ? 'lit' : (Math.random() < 0.5 ? 'lit' : 'glass')); }
      for (let b = 0; b <= 6; b++) F.at(-4.5 + b * 1.5, g0 + 1.8, 0.06, 0.1, 3.3, 0.12, 'bronze');
      F.at(0, g0 + 0.12, 0.06, Wd + 0.2, 0.24, 0.14, 'bronze'); F.at(0, g0 + 3.4, 0.05, Wd + 0.2, 0.1, 0.1, 'bronze');
      F.at(0, g0 + 3.85, 0.1, Wd + 0.3, 0.7, 0.2, 'stoneD');
      if (f === 3) { F.at(0, g0 + 3.55, 0.95, 5.2, 0.3, 1.9, 'frameK'); F.at(0, g0 + 3.38, 0.95, 4.8, 0.04, 1.6, 'lit'); F.at(0, g0 + 3.8, 1.85, 5.2, 0.24, 0.06, 'bronze'); }
    }
    FAC2.square = true; }
  // ---------------- the factory: 32 x 28, walls 9 m, front open on +z
  { const cx = 0, cz = -64, w = 32, d = 28, h = 9, g = ground(cx, cz) + 0.02;
    const L = facFace(cx, cz, -1, 0, w / 2 + 0.25), R = facFace(cx, cz, 1, 0, w / 2 + 0.25), Bk = facFace(cx, cz, 0, -1, d / 2 + 0.25), Fr = facFace(cx, cz, 0, 1, d / 2 + 0.25);
    const base = (F, u, fw) => { F.at(u, g + 0.7, 0.06, fw, 1.4, 0.12, 'brickP'); F.at(u, g + 1.46, 0.1, fw + 0.1, 0.12, 0.26, 'stoneD'); F.at(u, g + h + 0.08, 0.08, fw + 0.1, 0.16, 0.24, 'steel'); };
    base(L, 0, d + 0.5); base(R, 0, d + 0.5); base(Bk, 0, w + 0.5); base(Fr, -13.5, 5.0); base(Fr, 13.5, 5.0);
    const beam = (F, u) => { F.at(u, g + 1.52 + (h - 1.52) / 2, 0.3, 0.32, h - 1.52, 0.06, 'steel'); F.at(u, g + 1.52 + (h - 1.52) / 2, 0.16, 0.06, h - 1.52, 0.28, 'steel'); F.at(u, g + 1.6, 0.18, 0.5, 0.12, 0.4, 'steel'); };
    // long walls: windows at z = -73.6 + 3.25 i, beams between them; u on the -x face runs along -z, on +x along +z
    for (let i = 0; i <= 8; i++) { const zb = -73.6 + 3.25 * i - 1.625; if (zb < cz - d / 2 + 0.3 || zb > cz + d / 2 - 0.3) continue; beam(L, -(zb - cz)); beam(R, zb - cz); }
    for (let i = 0; i <= 9; i++) { const xb = -16 + 2.6 + i * 3.35 - 1.675; if (xb < -15.7 || xb > 15.7) continue; beam(Bk, -xb); }
    // the ghost sign on the back wall
    const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 300; const c = cv.getContext('2d');
    if (c && c.fillText) { c.clearRect(0, 0, 2048, 300); c.fillStyle = 'rgba(236,228,206,0.8)'; c.textAlign = 'center'; c.font = '400 150px Anton, Impact, sans-serif'; c.fillText('THE MEME FACTORY', 1024, 165);
      c.font = '700 54px "JetBrains Mono", Menlo, monospace'; c.fillText('EST. 2021 · SEIZE THE MEMES OF PRODUCTION', 1024, 255);
      c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 2600; i++) { c.fillStyle = 'rgba(0,0,0,' + (0.2 + Math.random() * 0.6) + ')'; c.fillRect(Math.random() * 2048, Math.random() * 300, 2 + Math.random() * 18, 1 + Math.random() * 5); }
      for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(Math.random() * 2048, 0, 3 + Math.random() * 6, 300); } }
    const gt = new THREE.CanvasTexture(cv); gt.encoding = THREE.sRGBEncoding; gt.anisotropy = ANISO;
    const gs = new THREE.Mesh(new THREE.PlaneGeometry(24, 3.5), new THREE.MeshStandardMaterial({ map: gt, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    gs.position.set(cx, g + 3.4, cz - d / 2 - 0.29); gs.rotation.y = PI; scene.add(gs); FAC2.ghost = gs;
    FAC2.factory = true; }
  facFlush();
  if (typeof weathMat === 'function') [FACM.lime, FACM.limeD, FACM.brickP].forEach(m => { try { weathMat(m); } catch (e) { } });
})();
