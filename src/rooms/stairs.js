// II. THE BODEGA. Room 5: THE STOCKROOM STAIRS.
// The stockroom door behind the counter opens on a stair down to the basement, and the basement never comes.
//
// HEADLINE ILLUSION: an impossible loop, done as a non Euclidean wrap.
// Four flights wind round a square well and only ever go down. The floor height is a function of where you stand
// (ground(x, z)): landing k sits at k flights down, each flight ramps down one more. After the fourth flight you step
// off at the corner you started from, four flights lower, which is where landing 0 is drawn four flights higher. At
// that seam move() lifts you by exactly one lap (P.y += H) as the floor function jumps by the same amount, so the
// camera never moves. The geometry is periodic (the same lap instanced down the well and up it), the lights follow a
// window over the spiral that is periodic too, so nothing at the seam can tell. Only the signs know: every landing
// counts the floors below the street, B1, B2 ... B47 ..., and walking back up counts them down to B0 and the door.
// Look over the rail: the same lap repeats down the well, bulbs and all, into the fog, forever.
const h = 2.2, H = 4 * h, S = 6, A = 2.2, BI = 4.4, N = 13, RISE = h / N, RUN = 2 * A / N;
const rot = (x, z, k) => { const a = -k * Math.PI / 2, cs = Math.cos(a), sn = Math.sin(a); return [x * cs + z * sn, -x * sn + z * cs]; };
// which part of the spiral a point is on: a landing (k) or the flight that leaves it (k, u from 0 at the top to 1)
function zone(x, z) {
  for (let k = 0; k < 4; k++) { const [lx, lz] = rot(x, z, k); if (lx >= A - 1e-6 && lz >= A) return { k, L: true, u: 0, y: -k * h }; }
  for (let k = 0; k < 4; k++) { const [lx, lz] = rot(x, z, k); if (lx >= 2.6 && lz < A && lz >= -A) { const u = (A - lz) / (2 * A); return { k, L: false, u, y: -h * (k + u) }; } }
  const k = ((Math.round(Math.atan2(-z, x) / (Math.PI / 2) - 0.5) % 4) + 4) % 4;
  return { k, L: true, u: 0, y: -k * h };
}
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const FLOOR_LINES = {
  0: 'STREET LEVEL. THE BODEGA IS UP THROUGH THE DOOR.', 1: 'ONE FLOOR BELOW THE STREET', 2: 'TWO FLOORS BELOW THE STREET', 3: 'THREE FLOORS. THE STOCKROOM HAS ONE.',
  4: 'FOUR. YOU HAVE SEEN THIS LANDING BEFORE.', 7: 'SEVEN. THE SUPER LIVES ON B9. ALLEGEDLY.', 9: 'THE SUPER IS NOT IN.', 13: 'THERE IS NO B13. YOU ARE STANDING ON IT.',
  21: 'NO DELIVERIES BELOW THIS FLOOR', 33: 'HALFWAY TO B66', 47: 'THE BREAKER SAYS THIS IS THE BOTTOM', 48: 'IT WAS NOT THE BOTTOM', 66: 'HALFWAY TO B132',
  99: 'ONE MORE AND YOU GET A FREE COFFEE', 100: 'NO FREE COFFEE. KEEP GOING.', 111: 'THE CENSUS COUNTED THIS FLOOR TWICE', 333: 'THREE THIRTY THREE. WAKE UP.',
};
const floorLine = (n) => FLOOR_LINES[n] || (n % 10 === 0 ? `${n} FLOORS. THE MOP SINK IS STILL HERE.` : `${n} FLOORS BELOW THE STREET`);

