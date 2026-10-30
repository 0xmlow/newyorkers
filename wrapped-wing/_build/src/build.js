// THE WRAPPED WING, room by room. The night a great New York museum got M.Textured: every antiquity in the building
// wrapped in a painting from the census, and you holding the gun. The statues are MLow's own M.Texture GLBs (Smithsonian
// and Three D Scans objects wrapped in his paintings), the props are Poly Haven (CC0) passed through the NEW YORKERS
// Blender lane, the cast are ON LOCATION's Tripo New Yorkers with eye flowers for heads.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { PI, INK, DZ1, DZ2, DH, Reflector, basic, std, here, local, shell, eyeFlower, decal, glowTex, glow, bulbs, watcher, extra, headTex, plaque, notice, board, label, plinth, column, confetti, slotsDefault, slotsSouthOnly, slotsWestFree, lane, stanchions, prop, cast } from './kit.js';
export { eyeFlower };

// ---------- the gun ----------
// Everything that stands in the building can be wrapped: press F (or WRAP) while looking at it and it takes a painting
// from the census. In the lab the gun runs backwards. The count is on the HUD, and the eggs are on the count.
const WRAP = { targets: [], n: 0, mode: 'wrap', marble: null, lastArt: -1, ready: false };
function marbleMat(c) { return (WRAP.marble ||= new c.THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.42, metalness: 0 })); }
function wrappable(c, r, group, { name = 'this', orig = 'wrapped', label: lb } = {}) {
  const t = { group, room: r, name, meshes: [], state: orig, label: lb };
  const arm = () => { group.traverse((m) => { if (m.isMesh && m.material && !t.meshes.includes(m)) { m.userData.shipped = m.material; t.meshes.push(m); m.userData.wrapT = t; } }); };
  if (group.userData.ready) arm(); else { const prev = group.userData.onWrap; group.userData.onWrap = () => { prev && prev(); arm(); }; }
  WRAP.targets.push(t); return t;
}
function applyWrap(c, t, piece) {
  const map = c.tex.load(`assets/art/${piece.f}`); map.colorSpace = c.THREE.SRGBColorSpace; map.anisotropy = 4;
  const m = new c.THREE.MeshStandardMaterial({ map, roughness: 0.5, metalness: 0, envMapIntensity: 1.0 });
  t.meshes.forEach((me) => { me.material = m; }); t.state = 'census'; t.piece = piece;
}
function applyMarble(c, t) { t.meshes.forEach((me) => { me.material = marbleMat(c); }); t.state = 'marble'; }
function applyShipped(t) { t.meshes.forEach((me) => { me.material = me.userData.shipped; }); t.state = 'wrapped'; }
function fire(c, ROOMS) {
  if (!WRAP.ready) return;
  const ray = c.ray; ray.setFromCamera(new c.THREE.Vector2(0, 0), c.camera);
  const ms = []; for (const t of WRAP.targets) if (t.group.visible && Math.abs(t.room.i - c.cur()) <= 1) for (const m of t.meshes) ms.push(m);
  const hit = ray.intersectObjects(ms, false)[0];
  if (!hit) { c.sound.tick && c.sound.tick(); c.toast(WRAP.mode === 'wrap' ? 'Nothing to wrap there. Aim at a statue, a prop, a guard, anything that stands.' : 'Nothing to unwrap there.', 2200); return; }
  const t = hit.object.userData.wrapT, r = t.room;
  if (WRAP.mode === 'unwrap' || r.id === 'lab') {
    if (t.fake) { applyShipped(t); c.sound.horn && c.sound.horn(); c.shake(0.04); c.egg('fake', `${t.name}: it does not come off. It was never wrapped. It was painted that way. Somebody in the lab has been lying since 1996.`); r.onUnwrap && r.onUnwrap(t); return; }
    if (t.state === 'marble') { c.toast(`${t.name} is already down to the stone.`, 1800); return; }
    applyMarble(c, t); c.sound.whoosh && c.sound.whoosh(); c.flash(0.12); r.onUnwrap && r.onUnwrap(t); return;
  }
  const pool = r.cast && r.cast.length ? r.cast : ROOMS.flatMap((q) => q.cast || []);
  if (!pool.length) return;
  WRAP.lastArt = (WRAP.lastArt + 1 + Math.floor(Math.random() * 3)) % pool.length;
  const piece = pool[WRAP.lastArt];
  applyWrap(c, t, piece); WRAP.n++; c.sound.whoosh && c.sound.whoosh(); c.flash(0.18); c.shake(0.02);
  const el = document.getElementById('wrapn'); if (el) el.textContent = `${WRAP.n}`;
  c.toast(`${t.name}, wrapped in "${piece.t}" (No. ${piece.n}).`, 2600);
  if (WRAP.n === 1) c.egg('gun', 'The gun works. Everything in this building is a canvas now. The guards are not going to like it. The guards do not like anything.');
  if (WRAP.n === 12) c.egg('dozen', 'Twelve wrapped. The museum calls this vandalism. The census calls it a group show.');
  if (WRAP.n === 40) c.egg('forty', 'Forty. At this point you are the collection.');
  r.onWrap && r.onWrap(t, piece);
}
let bound = false;
function bindGun(c, ROOMS) {
  if (bound) return; bound = true; WRAP.ready = true;
  addEventListener('keydown', (e) => { if (e.code === 'KeyF' && !e.repeat && !e.metaKey && !e.ctrlKey && !e.target.closest?.('input,textarea')) fire(c, ROOMS); });
  const b = document.getElementById('wrapbtn'); if (b) b.addEventListener('click', (e) => { e.stopPropagation(); fire(c, ROOMS); });
  window.__fire = () => fire(c, ROOMS); window.__WRAP = WRAP;
}

// ---------- guards: the weeping angels of the night shift ----------
// A guard only walks while you are not looking at him. If he reaches you, you are escorted back to the door.
function guards(c, r, g, X, list, { speed = 1.1, reach = 1.1, line = 'Sir. SIR.', onCatch } = {}) {
  const G = list.map(([name, x, z, h]) => ({ m: cast(c, r, g, X, name, x, z, { h: h || 1.85, r: 0.3, line: 'The museum is closed. The museum has been closed since 1870. Please.', hint: 'A guard' }), x, z, home: [x, z], seen: 0 }));
  const fwd = new c.THREE.Vector3(); let caught = 0, cool = 0;
  c.tick((t, dt, P, ri) => {
    if (!here(r, ri) || r.guardsOff) return; cool -= dt;
    c.camera.getWorldDirection(fwd); const L = local(r, P);
    for (const q of G) {
      const dx = L.x - q.x, dz = L.z - q.z, d = Math.hypot(dx, dz);
      const dot = (dx * -fwd.x + dz * -fwd.z) / (d + 1e-6);   // positive when the guard is behind the view
      const unseen = dot > -0.25 || d > 14;
      q.m.rotation.y = Math.atan2(dx, dz);
      if (unseen && d > reach) { q.x += dx / d * speed * dt; q.z += dz / d * speed * dt; q.m.position.set(q.x, 0, q.z); }
      if (d < reach && cool <= 0) { cool = 4; caught++; c.say(q.m, caught > 2 ? 'We have met.' : line, 2600, 2.1); c.sound.horn && c.sound.horn(); c.flash(0.5);
        setTimeout(() => { c.P.x = r.x0 + W / 2; c.P.z = D / 2 - 2.2; c.P.yaw = 0; G.forEach((w) => { w.x = w.home[0]; w.z = w.home[1]; w.m.position.set(w.x, 0, w.z); }); c.toast('Escorted to the door. The guard walked you back without a word. He only moves when you look away. Keep looking.', 4200); c.egg('escorted', 'Escorted. He only moves while you are not looking. Walk backwards.'); onCatch && onCatch(); }, 350); }
    }
  });
  return G;
}

