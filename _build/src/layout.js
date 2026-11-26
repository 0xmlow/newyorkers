// THE GARDEN: the plan, in metres, at real size.
// The arena floor is y = 0. Seventh Avenue is +x (east), Eighth Avenue -x, 33rd Street -z (north), 31st Street +z.
// The real floor sits 45 feet (13.7 m) over the street with the trains of Penn Station under it, so the avenue is y = -13.7.
// The roof spans 404 feet (123 m): 48 cables from a compression ring on the drum to a tension ring over centre court.
export const STREET = -13.72;
export const DRUM_IN = 63.6, DRUM_OUT = 66.2, ROOF_RIM = 34, HUB_R = 4.2;
// the event floor is a stadium shape: a straight 32 m between two 15 m half circles, 62 x 30 m (an NHL rink is 61 x 26)
export const FL = 16, FR = 15;
export function sd(x, z) { const ax = Math.max(Math.abs(x) - FL, 0); return Math.hypot(ax, z) - FR; }
// the outward normal of the stadium shape at a point, and the point on the shape at distance d along a perimeter parameter
export function stadiumPoint(s, d) { // s in [0,1) round the perimeter, starting at +x end, counter clockwise seen from above
  const R = FR + d, L = 2 * FL, P = 2 * L + 2 * Math.PI * R; let u = s * P;
  const arc = Math.PI * R;
  if (u < arc / 2) { const a = u / R; return [FL + R * Math.cos(a), -R * Math.sin(a), Math.cos(a), -Math.sin(a)]; } // east end, top half (north is -z)
  u -= arc / 2; if (u < L) return [FL - u, -R, 0, -1];
  u -= L; if (u < arc) { const a = Math.PI / 2 + u / R; return [-FL + R * Math.cos(a), -R * Math.sin(a), Math.cos(a), -Math.sin(a)]; }
  u -= arc; if (u < L) return [-FL + u, R, 0, 1];
  u -= L; const a = 1.5 * Math.PI + u / R; return [FL + R * Math.cos(a), -R * Math.sin(a), Math.cos(a), -Math.sin(a)];
}
export const perimeter = (d) => 4 * FL + 2 * Math.PI * (FR + d);
// the seating bowl: rows by distance out from the floor's edge
export const LOW = { d0: 1.8, rows: 18, depth: 0.74, rise: 0.42 };     // lower bowl, to 7.6 m
export const CLUB = { d0: LOW.d0 + LOW.rows * LOW.depth, d1: 0, y0: 0, y1: 0 };
CLUB.y0 = LOW.rows * LOW.rise; CLUB.d1 = CLUB.d0 + 1.6; CLUB.y1 = CLUB.y0 + 2.2;  // the suite level: glass and the LED ribbon
export const UP = { d0: CLUB.d1, rows: 14, depth: 0.74, rise: 0.66, y0: CLUB.y1 };  // upper bowl, to about 19 m
export const BACK = UP.d0 + UP.rows * UP.depth;  // the back wall of the bowl, the inner wall of the concourse
export const BACK_TOP = UP.y0 + UP.rows * UP.rise + 1.2;
export function rowAt(d) { // which row and its tread height, or null
  if (d >= LOW.d0 && d < CLUB.d0) { const r = Math.floor((d - LOW.d0) / LOW.depth); return { r, y: (r + 1) * LOW.rise, up: false }; }
  if (d >= UP.d0 && d < BACK) { const r = Math.floor((d - UP.d0) / UP.depth); return { r, y: UP.y0 + (r + 1) * UP.rise, up: true }; }
  return null;
}
// the tunnels (vomitories) from the concourse down to the floor: two on each long side, one at each end
export const TUNNELS = [
  { x: -9, z: 0, nx: 0, nz: -1 }, { x: 9, z: 0, nx: 0, nz: -1 }, { x: -9, z: 0, nx: 0, nz: 1 }, { x: 9, z: 0, nx: 0, nz: 1 },
  { x: 0, z: 0, nx: 1, nz: 0 }, { x: 0, z: 0, nx: -1, nz: 0 },
];
export const TUN_W = 2.4, TUN_H = 3.4;
export function inTunnel(x, z) {
  for (const t of TUNNELS) {
    if (t.nz) { if (Math.abs(x - t.x) < TUN_W && z * t.nz > FR && z * t.nz < FR + BACK + 0.6) return t; }
    else if (Math.abs(z) < TUN_W && x * t.nx > FL + FR && x * t.nx < FL + FR + BACK + 0.6) return t;
  }
  return null;
}
// the lifts to the bridges: one in the concourse on each long side
export const LIFTS = [{ x: 0, z: -52, up: 24 }, { x: 0, z: 52, up: 24 }];
export const BRIDGE = { y: 24, z: 35, half: 35.5, w: 3.35 };  // the two hanging bridges, 233 x 22 feet, over the upper bowl
// the way in from Seventh Avenue: escalators climbing the 45 feet from the street to the concourse
export const ENTRY = { x0: DRUM_IN - 0.5, x1: 92, w: 6.5 };
export function entryY(x) { const t = (x - 68) / (90 - 68); return t <= 0 ? 0 : t >= 1 ? STREET : STREET * t; }  // straight, like the escalators

// every surface you can stand on, highest first wins if you can step up to it
export function surfaces(x, z, out) {
  out.length = 0; const r = Math.hypot(x, z), d = sd(x, z);
  if (d < LOW.d0) out.push(0);                                  // the floor and the courtside
  const t = inTunnel(x, z); if (t) out.push(0);
  if (d > BACK && r < DRUM_IN - 0.4) out.push(0);               // the concourse
  const row = rowAt(d); if (row && !(t && row.y < TUN_H + 0.3)) out.push(row.y);
  if (Math.abs(z) < ENTRY.w && x > ENTRY.x0 && x < ENTRY.x1) out.push(entryY(x));
  if (x >= 88 && x < 150 && Math.abs(z) < 80) out.push(STREET);  // Seventh Avenue, sidewalk and street
  // up top: the catwalks from the lifts and the bridges
  for (const L of LIFTS) if (Math.abs(x - L.x) < 2.4 && z * Math.sign(L.z) > BRIDGE.z - 1 && z * Math.sign(L.z) < Math.abs(L.z) + 2.4) out.push(BRIDGE.y);
  if (Math.abs(x) < BRIDGE.half && Math.abs(Math.abs(z) - BRIDGE.z) < BRIDGE.w) out.push(BRIDGE.y);
  return out;
}
export function zoneOf(p) {
  const d = sd(p.x, p.z);
  if (p.y > 20) return 'bridges';
  if (p.x > 88) return 'avenue';
  if (p.x > DRUM_IN - 1 && Math.abs(p.z) < ENTRY.w) return 'escalators';
  if (d > BACK) return 'concourse';
  if (d < LOW.d0 && p.y < 1) return 'floor';
  return 'bowl';
}
