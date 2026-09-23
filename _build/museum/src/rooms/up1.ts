/* Upgrade batch one (2026-09-23): the two worst rooms in the audit, rebuilt.

   Nothing here overwrites anything. The originals stay exactly where they were
   (`bleachers` in f.ts, `liberty` in j.ts); rooms/index.ts simply imports these
   versions instead, so the old code is still on disk to read or to go back to.
   The ids are unchanged, because ids are URLs, tokens and thumbnails.

   Why these two first. Every one of the 22 works in the ballpark and all 25 in
   the statue only reached a visitor because viewpoint() rescued them at runtime:
   the mounts faced away from the people looking at them (rotY = PI/2 - a puts
   the normal outward on a circle; inward is -a - PI/2), and neither room had a
   moving thing in it. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const ONE = new T.Vector3(1, 1, 1);

/* A person as one geometry, so a crowd of thousands is one draw call. */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 8, 6); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
/* A person for a crowd nobody can walk into: two boxes, 24 triangles. A capsule
   figure is 200 and a full stadium of them is a million and a half triangles. */
function boxFigureGeo() {
  const body = new T.BoxGeometry(0.34, 0.62, 0.26); body.translate(0, 0.31, 0);
  const head = new T.BoxGeometry(0.21, 0.21, 0.21); head.translate(0, 0.73, 0);
  return mergeGeometries([body, head])!;
}
/* One figure that stands still: batched with everything else of its colour. */
function figure(k: K, x: number, y: number, z: number, coat: number, p: { h?: number; rotY?: number; skin?: number } = {}) {
  const { h = 1, rotY = 0, skin = 0xc8a284 } = p;
  const b = k.mesh(new T.CapsuleGeometry(0.2, 0.82 * h, 3, 8), k.flat(coat, 0, 0.85), x, y + 0.61 * h, z);
  b.rotation.y = rotY;
  k.mesh(new T.SphereGeometry(0.125, 8, 6), k.flat(skin, 0, 0.7), x, y + 1.22 * h + 0.13, z);
  return b;
}
/* A ground ribbon between two radius functions: warning tracks, aprons, kerbs. */
function ribbon(k: K, rIn: (t: number) => number, rOut: (t: number) => number, t0: number, t1: number, y: number, steps: number, m: T.Material, dir: (t: number) => T.Vector3) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (t1 - t0) * (i / steps), d = dir(t), a = rIn(t), b = rOut(t);
    pos.push(d.x * a, y, d.z * a, d.x * b, y, d.z * b);
    uv.push((i / steps) * 24, 0, (i / steps) * 24, 1);
  }
  for (let i = 0; i < steps; i++) { const o = i * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return k.mesh(g, m);
}
/* A square of wall with a void inside: masonry that does not fill the shaft it
   surrounds. A solid box here reads the same from outside and swallows the room. */
function hollowBox(k: K, w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material, t: number) {
  k.box(w, h, t, x, y, z - d / 2 + t / 2, m);
  k.box(w, h, t, x, y, z + d / 2 - t / 2, m);
  k.box(t, h, d - t * 2, x - w / 2 + t / 2, y, z, m);
  k.box(t, h, d - t * 2, x + w / 2 - t / 2, y, z, m);
}
/* A parametric quad surface: stadium bowls, skirts, anything swept. */
function surface(k: K, rows: number, steps: number, f: (r: number, i: number) => T.Vector3, m: T.Material, uvScale = 8) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [], W = steps + 1;
  for (let r = 0; r <= rows; r++) for (let i = 0; i <= steps; i++) {
    const p = f(r, i); pos.push(p.x, p.y, p.z); uv.push((i / steps) * uvScale, (r / rows) * 2);
  }
  for (let r = 0; r < rows; r++) for (let i = 0; i < steps; i++) {
    const o = r * W + i; idx.push(o, o + 1, o + W, o + 1, o + W + 1, o + W);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return k.mesh(g, m);
}

