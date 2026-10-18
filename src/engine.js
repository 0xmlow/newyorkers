// THE PIGEONHOLE engine. A museum inside a pigeon inside a bodega inside a dream.
// Forked in spirit from ON LOCATION (the post pass, the depth plates, the hang, the GLB loader, the power policy) and
// rebuilt around one idea the movie sets never had: rooms that live INSIDE objects in other rooms, at other scales.
//
// Every room is a pocket of the same scene, 400 m apart on x, built in its own local coordinates. Only the room you
// are in is drawn, plus whatever a portal is looking at. Three ways between rooms:
//   1. render target portals (portal()): a surface that shows another room from a virtual camera, with any scale
//      change. Ride into it and you come out the other side at the matching pose, so the cut cannot be seen.
//      Ping-pong targets give recursion for free: a portal that can see itself shows itself, a frame late, forever.
//   2. stencil pockets (pocket()): a pane of glass that is bigger on the inside. The pocket's contents sit behind the
//      glass, inside the wall, and draw only where the glass is. One pass, full resolution, no render target.
//   3. doors (door()): walk into a trigger and the room changes, with a fade, or none when the seam is invisible.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { Sound } from './sound.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const $ = (s) => document.querySelector(s);
export const Q = new URLSearchParams(location.search);
export const MOBILE = matchMedia('(pointer:coarse)').matches;
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const GAP = 400;          // metres between room origins on x
export const EYE = 1.62;
const FOV = MOBILE ? 72 : 68;

// ---------- renderer ----------
export const renderer = new THREE.WebGLRenderer({ antialias: false, stencil: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.25 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = +(Q.get('ex') || 1.0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = false;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02040c);
scene.fog = new THREE.FogExp2(0x02040c, 0.02);
export const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.04, 1200);
camera.rotation.order = 'YXZ';
scene.add(camera);

// ---------- the screen pass ----------
// The scene renders into a target flagged like an XR target, so it tone maps INTO the target exactly as it would onto
// the screen, and the plates (toneMapped false) are untouched. The pass then finishes the picture: bloom, a lens
// vignette, edge fringing, grain, and the two effects this gallery needs: DREAM (the edges of the frame breathe and
// drip upward, like a dream refusing focus) and WAKE (the frame closes like an eyelid when you change scale).
const mkRT = (w = 1, h = 1, samples = 0) => { const t = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples, stencilBuffer: true }); t.isXRRenderTarget = true; t.texture.colorSpace = THREE.LinearSRGBColorSpace; return t; };
const rt = mkRT(1, 1, MOBILE ? 0 : 4);
const LITE = Q.has('lite');
const bloomA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }), bloomB = bloomA.clone();
const FSV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const brightMat = new THREE.ShaderMaterial({ uniforms: { tScene: { value: rt.texture }, uThr: { value: 0.62 } }, vertexShader: FSV, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tScene; uniform float uThr; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tScene, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(uThr, uThr + 0.35, l), 1.); }` });
const blurMat = new THREE.ShaderMaterial({ uniforms: { tIn: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: FSV, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tIn, vUv).rgb * 0.227;
      c += (texture2D(tIn, vUv + uDir * 1.385).rgb + texture2D(tIn, vUv - uDir * 1.385).rgb) * 0.316;
      c += (texture2D(tIn, vUv + uDir * 3.231).rgb + texture2D(tIn, vUv - uDir * 3.231).rgb) * 0.07;
      gl_FragColor = vec4(c, 1.); }` });
