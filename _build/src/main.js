// TEN STYLES. ONE CITY.: ten artists, twenty New York rooms, built by NEW YORKERS. Walkable. Forked from ONLY IN NEW YORK (2026-11-01).
// Forked from LIVE FROM THE SEWERS (2026-10-23), itself CLOUDS AND DIRT V2 (2026-10-22), itself ON RECORD (2026-10-20).
// Ten sets in a row, forked from THE MARKS engine. Each opens onto a photo plate rebuilt as geometry
// from its depth map (the MONA pass). The cast are Tripo GLBs with eye flowers for heads. Every room
// carries one trick: a mirror that answers back, a floor that plays, a grate that lifts you, a skeleton
// that moves when you look away, a staircase with no top, a deck that falls away under you.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { ROOMS, W, D, H_IN, PORTAL, LABEL, ARTIST } from './rooms.js';
import { GUIDE as GUIDE_TEXT } from './story.js';
import { Sound } from './sound.js';
import { Music } from './music.js';
import { crowdInit, crowdTick, CROWD } from './crowd.js';

const $ = (s) => document.querySelector(s);
await Promise.race([Promise.all(['900 40px Fraunces', '700 40px "Space Grotesk"', '600 40px "IBM Plex Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
const Q = new URLSearchParams(location.search);
const MOBILE = matchMedia('(pointer:coarse)').matches;
const CAST = window.CAST || {};

// ---------- renderer ----------
// the screen pass draws one full screen triangle, so a multisampled default framebuffer only costs memory and bandwidth;
// the scene target keeps its four samples (2026-11-01 load pass)
const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE && Q.has('lite'), powerPreference: 'high-performance' });
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
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: MOBILE ? 0 : 4, stencilBuffer: true });   // the Kusama booth draws its lattice through the stencil
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
  uniforms: { tScene: { value: rt.texture }, tBloom: { value: bloomA.texture }, uBloom: { value: 0 }, uVig: { value: 0 }, uCA: { value: 0 }, uSat: { value: 1 }, uHeat: { value: 0 }, uWarp: { value: 0 }, uGrain: { value: 0 }, uTime: { value: 0 }, uFlash: { value: 0 }, uDots: { value: 0 }, uFacet: { value: 0 }, uSwirl: { value: 0 }, uQuad: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uTint: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    uniform sampler2D tScene, tBloom; uniform float uSat, uHeat, uWarp, uGrain, uTime, uFlash, uBloom, uVig, uCA, uDots, uFacet, uSwirl, uQuad; uniform vec2 uRes; uniform vec3 uTint; varying vec2 vUv;
    // TEN STYLES: four ways of looking, each one a room's trick, eased in and out by FX (0 is off)
    vec2 hh(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      // the four colour repeat: the frame silkscreened four times, each quarter a different ink (Warhol)
      vec2 qid = vec2(0.);
      if (uQuad > 0.01) { vec2 q = fract(uv * 2.); qid = floor(uv * 2.); uv = mix(uv, q, uQuad); }
      // the swirl: the picture flows along a curl field, slower in the middle, the way the brush went (van Gogh)
      if (uSwirl > 0.01) { for (int i = 0; i < 3; i++) { vec2 p = uv * 3.2 + float(i) * 1.7; vec2 f = vec2(sin(p.y * 2.1 + uTime * 0.6) + cos(p.x * 1.3 - uTime * 0.4), cos(p.x * 2.3 - uTime * 0.5) - sin(p.y * 1.7 + uTime * 0.3)); uv += f * 0.0045 * uSwirl; } }
      // the facets: the frame broken into Voronoi shards, each seen from a slightly different place (Picasso)
      if (uFacet > 0.01) { vec2 g = uv * vec2(uRes.x / uRes.y, 1.) * 5.; vec2 ig = floor(g), fg = fract(g); float md = 9.; vec2 mo = vec2(0.); for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 pt = hh(ig + o); vec2 d = o + pt - fg; float dd = dot(d, d); if (dd < md) { md = dd; mo = ig + o; } } vec2 sh = (hh(mo * 1.3) - 0.5) * 0.09; float rot = (hh(mo * 2.7).x - 0.5) * 0.35; vec2 cc = uv - 0.5; uv = mix(uv, 0.5 + mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * cc * (0.9 + hh(mo).y * 0.25) + sh, uFacet); }
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
      if (uQuad > 0.01) { vec3 ink = qid.x < .5 ? (qid.y < .5 ? vec3(1., .35, .7) : vec3(1., .9, .2)) : (qid.y < .5 ? vec3(.2, .8, 1.) : vec3(.6, 1., .3)); float L = dot(col.rgb, vec3(.3, .59, .11)); vec3 pop = mix(ink * 1.15, vec3(.05, .03, .1), smoothstep(.55, .25, L)); col.rgb = mix(col.rgb, pop, uQuad * 0.85); }
      // the dots: printed in Ben-Day dots and a black key line, as a comic page is (Lichtenstein)
      if (uDots > 0.01) { float cell = 9.; vec2 px = vUv * uRes; vec2 rp = mat2(.707, -.707, .707, .707) * px; vec2 cid = floor(rp / cell); vec2 f = fract(rp / cell) - .5; float L = dot(col.rgb, vec3(.3, .59, .11)); float rad = sqrt(clamp(1. - L, 0., 1.)) * .62; float dot1 = smoothstep(rad + .06, rad - .06, length(f)); vec3 flat3 = col.r > col.g + .15 && col.r > col.b + .1 ? vec3(.86, .1, .12) : col.b > col.r + .1 ? vec3(.12, .35, .85) : col.r + col.g > 1.3 && col.b < .45 ? vec3(1., .86, .1) : vec3(1., .97, .9); vec3 comic = mix(vec3(1., .97, .9), flat3, .85) * (1. - dot1 * .85); float edge = length(vec2(dFdx(L), dFdy(L))) * 9.; comic *= 1. - smoothstep(.25, .6, edge); col.rgb = mix(col.rgb, comic, uDots); }
      col.rgb = mix(col.rgb, vec3(1.), uFlash);
      gl_FragColor = vec4(col.rgb, 1.);
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const postQuad = new THREE.Mesh(tri, postMat); postQuad.frustumCulled = false; postScene.add(postQuad);
const _tint = new THREE.Color();
const POST = { sat: 1, heat: 0, warp: 0, grain: 0, flash: 0, dots: 0, facet: 0, swirl: 0, quad: 0 };   // eased toward the room's targets
const FX = { warp: 0, sat: null, flash: 0, tint: null, dots: 0, facet: 0, swirl: 0, quad: 0 };                      // one off pushes from the rooms
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
// three skies to reflect: the room says which (r.hdri), so a fluorescent subway and a golden park do not share a night sky
// 2026-11-01: only the sky the first room reflects holds up the Swipe in button; the other two (1.5 MB each) come when a
// room next door asks for them
const ENVS = {}, ENVQ = {};
function envLoad(k, gate) {
  if (ENVQ[k]) return; ENVQ[k] = true;
  new HDRLoader(gate ? mgr : undefined).load(`assets/env/${k}.hdr`, (h) => {
    h.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer); ENVS[k] = pm.fromEquirectangular(h).texture; h.dispose(); pm.dispose();
    if (cur >= 0 && (ROOMS[cur].hdri || 'day') === k) scene.environment = ENVS[k];
  });
}
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
// the crowd (from ON LOCATION, 2026-10-28): every extra is a whole cast character, the nearest twenty rigged and walking; ?crowd=old for the cylinders
crowdInit({ THREE, loader: gltf, on: Q.get('crowd') !== 'old', clickable, rig: Q.get('rig') !== 'off', mobile: MOBILE });
tick((t, dt) => crowdTick(dt, camera)); window.__CROWD = CROWD;
CROWD.warm = (root, tx) => { warm(root); for (const t of tx) if (t && !WARM.seen.has(t)) { WARM.seen.add(t); WARM.q.push(t); } };

