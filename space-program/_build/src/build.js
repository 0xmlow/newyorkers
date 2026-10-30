// N3W YORKERS SPACE PROGRAM, room by room. The city left for the moon because the rent was right. The spacecraft are
// MLow's own M.Texture GLBs (NASA and Smithsonian models wrapped in his paintings), the props are Poly Haven (CC0) through
// the NEW YORKERS Blender lane, the cast are ON LOCATION's Tripo New Yorkers with eye flowers for heads.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { PI, INK, DZ1, DZ2, DH, Reflector, basic, std, here, local, shell, eyeFlower, decal, glowTex, glow, bulbs, watcher, extra, headTex, plaque, notice, board, label, plinth, column, confetti, slotsDefault, slotsSouthOnly, slotsWestFree, lane, stanchions, prop, cast, queue } from './kit.js';
export { eyeFlower };

// a flag on a pole: the census mark, in the house colours
function flag(c, g, X, x, z, text = 'N3W YORKERS') {
  const { THREE } = c; const pole = c.slab(0.05, 3.2, 0.05, std(c, 0xd8d8d8, { metalness: 0.9, roughness: 0.3 }), x, 1.6, z); g.add(pole); c.post(X(x), z, 0.1);
  const f = c.sign(text, { w: 1.4, h: 0.8, bg: '#1d4ed8', fg: '#f4ead2', font: c.FONT, weight: 900, px: 160, border: '#f5c542' }); f.position.set(x + 0.72, 2.75, z); g.add(f);
  c.tick((t) => { f.rotation.y = Math.sin(t * 2.1 + x) * 0.12; f.position.y = 2.75 + Math.sin(t * 3) * 0.02; }); return f;
}
// a console: a desk, a screen that draws itself, a chair
function console_(c, g, X, x, z, ry, draw) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  o.add(c.slab(1.8, 0.05, 0.8, std(c, 0x9aa0a8, { metalness: 0.6, roughness: 0.4 }), 0, 0.76, 0)); for (const a of [-0.8, 0.8]) o.add(c.slab(0.06, 0.76, 0.7, std(c, 0x3a3e46), a, 0.38, 0));
  const b = board(c, o, 1.2, 0.7, 256); b.m.position.set(0, 1.25, -0.3); b.m.rotation.x = -0.2; o.add(c.slab(1.3, 0.78, 0.06, std(c, 0x1a1c22), 0, 1.25, -0.34));
  c.post(X(x), z, 0.9); b.draw = draw; return b;
}