const postMat = new THREE.ShaderMaterial({
  uniforms: { tScene: { value: rt.texture }, tBloom: { value: bloomA.texture }, uBloom: { value: 0 }, uVig: { value: 0 }, uCA: { value: 0 }, uSat: { value: 1 }, uDream: { value: 0 }, uWake: { value: 0 }, uWarp: { value: 0 }, uGrain: { value: 0 }, uTime: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) }, uAspect: { value: 1 } },
  vertexShader: FSV,
  fragmentShader: `
    uniform sampler2D tScene, tBloom; uniform float uSat, uDream, uWake, uWarp, uGrain, uTime, uBloom, uVig, uCA, uAspect; uniform vec3 uTint; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    void main(){
      vec2 uv = vUv; vec2 c = uv - 0.5; float r = length(c * vec2(uAspect, 1.));
      // dream: the rim of the picture runs like wet paint, upward, and breathes
      float rim = smoothstep(0.42, 0.95, r) * uDream;
      uv.y -= rim * 0.02 * n2(vec2(uv.x * 18., uTime * 0.6));
      uv.x += rim * 0.01 * sin(uv.y * 30. + uTime * 1.3);
      uv = 0.5 + (uv - 0.5) * (1. + uWarp * 0.05 * sin(uTime * 2.1 - r * 8.));
      vec2 ca = (uv - 0.5) * (uCA + rim * 0.01);
      vec4 col = texture2D(tScene, uv); col.r = texture2D(tScene, uv + ca).r; col.b = texture2D(tScene, uv - ca).b;
      col.rgb += texture2D(tBloom, uv).rgb * uBloom;
      float l = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
      col.rgb = mix(vec3(l), col.rgb, uSat) * uTint;
      // the contour field of the style shows up only in the dream rim: fine cobalt and cyan isolines over luminance
      float iso = abs(fract(l * 9. + n2(uv * 6.) * 0.6) - 0.5);
      col.rgb += rim * 0.35 * smoothstep(0.06, 0.0, iso) * mix(vec3(0.16, 0.38, 1.), vec3(0., 0.9, 1.), n2(uv * 3. + uTime * 0.1));
      col.rgb += (h(vUv * 800. + uTime) - 0.5) * uGrain * 0.09;
      col.rgb *= 1. - uVig * smoothstep(0.35, 0.95, r * 1.2);
      // wake: an eyelid. top and bottom close toward the middle, with a soft lash shadow
      float lid = abs(c.y) * 2. - (1. - uWake) - 0.04 * sin(c.x * 3.14);
      col.rgb *= 1. - smoothstep(-0.06, 0.02, lid);
      gl_FragColor = vec4(col.rgb, 1.);
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const postQuad = new THREE.Mesh(tri, postMat); postQuad.frustumCulled = false; postScene.add(postQuad);
export const FX = { warp: 0, sat: null, wake: 0, dream: null };
const POST = { sat: 1, dream: 0, warp: 0, grain: 0 };
// one uniform, shared by every portal material: the size of whatever target is being drawn right now
const SCREEN = { value: new THREE.Vector2(1, 1) };
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  const pr = renderer.getPixelRatio(), w = Math.round(innerWidth * pr), h = Math.round(innerHeight * pr);
  rt.setSize(w, h); const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2); bloomA.setSize(bw, bh); bloomB.setSize(bw, bh); blurMat.userData.px = [1 / bw, 1 / bh];
  postMat.uniforms.uAspect.value = innerWidth / innerHeight;
  for (const p of PORTALS) p.sized = false;
}

// ---------- loading ----------
const loading = { total: 0, done: 0 };
export const mgr = new THREE.LoadingManager();
mgr.onProgress = (_u, d, t) => { loading.done = d; loading.total = t; const p = $('#lp'); if (p) p.style.width = (100 * d / Math.max(1, t)).toFixed(0) + '%'; };
export const tex = new THREE.TextureLoader(mgr);
const gltfL = new GLTFLoader(mgr);
const draco = new DRACOLoader(); draco.setDecoderPath('assets/draco/'); gltfL.setDRACOLoader(draco);
new HDRLoader(mgr).load('assets/env/night.hdr', (h) => {
  h.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(h).texture; h.dispose(); pm.dispose();
});
scene.environmentIntensity = 0.4;

// ---------- materials ----------
const SURF = {};
// a generated material: colour from the image, and a normal and roughness map derived from it at build time
// (tools/pbr.py: Sobel of a blurred luminance height). Those are authored approximations, not measured relief.
export function surf(name, rep = 2, o = {}) {
  const k = name + rep + JSON.stringify(o);
  if (SURF[k]) return SURF[k];
  const ld = (s, srgb) => { const t = tex.load(`assets/tex/${name}_${s}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const P = { map: ld('c', true), normalMap: ld('n'), roughnessMap: ld('r'), color: o.tint ? new THREE.Color(o.tint) : 0xffffff, ...o.params };
  const m = o.physical ? new THREE.MeshPhysicalMaterial(P) : new THREE.MeshStandardMaterial(P);
  if (o.normal) m.normalScale.set(o.normal, o.normal);
  if (o.rough !== undefined) { m.roughnessMap = null; m.roughness = o.rough; }
  m.userData.rep = rep;
  return (SURF[k] = m);
}
// a box whose UVs are in metres / rep, so a texture keeps its real size on any face
export function slab(w, h, d, mat, x = 0, y = 0, z = 0, rep) {
  const g = new THREE.BoxGeometry(w, h, d);
  const r = rep || mat.userData?.rep || 2, uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [d, h] : ay > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, uv.getX(i) * a / r, uv.getY(i) * b / r);
  }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m;
}
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.canvas = c; return t;
}
export const FONT = '"Space Grotesk", "Helvetica Neue", Arial, sans-serif', SERIF = 'Fraunces, Georgia, serif', MONO = '"IBM Plex Mono", Menlo, monospace';
export function sign(text, { w = 4, h = 0.8, bg = '#111', fg = '#f4ead2', font = FONT, weight = 800, glow = 0, px = 256, pad = 0.12, border, align = 'center' } = {}) {
  const cw = Math.round(px * w / h), t = canvasTex(cw, px, (g, W2, H2) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, W2, H2); }
    if (border) { g.strokeStyle = border; g.lineWidth = H2 * 0.04; g.strokeRect(H2 * .04, H2 * .04, W2 - H2 * .08, H2 - H2 * .08); }
    const lines = text.split('\n'); let fs = H2 * (1 - pad * 2) / lines.length * 0.86;
    g.font = `${weight} ${fs}px ${font}`; const mw = Math.max(...lines.map((l) => g.measureText(l).width));
    if (mw > W2 * (1 - pad)) { fs *= W2 * (1 - pad) / mw; g.font = `${weight} ${fs}px ${font}`; }
    g.fillStyle = fg; g.textAlign = align; g.textBaseline = 'middle';
    if (glow) { g.shadowColor = fg; g.shadowBlur = glow; }
    const x = align === 'left' ? W2 * pad / 2 : W2 / 2;
    lines.forEach((l, i) => g.fillText(l, x, H2 / 2 + (i - (lines.length - 1) / 2) * fs * 1.12));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, toneMapped: !glow, fog: false }));
}
// a picture used as a surface: generated signs, menu boards, posters
export function picture(file, w, h, { emissive = 0.85, rough = 0.6, basic = false } = {}) {
  const t = tex.load(`assets/${file}`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = basic ? new THREE.MeshBasicMaterial({ map: t, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: emissive, roughness: rough });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// ---------- the Open Eye Flower, drawn in code (so it can blink and track) ----------
export function eyeFlower(g, cx, cy, R, { petals = 7, iris = '#2a6fd6', lid = 0, look = [0, 0] } = {}) {
  g.save(); g.translate(cx, cy);
  for (let i = 0; i < petals; i++) {
    const a = i / petals * Math.PI * 2 - Math.PI / 2; g.save(); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#d9dee6'); gr.addColorStop(0.6, '#f0f4f8'); gr.addColorStop(1, '#c9ced8');
    g.fillStyle = gr; g.beginPath(); g.moveTo(R * 0.2, 0); g.bezierCurveTo(R * 0.45, -R * 0.42, R * 1.02, -R * 0.3, R, 0); g.bezierCurveTo(R * 1.02, R * 0.3, R * 0.45, R * 0.42, R * 0.2, 0); g.fill();
    g.strokeStyle = 'rgba(41,98,255,.35)'; g.lineWidth = R * 0.012; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(R * 0.3, 0); g.quadraticCurveTo(R * 0.6, -R * 0.08 * k, R * 0.95, -R * 0.02 * k); g.stroke(); }
    g.restore();
  }
  const ir = R * 0.36; g.fillStyle = '#f0f4f8'; g.beginPath(); g.arc(0, 0, ir * 1.25, 0, Math.PI * 2); g.fill();
  const ix = look[0] * ir * 0.3, iy = look[1] * ir * 0.3;
  const gi = g.createRadialGradient(ix, iy, ir * 0.1, ix, iy, ir); gi.addColorStop(0, '#0a1a3a'); gi.addColorStop(0.35, iris); gi.addColorStop(0.85, '#0c2c66'); gi.addColorStop(1, '#06163a');
  g.fillStyle = gi; g.beginPath(); g.arc(ix, iy, ir, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#02040c'; g.beginPath(); g.arc(ix, iy, ir * 0.42, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(ix - ir * 0.3, iy - ir * 0.32, ir * 0.13, 0, Math.PI * 2); g.fill();
  if (lid > 0) { g.fillStyle = '#c9ced8'; g.beginPath(); g.ellipse(0, -ir * 1.25 + lid * ir * 1.25, ir * 1.3, ir * 1.25 * lid + 1, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

// ---------- world bookkeeping ----------
export const ROOMS = [];
const PORTALS = [], POCKETS = [], clickables = [], artMeshes = [];
const GLB = {};
const BLOB = canvasTex(128, 128, (q) => { const g = q.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(0.55, 'rgba(0,0,0,.26)'); g.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = g; q.fillRect(0, 0, 128, 128); });
const BLOB_M = new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 });
const BLOB_G = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
export const sound = new Sound();

// a pool of point lights, repositioned for whichever room is being drawn (so changing rooms never changes the number
// of lights, which would recompile every shader), and again for the room behind a portal while the portal draws
const LIGHTS = []; for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffffff, 0, 20, 1.7); scene.add(l); LIGHTS.push(l); }
const hemi = new THREE.HemisphereLight(0x8899bb, 0x221a12, 0.4); scene.add(hemi);
function applyLook(R, now = true) {
  scene.fog.color.set(R.fog ?? 0x02040c); scene.fog.density = R.fogD ?? 0.02; scene.background.set(R.sky ?? R.fog ?? 0x02040c);
  hemi.color.set(R.hemi?.[0] ?? 0x8899bb); hemi.groundColor.set(R.hemi?.[1] ?? 0x221a12); hemi.intensity = R.hemi?.[2] ?? 0.4;
  scene.environmentIntensity = R.env ?? 0.4;
  LIGHTS.forEach((l, k) => { const L = (R.lights || [])[k]; if (!L) { l.intensity = 0; l.userData.i = 0; return; } l.position.set(R.x0 + L[0], L[1], L[2]); l.color.set(L[3]); l.distance = L[5] || 20; l.userData.i = L[4]; if (now) l.intensity = L[4] * (L[6] ? L[6](CLOCK.t) : 1); });
}

// ---------- the room context: everything a room builder gets, in the room's own coordinates ----------
function roomCtx(R) {
  const g = R.group;
  const L = (x, z) => [x, z];
  const c = {
    THREE, R, g, MOBILE, REDUCED, EYE, FONT, SERIF, MONO, P, FX, sound, scene, camera, renderer, tex,
    surf, slab, sign, canvasTex, picture, eyeFlower,
    add(o) { g.add(o); return o; },
    wall(x1, z1, x2, z2) { const k = { x1, z1, x2, z2 }; R.colliders.push(k); return k; },
    post(x, z, r) { const k = { x, z, r }; R.colliders.push(k); return k; },
    // a solid block: the mesh, and a collider round its footprint (unless collide is false)
    box(w, h, d, mat, x, y, z, { rep, collide = true, ry = 0 } = {}) {
      const m = slab(w, h, d, mat, x, y, z, rep); m.rotation.y = ry; g.add(m);
      if (collide) { const cs = Math.cos(ry), sn = Math.sin(ry), hw = w / 2, hd = d / 2, pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => [x + a * cs + b * sn, z - a * sn + b * cs]);
        for (let i = 0; i < 4; i++) c.wall(pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1]); }
      return m;
    },
    tick(f) { R.ticks.push(f); },
    click(o, fn, hint) { clickable(o, fn, hint, R); },
    egg, toast, say, shake, flash: (v) => { FX.flash = v; },
    glb(name, o = {}) { return glb(R, name, o); },
    hang(p, x, y, z, ry, w, style, o) { return hang(R, p, x, y, z, ry, w, style, o?.parent, o); },
    // n pieces from this room's allotment, in order, never twice
    art(n = 1) { const out = []; while (out.length < n && R.artI < R.art.length) out.push(R.art[R.artI++]); return out; },
    plate(name, o) { return plate(R, name, o); },
    sticker(id, x, y, z, o) { return sticker(R, id, x, y, z, o); },
    stickers(ids, o) { return ids.map((id) => sticker(R, id, o.x(), o.y(), o.z(), o)); },
    STICK: window.STICKERS || {},
    portal(o) { return portal(R, o); },
    pocket(o) { return pocket(R, o); },
    door(o) { R.doors.push(o); return o; },
    light(x, y, z, color, i, dist, fn) { (R.lights ||= []).push([x, y, z, color, i, dist, fn]); },
    go: (id, at) => go(id, at),
    room: (id) => { const D = ROOMS[ROOM_ID[id]]; if (D) ensureBuilt(D); return D; },
    // where a portal into room id should land: that room's spawn, at eye height (every room keeps 1.5 m clear behind it)
    spawnOf: (id) => { const D = ROOMS[ROOM_ID[id]]; const s = D?.spawn || [0, 0, 0]; return [s[0], (D?.ground ? D.ground(s[0], s[1]) : 0) + EYE, s[1], s[2] || 0]; },
    wakeUp: () => { STATE.loops++; save(); },
    ride: (o) => ride(o),
    anamorph: (o) => anamorph(R, o),
    merge: (geos) => mergeGeometries(geos.map((g) => g.index ? g.toNonIndexed() : g)),
    group: R.group,
    world: (x, y, z) => new THREE.Vector3(R.x0 + x, y, z),
    blob(x, z, sx, sz) { const m = new THREE.Mesh(BLOB_G, BLOB_M); m.scale.set(sx, 1, sz || sx); m.position.set(x, 0.012, z); m.renderOrder = 1; g.add(m); return m; },
    state: R.state,
    loop: () => STATE.loops,
  };
  return c;
}

