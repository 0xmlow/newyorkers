/* MLOW SPEAKS. The fortune booth from ON LOCATION (Tripo GLB, one mesh, no bones) made into a Zoltar you
 * can feed a token, talk to, and walk away from with a printed ticket.
 *
 * What is built around the GLB, in order of what you see:
 *   the crown     the baked "MLOWTAR SPEARS" plate is cut away in the fragment shader (model y > 0.862) and a
 *                 real arched sign is built in its place: extruded arch, red enamel face painted on a canvas
 *                 (Fraunces lettering, MLOW SPEAKS), gold bevel, chase bulbs along the arch
 *   the material  the Tripo texture is sharpened in the shader, gold texels become brass (metalness and
 *                 roughness from hue), red texels become paint, a real glass pane with transmission sits in
 *                 the window, the floor is the site's glazed tile and the wall its brick
 *   the rig       procedural, in the vertex shader: the interior volume (|x|<.135 |z|<.155 .30<y<.86 in
 *                 model space) is the figure and the crystal; it breathes, follows the pointer, leans in
 *                 when consulted, nods while it speaks; the crystal swells and glows
 *   the machine   hotspots by raycast: the coin slot takes a brass token (click it, or ASK drops one), the
 *                 glass wakes the eye, the printed ticket opens big; the ticket (ticket.js) prints out of the
 *                 card slot with a stutter and hovers beside the booth; the booth speaks the fortune with
 *                 Web Speech when sound is on; synth coin, hum, chime
 * Model space: the booth faces +x in the file; the group is turned so it faces +z.
 */
import * as THREE from "three";
import { RoomEnvironment } from "../airport/vendor/addons/environments/RoomEnvironment.js";
import { read, makeSeed, STARTERS, themeOf, FILE, script } from "./oracle.js";
import { renderTicket, ticketAspect, glitchFrame, recordLoop } from "./ticket.js";

const BASE = window.NY_BASE || "";
const THUMBS = window.MLOWTAR_THUMBS || (BASE + "assets/t/");   // the census thumbs; a standalone checkout points this at the live site
const GLB = BASE + "assets/movies/assets/glb/mlowtar.glb";
const $ = s => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isPhone = matchMedia("(max-width: 900px)").matches;
const texLoader = new THREE.TextureLoader();

/* ---------- GLB, read by hand (one mesh, one jpeg; no loader needed) ---------- */
async function loadBooth(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf), jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const bl = dv.getUint32(20 + jl, true), bin = new Uint8Array(buf, 28 + jl, bl);
  const acc = i => {
    const a = json.accessors[i], v = json.bufferViews[a.bufferView], off = (v.byteOffset || 0) + (a.byteOffset || 0);
    const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const T = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array }[a.componentType];
    return new T(buf.slice(bin.byteOffset + off, bin.byteOffset + off + a.count * n * T.BYTES_PER_ELEMENT));
  };
  const p = json.meshes[0].primitives[0], g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(acc(p.attributes.POSITION), 3));
  if (p.attributes.NORMAL != null) g.setAttribute("normal", new THREE.BufferAttribute(acc(p.attributes.NORMAL), 3)); else g.computeVertexNormals();
  if (p.attributes.TEXCOORD_0 != null) g.setAttribute("uv", new THREE.BufferAttribute(acc(p.attributes.TEXCOORD_0), 2));
  if (p.indices != null) g.setIndex(new THREE.BufferAttribute(acc(p.indices), 1));
  let tex = null, size = 2048;
  if (json.images && json.images.length) {
    const im = json.images[0], v = json.bufferViews[im.bufferView];
    const blob = new Blob([new Uint8Array(buf, bin.byteOffset + (v.byteOffset || 0), v.byteLength)], { type: im.mimeType || "image/jpeg" });
    const bmp = await createImageBitmap(blob, { imageOrientation: "none", premultiplyAlpha: "none" }); size = bmp.width;
    tex = new THREE.Texture(bmp); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; tex.anisotropy = 16;
  }
  return { geometry: g, texture: tex, size };
}

/* ---------- the scene ---------- */
const canvas = $("#mzc");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080D16);
scene.fog = new THREE.FogExp2(0x080D16, 0.14);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
const look = new THREE.Vector3(0, 0.5, 0);
const orbit = { yaw: 0.28, pitch: 0.06, tyaw: 0.28, tpitch: 0.06, dist: 2.35, drag: false, px: 0, py: 0, par: [0, 0], moved: 0 };

/* lights: a warm spot from the marquee side, a cool rim from the alley, the crystal from inside.
   Every light here is in physical units with real falloff, so the ones inside the cabinet sit centimetres from
   the face and must be tiny: a 0.7 cd point light 12 cm from the flower was 20 times the key (2026-10-12). */
scene.add(new THREE.HemisphereLight(0x27405a, 0x0a0806, 0.3));
const key = new THREE.SpotLight(0xffd9a0, 19, 7, 0.52, 0.7, 1.6);
key.position.set(1.15, 2.3, 1.5); key.castShadow = true; key.shadow.mapSize.set(isPhone ? 1024 : 2048, isPhone ? 1024 : 2048);
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01; key.target.position.set(0, 0.5, 0); scene.add(key, key.target);
const rim = new THREE.PointLight(0x61C9E2, 5, 4, 1.8); rim.position.set(-1.1, 1.3, -0.7); scene.add(rim);
const sign = new THREE.PointLight(0xffcf7a, 0.9, 1.4, 1.6); sign.position.set(0, 1.0, 0.4); scene.add(sign);
const ballLight = new THREE.PointLight(0x7fc8ff, 0.05, 0.6, 1.6); ballLight.position.set(0, 0.42, 0.14); scene.add(ballLight);

/* the corner: the site's glazed tile underfoot and its brick behind */
const tileTex = texLoader.load(BASE + "assets/ui/tile.webp", t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(26, 26); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshStandardMaterial({ map: tileTex, color: 0x2e3842, roughness: 0.38, metalness: 0.1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const brickTex = texLoader.load(BASE + "assets/ui/brick.webp", t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3.2, 1.6); t.colorSpace = THREE.SRGBColorSpace; });
const wall = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.4), new THREE.MeshStandardMaterial({ map: brickTex, color: 0x4b4044, roughness: 0.95 }));
wall.position.set(0, 1.7, -0.75); wall.receiveShadow = true; scene.add(wall);
{
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, "rgba(236,201,129,.5)"); g.addColorStop(0.5, "rgba(231,150,80,.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0.05, 0.003, 0.2); scene.add(pool);
}

/* dust in the spot light */
const dust = (() => {
  const N = reduced ? 0 : 420, pos = new Float32Array(N * 3), sp = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 2.2; pos[i * 3 + 1] = Math.random() * 1.6; pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2 + 0.3; sp[i] = 0.2 + Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d");
  const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,240,210,1)"); gr.addColorStop(1, "rgba(255,240,210,0)"); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const m = new THREE.PointsMaterial({ size: 0.012, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe2b0 });
  const pts = new THREE.Points(g, m); pts.userData.sp = sp; scene.add(pts); return pts;
})();