const ROOM = {
  // MISSION CONTROL. The countdown runs only while nobody in the room is looking at it.
  control(c, r, g, X) {
    const { THREE } = c;
    const CD = { t: 600, launched: false, stared: 0, watched: false, go: [false, false, false, false, false] };
    const big = board(c, g, 7, 2.4, 512); big.m.position.set(10, 4.2, -D / 2 + 0.3);
    const fmt = (s) => { const m = Math.floor(s / 60), ss = Math.floor(s % 60); return `T MINUS ${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
    const drawBig = (seen) => { const { q, W: w2, H: h2 } = big; q.fillStyle = '#05070c'; q.fillRect(0, 0, w2, h2); q.fillStyle = seen ? '#ff4a4a' : '#5aff8a'; q.font = `900 ${h2 * 0.42}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(CD.launched ? 'LIFTOFF' : fmt(CD.t), w2 / 2, h2 * 0.56); q.fillStyle = '#f5c542'; q.font = `700 ${h2 * 0.11}px ${c.MONO}`; q.fillText(CD.launched ? 'THE PAD IS CLEAR · WALK EAST' : seen ? 'HOLD · SOMEBODY IS WATCHING' : 'COUNTING · NOBODY IS WATCHING', w2 / 2, h2 * 0.82); q.textAlign = 'left'; q.font = `600 ${h2 * 0.08}px ${c.MONO}`; q.fillStyle = '#8d8676'; q.fillText('N3W YORKERS SPACE PROGRAM · FLOYD BENNETT FIELD · FUNDED BY THE FARE HIKE', 24, h2 * 0.14); big.up(); };
    drawBig(false);
    const fwd = new THREE.Vector3(); let ac = 0;
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || CD.launched) return; c.camera.getWorldDirection(fwd); const L = local(r, P); const dx = 10 - L.x, dz = -D / 2 - L.z, d = Math.hypot(dx, dz), dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6);
      const seen = dot > 0.72 && c.P.pitch > -0.5;
      if (seen) { CD.stared += dt; if (CD.stared > 8 && !CD.watched) { CD.watched = true; c.egg('watched', 'A watched countdown never counts. Turn around. It only moves while nobody in the room is looking at it.'); } }
      else { CD.stared = 0; CD.t -= dt * 6; }
      if (CD.t <= 0) { CD.t = 0; CD.launched = true; c.sound.boom && c.sound.boom(); c.shake(0.25); c.flash(0.8); c.egg('liftoff', 'Liftoff. The pad is on Rockaway Beach, next door. Nobody in this room saw it happen, which is how it happened.'); setTimeout(() => c.toast('The rocket is on the beach. Walk east to the pad.', 4200), 1200); }
      ac += dt; if (ac > 0.2) { ac = 0; drawBig(seen); } });
    // five consoles, five GO NO GO calls
    const NAMES = ['FIDO', 'GUIDO', 'EECOM', 'RETRO', 'CAPCOM'], Q = ['Fuel: a bodega pump on Avenue U. GO.', 'Guidance: the Belt Parkway, then up. GO.', 'Environment: 70 degrees and the smell of the ocean. GO.', 'Retro: we can always take the ferry back. GO.', 'Capcom: the astronaut says what. GO.'];
    NAMES.forEach((n, k) => { const x = 3.2 + k * 3.4, b = console_(c, g, X, x, 1.4, 0, null); const draw = () => { const { q, W: w2, H: h2 } = b; q.fillStyle = CD.go[k] ? '#0a2a14' : '#0a0c14'; q.fillRect(0, 0, w2, h2); q.fillStyle = CD.go[k] ? '#5aff8a' : '#ff8a4a'; q.font = `800 ${h2 * 0.26}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(n, w2 / 2, h2 * 0.4); q.fillText(CD.go[k] ? 'GO' : 'NO GO', w2 / 2, h2 * 0.78); b.up(); }; draw();
      c.clickable(b.m, () => { CD.go[k] = !CD.go[k]; draw(); c.sound.beep && c.sound.beep(); c.say(b.m, Q[k], 3000, 0.9); if (CD.go.every(Boolean)) c.egg('go', 'Five GO calls. Flight, we are go for a launch nobody will watch. That is the only kind we can afford.'); }, n + ' console (click for GO)');
      const e = extra(c, g, x, 2.2, { seated: true, col: [0x2a3a6a, 0x3a2a4a, 0x2a4a3a, 0x4a2a2a, 0x3a3a2a][k], ry: PI }); e.userData.body.scale.y = 0.9; });
    for (const x of [3.2, 6.6, 10, 13.4, 16.8]) prop(c, r, g, X, 'SchoolChair_01', x, 2.3, { h: 0.9, ry: PI, shadow: true });
    // the flight director and the model of the room he wishes he had
    cast(c, r, g, X, 'agent', 10, -3.6, { h: 1.85, ry: PI, line: () => CD.launched ? 'It is up. Nobody saw it go. Perfect launch.' : 'Flight here. The clock only runs when the room is empty. Budget cuts. Turn around.', hint: 'The flight director', egg: 'flight' });
    plinth(c, g, X, 1.4, -4.6, 1.3, 0.9, 1.0); const jsc = c.glb('nasa_jsc-mission-control-room', { len: 1.2, x: 1.4, y: 0.9, z: -4.6, ry: 0.4, parent: g }); c.clickable(jsc, () => c.say(jsc, 'A model of the mission control we were promised. In the budget it is called "the painting".', 3400, 1.3), 'The model'); label(c, g, 1.4, 0.5, -4.0, 0, ['MISSION CONTROL, MODEL', 'the one in the brochure', '"A RENDERING"']);
    plinth(c, g, X, 18.6, -4.6, 1.3, 0.9, 1.0); const mess = c.glb('mercury-surface-space-environment-geochemistry-and-ranging-messenger', { len: 1.2, x: 18.6, y: 1.0, z: -4.6, ry: -0.4, parent: g }); c.tick((t) => { mess.rotation.y = t * 0.3; }); c.clickable(mess, () => c.say(mess, 'MESSENGER. Went to Mercury. Came back for the fare.', 2600, 1.3), 'A probe');
    prop(c, r, g, X, 'classic_laptop', 10, 0.8, { len: 0.5, y: 0.78, egg: ['A laptop', 'laptop', 'The launch software is a spreadsheet. The spreadsheet is a napkin. The napkin says GO.'] });
    prop(c, r, g, X, 'vintage_radio_transceiver', 16.8, 0.8, { len: 0.5, y: 0.78, egg: ['The radio', 'radio', 'Houston does not pick up. Houston never picks up. We call Flushing. Flushing picks up.'] });
    prop(c, r, g, X, 'fire_alarm', 0.3, 2.4, { h: 0.3, y: 1.8, ry: PI / 2 });
    notice(c, g, '"MISSION" CONTROL · "LAUNCH" IS A STATE OF MIND', 10, 2.6, -D / 2 + 0.3, 0, 4.4, 0.36, '#0d0d0d', '#f5c542');
    plaque(c, g, 10, 3.2, D / 2 - 0.13, PI, 'FUNDED BY THE "FARE HIKE"', 'THE N3W YORKERS SPACE PROGRAM', 2.4);
  },

  // THE LAUNCH PAD. Walk at the rocket; the lens widens and the pad stays where it is. Click it to go up.
  pad(c, r, g, X) {
    const { THREE } = c;
    const px = 10, pz = -4.4;
    g.add(c.slab(6, 0.6, 6, std(c, 0x7a7a7a, { roughness: 0.9 }), px, 0.3, pz)); c.wall(X(px - 3), pz - 3, X(px + 3), pz - 3); c.wall(X(px - 3), pz + 3, X(px + 3), pz + 3); c.wall(X(px - 3), pz - 3, X(px - 3), pz + 3); c.wall(X(px + 3), pz - 3, X(px + 3), pz + 3);
    const rocket = c.glb('ares-1-a', { h: 9, x: px, y: 0.6, z: pz, parent: g, shadow: false }); const atlas = c.glb('atlas-9-faith-7', { h: 4.2, x: px + 2.2, y: 0.6, z: pz + 1.8, parent: g, shadow: false });
    // the tower, the flame trench, the smoke
    for (const dz of [-2.2, 2.2]) g.add(c.slab(0.3, 9, 0.3, std(c, 0xc8402a, { metalness: 0.5, roughness: 0.6 }), px - 2.4, 5.1, pz + dz)); for (let y = 1.6; y < 9; y += 1.6) g.add(c.slab(0.2, 0.2, 4.7, std(c, 0xc8402a), px - 2.4, y, pz));
    const smoke = []; for (let i = 0; i < 14; i++) { const s = glow(c, g, px + (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.6, pz + (Math.random() - 0.5) * 3, 'rgba(220,220,230,.35)', 2.2 + Math.random() * 2); smoke.push(s); }
    c.tick((t) => smoke.forEach((s, i) => { s.position.y = 0.4 + Math.sin(t * 0.6 + i) * 0.25; s.material.opacity = 0.5 + Math.sin(t * 0.8 + i * 2) * 0.2; }));
    // the dolly zoom: the field of view narrows with the distance to the pad, and the engine pulls the camera back
    r.fov = (P) => { const L = local(r, P); const d = Math.hypot(L.x - px, L.z - pz); return 66 - Math.max(0, Math.min(1, (10 - d) / 8)) * 34; };
    let near = false; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P), d = Math.hypot(L.x - px, L.z - pz); if (d < 4.6 && !near) { near = true; c.sound.drone && c.sound.drone(); c.egg('vertigo', 'The closer you walk, the further the pad gets. The lens does that. Hitchcock did it to a bell tower. We did it to a rocket on the beach.'); } if (d > 7) near = false; });
    // strap in: a ride up the tower and out of the room
    c.clickable(rocket, () => { if (r.launching) return; r.launching = true; c.toast('Strapped in. Hold on to something. Hold on to nothing. Nothing is what we have.', 3000); c.sound.boom && c.sound.boom();
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(r.x0 + px - 4.2, 1.6, pz + 5), new THREE.Vector3(r.x0 + px - 4.4, 4, pz + 4), new THREE.Vector3(r.x0 + px - 4.6, 9, pz + 2), new THREE.Vector3(r.x0 + px - 3, 16, pz - 2), new THREE.Vector3(r.x0 + px, 26, pz - 10)]);
      c.ride(curve, 7, () => { c.flash(1); c.shake(0.3); c.egg('ride', 'Up and out. Rockaway got small, then Brooklyn got small, then the rent got small. Welcome to low Earth orbit, next car.'); setTimeout(() => { c.P.lift = 0; c.go(r.i + 1); r.launching = false; }, 400); }); }, 'The rocket (strap in)');
    label(c, g, px - 3.4, 0.9, pz + 3.2, 0, ['ARES, ONE OF THEM', 'wrapped, fuelled, on a beach', '"CLICK TO BOARD"']);
    // the beach: the suit, the hot dog cart, the pigeon lady, the generator the whole program runs on
    const suit = c.glb('ph_metal_toolbox', { len: 1.0, x: 4.2, z: 1.6, ry: 0.5, parent: g }); c.post(X(4.2), 1.6, 0.5); c.clickable(suit, () => { c.say(suit, 'The suit is at the cleaners. The toolbox is wrapped. Those are the two facts.', 2800, 1.0); c.egg('suit', 'No suit. The program sent it to a dry cleaner on Beach 116th in March. The ticket is in the toolbox. The toolbox is wrapped. Launch is now.'); }, 'The toolbox'); label(c, g, 4.2, 0.5, 2.3, 0, ['THE SUIT', 'at the cleaners since March', '"LAUNCH ANYWAY"']);
    cast(c, r, g, X, 'hotdog', 16.2, 2.2, { h: 1.8, ry: -0.6, line: 'Hot dog, thirty seven dollars. Launch price. Tomorrow it is forty.', hint: 'The vendor', egg: 'hotdog' });
    prop(c, r, g, X, 'CoffeeCart_01', 17.4, 0.6, { len: 2.0, ry: -PI / 2, r: 1.0 });
    cast(c, r, g, X, 'pigeonlady', 2.6, -1.8, { h: 1.72, ry: 0.9, line: 'The pigeons are not coming. The pigeons have seen a launch. The pigeons are smarter than the program.', hint: 'The pigeon lady' });
    prop(c, r, g, X, 'portable_generator', 15.2, -5.4, { len: 1.4, ry: 0.4, r: 0.8, egg: ['The generator', 'generator', 'The whole program runs off this generator. It runs off a gas can. The gas can is from a station on Cross Bay Boulevard that closed in 2019.'] });
    prop(c, r, g, X, 'metal_jerrycan', 16.6, -5.0, { h: 0.5, r: 0.3 }); prop(c, r, g, X, 'propane_tank', 3.4, -5.4, { h: 1.2, r: 0.5 }); prop(c, r, g, X, 'concrete_road_barrier', 6.4, 0.4, { len: 2.0, ry: 0.2, r: 1.0 }); prop(c, r, g, X, 'concrete_road_barrier', 13.6, 0.4, { len: 2.0, ry: -0.2, r: 1.0 });
    prop(c, r, g, X, 'ocean_buoy', 18.6, -6.4, { h: 1.6, r: 0.5, bob: 1.2 }); flag(c, g, X, 1.4, 5.0);
    const g2 = c.glb('gull', { len: 0.8, x: 10, y: 3.2, z: 1, parent: g, shadow: false }); c.tick((t) => { g2.position.set(10 + Math.sin(t * 0.5) * 7, 3.2 + Math.sin(t * 1.2) * 0.3, 1 + Math.cos(t * 0.5) * 3); g2.rotation.y = Math.atan2(Math.cos(t * 0.5) * 7, -Math.sin(t * 0.5) * 3); });
    notice(c, g, '"ROCKAWAY" SPACEPORT · NO SWIMMING DURING LAUNCH', 10, 0.06, 4.6, 0, 3.2, 0.3, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
  },

  // THE CAPSULE. A subway car in orbit. Gravity is off. SPACE pushes off the floor.
  capsule(c, r, g, X) {
    const { THREE } = c;
    const Z = { vy: 0, on: false, floated: false, vx: 0, vz: 0 };
    r.holdLift = true;
    r.onEnter = () => { Z.on = true; c.toast('Zero G. SPACE pushes you off the floor. Walking drifts. Stand clear of the closing airlock.', 4200); };
    r.onLeave = () => { Z.on = false; c.P.lift = 0; };
    const key = (e) => { if (!Z.on || e.repeat || e.code !== 'Space') return; Z.vy = Math.max(Z.vy, 1.6); c.sound.whoosh && c.sound.whoosh(); if (!Z.floated) { Z.floated = true; c.egg('float', 'You pushed off. In orbit the floor is a suggestion. So is the ceiling. So, lately, is the fare.'); } };
    addEventListener('keydown', key);
    const ob = document.getElementById('olliebtn'); if (ob) ob.addEventListener('click', () => { if (Z.on) key({ code: 'Space' }); });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; Z.vy -= dt * 0.35; c.P.lift += Z.vy * dt; if (c.P.lift > 3.6) { c.P.lift = 3.6; Z.vy = -Math.abs(Z.vy) * 0.3; } if (c.P.lift < 0) { c.P.lift = 0; if (Z.vy < -0.6) c.sound.thud && c.sound.thud(0.2); Z.vy = 0; } });
    r.move = (P, nx, nz, dt) => { Z.vx += ((nx - P.x) / Math.max(dt, 1e-3) - Z.vx) * Math.min(1, dt * 1.2); Z.vz += ((nz - P.z) / Math.max(dt, 1e-3) - Z.vz) * Math.min(1, dt * 1.2); return [P.x + Z.vx * dt, P.z + Z.vz * dt]; };
    // the car: seats, poles, straps, the ads, and things that float
    const steel = std(c, 0xb8bcc2, { metalness: 0.9, roughness: 0.3 }), orange = std(c, 0xff8a1a, { roughness: 0.6 }), yellow = std(c, 0xf5c542, { roughness: 0.6 });
    for (const z of [-5.6, 5.6]) for (let x = 2; x < 19; x += 1.2) { const s = c.slab(1.0, 0.1, 0.9, (x / 1.2 | 0) % 2 ? orange : yellow, x, 0.5, z); g.add(s); g.add(c.slab(1.0, 0.8, 0.1, (x / 1.2 | 0) % 2 ? orange : yellow, x, 0.95, z + (z > 0 ? 0.4 : -0.4))); }
    c.wall(X(1.5), -5.1, X(19), -5.1); c.wall(X(1.5), 5.1, X(19), 5.1);
    for (const x of [4, 8, 12, 16]) { g.add(c.slab(0.05, 5.9, 0.05, steel, x, 2.95, -3)); g.add(c.slab(0.05, 5.9, 0.05, steel, x, 2.95, 3)); c.post(X(x), -3, 0.12); c.post(X(x), 3, 0.12); }
    for (let x = 2.5; x < 18; x += 1.5) for (const z of [-2.4, 2.4]) { const st = c.slab(0.04, 0.5, 0.04, std(c, 0x1a1a1a), x, 5.4, z); g.add(st); c.tick((t) => { st.rotation.x = Math.sin(t * 1.3 + x) * 0.5; st.rotation.z = Math.cos(t * 0.9 + x) * 0.5; }); }
    // the floaters: the command module, a duck, an apple, a wrench, a cassette player
    const F = [['si_nasm_command-module-apollo-11', 10, 2.4, 0, { len: 1.6 }], ['ph_rubber_duck_toy', 5, 2.0, 1.2, { h: 0.4 }], ['ph_food_apple_01', 14, 1.8, -1.0, { h: 0.2 }], ['ph_cassette_player', 7, 2.6, -1.6, { len: 0.5 }], ['ph_hatchet', 15.5, 2.2, 1.4, { len: 0.5 }], ['ph_wooden_bowl_01', 3.2, 1.6, 0.6, { len: 0.4 }]];
    F.forEach(([name, x, y, z, o], k) => { const m = c.glb(name, { ...o, x, y, z, parent: g, shadow: false }); c.tick((t) => { m.position.set(x + Math.sin(t * 0.4 + k) * 1.2, y + Math.sin(t * 0.7 + k * 2) * 0.6, z + Math.cos(t * 0.5 + k) * 0.8); m.rotation.set(t * 0.3 + k, t * 0.5, t * 0.2); });
      c.clickable(m, () => { const L = ['The command module. Apollo 11. It is in here because the museum lent it and never asked for it back.', 'The duck floats in the bath. The duck floats here. The duck does not know the difference. Neither do you.', 'An apple from the bodega on Mars. Eight minutes old. Eight minutes is nothing. Eight minutes is a transfer at Jay Street.', 'The cassette player. One tape. The tape is the announcements. The announcements are the music.', 'A hatchet. For the airlock. The airlock is a door. The door is the problem.', 'A bowl. Somebody tried soup.']; c.say(m, L[k], 3200, 0.6); if (k === 1) c.egg('duck', 'The duck. It floated down a sewer once, a long time ago, in another gallery. It has been promoted.'); }, 'A floater'); });
    // the pilot is a cabbie; the passengers hold the poles
    cast(c, r, g, X, 'cabbie', 18.2, 0, { h: 1.8, ry: -PI / 2, line: 'Fare to orbit is two ninety. Transfers are free. There is nowhere to transfer to.', hint: 'The pilot', egg: 'fare' });
    for (const [x, z, col] of [[4.6, -4.6, 0x2a3a6a], [14.2, 4.6, 0x3a2a4a], [13.6, -4.6, 0x4a3a2a]]) { const e = extra(c, g, x, z, { seated: true, col, ry: z < 0 ? 0 : PI }); c.tick((t) => { e.position.y = Math.sin(t * 0.8 + x) * 0.2 + 0.1; }); }
    // the airlock chime, and the doors that close on the beat
    const doors = [c.slab(1.4, 2.2, 0.1, steel, W - 1.1, 1.1, 2.0), c.slab(1.4, 2.2, 0.1, steel, W - 1.1, 1.1, 5.6)]; doors.forEach((d) => g.add(d));
    let ph = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; ph += dt; const k = (ph % 9) / 9, open = k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.15); doors[0].position.z = 2.0 + (1 - open) * 1.6; doors[1].position.z = 5.6 - (1 - open) * 1.6; if (((ph % 9) | 0) === 5 && !r._chimed) { r._chimed = true; c.sound.ding(); setTimeout(() => c.sound.ding(), 350); } if ((ph % 9) < 1) r._chimed = false; });
    notice(c, g, 'STAND CLEAR OF THE CLOSING "AIRLOCK"', W - 1.1, 2.6, 3.8, -PI / 2, 2.6, 0.3, '#0d0d0d', '#f5c542');
    const ad = c.sign('N3W YORKERS · THE CENSUS IS IN ORBIT · 7,542 COUNTED · NOBODY SOLD TWICE', { w: 6, h: 0.5, bg: '#f4ead2', fg: '#111', font: c.FONT, weight: 800 }); ad.position.set(10, 4.6, D / 2 - 0.16); ad.rotation.y = PI; g.add(ad);
    plaque(c, g, 10, 3.6, D / 2 - 0.13, PI, 'THE SUBWAY CAR WAS "FREE"', 'PROCUREMENT', 2.2);
  },

  // THE MOON. One sixth gravity, footprints that stay, alternate side parking for the lander.
  moon(c, r, g, X) {
    const { THREE } = c;
    const M = { vy: 0, on: false, jumped: false, steps: 0, lastX: 0, lastZ: 0, side: 0, ticketed: 0, win: 0, timer: 90 };
    r.holdLift = true;
    r.onEnter = () => { M.on = true; c.toast('The moon. SPACE jumps. One sixth gravity, the same alternate side parking.', 3800); };
    r.onLeave = () => { M.on = false; c.P.lift = 0; };
    const key = (e) => { if (!M.on || e.repeat || e.code !== 'Space' || c.P.lift > 0.05) return; M.vy = 5.2; c.sound.whoosh && c.sound.whoosh(); };
    addEventListener('keydown', key); const ob = document.getElementById('olliebtn'); if (ob) ob.addEventListener('click', () => { if (M.on) key({ code: 'Space' }); });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; M.vy -= dt * 3.2; c.P.lift += M.vy * dt; if (c.P.lift > 2.4 && !M.jumped) { M.jumped = true; c.egg('jump', 'Two and a half metres straight up. On Earth that is a career. Here it is a Tuesday.'); } if (c.P.lift < 0) { if (M.vy < -1.5) { c.sound.thud && c.sound.thud(0.3); c.shake(0.03); } c.P.lift = 0; M.vy = 0; } });
    // footprints that stay: an instanced boot print wherever you step
    const N = 400, fp = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 0.3).rotateX(-PI / 2), basic(c, 0x707070, { transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), N); fp.count = 0; fp.frustumCulled = false; fp.renderOrder = 1; g.add(fp); const mm = new THREE.Matrix4(), ee = new THREE.Euler();
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || c.P.lift > 0.1) return; const L = local(r, P); if (Math.hypot(L.x - M.lastX, L.z - M.lastZ) > 0.55) { M.lastX = L.x; M.lastZ = L.z; const k = M.steps % N; ee.set(0, c.P.yaw, 0); mm.makeRotationFromEuler(ee); mm.setPosition(L.x + Math.cos(c.P.yaw) * (M.steps % 2 ? 0.16 : -0.16), 0.012, L.z - Math.sin(c.P.yaw) * (M.steps % 2 ? 0.16 : -0.16)); fp.setMatrixAt(k, mm); fp.count = Math.min(N, fp.count + 1); fp.instanceMatrix.needsUpdate = true; M.steps++; if (M.steps === 40) c.egg('footprints', 'Forty footprints. They stay forever up here. No wind, no sanitation, no super. The first clean floor in the city.'); } });
    // the lander, parked on the wrong side; the sweeper comes every ninety seconds
    const crater = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 40), std(c, 0x6a6a68, { roughness: 1 })); crater.rotation.x = -PI / 2; crater.position.set(10, 0.01, -2.4); g.add(crater);
    const sides = [[5.4, -2.4], [14.6, -2.4]]; const lander = c.glb('nasa_apollo-lunar-module', { len: 3.6, x: sides[0][0], z: sides[0][1], parent: g, ry: 0.4 }); const lpost = c.post(X(sides[0][0]), sides[0][1], 1.8);
    const sweeper = cast(c, r, g, X, 'clerk', -2, 2.4, { h: 1.76, ry: PI / 2, r: 0, line: 'Street cleaning. Nine to ten thirty. Lunar time. You knew.', hint: 'The sweeper' }); sweeper.visible = false;
    const sb = board(c, g, 2.2, 1.2, 256); sb.m.position.set(10, 2.2, -6.2); const drawSB = () => { const { q, W: w2, H: h2 } = sb; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#c81e1e'; q.font = `900 ${h2 * 0.22}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('NO PARKING', w2 / 2, h2 * 0.3); q.fillStyle = '#111'; q.font = `700 ${h2 * 0.13}px ${c.FONT}`; q.fillText(M.side ? 'WEST SIDE OF CRATER' : 'EAST SIDE OF CRATER', w2 / 2, h2 * 0.52); q.fillText(`SWEEPER IN ${Math.ceil(M.timer)} S`, w2 / 2, h2 * 0.72); q.font = `600 ${h2 * 0.1}px ${c.MONO}`; q.fillText('LUNAR DOT', w2 / 2, h2 * 0.9); sb.up(); }; drawSB();
    const move = () => { M.side = 1 - M.side; const [x, z] = sides[M.side]; lander.position.set(x, 0, z); lpost.x = X(x); lpost.z = z; c.sound.whoosh && c.sound.whoosh(); };
    c.clickable(lander, () => { if (M.sweeping) { c.toast('Too late. He is already writing.', 2000); return; } move(); M.moved = (M.moved || 0) + 1; c.toast(`Moved the lander to the ${M.side ? 'east' : 'west'} side. ${Math.ceil(M.timer)} seconds until the sweeper.`, 2600); if (M.moved === 3) c.egg('altside', 'Three moves. Alternate side parking on the moon. The sweeper has never swept. The sweeper only writes.'); }, 'The lander (move it)');
    let sc = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; M.timer -= dt; sc += dt; if (sc > 1) { sc = 0; drawSB(); }
      if (M.timer <= 0 && !M.sweeping) { M.sweeping = true; sweeper.visible = true; sweeper.position.set(-1, 0, sides[M.side][1] + 2.2); }
      if (M.sweeping) { const tx = sides[M.side][0]; sweeper.position.x += (tx - sweeper.position.x) * Math.min(1, dt * 0.8); sweeper.rotation.y = PI / 2; if (Math.abs(sweeper.position.x - tx) < 0.5) { M.sweeping = false; M.timer = 90; M.ticketed++; const tk = decal(c, 0.5, 0.7, (q, w, h) => { q.fillStyle = '#ff8a1a'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.14}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('VIOLATION', w / 2, h * 0.3); q.font = `700 ${h * 0.1}px ${c.MONO}`; q.fillText('$65 · LUNAR', w / 2, h * 0.55); q.fillText(`#${M.ticketed}`, w / 2, h * 0.8); }); tk.position.set(sides[M.side][0] - 1.2 + M.ticketed * 0.1, 1.4, sides[M.side][1] + 1.6); g.add(tk); c.sound.ticket && c.sound.ticket(); c.say(sweeper, 'Sixty five dollars. Lunar.', 2600, 2.0); if (M.ticketed === 2) c.egg('ticket', 'Two tickets on the lander. The program is now in debt to the Department of Transportation of the moon, which is one guy.'); setTimeout(() => { sweeper.visible = false; sweeper.position.x = -2; }, 3000); } } });
    // moon rocks, the flag, the orbiter overhead, the Earth
    for (const [x, z, s] of [[3, -6, 1.2], [17, -5.5, 1.6], [2.4, 4.4, 0.9], [16.8, 4.8, 1.3], [8, 5.2, 0.8]]) prop(c, r, g, X, 'boulder_01', x, z, { len: s, r: s * 0.5, ry: x });
    prop(c, r, g, X, 'coast_rocks_01', 12.4, 4.2, { len: 1.6, r: 0.7 }); flag(c, g, X, 9.2, 0.6, 'N3W YORKERS · COUNTED HERE');
    const lro = c.glb('lunar-reconnaissance-orbiter-b', { len: 1.4, x: 10, y: 7.5, z: -2, parent: g, shadow: false }); c.tick((t) => { lro.position.set(10 + Math.sin(t * 0.25) * 8, 7.5, -2 + Math.cos(t * 0.25) * 4); lro.rotation.y = t * 0.4; });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3a6acc, emissive: 0x1a3a88, emissiveIntensity: 0.4, roughness: 0.6 })); earth.position.set(16, 9, -D / 2 - 14); g.add(earth); const cl = new THREE.Mesh(new THREE.SphereGeometry(2.68, 32, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1 })); earth.add(cl); c.tick((t) => { earth.rotation.y = t * 0.05; cl.rotation.y = -t * 0.02; });
    c.clickable(earth, () => c.egg('earth', 'Earth. From here it is blue, quiet and 240,000 miles from the nearest landlord. The best view of New York is this one.'), 'Earth');
    const mrock = c.glb('moon', { len: 1.1, x: 15.6, y: 0.55, z: 1.4, parent: g, shadow: false }); c.post(X(15.6), 1.4, 0.7); c.clickable(mrock, () => c.say(mrock, 'A moon on the moon. Wrapped. The committee did not think it through.', 2600, 1.0), 'A moon');
    notice(c, g, '"TRANQUILITY" · FORMERLY THE SHEEP MEADOW', 3.8, 1.5, -6.4, 0, 2.8, 0.3, '#0d0d0d', '#f5c542');
  },

  // MARS, THE BODEGA. Everything answers three seconds late. Light delay.
  mars(c, r, g, X) {
    const { THREE } = c; let answered = 0;
    const late = (m, fn, hint) => c.clickable(m, () => { c.sound.tick && c.sound.tick(); const dots = c.say(m, '...', 3100, 1.6); setTimeout(() => { fn(); answered++; if (answered === 1) c.egg('delay', 'Three seconds. Light delay, Mars to the bodega. The real one is eight minutes. The program trimmed it. Do not ask how.'); }, 3000); }, hint);
    // the bodega: a counter, crates, the coffee, the cat
    const red = std(c, 0x9a3a28, { roughness: 0.8 }); g.add(c.slab(5, 1.0, 0.8, red, 5, 0.5, 3.6)); c.wall(X(2.5), 3.2, X(7.5), 3.2); c.wall(X(2.5), 4.0, X(7.5), 4.0);
    g.add(c.slab(5.4, 0.3, 1.0, std(c, 0xf5c542), 5, 2.9, 3.6)); notice(c, g, 'BODEGA · OPEN 24 SOLS · ATM INSIDE', 5, 2.9, 3.1, 0, 4.6, 0.3, '#f5c542', '#111');
    const catm = cast(c, r, g, X, 'sw_bodegacat', 5, 4.6, { h: 1.0, ry: PI, r: 0.4 }); late(catm, () => c.say(catm, 'Coffee is a dollar. Has been since 1997. Was on Earth. Is on Mars. The dollar is the constant.', 3600, 1.3), 'The bodega cat');
    const jug = prop(c, r, g, X, 'jug_01', 3.6, 3.6, { h: 0.5, y: 1.0 }); late(jug, () => { c.say(jug, 'Coffee. Light and sweet. One dollar. Also one dollar on the way back.', 3000, 0.8); c.egg('coffee', 'A dollar coffee on Mars. The bodega beat NASA, Elon and the MTA to Mars with a Bunn machine and a will.'); }, 'The coffee');
    const ban = prop(c, r, g, X, 'bananas', 6.4, 3.6, { len: 0.6, y: 1.0 }); late(ban, () => c.say(ban, 'Three for a dollar. They were green at launch.', 2600, 0.8), 'Bananas');
    prop(c, r, g, X, 'nyb_milkcrate_cyan', 1.6, 2.0, { h: 0.5, r: 0.4 }); prop(c, r, g, X, 'nyb_milkcrate_pink', 1.6, 2.0, { h: 0.5, y: 0.5, ry: 0.3 }); prop(c, r, g, X, 'metal_jug', 8.4, 2.6, { h: 0.5, r: 0.3 });
    // the rovers and landers, parked where New York parks: everywhere
    const R = [['nasa_curiosity-rover-simplified', 13.4, -2.6, 'Curiosity', 'Curiosity. Looks for life. Found a bodega. Stopped looking.', { len: 2.6 }], ['nasa_insight-cruise-lander', 16.6, 1.8, 'InSight', 'InSight. Listens for marsquakes. Hears the 7 train. The 7 train is on Earth. Still hears it.', { len: 2.2 }], ['nasa_mars-atmosphere-and-volatile-evolution-maven-b', 10.6, -5.0, 'MAVEN', 'MAVEN. Measures the air leaving. Relatable.', { len: 2.4 }], ['nasa_mars-reconnaissance-orbiter', 17.2, -5.2, 'MRO', 'The orbiter. Took a picture of your apartment from Mars. It was a studio. It is still a studio.', { len: 2.0 }], ['nasa_magellan', 3.0, -5.2, 'Magellan', 'Magellan. Wrong planet. Happens to the best of us. Happens to everyone at Jay Street.', { len: 2.0 }]];
    R.forEach(([name, x, z, nm, line, o]) => { const m = c.glb(name, { ...o, x, z, parent: g, ry: Math.random() * 2 }); c.post(X(x), z, 1.2); late(m, () => c.say(m, line, 3400, 1.4), nm); label(c, g, x, 0.5, z + 1.3, 0, [nm.toUpperCase(), 'parked, Gale Crater', '"THREE SECONDS"']); });
    // the dust, the cast, the eight minute clock
    const dust = []; for (let i = 0; i < 10; i++) dust.push(glow(c, g, Math.random() * W, 0.6 + Math.random(), -6 + Math.random() * 10, 'rgba(255,140,80,.25)', 2.5 + Math.random() * 2)); c.tick((t) => dust.forEach((s, i) => { s.position.x = ((s.position.x + 0.004 * (i + 2)) % W); }));
    cast(c, r, g, X, 'wiseguy', 12.4, 3.4, { h: 1.8, ry: 0.6, r: 0.4 });
    const wg = g.children[g.children.length - 1]; late(wg, () => c.say(wg, 'You from the neighborhood? Everybody here is from the neighborhood. The neighborhood is 140 million miles wide.', 3600, 2.0), 'A regular');
    const clockB = board(c, g, 2.4, 0.8, 256); clockB.m.position.set(14, 2.6, D / 2 - 0.16); clockB.m.rotation.y = PI; let delayT = 480;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; delayT = 480 + Math.sin(t * 0.1) * 60; if (((t * 2) | 0) === (((t - dt) * 2) | 0)) return; const { q, W: w2, H: h2 } = clockB; q.fillStyle = '#0d0d0d'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#ff8a4a'; q.font = `800 ${h2 * 0.3}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(`EARTH IS ${Math.round(delayT / 60)} MIN AWAY`, w2 / 2, h2 * 0.42); q.fillStyle = '#f4ead2'; q.font = `600 ${h2 * 0.2}px ${c.MONO}`; q.fillText('WE TRIMMED IT TO 3 SECONDS', w2 / 2, h2 * 0.78); clockB.up(); });
    plaque(c, g, 6, 3.4, D / 2 - 0.13, PI, 'THE COFFEE IS STILL A "DOLLAR"', 'THE BODEGA, GALE CRATER', 2.4);
  },

  // THE HUBBLE ROOM. A telescope pointed at a courtyard. One window is doing something wrong.
  hubble(c, r, g, X) {
    const { THREE } = c;
    // the mount, and the telescope you look through
    g.add(c.slab(1.2, 0.9, 1.2, std(c, 0x3a3a40, { metalness: 0.5, roughness: 0.5 }), 10, 0.45, 2.6)); c.post(X(10), 2.6, 0.9);
    const hub = c.glb('nasa_hubble-25th-anniversary-model', { h: 2.4, x: 10, y: 1.5, z: 2.6, ry: PI, parent: g, shadow: false }); hub.rotation.x = -0.9;
    c.clickable(hub, () => { c.zoom(true); c.egg('scope', 'Two billion dollars of optics pointed across a courtyard at a kitchen. In New York every telescope is pointed at a kitchen. Press Z to put it down.'); }, 'Hubble (look through it)');
    label(c, g, 10, 0.5, 3.4, 0, ['HUBBLE, 1:12', 'pointed at 3C, the kitchen', '"ASTRONOMY"']);
    // the live windows: twelve cells of one canvas atlas, redrawn at eight frames a second; one of them is wrong
    const CW = 128, CH = 96, cols = 4, rows = 3, tex = c.canvasTex(CW * cols, CH * rows, () => {}), q = tex.userData.canvas.getContext('2d');
    const wrong = 7; const scenes = ['cooking', 'tv', 'dancing', 'reading', 'plant', 'piano', 'cat', 'wrong', 'laundry', 'party', 'sleeping', 'yoga'];
    const drawCell = (k, t) => { const x0 = (k % cols) * CW, y0 = Math.floor(k / cols) * CH; q.save(); q.beginPath(); q.rect(x0, y0, CW, CH); q.clip(); q.fillStyle = ['#2a1a0a', '#1a1a2a', '#0a1a1a', '#1a0a1a'][k % 4]; q.fillRect(x0, y0, CW, CH); q.fillStyle = 'rgba(255,220,160,.25)'; q.fillRect(x0, y0, CW, CH);
      const s = scenes[k], cx = x0 + CW / 2, cy = y0 + CH / 2; q.fillStyle = '#ffe0a0';
      const fig = (fx, fy, sc, arms) => { q.fillStyle = '#222'; q.fillRect(fx - 7 * sc, fy - 18 * sc, 14 * sc, 36 * sc); q.strokeStyle = '#222'; q.lineWidth = 4 * sc; q.beginPath(); q.moveTo(fx - 6 * sc, fy - 14 * sc); q.lineTo(fx - 18 * sc, fy - 14 * sc - arms * 14 * sc + Math.sin(t * 6) * 4 * sc); q.moveTo(fx + 6 * sc, fy - 14 * sc); q.lineTo(fx + 18 * sc, fy - 14 * sc - arms * 14 * sc + Math.cos(t * 6) * 4 * sc); q.stroke(); eyeFlower(q, fx, fy - 28 * sc, 11 * sc); };
      if (s === 'cooking') { q.fillStyle = '#888'; q.fillRect(cx - 30, cy + 10, 60, 20); fig(cx - 10, cy + 8, 0.8, 0.3); q.fillStyle = 'rgba(255,255,255,.4)'; q.beginPath(); q.arc(cx + 10 + Math.sin(t * 3) * 4, cy - 10 - (t * 20 % 30), 5, 0, 7); q.fill(); }
      else if (s === 'tv') { q.fillStyle = `hsl(${(t * 60) % 360},80%,60%)`; q.fillRect(cx - 24, cy - 16, 48, 30); fig(cx + 30, cy + 10, 0.7, 0); }
      else if (s === 'dancing') { fig(cx - 14 + Math.sin(t * 4) * 8, cy + 6, 0.9, 1); fig(cx + 14 - Math.sin(t * 4) * 8, cy + 6, 0.9, 1); }
      else if (s === 'reading') { fig(cx, cy + 8, 0.8, 0.5); q.fillStyle = '#f4ead2'; q.fillRect(cx - 12, cy - 8, 24, 16); }
      else if (s === 'plant') { q.fillStyle = '#2a7a3a'; for (let i = 0; i < 5; i++) { q.beginPath(); q.ellipse(cx + Math.cos(i) * 16, cy + Math.sin(i * 2) * 10, 14, 6, i, 0, 7); q.fill(); } q.fillStyle = '#a0522d'; q.fillRect(cx - 10, cy + 12, 20, 22); }
      else if (s === 'piano') { q.fillStyle = '#111'; q.fillRect(cx - 34, cy, 68, 24); q.fillStyle = '#fff'; for (let i = 0; i < 9; i++) q.fillRect(cx - 32 + i * 7.5, cy + 2, 6, 20); fig(cx, cy + 4, 0.8, Math.abs(Math.sin(t * 5))); }
      else if (s === 'cat') { q.fillStyle = '#f5c542'; q.beginPath(); q.ellipse(cx, cy + 10, 22, 12, 0, 0, 7); q.fill(); q.beginPath(); q.arc(cx + 18, cy, 9, 0, 7); q.fill(); q.fillStyle = '#111'; q.fillRect(cx + 14, cy - 2, 2, 2); q.fillRect(cx + 20, cy - 2, 2, 2); }
      else if (s === 'wrong') { // the wrong one: somebody wrapping a pigeon in a painting, at this hour
        fig(cx - 12, cy + 8, 0.9, 1); q.fillStyle = INK[(t * 4 | 0) % INK.length]; q.beginPath(); q.ellipse(cx + 20, cy + 6, 14, 9, 0, 0, 7); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(cx + 30, cy, 4, 0, 7); q.fill(); }
      else if (s === 'laundry') { for (let i = 0; i < 4; i++) { q.fillStyle = ['#f5c542', '#ff4fa3', '#22d3ee', '#fff'][i]; q.fillRect(cx - 40 + i * 22, cy - 20 + Math.sin(t * 2 + i) * 4, 14, 22); } q.strokeStyle = '#888'; q.beginPath(); q.moveTo(x0, cy - 22); q.lineTo(x0 + CW, cy - 22); q.stroke(); }
      else if (s === 'party') { for (let i = 0; i < 4; i++) fig(cx - 36 + i * 24, cy + 10, 0.6, Math.abs(Math.sin(t * 3 + i))); q.fillStyle = `hsl(${(t * 200) % 360},90%,60%)`; q.beginPath(); q.arc(cx, y0 + 10, 5, 0, 7); q.fill(); }
      else if (s === 'sleeping') { q.fillStyle = '#334'; q.fillRect(cx - 34, cy + 4, 68, 22); q.fillStyle = '#f4ead2'; q.fillRect(cx - 30, cy + 2, 60, 8); eyeFlower(q, cx + 22, cy + 2, 8); q.fillStyle = '#fff'; q.font = '10px sans-serif'; q.fillText('z', cx + 32, cy - 8 - (t * 6 % 12)); }
      else if (s === 'yoga') { fig(cx, cy + 10, 0.8, 1 + Math.sin(t) * 0.3); }
      q.restore(); };
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6 * cols * 2.2, 0.45 * rows * 2.2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); win.position.set(0.14, 3.6, -2.2); win.rotation.y = PI / 2; g.add(win);
    const win2 = new THREE.Mesh(win.geometry, win.material); win2.position.set(W - 0.14, 3.6, -2.2); win2.rotation.y = -PI / 2; g.add(win2);
    // the brick around them, and the fire escapes
    for (const [x, ry] of [[0.26, PI / 2], [W - 0.26, -PI / 2]]) { const fe = c.glb('ph_modular_fire_escape', { h: 4.6, x: x + (x < 1 ? 0.5 : -0.5), y: 0.9, z: -2.2, ry, parent: g, shadow: false }); }
    let ac = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; ac += dt; if (ac < 0.125) return; ac = 0; for (let k = 0; k < cols * rows; k++) drawCell(k, t); tex.needsUpdate = true; });
    // click a window (through the scope or not) to name what it is doing; the wrong one is the egg
    const cells = []; for (let k = 0; k < cols * rows; k++) { for (const [wx, ry, sgn] of [[0.16, PI / 2, 1], [W - 0.16, -PI / 2, -1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.98), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); const cx = (k % cols - 1.5) * 1.32, cy = (1 - Math.floor(k / cols)) * 0.99; m.position.set(wx, 3.6 + cy, -2.2 + sgn * cx); m.rotation.y = ry; g.add(m); cells.push(m);
      c.clickable(m, () => { const S = { cooking: 'Cooking. At this hour. Onions.', tv: 'Television. The colours change. The person does not.', dancing: 'Dancing. Two people. One song. No music.', reading: 'Reading. A book. A real one. Report it.', plant: 'A plant. The tenant moved out in 2019. The plant pays the rent now.', piano: 'The piano. Every night. The same four bars. We know the four bars.', cat: 'The cat. It is looking back at the telescope. It has been looking back for a week.', wrong: 'Somebody is wrapping a pigeon in a painting at two in the morning. That one. That is the one.', laundry: 'Laundry, on the line, across the airshaft, in the dark. Hope.', party: 'A party. Four people. The music is the party next door, which is also four people.', sleeping: 'Asleep. The one honest window in the courtyard.', yoga: 'Yoga. Downward something. The something is the ceiling.' }; c.say(m, S[scenes[k]], 3600, 0.6); if (scenes[k] === 'wrong') c.egg('wrong', 'The wrong window. 3C. A New Yorker wrapping a pigeon in a painting at this hour. The telescope has a photo. The photo is a painting now.'); }, 'A window'); } }
    cast(c, r, g, X, 'lensman', 3.4, 4.4, { h: 1.78, ry: 0.8, line: 'I was watching the courtyard before the telescope. The telescope is better. The courtyard is the same.', hint: 'The photographer', egg: 'lensman' });
    prop(c, r, g, X, 'nyb_rear_camera', 4.4, 4.0, { h: 0.5, y: 0.0, hint: 'A camera', fn: (cc, m) => cc.say(m, 'A long lens. For birds. There are no birds.', 2400, 0.6) });
    prop(c, r, g, X, 'wheelchair_01', 2.4, 3.0, { len: 1.1, ry: 0.6, r: 0.5 });
    // the satellites on their poles: everything else the program could not afford to launch
    [['nasa_chandra-x-ray-observatory-2', 3, -5.2, 2.0], ['nasa_far-ultraviolet-spectroscopic-explorer', 17, -5.2, 1.6], ['nasa_aura-a', 16.4, 4.6, 1.4]].forEach(([n, x, z, len]) => { g.add(c.slab(0.06, 3.2, 0.06, std(c, 0xd8d8d8, { metalness: 0.9, roughness: 0.3 }), x, 1.6, z)); c.post(X(x), z, 0.3); const m = c.glb(n, { len, x, y: 3.3, z, parent: g, shadow: false }); c.tick((t) => { m.rotation.y = t * 0.2 + x; }); c.clickable(m, () => c.say(m, 'Also pointed at the courtyard.', 2000, 1.2), 'A satellite'); });
    prop(c, r, g, X, 'street_lamp_02', 1.6, 6.0, { h: 3.6, r: 0.3 }); prop(c, r, g, X, 'street_lamp_02', 18.4, 6.0, { h: 3.6, r: 0.3 });
    plaque(c, g, 10, 3.0, D / 2 - 0.13, PI, 'EVERY TELESCOPE POINTS AT A "WINDOW"', 'THE HUBBLE ROOM', 2.4);
  },

  // THE ASTEROID BELT. Whisper into one dish and it comes out of the other; catch what falls from the sky.
  belt(c, r, g, X) {
    const { THREE } = c;
    const d1 = c.glb('deep-space-network-34-meter', { h: 4.2, x: 3.2, z: -3.2, ry: 0.6, parent: g }); c.post(X(3.2), -3.2, 1.6);
    const d2 = c.glb('deep-space-network-70-meter', { h: 5.2, x: 16.8, z: -3.2, ry: -0.6, parent: g }); c.post(X(16.8), -3.2, 2.0);
    const LINES = ['Can you hear me.', 'The rent is due on the first.', 'I left the stove on in Astoria.', 'Tell my super the ceiling is doing it again.', 'Is anybody out there. Is anybody out there counting.', 'We are 7,542. Nobody sold twice.'];
    let li = 0; const spark = glow(c, g, 0, 0, 0, 'rgba(255,220,120,.9)', 0.8); spark.visible = false;
    const whisper = (from, to) => { const line = LINES[li++ % LINES.length]; c.say(from, `"${line}"`, 2600, 4.4); c.sound.beep && c.sound.beep(); const a = from.position.clone(), b = to.position.clone(); a.y = 3; b.y = 3.6; spark.visible = true; const t0 = performance.now();
      const step = () => { const u = Math.min(1, (performance.now() - t0) / 1800); spark.position.lerpVectors(a, b, u); spark.position.y = 3 + Math.sin(u * PI) * 5; if (u < 1) requestAnimationFrame(step); else { spark.visible = false; c.say(to, `"${line.toUpperCase()}"`, 3200, 5.4); try { const u2 = new SpeechSynthesisUtterance(line); u2.rate = 0.85; u2.pitch = 0.6; speechSynthesis.speak(u2); } catch (e) {} if (li === 3) c.egg('dish', 'Three whispers across the fairground. The dishes talk to Voyager, usually. Tonight they talk to Astoria.'); } }; step(); };
    c.clickable(d1, () => whisper(d1, d2), 'The 34 metre dish (whisper)'); c.clickable(d2, () => whisper(d2, d1), 'The 70 metre dish (whisper)');
    // what comes out of the sky: asteroids on arcs toward you; click one before it lands
    const rocks = ['asteroid-4179-toutatis', '1999-rq36-asteroid', 'eclipse-2017', 'moon']; const live = []; let caught = 0, missed = 0, nextAt = 4;
    const throwOne = (P) => { const L = local(r, P); const name = rocks[(caught + missed) % rocks.length]; const m = c.glb(name, { len: 0.7 + Math.random() * 0.6, x: 10, y: 12, z: -7, parent: g, shadow: false }); const hit = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })); m.add(hit);
      const o = { m, t: 0, x0: 10, z0: -7, x1: L.x + (Math.random() - 0.5) * 2, z1: L.z + 1.5, done: false }; live.push(o);
      c.clickable(m, () => { if (o.done) return; o.done = true; caught++; c.sound.pop && c.sound.pop(); c.flash(0.15); c.say(m, ['Caught.', 'Got it.', 'Mine.', 'Counted.'][caught % 4], 1200, 1); m.visible = false; if (caught === 3) c.egg('catch', 'Three caught. The Belt sends them and the city catches them. We have been catching things from the sky since the Dodgers.'); }, 'Catch it'); };
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; nextAt -= dt; if (nextAt <= 0 && live.filter((o) => !o.done).length < 3) { nextAt = 5 + Math.random() * 4; throwOne(P); }
      for (const o of live) { if (o.done) continue; o.t += dt / 4; const u = o.t; o.m.position.set(o.x0 + (o.x1 - o.x0) * u, 12 * (1 - u) * (1 - u) + 0.4, o.z0 + (o.z1 - o.z0) * u); o.m.rotation.x += dt; o.m.rotation.y += dt * 0.7; if (u >= 1) { o.done = true; missed++; c.sound.thud && c.sound.thud(0.4); c.shake(0.06); setTimeout(() => { o.m.visible = false; }, 4000); if (missed === 1) c.toast('One landed. It is a small crater now. The city will name it after a council member.', 3200); } } });
    // the rest of the fleet, on poles, and a supernova far off
    [['cubesat-mirata', 6.4, 2.2, 0.8], ['cloudsat-b', 13.6, 2.2, 1.4], ['ice-clouds-and-land-elevation-satellite-2-icesat-2-b', 2.4, 4.6, 1.2], ['gravity-recovery-and-climate-experiment-grace-b', 17.6, 4.6, 1.2], ['nasa_lunar-atmosphere-and-dust-environment-explorer-ladee', 9.2, 5.2, 1.2], ['lunar-laser-communications-demonstration-llcd', 12.2, -6.2, 1.0], ['hinode-solar-b', 7.6, -6.2, 1.2], ['argo', 4.6, -1.0, 1.0]].forEach(([n, x, z, len]) => { g.add(c.slab(0.06, 2.6, 0.06, std(c, 0xd8d8d8, { metalness: 0.9, roughness: 0.3 }), x, 1.3, z)); c.post(X(x), z, 0.4); const m = c.glb(n, n === 'argo' ? { h: 1.2, x, y: 2.7, z, parent: g, shadow: false } : { len, x, y: 2.7, z, parent: g, shadow: false }); c.tick((t) => { m.rotation.y = t * 0.25 + x; }); c.clickable(m, () => c.say(m, 'Launched. Wrapped. Loaned to the fair. Nobody at the fair asked.', 2200, 1.0), 'A satellite'); });
    const nova = c.glb('cassiopeia-a-supernova-c-2025', { len: 9, x: 10, y: 12, z: -D / 2 - 30, parent: g, shadow: false }); c.tick((t) => { nova.rotation.y = t * 0.08; nova.rotation.z = t * 0.03; }); glow(c, g, 10, 12, -D / 2 - 29, 'rgba(120,180,255,.5)', 14);
    const dg = c.glb('dg-tau', { h: 2.2, x: 16.2, y: 4.2, z: 0.6, parent: g, shadow: false }); c.tick((t) => { dg.rotation.y = t * 0.3; dg.position.y = 4.2 + Math.sin(t) * 0.2; }); c.clickable(dg, () => c.say(dg, 'DG Tau. A star being born. Loud about it. Very Queens.', 2600, 1.4), 'A young star');
    flag(c, g, X, 1.4, 1.0, "WORLD'S FAIR · N3W");
    cast(c, r, g, X, 'agent', 14.6, 4.2, { h: 1.85, ry: -0.5, line: 'Look at the dish. Not the sky. The sky is where things come from. The dish is where we say so.', hint: 'The agent' });
    plaque(c, g, 10, 2.8, D / 2 - 0.13, PI, 'WE TALK TO "VOYAGER" AND ASTORIA', 'DEEP SPACE NETWORK, FLUSHING', 2.6);
  },

  // SPLASHDOWN. The capsule came down by the ferry; keep pace with the parade and the city throws the paper.
  splash(c, r, g, X) {
    const { THREE } = c;
    // the water past the rail, and the capsule bobbing in it
    const water = new Reflector(new THREE.PlaneGeometry(W, 4), { textureWidth: c.MOBILE ? 512 : 1024, textureHeight: c.MOBILE ? 128 : 256, color: 0x6a8aa0, clipBias: 0.003 }); water.rotation.x = -PI / 2; water.position.set(W / 2, -0.04, -D / 2 + 1.2); g.add(water);
    const rail = std(c, 0xd06a30, { roughness: 0.6 }); g.add(c.slab(W, 0.08, 0.08, rail, W / 2, 1.0, -D / 2 + 3.2)); for (let x = 0.5; x < W; x += 1.6) g.add(c.slab(0.06, 1.0, 0.06, rail, x, 0.5, -D / 2 + 3.2)); c.wall(X(0), -D / 2 + 3.3, X(W), -D / 2 + 3.3);
    const cm = c.glb('si_nasm_command-module-apollo-11', { len: 2.4, x: 10, y: -0.6, z: -D / 2 + 1.4, parent: g, shadow: false }); c.tick((t) => { cm.position.y = -0.6 + Math.sin(t * 1.1) * 0.15; cm.rotation.z = Math.sin(t * 0.7) * 0.12; cm.rotation.y = t * 0.1; });
    c.clickable(cm, () => c.say(cm, 'Down. Wet. Home. The ferry did not stop. The ferry never stops. That is the ferry.', 3200, 1.6), 'The capsule');
    for (const x of [2.4, 17.6]) { const lb = c.glb('ph_lifebuoy', { len: 0.7, x, y: 1.4, z: -D / 2 + 3.25, parent: g, shadow: false }); lb.rotation.x = 0; c.clickable(lb, () => c.say(lb, 'Wrapped. It still floats. Art floats.', 2000, 0.6), 'A life ring'); }
    // the parade: a column of New Yorkers that loops along the deck; keep pace with it and the paper comes down
    const N = 14, col = []; for (let i = 0; i < N; i++) col.push({ o: extra(c, g, 0, 0, { col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a, 0x6a5a2a][i % 4] }), u: i / N });
    const paper = confetti(c, g, 500); const PR = { v: 0, pace: 0, done: false, sailor: null };
    const sail = cast(c, r, g, X, 'sailors', 10, 1.4, { h: 1.8, ry: PI / 2, r: 0, line: 'On the town. Twenty four hours. We did it in seven minutes. Catch up.', hint: 'The sailors', egg: 'sailors' });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const sp = 1.3; for (const q of col) { q.u = (q.u + dt * sp / 24) % 1; const x = 1 + q.u * 18, z = 1.4 + Math.sin(q.u * PI * 2) * 0.4; q.o.position.set(x, 0, z); q.o.rotation.y = PI / 2; q.o.userData.body.position.y = 1.0 + Math.abs(Math.sin(t * 7 + q.u * 20)) * 0.06; } sail.position.x = 1 + ((t * sp / 24 + 0.5) % 1) * 18; sail.position.z = 2.6;
      const L = local(r, P); PR.v += ((Math.hypot(c.P.x - (PR.lx ?? c.P.x), 0) / Math.max(dt, 1e-3)) - PR.v) * Math.min(1, dt * 3); PR.lx = c.P.x; const inLane = L.z > 0.2 && L.z < 3.6;
      if (inLane && Math.abs(PR.v - sp) < 0.5 && c.keys && (c.keys.KeyD || c.keys.ArrowRight)) PR.pace += dt; else PR.pace = Math.max(0, PR.pace - dt * 0.5);
      if (PR.pace > 4 && !PR.done) { PR.done = true; paper.burst(L.x, 5, L.z, 10); c.sound.applause && c.sound.applause(); c.egg('parade', 'You kept pace with the parade for four seconds and the city threw the paper. Ticker tape, for a capsule that landed next to a boat. Welcome home.'); setTimeout(() => { window.__finale && window.__finale(); }, 5000); } });
    notice(c, g, 'WALK WITH THE "PARADE" · HOLD D FOR FOUR SECONDS', 10, 0.06, 4.6, 0, 3.6, 0.3, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
    // the turnstile home, which does not accept the fare
    const ts = c.glb('mk_turnstile', { h: 1.0, x: 17.6, z: 5.0, ry: PI / 2, parent: g }); c.post(X(17.6), 5.0, 0.5); let swipes = 0; c.clickable(ts, () => { swipes++; c.sound.turnstile && c.sound.turnstile(); c.say(ts, swipes < 4 ? 'INSUFFICIENT FARE' : swipes < 6 ? 'PLEASE SWIPE AGAIN AT THIS TURNSTILE' : 'GO', 1600, 1.2); if (swipes === 6) c.egg('swipe', 'Six swipes. You went to the moon and back and the turnstile still said swipe again. Welcome home.'); }, 'The turnstile');
    const banner = c.sign('WELCOME HOME · N3W YORKERS SPACE PROGRAM · THE LEASE IS UP', { w: 8, h: 0.6, bg: '#1d4ed8', fg: '#f4ead2', font: c.FONT, weight: 900, border: '#f5c542' }); banner.position.set(10, 3.6, D / 2 - 0.16); banner.rotation.y = PI; g.add(banner);
    const gl = c.glb('gull', { len: 0.8, x: 10, y: 3, z: -5, parent: g, shadow: false }); c.tick((t) => { gl.position.set(10 + Math.sin(t * 0.45) * 8, 3 + Math.sin(t) * 0.4, -5 + Math.cos(t * 0.45) * 2); gl.rotation.y = Math.cos(t * 0.45) > 0 ? PI / 2 : -PI / 2; });
    cast(c, r, g, X, 'hustler', 2.6, 5.2, { h: 1.78, ry: 0.7, line: 'You went to space? I got a cousin went to space. Came back. Rent went up anyway.', hint: 'A regular' });
    prop(c, r, g, X, 'ph_life_jacket', 1.0, 3.0, { h: 0.6, y: 1.2, ry: PI / 2 });
    plaque(c, g, 10, 2.6, D / 2 - 0.13, PI, 'THE FERRY DID NOT "STOP"', 'SPLASHDOWN, THE HARBOR', 2.4);
  },
};

