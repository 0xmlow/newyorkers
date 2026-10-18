// III. THE PIGEON. Room 9: HALL OF FLIGHT (inside the wing)
// HEADLINE ILLUSION: gravity follows the wall. The hall is a feather lined tube 7 m across and 36 m long, and down is
// always the wall under your feet. Walk sideways and you climb the curve, cross what was the ceiling and come down the
// other side, upright the whole way. Mechanism (a non Euclidean wrap plus a gravity change): the engine walks you on a
// flat sheet as usual, but this room reads that sheet as the tube UNROLLED. The engine's x is arc length round the tube
// (wrapped by R.move so the sheet is a cylinder), its z is the tube's axis. After the engine places the camera,
// R.camera rolls the whole sheet back onto the tube: the eye goes to the inner surface at eye height, its up vector
// points at the axis, and the mouse look the engine computed is applied in that local frame, so yaw and pitch stay
// relative to the floor under you. Colliders live on the unrolled sheet (with copies a turn either side of the seam),
// and clicks work because the engine raycasts from the camera we set.
export default {
  id: 'wing', name: 'Hall of Flight', scale: 'III · The pigeon', sound: 'wing',
  kicker: 'Inside the wing. Down is wherever your feet are. Walk up the wall, across the ceiling, and keep going.',
  sky: 0x05081a, fog: 0x0b1236, fogD: 0.022, hemi: [0xa8b8ff, 0x3a2a40, 0.55], env: 0.55,
  post: { dream: 0.22, bloom: 0.85, vig: 0.42, grain: 0.1, ca: 0.0025 },
  spawn: [0, 15.2, 0],
  build(c) {
    const { THREE, R } = c;
    const V = THREE.Vector3;
    const RC = 3.5, L = 36, C = Math.PI * 2 * RC, S = R.state;
    // ---------- the tube's own geometry helpers ----------
    // a point on the inner surface at angle th (0 is the bottom), along the axis z, lifted off toward the axis by off
    const sp = (th, z, off = 0) => { const r = RC - off; return new V(r * Math.sin(th), RC - r * Math.cos(th), z); };
    const _mb = new THREE.Matrix4();
    // the local frame on the surface: x along the curve, y toward the axis, z along the tube
    const fq = (th, yaw = 0) => { const q = new THREE.Quaternion().setFromRotationMatrix(_mb.makeBasis(new V(Math.cos(th), Math.sin(th), 0), new V(-Math.sin(th), Math.cos(th), 0), new V(0, 0, 1))); if (yaw) q.multiply(new THREE.Quaternion().setFromAxisAngle(new V(0, 1, 0), yaw)); return q; };
    const place = (o, th, z, off = 0, yaw = 0) => { o.position.copy(sp(th, z, off)); o.quaternion.copy(fq(th, yaw)); return o; };
    // wrap a flat floor geometry (x across, y up off the floor, z along) onto the curved floor at (th0, z0)
    const wrap = (geo, th0, z0, off = 0) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const v = sp(th0 + p.getX(i) / RC, z0 + p.getZ(i), off + p.getY(i)); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); geo.computeBoundingSphere(); return geo; };
    const D = (d) => d * Math.PI / 180;
    // colliders on the unrolled sheet, three copies so the seam (on the old ceiling) never leaks
    const wallU = (u1, z1, u2, z2) => { for (const k of [-C, 0, C]) c.wall(u1 + k, z1, u2 + k, z2); };
    const postU = (u, z, r) => { for (const k of [-C, 0, C]) c.post(u + k, z, r); };
    const uOf = (th) => { let u = th * RC; u = ((u + C / 2) % C + C) % C - C / 2; return u; };

    // ---------- the tube: feathers, iridescent, lit from the axis ----------
    const feather = c.surf('feather', C / 10, { physical: true, params: { iridescence: 1, iridescenceIOR: 1.32, iridescenceThicknessRange: [160, 560], clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color(0x6f23a8), sheenRoughness: 0.5 } });
    {
      const g = new THREE.CylinderGeometry(RC, RC, L, 96, 12, true).rotateX(Math.PI / 2).translate(0, RC, 0);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 10, uv.getY(i) * L / (C / 10));
      const tube = new THREE.Mesh(g, feather); tube.material.side = THREE.BackSide; c.add(tube);
    }
    const bone = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.45, metalness: 0.05 });
    const copper = new THREE.MeshStandardMaterial({ color: 0xbe854c, roughness: 0.32, metalness: 1 });
    const navy = new THREE.MeshStandardMaterial({ color: 0x06163a, roughness: 0.38, metalness: 0.2 });
    const pinkM = new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.15, clearcoat: 1, emissive: 0xff2e63, emissiveIntensity: 0.25 });
    const violM = new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.15, clearcoat: 1, emissive: 0x6f23a8, emissiveIntensity: 0.3 });
    const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false });
    const cobaltGlow = new THREE.MeshBasicMaterial({ color: 0x2962ff, toneMapped: false });

    // quill rings every three metres: the shafts of the flight feathers you are walking between
    { const gs = []; for (let z = -15; z <= 15; z += 3) gs.push(new THREE.TorusGeometry(RC - 0.03, 0.055, 6, 120).translate(0, RC, z)); c.add(new THREE.Mesh(c.merge(gs), bone)); }
    // contour lines as geometry: helices that follow the tube, cyan one way, cobalt the other
    {
      const helix = (th0, turns, off) => new THREE.TubeGeometry(new (class extends THREE.Curve { getPoint(t, o = new V()) { return o.copy(sp(th0 + t * turns * Math.PI * 2, -L / 2 + 0.4 + t * (L - 0.8), off)); } })(), 520, 0.014, 5, false);
      const cy = [], co = [];
      for (let k = 0; k < 4; k++) { cy.push(helix(k * Math.PI / 2, 1.5, 0.01)); co.push(helix(k * Math.PI / 2 + 0.3, -1.5, 0.012)); }
      for (let k = 0; k < 4; k++) cy.push(helix(k * Math.PI / 2 + 0.12, 1.5, 0.01));
      c.add(new THREE.Mesh(c.merge(cy), cyanGlow)); c.add(new THREE.Mesh(c.merge(co), cobaltGlow));
    }

    // ---------- the lights: four down the axis, so every side of the tube is lit the same, which is the point ----------
    for (const z of [12, 4, -4, -12]) c.light(0, RC, z, 0xffe6cc, 5.5, 11);
    c.light(0, RC, -16.5, 0xff2e63, 7, 12, (t) => 0.8 + 0.2 * Math.sin(t * 1.3));
    c.light(0, RC, 16.5, 0x00e5ff, 4, 9, (t) => 0.85 + 0.15 * Math.sin(t * 0.7));

    // ---------- the paintings: sixteen New Yorkers on vanes standing out of every side, a spiral two and a half turns long ----------
    const art = c.art(16), styles = ['gilt', 'copper', 'bone', 'cobalt', 'steel', 'gilt', 'black', 'copper'];
    const G = window.STICKER_GROUPS || {}, pool = [...(G.museum || []), ...(G.eye || []).slice(0, 30), ...(G.mlow || []).slice(0, 16), ...(G.street || []).slice(0, 20)];
    let si = 0; const nextSticker = () => pool.length ? pool[(si++ * 7) % pool.length] : null;
    const panelGeos = [], trimGeos = [], dripP = [], dripV = [];
    const drip = (arr, m, x, y, z, len, r = 0.016) => { arr.push(new THREE.CapsuleGeometry(r, len, 3, 6).translate(x, y - len / 2, z).applyMatrix4(m), new THREE.SphereGeometry(r * 1.7, 8, 6).translate(x, y - len - r, z).applyMatrix4(m)); };
    const panels = [];
    art.forEach((p, i) => {
      const th = D(40 + i * 56.25), z = 12.5 - i * 1.75;
      const g = new THREE.Group(); place(g, th, z); c.add(g); g.updateMatrixWorld(true);
      const m = new THREE.Matrix4().compose(g.position, g.quaternion, new V(1, 1, 1));
      // the vane: a navy lacquer board with a copper edge and a quill along the top
      panelGeos.push(new THREE.BoxGeometry(1.7, 2.6, 0.08).translate(0, 1.22, 0).applyMatrix4(m));
      for (const [w, h, x, y] of [[0.05, 2.6, -0.87, 1.22], [0.05, 2.6, 0.87, 1.22], [1.79, 0.05, 0, 2.54]]) trimGeos.push(new THREE.BoxGeometry(w, h, 0.11).translate(x, y, 0).applyMatrix4(m));
      trimGeos.push(new THREE.CylinderGeometry(0.035, 0.012, 2.3, 8).rotateZ(Math.PI / 2).translate(0.1, 2.62, 0).applyMatrix4(m));
      // paint runs off the top lip, down the edges, never across the art
      for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) drip(k ? dripV : dripP, m, sx * (0.68 + k * 0.08 + Math.random() * 0.03), 2.52, 0.05, 0.25 + Math.random() * 0.9);
      for (let k = 0; k < 3; k++) drip(k % 2 ? dripP : dripV, m, -0.75 + Math.random() * 1.5, 2.52, -0.05, 0.3 + Math.random() * 1.2);
      c.hang(p, 0, 1.6, 0.045, 0, 1.25, styles[i % styles.length], { parent: g, light: true });
      // the back of every vane is a sticker wall, the way the back of every sign in the city is
      for (let k = 0; k < 8; k++) { const id = nextSticker(); if (id) c.sticker(id, -0.6 + Math.random() * 1.2, 0.35 + Math.random() * 1.9, -0.046, { ry: Math.PI, parent: g, size: 0.2 + Math.random() * 0.16 }); }
      const u = uOf(th); wallU(u - 0.87, z, u + 0.87, z);
      panels.push({ g, th, z });
    });
    c.add(new THREE.Mesh(c.merge(panelGeos), navy)); c.add(new THREE.Mesh(c.merge(trimGeos), copper));
    c.add(new THREE.Mesh(c.merge(dripP), pinkM)); c.add(new THREE.Mesh(c.merge(dripV), violM));

    // ---------- windows in the floor (and the walls, and the ceiling): the sky outside the wing, going by ----------
    const WINS = [[0, 7], [180, 1], [270, 11], [90, 4.5], [200, -11], [300, -2], [30, -6], [140, 14], [235, -15]];
    {
      const panes = [], frames = [];
      for (const [a, z] of WINS) {
        panes.push(wrap(new THREE.CircleGeometry(1, 40).scale(0.62, 1.0, 1).rotateX(-Math.PI / 2), D(a), z, 0.008));
        frames.push(wrap(new THREE.RingGeometry(1, 1.13, 48, 1).scale(0.62, 1.0, 1).rotateX(-Math.PI / 2), D(a), z, 0.014));
        frames.push(wrap(new THREE.RingGeometry(1.13, 1.2, 48, 1).scale(0.62, 1.0, 1).rotateX(-Math.PI / 2), D(a), z, 0.02));
      }
      c.add(new THREE.Mesh(c.merge(frames), copper));
      const mask = new THREE.Mesh(c.merge(panes)); c.add(mask);
      c.pocket({ mask, sheen: 0.12, build: (grp) => {
        // the sky: a long cylinder round the whole wing, painted from the dream window, scrolling past as the pigeon flies
        const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const q = cv.getContext('2d');
        const gr = q.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#0a1440'); gr.addColorStop(0.5, '#1d2a6a'); gr.addColorStop(1, '#3a1d5a'); q.fillStyle = gr; q.fillRect(0, 0, 2048, 1024);
        const skyT = new THREE.CanvasTexture(cv); skyT.colorSpace = THREE.SRGBColorSpace; skyT.wrapS = skyT.wrapT = THREE.RepeatWrapping; skyT.repeat.set(3, 1);
        const img = new Image(); img.onload = () => {
          // the frameless dream window: mirrored once so the sky wraps without a seam
          const sx = 0, sy = img.height * 0.05, sw = img.width, sh = img.height * 0.9;
          q.drawImage(img, sx, sy, sw, sh, 0, 0, 1024, 1024); q.save(); q.translate(2048, 0); q.scale(-1, 1); q.drawImage(img, sx, sy, sw, sh, 0, 0, 1024, 1024); q.restore();
          skyT.needsUpdate = true;
        }; img.src = 'assets/plates/p_dream_window2.jpg';
        const sg = new THREE.CylinderGeometry(40, 40, 400, 48, 1, true).rotateX(Math.PI / 2).translate(0, RC, 0);
        const sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, toneMapped: false, color: 0xb0b8e0 })); grp.add(sky); S.skyT = skyT;
        // clouds closer in, going by faster: parallax through glass
        const cT = c.canvasTex(256, 256, (q2) => { for (let k = 0; k < 14; k++) { const x = 60 + Math.random() * 136, y = 90 + Math.random() * 80, r = 30 + Math.random() * 50; const g2 = q2.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, 'rgba(210,220,255,.55)'); g2.addColorStop(1, 'rgba(210,220,255,0)'); q2.fillStyle = g2; q2.fillRect(0, 0, 256, 256); } });
        const cm = new THREE.MeshBasicMaterial({ map: cT, transparent: true, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide });
        S.clouds = [];
        for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 18; const m = new THREE.Mesh(new THREE.PlaneGeometry(8 + Math.random() * 10, 5 + Math.random() * 6), cm); m.position.set(Math.sin(a) * r, RC - Math.cos(a) * r, -60 + Math.random() * 120); m.lookAt(0, RC, m.position.z); m.userData.v = 3 + 9 / r * 4; grp.add(m); S.clouds.push(m); }
        // pigeons flying alongside, far off
        const bT = c.canvasTex(128, 64, (q2) => { q2.fillStyle = '#02040c'; q2.beginPath(); q2.moveTo(4, 30); q2.quadraticCurveTo(34, 6, 64, 32); q2.quadraticCurveTo(94, 6, 124, 30); q2.quadraticCurveTo(94, 22, 64, 40); q2.quadraticCurveTo(34, 22, 4, 30); q2.fill(); });
        const bm = new THREE.MeshBasicMaterial({ map: bT, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
        S.birds = []; for (let k = 0; k < 24; k++) { const a = Math.random() * Math.PI * 2, r = 9 + Math.random() * 12; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), bm); m.position.set(Math.sin(a) * r, RC - Math.cos(a) * r, -40 + Math.random() * 80); m.lookAt(0, RC, m.position.z); m.userData.ph = Math.random() * 6; grp.add(m); S.birds.push(m); }
      } });
      c.click(mask, () => c.toast('Do not open. The sky is on the other side, and from in here it is down.', 3600), 'A window');
    }

    // ---------- the ends ----------
    // near end: the cap, with the doorway back to the heart at the bottom
    { const cap = new THREE.Mesh(new THREE.CircleGeometry(RC + 0.02, 64), new THREE.MeshStandardMaterial({ color: 0x2a0c22, roughness: 0.6, emissive: 0x3a0820, emissiveIntensity: 0.4 })); cap.position.set(0, RC, L / 2); cap.rotation.y = Math.PI; c.add(cap);
      const rings = []; for (let k = 1; k <= 7; k++) rings.push(new THREE.RingGeometry(k * 0.47, k * 0.47 + 0.025, 64)); const rr = new THREE.Mesh(c.merge(rings), cobaltGlow); rr.position.set(0, RC, L / 2 - 0.02); rr.rotation.y = Math.PI; c.add(rr);
      const arch = c.canvasTex(256, 400, (q) => { const g2 = q.createRadialGradient(128, 260, 10, 128, 260, 240); g2.addColorStop(0, '#ff6a8c'); g2.addColorStop(0.5, '#a0123c'); g2.addColorStop(1, '#2a0010'); q.fillStyle = g2; q.beginPath(); q.moveTo(0, 400); q.lineTo(0, 128); q.arc(128, 128, 128, Math.PI, 0); q.lineTo(256, 400); q.fill(); });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.05), new THREE.MeshBasicMaterial({ map: arch, transparent: true, toneMapped: false })); door.position.set(0, 1.02, L / 2 - 0.04); door.rotation.y = Math.PI; c.add(door);
      const t1 = c.sign('BACK TO THE HEART', { w: 1.3, h: 0.16, bg: null, fg: '#ffd0dc', font: c.MONO, glow: 10, px: 96 }); t1.position.set(0, 2.25, L / 2 - 0.05); t1.rotation.y = Math.PI; c.add(t1);
      const t2 = c.sign('HALL OF FLIGHT', { w: 4.2, h: 0.6, bg: null, fg: '#f0f4f8', font: c.SERIF, weight: 600, glow: 14, px: 160 }); t2.position.set(0, 4.3, L / 2 - 0.05); t2.rotation.y = Math.PI; c.add(t2);
      const t3 = c.sign('III  THE PIGEON  ·  THE WING  ·  DOWN IS WHEREVER YOUR FEET ARE', { w: 4.6, h: 0.16, bg: null, fg: '#00e5ff', font: c.MONO, glow: 8, px: 80 }); t3.position.set(0, 3.75, L / 2 - 0.05); t3.rotation.y = Math.PI; c.add(t3);
      for (let k = 0; k < 14; k++) { const id = nextSticker(); const a = -1 + Math.random() * 2; if (id) c.sticker(id, (a < 0 ? -1 : 1) * (0.8 + Math.random() * 0.9), 0.4 + Math.random() * 1.7, L / 2 - 0.03, { ry: Math.PI, size: 0.16 + Math.random() * 0.12 }); }
    }
    // the fan on the near cap blows the wind down the wing (it is mounted where a fan should never be)
    { const holder = new THREE.Group(); holder.position.set(0, RC + 1.75, L / 2 - 0.05); holder.rotation.x = Math.PI / 2; c.add(holder);
      S.fan = c.glb('ph_ceiling_fan', { len: 1.4, parent: holder }); }
    // far end: the way on is a membrane, and in it the room's one Open Eye Flower, which watches you come
    {
      const lip = new THREE.Mesh(new THREE.TorusGeometry(RC - 0.12, 0.16, 10, 96), copper); lip.position.set(0, RC, -L / 2 + 0.1); c.add(lip);
      const memU = { uT: { value: 0 }, uOpen: { value: 0 } };
      const mem = new THREE.Mesh(new THREE.CircleGeometry(RC - 0.1, 96), new THREE.ShaderMaterial({ uniforms: memU, transparent: true, toneMapped: false, fog: false,
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT, uOpen; varying vec2 vP;
          void main(){ float r = length(vP) / 3.4; float a = atan(vP.y, vP.x);
            float sw = sin(a * 7. + r * 18. - uT * 1.6) * 0.5 + 0.5; float iso = abs(fract(r * 9. - uT * 0.25 + sw * 0.15) - 0.5);
            vec3 col = mix(vec3(0.02, 0.05, 0.2), vec3(0.43, 0.14, 0.66), sw * (1. - r));
            col += smoothstep(0.07, 0.0, iso) * mix(vec3(0., 0.9, 1.), vec3(0.16, 0.38, 1.), r) * 0.9;
            col += vec3(1., 0.18, 0.39) * smoothstep(0.98, 0.85, r) * smoothstep(0.7, 0.98, r) * (0.4 + 0.6 * uOpen);
            col *= 0.55 + 0.75 * uOpen;
            gl_FragColor = vec4(col, 1.);
            #include <colorspace_fragment>
          }` }));
      mem.position.set(0, RC, -L / 2 + 0.02); c.add(mem); S.memU = memU;
      const cv = document.createElement('canvas'); cv.width = cv.height = 512; const et = new THREE.CanvasTexture(cv); et.colorSpace = THREE.SRGBColorSpace;
      const eye = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: et, transparent: true, toneMapped: false, fog: false })); eye.position.set(0, RC, -L / 2 + 0.08); c.add(eye);
      S.eye = { cv, et, mesh: eye, lid: -1, lx: 9, ly: 9, blink: 0 };
      const ring = c.sign('THE HOMING DOME  ·  THE WAY ON  ·  WALK INTO THE EYE', { w: 4.4, h: 0.15, bg: null, fg: '#ffd0dc', font: c.MONO, glow: 10, px: 80 }); ring.position.set(0, 0.55, -L / 2 + 0.1); c.add(ring);
      const ring2 = ring.clone(); ring2.position.set(0, 2 * RC - 0.55, -L / 2 + 0.1); ring2.rotation.z = Math.PI; c.add(ring2);
      c.click(eye, () => c.say(eye, 'I can see the dome from here. I can see you from here too.'), 'The eye');
    }
    // the exits: every way round the far end opens to the dome, and the heart is the door at the bottom of the near end
    const reset = () => { c.P.up = null; c.camera.up.set(0, 1, 0); };
    for (let k = 0; k <= 8; k++) c.door({ x: -C / 2 + k * C / 8, z: -L / 2 + 0.6, r: 1.6, fn: () => { reset(); c.go('dome'); } });
    c.door({ x: 0, z: L / 2 - 0.45, r: 0.6, fn: () => { reset(); c.go('heart'); } });
    wallU(-C / 2, L / 2 - 0.7, -0.62, L / 2 - 0.7); wallU(0.62, L / 2 - 0.7, C / 2, L / 2 - 0.7);

    // ---------- things that stand on the walls and the ceiling ----------
    const prop = (name, a, z, o = {}) => { const g = c.glb(name, { h: o.h, len: o.len }); place(g, D(a), z, o.off || 0, o.yaw || 0); if (o.col) postU(uOf(D(a)), z, o.col); return g; };
    // the ceiling pigeon, who disagrees about which of you is upside down
    const cp = prop('pigeon', 180, 11.5, { h: 0.34, yaw: 0.6 });
    c.click(cp, () => { c.sound.coo?.(); c.egg('wing_ceilingPigeon', 'This pigeon thinks you are the one on the ceiling. Walk up and ask. It has a point.'); }, 'A pigeon on the ceiling');
    S.walkers = [prop('pigeon', 62, 6, { h: 0.3, yaw: 2 }), prop('pigeon', 300, -1, { h: 0.3 }), prop('pigeon', 150, -9, { h: 0.32, yaw: -1 }), prop('pigeon', 8, -15, { h: 0.3, yaw: Math.PI })];
    S.walkers.forEach((w, k) => { w.userData.a0 = [62, 300, 150, 8][k]; w.userData.z0 = [6, -1, -9, -15][k]; });
    prop('bench', 180, 4, { len: 1.7, yaw: Math.PI / 2, col: 0.55 });
    prop('bench', 92, -9.2, { len: 1.7, yaw: -Math.PI / 2, col: 0.55 });
    prop('lamppost', 45, 14, { h: 2.9, col: 0.15 }); prop('lamppost', 135, -6.8, { h: 2.9, col: 0.15 }); prop('lamppost', 225, 9.2, { h: 2.9, col: 0.15 }); prop('lamppost', 315, -13.6, { h: 2.9, col: 0.15 });
    prop('hydrant', 242, 13, { h: 0.7, col: 0.25 });
    prop('mailbox', 104, -3.6, { h: 1.15, col: 0.35, yaw: 0.4 });
    prop('ph_postcard_set_01', 112, -3.4, { len: 0.3 });
    const bag = prop('ph_vintage_suitcase', 200, -0.5, { len: 0.75, yaw: 0.5 });
    c.click(bag, () => c.egg('wing_suitcase', 'Checked bag. Unclaimed since 1987. Contents: one feather, a PIGEONCARD with thirty five cents on it, a map of the way home.'), 'Unclaimed luggage');
    prop('ph_binoculars', 352, 8.6, { len: 0.22, yaw: 1.2 });
    prop('ph_rubber_duck_toy', 176, -7.4, { len: 0.22, yaw: 2.2 });
    prop('ph_wicker_basket_01', 268, 5, { len: 0.5 });
    prop('ph_baseball_01', 255, -12.2, { len: 0.075 });
    // a gull got in. Nobody knows how. It circles the axis forever, which is the only place in here that is not a floor
    S.gull = c.glb('gull', { len: 0.8 }); S.gull.position.set(0, RC, 0);
    c.click(S.gull, () => c.say(S.gull, 'I am not lost. I am commuting.'), 'A gull');

    // the lone figure: a New Yorker standing on the old ceiling at the far end, reading, upright to themselves
    {
      const fig = new THREE.Group(); place(fig, D(180), -12.6, 0, Math.PI); c.add(fig);
      const coat = new THREE.MeshStandardMaterial({ color: 0x14182a, roughness: 0.8 }), pants = new THREE.MeshStandardMaterial({ color: 0x0b0d14, roughness: 0.85 });
      const cap = (r, h, m, x, y, z, rz = 0, rx = 0) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 10), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); fig.add(o); return o; };
      cap(0.075, 0.7, pants, -0.1, 0.45, 0); cap(0.075, 0.7, pants, 0.1, 0.45, 0); cap(0.19, 0.5, coat, 0, 1.15, 0);
      cap(0.06, 0.4, coat, -0.24, 1.2, 0.12, 0.3, -0.9); cap(0.06, 0.4, coat, 0.24, 1.2, 0.12, -0.3, -0.9);
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 184, (q) => { q.fillStyle = '#e8e2d2'; q.fillRect(0, 0, 256, 184); q.fillStyle = '#111'; q.font = '800 26px serif'; q.fillText('THE DAILY COO', 20, 34); q.font = '600 13px monospace'; for (let k = 0; k < 9; k++) q.fillRect(20 + (k % 2) * 116, 54 + Math.floor(k / 2) * 24, 100, 6); }), side: THREE.DoubleSide, roughness: 0.8 }));
      paper.position.set(0, 1.25, 0.32); paper.rotation.x = -0.4; fig.add(paper);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; c.eyeFlower(cv.getContext('2d'), 128, 128, 120, { lid: 0.3, look: [0, 0.6] });
      const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
      const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: ht, alphaTest: 0.5, side: THREE.DoubleSide })); head.position.set(0, 1.72, 0.02); fig.add(head);
      postU(uOf(Math.PI), -12.6, 0.35);
      c.click(fig, () => c.say(head, 'Reading the ceiling edition. Same news, other way up.'), 'A reader');
    }

    // the departures board, on a post standing out of the wall
    {
      const g = new THREE.Group(); place(g, D(300), 13.4, 0, 0); c.add(g);
      g.add(c.slab(0.08, 1.4, 0.08, copper, 0, 0.7, 0));
      const bt = c.canvasTex(1024, 560, (q, w, h) => {
        q.fillStyle = '#05070f'; q.fillRect(0, 0, w, h); q.fillStyle = '#ffb020'; q.font = `700 44px ${c.MONO}`; q.fillText('DEPARTURES  ·  WING', 36, 70);
        q.font = `600 30px ${c.MONO}`; const rows = [['DOME', 'BOARDING', '#00e5ff'], ['HOME', 'ALWAYS ON TIME', '#00e5ff'], ['SOUTH FOR WINTER', 'CANCELLED', '#ff2e63'], ['NEW JERSEY', 'NOT TODAY', '#ff2e63'], ['THE BREAD LADY', 'DELAYED, CROWDS', '#ffb020'], ['THE CEILING', 'YOU ARE ON IT', '#f0f4f8']];
        rows.forEach(([a, b, col], k) => { q.fillStyle = '#f0f4f8'; q.fillText(a, 36, 140 + k * 66); q.fillStyle = col; q.fillText(b, 560, 140 + k * 66); q.fillStyle = 'rgba(255,255,255,.06)'; q.fillRect(30, 104 + k * 66, w - 60, 2); });
      });
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.93, 0.07), [navy, navy, navy, navy, new THREE.MeshBasicMaterial({ map: bt, toneMapped: false }), navy]); board.position.set(0, 1.85, 0); g.add(board);
      postU(uOf(D(300)), 13.4, 0.2);
      c.click(board, () => c.egg('wing_board', 'Every departure from the wing is to the dome. Every departure from the dome is home. Pigeons do not do connecting flights.'), 'Departures');
    }

    // floor lettering, laid into the feathers: read it from wherever you are standing, which is the bottom
    const floorText = (text, a, z, w, h, o = {}) => { const m = c.sign(text, { w, h, bg: null, fg: o.fg || '#f0f4f8', font: o.font || c.FONT, weight: o.weight || 800, glow: o.glow ?? 6, px: o.px || 160 }); m.geometry = wrap(new THREE.PlaneGeometry(w, h, 24, 2).rotateX(-Math.PI / 2), D(a), z, 0.02); m.position.set(0, 0, 0); m.material.side = THREE.DoubleSide; m.material.depthWrite = false; m.renderOrder = 1; c.add(m); return m; };
    floorText('DOWN IS WHEREVER YOUR FEET ARE', 0, 14.6, 3.6, 0.36);
    floorText('WALK UP THE WALL', 70, 12.6, 2.4, 0.3, { fg: '#00e5ff' });
    floorText('THIS IS THE CEILING. THE CEILING DISAGREES.', 180, 8.2, 3.9, 0.3, { fg: '#ff2e63' });
    floorText('KEEP GOING. THE OTHER WALL IS ALSO DOWN.', 270, 7.5, 3.6, 0.28);
    floorText('MIND THE SKY', 0, 9, 1.4, 0.22, { fg: '#ffb020', font: c.MONO });
    // museum labels on the floor beside the things, written like a museum that takes itself seriously
    const label = (text, a, z) => floorText(text, a, z, 1.3, 0.3, { fg: '#e9e2cf', font: c.MONO, weight: 600, glow: 0, px: 120 });
    label('Bench, inverted.\nUpper West Side, 2019.\nNobody has sat on it.', 180, 5.6);
    label('Hydrant, horizontal.\nNever opened.\nThe wing is dry.', 242, 14.2);
    label('Mailbox. Air mail only.\nCollection: whenever\nthe wing flaps.', 104, -2.2);
    label('Luggage, unclaimed.\nLaGuardia, a long\ntime ago.', 200, 0.7);

    // ---------- feathers in the wind: one instanced mesh, drifting from the dome end toward you ----------
    {
      const ft = c.canvasTex(128, 320, (q) => {
        q.translate(64, 0); q.strokeStyle = '#d8e4f0'; q.lineWidth = 3; q.beginPath(); q.moveTo(0, 310); q.lineTo(0, 10); q.stroke();
        for (let y = 20; y < 290; y += 4) { const w = Math.sin((y - 10) / 290 * Math.PI) * 54; const g2 = q.createLinearGradient(-w, 0, w, 0); g2.addColorStop(0, 'rgba(160,190,255,.0)'); g2.addColorStop(0.2, 'rgba(200,215,240,.85)'); g2.addColorStop(0.5, 'rgba(240,244,248,.95)'); g2.addColorStop(0.8, 'rgba(160,140,230,.85)'); g2.addColorStop(1, 'rgba(160,190,255,0)'); q.strokeStyle = g2; q.lineWidth = 2.2; q.beginPath(); q.moveTo(-w, y + 10); q.quadraticCurveTo(0, y - 6, w, y + 10); q.stroke(); }
      });
      const N = c.MOBILE ? 80 : 150;
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 0.28), new THREE.MeshStandardMaterial({ map: ft, alphaTest: 0.3, side: THREE.DoubleSide, emissive: 0xc8d8ff, emissiveMap: ft, emissiveIntensity: 0.35, roughness: 0.6 }), N);
      im.frustumCulled = false; c.add(im);
      S.fea = { im, N, d: Array.from({ length: N }, () => ({ a: Math.random() * Math.PI * 2, r: 0.3 + Math.random() * 2.9, z: -L / 2 + Math.random() * L, s: 0.4 + Math.random() * 0.8, ph: Math.random() * 6, w: (Math.random() - 0.5) * 0.4 })) };
    }

    // ---------- the walk: the engine's sheet is the tube unrolled ----------
    S.lastU = 0; S.turn = 0; S.round = false;
    R.move = (P, nx, nz) => [((nx + C / 2) % C + C) % C - C / 2, nz];
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _t = new V(), _n = new V(), _z = new V(0, 0, 1);
    R.camera = (cam, me) => {
      const th = me.x / RC, h = cam.position.y, s = Math.sin(th), co = Math.cos(th), r = RC - h;
      cam.position.set(R.x0 + r * s, RC - r * co, cam.position.z);
      _t.set(co, s, 0); _n.set(-s, co, 0); _q.setFromRotationMatrix(_m.makeBasis(_t, _n, _z));
      cam.quaternion.premultiply(_q);
    };
    const _o = new THREE.Object3D();
    c.tick((t, dt, me) => {
      // a full lap of the tube, either way round, counts
      let d = me.x - S.lastU; if (d > C / 2) d -= C; if (d < -C / 2) d += C; S.lastU = me.x; S.turn += d;
      if (!S.round && Math.abs(S.turn) > C) { S.round = true; c.egg('wing_allTheWayRound', 'All the way round and you never fell once. The wing has decided you can fly.'); }
      // the eye at the far end: opens as you come, looks where you are on the ring, blinks
      const E = S.eye, dist = me.z + L / 2, th = me.x / RC;
      const lid = Math.max(0, Math.min(1, (dist - 6) / 22)) * 0.85 + (((t % 6.3) < 0.18) ? 1 : 0);
      // you, seen from the eye: x is sin, and canvas y runs down, which is where the bottom of the tube is from you
      const want = [Math.round(Math.min(1, lid) * 20) / 20, Math.round(Math.sin(th) * 9) / 10, Math.round(Math.cos(th) * 9) / 10];
      if (want[0] !== E.lid || want[1] !== E.lx || want[2] !== E.ly) { E.lid = want[0]; E.lx = want[1]; E.ly = want[2]; const q = E.cv.getContext('2d'); q.clearRect(0, 0, 512, 512); c.eyeFlower(q, 256, 256, 240, { lid: E.lid, look: [E.lx, E.ly] }); E.et.needsUpdate = true; }
      S.memU.uT.value = t; S.memU.uOpen.value = 1 - Math.min(1, E.lid);
      // the sky goes by under the floor
      if (S.skyT) S.skyT.offset.y = -t * 0.004;
      for (const m of S.clouds || []) { m.position.z += m.userData.v * dt; if (m.position.z > 70) m.position.z -= 140; }
      for (const m of S.birds || []) { m.position.z += 2.2 * dt; if (m.position.z > 45) m.position.z -= 90; m.scale.y = 0.6 + 0.4 * Math.sin(t * 9 + m.userData.ph); }
      // the fan
      if (S.fan?.userData.ready) S.fan.rotation.y += dt * 4.2;
      // the gull circles the axis
      if (S.gull.userData.ready) { const a = t * 0.35, z = Math.sin(t * 0.13) * 11; S.gull.position.set(Math.cos(a) * 1.3, RC + Math.sin(a) * 1.3, z); S.gull.rotation.set(0, 0, 0); S.gull.lookAt(R.x0 + Math.cos(a + 0.2) * 1.3, RC + Math.sin(a + 0.2) * 1.3, z + Math.cos(t * 0.13) * 0.4); S.gull.rotateY(Math.PI); S.gull.position.y += 0; }
      // pigeons pace on their own patch of floor, whichever way that faces
      for (const [k, w] of S.walkers.entries()) { if (!w.userData.ready) continue; const u = t * 0.3 + k * 1.7, a = D(w.userData.a0) + Math.sin(u) * 0.18, z = w.userData.z0 + Math.cos(u * 0.7) * 0.8; place(w, a, z, 0, Math.cos(u) > 0 ? 0.2 : Math.PI + 0.2); w.position.add(_n.set(-Math.sin(a), Math.cos(a), 0).multiplyScalar(Math.abs(Math.sin(t * 6 + k)) * 0.015)); }
      // feathers: carried down the tube by the fan's wind (yes, the wrong way, it is a wing) and turning as they go
      const F = S.fea;
      for (let i = 0; i < F.N; i++) { const p = F.d[i]; p.z += dt * p.s * 0.9; p.a += dt * p.w; if (p.z > L / 2 - 0.5) { p.z = -L / 2 + 0.5; p.r = 0.3 + Math.random() * 2.9; }
        const r = p.r + Math.sin(t * 0.7 + p.ph) * 0.15; _o.position.set(Math.sin(p.a) * r, RC - Math.cos(p.a) * r, p.z);
        _o.rotation.set(t * 0.9 * p.s + p.ph, t * 0.6 + p.ph, Math.sin(t + p.ph) * 0.8); _o.updateMatrix(); F.im.setMatrixAt(i, _o.matrix); }
      F.im.instanceMatrix.needsUpdate = true;
    });
  },
  onEnter(c) { const S = c.R.state; S.lastU = c.P.x - c.R.x0; if (!S.told) { S.told = true; setTimeout(() => c.toast('Walk sideways. Keep walking. Down will follow you.', 4600), 2600); } },
};
