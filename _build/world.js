/* ================================================================
   [SHELL]  THE BASEMENT. Eight zones in visitor order (Astra's brief, 2026-10-08):
   stairs, TV den, card room, boiler and laundry, the infinite hallway, the everything bagel, the Rat King's court, mom's second freezer.
   ================================================================ */
const W = { den: null, bedroom: null, crt: null, lava: null, mirror: null, sofa: null, table: null, dryer: null, pc: null, penrose: [], seeds: null, rats: [], king: null, cat: null, freezer: null, well: null, door: null, bagel: null, cream: null, wave: null, nyan: null, corkboard: [] };
const PLATES = { well: tex('assets/plate_well.webp'), room: tex('assets/plate_room.webp'), stairs: tex('assets/plate_stairs.webp') };
Object.values(PLATES).forEach(t => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; });
const AT = {}; SCULPTS.forEach(s => AT[s.key] = s);
function trophy(key, x, y, z, ry, size, o = {}) { const s = AT[key] || { label: Q(key.toUpperCase()), sub: 'MEME MUSEUM · CLASSIC', mode: 'h' }; return model(key, x, y, z, ry, size, Object.assign({ sculpt: true, label: s.label, sub: s.sub, mode: s.mode || 'h' }, o)); }
function prop(key, x, y, z, ry, size, o = {}) { const p = PROPS.find(q => q.key === key); return model(key, x, y, z, ry, size, Object.assign({ label: p ? p.label : key }, o)); }

/* --- 1. THE STAIRS: compression. 2.05 m over the flight, 2.2 m on the landing. The upstairs never gets closer. --- */
(function stairs() {
  // landing alcove off the den's south wall, then the flight climbing south to a door that stays shut
  room(-1.3, 1.3, 20, 24.2, 2.2, { floor: MAT.vinyl, wall: MAT.panel, ceil: MAT.ceil }, [{ side: 'n', at: 0, w: 2.6, h: 2.2 }, { side: 's', at: 0, w: 1.3, h: 2.2 }, { side: 'e', at: 22, w: 1.0, h: 2.0, y0: 1.5 }]);
  aoRoom(-1.3, 1.3, 20, 24.2);
  const rise = 2.6, run = 4.6, n = 13, z0 = 24.2;
  for (let i = 0; i < n; i++) { const t = run / n, y = rise / n * (i + 1); box(1.2, rise / n, t, MAT.wood, 0, y - rise / n / 2, z0 + t * i + t / 2, 0, 0, false); box(1.2, 0.03, t + 0.03, MAT.ink, 0, y + 0.015, z0 + t * i + t / 2 + 0.01, 0, 0, false); }
  padRamp(-0.6, 0.6, z0 - 0.3, z0 + run, 'z', z0 - 0.3, z0 + run, 0, rise); padRect(-0.6, 0.6, z0 + run, z0 + run + 1.0, rise, -1);
  box(0.24, 4.9, run + 1.2, MAT.panel, -0.72, 2.45, z0 + run / 2 + 0.5, 0, 0, false); box(0.24, 4.9, run + 1.2, MAT.panel, 0.72, 2.45, z0 + run / 2 + 0.5, 0, 0, false);
  wall(-0.6, z0 - 0.3, -0.6, z0 + run + 1.2); wall(0.6, z0 - 0.3, 0.6, z0 + run + 1.2);
  const sof = box(1.3, 0.2, Math.hypot(run + 1.2, rise) , MAT.ceil, 0, 2.2 + rise / 2 + 0.1 + 0.3, z0 + (run + 1.2) / 2, 0, 0, false); sof.rotation.x = -Math.atan2(rise, run + 1.2); // the sloped soffit over the flight
  box(1.6, 2.9, 0.25, MAT.panel, 0, 2.2 + 1.45, z0 - 0.12, 0, 0, false); box(1.3, 0.25, 1.4, MAT.ceil, 0, rise + 2.3, z0 + run + 0.7, 0, 0, false); // the header above the landing ceiling, the ceiling over the top step
  cyl(0.02, 0.02, run + 0.4, MAT.wood, -0.56, rise / 2 + 0.9, z0 + run / 2, 8, 0, -Math.atan2(rise, run)); // handrail
  // the door at the top, ajar: 18 cm of kitchen through the crack, and the photograph of the way up behind it
  const dz = z0 + run + 1.0; W.door = box(0.95, 2.05, 0.05, MAT.white, -0.17, rise + 1.03, dz, 0.28); box(0.1, 2.1, 0.12, MAT.panel, -0.62, rise + 1.05, dz); box(0.1, 2.1, 0.12, MAT.panel, 0.62, rise + 1.05, dz); box(1.34, 0.12, 0.12, MAT.panel, 0, rise + 2.12, dz);
  const pm = new THREE.MeshBasicMaterial({ map: PLATES.stairs, toneMapped: false }); const pl = plane(2.6, 3.47, pm, 0.3, rise + 1.5, dz + 0.9, PI); pl.material.color.setScalar(1.15);
  practical(0.3, rise + 1.6, dz + 0.5, 0xffd27a, 3.5, 4);
  wall(-0.6, dz - 0.1, 0.6, dz - 0.1);
  interact(0, dz - 0.9, 1.2, 'KNOCK', () => { toast(momLine('door')); state.mom++; hud(); knock(2); }, rise);
  plaque([{ t: '"THE UPSTAIRS"', s: 0.42 }, { t: 'MOM IS NOT ACCEPTING VISITORS.', s: 0.2 }], 0.3, rise + 0.55, dz - 0.03, PI, 0.9, 0.3);
  // the window well, east wall of the landing, at ankle height outside and eye height inside
  const wx = 1.3, wz = 22; box(0.3, 0.04, 1.1, MAT.white, wx + 0.1, 1.48, wz, 0, 0, false); // the sill
  const wellMat = new THREE.MeshBasicMaterial({ map: PLATES.well, toneMapped: false }); W.well = plane(2.4, 1.35, wellMat, wx + 0.6, 1.85, wz, -PI / 2); W.well.material.color.setScalar(0.9); box(0.5, 0.56, 0.05, MAT.white, wx + 0.35, 1.75, wz - 0.52, 0, 0, false); box(0.5, 0.56, 0.05, MAT.white, wx + 0.35, 1.75, wz + 0.52, 0, 0, false); box(0.5, 0.05, 1.1, MAT.white, wx + 0.35, 2.02, wz, 0, 0, false); // the reveals
  const gm = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.35 }); plane(1.0, 0.5, gm, wx + 0.26, 1.75, wz, -PI / 2); // the grimy pane, at the outer face of the wall
  for (let i = -2; i <= 2; i++) box(0.02, 0.5, 0.025, MAT.iron, wx + 0.1, 1.75, wz + i * 0.2); box(0.02, 0.025, 1.0, MAT.iron, wx + 0.1, 1.75, wz); W.wellLight = practical(wx - 0.4, 1.7, wz, 0xbfd4ee, 2.5, 4.5); // the grate inside the pane
  box(0.3, 0.42, 1.4, MAT.conc, wx + 0.75, 1.42, wz, 0, 0, false); box(0.5, 0.06, 1.2, new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 1 }), wx + 0.5, 1.5, wz, 0, 0, false); // the retaining wall rises 15 cm above the sill, gravel in the well
  prop('windowfan', 0.0, 0, 20.6, 0, 0.42); prop('newspapers', -0.9, 0, 23.6, 0.4, 0.5);
  zone(-1.4, 1.4, 20, 30, 'THE STAIRS');
})();

