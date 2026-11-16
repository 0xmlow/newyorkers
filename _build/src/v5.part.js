// ---------- v5 (MLow: "still not impressing me": festive Rock Center, better lights, lines like clubs, NYC trash, a market) ----------

// REAL BULBS: a C9 teardrop and its dark socket at every canopy point, instanced; the glow points stay for bloom
const C9 = {};
function c9Strand(c, g, pts, { scale = 1, r } = {}) {
  const { THREE } = c; if (!pts.length) return;
  C9.bulb ||= (() => { const b = new THREE.SphereGeometry(0.028, 10, 8); b.scale(1, 1.55, 1); b.translate(0, -0.05, 0); return b; })();
  C9.sock ||= new THREE.CylinderGeometry(0.016, 0.018, 0.05, 8).translate(0, -0.01, 0);
  const bm = new THREE.MeshBasicMaterial({ toneMapped: false }), sm = new THREE.MeshStandardMaterial({ color: 0x0e1a10, roughness: 0.6 });
  const B = new THREE.InstancedMesh(C9.bulb, bm, pts.length), S = new THREE.InstancedMesh(C9.sock, sm, pts.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  pts.forEach((p, i) => { e.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4); q.setFromEuler(e); m4.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(scale, scale, scale)); B.setMatrixAt(i, m4); S.setMatrixAt(i, m4);
    const k = p[4] || [1, 0.8, 0.5], dead = Math.random() < 0.025; col.setRGB(k[0] * 1.6, k[1] * 1.6, k[2] * 1.6); if (dead) col.setRGB(0.06, 0.05, 0.04); B.setColorAt(i, col); });   // a few dead bulbs: every real string has them
  g.add(B, S); if (r && r.dress) { bm.userData.e0 = 0; r.dress.mats.push({ userData: { e0: 1 }, set emissiveIntensity(v) { bm.color.setScalar(Math.max(0.08, v)); } }); }
  return B;
}

