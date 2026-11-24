import * as T from 'three';
import { scan, prop, instanced, fontsReady, PHONE, loadGLB } from './scan';

/* THE BIG UPGRADE of the Department of Unreal Estate (2026-11-23).
   MLow: "as detailed and cool as my movies set gallery or the gallery I made Gary but even better".
   The loft read as a white box drawn in code: one colour walls, a flat slab for a ceiling, a code bagel, code
   bollards, code furniture. This file dresses it, zone by zone, with real models, scanned surfaces, built mouldings,
   signs in the house fonts and one optical illusion where a zone had none:
     the entrance   pressed tin ceiling, enamel pendants, painted brick, a real reception (desk, lamp, plants, chairs),
                    gold leaf window lettering, an open house board, and WELCOME HOME painted anamorphically on the
                    boards so it only reads from the door
     01 the bagel   the bagel is a real model now (our own cast from the Barney Greengrass room), on honed stone with
                    brass rope stanchions; its plinth carries the asking price as an agamograph: the price you see
                    depends on where you stand
     03 the ring    a brass floor inlay to stand on and the steel cables every real suspended work hangs from
     02 the studio  the tunnel is furnished with real furniture shrunk in step with the walls, so the forced
                    perspective holds a bed, a chair, boxes and a lamp, not just a checkerboard
     04 the commute subway tile, a slatted station bench, a station clock, an enamel station sign, a tile mosaic
   Placeholders for the Firefly plates are wired so the file can be swapped in (see FIREFLY in NOTES). */

const v3 = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

function canvas(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return { c, g: c.getContext('2d')! };
}
function canvasTex(c: HTMLCanvasElement, srgb = true) {
  const t = new T.CanvasTexture(c);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const ARCHIVO = (wt: number, px: number) => `${wt} ${px}px Archivo, 'Arial Narrow', sans-serif`;
const PLEX = (wt: number, px: number) => `${wt} ${px}px Plex, 'IBM Plex Mono', monospace`;
const SERIF = (px: number, italic = false) => `${italic ? 'italic ' : ''}400 ${px}px Serif, Georgia, serif`;

/** a sign whose canvas is redrawn once the webfonts land */
function sign(w: number, h: number, ppm: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, mat: Partial<T.MeshStandardMaterialParameters> = {}) {
  const { c, g } = canvas(Math.round(w * ppm), Math.round(h * ppm));
  const t = canvasTex(c);
  const paint = () => { g.clearRect(0, 0, c.width, c.height); draw(g, c.width, c.height); t.needsUpdate = true; };
  paint();
  fontsReady().then(paint);
  const m = new T.MeshStandardMaterial({ map: t, roughness: 0.55, ...mat });
  return new T.Mesh(new T.PlaneGeometry(w, h), m);
}

/* ---------- pressed tin: a 24 inch tile embossed in code (normal map), the scan being queued in Firefly ---------- */
function tinTextures() {
  const N = 512, { c, g } = canvas(N, N);
  const img = g.createImageData(N, N), hgt = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const u = x / N - 0.5, v = y / N - 0.5, r = Math.hypot(u, v), a = Math.atan2(v, u);
      const edge = Math.min(0.5 - Math.abs(u), 0.5 - Math.abs(v));
      let h = 0;
      h += Math.exp(-Math.pow((edge - 0.018) / 0.008, 2));                      // the bead round the tile
      h += 0.6 * (edge > 0.05 ? 1 : edge / 0.05) * (edge < 0.11 ? 1 : 0);      // raised field border
      h += 0.5 * Math.exp(-Math.pow((Math.max(Math.abs(u), Math.abs(v)) - 0.3) / 0.012, 2)); // inner square bead
      h += 0.9 * Math.exp(-Math.pow((r - 0.2) / 0.012, 2));                     // medallion ring
      const petal = Math.pow(Math.max(0, Math.cos(a * 4)), 3) * Math.exp(-Math.pow((r - 0.12) / 0.05, 2));
      h += 0.8 * petal;                                                          // eight petal rosette
      h += 0.9 * Math.exp(-Math.pow(r / 0.03, 2));                               // boss
      const dia = Math.abs(Math.abs(u) - Math.abs(v)) < 0.01 && r > 0.22 && Math.max(Math.abs(u), Math.abs(v)) < 0.29 ? 0.5 : 0;
      hgt[y * N + x] = h + dia;
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const at = (xx: number, yy: number) => hgt[((yy + N) % N) * N + ((xx + N) % N)];
      const dx = (at(x + 1, y) - at(x - 1, y)) * 3, dy = (at(x, y + 1) - at(x, y - 1)) * 3;
      const l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
      img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const normal = canvasTex(c, false);
  // colour: old ivory paint, darker in the recesses where a century of dust settles
  const col = canvas(N, N), ci = col.g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const k = 0.84 + Math.min(1, hgt[i]) * 0.16;
    ci.data[i * 4] = 246 * k; ci.data[i * 4 + 1] = 244 * k; ci.data[i * 4 + 2] = 239 * k; ci.data[i * 4 + 3] = 255;
  }
  col.g.putImageData(ci, 0, 0);
  const map = canvasTex(col.c);
  for (const t of [normal, map]) t.wrapS = t.wrapT = T.RepeatWrapping;
  return { normal, map };
}

