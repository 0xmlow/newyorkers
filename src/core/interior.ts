import * as T from 'three';
import { tex } from './assets';

// Interior mapping: every window is a flat quad, but behind it the shader casts the view ray into a box room and
// reads that room from a one point perspective ImageGen plate (3 x 3 atlas). Parallax is right from any angle, so the
// building looks full of rooms far bigger than its walls, at the cost of one instanced draw call per facade.
//
// The projection: the plate is a pinhole view of a room whose back wall fills the middle half of the frame. A hit
// point at depth z on the box walls maps to the plate as u = 0.5 + 0.5 (x / hx) c / (c + z), with c = D, so the four
// walls, floor and ceiling of the box land exactly where the plate drew them. Authored approximation, not a scan.

export type Win = { pos: T.Vector3; rotY: number; w: number; h: number; room: number; lit: number };

const VERT = /* glsl */ `
attribute float aRoom; attribute float aLit; attribute vec2 aBox;
varying vec3 vP; varying vec3 vC; varying float vRoom; varying float vLit; varying vec2 vBox; varying vec3 vWV; varying vec3 vWN;
#include <fog_pars_vertex>
void main(){
  mat4 m = modelMatrix * instanceMatrix;
  vP = position; vC = (inverse(m) * vec4(cameraPosition, 1.0)).xyz;
  vRoom = aRoom; vLit = aLit; vBox = aBox;
  vec4 wp = m * vec4(position, 1.0);
  vWV = normalize(cameraPosition - wp.xyz); vWN = normalize(mat3(m) * vec3(0.0, 0.0, 1.0));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FRAG = /* glsl */ `
uniform sampler2D uAtlas; uniform float uTime;
varying vec3 vP; varying vec3 vC; varying float vRoom; varying float vLit; varying vec2 vBox; varying vec3 vWV; varying vec3 vWN;
#include <common>
#include <fog_pars_fragment>
void main(){
  vec3 d = normalize(vP - vC);
  float hx = vBox.x * 0.5, hy = vBox.y * 0.5, D = 1.2;
  vec3 col;
  if (d.z > -1e-4) { col = vec3(0.01, 0.02, 0.05); }
  else {
    float tx = (sign(d.x) * hx - vP.x) / d.x;
    float ty = (sign(d.y) * hy - vP.y) / d.y;
    float tz = (-D - vP.z) / d.z;
    float t = min(min(abs(d.x) < 1e-5 ? 1e5 : tx, abs(d.y) < 1e-5 ? 1e5 : ty), tz);
    vec3 h = vP + d * t;
    float z = -h.z, sc = D / (D + z);
    vec2 uvL = clamp(vec2(0.5 + 0.5 * (h.x / hx) * sc, 0.5 + 0.5 * (h.y / hy) * sc), 0.002, 0.998);
    float col3 = mod(vRoom, 3.0), row = floor(vRoom / 3.0);
    col = texture2D(uAtlas, (vec2(col3, 2.0 - row) + uvL) / 3.0).rgb;
    // a room with the lights off is still a room: moonlight, a television flicker in a few
    float flick = 0.85 + 0.15 * sin(uTime * 11.0 + vRoom * 7.0) * step(0.5, fract(vRoom * 0.37 + vLit * 3.1));
    col *= mix(vec3(0.05, 0.07, 0.14), vec3(1.25) * flick, vLit);
    col *= 1.0 - 0.35 * smoothstep(0.0, D, z) * (1.0 - vLit); // darker deep in an unlit room
  }
  // sash bars and a frame line, then the glass: a little fresnel sky and a streak
  float bar = step(abs(vP.y - 0.05), 0.012) + step(abs(vP.x), 0.008) * step(vP.y, 0.05);
  float edge = step(0.485, abs(vP.x)) + step(0.485, abs(vP.y));
  col = mix(col, vec3(0.015, 0.016, 0.02), clamp(bar + edge, 0.0, 1.0));
  float fr = pow(1.0 - clamp(dot(vWN, vWV), 0.0, 1.0), 4.0);
  vec3 sky = mix(vec3(0.02, 0.05, 0.14), vec3(0.1, 0.25, 0.6), fr);
  float streak = smoothstep(0.02, 0.0, abs(vP.x + vP.y * 0.7 - 0.15)) * 0.12;
  col = col + sky * (0.06 + 0.5 * fr) + streak;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

let mat: T.ShaderMaterial | null = null;
export const interiorTime = { value: 0 };
export function interiorMaterial() {
  if (mat) return mat;
  const atlas = tex('plates/interiors.jpg');
  atlas.generateMipmaps = true; atlas.minFilter = T.LinearMipmapLinearFilter;
  mat = new T.ShaderMaterial({
    uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { uAtlas: { value: atlas }, uTime: interiorTime }]),
    vertexShader: VERT, fragmentShader: FRAG, fog: true,
  });
  mat.uniforms.uAtlas.value = atlas;
  mat.uniforms.uTime = interiorTime;
  return mat;
}

/** One instanced mesh for a list of windows. Each window: centre, facing (rotY, +z out), size, which room, lit 0..1. */
export function windows(parent: T.Object3D, list: Win[]) {
  const g = new T.PlaneGeometry(1, 1);
  const room = new Float32Array(list.length), lit = new Float32Array(list.length), boxA = new Float32Array(list.length * 2);
  const mesh = new T.InstancedMesh(g, interiorMaterial(), list.length);
  const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
  list.forEach((w, i) => {
    const S = Math.max(w.w, w.h);
    m.compose(w.pos, q.setFromEuler(e.set(0, w.rotY, 0)), new T.Vector3(w.w, w.h, S));
    mesh.setMatrixAt(i, m);
    room[i] = w.room; lit[i] = w.lit; boxA[i * 2] = S / w.w; boxA[i * 2 + 1] = S / w.h;
  });
  g.setAttribute('aRoom', new T.InstancedBufferAttribute(room, 1));
  g.setAttribute('aLit', new T.InstancedBufferAttribute(lit, 1));
  g.setAttribute('aBox', new T.InstancedBufferAttribute(boxA, 2));
  mesh.computeBoundingSphere();
  mesh.frustumCulled = false; // the bounding sphere of a whole facade is fine, but instance bounds lag a resize
  parent.add(mesh);
  return mesh;
}
