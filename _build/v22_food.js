/* ================================================================
   v22 STREET FOOD (2026-11-21)
   Two food trucks parked on the ring road with menus in the house type: N3W HALAL (the grill smokes and
   sizzles) and N3W COFFEE (a blue Greek key cup). An ice cream truck circles the inner lane playing its own
   jingle; type ICECREAM and it pulls over for you. Whatever you buy appears in your hand for a while.
   ================================================================ */
const FOOD = { held: null, heldT: 0, items: {} };
window.__FOOD = FOOD;
function truckModel(body, menuLines, menuBg, awn) {
  const g = new THREE.Group(), bm = new THREE.MeshStandardMaterial({ color: body, roughness: 0.4, metalness: 0.2 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.3, metalness: 0.4 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 4.2), bm); box.position.set(0, 1.75, -0.6); g.add(box);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 1.6), bm); cab.position.set(0, 1.35, 2.3); g.add(cab);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.8), dark); ws.position.set(0, 1.75, 3.11); g.add(ws);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), new THREE.MeshBasicMaterial({ color: 0xfff2d0, toneMapped: false })); win.position.set(1.21, 1.95, -0.6); win.rotation.y = PI / 2; g.add(win);
  const menu = signTex(menuLines, 1024, 512, menuBg, '#FFFFFF'); const mm = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.1), new THREE.MeshBasicMaterial({ map: menu, toneMapped: false })); mm.position.set(1.215, 3.0 - 0.05, -0.6); mm.rotation.y = PI / 2; mm.scale.set(1, 0.72, 1); g.add(mm);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.4), new THREE.MeshBasicMaterial({ map: menu, toneMapped: false })); side.position.set(-1.215, 1.85, -0.6); side.rotation.y = -PI / 2; g.add(side);
  const aw = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 3.2), new THREE.MeshStandardMaterial({ color: awn, roughness: 0.7 })); aw.position.set(1.65, 2.62, -0.6); aw.rotation.z = -0.35; g.add(aw);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 2.6), new THREE.MeshStandardMaterial({ color: 0xc4cad1, metalness: 0.9, roughness: 0.3 })); counter.position.set(1.4, 1.42, -0.6); g.add(counter);
  const wg = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16); wg.rotateZ(PI / 2); [[-1.1, 2.2], [1.1, 2.2], [-1.1, -1.8], [1.1, -1.8]].forEach(([x, z]) => { const w = new THREE.Mesh(wg, dark); w.position.set(x, 0.45, z); g.add(w); });
  return g;
}
function parkAt(g, a, r) { const x = Math.cos(a) * r, z = Math.sin(a) * r; g.position.set(x, ground(x, z), z); g.rotation.y = -a + PI; if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 2.6, y0: -5, y1: 5, on: true }); return [x, z]; }
/* the held item: a small group drawn in front of the camera, lower right */
const HELD = new THREE.Group(); HELD.visible = false; scene.add(HELD);
function hold(kind, secs) { HELD.clear(); const it = FOOD.items[kind] && FOOD.items[kind](); if (it) HELD.add(it); HELD.visible = true; FOOD.heldT = secs || 45; FOOD.held = kind; }
FOOD.items.coffee = () => { const g = new THREE.Group(); const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d');
  if (c) { c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#1e4fa8'; c.fillRect(0, 0, 256, 18); c.fillRect(0, 110, 256, 18); for (let i = 0; i < 16; i++) { c.fillRect(i * 16, 22, 10, 4); c.fillRect(i * 16 + 6, 26, 4, 8); }
    c.font = '400 22px Anton,Impact,sans-serif'; c.textAlign = 'center'; c.fillText && c.fillText('WE ARE HAPPY TO SERVE GM', 128, 76); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 20, 1, true), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide })); g.add(cup);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.012, 20), new THREE.MeshStandardMaterial({ color: 0xf2f2ee })); lid.position.y = 0.065; g.add(lid); return g; };
FOOD.items.halal = () => { const g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.12), new THREE.MeshStandardMaterial({ color: 0xc9c9c4, metalness: 0.9, roughness: 0.3 })); g.add(box);
  const rice = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.1), new THREE.MeshStandardMaterial({ color: 0xe8b13a, roughness: 0.9 })); rice.position.y = 0.03; g.add(rice);
  const sauce = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.006, 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff })); sauce.position.y = 0.043; sauce.rotation.y = 0.5; g.add(sauce);
  const red = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.006, 0.015), new THREE.MeshStandardMaterial({ color: 0xc8241a })); red.position.set(0.01, 0.045, 0.02); red.rotation.y = -0.4; g.add(red); return g; };
