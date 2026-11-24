// THE BIG UPGRADE (2026-11-23). MLow: "as detailed and cool as my movies set gallery or the gallery I made Gary but even
// better", real GLB centrepieces rather than code built objects, scanned materials, built architecture, signs, illusions.
// The park GLB stays the generator's; this file takes out the code built things that read as cheap (the hexagon trees,
// the pole lamps, the box benches) before the park is merged, and adds, per zone:
//   THE GATE       marquee bulbs that chase round the arch and the pylons, stone plinths, a hanging sign, two real carts,
//                  and an anamorphic STEP RIGHT UP painted on the grass that stands up only from where you arrive
//   THE BOARDWALK  real cast iron lamps and painted benches, a food court with a franks stand, gulls, and a lenticular
//                  board that says one thing walking in and another walking out
//   THE PLAZA      a working carousel: twenty real carved horses that rise and fall, brass poles, a mirrored drum, a
//                  striped canopy with a lit rim; an eye painted flat on the paving that stands up from the plaza spot
//   LUNA HALL      a polished terrazzo floor with brass inlay, skirting and dado, the Million Lights strung under the
//                  vault, a fountain and the Delacorte animals, and two end walls that open onto lights that never end
//   THE EYE WHEEL  a marquee sign over the queue, rope lines, a popcorn cart, an eye on the sign that follows you
//   BLOSSOM GP     garages with corrugated shutters and lit team boards along the pit building, tyre stacks, carts,
//                  pit wall boards, and the grid's name painted to stand up from the grid spot
//   everywhere     293 real trees (plane, willow, ginkgo and a pink blossom plane) where the hexagons stood, the
//                  nearest as full models, the rest as baked impostors, re-sorted twice a second
// ?up=0 skips all of it (the park as it was); the takeout list is REPLACE below.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const Q = new URLSearchParams(location.search);
export const UP = { on: Q.get('up') !== '0' };
export const REPLACE = /^(tree\d_|BW_Lamp|BW_Globe|BW_Bench|LH_Bench|Tire\d+_)/;

// ---------------------------------------------------------------- take out
// Called on the raw glTF scene before the park is merged: records where each replaced object stood and removes it.
export function takeOut(root) {
  const recs = [];
  if (!UP.on) return recs;
  root.updateMatrixWorld(true);
  const kill = new Set();
  root.traverse((o) => {
    if (o === root) return;
    if (kill.has(o.parent)) { kill.add(o); return; }
    if (REPLACE.test(o.name)) {
      kill.add(o);
      const box = new THREE.Box3().setFromObject(o);
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      o.matrixWorld.decompose(p, q, s);
      recs.push({ name: o.name, pos: p, ry: new THREE.Euler().setFromQuaternion(q, 'YXZ').y, box });
    }
  });
  for (const o of [...kill]) if (!kill.has(o.parent)) o.removeFromParent();
  return recs;
}

// ---------------------------------------------------------------- helpers
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const M4 = (x, y, z, ry = 0, s = 1) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), ry), V3(s, s, s));
let seed = 20261123; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

async function fonts() {
  const list = [['Archivo Expanded', 'fonts/ArchivoExpanded.woff2', '500 900'], ['Archivo Narrow', 'fonts/ArchivoNarrow-700.woff2', '700'],
    ['Permanent Marker', 'fonts/PermanentMarker-400.woff2', '400'], ['JetBrains Mono', 'fonts/JetBrainsMono.woff2', '400 800']];
  await Promise.all(list.map(async ([fam, url, w]) => {
    try { const f = new FontFace(fam, `url(${url})`, { weight: w }); await f.load(); document.fonts.add(f); } catch (e) { console.warn('font', fam, e); }
  }));
}