/* ---------- the booth and its rig ---------- */
const U = { uTime: { value: 0 }, uSpeak: { value: 0 }, uLean: { value: 0 }, uFlash: { value: 0 }, uGaze: { value: new THREE.Vector2(0, 0) }, uTexel: { value: 1 / 2048 } };
const booth = new THREE.Group(); booth.rotation.y = -Math.PI / 2; scene.add(booth);
let boothMesh = null;
function rigMaterial(tex) {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.0, envMapIntensity: 0.38 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime,uSpeak,uLean;uniform vec2 uGaze;varying float vBall,vEye,vTop;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        float inner = step(abs(position.x),0.135)*step(abs(position.z),0.155)*smoothstep(0.30,0.36,position.y)*(1.0-smoothstep(0.80,0.86,position.y));
        float h = clamp((position.y-0.33)/0.5,0.0,1.0);
        float breath = sin(uTime*1.4)*0.006*(1.0+uSpeak*0.5);
        float nod = uSpeak*sin(uTime*7.0)*0.007 + uSpeak*sin(uTime*2.3)*0.004;
        transformed.x += inner*h*(uLean*0.028 + breath + nod + uGaze.y*0.012);
        transformed.z += inner*h*(sin(uTime*0.9)*0.008 + uSpeak*sin(uTime*3.1)*0.004 - uGaze.x*0.03);
        transformed.y += inner*h*h*sin(uTime*2.2)*0.003;
        vBall = 1.0 - smoothstep(0.05,0.062,distance(position, vec3(0.1075,0.403,0.0)));   // the crystal: centre and radius 0.045 fitted from the GLB normals on 2026-10-12. Not gated by inner: the ball's front face is at x 0.152, outside the box, which is why it never glowed
        transformed += normal*vBall*(0.003*sin(uTime*3.0)+0.012*uSpeak);
        vEye = (1.0 - smoothstep(0.05,0.11,distance(position, vec3(0.06,0.69,0.0))))*inner;
        vTop = position.y;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTime,uSpeak,uFlash,uTexel;varying float vBall,vEye,vTop;")
      .replace("#include <map_fragment>", `#include <map_fragment>
        if (vTop > 0.862) discard;                                   // the baked sign plate: the crown is rebuilt in geometry
        #ifdef USE_MAP
        vec3 nb = (texture2D(map, vMapUv + vec2(uTexel,0.0)).rgb + texture2D(map, vMapUv - vec2(uTexel,0.0)).rgb + texture2D(map, vMapUv + vec2(0.0,uTexel)).rgb + texture2D(map, vMapUv - vec2(0.0,uTexel)).rgb) * 0.25;
        diffuseColor.rgb += (diffuseColor.rgb - nb) * 0.9;           // unsharp the soft Tripo bake
        diffuseColor.rgb = max(mix(vec3(dot(diffuseColor.rgb, vec3(0.3,0.59,0.11))), diffuseColor.rgb, 1.18), 0.0);
        #endif`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
        vec3 dc = diffuseColor.rgb; float mx = max(dc.r, max(dc.g, dc.b));
        float gold = step(0.08, mx) * smoothstep(0.45, 0.6, dc.g / max(dc.r, 1e-4)) * (1.0 - smoothstep(0.85, 0.95, dc.g / max(dc.r, 1e-4))) * (1.0 - smoothstep(0.45, 0.7, dc.b / max(dc.r, 1e-4)));
        float red = step(0.03, dc.r) * (1.0 - smoothstep(0.35, 0.55, dc.g / max(dc.r, 1e-4))) * (1.0 - smoothstep(0.35, 0.6, dc.b / max(dc.r, 1e-4)));
        metalnessFactor = mix(metalnessFactor, 0.9, gold);
        roughnessFactor = mix(roughnessFactor, 0.36, gold);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.0, 0.74, 0.36), gold * 0.75);   // the bake's gold is cream; deepen it so the brass reads as brass under the key
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.22, 0.4, 0.7), vBall * 0.95);   // the crystal is glass, not chalk: a deep blue body with a key highlight, its light is the emissive glow below
        roughnessFactor = mix(roughnessFactor, 0.18, vBall); metalnessFactor = mix(metalnessFactor, 0.25, vBall);
        roughnessFactor = mix(roughnessFactor, 0.5, red * (1.0 - gold));
        float lum = dot(dc, vec3(0.3, 0.59, 0.11));
        vec3 blue = vec3(0.02, 0.26, 0.92) * clamp(lum / 0.22, 0.25, 1.9);     // MLow blue, the paint keeps its shading
        diffuseColor.rgb = mix(diffuseColor.rgb, blue, red * (1.0 - gold) * 0.92);`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        vec3 iri = mix(vec3(0.35,0.70,1.0), vec3(1.0,0.55,0.85), 0.5+0.5*sin(uTime*1.7+vBall*4.0));
        totalEmissiveRadiance += diffuseColor.rgb * vBall * iri * (0.45 + 0.9*uSpeak + 0.12*sin(uTime*5.0) + 1.6*uFlash);
        vec3 eyeCol = mix(vec3(0.6,0.85,1.0), vec3(1.0,0.75,0.9), 0.5+0.5*sin(uTime*0.9));
        totalEmissiveRadiance += diffuseColor.rgb * vEye * eyeCol * (0.12 + 0.4*uSpeak + 0.8*uFlash);`);
  };
  return m;
}

