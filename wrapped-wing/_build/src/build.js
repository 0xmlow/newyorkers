// THE WRAPPED WING, room by room. The night a great New York museum got M.Textured: every antiquity in the building
// wrapped in a painting from the census, and you holding the gun. The statues are MLow's own M.Texture GLBs (Smithsonian
// and Three D Scans objects wrapped in his paintings), the props are Poly Haven (CC0) passed through the NEW YORKERS
// Blender lane, the cast are ON LOCATION's Tripo New Yorkers with eye flowers for heads.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { PI, INK, DZ1, DZ2, DH, Reflector, basic, std, here, local, shell, eyeFlower, decal, glowTex, glow, bulbs, watcher, extra, headTex, plaque, notice, board, label, plinth as plinth0, column, confetti, slotsDefault, slotsSouthOnly, slotsWestFree, lane, stanchions, prop, cast } from './kit.js';
import { alcove, column as fxColumn, coffer } from './fx.js';
export { eyeFlower };

// ---------- the 100x dressing kit, shared by the eight rooms ----------
// surfaces the vault does not ship (wood grain, velvet, tile, a rug, a felt) are drawn on canvas and tinted
const CANV = {};
function canvasMat(c, kind, tint) {
  const key = kind + (tint || ''); if (CANV[key]) return CANV[key];
  const t = c.canvasTex(256, 256, (q, w, h) => {
    if (kind === 'wood') { q.fillStyle = '#7a5230'; q.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { q.strokeStyle = `rgba(${30 + Math.random() * 40 | 0},${14 + Math.random() * 20 | 0},4,${0.2 + Math.random() * 0.35})`; q.lineWidth = 1 + Math.random() * 2.5; q.beginPath(); const y = Math.random() * h; q.moveTo(0, y); q.bezierCurveTo(w * 0.3, y + Math.random() * 10 - 5, w * 0.6, y + Math.random() * 10 - 5, w, y + Math.random() * 6 - 3); q.stroke(); } }
    if (kind === 'velvet') { q.fillStyle = '#5a1020'; q.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { q.fillStyle = `rgba(${120 + Math.random() * 70 | 0},${10 + Math.random() * 24 | 0},${30 + Math.random() * 30 | 0},0.35)`; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
    if (kind === 'tile') { q.fillStyle = '#e4e8e4'; q.fillRect(0, 0, w, h); q.strokeStyle = '#9aa4a0'; q.lineWidth = 3; for (let i = 0; i <= 8; i++) { q.beginPath(); q.moveTo(i * w / 8, 0); q.lineTo(i * w / 8, h); q.stroke(); q.beginPath(); q.moveTo(0, i * h / 8); q.lineTo(w, i * h / 8); q.stroke(); } }
    if (kind === 'felt') { q.fillStyle = '#1e4a34'; q.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { q.fillStyle = `rgba(${20 + Math.random() * 30 | 0},${70 + Math.random() * 40 | 0},${50 + Math.random() * 20 | 0},0.4)`; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
    if (kind === 'steelplate') { q.fillStyle = '#9a9ea4'; q.fillRect(0, 0, w, h); q.fillStyle = '#7a7e84'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { q.beginPath(); q.ellipse(i * 32 + 16 + (j % 2) * 8, j * 32 + 16, 7, 3, 0.8, 0, PI * 2); q.fill(); } }
  });
  t.wrapS = t.wrapT = c.THREE.RepeatWrapping;
  const m = new c.THREE.MeshStandardMaterial({ map: t, roughness: kind === 'velvet' || kind === 'felt' ? 0.95 : kind === 'steelplate' ? 0.45 : 0.7, metalness: kind === 'steelplate' ? 0.5 : 0, color: tint || 0xffffff }); m.userData.rep = 1.5;
  return (CANV[key] = m);
}
// a rug on the floor: a drawn border, a field, an eye flower in the middle
function rug(c, g, x, z, w, d, field = '#7a1e2a', border = '#d6a640') {
  const m = decal(c, w, d, (q, W2, H2) => { q.fillStyle = field; q.fillRect(0, 0, W2, H2); q.strokeStyle = border; q.lineWidth = H2 * 0.03; q.strokeRect(H2 * 0.05, H2 * 0.05, W2 - H2 * 0.1, H2 - H2 * 0.1); q.lineWidth = H2 * 0.01; q.strokeRect(H2 * 0.12, H2 * 0.12, W2 - H2 * 0.24, H2 - H2 * 0.24); q.globalAlpha = 0.55; eyeFlower(q, W2 / 2, H2 / 2, H2 * 0.2); q.globalAlpha = 1; });
  m.rotation.x = -PI / 2; m.position.set(x, 0.012, z); m.renderOrder = 1; g.add(m); return m;
}
// a wall sconce: a brass bracket, a shade that glows, a sprite. ry: the way it faces (PI/2 on the west wall, -PI/2 east, PI south)
function sconce(c, g, x, y, z, ry, col = 'rgba(255,214,160,.9)') {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const brass = std(c, 0xb08a40, { metalness: 0.9, roughness: 0.3 });
  o.add(c.slab(0.18, 0.34, 0.05, brass, 0, 0, 0.025)); o.add(c.slab(0.05, 0.05, 0.22, brass, 0, 0.1, 0.13));
  const sh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xf4ead2, emissive: 0xffc070, emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.6 })); sh.position.set(0, 0.2, 0.24); o.add(sh);
  glow(c, g, x + Math.sin(ry) * 0.24, y + 0.24, z + Math.cos(ry) * 0.24, col, 0.7);
  return o;
}
// a wrapped picture on a wall: a frame and one of the room's own census paintings, not clickable (the hung ones are)
function picture(c, r, g, x, y, z, ry, w, k, gilt = true) {
  const { THREE } = c, p = r.cast[k % r.cast.length]; if (!p) return null;
  const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); const h = w * 0.75;
  o.add(c.slab(w + 0.16, h + 0.16, 0.06, std(c, gilt ? 0xc9a24a : 0x1a1a1a, { metalness: gilt ? 0.8 : 0.3, roughness: 0.35 }), 0, 0, 0.03));
  const t = c.tex.load(`assets/art/${p.f}`); t.colorSpace = THREE.SRGBColorSpace;
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3, roughness: 0.5 })); art.position.z = 0.065; o.add(art);
  return o;
}
// a fluorescent tube that flickers now and then
function tube(c, g, x, y, z, len = 1.2, ry = 0, col = 0xf0f6ff) {
  const on = basic(c, col), off = std(c, 0x8a9098, { roughness: 0.4 }), m = c.slab(len, 0.06, 0.12, on, x, y, z); m.rotation.y = ry; g.add(m);
  const ph = Math.random() * 10; c.tick((t) => { m.material = Math.sin(t * 7 + ph) > 0.97 && Math.sin(t * 0.7 + ph) > 0.6 ? off : on; }); return m;
}
// a raised level you can climb: a platform with a rail on the open sides and one flight of steps; r.ground chains so a
// room may have two. stair: { side: the edge the steps leave from (n, s, e, w), at: the position along it, w: its width }
function deck(c, r, g, X, { x1, x2, z1, z2, y = 1.0, mat, solid = false, rail = ['n', 's', 'e', 'w'], railCol = 0x1a1a1a, stair }) {
  const { THREE } = c, m = mat || c.surf('planks', 2, 0x8a6a48), rm = std(c, railCol, { metalness: 0.7, roughness: 0.4 });
  if (solid) g.add(c.slab(x2 - x1, y, z2 - z1, m, (x1 + x2) / 2, y / 2, (z1 + z2) / 2)); else g.add(c.slab(x2 - x1, 0.16, z2 - z1, m, (x1 + x2) / 2, y - 0.08, (z1 + z2) / 2));
  const S = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[stair.side], sw = stair.w || 1.6, at = stair.at, run = Math.max(1.2, y * 1.5), n = Math.max(3, Math.round(y / 0.18));
  const ex = S[0] < 0 ? x1 : x2, ez = S[1] < 0 ? z1 : z2;
  for (let k = 0; k < n; k++) { const top = y * (n - k) / n, d = run * (k + 0.5) / n; if (S[1]) g.add(c.slab(sw, top, run / n + 0.02, m, at, top / 2, ez + S[1] * d)); else g.add(c.slab(run / n + 0.02, top, sw, m, ex + S[0] * d, top / 2, at)); }
  const prev = r.ground;
  r.ground = (x, z) => { let h = 0;
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) h = y;
    else if (S[1] && Math.abs(x - at) <= sw / 2 + 0.05 && (z - ez) * S[1] >= 0 && (z - ez) * S[1] <= run) h = y * (1 - (z - ez) * S[1] / run);
    else if (S[0] && Math.abs(z - at) <= sw / 2 + 0.05 && (x - ex) * S[0] >= 0 && (x - ex) * S[0] <= run) h = y * (1 - (x - ex) * S[0] / run);
    return Math.max(h, prev ? prev(x, z) : 0); };
  // colliders: the four edges, with a gap where the steps meet the deck, and the two sides of the flight
  const edge = (side, a, b, fixed) => { const gap = side === stair.side; const seg = (p, q) => { if (side === 'n' || side === 's') c.wall(X(p), fixed, X(q), fixed); else c.wall(X(fixed), p, X(fixed), q); };
    if (!gap) seg(a, b); else { seg(a, at - sw / 2 - 0.05); seg(at + sw / 2 + 0.05, b); } };
  edge('n', x1, x2, z1); edge('s', x1, x2, z2); edge('w', z1, z2, x1); edge('e', z1, z2, x2);
  if (S[1]) { for (const s of [-1, 1]) c.wall(X(at + s * (sw / 2 + 0.05)), ez, X(at + s * (sw / 2 + 0.05)), ez + S[1] * run); } else { for (const s of [-1, 1]) c.wall(X(ex), at + s * (sw / 2 + 0.05), X(ex + S[0] * run), at + s * (sw / 2 + 0.05)); }
  // the rail: posts a metre apart and a top bar, on the sides asked for, never across the steps
  for (const side of rail) { const horiz = side === 'n' || side === 's', fixed = horiz ? (side === 'n' ? z1 + 0.08 : z2 - 0.08) : (side === 'w' ? x1 + 0.08 : x2 - 0.08), a = horiz ? x1 : z1, b = horiz ? x2 : z2;
    const runs = side === stair.side ? [[a, at - sw / 2], [at + sw / 2, b]] : [[a, b]];
    for (const [p, q] of runs) { if (q - p < 0.3) continue; const L = q - p, np = Math.max(2, Math.round(L)); for (let i = 0; i <= np; i++) { const u = p + L * i / np; g.add(c.slab(0.05, 1.0, 0.05, rm, horiz ? u : fixed, y + 0.5, horiz ? fixed : u)); } g.add(c.slab(horiz ? L : 0.06, 0.06, horiz ? 0.06 : L, rm, horiz ? (p + q) / 2 : fixed, y + 1.0, horiz ? fixed : (p + q) / 2)); } }
  return { y, run };
}
// a plinth in marble, with a collider (the kit's is a flat colour; the brief wants every surface textured)
function plinth(c, g, X, x, z, w = 1.2, h = 0.9, d = w, col = 0xe8e4dc) {
  const m = c.slab(w, h, d, c.surf('marble', 1, col), x, h / 2, z); g.add(m); c.post(X(x), z, Math.max(w, d) * 0.62); return m;
}
// a display case: a plinth with a glass box on it, the thing inside wrappable
function vitrine(c, g, X, x, z, w = 0.8, h = 0.9, gh = 0.6, col = 0xe8e4dc) {
  const { THREE } = c; plinth(c, g, X, x, z, w, h, w, col);
  const gl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, gh, w - 0.04), new THREE.MeshPhysicalMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0, transmission: 0.2, depthWrite: false })); gl.position.set(x, h + gh / 2, z); gl.renderOrder = 2; g.add(gl);
  const fr = std(c, 0x2a2a2e, { metalness: 0.8, roughness: 0.3 }); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(c.slab(0.03, gh, 0.03, fr, x + a * (w / 2 - 0.03), h + gh / 2, z + b * (w / 2 - 0.03)));
  g.add(c.slab(w, 0.03, w, fr, x, h + gh + 0.015, z)); return gl;
}

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
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P); const d = Math.hypot(L.x - sx, L.z - sz); if (d < 0.55 && !hit) { hit = true; c.sound.ding(); c.egg('court_lineup', `From the gold star the pieces line up: "${piece.t}" (No. ${piece.n}), hung across every god in the court. Step off it and the painting comes apart again.`); } if (d > 1.5) hit = false; });
  return tiles;
}

