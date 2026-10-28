// HOUSING COURT, 141 LIVINGSTON STREET. Benches full of waiting tenants, fluorescent light, a red NOW SERVING sign over
// a clerk's window. The trick: the aisle is a treadmill. Walk at the window without a number and the floor carries you
// back exactly as fast as you walk. Take a number at the door, wait for the sign to reach it, and the floor stops.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, decal, cast, sheet, linoTex, texMat, stamp, art, artTex, artPlane, swap } from './kit.js';

const AX0 = 8.2, AX1 = 11.8;   // the aisle between the benches

export function court(c, r, g, X) {
  const { THREE } = c, HI = r.h;
  // ---- the benches, oak, worn pale where people sit, and the people ----
  const oak = std(c, 0x7a5430, { roughness: 0.55 }), dark = std(c, 0x4a3018, { roughness: 0.6 });
  const COLS = [0x3a4a6a, 0x6a3a3a, 0x2a5a4a, 0x5a5a5a, 0x7a6a3a, 0x3a3a5a, 0x8a4a2a, 0x2a2a2a];
  const sitters = []; let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (const [x0, x1] of [[1.2, AX0 - 0.3], [AX1 + 0.3, W - 1.4]]) for (let k = 0; k < 6; k++) {
    const z = 4.6 - k * 1.7, w = x1 - x0, cx = (x0 + x1) / 2;
    const row = [box(c, w, 0.06, 0.42, oak, cx, 0.46, z), box(c, w, 0.5, 0.05, oak, cx, 0.78, z + 0.22)]; for (const ex of [x0 + 0.08, x1 - 0.08]) row.push(box(c, 0.06, 0.46, 0.42, dark, ex, 0.23, z)); row.forEach((m) => g.add(m));
    // each built pew becomes five Poly Haven painted wooden benches end to end (CC0, 630 tris), back to the aisle door like the pew
    for (let j = 0; j < 5; j++) swap(c, g, 'ph_painted_wooden_bench', row, { len: w / 5, x: x0 + w / 5 * (j + 0.5), z: z + 0.01, ry: PI });
    c.wall(X(x0), z - 0.25, X(x1), z - 0.25); c.wall(X(x0), z + 0.27, X(x1), z + 0.27); c.wall(X(x0), z - 0.25, X(x0), z + 0.27); c.wall(X(x1), z - 0.25, X(x1), z + 0.27);

  }
  // the people waiting: the cast of the city, standing by the benches with their papers, nobody sitting down for long
  const WHO = ['susan', 'dad', 'workgirl', 'writer', 'sally', 'rosemary', 'maria', 'loretta', 'annieh', 'bookseller', 'auggie', 'felix', 'butcher', 'jeweler'];
  const LINES = ['Third time. They adjourn it, I take another day off work, they adjourn it again.', 'My lawyer is the man in the hall with the clipboard. He has ninety cases this morning.', 'Forty one years in the building and I learned the word holdover this year.', 'They called my name at nine thirty. It is two. I am still here. So is my name.', 'Bring a sandwich. Bring two.', 'The landlord sends a lawyer. The lawyer sends a junior. The junior sends his regrets.'];
  const spots = [[1.0, 5.2, 0.6], [7.7, 4.0, -0.4], [12.4, 4.2, 0.5], [18.9, 5.0, -0.5], [1.0, 1.8, 0.4], [7.75, 0.6, -0.3], [12.3, 2.3, 0.2], [18.9, 1.4, -0.4], [1.0, -1.6, 0.5], [7.8, -2.8, -0.5], [12.3, -1.2, 0.3], [18.9, -2.3, -0.6], [1.0, -4.9, 0.2], [18.9, -5.1, -0.2]];
  spots.forEach(([x, z, ry], k) => { const m = cast(c, r, g, X, WHO[k % WHO.length], x, z, { h: 1.62 + (k % 4) * 0.06, ry: PI + ry, r: 0.35 }); if (k % 2 === 0) c.clickable(m, () => { c.say(m, LINES[(k / 2) % LINES.length], 3800, 2.0); c.egg('benches'); }, 'Somebody waiting'); });
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; });

  // ---- the aisle: a treadmill under a strip of the same linoleum ----
  const AZ0 = -6.4, AZ1 = 6.0, lt = linoTex(c).clone(); lt.needsUpdate = true; lt.wrapS = lt.wrapT = THREE.RepeatWrapping; lt.repeat.set((AX1 - AX0) / 2.4, (AZ1 - AZ0) / 2.4);
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(AX1 - AX0, AZ1 - AZ0), new THREE.MeshStandardMaterial({ map: lt, color: 0xb0b2a0, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 })); belt.rotation.x = -PI / 2; belt.position.set((AX0 + AX1) / 2, 0.006, (AZ0 + AZ1) / 2); g.add(belt);
  for (const x of [AX0, AX1]) g.add(box(c, 0.05, 0.012, AZ1 - AZ0, std(c, 0xe8c020), x, 0.008, (AZ0 + AZ1) / 2));

  // ---- the clerk's window, and NOW SERVING ----
  const BZ = -7.0, booth = std(c, 0x8a8a7a, { roughness: 0.6 });
  g.add(box(c, 1.2, 2.4, 0.3, booth, AX0 + 0.3, 1.2, BZ)); g.add(box(c, 1.2, 2.4, 0.3, booth, AX1 - 0.3, 1.2, BZ)); g.add(box(c, AX1 - AX0, 1.05, 0.3, booth, (AX0 + AX1) / 2, 0.52, BZ)); g.add(box(c, AX1 - AX0, 0.4, 0.3, booth, (AX0 + AX1) / 2, 2.2, BZ));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(AX1 - AX0 - 2.4, 0.95), new THREE.MeshStandardMaterial({ color: 0x9ab0b0, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.6 })); glass.position.set((AX0 + AX1) / 2, 1.52, BZ + 0.16); g.add(glass);
  g.add(box(c, AX1 - AX0, 0.04, 0.4, std(c, 0x6a6a5a), (AX0 + AX1) / 2, 1.06, BZ + 0.3));
  const clerk = cast(c, r, g, X, 'clerk', (AX0 + AX1) / 2, BZ - 0.7, { h: 1.7, ry: 0, r: 0 });
  const sign = c.canvasTex(256, 96, () => {}), sq = sign.userData.canvas.getContext('2d');
  const drawSign = (n, mine) => { sq.fillStyle = '#100404'; sq.fillRect(0, 0, 256, 96); sq.fillStyle = '#ff3020'; sq.font = `700 16px ${c.MONO}`; sq.textAlign = 'center'; sq.fillText('NOW SERVING', 128, 26); sq.font = `900 50px ${c.MONO}`; sq.fillText('C ' + n, 128, 80); if (mine) { sq.fillStyle = '#ffd040'; sq.font = `700 11px ${c.MONO}`; sq.fillText('YOURS: C ' + mine, 128, 93); } sign.needsUpdate = true; };
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshBasicMaterial({ map: sign, toneMapped: false })); sm.position.set((AX0 + AX1) / 2, 2.9, BZ + 0.2); g.add(sm);
  const win = c.sign('WINDOW 1 · HOUSING PART · HAVE YOUR INDEX NUMBER READY', { w: 3.2, h: 0.2, bg: '#0d0d0d', fg: '#f4ead2', font: c.MONO, weight: 700 }); win.position.set((AX0 + AX1) / 2, 2.48, BZ + 0.17); g.add(win);
  c.wall(X(AX0 - 0.3), BZ + 0.4, X(AX1 + 0.3), BZ + 0.4);

  // ---- take a number ----
  let serving = 803, mine = 0, called = false, walked = 0, said = 0;
  drawSign(serving, 0);
  const disp = new THREE.Group(); disp.position.set(AX0 - 0.6, 0, 6.6); g.add(disp);
  disp.add(cyl(c, 0.03, 0.03, 1.2, std(c, 0x8a8a90, { metalness: 0.9 }), 0, 0.6, 0, 8)); disp.add(cyl(c, 0.2, 0.22, 0.03, std(c, 0x8a8a90, { metalness: 0.9 }), 0, 0.015, 0));
  const red = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), std(c, 0xd0201a, { roughness: 0.3 })); red.scale.set(1, 0.8, 0.8); red.position.y = 1.3; disp.add(red);
  const tab = box(c, 0.08, 0.05, 0.002, basic(c, 0xffffff), 0.12, 1.26, 0.08); disp.add(tab);
  const tk = c.sign('TAKE A NUMBER', { w: 0.8, h: 0.14, bg: '#d0201a', fg: '#fff', font: c.MONO, weight: 800 }); tk.position.set(0, 1.6, 0); disp.add(tk); c.post(X(AX0 - 0.6), 6.6, 0.3);
  c.clickable(red, () => { if (mine) { c.toast(`You already have C ${mine}. Everybody has one. Sit down.`, 2400); return; } mine = 847; c.sound.ticket(); drawSign(serving, mine); c.toast('C 847. Now serving C 803. Have a seat.', 3200); c.egg('ticket', 'C 847. The number is the only thing in this building that is yours. Hold on to it.'); }, 'Take a number');
  let acc = 0;
  c.tick((t, dt, P, ri) => {
    if (!mine || called || ri !== r.i) return;
    acc += dt; if (acc > 0.22) { acc = 0; serving++; drawSign(serving, mine); if (serving % 6 === 0) c.sound.beep(1320, 0.04, 0.08, 'sine'); }
    if (serving >= mine) { called = true; c.sound.ding(); c.toast('NOW SERVING C 847. Window 1. The floor has stopped.', 3400); }
  });
  // the treadmill itself: inside the aisle and past the third bench, the floor pays you back for every step
    r.move = (P, nx, nz, dt) => {
    if (called || nz >= P.z || nz > 1.0) return [nx, nz];
    const back = P.z - nz; walked += back; lt.offset.y -= back / 2.4;
    if (walked > 30 && !said) { said = 1; c.egg('treadmill', 'Thirty metres toward the window and you are exactly where you started. The floor moves at the speed of a tenant. Take a number, by the door.'); }
    return [nx, P.z];
  };
  // at the window
  let atWin = false;
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const near = Math.abs(P.x - r.x0 - (AX0 + AX1) / 2) < 1.6 && P.z < BZ + 1.6; if (near && !atWin) { atWin = true; c.say(clerk, called ? 'Index number? Thank you. Your case is adjourned to the first of next month. Next.' : 'You need a number.', 4200, 2.0); if (called) { setTimeout(() => stamp(c, 'ADJOURNED', 1500), 900); c.egg('adjourned', 'Adjourned to the first of next month. You came at nine thirty, you were called at two, and you are coming back. Thirty days, every month, until there is nothing left to come back for.'); } } if (!near) atWin = false; });

  // ---- the room: a clock that runs fast, notices on cork, fluorescent tubes ----
  const clock = new THREE.Group(); clock.position.set(W - 0.42, 3.4, -2.0); clock.rotation.y = -PI / 2; g.add(clock);
  clock.add(new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), basic(c, 0xf2ede0))); clock.add(new THREE.Mesh(new THREE.RingGeometry(0.33, 0.37, 32), std(c, 0x1a1a1a)));
  const hh = box(c, 0.03, 0.18, 0.01, basic(c, 0x111111), 0, 0.09, 0.01), mh = box(c, 0.02, 0.28, 0.01, basic(c, 0x111111), 0, 0.14, 0.012);
  const hp = new THREE.Group(), mp = new THREE.Group(); hp.add(hh); mp.add(mh); clock.add(hp); clock.add(mp);
  c.tick((t) => { mp.rotation.z = -t * 0.8; hp.rotation.z = -t * 0.8 / 12; });
  c.clickable(clock, () => c.egg('courtclock', 'The clock in the hall runs fast. Everybody in here says so. It is the only thing in housing court that does.'), 'The clock');
  for (const tz of [4.5, 0.5, -3.5]) for (const tx of [5, 15]) { g.add(box(c, 0.4, 0.06, 1.4, std(c, 0xd8dce0), tx, HI - 0.04, tz)); g.add(box(c, 0.1, 0.03, 1.3, basic(c, 0xf4fff0), tx, HI - 0.08, tz)); }
  // a lawyer in the hall with ninety files
  cast(c, r, g, X, 'editor', 3.0, 6.6, { h: 1.75, ry: 0.4, line: 'Are you 847? No? Who is 847? Has anybody seen 847? I have ninety of you this morning.', egg: 'lawyer', hint: 'The lawyer with the clipboard' });
  [[9.0, 5.0, 0.4], [10.6, 2.0, 1.4], [3.6, -6.0, 2.2], [16.0, -6.2, 0.9], [10.2, -4.2, 2.8]].forEach(([x, z, ry], k) => sheet(c, g, x, z, ry, ['yellow', 'notice', 'pink'][k % 3], k + 12));

  // ---- the docket: the day's cases on a black board, scrolling, every one of them a New Yorker ----
  const DK = 10, cases = []; for (let k = 0; k < DK; k++) cases.push(art(r, 12 + k));
  const dk = c.canvasTex(512, 640, () => {}), dq = dk.userData.canvas.getContext('2d'), thumbs = cases.map((p) => { const im = new Image(); im.src = `assets/art/${p.f}`; return im; });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.75), new THREE.MeshBasicMaterial({ map: dk, toneMapped: false })); board.position.set(W - 0.42, 2.2, 2.2); board.rotation.y = -PI / 2; g.add(board);
  g.add(box(c, 0.06, 2.9, 2.35, std(c, 0x3a2a18), W - 0.38, 2.2, 2.2));
  let off = 0;
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; off = (off + dt * 22) % (DK * 96);
    dq.fillStyle = '#0d0d0d'; dq.fillRect(0, 0, 512, 640); dq.fillStyle = '#f5c542'; dq.font = `800 26px ${c.MONO}`; dq.textAlign = 'center'; dq.fillText('HOUSING PART · TODAY', 256, 40); dq.fillRect(20, 54, 472, 3);
    dq.save(); dq.beginPath(); dq.rect(0, 64, 512, 576); dq.clip();
    for (let k = 0; k < DK + 6; k++) { const i = k % DK, y = 70 + k * 96 - off, p = cases[i]; if (y < -40 || y > 650) continue; const im = thumbs[i]; if (im.complete && im.naturalWidth) dq.drawImage(im, 24, y, 128, 72);
      dq.textAlign = 'left'; dq.fillStyle = '#f4ead2'; dq.font = `700 17px ${c.MONO}`; dq.fillText(`IN THE MATTER OF`, 166, y + 18); dq.font = `800 20px ${c.FONT}`; const tt = p.t.length > 26 ? p.t.slice(0, 25) + '.' : p.t; dq.fillText(tt.toUpperCase(), 166, y + 44); dq.fillStyle = '#8d8676'; dq.font = `600 14px ${c.MONO}`; dq.fillText(`NO. ${p.n} · ${(p.h || '').toUpperCase()} · ${['ADJOURNED', 'HOLDOVER', 'NONPAYMENT', 'ADJOURNED', 'SETTLED'][i % 5]}`, 166, y + 66); }
    dq.restore(); dk.needsUpdate = true; });
  c.clickable(board, () => { const i = Math.floor((off + 288) / 96) % DK; c.openPiece(cases[i]); c.egg('docket', 'The day\'s docket, scrolling: every case on it is a New Yorker from Downtown Brooklyn. IN THE MATTER OF, and then a painting.'); }, 'The docket');
  c.post(X(W - 0.6), 2.2, 0.4);
  // when your number comes up, the screen by the window shows who you are today
  const you = artPlane(c, g, art(r, 22), 1.1, 0.62, { hint: 'Number C 847', egg: ['c847', 'C 847 is a New Yorker too. Everybody in this hall is somebody on a wall somewhere.'] }); you.position.set(AX1 + 0.9, 2.6, BZ + 0.2); you.visible = false;
  c.tick(() => { you.visible = called; });
}
