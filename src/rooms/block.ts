import * as T from 'three';
import { pbr, prop, tex } from '../core/assets';
import { box, floorPlane, sign, v3, seeded, type Rect } from '../core/kit';
import { contour, drips, eyeFlower, addThreshold, INK } from '../core/mlow';
import { windows, type Win } from '../core/interior';
import { hang, poster, sticker } from '../core/hang';
import { wetStreet } from '../core/wet';
import { skyDome } from '../core/sky';
import { ORIGINS, type Ctx, type Room } from '../core/room';
import { mlowCab } from '../core/cab';

// THE BLOCK. One Lower East Side block at night, 56 metres of street between two corners that are the same corner:
// walk off either end and you come back in at the other (two live portals, recursive). Every door on it is a live
// portal into a room far too big for the building, and every lit window is an interior mapped room from ImageGen.
// The street: x across (-8 .. 8 between facades), z along (+10 near corner .. -46 far corner).

export const BLOCK_DOORS = {
  bodega: { pos: v3(-7.95, 0, -4), rotY: Math.PI / 2 },
  walkup: { pos: v3(-7.95, 0, -14), rotY: Math.PI / 2 },
  laundromat: { pos: v3(7.95, 0, -6), rotY: -Math.PI / 2 },
  subway: { pos: v3(7.95, 0, -17), rotY: -Math.PI / 2 },
  far: { pos: v3(0, 0, -46), rotY: 0 },
  near: { pos: v3(0, 0, 10), rotY: Math.PI },
  cam: { pos: v3(1.2, 1.7, 8), rotY: Math.PI },
};

