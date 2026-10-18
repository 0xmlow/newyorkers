import * as T from 'three';
import { Architecture } from './architecture/primitives';

/** Fictional second-floor SoHo loft. One unit = one metre; see docs/SOHO-REFERENCES.md. */
export function buildSoho(scene: T.Scene, unreal = false) {
  const a = new Architecture(scene);
  scene.background = new T.Color(0xdde8ef);
  scene.fog = null;
  const plaster = a.material(0xf3f0e9, 0, 0.88);
  const iron = a.material(0xe1dfd8, 0.18, 0.48);
  const black = a.material(0x24272a, 0.48, 0.42);
  const stone = a.material(0xd0cbc0, 0, 0.48);
  const bronze = a.material(0x8c6b43, 0.7, 0.35);
  const masonry = a.material(0xa48777, 0, 0.93);
  const glass = new T.MeshPhysicalMaterial({
    color: 0xdceaf0,
    transparent: true,
    opacity: 0.12,
    roughness: 0.12,
    depthWrite: false,
  });
  const warm = new T.MeshBasicMaterial({ color: 0xfff2da });
  a.box(14.8, 0.32, 32.8, 0, -0.17, -6, stone);
  a.box(0.45, 4.8, 32.4, 7.15, 2.4, -6, plaster);
  if (unreal) {
    a.box(5.65, 4.8, 0.45, -4.525, 2.4, -22.2, plaster);
    a.box(5.65, 4.8, 0.45, 4.525, 2.4, -22.2, plaster);
    a.box(3.4, 1.1, 0.45, 0, 4.25, -22.2, plaster);
  } else a.box(14.7, 4.8, 0.45, 0, 2.4, -22.2, plaster);
  a.box(14.8, 0.22, 32.8, 0, 4.72, -6, plaster);
  // Large honed limestone slabs: construction joints and restrained tonal variation.
  if (!unreal)
    for (let x = -6.5; x < 7; x += 1)
      for (let z = -21.5; z < 10; z += 2) {
        const shade =
          (((Math.round(x * 2) + Math.round(z * 2) * 3) % 5) + 5) % 5;
        a.box(
          0.996,
          0.012,
          1.996,
          x,
          0.003,
          z,
          a.material(0xd3cfc6 + shade * 0x010101, 0, 0.42),
        );
      }
  a.box(0.06, 0.12, 32, 6.9, 0.08, -6, stone);
  a.box(14, 0.12, 0.06, 0, 0.08, -21.94, stone);
  // Front glazing: actual openings, 420 mm wall reveals, transoms, paired sashes.
  function windowBay(x: number, z: number, side: boolean) {
    const groupStart = a.objects.length;
    a.box(3.45, 0.64, 0.46, 0, 0.32, 0, plaster);
    a.box(3.45, 0.46, 0.46, 0, 4.37, 0, plaster);
    for (const sx of [-1.65, 1.65]) a.box(0.18, 3.52, 0.46, sx, 2.4, 0, iron);
    a.box(3.28, 0.08, 0.56, 0, 0.66, 0.04, stone);
    a.box(3.18, 0.075, 0.13, 0, 3.38, 0, black);
    a.box(0.07, 3.44, 0.13, 0, 2.39, 0, black);
    a.box(3.18, 0.065, 0.13, 0, 2.05, 0, black);
    for (const sx of [-1.56, 1.56])
      a.box(0.065, 3.44, 0.13, sx, 2.39, 0, black);
    a.box(3.08, 3.42, 0.018, 0, 2.4, 0, glass);
    // Sash lifts and slim radiators below the sill.
    for (const sx of [-0.76, 0.76])
      a.box(0.12, 0.025, 0.04, sx, 2.12, 0.1, bronze);
    for (let i = 0; i < 13; i++)
      a.box(0.09, 0.38, 0.15, -0.73 + i * 0.12, 0.29, 0.37, iron);
    const rot = new T.Matrix4().makeRotationY(side ? Math.PI / 2 : 0);
    for (const o of a.objects.slice(groupStart)) {
      o.position.applyMatrix4(rot).add(new T.Vector3(x, 0, z));
      o.rotation.y = side ? Math.PI / 2 : 0;
    }
  }
  for (const x of [-5.175, -1.725, 1.725, 5.175]) windowBay(x, 10.15, false);
  for (let z = 8.425; z > -22; z -= 3.45) windowBay(-7.15, z, true);
  // Original structural grid, profiled cast-iron shafts and leaf-like capital brackets.
  for (const x of [-4.8, 4.8])
    for (const z of [5, -3, -11, -19]) {
      a.lathe(
        [
          [0.29, 0],
          [0.29, 0.08],
          [0.24, 0.12],
          [0.24, 0.28],
          [0.19, 0.34],
          [0.155, 0.43],
          [0.13, 3.96],
          [0.18, 4.06],
          [0.24, 4.13],
          [0.3, 4.2],
          [0.3, 4.3],
        ],
        x,
        0,
        z,
        iron,
        32,
      );
      a.box(0.7, 0.12, 0.7, x, 4.34, z, iron);
      for (let i = 0; i < 8; i++) {
        const t = (i * Math.PI) / 4;
        a.curve(
          [
            new T.Vector3(x + Math.cos(t) * 0.14, 3.94, z + Math.sin(t) * 0.14),
            new T.Vector3(x + Math.cos(t) * 0.28, 4.15, z + Math.sin(t) * 0.28),
            new T.Vector3(x + Math.cos(t) * 0.22, 4.24, z + Math.sin(t) * 0.22),
          ],
          0.023,
          iron,
          12,
        );
      }
    }
  for (const x of [-4.8, 4.8]) {
    a.box(0.22, 0.34, 32, x, 4.48, -6, iron);
    a.box(0.48, 0.06, 32, x, 4.3, -6, iron);
  }
  for (let z = 9; z > -22; z -= 1.35) a.box(14, 0.14, 0.09, 0, 4.53, z, iron);
  // White exhibition blades leave a continuous glazed perimeter and central accessible aisle.
  for (let i = 0; i < 6; i++) {
    const z = 6 - i * 4.65;
    a.box(0.24, 3.15, 3.25, -3.75, 1.575, z, plaster);
    a.box(0.3, 0.06, 3.31, -3.75, 0.03, z, stone);
    a.box(0.25, 0.08, 3.3, -3.75, 3.15, z, plaster);
  }
  // Track housings, aimable cylinders, and warm emitters above both art runs.
  for (const x of [-1.8, 5.5]) {
    a.box(0.07, 0.065, 29, x, 4.23, -6, black);
    for (let i = 0; i < 6; i++) {
      const z = 6 - i * 4.65;
      a.box(0.045, 0.2, 0.045, x, 4.1, z, black);
      const spot = a.mesh(
        new T.CylinderGeometry(0.072, 0.072, 0.22, 16),
        black,
        x,
        3.95,
        z,
      );
      spot.rotation.z = x < 0 ? -0.55 : 0.55;
      a.mesh(
        new T.SphereGeometry(0.048, 12, 8),
        warm,
        x + (x < 0 ? -0.05 : 0.05),
        3.84,
        z,
      );
    }
  }
  for (let i = 0; i < 12; i++) {
    const right = i % 2 === 1,
      z = 6 - Math.floor(i / 2) * 4.65;
    const spot = new T.SpotLight(0xfff0dd, 9, 6, Math.PI / 5, 0.65, 2);
    spot.position.set(right ? 5.5 : -1.8, 3.82, z);
    spot.target.position.set(right ? 6.86 : -3.6, 1.8, z);
    scene.add(spot, spot.target);
  }
  // Gallery reception and reading bench stay outside the main movement corridor.
  a.rounded(2.2, 0.85, 0.75, 1.7, 0.425, 8.4, plaster, 0.05);
  a.box(2.25, 0.04, 0.8, 1.7, 0.87, 8.4, stone);
  a.box(0.65, 0.025, 0.4, 1.7, 0.91, 8.4, black);
  a.rounded(
    0.8,
    0.42,
    2.5,
    5.4,
    0.42,
    -20.3,
    a.material(0x61584c, 0, 0.85),
    0.09,
  );
  for (const z of [-21.2, -19.4]) a.box(0.55, 0.22, 0.08, 5.4, 0.11, z, black);
  // MLow threshold installation; faithful supplied flower texture in an architectural niche.
  let live = true;
  if (!unreal) {
    a.box(3.8, 3.7, 0.16, 0, 1.95, -21.86, black);
    for (const x of [-1.95, 1.95])
      a.box(0.045, 3.8, 0.08, x, 1.95, -21.72, bronze);
    a.box(3.95, 0.045, 0.08, 0, 3.84, -21.72, bronze);
    const flowerMaterial = new T.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      toneMapped: false,
    });
    a.mesh(new T.PlaneGeometry(2.55, 2.55), flowerMaterial, 0, 2.13, -21.74);
    new T.TextureLoader().load('/flower.png', (t) => {
      if (!live) {
        t.dispose();
        return;
      }
      t.colorSpace = T.SRGBColorSpace;
      flowerMaterial.map = t;
      flowerMaterial.needsUpdate = true;
    });
    // Fine cobalt currents and physical copper drips restricted to the installation.
    for (let i = 0; i < 9; i++)
      a.curve(
        Array.from(
          { length: 12 },
          (_, j) =>
            new T.Vector3(
              -1.75 + i * 0.055 + Math.sin(j * 0.7 + i * 0.2) * 0.05,
              0.25 + j * 0.29,
              -21.65,
            ),
        ),
        0.008,
        a.material(0x2962ff, 0.25, 0.4),
        32,
      );
    for (let i = 0; i < 6; i++)
      a.box(
        0.015,
        0.17 + i * 0.08,
        0.025,
        1.3 + i * 0.065,
        0.7 - i * 0.04,
        -21.65,
        bronze,
      );
  }
  // Fictional neighboring street wall: modeled depth and window occlusion, no skyline texture.
  a.box(42, 0.3, 14, 0, -4.2, 18, masonry);
  for (let x = -20; x < 22; x += 7) {
    a.box(6.9, 18, 0.7, x, 4, 25, masonry);
    for (let y = -2; y < 13; y += 3.1) {
      a.box(7, 0.18, 0.65, x, y - 1.25, 24.5, stone);
      for (const dx of [-2, 0, 2]) {
        a.box(1.3, 2.05, 0.12, x + dx, y, 24.59, black);
        a.box(1.55, 0.12, 0.4, x + dx, y - 1.07, 24.44, stone);
        a.box(0.06, 2.05, 0.14, x + dx, y, 24.47, iron);
      }
    }
    a.box(7.3, 0.32, 1.1, x, 13, 24.7, stone);
  }
  a.box(0.6, 19, 55, -22, 4, -5, masonry);
  // One daylight direction plus low-energy sky/indirect approximation. No baked GI claim.
  a.batch();
  scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.castShadow = o.material !== glass;
      o.receiveShadow = true;
    }
  });
  const sky = new T.HemisphereLight(0xd8e8ff, 0xc3b7a1, 0.72);
  scene.add(sky);
  const sun = new T.DirectionalLight(0xfff1da, 3.2);
  sun.position.set(-14, 17, 18);
  sun.target.position.set(2, 0, -10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -23,
    right: 23,
    top: 25,
    bottom: -25,
    near: 1,
    far: 75,
  });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  return {
    tick: (_t: number) => {},
    dispose: () => {
      live = false;
      sun.shadow.map?.dispose();
    },
  };
}

export function constrainSoho(p: T.Vector3) {
  // Keep the visitor in the continuous aisle; wall art and installation remain reachable.
  p.x = T.MathUtils.clamp(p.x, -2.7, 6.35);
  p.z = T.MathUtils.clamp(p.z, -20.65, 7.1);
  if (p.z < -18.7 && p.x > 4.5) p.x = 4.5;
  for (const z of [5, -3, -11, -19]) {
    const dx = p.x - 4.8,
      dz = p.z - z,
      d = Math.hypot(dx, dz);
    if (d < 0.57) {
      p.x = 4.8 + (d ? dx / d : 1) * 0.57;
      p.z = z + (d ? dz / d : 0) * 0.57;
    }
  }
}