// NYC STREET LITTER (Astra's list): gum, napkins, cups, lids, receipts, foil, wrapping scraps, ribbon, bags, chestnut shells,
// fir needles, collected where wind and feet push them: curbs, building bases, bins, queue edges
const LIT = {};
function litter(c, r, g, { zones, n = 140 } = {}) {
  const { THREE } = c, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const pick = () => { const z = zones[(Math.random() * zones.length) | 0]; return [z[0] + (Math.random() - 0.5) * z[2] * 2, z[1] + (Math.random() - 0.5) * z[3] * 2]; };
  const lay = (geo, mat, count, s0, s1, flat = true, y = 0.01) => { const im = new THREE.InstancedMesh(geo, mat, count);
    for (let i = 0; i < count; i++) { const [x, z] = pick(), s = s0 + Math.random() * (s1 - s0); e.set(flat ? -PI / 2 : (Math.random() - 0.5) * 1.2, Math.random() * 6.28, flat ? 0 : (Math.random() - 0.5) * 1.2); q.setFromEuler(e); sc.set(s, s, s); m4.compose(v.set(x, y + (flat ? 0 : s * 0.4), z), q, sc); im.setMatrixAt(i, m4); }
    g.add(im); return im; };
  LIT.gum ||= new THREE.MeshBasicMaterial({ color: 0x15171a, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  LIT.white ||= new THREE.MeshStandardMaterial({ color: 0x9e978a, roughness: 0.95 });   // street grime, not snow white
  LIT.cup ||= new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.8 });
  LIT.foil ||= new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 1, roughness: 0.35 });
  LIT.wrap ||= [0xb4161e, 0x2962ff, 0x1f6a3a, 0xd8a640].map((cc) => new THREE.MeshStandardMaterial({ color: cc, roughness: 0.6, side: THREE.DoubleSide }));
  LIT.needle ||= new THREE.MeshStandardMaterial({ color: 0x2e3a1c, roughness: 1 });
  LIT.bag ||= new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.4, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  LIT.shell ||= new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.7 });
  const N = n;
  lay(new THREE.CircleGeometry(0.02, 8), LIT.gum, N, 0.6, 1.6, true, 0.012);                                   // flattened gum
  lay(new THREE.IcosahedronGeometry(0.035, 0), LIT.white, N * 0.1 | 0, 0.6, 1.1, false);                        // crumpled napkins
  { const cg = new THREE.CylinderGeometry(0.04, 0.03, 0.11, 10, 1, true); cg.rotateZ(PI / 2); cg.scale(1, 0.6, 1); lay(cg, LIT.cup, N * 0.08 | 0, 0.9, 1.1, false, 0.02); }   // crushed cups on their side
  lay(new THREE.CircleGeometry(0.045, 14), LIT.white, N * 0.05 | 0, 1, 1, true, 0.013);                         // lids
  lay(new THREE.PlaneGeometry(0.06, 0.24), LIT.white, N * 0.06 | 0, 0.8, 1.2, true, 0.014);                    // receipts
  lay(new THREE.IcosahedronGeometry(0.035, 0), LIT.foil, N * 0.08 | 0, 0.6, 1.3, false);                        // foil balls
  LIT.wrap.forEach((m) => { m.color.multiplyScalar(0.7); lay(new THREE.PlaneGeometry(0.12, 0.08), m, N * 0.02 | 0, 0.6, 1.3, true, 0.015); });   // wrapping paper scraps
  { const rg = new THREE.TorusGeometry(0.06, 0.006, 4, 20, PI * 3); lay(rg, LIT.wrap[1], N * 0.03 | 0, 0.8, 1.4, true, 0.02); }    // curled ribbon
  { const bg = new THREE.SphereGeometry(0.14, 7, 5); bg.scale(1, 0.45, 0.8); lay(bg, LIT.bag, N * 0.03 | 0, 0.8, 1.3, false, 0.03); }   // a plastic bag
  lay(new THREE.SphereGeometry(0.018, 6, 4), LIT.shell, N * 0.1 | 0, 0.7, 1.2, false);                          // chestnut shells
  lay(new THREE.BoxGeometry(0.03, 0.002, 0.002), LIT.needle, N * 1.2 | 0, 0.7, 1.3, true, 0.012);               // fir needles
}