// ---------- clicks ----------
function clickable(obj, fn, hint, R) { obj.userData.click = fn; obj.userData.hint = hint; obj.userData.room = R?.i; obj.traverse((o) => { if (o.isMesh && !clickables.includes(o)) { o.userData.click = fn; o.userData.hint = hint; o.userData.room = R?.i; clickables.push(o); } }); }

// ---------- GLBs ----------
// Tripo and Poly Haven models arrive facing any which way; YAW turns each so its front is +Z (from ON LOCATION's sheets)
// anything that loads late (a plate, a model) inside a pocket must take the pocket's stencil test too
function sealUp(o) { for (let p = o; p; p = p.parent) if (p.userData.seal) { p.userData.seal(); return; } }
const H = Math.PI / 2;
export const YAW = { pigeon: Math.PI, cat: -H, rat: -H, hydrant: Math.PI, dog: Math.PI, gull: -H, h_subway_car: 0, pigeonlady: -H, cabbie: H, mlowtar: -H, boombox: -H, hotdog: -H, moai: -H, trex: Math.PI, bench: H, checker: -H, popcorn: -H, puft: -H, ape: -H, usher: -H, dancer: -H, clerk: -H, bookseller: -H, auggie: -H };
function glb(R, name, { h, len, x = 0, y = 0, z = 0, ry = 0, parent, onload, shadow = true, tint, emissive } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || R.group).add(g);
  const run = () => (GLB[name] ||= new Promise((res, rej) => gltfL.load(`assets/glb/${name}.glb`, (r) => res(r.scene), undefined, rej))).then((src) => {
    const o = src.clone(true), pv = new THREE.Group(); pv.add(o); pv.rotation.y = YAW[name] || 0; pv.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(pv), s = new THREE.Vector3(); b.getSize(s);
    const k = h ? h / s.y : len ? len / Math.max(s.x, s.z) : 1, ctr = new THREE.Vector3(); b.getCenter(ctr);
    const sc = new THREE.Group(); sc.add(pv); sc.scale.setScalar(k); sc.position.set(-ctr.x * k, -b.min.y * k, -ctr.z * k);
    o.traverse((m) => { if (m.isMesh && m.material) { m.material = m.material.clone(); m.material.envMapIntensity = 1.2; if (tint) m.material.color?.multiply(new THREE.Color(tint)); if (emissive) { m.material.emissive?.set(emissive[0]); m.material.emissiveIntensity = emissive[1]; } } });
    if (shadow && y < 0.4 && !parent) { const sh = new THREE.Mesh(BLOB_G, BLOB_M); sh.scale.set(Math.max(0.3, s.x * k * 1.25), 1, Math.max(0.3, s.z * k * 1.25)); sh.position.y = 0.012; sh.renderOrder = 1; g.add(sh); }
    g.add(sc); g.userData.ready = true; sealUp(g); g.userData.size = s.clone().multiplyScalar(k); if (g.userData.click) clickable(g, g.userData.click, g.userData.hint, R); onload && onload(g, sc);
  }).catch((e) => { console.warn('glb', name, e); });
  R.pending.push(run);
  return g;
}

// ---------- depth plates: a generated photograph rebuilt as geometry from its depth map (the MONA pass) ----------
// The plate's camera sits at the plate group's origin, EYE high, looking down -z. Everything nearer than zMin is pushed
// back to zMin, so a plate behind a window starts behind the glass.
const TAN_H = 0.75;
function plate(R, name, { x = 0, y = 0, z = 0, ry = 0, far = 60, zMin = 2, tint = 0xffffff, eye = EYE, tear = 2.6, zscale = 1, parent, fade = true, opacity = 1 } = {}) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; (parent || R.group).add(grp);
  R.pending.push(() => new Promise((done) => {
    const img = new Image(); img.src = `assets/depth/${name}.png`; loading.total++;
    img.onerror = () => { loading.done++; done(); };
    img.onload = () => {
      const cw = img.width, ch = img.height, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0); const px = cx.getImageData(0, 0, cw, ch).data;
      const dAt = (u, v) => px[(Math.min(ch - 1, Math.round(v * (ch - 1))) * cw + Math.min(cw - 1, Math.round(u * (cw - 1)))) * 4] / 255;
      const tanV = TAN_H * ch / cw, near = Math.max(zMin, eye / (0.96 * tanV));
      let dn = 0; for (let i = 0; i < 9; i++) dn += dAt(0.3 + i * 0.05, 0.98); dn /= 9;
      let dmin = 1; for (let i = 0; i < 500; i++) dmin = Math.min(dmin, dAt(Math.random(), Math.random() * 0.8));
      const a = (1 / near - 1 / far) / Math.max(0.05, dn - dmin), b = 1 / far - a * dmin;
      const NX = MOBILE ? 150 : 240, NY = Math.round(NX * ch / cw) + 1, pos = new Float32Array((NX + 1) * NY * 3), uvs = new Float32Array((NX + 1) * NY * 2), zz = new Float32Array((NX + 1) * NY);
      let k = 0;
      for (let j = 0; j < NY; j++) for (let i = 0; i <= NX; i++, k++) {
        const u = i / NX, v = j / (NY - 1), xx = u * 2 - 1, yy = 1 - v * 2;
        let zz0 = 1 / Math.max(1e-4, a * dAt(u, v) + b); zz0 = Math.min(far * 1.4, Math.max(zMin, zz0 * zscale));
        pos[k * 3] = xx * TAN_H * zz0; pos[k * 3 + 1] = eye + yy * tanV * zz0; pos[k * 3 + 2] = -zz0; zz[k] = zz0;
        uvs[k * 2] = u; uvs[k * 2 + 1] = 1 - v;
      }
      const idx = [];
      for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX; i++) {
        const p0 = j * (NX + 1) + i, q = p0 + NX + 1, zs = [zz[p0], zz[p0 + 1], zz[q], zz[q + 1]];
        if (Math.max(...zs) / Math.min(...zs) > tear) continue;
        idx.push(p0, q, p0 + 1, p0 + 1, q, q + 1);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(idx);
      geo.computeBoundingSphere();
      const map = tex.load(`assets/plates/${name}.jpg`); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
      const fadeT = fade ? canvasTex(256, 128, (q, w, h) => {
        const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, '#000'); gx.addColorStop(0.035, '#fff'); gx.addColorStop(0.965, '#fff'); gx.addColorStop(1, '#000');
        q.fillStyle = gx; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'multiply';
        const gy = q.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, '#000'); gy.addColorStop(0.05, '#fff'); gy.addColorStop(0.97, '#fff'); gy.addColorStop(1, '#000'); q.fillStyle = gy; q.fillRect(0, 0, w, h);
      }) : null;
      const mat = new THREE.MeshBasicMaterial({ map, alphaMap: fadeT, transparent: true, opacity, fog: false, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color(tint), depthWrite: true });
      const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = -1; grp.add(mesh); grp.userData.mesh = mesh; sealUp(grp);
      grp.userData.onMesh && grp.userData.onMesh(mesh);
      loading.done++; done();
    };
  }));
  return grp;
}

