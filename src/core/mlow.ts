import * as T from 'three';
import { seeded } from './kit';

// MLow Impermanent Vision as materials and objects, applied to the architecture and never to the collection.
//   contour()  topographic lines in world space that crowd and bend toward thresholds (doors, portals, wells)
//   drips()    physical paint drips: real geometry with a wet clearcoat, so they have silhouettes
//   eyeFlower() the sovereign Open Eye Flower: seven bone petals, a cobalt veined surface, an iris that follows you

export const INK = {
  void: 0x02040c, navy: 0x06163a, cobalt: 0x2962ff, cyan: 0x00e5ff, violet: 0x6f23a8, pink: 0xff2e63, bone: 0xf0f4f8, copper: 0xbe854c,
};

export const shared = { time: { value: 0 } };

/** Every threshold on the floor plan, in world space: xyz and a radius of influence. Rooms push theirs in. */
export const thresholds: T.Vector4[] = [];
const MAXT = 24;
const tUniform = { value: Array.from({ length: MAXT }, () => new T.Vector4(0, -999, 0, 0.001)) };
const tCount = { value: 0 };
export function addThreshold(p: T.Vector3, r: number) {
  thresholds.push(new T.Vector4(p.x, p.y, p.z, r));
}
/** Load the uniform with the thresholds nearest a point: the room being drawn (rooms sit 1 km apart). */
export function focusThresholds(c: T.Vector3) {
  const d = (v: T.Vector4) => (v.x - c.x) ** 2 + (v.y - c.y) ** 2 + (v.z - c.z) ** 2;
  const near = thresholds.filter((v) => d(v) < 400 * 400).sort((a, b) => d(a) - d(b)).slice(0, MAXT);
  near.forEach((v, i) => tUniform.value[i].copy(v));
  tCount.value = near.length;
}

const NOISE = /* glsl */ `
vec3 mlw_mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mlw_mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 mlw_perm(vec4 x){return mlw_mod289(((x*34.)+1.)*x);}
float mlw_noise(vec3 p){
  vec3 a=floor(p); vec3 d=p-a; d=d*d*(3.-2.*d);
  vec4 b=a.xxyy+vec4(0.,1.,0.,1.); vec4 k1=mlw_perm(b.xyxy); vec4 k2=mlw_perm(k1.xyxy+b.zzww);
  vec4 c=k2+a.zzzz; vec4 k3=mlw_perm(c); vec4 k4=mlw_perm(c+1.);
  vec4 o1=fract(k3*(1./41.)); vec4 o2=fract(k4*(1./41.));
  vec4 o3=o2*d.z+o1*(1.-d.z); vec2 o4=o3.yw*d.x+o3.xz*(1.-d.x);
  return o4.y*d.y+o4.x*(1.-d.y);
}
float mlw_fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<4;i++){f+=a*mlw_noise(p);p*=2.02;a*=.5;}return f;}
`;

export type ContourOpts = {
  coverage?: number;   // 0: paint only creeps from thresholds; 1: the whole surface is a contour field
  density?: number;    // lines per unit of field
  scale?: number;      // field scale (bigger = wider bands)
  glow?: number;       // emissive strength of the lines
  ground?: number;     // how far the surface under the paint is pulled to midnight navy
  flow?: number;       // drift speed (0 for still)
};

/** Adds the contour field to any MeshStandardMaterial (keeps its maps, lights and shadows). */
export function contour<M extends T.MeshStandardMaterial>(m: M, o: ContourOpts = {}): M {
  const u = {
    uCov: { value: o.coverage ?? 0 }, uDen: { value: o.density ?? 9 }, uSc: { value: o.scale ?? 0.22 },
    uGlow: { value: o.glow ?? 1.6 }, uGround: { value: o.ground ?? 0.85 }, uFlow: { value: o.flow ?? 0.02 },
  };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u, { uTime: shared.time, uThr: tUniform, uThrN: tCount });
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMlwW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 mlwW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mlwW = instanceMatrix * mlwW;
        #endif
        vMlwW = (modelMatrix * mlwW).xyz;`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vMlwW; uniform float uCov,uDen,uSc,uGlow,uGround,uFlow,uTime; uniform vec4 uThr[${MAXT}]; uniform int uThrN;
        ${NOISE}
        float mlwMask; float mlwLines; vec3 mlwCol;
        void mlwField(){
          vec3 p = vMlwW;
          float pull = 0.0, near = 0.0;
          for (int i = 0; i < ${MAXT}; i++) { if (i >= uThrN) break;
            float d = length(p - uThr[i].xyz) / uThr[i].w;
            pull += exp(-d * 1.3) * 2.4;
            near = max(near, smoothstep(2.4, 0.35, d));
          }
          float f = mlw_fbm(p * uSc + vec3(0.0, uTime * uFlow, 0.0)) * 3.0 + pull;
          float g = f * uDen;
          float w = fwidth(g) * 1.1 + 0.004;
          float dl = 0.5 - abs(fract(g) - 0.5);                 // distance to the nearest contour, in field units
          float line = 1.0 - smoothstep(w * 0.35, w, dl);
          float dm = (0.5 - abs(fract(g / 5.0) - 0.5)) * 5.0;    // every fifth line is an index contour
          float major = 1.0 - smoothstep(w * 0.6, w * 1.7, dm);
          mlwMask = clamp(max(uCov, near), 0.0, 1.0);
          mlwLines = clamp(line * 0.75 + major * 0.6, 0.0, 1.0);
          vec3 cob = vec3(0.16, 0.38, 1.0), cy = vec3(0.0, 0.9, 1.0), pk = vec3(1.0, 0.18, 0.39), vi = vec3(0.44, 0.14, 0.66);
          mlwCol = mix(cob, cy, smoothstep(0.35, 0.85, fract(f * 0.37)));
          mlwCol = mix(mlwCol, vi, smoothstep(0.6, 0.95, mlw_noise(p * 0.5 + 7.0)) * 0.6);
          mlwCol = mix(mlwCol, pk, near * near * 0.55);
        }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        mlwField();
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.03, 0.09), mlwMask * uGround);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += mlwCol * mlwLines * mlwMask * uGlow;`);
  };
  m.customProgramCacheKey = () => 'mlw-contour';
  return m;
}