const PROPS = {
  control: [['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 5.85 }], ['metal_trash_can', 18.8, 5.2, { h: 0.8, r: 0.4 }], ['power_box_01', 0.4, -1.4, { h: 0.9, y: 1.2, ry: PI / 2 }], ['wall_clock', 10, -D / 2 + 0.3, { len: 0.5, y: 5.5 }]],
  pad: [['cement_bag', 3.6, -4.2, { len: 0.8, r: 0.4 }], ['wooden_crate_01', 15.8, -3.6, { len: 0.9, r: 0.5 }]],
  capsule: [['fire_alarm', 0.4, -1.0, { h: 0.3, y: 1.8, ry: PI / 2 }]],
  moon: [['tree_stump_01', 6.4, 5.4, { len: 0.8, r: 0.4, egg: ['A stump', 'stump', 'A tree stump on the moon. Nobody planted a tree. Somebody planted a stump. Union work.'] }]],
  mars: [['Barrel_01', 9.4, 4.4, { h: 0.9, r: 0.4 }], ['hand_truck', 1.4, 5.0, { h: 1.1, ry: 0.5, r: 0.4 }], ['cardboard_box_01', 7.8, 5.2, { len: 0.8, r: 0.5 }]],
  hubble: [['planter_pot_clay', 17.2, 2.0, { h: 0.5, r: 0.3 }], ['trashbag', 16.2, 5.2, { len: 0.8, r: 0.4 }], ['trashbag', 15.4, 5.6, { len: 0.7, r: 0.4 }]],
  belt: [['modular_street_seating', 10, 2.0, { len: 2.6, r: 1.0 }], ['metal_trash_can', 4.6, 5.4, { h: 0.8, r: 0.4 }]],
  splash: [['wooden_barrels_01', 1.4, -1.6, { len: 1.0, r: 0.6 }], ['ocean_buoy', 18.6, 0.4, { h: 1.6, r: 0.5, bob: 1.2 }]],
};
const SLOTS = { hubble: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [2.0, 4.4].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [2.0, 4.4, 6.4].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; } };

let _ROOMS = null;
export function buildRoom(c, r) {
  if (!_ROOMS) _ROOMS = c.ROOMS;
  if (!c._leaveHook) { c._leaveHook = true; let last = -1; c.tick((t, dt, P, ri) => { if (ri !== last) { const prev = _ROOMS[last]; prev && prev.onLeave && prev.onLeave(); last = ri; } }); }
  const dressing = (c2, r2, g, X) => { const b = c2.sign(`${r2.lvl} · N3W YORKERS SPACE PROGRAM`, { w: 2.6, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c2.MONO, weight: 700 }); b.position.set(W / 2 + PORTAL.w / 2 + 1.2, 2.6, -D / 2 + 0.14); g.add(b); };
  shell(c, r, { SLOTS, PROPS, ROOM, dressing });
}
