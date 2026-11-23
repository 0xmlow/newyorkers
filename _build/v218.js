/* ================================================================
   v218 THE LOOK: THE RINK BOARDS (2026-11-23)
   The rink was a ring of plain white panels. Now it has real dasher boards: a yellow kick plate along the ice, a
   row of rink board ads on the inside and the outside (N3W PARKS, 6529 BODEGA, THE MEMES, DAILY GM, N3W HARDWARE,
   HOT CIDER, FLOOR ST JOURNAL, GM BEACH), glass shields round both ends on steel stanchions, a black rubber mat
   from the gap to the skate rental hut, and the island's ice resurfacer, the N3W-BONI, parked by the gate.
   ?rinkboards=0 turns it off.
   ================================================================ */
const RB2 = {};
window.__RB2 = RB2;
(function rinkBoards() {
  if (!FAC_ON || /rinkboards=0/.test(location.search) || !window.__RINK || RINK.g0 == null) return;
  const x0 = RINK_AT.x, z0 = RINK_AT.z, A = RINK_AT.a, Bz = RINK_AT.b, g0 = RINK.g0, gapA = RINK.gapA, n = 44;
  // ---- the ads: eight panels in one atlas
  const ADS = [['N3W PARKS', '#2f4a3a', '#efe8da'], ['6529 BODEGA', '#f2d230', '#c8102e'], ['THE MEMES', '#0d0d0d', '#efe8da'], ['DAILY GM', '#2962FF', '#ffffff'], ['N3W HARDWARE', '#1f5a3a', '#f2d230'], ['HOT CIDER', '#7a1f2a', '#f6e7c8'], ['FLOOR ST JOURNAL', '#efe8da', '#0d0d0d'], ['GM BEACH', '#08a5c8', '#ffffff']];
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
  if (c && c.fillRect && c.fillText) ADS.forEach(([t, bg, fg], i) => { const x = (i % 4) * 256, y = (i >> 2) * 256; c.fillStyle = '#f4f4f0'; c.fillRect(x, y, 256, 256); c.fillStyle = bg; c.fillRect(x + 8, y + 40, 240, 176);
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${t.length > 11 ? 26 : 36}px "Archivo Black",Impact,sans-serif`; c.fillText(t, x + 128, y + 128); });
  const at = new THREE.CanvasTexture(cv); at.encoding = THREE.sRGBEncoding; at.anisotropy = ANISO;
  // ---- one merged mesh of ad quads, inside and outside, and the glass panes at both ends
  const P = [], U = [], N = [], GP = [], GU = [], GN = [];
  const quad = (arrP, arrU, arrN, ax, az, bx, bz, y0, y1, cell, nx, nz, flip) => { let u0 = cell == null ? 0 : (cell % 4) / 4, u1 = cell == null ? 1 : u0 + 0.25; if (flip) { const t = u0; u0 = u1; u1 = t; } const _q = 0, v1 = cell == null ? 1 : 1 - (cell >> 2) / 2 - 0.1, v0 = cell == null ? 0 : v1 - 0.3;
    arrP.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az); arrU.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); for (let k = 0; k < 6; k++) arrN.push(nx, 0, nz); };
  let k = 0;
  for (let i = 0; i < n; i++) { const a0 = i / n * PI * 2, a1 = (i + 1) / n * PI * 2, am = (a0 + a1) / 2; const da = Math.atan2(Math.sin(am - gapA), Math.cos(am - gapA)); if (Math.abs(da) < 0.11) continue;
    const pt = (a, r) => [x0 + Math.cos(a) * (A + r), z0 + Math.sin(a) * (Bz + r)];
    const [iax, iaz] = pt(a0, 0.05), [ibx, ibz] = pt(a1, 0.05), [oax, oaz] = pt(a0, 0.155), [obx, obz] = pt(a1, 0.155);
    const nx = Math.cos(am) / A, nz = Math.sin(am) / Bz, nl = Math.hypot(nx, nz), ux = nx / nl, uz = nz / nl;
    const cell = (k++) % 8;
    // inside face, wound to face the ice; outside face, wound to face out
    quad(P, U, N, ibx, ibz, iax, iaz, g0 + 0.32, g0 + 0.9, cell, -ux, -uz);
    quad(P, U, N, oax, oaz, obx, obz, g0 + 0.32, g0 + 0.9, (cell + 3) % 8, ux, uz, true);
    // kick plate along the ice
    const len = Math.hypot(ibx - iax, ibz - iaz), ry = Math.atan2(-(ibz - iaz), ibx - iax), [kx, kz] = pt(am, 0.045);
    facPut('kick', kx, g0 + 0.2, kz, len + 0.02, 0.24, 0.02, ry);
    // glass at the two ends of the long axis, stanchions every panel
    if (Math.abs(Math.cos(am)) > 0.72) { const [gax, gaz] = pt(a0, 0.1), [gbx, gbz] = pt(a1, 0.1); quad(GP, GU, GN, gax, gaz, gbx, gbz, g0 + 1.06, g0 + 2.35, null, ux, uz);
      facPut('galv', gax, g0 + 1.7, gaz, 0.05, 1.3, 0.05, 0); facPut('galv', (gax + gbx) / 2, g0 + 2.37, (gaz + gbz) / 2, len + 0.02, 0.04, 0.06, ry); } }
  const mk = (p, u, nn) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3)); return g; };
  const ads = new THREE.Mesh(mk(P, U, N), new THREE.MeshStandardMaterial({ map: at, roughness: 0.45, side: THREE.DoubleSide })); ads.receiveShadow = true; scene.add(ads); RB2.ads = ads;
  const glass = new THREE.Mesh(mk(GP, GU, GN), new THREE.MeshStandardMaterial({ color: 0xd8e6ec, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })); glass.renderOrder = 3; scene.add(glass); RB2.glass = glass;
  // ---- the mat, the rental hut, the N3W-BONI, outside the gap
  const gx = Math.cos(gapA), gz = Math.sin(gapA), out = (r, t) => [x0 + gx * (A + r) - gz * t, z0 + gz * (Bz + r) + gx * t], gry = Math.atan2(gx, gz);
  FACM.mat = FACM.mat || new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.95 });
  { const [mx, mz] = out(2.3, 0); facPut('mat', mx, g0 + 0.02, mz, 1.3, 0.04, 4.2, gry); }
  { const [hx, hz] = out(4.6, -3.2), hr = gry; RB2.hut = [hx, hz];
    facPut('green', hx, g0 + 1.25, hz, 2.6, 2.5, 2.0, hr); facPut('stoneD', hx, g0 + 2.58, hz, 3.0, 0.16, 2.4, hr);
    const sg = signTex([{ t: 'SKATE RENTAL', s: 0.34 }, { t: 'ALL SIZES · HOT COCOA · NO REFUNDS', s: 0.13 }], 1024, 256, '#efe8da', '#2b4a32');
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshStandardMaterial({ map: sg, roughness: 0.6, emissive: 0xffffff, emissiveMap: sg, emissiveIntensity: 0.1 })); const fx = hx + Math.sin(hr) * 1.01, fz = hz + Math.cos(hr) * 1.01; sm.position.set(fx, g0 + 2.1, fz); sm.rotation.y = hr; scene.add(sm); RB2.sign = sm;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), FACM.lit); win.position.set(hx + Math.sin(hr) * 1.012, g0 + 1.3, hz + Math.cos(hr) * 1.012); win.rotation.y = hr; scene.add(win);
    // the counter and a row of skates hung inside the window
    facPut('benchW', hx + Math.sin(hr) * 1.15, g0 + 0.85, hz + Math.cos(hr) * 1.15, 1.8, 0.06, 0.3, hr);
    for (let i = 0; i < 6; i++) { const t = -0.6 + i * 0.24; facPut(i % 2 ? 'white' : 'steel', hx + Math.sin(hr) * 1.03 + Math.cos(hr) * t, g0 + 1.45, hz + Math.cos(hr) * 1.03 - Math.sin(hr) * t, 0.08, 0.2, 0.06, hr); }
    boxWalls(hx, hz, 2.6, 2.0, hr, -5, g0 + 2.6); }
  { const [bx, bz] = out(4.0, 3.4), br = gry + PI / 2; FACM.boni = FACM.boni || new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.4, metalness: 0.3 });
    const B = (u, y, w, sx, sy, sz, key) => facPut(key, bx + Math.sin(br) * w + Math.cos(br) * u, g0 + y, bz + Math.cos(br) * w - Math.sin(br) * u, sx, sy, sz, br);
    B(0, 0.75, 0, 1.5, 0.9, 2.6, 'boni'); B(0, 1.25, -0.55, 1.3, 0.3, 0.9, 'white'); B(0, 1.55, 0.35, 1.0, 0.9, 0.06, 'glass'); B(0, 2.05, 0.1, 1.5, 0.06, 1.4, 'white');
    [-0.5, 0.5].forEach(u => B(u, 1.55, 0.6, 0.04, 1.0, 0.04, 'steel')); B(0, 0.25, 1.4, 1.6, 0.18, 0.3, 'steel');
    [[-0.78, -0.8], [0.78, -0.8], [-0.78, 0.8], [0.78, 0.8]].forEach(([u, w]) => B(u, 0.28, w, 0.18, 0.56, 0.56, 'mat'));
    const lab = signTex([{ t: 'N3W-BONI', s: 0.42 }], 512, 128, '#2962FF', '#ffffff'); const lm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: lab }));
    lm.position.set(bx + Math.cos(br) * 0.76, g0 + 0.85, bz - Math.sin(br) * 0.76); lm.rotation.y = br + PI / 2; scene.add(lm);
    boxWalls(bx, bz, 1.6, 2.8, br, -5, g0 + 2); RB2.boni = [bx, bz]; }
  FACM.benchW = FACM.benchW || new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.75 });
  FACM.kick = FACM.kick || new THREE.MeshStandardMaterial({ color: 0xe8b819, roughness: 0.6 });
  facFlush();
  RB2.ok = true;
})();