/* ---------------- 24 BOTTOM OF THE NINTH (rebuild) ---------------- */
export const bleachers2: RoomDef = {
  id: 'bleachers',
  name: 'Bottom of the ninth',
  area: 'THE BRONX BALLPARK',
  mood: 'Two out, full count',
  color: '#9fb4d6',
  daylit: false,
  description: 'You are standing on the warning track in right centre with your back to the wall and the whole bowl in front of you: the skin of the infield raked, four towers of light on the grass, forty thousand people in three decks under the white frieze, and a full count in the bottom of the ninth. The New Yorkers hang along the outfield wall where the advertising would be, and every so often the ball comes out to meet them.',
  signatures: 'The white steel frieze around the top of the upper deck, the navy padded outfield wall with its yellow line and the warning track, the infield skin and the mound, the black batter\'s eye in centre field, Monument Park behind it, four light towers, the scoreboard over the bleachers, and the bleachers themselves.',
  build(k, ctx) {
    k.sky({ top: 0x050811, horizon: 0x18213c, ground: 0x080b11, fog: 0.0026, stars: 520, env: 0.4 });
    k.hemi(0x7f96c8, 0x2a3420, 0.95);
    k.sun(0xdde6ff, 0.5, 30, 120, 30, true, 95);
    const grassA = k.pbr('bpGrassA', X.grass(0x2f6b34, 9), 0.18, { roughness: 0.95 }),
      grassB = k.pbr('bpGrassB', X.grass(0x255829, 10), 0.18, { roughness: 0.95 }),
      dirt = k.pbr('bpDirt', X.concrete(0x8a5a3c, 11), 0.32, { roughness: 1 }),
      track = k.pbr('bpTrack', X.concrete(0x7c4a2e, 13), 0.36, { roughness: 1 }),
      navy = k.pbr('bpPad', X.plaster(0x15325e, 17), 0.5, { roughness: 0.88 }),
      conc = k.pbr('bpConc', X.concrete(0x84847e, 12), 0.2),
      granite = k.pbr('bpGran', X.ashlar(0x6f675c, 15, 4), 0.35),
      steelW = k.flat(0xe6e9e4, 0.5, 0.45),
      dark = k.flat(0x11141a, 0.4, 0.6),
      chalk = k.flat(0xf2f4f0, 0, 0.85),
      yellow = k.flat(0xf1c531, 0, 0.6),
      glow = k.glow(0xfff6e0);
    /* the geometry of a ball field: t = 0 is dead centre, the foul lines at a quarter turn */
    const FOUL = PI / 4;
    const dir = (t: number) => v(Math.sin(t), 0, -Math.cos(t));
    const wallR = (t: number) => { const u = Math.max(-1, Math.min(1, t / FOUL)); return 78 - 17 * u * u - 1.6 * u; };
    /* the stands come in from the foul poles to sit close behind home */
    const innerR = (t: number) => {
      const a = Math.abs(t);
      if (a <= FOUL) return wallR(t) + 5;
      const u = Math.min(1, (a - FOUL) / (PI * 0.32)), e = 1 - (1 - u) * (1 - u);
      return (wallR(Math.sign(t) * FOUL) + 5) * (1 - e) + 32 * e;
    };
    /* the field: a mown fan out of home plate, the skin, the diamond, the track */
    k.box(360, 0.4, 360, 0, -0.22, -40, grassB);
    for (let i = 0; i < 16; i++) {
      const t0 = -FOUL + (i / 16) * FOUL * 2, t1 = -FOUL + ((i + 1) / 16) * FOUL * 2;
      ribbon(k, () => 7, (t) => wallR(t) - 5.4, t0, t1, 0.02, 3, i % 2 ? grassA : grassB, dir);
    }
    ribbon(k, (t) => wallR(t) - 5.4, (t) => wallR(t) - 0.3, -FOUL - 0.06, FOUL + 0.06, 0.03, 40, track, dir);
    { const g = new T.RingGeometry(0, 29, 40, 1, PI / 4, PI / 2); g.rotateX(-PI / 2); k.mesh(g, dirt, 0, 0.04, 0); }
    { /* the infield grass inside the base paths */
      const s = new T.Shape(); const B = 27.4, i2 = 2.6;
      s.moveTo(0, -i2 * 1.4); s.lineTo(B * 0.707 - i2, -B * 0.707 + i2 * 0.4); s.lineTo(0, -B * 1.414 + i2 * 1.4); s.lineTo(-B * 0.707 + i2, -B * 0.707 + i2 * 0.4); s.closePath();
      const g = new T.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false }); g.rotateX(-PI / 2);
      k.mesh(g, grassA, 0, 0.06, 0);
    }
    { const g = new T.CircleGeometry(2.8, 22); g.rotateX(-PI / 2); k.mesh(g, dirt, 0, 0.12, -18.4); }
    k.cyl(2.8, 0.22, 0, 0.09, -18.4, dirt, 3.0, 22);
    { const g = new T.CircleGeometry(4.0, 22); g.rotateX(-PI / 2); k.mesh(g, dirt, 0, 0.07, -1.2); }
    for (const [bx, bz] of [[19.4, -19.4], [0, -38.8], [-19.4, -19.4]]) k.box(0.42, 0.06, 0.42, bx, 0.1, bz, chalk);
    k.box(0.44, 0.05, 0.44, 0, 0.1, 0, chalk);
    for (const s of [-1, 1]) { const ln = k.box(0.12, 0.03, 118, 0, 0.09, 0, chalk); ln.rotation.y = s * FOUL; ln.position.set(Math.sin(s * FOUL) * 59, 0.09, -Math.cos(s * FOUL) * 59); }
    /* the wall: navy padding with the yellow line, taller in centre for the batter's eye */
    /* The wall is not an arc: it pulls in hard toward the foul poles, so a panel laid
       square to the radius shingles across its neighbour and stands in front of the art.
       Every panel and every work is laid along the true tangent instead. */
    const wallAt = (t: number) => {
      const h = 0.002, R = wallR(t), Rp = (wallR(t + h) - wallR(t - h)) / (2 * h);
      const st = Math.sin(t), ct = Math.cos(t);
      const tx = Rp * st + R * ct, tz = -Rp * ct + R * st, L = Math.hypot(tx, tz);
      return { x: st * R, z: -ct * R, rot: Math.atan2(-tz / L, tx / L), nx: -tz / L, nz: tx / L, speed: L };
    };
    const SEG = 110, SPAN = FOUL + 0.3, DT = (SPAN * 2) / SEG;
    const eyeMat = k.pbr('bpEye', X.plaster(0x14281c, 19), 0.5, { roughness: 0.95 });
    for (let i = 0; i < SEG; i++) {
      const t = -SPAN + (i + 0.5) * DT, a = wallAt(t);
      const eye = Math.abs(t) < 0.16, h = eye ? 4.6 : 2.4, w = a.speed * DT + 0.3;
      const b = k.box(w, h, 0.6, a.x, h / 2, a.z, eye ? eyeMat : navy); b.rotation.y = a.rot;
      const y = k.box(w, 0.14, 0.7, a.x, h + 0.05, a.z, yellow); y.rotation.y = a.rot;
      /* the block sits behind the padding, so the track in front of a work stays walkable */
      if (i % 2 === 0) k.block(a.x - a.nx * 1.3 - 1.5, a.x - a.nx * 1.3 + 1.5, a.z - a.nz * 1.3 - 1.5, a.z - a.nz * 1.3 + 1.5);
    }
    for (const s of [-1, 1]) { const d = dir(s * FOUL), r = wallR(s * FOUL); k.cyl(0.35, 22, d.x * r, 11, d.z * r, yellow, 0.35, 10); }
    /* the bowl: three decks all the way round, a skirt below the first, the frieze on top */
    const decks = [{ rows: 12, y0: 2.4, dy: 0.66, r0: 0 }, { rows: 10, y0: 17.0, dy: 0.76, r0: 11 }, { rows: 8, y0: 31.5, dy: 0.84, r0: 23 }];
    const seatPos: number[] = [], seatAng: number[] = [];
    for (const d of decks) {
      surface(k, d.rows, 170, (r, i) => { const t = -PI + (i / 170) * PI * 2, rad = innerR(t) + d.r0 + r * 0.92, dd = dir(t); return v(dd.x * rad, d.y0 + r * d.dy, dd.z * rad); }, conc, 30);
      surface(k, 1, 170, (r, i) => { const t = -PI + (i / 170) * PI * 2, rad = innerR(t) + d.r0, dd = dir(t); return v(dd.x * rad, r ? d.y0 : Math.max(0, d.y0 - 13), dd.z * rad); }, conc, 30);
      for (let r = 0; r < d.rows; r++) {
        const y = d.y0 + r * d.dy + 0.45;
        const n = Math.max(60, Math.round((PI * 2 * (innerR(0) + d.r0 + r * 0.92)) / 1.7));
        for (let i = 0; i < n; i++) {
          const t = -PI + (i / n) * PI * 2, rad = innerR(t) + d.r0 + r * 0.92 + 0.2, dd = dir(t);
          seatPos.push(dd.x * rad, y, dd.z * rad); seatAng.push(t);
        }
      }
    }
    const N = seatAng.length;
    { /* the seats themselves, then the people in about three of every five */
      const rnd = X.mulberry(1923), m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const chairs: T.Matrix4[] = [];
      for (let i = 0; i < N; i++) {
        p.set(seatPos[i * 3], seatPos[i * 3 + 1] - 0.2, seatPos[i * 3 + 2]);
        q.setFromAxisAngle(up, -seatAng[i]);
        chairs.push(new T.Matrix4().compose(p, q, ONE));
      }
      const seats = k.instances(new T.BoxGeometry(0.62, 0.62, 0.55), k.flat(0x16305c, 0.1, 0.72), chairs);
      seats.castShadow = seats.receiveShadow = false;
      const keep: number[] = [];
      for (let i = 0; i < N; i++) if (rnd() < (ctx.quality === 'high' ? 0.6 : 0.4)) keep.push(i);
      const P = keep.length;
      const crowd = k.instances(boxFigureGeo(), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: P }, () => new T.Matrix4()));
      crowd.frustumCulled = false; crowd.castShadow = crowd.receiveShadow = false;
      const c = new T.Color(), pal = [0x1c232c, 0xe8e2d4, 0x2a3f6a, 0x8a2a2a, 0xd8c04a, 0x3a5a3a, 0xf0f0f0, 0x6a4a8a, 0x2b5f6e, 0xd07a3a, 0x14306a];
      const hs = new Float32Array(P), ph = new Float32Array(P);
      for (let j = 0; j < P; j++) { crowd.setColorAt(j, c.set(pal[Math.floor(rnd() * pal.length)])); hs[j] = 0.85 + rnd() * 0.3; ph[j] = rnd() * 6.3; }
      if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
      /* flashbulbs: forty planes in the decks that pop when the place goes up */
      const FB = 60, bulbs = k.instances(new T.PlaneGeometry(0.5, 0.5), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), Array.from({ length: FB }, () => new T.Matrix4()));
      bulbs.frustumCulled = false;
      const bulbAt = Array.from({ length: FB }, () => keep[Math.floor(rnd() * P)]);
      const state = { cheer: 0 };
      /* Four thousand people is only worth the arithmetic while something is
         happening, so the rig writes one frame at rest and then sleeps. */
      const hide = new T.Vector3(0.0001, 0.0001, 0.0001), idq = new T.Quaternion(), sc = new T.Vector3(1, 1, 1);
      let awake = true;
      const place = (t: number) => {
        const waveOn = state.cheer < 0.05 && t % 52 < 15, wa = waveOn ? t * 1.15 : 0;
        const active = waveOn || state.cheer > 0.01;
        if (!active && !awake) return;
        awake = active;
        for (let j = 0; j < P; j++) {
          const i = keep[j];
          let lift = state.cheer * 0.3 * (0.55 + 0.45 * Math.sin(ph[j] * 3 + t * 7));
          if (waveOn) lift += 0.6 * Math.pow(Math.max(0, Math.cos(seatAng[i] - wa)), 12);
          p.set(seatPos[i * 3], seatPos[i * 3 + 1] + lift, seatPos[i * 3 + 2]);
          sc.set(1, hs[j] + 0.4 * lift, 1);
          m.compose(p, idq, sc);
          crowd.setMatrixAt(j, m);
        }
        crowd.instanceMatrix.needsUpdate = true;
        for (let b = 0; b < FB; b++) {
          const i = bulbAt[b];
          const on = state.cheer > 0.15 && ((t * 9 + b * 1.7) % 1) < 0.22;
          p.set(seatPos[i * 3], seatPos[i * 3 + 1] + 0.5, seatPos[i * 3 + 2]);
          q.setFromAxisAngle(up, -seatAng[i] + PI);
          m.compose(p, q, on ? ONE : hide);
          bulbs.setMatrixAt(b, m);
        }
        bulbs.instanceMatrix.needsUpdate = true;
      };
      place(0);
      /* the ball: the set, the pitch, the swing, and the ride out to the seats */
      if (!ctx.reduced) {
        const ball = k.mesh(new T.SphereGeometry(0.19, 8, 6), k.glow(0xfffbe8), 0, 1.8, -18.4, true);
        const land = dir(0.46).multiplyScalar(97);
        const CYC = 16;
        k.ticks.push((t, dt) => {
          const ph2 = t % CYC;
          if (ph2 < 9) { ball.position.set(0, 1.75 + 0.04 * Math.sin(t * 2), -18.4); }
          else if (ph2 < 9.55) { const u = (ph2 - 9) / 0.55; ball.position.set(0, 1.75 - 0.75 * u, -18.4 + 17.8 * u); }
          else if (ph2 < 13.4) { const u = (ph2 - 9.55) / 3.85; ball.position.set(land.x * u, 1.0 + 34 * u * (1 - u * 0.62), -0.6 + (land.z + 0.6) * u); }
          else ball.position.set(land.x, 14, land.z);
          state.cheer = ph2 > 13.2 ? Math.min(1, (ph2 - 13.2) * 3) * Math.max(0, 1 - (ph2 - 14.4) * 0.6) : Math.max(0, state.cheer - dt * 1.5);
          place(t);
        });
      }
    }
    /* the frieze, the towers, the board */
    const friezeR = (t: number) => innerR(t) + 23 + 8 * 0.84 + 2.4, friezeY = 31.5 + 8 * 0.84 + 1.2;
    for (let i = 0; i < 88; i++) {
      const t0 = -PI + (i / 88) * PI * 2, t1 = -PI + ((i + 1) / 88) * PI * 2;
      const a = dir(t0).multiplyScalar(friezeR(t0)).setY(friezeY), b = dir(t1).multiplyScalar(friezeR(t1)).setY(friezeY);
      k.curve([a, a.clone().lerp(b, 0.5).add(v(0, 2.6, 0)), b], 0.2, steelW, 6);
      k.beam(a, a.clone().add(v(0, 3.4, 0)), 0.14, steelW, 5);
    }
    surface(k, 1, 88, (r, i) => { const t = -PI + (i / 88) * PI * 2, dd = dir(t), rad = friezeR(t); return v(dd.x * rad, friezeY + 3.4 + r * 0.5, dd.z * rad); }, steelW, 40);
    for (const t of [-0.62, 0.62, -2.35, 2.35]) {
      const d = dir(t), r = friezeR(t) + 3;
      k.box(1.4, 52, 1.4, d.x * r, 26, d.z * r, dark);
      const head = k.box(11, 3.6, 0.7, d.x * r, 52, d.z * r, dark); head.rotation.y = -t;
      for (let i = -4; i <= 4; i++) for (const dy of [-1.1, 0, 1.1]) k.sphere(0.32, d.x * r + Math.cos(t) * i * 1.15, 52 + dy, d.z * r - Math.sin(t) * i * 1.15, glow, 6);
      k.spot(d.x * r, 53, d.z * r, 0, 0, -22, 0xffffff, 3400, 0.5, 0.55, 240);
    }
    k.point(0, 40, -30, 0xdde8ff, 900, 130);
    { const t = 0, d = dir(t), r = innerR(t) + 12;
      k.box(34, 14, 1.2, d.x * r, 44, d.z * r, dark);
      k.sign('BOT 9  ·  2 OUT  ·  3 AND 2', 30, 5.6, d.x * (r - 0.7), 45.5, d.z * (r - 0.7), '#0b1018', '#f4e08a', 62, PI);
      k.sign('NEW YORKERS  7    VISITORS  6', 30, 3.4, d.x * (r - 0.7), 40.6, d.z * (r - 0.7), '#0b1018', '#dfe8ff', 58, PI);
    }
    /* Monument Park behind the batter's eye, lit, with the plaques facing the field */
    { const d = dir(0), r = wallR(0) + 9;
      k.box(26, 0.4, 14, d.x * r, 0.9, d.z * r, k.pbr('bpPark', X.pavers(0x8a857a, 16), 0.5));
      for (let i = 0; i < 5; i++) { const x = -9 + i * 4.5; k.box(1.5, 2.2, 0.5, x, 2.2, d.z * r + 2, granite); k.box(1.1, 1.3, 0.1, x, 2.4, d.z * r + 1.72, k.flat(0x8a6a2a, 0.8, 0.4)); k.point(x, 3.6, d.z * r + 3.4, 0xffd9a0, 24, 8); }
      for (let i = 0; i < 6; i++) k.tree(-12 + i * 5, 1.1, d.z * r - 4, { h: 4.5, r: 2.0, kind: 'round', seed: i, leaf: 0x24421f });
    }
    /* the nine on the field, and the bullpens */
    figure(k, 0, 0, -18.0, 0xf2f4f0, { rotY: PI });
    figure(k, 0, 0, -0.1, 0x14306a, { h: 0.85, rotY: 0 });
    figure(k, 0.6, 0, 1.2, 0x2a2a30, { h: 0.9 });
    figure(k, -1.0, 0, -0.9, 0xf2f4f0, { rotY: 0.4 });
    for (const [fx, fz] of [[21, -22], [-21, -22], [3, -42], [-26, -52], [2, -62], [30, -58], [16, -30], [-15, -30]]) figure(k, fx, 0, fz, 0xf2f4f0, { rotY: Math.atan2(-fx, -fz) + PI });
    for (const s of [-1, 1]) { const d = dir(s * 0.66), r = wallR(s * 0.66) - 9; k.box(12, 0.14, 4, d.x * r, 0.05, d.z * r, dirt); for (let i = 0; i < 3; i++) figure(k, d.x * r - 4 + i * 4, 0, d.z * r, 0xf2f4f0, { rotY: -s * 1.2 }); }
    /* the works: the outfield wall, where the advertising would be */
    const mounts: Mount[] = [];
    for (let j = 0; j < 8; j++) for (const s of [-1, 1]) {
      const t = s * (0.205 + j * 0.082), a = wallAt(t);
      mounts.push({ position: v(a.x + a.nx * 0.34, 1.45, a.z + a.nz * 0.34), rotation: a.rot, target: v(a.x + a.nx * 4.8, 1.45, a.z + a.nz * 4.8), width: 3.0, height: 1.85, style: 'steel', wash: true });
    }
    { const a = wallAt(0);
      k.censusWall({ x: a.x + a.nx * 0.34, y: 3.1, z: a.z + a.nz * 0.34, rotY: a.rot, cols: 24, rows: 4, tile: 0.44, gap: 0.04, start: ctx.wallStart(4900, 96), pieces: ctx.all, backing: dark });
    }
    /* what the park knows */
    const src = { name: 'Yankee Stadium, Wikipedia', url: 'https://en.wikipedia.org/wiki/Yankee_Stadium' };
    k.egg(v(dir(-0.6).x * (wallR(-0.6) - 1.4), 2.0, dir(-0.6).z * (wallR(-0.6) - 1.4)), { id: 'opened-2009', title: 'Two point three billion dollars', year: '2009', text: 'The ballpark opened in April 2009, three years after the ground was broken on August 16, 2006, at a cost of about 2.3 billion dollars, of which 1.2 billion was public subsidy. It seats 46,537, ten thousand fewer than the park it replaced.', clue: 'The newest thing in the Bronx is the most expensive thing ever built for a game.', source: src }, { r: 2.8 });
    k.egg(v(dir(0.62).x * (wallR(0.62) - 1.4), 2.0, dir(0.62).z * (wallR(0.62) - 1.4)), { id: 'short-porch', title: 'The short porch', text: 'Left field is 318 feet, centre 408, right field 314, and the right field wall stands an average of five feet closer to home plate than the old one did. That is the porch, and it is why left handed hitters love this place.', clue: 'Pace the wall from one foul pole to the other and notice which way is shorter.', source: src }, { r: 2.8 });
    k.egg(v(0, 3.4, wallR(0) * -1 - 0.9), { id: 'monument-park', title: 'The monuments moved', year: '2009', text: 'Monument Park used to sit beyond the left field fence in the old stadium. It was moved behind centre field here: the transfer began on November 10, 2008 and the monuments were set in place from February 23, 2009.', clue: 'Look over the black wall in dead centre at the granite standing in the dark.', source: src }, { r: 3.4 });
    k.egg(v(dir(0.3).x * (wallR(0.3) - 1.4), 2.0, dir(0.3).z * (wallR(0.3) - 1.4)), { id: 'world-series-2009', title: 'The twenty seventh', year: '2009', text: 'In its first season the park held a World Series. The Yankees beat the Phillies four games to two, winning the twenty seventh championship on November 4, 2009.', clue: 'The building was eight months old the night it paid for itself.', source: src }, { r: 2.8 });
    k.egg(v(dir(-0.3).x * (wallR(-0.3) - 1.4), 2.0, dir(-0.3).z * (wallR(-0.3) - 1.4)), { id: 'the-frieze', title: 'The frieze is a copy', text: 'The white scallop running round the top of the upper deck is a replica of the frieze that was the trademark of the previous ballpark, built in steel and coated with zinc so it does not rust.', clue: 'Look up at the only part of the old place that came across the street.', source: src }, { r: 2.8 });
    return { mounts, spawn: v(dir(0.44).x * (wallR(0.44) - 6.5), 3, dir(0.44).z * (wallR(0.44) - 6.5)), look: v(-8, 4, -26), eye: 3, bounds: [-50, 50, -82, -2], style: 'steel' };
  },
};

