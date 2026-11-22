/* ================================================================
   v19 GAMES (2026-11-21)
   THE COURT: a New York half court with a chain net. E picks up the ball, E shoots it from wherever you stand;
   three in a row and you are on fire. THE N3W LINE: a subway entrance with a turnstile that says PLEASE SWIPE
   AGAIN twice, as is tradition, then the train takes you somewhere on the island. CATCH: type it and thirty
   seconds of JPGs fall from the sky; walk into them to catch them. Best scores are kept.
   ================================================================ */
const GAMES = { ball: null, held: false, fly: null, made: 0, streak: 0, best: 0, swipes: 0, catchT: 0, caught: 0 };
window.__GAMES = GAMES;
try { GAMES.best = +localStorage.getItem('meme-island-catch-best') || 0; GAMES.made = +localStorage.getItem('meme-island-buckets') || 0; } catch (e) { }

/* ---------- the court ---------- */
const COURT = { x: -66, z: 24, ry: 0 };
(function court() {
  const { x, z } = COURT, g0 = ground(x, z) + 0.06, W = 13, D = 11;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 868; const c = cv.getContext('2d');
  if (c && c.arc) { c.fillStyle = '#3b4a5c'; c.fillRect(0, 0, 1024, 868); c.fillStyle = '#b5482f'; c.fillRect(395, 0, 234, 400);
    c.strokeStyle = '#f2f2ee'; c.lineWidth = 9; c.strokeRect(10, 10, 1004, 848); c.strokeRect(395, 0, 234, 400); c.beginPath(); c.arc(512, 400, 117, 0, PI); c.stroke();
    c.beginPath(); c.moveTo(80, 0); c.lineTo(80, 200); c.arc(512, 90, 450, PI - 0.28, 0.28, true); c.lineTo(944, 0); c.stroke();
    c.font = '400 70px Anton,Impact,sans-serif'; c.fillStyle = 'rgba(242,242,238,0.85)'; c.textAlign = 'center'; c.fillText('N3W COURT', 512, 700); c.font = '800 22px "Archivo Expanded",Arial'; c.fillText('MEME ISLAND PARKS DEPARTMENT', 512, 745); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), [MAT.conc || new THREE.MeshStandardMaterial({ color: 0x777777 }), MAT.conc, new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 }), MAT.conc, MAT.conc, MAT.conc]);
  slab.position.set(x, g0 - 0.04, z); slab.receiveShadow = true; scene.add(slab); padRect(x - W / 2, x + W / 2, z - D / 2, z + D / 2, g0 + 0.02);
  // pole, backboard, rim and a chain net at the north end
  const steel = new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: 0.5, metalness: 0.6 }), hz = z - D / 2 + 0.2;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.6, 12), steel); pole.position.set(x, g0 + 1.8, hz - 1.1); scene.add(pole); post(x, hz - 1.1, 0.25);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.1), steel); arm.position.set(x, g0 + 3.5, hz - 0.55); scene.add(arm);
  const bb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 0.05), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.4 })); bb.position.set(x, g0 + 3.5, hz); scene.add(bb);
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshBasicMaterial({ color: 0xc8312a })); sq.position.set(x, g0 + 3.32, hz + 0.03); scene.add(sq);
  const sq2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({ color: 0xf2f2ee })); sq2.position.set(x, g0 + 3.32, hz + 0.035); scene.add(sq2);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.018, 8, 24), new THREE.MeshStandardMaterial({ color: 0xe0561c, metalness: 0.6, roughness: 0.4 })); rim.rotation.x = PI / 2; rim.position.set(x, g0 + 3.05, hz + 0.28); scene.add(rim);
  const chainM = new THREE.MeshStandardMaterial({ color: 0xbfc3c8, metalness: 0.9, roughness: 0.35 }); const net = new THREE.Group();
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 3), chainM); ch.position.set(Math.cos(a) * 0.19, -0.2, Math.sin(a) * 0.19); ch.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); net.add(ch); }
  net.position.copy(rim.position); scene.add(net);
  COURT.rim = new THREE.Vector3(x, g0 + 3.05, hz + 0.28); COURT.net = net; COURT.g0 = g0;
  const fence = new THREE.MeshStandardMaterial({ color: 0x8a9096, metalness: 0.7, roughness: 0.4, wireframe: true });
  const fn = new THREE.Mesh(new THREE.PlaneGeometry(W, 3, 26, 6), fence); fn.position.set(x, g0 + 1.5, z - D / 2 - 1.6); scene.add(fn); wall(x - W / 2, z - D / 2 - 1.6, x + W / 2, z - D / 2 - 1.6);
  // the ball
  const bc = document.createElement('canvas'); bc.width = 128; bc.height = 64; const b2 = bc.getContext('2d'); if (b2) { b2.fillStyle = '#d4642a'; b2.fillRect(0, 0, 128, 64); b2.fillStyle = '#1a1a1a'; b2.fillRect(0, 31, 128, 2); b2.fillRect(31, 0, 2, 64); b2.fillRect(95, 0, 2, 64); }
  const btx = new THREE.CanvasTexture(bc); btx.encoding = THREE.sRGBEncoding;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), new THREE.MeshStandardMaterial({ map: btx, roughness: 0.7 })); ball.castShadow = true; scene.add(ball); GAMES.ball = ball;
  GAMES.rest = new THREE.Vector3(x + 1.5, g0 + 0.12, z + 1.5); ball.position.copy(GAMES.rest);
  interact(x, z, 7.5, '', () => { }); GAMES.inter = INTER[INTER.length - 1];
  const sb = signTex([{ t: 'N3W COURT', s: 0.4 }, { t: 'E TO PICK UP · E TO SHOOT · NO DUNKING ON THE MEMES', s: 0.1 }], 1024, 384, '#2f4a3a', '#FFFFFF');
  const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.1), new THREE.MeshBasicMaterial({ map: sb, toneMapped: false })); sign2.position.set(x + W / 2 - 1.6, g0 + 2.2, z - D / 2 - 1.55); scene.add(sign2);
})();
const firstBucket = secret('bucket', () => { });
const onFire = secret('onfire', () => { });
function shoot() {
  if (!GAMES.held || GAMES.fly) return; GAMES.held = false;
  const from = new THREE.Vector3(P.x, P.y + 1.9, P.z), to = COURT.rim.clone(), d = Math.hypot(to.x - from.x, to.z - from.z);
  const pMake = Math.max(0.12, Math.min(0.92, 1.05 - d / 11)), make = Math.random() < pMake;
  if (!make) { to.x += (Math.random() - 0.5) * 0.9; to.z += 0.2 + Math.random() * 0.4; to.y += 0.1; }
  GAMES.fly = { from, to, t: 0, dur: 0.55 + d * 0.06, make, peak: Math.max(to.y, from.y) + 1.2 + d * 0.18, d };
}
function courtFrame(dt) {
  const b = GAMES.ball; if (!b) return;
  const near = Math.hypot(P.x - COURT.x, P.z - COURT.z) < 7.5;
  GAMES.inter.label = !near ? '' : GAMES.held ? 'E · SHOOT' : GAMES.fly ? '' : 'E · PICK UP THE BALL';
  GAMES.inter.fn = () => { if (GAMES.held) shoot(); else if (!GAMES.fly) { GAMES.held = true; toast('BALL IN HAND. FACE THE HOOP. E TO SHOOT.'); } };
  if (GAMES.held) { if (!near) { GAMES.held = false; b.position.copy(GAMES.rest); return; } const f = new THREE.Vector3(); camera.getWorldDirection(f); b.position.set(camera.position.x + f.x * 0.6, camera.position.y - 0.35 + Math.abs(Math.sin(LIFE.t * 7)) * 0.05, camera.position.z + f.z * 0.6); return; }
  const F = GAMES.fly; if (!F) return; F.t += dt; const k = Math.min(1, F.t / F.dur);
  const x = F.from.x + (F.to.x - F.from.x) * k, z = F.from.z + (F.to.z - F.from.z) * k, y = (1 - k) * (1 - k) * F.from.y + 2 * (1 - k) * k * F.peak + k * k * F.to.y;
  b.position.set(x, y, z); b.rotation.x += dt * 12;
  if (k >= 1) {
    if (F.make) { GAMES.made++; GAMES.streak++; COURT.swish = 0.6; firstBucket(); beep(1200, 0.06, 'triangle', 0.05); beep(1600, 0.08, 'triangle', 0.04, 0.06);
      toast(GAMES.streak >= 3 ? `HE'S ON FIRE. ${GAMES.streak} IN A ROW.` : F.d > 6.75 ? 'FROM DOWNTOWN. BUCKETS ' + GAMES.made : 'BUCKET. ' + GAMES.made + ' TOTAL.', GAMES.streak >= 3 ? 'blue' : undefined);
      if (GAMES.streak === 3) { onFire(); LIFE.fireworks && LIFE.fireworks(4); }
      try { localStorage.setItem('meme-island-buckets', GAMES.made); } catch (e) { } }
    else { GAMES.streak = 0; beep(180, 0.12, 'square', 0.04); toast(['BRICK.', 'OFF THE RIM.', 'AIRBALL. THE PIGEONS SAW.', 'IN AND OUT. PAPER HANDS.'][(Math.random() * 4) | 0]); }
    GAMES.fly = null; GAMES.drop = 0.7;
  }
}
function courtAfter(dt) {
  if (COURT.swish > 0) { COURT.swish -= dt; COURT.net.scale.y = 1 + Math.sin(COURT.swish * 30) * 0.15 * COURT.swish; COURT.net.rotation.y += dt * 3; }
  if (GAMES.drop > 0 && !GAMES.held && !GAMES.fly) { GAMES.drop -= dt; const b = GAMES.ball; b.position.y = Math.max(COURT.g0 + 0.12, b.position.y - dt * 7); if (GAMES.drop <= 0) b.position.copy(GAMES.rest); }
}