/* --- 2. THE TV DEN: 2.35 m. The plastic couch is the hearth. Eighteen paintings, eight trophies, a mirror that is wrong. --- */
(function den() {
  room(-4.5, 4.5, 11, 20, 2.35, { floor: MAT.shag, wall: MAT.panel, ceil: MAT.ceil },
    [{ side: 's', at: 0, w: 2.6, h: 2.2 }, { side: 'w', at: 18.5, w: 1.2, h: 2.0 }, { side: 'e', at: 13.2, w: 1.2, h: 2.0 }, { side: 'n', at: -2.5, w: 1.3, h: 2.1 }, { side: 'w', at: 15, w: 1.4, h: 2.0 }]);
  aoRoom(-4.5, 4.5, 11, 20, 0.4);
  // the mirror: an opening onto the wrong room, glass in front. Collision keeps the wall.
  wall(-4.5, 14.3, -4.5, 15.7); box(1.6, 1.0, 0.25, MAT.panel, -4.62, 0.5, 15, 0, 0, false); box(1.6, 0.35, 0.25, MAT.panel, -4.62, 2.17, 15, 0, 0, false);
  const mg = MAT.glass.clone(); mg.opacity = 0.3; mg.envMapIntensity = 2.2; mg.roughness = 0.02; W.mirror = plane(1.4, 1.0, mg, -4.49, 1.5, 15, PI / 2); box(1.52, 1.12, 0.03, MAT.frame, -4.5, 1.5, 15); const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), MAT.ink); hole.visible = false;
  // the room behind it: faded peach, floral bed, brass lamp, a closed white door. The spare room nobody uses.
  room(-9, -4.75, 13.5, 16.5, 2.2, { floor: MAT.shag, wall: MAT.peach, ceil: MAT.white }, [{ side: 'e', at: 15, w: 1.4, h: 2.0 }], { noCollide: true, pad: false });
  const bed = box(1.9, 0.5, 1.4, new THREE.MeshStandardMaterial({ color: 0xd8c6a8, roughness: 1 }), -7.6, 0.25, 15.6); box(1.9, 0.08, 1.4, new THREE.MeshStandardMaterial({ color: 0xb04a5a, roughness: 1 }), -7.6, 0.54, 15.6); box(0.6, 0.15, 0.4, MAT.white, -7.0, 0.62, 15.0);
  box(0.5, 0.6, 0.5, MAT.wood, -6.0, 0.3, 14.0); cyl(0.12, 0.16, 0.3, MAT.beige, -6.0, 0.95, 14.0, 12); practical(-6.0, 1.0, 14.0, 0xffc98a, 3.2, 4.5);
  box(0.85, 2.0, 0.05, MAT.white, -8.9, 1.0, 14.3, PI / 2); box(0.3, 0.1, 0.5, MAT.white, -7.0, 0.05, 14.6); box(0.3, 0.1, 0.5, MAT.white, -7.4, 0.05, 14.6);
  plaque([{ t: 'METS', s: 0.6, c: '#FF6B00' }], -8.0, 1.75, 13.53, 0, 0.7, 0.3, { bg: '#1c3f8f' });
  plaque([{ t: '"THE MIRROR"', s: 0.42 }, { t: 'THAT IS NOT THIS ROOM. IT NEVER WAS.', s: 0.2 }], -4.5, 0.82, 15, PI / 2, 0.9, 0.3);
  // the couch, under plastic, facing the set
  W.sofa = box(2.3, 0.55, 0.95, MAT.plastic, 0, 0.275, 17.4); box(2.3, 0.75, 0.3, MAT.plastic, 0, 0.9, 17.7); box(0.25, 0.65, 0.95, MAT.plastic, -1.15, 0.6, 17.4); box(0.25, 0.65, 0.95, MAT.plastic, 1.15, 0.6, 17.4);
  contact(0, 0, 17.5, 3.2, 1.6); boxWalls(0, 17.5, 2.6, 1.1, 0, -1, 1.2);
  box(0.9, 0.04, 0.55, MAT.wood, 0, 0.42, 16.2); [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]].forEach(([a, b]) => cyl(0.02, 0.02, 0.4, MAT.wood, a, 0.2, 16.2 + b, 8)); boxWalls(0, 16.2, 0.9, 0.55, 0, -1, 0.6); contact(0, 0, 16.2, 1.3, 0.9);
  box(0.46, 0.05, 0.46, MAT.crust, 0.1, 0.465, 16.25, 0.2); box(0.05, 0.02, 0.16, MAT.ink, -0.32, 0.45, 16.1, 0.4); box(0.3, 0.12, 0.3, MAT.white, 0.6, 0.5, 16.0, 0.3);
  plaque([{ t: '"THE PLASTIC COUCH"', s: 0.42 }, { t: 'COMFORT IS STILL IN THE PACKAGING.', s: 0.2 }], 0, 0.5, 19.97, PI, 0.9, 0.3);
  // the set: a console CRT on a stand, static, the Mets, closed captions
  box(1.1, 0.5, 0.5, MAT.wood, 0, 0.25, 11.6); box(0.95, 0.72, 0.55, MAT.wood, 0, 0.86, 11.6); contact(0, 0, 11.7, 1.6, 1.0);
  const sc = document.createElement('canvas'); sc.width = 384; sc.height = 288; const st = new THREE.CanvasTexture(sc); st.encoding = THREE.sRGBEncoding;
  MAT.screen = new THREE.MeshBasicMaterial({ map: st, toneMapped: false }); W.crt = { cv: sc, t: st, mesh: plane(0.72, 0.54, MAT.screen, 0, 0.9, 11.895), light: practical(0, 1.1, 12.6, 0x7fa7ff, 1.2, 3.5), cc: null, ccT: 0 };
  W.crt.mesh.rotation.y = 0; boxWalls(0, 11.6, 1.2, 0.6, 0, -1, 1.3);
  interact(0, 12.9, 1.3, 'CHANGE THE CHANNEL', () => { channel(); }, 0);
  // lava lamp, side table, floor lamp, radiator, the shelf of trophies
  box(0.5, 0.55, 0.5, MAT.wood, 2.2, 0.275, 16.6); W.lava = { glass: cyl(0.07, 0.1, 0.42, new THREE.MeshStandardMaterial({ color: 0xff7a40, transparent: true, opacity: 0.45, roughness: 0.1 }), 2.2, 0.85, 16.6, 16), blobs: [], light: practical(2.2, 0.9, 16.6, 0xff4a20, 1.6, 2.6) };
  cyl(0.11, 0.08, 0.14, MAT.steel, 2.2, 0.62, 16.6, 16); cyl(0.05, 0.08, 0.1, MAT.steel, 2.2, 1.1, 16.6, 16);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035 + i * 0.006, 10, 8), MAT.lava); b.position.set(2.2, 0.7, 16.6); scene.add(b); W.lava.blobs.push({ m: b, ph: i * 1.7, sp: 0.5 + i * 0.13 }); }
  prop('floorlamp', -3.6, 0, 18.6, 0, 1.6); practical(-3.6, 1.55, 18.6, 0xffd3a0, 2.4, 4); prop('tablelamp', -10.2, 0.9, 21.7, PI, 0.38);
  prop('radiator', 3.9, 0, 14.5, -PI / 2, 0.75); prop('fan', -3.9, 0, 12.2, 0.6, 0.55); prop('poolcue', 4.2, 0, 19.4, 0, 1.5, { rx: 0.12 });
  box(8.4, 0.04, 0.3, MAT.wood, 0, 1.95, 11.18, 0, 0, false); box(8.4, 0.04, 0.3, MAT.wood, 0, 1.3, 11.18, 0, 0, false);
  ['pepe', 'wojak', 'doge', 'harold', 'grumpy', 'kermit', 'drake', 'sweat'].forEach((k, i) => trophy(k, -3.6 + i * 1.03 + (i > 3 ? 0.9 : 0), 1.97, 11.18, 0, 0.44));
  prop('radio', -3.3, 1.32, 11.18, 0, 0.3); prop('potion', -2.6, 1.32, 11.18, 0, 0.22); prop('lotto', 3.5, 1.32, 11.18, 0, 0.5);
  plaque([{ t: '"TROPHIES"', s: 0.42 }, { t: 'TWENTY CLASSICS. MOM DUSTS THEM.', s: 0.2 }], 0, 2.25, 11.0, 0, 0.9, 0.22, { back: false });
  // the paintings: a private obsession, clustered, two rows
  salon(-4.5, 19.97, -1.4, 19.97, PI, 5, { rows: [1.25, 1.95], h: 0.5, gap: 0.14 }); salon(1.4, 19.97, 4.5, 19.97, PI, 5, { rows: [1.25, 1.95], h: 0.5, gap: 0.14 });
  salon(4.47, 14.0, 4.47, 19.6, -PI / 2, 5, { rows: [1.0, 1.75], h: 0.5, gap: 0.14 }); salon(-4.47, 13.2, -4.47, 11.2, PI / 2, 3, { rows: [1.55], h: 0.5 });
  // light: the bare bulb at the centre is the key; the fluorescent over the stairs is cool and cheap
  bulb(0, 2.1, 15.5, 0xffd3a0, 6, 9); bulb(0, 2.0, 22, 0xffd3a0, 3, 5);
  zone(-4.5, 4.5, 11, 20, 'THE TV DEN'); zone(-9, -4.75, 13.5, 16.5, 'THE WRONG ROOM');
  plaque([{ t: '"THE LANDLORD"', s: 0.42 }, { t: 'THAT WAS LIKE THAT WHEN YOU MOVED IN.', s: 0.2 }], 4.47, 2.15, 12.0, -PI / 2, 0.9, 0.3);
})();