/* ---------- the crown: a real sign, MLOW SPEAKS ---------- */
const ARCH = { x: 0.207, y0: 0.862, y1: 0.908, top: 1.012, z0: -0.034, depth: 0.226 };
const archY = x => ARCH.y1 + (ARCH.top - ARCH.y1) * (1 - Math.pow(x / ARCH.x, 2));
/* the enamel ground of the plate: no lettering here, the words are geometry (sign.json, below) */
function signCanvas() {
  const c = document.createElement("canvas"); c.width = 1536; c.height = 560; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, "#0b3aa6"); g.addColorStop(0.5, "#1251d6"); g.addColorStop(1, "#06236e"); x.fillStyle = g; x.fillRect(0, 0, 1536, 560);
  const v = x.createRadialGradient(768, 300, 100, 768, 300, 900); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.5)"); x.fillStyle = v; x.fillRect(0, 0, 1536, 560);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,220,180,${Math.random() * 0.05})`; x.fillRect(Math.random() * 1536, Math.random() * 560, 2, 2); }
  // the inner panel the letters sit on, darker, with a double gold pinstripe and corner scrolls
  x.fillStyle = "rgba(3,14,50,.6)"; x.fillRect(140, 150, 1256, 300);
  x.strokeStyle = "#e3c070"; x.lineWidth = 5; x.strokeRect(140, 150, 1256, 300); x.strokeStyle = "rgba(255,230,160,.4)"; x.lineWidth = 2; x.strokeRect(156, 166, 1224, 268);
  x.strokeStyle = "#e3c070"; x.lineWidth = 4;
  for (const [cx, cy, sx, sy] of [[140, 150, 1, 1], [1396, 150, -1, 1], [140, 450, 1, -1], [1396, 450, -1, -1]]) { x.beginPath(); x.arc(cx + sx * 34, cy + sy * 34, 22, 0, 7); x.stroke(); x.beginPath(); x.arc(cx + sx * 34, cy + sy * 34, 9, 0, 7); x.fillStyle = "#e3c070"; x.fill(); }
  x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#e9c878"; x.font = "600 30px 'IBM Plex Mono', monospace"; x.letterSpacing = "8px";
  x.fillText("FORTUNES  ·  THE CENSUS  ·  N3W YORKERS", 768, 408); x.letterSpacing = "0px";
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { tex, canvas: c, ctx: x };
}
/* letters from sign.json: one THREE.Shape per glyph (outer contour plus holes by containment), extruded in brass */
function glyphShapes(g) {
  const polys = g.contours.map(c => ({ pts: c.map(p => new THREE.Vector2(p[0], p[1])), area: Math.abs(THREE.ShapeUtils.area(c.map(p => new THREE.Vector2(p[0], p[1])))) }));
  const inside = (p, poly) => { let w = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) w = !w; } return w; };
  polys.forEach(p => { p.depth = polys.filter(q => q !== p && q.area > p.area && inside(p.pts[0], q.pts)).length; });
  const shapes = [];
  polys.filter(p => p.depth % 2 === 0).forEach(o => { const s = new THREE.Shape(o.pts); polys.filter(h => h.depth === o.depth + 1 && inside(h.pts[0], o.pts)).forEach(h => s.holes.push(new THREE.Path(h.pts))); shapes.push(s); });
  return shapes;
}
function buildWord(sign, word, width, y, z, depth, mat, track) {
  /* lay the glyphs out by advance, then centre the whole word on its ink (its first and last outline), not its
     advances, so the side bearings of the M and the S do not push it off centre; the space is narrowed */
  const G = sign.glyphs, adv = ch => ch === " " ? Math.round((G[" "] ? G[" "].adv : 500) * 0.95) : (G[ch] ? G[ch].adv : 600);
  const ink = g => { let a = Infinity, b = -Infinity; for (const c of g.contours) for (const p of c) { if (p[0] < a) a = p[0]; if (p[0] > b) b = p[0]; } return [a, b]; };
  let pen = 0, first = null, last = 0; const place = [];
  for (const ch of word) { const g = G[ch]; if (g && g.contours.length) { const [a, b] = ink(g); if (first == null) first = pen + a; last = pen + b; place.push([ch, pen]); } pen += adv(ch) + (track || 0); }
  const inkW = last - first, s = width / inkW, hgt = sign.capHeight * s, group = new THREE.Group();
  for (const [ch, px] of place) {
    const g = G[ch];
    const geo = new THREE.ExtrudeGeometry(glyphShapes(g), { depth: depth / s, bevelEnabled: true, bevelThickness: depth * 0.18 / s, bevelSize: depth * 0.14 / s, bevelSegments: 2, curveSegments: 2 });
    const m = new THREE.Mesh(geo, mat); m.scale.setScalar(s); m.position.set((px - first - inkW / 2) * s, y - hgt / 2, z); m.castShadow = true; m.receiveShadow = true; group.add(m);
  }
  return group;
}
async function buildLetters() {
  const sign = await fetch(BASE + (window.MLOWTAR_SIGN_URL || "assets/mlowtar/sign.json")).then(r => r.json());
  const zf = ARCH.z0 + ARCH.depth + 0.002, brassLit = new THREE.MeshStandardMaterial({ color: 0xe6bd62, metalness: 0.92, roughness: 0.22, envMapIntensity: 1.5, emissive: 0x3a2500, emissiveIntensity: 0.35 });
  const main = buildWord(sign, "MLOW SPEAKS", 0.305, 0.9375, zf, 0.011, brassLit, 30);
  scene.add(main); return { main, brassLit };
}
const crown = (() => {
  const s = new THREE.Shape(); s.moveTo(-ARCH.x, ARCH.y0); s.lineTo(-ARCH.x, ARCH.y1);
  for (let i = 1; i <= 24; i++) { const xx = -ARCH.x + (2 * ARCH.x) * i / 24; s.lineTo(xx, archY(xx)); }
  s.lineTo(ARCH.x, ARCH.y0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: ARCH.depth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.009, bevelSegments: 3 });
  const sc = signCanvas();
  sc.tex.wrapS = sc.tex.wrapT = THREE.ClampToEdgeWrapping;
  sc.tex.repeat.set(1 / (2 * ARCH.x), 1 / (ARCH.top - ARCH.y0)); sc.tex.offset.set(0.5, -ARCH.y0 / (ARCH.top - ARCH.y0));
  const face = new THREE.MeshStandardMaterial({ map: sc.tex, emissive: 0xffffff, emissiveMap: sc.tex, emissiveIntensity: 0.22, roughness: 0.3, metalness: 0.05, envMapIntensity: 0.8 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd7ad5a, metalness: 0.95, roughness: 0.28, envMapIntensity: 1.2 });
  const mesh = new THREE.Mesh(geo, [face, gold]); mesh.position.z = ARCH.z0; mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  // a brass cap on the arch and a lip under it
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2 * ARCH.x + 0.05, 0.016, ARCH.depth + 0.04), gold); cap.position.set(0, ARCH.y0 + 0.004, ARCH.z0 + ARCH.depth / 2); scene.add(cap);
  // MLow's eye on the cap, proud of the lip, and the N3W YORKERS plaque on the door
  texLoader.load(BASE + "assets/brand/eye_truecolor.png", t => { t.colorSpace = THREE.SRGBColorSpace;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 40), [gold, new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.1, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 }), gold]);
    disc.rotation.x = Math.PI / 2; disc.position.set(0, ARCH.y0 + 0.004, ARCH.z0 + ARCH.depth + 0.024); disc.castShadow = true; scene.add(disc); });
  texLoader.load(BASE + "assets/mlowtar/plaque.jpg", t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    // measured straight on (2026-10-12): the lower door's inner panel is about 0.37 wide by 0.165 tall, centred at y 0.153
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.006), [gold, gold, gold, gold, new THREE.MeshStandardMaterial({ map: t, roughness: 0.3, metalness: 0.05, envMapIntensity: 0.6 }), gold]);
    pl.position.set(0.005, 0.153, 0.193); pl.castShadow = true; scene.add(pl); });
  return { mesh, face, sign: sc };
})();

/* marquee bulbs along the new arch and its lip */
const bulbs = (() => {
  const P = [], zf = ARCH.z0 + ARCH.depth + 0.014; const push = (x, y) => P.push(new THREE.Vector3(x, y, zf));
  for (let i = 0; i <= 14; i++) { const x = -0.19 + i * 0.02714; push(x, archY(x) - 0.017); }   // the arch band, above the panel
  for (let i = 0; i <= 14; i++) push(-0.19 + i * 0.02714, ARCH.y0 + 0.011);                      // the lip, below it
  const N = P.length, geo = new THREE.SphereGeometry(0.0072, 10, 8);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  const d = new THREE.Object3D();
  P.forEach((p, i) => { d.position.copy(p); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix); mesh.setColorAt(i, new THREE.Color(0xffd27a)); });
  scene.add(mesh);
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute(P.flatMap(p => [p.x, p.y, p.z + 0.004]), 3));
  hg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,225,170,.9)"); gr.addColorStop(0.35, "rgba(255,200,120,.35)"); gr.addColorStop(1, "rgba(255,180,90,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const halos = new THREE.Points(hg, new THREE.PointsMaterial({ size: 0.07, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(halos);
  return { mesh, halos, N, speed: 1 };
})();
const warm = new THREE.Color(0xffd27a), dim = new THREE.Color(0x4a3418), tmp = new THREE.Color();
function tickBulbs(t) {
  const hc = bulbs.halos.geometry.attributes.color;
  for (let i = 0; i < bulbs.N; i++) {
    const phase = Math.sin(t * 6 * bulbs.speed - i * 0.9);
    const on = 0.35 + 0.65 * Math.max(0, phase) + U.uFlash.value;
    tmp.copy(dim).lerp(warm, Math.min(1, on)); bulbs.mesh.setColorAt(i, tmp);
    hc.setXYZ(i, tmp.r * on * 0.8, tmp.g * on * 0.8, tmp.b * on * 0.8);
  }
  bulbs.mesh.instanceColor.needsUpdate = true; hc.needsUpdate = true;
}

/* the glass */
/* the glass: a clear pane that only shows as a soft reflection, never a blur, so the oracle reads through it */
const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.246, 0.43), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.02, metalness: 0, reflectivity: 0.6, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.3, depthWrite: false, side: THREE.FrontSide }));
glass.position.set(0, 0.59, 0.178); glass.renderOrder = 2; scene.add(glass);
/* light inside the cabinet: a small warm lamp in the ceiling aimed down the face, and a faint cool fill at the pane.
   The face is 25 cm from the lamp and 12 cm from the fill, so these are hundredths of a candela: the key outside
   lands about 4 lux equivalent on the cabinet and the face should sit a stop under it, not three stops over. */
const lamp = new THREE.SpotLight(0xfff0d2, 0.11, 0.7, 0.75, 0.6, 2); lamp.position.set(0, 0.86, 0.13); lamp.target.position.set(0, 0.58, 0.04); scene.add(lamp, lamp.target);
const fill = new THREE.PointLight(0xdfe9ff, 0.012, 0.5, 2); fill.position.set(0.02, 0.62, 0.17); scene.add(fill);