/* ---------- the N3W line: a subway entrance that takes you somewhere ---------- */
const SUB = { x: 26, z: 26 };
(function subway() {
  const { x, z } = SUB, g0 = ground(x, z), green = new THREE.MeshStandardMaterial({ color: 0x1f4b33, roughness: 0.45, metalness: 0.6 });
  const g = new THREE.Group(); g.position.set(x, g0, z); g.rotation.y = -PI * 0.75; scene.add(g);
  const hole = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 3.6), new THREE.MeshBasicMaterial({ color: 0x050505 })); hole.position.set(0, 0.03, 0); g.add(hole);
  for (let i = 0; i < 7; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.44), new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.8 })); st.position.set(0, -0.1 - i * 0.2, -1.4 + i * 0.44); st.visible = i < 3; g.add(st); }
  [-1.15, 1.15].forEach(sx => { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 3.6), green); rail.position.set(sx, 0.5, 0); g.add(rail);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0x3cff7a, toneMapped: false })); lamp.position.set(sx, 1.85, -1.75); g.add(lamp);
    const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 8), green); lp.position.set(sx, 0.9, -1.75); g.add(lp); });
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.36, 1.0, 0.06), green); back.position.set(0, 0.5, 1.8); g.add(back);
  const st = signTex([{ t: 'N3W LINE', s: 0.5 }, { t: 'UPTOWN · DOWNTOWN · SIDEWAYS', s: 0.15 }], 1024, 256, '#0D0D0D', '#FFFFFF');
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.58), new THREE.MeshBasicMaterial({ map: st, toneMapped: false, side: THREE.DoubleSide })); sg.position.set(0, 2.25, -1.75); g.add(sg);
  const tile = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ color: 0xf2b705, toneMapped: false })); tile.position.set(0.8, 2.25, -1.74); g.add(tile);
  // the turnstile, at the top of the stairs
  const steel = new THREE.MeshStandardMaterial({ color: 0xb8bec5, metalness: 0.9, roughness: 0.3 });
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.95, 0.7), steel); tb.position.set(-0.6, 0.48, -1.95); g.add(tb);
  const arms = new THREE.Group(); [0, 1, 2].forEach(i => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), steel); a.rotation.z = PI / 2; a.position.x = 0.28; const p = new THREE.Group(); p.add(a); p.rotation.x = i / 3 * PI * 2; arms.add(p); });
  arms.position.set(-0.45, 0.85, -1.95); g.add(arms); SUB.arms = arms;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x7dff9a, toneMapped: false })); screen.position.set(-0.6, 0.98, -2.31); screen.rotation.y = PI; g.add(screen); SUB.screen = screen;
  g.updateMatrixWorld(true); const w = g.localToWorld.bind(g); [[-1.15, -1.8, -1.15, 1.8], [1.15, -1.8, 1.15, 1.8], [-1.15, 1.8, 1.15, 1.8]].forEach(([a, b, c2, d]) => { const p1 = w(new THREE.Vector3(a, 0, b)), p2 = w(new THREE.Vector3(c2, 0, d)); wall(p1.x, p1.z, p2.x, p2.z); });
  const front = w(new THREE.Vector3(0, 0, -2.6)); SUB.fx = front.x; SUB.fz = front.z;
})();
const DEST = [['THE LIGHTHOUSE', () => teleport(LH.x + 3, LH.z + LH.d / 2 + 4, 0)], ['GM BEACH', () => teleport(0, 120, PI)], ['THE WAGMI WHEEL', () => teleport(wheel.cx - 8, wheel.cz + 6, -PI / 2)], ['SUMMER.JPG', () => teleport(-44, 54, PI)], ['THE 6529 BODEGA', () => teleport(9, 66, -PI / 2)], ['THE N3W COURT', () => teleport(COURT.x, COURT.z + 3, 0)], ['BUIDL', () => teleport(-48, -36, 0)]];
const rideLine = secret('subway', () => { });
function swipe() {
  GAMES.swipes++; beep(900, 0.05, 'square', 0.04);
  if (GAMES.swipes % 3 !== 0) { SUB.screen.material.color.set(0xff4040); toast(GAMES.swipes % 3 === 1 ? 'PLEASE SWIPE AGAIN.' : 'PLEASE SWIPE AGAIN AT THIS TURNSTILE.'); setTimeout(() => SUB.screen.material.color.set(0x7dff9a), 700); return; }
  rideLine(); toast('GO. STAND CLEAR OF THE CLOSING DOORS, PLEASE.'); SUB.spin = 1; flash('#0D0D0D');
  [523, 659, 784].forEach((f, i) => beep(f, 0.18, 'sine', 0.05, i * 0.22));
  setTimeout(() => { const d = DEST[(Math.random() * DEST.length) | 0]; d[1](); toast('THIS IS ' + d[0] + '. TRANSFER IS AVAILABLE TO EVERYTHING.', 'blue'); flash('#f2b705'); }, 1600);
}
interact(0, 0, 0, '', () => { }); const subInter = INTER[INTER.length - 1];
function subFrame(dt) { subInter.x = SUB.fx; subInter.z = SUB.fz; subInter.r = 2.4; subInter.label = 'E · SWIPE YOUR METROCARD'; subInter.fn = swipe;
  if (SUB.spin > 0) { SUB.spin -= dt; SUB.arms.rotation.x += dt * 4; } }