/* --- 3. THE CARD ROOM: 2.15 m. Proof of stake, five dollar minimum. Twenty paintings, six trophies, the corkboard. --- */
(function cardRoom() {
  room(-12, -4.75, 17, 22, 2.15, { floor: MAT.vinyl, wall: MAT.panel, ceil: MAT.ceil }, [{ side: 'e', at: 18.5, w: 1.2, h: 2.0 }]);
  aoRoom(-12, -4.75, 17, 22, 0.35);
  // the folding table and four chairs, a pendant over it, the wobble
  W.table = new THREE.Group(); W.table.position.set(-8.5, 0, 19.2); scene.add(W.table);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.9), new THREE.MeshStandardMaterial({ color: 0x3b2f26, roughness: 0.9 })); top.position.y = 0.74; top.castShadow = top.receiveShadow = true; W.table.add(top);
  [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.72, 6), MAT.steel); l.position.set(x, 0.36, z); W.table.add(l); });
  contact(-8.5, 0, 19.2, 2.6, 1.6); boxWalls(-8.5, 19.2, 1.9, 1.0, 0, -1, 1.0);
  [[-9.6, 19.2, PI / 2], [-7.4, 19.2, -PI / 2], [-8.5, 18.25, 0], [-8.5, 20.15, PI]].forEach(([x, z, ry]) => { box(0.42, 0.04, 0.42, MAT.wood, x, 0.45, z, ry); box(0.42, 0.45, 0.04, MAT.wood, x - Math.sin(ry) * 0.2, 0.7, z - Math.cos(ry) * 0.2, ry); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => cyl(0.012, 0.012, 0.45, MAT.steel, x + a, 0.22, z + b, 6)); post(x, z, 0.26, -1, 1.0); });
  // chips, cards, a Con Ed bill folded for the leg (hidden until cope)
  for (let i = 0; i < 18; i++) cyl(0.02, 0.02, 0.004, i % 3 ? MAT.orange : MAT.blue, -8.5 + (rnd() - 0.5) * 1.4, 0.762 + (i % 4) * 0.004, 19.2 + (rnd() - 0.5) * 0.6, 12);
  W.bill = box(0.08, 0.01, 0.12, MAT.white, -9.3, 0.005, 19.58); W.bill.visible = false;
  cyl(0.01, 0.01, 1.0, MAT.ink, -8.5, 1.65, 19.2, 6); cyl(0.2, 0.35, 0.25, MAT.enamel, -8.5, 1.15, 19.2, 16); practical(-8.5, 1.0, 19.2, 0xffd9a0, 4.5, 5);
  plaque([{ t: '"THE BASEMENT CARD ROOM"', s: 0.42 }, { t: 'PROOF OF STAKE. FIVE DOLLAR MINIMUM.', s: 0.2 }], -11.97, 2.0, 21.2, PI / 2, 0.9, 0.3);
  // the corkboard: twelve slots for your JPGs, each with a posting permit
  const ck = new THREE.MeshStandardMaterial({ color: 0x6e4f33, roughness: 1 }); box(5.2, 1.3, 0.04, ck, -8.4, 1.5, 17.03);
  [[-10.95, 2.05], [-5.85, 2.05], [-8.4, 0.95]].forEach(([x, y], i) => hang(NYP[(nyCursor++) % NYP.length].n, x, y, 17.05, 0, 0.3, false));
  plaque([{ t: 'RENT IS DUE', s: 0.5, c: '#0D0D0D' }, { t: 'THE 1ST. EVERY 1ST.', s: 0.25 }], -6.2, 1.0, 17.05, 0, 0.5, 0.22, { bg: '#f6f3ea', back: false }); plaque([{ t: 'WIFI: NO', s: 0.6, c: '#0D0D0D' }], -10.6, 0.98, 17.05, 0, 0.42, 0.2, { bg: '#f6f3ea', back: false }); box(5.3, 1.4, 0.03, MAT.wood, -8.4, 1.5, 17.0);
  for (let i = 0; i < 12; i++) { const x = -10.8 + (i % 6) * 0.96, y = i < 6 ? 1.82 : 1.18; const m = plane(0.78, 0.5, new THREE.MeshStandardMaterial({ color: 0x8f6e48, roughness: 1 }), x, y, 17.06, 0); m.userData.slot = i; PICK_EXTRA.push(m);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), MAT.orange); pin.position.set(x, y + 0.23, 17.08); scene.add(pin); W.corkboard.push({ art: m, filled: false, name: '' }); }
  plaque([{ t: '"THE CORKBOARD"', s: 0.42 }, { t: 'PIN A JPG. A POSTING PERMIT WILL BE ISSUED.', s: 0.2 }], -8.4, 0.72, 17.03, 0, 0.9, 0.3);
  interact(-8.4, 17.9, 1.6, 'PIN A JPG (H)', () => { slotTarget = W.corkboard.findIndex(s => !s.filled); document.getElementById('file').click(); }, 0);
  // the second shelf of trophies, the counter with the urn and the toaster
  box(2.6, 0.04, 0.3, MAT.wood, -6.3, 1.65, 21.82, 0, 0, false); ['rick', 'spongebob', 'pikachu', 'brain', 'thisisfine', 'mj'].forEach((k, i) => trophy(k, -7.4 + i * 0.44, 1.67, 21.82, PI, 0.36));
  box(1.8, 0.9, 0.55, MAT.enamel, -11.05, 0.45, 21.7); boxWalls(-11.05, 21.7, 1.8, 0.55, 0, -1, 1.0); prop('urn', -11.5, 0.9, 21.7, PI, 0.5); prop('toaster', -10.7, 0.9, 21.7, PI, 0.22); prop('hotsauce', -11.95, 1.2, 19.0, PI / 2, 0.55); prop('seltzer', -8.0, 0.76, 19.1, 0, 0.3);
  prop('mic', -5.3, 0, 21.5, -2.3, 1.4, { label: 'Microphone (the podcast corner)' }); prop('headphone', -5.3, 1.2, 21.3, 0, 0.0001);
  trophy('monalisa', -11.95, 1.1, 18.1, PI / 2, 0.6, { mode: 'h' });
  salon(-11.97, 22, -11.97, 17.1, PI / 2, 8, { rows: [1.1, 1.75], h: 0.46, gap: 0.12 }); salon(-4.8, 21.97, -11.9, 21.97, PI, 12, { rows: [1.0, 1.9], h: 0.42, gap: 0.12 });
  plaque([{ t: '"THE PODCAST CORNER"', s: 0.42 }, { t: 'TWO MICS. ONE LISTENER. HE IS ALSO THE HOST.', s: 0.2 }], -4.78, 2.0, 21.3, -PI / 2, 0.9, 0.3);
  zone(-12, -4.75, 17, 22, 'THE CARD ROOM');
})();

