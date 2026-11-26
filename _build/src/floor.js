// THE GARDEN: the floor that changes. The real Garden turns a court into a rink overnight; here 400 panels flip
// in a wave out from where you stand, the old floor on their faces and the new one on their backs, one draw.
import * as THREE from 'three';
import { FL, FR, sd } from './layout.js';

export const FW = 62, FD = 30;    // the floor rectangle the textures cover, x by z
const CELL = 2;
// canvas floors: drawn at 2048 x 990 over 62 x 30 m, so 33 px a metre
const PX = 33, CW = FW * PX, CH = FD * PX;
const X = (x) => (x + FW / 2) * PX, Z = (z) => (z + FD / 2) * PX;

function canvas() { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; }
function stadiumPath(ctx, inset = 0) { ctx.beginPath(); const r = (FR - inset) * PX; ctx.moveTo(X(-FL), Z(-FR + inset)); ctx.lineTo(X(FL), Z(-FR + inset)); ctx.arc(X(FL), Z(0), r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(X(-FL), Z(FR - inset)); ctx.arc(X(-FL), Z(0), r, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); }
function imgCircle(ctx, img, cx, cz, r, alpha = 1) { if (!img) return; ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(X(cx), Z(cz), r * PX, 0, 7); ctx.clip(); ctx.drawImage(img, X(cx) - r * PX, Z(cz) - r * PX, r * 2 * PX, r * 2 * PX); ctx.restore(); }
function word(ctx, t, x, z, size, color, rot = 0, font = '"N3W Skyline", Anton') { ctx.save(); ctx.translate(X(x), Z(z)); ctx.rotate(rot); ctx.fillStyle = color; ctx.font = `${size * PX}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, 0, 0); ctx.restore(); }

export function drawCourt(img) {
  const [c, ctx] = canvas(); ctx.fillStyle = '#20263f'; ctx.fillRect(0, 0, CW, CH);
  // maple boards along x, 5.7 cm wide, each a slightly different honey
  const bx0 = X(-17), bx1 = X(17), bz0 = Z(-9.6), bz1 = Z(9.6);
  for (let z = bz0; z < bz1; z += 1.9) { const h = 32 + Math.random() * 6, l = 62 + Math.random() * 8; ctx.fillStyle = `hsl(${h},48%,${l}%)`; ctx.fillRect(bx0, z, bx1 - bx0, 2); }
  for (let i = 0; i < 2600; i++) { ctx.fillStyle = 'rgba(80,50,20,.10)'; ctx.fillRect(bx0 + Math.random() * (bx1 - bx0), bz0 + Math.random() * (bz1 - bz0), 1.2, 1.9); }
  // the playing court, 28.65 x 15.24 m, painted keys in Evil Eye Blue
  const L = 14.33, W = 7.62; ctx.strokeStyle = '#f6f3ea'; ctx.lineWidth = 0.05 * PX;
  ctx.fillStyle = 'rgba(41,98,255,.92)';
  for (const s of [-1, 1]) { ctx.fillRect(s < 0 ? X(-L) : X(L - 5.79), Z(-2.44), 5.79 * PX, 4.88 * PX); }
  imgCircle(ctx, img, 0, 0, 4.6, 0.95);
  ctx.beginPath(); ctx.arc(X(0), Z(0), 1.83 * PX, 0, 7); ctx.stroke();
  ctx.strokeRect(X(-L), Z(-W), 2 * L * PX, 2 * W * PX); ctx.beginPath(); ctx.moveTo(X(0), Z(-W)); ctx.lineTo(X(0), Z(W)); ctx.stroke();
  for (const s of [-1, 1]) {
    const bx = s * L, rim = s * (L - 1.575);
    ctx.strokeRect(s < 0 ? X(-L) : X(L - 5.79), Z(-2.44), 5.79 * PX, 4.88 * PX);
    ctx.beginPath(); ctx.arc(X(s * (L - 5.79)), Z(0), 1.83 * PX, 0, 7); ctx.stroke();
    // the three point line: 7.24 m arc, 6.71 m in the corners
    const a = Math.asin(6.71 / 7.24), cx3 = rim - s * 7.24 * Math.cos(a);
    ctx.beginPath(); ctx.moveTo(X(bx), Z(-6.71)); ctx.lineTo(X(cx3), Z(-6.71));
    if (s > 0) ctx.arc(X(rim), Z(0), 7.24 * PX, Math.PI + a, Math.PI - a, true); else ctx.arc(X(rim), Z(0), 7.24 * PX, -a, a, false);
    ctx.lineTo(X(bx), Z(6.71)); ctx.stroke();
  }
  word(ctx, 'THE GARDEN', -L + 0.9, 0, 1.4, 'rgba(246,243,234,.9)', -Math.PI / 2); word(ctx, 'THE GARDEN', L - 0.9, 0, 1.4, 'rgba(246,243,234,.9)', Math.PI / 2);
  word(ctx, 'N3W YORKERS', 0, 8.6, 0.9, 'rgba(41,98,255,.95)'); word(ctx, 'N3W YORKERS', 0, -8.6, 0.9, 'rgba(41,98,255,.95)', Math.PI);
  return c;
}
export function drawIce(img) {
  const [c, ctx] = canvas(); ctx.fillStyle = '#c4cfdc'; ctx.fillRect(0, 0, CW, CH);
  imgCircle(ctx, img, 0, 0, 11, 0.55);
  for (let i = 0; i < 900; i++) { ctx.strokeStyle = `rgba(150,170,200,${0.05 + Math.random() * 0.08})`; ctx.lineWidth = 1; ctx.beginPath(); const x = Math.random() * CW, z = Math.random() * CH, a = Math.random() * 6.28, l = 20 + Math.random() * 120; ctx.moveTo(x, z); ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 20, z + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, z + Math.sin(a) * l); ctx.stroke(); }
  const H = 30.5, W = 13;
  ctx.fillStyle = 'rgba(200,30,50,.85)'; ctx.fillRect(X(-0.15), Z(-W), 0.3 * PX, 2 * W * PX);
  ctx.fillStyle = 'rgba(41,98,255,.85)'; for (const x of [-7.6, 7.3]) ctx.fillRect(X(x), Z(-W), 0.3 * PX, 2 * W * PX);
  ctx.fillStyle = 'rgba(200,30,50,.85)'; for (const s of [-1, 1]) ctx.fillRect(X(s * (H - 3.35)) - 1, Z(-W + 1.2), 0.05 * PX, (2 * W - 2.4) * PX);
  ctx.strokeStyle = 'rgba(200,30,50,.8)'; ctx.lineWidth = 0.05 * PX;
  for (const [x, z] of [[-22, -6.7], [-22, 6.7], [22, -6.7], [22, 6.7], [0, 0]]) { ctx.beginPath(); ctx.arc(X(x), Z(z), 4.57 * PX, 0, 7); ctx.strokeStyle = x === 0 ? 'rgba(41,98,255,.85)' : 'rgba(200,30,50,.8)'; ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(X(x), Z(z), 0.3 * PX, 0, 7); ctx.fill(); }
  for (const s of [-1, 1]) { ctx.fillStyle = 'rgba(41,140,255,.35)'; ctx.beginPath(); ctx.arc(X(s * (H - 3.35)), Z(0), 1.83 * PX, s > 0 ? Math.PI / 2 : -Math.PI / 2, s > 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.fill(); }
  word(ctx, 'THE GARDEN', -15, 0, 1.6, 'rgba(41,98,255,.55)', -Math.PI / 2); word(ctx, 'THE GARDEN', 15, 0, 1.6, 'rgba(41,98,255,.55)', Math.PI / 2);
  return c;
}
export function drawStage() {
  const [c, ctx] = canvas(); ctx.fillStyle = '#0b0d16'; ctx.fillRect(0, 0, CW, CH);
  for (let x = 0; x < CW; x += 1.2 * PX) for (let z = 0; z < CH; z += 2.4 * PX) { ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.025})`; ctx.fillRect(x + 1, z + 1, 1.2 * PX - 2, 2.4 * PX - 2); }
  ctx.strokeStyle = 'rgba(34,211,238,.25)'; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.strokeRect(X(-10), Z(-12), 36 * PX, 24 * PX); ctx.setLineDash([]);
  return c;
}
export function drawRing() {
  const [c, ctx] = canvas(); ctx.fillStyle = '#10121c'; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#1a1f38'; for (let r = 0; r < 8; r++) { ctx.beginPath(); ctx.rect(X(-6 - r * 2.2), Z(-6 - r * 1.2), (12 + r * 4.4) * PX, (12 + r * 2.4) * PX); ctx.strokeStyle = 'rgba(41,98,255,.12)'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = 'rgba(41,98,255,.08)'; ctx.fillRect(X(-5), Z(-5), 10 * PX, 10 * PX);
  return c;
}
export function drawCircus(img) {
  const [c, ctx] = canvas(); ctx.fillStyle = '#3a2416'; ctx.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 20000; i++) { ctx.fillStyle = `hsla(${25 + Math.random() * 15},${40 + Math.random() * 30}%,${25 + Math.random() * 30}%,.5)`; ctx.fillRect(Math.random() * CW, Math.random() * CH, 2, 2); }
  imgCircle(ctx, img, 0, 0, 6.4, 1);
  ctx.strokeStyle = '#ff4fa3'; ctx.lineWidth = 0.5 * PX; ctx.beginPath(); ctx.arc(X(0), Z(0), 6.65 * PX, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#eef2f8'; ctx.lineWidth = 0.12 * PX; ctx.beginPath(); ctx.arc(X(0), Z(0), 6.95 * PX, 0, 7); ctx.stroke();
  for (let a = 0; a < 6.28; a += 0.26) { ctx.fillStyle = (Math.round(a / 0.26) % 2) ? '#2962ff' : '#eef2f8'; ctx.beginPath(); ctx.arc(X(Math.cos(a) * 6.65), Z(Math.sin(a) * 6.65), 0.22 * PX, 0, 7); ctx.fill(); }
  return c;
}

