/* 140 and 141: two rooms that are mostly light.
   The Fourth of July from the Brooklyn Heights Promenade, and two in the morning at 84 King Street.
   Both run one instanced particle rig and a small set of lights on a beat, so the cost is in the
   arithmetic and not in the draw calls. */
import * as T from 'three';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;

/* ---------------- 140 THE FOURTH OVER THE EAST RIVER ---------------- */
export const eastriverfourth: RoomDef = {
  id: 'eastriverfourth',
  name: 'The Fourth over the East River',
  area: 'BROOKLYN HEIGHTS PROMENADE',
  mood: 'Nine forty, everybody quiet',
  color: '#f0c24a',
  daylit: false,
  description: 'A third of a mile of cantilevered walkway over a running expressway, and once a year the best free seat in the city: barges on the black water, the skyline with its lights on, and eighty thousand shells going up in half an hour. The New Yorkers hang along the park wall and the railing, lit red, then green, then gold, then not at all.',
  signatures: 'The Promenade on its cantilever over the Brooklyn Queens Expressway, the iron railing and the benches, the plane trees, the Brooklyn Bridge to the north, fireboats and barges on the river, the Lower Manhattan skyline across the water, and the crowd standing four deep at the rail.',
  build(k, ctx) {
    k.sky({ top: 0x05070f, horizon: 0x141c2c, ground: 0x05070a, fog: 0.0035, stars: 800, env: 0.42 });
    k.hemi(0x46608c, 0x141a22, 1.35);
    k.sun(0xaebde8, 0.3, -60, 40, -40, true, 90);
    const pav = k.pbr('erPave', X.pavers(0x6a6862, 9), 0.5, { roughness: 0.6 }),
      stone = k.pbr('erWall', X.ashlar(0x7d7a72, 12, 4), 0.42),
      iron = k.flat(0x14181e, 0.65, 0.4),
      wood = k.pbr('erWood', X.planks(0x53402e, 6, 13), 1.3, { roughness: 0.6 }),
      dark = k.flat(0x0e1117, 0.3, 0.7),
      warm = k.glow(0xffd9a0),
      hull = k.flat(0x1a2128, 0.4, 0.6);
    /* the walkway: 7 metres wide, a low park wall on the land side, the rail on the river side */
    const Z0 = 60, Z1 = -60;
    k.box(9, 0.4, Z0 - Z1, 0, -0.2, (Z0 + Z1) / 2, pav);
    k.box(0.8, 1.15, Z0 - Z1, -4.6, 0.55, (Z0 + Z1) / 2, stone);
    k.box(1.1, 2.6, Z0 - Z1, -5.6, 1.3, (Z0 + Z1) / 2, stone);
    k.block(-6.2, -4.1, Z1, Z0);
    k.rail(3.9, (Z0 + Z1) / 2, Z0 - Z1, iron, 1.12, 'z', 2.2);
    k.block(3.7, 4.6, Z1, Z0);
    for (let z = Z0 - 6; z > Z1; z -= 9) { k.bench(2.6, z, PI / 2, wood, iron, 2.0); k.lamp(-3.6, z - 4.5, 4.4, iron, 0xffcf96, 120); }
    for (let z = Z0 - 10; z > Z1; z -= 14) k.tree(-3.4, 0, z, { h: 7, r: 3.0, kind: 'round', seed: z, leaf: 0x24381f });
    /* under it, the expressway: two decks of tail lights running below the parapet */
    k.box(18, 0.4, Z0 - Z1, 11, -6.4, (Z0 + Z1) / 2, dark);
    k.box(18, 0.4, Z0 - Z1, 11, -12.0, (Z0 + Z1) / 2, dark);
    const lanes = k.instances(new T.BoxGeometry(0.5, 0.2, 1.1), k.glow(0xff3322), Array.from({ length: 60 }, () => new T.Matrix4()));
    const whites = k.instances(new T.BoxGeometry(0.5, 0.2, 1.1), k.glow(0xfff0d0), Array.from({ length: 40 }, () => new T.Matrix4()));
    lanes.frustumCulled = whites.frustumCulled = false;
    {
      const rnd = X.mulberry(5), m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      const st = Array.from({ length: 100 }, () => ({ s: rnd() * 120, x: 6 + Math.floor(rnd() * 4) * 3.2, y: rnd() > 0.5 ? -6.0 : -11.6, v: 16 + rnd() * 10, d: rnd() > 0.5 ? 1 : -1 }));
      const place = (_t: number, dt: number) => {
        st.forEach((a, i) => {
          a.s = (a.s + a.v * Math.min(dt, 0.1)) % 130;
          p.set(a.x, a.y, Z1 + (a.d > 0 ? a.s : 130 - a.s));
          m.compose(p, q, one);
          if (i < 60) lanes.setMatrixAt(i, m); else whites.setMatrixAt(i - 60, m);
        });
        lanes.instanceMatrix.needsUpdate = whites.instanceMatrix.needsUpdate = true;
      };
      place(0, 0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* the river, the barges, the far shore */
    k.water({ y: -14, color: 0x1b3348, w: 460, d: 340, x: 150, z: -10, amp: 0.8 });
    /* Manhattan, across the water: the towers run along z, so k.skyline (which spreads along x) cannot do it. */
    {
      const facade = k.pbr('erWin', X.windows(21, 0.5, 0x18222e, true), 0.11, { emissive: 0xffffff, emissiveIntensity: 2.6, roughness: 0.6, stretch: 0.42 });
      const roof = k.flat(0x141922, 0.2, 0.85);
      const rnd = X.mulberry(21);
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 26; i++) {
          const near = row === 0;
          const h = (near ? 26 : 18) + rnd() * (near ? 78 : 46),
            w = 9 + rnd() * 13, d = 9 + rnd() * 13,
            z = 130 - i * 13 - rnd() * 7,
            x = 180 + row * 34 + rnd() * 22;
          k.box(w, h, d, x, -14 + h / 2, z, facade);
          k.box(w + 0.5, 0.7, d + 0.5, x, -14 + h, z, roof);
          if (near && rnd() > 0.8) { for (let s2 = 1; s2 <= 3; s2++) k.box(w - s2 * w * 0.22, 4, d - s2 * d * 0.22, x, -14 + h + s2 * 4, z, facade); k.cyl(0.3, 16, x, -14 + h + 20, z, roof, 0.1, 6); }
        }
    }
    const BX = 58;
    for (let i = 0; i < 4; i++) {
      const z = 26 - i * 18;
      k.box(9, 2.2, 26, BX, -13.4, z, hull);
      k.box(8, 0.5, 24, BX, -12.2, z, k.flat(0x2b3138, 0.3, 0.7));
      for (const dz of [-9, 0, 9]) k.box(0.4, 0.5, 0.4, BX - 3, -12, z + dz, warm);
    }
    /* the Brooklyn Bridge, north end, in silhouette with its necklace of lights */
    const BZ = 118, towerX = [38, 158];
    for (const tx of towerX) {
      k.box(11, 56, 9, tx, 14, BZ, k.pbr('erTower', X.ashlar(0x4a4238, 14, 5), 0.3));
      k.arch(3.4, 11, 9.4, tx, 8, BZ, dark, true, 0.7);
      k.arch(3.4, 11, 9.4, tx, 22, BZ, dark, true, 0.7);
    }
    {
      /* the two main cables sag between the towers and rise over them, the necklace hangs off them */
      const cy = (x: number, drop: number) => {
        if (x < towerX[0]) return 40 - ((towerX[0] - x) / 38) * 26;
        if (x > towerX[1]) return 40 - ((x - towerX[1]) / 38) * 26;
        const u = (x - towerX[0]) / (towerX[1] - towerX[0]);
        return 40 - drop * Math.sin(u * PI);
      };
      for (const dz of [-3.4, 3.4]) {
        const pts: T.Vector3[] = [];
        for (let i = 0; i <= 40; i++) { const x = 4 + (i / 40) * 190; pts.push(v(x, cy(x, 26), BZ + dz)); }
        k.curve(pts, 0.32, dark, 80);
      }
      const lights: T.Matrix4[] = [];
      for (let i = 0; i <= 70; i++) { const x = 4 + (i / 70) * 190; lights.push(new T.Matrix4().setPosition(x, cy(x, 26) + 0.4, BZ)); }
      k.instances(new T.SphereGeometry(0.3, 6, 5), k.glow(0xffd9a0), lights);
      for (let i = 0; i <= 44; i++) { const x = 6 + (i / 44) * 186; const top = cy(x, 26); k.beam(v(x, top, BZ - 3.4), v(x, 14, BZ - 3.4), 0.06, dark, 4); k.beam(v(x, top, BZ + 3.4), v(x, 14, BZ + 3.4), 0.06, dark, 4); }
      k.box(196, 1.4, 14, 98, 13, BZ, dark);
      k.box(196, 0.3, 13, 98, 13.9, BZ, k.flat(0x1b2028, 0.3, 0.8));
    }
    /* the show: five shells at a time, each a rise, a burst and a fall, one instanced spark field */
    const SHELLS = 6, PER = 110, N = SHELLS * PER;
    const sparks = k.instances(new T.SphereGeometry(0.58, 5, 4), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending }), Array.from({ length: N }, () => new T.Matrix4()));
    sparks.frustumCulled = false;
    const rise = k.instances(new T.SphereGeometry(0.6, 6, 5), new T.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }), Array.from({ length: SHELLS }, () => new T.Matrix4()));
    rise.frustumCulled = false;
    const flash = [0, 1, 2].map(() => { const l = new T.PointLight(0xffd0a0, 0, 300, 1.5); l.position.set(BX, 40, 0); k.add(l); return l; });
    const palette = [0xff3b4a, 0x3bd0ff, 0xffd84a, 0x8cff6a, 0xff7ad0, 0xffffff, 0xff9a2a];
    {
      const rnd = X.mulberry(1907), c = new T.Color();
      const dirs: T.Vector3[] = [];
      for (let i = 0; i < PER; i++) {
        const y = 1 - (2 * (i + 0.5)) / PER, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996;
        dirs.push(v(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(0.75 + rnd() * 0.5));
      }
      const shells = Array.from({ length: SHELLS }, (_, i) => ({
        t0: -i * 1.6 - rnd() * 2, dur: 3.4 + rnd() * 1.6, up: 1.3 + rnd() * 0.5,
        x: BX + (rnd() - 0.5) * 30, z: 34 - rnd() * 74, peak: 22 + rnd() * 22,
        col: palette[Math.floor(rnd() * palette.length)], col2: palette[Math.floor(rnd() * palette.length)], spread: 11 + rnd() * 11,
      }));
      const reset = (s: typeof shells[0], t: number) => {
        s.t0 = t + rnd() * 1.4; s.dur = 3.2 + rnd() * 1.8; s.up = 1.2 + rnd() * 0.6;
        s.x = BX + (rnd() - 0.5) * 30; s.z = 34 - rnd() * 74; s.peak = 21 + rnd() * 24;
        s.col = palette[Math.floor(rnd() * palette.length)]; s.col2 = palette[Math.floor(rnd() * palette.length)];
        s.spread = 10 + rnd() * 13;
      };
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), hide = new T.Vector3(0.0001, 0.0001, 0.0001);
      for (let i = 0; i < N; i++) sparks.setColorAt(i, c.set(palette[i % palette.length]));
      if (sparks.instanceColor) sparks.instanceColor.needsUpdate = true;
      const step = (t: number) => {
        let lit = 0;
        shells.forEach((s, si) => {
          const age = t - s.t0;
          if (age > s.dur + s.up) { reset(s, t); }
          const rising = age >= 0 && age < s.up;
          const burst = age - s.up;
          /* the shell on the way up */
          if (rising) { const u = age / s.up; p.set(s.x, -10 + (s.peak + 10) * u, s.z); sc.setScalar(1 - u * 0.4); m.compose(p, q, sc); }
          else m.compose(p.set(0, -400, 0), q, hide);
          rise.setMatrixAt(si, m);
          /* the burst */
          const u2 = burst / s.dur;
          if (burst >= 0 && u2 < 1) {
            if (u2 < 0.12 && lit < 3) { const l = flash[lit++]; l.position.set(s.x, s.peak, s.z); l.color.setHex(s.col); l.intensity = 2600 * (1 - u2 / 0.12); }
            const g = 9 * burst * burst * 0.5, grow = s.spread * Math.pow(u2, 0.45), fade = 1 - u2;
            for (let i = 0; i < PER; i++) {
              const d = dirs[i];
              p.set(s.x + d.x * grow, s.peak + d.y * grow - g, s.z + d.z * grow);
              sc.setScalar(Math.max(0.0002, fade * (0.55 + 0.45 * ((i % 7) / 7))));
              m.compose(p, q, sc);
              sparks.setMatrixAt(si * PER + i, m);
              if (i % 9 === 0) sparks.setColorAt(si * PER + i, c.set(u2 > 0.5 ? s.col2 : s.col));
              else if (u2 < 0.02) sparks.setColorAt(si * PER + i, c.set(s.col));
            }
          } else {
            for (let i = 0; i < PER; i++) { m.compose(p.set(0, -400, 0), q, hide); sparks.setMatrixAt(si * PER + i, m); }
          }
        });
        for (let i = lit; i < 3; i++) flash[i].intensity = 0;
        sparks.instanceMatrix.needsUpdate = rise.instanceMatrix.needsUpdate = true;
        if (sparks.instanceColor) sparks.instanceColor.needsUpdate = true;
      };
      step(2.2);
      if (!ctx.reduced) k.ticks.push(step);
    }
    /* the crowd at the rail, and the boats out watching from the water */
    if (!ctx.reduced) {
      k.crowd([v(2.6, 0, Z0 - 4), v(2.6, 0, Z1 + 4)], 26, { seed: 41, speed: 0.12, spread: 1.1, colors: [0x1c232c, 0x8a2a2a, 0xe8e2d4, 0x2a3f6a, 0x3a5a3a, 0xd8c04a] });
      k.crowd([v(-2.2, 0, Z1 + 6), v(-2.2, 0, Z0 - 6)], 18, { seed: 42, speed: 0.3, spread: 1.4 });
      for (let i = 0; i < 6; i++) {
        const g = new T.Group();
        const h = new T.Mesh(new T.BoxGeometry(5.2, 1.1, 1.9), hull); h.position.y = -13.3; g.add(h);
        const cabin = new T.Mesh(new T.BoxGeometry(1.8, 1.0, 1.5), k.flat(0xd8d2c4, 0.2, 0.6)); cabin.position.set(-0.6, -12.4, 0); g.add(cabin);
        const lamp2 = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), warm); lamp2.position.set(2.2, -12.3, 0); g.add(lamp2);
        k.add(g);
        const route = k.spline([v(34 + i * 6, 0, 40 - i * 12), v(60 + i * 7, 0, 10 - i * 9), v(96 + i * 5, 0, -30 - i * 6), v(60, 0, -60), v(30, 0, 20)], true);
        k.rider(g, route, 1.2 + i * 0.25, i * 22);
      }
    }
    /* the works: the park wall on one side, the rail panels on the other */
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) {
      const z = Z0 - 8 - i * 9;
      mounts.push({ position: v(-4.14, 3.0, z), rotation: PI / 2, target: v(-0.6, 3, z), width: 2.8, height: 1.9, style: 'steel', wash: true });
      if (i % 2 === 0) mounts.push({ position: v(3.62, 2.3, z - 4.5), rotation: -PI / 2, target: v(0.4, 3, z - 4.5), width: 2.2, height: 1.5, style: 'steel', wash: true });
    }
    k.censusWall({ x: -4.12, y: 5.4, z: 4, rotY: PI / 2, cols: 20, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(3000, 80), pieces: ctx.all, backing: stone });
    k.box(0.4, 6.4, 20, -5.0, 3.2, 4, stone);
    /* what the railing knows */
    k.egg(v(-4.4, 2.0, 30), { id: 'first-show-1958', title: 'It started as a birthday', year: '1958', text: 'Macy\'s first large fireworks show went up on July 1, 1958, for the store\'s hundredth anniversary, from four barges in the Hudson off 85th Street. It became an annual Fourth of July show in 1976, for the Bicentennial.', clue: 'The oldest thing about tonight is not the Fourth. It is the store.', source: { name: 'Macy\'s 4th of July Fireworks, Wikipedia', url: 'https://en.wikipedia.org/wiki/Macy%27s_4th_of_July_Fireworks' } }, { r: 2.4 });
    k.egg(v(3.9, 1.6, 12), { id: 'eighty-thousand', title: 'Eighty thousand shells', text: 'A recent show fires on the order of 80,000 shells in about half an hour, from barges in the East River and from the Brooklyn Bridge itself, in some thirty colours.', clue: 'Count one burst, then give up and lean on the rail.', source: { name: 'Macy\'s 4th of July Fireworks, Wikipedia', url: 'https://en.wikipedia.org/wiki/Macy%27s_4th_of_July_Fireworks' } }, { r: 2.4 });
    k.egg(v(-4.4, 1.6, -14), { id: 'the-cantilever', title: 'A park on a lid', year: '1950 to 1951', text: 'The Promenade is a roof. Robert Moses wanted the expressway through Brooklyn Heights; the neighbourhood got it stacked in two decks against the bluff instead, with a public walkway cantilevered over the top. It opened in 1950 and 1951.', clue: 'Lean over the river side and listen to what is under your feet.', source: { name: 'Brooklyn Heights Promenade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Heights_Promenade' } }, { r: 2.6 });
    k.egg(v(3.9, 1.6, 48), { id: 'the-bridge', title: 'The bridge is part of the set', year: '1883', text: 'The Brooklyn Bridge opened on May 24, 1883, and on the Fourth it is not scenery. Shells are fired from the span itself, so the towers stand inside the show rather than behind it.', clue: 'Look north, at the thing older than every building behind it.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 3 });
    k.egg(v(-1.2, 1.4, -40), { id: 'the-quiet', title: 'The two seconds after', text: 'Sound crosses the river about two seconds behind the light. Everyone on this walkway sees the burst, waits, and then hears it, which is why the crowd cheers a beat late all night.', clue: 'Watch the water, not the sky, and count.', source: { name: 'Brooklyn Heights Promenade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Heights_Promenade' } }, { r: 2.4 });
    return { mounts, spawn: v(0, 3, Z0 - 6), look: v(70, 9, 30), eye: 3, bounds: [-3.9, 3.4, Z1 + 4, Z0 - 4], style: 'steel' };
  },
};

