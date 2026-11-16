// THE LIGHTINGS, room by room. The city switches itself on for December: the tree at Rockefeller Center and the menorahs at
// both Grand Army Plazas, with the rooms in between. Every person has an eye flower for a head. The cast are Tripo GLBs from
// GPT Image 2.6 concepts on Krea, plus the house models (ON LOCATION, THE MARKS, the museum) and Poly Haven CC0 props. One
// trick per room, three or four eggs, and one shared night: the tree you light and the night you choose follow you (LT).
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { W, D, H_IN, PORTAL } from './rooms.js';
import { floorFinish } from './real.js';
import { crowdBody, crowdCast } from './crowd.js';

const PI = Math.PI;
const INK = ['#f5c542', '#ff4fa3', '#22d3ee', '#3b82f6', '#ffffff', '#ff7a1a'];
const DZ1 = 2, DZ2 = 5.6, DH = 3.6;

// who the extras are in each room (crowd.js POOLS): the night crowd in Midtown, walkers in Brooklyn
const CROWD_CAST = { fifth: 'night', channel: 'night', rink: 'walkers', tree: 'night', top: 'dressy', menorah: 'walkers', market: 'walkers', brooklyn: 'walkers', window: 'walkers', dyker: 'walkers' };
export function buildRoom(c, r) {
  const { THREE, scene } = c;
  crowdCast(CROWD_CAST[r.id]);
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;
  const mats = matsFor(c, r);
  const HT = r.wallH || (r.outdoor ? (r.low ? 4 : 10) : H_IN);

  if (!r.noFloor) g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if ((r.ceil || r.ceilImg) && !r.outdoor) g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, (r.ceilH || H_IN) + 0.05, 0));
  if (r.outdoor) skyDome(c, g, r);

  const pw = PORTAL.w, px1 = (W - pw) / 2, px2 = (W + pw) / 2, NH = r.low ? 1.1 : HT;
  g.add(c.slab(W, HT, 0.24, mats.wall, W / 2, HT / 2, D / 2 + 0.12)); c.wall(X(0), D / 2, X(W), D / 2);
  // the tree is wider than any doorway: its room has no north wall at all, only the line you may not cross
  if (!r.openNorth) {
    g.add(c.slab(px1, NH, 0.24, mats.wall, px1 / 2, NH / 2, -D / 2 - 0.12));
    g.add(c.slab(px1, NH, 0.24, mats.wall, px2 + px1 / 2, NH / 2, -D / 2 - 0.12));
  }
  c.wall(X(0), -D / 2, X(W), -D / 2);
  if (!r.outdoor) { const ph = Math.min(PORTAL.h, (r.ceilH || H_IN) - 0.5); g.add(c.slab(pw, H_IN - ph, 0.24, mats.wall, W / 2, ph + (H_IN - ph) / 2, -D / 2 - 0.12)); }
  const sideWall = (x, door) => {
    if (!door) { g.add(c.slab(0.24, HT, D, mats.wall, x, HT / 2, 0)); c.wall(X(x), -D / 2, X(x), D / 2); return; }
    const a = DZ1 + D / 2, b = D / 2 - DZ2;
    g.add(c.slab(0.24, HT, a, mats.wall, x, HT / 2, -D / 2 + a / 2));
    g.add(c.slab(0.24, HT, b, mats.wall, x, HT / 2, D / 2 - b / 2));
    g.add(c.slab(0.24, HT - DH, DZ2 - DZ1, mats.wall, x, DH + (HT - DH) / 2, (DZ1 + DZ2) / 2));
    c.wall(X(x), -D / 2, X(x), DZ1); c.wall(X(x), DZ2, X(x), D / 2);
    const fr = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 });
    for (const z of [DZ1, DZ2]) g.add(c.slab(0.36, DH, 0.14, fr, x, DH / 2, z));
    g.add(c.slab(0.36, 0.16, DZ2 - DZ1 + 0.14, fr, x, DH + 0.08, (DZ1 + DZ2) / 2));
  };
  sideWall(0, r.i > 0);
  if (r.last) sideWall(W, false);
  else sideWall(W - 0.25, true);   // the room's own face on the shared wall, so the next set's wallpaper does not show through
  const ds = { w: 2.6, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', border: '#f5c542' };
  if (r.i > 0) { const s = c.sign(`< ${r.prev}`, ds); s.position.set(0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = PI / 2; g.add(s); }
  if (r.next) { const s = c.sign(`${r.next} >`, ds); s.position.set(W - 0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = -PI / 2; g.add(s); }

  if (!r.noPlate) c.plate(r);   // the window room builds its own street from the plate image instead

  const slots = (SLOTS[r.id] || slotsDefault)(r);
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, s.honor ? 'gilt' : r.frame, g); });

  slate(c, r, g);
  if (!r.noRope) rope(c, r, g, X);
  else if (r.edge) c.wall(X(0), -D / 2 + 1.2, X(W), -D / 2 + 1.2);   // an unmarked edge, so nobody walks into the photograph
  floorDecals(c, r, g);
  if (r.snow) snowfall(c, r, g, c.MOBILE ? Math.round(r.snow * 0.5) : r.snow);
  if (r.rp) { r.treeZ = r.rp.dz + RP.TZ; r.treeY = r.rp.dy || 0; }   // the star lift (v4) is built before the plaza, so it needs to know now
  dressRoom(c, r, g, X);   // v2: facades, canopies, lamps, firs, snowbanks, props (dress.part.js)
  if (r.rp) realPlaza(c, r, g, X, r.rp);   // round six: the real Rockefeller Plaza at 1:1 (plaza.part.js)
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  (PROPS[r.id] || []).forEach((q) => prop(c, r, g, X, ...q));
  dressing(c, r, g, X);
}

