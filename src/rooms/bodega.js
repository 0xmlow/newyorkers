// II. THE BODEGA. Room 3: PIGEONHOLE DELI GROCERY, OPEN 25 HOURS.
// The dream train let you off at a corner store in Jackson Heights that is open at 3:33 in the morning, because they
// all are. It is the most ordinary room in the show and it is full of doors to elsewhere:
//   HEADLINE: the pigeon on the counter. She comes in every morning. Her eye is a live render target portal (k = 70)
//   onto the nave inside her; look into it and you fall in, and the cut cannot be seen because at the moment you
//   pass the aperture the virtual camera is exactly where you land.
//   Five cooler doors are stencil pockets, bigger on the inside: a snowfield, Rockaway at dawn, the harbour, one
//   enormous eye looking back. The sixth door is a walk in, and you can walk in.
//   ANAMORPHOSIS: an Open Eye Flower cut into a hundred scraps stuck on the shelves, coolers, ceiling and floor.
//   It is one flower only from the STAND HERE sticker inside the door.
//   CCTV: the monitor over the register is a second camera into a target, and in it you have a body (layer 1, which
//   your own camera never draws): a New Yorker in a hoodie with an eye flower for a head, doing what you do.
export default {
  id: 'bodega', name: 'Pigeonhole Deli Grocery', scale: 'II · The bodega', sound: 'bodega',
  kicker: 'Open 25 hours. The coffee is a dollar, the cat has tenure, and the pigeon on the counter is a door.',
  sky: 0x0a0d18, fog: 0x0c0f1a, fogD: 0.01, hemi: [0xfff1dc, 0x2b2016, 0.55], env: 0.55,
  post: { dream: 0.12, bloom: 0.45, vig: 0.42 },
  spawn: [0, 5.2, 0],
  build(c) {
    const { THREE, R } = c;
    const W = 10, D = 14, H = 3.0, hw = W / 2, hd = D / 2;
    const floorM = c.surf('bodega_floor', 1.2, { rough: 0.55 });
    const ceilM = c.surf('ceiling', 1.8);
    const wallM = new THREE.MeshStandardMaterial({ color: 0xe9e0cf, roughness: 0.85 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.6, metalness: 0.4 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc4c9cf, metalness: 0.85, roughness: 0.3 });
    c.box(W, 0.1, D, floorM, 0, -0.05, 0, { collide: false });
    c.box(W, 0.08, D, ceilM, 0, H + 0.04, 0, { collide: false });
    // side walls
    c.box(0.12, H, D, wallM, -hw - 0.06, H / 2, 0); c.box(0.12, H, D, wallM, hw + 0.06, H / 2, 0);
    // ---------- the front: the street through the glass (a pocket with the depth plate) ----------
    const fz = hd;
    c.box(W, 0.9, 0.14, trim, 0, 0.45, fz + 0.07, { collide: false }); c.box(W, H - 2.6, 0.14, trim, 0, 2.6 + (H - 2.6) / 2, fz + 0.07, { collide: false });
    c.wall(-hw, fz - 0.05, hw, fz - 0.05);
    for (const x of [-hw + 0.06, -0.62, 0.62, hw - 0.06]) c.add(c.slab(0.1, 1.7, 0.16, trim, x, 1.75, fz + 0.07));
    const panes = [new THREE.PlaneGeometry(4.3, 1.7).rotateY(Math.PI).translate(-2.82, 1.75, fz), new THREE.PlaneGeometry(4.3, 1.7).rotateY(Math.PI).translate(2.82, 1.75, fz), new THREE.PlaneGeometry(1.1, 2.4).rotateY(Math.PI).translate(0, 1.2, fz + 0.02)];
    const front = new THREE.Mesh(c.merge(panes)); c.add(front);
    c.pocket({ mask: front, sheen: 0.14, build: (grp) => {
      const sky = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 60, 24, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0b1030, side: THREE.BackSide, fog: false }));
      sky.position.set(0, 20, fz); grp.add(sky);
      c.plate('p_street', { x: 0, z: fz - 2.2, ry: Math.PI, zMin: 2.6, far: 55, parent: grp });
    } });
    // the door's push bar and the bell over it
    c.add(c.slab(0.9, 0.05, 0.05, steel, 0, 1.05, fz - 0.04));
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.25 })); bell.position.set(0, 2.5, fz - 0.15); bell.rotation.x = Math.PI; c.add(bell);
    c.click(bell, () => { c.sound.bell(); c.egg('bodega_bell', 'Nobody looks up. Nobody ever looks up.'); }, 'Ring it');
    // the window vinyl, from inside: backwards, as it should be
    const vinyl = c.sign('COLD BEER   LOTTO   HERO   ATM   EBT   OPEN 25 HRS', { w: 8.4, h: 0.32, bg: null, fg: '#ffcf3a', font: c.FONT, weight: 800, glow: 0 }); vinyl.position.set(0, 2.42, fz - 0.03); vinyl.scale.x = -1; c.add(vinyl);
    const neon = c.sign('OPEN', { w: 0.9, h: 0.36, bg: null, fg: '#ff2e63', font: c.SERIF, weight: 900, glow: 26 }); neon.position.set(-3.6, 1.95, fz - 0.06); neon.scale.x = -1; c.add(neon);
    // ---------- the back wall: six cooler doors ----------
    const bz = -hd;
    c.box(W, H, 0.14, wallM, 0, H / 2, bz - 0.07, { collide: true });
    const coolers = [];
    const dw = 1.02, dh = 2.15, x0 = -4.2;
    const frameM = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.7, roughness: 0.35 });
    const pocketPlates = ['p_cooler_snow2', 'p_cooler_beach2', 'p_cooler_eye2', 'p_cooler_harbor2', 'shelf'];
    const pocketKicker = ['A mile of frozen aisle. A pigeon in a scarf is walking it.', 'Rockaway at dawn. Behind the oat milk.', 'Something in here is looking back.', 'The harbour at night. Liberty is wearing flowers.', 'Just cans. Probably.'];
    for (let i = 0; i < 6; i++) {
      const x = x0 + i * (dw + 0.08);
      // the frame, the handle, the glowing header strip
      for (const [w, h, ox, oy] of [[0.06, dh + 0.12, -dw / 2, dh / 2 + 0.25], [0.06, dh + 0.12, dw / 2, dh / 2 + 0.25], [dw + 0.06, 0.08, 0, 0.25], [dw + 0.06, 0.1, 0, dh + 0.3]]) c.add(c.slab(w, h, 0.12, frameM, x + ox, oy, bz + 0.07));
      const handle = c.slab(0.03, 0.6, 0.05, steel, x + dw / 2 - 0.12, 1.3, bz + 0.17); c.add(handle);
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(dw, 0.1), new THREE.MeshBasicMaterial({ color: 0xbfe9ff, toneMapped: false })); strip.position.set(x, dh + 0.42, bz + 0.12); c.add(strip);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.06, dh - 0.04)); pane.position.set(x, 1.32, bz + 0.1); c.add(pane);
      coolers.push({ x, pane, handle });
      if (i < 5) {
        const which = pocketPlates[i];
        c.pocket({ mask: pane, sheen: 0.2, build: (grp) => {
          // behind every door: a cold box, then whatever this door is really for
          const box = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.7), new THREE.MeshStandardMaterial({ color: 0x9fc7e8, roughness: 0.5, side: THREE.BackSide, emissive: 0x3a6c9a, emissiveIntensity: 0.4 })); box.position.set(x, 1.32, bz - 0.35); grp.add(box);
          if (which === 'shelf') { for (let k = 0; k < 4; k++) { const sh = c.picture('g/g_shelf_cans.jpg', dw - 0.08, (dw - 0.08) / 1.5, { emissive: 0.7 }); sh.position.set(x, 0.55 + k * 0.52, bz - 0.55); grp.add(sh); } return; }
          box.visible = false;
          const dome = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 12), new THREE.MeshBasicMaterial({ color: [0xcfe6ff, 0xffb37a, 0x2a1408, 0x081028][i], side: THREE.BackSide, fog: false })); dome.position.set(x, 0, bz - 10); grp.add(dome);
          c.plate(which, { x, z: bz + 1.4, zMin: 1.6, far: 45, parent: grp });
        } });
        c.click(pane, () => c.toast(pocketKicker[i], 3600), 'Look in');
      }
    }
    // the sixth door is a walk in: it swings open as you come near, and the cold comes out
    const walk = coolers[5];
    const leaf = new THREE.Group(); leaf.position.set(walk.x - dw / 2, 0, bz + 0.12); c.add(leaf);
    const leafPane = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.06, dh - 0.04), new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35, roughness: 0.1 })); leafPane.position.set(dw / 2, 1.32, 0); leaf.add(leafPane);
    walk.pane.visible = false; walk.handle.visible = false;
    const leafHandle = c.slab(0.03, 0.6, 0.05, steel, dw - 0.12, 1.3, 0.06); leaf.add(leafHandle);
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.85, toneMapped: false })); fog.position.set(walk.x, 1.32, bz - 0.02); c.add(fog);
    const walkSign = c.sign('WALK IN\nAT YOUR OWN\nTEMPERATURE', { w: 0.7, h: 0.4, bg: '#06163a', fg: '#00e5ff', font: c.MONO, weight: 700, px: 128 }); walkSign.position.set(walk.x, 2.62, bz + 0.13); c.add(walkSign);
    const into = c.door({ x: walk.x, z: bz + 0.45, r: 0.5, to: 'cooler', off: true });
    // ---------- the counter, the register, the cat, the pigeon ----------
    const cx = -3.6, cz0 = -1.5, cz1 = 3.6;
    const counterM = new THREE.MeshStandardMaterial({ color: 0x5a1e22, roughness: 0.55 });
    c.box(1.0, 1.0, cz1 - cz0, counterM, cx, 0.5, (cz0 + cz1) / 2);
    c.add(c.slab(1.1, 0.05, cz1 - cz0 + 0.1, new THREE.MeshPhysicalMaterial({ color: 0xd9d4c9, roughness: 0.25, clearcoat: 0.7 }), cx, 1.025, (cz0 + cz1) / 2));
    // the plexi wall round the register, scratched, with tape and a hole cut for money
    const plexi = new THREE.Mesh(new THREE.PlaneGeometry(cz1 - cz0, 0.9), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false })); plexi.position.set(cx + 0.5, 1.5, (cz0 + cz1) / 2); plexi.rotation.y = Math.PI / 2; c.add(plexi); plexi.userData.noAnamorph = true;
    c.glb('ph_CashRegister_01', { h: 0.32, x: cx + 0.1, y: 1.05, z: 1.6, ry: Math.PI / 2 });
    c.glb('ph_cigarette_pack', { h: 0.09, x: cx + 0.25, y: 1.05, z: 2.4, ry: 0.4 });
    c.glb('ph_bananas', { len: 0.32, x: cx + 0.2, y: 1.05, z: 3.2 });
    c.glb('ph_croissant', { len: 0.16, x: cx + 0.25, y: 1.05, z: 0.6 });
    c.glb('ph_vintage_radio_transceiver', { h: 0.18, x: cx - 0.1, y: 1.05, z: -1.1, ry: Math.PI / 2 });
    // behind the counter: the lotto wall, the menu, a saint candle, the smokes rack (painted out, just colour)
    const lotto = c.picture('g/g_lotto.jpg', 3.4, 2.27, { emissive: 0.6 }); lotto.position.set(-hw + 0.02, 1.75, 1.0); lotto.rotation.y = Math.PI / 2; c.add(lotto);
    const menu = c.picture('g/g_menu.jpg', 3.0, 2.0, { emissive: 0.75 }); menu.position.set(-hw + 0.02, 1.75, -2.6); menu.rotation.y = Math.PI / 2; c.add(menu);
    c.click(menu, () => c.egg('bodega_chopped', 'One chopped cheese, extra everything. It will be ready when you wake up.'), 'Order');
    // the cat has been here longer than the lease, and turns to watch you
    const cat = c.glb('cat', { h: 0.32, x: cx + 0.15, y: 1.05, z: -0.6 });
    c.click(cat, () => { c.egg('bodega_cat', 'The cat has been here longer than the lease. She does not work for you.'); c.say(cat, 'mrrp.'); }, 'Pet the cat');
    // the pigeon. She comes in every morning and stands by the register like she is owed change.
    const pig = c.glb('pigeon', { h: 0.62, x: cx + 0.15, y: 1.05, z: 2.55, ry: Math.PI });
    const eyeSrc = new THREE.Object3D(), eye = new THREE.Mesh(new THREE.CircleGeometry(0.0075, 32)); eye.userData.noAnamorph = true;
    eye.visible = false; c.add(eyeSrc); c.add(eye);
    // her iris ring, so the portal reads as an eye from a distance and as a doorway from close up
    const iris = new THREE.Mesh(new THREE.RingGeometry(0.007, 0.0125, 40), new THREE.MeshBasicMaterial({ color: 0xff8a1f, toneMapped: false })); iris.visible = false; c.add(iris);
    c.portal({ mesh: eye, src: eyeSrc, to: 'nave', at: c.spawnOf('nave'), k: 140, hint: 'Look into her eye', res: 0.45, maxDist: 6, dur: 3.2,
      onArrive: (c2) => { c2.egg('bodega_fell', 'You fell into a pigeon. It happens to everyone eventually.'); } });
    // place the eye on the model once it has loaded: the head is the top front of its bounding box
    window.__bodega = R.state;
    R.state.placeEye = () => {
      if (!pig.userData.ready) return false;
      // she faces the coolers (-z), so her right side and her right eye face the shop floor (+x)
      const b = new THREE.Box3().setFromObject(pig), sz = b.getSize(new THREE.Vector3());
      const E = R.state.eyeAt || [0.2, 0.935, 0.139];   // fractions of the box: out to the side, up, back from the beak
      const head = new THREE.Vector3(b.max.x - R.x0 - sz.x * E[0], b.min.y + sz.y * E[1], b.min.z + sz.z * E[2]);
      eyeSrc.position.copy(head); eyeSrc.rotation.set(0, Math.PI / 2, 0); eye.position.copy(head); eye.rotation.copy(eyeSrc.rotation);
      iris.position.copy(head); iris.position.x += 0.0008; iris.rotation.copy(eye.rotation);
      R.state.box = [b.min.toArray(), b.max.toArray()];
      eye.visible = true; iris.visible = true; return true;
    };
    // ---------- the aisles: two gondolas of MLow brands, faced with the shelf photographs ----------
    const gondola = (x, z0, z1) => {
      const len = z1 - z0, zc = (z0 + z1) / 2;
      c.box(0.9, 1.65, len, new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }), x, 0.825, zc);
      for (const sx of [-1, 1]) {
        const files = sx < 0 ? ['g/g_shelf_snacks.jpg', 'g/g_shelf_home.jpg'] : ['g/g_shelf_home.jpg', 'g/g_shelf_snacks.jpg'];
        const n = Math.max(1, Math.round(len / 2.4));
        for (let k = 0; k < n; k++) { const w = len / n - 0.04, f = c.picture(files[k % 2], w, 1.5, { emissive: 0.55, rough: 0.5 }); f.position.set(x + sx * 0.455, 0.85, z0 + (k + 0.5) * len / n); f.rotation.y = sx * Math.PI / 2; c.add(f); }
        for (let k = 0; k < 4; k++) c.add(c.slab(0.12, 0.025, len, steel, x + sx * 0.5, 0.18 + k * 0.42, zc));
      }
      c.add(c.slab(1.0, 0.04, len + 0.05, new THREE.MeshStandardMaterial({ color: 0xff2e63, roughness: 0.5 }), x, 1.67, zc));
      return { x, z0, z1 };
    };
    gondola(-0.9, -4.0, 2.4); gondola(1.9, -4.0, 2.4);
    // the right wall: hanging chips, a slush machine, the ATM, the ice chest
    const atm = c.box(0.6, 1.5, 0.5, new THREE.MeshStandardMaterial({ color: 0x2b3240, metalness: 0.4, roughness: 0.4 }), hw - 0.35, 0.75, 4.6);
    const atmScreen = c.sign('SURCHARGE\n$3.50\nPRESS ANY\nDREAM', { w: 0.34, h: 0.28, bg: '#062a5a', fg: '#7fe3ff', font: c.MONO, weight: 600, px: 128 }); atmScreen.position.set(hw - 0.6, 1.25, 4.6); atmScreen.rotation.y = -Math.PI / 2; c.add(atmScreen);
    c.click(atmScreen, () => c.egg('bodega_atm', 'Insufficient funds. Sufficient dreams. Have a nice night.'), 'Withdraw');
    c.box(1.6, 0.8, 0.8, new THREE.MeshStandardMaterial({ color: 0xeef3f7, roughness: 0.35 }), hw - 0.5, 0.4, 2.6);
    const ice = c.sign('ICE', { w: 1.2, h: 0.4, bg: '#1d6fd8', fg: '#ffffff', font: c.FONT, weight: 900 }); ice.position.set(hw - 0.91, 0.45, 2.6); ice.rotation.y = -Math.PI / 2; c.add(ice);
    // crates of fruit out of season, a stack of milk crates, the hand truck, a wet floor sign that has never been moved
    c.glb('ph_wooden_crate_01', { h: 0.4, x: 3.4, z: 5.6, ry: 0.3 }); c.glb('ph_food_apple_01', { h: 0.09, x: 3.35, y: 0.4, z: 5.55 }); c.glb('ph_lemon', { h: 0.07, x: 3.55, y: 0.4, z: 5.7 });
    c.glb('ph_plastic_crate_01', { h: 0.32, x: 4.4, z: -5.4 }); c.glb('ph_plastic_crate_01', { h: 0.32, x: 4.4, y: 0.32, z: -5.4, ry: 0.2 }); c.glb('ph_plastic_crate_01', { h: 0.32, x: 4.4, y: 0.64, z: -5.4, ry: -0.1 });
    c.post(4.4, -5.4, 0.3);
    c.glb('ph_WetFloorSign_01', { h: 0.62, x: 0.5, z: -5.6, ry: 0.5 }); c.post(0.5, -5.6, 0.2);
    c.glb('ph_hand_truck', { h: 1.2, x: 4.6, z: 0.2, ry: -1.2 });
    c.glb('ph_cardboard_box_01', { h: 0.4, x: -4.5, z: -5.8 }); c.glb('ph_cardboard_box_01', { h: 0.4, x: -4.4, y: 0.4, z: -5.7, ry: 0.4 });
    // ---------- the stockroom door ----------
    const sdx = 4.3, sdz = -5.2;
    const sdoor = c.slab(0.06, 2.1, 0.9, new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.7 }), hw - 0.03, 1.05, sdz); c.add(sdoor);
    const emp = c.sign('EMPLOYEES ONLY\n(AND PIGEONS)', { w: 0.7, h: 0.3, bg: '#f0f4f8', fg: '#02040c', font: c.MONO, weight: 700, px: 128 }); emp.position.set(hw - 0.07, 1.75, sdz); emp.rotation.y = -Math.PI / 2; c.add(emp);
    c.door({ x: hw - 0.35, z: sdz, r: 0.45, to: 'stairs' });
    // ---------- the New Yorkers: the wall of fame over the coolers and down the right wall ----------
    const pcs = c.art(16); let pi = 0;
    for (let i = 0; i < 4; i++) c.hang(pcs[pi++], -3.6 + i * 2.1, 2.72, bz + 0.1, 0, 0.72, 'black', { label: false });
    for (const z of [-3.2, -0.6, 1.0]) c.hang(pcs[pi++], hw - 0.04, 1.75, z, -Math.PI / 2, 1.25, 'gilt', { light: true });
    for (const z of [-4.8, -2.0, 0.2]) c.hang(pcs[pi++], hw - 0.04, 2.7, z + 0.6, -Math.PI / 2, 0.55, 'black', { label: false });
    // the gondola end caps, where a bodega puts what it is proudest of
    for (const [x, z, ry] of [[-0.9, 2.42, 0], [1.9, 2.42, 0], [-0.9, -4.02, Math.PI], [1.9, -4.02, Math.PI]]) { const p = pcs[pi++]; if (p) c.hang(p, x, 1.05, z, ry, 0.82, 'copper', { light: true }); }
    for (const z of [-5.6, 3.8]) { const p = pcs[pi++]; if (p) c.hang(p, -hw + 0.04, 1.8, z, Math.PI / 2, 0.95, 'black', { light: true }); }
    // ---------- stickers: the bodega has been bombed for thirty years ----------
    const G = window.STICKER_GROUPS || {}, pool = [...(G.bodega || []), ...(G.street || []), ...(G.eye || []).slice(24, 48), ...(G.mlow || []).slice(8, 20)];
    const rnd = (a, b) => a + Math.random() * (b - a); let si = 0;
    const put = (x, y, z, ry, size) => c.sticker(pool[si++ % pool.length], x, y, z, { ry, size });
    for (const cl of coolers) for (let k = 0; k < 5; k++) put(cl.x + (Math.random() < 0.5 ? -1 : 1) * (dw / 2 - 0.02), rnd(0.4, 2.2), bz + 0.15, 0, rnd(0.1, 0.18));
    for (let k = 0; k < 26; k++) put(rnd(-4.6, -0.8), rnd(0.15, 0.95), fz - 0.09, Math.PI, rnd(0.12, 0.24));
    for (let k = 0; k < 18; k++) put(hw - 0.07, rnd(0.3, 1.9), sdz + rnd(-0.4, 0.4), -Math.PI / 2, rnd(0.1, 0.2));
    for (let k = 0; k < 16; k++) put(cx + 0.51, rnd(0.15, 0.95), rnd(cz0 + 0.2, cz1 - 0.2), Math.PI / 2, rnd(0.12, 0.22));
    for (let k = 0; k < 10; k++) put(hw - 0.66, rnd(0.2, 1.4), 4.6 + rnd(-0.2, 0.2), -Math.PI / 2, rnd(0.08, 0.14));
    // one panel of the left wall by the door is solid stickers
    // (the generated sticker wall photograph printed a real fare card brand, so this panel is bombed with the pack instead)
    for (let k = 0; k < 70; k++) put(-hw + 0.02 + Math.random() * 0.01, rnd(0.3, 2.4), rnd(4.5, 6.8), Math.PI / 2, rnd(0.14, 0.3));
    // ---------- paint drips: the coolers' header bleeds hot pink and violet down the glass frames, as geometry ----------
    const dripM = [new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.15, clearcoat: 1 }), new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.15, clearcoat: 1 })];
    const drip = (x, y, z, len, r, m) => { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 8), m); body.position.y = -len / 2; g.add(body); const bead = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 10, 8), m); bead.position.y = -len; bead.scale.y = 1.3; g.add(bead); g.position.set(x, y, z); c.add(g); return g; };
    for (let k = 0; k < 34; k++) drip(rnd(-4.7, 2.3), dh + 0.36, bz + 0.15, rnd(0.08, 0.75), rnd(0.008, 0.02), dripM[k % 2]);
    for (let k = 0; k < 12; k++) drip(-2.2 + rnd(-1.8, 1.8), 2.25, fz - 0.1, rnd(0.05, 0.4), rnd(0.008, 0.016), dripM[k % 2]);
    // ---------- the ceiling: tubes, a fan, a hanging banner ----------
    const tube = new THREE.MeshBasicMaterial({ color: 0xd8d4ca, toneMapped: false });
    for (const x of [-2.5, 0.5, 3.2]) for (const z of [-4.5, -0.5, 3.5]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 1.3), tube); t.position.set(x, H - 0.03, z); c.add(t); }
    c.glb('ph_ceiling_fan', { len: 1.1, x: 0.5, y: H - 0.45, z: 3.8, shadow: false });
    const banner = c.sign('NOW SERVING: NUMBER ∞', { w: 2.2, h: 0.4, bg: '#06163a', fg: '#f0f4f8', font: c.MONO, weight: 700, border: '#be854c' }); banner.position.set(0.5, 2.55, -0.2); c.add(banner);
    c.click(banner, () => c.egg('bodega_number', 'Your number is coming up. It has been coming up for some time.'), 'Take a number');
    c.light(-1, 2.8, -3, 0xfff2df, 1.6, 10); c.light(-1, 2.8, 2.5, 0xfff2df, 1.6, 10); c.light(3, 2.8, 0, 0xfff2df, 1.4, 9);
    c.light(-1, 1.4, bz + 0.8, 0x9fd8ff, 1.8, 6); c.light(-2.6, 2.0, fz - 0.6, 0xff4f7a, 1.2, 5, (t) => 0.75 + 0.25 * Math.sin(t * 3.1) * Math.sin(t * 1.7));
    // ---------- the CCTV: a second camera, and in it, you ----------
    const cctv = new THREE.PerspectiveCamera(78, 4 / 3, 0.1, 40); cctv.position.set(R.x0 + hw - 0.4, H - 0.25, -hd + 0.5); cctv.lookAt(R.x0 - 1, 0.6, 3.5); cctv.layers.enable(1);
    const ctRT = new THREE.WebGLRenderTarget(400, 300); ctRT.texture.colorSpace = THREE.SRGBColorSpace;
    const tv = new THREE.Group(); tv.position.set(cx - 0.1, 2.55, 4.3); tv.rotation.y = Math.PI * 0.62; c.add(tv);
    tv.add(c.slab(0.62, 0.48, 0.32, new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6 }), 0, 0, -0.16));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.4), new THREE.ShaderMaterial({ uniforms: { t: { value: ctRT.texture }, time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform sampler2D t; uniform float time; varying vec2 vUv; void main(){ vec2 u = vUv; u.x += sin(u.y * 300. + time * 20.) * 0.0015; vec3 c = texture2D(t, u).rgb; float l = dot(c, vec3(.3,.59,.11)); c = mix(vec3(l), c, 0.35) * vec3(0.85, 1.0, 0.9); c *= 0.85 + 0.15 * sin(u.y * 600.); gl_FragColor = vec4(c * 1.4, 1.); }', toneMapped: false }));
    screen.position.z = 0.005; tv.add(screen); screen.userData.noAnamorph = true;
    const cam = c.sign('CAM 1  REC', { w: 0.5, h: 0.06, bg: null, fg: '#ff2e63', font: c.MONO, weight: 700, px: 64 }); cam.position.set(-0.02, 0.15, 0.01); tv.add(cam);
    c.click(screen, () => c.egg('bodega_cctv', 'Smile. That is you. You have an eye flower for a head here, like everybody else.'), 'Watch the monitor');
    // you, for the camera only: layer 1
    const me = new THREE.Group(); c.add(me);
    { const hood = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.8 }), jeans = new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.85 });
      const part = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); me.add(o); return o; };
      part(new THREE.CapsuleGeometry(0.22, 0.55, 4, 12), hood, 0, 1.15, 0); part(new THREE.CapsuleGeometry(0.08, 0.7, 4, 8), jeans, -0.1, 0.42, 0); part(new THREE.CapsuleGeometry(0.08, 0.7, 4, 8), jeans, 0.1, 0.42, 0);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; c.eyeFlower(cv.getContext('2d'), 128, 128, 120); const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht })); head.scale.set(0.55, 0.55, 1); head.position.y = 1.72; me.add(head); }
    me.traverse((o) => { o.layers.set(1); o.userData.noAnamorph = true; });
    R.state.me = me;
    // ---------- the anamorphic flower ----------
    const flowerT = c.canvasTex(1024, 1024, (g) => { g.clearRect(0, 0, 1024, 1024); c.eyeFlower(g, 512, 512, 480, { look: [0.2, -0.1] }); });
    const standX = 0.5, standZ = 5.4;
    const here = c.sign('STAND HERE', { w: 0.6, h: 0.6, bg: '#ff2e63', fg: '#f0f4f8', font: c.FONT, weight: 900, border: '#f0f4f8' }); here.rotation.x = -Math.PI / 2; here.position.set(standX, 0.013, standZ); here.userData.noAnamorph = true; c.add(here);
    R.state.anaFrom = [standX, c.EYE, standZ];
    c.anamorph({ from: [standX, c.EYE, standZ], aim: [0.5, 1.45, -6.8], texture: flowerT, grid: [16, 16], size: 6.4, minD: 1.2, maxD: 13.5, onReady: (frags) => { R.state.frags = frags; } });
    // ---------- per frame ----------
    const _v = new THREE.Vector3();
    c.tick((t, dt, me2) => {
      if (!R.state.eyeOk) R.state.eyeOk = R.state.placeEye();
      // the cat turns to watch you, slowly, the way cats do
      if (cat.userData.ready) { const want = Math.atan2(me2.x - cat.position.x, me2.z - cat.position.z); let d = want - cat.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); cat.rotation.y += d * Math.min(1, dt * 0.8); }
      // the pigeon bobs her head, and coos when you come close
      if (pig.userData.ready) { pig.position.y = 1.05 + Math.max(0, Math.sin(t * 2.6)) * 0.004; const dd = Math.hypot(me2.x - pig.position.x, me2.z - pig.position.z); if (dd < 1.6 && !R.state.cooed) { R.state.cooed = true; c.sound.coo(); c.toast('She is looking at you. Look into her eye.', 3200); } if (dd > 3) R.state.cooed = false; }
      // the walk in swings open as you come near
      const near = Math.hypot(me2.x - walk.x, me2.z - (bz + 0.6)) < 2.2 ? 1 : 0;
      R.state.open = (R.state.open || 0) + (near - (R.state.open || 0)) * Math.min(1, dt * 2.5);
      leaf.rotation.y = -R.state.open * 1.7; fog.material.opacity = 0.85 * (1 - R.state.open * 0.15); into.off = R.state.open < 0.6;
      // the anamorph resolves when you stand on the sticker
      const fr = R.state.anaFrom, dA = Math.hypot(me2.x - fr[0], me2.z - fr[2]);
      if (dA < 0.35 && !R.state.anaDone) { R.state.anaDone = true; c.egg('bodega_flower', 'There. The whole shop is one eye. Take one step and it is litter again.'); }
      // CCTV: you, posed as you, drawn by the ceiling camera every third frame
      me.position.set(me2.x, 0, me2.z); me.rotation.y = c.P.yaw; me.visible = true;
      R.state.f = (R.state.f || 0) + 1;
      if (R.state.f % 3 === 0) { const r = c.renderer, prev = r.getRenderTarget(); r.setRenderTarget(ctRT); r.render(c.scene, cctv); r.setRenderTarget(prev); }
      screen.material.uniforms.time.value = t;
    });
  },
  onEnter(c) { c.R.state.me?.traverse((o) => o.layers.set(1)); c.sound.bell(); if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('The cooler doors are deeper than they look. The pigeon by the register is deeper still.', 5200), 2500); } },
};