// THE LINE (like a club): brass stanchions folding three lanes, extras waiting in them, a bouncer with the list, an elf on the
// door, warm light spilling out each time it opens, breath steam, and the funny ones
function storeLine(c, r, g, X, { x0, z0, len = 6, lanes = 3, dir = 1, door = [0, 0], name = 'THE SHOP' } = {}) {
  const { THREE } = c, brass = std(c, 0xc8a040, { metalness: 1, roughness: 0.28 }), rope = std(c, 0x6a0f14, { roughness: 0.7 });
  const post = (x, z) => { g.add(c.slab(0.055, 0.92, 0.055, brass, x, 0.46, z)); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.04, 20), brass); b.position.set(x, 0.02, z); g.add(b); const t = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), brass); t.position.set(x, 0.95, z); g.add(t); };
  const ropeAt = (a, b) => { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(a[0], 0.88, a[1]), new THREE.Vector3((a[0] + b[0]) / 2, 0.7, (a[1] + b[1]) / 2), new THREE.Vector3(b[0], 0.88, b[1])]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 10, 0.022, 6), rope)); };
  const W1 = 1.1; let prev = null;
  for (let l = 0; l <= lanes; l++) { const xl = x0 + dir * l * W1; for (let k = 0; k <= len; k += 1.5) { const z = z0 + k; post(xl, z); if (k > 0 && !(l > 0 && l < lanes && ((l % 2 === 1 && k === len) || (l % 2 === 0 && k === 0)))) ropeAt([xl, z - 1.5], [xl, z]); }
    c.wall(X(xl), z0, X(xl), z0 + len); }
  // people waiting, each lane alternating direction; the crowd pool characters, still, a little sway
  const ppl = []; for (let l = 0; l < lanes; l++) for (let k = 0; k < len / 0.75; k++) { const xx = x0 + dir * (l + 0.5) * W1 + (Math.random() - 0.5) * 0.2, zz = z0 + 0.4 + k * 0.75; if (Math.random() < 0.12) continue;
    const e = extra(c, g, xx, zz, { col: [0x3a3a4a, 0x6a2a2a, 0x2a3a5a, 0x4a4a2a, 0x2a4a3a][(l + k) % 5], ry: l % 2 ? PI : 0, crowd: true }); ppl.push(e); }
  // the bouncer, the list, the door
  const lst = c.sign(`THE LIST\n${name}\nEST. WAIT 2 HRS`, { w: 0.55, h: 0.5, bg: '#0a0a0c', fg: '#f2ebdd', font: c.MONO, weight: 800 }); lst.position.set(door[0] - dir * 0.6, 1.25, door[1] + 0.6); lst.rotation.y = dir > 0 ? -PI / 2 : PI / 2; g.add(lst);
  g.add(c.slab(0.05, 1.05, 0.05, std(c, 0x111111), door[0] - dir * 0.6, 0.52, door[1] + 0.6));
  const bouncer = extra(c, g, door[0] - dir * 0.9, door[1] + 0.2, { col: 0x111114, ry: dir > 0 ? -PI / 2 : PI / 2, crowd: true });
  c.clickable(lst, () => c.egg('list', `You are not on the list for ${name}. Nobody is. The line is the product.`), 'The list');
  const spill = new THREE.PointLight(0xffc890, 0, 5, 1.8); spill.position.set(door[0] + dir * 0.4, 2.2, door[1]); g.add(spill); let tt = Math.random() * 8;
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tt += dt; const open = (tt % 11) < 2.4; spill.intensity += ((open ? 6 : 0.6) - spill.intensity) * Math.min(1, dt * 4); ppl.forEach((e, i) => { e.rotation.z = Math.sin(t * 0.8 + i) * 0.02; }); });
  // the funny ones: a pigeon holding a place, a present too wide for the rope, a man with three cocoa cups
  c.glb('pigeon', { h: 0.28, x: x0 + dir * 0.55, z: z0 + len - 0.3, parent: g, shadow: false });
  { const gift = c.slab(1.4, 0.7, 0.6, std(c, 0x2962ff, { roughness: 0.5 }), x0 + dir * (lanes - 0.5) * W1, 1.05, z0 + 1.2); g.add(gift); g.add(c.slab(1.42, 0.08, 0.62, std(c, 0xd8a640, { metalness: 0.6 }), x0 + dir * (lanes - 0.5) * W1, 1.05, z0 + 1.2));
    c.clickable(gift, () => c.egg('wide', 'A present too wide for the rope. He will be in this line until Valentine\'s Day.'), 'A very wide present'); }
  return { ppl };
}

