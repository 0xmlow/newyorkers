// III. THE PIGEON. Room 6: THE NAVE.
// You looked too closely at a pigeon's eye and fell through it. You are inside its neck, and its neck is a cathedral.
//
// HEADLINE ILLUSION: view dependent colour plus breath.
// 1. The vault, the walls and the feather columns are thin film: MeshPhysicalMaterial iridescence (iridescenceIOR,
//    iridescenceThicknessRange) over the feather texture, plus a small fresnel term injected into the shader that leans
//    green face on and violet at a grazing angle. Walk and the whole neck slides between green and purple, like the real
//    thing on a pigeon in the sun, and it does it because of where YOU are, not because anything animates.
// 2. The nave breathes. One uniform displaces every vertex of the vault, the ribs and the columns outward from the
//    nave's axis, more the higher it is, on a slow breath; the field of view swells with it, the down in the air is
//    pushed on the out breath, and a coo rolls down the nave as the pigeon breathes out.
const W = 7, SPRING = 7, ARC_R = 10, ARC_C = 3, Z0 = 14, Z1 = -30;
const APEX = SPRING + Math.sqrt(ARC_R * ARC_R - ARC_C * ARC_C);
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const BREATH = { value: 0 }, IRI = { value: 1 };

export default {
  id: 'nave', name: 'The Nave', scale: 'III · The pigeon',
  kicker: "You fell through a pigeon's eye. This is the inside of its neck, and the neck is a cathedral. It is breathing.",
  sound: 'nave',
  sky: 0x0d0820, fog: 0x140b2a, fogD: 0.009, hemi: [0x7a6cc8, 0x1a0e22, 0.22], env: 0.36,
  post: { dream: 0.22, bloom: 0.9, vig: 0.5, grain: 0.1, ca: 0.003 },
  spawn: [0, 11.5, 0],
  fov: () => 68 + BREATH.value * 2.2,
  build(c) {
    const { THREE, R } = c;
    const rnd = mulberry(611);
    const DR = { p: [], v: [] };
    // ---------- the breath and the sheen, injected into the standard physical shader ----------
    const breathe = (m, sheen = true, move = true) => {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uBreath = BREATH; sh.uniforms.uIri = IRI;
        if (move) sh.vertexShader = 'uniform float uBreath;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec2 d = position.y > ${SPRING.toFixed(1)} ? normalize(vec2(position.x, position.y - ${SPRING.toFixed(1)})) : vec2(sign(position.x), 0.);
            float a = uBreath * smoothstep(2.4, 11.0, position.y) * (0.75 + 0.25 * sin(position.z * 0.35));
            transformed.xy += d * a; }`);
        if (sheen) sh.fragmentShader = 'uniform float uIri;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { float f = pow(1. - abs(dot(normalize(normal), normalize(vViewPosition))), 1.4);
            totalEmissiveRadiance += mix(vec3(0.0, 0.07, 0.04), vec3(0.09, 0.0, 0.13), f) * uIri; }`);
      };
      m.customProgramCacheKey = () => 'nave-breath-' + sheen + move;
      return m;
    };
    const featherT = c.canvasTex(256, 1024, (g, w, hh) => {
      // one vane: a quill down the middle, barbs raking up and out, green and violet in the barbs
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#0c1018'); gr.addColorStop(0.12, '#1d2532'); gr.addColorStop(0.5, '#2c3646'); gr.addColorStop(0.88, '#1d2532'); gr.addColorStop(1, '#0c1018'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
      const r = mulberry(5);
      for (let y = -200; y < hh + 200; y += 9) for (const s of [-1, 1]) {
        const k = r(); g.strokeStyle = k < 0.4 ? 'rgba(70,215,160,.75)' : k < 0.8 ? 'rgba(170,80,230,.7)' : 'rgba(225,230,240,.55)'; g.lineWidth = 3 + r() * 2;
        g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w / 2 + s * w * 0.22, y - 26, w / 2 + s * w * 0.5, y - 64 - r() * 24); g.stroke();
        if (r() < 0.08) { g.strokeStyle = 'rgba(5,8,14,.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2 + s * w * 0.2, y - 20); g.lineTo(w / 2 + s * w * 0.5, y - 60); g.stroke(); }
      }
      g.fillStyle = '#efe8d8'; g.fillRect(w / 2 - 7, 0, 14, hh); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(w / 2 + 4, 0, 3, hh);
    });
    const vaultM = breathe(c.surf('feather', 3.2, { physical: true, tint: 0x6f7c88, params: { roughness: 0.38, metalness: 0.35, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700] } }).clone());
    const ribM = breathe(new THREE.MeshPhysicalMaterial({ map: featherT, roughness: 0.55, metalness: 0.1, iridescence: 0.8, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 750], side: THREE.DoubleSide, color: 0x8a94a2 }));
    const quillM = breathe(new THREE.MeshPhysicalMaterial({ color: 0xe9e3d3, roughness: 0.3, clearcoat: 0.8 }), false);
    const endM = breathe(c.surf('feather', 3.2, { physical: true, tint: 0x6f7c88, params: { roughness: 0.38, metalness: 0.35, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700] } }).clone(), true, false);
    const pink = new THREE.MeshPhysicalMaterial({ color: 0xff2e63, roughness: 0.18, clearcoat: 1, emissive: 0x5a0018, emissiveIntensity: 0.5 });
    const violet = new THREE.MeshPhysicalMaterial({ color: 0x6f23a8, roughness: 0.2, clearcoat: 1, emissive: 0x230a40, emissiveIntensity: 0.5 });
    const gilt = new THREE.MeshStandardMaterial({ color: 0xb8902e, metalness: 1, roughness: 0.3 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.55 });

    // ---------- the vault: a pointed arch swept down the neck, one surface, breathing ----------
    const prof = [];
    for (let i = 0; i <= 7; i++) prof.push([-W, i * SPRING / 7]);
    const a1 = Math.atan2(APEX - SPRING, -ARC_C);
    for (let i = 1; i <= 18; i++) { const a = Math.PI + (a1 - Math.PI) * i / 18; prof.push([ARC_C + ARC_R * Math.cos(a), SPRING + ARC_R * Math.sin(a)]); }
    const half = prof.length; for (let i = half - 2; i >= 0; i--) prof.push([-prof[i][0], prof[i][1]]);
    const arcLen = [0]; for (let i = 1; i < prof.length; i++) arcLen.push(arcLen[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
    {
      const NZ = 56, np = prof.length, pos = [], uv = [], idx = [];
      for (let j = 0; j <= NZ; j++) { const z = Z0 + (Z1 - Z0) * j / NZ; for (let i = 0; i < np; i++) { pos.push(prof[i][0], prof[i][1], z); uv.push(arcLen[i] / 3.2, z / 3.2); } }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < np - 1; i++) { const a = j * np + i, b = a + 1, cc = a + np, d = cc + 1; idx.push(a, b, cc, b, d, cc); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      if (g.attributes.normal.getX(0) < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
      const vault = new THREE.Mesh(g, vaultM); c.add(vault);
    }
    // the floor: dark terrazzo, a velvet runner down the aisle, a band of bone at the walls
    c.box(2 * W, 0.1, Z0 - Z1, c.surf('terrazzo', 2.4, { tint: 0x2c2440 }), 0, -0.05, (Z0 + Z1) / 2, { collide: false });
    c.box(2.2, 0.012, Z0 - Z1 - 3, c.surf('velvet', 1.4, { tint: 0xc84070 }), 0, 0.006, (Z0 + Z1) / 2 - 0.5, { collide: false });
    for (const s of [-1, 1]) c.box(0.4, 0.02, Z0 - Z1, new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.4 }), s * (W - 0.2), 0.01, (Z0 + Z1) / 2, { collide: false });

    // ---------- the columns: enormous feathers, standing at the walls and curving over into the ribs ----------
    const ZC = []; for (let i = 0; i <= 8; i++) ZC.push(11 - i * 5);
    {
      const vanes = [], quills = [];
      for (const z of ZC) for (const sx of [-1, 1]) {
        const pts = [], ins = []; for (let i = 0; i < half; i++) { const [x, y] = prof[i]; const nx = i < 8 ? 1 : -(x - ARC_C) / ARC_R, ny = i < 8 ? 0 : -(y - SPRING) / ARC_R; pts.push(new THREE.Vector3(sx * (x + nx * 0.18), y + ny * 0.18, z)); ins.push(new THREE.Vector3(sx * nx, ny, 0).normalize()); }
        const n = pts.length, pos = [], uv = [], idx = [], T = 6;
        for (let i = 0; i < n; i++) {
          const s = i / (n - 1), wv = 0.95 * Math.pow(1 - s, 0.6) + 0.1, p = pts[i];
          const inw = ins[i];
          for (let k = 0; k <= T; k++) { const t = k / T * 2 - 1; const q = p.clone().add(new THREE.Vector3(0, 0, t * wv)).addScaledVector(inw, 0.22 * (1 - t * t) * wv); pos.push(q.x, q.y, q.z); uv.push((t + 1) / 2, s * 4); }
        }
        for (let i = 0; i < n - 1; i++) for (let k = 0; k < T; k++) { const a = i * (T + 1) + k, b = a + 1, cc = a + T + 1, d = cc + 1; idx.push(a, b, cc, b, d, cc); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); vanes.push(g.toNonIndexed());
        const curve = new THREE.CatmullRomCurve3(pts.map((p, i) => p.clone().addScaledVector(ins[i], 0.05)));
        quills.push(new THREE.TubeGeometry(curve, 48, 0.075, 8, false));
        // the calamus, the bare quill at the floor, like a column base
        const base = new THREE.CylinderGeometry(0.16, 0.22, 1.2, 12); base.translate(pts[0].x + ins[0].x * 0.05, 0.6, z); quills.push(base);
        c.post(sx * (W - 0.25), z, 0.35);
      }
      const vm = new THREE.Mesh(c.merge(vanes), ribM); c.add(vm);
      const qm = new THREE.Mesh(c.merge(quills.map((g) => g.index ? g.toNonIndexed() : g)), quillM); c.add(qm);
    }
    // the end walls (they do not breathe; the vault swells away from them behind its own skin)
    {
      const sh = new THREE.Shape(); sh.moveTo(-W - 2, -0.1); sh.lineTo(W + 2, -0.1); sh.lineTo(W + 2, APEX + 3); sh.lineTo(-W - 2, APEX + 3); sh.lineTo(-W - 2, -0.1);
      const arch = new THREE.Path(); arch.moveTo(-2, 0); arch.lineTo(-2, 4.5); arch.quadraticCurveTo(-2, 6.6, 0, 7.6); arch.quadraticCurveTo(2, 6.6, 2, 4.5); arch.lineTo(2, 0); arch.lineTo(-2, 0); sh.holes.push(arch);
      const far = new THREE.Mesh(new THREE.ShapeGeometry(sh, 12), endM); far.position.z = Z1 + 0.02; c.add(far);
      const sh2 = new THREE.Shape(); sh2.moveTo(-W - 2, -0.1); sh2.lineTo(W + 2, -0.1); sh2.lineTo(W + 2, APEX + 3); sh2.lineTo(-W - 2, APEX + 3); sh2.lineTo(-W - 2, -0.1);
      const eye = new THREE.Path(); eye.absarc(0, 6.2, 4.0, 0, Math.PI * 2, true); sh2.holes.push(eye);
      const near = new THREE.Mesh(new THREE.ShapeGeometry(sh2, 48), endM); near.position.z = Z0 - 0.02; near.rotation.y = Math.PI; c.add(near);
      // gilt moulding round the arch
      const ap = []; for (let i = 0; i <= 40; i++) { const t = i / 40; let x, y; if (t < 0.25) { x = -2; y = t / 0.25 * 4.5; } else if (t < 0.5) { const u = (t - 0.25) / 0.25; x = -2 * (1 - u) * (1 - u) + 2 * (1 - u) * u * -2 + u * u * 0; y = 4.5 * (1 - u) * (1 - u) + 2 * (1 - u) * u * 6.6 + u * u * 7.6; } else if (t < 0.75) { const u = (t - 0.5) / 0.25; x = 0 * (1 - u) * (1 - u) + 2 * (1 - u) * u * 2 + u * u * 2; y = 7.6 * (1 - u) * (1 - u) + 2 * (1 - u) * u * 6.6 + u * u * 4.5; } else { x = 2; y = 4.5 - (t - 0.75) / 0.25 * 4.5; } ap.push(new THREE.Vector3(x * 1.04, y, Z1 + 0.08)); }
      c.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ap), 80, 0.12, 8, false), gilt));
    }
    c.wall(-W, Z1 + 0.4, -1.75, Z1 + 0.4); c.wall(1.75, Z1 + 0.4, W, Z1 + 0.4);
    c.wall(-W + 0.4, Z0 - 0.4, W - 0.4, Z0 - 0.4); c.wall(-W + 0.4, Z1, -W + 0.4, Z0); c.wall(W - 0.4, Z1, W - 0.4, Z0);

    // ---------- the vista: the hall at the end of the neck, through the arch ----------
    {
      const back = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 40, 24, 1, true, Math.PI * 0.5, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a0612, side: THREE.BackSide, fog: false }));
      back.position.set(0, 10, Z1 - 2); c.add(back);
      c.plate('p_hall', { x: 0, y: 0, z: Z1 + 10, zMin: 12.4, far: 50, tint: 0xf0e0e8 });
    }
    // the curtain in the arch: two great vanes that part when the rose eye has seen you coming
    const curtain = [];
    for (const s of [-1, 1]) { const g = new THREE.PlaneGeometry(2.05, 7.6, 1, 10); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 3.8; p.setY(i, y); p.setZ(i, Math.sin(y * 1.3) * 0.06); } g.translate(s * 1.02, 0, 0);
      const m = new THREE.Mesh(g, ribM); m.position.set(0, 0, Z1 + 0.25); c.add(m); curtain.push(m); }
    const archBlock = c.wall(-2, Z1 + 0.6, 2, Z1 + 0.6);
    const exit = c.door({ x: 0, z: Z1 + 0.35, r: 0.9, to: 'crop', off: true });
    { const s = c.sign('THE CROP  ·  LOST AND FOUND', { w: 2.6, h: 0.3, bg: '#02040c', fg: '#00e5ff', font: c.MONO, glow: 12, px: 96 }); s.position.set(0, 7.95, Z1 + 0.1); c.add(s); }

    // ---------- the sovereign Open Eye Flower: the rose window over the arch. It watches you come, and opens the way ----------
    const roseCv = document.createElement('canvas'); roseCv.width = roseCv.height = 512; c.eyeFlower(roseCv.getContext('2d'), 256, 256, 240, { petals: 9, iris: '#00b3c7' });
    const roseT = new THREE.CanvasTexture(roseCv); roseT.colorSpace = THREE.SRGBColorSpace;
    const rose = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshBasicMaterial({ map: roseT, transparent: true, alphaTest: 0.05, toneMapped: false })); rose.position.set(0, 11.6, Z1 + 0.12); c.add(rose);
    const roseRing = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.14, 8, 64), gilt); roseRing.position.copy(rose.position); c.add(roseRing);
    c.click(rose, () => { c.egg('nave_rose', 'The rose window has been watching the door since before the egg. It lets you through when it has decided you are a pigeon.'); }, 'The rose window');

    // ---------- the eye you came in by: a round window behind you, from the inside, looking out at the street ----------
    {
      const mask = new THREE.Mesh(new THREE.CircleGeometry(4.0, 64)); mask.position.set(0, 6.2, Z0 - 0.04); mask.rotation.y = Math.PI; c.add(mask);
      c.pocket({ mask, sheen: 0.22, build: (grp) => {
        const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 24, 12), new THREE.MeshBasicMaterial({ color: 0x0b1030, side: THREE.BackSide, fog: false })); sky.position.set(0, 6, Z0 + 10); grp.add(sky);
        c.plate('p_street', { x: 0, y: 3.2, z: Z0 - 3, ry: Math.PI, zMin: 4.2, far: 50, parent: grp, tint: 0xd8e4ff });
      } });
      // the iris, from behind: an orange ring of fibres, the colour of a pigeon's eye
      const irisT = c.canvasTex(1024, 1024, (g, w) => {
        g.translate(w / 2, w / 2); const r = mulberry(9);
        for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, r0 = w * 0.335, r1 = w * (0.44 + r() * 0.06); g.strokeStyle = `hsla(${18 + r() * 22},${80 + r() * 15}%,${40 + r() * 25}%,.8)`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a + (r() - 0.5) * 0.05) * r1, Math.sin(a) * r1); g.stroke(); }
        g.strokeStyle = '#ff2e63'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, w * 0.34, 0, 7); g.stroke();
      });
      const iris = new THREE.Mesh(new THREE.RingGeometry(4.0, 5.9, 96, 1), new THREE.MeshStandardMaterial({ map: irisT, emissive: 0xffffff, emissiveMap: irisT, emissiveIntensity: 0.55, roughness: 0.4, transparent: true }));
      iris.position.set(0, 6.2, Z0 - 0.06); iris.rotation.y = Math.PI; c.add(iris);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(5.95, 0.16, 8, 96), gilt); rim.position.set(0, 6.2, Z0 - 0.08); c.add(rim);
      // paint running off the bottom of the eye
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 1.6, x = Math.cos(a) * 5.95, y = 6.2 + Math.sin(a) * 5.95, len = 0.3 + rnd() * 1.2; dripAt(x, y, Z0 - 0.15, len, rnd() < 0.6 ? pink : violet); }
      const pl = c.sign('YOU CAME IN THROUGH THE EYE.\nTHE EYE ONLY OPENS INWARD.\nPLEASE PROCEED DOWN THE NECK.', { w: 1.5, h: 0.42, bg: '#1c1408', fg: '#e9c46a', font: c.MONO, px: 160, border: '#b8902e' });
      pl.position.set(-3.2, 1.45, Z0 - 0.45); pl.rotation.y = Math.PI; c.add(pl);
    }
    function dripAt(x, y, z, len, m, r = 0.05) {
      const g = new THREE.CylinderGeometry(r * 0.7, r * 0.35, len, 6); g.translate(x, y - len / 2, z); const b = new THREE.SphereGeometry(r, 8, 6); b.translate(x, y - len, z);
      const blob = new THREE.SphereGeometry(r * 1.6, 8, 5); blob.scale(1.4, 0.6, 0.5); blob.translate(x, y, z);
      (m === pink ? DR.p : DR.v).push(g, b, blob);
    }

    // ---------- the New Yorkers, in gilt, between the feathers ----------
    const pieces = c.art(16);
    const bays = []; for (let i = 0; i < 8; i++) bays.push((ZC[i] + ZC[i + 1]) / 2);
    let pi = 0;
    for (const z of bays) for (const sx of [-1, 1]) { const p = pieces[pi++]; if (!p) continue; c.hang(p, sx * (W - 0.03), 1.68, z, -sx * Math.PI / 2, 1.5, 'gilt', { light: true }); }

    // ---------- the pews, made of feathers ----------
    const pewT = c.canvasTex(128, 512, (g, w, hh) => {
      // a pigeon wing feather: grey vane, a darker trailing edge, the black bar near the tip, a white quill
      g.save(); g.beginPath(); g.moveTo(w / 2, hh); g.bezierCurveTo(w * 0.05, hh * 0.7, w * 0.02, hh * 0.18, w * 0.5, 0); g.bezierCurveTo(w * 0.98, hh * 0.2, w * 0.95, hh * 0.7, w / 2, hh); g.clip();
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#7d8592'); gr.addColorStop(0.5, '#b9bfc9'); gr.addColorStop(1, '#8f97a4'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
      const r = mulberry(8); for (let y = 0; y < hh; y += 4) { g.strokeStyle = `rgba(40,45,60,${0.12 + r() * 0.12})`; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2, y); g.lineTo(0, y - 40); g.moveTo(w / 2, y); g.lineTo(w, y - 40); g.stroke(); }
      g.fillStyle = 'rgba(20,22,30,.85)'; g.fillRect(0, hh * 0.12, w, hh * 0.1); g.fillStyle = 'rgba(60,180,140,.25)'; g.fillRect(0, hh * 0.55, w, hh * 0.2);
      g.restore(); g.fillStyle = '#efe9dc'; g.fillRect(w / 2 - 2, hh * 0.04, 4, hh * 0.96);
    });
    const pewFM = new THREE.MeshStandardMaterial({ map: pewT, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
    const ROWS = []; for (let z = 6.2; z >= -11; z -= 1.55) ROWS.push(z);
    {
      const woodG = [], featherG = [];
      const bx = (w, hh, d, x, y, z) => { const g = new THREE.BoxGeometry(w, hh, d); g.translate(x, y, z); woodG.push(g); };
      bx(2.9, 0.08, 0.5, 0, 0.45, 0); bx(0.08, 0.45, 0.5, -1.4, 0.22, 0); bx(0.08, 0.45, 0.5, 1.4, 0.22, 0); bx(2.9, 0.06, 0.06, 0, 0.5, 0.24); bx(0.1, 0.9, 0.55, -1.42, 0.45, 0.02); bx(0.1, 0.9, 0.55, 1.42, 0.45, 0.02);
      for (let i = 0; i < 9; i++) {
        const g = new THREE.PlaneGeometry(0.3, 1.2, 1, 8), p = g.attributes.position;
        for (let k = 0; k < p.count; k++) { const y = p.getY(k) / 1.2 + 0.5; p.setY(k, y * 1.2); p.setZ(k, Math.sin(y * 2.4) * 0.1); }
        g.rotateX(-0.2); g.rotateZ((i - 4) * 0.06); g.translate(-1.28 + i * 0.32, 0.48, 0.26); featherG.push(g);
      }
      const wg = c.merge(woodG), fg = c.merge(featherG);
      const n = ROWS.length * 2, wm = new THREE.InstancedMesh(wg, wood, n), fm = new THREE.InstancedMesh(fg, pewFM, n);
      let k = 0; for (const z of ROWS) for (const sx of [-1, 1]) { const m = new THREE.Matrix4().makeTranslation(sx * 2.75, 0, z); wm.setMatrixAt(k, m); fm.setMatrixAt(k, m); k++; }
      wm.frustumCulled = fm.frustumCulled = false; c.add(wm); c.add(fm);
      for (const sx of [-1, 1]) c.box(2.95, 0.01, ROWS[0] - ROWS[ROWS.length - 1] + 0.7, new THREE.MeshBasicMaterial({ visible: false }), sx * 2.75, 0, (ROWS[0] + ROWS[ROWS.length - 1]) / 2);
      // paint off the pew backs
      for (let i = 0; i < 14; i++) { const z = ROWS[Math.floor(rnd() * ROWS.length)] + 0.3, x = (rnd() < 0.5 ? -1 : 1) * (1.4 + rnd() * 2.7); dripAt(x, 0.5, z, 0.12 + rnd() * 0.3, rnd() < 0.5 ? pink : violet, 0.025); }
    }
    // the congregation: pigeons, sitting in the pews, facing the arch
    const cong = [];
    for (const [x, z, ry] of [[-1.9, 4.65, 0.1], [2.2, 3.1, -0.2], [-3.4, 0.0, 0.3], [3.0, -1.55, 0], [-2.4, -4.65, 0.5], [1.8, -7.75, -0.4], [3.6, 1.55, 3.0]]) {
      const pg = c.glb('pigeon', { h: 0.36, x, y: 0.49, z: z - 0.05, ry: Math.PI + ry }); cong.push(pg);
      c.click(pg, () => { c.sound.coo(1.1); c.say(pg, ['Coo.', 'Amen. Coo.', 'Shh. It is breathing.', 'This seat is taken. By me.'][Math.floor(Math.random() * 4)]); }, 'A parishioner');
    }
    {
      // the lone figure: a New Yorker in a long coat, standing at a painting. Come close and the flower turns to look at you.
      const fig = new THREE.Group(); fig.position.set(-4.7, 0, bays[3] + 0.9); fig.rotation.y = -Math.PI / 2 + 0.35; c.add(fig);
      const coat = new THREE.MeshStandardMaterial({ color: 0x0a1a3a, roughness: 0.8 }), shoe = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
      const cap = (rr, len, x, y, z, rx = 0, rz = 0, m = coat) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(rr, len, 4, 10), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); fig.add(o); return o; };
      cap(0.075, 0.6, -0.1, 0.45, 0); cap(0.075, 0.6, 0.1, 0.45, 0); cap(0.2, 0.55, 0, 1.08, 0); cap(0.23, 0.3, 0, 0.75, 0); cap(0.055, 0.5, -0.27, 1.02, 0.02, 0, 0.12); cap(0.055, 0.5, 0.27, 1.02, 0.02, 0, -0.12);
      cap(0.06, 0.12, -0.1, 0.06, 0.06, Math.PI / 2, 0, shoe); cap(0.06, 0.12, 0.1, 0.06, 0.06, Math.PI / 2, 0, shoe);
      c.post(-4.7, bays[3] + 0.9, 0.3);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; c.eyeFlower(cv.getContext('2d'), 128, 128, 120, { iris: '#ff2e63' }); const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
      const head = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: ht, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide })); head.position.set(0, 1.66, 0.02); fig.add(head);
      c.click(fig, () => c.say(head, 'Every Sunday I come and look at this one. It looks back. So do you, apparently.'), 'A New Yorker');
      R.state.fig = { head, cv, ht, look: [0, 0] };
    }
    // the lectern: a quill standing on its point, holding the hymnal open at the only hymn
    {
      const lec = new THREE.Group(); lec.position.set(-1.9, 0, -14.2); c.add(lec);
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.1, 10), quillM); stalk.position.y = 0.55; lec.add(stalk);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.08, 16), gilt); foot.position.y = 0.04; lec.add(foot);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), wood); top.position.set(0, 1.15, 0); top.rotation.x = 0.35; lec.add(top);
      const bt = c.canvasTex(1024, 640, (g, w, hh) => {
        g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, hh); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(w / 2 - 3, 0, 6, hh);
        g.fillStyle = '#5a1020'; g.font = `700 34px ${c.SERIF}`; g.textAlign = 'center';
        g.fillText('HYMN 333', w / 4, 80); g.fillText('HYMN 333, CONT.', w * 3 / 4, 80);
        g.fillStyle = '#1b1b1b'; g.font = `600 64px ${c.SERIF}`;
        ['COO', 'COO COO', 'COO', 'COO COO COO'].forEach((l, i) => g.fillText(l, w / 4, 190 + i * 100));
        ['COO', 'COO', '(ALL) COO', 'AMEN. COO.'].forEach((l, i) => g.fillText(l, w * 3 / 4, 190 + i * 100));
        g.fillStyle = '#b8902e'; g.font = `500 22px ${c.MONO}`; g.fillText('TO BE COOED SLOWLY, ON THE OUT BREATH', w / 2, hh - 30);
      });
      const book = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.39), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.25 }));
      book.position.set(0, 1.19, 0.01); book.rotation.x = -Math.PI / 2 + 0.35; lec.add(book);
      for (let i = 0; i < 3; i++) { const g = new THREE.CylinderGeometry(0.012, 0.006, 0.12 + i * 0.08, 6); const m = new THREE.Mesh(g, i % 2 ? pink : violet); m.position.set(-0.3 + i * 0.25, 1.06 - (0.06 + i * 0.04), 0.24); lec.add(m); }
      c.post(-1.9, -14.2, 0.45);
      c.click(lec, () => { c.sound.coo(0.7); c.egg('nave_hymnal', 'Hymn 333, all verses: Coo. The congregation will now coo, on the out breath.'); }, 'The hymnal');
    }
    // the collection plate, on the end of the third pew
    {
      const plate = new THREE.Group(); plate.position.set(1.36, 0.92, 3.1); c.add(plate);
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.04, 24), gilt); plate.add(dish);
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.064), new THREE.MeshStandardMaterial({ color: 0xffc400, roughness: 0.4 })); card.rotation.set(-Math.PI / 2, 0, 0.4); card.position.y = 0.025; plate.add(card);
      for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.015 + Math.random() * 0.01), new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.9 })); b.position.set((Math.random() - 0.5) * 0.18, 0.03, (Math.random() - 0.5) * 0.18); plate.add(b); }
      c.click(plate, () => c.egg('nave_plate', 'The collection: four breadcrumbs, a PIGEONCARD with 35 cents on it, one sesame seed, and an IOU signed by a gull.'), 'The collection plate');
    }
    // chandeliers down the nave, statues at the arch, a few eye stickers on the pew ends
    for (const z of [5, -7, -19]) c.glb('ph_Chandelier_02', { h: 1.8, x: 0, y: 9.2, z });
    for (const sx of [-1, 1]) { c.glb('ph_gothic_statue', { h: 2.0, x: sx * 3.6, y: 0.5, z: Z1 + 1.9, ry: sx * -0.4 }); c.box(1.0, 0.5, 1.0, wood, sx * 3.6, 0.25, Z1 + 1.9); }
    {
      const E = (window.STICKER_GROUPS || {}).eye || [];
      for (let i = 0; i < 9; i++) { const z = ROWS[(i * 3) % ROWS.length] + 0.02, sx = i % 2 ? 1 : -1; c.sticker(E[(i * 7) % Math.max(1, E.length)], sx * 1.27, 0.62 + rnd() * 0.25, z, { ry: -sx * Math.PI / 2, size: 0.11 + rnd() * 0.05 }); }
      for (let i = 0; i < 4; i++) c.sticker(E[(i * 11 + 5) % Math.max(1, E.length)], 3.6 + i * 0.5 + rnd() * 0.2, 0.25 + rnd() * 0.25, Z1 + 1.105, { size: 0.12 + rnd() * 0.04 });
    }
    // an organ of quills against the far wall: where the coo comes from
    {
      const pipes = [];
      for (let i = 0; i < 15; i++) { const hh = 2 + Math.sin(i / 14 * Math.PI) * 3.2, x = 3.4 + i * 0.22; const g = new THREE.CylinderGeometry(0.07, 0.09, hh, 10); g.translate(x, hh / 2 + 0.6, Z1 + 0.6); pipes.push(g); const g2 = new THREE.ConeGeometry(0.07, 0.25, 10); g2.translate(x, hh + 0.72, Z1 + 0.6); pipes.push(g2); }
      c.add(new THREE.Mesh(c.merge(pipes), quillM));
      c.box(3.6, 0.6, 0.8, wood, 4.95, 0.3, Z1 + 0.7);
    }
    // the drips, merged
    if (DR.p.length) c.add(new THREE.Mesh(c.merge(DR.p), pink));
    if (DR.v.length) c.add(new THREE.Mesh(c.merge(DR.v), violet));

    // ---------- down in the air ----------
    const downT = c.canvasTex(128, 128, (g) => { const r = mulberry(4); g.translate(64, 64); for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, l = 20 + r() * 40; g.strokeStyle = `rgba(245,240,255,${0.25 + r() * 0.4})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a + 0.5) * l * 0.5, Math.sin(a + 0.5) * l * 0.5, Math.cos(a) * l, Math.sin(a) * l); g.stroke(); } const gr = g.createRadialGradient(0, 0, 0, 0, 0, 16); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-16, -16, 32, 32); });
    const ND = c.MOBILE ? 120 : 260;
    const dG = c.merge([new THREE.PlaneGeometry(0.14, 0.14), new THREE.PlaneGeometry(0.14, 0.14).rotateY(Math.PI / 2)]);
    const down = new THREE.InstancedMesh(dG, new THREE.MeshBasicMaterial({ map: downT, transparent: true, depthWrite: false, side: THREE.DoubleSide, color: 0xe8e0ff }), ND);
    down.frustumCulled = false; c.add(down);
    const D = []; for (let i = 0; i < ND; i++) D.push({ x: (rnd() - 0.5) * 12, y: 0.4 + rnd() * 13, z: Z1 + 1 + rnd() * (Z0 - Z1 - 2), ph: rnd() * 6.28, s: 0.5 + rnd() * 1.1, vx: 0, vy: 0 });
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

    // ---------- light ----------
    c.light(0, 6.2, 12.5, 0xffa04a, 3, 10, () => 0.85 + BREATH.value * 0.6);
    c.light(-3, 6, 3, 0xe0d4ff, 3.5, 18, () => 1 - BREATH.value * 0.25);
    c.light(3, 6, -10, 0xe0d4ff, 3.5, 18, () => 1 - BREATH.value * 0.25);
    c.light(0, 14, -4, 0x2962ff, 7, 26);
    c.light(0, 10, Z1 + 3, 0x00e5ff, 5, 14);
    c.light(-1.9, 2.6, -13, 0xffc070, 2.5, 6);

    // ---------- the tick: breath, coo, down, the rose eye, the curtain ----------
    const S = R.state; S.open = 0; let lastPhase = 0, fr = 0;
    const T = 6.4;
    c.tick((t, dt, me) => {
      fr++;
      // breath: a quick in, a held top, a long out
      const ph = (t % T) / T;
      const b = ph < 0.35 ? Math.sin(ph / 0.35 * Math.PI / 2) : ph < 0.45 ? 1 : Math.cos((ph - 0.45) / 0.55 * Math.PI / 2);
      BREATH.value = (c.REDUCED ? 0.15 : 0.55) * b * b;
      if (lastPhase < 0.45 && ph >= 0.45) { c.sound.coo(0.62); for (const d of D) { const dx = d.x, dy = d.y - 6; const l = Math.hypot(dx, dy) || 1; d.vx += dx / l * 0.25; d.vy += dy / l * 0.15; } }
      lastPhase = ph;
      // the down: drifting, sinking, pushed by the out breath
      for (let i = 0; i < ND; i++) {
        const d = D[i]; d.vx *= 0.985; d.vy *= 0.985;
        d.x += (Math.sin(t * 0.3 + d.ph) * 0.08 + d.vx) * dt; d.y += (-0.05 * d.s + Math.cos(t * 0.5 + d.ph) * 0.04 + d.vy) * dt; d.z += Math.sin(t * 0.21 + d.ph * 2) * 0.06 * dt;
        if (d.y < 0.1) { d.y = 13.5; d.x = (Math.random() - 0.5) * 12; }
        if (Math.abs(d.x) > 6.6) d.x *= 0.98;
        _e.set(t * 0.2 * d.s + d.ph, t * 0.3 + d.ph, 0); _q.setFromEuler(_e); _s.setScalar(d.s); _p.set(d.x, d.y, d.z); _m.compose(_p, _q, _s); down.setMatrixAt(i, _m);
      }
      down.instanceMatrix.needsUpdate = true;
      // the rose eye looks at you; when you are close it decides, blinks, and the curtain parts
      if (fr % 4 === 0) {
        const dx = me.x, dy = me.y - 11.6, dz = me.z - Z1, l = Math.hypot(dx, dy, dz) || 1;
        const near = me.z < -16;
        const blink = (t % 5.1) < 0.12 || (near && S.open < 0.05) ? 0.95 : 0;
        const look = [dx / l * 2.2, -dy / l * 2.2].map((v) => Math.max(-1, Math.min(1, v)));
        const g = roseCv.getContext('2d'); g.clearRect(0, 0, 512, 512); c.eyeFlower(g, 256, 256, 240, { petals: 9, iris: '#00b3c7', look, lid: blink }); roseT.needsUpdate = true;
        if (near && !S.seen) { S.seen = true; c.sound.chime(); }
        const F = S.fig; if (F) { const near2 = Math.hypot(me.x + 4.7, me.z - (bays[3] + 0.9)) < 5; F.turn = near2 ? 1 : 0; F.head.getWorldPosition(_p); _p.x -= R.x0; const v = new THREE.Vector3(me.x - _p.x, me.y - _p.y, me.z - _p.z); F.head.getWorldQuaternion(_q); v.applyQuaternion(_q.invert()).normalize(); const lk = [Math.max(-1, Math.min(1, v.x * 2)), Math.max(-1, Math.min(1, -v.y * 2))]; if (Math.abs(lk[0] - F.look[0]) + Math.abs(lk[1] - F.look[1]) > 0.06) { F.look = lk; const gg = F.cv.getContext('2d'); gg.clearRect(0, 0, 256, 256); c.eyeFlower(gg, 128, 128, 120, { iris: '#ff2e63', look: lk }); F.ht.needsUpdate = true; } }
      }
      if (S.fig) { const F = S.fig, ry = (F.turn ? Math.atan2(me.x + 4.7, me.z - (bays[3] + 0.9)) - (-Math.PI / 2 + 0.35) : 0); let d = ry - F.head.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); F.head.rotation.y += Math.max(-1, Math.min(1, d)) * Math.min(1, dt * 2.5); }
      const want = S.seen ? 1 : 0; S.open += (want - S.open) * Math.min(1, dt * 0.8);
      curtain[0].position.x = -S.open * 1.95; curtain[1].position.x = S.open * 1.95; curtain.forEach((m) => { m.scale.x = 1 - S.open * 0.75; });
      archBlock.off = S.open > 0.6; exit.off = S.open < 0.6;
      for (const pg of cong) pg.position.y = 0.49 + BREATH.value * 0.03;
    });
  },
  onEnter(c) {
    if (!c.R.state.told) { c.R.state.told = true; setTimeout(() => c.toast('Hold still. You can hear it breathing.', 4200), 2600); }
  },
};