/* ---------- the hang: MLow's New Yorkers framed on the brick behind the booth, a salon hang either side ---------- */
const hang = (() => {
  const frames = [], goldM = new THREE.MeshStandardMaterial({ color: 0xd2a853, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.1 }), matM = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9 });
  // two groups of four, landscape 16:9 (the census is painted wide), aligned on a grid with even gaps
  const W0 = 0.34, H0 = W0 / 1.776, GAP = 0.06, z = -0.6;
  const cols = [[-0.86, -0.45], [0.45, 0.86]], rows = [1.3, 1.3 - H0 - GAP, 1.3 - 2 * (H0 + GAP)];
  for (const group of cols) for (const x of group) for (const y of rows) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 288; const cx = c.getContext("2d"); cx.fillStyle = "#0F1A26"; cx.fillRect(0, 0, 512, 288);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const art = new THREE.Mesh(new THREE.PlaneGeometry(W0, H0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22 }));
    const mat = new THREE.Mesh(new THREE.BoxGeometry(W0 + 0.05, H0 + 0.05, 0.012), matM), frame = new THREE.Mesh(new THREE.BoxGeometry(W0 + 0.085, H0 + 0.085, 0.03), goldM);
    frame.position.set(x, y, z - 0.012); mat.position.set(x, y, z + 0.004); art.position.set(x, y, z + 0.012); frame.castShadow = true; scene.add(frame, mat, art);
    frames.push({ c, cx, tex, next: 0.2 + frames.length * 0.35, im: null, fade: 0, old: null });
  }
  for (const [x, y] of [[-0.65, 1.9], [0.65, 1.9]]) { const pl = new THREE.SpotLight(0xffe2b6, 7, 2.4, 0.7, 0.6, 1.4); pl.position.set(x, y, z + 0.55); pl.target.position.set(x, 1.0, z); scene.add(pl, pl.target); }
  return frames;
})();
const hangImg = url => new Promise(res => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = url; });
function drawCover(cx, im, w, h) { const ar = im.width / im.height, t = w / h; let sw = im.width, sh = im.height, sx = 0, sy = 0; if (ar > t) { sw = im.height * t; sx = (im.width - sw) / 2; } else { sh = im.width / t; sy = (im.height - sh) / 2; } cx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h); }
function tickHang(t, dt) {
  for (const f of hang) {
    f.next -= dt;
    if (f.next <= 0 && DECK.length) { f.next = 18 + Math.random() * 14; const row = DECK[Math.floor(Math.random() * DECK.length)];
      hangImg(THUMBS + row[6] + ".jpg").then(im => { if (im) { f.old = f.im; f.im = im; f.fade = 1; f.title = row[1]; } }); }
    if (f.fade > 0 || f.dirty) { const cx = f.cx; cx.globalAlpha = 1; if (f.old) drawCover(cx, f.old, 512, 288); else { cx.fillStyle = "#0F1A26"; cx.fillRect(0, 0, 512, 288); }
      if (f.im) { cx.globalAlpha = 1 - f.fade; drawCover(cx, f.im, 512, 288); cx.globalAlpha = 1; }
      f.fade = Math.max(0, f.fade - dt * 0.8); f.tex.needsUpdate = true; f.dirty = f.fade > 0; }
  }
}
/* ---------- the token and the ticket ---------- */
const brass = new THREE.MeshStandardMaterial({ color: 0xd9b25c, metalness: 0.95, roughness: 0.25, envMapIntensity: 1.2 });
const token = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  x.fillStyle = "#d9b25c"; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.strokeStyle = "#8a6a20"; x.lineWidth = 8; x.beginPath(); x.arc(128, 128, 112, 0, 7); x.stroke();
  x.fillStyle = "#6a4a10"; x.font = "900 70px Fraunces, Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("N3W", 128, 118); x.font = "700 30px 'IBM Plex Mono', monospace"; x.fillText("GOOD FOR ONE", 128, 180);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.0025, 40), [brass, new THREE.MeshStandardMaterial({ map: t, metalness: 0.9, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: t, metalness: 0.9, roughness: 0.3 })]);
  m.visible = false; m.castShadow = true; scene.add(m);
  return { mesh: m, t: -1, from: new THREE.Vector3(), to: new THREE.Vector3(-0.055, 0.268, 0.215), q: null };
})();
const ticket = (() => {
  const h = 0.23, w = h * ticketAspect;
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, metalness: 0, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.12 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); mesh.castShadow = true; mesh.visible = false; scene.add(mesh);
  return { mesh, mat, w, h, t: -1, home: new THREE.Vector3(0.055, 0.262, 0.14), out: new THREE.Vector3(0.055, 0.262 - h * 0.1, 0.19 + h * 0.5), hover: new THREE.Vector3(0.42, 0.46, 0.55), canvas: null, res: null };
})();
const V = new THREE.Vector3();
function tickToken(t, dt) {
  if (token.t < 0) return; token.t = Math.min(token.t + dt * 1.25, 1);
  const k = token.t, e = k * k * (3 - 2 * k), m = token.mesh;
  V.lerpVectors(token.from, token.to, e); V.y += Math.sin(k * Math.PI) * 0.12; m.position.copy(V);
  m.rotation.set(Math.PI / 2 + k * 9, k * 2.5, 0);
  if (k < 0.92) m.scale.setScalar(1); else m.scale.setScalar(Math.max(0.01, (1 - k) / 0.08));
  if (k >= 1) { m.visible = false; token.t = -1; coinDrop(); if (token.q != null) { const q = token.q; token.q = null; consult(q); } }
}
function tickTicket(t, dt) {
  if (ticket.t < 0) return;
  const m = ticket.mesh, k0 = ticket.t;
  // the printer stutters: the ticket advances in steps while it comes out of the slot
  const speed = k0 < 0.45 ? 0.26 : 0.5; ticket.t = Math.min(k0 + dt * speed, 1); const k = ticket.t;
  if (k < 0.45) {
    const u = k / 0.45, stepped = Math.floor(u * 14) / 14 + (u * 14 % 1) * 0.35;
    m.position.set(ticket.home.x, ticket.home.y - ticket.h * 0.42 * stepped, ticket.home.z + (ticket.out.z - ticket.home.z) * stepped);
    m.rotation.set(-Math.PI / 2 + 0.3 * stepped, 0, 0);
    if (Math.floor(u * 14) !== Math.floor((k0 / 0.45) * 14)) printTick();
  } else {
    const u = (k - 0.45) / 0.55, e = 1 - Math.pow(1 - u, 3);
    V.set(ticket.home.x, ticket.home.y - ticket.h * 0.42, ticket.out.z); V.lerp(ticket.hover, e); V.y += Math.sin(u * Math.PI) * 0.1;
    m.position.copy(V); m.position.y += (k >= 1 && !reduced ? Math.sin(t * 1.5) * 0.006 : 0);
    m.lookAt(camera.position); m.rotation.z += Math.sin(t * 0.7) * 0.03;
  }
}

/* ---------- audio: a synth hum, a coin, a chime, and the voice ---------- */
const snd = { ctx: null, muted: true, hum: null };
try { snd.muted = localStorage.getItem("ny_mlowtar_sound") !== "on"; } catch (e) {}
function actx() { if (!snd.ctx) { try { snd.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (snd.ctx.state === "suspended") snd.ctx.resume(); return snd.ctx; }
function coinDrop() { const c = actx(); if (!c || snd.muted) return; const t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(2300, t); o.frequency.exponentialRampToValueAtTime(1400, t + 0.09);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g).connect(masterOut()); o.start(t); o.stop(t + 0.25);
  const n = c.createBufferSource(), b = c.createBuffer(1, Math.floor(c.sampleRate * 0.08), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3200; const ng = c.createGain(); ng.gain.value = 0.25; n.buffer = b; n.connect(f).connect(ng).connect(masterOut()); n.start(t); }
function humOn() { const c = actx(); if (!c || snd.muted || snd.hum) return; const t = c.currentTime;
  const o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o1.type = "sawtooth"; o1.frequency.value = 55; o2.type = "sawtooth"; o2.frequency.value = 110.6; f.type = "lowpass"; f.frequency.value = 320; f.Q.value = 4;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.6);
  o1.connect(f); o2.connect(f); f.connect(g).connect(masterOut()); o1.start(); o2.start(); snd.hum = { o1, o2, g, f }; }
function humOff() { const c = snd.ctx, h = snd.hum; if (!c || !h) return; const t = c.currentTime; h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(Math.max(h.g.gain.value, 0.001), t); h.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); h.o1.stop(t + 0.55); h.o2.stop(t + 0.55); snd.hum = null; }
function chime() { const c = actx(); if (!c || snd.muted) return; const t = c.currentTime;
  [[880, 0], [1318.5, 0.09], [1760, 0.18], [2637, 0.3]].forEach(([fr, d]) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = fr;
    g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.09, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.6); o.connect(g).connect(masterOut()); o.start(t + d); o.stop(t + d + 1.7); }); }
