/* ================================================================
   v220 THE LOOK: THE NEWSSTAND (2026-11-23)
   The newsstand was a green box with a sign. Now it reads like the steel kiosks on every Midtown corner: a deep
   roof with a lit fascia, a rolled up shutter over the window, a steel counter with gum and mints along it, a
   stainless kick band and corner posts, wire magazine racks full of covers down both sides, tied bundles of
   today's papers stacked at the front, and a lightbox on the roof for N3W POST that glows after dark.
   ?newsstand=0 turns it off.
   ================================================================ */
const NS2 = { mats: [] };
window.__NS2 = NS2;
(function newsstandRebuild() {
  if (!FAC_ON || /newsstand=0/.test(location.search) || !window.__NEWS || NEWS.ry == null) return;
  const x0 = NEWS_AT.x, z0 = NEWS_AT.z, g0 = ground(x0, z0), ry = NEWS.ry, cs = Math.cos(ry), sn = Math.sin(ry);
  const W = (lx, lz) => [x0 + cs * lx + sn * lz, z0 - sn * lx + cs * lz];
  const put = (key, lx, y, lz, sx, sy, sz, rot) => { const [x, z] = W(lx, lz); facPut(key, x, g0 + y, z, sx, sy, sz, ry + (rot || 0)); };
  FACM.nsGreen = FACM.nsGreen || new THREE.MeshStandardMaterial({ color: 0x1f3a2a, roughness: 0.5, metalness: 0.3 });
  FACM.inox = FACM.inox || new THREE.MeshStandardMaterial({ color: 0xc4c8cc, roughness: 0.28, metalness: 0.9 });
  FACM.paper = FACM.paper || new THREE.MeshStandardMaterial({ color: 0xe9e5db, roughness: 0.9 });
  // the old body reads mint in daylight: give it the kiosk's own enamel green
  try { scene.traverse(o => { const p = o.geometry && o.geometry.parameters; if (o.isMesh && p && p.width === 3.0 && p.height === 2.6 && p.depth === 2.0 && o.parent && o.parent.position && Math.hypot(o.parent.position.x - x0, o.parent.position.z - z0) < 0.5) { o.material = FACM.nsGreen; NS2.body = o; } }); } catch (e) { }
  // ---- roof and fascia
  put('nsGreen', 0, 2.78, 0.35, 3.9, 0.14, 3.1); put('nsGreen', 0, 2.68, 1.88, 3.9, 0.26, 0.06); [-1, 1].forEach(s => put('nsGreen', s * 1.93, 2.68, 0.35, 0.06, 0.26, 3.1));
  put('lit', 0, 2.68, 1.92, 3.6, 0.08, 0.012);
  // ---- shutter housing, counter, gum rack, kick band, corner posts
  put('inox', 0, 2.06, 1.1, 1.8, 0.22, 0.22); for (let i = 0; i < 4; i++) put('nsGreen', 0, 1.97 - i * 0.004, 1.215, 1.7, 0.012, 0.004);
  put('inox', 0, 1.13, 1.16, 1.7, 0.04, 0.32);
  const gum = [0xd8304a, 0x2962FF, 0xf2d230, 0x2f8a4a, 0xefe8da, 0xff7a1a];
  for (let i = 0; i < 14; i++) { const [x, z] = W(-0.72 + i * 0.11, 1.22); facPut('white', x, g0 + 1.2, z, 0.09, 0.1, 0.12, ry, gum[i % gum.length]); }
  [-1.5, 1.5].forEach(lx => [-1.0, 1.0].forEach(lz => put('inox', lx, 1.3, lz, 0.08, 2.6, 0.08)));
  put('inox', 0, 0.1, 1.02, 3.04, 0.2, 0.02); put('inox', 0, 0.1, -1.02, 3.04, 0.2, 0.02); [-1, 1].forEach(s => put('inox', s * 1.52, 0.1, 0, 0.02, 0.2, 2.04));
  // ---- wire magazine racks down both sides, covers in them
  [-1, 1].forEach(s => { const lx = s * 1.72;
    for (let t = 0; t < 3; t++) { const y = 0.75 + t * 0.48; put('galv', lx, y - 0.2, 0, 0.22, 0.015, 1.8); put('galv', lx + s * 0.1, y, 0, 0.015, 0.015, 1.8); }
    [-0.9, 0.9].forEach(lz => put('galv', lx, 1.0, lz, 0.02, 1.6, 0.02));
    for (let t = 0; t < 3; t++) for (let i = 0; i < 4; i++) { const m = memeMesh(MEME_NS[(t * 4 + i) * 37 % MEME_NS.length + (s > 0 ? 11 : 0)], 0.34); if (!m) continue;
      const [x, z] = W(lx + s * 0.06, -0.66 + i * 0.44); m.position.set(x, g0 + 0.8 + t * 0.48, z); m.rotation.set(0, ry + s * PI / 2, 0); m.rotateX(-0.18); scene.add(m); } });
  // ---- bundles of today's papers at the front, tied with twine
  [[-1.15, 1.6, 0], [-0.75, 1.62, 0.3], [-1.05, 1.62, 1], [1.1, 1.58, 0.1], [0.75, 1.65, -0.2]].forEach(([lx, lz, rr], i) => {
    const h = i === 2 ? 0.3 : 0.24, y = i === 2 ? 0.24 + h / 2 : h / 2; put('paper', lx, y, lz, 0.42, h, 0.3, rr); put('steel', lx, y, lz, 0.43, h + 0.005, 0.012, rr); put('steel', lx, y, lz, 0.012, h + 0.005, 0.31, rr); });
  // ---- the lightbox on the roof
  { const sg = signTex([{ t: 'N3W POST', s: 0.44 }, { t: 'DAILY GM · TODAY\'S MEMES', s: 0.14 }], 1024, 256, '#efe8da', '#0D0D0D');
    const m = new THREE.MeshStandardMaterial({ map: sg, roughness: 0.5, emissive: 0xffffff, emissiveMap: sg, emissiveIntensity: 0.05 }); NS2.mats.push(m);
    put('inox', 0, 3.17, 0.4, 2.5, 0.62, 0.32); [0.565, 0.235].forEach((lz, k) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.56), m); const [x, z] = W(0, lz); p.position.set(x, g0 + 3.17, z); p.rotation.y = ry + (k ? PI : 0); scene.add(p); });
    [-0.9, 0.9].forEach(lx => put('inox', lx, 2.94, 0.4, 0.05, 0.2, 0.05)); }
  facFlush();
  NS2.ok = true;
})();
window.__FRAMES.push(() => { try { if (!NS2.mats.length) return; const k = Math.min(1, (L.lamps || 0) * 1.3); NS2.mats[0].emissiveIntensity = 0.05 + 0.9 * k; } catch (e) { } });
