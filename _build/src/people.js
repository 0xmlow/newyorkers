// THE GARDEN: the crowd. Seated and standing people as one merged low poly body each, coloured per instance in the
// shader: shirt, trousers, skin, hair or cap, shoes. No faces, no likeness. A New York winter crowd: mostly dark coats,
// grey and navy, a scatter of home jerseys, a few white tops that catch the light.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// part ids: 0 shirt, 1 trousers, 2 skin, 3 hair, 4 shoes, 5 arms (shirt colour, they lift in the wave)
function tag(g, part) { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count; g.setAttribute('part', new THREE.Float32BufferAttribute(new Array(n).fill(part), 1)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'part'].includes(k)) g.deleteAttribute(k); return g; }
// limbs are capsules squashed to the box they used to be; the long axis is whichever of w, h, d is largest
let HI = true;
const box = (w, h, d, x, y, z, part, rx = 0) => {
  if (!HI) return tag(new THREE.BoxGeometry(w, h, d).rotateX(rx).translate(x, y, z), part);
  const L = Math.max(w, h, d), r = 0.5; const g = new THREE.CapsuleGeometry(r, Math.max(0.01, L / Math.min(w, h, d) - 1), 2, 6);
  const m = Math.min(w, h, d); g.scale(m, m, m);   // a capsule along y, length L, thickness m
  if (L === d) g.rotateX(Math.PI / 2); else if (L === w) g.rotateZ(Math.PI / 2);
  g.computeBoundingBox(); const bb = g.boundingBox; g.scale(w / (bb.max.x - bb.min.x), h / (bb.max.y - bb.min.y), d / (bb.max.z - bb.min.z));
  return tag(g.rotateX(rx).translate(x, y, z), part); };
function torso(h, rTop, rBot, x, y, z, rx = 0) { const g = HI ? new THREE.CapsuleGeometry(1, 1, 3, 10) : new THREE.CapsuleGeometry(1, 1, 1, 7); g.computeBoundingBox(); g.scale(1, 1, 1); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const t = (pa.getY(i) + 1.5) / 3, r = rBot + (rTop - rBot) * t; pa.setXYZ(i, pa.getX(i) * r, pa.getY(i) / 3 * h, pa.getZ(i) * r * 0.62); } g.computeVertexNormals(); g.rotateX(rx); g.translate(x, y, z); return tag(g, 0); }
function head(y, z) {
  const h = new THREE.SphereGeometry(0.105, HI ? 12 : 7, HI ? 9 : 5); h.scale(1, 1.18, 1.05); h.translate(0, y, z);
  const hair = new THREE.SphereGeometry(0.113, HI ? 12 : 7, HI ? 5 : 3, 0, Math.PI * 2, 0, Math.PI * 0.52); hair.scale(1, 1.16, 1.08); hair.rotateX(-0.25); hair.translate(0, y + 0.01, z - 0.008);
  const neck = new THREE.CylinderGeometry(0.048, 0.055, 0.1, 7).translate(0, y - 0.15, z + 0.005);
  return [tag(h, 2), tag(hair, 3), tag(neck, 2)];
}
// seated, origin on the tread under the seat, facing +z, seat pan top at 0.47
export function seatedGeometry(hi = true) {
  HI = hi; const parts = [];
  for (const s of [-1, 1]) {
    parts.push(box(0.15, 0.15, 0.48, s * 0.1, 0.55, 0.13, 1));          // thigh
    parts.push(box(0.12, 0.48, 0.13, s * 0.1, 0.27, 0.37, 1));          // shin
    parts.push(box(0.11, 0.08, 0.25, s * 0.1, 0.04, 0.44, 4));          // shoe
    parts.push(box(0.1, 0.32, 0.11, s * 0.235, 0.93, -0.07, 5, 0.12));  // upper arm
    parts.push(box(0.09, 0.09, 0.3, s * 0.2, 0.76, 0.07, 5));           // forearm on the lap
    parts.push(box(0.08, 0.05, 0.11, s * 0.17, 0.75, 0.26, 2));         // hand
  }
  parts.push(torso(0.6, 0.2, 0.165, 0, 0.92, -0.1, -0.08));
  parts.push(...head(1.36, -0.08));
  return mergeGeometries(parts);
}
export function standingGeometry(hi = true) {
  HI = hi; const parts = [];
  for (const s of [-1, 1]) {
    parts.push(box(0.15, 0.86, 0.16, s * 0.1, 0.47, 0, 1));
    parts.push(box(0.11, 0.08, 0.26, s * 0.1, 0.04, 0.05, 4));
    parts.push(box(0.1, 0.58, 0.11, s * 0.25, 1.17, 0, 5));
    parts.push(box(0.08, 0.1, 0.08, s * 0.25, 0.84, 0.01, 2));
  }
  parts.push(torso(0.62, 0.2, 0.17, 0, 1.2, 0));
  parts.push(...head(1.66, 0));
  return mergeGeometries(parts);
}

