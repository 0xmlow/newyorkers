// THE PENTHOUSE. Where the rent goes. New Yorker No. 39, The Landlord, at home: the ninetieth floor on 57th Street,
// a wall of glass onto the whole of Central Park, black lacquer and gold, a heaven painted on the ceiling with him in it.
// Two clocks run the room, both of them real:
//   RENT DAY, the month. Over the fireplace hangs the token. From the 1st to the 5th it is lenticular: walk across the
//   room and he turns into The Eviction (No. 47) and back. From the 6th it is The Eviction, unless the rent went in the
//   brass slot by the fire this month; paid, it is The Landlord, pleased. The mantel calendar lets you turn the days.
//   THE YEAR, 4F's. Every chapter that 4F loses a thing (kit CH), the thing turns up here, small and gilded, in his
//   glass case, and a key goes up on his wall. When 4F is empty, the last hook fills: the key from the floor.
// The view follows the New York sun: night, dusk and day photographs of the same park, blended by the hour, rebuilt as
// depth so it parallaxes as you walk, with the windows of the city twinkling and the planes going over.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, decal, prop, cast, relief, glowTex, stamp, CH, FURN, LEAVES, MONTHS } from './kit.js';

const HI = 6.4, GZ = -D / 2 + 0.18;   // the glass sits just inside the north line
const Q = new URLSearchParams(location.search);

// ---------- New York time, with ?day= and ?hour= for checking ----------
function nyNow() {
  let y, m, d, h, mi, s;
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    y = +p.year; m = +p.month; d = +p.day; h = +p.hour; mi = +p.minute; s = +p.second;
  } catch (e) { const t = new Date(); y = t.getFullYear(); m = t.getMonth() + 1; d = t.getDate(); h = t.getHours(); mi = t.getMinutes(); s = t.getSeconds(); }
  if (Q.has('day')) d = Math.max(1, Math.min(28, +Q.get('day') || 1));
  if (Q.has('hour')) { h = Math.max(0, Math.min(23, +Q.get('hour') || 0)); mi = 0; }
  return { y, m, d, h, mi, s, dim: new Date(y, m, 0).getDate() };
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- rent day: due, paid, evicted ----------
const RENT = {
  dayShift: 0,   // the mantel calendar turns this; it is a preview and never saved
  paidFor() { try { return localStorage.getItem('pent.paid'); } catch (e) { return null; } },
  pay(key) { try { localStorage.setItem('pent.paid', key); } catch (e) {} },
  now() {
    const t = nyNow(); let d = t.d + this.dayShift; if (d > t.dim) d = ((d - 1) % t.dim) + 1;
    const key = `${t.y}-${t.m}`, paid = !Q.has('unpaid') && this.paidFor() === key;
    const state = paid ? 'paid' : d <= 5 ? 'due' : 'evicted';
    return { ...t, d, key, paid, state };
  },
};
window.__RENT = RENT;

