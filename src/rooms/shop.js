// IV. THE MUSEUM. Room 12: THE GIFT SHOP.
// Every museum ends in a gift shop, even the one inside a pigeon. Everything is 3 for $10.
//
// HEADLINE ILLUSION: the snow globes are live (render target portals). Each globe on the back shelf is a sphere whose
// surface samples a virtual camera standing in another room of the show, so the shelf holds the whole exhibition in
// miniature, live, with real snow falling inside the glass. The spheres draw their BACK faces only, so the snow (in
// this room, inside the glass) sits in front of the far wall of the globe, and when you ride into the big globe on
// the counter the whole inside of the sphere becomes the subway car. Shake it once, then go in: you wake up on the N,
// one loop later, where the show began.
//
// The engine renders at most two portals a frame and favours the biggest. A shelf of eleven would starve, so this room
// deals the turns itself: every three frames one on screen shelf globe is made eligible (its portal is handed to this
// room), the rest keep showing the last frame they drew. Snow runs every frame, so the shelf never looks paused.
import { figure, parts, audience, CROWD_ON } from '../crowd.js';
import { rigged } from '../rig.js';
export default {
  id: 'shop', name: 'The Gift Shop', scale: 'IV · The museum', sound: 'shop',
  kicker: 'Every museum ends in a gift shop, even the one inside a pigeon. The snow globes are not souvenirs. They are the rooms.',
  sky: 0x2a2440, fog: 0x2a2440, fogD: 0.006, hemi: [0xfff4ea, 0x6b5a4c, 0.95], env: 0.75,
  post: { dream: 0.12, bloom: 0.55, vig: 0.32, sat: 1.04, grain: 0.07, ca: 0.002 },
  spawn: [0, 2.7, 0],
  build(c) {
    const { THREE, R } = c;
    const S = R.state;
    const W = 12, HW = 6, ZB = -5, ZF = 4.6, CH = 3.42;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
    const put = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; c.add(o); return o; };
    const tag = (text, x, y, z, ry = 0, w = 0.36, h = 0.1, pink = false) => put(c.sign(text, { w, h, bg: pink ? '#ff2e63' : '#f0f4f8', fg: pink ? '#f0f4f8' : '#02040c', font: c.MONO, weight: 700, px: 128, border: pink ? '#f0f4f8' : '#ff2e63', pad: 0.14 }), x, y, z, ry);
    const store = (() => { try { return JSON.parse(localStorage.getItem('pigeonhole.shop.v1') || '{}'); } catch (e) { return {}; } })();
    store.book ||= []; store.stk ||= []; store.pennies ||= 0;
    const keep = () => { try { localStorage.setItem('pigeonhole.shop.v1', JSON.stringify(store)); } catch (e) {} };
    const G = window.STICKER_GROUPS || {}, EYE_S = G.eye || [], MLOW_S = G.mlow || [], MUS_S = G.museum || [], STR_S = G.street || [];
    const CAST = window.CAST || {};

    // ---------- materials ----------
    const floorM = c.surf('terrazzo', 2.2);
    const ceilM = c.surf('ceiling', 1.2, { tint: 0xf4f0ea });
    const paint = std(0xf3efe6, { roughness: 0.88 });
    const cobalt = std(0x2962ff, { roughness: 0.42 });
    const navy = std(0x06163a, { roughness: 0.55 });
    const ink = std(0x0b0d16, { roughness: 0.5 });
    const copper = std(0xbe854c, { metalness: 1, roughness: 0.32 });
    const chrome = std(0xd4d9df, { metalness: 1, roughness: 0.18 });
    const pinkP = new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0xff2e63, emissiveIntensity: 0.12 });
    const violetP = new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x6f23a8, emissiveIntensity: 0.15 });
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, roughness: 0.03, metalness: 0, envMapIntensity: 2.2, depthWrite: false });
    const glow = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });

    // ---------- the box: terrazzo, drop ceiling, bone walls, a cobalt wainscot and a hot pink band ----------
    c.box(W, 0.1, ZF - ZB, floorM, 0, -0.05, (ZF + ZB) / 2, { collide: false });
    c.box(W, 0.08, ZF - ZB, ceilM, 0, CH + 0.04, (ZF + ZB) / 2, { collide: false });
    for (const sx of [-1, 1]) {
      c.box(0.1, CH, ZF - ZB, paint, sx * (HW + 0.05), CH / 2, (ZF + ZB) / 2);
      c.box(0.02, 0.9, ZF - ZB, cobalt, sx * (HW - 0.01), 0.45, (ZF + ZB) / 2, { collide: false });
      c.box(0.02, 0.12, ZF - ZB, pinkP, sx * (HW - 0.01), 2.36, (ZF + ZB) / 2, { collide: false });
    }
    c.box(W, CH, 0.1, paint, 0, CH / 2, ZB - 0.05);
    c.box(W, 0.12, 0.02, pinkP, 0, 2.36, ZB + 0.01, { collide: false });
    // the front wall, with the doorway back to the museum
    const DW = 0.75;
    for (const sx of [-1, 1]) {
      const a = DW, b = HW, cx = sx * (a + b) / 2, w = b - a;
      c.box(w, CH, 0.1, paint, cx, CH / 2, ZF + 0.05);
      c.box(w, 0.9, 0.02, cobalt, cx, 0.45, ZF - 0.01, { collide: false });
      c.box(w, 0.12, 0.02, pinkP, cx, 2.36, ZF - 0.01, { collide: false });
    }
    c.box(DW * 2, CH - 2.35, 0.1, paint, 0, 2.35 + (CH - 2.35) / 2, ZF + 0.05, { collide: false });
    for (const [w, h, x, y] of [[0.08, 2.35, -DW - 0.02, 1.175], [0.08, 2.35, DW + 0.02, 1.175], [DW * 2 + 0.12, 0.08, 0, 2.37]]) c.add(c.slab(w, h, 0.16, copper, x, y, ZF));
    // beyond the doorway: the museum's dark, and a little of its light
    const beyond = new THREE.Mesh(new THREE.PlaneGeometry(DW * 2, 2.35), new THREE.MeshBasicMaterial({ map: c.canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1030'); gr.addColorStop(0.7, '#1b1f3a'); gr.addColorStop(1, '#3a3020'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), toneMapped: false }));
    put(beyond, 0, 1.175, ZF + 0.6, Math.PI);
    c.box(DW * 2, 0.1, 0.7, ink, 0, -0.04, ZF + 0.35, { collide: false });
    c.wall(-DW, ZF + 0.6, DW, ZF + 0.6);
    const exitS = c.sign('EXIT TO THE MUSEUM', { w: 1.3, h: 0.2, bg: '#02040c', fg: '#00e5ff', font: c.MONO, glow: 12, px: 128 }); put(exitS, 0, 2.6, ZF - 0.02, Math.PI);
    tag('NO RE ENTRY.\nEXCEPT ALWAYS.', 1.0, 2.15, ZF - 0.02, Math.PI, 0.36, 0.12);
    tag('OPEN 3:33 TO 3:33\nCLOSED NEVER', -1.0, 2.2, ZF - 0.02, Math.PI, 0.38, 0.12, true);
    c.door({ x: 0, z: ZF - 0.25, r: 0.42, to: 'museum' });

    // ---------- light: a bright shop. Ceiling panels glow, six point lights do the modelling ----------
    {
      const geos = [];
      for (const x of [-3.6, 0, 3.6]) for (const z of [-3.2, -0.2, 2.8]) geos.push(new THREE.BoxGeometry(1.2, 0.03, 0.6).translate(x, CH - 0.015, z));
      c.add(new THREE.Mesh(c.merge(geos), glow(0xfff8f0)));
    }
    c.light(0, 3.1, 0.6, 0xfff2e2, 2.6, 14);
    c.light(0, 2.7, -3.7, 0xdde8ff, 2.4, 6.5);
    c.light(-0.35, 2.3, -1.15, 0xffdcb8, 1.5, 3.4, (t) => 0.9 + 0.1 * Math.sin(t * 3.1));
    c.light(-4.4, 2.7, -0.2, 0xffe6cc, 2.0, 7.5);
    c.light(4.4, 2.7, -0.2, 0xffe6cc, 2.0, 7.5);
    c.light(0, 2.6, 3.4, 0xff9ec0, 1.1, 6);

    // ---------- canvas kit: I EYE NY, shirts, mugs, totes, pennants, keychains, the PIGEONCARD ----------
    const iEye = (g, cx, cy, s, fg) => {
      g.save(); g.fillStyle = fg; g.font = `900 ${s}px ${c.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('I', cx - s * 0.42, cy - s * 0.5); c.eyeFlower(g, cx + s * 0.42, cy - s * 0.52, s * 0.5, {}); g.fillText('NY', cx, cy + s * 0.48); g.restore();
    };
    const SHIRT_C = ['#f0f4f8', '#02040c', '#ff2e63', '#2962ff', '#06163a', '#6f23a8'];
    const shirtT = c.canvasTex(256 * SHIRT_C.length, 256, (g) => {
      SHIRT_C.forEach((col, i) => {
        g.save(); g.translate(i * 256, 0);
        g.fillStyle = col; g.beginPath();
        g.moveTo(96, 22); g.quadraticCurveTo(128, 50, 160, 22); g.lineTo(204, 36); g.lineTo(248, 88); g.lineTo(214, 114); g.lineTo(196, 98); g.lineTo(196, 242); g.lineTo(60, 242); g.lineTo(60, 98); g.lineTo(42, 114); g.lineTo(8, 88); g.lineTo(52, 36); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; g.stroke();
        iEye(g, 128, 128, 56, i === 0 ? '#02040c' : '#f0f4f8');
        g.restore();
      });
    });
    const mugT = c.canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#f0f4f8'; g.fillRect(0, 0, w, h); iEye(g, 128, 70, 40, '#02040c'); iEye(g, 384, 70, 40, '#ff2e63'); g.fillStyle = '#2962ff'; g.fillRect(0, h - 10, w, 10); });
    const TOTES = [['I EYE NY', '#f0f4f8', '#02040c'], ['I WENT DOWN\nTHE PIGEONHOLE\nAND ALL I GOT\nWAS THIS TOTE', '#e9dcc0', '#06163a'], ['MUSEUM OF\nMODERN\nPIGEON', '#06163a', '#f0f4f8'], ['3 FOR $10', '#ff2e63', '#f0f4f8']];
    const toteT = c.canvasTex(256 * 4, 300, (g) => {
      TOTES.forEach(([t, bg, fg], i) => {
        g.save(); g.translate(i * 256, 0); g.fillStyle = bg; g.fillRect(8, 8, 240, 284);
        if (i === 0) iEye(g, 128, 150, 70, fg);
        else { g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; const L = t.split('\n'), fs = L.length > 2 ? 30 : 44; g.font = `900 ${fs}px ${c.FONT}`; L.forEach((l, k) => g.fillText(l, 128, 150 + (k - (L.length - 1) / 2) * fs * 1.15)); }
        g.restore();
      });
    });
    const PENN = [['NEW YORK', '#2962ff'], ['PIGEONHOLE', '#ff2e63'], ['LOOP', '#06163a'], ['3 FOR $10', '#6f23a8'], ['I EYE NY', '#02040c'], ['GIFT SHOP', '#be854c'], ['COO', '#2962ff'], ['EXIT', '#ff2e63']];
    const pennT = c.canvasTex(512 * 2, 160 * 4, (g) => {
      PENN.forEach(([t, col], i) => {
        const x0 = (i % 2) * 512, y0 = Math.floor(i / 2) * 160;
        g.fillStyle = col; g.beginPath(); g.moveTo(x0 + 4, y0 + 6); g.lineTo(x0 + 508, y0 + 80); g.lineTo(x0 + 4, y0 + 154); g.closePath(); g.fill();
        g.fillStyle = '#f0f4f8'; g.fillRect(x0, y0 + 6, 18, 148);
        g.font = `900 46px ${c.FONT}`; g.textBaseline = 'middle'; g.fillText(t, x0 + 40, y0 + 82);
      });
    });
    const keyT = c.canvasTex(512, 160, (g) => {
      g.fillStyle = '#f0f4f8'; g.fillRect(0, 0, 128, 160); g.fillRect(384, 0, 128, 160); g.fillStyle = '#02040c'; g.fillRect(128, 0, 128, 160); g.fillStyle = '#f0f4f8'; g.fillRect(256, 0, 128, 160);
      g.save(); c.eyeFlower(g, 64, 80, 60, {}); g.restore();
      g.fillStyle = '#2962ff'; g.fillRect(140, 30, 104, 100); g.fillStyle = '#f0f4f8'; g.font = `800 20px ${c.MONO}`; g.fillText('PIGEON', 152, 70); g.fillText('CARD', 160, 98);
      g.fillStyle = '#ff2e63'; g.fillRect(276, 20, 104, 120); g.fillStyle = '#f0f4f8'; g.font = `900 64px ${c.FONT}`; g.fillText('NY', 284, 104);
      g.fillStyle = '#06163a'; g.beginPath(); g.ellipse(448, 86, 46, 32, 0, 0, 7); g.fill(); g.beginPath(); g.arc(476, 52, 20, 0, 7); g.fill(); g.fillStyle = '#be854c'; g.beginPath(); g.moveTo(494, 52); g.lineTo(508, 58); g.lineTo(494, 62); g.fill();
    });
    const cardT = c.canvasTex(512, 320, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2962ff'); gr.addColorStop(1, '#00e5ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffd21f'; g.fillRect(0, h - 64, w, 64); g.fillStyle = '#02040c'; g.font = `900 64px ${c.FONT}`; g.fillText('PIGEONCARD', 26, 92);
      g.font = `600 22px ${c.MONO}`; g.fillText('UNLIMITED RIDE. ONE WAY. ALL SCALES.', 26, h - 24);
      c.eyeFlower(g, w - 92, 168, 64, {}); g.fillStyle = '#f0f4f8'; g.font = `600 20px ${c.MONO}`; g.fillText('INSERT THIS WAY. ANY WAY.', 26, 150);
    });
    // the generated card art replaces the drawn one if it exists
    const cardM = new THREE.MeshStandardMaterial({ map: cardT, roughness: 0.35, emissive: 0xffffff, emissiveMap: cardT, emissiveIntensity: 0.25 });
    c.tex.load('assets/g/g_metrocard.jpg', (t) => { t.colorSpace = THREE.SRGBColorSpace; cardM.map = cardM.emissiveMap = t; cardM.needsUpdate = true; }, undefined, () => {});

    // a plane with its uvs pointed at one cell of an atlas
    const cell = (w, h, cols, rows, i, flipX) => { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; const cx = i % cols, cy = Math.floor(i / cols); for (let k = 0; k < uv.count; k++) { const u = flipX ? 1 - uv.getX(k) : uv.getX(k); uv.setXY(k, (cx + u) / cols, 1 - (cy + 1 - uv.getY(k)) / rows); } return g; };

    // ---------- paint drips, as geometry, off every lip that has one ----------
    const drips = { pink: [], violet: [] };
    const drip = (col, x, y, z, len, r = 0.012, flat) => {
      const parts = [new THREE.CylinderGeometry(r * 0.55, r * 0.8, len, 7, 1).translate(0, -len / 2, 0), new THREE.SphereGeometry(r * 1.2, 8, 6).translate(0, -len, 0), new THREE.SphereGeometry(r * 1.4, 8, 4).scale(1.5, 0.5, 1.5)];
      for (const p of parts) { if (flat === 'x') p.scale(0.4, 1, 1); if (flat === 'z') p.scale(1, 1, 0.4); p.translate(x, y, z); drips[col].push(p); }
    };

    // ---------- the counter, and the big globe on it ----------
    const CZ = -1.6, CX0 = -2.2, CX1 = 2.2, CTOP = 1.0;
    c.box(CX1 - CX0, CTOP - 0.04, 0.7, navy, 0, (CTOP - 0.04) / 2, CZ);
    c.box(CX1 - CX0 + 0.08, 0.05, 0.78, new THREE.MeshPhysicalMaterial({ color: 0x8f96a8, roughness: 0.3, clearcoat: 1 }), 0, CTOP - 0.02, CZ, { collide: false });
    c.add(c.slab(CX1 - CX0 + 0.1, 0.03, 0.02, copper, 0, CTOP - 0.05, CZ + 0.4));
    c.box(CX1 - CX0, 0.06, 0.02, cobalt, 0, 0.06, CZ + 0.36, { collide: false });
    for (let k = 0; k < 15; k++) drip(Math.random() < 0.8 ? 'pink' : 'violet', rnd(CX0 + 0.1, CX1 - 0.1), CTOP - 0.04, CZ + 0.395, rnd(0.05, 0.45), rnd(0.008, 0.016), 'z');
    // a puddle where the longest ones landed
    { const pud = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20).rotateX(-Math.PI / 2), pinkP); pud.scale.set(1.6, 1, 0.6); put(pud, 0.9, 0.004, CZ + 0.5); }
    tag('NO REFUNDS ON DREAMS', -1.2, 0.62, CZ + 0.365, 0, 0.6, 0.1, true);
    tag('WE TAKE CASH, PIGEONCARD\nAND CRUMBS', 1.25, 0.62, CZ + 0.365, 0, 0.6, 0.14);
    // stickers bombed over the counter front, where the line waits
    for (let k = 0; k < 26; k++) c.sticker(pick([...EYE_S.slice(0, 40), ...MLOW_S, ...STR_S.slice(0, 12)]), rnd(CX0 + 0.15, CX1 - 0.15), rnd(0.18, 0.82), CZ + 0.355, { size: rnd(0.1, 0.2) });

    // the big globe: the N train, original, not for sale
    const BG = new THREE.Group(); BG.position.set(-0.35, CTOP, CZ + 0.05); c.add(BG);
    const BR = 0.15;
    BG.add(c.slab(0.36, 0.1, 0.36, ink, 0, 0.05, 0));
    const bBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.12, 40), copper); bBase.position.y = 0.16; BG.add(bBase);
    const bBand = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.008, 8, 48), glow(0x00e5ff)); bBand.rotation.x = Math.PI / 2; bBand.position.y = 0.2; BG.add(bBand);
    const bTag = c.sign('THE N. WHERE IT STARTED.', { w: 0.24, h: 0.035, bg: '#be854c', fg: '#02040c', font: c.MONO, px: 64 }); bTag.position.set(0, 0.15, 0.152); bTag.rotation.x = -0.25; BG.add(bTag);
    const bSrc = new THREE.Object3D(); bSrc.position.set(0, 0.22 + BR - 0.01, 0); BG.add(bSrc);
    const bMesh = new THREE.Mesh(new THREE.SphereGeometry(BR, 48, 32)); bMesh.position.copy(bSrc.position); BG.add(bMesh);
    const bShell = new THREE.Mesh(new THREE.SphereGeometry(BR + 0.003, 48, 32), glassM); bShell.position.copy(bSrc.position); bShell.renderOrder = 6; BG.add(bShell);
    tag('THE N TRAIN, AS NEW.\nPRICELESS. ALSO 3 FOR $10.', -0.35, CTOP + 0.035, CZ + 0.33, 0, 0.36, 0.09, true).rotation.x = -1.1;

    // ---------- snow: one little weather system per globe ----------
    const flakeT = c.canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
    const SNOW = [];
    const snow = (parent, r, n, size) => {
      const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, q = Math.sqrt(Math.random()) * r * 0.8; pos[i * 3] = Math.cos(a) * q; pos[i * 3 + 1] = rnd(-0.6, 0.8) * r; pos[i * 3 + 2] = Math.sin(a) * q; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: flakeT, size, transparent: true, depthWrite: false, fog: false, color: 0xe8eef6 }));
      pts.renderOrder = 5; pts.frustumCulled = false; parent.add(pts);
      const s = { pts, pos, vel, r, n, agit: 0 }; SNOW.push(s); return s;
    };
    const bSnow = snow(bSrc, BR, 200, 0.0075);
    const stepSnow = (s, dt) => {
      const { pos, vel, r, n } = s, a = s.agit; s.agit *= Math.exp(-dt * 0.9);
      const fall = r * 0.16, lim = r * 0.9, lim2 = lim * lim;
      for (let i = 0; i < n; i++) {
        const j = i * 3; let x = pos[j], y = pos[j + 1], z = pos[j + 2];
        vel[j] += ((Math.random() - 0.5) * 3 * a - z * a * 2.5) * r * dt * 6;
        vel[j + 1] += (Math.random() - 0.5) * 3 * a * r * dt * 6 + a * r * dt * 1.5;
        vel[j + 2] += ((Math.random() - 0.5) * 3 * a + x * a * 2.5) * r * dt * 6;
        const dr = Math.exp(-dt * 1.6); vel[j] *= dr; vel[j + 1] *= dr; vel[j + 2] *= dr;
        x += vel[j] * dt + Math.sin(i * 1.7 + y * 40) * r * 0.02 * dt; y += (vel[j + 1] - fall) * dt; z += vel[j + 2] * dt;
        const d2 = x * x + y * y + z * z;
        if (d2 > lim2) { const k = lim / Math.sqrt(d2); x *= k; y *= k; z *= k; vel[j] *= -0.4; vel[j + 1] *= -0.4; vel[j + 2] *= -0.4; }
        if (y < -r * 0.62 && a < 0.2) { const q = Math.sqrt(Math.random()) * r * 0.55, an = Math.random() * 6.283; x = Math.cos(an) * q; z = Math.sin(an) * q; y = r * 0.72; vel[j] = vel[j + 1] = vel[j + 2] = 0; }
        pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
      }
      s.pts.geometry.attributes.position.needsUpdate = true;
    };
    const tinkle = () => { for (let i = 0; i < 7; i++) setTimeout(() => c.sound.tone(rnd(1800, 3600), 0.35, 0.03, 'triangle'), i * 55 + Math.random() * 40); c.sound.thump(0.25); };

    // the portal: a 30 cm globe onto a 3 m car, so k is about 12. Ride in and you are on the train.
    S.shaken = false; S.bShake = 0;
    const bigP = c.portal({ mesh: bMesh, src: bSrc, to: 'car', at: c.spawnOf('car'), k: 12, ride: true, hint: 'Shake it', res: 0.5, maxDist: 14, glass: 0.6, rim: 0xd8ecff, dur: 2.6,
      onArrive: (c2) => { c2.wakeUp(); S.shaken = false; bigHint('Shake it'); c2.toast(`You wake up on the N. Loop ${c2.loop() + 1}. The show begins again, a little more stickered.`, 6000); } });
    bMesh.material.side = THREE.BackSide;
    const shakeBig = () => {
      if (!S.shaken) {
        S.shaken = true; S.bShake = 1.4; bSnow.agit = 2.2; tinkle(); c.shake(0.004);
        bigHint('Go in');
        c.say(eyeHead, pick(['You shook it. Now it is yours. Go on, get in.', 'You break it, you loop it.', 'That one is the N. Everybody gets on eventually.']));
        c.toast('The snow is falling on the N train. Click again to get in.', 3600);
        return;
      }
      window.pigeonhole?.enterPortal?.(bigP);
    };
    c.click(bMesh, shakeBig, 'Shake it');
    c.click(BG, shakeBig, 'Shake it');
    function bigHint(h) { BG.traverse((o) => { if (o.isMesh) o.userData.hint = h; }); }
    bigHint('Shake it');

    // ---------- the globe wall: the whole exhibition, one shelf, live ----------
    const SZ = -4.75, SX0 = -3.1, SX1 = 3.1, TIERS = [0.45, 0.85, 1.25, 1.75, 2.2];
    c.box(SX1 - SX0, 2.45, 0.04, navy, 0, 1.225, ZB + 0.03, { collide: false });
    for (const sx of [SX0, SX1]) c.box(0.05, 2.45, 0.44, copper, sx, 1.225, SZ, { collide: false });
    c.wall(SX0, SZ + 0.24, SX1, SZ + 0.24);
    for (const y of TIERS) {
      c.add(c.slab(SX1 - SX0, 0.025, 0.42, new THREE.MeshPhysicalMaterial({ color: 0x9fc8ff, roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }), 0, y, SZ));
      c.add(c.slab(SX1 - SX0, 0.035, 0.012, copper, 0, y, SZ + 0.215));
      const strip = new THREE.Mesh(new THREE.BoxGeometry(SX1 - SX0 - 0.1, 0.01, 0.02), glow(0xbfe9ff)); strip.position.set(0, y - 0.02, SZ + 0.18); c.add(strip);
    }
    for (let k = 0; k < 10; k++) drip('violet', -2.6 + k * 0.52 + 0.26 + rnd(-0.015, 0.015), 1.25, SZ + 0.222, rnd(0.08, 0.3), 0.008, 'z');
    for (let k = 0; k < 6; k++) drip('pink', rnd(SX0 + 0.2, SX1 - 0.2), 0.85, SZ + 0.222, rnd(0.04, 0.3), 0.009, 'z');
    const ROOMS_SHELF = [
      ['car', 'LAST STOP, 3:33 A.M.', '$3.33'], ['platform', 'WRONG SIZES', 'ONE SIZE FITS NONE'], ['bodega', 'THE BODEGA', '$1 OR 6 FOR $5'],
      ['cooler', 'THE COOLER', 'KEEP REFRIGERATED'], ['stairs', 'THE STAIRS', 'ASSEMBLY REQUIRED'], ['nave', 'THE NAVE', 'NECK NOT INCLUDED'],
      ['crop', 'LOST AND FOUND', 'FINDERS KEEPERS'], ['heart', 'THE HEART', '$14.99, BEATS INCLUDED'], ['wing', 'HALL OF FLIGHT', 'FRAGILE. ALSO FLIES.'],
      ['dome', 'THE HOMING DOME', 'THINKS FOR ITSELF'], ['museum', 'THE MUSEUM', 'A MUSEUM IN A GLOBE IN A MUSEUM'],
    ];
    const SR = 0.1, shelf = [];
    ROOMS_SHELF.forEach(([id, name, price], i) => {
      const x = -2.6 + i * 0.52, grp = new THREE.Group(); grp.position.set(x, TIERS[2] + 0.0125, SZ); c.add(grp);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.075, 28), i % 2 ? ink : copper); base.position.y = 0.0375; grp.add(base);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.004, 6, 32), glow(i % 2 ? 0xff2e63 : 0x00e5ff)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.075; grp.add(ring);
      const src = new THREE.Object3D(); src.position.y = 0.075 + SR - 0.012; grp.add(src);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(SR, 36, 24)); mesh.position.copy(src.position); grp.add(mesh);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(SR + 0.002, 36, 24), glassM); shell.position.copy(src.position); shell.renderOrder = 6; grp.add(shell);
      // a 20 cm globe onto a room about 3 m wide: k about 15
      const P0 = c.portal({ mesh, src, to: id, at: c.spawnOf(id), k: 15, ride: false, res: 0.42, maxDist: 9, glass: 0.55, rim: 0xd8ecff });
      mesh.material.side = THREE.BackSide;
      const sn = snow(src, SR, 60, 0.0055);
      const lab = c.sign(`${i + 1}  ${name}\n${price}`, { w: 0.46, h: 0.075, bg: '#f0f4f8', fg: '#02040c', font: c.MONO, weight: 700, px: 96, pad: 0.1 }); lab.position.set(x, TIERS[2] - 0.035, SZ + 0.224); c.add(lab);
      const g = { id, grp, mesh, P: P0, sn, shake: 0, k: 15 }; shelf.push(g);
      c.click(mesh, () => shakeShelf(g), 'Do not shake');
    });
    // the signs over the shelf
    put(c.sign('PLEASE DO NOT SHAKE THE MERCHANDISE', { w: 4.6, h: 0.36, bg: '#f0f4f8', fg: '#ff2e63', font: c.FONT, weight: 900, px: 160, border: '#02040c', pad: 0.16 }), 0, 2.62, ZB + 0.02);
    put(c.sign('THE GIFT SHOP', { w: 2.6, h: 0.42, bg: null, fg: '#2962ff', font: c.SERIF, weight: 800, glow: 22, px: 192 }), -0.2, 3.1, ZB + 0.02);
    tag('THE WHOLE SHOW, SHAKEN. ELEVEN ROOMS, ONE SHELF.\nLIVE. PLEASE DO NOT SHAKE.', 0, 1.6 + 0.08 + 0.12, SZ + 0.22, 0, 1.5, 0.1, true).position.y = TIERS[3] - 0.05;
    let shakes = 0;
    const shakeShelf = (g) => {
      g.shake = 1.1; g.sn.agit = 2.4; tinkle(); shakes++;
      eyeState.alarm = 2.5;
      c.say(eyeHead, pick(['The sign, sweetheart. The sign.', 'Ma\'am. Ma\'am. That is a whole room.', 'You shook the ' + g.id + '. Somebody in there felt that.', 'Do not shake the merchandise. The merchandise has people in it.']));
      if (shakes >= 3) c.egg('shop_shaker', 'You shook the whole exhibition. Somewhere inside a pigeon, every room had a small earthquake at once.');
    };

    // shelf portals take turns: every three frames, one globe on screen is dealt the render
    let tk = 0, turn = 0; const _p = new THREE.Vector3();
    c.tick(() => {
      tk++; if (tk % 3 !== 1) return;
      const vis = [];
      for (const g of shelf) { g.mesh.getWorldPosition(_p); const d = _p.distanceTo(c.camera.position); _p.project(c.camera); if (d < 9 && _p.z < 1 && Math.abs(_p.x) < 1.2 && Math.abs(_p.y) < 1.2) vis.push(g); }
      turn++; const on = vis.length ? vis[turn % vis.length] : null;
      for (const g of shelf) g.P.R = g === on ? R : null;
    });
    // fog through a globe: the virtual camera stands k times further back than you do, so a room seen through the
    // glass would drown in its own fog. While you are in the shop each globe's room gets thinner fog, easing back to
    // its own as you near the glass (it is exactly its own by the time a ride lands you inside).
    S.fogk = {};
    c.tick(() => {
      const PH = window.pigeonhole; if (!PH) return;
      const want = {};
      for (const g of [...shelf, { id: 'car', mesh: bMesh, k: 12 }]) { g.mesh.getWorldPosition(_p); const d = _p.distanceTo(c.camera.position); const f = Math.min(1, Math.max(0.12, 2.4 / (g.k * Math.max(0.01, d)))); want[g.id] = Math.max(want[g.id] || 0, f); }
      for (const id in want) { const D = PH.ROOMS.find((r) => r.id === id); if (!D) continue; if (!(id in S.fogk)) S.fogk[id] = { v: D.fogD }; D.fogD = (S.fogk[id].v ?? 0.02) * want[id]; }
    });

    // decorative globes: the ones that are only souvenirs. Tiny skyline, settled snow, instanced
    {
      const spots = [];
      for (let i = 0; i < 12; i++) spots.push([-2.75 + i * 0.5, TIERS[1] + 0.0125, SZ + rnd(-0.06, 0.06)]);
      for (let i = 0; i < 6; i++) spots.push([-2.9 + i * 0.36, TIERS[3] + 0.0125, SZ - 0.05]);
      for (let i = 0; i < 9; i++) spots.push([-5.73 + rnd(-0.08, 0.08), 0.62, -4.3 + i * 0.22 + (i > 4 ? 3.9 : 0)]);
      const n = spots.length, dr = 0.06;
      const baseI = new THREE.InstancedMesh(new THREE.CylinderGeometry(dr * 0.85, dr, 0.05, 20).translate(0, 0.025, 0), std(0xffffff, { metalness: 0.6, roughness: 0.35 }), n);
      const shellI = new THREE.InstancedMesh(new THREE.SphereGeometry(dr, 20, 14).translate(0, 0.05 + dr - 0.008, 0), glassM, n);
      const city = []; for (let k = 0; k < 7; k++) { const h = rnd(0.02, 0.07); city.push(new THREE.BoxGeometry(0.012, h, 0.012).translate(rnd(-0.03, 0.03), 0.06 + h / 2, rnd(-0.02, 0.02))); }
      city.push(new THREE.CylinderGeometry(0.004, 0.009, 0.1, 6).translate(0, 0.1, 0));
      city.push(new THREE.CylinderGeometry(dr * 0.8, dr * 0.8, 0.01, 18).translate(0, 0.055, 0));
      const cityI = new THREE.InstancedMesh(c.merge(city), std(0xf0f4f8, { emissive: 0x9fb4ff, emissiveIntensity: 0.25 }), n);
      const m4 = new THREE.Matrix4(), cols = [0xbe854c, 0x0b0d16, 0x2962ff, 0xff2e63, 0xf0f4f8];
      spots.forEach(([x, y, z], i) => { m4.makeRotationY(rnd(0, 6.28)).setPosition(x, y, z); baseI.setMatrixAt(i, m4); shellI.setMatrixAt(i, m4); cityI.setMatrixAt(i, m4); baseI.setColorAt(i, new THREE.Color(cols[i % cols.length])); });
      shellI.renderOrder = 6; c.add(baseI); c.add(cityI); c.add(shellI);
      c.click(cityI, () => { tinkle(); eyeState.alarm = 2; c.say(eyeHead, pick(['That one is just a souvenir. Shake it all you want. No. Do not.', 'Skyline, plastic. Snow, also plastic.'])); }, 'Do not shake');
      tag('SNOW GLOBE, SKYLINE, $9\nSHAKE GENTLY. WE SAID GENTLY.', 2.3, TIERS[1] + 0.12, SZ + 0.23, 0, 0.5, 0.09);
    }

    // ---------- the cashier: a New Yorker with an Open Eye Flower for a head, the room's one eye ----------
    // It has a job. It watches the merchandise, and the merchandise is you, and the globes. It follows you round the
    // shop, blinks, and goes wide when anything gets shaken.
    const cashier = new THREE.Group(); cashier.position.set(1.25, 0, CZ - 0.75); c.add(cashier);
    const eyeHead = new THREE.Group(); eyeHead.position.set(0, 1.78, 0); cashier.add(eyeHead);
    const eyeState = { lid: 0, look: [0, 0], alarm: 0, next: 2, blink: 0, yaw: 0, drawn: '' };
    const eyeCv = document.createElement('canvas'); eyeCv.width = eyeCv.height = 256;
    const eyeT = new THREE.CanvasTexture(eyeCv); eyeT.colorSpace = THREE.SRGBColorSpace;
    const drawEye = () => { const key = eyeState.lid.toFixed(2) + eyeState.look.map((v) => v.toFixed(2)).join(); if (key === eyeState.drawn) return; eyeState.drawn = key; const g = eyeCv.getContext('2d'); g.clearRect(0, 0, 256, 256); c.eyeFlower(g, 128, 128, 120, { lid: eyeState.lid, look: eyeState.look }); eyeT.needsUpdate = true; };
    drawEye();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshBasicMaterial({ map: eyeT, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, toneMapped: false })); eyeHead.add(face);
    {
      const vest = std(0x2962ff, { roughness: 0.7 }), shirt = std(0xb9b4ac, { roughness: 0.9 }), pants = std(0x14161c, { roughness: 0.8 });
      const cap = (r, h, m, x, y, z, rz = 0, rx = 0) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 12), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); cashier.add(o); return o; };
      cap(0.08, 0.6, pants, -0.1, 0.42, 0); cap(0.08, 0.6, pants, 0.1, 0.42, 0);
      cap(0.17, 0.36, shirt, 0, 1.2, 0); const v = cap(0.18, 0.3, vest, 0, 1.18, 0.005); v.scale.set(1.04, 1, 0.9);
      cap(0.045, 0.3, vest, -0.24, 1.2, 0.14, 0.25, -1.0); cap(0.045, 0.3, vest, 0.24, 1.2, 0.14, -0.25, -1.0);
      cap(0.05, 0.08, shirt, 0, 1.52, 0);
      const nt = c.sign('HI. I AM\nSTILL HERE.', { w: 0.13, h: 0.06, bg: '#f0f4f8', fg: '#ff2e63', font: c.MONO, px: 64 }); nt.position.set(-0.08, 1.3, 0.175); cashier.add(nt);
    }
    c.glb('ph_metal_stool_01', { h: 0.65, x: 1.9, z: CZ - 0.85 });
    // 2026-10-28: the Prince from the cast (red uniform, mop and bucket), whole, his own eye flower for a head; the drawn eye is hidden
    const cashRig = rigged(c, cashier, 'prince', { h: 1.78, hide: [...parts(cashier).filter((o) => o.geometry && o.geometry.type === 'CapsuleGeometry'), face], near: 8, body: 0.4 });   // rigged: watches you, snaps round at a shake
    c.click(cashier, () => c.say(eyeHead, pick(['Exit is through the gift shop. So is the entrance.', 'Everything is 3 for $10. Except you. You are priceless. Also 3 for $10.', 'I have been watching the merchandise since the museum opened. The merchandise watches back.', 'The big globe? That is the N. Shake it, then get in. Everybody does.', 'Receipt? It is a dream. Keep the dream.'])), 'Talk to the cashier');

    // the register, with the loop count where the total should be
    c.glb('ph_CashRegister_01', { len: 0.42, x: 1.25, y: CTOP, z: CZ - 0.05, ry: Math.PI });
    const lcd = c.sign(`LOOP ${c.loop() + 1}`, { w: 0.2, h: 0.05, bg: '#02040c', fg: '#00e5ff', font: c.MONO, glow: 6, px: 64 }); lcd.position.set(1.25, CTOP + 0.34, CZ + 0.12); c.add(lcd);
    S.lcdLoop = c.loop();
    // counter clutter: a card rack, a tip jar, the duck, a magnifier for looking into the merchandise
    {
      const rack = new THREE.Group(); rack.position.set(-1.65, CTOP, CZ); c.add(rack);
      rack.add(c.slab(0.62, 0.02, 0.3, chrome, 0, 0.01, 0));
      const geos = [];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) { const g = new THREE.PlaneGeometry(0.105, 0.066); g.rotateX(-0.35); g.translate(-0.24 + k * 0.12, 0.08 + r * 0.075, 0.1 - r * 0.07); geos.push(g); }
      rack.add(new THREE.Mesh(c.merge(geos), cardM));
      for (let r = 0; r < 3; r++) rack.add(c.slab(0.62, 0.01, 0.01, chrome, 0, 0.05 + r * 0.075, 0.12 - r * 0.07));
      const rs = c.sign('PIGEONCARD $33\nUNLIMITED RIDE, ONE WAY', { w: 0.44, h: 0.09, bg: '#02040c', fg: '#ffd21f', font: c.MONO, px: 96 }); rs.position.set(0, 0.36, -0.1); rack.add(rs);
      c.click(rack, () => c.toast('PIGEONCARD. Valid on every line, at every scale. Expires when you wake up.', 3600), 'A PIGEONCARD');
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.15, 20, 1, true), glassM); put(jar, 0.4, CTOP + 0.075, CZ + 0.18); jar.renderOrder = 6;
      for (let k = 0; k < 6; k++) { const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 12), copper); put(coin, 0.4 + rnd(-0.03, 0.03), CTOP + 0.005 + k * 0.004, CZ + 0.18 + rnd(-0.03, 0.03)); }
      tag('TIPS. ALSO WISHES.', 0.4, CTOP + 0.2, CZ + 0.245, 0, 0.18, 0.04);
      c.glb('ph_rubber_duck_toy', { h: 0.09, x: 0.1, y: CTOP, z: CZ + 0.2, ry: 0.6 });
      tag('RESERVOIR DUCK $4\nSWIMS IF YOU BELIEVE', 0.1, CTOP + 0.015, CZ + 0.33, 0, 0.2, 0.05).rotation.x = -1.1;
      c.glb('ph_magnifying_glass_01', { len: 0.22, x: -0.75, y: CTOP, z: CZ + 0.15, ry: 0.4 });
      c.glb('ph_postcard_set_01', { len: 0.24, x: 0.75, y: CTOP, z: CZ + 0.05, ry: -0.3 });
      for (const [x, tint] of [[-1.1, 0x2962ff], [1.9, 0xff2e63]]) c.glb('pigeon', { h: 0.15, x, y: CTOP, z: CZ + 0.1, ry: rnd(-0.6, 0.6), tint });
    }
    // a hanging sign over the counter, both faces
    const HSZ = 0.15, HSX = -3.15;
    for (const s of [0, Math.PI]) put(c.sign('EVERYTHING 3 FOR $10\nEXCEPT THE THINGS THAT ARE NOT', { w: 1.5, h: 0.32, bg: '#ff2e63', fg: '#f0f4f8', font: c.FONT, weight: 900, px: 160, border: '#f0f4f8' }), HSX, 2.75, HSZ + (s ? -0.006 : 0.006), s);
    for (const x of [HSX - 0.7, HSX + 0.7]) { const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, CH - 2.91, 4), chrome); put(wire, x, (CH + 2.91) / 2, HSZ); }

    // floor contours round the counter globe: the isolines of its pull, laid in the terrazzo
    {
      const pos = [], idx = []; const cx = BG.position.x, cz = BG.position.z;
      for (let ring = 0; ring < 10; ring++) {
        const r0 = 1.25 + ring * 0.42, ph = ring * 1.7, w = 0.012, N = 140, base = pos.length / 3;
        for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, r = r0 * (1 + 0.05 * Math.sin(3 * a + ph) + 0.03 * Math.sin(5 * a - ph * 0.6)); for (const s of [-1, 1]) pos.push(cx + Math.cos(a) * (r + s * w), 0.004, cz + Math.sin(a) * (r + s * w)); }
        for (let i = 0; i < N; i++) { const p = base + i * 2, x = pos[p * 3], z = pos[p * 3 + 2]; if (Math.abs(x) > HW - 0.1 || z < ZB + 0.1 || z > ZF - 0.1) continue; idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      const ct = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x2962ff, transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); ct.renderOrder = 1; c.add(ct);
    }

    // ---------- the prints: the room's twelve New Yorkers, framed, lit, for sale ----------
    const art = c.art(12);
    const PZ = [-3.85, -2.3, -0.75, 0.8, 2.35, 3.9];
    const PRICES = ['PRINT, FRAMED. $1,111\nPRICELESS. ALSO 3 FOR $10.', 'PRINT, FRAMED. $333\nFRAME SOLD SEPARATELY. FROM YOU.', 'PRINT, FRAMED. $1,500\nOR BEST DREAM', 'LAST ONE. ALSO THE FIRST.\n$777', 'PRINT, FRAMED. $2,222\nONE PER CUSTOMER PER LOOP', 'PRINT, FRAMED. ASK ME\nI WILL SAY 3 FOR $10'];
    art.forEach((p, i) => {
      const sx = i < 6 ? -1 : 1, z = PZ[i % 6];
      c.hang(p, sx * (HW - 0.06), 1.62, z, -sx * Math.PI / 2, 1.25, ['black', 'gilt', 'bone', 'copper'][i % 4], { light: true });
      tag(PRICES[(i * 5) % PRICES.length], sx * (HW - 0.06), 0.86, z, -sx * Math.PI / 2, 0.42, 0.075, i % 3 === 0);
    });
    tag('FINE ART PRINTS. FRAMED, LIT, JUDGED.', -(HW - 0.03), 2.18, -0.1, Math.PI / 2, 1.6, 0.11, true);
    tag('THE NEW YORKERS. ALL ORIGINALS. ALL REPRINTS.', HW - 0.03, 2.18, -0.1, -Math.PI / 2, 1.8, 0.11, true);
    // pink band drips down the side walls, short over the frames and long in the gaps between them
    for (const sx of [-1, 1]) for (let k = 0; k < 22; k++) {
      const z = rnd(ZB + 0.3, ZF - 0.3), gap = PZ.every((pz) => Math.abs(z - pz) > 0.75);
      drip(Math.random() < 0.85 ? 'pink' : 'violet', sx * (HW - 0.012), 2.3, z, gap ? rnd(0.15, 0.95) : rnd(0.04, 0.2), rnd(0.008, 0.015), 'x');
    }
    for (let k = 0; k < 14; k++) { const x = rnd(-HW + 0.3, HW - 0.3); if (Math.abs(x) < DW + 0.2) continue; drip('pink', x, 2.3, ZF - 0.012, rnd(0.05, 0.7), rnd(0.008, 0.014), 'z'); }

    // the low bins under the prints: rolled posters, globes, souvenir baseballs
    for (const sx of [-1, 1]) {
      c.box(0.44, 0.58, ZF - ZB - 0.9, std(sx < 0 ? 0x06163a : 0x2962ff, { roughness: 0.5 }), sx * (HW - 0.27), 0.29, (ZF + ZB) / 2 - 0.05);
      c.add(c.slab(0.46, 0.03, ZF - ZB - 0.88, copper, sx * (HW - 0.27), 0.59, (ZF + ZB) / 2 - 0.05));
    }
    {
      const n = 40, roll = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 12).rotateX(Math.PI / 2), std(0xffffff, { roughness: 0.7 }), n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      const cols = [0xf0f4f8, 0xff2e63, 0x2962ff, 0xbe854c, 0x00e5ff];
      for (let i = 0; i < n; i++) { const sx = 1, z = -4.2 + (i % 20) * 0.42, up = Math.floor(i / 20); q.setFromEuler(new THREE.Euler(rnd(-0.1, 0.1), rnd(-0.25, 0.25), 0)); m4.compose(new THREE.Vector3(sx * (HW - 0.27) + rnd(-0.1, 0.1), 0.64 + up * 0.06, z + up * 0.2), q, new THREE.Vector3(1, 1, 1)); roll.setMatrixAt(i, m4); roll.setColorAt(i, new THREE.Color(cols[i % cols.length])); }
      c.add(roll);
      tag('POSTERS, ROLLED $15\nUNROLL AT HOME. NOT HERE.', HW - 0.48, 0.45, 1.6, -Math.PI / 2, 0.4, 0.09).rotation.y = -Math.PI / 2;
      for (let k = 0; k < 7; k++) c.glb('ph_baseball_01', { h: 0.07, x: -(HW - 0.27) + rnd(-0.1, 0.1), y: 0.6, z: -1.6 + k * 0.12 + rnd(-0.03, 0.03), ry: rnd(0, 6) });
      tag('SOUVENIR BASEBALLS $8\nSIGNED BY NOBODY', -(HW - 0.49), 0.45, -1.25, Math.PI / 2, 0.36, 0.08);
    }

    // ---------- shirts on the right wall, pennants on the left, both above the pink band ----------
    {
      const geos = [];
      for (let k = 0; k < 13; k++) { const g = cell(0.55, 0.55, SHIRT_C.length, 1, k % SHIRT_C.length); g.rotateZ(rnd(-0.06, 0.06)); g.rotateY(-Math.PI / 2); g.translate(HW - 0.04, 2.85 + (k % 2) * 0.06, ZB + 0.55 + k * 0.7); geos.push(g); }
      c.add(new THREE.Mesh(c.merge(geos), new THREE.MeshStandardMaterial({ map: shirtT, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide })));
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, ZF - ZB - 0.6, 8).rotateX(Math.PI / 2), chrome); put(rail, HW - 0.06, 3.14, (ZF + ZB) / 2);
      tag('I EYE NY TEES $20\nOR 3 FOR $10. DO NOT ASK HOW.', HW - 0.03, 2.5, 4.0, -Math.PI / 2, 0.5, 0.09);
      const pg = [];
      for (let k = 0; k < 12; k++) { const g = cell(0.62, 0.2, 2, 4, k % 8); g.rotateZ(-0.12 + rnd(-0.04, 0.04)); g.rotateY(Math.PI / 2); g.translate(-HW + 0.03, 2.8 + (k % 3) * 0.14, ZB + 0.6 + k * 0.72); pg.push(g); }
      c.add(new THREE.Mesh(c.merge(pg), new THREE.MeshStandardMaterial({ map: pennT, alphaTest: 0.5, roughness: 0.95, side: THREE.DoubleSide })));
    }

    // ---------- the mug table and the keychain board (left of the aisle) ----------
    {
      const tx = -3.15, tz = 0.6;
      c.box(1.9, 0.78, 0.86, std(0xf0f4f8, { roughness: 0.4 }), tx, 0.39, tz);
      c.add(c.slab(1.94, 0.03, 0.9, copper, tx, 0.79, tz));
      c.box(1.2, 0.24, 0.36, cobalt, tx, 0.92, tz, { collide: false });
      const mugG = c.merge([new THREE.CylinderGeometry(0.045, 0.042, 0.1, 18, 1).translate(0, 0.05, 0), new THREE.TorusGeometry(0.03, 0.009, 6, 12, Math.PI * 1.2).rotateZ(-Math.PI * 0.6).translate(0.05, 0.05, 0)]);
      const spots = [];
      for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) spots.push([tx - 0.78 + k * 0.26, 0.805, tz + 0.28 - r * 0.56]);
      for (let k = 0; k < 7; k++) spots.push([tx - 0.5 + k * 0.165, 1.04, tz]);
      const mugI = new THREE.InstancedMesh(mugG, new THREE.MeshStandardMaterial({ map: mugT, roughness: 0.25, metalness: 0 }), spots.length); const m4 = new THREE.Matrix4();
      spots.forEach(([x, y, z], i) => { m4.makeRotationY(rnd(-1.2, 1.2) - Math.PI / 2).setPosition(x, y, z); mugI.setMatrixAt(i, m4); }); c.add(mugI);
      c.click(mugI, () => c.toast('Mug. Holds coffee, or a grudge. Dishwasher safe, dream safe, not microwave safe.', 3200), 'A mug');
      tag('MUG $14\nHOLDS COFFEE OR A GRUDGE', tx, 0.6, tz + 0.435, 0, 0.42, 0.1, true);
      // the keychain board, double sided, on a stand
      const bx = -3.15, bz = -0.35;
      c.box(1.5, 1.2, 0.04, std(0xc9a77a, { roughness: 0.8 }), bx, 1.3, bz);
      c.box(0.06, 0.7, 0.06, chrome, bx, 0.35, bz, { collide: false }); c.box(0.7, 0.03, 0.4, chrome, bx, 0.015, bz, { collide: false });
      const holeG = [], pegG = [], ringG = [];
      for (let r = 0; r < 5; r++) for (let k = 0; k < 8; k++) { const x = bx - 0.62 + k * 0.177, y = 1.78 - r * 0.22; for (const s of [-1, 1]) { pegG.push(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 5).rotateX(Math.PI / 2).translate(x, y, bz + s * 0.05)); ringG.push(new THREE.TorusGeometry(0.014, 0.003, 5, 12).translate(x, y - 0.02, bz + s * 0.075)); } }
      for (let r = 0; r < 12; r++) for (let k = 0; k < 16; k++) holeG.push(new THREE.CircleGeometry(0.006, 6).translate(bx - 0.7 + k * 0.093, 1.85 - r * 0.098, bz + 0.0205));
      c.add(new THREE.Mesh(c.merge(holeG), ink)); c.add(new THREE.Mesh(c.merge(pegG), chrome)); c.add(new THREE.Mesh(c.merge(ringG), chrome));
      const tagsG = [];
      for (let r = 0; r < 5; r++) for (let k = 0; k < 8; k++) for (const s of [-1, 1]) { const g = cell(0.09, 0.115, 4, 1, (r * 3 + k + (s > 0 ? 0 : 2)) % 4); g.rotateZ(rnd(-0.12, 0.12)); if (s < 0) g.rotateY(Math.PI); g.translate(bx - 0.62 + k * 0.177, 1.78 - r * 0.22 - 0.09, bz + s * 0.078); tagsG.push(g); }
      const keys = new THREE.Mesh(c.merge(tagsG), new THREE.MeshStandardMaterial({ map: keyT, roughness: 0.3, metalness: 0.2, emissive: 0xffffff, emissiveMap: keyT, emissiveIntensity: 0.12 })); c.add(keys);
      c.click(keys, () => c.toast('Keychain, $6. For doors you have not found yet. There are eleven in this building.', 3400), 'A keychain');
      for (const s of [-1, 1]) tag('KEYCHAINS $6\nFOR DOORS YOU HAVE NOT FOUND', bx, 2.0, bz + s * 0.03, s > 0 ? 0 : Math.PI, 0.6, 0.11, true);
      for (let k = 0; k < 8; k++) c.sticker(pick([...EYE_S.slice(40, 70), ...MUS_S.slice(0, 16)]), bx + rnd(-0.7, 0.7), rnd(0.75, 0.82), bz - 0.025, { ry: Math.PI, size: rnd(0.08, 0.13) });
    }

    // ---------- the shirt table and the plush pigeon bin (right of the aisle) ----------
    let realPigeon;
    {
      const tx = 3.15, tz = -0.25;
      c.box(1.7, 0.74, 0.8, navy, tx, 0.37, tz);
      c.add(c.slab(1.74, 0.03, 0.84, copper, tx, 0.75, tz));
      const fold = new THREE.MeshStandardMaterial({ map: shirtT, roughness: 0.9 });
      const stackG = [], topG = [];
      for (let k = 0; k < 6; k++) {
        const x = tx - 0.6 + (k % 3) * 0.6, z = tz - 0.18 + Math.floor(k / 3) * 0.36, h = 3 + (k % 3);
        for (let j = 0; j < h; j++) { const b = new THREE.BoxGeometry(0.34, 0.05, 0.28); b.translate(x + rnd(-0.01, 0.01), 0.79 + j * 0.052, z); stackG.push({ g: b, col: (k + j) % SHIRT_C.length }); }
        const t = cell(0.3, 0.3, SHIRT_C.length, 1, (k + h - 1) % SHIRT_C.length); t.rotateX(-Math.PI / 2); t.translate(x, 0.79 + h * 0.052 - 0.024, z + 0.01); topG.push(t);
      }
      for (let ci = 0; ci < SHIRT_C.length; ci++) { const gs = stackG.filter((s) => s.col === ci).map((s) => s.g); if (gs.length) c.add(new THREE.Mesh(c.merge(gs), std(new THREE.Color(SHIRT_C[ci]).getHex(), { roughness: 0.95 }))); }
      c.add(new THREE.Mesh(c.merge(topG), new THREE.MeshStandardMaterial({ map: shirtT, alphaTest: 0.5, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })));
      void fold;
      tag('I EYE NY $20\nWASH COLD, DREAM WARM', tx, 0.55, tz + 0.405, 0, 0.42, 0.1);
      // the bin: a wire basket of plush pigeons. One of them is not plush
      const bx = 3.0, bz = 1.55, br = 0.5;
      const binG = []; for (let k = 0; k < 4; k++) binG.push(new THREE.TorusGeometry(br, 0.008, 6, 48).rotateX(Math.PI / 2).translate(bx, 0.1 + k * 0.18, bz));
      for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; binG.push(new THREE.CylinderGeometry(0.005, 0.005, 0.64, 4).translate(bx + Math.cos(a) * br, 0.32, bz + Math.sin(a) * br)); }
      c.add(new THREE.Mesh(c.merge(binG), chrome)); c.post(bx, bz, br + 0.05);
      const fill = new THREE.Mesh(new THREE.CylinderGeometry(br - 0.02, br - 0.02, 0.4, 32), std(0xd9d2c6, { roughness: 1 })); put(fill, bx, 0.2, bz);
      const tints = [0x6f8dff, 0xff7aa0, 0xf0f4f8, 0x9b6fd0, 0x7fe6ff, 0xffffff, 0xd0a070, 0xff2e63, 0x2962ff, 0xc9ced8, 0x8899bb];
      tints.forEach((tint, k) => { const a = k / tints.length * Math.PI * 2 + 0.3, q = k % 3 === 0 ? 0.08 : 0.3; c.glb('pigeon', { h: 0.17, x: bx + Math.cos(a) * q, y: 0.4 + (k % 3) * 0.03, z: bz + Math.sin(a) * q, ry: rnd(0, 6.28), tint, shadow: false }); });
      realPigeon = c.glb('pigeon', { h: 0.3, x: bx + 0.12, y: 0.47, z: bz - 0.18, ry: -2.4 });
      c.click(realPigeon, () => { c.sound.coo(); c.say(realPigeon, 'coo.'); c.egg('shop_plush', 'One of these is not plush and not for sale. He likes it here. He came in with the museum and stayed for the gift shop.'); }, 'A plush pigeon?');
      const bt = c.sign('PLUSH PIGEON $12\nDOES NOT COO. ONE DOES.', { w: 0.46, h: 0.1, bg: '#f0f4f8', fg: '#02040c', font: c.MONO, weight: 700, px: 128, border: '#ff2e63' }); put(bt, bx, 0.86, bz - 0.25, Math.PI * 0.85);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 5), chrome); put(pole, bx, 0.72, bz - 0.25);
    }

    // ---------- the postcard spinners: postcards of the whole show, every one a New Yorker ----------
    const cards = []; for (const id of ['car', 'platform', 'bodega', 'cooler', 'stairs', 'nave', 'crop', 'heart', 'wing', 'dome', 'museum', 'shop']) for (const p of (CAST[id] || []).slice(id === 'shop' ? 12 : 0, id === 'shop' ? 14 : 3)) cards.push(p);
    while (cards.length < 32 && cards.length) cards.push(cards[cards.length % 7]);
    const AC = 8, AR = 4, CW = 256, CHh = 144;
    const pcT = c.canvasTex(AC * CW, AR * CHh, (g, w, h) => { g.fillStyle = '#f0f4f8'; g.fillRect(0, 0, w, h); });
    cards.slice(0, 32).forEach((p, i) => { const img = new Image(); img.onload = () => { pcT.userData.canvas.getContext('2d').drawImage(img, (i % AC) * CW + 6, Math.floor(i / AC) * CHh + 6, CW - 12, CHh - 12); pcT.needsUpdate = true; }; img.src = `assets/art/${p.f}`; });
    const pcM = new THREE.MeshStandardMaterial({ map: pcT, roughness: 0.5, emissive: 0xffffff, emissiveMap: pcT, emissiveIntensity: 0.45 });
    const ptr = { x: innerWidth / 2, y: innerHeight / 2 }; addEventListener('pointerdown', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; }, true);
    const rc = new THREE.Raycaster();
    const hitOn = (obj) => { const v = document.pointerLockElement ? new THREE.Vector2(0, 0) : new THREE.Vector2(ptr.x / innerWidth * 2 - 1, -ptr.y / innerHeight * 2 + 1); rc.setFromCamera(v, c.camera); return rc.intersectObject(obj, true)[0]; };
    const spinners = [];
    for (const [sx, off] of [[-1.75, 0], [1.75, 16]]) {
      const sp = new THREE.Group(); sp.position.set(sx, 0, 2.05); c.add(sp); c.post(sx, 2.05, 0.3);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.9, 10), chrome); pole.position.y = 0.95; sp.add(pole);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.04, 24), ink); foot.position.y = 0.02; sp.add(foot);
      const rot = new THREE.Group(); sp.add(rot);
      const pg = [], wire = [];
      for (let f = 0; f < 4; f++) for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) {
        const idx = (off + f * 8 + r * 2 + k) % 32, g = cell(0.2, 0.1125, AC, AR, idx); const a = f * Math.PI / 2;
        g.rotateX(-0.08); g.translate(-0.11 + k * 0.22, 0.78 + r * 0.24, 0.17); g.rotateY(a); pg.push(g);
        if (k === 0) { const wb = new THREE.BoxGeometry(0.46, 0.006, 0.03); wb.translate(0, 0.72 + r * 0.24, 0.18); wb.rotateY(a); wire.push(wb); }
      }
      const pcMesh = new THREE.Mesh(c.merge(pg), pcM); rot.add(pcMesh); rot.add(new THREE.Mesh(c.merge(wire), chrome));
      const top = c.sign('POSTCARDS\n3 FOR $10', { w: 0.34, h: 0.17, bg: '#2962ff', fg: '#f0f4f8', font: c.FONT, weight: 900, px: 128 }); top.position.y = 1.86; const top2 = top.clone(); top2.rotation.y = Math.PI; top.position.z = 0.01; top2.position.z = -0.01; top2.position.y = 1.86; rot.add(top); rot.add(top2);
      const st = { rot, spin: 0.15, mesh: pcMesh, off }; spinners.push(st);
      c.click(pcMesh, () => {
        st.spin = 2.4; const h = hitOn(pcMesh); const i = h ? Math.floor(h.faceIndex / 2) : 0, f = Math.floor(i / 8), r = Math.floor((i % 8) / 2), k = i % 2;
        const p = cards[(off + f * 8 + r * 2 + k) % 32] || cards[0];
        if (p) c.toast(`Postcard of No. ${p.n}, ${p.t}. ${p.h || p.b || 'New York'}. Wish you were here. You were, a few rooms ago.`, 4200);
      }, 'Spin the postcards');
    }

    // ---------- the front wall: totes, the guestbook, the sticker machine, the penny press ----------
    {
      const tg = [], hg = [];
      for (let k = 0; k < 4; k++) { const x = -4.6 + k * 0.62, g = cell(0.44, 0.52, 4, 1, k); g.rotateZ(rnd(-0.05, 0.05)); g.rotateY(Math.PI); g.translate(x, 1.55, ZF - 0.04); tg.push(g); hg.push(new THREE.TorusGeometry(0.1, 0.008, 6, 20, Math.PI).translate(x, 1.81, ZF - 0.045)); hg.push(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 5).rotateX(Math.PI / 2).translate(x, 1.92, ZF - 0.03)); }
      const totes = new THREE.Mesh(c.merge(tg), new THREE.MeshStandardMaterial({ map: toteT, roughness: 0.95, side: THREE.DoubleSide })); c.add(totes);
      c.add(new THREE.Mesh(c.merge(hg), std(0xc9a77a, { roughness: 0.9 })));
      tag('TOTES $18\nCARRIES EVERYTHING EXCEPT THE ARGUMENT', -3.67, 1.15, ZF - 0.02, Math.PI, 0.7, 0.1);
      c.click(totes, () => c.toast('I WENT DOWN THE PIGEONHOLE AND ALL I GOT WAS THIS TOTE. It is true. Look in it later.', 3600), 'A tote');
    }
    // two show posters either side of the door, for sale like everything else, and the baskets nobody takes
    {
      const POST = [['THE PIGEONHOLE', 'A MUSEUM INSIDE A PIGEON\nINSIDE A BODEGA\nINSIDE A DREAM', '#06163a', '#ff2e63'], ['LOOP AGAIN', 'THE N. ALL STOPS.\nALL SCALES.\nTHE LAST STOP IS THE FIRST.', '#ff2e63', '#06163a']];
      POST.forEach(([h, sub, bg, ac], i) => {
        const t = c.canvasTex(512, 720, (g, w, hh) => {
          g.fillStyle = bg; g.fillRect(0, 0, w, hh); g.strokeStyle = '#f0f4f8'; g.lineWidth = 10; g.strokeRect(20, 20, w - 40, hh - 40);
          for (let k = 0; k < 9; k++) { g.strokeStyle = k % 2 ? 'rgba(0,229,255,.35)' : 'rgba(41,98,255,.45)'; g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, 300, 60 + k * 26, 50 + k * 22 + Math.sin(k) * 8, 0, 0, 7); g.stroke(); }
          c.eyeFlower(g, w / 2, 300, 120, {}); g.fillStyle = '#f0f4f8'; g.textAlign = 'center'; g.font = `900 58px ${c.FONT}`; g.fillText(h, w / 2, 110);
          g.fillStyle = ac === '#ff2e63' ? '#ff2e63' : '#f0f4f8'; g.font = `600 26px ${c.MONO}`; sub.split('\n').forEach((l, k) => g.fillText(l, w / 2, 520 + k * 38));
          g.fillStyle = '#be854c'; g.font = `700 22px ${c.MONO}`; g.fillText('MLow  ·  NEW YORKERS', w / 2, hh - 50);
        });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.87), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3 }));
        put(m, i ? -1.95 : -1.2, 1.62, ZF - 0.015, Math.PI);
        tag(i ? 'POSTER $25\nLOOPS SOLD SEPARATELY' : 'POSTER $25\nTHE DREAM NOT INCLUDED', m.position.x, 1.08, ZF - 0.02, Math.PI, 0.38, 0.09);
      });
      for (let k = 0; k < 4; k++) c.glb('ph_wicker_basket_01', { h: 0.28, x: -1.15, y: k * 0.09, z: ZF - 0.35, ry: k * 0.2 });
      c.post(-1.15, ZF - 0.35, 0.25);
      tag('BASKETS. TAKE ONE.\nNOBODY EVER DOES.', -1.15, 0.62, ZF - 0.62, Math.PI, 0.36, 0.09);
    }
    // the guestbook: it remembers how many times you have looped
    {
      const gx = -2.1, gz = 3.75;
      c.box(0.56, 1.0, 0.44, navy, gx, 0.5, gz);
      c.add(c.slab(0.62, 0.03, 0.5, copper, gx, 1.0, gz));
      const bookT = c.canvasTex(1024, 640, () => {});
      const drawBook = () => {
        const g = bookT.userData.canvas.getContext('2d'), w = 1024, h = 640;
        g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(w / 2 - 6, 0, 12, h);
        g.fillStyle = '#06163a'; g.font = `800 40px ${c.SERIF}`; g.fillText('GUESTBOOK', 40, 64); g.font = `500 22px ${c.MONO}`; g.fillText('Please sign. Every time.', 40, 100);
        g.strokeStyle = 'rgba(41,98,255,.35)'; g.lineWidth = 2; for (let y = 140; y < h - 20; y += 36) { g.beginPath(); g.moveTo(30, y); g.lineTo(w / 2 - 20, y); g.moveTo(w / 2 + 20, y); g.lineTo(w - 30, y); g.stroke(); }
        const old = ['M. Low, every loop', 'a pigeon (illegible)', 'the cooler was cold. 5 stars', 'who put a museum in a bird', 'lost my keys in the crop', 'came for the heart, stayed for the mugs', 'I was here. I think. I was asleep'];
        const all = [...old.map((t) => ['', t]), ...store.book.map((b) => [`loop ${b.l}`, b.t])].slice(-26);
        g.font = `italic 500 24px ${c.SERIF}`;
        all.forEach(([l, t], i) => { const col = i < 13 ? 0 : 1, row = i % 13; const x = col ? w / 2 + 34 : 40, y = 134 + row * 36; g.fillStyle = l ? '#ff2e63' : '#1b1b2b'; g.fillText((l ? l + '  ' : '') + t, x, y); });
        g.fillStyle = '#2962ff'; g.font = `700 24px ${c.MONO}`; const n = c.loop();
        g.fillText(n ? `You have woken up ${n} time${n === 1 ? '' : 's'}. This is loop ${n + 1}.` : 'You have not woken up yet. This is loop 1.', w / 2 + 34, h - 30);
        bookT.needsUpdate = true;
      };
      drawBook(); S.drawBook = drawBook;
      const book = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.375), new THREE.MeshStandardMaterial({ map: bookT, roughness: 0.85, emissive: 0xffffff, emissiveMap: bookT, emissiveIntensity: 0.3 }));
      book.position.set(gx, 1.04, gz); c.add(book); book.lookAt(c.world(gx, 1.04 + 0.82, gz - 0.57));
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.012, 0.4), std(0x6f23a8)); cover.position.set(gx, 1.03, gz); cover.rotation.x = -(Math.PI / 2 - Math.acos(0.82)); c.add(cover);
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.15, 6), ink); pen.position.set(gx + 0.36, 1.03, gz); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5; c.add(pen);
      c.glb('ph_round_spectacles', { len: 0.12, x: gx - 0.2, y: 1.015, z: gz + 0.16, ry: 0.4 });
      const SIGN = ['the snow was real', 'woke up on the N again', 'see you at the bodega', 'the globe was the train the whole time', 'I shook it. sorry', 'bought nothing. took everything', 'the eye watched me the whole time'];
      c.click(book, () => {
        store.book.push({ l: c.loop() + 1, t: pick(SIGN) }); if (store.book.length > 40) store.book.shift(); keep(); drawBook(); c.sound.tone(900, 0.08, 0.04, 'triangle');
        const n = store.book.length;
        c.egg('shop_guestbook', n > 1 ? `You have signed this book ${n} times. The handwriting is always yours.` : 'Signed. The ink is still wet from the last time you signed it, which was the next time.');
      }, 'Sign the guestbook');
      tag('GUESTBOOK\nIT REMEMBERS', gx, 0.72, gz - 0.225, Math.PI, 0.36, 0.11, true);
    }
    // the sticker machine, and the wall it is allowed to ruin
    let held = null;
    {
      const mx = 1.45, mz = ZF - 0.28;
      c.box(0.66, 1.66, 0.44, new THREE.MeshPhysicalMaterial({ color: 0x2962ff, roughness: 0.3, clearcoat: 1 }), mx, 0.83, mz);
      c.add(c.slab(0.7, 0.05, 0.48, chrome, mx, 1.68, mz));
      const fz = mz - 0.225;
      const winBack = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), std(0xf0f4f8, { emissive: 0xffffff, emissiveIntensity: 0.35 })); put(winBack, mx, 1.22, fz - 0.004, Math.PI);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) c.sticker(pick(r % 2 ? MLOW_S : EYE_S), mx - 0.18 + k * 0.12, 0.98 + r * 0.15, fz - 0.008, { ry: Math.PI, size: 0.1, rot: rnd(-0.2, 0.2) });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.64), glassM); put(pane, mx, 1.22, fz - 0.02, Math.PI); pane.renderOrder = 6;
      const knob = new THREE.Group(); put(knob, mx + 0.12, 0.72, fz - 0.03, Math.PI);
      { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24).rotateX(Math.PI / 2), chrome); knob.add(d); const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.04), ink); h.position.z = 0.025; knob.add(h); }
      c.add(c.slab(0.08, 0.12, 0.02, ink, mx - 0.15, 0.72, fz - 0.01));
      c.add(c.slab(0.22, 0.14, 0.04, ink, mx, 0.36, fz - 0.01));
      put(c.sign('STICKERS 25 CENTS\nSTICK RESPONSIBLY', { w: 0.62, h: 0.2, bg: '#ff2e63', fg: '#f0f4f8', font: c.FONT, weight: 900, px: 128 }), mx, 1.82, mz, Math.PI);
      for (let k = 0; k < 10; k++) c.sticker(pick([...EYE_S, ...STR_S]), mx + 0.334, rnd(0.2, 1.5), mz + rnd(-0.18, 0.18), { ry: Math.PI / 2, size: rnd(0.08, 0.15) });
      for (let k = 0; k < 6; k++) c.sticker(pick(EYE_S), mx + rnd(-0.28, 0.28), rnd(0.1, 0.55), fz - 0.004, { ry: Math.PI, size: rnd(0.08, 0.14) });
      S.knob = knob; S.knobT = 0;
      const vend = () => { held = pick(Math.random() < 0.6 ? EYE_S : MLOW_S); S.knobT = 1; c.sound.tone(220, 0.15, 0.08, 'square'); setTimeout(() => c.sound.tone(1400, 0.06, 0.05, 'triangle'), 380); wallMesh.userData.hint = 'Stick it here'; c.toast('A sticker. Click the sticker wall beside the machine to put it somewhere it will outlive you.', 3800); };
      c.click(knob, vend, 'Get a sticker'); c.click(pane, vend, 'Get a sticker');
      // the wall itself: everything stuck here stays stuck, loop after loop
      var wallMesh = c.box(2.0, 2.0, 0.02, std(0x06163a, { roughness: 0.75 }), 3.1, 1.25, ZF - 0.012, { collide: false });
      for (const [w, h, x, y] of [[2.06, 0.03, 3.1, 2.255], [2.06, 0.03, 3.1, 0.245], [0.03, 2.04, 2.085, 1.25], [0.03, 2.04, 4.115, 1.25]]) c.add(c.slab(w, h, 0.03, pinkP, x, y, ZF - 0.02));
      for (let k = 0; k < 95; k++) c.sticker(pick([...EYE_S, ...MLOW_S, ...MUS_S]), 3.1 + rnd(-0.92, 0.92), rnd(0.32, 2.18), ZF - 0.024, { ry: Math.PI, size: rnd(0.1, 0.24) });
      put(c.sign('THE STICKER WALL. ADD ONE. IT LIVES HERE NOW.', { w: 2.0, h: 0.13, bg: '#02040c', fg: '#ff2e63', font: c.MONO, weight: 800, glow: 6, px: 96 }), 3.1, 2.34 + 0.0, ZF - 0.03, Math.PI).position.y = 2.33;
      const stick = (id, x, y, rot) => c.sticker(id, x, y, ZF - 0.03, { ry: Math.PI, size: 0.17, rot });
      for (const s of store.stk) stick(s.id, s.x, s.y, s.r);
      c.click(wallMesh, () => {
        if (!held) { c.toast('Get a sticker from the machine first. Twenty five cents. We take dreams.', 2600); return; }
        const h = hitOn(wallMesh); if (!h) return; const lx = h.point.x - R.x0, ly = h.point.y, r = rnd(-0.5, 0.5);
        stick(held, lx, ly, r); store.stk.push({ id: held, x: +lx.toFixed(3), y: +ly.toFixed(3), r: +r.toFixed(2) }); if (store.stk.length > 60) store.stk.shift(); keep();
        held = null; wallMesh.userData.hint = 'The sticker wall'; c.sound.tone(500, 0.06, 0.06, 'square');
        c.toast(store.stk.length > 1 ? `Stuck. That is ${store.stk.length} of yours on this wall. They are all still here.` : 'Stuck. It will be here next loop. So will you.', 3000);
      }, 'The sticker wall');
      wallMesh.userData.hint = 'The sticker wall';
    }
    // the souvenir penny press: 51 cents, one flattened penny, four dies
    {
      const px = 4.9, pz = ZF - 0.3;
      c.box(0.62, 1.15, 0.46, new THREE.MeshPhysicalMaterial({ color: 0x8a1030, roughness: 0.35, clearcoat: 1 }), px, 0.575, pz);
      c.add(c.slab(0.66, 0.04, 0.5, copper, px, 1.17, pz));
      const dies = ['THE PIGEONHOLE', 'I EYE NY', 'LOOP', 'MOMP'];
      const pennyDraw = (g, cx, cy, rw, rh, label, loopN) => {
        const gr = g.createRadialGradient(cx - rw * 0.3, cy - rh * 0.3, 2, cx, cy, rh); gr.addColorStop(0, '#f3c08a'); gr.addColorStop(0.6, '#be854c'); gr.addColorStop(1, '#7a4e26');
        g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, 7); g.fill(); g.strokeStyle = '#6b4220'; g.lineWidth = 3; g.stroke();
        g.save(); g.globalAlpha = 0.55; c.eyeFlower(g, cx, cy - rh * 0.15, rw * 0.62, {}); g.restore();
        g.fillStyle = '#5a3418'; g.textAlign = 'center'; g.font = `800 ${Math.round(rw * 0.22)}px ${c.FONT}`; g.fillText(label === 'LOOP' ? `LOOP ${loopN}` : label, cx, cy + rh * 0.62);
      };
      const disp = c.canvasTex(1024, 300, (g, w, h) => { g.fillStyle = '#02040c'; g.fillRect(0, 0, w, h); dies.forEach((d, i) => pennyDraw(g, 128 + i * 256, 150, 80, 128, d, c.loop() + 1)); });
      const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.164), new THREE.MeshStandardMaterial({ map: disp, emissive: 0xffffff, emissiveMap: disp, emissiveIntensity: 0.4, roughness: 0.3 }));
      dm.position.set(px, 1.0, pz - 0.235); dm.rotation.y = Math.PI; c.add(dm);
      put(c.sign('SOUVENIR PENNY PRESS 51 CENTS\nTHE PENNY IS RUINED. THE MEMORY IS NOT.', { w: 0.62, h: 0.14, bg: '#f0f4f8', fg: '#8a1030', font: c.MONO, weight: 800, px: 128 }), px, 1.3, pz - 0.06, Math.PI);
      const crank = new THREE.Group(); crank.position.set(px - 0.33, 0.78, pz); crank.rotation.y = Math.PI / 2; c.add(crank);
      { crank.add(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 8, 28), chrome)); for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.012), chrome); sp.rotation.z = k * Math.PI / 3; crank.add(sp); } const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 10).rotateX(Math.PI / 2), ink); hd.position.set(0.13, 0, 0.05); crank.add(hd); }
      c.add(c.slab(0.2, 0.06, 0.12, ink, px, 0.42, pz - 0.24));
      const pennyCv = c.canvasTex(160, 256, () => {});
      const penny = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 28), [std(0xbe854c, { metalness: 1, roughness: 0.35 }), new THREE.MeshStandardMaterial({ map: pennyCv, metalness: 0.7, roughness: 0.35, emissive: 0xffffff, emissiveMap: pennyCv, emissiveIntensity: 0.15 }), std(0xbe854c, { metalness: 1, roughness: 0.35 })]);
      penny.scale.set(0.032, 0.03, 0.05); penny.position.set(px, 0.455, pz - 0.27); penny.rotation.y = Math.PI / 2; penny.visible = store.pennies > 0; c.add(penny);
      S.crank = crank; S.crankT = 0;
      const press = () => {
        if (S.crankT > 0) return;
        const d = dies[store.pennies % 4]; store.pennies++; keep(); S.crankT = 1.6;
        [0, 400, 800, 1200].forEach((ms) => setTimeout(() => c.sound.thump(0.35), ms));
        setTimeout(() => {
          const g = pennyCv.userData.canvas.getContext('2d'); g.clearRect(0, 0, 160, 256); pennyDraw(g, 80, 128, 74, 122, d, c.loop() + 1); pennyCv.needsUpdate = true; penny.visible = true;
          c.sound.tone(2600, 0.3, 0.05, 'triangle');
          c.egg('shop_penny', `Fifty one cents for a penny you cannot spend. This one says ${d === 'LOOP' ? 'LOOP ' + (c.loop() + 1) : d}. The most New York transaction there is.`);
        }, 1650);
      };
      c.click(crank, press, 'Turn the crank'); c.click(dm, press, 'Press a penny');
      for (let k = 0; k < 7; k++) c.sticker(pick([...STR_S, ...EYE_S]), px - 0.312, rnd(0.15, 1.05), pz + rnd(-0.18, 0.18), { ry: -Math.PI / 2, size: rnd(0.08, 0.14) });
    }

    // ---------- the rest of the stock, the corners, the clock ----------
    c.glb('ph_wall_clock', { h: 0.36, x: 4.3, y: 2.75, z: ZB + 0.04 });
    tag('STOPPED AT 3:33.\nSO DID WE.', 4.3, 2.45, ZB + 0.03, 0, 0.36, 0.09);
    c.glb('ph_steel_frame_shelves_03', { h: 2.0, x: 4.8, z: ZB + 0.4 }); c.box(1.1, 2, 0.5, std(0x000000), 4.8, 1, ZB + 0.4, { collide: true }).visible = false;
    for (let k = 0; k < 5; k++) c.glb('ph_cardboard_box_01', { h: 0.32, x: 4.55 + (k % 2) * 0.5, y: k < 2 ? 0 : k < 4 ? 0.7 : 1.38, z: ZB + 0.42, ry: rnd(-0.2, 0.2) });
    tag('OVERSTOCK: MORE GLOBES.\nMORE ROOMS. DO NOT OPEN.', 4.8, 1.08, ZB + 0.68, 0, 0.5, 0.1, true);
    c.glb('ph_potted_plant_02', { h: 1.2, x: -5.35, z: ZB + 0.55 }); c.post(-5.35, ZB + 0.55, 0.3);
    tag('FAKE PLANT. REAL DUST.\nNOT FOR SALE.', -5.35, 0.5, ZB + 0.86, 0, 0.42, 0.09);
    c.glb('ph_korean_fire_extinguisher_01', { h: 0.5, x: -3.55, z: ZB + 0.18 }); c.post(-3.55, ZB + 0.18, 0.15);
    c.glb('ph_fire_alarm', { h: 0.14, x: -3.55, y: 1.4, z: ZB + 0.02 });
    for (let k = 0; k < 5; k++) c.sticker(pick(STR_S), -3.55 + rnd(-0.3, 0.3), rnd(0.9, 1.9), ZB + 0.012, { size: rnd(0.1, 0.18) });
    c.glb('ph_marble_bust_01', { h: 0.3, x: 2.75, y: TIERS[3] + 0.0125, z: SZ });
    tag('SOUVENIR BUST, 1:6\nOF A MAN WHO MEANT WELL. $40', 2.75, TIERS[3] - 0.05, SZ + 0.224, 0, 0.42, 0.075);
    c.glb('ph_bronze_whale_statue', { len: 0.42, x: -2.75 + 0.1, y: TIERS[4] + 0.0125, z: SZ });
    tag('BRONZE WHALE, POCKET SIZE\nSTILL TOO BIG. $90', -2.65, TIERS[4] - 0.05, SZ + 0.224, 0, 0.42, 0.075);
    c.glb('ph_mantel_clock_01', { h: 0.25, x: 0.2, y: TIERS[4] + 0.0125, z: SZ });
    for (let k = 0; k < 6; k++) c.glb('pigeon', { h: 0.14, x: -1.6 + k * 0.42 + (k > 2 ? 0.5 : 0), y: TIERS[4] + 0.0125, z: SZ + 0.02, ry: rnd(-0.5, 0.5), tint: [0xff7aa0, 0x6f8dff, 0xf0f4f8, 0x9b6fd0, 0x7fe6ff, 0xd0a070][k], shadow: false });
    c.glb('ph_WetFloorSign_01', { h: 0.62, x: 1.0, z: ZF - 0.9, ry: 0.4 }); c.post(1.0, ZF - 0.9, 0.2);
    c.glb('ph_ceiling_fan', { len: 0.95, x: 0, y: CH - 0.42, z: 0.9, onload: (g) => { S.fan = g; } });

    // merge the drips last, now that every lip has one
    c.add(new THREE.Mesh(c.merge(drips.pink), pinkP));
    c.add(new THREE.Mesh(c.merge(drips.violet), violetP));

    // ---------- per frame ----------
    const _hw = new THREE.Vector3(), _cw = new THREE.Vector3();
    c.tick((t, dt, me) => {
      // snow, in every globe, every frame
      for (const s of SNOW) stepSnow(s, dt);
      // the shaken shelf globes wobble, and the room inside wobbles with them
      for (const g of shelf) { if (g.shake > 0) { g.shake = Math.max(0, g.shake - dt); const a = g.shake * 0.12; g.grp.rotation.set(Math.sin(t * 38) * a, 0, Math.cos(t * 31) * a); } else if (g.grp.rotation.x) g.grp.rotation.set(0, 0, 0); }
      if (S.bShake > 0) { S.bShake = Math.max(0, S.bShake - dt); const a = S.bShake * 0.08; BG.rotation.set(Math.sin(t * 34) * a, 0, Math.cos(t * 29) * a); } else if (BG.rotation.x) BG.rotation.set(0, 0, 0);
      // inside the big globe the glass and snow would fill the lens: they fade out of the way as you ride in
      bSrc.getWorldPosition(_hw); const dB = _hw.distanceTo(c.camera.position); bShell.visible = bSnow.pts.visible = dB > 0.42;
      // the cashier's eye: follow, blink, widen when something gets shaken
      eyeHead.getWorldPosition(_hw); _cw.copy(c.camera.position).sub(_hw);
      const want = Math.atan2(_cw.x, _cw.z); let dy = want - eyeState.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); eyeState.yaw += dy * Math.min(1, dt * 2.2); eyeHead.rotation.y = eyeState.yaw;
      const res = Math.atan2(Math.sin(want - eyeState.yaw), Math.cos(want - eyeState.yaw)), el = Math.atan2(_cw.y, Math.hypot(_cw.x, _cw.z));
      eyeState.look = [Math.max(-1, Math.min(1, res * 2.5)), Math.max(-1, Math.min(1, -el * 2))];
      if (cashRig && eyeState.alarm > (S.alarmWas || 0) + 0.5) cashRig.snap(); S.alarmWas = eyeState.alarm;
      eyeState.alarm = Math.max(0, eyeState.alarm - dt); eyeState.next -= dt;
      if (eyeState.next < 0 && eyeState.alarm <= 0) { eyeState.blink = 0.18; eyeState.next = rnd(2.5, 6); }
      eyeState.blink = Math.max(0, eyeState.blink - dt);
      eyeState.lid = eyeState.blink > 0 ? Math.sin((eyeState.blink / 0.18) * Math.PI) : eyeState.alarm > 0 ? 0 : 0.18;
      eyeState.look = eyeState.look.map((v) => Math.round(v * 20) / 20); eyeState.lid = Math.round(eyeState.lid * 10) / 10;
      drawEye();
      eyeHead.position.y = 1.78 + Math.sin(t * 1.3) * 0.008;
      // spinners, the fan, the knob, the crank
      for (const sp of spinners) { sp.rot.rotation.y += dt * sp.spin; sp.spin += (0.15 - sp.spin) * Math.min(1, dt * 0.8); }
      if (S.fan) S.fan.rotation.y += dt * 2.4;
      if (S.knobT > 0) { S.knobT = Math.max(0, S.knobT - dt * 1.6); S.knob.rotation.z = (1 - S.knobT) * Math.PI * 2; }
      if (S.crankT > 0) { S.crankT = Math.max(0, S.crankT - dt); S.crank.rotation.z -= dt * 7; }
      if (realPigeon.userData.ready) realPigeon.rotation.y = -2.4 + Math.sin(t * 0.7) * 0.5 + (Math.sin(t * 2.1) > 0.95 ? 0.3 : 0);
      // the register shows the loop you are on
      if (S.lcdLoop !== c.loop()) { S.lcdLoop = c.loop(); const n = c.sign(`LOOP ${c.loop() + 1}`, { w: 0.2, h: 0.05, bg: '#02040c', fg: '#00e5ff', font: c.MONO, glow: 6, px: 64 }); lcd.material.map.dispose(); lcd.material.map = n.material.map; S.drawBook && S.drawBook(); }
      void me;
    });
  },
  onLeave() {
    const F = this.state.fogk, PH = window.pigeonhole; if (!F || !PH) return;
    for (const id in F) { const D = PH.ROOMS.find((r) => r.id === id); if (!D) continue; if (F[id].v === undefined) delete D.fogD; else D.fogD = F[id].v; }
    this.state.fogk = {};
  },
  onEnter(c) {
    const S = c.R.state; S.drawBook && S.drawBook();
    if (!S.told) { S.told = true; setTimeout(() => c.toast('The gift shop. The globes on the back shelf are the rooms, live. The big one on the counter is the train.', 5200), 1800); }
  },
};
