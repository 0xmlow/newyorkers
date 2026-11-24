/* ================================================================
   v387 N3W CUTS: A BARBERSHOP ON THE BOARDWALK (2026-11-24)
   A one storey brick shop on the west beach, facing the island across the ring road, the way the old Coney Island
   strip faces the boardwalk: red brick, stone pilasters, a cast iron storefront with a big plate window and a glass
   door, a striped awning, a sign band (N3W CUTS, EST. 6529), a cornice with dentils. On the left pilaster a real
   barber pole turns: red, bone and cobalt stripes under a glass sleeve with chrome caps, lit at night. The stripes
   only go round, but your eye reads them climbing (the barber pole illusion: a moving edge seen through a narrow
   window can only show the motion across it). The window is v388. ?barber=0 off.
   ================================================================ */
const CUTS = { ok: false };
window.__CUTS = CUTS;
(function barbershop() {
  if (!LOOK.on || !FAC_ON || /barber=0/.test(location.search)) return;
  const a = 238 * PI / 180, R = 111.2, cx = Math.sin(a) * R, cz = Math.cos(a) * R, g = ground(cx, cz);
  const nx = -Math.sin(a), nz = -Math.cos(a), ry = Math.atan2(nx, nz), tx = nz, tz = -nx;   // front faces the island
  const W = 7.2, D = 5.0, H = 4.5; CUTS.c = [cx, g, cz]; CUTS.n = [nx, nz]; CUTS.t = [tx, tz]; CUTS.ry = ry; CUTS.W = W; CUTS.D = D; CUTS.H = H; CUTS.g = g;
  const at = (u, d) => [cx + nx * d + tx * u, cz + nz * d + tz * u];   // u along the front, d out from the centre
  // the body: red brick, the front face left to the storefront kit
  const brick = new THREE.MeshStandardMaterial({ map: tex('assets/brick_c.webp', [3, 2]), color: 0x8a4334, roughness: 0.86 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), brick); body.position.set(cx, g + H / 2, cz); body.rotation.y = ry; body.castShadow = body.receiveShadow = true; scene.add(body); CUTS.body = body;
  boxWalls(cx, cz, W, D, ry, -5, g + H); padRect(cx - 3, cx + 3, cz - 3, cz + 3, g + H + 0.05, g + H - 0.5);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.06, D - 0.1), new THREE.MeshStandardMaterial({ color: 0x34322f, roughness: 0.95 })); roof.position.set(cx, g + H + 0.03, cz); roof.rotation.y = ry; scene.add(roof);
  const F0 = facFace(cx, cz, nx, nz, D / 2), F = { ry: F0.ry, at: (u, y, w, sx, sy, sz, key, col) => F0.at(u, g + y, w, sx, sy, sz, key, col) }, hw = W / 2;   // facFace takes world heights
  // pilasters, base and cornice
  [-hw + 0.25, hw - 0.25, 1.75].forEach(u => { F.at(u, H / 2 - 0.25, 0.12, u === 1.75 ? 0.3 : 0.5, H - 0.5, 0.24, 'stone'); F.at(u, 0.25, 0.15, (u === 1.75 ? 0.3 : 0.5) + 0.1, 0.5, 0.3, 'stoneD'); });
  F.at(0, H - 0.12, 0.25, W + 0.5, 0.26, 0.5, 'stone'); F.at(0, H - 0.35, 0.18, W + 0.3, 0.12, 0.36, 'stone');
  for (let i = 0; i < 30; i++) F.at(-hw + 0.1 + i * (W - 0.2) / 29, H - 0.47, 0.2, 0.09, 0.1, 0.12, 'stone');
  // the storefront: kick plate, mullions, transom, the sign band
  const wL = -hw + 0.5, wR = 1.6, wc = (wL + wR) / 2, ww = wR - wL; CUTS.win = { u: wc, w: ww - 0.12, y0: 0.62, y1: 2.95 };
  F.at(wc, 0.31, 0.06, ww, 0.62, 0.1, 'steel'); F.at(wc, 0.64, 0.1, ww, 0.06, 0.2, 'frameK'); F.at(wc, 2.98, 0.08, ww, 0.08, 0.16, 'frameK');
  [wL + 0.03, wR - 0.03].forEach(u => F.at(u, 1.8, 0.08, 0.06, 2.4, 0.16, 'frameK'));
  F.at(wc, 3.18, 0.03, ww, 0.34, 0.03, 'lit'); F.at(wc, 3.37, 0.07, ww, 0.05, 0.14, 'frameK');
  for (let i = 1; i < 5; i++) F.at(wL + i * ww / 5, 3.18, 0.07, 0.04, 0.36, 0.12, 'frameK');
  // the door, right of the middle pilaster
  const dc = (1.9 + hw - 0.5) / 2, dw = hw - 0.5 - 1.9; CUTS.door = { u: dc, w: dw - 0.16, y0: 0.15, y1: 2.35 };
  F.at(dc, 1.25, 0.07, dw, 0.08, 0.14, 'frameK'); [1.94, hw - 0.54].forEach(u => F.at(u, 1.45, 0.08, 0.08, 2.9, 0.16, 'frameK')); F.at(dc, 2.42, 0.08, dw, 0.1, 0.16, 'frameK'); F.at(dc, 0.08, 0.08, dw, 0.16, 0.16, 'frameK');
  F.at(dc, 2.7, 0.03, dw, 0.42, 0.03, 'lit'); F.at(dc + dw / 2 - 0.12, 1.15, 0.12, 0.04, 0.32, 0.05, 'stone');
  F.at(dc, 0.04, 0.45, dw + 0.4, 0.08, 0.7, 'stoneD');
  // the sign band
  const sg = document.createElement('canvas'); sg.width = 2048; sg.height = 256; const c = sg.getContext('2d'); const st = new THREE.CanvasTexture(sg); st.encoding = THREE.sRGBEncoding; st.anisotropy = ANISO;
  const drawSign = () => { if (!c || !c.fillText || !c.strokeRect) return; c.fillStyle = '#16233f'; c.fillRect(0, 0, 2048, 256); c.strokeStyle = '#c9a24a'; c.lineWidth = 8; c.strokeRect(14, 14, 2020, 228); c.strokeStyle = 'rgba(201,162,74,.5)'; c.lineWidth = 3; c.strokeRect(30, 30, 1988, 196);
    c.fillStyle = '#efe8da'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 150px "Archivo Black",Impact,sans-serif'; c.fillText('N3W CUTS', 1024, 118);
    c.fillStyle = '#c9a24a'; c.font = '500 34px "Archivo",Helvetica,sans-serif'; c.fillText('EST. 6529  ·  FADES  ·  HOT TOWEL SHAVES  ·  CARDS ON THE WALL', 1024, 210);
    c.font = '900 64px "Archivo Black",Impact,sans-serif'; c.fillText('✂', 180, 120); c.fillText('✂', 1868, 120); st.needsUpdate = true; };
  drawSign(); addEventListener('n3wfonts', () => { try { drawSign(); } catch (e) { } }, { once: true });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.6, 0.72), new THREE.MeshStandardMaterial({ map: st, roughness: 0.45, metalness: 0.1, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.04 })); const [sx, sz] = at(0, D / 2 + 0.2); sign.position.set(sx, g + 3.82, sz); sign.rotation.y = ry; scene.add(sign); CUTS.signM = sign.material;
  F.at(0, 3.82, 0.13, W - 0.4, 0.86, 0.12, 'frameK');
  // the awning: bone and navy stripes over the window, a scalloped valance with the name
  const aw = document.createElement('canvas'); aw.width = 1024; aw.height = 256; const ac = aw.getContext('2d'); const atx = new THREE.CanvasTexture(aw); atx.encoding = THREE.sRGBEncoding; atx.anisotropy = ANISO;
  if (ac && ac.fillRect) { for (let i = 0; i < 16; i++) { ac.fillStyle = i % 2 ? '#16233f' : '#efe8da'; ac.fillRect(i * 64, 0, 64, 256); } ac.fillStyle = 'rgba(0,0,0,.12)'; ac.fillRect(0, 0, 1024, 30); }
  const awM = new THREE.MeshStandardMaterial({ map: atx, roughness: 0.9, side: THREE.DoubleSide });
  const slope = new THREE.Mesh(new THREE.PlaneGeometry(ww + 0.3, 1.35), awM); const [ax, az] = at(wc, D / 2 + 0.6); slope.position.set(ax, g + 2.95, az); slope.rotation.order = 'YXZ'; slope.rotation.set(-1.05, ry, 0); slope.castShadow = true; scene.add(slope);
  const vl = document.createElement('canvas'); vl.width = 1024; vl.height = 96; const vc = vl.getContext('2d'); const vt = new THREE.CanvasTexture(vl); vt.encoding = THREE.sRGBEncoding;
  const drawVal = () => { if (!vc || !vc.fillText || !vc.beginPath || !vc.arc) return; vc.clearRect(0, 0, 1024, 96); vc.fillStyle = '#16233f'; vc.fillRect(0, 0, 1024, 64); for (let i = 0; i < 32; i++) { vc.beginPath(); vc.arc(16 + i * 32, 62, 16, 0, PI); vc.fill(); }
    vc.fillStyle = '#efe8da'; vc.textAlign = 'center'; vc.textBaseline = 'middle'; vc.font = '700 40px "Archivo",Helvetica,sans-serif'; vc.fillText('N3W CUTS  ·  WALK INS WELCOME', 512, 34); vt.needsUpdate = true; };
  drawVal(); addEventListener('n3wfonts', () => { try { drawVal(); } catch (e) { } }, { once: true });
  const val = new THREE.Mesh(new THREE.PlaneGeometry(ww + 0.3, 0.3), new THREE.MeshStandardMaterial({ map: vt, transparent: true, alphaTest: 0.4, roughness: 0.9, side: THREE.DoubleSide })); const [vx, vz] = at(wc, D / 2 + 1.18); val.position.set(vx, g + 2.48, vz); val.rotation.y = ry; scene.add(val);
  // the barber pole on the left pilaster
  const pc = document.createElement('canvas'); pc.width = 128; pc.height = 128; const pctx = pc.getContext('2d'); const pt = new THREE.CanvasTexture(pc); pt.encoding = THREE.sRGBEncoding; pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(1, 3); pt.anisotropy = ANISO;
  if (pctx && pctx.createImageData) { const im = pctx.createImageData(128, 128), cols = [[200, 26, 32], [239, 232, 218], [41, 98, 255]];
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const k = Math.floor(((x + y) / 128) * 6) % 3, cc = cols[k], i = (y * 128 + x) * 4, e = Math.min(1, Math.abs(((x + y) / 128 * 6) % 1 - 0.5) * 8); im.data[i] = cc[0]; im.data[i + 1] = cc[1]; im.data[i + 2] = cc[2]; im.data[i + 3] = 255; }
    pctx.putImageData(im, 0, 0); }
  const poleM = new THREE.MeshStandardMaterial({ map: pt, roughness: 0.35, emissive: 0xffffff, emissiveMap: pt, emissiveIntensity: 0 }); CUTS.poleM = poleM; CUTS.poleT = pt;
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.18, metalness: 1.0 });
  const [px, pz] = at(-hw + 0.25, D / 2 + 0.52), PG = new THREE.Group(); PG.position.set(px, g + 2.05, pz); scene.add(PG); CUTS.pole = PG;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 1.0, 32, 1, true), poleM); PG.add(core);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.04, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false })); PG.add(sleeve);
  [[0.56, 1], [-0.56, -1]].forEach(([y, s]) => { const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 32), chrome); ring.position.y = y; PG.add(ring);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 12, 0, PI * 2, 0, PI / 2), chrome); dome.position.y = y + s * 0.04; dome.scale.y = 0.9 * s; PG.add(dome); });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), chrome); knob.position.y = 0.72; PG.add(knob);
  [0.35, -0.35].forEach(y => { const br = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.44), chrome); br.position.set(0, y, -0.3); PG.add(br); }); PG.rotation.y = ry;
  CUTS.ok = true; CUTS.at = at; CUTS.F = F;
  if (window.__MAP) MAP.places.push(['N3W CUTS', cx, cz, ...at(0, D / 2 + 3)]);
  facFlush();
})();
window.__FRAMES.push(dt => { try { if (!CUTS.ok) return; CUTS.poleT.offset.y = (CUTS.poleT.offset.y - dt * 0.35) % 1; const n = Math.min(1, (L.lamps || 0) * 1.3); CUTS.poleM.emissiveIntensity = 0.05 + 0.9 * n; CUTS.signM.emissiveIntensity = 0.04 + 0.4 * n; } catch (e) { } });
