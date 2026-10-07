/* ================================================================
   v3: the living island. Weather, calendar, sun and moon discs, sculptures, grass, fireworks, reflections
   ================================================================ */

/* --- weather: one per day from the date, the way Marfa Light rolls its sky; Y cycles it --- */
const WEATHERS = ['CLEAR', 'SCATTERED', 'HARBOR FOG', 'RAIN', 'SNOW'];
const WX = { cur: 'CLEAR', override: null, fog: 0, wet: 0, snow: 0, day: -1 };
function weatherFor(t) {
  let h = Math.imul(t.days ^ 0x6529, 2654435761) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; const r = (h % 1000) / 1000, winter = t.mo === 12 || t.mo <= 2;
  if (r < 0.46) return 'CLEAR'; if (r < 0.68) return 'SCATTERED'; if (r < 0.84) return 'HARBOR FOG'; return winter ? 'SNOW' : 'RAIN';
}
const precip = (function () {
  const n = 2400, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 6); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xbfd2e6, transparent: true, opacity: 0.45, depthWrite: false }));
  const sg = new THREE.BufferGeometry(), sp = new Float32Array(n * 3); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false }));
  rain.frustumCulled = snow.frustumCulled = false; rain.visible = snow.visible = false; scene.add(rain); scene.add(snow);
  const seed = Array.from({ length: n }, () => [Math.random() * 60 - 30, Math.random() * 30, Math.random() * 60 - 30, 0.6 + Math.random() * 0.8]);
  return { n, rain, snow, pos, sp, seed };
})();
function updateWeather(dt, t) {
  if (t.days !== WX.day) { WX.day = t.days; if (!WX.override) WX.cur = weatherFor(t); }
  if (WX.override) WX.cur = WX.override;
  const k = 1 - Math.exp(-dt * 0.8), c = WX.cur;
  WX.fog += ((c === 'HARBOR FOG' ? 1 : 0) - WX.fog) * k; WX.wet += ((c === 'RAIN' ? 1 : 0) - WX.wet) * k; WX.snow += ((c === 'SNOW' ? 1 : 0) - WX.snow) * k;
  const R = precip, cx = P.x, cz = P.z, cy = P.y;
  R.rain.visible = WX.wet > 0.05; R.snow.visible = WX.snow > 0.05; R.rain.material.opacity = 0.45 * WX.wet; R.snow.material.opacity = 0.9 * WX.snow;
  if (R.rain.visible || R.snow.visible) for (let i = 0; i < R.n; i++) {
    const s = R.seed[i]; s[1] -= dt * (R.rain.visible ? 22 * s[3] : 1.3 * s[3]); if (s[1] < -2) s[1] += 32;
    const x = cx + ((s[0] + (R.snow.visible ? Math.sin(T * 0.7 + i) * 0.6 : 0) + 30) % 60 + 60) % 60 - 30, y = cy + s[1], z = cz + ((s[2] + 30) % 60 + 60) % 60 - 30;
    if (R.rain.visible) { R.pos[i * 6] = x; R.pos[i * 6 + 1] = y; R.pos[i * 6 + 2] = z; R.pos[i * 6 + 3] = x + 0.05; R.pos[i * 6 + 4] = y + 0.55; R.pos[i * 6 + 5] = z; }
    if (R.snow.visible) { R.sp[i * 3] = x; R.sp[i * 3 + 1] = y; R.sp[i * 3 + 2] = z; }
  }
  if (R.rain.visible) R.rain.geometry.attributes.position.needsUpdate = true; if (R.snow.visible) R.snow.geometry.attributes.position.needsUpdate = true;
  MAT.water.roughness = 0.06 + 0.25 * WX.wet; MAT.grass.color.copy(SEASON.grass).lerp(_white, WX.snow * 0.75); if (GRASS.mesh) GRASS.mesh.material.color.copy(MAT.grass.color);
}
const _white = new THREE.Color(0xffffff);

