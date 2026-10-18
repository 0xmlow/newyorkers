// II. THE BODEGA. Room 4: THE COOLER.
// You walk through the bodega's last cooler door and the walk in is a cathedral: a frozen aisle thirty metres long and
// seven tall, racks of cans to the ceiling, snow falling indoors, your breath in front of you.
//
// HEADLINE ILLUSION: stencil pockets. The left side of the aisle is a row of glass cooler doors, and every pane is a
// pocket that is bigger on the inside (engine pocket(): the pane marks the stencil, resets depth to the far plane, and
// whatever sits behind the wall draws only through that pane). Each door opens onto a different impossible place behind
// a wall that is half a metre thick: Rockaway in August, the harbor at dawn, a snow day, the eye, an infinite row of
// eggs, and a whole bodega corner at one twelfth scale. Walk past them and the parallax is real, because the places are.
// The door you came in by is a live render target portal back into the bodega, so the way out is the view out.
export default {
  id: 'cooler', name: 'The Cooler', scale: 'II · The bodega', sound: 'cold',
  kicker: 'Behind the last cooler door in the bodega. Thirty four degrees, thirty metres, and every door in here goes somewhere else.',
  sky: 0x8ea6c2, fog: 0x9fb6d0, fogD: 0.02, hemi: [0xe8f2ff, 0x6a7d96, 0.55], env: 0.6,
  post: { dream: 0.12, bloom: 0.75, vig: 0.42, sat: 0.92, grain: 0.1, tint: 0xeef6ff },
  spawn: [0, -0.4, 0],
  build(c) {
    const { THREE, R } = c;
    const S = R.state;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
    const XL = -3.6, XR = 3.6, ZB = 1.5, ZE = -30, HT = 7, RF = 2.8;   // walls, back, end, height, rack front
    // ---------- materials: frost on everything ----------
    const frostT = c.canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#dfe8f2'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 2.4, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
      for (let i = 0; i < 90; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rnd(-14, 14); y += rnd(-14, 14); g.lineTo(x, y); } g.stroke(); }
    });
    frostT.wrapS = frostT.wrapT = THREE.RepeatWrapping;
    const frost = (color, rough = 0.5) => new THREE.MeshPhysicalMaterial({ color, map: frostT, roughness: rough, metalness: 0.15, clearcoat: 0.35, clearcoatRoughness: 0.6, sheen: 1, sheenColor: new THREE.Color(0xcfe8ff), sheenRoughness: 0.5 });
    const panelT = c.canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#e9eef4'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(120,135,155,.5)'; g.fillRect(0, 0, 4, h); g.fillRect(w / 2, 0, 3, h);
      for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(160,175,195,.12)'; g.fillRect(0, y, w, 2); }
      for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.6})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    panelT.wrapS = panelT.wrapT = THREE.RepeatWrapping;
    const wallM = new THREE.MeshPhysicalMaterial({ map: panelT, roughness: 0.55, clearcoat: 0.3, sheen: 0.6, sheenColor: new THREE.Color(0xd8ecff) }); wallM.userData.rep = 2.4;
    const steelF = frost(0xb8c4d2, 0.42);
    // wire shelving: a grid drawn on a canvas, cut out with alpha, so you see the cans through the shelves above you
    const wireT = c.canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#e6edf4'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.stroke(); } g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } });
    wireT.wrapS = wireT.wrapT = THREE.RepeatWrapping;
    const wireM = new THREE.MeshStandardMaterial({ map: wireT, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.35, color: 0xdfe8f2 }); wireM.userData.rep = 0.4;
    const backM = frost(0x1c2638, 0.6);
    // the floor: diamond plate with a skin of ice
    const plateT = c.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#8b96a3'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.save(); g.translate(16 + x * 32, 16 + y * 32); g.rotate((x + y) % 2 ? 0.8 : -0.8); const gr = g.createLinearGradient(0, -4, 0, 4); gr.addColorStop(0, '#d9e0e8'); gr.addColorStop(1, '#5d6670'); g.fillStyle = gr; g.fillRect(-11, -3, 22, 6); g.restore(); }
      for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(240,248,255,${Math.random() * 0.35})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 5, 0, 7); g.fill(); }
    });
    plateT.wrapS = plateT.wrapT = THREE.RepeatWrapping; plateT.repeat.set((XR - XL) / 0.6, (ZB - ZE) / 0.6);
    c.box(XR - XL, 0.1, ZB - ZE, new THREE.MeshStandardMaterial({ map: plateT, bumpMap: plateT, bumpScale: 2, metalness: 0.7, roughness: 0.38 }), 0, -0.05, (ZB + ZE) / 2, { collide: false });
    // patches of real ice on the floor, glassy
    const iceM = new THREE.MeshBasicMaterial({ map: c.canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(248,252,255,.5)'); gr.addColorStop(0.7, 'rgba(240,248,255,.25)'); gr.addColorStop(1, 'rgba(240,248,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; const a = Math.random() * 7, r = Math.random() * 56; g.fillRect(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 1.5, 1.5); } }), transparent: true, depthWrite: false });
    for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(rnd(0.3, 0.8), 20).rotateX(-Math.PI / 2), iceM); p.scale.z = rnd(1, 2.4); p.position.set(rnd(-1.8, 1.8), 0.004, rnd(ZE + 1, -2)); c.add(p); }
    // walls, ceiling, the end
    c.box(0.2, HT, ZB - ZE, wallM, XL - 0.1, HT / 2, (ZB + ZE) / 2, { collide: false });
    c.box(0.2, HT, ZB - ZE, wallM, XR + 0.1, HT / 2, (ZB + ZE) / 2, { collide: false });
    c.box(XR - XL, 0.2, ZB - ZE, wallM, 0, HT + 0.1, (ZB + ZE) / 2, { collide: false });
    c.box(XR - XL + 0.4, HT, 0.2, wallM, 0, HT / 2, ZE - 0.1, { collide: false });
    c.wall(XL + 0.05, ZB, XL + 0.05, ZE); c.wall(XR - 0.05, ZB, XR - 0.05, ZE); c.wall(XL, ZE, XR, ZE);
    // back wall with the door we came in by
    const DW = 1.3, DH = 2.3;
    c.box(XR - DW / 2, HT, 0.2, wallM, (DW / 2 + XR) / 2, HT / 2, ZB + 0.1, { collide: false });
    c.box(XR - DW / 2, HT, 0.2, wallM, -(DW / 2 + XR) / 2, HT / 2, ZB + 0.1, { collide: false });
    c.box(DW, HT - DH, 0.2, wallM, 0, DH + (HT - DH) / 2, ZB + 0.1, { collide: false });
    c.wall(XL, ZB, -DW / 2, ZB); c.wall(DW / 2, ZB, XR, ZB);
    // the doorway is a live portal into the bodega, looking out the way you will walk
    { const src = new THREE.Object3D(); src.position.set(0, c.EYE, ZB + 0.12); src.rotation.y = Math.PI; c.add(src);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH)); mesh.position.set(0, DH / 2, ZB + 0.12); mesh.rotation.y = Math.PI; c.add(mesh);
      c.portal({ mesh, src, to: 'bodega', at: [0.6, c.EYE, -5.4, Math.PI], k: 1, ride: false, res: 0.4, maxDist: 12, clip: 0.05 });
      const doorM = new THREE.MeshStandardMaterial({ color: 0xc7ced6, metalness: 0.8, roughness: 0.35 });
      for (const [w, h, x, y] of [[0.1, DH + 0.1, -DW / 2 - 0.05, DH / 2], [0.1, DH + 0.1, DW / 2 + 0.05, DH / 2], [DW + 0.2, 0.1, 0, DH + 0.05]]) c.add(c.slab(w, h, 0.3, doorM, x, y, ZB));
      // the heavy insulated door itself, swung open against the wall, with its latch and its thermometer
      const leaf = c.slab(DW, DH, 0.14, frost(0xdfe6ee, 0.5), 0, DH / 2, 0); const hinge = new THREE.Group(); hinge.position.set(-DW / 2, 0, ZB - 0.08); hinge.rotation.y = 2.95; leaf.position.x = DW / 2; hinge.add(leaf); c.add(hinge);
      const latch = c.slab(0.06, 0.32, 0.08, doorM, DW - 0.12, 1.1, -0.1); hinge.add(latch);
      // a strip curtain in the doorway, the PVC kind every walk in has, swaying when you pass
      const strips = []; const stripM = new THREE.MeshPhysicalMaterial({ color: 0xdaf0ff, transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
      for (let i = 0; i < 7; i++) { const g = new THREE.Group(); g.position.set(-DW / 2 + 0.1 + i * (DW - 0.2) / 6, DH - 0.02, ZB - 0.02); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.2, DH - 0.25), stripM); s.position.y = -(DH - 0.25) / 2; g.add(s); c.add(g); strips.push(g); }
      S.strips = strips;
      const exitS = c.sign('BACK TO THE BODEGA', { w: 1.2, h: 0.18, bg: '#06163a', fg: '#00e5ff', font: c.FONT, glow: 10, px: 80 }); exitS.position.set(0, DH + 0.3, ZB - 0.02); exitS.rotation.y = 0; c.add(exitS); }
    c.door({ x: 0, z: ZB - 0.32, r: 0.4, fn: () => c.go('bodega', [0.6, -5.4, Math.PI]) });

    // ---------- the racks, and the cans: instanced, five products, faced in runs like a real cooler ----------
    const LV = []; for (let y = 0.25; y < 6.1; y += 0.45) LV.push(+y.toFixed(2));
    const DOORS = [-4, -8.5, -13, -17.5, -22, -26.5], DHW = 0.62;
    // rack runs: the whole right side; on the left, the stretches between the doors
    const runs = [{ x0: RF, x1: XR, z0: ZB - 1.2, z1: ZE + 0.2, side: 1 }];
    { let z = ZB - 1.2; for (const d of DOORS) { runs.push({ x0: XL, x1: -RF, z0: z, z1: d + DHW, side: -1 }); z = d - DHW; } runs.push({ x0: XL, x1: -RF, z0: z, z1: ZE + 0.2, side: -1 }); }
    const label = (bg, fg, txt, deco) => c.canvasTex(256, 128, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); deco && deco(g, w, h); g.fillStyle = fg; g.font = `800 22px ${c.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const L = txt.split('\n'); L.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (L.length - 1) / 2) * 24)); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 6, w, 3); g.fillRect(0, h - 9, w, 3); });
    const eyeDeco = (g, w, h) => { g.fillStyle = '#0d47ff'; g.beginPath(); g.arc(w / 2 - 70, h / 2, 13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2 - 70, h / 2, 8, 0, 7); g.fill(); g.fillStyle = '#5ab4ff'; g.beginPath(); g.arc(w / 2 - 70, h / 2, 5, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(w / 2 - 70, h / 2, 2.5, 0, 7); g.fill(); };
    const PRODUCTS = [
      { t: label('#1d3fd6', '#f0f4f8', 'NAZAR\nCOLA', eyeDeco), m: 0.65 },
      { t: label('#f0f4f8', '#0a8fb0', 'OPEN EYE\nSELTZER', (g, w, h) => c.eyeFlower(g, 40, h / 2, 22)), m: 0.2 },
      { t: label('#be854c', '#02040c', 'COUNTED\nLAGER', (g, w, h) => { g.strokeStyle = '#02040c'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(196 + k * 8, 50); g.lineTo(196 + k * 8, 78); g.stroke(); } g.beginPath(); g.moveTo(190, 72); g.lineTo(230, 56); g.stroke(); }), m: 0.55 },
      { t: label('#0b0b10', '#ff2e63', '3:33 AM\nENERGY'), m: 0.7 },
      { t: label('#c6ccd4', '#8a929c', ''), m: 0.95 },
    ];
    const canG = new THREE.CylinderGeometry(0.033, 0.033, 0.122, 8, 1, false);
    const slots = PRODUCTS.map(() => []);
    const caseSlots = [];
    for (const r of runs) {
      const len = Math.abs(r.z1 - r.z0); if (len < 0.3) continue;
      const fx = r.side > 0 ? r.x0 + 0.06 : r.x1 - 0.06;          // front row of cans, at the rack face
      for (const [li, y] of LV.entries()) {
        if (li === LV.length - 1) { for (let z = r.z0 - 0.3; z > r.z1 + 0.3; z -= rnd(0.55, 0.9)) caseSlots.push([fx - r.side * 0.12, y + 0.02, z, r.side]); continue; }
        if (li === 0) continue;     // the bottom shelf is the milk
        let p = Math.floor(Math.random() * 5), left = 0;
        for (let z = r.z0 - 0.05; z > r.z1 + 0.05; z -= 0.074) {
          if (left-- <= 0) { p = Math.random() < 0.15 ? 4 : Math.floor(Math.random() * 4); left = 6 + Math.floor(Math.random() * 10); }
          if (Math.random() < 0.04) continue;     // somebody took one
          for (const dx of c.MOBILE ? [0] : [0, 0.075]) for (const dy of c.MOBILE ? [0] : [0, 0.124]) if (!(dy && Math.random() < 0.25)) slots[p].push([fx - r.side * dx, y + 0.065 + dy, z, r.side]);
        }
      }
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
    PRODUCTS.forEach((P, i) => {
      const s = slots[i]; if (!s.length) return;
      const im = new THREE.InstancedMesh(canG, new THREE.MeshStandardMaterial({ map: P.t, metalness: P.m, roughness: 0.32, envMapIntensity: 1.3 }), s.length);
      s.forEach(([x, y, z, side], k) => { e.set(0, (side > 0 ? Math.PI / 2 : -Math.PI / 2) + rnd(-0.35, 0.35), 0); q.setFromEuler(e); m4.compose(pv.set(x, y, z), q, one); im.setMatrixAt(k, m4); });
      c.add(im);
    });
    // cases of the same on the top shelf, cardboard, frosted
    { const caseT = c.canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#b08a5a'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a3e22'; g.font = `800 26px ${c.FONT}`; g.textAlign = 'center'; g.fillText('24 CANS', w / 2, 52); g.font = `600 18px ${c.MONO}`; g.fillText('KEEP COLD. KEEP COUNTING.', w / 2, 86); });
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), new THREE.MeshStandardMaterial({ map: caseT, roughness: 0.9 }), caseSlots.length);
      caseSlots.forEach(([x, y, z, side], k) => { m4.compose(pv.set(x, y + 0.15, z), q.setFromEuler(e.set(0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0)), one); im.setMatrixAt(k, m4); }); c.add(im); }
    // the rack frames: uprights and wire shelves, merged, frosted
    { const up = [], sh = [], ws = [], bk = [];
      for (const r of runs) { const len = Math.abs(r.z1 - r.z0); if (len < 0.3) continue; const zc = (r.z0 + r.z1) / 2, xc = (r.x0 + r.x1) / 2, front = r.side > 0 ? r.x0 : r.x1;
        for (let z = r.z0; z >= r.z1 - 0.01; z -= Math.max(0.6, len / Math.ceil(len / 1.2))) up.push(new THREE.BoxGeometry(0.05, HT - 0.4, 0.05).translate(front, (HT - 0.4) / 2, z));
        up.push(new THREE.BoxGeometry(0.05, HT - 0.4, 0.05).translate(front, (HT - 0.4) / 2, r.z1));
        for (const y of LV) { const b = c.slab(0.8, 0.012, len, wireM).geometry; ws.push(b.translate(xc, y, zc)); sh.push(new THREE.BoxGeometry(0.03, 0.05, len).translate(front, y + 0.025, zc)); }
        bk.push(new THREE.PlaneGeometry(len, HT - 0.2).rotateY(-r.side * Math.PI / 2).translate(r.side > 0 ? r.x1 - 0.06 : r.x0 + 0.06, (HT - 0.2) / 2, zc));
        // colliders round the rack footprint
        c.wall(r.x0, r.z0, r.x0, r.z1); c.wall(r.x1, r.z0, r.x1, r.z1); c.wall(r.x0, r.z0, r.x1, r.z0); c.wall(r.x0, r.z1, r.x1, r.z1); }
      c.add(new THREE.Mesh(c.merge(up), steelF)); c.add(new THREE.Mesh(c.merge(sh), steelF)); c.add(new THREE.Mesh(c.merge(ws), wireM)); c.add(new THREE.Mesh(c.merge(bk), backM)); }
    // price strips on the shelf lips: every price in here is 3.33
    { const priceT = c.canvasTex(512, 32, (g, w, h) => { g.fillStyle = '#f6f2e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#06163a'; g.font = `700 20px ${c.MONO}`; for (let x = 6; x < w; x += 128) g.fillText('$3.33', x, 23); g.fillStyle = '#ff2e63'; g.fillRect(100, 4, 18, 24); });
      priceT.wrapS = THREE.RepeatWrapping;
      for (const r of runs) { const len = Math.abs(r.z1 - r.z0); if (len < 0.3) continue; const t = priceT.clone(); t.needsUpdate = true; t.repeat.set(len / 2.2, 1);
        const m = new THREE.MeshBasicMaterial({ map: t, color: 0xdfe6ee }); const front = (r.side > 0 ? r.x0 : r.x1) - r.side * 0.03;
        for (const y of LV.slice(1, -1)) { const p = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.04), m); p.position.set(front, y + 0.02, (r.z0 + r.z1) / 2); p.rotation.y = -r.side * Math.PI / 2; c.add(p); } } }
    // milk, in the bottom shelf, in plain gallons
    { const milkT = c.canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#f6f8fa'; g.fillRect(0, 0, w, h); g.fillStyle = '#2962ff'; g.fillRect(0, 70, w, 26); g.fillStyle = '#fff'; g.font = `800 20px ${c.FONT}`; g.textAlign = 'center'; g.fillText('WHOLE', w / 2, 90); });
      const pos = []; for (const r of runs) { const fx = r.side > 0 ? r.x0 + 0.12 : r.x1 - 0.12; for (let z = r.z0 - 0.2; z > r.z1 + 0.2; z -= 0.2) if (Math.random() < 0.7) pos.push([fx, z]); }
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.26, 0.16), new THREE.MeshStandardMaterial({ map: milkT, roughness: 0.5 }), pos.length);
      pos.forEach(([x, z], k) => { m4.compose(pv.set(x, LV[0] + 0.14, z), q.setFromEuler(e.set(0, rnd(-0.2, 0.2), 0)), one); im.setMatrixAt(k, m4); }); c.add(im);
    }

    // ---------- the pockets: six doors, six impossible places ----------
    const frameM = new THREE.MeshStandardMaterial({ color: 0x9aa6b4, metalness: 0.85, roughness: 0.3 });
    const handleM = new THREE.MeshStandardMaterial({ color: 0xe8edf2, metalness: 0.9, roughness: 0.2 });
    const DY = 1.2, DHH = 2.2, DWW = 1.1;
    const pocketDoor = (z, build, tag) => {
      const x = XL + 0.02;
      const mask = new THREE.Mesh(new THREE.PlaneGeometry(DWW, DHH)); mask.position.set(x, DY, z); mask.rotation.y = Math.PI / 2; c.add(mask);
      const P0 = c.pocket({ mask, sheen: 0.12, build: (grp, seal) => build(grp, seal, x) });
      // frame, mullion, handle, the gasket, a frosted bottom edge
      for (const [w, h, dz, y] of [[0.07, DHH + 0.14, -DWW / 2 - 0.035, DY], [0.07, DHH + 0.14, DWW / 2 + 0.035, DY], [DWW + 0.14, 0.07, 0, DY + DHH / 2 + 0.035], [DWW + 0.14, 0.1, 0, DY - DHH / 2 - 0.05]]) c.add(c.slab(0.08, h, w, frameM, x + 0.03, y, z + dz));
      const hd = c.slab(0.04, 0.9, 0.04, handleM, x + 0.12, DY, z + DWW / 2 - 0.12); c.add(hd);
      for (const dy of [-0.4, 0.4]) c.add(c.slab(0.08, 0.03, 0.03, handleM, x + 0.08, DY + dy, z + DWW / 2 - 0.12));
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(DWW, 0.5), new THREE.MeshBasicMaterial({ map: c.canvasTex(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(240,248,255,.85)'); gr.addColorStop(1, 'rgba(240,248,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false }));
      fr.position.set(x + 0.012, DY - DHH / 2 + 0.25, z); fr.rotation.y = Math.PI / 2; fr.renderOrder = 900; c.add(fr);
      // the little card above every door, a museum label for a refrigerator
      const lab = c.sign(tag, { w: 1.0, h: 0.2, bg: '#f2ead8', fg: '#1b1b1b', font: c.MONO, weight: 600, px: 80 }); lab.position.set(x + 0.04, DY + DHH / 2 + 0.24, z); lab.rotation.y = Math.PI / 2; c.add(lab);
      return { mask, P0 };
    };
    const backdrop = (grp, x, z, color, depth = 40) => { const b = new THREE.Mesh(new THREE.BoxGeometry(depth, 16, 16), new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, fog: false })); b.position.set(x - depth / 2 - 0.3, 3, z); grp.add(b); return b; };
    // a plate pocket: the newer frameless plate if it is on disk, else the first one
    const platePocket = (name, z, bg, tag) => pocketDoor(z, (grp, seal, x) => {
      backdrop(grp, x, z, bg);
      const holder = new THREE.Group(); grp.add(holder);
      const make = (nm) => { const p = c.plate(nm, { x: x + 2.4, y: 0, z, ry: Math.PI / 2, zMin: 2.55, far: 45, parent: holder }); p.userData.onMesh = () => seal(); R.pending.splice(0).forEach((f) => f()); };
      const probe = new Image(); probe.onload = () => make(name + '2'); probe.onerror = () => make(name); probe.src = `assets/depth/${name}2.png`;
    }, tag);
    platePocket('p_cooler_beach', DOORS[0], 0x2a3a66, 'ROCKAWAY, AUGUST. KEEP DOOR CLOSED.');
    platePocket('p_cooler_harbor', DOORS[2], 0x1a2a44, 'THE HARBOR, 5 A.M. PLEASE DO NOT FEED.');
    platePocket('p_cooler_snow', DOORS[4], 0x8899b0, 'SNOW DAY, 1996. NO SCHOOL.');
    platePocket('p_cooler_eye', DOORS[5], 0x0a0c22, 'THE EYE. IT IS ALSO LOOKING IN.');
    // an infinite row of eggs, receding into the fog
    const eggDoor = pocketDoor(DOORS[1], (grp, seal, x) => {
      backdrop(grp, x, DOORS[1], 0x070b1e, 220);
      const z = DOORS[1], N = 260;
      const eggM = new THREE.MeshStandardMaterial({ color: 0xf3e6d0, roughness: 0.55, emissive: 0x3a2e20, emissiveIntensity: 0.4 });
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 14, 10).scale(1, 1.32, 1), eggM, N * 2);
      for (let i = 0; i < N; i++) for (const dz of [-0.13, 0.13]) { m4.compose(pv.set(x - 0.35 - i * 0.27, 1.02 + 0.13, z + dz), q.identity(), one); im.setMatrixAt(i * 2 + (dz > 0 ? 1 : 0), m4); }
      grp.add(im);
      // a pendant light every two metres, to the vanishing point
      const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), 60);
      const cords = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 1.2, 0.008), new THREE.MeshBasicMaterial({ color: 0x222833 }), 60);
      for (let i = 0; i < 60; i++) { m4.compose(pv.set(x - 0.6 - i * 1.2, 2.25, z), q.identity(), one); bulbs.setMatrixAt(i, m4); m4.compose(pv.set(x - 0.6 - i * 1.2, 2.9, z), q.identity(), one); cords.setMatrixAt(i, m4); }
      grp.add(bulbs); grp.add(cords);
      const carton = new THREE.Mesh(new THREE.BoxGeometry(N * 0.27 + 0.4, 0.1, 0.56), new THREE.MeshStandardMaterial({ color: 0x9a9488, roughness: 1 })); carton.position.set(x - 0.2 - N * 0.27 / 2, 0.98, z); grp.add(carton);
      const cups = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.09, 0.1, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xb4ad9f, roughness: 1, side: THREE.DoubleSide }), N * 2);
      for (let i = 0; i < N; i++) for (const dz of [-0.13, 0.13]) { m4.compose(pv.set(x - 0.35 - i * 0.27, 1.05, z + dz), q.identity(), one); cups.setMatrixAt(i * 2 + (dz > 0 ? 1 : 0), m4); } grp.add(cups);
      // one of them is not an egg
      const eyeT = c.canvasTex(256, 256, (g) => { g.fillStyle = '#f3e6d0'; g.fillRect(0, 0, 256, 256); c.eyeFlower(g, 128, 128, 100); });
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.101, 18, 12).scale(1, 1.32, 1), new THREE.MeshBasicMaterial({ map: eyeT })); eye.position.set(x - 0.35 - 11 * 0.27, 1.15, z + 0.13); eye.rotation.y = Math.PI / 2; grp.add(eye); S.eggEye = eye;
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(220, 0.02), new THREE.MeshBasicMaterial({ color: 0xfff0d0 })); glow.position.set(x - 110, 2.8, z); glow.rotation.y = Math.PI / 2; glow.rotation.x = Math.PI / 2; grp.add(glow);
    }, 'EGGS, ALL OF THEM. ONE DOZEN.');
    // the bodega on the corner, at one twelfth scale, open
    const dioDoor = pocketDoor(DOORS[3], (grp, seal, x) => {
      const z = DOORS[3];
      const skyM = new THREE.MeshBasicMaterial({ map: c.canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#050a24'); gr.addColorStop(1, '#2a1c4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,${200 + Math.random() * 55},150,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h * 0.8, 3, 4); } }), side: THREE.BackSide, fog: false });
      const sky = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), skyM); sky.position.set(x - 3.2, 2, z); grp.add(sky);
      // the street, the sidewalk, the curb, a hydrant the size of a thimble
      const s = 1 / 12, X0 = x - 0.25;
      const ground = new THREE.Mesh(new THREE.BoxGeometry(3, 0.04, 3), new THREE.MeshStandardMaterial({ color: 0x2a2c33, roughness: 0.9 })); ground.position.set(X0 - 1.5, 0.48, z); grp.add(ground);
      const walk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 3), new THREE.MeshStandardMaterial({ color: 0x8a8a88, roughness: 0.9 })); walk.position.set(X0 - 1.0, 0.51, z); grp.add(walk);
      // the building: four storeys, lit windows, the bodega on the ground floor
      const bx = X0 - 1.35, bw = 1.6;
      const brick = new THREE.MeshStandardMaterial({ color: 0xa4523a, roughness: 0.85, emissive: 0x2a0c06, emissiveIntensity: 0.6 });
      const nb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.1, 0.9), new THREE.MeshStandardMaterial({ color: 0x5a6a7a, roughness: 0.9, emissive: 0x0a1018, emissiveIntensity: 0.6 })); nb.position.set(bx - 0.25, 0.54 + 1.05, z - 1.3); grp.add(nb);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.36), new THREE.MeshStandardMaterial({ color: 0xf6c21a, roughness: 0.4, metalness: 0.2 })); cab.position.set(X0 - 0.45, 0.54 + 0.05, z + 0.1); grp.add(cab);
      const cabTop = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.18), cab.material); cabTop.position.set(X0 - 0.45, 0.54 + 0.11, z + 0.08); grp.add(cabTop);
      const bld = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, bw), brick); bld.position.set(bx - 0.1, 0.54 + 0.8, z); grp.add(bld);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.8, 0.26), new THREE.MeshBasicMaterial({ map: c.tex.load('assets/g/g_shelf_snacks.jpg') })); front.position.set(bx + 0.005, 0.54 + 0.15, z); front.rotation.y = Math.PI / 2; grp.add(front);
      front.material.map.colorSpace = THREE.SRGBColorSpace;
      const awn = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.86, 0.12), new THREE.MeshBasicMaterial({ map: c.tex.load('assets/g/g_awning.jpg') })); awn.material.map.colorSpace = THREE.SRGBColorSpace; awn.position.set(bx + 0.05, 0.54 + 0.34, z); awn.rotation.y = Math.PI / 2; awn.rotation.order = 'YXZ'; awn.rotation.x = -0.5; grp.add(awn);
      const winM = new THREE.MeshBasicMaterial({ color: 0xffc27a });
      for (let f = 0; f < 4; f++) for (let k = 0; k < 4; k++) if (Math.random() < 0.75) { const wq = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.14), winM); wq.position.set(bx + 0.003, 0.54 + 0.55 + f * 0.27, z - bw / 2 + 0.22 + k * 0.38); wq.rotation.y = Math.PI / 2; grp.add(wq); }
      const glowSpill = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffb46a, transparent: true, opacity: 0.35, depthWrite: false })); glowSpill.position.set(bx + 0.3, 0.545, z); grp.add(glowSpill);
      // a tiny lamppost, a tiny cat, a tiny pigeon, a tiny New Yorker
      c.glb('lamppost', { h: 0.36, x: X0 - 0.85, y: 0.54, z: z + 0.6, parent: grp, onload: () => seal() });
      c.glb('cat', { h: 0.03, x: bx + 0.12, y: 0.54, z: z - 0.25, ry: Math.PI / 2, parent: grp, onload: () => seal() });
      c.glb('pigeon', { h: 0.025, x: X0 - 0.95, y: 0.54, z: z - 0.4, ry: 1.2, parent: grp, onload: () => seal() });
      c.glb('hydrant', { h: 0.06, x: X0 - 0.82, y: 0.54, z: z - 0.62, parent: grp, onload: () => seal() });
      const nyCv = c.canvasTex(128, 128, (g) => c.eyeFlower(g, 64, 64, 60));
      const ny = new THREE.Group(); ny.position.set(X0 - 1.05, 0.54, z + 0.15); grp.add(ny);
      const bod = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.07, 3, 8), new THREE.MeshStandardMaterial({ color: 0x2a2f44 })); bod.position.y = 0.07; ny.add(bod);
      const hd = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ map: nyCv, transparent: true, alphaTest: 0.1 })); hd.position.set(0.0, 0.15, 0); hd.rotation.y = Math.PI / 2; ny.add(hd);
      // warm light for the little street, from inside the pocket
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); lamp.position.set(X0 - 0.85, 0.54 + 0.36, z + 0.6); grp.add(lamp);
    }, 'THE BODEGA, SMALLER. THE CAT IS TO SCALE.');
    c.click(eggDoor.mask, () => { c.say(eggDoor.mask, 'one of them is looking at you'); c.egg('cooler_eggs', 'Somebody asked for a dozen. This is the dozen. Count them, we will wait.'); }, 'A dozen eggs');
    c.click(dioDoor.mask, () => { c.sound.bell && c.sound.bell(); c.egg('cooler_diorama', 'The bodega, in the cooler, in the bodega. The cat in there is judging you at one twelfth scale.'); }, 'Look closer');
    // light leaking from the impossible places onto the floor of the aisle
    const leakT = c.canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(0, 64, 0, 0, 64, 128); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    for (const [z, col] of [[DOORS[0], 0xffa060], [DOORS[1], 0xfff0d0], [DOORS[2], 0x6fb0ff], [DOORS[3], 0xffb46a], [DOORS[4], 0xe8f2ff], [DOORS[5], 0x2962ff]]) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: leakT, color: col, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); l.position.set(XL + 1.3, 0.006, z); l.renderOrder = 1; c.add(l);
    }

    // ---------- the New Yorkers: ten, in frosted frames, on the racks ----------
    const frostRimT = c.canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { const x = Math.random() * w, y = Math.random() * h, e = Math.min(x, y, w - x, h - y); if (e > 30 || Math.random() > (1 - e / 30) * 1.4) continue; g.fillStyle = `rgba(245,250,255,${0.25 + Math.random() * 0.5})`; g.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2); } const gr = (a, b, c2, d) => { const q2 = g.createLinearGradient(a, b, c2, d); q2.addColorStop(0, 'rgba(240,248,255,.55)'); q2.addColorStop(1, 'rgba(240,248,255,0)'); return q2; }; g.fillStyle = gr(0, 0, 0, 22); g.fillRect(0, 0, w, 22); g.fillStyle = gr(0, h, 0, h - 22); g.fillRect(0, h - 22, w, 22); g.fillStyle = gr(0, 0, 22, 0); g.fillRect(0, 0, 22, h); g.fillStyle = gr(w, 0, w - 22, 0); g.fillRect(w - 22, 0, 22, h); });
    const rimM = new THREE.MeshBasicMaterial({ map: frostRimT, transparent: true, depthWrite: false });
    const art = c.art(10), framed = [];
    const SPOTS = [[1, -4.6], [1, -9.6], [1, -14.6], [1, -19.6], [1, -24.6], [-1, DOORS[0] - 2.25], [-1, DOORS[1] - 2.25], [-1, DOORS[2] - 2.25], [-1, DOORS[3] - 2.25], [-1, DOORS[4] - 2.25]];
    art.forEach((p, i) => {
      const [side, z] = SPOTS[i]; const x = side > 0 ? RF - 0.04 : -RF + 0.04, ry = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      // a backing board so the cans behind never show through the frame
      const bb = c.slab(0.03, 1, 1, new THREE.MeshStandardMaterial({ color: 0x0a1230, roughness: 0.8 }), x + side * 0.02, 1.6, z); c.add(bb);
      const g = c.hang(p, x, 1.6, z, ry, 1.2, 'bone', { light: true });
      const rim = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), rimM); rim.position.set(0, 0, 0.11); g.add(rim); rim.renderOrder = 5;
      framed.push({ g, rim, bb });
    });

    // ---------- the ceiling: light tubes, two evaporators with fans, icicles, pink drips frozen mid fall ----------
    const tube = new THREE.MeshBasicMaterial({ color: 0xf4faff, toneMapped: false });
    { const tg = []; for (let z = -1; z > ZE + 1; z -= 3) for (const x of [-1.2, 1.2]) tg.push(new THREE.BoxGeometry(0.12, 0.05, 2.2).translate(x, HT - 0.05, z)); c.add(new THREE.Mesh(c.merge(tg), tube)); }
    const fans = [];
    for (const z of [-7, -19]) {
      const ev = c.slab(1.4, 0.7, 3.2, frost(0xdfe6ee, 0.45), 0, HT - 0.45, z); c.add(ev);
      for (const dz of [-1, 0, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 6, 24), steelF); ring.position.set(0, HT - 0.82, z + dz); ring.rotation.x = Math.PI / 2; c.add(ring);
        const fan = new THREE.Group(); fan.position.set(0, HT - 0.84, z + dz); c.add(fan); fans.push(fan);
        for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.01, 0.12), steelF); b.position.x = 0.17; const a = new THREE.Group(); a.rotation.y = k * Math.PI / 2; b.rotation.x = 0.4; a.add(b); fan.add(a); } }
      const lbl = c.sign('EVAPORATOR  ·  DO NOT LICK', { w: 1.3, h: 0.14, bg: '#06163a', fg: '#f0f4f8', font: c.MONO, px: 64 }); lbl.position.set(0, HT - 0.45, z + 1.61); c.add(lbl);
    }
    const ice = [], pink = [], violet = [];
    for (let i = 0; i < 70; i++) { const x = rnd(-1, 1) > 0 ? rnd(-0.65, 0.65) : rnd(-3.4, 3.4), z = rnd(ZE + 1, 0), len = rnd(0.08, 0.5), y = x > -0.7 && x < 0.7 && (Math.abs(z + 7) < 1.6 || Math.abs(z + 19) < 1.6) ? HT - 0.8 : HT; ice.push(new THREE.ConeGeometry(rnd(0.01, 0.03), len, 6).rotateX(Math.PI).translate(x, y - len / 2, z)); }
    // the style's paint drips, frozen: off the shelf lips, hot pink and violet icicles
    for (let i = 0; i < 60; i++) { const r = pickOf(runs), len = rnd(0.08, 0.45), rr = rnd(0.008, 0.02), y = pickOf(LV.filter((v) => v > 2.6)), zz = rnd(Math.min(r.z0, r.z1), Math.max(r.z0, r.z1)), xx = (r.side > 0 ? r.x0 : r.x1) - r.side * 0.03;
      const arr = Math.random() < 0.6 ? pink : violet; arr.push(new THREE.CylinderGeometry(rr, rr * 0.4, len, 6).translate(xx, y - len / 2, zz), new THREE.SphereGeometry(rr * 1.3, 8, 6).scale(1, 1.4, 1).translate(xx, y - len, zz)); }
    c.add(new THREE.Mesh(c.merge(ice), new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, roughness: 0.05, transmission: 0.6, thickness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })));
    c.add(new THREE.Mesh(c.merge(pink), new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.12, clearcoat: 1, emissive: 0x5a0018, emissiveIntensity: 0.4 })));
    c.add(new THREE.Mesh(c.merge(violet), new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.12, clearcoat: 1, emissive: 0x200838, emissiveIntensity: 0.45 })));

    // ---------- the temperature sign ----------
    const TEMPS = ['34°F. FEELS LIKE A MONDAY.', '34°F. FEELS LIKE THE F TRAIN IN JANUARY.', '34°F. FEELS LIKE YOUR EX TEXTING.', '34°F. FEELS LIKE ALTERNATE SIDE PARKING.', '34°F. FEELS LIKE 3:33 A.M.'];
    S.ti = 0;
    const tempS = c.sign(TEMPS[0], { w: 4.2, h: 0.36, bg: '#050505', fg: '#ff3b2e', font: c.MONO, glow: 14, px: 96 });
    tempS.position.set(0, 4.6, -12.5); c.add(tempS);
    const tempB = c.slab(4.3, 0.46, 0.06, new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5 }), 0, 4.6, -12.54); c.add(tempB);
    for (const dx of [-1.8, 1.8]) c.add(c.slab(0.02, HT - 4.83, 0.02, steelF, dx, (HT + 4.83) / 2, -12.54));
    c.click(tempS, () => { S.ti = (S.ti + 1) % TEMPS.length; const n = c.sign(TEMPS[S.ti], { w: 4.2, h: 0.36, bg: '#050505', fg: '#ff3b2e', font: c.MONO, glow: 14, px: 96 }); tempS.material.map.dispose(); tempS.material.map = n.material.map; tempS.material.needsUpdate = true; c.egg('cooler_sign', 'The thermostat has opinions. All of them are thirty four degrees.'); }, 'Check the temperature');

    // ---------- crates, cases, a hand truck, the floor sign ----------
    for (const [x, z, n, ry] of [[-2.2, 0.2, 3, 0.2], [2.1, -1.3, 4, -0.3], [-2.25, -11, 2, 0.5], [2.15, -16.3, 3, 0.1], [-2.25, -28.6, 4, -0.2], [2.2, -28.2, 2, 0.3]]) {
      for (let k = 0; k < n; k++) c.glb('ph_plastic_crate_01', { h: 0.3, x: x + rnd(-0.03, 0.03), y: k * 0.3, z: z + rnd(-0.03, 0.03), ry: ry + rnd(-0.15, 0.15), shadow: k === 0 });
      c.post(x, z, 0.36);
    }
    c.glb('ph_bananas', { h: 0.14, x: -2.2, y: 0.9, z: 0.2, ry: 0.5 });
    c.glb('ph_lemon', { h: 0.07, x: 2.05, y: 1.2, z: -1.2 }); c.glb('ph_lemon', { h: 0.07, x: 2.15, y: 1.2, z: -1.35 });
    c.glb('ph_yellow_onion', { h: 0.08, x: -2.3, y: 0.6, z: -11.1 });
    c.glb('ph_hand_truck', { h: 1.2, x: 1.9, z: -6.2, ry: -0.4 }); c.post(1.9, -6.2, 0.3);
    c.glb('ph_cardboard_box_01', { h: 0.45, x: -2.2, z: -20.3, ry: 0.4 }); c.glb('ph_cardboard_box_01', { h: 0.35, x: -2.15, y: 0.45, z: -20.25, ry: 1.1 }); c.post(-2.2, -20.3, 0.35);
    c.glb('ph_WetFloorSign_01', { h: 0.65, x: 0.9, z: -9.2, ry: 0.6 }); c.post(0.9, -9.2, 0.25);
    const wet = c.sign('CAUTION\nTHE FLOOR IS A LAKE', { w: 0.32, h: 0.2, bg: '#f6c21a', fg: '#02040c', font: c.FONT, px: 64 }); wet.position.set(0.9, 0.45, -9.0); wet.rotation.y = 0.6; c.add(wet);
    c.glb('ph_metal_trash_can', { h: 0.8, x: 2.3, z: 0.6 });
    // stickers: the cooler has been tagged by every stock boy who ever worked a night shift
    { const G = window.STICKER_GROUPS || {}, pool = [...(G.bodega || []), ...(G.eye || []).slice(40, 80), ...(G.mlow || [])]; let k = 0;
      for (const d of DOORS) for (let i = 0; i < 5; i++) c.sticker(pool[(k++ * 7) % pool.length], XL + 0.08, rnd(0.2, 0.75), d + (Math.random() < 0.5 ? -1 : 1) * rnd(0.58, 0.64), { ry: Math.PI / 2, size: rnd(0.08, 0.13) });
      for (let i = 0; i < 16; i++) c.sticker(pool[(k++ * 5) % pool.length], rnd(-0.6, 0.6), rnd(HT - 0.75, HT - 0.2), (Math.random() < 0.5 ? -7 : -19) + 1.61, { size: rnd(0.1, 0.16) });
      for (let i = 0; i < 12; i++) c.sticker(pool[(k++ * 3) % pool.length], rnd(-3, 3), rnd(0.3, 2.6), ZE + 0.01, { size: rnd(0.14, 0.24) });
      for (let i = 0; i < 8; i++) c.sticker(pool[(k++ * 11) % pool.length], rnd(-1.6, -0.75) * (Math.random() < 0.5 ? 1 : -1), rnd(0.4, 2.0), ZB - 0.01, { ry: Math.PI, size: rnd(0.12, 0.2) }); }
    // writing in the frost on the end wall, a finger's width
    const fw = c.sign('MLow WAS HERE', { w: 1.6, h: 0.3, bg: null, fg: 'rgba(120,140,170,.75)', font: c.SERIF, weight: 400, px: 96 }); fw.position.set(-2.1, 1.4, ZE + 0.02); fw.rotation.z = 0.06; c.add(fw);

    // ---------- the eye on the end wall: the compressor's eye, it watches the pigeon, until you come close ----------
    const eyeCv = document.createElement('canvas'); eyeCv.width = eyeCv.height = 512; const eyeT = new THREE.CanvasTexture(eyeCv); eyeT.colorSpace = THREE.SRGBColorSpace;
    const bigEye = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshBasicMaterial({ map: eyeT, transparent: true, toneMapped: false })); bigEye.position.set(0.8, 3.5, ZE + 0.03); c.add(bigEye);
    const ringE = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.4, 48), new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false })); ringE.position.set(0.8, 3.5, ZE + 0.025); c.add(ringE);
    c.click(bigEye, () => c.say(bigEye, pickOf(['I keep the cold.', 'She will not get here. That is fine.', 'Close the door, you are letting the summer in.'])), 'The eye that keeps the cold');
    const arr = c.sign('PIGEON ARRIVAL POINT\nEXPECTED SOON', { w: 1.1, h: 0.3, bg: null, fg: '#f6c21a', font: c.MONO, px: 64 }); arr.rotation.x = -Math.PI / 2; arr.position.set(0, 0.007, ZE + 0.6); c.add(arr);

    // ---------- the pigeon in the scarf: walks away down the aisle, never arrives ----------
    const PZ0 = -6, PZE = ZE + 0.5;
    const pig = c.glb('pigeon', { h: 0.3, x: 0.3, z: PZ0, ry: Math.PI });
    const knit = c.canvasTex(128, 32, (g, w, h) => { for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#ff2e63' : '#2962ff'; g.fillRect(x, 0, 16, h); } g.strokeStyle = 'rgba(255,255,255,.3)'; for (let x = 0; x < w; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 2, h); g.stroke(); } });
    knit.wrapS = THREE.RepeatWrapping; knit.repeat.set(3, 1);
    const knitM = new THREE.MeshStandardMaterial({ map: knit, roughness: 0.95 });
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.017, 8, 20), knitM); scarf.rotation.x = Math.PI / 2 - 0.25; scarf.position.set(0, 0.2, 0.035); pig.add(scarf);
    const tail = c.slab(0.025, 0.09, 0.012, knitM, 0.02, 0.15, 0.075); tail.rotation.z = 0.25; pig.add(tail);
    const tail2 = c.slab(0.025, 0.07, 0.012, knitM, -0.01, 0.16, 0.07); tail2.rotation.z = -0.2; pig.add(tail2);
    c.click(pig, () => { c.sound.coo(1.15); c.say(pig, pickOf(['coo. almost there.', 'coo. do not wait up.', 'coo. it is a long aisle.'])); c.egg('cooler_scarf', 'She knitted the scarf herself. Thirty four degrees is thirty four degrees.'); }, 'A pigeon in a scarf');

    // ---------- snow, indoors ----------
    const NS = c.MOBILE ? 900 : 2200, sp = new Float32Array(NS * 3), sv = new Float32Array(NS);
    for (let i = 0; i < NS; i++) { sp[i * 3] = rnd(XL + 0.8, XR - 0.8); sp[i * 3 + 1] = rnd(0, HT); sp[i * 3 + 2] = rnd(ZE, ZB); sv[i] = rnd(0.25, 0.6); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const dotT = c.canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
    const snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.045, map: dotT, transparent: true, depthWrite: false, color: 0xffffff, sizeAttenuation: true }));
    snow.frustumCulled = false; c.add(snow);

    // ---------- your breath ----------
    const puffT = c.canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(0.5, 'rgba(240,248,255,.3)'); gr.addColorStop(1, 'rgba(240,248,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    const puffs = []; for (let i = 0; i < 8; i++) { const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffT, transparent: true, depthWrite: false, opacity: 0 })); sp2.visible = false; c.add(sp2); puffs.push({ s: sp2, age: 9, v: new THREE.Vector3() }); }
    let lastPuff = 0, px0 = null, pz0 = null, pi = 0;

    // ---------- lights ----------
    c.light(0, 6.3, -2.5, 0xeaf4ff, 2.4, 15);
    c.light(0, 6.3, -13, 0xeaf4ff, 2.4, 15);
    c.light(0, 6.3, -23.5, 0xeaf4ff, 2.4, 15);
    c.light(0, 2.0, ZB - 0.6, 0xffb46a, 1.6, 5);
    c.light(XL + 0.6, 1.2, DOORS[0], 0xffa060, 1.8, 4.5, (t) => 0.85 + 0.15 * Math.sin(t * 0.8));
    c.light(0.8, 3.2, ZE + 1.5, 0x5ab4ff, 2.2, 8);

    // ---------- every frame ----------
    let lastEye = '';
    c.tick((t, dt, me) => {
      for (const F of framed) { const a = F.g.userData.art; if (a && F.rim.userData.h !== a.scale.y) { F.rim.userData.h = a.scale.y; F.rim.scale.set(a.scale.x + 0.42, a.scale.y + 0.42, 1); F.bb.scale.set(1, a.scale.y + 0.5, a.scale.x + 0.5); } }
      // snow
      const pa = sg.attributes.position.array;
      for (let i = 0; i < NS; i++) { let y = pa[i * 3 + 1] - sv[i] * dt; if (y < 0) y += HT; pa[i * 3 + 1] = y; pa[i * 3] += Math.sin(t * 0.7 + i) * 0.06 * dt; }
      sg.attributes.position.needsUpdate = true;
      // the fans
      for (const [k, f] of fans.entries()) f.rotation.y += dt * (6 + k * 0.3);
      // the strip curtain sways when you are near it
      const near = Math.max(0, 1 - Math.hypot(me.x, me.z - ZB) / 1.6);
      for (const [k, s] of (S.strips || []).entries()) s.rotation.x = Math.sin(t * 2.2 + k * 0.9) * (0.04 + near * 0.35);
      // the pigeon: Zeno's walk. Half the distance, then half again; and it will not let you catch it up
      if (pig.userData.ready) {
        const te = t - (S.t0 ?? (S.t0 = t));
        let z = PZE + (PZ0 - PZE) * Math.exp(-te / 28);
        z = Math.min(z, me.z - 2.4); z = Math.max(z, PZE);
        const zPrev = pig.position.z; pig.position.z += (z - pig.position.z) * Math.min(1, dt * 2.2);
        const moving = Math.abs(pig.position.z - zPrev) / Math.max(1e-3, dt);
        pig.position.y = Math.abs(Math.sin(t * (6 + moving * 6))) * 0.012 * Math.min(1, 0.3 + moving);
        pig.rotation.z = Math.sin(t * (6 + moving * 6)) * 0.06;
        pig.position.x = 0.3 + Math.sin(t * 0.4) * 0.25;
      }
      // the eye watches the pigeon, until you are close, then you
      const tgt = Math.hypot(me.x - 0.8, me.z - ZE) < 7 ? [me.x, me.z] : [pig.position.x, pig.position.z];
      const look = [Math.max(-1, Math.min(1, (tgt[0] - 0.8) / 3)), Math.max(-1, Math.min(1, 0.6 - Math.min(1, (tgt[1] - ZE) / 20)))];
      const blink = (t % 6.1) < 0.15 ? 0.95 : 0;
      const key = look.map((v) => v.toFixed(1)).join() + blink;
      if (key !== lastEye) { lastEye = key; const g = eyeCv.getContext('2d'); g.clearRect(0, 0, 512, 512); c.eyeFlower(g, 256, 256, 250, { look, lid: blink, iris: '#00a6d6' }); eyeT.needsUpdate = true; }
      // breath: a puff in front of you when you walk
      if (px0 !== null) {
        const moved = Math.hypot(me.x - px0, me.z - pz0) / Math.max(1e-3, dt);
        if (moved > 0.6 && t - lastPuff > 1.15) {
          lastPuff = t; const P0 = puffs[pi++ % puffs.length]; const yaw = c.P.yaw;
          P0.s.position.set(me.x - Math.sin(yaw) * 0.42, me.y - 0.14, me.z - Math.cos(yaw) * 0.42); P0.v.set(-Math.sin(yaw) * 0.35, 0.08, -Math.cos(yaw) * 0.35); P0.age = 0; P0.s.visible = true;
        }
      }
      px0 = me.x; pz0 = me.z;
      for (const P0 of puffs) { if (P0.age > 2) { P0.s.visible = false; continue; } P0.age += dt; const a = P0.age / 2; P0.s.position.addScaledVector(P0.v, dt); P0.v.multiplyScalar(1 - dt * 0.8); P0.s.scale.setScalar(0.12 + a * 0.55); P0.s.material.opacity = 0.45 * (1 - a) * Math.min(1, P0.age * 8); }
      // the egg that is an eye turns to follow you
      if (S.eggEye) S.eggEye.rotation.y = Math.PI / 2 + Math.atan2(me.z - S.eggEye.position.z, 4) * 0.6;
    });
  },
  onEnter(c) { c.R.state.t0 = undefined; if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('Every door on the left goes somewhere. Walk past them slowly.', 4200), 2400); } },
};