/** Paint drips hanging from a line (a door head, a sill, a parapet): instanced capsules and bulbs, wet. */
export function drips(parent: T.Object3D, a: T.Vector3, b: T.Vector3, n: number, seed = 1, maxLen = 1.4, colors = [INK.pink, INK.violet, INK.cyan]) {
  const rnd = seeded(seed), g = new T.Group();
  const stem = new T.CylinderGeometry(1, 1, 1, 10, 1, true), bulb = new T.SphereGeometry(1, 12, 10);
  stem.translate(0, -0.5, 0);
  for (const col of colors) {
    const mat = new T.MeshPhysicalMaterial({ color: col, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, emissive: col, emissiveIntensity: 0.35 });
    const k = Math.ceil(n / colors.length);
    const s = new T.InstancedMesh(stem, mat, k), bl = new T.InstancedMesh(bulb, mat, k);
    const m = new T.Matrix4(), q = new T.Quaternion();
    for (let i = 0; i < k; i++) {
      const t = rnd(), p = a.clone().lerp(b, t), r = 0.008 + rnd() * 0.026, len = 0.08 + Math.pow(rnd(), 1.8) * maxLen;
      m.compose(p, q, new T.Vector3(r, len, r)); s.setMatrixAt(i, m);
      m.compose(p.clone().add(new T.Vector3(0, -len, 0)), q, new T.Vector3(r * 1.7, r * 2.2, r * 1.7)); bl.setMatrixAt(i, m);
    }
    s.castShadow = bl.castShadow = false;
    g.add(s, bl);
  }
  parent.add(g);
  return g;
}