// ---------- the anamorphic painting, from the gold star ----------
function anamorph(c, r, g, X, piece, star, { n = 6, dir = [0, -1], span = 3.2 } = {}) {
  const { THREE } = c, tex = c.tex.load(`assets/art/${piece.f}`); tex.colorSpace = THREE.SRGBColorSpace;
  const [sx, sz] = star, EYE = 1.62, tiles = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u0 = i / n, v0 = 1 - (j + 1) / n;
    const d = 4 + Math.random() * 7, w = span / n;
    const ox = (i + 0.5 - n / 2) * w, oy = (n / 2 - j - 0.5) * w * (9 / 16);
    const geo = new THREE.PlaneGeometry(w, w * 9 / 16), uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / n, v0 + uv.getY(k) / n);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }));
    // along the ray from the star through a virtual picture 3 m out, scaled by distance
    const k = d / 3; m.position.set(sx + (dir[0] * 3 + ox * -dir[1]) * k, EYE + oy * k, sz + (dir[1] * 3 + ox * dir[0]) * k); m.scale.setScalar(k); m.lookAt(X(sx) - r.x0 + 0, EYE, sz); m.position.y = Math.max(0.2, m.position.y);
    g.add(m); tiles.push(m);
  }
  const star3 = decal(c, 0.8, 0.8, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2 - PI / 2, R = k % 2 ? w * 0.2 : w * 0.46; q.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R); } q.closePath(); q.fill(); });
  star3.rotation.x = -PI / 2; star3.position.set(sx, 0.02, sz); g.add(star3);
  let hit = false;
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P); const d = Math.hypot(L.x - sx, L.z - sz); if (d < 0.55 && !hit) { hit = true; c.sound.ding(); c.egg('lineup', `From the gold star the pieces line up: "${piece.t}" (No. ${piece.n}), hung across every god in the court. Step off it and the painting comes apart again.`); } if (d > 1.5) hit = false; });
  return tiles;
}