// THE HOLIDAY MARKET (Union Square, Bryant Park): chalets on three sides, a 3 m aisle, bulbs on poles, a chestnut cart,
// steam, stock, vendors' coats; the online trick: click an ornament and the stall unfolds into an impossible deep workshop
const STALLS = [
  ['CERAMICS', 'cobalt mugs, eye flower dishes, menorahs'], ['ORNAMENTS', 'tiny New Yorkers, pigeons, pretzels'], ['LATKES', 'applesauce or sour cream, no debate'],
  ['CHESTNUTS & COCOA', 'hot, hotter, too hot'], ['KNITWEAR', 'contour river scarves, petal earmuffs'], ['PRINTS', 'MLow prints, folded stars'],
  ['LIGHTS', 'eye flower lamps, repairable strings'], ['GIFT WRAP', 'ribbon, tags, unfinished orders'],
];
function market(c, r, g, X) {
  const { THREE } = c, spots = [[4.6, -4.4, PI / 2], [4.6, -0.6, PI / 2], [4.6, 3.2, PI / 2], [15.4, -4.4, -PI / 2], [15.4, -0.6, -PI / 2], [15.4, 3.2, -PI / 2], [7.6, -6.2, 0], [12.4, -6.2, 0]];
  spots.forEach(([x, z, ry], i) => {
    const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); c.post(X(x), z, 1.5);
    const m = c.glb('lt_chalet', { h: 3.1, parent: o, shadow: true });
    const [name, line] = STALLS[i]; const sg = c.sign(name, { w: 1.8, h: 0.3, bg: '#f2ebdd', fg: '#0d3a24', font: c.SERIF, weight: 900 }); sg.position.set(0, 2.25, 1.32); o.add(sg);
    const warm = new THREE.PointLight(0xffb870, 3.5, 4.2, 1.8); warm.position.set(0, 1.9, 0.7); o.add(warm);
    // the goods on the counter: a row of small coloured things that read as stock
    const cols = [[0x2962ff, 0xf2ebdd], [0xb4161e, 0xd8a640, 0x2962ff], [0xc89048], [0x4a2a16, 0xf2ebdd], [0x2962ff, 0xb4161e, 0x1f6a3a], [0xf2ebdd, 0x2962ff], [0xffd890, 0xf2ebdd], [0xb4161e, 0x2962ff, 0xd8a640]][i];
    for (let k = 0; k < 14; k++) { const b = new THREE.Mesh(i === 1 ? new THREE.SphereGeometry(0.05, 10, 8) : new THREE.BoxGeometry(0.1, 0.1 + Math.random() * 0.08, 0.1), std(c, cols[k % cols.length], { roughness: 0.4, metalness: i === 1 ? 0.6 : 0.05 })); b.position.set(-0.8 + (k % 7) * 0.26, 1.12 + (k > 6 ? 0.0 : 0), 0.75 + (k > 6 ? -0.18 : 0)); o.add(b); }
    if (i === 2 || i === 3) steam(c, o, 0, 1.4, 0.6, 0.7);
    let open = 0, want = 0; const deep = new THREE.Group(); deep.position.set(0, 0, -1.0); o.add(deep); deep.visible = false;
    for (let k = 0; k < 9; k++) { const fr = new THREE.Mesh(new THREE.TorusGeometry(1.2 - k * 0.02, 0.03, 6, 4), new THREE.MeshBasicMaterial({ color: k % 2 ? 0x2962ff : 0x00e5ff, toneMapped: false, transparent: true, opacity: 0.8 - k * 0.07 })); fr.rotation.z = PI / 4; fr.position.set(0, 1.6, -k * 1.4); deep.add(fr); }
    c.clickable(m, () => { want = want ? 0 : 1; deep.visible = true; snd(c, 'whoosh', 0.5, 1.4); c.toast(`${name} · ${line}`, 2600); if (want) c.egg('workshop', 'The stall goes on forever: the workshop behind every market chalet, contour rivers and all. You can only see it from here, and only online.'); }, `${name} stall`);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; open += (want - open) * Math.min(1, dt * 2); deep.scale.set(1, 1, Math.max(0.001, open)); deep.visible = open > 0.01; deep.children.forEach((f, k) => { f.rotation.z = PI / 4 + t * 0.2 * (k % 2 ? 1 : -1); }); });
  });
  // overhead bulb runs on real poles
  const poleM = std(c, 0x1a1a1a, { metalness: 0.7, roughness: 0.4 }), runs = [-4.8, -1.2, 2.4, 5.6], all = [];
  for (const z of runs) { for (const x of [6.2, 13.8]) { g.add(c.slab(0.1, 4.5, 0.1, poleM, x, 2.25, z)); c.post(X(x), z, 0.15); }
    const pts = strand([...Array(17)].map((_, i) => { const u = i / 16; return [3.6 + 12.8 * u, 4.4 - Math.sin(u * PI) * 0.55, z]; }), 0.3).map((p) => [p[0], p[1] - 0.04, p[2], Math.random(), WARM[(Math.random() * 4) | 0]]);
    all.push(...pts); }
  const led = ledPoints(c, g, all, { size: 0.07, gain: 2.0 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); c9Strand(c, g, all, { r });
  prop(c, r, g, X, 'lt_chestnut', 7.4, 5.2, { h: 2.0, ry: 0.4, r: 0.9 }); steam(c, g, 7.4, 1.6, 5.2, 0.8);
  [[7.8, 1.4], [12.2, 1.4], [7.8, -2.8], [12.2, -2.8]].forEach(([x, z]) => { g.add(c.slab(0.7, 0.04, 0.7, std(c, 0x5a3a20, { roughness: 0.6 }), x, 1.08, z)); g.add(c.slab(0.07, 1.08, 0.07, poleM, x, 0.54, z)); c.post(X(x), z, 0.4); });
  litter(c, r, g, { zones: [[7.4, 5.2, 1.0, 0.8], [5.95, 0, 0.35, 6], [14.05, 0, 0.35, 6], [10, -5.6, 2.5, 0.4], [7.8, 1.4, 0.5, 0.5], [12.2, -2.8, 0.5, 0.5]], n: 220 });   // edges, carts and tables, not the middle of the aisle
  c.glb('lt_elf', { h: 1.45, x: 9.0, z: -5.2, parent: g, shadow: true }); c.glb('lt_santa', { h: 1.95, x: 11.4, z: -5.0, ry: -0.3, parent: g, shadow: true });
}