const GLB = {};
// Tripo hands models back facing any which way; these turn each one so its front is three.js +Z.
// Read off the front and top renders (_build/front_sheet.py into work/sheet).
const H = Math.PI / 2;
const YAW = { ts_soupcan: -H, ts_radiantbaby: -H, ts_bust: -H, ts_spaceelephant: -H, ts_sunflowers: -H, ts_tentacle: -H, ts_crownskull: -H, ts_softboat: -H, ts_comicsofa: -H, ts_meltframe: -H, ts_pricestation: -H, ts_popcounter: -H, ts_amesscope: -H, ts_floormodel: -H, ts_pumpkin: -H, ts_haringfig: -H, ts_lobsterphone: -H, ts_payphone: -H, ts_dotdancer: -H, ts_transitcop: -H, ts_crownbag: -H, ts_wave: -H, ts_brushstroke: -H, ts_furtub: -H, ts_bolex: -H, ts_cypress: -H, ts_guitar: -H, ts_lamb: -H, oy_bear: -H, oy_liberty: -H, oy_photog: -H, oy_tourist: -H, oy_eater: -H, oy_pantsless: -H, oy_pantsful: -H, oy_captain: -H, oy_frozen: -H, oy_santa: -H, oy_cowboy: -H, oy_duck: -H, oy_pug: -H, oy_girl: -H, sw_pizzarat: Math.PI, sw_customs: -H, sw_goldfish: -H, sw_gator: -H, sw_cantor: -H, sw_trader: Math.PI, sw_bodegacat: -H, sw_king: -H, ph_street_rat: 0, bluesteel: -H, writer: H, boxer: Math.PI, workgirl: -H, tracksuit: -H, golfer: -H, wiseguy: -H, dog: Math.PI, cat: -H, deer: 0, folksinger: Math.PI, flyer: -H, anchor: -H, jeweler: -H, auggie: -H, bookseller: -H, susan: 0, dad: Math.PI, libhead: -H, sedan: -H, prince: -H, agent: -H, famer: -H, annieh: -H, rosemary: -H, sonny: -H, clerk: -H, sally: 0, pigeonlady: -H, elf: -H, broker: -H, maria: -H, loretta: -H, hijacker: -H, bench: H, checker: -H, gown: -H, lensman: 0, discoking: -H, maitre: -H, hustler: Math.PI, ambulance: -H, ape: -H, boombox: -H, cabbie: H, dancer: -H, dress: -H, hotdog: -H, mlowtar: -H, moai: -H, popcorn: -H, puft: -H, usher: -H, trex: Math.PI, hydrant: Math.PI, pigeon: Math.PI, rat: -H, blindwoman: Math.PI, killer: -H, actress: -H, robber: -H, odette: Math.PI, bartender: -H, waltzers: -H, butcher: -H, felix: -H, oscar: -H, sailors: -H, editor: -H, assistant: -H, odile: 0 };
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
    g.add(sc); g.userData.ready = true; warm(sc); if (g.userData.click) clickable(g, g.userData.click, g.userData.hint); onload && onload(g, sc);
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
      let z = room.flat ? room.flat : 1 / Math.max(1e-4, a * dAt(u, v) + b); z = Math.min(far * 1.4, Math.max(zMin, z * (room.zscale || 1)));
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
    room.plateMesh = mesh; warm(mesh);
    loading.done++;
  };
  return g;
}

// ---------- the New Yorkers on the walls ----------
const FRAMES = {
  white: { c: 0xf4f4f2, m: 0, r: 0.6, d: 0.05, b: 0.05 },
  silver: { c: 0xd8dadc, m: 1, r: 0.2, d: 0.06, b: 0.06 },
  raw: { c: 0x6a4a2a, m: 0, r: 0.9, d: 0.04, b: 0.03 },
  wood: { c: 0x5a3a20, m: 0, r: 0.6, d: 0.07, b: 0.08 },
  thrift: { c: 0x8a6a3a, m: 0.3, r: 0.5, d: 0.08, b: 0.1 },
  black: { c: 0x111111, m: 0.2, r: 0.5, d: 0.06, b: 0.06 },
  gilt: { c: 0xb8902e, m: 1, r: 0.32, d: 0.1, b: 0.12 },
  steel: { c: 0x8c9196, m: 1, r: 0.38, d: 0.05, b: 0.04 },
  oak: { c: 0x6b4423, m: 0, r: 0.6, d: 0.06, b: 0.07 },
};
const artMeshes = [];
// the picture light: one warm wash texture for every piece, laid on the wall behind the frame, plus a brass bar over it
let WASH = null;
const washTex = () => WASH || (WASH = canvasTex(256, 256, (q, w, h) => { const g = q.createRadialGradient(w / 2, h * 0.32, 4, w / 2, h * 0.5, w * 0.62); g.addColorStop(0, 'rgba(255,236,200,1)'); g.addColorStop(0.45, 'rgba(255,226,180,.45)'); g.addColorStop(1, 'rgba(255,220,170,0)'); q.fillStyle = g; q.fillRect(0, 0, w, h); }));
const LAMP = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 1, roughness: 0.35, emissive: 0x3a2a10 });
// opts: { frame: a FRAMES-like object (the thrift shop's mismatched frames), noLamp, noLabel, label: extra line, seg: subdivide the art plane (the melting room) }
function hang(p, x, y, z, ry, w, style, parent = scene, opts = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const f = opts.frame || FRAMES[style] || FRAMES.black;
  const fm = new THREE.MeshStandardMaterial({ color: f.c, metalness: f.m, roughness: f.r });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(1, 1, f.d, opts.seg || 1, opts.seg || 1, 1), fm); fr.position.z = f.d / 2; g.add(fr);
  const mat = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: opts.glow ?? 0.62, roughness: 0.4 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, opts.seg || 1, opts.seg || 1), mat); art.position.z = f.d + 0.002; g.add(art);
  let wash = null, lamp = null;
  if (!opts.noLamp) {
    wash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: washTex(), transparent: true, opacity: opts.wash ?? 0.42, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    wash.position.z = -0.125; g.add(wash);
    lamp = new THREE.Group(); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10), LAMP); bar.rotation.z = Math.PI / 2; bar.position.z = 0.26; lamp.add(bar);
    for (const k of [-0.3, 0.3]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.36), LAMP); arm.position.set(k, 0, 0.08); lamp.add(arm); }
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff0d0, toneMapped: false })); glow.rotation.x = Math.PI / 2; glow.position.set(0, -0.036, 0.26); lamp.add(glow);
    g.add(lamp);
  }
  let pl = null;
  const fit = (asp) => { const h = w / asp; art.scale.set(w, h, 1); fr.scale.set(w + f.b * 2, h + f.b * 2, 1); if (pl) pl.position.y = -h / 2 - f.b - 0.2;
    if (wash) { wash.scale.set(w * 1.9, h * 2.1, 1); wash.position.y = h * 0.12; } if (lamp) { lamp.position.y = h / 2 + f.b + 0.12; lamp.scale.set(Math.min(1, w * 0.62), 1, 1); } g.userData.h = h; };
  const t = tex.load(`assets/art/${p.f}`, (tt) => fit(tt.image.width / tt.image.height)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  mat.map = mat.emissiveMap = t;
  if (!opts.noLabel) {
    const lines = p.honor ? `${p.t}\n${p.who}, portrait by MLow` : `${p.t}\nNo. ${p.n}${p.h ? '  ·  ' + p.h : ''}${(opts.label || p.ll) ? '\n' + (opts.label || p.ll) : ''}`;
    pl = sign(lines, { w: Math.min(1.25, Math.max(0.8, w * 0.8)), h: (opts.label || p.ll) ? 0.24 : 0.16, bg: '#f2ead8', fg: '#1b1b1b', font: MONO, weight: 600, px: 128 });
    pl.position.set(0, -w * 9 / 32 - 0.2, 0.03); g.add(pl);
  }
  fit(16 / 9);
  art.userData.piece = p; p.mesh = art; p.group = g; p.frameMesh = fr;
  clickable(art, () => openPiece(p), p.t);
  artMeshes.push(art);
  return g;
}