/* --- the real sun and the real moon, as discs in front of the photographs --- */
const DISCS = (function () {
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const c = sc.getContext('2d');
  const g = c.createRadialGradient ? c.createRadialGradient(64, 64, 4, 64, 64, 64) : null;
  if (g) { g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.18, 'rgba(255,236,190,0.95)'); g.addColorStop(0.45, 'rgba(255,190,120,0.25)'); g.addColorStop(1, 'rgba(255,160,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sc), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, transparent: true }));
  sun.scale.set(120, 120, 1); sun.renderOrder = -9; scene.add(sun);
  const mc = document.createElement('canvas'); mc.width = mc.height = 128;
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(mc), depthWrite: false, fog: false, toneMapped: false, transparent: true }));
  moon.scale.set(34, 34, 1); moon.renderOrder = -9; scene.add(moon);
  return { sun, moon, mc, phaseDay: -1 };
})();
function drawMoonPhase(illum, waxing) {
  const c = DISCS.mc.getContext('2d'); if (!c.getImageData || !c.createImageData) return; const im = c.createImageData(128, 128), k = 1 - 2 * illum;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const nx = (x - 64) / 58, ny = (y - 64) / 58, r2 = nx * nx + ny * ny, i = (y * 128 + x) * 4; if (r2 > 1) { im.data[i + 3] = 0; continue; }
    const edge = k * Math.sqrt(1 - ny * ny), lit = waxing ? nx > edge : nx < -edge, tex = 0.86 + 0.14 * Math.sin(nx * 9 + ny * 5) * Math.cos(ny * 7 - nx * 3);
    im.data[i] = lit ? 246 * tex : 40; im.data[i + 1] = lit ? 242 * tex : 48; im.data[i + 2] = lit ? 228 * tex : 66; im.data[i + 3] = lit ? 255 : 70; }
  c.putImageData(im, 0, 0); DISCS.moon.material.map.needsUpdate = true;
}
function updateDiscs() {
  const s = SKY.sun, m = SKY.moon, cp = camera.position, clouded = Math.max(WX.fog, WX.wet, WX.snow);
  DISCS.sun.position.copy(cp).addScaledVector(SKY.sunDir, 1000); DISCS.sun.visible = s.el > -2 && clouded < 0.6;
  DISCS.sun.material.opacity = smooth(-2, 3, s.el) * (1 - clouded); DISCS.sun.scale.setScalar(s.el < 12 ? 150 : 110);
  DISCS.moon.position.copy(cp).addScaledVector(SKY.moonDir, 1000); DISCS.moon.visible = m.el > -1 && clouded < 0.6;
  DISCS.moon.material.opacity = (0.35 + 0.65 * (1 - smooth(-6, 10, s.el))) * (1 - clouded);
  if (SKY.t.days !== DISCS.phaseDay) { DISCS.phaseDay = SKY.t.days; drawMoonPhase(m.illum, m.waxing); }
}

/* --- calendar: what day it is in New York changes the island --- */
const SEASON = { grass: new THREE.Color(0xd6dcc4) };
const CAL = { day: -1, hour: -1, ev: [], mint: false, weekend: false, spooky: false, fire: false, gm: false, gn: false, cod: 1 };
const FIRE_DAYS = { 101: 'NEW YEAR', 103: 'GENESIS BLOCK DAY', 609: 'THE MEMES ANNIVERSARY', 704: 'INDEPENDENCE DAY', 915: 'MERGE DAY', 1031: 'BITCOIN WHITEPAPER DAY', 1231: 'NEW YEAR\'S EVE' };
const OTHER_DAYS = { 522: 'BITCOIN PIZZA DAY', 214: 'VALENTINE\'S DAY. THE FLOOR LOVES YOU BACK', 401: 'APRIL FOOLS. NOTHING HERE IS SERIOUS ANYWAY', 1225: 'CHRISTMAS' };
function updateCalendar(t) {
  if (t.days === CAL.day && t.h === CAL.hour) return; const newDay = t.days !== CAL.day; CAL.day = t.days; CAL.hour = t.h;
  const md = t.mo * 100 + t.d, ev = [];
  CAL.mint = [1, 3, 5].includes(t.wd); CAL.weekend = t.wd === 0 || t.wd === 6; CAL.spooky = t.mo === 10; CAL.fire = !!FIRE_DAYS[md];
  CAL.gm = t.h >= 5 && t.h < 12; CAL.gn = t.h >= 23 || t.h < 5;
  if (CAL.mint) ev.push('MINT DAY'); if (CAL.weekend) ev.push('WEEKEND. THE WHEEL RUNS FAST'); if (CAL.spooky) ev.push('SPOOKY SZN'); if (FIRE_DAYS[md]) ev.push(FIRE_DAYS[md] + '. FIREWORKS AT DARK'); if (OTHER_DAYS[md]) ev.push(OTHER_DAYS[md]);
  if (t.mo >= 6 && t.mo <= 8) ev.push('SUMMER.JPG SEASON'); if (CAL.gm) ev.push('GM HOURS'); if (CAL.gn) ev.push('GN HOURS. WE DO NOT SAY THAT HERE');
  CAL.ev = ev; convBase = CAL.mint ? 2.2 : 0.9; if (seizeT <= 0) convSpeed = convBase; wheelBase = CAL.weekend ? 0.13 : 0.06; if (wheel.speed < 0.2) wheel.speed = wheelBase;
  PUMPKINS.mesh && (PUMPKINS.mesh.visible = PUMPKINS.stems.visible = CAL.spooky);
  if (newDay) {
    // seasons tint the lawn: spring green, high summer, a gold autumn, a tired winter
    const doy = daysFromCivil(t.y, t.mo, t.d) - daysFromCivil(t.y, 1, 1);
    SEASON.grass.set(doy < 59 || doy > 340 ? 0xcfcab4 : doy < 140 ? 0xd2e0bc : doy < 245 ? 0xdce6b6 : doy < 300 ? 0xe4d9a8 : 0xdacb9c);
    CAL.cod = CARDS[(Math.imul(t.days, 7919) >>> 0) % CARDS.length].n; if (COD.mesh) { setPlaneUV(COD.mesh, 'meme', CAL.cod, 3.4); COD.mesh.userData.card = CAL.cod; COD.redraw(t); }
    MINTSIGN.redraw && MINTSIGN.redraw();
  }
}
let convBase = 0.9, wheelBase = 0.06;

