// III. THE PIGEON. Room 7: LOST AND FOUND (the crop)
// The crop is the pouch in a pigeon's throat where food waits before it is digested. This one keeps everything,
// and keeps it the way a great museum keeps antiquities: a vaulted gallery of soft pink folds, plinths, brass labels,
// a docent. The sculptures are what the pigeon ate, at pigeon scale, so to you they are monuments.
//
// HEADLINE ILLUSION: THE REVERSE MAGNIFIER (a stencil pocket driven by a camera reactive homothety).
// A great lens stands in the aisle. Its glass is a stencil pocket (c.pocket) whose contents are a second copy of the
// gallery behind it at 1/40 scale. Every frame that copy is placed by a homothety (a uniform scale about a point)
// centred just in front of your eye on the line to the lens: x' = P + s (x - P), s = 1/40. A scaled copy about a
// point near the eye lands a hand's width from your face yet subtends almost the angle of the real room seen from
// twelve metres further back. So the lens shows the real gallery, in perfect perspective, as small as it really is:
// the size the pigeon swallowed it. Walk round the lens and the miniature follows, because it is rebuilt about you.
// From behind, the pane is one sided, and it is only glass.
const H = Math.PI / 2;
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

import { figure, parts, audience, CROWD_ON } from '../crowd.js';
export default {
  id: 'crop', name: 'Lost and Found', scale: 'III · The pigeon', sound: 'crop',
  kicker: 'The crop of one pigeon, where everything it ever swallowed is kept, catalogued and never returned.',
  sky: 0x1a0810, fog: 0x2a0f18, fogD: 0.01, hemi: [0xffd9e2, 0x3a1622, 0.75], env: 0.75,
  post: { dream: 0.12, bloom: 0.75, vig: 0.45, sat: 1.05, grain: 0.1, ca: 0.002 },
  spawn: [0, 3.8, 0],
  build(c) {
    const { THREE, R } = c; const S = R.state;
    const W = 8, HW = 3.6, Z0 = 6, Z1 = -32, LZ = 0.5;   // half width, wall height, the two ends, the lens
    const LP = 2 * HW + Math.PI * W;
    // ---------- the folds: one displacement field shared by the walls, the ribs and the contour shader ----------
    const amp = (y) => { const t = Math.min(1, Math.max(0, (y - (HW - 0.3)) / 1.8)); return t * t * (3 - 2 * t) * 0.45; };
    const fold = (s, z, y) => amp(y) * (0.6 * Math.sin(z * 0.7 + s * 0.9) + 0.25 * Math.sin(z * 1.9 - s * 0.5) + 0.2 * Math.sin(s * 2.3 + z * 0.3));
    const prof = (s) => {
      if (s < HW) return [-W, s, 1, 0];
      if (s < HW + Math.PI * W) { const th = Math.PI - (s - HW) / W; return [W * Math.cos(th), HW + W * Math.sin(th), -Math.cos(th), -Math.sin(th)]; }
      return [W, LP - s, -1, 0];
    };
    const onFold = (s, z, off = 0) => { const [x, y, nx, ny] = prof(s), d = fold(s, z, y) + off; return new THREE.Vector3(x + nx * d, y + ny * d, z); };
    const shellGeo = (za, zb) => {
      const nU = 120, nV = Math.max(4, Math.round((za - zb) / 0.4)), pos = [], uv = [], af = [], idx = [];
      for (let j = 0; j <= nV; j++) for (let i = 0; i <= nU; i++) {
        const s = i / nU * LP, z = za + (zb - za) * j / nV, [x, y, nx, ny] = prof(s), d = fold(s, z, y);
        pos.push(x + nx * d, y + ny * d, z); uv.push(s / 3, z / 3); af.push(d);
      }
      for (let j = 0; j < nV; j++) for (let i = 0; i < nU; i++) { const a = j * (nU + 1) + i, b = a + nU + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aF', new THREE.Float32BufferAttribute(af, 1)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    // the contour lines of the style, as an object space shader on the folds: isolines of the fold height, cobalt
    // low in the vault and hot pink near the crown, a fixed line width in pixels so they stay hairlines at any distance
    const shellMat = () => {
      const m = c.surf('crop', 3, { tint: 0xffe4ea }).clone(); m.side = THREE.DoubleSide;
      m.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aF; varying float vF; varying vec3 vOP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvF = aF; vOP = position;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vF; varying vec3 vOP;').replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float fz = vF * 6. + vOP.y * 0.22 + vOP.z * 0.03; float fw = fwidth(fz); float dd = abs(fract(fz + 0.5) - 0.5);
          float ln = (1. - smoothstep(0., fw * 1.3, dd)) * smoothstep(${(HW - 0.1).toFixed(2)}, ${(HW + 1.0).toFixed(2)}, vOP.y);
          totalEmissiveRadiance += ln * mix(vec3(0.16, 0.38, 1.0), vec3(1.0, 0.18, 0.39), smoothstep(5., 11., vOP.y)) * 0.7;`);
      };
      return m;
    };
    const capGeo = (holeR, holeY) => {
      const sh = new THREE.Shape(); sh.moveTo(-W - 0.4, -0.1); sh.lineTo(W + 0.4, -0.1); sh.lineTo(W + 0.4, HW); sh.absarc(0, HW, W + 0.4, 0, Math.PI, false); sh.lineTo(-W - 0.4, -0.1);
      if (holeR) { const h = new THREE.Path(); h.absarc(0, holeY, holeR, 0, Math.PI * 2, true); sh.holes.push(h); }
      const g = new THREE.ShapeGeometry(sh, 48), uv = g.attributes.uv, pp = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pp.getX(i) + W + 0.4) / (2 * W + 0.8), (pp.getY(i) + 0.1) / (HW + W + 0.5)); return g;
    };
    const GEO = {}; const memo = (k, f) => (GEO[k] ||= f());
    // the two end walls are plaster, bone white, with the style's contour lines rippling out from the door in each
    const wallT = (dy) => c.canvasTex(1024, 1024, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e6cdd3'); gr.addColorStop(1, '#d4b0b9'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * (1 - dy / (HW + W + 0.5));
      for (let k = 0; k < 34; k++) { const r0 = 120 + k * 26; g.beginPath(); for (let i = 0; i <= 200; i++) { const a = i / 200 * Math.PI * 2, r = r0 + 9 * Math.sin(a * 3 + k * 0.7) + 6 * Math.sin(a * 7 - k * 0.4) + k * 1.5 * Math.sin(a * 2 + 1.3); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = k % 5 === 0 ? 'rgba(255,46,99,.55)' : 'rgba(41,98,255,.32)'; g.lineWidth = k % 5 === 0 ? 2.4 : 1.4; g.stroke(); }
    });
    const capM = (dy) => new THREE.MeshStandardMaterial({ map: wallT(dy), roughness: 0.8 });

    // ---------- procedural surfaces ----------
    const breadT = c.canvasTex(512, 512, (g, w, h) => {
      const r = seeded(7); g.fillStyle = '#b8692b'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rr = 8 + r() * 46, gr = g.createRadialGradient(x, y, 0, x, y, rr), lt = r() < 0.55;
        gr.addColorStop(0, lt ? 'rgba(232,170,96,.55)' : 'rgba(96,44,14,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 1800; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,190,.25)' : 'rgba(60,24,6,.22)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    });
    breadT.wrapS = breadT.wrapT = THREE.RepeatWrapping;
    const fryT = c.canvasTex(128, 1024, (g, w, h) => { const r = seeded(13); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.6 ? 'rgba(150,90,20,.18)' : 'rgba(255,250,220,.35)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 2 + r() * 30); }
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(120,60,10,.25)'; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 6, 3 + r() * 10, 0, 0, 7); g.fill(); } });
    const cardT = c.canvasTex(1024, 640, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ffcf2e'); gr.addColorStop(1, '#f2a516'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#06163a'; g.font = `900 120px ${c.FONT}`; g.fillText('PIGEONCARD', 54, 170);
      g.font = `600 34px ${c.MONO}`; g.fillText('THE CITY OF NEW YORK, FOR BIRDS', 58, 230); g.fillText('VALID ON ALL LEDGES, STOOPS AND STATUES', 58, 276);
      g.fillStyle = '#2962ff'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(120 + i * 110, 430, 34, 0, 7); g.fill(); }
      c.eyeFlower(g, w - 170, h - 170, 120, {});
      g.save(); g.translate(560, 520); g.rotate(-0.18); g.strokeStyle = '#ff2e63'; g.lineWidth = 10; g.strokeRect(-250, -60, 500, 110); g.fillStyle = '#ff2e63'; g.font = `900 52px ${c.FONT}`; g.textAlign = 'center'; g.fillText('INSUFFICIENT FARE', 0, 16); g.restore();
    });
    const cardBackT = c.canvasTex(1024, 640, (g, w, h) => { g.fillStyle = '#f0e6c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.fillRect(0, 80, w, 120); g.fillStyle = '#333'; g.font = `500 26px ${c.MONO}`;
      ['Not transferable. Not refundable. Not food.', 'If found, do not return to the pigeon.', 'Swiped 41 times at Canal St. Balance 0.00 crumbs.'].forEach((l, i) => g.fillText(l, 60, 300 + i * 50)); });
    const capT = c.canvasTex(1024, 1024, (g, w, h) => {
      g.fillStyle = '#c3102a'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 520); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#f0f4f8'; g.lineWidth = 12; g.beginPath(); g.arc(w / 2, h / 2, 430, 0, 7); g.stroke();
      // a nazar, the blue eye that wards off the evil one
      for (const [r, col] of [[200, '#123a9c'], [150, '#f0f4f8'], [100, '#5fb4ff'], [52, '#02040c']]) { g.fillStyle = col; g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.fill(); }
      g.fillStyle = '#f0f4f8'; g.font = `italic 900 130px ${c.SERIF}`; g.textAlign = 'center'; g.fillText('NAZAR', w / 2, 250); g.fillText('COLA', w / 2, 880);
      g.font = `600 30px ${c.MONO}`; g.fillText('ICE COLD · SINCE TOMORROW', w / 2, 950);
    });
    const plaqueTex = (title, body, credit) => c.canvasTex(1024, 640, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e3c27a'); gr.addColorStop(0.5, '#b8902e'); gr.addColorStop(1, '#d9b465'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(60,40,10,.7)'; g.lineWidth = 6; g.strokeRect(18, 18, w - 36, h - 36);
      g.fillStyle = '#2a1a06'; g.font = `700 64px ${c.SERIF}`; g.fillText(title, 56, 116);
      g.font = `400 36px ${c.SERIF}`; let y = 196; const words = body.split(' '); let line = '';
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > w - 112) { g.fillText(line, 56, y); y += 48; line = wd; } else line = t; }
      if (line) g.fillText(line, 56, y);
      if (credit) { g.font = `italic 400 30px ${c.SERIF}`; g.fillText(credit, 56, h - 60); }
    });
    const lecternM = new THREE.MeshStandardMaterial({ color: 0x2a1418, roughness: 0.5, metalness: 0.2 });
    const label = (x, z, ry, title, body, credit) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; c.add(g);
      const post = c.slab(0.12, 1.0, 0.12, lecternM, 0, 0.5, 0); g.add(post); const foot = c.slab(0.4, 0.04, 0.3, lecternM, 0, 0.02, 0); g.add(foot);
      const t = plaqueTex(title, body, credit);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.41), new THREE.MeshStandardMaterial({ map: t, metalness: 0.55, roughness: 0.35, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35 }));
      p.position.set(0, 1.08, 0.04); p.rotation.x = -0.55; g.add(p);
      c.post(x, z, 0.12);
      return g;
    };

    // ---------- the exhibits, built twice: once for you, once at 1/40 inside the lens ----------
    // par: the parent group; mini: true for the pocket copy (no colliders, no labels, fresh materials so the stencil
    // state of the copy never leaks into the real room); seal: re-applies the pocket's stencil to late loading models
    const rect = (x, z, w, d) => { const a = w / 2, b = d / 2; c.wall(x - a, z - b, x + a, z - b); c.wall(x + a, z - b, x + a, z + b); c.wall(x + a, z + b, x - a, z + b); c.wall(x - a, z + b, x - a, z - b); };
    const exhibits = (par, mini, seal) => {
      const rnd = seeded(42);
      const add = (o) => { par.add(o); return o; };
      const M = {
        bread: new THREE.MeshPhysicalMaterial({ map: breadT, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.6 }),
        stone: c.surf('terrazzo', 1.5, { tint: 0xf6e8e4 }).clone(),
        gold: new THREE.MeshStandardMaterial({ color: 0xffc860, metalness: 1, roughness: 0.16, envMapIntensity: 1.6 }),
        brass: new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 }),
        pink: new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.2, clearcoat: 1, emissive: 0x4a0012, emissiveIntensity: 0.6 }),
        violet: new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.2, clearcoat: 1, emissive: 0x1c0630, emissiveIntensity: 0.6 }),
        fry: new THREE.MeshPhysicalMaterial({ map: fryT, vertexColors: true, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5 }),
        salt: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, emissive: 0x444444 }),
        sauce: new THREE.MeshPhysicalMaterial({ color: 0xa8201a, roughness: 0.3, clearcoat: 0.6 }),
        cheese: new THREE.MeshPhysicalMaterial({ color: 0xf2b630, roughness: 0.35, clearcoat: 0.4 }),
        card: new THREE.MeshStandardMaterial({ map: cardT, roughness: 0.35, emissive: 0xffffff, emissiveMap: cardT, emissiveIntensity: 0.25 }),
        cardB: new THREE.MeshStandardMaterial({ map: cardBackT, roughness: 0.5 }),
        cardE: new THREE.MeshStandardMaterial({ color: 0xf2a516, roughness: 0.4 }),
        capTop: new THREE.MeshPhysicalMaterial({ map: capT, metalness: 0.6, roughness: 0.28, clearcoat: 1 }),
        capSide: new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 1, roughness: 0.3 }),
        cork: new THREE.MeshStandardMaterial({ color: 0xc9a77a, roughness: 0.9 }),
        seed: [0xf3e2bd, 0x15110f, 0x5a3418, 0xf7f1e6].map((col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 })),
        art: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5 }),
      };
      const plinth = (x, z, w, d, h = 0.5) => { const m = c.slab(w, h, d, M.stone, x, h / 2, z); add(m); const lip = c.slab(w + 0.08, 0.05, d + 0.08, M.brass, x, h, z); add(lip); if (!mini) { c.blob(x, z, w * 1.2, d * 1.2); rect(x, z, w, d); } return h; };
      // paint drips: hot pink and violet, off the plinth lips
      const dripGeo = memo('drip', () => { const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14, y = -t; const r = t < 0.75 ? 0.035 * (1 - t * 0.5) : 0.05 * Math.sin((t - 0.75) / 0.25 * Math.PI) + 0.012; pts.push(new THREE.Vector2(Math.max(0.004, r), y)); } pts.push(new THREE.Vector2(0.001, -1.02)); return new THREE.LatheGeometry(pts, 8); });
      const drips = [];
      const drip = (x, y, z, len) => drips.push([x, y, z, len]);
      const plinthDrips = (x, z, w, d, h, n) => { for (let i = 0; i < n; i++) { const side = Math.floor(rnd() * 4), u = rnd() - 0.5; const px = side < 2 ? x + u * w : x + (side === 2 ? -1 : 1) * (w / 2 + 0.04), pz = side < 2 ? z + (side === 0 ? -1 : 1) * (d / 2 + 0.04) : z + u * d; drip(px, h + 0.02, pz, 0.08 + rnd() * h * 0.8); } };

      // 1. the everything bagel, the size of a car
      {
        const bx = 0, bz = -4.5, ph = plinth(bx, bz, 5.6, 5.6, 0.5); plinthDrips(bx, bz, 5.6, 5.6, ph, 10);
        const RR = 1.7, rr = 0.85;
        const nzf = (x, y, z) => 0.09 * Math.sin(x * 3.1 + z * 1.7) * Math.sin(y * 2.3 + x * 1.1) + 0.05 * Math.sin(x * 7.3 - y * 5.1 + z * 4.2);
        const geo = memo('bagel', () => { const g = new THREE.TorusGeometry(RR, rr, 40, 90), p = g.attributes.position, v = new THREE.Vector3(), cc = new THREE.Vector3();
          for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); cc.set(v.x, v.y, 0).setLength(RR); const n = v.clone().sub(cc).normalize(); v.addScaledVector(n, nzf(v.x, v.y, v.z)); p.setXYZ(i, v.x, v.y, v.z); }
          g.rotateX(-H); g.scale(1, 0.78, 1); g.computeVertexNormals(); return g; });
        const bagel = new THREE.Mesh(geo, M.bread); const bg = new THREE.Group(); bg.position.set(bx, ph + rr * 0.78 - 0.04, bz); bg.rotation.set(0.06, 0.4, -0.04); bg.add(bagel); add(bg);
        // the seeds: sesame, poppy, onion and salt, scattered over the top of the dough along its own surface
        const kinds = [[900, [0.05, 0.016, 0.03]], [700, [0.018, 0.018, 0.018]], [160, [0.07, 0.012, 0.05]], [140, [0.03, 0.03, 0.03]]];
        const sg = memo('seedG', () => new THREE.SphereGeometry(1, 6, 4)), sb = memo('saltG', () => new THREE.BoxGeometry(1, 1, 1));
        const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
        kinds.forEach(([n, sc], k) => {
          const im = new THREE.InstancedMesh(k === 3 ? sb : sg, M.seed[k], mini ? Math.round(n * 0.4) : n);
          for (let i = 0; i < im.count; i++) {
            const u = rnd() * Math.PI * 2, vv = (0.1 + rnd() * 0.8) * Math.PI;
            const lx = (RR + rr * Math.cos(vv)) * Math.cos(u), ly = (RR + rr * Math.cos(vv)) * Math.sin(u), lz = rr * Math.sin(vv);
            const cc = new THREE.Vector3(lx, ly, 0).setLength(RR), p0 = new THREE.Vector3(lx, ly, lz), n0 = p0.clone().sub(cc).normalize(); p0.addScaledVector(n0, nzf(lx, ly, lz) + 0.006);
            const p1 = new THREE.Vector3(p0.x, p0.z * 0.78, -p0.y), n1 = new THREE.Vector3(n0.x, n0.z / 0.78, -n0.y).normalize();
            q.setFromUnitVectors(up, n1).multiply(new THREE.Quaternion().setFromAxisAngle(up, rnd() * 6.28));
            m4.compose(p1, q, new THREE.Vector3(...sc).multiplyScalar(0.8 + rnd() * 0.5)); im.setMatrixAt(i, m4);
          }
          bg.add(im);
        });
        if (!mini) S.bagel = bagel;
      }
      // 2. the pizza crust, an arch you walk under
      {
        const az = -11, AX = 4.8, AY = 6.4;
        const curve = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => { const t = i / 12, a = Math.PI * (1 - t); return new THREE.Vector3(AX * Math.cos(a), AY * Math.sin(a) - 0.1, 0); }));
        const geo = memo('crust', () => { const g = new THREE.TubeGeometry(curve, 90, 0.78, 18), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
          for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = 0.13 * Math.sin(x * 2.1 + y * 1.3) * Math.sin(z * 4 + y * 0.8) + 0.07 * Math.sin(x * 5.3 + z * 3.1 + y * 6.1); p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d * 0.7); uv.setXY(i, uv.getX(i) * 6, uv.getY(i)); }
          g.computeVertexNormals(); return g; });
        const crust = new THREE.Mesh(geo, M.bread); crust.position.z = az; add(crust);
        const inner = new THREE.CatmullRomCurve3(curve.points.map((v) => new THREE.Vector3(v.x * 0.9, v.y * 0.9, 0)));
        const sauce = new THREE.Mesh(memo('sauce', () => new THREE.TubeGeometry(inner, 80, 0.55, 12)), M.sauce); sauce.position.z = az; sauce.scale.z = 0.9; add(sauce);
        // cheese, hanging from the inside of the arch where the slice used to be
        const ch = new THREE.InstancedMesh(dripGeo, M.cheese, 14), m4 = new THREE.Matrix4();
        for (let i = 0; i < 14; i++) { const t = 0.2 + i / 13 * 0.6, p0 = inner.getPoint(t); m4.compose(new THREE.Vector3(p0.x, p0.y - 0.35, az + (rnd() - 0.5) * 0.6), new THREE.Quaternion(), new THREE.Vector3(2.2, 0.4 + rnd() * 1.4, 2.2)); ch.setMatrixAt(i, m4); }
        add(ch);
        for (const sx of [-1, 1]) { const ph = plinth(sx * AX, az, 2.0, 2.0, 0.35); plinthDrips(sx * AX, az, 2, 2, ph, 3); }
      }
      // 3. the PIGEONCARD, standing like a monolith
      {
        const ph = plinth(3.4, -15.2, 2.8, 1.4, 0.3); plinthDrips(3.4, -15.2, 2.8, 1.4, ph, 4);
        const mg = new THREE.Group(); mg.position.set(3.4, 0, -15.2); mg.rotation.y = -0.45; add(mg);
        const card = new THREE.Mesh(memo('card', () => new THREE.BoxGeometry(2.16, 3.42, 0.04)), [M.cardE, M.cardE, M.cardE, M.cardE, M.card, M.cardB]);
        card.position.y = ph + 1.71; card.rotation.z = 0; mg.add(card);
        // the card art is drawn landscape; a monolith stands portrait
        if (!mini) c.tex.load('assets/g/g_metrocard.jpg', (t) => { t.colorSpace = THREE.SRGBColorSpace; t.center.set(0.5, 0.5); t.rotation = H; M.card.map = M.card.emissiveMap = t; M.card.needsUpdate = true; if (S.cardMini) { S.cardMini.map = S.cardMini.emissiveMap = t; S.cardMini.needsUpdate = true; } }, undefined, () => {});
        else S.cardMini = M.card;
        cardT.center.set(0.5, 0.5); cardT.rotation = H; cardBackT.center.set(0.5, 0.5); cardBackT.rotation = -H;
        if (!mini) S.card = card;
      }
      // 4. the NAZAR COLA bottle cap, on its edge
      {
        const geo = memo('cap', () => { const g = new THREE.CylinderGeometry(1.25, 1.25, 0.3, 84, 3, false), p = g.attributes.position;
          for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z); if (r < 1.2) continue; const a = Math.atan2(z, x), k = 1 + 0.045 * Math.cos(a * 21) * (y < 0 ? 1.4 : 0.3); p.setXYZ(i, x * k, y, z * k); }
          g.computeVertexNormals(); return g; });
        const cap = new THREE.Mesh(geo, [M.capSide, M.capTop, M.cork]); cap.rotation.set(H, 0, 0); cap.rotateZ(0.2);
        const cg = new THREE.Group(); cg.position.set(-3.4, 0.3 + 1.3, -15.2); cg.rotation.set(0.04, 0.45, 0); cg.add(cap); add(cg);
        const ph = plinth(-3.4, -15.2, 2.6, 1.2, 0.3); plinthDrips(-3.4, -15.2, 2.6, 1.2, ph, 4);
      }
      // 5. the french fries: columns that hold up the vault
      {
        const fg = memo('fry', () => { const g = new THREE.BoxGeometry(0.6, 1, 0.6, 1, 12, 1), p = g.attributes.position, col = [];
          for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.5, tip = Math.max(0, (y - 0.86) / 0.14), base = Math.max(0, (0.06 - y) / 0.06), b = Math.max(tip, base) * 0.6 + Math.abs(p.getX(i) * p.getZ(i)) * 0.6;
            const st = 0.08 * Math.sin(y * 40 + p.getX(i) * 9) * Math.sin(y * 13); col.push(0.86 - b * 0.4 + st, 0.56 - b * 0.36 + st, 0.12 - b * 0.08); p.setX(i, p.getX(i) + Math.sin(y * 3) * 0.04); }
          g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.translate(0, 0.5, 0); g.computeVertexNormals(); return g; });
        const zs = [-0.75, -5.25, -9.75, -14.25, -18.75, -23.25, -27.75], im = new THREE.InstancedMesh(fg, M.fry, 14), m4 = new THREE.Matrix4(), e = new THREE.Euler();
        const salt = new THREE.InstancedMesh(memo('saltG', () => new THREE.BoxGeometry(1, 1, 1)), M.salt, mini ? 60 : 280); let si = 0;
        let k = 0; for (const sx of [-1, 1]) for (const z of zs) {
          const L = 7.6 + rnd() * 0.8, lean = (rnd() - 0.5) * 0.04; e.set(lean, rnd() * 3, sx * (0.02 + rnd() * 0.03));
          m4.compose(new THREE.Vector3(sx * 6.2, 0, z), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(1, L, 1)); im.setMatrixAt(k++, m4);
          for (let j = 0; j < (mini ? 4 : 20) && si < salt.count; j++) { const a = rnd() * 6.28, lp = new THREE.Vector3(Math.cos(a) * 0.31, rnd() * 0.9, Math.sin(a) * 0.31).applyMatrix4(m4); const sm = new THREE.Matrix4().compose(lp, new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3)), new THREE.Vector3(0.05, 0.05, 0.05)); salt.setMatrixAt(si++, sm); }
          if (!mini) c.post(sx * 6.2, z, 0.42);
        }
        add(im); add(salt);
      }
      // 6. the lost gold earring, hung from the vault, turning
      {
        const eg = new THREE.Group(); eg.position.set(0, 4.1, -23.5); add(eg);
        const hoop = new THREE.Mesh(memo('hoop', () => new THREE.TorusGeometry(1.35, 0.1, 16, 96)), M.gold); eg.add(hoop);
        const clasp = new THREE.Mesh(memo('clasp', () => new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12)), M.gold); clasp.position.y = 1.4; eg.add(clasp);
        const wire = new THREE.Mesh(memo('wire', () => new THREE.CylinderGeometry(0.008, 0.008, 6, 4)), M.brass); wire.position.y = 1.45 + 3; eg.add(wire);
        const pl = plinth(0, -23.5, 1.6, 1.6, 0.25);
        if (mini) S.miniHoop = eg; else S.hoop = eg;
      }
      // 7. the props: Poly Haven food and toys, photoreal, at pigeon scale (thirty to sixty times)
      const props = [
        ['hotdog', 0, -19.2, { len: 4.6 }, 5.0, 1.8, 0], ['ph_croissant', -4.0, -8.4, { len: 3.4 }, 2.4, 2.4, 0.5], ['ph_food_apple_01', 4.0, -8.4, { h: 2.6 }, 2.4, 2.4, 0],
        ['ph_lemon', -3.8, -19.6, { len: 2.8 }, 2.2, 2.2, 0.8], ['ph_yellow_onion', 3.8, -19.6, { h: 2.7 }, 2.2, 2.2, 0], ['ph_bananas', -3.8, -26.4, { len: 3.8 }, 2.6, 2.6, 0.3],
        ['ph_hamburger_buns', 3.8, -26.4, { len: 3.2 }, 2.6, 2.6, 0.6], ['ph_rubber_duck_toy', 3.7, 1.4, { h: 2.4 }, 2.0, 2.0, -0.6], ['ph_baseball_01', -3.7, 1.4, { h: 2.2 }, 2.0, 2.0, 0.4],
      ];
      for (const [name, x, z, sz, w, d, ry] of props) {
        const ph = plinth(x, z, w, d, 0.45); plinthDrips(x, z, w, d, ph, 3);
        const g = c.glb(name, { ...sz, x, y: ph + 0.01, z, ry, parent: par, onload: () => { mini && seal && seal(); } });
        if (!mini) S['p_' + name] = g;
      }
      // the drips, all of them, one draw per colour
      const dm = [new THREE.InstancedMesh(dripGeo, M.pink, drips.length), new THREE.InstancedMesh(dripGeo, M.violet, drips.length)]; const cnt = [0, 0], m4 = new THREE.Matrix4();
      drips.forEach(([x, y, z, len], i) => { const k = i % 3 === 0 ? 1 : 0; m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(1, len, 1)); dm[k].setMatrixAt(cnt[k]++, m4); });
      dm.forEach((m, k) => { m.count = cnt[k]; add(m); });
      return M;
    };

    // ---------- the room ----------
    const real = new THREE.Group(); c.add(real);
    const shell = new THREE.Mesh(memo('shell', () => shellGeo(Z0, Z1)), shellMat()); c.add(shell);
    const capF = new THREE.Mesh(memo('capF', () => capGeo(1.5, 1.6)), capM(1.6)); capF.position.z = Z0; capF.rotation.y = Math.PI; c.add(capF);
    const capBM = capM(1.7), capB = new THREE.Mesh(memo('capB', () => capGeo(1.6, 1.7)), capBM); capB.position.z = Z1; c.add(capB);
    c.wall(-W + 0.3, Z0, -W + 0.3, Z1); c.wall(W - 0.3, Z0, W - 0.3, Z1); c.wall(-W, Z0 - 0.15, W, Z0 - 0.15); c.wall(-W, Z1 + 0.15, W, Z1 + 0.15);
    const floorM = c.surf('terrazzo', 2.2, { tint: 0xe2bcc2 });
    c.box(2 * W, 0.1, Z0 - Z1, floorM, 0, -0.05, (Z0 + Z1) / 2, { collide: false });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 });
    for (const sx of [-1, 1]) { c.box(0.06, 0.012, Z0 - Z1, brass, sx * 5.2, 0.006, (Z0 + Z1) / 2, { collide: false }); c.box(0.06, 0.012, Z0 - Z1, brass, sx * 7.2, 0.006, (Z0 + Z1) / 2, { collide: false }); }
    // the cornice where the walls become the vault, with paint running off it
    const corM = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.5 });
    for (const sx of [-1, 1]) c.box(0.22, 0.16, Z0 - Z1, corM, sx * (W - 0.11), HW - 0.25, (Z0 + Z1) / 2, { collide: false });
    // the transverse ribs, following the folds exactly (copper, a hand's width proud of the wall)
    const ribM = new THREE.MeshStandardMaterial({ color: 0xbe854c, metalness: 0.85, roughness: 0.35 });
    for (let z = 3.5; z > Z1 + 1; z -= 4.5) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(onFold(HW + i / 40 * Math.PI * W, z, 0.08)); const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.07, 6), ribM); c.add(rib); }
    exhibits(real, false);
    // the drips off the cornice, never below 2.7 m, so never over a painting
    {
      const rnd = seeded(9), dg = new THREE.LatheGeometry([0, 0.2, 0.5, 0.75, 0.88, 0.96, 1].map((t, i) => new THREE.Vector2(i === 6 ? 0.001 : t < 0.75 ? 0.04 * (1 - t * 0.4) : 0.055 * Math.sin((t - 0.75) / 0.25 * Math.PI) + 0.015, -t)), 8);
      for (const [col, n] of [[0xff2e63, 46], [0x6f23a8, 24]]) {
        const im = new THREE.InstancedMesh(dg, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.2, clearcoat: 1, emissive: col, emissiveIntensity: 0.15 }), n), m4 = new THREE.Matrix4();
        for (let i = 0; i < n; i++) { const sx = rnd() < 0.5 ? -1 : 1; m4.compose(new THREE.Vector3(sx * (W - 0.05), HW - 0.33, Z0 - 1 - rnd() * (Z0 - Z1 - 2)), new THREE.Quaternion(), new THREE.Vector3(1, 0.12 + rnd() * 0.28, 1)); im.setMatrixAt(i, m4); }
        c.add(im);
      }
    }
    // ---------- the fourteen New Yorkers, on the flat lower walls, between the fries ----------
    const art = c.art(14), styles = ['gilt', 'bone', 'copper', 'gilt', 'black', 'gilt', 'bone'];
    const hung = [];
    art.forEach((p, i) => { const sx = i % 2 ? 1 : -1, k = i >> 1, z = 1.5 - k * 4.5; const g = c.hang(p, sx * (W - 0.02), 1.62, z, -sx * H, 1.45, styles[k % styles.length], { light: true }); hung.push(g); });
    // ---------- labels ----------
    const L = [
      [0.0, -0.9, 0, 'Everything bagel, crumb', 'Astoria, this morning. Seeds, onion, salt, regret. The crumb was swallowed whole; the bagel followed out of loyalty.', 'Gift of an unnamed tourist'],
      [-1.4, -9.9, 0, 'Pizza crust, arch form', 'Bleecker St, 2:40 a.m. The slice was eaten by a person. The crust was left on the curb, as is customary, for us.', 'Acquired by tradition'],
      [2.1, -14.2, -0.45, 'PIGEONCARD, insufficient fare', 'Found under a turnstile at Canal St. Swiped forty one times by the previous owner, who said a word we cannot print.', 'On permanent loan from the turnstile'],
      [-2.1, -14.2, 0.45, 'Bottle cap, NAZAR COLA', 'Coney Island boardwalk, July. The cola was never offered. The eye on the cap has been watching the collection since.', 'Purchased with a french fry'],
      [5.3, -12.0, -H, 'French fries, fourteen, standing', 'A halal cart, 53rd and 6th. They hold up the ceiling. Conservators ask that you do not lean on the fries.', 'Attributed to the cart'],
      [-1.6, -17.9, 0, 'Hot dog cart, entire', 'Midtown, lunch hour. The pigeon wanted one hot dog and could not decide which. The vendor has been compensated in crumbs.', 'Acquired at speed'],
      [1.3, -22.2, 0, 'Earring, gold, one of a pair', 'Lost on the Q train, 2019. Its owner looked for an hour. The other one is still looking.', 'Unclaimed, then claimed'],
      [-4.6, -6.7, 0.3, 'Croissant', 'A bakery in the West Village. Swallowed in one piece, which the curators describe as ambitious.', 'Gift of the floor'],
      [4.6, -6.7, -0.3, 'Apple', 'Union Square Greenmarket. The city is named for one of these. This is that one.', 'Provenance disputed'],
      [-3.8, -18.0, 0, 'Lemon', 'A seltzer on a stoop in Bushwick. Sour on arrival. Kept for study.', 'Gift of a stoop'],
      [3.8, -18.0, 0, 'Yellow onion', 'Fell off a truck on Canal St. Staff were moved to tears, every time.', 'Found object'],
      [-2.1, -25.8, 0.6, 'Bananas, a bunch', 'A bodega on Roosevelt Ave. Ninety nine cents, unpaid. The cat saw everything.', 'Under review'],
      [2.1, -25.8, -0.6, 'Hamburger buns, a pair', 'A Flatbush cookout, no hamburger. The hamburger is in a private collection.', 'Gift of a grill'],
      [2.3, 2.3, -0.7, 'Rubber duck', 'The pond in Central Park. Considered a rival. Swallowed as a precaution.', 'Seized'],
      [-2.3, 2.3, 0.7, 'Baseball', 'The Bronx, a foul ball, section 203. Caught by a pigeon, which is not allowed. Nobody asked for it back.', 'Fair catch'],
      [4.4, -28.0, -0.6, 'Grit', 'Pigeons swallow stones to grind their food. These are from the Brooklyn Bridge, taken one at a time since 1883.', 'Structural'],
    ];
    for (const [x, z, ry, t, b, cr] of L) label(x, z, ry, t, b, cr);

    // ---------- THE REVERSE MAGNIFIER ----------
    {
      const lg = new THREE.Group(); lg.position.set(0, 1.85, LZ); c.add(lg);
      const RL = 1.05;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(RL + 0.06, 0.09, 16, 96), brass); lg.add(ring);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(RL + 0.18, 0.025, 8, 96), new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false })); lg.add(ring2);
      const yoke = new THREE.Mesh(new THREE.TorusGeometry(RL + 0.3, 0.05, 8, 48, Math.PI), brass); yoke.rotation.z = Math.PI; lg.add(yoke);
      for (const sx of [-1, 1]) { const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12), brass); ax.rotation.z = H; ax.position.x = sx * (RL + 0.2); lg.add(ax); }
      const stem = c.slab(0.14, 0.55, 0.14, brass, 0, 0.27, LZ); c.add(stem); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.18, 32), new THREE.MeshStandardMaterial({ color: 0x2a1418, roughness: 0.4, metalness: 0.3 })); base.position.set(0, 0.09, LZ); c.add(base);
      c.post(0, LZ, 0.7);
      const mask = new THREE.Mesh(new THREE.CircleGeometry(RL, 64)); mask.position.set(0, 1.85, LZ); c.add(mask);
      const etch = c.sign('OBJECTS IN LENS ARE AS SMALL AS THEY ARE', { w: 1.5, h: 0.07, bg: null, fg: '#f0f4f8', font: c.MONO, weight: 600, px: 64 }); etch.position.set(0, 1.85 - RL + 0.12, LZ + 0.01); etch.material.opacity = 0.7; c.add(etch);
      let miniG = null, M2 = null, sealF = null;
      const pocket = c.pocket({ mask, sheen: 0.12, build: (grp, seal) => {
        sealF = seal;
        miniG = new THREE.Group(); grp.add(miniG);
        // the far half of the gallery, behind the glass: the shell, the far wall, the sculptures, the paintings
        const sh2 = new THREE.Mesh(memo('shellMini', () => shellGeo(30, Z1)), shellMat()); miniG.add(sh2);
        const cb = new THREE.Mesh(GEO.capB, capBM.clone()); cb.position.z = Z1; miniG.add(cb);
        const fl = c.slab(2 * W, 0.1, 30 - Z1, c.surf('terrazzo', 2.2, { tint: 0xe2bcc2 }).clone(), 0, -0.05, (30 + Z1) / 2); miniG.add(fl);
        const glow = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: 0xff2e63, toneMapped: false })); glow.position.set(0, 1.7, Z1 + 0.02); miniG.add(glow);
        M2 = exhibits(miniG, true, seal);
        // the paintings in the copy: plain planes that borrow each painting's picture once it has loaded
        S.miniArt = hung.filter((g) => g.position.z < LZ - 0.6).map((g) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.position.copy(g.position); m.position.x *= 0.995; m.rotation.copy(g.rotation); miniG.add(m); return { m, src: g.userData.art }; });
        // a backdrop, so the glass never shows anything but the miniature
        const bd = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 12), new THREE.MeshBasicMaterial({ color: 0x2a0f18, side: THREE.BackSide, fog: false })); bd.position.set(0, 4, -10); miniG.add(bd);
      } });
      // the homothety, about a point a third of a metre in front of your eye on the line to the lens
      const s = 1 / 40, B = 18, pd = B * s / (1 - s), E = new THREE.Vector3(), Lc = new THREE.Vector3(0, 1.85, LZ), P0 = new THREE.Vector3();
      c.tick((t, dt, me) => {
        if (!miniG) return;
        const on = me.z > LZ + 0.05 && me.z - LZ < 16; miniG.visible = on; if (!on) return;
        E.set(me.x, me.y, me.z); P0.copy(Lc).sub(E).normalize().multiplyScalar(pd).add(E);
        miniG.scale.setScalar(s); miniG.position.copy(P0).multiplyScalar(1 - s);
        for (const a of S.miniArt) if (!a.done && a.src?.material.map?.image) { a.m.material.map = a.src.material.map; a.m.material.needsUpdate = true; a.m.scale.copy(a.src.scale); a.done = true; sealF && sealF(); }
        if (S.miniHoop) S.miniHoop.rotation.y = t * 0.25;
      });
      c.click(ring, () => c.egg('crop_lens', 'Through the glass the collection is the size it really is. A pigeon swallowed all of that. Think about it.'), 'Look through the lens');
      label(1.6, LZ + 0.6, -0.5, 'The Reverse Magnifier', 'Look through it. Every object in this room is shown at its true size, which is the size of a crumb. So are you, to the pigeon.', 'Lent by the optician on Ditmars');
    }

    // ---------- the doors ----------
    // back to the nave: a round opening in the near wall, feathers beyond it
    {
      const fr = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.09, 12, 72), brass); fr.position.set(0, 1.6, Z0 - 0.04); c.add(fr);
      const beyond = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), c.surf('feather', 1.5, { tint: 0x6070c0, params: { emissive: 0x16205a, emissiveIntensity: 1 } })); beyond.position.set(0, 1.6, Z0 + 0.6); beyond.rotation.y = Math.PI; c.add(beyond);
      const sg = c.sign('THE NAVE', { w: 1.6, h: 0.32, bg: '#06163a', fg: '#f2cf72', font: c.SERIF, weight: 700, px: 128, border: '#b8902e' }); sg.position.set(0, 3.45, Z0 - 0.05); sg.rotation.y = Math.PI; c.add(sg);
      c.door({ x: 0, z: Z0 - 0.45, r: 0.75, to: 'nave' });
      const intro = c.sign('LOST AND FOUND\nThe permanent collection of one pigeon', { w: 3.6, h: 0.8, bg: null, fg: '#3a0f1c', font: c.SERIF, weight: 700, px: 160 }); intro.position.set(-4.9, 2.4, Z0 - 0.05); intro.rotation.y = Math.PI; c.add(intro);
      const intro2 = c.sign('Admission is one crumb.\nNothing here is returned.', { w: 3.0, h: 0.6, bg: null, fg: '#3a0f1c', font: c.SERIF, weight: 400, px: 128 }); intro2.position.set(4.9, 2.4, Z0 - 0.05); intro2.rotation.y = Math.PI; c.add(intro2);
    }
    // on to the heart: an iris in the far wall, nine soft blades, watched by the room's one Open Eye Flower.
    // The eye has a job. It tracks you down the hall, and when it has seen you close enough, it opens the iris.
    {
      const DZ = Z1, DY = 1.7, RD = 1.6;
      const bladeM = new THREE.MeshPhysicalMaterial({ color: 0xd6607c, roughness: 0.42, sheen: 1, sheenColor: new THREE.Color(0xff9fb8), sheenRoughness: 0.4, side: THREE.DoubleSide });
      const blades = [], N = 9;
      const shape = new THREE.Shape(); shape.moveTo(0, 0); for (let i = 0; i <= 12; i++) { const a = -0.55 + i / 12 * 1.25; shape.lineTo(Math.cos(a) * 3.4, Math.sin(a) * 3.4); } shape.lineTo(0, 0);
      const bgeo = new THREE.ShapeGeometry(shape);
      for (let i = 0; i < N; i++) { const pv = new THREE.Group(); pv.position.set(0, DY, DZ - 0.06 - i * 0.006); pv.rotation.z = i / N * Math.PI * 2; const b = new THREE.Mesh(bgeo, bladeM); pv.add(b); c.add(pv); blades.push({ pv, b, a: i / N * Math.PI * 2 }); }
      const glowT = c.canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, '#ffd0dc'); gr.addColorStop(0.25, '#ff2e63'); gr.addColorStop(0.7, '#6a0a24'); gr.addColorStop(1, '#14020a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,120,160,.35)'; g.lineWidth = 2; for (let k = 1; k < 9; k++) { g.beginPath(); g.arc(w / 2, h / 2, k * 15, 0, 7); g.stroke(); } });
      const glowM = new THREE.MeshBasicMaterial({ map: glowT, color: 0xff2e63, toneMapped: false }); const glow = new THREE.Mesh(new THREE.CircleGeometry(RD, 48), glowM); glow.position.set(0, DY, DZ - 0.6); c.add(glow);
      const frame = new THREE.Mesh(new THREE.TorusGeometry(RD + 0.05, 0.11, 14, 80), brass); frame.position.set(0, DY, DZ + 0.05); c.add(frame);
      const cm = new THREE.MeshBasicMaterial({ color: 0x2962ff, toneMapped: false });
      for (const r of [RD + 0.3, RD + 0.45, RD + 0.62]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 96), cm); t.position.set(0, DY, DZ + 0.03); c.add(t); }
      const sg = c.sign('THE HEART', { w: 1.8, h: 0.34, bg: '#06163a', fg: '#f2cf72', font: c.SERIF, weight: 700, px: 128, border: '#b8902e' }); sg.position.set(0, 0.25 + DY + RD + 0.95, DZ + 0.05); c.add(sg);
      // the sovereign eye, above the door
      const ecv = document.createElement('canvas'); ecv.width = ecv.height = 512; const et = new THREE.CanvasTexture(ecv); et.colorSpace = THREE.SRGBColorSpace;
      const eye = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshBasicMaterial({ map: et, transparent: true, toneMapped: false })); eye.position.set(0, 6.4, DZ + 0.08); c.add(eye);
      const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 8, 64), brass); eyeRing.position.copy(eye.position); c.add(eyeRing);
      const draw = (lid, lx, ly) => { const g = ecv.getContext('2d'); g.clearRect(0, 0, 512, 512); c.eyeFlower(g, 256, 256, 240, { lid, look: [lx, ly], iris: '#ff2e63' }); et.needsUpdate = true; };
      draw(0, 0, 0);
      const door = c.door({ x: 0, z: DZ + 0.6, r: 0.8, to: 'heart', off: true });
      c.light(0, 2.2, DZ + 1.6, 0xff2e63, 9, 9, () => 0.6 + 0.4 * (S.open || 0));
      let lastDraw = 0, blinkAt = 3, open = 0, beatT = 0;
      c.tick((t, dt, me) => {
        const dx = me.x, dy = me.y - 6.4, dz = me.z - DZ, dist = Math.hypot(dx, dz);
        const want = dist < 8.5 ? 1 : 0; open += (want - open) * Math.min(1, dt * 1.6); S.open = open; door.off = open < 0.85;
        for (const B of blades) { const o = open; B.b.position.set(o * 1.75, 0, 0); B.b.rotation.z = o * 0.35; B.pv.rotation.z = B.a + o * 0.6; }
        const pu = Math.exp(-((t % 1.05) / 1.05) * 9); glowM.color.setRGB(0.75 + 0.5 * pu, 0.7 + 0.3 * pu, 0.75 + 0.3 * pu);
        // the heart is beating on the other side of the wall: you hear it before you see it
        beatT += dt; if (dist < 13 && beatT > 1.05) { beatT = 0; c.sound.thump(0.12 + 0.35 * (1 - dist / 13)); }
        if (t - lastDraw > 0.12) { lastDraw = t; let lid = 0; if (t > blinkAt) { lid = Math.min(1, (t - blinkAt) * 8); if (t > blinkAt + 0.25) blinkAt = t + 2.5 + Math.random() * 4; }
          draw(lid, Math.max(-1, Math.min(1, dx / Math.max(2, dz) * 1.6)), Math.max(-1, Math.min(1, -dy / Math.max(2, dz) * 1.6))); }
      });
      c.click(eye, () => c.say(eye, 'I see you. Come closer.'), 'The eye over the door');
    }

    // ---------- the docent: the lone figure ----------
    {
      const fg = new THREE.Group(); fg.position.set(-4.9, 0, -29.3); fg.rotation.y = 0.9; c.add(fg);
      const coat = new THREE.MeshStandardMaterial({ color: 0x2a3a6a, roughness: 0.8 }), skirt = new THREE.MeshStandardMaterial({ color: 0x1b1d2a, roughness: 0.85 });
      const cap = (r, h, m, x, y, z) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 10), m); o.position.set(x, y, z); fg.add(o); return o; };
      cap(0.07, 0.62, skirt, -0.1, 0.42, 0); cap(0.07, 0.62, skirt, 0.1, 0.42, 0); cap(0.2, 0.5, coat, 0, 1.15, 0); cap(0.06, 0.5, coat, -0.27, 1.1, 0.05).rotation.z = 0.2; cap(0.06, 0.5, coat, 0.27, 1.1, 0.12).rotation.x = -0.9;
      const badge = c.sign('DOCENT', { w: 0.16, h: 0.06, bg: '#f0f4f8', fg: '#06163a', font: c.MONO, px: 48 }); badge.position.set(0.1, 1.28, 0.21); fg.add(badge);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; c.eyeFlower(cv.getContext('2d'), 128, 128, 120, { iris: '#2962ff', look: [0.3, 0.1] });
      const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace; const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht })); head.scale.set(0.55, 0.55, 1); head.position.y = 1.78; fg.add(head);
      // 2026-10-28: the Assistant from the cast (cardigan, skirt, an armful of papers) is the docent, whole, her own eye flower
      figure(c, fg, 'assistant_full', { h: 1.72, hide: [...parts(fg, [badge]), head] });
      c.post(-4.9, -29.3, 0.35);
      const lines = ['She has fed this pigeon every one of these. Personally.', 'Please do not touch the bagel. It is load bearing.', 'The earring is the only thing here anyone came back for.'];
      let k = 0; c.click(fg, () => { c.say(head, lines[k++ % lines.length]); c.egg('crop_docent', 'The docent: "I fed him every piece in the collection. He is not ungrateful. He is curating."'); }, 'The docent');
    }
    // the clicks on the collection
    if (S.hoop) c.click(S.hoop, () => c.egg('crop_earring', 'One gold earring. Lost on the Q, 2019. Claimed by no one, and then, finally, by a pigeon.'), 'The earring');
    if (S.bagel) c.click(S.bagel, () => c.egg('crop_bagel', 'An everything bagel. Everything is accounted for, except the lox. The lox is a separate department.'), 'The bagel');

    // ---------- the rest of the room: benches, ropes, grit, the donation box, banners, stickers ----------
    c.glb('bench', { len: 2.4, x: 2.6, z: -29.2, ry: -H });
    rect(2.6, -29.2, 0.7, 2.4);
    c.glb('ph_round_spectacles', { len: 0.16, x: 2.6, y: 0.47, z: -29.0 });
    c.glb('ph_magnifying_glass_01', { len: 0.25, x: 1.62, y: 1.2, z: LZ + 0.62, ry: 0.4 });
    // velvet ropes in front of the bagel, with a gap to lean in
    {
      const ropeM = new THREE.MeshStandardMaterial({ color: 0x8a0f2a, roughness: 0.6 }), pg = new THREE.CylinderGeometry(0.04, 0.12, 0.95, 12);
      for (const x of [-3.0, -1.0, 1.0, 3.0]) { const p = new THREE.Mesh(pg, brass); p.position.set(x, 0.47, -1.25); c.add(p); }
      for (const [x1, x2] of [[-3, -1], [1, 3]]) c.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(x1, 0.88, -1.25), new THREE.Vector3((x1 + x2) / 2, 0.7, -1.25), new THREE.Vector3(x2, 0.88, -1.25)), 20, 0.025, 6), ropeM));
    }
    // grit from the Brooklyn Bridge, a heap of it
    {
      const rnd = seeded(3), im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: 0.9 }), 160), m4 = new THREE.Matrix4();
      for (let i = 0; i < 160; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 1.4, h = (1.4 - r) * 0.7 * rnd(); m4.compose(new THREE.Vector3(5.9 + Math.cos(a) * r, h + 0.08, -30.0 + Math.sin(a) * r * 0.7), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, 0)), new THREE.Vector3(1, 0.7, 0.9).multiplyScalar(0.1 + rnd() * 0.18)); im.setMatrixAt(i, m4); }
      c.add(im); c.post(5.9, -30, 1.3);
    }
    // crumbs, everywhere, as in any museum of this kind
    {
      const rnd = seeded(5), im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ map: breadT, roughness: 0.8 }), 140), m4 = new THREE.Matrix4();
      for (let i = 0; i < 140; i++) { m4.compose(new THREE.Vector3((rnd() - 0.5) * 13, 0.04, Z0 - 1 - rnd() * 35), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, 0)), new THREE.Vector3(1, 0.6, 0.8).multiplyScalar(0.04 + rnd() * 0.08)); im.setMatrixAt(i, m4); }
      c.add(im);
    }
    // the donation box
    {
      const bx = c.box(0.6, 1.0, 0.45, new THREE.MeshPhysicalMaterial({ color: 0xdfe8ff, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }), 4.2, 0.5, 4.6);
      const s = c.sign('SUGGESTED DONATION\nONE CRUMB', { w: 0.6, h: 0.24, bg: '#06163a', fg: '#f0f4f8', font: c.MONO, px: 96 }); s.position.set(4.2, 1.15, 4.84); c.add(s);
      const crumbs = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.04, 0), new THREE.MeshStandardMaterial({ map: breadT }), 30), m4 = new THREE.Matrix4(), rnd = seeded(11);
      for (let i = 0; i < 30; i++) { m4.makeTranslation(4.2 + (rnd() - 0.5) * 0.5, 0.06 + rnd() * 0.18, 4.6 + (rnd() - 0.5) * 0.35); crumbs.setMatrixAt(i, m4); } c.add(crumbs);
    }
    // banners down the vault
    for (const [z, txt, bg, fg] of [[-2.5, 'LOST\nAND\nFOUND', '#ff2e63', '#f0f4f8'], [-13.0, 'THE\nPERMANENT\nCOLLECTION', '#06163a', '#00e5ff'], [-24.5, 'NOTHING\nIS\nRETURNED', '#6f23a8', '#f0f4f8']]) {
      for (const sx of [-1, 1]) { const b = c.sign(txt, { w: 1.3, h: 3.0, bg, fg, font: c.SERIF, weight: 800, px: 600 }); b.material.side = THREE.DoubleSide; b.position.set(sx * 4.4, 8.0, z); b.rotation.y = sx * 0.35; c.add(b); }
    }
    // stickers: clustered on the plinths, the lens base, the lecterns and the door frames, never on the art
    {
      const G = window.STICKER_GROUPS || {}, pool = [...(G.street || []), ...(G.museum || []).slice(0, 24), ...(G.eye || []).slice(0, 16), ...(G.mlow || []).slice(0, 8)];
      const rnd = seeded(77); let k = 0;
      const cluster = (x, y, z, ry, n, sp = 0.35) => { for (let i = 0; i < n; i++) c.sticker(pool[(k++ * 7) % pool.length], x + Math.cos(ry) * (rnd() - 0.5) * sp, y + (rnd() - 0.5) * sp * 0.6, z - Math.sin(ry) * (rnd() - 0.5) * sp, { ry, size: 0.12 + rnd() * 0.1 }); };
      cluster(0, 0.27, -4.5 + 2.81, 0, 6, 1.6); cluster(2.81, 0.27, -4.5, H, 4, 1.2); cluster(-2.81, 0.27, -4.5, -H, 4, 1.2);
      cluster(0, 0.24, -19.2 + 0.91, 0, 5, 1.6); cluster(-4.8 + 1.01, 0.18, -11, H, 3, 0.8); cluster(4.8 - 1.01, 0.18, -11, -H, 3, 0.8);
      cluster(-3.2, 1.9, Z1 + 0.03, 0, 5, 0.6); cluster(3.2, 1.3, Z1 + 0.03, 0, 4, 0.6); cluster(-1.8, 0.8, Z0 - 0.03, Math.PI, 5, 0.6);
      cluster(3.7, 0.23, 1.4 + 1.01, 0, 3, 0.9); cluster(-3.7, 0.23, 1.4 + 1.01, 0, 3, 0.9); cluster(4.2, 0.4, 4.6 + 0.24, 0, 3, 0.4);
    }
    // ---------- light ----------
    c.light(0, 7.5, 1.5, 0xffe2c8, 24, 22); c.light(0, 7.5, -9, 0xffe2c8, 24, 22); c.light(0, 7.5, -20, 0xffe2c8, 24, 22);
    c.light(0, 2.8, LZ + 2.2, 0x9fe8ff, 5, 7); c.light(0, 4, -26.5, 0xfff0d8, 18, 14);
    c.tick((t) => { if (S.hoop) S.hoop.rotation.y = t * 0.25; });
  },
  onEnter(c) { if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('Look through the lens before you look at anything else.', 4200), 4200); } },
};