/* ---------- the agamograph: a sawtooth relief carrying two pictures ----------
   Each tooth is a slope (A, faces the front and the left) and a riser (B, faces right). From the front or the left
   you read A; walk past on the right and every slope turns its back, so only B is left. */
function agamograph(w: number, h: number, n: number, depth: number, a: T.Material, b: T.Material) {
  const p = w / n;
  const pa: number[] = [], ua: number[] = [], pb: number[] = [], ub: number[] = [];
  const quad = (pos: number[], uv: number[], x0: number, z0: number, x1: number, z1: number, u0: number, u1: number) => {
    pos.push(x0, -h / 2, z0, x1, -h / 2, z1, x1, h / 2, z1, x0, -h / 2, z0, x1, h / 2, z1, x0, h / 2, z0);
    uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
  };
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + i * p, x1 = x0 + p;
    quad(pa, ua, x0, 0, x1, depth, i / n, (i + 1) / n);       // slope, rising to the right
    quad(pb, ub, x1, depth, x1, 0, i / n, (i + 1) / n);       // riser, facing +x
  }
  const geo = (pos: number[], uv: number[]) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  };
  const grp = new T.Group();
  grp.add(new T.Mesh(geo(pa, ua), a), new T.Mesh(geo(pb, ub), b));
  return grp;
}

/* ---------- anamorphic floor type: drawn on a picture plane facing the eye, then thrown onto the boards ---------- */
function anamorphicFloor(eye: T.Vector3, focus: T.Vector3, W: number, H: number, tex: T.Texture, y = 0.027) {
  const D = focus.clone().sub(eye).normalize();
  const R = new T.Vector3(1, 0, 0).sub(D.clone().multiplyScalar(D.x)).normalize();
  const U = new T.Vector3().crossVectors(R, D).normalize();
  const toFloor = (c: T.Vector3) => { const d = c.clone().sub(eye); const t = (y - eye.y) / d.y; return eye.clone().addScaledVector(d, t); };
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => toFloor(focus.clone().addScaledVector(R, (a * W) / 2).addScaledVector(U, (b * H) / 2)));
  const minX = Math.min(...corners.map((c) => c.x)), maxX = Math.max(...corners.map((c) => c.x));
  const minZ = Math.min(...corners.map((c) => c.z)), maxZ = Math.max(...corners.map((c) => c.z));
  const nx = 90, nz = 90, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const denom = focus.clone().sub(eye).dot(D);
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const p = v3(minX + ((maxX - minX) * i) / nx, y, minZ + ((maxZ - minZ) * j) / nz);
      const d = p.clone().sub(eye), q = eye.clone().addScaledVector(d, denom / d.dot(D)).sub(focus);
      pos.push(p.x, p.y, p.z);
      uv.push(q.dot(R) / W + 0.5, q.dot(U) / H + 0.5);
    }
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping;
  const m = new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.04, roughness: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const mesh = new T.Mesh(g, m);
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;
  return mesh;
}