/* card of the day, on an easel at the south end of the floor */
const COD = { mesh: null, cv: null, tex: null, redraw: () => { } };
(function () {
  const x = 9, z = 34, g = ground(x, z); [-1.2, 1.2].forEach(o => { const l = box(0.12, 4.6, 0.12, MAT.wood, x + o, g + 2.2, z - 0.4, 0); l.rotation.x = 0.12; }); box(0.12, 3.6, 0.12, MAT.wood, x, g + 1.8, z - 1.1, 0).rotation.x = -0.35;
  box(2.6, 0.12, 0.3, MAT.wood, x, g + 0.9, z, 0); post(x, z, 1.1);
  COD.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false })); COD.mesh.position.set(x, g + 2.75, z + 0.08); scene.add(COD.mesh); PICK_EXTRA.push(COD.mesh);
  box(2.6, 3.8, 0.08, MAT.ink, x, g + 2.75, z + 0.02, 0, 0, false);
  COD.cv = document.createElement('canvas'); COD.cv.width = 1024; COD.cv.height = 300; COD.tex = new THREE.CanvasTexture(COD.cv); COD.tex.encoding = THREE.sRGBEncoding;
  plane(2.6, 0.76, new THREE.MeshBasicMaterial({ map: COD.tex, toneMapped: false }), x, g + 5.1, z + 0.02, 0);
  COD.redraw = t => { const c = COD.cv.getContext('2d'), card = byN[CAL.cod]; c.drawImage(signCanvas([{ t: Q('CARD OF THE DAY'), s: 0.3 }, { t: DAYS[t.wd] + ' · CARD ' + card.n + ' · ' + card.t.toUpperCase(), s: 0.13, c: '#FF6B00' }, { t: 'A NEW ONE EVERY MIDNIGHT IN NEW YORK', s: 0.1, b: false }], 1024, 300, '#0D0D0D'), 0, 0); COD.tex.needsUpdate = true; };
})();
/* mint day sign at the factory */
const MINTSIGN = { redraw: null };
(function () {
  const x = 5, z = -47.6, g = ground(x, z), cv = document.createElement('canvas'); cv.width = 1024; cv.height = 340; const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  plane(3.4, 1.13, new THREE.MeshBasicMaterial({ map: t, toneMapped: false }), x, g + 2.4, z, 0); box(3.46, 1.19, 0.04, MAT.ink, x, g + 2.4, z - 0.03, 0, 0, false); cyl(0.06, 0.06, 1.85, MAT.orange, x, g + 0.92, z - 0.05, 8);
  MINTSIGN.redraw = () => { cv.getContext('2d').drawImage(signCanvas(CAL.mint ? [{ t: Q('MINT DAY'), s: 0.34, c: '#FF6B00' }, { t: 'MONDAY WEDNESDAY FRIDAY. THE BELT RUNS FAST.', s: 0.12 }, { t: 'NEW CARDS DROP ON SEIZE.IO, NOT HERE', s: 0.1, b: false }] : [{ t: Q('NOT A MINT DAY'), s: 0.3 }, { t: 'SEIZE ANYWAY.', s: 0.16, c: '#FF6B00' }, { t: 'MINTS: MONDAY, WEDNESDAY, FRIDAY', s: 0.1, b: false }], 1024, 340, '#0D0D0D'), 0, 0); t.needsUpdate = true; };
})();

