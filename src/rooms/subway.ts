import * as T from 'three';
import { pbr, prop } from '../core/assets';
import { box, floorPlane, sign, v3, seeded, type Rect } from '../core/kit';
import { contour, drips, addThreshold, shared } from '../core/mlow';
import { hang, poster, sticker } from '../core/hang';
import { ORIGINS, type Ctx, type Room } from '../core/room';

// BIGGER ON THE INSIDE ST. A station vestibule, turnstiles, and a train eight cars long that rolls, slowly, all the way
// round its own axis while you stand still on that axis: the haunted swing (Hexenschaukel), the oldest funhouse
// illusion, done with a subway car. The riders roll with it and keep reading. Gangways between cars are round
// hatches centred on your eye, so a doorway stays a doorway at any angle. Click a pole to hold on (stops the roll).
// Local: street door at z = 6 looking -z, vestibule to z = 0, the train from z = 0 to z = -128, axis at y = 1.65.

const AX = 1.65, CAR = 16, CARS = 8, HW = 1.45, FLOOR = -1.35, CEIL = 0.95;

export function buildSubway(ctx: Ctx): Room {
  const O = ORIGINS.subway, g = new T.Group(); g.position.copy(O); ctx.scene.add(g);
  const rnd = seeded(91), art = ctx.m.art.subway, at = (x: number, y: number, z: number) => O.clone().add(v3(x, y, z));

  // ---------- the vestibule, still ----------
  const tileC = document.createElement('canvas'); tileC.width = 256; tileC.height = 256; const tx = tileC.getContext('2d')!;
  tx.fillStyle = '#d9dcd6'; tx.fillRect(0, 0, 256, 256); tx.strokeStyle = '#8f938c'; tx.lineWidth = 3;
  for (let y = 0; y <= 256; y += 32) { tx.beginPath(); tx.moveTo(0, y); tx.lineTo(256, y); tx.stroke(); }
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? 32 : 0; x <= 256; x += 64) { tx.beginPath(); tx.moveTo(x, y); tx.lineTo(x, y + 32); tx.stroke(); }
  const tileT = new T.CanvasTexture(tileC); tileT.colorSpace = T.SRGBColorSpace; tileT.wrapS = tileT.wrapT = T.RepeatWrapping; tileT.repeat.set(0.75, 0.75);
  const tile = contour(new T.MeshStandardMaterial({ map: tileT, roughness: 0.25 }), { coverage: 0, density: 10, glow: 1.8, ground: 0.5 });
  floorPlane(g, 6, 6.6, pbr('concrete', 1.2, { color: 0x8a8d90 }), 0, 0, 3.1);
  box(g, 0.2, 3.2, 6.6, -3, 1.6, 3.1, tile); box(g, 0.2, 3.2, 6.6, 3, 1.6, 3.1, tile);
  box(g, 6.2, 0.2, 6.6, 0, 3.2, 3.1, new T.MeshStandardMaterial({ color: 0x1a1d22 }), false);
  box(g, 2.4, 3.2, 0.2, -1.8, 1.6, 6.4, tile); box(g, 2.4, 3.2, 0.2, 1.8, 1.6, 6.4, tile); box(g, 1.2, 0.9, 0.2, 0, 2.75, 6.4, tile);
  // the end wall to the train, with the round hatch
  const endS = new T.Shape(); endS.moveTo(-3, 0); endS.lineTo(3, 0); endS.lineTo(3, 3.2); endS.lineTo(-3, 3.2); endS.lineTo(-3, 0);
  const hp = new T.Path(); hp.absarc(0, AX, 0.98, 0, Math.PI * 2, false); endS.holes.push(hp);
  const endW = new T.Mesh(new T.ExtrudeGeometry(endS, { depth: 0.2, bevelEnabled: false, curveSegments: 48 }), tile); endW.position.set(0, 0, 0.0); endW.receiveShadow = true; g.add(endW);
  const steel = pbr('steel', 1, { metalness: 0.9, roughness: 0.25, color: 0xd5dae0 });
  const hatchRing = new T.Mesh(new T.TorusGeometry(1.0, 0.07, 16, 72), steel); hatchRing.position.set(0, AX, 0.22); g.add(hatchRing);
  // the mosaic name tablet, MTA style, and the signs
  sign(g, ['BIGGER ON THE INSIDE ST'], 3.2, 0.42, v3(-2.88, 2.35, 3.0), Math.PI / 2, { bg: '#7a2e1c', ink: '#f2ead8', border: '#c9a050', font: 'Archivo' });
  sign(g, ['ALL TRAINS', 'ALL DIRECTIONS . AT ONCE'], 2.2, 0.55, v3(2.88, 2.4, 3.6), -Math.PI / 2, { bg: '#0a0a0a', ink: '#fff', glow: 1.3 });
  sign(g, ['STAND CLEAR OF THE CLOSING REALITY'], 2.4, 0.22, v3(0, 2.95, 0.25), 0, { bg: '#0a0a0a', ink: '#ffd84a', glow: 1.3, font: 'Plex, monospace' });
  for (const x of [-1.6, 0, 1.6]) { const t = prop('penn_turnstile', 1.05); t.position.set(x, 0, 3.4); g.add(t); }
  const mvm = new T.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.5, roughness: 0.4 });
  box(g, 0.7, 1.7, 0.5, 2.55, 0.85, 1.2, mvm);
  sign(g, ['METROCARD', 'SINGLE RIDE . UNLIMITED . ROUND TRIP TO NOWHERE'], 0.6, 0.35, v3(2.29, 1.35, 1.2), -Math.PI / 2, { bg: '#ffd84a', ink: '#0a0a0a' });
  for (let i = 0; i < 2; i++) { const p = ctx.m.posters[(i * 9 + 2) % ctx.m.posters.length]; poster(g, p.f, p.ar, v3(-2.88, 1.45, 5.2 - i * 1.4 - (i ? 0 : 0)), Math.PI / 2, 1.0, 90 + i); }
  const marks = ctx.m.stickers.filter((s) => s.kind === 'mark');
  for (let i = 0; i < 12; i++) { const s = marks[(i * 7 + 2) % marks.length]; sticker(g, s.f, s.ar, v3(2.88, 0.4 + rnd() * 1.6, 0.6 + rnd() * 5), -Math.PI / 2, 0.12 + rnd() * 0.1, (rnd() - 0.5)); }
  addThreshold(at(0, AX, 0), 2.6); addThreshold(at(0, 1.2, 6.4), 2.2);
  drips(g, v3(-0.6, 2.75, 6.28), v3(0.6, 2.75, 6.28), 16, 93, 1.3);
  const vl = new T.PointLight(0xfff1d8, 16, 10, 1.5); vl.position.set(0, 2.9, 3); g.add(vl);
  g.add(new T.HemisphereLight(0xdfe8ff, 0x2a2620, 0.5));

  // ---------- the train, which rolls ----------
  const roller = new T.Group(); roller.userData.dynamic = true; roller.position.set(0, AX, 0); g.add(roller);
  const wallM = new T.MeshStandardMaterial({ color: 0x7d848c, metalness: 0.75, roughness: 0.4 });
  const floorM = pbr('concrete', 0.6, { color: 0x4a4d52, roughness: 0.8 });
  const ceilM = new T.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.6 });
  const seatM = new T.MeshStandardMaterial({ color: 0xff8a1a, roughness: 0.4 });
  const seatM2 = new T.MeshStandardMaterial({ color: 0xffc21a, roughness: 0.4 });
  const winMat = new T.ShaderMaterial({
    uniforms: { uTime: shared.time },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */ `uniform float uTime; varying vec2 vUv; varying vec3 vW;
      float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
      void main(){
        float z = vW.z * 0.4 + uTime * 9.0;
        float lane = floor(vUv.y * 9.0);
        float s = smoothstep(0.85, 1.0, fract(z * (0.3 + h(lane) * 0.4) + h(lane + 3.0))) * step(0.5, h(lane + 7.0));
        vec3 c = vec3(0.01, 0.015, 0.03) + vec3(1.0, 0.85, 0.6) * s * 1.6 + vec3(0.0, 0.5, 0.8) * 0.05;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new T.Matrix4(), q = new T.Quaternion();
  const seats: T.Matrix4[] = [], seats2: T.Matrix4[] = [], poles: T.Matrix4[] = [], wins: T.Matrix4[] = [], lights: T.Matrix4[] = [];
  const holeS = (w: number, h: number) => { const s = new T.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, -h / 2);
    const p = new T.Path(); p.absarc(0, 0, 0.92, 0, Math.PI * 2, false); s.holes.push(p); return new T.ShapeGeometry(s, 40); };
  const endGeo = holeS(HW * 2, CEIL - FLOOR);
  for (let c = 0; c < CARS; c++) {
    const z0 = -c * CAR, zc = z0 - CAR / 2;
    box(roller, HW * 2, 0.08, CAR, 0, FLOOR - 0.04, zc, floorM, false);
    box(roller, HW * 2, 0.08, CAR, 0, CEIL + 0.04, zc, ceilM, false);
    box(roller, 0.08, CEIL - FLOOR, CAR, -HW - 0.04, (CEIL + FLOOR) / 2, zc, wallM, false);
    box(roller, 0.08, CEIL - FLOOR, CAR, HW + 0.04, (CEIL + FLOOR) / 2, zc, wallM, false);
    for (const z of [z0 - 0.05, z0 - CAR + 0.05]) { const e = new T.Mesh(endGeo, wallM); e.position.set(0, (CEIL + FLOOR) / 2 + 0.2, z); e.material.side = T.DoubleSide; roller.add(e); }
    for (let k = 0; k < 4; k++) {
      const sz = z0 - 1.2 - k * 3.9;
      for (const sx of [-1, 1]) {
        m.compose(v3(sx * (HW - 0.25), FLOOR + 0.45, sz - 1.0), q, v3(0.45, 0.1, 2.2)); (k % 2 ? seats2 : seats).push(m.clone());
        m.compose(v3(sx * (HW - 0.03), 0.05, sz - 1.0), q, v3(0.02, 0.62, 1.6)); wins.push(m.clone());
      }
      m.compose(v3(0, 0, sz - 2.6), q, v3(0.035, CEIL - FLOOR, 0.035)); poles.push(m.clone());
      m.compose(v3(0, CEIL - 0.02, sz - 1.0), q, v3(0.3, 0.03, 3.2)); lights.push(m.clone());
    }
    const lie = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0)); // grab bars: the cylinder's axis laid along the car
    for (const sx of [-0.62, 0.62]) { m.compose(v3(sx, CEIL - 0.28, zc), lie, v3(0.03, CAR - 0.4, 0.03)); poles.push(m.clone()); }
  }
  const inst = (list: T.Matrix4[], mat: T.Material, geo: T.BufferGeometry = new T.BoxGeometry(1, 1, 1)) => { const im = new T.InstancedMesh(geo, mat, list.length); list.forEach((x, i) => im.setMatrixAt(i, x)); roller.add(im); return im; };
  inst(seats, seatM); inst(seats2, seatM2);
  const poleMesh = inst(poles, steel, new T.CylinderGeometry(1, 1, 1, 12));
  inst(wins, winMat);
  inst(lights, new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f8ff, emissiveIntensity: 1.2 }));
  // the ads: New Yorkers in the card frames over the windows, posters at the car ends
  art.forEach((a, i) => {
    const c = Math.floor(i / 6), k = i % 6, sx = k % 2 ? 1 : -1, z = -c * CAR - 2.6 - Math.floor(k / 2) * 5.2;
    const grp = hang(roller, a, v3(sx * (HW - 0.02), 0.75, z), sx > 0 ? -Math.PI / 2 : Math.PI / 2, 0.95, { frame: 'chrome', label: false, pool: false });
    grp.group.rotateX(-0.12);
  });
  for (let c = 0; c < 4; c++) for (const sx of [-1, 1]) {
    const p = ctx.m.posters[(c * 4 + (sx > 0 ? 1 : 0) + 20) % ctx.m.posters.length];
    poster(roller, p.f, p.ar, v3(sx * 1.15, -0.1, -c * CAR - 0.12), Math.PI, 0.75, 100 + c * 2 + (sx > 0 ? 1 : 0));
  }
  // the map
  sign(roller, ['THE MAP', '1 . 2 . 3 . 4 . 5 . 6 . 7 . A . C . E . B . D . F . M . G . J . Z . L . N . Q . R . W . S . AND THE ONE TO HERE'], 1.4, 0.9, v3(-HW + 0.03, 0.25, -CAR + 1.2), Math.PI / 2, { bg: '#f0f4f8', ink: '#06163a' });
  // riders, who roll with the car and do not look up
  const NPC = ['npc_workgirl', 'npc_editor', 'npc_hustler', 'npc_actress', 'npc_wiseguy', 'npc_clerk', 'npc_cabbie'];
  NPC.forEach((n, i) => {
    const r = prop(n, 1.72); const c = Math.floor(i / 3), k = i % 3;
    r.position.set((k - 1) * 0.55 + (rnd() - 0.5) * 0.2, FLOOR, -c * CAR - 3 - k * 4.4 - rnd() * 1.5); r.rotation.y = rnd() * Math.PI * 2;
    if (k === 1 && i !== 4) r.position.x = rnd() < 0.5 ? -0.75 : 0.75;
    roller.add(r);
  });
  // the front of the train: a window into the tunnel, rushing
  const rush = new T.ShaderMaterial({ uniforms: { uTime: shared.time },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      float h(float x){ return fract(sin(x * 78.2) * 43758.5); }
      void main(){ vec2 p = vUv - 0.5; float a = atan(p.y, p.x), r = length(p);
        float lane = floor((a + 3.1416) / 6.2832 * 24.0);
        float d = fract(0.25 / max(r, 0.02) + uTime * (1.2 + h(lane)) + h(lane + 2.0));
        float s = smoothstep(0.9, 1.0, d) * step(0.55, h(lane + 9.0)) * smoothstep(0.03, 0.2, r);
        vec3 c = vec3(0.004, 0.006, 0.012) + vec3(1.0, 0.85, 0.55) * s * 2.0 + vec3(0.0, 0.3, 0.6) * 0.15 * smoothstep(0.5, 0.0, r);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const front = new T.Mesh(new T.CircleGeometry(0.92, 48), rush); front.position.set(0, 0.2, -CARS * CAR + 0.2); roller.add(front);
  // lights that roll with the car
  for (let c = 0; c < 3; c++) { const l = new T.PointLight(0xf4f8ff, 1.8, 12, 1.6); l.position.set(0, 0.6, -c * CAR - CAR / 2); roller.add(l); }
  void drips;

  let rolling = !ctx.still, roll = 0;
  const walk: Rect[] = [[-2.8, 0.25, 2.8, 6.6], [-0.42, -CARS * CAR + 0.5, 0.42, 0.9]];
  const block: Rect[] = [[-2.8, 3.15, -1.85, 3.65], [-1.35, 3.15, -0.25, 3.65], [0.25, 3.15, 1.35, 3.65], [1.85, 3.15, 2.8, 3.65], [2.2, 0.8, 2.9, 1.6]];
  return {
    id: 'subway', name: 'Bigger on the Inside St', line: 'This train is eight cars long and it rolls. Stand in the middle. Click a pole to hold on.',
    origin: O, group: g,
    spawn: { at: at(0, AX, 5.6), look: at(0, AX, -10) },
    views: [
      { name: 'The platform', note: 'The tablet is real mosaic. The station is not.', at: at(0.6, AX, 5.4), look: at(-2.9, 2.3, 3.0) },
      { name: 'In the car', note: 'The car rolls. You do not. The riders do not mind.', at: at(0, AX, -5), look: at(0, AX, -30) },
      { name: 'The front', note: 'Eight cars. Look back. Hold the pole.', at: at(0, AX, -CARS * CAR + 2.5), look: at(0, AX, -CARS * CAR) },
    ],
    doors: { street: { pos: at(0, 0, 6.3), rotY: Math.PI }, cam: { pos: at(0, 1.7, -2), rotY: Math.PI } },
    walk, block,
    bg: new T.Color(0x02040c), fog: new T.FogExp2(0x05070f, 0.012), exposure: 0.85,
    floorY: () => O.y,
    tick(_t, dt) { if (rolling) { roll += dt * 0.16; roller.rotation.z = roll; } },
    interact(o) {
      if (o === poleMesh) { rolling = !rolling; return rolling ? 'Let go. It is rolling again.' : 'Holding on. The car stops rolling, upside down or not.'; }
    },
    hud: () => `MANHATTAN BOUND . ${Math.round(((roll * 180) / Math.PI) % 360)} DEGREES`,
  };
}
