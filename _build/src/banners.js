// THE GARDEN: the rafters. Retired jerseys hang in an arc over each end, the way the real ones do: the basketball numbers
// over the west end in blue and orange, the hockey numbers over the east end in blue, red and white, the title years
// beside them. Numbers only, no names and no club marks. One more hangs among them: N3W YORKERS, 1,111 of 1,111, retired.
// Each banner is cloth: a fabric normal map, and a slow sway in the vertex shader from the air handlers.
import * as THREE from 'three';

const HOOPS = { field: '#1d428a', a: '#f58426', b: '#f6f3ea', ink: '#f6f3ea', city: 'NEW YORK' };
const ICE = { field: '#0038a8', a: '#ce1126', b: '#f6f3ea', ink: '#f6f3ea', city: 'NEW YORK' };
const W = 512, H = 1024;

function jersey(x, cx, top, w, h) { // a tank top: shoulders, arm holes, a scooped neck
  const l = cx - w / 2, r = cx + w / 2; x.beginPath();
  x.moveTo(l + w * 0.2, top); x.quadraticCurveTo(cx, top + h * 0.17, r - w * 0.2, top);   // the neck
  x.lineTo(r - w * 0.04, top); x.quadraticCurveTo(r - w * 0.06, top + h * 0.2, r, top + h * 0.3);   // right strap and arm hole
  x.lineTo(r, top + h); x.lineTo(l, top + h); x.lineTo(l, top + h * 0.3); x.quadraticCurveTo(l + w * 0.06, top + h * 0.2, l + w * 0.04, top); x.closePath();
}
function retired(num, C, sub) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = C.field; x.fillRect(0, 0, W, H);
  // the edge piping and the stripes at the foot
  x.strokeStyle = C.b; x.lineWidth = 10; x.strokeRect(18, 18, W - 36, H - 36); x.strokeStyle = C.a; x.lineWidth = 6; x.strokeRect(34, 34, W - 68, H - 68);
  [[C.a, 0], [C.b, 1], [C.a, 2]].forEach(([col, i]) => { x.fillStyle = col; x.fillRect(34, H - 190 + i * 34, W - 68, 22); });
  x.fillStyle = C.ink; x.font = '58px "N3W Skyline", Anton, Impact'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(C.city, W / 2, 104);
  // the jersey with the number on it
  jersey(x, W / 2, 170, 330, 470); x.fillStyle = C.b; x.fill(); x.lineWidth = 12; x.strokeStyle = C.a; x.stroke();
  x.save(); jersey(x, W / 2, 170, 330, 470); x.clip(); x.fillStyle = C.a; x.fillRect(0, 590, W, 22); x.restore();
  const big = num.length > 2 ? 150 : 250; x.font = `${big}px Anton, Impact`; x.lineJoin = 'round'; x.lineWidth = 14; x.strokeStyle = C.a; x.strokeText(num, W / 2, 420); x.fillStyle = C.field; x.fillText(num, W / 2, 420);
  x.font = '40px "JetBrains Mono", monospace'; x.fillStyle = C.ink; x.fillText(sub || 'RETIRED', W / 2, H - 236);
  return c;
}
function title(year, C, word) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = C.field; x.fillRect(0, 0, W, H); x.strokeStyle = C.b; x.lineWidth = 10; x.strokeRect(18, 18, W - 36, H - 36);
  x.fillStyle = C.a; x.fillRect(18, 150, W - 36, 30); x.fillRect(18, H - 300, W - 36, 30);
  x.fillStyle = C.ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '62px "N3W Skyline", Anton, Impact'; x.fillText(C.city, W / 2, 96);
  x.font = '86px "N3W Skyline", Anton, Impact'; word.split(' ').forEach((w, i) => x.fillText(w, W / 2, 300 + i * 100));
  x.font = '210px Anton, Impact'; x.fillStyle = C.b; x.fillText(year, W / 2, 600);
  return c;
}
function ours() { // MLow's: the eye, 1,111 of 1,111
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1a5a'); g.addColorStop(1, '#2962ff'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#f0f4f8'; x.lineWidth = 10; x.strokeRect(18, 18, W - 36, H - 36); x.strokeStyle = '#ff4fa3'; x.lineWidth = 6; x.strokeRect(34, 34, W - 68, H - 68);
  x.fillStyle = '#f0f4f8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '74px "N3W Skyline", Anton'; x.fillText('N3W YORKERS', W / 2, 110);
  // the eye: eight petals, the iris, the pupil
  x.save(); x.translate(W / 2, 330); for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); x.fillStyle = i % 2 ? '#ff4fa3' : '#f0f4f8'; x.beginPath(); x.ellipse(0, -96, 40, 70, 0, 0, 7); x.fill(); }
  x.fillStyle = '#f0f4f8'; x.beginPath(); x.arc(0, 0, 72, 0, 7); x.fill(); x.fillStyle = '#2962ff'; x.beginPath(); x.arc(0, 0, 48, 0, 7); x.fill(); x.fillStyle = '#05060f'; x.beginPath(); x.arc(0, 0, 20, 0, 7); x.fill(); x.restore();
  x.font = '150px Anton'; x.fillStyle = '#f0f4f8'; x.fillText('1,111', W / 2, 600); x.font = '44px "JetBrains Mono", monospace'; x.fillText('OF 1,111', W / 2, 690);
  x.fillStyle = '#ff4fa3'; x.fillRect(34, H - 230, W - 68, 26); x.fillStyle = '#f0f4f8'; x.font = '64px "N3W Skyline", Anton'; x.fillText('SOLD OUT', W / 2, H - 140); x.font = '30px "JetBrains Mono"'; x.fillText('BY MLOW · 2026', W / 2, H - 82);
  return c;
}