const lights = [];
for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffffff, 0, 26, 1.6); scene.add(l); lights.push(l); }
const hemi = new THREE.HemisphereLight(0x8899bb, 0x221a12, 0.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0); scene.add(sun); scene.add(sun.target);
// The light count is part of every shader. Three rooms carry a spotlight of their own (the rat's, the czar's, the
// contest's), and a room that is hidden takes its light out of the count, so every door that showed or hid one of them
// made every material in view compile a new shader in that frame. Stand ins at zero intensity keep the number of
// spotlights in the scene at SPOT_MAX wherever you are (2026-11-01 load pass). A spotlight in a new room means checking this number.
const SPOT_MAX = 2, SPOTFILL = [];   // the rat's alone; the czar's and the blizzard's are next door to each other, so two at most in view, priming included
for (let k = 0; k < SPOT_MAX; k++) { const l = new THREE.SpotLight(0xffffff, 0, 1); l.position.set(0, -40, 0); scene.add(l); SPOTFILL.push(l); }
function spotBalance(extra) {
  let n = 0; for (const r of ROOMS) if (r.built && r.nSpot && (r.group?.visible || r === extra)) n += r.nSpot;
  SPOTFILL.forEach((l, k) => { l.visible = k < SPOT_MAX - n; });
  if (n > SPOT_MAX && !spotBalance.told) { spotBalance.told = true; console.warn(`more room spotlights in view (${n}) than SPOT_MAX (${SPOT_MAX}): raise SPOT_MAX`); }
}

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
const parkSurf = (R, x, z) => (SKATE.active ? PARK.surface(R, x, z) : 0);
const PARK = makePark({ THREE, canvasTex, colliders, W, D });
const parkReady = (r) => r && r.built && !(r.loadingN > 0) && performance.now() - (r.enteredAt || 0) > 1200;
// goals are kept per browser: { setId: [true, false, true] }
const BEST = (() => { try { return JSON.parse(localStorage.getItem('oiny.skate.best') || '{}'); } catch (e) { return {}; } })();
const GOALS = (() => { try { return JSON.parse(localStorage.getItem('oiny.skate.goals') || '{}'); } catch (e) { return {}; } })();
function tally() { const n = Object.values(GOALS).reduce((a, d) => a + d.filter(Boolean).length, 0); $('#skatesum').textContent = n ? `${n} / ${ROOMS.length * 3}` : ''; }
function goal(r, k) {
  const p = PARK.PARK[r.id]; if (!p) return; const done = GOALS[r.id] ||= [];
  if (done[k]) return; done[k] = true; try { localStorage.setItem('oiny.skate.goals', JSON.stringify(GOALS)); } catch (e) {}
  sound.ding(); tally(); toast(`GOAL ${done.filter(Boolean).length} OF ${p.goals.length}: ${p.goals[k].text}`, 3600);
  if (p.goals.every((_, i) => done[i])) setTimeout(() => toast(`Every goal at ${r.name}. ${Object.values(GOALS).reduce((a, d) => a + d.filter(Boolean).length, 0)} goals across the city.`, 4200), 3800);
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
// the rider is one of the cast (a Tripo model), standing on the board
// the roster: the cast of the floors, by where they stand (press C, or RIDER, to pick)
const ROSTER = [
  ['ts_dotdancer', 'The Dotted Dancer', 'Anatomic Explosion', 1.75], ['ts_transitcop', 'The Transit Cop', 'Black Paper', 1.8], ['ts_lamb', 'A Plush Lamb', 'Better Out Than In', 0.55],
  ['bluesteel', 'A New Yorker', 'Ten Styles', 1.75], ['pigeon', 'A Pigeon', 'Everywhere', 0.42], ['rat', 'A Rat', 'Everywhere', 0.5],
]
let riderName = (() => { try { return localStorage.getItem('tsoc.skate.rider') || 'ts_dotdancer'; } catch (e) { return 'ts_dotdancer'; } })();
if (!ROSTER.some((r) => r[0] === riderName)) riderName = 'ts_dotdancer';
function riderModel(name = riderName) {
  if (rider.userData.model && rider.userData.modelName === name) return;
  if (rider.userData.model) { rider.remove(rider.userData.model); rider.userData.capsule.visible = true; rider.userData.body = rider.userData.capsule; }
  const row = ROSTER.find((r) => r[0] === name) || ROSTER[0], hold = new THREE.Group(); hold.position.y = 0.11; hold.rotation.y = Math.PI / 2 - 0.45; rider.add(hold);
  rider.userData.model = hold; rider.userData.modelName = name; riderName = name;
  load(name, hold, { h: row[3] || 1.72, y: 0, shadow: false, onload: () => { if (rider.userData.model !== hold) return; rider.userData.capsule.visible = false; rider.userData.body = hold; } });
}
function pickRider(name) { riderModel(name); try { localStorage.setItem('tsoc.skate.rider', name); } catch (e) {} const row = ROSTER.find((r) => r[0] === name); toast(`You ride as ${row[1]}, from ${row[2]}.`, 2600);
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
// the visitor, seen only by cameras that ask (layer 1): the content machine on floor 25 films this
const avatar = new THREE.Group(); scene.add(avatar);
{ const cloth = new THREE.MeshStandardMaterial({ color: 0x1b1d26, roughness: 0.85 }); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.9, 4, 10), cloth); body.position.y = 0.95; avatar.add(body);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; eyeFlower(cv.getContext('2d'), 128, 128, 120); const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace;
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: ht, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide })); head.position.y = 1.62; avatar.add(head);
  avatar.traverse((o) => o.layers.set(1)); }
