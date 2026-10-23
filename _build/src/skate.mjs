// Deterministic movement kernel, independent of rendering and gallery effects.
// The board owns its own x, z, yaw and height while skating; main.js copies them to the player each frame.
// A world is { surface(x, z): height of the rideable terrain under that point (kickers, banks, quarters, rollers),
// solid(x, z): the top of anything sheer you can land on but not roll into (ledges, decks, the back of a kicker),
// rails: [{x1, z1, x2, z2, y1, y2, arch, name}], gaps: [{from: {x, z, r}, to: {x, z, r}, name, bonus}],
// collide(x, z) -> [x, z] }. Every part is optional, so the kernel still runs on a bare floor
// (skate.test.mjs does exactly that first).
export const GRAV = 18, VMAX = 11, VRAMP = 14;
const ZERO = () => 0, FLAT = { surface: ZERO, solid: ZERO, rails: [], gaps: [] };
export function createSkate() {
  return { sinPrev: 0, qair: false, active: false, x: 0, z: 0, yaw: 0, v: 0, y: 0, height: 0, vy: 0, air: false, rampVy: 0, steering: 0, score: 0, pending: 0, tricks: [], busy: 0,
    message: '', elapsed: 0, grind: null, grindT: 0, takeoff: null, wiped: false, events: [], spin: 0, bail: 0, fakie: false, slope: 0 };
}
export function ollie(s) {
  if (s.air || s.bail > 0) return false;
  if (s.grind) { s.grind = null; s.air = true; s.vy = 5.4; s.tricks.push('OLLIE OUT'); s.pending += 100; s.takeoff = { x: s.x, z: s.z }; return true; }
  s.air = true; s.vy = 6.2 + Math.max(0, s.rampVy); s.pending += 100; s.tricks.push('OLLIE'); s.busy = 0; s.takeoff = { x: s.x, z: s.z };
  return true;
}
export function trick(s, index) {
  if (!s.air || s.grind || s.height < 0.2 || s.busy > 0) return false;
  s.busy = 0.28; s.pending += 250;
  s.tricks.push(['KICKFLIP', 'HEELFLIP', 'NOSEGRAB'][index]);
  return true;
}
// the height of a rail at u (0 at its start, 1 at its end): flat, sloping down, or an arch
export const railY = (r, u) => { const a = r.y1 ?? r.y ?? 0, b = r.y2 ?? a; return a + (b - a) * u + (r.arch || 0) * Math.sin(Math.PI * Math.max(0, Math.min(1, u))); };
const inside = (c, x, z) => c && Math.hypot(x - c.x, z - c.z) <= c.r;
function land(s, w, S) {
  s.y = S; s.vy = 0; s.air = false; s.rampVy = 0;
  let gap = null;
  const turn = Math.abs(s.spin); s.spin = 0;
  if (s.tricks.length && turn > 1.2) { const deg = turn > 5.2 ? 540 : turn > 2.6 ? 360 : 180; s.tricks.push(deg === 540 ? 'FIVE FORTY' : deg === 360 ? 'THREE SIXTY' : 'ONE EIGHTY'); s.pending += deg * 0.8; }
  if (s.takeoff && s.tricks.length && !s.busy && !s.wiped) for (const g of w.gaps || []) if (inside(g.from, s.takeoff.x, s.takeoff.z) && inside(g.to, s.x, s.z)) { gap = g; s.tricks.push(g.name || 'GAP'); s.pending += g.bonus || 500; break; }
  const points = Math.round(s.pending * s.tricks.length), grind = s.grindT;
  if (s.busy > 0) { s.message = 'BAIL, finish the trick before landing'; s.events.push({ type: 'bail' }); s.bail = 0.9; s.v *= 0.2; }
  else if (s.wiped || (!s.tricks.length && s.pending)) { s.message = 'BAIL, the wall took it'; s.events.push({ type: 'bail' }); s.bail = 0.9; s.v *= 0.2; }
  else if (s.tricks.length) { s.score += points; s.message = `${s.tricks.join(' + ')}  +${points}`; s.events.push({ type: 'land', points, tricks: s.tricks.slice(), gap: gap && gap.name, grind }); }
  s.pending = 0; s.tricks = []; s.busy = 0; s.takeoff = null; s.wiped = false; s.grindT = 0;
}
function tryGrind(s, w) {
  for (const r of w.rails || []) {
    const ex = r.x2 - r.x1, ez = r.z2 - r.z1, L = Math.hypot(ex, ez), ux = ex / L, uz = ez / L;
    const u = ((s.x - r.x1) * ux + (s.z - r.z1) * uz) / L; if (u < 0.02 || u > 0.98) continue;
    const ry = railY(r, u); if (s.vy > 0.5 || s.y > ry + 0.35 || s.y < ry - 0.45) continue;
    const off = Math.abs((s.x - r.x1) * uz - (s.z - r.z1) * ux); if (off > 0.55) continue;
    const hx = -Math.sin(s.yaw), hz = -Math.cos(s.yaw), dot = hx * ux + hz * uz; if (Math.abs(dot) < 0.4) continue;
    s.grind = { r, u, dir: Math.sign(dot), L, ux, uz }; s.air = false; s.vy = 0; s.y = ry; s.v = Math.max(s.v, 3);
    s.tricks.push(r.name || '50-50'); s.pending += 150; s.events.push({ type: 'grind' });
    return true;
  }
  return false;
}
export function step(s, input, dt, w = FLAT) {
  const surf = w.surface || ZERO, solid = w.solid || ZERO, top = (x, z) => Math.max(surf(x, z), solid(x, z));
  s.elapsed += dt;
  s.steering += (input.turn - s.steering) * (1 - Math.exp(-14 * dt));
  s.busy = Math.max(0, s.busy - dt); s.bail = Math.max(0, s.bail - dt);
  if (s.grind) {
    // on a rail: the board follows the steel, a little slower each second, and the combo keeps paying while it lasts
    const g = s.grind; s.v = Math.max(2.2, s.v * Math.exp(-0.18 * dt)); g.u += g.dir * s.v * dt / g.L;
    s.x = g.r.x1 + (g.r.x2 - g.r.x1) * g.u; s.z = g.r.z1 + (g.r.z2 - g.r.z1) * g.u;
    s.yaw = Math.atan2(-g.ux * g.dir, -g.uz * g.dir); s.y = railY(g.r, g.u); s.grindT += dt; s.pending += 160 * dt;
    if (g.u < 0 || g.u > 1) { s.grind = null; s.air = true; s.vy = 1.6; s.takeoff = { x: s.x, z: s.z }; }
    s.height = s.y - top(s.x, s.z);
    return 0;
  }
  // carving: quick at a walk, calmer at speed; in the air the steer spins the board instead
  const dyaw = -s.steering * (s.air ? 3.6 : 2.4 / (1 + s.v * 0.07)) * dt; s.yaw += dyaw; if (s.air) s.spin += dyaw;
  const hx = -Math.sin(s.yaw), hz = -Math.cos(s.yaw);
  // the slope under the wheels, along the heading: gravity pulls down it, so a ramp takes speed going up and gives it back
  const E = 0.14, gh = s.air ? 0 : (surf(s.x + hx * E, s.z + hz * E) - surf(s.x - hx * E, s.z - hz * E)) / (2 * E);
  s.slope = gh;
  const sin = gh / Math.sqrt(1 + gh * gh), cos = 1 / Math.sqrt(1 + gh * gh);
  const acceleration = s.air || s.bail > 0 ? 0 : input.push * (s.v < 4 ? 12 : 9) - input.brake * 20 - GRAV * sin;
  const vmax = sin < -0.05 ? VRAMP : Math.max(VMAX, s.v - dt * 4);
  let v = (s.v + acceleration * dt) * Math.exp(-0.22 * dt);
  if (v < 0.15 && !s.air && gh > 0.15) {
    // stalled on a slope: turn and roll back down the way you came; on a transition that is a rock to fakie
    v = 0.5; s.yaw += Math.PI; s.fakie = !s.fakie;
    if (gh > 1.5) { s.score += 120; s.message = 'ROCK TO FAKIE  +120'; s.events.push({ type: 'land', points: 120, tricks: ['ROCK TO FAKIE'], grind: 0 }); }
  }
  s.v = Math.max(0, Math.min(vmax, v));
  const hx2 = -Math.sin(s.yaw), hz2 = -Math.cos(s.yaw);
  // the speed is along the surface: up a steep transition the ground covered shrinks and the climb is the rest
  let nx = s.x + hx2 * s.v * cos * dt, nz = s.z + hz2 * s.v * cos * dt;
  // anything sheer is a wall when you are on the ground: a ledge or a deck from below, the back of a kicker, a step
  // of more than 0.4 m in one tick (a 75 degree transition at full speed rises less than that)
  if (!s.air && (solid(nx, nz) > s.y + 0.1 || surf(nx, nz) - s.y > 0.4)) { nx = s.x; nz = s.z; s.v *= 0.4; s.events.push({ type: 'bump' }); }
  if (w.collide) {
    const [cx, cz] = w.collide(nx, nz);
    if (Math.hypot(cx - nx, cz - nz) > 0.025) { s.v *= 0.85; if (s.air && s.tricks.length) s.wiped = true; s.events.push({ type: 'bump' }); }
    nx = cx; nz = cz;
  }
  s.x = nx; s.z = nz;
  const S1 = top(s.x, s.z);
  if (!s.air) {
    const rise = (S1 - s.y) / dt;
    if (S1 < s.y - 0.12) { s.air = true; s.vy = Math.max(0, s.rampVy); s.takeoff = { x: s.x, z: s.z }; if (s.rampVy > 1) { s.tricks.push('AIR'); s.pending += 80; } }   // off a lip
    else if (s.rampVy > 2.5 && rise < s.rampVy * 0.35) { s.air = true; const sl = s.sinPrev || 0; s.vy = s.rampVy * 0.72; s.v *= Math.sqrt(1 - sl * sl); s.qair = sl > 0.8; s.takeoff = { x: s.x, z: s.z }; s.tricks.push('AIR'); s.pending += 80; }   // over the coping
    else { s.rampVy = Math.min(rise, s.v); s.y = S1; s.sinPrev = sin; }   // the climb can never be faster than the board; the slope is kept for the launch, which happens one step past the lip
  }
  if (s.air) {
    s.y += s.vy * dt - GRAV / 2 * dt * dt; s.vy -= GRAV * dt;
    // an air out of a transition turns at the top and comes back down the ramp it left, the way a skater does
    if (s.qair && s.vy <= 0) { s.qair = false; s.yaw += Math.PI; s.v = Math.max(s.v, 1.4); }
    if (!tryGrind(s, w) && s.y <= S1) land(s, w, S1);
  }
  s.height = s.y - S1;
  return dyaw;
}
