// THE WRAP: an escape room on a soundstage, built the way the New York rooms are built (ESCAPE_ROOM_RESEARCH_2026-10-12.md).
// Sixty minutes on the clock like every room in the city, six puzzles: two linear to teach the hands, three branches
// that each hand you a token, one meta door that wants all three. No red herrings, no hunting, no maths beyond
// ordering, every clue in the sightline of its lock, and an emergency exit that is never locked, because by law none is.
// 2026-10-12.
const PI = Math.PI;
const here = (r, ri) => ri === r.i;

export const PROPS = {
  wrap: [
    ['WoodenTable_01', 2.4, -4.2, { len: 1.5, ry: PI / 2, r: 0.75 }], ['desk_lamp_arm_01', 2.1, -4.9, { h: 0.5, y: 0.78, ry: 0.5 }],
    ['office_notepads', 2.7, -3.7, { len: 0.3, y: 0.78, ry: 0.3 }], ['clipboard', 2.3, -4.1, { len: 0.34, y: 0.79, ry: -0.6 }],
    ['wooden_crate_01', 4.8, -6.6, { len: 0.8, r: 0.5 }], ['Television_01', 4.8, -6.6, { h: 0.55, y: 0.5, ry: PI, egg: ['The game master', 'wrap_gm', 'The monitor in every room in the city: the game master, watching, with a hint when you ask.'] }],
    ['metal_trash_can', 0.8, 0.4, { h: 0.9, r: 0.35 }], ['cardboard_box_01', 6.2, -7.2, { h: 0.5, r: 0.4 }], ['cardboard_box_01', 6.0, -7.1, { h: 0.45, y: 0.5, ry: 0.5 }],
    ['ladder_sectioned_01', 0.5, -7.0, { h: 3.6, ry: PI / 2, r: 0.3 }], ['folding_wooden_stool', 3.6, -3.4, { h: 0.5, r: 0.3 }],
    ['nyb_milkcrate_pink', 17.6, -7.3, { h: 0.32 }], ['nyb_milkcrate_cyan', 17.6, -7.3, { h: 0.32, y: 0.32, ry: 0.4 }],
    ['WetFloorSign_01', 14.2, -1.2, { h: 0.6 }], ['Barrel_01', 8.2, -7.1, { h: 0.9, r: 0.45 }],
  ],
};

export const SWAP = {};

// ---------- the answers, in one place ----------
const CODE = '7412';                        // the four slates, in call time order across midnight
const DIRS = ['U', 'L', 'D', 'D', 'R', 'U'];  // the one sheet under the torch
const WORD = 'TOKEN';                       // the bodega shelves counted, through the key card
const CHART = ['up', 'half', 'down', 'up'];  // pink, blue, gold, cyan on the lighting board
const SLATES = [['SCENE 7', '23:40'], ['SCENE 1', '01:15'], ['SCENE 4', '00:20'], ['SCENE 2', '02:00']];
const SHELF = [3, 1, 4, 2, 5];              // items per shelf, top to bottom
const KEYCARD = [['1', 'O'], ['2', 'E'], ['3', 'T'], ['4', 'K'], ['5', 'N']];
const MINUTES = 60;

const HINTS = {
  cage: ['The prop cage wants four digits. Four slates lie about the stage, each with a call time. The office board says how to read them.', 'A night shoot runs past midnight: the earliest call is the one before twelve. Put the scene numbers in that order.', 'Twenty three forty, then twenty past twelve, then one fifteen, then two. The code is 7 4 1 2.'],
  torch: ['The cage held a torch. It is not for seeing by. The one sheet on the south wall holds more than it shows.', 'Take the torch to the poster and click the poster. Ultraviolet finds what the work light misses.'],
  case: ['The glowing marks on the poster are a route, read left to right. The flight case by the south wall has the lock they fit.', 'Up, left, down, down, right, up. Six presses, then TRY.'],
  board: ['Locker 3 is wired to the lighting board by the stage. The chart that sets the board is pinned in the office.', 'Pink up, blue halfway, gold down, cyan up. Click a fader to move it. The locker pops when the board matches.'],
  bodega: ['The word lock wants five letters. Count what sits on each bodega shelf, top to bottom, then read the key card beside the lotto board.', 'Three, one, four, two, five. The card turns each count into a letter.', 'The word is TOKEN.'],
  door: ['The stage door wants the word, the card and the key. Any order. The card came out of the flight case, the key out of locker 3.'],
};