/* pumpkins for Spooky SZN (October), lit at night */
const PUMPKINS = { mesh: null, stems: null };
(function () {
  const spots = []; for (let i = 0; i < 45; i += 3) spots.push(P2((i + 0.5) / 45 * 360 + 2, 28.6));
  for (let i = 0; i < 16; i++) spots.push(P2(150 + i * 4, 119)); [[8, 61], [8, 71], [-6, -116.5], [6, -116.5], [-55, 4], [-55, -4], [20, -48], [-20, -48], [24, 42], [64, 42], [-60, 50], [-28, 50]].forEach(p => spots.push(p));
  const pm = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.55, emissive: 0xff6a00, emissiveIntensity: 0 });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 14, 10), pm, spots.length), stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6), cm(0x4b5b2a), spots.length), m = new THREE.Matrix4();
  spots.forEach(([x, z], i) => { const g = Math.max(ground(x, z), (floorAt(x, z, 3).f || 0)); const s = 0.8 + rnd() * 0.7; m.compose(new V3(x, g + 0.3 * s, z), QY(rnd() * 6), new V3(s, s * 0.78, s)); mesh.setMatrixAt(i, m); m.compose(new V3(x, g + 0.62 * s, z), new THREE.Quaternion(), new V3(1, 1, 1)); stems.setMatrixAt(i, m); });
  mesh.castShadow = true; mesh.visible = stems.visible = false; scene.add(mesh); scene.add(stems); PUMPKINS.mesh = mesh; PUMPKINS.stems = stems;
})();

/* fireworks over the harbour on the days that earn them, and when the vault opens */
const FW = (function () {
  const n = 1400, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3).fill(-9999), col = new Float32Array(n * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.4, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.frustumCulled = false; scene.add(pts);
  return { n, pos, col, pts, v: Array.from({ length: n }, () => [0, 0, 0, 0]), next: 0, cursor: 0, show: 0 };
})();
const FW_COLS = [0x2962ff, 0xff6b00, 0xffffff, 0xffd400, 0x7fe3ff, 0xff4fa0].map(h => new THREE.Color(h));
function updateFireworks(dt) {
  const active = FW.show > 0 || (CAL.fire && L.lamps > 0.55); if (FW.show > 0) FW.show -= dt;
  if (active) { FW.next -= dt; if (FW.next <= 0) { FW.next = 0.5 + Math.random() * 1.2; const cx = (Math.random() - 0.5) * 220, cy = 70 + Math.random() * 60, cz = 190 + Math.random() * 120, c = FW_COLS[Math.floor(Math.random() * FW_COLS.length)];
    for (let k = 0; k < 110; k++) { const i = FW.cursor = (FW.cursor + 1) % FW.n, th = Math.random() * PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = 14 + Math.random() * 10;
      FW.pos[i * 3] = cx; FW.pos[i * 3 + 1] = cy; FW.pos[i * 3 + 2] = cz; FW.v[i] = [Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp, 2.4]; FW.col[i * 3] = c.r; FW.col[i * 3 + 1] = c.g; FW.col[i * 3 + 2] = c.b; }
    if (AC && oceanGain && oceanGain.gain.value > 0) chime(140 + Math.random() * 60); } }
  let any = false; for (let i = 0; i < FW.n; i++) { const v = FW.v[i]; if (v[3] <= 0) continue; any = true; v[3] -= dt; v[1] -= 9 * dt; v[0] *= 0.985; v[1] *= 0.985; v[2] *= 0.985;
    FW.pos[i * 3] += v[0] * dt; FW.pos[i * 3 + 1] += v[1] * dt; FW.pos[i * 3 + 2] += v[2] * dt; if (v[3] <= 0) FW.pos[i * 3 + 1] = -9999; const f = Math.max(0, v[3] / 2.4); FW.col[i * 3] *= 0.995; FW.col[i * 3 + 1] *= 0.995; FW.col[i * 3 + 2] *= 0.995 + 0 * f; }
  FW.pts.visible = any; if (any) { FW.pts.geometry.attributes.position.needsUpdate = true; FW.pts.geometry.attributes.color.needsUpdate = true; }
}

