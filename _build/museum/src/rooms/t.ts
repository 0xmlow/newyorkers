/* Rooms 92 to 96: the Jewish Museum, the Rubin, the Shed, the Park Avenue Armory, the Custom House rotunda. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';

const PI = Math.PI;

/* ---------------- 92 THE JEWISH MUSEUM ---------------- */
export const jewishmuseum: RoomDef = {
  id: 'jewishmuseum',
  name: 'The Warburg mansion',
  area: 'THE JEWISH MUSEUM',
  mood: 'Sunday on Museum Mile',
  color: '#b8a8c8',
  description: 'The French Gothic mansion at 92nd and Fifth, the carved limestone and the copper roofs, the panelled rooms inside stacked with galleries, the works among the silver and the paintings.',
  signatures: 'The Gothic Revival chateau in grey limestone with pointed dormers and a slate roof, the arched entrance with tracery, the oak panelled rooms of the old house, the white modern galleries above, the Fifth Avenue trees.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.5, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.6);
    k.sun(0xfff0d8, 1.6, 30, 60, 40, true, 60);
    const lime = k.pbr('jmLime', X.ashlar(0xb8b0a0, 277, 3), 0.22), slate = k.pbr('jmSlate', X.steel(0x3a3a44, false, 278), 0.4, { metalness: 0.2, roughness: 0.8 }),
      copper = k.pbr('jmCopper', X.patina(0x5f9a8c), 0.6, { roughness: 0.6, metalness: 0.3 }), oak = k.pbr('jmOak', X.planks(0x5a3a26, 4, 279, 0.15), 1.4, { roughness: 0.45 }),
      floorW = k.pbr('jmParquet', X.planks(0x9a7a56, 10, 280, 0.1), 0.7), white = k.pbr('jmWhite', X.plaster(0xf4f4f2, 143), 0.4, { roughness: 0.9 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6), silver = k.flat(0xd8dce0, 0.9, 0.2), velvet = k.pbr('jmVelvet', X.velvet(0x2a2a5a), 0.4);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('jmLawn', X.grass(0x3a5a2a, 144), 0.06)); k.rail(18, 0, 160, k.flat(0x1a1c20, 0.7, 0.45), 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(92); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'round', h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i });
    const MX = -26, MZ = 0, MW = 28, MD = 34;
    k.box(MW, 20, MD, MX, 10, MZ, lime);
    k.mesh(new T.ConeGeometry(18, 8, 4), slate, MX, 24, MZ).rotation.y = PI / 4;
    for (let i = 0; i < 4; i++) { const z = MZ - 12 + i * 8; k.box(3, 4, 3, MX + MW / 2 - 1.5, 21.5, z, lime); k.mesh(new T.ConeGeometry(2.2, 3.4, 4), slate, MX + MW / 2 - 1.5, 25.2, z).rotation.y = PI / 4; k.cyl(0.9, 6, MX + MW / 2 + 1.2, 23, z + 4, lime, 0.9, 12); k.mesh(new T.ConeGeometry(1.1, 2.4, 12), copper, MX + MW / 2 + 1.2, 27.2, z + 4); }
    for (let f = 0; f < 3; f++) for (let i = 0; i < 6; i++) { const y = 4 + f * 5, z = MZ - 12.5 + i * 5; k.arch(1.6, 3.6, 0.5, MX + MW / 2 + 0.05, y - 1.6, z, lime, true, 0.7).rotation.y = PI / 2; k.box(0.06, 3, 1.2, MX + MW / 2 + 0.1, y, z, glass); }
    k.arch(3.2, 5.6, 3, MX + MW / 2 + 1, 0, MZ, lime, true, 0.8).rotation.y = PI / 2;
    k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 2.6, MZ - MD / 2, MZ - 1.8); k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 2.6, MZ + 1.8, MZ + MD / 2);
    k.sign('THE JEWISH MUSEUM', 6, 0.6, MX + MW / 2 + 2.56, 6.6, MZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, MX + MW / 2 + 0.5, 12, MZ - 10, PI / 2, 3.0, true); blossomFlag(k, MX + MW / 2 + 0.5, 12, MZ + 10, PI / 2, 2.6, 1, 'cloud');
    // the panelled rooms of the old house on the ground floor, the white galleries above reached by the oak stair
    const IW = MW - 1.2, ID = MD - 1.2;
    k.box(IW, 0.3, ID, MX, 0.15, MZ, floorW);
    k.block(MX - IW / 2 - 0.6, MX - IW / 2 + 0.2, MZ - ID / 2, MZ + ID / 2); k.block(MX - IW / 2, MX + IW / 2, MZ - ID / 2 - 0.6, MZ - ID / 2 + 0.2); k.block(MX - IW / 2, MX + IW / 2, MZ + ID / 2 - 0.2, MZ + ID / 2 + 0.6);
    for (const s of [-1, 1]) k.box(0.3, 5, ID, MX + s * (IW / 2 - 0.2), 2.5, MZ, oak);
    k.box(IW, 5, 0.3, MX, 2.5, MZ - ID / 2 + 0.2, oak); k.box(IW, 5, 0.3, MX, 2.5, MZ + ID / 2 - 0.2, oak);
    k.box(IW, 0.4, ID, MX, 5.4, MZ, k.pbr('jmCeiling', X.plaster(0xe0d8c8, 145), 0.4));
    k.box(0.3, 5, ID - 8, MX - 2, 2.5, MZ + 4, oak); k.block(MX - 2.4, MX - 1.6, MZ - 8.6, MZ + ID / 2);
    for (let i = 0; i < 14; i++) k.box(2.4, 0.4, 0.9, MX + IW / 2 - 1.5, 0.2 + i * 0.4, MZ - ID / 2 + 1.5 + i * 0.9, oak);
    k.block(MX + IW / 2 - 2.8, MX + IW / 2 - 0.3, MZ - ID / 2 + 1, MZ - ID / 2 + 14);
    k.box(IW, 0.3, ID, MX, 5.8, MZ, floorW);
    for (const s of [-1, 1]) k.box(0.3, 4.4, ID, MX + s * (IW / 2 - 0.2), 8.2, MZ, white);
    k.box(IW, 4.4, 0.3, MX, 8.2, MZ - ID / 2 + 0.2, white); k.box(IW, 4.4, 0.3, MX, 8.2, MZ + ID / 2 - 0.2, white);
    k.box(IW, 0.4, ID, MX, 10.6, MZ, dark);
    for (let z = -12; z <= 12; z += 6) { k.point(MX, 4.6, MZ + z, 0xffe6c0, 12, 10); k.point(MX, 10, MZ + z, 0xffffff, 16, 12); }
    for (const [x, z] of [[MX - 8, MZ - 6], [MX + 6, MZ + 6]]) { k.prop('vitrine', x, 0.15, z, { height: 1.7, keepOut: 1.2 }); for (let i = 0; i < 3; i++) k.cyl(0.08, 0.3 + i * 0.1, x - 0.3 + i * 0.3, 1.15, z, silver, 0.06, 10); }
    k.prop('torchere', MX - IW / 2 + 1.2, 0.15, MZ + ID / 2 - 1.5, { height: 2.6 }); k.prop('torchere', MX - IW / 2 + 1.2, 0.15, MZ - ID / 2 + 1.5, { height: 2.6 });
    k.prop('vitrine', MX, 5.95, MZ, { height: 1.7, keepOut: 1.2 }); k.prop('museum_bench', MX - 6, 5.95, MZ - 8, { height: 0.58, keepOut: 1.4 });
    donorWall(k, MX, 3.4, MZ - ID / 2 + 0.38, 0, 8, false);
    eyeMedallion(k, MX + 6, 0.16, MZ - 4, 1.4);
    k.crowd([v(-4, 0, 6), v(MX + 8, 0.15, MZ), v(MX + 2, 0.15, MZ + 10), v(MX - 8, 0.15, MZ + 4)], 10, { seed: 124, speed: 0.3, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x8a3a3a, 0xd8d0c0] });
    k.crowd([v(MX - 8, 5.95, MZ - 12), v(MX + 8, 5.95, MZ + 12)], 6, { seed: 125, speed: 0.25, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: MX - IW / 2 + 0.36, y: 8.2, z: MZ, rotY: PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(1700, 120), pieces: ctx.all, backing: dark });
    // the works: the panelled walls below in gilt, the white galleries above in white frames
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = MZ - 10 + i * 5.5; mounts.push({ position: v(MX - IW / 2 + 0.38, 2.8, z), rotation: PI / 2, target: v(MX - 4, 2.4, z), width: 3.2, height: 2.2, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = MZ - 4 + i * 6; mounts.push({ position: v(MX - 1.82, 2.8, z), rotation: PI / 2 + PI, target: v(MX + 6, 2.4, z), width: 3.2, height: 2.2, style: 'gilt', wash: true }); }
    for (const x of [-9, -3, 3, 9]) mounts.push({ position: v(MX + x, 2.8, MZ + ID / 2 - 0.38), rotation: PI, target: v(MX + x, 2.4, MZ), width: 3.6, height: 2.2, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = MZ - 12 + i * 8; mounts.push({ position: v(MX + s * (IW / 2 - 0.38), 8.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX, 7.6, z), width: 4.2, height: 2.6, style: 'white', wash: true }); }
    for (const x of [-8, 0, 8]) mounts.push({ position: v(MX + x, 8.2, MZ - ID / 2 + 0.38), rotation: 0, target: v(MX + x, 7.6, MZ), width: 4.2, height: 2.6, style: 'white', wash: true });
    return { mounts, spawn: v(10, 3, 10), look: v(MX + MW / 2, 12, MZ - 2), eye: 3, bounds: [MX - IW / 2 + 0.8, 14, MZ - ID / 2 + 1, 30], style: 'gilt', floorY: (x, z) => { if (x > MX + IW / 2 - 2.8 && x < MX + IW / 2 - 0.3 && z > MZ - ID / 2 + 1 && z < MZ - ID / 2 + 14) return Math.min(5.65, ((z - (MZ - ID / 2 + 1)) / 12.6) * 5.65); if (x > MX + IW / 2 - 2.8 && x < MX + IW / 2 - 0.3 && z >= MZ - ID / 2 + 14 && z < MZ + ID / 2) return 5.95; if (x > MX - IW / 2 && x <= MX + IW / 2 - 2.8 && z > MZ - ID / 2 && z < MZ + ID / 2 && false) return 5.95; return 0; } };
  },
};