const ctx = { speak: (t, f) => speak(t, f), guideOn: () => GUIDE.on, openPiece: (p, l, k) => openPiece(p, l, k), warm: (o) => warm(o), sun, avatar, keys: null, wake: (i) => wake(i), THREE, scene, camera, renderer, surf, slab, sign, canvasTex, glb, wall, post, tick, clickable, hang, plate, tex, egg, toast, say, sound: null, MOBILE, shake, FONT, SERIF, MONO, P, FX, EYE, flash, TIME, zoom, ride, ray, hemi, lights };
ROOMS.forEach((r, i) => { r.i = i; r.x0 = i * W; r.prev = ROOMS[i - 1]?.name; r.next = ROOMS[i + 1]?.name; r.last = i === ROOMS.length - 1; r.cast = CAST[r.id] || []; r.cast.forEach((p) => { p.ll = LABEL[r.g] || ''; p.ri = i; }); r.guide = GUIDE_TEXT[r.id] || ''; });
window.__clickables = clickables; window.__EGGSET = () => [...EGGS];
// Round thirteen: sets are built when you come near them, not all 105 at load. Building every set up front put
// 105 plates, 1,260 paintings and every wallpaper on the GPU at once, and a phone gave up before the first frame.
const NEAR = MOBILE ? 1 : 2, KEEP = MOBILE ? 2 : 5;
function ensure(i) {
  const r = ROOMS[i]; if (!r || r.built) return; const t0 = performance.now(); try { ensure2(i, r); } finally { ph('build:' + r.id, t0); }
}
function ensure2(i, r) {
  r.built = true; BUILDING.i = i;
  try { buildRoom(ctx, r); } catch (e) { console.error('set ' + r.id, e); }
  BUILDING.i = -1; r.builtAt = performance.now(); r.nSpot = 0; r.group?.traverse((o) => { if (o.isSpotLight) r.nSpot++; }); if (r.group) r.group.visible = false; spotBalance(); warm(r.group);
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
  if (!r.freed) return; r.freed = false; r.primed = false;
  for (const t of r.heavy || []) if (t.image === BLANK && t.userData.url) { const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; WARM.q.push(t); }; im.src = t.userData.url; }
  warm(r.group);
}
// 2026-11-01 load pass: the room you stand in is built at once; the neighbours wait in BUILDQ and are built one per frame,
// nearest first, once the room you are in has its files (the Swipe in button used to wait for five rooms of them).
// Every built room is then warmed while it is still out of sight: its shaders compiled (compileAsync, in parallel where
// the browser can) and its pictures uploaded a few milliseconds a frame, so walking through a door no longer stalls
// on a hundred textures and a dozen programs at once. Measured with _build/perf.py --walk.
const BUILDQ = [];
function near3(i) {
  ensure(i); wakeRoom(ROOMS[i]);
  for (let d = 1; d <= NEAR; d++) for (const j of [i + d, i - d]) { const r = ROOMS[j]; if (!r) continue; if (r.built) wakeRoom(r); else if (!BUILDQ.includes(j)) BUILDQ.push(j); }
  BUILDQ.sort((a, b) => Math.abs(a - i) - Math.abs(b - i));
  for (let k = BUILDQ.length - 1; k >= 0; k--) if (Math.abs(BUILDQ[k] - i) > NEAR) BUILDQ.splice(k, 1);
  ROOMS.forEach((r) => { if (Math.abs(r.i - i) > KEEP) freeRoom(r); });
}
const BOOT = { at: performance.now(), lastBuild: 0 };
const SLOW = []; window.__SLOW = SLOW; const PH = {}; const ph = (k, t0) => { PH[k] = (PH[k] || 0) + performance.now() - t0; };
function buildNext() {
  if (!BUILDQ.length || performance.now() - BOOT.lastBuild < 120) return;
  const first = ROOMS[cur]; if (first && !first.warmed && first.loadingN > 0 && performance.now() - BOOT.at < 8000) return;   // the room you are in first
  const j = BUILDQ.shift(); BOOT.lastBuild = performance.now(); ensure(j); wake(cur);
}
const WARM = { q: [], wait: [], seen: new WeakSet(), n: 0 };
function warm(root) {
  if (!root) return;
  // compiled against the target the scene really draws into: a program is keyed on the output colour space, and the
  // screen (sRGB) and the scene target (linear) want different ones, so warming against the screen warmed nothing
  const old = renderer.getRenderTarget(); if (!LITE) renderer.setRenderTarget(rt);
  renderer.compileAsync(root, camera, scene).catch(() => {}); renderer.setRenderTarget(old);
  root.traverse((o) => { for (const m of [].concat(o.material || [])) for (const k in m) { const t = m[k]; if (t && t.isTexture && !t.isRenderTargetTexture && !t.isVideoTexture && !WARM.seen.has(t)) { WARM.seen.add(t); WARM.q.push(t); } } });
}
function warmTick() {
  if (WARM.wait.length && (POWER.frames % 30) === 0) { WARM.q.push(...WARM.wait); WARM.wait.length = 0; }
  // a count as well as a time: the copy of an image happens in the GPU process, so the main thread's clock barely sees it,
  // and forty paintings uploaded in one frame still cost a 70 ms frame
  const t0 = performance.now(); let n = 0;
  while (WARM.q.length && performance.now() - t0 < (started ? 3 : 8) && n < (started ? 4 : 12)) {
    const t = WARM.q.shift(); if (!t.image || t.image === BLANK) continue;
    if (t.version === 0 || (t.image.width === undefined && !t.image.data)) { WARM.wait.push(t); continue; }
    if (renderer.properties.get(t).__version === t.version) continue;
    renderer.initTexture(t); WARM.n++; n++;
  }
}
// priming: compiling and uploading is not the whole bill. On Metal (ANGLE) a texture's data, its mipmaps, a new buffer
// and a skeleton's bone texture are only really finished on the first draw that uses them, so a room seen for the first
// time still cost 100 to 250 ms on the frame you walked through its door. So each room, once built and while still
// hidden, is drawn for real: into a 32 pixel target shaped like the scene target, from its middle, one of four
// directions a frame. The GPU work is a few thousand pixels; everything it touches is then resident.
const primeRT = new THREE.WebGLRenderTarget(32, 32, { type: THREE.HalfFloatType }); primeRT.isXRRenderTarget = true; primeRT.texture.colorSpace = THREE.LinearSRGBColorSpace;
const primeCam = new THREE.PerspectiveCamera(100, 1, 0.05, 900); primeCam.rotation.order = 'YXZ'; primeCam.layers.enableAll();
const PRIME = { room: -1, step: 0, n: 0 };
function primeTick() {
  if (PRIME.room < 0) {
    // the nearest built room you are not standing in, once its models have landed (or after four seconds regardless)
    const r = ROOMS.filter((q) => q.built && !q.primed && !q.freed && q.i !== cur && performance.now() - (q.builtAt || 0) > 400 && (!(q.loadingN > 0) || performance.now() - q.builtAt > 4000)).sort((a, b) => Math.abs(a.i - cur) - Math.abs(b.i - cur))[0];
    if (!r) return; PRIME.room = r.i; PRIME.step = -1;
  }
  const r = ROOMS[PRIME.room]; if (!r || !r.built || r.freed) { PRIME.room = -1; return; }
  // first compile everything the room holds now (crowd bodies and models land after the build's own warm), in parallel,
  // and draw only once those programs are ready: a draw that needs an unfinished program waits for it on the main thread
  if (PRIME.step === -1) { PRIME.step = -2; const old = renderer.getRenderTarget(); renderer.setRenderTarget(primeRT);
    const roots = [r.group, r.plateMesh].filter(Boolean), done = () => { if (PRIME.room === r.i) PRIME.step = 0; };
    Promise.all(roots.map((o) => renderer.compileAsync(o, primeCam, scene))).then(done, done); renderer.setRenderTarget(old); return; }
  if (PRIME.step < 0) return;
  const vis = [r.group?.visible, r.plateMesh?.visible]; if (r.group) r.group.visible = true; if (r.plateMesh) r.plateMesh.visible = true; spotBalance();
  primeCam.position.set(r.x0 + W / 2, 1.6, 0); primeCam.rotation.set(-0.15, PRIME.step * Math.PI / 2, 0); primeCam.updateMatrixWorld();
  const old = renderer.getRenderTarget(); renderer.setRenderTarget(primeRT); renderer.render(scene, primeCam); renderer.setRenderTarget(old);
  if (r.group) r.group.visible = vis[0]; if (r.plateMesh) r.plateMesh.visible = vis[1]; spotBalance();
  if (++PRIME.step >= 4) { r.primed = true; PRIME.room = -1; PRIME.n++; }
}
window.__WARM = WARM; window.__BUILDQ = BUILDQ; window.__PRIME = PRIME; window.__texReady = (t) => renderer.properties.get(t).__version === t.version;

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
function go(i) { const r = ROOMS[i]; if (!r) return; Object.assign(SKATE, { v: 0, y: 0, height: 0, vy: 0, air: false, grind: null, pending: 0, tricks: [], busy: 0, wiped: false, takeoff: null }); SK.anim = null; P.x = r.x0 + (r.spawn ? r.spawn[0] : W / 2); P.z = r.spawn ? r.spawn[1] : D / 2 - 2.2; P.yaw = 0; P.pitch = -0.02; settle(); }
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
  const surfAt = (x, z) => { const R = roomAt(x); return parkSurf(R, x, z) + (R.ground ? R.ground(x - R.x0, z) : 0); };
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

