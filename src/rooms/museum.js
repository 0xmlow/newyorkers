// IV. THE MUSEUM. Room 11: THE MUSEUM OF MODERN PIGEON.
// The innermost room: a white cube at the centre of the pigeon's head, curated by pigeons, for pigeons, about people.
//   HEADLINE: THE DIORAMA. A vitrine on a plinth holds the bodega at one twelfth scale, and it is not a model: the glass
//   is a render target portal into the real bodega room (k = 12) with its roof cut away by a clip plane, so you look
//   down into the actual shop, live, from any side. The cat turns. The pigeon on the counter is there, and in her eye,
//   too small to see, is this room. And at the counter stands a tiny New Yorker in a blue hoodie who turns when you turn.
//   SECOND: THE COLLECTION OF ITSELF. The big painting on the north wall is a portal into this room seen from its south
//   end, rendered recursively five deep, so the painting contains the room containing the painting.
//   THIRD: THE GUARD. Stand still in front of any painting for four seconds and the guard's eye flower turns to you.
export default {
  id: 'museum', name: 'The Museum of Modern Pigeon', scale: 'IV · The museum', sound: 'museum',
  kicker: 'The white cube at the centre of a pigeon. Curated by pigeons, about people. There is a model of the bodega. It is not a model.',
  sky: 0xf2efe8, fog: 0xf2efe8, fogD: 0.004, hemi: [0xffffff, 0xd8d2c4, 1.0], env: 0.9,
  post: { dream: 0.08, bloom: 0.35, vig: 0.3, grain: 0.06 },
  spawn: [0, 9.5, 0],
  build(c) {
    const { THREE, R } = c;
    const W = 18, D = 24, H = 6.2, hw = W / 2, hd = D / 2;
    const white = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.92 });
    const floorM = c.surf('terrazzo', 2.4, { rough: 0.22 });
    c.box(W, 0.1, D, floorM, 0, -0.05, 0, { collide: false });
    c.box(W, 0.1, D, white, 0, H + 0.05, 0, { collide: false });
    c.box(0.2, H, D, white, -hw - 0.1, H / 2, 0); c.box(0.2, H, D, white, hw + 0.1, H / 2, 0);
    c.box(W, H, 0.2, white, 0, H / 2, -hd - 0.1);
    // the south wall has two doors: back to the dome on the left, on to the gift shop on the right
    c.box(4.6, H, 0.2, white, -6.7, H / 2, hd + 0.1); c.box(9.2, H, 0.2, white, 0, H / 2, hd + 0.1); c.box(4.6, H, 0.2, white, 6.7, H / 2, hd + 0.1);
    c.box(2.0, H - 3.1, 0.2, white, -5.4 + 0.0, 3.1 + (H - 3.1) / 2, hd + 0.1, { collide: false }); c.box(2.0, H - 3.1, 0.2, white, 5.4, 3.1 + (H - 3.1) / 2, hd + 0.1, { collide: false });
    const dark = new THREE.MeshBasicMaterial({ color: 0x0b0d14 });
    for (const x of [-5.4, 5.4]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 3.0), dark); g.position.set(x, 1.5, hd + 0.02); g.rotation.y = Math.PI; c.add(g); }
    const s1 = c.sign('BACK TO THE DOME', { w: 1.8, h: 0.22, bg: null, fg: '#02040c', font: c.MONO, weight: 600 }); s1.position.set(-5.4, 3.35, hd - 0.02); s1.rotation.y = Math.PI; c.add(s1);
    const s2 = c.sign('EXIT THROUGH THE GIFT SHOP', { w: 2.6, h: 0.22, bg: null, fg: '#02040c', font: c.MONO, weight: 600 }); s2.position.set(5.4, 3.35, hd - 0.02); s2.rotation.y = Math.PI; c.add(s2);
    c.door({ x: -5.4, z: hd - 0.25, r: 0.7, to: 'dome' }); c.door({ x: 5.4, z: hd - 0.25, r: 0.7, to: 'shop' });
    // the skylight grid and the track lights: the white cube is all about the light
    const glow = new THREE.MeshBasicMaterial({ color: 0xd9d4c8 });
    for (let x = -6; x <= 6; x += 6) for (let z = -8; z <= 8; z += 8) { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6.4), glow); p.rotation.x = Math.PI / 2; p.position.set(x, H - 0.01, z); c.add(p); }
    const trackM = new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.6, roughness: 0.4 });
    for (const x of [-hw + 1.6, hw - 1.6]) { c.add(c.slab(0.05, 0.05, D - 2, trackM, x, H - 0.4, 0)); for (let z = -10; z <= 10; z += 2.5) { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 12), trackM); can.position.set(x, H - 0.55, z); can.rotation.z = x < 0 ? 0.7 : -0.7; c.add(can); } }
    c.light(-5, 4.5, -6, 0xfff6e6, 1.6, 14); c.light(5, 4.5, -6, 0xfff6e6, 1.6, 14); c.light(-5, 4.5, 6, 0xfff6e6, 1.6, 14); c.light(5, 4.5, 6, 0xfff6e6, 1.6, 14); c.light(0, 3.2, 0, 0xffffff, 1.2, 10);
    // the title on the wall, cut vinyl, and the statement
    const title = c.sign('THE MUSEUM\nOF MODERN PIGEON', { w: 5.2, h: 1.5, bg: null, fg: '#02040c', font: c.SERIF, weight: 900, align: 'left', pad: 0.06 }); title.position.set(-hw + 0.02, 4.4, -4.6); title.rotation.y = Math.PI / 2; c.add(title);
    const stmt = c.sign('A pigeon has walked every block of this city. It has seen\nevery New Yorker from below, at the height of a dropped\nbagel. This is its collection. The pigeon asks that you\ndo not feed the art, and that you remember you are\ncurrently inside a pigeon, inside a bodega, inside a dream.', { w: 5.2, h: 1.3, bg: null, fg: '#26292f', font: c.FONT, weight: 500, align: 'left', pad: 0.05 });
    stmt.position.set(-hw + 0.02, 3.0, -4.6); stmt.rotation.y = Math.PI / 2; c.add(stmt);
    // ---------- THE DIORAMA ----------
    // the bodega is 10 by 14 m; at 1:12 the vitrine is 0.83 by 1.17, with the roof cut at 2.9 m (0.24 m)
    const K = 12, vx = 0, vz = 1.2, vy = 1.0;
    const plinth = c.box(1.15, vy, 1.5, white, vx, vy / 2, vz);
    c.add(c.slab(1.17, 0.03, 1.52, new THREE.MeshStandardMaterial({ color: 0xbe854c, metalness: 1, roughness: 0.3 }), vx, vy + 0.015, vz));
    const vit = new THREE.Mesh(new THREE.BoxGeometry(10 / K, 3.0 / K, 14 / K).translate(0, 1.5 / K, 0)); vit.position.set(vx, vy + 0.03, vz); c.add(vit);
    const vSrc = new THREE.Object3D(); vSrc.position.set(vx, vy + 0.03, vz); c.add(vSrc);
    // the glass case itself, over the portal: edges and a little sheen so it reads as a vitrine
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10 / K + 0.02, 3.0 / K + 0.25, 14 / K + 0.02)), new THREE.LineBasicMaterial({ color: 0xcfd6de })); edges.position.set(vx, vy + 0.03 + (3.0 / K + 0.25) / 2, vz); c.add(edges);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(10 / K + 0.02, 3.0 / K + 0.25, 14 / K + 0.02), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.02, depthWrite: false })); glass.position.copy(edges.position); c.add(glass); glass.userData.noAnamorph = true;
    c.portal({ mesh: vit, src: vSrc, to: 'bodega', at: [0, 0, 0, 0], k: K, ride: false, res: 0.6, maxDist: 9, clipPlane: [0, -1, 0, 2.92] });
    c.click(vit, () => { c.egg('museum_diorama', 'It is not a model. It is the bodega, now, from above. That small person in blue at the counter is you.'); }, 'Look closer');
    const lab = c.sign('PIGEONHOLE DELI GROCERY, JACKSON HEIGHTS.\nThe artist\'s home. Live, 1:12. Do not tap the glass.', { w: 1.1, h: 0.16, bg: '#f2ead8', fg: '#1b1b1b', font: c.MONO, weight: 600, px: 96 });
    lab.position.set(vx, vy - 0.12, vz + 0.76); c.add(lab);
    // the tiny you: the bodega's own avatar comes out to stand at its counter, posed as you, whenever you are in here
    const bod = c.room('bodega');
    // ---------- THE COLLECTION OF ITSELF ----------
    const pw = 4.2, ph = 2.6, py = 2.75, pz = -hd + 0.06;
    const frameM = new THREE.MeshStandardMaterial({ color: 0xb8902e, metalness: 1, roughness: 0.28 });
    c.add(c.slab(pw + 0.34, ph + 0.34, 0.14, frameM, 0, py, pz + 0.02));
    const can = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph)); can.position.set(0, py, pz + 0.1); c.add(can);
    const cSrc = new THREE.Object3D(); cSrc.position.set(0, py, pz + 0.1); c.add(cSrc);
    // seen from the south door, the room is 18 m across: k = 18 / 4.2, near enough to frame it wall to wall
    // the arrival height is the fixed point of the mapping, so every level of the recursion stands at eye height
    const kk = 2.2;   // the view lands in the middle of the room, inside it, so the recursion always has a ceiling
    c.portal({ mesh: can, src: cSrc, to: 'museum', at: [0, c.EYE + kk * (py - c.EYE), -2.0, 0], k: kk, ride: false, res: 0.55, maxDist: 30, recurse: 5, clip: 0.0 });
    const t2 = c.sign('THE COLLECTION OF ITSELF\nThe Museum of Modern Pigeon, now. Oil on recursion.', { w: 1.6, h: 0.22, bg: '#f2ead8', fg: '#1b1b1b', font: c.MONO, weight: 600, px: 96 }); t2.position.set(pw / 2 + 1.3, 1.5, pz + 0.03); c.add(t2);
    c.click(can, () => c.egg('museum_itself', 'Somewhere in there, very small, you are looking at this painting. Wave.'), 'Look into it');
    // ---------- the hang: fourteen New Yorkers, bone frames, picture lights, labels the pigeons wrote ----------
    const pcs = c.art(14); let pi = 0;
    const NOTES = ['Note the crumbs, lower left. There are no crumbs. That is the point.', 'The pigeons are divided on this one.', 'Acquired in exchange for half a pretzel.', 'Seen from the height of a dropped bagel.', 'A pigeon sat on this for nine days. It was moved by it.', 'The gift of an anonymous rooftop.', 'Do not feed the art.'];
    const wall = (x0, x1, z, ry, n, w) => { for (let k = 0; k < n; k++) { const p = pcs[pi++]; if (!p) return; const x = x0 + (k + 0.5) * (x1 - x0) / n; if (ry === 0 || ry === Math.PI) c.hang(p, x, 1.65, z, ry, w, 'bone', { light: true }); else c.hang(p, z, 1.65, x, ry, w, 'bone', { light: true }); } };
    wall(-10, -5.5, -hw + 0.05, Math.PI / 2, 2, 1.7);      // west wall, south of the title
    wall(1.0, 10.5, -hw + 0.05, Math.PI / 2, 3, 1.7);
    wall(-10.5, 10.5, hw - 0.05, -Math.PI / 2, 5, 1.8);    // the whole east wall
    wall(-8.4, -2.8, -hd + 0.06, 0, 2, 1.5); wall(2.8, 8.4, -hd + 0.06, 0, 2, 1.5);   // either side of the big one
    // pigeon notes: a second label under some of the labels, in the pigeons' own words
    // ---------- the visitors: pigeons, looking at people ----------
    const visitors = [];
    for (const [x, z, ry] of [[-6.8, -8, -Math.PI / 2], [6.6, 2, Math.PI / 2], [6.8, -6, Math.PI / 2], [-1.6, -9.5, 0], [0.8, 0.2, Math.PI * 0.8]]) visitors.push(c.glb('pigeon', { h: 0.34, x, z, ry: ry + Math.PI }));
    visitors.forEach((v, k) => c.click(v, () => { c.sound.coo(1 + k * 0.08); c.say(v, ['They all have flowers for heads. Fascinating.', 'I could have painted that. I could not have painted that.', 'Is it a bench? Can I sit on it?', 'My cousin is in this one.', 'Very derivative of humans.'][k]); if (k === 0) c.egg('museum_critic', 'Everybody is a critic. Especially the pigeons.'); }, 'Overhear'));
    // benches, of course, and a sign on one
    for (const z of [-5.5, 6]) { c.box(2.4, 0.42, 0.55, new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.5 }), 0, 0.21, z); }
    const nosit = c.sign('THIS BENCH IS ALSO IN THE COLLECTION', { w: 1.7, h: 0.1, bg: '#f2ead8', fg: '#1b1b1b', font: c.MONO, weight: 600, px: 64 }); nosit.position.set(0, 0.43, 6); nosit.rotation.x = -Math.PI / 2; c.add(nosit);
    // the guard: a New Yorker with an eye flower head, on a stool by the east door, who watches you look
    const guard = new THREE.Group(); guard.position.set(7.4, 0, 10.4); c.add(guard);
    const uni = new THREE.MeshStandardMaterial({ color: 0x1d2a4a, roughness: 0.7 });
    { const p = (g, x, y, z) => { const o = new THREE.Mesh(g, uni); o.position.set(x, y, z); guard.add(o); return o; };
      p(new THREE.CylinderGeometry(0.2, 0.2, 0.62, 16), 0, 0.31, 0).material = new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.6, roughness: 0.4 });
      p(new THREE.CapsuleGeometry(0.22, 0.5, 4, 12), 0, 1.0, 0); p(new THREE.CapsuleGeometry(0.08, 0.5, 4, 8), -0.12, 0.5, 0.25).rotation.x = 1.3; p(new THREE.CapsuleGeometry(0.08, 0.5, 4, 8), 0.12, 0.5, 0.25).rotation.x = 1.3; }
    const gcv = document.createElement('canvas'); gcv.width = gcv.height = 256; const gctx = gcv.getContext('2d'); c.eyeFlower(gctx, 128, 128, 120);
    const gt = new THREE.CanvasTexture(gcv); gt.colorSpace = THREE.SRGBColorSpace;
    const ghead = new THREE.Mesh(new THREE.CircleGeometry(0.33, 32), new THREE.MeshBasicMaterial({ map: gt, transparent: true, side: THREE.DoubleSide })); ghead.position.set(0, 1.62, 0); guard.add(ghead);
    c.post(7.4, 10.4, 0.4);
    c.click(guard, () => { c.egg('museum_guard', 'The guard has been watching you look. The guard has opinions.'); c.say(ghead, 'Two metres from the art, please. It bites.'); }, 'Ask the guard');
    // DO NOT STICKER, covered in stickers
    const ns = c.sign('PLEASE DO NOT\nPUT STICKERS\nON THE MUSEUM', { w: 1.0, h: 0.7, bg: '#f0f4f8', fg: '#02040c', font: c.FONT, weight: 800, border: '#02040c' }); ns.position.set(hw - 0.03, 1.5, 11); ns.rotation.y = -Math.PI / 2; c.add(ns);
    const G = window.STICKER_GROUPS || {}, pool = [...(G.museum || []), ...(G.eye || []).slice(48, 72), ...(G.mlow || []).slice(20, 32)];
    for (let k = 0; k < 26; k++) c.sticker(pool[k % pool.length], hw - 0.035, 1.5 + (Math.random() - 0.5) * 0.9, 11 + (Math.random() - 0.5) * 1.2, { ry: -Math.PI / 2, size: 0.1 + Math.random() * 0.1 });
    c.click(ns, () => c.egg('museum_stickers', 'Somebody always does.'), 'Read the sign');
    // paint: one drip has escaped the art and is running down the white wall from the big frame, as geometry
    const pink = new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.1, clearcoat: 1 });
    for (let k = 0; k < 9; k++) { const x = -pw / 2 + 0.2 + k * 0.48 + Math.random() * 0.2, len = 0.3 + Math.random() * 1.1; const d = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, len, 8), pink); d.position.set(x, py - ph / 2 - 0.17 - len / 2, pz + 0.04); c.add(d); const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), pink); b.position.set(x, py - ph / 2 - 0.17 - len, pz + 0.04); b.scale.y = 1.3; c.add(b); }
    // ---------- per frame ----------
    c.tick((t, dt, me) => {
      // the tiny you in the diorama
      if (bod?.state?.me) { const m = bod.state.me; m.traverse((o) => o.layers.set(0)); m.position.set(-2.4, 0, 1.0); m.rotation.y = c.P.yaw + Math.PI / 2; }
      // the guard turns his flower toward you when you have stood still in front of the art for a while
      const still = Math.hypot(me.x - (R.state.lx ?? me.x), me.z - (R.state.lz ?? me.z)) < 0.01; R.state.lx = me.x; R.state.lz = me.z;
      R.state.stillT = still ? (R.state.stillT || 0) + dt : 0;
      const want = R.state.stillT > 4 ? Math.atan2(me.x - guard.position.x, me.z - guard.position.z) : -Math.PI * 0.75;
      let d = want - guard.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); guard.rotation.y += d * Math.min(1, dt * 2);
      const lk = [Math.sin(t * 0.3) * 0.3, 0]; if ((t * 2 | 0) !== R.state.lt) { R.state.lt = t * 2 | 0; gctx.clearRect(0, 0, 256, 256); c.eyeFlower(gctx, 128, 128, 120, { look: R.state.stillT > 4 ? [0, 0.2] : lk }); gt.needsUpdate = true; }
      visitors.forEach((v, k) => { if (v.userData.ready) v.position.y = Math.max(0, Math.sin(t * 2.4 + k)) * 0.01; });
    });
  },
  onLeave() { },
  onEnter(c) { if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('The vitrine in the middle is not a model. Walk round it.', 4200), 3000); } },
};
