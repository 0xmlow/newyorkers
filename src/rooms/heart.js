// III. THE PIGEON. Room 8: THE HEART
// The pigeon's heart is an opera house: a round red velvet chamber, three tiers of boxes, veins of neon running up the
// walls and over the dome, a chandelier of light, four valve arches. Through the stage arch, the heart itself.
//
// HEADLINE ILLUSION: THE ROOM HAS YOUR PULSE (camera reactive and gaze reactive behaviour).
// One clock drives everything: a beat phase that advances at a tempo in beats per minute. The walls and dome swell
// (a vertex shader pushes them inward along their normals), the veins flare, the chandelier swells and brightens, the
// paintings breathe, the valves flap, and on every beat c.sound.thump() plays the lub dub. The tempo is measured from
// you, every frame: your speed over the floor (position delta over dt, smoothed) sets it, so standing still slows the
// room to a resting beat, walking quickens it and running makes it race. And a gaze test: the dot product of the
// camera's forward vector with the direction to the chandelier. Hold the chandelier in the middle of your view for
// three seconds and the room flushes red, the boxes turn to look at you, and the beat doubles until you look away.
const H = Math.PI / 2, D2R = Math.PI / 180;
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

import { figure, parts, audience, CROWD_ON } from '../crowd.js';
import { rigged } from '../rig.js';
export default {
  id: 'heart', name: 'The Heart', scale: 'III · The pigeon', sound: 'heart',
  kicker: 'An opera house the size of a pigeon heart. Tonight: circulation. The tempo is you.',
  sky: 0x12030a, fog: 0x1c0510, fogD: 0.012, hemi: [0xffb4c4, 0x2a0610, 0.6], env: 0.6,
  post: { dream: 0.18, bloom: 1.0, vig: 0.55, sat: 1.05, grain: 0.1, ca: 0.003 },
  spawn: [0, 7.4, 0],
  build(c) {
    const { THREE, R } = c; const S = R.state;
    const RW = 11, WH = 9, P = (th, r) => [r * Math.sin(th * D2R), -r * Math.cos(th * D2R)];
    const U = { uBeat: { value: 0 } };
    // ---------- materials ----------
    const swell = (m) => { m.onBeforeCompile = (sh) => { sh.uniforms.uBeat = U.uBeat;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uBeat;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed -= normal * uBeat * 0.16 * (0.65 + 0.35 * sin(position.y * 0.9 + atan(position.x, position.z) * 5.));'); }; return m; };
    const wallM = swell(c.surf('velvet', 1.6, { tint: 0xe03050 }).clone()); wallM.side = THREE.BackSide;
    const domeM = swell(c.surf('velvet', 2.2, { tint: 0xa01a36 }).clone()); domeM.side = THREE.BackSide;
    const flatM = c.surf('velvet', 1.6, { tint: 0xe03050 });
    const seatM = c.surf('velvet', 0.8, { tint: 0xff4060 });
    const gilt = new THREE.MeshStandardMaterial({ color: 0xd4a640, metalness: 1, roughness: 0.3, envMapIntensity: 1.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a0c12, roughness: 0.6 });
    const orn = c.canvasTex(1024, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2cf72'); gr.addColorStop(0.5, '#a47820'); gr.addColorStop(1, '#e2bb5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(70,40,5,.75)'; g.lineWidth = 5; g.strokeRect(4, 10, w - 8, h - 20);
      for (let i = 0; i < 4; i++) { const x = i * 256; g.beginPath(); g.moveTo(x + 20, 34); g.quadraticCurveTo(x + 128, 120, x + 236, 34); g.stroke(); g.beginPath(); g.arc(x + 128, 52, 16, 0, 7); g.stroke(); g.beginPath(); g.arc(x + 128, 52, 6, 0, 7); g.fillStyle = 'rgba(70,40,5,.8)'; g.fill(); }
    }); orn.wrapS = THREE.RepeatWrapping;
    const parM = new THREE.MeshStandardMaterial({ map: orn, metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide });

    // ---------- the drum: wall segments between the four arches, the dome, the floor ----------
    const ARCH = [{ th: 0, half: 18.5 }, { th: 90, half: 9.5 }, { th: 180, half: 9.5 }, { th: 270, half: 9.5 }];
    const SEG = [[18.5, 80.5], [99.5, 170.5], [189.5, 260.5], [279.5, 341.5]];
    for (const [a, b] of SEG) { const g = new THREE.CylinderGeometry(RW, RW, WH, 48, 18, true, Math.PI - b * D2R, (b - a) * D2R); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * RW * (b - a) * D2R / 1.6, uv.getY(i) * WH / 1.6); const m = new THREE.Mesh(g, wallM); m.position.y = WH / 2; c.add(m); }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(RW + 0.05, 64, 24, 0, Math.PI * 2, 0, H), domeM); dome.scale.y = 0.6; dome.position.y = WH; c.add(dome);
    const corn = new THREE.Mesh(new THREE.RingGeometry(RW - 0.9, RW + 0.3, 96).rotateX(H), gilt); corn.position.y = WH; c.add(corn);
    const cornLip = new THREE.Mesh(new THREE.TorusGeometry(RW - 0.9, 0.1, 8, 128).rotateX(H), gilt); cornLip.position.y = WH - 0.05; c.add(cornLip);
    {
      const fg = new THREE.CircleGeometry(RW + 0.4, 72).rotateX(-H), uv = fg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * (RW + 0.4) / 2.2, uv.getY(i) * 2 * (RW + 0.4) / 2.2);
      c.add(new THREE.Mesh(fg, c.surf('terrazzo', 2.2, { tint: 0x9c3c4e })));
      // the floor medallion under the chandelier: contour rings, cobalt and pink, inlaid
      const ringM = [new THREE.MeshBasicMaterial({ color: 0x2962ff, toneMapped: false }), new THREE.MeshBasicMaterial({ color: 0xff2e63, toneMapped: false })];
      for (let k = 0; k < 7; k++) { const r = 1.0 + k * 0.42 + Math.sin(k * 1.7) * 0.08; const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.035, 96).rotateX(-H), ringM[k % 2]); m.position.y = 0.006; c.add(m); }
      const rim = new THREE.Mesh(new THREE.RingGeometry(9.0, 9.12, 128).rotateX(-H), gilt); rim.position.y = 0.006; c.add(rim);
    }
    // the outside, for the odd glance past a plate edge
    c.add(new THREE.Mesh(new THREE.SphereGeometry(80, 24, 12), new THREE.MeshBasicMaterial({ color: 0x14030a, side: THREE.BackSide, fog: false })));
    // the wall colliders: a 36 sided ring
    for (let i = 0; i < 36; i++) { const [x1, z1] = P(i * 10, 10.45), [x2, z2] = P((i + 1) * 10, 10.45); c.wall(x1, z1, x2, z2); }

    // ---------- the arches: a flat face in each gap, with its opening ----------
    const archFace = (A, shape) => {
      const d = RW * Math.cos(A.half * D2R), w = 2 * RW * Math.sin(A.half * D2R) + 0.3, g = new THREE.Group(); const [x, z] = P(A.th, d); g.position.set(x, 0, z); g.rotation.y = -A.th * D2R; c.add(g);
      const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, WH + 0.2); sh.lineTo(-w / 2, WH + 0.2); sh.lineTo(-w / 2, 0);
      if (shape.circle) { const hp = new THREE.Path(); hp.absarc(0, shape.y, shape.r, 0, Math.PI * 2, true); sh.holes.push(hp); }
      let geo;
      if (shape.arch) { const s2 = new THREE.Shape(); const aw = shape.w; s2.moveTo(-w / 2, 0); s2.lineTo(-aw / 2, 0); s2.lineTo(-aw / 2, shape.ys); s2.absarc(0, shape.ys, aw / 2, Math.PI, 0, true); s2.lineTo(aw / 2, 0); s2.lineTo(w / 2, 0); s2.lineTo(w / 2, WH + 0.2); s2.lineTo(-w / 2, WH + 0.2); s2.lineTo(-w / 2, 0); geo = new THREE.ShapeGeometry(s2, 32); }
      else geo = new THREE.ShapeGeometry(sh, 48);
      const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.6, uv.getY(i) / 1.6);
      g.add(new THREE.Mesh(geo, flatM));
      // the gilt frame round the opening
      const pts = [];
      if (shape.circle) for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * (shape.r + 0.08), shape.y + Math.sin(a) * (shape.r + 0.08), 0.06)); }
      else { const aw = shape.w / 2 + 0.12; pts.push(new THREE.Vector3(-aw, 0, 0.06)); for (let i = 0; i <= 24; i++) { const a = Math.PI - i / 24 * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * aw, shape.ys + Math.sin(a) * aw, 0.06)); } pts.push(new THREE.Vector3(aw, 0, 0.06)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, !!shape.circle), 120, 0.13, 10, !!shape.circle), gilt));
      return g;
    };
    // N: the proscenium, and beyond it the heart itself (the depth plate), between two velvet curtains
    const stageA = archFace(ARCH[0], { arch: true, w: 6.4, ys: 3.4 });
    c.plate('p_heart', { x: 0, z: 2.5, zMin: 14, far: 48 });
    {
      const curtain = (side) => {
        const g = new THREE.PlaneGeometry(1, 6.9, 40, 24), p = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.5, y = p.getY(i) + 3.45, pinch = 1 - 0.68 * Math.exp(-Math.pow((y - 2.1) / 1.2, 2)), X = u * 2.1 * pinch, Z = 0.11 * Math.sin(u * 26 + y * 0.2) * (0.4 + 0.6 * pinch);
          p.setXYZ(i, side * (3.25 - X), y, Z); uv.setXY(i, u * 2.1 / 0.8, y / 0.8); }
        g.computeVertexNormals(); const m = new THREE.Mesh(g, seatM.clone()); m.material.side = THREE.DoubleSide; m.position.z = 0.25; stageA.add(m);
      };
      curtain(-1); curtain(1);
      const vg = new THREE.PlaneGeometry(7.0, 1.1, 60, 6), vp = vg.attributes.position; for (let i = 0; i < vp.count; i++) { const x = vp.getX(i); vp.setY(i, vp.getY(i) - 0.25 * Math.abs(Math.sin(x * 1.35))); vp.setZ(i, 0.08 * Math.sin(x * 9)); } vg.computeVertexNormals();
      const val = new THREE.Mesh(vg, seatM.clone()); val.material.side = THREE.DoubleSide; val.position.set(0, 6.55, 0.3); stageA.add(val);
      const title = c.sign('THE HEART', { w: 3.2, h: 0.55, bg: null, fg: '#f2cf72', font: c.SERIF, weight: 800, px: 160, glow: 10 }); title.position.set(0, 7.5, 0.12); stageA.add(title);
      // the stage itself, with footlights and a lip that drips
      const stM = new THREE.MeshStandardMaterial({ color: 0x3a1a10, roughness: 0.5 });
      c.box(6.6, 0.9, 3.4, stM, 0, 0.45, -8.85);
      c.box(6.7, 0.08, 0.12, gilt, 0, 0.9, -7.12, { collide: false });
      const skirt = c.slab(6.6, 0.82, 0.04, seatM, 0, 0.42, -7.13); c.add(skirt);
      const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false }), 22), m4 = new THREE.Matrix4();
      for (let i = 0; i < 22; i++) { m4.makeTranslation(-3.15 + i * 0.3, 0.95, -7.22); bulbs.setMatrixAt(i, m4); } c.add(bulbs);
    }
    // E: the valve to the wing, three cusps that open with the beat. S: back to the crop. W: a valve that never opens.
    const valve = (A, { to, tunnel, glowCol, label, closed }) => {
      const g = archFace(A, { circle: true, r: 1.6, y: 1.7 });
      const cusps = [], cm = new THREE.MeshPhysicalMaterial({ color: 0xe88aa0, roughness: 0.4, sheen: 1, sheenColor: new THREE.Color(0xffd0dc), side: THREE.DoubleSide, emissive: 0x401018, emissiveIntensity: 0.5 });
      const seamM = new THREE.MeshBasicMaterial({ color: 0x5a0c1e });
      for (let i = 0; i < 3; i++) {
        const mid = H + i * Math.PI * 2 / 3, sg = new THREE.CircleGeometry(1.62, 24, mid - Math.PI / 3, Math.PI * 2 / 3), p = sg.attributes.position;
        for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), r = Math.hypot(x, y); p.setZ(k, -0.35 * (1 - r / 1.62) * (r / 1.62) * 2); }
        const piv = [Math.cos(mid) * 1.62, Math.sin(mid) * 1.62]; sg.translate(-piv[0], -piv[1], 0); sg.computeVertexNormals();
        const pv = new THREE.Group(); pv.position.set(piv[0], 1.7 + piv[1], -0.02); g.add(pv); const m = new THREE.Mesh(sg, cm); pv.add(m);
        const seam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.62, 0.02).translate(0, 0.81, 0), seamM); seam.position.set(Math.cos(mid) * 1.62 - piv[0], Math.sin(mid) * 1.62 - piv[1], 0.01); seam.position.set(-piv[0], -piv[1], 0.005); seam.rotation.z = mid + Math.PI / 3 - H; pv.add(seam);
        cusps.push({ pv, axis: new THREE.Vector3(-Math.sin(mid), Math.cos(mid), 0) });
      }
      // the passage beyond, a short tube of the next room's colour with its light at the end
      const tun = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 3, 32, 1, true), tunnel); tun.rotation.x = H; tun.position.set(0, 1.7, -1.5); tun.material.side = THREE.BackSide; g.add(tun);
      const end = new THREE.Mesh(new THREE.CircleGeometry(1.62, 32), new THREE.MeshBasicMaterial({ color: glowCol, toneMapped: false })); end.position.set(0, 1.7, -2.95); g.add(end);
      if (label) { const s = c.sign(label, { w: 2.6, h: 0.32, bg: null, fg: '#f2cf72', font: c.SERIF, weight: 700, px: 128 }); s.position.set(0, 3.85, 0.1); g.add(s); }
      const [dx, dz] = P(A.th, 10.0); const door = to ? c.door({ x: dx, z: dz, r: 0.8, to, at: to === 'crop' ? [0, -29.6, Math.PI] : undefined, off: !!closed }) : null;
      return { g, cusps, door, closed };
    };
    const VE = valve(ARCH[1], { to: 'wing', tunnel: c.surf('feather', 1.5, { tint: 0x8fb8ff, params: { emissive: 0x0a3a6a, emissiveIntensity: 0.8 } }).clone(), glowCol: 0x9fe8ff, label: 'TO THE WING' });
    VE.door.off = true;
    const VS = valve(ARCH[2], { to: 'crop', tunnel: c.surf('crop', 2, { tint: 0xffb8c8, params: { emissive: 0x401018, emissiveIntensity: 0.6 } }).clone(), glowCol: 0xff6f8f, label: 'BACK TO THE CROP' });
    const VW = valve(ARCH[3], { tunnel: flatM.clone(), glowCol: 0x6f23a8, label: 'TRICUSPID. STAFF ONLY.', closed: true });
    c.click(VW.g, () => c.egg('heart_tricuspid', 'Staff only. The staff is a ventricle. It has been working without a break since the pigeon hatched.'), 'Staff only');

    // ---------- the tiers of boxes ----------
    const TY = [3.0, 5.3, 7.6], rnd = seeded(21);
    const divG = new THREE.BoxGeometry(0.1, 2.1, 1.0), divs = [], lamps = [], seatsBox = [], drips = [];
    const BOXART = [135, 225];
    const WALLART = [32, 50, 68, 115, 135, 155, 205, 225, 245, 292, 310, 328];
    for (const [a0, b0] of SEG) {
      const a = a0 + 1.5, b = b0 - 1.5, len = (b - a) * D2R;
      TY.forEach((y, k) => {
        const fl = new THREE.Mesh(new THREE.RingGeometry(9.95, RW, 24, 1, H - b * D2R, len).rotateX(-H), dark); fl.material.side = THREE.DoubleSide; fl.position.y = y; c.add(fl);
        const pg = new THREE.CylinderGeometry(9.95, 9.95, 0.95, 32, 1, true, Math.PI - b * D2R, len), puv = pg.attributes.uv; for (let i = 0; i < puv.count; i++) puv.setX(i, puv.getX(i) * 9.95 * len / 1.4);
        const par = new THREE.Mesh(pg, parM); par.position.y = y + 0.475; c.add(par);
        const rail = new THREE.Mesh(new THREE.TorusGeometry(9.95, 0.055, 6, 48, len).rotateX(-H).rotateY(H - b * D2R), gilt); rail.position.y = y + 0.97; c.add(rail);
        const n = Math.max(2, Math.round((b - a) / 12)), step = (b - a) / n;
        for (let i = 0; i <= n; i++) divs.push([a + i * step, y]);
        for (let i = 0; i < n; i++) {
          const th = a + (i + 0.5) * step;
          const art = k === 0 && BOXART.some((q) => Math.abs(q - th) < step / 2);
          if (!art) lamps.push([th, y + 1.75]);
          if (!art && rnd() < 0.72) seatsBox.push([th + (rnd() - 0.5) * step * 0.4, y]);
          if (!art && rnd() < 0.5) seatsBox.push([th + (rnd() - 0.5) * step * 0.6, y]);
        }
        // paint, running off the parapets; never down in front of a painting
        for (let i = 0; i < Math.round((b - a) / 3); i++) { const th = a + rnd() * (b - a); if (k === 0 && WALLART.some((q) => Math.abs(q - th) < 6.5)) continue; drips.push([th, y, k === 0 ? 0.12 + rnd() * 0.25 : 0.2 + rnd() * 0.9]); }
      });
    }
    {
      const im = new THREE.InstancedMesh(divG, gilt, divs.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      divs.forEach(([th, y], i) => { const [x, z] = P(th, 10.47); m4.compose(new THREE.Vector3(x, y + 1.05, z), q.setFromAxisAngle(up, -th * D2R), new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); }); c.add(im);
      const lm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc890, toneMapped: false }), lamps.length);
      lamps.forEach(([th, y], i) => { const [x, z] = P(th, 10.8); m4.makeTranslation(x, y, z); lm.setMatrixAt(i, m4); }); c.add(lm);
      // the audience in the boxes: New Yorkers, every one with an Open Eye Flower for a head
      const bodyM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.19, 0.42, 4, 8), bodyM, seatsBox.length), coats = [0x06163a, 0x1b1d2a, 0xbe854c, 0x2962ff, 0xf0f4f8, 0x6f23a8, 0x3a1a10].map((h) => new THREE.Color(h));
      const ecv = document.createElement('canvas'); ecv.width = ecv.height = 256; c.eyeFlower(ecv.getContext('2d'), 128, 128, 120, { iris: '#ff2e63' }); const et = new THREE.CanvasTexture(ecv); et.colorSpace = THREE.SRGBColorSpace;
      const heads = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: et, alphaTest: 0.4, side: THREE.DoubleSide }), seatsBox.length);
      S.aud = seatsBox.map(([th, y], i) => { const [x, z] = P(th, 10.45); m4.makeTranslation(x, y + 0.95, z); body.setMatrixAt(i, m4); body.setColorAt(i, coats[i % coats.length]); return { p: new THREE.Vector3(x, y + 1.6, z), th }; });
      c.add(body); c.add(heads); S.heads = heads;
      // 2026-10-28: the audience is the cast, hips up, an eye flower modelled into every head, one InstancedMesh per
      // character; the capsules and the flat heads stay until it lands. The whole body turns to you when the room flushes.
      audience(c, ['actress_upper', 'gown_upper', 'loretta_upper', 'editor_upper', 'discoking_upper', 'hustler_upper'], S.aud.map((a) => ({ x: a.p.x, y: a.p.y - 1.6, z: a.p.z })), { hip: 0.85, done: (list) => {
        const q0 = new THREE.Quaternion(), up0 = new THREE.Vector3(0, 1, 0), s0 = new THREE.Vector3();
        list.forEach((cr, i) => { const a = S.aud[i]; q0.setFromAxisAngle(up0, Math.atan2(-a.p.x, -a.p.z)); m4.compose(cr.base, q0, s0.setScalar(cr.k)); cr.mesh.setMatrixAt(cr.idx, m4); });
        S.crowdMeshes = [...new Set(list.map((cr) => cr.mesh))]; S.crowdMeshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
        body.visible = false; heads.visible = false; S.crowd = list;
      } });
      const pm = [new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.2, clearcoat: 1, emissive: 0xff2e63, emissiveIntensity: 0.25 }), new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.2, clearcoat: 1, emissive: 0x6f23a8, emissiveIntensity: 0.25 })];
      const dg = new THREE.LatheGeometry([0, 0.2, 0.5, 0.75, 0.88, 0.96, 1].map((t, i) => new THREE.Vector2(i === 6 ? 0.001 : t < 0.75 ? 0.035 * (1 - t * 0.4) : 0.05 * Math.sin((t - 0.75) / 0.25 * Math.PI) + 0.012, -t)), 8);
      const dm = pm.map((m) => new THREE.InstancedMesh(dg, m, drips.length)), cnt = [0, 0];
      drips.forEach(([th, y, l], i) => { const k = i % 3 === 0 ? 1 : 0, [x, z] = P(th, 9.93); m4.compose(new THREE.Vector3(x, y + 0.02, z), new THREE.Quaternion(), new THREE.Vector3(1, l, 1)); dm[k].setMatrixAt(cnt[k]++, m4); });
      dm.forEach((m, k) => { m.count = cnt[k]; c.add(m); });
    }

    // ---------- the veins: neon tubes up the walls, over the dome, to the chandelier ----------
    const veinM = [new THREE.MeshBasicMaterial({ color: 0xff2e63, toneMapped: false }), new THREE.MeshBasicMaterial({ color: 0x8a3ad0, toneMapped: false })];
    const VB = [new THREE.Color(0xff2e63), new THREE.Color(0x8a3ad0)];
    [41, 59, 77, 103, 125, 145, 167, 193, 215, 235, 257, 283, 301, 319, 338, 22].forEach((t0, i) => {
      const pts = [], ph = i * 1.7, sw = (i % 2 ? 1 : -1);
      for (let k = 0; k <= 14; k++) {
        const u = k / 14;
        if (u <= 0.5) { const y = 0.25 + u * 2 * (WH - 0.25), wig = y < 2.7 ? 0 : Math.sin(y * 0.9 + ph) * 3.2 * Math.min(1, (y - 2.7) / 1.5); const [x, z] = P(t0 + wig, 10.68); pts.push(new THREE.Vector3(x, y, z)); }
        else { const e = (u - 0.5) * 2 * 74 * D2R, th = t0 + sw * Math.sin(e * 1.4 + ph) * 14 + sw * e * 20, rr = (RW - 0.4) * Math.cos(e); const [x, z] = P(th, rr); pts.push(new THREE.Vector3(x, WH + (RW - 0.4) * 0.6 * Math.sin(e), z)); }
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, i % 3 === 0 ? 0.08 : 0.055, 6), veinM[i % 2]); c.add(tube);
    });
    // a ring vein round the base of the dome
    c.add(new THREE.Mesh(new THREE.TorusGeometry(RW - 1.0, 0.05, 6, 160).rotateX(H), veinM[0])).position.y = WH - 0.18;

    // ---------- the chandelier of light ----------
    const CH = new THREE.Vector3(0, 7.4, 0);
    const chand = new THREE.Group(); chand.position.copy(CH); c.add(chand);
    c.glb('ph_Chandelier_02', { h: 3.0, y: -1.6, parent: chand, emissive: [0xffb070, 0.35] });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff0d8, toneMapped: false })); chand.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.canvasTex(128, 128, (q) => { const g = q.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,180,.9)'); g.addColorStop(0.4, 'rgba(255,90,120,.35)'); g.addColorStop(1, 'rgba(255,40,90,0)'); q.fillStyle = g; q.fillRect(0, 0, 128, 128); }), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    halo.scale.set(4.5, 4.5, 1); chand.add(halo);
    const crysM = new THREE.MeshBasicMaterial({ color: 0xffe6f0, toneMapped: false }), crys = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.07, 0), crysM, 96);
    { const m4 = new THREE.Matrix4(); for (let i = 0; i < 96; i++) { const ring = i % 3, a = i / 96 * Math.PI * 2 * 3 + ring, r = 1.0 + ring * 0.5; m4.compose(new THREE.Vector3(Math.cos(a) * r, -0.5 - ring * 0.35 - (i % 2) * 0.12, Math.sin(a) * r), new THREE.Quaternion(), new THREE.Vector3(1, 1.8, 1)); crys.setMatrixAt(i, m4); } }
    chand.add(crys);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 6), gilt); chain.position.set(0, CH.y + 1.4 + 4, 0); c.add(chain);

    // ---------- the New Yorkers: twelve round the walls at eye height, two in the first tier of boxes ----------
    const pieces = c.art(14), hung = [];
    WALLART.forEach((th, i) => { const p = pieces[i]; if (!p) return; const [x, z] = P(th, 10.72); hung.push(c.hang(p, x, 1.62, z, -th * D2R, 1.4, 'gilt', { light: true })); });
    BOXART.forEach((th, i) => { const p = pieces[12 + i]; if (!p) return; const [x, z] = P(th, 10.6); hung.push(c.hang(p, x, 4.65, z, -th * D2R, 0.9, 'gilt', { light: true, label: false })); });

    // ---------- the stalls: red velvet seats in curved rows facing the stage, programmes on the seats ----------
    {
      const F = [0, -11], seats = [];
      for (let k = 0; k < 8; k++) { const r = 7.6 + k * 1.05, n = Math.ceil(r * 1.6 / 0.62);
        for (let i = -n; i <= n; i++) { const a = i * 0.62 / r, x = F[0] + Math.sin(a) * r, z = F[1] + Math.cos(a) * r;
          if (Math.abs(x) < 0.85 || Math.hypot(x, z) > 8.5 || z > 5.0 || z < -5.6) continue; seats.push([x, z, Math.atan2(F[0] - x, F[1] - z)]); } }
      const cush = new THREE.BoxGeometry(0.52, 0.14, 0.5).translate(0, 0.45, 0), back = new THREE.BoxGeometry(0.52, 0.66, 0.1).rotateX(-0.12).translate(0, 0.82, -0.25);
      const sideG = c.merge([new THREE.BoxGeometry(0.05, 0.62, 0.5).translate(-0.285, 0.33, -0.02), new THREE.BoxGeometry(0.05, 0.62, 0.5).translate(0.285, 0.33, -0.02)]);
      const vel = new THREE.InstancedMesh(c.merge([cush, back]), seatM, seats.length), sides = new THREE.InstancedMesh(sideG, gilt, seats.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      const progT = c.canvasTex(256, 360, (g, w, h) => {
        g.fillStyle = '#f2ead8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8902e'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
        g.fillStyle = '#7a0f24'; g.textAlign = 'center'; g.font = `600 22px ${c.MONO}`; g.fillText('TONIGHT:', w / 2, 62); g.font = `800 34px ${c.SERIF}`; g.fillText('CIRCULATION', w / 2, 106);
        g.font = `italic 400 18px ${c.SERIF}`; g.fillText('an opera in two chambers', w / 2, 140); c.eyeFlower(g, w / 2, 230, 62, { iris: '#ff2e63' });
        g.font = `600 15px ${c.MONO}`; g.fillText('NO INTERMISSION', w / 2, 330);
      });
      const progs = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.28).rotateX(-H), new THREE.MeshStandardMaterial({ map: progT, roughness: 0.7, emissive: 0xffffff, emissiveMap: progT, emissiveIntensity: 0.25 }), seats.length);
      let np = 0;
      seats.forEach(([x, z, ry], i) => { q.setFromAxisAngle(up, ry); m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 1, 1)); vel.setMatrixAt(i, m4); sides.setMatrixAt(i, m4);
        c.post(x, z, 0.27);
        if (i % 3 === 1) { m4.compose(new THREE.Vector3(x + Math.sin(ry) * 0.05, 0.525, z + Math.cos(ry) * 0.05), new THREE.Quaternion().setFromAxisAngle(up, ry + (rnd() - 0.5) * 0.8), new THREE.Vector3(1, 1, 1)); progs.setMatrixAt(np++, m4); } });
      progs.count = np; c.add(vel); c.add(sides); c.add(progs);
      c.click(progs, () => c.egg('heart_programme', 'TONIGHT: CIRCULATION. Running time, one lifetime. No intermission. Latecomers are seated between beats.'), 'A programme');
      // opera glasses left on a front row seat
      const sc = (s) => Math.hypot(s[0], s[1] + 11) * 10 + Math.abs(s[0]), fr = seats.reduce((m, s) => (sc(s) < sc(m) ? s : m), seats[0]);
      const bin = c.glb('ph_binoculars', { len: 0.2, x: fr[0], y: 0.53, z: fr[1], ry: fr[2] });
      c.click(bin, () => c.egg('heart_glasses', 'Opera glasses. Everyone in the boxes is looking at you through theirs. You are the opera.'), 'Opera glasses');
      S.seats = seats.length;
    }

    // ---------- the usher: the room's one Open Eye Flower that watches, and the one who lets you through ----------
    const ush = new THREE.Group(); { const [ux, uz] = P(101, 8.7); ush.position.set(ux, 0, uz); ush.rotation.y = Math.atan2(-ux, -uz); } c.add(ush);
    {
      const red = new THREE.MeshStandardMaterial({ color: 0x7a0f24, roughness: 0.6 }), blk = new THREE.MeshStandardMaterial({ color: 0x111018, roughness: 0.7 });
      const cap = (r, h, m, x, y, z) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 10), m); o.position.set(x, y, z); ush.add(o); return o; };
      cap(0.075, 0.66, blk, -0.1, 0.42, 0); cap(0.075, 0.66, blk, 0.1, 0.42, 0); cap(0.21, 0.5, red, 0, 1.15, 0); cap(0.06, 0.5, red, -0.27, 1.12, 0.05).rotation.z = 0.15; const arm = cap(0.06, 0.5, red, 0.27, 1.2, 0.18); arm.rotation.x = -1.1;
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), gilt); b.position.set(0.0, 0.95 + i * 0.13, 0.21); ush.add(b); }
      const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 10), blk); torch.position.set(0.28, 1.02, 0.42); torch.rotation.x = -1.1; ush.add(torch);
      const hcv = document.createElement('canvas'); hcv.width = hcv.height = 256; const ht = new THREE.CanvasTexture(hcv); ht.colorSpace = THREE.SRGBColorSpace;
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht })); head.scale.set(0.6, 0.6, 1); head.position.y = 1.8; ush.add(head);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 16), red); hat.position.set(0, 2.14, 0); ush.add(hat);
      // 2026-10-28: the Maitre d' from the cast, whole (white dinner jacket, front of house, his own eye flower); the drawn head
      // and the capsules hide. Not the Usher: that model stops above the knee
      rigged(c, ush, 'maitre', { h: 1.8, hide: ush.children.slice(), near: 7, body: 0.6 });   // rigged: the usher's eyes follow you again
      const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 24).rotateX(H), gilt); hatBand.position.set(0, 2.1, 0); ush.add(hatBand);
      S.ush = { head, hcv, ht, look: [0, 0], lid: 0 };
      c.post(ush.position.x, ush.position.z, 0.35);
      const lines = ['Your seat is every seat. Please keep your pulse to yourself.', 'The wing is through the valve. It opens when you hurry.', 'No flash photography. The chandelier is shy.'];
      let k = 0; c.click(ush, () => { c.say(head, lines[k++ % lines.length]); c.egg('heart_usher', 'The usher: "Your seat is every seat. Please keep your pulse to yourself."'); }, 'The usher');
    }
    // ---------- signage, a marquee, a few stickers (mlow and eye only, sparing) ----------
    {
      const mq = c.sign('TONIGHT: CIRCULATION\nan opera in two chambers', { w: 3.0, h: 0.62, bg: '#06163a', fg: '#ff9fb8', font: c.SERIF, weight: 700, px: 160, glow: 8, border: '#f2cf72' });
      const [x, z] = P(180, 10.3); mq.position.set(x, 4.55, z); mq.rotation.y = Math.PI; c.add(mq);
      const G = window.STICKER_GROUPS || {}, pool = [...(G.mlow || []).slice(0, 12), ...(G.eye || []).slice(30, 50)], r2 = seeded(5); let k = 0;
      const put = (x, y, z, ry, n, sp) => { for (let i = 0; i < n; i++) c.sticker(pool[(k++ * 5) % pool.length], x + Math.cos(ry) * (r2() - 0.5) * sp, y + (r2() - 0.5) * sp * 0.5, z - Math.sin(ry) * (r2() - 0.5) * sp, { ry, size: 0.12 + r2() * 0.08 }); };
      put(-2.2, 0.45, -7.08, 0, 4, 0.8); put(2.4, 0.5, -7.08, 0, 3, 0.7);
      put(-2.6, 0.5, 8.88, Math.PI, 2, 0.3); put(2.6, 0.6, 8.88, Math.PI, 3, 0.3);
    }
    // the marble bust of the aorta, the mantel clock that keeps no time, both by the way in
    c.glb('ph_marble_bust_01', { h: 0.9, x: -2.6, y: 1.1, z: 9.2, ry: Math.PI - 0.3 }); c.box(0.6, 1.1, 0.6, new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.4 }), -2.6, 0.55, 9.2);
    { const s = c.sign('THE AORTA\nwho never sat down', { w: 0.6, h: 0.18, bg: '#f2ead8', fg: '#2a1a06', font: c.SERIF, weight: 600, px: 96 }); s.position.set(-2.6, 0.75, 8.89); s.rotation.y = Math.PI; c.add(s); }
    c.glb('ph_mantel_clock_01', { h: 0.42, x: 2.6, y: 1.1, z: 9.2, ry: Math.PI + 0.3 }); c.box(0.6, 1.1, 0.6, new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.4 }), 2.6, 0.55, 9.2);

    // ---------- light ----------
    const B = { beat: 0, bpm: 56, phase: 0, flush: 0, gaze: 0, spd: 0, last: null };
    S.B = B;
    c.light(CH.x, CH.y - 0.4, CH.z, 0xffcfa8, 26, 24, () => 0.75 + B.beat * 0.9 + B.flush * 0.4);
    c.light(0, 5.5, -6.2, 0xffd8b0, 14, 12);
    c.light(...(() => { const [x, z] = P(60, 7); return [x, 3.4, z]; })(), 0xff2e63, 10, 12, () => 0.7 + B.beat * 0.8 + B.flush);
    c.light(...(() => { const [x, z] = P(300, 7); return [x, 3.4, z]; })(), 0xff2e63, 10, 12, () => 0.7 + B.beat * 0.8 + B.flush);
    c.light(0, 3.2, 6.4, 0xff9fb8, 9, 11);
    c.light(11.9, 1.8, 0, 0x9fe8ff, 5, 6, () => 0.3 + (S.veOpen || 0));

    // ---------- the pulse ----------
    const fwd = new THREE.Vector3(), to = new THREE.Vector3(), chW = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), one = new THREE.Vector3(1, 1, 1);
    const base = { ...R.post }; let drawT = 0, blinkAt = 2;
    const tint = new THREE.Color();
    c.tick((t, dt, me) => {
      // 1. your speed over the floor
      if (B.last) { const v = Math.hypot(me.x - B.last[0], me.z - B.last[1]) / Math.max(1e-3, dt); if (v < 20) B.spd += (v - B.spd) * Math.min(1, dt * 3); }
      B.last = [me.x, me.z];
      // 2. the gaze test: is the chandelier in the middle of your view?
      c.camera.getWorldDirection(fwd); chW.copy(CH); chW.x += R.x0; to.copy(chW).sub(c.camera.position).normalize();
      const dot = fwd.dot(to);
      if (dot > 0.965) B.gaze += dt; else B.gaze = Math.max(0, B.gaze - dt * 3);
      const flushOn = B.gaze >= 3 || (B.flush > 0.5 && dot > 0.9);
      if (flushOn && B.flush < 0.5 && !B.toldFlush) { B.toldFlush = true; c.toast('Do not stare at the chandelier. It makes the heart race.', 3800); }
      B.flush += ((flushOn ? 1 : 0) - B.flush) * Math.min(1, dt * (flushOn ? 2.5 : 1.5));
      // 3. the tempo: resting at 52, racing when you run, doubled by the stare
      const target = Math.min(210, (52 + Math.min(6.5, B.spd) * 14) * (1 + B.flush));
      B.bpm += (target - B.bpm) * Math.min(1, dt * (target > B.bpm ? 1.4 : 0.5));
      B.phase += dt * B.bpm / 60;
      if (B.phase >= 1) { B.phase -= 1; c.sound.thump(Math.min(0.9, 0.28 + B.bpm / 260)); }
      // lub, then dub
      const ph = B.phase, lub = Math.exp(-ph * 16), dub = ph > 0.2 ? 0.65 * Math.exp(-(ph - 0.2) * 18) : 0; B.beat = Math.max(lub, dub);
      const b = B.beat;
      U.uBeat.value = b * (1 + B.flush * 0.5);
      for (let k = 0; k < 2; k++) veinM[k].color.copy(VB[k]).multiplyScalar(0.55 + b * 2.2 + B.flush * 0.8);
      chand.scale.setScalar(1 + b * 0.07 + B.flush * 0.05); core.material.color.setRGB(1, 0.94 - B.flush * 0.5, 0.85 - B.flush * 0.6).multiplyScalar(1 + b * 1.5); halo.material.opacity = 0.6 + b * 0.4;
      crysM.color.setRGB(1, 0.9 - B.flush * 0.4, 0.94 - B.flush * 0.5).multiplyScalar(0.8 + b * 1.8);
      for (const g of hung) g.scale.setScalar(1 + b * 0.012);
      // the room's look: a red flush on the screen pass
      tint.setRGB(1, 1 - B.flush * 0.42, 1 - B.flush * 0.48); R.post.tint = tint.getHex(); R.post.sat = base.sat + B.flush * 0.3; R.post.dream = base.dream + B.flush * 0.25 + b * 0.05; R.post.bloom = base.bloom + b * 0.25 + B.flush * 0.3;
      // 4. the valves: they flap with every beat, and the wing valve opens wide for anyone in a hurry or close by
      const [vx, vz] = P(90, 10); const near = Math.hypot(me.x - vx, me.z - vz) < 4.2 ? 1 : 0;
      const ve = Math.max(b * 0.45, B.bpm > 88 ? 1 : 0, near); S.veOpen = (S.veOpen || 0) + (ve - (S.veOpen || 0)) * Math.min(1, dt * 6);
      VE.cusps.forEach((C) => C.pv.quaternion.setFromAxisAngle(C.axis, -S.veOpen * 1.25)); VE.door.off = S.veOpen < 0.6;
      VS.cusps.forEach((C) => C.pv.quaternion.setFromAxisAngle(C.axis, -0.2 - b * 0.45));
      VW.cusps.forEach((C) => C.pv.quaternion.setFromAxisAngle(C.axis, -b * 0.08));
      // 5. the boxes: the audience faces the stage, and turns to you when the room flushes
      if (S.heads) { const hd = S.heads; S.aud.forEach((a, i) => { const lx = me.x - a.p.x, lz = me.z - a.p.z, yawYou = Math.atan2(lx, lz), yawC = Math.atan2(-a.p.x, -a.p.z); let dy = yawYou - yawC; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        e.set(0, yawC + dy * B.flush, 0); q.setFromEuler(e); m4.compose(a.p, q, one.setScalar(1 + b * 0.06)); hd.setMatrixAt(i, m4);
        const cr = S.crowd && S.crowd[i]; if (cr) { m4.compose(cr.base, q, one.setScalar(cr.k * (1 + b * 0.03))); cr.mesh.setMatrixAt(cr.idx, m4); } }); hd.instanceMatrix.needsUpdate = true; one.set(1, 1, 1);
        if (S.crowdMeshes) S.crowdMeshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; }); }
      // 6. the usher watches you, and blinks
      const U2 = S.ush; if (U2 && t - drawT > 0.15) { drawT = t; const dx = me.x - ush.position.x, dz = me.z - ush.position.z, yaw = Math.atan2(dx, dz) - ush.rotation.y, lx = Math.max(-1, Math.min(1, Math.sin(yaw) * 1.4));
        let lid = 0; if (t > blinkAt) { lid = 1; if (t > blinkAt + 0.18) blinkAt = t + 2 + Math.random() * 4; }
        const g = U2.hcv.getContext('2d'); g.clearRect(0, 0, 256, 256); c.eyeFlower(g, 128, 128, 120, { iris: B.flush > 0.5 ? '#ff2e63' : '#2a6fd6', look: [lx, 0.25], lid }); U2.ht.needsUpdate = true; }
    });
  },
  onEnter(c) { if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('Stand still. Then run. Then look up at the chandelier, and keep looking.', 5200), 3800); } },
};