/* ---------------- 93 THE RUBIN ---------------- */
export const rubin: RoomDef = {
  id: 'rubin',
  name: 'The spiral stair',
  area: 'THE RUBIN',
  mood: 'Incense and steel',
  color: '#c86a3a',
  description: 'Seventeenth Street off Seventh, the six floors turning around a marble and steel spiral, the galleries in deep red and saffron, the works climbing with the stair.',
  signatures: 'The steel and marble spiral staircase inherited from the department store, the circular void it climbs through, the dark saturated gallery walls, the shrine room lit by butter lamps, the cafe at the bottom.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0026, stars: 200, env: 0.6 });
    k.hemi(0xffe4c8, 0x1a1418, 0.5);
    const red = k.pbr('rbRed', X.plaster(0x7a2a2a, 146), 0.4, { roughness: 0.9 }), saffron = k.pbr('rbSaffron', X.plaster(0xb86a2a, 147), 0.4, { roughness: 0.9 }),
      marble = k.pbr('rbMarble', X.marble(0xe8e4dc, 0x9a948a, 19), 0.5, { roughness: 0.3 }), steel = k.flat(0x8c98a4, 0.9, 0.3), dark = k.flat(0x1a1c20, 0.5, 0.6),
      floorD = k.pbr('rbFloor', X.terrazzo(0x3a3a3c, 148), 0.4, { roughness: 0.4 }), gold = k.pbr('rbGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }), flame = k.glow(0xffb060), glass = k.glass(0xffe0b0, 0.3, 0.1);
    street(k, { w: 16, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -20, z0: 90, count: 12, face: 1, seed: 281, h: [14, 22] });
    blockFront(k, { x: 20, z0: 90, count: 6, face: -1, seed: 282, h: [14, 20] });
    const R = 14, CZ = -14, H = 26;
    k.box(2 * R + 4, H + 2, 2 * R + 4, 0, (H + 2) / 2, CZ, k.pbr('rbBrick', X.brick(0x5a3a2e, 283), 0.28));
    k.box(6, 4.6, 0.3, 0, 2.3, CZ + R + 2, glass); k.block(-R - 2, -3.2, CZ + R + 1.6, CZ + R + 2.4); k.block(3.2, R + 2, CZ + R + 1.6, CZ + R + 2.4);
    k.sign('THE RUBIN  ·  MUSEUM OF ART', 8, 0.7, 0, 5.4, CZ + R + 2.06, 'transparent', '#f0e4c8', 70, 0);
    mlowBanner(k, -9, 10, CZ + R + 2.3, 0, 3.0, true); blossomFlag(k, 9, 10, CZ + R + 2.3, 0, 2.6, 5, 'electric');
    // the drum inside: six floors of galleries around the void, the spiral in the middle, the shrine room at the top
    k.mesh(new T.CylinderGeometry(R, R, H, 48, 1, true), red, 0, H / 2, CZ);
    for (let f = 0; f < 6; f++) { const y = f * 4.2; k.mesh(new T.RingGeometry(4.6, R, 64), floorD, 0, y, CZ).rotation.x = -PI / 2; k.mesh(new T.CylinderGeometry(4.6, 4.6, 1.0, 48, 1, true), steel, 0, y + 0.5, CZ); k.mesh(new T.RingGeometry(R - 0.1, R, 64), f % 2 ? saffron : red, 0, y + 4.1, CZ).rotation.x = PI / 2; for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.point(Math.cos(a) * 10, y + 3.4, CZ + Math.sin(a) * 10, 0xffd8a0, 8, 7); } }
    k.mesh(new T.CircleGeometry(R, 64), dark, 0, H, CZ).rotation.x = PI / 2;
    const helix: T.Vector3[] = [];
    for (let i = 0; i <= 300; i++) { const t = i / 300; const a = t * PI * 2 * 4.5; helix.push(v(Math.cos(a) * 3.6, 0.2 + t * 21, CZ + Math.sin(a) * 3.6)); }
    const hs = k.spline(helix, false, 0.5); const hp = hs.getSpacedPoints(600);
    const treadG = new T.BoxGeometry(2.6, 0.12, 0.34), tm: T.Matrix4[] = []; const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < 600; i++) { const p = hp[i]; hs.getTangentAt(i / 600, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.2, 0)), q, new T.Vector3(1, 1, 1))); }
    k.instances(treadG, marble, tm);
    k.curve(hp.filter((_, i) => i % 3 === 0).map((p) => v(p.x * 1.3, p.y + 0.9, CZ + (p.z - CZ) * 1.3)), 0.035, steel, 200);
    k.cyl(0.6, H, 0, H / 2, CZ, steel, 0.6, 24);
    for (let y = 2; y < H; y += 4) k.point(0, y, CZ, 0xffe6c0, 20, 10);
    const SY = 21; k.mesh(new T.RingGeometry(0, 4.4, 48), floorD, 0, SY, CZ).rotation.x = -PI / 2;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; k.cyl(0.05, 0.1, Math.cos(a) * 3, SY + 0.05, CZ + Math.sin(a) * 3, gold, 0.06, 8); k.sphere(0.05, Math.cos(a) * 3, SY + 0.16, CZ + Math.sin(a) * 3, flame, 5); }
    for (let i = 0; i < 5; i++) { const a = PI + (i / 4) * PI; k.box(1.2, 2.4, 0.4, Math.cos(a) * 11, SY + 1.2, CZ + Math.sin(a) * 11, gold).rotation.y = -a + PI / 2; }
    if (!ctx.reduced) { const fl = k.objects.filter((o) => o.material === flame); k.ticks.push((t) => fl.forEach((f, i) => { const s = 0.8 + 0.4 * Math.abs(Math.sin(t * 7 + i)); f.scale.set(s, s * 1.4, s); })); }
    donorWall(k, 0, 3.0, CZ - R + 0.42, 0, 8, false);
    eyeMedallion(k, 0, 0.02, CZ + 8, 1.6);
    k.crowd([v(0, 0, 20), v(0, 0, CZ + 10), v(-8, 0, CZ), v(8, 0, CZ - 6)], 12, { seed: 126, speed: 0.3, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: 0, y: 6.4, z: CZ - R + 0.42, rotY: 0, cols: 20, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(3100, 60), pieces: ctx.all, backing: dark });
    // the works: on the drum wall at every floor, facing the void, so the climb passes them all
    const mounts: Mount[] = [];
    for (let f = 0; f < 5; f++) for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + f * 0.4 + 0.3; if (f === 0 && Math.abs(Math.sin(a)) > 0.9 && Math.cos(a) > -0.2 && Math.sin(a) > 0) continue; const x = Math.cos(a) * (R - 0.42), z = CZ + Math.sin(a) * (R - 0.42); mounts.push({ position: v(x, f * 4.2 + 2.4, z), rotation: -a + PI / 2 + PI, target: v(0, f * 4.2 + 2.4, CZ), width: 3.4, height: 2.2, style: f % 2 ? 'gilt' : 'black', wash: true }); }
    const path = [v(0, 3, 22), v(0, 3, CZ + 10), v(3.6, 3, CZ)];
    for (let i = 0; i <= 600; i += 4) path.push(hp[i].clone().add(v(0, 1.6, 0)));
    path.push(v(0, SY + 1.6, CZ));
    return { mounts, spawn: path[0].clone(), look: v(0, 12, CZ), eye: 3, bounds: [-R + 1, R - 1, CZ - R + 1, 30], path, style: 'gilt' };
  },
};

