// III. THE PIGEON. Room 10: THE HOMING DOME (the brain)
// The pigeon's brain is a planetarium that knows the way home. A dark dome 17 m across the radius; the ceiling is the
// five boroughs drawn in light; magnetic field lines arc overhead; a pin on the ceiling follows you round the floor.
// HEADLINE ILLUSION: a pop up city (gaze and proximity reactive behaviour). The floor is a giant map of New York, and
// this room's forty New Yorkers lie flat on it, each at its own neighbourhood (a lookup of coordinates, projected to
// the floor at about 2.1 km a step). Walk near one and it rises off the map like a pop up book, unfolds to standing,
// turns to face you and its light comes on; walk away and it lies back down into the map. The floor shader draws a
// ripple round your feet and the rivers run with light.
const K = 2.1, LON0 = -73.98, LAT0 = 40.705, RD = 17, DRUM = 4.5;
const X = (lon) => (lon - LON0) * 84.2 / K, Z = (lat) => -(lat - LAT0) * 111.1 / K;
const HOODS = {
  'long island city': [-73.948, 40.745], 'greenwich village': [-74.0, 40.733], 'financial district': [-74.009, 40.707], 'tribeca': [-74.008, 40.716],
  'midtown': [-73.984, 40.754], 'rockaway beach': [-73.815, 40.584], 'belmont': [-73.887, 40.855], 'carroll gardens': [-73.999, 40.68],
  'central park': [-73.966, 40.782], 'park slope': [-73.978, 40.671], 'new dorp': [-74.115, 40.573], 'bayside': [-73.769, 40.763],
  'crown heights': [-73.944, 40.669], 'harlem': [-73.946, 40.811], 'washington heights': [-73.938, 40.842], 'chinatown': [-73.997, 40.716],
  'soho': [-74.0, 40.723], 'east village': [-73.984, 40.727], 'lower east side': [-73.985, 40.715], 'chelsea': [-74.0, 40.746],
  "hell's kitchen": [-73.992, 40.764], 'upper west side': [-73.975, 40.787], 'upper east side': [-73.956, 40.773], 'williamsburg': [-73.957, 40.714],
  'bushwick': [-73.921, 40.694], 'bed stuy': [-73.941, 40.687], 'dumbo': [-73.989, 40.703], 'red hook': [-74.012, 40.676], 'bay ridge': [-74.03, 40.626],
  'coney island': [-73.985, 40.575], 'astoria': [-73.923, 40.764], 'jackson heights': [-73.883, 40.755], 'flushing': [-73.833, 40.763],
  'jamaica': [-73.794, 40.702], 'sunnyside': [-73.924, 40.744], 'fordham': [-73.898, 40.861], 'mott haven': [-73.922, 40.809], 'riverdale': [-73.912, 40.9],
  'st george': [-74.077, 40.644], 'tottenville': [-74.24, 40.51],
};
const BORO = { manhattan: [-73.971, 40.776], brooklyn: [-73.95, 40.65], queens: [-73.82, 40.72], bronx: [-73.865, 40.845], 'staten island': [-74.15, 40.58], 'brooklyn/queens': [-73.915, 40.7] };
// pieces with no address are filed in the water, where the pigeon says it found them
const LOST = [[-74.05, 40.55], [-73.86, 40.61], [-73.77, 40.83], [-73.92, 40.535], [-74.045, 40.66], [-74.03, 40.795], [-74.13, 40.665], [-73.7, 40.6], [-74.2, 40.47], [-73.82, 40.66]];
const P_MAN = [[-74.019, 40.7005], [-74.017, 40.709], [-74.014, 40.73], [-74.01, 40.755], [-73.999, 40.77], [-73.987, 40.785], [-73.97, 40.81], [-73.958, 40.83], [-73.945, 40.85], [-73.932, 40.87], [-73.918, 40.877], [-73.91, 40.873], [-73.927, 40.855], [-73.933, 40.835], [-73.934, 40.81], [-73.929, 40.797], [-73.942, 40.777], [-73.958, 40.759], [-73.972, 40.743], [-73.971, 40.728], [-73.975, 40.711], [-73.999, 40.707], [-74.011, 40.701]];
const P_BX = [[-73.918, 40.877], [-73.91, 40.915], [-73.865, 40.903], [-73.838, 40.894], [-73.81, 40.883], [-73.786, 40.872], [-73.782, 40.847], [-73.795, 40.815], [-73.83, 40.805], [-73.865, 40.815], [-73.89, 40.8], [-73.915, 40.795], [-73.929, 40.797], [-73.934, 40.81], [-73.933, 40.835], [-73.927, 40.855], [-73.91, 40.873]];
const P_QN = [[-73.962, 40.739], [-73.955, 40.76], [-73.935, 40.78], [-73.91, 40.79], [-73.875, 40.785], [-73.855, 40.772], [-73.835, 40.795], [-73.8, 40.795], [-73.77, 40.79], [-73.755, 40.77], [-73.7, 40.752], [-73.708, 40.727], [-73.725, 40.7], [-73.74, 40.67], [-73.755, 40.64], [-73.775, 40.63], [-73.8, 40.645], [-73.835, 40.65], [-73.855, 40.655], [-73.865, 40.68], [-73.88, 40.69], [-73.905, 40.695], [-73.925, 40.71], [-73.943, 40.728]];
const P_BK = [[-73.962, 40.739], [-73.943, 40.728], [-73.925, 40.71], [-73.905, 40.695], [-73.88, 40.69], [-73.865, 40.68], [-73.855, 40.655], [-73.87, 40.635], [-73.895, 40.62], [-73.915, 40.595], [-73.93, 40.58], [-73.96, 40.575], [-74.0, 40.572], [-74.013, 40.58], [-74.04, 40.61], [-74.03, 40.638], [-74.02, 40.655], [-74.01, 40.675], [-74.018, 40.685], [-73.999, 40.698], [-73.99, 40.702], [-73.975, 40.705], [-73.965, 40.72]];
const P_RK = [[-73.942, 40.542], [-73.9, 40.56], [-73.85, 40.575], [-73.78, 40.59], [-73.74, 40.595], [-73.74, 40.605], [-73.78, 40.6], [-73.85, 40.588], [-73.9, 40.572], [-73.94, 40.552]];
const P_SI = [[-74.06, 40.645], [-74.09, 40.648], [-74.15, 40.645], [-74.19, 40.64], [-74.205, 40.625], [-74.205, 40.595], [-74.23, 40.56], [-74.25, 40.505], [-74.215, 40.5], [-74.16, 40.525], [-74.11, 40.545], [-74.07, 40.58], [-74.055, 40.6], [-74.055, 40.625]];
const P_NJ = [[-73.917, 40.96], [-73.94, 40.85], [-73.965, 40.8], [-74.01, 40.765], [-74.025, 40.735], [-74.033, 40.705], [-74.045, 40.685], [-74.075, 40.665], [-74.09, 40.655], [-74.14, 40.652], [-74.2, 40.648], [-74.215, 40.63], [-74.215, 40.59], [-74.25, 40.56], [-74.265, 40.515], [-74.27, 40.49], [-74.23, 40.47], [-74.15, 40.45], [-74.45, 40.38], [-74.45, 40.96]];
const P_WC = [[-73.917, 40.96], [-73.91, 40.915], [-73.865, 40.903], [-73.786, 40.872], [-73.76, 40.88], [-73.68, 40.96]];
const P_LI = [[-73.7, 40.8], [-73.7, 40.752], [-73.708, 40.727], [-73.725, 40.7], [-73.74, 40.67], [-73.755, 40.64], [-73.74, 40.61], [-73.55, 40.585], [-73.55, 40.8], [-73.65, 40.83]];
const BOROS = [['MANHATTAN', P_MAN, '#1a2350'], ['THE BRONX', P_BX, '#161d40'], ['QUEENS', P_QN, '#141a3a'], ['BROOKLYN', P_BK, '#18204a'], ['', P_RK, '#141a3a'], ['STATEN ISLAND', P_SI, '#151c3e']];
const BRIDGES = [[[-73.998, 40.712], [-73.991, 40.701], 'Brooklyn'], [[-73.993, 40.714], [-73.985, 40.703], 'Manhattan'], [[-73.98, 40.717], [-73.962, 40.711], 'Williamsburg'], [[-73.962, 40.759], [-73.944, 40.754], 'Queensboro'],
  [[-73.932, 40.8], [-73.912, 40.782], 'Triborough'], [[-73.945, 40.851], [-73.963, 40.853], 'George Washington'], [[-74.055, 40.603], [-74.03, 40.612], 'Verrazzano'], [[-73.833, 40.808], [-73.828, 40.789], 'Whitestone'],
  [[-73.795, 40.815], [-73.792, 40.795], 'Throgs Neck'], [[-74.142, 40.641], [-74.14, 40.652], 'Bayonne'], [[-74.198, 40.634], [-74.21, 40.641], 'Goethals'], [[-74.247, 40.522], [-74.258, 40.527], 'Outerbridge'], [[-73.885, 40.573], [-73.882, 40.588], 'Marine Parkway']];

