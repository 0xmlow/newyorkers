// STAND CLEAR OF THE CLOSING DOORS. A mezzanine lined with subway car doors, six on each wall. Each door's left leaf
// carries word A and its right leaf word B. Open, the two words hide in the door pockets and the line shows in the
// gap; then the chime, and the doors close: the two New Yorkers meet as one picture. Click a door as it closes and
// somebody's arm holds it open, so that pair never meets (the held doors egg).
import { W, D } from './rooms.js';
import { PI, std, basic, box } from './kit.js';
import { pairs, pairTex, openPair, plaque, label, dress } from './pairs.js';
import { tileTex } from './r_platform.js';

const LW = 0.92, LH = 2.05;   // one leaf

export function doors(c, r, g, X) {
  const { THREE } = c, HI = r.h, P = pairs('doors');
  const tt = tileTex(c); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(10, 2);
  const tile = new THREE.MeshStandardMaterial({ map: tt, roughness: 0.25 });
  const ss = std(c, 0xc8ccd2, { metalness: 0.85, roughness: 0.3 }), dark = basic(c, 0x0a0a0c);
  const xs = [2.4, 5.4, 8.4, 11.6, 14.6, 17.6], sets = [];
  // six on the south wall, two on each side wall, and a pair back to back in the middle of the floor (the doors to
  // nowhere): the north wall is the opening onto the platform and the train standing in it
  const spots = [...xs.map((x) => [x, D / 2 - 0.02, PI]), [0.14, -5.4, PI / 2], [0.14, -2.2, PI / 2], [W - 0.4, -5.4, -PI / 2], [W - 0.4, -2.2, -PI / 2], [15.6, 1.1, 0], [15.6, 0.9, PI]];
  g.add(box(c, 3.3, 2.7, 0.18, ss, 15.6, 1.35, 1.0)); c.wall(X(13.95), 1.0, X(17.25), 1.0);   // to one side, out of the line from the door to the train   // the island the middle pair hangs on
  P.slice(0, spots.length).forEach((p, k) => {
    const [x, z, ry] = spots[k], grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; g.add(grp);
    // the opening: a dark recess with the line lit in it, seen when the doors part
    const rec = new THREE.Mesh(new THREE.PlaneGeometry(LW * 2, LH), dark); rec.position.set(0, LH / 2 + 0.05, 0.01); grp.add(rec);
    const q = c.sign(p.quip.length > 44 ? p.quip.slice(0, p.quip.lastIndexOf(' ', 44)) + '...' : p.quip, { w: LW * 1.9, h: 0.16, bg: '#0a0a0c', fg: '#f5d76e', font: c.MONO, weight: 600, px: 96 }); q.position.set(0, 1.2, 0.02); grp.add(q);
    // the two leaves, stainless with the picture in the window, sliding into pockets behind steel covers
    const leaf = (side) => {
      const L = new THREE.Group(); L.position.set(side === 'a' ? -LW / 2 : LW / 2, LH / 2 + 0.05, 0.05); grp.add(L);
      L.add(box(c, LW, LH, 0.04, ss, 0, 0, 0));
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(LW - 0.1, (LW - 0.1) / 0.74), new THREE.MeshBasicMaterial({ map: pairTex(c, p, side), toneMapped: false })); pic.position.set(0, 0.22, 0.025); L.add(pic);
      c.clickable(pic, () => hold(st), label(p));
      return L;
    };
    const A = leaf('a'), B = leaf('b');
    for (const s of [-1, 1]) grp.add(box(c, LW + 0.08, LH + 0.3, 0.06, ss, s * (LW + 0.04 + LW / 2), LH / 2 + 0.1, 0.1));   // the pockets
    grp.add(box(c, LW * 3 + 0.3, 0.22, 0.12, ss, 0, LH + 0.2, 0.1));
    plaque(c, grp, p, 0, LH + 0.48, 0.17, 0, 1.7, { bg: '#0a0a0c', fg: '#f4ead2', border: '#00933c' });
    const st = { p, A, B, open: 1, goal: 1, held: false };
    sets.push(st);
  });
  function hold(st) {
    if (st.goal === 0 && st.open > 0.15) { st.held = true; st.goal = 1; c.sound.thud && c.sound.thud(0.4); c.toast('Somebody held the doors. This pair never meets. Please do not hold the doors.', 3200); c.egg('held', 'Held doors: an arm in the gap and the two words stay apart. The train is delayed because of train traffic ahead of us.'); return; }
    openPair(c, st.p, ['closingdoors', 'Stand clear of the closing doors: the chime, then the two halves of the pair meet as one picture.']);
  }
  // the cycle: open, chime, close (the pair meets), hold a while, open again
  let T = 0, phase = 'open', next = 4;
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) return; T += dt;
    if (T > next) {
      if (phase === 'open') { phase = 'closing'; next = T + 7; c.sound.ding(); setTimeout(() => c.sound.ding && c.sound.ding(), 380); c.toast('Stand clear of the closing doors, please.', 2400); sets.forEach((s) => { if (!s.held) s.goal = 0; }); }
      else { phase = 'open'; next = T + 5; sets.forEach((s) => { s.goal = 1; s.held = false; }); }
    }
    for (const s of sets) { s.open += (s.goal - s.open) * Math.min(1, dt * 3.2); const off = s.open * (LW + 0.02); s.A.position.x = -LW / 2 - off; s.B.position.x = LW / 2 + off; }
  });
  // a conductor's cab window at the far end, and a rider who knows the drill
  const rider = c.glb('workgirl', { h: 1.7, x: 12.6, z: 2.6, ry: 2.6, parent: g }); c.post(X(12.6), 2.6, 0.35);
  c.clickable(rider, () => { c.say(rider, 'Watch: ding dong, and the two of them meet in the middle. Every time. Like a married couple.', 3800, 2.0); c.egg('dingdong'); }, 'A rider');
  const strip = c.sign('STAND CLEAR OF THE CLOSING DOORS // STAND CLEAR OF THE CLOSING DOORS', { w: 12, h: 0.32, bg: '#0a0a0c', fg: '#f4ead2', font: c.MONO, weight: 700 }); strip.position.set(W / 2, HI - 0.3, -D / 2 + 0.05); g.add(strip);
  dress(c, r, g, X, [
    ['painted_wooden_bench', 5.2, 1.6, { len: 2.2, r: 0.6 }], ['metal_trash_can', 18.6, 6.6, { h: 0.85 }], ['WetFloorSign_01', 7.6, -4.4, { h: 0.6, ry: 0.3 }],
    ['security_camera_01', 19.4, 7.4, { h: 0.3, y: 3.4, ry: -2.4 }],
  ], [
    ['tracksuit', 4.6, 3.6, 0.6, 'The doors close and the two of them become one picture. Then the doors open and they are strangers again. Same as the 6.'], ['hustler', 15.4, 4.4, -2.2],
  ]);
}