// FESTIVE DRESSING per room: tinsel columns at the shopfronts, mistletoe over doors, wreaths, present stacks, Santas and elves
const FEST = {
  fifth: { gifts: [[16.6, -5.0], [3.4, -5.2]], santa: [[3.0, 2.0, 1.2]], elf: [[16.8, 2.4, -1.4]], line: { x0: 1.9, z0: -3.6, len: 4.5, lanes: 2, dir: 1, door: [1.0, -4.2], name: 'BLOOM & EYE' }, litter: 170 },
  tree: { gifts: [[5.2, -6.0], [14.8, -6.2], [7.0, -6.3]], santa: [[16.4, 2.2, -1.3]], elf: [[3.6, 2.6, 1.3], [12.8, -5.6, 0.2]], line: { x0: 18.1, z0: -1.0, len: 4.5, lanes: 2, dir: -1, door: [19.0, -1.6], name: 'THE PLAZA SHOP' }, litter: 200 },
  channel: { gifts: [[4.4, -6.6]], elf: [[15.8, -6.4, -0.3]], litter: 120 },
  rink: { elf: [[17.2, 5.6, -1.2]], litter: 90 },
  menorah: { gifts: [[17.0, -5.6]], litter: 140 },
  brooklyn: { litter: 160, santa: [[17.6, -2.0, -1.3]] },
  dyker: { gifts: [[4.0, 6.4], [16.6, 6.4]], santa: [[3.0, -1.0, 1.4]], elf: [[16.8, 1.0, -1.4], [3.2, 3.2, 1.4]], litter: 150 },
};
function v5Room(c, r, g, X) {
  const F = FEST[r.id] || {}, { THREE } = c;
  (F.gifts || []).forEach(([x, z]) => prop(c, r, g, X, 'lt_gifts', x, z, { h: 2.3, ry: Math.random() * 6, r: 0.8 }));
  (F.santa || []).forEach(([x, z, ry]) => { const s = c.glb('lt_santa_ef', { h: 1.95, x, z, ry, parent: g }); c.post(X(x), z, 0.4); c.clickable(s, () => c.egg('santas', 'One of many Santas in the city tonight. Statistically, at least one of them is in the wrong line.'), 'A Santa'); });
  (F.elf || []).forEach(([x, z, ry]) => { const s = c.glb('lt_elf', { h: 1.45, x, z, ry, parent: g }); c.post(X(x), z, 0.3); c.clickable(s, () => c.egg('elves', 'An elf on a cigarette break that is actually a cocoa break. The union negotiated it in 1987.'), 'An elf'); });
  if (F.line) storeLine(c, r, g, X, F.line);
  if (F.litter && r.outdoor) litter(c, r, g, { zones: [[2.9, 0, 0.45, 7.5], [W - 3.1, 0, 0.45, 7.5], [1.0, 0, 0.35, 7.5], [W - 1.2, 0, 0.35, 7.5], [10, -6.4, 4, 0.6]], n: F.litter });
  if (r.id === 'market') market(c, r, g, X);
  if (r.id === 'window') apartment(c, r, g, X);
  // mistletoe over every shop door (ARCH sides): the bunch, a ribbon and a small sign
  if (r.arch && !['dyker'].includes(r.id)) [[0.9, -1.2, PI / 2], [W - 1.1, -1.2, -PI / 2]].forEach(([x, z, ry]) => { const m = c.glb('lt_mistletoe', { h: 0.5, x, y: 3.45, z, ry, parent: g, shadow: false }); c.clickable(m, () => c.egg('mistletoe', 'Mistletoe over a shop door on a sidewalk eleven people wide. New Yorkers will kiss a stranger before they will stop walking.'), 'Mistletoe'); });
}