FOOD.items.cone = () => { const g = new THREE.Group(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 14), new THREE.MeshStandardMaterial({ color: 0xc98a3c, roughness: 0.8 })); cone.rotation.x = PI; g.add(cone);
  const sw = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.1, 14), new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.5 })); sw.position.y = 0.11; g.add(sw);
  const sc = new THREE.Mesh(new THREE.SphereGeometry(0.043, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.5 })); sc.position.y = 0.07; g.add(sc);
  const sp = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshStandardMaterial({ color: 0x2962ff })); sp.position.set(0.02, 0.1, 0.03); g.add(sp); return g; };

(function trucks() {
  const halal = truckModel(0xd9d9d4, [{ t: 'N3W HALAL', s: 0.36 }, { t: 'CHICKEN OVER RICE · LAMB · FALAFEL', s: 0.1 }, { t: 'WHITE SAUCE · HOT SAUCE (CAREFUL)', s: 0.09, c: '#FF6B00' }], '#0D0D0D', 0xc8241a);
  scene.add(halal); const [hx, hz] = parkAt(halal, 1.9, 104.2); FOOD.halal = { x: hx, z: hz };
  const coffee = truckModel(0x1e4fa8, [{ t: 'N3W COFFEE', s: 0.36 }, { t: 'GM BLEND · LIGHT AND SWEET · ONE DOLLAR', s: 0.1 }, { t: 'NO OAT MILK, THIS IS A CART', s: 0.08 }], '#1e4fa8', 0xf2f2ee);
  scene.add(coffee); const [cx, cz] = parkAt(coffee, 2.02, 104.2); FOOD.coffee = { x: cx, z: cz };
  // grill smoke from the halal truck roof
  const N = 60, gg = new THREE.BufferGeometry(), pos = new Float32Array(N * 3).fill(-999); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(gg, new THREE.PointsMaterial({ size: 1.6, map: LIFE.soft, color: 0xd8d4cc, transparent: true, opacity: 0.45, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
  FOOD.smoke = { pts, pos, a: Array.from({ length: N }, (_, i) => ({ t: i / N * 3 })) };
  const buyHalal = secret('halal', () => { hold('halal', 60); toast('CHICKEN OVER RICE, WHITE SAUCE, A LITTLE HOT SAUCE. THE PIGEONS ARE WATCHING YOU NOW.'); try { LIFE.feed(P.x + 1.5, P.z + 1.5); } catch (e) { } beep(400, 0.2, 'sawtooth', 0.02); });
  const buyCoffee = secret('coffee', () => { hold('coffee', 60); toast('ONE COFFEE, LIGHT AND SWEET. +1 TDH FOR BEING AWAKE.'); state.tdh += 1; try { hud(); } catch (e) { } });
  const win = (x, z, a) => [x + Math.cos(a) * -1.6 - Math.sin(-a) * 0, z + Math.sin(a) * -1.6];
  const hw = win(hx, hz, 1.9), cw = win(cx, cz, 2.02);
  interact(hw[0], hw[1], 3.2, 'E · CHICKEN OVER RICE ($8, NO GAS)', buyHalal); interact(cw[0], cw[1], 3.2, 'E · COFFEE, LIGHT AND SWEET ($1)', buyCoffee);
})();

/* the ice cream truck */
const ICE = { a: 3.6, r: 97.6, sp: 6, stop: null, wait: 0, g: null }; window.__ICE = ICE;
(function iceTruck() {
  const g = truckModel(0xf7f4ee, [{ t: 'N3W SOFT SERVE', s: 0.3 }, { t: 'VANILLA · CHOCOLATE · EVIL EYE BLUE SPRINKLES', s: 0.09, c: '#2962FF' }], '#f7f4ee', 0x2962ff);
  const cone = new THREE.Group(); const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.0, 16), new THREE.MeshStandardMaterial({ color: 0xc98a3c })); c1.rotation.x = PI; cone.add(c1); const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf6efe2 })); c2.position.y = 0.55; cone.add(c2);
  const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xf6efe2 })); c3.position.y = 1.0; cone.add(c3); cone.position.set(0, 3.6, 2.0); g.add(cone); ICE.cone = cone;
  scene.add(g); ICE.g = g;
})();
const JINGLE = [[0, 784, 0.25], [0.25, 659, 0.25], [0.5, 784, 0.25], [0.75, 880, 0.5], [1.25, 784, 0.25], [1.5, 659, 0.5], [2, 587, 0.25], [2.25, 659, 0.25], [2.5, 698, 0.25], [2.75, 784, 0.75]];
function jingle(vol) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; const t0 = AC.currentTime + 0.05, b = 0.32; JINGLE.forEach(([s, f, d]) => { sNote(AC.destination, f, t0 + s * b, d * b * 0.9, 'square', 0.03 * vol, false); sNote(AC.destination, f * 2, t0 + s * b, d * b * 0.6, 'sine', 0.02 * vol, false); }); }
const iceHail = secret('icecream', () => { ICE.stop = Math.atan2(P.z, P.x) - 0.03; toast('THE ICE CREAM TRUCK HEARD YOU. IT IS COMING ROUND.'); }, ['icecream', 'softserve', 'icecreamtruck']);
const buyCone = secret('cone', () => { hold('cone', 50); toast('ONE SOFT SERVE WITH EVIL EYE BLUE SPRINKLES. IT IS ALREADY MELTING.'); });
interact(0, 0, 0, '', () => { }); const iceInter = INTER[INTER.length - 1];
function iceFrame(dt) {
  if (ICE.wait > 0) ICE.wait -= dt; else { let sp = ICE.sp; if (ICE.stop !== null) { let d = ICE.a - ICE.stop; d = ((d % (2 * PI)) + 2 * PI) % (2 * PI); if (d < 0.3) sp *= Math.max(0, d / 0.3 - 0.02); if (sp <= 0.01) { sp = 0; ICE.stop = null; ICE.wait = 25; jingle(1); } } ICE.a -= sp / ICE.r * dt; }
  const x = Math.cos(ICE.a) * ICE.r, z = Math.sin(ICE.a) * ICE.r; ICE.g.position.set(x, ground(x, z), z); ICE.g.rotation.y = -ICE.a + PI; ICE.cone.rotation.y += dt;
  const d = Math.hypot(P.x - x, P.z - z); ICE.jT = (ICE.jT || 0) - dt; if (ICE.jT <= 0 && d < 60) { ICE.jT = 9; jingle(Math.max(0.15, 1 - d / 60)); }
  iceInter.x = x; iceInter.z = z; iceInter.r = 4.5; iceInter.label = ICE.wait > 0 && d < 4.5 ? 'E · ONE SOFT SERVE' : ''; iceInter.fn = buyCone;
}
function foodFrame(dt) {
  const S = FOOD.smoke, h = FOOD.halal; S.a.forEach((p, i) => { p.t += dt; if (p.t > 3) p.t = 0; const k = p.t / 3; S.pos[i * 3] = h.x + Math.sin(i) * 0.4 + k * 1.2; S.pos[i * 3 + 1] = ground(h.x, h.z) + 3.2 + k * 3.5; S.pos[i * 3 + 2] = h.z + Math.cos(i) * 0.4 + k * 0.6; });
  S.pts.geometry.attributes.position.needsUpdate = true;
  if (HELD.visible) { FOOD.heldT -= dt; if (FOOD.heldT <= 0) { HELD.visible = false; FOOD.held = null; if (FOOD.held !== 'gone') toast('ALL GONE.'); return; }
    const f = new THREE.Vector3(), r = new THREE.Vector3(); camera.getWorldDirection(f); r.crossVectors(f, camera.up).normalize(); const u = new THREE.Vector3().crossVectors(r, f);
    HELD.position.copy(camera.position).addScaledVector(f, 0.45).addScaledVector(r, 0.19).addScaledVector(u, -0.16 + Math.sin(LIFE.t * 4) * 0.004); HELD.quaternion.copy(camera.quaternion); HELD.rotateX(0.25); }
}
window.__FRAMES.push(dt => { try { foodFrame(dt); iceFrame(dt); } catch (e) { if (!FOOD.err) { FOOD.err = e; console.warn('v22 food', e); } } });