// ---------- the New Yorkers on the walls ----------
const FRAMES = {
  black: { c: 0x111111, m: 0.2, r: 0.5, d: 0.06, b: 0.06 },
  gilt: { c: 0xb8902e, m: 1, r: 0.3, d: 0.1, b: 0.13 },
  steel: { c: 0x8c9196, m: 1, r: 0.38, d: 0.05, b: 0.04 },
  copper: { c: 0xbe854c, m: 1, r: 0.35, d: 0.07, b: 0.07 },
  bone: { c: 0xf0f4f8, m: 0, r: 0.5, d: 0.07, b: 0.09 },
  cobalt: { c: 0x2962ff, m: 0.3, r: 0.4, d: 0.07, b: 0.07 },
  none: { c: 0x000000, m: 0, r: 1, d: 0.01, b: 0 },
};
// a soft additive pool of light behind a painting, as if a picture light were on it
const POOL_M = new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (q) => { const g = q.createRadialGradient(64, 40, 0, 64, 52, 70); g.addColorStop(0, 'rgba(255,214,160,.55)'); g.addColorStop(1, 'rgba(255,214,160,0)'); q.fillStyle = g; q.fillRect(0, 0, 128, 128); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
function hang(R, p, x, y, z, ry, w, style = 'black', parent, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || R.group).add(g);
  if (!p) return g;
  const f = FRAMES[style] || FRAMES.black;
  const fm = new THREE.MeshStandardMaterial({ color: f.c, metalness: f.m, roughness: f.r });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(1, 1, f.d), fm); fr.position.z = f.d / 2; if (f.b) g.add(fr);
  const mat = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.45 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); art.position.z = f.d + 0.002; g.add(art);
  const pl = sign(`${p.t}\nNo. ${p.n}  ${p.h || ''}`, { w: Math.min(0.9, w * 0.7), h: 0.15, bg: '#f2ead8', fg: '#1b1b1b', font: MONO, weight: 600, px: 96 });
  const fit = (asp) => { const hh = w / asp; art.scale.set(w, hh, 1); fr.scale.set(w + f.b * 2, hh + f.b * 2, 1); pl.position.y = -hh / 2 - f.b - 0.14; };
  R.pending.push(() => { const t = tex.load(`assets/art/${p.f}`, (tt) => fit(tt.image.width / tt.image.height)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; mat.map = mat.emissiveMap = t; mat.needsUpdate = true; });
  pl.position.set(0, -w * 9 / 32 - 0.2, 0.03); if (o.label !== false) g.add(pl);
  if (o.light) { const pool = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.6, w * 1.2), POOL_M); pool.position.set(0, w * 0.15, 0.004); pool.renderOrder = 1; g.add(pool); }
  fit(16 / 9);
  art.userData.piece = p; p.mesh = art; p.room = R;
  clickable(art, () => openPiece(p), p.t, R);
  artMeshes.push(art);
  g.userData.art = art; g.userData.fit = fit;
  return g;
}

// ---------- stickers: the 301 to 2300 packs, packed into atlases at build time (tools/stickers.py) ----------
// Each sticker is a slightly curled card of vinyl with a white die cut border already in the art. They cluster, overlap
// and peel. They never go over a painting (rooms place them; the engine just makes them look stuck on).
const STK_GEO = (() => { const g = new THREE.PlaneGeometry(1, 1, 6, 6), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (x * x + y * y) * 0.04 + (x > 0.3 && y > 0.3 ? (x - 0.3) * (y - 0.3) * 0.9 : 0)); } g.computeVertexNormals(); return g; })();
const STK_MAT = {};
function stickerMat(atlas) {
  if (STK_MAT[atlas]) return STK_MAT[atlas];
  const t = tex.load(`assets/stickers/${atlas}.png`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.45, roughness: 0.35, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18 });
  return (STK_MAT[atlas] = m);
}
function sticker(R, id, x, y, z, { ry = 0, rx = 0, size = 0.22, rot = (Math.random() - 0.5) * 0.7, parent } = {}) {
  const S = window.STICKERS?.[id]; if (!S) return null;
  const geo = STK_GEO.clone(), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, S.u + uv.getX(i) * S.w, S.v + uv.getY(i) * S.h);
  const m = new THREE.Mesh(geo, stickerMat(S.a)); m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.rotateZ(rot);
  const asp = S.aw / S.ah; m.scale.set(size * Math.min(1, asp), size * Math.min(1, 1 / asp), size);
  m.renderOrder = 2; (parent || R.group).add(m);
  m.userData.sticker = S;
  return m;
}

// ---------- anamorphosis: an image cut into fragments and scattered through the room along the rays from one spot ----------
// Each fragment lands on the first real surface its ray hits (a shelf, a can, the ceiling, the floor), turned to face the
// viewing spot and scaled by its distance, so it subtends exactly its share of the picture. From the spot: one image.
// From anywhere else: paper scraps stuck all over the shop. Fragments that would land on a painting are skipped.
function anamorph(R, { from, aim, image, texture, grid = [10, 10], spread = 0.7, size = 3.2, minD = 1.4, maxD = 9, onReady }) {
  R.pending.push(() => new Promise((done) => {
    const go = (t) => {
      R.group.updateMatrixWorld(true);
      const solids = []; R.group.traverse((o) => { if (o.isMesh && !o.userData.piece && !o.userData.sticker && !o.userData.noAnamorph && o.visible) solids.push(o); });
      const eye = new THREE.Vector3(R.x0 + from[0], from[1], from[2]), tgt = new THREE.Vector3(R.x0 + aim[0], aim[1], aim[2]);
      const fw = tgt.clone().sub(eye).normalize(), up0 = new THREE.Vector3(0, 1, 0), rt = new THREE.Vector3().crossVectors(fw, up0).normalize(), up = new THREE.Vector3().crossVectors(rt, fw);
      const ray = new THREE.Raycaster(); const [gx, gy] = grid; const D0 = eye.distanceTo(tgt);
      const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, toneMapped: false, fog: false });
      const frags = [];
      for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
        const u0 = i / gx, v0 = j / gy, cu = (i + 0.5) / gx - 0.5, cv = (j + 0.5) / gy - 0.5;
        const dir = fw.clone().multiplyScalar(D0).add(rt.clone().multiplyScalar(cu * size)).add(up.clone().multiplyScalar(cv * size)).normalize();
        ray.set(eye, dir); ray.far = maxD; const hit = ray.intersectObjects(solids, false).find((h) => h.distance > minD);
        // nothing to land on within reach: hang it in the air at a random depth, it reads as a mobile from elsewhere
        const d = hit ? hit.distance - 0.03 : minD + Math.random() * (maxD - minD) * spread;
        const sc = d / D0, geo = new THREE.PlaneGeometry(size / gx * sc * 1.04, size / gy * sc * 1.04), uv = geo.attributes.uv;
        for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / gx, v0 + uv.getY(k) / gy);
        const m = new THREE.Mesh(geo, mat); m.position.copy(eye).addScaledVector(dir, d).sub(new THREE.Vector3(R.x0, 0, 0));
        m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(rt, up, fw.clone().negate()));
        m.renderOrder = 3; m.userData.noAnamorph = true; R.group.add(m); frags.push(m);
      }
      onReady && onReady(frags); done();
    };
    if (texture) setTimeout(() => go(texture), 0);
    else { const t = tex.load(`assets/${image}`, () => go(t)); t.colorSpace = THREE.SRGBColorSpace; }
  }));
}