export function buildBanners(parent, tex, U, ceilY) {
  const g = new THREE.Group(); parent.add(g); U.bannerT = { value: 0 }; const hit = [];
  const fab = tex.fabricN; if (fab) fab.repeat.set(3, 6);
  const geo = new THREE.PlaneGeometry(2.5, 5.0, 4, 14);
  const mk = (canvas, act) => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.82, normalMap: fab || null, normalScale: new THREE.Vector2(0.6, 0.6), emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.08 });
    m.onBeforeCompile = (sh) => { sh.uniforms.uT = U.bannerT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = modelMatrix[3].x * 0.7 + modelMatrix[3].z * 1.3; float k = 1.0 - uv.y;
      transformed.z += (sin(uT * 0.55 + ph + position.y * 0.5) * 0.09 + sin(uT * 1.3 + ph * 2.0 + position.x * 1.4) * 0.025) * k * k;
      transformed.x += sin(uT * 0.4 + ph) * 0.04 * k * k;`); };
    const b = new THREE.Mesh(geo, m); if (act) { b.userData.act = act; hit.push(b); } return b; };
  const rodM = new THREE.MeshStandardMaterial({ color: 0x2c3038, metalness: 0.7, roughness: 0.4 });
  const hang = (b, cx, cz, r, a, y) => { const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; b.position.set(x, y, z); b.rotation.y = -a - Math.PI / 2; g.add(b);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.7, 6), rodM); bar.rotation.z = Math.PI / 2; bar.position.set(0, 2.56, 0); b.add(bar);
    const top = ceilY(Math.hypot(x, z)) - 1.7; for (const s of [-1, 1]) { const L = top - (y + 2.56); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, L, 3), rodM); w.position.set(s * 1.1, 2.56 + L / 2, 0); b.add(w); } };
  // west end: the basketball numbers and the two title years, the house banner in the middle
  const west = [['10'], ['12'], ['15'], ['15'], ['19'], ['22'], ['24'], ['33'], ['613']];
  const wList = west.map(([n]) => retired(n, HOOPS)); wList.splice(4, 0, ours()); wList.unshift(title('1970', HOOPS, 'WORLD CHAMPIONS')); wList.push(title('1973', HOOPS, 'WORLD CHAMPIONS'));
  wList.forEach((c, i) => { const a = Math.PI + (i - (wList.length - 1) / 2) * 0.112; hang(mk(c, i === 5 ? 'banner' : null), -16, 0, 21.5, a, 21.6 + Math.abs(i - (wList.length - 1) / 2) * 0.06); });
  // east end: the hockey numbers and the four title years
  const east = ['1', '2', '3', '7', '9', '9', '11', '11', '19', '30', '35'].map((n) => retired(n, ICE));
  const eList = [title('1928', ICE, 'CHAMPIONS'), title('1933', ICE, 'CHAMPIONS'), ...east, title('1940', ICE, 'CHAMPIONS'), title('1994', ICE, 'CHAMPIONS')];
  eList.forEach((c, i) => { const a = (i - (eList.length - 1) / 2) * 0.094; hang(mk(c), 16, 0, 22.5, a, 21.6 + Math.abs(i - (eList.length - 1) / 2) * 0.05); });
  return { group: g, hit };
}
