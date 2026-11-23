/* ================================================================
   v155 THE SHOE SHINE STAND (2026-11-23)
   A two seat shoe shine stand at (36, 54), eight to six on weekdays: a raised wooden throne with brass foot
   rests, the shiner on a low stool working a customer's shoes with a brush and then the snap of the rag, the
   customer behind a newspaper. Customers come and go. When a seat is free, E sits you up there for a shine.
   ================================================================ */
const SHINE = { X: 36, Z: 54, cust: 0, t: 0, you: false, yt: 0 };
window.__SHINE = SHINE;
(function shoeShine() {
  const X = SHINE.X, Z = SHINE.Z, g0 = ground(X, Z); SHINE.g0 = g0; const g = new THREE.Group(); g.position.set(X, g0, Z); scene.add(g); SHINE.g = g;
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.45, metalness: 0.1 }), red = new THREE.MeshStandardMaterial({ color: 0x7a1f2a, roughness: 0.6 }), brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.25, metalness: 1 });
  const B = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  B(2.2, 0.55, 1.2, wood, 0, 0.275, -0.3); [-0.55, 0.55].forEach(x => { B(0.75, 0.12, 0.6, red, x, 1.0, -0.45); B(0.75, 0.75, 0.1, red, x, 1.45, -0.75); B(0.08, 0.35, 0.6, wood, x - 0.38, 1.2, -0.45); B(0.08, 0.35, 0.6, wood, x + 0.38, 1.2, -0.45); B(0.7, 0.45, 0.5, wood, x, 0.78, -0.45); [-0.12, 0.12].forEach(dx => B(0.1, 0.05, 0.22, brass, x + dx, 0.7, 0.2)); });
  B(0.5, 0.35, 0.35, wood, 0.55, 0.18, 0.6); const kit = B(0.4, 0.22, 0.25, wood, -0.4, 0.11, 0.75);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'SHOE SHINE', s: 0.38, f: 'Georgia, serif' }, { t: 'ONE MEME · WHILE YOU WAIT', s: 0.15 }], 512, 150, '#7a1f2a', '#f2e6c8') })); sign.position.set(0, 2.05, -0.82); g.add(sign);
  const shiner = person(0x2a2f45, 0x15161a, SKIN[5], 'cabbie'); scene.remove(shiner.g); shiner.g.position.set(0.55, -0.35 - 0.4, 0.75); shiner.g.rotation.y = PI; shiner.legs.forEach(l => l.rotation.x = -1.4); g.add(shiner.g); SHINE.shiner = shiner;
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.5, 10), new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.9 })); apron.position.y = 1.2; shiner.g.add(apron);
  const cu = person(0x3a3a42, 0x2a2a2e, SKIN[3], 'wiseguy'); scene.remove(cu.g); cu.g.position.set(0.55, 1.06 - 0.86, -0.42); cu.legs.forEach(l => l.rotation.x = -1.1); g.add(cu.g); SHINE.cu = cu;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.42), new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.9, side: THREE.DoubleSide })); paper.position.set(0, 1.62, 0.32); paper.rotation.x = -0.25; cu.g.add(paper);
  boxWalls(X, Z - 0.3, 2.2, 1.2, 0, -5, g0 + 0.55); padRect(X - 1.1, X + 1.1, Z - 0.9, Z + 0.3, g0 + 0.55, g0 - 0.5);
  interact(X - 0.55, Z + 0.9, 1.4, 'E · GET A SHINE', () => shineSit());
  if (window.__MAP) MAP.places.push(['SHOE SHINE', X, Z, X, Z + 1.6]);
})();
const shineSecret = secret('shine', () => { toast('YOUR SHOES HAVE NEVER LOOKED LIKE THIS. HE SNAPS THE RAG ONE LAST TIME AND TAPS YOUR TOE. "YOU ARE GOOD."', 'blue'); });
function shineOpen() { const t = nycTime(TIME.utc); return t.wd >= 1 && t.wd <= 5 && t.hours >= 8 && t.hours < 18; }
function shineSit() { if (!shineOpen()) { toast('THE STAND IS CLOSED. BACK AT EIGHT ON A WEEKDAY.'); return; } if (SHINE.you) return; teleport(SHINE.X - 0.55, SHINE.Z - 0.42, PI, 2); P.y = SHINE.g0 + 0.55; window.__EYE = 0.78; SHINE.you = true; SHINE.yt = 0; toast('YOU CLIMB UP. HE DOES NOT ASK WHAT YOU WANT. HE KNOWS.'); }
function shineFrame(dt) {
  const open = shineOpen(); SHINE.shiner.g.visible = open; const d = Math.hypot(P.x - SHINE.X, P.z - SHINE.Z); SHINE.t += dt; const cyc = SHINE.t % 50, busy = open && cyc < 38; SHINE.cu.g.visible = busy; if (!open || d > 70) return;
  const work = (busy || SHINE.you); const sw = work ? Math.sin(SHINE.t * (SHINE.t % 8 < 5 ? 9 : 18)) : 0; SHINE.shiner.arms[0].rotation.x = -1.2 + sw * 0.4; SHINE.shiner.arms[1].rotation.x = -1.2 - sw * 0.4;
  SHINE.shiner.g.position.x = SHINE.you ? -0.55 : 0.55;
  if (work && d < 12 && Math.floor(SHINE.t * 2) !== SHINE.snap && SHINE.t % 8 > 5) { SHINE.snap = Math.floor(SHINE.t * 2); try { beep(2600, 0.02, 'square', 0.015); } catch (e) { } }
  if (SHINE.you) { SHINE.yt += dt; const moving = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || joy.x || joy.y; if (SHINE.yt > 12) { shineSecret(); } if ((moving && SHINE.yt > 1) || d > 2) { SHINE.you = false; window.__EYE = 1; } }
}
window.__FRAMES.push(dt => { try { shineFrame(dt); } catch (e) { if (!SHINE.err) { SHINE.err = e; console.warn('v155 shine', e); } } });