// ---------- render target portals ----------
// src: an Object3D in the room whose origin is the centre of the aperture and whose +z faces the visitor.
// to: the destination room id; at: [x, y, z, ry] in that room, the point you arrive at (y is the eye) facing -z rotated ry.
// k: how many destination metres one source metre is. A 3 cm pigeon eye opening onto a 2 m nave is k = 66.
// The material samples the target by screen position, so any shape works: a disc, a sphere, a box, a painting.
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const vcam = new THREE.PerspectiveCamera();
const BLACK_T = new THREE.DataTexture(new Uint8Array([2, 4, 12, 255]), 1, 1); BLACK_T.needsUpdate = true;
const PORTAL_VS = `varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const PORTAL_FS = `uniform sampler2D tMap; uniform vec2 uScreen; uniform float uGlass, uFade, uTime; uniform vec3 uRim; varying vec3 vN; varying vec3 vW;
  void main(){ vec2 uv = gl_FragCoord.xy / uScreen; vec3 c = texture2D(tMap, uv).rgb;
    vec3 V = normalize(cameraPosition - vW); float fr = pow(1. - abs(dot(V, normalize(vN))), 3.);
    c = mix(c, uRim, fr * uGlass) + fr * uGlass * 0.25; c *= uFade; gl_FragColor = vec4(c, 1.); }`;
function portal(R, { mesh, src, to, at, k = 1, ride = true, hint = 'Go in', res = 0.5, glass = 0, rim = 0x9fd8ff, maxDist = 30, onArrive, enter = 'ride', always = false, dur = 2.4, clip = 0.05, recurse = 0, clipPlane = null }) {
  const P0 = { R, mesh, src, to, at, k, res, maxDist, onArrive, enter, always, dur, clip, recurse, clipPlane, ride, rtA: mkRT(), rtB: mkRT(), sized: false, frame: 0, score: 0, last: -1 };
  mesh.material = new THREE.ShaderMaterial({ uniforms: { tMap: { value: P0.rtA.texture }, uScreen: SCREEN, uGlass: { value: glass }, uFade: { value: 1 }, uRim: { value: new THREE.Color(rim) }, uTime: { value: 0 } }, vertexShader: PORTAL_VS, fragmentShader: PORTAL_FS, toneMapped: false, fog: false });
  mesh.userData.portal = P0; mesh.userData.noAnamorph = true;
  if (ride) clickable(mesh, () => enterPortal(P0), hint, R);
  PORTALS.push(P0);
  return P0;
}
function portalCamera(P0, cam, out) {
  // M = dst * scale(k) * src^-1, decomposed so the virtual camera has no scale: the scale goes into near and far
  const D = ROOMS[ROOM_ID[P0.to]]; if (!D) return null;
  P0.src.updateMatrixWorld(true);
  const dst = _m.compose(_v.set(D.x0 + P0.at[0], P0.at[1], P0.at[2]), _q.setFromEuler(new THREE.Euler(0, P0.at[3] || 0, 0)), _s.set(1, 1, 1));
  _m2.copy(P0.src.matrixWorld).invert();
  const M = new THREE.Matrix4().multiplyMatrices(dst, new THREE.Matrix4().makeScale(P0.k, P0.k, P0.k)).multiply(_m2);
  const W = new THREE.Matrix4().multiplyMatrices(M, cam.matrixWorld); W.decompose(out.position, out.quaternion, _s);
  out.fov = cam.fov; out.aspect = cam.aspect; out.near = Math.max(0.01, cam.near * P0.k); out.far = cam.far * Math.max(1, P0.k); out.updateProjectionMatrix(); out.updateMatrixWorld(true);
  const n = new THREE.Vector3(0, 0, -1).applyQuaternion(_q.setFromEuler(new THREE.Euler(0, P0.at[3] || 0, 0)));
  const at = new THREE.Vector3(D.x0 + P0.at[0], P0.at[1], P0.at[2]);
  // keep only what lies beyond the arrival plane (a hair behind it, so the floor you land on is there)
  out.userData.clip = P0.clipPlane ? new THREE.Plane(new THREE.Vector3(P0.clipPlane[0], P0.clipPlane[1], P0.clipPlane[2]), P0.clipPlane[3] - P0.clipPlane[0] * D.x0) : new THREE.Plane(n, -n.dot(at) + P0.clip);
  out.userData.room = D; out.userData.M = M;
  return out;
}
const _frus = new THREE.Frustum(), _sph = new THREE.Sphere(), _pm = new THREE.Matrix4();
function updatePortals(R) {
  // which portals can be seen from here, and how much of the screen each one covers
  _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _frus.setFromProjectionMatrix(_pm);
  const cands = [];
  for (const P0 of PORTALS) {
    if (P0.R !== R && !P0.always) continue;
    const m = P0.mesh; if (!m.visible || !m.parent?.visible) continue;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    _sph.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
    const d = _sph.center.distanceTo(camera.position); if (d > P0.maxDist + _sph.radius) continue;
    if (!_frus.intersectsSphere(_sph)) continue;
    P0.score = _sph.radius / Math.max(0.02, d - _sph.radius * 0.5);
    cands.push(P0);
  }
  cands.sort((a, b) => b.score - a.score);
  const budget = MOBILE ? 1 : 2, w = rt.width, h = rt.height;
  // the biggest every frame, the rest take turns
  // the biggest every frame; the rest by turns, whichever has waited longest goes next, so a shelf of globes all stay live
  const rest = cands.slice(1).sort((a, b) => a.last - b.last);
  const pick = cands.slice(0, 1).concat(rest).slice(0, budget);
  for (const P0 of pick) {
    const s = P0.score > 0.6 || P0 === RIDING ? (MOBILE ? 0.6 : 0.85) : P0.res;
    const pw = Math.max(64, Math.round(w * s)), ph = Math.max(64, Math.round(h * s));
    if (P0.rtA.width !== pw || P0.rtA.height !== ph) { P0.rtA.setSize(pw, ph); P0.rtB.setSize(pw, ph); }
    if (!portalCamera(P0, camera, vcam)) continue;
    const D = vcam.userData.room;
    if (MOBILE && !P0.ride && !D.built) continue;
    for (const r of ROOMS) if (r.group) r.group.visible = r === D;
    applyLook(D); ensureBuilt(D);
    renderer.clippingPlanes = [vcam.userData.clip];
    const prevScreen = SCREEN.value.clone();
    const U = P0.mesh.material.uniforms;
    if (P0.recurse) {
      // a portal that opens onto a room containing itself: render the levels deepest first, each one showing the
      // next deeper through its own aperture. Screen space feedback cannot do this for a portal that translates.
      const n = MOBILE ? Math.min(2, P0.recurse) : P0.recurse;
      P0.levels ||= []; P0.cams ||= [];
      for (let d = 0; d < n; d++) { if (!P0.levels[d]) P0.levels[d] = mkRT(); if (!P0.cams[d]) P0.cams[d] = new THREE.PerspectiveCamera(); }
      portalCamera(P0, camera, P0.cams[0]);
      for (let d = 1; d < n; d++) portalCamera(P0, P0.cams[d - 1], P0.cams[d]);
      U.tMap.value = BLACK_T;
      for (let d = n - 1; d >= 0; d--) {
        const k = Math.pow(0.72, d), lw = Math.max(64, Math.round(pw * k)), lh = Math.max(64, Math.round(ph * k)), T = P0.levels[d];
        if (T.width !== lw || T.height !== lh) T.setSize(lw, lh);
        SCREEN.value.set(lw, lh); renderer.setRenderTarget(T); renderer.clear(); renderer.render(scene, P0.cams[d]);
        U.tMap.value = T.texture;
      }
      SCREEN.value.copy(prevScreen);
    } else {
      SCREEN.value.set(pw, ph);
      renderer.setRenderTarget(P0.rtB); renderer.clear(); renderer.render(scene, vcam);
      SCREEN.value.copy(prevScreen);
      // ping-pong: the material now shows what was just drawn, the next draw goes into the other one
      const t = P0.rtA; P0.rtA = P0.rtB; P0.rtB = t; U.tMap.value = P0.rtA.texture;
    }
    renderer.clippingPlanes = [];
    P0.last = FRAME;
  }
  for (const r of ROOMS) if (r.group) r.group.visible = r === R;
  applyLook(R);
}

// ---------- stencil pockets: glass that is bigger on the inside ----------
// mask: a mesh in the room (the pane). build(group): fills a group placed at the pane, in the pane's own frame, with
// whatever is behind it (a depth plate, an aisle, a sea). Draw order: the pane marks the stencil, then pushes depth to
// the far plane where it is visible, then the pocket draws only inside the mark, then the glass sheen on top.
let POCKET_N = 1;
const FAR_VS = 'void main(){ vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); p.z = p.w * 0.99999; gl_Position = p; }';
function pocket(R, { mask, build, sheen = 0.18 }) {
  const ref = POCKET_N++; if (ref > 250) return null;
  const base = 100 + ref * 4;
  const mk = mask.material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true });
  Object.assign(mk, { stencilWrite: true, stencilRef: ref, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp });
  mask.renderOrder = base;
  const far = new THREE.Mesh(mask.geometry, new THREE.ShaderMaterial({ vertexShader: FAR_VS, fragmentShader: 'void main(){ gl_FragColor = vec4(0.); }', colorWrite: false, depthWrite: true, depthFunc: THREE.AlwaysDepth, transparent: true }));
  Object.assign(far.material, { stencilWrite: true, stencilRef: ref, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp });
  far.renderOrder = base + 1; far.frustumCulled = false; mask.add(far);
  // the pocket's contents live in room coordinates, wherever the room puts them (usually just behind the glass)
  const grp = new THREE.Group(); R.group.add(grp);
  const seal = () => grp.traverse((o) => { if (!o.isMesh) return; o.renderOrder = base + 2; for (const m of [].concat(o.material)) Object.assign(m, { stencilWrite: true, stencilRef: ref, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp, transparent: true, stencilFail: THREE.KeepStencilOp }); });
  grp.userData.seal = seal;
  build(grp, seal);
  seal();
  // the glass itself, a faint sheen, last
  if (sheen) { const gl = new THREE.Mesh(mask.geometry, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: sheen, roughness: 0.05, metalness: 0, envMapIntensity: 1.5, depthWrite: false })); gl.renderOrder = base + 3; mask.add(gl); }
  const P0 = { R, mask, grp, ref, seal }; POCKETS.push(P0);
  return P0;
}

// ---------- the player ----------
export const P = { x: 0, y: EYE, z: 0, yaw: 0, pitch: 0, roll: 0, bob: 0, lift: 0, speed: 1, fov: FOV, ride: null, up: null };
export const STATE = (() => { try { return JSON.parse(localStorage.getItem('pigeonhole.v1') || '{}'); } catch (e) { return {}; } })();
STATE.loops ||= 0; STATE.eggs ||= [];
function save() { try { localStorage.setItem('pigeonhole.v1', JSON.stringify(STATE)); } catch (e) {} }
const CLOCK = { t: 0 };
let FRAME = 0, RIDING = null;
const ROOM_ID = {};
let cur = -1, started = false;
export function addRoom(def) {
  const R = { ...def, i: ROOMS.length, built: false, colliders: [], ticks: [], doors: [], pending: [], artI: 0, art: (window.CAST || {})[def.id] || [], state: {} };
  R.x0 = R.i * GAP; R.group = new THREE.Group(); R.group.position.x = R.x0; R.group.visible = false; scene.add(R.group);
  ROOM_ID[R.id] = R.i; ROOMS.push(R); return R;
}
function ensureBuilt(R) {
  if (R.built) return; R.built = true;
  try { R.build(roomCtx(R)); } catch (e) { console.error('room ' + R.id, e); }
  for (const f of R.pending.splice(0)) f();
}
// build the room you are in and every room its portals open onto, so nothing pops when you look through
function near(R) {
  ensureBuilt(R);
  // portals you can ride (and, on a computer, every portal) have their room built now; on a phone a decorative portal
  // onto an unbuilt room stays dark rather than hold a whole other room in memory
  for (const P0 of PORTALS) if (P0.R === R && (P0.ride || !MOBILE)) ensureBuilt(ROOMS[ROOM_ID[P0.to]]);
  if (R.next) ensureBuilt(ROOMS[ROOM_ID[R.next]]);
}

export function go(id, at) {
  const R = ROOMS[ROOM_ID[id] ?? id]; if (!R) return;
  ensureBuilt(R);
  const s = at || R.spawn || [0, 0, 0];
  P.x = R.x0 + s[0]; P.z = s[1]; P.yaw = s[2] || 0; P.pitch = s[3] || 0; P.y = (R.ground ? R.ground(s[0], s[1]) : 0) + EYE; P.up = null; P.roll = 0;
  enter(R.i);
}
function enter(i) {
  const R = ROOMS[i]; const was = ROOMS[cur]; cur = i; R.enteredAt = performance.now();
  near(R);
  for (const r of ROOMS) r.group.visible = r === R;
  applyLook(R);
  was && was.onLeave && was.onLeave();
  [...$('#rooms').children].forEach((b, j) => b.classList.toggle('on', j === i));
  $('#rname').textContent = R.name; $('#rk').textContent = R.kicker; $('#rscale').textContent = R.scale || '';
  $('#setsn').textContent = `${i + 1} / ${ROOMS.length}`;
  sound.room(R.sound);
  R.onEnter && R.onEnter(roomCtx(R));
  if (!STATE.seen) STATE.seen = {}; STATE.seen[R.id] = 1; save();
}

// a scripted camera move: to a point and a heading, with letterbox bars, input waits; near plane shrinks as you go
function ride({ to, yaw, pitch = 0, dur = 2.4, onEnd, through = false }) {
  P.ride = { from: new THREE.Vector3(P.x, P.y, P.z), to: to.clone(), y0: P.yaw, y1: yaw, p0: P.pitch, p1: pitch, t0: CLOCK.real, dur, onEnd, through };
  $('#bars').classList.add('on');
}
function enterPortal(P0) {
  if (P.ride) return;
  P0.src.updateMatrixWorld(true);
  const aw = new THREE.Vector3().setFromMatrixPosition(P0.src.matrixWorld);
  const fwd = new THREE.Vector3(0, 0, 1).transformDirection(P0.src.matrixWorld);   // out of the aperture, toward you
  const yaw = Math.atan2(fwd.x, fwd.z), pitch = -Math.asin(Math.max(-1, Math.min(1, fwd.y)));
  RIDING = P0;
  sound.whoosh();
  // first a stop a little way out on the axis, then through the aperture itself
  const r = P0.mesh.geometry.boundingSphere?.radius || 0.3;
  const stand = aw.clone().addScaledVector(fwd, Math.max(0.6, r * 3));
  ride({ to: stand, yaw, pitch, dur: P0.dur * 0.55, onEnd: () => {
    ride({ to: aw.clone().addScaledVector(fwd, Math.min(0.004, r * 0.05)), yaw, pitch, dur: P0.dur * 0.45, through: true, onEnd: () => {
      // now the virtual camera IS where you are going: take its place
      portalCamera(P0, camera, vcam);
      const D = vcam.userData.room;
      ensureBuilt(D);
      P.x = vcam.position.x; P.z = vcam.position.z; P.y = vcam.position.y;
      const e = new THREE.Euler().setFromQuaternion(vcam.quaternion, 'YXZ'); P.yaw = e.y; P.pitch = e.x;
      RIDING = null; enter(D.i);
      // and settle onto the floor at the arrival point
      const a = P0.at; P.settle = { x: D.x0 + a[0], z: a[2], y: (D.ground ? D.ground(a[0], a[2]) : 0) + EYE, t: 0 };
      P0.onArrive && P0.onArrive(roomCtx(D));
      FX.wake = 0.0;
    } });
  } });
}

// ---------- input ----------
const keys = {};
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.target.closest?.('input,textarea')) return;
  keys[e.code] = true;
  if (!started) return;
  if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); interact(); }
  if (e.code === 'KeyM') { sound.toggle(); }
  if (e.code === 'Escape') { closePiece(); $('#index').classList.remove('on'); }
  if (e.code === 'BracketRight') go(Math.min(ROOMS.length - 1, cur + 1));
  if (e.code === 'BracketLeft') go(Math.max(0, cur - 1));
  if (/^Digit[0-9]$/.test(e.code)) { const n = +e.code.slice(5); go((n === 0 ? 9 : n - 1) + (e.shiftKey ? 10 : 0)); }
  if (e.code === 'KeyI') toggleIndex();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const cnv = renderer.domElement;
let locked = false;
const lock = () => { try { const p = cnv.requestPointerLock?.(); p && p.catch && p.catch(() => {}); } catch (e) {} };
cnv.addEventListener('click', (e) => { if (!started) return; if (!MOBILE && !locked && !Q.has('nolock')) { lock(); return; } interact(locked ? null : e); });
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cnv; $('#hud').classList.toggle('locked', locked); });
addEventListener('mousemove', (e) => { if (!locked || P.ride) return; P.yaw -= e.movementX * 0.0022; P.pitch = Math.max(-1.35, Math.min(1.35, P.pitch - e.movementY * 0.0022)); });
const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0 }, look = { id: null, x: 0, y: 0, t: 0, moved: 0 };
cnv.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) { if (t.clientX < innerWidth * 0.42 && stick.id === null) { Object.assign(stick, { id: t.identifier, x: t.clientX, y: t.clientY, dx: 0, dy: 0 }); $('#stick').style.cssText = `display:block;left:${t.clientX - 50}px;top:${t.clientY - 50}px`; } else if (look.id === null) Object.assign(look, { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now(), moved: 0 }); } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.dx = Math.max(-1, Math.min(1, (t.clientX - stick.x) / 50)); stick.dy = Math.max(-1, Math.min(1, (t.clientY - stick.y) / 50)); $('#knob').style.transform = `translate(${stick.dx * 30}px,${stick.dy * 30}px)`; } if (t.identifier === look.id) { const dx = t.clientX - look.x, dy = t.clientY - look.y; look.moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.005; P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch - dy * 0.004)); look.x = t.clientX; look.y = t.clientY; } } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.id = null; stick.dx = stick.dy = 0; $('#stick').style.display = 'none'; $('#knob').style.transform = ''; } if (t.identifier === look.id) { if (look.moved < 12 && performance.now() - look.t < 350) interact({ clientX: t.clientX, clientY: t.clientY }); look.id = null; } } });
// a drag with the mouse looks round too, for anyone who will not take the pointer lock
{ let drag = null; cnv.addEventListener('mousedown', (e) => { if (!locked && started) drag = { x: e.clientX, y: e.clientY, m: 0 }; }); addEventListener('mouseup', () => { drag = null; });
  addEventListener('mousemove', (e) => { if (!drag || locked || P.ride) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; P.yaw -= dx * 0.004; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - dy * 0.003)); }); }

function collide(R, nx, nz) {
  const RR = 0.3;
  for (const c of R.colliders) {
    if (c.off) continue;
    if (c.r !== undefined) { const dx = nx - c.x, dz = nz - c.z, d = Math.hypot(dx, dz), m = c.r + RR; if (d < m && d > 1e-6) { nx = c.x + dx / d * m; nz = c.z + dz / d * m; } continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez || 1e-9; let t = ((nx - c.x1) * ex + (nz - c.z1) * ez) / L2; t = Math.max(0, Math.min(1, t));
    const px = c.x1 + ex * t, pz = c.z1 + ez * t, dx = nx - px, dz = nz - pz, d = Math.hypot(dx, dz);
    if (d < RR && d > 1e-6) { nx = px + dx / d * RR; nz = pz + dz / d * RR; }
  }
  return [nx, nz];
}

const ray = new THREE.Raycaster(); ray.far = 9;
function pick(e) {
  const v = e ? new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1) : new THREE.Vector2(0, 0);
  ray.setFromCamera(v, camera);
  const hit = ray.intersectObjects(clickables.filter((o) => o.userData.room === cur && o.visible), false)[0];
  return hit && hit.object;
}
function interact(e) { if ($('#card').classList.contains('on') || P.ride) return; const o = pick(e); if (o && o.userData.click) { sound.click(); o.userData.click(o); } }

// ---------- HUD ----------
let tt; export function toast(s, ms = 3200) { const el = $('#toast'); el.textContent = s; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), ms); }
const EGGS = new Set(STATE.eggs);
export function egg(id, line) {
  if (!EGGS.has(id)) { EGGS.add(id); STATE.eggs = [...EGGS]; save(); $('#eggs').textContent = `${EGGS.size} / ${window.EGG_N || 0}`; $('#eggbox').classList.add('pop'); setTimeout(() => $('#eggbox').classList.remove('pop'), 600); sound.ding(); }
  if (line) toast(line, 4200);
}
const bubbles = [];
function say(anchor, text, ms = 3400, dy = 0.4) { const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; $('#bubbles').appendChild(el); bubbles.push({ anchor, el, until: performance.now() + ms, dy }); }
let shakeAmt = 0; function shake(a) { shakeAmt = Math.max(shakeAmt, a); }
function openPiece(p) {
  const c = $('#card'); c.classList.add('on'); if (locked) document.exitPointerLock();
  $('#c-t').textContent = p.t; $('#c-no').textContent = `No. ${p.n}`;
  $('#c-p').textContent = [[p.h, p.b].filter(Boolean).join(', '), p.s].filter(Boolean).join('  ·  ');
  $('#c-k').textContent = `${(ROOMS[cur]?.scale || '').toUpperCase()} · ${(ROOMS[cur]?.name || '').toUpperCase()}`;
  $('#c-a').href = `https://n3wyorkers.com/n/${p.n}`; $('#c-img').src = `assets/art/${p.f}`;
}
function closePiece() { $('#card').classList.remove('on'); }
$('#c-x').onclick = closePiece; $('#card').addEventListener('click', (e) => { if (e.target.id === 'card') closePiece(); });
const fwd = new THREE.Vector3(), _w = new THREE.Vector3(); let peekP = null;
function peek() {
  camera.getWorldDirection(fwd); let best = null, bs = 1e9;
  for (const a of artMeshes) {
    if (a.userData.piece.room !== ROOMS[cur]) continue;
    a.getWorldPosition(_w); const d = _w.distanceTo(camera.position); if (d > 5) continue;
    const dot = _w.sub(camera.position).normalize().dot(fwd); if (dot < 0.86) continue;
    const s = d * (1.6 - dot); if (s < bs) { bs = s; best = a; }
  }
  if (best === peekP) return; peekP = best;
  if (best) { const p = best.userData.piece; $('#peek').textContent = `${p.t}  ·  No. ${p.n}${p.h ? '  ·  ' + p.h : ''}`; $('#peek').classList.add('on'); } else $('#peek').classList.remove('on');
}
// the index: every piece in the exhibition as a plain list, the way in for anyone who cannot or will not walk
function toggleIndex() {
  const el = $('#index'); const on = !el.classList.contains('on'); el.classList.toggle('on', on); if (on && locked) document.exitPointerLock();
  if (on && !el.dataset.built) { el.dataset.built = 1; const list = $('#ilist');
    list.innerHTML = ROOMS.map((R) => `<section><h4><i>${R.i + 1}</i> ${R.name}<small>${R.scale || ''}</small></h4><div>${R.art.map((p) => `<a href="https://n3wyorkers.com/n/${p.n}" target="_top"><img loading="lazy" src="assets/art/${p.f}" alt=""><b>${p.t}</b><small>No. ${p.n}${p.h ? ' · ' + p.h : ''}</small></a>`).join('')}</div><button data-go="${R.id}">Go to this room</button></section>`).join('');
    list.querySelectorAll('button[data-go]').forEach((b) => b.onclick = () => { el.classList.remove('on'); go(b.dataset.go); }); }
}
$('#indexbtn').onclick = (e) => { e.stopPropagation(); toggleIndex(); }; $('#ix').onclick = () => $('#index').classList.remove('on');