// ---------- clip mode: the vertical cut, live ----------
// V (or the CLIP button) masks the screen to 9:16, puts a hook caption on it in the house style and dollies the camera
// slowly through the room from the door toward the picture, so anyone can see the TikTok before it is cut.
const CLIP = { on: false, t0: 0, hooks: ['a mirror booth on wall street and the dots never end', 'the crown only exists from one corner of soho', 'draw on the black paper and the transit cops come', 'walk past the fence and the dancers dance', 'the window shatters and puts itself back when you look away', 'the swans reflect elephants', 'hold still at moma and the whole room starts to swirl', 'the stencils only exist in your torch', 'stare at a dali and the frame melts off the wall', 'the thrift shop changes its prices when you look away', 'one room looks square from one spot only', 'every warhol comes in four inks and three of them move'] };
function setClip(on = !CLIP.on) {
  if (!started || P.ride) return;
  CLIP.on = on; $('#clip').classList.toggle('on', on); $('#clipbtn').classList.toggle('on', on);
  if (on) { const r = ROOMS[cur]; $('#cliphook').textContent = CLIP.hooks[(cur + 3) % CLIP.hooks.length]; $('#cliproom').textContent = (r.name || '').toUpperCase() + ' · TEN STYLES. ONE CITY.';
    const z0 = D / 2 - 1.6, z1 = -D / 2 + 2.2, c = new THREE.CatmullRomCurve3([new THREE.Vector3(r.x0 + W / 2 + 2.5, EYE, z0), new THREE.Vector3(r.x0 + W / 2 - 1.5, EYE + 0.2, (z0 + z1) / 2), new THREE.Vector3(r.x0 + W / 2, EYE, z1)]);
    ride(c, 9, () => { if (CLIP.on) toast('That was the clip. V again for another take, or walk.', 2600); }); egg('clip', 'Clip mode. Nine seconds, vertical, a hook on top. That is one of sixty four.'); }
}
addEventListener('keydown', (e) => { if (e.code === 'KeyV' && !e.repeat && started && !e.metaKey && !e.ctrlKey) setClip(); });
$('#clipbtn').addEventListener('click', (e) => { e.stopPropagation(); setClip(); });
window.__setClip = setClip;

// ---------- binoculars, the long take ----------
// Z (or any pair of binoculars on a set) narrows the lens to 14 degrees behind a binocular mask.
function zoom(on = !P.zoom) { P.zoom = on; $('#binoc').classList.toggle('on', on); ray.far = on ? 90 : 14; if (on) egg('binocs', 'Binoculars. Everybody in this city is watching somebody. Press Z again to put them down.'); }
// a ride: the camera follows a curve for dur seconds, looking a little ahead, with letterbox bars; input waits
function ride(curve, dur, onEnd) { P.ride = { curve, dur, t0: clock.elapsedTime, onEnd }; $('#bars').classList.add('on'); }
addEventListener('keydown', (e) => { if (e.code === 'KeyZ' && started) zoom(); });

// ---------- HUD ----------
// ---------- the audio guide: the browser's own voice reads the room, the story line and any piece you open ----------
// G (or GUIDE) turns it on. Each room carries `guide` (what you hear walking in); each story plaque on the floor speaks
// when you step on it; the card's HEAR IT reads the piece. Nothing is recorded, nothing is downloaded: speechSynthesis.
const GUIDE = { on: false, voice: null, last: '' };
function pickVoice() { const vs = speechSynthesis.getVoices(); GUIDE.voice = vs.find((v) => /Daniel|Samantha|Alex|Google US English/.test(v.name)) || vs.find((v) => /^en/.test(v.lang)) || null; }
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
function speak(text, force) { if (!text || (!GUIDE.on && !force)) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); if (GUIDE.voice) u.voice = GUIDE.voice; u.rate = 1.0; u.pitch = 0.95; music.duck && music.duck(true); u.onend = () => music.duck && music.duck(false); speechSynthesis.speak(u); GUIDE.last = text; } catch (e) {} }
function setGuide(on = !GUIDE.on) { GUIDE.on = on; $('#guidebtn').classList.toggle('on', on); if (on) { toast('The guide is on. It talks as you walk in, on every date in the floor, and on any piece you open.', 3200); const r = ROOMS[cur]; speak(r && (r.guide || `${r.name}. ${r.film}.`)); } else try { speechSynthesis.cancel(); } catch (e) {} }
// the title card: the first time you walk into a gallery, its name crosses the screen like a film title
function reveal(r) { const el = $('#reveal'); if (!el) return; const n = r.lvl && /A$/.test(r.lvl) ? r.lvl.replace('A', '') : '';
  $('#rv-k').textContent = n ? `GALLERY ${n} OF 10` : (r.id === 'machine' ? 'THE WAY IN' : 'THE FINALE');
  $('#rv-t').textContent = n ? (ARTIST[r.g] || r.name) : r.name; $('#rv-s').textContent = n ? 'The moment · the city wrapped · the show' : r.film;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
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
    if (EGGS.size === EGG_N) setTimeout(() => toast('Every egg in the city found. You have seen everything that could only happen here, and you still live here. That is the whole joke.', 5000), 3000);
  }
  if (line) toast(line, 3600);
}
const bubbles = [];
function say(anchor, text, ms = 3200, dy = 2.1) { const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; $('#bubbles').appendChild(el); const b = { anchor, el, until: performance.now() + ms, dy }; bubbles.push(b); return b; }
let shakeAmt = 0; function shake(a) { shakeAmt = Math.max(shakeAmt, a); }
function flash(v = 1) { FX.flash = Math.max(FX.flash, v); }

// ---------- the card: the piece, the original beside it, the rest of the wall ----------
// Every piece hangs with the census portrait it came from. The card opens on the restyle, then draws a seam across it:
// left of the seam is MLow's original (from the census, n3wyorkers.com), right is the same New Yorker in the artist's
// hand. Drag the seam. Arrows walk the wall (the room's hang, or the vault you clicked); WALK TO IT stands you in front.
const CARD = { list: [], k: 0, split: 0, anim: 0 };
function openPiece(p, list, k) {
  const c = $('#card'); c.classList.add('on'); if (locked) document.exitPointerLock(); TOUR.on && tourStop();
  if (list) { CARD.list = list; CARD.k = k; } else { const r = ROOMS[p.ri ?? cur]; CARD.list = (r?.cast || []).filter((q) => q.mesh); CARD.k = Math.max(0, CARD.list.indexOf(p)); if (!CARD.list.length) CARD.list = [p]; }
  showPiece(p);
}
function showPiece(p) {
  const vault = !!p.vault;
  $('#c-t').textContent = p.t; $('#c-no').textContent = `No. ${p.n}`;
  $('#c-p').textContent = [[p.h, p.b].filter(Boolean).join(', '), p.s].filter(Boolean).join('  ·  ');
  const r = ROOMS[p.ri ?? cur];
  $('#c-k').textContent = p.honor ? 'HONORARY NEW YORKER · PORTRAIT BY MLOW' : (vault ? `THE VAULT · ${(ARTIST[p.g] || '').toUpperCase()} · ${CARD.k + 1} OF ${CARD.list.length}` : `${(r?.name || '').toUpperCase()} · ${CARD.k + 1} OF ${CARD.list.length} ON THESE WALLS`);
  $('#c-ll').textContent = p.ll || '';
  $('#c-a').href = p.honor ? `https://n3wyorkers.com/h/${p.honor}` : `https://n3wyorkers.com/n/${p.n}`;
  $('#c-a').textContent = p.honor ? 'Meet the honorary' : 'Open the record';
  $('#c-img').src = vault ? `assets/vault/${p.g}/${p.f}` : `assets/art/${p.f}`;
  const has = !!p.i; $('#c-orig').style.display = has ? '' : 'none'; $('#c-media').classList.toggle('cmp', has);
  if (has) $('#c-orig').src = p.i;
  $('#c-walk').style.display = p.mesh || vault ? '' : 'none'; $('#c-walk').textContent = vault ? 'Walk to the vault' : 'Walk to it';
  CARD.split = 0; CARD.anim = has ? performance.now() : 0; setSplit(0);
}
function setSplit(v) { CARD.split = v; $('#c-img').style.clipPath = `inset(0 0 0 ${v * 100}%)`; $('#c-seam').style.left = `${v * 100}%`; $('#c-seam').style.opacity = v > 0.002 && v < 0.998 ? 1 : 0; }
function stepPiece(d) { if (!CARD.list.length) return; CARD.k = (CARD.k + d + CARD.list.length) % CARD.list.length; showPiece(CARD.list[CARD.k]); }
function closePiece() { $('#card').classList.remove('on'); }
$('#c-x').onclick = closePiece; $('#card').addEventListener('click', (e) => { if (e.target.id === 'card') closePiece(); });
$('#c-prev').onclick = (e) => { e.stopPropagation(); stepPiece(-1); }; $('#c-next').onclick = (e) => { e.stopPropagation(); stepPiece(1); };
$('#c-walk').onclick = () => { const p = CARD.list[CARD.k]; closePiece(); if (p) walkTo(p); };
{ const m = $('#c-media'); let drag = false; const at = (e) => { const b = m.getBoundingClientRect(); setSplit(Math.max(0, Math.min(1, (e.clientX - b.left) / b.width))); CARD.anim = 0; };
  m.addEventListener('pointerdown', (e) => { if (!m.classList.contains('cmp') || e.target.tagName === 'BUTTON') return; drag = true; m.setPointerCapture(e.pointerId); at(e); });
  m.addEventListener('pointermove', (e) => { if (drag) at(e); }); m.addEventListener('pointerup', () => { drag = false; }); }
