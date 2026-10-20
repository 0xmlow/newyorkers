// THE MANAGEMENT OFFICE. New Yorker No. 39, The Landlord: a storefront office on Broadway with a wall of keys, every
// apartment he owns on a hook with a paper tag. He stands behind his desk with the ring of keys held out. The trick is
// the oldest one there is, done backwards: the closer you walk, the bigger he gets, until his head is in the tin
// ceiling; back away and he is just a man in a coat again.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, decal, prop, cast, relief, steam, sheet, glowTex, stamp, art, artTex, artPlane } from './kit.js';

export function landlord(c, r, g, X) {
  const { THREE } = c, HI = 6;
  // ---- the desk, big and dark, a banker's lamp, the ledger, the phone ----
  const DX = 10, DZ = -3.6, oak = std(c, 0x3a2414, { roughness: 0.45 }), top = std(c, 0x2a180c, { roughness: 0.3 });
  const desk = new THREE.Group(); desk.position.set(DX, 0, DZ); g.add(desk);
  desk.add(box(c, 2.6, 0.08, 1.1, top, 0, 0.82, 0)); desk.add(box(c, 0.7, 0.78, 1.0, oak, -0.9, 0.39, 0)); desk.add(box(c, 0.7, 0.78, 1.0, oak, 0.9, 0.39, 0)); desk.add(box(c, 1.1, 0.5, 0.06, oak, 0, 0.55, 0.47));
  for (const sx of [-0.9, 0.9]) for (let k = 0; k < 3; k++) { desk.add(box(c, 0.6, 0.2, 0.02, std(c, 0x4a2c18, { roughness: 0.4 }), sx, 0.15 + k * 0.24, 0.51)); desk.add(box(c, 0.12, 0.02, 0.02, std(c, 0xb08a3a, { metalness: 1 }), sx, 0.18 + k * 0.24, 0.53)); }
  c.wall(X(DX - 1.35), DZ - 0.6, X(DX + 1.35), DZ - 0.6); c.wall(X(DX - 1.35), DZ + 0.6, X(DX + 1.35), DZ + 0.6); c.wall(X(DX - 1.35), DZ - 0.6, X(DX - 1.35), DZ + 0.6); c.wall(X(DX + 1.35), DZ - 0.6, X(DX + 1.35), DZ + 0.6);
  // the banker's lamp: green glass, brass, a pool of light on the leather
  const lamp = new THREE.Group(); lamp.position.set(DX - 0.8, 0.86, DZ - 0.2); g.add(lamp);
  lamp.add(cyl(c, 0.09, 0.11, 0.03, std(c, 0xb08a3a, { metalness: 1, roughness: 0.3 }), 0, 0.015, 0)); lamp.add(cyl(c, 0.012, 0.012, 0.32, std(c, 0xb08a3a, { metalness: 1 }), 0, 0.17, 0, 8));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.1, 20, 1, true, 0, PI), new THREE.MeshStandardMaterial({ color: 0x0a6a2a, emissive: 0x0a8a3a, emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.2 })); shade.rotation.z = PI / 2; shade.rotation.y = PI / 2; shade.position.y = 0.34; lamp.add(shade);
  const pool = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(160,255,160,.35)'), transparent: true, depthWrite: false, toneMapped: false })); pool.scale.setScalar(1.2); pool.position.y = 0.25; lamp.add(pool);
  const ledger = new THREE.Group(); ledger.position.set(DX + 0.1, 0.87, DZ + 0.15); ledger.rotation.y = 0.15; g.add(ledger);
  ledger.add(box(c, 0.5, 0.04, 0.36, std(c, 0x5a1010, { roughness: 0.6 }), 0, 0, 0)); const pg = decal(c, 0.46, 0.32, (q, w, h) => { q.fillStyle = '#f2ede0'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(30,60,140,.35)'; for (let y = 12; y < h; y += 9) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y); q.stroke(); } q.fillStyle = '#141414'; q.font = `700 9px ${c.MONO}`; q.fillText('RENT ROLL · BROADWAY', 8, 10); [['4A', '$1,104'], ['4B', 'VACANT'], ['4C', '$1,350'], ['4F', '$812 > $3,900'], ['5A', '$1,020']].forEach(([a, b], k) => { q.fillText(a, 10, 30 + k * 18); q.fillStyle = k === 3 ? '#c8281e' : '#141414'; q.fillText(b, w * 0.45, 30 + k * 18); q.fillStyle = '#141414'; }); }, 256);
  pg.rotation.x = -PI / 2; pg.position.y = 0.025; ledger.add(pg);
  c.clickable(ledger, () => c.egg('ledger', 'The rent roll. 4F: eight hundred and twelve dollars a month for forty one years, a line through it, and in red ink the new number. The new number has a tenant already. The tenant has not seen the flat.'), 'The rent roll');
  const ph = prop(c, r, g, X, 'nyb_deskset_phone', DX + 0.85, DZ - 0.1, { h: 0.18, y: 0.86, ry: -0.4 });
  let ring = 14; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ring -= dt; if (ring < 0) { ring = 20 + Math.random() * 14; [0, 120, 600, 720].forEach((d) => setTimeout(() => c.sound.beep(980, 0.05, 0.08, 'square'), d)); } });
  c.clickable(ph, () => { c.toast('A voice on the line: "This is 4F. The radiator in the back room. It has been six weeks." The line goes dead.', 4200); c.egg('phone'); }, 'Answer the phone');
  const chair = prop(c, r, g, X, 'nyb_godfather_chair', DX, DZ - 1.2, { h: 1.25, ry: 0 });
  steam(c, g, DX + 0.9, 0.9, DZ - 0.3, 'rgba(200,200,190,.25)', 3.4);

  // ---- him: The Landlord, who grows as you come near ----
  const LL = relief(c, g, 'landlord', { h: 2.15, x: DX, z: DZ - 1.0, depth: 0.32 });
  let peak = false, size = 1;
  LL.userData.click = () => { c.say(LL, ['Every key on that wall is a door. Every door is a number.', 'I do not evict anybody. The market does. I just hold the keys.', 'You want the key to the city? Make me an offer.'][(Math.random() * 3) | 0], 3800, 2.3 * size); c.sound.clink(1400); c.egg('keyring', 'New Yorker No. 39, The Landlord: the ring of keys, the notices in the wind, the towering figure. He has a key to 4F. He has never been inside.'); };
  LL.userData.hint = 'The Landlord';
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) { LL.scale.setScalar(1); size = 1; return; }
    const d = Math.hypot(P.x - r.x0 - DX, P.z - DZ), want = 1 + Math.max(0, Math.min(1.7, (6.5 - d) * 0.42));
    size += (want - size) * Math.min(1, dt * 2.2); LL.scale.setScalar(size);
    if (size > 2.5 && !peak) { peak = true; c.sound.boom(0.4); c.shake(0.04); c.egg('towering', 'Up close he is five metres tall and his head is in the tin ceiling. Step back and he is a man in a coat. That is the whole trick, and he has been doing it to this neighbourhood for thirty years.'); }
  });

  // ---- the wall of keys: two thousand of them on hooks, and they jingle when you walk past ----
  const keyT = c.canvasTex(64, 128, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#c8a050'; q.beginPath(); q.arc(w / 2, 22, 18, 0, 7); q.fill(); q.fillStyle = 'rgba(0,0,0,0)'; q.globalCompositeOperation = 'destination-out'; q.beginPath(); q.arc(w / 2, 22, 7, 0, 7); q.fill(); q.globalCompositeOperation = 'source-over'; q.fillStyle = '#b89040'; q.fillRect(w / 2 - 5, 36, 10, 70); q.fillRect(w / 2, 86, 16, 6); q.fillRect(w / 2, 98, 12, 6); q.fillStyle = '#f2ede0'; q.fillRect(4, 44, 20, 26); });
  const keyM = new THREE.MeshStandardMaterial({ map: keyT, transparent: true, alphaTest: 0.4, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide });
  const walls = [[0.16, -7.4, 1.6, PI / 2, 9], [W - 0.42, -7.4, 1.6, -PI / 2, 9]];   // [x, z0, z1, ry, rows]
  const KN = c.MOBILE ? 900 : 2000, keys = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.12), keyM, KN), kd = [], o = new THREE.Object3D();
  for (let i = 0; i < KN; i++) { const wl = walls[i % 2], z = wl[1] + Math.random() * (wl[2] - wl[1]), y = 0.9 + Math.floor(Math.random() * 26) * 0.16; kd.push({ x: wl[0], y, z, ry: wl[3], ph: Math.random() * 6, a: 0 }); }
  const place = (k, sw) => { o.position.set(k.x, k.y, k.z); o.rotation.set(0, k.ry, sw); o.updateMatrix(); keys.setMatrixAt(kd.indexOf(k), o.matrix); };
  kd.forEach((k, i) => { o.position.set(k.x, k.y, k.z); o.rotation.set(0, k.ry, 0); o.updateMatrix(); keys.setMatrixAt(i, o.matrix); }); g.add(keys);
  // every key has a tag, and every tag is somebody: click a key and it tells you who it belongs to
  let tags = 0;
  c.clickable(keys, () => { const id = c.lastHit?.instanceId ?? 0, p = art(r, 12 + (id % 12)), apt = `${1 + (id % 5)}${'ABCDF'[id % 5]}`; c.sound.clink(2600); c.toast(`Key ${id + 1}, apartment ${apt}: ${p.t}, No. ${p.n}.`, 3000); if (++tags === 3) { c.openPiece(p); c.egg('keytag', 'Every key on the wall has a paper tag, and every tag is a New Yorker. Two thousand doors, two thousand people, one man holding the ring.'); } }, 'A key on the wall');
  // the rogues' gallery behind the desk: his tenants, in gilt, the way other men hang their diplomas
  for (let k = 0; k < 5; k++) { const p = art(r, 16 + k), m = artPlane(c, g, p, 0.9, 0.5, { egg: ['rogues', 'Behind his desk, in gilt frames, the tenants: not their faces, their buildings, their stoops, their corners. He hangs the neighbourhood the way other men hang diplomas.'] }); m.position.set(6.2 + k * 1.9, 5.0 + (k % 2) * 0.25, -7.94); const f = box(c, 1.0, 0.6, 0.04, std(c, 0xb8902e, { metalness: 1, roughness: 0.3 }), m.position.x, m.position.y, -7.97); g.add(f); }
  let lastJ = 0;
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return; let any = false;
    for (let i = 0; i < KN; i++) { const k = kd[i], near = Math.abs(P.z - k.z) < 1.2 && Math.abs(P.x - r.x0 - k.x) < 1.6; if (near) k.a = 0.5; if (k.a > 0.002) { k.a *= 0.94; o.position.set(k.x, k.y, k.z); o.rotation.set(0, k.ry, Math.sin(t * 14 + k.ph) * k.a); o.updateMatrix(); keys.setMatrixAt(i, o.matrix); any = true; } }
    if (any) { keys.instanceMatrix.needsUpdate = true; if (t - lastJ > 0.35) { lastJ = t; c.sound.clink(2400 + Math.random() * 1600); } }
  });
  // the hooks rail and brass label rails under each row
  for (const [x, z0, z1, ry] of walls) for (let y = 0.86; y < 5.1; y += 0.48) { const m = box(c, 0.02, 0.02, z1 - z0, std(c, 0x8a6a2a, { metalness: 0.9, roughness: 0.3 }), x + (ry > 0 ? 0.02 : -0.02), y + 0.1, (z0 + z1) / 2); g.add(m); }

  // ---- the furniture of a man who never throws anything out ----
  prop(c, r, g, X, 'nyb_deskset_cabinet', 2.0, -5.6, { h: 1.4, ry: PI / 2, r: 0.5 }); prop(c, r, g, X, 'nyb_deskset_cabinet', 2.0, -4.6, { h: 1.4, ry: PI / 2, r: 0.5 });
  prop(c, r, g, X, 'nyb_wolf_cabinet', 18.0, -5.4, { h: 1.6, ry: -PI / 2, r: 0.5 });
  // the safe: black, with a gold line and a dial
  const safe = new THREE.Group(); safe.position.set(17.8, 0, -2.6); safe.rotation.y = -PI / 2; g.add(safe);
  safe.add(box(c, 0.9, 1.2, 0.8, std(c, 0x111114, { metalness: 0.6, roughness: 0.35 }), 0, 0.6, 0)); safe.add(box(c, 0.8, 0.02, 0.02, std(c, 0xc8a040, { metalness: 1 }), 0, 1.1, 0.41));
  const dial = cyl(c, 0.09, 0.09, 0.04, std(c, 0xc0c0c8, { metalness: 1, roughness: 0.2 }), 0, 0.72, 0.42, 24); dial.rotation.x = PI / 2; safe.add(dial); c.post(X(17.8), -2.6, 0.6);
  c.clickable(safe, () => { dial.rotation.y += 1.3; c.sound.tick(); c.egg('safe', 'You spin the dial. Inside, everybody says, are the leases: the old ones with the old numbers on them, the ones that say rent stabilized. The combination is the year he bought the building.'); }, 'The safe');
  // the venetian blinds on the street window, neon coming through
  const blinds = new THREE.Group(); blinds.position.set(4.6, 0, D / 2 - 0.3); g.add(blinds);
  { const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), basic(c, 0xff4fa3, { transparent: true, opacity: 0.35 })); gl.position.set(0, 2.2, 0.08); blinds.add(gl); }
  for (let k = 0; k < 30; k++) { const s = box(c, 2.6, 0.04, 0.02, std(c, 0xd8d0b8, { roughness: 0.5 }), 0, 1.0 + k * 0.08, 0); s.rotation.x = 0.5; blinds.add(s); }
  const neon = c.sign('N3W MGMT · NO VACANCIES', { w: 2.2, h: 0.32, bg: null, fg: '#ff4fa3', font: c.FONT, weight: 800, glow: 20 }); neon.position.set(4.6, 3.8, D / 2 - 0.2); neon.rotation.y = PI; g.add(neon);
  c.tick((t) => { neon.material.opacity = Math.sin(t * 9) > 0.96 ? 0.35 : 1; neon.material.transparent = true; });
  // his man at the side desk: the broker
  prop(c, r, g, X, 'nyb_deskset_desk', 15.2, 3.0, { len: 1.6, ry: -PI / 2, r: 0.8 });
  cast(c, r, g, X, 'broker', 16.4, 3.0, { h: 1.78, ry: -PI / 2, line: 'Broker fee is fifteen percent. Fifteen percent of what? Of yes.', egg: 'brokerfee', hint: 'The broker' });
  // the counter you stand at, with a bell and a pile of applications
  g.add(box(c, 4.0, 1.05, 0.5, std(c, 0x2a180c), 10, 0.52, 0.9)); c.wall(X(8.0), 0.9, X(12.0), 0.9);
  const bell = cyl(c, 0.06, 0.07, 0.05, std(c, 0xd0a040, { metalness: 1, roughness: 0.2 }), 11.2, 1.08, 0.9, 16); g.add(bell);
  c.clickable(bell, () => { c.sound.clink(3200); c.toast('Ding. Nobody comes. A sign on the counter: APPLICATIONS IN THE TRAY. NO WALK INS. NO CASH. NO.', 3600); c.egg('bell'); }, 'Ring the bell');
  for (let k = 0; k < 12; k++) { const s = sheet(c, g, 9.0 + (k % 3) * 0.02, 0.9, 0.1 * k, k % 3 ? 'yellow' : 'notice', k); s.position.y = 1.06 + k * 0.004; }
  // notices on the floor, blown in from the street every time the door opens
  [[4.0, 4.6, 0.2], [6.4, 2.2, 1.3], [13.2, 5.4, 2.4]].forEach(([x, z, ry], k) => sheet(c, g, x, z, ry, ['notice', 'pink', 'yellow'][k % 3], k + 9));
}