// a sign face drawn on a canvas in the house fonts. lines: [{t, font, size (fraction of height), color, y (0..1)}]
function signTex(w, h, { bg = '#0d0d0d', lines = [], border = null, bulbs = 0, ink = '#f0f4f8' } = {}, ANISO = 8) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  if (border) { g.strokeStyle = border; g.lineWidth = h * 0.05; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12); }
  if (bulbs) {                                                          // painted bulb border (the real bulbs are geometry)
    const r = h * 0.035, step = r * 3.2;
    for (let x = step; x < w - step / 2; x += step) for (const y of [h * 0.08, h * 0.92]) { g.fillStyle = '#ffe3b0'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const L of lines) {
    let size = L.size * h; g.font = `${L.weight || 800} ${size}px "${L.font || 'Archivo Expanded'}"`;
    const max = (L.max || 0.92) * w; let m = g.measureText(L.t).width;
    if (m > max) { size *= max / m; g.font = `${L.weight || 800} ${size}px "${L.font || 'Archivo Expanded'}"`; }
    if (L.track) g.letterSpacing = `${L.track * size}px`;
    g.fillStyle = L.color || ink; g.fillText(L.t, w / 2 + (L.x || 0) * w, (L.y ?? 0.5) * h);
    g.letterSpacing = '0px';
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t;
}

// ---------------------------------------------------------------- the build
export async function buildUpgrade(ctx) {
  const { scene, renderer, camera, touch, loader, recs, cast, ANISO, ph } = ctx;
  const colliders = [];
  const updaters = [];
  const root = new THREE.Group(); root.name = 'upgrade'; scene.add(root);
  if (!UP.on) return { colliders, update() {}, root };
  await fonts();
  // Firefly plates (queued in NEW YORKERS SITE/_build/museum/FIREFLY_QUEUE.md, room column gardens): a plate is drawn
  // only when its file is in assets/ff/ AND listed in assets/ff/manifest.json, so nothing 404s while the queue runs.
  const ffList = await fetch('assets/ff/manifest.json').then((r) => r.json()).catch(() => []);
  const ff = (file) => ffList.includes(file) ? new Promise((res) => new THREE.TextureLoader().load(`assets/ff/${file}`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; res(t); }, undefined, () => res(null))) : Promise.resolve(null);
  const ffPlate = async (file, w, h, x, y, z, ry, emissive = 0.15) => {
    const t = await ff(file); if (!t) return null;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: emissive }));
    m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; root.add(m); return m;
  };
  const ground = (x, z, from = 30) => { const h = cast(V3(x, from, z), V3(0, -1, 0), from + 20); return h ? h.point.y : 0; };
  const box = (cx, cy, cz, sx, sy, sz, ry = 0) => {
    const g = new THREE.BoxGeometry(sx, sy, sz); g.applyMatrix4(M4(cx, cy, cz, ry)); g.deleteAttribute('normal'); g.deleteAttribute('uv'); colliders.push(g.toNonIndexed());
  };

  // GLB props, fitted: base at y 0, centred on x and z, scaled to a height (h) or a length (len, the longest of x and z)
  const cache = new Map();
  const glb = (name) => {
    if (!cache.has(name)) cache.set(name, new Promise((res) => loader.load(`assets/props/${name}.glb`, (g) => res(g.scene), undefined, (e) => { console.warn('prop', name, e); res(null); })));
    return cache.get(name);
  };
  async function prop(name, { h, len, yaw = 0, tilt = 0, shadow = true } = {}) {
    const src = await glb(name); if (!src) return null;
    const o = src.clone(true); o.rotation.set(tilt, yaw, 0); o.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(o), sz = b.getSize(V3());
    const s = h ? h / sz.y : len ? len / Math.max(sz.x, sz.z) : 1;
    const w = new THREE.Group(); o.scale.multiplyScalar(s); o.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(o); o.position.set(-(b2.min.x + b2.max.x) / 2, -b2.min.y, -(b2.min.z + b2.max.z) / 2);
    w.add(o);
    w.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = shadow; m.receiveShadow = true;
      for (const mt of [].concat(m.material)) { for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (mt[k]) mt[k].anisotropy = ANISO; mt.envMapIntensity = 1; }
    });
    w.userData.size = new THREE.Box3().setFromObject(w).getSize(V3());
    return w;
  }
  // one InstancedMesh per mesh of a fitted prop, one draw call per part however many copies
  function instanced(w, mats, { shadow = true } = {}) {
    w.updateMatrixWorld(true);
    const g = new THREE.Group(); const parts = [];
    w.traverse((m) => {
      if (!m.isMesh) return;
      const im = new THREE.InstancedMesh(m.geometry, m.material, Math.max(1, mats.length));
      const local = m.matrixWorld.clone();
      mats.forEach((M, i) => im.setMatrixAt(i, M.clone().multiply(local)));
      im.count = mats.length; im.castShadow = shadow; im.receiveShadow = true; im.userData.local = local;
      im.computeBoundingSphere(); g.add(im); parts.push(im);
    });
    g.userData.parts = parts;
    g.userData.set = (i, M) => { for (const im of parts) { im.setMatrixAt(i, M.clone().multiply(im.userData.local)); im.instanceMatrix.needsUpdate = true; } };
    return g;
  }
  const place = (w, x, y, z, ry = 0) => { const c = w.clone(true); c.position.set(x, y, z); c.rotation.y = ry; root.add(c); return c; };

  // materials made here
  const T = (id, color, rep = 1) => {
    const set = ph(id); const m = new THREE.MeshStandardMaterial({ map: set.c, normalMap: set.n, roughnessMap: set.r, color: color ?? 0xffffff, roughness: 1 });
    m.userData.rep = rep; return m;
  };
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.28 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe8edf2, metalness: 1, roughness: 0.06 });
  const ink = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.55, metalness: 0.3 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf0e6d2, roughness: 0.6 });
  const bulbOn = new THREE.Color(2.6, 2.05, 1.35), bulbOff = new THREE.Color(0.35, 0.27, 0.2);
  const bulbGeo = new THREE.SphereGeometry(0.085, 10, 6);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
  function bulbs(points, { chase = 0, size = 1 } = {}) {
    const im = new THREE.InstancedMesh(bulbGeo, bulbMat, points.length);
    points.forEach((p, i) => { im.setMatrixAt(i, M4(p.x, p.y, p.z, 0, size)); im.setColorAt(i, bulbOn); });
    im.castShadow = false; im.computeBoundingSphere(); root.add(im);
    if (chase) {
      let t = 0, step = 0;
      updaters.push((dt) => {
        t += dt; if (t < 0.16) return; t = 0; step++;
        for (let i = 0; i < points.length; i++) im.setColorAt(i, (i + step) % chase === 0 ? bulbOff : bulbOn);
        im.instanceColor.needsUpdate = true;
      });
    }
    return im;
  }
  // box UVs in metres for a built piece, so scanned textures tile at their real size
  function boxUVs(geo, rep) {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i)); let u, v;
      if (ny >= nx && ny >= nz) { u = p.getX(i); v = p.getZ(i); } else if (nx >= nz) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
      uv[2 * i] = u / rep; uv[2 * i + 1] = v / rep;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
  }
  // a built static piece: geometry in world space, merged per material at the end
  const built = new Map();
  function piece(geo, mat, { x = 0, y = 0, z = 0, ry = 0, collide = false } = {}) {
    geo.applyMatrix4(M4(x, y, z, ry));
    if (mat.userData.rep) boxUVs(geo, mat.userData.rep);
    if (!built.has(mat)) built.set(mat, []);
    built.get(mat).push(geo.index ? geo.toNonIndexed() : geo);
    if (collide) { const c = geo.clone(); c.deleteAttribute('normal'); c.deleteAttribute('uv'); colliders.push(c.index ? c.toNonIndexed() : c); }
  }
  const B = (sx, sy, sz) => new THREE.BoxGeometry(sx, sy, sz);

  // ---------- the anamorphic painter: a picture on a virtual upright board, projected onto the ground from one eye
  // The fragment shader casts the ray from the eye through each ground point back to the board, so the painting is exact
  // from that eye and a long stretched smear from anywhere else.
  function anamorph({ eye, o, right, up, w, h, tex, gy, tint = 0xffffff, rough = 0.85 }) {
    const N = new THREE.Vector3().crossVectors(right, up).normalize();
    const corners = [[0, 0], [w, 0], [0, h], [w, h]].map(([a, b]) => o.clone().addScaledVector(right, a).addScaledVector(up, b));
    const pts = corners.map((c) => { const d = c.clone().sub(eye); const t = (gy - eye.y) / d.y; return eye.clone().addScaledVector(d, t > 0 && isFinite(t) ? Math.min(t, 60) : 60); });
    const bb = new THREE.Box2(); pts.forEach((p) => bb.expandByPoint(new THREE.Vector2(p.x, p.z)));
    bb.expandByScalar(0.5);
    const geo = new THREE.PlaneGeometry(bb.max.x - bb.min.x, bb.max.y - bb.min.y, 1, 1); geo.rotateX(-Math.PI / 2);
    geo.translate((bb.min.x + bb.max.x) / 2, gy + 0.025, (bb.min.y + bb.max.y) / 2);
    const m = new THREE.MeshStandardMaterial({ map: tex, color: tint, roughness: rough, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uEye: { value: eye }, uO: { value: o }, uR: { value: right }, uU: { value: up }, uN: { value: N }, uWH: { value: new THREE.Vector2(w, h) } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform vec3 uEye, uO, uR, uU, uN; uniform vec2 uWH;')
        .replace('#include <map_fragment>', `
          vec3 rd = vWP - uEye; float s = dot(uO - uEye, uN) / dot(rd, uN);
          vec3 P = uEye + rd * s; vec2 auv = vec2(dot(P - uO, uR) / uWH.x, dot(P - uO, uU) / uWH.y);
          if (s <= 0.0 || auv.x < 0.0 || auv.x > 1.0 || auv.y < 0.0 || auv.y > 1.0) discard;
          vec4 tx = texture2D(map, auv);
          if (tx.a < 0.04) discard;
          diffuseColor *= tx;`);
    };
    const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = true; mesh.renderOrder = 1; root.add(mesh);
    return mesh;
  }

  const jobs = [];

  // =========================================================== EVERYWHERE: the trees
  jobs.push((async () => {
    const trees = recs.filter((r) => /^tree\d_/.test(r.name));
    if (!trees.length) return;
    const KIND = { egreen: 'tree_plane', mint: 'tree_willow', bone: 'tree_ginkgo', blossompink: 'tree_plane' };
    const types = {};
    for (const r of trees) {
      const k = (r.name.match(/^tree\d_([a-z]+)/) || [])[1] || 'egreen';
      const key = k === 'blossompink' ? 'pink' : KIND[k] || 'tree_plane';
      const h0 = r.box.max.y - r.box.min.y;
      (types[key] ||= []).push({ pos: V3(r.pos.x, r.box.min.y, r.pos.z), s: THREE.MathUtils.clamp(h0 * 1.35, 6.5, 13), ry: rnd() * 6.283 });
      box(r.pos.x, r.box.min.y + 1.5, r.pos.z, 0.7, 3, 0.7);
    }
    const NEAR = touch ? 14 : 56;
    const all = [];
    const lod = [];
    for (const [key, list] of Object.entries(types)) {
      const w = await prop(key === 'pink' ? 'tree_plane' : key, { h: 1 });
      if (!w) continue;
      if (key === 'pink') w.traverse((m) => {
        if (!m.isMesh) return;
        const leaf = /leaf|leav|foli|crown|canopy/i.test(m.material.name) || m.material.alphaTest > 0 || m.material.transparent;
        if (!leaf) return;
        const pm = m.material.clone(); m.material = pm;
        pm.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          float L = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.52, 0.62) * (0.3 + L * 1.9), 0.9);`); };
      });
      // the impostor: the model drawn once from the side into a texture, on two crossed cards
      const sz = w.userData.size, cw = Math.max(sz.x, sz.z) * 1.02, ch = sz.y * 1.02;
      const rt = new THREE.WebGLRenderTarget(512, Math.round(512 * ch / cw), { type: THREE.HalfFloatType });
      rt.texture.generateMipmaps = true; rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
      const bs = new THREE.Scene(); const bw = w.clone(true); bs.add(bw, new THREE.HemisphereLight(0xc4d6f7, 0x6a5a40, 1.4));
      const dl = new THREE.DirectionalLight(0xffd7a8, 2.6); dl.position.set(-3, 2, 4); bs.add(dl);
      const oc = new THREE.OrthographicCamera(-cw / 2, cw / 2, ch, 0, -50, 50); oc.position.set(0, 0, 10);
      const prevC = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha(), prevRT = renderer.getRenderTarget();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(bs, oc);
      renderer.setRenderTarget(prevRT); renderer.setClearColor(prevC, prevA);
      const card = mergeGeometries([new THREE.PlaneGeometry(cw, ch).translate(0, ch / 2, 0), new THREE.PlaneGeometry(cw, ch).translate(0, ch / 2, 0).rotateY(Math.PI / 2)]);
      const im = new THREE.InstancedMesh(card, new THREE.MeshBasicMaterial({ map: rt.texture, alphaTest: 0.45, side: THREE.DoubleSide, color: 0xd8d8d8 }), list.length);
      im.castShadow = false; im.receiveShadow = false; im.frustumCulled = false; root.add(im);
      const near = instanced(w, new Array(NEAR).fill(new THREE.Matrix4()));
      near.userData.parts.forEach((p) => { p.frustumCulled = false; p.count = 0; }); root.add(near);
      for (const t of list) { t.M = M4(t.pos.x, t.pos.y, t.pos.z, t.ry, t.s); t.key = key; all.push(t); }
      lod.push({ key, list, im, near });
    }
    let acc = 1;
    const cp = V3();
    updaters.push((dt) => {
      acc += dt; if (acc < 0.5) return; acc = 0;
      cp.copy(camera.position);
      for (const t of all) t.d = (t.pos.x - cp.x) ** 2 + (t.pos.z - cp.z) ** 2;
      const sorted = all.slice().sort((a, b) => a.d - b.d);
      const nearSet = new Set(sorted.slice(0, NEAR).filter((t) => t.d < 170 * 170));
      for (const L of lod) {
        let n = 0, f = 0;
        for (const t of L.list) {
          if (nearSet.has(t)) { for (const p of L.near.userData.parts) p.setMatrixAt(n, t.M.clone().multiply(p.userData.local)); n++; }
          else L.im.setMatrixAt(f++, t.M);
        }
        for (const p of L.near.userData.parts) { p.count = n; p.instanceMatrix.needsUpdate = true; }
        L.im.count = f; L.im.instanceMatrix.needsUpdate = true;
      }
      ctx.shadowDirty?.();
    });
  })());

  // =========================================================== THE GATE
  jobs.push((async () => {
    const gz = 238;
    // marquee bulbs: under and over the arch beam, front and back, and up the four outer edges of each pylon
    const pts = [];
    for (let x = -13.2; x <= 13.21; x += 0.55) for (const z of [gz + 1.98, gz - 1.98]) { pts.push(V3(x, 12.86, z), V3(x, 18.12, z)); }
    for (const px of [-10, 10]) for (let y = 0.9; y <= 12.4; y += 0.55) for (const dx of [-1.83, 1.83]) for (const z of [gz + 1.83, gz - 1.83]) pts.push(V3(px + dx, y, z));
    bulbs(pts, { chase: 3 });
    // stone plinths and a cornice band on the pylons (built, scanned stone)
    const stone = T('concrete_floor_02', 0xd9d2c4, 2.5);
    for (const px of [-10, 10]) {
      piece(B(4.6, 1.3, 4.6), stone, { x: px, y: 0.65, z: gz, collide: true });
      piece(B(4.1, 0.25, 4.1), stone, { x: px, y: 1.42, z: gz });
      piece(B(4.0, 0.35, 4.0), brass, { x: px, y: 12.62, z: gz });
    }
    // the hanging sign under the arch, both faces
    const front = signTex(2048, 160, { bg: '#0d0d0d', lines: [{ t: 'TEN COASTERS  ·  ONE EYE  ·  ZERO TICKETS', size: 0.46, color: '#f0f4f8', track: 0.08 }], border: '#c9a25a' }, ANISO);
    const back = signTex(2048, 160, { bg: '#0d0d0d', lines: [{ t: 'COME BACK TOMORROW. IT WILL HAVE MOVED.', size: 0.44, color: '#f0f4f8', track: 0.06 }], border: '#c9a25a' }, ANISO);
    const sw = 15, sh = sw * 160 / 2048;
    for (const [t, z, ry] of [[front, gz + 0.07, 0], [back, gz - 0.07, Math.PI]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35 }));
      m.position.set(0, 10.5, z); m.rotation.y = ry; root.add(m);
    }
    piece(B(sw + 0.3, sh + 0.3, 0.12), ink, { x: 0, y: 10.5, z: gz });
    for (const x of [-6.5, 6.5]) piece(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 6), brass, { x, y: 12.0, z: gz });
    // Firefly sideshow banners over the two ticket booths (queued)
    ffPlate('booth_banner_l.webp', 3.9, 1.3, -20, 4.45, 223.55, 0, 0.2); ffPlate('booth_banner_r.webp', 3.9, 1.3, 20, 4.45, 223.55, 0, 0.2);
    // two real carts at the gate, outside the arch, turned to the visitor
    const hot = await prop('hotdog', { h: 2.1 }), pop = await prop('popcorn', { h: 1.95 }), sign = await prop('nyb_aframe_sign', { h: 1.15 });
    const gy = ground(14.5, 246);
    if (hot) { place(hot, 14.5, gy, 246, -0.5); box(14.5, gy + 1, 246, 1.6, 2, 1.6); }
    if (pop) { place(pop, -14.5, gy, 246, 0.5); box(-14.5, gy + 1, 246, 1.3, 2, 1.6); }
    if (sign) { place(sign, 7.4, gy, 257, 0.35); place(sign, -7.4, gy, 257, -0.35); }
    // THE ILLUSION: STEP RIGHT UP, painted flat on the grass, stands up as a board seven metres ahead from the gate spot
    const ey = ground(0, 262) + 1.65;
    const art = signTex(1024, 212, { bg: null, lines: [
      { t: 'STEP RIGHT UP', size: 0.5, color: '#f0f4f8', y: 0.36, font: 'Archivo Expanded', weight: 900 },
      { t: 'the first New Yorker is waiting', size: 0.2, color: '#d7ff1f', y: 0.8, font: 'Permanent Marker', weight: 400 }] }, ANISO);
    const backing = signTex(1024, 212, { bg: 'rgba(214,30,70,0.82)' }, ANISO);
    // the board's top must stay well under the eye, or its projection runs off through the gate: 0.95 m at 8 m ahead
    // paints about 14 m of grass, from 254 to 240
    const g0 = ground(0, 254), E = V3(0, ey, 262);
    anamorph({ eye: E, o: V3(-2.4, g0 + 0.04, 254), right: V3(1, 0, 0), up: V3(0, 1, 0), w: 4.8, h: 0.95, tex: backing, gy: g0 });
    anamorph({ eye: E, o: V3(-2.25, g0 + 0.1, 254), right: V3(1, 0, 0), up: V3(0, 1, 0), w: 4.5, h: 0.82, tex: art, gy: g0 + 0.006 });
  })());

  // =========================================================== THE BOARDWALK
  jobs.push((async () => {
    const lamps = recs.filter((r) => /^BW_Lamp(-1|1)_/.test(r.name) && !/Arm/.test(r.name));
    const lp = await prop('lamppost', { h: 5.6 });
    if (lp && lamps.length) {
      const mats = lamps.map((r) => M4(r.pos.x, ground(r.pos.x, r.pos.z), r.pos.z, r.pos.x < 0 ? Math.PI / 2 : -Math.PI / 2));
      root.add(instanced(lp, mats));
      for (const r of lamps) box(r.pos.x, 2.5, r.pos.z, 0.4, 5, 0.4);
    }
    // benches: two painted benches where each box bench stood, seat to the boardwalk
    const seats = recs.filter((r) => /^BW_Bench(-1|1)_/.test(r.name));
    const pb = await prop('ph_painted_wooden_bench', { len: 1.85 });
    if (pb && seats.length) {
      const mats = [];
      for (const r of seats) for (const dz of [-1.05, 1.05]) mats.push(M4(r.pos.x, ground(r.pos.x, r.pos.z + dz), r.pos.z + dz, r.pos.x < 0 ? Math.PI / 2 : -Math.PI / 2));
      root.add(instanced(pb, mats));
      for (const r of seats) box(r.pos.x, 0.5, r.pos.z, 0.6, 1, 4.2);
    }
    // the food courts: a franks stand, a cart, barrels and the crowd's own tables
    const franks = await prop('nyb_coney_franks', { len: 3.4 }), barrel = await prop('nyb_coney_barrel', { h: 0.95 }), hot = await prop('hotdog', { h: 2.1 });
    for (const sx of [-1, 1]) {
      const cx = 22.5 * sx, gy = ground(cx, 135);
      if (franks) { place(franks, cx + 4 * sx, gy, 128, sx > 0 ? -Math.PI / 2 : Math.PI / 2); box(cx + 4 * sx, gy + 1.2, 128, 1.4, 2.4, 3.6); }
      ffPlate('franks_menu.webp', 3.2, 1.6, cx + 4 * sx, gy + 3.4, 128, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 0.2);
      if (barrel) for (const [dx, dz] of [[-2, 141], [2.6, 143.5], [-3.2, 146]]) { place(barrel, cx + dx, gy, dz, rnd() * 6); box(cx + dx, gy + 0.5, dz, 0.6, 1, 0.6); }
      if (hot && sx < 0) { place(hot, cx - 3, gy, 140, Math.PI / 2); box(cx - 3, gy + 1, 140, 1.6, 2, 1.6); }
    }
    // gulls circling the boardwalk, and two on the lamp heads
    const gull = await prop('gull', { len: 0.95, shadow: false });
    if (gull) {
      const flock = [];
      for (let i = 0; i < 7; i++) { const g = place(gull, 0, 0, 0); flock.push({ g, r: 8 + rnd() * 18, c: V3((rnd() - 0.5) * 16, 11 + rnd() * 9, 120 + rnd() * 90), w: (0.25 + rnd() * 0.2) * (rnd() < 0.5 ? -1 : 1), a: rnd() * 6.28 }); }
      updaters.push((dt) => { for (const f of flock) { f.a += f.w * dt; f.g.position.set(f.c.x + Math.cos(f.a) * f.r, f.c.y + Math.sin(f.a * 3) * 0.6, f.c.z + Math.sin(f.a) * f.r); f.g.rotation.set(0, -f.a + (f.w > 0 ? Math.PI : 0), Math.sin(f.a * 2) * 0.25); } });
      if (lamps.length) for (const r of lamps.filter((_, i) => i % 7 === 2)) place(gull, r.pos.x, ground(r.pos.x, r.pos.z) + 5.55, r.pos.z, rnd() * 6);
    }
    // THE ILLUSION: a lenticular board on the south fountain deck. Walking in (north) it reads one line, walking back
    // out (south) the other: vertical prism slats carry a strip of each picture on their two faces.
    const A = signTex(1536, 512, { bg: '#0d0d0d', lines: [{ t: 'THE RIDES', size: 0.3, y: 0.34, color: '#f0f4f8', weight: 900 }, { t: 'ARE THIS WAY', size: 0.2, y: 0.68, color: '#00e5ff', weight: 900 }], border: '#ff2e63' }, ANISO);
    const Bt = signTex(1536, 512, { bg: '#0d0d0d', lines: [{ t: 'NOBODY LEAVES', size: 0.22, y: 0.32, color: '#f0f4f8', weight: 900 }, { t: 'CONEY EARLY', size: 0.24, y: 0.66, color: '#d7ff1f', weight: 900 }], border: '#ff2e63' }, ANISO);
    const W = 6, H = 2, N = 48, dep = W / N / 2;
    const pos = [], uv = [], gA = [], gB = [];
    // standing at the board and facing it from either side, the picture reads left to right towards -z, so u runs
    // down z; slat i carries image columns [1 - (i+1)/N, 1 - i/N] on BOTH faces, A on the south face, B on the north
    const quad = (a, b, uA, uB, list) => { const s0 = pos.length / 3; pos.push(a.x, 0, a.z, b.x, 0, b.z, b.x, H, b.z, a.x, H, a.z); uv.push(uA, 0, uB, 0, uB, 1, uA, 1); list.push(s0, s0 + 1, s0 + 2, s0, s0 + 2, s0 + 3); };
    for (let i = 0; i < N; i++) {
      const z0 = -W / 2 + (i * W) / N, z1 = z0 + W / N, zm = (z0 + z1) / 2, ua = 1 - i / N, ub = 1 - (i + 1) / N;
      quad({ x: 0, z: z0 }, { x: dep, z: zm }, ua, ub, gA);     // faces +x and -z: read by whoever walks back out
      quad({ x: dep, z: zm }, { x: 0, z: z1 }, ua, ub, gB);     // faces +x and +z: read walking in from the gate
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex([...gA, ...gB]); geo.addGroup(0, gA.length, 0); geo.addGroup(gA.length, gB.length, 1); geo.computeVertexNormals();
    const lent = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ map: Bt, roughness: 0.45, emissive: 0xffffff, emissiveMap: Bt, emissiveIntensity: 0.25, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ map: A, roughness: 0.45, emissive: 0xffffff, emissiveMap: A, emissiveIntensity: 0.25, side: THREE.DoubleSide })]);
    const lx = -10.6, lz = 186, ly = ground(-8, 186) + 0.9;
    lent.position.set(lx, ly, lz); lent.castShadow = true; root.add(lent);
    piece(B(0.14, H + 0.3, W + 0.3), ink, { x: lx - 0.08, y: ly + H / 2, z: lz, collide: true });
    for (const dz of [-W / 2 - 0.1, W / 2 + 0.1]) piece(B(0.18, ly + H + 0.2, 0.18), ink, { x: lx, y: (ly + H + 0.2) / 2, z: lz + dz, collide: true });
  })());

  // =========================================================== THE PLAZA: the carousel
  jobs.push((async () => {
    const cx = 0, cz = -15, gy = ground(cx, cz), R = 6.6;
    const car = new THREE.Group(); car.position.set(cx, gy, cz); root.add(car);
    const deckWood = T('weathered_brown_planks', 0xb89a7a, 2);
    const disc = (r, h, m, y, seg = 48) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); me.position.y = y; me.castShadow = me.receiveShadow = true; car.add(me); return me; };
    // static parts: the base ring and the step, collided as a solid drum
    piece(new THREE.CylinderGeometry(R + 0.6, R + 0.75, 0.3, 64), T('concrete_floor_02', 0xcfc8ba, 2), { x: cx, y: gy + 0.15, z: cz });
    const pts = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push(V3(cx + Math.cos(a) * (R + 0.5), gy + 1.2, cz + Math.sin(a) * (R + 0.5))); }
    for (let i = 0; i < 24; i++) { const a = pts[i], b = pts[(i + 1) % 24]; const mid = a.clone().add(b).multiplyScalar(0.5); box(mid.x, mid.y, mid.z, a.distanceTo(b) + 0.1, 2.4, 0.4, -Math.atan2(b.z - a.z, b.x - a.x)); }
    // the turning parts
    const spin = new THREE.Group(); car.add(spin);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.34, 64), [new THREE.MeshStandardMaterial({ color: 0x8a1e2c, roughness: 0.5 }), deckWood, deckWood]);
    top.position.y = 0.47; top.castShadow = top.receiveShadow = true; spin.add(top);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(R, 0.06, 8, 96), brass); edge.rotation.x = Math.PI / 2; edge.position.y = 0.64; spin.add(edge);
    // the mirrored drum in the middle: sixteen chrome panels in brass frames
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4.2, 16, 1, true), chrome); drum.position.y = 2.75; spin.add(drum);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const f = new THREE.Mesh(B(0.08, 4.2, 0.08), brass); f.position.set(Math.cos(a) * 1.52, 2.75, Math.sin(a) * 1.52); spin.add(f); }
    const rim = signTex(4096, 256, { bg: '#f0e6d2', lines: [{ t: 'MLOW GARDENS  ·  THE CAROUSEL  ·  EVERY HORSE IS A NEW YORKER  ·  MLOW GARDENS  ·  THE CAROUSEL  ·  RIDE IT FOREVER', size: 0.42, color: '#8a1e2c', track: 0.05, max: 0.98 }], border: '#c9a25a' }, ANISO);
    rim.wrapS = THREE.RepeatWrapping;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.25, R + 0.25, 0.9, 96, 1, true), new THREE.MeshStandardMaterial({ map: rim, roughness: 0.55, emissive: 0xffffff, emissiveMap: rim, emissiveIntensity: 0.18, side: THREE.DoubleSide }));
    band.position.y = 5.35; spin.add(band);
    ff('carousel_rounding.webp').then((t) => { if (!t) return; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 2; band.material.map = t; band.material.emissiveMap = t; band.material.needsUpdate = true; });
    // the canopy: a striped cone, cream and carmine (no mustard), with a lit scalloped valance
    const stripes = document.createElement('canvas'); stripes.width = 1024; stripes.height = 64; const sg = stripes.getContext('2d');
    for (let i = 0; i < 32; i++) { sg.fillStyle = i % 2 ? '#f3ead8' : '#b3203a'; sg.fillRect(i * 32, 0, 32, 64); }
    const st = new THREE.CanvasTexture(stripes); st.colorSpace = THREE.SRGBColorSpace; st.anisotropy = ANISO;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(R + 0.55, 2.6, 64, 1, true), new THREE.MeshStandardMaterial({ map: st, roughness: 0.7, side: THREE.DoubleSide }));
    cone.position.y = 5.8 + 1.3; cone.castShadow = true; spin.add(cone);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), brass); finial.position.y = 8.55; spin.add(finial);
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), brass); flagPole.position.y = 9.2; spin.add(flagPole);
    const scal = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; scal.push(a); }
    const valGeo = mergeGeometries(scal.map((a) => { const g = new THREE.CircleGeometry(0.42, 12, Math.PI, Math.PI); g.rotateY(-a + Math.PI / 2); g.translate(Math.cos(a) * (R + 0.26), 4.9, Math.sin(a) * (R + 0.26)); return g; }));
    const val = new THREE.Mesh(valGeo, new THREE.MeshStandardMaterial({ color: 0xb3203a, roughness: 0.6, side: THREE.DoubleSide })); spin.add(val);
    const rb = new THREE.InstancedMesh(bulbGeo, bulbMat, 96);
    for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; rb.setMatrixAt(i, M4(Math.cos(a) * (R + 0.27), i % 2 ? 5.8 : 4.9, Math.sin(a) * (R + 0.27), 0, 1.1)); rb.setColorAt(i, bulbOn); }
    spin.add(rb);
    // twenty carved horses on brass poles, two rings, each rising and falling on its own phase
    const horse = await prop('h_carousel_horse_lo', { h: 1.55 });
    const poleGeo = new THREE.CylinderGeometry(0.035, 0.035, 5.2, 8);
    const rings = [[R - 0.9, 12], [R - 2.55, 8]];
    const riders = [];
    for (const [r, n] of rings) for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (r < 5 ? 0.2 : 0);
      const pole = new THREE.Mesh(poleGeo, brass); pole.position.set(Math.cos(a) * r, 0.64 + 2.6, Math.sin(a) * r); spin.add(pole);
      riders.push({ a, r, ph: i * 1.7 + r });
    }
    let hi = null;
    if (horse) {
      hi = instanced(horse, riders.map(() => new THREE.Matrix4())); spin.add(hi);
    }
    let rot = 0, tt = 0;
    const Mh = new THREE.Matrix4();
    updaters.push((dt) => {
      tt += dt; rot += dt * 0.32; spin.rotation.y = rot;
      if (hi) riders.forEach((h, i) => {
        const y = 1.15 + Math.sin(tt * 1.9 + h.ph) * 0.32;
        // the horse faces along the ring (counterclockwise from above, as American carousels turn)
        Mh.compose(V3(Math.cos(h.a) * h.r, y, Math.sin(h.a) * h.r), new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), -h.a + Math.PI), V3(1, 1, 1));
        hi.userData.set(i, Mh);
      });
    });
    // THE ILLUSION: the eye painted flat on the plaza paving, standing up as a three metre eye from the plaza spot
    const eyeImg = await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'eye_truecolor.png'; });
    if (eyeImg) {
      const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
      g.drawImage(eyeImg, 0, 0, 1024, 1024);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO;
      const E = V3(14, ground(14, 24.2) + 1.65, 24.2);
      // the board: 1.1 m square (its top must stay under the eye), six and a half metres ahead of the spot along its view (yaw 0.525), turned to face the eye
      const yaw = 0.525, fwd = V3(-Math.sin(yaw), 0, -Math.cos(yaw)), right = V3(Math.cos(yaw), 0, -Math.sin(yaw));
      const centre = E.clone().addScaledVector(fwd, 6.5); centre.y = ground(centre.x, centre.z);
      const o = centre.clone().addScaledVector(right, -0.56); o.y += 0.03;
      anamorph({ eye: E, o, right, up: V3(0, 1, 0), w: 1.12, h: 1.12, tex: t, gy: ground(centre.x, centre.z), rough: 0.6 });
    }
  })());

  // =========================================================== LUNA HALL
  jobs.push((async () => {
    const X0 = -194, X1 = -122, Z0 = -246, Z1 = -218, fy = 0.4;
    // built architecture: skirting, a dado rail and panels below it on every wall and the spine
    const skirt = ink, rail = brass;
    const runs = [[X0 + 0.3, Z0, X0 + 0.3, Z1, 1], [X1 - 0.3, Z0, X1 - 0.3, Z1, -1], [X0, Z0 + 0.3, X1, Z0 + 0.3, 1], [X0, Z1 - 0.3, -163, Z1 - 0.3, -1], [-153, Z1 - 0.3, X1, Z1 - 0.3, -1],
      [-183, -232.25, -133, -232.25, -1], [-183, -231.75, -133, -231.75, 1]];
    for (const [x0, z0, x1, z1] of runs) {
      const len = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      piece(B(len, 0.22, 0.05), skirt, { x: mx, y: fy + 0.11, z: mz, ry });
      piece(B(len, 0.06, 0.05), rail, { x: mx, y: fy + 1.05, z: mz, ry });
      piece(B(len, 0.04, 0.04), rail, { x: mx, y: fy + 5.6, z: mz, ry });
    }
    // brass inlay lines down both aisles of the terrazzo
    for (const z of [-243.2, -234.8, -229.2, -220.8]) piece(B(70, 0.006, 0.05), brass, { x: -158, y: fy + 0.003, z });
    // the Million Lights: bulb strings across the vault between the ribs, sagging, a warm wire each
    const strings = [], wires = [];
    for (let x = -190; x <= -126; x += 4) {
      const n = 34; let prev = null;
      for (let i = 0; i <= n; i++) {
        const u = i / n, z = Z0 + 1 + u * (Z1 - Z0 - 2), y = 10.6 - Math.sin(u * Math.PI) * 1.4 + Math.sin(x * 0.7) * 0.15;
        const p = V3(x, y, z); strings.push(p); if (prev) wires.push(prev, p); prev = p;
      }
    }
    bulbs(strings, { size: 0.9 });
    const wg = new THREE.BufferGeometry().setFromPoints(wires); root.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x2a2420 })));
    // benches: Central Park benches where the box benches stood, a pair each
    const cb = await prop('cp_bench', { len: 1.9 });
    const seats = recs.filter((r) => /^LH_Bench/.test(r.name));
    if (cb && seats.length) {
      const mats = []; for (const r of seats) for (const dx of [-1.05, 1.05]) mats.push(M4(r.pos.x + dx, fy, r.pos.z, r.pos.z < -232 ? 0 : Math.PI));
      root.add(instanced(cb, mats)); for (const r of seats) box(r.pos.x, fy + 0.5, r.pos.z, 4.4, 1, 0.7);
    }
    // the east end: the fountain in a built basin
    const fx = -127.6, fz = -232;
    const fnt = await prop('cp_fountain', { h: 3.2 });
    const basinStone = T('concrete_floor_02', 0xe2dccd, 2);
    piece(new THREE.CylinderGeometry(2.6, 2.7, 0.55, 48, 1, true), basinStone, { x: fx, y: fy + 0.27, z: fz });
    piece(new THREE.TorusGeometry(2.62, 0.12, 8, 64).rotateX(Math.PI / 2), basinStone, { x: fx, y: fy + 0.55, z: fz });
    const water = new THREE.Mesh(new THREE.CircleGeometry(2.55, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1d4a5c, roughness: 0.04, metalness: 0.3, normalMap: ctx.waterN, envMapIntensity: 1.5 }));
    water.position.set(fx, fy + 0.42, fz); root.add(water);
    if (fnt) place(fnt, fx, fy + 0.2, fz, 0);
    box(fx, fy + 0.8, fz, 5.4, 1.6, 5.4);
    // the west end: four of the Delacorte Clock's animals on a turning plinth
    const px = -188.4, pz = -232;
    piece(new THREE.CylinderGeometry(2.7, 2.8, 0.45, 48), basinStone, { x: px, y: fy + 0.22, z: pz, collide: true });
    const ring = new THREE.Group(); ring.position.set(px, fy + 0.45, pz); root.add(ring);
    const names = ['h_clock_bear', 'h_clock_hippo', 'h_clock_elephant', 'h_clock_penguin'];
    for (let i = 0; i < 4; i++) {
      const a = await prop(names[i], { h: 1.7 }); if (!a) continue;
      const ang = (i / 4) * Math.PI * 2; a.position.set(Math.cos(ang) * 1.75, 0, Math.sin(ang) * 1.75); a.rotation.y = -ang; ring.add(a);
    }
    updaters.push((dt) => { ring.rotation.y += dt * 0.12; });
    // Firefly friezes over the dado on the long walls (queued; nothing shows until the files land)
    for (const [i, x] of [[1, -172], [2, -158], [3, -144]]) ffPlate(`lunahall_frieze_${i}.webp`, 13.4, 3.35, x, fy + 7.35, Z0 + 0.33, 0);
    for (const [i, x] of [[1, -183], [3, -133]]) ffPlate(`lunahall_frieze_${i}.webp`, 13.4, 3.35, x, fy + 7.35, Z1 - 0.33, Math.PI);
    // signs over the two aisles, in the house fonts
    const s1 = signTex(2048, 256, { bg: '#0d0d0d', lines: [{ t: 'LUNA HALL', size: 0.42, y: 0.4, color: '#f0f4f8', track: 0.12 }, { t: 'THE PARKS OF NEW YORK  ·  UNDER GLASS', size: 0.16, y: 0.78, color: '#c9a25a', font: 'JetBrains Mono', weight: 700, track: 0.1 }], border: '#c9a25a' }, ANISO);
    for (const [x, ry] of [[-158, 0]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 1), new THREE.MeshStandardMaterial({ map: s1, emissive: 0xffffff, emissiveMap: s1, emissiveIntensity: 0.3, roughness: 0.5 }));
      m.position.set(x, 7.6, Z1 - 0.36); m.rotation.y = Math.PI; root.add(m);
    }
    // THE ILLUSION: the end walls open onto the Million Lights going on forever. Each is a flat panel whose shader
    // ray marches a lit arcade behind the wall (interior mapping): the depth moves with you, there is no room there.
    const tunnelMat = new THREE.ShaderMaterial({
      uniforms: { uW: { value: 7 }, uH: { value: 6 }, uT: { value: 0 } }, toneMapped: true,
      vertexShader: 'varying vec3 vP; varying vec3 vC; void main(){ vP = position; vC = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform float uW, uH, uT; varying vec3 vP; varying vec3 vC;
        float bulbs(vec2 p, vec2 cell, float r){ vec2 q = mod(p, cell) - cell * 0.5; return smoothstep(r, r * 0.35, length(q)); }
        void main(){
          vec3 d = normalize(vP - vC);
          float D = 600.0;
          float tx = ((d.x > 0.0 ? uW : -uW) * 0.5 - vP.x) / d.x;
          float ty = ((d.y > 0.0 ? uH : -uH) * 0.5 - vP.y) / d.y;
          float tz = (-D - vP.z) / min(d.z, -1e-4);
          float t = min(tx, min(ty, tz)); vec3 h = vP + d * t; float z = -h.z;
          vec3 col; float glow = 0.0;
          if (t == tz) { col = vec3(0.02); glow = 0.0; }
          else if (t == tx) {                         // side walls: rows of bulbs on dark red panels, cream arches every 6 m
            float b = bulbs(vec2(z, h.y + uH * 0.5), vec2(0.9, 0.75), 0.13);
            float arch = smoothstep(0.32, 0.22, abs(mod(z, 6.0) - 3.0));
            col = mix(vec3(0.16, 0.03, 0.05), vec3(0.85, 0.78, 0.66), arch);
            glow = b;
          } else if (d.y > 0.0) {                     // the ceiling: lights in a lattice
            float b = bulbs(vec2(h.x + uW * 0.5, z), vec2(0.7, 0.9), 0.12);
            col = vec3(0.06, 0.04, 0.05); glow = b;
          } else {                                     // the floor: dark terrazzo with the lights in it
            col = vec3(0.08, 0.07, 0.07) + vec3(0.25, 0.18, 0.1) * bulbs(vec2(h.x + uW * 0.5, z), vec2(0.7, 0.9), 0.2) * 0.4;
          }
          float fade = exp(-z * 0.012);
          float tw = 0.85 + 0.15 * sin(uT * 3.0 + z * 0.7);
          vec3 c = col * fade * 0.9 + vec3(2.6, 1.9, 1.1) * glow * tw * mix(0.35, 1.0, fade);
          c += vec3(0.7, 0.5, 0.3) * exp(-z * 0.004) * 0.06;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    updaters.push((dt) => { tunnelMat.uniforms.uT.value += dt; });
    for (const [x, z, ry] of [[X0 + 0.32, -225, Math.PI / 2], [X1 - 0.32, -239, -Math.PI / 2]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), tunnelMat); p.position.set(x, fy + 3.3, z); p.rotation.y = ry; root.add(p);
      // the frame: a built brass and ink proscenium so it reads as an opening, not a picture
      const g = new THREE.Group(); g.position.copy(p.position); g.rotation.y = ry; root.add(g);
      for (const [sx, sy, ox, oy] of [[7.8, 0.4, 0, 3.2], [7.8, 0.4, 0, -3.2], [0.4, 6.8, -3.7, 0], [0.4, 6.8, 3.7, 0]]) { const m = new THREE.Mesh(B(sx, sy, 0.35), ink); m.position.set(ox, oy, 0.1); m.castShadow = true; g.add(m); }
      for (const [sx, sy, ox, oy] of [[7.1, 0.06, 0, 3.02], [7.1, 0.06, 0, -3.02], [0.06, 6.1, -3.52, 0], [0.06, 6.1, 3.52, 0]]) { const m = new THREE.Mesh(B(sx, sy, 0.12), brass); m.position.set(ox, oy, 0.3); g.add(m); }
    }
  })());

  // =========================================================== THE EYE WHEEL
  jobs.push((async () => {
    const qz = -160, gy = ground(0, qz);
    // a marquee arch over the path into the queue: two posts, a lit sign, bulbs that chase
    for (const x of [-4.2, 4.2]) piece(B(0.45, 6.2, 0.45), ink, { x, y: gy + 3.1, z: qz, collide: true });
    piece(B(9.2, 1.6, 0.3), ink, { x: 0, y: gy + 6.6, z: qz });
    const s = signTex(2048, 360, { bg: '#0d0d0d', lines: [{ t: 'THE EYE WHEEL', size: 0.42, y: 0.42, color: '#f0f4f8', track: 0.1 }, { t: 'it looks back', size: 0.2, y: 0.8, color: '#00e5ff', font: 'Permanent Marker', weight: 400 }] }, ANISO);
    for (const [z, ry] of [[qz + 0.16, 0], [qz - 0.16, Math.PI]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1.5), new THREE.MeshStandardMaterial({ map: s, emissive: 0xffffff, emissiveMap: s, emissiveIntensity: 0.4, roughness: 0.5 }));
      m.position.set(0, gy + 6.6, z); m.rotation.y = ry; root.add(m);
    }
    const pts = []; for (let x = -4.4; x <= 4.41; x += 0.4) for (const z of [qz + 0.2, qz - 0.2]) pts.push(V3(x, gy + 7.5, z), V3(x, gy + 5.72, z));
    bulbs(pts, { chase: 4 });
    // THE ILLUSION: the eye over the sign turns to follow you (a lenticular style trick sign, every ride has one)
    const eyeTex = new THREE.TextureLoader().load('eye_truecolor.png'); eyeTex.colorSpace = THREE.SRGBColorSpace;
    const eye = new THREE.Group(); eye.position.set(0, gy + 8.5, qz); root.add(eye);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 48), new THREE.MeshStandardMaterial({ map: eyeTex, transparent: true, roughness: 0.4, emissive: 0xffffff, emissiveMap: eyeTex, emissiveIntensity: 0.25 }));
    disc.position.z = 0.06; eye.add(disc);
    const backDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 48).rotateX(Math.PI / 2), brass); eye.add(backDisc);
    const look = V3();
    updaters.push(() => { look.set(camera.position.x, eye.position.y, camera.position.z); const d = look.distanceTo(eye.position); if (d < 80) eye.lookAt(look); });
    // the queue: rope lines in a zigzag, and a popcorn cart and benches by the wheel
    const rope = await prop('rope_stanchion', { len: 2.2 });
    if (rope) {
      const mats = [];
      for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) mats.push(M4(-3.6 + k * 2.3, gy, qz - 4 - row * 1.6, 0));
      root.add(instanced(rope, mats));
    }
    const pop = await prop('popcorn', { h: 1.95 }); if (pop) { place(pop, 7.5, gy, qz - 6, -0.8); box(7.5, gy + 1, qz - 6, 1.3, 2, 1.6); }
    const pb = await prop('ph_painted_wooden_bench', { len: 1.85 });
    if (pb) for (const [x, z, ry] of [[-8, -168, Math.PI / 2], [-8, -172, Math.PI / 2], [8.5, -170, -Math.PI / 2]]) { place(pb, x, ground(x, z), z, ry); box(x, 0.5, z, 0.6, 1, 1.9); }
  })());

  // =========================================================== BLOSSOM GP: the pit
  jobs.push((async () => {
    const fx = 306, fz = -80.45, gy = ground(330, -76);
    const shutter = T('corrugated_iron', 0x9aa1a8, 1.2);
    // garages every 8 m along the pit building's face: a recess, a shutter half up, a lit team board above
    const teams = ['BLOSSOM', 'THE EYE', 'NO. 47', 'CONEY', 'LUNA', 'SHOCKWAVE', 'GARDEN RUN', 'WILD MOUSE', 'NEW YORKERS', 'PETAL', 'HELIX', 'WOODIE', 'ACID DROP', 'INFINITY', 'LAUNCHER'];
    const cols = ['#ff2e63', '#00e5ff', '#d7ff1f', '#3dffc0', '#f0f4f8', '#2962ff'];
    let k = 0;
    for (let x = 248; x <= 366; x += 8.3, k++) {
      piece(B(6.2, 3.9, 0.12), shutter, { x, y: gy + 2.25, z: fz - 0.02 });
      piece(B(0.35, 4.4, 0.5), ink, { x: x - 3.3, y: gy + 2.2, z: fz + 0.15 });
      piece(B(6.9, 0.35, 0.5), ink, { x, y: gy + 4.4, z: fz + 0.15 });
      const t = signTex(1024, 192, { bg: '#0d0d0d', lines: [{ t: String(k + 1).padStart(2, '0'), size: 0.62, x: -0.36, color: cols[k % cols.length], font: 'JetBrains Mono', weight: 800 }, { t: teams[k % teams.length], size: 0.34, x: 0.12, max: 0.6, color: '#f0f4f8', weight: 800 }] }, ANISO);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.98), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.55, roughness: 0.5 }));
      m.position.set(x, gy + 5.2, fz + 0.06); root.add(m);
    }
    // pit equipment: tyre stacks, tool carts, fuel cans, in front of the garages
    const tyre = await prop('ph_old_tyre', { len: 0.66, tilt: Math.PI / 2 }), cart = await prop('ph_tool_cart', { len: 1.3 }), can = await prop('ph_metal_jerrycan', { h: 0.48 });
    if (tyre) {
      const mats = [];
      for (let x = 250; x <= 362; x += 16.6) for (let st = 0; st < 2; st++) for (let s4 = 0; s4 < 4; s4++) mats.push(M4(x + 2 + st * 0.75, gy + s4 * 0.17, fz + 1.2, rnd() * 6));
      root.add(instanced(tyre, mats));
    }
    // the circuit's tyre walls: the white and black tori become real tyres, six high, one instanced stack each so a
    // stack across the park is culled on its own
    const bigTyre = await prop('ph_old_tyre', { len: 0.95, tilt: Math.PI / 2 });
    const stacks = {};
    for (const r of recs.filter((q) => /^Tire\d+_0_/.test(q.name))) (stacks[r.name.split('_')[0]] ||= []).push(r);
    if (bigTyre) for (const list of Object.values(stacks)) {
      const mats = [];
      for (const r of list) { const g0 = r.box.min.y; for (let k = 0; k < 6; k++) mats.push(M4(r.pos.x, g0 + k * 0.235, r.pos.z, rnd() * 6)); box(r.pos.x, g0 + 0.7, r.pos.z, 0.95, 1.4, 0.95); }
      root.add(instanced(bigTyre, mats));
    }
    if (cart) { const mats = []; for (let x = 254; x <= 362; x += 16.6) mats.push(M4(x - 2, gy, fz + 1.4, 0.15)); root.add(instanced(cart, mats)); }
    if (can) { const mats = []; for (let x = 252; x <= 362; x += 8.3) mats.push(M4(x + 1.2, gy, fz + 0.6, rnd())); root.add(instanced(can, mats)); }
    // boards along the pit wall, in MLow's own words, no brands
    const words = ['N3W YORKERS', 'ZERO TICKETS', 'THE EYE IS THE TRACK', 'MLOW', 'RIDE ALONG IN CAR 20', 'BLOSSOM GP'];
    for (let i = 0; i < 12; i++) {
      const t = signTex(1024, 128, { bg: i % 2 ? '#f0f4f8' : '#0d0d0d', lines: [{ t: words[i % words.length], size: 0.55, color: i % 2 ? '#0d0d0d' : '#f0f4f8', track: 0.06 }] }, ANISO);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 1.05), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
      m.position.set(252 + i * 9.6, gy + 0.62, -70.6 + 0.37); root.add(m);
      const m2 = m.clone(); m2.position.z = -70.6 - 0.37; m2.rotation.y = Math.PI; root.add(m2);
    }
    // THE ILLUSION: BLOSSOM GP painted long on the grid, standing up as a banner across the track from the grid spot
    const E = V3(382, ground(382, -68) + 1.65, -68);
    const yaw = 1.6278, fwd = V3(-Math.sin(yaw), 0, -Math.cos(yaw)), right = V3(Math.cos(yaw), 0, -Math.sin(yaw));
    const c = E.clone().addScaledVector(fwd, 9);
    // the painted strip crosses grass and the raised track: paint at the highest of them so the track does not hide it
    let gyy = -1e9; for (let k = 8; k <= 34; k += 2) for (const sd of [-3, 0, 3]) { const p = E.clone().addScaledVector(fwd, k).addScaledVector(right, sd - 2.6); const gh = ground(p.x, p.z, 2.5); if (gh < E.y - 1.65 + 0.45) gyy = Math.max(gyy, gh); }   // kerbs and grid furniture do not count
    const art = signTex(1400, 360, { bg: null, lines: [{ t: 'BLOSSOM GP', size: 0.5, y: 0.42, color: '#f0f4f8', weight: 900 }, { t: 'lights out and away we go', size: 0.17, y: 0.85, color: '#ff2e63', font: 'Permanent Marker', weight: 400 }] }, ANISO);
    c.addScaledVector(right, -2.6);                 // off the pit wall side, so the painting stays on the track
    anamorph({ eye: E, o: c.clone().addScaledVector(right, -2.1).setY(gyy + 0.04), right, up: V3(0, 1, 0), w: 4.2, h: 1.0, tex: art, gy: gyy, rough: 0.5 });
  })());

  await Promise.all(jobs.map((j) => j.catch((e) => console.error('upgrade', e))));

  // merge the built pieces per material
  for (const [mat, geos] of built) {
    const g = mergeGeometries(geos.map((x) => { if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; }), false);
    if (!g) continue;
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; root.add(m);
  }
  return { colliders, root, update(dt) { for (const u of updaters) u(dt); } };
}
