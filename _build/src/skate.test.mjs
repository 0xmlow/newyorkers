import assert from 'node:assert/strict';
import {createSkate, step, ollie, trick} from './skate.mjs';
const ZERO0 = () => 0;
const idle = {push:0,brake:0,turn:0};
const s = createSkate();
for(let i=0;i<120;i++) step(s,{...idle,push:1},1/120);
const speed = s.v;
step(s,idle,1/120); assert(s.v > 0 && s.v < speed, 'coasting');
for(let i=0;i<120;i++) step(s,{...idle,brake:1},1/120);
assert.equal(s.v,0,'braking');
assert(ollie(s)); assert(!ollie(s),'no midair jump');
for(let i=0;i<20;i++) step(s,idle,1/120);
assert(trick(s,0)); assert(!trick(s,0),'trick cooldown');
assert.equal(s.score,0,'no premature scoring');
for(let i=0;i<120;i++) step(s,idle,1/120);
assert.equal(s.height,0); assert.equal(s.score,700);
const late=createSkate(); ollie(late);
for(let i=0;i<70;i++) step(late,idle,1/120);
trick(late,1);
for(let i=0;i<60;i++) step(late,idle,1/120);
assert.equal(late.score,0,'unfinished landing bails');
console.log('PASS: coasting, brakes, jump gating, cooldown, landing score, late-trick bail');

// ---- the world: a kicker launches you, a rail holds you, a gap pays, a wall takes the trick ----
const kicker = (x, z) => (z <= 0 && z >= -1.6 && Math.abs(x) < 0.8) ? (-z / 1.6) * 0.55 : 0;   // rises toward -z, sheer drop at its lip
const ride = (s, w, n, input = { ...idle, push: 1 }) => { for (let i = 0; i < n; i++) step(s, input, 1 / 120, w); };
{ const s = createSkate(); s.z = 3; s.v = 8; const w = { surface: kicker, rails: [], gaps: [{ from: { x: 0, z: -1.6, r: 1 }, to: { x: 0, z: -6, r: 3 }, name: 'THE GAP', bonus: 500 }] };
  let flew = false; for (let i = 0; i < 400; i++) { step(s, idle, 1 / 120, w); if (s.air && s.height > 0.5) flew = true; }
  assert(flew, 'a kicker launches the board off its lip');
  assert(s.score > 0 && /THE GAP/.test(s.message), 'clearing the gap scores it: ' + s.message); }
{ const s = createSkate(); s.z = 0; s.v = 6; const w = { surface: ZERO0, rails: [{ x1: 0, z1: -1, x2: 0, z2: -8, y: 0.45 }], gaps: [] };
  ollie(s); let ground = false; for (let i = 0; i < 300 && !ground; i++) { step(s, idle, 1 / 120, w); if (s.grind) ground = true; }
  assert(ground, 'an ollie onto a rail locks into a grind');
  ride(s, w, 300, idle); assert(!s.grind && s.score > 0 && /50-50/.test(s.message), 'the grind pays out on landing: ' + s.message); }
{ const s = createSkate(); s.v = 9; const w = { surface: ZERO0, collide: (x, z) => [x, Math.max(z, -1)] };
  ollie(s); ride(s, w, 25, idle); trick(s, 0); ride(s, w, 200, idle);
  assert.equal(s.score, 0, 'a wall mid trick is a bail'); assert(/BAIL/.test(s.message)); }
{ const s = createSkate(); s.z = -3; s.yaw = Math.PI; s.v = 5; const w = { surface: kicker }; ride(s, w, 120, { ...idle });
  assert(s.z < -1.55 && s.y === 0, 'the back of the kicker stops a grounded board: z ' + s.z.toFixed(2)); }
console.log('PASS: kicker launch, gap, rail grind, wall bail, kicker back');

// ---- transitions: a quarter pipe airs you out when you are fast and rocks you back when you are not; a down rail ----
const R = 1.6, TOP = 1.2, ATOP = Math.sqrt(R * R - (R - TOP) ** 2);
const quarter = (x, z) => { const a = -z; if (Math.abs(x) > 1.2 || a < 0) return 0; if (a <= ATOP) return R - Math.sqrt(R * R - a * a); return a < ATOP + 1.4 ? TOP : 0; };
{ const s = createSkate(); s.z = 4; s.v = 9; const w = { surface: quarter }; let peak = 0, air = false;
  for (let i = 0; i < 400; i++) { step(s, idle, 1 / 120, w); if (s.air) air = true; peak = Math.max(peak, s.y); }
  assert(air && peak > TOP + 0.3, 'a fast run up a quarter airs out over the coping: peak ' + peak.toFixed(2) + ' air ' + air); }
{ const s = createSkate(); s.z = 2; s.v = 3; const w = { surface: quarter }; let flipped = false;
  for (let i = 0; i < 400; i++) { step(s, idle, 1 / 120, w); if (Math.abs(((s.yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) < 0.01) flipped = true; }
  assert(flipped && !s.air && s.z > 0.5, 'a slow run up a quarter stalls, turns and rolls back down: z ' + s.z.toFixed(2)); }
{ const s = createSkate(); s.z = 0; s.v = 6; const w = { surface: ZERO0, rails: [{ x1: 0, z1: -1, x2: 0, z2: -6, y1: 0.8, y2: 0.3 }] };
  ollie(s); let on = false, ys = []; for (let i = 0; i < 400; i++) { step(s, idle, 1 / 120, w); if (s.grind) { on = true; ys.push(s.y); } }
  assert(on && ys[0] > ys[ys.length - 1] + 0.2, 'a down rail carries the board down its slope'); }
console.log('PASS: quarter air, rock to fakie, down rail');
{ const s = createSkate(); s.v = 6; ollie(s); for (let i = 0; i < 200; i++) step(s, { ...idle, turn: 1 }, 1/120);
  assert(/EIGHTY|SIXTY|FORTY/.test(s.message) && s.score > 100, 'steering in the air spins the board: ' + s.message);
  const b = createSkate(); b.v = 8; ollie(b); for (let i = 0; i < 10; i++) step(b, idle, 1/120); trick(b, 0); for (let i = 0; i < 20; i++) step(b, idle, 1/120);
  b.y = 0.01; b.vy = -5; step(b, idle, 1/120); assert(b.bail > 0 && !ollie(b), 'a bail puts you on the floor for a moment'); }
console.log('PASS: spins, bail knockdown');