export default {
  id: 'stairs', name: 'The Stockroom Stairs', scale: 'II · The bodega',
  kicker: 'Behind the stockroom door a stair goes down to the basement. Four flights, always down, and you are back on the first.',
  sound: 'stairs',
  sky: 0x04060d, fog: 0x05070f, fogD: 0.045, hemi: [0x8a93b8, 0x2a1a0c, 0.32], env: 0.28,
  post: { dream: 0.12, bloom: 0.85, vig: 0.55, grain: 0.16, ca: 0.0025 },
  spawn: [5.2, 4.6, 0.3],
  ground: (x, z) => zone(x, z).y,
  build(c) {
    const { THREE, R } = c;
    const S0 = R.state; S0.base = 0;
    // ---------- materials ----------
    const wallT = c.canvasTex(1024, 1024, (g, w, hh) => {
      // painted cinderblock, 2 m square: running bond, chipped bone paint, rust weeps, one cobalt band at knee height
      const r = mulberry(7); g.fillStyle = '#cfc8b6'; g.fillRect(0, 0, w, hh);
      const bw = w / 5, bh = hh / 10;
      for (let j = 0; j < 10; j++) for (let i = -1; i < 6; i++) {
        const x = i * bw + (j % 2 ? bw / 2 : 0), y = j * bh, v = 196 + r() * 26 | 0;
        g.fillStyle = `rgb(${v},${v - 6},${v - 20})`; g.fillRect(x + 4, y + 4, bw - 8, bh - 8);
        for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(80,70,50,${0.05 + r() * 0.08})`; g.fillRect(x + r() * bw, y + r() * bh, 2 + r() * 4, 2 + r() * 3); }
      }
      g.fillStyle = 'rgba(70,60,45,.55)'; for (let j = 0; j <= 10; j++) g.fillRect(0, j * bh - 3, w, 6);
      for (let j = 0; j < 10; j++) for (let i = -1; i < 6; i++) g.fillRect(i * bw + (j % 2 ? bw / 2 : 0) - 3, j * bh, 6, bh);
      for (let k = 0; k < 9; k++) { const x = r() * w, gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, 'rgba(120,70,30,.0)'); gr.addColorStop(r() * 0.5 + 0.2, 'rgba(120,70,30,.22)'); gr.addColorStop(1, 'rgba(120,70,30,0)'); g.fillStyle = gr; g.fillRect(x, 0, 3 + r() * 6, hh); }
    });
    wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping;
    const plateT = c.canvasTex(512, 512, (g, w) => {
      g.fillStyle = '#6d727a'; g.fillRect(0, 0, w, w);
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const x = i * 32 + (j % 2) * 16, y = j * 32; g.save(); g.translate(x + 16, y + 16); g.rotate((i + j) % 2 ? 0.6 : -0.6); g.fillStyle = '#9aa0a8'; g.fillRect(-11, -3, 22, 6); g.fillStyle = '#4c5057'; g.fillRect(-11, 3, 22, 2); g.restore(); }
      const r = mulberry(3); for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(30,20,10,${r() * 0.15})`; g.fillRect(r() * w, r() * w, 6 + r() * 20, 3 + r() * 8); }
    });
    plateT.wrapS = plateT.wrapT = THREE.RepeatWrapping;
    const boxT = c.canvasTex(1024, 1024, (g, w) => {
      // the stock: sixteen cartons, every brand a twist
      const L = [['NAZAR COLA', '24 CANS', '#c8102e'], ['EYE CRUNCH', 'FAMILY SIZE', '#2962ff'], ['TALLY CHIPS', 'SALT AND VINEGAR', '#e0a500'], ['COO COO PUFFS', 'NOW WITH SEEDS', '#6f23a8'],
        ['3:33 AM ENERGY', 'DO NOT DRINK BEFORE BED', '#00a37a'], ['PIGEONCARD', 'REFILLS 500 CT', '#ff2e63'], ['THIS SIDE UP', 'THE OTHER SIDE IS ALSO UP', '#222'], ['FRAGILE', 'CONTAINS ONE DREAM', '#c8102e'],
        ['PLANTAINS', 'GREEN NOT YET', '#2e7d32'], ['RECEIPT ROLLS', 'THERMAL 50 CT', '#444'], ['SEED MIX 50 LB', 'FOR THE CUSTOMERS', '#8a5a00'], ['BAGELS', 'YESTERDAY', '#b5651d'],
        ['PAPER TOWEL', '12 ROLLS', '#1565c0'], ['CAT FOOD', 'FOR THE CAT WHO RUNS THE STORE', '#d84315'], ['NAZAR COLA ZERO', 'SAME EYE NO SUGAR', '#111'], ['RETURN TO B0', 'IF FOUND', '#6f23a8']];
      const cw = w / 4; const r = mulberry(11);
      L.forEach(([a, b, col], i) => {
        const x = (i % 4) * cw, y = Math.floor(i / 4) * cw;
        g.fillStyle = '#b08850'; g.fillRect(x, y, cw, cw);
        for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${90 + r() * 40},${60 + r() * 20},30,${0.08 + r() * 0.1})`; g.fillRect(x + r() * cw, y + r() * cw, r() * 60, 2); }
        g.fillStyle = 'rgba(200,170,120,.6)'; g.fillRect(x, y + cw * 0.45, cw, cw * 0.1);
        g.fillStyle = col; g.font = `900 ${a.length > 11 ? 24 : 32}px ${c.FONT}`; g.textAlign = 'center'; g.fillText(a, x + cw / 2, y + cw * 0.32);
        g.font = `600 14px ${c.MONO}`; g.fillStyle = '#2a1a08'; g.fillText(b, x + cw / 2, y + cw * 0.72);
        g.strokeStyle = 'rgba(40,25,10,.5)'; g.lineWidth = 4; g.strokeRect(x + 3, y + 3, cw - 6, cw - 6);
      });
    });
    const M = {
      wall: new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.92, color: 0xe6e0d0 }),
      tread: new THREE.MeshStandardMaterial({ map: plateT, roughness: 0.55, metalness: 0.6, color: 0xb0b4ba }),
      land: c.surf('terrazzo', 1.6, { tint: 0x8e8c96 }),
      rail: new THREE.MeshStandardMaterial({ color: 0x1d3fb8, metalness: 0.45, roughness: 0.42 }),
      pipe: new THREE.MeshStandardMaterial({ color: 0xbe854c, metalness: 0.85, roughness: 0.35 }),
      pink: new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x5a0018, emissiveIntensity: 0.4 }),
      violet: new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x200838, emissiveIntensity: 0.4 }),
      box: new THREE.MeshStandardMaterial({ map: boxT, roughness: 0.9 }),
      bulb: new THREE.MeshBasicMaterial({ color: 0xffd7a0 }),
      boiler: new THREE.MeshStandardMaterial({ color: 0x24362e, metalness: 0.6, roughness: 0.5 }),
      fire: new THREE.MeshBasicMaterial({ color: 0xff7a1a, toneMapped: false }),
      nose: new THREE.MeshStandardMaterial({ color: 0xd9b400, roughness: 0.6 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.7, metalness: 0.3 }),
      sink: new THREE.MeshStandardMaterial({ color: 0xd8d6cf, roughness: 0.35 }),
    };
    // ---------- the lap: everything periodic, merged per material, instanced up and down the well ----------
    const G = {};
    const qm = (geo, k, ry = 0, x = 0, y = 0, z = 0) => { if (ry) geo.rotateY(ry); geo.translate(x, y, z); geo.rotateY(k * Math.PI / 2); geo.translate(0, -k * h, 0); return geo; };
    const sb = (key, w, hh, d, x, y, z, k, { ry = 0, rx = 0, rz = 0, rep } = {}) => {
      const geo = c.slab(w, hh, d, M[key], 0, 0, 0, rep).geometry; if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz);
      (G[key] ||= []).push(qm(geo, k, ry, x, y, z));
    };
    const gp = (key, geo, k, ry, x, y, z) => (G[key] ||= []).push(qm(geo, k, ry, x, y, z));
    const cyl = (r0, r1, len, seg = 10) => new THREE.CylinderGeometry(r0, r1, len, seg);
    // a carton whose every face shows one cell of the stock atlas
    const carton = (w, hh, d, cell) => { const g = new THREE.BoxGeometry(w, hh, d), uv = g.attributes.uv; const u0 = (cell % 4) / 4, v0 = 1 - (Math.floor(cell / 4) + 1) / 4; for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) / 4, v0 + uv.getY(i) / 4); return g; };
    const rnd = mulberry(1987);
    const drip = (key, x, y, z, k, len, r = 0.022) => {
      const a = cyl(r * 0.7, r * 0.35, len, 6); a.translate(0, -len / 2, 0); const b = new THREE.SphereGeometry(r, 8, 6); b.translate(0, -len, 0); const top = new THREE.SphereGeometry(r * 1.5, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2); top.scale(1.6, 0.5, 1.6);
      for (const g of [a, b, top]) gp(key, g, k, 0, x, y, z);
    };
    const slope = Math.atan2(h, 2 * A), FL = Math.hypot(2 * A, h);
    for (let k = 0; k < 4; k++) {
      // landing slab, its edge lip
      sb('land', S - A, 0.22, S - A, (A + S) / 2, -0.11, (A + S) / 2, k);
      sb('rail', 0.06, 0.24, S - A + 0.06, A - 0.03, -0.12, (A + S) / 2, k); sb('rail', S - A, 0.24, 0.06, (A + S) / 2, -0.12, A - 0.03, k);
      // the flight: steel pan treads, risers, yellow nosing, two stringers
      for (let i = 0; i < N; i++) {
        const z1 = A - (i + 1) * RUN, top = -(i + 1) * RISE;
        sb('tread', S - BI, 0.05, RUN + 0.02, (BI + S) / 2, top - 0.025, z1 + RUN / 2, k, { rep: 1 });
        sb('tread', S - BI, RISE, 0.02, (BI + S) / 2, top + RISE / 2, z1 + RUN, k, { rep: 1 });
        sb('nose', S - BI - 0.1, 0.012, 0.04, (BI + S) / 2, top + 0.006, z1 + RUN - 0.02, k);
      }
      sb('rail', 0.07, 0.34, FL, BI + 0.035, -h / 2 - 0.12, 0, k, { rx: -slope });
      sb('rail', 0.05, 0.3, FL, S - 0.03, -h / 2 - 0.1, 0, k, { rx: -slope });
      // handrail along the flight, balusters, the landing rail round the inner corner
      { const g = cyl(0.028, 0.028, FL + 0.1, 10); g.rotateX(Math.PI / 2 - slope); gp('rail', g, k, 0, BI + 0.035, -h / 2 + 0.95, 0); }
      for (let i = 0; i <= 14; i++) { const z = A - i * (2 * A / 14), yb = -h * (A - z) / (2 * A); sb('rail', 0.025, 0.95, 0.025, BI + 0.035, yb + 0.475, z, k); }
      for (const [x1, z1, x2, z2] of [[A, A, A, BI], [A, A, BI, A]]) {
        const L = Math.hypot(x2 - x1, z2 - z1), mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, ry = Math.atan2(x2 - x1, z2 - z1);
        for (const y of [1.0, 0.5]) { const g = cyl(0.028, 0.028, L, 10); g.rotateX(Math.PI / 2); gp('rail', g, k, ry, mx, y, mz); }
        for (let i = 0; i <= 6; i++) sb('rail', 0.025, 1.0, 0.025, x1 + (x2 - x1) * i / 6, 0.5, z1 + (z2 - z1) * i / 6, k);
      }
      sb('rail', 0.07, 1.06, 0.07, A, 0.53, A, k);
      // the outer wall of this side, one lap tall, and the band of the next lap's floor seen from below
      sb('wall', 0.2, H, 2 * S + 0.4, S + 0.1, 3 - H / 2, 0, k);
      // pipes: a riser in the corner that runs through every lap, two copper runs along the wall, a steam line
      { const g = cyl(0.07, 0.07, H, 12); gp('pipe', g, k, 0, S - 0.14, 3 - H / 2, S - 0.14); }
      { const g = cyl(0.04, 0.04, H, 10); gp('pipe', g, k, 0, S - 0.32, 3 - H / 2, S - 0.1); }
      for (const [y, r] of [[2.75, 0.05], [3.0, 0.035]]) { const g = cyl(r, r, 2 * S, 10); g.rotateX(Math.PI / 2); gp('pipe', g, k, 0, S - 0.12, y, 0); }
      for (const z of [-4, -1.5, 1, 3.5]) sb('dark', 0.1, 0.06, 0.05, S - 0.06, 2.75, z, k);
      // the caged bulbs, as glow, in every lap (the near laps hang the real fixture round them)
      { const g = new THREE.SphereGeometry(0.055, 10, 8); gp('bulb', g, k, 0, 4.5, 2.25, 4.5); }
      { const g = cyl(0.006, 0.006, 0.5, 4); gp('dark', g, k, 0, 4.5, 2.5, 4.5); }
      // and one bare bulb on a long cord over the well at every landing: from the rail they spiral down out of sight
      { const g = new THREE.SphereGeometry(0.06, 10, 8); gp('bulb', g, k, 0, A - 0.35, 1.35, A - 0.35); const cd = cyl(0.005, 0.005, 1.7, 4); gp('dark', cd, k, 0, A - 0.35, 1.35 + 0.85, A - 0.35); }
      // paint: hot pink and violet running off the landing lip, off the stringer, down the wall under the pipe
      for (let i = 0; i < 9; i++) { const t = rnd(); const onX = rnd() < 0.5; const x = onX ? A - 0.04 : A + t * (BI - A), z = onX ? A + t * (BI - A) : A - 0.04; drip(rnd() < 0.6 ? 'pink' : 'violet', x, -0.2, z, k, 0.12 + rnd() * 0.5); }
      for (let i = 0; i < 6; i++) { const z = A - rnd() * 2 * A, yb = -h * (A - z) / (2 * A); drip(rnd() < 0.5 ? 'pink' : 'violet', BI + 0.035, yb - 0.3, z, k, 0.1 + rnd() * 0.35, 0.018); }
      for (let i = 0; i < 5; i++) { const z = -S + 0.5 + rnd() * (2 * S - 1); const g = new THREE.BoxGeometry(0.012, 0.6 + rnd() * 1.6, 0.05 + rnd() * 0.05); const len = g.parameters.height; g.translate(0, -len / 2, 0); gp(rnd() < 0.5 ? 'pink' : 'violet', g, k, 0, S - 0.005, 2.7, z); }
    }
    // the per landing furniture that every lap has (so the well below is full, not just the stair)
    const Q = (k, fn) => fn(k);
    // landing 0: a wall of cartons by the rail, a carton tower in the corner
    Q(0, (k) => {
      let y = 0; for (const [w, hh, d, cell, x, z, ry] of [[0.6, 0.45, 0.5, 0, 2.75, 3.4, 0.1], [0.6, 0.45, 0.5, 4, 2.75, 3.95, -0.05], [0.55, 0.4, 0.45, 2, 3.4, 2.75, 0.2], [0.55, 0.4, 0.45, 3, 3.95, 2.75, -0.1], [0.5, 0.4, 0.45, 5, 2.75, 3.65, 0.3], [0.5, 0.35, 0.4, 14, 3.55, 2.8, -0.25]]) {
        const yy = (cell === 5 || cell === 14) ? 0.45 + hh / 2 : hh / 2; gp('box', carton(w, hh, d, cell), k, ry, x, yy, z); y++;
      }
    });
    // landing 1: the boiler, and the steam riser that climbs to the boiler one lap up
    Q(1, (k) => {
      gp('boiler', cyl(0.62, 0.62, 1.7, 24), k, 0, 3.35, 0.95, 3.35); gp('boiler', new THREE.SphereGeometry(0.62, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 1), k, 0, 3.35, 1.8, 3.35);
      gp('dark', cyl(0.66, 0.66, 0.1, 24), k, 0, 3.35, 0.05, 3.35);
      for (const y of [0.4, 1.0, 1.5]) gp('pipe', new THREE.TorusGeometry(0.625, 0.018, 6, 32).rotateX(Math.PI / 2), k, 0, 3.35, y, 3.35);
      { const g = new THREE.CircleGeometry(0.16, 20); g.rotateY(Math.PI / 4); gp('fire', g, k, 0, 3.35 + 0.63 * 0.707, 0.55, 3.35 + 0.63 * 0.707); }
      { const g = cyl(0.09, 0.09, H - 2.1, 12); gp('pipe', g, k, 0, 3.35, 2.1 + (H - 2.1) / 2, 3.35); }
      { const g = cyl(0.05, 0.05, 1.6, 10); g.rotateZ(Math.PI / 2); gp('pipe', g, k, Math.PI / 4, 4.4, 1.3, 4.4); }
      gp('dark', cyl(0.1, 0.1, 0.12, 16).rotateX(Math.PI / 2), k, Math.PI / 4, 3.35 + 0.66 * 0.707, 1.35, 3.35 + 0.66 * 0.707);
      gp('box', carton(0.5, 0.4, 0.4, 10), k, 0.4, 2.6, 0.2, 4.05);
    });
    // landing 2: a stack of cartons under the nest by the rail
    Q(2, (k) => {
      gp('box', carton(0.62, 0.42, 0.62, 9), k, 0.3, 2.78, 0.21, 2.78); gp('box', carton(0.56, 0.36, 0.56, 11), k, -0.2, 2.8, 0.6, 2.8);
      gp('box', carton(0.5, 0.45, 0.45, 12), k, 0, 3.6, 0.225, 2.6); gp('box', carton(0.5, 0.4, 0.45, 1), k, 0.2, 2.6, 0.2, 3.6);
    });
    // landing 3: the mop sink in the corner, with its faucet and a mop handle that has been here since 1987
    Q(3, (k) => {
      gp('sink', new THREE.BoxGeometry(0.7, 0.3, 0.7), k, 0, 2.62, 0.15, 3.9); gp('dark', new THREE.BoxGeometry(0.58, 0.02, 0.58), k, 0, 2.62, 0.3, 3.9);
      gp('pipe', cyl(0.015, 0.015, 0.9), k, 0, 2.3, 0.75, 3.9); gp('pipe', cyl(0.015, 0.015, 0.25).rotateZ(Math.PI / 2), k, 0, 2.42, 1.15, 3.9);
      gp('rail', cyl(0.015, 0.015, 1.5).rotateZ(0.25), k, 0, 2.85, 0.95, 3.75);
      gp('box', carton(0.55, 0.4, 0.5, 7), k, 0.15, 3.5, 0.2, 2.62); gp('box', carton(0.5, 0.38, 0.5, 13), k, -0.2, 3.5, 0.59, 2.62); gp('box', carton(0.55, 0.42, 0.5, 6), k, 0.05, 4.05, 0.21, 2.62);
    });
    const LAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, -1, -2, -3, -4];
    const inst = [];
    for (const key in G) {
      const geo = c.merge(G[key]); const im = new THREE.InstancedMesh(geo, M[key], LAPS.length);
      LAPS.forEach((j, i) => im.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, -j * H, 0)));
      im.frustumCulled = false; im.count = 9; c.add(im); inst.push(im);
    }
    // the cap: when you are near the street there is a ceiling (the stockroom floor) over the well, not more stairs
    const cap = new THREE.Group(); c.add(cap);
    cap.add(c.slab(2 * S + 0.4, 0.3, 2 * S + 0.4, M.wall, 0, 3.15, 0));
    for (let k = 1; k < 4; k++) { const m = c.slab(0.2, k * h, 2 * S + 0.4, M.wall, 0, 0, 0); m.geometry.translate(S + 0.1, 3 - k * h / 2, 0); m.geometry.rotateY(k * Math.PI / 2); cap.add(m); }
    { const m = c.slab(2 * S, 0.02, 2 * S, c.surf('ceiling', 1.2, { tint: 0xbdb6a6 }), 0, 2.99, 0); cap.add(m); }

    // ---------- colliders: the outer walls, the rails round the well, the furniture ----------
    for (let k = 0; k < 4; k++) {
      const w = (x1, z1, x2, z2) => { const [a, b] = rot(x1, z1, -k), [cc, d] = rot(x2, z2, -k); c.wall(a, b, cc, d); };
      w(S, -S, S, S);
      w(BI, k === 3 ? -A + 0.4 : -A, BI, A);
      w(A, A, A, k === 0 ? BI - 0.4 : BI); w(A, A, BI, A);
      const p = (x, z, r) => { const [a, b] = rot(x, z, -k); c.post(a, b, r); };
      if (k === 0) { p(2.75, 3.6, 0.45); p(3.6, 2.75, 0.45); }
      if (k === 1) { p(3.35, 3.35, 0.68); p(2.6, 4.05, 0.3); }
      if (k === 2) { p(2.8, 2.8, 0.45); p(3.6, 2.6, 0.3); p(2.6, 3.6, 0.3); }
      if (k === 3) { p(2.62, 3.9, 0.42); p(3.6, 2.62, 0.35); p(4.05, 2.62, 0.3); p(3.25, 3.35, 0.35); }
    }

    // ---------- the near laps: fixtures, signs, paintings, people, the pigeon ----------
    const FIX = { laps: {}, signs: [], b0: [], notB0: [], ghosts: [] };
    const pieces = c.art(12);
    const hung = [];
    const notice = (txt, w = 0.42, hh = 0.56, tilt = 0) => {
      const t = c.canvasTex(420, 560, (g, W, Hh) => {
        g.fillStyle = '#f3efe4'; g.fillRect(0, 0, W, Hh); g.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 30; i++) g.fillRect(0, i * 19, W, 1);
        g.fillStyle = '#111'; g.font = `800 30px ${c.FONT}`; g.textAlign = 'center';
        const words = txt.split(' '); let line = '', y = 80; const lines = [];
        for (const wd of words) { if (g.measureText(line + wd).width > W - 50) { lines.push(line); line = ''; } line += wd + ' '; } lines.push(line);
        lines.forEach((l, i) => { g.font = i === 0 ? `900 38px ${c.FONT}` : `600 27px ${c.MONO}`; g.fillText(l.trim(), W / 2, y); y += i === 0 ? 62 : 40; });
        g.fillStyle = 'rgba(230,220,160,.75)'; g.fillRect(20, 6, 90, 26); g.fillRect(W - 110, 6, 90, 26);
        g.fillStyle = '#ff2e63'; g.font = `700 22px ${c.MONO}`; g.fillText('THE MANAGEMENT', W / 2, Hh - 30);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 })); m.rotation.z = tilt; return m;
    };
    const NOTICES = ['NOTICE The elevator is a rumor. Please use the stairs, all of them.', 'LOST One floor. Answers to B13. Do not feed it.', 'DELIVERIES Before 6 AM use the stairs. All the stairs.', 'NO LOITERING Landings are for landing.'];
    const signCanvas = () => c.canvasTex(1024, 512, () => {});
    const drawSign = (t, n) => {
      const cv = t.userData.canvas, g = cv.getContext('2d'), w = cv.width, hh = cv.height;
      g.clearRect(0, 0, w, hh);
      g.fillStyle = n === 0 ? '#ff2e63' : '#2962ff'; g.fillRect(0, 0, w, hh);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % w, (i * 53) % hh, 30, 2);
      g.fillStyle = '#f0f4f8'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.font = `900 300px ${c.FONT}`; g.fillText(`B${n}`, 40, 300);
      g.font = `700 34px ${c.MONO}`; const line = floorLine(n); const words = line.split(' '); let l1 = '', l2 = '';
      for (const wd of words) { if (g.measureText(l1 + wd).width < w - 80 && !l2) l1 += wd + ' '; else l2 += wd + ' '; }
      g.fillText(l1.trim(), 44, 390); g.fillText(l2.trim(), 44, 440);
      // drips off the bottom of the stencil, painted
      g.fillStyle = '#f0f4f8'; for (let i = 0; i < 7; i++) { const x = 60 + i * 140 + (n * 37 % 50); g.fillRect(x, 300, 8, 20 + ((n + i) * 29 % 60)); }
      t.needsUpdate = true;
    };
    const lapOf = {};
    const dress = (j) => {
      const main = j === 0, lap = new THREE.Group(); lap.position.y = -j * H; c.add(lap); lapOf[j] = lap;
      const qg = [0, 1, 2, 3].map((k) => { const q = new THREE.Group(); q.rotation.y = k * Math.PI / 2; q.position.y = -k * h; lap.add(q); return q; });
      const r = mulberry(333);
      const stk = [];
      const glb = (name, o, q) => c.glb(name, { ...o, parent: q });
      const blob = (q, x, y, z, s) => { const b = c.blob(0, 0, s); q.add(b); b.position.set(x, y + 0.012, z); return b; };
      const stick = (q, ids, x, y, z, ry, size) => { const id = ids[Math.floor(r() * ids.length)]; const s = c.sticker(id, x, y, z, { ry, size, rot: (r() - 0.5) * 0.8, parent: q }); if (s) stk.push(s); };
      const GR = window.STICKER_GROUPS || {}, BOD = GR.bodega || [], STR = GR.street || [];
      for (let k = 0; k < 4; k++) {
        const q = qg[k];
        // the floor sign, stencilled on the wall you face as you come off the flight
        const st = signCanvas(); const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshStandardMaterial({ map: st, roughness: 0.6, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.35 }));
        sm.position.set(S - 0.012, 2.15, 5.2); sm.rotation.y = -Math.PI / 2; q.add(sm); FIX.signs.push({ t: st, j, k, m: sm });
        // caged bulb fixture
        glb('ph_caged_hanging_light', { h: 0.42, x: 4.5, y: 2.08, z: 4.5 }, q);
        // a notice, taped up beside the flight
        const nt = notice(NOTICES[k], 0.42, 0.56, (r() - 0.5) * 0.12); nt.position.set(S - 0.012, 1.5, 1.45); nt.rotation.y = -Math.PI / 2; q.add(nt);
        // paintings: two on the landing walls, one down the flight wall
        const P3 = pieces.slice(k * 3, k * 3 + 3); const frames = ['copper', 'steel', 'black'];
        const spots = [[S - 0.012, 1.62, 3.35, -Math.PI / 2], [3.3, 1.62, S - 0.012, Math.PI], [S - 0.012, -h / 2 + 1.62, -0.2, -Math.PI / 2]];
        P3.forEach((p, i) => {
          const [x, y, z, ry] = spots[i];
          if (main) { const g = c.hang(p, x, y, z, ry, 1.3, frames[(k + i) % 3], { parent: q, light: true }); hung.push(g); }
          else { const src = hung[k * 3 + i]; if (!src) return; const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; q.add(g); for (const ch of src.children) { const m = new THREE.Mesh(ch.geometry, ch.material); m.renderOrder = ch.renderOrder; g.add(m); FIX.ghosts.push([ch, m]); } }
        });
        if (k === 0) {
          // the door: at B0 it goes up to the bodega; on every other landing 0 it is a locked stockroom door
          const doorM = new THREE.MeshStandardMaterial({ color: 0x2b3f8f, metalness: 0.5, roughness: 0.45 });
          const door = c.slab(0.96, 2.06, 0.06, doorM, 5.2, 1.03, S - 0.03); q.add(door);
          for (const [w, hh, x, y] of [[0.08, 2.16, 4.68, 1.08], [0.08, 2.16, 5.72, 1.08], [1.12, 0.08, 5.2, 2.16]]) q.add(c.slab(w, hh, 0.1, M.dark, x, y, S - 0.05));
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M.pipe); knob.position.set(4.85, 1.0, S - 0.08); q.add(knob);
          const upS = c.sign('UP TO THE BODEGA', { w: 0.9, h: 0.16, bg: '#02040c', fg: '#00e5ff', font: c.MONO, glow: 10, px: 96 }); upS.position.set(5.2, 2.32, S - 0.02); upS.rotation.y = Math.PI; q.add(upS); FIX.b0.push({ j, o: upS });
          const lockS = c.sign('STOCKROOM  KEEP LOCKED', { w: 0.82, h: 0.12, bg: '#f0f4f8', fg: '#c8102e', font: c.MONO, px: 96 }); lockS.position.set(5.2, 1.62, S - 0.065); lockS.rotation.y = Math.PI; q.add(lockS); FIX.notB0.push({ j, o: lockS });
          const ex = c.sign('EXIT', { w: 0.36, h: 0.14, bg: '#1a0306', fg: '#ff2e63', font: c.FONT, glow: 14, px: 96 }); ex.position.set(5.2, 2.5, S - 0.02); ex.rotation.y = Math.PI; q.add(ex); FIX.b0.push({ j, o: ex });
          // the bricked up top: at B0 the stair does not go higher, the stockroom floor is there instead
          const brick = c.slab(0.24, 3.2, S - BI + 0.6, M.wall, A - 0.12, 1.6, (BI + S) / 2 - 0.3); q.add(brick); FIX.b0.push({ j, o: brick });
          const bs = c.sign('THE ONLY WAY UP\nIS THE DOOR', { w: 0.9, h: 0.34, bg: '#f0f4f8', fg: '#02040c', font: c.MONO, px: 128 }); bs.position.set(A + 0.005, 1.55, 5.2); bs.rotation.y = Math.PI / 2; q.add(bs); FIX.b0.push({ j, o: bs });
          if (main) c.click(door, () => { if (S0.base === 0) { c.sound.door(); c.go('bodega', [3.6, -5.4, Math.PI]); } else { c.sound.thump(0.4); c.say(knob, 'You knock. From the other side, close: "We are closed. We are always closed down here."'); } }, 'The door');
          // breaker panel
          const bt = c.canvasTex(300, 400, (g, w, hh) => {
            g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, w, hh); g.fillStyle = '#1a1c20'; g.fillRect(20, 20, w - 40, hh - 40);
            for (let i = 0; i < 24; i++) { const x = 34 + (i % 2) * 130, y = 30 + Math.floor(i / 2) * 29; g.fillStyle = '#d8dadc'; g.fillRect(x, y, 34, 20); g.fillStyle = '#f0f4f8'; g.font = `600 12px ${c.MONO}`; g.fillText(i === 23 ? 'THE BOTTOM' : i === 22 ? 'B47' : `B${i * 2 + 1} B${i * 2 + 2}`, x + 40, y + 15); }
            g.fillStyle = '#ffb020'; g.fillRect(34, hh - 52, w - 68, 18); g.fillStyle = '#02040c'; g.font = `700 13px ${c.MONO}`; g.fillText('DANGER  DREAM VOLTAGE', 44, hh - 38);
          });
          const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.66, 0.1), [M.dark, M.dark, M.dark, M.dark, new THREE.MeshStandardMaterial({ map: bt, roughness: 0.5, metalness: 0.3 }), M.dark]);
          panel.position.set(S - 0.05, 1.15, 4.75); panel.rotation.y = -Math.PI / 2; q.add(panel);
          if (main) c.click(panel, () => c.egg('stairs_breaker', 'Breaker 24 is labelled THE BOTTOM. Somebody has written under it, in pencil: never installed.'), 'The breaker panel');
          const clock = glb('ph_wall_clock', { h: 0.34, x: 3.3, y: 2.55, z: S - 0.08, ry: Math.PI }, q);
          glb('ph_hand_truck', { h: 1.25, x: 4.3, z: 3.35, ry: -2.4 }, q); blob(q, 4.3, 0, 3.35, 0.6);
          glb('ph_metal_trash_can', { h: 0.62, x: 2.6, z: 5.6, ry: 0.4 }, q); blob(q, 2.6, 0, 5.6, 0.55);
          for (let i = 0; i < 7; i++) stick(q, BOD, 4.85 + r() * 0.7, 0.4 + r() * 1.5, S - 0.07, Math.PI, 0.1 + r() * 0.1);
          for (let i = 0; i < 4; i++) stick(q, STR, S - 0.11, 0.9 + r() * 0.5, 4.55 + r() * 0.4, -Math.PI / 2, 0.08 + r() * 0.06);
        }
        if (k === 1) {
          // the radio on a carton by the boiler, still on, still on the same station
          const radio = glb('ph_vintage_radio_transceiver', { h: 0.22, x: 2.6, y: 0.4, z: 4.05, ry: 2.2 }, q);
          if (main) c.click(radio, () => { c.sound.chime(); c.egg('stairs_radio', 'Traffic and transit on the eights: the stairs are running local, all floors, downward only. Expect delays going up.'); }, 'The radio');
          glb('ph_plastic_crate_01', { h: 0.32, x: 4.7, z: 2.55, ry: 0.3 }, q);
          glb('ph_korean_fire_extinguisher_01', { h: 0.55, x: S - 0.18, z: 2.4, ry: -Math.PI / 2 }, q);
          for (let i = 0; i < 9; i++) { const a = r() * Math.PI / 2 + Math.PI * 0.1, y = 0.4 + r() * 1.2; stick(q, i % 2 ? BOD : STR, 3.35 + Math.cos(a) * 0.63, y, 3.35 + Math.sin(a) * 0.63, Math.PI / 2 - a + Math.PI, 0.12 + r() * 0.08); }
          for (let i = 0; i < 4; i++) stick(q, STR, S - 0.16, 0.6 + r() * 1.6, S - 0.27, -Math.PI / 2 + 0.6, 0.07);
        }
        if (k === 2) {
          // THE NEST: receipts, MetroCards with nothing on them, a pigeon the size of a cat, and its eye
          const nestM = c.surf('receipts', 0.6);
          const nest = new THREE.Group(); nest.position.set(2.8, 0.78, 2.8); q.add(nest);
          const tor = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.13, 10, 24), nestM); tor.rotation.x = Math.PI / 2; tor.scale.set(1, 1, 0.75); nest.add(tor);
          const bowl = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), nestM); bowl.rotation.x = -Math.PI / 2; bowl.position.y = -0.04; nest.add(bowl);
          const rc = new THREE.MeshStandardMaterial({ color: 0xa9a392, roughness: 0.95, side: THREE.DoubleSide });
          for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, rr = 0.26 + r() * 0.16; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.09 + r() * 0.08), rc); m.position.set(Math.cos(a) * rr, 0.02 + r() * 0.12, Math.sin(a) * rr); m.rotation.set(r() * 3, a, r() * 3); nest.add(m); }
          const pg = glb('pigeon', { h: 0.5, x: 2.8, y: 0.72, z: 2.8, ry: -Math.PI / 4 }, q);
          if (main) {
            // the eye: a disc exactly on the pigeon's eye, a live portal into the pigeon's own neck, the nave
            const src = new THREE.Object3D(); pg.add(src);
            const disc = new THREE.Mesh(new THREE.CircleGeometry(0.011, 28)); pg.add(disc);
            // an orange ring round the black, so the portal reads as the pigeon's own eye
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0118, 0.0016, 6, 32), new THREE.MeshStandardMaterial({ color: 0xe0561a, emissive: 0x4a1500, emissiveIntensity: 0.5, roughness: 0.3 })); pg.add(ring);
            const hit = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); pg.add(hit);
            const place = (x, y, z) => { for (const o of [src, disc, hit, ring]) { o.position.set(x, y, z); o.rotation.set(0, Math.PI / 2, 0); } };
            place(0.06, 0.43, 0.09);
            const P0 = c.portal({ mesh: disc, src, to: 'nave', at: c.spawnOf('nave'), k: 60, ride: true, hint: 'Look closer', maxDist: 7, res: 0.5 });
            c.click(hit, () => window.pigeonhole?.enterPortal(P0), 'Look closer');
            c.click(nest, () => { c.sound.coo(0.8); c.say(nest, 'Coo. (The receipts are all for one coffee, every morning, since 1987.)'); }, 'The nest');
            // find the real eye on the model once it loads: the outermost point of the head, on its right side, a little behind the beak
            pg.userData.onEye = null;
            R.state.pg = pg; R.state.place = place;
            const wait = () => { if (!pg.userData.ready) return setTimeout(wait, 200); locateEye(pg, place); };
            wait();
          }
          glb('ph_korean_fire_extinguisher_01', { h: 0.55, x: S - 0.18, z: 2.4, ry: -Math.PI / 2 }, q);
          for (let i = 0; i < 6; i++) stick(q, STR, 2.5 + r() * 0.6, 0.15 + r() * 0.3, 2.47, Math.PI, 0.09 + r() * 0.05);
        }
        if (k === 3) {
          glb('ph_WetFloorSign_01', { h: 0.62, x: 3.0, z: 4.3, ry: 0.7 }, q);
          glb('rat', { len: 0.28, x: 2.45, z: 4.45, ry: 2.2 }, q);
          glb('ph_wooden_crate_01', { h: 0.4, x: 4.75, z: 2.5, ry: 0.15 }, q);
          glb('ph_fire_alarm', { h: 0.18, x: 4.0, y: 1.9, z: S - 0.06, ry: Math.PI }, q);
          // the lone figure: the overnight stock clerk on a milk crate, an Open Eye Flower for a head, watching you go down
          const clerk = new THREE.Group(); clerk.position.set(3.25, 0, 3.35); clerk.rotation.y = Math.PI / 4; q.add(clerk);
          c.glb('ph_metal_stool_01', { h: 0.5, x: 0, z: 0, parent: clerk });
          const cloth = new THREE.MeshStandardMaterial({ color: 0x1c2a4a, roughness: 0.85 }), apron = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.7 });
          const cap = (rr, len, m, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(rr, len, 4, 10), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); clerk.add(o); return o; };
          cap(0.075, 0.36, cloth, -0.12, 0.55, 0.2, Math.PI / 2); cap(0.075, 0.36, cloth, 0.12, 0.55, 0.2, Math.PI / 2);
          cap(0.07, 0.36, cloth, -0.12, 0.28, 0.42); cap(0.07, 0.36, cloth, 0.12, 0.28, 0.42);
          cap(0.17, 0.3, cloth, 0, 0.92, -0.02, -0.12); cap(0.175, 0.16, apron, 0, 0.86, 0.04, -0.12); cap(0.05, 0.36, cloth, -0.23, 0.78, 0.16, -0.75, 0.12); cap(0.05, 0.36, cloth, 0.23, 0.78, 0.16, -0.75, -0.12);
          const cv = document.createElement('canvas'); cv.width = cv.height = 256; c.eyeFlower(cv.getContext('2d'), 128, 128, 120, {});
          const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
          const head = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), new THREE.MeshBasicMaterial({ map: ht, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide })); head.position.set(0, 1.45, 0.02); clerk.add(head);
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x2e5d32 })); stem.position.y = 1.22; clerk.add(stem);
          if (main) {
            R.state.clerk = { head, cv, ht, look: [0, 0] };
            c.click(clerk, () => { const n = S0.base + 3; c.egg('stairs_clerk', 'The overnight clerk: "Been restocking since B1. The bottom shelf is at the bottom. Nobody has found the bottom."'); c.say(head, n > 3 ? `B${n}. You came down ${n} floors for a coffee?` : 'Coffee is upstairs. Everything else is down.'); }, 'The clerk');
          }
          for (let i = 0; i < 6; i++) stick(q, BOD, S - 0.012, 0.3 + r() * 0.6, 2.35 + r() * 0.35, -Math.PI / 2, 0.09 + r() * 0.05);
          for (let i = 0; i < 5; i++) stick(q, STR, 2.3 + r() * 0.65, 0.33, 3.55 + r() * 0.7, Math.PI / 2, 0.08);
        }
      }
      // merge this lap's stickers per atlas (one draw each)
      const by = new Map();
      for (const s of stk) { s.updateMatrix(); const g = s.geometry.clone().applyMatrix4(s.matrix); const key = s.material; const arr = by.get(key) || []; arr.push([g, s.parent]); by.set(key, arr); s.parent.remove(s); }
      for (const [mat, arr] of by) {
        const byQ = new Map(); for (const [g, p] of arr) { const a = byQ.get(p) || []; a.push(g); byQ.set(p, a); }
        for (const [p, gs] of byQ) { const m = new THREE.Mesh(c.merge(gs), mat); m.renderOrder = 2; p.add(m); }
      }
      return lap;
    };
    // where on the model the eye is: the head is the top tenth; the eye sits on its right flank, behind the beak
    function locateEye(pg, place) {
      pg.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(pg.matrixWorld).invert(), v = new THREE.Vector3(); const pts = [];
      pg.traverse((o) => { if (!o.isMesh || o.geometry.type === 'CircleGeometry' || o.geometry.type === 'SphereGeometry' || o.geometry.type === 'PlaneGeometry') return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 1) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv); pts.push(v.clone()); } });
      if (!pts.length) return;
      let ymax = -1e9, ymin = 1e9; for (const p of pts) { ymax = Math.max(ymax, p.y); ymin = Math.min(ymin, p.y); }
      const hh = ymax - ymin, head = pts.filter((p) => p.y > ymax - hh * 0.2);
      let zmax = -1e9, zmin = 1e9; for (const p of head) { zmax = Math.max(zmax, p.z); zmin = Math.min(zmin, p.z); }
      const hl = zmax - zmin, ze = zmax - hl * EYE_K.z, ye = ymax - hh * EYE_K.y;
      // the outermost point on the right flank near that height and depth
      let best = null; for (const p of head) if (Math.abs(p.z - ze) < hl * 0.08 && Math.abs(p.y - ye) < hh * 0.03 && (!best || p.x > best.x)) best = p;
      const x = (best ? best.x : 0.05) + 0.002;
      R.state.eye = { x, y: ye, z: ze, ymax, ymin, zmax, zmin };
      place(x, ye, ze);
    }
    const EYE_K = { z: 0.42, y: 0.075 };
    dress(0); dress(1); dress(-1);

    // ---------- lights: a window of five caged bulbs that slides along the spiral with you, and the nest's glow ----------
    const LW = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) c.light(0, 0, 0, 0xffc98a, 7, 9.5, () => LW[i]);
    c.light(0, 0, 0, 0xff9a4a, 2.2, 5, () => LW[5]);
    const lightAt = (n, lx, ly, lz) => { const q = ((n % 4) + 4) % 4; const [x, z] = rot(lx, lz, -q); return [x, -n * h + ly, z]; };

    // ---------- the lap you are on: signs, the cap, which laps are drawn above you ----------
    const setBase = (b) => {
      S0.base = b;
      for (const s of FIX.signs) drawSign(s.t, b + 4 * s.j + s.k);
      for (const f of FIX.b0) f.o.visible = b + 4 * f.j === 0;
      for (const f of FIX.notB0) f.o.visible = b + 4 * f.j !== 0;
      lapOf[-1].visible = b >= 4;
      const up = Math.min(4, b / 4); for (const im of inst) im.count = 9 + up;
      cap.visible = b / 4 <= 4; cap.position.y = (b / 4) * H;
      door.off = b !== 0;
    };
    const door = c.door({ x: 5.2, z: S - 0.25, r: 0.4, fn: () => { c.sound.door(); c.go('bodega', [3.6, -5.4, Math.PI]); } });
    R.state.setBase = setBase;
    setBase(0);
    // the wrap. Resolve the walls first (as the engine will), then if that step crossed the seam, change lap.
    const RR = 0.3;
    const collide = (nx, nz) => {
      for (const k of R.colliders) {
        if (k.off) continue;
        if (k.r !== undefined) { const dx = nx - k.x, dz = nz - k.z, d = Math.hypot(dx, dz), m = k.r + RR; if (d < m && d > 1e-6) { nx = k.x + dx / d * m; nz = k.z + dz / d * m; } continue; }
        const ex = k.x2 - k.x1, ez = k.z2 - k.z1, L2 = ex * ex + ez * ez || 1e-9; let t = ((nx - k.x1) * ex + (nz - k.z1) * ez) / L2; t = Math.max(0, Math.min(1, t));
        const px = k.x1 + ex * t, pz = k.z1 + ez * t, dx = nx - px, dz = nz - pz, d = Math.hypot(dx, dz);
        if (d < RR && d > 1e-6) { nx = px + dx / d * RR; nz = pz + dz / d * RR; }
      }
      return [nx, nz];
    };
    R.move = (P, nx, nz) => {
      const ox = P.x - R.x0, oz = P.z, zo = zone(ox, oz);
      // at B0 the way further up is bricked: a wall that exists only for someone standing on the top landing
      // (the same line, crossed from the flight below, is the way down to B4, so it cannot be a collider)
      if (S0.base === 0 && zo.k === 0 && zo.L && nz > BI - 0.7 && nx < A + 0.32) nx = A + 0.32;
      [nx, nz] = collide(nx, nz);
      const zn = zone(nx, nz);
      if (zo.k === 3 && !zo.L && zn.k === 0 && zn.L) { P.y += H; setBase(S0.base + 4); if (S0.base === 4 && !S0.told4) { S0.told4 = true; c.toast('B4. Four flights down. This is the landing you started on.', 4600); } }
      else if (zo.k === 0 && zo.L && zn.k === 3 && !zn.L) { if (S0.base === 0) return [ox, oz]; P.y -= H; setBase(S0.base - 4); }
      return [nx, nz];
    };
    const _v = new THREE.Vector3();
    let fr = 0;
    c.tick((t, dt, me) => {
      fr++;
      const d = -zone(me.x, me.z).y / h;
      const r0 = Math.round(d);
      for (let i = 0; i < 5; i++) { const n = r0 - 2 + i, L = R.lights[i]; const [x, y, z] = lightAt(n, 4.5, 2.0, 4.5); L[0] = x; L[1] = y; L[2] = z; LW[i] = Math.max(0, 1 - Math.abs(n - d) / 2.5) * (0.92 + 0.08 * Math.sin(t * 13 + n * 7) * Math.sin(t * 3.1 + n)); }
      { const n = [-2, 2, 6].reduce((a, b) => Math.abs(b - d) < Math.abs(a - d) ? b : a); const [x, y, z] = lightAt(n, 3.4, 1.9, 3.4); const L = R.lights[5]; L[0] = x; L[1] = y; L[2] = z; LW[5] = Math.max(0, 1 - Math.abs(n - d) / 2); }
      // the paintings one lap up and one lap down are the same paintings: keep their frames fitted to the art
      if (fr % 15 === 1) for (const [a, b] of FIX.ghosts) { b.position.copy(a.position); b.scale.copy(a.scale); b.visible = a.visible; }
      // the clerk's eye follows you
      const C = R.state.clerk;
      if (C && fr % 5 === 0) {
        C.head.getWorldPosition(_v); _v.x -= R.x0; const dx = me.x - _v.x, dy = me.y - _v.y, dz = me.z - _v.z;
        const q = new THREE.Quaternion(); C.head.getWorldQuaternion(q); const loc = new THREE.Vector3(dx, dy, dz).applyQuaternion(q.invert()).normalize();
        const look = [Math.max(-1, Math.min(1, loc.x * 1.8)), Math.max(-1, Math.min(1, -loc.y * 1.8))];
        const blink = (t % 6.3) < 0.14 ? 0.9 : 0;
        if (Math.abs(look[0] - C.look[0]) + Math.abs(look[1] - C.look[1]) > 0.06 || blink !== C.blink) { C.look = look; C.blink = blink; const g = C.cv.getContext('2d'); g.clearRect(0, 0, 256, 256); c.eyeFlower(g, 128, 128, 120, { look, lid: blink }); C.ht.needsUpdate = true; }
      }
    });
  },
  onEnter(c) {
    const S0 = c.R.state; if (S0.setBase) S0.setBase(0);
    if (!S0.told) { S0.told = true; setTimeout(() => c.toast('The stockroom stairs. Down is the only direction the signs believe in.', 4400), 1500); }
  },
};
