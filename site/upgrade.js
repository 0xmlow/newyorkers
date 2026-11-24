// upgrade.js, THE BIG UPGRADE of THE LAST BODEGA (2026-11-23). MLow: "as detailed and cool as my movie sets gallery
// or the gallery I made Gary but even better", real models rather than code built objects, scanned materials,
// built architecture, signs, one illusion per room.
// What made the five rooms read as a game level, and what replaces it here, room by room:
//   - one colour boxes and canvas paint: Poly Haven scans (CC0, 1k, colour + normal + roughness) laid in metres
//     (assets/tex/), so a tile is a tile wherever it sits
//   - no ceilings and walls that stop at shoulder height: drop ceilings, a pressed tin ceiling, upper walls, skirting,
//     cornices, a roll gate housing, parapet coping. The store and the freezer stay open from above in the overview
//     (the miniature needs to see in); their ceilings and upper walls show only while you walk
//   - code built centrepieces: real models (assets/props/, our own and Poly Haven CC0) for the payphone, the radio,
//     the light fittings, the armillary in the terrarium, the telescope, the seedlings, the mail cart and the rest.
//     The code objects stay built and are hidden only once their model loads, so a failed file leaves the room as it was
// Rooms other than the store load their models when first entered, which keeps a phone's first load where it was.
// Firefly plates (FIREFLY_QUEUE.md in the site repo, slug bodega) are invisible until their file exists in
// assets/textures/; dropping the file in is all it takes.
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from './vendor/loaders/DRACOLoader.js';

