import * as T from 'three';

// A monumental everything bagel: lumpy baked torus, egg wash clearcoat, a crust map painted in code, and five
// toppings as instanced meshes seated on the surface normal. Replaces the chrome torus that read as a donut.

const R = 0.8, r = 0.37, FLAT = 0.78; // ring radius, tube radius, front to back squash (bagels are squat)

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number) {
  let f = 0, amp = 0.5;
  for (let o = 0; o < 4; o++) { f += amp * vnoise(x, y); x *= 2.03; y *= 2.03; amp *= 0.5; }
  return f;
}

// uv.y walks around the tube: 0.25 is the face toward the visitor (the baked top), 0.5 the hole, 0.75 the back.
function crust() {
  const W = 1024, H = 256;
  const col = document.createElement('canvas'), bump = document.createElement('canvas');
  col.width = bump.width = W; col.height = bump.height = H;
  const c = col.getContext('2d')!, b = bump.getContext('2d')!;
  const ci = c.createImageData(W, H), bi = b.createImageData(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = y / H, ang = v * Math.PI * 2;
      const top = Math.max(0, Math.sin(ang)); // 1 on the visitor face
      const belly = Math.exp(-Math.pow((v - 0.0) * 9, 2)) + Math.exp(-Math.pow((v - 1) * 9, 2)); // outer seam
      const n = fbm(x / 34, y / 18), fine = fbm(x / 6, y / 4);
      const blister = Math.max(0, fbm(x / 12 + 40, y / 9) - 0.62) * 3.2;
      const bake = 0.48 + top * 0.6 + n * 0.25 - belly * 0.3;
      // pale dough to deep mahogany crust
      const lo = [226, 189, 132], hi = [112, 54, 20];
      const k = Math.min(1, Math.max(0, bake));
      const i = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) ci.data[i + ch] = (lo[ch] * (1 - k) + hi[ch] * k) * (0.9 + fine * 0.18) - blister * 30;
      ci.data[i + 3] = 255;
      const h = 150 + n * 70 + fine * 30 + blister * 50 - belly * 60;
      bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = h; bi.data[i + 3] = 255;
    }
  c.putImageData(ci, 0, 0); b.putImageData(bi, 0, 0);
  const map = new T.CanvasTexture(col), bumpMap = new T.CanvasTexture(bump);
  map.colorSpace = T.SRGBColorSpace;
  for (const t of [map, bumpMap]) { t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; }
  return { map, bumpMap };
}

// a point and normal on the squat torus at angles (u around the ring, v around the tube)
function onSurface(u: number, v: number, p: T.Vector3, n: T.Vector3) {
  const lump = 1 + 0.05 * (fbm(u * 3 + 7, v * 1.6) - 0.5);
  const rr = r * lump;
  p.set((R + rr * Math.cos(v)) * Math.cos(u), (R + rr * Math.cos(v)) * Math.sin(u), rr * Math.sin(v) * FLAT);
  n.set(Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v) / FLAT).normalize();
}

export function everythingBagel(scene: T.Scene, at: T.Vector3, rot: T.Euler) {
  const group = new T.Group();
  group.position.copy(at);
  group.rotation.copy(rot);
  scene.add(group);

  const g = new T.TorusGeometry(R, r, 64, 160), pos = g.attributes.position, uv = g.attributes.uv;
  const p = new T.Vector3(), n = new T.Vector3();
  for (let i = 0; i < pos.count; i++) {
    onSurface(uv.getX(i) * Math.PI * 2, uv.getY(i) * Math.PI * 2, p, n);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  const { map, bumpMap } = crust();
  const dough = new T.MeshPhysicalMaterial({
    map, bumpMap, bumpScale: 2.2, roughness: 0.52, clearcoat: 0.55, clearcoatRoughness: 0.32, sheen: 0.4,
    sheenColor: new T.Color(0xffd9a0), sheenRoughness: 0.6,
  });
  const body = new T.Mesh(g, dough);
  body.castShadow = body.receiveShadow = true;
  group.add(body);

  // toppings: [geometry, material, count, scale jitter]
  const toppings: [T.BufferGeometry, T.Material, number, number][] = [
    [new T.SphereGeometry(0.03, 8, 5).scale(1, 0.55, 0.28), new T.MeshStandardMaterial({ color: 0xf3e4c0, roughness: 0.45 }), 240, 0.3], // sesame
    [new T.SphereGeometry(0.011, 5, 4), new T.MeshStandardMaterial({ color: 0x15161d, roughness: 0.6 }), 560, 0.4], // poppy
    [new T.DodecahedronGeometry(0.03, 0).scale(1.4, 0.8, 0.22), new T.MeshStandardMaterial({ color: 0x9a5f27, roughness: 0.7 }), 110, 0.5], // dried onion
    [new T.DodecahedronGeometry(0.026, 0).scale(1.2, 0.9, 0.3), new T.MeshStandardMaterial({ color: 0xead7a2, roughness: 0.6 }), 90, 0.5], // garlic
    [new T.BoxGeometry(0.02, 0.02, 0.02), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, transmission: 0.6, thickness: 0.02 }), 140, 0.6], // salt
  ];
  const m = new T.Matrix4(), q = new T.Quaternion(), spin = new T.Quaternion(), s = new T.Vector3(), z = new T.Vector3(0, 0, 1);
  let seed = 1;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [geo, mat, count, jitter] of toppings) {
    const inst = new T.InstancedMesh(geo, mat, count);
    for (let i = 0; i < count; i++) {
      // the topping sits where the bagel was dipped: the visitor face and over the shoulders
      const u = rand() * Math.PI * 2, v = 0.12 * Math.PI + rand() * 0.76 * Math.PI;
      onSurface(u, v, p, n);
      p.addScaledVector(n, 0.004);
      q.setFromUnitVectors(z, n);
      spin.setFromAxisAngle(z, rand() * Math.PI * 2);
      q.multiply(spin);
      const k = 1 - jitter / 2 + rand() * jitter;
      m.compose(p, q, s.set(k, k, k));
      inst.setMatrixAt(i, m);
    }
    inst.castShadow = false;
    inst.receiveShadow = true;
    group.add(inst);
  }
  return group;
}