// ---------- the audio guide that lies ----------
const GUIDE = { on: false, heard: new Set() };
function speak(text) { try { if (!('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }
function guided(c, r, m, name, lie, h = 1.6) {
  c.clickable(m, () => {
    if (!GUIDE.on) { c.say(m, name, 2400, h); return; }
    c.say(m, `"${lie}"`, 5200, h); speak(lie); GUIDE.heard.add(name);
    if (GUIDE.heard.size === 1) c.egg('armor_guide', 'The audio guide has started. It is very confident.');
    if (GUIDE.heard.size === 6) c.egg('armor_docent', 'Six objects, six lies, one guide. The museum licensed this voice from a man who has never been inside.');
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
    const w = cast(c, r, g, X, 'writer', 17.2, 4.4, { h: 1.76, ry: -0.7, line: 'The plan is simple. Everything gets wrapped. Then we open a museum about the night everything got wrapped.', hint: 'The writer', egg: 'gallery_plan' });
    wrappable(c, r, w, { name: 'The writer' });
    const sg = guards(c, r, g, X, [['usher', 1.2, -6.4, 1.85], ['agent', 18.6, -6.2, 1.85]]);
    sg.forEach((q) => wrappable(c, r, q.m, { name: 'A guard' }));
    // the bust by the door and the bird on a plinth, already wrapped by the crew on the way in
    plinth(c, g, X, 3.2, -5.4, 0.9, 1.1); const jack = c.glb('si_npg_andrew-jackson', { h: 0.9, x: 3.2, y: 1.1, z: -5.4, ry: 0.4, parent: g }); wrappable(c, r, jack, { name: 'A president in a bust' }); label(c, g, 3.2, 0.7, -4.9, 0, ['ANDREW JACKSON, BUST', 'wrapped in a painting, 2026', '"THE FIRST ONE WE DID"']);
    plinth(c, g, X, 16.8, -5.4, 0.9, 1.1); const bird = c.glb('tds_bird', { h: 0.8, x: 16.8, y: 1.1, z: -5.4, ry: -0.5, parent: g }); wrappable(c, r, bird, { name: 'A bird in stone' }); label(c, g, 16.8, 0.7, -4.9, 0, ['BIRD, MARBLE', 'a pigeon, formally', '"IT FLEW IN"']);
    // the hero: the frame the crew carried in through the gift shop, ten feet of gilt, framing the plate from the door
    const hero = prop(c, r, g, X, 'nyb_crown_frame', 10, -4.6, { h: 3.3, r: 1.0, egg: ['The big frame', 'gallery_frame', 'Four people carried this frame in through the gift shop and told the guard it was a mirror. The guard looked into it. The guard saw the whole gallery. The guard said fine.'] });
    wrappable(c, r, hero, { name: 'The big frame' }); label(c, g, 10, 0.7, -3.9, 0, ['FRAME, GILT, EMPTY', 'brought in tonight, through the shop', '"IT WAS A MIRROR"']);
    glow(c, g, 10, 3.2, -4.3, 'rgba(255,220,160,.5)', 2.6);
    // the Degas on a lobby easel, the vase in a case, the bust on its plinth: the crew went through the storeroom too
    prop(c, r, g, X, 'nyb_lobby_easel', 6.8, -4.4, { h: 1.9, ry: 0.5, r: 0.5 }); const deg = prop(c, r, g, X, 'nyb_crown_degas', 6.8, -4.4, { h: 1.0, y: 0.9, ry: 0.5, hint: 'A dancer', fn: (cc, m) => cc.say(m, 'A dancer, in pastel, in a frame, on an easel, in a museum, in a painting. Five wrappings deep. The dancer has not noticed.', 3200, 1.4) }); wrappable(c, r, deg, { name: 'The dancer on the easel' });
    vitrine(c, g, X, 3.4, 0.4, 0.8, 0.9, 0.7); const vase = prop(c, r, g, X, 'nyb_crown_vase', 3.4, 0.4, { h: 0.5, y: 0.92, hint: 'A vase', fn: (cc, m) => cc.say(m, 'The vase. Ming, allegedly. The case is not locked. The case has never been locked. Nobody has ever checked.', 3000, 1.0) }); wrappable(c, r, vase, { name: 'The vase in the case' });
    plinth(c, g, X, 16.6, 0.4, 0.9, 1.1); const cb = prop(c, r, g, X, 'nyb_crown_bust', 16.6, 0.4, { h: 0.8, y: 1.1, ry: -0.5 }); wrappable(c, r, cb, { name: 'A bust of a collector' }); label(c, g, 16.6, 0.7, 0.9, 0, ['A COLLECTOR, BUST', 'bought the museum, briefly, 1999', '"NOT FOR SALE"']);
    prop(c, r, g, X, 'nyb_crown_case', 17.6, -2.6, { h: 1.0, ry: -0.3, r: 0.6, hint: 'A case', fn: (cc, m) => cc.say(m, 'Empty. It held the thing before the thing was wrapped. Now it holds the idea.', 2800, 1.4) });
    // benches down the middle, the visitors who never left, the WET FLOOR sign that means wet paint
    prop(c, r, g, X, 'nyb_bench_plaque', 10, -0.6, { len: 2.2, r: 1.0 }); prop(c, r, g, X, 'nyb_crown_bench', 6.0, 1.2, { len: 1.8, r: 0.9 }); prop(c, r, g, X, 'nyb_crown_bench', 14.0, 1.2, { len: 1.8, r: 0.9 });
    extra(c, g, 2.4, -4.2, { ry: -PI / 2, pool: 'dressy' }); extra(c, g, 17.6, -1.8, { ry: PI / 2, pool: 'dressy' }); extra(c, g, 8.2, 6.6, { ry: PI, pool: 'night' }); extra(c, g, 13.4, 6.7, { ry: PI, pool: 'dressy' }); extra(c, g, 12.4, -3.4, { ry: 0.4, pool: 'suits' });
    prop(c, r, g, X, 'WetFloorSign_01', 7.6, 1.4, { h: 0.9, ry: 0.6, r: 0.3, egg: ['A sign', 'gallery_wetpaint', 'CAUTION WET FLOOR. The floor is fine. The sign is wrapped. It was wet paint. It is always wet paint.'] });
    prop(c, r, g, X, 'spray_paint_bottles_02', 13.2, 4.8, { len: 0.7, egg: ['The cans', 'gallery_cans', 'Nobody uses cans anymore. The gun wraps. The cans are for the signature.'] }); prop(c, r, g, X, 'nyb_milkcrate_pink', 13.9, 5.3, { len: 0.5, ry: 0.4 });
    prop(c, r, g, X, 'vintage_suitcase', 15.4, 5.2, { len: 1.1, ry: 0.5, r: 0.5, egg: ['The bag', 'gallery_bag', 'Inside the bag: 7,542 paintings, a MetroCard with eleven cents on it, a pastrami sandwich, and a map of the museum drawn on a napkin by a man who had never been.'] });
    // the coffered ceiling, the chandeliers, the sconces between the paintings: a paintings gallery is lit from above
    coffer(c, r, g, { nx: 5, nz: 4, y: H_IN, mat: c.surf('planks', 2, 0x3a2a1a), bulb: 0xffe0b0 });
    for (const [x, z] of [[6, -2], [14, -2], [10, 3]]) prop(c, r, g, X, 'nyb_lobby_chandelier', x, z, { h: 1.3, y: 4.3 });
    for (let i = 0; i < 6; i++) sconce(c, g, 3.5 + i * 2.6, 3.3, D / 2 - 0.16, PI);
    for (const z of [-5.4, -3.0]) { sconce(c, g, 0.16, 3.3, z, PI / 2); sconce(c, g, W - 0.4, 3.3, z, -PI / 2); }
    picture(c, r, g, 2.0, 3.6, -D / 2 + 0.14, 0, 1.2, 4); picture(c, r, g, 18.0, 2.4, -D / 2 + 0.14, 0, 1.4, 5);
    prop(c, r, g, X, 'nyb_angrymen_clock', 0.2, 3.8, { h: 0.5, y: 4.6, ry: PI / 2 }); prop(c, r, g, X, 'nyb_annie_frame', 19.6, 6.8, { h: 1.2, y: 1.6, ry: -PI / 2 });
    // the nook: an alcove on the east wall hung with the frames the crew wrapped first, a velvet floor, an ottoman
    alcove(c, r, g, X, { side: 'e', at: -6.3, w: 2.2, d: 1.7, h: 3.0, mat: c.surf('plaster', 2.4, 0xd8c8b0), floorMat: canvasMat(c, 'velvet') });
    picture(c, r, g, 19.5, 1.75, -6.3, -PI / 2, 1.0, 6); picture(c, r, g, 19.5, 2.6, -7.0, -PI / 2, 0.5, 7); picture(c, r, g, 19.5, 2.6, -5.6, -PI / 2, 0.5, 8);
    prop(c, r, g, X, 'nyb_lobby_ottoman', 18.7, -6.3, { len: 0.7, r: 0.4 }); notice(c, g, '"THE FIRST THREE" · WRAPPED 11:58 PM', 19.5, 3.35, -6.3, -PI / 2, 1.9, 0.26, '#0d0d0d', '#f5c542');
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
    // the platform is a level you climb: three steps up on its west side, by the sphinx, colliders round the rest (deck, above)
    deck(c, r, g, X, { x1: px - 5, x2: px + 5, z1: pz - 3.5, z2: pz + 3.5, y: 0.5, mat: sand, solid: true, rail: [], stair: { side: 'w', at: -2.8, w: 2.6 } });
    notice(c, g, '"THE TEMPLE" · STEPS THIS SIDE · MIND THE SPHINX', 4.3, 1.4, -2.8, -PI / 2, 1.8, 0.24, '#0d0d0d', '#f5c542');
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
    const s1 = sph('tds_sphinx-1', 3.9, -0.6, 0.5, 'The west sphinx'), s2 = sph('tds_sphinx-3', 16.1, -0.6, -0.5, 'The east sphinx');
    [s1, s2].forEach((m) => c.clickable(m, () => { const Q = ['What has four legs in the morning, two at noon, and a MetroCard with eleven cents on it at night? A New Yorker.', 'What is wrapped on the outside and stone on the inside and remembers Nubia? Me. The answer is always me.', 'Why does the pool show me plain? The pool was here before tonight. The pool is old. The pool is not impressed.']; c.say(m, Q[(m.userData.q = (m.userData.q || 0) + 1) % Q.length], 4200, 1.8); if (m.userData.q === 3) c.egg('dendur_riddle', 'Three riddles. The sphinx does not eat the wrong answers anymore. Union rules.'); }, 'A sphinx'));
    label(c, g, 3.9, 0.5, 0.9, 0, ['SPHINX, WEST', 'wrapped, 11:58 pm tonight', '"ASK IT"']); label(c, g, 16.1, 0.5, 0.9, 0, ['SPHINX, EAST', 'wrapped, 11:59 pm tonight', '"IT ANSWERS"']);
    // the egg: stand at the water and see them plain
    let seen = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || seen) return; const L = local(r, P); if (L.z > 5.9 && L.z < 7.4 && L.x > 4 && L.x < 16 && c.P.pitch < -0.35) { seen = true; c.egg('dendur_reflection', 'In the pool the sphinxes are plain stone. The water remembers them from before tonight. Water is like that.'); } });
    // the temple's own wrapped relic: the bas relief inside the gate, and the Nile light
    const rel = c.glb('tds_relief-with-bulls-legs', { len: 2.2, x: 10, y: 0.5, z: -2.6, ry: PI, rx: 0, parent: g }); wrappable(c, r, rel, { name: 'The relief' }); c.post(X(10), -2.6, 0.9);
    guards(c, r, g, X, [['usher', 1.6, -6.8, 1.85]], { speed: 0.8 });
    for (const x of [2.2, 17.8]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), basic(c, 0xbfd8ff)); l.position.set(x, 4.8, -5.0); g.add(l); }
    // the hero: the whale from the other museum, over the pool. It got lost on the crosstown bus
    const wh = prop(c, r, g, X, 'nyb_natm_whale', 10, 3.6, { len: 8.5, y: 3.9, ry: 0, bob: 0.5, egg: ['The whale', 'dendur_whale', 'The whale. Not Egyptian. On loan from the other museum, across the park, which has not noticed. It hangs here because the ceiling in the other place is spoken for.'] }); wrappable(c, r, wh, { name: 'The whale' });
    glow(c, g, 10, 2.6, 3.6, 'rgba(160,200,255,.45)', 4);
    // the hall of the uncounted: the elephant, the bull, the president on the horse, two busts in cases, the pylon reliefs
    const el = prop(c, r, g, X, 'nyb_natm_elephant', 2.0, -2.0, { h: 2.3, ry: PI / 2, r: 1.1, hint: 'The elephant', fn: (cc, m) => cc.say(m, 'I remember everything. I remember the gift shop. I remember when this was a parking lot. It was never a parking lot. I remember it anyway.', 3400, 2.5) }); wrappable(c, r, el, { name: 'The elephant' });
    const bu = prop(c, r, g, X, 'nyb_natm_bull', 17.6, -2.4, { h: 1.6, ry: -PI / 2, r: 1.0, hint: 'The bull', fn: (cc, m) => cc.say(m, 'I am from downtown. I was transferred. Nobody told me why. Tourists still touch me here, so it is the same job.', 3000, 1.9) }); wrappable(c, r, bu, { name: 'The bull' });
    const td = prop(c, r, g, X, 'nyb_natm_teddy', 18.3, 0.5, { h: 1.9, ry: -PI / 2, r: 0.7, egg: ['A rider', 'dendur_teddy', 'The president on the horse. Wax. He has been about to say something since 1909. The horse has heard it already.'] }); wrappable(c, r, td, { name: 'The rider in wax' });
    for (const x of [7.0, 13.0]) { vitrine(c, g, X, x, 0.7, 0.7, 0.9, 0.7, 0xc8b8a0); const b = prop(c, r, g, X, 'nyb_natm_bust', x, 0.7, { h: 0.55, y: 0.92, ry: x < 10 ? 0.5 : -0.5 }); wrappable(c, r, b, { name: 'A bust in a case' }); }
    for (const x of [6, 14]) { const d = decal(c, 1.2, 3.4, (q, w, h) => { q.fillStyle = 'rgba(60,40,20,.55)'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 6; q.strokeRect(10, 10, w - 20, h - 20); for (let k = 0; k < 4; k++) { eyeFlower(q, w / 2, h * (0.14 + k * 0.24), w * 0.16); } }); d.position.set(x, 2.8, -0.38); g.add(d); }
    // the walkways: lanterns, lotus pots, planters as a hedge, benches by the water, the visitors who stayed for the pool
    for (const [x, z] of [[4.2, 7.6], [11.4, 7.6]]) { prop(c, r, g, X, 'planter_box_01', x, z, { len: 1.6, r: 0.5 }); prop(c, r, g, X, 'potted_plant_02', x, z, { h: 1.3, y: 0.4 }); }
    prop(c, r, g, X, 'potted_plant_01', 2.6, 7.6, { h: 1.1, r: 0.3 }); prop(c, r, g, X, 'potted_plant_04', 17.4, 7.6, { h: 1.1, r: 0.3 }); prop(c, r, g, X, 'nyb_pigeons_planter', 15.8, 7.5, { len: 1.6, r: 0.6 });
    prop(c, r, g, X, 'nyb_bench_plaque', 6.8, 7.5, { len: 2.0, r: 0.6 }); prop(c, r, g, X, 'nyb_bench_plaque', 13.2, 7.5, { len: 2.0, r: 0.6 });
    prop(c, r, g, X, 'nyb_natm_flashlight', 6.0, 6.0, { len: 0.4, y: 0.18, ry: 0.6 }); prop(c, r, g, X, 'nyb_natm_wet', 2.8, 4.6, { h: 0.85, ry: 0.4, r: 0.3, hint: 'A sign', fn: (cc, m) => cc.say(m, 'CAUTION, WET FLOOR. It is a pool. The sign is doing its best.', 2400, 1.1) });
    extra(c, g, 2.2, 0.8, { ry: 0, pool: 'night' }); extra(c, g, 17.4, 3.6, { ry: -PI / 2, pool: 'dressy' }); extra(c, g, 12.4, 7.4, { ry: 0, pool: 'walkers' }); extra(c, g, 4.6, 7.4, { ry: 0.3, pool: 'suits' });
    fxColumn(c, r, g, X, 3.9, -5.6, { h: H_IN, rad: 0.36, mat: sand }); fxColumn(c, r, g, X, 16.1, -5.6, { h: H_IN, rad: 0.36, mat: sand });
    bulbs(c, g, 3.6, 16.4, 5.5, 6.2, 14, 0xbfd8ff);
    // the nook: a gift shop sarcophagus in an alcove by the door, in case you want to take the feeling home
    alcove(c, r, g, X, { side: 'w', at: 6.8, w: 1.8, d: 1.7, h: 3.0, mat: sand, floorMat: c.surf('marble', 1, 0x9a9080), light: 0xffd080 });
    const sg = new THREE.Group(); g.add(sg); sg.add(c.slab(0.7, 0.6, 1.6, sand, 1.0, 0.3, 6.8)); const lid = decal(c, 0.66, 1.56, (q, w, h) => { q.fillStyle = '#d6a640'; q.fillRect(0, 0, w, h); q.fillStyle = '#1b3a6a'; q.fillRect(w * 0.1, h * 0.06, w * 0.8, h * 0.88); eyeFlower(q, w / 2, h * 0.22, w * 0.26); q.fillStyle = '#d6a640'; for (let k = 0; k < 5; k++) q.fillRect(w * 0.2, h * (0.46 + k * 0.09), w * 0.6, h * 0.03); }); lid.rotation.x = -PI / 2; lid.position.set(1.0, 0.61, 6.8); sg.add(lid); sg.userData.ready = true; wrappable(c, r, sg, { name: 'The gift shop sarcophagus' }); c.post(X(1.0), 6.8, 0.8);
    c.clickable(sg, () => c.egg('dendur_sarcophagus', 'Gift shop sarcophagus. $1,200. Fits most. The lid is a painting, the inside is a painting, you would be a painting. That is the pitch.'), 'A sarcophagus');
    notice(c, g, '"SARCOPHAGUS" · $1,200 · FITS MOST', 1.6, 2.4, 6.8, PI / 2, 1.6, 0.26, '#0d0d0d', '#f5c542');
    plaque(c, g, 10, 3.0, D / 2 - 0.13, PI, 'A GIFT FROM EGYPT, 1965', 'THE POOL, UNWRAPPED', 2.4);
  },

  // THE COURT. Every god wrapped, and one spot on the floor where a painting assembles across all of them.
  court(c, r, g, X) {
    const { THREE } = c;
    // the colonnade: eight marble columns, a palm at the foot of the corner ones, banners between
    const marble = c.surf('marble', 1, 0xd8d0c8);
    for (const x of [2.2, 6.4, 13.6, 17.8]) for (const z of [-6.0, 0.4]) fxColumn(c, r, g, X, x, z, { h: r.tall || 7, rad: 0.34, mat: marble });
    for (const [x, z] of [[3.3, -5.0], [16.7, -5.0], [1.2, 0.6], [18.8, 0.6]]) prop(c, r, g, X, 'nyb_lobby_palm', x, z, { h: 2.2, r: 0.5, egg: ['A palm', 'court_palm', 'The palms are plastic. The gods are marble. The marble is wrapped in paintings. The plastic is the only honest thing in the court.'] });
    for (const [x, z] of [[4.3, -6.0], [15.7, -6.0], [4.3, 0.4], [15.7, 0.4]]) { const b = decal(c, 1.0, 2.2, (q, w, h) => { q.fillStyle = '#8a1a1a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.fillRect(0, h - 14, w, 14); eyeFlower(q, w / 2, h * 0.36, w * 0.3); q.fillStyle = '#f4ead2'; q.font = `900 ${w * 0.13}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE GODS', w / 2, h * 0.76); q.fillText('ARE FINE', w / 2, h * 0.9); }); b.material.side = THREE.DoubleSide; b.position.set(x, 5.0, z); g.add(b); c.tick((t) => { b.rotation.y = Math.sin(t * 0.6 + x) * 0.08; }); }
    const wc1 = c.glb('tds_coloumn-02', { h: 2.4, x: 2.4, z: -2.8, parent: g }); wrappable(c, r, wc1, { name: 'A capital' }); c.post(X(2.4), -2.8, 0.7);
    const wc2 = c.glb('tds_column-07', { h: 2.4, x: 17.6, z: -2.8, parent: g }); wrappable(c, r, wc2, { name: 'A capital' }); c.post(X(17.6), -2.8, 0.7);
    const gods = [['tds_hermes-fastening-his-sandals', 5.0, -4.2, 'Hermes, tying a sandal', 1.9, 0], ['tds_efebo', 8.2, -5.0, 'An ephebe', 1.8, 0], ['tds_sleeping-hermaphroditus', 11.8, -5.0, 'Sleeping Hermaphroditus', 0.8, 0, 2.2], ['tds_actaeon', 15.0, -4.2, 'Actaeon', 1.7, PI], ['tds_triton', 10, -1.6, 'A triton', 1.5, PI], ['tds_la-nymphe-salmacis', 4.2, 1.6, 'The nymph Salmacis', 1.6, 0], ['tds_leroux', 15.8, 1.6, 'A gentleman in a coat', 1.6, PI / 2], ['tds_statue-of-resting-goat', 7.2, 3.6, 'A resting goat', 0.9, 0, 1.4], ['tds_gruppe-mit-zwei-windhunden', 12.8, 3.6, 'Two greyhounds', 1.0, 0, 1.4], ['tds_enfant-au-chien-restored', 10, 1.2, 'A child and a dog', 1.1, 0]];
    gods.forEach(([name, x, z, nm, h, rx, len]) => { const ph = plinth(c, g, X, x, z, len ? len + 0.4 : 1.1, 0.7, len ? 1.2 : 1.1); const m = c.glb(name, len ? { len, x, y: 0.7, z, rx, parent: g, ry: Math.random() * 0.6 - 0.3 } : { h, x, y: 0.7, z, rx, parent: g, ry: Math.random() * 0.6 - 0.3 }); wrappable(c, r, m, { name: nm }); c.clickable(m, () => c.say(m, nm + '. Wrapped at ' + (12 + ((x * 7) | 0) % 50) + ' past midnight.', 2600, h + 1.0), nm); });
    plinth(c, g, X, 17.4, 5.0, 0.8, 1.2); const ein = c.glb('tds_einstein', { h: 0.7, x: 17.4, y: 1.2, z: 5.0, ry: -0.6, parent: g }); wrappable(c, r, ein, { name: 'Einstein, the bust' }); label(c, g, 17.4, 0.8, 5.5, 0, ['EINSTEIN, BUST', 'Princeton, by way of 112th St', '"RELATIVELY WRAPPED"']);
    plinth(c, g, X, 2.6, 5.0, 1.6, 0.6, 1.0); const rh = c.glb('tds_rhino', { len: 1.8, x: 2.6, y: 0.6, z: 5.0, ry: 0.8, parent: g }); wrappable(c, r, rh, { name: 'The rhinoceros' }); label(c, g, 2.6, 0.5, 5.6, 0, ['RHINOCEROS', 'not Greek, not Roman, here anyway', '"LOST, THEN WRAPPED"']);
    // the painting that only comes together from the star
    const star = [10, 3.6]; anamorph(c, r, g, X, r.cast[3] || r.cast[0], star, { n: 6, dir: [0, -1], span: 3.0 });
    // the lions from the library, on loan, flanking the star; the busts; the sconces; a chandelier under the skylight
    const li1 = prop(c, r, g, X, 'nyb_devils_lion', 6.0, 5.4, { h: 1.3, ry: 0.4, r: 0.8, egg: ['A lion', 'court_lion', 'The lions. Patience and Fortitude, on loan from the library. Tonight they are Wrapped and Also Wrapped. They have not read a book either.'] }); wrappable(c, r, li1, { name: 'The west lion' });
    const li2 = prop(c, r, g, X, 'nyb_nys_lion', 14.8, 4.9, { h: 1.3, ry: -0.4, r: 0.8, hint: 'A lion', fn: (cc, m) => cc.say(m, 'Fortitude. I am the one on the right. We are both on the right, from where we sit.', 2800, 1.6) }); wrappable(c, r, li2, { name: 'The east lion' });
    plinth(c, g, X, 4.4, 6.6, 0.8, 1.1); const cb = prop(c, r, g, X, 'nyb_crown_bust', 4.4, 6.6, { h: 0.75, y: 1.1, ry: 0.3 }); wrappable(c, r, cb, { name: 'A bust by the stair' }); label(c, g, 4.4, 0.7, 7.1, 0, ['A DONOR, BUST', 'gave the court, kept the receipt', '"THANK YOU"']);
    for (const z of [-5.4, -3.0, 1.2]) { prop(c, r, g, X, 'nyb_annie_sconce', 0.2, z, { h: 0.5, y: 3.4, ry: PI / 2 }); prop(c, r, g, X, 'nyb_annie_sconce', W - 0.45, z, { h: 0.5, y: 3.4, ry: -PI / 2 }); }
    prop(c, r, g, X, 'nyb_th_chandelier', 10, -4.0, { h: 1.4, y: 5.3 });
    prop(c, r, g, X, 'nyb_crown_bench', 2.4, 7.1, { len: 1.8, r: 0.9 }); prop(c, r, g, X, 'nyb_crown_bench', 6.4, 7.2, { len: 1.8, r: 0.9 });
    extra(c, g, 1.4, -0.8, { ry: PI / 2, pool: 'dressy' }); extra(c, g, 6.8, 4.2, { ry: 0.5, pool: 'suits' }); extra(c, g, 16.6, -1.0, { ry: -2.2, pool: 'night' });
    // the nook: a balcony along the east half of the south wall, a stair up from the star's side, the visitors looking down
    deck(c, r, g, X, { x1: 12.5, x2: W, z1: 5.7, z2: D / 2, y: 2.8, mat: c.surf('ashlar', 1.6, 0xd0c8b8), solid: true, rail: ['n', 'w'], railCol: 0x8a6a2a, stair: { side: 'w', at: 7.0, w: 1.4 } });
    for (const [x, z, nm] of [[14.6, 6.3, 'dressy'], [17.0, 6.2, 'suits'], [19.0, 6.5, 'night']]) { const e = extra(c, g, x, z, { ry: 0, pool: nm }); e.position.y = 2.8; }
    g.add(c.slab(0.7, 0.9, 0.7, marble, 15.6, 2.8 + 0.45, 7.3)); const tb = prop(c, r, g, X, 'nyb_th_bust', 15.6, 7.3, { h: 0.7, y: 2.8 + 0.9, ry: 0.2 }); wrappable(c, r, tb, { name: 'A bust on the balcony' });
    g.add(c.slab(0.7, 0.9, 0.7, marble, 18.6, 2.8 + 0.45, 7.3)); const zb = prop(c, r, g, X, 'nyb_zoo_bust', 18.6, 7.3, { h: 0.7, y: 2.8 + 0.9, ry: -0.2 }); wrappable(c, r, zb, { name: 'Another bust on the balcony' });
    notice(c, g, '"THE BALCONY" · MIND THE GODS', 16.0, 4.05, D / 2 - 0.13, PI, 2.2, 0.28, '#0d0d0d', '#f5c542');
    let up = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || up) return; const L = local(r, P); if (L.x > 12.6 && L.z > 5.8) { up = true; c.egg('court_balcony', 'From up here every god is a painting and every visitor is a dot. The curator calls this the view. The curator has never come down.'); } });
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
    // the heroes: two more horses in the parade, armoured in paintings, each with a New Yorker up for a rider
    const horses = [['nyb_apes_horse', 5.6, -1.4, 0.35, 'The west horse', 'This horse came off a carousel in Brooklyn. It still goes up and down. You have to be patient.', -1.5], ['nyb_godfather_horse', 14.4, -1.4, -0.35, 'The horse head', 'The head of the east horse. Found in a bed on Long Island. The rest of the horse is in a better place, which is Queens.', 1.5]];
    horses.forEach(([nm, x, z, ry, name, lie, dx]) => { plinth(c, g, X, x, z, 2.0, 0.4, 1.3); const h = prop(c, r, g, X, nm, x, z, { h: dx < 0 ? 2.1 : 1.3, y: 0.4, ry, r: 1.1 }); wrappable(c, r, h, { name }); guided(c, r, h, name, lie, 2.6); extra(c, g, x + dx, z + 0.6, { ry: dx < 0 ? PI / 2 : -PI / 2, pool: 'night' }); });
    c.clickable(gs[0].m, () => c.egg('armor_rider', 'The grooms holding the horses are ushers from the night shift. The horses do not know. The horses have never known.'), 'A guard');
    // the walls: racks of the hall's own weapons, shields with the flower, sconces, the clock over the plate
    const rack = (x, z, ry, tools) => { const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); o.add(c.slab(2.0, 1.6, 0.06, canvasMat(c, 'wood', 0x8a6a48), 0, 1.5, 0.03)); for (const y of [0.9, 2.1]) o.add(c.slab(2.0, 0.08, 0.14, std(c, 0x3a2a1a, { roughness: 0.6 }), 0, y, 0.09));
      tools.forEach((tn, k) => { const m = c.glb(tn, { len: 1.1, y: 0.95, rx: PI / 2, parent: o }); m.position.x = -0.7 + k * 0.47; m.position.z = 0.16; m.rotation.y = PI / 2; wrappable(c, r, m, { name: 'A weapon off the rack' }); }); };
    rack(0.2, 0.6, PI / 2, ['ph_hatchet', 'ph_crowbar_01', 'ph_sledgehammer_01', 'ph_rusted_spade_01']); rack(W - 0.45, 0.6, -PI / 2, ['ph_sledgehammer_01', 'ph_hatchet', 'ph_wooden_broom', 'ph_crowbar_01']); rack(18.0, -D / 2 + 0.14, 0, ['ph_rusted_spade_01', 'ph_crowbar_01', 'ph_hatchet', 'ph_sledgehammer_01']);
    const shield = (x, y, z, ry, col) => { const d = decal(c, 0.9, 1.1, (q, w, h) => { q.fillStyle = col; q.beginPath(); q.moveTo(8, 8); q.lineTo(w - 8, 8); q.lineTo(w - 8, h * 0.55); q.quadraticCurveTo(w / 2, h + 10, 8, h * 0.55); q.closePath(); q.fill(); q.strokeStyle = '#f5c542'; q.lineWidth = 8; q.stroke(); q.fillStyle = '#f5c542'; q.fillRect(w * 0.44, 8, w * 0.12, h * 0.8); q.fillRect(8, h * 0.3, w - 16, h * 0.1); eyeFlower(q, w / 2, h * 0.36, w * 0.17); }); d.position.set(x, y, z); d.rotation.y = ry; g.add(d); };
    [3.5, 6.1, 13.9, 16.5].forEach((x, k) => shield(x, 4.6, D / 2 - 0.14, PI, ['#8a1a1a', '#1b3a6a', '#1b3a6a', '#8a1a1a'][k]));
    [-5.4, -3.0, 2.4].forEach((z, k) => { shield(0.16, 4.6, z, PI / 2, ['#1b3a6a', '#8a1a1a', '#2a6a3a'][k]); shield(W - 0.4, 4.6, z, -PI / 2, ['#8a1a1a', '#2a6a3a', '#1b3a6a'][k]); });
    for (const z of [-5.4, -3.0]) { prop(c, r, g, X, 'nyb_bramford_sconce', 0.2, z, { h: 0.5, y: 3.3, ry: PI / 2 }); prop(c, r, g, X, 'nyb_bramford_sconce', W - 0.45, z, { h: 0.5, y: 3.3, ry: -PI / 2 }); }
    prop(c, r, g, X, 'nyb_scent_clock', 10, -D / 2 + 0.2, { h: 0.7, y: 5.0 });
    prop(c, r, g, X, 'nyb_big_soldier', 18.6, -3.0, { h: 2.0, r: 0.5, hint: 'A gnome', fn: (cc, m) => cc.say(m, 'Garden gnome. Full size. The museum bought me by the inch and ran out of garden.', 2400, 2.2) }); prop(c, r, g, X, 'nyb_big_soldier', 1.4, -3.0, { h: 2.0, ry: PI, r: 0.5 });
    // overhead: the ballroom chandeliers, the banners of the guilds
    prop(c, r, g, X, 'nyb_annie_chandelier', 5, -3, { h: 1.3, y: 4.5 }); prop(c, r, g, X, 'nyb_annie_chandelier', 15, -3, { h: 1.3, y: 4.5 });
    [4, 8, 12, 16].forEach((x, k) => { const b = decal(c, 0.9, 2.0, (q, w, h) => { q.fillStyle = ['#8a1a1a', '#1b3a6a', '#2a6a3a', '#f5c542'][k]; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.fillRect(0, h - 12, w, 12); eyeFlower(q, w / 2, h * 0.3, w * 0.28); q.fillStyle = '#f4ead2'; q.font = `900 ${w * 0.16}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText(['GUILD', 'OF THE', 'SUPER', 'INTENDENTS'][k], w / 2, h * 0.72); }); b.material.side = THREE.DoubleSide; b.position.set(x, 4.6, 4.6); g.add(b); c.tick((t) => { b.rotation.y = Math.sin(t * 0.5 + k) * 0.1; }); });
    // the nook: two niches in the south wall, each with one thing lying in it, under its own light
    alcove(c, r, g, X, { side: 's', at: 7.4, w: 2.4, d: 1.6, h: 2.6, mat: c.surf('plaster', 2.4, 0xd8c0a0), floorMat: canvasMat(c, 'velvet'), light: 0xffc080 });
    const blk = prop(c, r, g, X, 'nyb_gangs_block', 7.4, 7.2, { h: 0.8, r: 0.6 }); wrappable(c, r, blk, { name: 'The block' });
    const kn = prop(c, r, g, X, 'nyb_dundee_knife', 7.4, 7.2, { len: 0.7, y: 0.8, ry: 0.5, egg: ['A knife', 'armor_knife', 'That is not a knife. That is a letter opener from a hotel on Lexington. The audio guide disagrees. The audio guide is on commission.'] }); wrappable(c, r, kn, { name: 'The knife' }); guided(c, r, kn, 'The knife', 'The great knife of a steakhouse in Astoria, used once, on a steak, in 1986. The steak lost.', 1.4);
    prop(c, r, g, X, 'nyb_scent_candle', 6.5, 7.6, { h: 0.3 }); prop(c, r, g, X, 'nyb_scent_candle', 8.3, 7.6, { h: 0.3 });
    alcove(c, r, g, X, { side: 's', at: 12.6, w: 2.4, d: 1.6, h: 2.6, mat: c.surf('plaster', 2.4, 0xd8c0a0), floorMat: canvasMat(c, 'velvet'), light: 0xffc080 });
    g.add(c.slab(1.0, 0.5, 0.8, canvasMat(c, 'velvet'), 12.6, 0.25, 7.3)); c.post(X(12.6), 7.3, 0.6);
    const hat = prop(c, r, g, X, 'nyb_dundee_hat', 12.6, 7.3, { len: 0.5, y: 0.5, ry: -0.4, egg: ['A hat', 'armor_hat', 'The hat. Leather. Worn by a man who wrestled an alligator in the Bronx River and lost on points. The hat has not been washed since. The hat will not be.'] }); wrappable(c, r, hat, { name: 'The hat' }); guided(c, r, hat, 'The hat', 'A helmet of the Australian cavalry, worn in the Battle of Broadway, which was a musical.', 1.2);
    prop(c, r, g, X, 'nyb_scent_candle', 11.7, 7.6, { h: 0.3 }); prop(c, r, g, X, 'nyb_scent_candle', 13.5, 7.6, { h: 0.3 });
    const gb = prop(c, r, g, X, 'nyb_gangs_bull', 16.6, -2.8, { h: 1.2, ry: -0.6, r: 0.8 }); wrappable(c, r, gb, { name: 'The bull of the Five Points' }); guided(c, r, gb, 'The bull', 'The bull of the Five Points. Bronze. It was a butcher\'s sign. The butcher is a bank now. The bull has not been told.', 1.6);
    prop(c, r, g, X, 'nyb_bench_plaque', 3.6, 6.8, { len: 2.0, r: 0.9 }); prop(c, r, g, X, 'nyb_bench_plaque', 16.4, 6.8, { len: 2.0, r: 0.9 });
    extra(c, g, 4.6, 6.4, { ry: 0.4, pool: 'suits' }); extra(c, g, 15.6, 6.3, { ry: -0.4, pool: 'dressy' }); extra(c, g, 9.0, -3.4, { ry: 0.9, pool: 'night' }); extra(c, g, 1.6, 4.2, { ry: PI / 2, pool: 'walkers' });
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
    // the hero: the alarm box, on a DO NOT TOUCH panel by the west wall, red, loud, the only thing in the room that wants to be wrapped
    const panel = decal(c, 1.6, 2.2, (q, w, h) => { q.fillStyle = '#c81e1e'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.fillRect(16, 16, w - 32, h - 32); q.fillStyle = '#c81e1e'; q.font = `900 ${w * 0.17}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('DO NOT', w / 2, h * 0.2); q.fillText('TOUCH', w / 2, h * 0.34); q.font = `700 ${w * 0.07}px ${c.MONO}`; q.fillStyle = '#111'; q.fillText('THE ALARM HAS OPINIONS', w / 2, h * 0.92); for (let k = 0; k < 6; k++) { q.fillStyle = k % 2 ? '#111' : '#f5c542'; q.fillRect(16 + k * (w - 32) / 6, h * 0.84, (w - 32) / 6, 14); } }); panel.position.set(0.15, 2.2, 0.4); panel.rotation.y = PI / 2; g.add(panel);
    const box = c.slab(0.5, 0.6, 0.18, std(c, 0xc81e1e, { roughness: 0.4 }), 0.34, 2.0, 0.4); g.add(box); const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 20), std(c, 0xd8d0c0, { metalness: 0.9, roughness: 0.3 })); bell.rotation.z = PI / 2; bell.position.set(0.5, 2.0, 0.4); g.add(bell);
    const bx = new THREE.Group(); bx.add(box); bx.add(bell); g.add(bx); bx.userData.ready = true; const tb = wrappable(c, r, bx, { name: 'The alarm' });
    const bg = glow(c, g, 0.7, 2.0, 0.4, 'rgba(255,60,40,.9)', 1.2); c.tick((t) => { bg.scale.setScalar(ALARM.on ? 1.2 + Math.sin(t * 18) * 0.5 : 0.7 + Math.sin(t * 2) * 0.1); });
    notice(c, g, '"ALARM" · DO NOT WRAP', 0.2, 3.5, 0.4, PI / 2, 1.2, 0.26, '#0d0d0d', '#ff4a4a');
    const red = new THREE.PointLight(0xff2020, 0, 18, 1.6); red.position.set(10, 4.5, 0); g.add(red);
    const G = guards(c, r, g, X, [['usher', 1.0, -6.4, 1.85], ['agent', 19.0, 5.2, 1.85]], { speed: 1.5, line: 'Sir. SIR. That is a HUNDRED years old.' });
    r.guardsOff = true;
    const trip = (nm, m) => { if (ALARM.silenced) { c.say(m, nm + '. Touched. Nothing happened. The alarm is a painting now.', 2600, 1.9); return; } if (!ALARM.on) { ALARM.on = true; r.guardsOff = false; c.sound.horn && c.sound.horn(); c.flash(0.3); c.toast(`You touched ${nm}. The alarm has opinions. The guards have legs. Wrap the alarm box by the west wall to shut it up.`, 5000); c.egg('american_touched', 'DO NOT TOUCH. You touched. Everybody touches. The sign is not a rule, it is a dare.'); } };
    r.onWrap = (t) => { if (t === tb && ALARM.on) { ALARM.on = false; ALARM.silenced = true; r.guardsOff = true; red.intensity = 0; c.sound.ding(); c.egg('american_silenced', 'The alarm is wrapped. It is still going off, in its heart. The guards have stopped. One of them is admiring the pattern.'); G.forEach((q) => c.say(q.m, 'Oh that is nice.', 2200, 2.1)); } };
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) { red.intensity = 0; return; } if (ALARM.on) { ALARM.t += dt; red.intensity = (Math.sin(ALARM.t * 9) > 0 ? 28 : 4); if (((ALARM.t * 1.5) | 0) !== (((ALARM.t - dt) * 1.5) | 0)) c.sound.beep && c.sound.beep(); } else red.intensity += (0 - red.intensity) * Math.min(1, dt * 4);
      const L = local(r, P); for (const [x, z, nm, m] of near) { if (Math.hypot(L.x - x, L.z - z) < 0.95 && !m.userData.warned) { m.userData.warned = true; c.say(m, 'Too close.', 1400, 1.9); setTimeout(() => { m.userData.warned = false; }, 6000); } } });
    // the period room's own furniture (Poly Haven, wrapped on sight)
    prop(c, r, g, X, 'vintage_grandfather_clock_01', 18.6, 0.2, { h: 2.3, ry: -PI / 2, r: 0.4, egg: ['A clock', 'american_clock', 'The clock stopped in 1896. It is right twice a day, which is more than the guards.'] });
    prop(c, r, g, X, 'Rockingchair_01', 17.6, 5.2, { len: 1.0, ry: -0.5, r: 0.5, sway: 1.4 });
    // the nook: the period room itself, roped off, a parlour of 1870 with everything the crew could carry in
    alcove(c, r, g, X, { side: 's', at: 4.0, w: 4.4, d: 2.4, h: 3.2, mat: c.surf('plaster', 2.4, 0xc89098), floorMat: canvasMat(c, 'wood', 0x8a6040), light: 0xffc890 });
    rug(c, g, 4.0, 6.9, 3.6, 1.9, '#5a2030', '#d6a640');
    const wood = canvasMat(c, 'wood', 0x5a3a24); g.add(c.slab(1.7, 1.15, 0.12, wood, 4.0, 0.575, 7.75)); g.add(c.slab(1.9, 0.1, 0.4, wood, 4.0, 1.2, 7.6)); g.add(c.slab(0.9, 0.8, 0.1, std(c, 0x1a1210, { roughness: 0.9 }), 4.0, 0.42, 7.7));
    const fire = glow(c, g, 4.0, 0.45, 7.62, 'rgba(255,150,60,.95)', 1.0); c.tick((t) => { fire.scale.setScalar(0.8 + Math.sin(t * 9) * 0.15 + Math.sin(t * 23) * 0.08); });
    const fl = new THREE.PointLight(0xff9040, 5, 6, 1.6); fl.position.set(4.0, 0.9, 7.2); g.add(fl);
    prop(c, r, g, X, 'nyb_tenen_portrait', 4.0, 7.82, { h: 1.3, y: 1.6, hint: 'A portrait', fn: (cc, m) => cc.say(m, 'The family portrait. Four flowers, one frame, no eye contact. They have been not talking to each other since 1870. It is going well.', 3200, 1.2) });
    const ac = prop(c, r, g, X, 'nyb_tenen_armchair', 2.7, 7.0, { len: 1.0, ry: 0.7, r: 0.5, egg: ['A chair', 'american_sat', 'DO NOT SIT. You sat. It is a very good chair. Washington sat here. Washington sat everywhere. He was tired.'] }); wrappable(c, r, ac, { name: 'The armchair' });
    const so = prop(c, r, g, X, 'nyb_annie_sofa', 5.3, 6.9, { len: 1.6, ry: -0.3, r: 0.8 }); wrappable(c, r, so, { name: 'The sofa' });
    prop(c, r, g, X, 'nyb_tenen_plant', 5.9, 7.6, { h: 1.2, r: 0.3 }); prop(c, r, g, X, 'nyb_bramford_clock', 2.2, 7.6, { h: 1.9, ry: 0.3, r: 0.3 }); prop(c, r, g, X, 'nyb_mail_daisies', 4.0, 7.6, { h: 0.3, y: 1.25 });
    prop(c, r, g, X, 'ornate_mirror_01', 1.86, 7.0, { h: 1.2, y: 1.5, ry: PI / 2 });
    stanchions(c, g, X, [[1.9, 5.7], [6.1, 5.7]], { col: 0x8a1a1a, tape: false });
    notice(c, g, '"PARLOUR", 1870 · DO NOT ENTER · DO NOT SIT · DO NOT', 4.0, 3.75, 6.75, 0, 3.2, 0.3, '#0d0d0d', '#f5c542');
    // the middle of the floor: the games table and its chairs, under the chandelier, on the rug
    rug(c, g, 10, 0.0, 4.2, 3.0, '#2a4a5a', '#d6a640');
    prop(c, r, g, X, 'nyb_th_table', 10, 0.0, { len: 1.3, r: 0.8 });
    const gm = prop(c, r, g, X, 'nyb_tenen_games', 9.7, -0.2, { len: 0.5, y: 0.76, ry: 0.3, hint: 'The games', fn: (cc, m) => cc.say(m, 'Board games. All of them missing one piece. The piece is in the lab. The piece was never original.', 2800, 1.2) }); wrappable(c, r, gm, { name: 'The games' });
    const mt = prop(c, r, g, X, 'nyb_tenen_mousetrap', 10.4, 0.2, { len: 0.35, y: 0.76, ry: -0.5, egg: ['A mousetrap', 'american_mousetrap', 'The mousetrap. Museum quality. It has caught one critic, one curator and a trustee. No mouse. The mouse reads the signs.'] }); wrappable(c, r, mt, { name: 'The mousetrap' });
    for (const [x, ry] of [[8.3, PI / 2], [11.7, -PI / 2]]) { const ch = prop(c, r, g, X, 'nyb_bigbusiness_armchair', x, 0.0, { len: 0.9, ry, r: 0.5 }); wrappable(c, r, ch, { name: 'An armchair' }); }
    const cs = prop(c, r, g, X, 'nyb_crooklyn_sofa', 15.2, 6.7, { len: 1.8, r: 0.9 }); wrappable(c, r, cs, { name: 'The other sofa' }); prop(c, r, g, X, 'nyb_tenen_plant', 18.4, 6.9, { h: 1.3, r: 0.3 });
    // the walls and the ceiling: sconces, a second portrait, the fan, the chandeliers
    for (const z of [-5.4, -3.0]) { prop(c, r, g, X, 'nyb_annie_sconce', 0.2, z, { h: 0.5, y: 3.3, ry: PI / 2 }); prop(c, r, g, X, 'nyb_annie_sconce', W - 0.45, z, { h: 0.5, y: 3.3, ry: -PI / 2 }); }
    for (const x of [9.5, 14.7]) prop(c, r, g, X, 'nyb_lobby_sconce', x, D / 2 - 0.2, { h: 0.5, y: 3.4, ry: PI });
    prop(c, r, g, X, 'nyb_crooklyn_portrait', W - 0.2, 0.6, { h: 1.1, y: 2.0, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_miracle_portrait', 6.7, D / 2 - 0.2, { h: 0.9, y: 2.2, ry: PI });
    prop(c, r, g, X, 'nyb_crooklyn_fan', 15, -3, { h: 0.5, y: 5.3, spin: 3 }); prop(c, r, g, X, 'nyb_th_chandelier', 15, 3, { h: 1.3, y: 4.6 });
    extra(c, g, 6.9, 5.3, { ry: -0.6, pool: 'suits' }); extra(c, g, 2.6, -0.2, { ry: -PI / 2, pool: 'dressy' }); extra(c, g, 14.0, 5.5, { ry: 0.3, pool: 'walkers' }); extra(c, g, 16.4, 3.9, { seated: true, ry: -0.6 });
    plaque(c, g, 10, 3.4, D / 2 - 0.13, PI, 'DO NOT TOUCH', 'EVERYTHING HERE HAS BEEN TOUCHED', 2.2);
  },

  // THE GIFT SHOP. The price grows while you look. Everything is a wrapped version of something you cannot afford.
  shop(c, r, g, X) {
    const { THREE } = c;
    const goods = [
      ['ph_carrot_cake', 'A cake', 12], ['ph_wine_bottles_01', 'Wine', 38], ['ph_television_02', 'A television', 199], ['ph_Megaphone_01', 'A megaphone', 44], ['ph_digital_wrist_watch', 'A watch', 29], ['ph_vintage_lighter', 'A lighter', 9],
      ['ph_pot_enamel_01', 'A pot', 31], ['ph_metal_toolbox', 'A toolbox', 56], ['ph_old_tyre', 'A tyre', 120], ['ph_lifebuoy', 'A life ring', 88], ['ph_life_jacket', 'A life jacket', 75], ['ph_plunger', 'A plunger', 14], ['ph_concrete_cat_statue', 'The cat', 400], ['ph_sungka_board', 'A board game', 22],
    ];
    const shelf = (x, z, ry) => { const wood = canvasMat(c, 'wood', 0xd8c8b0); const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); for (const y of [0.45, 1.15, 1.85]) o.add(c.slab(3.2, 0.05, 0.6, wood, 0, y, 0)); for (const a of [-1.55, 1.55]) o.add(c.slab(0.05, 2.0, 0.6, wood, a, 1.0, 0)); c.wall(X(x) - 1.6 * Math.cos(ry), z + 1.6 * Math.sin(ry), X(x) + 1.6 * Math.cos(ry), z - 1.6 * Math.sin(ry)); return o; };
    const S = [[4, -4.6, 0], [10, -4.6, 0], [16, -4.6, 0], [4, 1.0, 0], [16, 1.0, 0]];
    const tags = [];
    goods.forEach(([name, nm, base], k) => {
      const sh = S[k % S.length], slot = Math.floor(k / S.length), lx = -1.0 + (k % 3) * 1.0, ly = [0.5, 1.2, 1.9][slot % 3];
      const x = sh[0] + lx, z = sh[1] + 0.0;
      if (k < S.length) shelf(sh[0], sh[1], sh[2]);
      const m = c.glb(name, { h: 0.5, x, y: ly, z, parent: g, ry: Math.random() * 1.2 - 0.6, shadow: false }); wrappable(c, r, m, { name: nm });
      const tg = board(c, g, 0.5, 0.22, 96); tg.m.position.set(x, ly + 0.62, z + 0.32); tags.push({ tg, x, z, nm, price: base, base, m });
      c.clickable(m, () => { const tt = tags.find((q) => q.m === m); c.say(m, `${nm}. $${Math.round(tt.price).toLocaleString('en-US')}. It was $${tt.base} when you walked in.`, 3200, 0.5); if (tt.price > 1000 && !tt.sold) { tt.sold = true; c.egg('shop_inflation', `${nm} passed a thousand dollars while you looked at it. Looking is the expensive part. It always was.`); } }, nm);
    });
    const fwd = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; c.camera.getWorldDirection(fwd); const L = local(r, P);
      for (const q of tags) { const dx = q.x - L.x, dz = q.z - L.z, d = Math.hypot(dx, dz); const dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6); if (d < 5 && dot > 0.975) q.price += dt * (6 + q.base * 0.4) * (1 + q.price / 400); else q.price = Math.max(q.base, q.price - dt * 2);
        if (((t * 6) | 0) !== (((t - dt) * 6) | 0)) { const { q: qq, W: w2, H: h2 } = q.tg; qq.fillStyle = q.price > q.base * 3 ? '#ff4fa3' : '#f4ead2'; qq.fillRect(0, 0, w2, h2); qq.fillStyle = '#111'; qq.font = `800 ${h2 * 0.6}px ${c.MONO}`; qq.textAlign = 'center'; qq.fillText('$' + Math.round(q.price).toLocaleString('en-US'), w2 / 2, h2 * 0.72); q.tg.up(); } } });
    // the posters: the SAME DIFFERENCE one sheets on a rack
    const PO = window.POSTERS || [];
    // sixteen on the west wall, clear of the door, and eight on a spinner rack by the tea set
    const posterMesh = (f) => { const t = c.tex.load(`assets/posters/${f}`); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.35), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: THREE.DoubleSide })); c.clickable(m, () => { c.say(m, 'A poster from SAME DIFFERENCE. $45. $46 now.', 2400, 0.9); }, 'A poster'); return m; };
    PO.slice(0, 16).forEach((f, k) => { const m = posterMesh(f), col = k % 8, row = Math.floor(k / 8); m.position.set(0.16, 3.3 - row * 1.5, -7.1 + col * 1.1); m.rotation.y = PI / 2; g.add(m); });
    const spin = new THREE.Group(); spin.position.set(16.6, 0, 5.4); g.add(spin); const sp = std(c, 0x2a2a2e, { metalness: 0.7, roughness: 0.4 }); spin.add(c.slab(0.06, 3.2, 0.06, sp, 0, 1.6, 0)); spin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.05, 20), sp)); c.post(X(16.6), 5.4, 0.6);
    PO.slice(16, 24).forEach((f, k) => { const m = posterMesh(f), tier = Math.floor(k / 4), a = (k % 4) * PI / 2; m.position.set(Math.sin(a) * 0.5, 2.5 - tier * 1.45, Math.cos(a) * 0.5); m.rotation.y = a; spin.add(m); });
    c.tick((t) => { spin.rotation.y = t * 0.25; });
    notice(c, g, '"POSTERS" · $45 · $46 IF YOU READ THIS', 0.2, 4.15, -3.2, PI / 2, 3.2, 0.34, '#0d0d0d', '#f5c542');
    // the counter you walk behind: the gold register, the humidor, the totes and the mugs, the cashier, who is a bodega cat
    const ctop = canvasMat(c, 'wood', 0xd8c8b0); g.add(c.slab(3.2, 0.9, 0.8, ctop, 4.4, 0.45, 4.2)); g.add(c.slab(0.8, 0.9, 2.4, ctop, 6.4, 0.45, 5.4)); c.wall(X(2.8), 3.8, X(6.0), 3.8); c.wall(X(2.8), 3.8, X(2.8), 4.6); c.wall(X(6.0), 3.8, X(6.8), 3.8); c.wall(X(6.8), 3.8, X(6.8), 6.6);
    prop(c, r, g, X, 'nyb_register_gold', 4.4, 4.2, { len: 0.7, y: 0.9, ry: PI });
    const hum = prop(c, r, g, X, 'nyb_smoke_humidor', 5.4, 4.2, { len: 0.5, y: 0.9, ry: 0.3, hint: 'The humidor', fn: (cc, m) => cc.say(m, 'Cigars. For after. There is no after. $300.', 2400, 1.2) }); wrappable(c, r, hum, { name: 'The humidor' });
    const tote = prop(c, r, g, X, 'nyb_ferry_bag', 3.3, 4.2, { h: 0.45, y: 0.9, ry: 0.4, egg: ['A tote', 'shop_tote', 'A tote bag. $38. It says MUSEUM on one side and nothing on the other. The nothing is the expensive side.'] }); wrappable(c, r, tote, { name: 'A tote' });
    prop(c, r, g, X, 'nyb_ferry_thermos', 3.8, 4.0, { h: 0.28, y: 0.9 }); prop(c, r, g, X, 'nyb_kong_postcards', 6.4, 4.5, { h: 0.5, y: 0.9, ry: -0.3 });
    prop(c, r, g, X, 'nyb_mail_stool', 5.2, 5.2, { h: 0.7, ry: 0.4 }); prop(c, r, g, X, 'nyb_tv_eye', 4.4, 6.4, { h: 0.6, y: 3.3, ry: 0 });
    const catm = cast(c, r, g, X, 'sw_bodegacat', 4.4, 5.4, { h: 1.0, ry: PI, line: 'No returns. No exchanges. No eye contact. Next.', hint: 'The cashier', egg: 'shop_cashier' }); wrappable(c, r, catm, { name: 'The cashier' });
    prop(c, r, g, X, 'tea_set_01', 14.6, 4.6, { len: 0.8, y: 0.9 }); plinth(c, g, X, 14.6, 4.6, 1.0, 0.9, 0.8); label(c, g, 14.6, 0.5, 5.1, 0, ['MUGS, A SET', 'dishwasher unsafe', '"$12 EACH, $90 THE SET"']);
    guards(c, r, g, X, [['usher', 18.6, -6.4, 1.85]], { speed: 0.6 });
    // the hero: the museum's largest bath toy, in the middle of the shop, on a plinth, four million dollars and climbing
    plinth(c, g, X, 10, -1.6, 2.0, 0.3, 2.0); const duck = prop(c, r, g, X, 'nyb_big_duck', 10, -1.6, { h: 2.0, y: 0.3, ry: -0.3, egg: ['The duck', 'shop_duck', 'The duck. Four million dollars. It floats. So does the price. The museum has sold it twice and kept it both times.'] }); wrappable(c, r, duck, { name: 'The duck' });
    label(c, g, 10, 0.5, -0.5, 0, ['BATH TOY, LARGE', 'rubber, allegedly', '"$4,000,000 · $4,000,001"']); glow(c, g, 10, 2.6, -1.6, 'rgba(255,240,120,.4)', 2.4);
    // the aisles: big shelves with books and totes, the mail room shelf by the plate, the reading corner
    for (const x of [7.4, 12.6]) { prop(c, r, g, X, 'nyb_big_shelves', x, 1.0, { len: 1.8, r: 0.9 }); const bk = prop(c, r, g, X, 'nyb_library_books', x - 0.4, 1.0, { len: 0.5, y: 0.4 + (x > 10 ? 0.7 : 0), egg: ['Books', 'shop_books', 'The catalogue. 400 pages, every object in the building, photographed before tonight. Out of date by eleven o\'clock. $65. Still out of date.'] }); wrappable(c, r, bk, { name: 'The catalogue' }); prop(c, r, g, X, ['nyb_blackswan_bag', 'nyb_stairs_bag'][x > 10 ? 1 : 0], x + 0.4, 1.0, { h: 0.4, y: 1.1 - (x > 10 ? 0.7 : 0), ry: 0.4 }); }
    prop(c, r, g, X, 'nyb_mail_shelf', 18.0, -7.5, { len: 2.2, r: 0.8 }); prop(c, r, g, X, 'nyb_library_books2', 17.6, -7.5, { len: 0.5, y: 0.9 }); prop(c, r, g, X, 'nyb_oddcouple_bag', 18.5, -7.5, { h: 0.4, y: 0.9 });
    prop(c, r, g, X, 'nyb_mail_rocker', 2.2, 0.2, { len: 0.9, ry: 0.7, r: 0.5, sway: 1.2 }); prop(c, r, g, X, 'nyb_llewyn_table', 3.4, -0.8, { h: 0.6, r: 0.4 }); prop(c, r, g, X, 'nyb_mail_daisies', 3.4, -0.8, { h: 0.3, y: 0.6 }); prop(c, r, g, X, 'nyb_kramer_plant', 1.4, -1.6, { h: 1.3, r: 0.3 });
    // the dropped ceiling: a grid at 4.4 m with panels that hum, the signs hanging under it
    g.add(c.slab(W, 0.08, D, c.surf('plaster', 3, 0xf0ece4), W / 2, 4.44, 0)); coffer(c, r, g, { nx: 5, nz: 4, y: 4.4, mat: c.surf('plaster', 2, 0xd8d4cc), bulb: 0 });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) tube(c, g, (i + 0.5) * W / 5, 4.3, -D / 2 + (j + 0.5) * D / 4, 2.0, 0, 0xf4f8ff);
    [[5, 'WRAPPED TONIGHT', '40% OFF THE IDEA'], [10, 'EVERYTHING MUST GO', 'IT WILL NOT'], [15, 'EXIT', 'THROUGH THE SHOP']].forEach(([x, a, b]) => { const d = decal(c, 1.6, 0.6, (q, w, h) => { q.fillStyle = '#ff4fa3'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.34}px ${c.FONT}`; q.textAlign = 'center'; q.fillText(a, w / 2, h * 0.42); q.font = `700 ${h * 0.22}px ${c.MONO}`; q.fillText(b, w / 2, h * 0.78); }); d.material.side = THREE.DoubleSide; d.position.set(x, 3.7, -3.0); g.add(d); for (const dx of [-0.6, 0.6]) g.add(c.slab(0.01, 0.4, 0.01, std(c, 0x333333), x + dx, 4.2, -3.0)); });
    const mat = decal(c, 1.6, 1.0, (q, w, h) => { q.fillStyle = '#2a2a2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `900 ${h * 0.3}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('BE COUNTED', w / 2, h * 0.6); }); mat.rotation.x = -PI / 2; mat.position.set(10, 0.012, 6.9); g.add(mat);
    extra(c, g, 12.2, -3.4, { ry: 0, pool: 'walkers' }); extra(c, g, 5.2, 0.1, { ry: PI, pool: 'dressy' }); extra(c, g, 4.4, 3.1, { ry: PI, pool: 'suits' }); extra(c, g, 4.6, 2.3, { ry: PI, pool: 'night' }); extra(c, g, 15.6, -3.6, { ry: 0.2, pool: 'walkers' });
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
      if (pitch > 0.95 && !coin) { coin = true; c.egg('roof_coin', 'Overhead the moon is a coin. On the skyline it was a building. Same moon. Your eye is the museum.'); }
      if (pitch < 0.1 && c.P.z < -2 && !big) { big = true; }
    });
    // the telescope: a wrapped Hubble on a tripod, which is binoculars
    const tri = std(c, 0x2a2a2e, { metalness: 0.6, roughness: 0.4 }); for (const a of [0, 2.1, 4.2]) { const l = c.slab(0.05, 1.5, 0.05, tri, 4 + Math.cos(a) * 0.35, 0.75, -3 + Math.sin(a) * 0.35); l.rotation.z = Math.cos(a) * 0.25; l.rotation.x = -Math.sin(a) * 0.25; g.add(l); }
    const hub = c.glb('nasa_hubble-25th-anniversary-model', { len: 1.6, x: 4, y: 1.5, z: -3, ry: 0.4, parent: g, shadow: false }); hub.rotation.x = -0.5; wrappable(c, r, hub, { name: 'The telescope' }); c.post(X(4), -3, 0.5);
    c.clickable(hub, () => { c.zoom(true); c.egg('roof_peep', 'A space telescope pointed at a studio on the ninth floor. In New York every telescope is pointed at a window. Press Z to put it down.'); }, 'The telescope (look through it)');
    label(c, g, 4, 0.5, -2.4, 0, ['HUBBLE, 1:25', 'points at 4F, across the park', '"ASTRONOMY"']);
    // the roof commission, a dragon in a planter, cafe tables, the bar
    plinth(c, g, X, 15.4, -3.4, 2.4, 0.5, 1.6, 0x6a6a70); const dr = c.glb('tds_dragon-2', { len: 2.4, x: 15.4, y: 0.5, z: -3.4, rx: -PI / 2, ry: 0.4, parent: g }); wrappable(c, r, dr, { name: 'The roof commission' }); label(c, g, 15.4, 0.5, -2.5, 0, ['ROOF COMMISSION, 2026', 'a dragon, wrapped, on loan from nobody', '"SITE SPECIFIC"']);
    for (const [x, z] of [[6.4, 2.4], [13.6, 2.4]]) { prop(c, r, g, X, 'round_wooden_table_01', x, z, { len: 0.9, r: 0.5 }); prop(c, r, g, X, 'nyb_barstool_pink', x + 0.7, z + 0.3, { h: 0.7, r: 0.2 }); prop(c, r, g, X, 'nyb_barstool_pink', x - 0.7, z - 0.3, { h: 0.7, r: 0.2 }); }
    // the bar: the cart in the corner, a counter in front of it, three stools, two regulars, the bottles
    const bar = prop(c, r, g, X, 'nyb_coffeecart', 16.6, 7.0, { len: 2.2, ry: 0, r: 1.0, egg: ['The bar', 'roof_bar', 'The roof bar. A glass of wine is $24 and comes with the view. The view is $31. Nobody has ever had just the view.'] }); wrappable(c, r, bar, { name: 'The bar' });
    g.add(c.slab(3.8, 1.05, 0.6, canvasMat(c, 'wood', 0x5a3a24), 16.4, 0.525, 5.9)); g.add(c.slab(4.0, 0.05, 0.7, std(c, 0x2a2a2e, { metalness: 0.7, roughness: 0.3 }), 16.4, 1.07, 5.9)); c.wall(X(14.5), 5.6, X(18.3), 5.6); c.wall(X(14.5), 5.6, X(14.5), 6.2);
    for (const x of [15.1, 16.4, 17.7]) prop(c, r, g, X, 'nyb_barstool_pink', x, 5.1, { h: 0.75, r: 0.25 });
    prop(c, r, g, X, 'nyb_cocktail_bottles', 15.2, 5.9, { len: 0.5, y: 1.1 }); prop(c, r, g, X, 'wine_bottles_01', 17.6, 5.9, { len: 0.4, y: 1.1 }); prop(c, r, g, X, 'nyb_feast_lantern', 14.8, 6.0, { h: 0.4, y: 1.1 });
    extra(c, g, 15.1, 4.5, { ry: PI, pool: 'night' }); extra(c, g, 17.7, 4.5, { ry: PI, pool: 'dressy' }); extra(c, g, 16.4, 6.6, { ry: 0, pool: ['bartender'] });
    bulbs(c, g, 13.8, 19.0, 3.0, 5.6, 10, 0xffe0a0);
    // the hedge: planters along the south wall and the corners, the benches, the pigeons who own the bench
    for (const [x, z] of [[2, 5.2], [18.4, -6.2, 1], [2.2, -6.2, 1], [5.2, 7.3], [8.2, 7.3], [11.8, 7.3]]) prop(c, r, g, X, 'nyb_pigeons_planter', x, z, { len: 1.6, r: 0.8, y: z < -4 ? 1.0 : 0 });
    prop(c, r, g, X, 'potted_plant_02', 2.2, 1.2, { h: 1.4, r: 0.4 }); prop(c, r, g, X, 'potted_plant_04', 18, 0.8, { h: 1.3, r: 0.4 }); prop(c, r, g, X, 'nyb_manhattan_planter', 2.4, 7.2, { len: 1.2, r: 0.6 });
    prop(c, r, g, X, 'nyb_manhattan_bench', 10, 7.4, { len: 2.0, r: 0.6 }); const pb = prop(c, r, g, X, 'nyb_pigeons_bench', 2.8, -0.8, { len: 1.8, ry: PI / 2, r: 0.9, hint: 'A bench', fn: (cc, m) => cc.say(m, 'The pigeons have the bench. They had it before the garden, before the museum, before the park. You may sit. They will let you know.', 3200, 1.0) }); wrappable(c, r, pb, { name: 'The pigeons\' bench' });
    [[2.8, -1.6, 0.46], [2.6, -0.2, 0.46], [3.6, 0.4, 0], [2.0, 0.6, 0]].forEach(([x, z, y], k) => prop(c, r, g, X, 'mk_pigeon', x, z, { len: 0.3, y, ry: k * 1.7, bob: y ? 0 : 0 }));
    prop(c, r, g, X, 'nyb_pigeons_seed', 3.2, 0.3, { len: 0.3 });
    // the walls: a fire escape, window units, the security light, the theatre's own lamps
    prop(c, r, g, X, 'nyb_treebrooklyn_fireescape', W - 0.5, -2.6, { h: 4.0, y: 4.2, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_walking_aircon', 0.5, -3.0, { len: 0.7, y: 3.4, ry: PI / 2 }); prop(c, r, g, X, 'nyb_birdman_ac', W - 0.5, 6.8, { len: 0.7, y: 3.2, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_aircon', 0.5, 7.0, { len: 0.7, y: 3.6, ry: PI / 2 });
    prop(c, r, g, X, 'nyb_birdman_seclight', 0.4, -7.4, { h: 0.4, y: 4.6, ry: PI / 4 }); glow(c, g, 0.9, 4.5, -7.0, 'rgba(255,230,180,.8)', 1.4); prop(c, r, g, X, 'nyb_lamp_nazar', 6.2, 6.6, { h: 3.6, r: 0.3 }); prop(c, r, g, X, 'nyb_lamp_banner', 13.8, 6.6, { h: 3.6, r: 0.3 });
    prop(c, r, g, X, 'nyb_utility_bomb', W - 0.6, 0.0, { h: 1.2, ry: -PI / 2, r: 0.4 }); prop(c, r, g, X, 'nyb_chainlink', 0.5, -5.0, { len: 2.0, y: 1.0, ry: PI / 2 });
    // the nook: the viewing deck along the parapet, a metre up, with the rail, the searchlight and the water tower on it
    deck(c, r, g, X, { x1: 0, x2: W, z1: -D / 2 + 1.2, z2: -4.3, y: 1.0, mat: c.surf('boardwalk', 2, 0x9a8a70), solid: true, rail: ['s'], railCol: 0x2a2a2e, stair: { side: 's', at: 10, w: 2.2 } });
    const sl = prop(c, r, g, X, 'nyb_kong_searchlight', 6.4, -5.8, { h: 2.2, y: 1.0, r: 0.8, egg: ['The searchlight', 'roof_searchlight', 'The searchlight. It has been pointed at the sky since 1933, looking for something big. Tonight it found the moon and the moon found it back.'] }); wrappable(c, r, sl, { name: 'The searchlight' });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 1.6, 26, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); beam.position.set(6.4, 14.5, -5.8); g.add(beam); c.tick((t) => { beam.rotation.z = 0.35 + Math.sin(t * 0.3) * 0.25; beam.rotation.x = Math.cos(t * 0.23) * 0.3; beam.position.set(6.4 + Math.sin(beam.rotation.z) * 10, 1.9 + Math.cos(beam.rotation.z) * 12, -5.8 - Math.sin(beam.rotation.x) * 10); });
    const tank = canvasMat(c, 'wood', 0x6a4a30), tm = std(c, 0x2a2a2e, { metalness: 0.7, roughness: 0.4 }); for (const [dx, dz] of [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]) g.add(c.slab(0.12, 2.2, 0.12, tm, 16.6 + dx, 2.1, -5.6 + dz));
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 2.4, 18), tank); tub.position.set(16.6, 4.4, -5.6); g.add(tub); const cone = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.9, 18), tm); cone.position.set(16.6, 6.05, -5.6); g.add(cone); for (const y of [3.5, 4.4, 5.3]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.08 - (y - 4.4) * 0.04, 0.03, 8, 24), tm); hoop.rotation.x = PI / 2; hoop.position.set(16.6, y, -5.6); g.add(hoop); } c.post(X(16.6), -5.6, 1.2);
    c.clickable(tub, () => c.egg('roof_tower', 'The water tower. Every roof has one. Nobody has seen inside one. Inside is water, allegedly, and one pigeon who got in and is fine.'), 'The water tower');
    for (const [x, z, nm] of [[4.0, -6.0, 'dressy'], [12.6, -6.1, 'night'], [13.8, -5.2, 'suits']]) { const e = extra(c, g, x, z, { ry: 0, pool: nm }); e.position.y = 1.0; }
    // the parapet with the city's own lights, raised for the deck, and a gull
    g.add(c.slab(W, 1.9, 0.3, c.surf('ashlar', 1.4, 0x8a8a8a), W / 2, 0.95, -D / 2 + 1.0)); c.wall(X(0), -D / 2 + 1.15, X(W), -D / 2 + 1.15);
    const gull = c.glb('gull', { len: 0.8, x: 12, y: 2.6, z: -6.9, parent: g, shadow: false }); c.tick((t) => { gull.position.set(12 + Math.sin(t * 0.4) * 5, 2.6 + Math.sin(t * 1.3) * 0.2, -6.9); gull.rotation.y = Math.cos(t * 0.4) > 0 ? PI / 2 : -PI / 2; }); c.clickable(gull, () => c.say(gull, 'MINE.', 1200, 0.6), 'A gull');
    cast(c, r, g, X, 'dancer', 8.2, -5.0, { h: 1.76, y: 1.0, ry: 0.3, line: 'I come up here to think. Then the moon does that thing and I stop.', hint: 'A regular' });
    guards(c, r, g, X, [['agent', 1.2, -2, 1.85]], { speed: 0.5 });
    plaque(c, g, 10, 2.6, D / 2 - 0.13, PI, 'THE "VIEW" IS THE WORK', 'THE ROOF GARDEN, CLOSED AT DUSK', 2.4);
  },

  // THE CONSERVATION LAB. The gun runs backwards. One of the originals was never original.
  lab(c, r, g, X) {
    const { THREE } = c;
    WRAP.mode = 'wrap'; r.onEnter = () => { WRAP.mode = 'unwrap'; c.toast('The lab. F now UNWRAPS. Ten objects on the tables. Take them down to the stone. One of them will not come off.', 5200); const b = document.getElementById('wrapbtn'); if (b) b.textContent = 'UNWRAP F'; };
    r.onLeave = () => { WRAP.mode = 'wrap'; const b = document.getElementById('wrapbtn'); if (b) b.textContent = 'WRAP F'; };
    const steel = c.surf('steel', 1, 0xc8ccd0), chrome = std(c, 0xb8bcc0, { metalness: 0.9, roughness: 0.3 });
    const T = [
      ['tds_homo-heidelbergensis-model', 'A hominid', { h: 0.9, rx: -PI / 2 }], ['tds_bone', 'A bone', { len: 0.9 }], ['tds_dark-finger-reef-crab', 'A crab', { len: 0.7 }], ['tds_blue-sea-star', 'A sea star', { len: 0.7 }],
      ['tds_le-transi-de-rene-de-chalon', 'A transi', { h: 1.0 }], ['tds_molding-of-a-section-of-the-bas-relief-of-angkor-wat-depic', 'A relief', { len: 0.9 }], ['si_nmah_western-electric-tangent-galvanometer', 'A galvanometer', { len: 0.7 }], ['si_nmaahc_bully-beef-can-opener', 'A can opener', { len: 0.6 }],
      ['nmnhmammals_hylobates-agilis', 'A gibbon', { h: 0.9 }], ['ph_spinning_wheel_01', 'A spinning wheel', { h: 1.0 }],
    ];
    const tbl = (x, z) => { g.add(c.slab(2.0, 0.06, 0.9, steel, x, 0.95, z)); for (const [a, b] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) g.add(c.slab(0.05, 0.95, 0.05, chrome, x + a, 0.47, z + b)); g.add(c.slab(1.8, 0.04, 0.7, chrome, x, 0.25, z)); c.wall(X(x) - 1, z - 0.45, X(x) + 1, z - 0.45); c.wall(X(x) - 1, z + 0.45, X(x) + 1, z + 0.45); c.wall(X(x) - 1, z - 0.45, X(x) - 1, z + 0.45); c.wall(X(x) + 1, z - 0.45, X(x) + 1, z + 0.45); };
    let down = 0; const fake = 7;
    T.forEach(([name, nm, o], k) => { const x = 3.2 + (k % 5) * 3.4, z = k < 5 ? -3.6 : 2.2; tbl(x, z); const m = c.glb(name, { ...o, x, y: 0.98, z, parent: g, ry: Math.random() * 1.2 - 0.6, shadow: false }); const t = wrappable(c, r, m, { name: nm }); if (k === fake) t.fake = true; label(c, g, x, 0.6, z + 0.6, 0, [nm.toUpperCase(), 'wrapped, now in treatment', '"TAKE IT DOWN"']); c.clickable(m, () => c.say(m, nm + '. ' + (t.state === 'marble' ? 'Down to the stone.' : 'Still wrapped. F.'), 2000, 1.4), nm); });
    r.onUnwrap = (t) => { if (t.state === 'marble') { down++; if (down === 9) { c.egg('lab_conserved', 'Nine down to the stone. The tenth is still wrapped. It will not come off.'); } }
      if (down >= 9 && t.fake) { setTimeout(() => { c.sound.applause && c.sound.applause(); window.__finale && window.__finale(); }, 1800); } };
    // the certificate: your night in numbers
    const cert = board(c, g, 2.4, 1.1, 512); cert.m.position.set(W - 0.44, 1.9, -2.2); cert.m.rotation.y = -PI / 2;
    c.tick((t) => { if (((t * 2) | 0) % 2) return; const { q, W: w2, H: h2 } = cert; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#111'; q.font = `800 ${h2 * 0.1}px ${c.MONO}`; q.textAlign = 'left'; q.fillText('CERTIFICATE OF WRAPPING', 24, h2 * 0.18); q.font = `500 ${h2 * 0.08}px ${c.MONO}`; q.fillText(`Objects wrapped tonight: ${WRAP.n}`, 24, h2 * 0.36); q.fillText(`Objects unwrapped: ${down} of 10`, 24, h2 * 0.5); q.fillText(`Lies heard: ${GUIDE.heard.size}`, 24, h2 * 0.64); q.fillText('Signed: THE CREW, in quotation marks', 24, h2 * 0.82); cert.up(); });
    prop(c, r, g, X, 'vintage_microscope', 17.4, -5.4, { h: 0.5, y: 0.95 }); tbl(17.4, -5.4); prop(c, r, g, X, 'nyb_tootsie_toolbox', 16.7, -5.4, { len: 0.5, y: 0.95, ry: 0.3 });
    prop(c, r, g, X, 'chemistry_set', 1.6, 5.2, { len: 0.8, y: 0.95 }); tbl(1.6, 5.2);
    prop(c, r, g, X, 'desk_lamp_arm_01', 14.6, 5.4, { h: 0.7, y: 0.95 }); tbl(14.6, 5.4); prop(c, r, g, X, 'nyb_stuart_toolbox', 13.9, 5.4, { len: 0.5, y: 0.95, ry: -0.4 }); prop(c, r, g, X, 'medical_box', 15.3, 5.4, { len: 0.45, y: 0.95 });
    prop(c, r, g, X, 'security_light', 10, 0, { len: 0.6, y: 5.7 });
    cast(c, r, g, X, 'clerk', 18.2, 4.6, { h: 1.76, ry: -0.8, line: 'Conservation. We take things down to what they were. Then somebody wraps them again. It is a living.', hint: 'The conservator', egg: 'lab_conservator' });
    // the hero: the slime tank from the sewers, on treatment, the one thing down here that glows on its own
    const tank = prop(c, r, g, X, 'nyb_sw_slimetank', 10, -5.6, { h: 2.4, r: 1.0, egg: ['The tank', 'lab_tank', 'The tank. Do not tap the glass. It taps back. It came up from the sewers for treatment and the treatment is going the other way.'] }); wrappable(c, r, tank, { name: 'The tank' });
    const gl = new THREE.PointLight(0x60ffa0, 10, 9, 1.6); gl.position.set(10, 1.6, -5.0); g.add(gl); c.tick((t) => { gl.intensity = 8 + Math.sin(t * 2.2) * 3; }); glow(c, g, 10, 1.4, -4.9, 'rgba(120,255,170,.6)', 2.6);
    label(c, g, 10, 0.6, -4.5, 0, ['TANK, LIVE', 'from the sewers, on treatment', '"DO NOT TAP"']);
    const tape = decal(c, 4.0, 0.25, (q, w, h) => { for (let k = 0; k < 16; k++) { q.fillStyle = k % 2 ? '#111' : '#f5c542'; q.fillRect(k * w / 16, 0, w / 16, h); } }); tape.rotation.x = -PI / 2; tape.position.set(10, 0.012, -4.2); tape.renderOrder = 1; g.add(tape);
    prop(c, r, g, X, 'nyb_itch_caution', 8.2, -5.6, { h: 0.9, ry: 0.5, r: 0.3 });
    const gen = prop(c, r, g, X, 'nyb_sw_generator', 17.6, -7.1, { len: 1.3, ry: 0.3, r: 0.8, egg: ['The generator', 'lab_generator', 'The generator runs the lab when the museum turns the power off at nine, which it does, to save money, which it has.'] }); wrappable(c, r, gen, { name: 'The generator' }); glow(c, g, 17.6, 0.9, -7.1, 'rgba(255,120,60,.7)', 0.6);
    // the specimen wall: the shelves, the cabinet, the jars with what the sewers sent up
    const jar = (x, y, z, k) => { const o = new THREE.Group(); o.position.set(x, y, z); g.add(o); const jg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 14, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xd8f0e0, transparent: true, opacity: 0.3, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false })); jg.position.y = 0.15; jg.renderOrder = 2; o.add(jg); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 14), std(c, 0x3a3a3e, { metalness: 0.6, roughness: 0.4 })); lid.position.y = 0.32; o.add(lid); const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 14), new THREE.MeshStandardMaterial({ color: [0x8ad0a0, 0xd0c080, 0x80b0d0][k % 3], transparent: true, opacity: 0.45, roughness: 0.2 })); liq.position.y = 0.12; o.add(liq); const sp = decal(c, 0.14, 0.14, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.95)); sp.material.side = THREE.DoubleSide; sp.position.y = 0.14; sp.rotation.y = k * 0.7; o.add(sp); return o; };
    const jw = canvasMat(c, 'steelplate'); g.add(c.slab(0.06, 2.4, 1.6, jw, 0.5, 1.4, -7.0)); for (const y of [0.9, 1.5, 2.1]) g.add(c.slab(0.5, 0.04, 1.6, jw, 0.7, y, -7.0)); for (let k = 0; k < 9; k++) { const j = jar(0.72, 0.92 + Math.floor(k / 3) * 0.6, -7.6 + (k % 3) * 0.55, k); c.clickable(j, () => c.egg('lab_jar', 'A jar. A specimen from the sewers, in formalin, with an eye. Every jar down here has an eye. They are counted. They count back.'), 'A jar'); }
    notice(c, g, '"SPECIMENS" · DO NOT OPEN · THEY ARE COUNTED', 1.4, 3.0, -7.0, PI / 2, 1.7, 0.26, '#0d0d0d', '#f5c542');
    prop(c, r, g, X, 'nyb_splash_shelves', 19.3, -6.4, { h: 2.0, ry: -PI / 2, r: 0.6 }); for (let k = 0; k < 3; k++) jar(19.25, 1.0 + k * 0.45, -6.8 + k * 0.4, k + 1);
    prop(c, r, g, X, 'nyb_wud_cabinet', 19.3, -4.3, { h: 2.0, ry: -PI / 2, r: 0.6 }); prop(c, r, g, X, 'nyb_splash_sign', W - 0.3, 6.2, { h: 0.8, y: 2.4, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_splash_monitor', 10, D / 2 - 0.4, { h: 0.6, y: 4.2, ry: PI });
    prop(c, r, g, X, 'nyb_wud_enlarger', 18.4, 0.5, { h: 0.8, y: 0.76, ry: -PI / 2 }); const ch = prop(c, r, g, X, 'nyb_wud_chem', 18.4, 1.4, { len: 0.5, y: 0.76, ry: 0.4, hint: 'The chemistry', fn: (cc, m) => cc.say(m, 'Solvent. Takes anything off anything. Do not ask what it took off the gibbon.', 2600, 1.2) }); wrappable(c, r, ch, { name: 'The chemistry' });
    prop(c, r, g, X, 'nyb_insideman_boxes', 18.8, 7.0, { h: 1.2, ry: 0.2, r: 0.7 }); prop(c, r, g, X, 'nyb_insideman_box', 17.4, 7.3, { len: 0.7, ry: -0.3, r: 0.4 }); prop(c, r, g, X, 'nyb_insideman_tape', 17.0, 6.6, { len: 0.3 });
    // the tables: microscopes, glasses, clipboards, a jar or two beside the ten
    for (const [x, z] of [[3.95, -3.6], [13.4 + 0.75, -3.6], [6.6 + 0.75, 2.2]]) prop(c, r, g, X, 'vintage_microscope', x, z, { h: 0.45, y: 0.98, ry: Math.random() });
    prop(c, r, g, X, 'magnifying_glass_01', 10.75, -3.6, { len: 0.3, y: 0.98 }); prop(c, r, g, X, 'clipboard', 3.95, 2.2, { len: 0.35, y: 0.98, ry: 0.4 }); prop(c, r, g, X, 'office_notepads', 16.05, 2.2, { len: 0.3, y: 0.98 });
    jar(6.6 - 0.8, 0.98, -3.6, 4); jar(16.8 - 0.8, 0.98, -3.6, 5); jar(10 - 0.8, 0.98, 2.2, 6); jar(13.4 - 0.8, 0.98, 2.2, 7);
    // the ceiling: coffers with a tube in every one, two ducts, the columns that hold the museum up
    coffer(c, r, g, { nx: 5, nz: 4, y: H_IN, mat: c.surf('concrete', 2, 0x7a7a7a), bulb: 0 });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) tube(c, g, (i + 0.5) * W / 5, 5.7, -D / 2 + (j + 0.5) * D / 4, 1.4, 0, (i + j) % 3 ? 0xe8f4ff : 0xd0ffe0);
    for (const x of [4, 16]) prop(c, r, g, X, 'modular_airduct_rectangular_01', x, 0, { len: 10, y: 4.9, ry: PI / 2 });
    fxColumn(c, r, g, X, 6.6, -0.7, { h: H_IN, rad: 0.3, mat: c.surf('concrete', 1, 0x9a9a9a), cap: false }); fxColumn(c, r, g, X, 13.4, -0.7, { h: H_IN, rad: 0.3, mat: c.surf('concrete', 1, 0x9a9a9a), cap: false });
    // the nook: a glass alcove on the east wall for the certificate, your night in numbers, behind glass like everything else
    alcove(c, r, g, X, { side: 'e', at: -2.2, w: 2.6, d: 1.6, h: 3.0, mat: c.surf('concrete', 2, 0xb0b4b8), floorMat: canvasMat(c, 'tile'), light: 0xd0ffe0 });
    const gf = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.0), new THREE.MeshPhysicalMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.16, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false })); gf.position.set(18.0, 1.5, -2.2); gf.rotation.y = PI / 2; gf.renderOrder = 2; g.add(gf); c.wall(X(18.0), -3.6, X(18.0), -0.8);
    for (const z of [-3.5, -0.9]) g.add(c.slab(0.05, 3.0, 0.05, chrome, 18.0, 1.5, z)); g.add(c.slab(0.05, 0.05, 2.7, chrome, 18.0, 2.98, -2.2));
    notice(c, g, '"CERTIFICATE OF WRAPPING" · ISSUED ON THE WAY OUT', 17.95, 3.3, -2.2, -PI / 2, 2.2, 0.26, '#0d0d0d', '#f5c542');
    extra(c, g, 5.0, -2.6, { ry: 0, pool: 'suits' }); extra(c, g, 13.4, 3.3, { ry: PI, pool: 'suits' }); extra(c, g, 8.2, -4.4, { ry: 0.6, pool: 'night' }); extra(c, g, 17.3, 1.0, { seated: true, ry: PI / 2 });
    guards(c, r, g, X, [['usher', 1.0, -6.6, 1.85]], { speed: 0.6 });
    plaque(c, g, 10, 3.4, D / 2 - 0.13, PI, 'THE ORIGINALS ARE "DOWNSTAIRS"', 'THE LAB, 3 AM', 2.4);
  },
};