const COATS = ['#1d2230', '#262a33', '#2f3540', '#3c414c', '#14161c', '#4a4f5a', '#5b6170', '#28324a', '#1c2a4a', '#3a2f2a', '#5a4a3c', '#7d7f86', '#d8dadf', '#eceae4', '#8a2b2b', '#2a4a3a'];
const JERSEY = ['#1d5fc9', '#f58426', '#eceff4', '#0b2e6b'];   // the home team's colours and the road whites
const PANTS = ['#1a1c22', '#23262e', '#2c3442', '#3b4a63', '#4a4136', '#15171b', '#5a5e66'];
const SKIN = ['#f2d0b6', '#e2b393', '#c98e66', '#a86b45', '#8a5634', '#5e3a22', '#f5dcc8', '#d4a17c'];
const HAIR = ['#14110f', '#2a1d14', '#3d2a1c', '#5a4030', '#8a6a42', '#c9a870', '#b8b4ac', '#1a1a1a'];
const CAPS = ['#1d5fc9', '#f58426', '#0f1a33', '#eceff4', '#1a1a1a', '#7a1e22'];
const C = new THREE.Color();
function pick(a) { return a[(Math.random() * a.length) | 0]; }
export function personColours(i, n, out) {
  const shirt = Math.random() < 0.13 ? pick(JERSEY) : pick(COATS);
  const hair = Math.random() < 0.16 ? pick(CAPS) : pick(HAIR);
  [shirt, pick(PANTS), pick(SKIN), hair, Math.random() < 0.3 ? '#e8e8e8' : '#141414'].forEach((h, k) => { C.set(h).convertSRGBToLinear(); out[k].setXYZ(i, C.r, C.g, C.b); });
}
// the material: per instance colours by part, the wave and a breath in the vertex shader
export function peopleMaterial(waveU, standing = false) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, waveU);
    sh.vertexShader = 'uniform float uWave,uWaveOn,uT;\nattribute float part;\nattribute vec3 cShirt,cPants,cSkin,cHair,cShoe;\nvarying vec3 vPC;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = vec3(instanceMatrix[3]); float th = atan(ip.z, ip.x); float dd = mod(th - uWave + 3.14159, 6.28318) - 3.14159;
        float up = uWaveOn * exp(-dd * dd * 26.0); float ph = fract(sin(dot(ip.xz, vec2(12.9898, 78.233))) * 43758.5);
        if (part > 4.5) { float lift = ${standing ? 'step(0.78, ph) * (0.75 + 0.25 * sin(uT * 3.0 + ph * 9.0))' : 'up'};
          vec3 piv = vec3(transformed.x, ${standing ? '1.45, 0.0' : '1.08, -0.07'}); vec3 r = transformed - piv; float a = -lift * 2.75, ca = cos(a), sa = sin(a);
          transformed = piv + vec3(r.x, r.y * ca - r.z * sa, r.y * sa + r.z * ca); }
        ${standing ? 'transformed.y += max(0.0, sin(uT * 4.2 + ph * 6.28)) * 0.05;' : 'transformed.y += up * 0.48; transformed.z -= up * 0.1 * step(0.5, transformed.y);'}
        transformed.y += sin(uT * 1.3 + ph * 6.28) * 0.006;`)
      .replace('#include <color_vertex>', `#include <color_vertex>
        vPC = part < 0.5 ? cShirt : part < 1.5 ? cPants : part < 2.5 ? cSkin : part < 3.5 ? cHair : part < 4.5 ? cShoe : cShirt;`);
    sh.fragmentShader = 'varying vec3 vPC;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= vPC;');
  };
  return m;
}
// people as chunks round the bowl, each a LOD: capsule bodies near, boxes far. Both levels share one set of
// instance colours and matrices, so a chunk costs one draw whichever level shows.
export function peopleMesh(geoMaker, mat, list, { jitter = 0.08, lean = 0.06, chunks = 1, near = 24 } = {}) {
  const groups = Array.from({ length: chunks }, () => []);
  list.forEach((s) => { const a = (Math.atan2(s[2], s[0]) / (Math.PI * 2) + 1) % 1; groups[Math.min(chunks - 1, (a * chunks) | 0)].push(s); });
  const gHi = geoMaker(true), gLo = geoMaker(false), root = new THREE.Group();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = new THREE.Vector3(), p = new THREE.Vector3();
  for (const L of groups) { if (!L.length) continue; const n = L.length, c = new THREE.Vector3(); L.forEach((s) => c.add(p.set(s[0], s[1], s[2]))); c.divideScalar(n);
    const at = ['cShirt', 'cPants', 'cSkin', 'cHair', 'cShoe'].map(() => new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3));
    const mk = (geo) => { const g = geo.clone(); ['cShirt', 'cPants', 'cSkin', 'cHair', 'cShoe'].forEach((k, i) => g.setAttribute(k, at[i])); const m = new THREE.InstancedMesh(g, mat, n); m.position.copy(c).negate(); m.frustumCulled = false; return m; };
    const hi = mk(gHi), lo = mk(gLo); lo.instanceMatrix = hi.instanceMatrix;
    L.forEach((s, i) => { const k = 0.93 + Math.random() * 0.13; sc.set(k * (0.94 + Math.random() * 0.14), k, k); q.setFromEuler(e.set((Math.random() - 0.3) * lean, s[3] + (Math.random() - 0.5) * jitter, 0)); m4.compose(p.set(s[0], s[1], s[2]), q, sc); hi.setMatrixAt(i, m4); personColours(i, n, at); });
    const lod = new THREE.LOD(); lod.position.copy(c); const wh = new THREE.Group(), wl = new THREE.Group(); wh.add(hi); wl.add(lo);
    lod.addLevel(wh, 0); lod.addLevel(wl, chunks > 1 ? near : 1e9); root.add(lod); }
  return root;
}
