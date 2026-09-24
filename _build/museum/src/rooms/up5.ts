/* Upgrade batch five (2026-09-24): the Museum of the City of New York and the Dakota.

   These two are repairs on the originals' own plans rather than new plans: the
   rooms were copied here from u.ts and p.ts (which are untouched) and fixed.

   mcny had fifteen of seventeen works rescued. The rotunda works aimed at the
   blocked mezzanine, four high works aimed at nothing a visitor could reach, the
   three on the park wall faced the park, and the whole building was one solid
   34 by 16 by 40 brick box with the rotunda inside it (fault 3), whose side stood
   in front of the timeline gallery's works. The portico was a solid block through
   the door, and the street ran under the portico stairs.

   dakota had fourteen of twenty two rescued. The courtyard targets stood inside
   the fountain keep outs, the park wall works faced backwards, and the north wing
   was one solid box straight through the carriage arch with a block across it, so
   the courtyard could not be walked into at all. There was no 72nd Street for the
   arch to open onto. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion } from './brand';
const PI = Math.PI;
void blockFront;

export const mcny2: RoomDef = {
  id: 'mcny',
  name: 'The city\'s museum',
  area: 'MUSEUM OF THE CITY OF NEW YORK',
  mood: 'Museum Mile, the top of the mile',
  color: '#b8a8a0',
  description: 'The red brick Georgian building on Fifth at 103rd with Hamilton and Clinton in their niches, the marble rotunda with its twin curving stairs, the timeline gallery with its wall of screens changing, school groups following a guide, and the works hung round the rotunda and down the gallery telling the city\'s own story.',
  signatures: 'The Colonial Revival red brick and marble front with its portico and cupola, the entrance rotunda with two sweeping marble staircases, the New York at its core gallery with its wall of screens, the terrace on Fifth.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.4, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xfff0dc, 0x4a4038, 0.7);
    k.sun(0xfff0d8, 1.8, 30, 60, 40, true, 70);
    const brick = k.pbr('mcBrick', X.brick(0x8a3a2e, 310), 0.28), marble = k.pbr('mcMarble', X.marble(0xe8e4dc, 0x9a948a, 21), 0.5, { roughness: 0.3 }), lime = k.pbr('mcLime', X.ashlar(0xd8d0bc, 311, 4), 0.25),
      floorT = k.pbr('mcFloor', X.terrazzo(0xc8c0b0, 172), 0.4, { roughness: 0.3 }), dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), bronze = k.flat(0x4a3a28, 0.8, 0.4), screen = k.glow(0x3a6aff, 0.8), white = k.pbr('mcWhite', X.plaster(0xf4f4f2, 173), 0.4);
    street(k, { w: 12, len: 160, z: 40, x: 7 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('mcLawn', X.grass(0x3a5a2a, 174), 0.06)); k.rail(18, 0, 160, dark, 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(101); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'round', h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i });
    const BX = -30, BZ = 0, BW = 34, BD = 40;
    /* hollow: the old room was one 34 by 16 by 40 solid box with the rotunda inside it */
    const HZ0 = BZ - 26, HZ1 = BZ + BD / 2, FX = BX + BW / 2;
    for (const [z0, z1] of [[HZ0, BZ - 1.4], [BZ + 1.4, HZ1]]) k.box(0.6, 16, z1 - z0, FX - 0.3, 8, (z0 + z1) / 2, brick);
    k.box(0.6, 11.8, 2.8, FX - 0.3, 4.2 + 11.8 / 2, BZ, brick);
    k.box(0.6, 16, HZ1 - HZ0, BX - BW / 2 + 0.3, 8, (HZ0 + HZ1) / 2, brick);
    for (const z of [HZ0 + 0.3, HZ1 - 0.3]) k.box(BW, 16, 0.6, BX, 8, z, brick);
    for (const [w, d, x, z] of [[0.8, HZ1 - HZ0 + 0.4, FX + 0.1, (HZ0 + HZ1) / 2], [0.8, HZ1 - HZ0 + 0.4, BX - BW / 2 - 0.1, (HZ0 + HZ1) / 2], [BW + 0.4, 0.8, BX, HZ0 - 0.1], [BW + 0.4, 0.8, BX, HZ1 + 0.1]] as const) k.box(w, 2, d, x, 1, z, marble);
    k.box(BW + 0.6, 1.2, HZ1 - HZ0 + 0.6, BX, 15.6, (HZ0 + HZ1) / 2, marble);
    k.block(BX - BW / 2 - 1, FX, HZ0 - 1, HZ0 + 0.6); k.block(BX - BW / 2 - 1, FX, HZ1 - 0.6, HZ1 + 1);
    // the portico: two piers and a lintel round the door, not a block through it
    for (const s of [-1, 1]) k.box(2.4, 8, 1.6, FX + 1.2, 4, BZ + s * 2.2, marble);
    k.box(2.4, 3.8, 6, FX + 1.2, 6.1, BZ, marble);
    // Hamilton and Clinton in their niches, looking at the park
    const statues: T.Vector3[] = [];
    for (const s of [-1, 1]) { const z = BZ + s * 8; k.box(0.5, 4.2, 2.2, FX + 0.1, 5.6, z, marble); k.box(1.2, 0.5, 1.4, FX + 0.6, 3.75, z, marble); k.cyl(0.36, 1.9, FX + 0.6, 4.95, z, marble, 0.44, 10); k.sphere(0.24, FX + 0.6, 6.15, z, marble, 10); statues.push(v(FX + 0.6, 5.2, z)); } for (let i = 0; i < 4; i++) k.column(BX + BW / 2 + 2.4, 0.1, BZ - 4.5 + i * 3, 6, 0.6, marble, true); k.box(8, 1.4, 8, BX + BW / 2 + 0.8, 6.9, BZ, marble);
    const ped = new T.Shape(); ped.moveTo(-4, 0); ped.lineTo(4, 0); ped.lineTo(0, 2); ped.closePath(); k.mesh(new T.ExtrudeGeometry(ped, { depth: 6 }), marble, BX + BW / 2 + 3.4, 7.6, BZ - 3).rotation.y = PI / 2;
    k.cyl(2.4, 4, BX, 18, BZ, marble, 2.4, 12); k.mesh(new T.SphereGeometry(2.6, 16, 10, 0, PI * 2, 0, PI / 2), k.pbr('mcCopper', X.patina(0x5f9a8c), 0.6), BX, 20, BZ);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) { const y = 4 + f * 4.2, z = BZ - 15 + i * 5; if (Math.abs(z) < 3.5 && f === 0) continue; k.box(0.16, 2.6, 1.6, BX + BW / 2 + 0.02, y, z, lime); k.box(0.06, 2.2, 1.2, BX + BW / 2 + 0.1, y, z, glass); }
    k.arch(2.4, 4.2, 1.4, BX + BW / 2 + 0.2, 0, BZ, marble, false, 0.85).rotation.y = PI / 2;
    k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.6, BZ - BD / 2, BZ - 1.4); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.6, BZ + 1.4, BZ + BD / 2);
    for (let i = 0; i < 8; i++) k.box(10, 0.3, 1.0, BX + BW / 2 + 4.4, 0.15 + i * 0.3, BZ - 5 + i * 0 + 0, marble), void i;
    for (let i = 0; i < 8; i++) k.box(1.0, 0.3, 10, BX + BW / 2 + 3 + i * 1.0, 0.15 + (7 - i) * 0.3, BZ, marble);
    k.sign('MUSEUM OF THE CITY OF NEW YORK', 9, 0.7, BX + BW / 2 + 4.06, 6.2, BZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, BX + BW / 2 + 0.5, 11, BZ - 12, PI / 2, 3.0, true); blossomFlag(k, BX + BW / 2 + 0.5, 11, BZ + 12, PI / 2, 2.6, 1, 'cloud');
    // the rotunda: two curving marble stairs meeting at the mezzanine, the timeline gallery beyond with its wall of screens
    const RW = BW - 1.2, RD = 20;
    k.box(RW, 0.3, RD, BX, 0.15, BZ, floorT);
    k.block(BX - RW / 2 - 0.6, BX - RW / 2 + 0.2, BZ - RD / 2, BZ + RD / 2);
    k.box(RW, 0.4, RD, BX, 12, BZ, white);
    k.mesh(new T.SphereGeometry(8, 32, 12, 0, PI * 2, 0, PI / 2), k.pbr('mcDome', X.plaster(0xe8e2d4, 175), 0.3, { side: T.BackSide }), BX, 11.8, BZ).scale.y = 0.5;
    k.point(BX, 9, BZ, 0xfff4e6, 60, 30);
    for (const s of [-1, 1]) { const arc: T.Vector3[] = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const a = PI / 2 + s * t * PI * 0.5; arc.push(v(BX - 2 + Math.cos(a) * 8, 0.2 + t * 5.4, BZ + Math.sin(a) * 8 * s * s)); } const sp = k.spline(arc, false, 0.5); const pts = sp.getSpacedPoints(60); const tg = new T.BoxGeometry(2.2, 0.14, 0.32), tm: T.Matrix4[] = []; const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0); for (let i = 0; i < 60; i++) { const p = pts[i]; sp.getTangentAt(i / 60, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.15, 0)), q, new T.Vector3(1, 1, 1))); } k.instances(tg, marble, tm); k.curve(pts.filter((_, i) => i % 2 === 0).map((p) => v(BX - 2 + (p.x - BX + 2) * 1.14, p.y + 0.95, BZ + (p.z - BZ) * 1.14)), 0.035, bronze, 30); }
    k.box(RW - 4, 0.4, 6, BX - 4, 5.6, BZ, marble); k.block(BX - RW / 2, BX + RW / 2 - 4, BZ - 3, BZ + 3);
    k.prop('balustrade', BX - 4, 5.8, BZ + 3.1, { height: 1.0 }); k.prop('balustrade', BX - 4, 5.8, BZ - 3.1, { height: 1.0 });
    eyeMedallion(k, BX + 6, 0.16, BZ, 2.4);
    donorWall(k, BX, 8.4, BZ - RD / 2 + 0.36, 0, 9, false);
    const TZ = BZ - RD / 2 - 8;
    k.box(RW, 0.3, 14, BX, 0.15, TZ, floorT); k.block(BX - RW / 2 - 0.6, BX - RW / 2 + 0.2, TZ - 7, TZ + 7); k.block(BX - RW / 2, BX + RW / 2, TZ - 7.6, TZ - 6.8);
    k.box(RW, 0.4, 14, BX, 6, TZ, dark);
    for (let i = 0; i < 10; i++) { const s = k.mesh(new T.PlaneGeometry(2.6, 0.8), screen, BX - 13.5 + i * 3, 5.15, TZ - 6.6); void s; }
    for (let i = 0; i < 10; i++) k.point(BX - 13.5 + i * 3, 5, TZ - 5, 0x3a6aff, 4, 5);
    k.censusWall({ x: BX, y: 3.4, z: TZ - 6.62, rotY: 0, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(0, 160), pieces: ctx.all, backing: dark });
    k.prop('vitrine', BX - 8, 0.15, TZ, { height: 1.7, keepOut: 1.2 }); k.prop('vitrine', BX + 8, 0.15, TZ, { height: 1.7, keepOut: 1.2 }); k.prop('globe_stand', BX, 0.15, TZ + 4, { height: 2, keepOut: 1 });
    k.crowd([v(-4, 0, 20), v(BX + 12, 0.15, BZ + 4), v(BX - 4, 0.15, BZ + 6), v(BX - 10, 0.15, TZ)], 14, { seed: 139, speed: 0.35, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    // the works: the rotunda walls under the stairs, the mezzanine, the timeline gallery's side walls
    const mounts: Mount[] = [];
    // round the rotunda at floor level, clear of the stairs, the mezzanine and the door
    // the rotunda's own walls: the old room hung these works on the inside of the solid box
    k.box(RW, 12, 0.6, BX, 6, BZ + RD / 2 + 0.3, white); k.block(BX - RW / 2, BX + RW / 2, BZ + RD / 2, BZ + RD / 2 + 0.6);
    for (const [x0, x1] of [[BX - RW / 2, BX - 4.5], [BX + 4.5, BX + RW / 2]]) { k.box(x1 - x0, 12, 0.6, (x0 + x1) / 2, 6, BZ - RD / 2 - 0.3, white); k.block(x0, x1, BZ - RD / 2 - 0.6, BZ - RD / 2); }
    k.box(9, 7, 0.6, BX, 8.5, BZ - RD / 2 - 0.3, white);
    k.block(FX - 0.7, FX + 0.1, HZ0, BZ - BD / 2);
    for (const s of [-1, 1]) for (const x of (s > 0 ? [-12, -1, 6] : [-12, 8])) mounts.push({ position: v(BX + x, 3.0, BZ + s * (RD / 2 - 0.36)), rotation: s > 0 ? PI : 0, target: v(BX + x, 2.6, BZ + s * (RD / 2 - 3.8)), width: 3.4, height: 2.2, style: 'gilt', wash: true });
    for (const s of [-1, 1]) {
      mounts.push({ position: v(BX + RW / 2 - 0.36, 3.0, BZ + s * 6), rotation: -PI / 2, target: v(BX + RW / 2 - 3.6, 2.6, BZ + s * 6), width: 2.8, height: 2.0, style: 'gilt', wash: true });
      mounts.push({ position: v(BX - RW / 2 + 0.36, 3.0, BZ + s * 6), rotation: PI / 2, target: v(BX - RW / 2 + 3.6, 2.6, BZ + s * 6), width: 2.8, height: 2.0, style: 'gilt', wash: true });
    }
    // down the timeline gallery, and either side of the screens
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = TZ - 3 + i * 6; mounts.push({ position: v(BX + s * (RW / 2 - 0.36), 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX + s * (RW / 2 - 3.8), 2.6, z), width: 4.0, height: 2.5, style: 'black', wash: true }); }
    for (const s of [-1, 1]) mounts.push({ position: v(BX + s * 14.3, 3.4, TZ - 6.56), rotation: 0, target: v(BX + s * 14.3, 2.6, TZ - 3), width: 3.0, height: 2.2, style: 'black', wash: true });
    // three on the park wall across Fifth, facing the museum
    for (const z of [-18, 12, 42]) { k.box(0.3, 3, 4.6, 18.4, 2.3, z, dark); mounts.push({ position: v(18.2, 2.4, z), rotation: -PI / 2, target: v(14.6, 2, z), width: 4.0, height: 2.2, style: 'black', wash: false }); }

    /* life: the screens change, a class follows its guide, traffic on Fifth */
    k.crowd([v(BX + 12, 0.15, BZ + 5.6), v(BX - 6, 0.15, BZ + 6.4), v(BX - 12, 0.15, BZ - 6), v(BX - 4, 0.15, TZ + 2), v(BX + 10, 0.15, TZ - 2)], 12, { seed: 141, speed: 0.4, spread: 0.9, scale: 0.8, closed: true, animate: !ctx.reduced, colors: [0xf1c531, 0xe8a020, 0xf1c531] });
    const guide = new T.Group(); { const b = new T.Mesh(new T.CapsuleGeometry(0.2, 0.82, 3, 8), new T.MeshStandardMaterial({ color: 0x1f3f6a })); b.position.y = 0.76; const h = new T.Mesh(new T.SphereGeometry(0.125, 8, 6), new T.MeshStandardMaterial({ color: 0x8d5a3b })); h.position.y = 1.5; const flag = new T.Mesh(new T.BoxGeometry(0.02, 0.3, 0.4), new T.MeshBasicMaterial({ color: 0xff4a2a })); flag.position.set(0, 2.3, 0.2); const pole = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 1.2, 5), new T.MeshStandardMaterial({ color: 0x2a2a2a })); pole.position.set(0, 1.75, 0); guide.add(b, h, pole, flag); }
    k.add(guide);
    const tcars: { g: T.Group; dir: number; off: number }[] = [];
    for (let i = 0; i < 6; i++) { const g = new T.Group(), dir = i % 2 ? -1 : 1; const body = new T.Mesh(new T.BoxGeometry(1.8, 0.75, 4.4), new T.MeshStandardMaterial({ color: [0xf2b705, 0x1a1c20, 0xd8d4cc, 0x2a3f6a, 0xf2b705, 0x8a2a2a][i], metalness: 0.4, roughness: 0.4 })); body.position.y = 0.6; const cab = new T.Mesh(new T.BoxGeometry(1.6, 0.6, 2.2), new T.MeshStandardMaterial({ color: 0x22303a, metalness: 0.6, roughness: 0.2 })); cab.position.y = 1.28; g.add(body, cab); g.position.x = dir > 0 ? 4.5 : 9.5; k.add(g); tcars.push({ g, dir, off: i * 30 }); }
    const screenCol = new T.Color();
    if (!ctx.reduced) k.ticks.push((t) => {
      screenCol.setHSL((0.6 + 0.08 * Math.sin(t * 0.3)) % 1, 0.8, 0.45 + 0.1 * Math.sin(t * 1.3));
      (screen as T.MeshBasicMaterial).color.copy(screenCol);
      const a = t * 0.12; guide.position.set(BX + 2 + 9 * Math.cos(a), 0.15, BZ + 5.5 * Math.sin(a) * (Math.cos(a) > -0.2 ? 1 : 1)); guide.rotation.y = -a;
      for (const c of tcars) { const s = (t * 8 + c.off) % 160; c.g.position.z = c.dir > 0 ? -40 + s : 120 - s; c.g.rotation.y = c.dir > 0 ? 0 : PI; }
    });

    /* eggs */
    const src = { name: 'Museum of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Museum_of_the_City_of_New_York' };
    k.egg(v(BX, 4, TZ - 6), { id: 'founded-1923', title: 'It started at Gracie Mansion', year: '1923', text: 'Henry Collins Brown founded the museum in 1923 to preserve and present the history of the city and its people. It began in Gracie Mansion, and it ran out of room there.', clue: 'Stand in front of the wall of faces at the end of the gallery.', source: src }, { r: 3 });
    k.egg(v(FX + 4.1, 6.2, BZ), { id: 'dedicated-1932', title: 'Built on Fifth, 1929 to 1930', year: '1932', text: 'Joseph H. Freedlander designed the building on Fifth Avenue between 103rd and 104th Streets in red brick with marble trim. It went up in 1929 and 1930 and was dedicated on January 11, 1932.', clue: 'Read the name over the portico.', source: src }, { r: 3 });
    k.egg(statues[0], { id: 'hamilton-and-clinton', title: 'Two New Yorkers in the niches', text: 'The statues of Alexander Hamilton and DeWitt Clinton on the front are by the sculptor Adolph Alexander Weinman. They stand in niches, facing Central Park.', clue: 'Look for the two figures on the front, one either side of the door.', source: src }, { r: 2 });
    k.egg(v(BX, 18, BZ), { id: 'landmark-1967', title: 'A landmark in 1967', year: '1967', text: 'The building was designated a New York City landmark on January 24, 1967.', clue: 'Look up at the copper on the roof.', source: src }, { r: 3 });
    k.egg(v(BX + RW / 2 - 2, 3, TZ + 2), { id: 'the-pavilion', title: 'A glass room added', year: '2008', text: 'Ground was broken for an extension on August 2, 2006, and it was finished in February 2008: a glass pavilion by the Polshek Partnership that added 3,000 square feet of galleries on two levels.', clue: 'The newest part of the building is at the end of the timeline gallery.', source: src }, { r: 2.4 });

    return { mounts, spawn: v(2, 3, 18), look: v(BX + BW / 2, 10, BZ), eye: 3, bounds: [BX - RW / 2 + 0.8, 17, TZ - 6.2, 60], style: 'gilt', floorY: (x, z) => { const dx = x - (BX - 2), dz = z - BZ; const d = Math.hypot(dx, dz); if (d > 6.6 && d < 9.4 && dx < 0.5) { const a = Math.atan2(Math.abs(dz), dx); const t = Math.min(1, Math.max(0, (a - PI / 2) / (PI * 0.5))); return 0.2 + t * 5.4; } if (Math.abs(dz) < 3 && x < BX + RW / 2 - 4 && x > BX - RW / 2 && x < BX - 2) return 5.8; return 0; } };
  },
};