addEventListener('keydown', (e) => { if (!$('#card').classList.contains('on')) return; if (e.code === 'ArrowRight') { e.stopImmediatePropagation(); stepPiece(1); } if (e.code === 'ArrowLeft') { e.stopImmediatePropagation(); stepPiece(-1); } }, true);
// the seam draws itself once, from the right edge to just past the middle, so nobody misses that there are two
function cardTick() { if (!CARD.anim) return; const u = Math.min(1, (performance.now() - CARD.anim) / 1400); const e = 1 - Math.pow(1 - u, 3); setSplit(0.5 * e); if (u >= 1) CARD.anim = 0; }

// stand in front of a piece, facing it: the room is built on demand, so wait for the frame to exist
function walkTo(p) {
  if (p.vault) { const r = ROOMS.find((q) => q.id === p.g + '_c'); if (r) { go(r.i); const v = r.vaultAt; if (v) { P.x = r.x0 + v[0]; P.z = v[1]; P.yaw = v[2]; } } return; }
  const r = ROOMS[p.ri]; if (!r) return; if (cur !== r.i) go(r.i);
  let n = 0; const tryIt = () => { if (!p.group) { if (++n < 300) requestAnimationFrame(tryIt); return; }
    const q = new THREE.Vector3(), nrm = new THREE.Vector3(0, 0, 1); p.group.updateWorldMatrix(true, false); p.group.getWorldPosition(q); nrm.applyQuaternion(p.group.getWorldQuaternion(new THREE.Quaternion()));
    const d = 2.3 + (p.group.userData.h || 0.8) * 0.6; P.x = q.x + nrm.x * d; P.z = q.z + nrm.z * d; P.yaw = Math.atan2(-(q.x - P.x), -(q.z - P.z)); P.pitch = Math.atan2(q.y - EYE, d) * 0.8; settle(); };
  tryIt();
}

// ---------- the tour: T walks you round the wall, piece by piece ----------
const TOUR = { on: false, list: [], k: 0, t: 0, from: null, to: null };
function tourStop() { TOUR.on = false; $('#tourbtn').classList.remove('on'); }
function tourStart() {
  const r = ROOMS[cur]; const list = (r?.cast || []).filter((q) => q.group); if (!list.length) { toast('Nothing hung here yet. Give the room a second.', 2000); return; }
  TOUR.list = list; TOUR.k = -1; TOUR.on = true; $('#tourbtn').classList.add('on'); tourNext(); toast('The tour. Every piece in this room, in order. Move to stop.', 2600);
}
function tourNext() {
  if (++TOUR.k >= TOUR.list.length) { tourStop(); toast('That is the whole wall. ] for the next room.', 2400); return; }
  const p = TOUR.list[TOUR.k], q = new THREE.Vector3(), nrm = new THREE.Vector3(0, 0, 1); p.group.getWorldPosition(q); nrm.applyQuaternion(p.group.getWorldQuaternion(new THREE.Quaternion()));
  const d = 2.4 + (p.group.userData.h || 0.8) * 0.6, x = q.x + nrm.x * d, z = q.z + nrm.z * d;
  TOUR.from = { x: P.x, z: P.z, yaw: P.yaw, pitch: P.pitch }; let yaw = Math.atan2(-(q.x - x), -(q.z - z)); while (yaw - P.yaw > Math.PI) yaw -= 2 * Math.PI; while (yaw - P.yaw < -Math.PI) yaw += 2 * Math.PI;
  TOUR.to = { x, z, yaw, pitch: Math.atan2(q.y - EYE, d) * 0.8 }; TOUR.t = 0;
  if (GUIDE.on) speak(`${p.t}. ${p.s || ''}`);
}
function tourTick(dt) {
  if (!TOUR.on) return; TOUR.t += dt; const u = Math.min(1, TOUR.t / 2.2), e = u * u * (3 - 2 * u), A = TOUR.from, B = TOUR.to;
  P.x = A.x + (B.x - A.x) * e; P.z = A.z + (B.z - A.z) * e; P.yaw = A.yaw + (B.yaw - A.yaw) * e; P.pitch = A.pitch + (B.pitch - A.pitch) * e;
  if (TOUR.t > (GUIDE.on ? 11 : 6.2)) tourNext();
}
$('#tourbtn').addEventListener('click', (e) => { e.stopPropagation(); TOUR.on ? tourStop() : tourStart(); });
$('#guidebtn').addEventListener('click', (e) => { e.stopPropagation(); setGuide(); });
addEventListener('keydown', (e) => { if (started && e.code === 'KeyG' && !e.repeat && document.activeElement?.id !== 'idx-q') setGuide(); });
$('#c-hear').onclick = () => { const p = CARD.list[CARD.k]; if (p) speak(`${p.t}. Number ${p.n}${p.h ? ', ' + p.h : ''}. ${p.s || ''} ${p.ll || ''}.`, true); };
addEventListener('keydown', (e) => { if (!started) return; if (e.code === 'KeyT' && !e.repeat && !e.metaKey && !e.ctrlKey) { TOUR.on ? tourStop() : tourStart(); return; } if (TOUR.on && /^(Key[WASD]|Arrow)/.test(e.code)) tourStop(); });

// ---------- the index: every piece on every wall, searchable, one click to stand in front of it ----------
function buildIndex() {
  const box = $('#idx-list'); let html = '';
  ROOMS.forEach((r, i) => { if (!r.cast.length) return; html += `<h4>${r.lvl || i + 1} · ${r.name}<small>${r.film || ''}</small></h4><div class="g">` + r.cast.map((p, k) => `<button type="button" data-r="${i}" data-k="${k}" data-s="${(p.t + ' ' + p.n + ' ' + p.h + ' ' + r.name + ' ' + (ARTIST[r.g] || '')).toLowerCase().replace(/"/g, '')}"><img loading="lazy" src="assets/art/${p.f}" alt=""><b>${p.t}</b><i>No. ${p.n} · ${p.h || ''}</i></button>`).join('') + '</div>'; });
  box.innerHTML = html;
  box.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const p = ROOMS[+b.dataset.r].cast[+b.dataset.k]; $('#idx').classList.remove('on'); walkTo(p); });
  $('#idx-q').addEventListener('input', () => { const q = $('#idx-q').value.trim().toLowerCase(); box.querySelectorAll('button').forEach((b) => { b.style.display = !q || b.dataset.s.includes(q) ? '' : 'none'; }); box.querySelectorAll('h4').forEach((h) => { const g = h.nextElementSibling; h.style.display = g.querySelector('button:not([style*="none"])') ? '' : 'none'; }); });
  const n = ROOMS.reduce((a, r) => a + r.cast.length, 0), v = Object.values(window.VAULT || {}).reduce((a, s) => a + s.items.length, 0);
  $('#idx-n').textContent = `${n} on the walls · ${v} in the vaults`;
}
buildIndex();
const openIndex = (on = !$('#idx').classList.contains('on')) => { $('#idx').classList.toggle('on', on); if (on) { if (locked) document.exitPointerLock(); TOUR.on && tourStop(); setTimeout(() => $('#idx-q').focus(), 50); } };
$('#idxbtn').addEventListener('click', (e) => { e.stopPropagation(); openIndex(); }); $('#idx-x').onclick = () => openIndex(false);
$('#idx').addEventListener('click', (e) => { if (e.target.id === 'idx') openIndex(false); });
addEventListener('keydown', (e) => { if (!started) return; if (e.code === 'KeyH' && !e.repeat && document.activeElement?.id !== 'idx-q') openIndex(); if (e.code === 'Escape') openIndex(false); });

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
  if (best) { const p = best.userData.piece; $('#peek').textContent = [p.t, `No. ${p.n}`, p.h].filter(Boolean).join('  ·  '); $('#peek').classList.add('on'); } else $('#peek').classList.remove('on');
}
window.__peekNear = () => peekP; window.__click = (h, n = 1) => { const o = clickables.find((q) => q.userData.hint === h && near(q)); if (!o) return false; for (let i = 0; i < n; i++) o.userData.click(o); return true; }; window.__openPiece = (ri, k) => openPiece(ROOMS[ri].cast[k]); window.__openIndex = (q) => { openIndex(true); if (q) { $('#idx-q').value = q; $('#idx-q').dispatchEvent(new Event('input')); } };

