/* ================================================================
   v14 SECRETS (2026-11-21)
   THE GOLDEN SLICE HUNT: nine golden slices hidden round the island (the top of the Floor, the bodega, the
   lighthouse roof, the 2030 pathway, the wheel, Summer.jpg, BUIDL, behind the Great Wave, the toll). Find all
   nine and the harbour goes off in N3W blue and white and a golden plaque rises on the Floor. Progress is kept.
   Also: X marks the spot on GM Beach (stand on it for 4.2 seconds), messages in bottles at the waterline, a
   banner plane towing N3W YORKERS · BY MLOW, the ghost ship at 3 a.m. New York time, and HELP for hints.
   ================================================================ */
const HUNT = { slices: [], got: new Set(), done: false };
window.__HUNT = HUNT;
try { (JSON.parse(localStorage.getItem('meme-island-slices') || '[]') || []).forEach(i => HUNT.got.add(i)); } catch (e) { }
(function slices() {
  const goldM = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 1, roughness: 0.22, emissive: 0x6a4300, emissiveIntensity: 0.6 });
  const crustM = new THREE.MeshStandardMaterial({ color: 0xd9962a, metalness: 1, roughness: 0.3, emissive: 0x4a2a00, emissiveIntensity: 0.5 });
  const sh = new THREE.Shape(); sh.moveTo(0, -0.42); sh.lineTo(-0.3, 0.32); sh.quadraticCurveTo(0, 0.42, 0.3, 0.32); sh.lineTo(0, -0.42);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); geo.center();
  const crust = new THREE.CylinderGeometry(0.06, 0.06, 0.62, 10); crust.rotateZ(PI / 2);
  const bx = (CAT && CAT.x !== undefined) ? CAT.x - 1.6 : 14, bz = (CAT && CAT.z !== undefined) ? CAT.z + 4.6 : 66;
  const lh = (typeof LH !== 'undefined' && LH) ? LH : { x: 0, z: -126 };
  const wc = (typeof wheel !== 'undefined' && wheel) ? [wheel.cx, wheel.cz] : [40, -40];
  const spots = [
    ['THE TOP OF THE FLOOR', 0, 0, 60], ['THE 6529 BODEGA', bx + 0.5, bz + 1.5, 3], ['THE LIGHTHOUSE ROOF', lh.x + 3.5, lh.z, 120],
    ['THE 2030 PATHWAY', 0, 214, 3], ['UNDER THE WAGMI WHEEL', wc[0] + 4, wc[1] + 6, 3], ['SUMMER.JPG', -48, 40, 3],
    ['BUIDL', -44, -48, 3], ['BEHIND THE GREAT WAVE', -18, 140, 3], ['THE ZERO GAS TOLL', 4.5, 96, 3]];
  spots.forEach(([name, x, z, cy], i) => {
    const f = floorAt(x, z, cy); let y = f.f; if (y === null || f.block) y = Math.max(ground(x, z), 0.6);
    const g = new THREE.Group(); const s = new THREE.Mesh(geo, goldM); g.add(s); const c = new THREE.Mesh(crust, crustM); c.position.set(0, 0.36, 0); g.add(c);
    [[-0.08, -0.05], [0.1, 0.06], [-0.02, 0.18], [0.04, -0.2]].forEach(([px, py]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 10), crustM); p.rotation.x = PI / 2; p.position.set(px, py, 0.05); g.add(p); });
    g.position.set(x, y + 1.0, z); scene.add(g);
    const l = practical(x, y + 1.6, z, 0xffc23a, 2.5, 5); l.userData.alwaysOn = 0.6;
    const got = HUNT.got.has(i); g.visible = !got; l.visible = !got;
    HUNT.slices.push({ i, name, g, l, x, y: y + 1.0, z, got });
  });
})();
const huntFound = secret('slice', () => { });
function huntFrame(dt) {
  HUNT.slices.forEach(s => {
    if (s.got) return; s.g.rotation.y += dt * 1.6; s.g.position.y = s.y + Math.sin(LIFE.t * 2 + s.i) * 0.12;
    if (Math.hypot(P.x - s.x, P.z - s.z) < 1.5 && Math.abs(P.y + 1 - s.y) < 2.4) {
      s.got = true; s.g.visible = false; s.l.visible = false; HUNT.got.add(s.i); huntFound();
      try { localStorage.setItem('meme-island-slices', JSON.stringify([...HUNT.got])); } catch (e) { }
      flash('#ffc83a'); [660, 880, 1320].forEach((f, k) => beep(f, 0.12, 'triangle', 0.06, k * 0.08));
      const n = HUNT.got.size; toast(n < 9 ? `GOLDEN SLICE ${n} OF 9 · ${s.name}` : 'ALL NINE GOLDEN SLICES. LOOK AT THE HARBOUR.', 'blue');
      if (n >= 9) huntFinale();
    }
  });
  if (HUNT.plaque) HUNT.plaque.rotation.y += dt * 0.3;
}
function huntFinale() {
  if (HUNT.done) return; HUNT.done = true;
  if (typeof FW !== 'undefined') FW.show = Math.max(FW.show, 14);
  setTimeout(() => toast('THE SLICE KING OF MEME ISLAND. THE FLOOR HAS BEEN INFORMED.', 'blue'), 2500);
  const f = floorAt(0, 0, 60).f || 8; const t = signTex([{ t: 'SLICE KING', s: 0.34 }, { t: 'ALL NINE GOLDEN SLICES FOUND ON MEME ISLAND', s: 0.08 }, { t: 'N3W YORKERS by MLow', s: 0.07, c: '#2962FF' }], 1024, 512, '#ffc83a', '#0D0D0D');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false })); m.position.set(0, f + 3.6, 0); scene.add(m); HUNT.plaque = m;
}
if (HUNT.got.size >= 9) setTimeout(() => { HUNT.done = false; huntFinale(); }, 4000);
secret('slices', () => { const left = HUNT.slices.filter(s => !s.got); toast(left.length ? `${9 - left.length} OF 9 GOLDEN SLICES. ONE IS AT ${left[(Math.random() * left.length) | 0].name}.` : 'ALL NINE FOUND. YOU ARE THE SLICE KING.', 'blue'); }, ['slices', 'golden', 'goldenslice']);