// ---------- the props per room (Poly Haven CC0, the house models) ----------
const PROPS = {
  gallery: [['nyb_trash_dsny', 18.6, 6.8, { h: 0.9, r: 0.4 }], ['nyb_lobby_palm', 1.2, -0.2, { h: 2.0, r: 0.5 }], ['nyb_lobby_palm', 18.6, 0.4, { h: 2.0, r: 0.5 }], ['nyb_aframe_sign', 4.6, 6.4, { h: 0.9, ry: 0.5, r: 0.4 }]],
  dendur: [['Lantern_01', 2.4, 6.0, { h: 0.7, y: 0.0, r: 0.3 }], ['Lantern_01', 17.6, 6.0, { h: 0.7, r: 0.3 }], ['ceramic_vase_01', 1.2, -3.6, { h: 1.0, r: 0.4 }], ['ceramic_vase_03', 18.8, -3.6, { h: 1.0, r: 0.4 }], ['nyb_loft_urn', 4.6, 1.6, { h: 0.8, r: 0.3 }], ['nyb_loft_urn', 15.4, 1.6, { h: 0.8, r: 0.3 }]],
  court: [['Chandelier_01', 10, 2, { h: 1.2, y: 5.6 }], ['nyb_rink_planter', 0.9, -7.2, { len: 1.2, r: 0.6 }], ['nyb_bench_plaque', 18.2, -1.6, { len: 2.0, ry: -PI / 2, r: 0.9 }], ['nyb_aframe_sign', 12.0, 7.0, { h: 0.9, ry: -0.4, r: 0.4 }]],
  armor: [['nyb_scent_chandelier', 10, 1, { h: 1.4, y: 4.6 }], ['nyb_gangs_crate', 1.6, 6.6, { len: 0.9, r: 0.5 }], ['old_military_crate', 18.4, 6.6, { len: 1.0, ry: 0.4, r: 0.5 }], ['nyb_gangs_barrel', 18.5, 5.9, { h: 0.9, r: 0.4 }], ['nyb_lamp_banner', 2.2, -5.4, { h: 3.2, r: 0.3 }]],
  american: [['nyb_enchanted_chandelier', 10, -1, { h: 1.4, y: 4.7 }], ['nyb_bronx_lamp', 1.4, -5.3, { h: 1.6, r: 0.3 }], ['painted_wooden_cabinet', 18.8, -3.0, { h: 1.8, ry: -PI / 2, r: 0.6 }], ['nyb_loft_vase_b', 18.8, -3.0, { h: 0.4, y: 1.8 }], ['nyb_bench_plaque', 14.6, 1.4, { len: 2.0, r: 0.9 }]],
  shop: [['nyb_milkcrate_cyan', 18.4, 6.6, { len: 0.5, r: 0.4 }], ['cardboard_box_01', 1.4, 6.2, { len: 0.8, r: 0.5 }], ['nyb_trash_dsny', 18.8, 7.0, { h: 0.9, r: 0.4 }], ['nyb_aframe_sign', 8.2, 6.6, { h: 0.9, ry: 0.6, r: 0.4 }], ['nyb_rink_gift_a', 14.0, 4.6, { h: 0.4, y: 0.9 }], ['nyb_rink_gift_b', 15.2, 4.6, { h: 0.35, y: 0.9 }]],
  roof: [['street_lamp_01', 1.2, -5.2, { h: 3.6, y: 1.0, r: 0.3 }], ['street_lamp_01', 18.8, -5.2, { h: 3.6, y: 1.0, r: 0.3 }], ['nyb_milkcrate_pink', 18.6, 7.2, { len: 0.5, r: 0.3 }], ['nyb_trash_dsny', 1.2, 7.0, { h: 0.9, r: 0.4 }], ['nyb_hydrant_pink', 1.0, 1.4, { h: 0.8, r: 0.3 }]],
  lab: [['steel_frame_shelves_03', 1.0, -3.0, { h: 2.0, ry: PI / 2, r: 0.7 }], ['metal_office_desk', 18.4, 1.0, { len: 1.6, ry: -PI / 2, r: 0.8 }], ['nyb_sw_jerrycan', 16.4, -7.2, { h: 0.5, r: 0.3 }], ['nyb_sw_lamp', 1.0, -5.4, { h: 1.6, r: 0.3 }], ['nyb_mcmlow_bucket', 1.2, 1.2, { h: 0.4, r: 0.25 }], ['nyb_barrier', 4.4, -6.2, { len: 1.6, ry: 0.2, r: 0.8 }]],
};
const SLOTS = { shop: slotsWestFree, lab: slotsSouthOnly,
  // the court hangs three on the south wall west of the stair, three a side, two high over the balcony rail, one by the plate
  // arms and armor keeps the south wall's middle for the two niches: four south, three a side, two on the north wall
  armor: () => { const S = []; [2.2, 4.8, 15.2, 17.8].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 })); [-6.6, -4.2, -1.8].forEach((z) => { S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }); S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }); }); S.push({ x: 2.0, y: 3.6, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); S.push({ x: 18.0, y: 4.0, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); return S; },
  // the american wing gives the south wall's west end to the parlour: four south, three a side, two on the north wall
  american: () => { const S = []; [8.2, 10.8, 13.4, 16.0].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 })); [-6.6, -4.2, -1.8].forEach((z) => { S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }); S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }); }); S.push({ x: 2.0, y: 3.6, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); S.push({ x: 17.8, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); return S; },
  // the roof hangs four on the south wall over the hedge, four west, three east, one on the parapet wall by the deck
  roof: () => { const S = []; [4.8, 7.4, 10.0, 12.6].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 })); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1 + (z < -4 ? 1.0 : 0), z, ry: PI / 2, w: 1.4 })); [-4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); S.push({ x: 18.0, y: 3.4, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); return S; },
  court: () => { const S = []; for (let i = 0; i < 3; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8].forEach((z) => { S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }); S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }); }); [14.4, 17.6].forEach((x) => S.push({ x, y: 5.0, z: D / 2 - 0.14, ry: PI, w: 1.5 })); S.push({ x: 18.0, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); return S; },
  dendur: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 3.0 + i * 2.4, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.4 }); [-6.6, -4.2].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-6.6, -4.2].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; } };