// ---------- rooms ui ----------
const nav = $('#rooms');
const COARSE = matchMedia('(pointer:coarse),(max-width:700px)').matches;
ROOMS.forEach((r, i) => { const b = document.createElement('button'); b.innerHTML = `<i>${COARSE ? i + 1 : (i + 1) % 10}</i><span>${COARSE && r.film ? r.name + ' · ' + r.film : r.name}</span>`; b.onclick = (e) => { e.stopPropagation(); go(i); nav.classList.remove('open'); }; nav.appendChild(b); });
$('#setsbtn').onclick = (e) => { e.stopPropagation(); nav.classList.toggle('open'); if (nav.classList.contains('open')) nav.children[cur]?.scrollIntoView({ block: 'center' }); };
let cur = -1;
function enter(i) {
  cur = i; const r = ROOMS[i]; r.enteredAt = performance.now(); envLoad(r.hdri || 'day', !started); for (const j of [i - 1, i + 1]) if (ROOMS[j]) envLoad(ROOMS[j].hdri || 'day', false); near3(i); wake(i); settle(); if (SKATE.active) SK.greet = i; WAY.room = -1;
  [...nav.children].forEach((b, j) => b.classList.toggle('on', j === i)); $('#setsn').textContent = `${i + 1} / ${ROOMS.length}`;
  $('#rname').textContent = r.name; $('#rk').textContent = r.kicker; $('#rf').textContent = r.film;
  scene.fog.color.set(r.fog || 0x07080d); scene.fog.density = r.fogD || 0.018; scene.background.set(r.sky || 0x05060a);
  hemi.color.set(r.hemi?.[0] ?? 0x8899bb); hemi.groundColor.set(r.hemi?.[1] ?? 0x221a12); hemi.intensity = r.hemi?.[2] ?? 0.4;
  scene.environmentIntensity = r.env ?? 0.35; if (ENVS[r.hdri || 'day']) scene.environment = ENVS[r.hdri || 'day'];
  if (r.sun) { sun.color.set(r.sun[0]); sun.userData.i = r.sun[1]; sun.position.set(r.x0 + W / 2 + r.sun[2], r.sun[3], r.sun[4]); sun.target.position.set(r.x0 + W / 2, 0, 0); } else sun.userData.i = 0;
  (r.lights || []).forEach((L, k) => { const l = lights[k]; l.position.set(r.x0 + L[0], Math.min(L[1], (r.ceilH || 99) - 0.35), L[2]); l.color.set(L[3]); l.userData.i = L[4]; l.distance = L[5] || 26; });
  for (let k = (r.lights || []).length; k < lights.length; k++) lights[k].userData.i = 0;
  sound.room(r.sound); music.play(r.music || null);
  r.onEnter && r.onEnter();
  if (!r.revealed && started && (/A$/.test(r.lvl || '') || r.id === 'machine' || r.id === 'luna_luna')) { r.revealed = true; reveal(r); }
  if (GUIDE.on) setTimeout(() => { if (cur === i) speak(r.guide || `${r.name}. ${r.film}.`); }, 600);
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

// ---------- resolution ----------
// 2026-11-01: a laptop on battery, an old integrated GPU or a 5K screen cannot always draw this gallery at 1.5 device
// pixels. While someone is walking, the median frame over two seconds is watched: slower than about 45 a second and the
// render scale steps down a quarter (never under 0.75, or 0.6 on a phone); fast for eight seconds and it steps back up,
// unless that level has already failed twice. Long one off frames (a room being built) do not count, the median ignores them.
// ?pr=1 fixes the scale for testing; window.__DPR shows what it chose.
const DPR = { max: Math.min(devicePixelRatio, 1.5), min: MOBILE ? 0.6 : 0.75, cur: 0, ts: [], since: performance.now(), fail: {}, fixed: Q.has('pr') };
DPR.cur = DPR.fixed ? +Q.get('pr') : DPR.max; renderer.setPixelRatio(DPR.cur); resize(); window.__DPR = DPR;
function dprTick(dtMs) {
  if (DPR.fixed || !started || POWER.blurred || document.hidden || powerBudget() > 20) { DPR.ts.length = 0; return; }
  DPR.ts.push(dtMs); if (performance.now() - DPR.since < 2000) return;
  const s = DPR.ts.slice().sort((a, b) => a - b), med = s[s.length >> 1] || 16; DPR.ts.length = 0; DPR.since = performance.now();
  const set = (v) => { DPR.cur = Math.round(v * 100) / 100; renderer.setPixelRatio(DPR.cur); resize(); };
  if (med > 22 && DPR.cur > DPR.min + 0.01) { DPR.fail[DPR.cur] = (DPR.fail[DPR.cur] || 0) + 1; DPR.good = 0; set(Math.max(DPR.min, DPR.cur - 0.25)); }
  else if (med < 18 && DPR.cur < DPR.max - 0.01) { DPR.good = (DPR.good || 0) + 1; const up = Math.min(DPR.max, DPR.cur + 0.25); if (DPR.good >= 4 && (DPR.fail[Math.round(up * 100) / 100] || 0) < 2) { DPR.good = 0; set(up); } }
}

// ---------- loop ----------
const clock = new THREE.Clock(); let started = false;
const _cw = new THREE.Vector3(), _cl = new THREE.Vector3(), _co = new THREE.PerspectiveCamera();   // a camera, so lookAt points its -z (an Object3D would face away)
function frame() {
  const nowMs = performance.now(); if (nowMs - POWER.drawn < powerBudget()) { requestAnimationFrame(frame); return; } if (POWER.drawn) dprTick(nowMs - POWER.drawn); POWER.drawn = nowMs; POWER.frames = (POWER.frames || 0) + 1;
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
          if (e.points > (BEST[R0.id] || 0)) { const had = BEST[R0.id]; BEST[R0.id] = e.points; try { localStorage.setItem('oiny.skate.best', JSON.stringify(BEST)); } catch (er) {} if (had) toast(`NEW BEST ON THIS SET: ${e.points.toLocaleString('en-US')}`, 2600); }
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
    const ox = P.x, oz = P.z, s0 = parkSurf(R0, ox, oz);
    [P.x, P.z] = collide(nx, nz); P.bob += sp * 2.4;
    if (parkSurf(R0, P.x, P.z) > s0 + 0.3) { P.x = ox; P.z = oz; }   // walk up a ramp, not up the back of one
  }
  const ri = Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))); if (ri !== cur) { const t0 = performance.now(); enter(ri); ph('enter', t0); }
  const R = ROOMS[ri];
  const gy = R.ground ? R.ground(P.x - R.x0, P.z) : 0;
  { const pk = PARK.get(R, SKATE.active && parkReady(R)); if (pk) pk.group.visible = SKATE.active; }   // the ramps only exist while you skate; walking, the rooms are the rooms
  const gs = parkSurf(R, P.x, P.z);
  P.y += ((gy + gs + EYE * P.scale + P.lift) - P.y) * Math.min(1, dt * (R.ground || gs ? 14 : 4));
  if (!SKATE.active && !R.holdLift && !P.ride) P.lift += (0 - P.lift) * Math.min(1, rdt * 1.4);
  { const t0 = performance.now(); for (const f2 of tickers) f2(TIME.t, dt, P, ri, rdt); ph('tick', t0); }
  wayTick(t);
  // the camera: dolly back along the view for the vertigo, with the field of view the room asks for
  const fovT = (P.zoom ? 14 : R.fov ? R.fov(P) : FOV) + (SKATE.active ? SKATE.v * 1.5 : 0); P.fov += (fovT - P.fov) * Math.min(1, dt * 3);
  if (Math.abs(camera.fov - P.fov) > 0.01 || P.squeeze || P.squeezed) { camera.fov = P.fov; camera.updateProjectionMatrix(); if (P.squeeze) { camera.projectionMatrix.elements[5] *= P.squeeze; camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert(); } P.squeezed = !!P.squeeze; }
  const back = R.fov ? (Math.tan(FOV * Math.PI / 360) / Math.tan(P.fov * Math.PI / 360) - 1) * 3.2 : 0; P.back += (back - P.back) * Math.min(1, dt * 3);
  tourTick(rdt); cardTick();
  camera.rotation.set(P.pitch, P.yaw, P.roll || 0); P.roll = (P.roll || 0) * 0.9;
  avatar.position.set(P.x, P.y - EYE * P.scale, P.z); avatar.rotation.y = P.yaw; avatar.scale.setScalar(P.scale); avatar.visible = !SKATE.active;
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
    const html = `SKATE THE CITY · ${R.i + 1} / ${ROOMS.length} · ${R.film || R.name}\n<b>${SKATE.score.toLocaleString('en-US')}</b>\n${Math.round(SKATE.v * 3.6)} KM/H${SKATE.grind ? ' · GRINDING' : ''}${BEST[R.id] ? ' · BEST ' + BEST[R.id].toLocaleString('en-US') : ''}\n<span class="t">${msg}</span>${goals}` +
      (SK.debug ? `\n<span class="dbg">room ${R.id} · v ${SKATE.v.toFixed(2)} · ${SKATE.grind ? 'GRIND' : SKATE.air ? 'AIR ' + SKATE.height.toFixed(2) : 'GROUND'} · y ${SKATE.y.toFixed(2)} · ${park ? park.features.length + ' spots' : 'no layout'} · steer ${SKATE.steering.toFixed(2)} · ${SKATE.tricks.at(-1) || 'no trick'}</span>` : '');
    if (html !== SK.html) { SK.html = html; $('#skate').innerHTML = html; }
  }
  for (const l of lights) l.intensity += ((l.userData.i || 0) - l.intensity) * Math.min(1, dt * 3);
  sun.intensity += ((sun.userData.i || 0) - sun.intensity) * Math.min(1, dt * 3);
  for (const r of ROOMS) { if (!r.built) continue; const vis = Math.abs(r.i - ri) <= 1; if (r.plateMesh) r.plateMesh.visible = vis; if (r.group) r.group.visible = vis; }
  spotBalance();
  if ((t * 4 | 0) !== ((t - dt) * 4 | 0)) peek();
  if (locked || MOBILE) { const o = pick(null); $('#cross').classList.toggle('hot', !!o); $('#hint').textContent = o ? (o.userData.hint || '') : ''; }
  const now = performance.now();
  for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; } b.anchor.getWorldPosition(_w); _w.y += b.dy; _w.project(camera); const on = _w.z < 1 && Math.abs(_w.x) < 1.1; b.el.style.display = on ? 'block' : 'none'; b.el.style.transform = `translate(${(_w.x * 0.5 + 0.5) * innerWidth}px,${(-_w.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
  // the screen pass eases to the room's look
  const pp = R.post || {}, e = Math.min(1, dt * 2);
  POST.sat += ((FX.sat ?? pp.sat ?? 1) - POST.sat) * e; POST.heat += ((pp.heat || 0) - POST.heat) * e; POST.grain += ((pp.grain || 0) - POST.grain) * e;
  POST.warp += (FX.warp - POST.warp) * e; FX.flash *= 0.86;
  for (const k of ['dots', 'facet', 'swirl', 'quad']) { POST[k] += (FX[k] - POST[k]) * e; if (POST[k] < 0.004 && !FX[k]) POST[k] = 0; }
  const U = postMat.uniforms; U.uSat.value = POST.sat; U.uHeat.value = POST.heat; U.uWarp.value = POST.warp; U.uGrain.value = POST.grain; U.uTime.value = t; U.uFlash.value = 0; U.uTint.value.lerp(_tint.set(FX.tint ?? 0xffffff), e); U.uDots.value = POST.dots; U.uFacet.value = POST.facet; U.uSwirl.value = POST.swirl; U.uQuad.value = POST.quad; renderer.getDrawingBufferSize(U.uRes.value);
  $('#flash').style.opacity = FX.flash > 0.02 ? FX.flash.toFixed(2) : 0;
  // the pass only runs when a room asks for it: going through the target would tone map the plates twice over
  // the finish: every set gets bloom, vignette, fringing and a little grain unless it asks otherwise (R.post.bloom etc.)
  const bl = LITE ? 0 : pp.bloom ?? (MOBILE ? 0.55 : 0.85);
  U.uBloom.value = bl; U.uVig.value = LITE ? 0 : pp.vig ?? 0.42; U.uCA.value = LITE || MOBILE ? 0 : (pp.ca ?? 0.0035) + (SKATE.active ? SKATE.v * 0.0005 : 0);
  U.uGrain.value = Math.max(POST.grain, LITE ? 0 : 0.12);
  const usePost = !LITE || FX.tint !== null || U.uTint.value.b < 0.99 || POST.heat > 0.005 || POST.warp > 0.005 || Math.abs(POST.sat - 1) > 0.01 || POST.grain > 0.01 || POST.dots > 0 || POST.facet > 0 || POST.swirl > 0 || POST.quad > 0;
  const tR = performance.now(), p0 = renderer.info.programs.length, x0 = renderer.info.memory.textures, g0 = renderer.info.memory.geometries;
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
  ph('render', tR);
  { const t0 = performance.now(); buildNext(); ph('buildq', t0); } { const t0 = performance.now(); warmTick(); ph('warm', t0); } { const t0 = performance.now(); if (started || POWER.frames > 20) primeTick(); ph('prime', t0); }
  const fm = performance.now() - nowMs; if (fm > 40 && SLOW.length < 200) SLOW.push({ at: Math.round(nowMs), ms: Math.round(fm), room: R.id, newProgs: renderer.info.programs.length - p0, newTexs: renderer.info.memory.textures - x0, newGeos: renderer.info.memory.geometries - g0, ...Object.fromEntries(Object.entries(PH).map(([k, v]) => [k, Math.round(v)])) });
  for (const k in PH) delete PH[k];
  requestAnimationFrame(frame);
}

// a phone that runs out of GPU memory loses the context: say so and offer the way back instead of a black screen
cnv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toast('The phone ran out of graphics memory. Tap to reload this set.', 600000); $('#toast').style.pointerEvents = 'auto'; $('#toast').onclick = () => { const r = ROOMS[cur]; location.search = '?room=' + (r ? r.id : ''); }; });

// ---------- start ----------
const sound = new Sound(); ctx.sound = sound; const music = Music(sound); ctx.music = music; window.__music = music;
const ready = () => { $('#go').disabled = false; $('#go').textContent = 'Walk in'; $('#goskate').disabled = false; };
mgr.onLoad = ready; setTimeout(ready, 15000);
// two ways in: on foot, or on a board (SKATE THE SETS, or ?skate in the address) with the same film either way
function enterFilm(skate) {
  started = true; $('#intro').classList.add('off'); sound.start(); music.start(); if (!MOBILE && !Q.has('nolock')) lock();
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