/* ---------- X marks the spot on GM Beach ---------- */
const XSPOT = { x: -14, z: 122, t: 0, open: false };
(function xspot() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  if (c && c.beginPath) { c.strokeStyle = 'rgba(120,40,20,0.85)'; c.lineCap = 'round'; c.lineWidth = 16; c.beginPath(); c.moveTo(20, 20); c.lineTo(108, 108); c.moveTo(108, 20); c.lineTo(20, 108); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); const g0 = ground(XSPOT.x, XSPOT.z);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1 }));
  m.rotation.x = -PI / 2; m.position.set(XSPOT.x, g0 + 0.03, XSPOT.z); scene.add(m);
  const chest = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x6b3f1e, roughness: 0.8 }), band = MAT.gold || new THREE.MeshStandardMaterial({ color: 0xc9a23a, metalness: 0.9, roughness: 0.3 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7), wood); b.position.y = 0.3; chest.add(b);
  const lid = new THREE.Group(); const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 14, 1, false, 0, PI), wood); lm.rotation.z = PI / 2; lid.add(lm); lid.position.set(0, 0.6, -0.35); lm.position.z = 0.35; chest.add(lid);
  [-0.4, 0.4].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.72), band); s.position.set(x, 0.31, 0); chest.add(s); });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.55), new THREE.MeshBasicMaterial({ color: 0xffd76a, toneMapped: false })); glow.rotation.x = -PI / 2; glow.position.y = 0.61; chest.add(glow);
  chest.position.set(XSPOT.x, g0 - 1.2, XSPOT.z); chest.visible = false; scene.add(chest); XSPOT.chest = chest; XSPOT.lid = lid; XSPOT.g0 = g0;
})();
const treasure = secret('xspot', () => {
  const lines = ['THE TREASURE IS A RECEIPT THAT SAYS YOU TOUCHED GRASS. IT IS NOT A TOKEN. IT IS A RECEIPT.', 'THE TREASURE IS THE FRIENDS YOU MADE ON THE ISLAND. ALSO 500 TDH.', 'INSIDE THE CHEST: A FLOOR PRICE FROM 2022, KEPT AS A WARNING.'];
  toast(lines[(Math.random() * lines.length) | 0]); state.tdh += 500; try { hud(); } catch (e) { } flash('#ffd76a'); [523, 659, 784, 1046].forEach((f, k) => beep(f, 0.2, 'triangle', 0.06, k * 0.12));
});
function xFrame(dt) {
  const on = Math.hypot(P.x - XSPOT.x, P.z - XSPOT.z) < 0.8 && P.ground;
  if (!XSPOT.open) { if (on) { XSPOT.t += dt; if (XSPOT.t > 1 && XSPOT.t - dt <= 1) toast('SOMETHING IS UNDER THE X. HOLD STILL.'); if (XSPOT.t > 4.2) { XSPOT.open = 1; XSPOT.chest.visible = true; XSPOT.rise = 0; } } else XSPOT.t = 0; }
  else if (XSPOT.rise < 1) { XSPOT.rise = Math.min(1, XSPOT.rise + dt * 0.5); XSPOT.chest.position.set(XSPOT.x + 1.4, XSPOT.g0 - 1.2 + XSPOT.rise * 1.2, XSPOT.z); XSPOT.lid.rotation.x = -Math.max(0, XSPOT.rise - 0.6) * 2.4; if (XSPOT.rise >= 1) treasure(); }
}