let _ROOMS = null; const ROOMSref = () => _ROOMS;
export function buildRoom(c, r) {
  if (!_ROOMS) { _ROOMS = c.ROOMS; }
  // leaving a room: it may put back what it set (the lab's unwrap mode)
  if (!c._leaveHook) { c._leaveHook = true; let last = -1; c.tick((t, dt, P, ri) => { if (ri !== last) { const prev = _ROOMS[last]; prev && prev.onLeave && prev.onLeave(); last = ri; } }); }
  const dressing = (c2, r2, g, X) => {
    // every room gets its security camera, a fire extinguisher and a bench; the museum is a museum
    prop(c2, r2, g, X, 'nyb_seccam_counted', W - 0.7, -D / 2 + 0.7, { h: 0.4, y: 5.0, ry: PI * 0.75 });
    const led = new c2.THREE.Mesh(new c2.THREE.SphereGeometry(0.03, 8, 8), basic(c2, 0xff2020)); led.position.set(W - 0.84, 5.25, -D / 2 + 0.86); g.add(led); c2.tick((t) => { led.visible = Math.sin(t * 3) > 0; });
    if (r2.id !== 'roof') prop(c2, r2, g, X, 'nyb_extinguisher', 0.4, 6.6, { h: 0.65 });
  };
  shell(c, r, { SLOTS, PROPS, ROOM, dressing });
}