/* ---------------- 141 TWO IN THE MORNING, 84 KING STREET ---------------- */
export const paradisegarage: RoomDef = {
  id: 'paradisegarage',
  name: 'Two in the morning',
  area: 'THE PARADISE GARAGE / 84 KING STREET',
  mood: 'Members only, no bar',
  color: '#b83aa8',
  daylit: false,
  description: 'A parking garage on King Street with a ramp for a lobby, a sprung floor, a sound system built for the room rather than the room for the system, and no liquor licence because nobody needed one. The New Yorkers hang where the light sweeps past them, on the black walls around the floor, and the mirror ball puts the rest of the room on top of them.',
  signatures: 'The 1924 garage at 84 King Street, the long entrance ramp, the sprung wooden dance floor, Richard Long\'s custom horns and bass bins, the DJ booth above the floor, a mirror ball, no bar and no alcohol, the fruit and juice by the wall, and the doors that stayed open into the morning.',
  build(k, ctx) {
    k.sky({ top: 0x05060c, horizon: 0x0c1018, ground: 0x05060a, fog: 0.008, stars: 240, env: 0.3 });
    k.hemi(0x50597e, 0x14161e, 1.5);
    const floorW = k.pbr('pgFloor', X.planks(0x4a3a2c, 7, 41), 1.1, { roughness: 0.42, metalness: 0.1 }),
      black = k.pbr('pgWall', X.plaster(0x2e2836, 42), 1.8, { roughness: 0.88 }),
      ramp = k.pbr('pgRamp', X.concrete(0x3a3a40, 43), 0.5, { roughness: 0.75 }),
      dark = k.flat(0x0d0e12, 0.3, 0.6),
      grille = k.flat(0x1b1d22, 0.5, 0.5),
      cone = k.flat(0x2a2c32, 0.3, 0.7),
      chrome = k.flat(0xd8dee4, 1.0, 0.14),
      cherry = k.flat(0x8c1030, 0.2, 0.55),
      steelM = k.flat(0x6a7078, 0.8, 0.35);
    /* the room: 26 by 30, six and a half to the deck, everything black but the floor */
    const W = 26, D = 30, H = 6.6;
    k.box(W, 0.4, D, 0, -0.2, 0, floorW);
    k.box(W + 6, 0.4, D + 6, 0, H + 0.2, 0, dark);
    for (const s of [-1, 1]) { k.box(0.5, H, D, s * (W / 2), H / 2, 0, black); k.block(s > 0 ? W / 2 - 0.5 : -W / 2 - 0.5, s > 0 ? W / 2 + 0.5 : -W / 2 + 0.5, -D / 2, D / 2); }
    k.box(W, H, 0.5, 0, H / 2, -D / 2, black);
    /* the street wall has the ramp mouth cut out of it: two piers and a header */
    for (const sx of [-1, 1]) k.box(W / 2 - 3.5, H, 0.5, sx * (W / 2 + 3.5) / 2, H / 2, D / 2, black);
    k.box(7, H - 4.6, 0.5, 0, 4.6 + (H - 4.6) / 2, D / 2, black);
    k.sign('THE GARAGE', 5.0, 0.6, 0, 4.15, D / 2 - 0.3, 'transparent', '#e8c8f0', 90, PI);
    k.block(-W / 2, W / 2, -D / 2 - 0.5, -D / 2 + 0.5);
    k.block(-W / 2, W / 2, D / 2 - 0.5, 8.2);
    k.block(-W / 2, -3.4, D / 2 - 0.5, D / 2 + 0.5);
    k.block(3.4, W / 2, D / 2 - 0.5, D / 2 + 0.5);
    /* the ramp in: King Street behind, a long climb, the desk, then the room opens */
    k.box(7, 0.4, 26, 0, -0.2, D / 2 + 13, ramp);
    for (const s of [-1, 1]) { k.box(0.5, 4.4, 26, s * 3.5, 2.2, D / 2 + 13, ramp); k.block(s > 0 ? 3.4 : -4.0, s > 0 ? 4.0 : -3.4, D / 2, D / 2 + 26); }
    k.box(7, 0.4, 26, 0, 4.6, D / 2 + 13, dark);
    k.box(7.4, 5.0, 0.5, 0, 2.5, D / 2 + 26, dark);
    k.sign('84', 1.6, 1.2, 0, 3.4, D / 2 + 25.7, 'transparent', '#e8d8f0', 200, PI);
    for (let i = 0; i < 6; i++) { k.box(0.5, 0.1, 0.5, 0, 4.35, D / 2 + 2 + i * 3.4, k.glow(0xff4a9a, 0.5)); k.point(0, 4.0, D / 2 + 2 + i * 3.4, 0xff3a8a, 16, 9); }
    k.box(1.4, 1.0, 0.8, -2.2, 0.5, D / 2 + 21, cherry);
    k.keepOut.push({ x: -2.2, z: D / 2 + 21, r: 1.2 });
    k.sign('MEMBERS  ·  FRIDAY SATURDAY  ·  NO ALCOHOL SERVED', 3.6, 0.5, -3.2, 2.4, D / 2 + 18, '#120f16', '#d8c8e8', 52, PI / 2);
    /* the booth, raised, in the corner where Levan had it, and the light desk beside it */
    k.box(6.4, 1.5, 4.2, -W / 2 + 4.2, 0.75, -D / 2 + 3.4, dark);
    k.box(6.4, 1.1, 0.3, -W / 2 + 4.2, 2.05, -D / 2 + 5.4, dark);
    k.block(-W / 2, -W / 2 + 7.6, -D / 2, -D / 2 + 6.0);
    for (const s of [-1, 1]) { k.box(1.4, 0.16, 1.2, -W / 2 + 4.2 + s * 1.5, 1.6, -D / 2 + 3.4, k.flat(0x24262c, 0.4, 0.4)); k.cyl(0.62, 0.06, -W / 2 + 4.2 + s * 1.5, 1.7, -D / 2 + 3.4, k.flat(0x101014, 0.2, 0.5), 0.62, 20); }
    k.box(1.1, 0.14, 1.0, -W / 2 + 4.2, 1.6, -D / 2 + 4.4, k.flat(0x2e3038, 0.5, 0.35));
    const boothLamp = k.mesh(new T.SphereGeometry(0.12, 8, 6), k.glow(0xff9a3a), -W / 2 + 4.2, 2.3, -D / 2 + 3.0, true);
    k.point(-W / 2 + 4.2, 2.6, -D / 2 + 3.2, 0xff9a3a, 7, 6);
    const dj = k.mesh(new T.CapsuleGeometry(0.22, 0.66, 3, 8), k.flat(0x2a2028, 0, 0.85), -W / 2 + 4.2, 2.1, -D / 2 + 2.2, true);
    k.mesh(new T.SphereGeometry(0.15, 10, 8), k.flat(0x6a4832, 0, 0.7), -W / 2 + 4.2, 2.62, -D / 2 + 2.2, true);
    /* the stacks: four corners of horns and bass bins, cones that move with the bottom end */
    const woofers: T.Mesh[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (W / 2 - 2.6), z = sz * (D / 2 - 3.2);
      k.box(2.4, 1.5, 1.7, x, 0.75, z, grille);
      k.box(2.4, 1.5, 1.7, x, 2.3, z, grille);
      k.box(2.2, 0.9, 1.5, x, 3.5, z, dark);
      for (const dy of [0.75, 2.3]) for (const dz of [-0.4, 0.4]) {
        const w = k.mesh(new T.CylinderGeometry(0.42, 0.3, 0.2, 16), cone, x - sx * 1.22, dy, z + dz, true);
        w.rotation.z = PI / 2;
        woofers.push(w);
      }
      const horn = k.mesh(new T.CylinderGeometry(0.62, 0.22, 0.9, 4, 1, true), chrome, x - sx * 1.3, 3.5, z, true);
      horn.rotation.z = sx > 0 ? PI / 2 : -PI / 2;
      k.block(x - 1.4, x + 1.4, z - 1.1, z + 1.1);
    }
    /* the mirror ball and its speckle: eighty additive flecks on a slow rotating rig */
    const ballRig = new T.Group(); ballRig.position.set(0, 4.6, 0);
    const ball = new T.Mesh(new T.IcosahedronGeometry(0.62, 1), new T.MeshStandardMaterial({ color: 0xe8eef4, metalness: 1, roughness: 0.08, flatShading: true }));
    ballRig.add(ball);
    k.add(ballRig);
    k.beam(v(0, 5.2, 0), v(0, H, 0), 0.03, steelM, 4);
    const speckRig = new T.Group(); speckRig.position.set(0, 4.6, 0);
    {
      const rnd = X.mulberry(77);
      const speck = new T.InstancedMesh(new T.PlaneGeometry(0.3, 0.3), new T.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.38, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), 90);
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), e = new T.Euler(), one = new T.Vector3(1, 1, 1);
      for (let i = 0; i < 90; i++) {
        const y = 1 - (2 * (i + 0.5)) / 90, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996 + rnd();
        p.set(Math.cos(th) * r * 13, y * 5.4, Math.sin(th) * r * 13);
        e.set(0, -th, 0); q.setFromEuler(e);
        m.compose(p, q, one);
        speck.setMatrixAt(i, m);
      }
      speck.instanceMatrix.needsUpdate = true;
      speckRig.add(speck);
      k.add(speckRig);
    }
    /* enough standing light that the room reads as a room between flashes */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.point(sx * 9, 4.6, sz * 11, 0x8a9ad8, 160, 34);
    k.point(0, 5.4, 0, 0xcfe2ff, 190, 34);
    k.point(0, 2.4, 9, 0xb06ad8, 90, 22);
    k.point(0, 3.2, D / 2 + 8, 0xff5a9a, 70, 18);
    /* the truss and its beams: six cones of light that sweep the floor on the bar */
    const beams: { m: T.Mesh; mat: T.MeshBasicMaterial; base: number; hue: number }[] = [];
    const colours = [0xff2a6a, 0x2ad8ff, 0xffc22a, 0x8a2aff, 0x2aff9a, 0xff6a2a];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2, x = Math.cos(a) * 7.5, z = Math.sin(a) * 8.5;
      k.box(0.5, 0.4, 0.5, x, H - 0.5, z, dark);
      const g = new T.CylinderGeometry(0.06, 2.1, 8.2, 14, 1, true);
      g.translate(0, -4.1, 0);
      const mat = new T.MeshBasicMaterial({ color: colours[i], transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const mesh = k.mesh(g, mat, x, H - 0.7, z, true);
      beams.push({ m: mesh, mat, base: a, hue: i });
      k.point(x, H - 1.2, z, colours[i], 70, 22);
    }
    for (const sx of [-1, 1]) k.bar(v(sx * 8.5, H - 0.35, -D / 2 + 2), v(sx * 8.5, H - 0.35, D / 2 - 2), 0.14, 0.14, steelM);
    k.bar(v(-8.5, H - 0.35, 0), v(8.5, H - 0.35, 0), 0.14, 0.14, steelM);
    /* the floor itself: a grid of panels that come up on the beat */
    const tiles: T.Mesh[] = [];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) {
      const x = -8 + i * 4, z = -10 + j * 4;
      const t = k.mesh(new T.PlaneGeometry(3.6, 3.6), new T.MeshBasicMaterial({ color: 0x6a2aff, transparent: true, opacity: 0.09, blending: T.AdditiveBlending, depthWrite: false }), x, 0.03, z, true);
      t.rotation.x = -PI / 2;
      tiles.push(t);
    }
    /* the fruit and the juice, since there is no bar */
    k.box(4.4, 1.0, 1.2, W / 2 - 3.6, 0.5, 6.6, cherry);
    k.block(W / 2 - 6.0, W / 2 - 1.2, 5.6, 7.6);
    for (let i = 0; i < 14; i++) k.sphere(0.13, W / 2 - 5.4 + (i % 7) * 0.42, 1.12, 6.2 + Math.floor(i / 7) * 0.5, i % 3 ? k.flat(0xe8a02a, 0, 0.6) : k.flat(0xc8342a, 0, 0.6), 9);
    k.sign('NO ALCOHOL  ·  FRUIT  ·  JUICE  ·  WATER', 3.0, 0.42, W / 2 - 3.6, 2.4, 6.0, '#120f16', '#c8b8d8', 54, PI);
    /* the beat: 124 to the minute, and everything in the room answers it */
    const dancers = ctx.reduced ? null : k.crowd([v(-7, 0, -8), v(6, 0, -6), v(7, 0, 6), v(-6, 0, 8), v(-7, 0, -8)], 34, { seed: 51, speed: 0.22, spread: 3.2, closed: true, colors: [0xe8e2d4, 0xd82a6a, 0x2ad8c8, 0xf0c22a, 0x2a2a34, 0x8a4ad8, 0xff7a3a] });
    if (!ctx.reduced) {
      const strobe = k.wash(0, 0.05, 0, 0, 24, 28, 0xffffff, 0);
      strobe.rotation.x = -PI / 2;
      k.ticks.push((t, dt) => {
        const bpm = 124, beat = (t * bpm) / 60, phase = beat % 1, kick = Math.pow(1 - phase, 3.2), bar = Math.floor(beat / 4) % 8;
        ballRig.rotation.y = t * 0.36;
        speckRig.rotation.y = t * 0.36;
        speckRig.rotation.z = Math.sin(t * 0.2) * 0.12;
        beams.forEach((b, i) => {
          const s = Math.sin(t * (0.55 + i * 0.07) + b.base);
          b.m.rotation.x = 0.45 * s;
          b.m.rotation.z = 0.45 * Math.cos(t * (0.5 + i * 0.05) + b.base);
          b.mat.opacity = 0.07 + 0.16 * kick + (bar === 7 ? 0.1 : 0);
        });
        tiles.forEach((tl, i) => { (tl.material as T.MeshBasicMaterial).opacity = 0.03 + 0.22 * Math.max(0, kick - ((i * 7) % 5) * 0.08); });
        woofers.forEach((w, i) => { w.scale.x = 1 + 0.35 * kick * (i % 2 ? 1 : 0.7); });
        (strobe.material as T.MeshBasicMaterial).opacity = bar === 7 && phase < 0.16 ? 0.35 : 0;
        (boothLamp.material as T.MeshBasicMaterial).opacity = 0.5 + 0.5 * kick;
        dj.position.x = -W / 2 + 4.2 + Math.sin(beat * PI) * 0.12;
        dj.rotation.z = Math.sin(beat * PI * 0.5) * 0.06;
        if (dancers) { dancers.body.position.y = 0.06 * kick; dancers.head.position.y = 0.09 * kick; }
        void dt;
      });
      vapour(k, [v(-9, 0.4, -11), v(9, 0.4, 11), v(0, 0.4, 13)], 14, { rise: 4.4, spread: 3.0, size: 0.14, opacity: 0.035, colour: 0xc8c0d8, seed: 61, speed: 0.11, animate: true });
    }
    /* the works: the black walls around the floor, where the beams find them */
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) {
      const z = -9 + i * 4.6;
      for (const s of [-1, 1]) mounts.push({ position: v(s * (W / 2 - 0.52), 3.1, z), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(s * 6.5, 3, z), width: 2.6, height: 1.8, style: 'black', wash: true });
    }
    for (const x of [-7.5, -2.5, 2.5, 7.5]) mounts.push({ position: v(x, 3.1, -D / 2 + 0.52), rotation: 0, target: v(x, 3, -D / 2 + 6.5), width: 2.4, height: 1.7, style: 'black', wash: true });
    for (const x of [-9, 9]) mounts.push({ position: v(x, 3.1, D / 2 - 0.52), rotation: PI, target: v(x, 3, D / 2 - 6.0), width: 2.4, height: 1.7, style: 'black', wash: true });
    for (let i = 0; i < 4; i++) { const z = D / 2 + 5 + i * 5; mounts.push({ position: v(-3.24, 2.6, z), rotation: PI / 2, target: v(0, 3, z), width: 2.0, height: 1.4, style: 'black', wash: true }); }
    k.censusWall({ x: 3.24, y: 2.8, z: D / 2 + 12, rotY: -PI / 2, cols: 14, rows: 4, tile: 0.5, gap: 0.04, start: ctx.wallStart(4200, 56), pieces: ctx.all, backing: black });
    /* what the room was */
    k.egg(v(0, 2.4, D / 2 + 20), { id: 'opened-1978', title: 'The opening that failed, then worked', year: '1977 and 1978', text: 'Michael Brody took a lease on a disused parking garage at 84 King Street in 1977 and opened it unfinished, in the cold, to a party people walked out of. After a year of building he opened it properly as the Paradise Garage on January 28, 1978.', clue: 'The number over the ramp is the whole address and the first name of the club.', source: { name: 'Paradise Garage, Wikipedia', url: 'https://en.wikipedia.org/wiki/Paradise_Garage' } }, { r: 2.6 });
    k.egg(v(-W / 2 + 4.2, 2.6, -D / 2 + 3.4), { id: 'larry-levan', title: 'The booth', year: '1977 to 1987', text: 'Larry Levan was the resident here for the whole life of the club. He built a night as a single long piece rather than a run of records, and the way he did it is why the sound that followed was called garage.', clue: 'Everything in the room points at one corner. Go and stand under it.', source: { name: 'Paradise Garage, Wikipedia', url: 'https://en.wikipedia.org/wiki/Paradise_Garage' } }, { r: 2.2 });
    k.egg(v(W / 2 - 2.6, 2.4, D / 2 - 3.2), { id: 'richard-long', title: 'A system built for the room', text: 'Richard Long and Associates built the sound system to the shape of this room: custom horns, bass bins in the corners, and a sprung wooden floor under about fourteen hundred people. It was widely called the best system in the city.', clue: 'The corners of this room are not decoration.', source: { name: 'Paradise Garage, Wikipedia', url: 'https://en.wikipedia.org/wiki/Paradise_Garage' } }, { r: 2.4 });
    k.egg(v(W / 2 - 3.6, 1.6, 6.6), { id: 'no-bar', title: 'No bar, no closing time', text: 'The Garage was members only and served no alcohol, which meant no last call: fruit, juice and water were free, and the night ran into ten in the morning and later.', clue: 'Find the only thing in here you could have drunk.', source: { name: 'Paradise Garage, Wikipedia', url: 'https://en.wikipedia.org/wiki/Paradise_Garage' } }, { r: 2 });
    k.egg(v(0, 4.9, 0), { id: 'closed-1987', title: 'The last night', year: '1987', text: 'The club closed in the autumn of 1987, and Michael Brody died weeks later. The building stood until April 2018, when it was demolished. What is left is the way rooms like this one are still built.', clue: 'Look up at the one thing every club since has copied.', source: { name: 'Paradise Garage, Wikipedia', url: 'https://en.wikipedia.org/wiki/Paradise_Garage' } }, { r: 2.6 });
    return { mounts, spawn: v(0, 3, D / 2 + 3.5), look: v(-5, 3.2, -8), eye: 3, bounds: [-W / 2 + 1.2, W / 2 - 1.2, -D / 2 + 1.2, D / 2 + 24], style: 'black' };
  },
};

