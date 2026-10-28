// I. THE DREAM. Room 1: LAST STOP, 3:33 A.M.
// You fell asleep on the N. The car is crossing the sky. Its end doors open onto the same car, again and again: they
// are live portals into this room (k = 1), and because a portal can see itself, the cars repeat to the vanishing point.
// Walk through and you are in the next car, which is this car, one further. Something changes each time. On the
// third car the doors open on a platform that should not exist.
import { figure, parts, audience, CROWD_ON } from '../crowd.js';
export default {
  id: 'car', name: 'Last Stop, 3:33 A.M.', scale: 'I · The dream', sound: 'train',
  kicker: 'You fell asleep on the N. The train is crossing the sky. The car goes on forever, and every car is this one.',
  sky: 0x05081a, fog: 0x0a1030, fogD: 0.012, hemi: [0x9fb4ff, 0x2a1d10, 0.5], env: 0.5,
  post: { dream: 0.3, bloom: 0.9, vig: 0.5 },
  spawn: [0, 5.5, 0],
  build(c) {
    const { THREE, R } = c;
    const L = 18, W = 2.9, HH = 2.3, hw = W / 2;
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9c0c8, metalness: 0.9, roughness: 0.32 });
    const wallM = c.surf('subway_wall', 2.6, { tint: 0xe9e6de });
    const floorM = c.surf('subway_floor', 1.4);
    const seatM = new THREE.MeshPhysicalMaterial({ color: 0xf29a1e, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const seatM2 = new THREE.MeshPhysicalMaterial({ color: 0xf6c21a, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.8 });
    // floor, ceiling, the long walls with real holes for the windows
    c.box(W, 0.1, L, floorM, 0, -0.05, 0, { collide: false });
    c.box(W, 0.06, L, new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.6 }), 0, HH + 0.03, 0, { collide: false });
    const WIN = []; for (let i = -2; i <= 2; i++) WIN.push(i * 2.45);
    const ww = 1.55, wy0 = 1.02, wy1 = 1.9;
    for (const sx of [-1, 1]) {
      const x = sx * (hw + 0.04);
      c.box(0.08, wy0, L, wallM, x, wy0 / 2, 0, { collide: false });
      c.box(0.08, HH - wy1, L, wallM, x, (wy1 + HH) / 2, 0, { collide: false });
      // piers between the windows
      const edges = [-L / 2, ...WIN.flatMap((z) => [z - ww / 2, z + ww / 2]), L / 2];
      for (let k = 0; k < edges.length; k += 2) { const a = edges[k], b = edges[k + 1]; if (b - a > 0.01) c.box(0.08, wy1 - wy0, b - a, wallM, x, (wy0 + wy1) / 2, (a + b) / 2, { collide: false }); }
      c.wall(x - sx * 0.35, -L / 2, x - sx * 0.35, L / 2);
      // the sky: one stencil pocket per side, every window on that side one merged pane
      const panes = WIN.map((z) => new THREE.PlaneGeometry(ww, wy1 - wy0).rotateY(-sx * Math.PI / 2).translate(x, (wy0 + wy1) / 2, z));
      const mask = new THREE.Mesh(c.merge(panes)); c.add(mask);
      c.pocket({ mask, sheen: 0.1, build: (grp) => {
        // the sky: the painting on a curved wall 25 m out, at its own aspect, horizon at eye height. From a seat
        // three metres from the glass that reads as deep, clean parallax; a depth plate this close to the glass tears.
        const skyT = c.tex.load('assets/plates/p_dream_window2.jpg'); skyT.colorSpace = THREE.SRGBColorSpace; skyT.anisotropy = 8;
        const Rr = 25, arc = 2.2, hgt = Rr * arc / 1.49;
        const sky = new THREE.Mesh(new THREE.CylinderGeometry(Rr, Rr, hgt, 48, 1, true, (sx > 0 ? Math.PI / 2 : -Math.PI / 2) - arc / 2, arc), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, toneMapped: false }));
        sky.position.y = c.EYE + 1.5; grp.add(sky); R.state.skies = (R.state.skies || []).concat(sky);
        const far = new THREE.Mesh(new THREE.CylinderGeometry(Rr + 1, Rr + 1, hgt * 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x050a22, side: THREE.BackSide, fog: false })); grp.add(far);
      } });
      // window gaskets
      for (const z of WIN) { const gk = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 24), dark); gk.visible = false; c.add(gk);
        for (const [a, b, cx, cy] of [[ww, 0.05, 0, wy1], [ww, 0.05, 0, wy0], [0.05, wy1 - wy0, -ww / 2, (wy0 + wy1) / 2], [0.05, wy1 - wy0, ww / 2, (wy0 + wy1) / 2]]) { const m = c.slab(0.1, b, a, dark, x - sx * 0.02, cy, z + (a > 0.5 ? 0 : cx)); m.scale.set(1, 1, 1); c.add(m); } }
    }
    // the benches, the poles, the straps
    for (const sx of [-1, 1]) for (const z0 of [-6.5, -3.2, 0, 3.2, 6.5]) {
      const len = 2.6, bx = sx * (hw - 0.3);
      for (let k = 0; k < 6; k++) { const s = c.slab(0.44, 0.07, len / 6 - 0.03, k % 2 ? seatM : seatM2, bx, 0.45, z0 - len / 2 + (k + 0.5) * len / 6); s.rotation.z = sx * 0.06; c.add(s); const back = c.slab(0.06, 0.42, len / 6 - 0.03, k % 2 ? seatM : seatM2, sx * (hw - 0.06), 0.72, s.position.z); back.rotation.z = -sx * 0.12; c.add(back); }
      c.box(0.46, 0.42, len, dark, bx, 0.21, z0, { collide: false }); c.wall(bx - sx * 0.25, z0 - len / 2, bx - sx * 0.25, z0 + len / 2);
    }
    const poleG = new THREE.CylinderGeometry(0.02, 0.02, HH, 12);
    for (const z of [-8.2, -4.9, -1.6, 1.6, 4.9, 8.2]) for (const sx of [-0.55, 0.55]) { const p = new THREE.Mesh(poleG, steel); p.position.set(sx, HH / 2, z); c.add(p); c.post(sx, z, 0.04); }
    for (const sx of [-0.62, 0.62]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, L, 10), steel); bar.rotation.x = Math.PI / 2; bar.position.set(sx, 2.0, 0); c.add(bar); }
    const straps = []; const strapM = new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.6 });
    for (let z = -8; z <= 8; z += 0.8) for (const sx of [-0.62, 0.62]) { const g = new THREE.Group(); g.position.set(sx, 2.0, z); const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.012), strapM); s.position.y = -0.13; g.add(s); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16), strapM); ring.position.y = -0.29; g.add(ring); c.add(g); straps.push(g); }
    // fluorescent strips, the light the whole car is lit by
    const tube = new THREE.MeshBasicMaterial({ color: 0xf2f6ff, toneMapped: false });
    for (const sx of [-0.85, 0.85]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, L - 1), tube); t.position.set(sx, HH - 0.02, 0); c.add(t); }
    c.light(0, 2.1, -5, 0xe6eeff, 2.2, 9); c.light(0, 2.1, 0, 0xe6eeff, 2.2, 9); c.light(0, 2.1, 5, 0xe6eeff, 2.2, 9);
    c.light(-2.5, 1.5, 0, 0x6f8dff, 1.6, 8, (t) => 0.7 + 0.3 * Math.sin(t * 0.7));
    // the ad cards above the windows are New Yorkers; posters for the show take two of the frames
    const cards = c.art(14); let ci = 0;
    for (const sx of [-1, 1]) for (const z of WIN) {
      if (ci >= cards.length) break;
      c.hang(cards[ci++], sx * (hw - 0.02), 2.08, z, -sx * Math.PI / 2, 0.62, 'steel', { label: false });
    }
    for (const [f, sx, z] of [['g/g_poster_wake.jpg', -1, -8.3], ['g/g_poster_pigeon.jpg', 1, 8.3]]) { const p = c.picture(f, 0.5, 0.75); p.position.set(sx * (hw - 0.05), 1.42, z); p.rotation.y = -sx * Math.PI / 2; c.add(p); }
    // the line map: THE PIGEONHOLE line, twelve stops, this one lit
    const mapT = c.canvasTex(1600, 360, (g, w, h) => {
      g.fillStyle = '#f0f4f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#06163a'; g.font = `800 34px ${c.FONT}`; g.fillText('THE PIGEONHOLE LINE · LOCAL · ALL STOPS · ALL SCALES', 40, 60);
      const stops = ['Last Stop', 'Wrong Sizes', 'The Bodega', 'The Cooler', 'The Stairs', 'The Nave', 'The Crop', 'The Heart', 'The Wing', 'The Dome', 'The Museum', 'Gift Shop'];
      g.strokeStyle = '#ff2e63'; g.lineWidth = 14; g.beginPath(); g.moveTo(80, 190); g.lineTo(w - 80, 190); g.stroke();
      stops.forEach((s, i) => { const x = 80 + i * (w - 160) / 11; g.fillStyle = i === 0 ? '#ff2e63' : '#fff'; g.strokeStyle = '#02040c'; g.lineWidth = 6; g.beginPath(); g.arc(x, 190, i === 0 ? 22 : 16, 0, 7); g.fill(); g.stroke();
        g.save(); g.translate(x, 230); g.rotate(0.6); g.fillStyle = '#02040c'; g.font = `600 22px ${c.MONO}`; g.fillText(s.toUpperCase(), 0, 0); g.restore(); });
      g.fillStyle = '#be854c'; g.font = `600 20px ${c.MONO}`; g.fillText('I THE DREAM      II THE BODEGA      III THE PIGEON      IV THE MUSEUM      (the last stop is also the first)', 40, h - 24);
    });
    const map = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.54), new THREE.MeshStandardMaterial({ map: mapT, emissive: 0xffffff, emissiveMap: mapT, emissiveIntensity: 0.4, roughness: 0.4 }));
    map.position.set(0, 1.98, -L / 2 + 0.06); c.add(map);
    c.click(map, () => c.egg('lineMap', 'Twelve stops, four scales, one line. The last stop is also the first.'), 'Read the map');
    // the end walls: a doorway in each, and the doorway is a portal into this very car, one car along
    for (const end of [-1, 1]) {
      const z = end * L / 2;
      for (const sx of [-1, 1]) c.box(hw - 0.45, HH, 0.12, wallM, sx * (0.45 + (hw - 0.45) / 2), HH / 2, z + end * 0.06, { collide: true });
      c.box(0.9, HH - 2.0, 0.12, wallM, 0, 2.0 + (HH - 2.0) / 2, z + end * 0.06, { collide: false });
      const src = new THREE.Object3D(); src.position.set(0, c.EYE, z); src.rotation.y = end < 0 ? 0 : Math.PI; c.add(src);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0)); mesh.position.set(0, 1.0, z); mesh.rotation.y = end < 0 ? 0 : Math.PI; c.add(mesh);
      // looking out of the front (z = -9) you see the car from its back door (z = +9), facing forward again
      c.portal({ mesh, src, to: 'car', at: [0, c.EYE, -end * L / 2, end < 0 ? 0 : Math.PI], k: 1, ride: false, res: 0.6, maxDist: 25, clip: -0.16, recurse: 4 });
      // the steel door frame
      for (const [w, h, x, y] of [[0.06, 2.0, -0.48, 1.0], [0.06, 2.0, 0.48, 1.0], [1.02, 0.06, 0, 2.03]]) c.add(c.slab(w, h, 0.16, steel, x, y, z));
    }
    // the side doors: four pairs, and on the third car the pair by the map opens
    const doorM = new THREE.MeshStandardMaterial({ color: 0xa9b0b8, metalness: 0.85, roughness: 0.35 });
    const doors = [];
    for (const z of [-7.35, 7.35]) for (const sx of [-1, 1]) {
      const pair = []; for (const k of [-1, 1]) { const d = c.slab(0.05, 1.95, 0.62, doorM, sx * (hw + 0.01), 0.98, z + k * 0.31); c.add(d); pair.push(d); const win = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.6), new THREE.MeshBasicMaterial({ color: 0x0b1230 })); win.position.set(-sx * 0.03, 0.35, 0); win.rotation.y = -sx * Math.PI / 2; d.add(win); }
      doors.push({ pair, z, sx });
    }
    // stickers: the car has been bombed, more with every car you walk through
    const G = window.STICKER_GROUPS || {}, pool = [...(G.subway || []), ...(G.eye || []).slice(0, 24), ...(G.mlow || []).slice(0, 8), ...(G.street || []).slice(0, 16)];
    const stk = [];
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let k = 0; k < 90; k++) {
      const sx = Math.random() < 0.5 ? -1 : 1, onDoor = Math.random() < 0.25;
      let z = rnd(-L / 2 + 0.6, L / 2 - 0.6), y = rnd(0.55, 1.0);
      if (!onDoor && Math.random() < 0.5) { const piers = WIN.slice(0, -1).map((w) => w + 2.45 / 2).concat([-6.1, 6.1]); z = piers[Math.floor(Math.random() * piers.length)] + rnd(-0.25, 0.25); y = rnd(1.05, 1.85); }
      if (onDoor) { const d = doors[Math.floor(Math.random() * doors.length)]; z = d.z + rnd(-0.5, 0.5); y = rnd(0.4, 1.6); }
      const s = c.sticker(pool[k % pool.length], sx * (hw - 0.0) + (-sx * 0.005), y, z, { ry: -sx * Math.PI / 2, size: rnd(0.12, 0.26) });
      if (s) { s.visible = k < 40; stk.push(s); }
    }
    // a pigeon rides the train. Everyone in New York has seen it. It walks the aisle and does not look at you.
    const pg = c.glb('pigeon', { h: 0.3, x: 0.2, z: 2 });
    c.click(pg, () => { c.sound.coo(); c.egg('commuter', 'This pigeon gets off at the next stop. So do you.'); }, 'A commuter');
    // somebody asleep across the aisle: a New Yorker with an eye flower for a head, the eye closed
    const sleeper = new THREE.Group(); sleeper.position.set(-hw + 0.42, 0.5, -3.2); c.add(sleeper);
    { const coat = new THREE.MeshStandardMaterial({ color: 0x2b3a5c, roughness: 0.8 }), jeans = new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.85 }), shoe = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.6 });
      const cap = (r, h, m, x, y, z) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 6, 12), m); o.position.set(x, y, z); o.rotation.x = Math.PI / 2; sleeper.add(o); return o; };
      cap(0.17, 0.55, coat, 0, 0.17, 0.1); cap(0.075, 0.6, jeans, -0.06, 0.1, -0.62); cap(0.075, 0.6, jeans, 0.07, 0.12, -0.6);
      for (const x of [-0.06, 0.07]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.24), shoe); sh.position.set(x, 0.12, -1.02); sleeper.add(sh); }
      const paper = c.sign('THE DAILY COO\nPIGEON FOUND INSIDE PIGEON', { w: 0.62, h: 0.42, bg: '#e9e4d6', fg: '#1b1b1b', font: c.SERIF, weight: 900, px: 160 });
      paper.rotation.set(-Math.PI / 2 + 0.25, 0, 0.3); paper.position.set(0.02, 0.36, 0.05); sleeper.add(paper);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; c.eyeFlower(cv.getContext('2d'), 128, 128, 120, { lid: 1 });
      const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
      const head = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshBasicMaterial({ map: ht, transparent: true, side: THREE.DoubleSide })); head.position.set(0.05, 0.22, 0.62); head.rotation.set(-0.5, Math.PI / 2 - 0.4, 0); sleeper.add(head);
      sleeper.userData.cv = cv; sleeper.userData.tex = ht;
      // 2026-10-28: the Hustler from the cast (pale suit), whole, asleep on his side along the bench, face to the aisle,
      // his own eye flower for a head; THE DAILY COO stays over him. Standing figure turned: up becomes +z, front becomes +x.
      figure(c, sleeper, 'hustler_full', { h: 1.66, y: 0.21, z: -1.06, hide: parts(sleeper, [paper]), onload: (g) => { g.quaternion.setFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), Math.PI * 2 / 3); paper.position.z = -0.4; } }); }
    c.click(sleeper, () => { c.egg('dreamer', 'Do not wake the dreamer. You are the dreamer.'); c.say(sleeper, 'zzz. three more stops.'); }, 'Do not wake them');
    // the car number, the stop sign, the loop count
    const num = c.sign('CAR 1 OF 1', { w: 0.9, h: 0.16, bg: '#02040c', fg: '#ff2e63', font: c.MONO, glow: 8, px: 96 }); num.position.set(0, 2.15, -L / 2 + 0.07); c.add(num); num.visible = false;
    const strip = c.sign('NEXT STOP  THE BODEGA', { w: 1.6, h: 0.14, bg: '#020308', fg: '#ffb020', font: c.MONO, glow: 10, px: 96 }); strip.position.set(0, 2.18, L / 2 - 0.07); strip.rotation.y = Math.PI; c.add(strip);
    const S = R.state; S.car = 1; S.open = false;
    const announce = ['This is a sky bound N train. The next stop is the bodega.', 'Stand clear of the closing dream, please.', 'This is the last stop. It is also the first. Doors open on your right.'];
    const setCar = () => {
      num.material.map.dispose(); const n = c.sign(`CAR ${S.car}  ·  LOOP ${c.loop() + 1}`, { w: 0.9, h: 0.16, bg: '#02040c', fg: '#ff2e63', font: c.MONO, glow: 8, px: 96 }); num.material.map = n.material.map; num.visible = true;
      stk.forEach((s, k) => { s.visible = k < 40 + S.car * 18; });
      c.toast(announce[Math.min(S.car - 1, 2)], 4200);
      if (S.car >= 3 && !S.open) { S.open = true; c.sound.chime(); c.egg('thirdCar', 'Third car. Doors opening.'); }
    };
    // walking through an end doorway: you are now one car along, and that car is this one
    R.move = (P, nx, nz) => {
      if (Math.abs(nx) < 0.45) {
        if (nz < -L / 2) { nz += L; S.car++; setCar(); }
        else if (nz > L / 2) { nz -= L; S.car = Math.max(1, S.car - 1); setCar(); }
      }
      return [nx, nz];
    };
    // with the doors open the right hand pair by the map leads out
    const out = c.door({ x: hw - 0.15, z: -7.35, r: 0.55, to: 'platform', off: true });
    c.tick((t, dt, me) => {
      // the car sways, the straps swing, the sky drifts past
      for (const [k, s] of straps.entries()) s.rotation.x = Math.sin(t * 1.3 + k * 0.4) * 0.12 + Math.sin(t * 0.31) * 0.08;
      c.P.roll = Math.sin(t * 0.9) * 0.006 + Math.sin(t * 2.3) * 0.002;
      for (const k of S.skies || []) k.rotation.y = Math.sin(t * 0.05) * 0.06;
      if (pg.userData.ready) { const u = t * 0.22; pg.position.z = 2 + Math.sin(u) * 4.5; pg.position.x = 0.2 + Math.sin(u * 2.3) * 0.25; pg.rotation.y = Math.cos(u) > 0 ? Math.PI : 0; pg.position.y = Math.abs(Math.sin(t * 7)) * 0.02; }
      const open = S.open ? 1 : 0;
      for (const d of doors) if (d.z < 0 && d.sx > 0) { const [a, b] = d.pair; const o = (a.userData.o ?? 0) + (open - (a.userData.o ?? 0)) * Math.min(1, dt * 2); a.userData.o = o; a.position.z = d.z - 0.31 - o * 0.55; b.position.z = d.z + 0.31 + o * 0.55; }
      out.off = !S.open;
      // the dreamer's eye opens, very slightly, when you stand close
      const dd = Math.hypot(me.x - sleeper.position.x, me.z - (sleeper.position.z + 0.6));
      const lid = dd < 1.3 ? 0.55 : 1; if (sleeper.userData.lid !== lid) { sleeper.userData.lid = lid; const g = sleeper.userData.cv.getContext('2d'); g.clearRect(0, 0, 256, 256); c.eyeFlower(g, 128, 128, 120, { lid }); sleeper.userData.tex.needsUpdate = true; }
    });
    // the open doorway shows the platform's tile and light: a slab of the next room's colour behind the doors
    const beyond = c.picture('tex/tile_c.jpg', 1.2, 2.0, { emissive: 0.6 }); beyond.position.set(hw + 0.5, 1.0, -7.35); beyond.rotation.y = -Math.PI / 2; c.add(beyond);
  },
  onEnter(c) { if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('Walk to the end of the car. Keep going.', 4200), 5800); } },
};