function tickSound() { const c = snd.ctx; if (!c || snd.muted) return; const t = c.currentTime; const o = c.createOscillator(), g = c.createGain(); o.type = "square"; o.frequency.value = 1900 + Math.random() * 400;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.connect(g).connect(masterOut()); o.start(t); o.stop(t + 0.04); }
function printTick() { const c = snd.ctx; if (!c || snd.muted) return; const t = c.currentTime; const n = c.createBufferSource(), b = c.createBuffer(1, Math.floor(c.sampleRate * 0.03), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1800; const g = c.createGain(); g.gain.value = 0.08; n.buffer = b; n.connect(f).connect(g).connect(masterOut()); n.start(t); }
/* the voice: Web Speech, a low slow read, cancelled by the next token */
function speak(text) {
  if (snd.muted || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.88; u.pitch = 0.55; u.volume = 1;
    const vs = speechSynthesis.getVoices(), pref = vs.find(v => /Daniel|Google UK English Male|Arthur|Rishi|Aaron/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang));
    if (pref) u.voice = pref; u.onstart = () => { state.voice = true; }; u.onend = u.onerror = () => { state.voice = false; };
    speechSynthesis.speak(u);
  } catch (e) {}
}
const sndBtn = $("#mzSnd");
function paintSnd() { sndBtn.textContent = snd.muted ? "SOUND OFF" : "SOUND AND VOICE ON"; sndBtn.classList.toggle("on", !snd.muted); }
sndBtn.onclick = () => { snd.muted = !snd.muted; try { localStorage.setItem("ny_mlowtar_sound", snd.muted ? "off" : "on"); } catch (e) {} paintSnd(); if (!snd.muted) { actx(); chime(); } else { humOff(); try { speechSynthesis.cancel(); } catch (e) {} } };
paintSnd();

/* ---------- the film: RECORD arms it, the next consult is captured as a 1080 x 1920 clip with the synth audio ---------- */
const film = { armed: false, rec: null, canvas: null, ctx: null, chunks: [], captions: [], res: null, started: 0, audioDest: null, blob: null };
const recBtn = $("#mzRec");
if (recBtn) recBtn.onclick = () => { film.armed = !film.armed; recBtn.classList.toggle("armed", film.armed); recBtn.textContent = film.armed ? "RECORDING NEXT ASK" : "RECORD"; if (film.armed) actx(); };
function masterOut() { const c = actx(); if (!c) return null; if (!snd.master) { snd.master = c.createGain(); snd.master.connect(c.destination); film.audioDest = c.createMediaStreamDestination(); snd.master.connect(film.audioDest); } return snd.master; }
function filmStart() {
  try {
    film.canvas = document.createElement("canvas"); film.canvas.width = 1080; film.canvas.height = 1920; film.ctx = film.canvas.getContext("2d");
    const stream = film.canvas.captureStream(30); const out = masterOut(); if (out && film.audioDest) film.audioDest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
    const type = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)); if (!type) return false;
    film.rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8e6 }); film.chunks = []; film.rec.ondataavailable = e => { if (e.data.size) film.chunks.push(e.data); };
    film.rec.onstop = () => { film.blob = new Blob(film.chunks, { type }); film.rec = null; if (film.onDone) film.onDone(film.blob); };
    film.started = performance.now(); film.rec.start(250); return true;
  } catch (e) { film.rec = null; return false; }
}
function filmStop() { try { if (film.rec && film.rec.state !== "inactive") film.rec.stop(); } catch (e) {} }
function filmFrame(t) {
  const x = film.ctx, cw = canvas.width, ch = canvas.height, side = Math.min(cw, ch);
  x.fillStyle = "#080D16"; x.fillRect(0, 0, 1080, 1920);
  x.drawImage(canvas, (cw - side) / 2, (ch - side) / 2, side, side, 0, 0, 1080, 1080);
  x.fillStyle = "#0F1A26"; x.fillRect(0, 1080, 1080, 840);
  x.fillStyle = "#ECC981"; x.font = "700 26px 'IBM Plex Mono', monospace"; x.textAlign = "left"; x.fillText("MLOW SPEAKS  ·  N3WYORKERS.COM/MLOWTAR", 60, 1150);
  x.fillStyle = "#ECE8DD"; let y = 1215; const lines = film.captions.slice(-4);
  for (let i = 0; i < lines.length; i++) { const last = i === lines.length - 1; x.font = (last ? "600 " : "400 ") + (last ? 44 : 34) + "px Fraunces, Georgia, serif"; x.globalAlpha = last ? 1 : 0.55;
    const words = lines[i].split(" "); let line = ""; for (const w of words) { const tt = line ? line + " " + w : w; if (x.measureText(tt).width > 960 && line) { x.fillText(line, 60, y); y += last ? 52 : 42; line = w; } else line = tt; } if (line) { x.fillText(line, 60, y); y += last ? 64 : 50; } }
  x.globalAlpha = 1;
  if (ticket.canvas && ticket.t >= 0) { const th = 300, tw = th * ticketAspect; x.save(); x.translate(1080 - tw - 50, 1920 - th - 50); x.rotate(-0.04); x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = 30; x.drawImage(ticket.canvas, 0, 0, tw, th); x.restore(); }
  x.fillStyle = "rgba(236,232,221,.5)"; x.font = "500 22px 'IBM Plex Mono', monospace"; x.fillText("ART, NOT AN INVESTMENT", 60, 1860);
}
/* ---------- camera, pointer, hotspots ---------- */
function resize() {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  orbit.dist = camera.aspect > 1.3 ? 2.35 : camera.aspect > 0.8 ? 2.6 : 3.1;
  look.set(camera.aspect > 1.3 ? 0.06 : 0, 0.5, 0);
}
addEventListener("resize", resize); resize();
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const hot = {
  coin: new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.04)), card: new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.04)),
  glass: new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.46, 0.03)),
};
hot.coin.position.set(-0.055, 0.268, 0.19); hot.card.position.set(0.055, 0.262, 0.19); hot.glass.position.set(0, 0.585, 0.18);
Object.values(hot).forEach(h => { h.visible = false; scene.add(h); });
function hitAt(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const list = [hot.coin, hot.card, hot.glass]; if (ticket.mesh.visible) list.unshift(ticket.mesh);
  const h = ray.intersectObjects(list, false)[0]; if (!h) return null;
  return h.object === ticket.mesh ? "ticket" : h.object === hot.coin ? "coin" : h.object === hot.card ? "card" : "glass";
}
canvas.addEventListener("pointerdown", e => { orbit.drag = true; orbit.moved = 0; orbit.px = e.clientX; orbit.py = e.clientY; canvas.classList.add("drag"); try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
canvas.addEventListener("pointermove", e => {
  if (orbit.drag) { orbit.moved += Math.abs(e.clientX - orbit.px) + Math.abs(e.clientY - orbit.py); orbit.tyaw = THREE.MathUtils.clamp(orbit.tyaw - (e.clientX - orbit.px) * 0.006, -0.9, 0.9); orbit.tpitch = THREE.MathUtils.clamp(orbit.tpitch + (e.clientY - orbit.py) * 0.004, -0.12, 0.35); orbit.px = e.clientX; orbit.py = e.clientY; }
  else {
    const r = canvas.getBoundingClientRect(), gx = ((e.clientX - r.left) / r.width - 0.5), gy = ((e.clientY - r.top) / r.height - 0.5);
    if (!isPhone && !reduced) orbit.par = [gx, gy];
    U.uGaze.value.set(THREE.MathUtils.clamp(gx * 2, -1, 1), THREE.MathUtils.clamp(-gy * 2, -1, 1));
    const h = hitAt(e.clientX, e.clientY); canvas.classList.toggle("hot", !!h);
    tipFor(h);
  }
});
const endDrag = e => { if (orbit.drag && orbit.moved < 8) tap(e.clientX, e.clientY); orbit.drag = false; canvas.classList.remove("drag"); };
canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", () => { orbit.drag = false; canvas.classList.remove("drag"); });
const tipEl = $(".mz-tip"); let tipDefault = tipEl ? tipEl.textContent : "";
function tipFor(h) { if (!tipEl) return; tipEl.textContent = h === "coin" ? "DROP A TOKEN" : h === "card" ? "THE TICKET COMES OUT HERE" : h === "glass" ? "KNOCK ON THE GLASS" : h === "ticket" ? "TAKE YOUR TICKET" : tipDefault; }
function tap(cx, cy) {
  const h = hitAt(cx, cy); if (!h) return;
  if (h === "coin") dropToken(input.value);
  else if (h === "glass") { state.flash = Math.max(state.flash, 0.7); knock(); if (!state.busy) { state.lean = 1; setTimeout(() => { if (!state.busy) state.lean = 0.35; }, 1800); } }
  else if (h === "ticket") openLightbox();
  else if (h === "card") { if (ticket.mesh.visible) openLightbox(); else dropToken(input.value); }
}
function knock() { const c = actx(); if (!c || snd.muted) return; const t = c.currentTime; for (let i = 0; i < 2; i++) { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(180, t + i * 0.16); o.frequency.exponentialRampToValueAtTime(70, t + i * 0.16 + 0.08); g.gain.setValueAtTime(0.0001, t + i * 0.16); g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.16 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.12); o.connect(g).connect(masterOut()); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.14); } }