/* ---------- CATCH: thirty seconds of falling JPGs ---------- */
(function catchGame() {
  GAMES.cards = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false })); m.visible = false; scene.add(m); GAMES.cards.push({ m, on: false }); }
})();
const catchStart = secret('catch', () => { GAMES.catchT = 30; GAMES.caught = 0; toast('CATCH THE JPGs. THIRTY SECONDS. WALK INTO THEM.'); }, ['catch', 'catchthejpg', 'jpg']);
function catchFrame(dt) {
  const C = GAMES.cards; if (GAMES.catchT <= 0) { C.forEach(c => { if (c.on) { c.on = false; c.m.visible = false; } }); return; }
  GAMES.catchT -= dt;
  C.forEach(c => {
    if (!c.on && Math.random() < dt * 0.9) { const a = Math.random() * PI * 2, r = 2 + Math.random() * 7; c.x = P.x + Math.cos(a) * r; c.z = P.z + Math.sin(a) * r; c.y = P.y + 9 + Math.random() * 4; c.v = 1.6 + Math.random() * 1.2; c.on = true; c.m.visible = true;
      const card = CARDS[(Math.random() * CARDS.length) | 0]; try { setPlaneUV(c.m, 'meme', card.n, 1.1); } catch (e) { } c.spin = (Math.random() - 0.5) * 3; }
    if (!c.on) return; c.y -= c.v * dt; c.m.position.set(c.x + Math.sin(LIFE.t * 2 + c.v) * 0.4, c.y, c.z); c.m.rotation.set(Math.sin(LIFE.t * 1.7 + c.v) * 0.5, LIFE.t * c.spin, 0);
    if (Math.hypot(P.x - c.x, P.z - c.z) < 1.3 && c.y < P.y + 2.6 && c.y > P.y - 0.2) { c.on = false; c.m.visible = false; GAMES.caught++; beep(700 + GAMES.caught * 30, 0.06, 'triangle', 0.05); }
    else if (c.y < P.y - 1.5) { c.on = false; c.m.visible = false; }
  });
  if (GAMES.catchT <= 0) { const best = GAMES.caught > GAMES.best; if (best) { GAMES.best = GAMES.caught; try { localStorage.setItem('meme-island-catch-best', GAMES.best); } catch (e) { } }
    toast(`TIME. YOU CAUGHT ${GAMES.caught} JPGs.` + (best ? ' A NEW ISLAND RECORD.' : ` BEST ${GAMES.best}.`), 'blue'); if (best && GAMES.caught >= 10) LIFE.fireworks && LIFE.fireworks(5); }
}

