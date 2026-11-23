/* ================================================================
   v80 THE LINE (2026-11-22)
   A shopfront at (-62, 80) with a black awning that says N3W DROP, a velvet rope, a bouncer with a clipboard, and a
   line of twelve people down the block for something nobody can quite name. Every so often the door opens and
   the line shuffles up one. E at the back joins it; stay close and you move up with everyone (faster than real
   life). When you reach the door it is sold out. The island counts that, because of course it does.
   ================================================================ */
const LINE = { q: [], you: -1, t: 0, step: 14 };
window.__LINE = LINE;
const LINE_AT = { x: -62, z: 80 };
(function theLine() {
  const x0 = LINE_AT.x, z0 = LINE_AT.z, g0 = ground(x0, z0); LINE.g0 = g0;
  const W = 7, D = 4, H = 4.4;
  const brick = new THREE.MeshStandardMaterial({ map: tex('assets/brick_c.webp', [2, 1.4]), roughness: 0.9, color: 0x6a5a55 });
  const shop = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), brick); shop.position.set(x0, g0 + H / 2, z0); shop.castShadow = true; scene.add(shop); boxWalls(x0, z0, W, D, 0, -5, g0 + H);
  const black = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.6 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.05, metalness: 0.5, emissive: 0xfff0d8, emissiveIntensity: 0.18 })); win.position.set(x0 + 1.2, g0 + 1.6, z0 - D / 2 - 0.01); win.rotation.y = PI; scene.add(win); LINE.win = win;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), black); door.position.set(x0 - 2.2, g0 + 1.15, z0 - D / 2 - 0.01); door.rotation.y = PI; scene.add(door); LINE.door = door;
  const aw = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, 1.3), black); aw.position.set(x0, g0 + 2.9, z0 - D / 2 - 0.65); aw.rotation.x = -0.18; scene.add(aw);
  const sg = signTex([{ t: 'N3W DROP', s: 0.5 }], 1024, 160, '#0D0D0D', '#efe8da'); const sm = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.56), new THREE.MeshBasicMaterial({ map: sg, toneMapped: false })); sm.position.set(x0, g0 + 3.15, z0 - D / 2 - 1.32); sm.rotation.y = PI; scene.add(sm);
  const ws = signTex([{ t: 'SOON', s: 0.6 }], 512, 256, null, '#efe8da'); const wl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: ws, transparent: true, toneMapped: false })); wl.position.set(x0 + 1.2, g0 + 1.7, z0 - D / 2 - 0.02); wl.rotation.y = PI; scene.add(wl);
  // the rope: brass posts and red velvet, running west along the shop front
  const brass = new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 }), velvet = new THREE.MeshStandardMaterial({ color: 0x7a1f2a, roughness: 0.9 });
  for (let i = 0; i < 6; i++) { const x = x0 - 2.9 - i * 1.6, z = z0 - D / 2 - 1.6; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8), brass); p.position.set(x, ground(x, z) + 0.48, z); scene.add(p);
    if (i < 5) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.025, 6, 16, PI), velvet); r.position.set(x - 0.8, ground(x, z) + 0.88, z); r.rotation.z = PI; r.scale.set(1, 0.25, 1); scene.add(r); } }
  // the slots: along the shop front, then round the corner of the rope
  LINE.slots = []; for (let i = 0; i < 16; i++) { const x = x0 - 2.6 - i * 0.85, z = z0 - D / 2 - 0.85; LINE.slots.push([x, z]); }
  const bouncer = person(0x0d0d0d, 0x0d0d0d, SKIN[0], 'wiseguy'); bouncer.g.position.set(x0 - 1.4, g0 - 0.35, z0 - D / 2 - 0.9); bouncer.g.rotation.y = -PI / 2;
  const shirts = [0x2962FF, 0xe2581c, 0x2f4a33, 0xefe8da, 0x7a1f2a, 0x15161a, 0x5a1712, 0x3b4a5c, 0xb06a1c, 0x2a2d33, 0xff3fa4, 0x1f4f7a];
  for (let i = 0; i < 12; i++) { const p = person(shirts[i], 0x2a2f45, SKIN[i % SKIN.length]); LINE.q.push({ P: p, slot: i, x: LINE.slots[i][0], z: LINE.slots[i][1], ph: Math.random() * 6 }); }
  interact(LINE.slots[12][0] - 0.6, LINE.slots[12][1], 1.8, 'E · JOIN THE LINE', () => lineJoin());
  if (window.__MAP) MAP.places.push(['THE LINE', x0, z0, LINE.slots[13][0], LINE.slots[13][1] - 1]);
})();
const lineSecret = secret('theline', () => { toast('YOU REACH THE DOOR. THE BOUNCER LOOKS AT HIS CLIPBOARD. SOLD OUT. HE SAYS NEXT DROP IS SOON. THE WINDOW SAYS SOON.', 'blue'); });
function lineJoin() { if (LINE.you >= 0) { toast('YOU ARE ALREADY IN THE LINE. DO NOT LOSE YOUR PLACE.'); return; } LINE.you = LINE.q.length; const [x, z] = LINE.slots[Math.min(LINE.you, 15)]; teleport(x, z, -PI / 2); LINE.t = LINE.step - 2; toast('YOU ARE NUMBER ' + (LINE.you + 1) + ' IN LINE. NOBODY KNOWS WHAT FOR.'); }
function lineFrame(dt) {
  const d = Math.hypot(P.x - LINE_AT.x, P.z - LINE_AT.z); if (d > 100) return;
  LINE.t += dt; const fast = LINE.you >= 0 ? 4 : LINE.step;
  if (LINE.t > fast) { LINE.t = 0; LINE.doorT = 1.2; const front = LINE.q.shift(); if (front) { front.slot = 11; LINE.q.push(front); const [x, z] = LINE.slots[11]; front.x = x - 6; front.z = z; }   // the front one goes in and comes back round to the end, nobody notices
    LINE.q.forEach((p, i) => { p.slot = i; });
    if (LINE.you >= 0) { LINE.you--; if (LINE.you < 0) { lineSecret(); LINE.you = -1; } else { const [x, z] = LINE.slots[Math.min(LINE.you, 15)]; LINE.goal = [x, z]; } } }
  LINE.doorT = Math.max(0, (LINE.doorT || 0) - dt); LINE.door.material.color.setHex(LINE.doorT > 0 ? 0xffe9c0 : 0x0d0d0d); const night = Math.min(1, (L.lamps || 0) * 1.4); LINE.win.material.emissiveIntensity = 0.18 + night * 0.7;
  LINE.q.forEach((p, i) => { const s = LINE.you >= 0 && i >= LINE.you ? i + 1 : i; const [tx, tz] = LINE.slots[Math.min(s, 15)]; p.x += (tx - p.x) * Math.min(1, dt * 1.5); p.z += (tz - p.z) * Math.min(1, dt * 1.5);
    p.P.g.position.set(p.x, ground(p.x, p.z) - 0.35, p.z); p.P.g.rotation.y = PI / 2 + Math.sin(LIFE.t * 0.3 + p.ph) * 0.4; });
  // you, moving up when the line does; walk off and you lose your place
  if (LINE.you >= 0) { const [gx, gz] = LINE.slots[Math.min(LINE.you, 15)]; const off = Math.hypot(P.x - gx, P.z - gz); if (off > 4) { LINE.you = -1; toast('YOU LEFT THE LINE. SOMEONE TOOK YOUR PLACE IMMEDIATELY.'); } else if (LINE.goal) { P.x += (gx - P.x) * Math.min(1, dt * 2); P.z += (gz - P.z) * Math.min(1, dt * 2); if (off < 0.05) LINE.goal = null; } }
}
window.__FRAMES.push(dt => { try { lineFrame(dt); } catch (e) { if (!LINE.err) { LINE.err = e; console.warn('v80 line', e); } } });