export const dakota2: RoomDef = {
  id: 'dakota',
  name: 'The courtyard and the mosaic',
  area: 'THE DAKOTA',
  mood: 'December dusk',
  color: '#c8b090',
  description: 'Seventy second and Central Park West at dusk with the first snow coming down: the gabled fortress of an apartment house, the carriage arch off 72nd Street into its courtyard and its two fountains, and across the avenue the round mosaic in the park with its one word, flowers, and somebody playing. The works hang round the courtyard, in the arch, and on the park wall.',
  signatures: 'The sandstone and brick block with its gables, dormers and iron railings, the deep arched carriage entrance with the sentry box, the square inner courtyard with two fountains, the teardrop park across the avenue with the black and white mosaic ringed with flowers.',
  build(k, ctx) {
    k.sky({ top: 0x3a4a86, horizon: 0xf0b890, ground: 0x2a2a30, fog: 0.0024, sun: { az: 4.75, el: 0.06, color: 0xffb070, size: 20 }, haze: 0.4, stars: 120, env: 0.8 });
    k.hemi(0xffdcc0, 0x2a2c34, 0.7);
    k.sun(0xffc08a, 1.8, -70, 16, -20, true, 90);
    const stone = k.pbr('dkStone', X.ashlar(0xb8a888, 206, 3), 0.22),
      brick = k.pbr('dkBrick', X.brick(0x8a5a48, 207), 0.28),
      slate = k.pbr('dkSlate', X.steel(0x3a3a40, false, 208), 0.4, { metalness: 0.2, roughness: 0.8 }),
      iron = k.flat(0x1a1c20, 0.7, 0.45),
      cobble = k.pbr('dkCobble', X.cobble(0x6f6c68, 96), 0.9),
      lawn = k.pbr('dkLawn', X.grass(0x3a5a2a, 97), 0.06),
      pave = k.pbr('dkPave', X.pavers(0x8e8b84, 98), 0.4),
      black = k.flat(0x141416, 0, 0.5), white = k.flat(0xf4f0e8, 0, 0.5),
      glass = k.glass(0xffe0b0, 0.3, 0.1), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }),
      warm = k.glow(0xffd8a0);
    // the avenue, the park across it, the block
    street(k, { w: 24, len: 160, z: 0, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, lawn);
    k.rail(18, 0, 160, iron, 1.0, 'z', 2.4);
    k.block(17.6, 18.4, -80, -6); k.block(17.6, 18.4, 6, 80);
    const rnd = X.mulberry(72);
    for (let i = 0; i < 40; i++) { const x = 24 + rnd() * 80, z = -90 + rnd() * 180; if (Math.hypot(x - 34, z) < 14) continue; k.tree(x, 0, z, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i }); }
    for (const z of [-60, -20, 20, 60]) for (const s of [-1, 1]) k.lamp(s * 13.5, z, 6.2, iron, 0xffd9a8, 30);
    // the building: a square block around a courtyard, gables and dormers, the carriage arch on 72nd
    const BX = -34, BZ = 0, BW = 44, BH = 30;
    for (const [x, z, w, d] of [[BX, BZ - BW / 2 + 5, BW, 10], [BX - 12.25, BZ + BW / 2 - 5, 19.5, 10], [BX + 12.25, BZ + BW / 2 - 5, 19.5, 10], [BX - BW / 2 + 5, BZ, 10, BW - 20], [BX + BW / 2 - 5, BZ, 10, BW - 20]]) { k.box(w, BH, d, x, BH / 2, z, brick); k.box(w + 0.4, 3, d + 0.4, x, 1.5, z, stone); k.box(w + 0.4, 0.8, d + 0.4, x, BH - 0.4, z, stone); }
    for (let i = 0; i < 5; i++) { const z = BZ - 16 + i * 8; const g = k.mesh(new T.ConeGeometry(4, 6, 4), slate, BX + BW / 2 - 5, BH + 3, z); g.rotation.y = PI / 4; k.box(1.2, 3, 1.2, BX + BW / 2 - 2, BH + 1.5, z + 3, brick); }
    for (let f = 0; f < 7; f++) for (let i = 0; i < 9; i++) { const y = 4 + f * 3.6, z = BZ - 18 + i * 4.5; k.box(0.16, 2.2, 1.4, BX + BW / 2 + 0.02, y, z, stone); k.box(0.06, 1.9, 1.1, BX + BW / 2 + 0.1, y, z, rnd() > 0.6 ? warm : glass); if (f % 2 === 0) { k.box(0.6, 0.06, 1.6, BX + BW / 2 + 0.4, y - 1.1, z, iron); for (let b = -0.7; b <= 0.7; b += 0.2) k.box(0.03, 0.6, 0.03, BX + BW / 2 + 0.7, y - 0.8, z + b, iron); } }
    k.block(BX - BW / 2 - 0.5, BX + BW / 2 + 0.5, BZ - BW / 2 - 0.5, BZ - BW / 2 + 10.5); k.block(BX - BW / 2 - 0.5, BX - 2.4, BZ + BW / 2 - 10.5, BZ + BW / 2 + 0.5); k.block(BX + 2.4, BX + BW / 2 + 0.5, BZ + BW / 2 - 10.5, BZ + BW / 2 + 0.5);
    /* the old north wing was one solid box straight through the arch: nobody could walk into the courtyard */
    k.box(5, BH - 7, 10, BX, 7 + (BH - 7) / 2, BZ + BW / 2 - 5, brick); k.box(5.4, 0.8, 10.4, BX, BH - 0.4, BZ + BW / 2 - 5, stone);
    k.block(BX - BW / 2 - 0.5, BX - BW / 2 + 10.5, BZ - BW / 2, BZ + BW / 2); k.block(BX + BW / 2 - 10.5, BX + BW / 2 + 0.5, BZ - BW / 2, BZ + BW / 2);
    const AZ = BZ + BW / 2 - 5;
    k.arch(5, 7, 10, BX, 0, AZ, stone, false, 0.85).rotation.y = 0;
    k.box(1.6, 2.4, 1.6, BX + 3.6, 1.2, AZ + 5.4, stone); k.block(BX + 2.8, BX + 4.4, AZ + 4.6, AZ + 6.2); k.box(1.4, 1.6, 0.1, BX + 3.6, 1.5, AZ + 6.2, glass); k.point(BX + 3.6, 2.2, AZ + 6.4, 0xffd8a0, 8, 5);
    k.box(6, 0.3, 12, BX, 0.05, AZ, cobble);
    k.sign('THE DAKOTA  ·  1884', 4.6, 0.6, BX, 7.6, AZ + 5.05, 'transparent', '#e8dcc0', 70, 0);
    for (let i = 0; i < 4; i++) k.point(BX, 5.5, AZ - 4 + i * 2.8, 0xffd8a0, 10, 6);
    // the courtyard: cobbles, two fountains, lamps, the doors to the four corner entrances
    const CW = BW - 20;
    k.box(CW, 0.3, CW, BX, 0.05, BZ, cobble);
    for (const dz of [-5, 5]) { k.mesh(new T.CylinderGeometry(2.4, 2.6, 0.7, 24), stone, BX, 0.35, BZ + dz); k.mesh(new T.CylinderGeometry(2.1, 2.1, 0.2, 24), waterM, BX, 0.75, BZ + dz); const j = k.mesh(new T.CylinderGeometry(0.06, 0.16, 2.2, 6), waterM, BX, 1.8, BZ + dz, true); if (!ctx.reduced) k.ticks.push((t) => { j.scale.y = 0.8 + 0.3 * Math.sin(t * 1.6 + dz); }); k.keepOut.push({ x: BX, z: BZ + dz, r: 2.8 }); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.lamp(BX + sx * 7, BZ + sz * 7, 3.6, iron, 0xffd9a8, 20); k.arch(2, 3.4, 0.6, BX + sx * (CW / 2 - 0.1), 0, BZ + sz * 6, stone, false, 0.8).rotation.y = PI / 2; }
    for (let f = 0; f < 7; f++) for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const y = 4 + f * 3.6, z = BZ - 8 + i * 4; k.box(0.16, 2.2, 1.4, BX + s * (CW / 2 + 0.02), y, z, stone); k.box(0.06, 1.9, 1.1, BX + s * (CW / 2 - 0.05), y, z, rnd() > 0.5 ? warm : glass); }
    k.point(BX, 8, BZ, 0xffd8a0, 30, 20);
    // the mosaic across the avenue: the round of black and white with the word, the ring of flowers, the benches
    const MX = 34, MZ = 0;
    k.mesh(new T.CylinderGeometry(6, 6.2, 0.3, 48), pave, MX, 0.1, MZ);
    k.mesh(new T.CylinderGeometry(2.6, 2.6, 0.02, 48), white, MX, 0.27, MZ);
    k.mesh(new T.RingGeometry(2.6, 3.0, 48), black, MX, 0.28, MZ).rotation.x = -PI / 2;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.mesh(new T.RingGeometry(0.4, 0.6, 12), black, MX + Math.cos(a) * 2.1, 0.285, MZ + Math.sin(a) * 2.1).rotation.x = -PI / 2; }
    /* the word lies in the pavement; the old room rotated whatever mesh was built last, which was not the sign */
    const word = k.sign('IMAGINE', 2.4, 0.5, MX, 0.3, MZ, 'transparent', '#141416', 70, 0); word.rotation.set(-PI / 2, 0, 0);
    for (let i = 0; i < 30; i++) { const a = (i / 30) * PI * 2; k.sphere(0.14, MX + Math.cos(a) * 2.8, 0.36, MZ + Math.sin(a) * 2.8, [k.flat(0xe83a3a, 0, 0.7), k.flat(0xf1c531, 0, 0.7), k.flat(0xf4f0e8, 0, 0.7)][i % 3], 6); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; k.bench(MX + Math.cos(a) * 8, MZ + Math.sin(a) * 8, -a + PI / 2, k.pbr('dkBench', X.planks(0x6a5a45, 3, 209), 1.2), iron, 2.2); }
    k.keepOut.push({ x: MX, z: MZ, r: 3.4 });
    k.box(16, 0.3, 0.1, MX - 8 - 4, 0.05, MZ, pave); k.box(6, 0.3, 40, MX - 14, 0.05, MZ, pave);
    k.crowd([v(MX - 14, 0, -30), v(MX - 14, 0, 30)], 12, { seed: 82, speed: 0.5, spread: 1.6, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x151517, 0xd8d0c0] });
    k.crowd([v(-6, 0, -70), v(-6, 0, 70)], 20, { seed: 83, speed: 1.0, spread: 2.4, animate: !ctx.reduced });
    k.censusWall({ x: BX, y: 3.6, z: BZ - CW / 2 + 0.36, rotY: 0, cols: 22, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2200, 88), pieces: ctx.all, backing: iron });
    // the works: the courtyard walls at ground level, the carriage arch, the park benches' backs face the mosaic
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 9 + i * 6; mounts.push({ position: v(BX + s * (CW / 2 - 0.34), 2.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX + s * (CW / 2 - 3.6), 2, z), width: 3.2, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = BX - 9 + i * 6; if (Math.abs(x - BX) < 2) continue; mounts.push({ position: v(x, 2.2, BZ + CW / 2 - 0.34), rotation: PI, target: v(x, 2, BZ), width: 3.2, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = AZ - 3 + i * 3; for (const s of [-1, 1]) mounts.push({ position: v(BX + s * 2.42, 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 2, z), width: 1.8, height: 1.4, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = -60 + i * 40; if (Math.abs(z) < 12) continue; k.box(0.3, 3, 4.6, 18.4, 2.3, z, iron); mounts.push({ position: v(18.2, 2.4, z), rotation: -PI / 2, target: v(14.6, 2, z), width: 4.0, height: 2.2, style: 'black', wash: false }); }

    /* 72nd Street along the north front, where the carriage arch opens */
    const SZ = BZ + BW / 2;
    k.box(48, 0.28, 5, -36, 0, SZ + 2.5, pave);
    k.box(48, 0.3, 12, -36, -0.15, SZ + 11, k.pbr('dkAsphalt', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }));
    k.box(48, 0.28, 5, -36, 0, SZ + 19.5, pave);
    for (let x = BX - 20; x < -24; x += 9.4) { const hh = 14 + ((x * 7) % 9 + 9) % 9; k.box(9, hh, 12, x, hh / 2, SZ + 28, brick); k.box(8.4, 3, 0.1, x, 1.7, SZ + 21.95, warm); }
    k.block(BX - 30, -21, SZ + 21.9, SZ + 40);
    for (const x of [BX - 12, BX + 12]) k.lamp(x, SZ + 4.6, 4.8, iron, 0xffd9a8, 24);

    /* the first snow, the doorman, somebody playing at the mosaic, flowers left on it, traffic on the avenue */
    const NS = 700, flakes = k.instances(new T.IcosahedronGeometry(0.035, 0), new T.MeshBasicMaterial({ color: 0xf4f6fa }), Array.from({ length: NS }, () => new T.Matrix4()));
    flakes.frustumCulled = false;
    const fr = X.mulberry(211), fb: number[] = [];
    for (let i = 0; i < NS; i++) fb.push(-50 + fr() * 100, fr() * 18, -40 + fr() * 90, fr() * 6.3);
    const snow = (t: number) => { const m = new T.Matrix4(); for (let i = 0; i < NS; i++) { const x = fb[i * 4], y0 = fb[i * 4 + 1], z = fb[i * 4 + 2], ph = fb[i * 4 + 3]; const y = ((y0 - t * 0.9) % 18 + 18) % 18; m.makeTranslation(x + 0.4 * Math.sin(t * 0.7 + ph), y, z + 0.3 * Math.cos(t * 0.5 + ph)); flakes.setMatrixAt(i, m); } flakes.instanceMatrix.needsUpdate = true; };
    snow(0);
    const person = (coat: number, skin = 0xc8a284) => { const g = new T.Group(); const b = new T.Mesh(new T.CapsuleGeometry(0.2, 0.82, 3, 8), new T.MeshStandardMaterial({ color: coat, roughness: 0.85 })); b.position.y = 0.61; const h = new T.Mesh(new T.SphereGeometry(0.125, 8, 6), new T.MeshStandardMaterial({ color: skin, roughness: 0.7 })); h.position.y = 1.35; g.add(b, h); return g; };
    const doorman = person(0x1f2a3a); doorman.position.set(BX + 2.2, 0, AZ + 5.6); k.add(doorman);
    const busker = person(0x5a3a2a); busker.position.set(MX - 4.6, 0, MZ + 1.2); busker.rotation.y = PI / 2 + 0.3; k.add(busker);
    const guitar = new T.Group(); { const body = new T.Mesh(new T.CylinderGeometry(0.22, 0.26, 0.1, 12), new T.MeshStandardMaterial({ color: 0x9a5a2a })); body.rotation.x = PI / 2; const neck = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.7), new T.MeshStandardMaterial({ color: 0x3a2a1a })); neck.position.set(0.35, 0, 0); neck.rotation.y = PI / 2; guitar.add(body, neck); }
    guitar.position.set(0.1, 0.95, 0.24); busker.add(guitar);
    const strum = new T.Mesh(new T.BoxGeometry(0.08, 0.36, 0.08), new T.MeshStandardMaterial({ color: 0x5a3a2a })); strum.position.set(-0.05, 1.0, 0.3); busker.add(strum);
    for (let i = 0; i < 12; i++) { const a = 0.3 + i * 0.5; k.sphere(0.12, MX + Math.cos(a) * 1.4, 0.34, MZ + Math.sin(a) * 1.4, [k.flat(0xe83a3a, 0, 0.7), k.flat(0xf4f0e8, 0, 0.7), k.flat(0xf1c531, 0, 0.7)][i % 3], 6); }
    for (let i = 0; i < 5; i++) { const a = 2.6 + i * 0.35; const p = person([0x24262c, 0x8a3a3a, 0x151517, 0xd8d0c0, 0x33477f][i]); p.position.set(MX + Math.cos(a) * 4.6, 0, MZ + Math.sin(a) * 4.6); p.rotation.y = -a - PI / 2; k.add(p); }
    const acars: { g: T.Group; dir: number; off: number }[] = [];
    for (let i = 0; i < 6; i++) { const g = new T.Group(), dir = i % 2 ? -1 : 1; const body = new T.Mesh(new T.BoxGeometry(1.8, 0.75, 4.4), new T.MeshStandardMaterial({ color: [0xf2b705, 0x1a1c20, 0xd8d4cc, 0xf2b705, 0x2a3f6a, 0x8a2a2a][i], metalness: 0.4, roughness: 0.4 })); body.position.y = 0.6; const cab = new T.Mesh(new T.BoxGeometry(1.6, 0.6, 2.2), new T.MeshStandardMaterial({ color: 0x22303a, metalness: 0.6, roughness: 0.2 })); cab.position.y = 1.28; const tl = new T.Mesh(new T.BoxGeometry(1.2, 0.18, 0.06), new T.MeshBasicMaterial({ color: 0xff3a2a })); tl.position.set(0, 0.7, -2.22); g.add(body, cab, tl); g.position.x = dir > 0 ? 3.5 : -3.5; k.add(g); acars.push({ g, dir, off: i * 28 }); }
    if (!ctx.reduced) k.ticks.push((t) => {
      snow(t);
      strum.rotation.z = 0.5 * Math.sin(t * 7); busker.rotation.z = 0.03 * Math.sin(t * 3.5);
      doorman.rotation.y = 0.6 * Math.sin(t * 0.2);
      for (const c of acars) { const s = (t * 9 + c.off) % 170; c.g.position.z = c.dir > 0 ? -85 + s : 85 - s; c.g.rotation.y = c.dir > 0 ? 0 : PI; }
    });

    /* eggs */
    const dsrc = { name: 'The Dakota, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Dakota' };
    k.egg(v(BX, 7.6, AZ + 5.1), { id: 'built-1884', title: 'A palace in parts', year: '1884', text: 'Henry Janeway Hardenbergh designed the Dakota in a German Renaissance style for Edward Cabot Clark, head of the Singer Manufacturing Company, and it was built between 1880 and 1884. Clark believed there were many who would like to occupy a portion of a great building.', clue: 'Read the stone over the carriage arch.', source: dsrc }, { r: 3 });
    k.egg(v(BX + BW / 2 - 5, BH + 3, BZ), { id: 'the-name', title: 'Why the Dakota', text: 'The building was being called the Dakota by June 1882. The popular story is that it stood so far out it might as well have been in Dakota Territory, but no paper of the time said so; the likelier reason is that Clark was fond of the names of western states and territories.', clue: 'Look up at the gables along the avenue.', source: dsrc }, { r: 3.4 });
    k.egg(v(BX + 3.6, 1.8, AZ + 5.4), { id: 'porte-cochere', title: 'A door for carriages', text: 'The main entrance on 72nd Street is a double height archway built as a porte cochere, so a horse and carriage could drive through into the courtyard, with a security booth beside it.', clue: 'The little stone box by the arch has had someone in it since the carriages.', source: dsrc }, { r: 1.8 });
    k.egg(v(BX, 1.2, BZ + 5), { id: 'landmark-1969', title: 'A landmark twice', year: '1969', text: 'The Dakota was designated a New York City landmark on February 11, 1969, and a National Historic Landmark on December 8, 1976.', clue: 'Stand by the courtyard fountains.', source: dsrc }, { r: 2.4 });
    k.egg(v(BX, 2, AZ + 4.6), { id: 'december-8', title: 'The eighth of December', year: '1980', text: 'John Lennon lived at the Dakota. He was killed outside the building, at the main entrance on 72nd Street, on December 8, 1980.', clue: 'The arch on 72nd Street.', source: dsrc }, { r: 2.4 });
    k.egg(v(MX, 0.6, MZ), { id: 'strawberry-fields', title: 'Imagine', year: '1985', text: 'Strawberry Fields, two and a half acres of the park across the street, was dedicated on October 9, 1985, what would have been Lennon\'s 45th birthday. Yoko Ono gave over a million dollars for the landscaping and its upkeep, and Bruce Kelly designed it as a living memorial around a round mosaic that reads Imagine. Musicians play there on weekends, and people come with flowers on October 9 and December 8.', clue: 'Cross the avenue to the round of black and white.', source: { name: 'Strawberry Fields (memorial), Wikipedia', url: 'https://en.wikipedia.org/wiki/Strawberry_Fields_(memorial)' } }, { r: 2.4 });

    return { mounts, spawn: v(14, 3, 44), look: v(BX + 6, 18, BZ + 6), eye: 3, bounds: [BX - CW / 2 + 0.6, 60, -80, 80], style: 'gilt' };
  },
};
