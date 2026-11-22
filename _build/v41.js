/* ================================================================
   v41 THE BACK ROOM (2026-11-22)
   Behind the milk in the bodega cooler there is a door. E at the middle cooler door: a voice asks for the password.
   Type the word a fren would say (FREN) while you stand there and the cooler swings open onto a stair down to a
   speakeasy under the bodega: a red neon N3W over a zinc bar, a back bar of lit bottles, a bartender, two velvet
   booths, a jukebox that plays harbour jazz while you are down here, and a private wall of the fifty newest Memes
   in gold frames. The door at the top of the stair takes you back up. The room is underground (floor 9 m down), so
   nothing of it shows on the island.
   ================================================================ */
const BACK = { inside: false, cx: 17, cz: 66, fy: -9 };
window.__BACK = BACK;
(function room() {
  const { cx, cz, fy } = BACK, W = 12, D = 10, H = 3.8;
  const wallM = new THREE.MeshStandardMaterial({ color: 0x14070a, roughness: 0.9 }), wood = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.55 }), zinc = new THREE.MeshStandardMaterial({ color: 0xa9adb2, metalness: 0.9, roughness: 0.25 });
  const floorCv = document.createElement('canvas'); floorCv.width = floorCv.height = 256; const fc = floorCv.getContext('2d'); if (fc) for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { fc.fillStyle = (i + j) % 2 ? '#0c0a0a' : '#5e574c'; fc.fillRect(i * 16, j * 16, 16, 16); }
  const ft = new THREE.CanvasTexture(floorCv); ft.encoding = THREE.sRGBEncoding; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(3, 2.5);
  const g = new THREE.Group(); scene.add(g); BACK.g = g;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.35 })); fl.rotation.x = -PI / 2; fl.position.set(cx, fy, cz); g.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0x120a0a, roughness: 0.9 })); ce.rotation.x = PI / 2; ce.position.set(cx, fy + H, cz); g.add(ce);
  [[cx, cz - D / 2, 0], [cx, cz + D / 2, PI], [cx - W / 2, cz, PI / 2], [cx + W / 2, cz, -PI / 2]].forEach(([x, z, ry], i) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(i < 2 ? W : D, H), wallM); w.position.set(x, fy + H / 2, z); w.rotation.y = ry; g.add(w); });
  const wainscot = new THREE.MeshStandardMaterial({ color: 0x120a06, roughness: 0.5 }); [[cx, cz - D / 2 + 0.03, 0, W], [cx, cz + D / 2 - 0.03, PI, W], [cx - W / 2 + 0.03, cz, PI / 2, D], [cx + W / 2 - 0.03, cz, -PI / 2, D]].forEach(([x, z, ry, L]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.0), wainscot); p.position.set(x, fy + 0.5, z); p.rotation.y = ry; g.add(p); });
  padRect(cx - W / 2, cx + W / 2, cz - D / 2, cz + D / 2, fy, fy - 1);
  const Y0 = fy - 1, Y1 = fy + H; wall(cx - W / 2, cz - D / 2, cx + W / 2, cz - D / 2, Y0, Y1); wall(cx - W / 2, cz + D / 2, cx + W / 2, cz + D / 2, Y0, Y1); wall(cx - W / 2, cz - D / 2, cx - W / 2, cz + D / 2, Y0, Y1); wall(cx + W / 2, cz - D / 2, cx + W / 2, cz + D / 2, Y0, Y1);
  // the bar along the east wall
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.08, 6.5), wood); bar.position.set(cx + 3.6, fy + 0.54, cz); g.add(bar); const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 6.7), zinc); top.position.set(cx + 3.6, fy + 1.1, cz); g.add(top);
  wall(cx + 3.1, cz - 3.25, cx + 3.1, cz + 3.25, Y0, Y1);
  const shelf = new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.5, emissive: 0xffa060, emissiveIntensity: 0.25 }); [1.35, 1.85, 2.35].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 6.4), shelf); s.position.set(cx + W / 2 - 0.2, fy + y, cz); g.add(s); });
  const bcols = [0x2a6b3a, 0x8a5a1a, 0xdedede, 0x6b1a2a, 0x2a3a8a, 0xc8a23a];
  const bottle = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 8), new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x331a08, emissiveIntensity: 0.6 }), 96); const m = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < 96; i++) { const row = i % 3, k = Math.floor(i / 3); m.makeTranslation(cx + W / 2 - 0.2, fy + [1.53, 2.03, 2.53][row], cz - 3.1 + k * 0.2); bottle.setMatrixAt(i, m); bottle.setColorAt(i, col.set(bcols[i % bcols.length])); } g.add(bottle);
  for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), new THREE.MeshStandardMaterial({ color: 0x8a1a1a, roughness: 0.6 })); st.position.set(cx + 2.7, fy + 0.78, cz - 2.6 + i * 1.05); g.add(st); const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), zinc); leg.position.set(cx + 2.7, fy + 0.38, cz - 2.6 + i * 1.05); g.add(leg); }
  const keep = person(0xf2f2ee, 0x111111, SKIN[2], 'wiseguy'); keep.g.position.set(cx + 4.5, fy, cz + 0.5); keep.g.rotation.y = -PI / 2; BACK.keep = keep;
  // booths on the west wall
  const velvet = new THREE.MeshStandardMaterial({ color: 0x5a0f18, roughness: 0.9 });
  [-2.3, 2.3].forEach(dz => { const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 2.0), velvet); seat.position.set(cx - W / 2 + 0.7, fy + 0.25, cz + dz); g.add(seat); const back = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 2.0), velvet); back.position.set(cx - W / 2 + 0.2, fy + 0.6, cz + dz); g.add(back);
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), wood); tb.position.set(cx - W / 2 + 1.9, fy + 0.75, cz + dz); g.add(tb); const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false })); cand.position.set(cx - W / 2 + 1.9, fy + 0.84, cz + dz); g.add(cand);
    post(cx - W / 2 + 0.7, cz + dz, 0.7, Y0, Y1); post(cx - W / 2 + 1.9, cz + dz, 0.5, Y0, Y1); });
  // neon over the bar, the jukebox, the private wall
  try { const n = neonSign('N3W', cx + W / 2 - 0.05, fy + 3.1, cz, -PI / 2, 2.4, 0.9, '#ff2a3a', 'n3w'); n.base = 1.4; BACK.neon = n; } catch (e) { }
  const jb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x6b1a0a, roughness: 0.4, emissive: 0xff7a2a, emissiveIntensity: 0.35 })); jb.position.set(cx - 3, fy + 0.8, cz + D / 2 - 0.4); g.add(jb); BACK.jb = jb; post(cx - 3, cz + D / 2 - 0.4, 0.6, Y0, Y1);
  const gold = MAT.gold || new THREE.MeshStandardMaterial({ color: 0xc9a23a, metalness: 0.9, roughness: 0.3 }); const F = (window.__FRESH || []).slice(-15);
  F.forEach((c, i) => { const col2 = i % 5, row = Math.floor(i / 5), x = cx - 4 + col2 * 1.5, y = fy + 2.6 - row * 0.85; const fr = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.78, 0.05), gold); fr.position.set(x, y, cz - D / 2 + 0.06); g.add(fr);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false })); try { setPlaneUV(pm, 'meme', c.n); const a = c.uv[5], h = Math.min(0.68, 0.8 / a); pm.scale.set(h * a, h, 1); } catch (e) { } pm.position.set(x, y, cz - D / 2 + 0.09); pm.userData.card = c.n; g.add(pm); PICK_EXTRA.push(pm); });
  const pl = signTex([{ t: 'THE PRIVATE COLLECTION', s: 0.4 }, { t: 'THE NEWEST MEMES · MEMBERS ONLY · NO PHOTOS (PHOTOS ALLOWED)', s: 0.12 }], 1024, 200, '#0D0D0D', '#c9a23a'); const pp = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.66), new THREE.MeshBasicMaterial({ map: pl, toneMapped: false })); pp.position.set(cx, fy + 3.4, cz - D / 2 + 0.08); g.add(pp);
  // the stair and the door back up (south west corner)
  for (let k = 0; k < 8; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), wood); s.position.set(cx - W / 2 + 0.9, fy + 0.3 + k * 0.42, cz + D / 2 - 0.5 - k * 0.42 * 0); s.position.z = cz + D / 2 - 0.35; s.visible = k < 3; g.add(s); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.6, roughness: 0.3 })); door.position.set(cx - W / 2 + 0.03, fy + 1.1, cz + D / 2 - 1.2); door.rotation.y = PI / 2; g.add(door);
  wallM.emissive = new THREE.Color(0x2a0608); wallM.emissiveIntensity = 0.25; wood.emissive = new THREE.Color(0x1a0c04); wood.emissiveIntensity = 0.2; wood.color.set(0x24140c);
  [[cx - W / 2 + 1.9, fy + 1.0, cz - 2.3, 1.6], [cx - W / 2 + 1.9, fy + 1.0, cz + 2.3, 1.6], [cx + W / 2 - 0.4, fy + 2.0, cz, 5.5], [cx + W / 2 - 0.4, fy + 3.1, cz, 3.2]].forEach(([x, y, z, sc]) => { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: LIFE.soft, color: 0xff8a40, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); h.position.set(x, y, z); h.scale.set(sc, sc * 0.6, 1); g.add(h); });   // no new scene lights (each one costs every material a pass)
  g.visible = false;
})();
window.__UNDER = (x, z, y) => (y < BACK.fy + 3 && Math.abs(x - BACK.cx) <= 6 && Math.abs(z - BACK.cz) <= 5) ? { f: BACK.fy, block: false } : null;
const backSecret = secret('speakeasy', () => { });
function backEnter() {
  BACK.inside = true; BACK.g.visible = true; backSecret(); flash('#2a0a0a'); teleport(BACK.cx - 4.6, BACK.cz + 3.4, PI * 0.75, BACK.fy + 1); toast('THE COOLER SWINGS OPEN. DOWN THE STAIRS, A ROOM UNDER THE BODEGA. THE BARTENDER NODS. HE HAS BEEN EXPECTING A FREN.', 'blue');
  BACK.prevRadio = window.__RADIO ? __RADIO.st : 0; if (window.__RADIO) { __RADIO.st = 2; __RADIO.next = 0; }
}
function backLeave() { BACK.inside = false; flash('#ffffff'); teleport(14.5, 66, -PI / 2); BACK.g.visible = false; if (window.__RADIO) { __RADIO.st = BACK.prevRadio || 0; __RADIO.next = 0; } toast('BACK IN THE BODEGA. THE CAT SAW NOTHING.'); }
interact(20.6, 66, 1.6, 'E · KNOCK ON THE MIDDLE COOLER DOOR', () => { BACK.asked = 30; toast('A VOICE FROM BEHIND THE MILK: PASSWORD? (TYPE THE WORD A FREN WOULD SAY)'); beep(120, 0.1, 'square', 0.05); beep(120, 0.1, 'square', 0.05, 0.25); });
EGGS.fren = () => { if (BACK.asked > 0 && Math.hypot(P.x - 20.6, P.z - 66) < 3) backEnter(); else toast('FREN. (SOMEWHERE A COOLER DOOR WOULD HAVE OPENED FOR THAT.)'); }; EGGS.fren.__s = true; EGGS.frens = EGGS.fren;
interact(BACK.cx - 5.4, BACK.cz + 3.8, 1.8, '', () => { }); const backDoor = INTER[INTER.length - 1];
interact(BACK.cx - 3, BACK.cz + 4, 1.6, '', () => { }); const juke = INTER[INTER.length - 1];
interact(BACK.cx + 2.4, BACK.cz, 1.6, '', () => { }); const barI = INTER[INTER.length - 1];
window.__FRAMES.push(dt => { try {
  if (BACK.asked > 0) BACK.asked -= dt;
  backDoor.label = BACK.inside ? 'E · UP THE STAIRS TO THE BODEGA' : ''; backDoor.fn = BACK.inside ? backLeave : () => { };
  juke.label = BACK.inside ? 'E · PICK A RECORD ON THE JUKEBOX' : ''; juke.fn = () => { if (window.__RADIO) { radioNext(); if (__RADIO.st === 0) radioNext(); } };
  barI.label = BACK.inside ? 'E · ORDER WHAT THE BARTENDER RECOMMENDS' : ''; barI.fn = () => { const d = ['AN OLD FASHIONED, BUT THE ORANGE IS A JPEG.', 'A NEGRONI. HE SAYS THE CAMPARI IS ON CHAIN.', 'THE HOUSE SPECIAL: GM AND TONIC.', 'SELTZER WITH LIME. HE RESPECTS IT.'][(Math.random() * 4) | 0]; toast(d); };
  if (BACK.inside) { if (P.y > BACK.fy + 3) BACK.inside = false; BACK.jb.material.emissiveIntensity = 0.3 + 0.15 * Math.sin(LIFE.t * 6); if (BACK.keep) BACK.keep.g.rotation.y = -PI / 2 + Math.sin(LIFE.t * 0.5) * 0.4; }
  if (!BACK.inside && BACK.g.visible && P.y > BACK.fy + 3) { BACK.g.visible = false; }
} catch (e) { if (!BACK.err) { BACK.err = e; console.warn('v41 back room', e); } } });
