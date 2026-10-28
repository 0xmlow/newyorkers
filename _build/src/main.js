// ON LOCATION: New York at the movies, recast with New Yorkers. Walkable.
// Ten sets in a row, forked from THE MARKS engine. Each opens onto a photo plate rebuilt as geometry
// from its depth map (the MONA pass). The cast are Tripo GLBs with eye flowers for heads. Every room
// carries one trick: a mirror that answers back, a floor that plays, a grate that lifts you, a skeleton
// that moves when you look away, a staircase with no top, a deck that falls away under you.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { ROOMS, W, D, H_IN, PORTAL } from './rooms.js';
import { Sound } from './sound.js';
import { crowdInit, crowdTick, CROWD } from './crowd.js';

const $ = (s) => document.querySelector(s);
await Promise.race([Promise.all(['900 40px Fraunces', '700 40px "Space Grotesk"', '600 40px "IBM Plex Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
const Q = new URLSearchParams(location.search);
const MOBILE = matchMedia('(pointer:coarse)').matches;
const CAST = window.CAST || {};

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));   // two device pixels with a bloom chain on a 4K laptop screen is a space heater; 1.5 reads the same
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = +(Q.get('ex') || 0.9);
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x07080d, 0.018);
const FOV = MOBILE ? 72 : 66;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.05, 900);
camera.rotation.order = 'YXZ';

// ---------- the screen pass: colour, shimmer, wobble, grain ----------
// The scene renders into a target; one full screen triangle puts it on the glass with the room's look.
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: MOBILE ? 0 : 4 });
// Round thirteen: the target is flagged the way three flags an XR target, so the scene tone maps INTO it exactly as
// it would onto the screen and the plates (toneMapped false) stay untouched. The pass then only finishes the picture,
// which lets it run in every set: bloom on the practicals and neon, a lens vignette, edge fringing, grain.
rt.isXRRenderTarget = true; rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
const LITE = Q.has('lite');
const bloomA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }), bloomB = bloomA.clone();
const FSV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const brightMat = new THREE.ShaderMaterial({ uniforms: { tScene: { value: rt.texture }, uThr: { value: 0.66 } }, vertexShader: FSV, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tScene; uniform float uThr; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tScene, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(uThr, uThr + 0.35, l); gl_FragColor = vec4(c * k, 1.); }` });
const blurMat = new THREE.ShaderMaterial({ uniforms: { tIn: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: FSV, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tIn, vUv).rgb * 0.227;
      c += (texture2D(tIn, vUv + uDir * 1.385).rgb + texture2D(tIn, vUv - uDir * 1.385).rgb) * 0.316;
      c += (texture2D(tIn, vUv + uDir * 3.231).rgb + texture2D(tIn, vUv - uDir * 3.231).rgb) * 0.07;
      gl_FragColor = vec4(c, 1.); }` });