/* ---------- messages in bottles at the waterline ---------- */
(function bottles() {
  const msgs = ['IF YOU ARE READING THIS, YOU ARE EARLY. — A SAILOR, 2021', 'THE COLOSSUS BLINKED. I SAW IT. NOBODY BELIEVES ME.', 'DEAR FINDER: THE BODEGA CAT RUNS THIS ISLAND. ACT ACCORDINGLY.', 'I SOLD AT THE BOTTOM AND THREW MY BAG IN THE SEA. THIS IS THE BAG.', 'TYPE A WORD A NEW YORKER WOULD SAY AND SEE WHAT HAPPENS.', 'THERE ARE NINE GOLDEN SLICES. I FOUND FOUR. MY KNEES GAVE OUT.'].map(t => t.replace(/ — /g, ', '));
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x5fae6e, roughness: 0.1, metalness: 0, transmission: 0.6, transparent: true, opacity: 0.85 }), cork = new THREE.MeshStandardMaterial({ color: 0xa57a4a, roughness: 0.9 });
  const prof = [[0.0, 0], [0.12, 0.02], [0.13, 0.3], [0.06, 0.42], [0.045, 0.55], [0.0, 0.56]].map(([r, y]) => new THREE.Vector2(r, y)); const bg = new THREE.LatheGeometry(prof, 14);
  HUNT.bottles = [];
  [[24, 106.5], [-62, 84], [70, -70]].forEach(([x0, z0], i) => {
    const a = Math.atan2(z0, x0); let r = 100; while (r < 140 && ground(Math.cos(a) * r, Math.sin(a) * r) > -0.12) r += 0.25; r += 1.2; const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const g = new THREE.Group(); const b = new THREE.Mesh(bg, glass); b.rotation.z = PI / 2 - 0.2; g.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.08, 8), cork); c.rotation.z = PI / 2 - 0.2; c.position.set(-0.58, 0.12, 0); g.add(c);
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 8), new THREE.MeshStandardMaterial({ color: 0xf2e6c8 })); paper.rotation.z = PI / 2 - 0.2; paper.position.set(-0.2, 0.05, 0); g.add(paper);
    g.position.set(x, 0.05, z); g.rotation.y = a; scene.add(g); HUNT.bottles.push({ g, a, ph: i * 2 });
    const read = secret('bottle' + i, () => { toast('A MESSAGE IN A BOTTLE: "' + msgs[(i * 2 + Math.floor(Math.random() * 2)) % msgs.length] + '"'); beep(1500, 0.05, 'sine', 0.04); });
    interact(Math.cos(a) * (r - 2.6), Math.sin(a) * (r - 2.6), 4.5, 'E · OPEN THE BOTTLE ON THE WATERLINE', read);
  });
})();