// how much of each light the sky is in: night, dusk (and dawn), day
function skyMix(h, mi) {
  const t = h + mi / 60, ramp = (a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const day = ramp(6.5, 8.5) * (1 - ramp(16.5, 18));
  const dusk = Math.max(ramp(5.5, 7) * (1 - ramp(7.5, 9)), ramp(16.5, 18) * (1 - ramp(19, 20.5)));
  const night = Math.max(0, 1 - day - dusk);
  const s = day + dusk + night; return [night / s, dusk / s, day / s];
}

export function penthouseSlots(r, HT) {
  // the census hangs where a collector hangs it: the south wall either side of the fire, and the east wall's south end
  const S = [], y = 2.2, south = D / 2 - 0.14;
  [1.6, 4.0, 6.4, 13.6, 16.0, 18.4].forEach((x) => S.push({ x, y, z: south, ry: PI, w: 1.5 }));
  [3.4, 5.8].forEach((z) => S.push({ x: W - 0.14, y, z, ry: -PI / 2, w: 1.5 }));
  return S;
}

export function penthouse(c, r, g, X, mats) {
  const { THREE } = c;
  const gold = std(c, 0xd8a83a, { metalness: 0.9, roughness: 0.24, emissive: 0x3a2604, emissiveIntensity: 0.5 }), lacquer = std(c, 0x0a0a0c, { metalness: 0.3, roughness: 0.18 });
  const brass = std(c, 0xc9973a, { metalness: 1, roughness: 0.3 }), marbleBlack = std(c, 0x101012, { roughness: 0.12, metalness: 0.1 });

  // ---------- the view: three photographs of the same park, one depth, blended by the New York hour ----------
  view(c, r, g);

  // ---------- the glass wall: floor to ceiling, black steel mullions, a little reflection ----------
  const steel = std(c, 0x111317, { metalness: 0.85, roughness: 0.35 });
  for (let x = 0; x <= W + 0.01; x += 2.5) g.add(box(c, 0.09, HI, 0.14, steel, x, HI / 2, GZ));
  g.add(box(c, W, 0.14, 0.2, steel, W / 2, 0.07, GZ)); g.add(box(c, W, 0.18, 0.2, steel, W / 2, HI - 0.09, GZ));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, HI), new THREE.MeshStandardMaterial({ color: 0x9fb4d8, transparent: true, opacity: 0.07, metalness: 1, roughness: 0.04, depthWrite: false }));
  glass.position.set(W / 2, HI / 2, GZ - 0.02); g.add(glass);
  c.wall(X(0), GZ + 0.35, X(W), GZ + 0.35);
  c.clickable(glass, () => c.egg('pent_glass', 'Nine hundred and twelve feet. On a clear night you can see four states and none of his buildings. He bought this view so he would never have to look at them.'), 'The window');

  // ---------- the ceiling: black coffers, gold edges, and a heaven with him in it ----------
  ceiling(c, r, g, gold, lacquer);

  // ---------- the chandelier, swaying very slightly with the tower ----------
  const ch = prop(c, r, g, X, 'Chandelier_02', 10, -1.6, { h: 1.9, y: HI - 2.05 });
  const sparkle = [];
  for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,240,200,.8)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); const a = i / 22 * PI * 2, rr = 0.45 + (i % 3) * 0.22; s.position.set(10 + Math.cos(a) * rr, HI - 1.55 - (i % 4) * 0.28, -1.6 + Math.sin(a) * rr); s.scale.setScalar(0.12); s.userData.ph = Math.random() * 9; g.add(s); sparkle.push(s); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const sw = Math.sin(t * 0.35) * 0.012; ch.rotation.z = sw; ch.rotation.x = Math.cos(t * 0.29) * 0.008; sparkle.forEach((s) => { s.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.3 + s.userData.ph)) ** 6; }); });
  c.clickable(ch, () => c.egg('pent_chandelier', 'Eleven thousand crystals. Each one, he will tell you, is a tenant who complained about the heat.'), 'The chandelier');

  // ---------- the lounge: a sunken rug, two velvet sofas facing the park, his chess game ----------
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ map: rugTex(c), roughness: 0.95 }));
  rug.position.set(10, 0.012, -2.0); g.add(rug);
  prop(c, r, g, X, 'nyb_devils_sofa', 10, -0.1, { len: 2.6, ry: PI, r: 1.0 });
  prop(c, r, g, X, 'mid_century_lounge_chair', 7.0, -2.6, { h: 0.95, ry: PI / 2 + 0.4, r: 0.5 });
  prop(c, r, g, X, 'mid_century_lounge_chair', 13.0, -2.6, { h: 0.95, ry: -PI / 2 - 0.4, r: 0.5 });
  prop(c, r, g, X, 'modern_coffee_table_01', 10, -2.2, { len: 1.6, r: 0.8 });
  prop(c, r, g, X, 'chess_set', 9.7, -2.15, { len: 0.42, y: 0.42, egg: ['The chess game', 'pent_chess', 'He plays both sides. He is winning on both sides. The white king is a key.'] });
  prop(c, r, g, X, 'brass_goblets', 10.5, -2.35, { h: 0.2, y: 0.42 });

  // ---------- the champagne tower, filling forever ----------
  champagne(c, r, g, X, gold);

  // ---------- the fireplace on the south wall, and the token over it ----------
  fireplace(c, r, g, X, marbleBlack, gold, brass);

  // ---------- the wall of keys: every apartment he owns, in gold, on the west wall ----------
  keyWall(c, r, g, X, gold, lacquer);

  // ---------- the rent roll: a split flap board, the month's money, counting itself ----------
  rentBoard(c, r, g, X, lacquer, gold);

  // ---------- his glass case: whatever 4F loses, he keeps, small and gilded ----------
  vitrine(c, r, g, X, gold, brass);

  // ---------- his desk: the gold register, the money counter that never stops ----------
  desk(c, r, g, X, gold);

  // ---------- the telescope at the glass, pointed at Brooklyn ----------
  telescope(c, r, g, X, brass);

  // ---------- the things a man like this owns ----------
  prop(c, r, g, X, 'marble_bust_01', 2.2, -6.2, { h: 0.75, y: 1.15, ry: 0.5, egg: ['The bust', 'pent_bust', 'A bust of himself, in Carrara, by a sculptor he is still suing.'] });
  g.add(cyl(c, 0.32, 0.36, 1.15, marbleBlack, 2.2, 0.575, -6.2, 24)); c.post(X(2.2), -6.2, 0.45);
  prop(c, r, g, X, 'nyb_hydrant_gold', 18.0, -6.6, { h: 0.95, y: 0.6, ry: -0.6, egg: ['The gold hydrant', 'pent_hydrant', 'The only hydrant in Manhattan nobody can park beside. He had it taken off a block in Bed Stuy the week the block was his.'] });
  g.add(cyl(c, 0.42, 0.46, 0.6, marbleBlack, 18.0, 0.3, -6.6, 24)); c.post(X(18.0), -6.6, 0.55);
  prop(c, r, g, X, 'nyb_devils_lion', 6.6, 6.2, { h: 1.0, ry: PI * 0.85, r: 0.55 });
  prop(c, r, g, X, 'nyb_devils_lion', 13.4, 6.2, { h: 1.0, ry: -PI * 0.85, r: 0.55 });
  prop(c, r, g, X, 'vintage_grandfather_clock_01', 19.4, 7.2, { h: 2.3, ry: -PI / 2, r: 0.45, egg: ['The clock', 'pent_clock', 'It runs three days fast. On the first of the month, so does he.'] });
  prop(c, r, g, X, 'ornate_mirror_01', 0.16, 6.9, { h: 2.0, y: 0.9, ry: PI / 2, egg: ['The mirror', 'pent_mirror', 'You look rich in it. Everybody does. That is what it is for.'] });
  for (const [x, z] of [[0.9, -7.2], [19.1, 7.3]]) prop(c, r, g, X, 'potted_plant_02', x, z, { h: 1.6, r: 0.4 });
  // his state portrait, full length, on the east wall: the one painting in the house he chose himself
  {
    const t = c.tex.load('assets/pent/portrait.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const PW = 1.25, PH = PW * 2752 / 1536, PZ = 1.35, PY = 2.75;
    g.add(box(c, 0.1, PH + 0.3, PW + 0.3, gold, W - 0.17, PY, PZ));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.5 }));
    pic.position.set(W - 0.23, PY, PZ); pic.rotation.y = -PI / 2; g.add(pic);
    const pl = c.sign('THE LANDLORD, AT HOME · AFTER No. 39', { w: 1.2, h: 0.1, bg: '#d8a83a', fg: '#120c04', font: c.MONO, weight: 700 }); pl.position.set(W - 0.24, PY - PH / 2 - 0.26, PZ); pl.rotation.y = -PI / 2; g.add(pl);
    c.clickable(pic, () => c.egg('pent_portrait', 'His state portrait: the throne, the stack of leases, the keys, the park behind him. He had it painted from the window you are standing at.'), 'His portrait');
  }

  // ---------- the people ----------
  cast(c, r, g, X, 'maitre', 4.4, -3.0, { h: 1.8, ry: PI * 0.7, line: ['Champagne? It is his. Everything here is his. I am on a lease too.', 'He has never once said thank you. He says "noted".', 'The tower refills itself. So does the account.'], egg: 'pent_butler', hint: 'The butler' });
  cast(c, r, g, X, 'broker', 17.6, -1.8, { h: 1.8, ry: -PI * 0.6, line: ['Buy the whole block. Yes, with the people in it.', 'Market rate, baby. The market is me.', 'Tell 4F the offer stands: leave by Friday, keep the plants.'], egg: 'pent_broker', hint: 'The broker on the phone' });

  // ---------- him, at the glass ----------
  const him = relief(c, g, 'landlord', { h: 2.35, x: 12.6, z: -6.5, depth: 0.3 });
  c.post(X(12.6), -6.5, 0.6);
  him.userData.hint = 'The Landlord';
  him.userData.click = () => {
    const R = RENT.now(), L = {
      due: ['It is the first. My favourite day of the month.', 'Five days. I give everybody five days. I am a generous man.', 'You hear that? That is two hundred and twelve envelopes, on their way up.'],
      paid: ['Paid in full. You are a good tenant. I will raise it in the spring.', 'Champagne for the good tenant. Do not touch the furniture.'],
      evicted: ['The paper went down at nine. He takes the stairs. I take the lift.', 'Nothing personal. It is the sixth.', 'Look out the window. That is what the rent buys. I earned that park.'],
    }[R.state];
    c.say(him, L[(Math.random() * L.length) | 0], 4000, 2.7);
    c.egg('pent_landlord', 'New Yorker No. 39, The Landlord, at home. He holds every key and decides who stays the winter. Up here, he decides who gets the view.');
  };

  // the room's light follows the sky outside
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return;
    const T = nyNow(), [n, k, d] = skyMix(T.h, T.mi);
    c.hemi.intensity = 0.3 + d * 0.9 + k * 0.35; c.hemi.color.setRGB(0.55 + d * 0.4 + k * 0.4, 0.55 + d * 0.4 + k * 0.15, 0.7 + d * 0.3 - k * 0.1);
    c.scene.environmentIntensity = 0.3 + d * 0.5;
  });
}