export const ROOM = {
  wrap(c, r, g, X, K) {
    const { THREE } = c, W = K.W, D = K.D;
    const steel = K.std(0x2a2c30, { metalness: 0.8, roughness: 0.35 }), dark = K.std(0x111214, { roughness: 0.9 }), gold = K.std(0xf5c542, { metalness: 0.6, roughness: 0.3 });
    const paper = '#f4ead2', ink = '#111318';
    const S = { on: false, done: {}, held: {}, hints: 0, t0: 0, left: MINUTES * 60, lastSolve: 0, nudged: 0, over: false, faders: ['down', 'down', 'down', 'down'], dirs: [] };
    r.wrap = S;

    // ---------- the stage: a loading dock gate across the portal, so the only ways out are the two doors ----------
    const gateT = c.canvasTex(512, 256, (q, w, h) => { q.fillStyle = '#3a3d42'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { q.fillStyle = y % 32 ? '#2e3136' : '#45484e'; q.fillRect(0, y, w, 8); } q.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 0; x < w; x += 128) q.fillRect(x, 0, 3, h);
      q.fillStyle = '#f5c542'; q.font = `900 46px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAGE 4', w / 2, h * 0.58); q.font = `700 20px ${c.MONO}`; q.fillText('KAUFMAN ASTORIA  ·  NO ADMITTANCE AFTER WRAP', w / 2, h * 0.8); });
    gateT.wrapS = THREE.RepeatWrapping; gateT.repeat.x = 1;
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(K.PORTAL.w, K.PORTAL.h), new THREE.MeshStandardMaterial({ map: gateT, roughness: 0.6, metalness: 0.5 })); gate.position.set(W / 2, K.PORTAL.h / 2, -D / 2 + 0.25); g.add(gate);
    c.wall(X(0), -D / 2 + 0.6, X(W), -D / 2 + 0.6);
    // overhead: a lighting grid with four fresnels, two on, two off (the stage is half struck)
    const grid = K.std(0x1a1a1c, { metalness: 0.7, roughness: 0.5 });
    [-5, -1, 3].forEach((z) => g.add(c.slab(W - 1, 0.1, 0.1, grid, W / 2, 5.5, z))); [4, 10, 16].forEach((x) => g.add(c.slab(0.1, 0.1, D - 2, grid, x, 5.5, 0)));
    [[4, -5, 1], [16, -5, 0], [7, 3, 1], [13, 3, 0]].forEach(([x, z, on]) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 14), steel); h.position.set(x, 5.15, z); h.rotation.x = PI / 2 - 0.4; g.add(h);
      if (on) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,230,180,.6)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(1.4, 1.4, 1); s.position.set(x, 4.9, z + 0.2); g.add(s); } });
    // the floor: taped marks, a cable run, the stage edge
    const tape = (x, z, w, d, col = '#f5c542') => { const t = K.decal(w, d, (q, cw, ch) => { q.fillStyle = col; q.fillRect(0, 0, cw, ch); }, 16); t.rotation.x = -PI / 2; t.position.set(x, 0.012, z); g.add(t); };
    tape(10, 3.2, 1.2, 0.06); tape(10, 3.2, 0.06, 1.2); [[7.0, -2.6], [13.0, -2.6]].forEach(([x, z]) => { tape(x, z, 0.5, 0.05, '#ff4fa3'); tape(x, z, 0.05, 0.5, '#ff4fa3'); });
    for (let x = 1; x < 19; x += 0.9) tape(x + 0.45, 1.9, 0.9, 0.05, '#22d3ee');

    // ---------- the office corner (west): boards on the wall, the desk, the monitor ----------
    const board = (text, x, z, w, h, ry, o = {}) => { const s = c.sign(text, { w, h, bg: o.bg || paper, fg: o.fg || ink, font: o.font || c.MONO, weight: o.weight || 700, border: o.border || '#1d4ed8', px: o.px || 320, pad: 0.08 }); s.position.set(x, o.y || 2.0, z); s.rotation.y = ry; g.add(s); return s; };
    board('PRODUCTION BOARD\nNIGHT SHOOT  ·  CALL 22:00\nTIMES RUN PAST MIDNIGHT\nSHOOTING ORDER = CALL TIME\nEARLIEST FIRST', 0.15, -4.4, 2.6, 1.6, PI / 2);
    board('LIGHTING CHART  ·  STRIKE\nPINK   UP\nBLUE   HALF\nGOLD   DOWN\nCYAN   UP', 0.15, -1.6, 2.0, 1.5, PI / 2, { border: '#ff4fa3' });
    board('STAGE 4  ·  WRAP\nLOCKED 02:00\nSTAGE DOOR OPENS WITH\nTHE WORD, THE CARD\nAND THE KEY\nCLAP THE SLATE TO START', 1.4, 1.2, 1.5, 1.6, 0.9, { y: 1.3, bg: '#0b1020', fg: paper, border: '#f5c542' });
    g.add(c.slab(0.05, 1.3, 0.05, steel, 1.4, 0.65, 1.2)); c.post(X(1.4), 1.2, 0.3);
    // the game master's monitor on its crate: a hint a click
    const scr = c.canvasTex(512, 320, (q, w, h) => { q.fillStyle = '#0b1020'; q.fillRect(0, 0, w, h); });
    const sq = scr.userData.canvas.getContext('2d');
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })); screen.position.set(4.8, 0.78, -6.37); g.add(screen);
    const drawScreen = (lines, col = '#22d3ee') => { sq.fillStyle = '#0b1020'; sq.fillRect(0, 0, 512, 320); sq.fillStyle = col; sq.font = `700 26px ${c.MONO}`; sq.textAlign = 'left';
      lines.forEach((l, i) => sq.fillText(l, 24, 60 + i * 38)); sq.fillStyle = 'rgba(34,211,238,.12)'; for (let y = 0; y < 320; y += 4) sq.fillRect(0, y, 512, 1); scr.needsUpdate = true; };
    drawScreen(['GAME MASTER', 'STAGE 4 · STANDING BY', '', 'click for a hint', 'once the clock runs']);
    // the walkie on the desk: the production manager, with a nudge
    const walkie = new THREE.Group(); walkie.position.set(1.9, 0.78, -3.6); g.add(walkie); walkie.add(c.slab(0.07, 0.18, 0.04, dark, 0, 0.09, 0)); walkie.add(c.slab(0.012, 0.16, 0.012, steel, 0.02, 0.26, 0));
    const wlight = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), K.basic(0xff3030)); wlight.position.set(-0.02, 0.17, 0.021); walkie.add(wlight);
    K.extra(g, 3.4, -5.6, { col: 0x1d4ed8, ry: 0.6 }); c.post(X(3.4), -5.6, 0.3);

    // ---------- the stage (middle): the slate on its stand, the four slates, the prop cage ----------
    const clap = new THREE.Group(); clap.position.set(10, 0, 3.2); g.add(clap); clap.add(c.slab(0.05, 1.1, 0.05, steel, 0, 0.55, 0)); c.post(X(10), 3.2, 0.3);
    const clapT = K.decal(0.7, 0.56, (q, w, h) => { q.fillStyle = '#121212'; q.fillRect(0, h * 0.22, w, h * 0.78); for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#121212' : paper; q.beginPath(); q.moveTo(i * w / 8, 0); q.lineTo((i + 1) * w / 8, 0); q.lineTo((i + 1.5) * w / 8, h * 0.2); q.lineTo((i + 0.5) * w / 8, h * 0.2); q.fill(); }
      q.fillStyle = paper; q.font = `900 ${h * 0.16}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE WRAP', w / 2, h * 0.5); q.font = `700 ${h * 0.09}px ${c.MONO}`; q.fillText('CLAP TO START THE CLOCK', w / 2, h * 0.68); q.fillText('60:00', w / 2, h * 0.86); }, 256);
    clapT.position.set(0, 1.38, 0.03); clap.add(clapT); const clapTop = c.slab(0.7, 0.12, 0.03, dark, 0, 1.72, 0.02); clap.add(clapTop);
    const slateAt = (x, z, ry, [sc, tm]) => { const box = c.slab(0.9, 0.5, 0.6, K.std(0x1b1b1e, { metalness: 0.5, roughness: 0.5 }), x, 0.25, z); g.add(box); c.post(X(x), z, 0.55);
      const d = K.decal(0.62, 0.5, (q, w, h) => { q.fillStyle = '#121212'; q.fillRect(0, h * 0.2, w, h * 0.8); for (let i = 0; i < 6; i++) { q.fillStyle = i % 2 ? '#121212' : paper; q.fillRect(i * w / 6, 0, w / 6, h * 0.18); }
        q.fillStyle = paper; q.font = `900 ${h * 0.2}px ${c.SERIF}`; q.textAlign = 'left'; q.fillText(sc, w * 0.08, h * 0.5); q.font = `700 ${h * 0.14}px ${c.MONO}`; q.fillText('CALL ' + tm, w * 0.08, h * 0.74); q.fillText('TAKE 1', w * 0.6, h * 0.74); q.fillStyle = '#f5c542'; q.font = `700 ${h * 0.1}px ${c.MONO}`; q.fillText('THE WRAP  ·  DIR. MLow', w * 0.08, h * 0.92); }, 256);
      d.position.set(x, 0.72, z); d.rotation.y = ry; d.rotation.x = -0.35; g.add(d); c.clickable(d, () => c.toast(`${sc}. Call ${tm}.`, 2200), 'A slate'); };
    slateAt(7.0, -2.6, 0.4, SLATES[0]); slateAt(13.0, -2.6, -0.4, SLATES[1]); slateAt(7.4, 0.6, 0.2, SLATES[2]); slateAt(12.6, 0.6, -0.2, SLATES[3]);
    // the prop cage: chain link on a frame, a padlock on the gate
    const mesh = c.canvasTex(128, 128, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(200,205,210,.9)'; q.lineWidth = 2; for (let k = -h; k < w + h; k += 16) { q.beginPath(); q.moveTo(k, 0); q.lineTo(k + h, h); q.stroke(); q.beginPath(); q.moveTo(k, h); q.lineTo(k + h, 0); q.stroke(); } });
    mesh.wrapS = mesh.wrapT = THREE.RepeatWrapping; mesh.repeat.set(6, 5);
    const chain = new THREE.MeshBasicMaterial({ map: mesh, transparent: true, side: THREE.DoubleSide, toneMapped: false, color: 0xb8bcc2 });
    const cage = new THREE.Group(); cage.position.set(10, 0, -5.6); g.add(cage);
    const CW = 3.0, CD = 2.2, CH = 2.4;
    [[0, -CD / 2, 0], [-CW / 2, 0, PI / 2], [CW / 2, 0, PI / 2]].forEach(([x, z, ry]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(ry ? CD : CW, CH), chain); p.position.set(x, CH / 2, z); p.rotation.y = ry; cage.add(p); });
    const top = new THREE.Mesh(new THREE.PlaneGeometry(CW, CD), chain); top.rotation.x = PI / 2; top.position.y = CH; cage.add(top);
    [[-CW / 2, -CD / 2], [CW / 2, -CD / 2], [-CW / 2, CD / 2], [CW / 2, CD / 2]].forEach(([x, z]) => cage.add(c.slab(0.08, CH, 0.08, steel, x, CH / 2, z)));
    const cageDoor = new THREE.Group(); cageDoor.position.set(-CW / 2, 0, CD / 2); cage.add(cageDoor);
    const cd = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), chain); cd.position.set(CW / 2, CH / 2, 0); cageDoor.add(cd); cageDoor.add(c.slab(CW, 0.06, 0.06, steel, CW / 2, CH - 0.03, 0)); cageDoor.add(c.slab(CW, 0.06, 0.06, steel, CW / 2, 0.03, 0));
    const padlock = new THREE.Group(); padlock.position.set(CW * 0.5 + 0.4, 1.1, 0.06); cageDoor.add(padlock); padlock.add(c.slab(0.16, 0.14, 0.06, gold, 0, 0, 0)); const sh = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16, PI), steel); sh.position.y = 0.08; padlock.add(sh);
    c.wall(X(10 - CW / 2), -5.6 - CD / 2, X(10 + CW / 2), -5.6 - CD / 2); c.wall(X(10 - CW / 2), -5.6 - CD / 2, X(10 - CW / 2), -5.6 + CD / 2); c.wall(X(10 + CW / 2), -5.6 - CD / 2, X(10 + CW / 2), -5.6 + CD / 2);
    const cageFront = c.wall(X(10 - CW / 2), -5.6 + CD / 2, X(10 + CW / 2), -5.6 + CD / 2);
    const cageSign = c.sign('PROP CAGE  ·  4 DIGITS', { w: 1.3, h: 0.22, bg: '#0b1020', fg: paper, font: c.MONO, weight: 700, border: '#f5c542' }); cageSign.position.set(10, CH + 0.25, -5.6 + CD / 2); g.add(cageSign);
    // inside: the torch and the locker tag
    const torch = new THREE.Group(); torch.position.set(9.4, 0, -5.8); cage.add(torch); torch.position.set(-0.6, 0, -0.2);
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.26, 10), K.std(0x2a0a4a, { metalness: 0.5 })); tb.rotation.z = PI / 2; tb.position.set(0, 0.49, 0); torch.add(tb);
    // 2026-10-28: a real torch (Poly Haven small_plastic_torch, CC0, already in the kit) lying on the case, a little purple in its
    // yellow; the cylinder hides once it lands, the UV glow stays
    c.glb('ph_small_plastic_torch', { len: 0.26, y: 0.46, ry: PI / 2, parent: torch, shadow: false, onload: (gg) => { tb.visible = false; gg.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.lerp(new THREE.Color(0x8a4aff), 0.45); } }); } });
    const tglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(160,80,255,.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); tglow.scale.set(0.5, 0.5, 1); tglow.position.set(0.16, 0.49, 0); torch.add(tglow);
    cage.add(c.slab(0.9, 0.46, 0.5, K.std(0x1b1b1e), -0.6, 0.23, -0.2)); const tag = c.sign('LOCKER 3\nGAFFER', { w: 0.34, h: 0.22, bg: '#f5c542', fg: ink, font: c.MONO, weight: 800 }); tag.position.set(0.5, 0.6, -0.2); tag.rotation.x = -0.6; cage.add(tag);
    cage.add(c.slab(0.9, 0.46, 0.5, K.std(0x1b1b1e), 0.6, 0.23, -0.2));

    // ---------- the south wall: the one sheet, the flight case ----------
    const poster = K.decal(1.3, 1.9, (q, w, h) => { q.fillStyle = '#0b1020'; q.fillRect(0, 0, w, h); const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d4ed8'); gr.addColorStop(1, '#0b1020'); q.fillStyle = gr; q.fillRect(0, 0, w, h * 0.72);
      K.eyeFlower(q, w / 2, h * 0.36, w * 0.26); q.fillStyle = paper; q.font = `900 ${w * 0.17}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE WRAP', w / 2, h * 0.82); q.font = `700 ${w * 0.055}px ${c.MONO}`; q.fillText('A NEW YORKERS PICTURE  ·  ONE NIGHT ON STAGE 4', w / 2, h * 0.89); q.fillText('NOTHING TO SEE HERE IN THIS LIGHT', w / 2, h * 0.95); }, 512);
    poster.position.set(7.0, 2.0, D / 2 - 0.13); poster.rotation.y = PI; g.add(poster);
    const uv = K.decal(1.3, 1.9, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(170,90,255,.95)'; q.lineWidth = 9; q.lineCap = 'round'; const s = w * 0.11, y0 = h * 0.62;
      DIRS.forEach((d, k) => { const x = w * 0.12 + k * (w * 0.76 / 5); q.beginPath(); if (d === 'U') { q.moveTo(x - s / 2, y0 + s / 2); q.lineTo(x, y0 - s / 2); q.lineTo(x + s / 2, y0 + s / 2); } if (d === 'D') { q.moveTo(x - s / 2, y0 - s / 2); q.lineTo(x, y0 + s / 2); q.lineTo(x + s / 2, y0 - s / 2); }
        if (d === 'L') { q.moveTo(x + s / 2, y0 - s / 2); q.lineTo(x - s / 2, y0); q.lineTo(x + s / 2, y0 + s / 2); } if (d === 'R') { q.moveTo(x - s / 2, y0 - s / 2); q.lineTo(x + s / 2, y0); q.lineTo(x - s / 2, y0 + s / 2); } q.stroke(); });
      q.fillStyle = 'rgba(170,90,255,.9)'; q.font = `700 ${w * 0.06}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('THE CASE  ·  LEFT TO RIGHT', w / 2, h * 0.74); }, 512);
    uv.material = new THREE.MeshBasicMaterial({ map: uv.material.map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); uv.position.set(7.0, 2.0, D / 2 - 0.12); uv.rotation.y = PI; uv.visible = false; g.add(uv);
    const fc = new THREE.Group(); fc.position.set(13.6, 0, 6.6); g.add(fc); fc.add(c.slab(1.4, 0.7, 0.9, K.std(0x16181c, { metalness: 0.6, roughness: 0.4 }), 0, 0.35, 0)); [[-0.7, 0], [0.7, 0]].forEach(([x]) => fc.add(c.slab(0.06, 0.7, 0.9, steel, x, 0.35, 0))); c.post(X(13.6), 6.6, 0.9);
    const fcLid = c.slab(1.4, 0.08, 0.9, K.std(0x16181c, { metalness: 0.6, roughness: 0.4 }), 0, 0.74, 0); fc.add(fcLid);
    const dpad = new THREE.Group(); dpad.position.set(0, 0.42, -0.46); fc.add(dpad); dpad.add(c.slab(0.3, 0.3, 0.03, dark, 0, 0, 0)); [[0, 0.09], [0, -0.09], [-0.09, 0], [0.09, 0]].forEach(([x, y]) => dpad.add(c.slab(0.06, 0.06, 0.02, gold, x, y, 0.02)));
    const fcSign = c.sign('FLIGHT CASE  ·  DIRECTIONAL', { w: 1.2, h: 0.18, bg: '#0b1020', fg: paper, font: c.MONO, weight: 700, border: '#f5c542' }); fcSign.position.set(13.6, 1.0, 6.1); g.add(fcSign);
    const card = c.sign('N3W TRANSIT', { w: 0.26, h: 0.16, bg: '#f5c542', fg: ink, font: c.MONO, weight: 800 }); card.position.set(0.2, 0.72, 0); card.rotation.x = -PI / 2; card.visible = false; fc.add(card);

    // ---------- the bodega flat (east): shelves to count, the lotto board, the key card ----------
    const shelfM = K.std(0x4a3626, { roughness: 0.8 }), cols = [0xc8102e, 0x1d4ed8, 0xf5c542, 0x22d3ee, 0xff4fa3];
    const names = ['NAZAR COLA', 'EYE CRUNCH', 'TOKENS', 'N3W BELL', 'DR. EYE'];
    SHELF.forEach((n, i) => { const y = 2.5 - i * 0.46; g.add(c.slab(0.5, 0.03, 4.4, shelfM, 19.3, y, -4.2));
      for (let k = 0; k < n; k++) { const z = -4.2 + (k - (n - 1) / 2) * 0.5; const it = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 12), K.std(cols[i], { roughness: 0.4, metalness: 0.2 })); it.position.set(19.3, y + 0.145, z); g.add(it);
        const lab = c.sign(names[i], { w: 0.2, h: 0.1, bg: null, fg: paper, font: c.MONO, weight: 800, px: 64 }); lab.position.set(19.19, y + 0.15, z); lab.rotation.y = -PI / 2; g.add(lab); } });
    c.wall(X(19.0), -6.6, X(19.0), -1.8);
    board('LOTTO  ·  TONIGHT\'S NUMBERS\nCOUNT EACH SHELF\nTOP TO BOTTOM\nFIVE SHELVES, FIVE LETTERS', 19.6, 0.2, 1.6, 1.1, -PI / 2, { bg: '#c8102e', fg: paper, border: paper });
    board('KEY CARD\n' + KEYCARD.map(([n, l]) => `${n}  =  ${l}`).join('\n'), 19.6, 1.5, 0.9, 1.3, -PI / 2, { y: 1.6, bg: paper, fg: ink, border: '#22d3ee' });
    const fridge = c.slab(1.2, 2.2, 0.9, K.std(0xd8dde2, { metalness: 0.3, roughness: 0.4 }), 16.4, 1.1, -7.3); g.add(fridge); c.post(X(16.4), -7.3, 0.8);
    const fr = c.sign('NAZAR COLA', { w: 1.0, h: 0.3, bg: '#c8102e', fg: paper, font: c.FONT, weight: 900 }); fr.position.set(16.4, 2.0, -6.84); g.add(fr);
    // the lighting board by the stage: four faders
    const lb = new THREE.Group(); lb.position.set(14.6, 0, 3.2); lb.rotation.y = -0.4; g.add(lb); lb.add(c.slab(1.3, 0.9, 0.5, dark, 0, 0.45, 0)); lb.add(c.slab(1.3, 0.04, 0.5, steel, 0, 0.92, 0)); c.post(X(14.6), 3.2, 0.7);
    const fcol = [0xff4fa3, 0x1d4ed8, 0xf5c542, 0x22d3ee], knobs = [];
    fcol.forEach((col, k) => { const x = -0.45 + k * 0.3; lb.add(c.slab(0.03, 0.02, 0.36, steel, x, 0.95, 0)); const kn = c.slab(0.12, 0.05, 0.06, K.std(col), x, 0.98, 0.17); lb.add(kn); knobs.push(kn);
      const hit = c.slab(0.26, 0.08, 0.5, new THREE.MeshBasicMaterial({ visible: false }), x, 0.96, 0); lb.add(hit); c.clickable(hit, () => fader(k), ['Pink', 'Blue', 'Gold', 'Cyan'][k] + ' fader'); });
    const lbSign = c.sign('LIGHTING BOARD  ·  SET TO THE CHART', { w: 1.3, h: 0.16, bg: '#0b1020', fg: paper, font: c.MONO, weight: 700, border: '#ff4fa3' }); lbSign.position.set(0, 1.25, -0.2); lb.add(lbSign);
    const placeFaders = () => knobs.forEach((kn, k) => { kn.position.z = S.faders[k] === 'up' ? -0.17 : S.faders[k] === 'half' ? 0 : 0.17; });
    placeFaders();
    // the lockers in the south east corner: three doors, the third wired to the board
    const lk = new THREE.Group(); lk.position.set(18.9, 0, 6.9); lk.rotation.y = -PI / 2; g.add(lk); c.post(X(18.9), 6.9, 0.8);
    lk.add(c.slab(1.5, 2.0, 0.5, K.std(0x2f5a3a, { metalness: 0.5, roughness: 0.5 }), 0, 1.0, 0));
    const lkDoors = [-0.5, 0, 0.5].map((x, k) => { const d = new THREE.Group(); d.position.set(x - 0.24, 0, 0.26); lk.add(d); const p = c.slab(0.46, 1.9, 0.03, K.std(0x3a6a46, { metalness: 0.5, roughness: 0.45 }), 0.24, 1.0, 0); d.add(p);
      const n = c.sign(String(k + 1), { w: 0.14, h: 0.14, bg: paper, fg: ink, font: c.MONO, weight: 900, px: 64 }); n.position.set(0.24, 1.7, 0.02); d.add(n); c.clickable(p, () => locker(k), `Locker ${k + 1}`); return d; });
    const key = new THREE.Group(); key.position.set(0.26, 1.0, 0.1); lk.add(key); key.visible = false; const kb = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16), gold); key.add(kb); key.add(c.slab(0.02, 0.14, 0.012, gold, 0, -0.1, 0));

    // ---------- the stage door (the east door) with its crash bar and three locks, and the two gates ----------
    const DZ1 = 2, DZ2 = 5.6, bar = new THREE.Group(); bar.position.set(19.35, 0, (DZ1 + DZ2) / 2); g.add(bar);
    bar.add(c.slab(0.08, 0.1, DZ2 - DZ1 - 0.3, steel, 0, 1.05, 0));
    const wordLock = c.sign('WORD', { w: 0.34, h: 0.16, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 800, px: 96 }); wordLock.position.set(-0.06, 1.3, -1.2); wordLock.rotation.y = -PI / 2; bar.add(wordLock);
    const reader = c.slab(0.06, 0.26, 0.16, dark, -0.04, 1.3, 0); bar.add(reader); const rlight = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), K.basic(0xff3030)); rlight.position.set(-0.08, 1.4, 0); bar.add(rlight);
    const keyhole = c.slab(0.06, 0.16, 0.16, gold, -0.04, 1.3, 1.2); bar.add(keyhole); const kh = c.slab(0.07, 0.05, 0.02, dark, -0.045, 1.3, 1.2); bar.add(kh);
    const barWall = c.wall(X(19.3), DZ1, X(19.3), DZ2); barWall.off = true; bar.position.y = 1.5;
    const doorSign = c.sign('STAGE DOOR  ·  WORD  ·  CARD  ·  KEY', { w: 2.4, h: 0.22, bg: '#0b1020', fg: paper, font: c.MONO, weight: 700, border: '#f5c542' }); doorSign.position.set(19.2, 3.75, (DZ1 + DZ2) / 2); doorSign.rotation.y = -PI / 2; g.add(doorSign);
    const gateM = new THREE.MeshStandardMaterial({ map: gateT, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide });
    const eGate = new THREE.Mesh(new THREE.PlaneGeometry(DZ2 - DZ1, 3.6), gateM); eGate.position.set(19.55, 1.8 + 3.7, (DZ1 + DZ2) / 2); eGate.rotation.y = -PI / 2; g.add(eGate);
    const wGate = new THREE.Mesh(new THREE.PlaneGeometry(DZ2 - DZ1, 3.6), gateM); wGate.position.set(0.45, 1.8 + 3.7, (DZ1 + DZ2) / 2); wGate.rotation.y = PI / 2; g.add(wGate);
    const wWall = c.wall(X(0.45), DZ1, X(0.45), DZ2); wWall.off = true;
    const push = c.slab(0.08, 0.12, 1.6, K.std(0xc8102e, { roughness: 0.4 }), 0.55, 1.0, (DZ1 + DZ2) / 2); g.add(push); push.visible = false;
    const pushSign = c.sign('EMERGENCY EXIT  ·  PUSH', { w: 1.3, h: 0.16, bg: '#c8102e', fg: paper, font: c.MONO, weight: 800 }); pushSign.position.set(0.56, 1.3, (DZ1 + DZ2) / 2); pushSign.rotation.y = PI / 2; pushSign.visible = false; g.add(pushSign);
    // the clock over the stage door
    const clkT = c.canvasTex(512, 160, (q, w, h) => { q.fillStyle = '#0b0b0d'; q.fillRect(0, 0, w, h); });
    const cq = clkT.userData.canvas.getContext('2d'); const clk = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.62), new THREE.MeshBasicMaterial({ map: clkT, toneMapped: false })); clk.position.set(19.2, 4.4, (DZ1 + DZ2) / 2); clk.rotation.y = -PI / 2; g.add(clk);
    const clk2 = clk.clone(); clk2.position.set(10, 4.9, 1.9); clk2.rotation.y = 0; g.add(clk2);
    const drawClock = (txt, col = '#ff3030') => { cq.fillStyle = '#0b0b0d'; cq.fillRect(0, 0, 512, 160); cq.fillStyle = col; cq.font = `900 118px ${c.MONO}`; cq.textAlign = 'center'; cq.fillText(txt, 256, 122); clkT.needsUpdate = true; };
    drawClock('60:00', '#5a2020');

    // ---------- the HUD: the clock pill, the inventory, the lock panel ----------
    const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:12;display:none;gap:8px;align-items:center;pointer-events:none';
    hud.innerHTML = '<div id="wrapclock" style="font:800 20px \'IBM Plex Mono\',monospace;letter-spacing:.1em;color:#ff4fa3;background:rgba(11,12,16,.8);border:1px solid #ff4fa3;border-radius:999px;padding:8px 16px;text-shadow:0 0 12px rgba(255,79,163,.6)">60:00</div><div id="wrapinv" style="font:600 11px \'IBM Plex Mono\',monospace;letter-spacing:.12em;color:#f4ead2;background:rgba(11,12,16,.7);border:1px solid rgba(245,197,66,.5);border-radius:999px;padding:8px 14px"></div>';
    document.body.appendChild(hud); const hudClock = hud.querySelector('#wrapclock'), hudInv = hud.querySelector('#wrapinv');
    const inv = () => { const h = Object.keys(S.held).filter((k) => S.held[k]); hudInv.textContent = h.length ? 'YOU HOLD  ' + h.map((k) => ({ torch: 'UV TORCH', card: 'METROCARD', key: 'BRASS KEY' })[k]).join('  ·  ') : 'HANDS EMPTY'; };
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;inset:0;z-index:41;display:none;place-items:center;background:rgba(5,6,10,.7);backdrop-filter:blur(6px);padding:16px';
    document.body.appendChild(box);
    const stopKeys = (e) => e.stopPropagation(); box.addEventListener('keydown', stopKeys); box.addEventListener('keyup', stopKeys); box.addEventListener('click', (e) => { if (e.target === box) closeBox(); });
    const closeBox = () => { box.style.display = 'none'; box.innerHTML = ''; };
    const openBox = (title, sub, body, onTry) => {
      try { document.exitPointerLock(); } catch (e) {}
      box.innerHTML = `<div style="width:min(440px,100%);background:#0f1016;border:1px solid rgba(245,197,66,.5);border-radius:18px;padding:22px 22px 18px;font-family:'Space Grotesk',sans-serif;color:#f4ead2;box-shadow:0 30px 80px rgba(0,0,0,.6)"><div style="font:600 11px 'IBM Plex Mono',monospace;letter-spacing:.2em;color:#f5c542">${title}</div><div style="font:900 26px Fraunces,serif;margin:6px 0 4px">${sub}</div><div class="b" style="margin:14px 0"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="try" style="border-radius:999px;padding:11px 22px;font:700 13px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;border:1px solid #f5c542;background:#f5c542;color:#111318;cursor:pointer">Try it</button><button class="x" style="border-radius:999px;padding:11px 22px;font:700 13px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(244,234,210,.3);background:transparent;color:#f4ead2;cursor:pointer">Close</button></div></div>`;
      const b = box.querySelector('.b'); body(b); box.querySelector('.x').onclick = closeBox; box.querySelector('.try').onclick = () => onTry(b);
      box.style.display = 'grid'; const first = b.querySelector('input'); if (first) setTimeout(() => first.focus(), 50);
    };
    const inputs = (b, n, mode) => { const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:center'; const els = [];
      for (let k = 0; k < n; k++) { const i = document.createElement('input'); i.maxLength = 1; i.inputMode = mode === 'digit' ? 'numeric' : 'text'; i.autocomplete = 'off'; i.style.cssText = 'width:52px;height:64px;text-align:center;font:900 30px \'IBM Plex Mono\',monospace;background:#0b1020;color:#f4ead2;border:1px solid rgba(245,197,66,.5);border-radius:12px;text-transform:uppercase';
        i.addEventListener('input', () => { i.value = (mode === 'digit' ? i.value.replace(/\D/g, '') : i.value.replace(/[^a-z]/gi, '')).slice(-1).toUpperCase(); if (i.value && els[k + 1]) els[k + 1].focus(); }); i.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !i.value && els[k - 1]) els[k - 1].focus(); if (e.key === 'Enter') box.querySelector('.try').click(); if (e.key === 'Escape') closeBox(); });
        row.appendChild(i); els.push(i); } b.appendChild(row); return els; };
    const wrong = (b) => { c.sound.beep(160, 0.12, 0.18, 'square'); b.style.transition = 'none'; b.style.transform = 'translateX(-6px)'; setTimeout(() => { b.style.transition = 'transform .12s'; b.style.transform = 'translateX(6px)'; setTimeout(() => { b.style.transform = ''; }, 120); }, 20); };

    // ---------- the game ----------
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const best = (() => { try { return JSON.parse(localStorage.getItem('onloc.wrap') || 'null'); } catch (e) { return null; } })();
    const solved = (k, line) => { S.done[k] = true; S.lastSolve = performance.now(); c.sound.ding(); c.flash(0.25); if (line) c.toast(line, 3600); };
    const start = () => {
      if (S.on || S.over) return; S.on = true; S.t0 = performance.now(); S.lastSolve = S.t0; S.left = MINUTES * 60;
      clapTop.rotation.x = -0.5; setTimeout(() => { clapTop.rotation.x = 0; }, 160); c.sound.slap(); c.shake(0.04);
      eGate.position.y = 1.8; wGate.position.y = 1.8; wWall.off = false; push.visible = pushSign.visible = true; bar.position.y = 0; barWall.off = false; c.sound.thud(0.8);
      hud.style.display = 'flex'; inv(); drawScreen(['GAME MASTER', 'CLOCK RUNNING', '', 'click me for a hint', 'the walkie nudges you', 'if you go quiet']);
      c.egg('wrap_clap', 'Sixty minutes, like every room in the city. The gates are down. The gates in every real room are never really locked, and neither are these: the red bar by the west door lets you walk out any time.');
    };
    const finish = (how) => {
      if (!S.on) return; S.on = false; S.over = how === 'out'; const used = Math.round((performance.now() - S.t0) / 1000);
      eGate.position.y = 1.8 + 3.7; wGate.position.y = 1.8 + 3.7; wWall.off = true; barWall.off = true; bar.position.y = 1.6; push.visible = pushSign.visible = false; c.sound.thud(0.5);
      if (how === 'out') { c.sound.applause(5); c.flash(0.6); drawClock(fmt(used), '#40ff80'); hudClock.textContent = fmt(used); hudClock.style.color = '#40ff80';
        const pb = !best || used < best.t; if (pb) { try { localStorage.setItem('onloc.wrap', JSON.stringify({ t: used, hints: S.hints })); } catch (e) {} }
        c.egg('wrap_out', `Out in ${fmt(used)} with ${S.hints} hint${S.hints === 1 ? '' : 's'}${pb ? ', your best' : `, your best is ${fmt(best.t)}`}. That is a wrap. Next door is King Kong, who never found the way out of this city either.`); }
      else if (how === 'time') { drawClock('00:00'); c.toast('Time. The truck is here and the gates go up anyway. No room in this city keeps you past the hour.', 5000); }
      else { c.egg('wrap_walkout', 'You pushed the bar. Every room in the city has one, and nobody who uses it is counted as a loss. Clap the slate again any time.'); S.over = false; }
      setTimeout(() => { hud.style.display = 'none'; }, how === 'out' ? 12000 : 2500);
      if (how !== 'out') reset();
    };
    const reset = () => { S.on = false; S.done = {}; S.held = {}; S.hints = 0; S.nudged = 0; S.dirs = []; S.faders = ['down', 'down', 'down', 'down']; placeFaders(); cageFront.off = false; cageDoor.rotation.y = 0; torch.visible = true; uv.visible = false; fcLid.rotation.x = 0; card.visible = false; key.visible = false; lkDoors[2].rotation.y = 0; rlight.material.color.set(0xff3030); bar.position.y = 1.5; barWall.off = true; drawClock('60:00', '#5a2020'); hudClock.style.color = '#ff4fa3'; drawScreen(['GAME MASTER', 'STAGE 4 · STANDING BY', '', 'click for a hint', 'once the clock runs']); };
    const needsStart = () => { if (!S.on) { c.toast('The clock is not running. Clap the slate on the stage to start.', 2600); return true; } return false; };
    const blocker = () => !S.done.cage ? 'cage' : !S.held.torch ? 'torch' : !S.done.case ? 'case' : !S.done.board ? 'board' : !S.done.bodega ? 'bodega' : 'door';
    const hint = () => { if (needsStart()) return; const k = blocker(), list = HINTS[k], n = Math.min(list.length - 1, S.hintLevel?.[k] ?? 0); S.hintLevel = S.hintLevel || {}; S.hintLevel[k] = n + 1; S.hints++;
      const words = list[n].split(' '), lines = []; let cur = ''; for (const w of words) { if ((cur + ' ' + w).length > 30) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } lines.push(cur);
      drawScreen(['HINT ' + S.hints, ...lines.slice(0, 6)], '#f5c542'); c.toast(list[n], 5200); c.sound.modem(); };
    // the four locks
    const cageLock = () => { if (needsStart()) return; if (S.done.cage) return; openBox('THE PROP CAGE', 'Four digits', (b) => { inputs(b, 4, 'digit'); const p = document.createElement('p'); p.style.cssText = 'margin:12px 0 0;color:#cfc6b0;font-size:13px;line-height:1.5'; p.textContent = 'The slates on the stage carry call times. The production board in the office says what order they go in.'; b.appendChild(p); },
      (b) => { const v = [...b.querySelectorAll('input')].map((i) => i.value).join(''); if (v === CODE) { closeBox(); cageFront.off = true; cageDoor.rotation.y = -1.9; solved('cage', 'The padlock drops. The cage swings open: a torch, and a tag that says LOCKER 3.'); } else wrong(b); }); };
    const takeTorch = () => { if (!S.done.cage) { c.toast('Behind the chain link. The padlock wants four digits.', 2200); return; } if (S.held.torch) return; S.held.torch = true; torch.visible = false; inv(); c.sound.click(); solved('torch', 'A UV torch. Somebody on the crew used it for more than checking tape marks.'); };
    const readPoster = () => { if (needsStart()) return; if (!S.held.torch) { c.toast('A one sheet for THE WRAP. In this light there is nothing on it but the title. In another light, who knows.', 3000); return; } if (!uv.visible) { uv.visible = true; c.sound.chords(3); c.toast('Under the torch the poster glows: six marks, left to right. Something on this stage has a lock they fit.', 3600); } else c.toast('Six marks, left to right. The flight case.', 2000); };
    const caseLock = () => { if (needsStart()) return; if (S.done.case) return; openBox('THE FLIGHT CASE', 'Directional lock', (b) => { const disp = document.createElement('div'); disp.style.cssText = 'text-align:center;font:900 30px \'IBM Plex Mono\',monospace;letter-spacing:.3em;color:#f5c542;min-height:40px'; disp.textContent = ''; b.appendChild(disp);
        const pad = document.createElement('div'); pad.style.cssText = 'display:grid;grid-template-columns:repeat(3,64px);gap:6px;justify-content:center;margin-top:8px'; const mk = (lab, k) => { const bt = document.createElement('button'); bt.textContent = lab; bt.style.cssText = 'height:56px;border-radius:12px;border:1px solid rgba(245,197,66,.5);background:#0b1020;color:#f4ead2;font:900 20px \'IBM Plex Mono\',monospace;cursor:pointer'; bt.onclick = () => { if (S.dirs.length < 8) { S.dirs.push(k); disp.textContent = S.dirs.join(' '); c.sound.click(); } }; return bt; };
        const sp = () => { const d = document.createElement('div'); return d; }; pad.append(sp(), mk('UP', 'U'), sp(), mk('LEFT', 'L'), mk('CLEAR', 'C'), mk('RIGHT', 'R'), sp(), mk('DOWN', 'D'), sp()); b.appendChild(pad);
        pad.querySelectorAll('button')[2].onclick = () => { S.dirs = []; disp.textContent = ''; }; S.dirs = []; },
      (b) => { if (S.dirs.join('') === DIRS.join('')) { closeBox(); fcLid.rotation.x = -1.4; card.visible = true; solved('case', 'The latches pop. In the foam: a MetroCard with a hole punched through it. Take it.'); } else { wrong(b); S.dirs = []; b.querySelector('div').textContent = ''; } }); };
    const takeCard = () => { if (!S.done.case) { caseLock(); return; } if (S.held.card) return; S.held.card = true; card.visible = false; inv(); c.sound.ticket(); c.toast('A MetroCard, punched. Not for the train.', 2200); };
    const fader = (k) => { if (needsStart()) return; if (S.done.board) return; S.faders[k] = S.faders[k] === 'down' ? 'half' : S.faders[k] === 'half' ? 'up' : 'down'; placeFaders(); c.sound.click();
      if (S.faders.join() === CHART.join()) { lkDoors[2].rotation.y = -1.6; key.visible = true; solved('board', 'The board matches the chart. Across the stage, locker 3 clunks open.'); } };
    const locker = (k) => { if (needsStart()) return; if (k !== 2) { c.toast(`Locker ${k + 1}. Not yours, and not wired to anything.`, 2000); return; } if (!S.done.board) { c.toast('Locker 3. No handle, no lock: the lighting board by the stage runs it, and the chart for the board is in the office.', 3200); return; } if (S.held.key) return; S.held.key = true; key.visible = false; inv(); c.sound.clink(); c.toast('A brass key on a gaffer tape fob.', 2200); };
    const wordLockUI = () => { if (needsStart()) return; if (S.done.bodega) return; openBox('THE STAGE DOOR', 'Five letters', (b) => { inputs(b, 5, 'letter'); const p = document.createElement('p'); p.style.cssText = 'margin:12px 0 0;color:#cfc6b0;font-size:13px;line-height:1.5'; p.textContent = 'The bodega shelves, counted top to bottom, through the key card by the lotto board.'; b.appendChild(p); },
      (b) => { const v = [...b.querySelectorAll('input')].map((i) => i.value).join(''); if (v === WORD) { closeBox(); wordLock.material.map = c.sign('OPEN', { w: 0.34, h: 0.16, bg: '#40ff80', fg: ink, font: c.MONO, weight: 800, px: 96 }).material.map; solved('bodega', 'The word lock falls open. Two to go.'); doorCheck(); } else wrong(b); }); };
    const swipe = () => { if (needsStart()) return; if (S.done.card) return; if (!S.held.card) { c.toast('A card reader. The light is red. You are not holding a card.', 2200); return; } S.done.card = true; rlight.material.color.set(0x40ff80); c.sound.turnstile(); solved('card', 'The reader goes green.'); doorCheck(); };
    const turnKey = () => { if (needsStart()) return; if (S.done.key) return; if (!S.held.key) { c.toast('A keyhole. You have nothing that fits it.', 2200); return; } S.done.key = true; kh.rotation.x = PI / 2; c.sound.clink(900); solved('key', 'The deadbolt turns.'); doorCheck(); };
    const doorCheck = () => { if (S.done.bodega && S.done.card && S.done.key) setTimeout(() => finish('out'), 600); };
    // clickables
    c.clickable(clapT, () => { if (S.over) { c.toast(`Already out, in ${fmt(Math.round((S.lastSolve - S.t0) / 1000))}. Walk through the stage door.`, 2600); return; } start(); }, S.on ? 'The slate' : 'Clap to start');
    c.clickable(padlock, cageLock, 'The padlock'); c.clickable(cd, () => (S.done.cage ? takeTorch() : cageLock()), 'The prop cage'); c.clickable(tb, takeTorch, 'A torch'); c.clickable(tag, () => c.toast('LOCKER 3. GAFFER. The lockers are in the south east corner.', 2600), 'A tag');
    c.clickable(poster, readPoster, 'The one sheet'); c.clickable(uv, readPoster, 'The one sheet'); c.clickable(dpad, caseLock, 'The directional lock'); c.clickable(fcLid, takeCard, 'The flight case'); c.clickable(card, takeCard, 'A MetroCard');
    c.clickable(screen, hint, 'The game master'); c.clickable(walkie, () => { c.sound.beep(1200, 0.05, 0.05); c.egg('wrap_gaffer', 'The PM on the walkie: the gaffer left before his locker, the bodega guy counts everything twice, and the office board is right about midnight.'); }, 'The walkie');
    c.clickable(wordLock, wordLockUI, 'The word lock'); c.clickable(reader, swipe, 'The card reader'); c.clickable(keyhole, turnKey, 'The keyhole'); c.clickable(kh, turnKey, 'The keyhole');
    c.clickable(push, () => finish('walkout'), 'Emergency exit'); c.clickable(pushSign, () => finish('walkout'), 'Emergency exit'); c.clickable(key, () => locker(2), 'A brass key');
    c.clickable(fridge, () => c.toast('NAZAR COLA, cold. The shelves beside it are the ones to count.', 2200), 'The cooler');
    // the clock, the nudges, and leaving the set
    let away = 0, lastSec = -1;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { if (S.on) { away += dt; if (away > 4) { S.on = false; reset(); eGate.position.y = wGate.position.y = 1.8 + 3.7; wWall.off = true; push.visible = pushSign.visible = false; hud.style.display = 'none'; } } return; }
      away = 0; wlight.visible = (t * 2 | 0) % 2 === 0;
      if (!S.on) return;
      const now = performance.now(), used = (now - S.t0) / 1000, left = Math.max(0, MINUTES * 60 - used), sec = Math.floor(left);
      if (sec !== lastSec) { lastSec = sec; const txt = fmt(sec); drawClock(txt, left < 300 ? '#ff3030' : '#ff4fa3'); hudClock.textContent = txt; }
      if (left <= 0) { finish('time'); return; }
      if (now - S.lastSolve > 300000 * (S.nudged + 1)) { S.nudged++; const k = blocker(); c.toast('The PM, on the walkie: ' + HINTS[k][0], 5200); c.sound.beep(1200, 0.05, 0.05); }
    });
    r.post = { ...(r.post || {}), bloom: 0.7, vig: 0.5 };
  },
};