/* vapour is shared with n1: re-declared locally so each file stays readable on its own. */
function vapour(k: Parameters<RoomDef['build']>[0], pts: T.Vector3[], perPt: number, p: { rise?: number; spread?: number; size?: number; opacity?: number; colour?: number; seed?: number; speed?: number; animate: boolean }) {
  const { rise = 1.4, spread = 0.5, size = 0.1, opacity = 0.2, colour = 0xffffff, seed = 1, speed = 0.28, animate } = p;
  const n = pts.length * perPt, rnd = X.mulberry(seed);
  const o = k.instances(new T.SphereGeometry(size, 6, 5), new T.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false }), Array.from({ length: n }, () => new T.Matrix4()));
  o.frustumCulled = false;
  const ph = Array.from({ length: n }, (_, i) => ({ b: pts[i % pts.length], o: rnd(), dx: (rnd() - 0.5) * spread, dz: (rnd() - 0.5) * spread }));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), s = new T.Vector3();
  const place = (t: number) => {
    ph.forEach((a, i) => {
      const u = (t * speed + a.o) % 1, sc = 0.6 + u * 2.4;
      pos.set(a.b.x + a.dx * (1 + u * 3), a.b.y + u * rise, a.b.z + a.dz * (1 + u * 3));
      s.setScalar(sc * (1 - u * 0.35));
      m.compose(pos, q, s);
      o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0.4);
  if (animate) k.ticks.push(place);
  return o;
}