// ===================================================================================================================
function view(c, r, g) {
  const { THREE } = c, R0 = 95, ARC = 1.95, HZ = 0.36, LIFT = 0.2;   // radius, arc, horizon from the top, horizon raised 0.2 rad
  const ASP = 3168 / 1344, HGT = R0 * ARC / ASP;
  const L = (n, cs = true) => { const t = c.tex.load(n); if (cs) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const uni = { tN: { value: L('assets/plates/penthouse.jpg') }, tK: { value: L('assets/plates/penthouse_dusk.jpg') }, tD: { value: L('assets/plates/penthouse_day.jpg') }, tZ: { value: L('assets/depth/penthouse.png', false) }, tZd: { value: L('assets/depth/penthouse_day.png', false) },
    uMix: { value: new THREE.Vector3(1, 0, 0) }, uT: { value: 0 }, uCam: { value: new THREE.Vector2() }, uDbg: { value: +(Q.get('pentdbg') || 0) } };
  // The photograph looks down from ninety floors, so it is hung as the window sees it: the horizon high in the glass, the
  // park filling the rest. Depth is a per pixel parallax, not geometry: the near towers slide against the far city as
  // you walk, and nothing can tear.
  const mat = new THREE.ShaderMaterial({
    uniforms: uni, fog: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tN, tK, tD, tZ, tZd; uniform vec3 uMix; uniform float uT; uniform vec2 uCam; uniform float uDbg; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        // the night and dusk photographs share one depth; the day photograph is its own picture, with its own
        float z = mix(texture2D(tZ, vUv).r, texture2D(tZd, vUv).r, uMix.z);
        vec2 uv = vUv + vec2(-uCam.x * 0.0022, uCam.y * 0.0016) * z * z;
        z = mix(texture2D(tZ, uv).r, texture2D(tZd, uv).r, uMix.z); uv = vUv + vec2(-uCam.x * 0.0022, uCam.y * 0.0016) * z * z;
        vec3 n = texture2D(tN, uv).rgb, k = texture2D(tK, uv).rgb, d = texture2D(tD, uv).rgb;
        vec3 col = n * uMix.x + k * uMix.y + d * uMix.z;
        // the city's windows breathe at night, a few at a time
        float lum = dot(n, vec3(.3, .55, .15)), below = step(uv.y, ${(1 - HZ).toFixed(3)});
        vec2 cell = floor(uv * vec2(900., 380.)); float tw = h(cell), ph = sin(uT * (0.6 + tw * 2.2) + tw * 40.);
        col += n * smoothstep(.55, .9, lum) * below * uMix.x * (ph > 0.94 ? .9 : (tw > .985 ? -.5 : 0.));
        gl_FragColor = vec4(col, 1.0);
        if (uDbg > 1.5) gl_FragColor = vec4(fract(vUv * 10.), 0., 1.); else if (uDbg > 0.5) gl_FragColor = vec4(vec3(texture2D(tZ, vUv).r), 1.);
        #include <colorspace_fragment>
      }`,
  });
  const cx = r.x0 + W / 2, cz = 6, yH = 1.6 + Math.tan(LIFT) * R0;
  const geo = new THREE.CylinderGeometry(R0, R0, HGT, 128, 1, true, PI - ARC / 2, ARC);
  { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setX(i, 1 - u.getX(i)); }   // theta runs right to left seen from inside
  const mesh = new THREE.Mesh(geo, mat); mesh.position.set(cx, yH - (0.5 - HZ) * HGT, cz);   // the horizon row sits at yH
  mesh.renderOrder = -2; mesh.frustumCulled = false; c.scene.add(mesh); r.viewMesh = mesh;
  // a dark sill far below, so the bottom edge of the photograph never shows
  const sill = new THREE.Mesh(new THREE.CylinderGeometry(R0 * 0.99, R0 * 0.99, 60, 64, 1, true, PI - ARC / 2, ARC), new THREE.MeshBasicMaterial({ color: 0x07080c, side: THREE.DoubleSide, fog: false }));
  sill.position.set(cx, mesh.position.y - HGT / 2 - 30, cz); c.scene.add(sill);
  const camv = new THREE.Vector2();
  // the roof next door builds its photograph as real depth, 80 m north, and it would stand in front of the park. While
  // you are up here, the other rooms' plates step out (by material: the engine sets mesh.visible for neighbours every
  // frame); on the way out, exactly those step back in.
  // planes going over, a helicopter down the park, slow
  const blink = (col) => new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, col), transparent: true, depthWrite: false, toneMapped: false, fog: false, blending: THREE.AdditiveBlending }));
  const craft = [0, 1, 2].map((k) => { const s = blink(k === 2 ? 'rgba(255,60,60,.95)' : 'rgba(255,255,255,.95)'); s.scale.setScalar(k === 2 ? 1.6 : 1.3); c.scene.add(s); return { s, k, ph: k * 23 }; });
  let hidden = null, scan = 0;
  const show = (ri, P) => ri === r.i || (ri === r.i - 1 && P.x > r.x0 - 3);   // and through the doorway as you walk in off the roof
  c.tick((t, dt, P, ri) => {
    const on = show(ri, P); mesh.visible = sill.visible = on; craft.forEach((o) => { o.s.visible = on; });
    if (ri === r.i) {
      camv.set(c.camera.position.x - cx, c.camera.position.z - 2); uni.uCam.value.copy(camv);
      if (!hidden) hidden = new Set();
      if (t > scan) { scan = t + 0.5; c.scene.traverse((o) => { if (o.isMesh && o.renderOrder === -1 && o.material.visible) { o.material.visible = false; hidden.add(o); } }); }   // plates load late: keep looking
    } else if (hidden) { hidden.forEach((o) => { o.material.visible = true; }); hidden = null; }
  });

  c.tick((t, dt, P, ri) => {
    if (Math.abs(ri - r.i) > 1) return;
    uni.uT.value = t; const T = nyNow(), m = skyMix(T.h, T.mi); uni.uMix.value.set(m[0], m[1], m[2]);
    craft.forEach((o) => {
      const u = ((t * (o.k === 2 ? 0.006 : 0.011) + o.ph * 0.13) % 1.3) - 0.15, a = (u - 0.5) * ARC * 0.9, rr = R0 * 0.92, y = o.k === 2 ? yH - 9 + Math.sin(t * 0.3) : yH + 5 + o.k * 6;
      o.s.position.set(cx + Math.sin(a) * rr, y, cz - Math.cos(a) * rr); o.s.material.opacity = (Math.sin(t * 6 + o.ph) > 0.6 ? 1 : 0.15) * (0.35 + m[0] * 0.65);
    });
  });
}

function ceiling(c, r, g, gold, lacquer) {
  const { THREE } = c;
  g.add(box(c, W, 0.12, D, lacquer, W / 2, HI + 0.06, 0));
  // coffers: a grid of gold edged recesses
  const edge = new THREE.BoxGeometry(1, 0.06, 0.06);
  for (let x = 1; x < W; x += 2) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, D), gold); m.position.set(x, HI - 0.09, 0); g.add(m); }
  for (let z = -D / 2 + 1; z < D / 2; z += 2) { const m = new THREE.Mesh(new THREE.BoxGeometry(W, 0.18, 0.06), gold); m.position.set(W / 2, HI - 0.09, z); g.add(m); }
  // the fresco, in an oval of gilded stucco, lit from below by the chandelier
  const t = c.tex.load('assets/pent/ceiling.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const oval = c.canvasTex(512, 288, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h); const gr = q.createRadialGradient(w / 2, h / 2, h * 0.36, w / 2, h / 2, h * 0.5); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); q.save(); q.translate(w / 2, h / 2); q.scale(w / h, 1); q.translate(-w / 2, -h / 2); q.fillStyle = gr; q.beginPath(); q.arc(w / 2, h / 2, h * 0.5, 0, 7); q.fill(); q.restore(); });
  const FW = 11.5, FH = FW * 9 / 16;
  const fresco = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH).rotateX(PI / 2), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.35, alphaMap: oval, transparent: true, roughness: 0.9 }));
  fresco.position.set(W / 2, HI - 0.2, -1.2); g.add(fresco);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 10, 96), gold); ring.rotation.x = PI / 2; ring.scale.set(FW * 0.5, FH * 0.5, 1); ring.position.set(W / 2, HI - 0.22, -1.2); g.add(ring);
  const ring2 = ring.clone(); ring2.scale.set(FW * 0.53, FH * 0.55, 1.6); ring2.position.y = HI - 0.16; g.add(ring2);
  c.clickable(fresco, () => c.egg('pent_fresco', 'Look up. He had the ceiling painted with himself as God, the cherubs carrying the rent up to him, and 4F\'s furniture rising into the clouds. The painter was paid in a lease.'), 'The ceiling');
}

function rugTex(c) {
  return c.canvasTex(1024, 1024, (q, w, h) => {
    q.fillStyle = '#0b0b10'; q.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    for (let k = 0; k < 9; k++) { q.strokeStyle = k % 2 ? '#c9973a' : '#2a1640'; q.lineWidth = k % 2 ? 6 : 26; q.beginPath(); q.arc(cx, cy, 120 + k * 42, 0, 7); q.stroke(); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2, x = cx + Math.cos(a) * 330, y = cy + Math.sin(a) * 330; q.fillStyle = '#ff4fa3'; q.beginPath(); q.ellipse(x, y, 34, 14, a, 0, 7); q.fill(); }
    // an eye at the centre: pink petals, the blue iris, the house mark woven in
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; q.fillStyle = i % 2 ? '#fbe6f0' : '#ff8cc6'; q.beginPath(); q.ellipse(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70, 62, 30, a, 0, 7); q.fill(); }
    q.fillStyle = '#fff'; q.beginPath(); q.ellipse(cx, cy, 70, 44, 0, 0, 7); q.fill(); q.fillStyle = '#2962FF'; q.beginPath(); q.arc(cx, cy, 32, 0, 7); q.fill(); q.fillStyle = '#0d0d0d'; q.beginPath(); q.arc(cx, cy, 14, 0, 7); q.fill();
  });
}

function champagne(c, r, g, X, gold) {
  const { THREE } = c, TX = 5.0, TZ = -4.8;
  prop(c, r, g, X, 'coffee_table_round_01', TX, TZ, { len: 1.3, r: 0.8 });
  const glassM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, metalness: 0.2, roughness: 0.05, depthWrite: false });
  const wine = new THREE.MeshStandardMaterial({ color: 0xf2c94c, emissive: 0x9a6a10, emissiveIntensity: 0.4, transparent: true, opacity: 0.85, roughness: 0.1 });
  const pts = [[0, 0], [0.035, 0], [0.008, 0.012], [0.006, 0.1], [0.06, 0.13], [0.075, 0.16]].map(([x, y]) => new THREE.Vector2(x, y));
  const coupe = new THREE.LatheGeometry(pts, 20), fill = new THREE.CylinderGeometry(0.07, 0.04, 0.025, 20);
  const top = 0.46; let y = top, n = 0;
  for (let L = 4; L >= 1; L--) {
    for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) {
      const x = TX + (i - (L - 1) / 2) * 0.15, z = TZ + (j - (L - 1) / 2) * 0.15;
      const m = new THREE.Mesh(coupe, glassM); m.position.set(x, y, z); g.add(m);
      const f = new THREE.Mesh(fill, wine); f.position.set(x, y + 0.14, z); g.add(f); n++;
    }
    y += 0.16;
  }
  // the bottle pouring, and the overflow falling glass to glass, forever
  const bottle = cyl(c, 0.045, 0.05, 0.32, std(c, 0x0f2a18, { metalness: 0.4, roughness: 0.15 }), TX + 0.12, y + 0.18, TZ); bottle.rotation.z = 2.2; g.add(bottle);
  const N = 70, geo = new THREE.BufferGeometry(), P = new Float32Array(N * 3), S = new Float32Array(N);
  for (let i = 0; i < N; i++) S[i] = Math.random();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const drops = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe08a, size: 0.025, transparent: true, opacity: 0.9, toneMapped: false })); g.add(drops);
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) return;
    for (let i = 0; i < N; i++) {
      const u = (S[i] + t * 0.45) % 1, k = i % 4, a = k * PI / 2 + 0.4;
      const rr = 0.04 + u * 0.32, yy = y + 0.05 - u * (y - top + 0.05);
      P[i * 3] = TX + Math.cos(a) * rr; P[i * 3 + 1] = yy; P[i * 3 + 2] = TZ + Math.sin(a) * rr;
    }
    geo.attributes.position.needsUpdate = true;
  });
  const hit = box(c, 0.8, 0.8, 0.8, new THREE.MeshBasicMaterial({ visible: false }), TX, top + 0.35, TZ); g.add(hit);
  c.clickable(hit, () => { c.sound.clink(); setTimeout(() => c.sound.clink(2900), 140); c.egg('pent_champagne', `Thirty coupes, poured every first of the month, and the bottle never runs dry. It is not champagne. It is the deposit you never got back.`); }, 'The champagne tower');
}

function fireplace(c, r, g, X, marble, gold, brass) {
  const { THREE } = c, FX0 = 10, FZ = D / 2 - 0.42;
  // a wall of black marble, a surround of pale veined marble, a firebox lined in gold
  const pale = c.surf('marble', 0.6, 0xe8e2d6); pale.roughness = 0.18;
  g.add(box(c, 5.2, HI, 0.2, marble, FX0, HI / 2, D / 2 - 0.2));
  for (const sx of [-1.35, 1.35]) g.add(box(c, 0.7, 1.5, 0.6, pale, FX0 + sx, 0.75, FZ));   // the jambs
  g.add(box(c, 2.0, 0.48, 0.6, pale, FX0, 1.26, FZ)); g.add(box(c, 2.2, 0.08, 0.66, std(c, 0x050506, { roughness: 0.6 }), FX0, 0.04, FZ));   // the lintel, the hearth g.add(box(c, 3.8, 0.12, 0.8, gold, FX0, 1.52, FZ));
  const hole = box(c, 2.0, 0.95, 0.1, basic(c, 0x050302), FX0, 0.55, FZ + 0.22); g.add(hole);   // the back of the firebox, so the fire sits in the opening
  g.add(box(c, 2.0, 0.06, 0.5, gold, FX0, 1.05, FZ - 0.05));
  c.wall(X(FX0 - 1.9), FZ - 0.45, X(FX0 + 1.9), FZ - 0.45);
  // the fire: animated flame sprites over a bed of embers
  const flameTex = c.canvasTex(128, 256, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h * 0.8, 4, w / 2, h * 0.6, h * 0.55); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.25, 'rgba(255,190,60,.9)'); gr.addColorStop(0.6, 'rgba(255,70,20,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.beginPath(); q.moveTo(w / 2, 0); q.bezierCurveTo(w, h * 0.45, w * 0.9, h, w / 2, h); q.bezierCurveTo(w * 0.1, h, 0, h * 0.45, w / 2, 0); q.fill(); });
  const flames = [];
  for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); s.position.set(FX0 - 0.7 + i * 0.175, 0.45, FZ - 0.05); s.userData.ph = Math.random() * 10; g.add(s); flames.push(s); }
  const embers = box(c, 1.7, 0.08, 0.3, new THREE.MeshBasicMaterial({ color: 0xff5a14, toneMapped: false }), FX0, 0.12, FZ); g.add(embers);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; flames.forEach((s) => { const k = 0.5 + 0.5 * Math.sin(t * 7 + s.userData.ph) * Math.sin(t * 3.1 + s.userData.ph * 2); s.scale.set(0.32 + k * 0.1, 0.55 + k * 0.4, 1); s.position.y = 0.32 + k * 0.12; }); c.lights[1] && (c.lights[1].userData.i = 7 + Math.sin(t * 9) * 1.2 + Math.sin(t * 23) * 0.6); });

  // ---------- the token: The Landlord, The Eviction, or both at once ----------
  const TW = 3.6, TH = TW * 9 / 16, TY = 3.55, TZ = D / 2 - 0.34;
  g.add(box(c, TW + 0.36, TH + 0.36, 0.1, gold, FX0, TY, TZ + 0.02));
  g.add(box(c, TW + 0.12, TH + 0.12, 0.12, std(c, 0x1a1408, { metalness: 0.6, roughness: 0.4 }), FX0, TY, TZ - 0.0));
  const ld = (f) => { const t = c.tex.load(f); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const U = { tA: { value: ld('assets/pent/token_landlord.jpg') }, tB: { value: ld('assets/pent/token_eviction.jpg') }, uMode: { value: 0 }, uFlip: { value: 0 }, uView: { value: 0 }, uT: { value: 0 } };
  const art = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tA, tB; uniform float uMode, uFlip, uView, uT; varying vec2 vUv;
      void main(){
        vec3 a = texture2D(tA, vUv).rgb, b = texture2D(tB, vUv).rgb, col;
        if (uMode < 0.5) col = a;
        else if (uMode < 1.5) col = b;
        else {
          // lenticular: fine vertical ridges, each shows one painting or the other depending on where you stand
          float ridge = fract(vUv.x * 160.0), k = smoothstep(-0.12, 0.12, -uView * 0.45 + (ridge - 0.5) * 0.3);   // from the west end of the room he is The Eviction, from the east end The Landlord
          col = mix(a, b, k) * (0.86 + 0.14 * sin(ridge * 6.2832));
        }
        // the flip: a hard horizontal wipe of the new state, an orange seam at the cut
        float seam = smoothstep(0.0, 0.015, abs(vUv.y - uFlip)) ; col = mix(vec3(1., .48, .1), col, uFlip > 0.001 && uFlip < 0.999 ? seam : 1.0);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  art.position.set(FX0, TY, TZ - 0.07); art.rotation.y = PI; g.add(art);
  const plate = c.sign('NEW YORKER No. 39 · RENT DAY', { w: 1.8, h: 0.16, bg: '#d8a83a', fg: '#120c04', font: c.MONO, weight: 700 });
  plate.position.set(FX0, TY - TH / 2 - 0.32, TZ - 0.1); plate.rotation.y = PI; g.add(plate);
  const setPlate = (s) => { const L = { due: 'NO. 39 / NO. 47 · RENT IS DUE · WALK ACROSS', paid: 'NEW YORKER No. 39 · THE LANDLORD · PAID', evicted: 'NEW YORKER No. 47 · THE EVICTION · PAST DUE' }[s]; plate.material.map = c.sign(L, { w: 1.8, h: 0.16, bg: '#d8a83a', fg: '#120c04', font: c.MONO, weight: 700 }).material.map; plate.material.needsUpdate = true; };

  let shown = null, flipT = 1, from = 0;
  const modeOf = (s) => (s === 'paid' ? 0 : s === 'evicted' ? 1 : 2);
  const v = new THREE.Vector3();
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return;
    const R = RENT.now();
    if (R.state !== shown) {
      const first = shown === null; shown = R.state; setPlate(shown);
      if (first) U.uMode.value = modeOf(shown);
      else { from = U.uMode.value; flipT = 0; c.sound.crack(); if (shown === 'evicted') { stamp(c, 'EVICTION'); c.shake(0.12); } if (shown === 'paid') stamp(c, 'PAID'); }
    }
    if (flipT < 1) { flipT = Math.min(1, flipT + dt * 0.9); U.uFlip.value = flipT; if (flipT > 0.5) U.uMode.value = modeOf(shown); else U.uMode.value = from; if (flipT >= 1) U.uFlip.value = 0; }
    // where the visitor stands, across the painting, drives the lenticular
    art.getWorldPosition(v); U.uView.value = (c.camera.position.x - v.x) / 3.2; U.uT.value = t;
  });
  c.clickable(art, () => {
    const R = RENT.now();
    const L = { due: `It is the ${R.d}${['st', 'nd', 'rd'][R.d - 1] || 'th'} of ${MONTH_NAMES[R.m - 1]}. Rent is due by the fifth. Walk across the painting: he is The Landlord from one side and The Eviction from the other. Both of them are coming.`, paid: 'Paid this month. The token shows The Landlord, pleased. On the first it starts again.', evicted: `The ${R.d}th, and the slot is empty. The token turned. New Yorker No. 47, The Eviction, is on the stairs.` }[R.state];
    c.toast(L, 5200); c.egg('pent_token', 'The token over the fire is a dynamic New Yorker: it follows the New York calendar. Rent Day, idea one of thirty.');
  }, 'The token');

  // ---------- the brass rent slot, and the mantel calendar ----------
  const slot = new THREE.Group(); slot.position.set(FX0 + 2.15, 1.25, D / 2 - 0.31); slot.rotation.y = PI; g.add(slot);
  slot.add(box(c, 0.42, 0.18, 0.03, brass, 0, 0, 0)); slot.add(box(c, 0.3, 0.025, 0.035, basic(c, 0x050505), 0, 0, 0.002));
  const sl = c.sign('RENT · IN THE SLOT · BY THE FIFTH', { w: 0.62, h: 0.07, bg: null, fg: '#d8a83a', font: c.MONO, weight: 700 }); sl.position.set(0, 0.16, 0.02); slot.add(sl);
  const env = box(c, 0.24, 0.12, 0.01, std(c, 0xf2ede0, { roughness: 0.9 }), 0, -0.4, 0.3); env.visible = false; slot.add(env);
  c.clickable(slot, () => {
    const R = RENT.now();
    if (R.paid) { c.toast('Already paid this month. He noted it.', 2600); return; }
    env.visible = true; env.position.set(0, -0.35, 0.35); let k = 0;
    const iv = setInterval(() => { k += 0.08; env.position.y = -0.35 + k * 0.35; env.position.z = 0.35 - k * 0.37; if (k >= 1) { clearInterval(iv); env.visible = false; c.sound.thud(0.3); setTimeout(() => c.sound.ding(), 200); RENT.pay(R.key); c.egg('pent_paid', 'You paid the rent. The token turns back to The Landlord until the first. Somewhere downstairs, 4F did not.'); } }, 30);
  }, 'Pay the rent');

  const cal = new THREE.Group(); cal.position.set(FX0 - 1.2, 1.7, FZ + 0.02); cal.rotation.y = PI; g.add(cal);
  cal.add(box(c, 0.34, 0.3, 0.1, brass, 0, 0, 0));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.22), new THREE.MeshBasicMaterial({ toneMapped: false })); face.position.set(0, 0.0, 0.052); cal.add(face);
  let last = '';
  const draw = () => { const R = RENT.now(), key = R.d + '/' + R.m + '/' + RENT.dayShift; if (key === last) return; last = key; face.material.map = c.canvasTex(256, 200, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8281e'; q.fillRect(0, 0, w, 46); q.fillStyle = '#fff'; q.font = `800 30px ${c.MONO}`; q.textAlign = 'center'; q.fillText(MONTH_NAMES[R.m - 1].toUpperCase(), w / 2, 34); q.fillStyle = R.d <= 5 ? '#141414' : '#c8281e'; q.font = `900 120px ${c.SERIF}`; q.fillText(String(R.d), w / 2, 168); q.fillStyle = '#7a6a50'; q.font = `600 15px ${c.MONO}`; q.fillText(RENT.dayShift ? 'TURNED BY YOU' : 'TODAY IN NEW YORK', w / 2, 192); }); face.material.needsUpdate = true; };
  c.tick((t, dt, P, ri) => { if (ri === r.i) draw(); });
  c.clickable(cal, () => { RENT.dayShift = (RENT.dayShift + 1) % 31; c.sound.ticket(); if (!RENT.dayShift) c.toast('The calendar is back to today.', 2200); c.egg('pent_calendar', 'Turn the calendar and the token turns with it. Rent Day lives on the New York calendar; the calendar only lets you see ahead.'); }, 'Turn the calendar');
}

function keyWall(c, r, g, X, gold, lacquer) {
  const { THREE } = c, x = 0.16, z0 = -7.2, z1 = 1.4, y0 = 1.0, y1 = 4.4, COLS = 16, ROWS = 7;
  g.add(box(c, 0.06, y1 - y0 + 0.6, z1 - z0 + 0.6, lacquer, x - 0.02, (y0 + y1) / 2, (z0 + z1) / 2));
  const t = c.sign('EVERY KEY ON BROADWAY', { w: 3.4, h: 0.26, bg: null, fg: '#d8a83a', font: c.SERIF, weight: 800 }); t.position.set(x + 0.03, y1 + 0.18, (z0 + z1) / 2); t.rotation.y = PI / 2; g.add(t);
  // one key: a ring and a shaft and two teeth, merged into one instanced geometry
  const parts = [new THREE.TorusGeometry(0.035, 0.009, 6, 14), new THREE.BoxGeometry(0.012, 0.11, 0.01).translate(0, -0.09, 0), new THREE.BoxGeometry(0.03, 0.014, 0.01).translate(0.015, -0.13, 0), new THREE.BoxGeometry(0.022, 0.014, 0.01).translate(0.011, -0.105, 0)];
  const keyGeo = mergeGeo(THREE, parts); keyGeo.scale(1.7, 1.7, 1.7);
  const N = COLS * ROWS, inst = new THREE.InstancedMesh(keyGeo, gold, N), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  const base = [];
  for (let i = 0; i < N; i++) { const cI = i % COLS, rI = (i / COLS) | 0; base.push([z0 + (cI + 0.5) * (z1 - z0) / COLS, y1 - (rI + 0.5) * (y1 - y0) / ROWS, Math.random() * 9]); }
  g.add(inst);
  const hooks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6).rotateZ(PI / 2), gold, N); g.add(hooks);
  base.forEach(([z, y], i) => { M.makeTranslation(x + 0.03, y + 0.04, z); hooks.setMatrixAt(i, M); });
  // the empty hook, tagged 4F: it fills when 4F is empty
  const tag = c.sign('4F', { w: 0.12, h: 0.07, bg: '#f2ede0', fg: '#c8281e', font: c.MONO, weight: 800 }); const last = base[N - 1]; tag.position.set(x + 0.05, last[1] - 0.16, last[0] + 0.05); tag.rotation.y = PI / 2; g.add(tag);
  let n4 = 0; CH.on((n) => { n4 = n; });
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return;
    for (let i = 0; i < N; i++) {
      const [z, y, ph] = base[i], show = i < N - 1 || n4 >= 12;
      e.set(0, 0, Math.sin(t * 1.3 + ph) * 0.06); q.setFromEuler(e); e.set(0, PI / 2, 0); const q2 = new THREE.Quaternion().setFromEuler(e); q.premultiply(q2);
      p.set(x + 0.05, y, z); s.setScalar(show ? 1 : 0.0001); M.compose(p, q, s); inst.setMatrixAt(i, M);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
  const hit = box(c, 0.2, y1 - y0, z1 - z0, new THREE.MeshBasicMaterial({ visible: false }), x + 0.1, (y0 + y1) / 2, (z0 + z1) / 2); g.add(hit);
  c.clickable(hit, () => c.egg('pent_keys', n4 >= 12 ? 'A hundred and twelve keys. The last hook has its key now: 4F, picked up off a bare floor in October.' : `A hundred and eleven keys, and one empty hook marked 4F. 4F is in chapter ${n4} of 12. The hook can wait. He is a patient man.`), 'The wall of keys');
}

function mergeGeo(THREE, parts) {
  const pos = [], nor = [], idx = []; let off = 0;
  for (const p0 of parts) { const p = p0.index ? p0 : p0; const a = p.attributes.position, nm = p.attributes.normal; for (let i = 0; i < a.count; i++) { pos.push(a.getX(i), a.getY(i), a.getZ(i)); nor.push(nm.getX(i), nm.getY(i), nm.getZ(i)); } const ix = p.index ? p.index.array : [...Array(a.count).keys()]; for (const v of ix) idx.push(v + off); off += a.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}

function rentBoard(c, r, g, X, lacquer, gold) {
  const { THREE } = c, BX = W - 0.16, BZ = -3.4, BY = 3.4, BW = 6.2, BH = 2.5;
  g.add(box(c, 0.1, BH + 0.3, BW + 0.3, gold, BX + 0.02, BY, BZ)); g.add(box(c, 0.12, BH + 0.1, BW + 0.1, lacquer, BX, BY, BZ));
  const cv = document.createElement('canvas'); cv.width = 1536; cv.height = 620; const q = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.set(BX - 0.07, BY, BZ); face.rotation.y = -PI / 2; g.add(face);
  const UNITS = ['1A', '1B', '2A', '2C', '3A', '3D', '4A', '4B', '4C', '4F', '5A', '5C'];
  const seedState = (u, R) => { if (u === '4B') return 'VACANT'; if (u === '4F') return CH.n >= 12 ? 'VACANT' : CH.n >= 2 ? 'SERVED' : R.state === 'due' ? 'LATE' : 'LATE'; const hsh = (u.charCodeAt(0) * 7 + u.charCodeAt(1) * 13 + R.m) % 10; if (R.state === 'due') return R.d * 2 > hsh ? 'PAID' : 'DUE'; return hsh < 8 ? 'PAID' : (R.state === 'evicted' ? 'SERVED' : 'LATE'); };
  const cells = new Map(); const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$,';
  let lastSec = -1, collected = 0;
  const flapText = (key, target, t0) => { const t = performance.now() / 1000; let s = cells.get(key); if (!s || s.target !== target) { s = { target, t0: t, from: s ? s.shown : ' '.repeat(target.length) }; cells.set(key, s); if (t > 1) c.sound.tick(); } const out = [...target].map((ch, i) => (t - s.t0 > 0.12 + i * 0.05 ? ch : ABC[(Math.random() * ABC.length) | 0])).join(''); s.shown = out; return out; };
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return;
    const R = RENT.now(), sec = Math.floor(performance.now() / 125); if (sec === lastSec) return; lastSec = sec;
    q.fillStyle = '#07070a'; q.fillRect(0, 0, cv.width, cv.height);
    q.fillStyle = '#d8a83a'; q.font = `800 40px ${c.MONO}`; q.textAlign = 'left'; q.fillText(`RENT ROLL · BROADWAY HOLDINGS · ${MONTH_NAMES[R.m - 1].toUpperCase()} ${R.y}`, 40, 62);
    const due = new Date(R.y, R.m - 1, 6, 0, 0, 0), now = new Date(R.y, R.m - 1, R.d, R.h, R.mi, R.s), left = Math.max(0, (due - now) / 1000);
    const head = R.state === 'paid' ? 'YOUR RENT · PAID · NOTED' : R.state === 'due' ? `DUE IN ${Math.floor(left / 86400)}D ${String(Math.floor(left / 3600) % 24).padStart(2, '0')}:${String(Math.floor(left / 60) % 60).padStart(2, '0')}:${String(Math.floor(left) % 60).padStart(2, '0')}` : 'PAST DUE · MARSHAL NOTIFIED';
    q.fillStyle = R.state === 'evicted' ? '#ff7a1a' : '#f4ead2'; q.font = `900 56px ${c.MONO}`; q.fillText(head, 40, 136);
    UNITS.forEach((u, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6, x = 40 + col * 740, y = 210 + row * 66, st = seedState(u, R);
      q.fillStyle = '#16161c'; q.fillRect(x, y - 46, 680, 58);
      q.fillStyle = '#f4ead2'; q.font = `800 40px ${c.MONO}`; q.fillText(u, x + 16, y);
      q.fillStyle = { PAID: '#22c55e', DUE: '#f5c542', LATE: '#ff7a1a', SERVED: '#ff3b3b', VACANT: '#8a8aa0' }[st]; q.fillText(flapText(u, st.padEnd(6), t), x + 160, y);
      q.fillStyle = '#6a6a7a'; q.font = `600 26px ${c.MONO}`; q.fillText(u === '4F' ? `CHAPTER ${CH.n} / 12` : st === 'PAID' ? '$' + (1800 + ((u.charCodeAt(1) * 97 + i * 211) % 1900)) : '', x + 430, y);
    });
    collected += (R.state === 'evicted' ? 0.4 : 3.1) * (1 + Math.random());
    q.fillStyle = '#d8a83a'; q.font = `700 30px ${c.MONO}`; q.fillText(`COLLECTED THIS MONTH  $${Math.floor(212000 + R.d * 9100 + collected).toLocaleString('en-US')}`, 40, 600);
    tex.needsUpdate = true;
  });
  c.clickable(face, () => c.egg('pent_board', 'The rent roll, live: two hundred and twelve units across Broadway. From the first to the fifth the money climbs. On the sixth the board starts writing SERVED.'), 'The rent roll');
}

function vitrine(c, r, g, X, gold, brass) {
  const { THREE } = c, VX = 15.6, VZ = 3.4, VW = 3.2, VD = 0.9, VY = 0.95;
  g.add(box(c, VW + 0.1, VY, VD + 0.1, std(c, 0x0a0a0c, { roughness: 0.2 }), VX, VY / 2, VZ));
  g.add(box(c, VW + 0.14, 0.04, VD + 0.14, gold, VX, VY + 0.02, VZ));
  const glassM = new THREE.MeshStandardMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.12, metalness: 0.9, roughness: 0.03, depthWrite: false });
  const gb = new THREE.Mesh(new THREE.BoxGeometry(VW, 0.62, VD), glassM); gb.position.set(VX, VY + 0.33, VZ); g.add(gb);
  c.wall(X(VX - VW / 2 - 0.1), VZ - VD / 2 - 0.1, X(VX + VW / 2 + 0.1), VZ - VD / 2 - 0.1); c.wall(X(VX - VW / 2 - 0.1), VZ + VD / 2 + 0.1, X(VX + VW / 2 + 0.1), VZ + VD / 2 + 0.1);
  c.wall(X(VX - VW / 2 - 0.1), VZ - VD / 2 - 0.1, X(VX - VW / 2 - 0.1), VZ + VD / 2 + 0.1); c.wall(X(VX + VW / 2 + 0.1), VZ - VD / 2 - 0.1, X(VX + VW / 2 + 0.1), VZ + VD / 2 + 0.1);
  const lbl = c.sign('WHAT 4F LEFT BEHIND', { w: 1.6, h: 0.13, bg: '#d8a83a', fg: '#120c04', font: c.MONO, weight: 800 }); lbl.position.set(VX, VY - 0.18, VZ - VD / 2 - 0.06); lbl.rotation.y = PI; g.add(lbl);
  // a small gilded copy of everything that leaves 4F, in the order it leaves
  const gilt = new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.85, roughness: 0.22, emissive: 0x5a3a08, emissiveIntensity: 0.6 });
  const items = [];
  Object.entries(FURN).forEach(([k, list]) => list.forEach(([name, size], j) => {
    if (j > 0 && name === list[j - 1][0]) return;   // one chair is enough to say the table went
    const slotI = items.length, x = VX - VW / 2 + 0.3 + (slotI % 7) * 0.43, z = VZ + (slotI < 7 ? -0.2 : 0.2);
    const o = { h: size.h ? size.h * 0.22 : undefined, len: size.len ? size.len * 0.22 : undefined, raw: true, y: VY + 0.04 };
    const m = c.glb(/^(nyb_|ph_)/.test(name) ? name : 'ph_' + name, { h: o.h, len: o.len, x, y: o.y, z, ry: PI + (slotI % 3 - 1) * 0.3, parent: g, shadow: false, onload: (gg) => gg.traverse((n) => { if (n.isMesh) n.material = gilt; }) });
    m.visible = false; items.push({ k: +k, m });
  }));
  CH.on((n) => items.forEach((it) => { it.m.visible = it.k <= n; }));
  c.clickable(gb, () => {
    const gone = LEAVES.filter((l) => l.k <= CH.n);
    c.toast(gone.length ? `In the case, gilded: ${gone.map((l) => l.what).join(', ')}. Each one left 4F the month it shows up here. ${MONTHS[CH.n]}.` : 'The case is empty. 4F still has everything. It is October 2026, and he can wait.', 5600);
    c.egg('pent_case', 'His glass case follows 4F downstairs: whatever the apartment loses that month, he has a little gold copy of by the first.');
  }, 'The glass case');
}

function desk(c, r, g, X, gold) {
  const { THREE } = c, DX = 16.8, DZ = -5.4;
  prop(c, r, g, X, 'nyb_wolf_desk', DX, DZ, { len: 2.0, ry: -PI / 2, r: 1.0 });
  prop(c, r, g, X, 'nyb_register_gold', DX - 0.1, DZ + 0.4, { h: 0.34, y: 0.78, ry: -PI / 2 });
  // the money counter: bills riffling through, forever
  const counter = new THREE.Group(); counter.position.set(DX - 0.05, 0.8, DZ - 0.4); g.add(counter);
  counter.add(box(c, 0.28, 0.16, 0.24, std(c, 0x1a1a1e, { metalness: 0.5, roughness: 0.4 }), 0, 0.08, 0));
  const billM = new THREE.MeshStandardMaterial({ color: 0x9fbf88, roughness: 0.8 }), bills = [];
  for (let i = 0; i < 14; i++) { const b = box(c, 0.16, 0.002, 0.07, billM, 0, 0.18, 0); counter.add(b); bills.push(b); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const sp = RENT.now().state === 'evicted' ? 0.6 : 3.2; bills.forEach((b, i) => { const u = (t * sp + i / 14) % 1; b.position.set(-0.02 + u * 0.06, 0.17 + Math.sin(u * PI) * 0.09, 0); b.rotation.z = -u * 2.6; }); if (Math.random() < 0.02 * sp && c.sound.tick) c.sound.tick(); });
  const hit = box(c, 0.4, 0.4, 0.4, new THREE.MeshBasicMaterial({ visible: false }), DX - 0.05, 1.0, DZ - 0.4); g.add(hit);
  c.clickable(hit, () => c.egg('pent_counter', 'The money counter. On the first it runs so fast it whistles. After the sixth it slows to a crawl and he gets nervous, which is when he sends the paper.'), 'The money counter');
}

function telescope(c, r, g, X, brass) {
  const { THREE } = c, SX = 7.4, SZ = -6.7;
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2, l = cyl(c, 0.015, 0.02, 1.25, brass, SX + Math.cos(a) * 0.22, 0.6, SZ + Math.sin(a) * 0.22, 8); l.rotation.z = Math.cos(a) * 0.32; l.rotation.x = -Math.sin(a) * 0.32; g.add(l); }
  const tube = cyl(c, 0.06, 0.085, 1.1, brass, SX, 1.3, SZ, 20); tube.rotation.x = PI / 2 - 0.12; tube.rotation.z = 0.5; g.add(tube);
  c.post(X(SX), SZ, 0.4);
  let ov;
  c.clickable(tube, () => {
    if (!ov) { ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:60;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer'; ov.innerHTML = '<div style="position:relative;width:min(80vmin,720px);aspect-ratio:1;border-radius:50%;overflow:hidden;box-shadow:0 0 0 9999px #000,inset 0 0 90px 40px #000"><img src="assets/plates/street.jpg" style="position:absolute;left:50%;top:50%;height:150%;transform:translate(-46%,-52%);filter:saturate(1.1) contrast(1.05)"></div><div id="pent-scope" style="position:absolute;bottom:8vh;left:0;right:0;text-align:center;color:#f4ead2;font:600 15px var(--mono,monospace);letter-spacing:.04em;padding:0 24px"></div>'; ov.onclick = () => { ov.style.display = 'none'; }; document.body.appendChild(ov); }
    ov.querySelector('#pent-scope').textContent = CH.n >= 12 ? 'Broadway under the J, from ninety floors. The window of 4F is dark. Tap to look away.' : 'Broadway under the J, from ninety floors, through a telescope he bought for this. Fourth floor, far left: the light in 4F is still on. Tap to look away.';
    ov.style.display = 'flex'; c.sound.whoosh(0.3, 1);
    c.egg('pent_scope', 'His telescope does not point at the stars. It points at Williamsburg.');
  }, 'The telescope');
}