/* --- 4. BOILER AND LAUNDRY: 2.05 m under the pipes. The dryer is a ride, the pipes are a Penrose, the PC is a relic. --- */
(function laundry() {
  room(4.75, 13, 11, 19, 2.05, { floor: MAT.conc, wall: MAT.cinder, ceil: MAT.joist }, [{ side: 'w', at: 13.2, w: 1.2, h: 2.0 }, { side: 's', at: 9, w: 1.2, h: 2.0 }]);
  aoRoom(4.75, 13, 11, 19, 0.3);
  // boiler, the hearth of the mechanical room
  cyl(0.7, 0.75, 1.6, MAT.iron, 11.6, 0.8, 13.2, 24); cyl(0.3, 0.3, 0.6, MAT.iron, 11.6, 1.9, 13.2, 16); cyl(0.12, 0.12, 2.2, MAT.pipe, 12.4, 1.3, 13.2, 12); box(0.5, 0.5, 0.25, MAT.beige, 11.6, 0.9, 12.42); post(11.6, 13.2, 0.8, -1, 2.0); contact(11.6, 0, 13.2, 2.2, 2.2);
  W.boilerLight = practical(11.6, 0.35, 12.35, 0xff6a2a, 1.2, 2.5);
  [-0.3, 0, 0.3].forEach((dx, i) => { cyl(0.012, 0.012, 1.3, MAT.copper, 12.2 + dx * 0.4, 1.95, 13.9 + i * 0.1, 8, PI / 2); cyl(0.012, 0.012, 0.9, MAT.copper, 12.2 + dx * 0.4, 1.5, 12.6, 8); }); cyl(0.05, 0.05, 0.9, MAT.pipe, 11.6, 2.4, 13.2, 12, PI / 2); cyl(0.04, 0.04, 0.03, MAT.white, 11.1, 1.2, 12.5, 16, 0, PI / 2); cyl(0.045, 0.045, 0.02, MAT.ink, 11.1, 1.2, 12.49, 16, 0, PI / 2); trophy('flame', 11.6, 2.2, 13.2, PI, 0.5);
  plaque([{ t: '"THE BOILER"', s: 0.42 }, { t: 'HEAT INCLUDED. PEACE SEPARATE.', s: 0.2 }], 12.97, 1.5, 15.0, -PI / 2, 0.9, 0.3);
  // washer and dryer, north wall. The dryer door faces south into the room.
  box(0.7, 0.9, 0.7, MAT.enamel, 7.4, 0.45, 11.6); box(0.7, 0.9, 0.7, MAT.enamel, 8.3, 0.45, 11.6); boxWalls(7.85, 11.6, 1.7, 0.75, 0, -1, 1.0); contact(7.85, 0, 11.7, 2.4, 1.3);
  const door = cyl(0.26, 0.26, 0.04, MAT.steel, 8.3, 0.5, 11.97, 24, 0, PI / 2); const port = cyl(0.21, 0.21, 0.03, MAT.glass, 8.3, 0.5, 11.99, 24, 0, PI / 2);
  W.dryer = { x: 8.3, z: 11.6, door, drum: null, sock: null, folded: null, spin: 0 };
  const drum = new THREE.Group(); drum.position.set(8.3, 0.5, 11.6); scene.add(drum); const dm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.62, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xa8acb0, roughness: 0.5, metalness: 0.7, side: THREE.BackSide })); dm.rotation.x = PI / 2; drum.add(dm);
  for (let i = 0; i < 3; i++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.6), MAT.steel); fin.position.set(Math.cos(i * 2.09) * 0.27, Math.sin(i * 2.09) * 0.27, 0); fin.rotation.z = i * 2.09; drum.add(fin); }
  const sock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.03), MAT.sock); sock.position.set(0.1, -0.2, 0); drum.add(sock); W.dryer.drum = drum; W.dryer.sock = sock;
  W.dryer.folded = box(0.4, 0.22, 0.3, MAT.sock, 7.4, 1.01, 11.6); W.dryer.folded.visible = false;
  trophy('tableflip', 7.4, 0.9, 11.6, 0, 0.55, { mode: 'm' });
  interact(8.3, 12.7, 1.2, 'RIDE THE DRYER', () => startDryer(), 0);
  plaque([{ t: '"THE DRYER"', s: 0.42 }, { t: 'ANOTHER CYCLE. SAME BAG.', s: 0.2 }], 8.3, 1.45, 11.03, 0, 0.9, 0.3);
  // the Penrose steam staircase: four pipe runs on the east wall, each climbing, that only close their loop from the orange footprints
  const V = new V3(9.6, 1.7, 17.2), pts = [[12.6, 0.4, 15.4], [12.6, 1.0, 18.4], [10.4, 1.6, 18.6], [10.4, 2.2, 15.6]]; // start points of the four runs, each ending where the next starts, except the last
  const runs = [[pts[0], pts[1]], [pts[1], pts[2]], [pts[2], pts[3]]];
  // the fourth run ends on the ray from the viewpoint through the first run's start, further back: from the footprints the loop reads closed
  const r0 = new V3(...pts[0]).sub(V).normalize(); const far = V.clone().addScaledVector(r0, V.distanceTo(new V3(...pts[0])) * 1.22); runs.push([pts[3], [far.x, far.y, far.z]]);
  runs.forEach(([a, b]) => { const A = new V3(...a), B = new V3(...b), L = A.distanceTo(B), m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, L, 12), MAT.pipe); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize()); m.castShadow = true; scene.add(m); W.penrose.push(m);
    for (let k = 0.15; k < 0.95; k += 0.2) { const p = A.clone().lerp(B, k); const s = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.16), MAT.pipe); s.position.copy(p); s.position.y += 0.07; scene.add(s); } });
  [[9.5, 17.3], [9.7, 17.1]].forEach(([x, z]) => box(0.11, 0.004, 0.28, MAT.orange, x, 0.002, z, 0.1, 0, false));
  plaque([{ t: '"THE STEAM STAIRCASE"', s: 0.42 }, { t: 'STAND ON THE ORANGE. IT GOES UP FOREVER. IT GOES NOWHERE.', s: 0.18 }], 12.97, 2.0, 17.0, -PI / 2, 1.1, 0.3);
  prop('steampipe', 5.2, 0, 13.6, PI / 2, 1.9); prop('steamvalve', 12.9, 1.4, 14.2, -PI / 2, 0.25); prop('fusebox', 4.78, 1.4, 15.6, PI / 2, 0.55); prop('beercase', 6.0, 0, 11.6, 0.3, 0.35); prop('crystalroach', 12.6, 0, 11.4, 2.5, 0.22);
  // the 1998 PC, calcified in blue calcite, on a milk crate. The one Arsham moment.
  prop('milkcrate', 5.35, 0, 18.4, 0.3, 0.33); W.pc = box(0.2, 0.44, 0.44, MAT.beige, 5.35, 0.56, 18.4, 0.3); post(5.35, 18.4, 0.4, -1, 1.2);
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.03 + rnd() * 0.03, 0.12 + rnd() * 0.18, 5), MAT.crystal); c.position.set(5.35 + (rnd() - 0.5) * 0.26, 0.56 + (rnd() - 0.5) * 0.4, 18.4 + (rnd() - 0.5) * 0.4); c.rotation.set(rnd() * 2, rnd() * 3, rnd() * 2); scene.add(c); }
  practical(5.35, 0.9, 18.4, 0x5fb8ff, 1.0, 2.2); prop('headphone', 5.5, 0.78, 18.1, 0.6, 0.2);
  interact(5.35, 18.4, 1.5, 'POWER ON', () => mining(), 0);
  plaque([{ t: '"THE 1998 PC"', s: 0.42 }, { t: 'YOUR WALLET IS NOW ARCHAEOLOGY.', s: 0.2 }], 4.78, 1.5, 17.8, PI / 2, 0.9, 0.3);
  tube(9, 1.95, 15, 1.2, PI / 2, 0xdfeeff, 5, 8); W.tubeL = practicals[practicals.length - 1];
  salon(4.78, 14.4, 4.78, 12.0, PI / 2, 4, { rows: [1.0, 1.72], h: 0.42, gap: 0.1 }); salon(6.4, 18.97, 8.3, 18.97, PI, 4, { rows: [1.0, 1.72], h: 0.38, gap: 0.08 }); salon(12.97, 11.2, 12.97, 12.3, -PI / 2, 2, { rows: [1.5], h: 0.4 }); salon(9.7, 18.97, 12.9, 18.97, PI, 4, { rows: [1.0, 1.72], h: 0.42, gap: 0.1 }); salon(5.3, 11.03, 6.6, 11.03, 0, 4, { rows: [1.3, 1.85], h: 0.38, gap: 0.08 });
  zone(4.75, 13, 11, 19, 'BOILER AND LAUNDRY');
})();