/* clear grass and flowers off the court once the nature layer is in */
function clearCourtPlants() {
  const x0 = COURT.x - 7, x1 = COURT.x + 7, z0 = COURT.z - 7.5, z1 = COURT.z + 6, m = new THREE.Matrix4(), v = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const sweep = im => { if (!im || !im.isInstancedMesh) return; let hit = false; for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); v.setFromMatrixPosition(m); if (v.x > x0 && v.x < x1 && v.z > z0 && v.z < z1) { im.setMatrixAt(i, zero); hit = true; } } if (hit) im.instanceMatrix.needsUpdate = true; };
  sweep(GRASS.mesh); scene.traverse(o => { if (o.isInstancedMesh && o !== GAMES.ballMesh && o.count > 30 && o.geometry && o.geometry.boundingSphere !== undefined && o.material && !o.material.transparent) { const bs = o.geometry.boundingSphere || (o.geometry.computeBoundingSphere(), o.geometry.boundingSphere); if (bs && bs.radius < 2) sweep(o); } });
}
function gamesFrame(dt) {
  if (!GAMES.cleared && (typeof NAT === 'undefined' || NAT.ready)) { GAMES.cleared = true; try { clearCourtPlants(); } catch (e) { } }
  try { courtFrame(dt); courtAfter(dt); subFrame(dt); catchFrame(dt); } catch (e) { if (!GAMES.err) { GAMES.err = e; console.warn('v19 games', e); } }
}
