// DEPARTURES. The main concourse, with split flap boards. Each picture is cut into flaps; a flip turns them over top
// to bottom, one after another with a clack, and the word over it clacks letter by letter from MORNING to MOURNING.
// Every board runs on its own clock; click one to flip it now; on the real New York hour all of them go together.
import { W, D } from './rooms.js';
import { PI, std, basic, box } from './kit.js';
import { pairs, pairTex, openPair, label, dress } from './pairs.js';

const NF = 9;   // flaps per picture
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ/ ';

// one split flap picture: NF strips, each two planes back to back (A on the front, B upside down on the back)
function flapBoard(c, g, p, w, h) {
  const { THREE } = c, grp = new THREE.Group(), flaps = [], fh = h / NF;
  const ma = new THREE.MeshBasicMaterial({ map: pairTex(c, p, 'a'), toneMapped: false }), mb = new THREE.MeshBasicMaterial({ map: pairTex(c, p, 'b'), toneMapped: false });
  for (let k = 0; k < NF; k++) {
    const v0 = 1 - (k + 1) / NF, v1 = 1 - k / NF;
    const fa = new THREE.PlaneGeometry(w, fh - 0.006), uva = fa.attributes.uv; for (let i = 0; i < 4; i++) uva.setY(i, uva.getY(i) ? v1 : v0);
    const fb = new THREE.PlaneGeometry(w, fh - 0.006), uvb = fb.attributes.uv; for (let i = 0; i < 4; i++) uvb.setY(i, uvb.getY(i) ? v1 : v0);
    const piv = new THREE.Group(); piv.position.y = h / 2 - (k + 0.5) * fh; grp.add(piv);
    const A = new THREE.Mesh(fa, ma); A.position.z = 0.004; piv.add(A);
    const B = new THREE.Mesh(fb, mb); B.rotation.x = PI; B.position.z = -0.004; piv.add(B);   // upside down and facing back: after a half turn it reads right
    flaps.push({ piv, from: 0, to: 0, t0: 0 });
  }
  const back = box(c, w + 0.16, h + 0.16, 0.06, std(c, 0x15130f, { roughness: 0.5 }), 0, 0, -0.04); grp.add(back);
  // the hinge rail between flaps
  for (let k = 1; k < NF; k++) grp.add(box(c, w + 0.04, 0.008, 0.02, std(c, 0x050505), 0, h / 2 - k * fh, 0.01));
  g.add(grp); return { grp, flaps, side: 0 };
}