/* --- grass: 9,000 tufts that lean in the wind, tinted by season and snow --- */
const GRASS = { mesh: null, shader: null };
(function () {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d');
  if (c.beginPath && c.quadraticCurveTo) { for (let i = 0; i < 14; i++) { const x = 4 + Math.random() * 56, h = 30 + Math.random() * 32; c.strokeStyle = `rgb(${70 + Math.random() * 40},${110 + Math.random() * 50},${30 + Math.random() * 25})`; c.lineWidth = 2 + Math.random() * 2; c.beginPath(); c.moveTo(x, 64); c.quadraticCurveTo(x + (Math.random() - 0.5) * 10, 64 - h / 2, x + (Math.random() - 0.5) * 18, 64 - h); c.stroke(); } }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const g1 = new THREE.PlaneGeometry(0.7, 0.42); g1.translate(0, 0.21, 0); const g2 = g1.clone(); g2.rotateY(PI / 2);
  const pos = [...g1.attributes.position.array, ...g2.attributes.position.array], uv = [...g1.attributes.uv.array, ...g2.attributes.uv.array], idx = [...g1.index.array, ...Array.from(g2.index.array, i => i + 4)];
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9, color: 0xd6dcc4 });
  mat.onBeforeCompile = sh => { sh.uniforms.uTime = { value: 0 }; GRASS.shader = sh; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvec4 ip = instanceMatrix[3];\n\ttransformed.x += sin(uTime * 1.6 + ip.x * 0.31 + ip.z * 0.23) * 0.07 * uv.y;\n\ttransformed.z += cos(uTime * 1.3 + ip.z * 0.27) * 0.04 * uv.y;'); };
  const N = isMobile ? 4000 : 9000, mesh = new THREE.InstancedMesh(geo, mat, N), m = new THREE.Matrix4(); let k = 0, tries = 0;
  while (k < N && tries++ < N * 6) {
    const a = rnd() * PI * 2, r = Math.sqrt(rnd()) * 101, x = Math.cos(a) * r, z = Math.sin(a) * r, g = ground(x, z);
    if (Math.abs(x) < 17.5 && Math.abs(z) < 17.5) continue; if (r > 36.5 && r < 43.5) continue; if (Math.abs(x) < 3 && Math.abs(z) > 16) continue; if (Math.abs(z) < 3 && Math.abs(x) > 16) continue;
    const f = floorAt(x, z, 3); if (f.block || (f.f !== null && f.f > g + 0.05)) continue;
    const s = 0.7 + rnd() * 0.8; m.compose(new V3(x, g, z), QY(rnd() * 6), new V3(s, s * (0.8 + rnd() * 0.6), s)); mesh.setMatrixAt(k++, m);
  }
  mesh.count = k; mesh.receiveShadow = true; scene.add(mesh); GRASS.mesh = mesh;
})();