function veins() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const x = c.getContext('2d')!, rnd = seeded(7);
  const gr = x.createLinearGradient(0, 1024, 0, 0);
  gr.addColorStop(0, '#c9d3e6'); gr.addColorStop(0.25, '#eef2f7'); gr.addColorStop(1, '#f7f8fb');
  x.fillStyle = gr; x.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 70; i++) {
    let px = 256 + (rnd() - 0.5) * 60, py = 1024, ang = (rnd() - 0.5) * 0.9;
    x.strokeStyle = rnd() < 0.15 ? 'rgba(190,133,76,0.55)' : `rgba(${30 + rnd() * 30},${70 + rnd() * 40},${200 + rnd() * 55},${0.25 + rnd() * 0.45})`;
    x.lineWidth = 0.6 + rnd() * 2.6;
    x.beginPath(); x.moveTo(px, py);
    for (let s = 0; s < 40; s++) { ang += (rnd() - 0.5) * 0.25; px += Math.sin(ang) * 14; py -= 24; x.lineTo(px, py); if (py < 0) break; }
    x.stroke();
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function irisTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const x = c.getContext('2d')!, rnd = seeded(11), C = 512;
  x.fillStyle = '#f2f4f7'; x.fillRect(0, 0, 1024, 1024);
  const g = x.createRadialGradient(C, C, 60, C, C, 330);
  g.addColorStop(0, '#0a1a3a'); g.addColorStop(0.35, '#1d4fd8'); g.addColorStop(0.7, '#3d8bff'); g.addColorStop(0.95, '#0b2a66'); g.addColorStop(1, '#06163a');
  x.fillStyle = g; x.beginPath(); x.arc(C, C, 340, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 900; i++) {
    const a = rnd() * Math.PI * 2, r0 = 110 + rnd() * 40, r1 = 250 + rnd() * 90;
    x.strokeStyle = rnd() < 0.5 ? `rgba(160,210,255,${0.08 + rnd() * 0.25})` : `rgba(4,20,60,${0.1 + rnd() * 0.3})`;
    x.lineWidth = 0.6 + rnd() * 1.8; x.beginPath();
    x.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0);
    x.quadraticCurveTo(C + Math.cos(a + 0.08) * (r0 + r1) / 2, C + Math.sin(a + 0.08) * (r0 + r1) / 2, C + Math.cos(a) * r1, C + Math.sin(a) * r1);
    x.stroke();
  }
  x.strokeStyle = 'rgba(190,133,76,0.6)'; x.lineWidth = 18; x.beginPath(); x.arc(C, C, 140, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#020308'; x.beginPath(); x.arc(C, C, 112, 0, Math.PI * 2); x.fill();
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

let petalMat: T.Material | null = null, irisMat: T.Material | null = null;
/** The sovereign Open Eye Flower. R is the petal length in metres. Call tick(camera position, t) each frame. */
export function eyeFlower(R: number) {
  const g = new T.Group();
  petalMat ??= new T.MeshPhysicalMaterial({ map: veins(), roughness: 0.42, sheen: 1, sheenColor: new T.Color(0x9fc3ff), sheenRoughness: 0.5,
    clearcoat: 0.35, side: T.DoubleSide, emissive: 0x0b1a3a, emissiveIntensity: 0.4 });
  irisMat ??= new T.MeshPhysicalMaterial({ map: irisTexture(), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03, emissive: 0x1a3a8a, emissiveIntensity: 0.15 });
  // a petal: a cupped parametric surface, broad and rounded, as on the Open Eye Flower stickers
  const NU = 26, NV = 14, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const u = i / NU, v = (j / NV) * 2 - 1;
    const hw = 0.48 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.03)), 0.75) * (1 - 0.25 * u);
    const x = v * hw, y = u, z = 0.22 * v * v * hw + 0.18 * u * u - 0.05 * Math.sin(u * Math.PI);
    pos.push(x, y, z); uv.push(j / NV, u);
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const pg = new T.BufferGeometry();
  pg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); pg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  pg.setIndex(idx); pg.computeVertexNormals(); pg.scale(R, R, R);
  const petals: T.Mesh[] = [];
  for (let k = 0; k < 7; k++) {
    const hinge = new T.Group(); hinge.rotation.z = (k / 7) * Math.PI * 2;
    const p = new T.Mesh(pg, petalMat); p.position.y = R * 0.18; p.rotation.x = -0.12; p.castShadow = true;
    hinge.add(p); g.add(hinge); petals.push(p);
  }
  // the iris: a cornea bulge with a planar iris map
  const NI = 40, ip: number[] = [], iu: number[] = [], ii: number[] = [], rI = R * 0.36;
  for (let a = 0; a <= NI; a++) for (let b = 0; b <= NI; b++) {
    const x = (a / NI) * 2 - 1, y = (b / NI) * 2 - 1, r2 = Math.min(1, x * x + y * y);
    ip.push(x * rI, y * rI, Math.sqrt(1 - r2) * rI * 0.55 + R * 0.04); iu.push(a / NI, b / NI);
  }
  for (let a = 0; a < NI; a++) for (let b = 0; b < NI; b++) {
    const x = (a + 0.5) / NI * 2 - 1, y = (b + 0.5) / NI * 2 - 1; if (x * x + y * y > 1) continue;
    const q = a * (NI + 1) + b; ii.push(q, q + NI + 1, q + 1, q + 1, q + NI + 1, q + NI + 2);
  }
  const ig = new T.BufferGeometry();
  ig.setAttribute('position', new T.Float32BufferAttribute(ip, 3)); ig.setAttribute('uv', new T.Float32BufferAttribute(iu, 2));
  ig.setIndex(ii); ig.computeVertexNormals();
  const iris = new T.Mesh(ig, irisMat); g.add(iris);
  const head = new T.Group(); head.add(g);
  let blinkT = -1;
  const target = new T.Quaternion(), m4 = new T.Matrix4(), wp = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  return {
    object: head, iris,
    blink() { blinkT = 0; },
    tick(cam: T.Vector3, t: number, dt: number, still = false) {
      head.getWorldPosition(wp);
      m4.lookAt(cam, wp, up);
      target.setFromRotationMatrix(m4);
      if (head.parent) { const pq = new T.Quaternion(); head.parent.getWorldQuaternion(pq); target.premultiply(pq.invert()); }
      head.quaternion.slerp(target, still ? 1 : 1 - Math.pow(0.02, dt));
      let close = 0;
      if (blinkT >= 0) { blinkT += dt; close = Math.sin(Math.min(1, blinkT / 0.45) * Math.PI); if (blinkT > 0.45) blinkT = -1; }
      petals.forEach((p, k) => { p.rotation.x = -0.12 - close * 1.25 + (still ? 0 : Math.sin(t * 0.7 + k) * 0.03); });
    },
  };
}
