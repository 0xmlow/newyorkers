/* ================================================================
   v224 THE LOOK: THE CENSUS WALK, HUNG PROPERLY (2026-11-23)
   The Hadid ribbon carries 48 NEW YORKERS in two rows, and above them three metres of blank wall. Now it is hung
   like a museum wall: a brass picture light on an arm over every portrait, a cut letter frieze running the whole
   curve (NEW YORKERS · BY MLOW · THE PEOPLE BUILT THE PLACE), and a slim coping along its top edge. After dusk the
   picture lights come on and each one throws a soft wash down its portrait (painted light, no lamps added).
   ?censuswalk=0 turns it off.
   ================================================================ */
const CW2 = { wash: null, shade: null };
window.__CW2 = CW2;
(function censusWalkHang() {
  if (!FAC_ON || /censuswalk=0/.test(location.search)) return;
  const pts = []; for (let i = 0; i <= 24; i++) { const z = 46 + i * 1.6; pts.push([-11 - 2.2 * Math.sin(i / 24 * PI * 2), z]); }
  const shade = new THREE.MeshStandardMaterial({ color: 0x8a6a36, roughness: 0.3, metalness: 0.9, emissive: 0xfff0d0, emissiveIntensity: 0 }); CW2.shade = shade; FACM.cwShade = shade;
  // the wash: a soft cone of light down the wall, one instanced plane per portrait
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { const g = c.createRadialGradient(32, 0, 2, 32, 0, 128); g.addColorStop(0, 'rgba(255,236,200,0.9)'); g.addColorStop(0.5, 'rgba(255,226,180,0.35)'); g.addColorStop(1, 'rgba(255,220,170,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 128); }
  const wash = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 }); CW2.wash = wash;
  const wim = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.7, 2.0), wash, 48), o = new THREE.Object3D(); let wk = 0;
  // the frieze: one long canvas of cut letters, laid along the curve by cumulative length
  const segs = []; let total = 0; for (let i = 0; i < 24; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az); segs.push({ ax, az, bx, bz, len, s0: total }); total += len; }
  const fcv = document.createElement('canvas'); fcv.width = 4096; fcv.height = 96; const f = fcv.getContext('2d');
  if (f && f.fillText) { f.clearRect(0, 0, 4096, 96); f.fillStyle = '#2b2620'; f.textBaseline = 'middle'; f.font = '700 52px "Archivo Black",Impact,sans-serif';
    const msg = 'NEW YORKERS  ·  BY MLOW  ·  THE PEOPLE BUILT THE PLACE  ·  ONE THOUSAND ONE HUNDRED AND ELEVEN  ·  '; let x = 20; const sp = 6;
    while (x < 4080) { for (const ch of msg) { if (x > 4080) break; f.fillText(ch, x, 50); x += f.measureText(ch).width + sp; } } }
  const ft = new THREE.CanvasTexture(fcv); ft.encoding = THREE.sRGBEncoding; ft.anisotropy = ANISO;
  const P = [], U = [], N = [];
  segs.forEach((s, i) => { const nx = (s.bz - s.az) / s.len, nz = -(s.bx - s.ax) / s.len, mx = (s.ax + s.bx) / 2, mz = (s.az + s.bz) / 2, gg = ground(mx, mz), fr = Math.atan2(nx, nz), ry = Math.atan2(-(s.bz - s.az), s.bx - s.ax);
    const hh = 6.2 + Math.sin(i / 24 * PI) * 2.4;
    // two picture lights per segment (one per portrait row's top painting: lights sit above the upper row and between rows)
    [[3.5, 4.55], [1.6, 2.62]].forEach(([py, ly]) => { const ox = mx + nx * 0.27, oz = mz + nz * 0.27;
      facPut('bronze', mx + nx * 0.42, gg + ly + 0.04, mz + nz * 0.42, 0.03, 0.03, 0.34, fr);
      facPut('cwShade', mx + nx * 0.6, gg + ly, mz + nz * 0.6, 0.62, 0.07, 0.11, ry);
      o.position.set(mx + nx * 0.262, gg + py + 0.2, mz + nz * 0.262); o.rotation.set(0, fr, 0); o.scale.set(1, 1, 1); o.updateMatrix(); if (wk < 48) wim.setMatrixAt(wk++, o.matrix); });
    // coping along the top, and the frieze band
    facPut('stoneD', mx, gg + hh + 0.03, mz, s.len + 0.1, 0.08, 0.62, ry);
    const ya = gg + 5.15, yb = gg + 5.55, u0 = s.s0 / total, u1 = (s.s0 + s.len) / total, o2 = 0.256;
    const A = [s.ax + nx * o2, s.az + nz * o2], B = [s.bx + nx * o2, s.bz + nz * o2], ga = ground(s.ax, s.az) * 0 + gg;
    P.push(A[0], ya, A[1], B[0], ya, B[1], B[0], yb, B[1], A[0], ya, A[1], B[0], yb, B[1], A[0], yb, A[1]); U.push(1 - u0, 0, 1 - u1, 0, 1 - u1, 1, 1 - u0, 0, 1 - u1, 1, 1 - u0, 1); for (let k = 0; k < 6; k++) N.push(nx, 0, nz); });
  wim.count = wk; wim.renderOrder = 4; wim.frustumCulled = false; scene.add(wim); CW2.wim = wim;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  const fm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.3, roughness: 0.7, side: THREE.DoubleSide })); scene.add(fm); CW2.frieze = fm;
  facFlush();
  CW2.ok = true;
})();
window.__FRAMES.push(() => { try { if (!CW2.wash) return; const k = Math.min(1, (L.lamps || 0) * 1.3); CW2.shade.emissiveIntensity = 0.02 + 1.8 * k; CW2.wash.opacity = 0.5 * k; CW2.wim.visible = k > 0.01; } catch (e) { } });