const postMat = new THREE.ShaderMaterial({
  uniforms: { tScene: { value: rt.texture }, tBloom: { value: bloomA.texture }, uBloom: { value: 0 }, uVig: { value: 0 }, uCA: { value: 0 }, uSat: { value: 1 }, uHeat: { value: 0 }, uWarp: { value: 0 }, uGrain: { value: 0 }, uTime: { value: 0 }, uFlash: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    uniform sampler2D tScene, tBloom; uniform float uSat, uHeat, uWarp, uGrain, uTime, uFlash, uBloom, uVig, uCA; uniform vec3 uTint; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      // heat: the air above the asphalt bends, strongest low in the frame
      uv.x += uHeat * 0.0045 * sin(uv.y * 90. + uTime * 7.) * smoothstep(0.75, 0.0, uv.y);
      uv.y += uHeat * 0.0025 * sin(uv.x * 70. - uTime * 5.) * smoothstep(0.75, 0.0, uv.y);
      // warp: the world breathes, for the motion after effect and the wish
      vec2 c = uv - 0.5; float r = length(c);
      uv = 0.5 + c * (1. + uWarp * 0.06 * sin(uTime * 2.2 - r * 9.));
      uv += uWarp * 0.004 * vec2(sin(uTime * 1.7 + uv.y * 6.), cos(uTime * 1.3 + uv.x * 6.));
      vec2 ca = (uv - 0.5) * uCA;
      vec4 col = texture2D(tScene, uv); col.r = texture2D(tScene, uv + ca).r; col.b = texture2D(tScene, uv - ca).b;
      col.rgb += texture2D(tBloom, uv).rgb * uBloom;
      float l = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
      col.rgb = mix(vec3(l), col.rgb, uSat) * uTint;
      col.rgb += (h(vUv * 800. + uTime) - 0.5) * uGrain * 0.09;
      col.rgb *= 1. - uGrain * 0.35 * r * r * 2.;
      col.rgb *= 1. - uVig * smoothstep(0.35, 0.95, r * 1.25);
      col.rgb = mix(col.rgb, vec3(1.), uFlash);
      gl_FragColor = vec4(col.rgb, 1.);
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const postQuad = new THREE.Mesh(tri, postMat); postQuad.frustumCulled = false; postScene.add(postQuad);
const POST = { sat: 1, heat: 0, warp: 0, grain: 0, flash: 0 };   // eased toward the room's targets
const FX = { warp: 0, sat: null, flash: 0 };                      // one off pushes from the rooms
function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); const pr = renderer.getPixelRatio(); rt.setSize(Math.round(innerWidth * pr), Math.round(innerHeight * pr)); const bw = Math.max(1, Math.round(innerWidth * pr / 4)), bh = Math.max(1, Math.round(innerHeight * pr / 4)); bloomA.setSize(bw, bh); bloomB.setSize(bw, bh); blurMat.userData.px = [1 / bw, 1 / bh]; }
addEventListener('resize', resize); resize();

const loading = { total: 0, done: 0 };
const mgr = new THREE.LoadingManager();
mgr.onProgress = (_u, d, t) => { loading.done = d; loading.total = t; const p = $('#lp'); if (p) p.style.width = (100 * d / Math.max(1, t)).toFixed(0) + '%'; };
const tex = new THREE.TextureLoader(mgr);
// round thirteen: the heavy pictures (paintings, plates, wallpapers) belong to the set that loaded them, so a phone
// can let go of them when it walks away and fetch them again when it comes back (see freeRoom below)
{ const L = tex.load.bind(tex); tex.load = (url, onL, onP, onE) => { const t = L(url, onL, onP, onE); if (BUILDING.i >= 0 && /assets\/(art|plates|walls)\//.test(url)) { t.userData.url = url; (ROOMS[BUILDING.i].heavy ||= []).push(t); } return t; }; }
const gltf = new GLTFLoader(mgr);
// round twelve: the CC0 props ship Draco compressed (_build/draco.py), the decoder is three's own, served from assets/draco
const draco = new DRACOLoader(); draco.setDecoderPath('assets/draco/'); gltf.setDRACOLoader(draco);
new HDRLoader(mgr).load('assets/env/night.hdr', (h) => {
  h.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(h).texture; h.dispose(); pm.dispose();
});
scene.environmentIntensity = 0.35;

// ---------- materials ----------
const SURF = {};
function surf(name, rep = 1, tint) {
  const k = name + rep + (tint || '');
  if (SURF[k]) return SURF[k];
  const ld = (s, srgb) => { const t = tex.load(`assets/tex/${name}_${s}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const m = new THREE.MeshStandardMaterial({ map: ld('c', true), normalMap: ld('n'), roughnessMap: ld('r'), color: tint ? new THREE.Color(tint) : 0xffffff });
  m.userData.rep = rep;
  return (SURF[k] = m);
}
function slab(w, h, d, mat, x, y, z, rep) {
  const g = new THREE.BoxGeometry(w, h, d);
  const r = rep || mat.userData.rep || 2, rx = mat.userData.repX || r, ry = mat.userData.repY || r, uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [d, h] : ay > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, uv.getX(i) * a / rx, uv.getY(i) * b / ry);
  }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.canvas = c; return t;
}
const FONT = '"Space Grotesk", "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Fraunces, Georgia, serif';
const MONO = '"IBM Plex Mono", Menlo, monospace';
function sign(text, { w = 4, h = 0.8, bg = '#111', fg = '#f4ead2', font = FONT, weight = 800, glow = 0, px = 256, pad = 0.12, border } = {}) {
  const cw = Math.round(px * w / h), t = canvasTex(cw, px, (g, W2, H2) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, W2, H2); }
    if (border) { g.strokeStyle = border; g.lineWidth = H2 * 0.05; g.strokeRect(H2 * .05, H2 * .05, W2 - H2 * .1, H2 - H2 * .1); }
    const lines = text.split('\n'); let fs = H2 * (1 - pad * 2) / lines.length * 0.86;
    g.font = `${weight} ${fs}px ${font}`; const mw = Math.max(...lines.map((l) => g.measureText(l).width));
    if (mw > W2 * (1 - pad)) { fs *= W2 * (1 - pad) / mw; g.font = `${weight} ${fs}px ${font}`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (glow) { g.shadowColor = fg; g.shadowBlur = glow; }
    lines.forEach((l, i) => g.fillText(l, W2 / 2, H2 / 2 + (i - (lines.length - 1) / 2) * fs * 1.1));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, toneMapped: false, fog: false }));
}

// ---------- world helpers ----------
const colliders = [];
const clickables = [];
const tickers = [];
const wall = (x1, z1, x2, z2) => { const c = { x1, z1, x2, z2 }; colliders.push(c); return c; };
const post = (x, z, r) => { const c = { x, z, r }; colliders.push(c); return c; };
const tick = (f) => tickers.push(f);
// a GLB group is empty until it loads, so the group remembers its click and glb() hands it on to the meshes
const clickable = (obj, fn, hint) => { obj.userData.click = fn; obj.userData.hint = hint; obj.traverse((o) => { if (o.isMesh && !clickables.includes(o)) { o.userData.click = fn; o.userData.hint = hint; clickables.push(o); } }); };

// the crowd (2026-10-28): the flower headed extras get bodies cut from the cast (crowd.js); ?crowd=old brings back the cylinders
crowdInit({ THREE, loader: gltf, on: Q.get('crowd') !== 'old', clickable, rig: Q.get('rig') !== 'off', mobile: MOBILE });
// the rigged crowd walks and looks once a frame (?rig=off keeps every character static)
tick((t, dt) => crowdTick(dt, camera)); window.__CROWD = CROWD;
const GLB = {};
// Tripo hands models back facing any which way; these turn each one so its front is three.js +Z.
// Read off the front and top renders (_build/front_sheet.py into work/sheet).
const H = Math.PI / 2;
// susan: H since 2026-10-28 (MLow: "doll face forward"); at 0 she stood side on. Her rig file was re-rigged facing +Z.
const YAW = { liberty_statue_v2: -H, bluesteel: -H, writer: H, boxer: Math.PI, workgirl: -H, tracksuit: -H, golfer: -H, wiseguy: -H, dog: Math.PI, cat: -H, deer: 0, folksinger: Math.PI, flyer: -H, anchor: -H, jeweler: -H, auggie: -H, bookseller: -H, susan: H, dad: Math.PI, libhead: -H, sedan: -H, prince: -H, agent: -H, famer: -H, annieh: -H, rosemary: -H, sonny: -H, clerk: -H, sally: 0, pigeonlady: -H, elf: -H, broker: -H, maria: -H, loretta: -H, hijacker: -H, bench: H, checker: -H, gown: -H, lensman: 0, discoking: -H, maitre: -H, hustler: Math.PI, ambulance: -H, ape: -H, boombox: -H, cabbie: H, dancer: -H, dress: -H, hotdog: -H, mlowtar: -H, moai: -H, popcorn: -H, puft: -H, usher: -H, trex: Math.PI, hydrant: Math.PI, pigeon: Math.PI, rat: -H, blindwoman: Math.PI, killer: -H, actress: -H, robber: -H, odette: Math.PI, bartender: -H, waltzers: -H, butcher: -H, felix: -H, oscar: -H, sailors: -H, editor: -H, assistant: -H, odile: 0 };
// a soft contact shadow under everything that stands on the floor: the cheapest realism there is
const BLOB = canvasTex(128, 128, (q) => { const g = q.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(0.55, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = g; q.fillRect(0, 0, 128, 128); });
const BLOB_M = new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 });
const BLOB_G = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
function glb(name, { h, len, x = 0, y = 0, z = 0, ry = 0, parent = scene, onload, shadow = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  // models load when their set, or the one next door, is where you are: fifteen sets of props up front is too much for a phone
  const ri = BUILDING.i;   // each set counts its models in flight, so the skate layout waits for the props to land
  PENDING.push({ room: ri, run: () => { const rr = ROOMS[ri]; if (rr) rr.loadingN = (rr.loadingN || 0) + 1; load(name, g, { h, len, y, onload, shadow, done: () => { if (rr) rr.loadingN--; } }); } });
  return g;
}
const PENDING = [], BUILDING = { i: -1 };
function wake(ri) { for (let k = PENDING.length - 1; k >= 0; k--) if (Math.abs(PENDING[k].room - ri) <= 1) { PENDING[k].run(); PENDING.splice(k, 1); } }
function load(name, g, { h, len, y, onload, shadow, done }) {
  (GLB[name] ||= new Promise((res, rej) => gltf.load(`assets/glb/${name}.glb`, (r) => res(r.scene), undefined, rej))).then((src) => {
    const o = src.clone(true), pv = new THREE.Group(); pv.add(o); pv.rotation.y = YAW[name] || 0; pv.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(pv), s = new THREE.Vector3(); b.getSize(s);
    const k = h ? h / s.y : len ? len / Math.max(s.x, s.z) : 1;
    const c = new THREE.Vector3(); b.getCenter(c);
    const sc = new THREE.Group(); sc.add(pv); sc.scale.setScalar(k); sc.position.set(-c.x * k, -b.min.y * k, -c.z * k);
    o.traverse((m) => { if (m.isMesh && m.material) { m.material.envMapIntensity = 1.2; m.castShadow = false; } });
    if (shadow && y < 0.4) { const sh = new THREE.Mesh(BLOB_G, BLOB_M); sh.scale.set(Math.max(0.3, s.x * k * 1.25), 1, Math.max(0.3, s.z * k * 1.25)); sh.position.y = 0.012; sh.renderOrder = 1; g.add(sh); }
    g.add(sc); g.userData.ready = true; if (g.userData.click) clickable(g, g.userData.click, g.userData.hint); onload && onload(g, sc);
  }).catch(() => { if (name.startsWith('ph_')) return; const ph = slab(0.5, h || 1, 0.5, new THREE.MeshStandardMaterial({ color: 0x333333 }), 0, (h || 1) / 2, 0); g.add(ph); }).finally(() => done && done());
  return g;
}

// ---------- the photo plates, rebuilt as space ----------
const TAN_H = 0.75;
function plate(room) {
  const g = new THREE.Group(); scene.add(g);
  const img = new Image(); img.src = `assets/depth/${room.plate}.png`;
  loading.total++;
  img.onload = () => {
    const cw = img.width, ch = img.height, c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const cx = c.getContext('2d'); cx.drawImage(img, 0, 0); const px = cx.getImageData(0, 0, cw, ch).data;
    const dAt = (u, v) => px[(Math.min(ch - 1, Math.round(v * (ch - 1))) * cw + Math.min(cw - 1, Math.round(u * (cw - 1)))) * 4] / 255;
    const tanV = TAN_H * ch / cw;
    const EYE = 1.6, near = EYE / (0.96 * tanV), far = room.far || 60;
    let dn = 0; for (let i = 0; i < 9; i++) dn += dAt(0.3 + i * 0.05, 0.98); dn /= 9;
    let dmin = 1; for (let i = 0; i < 400; i++) dmin = Math.min(dmin, dAt(Math.random(), Math.random() * 0.8));
    const a = (1 / near - 1 / far) / Math.max(0.05, dn - dmin), b = 1 / far - a * dmin;
    const NX = MOBILE ? 160 : 260, NY = Math.round(NX * ch / cw) + 1, pos = new Float32Array((NX + 1) * NY * 3), uvs = new Float32Array((NX + 1) * NY * 2), zz = new Float32Array((NX + 1) * NY);
    const zMin = PORTAL.dist + 0.03;
    let k = 0;
    for (let j = 0; j < NY; j++) for (let i = 0; i <= NX; i++, k++) {
      const u = i / NX, v = j / (NY - 1), x = u * 2 - 1, y = 1 - v * 2;
      let z = 1 / Math.max(1e-4, a * dAt(u, v) + b); z = Math.min(far * 1.4, Math.max(zMin, z * (room.zscale || 1)));
      pos[k * 3] = x * TAN_H * z; pos[k * 3 + 1] = EYE + y * tanV * z; pos[k * 3 + 2] = -z; zz[k] = z;
      uvs[k * 2] = u; uvs[k * 2 + 1] = 1 - v;
    }
    const idx = [];
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX; i++) {
      const p = j * (NX + 1) + i, q = p + NX + 1, zs = [zz[p], zz[p + 1], zz[q], zz[q + 1]];
      if (Math.max(...zs) / Math.min(...zs) > (room.tear || 2.6)) continue;
      idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(idx);
    const map = tex.load(`assets/plates/${room.plate}.jpg`); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    const fade = canvasTex(256, 128, (q, w, h) => {
      const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, '#000'); gx.addColorStop(0.035, '#fff'); gx.addColorStop(0.965, '#fff'); gx.addColorStop(1, '#000');
      q.fillStyle = gx; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'multiply';
      const gy = q.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, '#000'); gy.addColorStop(0.06, '#fff'); gy.addColorStop(1, '#fff'); q.fillStyle = gy; q.fillRect(0, 0, w, h);
    });
    const mat = new THREE.MeshBasicMaterial({ map, alphaMap: fade, transparent: true, fog: false, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color(room.plateTint || 0xffffff) });
    const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = -1; g.add(mesh);
    g.position.set(room.x0 + W / 2, room.plateY || 0, -D / 2 + PORTAL.dist);
    room.plateMesh = mesh;
    loading.done++;
  };
  return g;
}

// ---------- the New Yorkers on the walls ----------
const FRAMES = {
  black: { c: 0x111111, m: 0.2, r: 0.5, d: 0.06, b: 0.06 },
  gilt: { c: 0xb8902e, m: 1, r: 0.32, d: 0.1, b: 0.12 },
  steel: { c: 0x8c9196, m: 1, r: 0.38, d: 0.05, b: 0.04 },
  oak: { c: 0x6b4423, m: 0, r: 0.6, d: 0.06, b: 0.07 },
};
const artMeshes = [];
function hang(p, x, y, z, ry, w, style, parent = scene) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const f = FRAMES[style] || FRAMES.black;
  const fm = new THREE.MeshStandardMaterial({ color: f.c, metalness: f.m, roughness: f.r });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(1, 1, f.d), fm); fr.position.z = f.d / 2; g.add(fr);
  const mat = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.4 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); art.position.z = f.d + 0.002; g.add(art);
  const fit = (asp) => { const h = w / asp; art.scale.set(w, h, 1); fr.scale.set(w + f.b * 2, h + f.b * 2, 1); pl.position.y = -h / 2 - 0.2; };
  const t = tex.load(`assets/art/${p.f}`, (tt) => fit(tt.image.width / tt.image.height)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  mat.map = mat.emissiveMap = t;
  const pl = sign(`${p.t}\nNo. ${p.n}`, { w: Math.min(0.95, w * 0.72), h: 0.16, bg: '#f2ead8', fg: '#1b1b1b', font: MONO, weight: 600, px: 96 });
  pl.position.set(0, -w * 9 / 32 - 0.2, 0.03); g.add(pl);
  fit(16 / 9);
  art.userData.piece = p; p.mesh = art; p.group = g;
  clickable(art, () => openPiece(p), p.t);
  artMeshes.push(art);
  return g;
}

const lights = [];
for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffffff, 0, 26, 1.6); scene.add(l); lights.push(l); }
const hemi = new THREE.HemisphereLight(0x8899bb, 0x221a12, 0.4); scene.add(hemi);

// ---------- player ----------
const EYE = 1.62;
const P = { x: W / 2, z: D / 2 - 2.2, yaw: 0, pitch: -0.02, y: EYE, bob: 0, scale: 1, lift: 0, speed: 1, fov: FOV, back: 0, zoom: false, ride: null };
// the clock the sets run on: bullet time slows it, the strobe and the rides read it
const TIME = { scale: 1, target: 1, t: 0 };

import { buildRoom, eyeFlower } from './build.js';
import { createSkate, ollie, trick, step } from './skate.mjs';
import { makePark } from './skatepark.js';

// ---------- skate mode ----------
// K (or SKATE on a phone) changes the verbs, not the gallery: momentum instead of walking, an ollie on SPACE,
// three flips in the air that only score on a clean landing. The movement is skate.mjs (tested headless with
// node _build/src/skate.test.mjs); this is the adapter: a rider you can see, a chase camera, the HUD.
const SKATE = createSkate();
const OVERVIEW = Q.has('overview');
const PARK = makePark({ THREE, canvasTex, colliders, W, D });
const parkReady = (r) => r && r.built && !(r.loadingN > 0) && performance.now() - (r.enteredAt || 0) > 1200;
// goals are kept per browser: { setId: [true, false, true] }
const BEST = (() => { try { return JSON.parse(localStorage.getItem('onloc.skate.best') || '{}'); } catch (e) { return {}; } })();
const GOALS = (() => { try { return JSON.parse(localStorage.getItem('onloc.skate.goals') || '{}'); } catch (e) { return {}; } })();
function tally() { const n = Object.values(GOALS).reduce((a, d) => a + d.filter(Boolean).length, 0); $('#skatesum').textContent = n ? `${n} / ${ROOMS.length * 3}` : ''; }
function goal(r, k) {
  const p = PARK.PARK[r.id]; if (!p) return; const done = GOALS[r.id] ||= [];
  if (done[k]) return; done[k] = true; try { localStorage.setItem('onloc.skate.goals', JSON.stringify(GOALS)); } catch (e) {}
  sound.ding(); tally(); toast(`GOAL ${done.filter(Boolean).length} OF ${p.goals.length}: ${p.goals[k].text}`, 3600);
  if (p.goals.every((_, i) => done[i])) setTimeout(() => toast(`Every goal on the ${(r.film || r.name).replace(/, \d{4}$/, '')} set. ${Object.values(GOALS).reduce((a, d) => a + d.filter(Boolean).length, 0)} goals across the city.`, 4200), 3800);
}
const SK = { acc: 0, blend: 0, orbit: 0, anim: null, debug: Q.has('debug'), pos: new THREE.Vector3(), q: new THREE.Quaternion(), fpPos: new THREE.Vector3(), fpQ: new THREE.Quaternion() };
const rider = new THREE.Group(); rider.visible = false; scene.add(rider);
{ const board = new THREE.Group(); rider.add(board); rider.userData.board = board;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.8), [0, 0, new THREE.MeshStandardMaterial({ color: 0x15161c, roughness: 0.95 }), new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.5 }), 0, 0].map((m) => m || new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.7 })));
  deck.position.y = 0.09; board.add(deck);
  const wheel = new THREE.CylinderGeometry(0.03, 0.03, 0.035, 14), wm = new THREE.MeshStandardMaterial({ color: 0xff4fa3, roughness: 0.4 });
  for (const [x, z] of [[-0.09, -0.27], [0.09, -0.27], [-0.09, 0.27], [0.09, 0.27]]) { const w = new THREE.Mesh(wheel, wm); w.rotation.z = Math.PI / 2; w.position.set(x, 0.035, z); board.add(w); }
  // the rider is cast like everyone else on the sets: dark clothes and an eye flower for a head
  const body = new THREE.Group(); rider.add(body); rider.userData.body = body;
  const cloth = new THREE.MeshStandardMaterial({ color: 0x1b1d26, roughness: 0.85 }), jacket = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
  const limb = (r, h, m, x, y, z, rz = 0) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 10), m); o.position.set(x, y, z); o.rotation.z = rz; body.add(o); return o; };
  limb(0.07, 0.62, cloth, 0, 0.5, -0.17, 0.12); limb(0.07, 0.62, cloth, 0, 0.5, 0.17, -0.12);
  limb(0.17, 0.42, jacket, 0, 1.12, 0); limb(0.05, 0.5, jacket, 0, 1.08, -0.3, 0.9).rotation.x = 0.5; limb(0.05, 0.5, jacket, 0, 1.08, 0.3, -0.9).rotation.x = -0.5;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; eyeFlower(cv.getContext('2d'), 128, 128, 120);
  const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht, transparent: true })); head.scale.set(0.62, 0.62, 1); head.position.y = 1.62; body.add(head);
  body.rotation.y = Math.PI / 2;   // skaters ride sideways on the board
  rider.userData.capsule = body;
  // sparks off the steel when you grind
  const N = 40, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd27a, size: 0.035, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sparks.frustumCulled = false; scene.add(sparks); rider.userData.sparks = { sparks, pos, vel, life, k: 0 }; }
// the rider is one of the cast: the Warriors' tough from the Coney Island set (a Tripo model), standing on the board
// the roster: the cast of the sets, by the film they came from (press C, or RIDER, to pick)
const ROSTER = [
  ['tough', 'The Warrior', 'The Warriors'], ['bluesteel', 'Blue Steel', 'Zoolander'], ['dancer', 'The Dancer', 'Joker'], ['discoking', 'The Disco King', 'Saturday Night Fever'],
  ['boxer', 'The Boxer', 'Raging Bull'], ['cabbie', 'The Cabbie', 'Taxi Driver'], ['workgirl', 'The Working Girl', 'Working Girl'], ['hustler', 'The Hustler', 'Midnight Cowboy'],
  ['prince', 'The Prince', 'Coming to America'], ['elf', 'The Elf', 'Miracle on 34th Street'], ['pigeonlady', 'The Pigeon Lady', 'Home Alone 2'], ['susan', 'Susan', 'Desperately Seeking Susan'],
  ['sally', 'Sally', 'When Harry Met Sally'], ['maria', 'Maria', 'West Side Story'], ['loretta', 'Loretta', 'Moonstruck'], ['rosemary', 'Rosemary', "Rosemary's Baby"],
  ['annieh', 'Annie', 'Annie Hall'], ['agent', 'The Agent', 'Men in Black'], ['jeweler', 'The Jeweler', 'Uncut Gems'], ['broker', 'The Broker', 'Wall Street'],
  ['writer', 'The Writer', 'Wild Style'], ['famer', 'The Fame Kid', 'Fame'], ['sonny', 'Sonny', 'Dog Day Afternoon'], ['clerk', 'The Clerk', 'The Apartment'],
  ['wiseguy', 'The Wiseguy', 'Mean Streets'], ['tracksuit', 'The Tenenbaum', 'The Royal Tenenbaums'], ['golfer', 'The Golfer', 'I Am Legend'], ['folksinger', 'The Folk Singer', 'Inside Llewyn Davis'],
  ['flyer', 'The Birdman', 'Birdman'], ['anchor', 'The Anchor', 'Network'], ['auggie', 'Auggie', 'Smoke'], ['bookseller', 'The Bookseller', "You've Got Mail"],
  ['dad', 'The Dad', 'Kramer vs. Kramer'], ['gown', 'The Gown', "Breakfast at Tiffany's"], ['dress', 'The White Dress', 'The Seven Year Itch'], ['lensman', 'The Lensman', 'Rear Window'],
  ['maitre', "The Maitre d'", 'Goodfellas'], ['actress', 'The Actress', 'Tootsie'], ['killer', 'The Killer', 'Wait Until Dark'], ['robber', 'The Robber', 'Inside Man'],
  ['odette', 'Odette', 'Black Swan'], ['odile', 'Odile', 'Black Swan'], ['bartender', 'The Bartender', 'Cocktail'], ['butcher', 'The Butcher', 'Gangs of New York'],
  ['felix', 'Felix', 'The Odd Couple'], ['oscar', 'Oscar', 'The Odd Couple'], ['editor', 'The Editor', 'The Devil Wears Prada'], ['assistant', 'The Assistant', 'The Devil Wears Prada'],
  ['usher', 'The Usher', 'The Ziegfeld'], ['blindwoman', 'The Blind Woman', 'Wait Until Dark'], ['hijacker', 'The Hijacker', 'Pelham One Two Three'],
  ['puft', 'Mr. Marshmallow', 'Ghostbusters', 2.3], ['ape', 'Kong', 'King Kong', 2.1], ['trex', 'The T. rex', 'Night at the Museum', 2.3], ['moai', 'The Moai', 'Night at the Museum', 1.9],
  ['mlowtar', 'MLOWTAR', 'Big', 1.8], ['deer', 'The Deer', 'I Am Legend', 1.4], ['dog', 'The Dog', 'I Am Legend', 0.75], ['cat', 'The Cat', 'Inside Llewyn Davis', 0.6],
  ['rat', 'The Rat', 'Enchanted', 0.5], ['pigeon', 'The Pigeon', 'The Warriors', 0.42], ['gull', 'The Gull', 'Working Girl', 0.45],
];
let riderName = (() => { try { return localStorage.getItem('onloc.skate.rider') || 'tough'; } catch (e) { return 'tough'; } })();
if (!ROSTER.some((r) => r[0] === riderName)) riderName = 'tough';
function riderModel(name = riderName) {
  if (rider.userData.model && rider.userData.modelName === name) return;
  if (rider.userData.model) { rider.remove(rider.userData.model); rider.userData.capsule.visible = true; rider.userData.body = rider.userData.capsule; }
  const row = ROSTER.find((r) => r[0] === name) || ROSTER[0], hold = new THREE.Group(); hold.position.y = 0.11; hold.rotation.y = Math.PI / 2 - 0.45; rider.add(hold);
  rider.userData.model = hold; rider.userData.modelName = name; riderName = name;
  load(name, hold, { h: row[3] || 1.72, y: 0, shadow: false, onload: () => { if (rider.userData.model !== hold) return; rider.userData.capsule.visible = false; rider.userData.body = hold; } });
}
function pickRider(name) { riderModel(name); try { localStorage.setItem('onloc.skate.rider', name); } catch (e) {} const row = ROSTER.find((r) => r[0] === name); toast(`You ride as ${row[1]}, from ${row[2]}.`, 2600);
  document.querySelectorAll('#ridergrid button').forEach((b) => b.classList.toggle('on', b.dataset.r === name)); }
{ const grid = $('#ridergrid'); grid.innerHTML = ROSTER.map(([k, n, f]) => `<button type="button" data-r="${k}" class="${k === riderName ? 'on' : ''}"><b>${n}</b><small>${f}</small></button>`).join('');
  grid.querySelectorAll('button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); pickRider(b.dataset.r); }));
  const box = $('#riderbox'); const openRider = (on = box.hidden) => { box.hidden = !on; if (on && !SKATE.active) setSkate(true); };
  $('#riderbtn').addEventListener('click', (e) => { e.stopPropagation(); openRider(); }); $('#riderx').addEventListener('click', () => openRider(false));
  box.addEventListener('click', (e) => { if (e.target === box) openRider(false); });
  window.__openRider = openRider; }
function setSkate(on) {
  if (on === SKATE.active || !started || P.ride) return;
  const score = SKATE.score; Object.assign(SKATE, createSkate(), { active: on, score, x: P.x, z: P.z, yaw: P.yaw }); SK.acc = 0; SK.anim = null; if (on) { riderModel(); if (!SK.told) { SK.told = true; setTimeout(() => toast('C picks your rider. The mouse looks round; the board follows W A S D.', 3800), 4600); } }
  if (!on) sound.skate(0, false, true);
  P.lift = 0; P.roll = 0; if (on && P.zoom) zoom(false); if (on) SK.pos.copy(camera.position);
  $('#hud').classList.toggle('skating', on); $('#skatebtn').classList.toggle('on', on); $('#skate').classList.toggle('on', on); tally();
  toast(on ? (MOBILE ? 'Left thumb pushes and steers, OLLIE to jump, SKATE to walk again.' : PAD.on ? 'Right trigger push, left trigger brake, stick steers, A ollie, X B Y flip, View to walk.' : 'W push, S brake, A and D steer, SPACE ollie, 1 2 3 flip the board in the air. Ollie onto the rails. K to walk.') : 'Walk mode.');
}
// ---------- gamepad ----------
// a standard pad: left stick walks or steers, right stick looks, A clicks (walking) or ollies (skating), X B Y flip,
// right trigger pushes, left trigger brakes, LB and RB the previous and next set, View (or Y, walking) toggles skating
const PAD = { on: false, lx: 0, ly: 0, rt: 0, lt: 0, prev: [] };
addEventListener('gamepadconnected', () => { PAD.on = true; toast('Controller in. Y to skate, A to ollie, X B Y to flip, triggers to push and brake.', 4200); });
function pad(dt) {
  const gp = [...(navigator.getGamepads?.() || [])].find((g) => g && g.connected); if (!gp) { PAD.lx = PAD.ly = PAD.rt = PAD.lt = 0; return; }
  const dz = (v) => Math.abs(v) < 0.15 ? 0 : v, b = (i) => !!gp.buttons[i]?.pressed, hit = (i) => b(i) && !PAD.prev[i];
  PAD.on = true; PAD.lx = dz(gp.axes[0] || 0); PAD.ly = dz(gp.axes[1] || 0); PAD.rt = gp.buttons[7]?.value || 0; PAD.lt = gp.buttons[6]?.value || 0;
  const rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
  if (!SKATE.active || P.ride) { P.yaw -= rx * 2.6 * dt; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - ry * 1.8 * dt)); }
  else P.yaw -= rx * 1.2 * dt;
  if (started) {
    if (hit(8) || (!SKATE.active && hit(3))) setSkate(!SKATE.active);
    else if (SKATE.active && !P.ride) { if (hit(0)) ollie(SKATE); if (hit(2)) skateTrick(0); if (hit(1)) skateTrick(1); if (hit(3)) skateTrick(2); }
    else { if (hit(0)) interact(); if (hit(5)) go(Math.min(ROOMS.length - 1, cur + 1)); if (hit(4)) go(Math.max(0, cur - 1)); }
  }
  PAD.prev = gp.buttons.map((x) => x.pressed);
}
function skateTrick(k) { if (trick(SKATE, k)) SK.anim = { k, t: 0 }; }
// the camera never goes through a wall: sweep the line from the rider to where the camera wants to be, stop short of the first hit
function sweep(ax, az, bx, bz) {
  let best = 1; const dx = bx - ax, dz = bz - az;
  for (const c of colliders) {
    if (c.off) continue;
    if (c.r !== undefined) { const fx = ax - c.x, fz = az - c.z, A = dx * dx + dz * dz, B = 2 * (fx * dx + fz * dz), C = fx * fx + fz * fz - (c.r + 0.2) ** 2, disc = B * B - 4 * A * C; if (C > 0 && disc > 0) { const t = (-B - Math.sqrt(disc)) / (2 * A); if (t > 0 && t < best) best = t; } continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
    const t = ((c.x1 - ax) * ez - (c.z1 - az) * ex) / den, u = ((c.x1 - ax) * dz - (c.z1 - az) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return Math.max(0.12, best - 0.08);
}
const ctx = { keys: null, wake: (i) => wake(i), THREE, scene, camera, renderer, surf, slab, sign, canvasTex, glb, wall, post, tick, clickable, hang, plate, tex, egg, toast, say, sound: null, MOBILE, shake, FONT, SERIF, MONO, P, FX, EYE, flash, TIME, zoom, ride, ray, hemi, lights };
ROOMS.forEach((r, i) => { r.i = i; r.x0 = i * W; r.prev = ROOMS[i - 1]?.name; r.next = ROOMS[i + 1]?.name; r.last = i === ROOMS.length - 1; r.cast = CAST[r.id] || []; });
window.__clickables = clickables;
// Round thirteen: sets are built when you come near them, not all 105 at load. Building every set up front put
// 105 plates, 1,260 paintings and every wallpaper on the GPU at once, and a phone gave up before the first frame.
const NEAR = MOBILE ? 1 : 2, KEEP = MOBILE ? 2 : 5;
function ensure(i) {
  const r = ROOMS[i]; if (!r || r.built) return;
  r.built = true; BUILDING.i = i;
  try { buildRoom(ctx, r); } catch (e) { console.error('set ' + r.id, e); }
  BUILDING.i = -1;
  if (r.freed) r.freed = false;
}
// walking away: the GPU copies go (three uploads them again on the next draw), and on a phone the big images too
const BLANK = document.createElement('canvas'); BLANK.width = BLANK.height = 1;
function freeRoom(r) {
  if (!r.built || r.freed) return; r.freed = true;
  const seen = new Set(), drop = (o) => { if (o && !seen.has(o)) { seen.add(o); o.dispose(); } };
  const walk = (root) => root && root.traverse((m) => {
    if (m.geometry) drop(m.geometry);
    for (const mt of [].concat(m.material || [])) { drop(mt); for (const k in mt) { const v = mt[k]; if (v && v.isTexture && !v.isRenderTargetTexture) drop(v); } }
  });
  walk(r.group); walk(r.plateMesh);
  if (MOBILE) for (const t of r.heavy || []) if (t.image && t.image !== BLANK) { t.dispose(); t.userData.img = null; t.image = BLANK; t.needsUpdate = true; }
}
function wakeRoom(r) {
  if (!r.freed) return; r.freed = false;
  for (const t of r.heavy || []) if (t.image === BLANK && t.userData.url) { const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; }; im.src = t.userData.url; }
}
function near3(i) {
  for (let d = 0; d <= NEAR; d++) for (const j of d ? [i + d, i - d] : [i]) { const r = ROOMS[j]; if (!r) continue; ensure(j); wakeRoom(r); }
  ROOMS.forEach((r) => { if (Math.abs(r.i - i) > KEEP) freeRoom(r); });
}

if (Q.get('room')) { const r = ROOMS.find((q) => q.id === Q.get('room')); if (r) P.x = r.x0 + W / 2; }
if (Q.get('cam')) { const [x, z, yaw, pitch] = Q.get('cam').split(',').map(Number); P.x = x; P.z = z; P.yaw = yaw || 0; P.pitch = pitch || 0; }
const keys = {}; ctx.keys = keys;
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.target.closest?.('input,textarea,[contenteditable=true]')) return;
  keys[e.code] = true;
  if (SKATE.active && /^(Space|Arrow)/.test(e.code)) e.preventDefault();
  if (e.code === 'KeyK' && !e.repeat) setSkate(!SKATE.active);
  if (e.code === 'KeyN' && !e.repeat && started) setWay(!WAY.on);
  if (e.code === 'Backquote' && !e.repeat) SK.debug = !SK.debug;
  if (e.code === 'KeyC' && !e.repeat && started) window.__openRider();
  if (e.code === 'Escape' && !$('#riderbox').hidden) { $('#riderbox').hidden = true; return; }
  // skating, SPACE is the ollie and 1 2 3 are the flips; E still clicks whatever you face
  if (SKATE.active && !P.ride) { if (e.code === 'Space' && !e.repeat) ollie(SKATE); if (/^Digit[123]$/.test(e.code) && !e.repeat) skateTrick(+e.code.slice(5) - 1); if (e.code === 'KeyE') interact(); }
  else { if (e.code === 'KeyE' || e.code === 'Space') interact(); if (/^Digit[0-9]$/.test(e.code)) { const n = +e.code.slice(5); go((n === 0 ? 9 : n - 1) + (e.shiftKey ? 10 : 0)); } } if (started && e.code === 'BracketRight') go(Math.min(ROOMS.length - 1, cur + 1)); if (started && e.code === 'BracketLeft') go(Math.max(0, cur - 1)); if (started && e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) go(1 + Math.floor(Math.random() * (ROOMS.length - 1))); if (e.code === 'KeyM') sound.toggle(); if (e.code === 'Escape') closePiece(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
// a lost window would keep W held down forever: let go of every key and stop the board
addEventListener('blur', () => { for (const k in keys) keys[k] = false; SKATE.v = 0; });
$('#skatebtn').addEventListener('click', (e) => { e.stopPropagation(); setSkate(!SKATE.active); });
$('#waybtn').addEventListener('click', (e) => { e.stopPropagation(); setWay(!WAY.on); });
$('#olliebtn').addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (SKATE.height > 0.2) skateTrick(Math.floor(Math.random() * 3)); else ollie(SKATE); }, { passive: false });
$('#olliebtn').addEventListener('click', (e) => { e.stopPropagation(); if (SKATE.height > 0.2) skateTrick(Math.floor(Math.random() * 3)); else ollie(SKATE); });
let locked = false;
const lock = () => { try { const p = cnv.requestPointerLock?.(); p && p.catch && p.catch(() => {}); } catch (e) {} };
const cnv = renderer.domElement;
cnv.addEventListener('click', (e) => {
  if (!started) return;
  if (!MOBILE && !locked && !Q.has('nolock')) { lock(); return; }
  interact(locked ? null : e);
});
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cnv; $('#hud').classList.toggle('locked', locked); });
addEventListener('mousemove', (e) => { if (!locked || P.ride) return; const k = P.zoom ? 0.0005 : 0.0022; if (SKATE.active) { SK.orbit = Math.max(-2.8, Math.min(2.8, SK.orbit - e.movementX * k)); P.pitch = Math.max(-1.0, Math.min(0.6, P.pitch - e.movementY * k)); return; } P.yaw -= e.movementX * k; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - e.movementY * k)); });
const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0 }, look = { id: null, x: 0, y: 0, t: 0, moved: 0 };
cnv.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) { if (t.clientX < innerWidth * 0.42 && stick.id === null) { Object.assign(stick, { id: t.identifier, x: t.clientX, y: t.clientY, dx: 0, dy: 0 }); $('#stick').style.cssText = `display:block;left:${t.clientX - 50}px;top:${t.clientY - 50}px`; } else if (look.id === null) Object.assign(look, { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now(), moved: 0 }); } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.dx = Math.max(-1, Math.min(1, (t.clientX - stick.x) / 50)); stick.dy = Math.max(-1, Math.min(1, (t.clientY - stick.y) / 50)); $('#knob').style.transform = `translate(${stick.dx * 30}px,${stick.dy * 30}px)`; } if (t.identifier === look.id) { const dx = t.clientX - look.x, dy = t.clientY - look.y; look.moved += Math.abs(dx) + Math.abs(dy); if (SKATE.active) SK.orbit = Math.max(-2.8, Math.min(2.8, SK.orbit - dx * 0.005)); else P.yaw -= dx * 0.005; P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch - dy * 0.004)); look.x = t.clientX; look.y = t.clientY; } } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.id = null; stick.dx = stick.dy = 0; $('#stick').style.display = 'none'; $('#knob').style.transform = ''; } if (t.identifier === look.id) { if (look.moved < 12 && performance.now() - look.t < 350) interact({ clientX: t.clientX, clientY: t.clientY }); look.id = null; } } });

function collide(nx, nz) {
  const R = 0.32 * P.scale;
  for (const c of colliders) {
    if (c.off) continue;
    if (c.r !== undefined) { const dx = nx - c.x, dz = nz - c.z, d = Math.hypot(dx, dz), m = c.r + R; if (d < m && d > 1e-6) { nx = c.x + dx / d * m; nz = c.z + dz / d * m; } continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez; let t = ((nx - c.x1) * ex + (nz - c.z1) * ez) / L2; t = Math.max(0, Math.min(1, t));
    const px = c.x1 + ex * t, pz = c.z1 + ez * t, dx = nx - px, dz = nz - pz, d = Math.hypot(dx, dz);
    if (d < R && d > 1e-6) { nx = px + dx / d * R; nz = pz + dz / d * R; }
  }
  return [nx, nz];
}
function go(i) { const r = ROOMS[i]; if (!r) return; Object.assign(SKATE, { v: 0, y: 0, height: 0, vy: 0, air: false, grind: null, pending: 0, tricks: [], busy: 0, wiped: false, takeoff: null }); SK.anim = null; P.x = r.x0 + W / 2; P.z = D / 2 - 2.2; P.yaw = 0; P.pitch = -0.02; settle(); }
// a set that parks a prop on the arrival point used to put you inside it: step out of anything you land in
function settle() { for (let k = 0; k < 4; k++) [P.x, P.z] = collide(P.x, P.z); }
window.__go = go;
// ---------- the way out ----------
// N, or the WAY OUT pill, lights a dotted line on the floor from your feet to the next set's door. It searches the live
// colliders the way collide() does and respects the skate ramps the way the walk does, so if it finds no route there is
// none, and it says so instead of pretending. Five sets had a prop parked on the arrival point and one had a car whose
// doorway and collider disagreed; this exists so the next one of those is a toast, not a mystery.
const WAY = { on: false, mesh: null, n: 0, at: 0, px: 0, pz: 0, room: -1, hinted: false, path: null };
{ const geo = new THREE.CircleGeometry(0.075, 12).rotateX(-Math.PI / 2);
  WAY.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xf5c542, toneMapped: false, transparent: true, opacity: 0.92, depthWrite: false }), 700);
  WAY.mesh.frustumCulled = false; WAY.mesh.visible = false; WAY.mesh.renderOrder = 2; WAY.mesh.count = 0; scene.add(WAY.mesh); }
const _wm = new THREE.Matrix4(), _wc = new THREE.Color();
function wayFind() {
  const r = ROOMS[cur], next = ROOMS[cur + 1]; if (!r) return null; if (!next) return 'last';
  const CELL = 0.2, RAD = 0.34, x0 = r.x0 - 0.6, x1 = next.x0 + 1.6, NX = Math.round((x1 - x0) / CELL) + 1, NZ = Math.round(D / CELL) + 1;
  const cols = colliders.filter((c) => !c.off && !c.timed && (c.r !== undefined ? (c.x > x0 - 2 && c.x < x1 + 2) : (Math.max(c.x1, c.x2) > x0 - 2 && Math.min(c.x1, c.x2) < x1 + 2)));
  const free = (x, z) => { for (const c of cols) { if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + RAD) return false; continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez || 1e-9; let t = ((x - c.x1) * ex + (z - c.z1) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; if (Math.hypot(x - (c.x1 + ex * t), z - (c.z1 + ez * t)) < RAD) return false; } return true; };
  const ix = (x) => Math.max(0, Math.min(NX - 1, Math.round((x - x0) / CELL))), iz = (z) => Math.max(0, Math.min(NZ - 1, Math.round((z + D / 2) / CELL)));
  const roomAt = (x) => ROOMS[Math.max(0, Math.min(ROOMS.length - 1, Math.floor(x / W)))];
  const surfAt = (x, z) => { const R = roomAt(x); return PARK.surface(R, x, z) + (R.ground ? R.ground(x - R.x0, z) : 0); };
  const start = iz(P.z) * NX + ix(P.x), goal = iz(3.8) * NX + ix(next.x0 + 1.0);
  const prev = new Int32Array(NX * NZ).fill(-1), q = [start]; prev[start] = start; let found = -1;
  for (let h = 0; h < q.length && found < 0; h++) { const k = q[h], i = k % NX, j = (k - i) / NX; if (k === goal) { found = k; break; }
    const x = x0 + i * CELL, z = -D / 2 + j * CELL, s0 = surfAt(x, z);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || ii >= NX || jj < 0 || jj >= NZ) continue; const kk = jj * NX + ii; if (prev[kk] >= 0) continue;
      const xx = x0 + ii * CELL, zz = -D / 2 + jj * CELL; if (!free(xx, zz) || surfAt(xx, zz) > s0 + 0.3) continue; prev[kk] = k; q.push(kk); } }
  if (found < 0) return null;
  const path = []; for (let k = found; k !== prev[k]; k = prev[k]) { const i = k % NX, j = (k - i) / NX; const x = x0 + i * CELL, z = -D / 2 + j * CELL; path.push([x, surfAt(x, z) + 0.025, z]); }
  return path.reverse();
}
function wayDraw(path) {
  const m = WAY.mesh; let n = 0;
  for (let k = 1; k < path.length && n < 700; k += 2) { const [x, y, z] = path[k]; _wm.makeTranslation(x, y, z); m.setMatrixAt(n, _wm); m.setColorAt(n, _wc.set(0xf5c542)); n++; }
  m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.visible = n > 0; WAY.n = n; WAY.path = path;
}
function wayUpdate(force) {
  if (!WAY.on) return;
  const moved = Math.hypot(P.x - WAY.px, P.z - WAY.pz) > 0.7 || WAY.room !== cur;
  if (!force && !moved) return;
  WAY.px = P.x; WAY.pz = P.z; WAY.room = cur;
  const path = wayFind();
  if (path === 'last') { WAY.mesh.visible = false; WAY.n = 0; if (force) toast('This is the last set. The way out is the way you came: [ takes you back a set.', 4200); return; }
  if (!path) { WAY.mesh.visible = false; WAY.n = 0; if (force || moved) toast(`No clear walk to the next door from here. ] jumps you to ${ROOMS[cur + 1].name}.`, 4200); return; }
  wayDraw(path);
}
function wayTick(t) {
  if (!WAY.on) { if (!WAY.hinted && started && cur > 0 && !SKATE.active && ROOMS[cur].enteredAt && performance.now() - ROOMS[cur].enteredAt > 90000) { WAY.hinted = true; toast('Lost in the set? N, or the WAY OUT button, lights a line on the floor to the next door.', 5200); } return; }
  if ((t - WAY.at) > 0.5) { WAY.at = t; wayUpdate(false); }
  const m = WAY.mesh; if (!m.visible || !m.instanceColor) return;
  for (let k = 0; k < WAY.n; k++) { const b = 0.45 + 0.55 * Math.max(0, Math.sin(t * 5 - k * 0.45)); m.setColorAt(k, _wc.setRGB(b, b * 0.8, b * 0.27)); } m.instanceColor.needsUpdate = true;
}
function setWay(on) {
  WAY.on = on; $('#waybtn').classList.toggle('on', on); WAY.hinted = true;
  if (on) { WAY.at = 0; wayUpdate(true); if (WAY.n) toast('Follow the dots. N or WAY OUT turns them off.', 2600); }
  else { WAY.mesh.visible = false; WAY.n = 0; }
}
window.__WAY = WAY; window.__wayFind = wayFind; window.__setWay = setWay;


// ---------- interaction ----------
const ray = new THREE.Raycaster(); ray.far = 14;
function pick(e) {
  const v = e ? new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1) : new THREE.Vector2(0, 0);
  ray.setFromCamera(v, camera);
  const hit = ray.intersectObjects(clickables.filter((o) => o.visible && near(o)), false)[0];
  ctx.lastHit = hit || null;
  return hit && hit.object;
}
const _w = new THREE.Vector3();
const near = (o) => { o.getWorldPosition(_w); return Math.abs(_w.x - P.x) < 16; };
function interact(e) { if ($('#card').classList.contains('on')) return; const o = pick(e); if (o && o.userData.click) { sound.click(); o.userData.click(o); } }

// ---------- binoculars, the long take ----------
// Z (or any pair of binoculars on a set) narrows the lens to 14 degrees behind a binocular mask.
function zoom(on = !P.zoom) { P.zoom = on; $('#binoc').classList.toggle('on', on); ray.far = on ? 90 : 14; if (on) egg('binocs', 'Binoculars. Everybody in this city is watching somebody. Press Z again to put them down.'); }
// a ride: the camera follows a curve for dur seconds, looking a little ahead, with letterbox bars; input waits
function ride(curve, dur, onEnd) { P.ride = { curve, dur, t0: clock.elapsedTime, onEnd }; $('#bars').classList.add('on'); }
addEventListener('keydown', (e) => { if (e.code === 'KeyZ' && started) zoom(); });

// ---------- HUD ----------
let tt; function toast(s, ms = 2800) { const el = $('#toast'); el.textContent = s; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), ms); }
const EGGS = new Set(), EGG_N = window.EGG_N || 30;
// the opening card and the closing card count themselves, so they can never be out of date again
{ const sets = ROOMS.filter((r) => /\d{4}$/.test(r.film || '')), yrs = sets.map((r) => +r.film.slice(-4)), fmt = (n) => n.toLocaleString('en-US');
  const put = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  put('i-sets', fmt(ROOMS.length)); put('i-sets2', fmt(ROOMS.length)); put('f-sets', fmt(ROOMS.length));   // the lobby is set one, as it always was
  put('i-eggs', fmt(EGG_N));
  put('i-sets3', fmt(ROOMS.length)); put('i-goals', fmt(ROOMS.length * 3));
  put('i-years', `${Math.min(...yrs)} TO ${Math.max(...yrs)}`); put('i-faces', fmt(ROOMS.reduce((a, r) => a + (r.cast || []).length, 0)));
  put('i-films', sets.map((r) => r.film.replace(/, (\d{4})$/, ' ($1)')).join('   ·   ')); }
$('#eggs').textContent = `0 / ${EGG_N}`;
function egg(id, line) {
  if (!EGGS.has(id)) {
    EGGS.add(id); $('#eggs').textContent = `${EGGS.size} / ${EGG_N}`; $('#eggbox').classList.add('pop'); setTimeout(() => $('#eggbox').classList.remove('pop'), 600); sound.ding();
    if (EGGS.size === EGG_N) setTimeout(() => toast('Every scene found. That is a wrap. You have been counted.', 5000), 3000);
  }
  if (line) toast(line, 3600);
}
const bubbles = [];
function say(anchor, text, ms = 3200, dy = 2.1) { const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; $('#bubbles').appendChild(el); const b = { anchor, el, until: performance.now() + ms, dy }; bubbles.push(b); return b; }
let shakeAmt = 0; function shake(a) { shakeAmt = Math.max(shakeAmt, a); }
function flash(v = 1) { FX.flash = Math.max(FX.flash, v); }

function openPiece(p) {
  const c = $('#card'); c.classList.add('on'); if (locked) document.exitPointerLock();
  $('#c-t').textContent = p.t; $('#c-no').textContent = `No. ${p.n}`;
  $('#c-p').textContent = [[p.h, p.b].filter(Boolean).join(', '), p.s].filter(Boolean).join('  ·  ');
  $('#c-k').textContent = `CAST AS A NEW YORKER · ${(ROOMS[cur]?.film || '').toUpperCase()}`;
  $('#c-a').href = `https://n3wyorkers.com/n/${p.n}`;
  $('#c-img').src = `assets/art/${p.f}`;
}
function closePiece() { $('#card').classList.remove('on'); }
$('#c-x').onclick = closePiece; $('#card').addEventListener('click', (e) => { if (e.target.id === 'card') closePiece(); });

// the piece you face, named at the top of the screen
const fwd = new THREE.Vector3(); let peekP = null;
function peek() {
  camera.getWorldDirection(fwd); let best = null, bs = 1e9;
  for (const a of artMeshes) {
    a.getWorldPosition(_w); const dx = _w.x - P.x, dz = _w.z - P.z, d = Math.hypot(dx, dz); if (d > 4.5) continue;
    const dot = (dx * fwd.x + dz * fwd.z) / (d * Math.hypot(fwd.x, fwd.z) + 1e-6); if (dot < 0.8) continue;
    const s = d * (1.6 - dot); if (s < bs) { bs = s; best = a; }
  }
  if (best === peekP) return; peekP = best;
  if (best) { const p = best.userData.piece; $('#peek').textContent = `${p.t}  ·  No. ${p.n}  ·  ${p.h}`; $('#peek').classList.add('on'); } else $('#peek').classList.remove('on');
}
window.__peekNear = () => peekP;

// ---------- rooms ui ----------
const nav = $('#rooms');
const COARSE = matchMedia('(pointer:coarse),(max-width:700px)').matches;
ROOMS.forEach((r, i) => { const b = document.createElement('button'); b.innerHTML = `<i>${COARSE ? i + 1 : (i + 1) % 10}</i><span>${COARSE && r.film ? r.name + ' · ' + r.film : r.name}</span>`; b.onclick = (e) => { e.stopPropagation(); go(i); nav.classList.remove('open'); }; nav.appendChild(b); });
$('#setsbtn').onclick = (e) => { e.stopPropagation(); nav.classList.toggle('open'); if (nav.classList.contains('open')) nav.children[cur]?.scrollIntoView({ block: 'center' }); };
let cur = -1;
function enter(i) {
  cur = i; const r = ROOMS[i]; r.enteredAt = performance.now(); near3(i); wake(i); settle(); if (SKATE.active) SK.greet = i; WAY.room = -1;
  [...nav.children].forEach((b, j) => b.classList.toggle('on', j === i)); $('#setsn').textContent = `${i + 1} / ${ROOMS.length}`;
  $('#rname').textContent = r.name; $('#rk').textContent = r.kicker; $('#rf').textContent = r.film;
  scene.fog.color.set(r.fog || 0x07080d); scene.fog.density = r.fogD || 0.018; scene.background.set(r.sky || 0x05060a);
  hemi.color.set(r.hemi?.[0] ?? 0x8899bb); hemi.groundColor.set(r.hemi?.[1] ?? 0x221a12); hemi.intensity = r.hemi?.[2] ?? 0.4;
  scene.environmentIntensity = r.env ?? 0.35;
  (r.lights || []).forEach((L, k) => { const l = lights[k]; l.position.set(r.x0 + L[0], L[1], L[2]); l.color.set(L[3]); l.userData.i = L[4]; l.distance = L[5] || 26; });
  for (let k = (r.lights || []).length; k < lights.length; k++) lights[k].userData.i = 0;
  sound.room(r.sound);
  r.onEnter && r.onEnter();
}

// ---------- power ----------
// A visitor wrote that the site turned their fans into a jet engine. A gallery that draws 120 frames a second at two
// device pixels, forever, with nobody touching it, is one. So the loop draws at most 60 a second, 30 once nothing has
// been touched for twenty seconds (skating and rides count as touching), and about six while the window is not the one
// in front. Everything that moves runs on dt, so nothing changes but the heat.
const POWER = { last: performance.now(), drawn: 0, blurred: !document.hasFocus() };
const touched = () => { POWER.last = performance.now(); };
for (const ev of ['keydown', 'mousemove', 'mousedown', 'touchstart', 'touchmove', 'wheel']) addEventListener(ev, touched, { passive: true });
addEventListener('blur', () => { POWER.blurred = true; }); addEventListener('focus', () => { POWER.blurred = false; touched(); });
function powerBudget() { if (POWER.blurred) return 160; if (SKATE.active || P.ride || performance.now() - POWER.last < 20000) return 15.5; return 32; }
window.__POWER = POWER; window.__powerBudget = powerBudget;

// ---------- loop ----------
const clock = new THREE.Clock(); let started = false;
const _cw = new THREE.Vector3(), _cl = new THREE.Vector3(), _co = new THREE.PerspectiveCamera();   // a camera, so lookAt points its -z (an Object3D would face away)
function frame() {
  const nowMs = performance.now(); if (nowMs - POWER.drawn < powerBudget()) { requestAnimationFrame(frame); return; } POWER.drawn = nowMs; POWER.frames = (POWER.frames || 0) + 1;
  const rdt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  TIME.scale += (TIME.target - TIME.scale) * Math.min(1, rdt * 6);
  const dt = rdt * TIME.scale; TIME.t += dt;
  let f = 0, s = 0; if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyA) s -= 1; if (keys.KeyD) s += 1;
  if (!SKATE.active) { if (keys.ArrowLeft) P.yaw += dt * 1.8; if (keys.ArrowRight) P.yaw -= dt * 1.8; }
  f -= stick.dy; s += stick.dx;
  pad(dt); f -= PAD.ly; s += PAD.lx; if (PAD.on && Math.abs(PAD.lx) + Math.abs(PAD.ly) + (PAD.rt || 0) > 0.1) touched();
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6.2 : 3.4) * dt * P.speed, len = Math.hypot(f, s);
  const ri0 = Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))), R0 = ROOMS[ri0];
  if (P.ride) {
    const u = Math.min(1, (t - P.ride.t0) / P.ride.dur), e2 = u * u * (3 - 2 * u), c = P.ride.curve, p = c.getPointAt(e2), q = c.getPointAt(Math.min(1, e2 + 0.03));
    P.x = p.x; P.z = p.z; P.lift = p.y - EYE; P.yaw += (Math.atan2(-(q.x - p.x), -(q.z - p.z)) - P.yaw) * Math.min(1, rdt * 3) * (u < 0.97 ? 1 : 0); P.pitch *= 0.95;
    if (u >= 1) { const f3 = P.ride.onEnd; P.ride = null; P.lift = 0; $('#bars').classList.remove('on'); f3 && f3(); }
  } else if (SKATE.active) {
    // the board: fixed 120 Hz steps so the arc and the speed are the same at any frame rate; a dialog or a hidden tab parks it
    if (started && !document.hidden && !$('#card').classList.contains('on') && $('#riderbox').hidden) {
      const park = PARK.get(R0, parkReady(R0));
      const world = { surface: park ? park.surface : () => 0, solid: park ? park.solid : () => 0, rails: park ? park.rails : [], gaps: park ? park.gaps : [], collide };
      SKATE.x = P.x; SKATE.z = P.z; SKATE.yaw = P.yaw;   // the mouse steers too, and a set may move you (the cabinet, a ride)
      SK.acc = Math.min(SK.acc + dt, 0.1);
      const input = { push: Math.max(0, Math.min(1, Math.max(f, PAD.rt))), brake: Math.max(0, Math.min(1, Math.max(-f, PAD.lt))), turn: Math.max(-1, Math.min(1, s + (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0))) };
      while (SK.acc >= 1 / 120) { SK.acc -= 1 / 120; step(SKATE, input, 1 / 120, world); }
      P.x = SKATE.x; P.z = SKATE.z; P.yaw = SKATE.yaw;
      for (const e of SKATE.events) {
        if (e.type === 'land') { sound.thud(0.25); sound.tick(); SK.dip = 0.22;
          if (e.points > (BEST[R0.id] || 0)) { const had = BEST[R0.id]; BEST[R0.id] = e.points; try { localStorage.setItem('onloc.skate.best', JSON.stringify(BEST)); } catch (er) {} if (had) toast(`NEW BEST ON THIS SET: ${e.points.toLocaleString('en-US')}`, 2600); }
          if (park) park.goals.forEach((G, k) => {
            if ((G.k === 'gap' && e.gap) || (G.k === 'grind' && e.grind >= G.t) || (G.k === 'combo' && e.points >= G.n) || (G.k === 'trick' && e.tricks.includes(G.trick))) goal(R0, k); }); }
        else if (e.type === 'bail') { sound.thud(0.5); shake(0.05); SK.dip = 0.3; }
        else if (e.type === 'grind') sound.clink(1800);
      }
      SKATE.events.length = 0;
      sound.skate(SKATE.v, !!SKATE.grind, SKATE.air);
      if (park) park.goals.forEach((G, k) => { if (G.k === 'speed' && SKATE.v >= G.v) goal(R0, k); });
      if (park && SK.greet === R0.i) { SK.greet = -1; const d = GOALS[R0.id] || [], k = park.goals.findIndex((_, i) => !d[i]); if (k >= 0) toast(`GOAL: ${park.goals[k].text}`, 3200); }
      P.bob += SKATE.v * dt * 0.5;
    }
    P.lift = SKATE.height;
  } else if (len > 0.01 && started) {
    const k = Math.min(1, len) / len; f *= k; s *= k;
    let nx = P.x + (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) * sp, nz = P.z + (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) * sp;
    if (R0.move) [nx, nz] = R0.move(P, nx, nz, dt);   // a room may bend the walk (the staircase)
    const ox = P.x, oz = P.z, s0 = PARK.surface(R0, ox, oz);
    [P.x, P.z] = collide(nx, nz); P.bob += sp * 2.4;
    if (PARK.surface(R0, P.x, P.z) > s0 + 0.3) { P.x = ox; P.z = oz; }   // walk up a ramp, not up the back of one
  }
  const ri = Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))); if (ri !== cur) enter(ri);
  const R = ROOMS[ri];
  const gy = R.ground ? R.ground(P.x - R.x0, P.z) : 0;
  PARK.get(R, parkReady(R));   // the set's skate spots appear once its props are in, skating or not
  const gs = PARK.surface(R, P.x, P.z);
  P.y += ((gy + gs + EYE * P.scale + P.lift) - P.y) * Math.min(1, dt * (R.ground || gs ? 14 : 4));
  if (!SKATE.active && !R.holdLift && !P.ride) P.lift += (0 - P.lift) * Math.min(1, rdt * 1.4);
  for (const f2 of tickers) f2(TIME.t, dt, P, ri, rdt);
  wayTick(t);
  // the camera: dolly back along the view for the vertigo, with the field of view the room asks for
  const fovT = (P.zoom ? 14 : R.fov ? R.fov(P) : FOV) + (SKATE.active ? SKATE.v * 1.5 : 0); P.fov += (fovT - P.fov) * Math.min(1, dt * 3);
  if (Math.abs(camera.fov - P.fov) > 0.01 || P.squeeze || P.squeezed) { camera.fov = P.fov; camera.updateProjectionMatrix(); if (P.squeeze) { camera.projectionMatrix.elements[5] *= P.squeeze; camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert(); } P.squeezed = !!P.squeeze; }
  const back = R.fov ? (Math.tan(FOV * Math.PI / 360) / Math.tan(P.fov * Math.PI / 360) - 1) * 3.2 : 0; P.back += (back - P.back) * Math.min(1, dt * 3);
  camera.rotation.set(P.pitch, P.yaw, P.roll || 0); P.roll = (P.roll || 0) * 0.9;
  camera.position.set(P.x + (Math.random() - 0.5) * shakeAmt + Math.sin(P.yaw) * P.back, P.y + Math.sin(P.bob) * 0.035 * P.scale + (Math.random() - 0.5) * shakeAmt, P.z + (Math.random() - 0.5) * shakeAmt + Math.cos(P.yaw) * P.back);
  shakeAmt *= 0.9;
  // skating, the camera rides behind and above the board; it eases in and out of the eyes, so the switch never snaps
  SK.blend += ((SKATE.active && !P.ride ? 1 : 0) - SK.blend) * Math.min(1, rdt * 5);
  rider.visible = SK.blend > 0.02;
  if (rider.visible) {
    const by = gy + (SKATE.active ? SKATE.y : gs), sx = Math.sin(P.yaw), cz = Math.cos(P.yaw);
    rider.position.set(P.x, by, P.z); rider.rotation.y = P.yaw; rider.scale.setScalar(P.scale);
    const board = rider.userData.board, body = rider.userData.body;
    // the flips: a kickflip and a heelflip roll the board a full turn each way, the grab tips it up to the hand
    if (SK.anim) { SK.anim.t += dt / 0.28; const u = Math.min(1, SK.anim.t), e3 = u * u * (3 - 2 * u);
      board.rotation.z = SK.anim.k === 0 ? e3 * Math.PI * 2 : SK.anim.k === 1 ? -e3 * Math.PI * 2 : 0; board.rotation.x = SK.anim.k === 2 ? Math.sin(u * Math.PI) * 0.7 : 0; board.position.y = SK.anim.k < 2 ? Math.sin(u * Math.PI) * 0.25 : 0;
      if (u >= 1) { SK.anim = null; board.rotation.set(0, 0, 0); board.position.y = 0; } }
    if (!SKATE.height) { board.rotation.x = 0; }
    { const sp = rider.userData.sparks, N = sp.life.length;
      if (SKATE.grind) for (let n = 0; n < 3; n++) { const k = sp.k++ % N; sp.life[k] = 0.35 + Math.random() * 0.25; sp.pos.set([P.x + (Math.random() - 0.5) * 0.3, by + 0.05, P.z + (Math.random() - 0.5) * 0.3], k * 3);
        sp.vel.set([(Math.random() - 0.5) * 3 + Math.sin(P.yaw) * SKATE.v * 0.6, Math.random() * 2.5, (Math.random() - 0.5) * 3 + Math.cos(P.yaw) * SKATE.v * 0.6], k * 3); }
      for (let k = 0; k < N; k++) { if (sp.life[k] <= 0) { sp.pos[k * 3 + 1] = -99; continue; } sp.life[k] -= rdt; sp.vel[k * 3 + 1] -= 9 * rdt; for (let a = 0; a < 3; a++) sp.pos[k * 3 + a] += sp.vel[k * 3 + a] * rdt; }
      sp.sparks.geometry.attributes.position.needsUpdate = true; }
    const pushing = !SKATE.air && !SKATE.grind && (keys.KeyW || keys.ArrowUp || PAD.rt > 0.1 || stick.dy < -0.2);
    const crouch = SKATE.air ? 0.84 : SKATE.grind ? 0.88 : pushing ? 0.94 + Math.sin(TIME.t * 9) * 0.03 : 1 - Math.min(0.08, SKATE.v * 0.01);
    body.scale.set(1, crouch, 1); body.position.y = body === rider.userData.capsule ? 0.1 : 0.11; body.rotation.order = 'YXZ';
    if (SKATE.bail > 0) { const u = SKATE.bail > 0.65 ? (0.9 - SKATE.bail) / 0.25 : SKATE.bail < 0.3 ? SKATE.bail / 0.3 : 1; body.rotation.x = u * 1.35; body.rotation.z = u * 0.3; body.position.y -= u * 0.25; }
    else { body.rotation.x = -SKATE.steering * (SKATE.air ? 0.1 : 0.3); body.rotation.z = SKATE.air ? -0.2 : pushing ? Math.sin(TIME.t * 9) * 0.06 : Math.sin(P.bob) * 0.03; }
    if (!SKATE.air && !SK.anim) { const park = PARK.PARK[R.id]; if (park) { const f = park.surface(P.x - sx * 0.3, P.z - cz * 0.3), b = park.surface(P.x + sx * 0.3, P.z + cz * 0.3); board.rotation.x += (Math.atan2(f - b, 0.6) - board.rotation.x) * Math.min(1, rdt * 14); } }
    // where the camera wants to be: 3.4 m back and 1.9 m up (further on a tall phone screen), pulled in by any wall in between
    // the orbit the mouse put on the camera eases back behind the board as soon as it rolls
    SK.orbit *= Math.exp(-rdt * (SKATE.v > 0.6 ? 2.4 : 0.4)); const ox = Math.sin(P.yaw + SK.orbit), oz = Math.cos(P.yaw + SK.orbit);
    const hx = P.x, hz = P.z, BK = MOBILE ? 4.4 : 3.4, wx = P.x + ox * BK * P.scale, wz = P.z + oz * BK * P.scale, k = sweep(hx, hz, wx, wz);
    _cw.set(hx + (wx - hx) * k, by + ((MOBILE ? 2.3 : 1.9) - P.pitch * 1.6 + (1 - k) * 0.6) * P.scale, hz + (wz - hz) * k);
    if (SK.pos.distanceTo(_cw) > 12) SK.pos.copy(_cw);   // a jump to another set cuts, it does not fly across the gallery
    SK.pos.lerp(_cw, 1 - Math.exp(-8 * rdt));
    SK.dip = Math.max(0, (SK.dip || 0) - rdt * 0.9);
    _cl.set(P.x - sx * 1.6, by + 0.9 * P.scale, P.z - cz * 1.6); _co.position.copy(SK.pos); _co.lookAt(_cl); _co.rotateZ(SKATE.steering * 0.07);
    camera.position.lerp(SK.pos, SK.blend); camera.position.y -= SK.dip * SK.blend; camera.quaternion.slerp(_co.quaternion, SK.blend);
  }
  if (OVERVIEW) { camera.position.set(R.x0 + W / 2, R.outdoor ? 12 : 5.6, D / 2 - 0.3); camera.lookAt(R.x0 + W / 2, 0, -1.5); camera.fov = 80; camera.updateProjectionMatrix(); }   // ?overview: a look down on the set, for checking its skate spots
  if (SKATE.active) {
    const open = SKATE.tricks.length ? ` · ${Math.round(SKATE.pending * SKATE.tricks.length).toLocaleString('en-US')}` : '';
    const msg = (SKATE.tricks.join(' + ') + open) || (SKATE.elapsed - (SK.msgAt || 0) < 2.5 ? SKATE.message : '') || 'Find your line';
    if (SKATE.message !== SK.lastMsg) { SK.lastMsg = SKATE.message; SK.msgAt = SKATE.elapsed; const el = $('#skate'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    const park = PARK.PARK[R.id], done = GOALS[R.id] || [];
    const goals = park ? '\n' + park.goals.map((G, k) => `<span class="${done[k] ? 'gd' : 'g'}">${done[k] ? '●' : '○'} ${G.text}</span>`).join('\n') : '\n<span class="g">Laying out the set...</span>';
    const html = `SKATE THE SETS · ${R.i + 1} / ${ROOMS.length} · ${R.film || R.name}\n<b>${SKATE.score.toLocaleString('en-US')}</b>\n${Math.round(SKATE.v * 3.6)} KM/H${SKATE.grind ? ' · GRINDING' : ''}${BEST[R.id] ? ' · BEST ' + BEST[R.id].toLocaleString('en-US') : ''}\n<span class="t">${msg}</span>${goals}` +
      (SK.debug ? `\n<span class="dbg">room ${R.id} · v ${SKATE.v.toFixed(2)} · ${SKATE.grind ? 'GRIND' : SKATE.air ? 'AIR ' + SKATE.height.toFixed(2) : 'GROUND'} · y ${SKATE.y.toFixed(2)} · ${park ? park.features.length + ' spots' : 'no layout'} · steer ${SKATE.steering.toFixed(2)} · ${SKATE.tricks.at(-1) || 'no trick'}</span>` : '');
    if (html !== SK.html) { SK.html = html; $('#skate').innerHTML = html; }
  }
  for (const l of lights) l.intensity += ((l.userData.i || 0) - l.intensity) * Math.min(1, dt * 3);
  for (const r of ROOMS) { if (!r.built) continue; const vis = Math.abs(r.i - ri) <= 1; if (r.plateMesh) r.plateMesh.visible = vis; if (r.group) r.group.visible = vis; }
  if ((t * 4 | 0) !== ((t - dt) * 4 | 0)) peek();
  if (locked || MOBILE) { const o = pick(null); $('#cross').classList.toggle('hot', !!o); $('#hint').textContent = o ? (o.userData.hint || '') : ''; }
  const now = performance.now();
  for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; } b.anchor.getWorldPosition(_w); _w.y += b.dy; _w.project(camera); const on = _w.z < 1 && Math.abs(_w.x) < 1.1; b.el.style.display = on ? 'block' : 'none'; b.el.style.transform = `translate(${(_w.x * 0.5 + 0.5) * innerWidth}px,${(-_w.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
  // the screen pass eases to the room's look
  const pp = R.post || {}, e = Math.min(1, dt * 2);
  POST.sat += ((FX.sat ?? pp.sat ?? 1) - POST.sat) * e; POST.heat += ((pp.heat || 0) - POST.heat) * e; POST.grain += ((pp.grain || 0) - POST.grain) * e;
  POST.warp += (FX.warp - POST.warp) * e; FX.flash *= 0.86;
  const U = postMat.uniforms; U.uSat.value = POST.sat; U.uHeat.value = POST.heat; U.uWarp.value = POST.warp; U.uGrain.value = POST.grain; U.uTime.value = t; U.uFlash.value = 0;
  $('#flash').style.opacity = FX.flash > 0.02 ? FX.flash.toFixed(2) : 0;
  // the pass only runs when a room asks for it: going through the target would tone map the plates twice over
  // the finish: every set gets bloom, vignette, fringing and a little grain unless it asks otherwise (R.post.bloom etc.)
  const bl = LITE ? 0 : pp.bloom ?? (MOBILE ? 0.55 : 0.85);
  U.uBloom.value = bl; U.uVig.value = LITE ? 0 : pp.vig ?? 0.42; U.uCA.value = LITE || MOBILE ? 0 : (pp.ca ?? 0.0035) + (SKATE.active ? SKATE.v * 0.0005 : 0);
  U.uGrain.value = Math.max(POST.grain, LITE ? 0 : 0.12);
  const usePost = !LITE || POST.heat > 0.005 || POST.warp > 0.005 || Math.abs(POST.sat - 1) > 0.01 || POST.grain > 0.01;
  if (usePost) {
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    if (bl > 0) {
      postQuad.material = brightMat; renderer.setRenderTarget(bloomA); renderer.render(postScene, postCam);
      postQuad.material = blurMat; const [px, py] = blurMat.userData.px;
      for (const sp of [1, 2.2]) {
        blurMat.uniforms.tIn.value = bloomA.texture; blurMat.uniforms.uDir.value.set(px * sp, 0); renderer.setRenderTarget(bloomB); renderer.render(postScene, postCam);
        blurMat.uniforms.tIn.value = bloomB.texture; blurMat.uniforms.uDir.value.set(0, py * sp); renderer.setRenderTarget(bloomA); renderer.render(postScene, postCam);
      }
      postQuad.material = postMat;
    }
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  } else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// a phone that runs out of GPU memory loses the context: say so and offer the way back instead of a black screen
cnv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toast('The phone ran out of graphics memory. Tap to reload this set.', 600000); $('#toast').style.pointerEvents = 'auto'; $('#toast').onclick = () => { const r = ROOMS[cur]; location.search = '?room=' + (r ? r.id : ''); }; });

// ---------- start ----------
const sound = new Sound(); ctx.sound = sound;
const ready = () => { $('#go').disabled = false; $('#go').textContent = 'Take your seat'; $('#goskate').disabled = false; };
mgr.onLoad = ready; setTimeout(ready, 15000);
// two ways in: on foot, or on a board (SKATE THE SETS, or ?skate in the address) with the same film either way
function enterFilm(skate) {
  started = true; $('#intro').classList.add('off'); sound.start(); if (!MOBILE && !Q.has('nolock')) lock();
  if (skate) setSkate(true);
  else toast(MOBILE ? 'Left thumb walks. Right thumb looks. Tap anything. SKATE to ride.' : 'WASD to walk. Shift to hurry. Click anything. 1 to 0 jumps sets. K to skate.', 4200);
}
$('#go').onclick = () => enterFilm(Q.has('skate')); $('#goskate').onclick = () => enterFilm(true);
tally();
if (Q.has('auto')) { started = true; $('#intro').classList.add('off'); if (Q.has('skate')) setSkate(true); }
$('#snd').onclick = (e) => { e.stopPropagation(); sound.toggle(); $('#snd').textContent = sound.on ? 'SOUND ON' : 'SOUND OFF'; };
window.__P = P; window.__colliders = colliders; window.__camera = camera; window.__SKATE = SKATE; window.__PARK = PARK; window.__scene = scene; window.__renderer = renderer; window.__ready = () => loading.done >= loading.total; window.__ROOMS = ROOMS;
window.__finale = () => $('#finale').classList.add('on');
enter(Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))));
requestAnimationFrame(frame);