const V3 = THREE.Vector3;
export async function upgradeBodega(ctx) {
  const { scene, baseWorld, expansion, renderer, sign: baseSign, target: baseTarget, secrets, discover, solids, archiveSolids } = ctx;
  const rooms = expansion?.rooms || {}, errors = [], tasks = { store: [], archive: [], laundry: [], mail: [], roof: [] };
  let cur = 'store';
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const texLoader = new THREE.TextureLoader();
  const gl = new GLTFLoader(), draco = new DRACOLoader();
  draco.setDecoderPath('vendor/draco/'); gl.setDRACOLoader(draco);
  const cache = new Map();

  // ---------- materials ----------
  const texCache = new Map();
  function tex(file, repeat, color) {
    const key = file + repeat;
    if (!texCache.has(key)) {
      const t = texLoader.load('assets/tex/' + file, undefined, undefined, () => errors.push(file));
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = maxAniso;
      if (color) t.colorSpace = THREE.SRGBColorSpace;
      texCache.set(key, t);
    }
    return texCache.get(key);
  }
  const matCache = new Map();
  // a scanned material for geometry whose UVs are in metres; `tile` is the size of one texture repeat in metres
  function scan(name, tile = 1, o = {}) {
    const key = name + tile + JSON.stringify(o);
    if (matCache.has(key)) return matCache.get(key);
    const r = 1 / tile;
    const m = new THREE.MeshStandardMaterial({ map: tex(name + '_c.webp', r, true), normalMap: tex(name + '_n.webp', r), roughnessMap: o.noRough ? null : tex(name + '_r.webp', r), color: o.color || '#ffffff', roughness: o.rough ?? 1, metalness: o.metal ?? 0, normalScale: new THREE.Vector2(o.ns ?? 1, o.ns ?? 1) });
    matCache.set(key, m); return m;
  }
  function canvasTex(w, h, draw, repeat = 1, color = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = maxAniso; return t;
  }
  let seed = 9127; const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  // ---------- geometry with UVs in metres ----------
  function plane(parent, w, h, m, p, ry = 0, rx = 0) {
    const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
    const o = new THREE.Mesh(g, m); o.position.set(...p); o.rotation.set(rx, ry, 0, 'YXZ'); parent.add(o); return o;
  }
  function slab(parent, s, m, p, ry = 0) {
    const [w, h, d] = s, g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
    const o = new THREE.Mesh(g, m); o.position.set(...p); o.rotation.y = ry; parent.add(o); return o;
  }
  const solid = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, metalness: .1 });
  // a run of boxes along one axis, instanced (mouldings, skirting, coping, sleepers)
  function run(parent, m, list) {
    const g = new THREE.BoxGeometry(1, 1, 1), inst = new THREE.InstancedMesh(g, m, list.length), d = new THREE.Object3D();
    list.forEach(([p, s], i) => { d.position.set(...p); d.scale.set(...s); d.rotation.set(0, 0, 0); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); });
    inst.computeBoundingSphere(); parent.add(inst); return inst;
  }

  // ---------- models ----------
  function glb(parent, file, p, size, ry = 0, o = {}) {
    const room = cur;
    const task = (async () => {
      try {
        if (!cache.has(file)) cache.set(file, gl.loadAsync('assets/props/' + file));
        const g = await cache.get(file), m = g.scene.clone(true);
        const b = new THREE.Box3().setFromObject(m), s = b.getSize(new V3()), c = b.getCenter(new V3());
        if (!(s.y > 0)) throw Error('empty model');
        const k = size / s[o.by || 'y'];
        m.position.set(-c.x, o.hang ? -b.max.y : o.mid ? -c.y : -b.min.y, -c.z);
        const h = new THREE.Group(); h.add(m); h.scale.setScalar(k); h.rotation.set(o.rx || 0, ry, o.rz || 0, 'YXZ'); h.position.set(...p); h.name = file;
        if (o.glow) m.traverse(x => { if (x.isMesh) { x.material = x.material.clone(); x.material.emissive = new THREE.Color(o.glow); x.material.emissiveIntensity = o.glowI ?? 1.4; } });
        if (o.tint) m.traverse(x => { if (x.isMesh) { x.material = x.material.clone(); x.material.color.multiply(new THREE.Color(o.tint)); } });
        parent.add(h); h.userData.size = s.clone().multiplyScalar(k); return h;
      } catch (e) { errors.push(file); console.error('upgrade: model failed', file, e); return null; }
    })();
    tasks[room].push(task); return task;
  }
  // replace code parts with a model set: the parts hide only when every model of the set loaded
  function swap(parts, list, done) {
    return Promise.all(list).then(hs => { if (hs.every(Boolean)) { parts.forEach(o => o && (o.visible = false)); done?.(hs); } else hs.forEach(h => h?.removeFromParent()); });
  }
  // a Firefly plate: invisible until its file exists in assets/textures/
  function ffPlate(parent, file, w, h, p, ry = 0, o = {}) {
    texLoader.load('assets/textures/' + file, t => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
      const m = o.basic ? new THREE.MeshBasicMaterial({ map: t, side: o.side || THREE.FrontSide, fog: false }) : new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? .85 });
      if (o.cylinder) { const g = new THREE.CylinderGeometry(o.cylinder, o.cylinder, h, 96, 1, true); const c = new THREE.Mesh(g, m); c.position.set(...p); parent.add(c); return; }
      plane(parent, w, h, m, p, ry, o.rx || 0).material.map.repeat.set(1 / w, 1 / h);
    }, undefined, () => {});
  }
  function sign(parent, lines, p, w, h, o = {}) { const m = baseSign(lines, p, w, h, o); parent.add(m); if (o.rx) m.rotation.x = o.rx; return m; }
  function hit(parent, p, s, title, fn) { const m = baseTarget(p, s, title, fn); parent.add(m); return m; }

  // ---------- shared surfaces ----------
  const subway = scan('subway_tile', .9, { rough: .9 });
  const tileWall = (w) => subway;
  const redBrick = scan('red_brick', 1.6, { color: '#c9a99a' }), darkBrick = scan('dark_brick', 1.6), oldBrick = scan('old_brick', 1.5);
  const pavement = scan('pavement', 2), terrazzo = scan('terrazzo', 1.4, { rough: .8, color: '#8f897d' }), parquet = scan('parquet', 1.2, { rough: .9 });
  const oak = scan('oak', 1.2, { rough: .9 }), gravel = scan('gravel', 1.4, { color: '#7a7d80', noRough: true, rough: .97 }), granite = scan('granite', 1.1, { rough: .9 });
  const steelPlate = scan('steel_plate', 1.6, { color: '#8a99a3', metal: .55, rough: 1 }), bluePlate = scan('blue_plate', 1.4, { color: '#7d93a3', metal: .5 });
  const concreteWorn = scan('concrete_worn', 1.6), shutter = scan('shutter', 1.2, { metal: .4 });
  const enamelDark = solid('#1f3a30'), trim = new THREE.MeshStandardMaterial({ color: '#e9e4d2', roughness: .5 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b48b45', roughness: .32, metalness: .9 });
  // the drop ceiling: 600 mm mineral tiles in a white T bar grid; one canvas repeat is 1.2 m (two by two tiles)
  const acoustic = (() => {
    const draw = (bump) => (c, w, h) => {
      c.fillStyle = bump ? '#bbb' : '#e8e5da'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { c.fillStyle = bump ? (rand() > .5 ? '#999' : '#ccc') : rand() > .5 ? 'rgba(120,115,100,.18)' : 'rgba(255,255,250,.2)'; c.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2); }
      c.fillStyle = bump ? '#fff' : '#f4f2ea'; for (const x of [0, w / 2]) { c.fillRect(x - 5, 0, 10, h); c.fillRect(0, x - 5, w, 10); }
      c.fillStyle = bump ? '#666' : 'rgba(80,80,70,.35)'; for (const x of [0, w / 2]) { c.fillRect(x + 5, 0, 2, h); c.fillRect(0, x + 5, w, 2); }
    };
    const map = canvasTex(512, 512, draw(false), 1 / 1.2), bump = canvasTex(512, 512, draw(true), 1 / 1.2, false);
    return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2, roughness: .92, side: THREE.DoubleSide });
  })();
  // pressed tin, 600 mm squares with a raised rosette (the Office of Lost Letters)
  const tin = (() => {
    const draw = (bump) => (c, w, h) => {
      const g = (v) => bump ? `rgb(${v},${v},${v})` : null;
      c.fillStyle = bump ? g(110) : '#cdbf98'; c.fillRect(0, 0, w, h);
      for (let k = 0; k < 4; k++) { const m = 26 + k * 44; c.strokeStyle = bump ? g(200 - k * 20) : `rgba(255,245,215,${.45 - k * .08})`; c.lineWidth = 10; c.strokeRect(m, m, w - 2 * m, h - 2 * m); }
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.fillStyle = bump ? g(230) : 'rgba(255,246,220,.5)'; c.beginPath(); c.ellipse(w / 2 + Math.cos(a) * 34, h / 2 + Math.sin(a) * 34, 26, 11, a, 0, 7); c.fill(); }
      c.fillStyle = bump ? g(255) : '#efe2bd'; c.beginPath(); c.arc(w / 2, h / 2, 20, 0, 7); c.fill();
      if (!bump) for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(60,45,20,${rand() * .12})`; c.fillRect(rand() * w, rand() * h, 2, 2); }
    };
    return new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, draw(false), 1 / .6), bumpMap: canvasTex(512, 512, draw(true), 1 / .6, false), bumpScale: 3, roughness: .42, metalness: .55, side: THREE.DoubleSide });
  })();

  // ---------- the anamorphic floor helper ----------
  // Paints `lines` on the floor so that, from the eye point, they stand up as if printed on an upright board at x = px
  // (z0..z1 wide, 0..H tall). Each floor vertex is projected through the eye onto that board to find its UV.
  function anamorph(parent, eye, px, z0, z1, H, lines, o = {}) {
    const W = z1 - z0, tw = 1024, th = Math.round(1024 * H / W);
    const map = canvasTex(tw, th, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = o.color || '#f0e6c8'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const n = lines.length, lh = h / n;
      lines.forEach((t, i) => { c.font = `400 ${lh * .78}px "Permanent Marker", Georgia`; c.fillText(t, w / 2, lh * (i + .55), w * .94); });
    }, 1); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; map.repeat.set(1, 1);
    const tTop = (eye[1] - H) / (eye[1] - .012), xFar = eye[0] + (px - eye[0]) / tTop;
    const zSpread = Math.max(Math.abs(z0 - eye[2]), Math.abs(z1 - eye[2])) / tTop;
    const nx = 80, nz = 40, pos = [], uv = [], idx = [];
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
      const x = xFar + (px - xFar) * i / nx, z = eye[2] - zSpread + 2 * zSpread * j / nz;
      const t = (px - eye[0]) / (x - eye[0]), Py = eye[1] + (.012 - eye[1]) * t, Pz = eye[2] + (z - eye[2]) * t;
      pos.push(x, .014, z); uv.push((z1 - Pz) / W, Py / H);
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const a = i * (nz + 1) + j, b = a + nz + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map, transparent: true, roughness: .6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    parent.add(m); return m;
  }

  const walkOnly = new THREE.Group(); walkOnly.name = 'walk-only ceilings and upper walls'; baseWorld.add(walkOnly);
  const spin = [], turn = [];

  // =====================================================================================================
  // THE SHOP
  function buildStore() {
    cur = 'store';
    const g = new THREE.Group(); g.name = 'upgrade-store'; baseWorld.add(g);
    // The floor: the green and cream checker at its real size (300 mm tiles, not 750), grout you can see, a scanned
    // terrazzo roughness so the probe lies in it unevenly, as a mopped floor does.
    const checker = (bump) => (c, w, h) => {
      const n = 8, s = w / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const v = (rand() - .5) * 14;
        c.fillStyle = bump ? '#d8d8d8' : (x + y) % 2 ? `rgb(${62 + v},${92 + v},${78 + v})` : `rgb(${222 + v},${214 + v},${184 + v})`;
        c.fillRect(x * s, y * s, s, s);
        if (!bump) { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x * s + 6, y * s + 6, s - 12, 8); }
      }
      c.fillStyle = bump ? '#3a3a3a' : '#8e8b78'; for (let i = 0; i <= n; i++) { c.fillRect(i * s - 2, 0, 4, h); c.fillRect(0, i * s - 2, w, 4); }
      if (!bump) for (let i = 0; i < 9000; i++) { c.fillStyle = rand() > .5 ? 'rgba(40,38,30,.10)' : 'rgba(255,255,240,.08)'; c.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2); }
    };
    const t = ctx.tile;
    t.map = canvasTex(1024, 1024, checker(false)); t.map.repeat.set(12 / 2.4, 16 / 2.4);
    t.bumpMap = canvasTex(1024, 1024, checker(true), 1, false); t.bumpMap.repeat.copy(t.map.repeat); t.bumpScale = 1.4;
    t.roughnessMap = tex('terrazzo_r.webp', 3); t.roughness = .55; t.color.set('#ffffff'); t.needsUpdate = true;
    // the freezer passage floor shares that material at a different size: a worn concrete slab covers it
    plane(g, 3.3, 5, concreteWorn, [0, .081, -10.5], 0, -Math.PI / 2);
    // Walls: glazed subway tile, laid in metres on every inside face, with a dark green cove skirting and a cornice.
    plane(g, 15.875, 4.385, subway, [-5.855, 2.27, .06], Math.PI / 2);
    plane(g, 4.12, 4.385, subway, [-3.8, 2.27, -7.87]); plane(g, 4.12, 4.385, subway, [3.8, 2.27, -7.87]);
    plane(g, 3.48, .985, subway, [0, 3.97, -7.87]);
    plane(g, 15.875, 1.125, subway, [5.855, .64, .06], -Math.PI / 2);
    run(g, enamelDark, [[[-5.83, .15, .06], [.06, .16, 15.875]], [[-3.8, .15, -7.84], [4.12, .16, .06]], [[3.8, .15, -7.84], [4.12, .16, .06]], [[5.83, .15, .06], [.06, .16, 15.875]]]);
    run(g, trim, [[[-5.8, 4.4, .06], [.14, .12, 15.875]], [[0, 4.4, -7.82], [11.8, .12, .14]]]);
    // Outside: a sidewalk of scanned concrete, a brick foundation under the shop, brick on the side walls, and the
    // roll gate every New York bodega has, rolled up into its housing over the door with guide rails down the piers.
    plane(g, 13.4, 1.4, pavement, [0, .052, 8.7], 0, -Math.PI / 2);
    plane(g, 13.4, .9, darkBrick, [0, -.5, 9.005]);
    plane(g, 16.2, 4.6, darkBrick, [-6.145, 2.3, 0], -Math.PI / 2);
    plane(g, 16.2, 1.2, darkBrick, [6.145, .6, 0], Math.PI / 2);
    slab(g, [12.4, .32, .34], shutter, [0, 3.44, 8.27]);
    run(g, new THREE.MeshStandardMaterial({ color: '#6b6e6a', roughness: .5, metalness: .8 }), [[[-5.72, 1.65, 8.3], [.07, 3.3, .09]], [[5.72, 1.65, 8.3], [.07, 3.3, .09]], [[0, 3.27, 8.3], [12.3, .05, .1]]]);
    // The ceiling (walk only): a drop ceiling, and the upper half of the right wall the cutaway leaves open.
    plane(walkOnly, 11.88, 15.9, acoustic, [.07, 4.46, .06], 0, Math.PI / 2);
    plane(walkOnly, 15.875, 3.27, subway, [5.98, 2.835, .06], -Math.PI / 2);
    run(walkOnly, trim, [[[5.93, 4.4, .06], [.14, .12, 15.875]], [[5.95, 1.2, .06], [.1, .05, 15.875]]]);
    // Real fittings: twelve sets of fluorescent tubes flush to the ceiling. They stay in the overview too.
    for (const x of [-3.7, 0, 3.7]) for (const z of [-5.6, -2, 1.6, 5.2]) glb(g, 'ph_mounted_fluorescent_lights.glb', [x, 4.43, z], 1.15, Math.PI / 2, { by: 'x', hang: true, glow: '#fff4dc', glowI: 2.2 });
    // A camera in the corner over the door, and its sign.
    glb(g, 'ph_security_camera_01.glb', [-5.5, 4.15, 7.55], .42, Math.PI * .8, { hang: true });
    sign(g, ['SMILE.', 'THE UNIVERSE IS WATCHING.'], [-4.75, 3.92, 7.86], 1.1, .32, { bg: '#d8c25a', fg: '#1d2a22', size: 18, rotation: Math.PI });
    // The payphone: the N3W BELL phone from ON LOCATION replaces the grey box. CALL HOME moves up as its placard.
    swap(ctx.swaps.phoneParts, [glb(g, 'nyb_payphone.glb', [-5.68, 1.12, 6.5], .86, Math.PI / 2)], () => { ctx.swaps.phone.position.set(-5.83, 2.32, 6.5); ctx.swaps.phone.scale.setScalar(.85); });
    // The radio on the counter: MLOW AM 1969, a real pocket set (ON LOCATION), facing the customers.
    swap(ctx.swaps.radioParts, [glb(g, 'nyb_walking_radio.glb', [5.05, 1.455, 3.7], .4, -Math.PI / 2)]);
    // Outside: a pair of steel cans by the curb, a stack of delivery boxes, water jugs by the cold case.
    glb(g, 'ph_metal_trash_can.glb', [3.1, .05, 9.05], .66, -.2);
    for (const [p, r, s] of [[[5.35, .075, 7.25], .2, .42], [[5.3, .5, 7.2], -.15, .38], [[5.4, .075, 6.65], .5, .36]]) glb(g, 'ph_cardboard_box_01.glb', p, s, r);
    for (const [x, z] of [[4.65, 7.45], [4.85, 7.7], [4.45, 7.72]]) glb(g, 'ph_plastic_bottle_gallon.glb', [x, .075, z], .38, rand() * 3);
    solids.push([4.25, 5.8, 6.35, 7.95]);
    // Signs in the house fonts, on enamel and card, the way a bodega layers them.
    sign(g, ['HOT COFFEE', 'ANY SIZE $1', 'ANY TIME'], [5.83, 3.35, 5.25], 1.25, .72, { rotation: -Math.PI / 2, bg: '#172b25', fg: '#f0d98c', size: 34 });
    sign(g, ['WE ACCEPT', 'EXACT CHANGE', 'AND THE INEVITABLE'], [-5.82, 3.35, 4.2], 1.35, .62, { rotation: Math.PI / 2, bg: '#e7dfc4', fg: '#7d2a23', size: 26, font: 'italic' });
    sign(g, ['ATM', 'INSIDE', '(OUT OF', 'UNIVERSE)'], [-5.8, 1.15, 7.65], .55, .7, { rotation: Math.PI / 2, bg: '#1a3a6a', fg: '#f4f0e0', size: 22 });
    sign(g, ['NO LOITERING', 'EXCEPT FOREVER'], [3.4, 3.4, -7.82], 1.7, .42, { bg: '#f3efe4', fg: '#9b2b22', size: 24, font: 'mono' });
    // Firefly: a hand painted bodega mural on the outside of the left wall (FIREFLY_QUEUE.md, bodega).
    ffPlate(g, 'ff_bodega_mural.webp', 12, 3.6, [-6.16, 2.35, 0], -Math.PI / 2);
    // The counter: oak veneer fronts and a granite top instead of canvas paint.
    if (ctx.wood?.map) { ctx.wood.map = tex('oak_c.webp', 1.6, true); ctx.wood.normalMap = tex('oak_n.webp', 1.6); ctx.wood.roughnessMap = tex('oak_r.webp', 1.6); ctx.wood.roughness = 1; ctx.wood.needsUpdate = true; }
    const top = ctx.mat('#c7c5ad'); top.map = tex('granite_c.webp', 3.5, true); top.normalMap = tex('granite_n.webp', 3.5); top.roughnessMap = tex('granite_r.webp', 3.5); top.color.set('#d9d5c8'); top.roughness = .7; top.needsUpdate = true;
    // THE FREEZER and its archive (built here too: the miniature shows it)
    buildArchive();
  }

  // =====================================================================================================
  // COLD STORAGE: the freezer that is bigger inside
  function buildArchive() {
    cur = 'archive';
    const g = new THREE.Group(); g.name = 'upgrade-archive'; baseWorld.add(g);
    // Insulated steel panel walls, a worn concrete floor, a steel deck ceiling over the neon ribs (walk only).
    plane(g, 21, 5.4, steelPlate, [-8.87, 2.7, -23], Math.PI / 2); plane(g, 21, 5.4, steelPlate, [8.87, 2.7, -23], -Math.PI / 2);
    plane(g, 18, 5.4, steelPlate, [0, 2.7, -33.37]);
    plane(g, 3.3, 3.5, steelPlate, [-1.645, 1.75, -10.5], Math.PI / 2); plane(g, 3.3, 3.5, steelPlate, [1.645, 1.75, -10.5], -Math.PI / 2);
    plane(g, 18, 21, concreteWorn, [0, .022, -23], 0, -Math.PI / 2);
    plane(walkOnly, 18, 21, bluePlate, [0, 5.38, -23], 0, Math.PI / 2);
    plane(walkOnly, 3.5, 5, bluePlate, [0, 3.48, -10.5], 0, Math.PI / 2);
    // a stainless kick rail and a chilled air duct along both walls
    run(g, new THREE.MeshStandardMaterial({ color: '#aab4b8', roughness: .28, metalness: .95 }), [[[-8.8, .4, -23], [.08, .08, 20.6]], [[8.8, .4, -23], [.08, .08, 20.6]], [[-8.8, .12, -23], [.04, .24, 20.6]], [[8.8, .12, -23], [.04, .24, 20.6]]]);
    run(walkOnly, steelPlate, [[[-8.45, 4.9, -23], [.6, .5, 20.6]], [[8.45, 4.9, -23], [.6, .5, 20.6]]]);
    // Real fittings: caged freezer lights down the middle, rope lines in front of the twelve works, two benches.
    for (const z of [-15.5, -21.5, -27.5]) glb(g, 'ph_caged_hanging_light.glb', [0, 5.38, z], 1.2, 0, { by: 'x', hang: true, glow: '#d8fbff', glowI: 1.2 });
    for (const side of [-1, 1]) for (let i = 0; i < 6; i++) glb(g, 'rope_stanchion.glb', [side * 7.75, .02, -15.2 - i * 3.15], 2.3, Math.PI / 2, { by: 'x', tint: '#c9d8e4' });
    archiveSolids.push([-7.9, -7.6, -32.3, -13.6], [7.6, 7.9, -32.3, -13.6]);
    for (const z of [-19.3, -26.9]) for (const side of [-1, 1]) { glb(g, 'museum_bench.glb', [side * 4.6, .02, z], 2.1, Math.PI / 2, { by: 'x' }); archiveSolids.push([side * 4.6 - .35, side * 4.6 + .35, z - 1.1, z + 1.1]); }
    // Signs: stencilled, the way a walk in freezer is marked.
    sign(g, ['COLD STORAGE', 'KEEP DOOR CLOSED', 'MINUS EIGHTEEN, FOREVER'], [0, 2.95, -8.12], 2.6, .55, { bg: '#dfe6e6', fg: '#0d3a49', size: 22, font: 'mono' });
    sign(g, ['AISLE', '∞'], [-8.84, 4.2, -14.2], .7, .7, { rotation: Math.PI / 2, bg: '#0f2a33', fg: '#bff3ff', size: 40 });
    sign(g, ['AISLE', '∞ + 1'], [8.84, 4.2, -14.2], .7, .7, { rotation: -Math.PI / 2, bg: '#0f2a33', fg: '#bff3ff', size: 34 });
    // Firefly: frost on the back wall around the portal (invisible until the file exists).
    ffPlate(g, 'ff_freezer_frost.webp', 18, 5.4, [0, 2.7, -33.36], 0, { rough: .6 });
  }

  // =====================================================================================================
  // THE MIDNIGHT LAUNDROMAT (room local, centre x -34)
  function buildLaundry() {
    cur = 'laundry'; const r = rooms.laundry; if (!r) return;
    const g = new THREE.Group(); g.name = 'upgrade-laundry'; r.group.add(g);
    // Terrazzo floor, subway tile on the back and new front wall, scanned brick on the sides, upper right wall built.
    plane(g, 14, 12, terrazzo, [0, .012, 0], 0, -Math.PI / 2);
    plane(g, 14, 5, subway, [0, 2.5, -5.87]);
    slab(g, [14, 5, .2], subway, [0, 2.5, 6.08]);
    plane(g, 12, 5, redBrick, [-6.89, 2.5, 0], Math.PI / 2);
    plane(g, 12, 2, redBrick, [6.89, 1, 0], -Math.PI / 2);
    slab(g, [.2, 3, 12], redBrick, [7, 3.5, 0]);
    run(g, enamelDark, [[[0, .1, -5.84], [14, .2, .06]], [[0, .1, 5.96], [14, .2, .06]], [[-6.86, .1, 0], [.06, .2, 12]], [[6.86, .1, 0], [.06, .2, 12]]]);
    run(g, trim, [[[0, 4.93, -5.82], [14, .14, .14]], [[0, 4.93, 5.94], [14, .14, .14]]]);
    // The ceiling: drop tiles, real tube fittings and two fans that turn.
    plane(g, 14, 12, acoustic, [0, 5, 0], 0, Math.PI / 2);
    for (const x of [-4.5, 0, 4.5]) for (const z of [-3.6, 3.4]) glb(g, 'ph_mounted_fluorescent_lights.glb', [x, 4.98, z], 1.15, Math.PI / 2, { by: 'x', hang: true, glow: '#effaff', glowI: 2.2 });
    for (const x of [-3, 3]) glb(g, 'ph_ceiling_fan.glb', [x, 4.98, .9], 1.35, 0, { by: 'x', hang: true }).then(h => h && spin.push(h));
    // The furniture of every laundromat: a row of white plastic chairs, baskets, jugs on the machines, a wet floor
    // sign, the television nobody chose, high in the corner.
    for (const x of [-5.9, -5.15, -2.3, -1.55]) glb(g, 'ph_plastic_monobloc_chair_01.glb', [x, .012, 5.35], .88, Math.PI + (rand() - .5) * .2);
    r.blocks.push([-6.3, -1.15, 4.9, 5.8]);
    for (const [p, ry] of [[[-1.1, 1.03, .45], .2], [[1.0, 1.03, -.4], -.3]]) glb(g, 'ph_wicker_basket_01.glb', p, .17, ry);
    for (const x of [-5.5, -1.2, 3.1]) glb(g, 'ph_plastic_bottle_gallon.glb', [x + .45, 2.375, -4.75], .34, rand() * 3);
    glb(g, 'ph_WetFloorSign_01.glb', [-4.9, .012, -2.2], .66, .6); r.blocks.push([-5.2, -4.6, -2.5, -1.9]);
    glb(g, 'ph_television_02.glb', [6.3, 3.35, -5.2], .5, -Math.PI * .78);
    slab(g, [.5, .06, .45], solid('#2a2d2e'), [6.4, 3.32, -5.25], -Math.PI * .78);
    // Signs: a laundromat's rules, enamel and card.
    sign(g, ['WASH $2.50', 'DRY 25¢ / 8 MIN', 'FOREVER: FREE'], [6.88, 3.4, 2.6], 1.5, 1, { rotation: -Math.PI / 2, bg: '#f2eee2', fg: '#173e33', size: 30 });
    sign(g, ['NO DYEING', 'NO TINTING', 'NO TIME TRAVEL AFTER 10 PM'], [-2.3, 3.6, 5.97], 2.2, .8, { rotation: Math.PI, bg: '#173e33', fg: '#f0e8cb', size: 26, font: 'mono' });
    sign(g, ['ATTENDANT ON DUTY', 'SINCE THE BIG BANG'], [-6.88, 3.85, 3.8], 1.7, .5, { rotation: Math.PI / 2, bg: '#d8c25a', fg: '#1d2a22', size: 24 });
    // Firefly: a ceramic tile frieze above the machines (invisible until the file exists).
    ffPlate(g, 'ff_laundry_frieze.webp', 9.6, 1.2, [0, 3.15, -5.86]);
    // THE ILLUSION: WASH YESTERDAY is painted four metres long down the aisle between the machines and the folding
    // table. From the brass marker by the last dryer it stands up like a sign. Anywhere else it is a smear.
    const eye = [4.5, 1.72, -2.35];
    anamorph(g, eye, 1.5, -2.95, -1.75, .9, ['WASH', 'YESTERDAY'], { color: '#163b30' });
    const mk = sign(g, ['STAND HERE', 'READ THE FLOOR'], [4.5, .03, -2.35], .9, .5, { bg: '#b48b45', fg: '#1c2620', size: 20, rx: -Math.PI / 2 }); mk.rotation.z = Math.PI / 2;
    hit(g, [4.5, .25, -2.35], [.9, .4, .6], 'Wash yesterday', () => discover('laundry-floor'));
  }

  // =====================================================================================================
  // THE OFFICE OF LOST LETTERS (room local, centre x 34)
  function buildMail() {
    cur = 'mail'; const r = rooms.mail; if (!r) return;
    const g = new THREE.Group(); g.name = 'upgrade-mail'; r.group.add(g);
    // Herringbone oak floor, old brick on every wall, oak wainscot with a chair rail, pressed tin ceiling.
    plane(g, 14, 14, parquet, [0, .006, 0], 0, -Math.PI / 2);
    plane(g, 14, 5.6, oldBrick, [0, 2.8, -6.87]);
    plane(g, 14, 5.6, oldBrick, [-6.87, 2.8, 0], Math.PI / 2);
    plane(g, 14, 2, oldBrick, [6.87, 1, 0], -Math.PI / 2);
    slab(g, [.25, 3.6, 14], oldBrick, [7, 3.8, 0]);
    slab(g, [14, 5.6, .25], oldBrick, [0, 2.8, 7.08]);
    plane(g, 14, 1.1, oak, [-6.85, .55, 0], Math.PI / 2); plane(g, 14, 1.1, oak, [6.85, .55, 0], -Math.PI / 2);
    plane(g, 14, 1.1, oak, [0, .55, 6.94], Math.PI);
    run(g, new THREE.MeshStandardMaterial({ color: '#5a3b22', roughness: .5 }), [[[-6.83, 1.12, 0], [.07, .06, 14]], [[6.83, 1.12, 0], [.07, .06, 14]], [[0, 1.12, 6.92], [14, .06, .07]], [[-6.83, .06, 0], [.06, .12, 14]], [[6.83, .06, 0], [.06, .12, 14]], [[0, .06, 6.92], [14, .12, .06]]]);
    plane(g, 14, 14, tin, [0, 5.6, 0], 0, Math.PI / 2);
    run(g, trim, [[[0, 5.5, -6.8], [14, .2, .16]], [[-6.8, 5.5, 0], [.16, .2, 14]], [[6.8, 5.5, 0], [.16, .2, 14]], [[0, 5.5, 6.9], [14, .2, .16]]]);
    // The desk gets an oak top and a modesty panel; three enamel pendants hang over it; a fan turns.
    slab(g, [5.8, .02, 2.3], oak, [0, 1.161, .3]);
    slab(g, [5.4, .7, .04], oak, [0, .65, -.8]);
    for (const x of [-1.9, 0, 1.9]) glb(g, 'ph_hanging_industrial_lamp.glb', [x, 5.6, .3], 1.45, 0, { hang: true, glow: '#ffd9a0', glowI: .35 });
    glb(g, 'ph_ceiling_fan.glb', [0, 5.6, 4.2], 1.35, .3, { by: 'x', hang: true }).then(h => h && spin.push(h));
    // On and around the desk: pens and a pot, a card index chest, a mail cart, unclaimed parcels.
    glb(g, 'ph_stationery_supplies.glb', [-.9, 1.17, .95], .14, .4);
    glb(g, 'ph_vintage_wooden_drawer_01.glb', [6.35, 0, -.1], .62, -Math.PI / 2); r.blocks.push([5.95, 6.8, -.6, .4]);
    glb(g, 'nyb_miracle_mailcart.glb', [-5.7, 0, -4.4], 1.6, .55); r.blocks.push([-6.2, -5.2, -4.9, -3.9]);
    for (const [p, s, ry] of [[[-6.1, 0, 3.2], .5, .3], [[-6.05, .5, 3.25], .44, -.2], [[-5.4, 0, 3.6], .42, .9]]) glb(g, 'ph_cardboard_box_01.glb', p, s, ry);
    r.blocks.push([-6.6, -4.9, 2.7, 4.1]);
    // Signs: post office enamel and a painted window lettering.
    sign(g, ['DEAD LETTER DEPT.', 'WINDOW 0'], [-6.84, 3.7, -3.6], 2.2, .62, { rotation: Math.PI / 2, bg: '#17323b', fg: '#e8d7a8', size: 30 });
    sign(g, ['NO STAMPS SOLD', 'FOR YESTERDAY'], [6.95, 4.3, 4.6], 1.8, .55, { rotation: -Math.PI / 2, bg: '#efe6cc', fg: '#7d2a23', size: 26, font: 'mono' });
    sign(g, ['WE NEVER CLOSE.', 'WE ALSO NEVER OPEN.'], [0, 4.45, 6.94], 3, .5, { rotation: Math.PI, bg: '#17323b', fg: '#e8d7a8', size: 26, font: 'italic' });
    // Firefly: a mural on the ceiling, letters flying like birds (invisible until the file exists).
    ffPlate(g, 'ff_mail_ceiling.webp', 8, 4, [0, 5.58, 0], 0, { rx: Math.PI / 2 });
  }

  // =====================================================================================================
  // THE GARDEN OF THE NEXT UNIVERSE (room local, centre z 38)
  function buildRoof() {
    cur = 'roof'; const r = rooms.roof; if (!r) return; const parts = expansion.parts || {};
    const g = new THREE.Group(); g.name = 'upgrade-roof'; r.group.add(g);
    // A tar and gravel roof, scanned brick parapets with a stone coping, sleepers under the machinery.
    plane(g, 18, 16, gravel, [0, .006, 0], 0, -Math.PI / 2);
    plane(g, 16, 1.1, redBrick, [-8.59, .55, 0], Math.PI / 2); plane(g, 16, 1.1, redBrick, [8.59, .55, 0], -Math.PI / 2);
    plane(g, 18, 1.1, redBrick, [0, .55, -7.59]); plane(g, 18, 1.1, redBrick, [0, .55, 7.59], Math.PI);
    for (const [p, s] of [[[-8.8, 1.14, 0], [.62, .08, 16.6]], [[8.8, 1.14, 0], [.62, .08, 16.6]], [[0, 1.14, -7.8], [18.2, .08, .62]], [[0, 1.14, 7.8], [18.2, .08, .62]]]) slab(g, s, granite, p);
    // Real plants in the beds instead of code stems: gazania and fern (Poly Haven, CC0), three to a planter.
    const plants = [];
    for (const x of [-4.8, 4.8]) for (const z of [-2.6, 1.4]) for (const dz of [-1.01, 0, 1.01]) for (const dx of [-.82, 0, .82]) {
      const fern = (dx === 0) !== (dz === 0);
      plants.push(glb(g, fern ? 'ph_fern_02.glb' : 'ph_flower_gazania.glb', [x + dx + (rand() - .5) * .1, .99, z + dz], fern ? .42 : .3, rand() * 6.28));
    }
    if (parts.seeds) swap([parts.seeds], plants);
    // The terrarium holds a real armillary now (ours, from MoMLOW) turning around the seed of the next sun.
    if (parts.orbits) swap(parts.orbits, [glb(g, 'armillary.glb', [0, .9, -.5], 1.28, 0)], ([h]) => turn.push(h));
    // The telescope pointed inward: a brass and walnut viewer on a turned stand (ours, from TEN STYLES).
    if (parts.scopeParts) swap(parts.scopeParts, [glb(g, 'ts_amesscope.glb', [-3.3, 0, 5.5], 1.45, -Math.PI * .85)]);
    // The rose's copper pot sits inside a terracotta one; a watering can waits by it.
    glb(g, 'ph_planter_pot_clay.glb', [2.4, 0, 5.6], .72, .4);
    glb(g, 'ph_watering_can_metal_01.glb', [3.25, 0, 5.15], .3, -1.1);
    // A condenser on sleepers, as every New York roof has.
    run(g, solid('#3b3a36'), [[[-7.55, .06, 1.2], [.6, .12, .14]], [[-7.55, .06, 2.3], [.6, .12, .14]]]);
    glb(g, 'ph_exterior_aircon_unit.glb', [-7.5, .12, 1.75], .9, Math.PI / 2); r.blocks.push([-8.4, -6.9, .2, 3.3]);
    sign(g, ['NO BALL PLAYING', 'NO BIG BANGS BEFORE 7 AM'], [-8.55, .7, -3.6], 1.7, .5, { rotation: Math.PI / 2, bg: '#efe8d2', fg: '#7d2a23', size: 24, font: 'mono' });
    sign(g, ['ROOF ACCESS', 'ALARM WILL SOUND', '(IT WILL NOT)'], [-1.45, .62, 7.57], 1.1, .6, { rotation: Math.PI, bg: '#9b2b22', fg: '#f6eedc', size: 22 });
    // Firefly: a painted sky all the way round (invisible until the file exists).
    ffPlate(g, 'ff_roof_sky.webp', 0, 34, [0, 9, 0], 0, { basic: true, cylinder: 46, side: THREE.BackSide });
  }

  // the laundromat's illusion is a secret from the start, so the receipt counts it before the room is first built
  secrets.push(['laundry-floor', 'Wash yesterday', 'The words on the floor are four metres long and lie perfectly flat. From the brass marker they stand up like a sign hung in the aisle. Most of yesterday is like this: it only makes sense from where you were standing.', 'Stand on the brass marker by the last dryer and look down the aisle.', 'laundry']);
  const builders = { store: buildStore, laundry: buildLaundry, mail: buildMail, roof: buildRoof };
  const built = {};
  function ensure(id) { if (id === 'archive') id = 'store'; if (!built[id] && builders[id]) { built[id] = true; builders[id](); } }
  ensure('store');
  let mode = 'overview';
  return {
    errors, tasks,
    room(id, m) { ensure(id === 'walk' || id === 'overview' ? 'store' : id); mode = m || mode; walkOnly.visible = mode === 'walk'; },
    ready(id) { const k = id === 'walk' || id === 'overview' ? 'store' : id; ensure(k); return Promise.all(tasks[k] || []); },
    tick(t) { for (const h of spin) h.rotation.y = t * 2.2; for (const h of turn) h.rotation.y = t * .18; },
  };
}