// the flip panels: 31 x 15 cells, those whose centre is on the stadium shaped floor
export function buildFlipFloor(scene) {
  const pos = [], uvA = [], uvB = [], cen = [], idx = []; let v = 0;
  const uvOf = (x, z) => [(x + FW / 2) / FW, 1 - (z + FD / 2) / FD];
  for (let i = 0; i < FW / CELL; i++) for (let j = 0; j < FD / CELL; j++) {
    const cx = -FW / 2 + (i + 0.5) * CELL, cz = -FD / 2 + (j + 0.5) * CELL; if (sd(cx, cz) > 0.4) continue;
    const h = CELL / 2 - 0.002;
    for (const [dx, dz] of [[-h, -h], [h, -h], [h, h], [-h, h]]) { const x = cx + dx, z = cz + dz; pos.push(x, 0.012, z); uvA.push(...uvOf(x, z)); uvB.push(...uvOf(x, 2 * cz - z)); cen.push(cx, cz); }
    idx.push(v, v + 2, v + 1, v, v + 3, v + 2); v += 4;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2)); g.setAttribute('uvB', new THREE.Float32BufferAttribute(uvB, 2)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cen, 2)); g.setIndex(idx); g.computeVertexNormals();
  const U = { uProg: { value: 0 }, uOrigin: { value: new THREE.Vector2() }, map2: { value: null }, uRough2: { value: 0.5 } };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec2 uvB; attribute vec2 aC; uniform float uProg; uniform vec2 uOrigin; varying vec2 vUvB;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float dl = clamp(length(aC - uOrigin) / 46.0, 0.0, 1.0) * 0.72; float fa = smoothstep(0.0, 1.0, clamp((uProg - dl) / 0.26, 0.0, 1.0)) * 3.14159265;
        float ca = cos(fa), sa = sin(fa); objectNormal = vec3(objectNormal.x, objectNormal.y * ca - objectNormal.z * sa, objectNormal.y * sa + objectNormal.z * ca);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 lp = transformed - vec3(aC.x, 0.0, aC.y); transformed = vec3(aC.x + lp.x, lp.y * ca - lp.z * sa + sin(fa) * 1.1, aC.y + lp.y * sa + lp.z * ca); vUvB = uvB;`);
    sh.fragmentShader = 'uniform sampler2D map2; varying vec2 vUvB;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', '#ifdef USE_MAP\n vec4 tA = texture2D(map, vMapUv); vec4 tB = texture2D(map2, vUvB); diffuseColor *= gl_FrontFacing ? tA : tB;\n#endif');
  };
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 1; scene.add(mesh);
  return { mesh, mat, U };
}