// ---------- the audio guide that lies ----------
const GUIDE = { on: false, heard: new Set() };
function speak(text) { try { if (!('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }
function guided(c, r, m, name, lie, h = 1.6) {
  c.clickable(m, () => {
    if (!GUIDE.on) { c.say(m, name, 2400, h); return; }
    c.say(m, `"${lie}"`, 5200, h); speak(lie); GUIDE.heard.add(name);
    if (GUIDE.heard.size === 1) c.egg('guide', 'The audio guide has started. It is very confident.');
    if (GUIDE.heard.size === 6) c.egg('docent', 'Six objects, six lies, one guide. The museum licensed this voice from a man who has never been inside.');
  }, name);
}

// ---------- rooms ----------
const ROOM = {
  // GALLERY 823. The crew came in through the gift shop. The guards only move while you look away.
  gallery(c, r, g, X) {
    const { THREE } = c;
    bindGun(c, ROOMSref());
    r.onEnter = () => { if (r.told) return; r.told = true; setTimeout(() => c.toast('You are holding the M.TEXTURE gun. Look at anything that stands, press F. The guards only move while you are not looking at them.', 6000), 1800); };
    // easels down the middle with the paintings the crew has not reached yet
    const easel = (x, z, ry) => { const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); const wood = std(c, 0x4a3420, { roughness: 0.7 }); for (const a of [-0.3, 0.3]) { const l = c.slab(0.05, 1.9, 0.05, wood, a, 0.95, 0); l.rotation.z = a > 0 ? -0.08 : 0.08; o.add(l); } const b = c.slab(0.05, 1.9, 0.05, wood, 0, 0.95, -0.28); b.rotation.x = 0.16; o.add(b); o.add(c.slab(0.9, 0.05, 0.12, wood, 0, 0.72, 0.06)); c.post(X(x), z, 0.45); return o; };
    const pics = r.cast.slice(0, 3);
    pics.forEach((p, k) => { const o = easel(4.5 + k * 5.4, -1.5 + (k % 2) * 1.2, 0.3 - k * 0.25); const fr = c.glb(['ph_fancy_picture_frame_01', 'ph_fancy_picture_frame_02'][k % 2], { h: 1.0, y: 0.75, parent: o }); wrappable(c, r, fr, { name: 'The frame on the easel', orig: 'wrapped' }); });
    // the crew: a tracksuit with the cans, a writer with the plan
    const chas = cast(c, r, g, X, 'tracksuit', 2.6, 4.6, { h: 1.78, ry: 0.6, line: 'You counting me? Nobody counts me. Wrap the sphinx first. The sphinx talks.', hint: 'The crew' });
    wrappable(c, r, chas, { name: 'Your own crew' });
    const w = cast(c, r, g, X, 'writer', 17.2, 4.4, { h: 1.76, ry: -0.7, line: 'The plan is simple. Everything gets wrapped. Then we open a museum about the night everything got wrapped.', hint: 'The writer', egg: 'plan' });
    wrappable(c, r, w, { name: 'The writer' });
    const sg = guards(c, r, g, X, [['usher', 1.2, -6.4, 1.85], ['agent', 18.6, -6.2, 1.85]]);
    sg.forEach((q) => wrappable(c, r, q.m, { name: 'A guard' }));
    // the bust by the door and the bird on a plinth, already wrapped by the crew on the way in
    plinth(c, g, X, 3.2, -5.4, 0.9, 1.1); const jack = c.glb('si_npg_andrew-jackson', { h: 0.9, x: 3.2, y: 1.1, z: -5.4, ry: 0.4, parent: g }); wrappable(c, r, jack, { name: 'A president in a bust' }); label(c, g, 3.2, 0.7, -4.9, 0, ['ANDREW JACKSON, BUST', 'wrapped in a painting, 2026', '"THE FIRST ONE WE DID"']);
    plinth(c, g, X, 16.8, -5.4, 0.9, 1.1); const bird = c.glb('tds_bird', { h: 0.8, x: 16.8, y: 1.1, z: -5.4, ry: -0.5, parent: g }); wrappable(c, r, bird, { name: 'A bird in stone' }); label(c, g, 16.8, 0.7, -4.9, 0, ['BIRD, MARBLE', 'a pigeon, formally', '"IT FLEW IN"']);
    // a bench, the WET FLOOR sign that means wet paint
    prop(c, r, g, X, 'painted_wooden_bench', 10, -0.6, { len: 2.2, r: 1.0 });
    prop(c, r, g, X, 'WetFloorSign_01', 7.6, 1.4, { h: 0.9, ry: 0.6, r: 0.3, egg: ['A sign', 'wetpaint', 'CAUTION WET FLOOR. The floor is fine. The sign is wrapped. It was wet paint. It is always wet paint.'] });
    prop(c, r, g, X, 'spray_paint_bottles_02', 13.2, 4.8, { len: 0.7, egg: ['The cans', 'cans', 'Nobody uses cans anymore. The gun wraps. The cans are for the signature.'] });
    prop(c, r, g, X, 'vintage_suitcase', 15.4, 5.2, { len: 1.1, ry: 0.5, r: 0.5, egg: ['The bag', 'bag', 'Inside the bag: 7,542 paintings, a MetroCard with eleven cents on it, a pastrami sandwich, and a map of the museum drawn on a napkin by a man who had never been.'] });
    plaque(c, g, 10, 3.2, D / 2 - 0.13, PI, 'THE MUSEUM IS CLOSED', 'THE MANAGEMENT, 9 PM', 2.2);
    notice(c, g, '"WRAP" = F · THE GUARDS MOVE WHEN YOU LOOK AWAY · "ART"', 10, 4.4, D / 2 - 0.13, PI, 6, 0.4, '#0d0d0d', '#f5c542');
    // the counted: a tally on the wall that grows with your wraps
    const tb = board(c, g, 2.2, 0.8, 256); tb.m.position.set(0.14, 4.6, 0.8); tb.m.rotation.y = PI / 2;
    c.tick((t) => { if ((t * 2 | 0) % 2) return; const { q, W: w2, H: h2 } = tb; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#f5c542'; q.font = `800 ${h2 * 0.22}px ${c.MONO}`; q.textAlign = 'left'; q.fillText('WRAPPED TONIGHT', 18, h2 * 0.34); q.fillStyle = '#f4ead2'; q.font = `900 ${h2 * 0.5}px ${c.SERIF}`; q.fillText(`${WRAP.n}`, 18, h2 * 0.86); tb.up(); });
  },

  // THE TEMPLE. A reflecting pool that remembers what the sphinxes looked like before tonight.
  dendur(c, r, g, X) {
    const { THREE } = c;
    // the temple: a sandstone gate and a cella on a platform, in the house measurements
    const sand = c.surf('ashlar', 1.6, 0xd2b48c), dark = std(c, 0x8a6a4a, { roughness: 0.9 });
    const px = 10, pz = -3.2;
    g.add(c.slab(10, 0.5, 7, sand, px, 0.25, pz)); c.wall(X(px - 5), pz - 3.5, X(px + 5), pz - 3.5); // the platform's far edge is the pool's edge
    for (const dx of [-4.0, 4.0]) { g.add(c.slab(1.6, 4.6, 1.2, sand, px + dx, 0.5 + 2.3, pz + 2.2)); c.post(X(px + dx), pz + 2.2, 1.1); }
    g.add(c.slab(9.6, 0.6, 1.2, sand, px, 5.1, pz + 2.2));
    g.add(c.slab(3.6, 3.2, 3.0, sand, px, 0.5 + 1.6, pz - 1.6)); c.post(X(px), pz - 1.6, 2.2);
    g.add(c.slab(4.0, 0.3, 3.4, dark, px, 4.25, pz - 1.6));
    // the pool: a Reflector that sees layer 1 (the marble clones) and not layer 2 (the wrapped sphinxes)
    const pool = new Reflector(new THREE.PlaneGeometry(13, 4.6), { textureWidth: c.MOBILE ? 512 : 1024, textureHeight: c.MOBILE ? 256 : 512, color: 0x8fa4b8, clipBias: 0.003 });
    pool.rotation.x = -PI / 2; pool.position.set(10, 0.02, 3.4); g.add(pool);
    // the reflection camera is a clone of the visitor's: it sees the marble twins (layer 1) and never the wrapped (layer 2)
    const rc = pool.getReflectionCamera(c.camera); rc.layers.enable(1); rc.layers.disable(2); c.camera.layers.enable(2);
    const rim = std(c, 0x3a3a3e, { roughness: 0.5 }); g.add(c.slab(13.4, 0.18, 0.2, rim, 10, 0.09, 1.0)); g.add(c.slab(13.4, 0.18, 0.2, rim, 10, 0.09, 5.8)); g.add(c.slab(0.2, 0.18, 5, rim, 3.3, 0.09, 3.4)); g.add(c.slab(0.2, 0.18, 5, rim, 16.7, 0.09, 3.4));
    c.wall(X(3.4), 1.1, X(16.6), 1.1); c.wall(X(3.4), 5.7, X(16.6), 5.7); c.wall(X(3.4), 1.1, X(3.4), 5.7); c.wall(X(16.6), 1.1, X(16.6), 5.7);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), new THREE.MeshStandardMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3, depthWrite: false })); water.rotation.x = -PI / 2; water.position.set(10, 0.03, 3.4); g.add(water);
    const sph = (name, x, z, ry, nm) => {
      const m = c.glb(name, { len: 2.6, x, z, ry, parent: g, onload: (gg) => { gg.traverse((o) => { if (o.isMesh) o.layers.set(2); }); const cl = gg.clone(true); cl.traverse((o) => { if (o.isMesh) { o.material = marbleMat(c); o.layers.set(1); } }); g.add(cl); cl.position.copy(gg.position); cl.rotation.copy(gg.rotation); m.userData.twin = cl; } });
      c.post(X(x), z, 1.1); wrappable(c, r, m, { name: nm }); return m;
    };
    const s1 = sph('tds_sphinx-1', 5.2, -0.4, 0.5, 'The west sphinx'), s2 = sph('tds_sphinx-3', 14.8, -0.4, -0.5, 'The east sphinx');
    [s1, s2].forEach((m) => c.clickable(m, () => { const Q = ['What has four legs in the morning, two at noon, and a MetroCard with eleven cents on it at night? A New Yorker.', 'What is wrapped on the outside and stone on the inside and remembers Nubia? Me. The answer is always me.', 'Why does the pool show me plain? The pool was here before tonight. The pool is old. The pool is not impressed.']; c.say(m, Q[(m.userData.q = (m.userData.q || 0) + 1) % Q.length], 4200, 1.8); if (m.userData.q === 3) c.egg('riddle', 'Three riddles. The sphinx does not eat the wrong answers anymore. Union rules.'); }, 'A sphinx'));
    label(c, g, 5.2, 0.5, 1.0, 0, ['SPHINX, WEST', 'wrapped, 11:58 pm tonight', '"ASK IT"']); label(c, g, 14.8, 0.5, 1.0, 0, ['SPHINX, EAST', 'wrapped, 11:59 pm tonight', '"IT ANSWERS"']);
    // the egg: stand at the water and see them plain
    let seen = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || seen) return; const L = local(r, P); if (L.z > 5.9 && L.z < 7.4 && L.x > 4 && L.x < 16 && c.P.pitch < -0.35) { seen = true; c.egg('reflection', 'In the pool the sphinxes are plain stone. The water remembers them from before tonight. Water is like that.'); } });
    // the temple's own wrapped relic: the bas relief, and the Nile light
    const rel = c.glb('tds_relief-with-bulls-legs', { len: 2.2, x: 10, y: 0.5, z: -0.2, ry: PI, rx: 0, parent: g }); wrappable(c, r, rel, { name: 'The relief' });
    guards(c, r, g, X, [['usher', 1.6, -6.8, 1.85]], { speed: 0.8 });
    for (const x of [2.2, 17.8]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), basic(c, 0xbfd8ff)); l.position.set(x, 4.8, -5.0); g.add(l); }
    plaque(c, g, 10, 3.0, D / 2 - 0.13, PI, 'A GIFT FROM EGYPT, 1965', 'THE POOL, UNWRAPPED', 2.4);
  },

  // THE COURT. Every god wrapped, and one spot on the floor where a painting assembles across all of them.
  court(c, r, g, X) {
    const { THREE } = c;
    for (const x of [2.2, 6.4, 13.6, 17.8]) for (const z of [-6.0, 0.4]) column(c, g, x, z, 6.9, 0.34); for (const x of [2.2, 6.4, 13.6, 17.8]) for (const z of [-6.0, 0.4]) c.post(X(x), z, 0.55);
    const wc1 = c.glb('tds_coloumn-02', { h: 2.4, x: 2.4, z: -2.8, parent: g }); wrappable(c, r, wc1, { name: 'A capital' }); c.post(X(2.4), -2.8, 0.7);
    const wc2 = c.glb('tds_column-07', { h: 2.4, x: 17.6, z: -2.8, parent: g }); wrappable(c, r, wc2, { name: 'A capital' }); c.post(X(17.6), -2.8, 0.7);
    const gods = [['tds_hermes-fastening-his-sandals', 5.0, -4.2, 'Hermes, tying a sandal', 1.9, 0], ['tds_efebo', 8.2, -5.0, 'An ephebe', 1.8, 0], ['tds_sleeping-hermaphroditus', 11.8, -5.0, 'Sleeping Hermaphroditus', 0.8, 0, 2.2], ['tds_actaeon', 15.0, -4.2, 'Actaeon', 1.7, PI], ['tds_triton', 10, -1.6, 'A triton', 1.5, PI], ['tds_la-nymphe-salmacis', 4.2, 1.6, 'The nymph Salmacis', 1.6, 0], ['tds_leroux', 15.8, 1.6, 'A gentleman in a coat', 1.6, PI / 2], ['tds_statue-of-resting-goat', 7.2, 3.6, 'A resting goat', 0.9, 0, 1.4], ['tds_gruppe-mit-zwei-windhunden', 12.8, 3.6, 'Two greyhounds', 1.0, 0, 1.4], ['tds_enfant-au-chien-restored', 10, 1.2, 'A child and a dog', 1.1, 0]];
    gods.forEach(([name, x, z, nm, h, rx, len]) => { const ph = plinth(c, g, X, x, z, len ? len + 0.4 : 1.1, 0.7, len ? 1.2 : 1.1); const m = c.glb(name, len ? { len, x, y: 0.7, z, rx, parent: g, ry: Math.random() * 0.6 - 0.3 } : { h, x, y: 0.7, z, rx, parent: g, ry: Math.random() * 0.6 - 0.3 }); wrappable(c, r, m, { name: nm }); c.clickable(m, () => c.say(m, nm + '. Wrapped at ' + (12 + ((x * 7) | 0) % 50) + ' past midnight.', 2600, h + 1.0), nm); });
    plinth(c, g, X, 17.4, 5.0, 0.8, 1.2); const ein = c.glb('tds_einstein', { h: 0.7, x: 17.4, y: 1.2, z: 5.0, ry: -0.6, parent: g }); wrappable(c, r, ein, { name: 'Einstein, the bust' }); label(c, g, 17.4, 0.8, 5.5, 0, ['EINSTEIN, BUST', 'Princeton, by way of 112th St', '"RELATIVELY WRAPPED"']);
    plinth(c, g, X, 2.6, 5.0, 1.6, 0.6, 1.0); const rh = c.glb('tds_rhino', { len: 1.8, x: 2.6, y: 0.6, z: 5.0, ry: 0.8, parent: g }); wrappable(c, r, rh, { name: 'The rhinoceros' }); label(c, g, 2.6, 0.5, 5.6, 0, ['RHINOCEROS', 'not Greek, not Roman, here anyway', '"LOST, THEN WRAPPED"']);
    // the painting that only comes together from the star
    const star = [10, 3.6]; anamorph(c, r, g, X, r.cast[3] || r.cast[0], star, { n: 6, dir: [0, -1], span: 3.0 });
    notice(c, g, 'STAND ON THE "STAR" · LOOK "NORTH"', 10, 0.06, 4.6, 0, 2.4, 0.3, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
    guards(c, r, g, X, [['agent', 18.6, -6.6, 1.85], ['usher', 1.4, -6.6, 1.85]], { speed: 0.9 });
    // the skylight
    const sk = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), basic(c, 0xeaf0ff)); sk.rotation.x = PI / 2; sk.position.set(10, 6.94, -2); g.add(sk);
    for (let i = 0; i < 6; i++) { g.add(c.slab(0.1, 0.12, 8, std(c, 0x8a8a8a), 4 + i * 2.4, 6.9, -2)); }
    plaque(c, g, 10, 3.4, D / 2 - 0.13, PI, 'THE GODS ARE "FINE"', 'THE CURATOR OF ANTIQUITIES', 2.2);
  },

  // ARMS AND ARMOR. The audio guide tells you about everything. All of it is false.
  armor(c, r, g, X) {
    const { THREE } = c;
    // the guide: a headset on a stand by the door
    const stand = c.slab(0.5, 1.1, 0.5, std(c, 0x1a1a1e, { roughness: 0.5 }), 2.4, 0.55, 5.4); g.add(stand); c.post(X(2.4), 5.4, 0.45);
    const hs = c.glb('ph_vintage_radio_transceiver', { len: 0.5, x: 2.4, y: 1.1, z: 5.4, ry: 0.4, parent: g });
    c.clickable(hs, () => { GUIDE.on = !GUIDE.on; c.toast(GUIDE.on ? 'AUDIO GUIDE ON. Click any object in the hall. The voice is licensed. The facts are not.' : 'Audio guide off. The hall is quiet again, which is also a lie.', 3600); if (GUIDE.on) speak('Welcome to Arms and Armor. Everything you are about to hear has been checked by nobody.'); c.sound.beep && c.sound.beep(); }, 'The audio guide');
    notice(c, g, '"AUDIO GUIDE" · $7 · "FACTS" NOT INCLUDED', 2.4, 1.9, 5.4, 0, 2.0, 0.34, '#0d0d0d', '#f5c542');
    const T = [
      ['tds_helmet', 5.6, -4.8, 'A helmet', 'This helmet was worn at the Battle of Astoria in 1322, which did not take place, by a knight who did not exist, and it fits a size seven and a quarter.', { h: 0.8, y: 1.1 }],
      ['ph_kite_shield', 9.2, -5.2, 'A kite shield', 'The kite shield. Named for the kite. Kites were invented in 1902 at Coney Island, so this shield is from the future.', { h: 1.3, y: 0.9 }],
      ['ph_wooden_handle_saber', 12.8, -5.2, 'A saber', 'The saber of the Duke of Bensonhurst. It has never been drawn. It has been pointed, at a landlord, twice.', { len: 1.2, y: 1.2 }],
      ['ph_cross_pein_hammer', 16.4, -4.8, 'A war hammer', 'A war hammer, used in the war on the Second Avenue subway, which is ongoing.', { h: 0.9, y: 1.0 }],
      ['ph_vintage_hand_drill', 4.4, 2.2, 'A siege drill', 'The siege drill. Medieval. It plugs into nothing. It needs no outlet. It needs you to believe.', { h: 0.8, y: 1.0 }],
      ['ph_handsaw_wood', 15.6, 2.2, 'A ceremonial saw', 'A ceremonial saw of the Guild of Super Intendents. The ceremony is: they come Tuesday. They do not come Tuesday.', { len: 1.0, y: 1.0 }],
      ['si_nmah_the-peace-keeper-baseball-bat', 7.6, 3.4, 'A mace', 'A mace of the Bronx, 1986. Inscribed THE PEACE KEEPER. It kept the peace by being seen.', { len: 1.0, y: 1.0 }],
      ['si_nmafa_hunting-horn', 12.4, 3.4, 'The horn', 'The horn. Blow it and the parade starts. Nobody has blown it. The parade has been waiting since the lease.', { len: 0.9, y: 1.0 }],
    ];
    T.forEach(([name, x, z, nm, lie, o]) => { plinth(c, g, X, x, z, 0.9, o.y, 0.9); const m = c.glb(name, { ...o, x, z, parent: g, ry: Math.random() * 0.8 - 0.4 }); wrappable(c, r, m, { name: nm }); guided(c, r, m, nm, lie, o.y + 0.7); label(c, g, x, 0.5, z + 0.56, 0, [nm.toUpperCase(), 'wrapped tonight', '"ASK THE GUIDE"']); });
    // the knight's horse at the end of the hall, and a knight who is a usher in a helmet
    plinth(c, g, X, 10, -1.2, 2.2, 0.5, 1.4); const horse = c.glb('ph_horse_statue_01', { h: 2.3, x: 10, y: 0.5, z: -1.2, ry: PI * 0.1, parent: g }); wrappable(c, r, horse, { name: 'The horse' }); guided(c, r, horse, 'The parade horse', 'The parade horse. Bronze. It has been rearing since 1904. The vet says it is fine. The vet is also bronze.', 2.6);
    const gs = guards(c, r, g, X, [['usher', 18.4, -6.4, 1.85]], { speed: 0.7 });
    prop(c, r, g, X, 'old_gas_mask', 17.2, 5.2, { h: 0.5, y: 0.9, ry: 0.6 }); plinth(c, g, X, 17.2, 5.2, 0.7, 0.9, 0.7);
    prop(c, r, g, X, 'gothic_statue', 1.4, -1.2, { h: 2.2, r: 0.5, hint: 'A saint', fn: (cc, m) => cc.say(m, 'I was here before the museum. I will be here after the wrap. Saints are patient. Saints have to be.', 3200, 2.4) });
    bulbs(c, g, 3, 17, 5.4, -6.4, 18, 0xffd8a0);
    plaque(c, g, 10, 3.2, D / 2 - 0.13, PI, 'EVERY WORD IS "TRUE"', 'THE AUDIO GUIDE', 2.2);
  },

  // THE AMERICAN WING. Do not touch. Everything is touched. The alarm has opinions and the guards have legs.
  american(c, r, g, X) {
    const { THREE } = c;
    const ALARM = { on: false, box: null, t: 0, silenced: false };
    const items = [
      ['si_npg_george-washington', 5.0, -4.6, 'Washington, the bust', { h: 0.9, y: 1.1 }, ['GEORGE WASHINGTON', 'slept here, briefly, 1789', '"DO NOT TOUCH"']],
      ['si_nmah_cher-ami', 9.0, -5.0, 'Cher Ami, the pigeon', { h: 0.5, y: 1.1 }, ['CHER AMI, PIGEON', 'twelve messages, one leg, 1918', '"A NEW YORKER, FORMALLY"']],
      ['si_nmaahc_alto-saxophone-owned-and-played-by-charlie-parker', 13.0, -5.0, 'The saxophone', { len: 1.0, y: 1.05 }, ['ALTO SAXOPHONE', 'played on 52nd Street', '"DO NOT PLAY"']],
      ['si_nmah_feedsack-dress', 16.6, -4.6, 'The feedsack dress', { h: 1.3, y: 0.7 }, ['FEEDSACK DRESS', 'cotton, a sack, a decision', '"DO NOT WEAR"']],
      ['si_nmaahc_ski-boots-worn-by-seba-johnson', 4.4, 2.4, 'The ski boots', { len: 0.7, y: 1.0 }, ['SKI BOOTS', 'worn at an Olympics', '"DO NOT SKI"']],
      ['si_nmaahc_pair-of-stars-and-stripes-slippers-attributed-to-elizabeth-k', 8.2, 3.2, 'The slippers', { len: 0.6, y: 1.0 }, ['SLIPPERS', 'stars, stripes, a Tuesday', '"DO NOT SHUFFLE"']],
      ['si_nmaahc_egg-carton-from-muslim-farms', 11.8, 3.2, 'The egg carton', { len: 0.6, y: 1.0 }, ['EGG CARTON', 'a dozen, a farm, a city', '"DO NOT CRACK"']],
      ['si_nmaahc_photograph-album-owned-by-emily-howland', 15.6, 2.4, 'The album', { len: 0.6, y: 1.0 }, ['PHOTOGRAPH ALBUM', 'every face in it is a flower now', '"DO NOT OPEN"']],
    ];
    const near = [];
    items.forEach(([name, x, z, nm, o, lb]) => { plinth(c, g, X, x, z, 0.9, o.y, 0.9); const m = c.glb(name, { ...o, x, z, parent: g, ry: Math.random() * 0.8 - 0.4 }); wrappable(c, r, m, { name: nm }); label(c, g, x, 0.5, z + 0.56, 0, lb); near.push([x, z, nm, m]); c.clickable(m, () => { trip(nm, m); }, nm + ' (do not touch)'); });
    // the alarm box on the wall: red, loud, wrappable
    const box = c.slab(0.4, 0.5, 0.16, std(c, 0xc81e1e, { roughness: 0.4 }), 0.33, 2.3, -2.0); g.add(box); const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 20), std(c, 0xd8d0c0, { metalness: 0.9, roughness: 0.3 })); bell.rotation.z = PI / 2; bell.position.set(0.46, 2.3, -2.0); g.add(bell);
    const bx = new THREE.Group(); bx.add(box); bx.add(bell); g.add(bx); bx.userData.ready = true; const tb = wrappable(c, r, bx, { name: 'The alarm' });
    notice(c, g, '"ALARM" · DO NOT WRAP', 0.2, 2.9, -2.0, PI / 2, 1.2, 0.26, '#0d0d0d', '#ff4a4a');
    const red = new THREE.PointLight(0xff2020, 0, 18, 1.6); red.position.set(10, 4.5, 0); g.add(red);
    const G = guards(c, r, g, X, [['usher', 1.0, -6.4, 1.85], ['agent', 19.0, 5.2, 1.85]], { speed: 1.5, line: 'Sir. SIR. That is a HUNDRED years old.' });
    r.guardsOff = true;
    const trip = (nm, m) => { if (ALARM.silenced) { c.say(m, nm + '. Touched. Nothing happened. The alarm is a painting now.', 2600, 1.9); return; } if (!ALARM.on) { ALARM.on = true; r.guardsOff = false; c.sound.horn && c.sound.horn(); c.flash(0.3); c.toast(`You touched ${nm}. The alarm has opinions. The guards have legs. Wrap the alarm box by the west wall to shut it up.`, 5000); c.egg('touched', 'DO NOT TOUCH. You touched. Everybody touches. The sign is not a rule, it is a dare.'); } };
    r.onWrap = (t) => { if (t === tb && ALARM.on) { ALARM.on = false; ALARM.silenced = true; r.guardsOff = true; red.intensity = 0; c.sound.ding(); c.egg('silenced', 'The alarm is wrapped. It is still going off, in its heart. The guards have stopped. One of them is admiring the pattern.'); G.forEach((q) => c.say(q.m, 'Oh that is nice.', 2200, 2.1)); } };
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) { red.intensity = 0; return; } if (ALARM.on) { ALARM.t += dt; red.intensity = (Math.sin(ALARM.t * 9) > 0 ? 28 : 4); if (((ALARM.t * 1.5) | 0) !== (((ALARM.t - dt) * 1.5) | 0)) c.sound.beep && c.sound.beep(); } else red.intensity += (0 - red.intensity) * Math.min(1, dt * 4);
      const L = local(r, P); for (const [x, z, nm, m] of near) { if (Math.hypot(L.x - x, L.z - z) < 0.95 && !m.userData.warned) { m.userData.warned = true; c.say(m, 'Too close.', 1400, 1.9); setTimeout(() => { m.userData.warned = false; }, 6000); } } });
    // the period room's own furniture (Poly Haven, wrapped on sight)
    prop(c, r, g, X, 'ArmChair_01', 2.6, 5.0, { len: 1.1, ry: 0.7, r: 0.6, egg: ['A chair', 'sat', 'DO NOT SIT. You sat. It is a very good chair. Washington sat here. Washington sat everywhere. He was tired.'] });
    prop(c, r, g, X, 'vintage_grandfather_clock_01', 18.6, 0.2, { h: 2.3, ry: -PI / 2, r: 0.4, egg: ['A clock', 'clock', 'The clock stopped in 1896. It is right twice a day, which is more than the guards.'] });
    prop(c, r, g, X, 'ornate_mirror_01', 10, -6.3, { h: 1.6, y: 1.5, ry: 0 });
    prop(c, r, g, X, 'Rockingchair_01', 17.6, 5.2, { len: 1.0, ry: -0.5, r: 0.5, sway: 1.4 });
    plaque(c, g, 10, 3.4, D / 2 - 0.13, PI, 'DO NOT TOUCH', 'EVERYTHING HERE HAS BEEN TOUCHED', 2.2);
  },

  // THE GIFT SHOP. The price grows while you look. Everything is a wrapped version of something you cannot afford.
  shop(c, r, g, X) {
    const { THREE } = c;
    const goods = [
      ['ph_carrot_cake', 'A cake', 12], ['ph_wine_bottles_01', 'Wine', 38], ['ph_television_02', 'A television', 199], ['ph_Megaphone_01', 'A megaphone', 44], ['ph_digital_wrist_watch', 'A watch', 29], ['ph_vintage_lighter', 'A lighter', 9],
      ['ph_pot_enamel_01', 'A pot', 31], ['ph_metal_toolbox', 'A toolbox', 56], ['ph_old_tyre', 'A tyre', 120], ['ph_lifebuoy', 'A life ring', 88], ['ph_life_jacket', 'A life jacket', 75], ['ph_plunger', 'A plunger', 14], ['ph_concrete_cat_statue', 'The cat', 400], ['ph_sungka_board', 'A board game', 22],
    ];
    const shelf = (x, z, ry) => { const wood = std(c, 0xd8d0c0, { roughness: 0.6 }); const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); for (const y of [0.45, 1.15, 1.85]) o.add(c.slab(3.2, 0.05, 0.6, wood, 0, y, 0)); for (const a of [-1.55, 1.55]) o.add(c.slab(0.05, 2.0, 0.6, wood, a, 1.0, 0)); c.wall(X(x) - 1.6 * Math.cos(ry), z + 1.6 * Math.sin(ry), X(x) + 1.6 * Math.cos(ry), z - 1.6 * Math.sin(ry)); return o; };
    const S = [[4, -4.6, 0], [10, -4.6, 0], [16, -4.6, 0], [4, 1.0, 0], [16, 1.0, 0]];
    const tags = [];
    goods.forEach(([name, nm, base], k) => {
      const sh = S[k % S.length], slot = Math.floor(k / S.length), lx = -1.0 + (k % 3) * 1.0, ly = [0.5, 1.2, 1.9][slot % 3];
      const x = sh[0] + lx, z = sh[1] + 0.0;
      if (k < S.length) shelf(sh[0], sh[1], sh[2]);
      const m = c.glb(name, { h: 0.5, x, y: ly, z, parent: g, ry: Math.random() * 1.2 - 0.6, shadow: false }); wrappable(c, r, m, { name: nm });
      const tg = board(c, g, 0.5, 0.22, 96); tg.m.position.set(x, ly + 0.62, z + 0.32); tags.push({ tg, x, z, nm, price: base, base, m });
      c.clickable(m, () => { const tt = tags.find((q) => q.m === m); c.say(m, `${nm}. $${Math.round(tt.price).toLocaleString('en-US')}. It was $${tt.base} when you walked in.`, 3200, 0.5); if (tt.price > 1000 && !tt.sold) { tt.sold = true; c.egg('inflation', `${nm} passed a thousand dollars while you looked at it. Looking is the expensive part. It always was.`); } }, nm);
    });
    const fwd = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; c.camera.getWorldDirection(fwd); const L = local(r, P);
      for (const q of tags) { const dx = q.x - L.x, dz = q.z - L.z, d = Math.hypot(dx, dz); const dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6); if (d < 5 && dot > 0.975) q.price += dt * (6 + q.base * 0.4) * (1 + q.price / 400); else q.price = Math.max(q.base, q.price - dt * 2);
        if (((t * 6) | 0) !== (((t - dt) * 6) | 0)) { const { q: qq, W: w2, H: h2 } = q.tg; qq.fillStyle = q.price > q.base * 3 ? '#ff4fa3' : '#f4ead2'; qq.fillRect(0, 0, w2, h2); qq.fillStyle = '#111'; qq.font = `800 ${h2 * 0.6}px ${c.MONO}`; qq.textAlign = 'center'; qq.fillText('$' + Math.round(q.price).toLocaleString('en-US'), w2 / 2, h2 * 0.72); q.tg.up(); } } });
    // the posters: the SAME DIFFERENCE one sheets on a rack
    const PO = window.POSTERS || [];
    PO.forEach((f, k) => { const t = c.tex.load(`assets/posters/${f}`); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.35), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); const col = k % 12, row = Math.floor(k / 12); m.position.set(0.16, 4.2 - row * 1.5, -7.2 + col * 1.2); m.rotation.y = PI / 2; g.add(m); c.clickable(m, () => { c.say(m, 'A poster from SAME DIFFERENCE. $45. $46 now.', 2400, 0.9); }, 'A poster'); });
    notice(c, g, '"POSTERS" · $45 · $46 IF YOU READ THIS', 0.2, 5.5, -1.2, PI / 2, 3.2, 0.34, '#0d0d0d', '#f5c542');
    // the register and the cashier, who is a bodega cat
    prop(c, r, g, X, 'CashRegister_01', 4.4, 4.2, { len: 0.7, y: 0.9, ry: PI });
    g.add(c.slab(2.6, 0.9, 0.8, std(c, 0xd8d0c0), 4.4, 0.45, 4.2)); c.wall(X(3.1), 3.8, X(5.7), 3.8); c.wall(X(3.1), 4.6, X(5.7), 4.6);
    const catm = cast(c, r, g, X, 'sw_bodegacat', 4.4, 5.4, { h: 1.0, ry: PI, line: 'No returns. No exchanges. No eye contact. Next.', hint: 'The cashier', egg: 'cashier' }); wrappable(c, r, catm, { name: 'The cashier' });
    prop(c, r, g, X, 'tea_set_01', 14.6, 4.6, { len: 0.8, y: 0.9 }); plinth(c, g, X, 14.6, 4.6, 1.0, 0.9, 0.8);
    guards(c, r, g, X, [['usher', 18.6, -6.4, 1.85]], { speed: 0.6 });
    plaque(c, g, 10, 3.2, D / 2 - 0.13, PI, 'EXIT THROUGH THE "GIFT SHOP"', 'THE MANAGEMENT', 2.4);
  },

  // THE ROOF GARDEN. The moon is huge on the skyline and a coin overhead. The telescope looks into apartments.
  roof(c, r, g, X) {
    const { THREE } = c;
    const moon = c.glb('moon', { len: 1.0, x: 10, y: 9, z: -30, parent: c.scene, shadow: false }); moon.position.x = r.x0 + 10;
    wrappable(c, r, moon, { name: 'The moon' });
    const halo = glow(c, g, 0, 0, 0, 'rgba(255,240,200,.6)', 3); halo.visible = false;
    let coin = false, big = false;
    c.tick((t, dt, P, ri) => { moon.visible = here(r, ri); halo.visible = moon.visible; if (!moon.visible) return;
      const pitch = Math.max(0, c.P.pitch), k = 1 - Math.min(1, pitch / 1.1);   // huge near the horizon, a coin overhead
      const dist = 28 + k * 10, h = 11 + (1 - k) * 30, s = 3 + k * 7;
      moon.position.set(r.x0 + 5, h, -D / 2 - dist); moon.scale.setScalar(s); moon.rotation.y = t * 0.05;
      halo.position.set(5, h, -D / 2 - dist + 0.5); halo.scale.set(s * 2.2, s * 2.2, 1);
      if (pitch > 0.95 && !coin) { coin = true; c.egg('coin', 'Overhead the moon is a coin. On the skyline it was a building. Same moon. Your eye is the museum.'); }
      if (pitch < 0.1 && c.P.z < -2 && !big) { big = true; }
    });
    // the telescope: a wrapped Hubble on a tripod, which is binoculars
    const tri = std(c, 0x2a2a2e, { metalness: 0.6, roughness: 0.4 }); for (const a of [0, 2.1, 4.2]) { const l = c.slab(0.05, 1.5, 0.05, tri, 4 + Math.cos(a) * 0.35, 0.75, -3 + Math.sin(a) * 0.35); l.rotation.z = Math.cos(a) * 0.25; l.rotation.x = -Math.sin(a) * 0.25; g.add(l); }
    const hub = c.glb('nasa_hubble-25th-anniversary-model', { len: 1.6, x: 4, y: 1.5, z: -3, ry: 0.4, parent: g, shadow: false }); hub.rotation.x = -0.5; wrappable(c, r, hub, { name: 'The telescope' }); c.post(X(4), -3, 0.5);
    c.clickable(hub, () => { c.zoom(true); c.egg('peep', 'A space telescope pointed at a studio on the ninth floor. In New York every telescope is pointed at a window. Press Z to put it down.'); }, 'The telescope (look through it)');
    label(c, g, 4, 0.5, -2.4, 0, ['HUBBLE, 1:25', 'points at 4F, across the park', '"ASTRONOMY"']);
    // the roof commission, a dragon in a planter, cafe tables, the bar
    plinth(c, g, X, 15.4, -3.4, 2.4, 0.5, 1.6, 0x6a6a70); const dr = c.glb('tds_dragon-2', { len: 2.4, x: 15.4, y: 0.5, z: -3.4, rx: -PI / 2, ry: 0.4, parent: g }); wrappable(c, r, dr, { name: 'The roof commission' }); label(c, g, 15.4, 0.5, -2.5, 0, ['ROOF COMMISSION, 2026', 'a dragon, wrapped, on loan from nobody', '"SITE SPECIFIC"']);
    for (const [x, z] of [[7, 2.6], [10, 1.4], [13, 2.6]]) { prop(c, r, g, X, 'round_wooden_table_01', x, z, { len: 0.9, r: 0.5 }); prop(c, r, g, X, 'metal_stool_01', x + 0.7, z + 0.3, { h: 0.7, r: 0.2 }); prop(c, r, g, X, 'metal_stool_01', x - 0.7, z - 0.3, { h: 0.7, r: 0.2 }); }
    prop(c, r, g, X, 'CoffeeCart_01', 17.4, 3.6, { len: 2.0, ry: -PI / 2, r: 1.0, egg: ['The bar', 'bar', 'The roof bar. A glass of wine is $24 and comes with the view. The view is $31. Nobody has ever had just the view.'] });
    for (const [x, z] of [[2, 5.2], [18.4, -6.2], [2.2, -6.2], [18, 5.6]]) prop(c, r, g, X, 'planter_box_01', x, z, { len: 1.6, r: 0.8 });
    prop(c, r, g, X, 'potted_plant_02', 2.2, 1.2, { h: 1.4, r: 0.4 }); prop(c, r, g, X, 'potted_plant_04', 18, 0.8, { h: 1.3, r: 0.4 });
    // the parapet with the city's own lights, and a gull
    g.add(c.slab(W, 1.1, 0.3, c.surf('ashlar', 1.4, 0x8a8a8a), W / 2, 0.55, -D / 2 + 1.0)); c.wall(X(0), -D / 2 + 1.15, X(W), -D / 2 + 1.15);
    const gull = c.glb('gull', { len: 0.8, x: 12, y: 1.2, z: -6.9, parent: g, shadow: false }); c.tick((t) => { gull.position.set(12 + Math.sin(t * 0.4) * 5, 1.2 + Math.sin(t * 1.3) * 0.2, -6.9); gull.rotation.y = Math.cos(t * 0.4) > 0 ? PI / 2 : -PI / 2; }); c.clickable(gull, () => c.say(gull, 'MINE.', 1200, 0.6), 'A gull');
    cast(c, r, g, X, 'dancer', 8.2, -4.6, { h: 1.76, ry: 0.3, line: 'I come up here to think. Then the moon does that thing and I stop.', hint: 'A regular' });
    guards(c, r, g, X, [['agent', 1.2, -2, 1.85]], { speed: 0.5 });
    plaque(c, g, 10, 2.6, D / 2 - 0.13, PI, 'THE "VIEW" IS THE WORK', 'THE ROOF GARDEN, CLOSED AT DUSK', 2.4);
  },

  // THE CONSERVATION LAB. The gun runs backwards. One of the originals was never original.
  lab(c, r, g, X) {
    const { THREE } = c;
    WRAP.mode = 'wrap'; r.onEnter = () => { WRAP.mode = 'unwrap'; c.toast('The lab. F now UNWRAPS. Ten objects on the tables. Take them down to the stone. One of them will not come off.', 5200); const b = document.getElementById('wrapbtn'); if (b) b.textContent = 'UNWRAP F'; };
    r.onLeave = () => { WRAP.mode = 'wrap'; const b = document.getElementById('wrapbtn'); if (b) b.textContent = 'WRAP F'; };
    const steel = std(c, 0xb8bcc0, { metalness: 0.9, roughness: 0.3 });
    const T = [
      ['tds_homo-heidelbergensis-model', 'A hominid', { h: 0.9, rx: -PI / 2 }], ['tds_bone', 'A bone', { len: 0.9 }], ['tds_dark-finger-reef-crab', 'A crab', { len: 0.7 }], ['tds_blue-sea-star', 'A sea star', { len: 0.7 }],
      ['tds_le-transi-de-rene-de-chalon', 'A transi', { h: 1.0 }], ['tds_molding-of-a-section-of-the-bas-relief-of-angkor-wat-depic', 'A relief', { len: 0.9 }], ['si_nmah_western-electric-tangent-galvanometer', 'A galvanometer', { len: 0.7 }], ['si_nmaahc_bully-beef-can-opener', 'A can opener', { len: 0.6 }],
      ['nmnhmammals_hylobates-agilis', 'A gibbon', { h: 0.9 }], ['ph_spinning_wheel_01', 'A spinning wheel', { h: 1.0 }],
    ];
    const tbl = (x, z) => { g.add(c.slab(2.0, 0.06, 0.9, steel, x, 0.95, z)); for (const [a, b] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) g.add(c.slab(0.05, 0.95, 0.05, steel, x + a, 0.47, z + b)); c.wall(X(x) - 1, z - 0.45, X(x) + 1, z - 0.45); c.wall(X(x) - 1, z + 0.45, X(x) + 1, z + 0.45); c.wall(X(x) - 1, z - 0.45, X(x) - 1, z + 0.45); c.wall(X(x) + 1, z - 0.45, X(x) + 1, z + 0.45); };
    let down = 0; const fake = 7;
    T.forEach(([name, nm, o], k) => { const x = 3.2 + (k % 5) * 3.4, z = k < 5 ? -3.6 : 2.2; tbl(x, z); const m = c.glb(name, { ...o, x, y: 0.98, z, parent: g, ry: Math.random() * 1.2 - 0.6, shadow: false }); const t = wrappable(c, r, m, { name: nm }); if (k === fake) t.fake = true; label(c, g, x, 0.6, z + 0.6, 0, [nm.toUpperCase(), 'wrapped, now in treatment', '"TAKE IT DOWN"']); c.clickable(m, () => c.say(m, nm + '. ' + (t.state === 'marble' ? 'Down to the stone.' : 'Still wrapped. F.'), 2000, 1.4), nm); });
    r.onUnwrap = (t) => { if (t.state === 'marble') { down++; if (down === 9) { c.egg('conserved', 'Nine down to the stone. The tenth is still wrapped. It will not come off.'); } }
      if (down >= 9 && t.fake) { setTimeout(() => { c.sound.applause && c.sound.applause(); window.__finale && window.__finale(); }, 1800); } };
    // the certificate: your night in numbers
    const cert = board(c, g, 3.6, 1.6, 512); cert.m.position.set(W - 0.16, 3.2, -2.2); cert.m.rotation.y = -PI / 2;
    c.tick((t) => { if (((t * 2) | 0) % 2) return; const { q, W: w2, H: h2 } = cert; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#111'; q.font = `800 ${h2 * 0.1}px ${c.MONO}`; q.textAlign = 'left'; q.fillText('CERTIFICATE OF WRAPPING', 24, h2 * 0.18); q.font = `500 ${h2 * 0.08}px ${c.MONO}`; q.fillText(`Objects wrapped tonight: ${WRAP.n}`, 24, h2 * 0.36); q.fillText(`Objects unwrapped: ${down} of 10`, 24, h2 * 0.5); q.fillText(`Lies heard: ${GUIDE.heard.size}`, 24, h2 * 0.64); q.fillText('Signed: THE CREW, in quotation marks', 24, h2 * 0.82); cert.up(); });
    prop(c, r, g, X, 'vintage_microscope', 18.2, -5.8, { h: 0.5, y: 0.95 }); tbl(18.2, -5.8);
    prop(c, r, g, X, 'chemistry_set', 1.6, 5.2, { len: 0.8, y: 0.95 }); tbl(1.6, 5.2);
    prop(c, r, g, X, 'desk_lamp_arm_01', 14.6, 5.4, { h: 0.7, y: 0.95 }); tbl(14.6, 5.4);
    prop(c, r, g, X, 'security_light', 10, 0, { len: 0.6, y: 5.7 });
    cast(c, r, g, X, 'clerk', 18.2, 4.6, { h: 1.76, ry: -0.8, line: 'Conservation. We take things down to what they were. Then somebody wraps them again. It is a living.', hint: 'The conservator', egg: 'conservator' });
    guards(c, r, g, X, [['usher', 1.0, -6.6, 1.85]], { speed: 0.6 });
    plaque(c, g, 10, 3.4, D / 2 - 0.13, PI, 'THE ORIGINALS ARE "DOWNSTAIRS"', 'THE LAB, 3 AM', 2.4);
  },
};

// ---------- the props per room (Poly Haven CC0, the house models) ----------
const PROPS = {
  gallery: [['hanging_picture_frame_01', 6, -6.3, { h: 1.0, y: 1.9 }], ['hanging_picture_frame_02', 14, -6.3, { h: 1.0, y: 1.9 }], ['hanging_industrial_lamp', 6, 0, { h: 0.8, y: 5.1 }], ['hanging_industrial_lamp', 14, 0, { h: 0.8, y: 5.1 }], ['metal_trash_can', 18.6, 5.4, { h: 0.8, r: 0.4 }]],
  dendur: [['Lantern_01', 2.4, 4.6, { h: 0.7, y: 0.0, r: 0.3 }], ['Lantern_01', 17.6, 4.6, { h: 0.7, r: 0.3 }], ['ceramic_vase_01', 1.4, -1.4, { h: 1.0, r: 0.4 }], ['ceramic_vase_03', 18.6, -1.4, { h: 1.0, r: 0.4 }]],
  court: [['marble_bust_01', 1.4, 3.2, { h: 0.7, y: 1.1 }], ['Chandelier_01', 10, 2, { h: 1.2, y: 5.6 }]],
  armor: [['Chandelier_02', 10, 1, { h: 1.2, y: 4.8 }], ['wooden_crate_01', 1.6, 2.6, { len: 0.9, r: 0.5 }], ['old_military_crate', 18.4, 3.0, { len: 1.0, ry: 0.4, r: 0.5 }]],
  american: [['Chandelier_03', 10, -1, { h: 1.2, y: 4.9 }], ['vintage_oil_lamp', 1.4, -5.4, { h: 0.5, y: 1.1 }], ['painted_wooden_cabinet', 1.2, 0.6, { h: 1.8, ry: PI / 2, r: 0.6 }]],
  shop: [['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 5.85 }], ['plastic_crate_01', 18.4, 4.8, { len: 0.6, r: 0.4 }], ['cardboard_box_01', 1.8, 4.8, { len: 0.8, r: 0.5 }]],
  roof: [['street_lamp_01', 1.2, -5.2, { h: 3.6, r: 0.3 }], ['street_lamp_01', 18.8, -5.2, { h: 3.6, r: 0.3 }], ['modular_street_seating', 10, 5.4, { len: 2.6, r: 1.0 }]],
  lab: [['steel_frame_shelves_03', 1.0, -1.0, { h: 2.0, ry: PI / 2, r: 0.7 }], ['medical_box', 18.6, 1.6, { len: 0.5, y: 0.0 }], ['metal_office_desk', 18.4, 0.0, { len: 1.6, ry: -PI / 2, r: 0.8 }]],
};
const SLOTS = { shop: slotsWestFree, lab: slotsSouthOnly, dendur: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-6.6, -4.2].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; } };

let _ROOMS = null; const ROOMSref = () => _ROOMS;
export function buildRoom(c, r) {
  if (!_ROOMS) { _ROOMS = c.ROOMS; }
  // leaving a room: it may put back what it set (the lab's unwrap mode)
  if (!c._leaveHook) { c._leaveHook = true; let last = -1; c.tick((t, dt, P, ri) => { if (ri !== last) { const prev = _ROOMS[last]; prev && prev.onLeave && prev.onLeave(); last = ri; } }); }
  const dressing = (c2, r2, g, X) => {
    // every room gets its security camera, a fire extinguisher and a bench; the museum is a museum
    const cam = c2.slab(0.26, 0.16, 0.34, std(c2, 0xe8e8e8, { roughness: 0.4 }), W - 0.5, 5.2, -D / 2 + 0.6); cam.rotation.y = 0.8; cam.rotation.x = 0.3; g.add(cam);
    const led = new c2.THREE.Mesh(new c2.THREE.SphereGeometry(0.03, 8, 8), basic(c2, 0xff2020)); led.position.set(W - 0.64, 5.2, -D / 2 + 0.76); g.add(led); c2.tick((t) => { led.visible = Math.sin(t * 3) > 0; });
    if (r2.id !== 'roof') prop(c2, r2, g, X, 'korean_fire_extinguisher_01', 0.4, 6.6, { h: 0.6 });
  };
  shell(c, r, { SLOTS, PROPS, ROOM, dressing });
}