/* ---------------- 94 THE SHED ---------------- */
export const theshed: RoomDef = {
  id: 'theshed',
  name: 'The shell rolls out',
  area: 'THE SHED',
  mood: 'Opening night at Hudson Yards',
  color: '#8ab0d0',
  description: 'The telescoping shell on its rails rolling out over the plaza to make the McCourt, the pillow skin lit from within, the works inside the hall and up on the gallery levels.',
  signatures: 'The quilted translucent shell on giant wheels sliding on rails out from the base building, the McCourt hall it encloses, the exposed steel diagrid, the plaza and the Vessel beyond, the High Line spur.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x14203a, horizon: 0x5a4a60, ground: 0x0e1018, fog: 0.0024, stars: 220, env: 0.65 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.55);
    const skin = k.flat(0xe8ecf4, 0.05, 0.6, { transparent: true, opacity: 0.55, emissive: 0x3a5aa8, emissiveIntensity: 0.6 }),
      steel = k.pbr('shdSteel', X.steel(0x9aa0a6, true, 284), 0.6, { metalness: 0.8, roughness: 0.4 }), dark = k.flat(0x1a1c20, 0.5, 0.6),
      floorC = k.pbr('shdFloor', X.concrete(0x6a6a68, 149), 0.3, { roughness: 0.8 }), plaza = k.pbr('shdPlaza', X.pavers(0x9a9a94, 150), 0.4),
      glassT = k.pbr('shdGlass', X.windows(285, 0.3, 0x5a6a8a, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.5, stretch: 0.42 }), white = k.flat(0xf4f4f2, 0, 0.9), rail = k.flat(0x3a3a3c, 0.6, 0.55);
    k.box(200, 0.4, 200, 0, -0.2, 0, plaza);
    for (const [x, z, w, h] of [[-60, -60, 34, 160], [70, -50, 30, 130], [-70, 60, 28, 110], [80, 70, 40, 200]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, glassT);
    k.skyline({ z: 200, count: 24, spacing: 9, scale: 2.4, base: -1, seed: 286, lit: 0.4, glow: 1.0, tint: 0x3a3a48, rows: 1 });
    // the base building: eight storeys of galleries in a steel frame, glass front
    const BX = 0, BZ = -40, BW = 40, BD = 40, BH = 34;
    k.box(BW, BH, BD, BX, BH / 2, BZ, glassT);
    for (let x = -BW / 2; x <= BW / 2; x += 5) k.box(0.6, BH, 0.6, BX + x, BH / 2, BZ + BD / 2 + 0.1, steel);
    for (let y = 0; y < BH; y += 4.2) k.box(BW + 0.4, 0.4, 0.6, BX, y + 0.2, BZ + BD / 2 + 0.1, steel);
    // the shell: a quilted box on eight wheels riding two rails out across the plaza, rolling slowly out and back
    const SW = 44, SH = 38, SD = 36;
    const shell = new T.Group();
    const skinM = new T.Mesh(new T.BoxGeometry(SW, SH, SD), skin); skinM.position.y = SH / 2 + 2; shell.add(skinM);
    for (let x = -SW / 2; x <= SW / 2; x += 4) for (let y = 4; y < SH + 2; y += 4) { const pillow = new T.Mesh(new T.SphereGeometry(2.1, 10, 8), skin); pillow.scale.set(1, 1, 0.5); pillow.position.set(x, y, SD / 2 + 0.6); shell.add(pillow); const p2 = pillow.clone(); p2.position.z = -SD / 2 - 0.6; shell.add(p2); }
    for (let i = 0; i < 6; i++) { const y = 4 + i * 6; const beam = new T.Mesh(new T.BoxGeometry(SW + 0.2, 0.5, 0.5), steel); beam.position.set(0, y, SD / 2 + 0.3); shell.add(beam); const beam2 = beam.clone(); beam2.position.z = -SD / 2 - 0.3; shell.add(beam2); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; const d1 = new T.Mesh(new T.BoxGeometry(0.4, 12, 0.4), steel); d1.position.set(Math.cos(a) * SW / 2 * 0.9, 8 + (i % 2) * 8, Math.sin(a) * SD / 2 * 0.9); d1.rotation.z = 0.7 * (i % 2 ? 1 : -1); shell.add(d1); }
    for (const sx of [-1, 1]) for (const dz of [-14, -4, 4, 14]) { const wheel = new T.Mesh(new T.CylinderGeometry(1.8, 1.8, 1.0, 20), dark); wheel.rotation.z = PI / 2; wheel.position.set(sx * (SW / 2 + 0.8), 1.8, dz); shell.add(wheel); const bogie = new T.Mesh(new T.BoxGeometry(2.4, 2.4, 6), steel); bogie.position.set(sx * (SW / 2 + 0.8), 3.4, dz); shell.add(bogie); }
    shell.position.set(BX, 0, BZ + BD / 2 + SD / 2 + 4); k.add(shell);
    for (const sx of [-1, 1]) { k.box(0.4, 0.4, 90, BX + sx * (SW / 2 + 0.8), 0.2, BZ + 26, rail); k.box(1.2, 0.2, 90, BX + sx * (SW / 2 + 0.8), 0.05, BZ + 26, dark); }
    if (!ctx.reduced) k.ticks.push((t) => { shell.position.z = BZ + BD / 2 + SD / 2 + 4 + 8 * Math.sin(t * 0.08); shell.children.forEach((c) => { if ((c as T.Mesh).geometry instanceof T.CylinderGeometry) c.rotation.x = t * 0.2 * Math.cos(t * 0.08) * 0.5; }); });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.point(BX + Math.cos(a) * 14, 14, BZ + BD / 2 + SD / 2 + 4 + Math.sin(a) * 10, 0x6a9aff, 40, 30); }
    // the McCourt floor under the shell: the hall, its stage, the works on the base building's face and on screens
    const HZ = BZ + BD / 2 + SD / 2 + 4;
    k.box(SW - 4, 0.3, SD - 4, BX, 0.15, HZ, floorC);
    k.box(20, 1.2, 10, BX, 0.6, HZ - 10, dark);
    for (let i = 0; i < 5; i++) k.spot(BX - 8 + i * 4, 30, HZ + 4, BX - 8 + i * 4, 1.2, HZ - 10, 0xffffff, 200, 0.4, 0.6, 40);
    k.block(BX - 10, BX + 10, HZ - 15, HZ - 5);
    k.block(BX - SW / 2 - 1.6, BX - SW / 2 + 1.6, HZ - SD / 2, HZ + SD / 2); k.block(BX + SW / 2 - 1.6, BX + SW / 2 + 1.6, HZ - SD / 2, HZ + SD / 2);
    donorWall(k, BX, 6.4, BZ + BD / 2 + 0.42, 0, 12, false);
    wordmarkRelief(k, BX, 12, BZ + BD / 2 + 0.44, 0, 8);
    eyeMonument(k, BX + 26, 0, HZ + 22, PI * 1.25, 5);
    blossomGarden(k, BX - 30, 0, HZ + 20, 6, 2.2);
    for (let i = 0; i < 6; i++) k.prop('rope_stanchion', BX - 12 + i * 4.8, 0.15, HZ + 10, { height: 1.0 });
    k.crowd([v(BX - 16, 0.15, HZ + 12), v(BX - 6, 0.15, HZ + 2), v(BX + 6, 0.15, HZ + 2), v(BX + 16, 0.15, HZ + 12)], 36, { seed: 127, speed: 0.3, spread: 3, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f, 0xd8d0c0] });
    k.crowd([v(-40, 0, 60), v(0, 0, 50), v(40, 0, 60)], 24, { seed: 128, speed: 0.8, spread: 6, animate: !ctx.reduced });
    k.censusWall({ x: BX, y: 20, z: BZ + BD / 2 + 0.42, rotY: 0, cols: 40, rows: 8, tile: 0.55, gap: 0.05, start: ctx.wallStart(3600, 320), pieces: ctx.all, backing: dark });
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = BX - 15 + i * 6; if (Math.abs(x) < 4) continue; mounts.push({ position: v(x, 4.2, BZ + BD / 2 + 0.42), rotation: 0, target: v(x, 3, HZ), width: 4.6, height: 2.7, style: 'steel', wash: true }); }
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const z = HZ - 12 + i * 8; const sc = k.box(0.14, 3.2, 4.6, BX + sx * (SW / 2 - 2.2), 2.4, z, dark); void sc; mounts.push({ position: v(BX + sx * (SW / 2 - 2.3), 2.5, z), rotation: sx < 0 ? PI / 2 : -PI / 2, target: v(BX, 2.5, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = BX - 12 + i * 8; k.box(4.6, 3.2, 0.3, x, 2.4, HZ + SD / 2 - 3, dark); mounts.push({ position: v(x, 2.5, HZ + SD / 2 - 3.18), rotation: PI, target: v(x, 2.5, HZ), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(-10, 3, 60), look: v(BX, 16, HZ), eye: 3, bounds: [-60, 60, BZ + BD / 2 + 1, 80], style: 'steel' };
  },
};

/* ---------------- 95 THE ARMORY ---------------- */
export const armory: RoomDef = {
  id: 'armory',
  name: 'The drill hall',
  area: 'PARK AVENUE ARMORY',
  mood: 'An installation at dusk',
  color: '#8a6a4a',
  description: 'The brick fortress on Park Avenue, the period rooms of the regiment, then the drill hall: fifty five thousand square feet under iron arches, the works standing in the dark like an installation.',
  signatures: 'The Gothic Revival brick armory with its crenellated towers, the Tiffany and Herter Brothers company rooms, the drill hall\'s wrought iron barrel trusses eighty feet high, the vast wooden floor, the balcony round the hall.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0024, stars: 200, env: 0.6 });
    k.hemi(0xd8d0e8, 0x1a1418, 0.45);
    const brick = k.pbr('armBrick', X.brick(0x6a4436, 287), 0.28), iron = k.pbr('armIron', X.steel(0x3a3a3c, true, 288), 0.6, { metalness: 0.7, roughness: 0.5 }),
      floorW = k.pbr('armFloor', X.planks(0x7a5a3a, 8, 289, 0.15), 0.9, { roughness: 0.6 }), dark = k.flat(0x1a1c20, 0.5, 0.6), oak = k.pbr('armOak', X.planks(0x4a2e1a, 4, 290, 0.15), 1.4),
      glow = k.glow(0xffd8a0), glass = k.glass(0xffe0b0, 0.3, 0.1), lime = k.pbr('armLime', X.ashlar(0xb8ad97, 291, 3), 0.22);
    street(k, { w: 40, len: 160, z: 40, x: 0 });
    k.box(8, 0.5, 160, 0, 0.1, 40, k.pbr('armMall', X.grass(0x3a5a2a, 151), 0.06)); for (let z = -30; z <= 110; z += 14) k.tree(0, 0.4, z, { kind: 'round', h: 5, r: 2, seed: z });
    blockFront(k, { x: -60, z0: 110, count: 12, face: 1, seed: 292, h: [20, 40] });
    const AW = 60, AD = 80, AX = 0, AZ = -30, AH = 16;
    k.box(AW, AH, AD, AX, AH / 2, AZ, brick);
    for (let x = -AW / 2 + 2; x < AW / 2; x += 4) k.box(2, 2, 2.2, AX + x, AH + 1, AZ + AD / 2 - 1, brick);
    for (const sx of [-1, 1]) { k.box(8, 22, 8, AX + sx * (AW / 2 - 4), 11, AZ + AD / 2 - 4, brick); for (let x = -3; x <= 3; x += 2) k.box(1.4, 1.6, 1.4, AX + sx * (AW / 2 - 4) + x, 22.8, AZ + AD / 2 - 1, brick); }
    k.arch(6, 9, 4, AX, 0, AZ + AD / 2, lime, false, 0.85);
    k.block(AX - AW / 2, AX - 3.2, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6); k.block(AX + 3.2, AX + AW / 2, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6);
    for (let f = 0; f < 2; f++) for (let i = 0; i < 6; i++) { const y = 5 + f * 6, x = AX - 20 + i * 8; if (Math.abs(x) < 5) continue; k.arch(1.8, 3.6, 0.4, x, y - 1.8, AZ + AD / 2 + 0.05, lime, false, 0.7); k.box(1.4, 3, 0.06, x, y, AZ + AD / 2 + 0.1, glass); }
    k.sign('SEVENTH REGIMENT ARMORY  ·  1880', 10, 0.7, AX, 14, AZ + AD / 2 + 0.06, 'transparent', '#e8dcc0', 70, 0);
    mlowBanner(k, AX - 14, 9, AZ + AD / 2 + 0.6, 0, 3.2, true); blossomFlag(k, AX + 14, 9, AZ + AD / 2 + 0.6, 0, 2.8, 7, 'ink');
    for (let i = 0; i < 5; i++) k.point(AX - 16 + i * 8, 2.4, AZ + AD / 2 + 2.6, 0xffc890, 34, 26);
    for (const x of [AX - 22, AX + 22]) { k.cyl(0.08, 5, x, 2.5, AZ + AD / 2 + 7, k.flat(0x1a1c20, 0.5, 0.6), 0.08, 8); k.sphere(0.3, x, 5.2, AZ + AD / 2 + 7, k.glow(0xffe0b0, 1.2)); k.point(x, 5.2, AZ + AD / 2 + 7, 0xffe0b0, 25, 20); }
    // the company room: oak, a fireplace, Tiffany glass, then the drill hall beyond
    const CZ = AZ + AD / 2 - 8;
    k.box(20, 0.3, 14, AX, 0.15, CZ, floorW);
    for (const s of [-1, 1]) { k.box(0.4, 6, 14, AX + s * 10, 3, CZ, oak); k.block(AX + s * 10 - 0.4, AX + s * 10 + 0.4, CZ - 7, CZ + 7); }
    k.box(20, 0.4, 14, AX, 6, CZ, k.pbr('armCeiling', X.plaster(0x6a5a48, 152), 0.4));
    k.box(20, 6, 0.4, AX, 3, CZ - 7, oak); k.block(AX - 10, AX - 3, CZ - 7.4, CZ - 6.6); k.block(AX + 3, AX + 10, CZ - 7.4, CZ - 6.6);
    k.box(3, 3.6, 0.6, AX - 6, 1.8, CZ - 6.6, lime); k.box(1.6, 1.4, 0.3, AX - 6, 0.7, CZ - 6.3, dark); k.point(AX - 6, 1.2, CZ - 5.6, 0xff9a40, 14, 6);
    k.prop('torchere', AX + 8, 0.15, CZ + 5, { height: 2.6 }); k.prop('torchere', AX - 8, 0.15, CZ + 5, { height: 2.6 });
    for (let i = 0; i < 3; i++) k.point(AX - 6 + i * 6, 5, CZ, 0xffd8a0, 12, 10);
    // the drill hall: the iron trusses, the wooden floor, the balcony, the installation of works standing in the dark
    const HZ = AZ - 14, HW = AW - 2, HD = AD - 24, HH = 24;
    k.box(HW, 0.3, HD, AX, 0.15, HZ, floorW);
    for (const s of [-1, 1]) { k.box(0.6, HH, HD, AX + s * HW / 2, HH / 2, HZ, brick); k.block(AX + s * HW / 2 - 0.6, AX + s * HW / 2 + 0.6, HZ - HD / 2, HZ + HD / 2); }
    k.box(HW, HH, 0.6, AX, HH / 2, HZ - HD / 2, brick); k.block(AX - HW / 2, AX + HW / 2, HZ - HD / 2 - 0.6, HZ - HD / 2 + 0.6);
    for (let i = 0; i <= 8; i++) { const z = HZ - HD / 2 + i * (HD / 8); const pts: T.Vector3[] = []; for (let j = 0; j <= 20; j++) { const a = (j / 20) * PI; pts.push(v(AX + Math.cos(a) * HW / 2, 8 + Math.sin(a) * (HH - 8), z)); } k.curve(pts, 0.35, iron, 20); const pts2 = pts.map((p) => v(p.x * 0.94, 8 + (p.y - 8) * 0.88, p.z)); k.curve(pts2, 0.25, iron, 20); for (let j = 1; j < 20; j += 2) k.beam(pts[j], pts2[j], 0.08, iron, 4); }
    for (let j = 0; j <= 20; j += 4) { const a = (j / 20) * PI; k.box(0.3, 0.3, HD, AX + Math.cos(a) * HW / 2, 8 + Math.sin(a) * (HH - 8), HZ, iron); }
    const roofG = new T.CylinderGeometry(HW / 2 + 0.6, HW / 2 + 0.6, HD, 32, 1, true, 0, PI); const roof = k.mesh(roofG, k.pbr('armRoof', X.plaster(0x3a3a40, 153), 0.3, { side: T.BackSide }), AX, 8, HZ); roof.rotation.set(0, 0, PI / 2); roof.rotateX(PI / 2); roof.scale.set(1, (HH - 8) / (HW / 2), 1); void roof;
    for (const s of [-1, 1]) { k.box(4, 0.4, HD, AX + s * (HW / 2 - 2), 7.6, HZ, floorW); k.box(0.06, 1.1, HD, AX + s * (HW / 2 - 4), 8.4, HZ, iron); for (let z = -HD / 2; z <= HD / 2; z += 3) k.box(0.06, 1.1, 0.06, AX + s * (HW / 2 - 4), 8.4, HZ + z, iron); }
    for (let i = 0; i < 14; i++) k.box(3, 0.55, 1.0, AX + HW / 2 - 2, 0.27 + i * 0.55, HZ + HD / 2 - 1 - i * 1.0, iron);
    k.block(AX - HW / 2 + 0.6, AX - HW / 2 + 4, HZ - HD / 2, HZ + HD / 2); k.block(AX + HW / 2 - 4, AX + HW / 2 - 0.6, HZ - HD / 2, HZ + HD / 2 - 15);
    for (let z = -HD / 2 + 6; z < HD / 2; z += 10) k.point(AX, HH - 4, HZ + z, 0xffd8a0, 20, 30);
    // the installation: works standing on free walls in a grid on the floor, each lit by one spot from the trusses
    const mounts: Mount[] = [];
    const rnd = X.mulberry(95);
    for (let i = 0; i < 12; i++) { const gx = (i % 4) - 1.5, gz = Math.floor(i / 4) - 1; const x = AX + gx * 12 + (rnd() - 0.5) * 3, z = HZ + gz * 14 + (rnd() - 0.5) * 3; const rot = rnd() * PI; const w = k.box(5.2, 3.6, 0.4, x, 1.8, z, k.pbr('armWall' + (i % 3), X.plaster([0xf4f4f2, 0x2a2a2e, 0x6a2a2a][i % 3], 154 + i % 3), 0.4)); w.rotation.y = rot; for (let t = -2; t <= 2; t++) k.keepOut.push({ x: x + Math.cos(rot) * t, z: z - Math.sin(rot) * t, r: 0.7 }); for (const s of [-1, 1]) mounts.push({ position: v(x + Math.sin(rot) * s * 0.22, 1.9, z + Math.cos(rot) * s * 0.22), rotation: rot + (s > 0 ? 0 : PI), target: v(x + Math.sin(rot) * s * 6, 2, z + Math.cos(rot) * s * 6), width: 4.4, height: 2.6, style: i % 3 === 1 ? 'white' : 'black', wash: false }); k.spot(x, HH - 2, z + 3, x, 1.8, z, 0xfff0d8, 120, 0.35, 0.5, 30); }
    eyeMonument(k, AX, 0.15, HZ + HD / 2 - 4, PI, 4.6);
    donorWall(k, AX, 4.4, HZ - HD / 2 + 0.42, 0, 12, false);
    k.crowd([v(AX - 20, 0.15, HZ + 20), v(AX - 12, 0.15, HZ - 10), v(AX + 10, 0.15, HZ - 20), v(AX + 20, 0.15, HZ + 10)], 20, { seed: 129, speed: 0.3, spread: 3, animate: !ctx.reduced, closed: true, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.censusWall({ x: AX, y: 6, z: HZ - HD / 2 + 0.42, rotY: 0, cols: 40, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(7000, 240), pieces: ctx.all, backing: dark });
    return { mounts, spawn: v(-16, 3, 44), look: v(AX + 4, 14, AZ + AD / 2), eye: 3, bounds: [-HW / 2 + 4.2, HW / 2 - 4.2, HZ - HD / 2 + 1, 48], style: 'black', floorY: (x, z) => { if (x > AX + HW / 2 - 4 && x < AX + HW / 2 - 0.6 && z < HZ + HD / 2 - 0.5 && z > HZ + HD / 2 - 15) return Math.min(7.6, ((HZ + HD / 2 - 0.5 - z) / 14) * 7.6); if ((x < AX - HW / 2 + 4 || x > AX + HW / 2 - 4) && z > HZ - HD / 2 && z <= HZ + HD / 2 - 15 && Math.abs(x) < HW / 2) return 7.8; return 0; } };
  },
};

/* ---------------- 96 THE CUSTOM HOUSE ---------------- */
export const customhouse: RoomDef = {
  id: 'customhouse',
  name: 'The rotunda at Bowling Green',
  area: 'THE CUSTOM HOUSE',
  mood: 'Harbor light through the skylight',
  color: '#c8b8a0',
  description: 'Bowling Green and the four continents on their pedestals, the granite palace of the old Custom House, then the oval rotunda: a tile dome that floats with no columns, the murals of the harbor, the works in the collector\'s offices.',
  signatures: 'The Beaux Arts granite front with its giant columns and the four seated continents, the elliptical rotunda with a Guastavino tile dome and skylight, the harbor murals in the dome\'s spandrels, the old collector\'s counters in marble and bronze.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.0018, sun: { az: 2.6, el: 0.7, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.4, 60, 80, 40, true, 100);
    const granite = k.pbr('chGranite2', X.ashlar(0x9a9488, 293, 3), 0.24), marble = k.pbr('chMarble2', X.marble(0xe0dcd2, 0x9a948a, 20), 0.5, { roughness: 0.3 }),
      tile = k.pbr('chTileDome', X.brick(0xcbb894, 294), 0.16, { roughness: 0.55, stretch: 0.5, side: T.BackSide }), bronze = k.flat(0x4a3a28, 0.8, 0.4),
      floorT = k.pbr('chFloorT', X.terrazzo(0xc8c0b0, 155), 0.4, { roughness: 0.3 }), dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xe8f4f8, 0.1, 0.03),
      mural = [k.flat(0x6a8ab0, 0, 0.9), k.flat(0xb89a6a, 0, 0.9), k.flat(0x8ab0a0, 0, 0.9), k.flat(0xc8a878, 0, 0.9)], lawn = k.pbr('bgLawn2', X.grass(0x4a7a3a, 156), 0.06);
    // Bowling Green: the oval park, the fence, the canyon of Broadway behind
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.mesh(new T.CylinderGeometry(18, 18, 0.5, 48), lawn, 0, 0.05, 66).scale.set(1, 1, 0.7);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; k.box(0.06, 1.2, 0.06, Math.cos(a) * 18.5, 0.6, 66 + Math.sin(a) * 12.9, dark); }
    k.mesh(new T.CylinderGeometry(2.4, 2.6, 0.6, 32), granite, 0, 0.3, 66); k.mesh(new T.CylinderGeometry(2, 2, 0.2, 32), k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), 0, 0.7, 66);
    blockFront(k, { x: -46, z0: 130, count: 12, face: 1, seed: 295, h: [24, 50] }); blockFront(k, { x: 46, z0: 130, count: 12, face: -1, seed: 296, h: [24, 50] });
    k.skyline({ z: -200, count: 30, spacing: 9, scale: 4.2, base: -1, seed: 297, lit: 0.25, glow: 0.5, tint: 0x6e7684, rows: 1, spires: true });
    // the facade: giant columns, the four continents seated on pedestals, the steps
    const FZ = 10, FW = 90;
    k.box(FW, 32, 60, 0, 16, FZ - 30, granite);
    k.moulding([[0, 0], [1.4, 0], [1.5, 0.4], [0.9, 0.7], [1.2, 1.1], [0, 1.4]], FW + 0.4, 0, 31.2, FZ + 0.05, granite, 0);
    for (let i = 0; i < 12; i++) k.box(FW + 6, 0.34, 1.6, 0, 0.17 + i * 0.34, FZ + 2 + i * 1.6, granite);
    for (let i = 0; i < 12; i++) { const x = -38.5 + i * 7; k.column(x, 4, FZ + 1.6, 20, 1.2, granite, true); k.prop('corinthian_capital', x, 24, FZ + 1.6, { height: 2.4 }); }
    k.box(FW, 2.4, 5, 0, 26.6, FZ + 1.6, granite);
    for (const x of [-42, -14, 14, 42]) { k.box(5, 3, 5, x, 5.5, FZ + 5, granite); k.prop('bronze_figure', x, 7, FZ + 5, { height: 3.6 }); k.keepOut.push({ x, z: FZ + 5, r: 3.4 }); }
    for (const x of [-28, 0, 28]) { k.arch(4.4, 9, 4, x, 4, FZ + 0.4, granite, false, 0.85); k.box(3.6, 6.6, 0.2, x, 8, FZ + 0.6, glass); }
    k.block(-FW / 2, -2.2, FZ - 0.5, FZ + 1); k.block(2.2, FW / 2, FZ - 0.5, FZ + 1);
    k.sign('CUSTOM HOUSE  ·  1907  ·  THE MUSEUM OF THE AMERICAN INDIAN', 24, 0.9, 0, 29, FZ + 1.4, 'transparent', '#e8dcc0', 70, 0);
    mlowBanner(k, -21, 15, FZ + 2.4, 0, 4.2, true); blossomFlag(k, 21, 15, FZ + 2.4, 0, 3.6, 5, 'electric');
    // the rotunda: an ellipse under a tile dome with a skylight, the murals in the spandrels, the counters
    const RZ = FZ - 26, RA = 24, RB = 16, RH = 12;
    k.mesh(new T.CylinderGeometry(RA, RA, 0.3, 64), floorT, 0, 4.15, RZ).scale.set(1, 1, RB / RA);
    const wall = k.mesh(new T.CylinderGeometry(RA, RA, RH, 64, 1, true), marble, 0, 4 + RH / 2, RZ); wall.scale.set(1, 1, RB / RA);
    for (let i = 0; i < 64; i++) { const a = (i / 64) * PI * 2; const x = Math.cos(a) * (RA + 0.4), z = RZ + Math.sin(a) * (RB + 0.4); if (Math.abs(a - PI / 2) < 0.14) continue; k.keepOut.push({ x, z, r: 1.2 }); }
    k.block(-RA, -2.4, RZ + RB - 0.6, RZ + RB + 0.6); k.block(2.4, RA, RZ + RB - 0.6, RZ + RB + 0.6);
    const dome = k.mesh(new T.SphereGeometry(RA, 48, 16, 0, PI * 2, 0, PI / 2), tile, 0, 4 + RH, RZ); dome.scale.set(1, 0.55, RB / RA);
    k.torus(6, 0.4, 0, 4 + RH + RA * 0.55 - 0.6, RZ, bronze, 48).rotation.x = PI / 2;
    k.mesh(new T.CircleGeometry(5.6, 32), k.glow(0xfff4e0, 0.9), 0, 4 + RH + RA * 0.55 - 0.5, RZ).rotation.x = PI / 2;
    k.point(0, 4 + RH + 4, RZ, 0xfff4e6, 120, 50);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8; const x = Math.cos(a) * (RA - 0.6), z = RZ + Math.sin(a) * (RB - 0.6); const m = k.box(6, 3.2, 0.2, 0, 0, 0, mural[i % 4]); m.position.set(x, 4 + RH - 2, z); m.rotation.y = -a + PI / 2; k.point(x * 0.85, 4 + RH - 1, RZ + (z - RZ) * 0.85, 0xffe8c8, 10, 8); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; const x = Math.cos(a) * 9, z = RZ + Math.sin(a) * 7; k.box(5, 1.1, 1.0, x, 4.7, z, marble).rotation.y = -a; k.box(5, 0.9, 0.06, x, 6.0, z, bronze).rotation.y = -a; k.keepOut.push({ x, z, r: 2.8 }); }
    eyeMedallion(k, 0, 4.32, RZ, 2.8);
    donorWall(k, 0, 8.8, RZ - RB + 0.6, 0, 12, false);
    for (let i = 0; i < 4; i++) k.prop('rope_stanchion', -8 + i * 5.3, 4.15, RZ + RB - 5, { height: 1.0 });
    k.box(24, 0.3, 24, 0, 4.15, FZ - 12, floorT); k.block(-12, -12 + 0.4, FZ - 24, FZ); k.block(12 - 0.4, 12, FZ - 24, FZ);
    k.crowd([v(0, 0, 44), v(0, 0, FZ + 12), v(0, 4.15, FZ - 6), v(-10, 4.15, RZ + 4), v(10, 4.15, RZ - 6)], 30, { seed: 130, speed: 0.4, spread: 3, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517] });
    k.censusWall({ x: -11.66, y: 8, z: FZ - 12, rotY: PI / 2, cols: 24, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(200, 144), pieces: ctx.all, backing: dark });
    // the works: the rotunda wall between the murals, the lobby walls, the facade bays
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; if (Math.abs(a - PI / 2) < 0.2) continue; const x = Math.cos(a) * (RA - 0.5), z = RZ + Math.sin(a) * (RB - 0.5); mounts.push({ position: v(x, 8.2, z), rotation: -a + PI / 2 + PI, target: v(0, 7, RZ), width: 4.4, height: 3.2, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = FZ - 6 - i * 6; mounts.push({ position: v(11.66, 7.6, z), rotation: -PI / 2, target: v(0, 6.5, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    for (const x of [-35, -7, 7, 35]) mounts.push({ position: v(x, 12, FZ + 0.42), rotation: 0, target: v(x, 7, FZ + 16), width: 4.6, height: 3.2, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 46), look: v(0, 18, FZ), eye: 3, bounds: [-RA + 1, RA - 1, RZ - RB + 1.5, 54], style: 'gilt', floorY: (x, z) => { void x; if (z > FZ + 1.5 && z < FZ + 21) return Math.min(4.1, ((FZ + 21 - z) / 19.5) * 4.1); if (z <= FZ + 1.5) return 4.15; return 0; } };
  },
};