/* --- 5. THE INFINITE HALLWAY: an Ames corridor. 2.1 m at the mouth, 0.4 m at a vanishing point you can never reach. --- */
const HALL = { x: -2.5, z0: 11, z1: -40, w0: 1.3, w1: 0.22, h0: 2.1, h1: 0.36 };
HALL.w = z => HALL.w0 + (HALL.z0 - z) / (HALL.z0 - HALL.z1) * (HALL.w1 - HALL.w0); HALL.h = z => HALL.h0 + (HALL.z0 - z) / (HALL.z0 - HALL.z1) * (HALL.h1 - HALL.h0);
(function hallway() {
  const N = 26, quads = (mat, f) => { const pos = [], uv = [], idx = []; for (let i = 0; i <= N; i++) { const z = HALL.z0 + (HALL.z1 - HALL.z0) * i / N, [a, b] = f(z); pos.push(...a, ...b); uv.push(0, (HALL.z0 - z) / 1.2, 1, (HALL.z0 - z) / 1.2); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m; };
  const wmat = MAT.panel.clone(); wmat.side = THREE.DoubleSide; wmat.map = MAT.panel.map.clone(); wmat.map.needsUpdate = true; wmat.map.repeat.set(0.45, 1); wmat.normalMap = MAT.panel.normalMap; const fmat = MAT.vinyl.clone(); fmat.side = THREE.DoubleSide; const cmat = MAT.ceil.clone(); cmat.side = THREE.DoubleSide;
  quads(fmat, z => [[HALL.x - HALL.w(z) / 2, 0, z], [HALL.x + HALL.w(z) / 2, 0, z]]); quads(cmat, z => [[HALL.x - HALL.w(z) / 2, HALL.h(z), z], [HALL.x + HALL.w(z) / 2, HALL.h(z), z]]);
  quads(wmat, z => [[HALL.x - HALL.w(z) / 2, 0, z], [HALL.x - HALL.w(z) / 2, HALL.h(z), z]]); quads(wmat, z => [[HALL.x + HALL.w(z) / 2, 0, z], [HALL.x + HALL.w(z) / 2, HALL.h(z), z]]);
  // the end wall at the vanishing point, and a door frame at every few metres, each one smaller
  box(HALL.w1, HALL.h1, 0.05, MAT.panel, HALL.x, HALL.h1 / 2, HALL.z1 + 0.02);
  for (let z = 7; z > -36; z -= 5.5) { const w = HALL.w(z), h = HALL.h(z), s = w / HALL.w0; box(0.06 * s, h * 0.86, 0.06 * s, MAT.white, HALL.x - w / 2 + 0.03 * s, h * 0.43, z); box(0.06 * s, h * 0.86, 0.06 * s, MAT.white, HALL.x + w / 2 - 0.03 * s, h * 0.43, z); box(w, 0.06 * s, 0.06 * s, MAT.white, HALL.x, h * 0.86, z); box(0.4 * s, h * 0.8, 0.03 * s, MAT.white, HALL.x - w / 2 + 0.22 * s, h * 0.4, z + 0.04 * s, 0.35); bulb(HALL.x, h - 0.08 * s, z - 2.5, 0xffd3a0, 2.2 * s * s, 5 * s); }
  // collision: the two walls as segments, the walkable floor to z = 1, a sawhorse across the end
  const westSeg = wall(HALL.x - HALL.w0 / 2, HALL.z0, HALL.x - HALL.w1 / 2, HALL.z1); wall(HALL.x + HALL.w0 / 2, HALL.z0, HALL.x + HALL.w1 / 2, HALL.z1); padRect(HALL.x - 1, HALL.x + 1, HALL.z1, HALL.z0, 0, -1);
  wall(HALL.x - 1, 1.0, HALL.x + 1, 1.0); const sw = HALL.w(1.2); box(sw * 0.9, 0.08, 0.08, MAT.orange, HALL.x, 0.75, 1.2); [-1, 1].forEach(s => { cyl(0.02, 0.02, 0.8, MAT.orange, HALL.x + s * sw * 0.4, 0.38, 1.2 - 0.12, 6, 0.25 * s); cyl(0.02, 0.02, 0.8, MAT.orange, HALL.x + s * sw * 0.4, 0.38, 1.2 + 0.12, 6, -0.25 * s); });
  plaque([{ t: 'CLOSED FOR RENOVATION', s: 0.42, c: '#FF6B00' }, { t: 'SINCE 1994. ASK THE SUPER.', s: 0.2 }], HALL.x, 0.95, 1.16, PI, 0.8, 0.26, { bg: '#FFFFFF', back: false });
  // sixteen paintings, each smaller than the last, both walls; the ones past the sawhorse are scenery
  for (let i = 0; i < 16; i++) { const z = 9.5 - i * 2.6, s = HALL.w(z) / HALL.w0, side = i % 2 ? 1 : -1, p = NYP[(nyCursor++) % NYP.length], h = 0.5 * s; hang(p.n, HALL.x + side * HALL.w(z) / 2, HALL.h(z) * 0.62, z, side > 0 ? -PI / 2 : PI / 2, h); }
  prop('payphone', HALL.x - HALL.w(8.4) / 2 + 0.02, 0.9, 8.4, PI / 2, 0.6);
  plaque([{ t: '"THE INFINITE HALLWAY"', s: 0.42 }, { t: 'COZY. FLEXIBLE LAYOUT.', s: 0.2 }], -4.47, 2.25, 11.7, PI / 2, 0.9, 0.26, { back: false });
  // the side door to the bagel chamber, west wall, where the corridor is still 1.1 m wide
  const dz = 3.0, dw = HALL.w(dz); westSeg.on = false; // the long west segment becomes two that leave the door
  const xw = z => HALL.x - HALL.w(z) / 2; wall(xw(HALL.z0), HALL.z0, xw(dz + 0.6), dz + 0.6); wall(xw(dz - 0.6), dz - 0.6, xw(HALL.z1), HALL.z1);
  box(0.08, HALL.h(dz) * 0.95, 0.08, MAT.orange, xw(dz) - 0.03, HALL.h(dz) * 0.47, dz + 0.62); box(0.08, HALL.h(dz) * 0.95, 0.08, MAT.orange, xw(dz) - 0.03, HALL.h(dz) * 0.47, dz - 0.62); box(0.08, 0.08, 1.3, MAT.orange, xw(dz) - 0.03, HALL.h(dz) * 0.95, dz);
  plaque([{ t: '"BAGEL"', s: 0.5, c: '#FF6B00' }, { t: 'EVERYTHING', s: 0.22 }], xw(dz) + 0.01, HALL.h(dz) * 0.95 + 0.17, dz, PI / 2, 0.8, 0.22, { bg: '#FFFFFF', back: false });
  zone(HALL.x - 1, HALL.x + 1, -40, 11, 'THE INFINITE HALLWAY');
})();

/* --- 6. THE EVERYTHING BAGEL: 4.8 m clear, the one release. A 12 metre bagel in a cream cheese lake. Sixteen paintings. --- */
(function bagel() {
  const x0 = -36, x1 = -3.6, z0 = -24, z1 = 6.2, H = 4.8;
  room(x0, x1, z0, z1, H, { floor: MAT.conc, wall: MAT.plaster, ceil: MAT.plaster }, [{ side: 'e', at: 3.0, w: 1.2, h: 2.0 }]); aoRoom(x0, x1, z0, z1, 0.6); box(9, H, 0.02, MAT.brick, x0 + 8, H / 2, z0 + 0.14, 0, 0, false); // the one compromised patch of brick
  padRect(x1 - 0.3, x1 + 0.4, 2.3, 3.7, 0, -1);
  const cx = -20, cz = -9, R = 4.2, r = 1.9;
  const BITE = 0.62, BA = 0; // the bite faces east, toward the side door; BA is its centre angle in the floor plane
  const bg = new THREE.TorusGeometry(R, r, 28, 72, PI * 2 - BITE); bg.rotateZ(BA + BITE / 2); worldUV(bg, 0.6); W.bagel = new THREE.Mesh(bg, MAT.bagel); W.bagel.rotation.x = PI / 2; W.bagel.position.set(cx, r - 0.35, cz); W.bagel.castShadow = W.bagel.receiveShadow = true; scene.add(W.bagel);
  // collision: the ring is a wall on both faces; the hole is walkable
  const crumb = new THREE.MeshStandardMaterial({ color: 0xf1e4c3, roughness: 1 }); [-1, 1].forEach(k => { const e = BA + k * BITE / 2; const cap = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, 28), crumb); cap.position.set(cx + Math.cos(e) * R, r - 0.35, cz + Math.sin(e) * R); cap.rotation.y = -e; cap.material.side = THREE.DoubleSide; scene.add(cap); });
  for (let i = 0; i < 48; i++) { const a0 = i / 48 * PI * 2, a1 = (i + 1) / 48 * PI * 2; const am = (a0 + a1) / 2; if (Math.abs(Math.atan2(Math.sin(am - BA), Math.cos(am - BA))) < BITE / 2 + 0.1) continue; [R - r + 0.2, R + r - 0.2].forEach(rr => wall(cx + Math.cos(a0) * rr, cz + Math.sin(a0) * rr, cx + Math.cos(a1) * rr, cz + Math.sin(a1) * rr, -1, 3.5)); }
  // the cream cheese lake, the schmear it sits in; you wade
  const cg = new THREE.CylinderGeometry(6.6, 6.9, 0.3, 64); worldUV(cg, 1.0); W.cream = new THREE.Mesh(cg, MAT.cream); W.cream.position.set(cx, 0.15, cz); W.cream.receiveShadow = true; scene.add(W.cream); padCirc(cx, cz, 6.6, 0.3, -1);
  // sesame, poppy, onion, salt: 900 instanced seeds on the crust, oriented along the surface normal
  const sg = new THREE.SphereGeometry(0.09, 6, 4); sg.scale(1, 0.45, 1.6); const seeds = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: 0xf0dcb0, roughness: 0.8 }), 900); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0), pp = new V3(), nn = new V3();
  for (let i = 0; i < 900; i++) { const u = rnd() * PI * 2, v = (rnd() * 0.9 - 0.45) * PI; const cr = R + r * Math.cos(v); pp.set(cx + Math.cos(u) * cr, r - 0.35 + r * Math.sin(v), cz + Math.sin(u) * cr); nn.set(Math.cos(u) * Math.cos(v), Math.sin(v), Math.sin(u) * Math.cos(v)); q.setFromUnitVectors(up, nn); q.multiply(new THREE.Quaternion().setFromAxisAngle(up, rnd() * PI)); m4.compose(pp, q, new V3(1, 1, 1).multiplyScalar(0.7 + rnd() * 0.7)); seeds.setMatrixAt(i, m4);
    if (i % 4 === 0) seeds.setColorAt ? seeds.setColorAt(i, new THREE.Color(i % 8 ? 0x2a2622 : 0xd9c9a6)) : 0; }
  seeds.castShadow = true; seeds.receiveShadow = true; scene.add(seeds); W.seeds = seeds;
  // the Great Wave rises out of the cream cheese; Nyan orbits the bagel. The bagel breathes.
  W.wave = trophy('wave', cx + 9.6, 0.3, cz + 3.0, faceTo(cx + 9.6, cz + 3, cx, cz), 3.4, { mode: 'm', plinth: false, tick: (s, dt) => { if (s.root) s.root.position.y = 0.3 + Math.sin(T * 0.6) * 0.18; } });
  W.nyan = trophy('nyan', cx, 3.6, cz, 0, 1.6, { mode: 'm', tick: (s, dt) => { if (!s.root) return; const a = T * 0.35; s.root.position.set(cx + Math.cos(a) * (R + 3.2), 2.4 + Math.sin(a * 2) * 0.5, cz + Math.sin(a) * (R + 3.2)); s.root.rotation.y = -a - PI / 2; } });
  // bodega tables: the bagel bin and the cream cheese tub, at human scale, so the big one reads as big
  box(1.6, 0.85, 0.7, MAT.enamel, x0 + 1.2, 0.42, z1 - 3.0, PI / 2); boxWalls(x0 + 1.2, z1 - 3.0, 0.7, 1.6, 0, -1, 1.0); prop('bagelbin', x0 + 1.2, 0.85, z1 - 3.4, PI / 2, 0.42); prop('creamcheese', x0 + 1.2, 0.85, z1 - 2.5, PI / 2, 0.24);
  // light: four bulbs on long cords, a warm cave; the cream cheese bounces
  [[cx - 6, cz - 6], [cx + 6, cz - 6], [cx - 6, cz + 6], [cx + 6, cz + 6]].forEach(([x, z]) => bulb(x, 3.6, z, 0xffd0a0, 9, 14)); practical(cx, 1.2, cz, 0xfff2d8, 5, 7);
  plaque([{ t: '"THE EVERYTHING BAGEL"', s: 0.42 }, { t: 'EVERYTHING EXCEPT AN EXIT.', s: 0.2 }], x1 - 0.03, 1.5, 1.6, -PI / 2, 0.9, 0.3);
  plaque([{ t: '"THE CRUST"', s: 0.42 }, { t: 'IT IS MADE OF BAGELS. IT IS BAGELS ALL THE WAY DOWN.', s: 0.18 }], x1 - 0.03, 1.1, 1.6, -PI / 2, 0.9, 0.3);
  plaque([{ t: '"THE SCHMEAR"', s: 0.42 }, { t: 'WADE RESPONSIBLY. NO LOX AFTER 4PM.', s: 0.2 }], cx + 7.7, 0.95, cz + 7.9, PI, 0.9, 0.3, { back: false });
  interact(cx, cz, 2.0, 'STAND IN THE HOLE', () => { toast('YOU ARE INSIDE THE HOLE OF A 12 METRE EVERYTHING BAGEL. THIS IS THE CENTRE OF THE UNIVERSE. IT IS IN QUEENS.', 'blue'); state.eggs.add('hole'); }, 0);
  salon(x0 + 0.03, z1 - 0.5, x0 + 0.03, z0 + 0.5, PI / 2, 8, { rows: [1.5, 2.6], h: 0.9, gap: 0.5 }); salon(x1 - 0.03, z0 + 0.5, x1 - 0.03, 1.8, -PI / 2, 4, { rows: [1.6, 2.7], h: 0.8, gap: 0.5 }); salon(x1 - 0.5, z0 + 0.03, x0 + 0.5, z0 + 0.03, 0, 4, { rows: [2.2], h: 1.1, gap: 2.0 });
  zone(x0, x1, z0, z1, 'THE EVERYTHING BAGEL');
})();

