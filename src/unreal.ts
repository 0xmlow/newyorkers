import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Architecture } from './architecture/primitives';
import { buildSoho } from './soho';
import { everythingBagel } from './bagel';
import { scan, scanMetric, fontsReady } from './scan';

function label(
  a: Architecture,
  lines: string[],
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
  background = '#eee6d5',
  ink = '#24251f',
) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = Math.round((2048 * h) / w);
  const c = canvas.getContext('2d')!;
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8;
  // the house type (Archivo, IBM Plex Mono), redrawn once the webfonts are in
  const draw = () => {
    c.fillStyle = background;
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    lines.forEach((line, i) => {
      const px = Math.floor(Math.min(132, (1700 / Math.max(line.length, 1)) * 1.65) * (i === 0 ? 1 : 0.8));
      c.font = i === 0 ? `700 ${px}px Archivo, 'Arial Narrow', sans-serif` : `400 ${Math.round(px * 0.62)}px Plex, monospace`;
      c.fillText(i === 0 ? line : line.toUpperCase(), 1024, (canvas.height * (i + 1)) / (lines.length + 1), 1960);
    });
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  return a.mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: tex, toneMapped: false }),
    x,
    y,
    z,
  );
}
export function buildUnreal(scene: T.Scene) {
  const shell = buildSoho(scene, true),
    a = new Architecture(scene);
  const ink = a.material(0x24241f, 0.25, 0.45),
    acid = a.material(0xdce552, 0, 0.5),
    violet = a.material(0xa095c5, 0.15, 0.4);
  // (2026-11-23) the boards are a scan now: Poly Haven wood_floor_worn (CC0), 2 m a tile, laid along the loft
  const boards = scan('floor', 2.0, 32, 14, { normal: 1.1, color: 0xeae3dc });
  a.mesh(new T.PlaneGeometry(32, 14).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), boards, 0, 0.023, -6);
  const marble = scanMetric('marble', 1.5, { color: 0xf6f1e8 });
  // Human-scale installations remain outside the two continuous circulation lanes.
  a.rounded(2.15, 0.7, 1.65, 1.25, 0.37, -2.9, marble, 0.07);
  const bagel = everythingBagel(scene, new T.Vector3(1.25, 1.86, -2.9), new T.Euler(0.16, -0.32, -0.1));
  // the plinth's face carries the asking price now, as an agamograph, and a brass plaque its title (upgrade.ts)
  // Tapered corridor uses real converging geometry: 7m reads like a much longer hall.
  const dark = a.material(0x242326, 0, 0.65),
    pale = a.material(0xf5ecdb, 0, 0.68);
  for (const x of [-2.3, 2.3])
    a.rounded(1.2, 4.4, 0.5, x, 2.2, -21.8, acid, 0.06);
  a.box(5.8, 0.5, 0.5, 0, 4.15, -21.8, acid);
  for (let row = 0; row < 24; row++) {
    const t = row / 24,
      t2 = (row + 1) / 24,
      z = -22 - row * 0.28,
      z2 = -22 - (row + 1) * 0.28,
      s = 1 - t * 0.83,
      s2 = 1 - t2 * 0.83;
    for (let col = 0; col < 10; col++) {
      const x = -1.7 + col * 0.34,
        x2 = x + 0.34;
      const quad = (vertices: number[]) => {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
        g.setIndex([0, 1, 2, 0, 2, 3]);
        g.computeVertexNormals();
        const m = (row + col) % 2 ? dark : pale;
        m.side = T.DoubleSide;
        a.mesh(g, m);
      };
      quad([
        x * s,
        0.035,
        z,
        x2 * s,
        0.035,
        z,
        x2 * s2,
        0.035,
        z2,
        x * s2,
        0.035,
        z2,
      ]);
      for (const side of [-1, 1])
        quad([
          side * 1.7 * s,
          col * 0.37 * s,
          z,
          side * 1.7 * s,
          (col + 1) * 0.37 * s,
          z,
          side * 1.7 * s2,
          (col + 1) * 0.37 * s2,
          z2,
          side * 1.7 * s2,
          col * 0.37 * s2,
          z2,
        ]);
      quad([
        x * s,
        3.7 * s,
        z,
        x2 * s,
        3.7 * s,
        z,
        x2 * s2,
        3.7 * s2,
        z2,
        x * s2,
        3.7 * s2,
        z2,
      ]);
    }
  }
  a.box(0.65, 0.7, 0.1, 0, 0.35, -28.8, violet);
  label(a, ['MORE SPACE. SAME RENT.'], 2.9, 0.3, 0, 3.65, -21.5);
  label(
    a,
    ['02 / THE 900-SQUARE-FOOT STUDIO', 'Actual size may differ from listing.'],
    2.8,
    0.34,
    0,
    0.3,
    -21.45,
  );
  // Anamorphic ring: disconnected physical segments project to a circle at a fixed eye point.
  const eye = new T.Vector3(1, 1.65, -7),
    center = new T.Vector3(1, 2.7, -13);
  for (let i = 0; i < 24; i++) {
    const theta = (i * Math.PI * 2) / 24,
      theta2 = ((i + 0.93) * Math.PI * 2) / 24,
      depth = 0.72 + (i % 4) * 0.18;
    const points = Array.from({ length: 6 }, (_, j) => {
      const t = theta + ((theta2 - theta) * j) / 5;
      return new T.Vector3(
        center.x + Math.cos(t) * 1.1,
        center.y + Math.sin(t) * 1.1,
        center.z,
      )
        .sub(eye)
        .multiplyScalar(depth)
        .add(eye);
    });
    a.curve(points, 0.045, i % 2 ? acid : violet, 12);
  }
  const spot = a.mesh(
    new T.RingGeometry(0.25, 0.3, 48),
    new T.MeshBasicMaterial({ color: 0xdce552, side: T.DoubleSide }),
    1,
    0.029,
    -7,
  );
  spot.rotation.x = -Math.PI / 2;
  label(
    a,
    ['03 / CIRCLE BACK', 'Stand on the yellow ring. Look up.'],
    1.8,
    0.34,
    1,
    1.15,
    -13.1,
  );
  // Static moire on the back wall, behind the reading bench: two slat layers of different pitch over a lit acid
  // backing, 25 cm apart. Walk the back of the room left to right and the bands slide; nothing is animated.
  a.box(2.7, 2.9, 0.04, 4.6, 1.85, -21.93, acid);
  for (let layer = 0; layer < 2; layer++) {
    const pitch = layer ? 0.062 : 0.056,
      count = Math.floor(2.6 / pitch);
    for (let i = 0; i < count; i++) {
      const slat = a.box(
        0.026,
        2.75,
        0.025,
        3.32 + i * pitch,
        1.85,
        -21.62 - layer * 0.25,
        layer ? violet : ink,
      );
      slat.rotation.z = layer ? 0.06 : -0.06;
    }
  }
  // the commute's title is a black enamel station sign now (upgrade.ts)
  label(
    a,
    [
      'NEW YORKERS // BY MLOW',
      'DEPARTMENT OF UNREAL ESTATE',
      'Please do not feed the rent.',
    ],
    3.3,
    0.55,
    0,
    4.17,
    -20.8,
    '#dce552',
  );
  label(a, ['REALITY IS RENT-STABILIZED.'], 2.5, 0.22, 1.7, 0.6, 8.81);
  // the black code bollards became brass rope stanchions (upgrade.ts), on the same footprint
  a.batch();
  scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.receiveShadow = true;
      o.castShadow = !(Array.isArray(o.material)
        ? o.material.some((m) => m.transparent)
        : o.material.transparent);
    }
  });
  // The bagel turns, slowly, like a deli display case. Reduced motion holds it still.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    bagel,
    tick: (t: number) => {
      if (!still) bagel.rotation.y = -0.32 + Math.sin(t * 0.25) * 0.5;
    },
    dispose: () => shell.dispose(),
  };
}
export function constrainUnreal(p: T.Vector3) {
  // Expanded plinth footprint includes visitor clearance.
  if (p.x > -0.15 && p.x < 2.65 && p.z > -4.1 && p.z < -1.7) {
    const options = [
        Math.abs(p.x + 0.15),
        Math.abs(p.x - 2.65),
        Math.abs(p.z + 4.1),
        Math.abs(p.z + 1.7),
      ],
      nearest = options.indexOf(Math.min(...options));
    if (nearest === 0) p.x = -0.15;
    else if (nearest === 1) p.x = 2.65;
    else if (nearest === 2) p.z = -4.1;
    else p.z = -1.7;
  }
}
export function prepareUnrealReflections(
  scene: T.Scene,
  renderer: T.WebGLRenderer,
) {
  const generator = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    environment = generator.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.35;
  room.dispose();
  generator.dispose();
  // One bounded real scene probe captures local windows and artwork after loading.
  const cubeTarget = new T.WebGLCubeRenderTarget(256, {
    type: T.HalfFloatType,
    generateMipmaps: true,
    minFilter: T.LinearMipmapLinearFilter,
  });
  const probe = new T.CubeCamera(0.1, 70, cubeTarget);
  probe.position.set(1.25, 1.83, -2.9);
  const timer = setTimeout(() => {
    const hidden: T.Object3D[] = [];
    scene.traverse((o) => {
      if (
        o instanceof T.Mesh &&
        !Array.isArray(o.material) &&
        o.material instanceof T.MeshStandardMaterial &&
        o.material.metalness === 1
      ) {
        hidden.push(o);
        o.visible = false;
      }
    });
    probe.update(renderer, scene);
    hidden.forEach((o) => {
      o.visible = true;
      const m = (o as T.Mesh).material as T.MeshStandardMaterial;
      m.envMap = cubeTarget.texture;
      m.envMapIntensity = 1;
      m.needsUpdate = true;
    });
  }, 2200);
  return () => {
    clearTimeout(timer);
    scene.environment = null;
    environment.dispose();
    cubeTarget.dispose();
  };
}