export default {
  id: 'dome', name: 'The Homing Dome', scale: 'III · The pigeon', sound: 'dome',
  kicker: 'The brain of a homing pigeon is a planetarium that only knows one way. Walk the map. The city stands up to meet you.',
  sky: 0x02040c, fog: 0x050a1e, fogD: 0.008, hemi: [0x5a78d0, 0x140c20, 0.35], env: 0.3,
  post: { dream: 0.25, bloom: 1.0, vig: 0.5, grain: 0.1, ca: 0.002 },
  spawn: [-6, 13.2, 0],
  build(c) {
    const { THREE, R } = c;
    const S = R.state, V = THREE.Vector3;
    const W = c.MOBILE ? 2048 : 3072, PX = (x) => (x / (RD * 2) + 0.5) * W;
    const poly = (q, pts, sc = 1, cx = 0, cy = 0) => { q.beginPath(); pts.forEach(([lo, la], i) => { let x = PX(X(lo)), y = PX(Z(la)); x = cx + (x - cx) * sc; y = cy + (y - cy) * sc; i ? q.lineTo(x, y) : q.moveTo(x, y); }); q.closePath(); };
    const ctr = (pts) => { let x = 0, y = 0; for (const [lo, la] of pts) { x += PX(X(lo)); y += PX(Z(la)); } return [x / pts.length, y / pts.length]; };
    const m2px = W / (RD * 2);

    // ---------- the pieces: where each New Yorker lives, then nudged apart so no two stand in each other ----------
    const art = c.art(40); let lost = 0;
    const spots = art.map((p) => {
      const h = (p.h || '').toLowerCase().trim(), b = (p.b || '').toLowerCase().replace(/\s*\(.*\)/, '').trim();
      const ll = HOODS[h] || BORO[b] || LOST[lost++ % LOST.length];
      return { p, x: X(ll[0]) + (Math.random() - 0.5) * 0.3, z: Z(ll[1]) + (Math.random() - 0.5) * 0.3, home: !!(HOODS[h] || BORO[b]) };
    });
    const SP = [-6, 13.2];
    for (let it = 0; it < 300; it++) {
      for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) { const a = spots[i], b = spots[j]; let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d < 1.85) { if (d < 1e-4) { dx = 1; dz = 0; d = 1; } const k = (1.85 - d) / d * 0.5; a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; } }
      for (const a of spots) { const r = Math.hypot(a.x, a.z); if (r > 15) { a.x *= 15 / r; a.z *= 15 / r; } const ds = Math.hypot(a.x - SP[0], a.z - SP[1]); if (ds < 2.6) { a.x = SP[0] + (a.x - SP[0]) / ds * 2.6; a.z = SP[1] + (a.z - SP[1]) / ds * 2.6; } }
    }

    // ---------- the floor: New York drawn on a canvas, rivers as light (a mask the shader animates) ----------
    const mask = document.createElement('canvas'); mask.width = mask.height = W >> 1; const mq = mask.getContext('2d');
    const floorT = c.canvasTex(W, W, (q) => {
      // the water: the harbour, the rivers, the sound, the ocean, with tide lines
      const gw = q.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W * 0.7); gw.addColorStop(0, '#0a1e5a'); gw.addColorStop(1, '#040c2a'); q.fillStyle = gw; q.fillRect(0, 0, W, W);
      q.strokeStyle = 'rgba(0,229,255,.10)'; q.lineWidth = 2; for (let k = 0; k < 90; k++) { q.beginPath(); const y0 = k * W / 90; for (let x = 0; x <= W; x += 24) q.lineTo(x, y0 + Math.sin(x * 0.006 + k) * 14 + Math.sin(x * 0.019 + k * 2) * 5); q.stroke(); }
      // the mainland nobody here admits to
      for (const [pts, name, lo, la, rot] of [[P_NJ, 'NEW JERSEY (ALLEGEDLY)', -74.2, 40.78, -1.1], [P_WC, 'WESTCHESTER', -73.84, 40.94, 0], [P_LI, 'LONG ISLAND', -73.63, 40.7, -1.4]]) {
        q.fillStyle = '#0e1430'; poly(q, pts); q.fill(); q.strokeStyle = 'rgba(41,98,255,.5)'; q.lineWidth = 3; q.stroke();
        q.save(); q.translate(PX(X(lo)), PX(Z(la))); q.rotate(rot); q.fillStyle = 'rgba(150,170,230,.6)'; q.font = `700 ${m2px * 0.42}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(name, 0, 0); q.restore();
      }
      // the five boroughs, each with contour lines walking in from the shore
      for (const [name, pts, col] of BOROS) {
        q.fillStyle = col; poly(q, pts); q.fill();
        const [cx, cy] = ctr(pts);
        for (let k = 1; k <= 6; k++) { q.strokeStyle = `rgba(0,229,255,${0.22 - k * 0.025})`; q.lineWidth = 2; poly(q, pts, 1 - k * 0.13, cx, cy); q.stroke(); }
        q.shadowColor = '#00e5ff'; q.shadowBlur = 18; q.strokeStyle = '#7ff4ff'; q.lineWidth = 5; poly(q, pts); q.stroke(); q.shadowBlur = 0;
        void name;
      }
      // Manhattan's grid, at the island's own angle, clipped to the island
      q.save(); poly(q, P_MAN); q.clip(); q.strokeStyle = 'rgba(240,244,248,.10)'; q.lineWidth = 1.5; q.translate(PX(X(-73.97)), PX(Z(40.78))); q.rotate(-0.51);
      for (let k = -60; k <= 60; k++) { q.beginPath(); q.moveTo(-W, k * m2px * 0.28); q.lineTo(W, k * m2px * 0.28); q.stroke(); }
      for (let k = -14; k <= 14; k++) { q.beginPath(); q.moveTo(k * m2px * 0.13, -W); q.lineTo(k * m2px * 0.13, W); q.stroke(); }
      q.restore();
      // the parks, dark and green
      q.fillStyle = '#0d3a2a'; poly(q, [[-73.9815, 40.7681], [-73.973, 40.7644], [-73.9493, 40.7968], [-73.958, 40.8005]]); q.fill(); q.strokeStyle = '#2bd38a'; q.lineWidth = 3; q.stroke();
      q.beginPath(); q.ellipse(PX(X(-73.969)), PX(Z(40.662)), m2px * 0.5, m2px * 0.7, 0.3, 0, 7); q.fill(); q.stroke();
      q.beginPath(); q.ellipse(PX(X(-73.845)), PX(Z(40.74)), m2px * 0.45, m2px * 0.9, 0, 0, 7); q.fill(); q.stroke();
      // the airports, labelled for the pigeons
      q.fillStyle = 'rgba(255,176,32,.8)'; q.font = `600 ${m2px * 0.16}px ${c.MONO}`; q.textAlign = 'center';
      for (const [lo, la, s] of [[-73.779, 40.641, 'JFK. PLANES, NOT BIRDS'], [-73.874, 40.777, 'LGA. ALSO PLANES']]) { q.fillText(s, PX(X(lo)), PX(Z(la))); q.strokeStyle = 'rgba(255,176,32,.6)'; q.lineWidth = 3; q.strokeRect(PX(X(lo)) - m2px * 0.35, PX(Z(la)) - m2px * 0.35, m2px * 0.7, m2px * 0.5); }
      // the ferry, a dashed line of light across the harbour
      q.setLineDash([m2px * 0.12, m2px * 0.08]); q.strokeStyle = '#ffb020'; q.lineWidth = 6; q.beginPath(); q.moveTo(PX(X(-74.073)), PX(Z(40.643))); q.lineTo(PX(X(-74.013)), PX(Z(40.701))); q.stroke(); q.setLineDash([]);
      // the bridges, drawn flat under the glowing arcs that stand on them
      q.strokeStyle = '#f0f4f8'; q.lineWidth = 6; for (const [a, b] of BRIDGES) { q.beginPath(); q.moveTo(PX(X(a[0])), PX(Z(a[1]))); q.lineTo(PX(X(b[0])), PX(Z(b[1]))); q.stroke(); }
      // neighbourhood names, small, mono, every one this room knows
      q.font = `600 ${m2px * 0.13}px ${c.MONO}`; q.textAlign = 'left';
      for (const [n, [lo, la]] of Object.entries(HOODS)) { const x = PX(X(lo)), y = PX(Z(la)); q.fillStyle = '#ff2e63'; q.beginPath(); q.arc(x, y, 6, 0, 7); q.fill(); q.fillStyle = 'rgba(240,244,248,.75)'; q.fillText(n.toUpperCase(), x + 10, y - 8); }
      // the borough names, big, in light
      q.textAlign = 'center'; q.shadowColor = '#00e5ff'; q.shadowBlur = 14; q.fillStyle = 'rgba(240,244,248,.88)';
      for (const [s, lo, la, rot, sz] of [['MANHATTAN', -73.963, 40.795, -1.2, 0.5], ['BROOKLYN', -73.94, 40.632, -0.15, 0.75], ['QUEENS', -73.8, 40.715, 0, 0.75], ['THE BRONX', -73.85, 40.858, 0, 0.6], ['STATEN ISLAND', -74.15, 40.592, -0.7, 0.5]]) { q.save(); q.translate(PX(X(lo)), PX(Z(la))); q.rotate(rot); q.font = `800 ${m2px * sz}px ${c.FONT}`; q.fillText(s, 0, 0); q.restore(); }
      q.shadowBlur = 0;
      // the water names
      q.fillStyle = 'rgba(0,229,255,.55)'; q.font = `italic 600 ${m2px * 0.24}px ${c.SERIF}`;
      for (const [s, lo, la, rot] of [['East River', -73.958, 40.735, -1.2], ['Hudson', -74.018, 40.79, -1.25], ['Upper Bay', -74.045, 40.668, 0], ['Lower Bay', -74.05, 40.55, 0], ['Jamaica Bay', -73.84, 40.618, 0], ['The Atlantic, briefly', -73.88, 40.52, 0], ['Long Island Sound', -73.75, 40.83, -0.3]]) { q.save(); q.translate(PX(X(lo)), PX(Z(la))); q.rotate(rot); q.fillText(s, 0, 0); q.restore(); }
      // the lost and unaddressed: filed in the water, where the pigeon found them
      q.fillStyle = 'rgba(255,46,99,.7)'; q.font = `600 ${m2px * 0.11}px ${c.MONO}`; for (const [lo, la] of LOST.slice(0, lost)) q.fillText('ADDRESS UNKNOWN. THE PIGEON KNOWS.', PX(X(lo)), PX(Z(la)) + m2px * 0.85);
      // the compass rose, in the ocean off the Rockaways, and its needle is a pigeon
      { const cx = PX(9.2), cy = PX(12.2), r = m2px * 1.9; q.save(); q.translate(cx, cy);
        for (let k = 0; k < 32; k++) { q.rotate(Math.PI / 16); q.strokeStyle = k % 8 === 7 ? '#f0f4f8' : 'rgba(0,229,255,.5)'; q.lineWidth = k % 8 === 7 ? 4 : 2; q.beginPath(); q.moveTo(0, -r * (k % 4 === 3 ? 0.55 : 0.75)); q.lineTo(0, -r); q.stroke(); }
        for (const rr of [1, 0.78, 0.5]) { q.strokeStyle = 'rgba(190,133,76,.9)'; q.lineWidth = 4; q.beginPath(); q.arc(0, 0, r * rr, 0, 7); q.stroke(); }
        for (let k = 0; k < 4; k++) { q.save(); q.rotate(k * Math.PI / 2); q.fillStyle = k ? 'rgba(41,98,255,.85)' : '#ff2e63'; q.beginPath(); q.moveTo(0, -r * 0.95); q.lineTo(r * 0.1, -r * 0.2); q.lineTo(-r * 0.1, -r * 0.2); q.fill(); q.restore(); }
        // the pigeon at the centre, head to the north
        q.fillStyle = '#f0f4f8'; q.beginPath(); q.ellipse(0, r * 0.05, r * 0.13, r * 0.26, 0, 0, 7); q.fill(); q.beginPath(); q.arc(0, -r * 0.24, r * 0.08, 0, 7); q.fill();
        q.beginPath(); q.moveTo(0, -r * 0.34); q.lineTo(r * 0.03, -r * 0.28); q.lineTo(-r * 0.03, -r * 0.28); q.fillStyle = '#ffb020'; q.fill();
        q.fillStyle = '#c9ced8'; q.beginPath(); q.moveTo(-r * 0.12, -r * 0.02); q.quadraticCurveTo(-r * 0.42, r * 0.05, -r * 0.3, r * 0.28); q.quadraticCurveTo(-r * 0.15, r * 0.2, -r * 0.1, r * 0.12); q.fill(); q.beginPath(); q.moveTo(r * 0.12, -r * 0.02); q.quadraticCurveTo(r * 0.42, r * 0.05, r * 0.3, r * 0.28); q.quadraticCurveTo(r * 0.15, r * 0.2, r * 0.1, r * 0.12); q.fill();
        q.fillStyle = '#f0f4f8'; q.font = `800 ${r * 0.22}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('N', 0, -r * 1.08); q.font = `600 ${r * 0.09}px ${c.MONO}`; q.fillText('HOME IS ALWAYS THIS WAY', 0, r * 1.14);
        q.restore(); }
      // the title block, by the spawn, like the corner of a real chart
      q.fillStyle = 'rgba(240,244,248,.85)'; q.textAlign = 'left'; q.font = `800 ${m2px * 0.3}px ${c.SERIF}`; q.fillText('THE HOMING DOME', PX(-10.6), PX(15.0));
      q.font = `600 ${m2px * 0.11}px ${c.MONO}`; q.fillText('NEW YORK AS A PIGEON KNOWS IT.  SCALE: ONE STEP, ONE NEIGHBORHOOD.  WALK NORTH.', PX(-10.6), PX(15.35));
      // the water mask: everything that is not land
      mq.fillStyle = '#fff'; mq.fillRect(0, 0, W, W); mq.scale(0.5, 0.5); mq.fillStyle = '#000'; for (const pts of [P_NJ, P_WC, P_LI, ...BOROS.map((b) => b[1])]) { poly(mq, pts); mq.fill(); }
    });
    const maskT = new THREE.CanvasTexture(mask);
    const FU = { tMap: { value: floorT }, tMask: { value: maskT }, uT: { value: 0 }, uMe: { value: new THREE.Vector2(SP[0], SP[1]) } };
    const floor = new THREE.Mesh(new THREE.CircleGeometry(RD, 128).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: FU, fog: false,
      vertexShader: 'varying vec2 vUv; varying vec2 vW; void main(){ vUv = uv; vW = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tMap, tMask; uniform float uT; uniform vec2 uMe; varying vec2 vUv; varying vec2 vW;
        void main(){ vec3 c = texture2D(tMap, vUv).rgb * 0.75; float w = texture2D(tMask, vUv).r;
          // the rivers run with light: contour lines of a slow field, drifting with the tide
          float fl = sin(vW.x * 0.9 + uT * 0.35) * 0.6 + sin(vW.y * 1.3 - uT * 0.27 + vW.x * 0.4) * 0.6 + sin((vW.x + vW.y) * 2.1 + uT * 0.6) * 0.25;
          float iso = abs(fract(fl * 2.2) - 0.5), ln = smoothstep(0.07, 0.0, iso);
          float sp = pow(sin(dot(vW, vec2(0.7, 1.1)) * 2.4 - uT * 1.8) * 0.5 + 0.5, 8.);
          c += w * (vec3(0.03, 0.1, 0.42) * 0.35 + vec3(0., 0.75, 0.95) * ln * (0.35 + sp * 0.9) + vec3(0.16, 0.38, 1.) * sp * 0.12);
          float d = distance(vW, uMe);
          c += vec3(0., 0.9, 1.) * (smoothstep(0.05, 0., abs(d - 0.55 - fract(uT * 0.5) * 1.4)) * (1. - fract(uT * 0.5)) * 0.9 + smoothstep(0.7, 0., d) * 0.12);
          c *= smoothstep(${RD.toFixed(1)}, ${(RD - 0.6).toFixed(1)}, length(vW)) * 0.8 + 0.2;
          gl_FragColor = vec4(c, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` }));
    c.add(floor);

    // ---------- the drum: a skyline at night all the way round the horizon, and paint running off the cornice ----------
    {
      const skyT = c.canvasTex(4096, 512, (q, w, h) => {
        const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#02040c'); g.addColorStop(0.55, '#06163a'); g.addColorStop(1, '#1a1050'); q.fillStyle = g; q.fillRect(0, 0, w, h);
        q.strokeStyle = 'rgba(41,98,255,.25)'; q.lineWidth = 2; for (let k = 0; k < 14; k++) { q.beginPath(); for (let x = 0; x <= w; x += 16) q.lineTo(x, 40 + k * 22 + Math.sin(x * 0.004 + k) * 10); q.stroke(); }
        let x = 0; while (x < w) { const bw = 30 + Math.random() * 90, bh = 60 + Math.random() * (Math.random() < 0.1 ? 300 : 180); q.fillStyle = '#03050f'; q.fillRect(x, h - bh, bw, bh);
          if (Math.random() < 0.25) { q.fillRect(x + bw * 0.3, h - bh - 26, bw * 0.3, 22); q.fillRect(x + bw * 0.32, h - bh - 8, 3, 8); q.fillRect(x + bw * 0.55, h - bh - 8, 3, 8); }
          for (let yy = h - bh + 8; yy < h - 6; yy += 11) for (let xx = x + 5; xx < x + bw - 6; xx += 9) if (Math.random() < 0.18) { q.fillStyle = Math.random() < 0.8 ? 'rgba(255,200,120,.85)' : 'rgba(0,229,255,.8)'; q.fillRect(xx, yy, 4, 6); }
          x += bw + Math.random() * 6; }
      });
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(RD, RD, DRUM, 128, 1, true).translate(0, DRUM / 2, 0), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, toneMapped: false, color: 0xaab4d8 })); c.add(drum);
      const corn = new THREE.Mesh(new THREE.TorusGeometry(RD - 0.08, 0.12, 8, 160).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xbe854c, metalness: 1, roughness: 0.3 })); corn.position.y = DRUM; c.add(corn);
      const dp = [], dv = [];
      for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2 + Math.random() * 0.05, len = 0.3 + Math.pow(Math.random(), 2) * 2.6, r = RD - 0.2;
        const arr = k % 3 ? dp : dv; const x = Math.cos(a) * r, z = Math.sin(a) * r;
        arr.push(new THREE.CapsuleGeometry(0.035, len, 3, 6).translate(x, DRUM - 0.05 - len / 2, z), new THREE.SphereGeometry(0.06, 8, 6).translate(x, DRUM - 0.1 - len, z)); }
      c.add(new THREE.Mesh(c.merge(dp), new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.15, clearcoat: 1, emissive: 0xff2e63, emissiveIntensity: 0.5 })));
      c.add(new THREE.Mesh(c.merge(dv), new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.15, clearcoat: 1, emissive: 0x6f23a8, emissiveIntensity: 0.6 })));
      // the wall all the way round, walkable to the edge
      for (let k = 0; k < 48; k++) { const a0 = k / 48 * Math.PI * 2, a1 = (k + 1) / 48 * Math.PI * 2, r = RD - 0.55; c.wall(Math.cos(a0) * r, Math.sin(a0) * r, Math.cos(a1) * r, Math.sin(a1) * r); }
    }

    // ---------- the ceiling: the five boroughs drawn in light, mirrored so it reads from below ----------
    {
      const CW = c.MOBILE ? 1536 : 2048, cp = (x) => (x / (RD * 2) + 0.5) * CW, cm = CW / (RD * 2);
      const cpoly = (q, pts, sc = 1, cx = 0, cy = 0) => { q.beginPath(); pts.forEach(([lo, la], i) => { let x = cp(X(lo)), y = cp(Z(la)); x = cx + (x - cx) * sc; y = cy + (y - cy) * sc; i ? q.lineTo(x, y) : q.moveTo(x, y); }); q.closePath(); };
      const ceilT = c.canvasTex(CW, CW, (q) => {
        q.fillStyle = '#01030a'; q.fillRect(0, 0, CW, CW);
        for (let k = 0; k < 1400; k++) { const a = Math.random(); q.fillStyle = `rgba(${200 + a * 55},${210 + a * 40},255,${0.2 + a * 0.7})`; q.fillRect(Math.random() * CW, Math.random() * CW, a > 0.95 ? 3 : 1.5, a > 0.95 ? 3 : 1.5); }
        // rivers of light: the water glows, the land is the dark between
        q.save(); q.beginPath(); q.arc(CW / 2, CW / 2, CW / 2, 0, 7); q.clip();
        q.globalCompositeOperation = 'lighter';
        for (const [, pts] of BOROS) { const [cx, cy] = (() => { let x = 0, y = 0; for (const [lo, la] of pts) { x += cp(X(lo)); y += cp(Z(la)); } return [x / pts.length, y / pts.length]; })();
          q.fillStyle = 'rgba(6,22,58,.9)'; cpoly(q, pts); q.fill();
          for (let k = 0; k <= 7; k++) { q.strokeStyle = k ? `rgba(0,229,255,${0.5 - k * 0.055})` : 'rgba(127,244,255,1)'; q.lineWidth = k ? 1.6 : 3.5; q.shadowColor = '#00e5ff'; q.shadowBlur = k ? 0 : 16; cpoly(q, pts, 1 - k * 0.11, cx, cy); q.stroke(); } }
        q.shadowBlur = 0;
        q.strokeStyle = 'rgba(41,98,255,.6)'; q.lineWidth = 2; for (const pts of [P_NJ, P_WC, P_LI]) { cpoly(q, pts); q.stroke(); }
        // every New Yorker in the room is a star at home, joined into one constellation: the pigeon
        q.strokeStyle = 'rgba(240,244,248,.35)'; q.lineWidth = 1.2; q.beginPath(); spots.forEach((s, i) => { const x = cp(s.x), y = cp(s.z); i ? q.lineTo(x, y) : q.moveTo(x, y); }); q.stroke();
        for (const s of spots) { const x = cp(s.x), y = cp(s.z); const g = q.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,46,99,.8)'); g.addColorStop(1, 'rgba(255,46,99,0)'); q.fillStyle = g; q.fillRect(x - 14, y - 14, 28, 28); }
        q.restore();
        // the names, flipped so they read right side up to someone lying on the floor with their head to the north
        q.fillStyle = 'rgba(240,244,248,.9)'; q.textAlign = 'center'; q.shadowColor = '#00e5ff'; q.shadowBlur = 10;
        for (const [s, lo, la, sz] of [['MANHATTAN', -73.99, 40.84, 0.55], ['BROOKLYN', -73.94, 40.632, 0.8], ['QUEENS', -73.8, 40.715, 0.8], ['THE BRONX', -73.85, 40.87, 0.6], ['STATEN ISLAND', -74.15, 40.58, 0.5], ['YOU ARE HOME', -73.98, 40.43, 0.7]]) { q.save(); q.translate(cp(X(lo)), cp(Z(la))); q.scale(1, -1); q.font = `800 ${cm * sz}px ${c.FONT}`; q.fillText(s, 0, 0); q.restore(); }
      });
      const g = new THREE.SphereGeometry(RD, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      const pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (RD * 2), 0.5 - pos.getZ(i) / (RD * 2));
      g.translate(0, DRUM, 0);
      c.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: ceilT, side: THREE.BackSide, fog: false, toneMapped: false })));
    }

    // ---------- magnetic field lines: the pigeon's real map, arcing north to south, pulsing ----------
    {
      const tubes = [];
      for (let k = 0; k < 14; k++) {
        const psi = -1.05 + k / 13 * 2.1, Hk = 11 + Math.random() * 5, L0 = 13.5 + Math.random() * 1.5;
        const curve = new (class extends THREE.Curve { getPoint(t, o = new V()) { const h = Math.sin(Math.PI * t) * Hk; return o.set(Math.sin(psi) * h, 0.15 + Math.cos(psi) * h, -Math.cos(Math.PI * t) * L0 * (1 - 0.15 * Math.sin(Math.PI * t))); } })();
        tubes.push(new THREE.TubeGeometry(curve, 160, 0.035 + Math.random() * 0.02, 5, false));
      }
      const FL = { uT: { value: 0 } };
      c.add(new THREE.Mesh(c.merge(tubes), new THREE.ShaderMaterial({ uniforms: FL, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT; varying vec2 vUv; void main(){ float p = fract(vUv.x * 4. - uT * 0.25); float pulse = smoothstep(0.0, 0.08, p) * smoothstep(0.35, 0.08, p);
          vec3 c = mix(vec3(0.16, 0.38, 1.), vec3(0., 0.9, 1.), vUv.x) * (0.22 + pulse * 1.6); c += vec3(1., 0.18, 0.39) * smoothstep(0.97, 1., sin(vUv.x * 40. - uT * 3.) * 0.5 + 0.5) * 0.4;
          gl_FragColor = vec4(c, 1.);
          #include <colorspace_fragment>
        }` })));
      S.FL = FL;
    }

    // ---------- the bridges, as glowing arcs standing on the map ----------
    {
      const arcs = [], towers = [];
      for (const [a, b] of BRIDGES) {
        const p0 = new V(X(a[0]), 0.02, Z(a[1])), p1 = new V(X(b[0]), 0.02, Z(b[1])), len = p0.distanceTo(p1), mid = p0.clone().lerp(p1, 0.5); mid.y = 0.25 + len * 0.35;
        arcs.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, mid, p1), 24, 0.025, 5, false));
        for (const t of [0.25, 0.75]) { const q = p0.clone().lerp(p1, t); towers.push(new THREE.CylinderGeometry(0.02, 0.025, mid.y * 0.8, 6).translate(q.x, mid.y * 0.4, q.z)); }
        arcs.push(new THREE.TubeGeometry(new THREE.LineCurve3(p0.clone().setY(0.06), p1.clone().setY(0.06)), 4, 0.02, 4, false));
      }
      c.add(new THREE.Mesh(c.merge(arcs), new THREE.MeshBasicMaterial({ color: 0x9ff6ff, toneMapped: false })));
      c.add(new THREE.Mesh(c.merge(towers), new THREE.MeshBasicMaterial({ color: 0xf0f4f8, toneMapped: false })));
    }

    // ---------- the pop up New Yorkers ----------
    const paper = new THREE.MeshStandardMaterial({ color: 0xf0ead8, roughness: 0.85, side: THREE.DoubleSide });
    const ringM = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false });
    const ringG = new THREE.RingGeometry(0.22, 0.3, 32).rotateX(-Math.PI / 2);
    const cards = spots.map((s, i) => {
      const base = new THREE.Group(); base.position.set(s.x, 0.01 + (i % 7) * 0.004, s.z); base.rotation.y = Math.atan2(SP[0] - s.x, SP[1] - s.z); c.add(base);
      const hinge = new THREE.Group(); hinge.rotation.x = -Math.PI / 2; base.add(hinge);
      // the paper stand that folds out of the map, and the picture on it
      const stem = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.05), paper); stem.position.set(0, 0.52, -0.012); hinge.add(stem);
      const tabL = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.7), paper), tabR = tabL.clone(); tabL.position.set(-0.2, 0.35, -0.01); tabR.position.set(0.2, 0.35, -0.01); hinge.add(tabL, tabR);
      const fr = c.hang(s.p, 0, 1.55, 0, 0, 1.2, 'bone', { parent: hinge, light: true });
      const ring = new THREE.Mesh(ringG, ringM.clone()); ring.position.y = 0.01; base.add(ring);
      // the picture light is off while it lies in the map
      const pool = fr.children.find((m) => m.material && m.material.blending === THREE.AdditiveBlending); if (pool) pool.visible = false;
      c.post(s.x, s.z, 0.55);
      return { s, base, hinge, fr, ring, tabL, tabR, stem, pool: fr.children.find((m) => m.material && m.material.blending === THREE.AdditiveBlending), u: 0, v: 0, up: 0, yaw: base.rotation.y };
    });

    // ---------- the zenith: the room's Open Eye Flower, which watches you and moves the pin ----------
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 512; const et = new THREE.CanvasTexture(cv); et.colorSpace = THREE.SRGBColorSpace;
      const eye = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ map: et, transparent: true, toneMapped: false, fog: false, side: THREE.DoubleSide }));
      eye.position.set(0, DRUM + RD - 0.25, 0); eye.rotation.x = Math.PI / 2; c.add(eye);
      S.eye = { cv, et, eye, k: '' };
      // the pin on the ceiling that is always over you
      const pin = new THREE.Group(); c.add(pin);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff2e63, toneMapped: false })); head.position.y = -0.35; pin.add(head);
      const needle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 10), new THREE.MeshBasicMaterial({ color: 0xf0f4f8, toneMapped: false })); needle.rotation.x = Math.PI; needle.position.y = -0.75; pin.add(needle);
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 40), new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.8, toneMapped: false, side: THREE.DoubleSide, depthWrite: false })); halo.rotation.x = Math.PI / 2; halo.position.y = -0.05; pin.add(halo);
      const tag = c.sign('YOU ARE HOME', { w: 2.6, h: 0.42, bg: null, fg: '#ff2e63', font: c.FONT, glow: 18, px: 160 }); tag.material.side = THREE.DoubleSide; pin.add(tag);
      S.pin = { pin, tag, halo };
    }

    // ---------- the balcony: a window out of the brain, with the map plate behind the glass ----------
    {
      const bz = 0, bx = -RD + 0.15;
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.3)); pane.position.set(bx, 2.25, bz); pane.rotation.y = Math.PI / 2; c.add(pane);
      c.pocket({ mask: pane, sheen: 0.1, build: (grp) => {
        const bg = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.MeshBasicMaterial({ color: 0x06163a, side: THREE.BackSide, fog: false })); bg.position.set(bx, 0, bz); grp.add(bg);
        c.plate('p_map', { x: bx + 4.5, z: bz, ry: Math.PI / 2, zMin: 5.0, far: 70, parent: grp });
      } });
      const fm = new THREE.MeshStandardMaterial({ color: 0xbe854c, metalness: 1, roughness: 0.3 });
      for (const [w, h, y, z] of [[0.12, 2.5, 2.25, bz - 1.75], [0.12, 2.5, 2.25, bz + 1.75], [0.12, 0.12, 3.45, bz], [0.12, 0.12, 1.05, bz]]) c.add(c.slab(0.16, h, w === 0.12 && h === 0.12 ? 3.62 : w, fm, bx + 0.06, y, z));
      // the rail and a ledge, so nobody walks into the view
      c.box(0.9, 0.08, 4.2, new THREE.MeshStandardMaterial({ color: 0x0b0f1e, roughness: 0.6 }), bx + 0.9, 0.04, bz, { collide: false });
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.0, 10).rotateX(Math.PI / 2), fm); rail.position.set(bx + 1.35, 1.0, bz); c.add(rail);
      for (let k = -2; k <= 2; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), fm); p.position.set(bx + 1.35, 0.5, bz + k * 0.95); c.add(p); }
      c.wall(bx + 1.4, bz - 2.1, bx + 1.4, bz + 2.1);
      const bs = c.sign('BALCONY.  THE VIEW FROM INSIDE A PIGEON, LOOKING FURTHER IN.', { w: 3.3, h: 0.14, bg: '#02040c', fg: '#e9e2cf', font: c.MONO, px: 80 }); bs.position.set(bx + 0.06, 3.65, bz); bs.rotation.y = Math.PI / 2; c.add(bs);
      c.click(pane, () => c.egg('dome_jersey', 'That way is New Jersey. No pigeon has ever flown home to New Jersey. Several have tried. They came back.'), 'The balcony window');
      // the lone figure, at the rail, looking out, back to the room
      const fig = new THREE.Group(); fig.position.set(bx + 1.75, 0, bz + 0.6); fig.rotation.y = -Math.PI / 2; c.add(fig);
      const coat = new THREE.MeshStandardMaterial({ color: 0x12162a, roughness: 0.8 }), pants = new THREE.MeshStandardMaterial({ color: 0x0b0d14, roughness: 0.85 });
      const cap = (r, h, m, x, y, z, rz = 0, rx = 0) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 10), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); fig.add(o); return o; };
      cap(0.075, 0.7, pants, -0.1, 0.45, 0); cap(0.075, 0.7, pants, 0.1, 0.45, 0); cap(0.19, 0.5, coat, 0, 1.15, 0); cap(0.06, 0.45, coat, -0.24, 1.08, -0.08, 0.15, 0.4); cap(0.06, 0.45, coat, 0.24, 1.08, -0.08, -0.15, 0.4);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; c.eyeFlower(cv.getContext('2d'), 128, 128, 120, { lid: 0, look: [0, -0.4] });
      const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
      const hd = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: ht, alphaTest: 0.5, side: THREE.DoubleSide })); hd.position.set(0, 1.72, -0.02); hd.rotation.y = Math.PI; fig.add(hd);
      c.post(fig.position.x, fig.position.z, 0.35);
      c.click(fig, () => c.say(hd, 'I come up here to see where I live. It is right behind me. It always is.'), 'Someone at the rail');
      const bin = c.glb('ph_binoculars', { len: 0.2, x: bx + 1.4, y: 1.04, z: bz - 1.2, ry: Math.PI / 2 });
      void bin;
    }

    // ---------- the doors: the museum to the north, the wing to the east ----------
    const arch = (x, z, ry, title, sub, col) => {
      const t = c.canvasTex(256, 420, (q) => { const g = q.createRadialGradient(128, 280, 10, 128, 280, 260); g.addColorStop(0, col[0]); g.addColorStop(0.55, col[1]); g.addColorStop(1, '#02040c'); q.fillStyle = g; q.beginPath(); q.moveTo(0, 420); q.lineTo(0, 128); q.arc(128, 128, 128, Math.PI, 0); q.lineTo(256, 420); q.fill(); });
      const d = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); d.position.set(x, 1.3, z); d.rotation.y = ry; c.add(d);
      const fr = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.06, 8, 32, Math.PI), new THREE.MeshStandardMaterial({ color: 0xbe854c, metalness: 1, roughness: 0.3 })); fr.position.set(x, 1.72, z); fr.rotation.y = ry; c.add(fr);
      for (const s of [-1, 1]) { const p = c.slab(0.12, 1.72, 0.12, fr.material, 0, 0.86, 0); p.position.set(x + Math.cos(ry) * s * 0.86, 0.86, z - Math.sin(ry) * s * 0.86); c.add(p); }
      const a = c.sign(title, { w: 3.2, h: 0.34, bg: null, fg: '#f0f4f8', font: c.SERIF, weight: 600, glow: 12, px: 120 }); a.position.set(x, 3.0, z); a.rotation.y = ry; c.add(a);
      const b = c.sign(sub, { w: 2.6, h: 0.13, bg: null, fg: col[0], font: c.MONO, glow: 6, px: 80 }); b.position.set(x, 2.72, z); b.rotation.y = ry; c.add(b);
      const st = (window.STICKER_GROUPS || {}).museum || [];
      for (let k = 0; k < 6; k++) { const s = -1 + (k % 2) * 2, o = s * (0.98 + Math.random() * 0.25), y = 0.6 + Math.random() * 1.4; if (st[k + (title.length % 12)]) c.sticker(st[k + (title.length % 12)], x + Math.cos(ry) * o + Math.sin(ry) * 0.03, y, z - Math.sin(ry) * o + Math.cos(ry) * 0.03, { ry, size: 0.2 + Math.random() * 0.1 }); }
    };
    arch(0, -RD + 0.08, 0, 'THE MUSEUM OF MODERN PIGEON', 'IV  THE MUSEUM  ·  ALL ROADS LEAD HERE, EVENTUALLY', ['#ffe0a0', '#be854c']);
    arch(RD - 0.08, 0, -Math.PI / 2, 'BACK TO THE WING', 'THE WAY YOU CAME. THE PIGEON REMEMBERS IT.', ['#9ff6ff', '#2962ff']);
    c.door({ x: 0, z: -RD + 0.95, r: 0.7, to: 'museum' });
    c.door({ x: RD - 0.95, z: 0, r: 0.7, to: 'wing' });

    // ---------- the props: a few real things on the map, at map scale, which is no scale at all ----------
    c.glb('ph_gothic_statue', { h: 0.55, x: X(-74.0445), z: Z(40.6892), ry: 0.3 });
    const wh = c.glb('ph_bronze_whale_statue', { len: 1.4, x: X(-73.86), z: Z(40.5), ry: 1.2 });
    c.click(wh, () => c.egg('dome_whale', 'Bronze whale, sighted off the Rockaways. Again. The pigeons have reported it every summer since 1938. Nobody believes the pigeons.'), 'A whale');
    c.glb('ph_rubber_duck_toy', { len: 0.25, x: X(-73.83), z: Z(40.615), ry: 2 });
    c.glb('ph_magnifying_glass_01', { len: 0.45, x: X(-73.995), z: Z(40.735) + 0.6, ry: 0.8 });
    const radio = c.glb('ph_vintage_radio_transceiver', { len: 0.55, x: 9.2 + 2.6, z: 12.2 - 0.6, ry: -0.9 });
    c.click(radio, () => c.say(radio, 'Homing signal: strong. Bread signal: stronger.'), 'The homing signal');
    // the pigeons that live on the map, each at home
    const pigs = [];
    for (const [lo, la, ry] of [[-73.97, 40.775, 1], [-73.95, 40.665, -0.5], [-73.82, 40.73, 2], [-74.12, 40.59, 0.4], [-73.87, 40.85, -2], [-74.01, 40.705, 3]]) pigs.push(c.glb('pigeon', { h: 0.3, x: X(lo) + 0.4, z: Z(la) + 0.3, ry }));
    c.click(pigs[0], () => { c.sound.coo?.(); c.say(pigs[0], 'Central Park. Home. Obviously.'); }, 'A pigeon at home');
    c.glb('pigeon', { h: 0.28, x: -RD + 1.5, y: 1.04, z: 1.4, ry: Math.PI / 2 });
    // the ferry, crossing forever, free
    const ferry = new THREE.Group(); c.add(ferry);
    { const hull = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0xff7a18, emissive: 0xff7a18, emissiveIntensity: 0.6, roughness: 0.5 })); hull.position.y = 0.05; ferry.add(hull);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.32), new THREE.MeshStandardMaterial({ color: 0xf0f4f8, emissive: 0xffe0a0, emissiveIntensity: 0.5 })); cab.position.y = 0.12; ferry.add(cab); }
    c.click(ferry, () => c.egg('dome_ferry', 'The ferry is free. It has always been free. The pigeons ride it both ways and never get off.'), 'The ferry');
    const F0 = new V(X(-74.073), 0, Z(40.643)), F1 = new V(X(-74.013), 0, Z(40.701));
    // the compass, raised a hair so it can be clicked
    const cmp = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ visible: false })); cmp.position.set(9.2, 0.03, 12.2); c.add(cmp);
    c.click(cmp, () => c.egg('dome_compass', 'Every needle in here points home. Home is wherever the bread is. Today, the bread is north.'), 'The pigeon compass');
    // sparing stickers on the balcony ledge and the drum by the doors
    { const st = (window.STICKER_GROUPS || {}).museum || []; for (let k = 0; k < 10; k++) { const z = (k % 2 ? 1 : -1) * (2.1 + Math.random() * 0.8), x = -Math.sqrt(RD * RD - z * z) + 0.04; if (st[20 + k]) c.sticker(st[20 + k], x, 0.6 + Math.random() * 1.3, z, { ry: Math.PI / 2 - z / RD, size: 0.16 + Math.random() * 0.08 }); } }

    // ---------- the lights: two follow the New Yorkers that are standing; the rest set the room ----------
    c.light(0, 15, 0, 0x6f8dff, 3, 30);
    c.light(SP[0], 3, SP[1], 0xffe6c0, 0, 6); c.light(SP[0], 3, SP[1], 0xffe6c0, 0, 6);
    c.light(0, 2.5, -RD + 2, 0xffc070, 3, 7); c.light(RD - 2, 2.5, 0, 0x00e5ff, 3, 7); c.light(-RD + 2.5, 2.4, 0, 0x9fd8ff, 2.5, 7);
    const FOL = [R.lights[1], R.lights[2]];

    // ---------- the tick ----------
    const tmp = new V();
    c.tick((t, dt, me) => {
      FU.uT.value = t; FU.uMe.value.set(me.x, me.z); S.FL.uT.value = t;
      // the cards: rise near, lie down far, turn to face you while up
      const lit = [];
      for (const k of cards) {
        const d = Math.hypot(me.x - k.s.x, me.z - k.s.z);
        if (d < 2.9) k.up = 1; else if (d > 3.9) k.up = 0;
        k.v += ((k.up - k.u) * 60 - k.v * 11) * dt; k.u += k.v * dt; k.u = Math.max(-0.05, Math.min(1.12, k.u));
        k.hinge.rotation.x = -Math.PI / 2 * (1 - k.u);
        if (k.u > 0.3) { const want = Math.atan2(me.x - k.s.x, me.z - k.s.z); let dy = want - k.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); k.yaw += dy * Math.min(1, dt * 2.5); k.base.rotation.y = k.yaw; }
        const e = Math.max(0, Math.min(1, k.u));
        k.tabL.rotation.y = e * 0.9; k.tabR.rotation.y = -e * 0.9; const fold = Math.max(0.001, e); k.stem.scale.y = fold; k.stem.position.y = 0.52 * fold; k.tabL.visible = k.tabR.visible = e > 0.04;
        const am = k.fr.userData.art?.material; if (am) am.emissiveIntensity = 0.14 + 0.55 * e;
        k.ring.material.opacity = 0.18 + 0.7 * e; if (k.pool) k.pool.visible = e > 0.6; k.ring.scale.setScalar(1 + e * 1.6);
        if (e > 0.5) lit.push([d, k]);
      }
      lit.sort((a, b) => a[0] - b[0]);
      FOL.forEach((L, i) => { const k = lit[i]?.[1]; if (k) { tmp.set(Math.sin(k.yaw) * 1.4, 0, Math.cos(k.yaw) * 1.4); L[0] = k.s.x + tmp.x; L[1] = 2.6; L[2] = k.s.z + tmp.z; L[4] += (2.6 - L[4]) * Math.min(1, dt * 3); } else L[4] += (0 - L[4]) * Math.min(1, dt * 3); });
      // the pin over your head, and its label turned to read from below
      const r2 = RD * RD - me.x * me.x - me.z * me.z, py = DRUM + Math.sqrt(Math.max(0, r2)) - 0.05;
      S.pin.pin.position.set(me.x, py, me.z); S.pin.halo.scale.setScalar(1 + 0.25 * Math.sin(t * 3));
      S.pin.tag.position.set(0, -1.25, 0); S.pin.tag.rotation.set(Math.PI / 2, c.P.yaw, 0, 'YXZ');
      // the eye at the zenith looks down at you, and blinks
      const E = S.eye, lid = ((t % 7.3) < 0.16) ? 1 : 0, lx = Math.round(me.x / RD * 10) / 10, ly = Math.round(-me.z / RD * 10) / 10, key = `${lid}${lx}${ly}`;
      if (key !== E.k) { E.k = key; const q = E.cv.getContext('2d'); q.clearRect(0, 0, 512, 512); c.eyeFlower(q, 256, 256, 240, { lid, look: [lx, ly] }); E.et.needsUpdate = true; }
      // the ferry
      const fu = (Math.sin(t * 0.18) + 1) / 2; ferry.position.copy(F0).lerp(F1, fu); ferry.rotation.y = Math.atan2(F1.x - F0.x, F1.z - F0.z) + (Math.cos(t * 0.18) > 0 ? 0 : Math.PI);
    });
  },
  onEnter(c) { if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('Walk the map. Everyone is at home. They will stand up when you visit.', 4600), 2600); } },
};