export function buildBlock(ctx: Ctx): Room {
  const O = ORIGINS.block, g = new T.Group(); g.position.copy(O); ctx.scene.add(g);
  const rnd = seeded(5), art = ctx.m.art.block, posters = ctx.m.posters, stickers = ctx.m.stickers;
  const wall = (x: number, z: number) => O.clone().add(v3(x, 0, z));

  // ---------- ground ----------
  const asphalt = pbr('asphalt', 3, { roughness: 0.75, color: 0x6a6e78 });
  const walkMat = pbr('pavers', 1.5, { color: 0x8a8f99 });
  const curb = pbr('concrete', 1, { color: 0x9aa0a8 });
  floorPlane(g, 10, 64, asphalt, 0, 0, -18);
  for (const s of [-1, 1]) {
    floorPlane(g, 3, 64, walkMat, s * 6.5, 0.15, -18);
    box(g, 0.25, 0.16, 64, s * 5.05, 0.08, -18, curb, false);
  }
  // the double yellow line, painted, and manholes
  const yel = new T.MeshStandardMaterial({ color: 0xd8a51c, roughness: 0.6 });
  for (const s of [-0.09, 0.09]) box(g, 0.1, 0.004, 64, s, 0.002, -18, yel, false);
  const hole = new T.MeshStandardMaterial({ color: 0x1a1b1f, metalness: 0.7, roughness: 0.45 });
  const steamAt: T.Vector3[] = [];
  for (const z of [-2, -24, -38]) { const m = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.02, 28), hole); m.position.set(rnd() * 4 - 2, 0.01, z); m.receiveShadow = true; g.add(m); steamAt.push(m.position.clone()); }
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sx = sc.getContext('2d')!;
  const sg = sx.createRadialGradient(64, 64, 4, 64, 64, 62); sg.addColorStop(0, 'rgba(220,226,240,0.55)'); sg.addColorStop(1, 'rgba(220,226,240,0)'); sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
  const steamMat = new T.SpriteMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false, opacity: 0.5 });
  const steam: { s: T.Sprite; base: T.Vector3; ph: number }[] = [];
  steamAt.forEach((p, k) => { for (let i = 0; i < 9; i++) { const s = new T.Sprite(steamMat.clone()); g.add(s); steam.push({ s, base: p, ph: i / 9 + k * 0.31 }); } });
  if (!ctx.mobile) wetStreet(g, 10, 64, v3(0, 0.006, -18));

  // ---------- the tenements ----------
  const brickA = contour(pbr('brick', 2.2, { color: 0x9a7466 }), { coverage: 0, density: 8, glow: 2.2 });
  const brickB = contour(pbr('brick', 2.2, { color: 0x7d5c55 }), { coverage: 0, density: 8, glow: 2.2 });
  const stone = pbr('concrete', 1.5, { color: 0xb4ad9e });
  const iron = new T.MeshStandardMaterial({ color: 0x15171c, metalness: 0.75, roughness: 0.5 });
  const wins: Win[] = [];
  type B = { side: -1 | 1; z0: number; z1: number; floors: number; mat: T.Material; shop?: (x: number, zc: number, w: number) => void };
  function building(b: B) {
    const w = b.z0 - b.z1, zc = (b.z0 + b.z1) / 2, H = b.floors * 3.2 + 1.2, xf = b.side * 8, rot = b.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    box(g, 12, H, w - 0.04, xf + b.side * 6, H / 2, zc, b.mat);
    // cornice and brackets
    box(g, 0.7, 0.55, w, xf - b.side * 0.25, H - 0.3, zc, stone);
    for (let z = b.z1 + 0.6; z < b.z0 - 0.3; z += 1.1) box(g, 0.45, 0.4, 0.18, xf - b.side * 0.2, H - 0.75, z, stone, false);
    // a band course over the shopfront
    box(g, 0.3, 0.35, w, xf - b.side * 0.12, 4.05, zc, stone);
    // upper windows: interior mapped, lintel and sill in stone, three or four a floor
    const n = Math.max(2, Math.round(w / 2.6));
    for (let f = 1; f < b.floors; f++) for (let i = 0; i < n; i++) {
      const z = b.z1 + (w * (i + 0.5)) / n, y = f * 3.2 + 1.9;
      wins.push({ pos: v3(xf - b.side * 0.02, y, z), rotY: rot, w: 1.05, h: 1.6, room: Math.floor(rnd() * 9), lit: rnd() < 0.62 ? 0.75 + rnd() * 0.5 : 0 });
      box(g, 0.22, 0.14, 1.3, xf - b.side * 0.1, y + 0.9, z, stone, false);
      box(g, 0.26, 0.08, 1.25, xf - b.side * 0.12, y - 0.84, z, stone, false);
    }
    // fire escape: a platform per floor, railings, a drop ladder, the diagonal stair between
    if (w > 7) {
      const fz = zc, fw = Math.min(5.2, w - 1.5);
      for (let f = 1; f < b.floors; f++) {
        const y = f * 3.2 + 1.05, x = xf - b.side * 0.75;
        box(g, 1.3, 0.05, fw, x, y, fz, iron);
        box(g, 0.04, 0.04, fw, x - b.side * 0.63, y + 0.95, fz, iron, false);
        box(g, 0.04, 0.04, fw, x - b.side * 0.63, y + 0.45, fz, iron, false);
        for (let k = 0; k <= 10; k++) box(g, 0.025, 0.95, 0.025, x - b.side * 0.63, y + 0.48, fz - fw / 2 + (fw * k) / 10, iron, false);
        if (f < b.floors - 1) {
          const dir = f % 2 ? 1 : -1, ang = Math.atan2(3.2, 3.0), len = Math.hypot(3.2, 3.0);
          const stair = new T.Group(); stair.position.set(x, y + 1.6, fz); stair.rotation.x = dir * ang; g.add(stair);
          for (const sx of [-0.3, 0.3]) box(stair, 0.04, 0.12, len, sx, 0, 0, iron, false);
          for (let k = 0; k < 13; k++) { const tr = box(stair, 0.6, 0.02, 0.16, 0, 0.02, -len / 2 + 0.15 + k * (len - 0.3) / 12, iron, false); tr.rotation.x = -dir * ang; }
        }
      }
    }
    b.shop?.(xf, zc, w);
  }
  const shopGlass = (x: number, z: number, w: number, side: number, room: number) =>
    wins.push({ pos: v3(x - side * 0.03, 1.95, z), rotY: side < 0 ? Math.PI / 2 : -Math.PI / 2, w, h: 2.2, room, lit: 0.8 });
  const awning = (x: number, z: number, w: number, side: number, cols: [string, string]) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const q = c.getContext('2d')!;
    for (let i = 0; i < 16; i++) { q.fillStyle = cols[i % 2]; q.fillRect(i * 16, 0, 16, 64); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const a = new T.Mesh(new T.PlaneGeometry(w, 1.6), new T.MeshStandardMaterial({ map: t, side: T.DoubleSide, roughness: 0.8 }));
    a.position.set(x - side * 0.75, 3.35, z); a.rotation.set(0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0); a.rotateX(-0.95); a.castShadow = true; g.add(a);
  };
  const doorFrame = (d: { pos: T.Vector3; rotY: number }, side: number, name: string, seed: number) => {
    const x = d.pos.x, z = d.pos.z;
    box(g, 0.18, 2.55, 0.16, x - side * 0.06, 1.28, z + 0.64, stone); box(g, 0.18, 2.55, 0.16, x - side * 0.06, 1.28, z - 0.64, stone);
    box(g, 0.2, 0.22, 1.45, x - side * 0.07, 2.43, z, stone);
    // drips run down the door casing and the wall beside it, never across the doorway
    drips(g, v3(x - side * 0.17, 2.5, z - 0.75), v3(x - side * 0.17, 2.5, z - 0.62), 8, seed, 2.2);
    drips(g, v3(x - side * 0.17, 2.5, z + 0.62), v3(x - side * 0.17, 2.5, z + 0.75), 8, seed + 50, 2.2);
    drips(g, v3(x - side * 0.2, 2.56, z - 0.6), v3(x - side * 0.2, 2.56, z + 0.6), 14, seed + 90, 0.18);
    addThreshold(wall(x, z).setY(1.2), 2.6);
    void name;
  };

  // left side, near to far
  building({ side: -1, z0: 10, z1: 0.5, floors: 5, mat: brickA, shop: (x, _zc, _w) => {
    shopGlass(x, 5.2, 3.6, -1, 4);
    sign(g, ['THE BROKER IS IN'], 3.6, 0.5, v3(x + 0.05, 3.6, 5.2), Math.PI / 2, { bg: '#06163a', ink: '#f0f4f8', glow: 1.6 });
  } });
  building({ side: -1, z0: 0.5, z1: -9, floors: 5, mat: brickB, shop: (x, zc) => {
    shopGlass(x, zc - 2.6, 2.6, -1, 2); shopGlass(x, zc + 2.4, 2.4, -1, 2);
    awning(x, zc, 9, -1, ['#c8102e', '#f2efe6']);
    sign(g, ['INFINITY DELI & GROCERY', 'OPEN 24 HRS . WE HAVE IT . WE ALWAYS HAVE IT'], 8.4, 1.0, v3(x + 0.08, 4.65, zc), Math.PI / 2, { bg: '#0a0f1e', ink: '#ffd84a', glow: 2.2 });
    doorFrame(BLOCK_DOORS.bodega, -1, 'bodega', 11);
  } });
  building({ side: -1, z0: -9, z1: -18.5, floors: 6, mat: brickA, shop: (x) => {
    doorFrame(BLOCK_DOORS.walkup, -1, 'walkup', 12);
    sign(g, ['5'], 0.55, 0.55, v3(x + 0.12, 2.9, -14), Math.PI / 2, { bg: '#b48a4a', ink: '#06163a' });
    sign(g, ['5 ELDRIDGE . WALK-UP', 'EVERY FLOOR IS THE FIFTH FLOOR'], 3.4, 0.62, v3(x + 0.1, 3.55, -16.6), Math.PI / 2, { bg: '#f0f4f8', ink: '#06163a' });
    shopGlass(x, -11, 1.4, -1, 8); shopGlass(x, -17.2, 1.4, -1, 8);
    const st = prop('stoop', 2.0); st.position.set(x + 1.2, 0.15, -11); st.rotation.y = Math.PI / 2; g.add(st);
  } });
  // the plywood construction wall: POST NO BILLS, so everybody did
  const ply = pbr('planks', 1.2, { color: 0x6b5a46 });
  box(g, 0.12, 3.0, 12, -7.9, 1.5, -24.5, ply);
  box(g, 6, 18, 12, -11, 9, -24.5, brickB);
  sign(g, ['POST NO BILLS'], 3, 0.42, v3(-7.83, 2.75, -20.4), Math.PI / 2, { ink: '#f0f4f8', font: 'Plex, monospace' });
  building({ side: -1, z0: -30.5, z1: -46, floors: 5, mat: brickB, shop: (x, zc) => {
    shopGlass(x, zc, 6, -1, 1);
    sign(g, ['CHROMA NAILS'], 4, 0.6, v3(x + 0.08, 3.6, zc), Math.PI / 2, { bg: '#ff2e63', ink: '#fff', glow: 1.8 });
  } });
  // right side
  building({ side: 1, z0: 10, z1: -1, floors: 5, mat: brickB, shop: (x, zc) => {
    shopGlass(x, zc + 2.5, 3.4, 1, 6);
    sign(g, ['BIGGER ST'], 1.6, 0.36, v3(5.6, 4.8, 9.1), -Math.PI / 2, { bg: '#0b6e3f', ink: '#fff' });
  } });
  building({ side: 1, z0: -1, z1: -11, floors: 5, mat: brickA, shop: (x, zc) => {
    shopGlass(x, zc - 2.7, 2.4, 1, 3); shopGlass(x, zc + 3.0, 2.4, 1, 3);
    awning(x, zc, 10, 1, ['#2962ff', '#f0f4f8']);
    sign(g, ['SUDS & SPACE . LAUNDROMAT', 'WASH . DRY . FOLD . THE DRYERS GO ANYWHERE'], 9, 1.0, v3(x - 0.08, 4.65, zc), -Math.PI / 2, { bg: '#06163a', ink: '#00e5ff', glow: 2.2 });
    doorFrame(BLOCK_DOORS.laundromat, 1, 'laundromat', 13);
  } });
  building({ side: 1, z0: -11, z1: -23, floors: 6, mat: brickB, shop: (x) => {
    doorFrame(BLOCK_DOORS.subway, 1, 'subway', 14);
    sign(g, ['SUBWAY', 'ALL TRAINS . ALL DIRECTIONS . AT ONCE'], 3.2, 0.7, v3(x - 0.1, 3.3, -17), -Math.PI / 2, { bg: '#0a0a0a', ink: '#ffffff', glow: 1.5 });
    const glob = new T.MeshStandardMaterial({ color: 0x1f8f3c, emissive: 0x2bd36a, emissiveIntensity: 2.5 });
    for (const z of [-16.1, -17.9]) {
      box(g, 0.06, 2.6, 0.06, x - 0.45, 1.3, z, iron);
      const s = new T.Mesh(new T.SphereGeometry(0.17, 20, 14), glob); s.position.set(x - 0.45, 2.75, z); g.add(s);
    }
    shopGlass(x, -13.4, 2.2, 1, 7); shopGlass(x, -21, 2.6, 1, 5);
  } });
  building({ side: 1, z0: -23, z1: -34, floors: 5, mat: brickA, shop: (x, zc) => {
    shopGlass(x, zc, 7, 1, 0);
    sign(g, ['FOR RENT . 900 SQ FT STUDIO', 'SPACIOUS FROM ONE ANGLE . ASK FOR 5A'], 5.4, 1.1, v3(x - 0.1, 7.6, zc), -Math.PI / 2, { bg: '#ff2e63', ink: '#ffffff' });
  } });
  building({ side: 1, z0: -34, z1: -46, floors: 6, mat: brickB, shop: (x, zc) => {
    shopGlass(x, zc, 8, 1, 5);
    sign(g, ['INSIDE AVE'], 1.6, 0.36, v3(5.6, 4.8, -45.2), -Math.PI / 2, { bg: '#0b6e3f', ink: '#fff' });
  } });
  windows(g, wins);

  // water towers on the roofs, cut against the sky
  for (const [x, z, y] of [[-12, -4, 17.2], [-13, -26, 19], [12, -16, 20.4], [12, -40, 20.4]] as const) {
    const t = prop('water_tower', 7); t.position.set(x, y, z); g.add(t);
  }

  // ---------- street furniture from the museum pack ----------
  const put = (name: string, h: number, x: number, z: number, ry = 0, y = 0.15) => { const p = prop(name, h); p.position.set(x, y, z); p.rotation.y = ry; g.add(p); return p; };
  const lamps: T.Vector3[] = [];
  for (const [x, z] of [[-5.5, 4], [5.5, -9], [-5.5, -20], [5.5, -30], [-5.5, -40]] as const) { put('lamppost', 5.6, x, z, x < 0 ? 0 : Math.PI); lamps.push(v3(x * 0.82, 5.3, z)); }
  for (const [x, z] of [[-5.6, -11.5], [5.6, -26], [-5.6, -36]] as const) put('utility_pole', 9, x, z);
  put('hydrant', 0.8, -5.6, -7.5); put('hydrant', 0.8, 5.6, -36);
  put('mailbox', 1.25, 5.7, 3, -Math.PI / 2);
  put('storm_drain', 0.25, -4.7, -27, Math.PI / 2, 0);
  put('penn_newsstand', 2.6, 6.4, -27.5, -Math.PI / 2);
  const bark = new T.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.9 });
  const leaf = new T.MeshStandardMaterial({ color: 0x24402a, roughness: 0.85, emissive: 0x05140a, flatShading: true });
  for (const [x, z] of [[-6.4, 0], [6.4, -21], [-6.4, -33]] as const) {
    const tr = new T.Mesh(new T.CylinderGeometry(0.11, 0.17, 4.2, 9), bark); tr.position.set(x, 2.25, z); tr.castShadow = true; g.add(tr);
    for (let k = 0; k < 4; k++) box(g, k % 2 ? 0.04 : 1.0, 0.45, k % 2 ? 1.0 : 0.04, x + (k === 1 ? 0.5 : k === 3 ? -0.5 : 0), 0.38, z + (k === 0 ? 0.5 : k === 2 ? -0.5 : 0), iron, false);
    for (let k = 0; k < 9; k++) {
      const geo = new T.IcosahedronGeometry(0.9 + rnd() * 0.7, 1), p2 = geo.attributes.position;
      for (let i = 0; i < p2.count; i++) p2.setXYZ(i, p2.getX(i) * (0.8 + rnd() * 0.4), p2.getY(i) * (0.7 + rnd() * 0.3), p2.getZ(i) * (0.8 + rnd() * 0.4));
      geo.computeVertexNormals();
      const c = new T.Mesh(geo, leaf); c.position.set(x + (rnd() - 0.5) * 2.4, 4.6 + rnd() * 2.2, z + (rnd() - 0.5) * 2.4); c.castShadow = true; g.add(c);
    }
  }
  // MLow's cabs with the MLOW topper (cab.ts): three parked at the curbs, two working the street
  for (const [kind, slot, x, z, ry] of [[0, 0, -3.4, -31, 0], [4, 3, 3.4, -11.5, Math.PI], [3, 1, -3.5, -42.5, 0]] as const) {
    const c = mlowCab(kind, slot); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
  }
  // the street is one way, toward the far corner; the far corner is the near corner, so they go round forever
  const driving = [{ c: mlowCab(1, 0), z: -6, v: 7.5 }, { c: mlowCab(2, 5), z: -30, v: 6.5 }];
  for (const d of driving) { d.c.position.set(1.5, 0, d.z); d.c.rotation.y = Math.PI; g.add(d.c); }
  let honked = -10;
  for (const [x, z] of [[-6.6, -16], [6.8, -9.8], [-1.5, -12], [2.2, -20]] as const) put('pigeon', 0.28, x, z, rnd() * 6, x > -5 && x < 5 ? 0 : 0.15);
  put('dog', 0.55, 6.2, -2.4, -2.2);
  // the broker, at a folding table on the sidewalk by the near corner, listings in hand
  box(g, 1.4, 0.05, 0.7, -6.3, 0.9, 6.5, new T.MeshStandardMaterial({ color: 0xe9e5da, roughness: 0.7 }));
  for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) box(g, 0.03, 0.75, 0.03, -6.3 + dx, 0.52, 6.5 + dz, iron, false);
  put('npc_broker', 1.78, -7.0, 6.5, Math.PI / 2);
  sign(g, ['BROKER FEE', '15% OF YOUR SENSE OF SCALE'], 1.3, 0.55, v3(-5.62, 1.25, 6.5), Math.PI / 2, { bg: '#f0f4f8', ink: '#06163a' });

  // ---------- the hang: wheatpaste on the plywood, New Yorkers framed on the hoarding ----------
  const pz = (i: number) => -19.3 - i * 1.05;
  for (let i = 0; i < 10; i++) {
    const p = posters[(i * 5) % posters.length];
    poster(g, p.f, p.ar, v3(-7.82, 1.55 + (i % 2) * 0.15, pz(i)), Math.PI / 2, 1.25 + rnd() * 0.2, i + 3);
  }
  art.slice(0, 6).forEach((a, i) => hang(g, a, v3(-7.83, 2.2, -19.8 - i * 1.85).setY(i % 2 ? 2.35 : 1.25), Math.PI / 2, 1.5, { frame: 'none', label: false, pool: false }));
  // framed New Yorkers along the hoarding on the far right building and the broker's window
  art.slice(6, 12).forEach((a, i) => hang(g, a, v3(7.88, 1.7, -35.5 - i * 1.7), -Math.PI / 2, 1.35, { frame: 'black' }));
  art.slice(12, 18).forEach((a, i) => hang(g, a, v3(-7.88, 1.7, -32 - i * 2.2), Math.PI / 2, 1.5, { frame: 'brass' }));
  // stickers on every pole and box
  const marks = stickers.filter((s) => s.kind === 'mark'), labels = stickers.filter((s) => s.kind === 'label');
  let si = 0;
  for (const [x, z] of [[-5.6, -11.5], [5.6, -26], [-5.6, -36], [-5.5, 4], [5.5, -9], [-5.5, -20], [5.5, -30], [-5.5, -40]] as const) {
    for (let k = 0; k < 7; k++) {
      const s = (k % 3 ? marks : labels)[si++ % (k % 3 ? marks.length : labels.length)];
      const ang = rnd() * Math.PI * 2, r = 0.16;
      sticker(g, s.f, s.ar, v3(x + Math.sin(ang) * r, 1.0 + k * 0.32 + rnd() * 0.1, z + Math.cos(ang) * r), ang, 0.16 + rnd() * 0.08, (rnd() - 0.5) * 0.6);
    }
  }
  for (let k = 0; k < 18; k++) {
    const s = marks[(k * 7) % marks.length];
    sticker(g, s.f, s.ar, v3(-7.8, 0.7 + rnd() * 2.2, -19 - rnd() * 11), Math.PI / 2, 0.22 + rnd() * 0.14, (rnd() - 0.5) * 0.8);
  }

  // ---------- light ----------
  const hemi = new T.HemisphereLight(0x3a5aa8, 0x2a1a10, 0.55); g.add(hemi);
  const moon = new T.DirectionalLight(0xa8c4ff, 1.1);
  moon.position.set(-14, 34, -54); moon.target.position.set(0, 0, -18); g.add(moon, moon.target);
  moon.castShadow = true; moon.shadow.mapSize.set(ctx.mobile ? 1024 : 2048, ctx.mobile ? 1024 : 2048);
  Object.assign(moon.shadow.camera, { left: -22, right: 22, top: 34, bottom: -34, near: 1, far: 110 }); moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.03;
  lamps.slice(0, ctx.mobile ? 2 : 5).forEach((p, i) => {
    const l = new T.PointLight(0xffb36b, 22, 16, 1.6); l.position.copy(p); g.add(l); void i;
  });
  for (const [x, z, c] of [[-6.4, -4, 0xffd27a], [6.4, -6, 0x7ad4ff], [6.4, -17, 0xb8ffd0]] as const) {
    const l = new T.PointLight(c, 14, 9, 1.8); l.position.set(x, 2.4, z); g.add(l);
  }

  // ---------- the sky, and the Eye Flower over the far corner ----------
  skyDome(g, 380, 0.7);
  const flower = eyeFlower(7.5);
  flower.object.position.set(0, 24, -40); flower.object.userData.dynamic = true; g.add(flower.object);
  addThreshold(wall(0, -40).setY(24), 12);

  const walk: Rect[] = [[-7.75, -47, 7.75, 11]];
  // each doorway is floor too, a little past the door plane, so you can step through it
  for (const d of [BLOCK_DOORS.bodega, BLOCK_DOORS.walkup]) walk.push([-8.6, d.pos.z - 0.62, -6.6, d.pos.z + 0.62]);
  for (const d of [BLOCK_DOORS.laundromat, BLOCK_DOORS.subway]) walk.push([6.6, d.pos.z - 0.62, 8.6, d.pos.z + 0.62]);
  const block: Rect[] = [[-7.2, 5.9, -5.5, 7.1], [6.0, -28.6, 7.9, -26.4]];
  for (const [x, z] of [[-5.5, 4], [5.5, -9], [-5.5, -20], [5.5, -30], [-5.5, -40], [-5.6, -11.5], [5.6, -26], [-5.6, -36], [-6.4, 0], [6.4, -21], [-6.4, -33]] as const)
    block.push([x - 0.25, z - 0.25, x + 0.25, z + 0.25]);
  block.push([-4.4, -33.3, -2.4, -28.7], [2.4, -13.8, 4.4, -9.2], [-4.5, -45, -2.5, -40]); // the parked cabs

  return {
    id: 'block', name: 'The block', line: 'Every door on this block is lying to you. Walk off either end and see.',
    origin: O, group: g,
    spawn: { at: wall(1.6, 7.5).setY(1.65), look: wall(0, -30).setY(5) },
    views: [
      { name: 'The block', note: 'Two corners, one corner. The far end is the near end.', at: wall(0.8, 6).setY(1.65), look: wall(0, -40).setY(5) },
      { name: 'The Eye Flower', note: 'It watches the whole block. Click it.', at: wall(0, -14).setY(1.65), look: wall(0, -40).setY(24) },
      { name: 'The windows', note: 'Every lit window is a room bigger than the building.', at: wall(4.2, -8).setY(1.65), look: wall(-8, -12).setY(8) },
      { name: "MLow's cabs", note: 'Every cab on the block runs the MLOW topper. Stand in the lane and one will honk.', at: wall(6.4, -9.2).setY(1.8), look: wall(3.4, -11.8).setY(1.75) },
      { name: 'Post no bills', note: 'The hoarding: posters, stickers and six New Yorkers pasted up.', at: wall(-3.6, -24).setY(1.65), look: wall(-8, -24).setY(2) },
    ],
    doors: Object.fromEntries(Object.entries(BLOCK_DOORS).map(([k, d]) => [k, { pos: wall(d.pos.x, d.pos.z), rotY: d.rotY }])),
    walk, block,
    bg: new T.Color(INK.void), fog: new T.FogExp2(0x040817, 0.014), exposure: 0.82, env: 0.35,
    floorY: (x, z) => (Math.abs(x - O.x) > 5.1 && z - O.z < 10.5 && z - O.z > -46.5 ? O.y + 0.15 : O.y),
    tick(t, dt, cam, active) {
      flower.tick(cam.position, t, dt, ctx.still);
      if (!ctx.still) for (const d of driving) {
        // stop for anyone in the lane ahead (and lean on the horn once in a while)
        const lx = cam.position.x - O.x, lz = cam.position.z - O.z;
        const ahead = d.z - lz, blocked = active && Math.abs(lx - 1.5) < 1.6 && ahead > 3.2 && ahead < 9; // nose 2.4 m ahead of centre, stop a metre short
        if (blocked && t - honked > 8) { honked = t; dispatchEvent(new CustomEvent('inside-note', { detail: 'HONK. The cab with the MLOW topper would like its lane back.' })); }
        if (!blocked) d.z -= d.v * dt;
        if (d.z < -50) d.z += 62;
        d.c.position.z = d.z;
      }
      for (const st of steam) {
        const a = ctx.still ? st.ph : (t * 0.12 + st.ph) % 1;
        st.s.position.set(st.base.x + Math.sin(a * 6 + st.ph * 9) * 0.4 * a, 0.2 + a * 4.5, st.base.z + Math.cos(a * 5) * 0.3 * a);
        const k = 0.8 + a * 3.2; st.s.scale.set(k, k, 1);
        (st.s.material as T.SpriteMaterial).opacity = 0.42 * Math.sin(a * Math.PI);
      }
    },
    interact(o) {
      let p: T.Object3D | null = o;
      while (p) { if (p === flower.object) { flower.blink(); return 'It blinked. It has been watching the whole time.'; } p = p.parent; }
    },
  };
}