// THE APARTMENT, rebuilt (Astra's brief): a pre war Brooklyn living room carved out of the hall around the window, 11 m by 8.4 m:
// partition walls with a cased opening, picture rail and crown, a mantel with stockings and a wreath, a lit tree by the
// bookcase, an olive sofa and a burgundy chair angled at the window, practical lamps as the light, and twenty small things
function apartment(c, r, g, X) {
  const { THREE } = c, CH = r.ceilH || 3.4, x0 = 4.5, x1 = 15.5, zb = 0.4;
  const plaster = c.surf('acg_plaster001', 1.6, 0xe8dcc4), trim = std(c, 0xf2ece0, { roughness: 0.45 }), walnut = std(c, 0x3a2416, { roughness: 0.5 });
  const wl = (window.WALLS || []).includes('window_l') ? facadeMat(c, 'assets/walls/window_l.jpg', [0.5, 1], [0, 0], 1.0) : plaster;
  const wr = (window.WALLS || []).includes('window_r') ? facadeMat(c, 'assets/walls/window_r.jpg', [0.5, 1], [0.5, 0], 1.0) : plaster;
  if (wl.emissiveIntensity !== undefined) { wl.emissiveIntensity = wr.emissiveIntensity = 0.25; }
  // side partitions from the window wall to the back, and a back wall with a cased opening 2.4 m wide
  g.add(c.slab(0.16, CH, zb + D / 2, wl, x0, CH / 2, (zb - D / 2) / 2)); c.wall(X(x0), -D / 2, X(x0), zb);
  g.add(c.slab(0.16, CH, zb + D / 2, wr, x1, CH / 2, (zb - D / 2) / 2)); c.wall(X(x1), -D / 2, X(x1), zb);
  const ow = 2.4, lw = (x1 - x0 - ow) / 2;
  g.add(c.slab(lw, CH, 0.16, plaster, x0 + lw / 2, CH / 2, zb)); g.add(c.slab(lw, CH, 0.16, plaster, x1 - lw / 2, CH / 2, zb)); g.add(c.slab(ow, CH - 2.3, 0.16, plaster, 10, 2.3 + (CH - 2.3) / 2, zb));
  c.wall(X(x0), zb, X(10 - ow / 2), zb); c.wall(X(10 + ow / 2), zb, X(x1), zb);
  for (const s of [-1, 1]) g.add(c.slab(0.14, 2.36, 0.24, walnut, 10 + s * (ow / 2 + 0.05), 1.18, zb)); g.add(c.slab(ow + 0.3, 0.16, 0.24, walnut, 10, 2.36, zb));
  { const wp = facadeMat(c, 'assets/walls/window_r.jpg', [0.6, 1], [0.2, 0], 1.0); wp.emissiveIntensity = 0.2;
    for (const [xa, xb] of [[x0, 10 - ow / 2], [10 + ow / 2, x1]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa, CH), wp); p.position.set((xa + xb) / 2, CH / 2, zb + 0.09); p.rotation.y = 0; g.add(p); }
    const cast = (r.cast || []).filter((q) => q.f); [[6.0, 1.6], [7.8, 1.75], [12.2, 1.75], [14.0, 1.6]].forEach(([x, y], i) => { if (cast[i]) c.hang(cast[i], X(0) - r.x0 + x, y, zb + 0.14, 0, i % 2 ? 0.95 : 0.75, 'oak', g); });
    prop(c, r, g, X, 'ph_vintage_cabinet_01', 5.6, zb + 0.5, { h: 0.95, r: 0.4 }); prop(c, r, g, X, 'ph_potted_plant_01', 14.8, zb + 0.5, { h: 1.1, r: 0.3 });
    const run = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4.0), new THREE.MeshStandardMaterial({ color: 0x3a1a20, roughness: 0.95 })); run.rotation.x = -PI / 2; run.position.set(10, 0.011, zb + 2.2); g.add(run); }
  // picture rail, crown and baseboard on the three new walls
  const runs = [[x0 + 0.09, -D / 2, x0 + 0.09, zb, PI / 2], [x1 - 0.09, -D / 2, x1 - 0.09, zb, -PI / 2]];
  for (const [xa, za, xb, zb2] of runs) { const L = zb2 - za, cz = (za + zb2) / 2; for (const [y, h, d] of [[0.08, 0.16, 0.03], [2.55, 0.04, 0.03], [CH - 0.07, 0.14, 0.09]]) g.add(c.slab(0.06 + d, h, L, trim, xa, y, cz)); }
  for (const [y, h, d] of [[0.08, 0.16, 0.06], [2.55, 0.04, 0.06], [CH - 0.07, 0.14, 0.12]]) { g.add(c.slab(lw, h, d, trim, x0 + lw / 2, y, zb - 0.1)); g.add(c.slab(lw, h, d, trim, x1 - lw / 2, y, zb - 0.1)); }
  // the mantel on the left partition: firebox, shelf, stockings, wreath, two candlesticks
  const mx = x0 + 0.1, mz = -2.6, mantel = new THREE.Group(); mantel.position.set(mx, 0, mz); mantel.rotation.y = PI / 2; g.add(mantel);
  mantel.add(c.slab(1.9, 1.15, 0.32, std(c, 0xece4d4, { roughness: 0.5 }), 0, 0.575, 0.16)); mantel.add(c.slab(0.9, 0.75, 0.05, std(c, 0x0e0c0a, { roughness: 1 }), 0, 0.38, 0.33)); mantel.add(c.slab(2.1, 0.07, 0.42, walnut, 0, 1.18, 0.2));
  ['#b4161e', '#2962ff', '#1f6a3a', '#f2ebdd'].forEach((col, i) => { const st = c.sign(['MLOW', 'N3W', 'ELF', 'PIGEON'][i], { w: 0.22, h: 0.36, bg: col, fg: col === '#f2ebdd' ? '#0d1b4a' : '#f2ebdd', font: c.SERIF, weight: 900 }); st.position.set(-0.6 + i * 0.4, 0.95, 0.43); mantel.add(st); });
  wreath(c, mantel, 0, 1.85, 0.08, 0, 0.36); for (const s of [-0.85, 0.85]) { mantel.add(c.slab(0.05, 0.28, 0.05, std(c, 0xc8a040, { metalness: 1, roughness: 0.3 }), s, 1.35, 0.2)); flameSprite(c, mantel, s, 1.56, 0.2, 0.07).visible = true; }
  c.post(X(mx + 0.3), mz, 1.0);
  // the tree by the bookcase, right partition
  const tx = x1 - 1.0, tz = -2.2; prop(c, r, g, X, 'ph_fir_tree_01', tx, tz, { h: 2.4, r: 0.6 });
  { const pts = []; for (let i = 0; i < 300; i++) { const u = i / 300, a = u * 9 * PI * 2, rr = (1 - u) * 0.62 + 0.04; pts.push([tx + Math.cos(a) * rr, 0.25 + u * 2.05, tz + Math.sin(a) * rr, Math.random(), [1, 0.78, 0.45]]); }
    const led = ledPoints(c, g, pts, { size: 0.05, gain: 2.2 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); }
  prop(c, r, g, X, 'ph_wooden_bookshelf_worn', x1 - 0.3, -4.4, { h: 2.2, ry: -PI / 2, r: 0.5 });
  // seating angled at the window, a coffee table, a rug, lamps that are the light
  prop(c, r, g, X, 'ph_sofa_02', 8.2, -4.2, { len: 2.1, ry: PI - 0.35, r: 0.9 }); prop(c, r, g, X, 'ph_ArmChair_01', 12.6, -4.6, { h: 1.0, ry: PI + 0.5, r: 0.6 });
  prop(c, r, g, X, 'ph_coffee_table_round_01', 10.2, -4.9, { len: 1.0, r: 0.6 });
  { const rug = c.canvasTex(512, 384, (q, w, h) => { q.fillStyle = '#5a1a1e'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a040'; q.lineWidth = 10; q.strokeRect(18, 18, w - 36, h - 36); q.strokeStyle = '#1d2a4a'; q.lineWidth = 22; q.strokeRect(46, 46, w - 92, h - 92); for (let i = 0; i < 9; i++) eyeFlower(q, 110 + (i % 3) * 146, 110 + Math.floor(i / 3) * 82, 22); });
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), new THREE.MeshStandardMaterial({ map: rug, roughness: 0.95 })); rm.rotation.x = -PI / 2; rm.position.set(10.2, 0.012, -4.6); g.add(rm); }
  [[7.0, -4.0, 0xffb060], [13.6, -5.6, 0xffc070]].forEach(([x, z, col]) => { prop(c, r, g, X, 'nyb_loft_lamp', x, z, { h: 1.6, r: 0.25 }); const L = new THREE.PointLight(col, 4.5, 6, 1.8); L.position.set(x, 1.5, z); g.add(L); });
  // twenty small things (Astra's list), each a little mesh on the coffee table, sill and mantel
  const small = [[10.0, 0.47, -4.9, 'mug', 0xb4161e], [10.35, 0.47, -4.75, 'mug', 0x2962ff], [10.2, 0.46, -5.15, 'bowl', 0xf08a20], [9.85, 0.45, -5.05, 'book', 0x1d2a4a], [10.55, 0.45, -5.0, 'plate', 0xf2ece0],
    [10.45, 0.48, -4.6, 'dreidel', 0x2962ff], [9.95, 0.45, -4.65, 'gelt', 0xd8a640], [10.6, 0.45, -5.25, 'keys', 0x2962ff], [9.75, 0.45, -4.85, 'glasses', 0x111111], [10.3, 0.45, -4.5, 'card', 0xf2ebdd]];
  small.forEach(([x, y, z, k, col]) => { let m;
    if (k === 'mug') m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 16), std(c, col, { roughness: 0.4 }));
    else if (k === 'bowl') { m = new THREE.Group(); m.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 8, 0, PI * 2, PI / 2, PI / 2), std(c, 0xf2ece0, { roughness: 0.3, side: THREE.DoubleSide }))); for (let i = 0; i < 5; i++) m.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), std(c, col, { roughness: 0.6 })).translateX((i - 2) * 0.04).translateY(-0.03)); }
    else if (k === 'book') m = c.slab(0.2, 0.04, 0.14, std(c, col, { roughness: 0.8 }), 0, 0, 0);
    else if (k === 'plate') m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.015, 20), std(c, col, { roughness: 0.3 }));
    else if (k === 'dreidel') m = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), std(c, col, { roughness: 0.5 }));
    else if (k === 'gelt') m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 16), std(c, col, { metalness: 1, roughness: 0.3 }));
    else if (k === 'card') m = c.slab(0.12, 0.002, 0.16, std(c, col), 0, 0, 0);
    else m = c.slab(0.08, 0.02, 0.04, std(c, col, { metalness: 0.6 }), 0, 0, 0);
    m.position.set(x, y, z); g.add(m); });
  // latkes on the plate, a ceramic menorah on the radiator shelf, a ribbon spool
  for (let i = 0; i < 2; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.014, 12), std(c, 0xc88a3a, { roughness: 0.8 })); l.position.set(10.53 + i * 0.05, 0.47, -5.0 + i * 0.03); g.add(l); }
  // the city is cool outside the window; warm inside; the old ceiling floodlights are gone (rooms.js)
  r.apartmentBuilt = true;
}