/* --- 7. THE RAT KING'S COURT: 2.7 m, the former storage bay. Local government. Twelve paintings, one cat. --- */
(function court() {
  room(5, 13, 19.25, 28, 2.7, { floor: MAT.conc, wall: MAT.plaster, ceil: MAT.joist }, [{ side: 'n', at: 9, w: 1.2, h: 2.0 }]); aoRoom(5, 13, 19.25, 28, 0.4); box(0.02, 2.7, 5, MAT.brick, 12.86, 1.35, 24.5, 0, 0, false);
  // the throne: milk crates, the crystal rat on top, a pizza box crown
  prop('milkcrate', 12.0, 0, 24, -PI / 2, 0.33); prop('milkcrate', 12.0, 0.33, 24, -PI / 2 + 0.2, 0.33); W.king = prop('crystalrat', 12.0, 0.66, 24, -PI / 2, 1.2, { label: 'The Rat King', mode: 'm' }); post(12, 24, 0.6, -1, 1.5);
  practical(11.6, 1.5, 24, 0x7fd4ff, 2.2, 3.5); box(0.4, 0.04, 0.4, MAT.crust, 12.0, 1.3, 24, 0.3);
  plaque([{ t: '"THE RAT KING"', s: 0.42 }, { t: 'LOCAL GOVERNMENT.', s: 0.2 }], 12.97, 2.0, 24, -PI / 2, 0.9, 0.3);
  // the procession: twelve rats dragging dollar slices around the court, until you stand still and they chart
  const body = new THREE.SphereGeometry(0.11, 10, 8); body.scale(1, 0.75, 1.7); const head = new THREE.ConeGeometry(0.07, 0.16, 8); head.rotateX(-PI / 2); const ear = new THREE.SphereGeometry(0.025, 6, 5); const tail = new THREE.CylinderGeometry(0.008, 0.015, 0.26, 5); tail.rotateX(PI / 2);
  const slice = new THREE.Shape(); slice.moveTo(0, 0); slice.lineTo(-0.11, 0.3); slice.quadraticCurveTo(0, 0.34, 0.11, 0.3); slice.lineTo(0, 0); const sg = new THREE.ExtrudeGeometry(slice, { depth: 0.015, bevelEnabled: false }); sg.rotateX(-PI / 2);
  for (let i = 0; i < 12; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(body, MAT.fur); b.position.y = 0.09; b.castShadow = true; g.add(b); const h = new THREE.Mesh(head, MAT.fur); h.position.set(0, 0.1, 0.22); g.add(h); [-1, 1].forEach(s => { const e = new THREE.Mesh(ear, MAT.fur); e.position.set(s * 0.05, 0.16, 0.18); g.add(e); }); const t = new THREE.Mesh(tail, new THREE.MeshStandardMaterial({ color: 0xc9a08a, roughness: 1 })); t.position.set(0, 0.06, -0.28); g.add(t);
    const s = new THREE.Mesh(sg, MAT.cheese); s.position.set(0, 0.02, 0.32); g.add(s); const c = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.03), MAT.crust); c.position.set(0, 0.025, 0.62); g.add(c); [[-0.03, 0.42], [0.04, 0.5], [-0.01, 0.56]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.004, 8), MAT.pepperoni); p.position.set(x, 0.032, z); g.add(p); });
    scene.add(g); W.rats.push({ g, a: i / 12 * PI * 2, sp: 0.45 + rnd() * 0.25, mode: 'loop', tx: 0, tz: 0, bob: rnd() * 6 }); }
  interact(8.5, 23.5, 2.6, '', null, 0); zone(5, 13, 19.25, 28, "THE RAT KING'S COURT");
  plaque([{ t: '"THE PROCESSION"', s: 0.42 }, { t: 'TWELVE RATS, TWELVE SLICES. STAND STILL AND THEY WILL SHOW YOU THE CHART.', s: 0.16 }], 5.03, 2.0, 23.5, PI / 2, 1.1, 0.3);
  prop('catbed', 6.0, 0, 20.0, 0.5, 0.18); prop('cooler', 5.6, 0, 26.6, PI / 2, 1.0); prop('rat', 9.0, 2.35, 19.3, 0, 0.25, { label: 'Rat on rail' }); prop('ceilingfan', 9, 2.45, 23.5, 0, 0.35, { tick: (s, dt) => { if (s.root) s.root.rotation.y += dt * 2.2; } });
  for (let i = 0; i < 6; i++) box(0.46, 0.05, 0.46, MAT.crust, 11.4 + (i % 2) * 0.1, 0.03 + i * 0.05, 27.4 - (i % 3) * 0.05, i * 0.1);
  // mom's second freezer, the chest against the south wall, the cat on the lid
  W.freezer = { x: 8.6, z: 27.5, open: false, tries: 0 }; box(1.6, 0.85, 0.75, MAT.enamel, 8.6, 0.425, 27.55); W.freezer.lid = box(1.62, 0.06, 0.78, MAT.enamel, 8.6, 0.88, 27.55); W.freezer.lid.geometry.translate(0, 0, 0.39); W.freezer.lid.position.z = 27.55 - 0.39; boxWalls(8.6, 27.55, 1.6, 0.75, 0, -1, 1.0); contact(8.6, 0, 27.5, 2.2, 1.3);
  box(0.4, 0.3, 0.3, MAT.frost, 8.6, 0.6, 27.5); W.freezerLight = practical(8.6, 1.0, 27.3, 0xcfe8ff, 0, 3.5);
  const cat = new THREE.Group(); const cb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), MAT.catfur); cb.scale.set(1, 0.7, 1.5); cb.position.y = 0.12; cat.add(cb); const ch = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), MAT.catfur); ch.position.set(0, 0.24, 0.2); cat.add(ch);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 6), MAT.catfur); e.position.set(s * 0.06, 0.33, 0.2); cat.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ color: 0xb6ff3a })); ey.position.set(s * 0.04, 0.26, 0.29); cat.add(ey); cat.userData[s < 0 ? 'l' : 'r'] = ey; });
  const ct = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.4, 6), MAT.catfur); ct.rotation.z = 1.2; ct.position.set(0.15, 0.1, -0.2); cat.add(ct); const chest = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), MAT.white); chest.position.set(0, 0.16, 0.26); cat.add(chest);
  cat.position.set(8.6, 0.91, 27.5); cat.rotation.y = PI; cat.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(cat); W.cat = cat;
  interact(8.6, 26.6, 1.3, 'OPEN THE FREEZER', () => openFreezer(), 0);
  plaque([{ t: '"THE SECOND FREEZER"', s: 0.42 }, { t: 'YOU KNOW WHAT YOU DID.', s: 0.2 }], 8.6, 1.5, 27.97, PI, 0.9, 0.3);
  plaque([{ t: '"THE BODEGA CAT"', s: 0.42 }, { t: 'THE ONLY ONE DOWN HERE WHO RESPECTS YOU. STILL NO.', s: 0.18 }], 7.3, 1.55, 27.97, PI, 0.9, 0.3);
  salon(5.03, 27.5, 5.03, 20.0, PI / 2, 6, { rows: [1.0, 1.9], h: 0.5, gap: 0.3 }); salon(12.97, 19.5, 12.97, 23.0, -PI / 2, 3, { rows: [1.6], h: 0.5, gap: 0.3 }); salon(12.5, 27.97, 9.6, 27.97, PI, 3, { rows: [2.1], h: 0.5, gap: 0.3 });
  bulb(9, 2.4, 22, 0xffd3a0, 5, 8); bulb(9, 2.4, 26, 0xffd3a0, 4, 7);
})();

