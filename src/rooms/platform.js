// I. THE DREAM. Room 2: THE PLATFORM OF WRONG SIZES.
// You step off the dream train onto a station that should not exist. Old New York tile, I beam columns, a mosaic
// tablet that says PIGEONHOLE, and far down the platform, under a tiled vault like the old City Hall stop, one pigeon.
//
// HEADLINE ILLUSION: camera reactive scale. The pigeon's height is recomputed every frame from your distance to it:
//   h(d) = h0 * (d0 / d) ^ p, clamped between a real pigeon (h0) and nine metres.
// d0 is the distance from where you step off the train, where it is exactly pigeon sized, so the first look is honest.
// Perspective alone makes anything grow on screen as 1/d; this pigeon also grows in the world as you come, so it swells
// far faster than the columns beside it, and by the time you reach it you are standing at the feet of a pigeon nine
// metres tall. Its feet never move. When it is full size it turns, tips its head down at you, and coos. Back away and it
// shrinks back to a pigeon. Its collider grows with it, so you can never walk into its chest.
export default {
  id: 'platform', name: 'The Platform of Wrong Sizes', scale: 'I · The dream', sound: 'platform',
  kicker: 'A station that should not exist. Everything is the right size except the pigeon, which is the right size from where you are standing.',
  sky: 0x03050e, fog: 0x0a0f22, fogD: 0.012, hemi: [0xb8c6ff, 0x3a2a18, 0.62], env: 0.55,
  post: { dream: 0.22, bloom: 0.85, vig: 0.48, grain: 0.12 },
  spawn: [0.6, 4, 0],
  build(c) {
    const { THREE, R } = c;
    const S = R.state;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
    // the plan, in metres. x: back wall -4.5, platform edge 2.0, track centre 3.8, far wall 6.5. z: +12 to -44.
    const WX = -4.5, EX = 2.0, TX = 3.8, FX2 = 6.5, Z0 = 12, Z1 = -44, HZ = -18, LOW = 4.2;
    const tileM = c.surf('tile', 2.0, { tint: 0xf3efe6 });
    // the Guastavino vault: terra cotta tile laid in a basket weave, drawn here, with a bump from the same canvas
    const gvT = c.canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#5a3a26'; g.fillRect(0, 0, w, h); const U = 32, cols = ['#c98b5a', '#d49a68', '#bf7f4f', '#dca877', '#b9764a', '#e0b081'];
      for (let by = 0; by < h; by += U * 2) for (let bx = 0; bx < w; bx += U * 2) {
        const hor = ((bx + by) / (U * 2)) % 2 === 0;
        for (let k = 0; k < 2; k++) { g.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          if (hor) g.fillRect(bx + 2, by + k * U + 2, U * 2 - 4, U - 4); else g.fillRect(bx + k * U + 2, by + 2, U - 4, U * 2 - 4); }
      }
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(40,20,10,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    });
    gvT.wrapS = gvT.wrapT = THREE.RepeatWrapping;
    const tileWarm = new THREE.MeshStandardMaterial({ map: gvT, bumpMap: gvT, bumpScale: 1.2, roughness: 0.42, metalness: 0 });
    tileWarm.userData.rep = 1.0;
    const floorM = c.surf('subway_floor', 2.2);
    const ceilM = c.surf('ceiling', 2.5, { tint: 0x9aa4b8 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x1f3a4a, metalness: 0.6, roughness: 0.55 });
    const steelLite = new THREE.MeshStandardMaterial({ color: 0xb9c0c8, metalness: 0.9, roughness: 0.3 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.9 });
    const concrete = new THREE.MeshStandardMaterial({ color: 0x3a3b40, roughness: 0.95 });

    // ---------- floor, walls, ceiling ----------
    c.box(EX - WX, 0.1, Z0 - Z1, floorM, (WX + EX) / 2, -0.05, (Z0 + Z1) / 2, { collide: false });
    // the yellow tactile strip: domes drawn in, with a soft shade so they read as bumps
    const tactT = c.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#f2c21b'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const cx = 16 + x * 32 + (y % 2) * 16, cy = 16 + y * 32;
        const gr = g.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, 11); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.6, '#f0bf10'); gr.addColorStop(1, '#a87c00');
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 10, 0, 7); g.fill(); }
    });
    tactT.wrapS = tactT.wrapT = THREE.RepeatWrapping; tactT.repeat.set(2, (Z0 - Z1) / 0.3);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.6, Z0 - Z1), new THREE.MeshStandardMaterial({ map: tactT, roughness: 0.55 }));
    strip.rotation.x = -Math.PI / 2; strip.position.set(EX - 0.3, 0.004, (Z0 + Z1) / 2); c.add(strip);
    // the granite lip of the platform
    c.box(0.18, 0.12, Z0 - Z1, new THREE.MeshStandardMaterial({ color: 0xc9c4b8, roughness: 0.7 }), EX - 0.09, -0.04, (Z0 + Z1) / 2, { collide: false });
    c.wall(EX - 0.05, Z0, EX - 0.05, Z1);
    // painted on the floor along the edge, the way the real ones fade
    const edgeTxt = c.sign('STAND BEHIND THE YELLOW LINE.  PIGEONS ARE LARGER THAN THEY APPEAR.', { w: 7, h: 0.32, bg: null, fg: '#f0f4f8', font: c.FONT, px: 64 });
    edgeTxt.rotation.x = -Math.PI / 2; edgeTxt.rotation.z = Math.PI / 2; edgeTxt.position.set(EX - 0.85, 0.006, -1); edgeTxt.material.opacity = 0.55; c.add(edgeTxt);
    // gum. every New York platform floor is a star map of it
    { const gm = new THREE.InstancedMesh(new THREE.CircleGeometry(0.03, 8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.6 }), 260);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < 260; i++) { const s = rnd(0.5, 1.6); m4.makeScale(s, 1, s * rnd(0.7, 1.2)).setPosition(rnd(WX + 0.3, EX - 0.7), 0.003, rnd(Z1 + 1, Z0 - 1)); gm.setMatrixAt(i, m4); }
      c.add(gm); }

    // back wall: tile to the low ceiling, and in the hall to the spring of the vault; a hole for the bodega
    const BZ = -14, BW = 2.6, BH = 2.7, BD = 2.2;
    const wallRun = (z0, z1, h, m) => c.box(0.2, h, Math.abs(z0 - z1), m, WX - 0.1, h / 2, (z0 + z1) / 2, { collide: false });
    wallRun(Z0, BZ + BW / 2, LOW, tileM); wallRun(BZ - BW / 2, HZ, LOW, tileM);
    c.box(0.2, LOW - BH, BW, tileM, WX - 0.1, BH + (LOW - BH) / 2, BZ, { collide: false });
    wallRun(HZ, Z1, 5.5, tileM);
    c.wall(WX, Z0, WX, BZ + BW / 2); c.wall(WX, BZ - BW / 2, WX, Z1);
    // a band of cobalt tile at shoulder height, the trim line every old station has
    const trimM = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.35, metalness: 0.05 });
    for (const [a, b] of [[Z0, BZ + BW / 2], [BZ - BW / 2, Z1]]) { c.add(c.slab(0.03, 0.1, Math.abs(a - b), trimM, WX + 0.015, 2.12, (a + b) / 2)); c.add(c.slab(0.03, 0.05, Math.abs(a - b), trimM, WX + 0.015, 0.32, (a + b) / 2)); }
    // the far wall behind the tracks
    c.box(0.2, LOW + 1.3, HZ - Z0 === 0 ? 1 : Z0 - HZ, tileM, FX2 + 0.1, (LOW - 1.3) / 2, (Z0 + HZ) / 2, { collide: false });
    c.box(0.2, 6.8, HZ - Z1, tileM, FX2 + 0.1, (5.5 - 1.3) / 2, (HZ + Z1) / 2, { collide: false });
    // the ends
    c.box(FX2 - WX, LOW + 1.3, 0.2, tileM, (WX + FX2) / 2, (LOW - 1.3) / 2, Z0 + 0.1, { collide: false }); c.wall(WX, Z0, EX, Z0);
    // far end: a wall with the tunnel mouth over the track
    const TW0 = EX, TW1 = FX2, TH = 3.6;
    c.box(TW0 - WX, 11.2, 0.3, tileWarm, (WX + TW0) / 2, 5.6, Z1 - 0.15, { collide: false });
    c.box(0.3, 11.2, 0.3, tileWarm, FX2 + 0.15, 5.6, Z1 - 0.15, { collide: false });
    c.box(TW1 - TW0, 11.2 - TH, 0.3, tileWarm, (TW0 + TW1) / 2, TH + (11.2 - TH) / 2, Z1 - 0.15, { collide: false });
    c.wall(WX, Z1, EX, Z1);
    // the low ceiling with its girders and fluorescent runs
    c.box(FX2 - WX, 0.12, Z0 - HZ, ceilM, (WX + FX2) / 2, LOW + 0.06, (Z0 + HZ) / 2, { collide: false });
    c.box(FX2 - WX, 7, 0.3, tileWarm, (WX + FX2) / 2, LOW + 3.5, HZ, { collide: false });
    const tube = new THREE.MeshBasicMaterial({ color: 0xeef4ff, toneMapped: false });
    { const geos = [];
      for (let z = Z0 - 1.5; z > HZ; z -= 4.5) { geos.push(new THREE.BoxGeometry(FX2 - WX, 0.22, 0.16).translate((WX + FX2) / 2, LOW - 0.11, z)); }
      c.add(new THREE.Mesh(c.merge(geos), steel));
      const tg = []; for (let z = Z0 - 3.5; z > HZ + 1; z -= 4.5) for (const x of [-2.4, 0.2]) tg.push(new THREE.BoxGeometry(0.1, 0.05, 1.8).translate(x, LOW - 0.05, z));
      c.add(new THREE.Mesh(c.merge(tg), tube)); }

    // ---------- the hall: a barrel vault, tiled, with a skylight and two brass chandeliers ----------
    const VR = (FX2 - WX) / 2, VX = (WX + FX2) / 2, VY = 5.5, VL = HZ - Z1;
    { const g = new THREE.CylinderGeometry(VR, VR, VL, 40, 1, true, -Math.PI / 2, Math.PI);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * VR / 1.0, uv.getY(i) * VL / 1.0);
      g.rotateX(-Math.PI / 2); const v = new THREE.Mesh(g, tileWarm); tileWarm.side = THREE.DoubleSide;
      v.position.set(VX, VY, (HZ + Z1) / 2); c.add(v);
      // ribs of the vault, in a darker glaze, and the skylight along the crown
      const ribM = new THREE.MeshStandardMaterial({ color: 0x6b3e22, roughness: 0.4 });
      for (let z = HZ - 2; z > Z1 + 1; z -= 4.3) { const rib = new THREE.Mesh(new THREE.TorusGeometry(VR - 0.06, 0.08, 6, 40, Math.PI), ribM); rib.position.set(VX, VY, z); c.add(rib); }
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.4, VL - 2), new THREE.MeshBasicMaterial({ color: 0x9fc4ff, toneMapped: false, fog: false }));
      sky.rotation.x = Math.PI / 2; sky.position.set(VX, VY + VR - 0.05, (HZ + Z1) / 2); c.add(sky);
      for (const z of [-23, -40]) c.glb('ph_Chandelier_02', { h: 1.6, x: VX - 1.5, y: 8.4, z }); }

    // ---------- the track bed, the rails, the third rail, the puddles ----------
    const bedY = -1.25;
    const gravelT = c.canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#26231f'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = 20 + Math.random() * 70; g.fillStyle = `rgb(${v},${v * 0.95},${v * 0.88})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3.5, 0, 7); g.fill(); } });
    gravelT.wrapS = gravelT.wrapT = THREE.RepeatWrapping; gravelT.repeat.set(2, 24);
    c.box(FX2 - EX, 0.1, Z0 - Z1, new THREE.MeshStandardMaterial({ map: gravelT, roughness: 1 }), (EX + FX2) / 2, bedY - 0.05, (Z0 + Z1) / 2, { collide: false });
    c.box(0.1, -bedY, Z0 - Z1, concrete, EX - 0.05, bedY / 2, (Z0 + Z1) / 2, { collide: false });
    { const n = Math.floor((Z0 - Z1) / 0.62), ties = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.14, 0.22), new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.95 }), n), m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { m4.makeRotationY(rnd(-0.03, 0.03)).setPosition(TX, bedY + 0.07, Z0 - 0.3 - i * 0.62); ties.setMatrixAt(i, m4); } c.add(ties);
      const rg = []; for (const dx of [-0.72, 0.72]) rg.push(new THREE.BoxGeometry(0.07, 0.15, Z0 - Z1).translate(TX + dx, bedY + 0.21, (Z0 + Z1) / 2));
      rg.push(new THREE.BoxGeometry(0.08, 0.12, Z0 - Z1).translate(TX + 1.55, bedY + 0.3, (Z0 + Z1) / 2));
      c.add(new THREE.Mesh(c.merge(rg), steelLite));
      // the third rail's wooden cover board
      c.add(c.slab(0.5, 0.04, Z0 - Z1, new THREE.MeshStandardMaterial({ color: 0x8a6a3c, roughness: 0.9 }), TX + 1.55, bedY + 0.45, (Z0 + Z1) / 2));
      const pud = new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 1, roughness: 0.08 });
      for (const [x, z, s] of [[3.3, -12, 1.4], [4.6, -21, 1.1], [3.6, -33, 1.8], [5.2, -8, 0.9]]) { const p = new THREE.Mesh(new THREE.CircleGeometry(s * 0.5, 20).rotateX(-Math.PI / 2), pud); p.scale.z = 1.8; p.position.set(x, bedY + 0.16, z); c.add(p); } }
    // a rat, on the tracks, with a slice it found
    const rat = c.glb('rat', { h: 0.14, x: 2.6, y: bedY + 0.15, z: -15, ry: -0.6 });
    const slice = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 3).rotateX(Math.PI / 2).rotateY(0.3), new THREE.MeshStandardMaterial({ color: 0xe8b24a, roughness: 0.7 })); slice.scale.y = 0.15; slice.position.set(2.75, bedY + 0.16, -15.15); c.add(slice);
    c.click(rat, () => { c.say(rat, 'squeak. it is mine.'); c.egg('platform_rat', 'The rat has been waiting for the 3:33 since 1999. It is not getting on. It is getting off.'); }, 'Somebody with a slice');
    c.glb('ph_street_rat', { h: 0.1, x: 5.6, y: bedY + 0.1, z: -27, ry: 2 });

    // ---------- the tunnel: a depth plate at the end of the tracks, with a giant pigeon far down it ----------
    c.plate('p_tunnel', { x: (TW0 + TW1) / 2, y: 0, z: -36, zMin: 8.2, far: 80 });
    const signalG = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0x20ff8a, toneMapped: false })); signalG.position.set(TW0 + 0.25, 2.4, Z1 + 0.05); c.add(signalG);
    const signalR = signalG.clone(); signalR.material = new THREE.MeshBasicMaterial({ color: 0xff2e2e, toneMapped: false }); signalR.position.y = 2.6; c.add(signalR);

    // ---------- the train we came on, parked along the edge, one door open ----------
    const TRZ = 2.82, DOORZ = 4, TSIDE = 2.13;
    const train = c.glb('h_subway_car', { h: 3.75, x: TX, y: -0.81, z: TRZ, ry: 0, onload: (g) => { const s = g.userData.size; S.trainSize = [s.x, s.y, s.z]; } });
    // the open door is a live portal straight into the car you just left
    { const src = new THREE.Object3D(); src.position.set(TSIDE, c.EYE, DOORZ); src.rotation.y = -Math.PI / 2; c.add(src);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.95)); mesh.position.set(TSIDE, 0.975, DOORZ); mesh.rotation.y = -Math.PI / 2; c.add(mesh);
      c.portal({ mesh, src, to: 'car', at: [1.3, c.EYE, -7.35, Math.PI / 2], k: 1, ride: false, res: 0.5, maxDist: 22, clip: 0.05 });
      const doorM = new THREE.MeshStandardMaterial({ color: 0xa9b0b8, metalness: 0.85, roughness: 0.35 });
      for (const k of [-1, 1]) c.add(c.slab(0.05, 1.95, 0.66, doorM, TSIDE - 0.03, 0.975, DOORZ + k * 0.98));
      for (const [w, h, z, y] of [[0.08, 2.05, DOORZ - 0.69, 1.0], [0.08, 2.05, DOORZ + 0.69, 1.0], [1.46, 0.08, DOORZ, 2.0]]) c.add(c.slab(0.08, h, w, steelLite, TSIDE - 0.03, y, z));
      const sill = c.slab(TSIDE - EX + 0.05, 0.04, 1.3, steelLite, (TSIDE + EX) / 2, 0.0, DOORZ); c.add(sill);
      const dsign = c.sign('BACK TO\nTHE DREAM', { w: 0.6, h: 0.26, bg: '#02040c', fg: '#ffb020', font: c.MONO, glow: 8, px: 96 }); dsign.position.set(TSIDE - 0.08, 2.25, DOORZ); dsign.rotation.y = -Math.PI / 2; c.add(dsign); }
    c.door({ x: EX - 0.42, z: DOORZ, r: 0.34, to: 'car', at: [0.5, -7.35, Math.PI / 2] });

    // ---------- I beam columns, the old ones, riveted, stickered ----------
    const COLS = [10.5, 6.6, 1.5, -3, -7.5, -11.2, -16.5];
    { const geos = [], rivets = [];
      for (const z of COLS) {
        const x = 1.0;
        geos.push(new THREE.BoxGeometry(0.3, LOW, 0.025).translate(x, LOW / 2, z + 0.14), new THREE.BoxGeometry(0.3, LOW, 0.025).translate(x, LOW / 2, z - 0.14), new THREE.BoxGeometry(0.025, LOW, 0.28).translate(x, LOW / 2, z));
        geos.push(new THREE.BoxGeometry(0.42, 0.18, 0.42).translate(x, 0.09, z));
        for (let y = 0.4; y < LOW; y += 0.32) for (const dx of [-0.11, 0.11]) for (const dz of [0.155, -0.155]) rivets.push([x + dx, y, z + dz]);
        c.post(x, z, 0.24);
      }
      // the hall gets fatter round columns with cast capitals
      for (const z of [-21.5, -40.5]) { geos.push(new THREE.CylinderGeometry(0.22, 0.26, 5.5, 14).translate(1.0, 2.75, z), new THREE.CylinderGeometry(0.42, 0.22, 0.5, 14).translate(1.0, 5.3, z), new THREE.BoxGeometry(0.6, 0.2, 0.6).translate(1.0, 0.1, z)); c.post(1.0, z, 0.28); }
      const colM = new THREE.MeshStandardMaterial({ color: 0x23455c, metalness: 0.5, roughness: 0.5 });
      c.add(new THREE.Mesh(c.merge(geos), colM));
      const rv = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 5, 4), colM, rivets.length), m4 = new THREE.Matrix4();
      rivets.forEach((p, i) => { m4.makeTranslation(p[0], p[1], p[2]); rv.setMatrixAt(i, m4); }); c.add(rv);
      // the fire department's paint on the column bases
      const band = new THREE.MeshStandardMaterial({ color: 0xf6f2e8, roughness: 0.6 });
      const bg = COLS.map((z) => new THREE.BoxGeometry(0.31, 0.5, 0.31).translate(1.0, 0.43, z)); c.add(new THREE.Mesh(c.merge(bg), band)); }
    // stickers in clusters on the flanges, both faces, more the closer to the hall
    { const G = window.STICKER_GROUPS || {}, pool = [...(G.subway || []), ...(G.street || []), ...(G.eye || []).slice(0, 40)];
      let k = 0;
      for (const [ci, z] of COLS.entries()) for (const side of [1, -1]) {
        const n = 3 + ci; for (let i = 0; i < n; i++) c.sticker(pool[(k++ * 7) % pool.length], 1.0 + rnd(-0.11, 0.11), rnd(0.8, 2.3), z + side * 0.155, { ry: side > 0 ? 0 : Math.PI, size: rnd(0.08, 0.14) });
      }
      // a few on the turnstiles, the bench backs, the booth, the tunnel wall
      for (let i = 0; i < 14; i++) c.sticker(pool[(k++ * 5) % pool.length], rnd(2.3, 3.4), rnd(0.6, 2.8), Z1 + 0.02, { size: rnd(0.12, 0.22) });
      for (let i = 0; i < 10; i++) c.sticker(pool[(k++ * 3) % pool.length], WX + 0.02, rnd(0.2, 0.45), rnd(-20, 11), { ry: Math.PI / 2, size: rnd(0.1, 0.18) }); }

    // ---------- the mosaic name tablets: PIGEONHOLE, in tile, drawn tile by tile ----------
    const mosaicT = c.canvasTex(1536, 384, (g, w, h) => {
      const T = 12;
      const mk = document.createElement('canvas'); mk.width = w; mk.height = h; const q = mk.getContext('2d');
      q.fillStyle = '#000'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff'; q.font = `900 200px "Arial Black", "Helvetica Neue", Arial, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('PIGEONHOLE', w / 2, h / 2 + 8, w - 230);
      const px = q.getImageData(0, 0, w, h).data;
      g.fillStyle = '#5a5248'; g.fillRect(0, 0, w, h);
      const pal = { bg: ['#06163a', '#0b2056', '#0a1b4a', '#132a66'], tx: ['#f0f4f8', '#e8e2d4', '#f6f2e8'], b1: ['#be854c', '#a86f3a', '#c99560'], b2: ['#2962ff', '#1e4fd6'], b3: ['#ff2e63', '#d81b50'] };
      for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) {
        const edge = Math.min(x, y, w - x - T, h - y - T);
        let set = pal.bg;
        if (edge < T * 2) set = pal.b1; else if (edge < T * 3) set = ((x + y) / T) % 2 ? pal.b2 : pal.b3; else if (edge < T * 4) set = pal.b1;
        else { let cov = 0; for (let yy = 2; yy < T; yy += 4) for (let xx = 2; xx < T; xx += 4) cov += px[((y + yy) * w + x + xx) * 4]; if (cov / 9 > 100) set = pal.tx; }
        g.fillStyle = set[Math.floor(Math.random() * set.length)]; g.fillRect(x + 1, y + 1, T - 2, T - 2);
      }
      // the little eye flowers in the corners, the way old stations put a beaver or a ship
      for (const [cx, cy] of [[70, h / 2], [w - 70, h / 2]]) c.eyeFlower(g, cx, cy, 34);
    });
    const tabM = new THREE.MeshStandardMaterial({ map: mosaicT, roughness: 0.35, emissive: 0xffffff, emissiveMap: mosaicT, emissiveIntensity: 0.18 });
    const TABS = [8.3, -5.3, -24.5, -38.5];
    const dripPink = [], dripViolet = [];
    const drip = (arr, x, y, z, len, r, nx = 1) => { arr.push(new THREE.CylinderGeometry(r, r * 0.7, len, 8).translate(x, y - len / 2, z)); arr.push(new THREE.SphereGeometry(r * 1.35, 10, 8).scale(1, 1.3, 1).translate(x, y - len, z)); arr.push(new THREE.SphereGeometry(r * 1.6, 8, 6).scale(1, 0.5, 0.6).translate(x, y, z)); };
    for (const z of TABS) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), tabM); t.position.set(WX + 0.012, 2.75, z); t.rotation.y = Math.PI / 2; c.add(t);
      // paint runs off the bottom of the tablet, down the tile
      for (let i = 0; i < 9; i++) { const zz = z + rnd(-1.6, 1.6); drip(Math.random() < 0.6 ? dripPink : dripViolet, WX + 0.03, 2.33, zz, rnd(0.15, 0.85), rnd(0.012, 0.028)); }
    }
    // runs off the lip of the low ceiling into the hall, and off the bodega awning
    for (let i = 0; i < 16; i++) drip(i % 3 ? dripPink : dripViolet, rnd(-4.2, 1.8), LOW - 0.02, HZ - 0.17, rnd(0.2, 1.6), rnd(0.015, 0.035));
    const dripMP = new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.15, clearcoat: 1, emissive: 0x5a0018, emissiveIntensity: 0.35 });
    const dripMV = new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.15, clearcoat: 1, emissive: 0x200838, emissiveIntensity: 0.4 });

    // ---------- the New Yorkers: twelve in mosaic framed panels, eye height, lit ----------
    const frameT = c.canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#4a443c'; g.fillRect(0, 0, w, h); const T = 16;
      for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) { const e = Math.min(x, y, w - x - T, h - y - T); const cs = e < T ? ['#be854c', '#c99560'] : e < T * 2 ? ['#ff2e63', '#2962ff'] : e < T * 3 ? ['#f0f4f8', '#e3ddd0'] : ['#06163a', '#0b2056'];
        g.fillStyle = cs[(x / T + y / T) % cs.length | 0]; g.fillRect(x + 1.5, y + 1.5, T - 3, T - 3); }
    });
    const frameM = new THREE.MeshStandardMaterial({ map: frameT, roughness: 0.4 });
    const art = c.art(12), framed = [];
    const SPOTS = [11.0, 5.5, 3.2, 0.1, -2.4, -8.9, -11.3, -20.0, -28.2, -31.0, -33.8, -42.0];
    art.forEach((p, i) => {
      const z = SPOTS[i];
      const g = c.hang(p, WX + 0.03, 1.6, z, Math.PI / 2, 1.3, 'none', { light: true });
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), frameM); f.position.set(WX + 0.018, 1.6, z); f.rotation.y = Math.PI / 2; c.add(f);
      framed.push({ g, f });
    });
    // posters for the show, on the wall between the New Yorkers, behind grimy plexi
    const POST = [['g/g_poster_pigeon.jpg', 1.65], ['g/g_poster_bodega.jpg', -7.0], ['g/g_poster_wake.jpg', -35.6]];
    for (const [f, z] of POST) { const p = c.picture(f, 0.9, 1.35, { emissive: 0.5 }); p.position.set(WX + 0.03, 1.55, z); p.rotation.y = Math.PI / 2; c.add(p); c.add(c.slab(0.03, 1.47, 1.02, steelLite, WX + 0.01, 1.55, z)); }
    // a few more on the far wall across the tracks, where every ad in the city has been torn and replaced
    const ads = [['g/g_poster_wake.jpg', -24], ['g/g_poster_pigeon.jpg', -30], ['g/g_poster_bodega.jpg', -36]];
    for (const [f, z] of ads) { const p = c.picture(f, 1.5, 2.25, { emissive: 0.45 }); p.position.set(FX2 - 0.02, 1.7, z); p.rotation.y = -Math.PI / 2; c.add(p); }

    // ---------- signage: THE PIGEONHOLE LINE, in enamel, hung from the girders ----------
    const bullet = (g, x, y, r) => { g.fillStyle = '#ff2e63'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); c.eyeFlower(g, x, y, r * 0.78); };
    const lineSign = (txt, sub, z, w = 3.2) => {
      const t = c.canvasTex(1280, 256, (g, W, H) => { g.fillStyle = '#0d0f12'; g.fillRect(0, 0, W, H); g.fillStyle = '#f0f4f8'; g.fillRect(0, 14, W, 3);
        bullet(g, 100, H / 2 + 10, 64); g.fillStyle = '#f0f4f8'; g.font = `700 78px ${c.FONT}`; g.textBaseline = 'middle'; g.fillText(txt, 196, H / 2 - 10);
        g.font = `500 34px ${c.FONT}`; g.fillStyle = '#c8ccd6'; g.fillText(sub, 198, H / 2 + 62); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 5), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
      m.position.set(-1.6, LOW - 0.55, z); c.add(m);
      for (const dx of [-w / 2 + 0.2, w / 2 - 0.2]) c.add(c.slab(0.015, 0.4, 0.015, steel, -1.6 + dx, LOW - 0.2, z));
      return m;
    };
    lineSign('The Pigeonhole Line', 'Local. All stops. All scales. Downtown and deeper.', 2.5);
    lineSign('Wrong Sizes', 'Change here for the bodega. Mind the pigeon.', -9.5);
    const bodSign = c.sign('BODEGA  ·  ON THIS WALL  ·  OPEN ALL NIGHT', { w: 2.6, h: 0.3, bg: '#0d0f12', fg: '#f0f4f8', font: c.FONT, px: 96 }); bodSign.position.set(WX + 0.03, 3.45, -9.9); bodSign.rotation.y = Math.PI / 2; c.add(bodSign);
    // the countdown clock, which counts something
    const cdT = c.sign('THE PIGEONHOLE LINE   NEXT TRAIN   WHEN YOU WAKE UP', { w: 3.4, h: 0.22, bg: '#050505', fg: '#ff9a1a', font: c.MONO, glow: 10, px: 80 });
    cdT.position.set(0.0, LOW - 0.3, -13.4); c.add(cdT); const cdB = cdT.clone(); cdB.rotation.y = Math.PI; c.add(cdB);
    const clk = c.sign('3:33', { w: 0.7, h: 0.26, bg: '#050505', fg: '#ff2e63', font: c.MONO, glow: 12, px: 96 }); clk.position.set(0, LOW - 0.6, -13.4); c.add(clk);

    // ---------- the token booth, its attendant (an eye flower head that watches you), the turnstiles ----------
    const BX = -1.3, BZZ = 9.6;
    { const boothM = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.6 }), glassM = new THREE.MeshPhysicalMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0, depthWrite: false });
      c.box(1.9, 1.0, 2.2, boothM, BX, 0.5, BZZ);
      c.box(1.9, 0.12, 2.2, steelLite, BX, 2.45, BZZ, { collide: false });
      c.add(c.slab(1.95, 0.25, 2.25, boothM, BX, 2.62, BZZ));
      for (const [w, d, x, z] of [[1.9, 0.02, BX, BZZ + 1.1], [1.9, 0.02, BX, BZZ - 1.1], [0.02, 2.2, BX + 0.95, BZZ], [0.02, 2.2, BX - 0.95, BZZ]]) { const gl = c.slab(w, 1.4, d, glassM, x, 1.7, z); c.add(gl); }
      for (const [x, z] of [[BX + 0.95, BZZ + 1.1], [BX - 0.95, BZZ + 1.1], [BX + 0.95, BZZ - 1.1], [BX - 0.95, BZZ - 1.1]]) c.add(c.slab(0.06, 1.45, 0.06, steelLite, x, 1.72, z));
      const tb = c.sign('TOKENS', { w: 1.2, h: 0.22, bg: '#06163a', fg: '#f6c21a', font: c.FONT, px: 96 }); tb.position.set(BX, 2.62, BZZ + 1.135); c.add(tb);
      const tb2 = c.sign('NO TOKENS SINCE 2003.  DREAMS ACCEPTED.', { w: 1.6, h: 0.16, bg: '#f0f4f8', fg: '#06163a', font: c.MONO, px: 64 }); tb2.position.set(BX + 0.97, 1.15, BZZ); tb2.rotation.y = Math.PI / 2; c.add(tb2);
      const tray = c.slab(0.3, 0.04, 0.4, steelLite, BX + 1.05, 1.02, BZZ); c.add(tray); }
    const att = new THREE.Group(); att.position.set(BX - 0.2, 0, BZZ); c.add(att);
    const attCv = document.createElement('canvas'); attCv.width = attCv.height = 256; const attT = new THREE.CanvasTexture(attCv); attT.colorSpace = THREE.SRGBColorSpace;
    { const coat = new THREE.MeshStandardMaterial({ color: 0x1d2a44, roughness: 0.8 }), vest = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 4, 10), coat); body.position.y = 1.25; att.add(body);
      const v2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.245, 0.3, 4, 10), vest); v2.position.y = 1.3; v2.scale.set(1, 1, 0.95); att.add(v2);
      for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.36, 4, 8), coat); arm.position.set(0.18, 1.18, s * 0.26); arm.rotation.z = -1.1; att.add(arm); }
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: attT, transparent: true })); head.scale.set(0.62, 0.62, 1); head.position.y = 1.95; att.add(head); att.userData.head = head;
      c.glb('ph_metal_stool_01', { h: 0.75, x: BX - 0.2, z: BZZ }); c.glb('ph_vintage_radio_transceiver', { h: 0.18, x: BX + 0.55, y: 1.0, z: BZZ - 0.6, ry: Math.PI / 2 }); }
    c.click(att, () => { c.say(att.userData.head, pickOf(['One fare, please. You paid it falling asleep.', 'Lost and found is inside the pigeon.', 'I have been watching you since the train. It is my job.'])); c.egg('platform_attendant', 'The attendant has worked this booth since the station did not exist. Lost property is kept inside the pigeon.'); }, 'Ask the attendant');
    // turnstiles: old cast ones, three arms, between the booth and the wall
    const tsArms = [];
    for (const x of [-4.0, -3.05]) {
      const body = c.box(0.26, 0.95, 0.7, steelLite, x, 0.475, BZZ, { collide: false }); c.post(x, BZZ - 0.25, 0.14); c.post(x, BZZ + 0.25, 0.14);
      const hub = new THREE.Group(); hub.position.set(x + 0.18, 0.92, BZZ); c.add(hub);
      for (let k = 0; k < 3; k++) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8), steelLite); a.position.set(0.22, 0, 0); const arm = new THREE.Group(); arm.add(a); a.rotation.z = Math.PI / 2; arm.rotation.x = k * Math.PI * 2 / 3; arm.rotation.z = -0.5; hub.add(arm); }
      tsArms.push(hub);
      const slot = c.sign('SWIPE', { w: 0.2, h: 0.06, bg: '#0d0f12', fg: '#2bff88', font: c.MONO, glow: 6, px: 48 }); slot.position.set(x, 0.96, BZZ + 0.36); c.add(slot);
      c.click(body, () => { hub.userData.spin = (hub.userData.spin || 0) + 1; c.say(hub, pickOf(['SWIPE AGAIN AT THIS TURNSTILE', 'INSUFFICIENT FARE', 'JUST USED', 'SWIPE AGAIN AT THIS TURNSTILE'])); c.egg('platform_turnstile', 'Swipe again at this turnstile. Swipe again at this turnstile. You are dreaming, and it still says it.'); }, 'Swipe');
    }

    // ---------- the bodega, cut into the tile wall: awning, warm light, an open door ----------
    { const bx = WX - BD / 2;
      c.box(BD, 0.1, BW, c.surf('bodega_floor', 1.2), bx, -0.05, BZ, { collide: false });
      c.box(BD, 0.1, BW, ceilM, bx, BH + 0.05, BZ, { collide: false });
      c.wall(WX, BZ + BW / 2, WX - BD, BZ + BW / 2); c.wall(WX, BZ - BW / 2, WX - BD, BZ - BW / 2); c.wall(WX - BD, BZ - BW / 2, WX - BD, BZ + BW / 2);
      const back = c.picture('g/g_shelf_snacks.jpg', BW, BH, { emissive: 0.55 }); back.position.set(WX - BD + 0.02, BH / 2, BZ); back.rotation.y = Math.PI / 2; c.add(back);
      for (const s of [-1, 1]) { const side = c.picture('g/g_shelf_cans.jpg', BD, BH, { emissive: 0.5 }); side.position.set(bx, BH / 2, BZ + s * (BW / 2 - 0.02)); side.rotation.y = s > 0 ? Math.PI : 0; c.add(side); }
      // the door frame and the open door, swung in
      const frameM2 = new THREE.MeshStandardMaterial({ color: 0x8c9196, metalness: 0.9, roughness: 0.35 });
      for (const s of [-1, 1]) c.add(c.slab(0.12, BH, 0.08, frameM2, WX - 0.04, BH / 2, BZ + s * (BW / 2 - 0.04)));
      const leaf = new THREE.Group(); leaf.position.set(WX - 0.06, 0, BZ - 0.6); leaf.rotation.y = -1.25; c.add(leaf);
      leaf.add(c.slab(0.05, 2.3, 1.15, frameM2, 0, 1.15, 0.58));
      const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.9), new THREE.MeshPhysicalMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.25, roughness: 0.05 })); lg.position.set(0.03, 1.2, 0.58); lg.rotation.y = Math.PI / 2; leaf.add(lg);
      const open = c.sign('OPEN', { w: 0.5, h: 0.2, bg: null, fg: '#ff2e63', font: c.FONT, glow: 18, px: 96 }); open.position.set(0.04, 1.75, 0.58); open.rotation.y = Math.PI / 2; leaf.add(open);
      // the awning graphic above, a real canopy depth, and the warm light spilling out onto the platform tile
      const aw = c.picture('g/g_awning.jpg', BW + 0.9, 0.85, { emissive: 0.6 }); aw.position.set(WX + 0.55, BH + 0.62, BZ); aw.rotation.y = Math.PI / 2; aw.rotation.x = 0; c.add(aw);
      aw.rotation.order = 'YXZ'; aw.rotation.x = -0.45;
      c.add(c.slab(0.75, 0.04, BW + 0.9, new THREE.MeshStandardMaterial({ color: 0x1a7a3a, roughness: 0.7 }), WX + 0.37, BH + 0.98, BZ));
      for (let i = 0; i < 7; i++) drip(i % 2 ? dripPink : dripViolet, WX + 0.72, BH + 0.25, BZ + rnd(-1.6, 1.6), rnd(0.1, 0.55), rnd(0.012, 0.022));
      const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: c.canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(0, 128, 0, 0, 128, 250); gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      spill.position.set(WX + 1.7, 0.008, BZ); spill.renderOrder = 1; c.add(spill);
      const neon = c.sign('COLD BEER  ·  HOT EGGS  ·  NO PIGEONS', { w: 1.9, h: 0.16, bg: null, fg: '#00e5ff', font: c.FONT, glow: 16, px: 80 }); neon.position.set(WX - BD + 0.05, 2.35, BZ); neon.rotation.y = Math.PI / 2; c.add(neon);
      c.glb('ph_plastic_crate_01', { h: 0.3, x: WX - 0.5, z: BZ + 1.0, ry: 0.3 }); c.glb('ph_cardboard_box_01', { h: 0.35, x: WX - 1.6, z: BZ - 0.9, ry: 0.8 });
      c.glb('cat', { h: 0.28, x: WX - 1.5, y: 0, z: BZ + 0.75, ry: Math.PI / 2 + 0.4 });
      c.door({ x: WX - 1.3, z: BZ, r: 0.5, fn: () => c.go('bodega') }); }

    // ---------- benches, a trash can, things left on a platform ----------
    for (const z of [7.0, -1.9, -25, -38]) c.glb('bench', { len: 1.9, x: -0.4, z, ry: Math.PI / 2 }), c.post(-0.4, z - 0.5, 0.35), c.post(-0.4, z + 0.5, 0.35);
    c.glb('boombox', { h: 0.28, x: -0.35, y: 0.47, z: -1.5, ry: Math.PI / 2 + 0.3 });
    for (const [x, z] of [[1.0, -5.2], [-1.0, 12 - 1.4], [-0.6, -17.0]]) { c.glb('ph_metal_trash_can', { h: 0.85, x, z }); c.post(x, z, 0.28); }
    c.glb('ph_trashbag', { h: 0.55, x: 0.35, z: -5.9, ry: 1 });
    c.glb('ph_WetFloorSign_01', { h: 0.65, x: -2.6, z: -16.2, ry: 0.4 });
    c.glb('ph_korean_fire_extinguisher_01', { h: 0.5, x: WX + 0.15, y: 0.9, z: -16.9, ry: Math.PI / 2 });
    c.glb('ph_fire_alarm', { h: 0.2, x: WX + 0.05, y: 1.5, z: -17.4, ry: Math.PI / 2 });
    c.glb('ph_industrial_wall_sconce', { h: 0.3, x: WX + 0.12, y: 3.2, z: -30.5, ry: Math.PI / 2 });
    c.glb('ph_industrial_wall_sconce', { h: 0.3, x: WX + 0.12, y: 3.2, z: -45 + 9.3, ry: Math.PI / 2 });
    c.glb('ph_cardboard_box_01', { h: 0.4, x: -3.7, z: -37.4, ry: 0.4 });
    c.glb('popcorn', { h: 0.22, x: -0.2, y: 0.47, z: -24.4, ry: 1.2 });
    // a newspaper, a MetroCard, a coffee cup, the small archaeology of every platform
    const paper = c.canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = `800 34px ${c.SERIF}`; g.fillText('THE DAILY COO', 14, 44); g.font = `700 22px ${c.FONT}`; g.fillText('PIGEON SEEN AT', 14, 90); g.fillText('ACTUAL SIZE', 14, 116); g.fillStyle = '#777'; for (let y = 140; y < h - 10; y += 10) g.fillRect(14, y, w - 28 - (y % 30), 4); });
    { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: paper, roughness: 0.9 })); p.position.set(-2.2, 0.006, -20.5); p.rotation.y = 0.5; c.add(p); }
    { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.11, 14), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#f0f4f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2962ff'; g.font = `700 22px ${c.SERIF}`; g.fillText('WE ARE HAPPY TO SEE YOU', 4, 40); }), roughness: 0.6 })); cup.position.set(-0.9, 0.055, 6.2); c.add(cup); }
    { const mc = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.054).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf6c21a, roughness: 0.5 })); mc.position.set(0.3, 0.005, -9.8); mc.rotation.y = 0.8; c.add(mc); }

    // ---------- THE PIGEON ----------
    const PX = 0.5, PZ = -31.5, H0 = 0.34, HMAX = 9;
    const D0 = Math.hypot(R.spawn[0] - PX, R.spawn[1] - PZ);
    const DMIN = 0.32 * HMAX + 0.32;
    const PEXP = Math.log(HMAX / H0) / Math.log(D0 / DMIN);
    const pig = c.glb('pigeon', { h: 1, x: PX, z: PZ });
    const pigCol = c.post(PX, PZ, 0.12);
    S.h = H0; S.big = false;
    c.click(pig, () => {
      if (S.h > 6) { c.sound.coo(0.45); c.shake(0.04); c.egg('platform_giant', 'Every pigeon in New York is this size. You are usually farther away.'); }
      else { c.sound.coo(1); c.say(pig, 'coo'); }
    }, 'A pigeon');
    const label = c.sign('Rock Dove (Columba livia).  Life size, from where you were standing.\nGift of the 3:33 local.', { w: 2.4, h: 0.32, bg: '#f2ead8', fg: '#1b1b1b', font: c.MONO, weight: 600, px: 80 });
    label.position.set(PX - 1.7, 1.0, PZ + 3.4); label.rotation.y = 0.35; c.add(label);
    c.add(c.slab(0.05, 1.0, 0.05, steelLite, PX - 1.7, 0.5, PZ + 3.38));
    // a ring of light on the floor where it stands, like a museum plinth that forgot to be built
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false }));
    ring.position.set(PX, 0.01, PZ); c.add(ring);
    // and a shaft of light down from the skylight, so from the train door the eye finds it at once
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.3, 10.4, 24, 1, true), new THREE.MeshBasicMaterial({ map: c.canvasTex(16, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.25, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,.9)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), color: 0x9fd8ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.set(PX, 5.2, PZ); c.add(beam);

    // ---------- lights: six, placed where they do the most ----------
    c.light(0.2, 3.7, 6, 0xe6eeff, 2.2, 13);
    c.light(-1.5, 3.7, -6.5, 0xe6eeff, 2.0, 12);
    c.light(WX - 1.0, 2.2, BZ, 0xffb46a, 3.2, 7, (t) => 0.92 + 0.08 * Math.sin(t * 13) * Math.sin(t * 3.1));
    c.light(VX - 1, 8.4, -24, 0xffd29a, 3.0, 22);
    c.light(PX + 1.5, 6.5, PZ + 4, 0xcfe0ff, 3.0, 20);
    c.light(TX, 1.2, Z1 + 2, 0x2bff88, 1.4, 10, (t) => (Math.sin(t * 0.7) > 0.9 ? 0.2 : 1));

    // ---------- merge the drips last, one mesh per colour ----------
    c.add(new THREE.Mesh(c.merge(dripPink), dripMP)); c.add(new THREE.Mesh(c.merge(dripViolet), dripMV));

    // ---------- every frame ----------
    let lastLook = -1;
    c.tick((t, dt, me) => {
      // the mosaic frames follow each painting's aspect once its image is in
      for (const F of framed) { const a = F.g.userData.art; if (a && F.f.userData.h !== a.scale.y) { F.f.userData.h = a.scale.y; F.f.scale.set(a.scale.x + 0.34, a.scale.y + 0.34, 1); } }
      // camera reactive scale (see the top of the file)
      const d = Math.max(0.5, Math.hypot(me.x - PX, me.z - PZ));
      const h = Math.min(HMAX, Math.max(H0, H0 * Math.pow(D0 / d, PEXP)));
      S.h += (h - S.h) * Math.min(1, dt * 8);
      if (pig.userData.ready) {
        pig.scale.setScalar(S.h);
        const u = Math.min(1, Math.max(0, (S.h - 1) / 3)), tip = Math.min(1, Math.max(0, (S.h - 4) / (HMAX - 4)));
        // small, it pecks and potters; huge, it turns to you and tips its head down
        const face = Math.atan2(me.x - PX, me.z - PZ);
        const idle = Math.sin(t * 0.6) * 0.9;
        let dy = face - idle; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        pig.rotation.y = idle + dy * u;
        pig.rotation.x = tip * 0.2 + (1 - u) * Math.max(0, Math.sin(t * 3.1)) * 0.25;
        pig.position.y = (1 - u) * Math.abs(Math.sin(t * 6)) * 0.01;
      }
      pigCol.r = Math.max(0.12, 0.32 * S.h);
      ring.scale.setScalar(Math.max(0.35, S.h * 0.42)); ring.material.opacity = 0.45 + 0.1 * Math.sin(t * 2);
      if (S.h > 8.4 && !S.big) { S.big = true; c.sound.coo(0.42); c.say(pig, 'coo', 2600, 9.6); c.shake(0.03); }
      if (S.h < 6 && S.big) S.big = false;
      // the attendant watches you. its whole head is the eye
      const ax = me.x - att.position.x, az = me.z - att.position.z, look = [Math.max(-1, Math.min(1, -az / 4)), Math.max(-1, Math.min(1, -0.3))];
      const blink = (t % 5.3) < 0.14 ? 0.95 : 0;
      const key = Math.round(look[0] * 10) + ':' + blink;
      if (key !== lastLook) { lastLook = key; const g = attCv.getContext('2d'); g.clearRect(0, 0, 256, 256); c.eyeFlower(g, 128, 128, 120, { look, lid: blink }); attT.needsUpdate = true; }
      // turnstile arms spin when clicked, the signal blinks, the clock is always 3:33
      for (const hub of tsArms) if (hub.userData.spin) { hub.rotation.x -= dt * 4; if (hub.rotation.x < -hub.userData.spin * Math.PI * 2 / 3) { hub.userData.spin = 0; hub.rotation.x = 0; } }
      signalG.visible = Math.sin(t * 0.7) <= 0.9; signalR.visible = !signalG.visible;
    });
  },
  onEnter(c) { if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('There is a pigeon at the far end of the platform. Go and look at it.', 4200), 2600); } },
};