/* --- MLow's meme sculptures: 20 classics from the MEME MUSEUM and 46 from The Memes by 6529 --- */
const SC = [];
(function () {
  const list = D.sculpts || [], by = {}; list.forEach((s, i) => by[s.key] = s);
  const at = (key, x, z, ry, o = {}) => { const s = by[key]; if (!s) return; SC.push(Object.assign({ i: SC.length, x, z, ry, scale: 1.5, plinth: true, state: null }, s, o)); };
  const fc = (x, z) => faceTo(x, z, 0, 0);
  // the classics, each where it means something
  at('wave', -30, 152, faceTo(-30, 152, 0, 128), { scale: 2.0, plinth: false, base: -1.6 });
  at('pepe', -10, 22, 0); at('wojak', 10, 22, 0);
  at('monalisa', -66, -5, PI / 2, { scale: 1.2 }); at('doge', -48, 10, PI / 2); at('tableflip', -46, -14, PI / 2);
  at('mj', -13, -54.5, 0, { scale: 1.3 }); at('rick', 9, 108, 0); at('drake', -20, 76, PI / 2);
  at('grumpy', -7, -116, 0); at('flame', 7, -116, 0, { scale: 1.2 }); at('spongebob', -35, -30, fc(-35, -30)); at('spiderman', 42, -72, faceTo(42, -72, 30, -80), { scale: 1.2 });
  const gb = P2(67, 49); at('brain', gb[0], gb[1], fc(...gb)); at('pikachu', -21, 42, fc(-21, 42)); at('thisisfine', 44, 63, PI, { scale: 1.3 }); at('sweat', 70, 44, -PI / 2);
  at('kermit', 8, 58, -PI / 2); at('harold', 5, 80, -PI / 2); at('nyan', 62, 0, 0, { plinth: false, anim: 'orbit', scale: 1.4 });
  // The Memes by 6529, grouped by the pillar MEME MUSEUM v3 gave them
  const sec = n => list.filter(s => s.sec === n).map(s => s.key);
  sec('SEIZE').forEach((k, i) => at(k, [-21, -15, -9, 9, 15, 21][i], -45, 0));
  sec('GM').forEach((k, i) => { const x = [-28, -20, -12, 12, 20, 28][i]; at(k, x, Math.sqrt(114 * 114 - x * x), 0); });
  sec('SUMMER').forEach((k, i) => at(k, [-61, -55, -49, -43, -37, -31][i], 55, PI));
  sec('SURVIVE').forEach((k, i) => at(k, [24, 30, 36, 52, 58, 64][i], 60, PI));
  sec('FREEDOM').forEach((k, i) => { const p = P2([156, 164, 172, 188, 196, 204][i], 88); at(k, p[0], p[1], fc(...p)); });
  sec('NETWORK').forEach((k, i) => { const a = (70 + i * 18) * D2R, x = 30 + Math.cos(a) * 13, z = -80 + Math.sin(a) * 13; at(k, x, z, faceTo(x, z, x + (x - 30), z + (z + 80))); });
  sec('SPRINKLE').forEach((k, i) => { const a = [12, 33, 57, 78, 102, 123, 237, 258, 282, 303][i]; const p = P2(a, 33.5); at(k, p[0], p[1], PI - a * D2R); });
  // plinths, plaques and collision, built now; the sculptures stream in as you walk
  const plinthG = new THREE.CylinderGeometry(1.25, 1.35, 0.7, 28), pl = new THREE.InstancedMesh(plinthG, MAT.lime, SC.length), band = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.27, 1.27, 0.08, 28), MAT.gold, SC.length), m = new THREE.Matrix4(); let k = 0;
  SC.forEach(s => {
    const g = s.base !== undefined ? s.base : Math.max(ground(s.x, s.z), floorAt(s.x, s.z, 3).f || -5);
    s.base = s.plinth ? g + 0.7 : g;
    if (s.plinth) { m.makeTranslation(s.x, g + 0.35, s.z); pl.setMatrixAt(k, m); m.makeTranslation(s.x, g + 0.66, s.z); band.setMatrixAt(k++, m); post(s.x, s.z, 1.35, -10, g + 3);
      sign([{ t: s.label, s: 0.34 }, { t: s.sub, s: 0.18, c: '#FF6B00' }], s.x + Math.sin(s.ry) * 1.37, s.z + Math.cos(s.ry) * 1.37, s.ry, 1.5, 0.4, { y: g + 0.36, post: false, back: false }); }
  });
  pl.count = band.count = k; pl.castShadow = pl.receiveShadow = true; scene.add(pl); scene.add(band);
  zone(-30, 152, 16, 'THE GREAT WAVE');
})();
const gltfLoader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
if (gltfLoader && window.MeshoptDecoder) gltfLoader.setMeshoptDecoder(window.MeshoptDecoder);
const SCL = { loading: 0, t: 0, done: 0 };
function updateSculpts(dt) {
  SC.forEach(s => { if (!s.root) return; if (s.pop < 1) { s.pop = Math.min(1, s.pop + dt * 1.8); const e = 1 - Math.pow(1 - s.pop, 3); s.root.scale.setScalar(0.001 + e); }
    if (s.anim === 'orbit') { const a = T * 0.25; s.root.position.set(wheel.cx - 4, wheel.hub + Math.sin(a) * 21, wheel.cz + Math.cos(a) * 21); s.root.rotation.set(-a, -PI / 2, 0, 'YXZ'); }
    if (s.key === 'wave') s.root.position.y = s.base + Math.sin(T * 0.6) * 0.25; });
  SCL.t -= dt; if (SCL.t > 0 || !gltfLoader) return; SCL.t = 0.35;
  const near = SC.filter(s => !s.state).sort((a, b) => Math.hypot(P.x - a.x, P.z - a.z) - Math.hypot(P.x - b.x, P.z - b.z));
  for (const s of near) { if (SCL.loading >= 3) break; if (Math.hypot(P.x - s.x, P.z - s.z) > 140) break; s.state = 'loading'; SCL.loading++;
    gltfLoader.load('assets/sculpt/' + s.key + '.gltf.json', g => { SCL.loading--; s.state = 'ready'; SCL.done++; placeSculpt(s, g.scene); }, undefined, () => { SCL.loading--; s.state = 'error'; }); }
}
function placeSculpt(s, obj) {
  obj.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new V3()), c = bb.getCenter(new V3());
  const target = s.size * s.scale, k = s.mode === 'm' ? target / Math.max(sz.x, sz.y, sz.z) : target / Math.max(0.001, sz.y);
  const inner = new THREE.Group(); inner.add(obj); obj.position.set(-c.x, -bb.min.y, -c.z); inner.scale.setScalar(k);
  const root = new THREE.Group(); root.add(inner); root.position.set(s.x, s.base, s.z); root.rotation.y = s.ry; root.scale.setScalar(0.001); scene.add(root); s.root = root; s.pop = 0;
  obj.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; o.userData.sculpt = s.i; PICK_EXTRA.push(o);
    const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(mt => { if (mt) { mt.envMapIntensity = 1.0; if (mt.map) mt.map.anisotropy = ANISO; } }); });
}