/* ---------- state and the render loop ---------- */
const state = { speak: 0, lean: 0, flash: 0, busy: false, live: false, voice: false, history: [], asked: 0 };
let letters = null;
const clock = new THREE.Clock(); let hidden = document.hidden;
window.__mz = { camera, look, orbit, scene };
document.addEventListener("visibilitychange", () => { hidden = document.hidden; if (!hidden) clock.getDelta(); });
function frame() {
  requestAnimationFrame(frame); if (hidden) return;
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  U.uTime.value = t;
  const speakTarget = state.voice ? 1 : state.speak;
  U.uSpeak.value += (speakTarget - U.uSpeak.value) * Math.min(1, dt * 3);
  U.uLean.value += (state.lean - U.uLean.value) * Math.min(1, dt * 2);
  state.flash = Math.max(0, state.flash - dt * 1.6); U.uFlash.value = state.flash;
  orbit.yaw += (orbit.tyaw + orbit.par[0] * 0.08 - orbit.yaw) * Math.min(1, dt * 4);
  orbit.pitch += (orbit.tpitch + orbit.par[1] * 0.04 - orbit.pitch) * Math.min(1, dt * 4);
  const d = orbit.dist, y = orbit.yaw, p = orbit.pitch;
  camera.position.set(look.x + Math.sin(y) * Math.cos(p) * d, look.y + 0.1 + Math.sin(p) * d, look.z + Math.cos(y) * Math.cos(p) * d);
  camera.lookAt(look);
  const s = U.uSpeak.value;
  ballLight.intensity = 0.04 + s * 0.09 + Math.sin(t * 5.1) * 0.01 + state.flash * 0.25;
  ballLight.color.setHSL(0.55 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.7)), 0.8, 0.65);
  sign.intensity = 0.9 + Math.sin(t * 23) * 0.04 + state.flash * 1;
  crown.face.emissiveIntensity = 0.22 + 0.03 * Math.sin(t * 23) + state.flash * 0.5;
  if (letters) letters.brassLit.emissiveIntensity = 0.35 + 0.1 * Math.sin(t * 2.0) + state.flash * 1.2 + U.uSpeak.value * 0.3;
  key.intensity = 19 + (state.busy ? Math.sin(t * 18) * 1 : 0);
  bulbs.speed = state.busy ? 3.2 : 1; tickBulbs(t);
  if (boothMesh && !reduced) { boothMesh.position.x = state.busy ? Math.sin(t * 60) * 0.0012 : 0; boothMesh.position.z = state.busy ? Math.cos(t * 47) * 0.0012 : 0; }
  if (dust.geometry.attributes.position) { const a = dust.geometry.attributes.position, sp = dust.userData.sp; for (let i = 0; i < sp.length; i++) { let yy = a.getY(i) + dt * 0.03 * sp[i]; if (yy > 1.7) yy = 0; a.setY(i, yy); a.setX(i, a.getX(i) + Math.sin(t * 0.5 + i) * dt * 0.01); } a.needsUpdate = true; }
  tickToken(t, dt); tickTicket(t, dt); tickHang(t, dt);
  renderer.render(scene, camera);
  if (film.rec) filmFrame(t);
}

