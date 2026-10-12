/* MoMLOW core: flags, renderer, sky and light presets, materials, geometry helpers, collision data.
   Everything hangs off one global, M. Plain scripts, three.js r128 self hosted. */
window.M = (function () {
  "use strict";
  const M = {};
  const Q = M.Q = new URLSearchParams(location.search);
  M.MOBILE = matchMedia("(pointer: coarse)").matches || /Mobi|Android/i.test(navigator.userAgent);
  M.LOCK = Q.get("lock") !== "0" && !M.MOBILE;
  M.REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  M.AUDIT = Q.has("audit");
  M.ONSITE = /\/assets\/momlow\//.test(location.pathname) || /n3wyorkers\.com$/.test(location.hostname);
  M.ART = M.ONSITE ? "../t/" : "https://n3wyorkers.com/assets/t/";
  M.$ = (id) => document.getElementById(id);
  M.lerp = (a, b, t) => a + (b - a) * t; M.clamp = (v, a, b) => Math.max(a, Math.min(b, v)); M.rnd = (a, b) => a + Math.random() * (b - a);
  let seed = 1234; M.srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* quality: low (phones), medium, high. ?q= overrides; the settings panel changes it live where it can. */
  let saved = null; try { saved = localStorage.getItem("momlow.q"); } catch (e) {}
  M.quality = Q.get("q") || saved || (M.MOBILE ? "low" : "high");
  M.hi = () => M.quality === "high"; M.lo = () => M.quality === "low";

  /* ---- renderer, scene, camera ---- */
  const canvas = M.canvas = M.$("gl");
  const renderer = M.renderer = new THREE.WebGLRenderer({ canvas, antialias: !M.MOBILE, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, M.lo() ? 1.25 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = M.hi();
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = false;
  const scene = M.scene = new THREE.Scene();
  const camera = M.camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.05, 900);
  camera.rotation.order = "YXZ";
  const world = M.world = new THREE.Group(); scene.add(world);
  M.ANISO = renderer.capabilities.getMaxAnisotropy();
  M.FLOORS = [0, 6.5, 12.2, 17.9, 23.6, 29.3];           // ground, 2, 3, 4, 5, 6
  M.ROOF = 35;

  /* ---- textures ---- */
  const texLoader = M.texLoader = new THREE.TextureLoader(); texLoader.crossOrigin = "anonymous";
  const texCache = {};
  M.tex = function (name, color) {
    if (texCache[name]) return texCache[name];
    const t = texLoader.load("assets/tex/" + name + ".jpg");
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, M.ANISO);
    if (color) t.encoding = THREE.sRGBEncoding;
    texCache[name] = t; return t;
  };
  M.img = function (path, color) { const t = texLoader.load(path); if (color !== false) t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, M.ANISO); return t; };
  /* one shared material per surface; the repeat in metres goes into each mesh's UVs. Never clone a texture before the
     loader has its image: the clone stays empty and renders black. */
  const SCALE = { terrazzo: 3.2, planks: 7, plaster: 4.5, marble: 3.4, concrete: 3, asphalt: 6, pavers: 2.6, brick: 2.4, grass: 3.5, steel: 2, ashlar: 3, cobble: 2.4 };
  const LOOK = { plaster: { tint: 0xf3f2ee, ns: 0.35, rough: 0.95, relief: true }, planks: { tint: 0xb99d7a, ns: 0.5, rough: 0.8 }, terrazzo: { tint: 0xeae6df, ns: 0.4, rough: 0.6 },
    marble: { tint: 0xf4f2ee, ns: 0.3, rough: 0.5 }, concrete: { tint: 0xdedad3, ns: 0.5 }, ashlar: { tint: 0xd8d2c8 }, steel: { metal: 0.9, rough: 0.35 } };
  const surfCache = {};
  M.surf = function (set, opt) {
    opt = Object.assign({}, LOOK[set] || {}, opt || {});
    const key = set + JSON.stringify(opt); if (surfCache[key]) return surfCache[key];
    const m = new THREE.MeshStandardMaterial({ map: opt.relief ? null : M.tex(set + "_c", true), normalMap: M.tex(set + "_n"), roughnessMap: M.tex(set + "_r"),
      roughness: opt.rough == null ? 1 : opt.rough, metalness: opt.metal || 0, color: opt.tint || 0xffffff });
    m.normalScale.set(opt.ns || 0.7, opt.ns || 0.7); m.envMapIntensity = opt.env == null ? 0.45 : opt.env; m.userData.scale = SCALE[set] || 2.5;
    surfCache[key] = m; return m;
  };
  M.uvScale = function (geo, rx, ry) { const uv = geo.attributes.uv; if (!uv) return geo; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * ry); uv.needsUpdate = true; return geo; };
  M.sized = function (geo, mat, w, h) { if (mat && mat.userData && mat.userData.scale) M.uvScale(geo, Math.max(0.25, w / mat.userData.scale), Math.max(0.25, h / mat.userData.scale)); return geo; };
  M.canvasTex = function (draw, w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, M.ANISO); return t;
  };
  /* Abloh owns the text: Helvetica caps in quotation marks */
  M.signTex = function (text, opt) {
    opt = opt || {}; const w = opt.w || 1024, h = opt.h || 256;
    return M.canvasTex((g) => {
      g.fillStyle = opt.bg || "#0d0d0d"; g.fillRect(0, 0, w, h);
      g.fillStyle = opt.fg || "#f0efea"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = `bold ${opt.size || Math.round(h * 0.5)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      g.fillText(opt.quotes === false ? text : `“${text}”`, w / 2, h / 2 + (opt.sub ? -h * 0.13 : 0));
      if (opt.sub) { g.font = `500 ${Math.round(h * 0.16)}px "IBM Plex Mono", Menlo, monospace`; g.fillStyle = opt.subfg || "#8fa7ab"; g.fillText(opt.sub, w / 2, h * 0.78); }
    }, w, h);
  };
  M.wallText = function (lines, opt) {
    opt = opt || {}; const w = opt.w || 1400, h = opt.h || 600;
    return M.canvasTex((g) => {
      g.fillStyle = opt.bg || "#f3f2ee"; g.fillRect(0, 0, w, h); g.textAlign = "left"; g.textBaseline = "top";
      let y = 44;
      for (const [text, kind] of lines) {
        if (kind === "h") { g.fillStyle = opt.fg || "#0d0d0d"; g.font = `600 ${opt.hs || 84}px Fraunces, Georgia, serif`; g.fillText(text, 54, y); y += (opt.hs || 84) * 1.15; }
        else if (kind === "k") { g.fillStyle = "#8a8a84"; g.font = `500 28px "IBM Plex Mono", Menlo, monospace`; g.fillText(text.toUpperCase(), 54, y); y += 48; }
        else { g.fillStyle = "#333"; g.font = `400 34px "Space Grotesk", Helvetica, Arial, sans-serif`; const words = text.split(" "); let line = "";
          for (const wd of words) { const t = line ? line + " " + wd : wd; if (g.measureText(t).width > w - 108) { g.fillText(line, 54, y); y += 44; line = wd; } else line = t; }
          if (line) { g.fillText(line, 54, y); y += 44; } y += 18; }
      }
    }, w, h);
  };

  /* ---- materials (before any geometry uses them) ---- */
  const MAT = M.MAT = {
    bone: new THREE.MeshStandardMaterial({ color: 0xf0efea, roughness: 0.85 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf6f5f1, roughness: 0.9 }),
    shellDark: new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.7 }),
    charcoal: new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.55, metalness: 0.2 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.6 }),
    red: new THREE.MeshStandardMaterial({ color: 0x7b3f32, roughness: 0.9 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xc8a97e, roughness: 0.95 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xff6b00, roughness: 0.6 }),
    calcite: new THREE.MeshStandardMaterial({ color: 0x7fd4ff, emissive: 0x3aa8e8, emissiveIntensity: 0.9, roughness: 0.2 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.3, metalness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.95 }),
    blackSteel: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xd4e6ee, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2 }),
    glassRail: new THREE.MeshPhysicalMaterial({ color: 0xd8ecf2, roughness: 0.04, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2 }),
    water: new THREE.MeshStandardMaterial({ color: 0x1f5a73, roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.88, envMapIntensity: 1.3 }),
    strip: new THREE.MeshBasicMaterial({ color: 0xfff6e4 }),
    laylight: new THREE.MeshBasicMaterial({ color: 0xf2f4f8 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x161513, roughness: 0.45 }),
    frameOak: new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.6 }),
    frameWhite: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.7 }),
    plaque: new THREE.MeshStandardMaterial({ color: 0xf3f1ea, roughness: 0.8 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 }),
    skin: [0xe8c39e, 0xc68642, 0x8d5524, 0x5c3a21, 0xf1d1b5],
    coats: [0xdc6f57, 0x4692c2, 0xecc981, 0x61c9e2, 0xa23231, 0x9cccce, 0xe79650, 0x24394a, 0xece8dd, 0x0f1a26]
  };
  for (const k in MAT) if (MAT[k] && MAT[k].isMeshStandardMaterial && MAT[k].envMapIntensity === 1) MAT[k].envMapIntensity = (k === "steel" || k === "brass" || k === "blackSteel") ? 1.0 : 0.4;
  MAT.water.normalMap = texLoader.load("assets/tex/marble_n.jpg"); MAT.water.normalMap.wrapS = MAT.water.normalMap.wrapT = THREE.RepeatWrapping; MAT.water.normalMap.repeat.set(4, 1.5); MAT.water.normalScale.set(0.3, 0.3);

  /* ---- collision data + geometry helpers ---- */
  const solids = M.solids = [], plates = M.plates = [], ramps = M.ramps = [], keepOuts = M.keepOuts = [];
  M.addSolid = (minX, maxX, minZ, maxZ, yBase, yTop) => solids.push({ minX, maxX, minZ, maxZ, yBase, yTop });
  M.plate = (minX, maxX, minZ, maxZ, y) => plates.push({ minX, maxX, minZ, maxZ, y });
  M.box = function (x, y, z, w, h, d, mat, solid, shadow) {
    const m = new THREE.Mesh(M.sized(new THREE.BoxGeometry(w, h, d), mat, Math.max(w, d), h), mat); m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = M.hi(); m.receiveShadow = true; }
    world.add(m);
    if (solid) M.addSolid(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y - h / 2, y + h / 2);
    return m;
  };
  M.wall = function (x1, z1, x2, z2, h, yBase, mat, thick) {
    yBase = yBase || 0; thick = thick || 0.36;
    const len = Math.hypot(x2 - x1, z2 - z1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    return M.box(cx, yBase + h / 2, cz, alongX ? len : thick, h, alongX ? thick : len, mat || M.surf("plaster"), true);
  };
  M.hPlane = function (x1, z1, x2, z2, y, mat, faceUp, shadow) {
    const w = x2 - x1, d = z2 - z1;
    const m = new THREE.Mesh(M.sized(new THREE.PlaneGeometry(w, d), mat, w, d), mat); m.rotation.x = faceUp === false ? Math.PI / 2 : -Math.PI / 2;
    m.position.set(x1 + w / 2, y, z1 + d / 2); m.receiveShadow = shadow !== false; world.add(m); return m;
  };
  M.floor = (x1, z1, x2, z2, y, set, opt) => M.hPlane(x1, z1, x2, z2, y, M.surf(set, opt));
  M.ceiling = (x1, z1, x2, z2, y) => M.hPlane(x1, z1, x2, z2, y, MAT.white, false, false);
  M.slab = function (x1, z1, x2, z2, yTop, thick, set) { const m = M.box((x1 + x2) / 2, yTop - thick / 2, (z1 + z2) / 2, x2 - x1, thick, z2 - z1, set ? M.surf(set) : MAT.white, false); M.plate(x1, x2, z1, z2, yTop); return m; };
  const practicals = M.practicals = [];
  M.strip = function (x, z, y, len, alongZ, w) { return M.box(x, y - 0.02, z, alongZ ? (w || 0.22) : len, 0.04, alongZ ? len : (w || 0.22), MAT.strip, false, false); };
  M.point = function (x, y, z, intensity, dist, color) {
    const l = new THREE.PointLight(color || 0xfff1dc, intensity * 1.7, dist || 18, 2); l.position.set(x, y, z); world.add(l);
    practicals.push({ l, base: intensity * 1.7 }); return l;
  };
  /* a laylight: an emissive panel in the ceiling. The light itself comes from one point per room (room()), because
     the forward renderer compiles every light into every shader: a hundred lights froze the page. */
  M.laylight = function (x, y, z, w, d, intensity) { return M.box(x, y - 0.015, z, w, 0.03, d, MAT.laylight, false, false); };
  /* lights far from the visitor are switched off each half second, so the shaders only carry the ones nearby */
  M.cullLights = function (P) {
    const R = M.hi() ? 30 : 22;
    for (const pr of practicals) { const l = pr.l; const d = Math.hypot(l.position.x - P.x, l.position.z - P.z); l.visible = d < R && Math.abs(l.position.y - P.y) < 9; }
  };
  M.glassPane = function (cx, cy, cz, w, h, axis, solid, mull) {
    const m = M.box(cx, cy, cz, axis === "z" ? w : 0.05, h, axis === "z" ? 0.05 : w, MAT.glass, false, false); m.castShadow = false;
    if (solid) { const t = 0.2; if (axis === "z") M.addSolid(cx - w / 2, cx + w / 2, cz - t, cz + t, cy - h / 2, cy + h / 2); else M.addSolid(cx - t, cx + t, cz - w / 2, cz + w / 2, cy - h / 2, cy + h / 2); }
    const n = Math.max(1, Math.round(w / (mull || 3.2)));
    for (let i = 0; i <= n; i++) { const o = -w / 2 + (w / n) * i; M.box(axis === "z" ? cx + o : cx, cy, axis === "z" ? cz : cz + o, axis === "z" ? 0.1 : 0.14, h, axis === "z" ? 0.14 : 0.1, MAT.blackSteel, false, false); }
    return m;
  };
  M.sign = function (x, y, z, w, h, texture, rotY, double) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture })); m.position.set(x, y, z); m.rotation.y = rotY || 0; world.add(m);
    if (double) { const b = new THREE.Mesh(m.geometry, m.material); b.position.copy(m.position); b.rotation.y = (rotY || 0) + Math.PI; world.add(b); }
    return m;
  };
  M.pic = function (x, y, z, w, h, texture, rotY, opt) {   // a picture on a thin board, lit (standard) unless opt.flat
    opt = opt || {}; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), opt.flat ? new THREE.MeshBasicMaterial({ map: texture, transparent: !!opt.alpha }) : new THREE.MeshStandardMaterial({ map: texture, roughness: 0.75, transparent: !!opt.alpha, envMapIntensity: 0.2 }));
    m.position.set(x, y, z); m.rotation.y = rotY || 0; world.add(m); return m;
  };
  M.bench = function (x, z, alongZ, yBase, len) {
    yBase = yBase || 0; len = len || 2.2;
    M.box(x, yBase + 0.42, z, alongZ ? 0.55 : len, 0.08, alongZ ? len : 0.55, MAT.frameOak, false);
    M.box(x, yBase + 0.2, z, alongZ ? 0.45 : len - 0.3, 0.38, alongZ ? len - 0.3 : 0.45, MAT.charcoal, false);
    M.addSolid(x - (alongZ ? 0.3 : len / 2), x + (alongZ ? 0.3 : len / 2), z - (alongZ ? len / 2 : 0.3), z + (alongZ ? len / 2 : 0.3), yBase, yBase + 0.5);
  };
  M.rail = function (x1, z1, x2, z2, y, h) {   // a glass balustrade with a steel cap, solid
    h = h || 1.1; const len = Math.hypot(x2 - x1, z2 - z1), alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    M.box((x1 + x2) / 2, y + h / 2, (z1 + z2) / 2, alongX ? len : 0.04, h, alongX ? 0.04 : len, MAT.glassRail, false, false);
    M.box((x1 + x2) / 2, y + h + 0.02, (z1 + z2) / 2, alongX ? len : 0.07, 0.05, alongX ? 0.07 : len, MAT.steel, false, false);
    M.addSolid(Math.min(x1, x2) - 0.1, Math.max(x1, x2) + 0.1, Math.min(z1, z2) - 0.1, Math.max(z1, z2) + 0.1, y - 0.3, y + h + 0.6);
  };

  /* ---- sky, HDRI environment, time of day ---- */
  M.PRESETS = {
    day:    { hdr: "day", sunI: 1.15, sunEl: 0.95, sunAz: 2.3, sun: 0xfff2dd, hemiSky: 0xeef1f4, hemiGround: 0x9a948a, hemiI: 0.45, fog: 0xd8e4ee, fogN: 160, fogF: 520, prac: 0.55, win: 0, exp: 0.9, art: 1.0, envI: 0.5 },
    golden: { hdr: "golden", sunI: 1.1, sunEl: 0.2, sunAz: 2.0, sun: 0xffb073, hemiSky: 0xf1c1a0, hemiGround: 0x6f5a4a, hemiI: 0.4, fog: 0xe8c4a0, fogN: 130, fogF: 480, prac: 0.75, win: 0.5, exp: 0.95, art: 0.97, envI: 0.6 },
    night:  { hdr: "night", sunI: 0.2, sunEl: 0.65, sunAz: 2.6, sun: 0x8fa6d8, hemiSky: 0x55668a, hemiGround: 0x1a1b22, hemiI: 0.5, fog: 0x0f1626, fogN: 110, fogF: 420, prac: 1.0, win: 1, exp: 1.0, art: 0.8, envI: 0.45 }
  };
  function nyHour() { try { return parseInt(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()), 10) % 24; } catch (e) { return new Date().getHours(); } }
  M.ORDER = ["day", "golden", "night"];
  M.presetName = Q.get("time") || (() => { const h = nyHour(); return h >= 7 && h < 17 ? "day" : (h >= 17 && h < 20) || (h >= 5 && h < 7) ? "golden" : "night"; })();
  if (!M.PRESETS[M.presetName]) M.presetName = "day";
  scene.fog = new THREE.Fog(0xd8e4ee, 160, 520);
  const hemi = M.hemi = new THREE.HemisphereLight(0xeef1f4, 0x9a948a, 0.45); scene.add(hemi);
  const sun = M.sun = new THREE.DirectionalLight(0xfff2dd, 1.1); scene.add(sun); scene.add(sun.target); sun.target.position.set(0, 0, 30);
  if (M.hi()) { sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); const c = sun.shadow.camera; c.left = -110; c.right = 110; c.top = 110; c.bottom = -110; c.near = 10; c.far = 420; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05; }
  const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
  const hdrCache = {}; let skyMesh = null;
  M.windowMats = []; M.artMats = [];
  M.loadSky = function (name) {
    if (hdrCache[name]) return hdrCache[name];
    hdrCache[name] = new Promise((res) => {
      new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load("assets/hdri/" + name + ".hdr", (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping; const env = pmrem.fromEquirectangular(hdr).texture; res({ hdr, env });
      }, undefined, () => res(null));
    });
    return hdrCache[name];
  };
  let cur = M.cur = Object.assign({}, M.PRESETS[M.presetName]), target = M.PRESETS[M.presetName];
  M.applyPreset = function (p, t) {
    const c = cur, mix = (a, b) => M.lerp(a, b, t);
    for (const k of ["sunI", "sunEl", "sunAz", "hemiI", "fogN", "fogF", "prac", "win", "exp", "art", "envI"]) c[k] = mix(c[k], p[k]);
    sun.intensity = c.sunI; sun.color.lerp(new THREE.Color(p.sun), t);
    sun.position.set(Math.cos(c.sunEl) * Math.sin(c.sunAz) * 220, Math.sin(c.sunEl) * 220 + 10, Math.cos(c.sunEl) * Math.cos(c.sunAz) * 220).add(sun.target.position);
    hemi.intensity = c.hemiI; hemi.color.lerp(new THREE.Color(p.hemiSky), t); hemi.groundColor.lerp(new THREE.Color(p.hemiGround), t);
    scene.fog.color.lerp(new THREE.Color(p.fog), t); scene.fog.near = c.fogN; scene.fog.far = c.fogF;
    renderer.toneMappingExposure = c.exp;
    for (const pr of practicals) pr.l.intensity = pr.base * c.prac;
    for (const m of M.windowMats) m.emissiveIntensity = c.win * 1.1;
    for (const m of M.artMats) m.color.setScalar(c.art);
    if (M.onPreset) M.onPreset(c, p, t);
  };
  M.fade = 1;
  M.setPreset = function (name, instant) {
    M.presetName = name; target = M.target = M.PRESETS[name];
    M.loadSky(target.hdr).then((s) => {
      if (!s) return;
      scene.environment = s.env;
      if (!skyMesh) { skyMesh = new THREE.Mesh(new THREE.SphereGeometry(800, 48, 24), new THREE.MeshBasicMaterial({ map: s.hdr, side: THREE.BackSide, fog: false, toneMapped: true })); skyMesh.position.y = -30; skyMesh.rotation.y = 1.2; scene.add(skyMesh); }
      else { skyMesh.material.map = s.hdr; skyMesh.material.needsUpdate = true; }
    });
    M.fade = instant ? 1 : 0; if (instant) M.applyPreset(target, 1);
    const b = M.$("bTime"); if (b) b.textContent = "Time · " + name;
  };
  M.target = target;
  addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (M.composer) M.composer.setSize(innerWidth, innerHeight); });
  return M;
})();