/* --- reflections: the sky photographs become the environment map, refreshed as the light moves --- */
const ENV = { pmrem: null, rt: null, w: null, t: 0, on: false };
const skyScene = new THREE.Scene(); scene.children.filter(o => o.material === panoMat || (o.material && o.material === panoMat.userData.capMat)).forEach(o => skyScene.add(o.clone()));
function updateEnv(dt, force) {
  ENV.t -= dt; if (!force && ENV.t > 0) return; ENV.t = 1.5;
  const w = SKY.w; if (!force && ENV.w && Math.abs(w.x - ENV.w.x) + Math.abs(w.y - ENV.w.y) + Math.abs(w.z - ENV.w.z) + Math.abs(w.w - ENV.w.w) < 0.05) return;
  try { if (!ENV.pmrem) { ENV.pmrem = new THREE.PMREMGenerator(renderer); ENV.pmrem.compileCubemapShader(); }
    const rt = ENV.pmrem.fromScene(skyScene, 0.04, 1, 3000); if (ENV.rt) ENV.rt.dispose(); ENV.rt = rt; scene.environment = rt.texture; ENV.on = true; ENV.w = w.clone(); } catch (e) { ENV.on = false; }
}

/* --- the HUD clock --- */
function clockHud() {
  const t = SKY.t, st = sunTimes(t), m = SKY.moon; if (!t) return;
  const mode = TIME.gmT > 0 ? 'SUNRISE REPLAY' : TIME.mode === 'live' ? (TIME.shift ? 'LIVE ' + (TIME.shift > 0 ? '+' : '') + Math.round(TIME.shift / 3600) + 'H' : 'LIVE') : TIME.mode === 'lapse' ? 'TIME-LAPSE' : 'HELD';
  $('clock').innerHTML = `<b>NEW YORK ${pad2(t.h)}:${pad2(t.m)} ${t.zone}</b> · ${DAYS[t.wd].slice(0, 3)} ${t.d} ${MONTHS[t.mo - 1]} · ${mode}<br>SUN ${SKY.el.toFixed(0)}° · RISE ${hhmm(st.rise)} · SET ${hhmm(st.set)}<br>${moonName(m)} ${Math.round(m.illum * 100)}% · ${WX.cur}${WX.override ? ' (Y)' : ''}<br><span class="ev">${CAL.ev.slice(0, 3).join(' · ') || 'AN ORDINARY DAY'}</span>`;
}