/* --- 8. MOM'S SECOND FREEZER: through the lid, a 3.6 m cold room. Twenty paintings on frost. A door back to the stairs. --- */
(function coldRoom() {
  const x0 = 20, x1 = 28, z0 = 20, z1 = 28, H = 3.6;
  const frostWall = MAT.cinder.clone(); frostWall.color.set(0xcfe0ec); room(x0, x1, z0, z1, H, { floor: MAT.enamel, wall: frostWall, ceil: MAT.frost }, [{ side: 'n', at: 24, w: 1.0, h: 2.05 }]); aoRoom(x0, x1, z0, z1, 0.5);
  wall(23.5, z0 - 0.3, 24.5, z0 - 0.3); W.coldDoor = box(0.95, 2.0, 0.06, MAT.white, 24, 1.0, z0 - 0.1); interact(24, 21, 1.3, 'GO BACK UP', () => { teleport(0, 21.5, PI); toast('THE FREEZER LET YOU OUT AT THE STAIRS. IT DOES THAT.', 'blue'); flash('#cfe8ff'); }, 0);
  // frost ridges, the forgotten food, a mausoleum for the lost socks, the hourglass of the lease
  for (let i = 0; i < 40; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05 + rnd() * 0.12, 0.1 + rnd() * 0.3, 5), MAT.frost); const side = Math.floor(rnd() * 4); const t = rnd(); f.position.set(side === 0 ? x0 + 0.1 : side === 1 ? x1 - 0.1 : x0 + t * 8, 0.08, side === 2 ? z0 + 0.1 : side === 3 ? z1 - 0.1 : z0 + t * 8); f.rotation.z = (rnd() - 0.5) * 0.6; scene.add(f); }
  const en = (x, z, ry, lines) => { box(0.45, 0.1, 0.3, MAT.white, x, 0.05, z, ry); plaque(lines, x, 0.1, z + 0.16, ry, 0.42, 0.08, { bg: '#1c3f8f', back: false }); };
  en(21, 21, 0.2, [{ t: 'ENTENMANN\'S', s: 0.6 }]); en(21.4, 21.1, -0.1, [{ t: 'ENTENMANN\'S', s: 0.6 }]); en(21.2, 21.3, 0.4, [{ t: 'ENTENMANN\'S', s: 0.6 }]); en(26.6, 26.5, 1.3, [{ t: 'LASAGNA 2019', s: 0.5, f: 'mono' }]); en(26.3, 26.2, 1.1, [{ t: 'DO NOT TOUCH', s: 0.5, f: 'mono' }]);
  prop('mausoleum', 24, 0, 26.6, PI, 1.4, { label: 'The mausoleum of the lost socks' }); post(24, 26.6, 0.8, -1, 2); prop('hourglass', 21.5, 0, 26.8, 0.6, 0.5); prop('freezerdoor', 27.95, 0, 23.5, -PI / 2, 2.0); prop('eyekey', 24, 1.2, 23.5, 0, 0.35, { label: 'The eye key', tick: (s, dt) => { if (s.root) { s.root.rotation.y += dt * 1.2; s.root.position.y = 1.2 + Math.sin(T * 2) * 0.1; } } });
  practical(24, 1.6, 23.5, 0x2962FF, 1.6, 3); W.keyPad = padCirc(24, 23.5, 0.5, 0.45, -1); cyl(0.5, 0.55, 0.45, MAT.frost, 24, 0.225, 23.5, 20);
  plaque([{ t: '"THE COLD ROOM"', s: 0.42 }, { t: 'FREEZER BURN IS A FORM OF MEMORY.', s: 0.2 }], 24, 2.9, z1 - 0.03, PI, 0.9, 0.3);
  plaque([{ t: '"THE MAUSOLEUM"', s: 0.42 }, { t: 'EVERY SOCK THE DRYER TOOK. THEY ARE AT PEACE.', s: 0.18 }], 24, 1.9, z1 - 0.03, PI, 0.9, 0.3);
  salon(x0 + 0.03, z1 - 0.5, x0 + 0.03, z0 + 0.5, PI / 2, 7, { rows: [1.2, 2.2], h: 0.6, gap: 0.3 }); salon(x1 - 0.03, z0 + 0.5, x1 - 0.03, z1 - 0.5, -PI / 2, 7, { rows: [1.2, 2.2], h: 0.6, gap: 0.3 }); salon(x1 - 0.5, z0 + 0.03, x0 + 0.5, z0 + 0.03, 0, 6, { rows: [1.5, 2.6], h: 0.6, gap: 0.3 });
  tube(22, 3.3, 24, 2.4, 0, 0xdfeeff, 6, 9); tube(26, 3.3, 24, 2.4, 0, 0xdfeeff, 6, 9); zone(x0, x1, z0, z1, "MOM'S SECOND FREEZER");
})();