/* ---------- a banner plane along the beach ---------- */
const BANNER = { g: null };
(function bannerPlane() {
  const g = new THREE.Group(), w = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 }), red = new THREE.MeshStandardMaterial({ color: 0xc8312a, roughness: 0.5 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 4.2, 10), w); fus.rotation.z = PI / 2; g.add(fus);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 6.4), red); wing.position.set(0.3, 0.38, 0); g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 2), red); tail.position.set(-1.9, 0.1, 0); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.06), red); fin.position.set(-1.9, 0.45, 0); g.add(fin);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.12), new THREE.MeshStandardMaterial({ color: 0x222222 })); prop.position.x = 2.15; g.add(prop); BANNER.prop = prop;
  const t = signTex([{ t: 'N3W YORKERS · BY MLOW', s: 0.62 }], 2048, 256, '#FFFFFF', '#0D0D0D');
  const bgeo = new THREE.PlaneGeometry(22, 2.75, 24, 1); const ban = new THREE.Mesh(bgeo, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 }));
  ban.position.set(-15.5, -0.6, 0); g.add(ban); BANNER.ban = ban; BANNER.base = bgeo.attributes.position.array.slice();
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.6, 4), new THREE.MeshBasicMaterial({ color: 0x333333 })); rope.rotation.z = PI / 2; rope.position.set(-3.8, -0.3, 0); g.add(rope);
  scene.add(g); BANNER.g = g;
})();
function bannerFrame(dt) {
  const per = 95, k = (LIFE.t % per) / per, a = -PI * 0.15 + k * PI * 2; const r = 135;
  BANNER.g.position.set(Math.cos(a) * r, 26 + Math.sin(LIFE.t * 0.5) * 1.2, Math.sin(a) * r); BANNER.g.rotation.set(0, -a - PI / 2, Math.sin(LIFE.t * 0.7) * 0.06);
  BANNER.prop.rotation.x += dt * 50;
  const p = BANNER.ban.geometry.attributes.position, b = BANNER.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3]; p.setZ(i, Math.sin(LIFE.t * 6 + x * 0.6) * 0.25 * ((11 - x) / 22)); } p.needsUpdate = true;
}

/* ---------- the ghost ship at 3 a.m. New York time ---------- */
const ghostFound = secret('ghost', () => { });
function ghostFrame() {
  const t = SKY.t; if (!t) return; const on = t.h === 3; if (on === HUNT.ghost) return;
  const A = window.__ARCH && __ARCH.props && __ARCH.props.ship_pinnace; if (!A) return; HUNT.ghost = on;
  if (on) { ghostFound(); toast('3 A.M. THE GHOST SHIP OF UNSOLD JPGs IS IN THE HARBOUR.'); }
  A.parts.forEach(pt => { const m = pt.m; if (!m || !m.emissive) return; m.emissive.set(on ? 0x2aff8a : 0x000000); m.emissiveIntensity = on ? 0.9 : 0; if (on) { m.transparent = true; m.opacity = 0.75; } else { m.opacity = 1; m.transparent = false; } m.needsUpdate = true; });
}

/* ---------- HELP ---------- */
secret('help', () => { const hints = ['TRY WORDS A NEW YORKER WOULD TYPE: TAXI. PIZZA. BODEGA.', 'THE SEA HAS A WHALE IN IT. ASK FOR IT.', 'GRAVITY IS A SUGGESTION ON THE MOON.', 'THE CLOCK MAN READS A CERTAIN TIME.', 'THE FLOOR CAN BE A DANCE FLOOR.', 'NINE GOLDEN SLICES ARE HIDDEN. TYPE SLICES FOR A CLUE.', 'SOMETHING IS BURIED ON GM BEACH. X MARKS IT.', 'THE PHONE BY THE PIER RINGS. ANSWER IT.', 'THERE IS A CODE FROM 1986 THAT STILL WORKS HERE.'];
  toast(`SECRETS ${PLAY.found.size} OF ${PLAY.total}. ` + hints[(Math.random() * hints.length) | 0], 'blue'); }, ['help', 'secrets', 'hint', 'hints']);

/* every older egg counts too */
Object.keys(EGGS).forEach(k => { const f = EGGS[k]; if (f.__s) return; const w = secret('egg:' + k, f); w.__s = true; EGGS[k] = w; });
Object.keys(EGGS).forEach(k => { EGGS[k].__s = true; });

function secretsFrame(dt) {
  try { huntFrame(dt); xFrame(dt); bannerFrame(dt); ghostFrame(); HUNT.bottles.forEach(b => { b.g.position.y = 0.02 + Math.sin(LIFE.t * 1.3 + b.ph) * 0.06; b.g.rotation.x = Math.sin(LIFE.t * 0.9 + b.ph) * 0.2; }); } catch (e) { if (!HUNT.err) { HUNT.err = e; console.warn('v14 secrets', e); } }
}