// ---------- power ----------
// at most 60 frames a second, 30 after twenty seconds untouched (a ride counts as touching), about six in a window that
// is not in front. Everything that moves runs on dt. See HANDOFF_POWER_2026-10-12.md in the site repo.
const POWER = { last: performance.now(), drawn: 0, blurred: !document.hasFocus() };
const touched = () => { POWER.last = performance.now(); };
for (const ev of ['keydown', 'mousemove', 'mousedown', 'touchstart', 'touchmove', 'wheel']) addEventListener(ev, touched, { passive: true });
addEventListener('blur', () => { POWER.blurred = true; }); addEventListener('focus', () => { POWER.blurred = false; touched(); });
const budgetMs = () => POWER.blurred ? 160 : (P.ride || performance.now() - POWER.last < 20000) ? 15.5 : 32;

// ---------- the loop ----------
const clock = new THREE.Clock();
function frame() {
  const nowMs = performance.now(); if (nowMs - POWER.drawn < budgetMs()) { requestAnimationFrame(frame); return; } POWER.drawn = nowMs; FRAME++;
  const dt = Math.min(0.05, clock.getDelta()); CLOCK.t += dt; CLOCK.real = clock.elapsedTime; const t = CLOCK.t;
  const R = ROOMS[cur];
  let f = 0, s = 0; if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyA) s -= 1; if (keys.KeyD) s += 1;
  if (keys.ArrowLeft) P.yaw += dt * 1.9; if (keys.ArrowRight) P.yaw -= dt * 1.9;
  f -= stick.dy; s += stick.dx;
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6 : 3.3) * dt * P.speed * (R.speed || 1), len = Math.hypot(f, s);
  if (P.ride) {
    const u = Math.min(1, (clock.elapsedTime - P.ride.t0) / P.ride.dur), e = u * u * (3 - 2 * u), r = P.ride;
    const p = r.from.clone().lerp(r.to, e); P.x = p.x; P.y = p.y; P.z = p.z;
    let dy = r.y1 - r.y0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw = r.y0 + dy * Math.min(1, e * 1.6); P.pitch = r.p0 + (r.p1 - r.p0) * Math.min(1, e * 1.6);
    camera.near = r.through ? Math.max(0.0005, 0.04 * (1 - e)) : 0.04; camera.updateProjectionMatrix();
    if (u >= 1) { const fn = r.onEnd; P.ride = null; camera.near = 0.04; camera.updateProjectionMatrix(); $('#bars').classList.remove('on'); fn && fn(); }
  } else if (len > 0.01 && started && !$('#card').classList.contains('on')) {
    const k = Math.min(1, len) / len; f *= k; s *= k;
    let nx = P.x - R.x0 + (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) * sp, nz = P.z + (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) * sp;
    if (R.move) [nx, nz] = R.move(P, nx, nz, dt);   // a room may bend the walk: the infinite car, the stairs
    [nx, nz] = collide(R, nx, nz); P.x = R.x0 + nx; P.z = nz; P.bob += sp * 2.4;
  }
  if (P.settle) { const S = P.settle; S.t = Math.min(1, S.t + dt * 1.2); const e = S.t * S.t * (3 - 2 * S.t); P.x += (S.x - P.x) * e * 0.2; P.z += (S.z - P.z) * e * 0.2; P.y += (S.y - P.y) * e * 0.2; if (S.t >= 1) P.settle = null; }
  else if (!P.ride) { const lx = P.x - R.x0, gy = (R.ground ? R.ground(lx, P.z) : 0) + EYE * (R.eyeK || 1) + P.lift; P.y += (gy - P.y) * Math.min(1, dt * 12); }
  // doors: a trigger in the floor takes you to another room
  if (!P.ride && started) for (const d of R.doors) { if (d.off) continue; const lx = P.x - R.x0; if (Math.hypot(lx - d.x, P.z - d.z) < (d.r || 0.8)) { d.fn ? d.fn() : go(d.to, d.at); break; } }
  const lc = { x: P.x - R.x0, z: P.z, y: P.y };
  for (const fn of R.ticks) fn(t, dt, lc);
  for (const p of PORTALS) p.mesh.material.uniforms.uTime.value = t;
  // camera
  camera.rotation.set(P.pitch, P.yaw, P.roll || 0);
  camera.position.set(P.x + (Math.random() - 0.5) * shakeAmt, P.y + Math.sin(P.bob) * 0.03 + (Math.random() - 0.5) * shakeAmt, P.z + (Math.random() - 0.5) * shakeAmt);
  if (P.up) camera.up.copy(P.up);
  shakeAmt *= 0.9;
  const fovT = R.fov ? R.fov(lc) : FOV; P.fov += (fovT - P.fov) * Math.min(1, dt * 3); if (Math.abs(camera.fov - P.fov) > 0.01) { camera.fov = P.fov; camera.updateProjectionMatrix(); }
  if (R.camera) R.camera(camera, lc, t);
  camera.updateMatrixWorld(true);
  for (const l of LIGHTS) { const L = (R.lights || [])[LIGHTS.indexOf(l)]; l.intensity = L ? L[4] * (L[6] ? L[6](t) : 1) : 0; }
  if (FRAME % 8 === 0) peek();
  if (locked || MOBILE) { const o = pick(null); $('#cross').classList.toggle('hot', !!o); $('#hint').textContent = o ? (o.userData.hint || '') : ''; }
  const now = performance.now();
  for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; } b.anchor.getWorldPosition(_w); _w.y += b.dy; _w.project(camera); const on = _w.z < 1 && Math.abs(_w.x) < 1.1; b.el.style.display = on ? 'block' : 'none'; b.el.style.transform = `translate(${(_w.x * 0.5 + 0.5) * innerWidth}px,${(-_w.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
  // portals first (they draw other rooms into their targets), then the room
  updatePortals(R);
  // the screen pass eases to the room's look
  const pp = R.post || {}, e = Math.min(1, dt * 2);
  POST.sat += ((FX.sat ?? pp.sat ?? 1) - POST.sat) * e; POST.dream += ((FX.dream ?? pp.dream ?? 0) - POST.dream) * e; POST.warp += (FX.warp - POST.warp) * e; POST.grain += ((pp.grain ?? 0.12) - POST.grain) * e;
  FX.wake += ((RIDING && P.ride?.through ? 0.0 : 0) - FX.wake) * Math.min(1, dt * 3);
  const U = postMat.uniforms; U.uSat.value = POST.sat; U.uDream.value = REDUCED ? 0 : POST.dream; U.uWarp.value = REDUCED ? 0 : POST.warp; U.uGrain.value = LITE ? 0 : POST.grain; U.uTime.value = t; U.uWake.value = FX.wake;
  const bl = LITE ? 0 : pp.bloom ?? (MOBILE ? 0.5 : 0.8);
  U.uBloom.value = bl; U.uVig.value = LITE ? 0 : pp.vig ?? 0.45; U.uCA.value = LITE || MOBILE ? 0 : pp.ca ?? 0.003;
  if (pp.tint) U.uTint.value.set(pp.tint); else U.uTint.value.setRGB(1, 1, 1);
  $('#flash').style.opacity = (FX.flash || 0) > 0.02 ? FX.flash.toFixed(2) : 0; FX.flash = (FX.flash || 0) * 0.86;
  SCREEN.value.set(rt.width, rt.height);
  renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
  if (bl > 0) {
    postQuad.material = brightMat; renderer.setRenderTarget(bloomA); renderer.render(postScene, postCam);
    postQuad.material = blurMat; const [px, py] = blurMat.userData.px;
    for (const k of [1, 2.2]) {
      blurMat.uniforms.tIn.value = bloomA.texture; blurMat.uniforms.uDir.value.set(px * k, 0); renderer.setRenderTarget(bloomB); renderer.render(postScene, postCam);
      blurMat.uniforms.tIn.value = bloomB.texture; blurMat.uniforms.uDir.value.set(0, py * k); renderer.setRenderTarget(bloomA); renderer.render(postScene, postCam);
    }
    postQuad.material = postMat;
  }
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  requestAnimationFrame(frame);
}
cnv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toast('The graphics memory ran out. Tap to reload this room.', 600000); $('#toast').style.pointerEvents = 'auto'; $('#toast').onclick = () => { location.search = '?room=' + (ROOMS[cur]?.id || ''); }; });

// ---------- start ----------
export function start(firstId) {
  $('#stage').appendChild(cnv);
  addEventListener('resize', resize); resize();
  const nav = $('#rooms');
  ROOMS.forEach((r, i) => { const b = document.createElement('button'); b.innerHTML = `<i>${i + 1}</i><span>${r.name}<small>${r.scale || ''}</small></span>`; b.onclick = (e) => { e.stopPropagation(); go(r.id); nav.classList.remove('open'); }; nav.appendChild(b); });
  $('#setsbtn').onclick = (e) => { e.stopPropagation(); nav.classList.toggle('open'); };
  $('#eggs').textContent = `${EGGS.size} / ${window.EGG_N || 0}`;
  const qr = Q.get('room'), R0 = ROOMS[ROOM_ID[qr] ?? ROOM_ID[firstId] ?? 0];
  go(R0.id);
  if (Q.get('cam')) { const [x, y, z, yaw, pitch] = Q.get('cam').split(',').map(Number); P.x = R0.x0 + x; P.y = y; P.z = z; P.yaw = yaw || 0; P.pitch = pitch || 0; P.lift = y - EYE; }
  const ready = () => { $('#go').disabled = false; $('#go').textContent = STATE.loops ? `Fall asleep again (loop ${STATE.loops + 1})` : 'Fall asleep'; };
  mgr.onLoad = ready; setTimeout(ready, 12000);
  $('#go').onclick = () => { started = true; $('#intro').classList.add('off'); sound.start(); if (!MOBILE && !Q.has('nolock')) lock(); toast(MOBILE ? 'Left thumb walks. Right thumb looks. Tap anything.' : 'WASD to walk, mouse to look, click anything. I for the index. [ and ] change rooms.', 5200); };
  $('#snd').onclick = (e) => { e.stopPropagation(); sound.toggle(); $('#snd').textContent = sound.on ? 'SOUND ON' : 'SOUND OFF'; };
  if (Q.has('auto')) { started = true; $('#intro').classList.add('off'); }
  if (Q.has('clean')) document.body.classList.add('clean');   // stills for the site page: no HUD
  window.pigeonhole = { go, P, ROOMS, camera, renderer, scene, PORTALS, POCKETS, enterPortal, STATE, ready: () => loading.done >= loading.total, frame: () => FRAME };
  requestAnimationFrame(frame);
}
export function loops() { return STATE.loops; }
export function wakeUp() { STATE.loops++; save(); }