/* ---------- data: the deck (deck.json, fetched once the booth is up, never before) and the rooms ---------- */
let DECK = [], ROOMS = window.NY_ROOMS || [], deckReady = null;
const loadDeck = () => deckReady || (deckReady = fetch(BASE + (window.MLOWTAR_DECK_URL || "assets/mlowtar/deck.json")).then(r => r.json()).then(j => { DECK = j; }).catch(() => {}));
const roomsReady = ROOMS.length ? Promise.resolve() : fetch(BASE + "api/rooms.json").then(r => r.json()).then(j => { ROOMS = j; }).catch(() => {});
const relImg = u => String(u || "").replace(/^https?:\/\/[^/]+\//, BASE);

/* ---------- the file: five questions, kept in this browser, the booth reads them into every slip ---------- */
const FILE_KEY = "ny_mlowtar_file"; let fileAns = {}; try { fileAns = JSON.parse(localStorage.getItem(FILE_KEY) || "{}") || {}; } catch (e) {}
const fileEl = $("#mzFile"), filedEl = $("#mzFiled");
const fileDone = () => FILE.every(f => fileAns[f.k]);
function paintFile() {
  if (!fileEl) return;
  if (fileDone() || fileAns.skipped) { fileEl.hidden = true; paintFiled(); return; }
  const i = FILE.findIndex(f => !fileAns[f.k]), f = FILE[i];
  fileEl.hidden = false; filedEl && (filedEl.hidden = true);
  fileEl.innerHTML = `<div class="prog"><span>THE FILE · ${i + 1} OF ${FILE.length}</span><span>FIVE QUESTIONS, THEN THE BOOTH</span></div><div class="bar"><i style="width:${(i / FILE.length) * 100}%"></i></div><p class="q">${esc(f.q)}</p><div class="ans">${f.a.map(([label, tag]) => f.k === "train" ? `<button type="button" class="bullet-b" data-tag="${esc(tag)}" style="background:var(--l${esc(label)})">${esc(label)}</button>` : `<button type="button" data-tag="${esc(tag)}">${esc(label)}</button>`).join("")}</div><button type="button" class="skip">Skip the file, just ask</button>`;
  fileEl.querySelectorAll(".ans button").forEach(b => b.onclick = () => { fileAns[f.k] = b.dataset.tag; delete fileAns.skipped; saveFile(); tickSound(); paintFile(); });
  fileEl.querySelector(".skip").onclick = () => { fileAns.skipped = true; saveFile(); paintFile(); input.focus(); };
}
function paintFiled() {
  if (!filedEl) return; const tags = FILE.map(f => fileAns[f.k]).filter(Boolean);
  if (!tags.length) { filedEl.hidden = false; filedEl.innerHTML = `<span>NO FILE</span><button type="button" data-edit>Open a file</button>`; }
  else { filedEl.hidden = false; filedEl.innerHTML = `ON FILE ${tags.map(t => `<span>${esc(t)}</span>`).join("")}<button type="button" data-edit>Edit</button>`; }
  filedEl.querySelector("[data-edit]").onclick = () => { fileAns = {}; saveFile(); paintFile(); };
}
function saveFile() { try { localStorage.setItem(FILE_KEY, JSON.stringify(fileAns)); } catch (e) {} }
const fileNow = () => { const f = {}; for (const q of FILE) if (fileAns[q.k]) f[q.k] = fileAns[q.k]; return f; };
const LIVE = window.MLOWTAR_LIVE === true;
/* ---------- the shelf: tickets kept in this browser, and on the collector's profile when they have one ---------- */
const SHELF_KEY = "ny_mlowtar_tickets";
function shelfRead() { try { return JSON.parse(localStorage.getItem(SHELF_KEY) || "[]"); } catch (e) { return []; } }
function shelfKeep(res) {
  const slim = { q: res.question, question: res.question, seed: res.seed, serial: res.serial, of: res.of, mode: res.mode, theme: res.theme, greet: res.greet, reading: res.reading, omen: res.omen, closer: res.closer, card: res.card, room: res.room && { id: res.room.id, name: res.room.name, area: res.room.area, image: res.room.image, why: res.room.why }, lucky: res.lucky, at: Date.now() };
  const list = shelfRead().filter(t => t.seed !== res.seed); list.unshift(slim); while (list.length > 24) list.pop();
  try { localStorage.setItem(SHELF_KEY, JSON.stringify(list)); } catch (e) {}
  try { if (window.NY && NY.track) NY.track("ticket", String(res.seed), { q: res.question, card: res.card && res.card.id, room: res.room && res.room.id, train: res.lucky && res.lucky.train }); } catch (e) {}
  paintShelf();
}
const shelfEl = $("#mzShelf");
async function paintShelf() {
  if (!shelfEl) return; const list = shelfRead(); shelfEl.hidden = !list.length; if (!list.length) return;
  const row = shelfEl.querySelector("div"); row.innerHTML = "";
  for (const t of list) {
    const b = document.createElement("button"); b.type = "button"; b.title = t.q || "a ticket"; b.innerHTML = `<i></i><small>${t.serial ? "TICKET " + esc(String(t.serial).padStart(4, "0")) : "No. " + esc(t.card ? t.card.id : "")}</small>`;
    b.onclick = async () => { const cv = await renderTicket(t, { scale: 1 }); ticket.canvas = cv; ticket.res = t; openLightbox(); };
    row.appendChild(b);
    renderTicket(t, { scale: 0.18 }).then(cv => { b.querySelector("i").style.backgroundImage = `url(${cv.toDataURL("image/jpeg", 0.7)})`; }).catch(() => {});
  }
}
/* ---------- the panel ---------- */
const slips = $("#mzSlips"), form = $("#mzForm"), input = $("#mzQ"), chips = $("#mzChips"), modeEl = $("#mzMode");
const lb = $("#mzLb");
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function paintChips() {
  const pool = STARTERS.slice().sort(() => Math.random() - 0.5).slice(0, isPhone ? 3 : 4);
  chips.innerHTML = pool.map(q => `<button type="button">${esc(q)}</button>`).join("");
  chips.querySelectorAll("button").forEach(b => b.onclick = () => { input.value = b.textContent; dropToken(b.textContent); });
}
paintChips();
function setMode(m) { modeEl.className = "mz-mode " + m; modeEl.textContent = m === "busy" ? "THE BOOTH IS THINKING" : m === "live" ? "LIVE · MLOWTAR IS LISTENING" : "THE BOOTH"; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function type(el, text, speed) {
  film.captions.push(text); if (film.captions.length > 6) film.captions.shift();
  if (reduced) { el.textContent = text; return; }
  el.innerHTML = '<span class="cur"></span>'; let out = "";
  for (let i = 0; i < text.length; i++) { out += text[i]; el.innerHTML = esc(out) + '<span class="cur"></span>'; if (i % 3 === 0) tickSound(); await sleep(/[.,!?]/.test(text[i]) ? speed * 6 : speed); }
  el.textContent = text;
}
const lbC = $("#mzLbC"); let lbRun = 0;
function openLightbox() {
  if (!lb || !ticket.canvas) return; lb.hidden = false; document.body.classList.add("mz-lb-open");
  if (lbC) { lbC.width = Math.round(ticket.canvas.width / 2); lbC.height = Math.round(ticket.canvas.height / 2); const my = ++lbRun, t0 = performance.now(), seed = (ticket.res && ticket.res.seed) || 1;
    (function loop() { if (lb.hidden || my !== lbRun) return; glitchFrame(ticket.canvas, lbC, (performance.now() - t0) / 1000, seed); requestAnimationFrame(loop); })(); }
}
function closeLightbox() { if (!lb) return; lb.hidden = true; lbRun++; document.body.classList.remove("mz-lb-open"); }
async function saveLoop() {
  if (!ticket.canvas || !ticket.res) return; const b = $("#mzLoop"); if (b) { b.disabled = true; b.textContent = "RECORDING 4 S"; }
  try { const blob = await recordLoop(ticket.canvas, 4, ticket.res.seed, 30); const a = document.createElement("a"); a.download = `mlow-speaks-loop-${(ticket.res.seed >>> 0).toString(16)}.${blob.type.includes("mp4") ? "mp4" : "webm"}`; a.href = URL.createObjectURL(blob); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 20000); }
  catch (e) { if (window.NY && NY.toast) NY.toast("This browser cannot record the loop. Save the ticket instead."); }
  if (b) { b.disabled = false; b.textContent = "SAVE THE LOOP"; }
}
async function saveTicket(res) {
  try {
    const big = await renderTicket(res, { scale: 2 });
    const a = document.createElement("a"); a.download = `mlow-speaks-ticket-${(res.seed >>> 0).toString(16)}.png`; a.href = big.toDataURL("image/png"); a.click();
    try { if (window.NY && NY.hit) NY.hit("save", "mlowtar"); } catch (e) {}
  } catch (e) { if (window.NY && NY.toast) NY.toast("The printer jammed. Try again."); }
}
if (lb) { lb.addEventListener("click", e => { if (e.target === lb || e.target.closest("[data-close]")) closeLightbox(); }); $("#mzSave").onclick = () => { if (ticket.res) saveTicket(ticket.res); }; const lp = $("#mzLoop"); if (lp) lp.onclick = saveLoop; document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); }); }

/* Ask the Function; null when it is offline, over limit, or slow. The booth never waits more than 22 s. */
async function askLive(q) {
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 22000);
    const r = await fetch(BASE + "api/mlowtar", { method: "POST", headers: { "content-type": "application/json" }, signal: ctl.signal,
      body: JSON.stringify({ messages: state.history.concat([{ role: "user", content: q }]) }) });
    clearTimeout(to);
    if (!r.ok) return null; const j = await r.json(); if (!j || !j.ok) return null;
    return j;
  } catch (e) { return null; }
}

