// SAME DIFFERENCE: the pairs. Every pair is two New Yorkers who sound the same: a diptych cut at its seam into
// assets/pairs/<id>_a.jpg (word A) and <id>_b.jpg (word B), with the whole picture at <id>.jpg for the card.
// window.PAIRS comes from build.py (pairs.json, only the pairs whose pictures exist).
import { PI } from './kit.js';

export const pairs = (room) => (window.PAIRS || []).filter((p) => p.room === room);
export const label = (p) => `${p.a} // ${p.b}`;
const _T = {};
export function pairTex(c, p, side) {
  const k = `${p.id}_${side}`; if (_T[k]) return _T[k];
  const t = c.tex.load(`assets/pairs/${k}.jpg`); t.colorSpace = c.THREE.SRGBColorSpace; t.anisotropy = 4; return (_T[k] = t);
}
// the card: the whole diptych, the two words and the line
export function openPair(c, p, egg) {
  c.openPiece({ pair: true, t: label(p), f: `../pairs/${p.id}.jpg`, s: p.quip, h: '' });
  c.egg('pair_' + p.id);
  if (egg) c.egg(egg[0], egg[1]);
}
// a plate under a picture: A // B in the house type
export function plaque(c, g, p, x, y, z, ry = 0, w = 1.6, o = {}) {
  const s = c.sign(label(p), { w, h: w * 0.14, bg: o.bg || '#0d0d0d', fg: o.fg || '#f4ead2', border: o.border || '#f5c542', font: o.font || c.MONO, weight: 800, px: 128 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a picture plane showing one side of a pair, clickable to the card
export function sidePlane(c, g, p, side, w, h, o = {}) {
  const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshBasicMaterial({ map: pairTex(c, p, side), toneMapped: false, transparent: !!o.transparent, side: o.side ?? c.THREE.FrontSide }));
  g.add(m); if (o.click !== false) c.clickable(m, () => openPair(c, p, o.egg), o.hint || label(p)); return m;
}
// a frame: a thin box behind a picture
export function frameBox(c, g, w, h, d = 0.08, col = 0x111111, o = {}) {
  const m = new c.THREE.Mesh(new c.THREE.BoxGeometry(w, h, d), new c.THREE.MeshStandardMaterial({ color: col, roughness: o.r ?? 0.5, metalness: o.m ?? 0.2 })); g.add(m); return m;
}
// Two pictures, one plane, a moving edge between them: x < edge shows A, x > edge shows B (soft by `soft`).
// `dir` 0 is a left to right edge, 1 a top to bottom one. Used by the shadow sweep and the reveal tricks.
export function wipeMat(c, p, o = {}) {
  const { THREE } = c;
  return new THREE.ShaderMaterial({
    uniforms: { tA: { value: pairTex(c, p, 'a') }, tB: { value: pairTex(c, p, 'b') }, edge: { value: o.edge ?? 0.5 }, soft: { value: o.soft ?? 0.04 }, dark: { value: 1 }, dir: { value: o.dir || 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tA; uniform sampler2D tB; uniform float edge; uniform float soft; uniform float dark; uniform float dir; varying vec2 vUv;
void main(){ float u = mix(vUv.x, 1. - vUv.y, dir); float k = smoothstep(edge - soft, edge + soft, u); vec3 col = mix(texture2D(tA, vUv).rgb, texture2D(tB, vUv).rgb, k) * dark; gl_FragColor = vec4(col, 1.);
#include <colorspace_fragment>
}`,
  });
}
export { PI };

// ---------- dressing: the CC0 props and the cast, one table per room ----------
// props: [polyhavenId, x, z, { h | len, ry, y, r: collider radius, egg: [hint, id, line] }] (files ph_<id>.glb from ON LOCATION)
// cast:  [castName, x, z, ry, line?] the ON LOCATION Tripo eye flower New Yorkers; a line makes them talk when clicked
// (no egg for these: ids built at runtime are never counted by build.py, and the HUD total must stay true)
import { prop, cast } from './kit.js';
export function dress(c, r, g, X, props = [], people = []) {
  for (const [id, x, z, o = {}] of props) prop(c, r, g, X, id, x, z, o);
  people.forEach(([name, x, z, ry, line, h], k) => cast(c, r, g, X, name, x, z, { h: h || 1.72 + (k % 3) * 0.05, ry, r: 0.35, line, hint: line ? 'A New Yorker' : undefined }));
}
// a sign in the house voice: Abloh's quotation marks around what the thing already is
export const quote = (s) => `"${s}"`;