export function departures(c, r, g, X) {
  const { THREE } = c, HI = r.h, P = pairs('departures');
  // the concourse: a gold cornice, the arched windows painted on the north wall in light, the clock in the middle
  const gold = std(c, 0xc8a050, { metalness: 0.8, roughness: 0.35 });
  for (const z of [-D / 2 + 0.1, D / 2 - 0.1]) g.add(box(c, W, 0.3, 0.2, gold, W / 2, HI - 0.25, z));
  const sky = c.canvasTex(512, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1e3a6a'); gr.addColorStop(1, '#0c1a32'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = '#e8c870'; for (let i = 0; i < 80; i++) { q.globalAlpha = 0.3 + Math.random() * 0.7; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  const vault = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })); vault.rotation.x = PI / 2; vault.position.set(W / 2, HI - 0.02, 0); g.add(vault);

  // the clock from over the information booth, hung from the ceiling on a brass rod
  const booth = new THREE.Group(); booth.position.set(W / 2, 3.1, 2.0); booth.scale.setScalar(0.75); g.add(booth);   // hung high over the floor, above the line of sight to the boards
  booth.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 8), gold).translateY(4.9));   // the rod it hangs from
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshStandardMaterial({ color: 0xf6e8c0, emissive: 0xffe0a0, emissiveIntensity: 0.6, roughness: 0.3 })); orb.position.y = 2.65; booth.add(orb);
  c.clickable(orb, () => c.egg('opal', 'The clock over the booth. Every board in here flips on the real New York hour, all together, like it was planned. It was.'), 'The clock');

  // ---- the boards: three on the north wall, three on the south, each with its word sign above ----
  const BW = 2.1, BH = 2.84, boards = [];
  // four on the south wall, one on each side wall: the north wall is the opening onto the concourse
  const spots = [[3.4, D / 2 - 0.12, PI], [7.8, D / 2 - 0.12, PI], [12.2, D / 2 - 0.12, PI], [16.6, D / 2 - 0.12, PI], [0.38, -3.2, PI / 2], [W - 0.38, -3.2, -PI / 2]];
  P.slice(0, spots.length).forEach((p, k) => {
    const [x, z, ry] = spots[k], hold = new THREE.Group(); hold.position.set(x, 2.0, z); hold.rotation.y = ry; hold.translateZ(0.05); g.add(hold);
    const B = flapBoard(c, hold, p, BW, BH);
    // the word: a split flap row, one character per cell
    const cv = c.canvasTex(1024, 128, () => {}), q = cv.userData.canvas.getContext('2d');
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(BW + 0.4, (BW + 0.4) / 8), new THREE.MeshBasicMaterial({ map: cv, toneMapped: false })); wm.position.set(0, BH / 2 + 0.36, 0.02); hold.add(wm);
    const L = Math.max(p.a.length, p.b.length) + 1;
    const draw = (txt) => { q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, 1024, 128); const cw = 1024 / L; q.font = `800 ${Math.min(96, cw * 1.25)}px ${c.MONO}`; q.textAlign = 'center';
      for (let i = 0; i < L; i++) { q.fillStyle = '#1a1a1a'; q.fillRect(i * cw + 3, 8, cw - 6, 112); q.fillStyle = '#000'; q.fillRect(i * cw + 3, 62, cw - 6, 3); q.fillStyle = '#f5d76e'; q.fillText(txt[i] || ' ', i * cw + cw / 2, 98); } cv.needsUpdate = true; };
    const pad = (s) => s.padEnd(L, ' ');
    const st = { p, B, hold, draw, cur: pad(p.a), goal: pad(p.a), next: 6 + k * 3.7, lastClack: 0 };
    draw(st.cur); boards.push(st);
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), basic(c, 0, { transparent: true, opacity: 0, depthWrite: false })); hit.position.z = 0.05; hold.add(hit);
    c.clickable(hit, () => { flip(st, c.TIME ? c.TIME.t : performance.now() / 1000); c.egg('flap', 'A split flap picture: nine flaps, a clack each, top to bottom. The word over it only changes the letters that are different.'); }, `${label(p)} · click to flip`);
    const pl = c.sign('TRACK ' + (17 + k * 4) + '  ·  ' + p.quip, { w: BW + 0.4, h: 0.15, bg: '#0a0a0a', fg: '#d8d0b8', font: c.MONO, weight: 600, px: 96 }); pl.position.set(0, -BH / 2 - 0.2, 0.02); hold.add(pl);
    c.clickable(pl, () => openPair(c, p), label(p));
  });
  let T = 0;
  function flip(st, t) {
    st.B.side = 1 - st.B.side;
    st.B.flaps.forEach((f, k) => { f.from = f.piv.rotation.x; f.to = st.B.side ? -PI : 0; f.t0 = T + k * 0.07; });
    st.goal = (st.B.side ? st.p.b : st.p.a).padEnd(st.cur.length, ' ');
    st.next = T + 9 + Math.random() * 6;
  }
  // the big board over the north wall: the timetable, every pair a train
  const bigc = c.canvasTex(2048, 512, () => {}), bq = bigc.userData.canvas.getContext('2d');
  const big = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: bigc, toneMapped: false })); big.position.set(W / 2, 5.45, -D / 2 + 0.06); g.add(big);   // over the opening, under the cornice, the way the real board hangs over the concourse
  const drawBig = () => {
    bq.fillStyle = '#060606'; bq.fillRect(0, 0, 2048, 512); bq.fillStyle = '#f5d76e'; bq.font = `800 44px ${c.MONO}`; bq.textAlign = 'left';
    bq.fillText('TIME    DEPARTING               ARRIVING                TRACK', 40, 64); bq.fillRect(40, 80, 1968, 3);
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    boards.forEach((st, i) => { const m = (now.getMinutes() + i * 7) % 60, hh = (now.getHours() + Math.floor((now.getMinutes() + i * 7) / 60)) % 24;
      bq.fillStyle = i % 2 ? '#e8e0c8' : '#f5d76e'; bq.font = `700 40px ${c.MONO}`;
      bq.fillText(`${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}   ${st.p.a.padEnd(22, ' ')}  ${st.p.b.padEnd(22, ' ')}  ${17 + i * 4}`, 40, 140 + i * 60); });
    bigc.needsUpdate = true;
  };
  drawBig();
  let lastHour = -1, bt = 0;
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) return; T += dt;
    const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    if (lastHour >= 0 && ny.getHours() !== lastHour) { boards.forEach((st) => flip(st, T)); c.egg('onthehour', 'The New York hour: every board flipped at once, like the station clock.'); }
    lastHour = ny.getHours();
    if ((bt += dt) > 20) { bt = 0; drawBig(); }
    for (const st of boards) {
      if (T > st.next) flip(st, T);
      for (const f of st.B.flaps) { const u = Math.min(1, Math.max(0, (T - f.t0) / 0.32)); const e = u < 1 ? 1 - Math.pow(1 - u, 3) : 1; f.piv.rotation.x = f.from + (f.to - f.from) * e; if (u > 0 && u < 1 && T - st.lastClack > 0.06) { st.lastClack = T; if (Math.abs(Pl.x - r.x0 - st.hold.position.x) < 6) c.sound.tick(); } }
      // the letters: every changed cell rolls through the alphabet, one step at a time, and stops on its goal
      if (st.cur !== st.goal && (st.acc = (st.acc || 0) + dt) > 0.045) { st.acc = 0;
        st.cur = [...st.cur].map((ch, i) => ch === st.goal[i] ? ch : ABC[(ABC.indexOf(ch) + 1) % ABC.length]).join(''); st.draw(st.cur); }
    }
  });
  // travellers and their bags (Poly Haven CC0), benches, and a commuter late for everything
  dress(c, r, g, X, [
    ['painted_wooden_bench', 5.4, 5.6, { len: 2.4, ry: PI, r: 0.6 }], ['painted_wooden_bench', 14.6, 5.6, { len: 2.4, ry: PI, r: 0.6 }],
    ['vintage_suitcase', 6.6, 2.2, { h: 0.5, ry: 0.3 }], ['vintage_suitcase', 13.2, 0.6, { h: 0.45, ry: -0.6 }], ['hand_truck', 18.2, 5.0, { h: 1.2, ry: 2.4, r: 0.4 }],
    ['wooden_crate_01', 18.8, 5.8, { h: 0.6, ry: 0.4 }], ['vintage_telephone_wall_clock', 0.3, 3.0, { h: 0.6, y: 3.2, ry: PI / 2 }],
  ], [
    ['workgirl', 8.6, -2.2, 0.8, 'MORNING to MOURNING in eleven clacks. I timed it.'], ['lensman', 11.8, -4.6, -0.4],
    ['dress', 4.2, 4.6, 2.6], ['assistant', 15.8, 3.8, -2.4], ['usher', 10.4, 6.4, PI, 'Track 33, OUR. Track 21, PLANE. Mind the gap between the words.'],
  ]);
  const late = c.glb('broker', { h: 1.78, x: 13.4, z: 2.6, ry: -0.6, parent: g }); c.post(X(13.4), 2.6, 0.35);
  c.clickable(late, () => { c.say(late, 'Is that the 5:52 or the 5:52? It keeps saying two different things.', 3600, 2.1); c.egg('commuter'); }, 'A commuter');
  // a ticket window sign in quotation marks, the room's one orange
  const tw = c.sign('"TICKETS" // "TICKS"', { w: 2.2, h: 0.32, bg: '#0d0d0d', fg: '#ff6b00', font: c.FONT, weight: 800 }); tw.position.set(W - 0.34, 3.4, 6.6); tw.rotation.y = -PI / 2; g.add(tw);
}