/* ---------------- 45 THE CLIMB TO THE CROWN (rebuild) ---------------- */
export const liberty2: RoomDef = {
  id: 'liberty',
  name: 'The climb to the crown',
  area: 'LIBERTY ISLAND',
  mood: 'Harbor morning',
  color: '#7fb8a8',
  description: 'The eleven pointed star of the old fort, Hunt\'s pedestal on top of it, and then the spiral inside the copper: up the armature Eiffel built, past the works hung on the inner wall, to the twenty five windows of the crown and the harbour through them. Ferries come and go below all morning and the gulls never land.',
  signatures: 'The eleven pointed star of Fort Wood, Richard Morris Hunt\'s granite pedestal, the green copper robe and the raised right arm with the torch, the seven rayed crown and its twenty five windows, the tablet reading JULY IV MDCCLXXVI held across her body, the broken chains at her feet, Eiffel\'s iron armature and the helix stair, and the harbour with its ferries and the city beyond.',
  build(k, ctx) {
    k.sky({ top: 0x3d7ec4, horizon: 0xc6dbea, ground: 0x4a5a5c, fog: 0.0009, sun: { az: 2.4, el: 0.5, color: 0xfff6e8, size: 10 }, env: 1.0 });
    k.hemi(0xd6e6ff, 0x6a6a5e, 0.8);
    k.sun(0xfff0dc, 2.3, 60, 70, 40, true, 130);
    const copper = k.pbr('lbCopper', X.patina(0x5f9a8c), 0.55, { roughness: 0.62, metalness: 0.25, side: T.DoubleSide }),
      copperIn = k.pbr('lbCopperIn', X.patina(0x4a7f74), 0.6, { roughness: 0.75, metalness: 0.2, side: T.BackSide }),
      granite = k.pbr('lbGranite', X.ashlar(0xa89c88, 88, 3), 0.24),
      fortS = k.pbr('lbFort', X.ashlar(0x7a7268, 89, 2), 0.2),
      iron = k.flat(0x3a2e26, 0.55, 0.62),
      ironL = k.flat(0x5a4a3e, 0.5, 0.6),
      tread = k.pbr('lbTread', X.steel(0x7a7c80, true, 90), 0.8, { metalness: 0.5, roughness: 0.5 }),
      glass = k.glass(0xe8f4f8, 0.1, 0.04),
      glowT = k.glow(0xffd070),
      lawn = k.pbr('lbLawn', X.grass(0x4b6b3a, 47), 0.07),
      paving = k.pbr('lbPath', X.pavers(0x9a9488, 49), 0.4),
      wood = k.flat(0x5a4632, 0, 0.8),
      hull = k.flat(0x1d2a33, 0.3, 0.6);
    /* the harbour, the island, the fort, the far shores */
    k.water({ y: -1.2, color: 0x2e5468, w: 1000, d: 1000, amp: 1.0 });
    k.mesh(new T.CylinderGeometry(70, 74, 2, 11), lawn, 0, -0.9, 0);
    { const star = new T.Shape();
      for (let i = 0; i < 22; i++) { const a = (i / 22) * PI * 2, r = i % 2 ? 24 : 34; if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      star.closePath();
      const g = new T.ExtrudeGeometry(star, { depth: 6, bevelEnabled: false }); g.rotateX(-PI / 2);
      k.mesh(g, fortS, 0, 0, 0);
    }
    /* the pedestal, hollow, because the stair goes up the middle of it */
    k.mesh(new T.CylinderGeometry(15, 16, 8, 8), granite, 0, 10, 0);
    hollowBox(k, 22, 18, 22, 0, 23, 0, granite, 1.1);
    for (let i = 0; i < 4; i++) hollowBox(k, 23 - i * 0.5, 0.8, 23 - i * 0.5, 0, 14.4 + i * 5.7, 0, granite, 1.1);
    hollowBox(k, 24, 2, 24, 0, 33, 0, granite, 1.1);
    hollowBox(k, 25.4, 1, 25.4, 0, 34.5, 0, granite, 1.2);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; k.column(Math.cos(a) * 13, 14.8, Math.sin(a) * 13, 16, 1.1, granite, false, granite); }
    k.skyline({ z: -430, count: 44, spacing: 9, scale: 2.8, base: -1.2, seed: 112, lit: 0.3, glow: 0.7, tint: 0x6e7684, spires: true });
    k.skyline({ z: -330, count: 12, spacing: 12, scale: 0.9, base: -1.2, seed: 113, lit: 0.2, glow: 0.5, tint: 0x8a6a5a, rows: 1, x: -250 });
    /* the walk up from the dock: nothing on the sightline, she is the reason you came */
    k.box(9, 0.4, 44, 0, 1.0, 36, paving);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, x = Math.cos(a) * 52, z = Math.sin(a) * 52 + 4; if (Math.abs(x) < 17 && z > -6) continue; k.tree(x, 1.0, z, { h: 6.5, r: 3.0, kind: 'round', seed: i, leaf: 0x30582c }); }
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) k.bench(s * 9, 44 - i * 7, s > 0 ? -PI / 2 : PI / 2, wood, iron, 2.2);
    { k.cyl(0.14, 20, 24, 11, 22, k.flat(0xd8d2c4, 0.4, 0.5), 0.1, 10);
      const flag = k.mesh(new T.PlaneGeometry(4.2, 2.6), k.flat(0xcf3a3a, 0, 0.85, { side: T.DoubleSide }), 24, 19.4, 22, true);
      flag.geometry.translate(2.1, 0, 0);
      if (!ctx.reduced) k.ticks.push((t) => { flag.rotation.y = 0.7 + 0.32 * Math.sin(t * 1.9) + 0.1 * Math.sin(t * 4.7); flag.rotation.z = 0.05 * Math.sin(t * 3.1); });
    }
    /* the dock and the ferries, one in and one out all morning */
    k.box(16, 1.4, 7, 0, 0.3, 62, wood);
    for (let i = 0; i < 6; i++) k.cyl(0.4, 6, -7 + i * 2.8, -1.5, 65, wood, 0.4, 8);
    if (!ctx.reduced) {
      for (let i = 0; i < 3; i++) {
        const g = new T.Group();
        const h = new T.Mesh(new T.BoxGeometry(9, 4.2, 34), hull); h.position.y = 1.4; g.add(h);
        const deck = new T.Mesh(new T.BoxGeometry(9.4, 0.4, 34), k.flat(0xd8d2c4, 0.2, 0.6)); deck.position.y = 3.6; g.add(deck);
        const cab = new T.Mesh(new T.BoxGeometry(7, 3.4, 16), k.flat(0xe8e2d4, 0.2, 0.6)); cab.position.set(0, 5.3, -2); g.add(cab);
        const stack = new T.Mesh(new T.CylinderGeometry(1.0, 1.1, 4, 10), k.flat(0x8a2a2a, 0.2, 0.7)); stack.position.set(0, 8.4, -4); g.add(stack);
        k.add(g);
        const route = k.spline([v(0, -0.6, 78), v(-90 - i * 30, -0.6, 92), v(-200, -0.6, -60), v(-60, -0.6, -150), v(90 + i * 20, -0.6, -60), v(60, -0.6, 92)], true);
        k.rider(g, route, 5 + i * 1.4, i * 120);
      }
      k.crowd([v(-6, 1.2, 58), v(-4, 1.2, 34), v(-2, 1.2, 20), v(0, 1.2, 13)], 22, { seed: 61, speed: 0.22, spread: 1.6, colors: [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8, 0xff8c3b] });
      k.crowd([v(-40, 1.2, 30), v(0, 1.2, 46), v(40, 1.2, 30), v(46, 1.2, -6), v(0, 1.2, -30), v(-46, 1.2, -6)], 26, { seed: 62, speed: 0.4, spread: 3.0, closed: true });
      const NG = 26, bodyG = new T.ConeGeometry(0.16, 0.8, 5); bodyG.rotateX(PI / 2);
      const gulls = k.instances(bodyG, k.flat(0xdde2e6, 0, 0.85), Array.from({ length: NG }, () => new T.Matrix4()));
      const wings = k.instances(new T.BoxGeometry(1.5, 0.04, 0.34), k.flat(0xe8ecee, 0, 0.9), Array.from({ length: NG }, () => new T.Matrix4()));
      gulls.frustumCulled = wings.frustumCulled = false;
      const rnd = X.mulberry(9), st = Array.from({ length: NG }, () => ({ a: rnd() * PI * 2, r: 60 + rnd() * 70, y: 18 + rnd() * 40, w: 0.5 + rnd() * 0.6, f: rnd() * 6.3 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      k.ticks.push((t) => {
        st.forEach((b, i) => {
          const a = b.a + t * 0.16 * b.w;
          p.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.6 + b.f) * 2.2, Math.sin(a) * b.r);
          q.setFromAxisAngle(up, -a + PI / 2);
          m.compose(p, q, ONE); gulls.setMatrixAt(i, m);
          sc.set(1, 1, 0.3 + 0.7 * Math.abs(Math.sin(t * 5 + b.f)));
          m.compose(p, q, sc); wings.setMatrixAt(i, m);
        });
        gulls.instanceMatrix.needsUpdate = wings.instanceMatrix.needsUpdate = true;
      });
    }
    /* The figure, to her own proportions: 151 feet from the heel on the pedestal to
       the flame, the head 111 feet up. A tapered cone with an arm stuck on it does not
       read as her from anywhere on the island, so she is built like a person: robe,
       shoulders, neck, head, crown, one arm raised and one across the body. */
    const SY = 35;
    const robePts: [number, number][] = [[0, 5.6], [2.5, 5.5], [8, 5.2], [14, 4.8], [19, 4.35], [23, 3.9], [26, 3.5], [28, 3.1], [29.6, 2.2]];
    const robeR = (h: number) => {
      if (h <= 0) return 7.2;
      for (let i = 1; i < robePts.length; i++) if (h <= robePts[i][0]) { const a = robePts[i - 1], b = robePts[i]; return a[1] + (b[1] - a[1]) * ((h - a[0]) / (b[0] - a[0])); }
      return 2.2;
    };
    k.lathe([[0, 0] as number[]].concat(robePts.map(([h, r]) => [r, h])).concat([[0, 29.8]]), 0, SY, 0, copper, 36);
    k.lathe(robePts.map(([h, r]) => [Math.max(0.4, r - 0.32), h]), 0, SY, 0, copperIn, 28);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * PI * 2, pts: T.Vector3[] = [];
      for (let h = 1; h <= 28; h += 2.5) { const r = robeR(h) + 0.1; pts.push(v(Math.cos(a) * r, SY + h, Math.sin(a) * r)); }
      k.curve(pts, 0.15, copper, 20);
    }
    { const sh = k.mesh(new T.SphereGeometry(2.9, 20, 14), copper, 0, SY + 29.2, 0); sh.scale.set(1.55, 0.72, 1.05); }
    k.cyl(1.25, 1.9, 0, SY + 30.6, 0, copper, 1.5, 14);
    { const low = new T.SphereGeometry(2.05, 24, 16, 0, PI * 2, 1.30, PI - 1.30); k.mesh(low, copper, 0, SY + 32.3, 0);
      const top = new T.SphereGeometry(2.05, 24, 10, 0, PI * 2, 0, 0.44); k.mesh(top, copper, 0, SY + 32.3, 0); }
    k.box(1.5, 0.4, 0.5, 0, SY + 32.3, 1.85, copper);
    k.box(0.4, 0.8, 0.6, 0, SY + 31.7, 1.92, copper);
    /* the crown: a band on the head, seven rays fanned out and up */
    const BR = 2.3, BY = SY + 33.5, BH = 1.3;
    k.mesh(new T.CylinderGeometry(BR, BR, BH, 22, 1, true, PI * 0.55, PI * 0.9), copper, 0, BY, 0);
    for (let i = 0; i <= 25; i++) { const a = -PI * 0.55 + (i / 25) * PI * 1.1; const pier = k.box(0.13, BH, 0.34, Math.sin(a) * BR, BY, Math.cos(a) * BR, copper); pier.rotation.y = a; }
    for (let i = 0; i < 25; i++) { const a = -PI * 0.55 + ((i + 0.5) / 25) * PI * 1.1; const w = k.box(0.05, BH * 0.78, 0.27, Math.sin(a) * BR, BY, Math.cos(a) * BR, glass); w.rotation.y = a; }
    k.torus(2.36, 0.1, 0, BY + 0.7, 0, copper, 28).rotation.x = PI / 2;
    k.torus(2.36, 0.1, 0, BY - 0.7, 0, copper, 28).rotation.x = PI / 2;
    for (let i = 0; i < 7; i++) {
      const a = -PI * 0.55 + (i / 6) * PI * 1.1;
      const spike = k.mesh(new T.ConeGeometry(0.3, 3.9, 6), copper, Math.sin(a) * 2.4, SY + 35.0, Math.cos(a) * 2.4);
      spike.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(Math.sin(a) * Math.sin(0.85), Math.cos(0.85), Math.cos(a) * Math.sin(0.85)).normalize());
    }
    /* the right arm, raised, and the torch at the top of it */
    k.beam(v(2.0, SY + 29.0, 0.3), v(3.6, SY + 36.0, 0.6), 0.92, copper, 10);
    k.beam(v(3.6, SY + 36.0, 0.6), v(4.8, SY + 41.5, 0.6), 0.74, copper, 10);
    k.sphere(0.85, 4.85, SY + 41.8, 0.6, copper, 12);
    k.cyl(0.46, 2.0, 4.95, SY + 42.9, 0.6, copper, 0.64, 14);
    k.cyl(1.3, 1.05, 5.05, SY + 44.1, 0.6, k.flat(0xd9b24a, 0.9, 0.3), 0.72, 20);
    k.mesh(new T.SphereGeometry(1.08, 14, 10), glowT, 5.08, SY + 44.95, 0.6);
    k.point(5.08, SY + 45.1, 0.6, 0xffd070, 300 + 1400 * k.night, 70);
    /* the left arm across the body with the tablet */
    k.beam(v(-2.0, SY + 28.6, 0.4), v(-3.3, SY + 21.6, 1.9), 0.88, copper, 10);
    { const tab = k.box(3.5, 4.8, 0.9, -3.9, SY + 19.3, 2.5, copper); tab.rotation.z = 0.3; tab.rotation.y = -0.26;
      k.sign('JULY IV MDCCLXXVI', 2.5, 0.58, -3.42, SY + 19.7, 3.06, 'transparent', '#2c5f55', 74, -0.26);
      k.egg(v(-3.9, SY + 19.3, 2.5), { id: 'the-tablet', title: 'What the tablet says', year: '1776', text: 'The tabula ansata in her left hand is inscribed JULY IV MDCCLXXVI, the fourth of July 1776, the date on the Declaration of Independence.', clue: 'She is carrying a book you can read from the ground, if you know Roman numerals.', source: { name: 'Statue of Liberty, Wikipedia', url: 'https://en.wikipedia.org/wiki/Statue_of_Liberty' } }, { r: 4.5 });
    }
    /* the broken chains, half hidden by the robe */
    for (let i = 0; i < 6; i++) { const a = 0.35 + i * 0.42, r = 5.0 + i * 0.45; const link = k.torus(0.55, 0.16, Math.sin(a) * r, SY + 0.5, Math.cos(a) * r, copper, 12); link.rotation.x = PI / 2 + Math.sin(i) * 0.5; link.rotation.z = i * 0.4; }
    /* inside: the lobby, the shaft, the armature, the helix and the crown platform */
    const helixTop = SY + 31.9;
    const helixR = (y: number) => {
      if (y <= SY - 8) return 6.5;
      if (y < SY) return 6.5 - ((y - SY + 8) / 8) * 2.1;
      return Math.max(1.05, 4.4 - ((y - SY) / (helixTop - SY)) * 3.35);
    };
    const helix: T.Vector3[] = [];
    for (let i = 0; i <= 320; i++) { const u = i / 320, y = 4 + (helixTop - 4) * u, a = u * PI * 2 * 9, r = helixR(y); helix.push(v(Math.cos(a) * r, y, Math.sin(a) * r)); }
    const stair = k.spline(helix, false, 0.5);
    const sp = stair.getSpacedPoints(900);
    { const treadG = new T.BoxGeometry(1.5, 0.08, 0.36), tm: T.Matrix4[] = [];
      const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
      for (let i = 0; i < 900; i += 2) { const p = sp[i]; stair.getTangentAt(i / 900, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.9, 0)), q, ONE)); }
      k.instances(treadG, tread, tm);
    }
    k.curve(sp.filter((_, i) => i % 3 === 0).map((p) => p.clone().add(v(0, 0.1, 0))), 0.045, ironL, 300);
    k.cyl(0.7, helixTop, 0, helixTop / 2, 0, iron, 0.7, 12);
    /* Eiffel's armature: sixteen ribs following the inside of the robe, hooped */
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2, pts: T.Vector3[] = [];
      for (let h = 0; h <= 29; h += 2.5) { const rr = Math.max(1.2, robeR(h) - 0.45); pts.push(v(Math.cos(a) * rr, SY + h, Math.sin(a) * rr)); }
      k.curve(pts, 0.09, iron, 16);
    }
    for (let h = 2; h < 29; h += 3.5) { const rr = Math.max(1.2, robeR(h) - 0.45); k.torus(rr, 0.055, 0, SY + h, 0, iron, 26).rotation.x = PI / 2; }
    k.mesh(new T.CylinderGeometry(9.5, 9.5, SY - 4, 26, 1, true), k.pbr('lbInner', X.ashlar(0xb4ada0, 91, 3), 0.7, { side: T.BackSide }), 0, (SY + 4) / 2, 0);
    k.mesh(new T.CylinderGeometry(9.5, 9.5, 0.4, 26), k.pbr('lbFloor', X.terrazzo(0xb8b0a0, 48), 0.4), 0, 3.8, 0);
    k.arch(4, 6, 3, 0, 4, 11.5, granite, false, 0.7);
    k.block(-12, -2.2, 10, 12); k.block(2.2, 12, 10, 12);
    for (let i = 0; i < 12; i++) k.box(5, 0.34, 1.2, 0, 0.17 + i * 0.32, 22 - i * 1.0, granite);
    /* the shaft is lit like a stairwell: a lamp on the axis and a warm one at each work */
    for (let y = 7; y < helixTop; y += 6) k.point(0, y, 0, 0xffe8cc, 110, 26);
    for (let y = 11; y < SY; y += 6) { const a = (y / (helixTop - 4)) * PI * 2 * 9 + 0.55; k.point(Math.cos(a) * 8.2, y + 1.6, Math.sin(a) * 8.2, 0xffdcae, 34, 11); }
    k.point(0, 6.4, 0, 0xffeed2, 150, 22);
    /* the climbers on the stair ahead of you */
    if (!ctx.reduced) {
      const NC = 16;
      const climbers = k.instances(figureGeo(0.17, 0.5, 1.05), new T.MeshStandardMaterial({ roughness: 0.88 }), Array.from({ length: NC }, () => new T.Matrix4()));
      climbers.frustumCulled = false;
      const rnd = X.mulberry(33), c = new T.Color(), pal = [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8, 0xff8c3b, 0x2a8a4a];
      const off = Array.from({ length: NC }, () => rnd());
      for (let i = 0; i < NC; i++) climbers.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      if (climbers.instanceColor) climbers.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), tan = new T.Vector3(), up = new T.Vector3(0, 1, 0), sc = new T.Vector3();
      k.ticks.push((t) => {
        for (let i = 0; i < NC; i++) {
          const u = (off[i] + t * 0.006) % 1;
          stair.getPointAt(u, p); stair.getTangentAt(u, tan);
          q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z));
          sc.set(1, 0.9 + 0.08 * Math.sin(t * 6 + i), 1);
          m.compose(p, q, sc); climbers.setMatrixAt(i, m);
        }
        climbers.instanceMatrix.needsUpdate = true;
      });
    }
    /* the crown: the platform inside her head, twenty five windows at eye level */
    const CY = helixTop;
    k.mesh(new T.CylinderGeometry(1.55, 1.55, 0.3, 24), tread, 0, CY - 0.2, 0);
    k.torus(1.55, 0.05, 0, CY + 0.9, 0, iron, 26).rotation.x = PI / 2;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.beam(v(Math.cos(a) * 1.55, CY - 0.1, Math.sin(a) * 1.55), v(Math.cos(a) * 1.55, CY + 0.9, Math.sin(a) * 1.55), 0.035, iron, 5); }
    k.point(0, CY + 1.0, 0, 0xffe8cc, 7, 5);
    /* the works: the lobby wall, and the inner wall the whole climb passes.
       Every mount faces the axis, and its target is the radius the stair actually
       stands at that height, which is where the visitor is when they see it. */
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2 + PI / 8, r = 9.28;
      mounts.push({ position: v(Math.cos(a) * r, 7.0, Math.sin(a) * r), rotation: -a - PI / 2, target: v(Math.cos(a) * 4.6, 6.6, Math.sin(a) * 4.6), width: 3.4, height: 2.1, style: 'gilt', wash: true });
    }
    for (let i = 0; i < 14; i++) {
      const y = 10.5 + i * 1.6, a = (y / (helixTop - 4)) * PI * 2 * 9 + 0.55, r = 9.28;
      mounts.push({ position: v(Math.cos(a) * r, y, Math.sin(a) * r), rotation: -a - PI / 2, target: v(Math.cos(a) * 6.5, y, Math.sin(a) * 6.5), width: 2.2, height: 1.45, style: 'steel', wash: true });
    }
    for (const a of [PI * 0.72, PI * 1.28]) mounts.push({ position: v(Math.cos(a) * 1.9, CY + 0.9, Math.sin(a) * 1.9), rotation: -a - PI / 2, target: v(Math.cos(a) * 0.5, CY + 0.9, Math.sin(a) * 0.5), width: 0.9, height: 0.62, style: 'steel', wash: false });
    k.censusWall({ x: 0, y: 7.4, z: -9.24, rotY: 0, cols: 12, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(300, 48), pieces: ctx.all, backing: iron });
    /* what the statue knows */
    const src = { name: 'Statue of Liberty, Wikipedia', url: 'https://en.wikipedia.org/wiki/Statue_of_Liberty' };
    k.egg(v(0, 3, 30), { id: 'dedicated-1886', title: 'The twenty eighth of October', year: '1886', text: 'The statue was dedicated on October 28, 1886. Frederic Auguste Bartholdi designed her; Gustave Eiffel built the iron framework that holds her up.', clue: 'Stand on the path and look up before you go inside.', source: src }, { r: 4.5 });
    k.egg(v(Math.cos(0.9) * 9.0, 6.6, Math.sin(0.9) * 9.0), { id: 'the-copper-skin', title: 'Thinner than two pennies', text: 'The copper skin is 0.094 inches thick, about 2.4 millimetres. She was reddish brown and shiny when she arrived; within twenty years the copper had oxidised to the green she is now.', clue: 'The whole figure is a sheet of metal you could bend in your hands, hung on iron.', source: src }, { r: 2.6 });
    k.egg(v(0, 24, 0), { id: 'the-armature', title: 'What Eiffel built', text: 'Inside the copper there is no stone at all: a central iron pylon with a lattice of bars springing off it, so the skin can move in the wind and in the heat without tearing. Eiffel drew it three years before he started his tower.', clue: 'Look up the middle of the shaft on the way past.', source: src }, { r: 5 });
    k.egg(v(0, CY + 1.6, 0), { id: 'twenty-five-windows', title: 'Twenty five windows, seven rays', text: 'The crown has twenty five windows and seven rays. The rays have been read as the seven seas and the seven continents, though the research has never confirmed it.', clue: 'Count the openings around you, then count the spikes outside.', source: src }, { r: 3 });
    k.egg(v(0, 1.5, 44), { id: 'fort-wood', title: 'She stands in a fort', text: 'The eleven pointed star under the pedestal is Fort Wood, a working harbour battery. Richard Morris Hunt designed the pedestal to sit inside its walls.', clue: 'Walk up and look at the shape of the ground you are standing on.', source: src }, { r: 5 });
    k.egg(v(Math.sin(1.2) * 5.5, SY + 0.55, Math.cos(1.2) * 5.5), { id: 'broken-chains', title: 'The chains nobody sees', text: 'A broken chain and shackle lie at her feet, marking the end of slavery after the Civil War. They are half hidden by the robe and almost impossible to see from the ground.', clue: 'Hardest egg on the island: look at her feet, not her face.', source: src }, { r: 3.6 });
    /* the route: up from the dock, into the lobby, then the whole helix to the crown */
    const route = [v(0, 3, 58), v(0, 3, 44), v(0, 3, 30), v(0, 5.5, 18), v(0, 6.8, 12), v(0, 6.8, 4), v(3, 6.8, 0)];
    for (let i = 0; i <= 900; i += 3) route.push(sp[i].clone().add(v(0, 1.6, 0)));
    route.push(v(0, CY + 1.6, 0));
    return { mounts, spawn: route[0].clone(), look: v(0, SY + 13, 0), eye: 3, bounds: [-64, 64, -64, 64], path: route, style: 'steel' };
  },
};