/* A token goes in first. Then the booth consults. */
function dropToken(qRaw, seedOverride) {
  if (state.busy || token.t >= 0) return;
  actx();
  token.q = (qRaw || "").trim().slice(0, 240) || STARTERS[Math.floor(Math.random() * STARTERS.length)]; token.seed = seedOverride;
  token.from.copy(camera.position); const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); token.from.addScaledVector(fwd, 0.45); token.from.y -= 0.12; token.from.x += 0.05;
  token.mesh.position.copy(token.from); token.mesh.visible = true; token.mesh.scale.setScalar(1); token.t = 0;
  input.disabled = true; state.lean = 0.6;
}
async function consult(q) {
  const seedOverride = token.seed; token.seed = undefined;
  state.busy = true; state.lean = 1; state.speak = 0.25; setMode("busy"); input.disabled = true;
  const filming = film.armed && filmStart(); film.captions = [q]; if (film.armed) { film.armed = false; recBtn && (recBtn.classList.remove("armed"), recBtn.textContent = filming ? "FILMING" : "RECORD"); }
  setTimeout(humOn, 150);
  ticket.mesh.visible = false; ticket.t = -1;
  const slip = document.createElement("article"); slip.className = "slip busy";
  slip.innerHTML = `<div class="slip-top"><span class="slip-q">“${esc(q)}”</span><span class="slip-mode">CONSULTING</span></div><p class="say greet">The ball goes milky<span class="cur"></span></p>`;
  slips.appendChild(slip); slip.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  try { if (window.NY && NY.hit) NY.hit("oracle", themeOf(q)); } catch (e) {}
  const seed = seedOverride != null ? seedOverride : makeSeed(q, Math.floor(Date.now() / 60000) ^ (state.asked++ * 7919));
  await Promise.all([roomsReady, loadDeck()]);
  const theatre = sleep(2600);
  const serialP = (async () => { try { const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 3500);
    const r = await fetch(BASE + "api/serial", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seed }), signal: ctl.signal }); clearTimeout(to);
    const j = r.ok ? await r.json() : null; return j && j.ok ? j : null; } catch (e) { return null; } })();
  const live = (seedOverride != null || !LIVE) ? null : await askLive(q);
  await theatre;
  let res;
  if (live && live.fortune) {
    const loc = read(q, seed, DECK, ROOMS, { file: fileNow() });
    res = { mode: "live", theme: live.theme || loc.theme, seed, greet: live.fortune.greet || loc.greet, reading: (live.fortune.reading && live.fortune.reading.length ? live.fortune.reading : loc.reading),
      omen: live.fortune.omen || loc.omen, closer: live.fortune.closer || loc.closer, card: live.card || loc.card, room: live.room ? Object.assign({}, live.room, { why: live.room.why || (loc.room && loc.room.why) }) : loc.room,
      lucky: Object.assign({}, loc.lucky, live.lucky || {}) };
    if (res.card && res.card.id) res.lucky.number = Number(res.card.id);
    state.live = true;
  } else { res = read(q, seed, DECK, ROOMS, { file: fileNow() }); state.live = false; }
  res.question = q; film.captions = []; film.res = null;
  const ser = res.careful ? null : await serialP; if (ser) { res.serial = ser.n; res.of = ser.of; res.index = ser.index; }
  state.history.push({ role: "user", content: q });
  state.history.push({ role: "assistant", content: [res.greet].concat(res.reading, [res.omen, res.room ? `I sent them to ${res.room.name}.` : ""]).join(" ").slice(0, 900) });
  if (state.history.length > 12) state.history.splice(0, state.history.length - 12);
  // the reveal: the booth lights up, speaks, and the printer starts on the ticket
  humOff(); if (!res.careful) { chime(); state.flash = 1; } state.speak = 1; state.busy = false; setMode(state.live ? "live" : "booth");
  speak(script(res).join(". "));
  const printing = res.careful ? Promise.resolve(null) : renderTicket(res, { scale: 1 }).then(cv => {
    ticket.canvas = cv; ticket.res = res; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
    if (ticket.mat.map) ticket.mat.map.dispose(); ticket.mat.map = tx; ticket.mat.emissiveMap = tx; ticket.mat.needsUpdate = true;
    ticket.mesh.visible = true; ticket.mesh.position.copy(ticket.home); ticket.t = 0; return cv;
  }).catch(() => null);
  slip.classList.remove("busy");
  slip.querySelector(".slip-mode").textContent = res.careful ? "THE BOOTH" : res.serial ? "TICKET " + String(res.serial).padStart(4, "0") + (res.of ? " OF 10,000" : "") : "UNNUMBERED";
  if (res.careful === "crisis") slip.classList.add("care");
  slip.querySelector(".slip-mode").classList.toggle("live", res.mode === "live");
  const greet = slip.querySelector(".greet"); await type(greet, res.greet, 14);
  if (res.fileLine) { const p = document.createElement("p"); p.className = "say file"; slip.appendChild(p); await type(p, res.fileLine, 11); }
  for (const line of res.reading) { const p = document.createElement("p"); p.className = "say"; slip.appendChild(p); await type(p, line, 11); }
  if (res.aside) { const p = document.createElement("p"); p.className = "say"; slip.appendChild(p); await type(p, res.aside, 11); }
  if (res.card) {
    const a = document.createElement("a"); a.className = "slip-card"; a.href = `${BASE}n/${esc(res.card.id)}`;
    a.innerHTML = `<img src="${THUMBS}${esc(res.card.thumb)}.jpg" alt="${esc(res.card.title)}" loading="lazy" width="72" height="72"><div><small>YOUR NEW YORKER · No. ${esc(res.card.id)}</small><b>${esc(res.card.title)}</b><span>${esc([res.card.family, res.card.neighborhood || res.card.borough].filter(Boolean).join(" · "))}</span></div>`;
    slip.appendChild(a);
  }
  const om = document.createElement("p"); om.className = "say omen"; slip.appendChild(om); await type(om, res.omen, 16);
  if (res.room) {
    const a = document.createElement("a"); a.className = "slip-room"; a.href = `${BASE}museum#room=${esc(res.room.id)}`;
    a.style.backgroundImage = `url(${relImg(res.room.image || ("assets/museum/rooms/" + res.room.id + ".jpg"))})`;
    a.innerHTML = `<i class="btn">ENTER THE ROOM</i><div><small>THE ROOM FOR YOU</small><b>${esc(res.room.name)}</b><span>${esc(res.room.area || "")}${res.room.why ? " · " + esc(res.room.why) : ""}</span></div>`;
    slip.appendChild(a);
  }
  if (!res.careful) {
    const lk = document.createElement("div"); lk.className = "slip-lucky";
    lk.innerHTML = `<span class="bullet dk" style="--lc:var(--l${esc(res.lucky.train)})">${esc(res.lucky.train)}</span><span>LUCKY TRAIN</span><b>No. ${esc(res.lucky.number)}</b><span>LUCKY NUMBER</span>`;
    slip.appendChild(lk);
  } else if (res.careful === "crisis") {
    const a = document.createElement("a"); a.className = "slip-room"; a.href = "tel:988"; a.style.background = "var(--harbor)";
    a.innerHTML = `<i class="btn">CALL OR TEXT 988</i><div><small>IN THE US, ANY HOUR</small><b>A person answers.</b><span>Outside the US, your local line is one search away.</span></div>`; slip.appendChild(a);
  }
  const cl = document.createElement("p"); cl.className = "say closer"; slip.appendChild(cl); await type(cl, res.closer, 12);
  // the ticket, in the slip too
  const cv = await printing;
  if (cv) {
    const tk = document.createElement("div"); tk.className = "slip-ticket";
    const im = document.createElement("img"); im.alt = "Your ticket"; im.src = cv.toDataURL("image/jpeg", 0.86); im.onclick = openLightbox;
    const row = document.createElement("div"); row.className = "row";
    const save = document.createElement("button"); save.type = "button"; save.className = "btn"; save.textContent = "SAVE THE TICKET"; save.onclick = () => saveTicket(res);
    row.appendChild(save); tk.appendChild(im); tk.appendChild(row); slip.appendChild(tk);
  }
  if (!res.careful) shelfKeep(res);
  if (filming) {
    await sleep(1500); const holder = document.createElement("div"); holder.className = "slip-film"; slip.appendChild(holder); recBtn && (recBtn.textContent = "RECORD");
    film.onDone = blob => { const v = document.createElement("video"); v.src = URL.createObjectURL(blob); v.controls = true; v.playsInline = true; v.muted = true; holder.appendChild(v);
      const row = document.createElement("div"); row.className = "row"; const a = document.createElement("a"); a.className = "btn"; a.textContent = "SAVE THE FILM"; a.download = `mlow-speaks-${(seed >>> 0).toString(16)}.${blob.type.includes("mp4") ? "mp4" : "webm"}`; a.href = v.src; row.appendChild(a); holder.appendChild(row); };
    filmStop();
  }
  const sh = document.createElement("div"); slip.appendChild(sh);
  const url = `${location.origin}${location.pathname}#q=${encodeURIComponent(q)}&s=${seed}`;
  if (window.NY && NY.shareRow) NY.shareRow(sh, { text: `MLOW SPEAKS drew me No. ${res.lucky.number}, ${res.card ? res.card.title : "a New Yorker"}, and sent me to ${res.room ? res.room.name : "the museum"}. Ask the booth:`, url });
  state.speak = 0; state.lean = 0.35; input.disabled = false; input.value = ""; input.placeholder = "Ask it something else."; if (!isPhone) input.focus();
  slip.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
}
form.addEventListener("submit", e => { e.preventDefault(); dropToken(input.value); });

/* ---------- go ---------- */
(async () => {
  try {
    const { geometry, texture, size } = await loadBooth(GLB); U.uTexel.value = 1 / size;
    boothMesh = new THREE.Mesh(geometry, rigMaterial(texture)); boothMesh.castShadow = true; boothMesh.receiveShadow = true; booth.add(boothMesh);
  } catch (e) { console.error("MLOWTAR: booth failed to load", e); $("#mzLoad b").textContent = "The booth is out of order. Try again in a minute."; return; }
  try { letters = await buildLetters(); } catch (e) { console.error("MLOWTAR: sign letters failed", e); }
  $("#mzLoad").classList.add("off"); frame();
  loadDeck(); paintFile(); setTimeout(paintShelf, 1800);
  try { speechSynthesis.getVoices(); } catch (e) {}
  const m = location.hash.match(/q=([^&]*)&s=(\d+)/);
  if (m) { const q = decodeURIComponent(m[1]); input.value = q; dropToken(q, Number(m[2])); }
})();