/* ---------- crown moulding: a cove extruded along a wall ---------- */
function crown(len: number, mat: T.Material) {
  const s = new T.Shape();
  s.moveTo(0, -0.24); s.lineTo(0.018, -0.24); s.lineTo(0.018, -0.215); s.lineTo(0.03, -0.205);
  s.quadraticCurveTo(0.04, -0.06, 0.17, -0.035); s.lineTo(0.17, -0.02); s.lineTo(0.2, -0.015); s.lineTo(0.2, 0); s.lineTo(0, 0);
  const g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 10 });
  return new T.Mesh(g, mat);
}

/** a soft glowing disc for lamps that should read as on */
const glowMat = (c: number, k = 1) => new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k), toneMapped: true });

export type Upgrade = { tick: (t: number) => void; ready: Promise<unknown> };

export function upgrade(scene: T.Scene, codeBagel: T.Object3D, arts: () => { file: string }[]): Upgrade {
  const jobs: Promise<unknown>[] = [];
  const add = <O extends T.Object3D>(o: O, x = 0, y = 0, z = 0, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; scene.add(o); return o; };
  const paint = new T.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.62 });
  const brass = new T.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.28 });
  const steel = new T.MeshStandardMaterial({ color: 0x2d2f33, metalness: 0.85, roughness: 0.35 });
  const enamelBlack = new T.MeshStandardMaterial({ color: 0x141416, roughness: 0.3, metalness: 0.1 });

  /* ===== the shell: tin ceiling, brick, mouldings ===== */
  const tin = tinTextures();
  const tinMat = new T.MeshStandardMaterial({ map: tin.map, normalMap: tin.normal, color: 0xf6f9ff, emissive: 0x1c1e22, metalness: 0.12, roughness: 0.5 });
  tin.map.repeat.set(13.85 / 0.61, 32.4 / 0.61); tin.normal.repeat.copy(tin.map.repeat);
  tinMat.normalScale.set(0.9, 0.9);
  const ceil = add(new T.Mesh(new T.PlaneGeometry(13.85, 32.4), tinMat), 0, 4.603, -6);
  ceil.rotation.x = Math.PI / 2; ceil.receiveShadow = true; ceil.userData.firefly = 'ff_tin_ceiling';
  // Firefly: a real pressed tin scan replaces the code emboss when it lands (public/tex/ff_tin_ceiling.webp)
  new T.TextureLoader().load('tex/ff_tin_ceiling.webp', (t) => {
    t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.copy(tin.map.repeat); tinMat.map = t; tinMat.needsUpdate = true;
  }, undefined, () => {});

  // painted brick: the long party wall the art hangs on, and the back wall either side of the studio
  const brickE = add(new T.Mesh(new T.PlaneGeometry(32.4, 4.55), scan('brick', 1.8, 32.4, 4.55, { color: 0xffffff, normal: 1.4 })), 6.922, 2.33, -6, -Math.PI / 2);
  const brickBL = add(new T.Mesh(new T.PlaneGeometry(4.02, 4.55), scan('brick', 1.8, 4.02, 4.55, { color: 0xffffff, normal: 1.4 })), -4.91, 2.33, -21.972);
  for (const m of [brickE, brickBL]) m.receiveShadow = true;
  // crown cove along the brick and the back wall, painted skirting below
  add(crown(32.4, paint), 6.922, 4.603, 10.2, Math.PI);
  add(crown(4.02, paint), 6.92, 4.603, -21.972, -Math.PI / 2);
  add(crown(4.02, paint), -2.9, 4.603, -21.972, -Math.PI / 2);
  add(new T.Mesh(new T.BoxGeometry(0.05, 0.2, 32.3), paint), 6.895, 0.123, -6);
  add(new T.Mesh(new T.BoxGeometry(0.06, 0.03, 32.3), paint), 6.885, 0.235, -6);
  add(new T.Mesh(new T.BoxGeometry(4.02, 0.2, 0.05), paint), -4.91, 0.123, -21.948);

  /* ===== the entrance ===== */
  // WELCOME HOME, painted on the boards for one eye: the door. Everywhere else it is a smear.
  const wh = canvas(2048, 560);
  const whTex = canvasTex(wh.c);
  const drawWH = () => {
    const g = wh.g; g.clearRect(0, 0, 2048, 560);
    g.fillStyle = '#dce552'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = ARCHIVO(700, 300); g.fillText('WELCOME HOME', 1024, 330, 1960);
    g.font = PLEX(600, 62); g.fillText('PLEASE REMOVE YOUR SHOES AND YOUR EXPECTATIONS', 1024, 470, 1900);
    // wear: the paint has been walked on
    g.globalCompositeOperation = 'destination-out';
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) { g.globalAlpha = 0.15 + r() * 0.5; g.fillRect(r() * 2048, r() * 560, 2 + r() * 9, 1 + r() * 4); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    whTex.needsUpdate = true;
  };
  drawWH(); fontsReady().then(drawWH);
  const welcome = anamorphicFloor(v3(1, 1.65, 6.9), v3(1, 0, 1.45), 3.4, 0.93, whTex);
  welcome.userData.egg = 'welcome-home';
  scene.add(welcome);

  // gold leaf on the front glass, read from inside (the gallery side)
  const gold = sign(6.4, 1.2, 300, (g, W, H) => {
    g.textAlign = 'center'; g.fillStyle = '#fff';
    g.font = SERIF(H * 0.36, true); g.fillText('Department of', W / 2, H * 0.36);
    g.font = ARCHIVO(700, H * 0.42); g.fillText('UNREAL ESTATE', W / 2, H * 0.78, W * 0.96);
    g.font = PLEX(400, H * 0.1); g.fillText('LISTINGS  .  APPRAISALS  .  MIRACLES  .  EST. NEVER', W / 2, H * 0.95);
  });
  {
    const m = gold.material as T.MeshStandardMaterial;
    m.alphaMap = m.map; m.map = null; m.color.set(0xd8b062); m.metalness = 1; m.roughness = 0.22; m.transparent = true; m.side = T.DoubleSide;
    add(gold, 0, 3.15, 10.08, Math.PI);
  }

  // reception: a real steel tanker desk, an arm lamp, plants, two lounge chairs
  jobs.push(
    prop(scene, 'ph_metal_office_desk', { at: [1.7, 0.023, 8.45], rotY: 0, fit: 2.2 }),
    prop(scene, 'ph_desk_lamp_arm_01', { at: [2.45, 0.86, 8.6], rotY: -2.4, fitY: 0.62, shadow: false }),
    prop(scene, 'ph_potted_plant_01', { at: [-0.4, 0.023, 9.3], fitY: 1.5, shadow: false }),
    prop(scene, 'nyb_kramer_plant', { at: [3.95, 0.023, 9.3], fitY: 1.05, shadow: false }),
    prop(scene, 'ph_potted_plant_02', { at: [6.2, 0.023, 9.4], fitY: 1.0, shadow: false }),
    prop(scene, 'ph_mid_century_lounge_chair', { at: [-4.3, 0.023, 8.6], rotY: 2.6, fitY: 1.0 }),
    prop(scene, 'ph_mid_century_lounge_chair', { at: [-2.9, 0.023, 8.9], rotY: -2.7, fitY: 1.0 }),
  );
  // RECEPTION, an enamel blade hung from the joists over the desk, both faces
  for (const [z, ry] of [[8.43, 0], [8.47, Math.PI]] as const) {
    const s = sign(1.7, 0.42, 400, (g, W, H) => {
      g.fillStyle = '#151517'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#dce552'; g.lineWidth = H * 0.03; g.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
      g.fillStyle = '#f3efe4'; g.textAlign = 'center'; g.font = ARCHIVO(700, H * 0.42); g.fillText('RECEPTION', W / 2, H * 0.55);
      g.fillStyle = '#dce552'; g.font = PLEX(600, H * 0.13); g.fillText('ALL OFFERS FINAL. ALL FEES HIDDEN.', W / 2, H * 0.82);
    }, { roughness: 0.32 });
    add(s, 1.7, 3.35, z, ry);
  }
  for (const x of [1.05, 2.35]) add(new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 1.05, 4), steel), x, 4.08, 8.45);

  // OPEN HOUSE board by the door (the A frame is one of our own models, its face repainted)
  jobs.push(prop(scene, 'nyb_aframe_sign', { at: [-1.75, 0.023, 7.75], rotY: 0.5, fitY: 1.3 }).then((o) => {
    const draw = (g: CanvasRenderingContext2D, W: number, H: number) => {
      g.fillStyle = '#1d2321'; g.fillRect(0, 0, W, H);
      g.textAlign = 'center'; g.fillStyle = '#f3efe4';
      g.font = ARCHIVO(700, H * 0.13); g.fillText('OPEN HOUSE', W / 2, H * 0.2, W * 0.9);
      g.font = SERIF(H * 0.08, true); g.fillStyle = '#dce552'; g.fillText('today, and forever', W / 2, H * 0.31);
      g.fillStyle = '#f3efe4'; g.font = PLEX(400, H * 0.05);
      ['1 BR (THE HOLE)', 'CHEF\'S KITCHEN (A BAGEL)', 'NATURAL LIGHT (PAINTED)', 'NO BROKER FEE*'].forEach((l, i) => g.fillText(l, W / 2, H * (0.46 + i * 0.09)));
      g.font = PLEX(400, H * 0.032); g.fillText('*THE FEE IS THE BROKER', W / 2, H * 0.9);
    };
    // the board leans back about 14 degrees each way; a painted face just proud of each leaf
    for (const side of [1, -1]) {
      const face = sign(0.62, 0.78, 600, draw, { roughness: 0.9 });
      face.position.set(0, 0.74, side * 0.185); face.rotation.set(-0.25 * side, side > 0 ? 0 : Math.PI, 0);
      o.add(face);
    }
  }));

  /* ===== 01 the bagel ===== */
  const bagelPivot = add(new T.Group(), 1.25, 0.745, -2.9);
  jobs.push(prop(bagelPivot, 'barney_bagel', { at: [0, 0, 0], fit: 2.05 }).then((o) => {
    o.rotation.x = -0.08;
    codeBagel.visible = false;
    o.userData.egg = 'bagel';
  }).catch(() => { /* the code bagel stays */ }));
  // brass rope stanchions, a set on each side of the plinth (they were black code bollards)
  for (const [x, z, ry] of [[1.25, -1.62, 0], [1.25, -4.18, 0], [-0.22, -2.9, Math.PI / 2], [2.72, -2.9, Math.PI / 2]] as const)
    jobs.push(prop(scene, 'rope_stanchion', { at: [x, 0.023, z], rotY: ry, fit: ry ? 2.3 : 2.9 }));
  // the asking price: an agamograph across the plinth's face. From the door: $1,850. Walk past on the right: $18,500.
  const priceA = sign(2.0, 0.56, 700, (g, W, H) => {
    g.fillStyle = '#efe8d8'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#24241f'; g.textAlign = 'center';
    g.font = PLEX(600, H * 0.12); g.fillText('ASKING, FROM HERE', W / 2, H * 0.22);
    g.font = ARCHIVO(700, H * 0.52); g.fillText('$1,850 / MO', W / 2, H * 0.72, W * 0.94);
    g.font = PLEX(400, H * 0.08); g.fillText('RENT STABILIZED . HEAT INCLUDED . BAGEL INCLUDED', W / 2, H * 0.9);
  });
  const priceB = sign(2.0, 0.56, 700, (g, W, H) => {
    g.fillStyle = '#dce552'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#24241f'; g.textAlign = 'center';
    g.font = PLEX(600, H * 0.12); g.fillText('ASKING, FROM HERE', W / 2, H * 0.22);
    g.font = ARCHIVO(700, H * 0.52); g.fillText('$18,500 / MO', W / 2, H * 0.72, W * 0.94);
    g.font = PLEX(400, H * 0.08); g.fillText('MARKET RATE . FIRST, LAST, SECURITY, SOUL', W / 2, H * 0.9);
  });
  const ag = agamograph(2.0, 0.56, 22, 2.0 / 22, priceA.material as T.Material, priceB.material as T.Material);
  ag.userData.egg = 'asking-price';
  add(ag, 1.25, 0.37, -2.058);
  // brass plaque on the plinth's top edge
  const plaque = sign(0.9, 0.16, 900, (g, W, H) => {
    g.fillStyle = '#2a2418'; g.textAlign = 'left';
    g.font = ARCHIVO(700, H * 0.36); g.fillText('01 / THE EVERYTHING BAGEL', W * 0.03, H * 0.42);
    g.font = PLEX(400, H * 0.17); g.fillText('Lox, schmear, capers, red onion. Includes your security deposit.', W * 0.03, H * 0.78, W * 0.94);
  }, { metalness: 0.9, roughness: 0.3, color: 0xd7b36a });
  const pl = add(plaque, 1.25, 0.742, -2.13); pl.rotation.x = -1.1;

  /* ===== 03 circle back: a brass inlay to stand on, cables to hang from ===== */
  const inlay = add(new T.Mesh(new T.RingGeometry(0.3, 0.36, 64), brass), 1, 0.028, -7);
  inlay.rotation.x = -Math.PI / 2;
  const disc = sign(0.5, 0.5, 600, (g, W, H) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.48, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#000'; g.textAlign = 'center';
    g.font = ARCHIVO(700, H * 0.13); g.fillText('STAND', W / 2, H * 0.46); g.fillText('HERE', W / 2, H * 0.6);
    g.font = PLEX(600, H * 0.05); g.fillText('03 . LOOK UP', W / 2, H * 0.72);
  });
  {
    const m = disc.material as T.MeshStandardMaterial;
    m.alphaMap = m.map; m.map = null; m.color.set(0xc9a25a); m.metalness = 1; m.roughness = 0.3; m.transparent = true; m.alphaTest = 0.5;
    const d = add(disc, 1, 0.029, -7); d.rotation.x = -Math.PI / 2;
  }
  // the ring's 24 segments each hang from a cable to the joists, like every suspended work in a real loft
  {
    const eye = v3(1, 1.65, -7), center = v3(1, 2.7, -13), mats: T.Matrix4[] = [];
    for (let i = 0; i < 24; i++) {
      const th = ((i + 0.465) * Math.PI * 2) / 24, depth = 0.72 + (i % 4) * 0.18;
      const p = v3(center.x + Math.cos(th) * 1.1, center.y + Math.sin(th) * 1.1, center.z).sub(eye).multiplyScalar(depth).add(eye);
      const len = 4.6 - p.y;
      mats.push(new T.Matrix4().compose(v3(p.x, p.y + len / 2, p.z), new T.Quaternion(), v3(1, len, 1)));
    }
    const cables = new T.InstancedMesh(new T.CylinderGeometry(0.0022, 0.0022, 1, 4), steel, 24);
    mats.forEach((m, i) => cables.setMatrixAt(i, m));
    cables.computeBoundingSphere();
    scene.add(cables);
  }

  /* ===== 02 the studio: furniture shrunk in step with the tunnel ===== */
  // the tunnel (unreal.ts): depth t 0..1 runs z -22 to -28.72 and everything at t is scaled s = 1 - 0.83 t
  const inTunnel = (name: string, t: number, xr: number, ry: number, fitY: number) => {
    const s = 1 - 0.83 * t;
    return prop(scene, name, { at: [xr * s, 0.035, -22 - t * 6.72], rotY: ry, fitY: fitY * s, shadow: false });
  };
  jobs.push(
    inTunnel('ph_cardboard_box_01', 0.05, -1.25, 0.2, 0.5),
    inTunnel('ph_cardboard_box_01', 0.06, -1.3, -0.15, 0.5).then((o) => { o.position.y += 0.5 * 0.95; }),
    inTunnel('ph_cardboard_box_01', 0.09, -0.75, 0.5, 0.42),
    inTunnel('ph_old_bed_frame', 0.26, 1.15, 0, 1.2),
    inTunnel('ph_ArmChair_01', 0.5, -1.05, 0.6, 1.07),
    inTunnel('ph_side_table_01', 0.52, -0.25, 0, 0.55),
    inTunnel('ph_potted_plant_04', 0.53, -0.25, 0, 0.3).then((o) => { o.position.y += 0.55 * (1 - 0.83 * 0.52); }),
    inTunnel('ph_potted_plant_02', 0.78, 1.2, 0, 0.84),
    inTunnel('ph_mid_century_lounge_chair', 0.9, -1.1, 0.5, 1.17),
  );
  // a pendant in the tunnel, hung from its shrinking ceiling
  jobs.push(loadGLB('ph_hanging_industrial_lamp').then(() => {
    const t = 0.66, s = 1 - 0.83 * t;
    return instanced(scene, 'ph_hanging_industrial_lamp', [new T.Matrix4().compose(v3(0, 3.7 * s, -22 - t * 6.72), new T.Quaternion(), v3(s, s, s))], 1.2);
  }));
  // a moulded walnut casing inside the acid portal: the studio has a front door
  {
    const walnut = new T.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.45 });
    const casing = (w: number, h: number, x: number, y: number) => add(new T.Mesh(new T.BoxGeometry(w, h, 0.07), walnut), x, y, -21.95);
    casing(0.14, 3.72, -1.63, 1.86); casing(0.14, 3.72, 1.63, 1.86); casing(3.4, 0.16, 0, 3.66);
    for (const x of [-1.63, 1.63]) add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.09), walnut), x, 0.1, -21.94);
  }

  /* ===== 04 the commute ===== */
  const tile = add(new T.Mesh(new T.PlaneGeometry(4.02, 4.55), scan('subway', 1.27, 4.02, 4.55, { normal: 1.2 })), 4.91, 2.33, -21.972);
  tile.receiveShadow = true;
  // a mosaic band, as on every IND platform, in the house violet
  add(new T.Mesh(new T.BoxGeometry(4.02, 0.16, 0.02), new T.MeshStandardMaterial({ color: 0x7d70a8, roughness: 0.25 })), 4.91, 3.86, -21.96);
  // the station sign replaces the paper label: black enamel, white type, a line bullet
  const station = sign(2.7, 0.46, 500, (g, W, H) => {
    g.fillStyle = '#121214'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f3efe4'; g.fillRect(0, H * 0.06, W, H * 0.025);
    g.fillStyle = '#dce552'; g.beginPath(); g.arc(H * 0.5, H * 0.56, H * 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#121214'; g.textAlign = 'center'; g.font = ARCHIVO(700, H * 0.42); g.fillText('4', H * 0.5, H * 0.71);
    g.fillStyle = '#f3efe4'; g.textAlign = 'left'; g.font = ARCHIVO(700, H * 0.4); g.fillText('THE COMMUTE', H * 0.95, H * 0.62);
    g.font = PLEX(400, H * 0.11); g.fillText('You move. The city changes. Sit if you like.', H * 0.97, H * 0.86);
  }, { roughness: 0.25 });
  add(station, 4.6, 3.55, -21.52);
  jobs.push(
    prop(scene, 'quiet_bench', { at: [5.45, 0.023, -20.25], rotY: Math.PI / 2, fit: 2.35 }),
    prop(scene, 'ph_wall_clock', { at: [6.905, 2.55, -20.35], rotY: -Math.PI / 2, fitY: 0.5, seat: true }),
  );
  // a tile mosaic of a New Yorker on the platform wall; Firefly plate ff_commute_mosaic.webp replaces it
  {
    const mo = canvas(512, 512), mt = canvasTex(mo.c);
    const mm = new T.MeshStandardMaterial({ map: mt, roughness: 0.3 });
    const m = add(new T.Mesh(new T.PlaneGeometry(0.78, 0.78), mm), 6.43, 2.05, -21.965);
    m.userData.firefly = 'ff_commute_mosaic';
    const tessellate = (img: CanvasImageSource, iw: number, ih: number) => {
      const n = 40, sm = canvas(n, n);
      const k = Math.min(iw, ih); sm.g.drawImage(img, (iw - k) / 2, (ih - k) / 2, k, k, 0, 0, n, n);
      const d = sm.g.getImageData(0, 0, n, n).data, g = mo.g, cs = 512 / n;
      g.fillStyle = '#d9d3c4'; g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const i = (y * n + x) * 4, q = (v: number) => Math.round(v / 40) * 40 + 12;
        g.fillStyle = `rgb(${q(d[i])},${q(d[i + 1])},${q(d[i + 2])})`;
        g.fillRect(x * cs + 1.2, y * cs + 1.2, cs - 2.4, cs - 2.4);
      }
      g.strokeStyle = '#24241f'; g.lineWidth = 14; g.strokeRect(7, 7, 498, 498);
      mt.needsUpdate = true;
    };
    const tryArt = () => {
      const a = arts()[5];
      if (!a) { setTimeout(tryArt, 500); return; }
      const im = new Image(); im.onload = () => tessellate(im, im.width, im.height); im.src = a.file;
    };
    new T.TextureLoader().load('tex/ff_commute_mosaic.webp', (t) => { t.colorSpace = T.SRGBColorSpace; mm.map = t; mm.needsUpdate = true; }, undefined, tryArt);
  }

  /* ===== the back left wall: a ghost sign on the brick; Firefly ff_ghost_sign.webp replaces the code one ===== */
  {
    const gs = sign(3.7, 1.9, 300, (g, W, H) => {
      g.textAlign = 'center'; g.fillStyle = '#efe6cf';
      g.font = ARCHIVO(700, H * 0.26); g.fillText('ROOMS TO LET', W / 2, H * 0.3, W * 0.95);
      g.font = SERIF(H * 0.16, true); g.fillText('inquire within, if you can find it', W / 2, H * 0.5);
      g.font = ARCHIVO(700, H * 0.13); g.fillText('NO PETS . NO PLANTS . NO PEOPLE', W / 2, H * 0.7, W * 0.95);
      g.font = PLEX(600, H * 0.08); g.fillText('DEPT. OF UNREAL ESTATE . EST. NEVER', W / 2, H * 0.86);
      // a century of weather
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 4200; i++) { g.globalAlpha = Math.random() * 0.7; g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 14, 2 + Math.random() * 6); }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }, { transparent: true, roughness: 0.95, opacity: 0.82, depthWrite: false });
    const m = add(gs, -4.91, 3.15, -21.962);
    m.userData.firefly = 'ff_ghost_sign';
    new T.TextureLoader().load('tex/ff_ghost_sign.webp', (t) => {
      t.colorSpace = T.SRGBColorSpace; const mm = gs.material as T.MeshStandardMaterial; mm.map = t; mm.opacity = 1; mm.needsUpdate = true;
    }, undefined, () => {});
  }

  /* ===== the ceiling: enamel pendants down both lanes ===== */
  {
    const zs = PHONE ? [6.5, -1, -8.5, -16] : [7.2, 3.2, -0.8, -5.2, -9.4, -13.6, -17.8];
    const mats: T.Matrix4[] = [];
    for (const x of [-1.15, 3.55]) for (const z of zs) mats.push(new T.Matrix4().makeTranslation(x, 4.6, z));
    jobs.push(instanced(scene, 'ph_hanging_industrial_lamp', mats, 1.25).then(() => {
      const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.06, 12, 8), glowMat(0xffe2b0, 2.2), mats.length);
      mats.forEach((m, i) => bulbs.setMatrixAt(i, m.clone().multiply(new T.Matrix4().makeTranslation(0, -1.13, 0))));
      bulbs.computeBoundingSphere();
      scene.add(bulbs);
    }));
  }

  // every model and sign casts and takes the loft's light
  const ready = Promise.allSettled(jobs);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    ready,
    tick: (t: number) => { if (!still) bagelPivot.rotation.y = -0.4 + Math.sin(t * 0.22) * 0.6; },
  };
}
