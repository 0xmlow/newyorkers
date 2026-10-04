/* The architecture kit: everything the rooms are built from. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as X from './textures';
import type { Piece } from './data';

export const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
export type Mount = {
  position: T.Vector3;
  rotation: number;
  target: T.Vector3;
  width: number;
  height: number;
  style?: FrameStyle;
  wash?: boolean;
  lookAt?: T.Vector3;
  tilt?: number;
};
export type FrameStyle = 'gilt' | 'steel' | 'oak' | 'white' | 'black' | 'neon' | 'none' | 'enamel';
export type KitOpts = {
  renderer: T.WebGLRenderer;
  quality: 'high' | 'low';
  reduced: boolean;
  atlas: (a: number) => Promise<T.Texture>;
  atlasGrid: number;
  perAtlas: number;
  hour: number;
  dynamic: boolean;
};

/* Set ?audit=1 on the museum URL and every hang reports its own overflow to the console.
   Turns a 111 room walk into a twenty minute pass. */
const AUDIT = typeof location !== 'undefined' && /[?&]audit=1/.test(location.search);

const gltf = new GLTFLoader();
/* meshopt compressed sets (room 182 loads a whole baked terminal) need the decoder; plain GLBs are unaffected */
gltf.setMeshoptDecoder(MeshoptDecoder);
const propCache = new Map<string, Promise<T.Group>>();
const thumbCache = new Map<string, Promise<T.Texture>>();
const texLoader = new T.TextureLoader();

export function loadThumb(url: string) {
  let p = thumbCache.get(url);
  if (!p) {
    p = new Promise((res, rej) => texLoader.load(url, (t) => {
      t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = 8;
      res(t);
    }, undefined, rej));
    thumbCache.set(url, p);
  }
  return p;
}

/* A landmark easter egg: a real feature of the real place, hidden in plain sight. Tap it and the
   museum tells you what it is. `id` is a slug unique within the room; `room` optionally names
   another museum room the card can walk you to. Every fact carries the source it was checked on. */
export type EggData = { id: string; title: string; text: string; clue: string; year?: string; source: { name: string; url: string }; room?: string };
export type Egg = { data: EggData; hit: T.Mesh; glint: T.Sprite | null; found: boolean; target: T.Object3D | null; center: T.Vector3; r?: number };
let glintTex: T.Texture | null = null;
function glintTexture() {
  if (glintTex) return glintTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const rad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rad.addColorStop(0, 'rgba(255,255,255,1)');
  rad.addColorStop(0.18, 'rgba(190,250,255,.85)');
  rad.addColorStop(0.5, 'rgba(0,229,255,.18)');
  rad.addColorStop(1, 'rgba(0,229,255,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,255,255,.9)';
  for (const [w, h] of [[3, 120], [120, 3]]) g.fillRect(64 - w / 2, 64 - h / 2, w, h);
  glintTex = markShared(new T.CanvasTexture(c));
  glintTex.colorSpace = T.SRGBColorSpace;
  return glintTex;
}

export class Kit {
  objects: T.Mesh[] = [];
  eggs: Egg[] = [];
  dynamic = new Set<T.Object3D>();
  clickables: T.Object3D[] = [];
  ticks: ((t: number, dt: number) => void)[] = [];
  live = true;
  private mats = new Map<string, T.Material>();
  private extras: T.Object3D[] = [];
  private rt: T.WebGLRenderTarget | null = null;
  private pmrem: T.PMREMGenerator | null = null;
  keepOut: { x: number; z: number; r: number }[] = [];
  blocks: { x0: number; x1: number; z0: number; z1: number }[] = [];
  pending: Promise<unknown>[] = [];
  /* 0 by day, 1 deep in the night, from the New York hour when the room is daylit */
  night = 0;
  /* every external asset a room touched, so a mint kit can copy exactly what it needs */
  used = { atlases: new Set<number>(), thumbs: new Set<string>(), props: new Set<string>(), images: new Set<string>() };
  dusk = 0;
  block(x0: number, x1: number, z0: number, z1: number) {
    this.blocks.push({ x0, x1, z0, z1 });
  }
  constructor(public scene: T.Scene, public o: KitOpts) {}

  /* ---------- materials ---------- */
  flat(color: number, metalness = 0, roughness = 0.7, extra: Partial<T.MeshStandardMaterialParameters> = {}) {
    const key = ['f', color, metalness, roughness, JSON.stringify(extra)].join(':');
    let m = this.mats.get(key) as T.MeshStandardMaterial;
    if (!m) {
      m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
      this.mats.set(key, m);
    }
    return m;
  }
  /* A textured surface with world-space UVs: density is tiles per scene unit. */
  pbr(
    name: string,
    s: X.Surface,
    density: number,
    p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; stretch?: number } = {},
  ) {
    const key = ['p', name, density, JSON.stringify({ ...p })].join(':');
    let m = this.mats.get(key) as T.MeshStandardMaterial;
    if (!m) {
      const { normal = 1, stretch = 1, ...rest } = p;
      const params: T.MeshStandardMaterialParameters = {
        map: s.map,
        normalMap: s.normalMap,
        roughnessMap: s.roughnessMap,
        normalScale: new T.Vector2(normal, normal),
        roughness: 1,
        metalness: 0,
        ...rest,
      };
      if (s.emissiveMap) params.emissiveMap = s.emissiveMap;
      m = new T.MeshStandardMaterial(params);
      if (stretch !== 1) {
        for (const t of [s.map, s.normalMap, s.roughnessMap, s.emissiveMap])
          if (t) {
            const c = t.clone();
            c.repeat.set(1, stretch);
            c.needsUpdate = true;
            if (t === s.map) m.map = c;
            else if (t === s.normalMap) m.normalMap = c;
            else if (t === s.roughnessMap) m.roughnessMap = c;
            else m.emissiveMap = c;
          }
      }
      m.userData.density = density;
      this.mats.set(key, m);
    }
    return m;
  }
  glow(color: number, opacity = 1) {
    const key = ['g', color, opacity].join(':');
    let m = this.mats.get(key) as T.MeshBasicMaterial;
    if (!m) {
      m = new T.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
      this.mats.set(key, m);
    }
    return m;
  }
  glass(color = 0xb9dde8, opacity = 0.22, roughness = 0.12) {
    const key = ['gl', color, opacity, roughness].join(':');
    let m = this.mats.get(key) as T.MeshPhysicalMaterial;
    if (!m) {
      m = new T.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity,
        roughness,
        metalness: 0.1,
        side: T.DoubleSide,
        depthWrite: false,
      });
      this.mats.set(key, m);
    }
    return m;
  }

  /* ---------- geometry ---------- */
  mesh(g: T.BufferGeometry, m: T.Material, x = 0, y = 0, z = 0, dynamic = false) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    this.scene.add(o);
    if (dynamic) this.dynamic.add(o);
    else this.objects.push(o);
    return o;
  }
  box(w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material) {
    return this.mesh(new T.BoxGeometry(w, h, d), m, x, y, z);
  }
  cyl(r: number, h: number, x: number, y: number, z: number, m: T.Material, r2 = r, seg = 18) {
    return this.mesh(new T.CylinderGeometry(r2, r, h, seg), m, x, y, z);
  }
  sphere(r: number, x: number, y: number, z: number, m: T.Material, seg = 14) {
    return this.mesh(new T.SphereGeometry(r, seg, Math.max(6, seg * 0.7)), m, x, y, z);
  }
  plane(w: number, h: number, x: number, y: number, z: number, m: T.Material, rotY = 0, rotX = 0) {
    const o = this.mesh(new T.PlaneGeometry(w, h), m, x, y, z);
    o.rotation.set(rotX, rotY, 0);
    return o;
  }
  rounded(w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material, r = 0.06) {
    const s = new T.Shape();
    const a = w / 2,
      b = h / 2;
    r = Math.min(r, a * 0.4, b * 0.4);
    s.moveTo(-a + r, -b);
    s.lineTo(a - r, -b);
    s.quadraticCurveTo(a, -b, a, -b + r);
    s.lineTo(a, b - r);
    s.quadraticCurveTo(a, b, a - r, b);
    s.lineTo(-a + r, b);
    s.quadraticCurveTo(-a, b, -a, b - r);
    s.lineTo(-a, -b + r);
    s.quadraticCurveTo(-a, -b, -a + r, -b);
    const g = new T.ExtrudeGeometry(s, {
      depth: d,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: r * 0.2,
      bevelThickness: r * 0.2,
      curveSegments: 5,
    });
    g.translate(0, 0, -d / 2);
    return this.mesh(g, m, x, y, z);
  }
  lathe(profile: number[][], x: number, y: number, z: number, m: T.Material, segments = 24) {
    return this.mesh(new T.LatheGeometry(profile.map((p) => new T.Vector2(p[0], p[1])), segments), m, x, y, z);
  }
  beam(a: T.Vector3, b: T.Vector3, r: number, m: T.Material, seg = 7) {
    const o = this.mesh(new T.CylinderGeometry(r, r, a.distanceTo(b), seg), m);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return o;
  }
  bar(a: T.Vector3, b: T.Vector3, w: number, h: number, m: T.Material) {
    const o = this.mesh(new T.BoxGeometry(w, a.distanceTo(b), h), m);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return o;
  }
  curve(points: T.Vector3[], r: number, m: T.Material, segments = 48, closed = false) {
    return this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points, closed), segments, r, 7, closed), m);
  }
  torus(r: number, tube: number, x: number, y: number, z: number, m: T.Material, seg = 48) {
    return this.mesh(new T.TorusGeometry(r, tube, 8, seg), m, x, y, z);
  }
  /* A genuine opening cut from an extruded solid. */
  arch(w: number, h: number, depth: number, x: number, y: number, z: number, m: T.Material, pointed = false, margin = 0.65) {
    const s = new T.Shape();
    s.moveTo(-w * margin, 0);
    s.lineTo(w * margin, 0);
    s.lineTo(w * margin, h * 1.13);
    s.lineTo(-w * margin, h * 1.13);
    s.closePath();
    const hole = new T.Path();
    hole.moveTo(-w / 2, 0.05);
    hole.lineTo(-w / 2, h * 0.65);
    if (pointed) {
      hole.quadraticCurveTo(-w * 0.4, h * 0.91, 0, h);
      hole.quadraticCurveTo(w * 0.4, h * 0.91, w / 2, h * 0.65);
    } else hole.absellipse(0, h * 0.65, w / 2, h * 0.35, Math.PI, 0, true);
    hole.lineTo(w / 2, 0.05);
    hole.closePath();
    s.holes.push(hole);
    const g = new T.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      bevelSegments: 2,
      curveSegments: 24,
    });
    g.translate(0, 0, -depth / 2);
    return this.mesh(g, m, x, y, z);
  }
  /* A wall pierced by a row of arches, one extrusion. */
  arcade(len: number, h: number, depth: number, bays: number, bayW: number, bayH: number, x: number, y: number, z: number, m: T.Material, rotY = 0, pointed = false) {
    const s = new T.Shape();
    s.moveTo(-len / 2, 0);
    s.lineTo(len / 2, 0);
    s.lineTo(len / 2, h);
    s.lineTo(-len / 2, h);
    s.closePath();
    const pitch = len / bays;
    for (let i = 0; i < bays; i++) {
      const cx = -len / 2 + pitch * (i + 0.5);
      const hole = new T.Path();
      hole.moveTo(cx - bayW / 2, 0.02);
      hole.lineTo(cx - bayW / 2, bayH - bayW / 2);
      if (pointed) {
        hole.quadraticCurveTo(cx - bayW * 0.4, bayH - bayW * 0.1, cx, bayH);
        hole.quadraticCurveTo(cx + bayW * 0.4, bayH - bayW * 0.1, cx + bayW / 2, bayH - bayW / 2);
      } else hole.absarc(cx, bayH - bayW / 2, bayW / 2, Math.PI, 0, true);
      hole.lineTo(cx + bayW / 2, 0.02);
      hole.closePath();
      s.holes.push(hole);
    }
    const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 20 });
    g.translate(0, 0, -depth / 2);
    const o = this.mesh(g, m, x, y, z);
    o.rotation.y = rotY;
    return o;
  }
  /* Profiled cornice or moulding swept along a straight run. */
  moulding(profile: [number, number][], len: number, x: number, y: number, z: number, m: T.Material, rotY = 0) {
    const s = new T.Shape();
    s.moveTo(profile[0][0], profile[0][1]);
    for (const p of profile.slice(1)) s.lineTo(p[0], p[1]);
    s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    const o = this.mesh(g, m, x, y, z);
    o.rotation.y = rotY;
    return o;
  }
  column(x: number, y: number, z: number, h: number, r: number, m: T.Material, fluted = false, cap: T.Material = m) {
    const shaft = this.lathe(
      [[r * 1.45, 0], [r * 1.45, 0.1], [r * 1.1, 0.2], [r * 0.92, 0.35], [r * 0.82, h - 0.4], [r * 0.9, h - 0.3]],
      x, y, z, m, 20,
    );
    this.lathe([[r * 0.9, 0], [r * 1.35, 0.14], [r * 1.5, 0.3], [r * 1.5, 0.42]], x, y + h - 0.42, z, cap, 20);
    if (fluted)
      for (let k = 0; k < 14; k++) {
        const t = (k / 14) * Math.PI * 2;
        this.beam(v(x + Math.cos(t) * r * 0.85, y + 0.45, z + Math.sin(t) * r * 0.85), v(x + Math.cos(t) * r * 0.79, y + h - 0.5, z + Math.sin(t) * r * 0.79), r * 0.09, cap, 5);
      }
    return shaft;
  }
  sign(text: string, w: number, h: number, x: number, y: number, z: number, bg: string, fg: string, size: number, rotY = 0, opts: { border?: boolean; font?: string; double?: boolean } = {}) {
    const t = X.signText(text, 1024, Math.max(64, Math.round((1024 * h) / w)), bg, fg, size, opts);
    const o = this.mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, side: opts.double ? T.DoubleSide : T.FrontSide, transparent: bg === 'transparent' }), x, y, z, true);
    o.rotation.y = rotY;
    this.extras.push(o);
    return o;
  }
  /* ---------- the house marks ---------- */
  /* Every room carries the identity, and it is placed from the room's own
     spawn and look so no room has to position anything by hand: a plaque
     standing beside the visitor where they arrive, carrying the MLOW mark, the
     room name and a Blossom icon, and the eye set into the ground a few paces
     ahead so it reads in the first frame. Both are clamped inside the room's
     walkable bounds, so a room with tight geometry cannot push them into a
     wall. */
  brand(b: { spawn: T.Vector3; look: T.Vector3; bounds: [number, number, number, number]; floorY?: (x: number, z: number) => number }, roomName: string) {
    const B = 'assets/brand/';
    const at = (x: number, z: number) => (b.floorY ? b.floorY(x, z) : 0);
    const cl = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
    const [x0, x1, z0, z1] = b.bounds;
    const f = new T.Vector3().subVectors(b.look, b.spawn).setY(0);
    if (f.lengthSq() < 1e-6) f.set(0, 0, -1);
    f.normalize();
    const right = new T.Vector3(-f.z, 0, f.x);
    const facing = Math.atan2(-f.x, -f.z);
    const out = new T.Vector3(-f.x, 0, -f.z);

    /* the arrival plaque */
    const px = cl(b.spawn.x + right.x * 1.85 + f.x * 1.15, x0 + 0.7, x1 - 0.7),
      pz = cl(b.spawn.z + right.z * 1.85 + f.z * 1.15, z0 + 0.7, z1 - 0.7),
      py = at(px, pz);
    const ink = this.flat(0x0d0d0d, 0.15, 0.5),
      post = this.flat(0x2a3040, 0.65, 0.4);
    this.cyl(0.04, 1.08, px, py + 0.54, pz, post);
    this.cyl(0.17, 0.05, px, py + 0.03, pz, post);
    const plate = this.box(1.24, 0.78, 0.05, px, py + 1.46, pz, ink);
    plate.rotation.y = facing;
    const face = (d: number) => ({ x: px + out.x * d, z: pz + out.z * d });
    const lw = 0.86,
      l1 = face(0.035);
    const logo = this.mesh(new T.PlaneGeometry(lw, lw / 4.03), this.image(B + 'logo_white.png', { emissive: 0xdfe8f5 }), l1.x, py + 1.66, l1.z);
    logo.rotation.y = facing;
    this.extras.push(logo);
    this.sign(roomName.toUpperCase(), 1.02, 0.115, l1.x, py + 1.45, l1.z, 'transparent', '#8899AA', 72, facing, { double: true });
    this.sign('NEW YORKERS  ·  A CENSUS BY MLOW  ·  WITH BLOSSOM', 1.06, 0.072, l1.x, py + 1.28, l1.z, 'transparent', '#2962FF', 54, facing, { double: true });
    const bl = face(0.032);
    const bloss = this.mesh(new T.PlaneGeometry(0.2, 0.2), this.image(B + 'blossom_03_white.png'), bl.x + right.x * 0.5, py + 1.13, bl.z + right.z * 0.5);
    bloss.rotation.y = facing;
    this.extras.push(bloss);
    this.keepOut.push({ x: px, z: pz, r: 0.5 });

    /* the eye, set into the ground a few paces along the walk */
    const ex = cl(b.spawn.x + f.x * 3.6, x0 + 1.0, x1 - 1.0),
      ez = cl(b.spawn.z + f.z * 3.6, z0 + 1.0, z1 - 1.0);
    const ey = at(ex, ez);
    const ring = this.mesh(new T.RingGeometry(1.34, 1.5, 64), this.flat(0x2962ff, 0.2, 0.45), ex, ey + 0.014, ez);
    ring.rotation.x = -Math.PI / 2;
    const eye = this.mesh(new T.PlaneGeometry(2.3, 2.3), this.image(B + 'eye_truecolor.png', { emissive: 0x2962ff }), ex, ey + 0.02, ez);
    eye.rotation.set(-Math.PI / 2, 0, -Math.atan2(f.x, f.z));
    this.extras.push(eye);
    this.extras.push(ring);

    /* the house banner on the wall behind the visitor, so the mark is in the room and not only underfoot.
       It sits along the reverse of the opening look vector, which is by construction outside the opening shot,
       and is dropped whenever that point falls outside the room or the room is too small to carry it. */
    const wide = x1 - x0, deep = z1 - z0;
    if (wide > 11 && deep > 11) {
      const bx = b.spawn.x + out.x * 7.4, bz = b.spawn.z + out.z * 7.4;
      if (bx > x0 + 0.6 && bx < x1 - 0.6 && bz > z0 + 0.6 && bz < z1 - 0.6) {
        const by = at(bx, bz) + 3.15;
        const bLogo = this.mesh(new T.PlaneGeometry(3.2, 3.2 / 4.03), this.image(B + 'logo_white.png', { emissive: 0xdfe8f5 }), bx, by, bz);
        bLogo.rotation.y = facing + Math.PI;
        this.extras.push(bLogo);
        for (const sgn of [-1, 1]) {
          const fx = bx + right.x * sgn * 2.55, fz = bz + right.z * sgn * 2.55;
          const fl = this.mesh(new T.PlaneGeometry(0.66, 0.66), this.image(B + (sgn < 0 ? 'blossom_01_white.png' : 'blossom_05_white.png')), fx, by - 0.04, fz);
          fl.rotation.y = facing + Math.PI;
          this.extras.push(fl);
        }
        this.sign('EVERY NEW YORKER GETS A PORTRAIT  ·  EVEN THE VILLAINS', 4.2, 0.24, bx, by - 0.72, bz, 'transparent', '#8899aa', 46, facing + Math.PI, { double: true });
      }
    }
  }

  /* ---------- landmark eggs ---------- */
  /* Hide a landmark egg on an object, or at a point. An object is pulled out of the static merge so
     it keeps its own identity; a point gets an invisible tap target of radius r. Either way the egg
     is a hidden sphere the tap ray can find (and walls in front of it block), plus a slow glint so a
     visitor on a phone knows there is something to tap. Place the object before calling this. */
  egg(target: T.Object3D | T.Vector3, data: EggData, p: { r?: number; glint?: boolean } = {}) {
    let obj: T.Object3D | null = null;
    if (target instanceof T.Object3D) {
      obj = target;
      const i = this.objects.indexOf(target as T.Mesh);
      if (i >= 0) { this.objects.splice(i, 1); this.dynamic.add(target); }
    }
    const hit = new T.Mesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true }));
    hit.visible = false;               // the ray still finds it; the renderer and the GLB export do not
    hit.userData.egg = data;
    this.scene.add(hit);
    this.clickables.push(hit);
    let glint: T.Sprite | null = null;
    if (p.glint !== false) {
      glint = new T.Sprite(new T.SpriteMaterial({ map: glintTexture(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 }));
      glint.renderOrder = 3;
      this.scene.add(glint);
    }
    const e: Egg = { data, hit, glint, found: false, target: obj, center: target instanceof T.Vector3 ? target.clone() : new T.Vector3(), r: p.r };
    this.eggs.push(e);
    this.placeEgg(e);
    return e;
  }
  private placeEgg(e: Egg) {
    let r = e.r ?? 0.8;
    if (e.target) {
      e.target.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(e.target);
      if (!bb.isEmpty()) {
        bb.getCenter(e.center);
        r = e.r ?? T.MathUtils.clamp(bb.getSize(new T.Vector3()).length() / 2, 0.5, 3);
      }
    }
    e.hit.position.copy(e.center);
    e.hit.scale.setScalar(r);
    e.hit.updateMatrixWorld(true);   // tappable before the first frame renders
    if (e.glint) {
      e.glint.position.set(e.center.x, e.center.y + Math.min(r, 1.6) * 0.55 + 0.3, e.center.z);
      e.glint.scale.setScalar(0.55);
    }
  }
  /* Mark which eggs this visitor has already found; found eggs stop glinting. */
  markEggs(found: (id: string) => boolean) {
    for (const e of this.eggs) { e.found = found(e.data.id); if (e.glint) e.glint.visible = !e.found; }
  }
  showGlints(on: boolean) {
    for (const e of this.eggs) if (e.glint) e.glint.visible = on && !e.found;
  }

  instances(g: T.BufferGeometry, m: T.Material, transforms: T.Matrix4[]) {
    const o = new T.InstancedMesh(g, m, transforms.length);
    transforms.forEach((t, i) => o.setMatrixAt(i, t));
    o.instanceMatrix.needsUpdate = true;
    o.computeBoundingSphere();
    o.castShadow = o.receiveShadow = this.o.quality === 'high';
    this.scene.add(o);
    this.dynamic.add(o);
    return o;
  }
  add(o: T.Object3D) {
    this.scene.add(o);
    this.dynamic.add(o);
    return o;
  }

  /* A material carrying an image file (logos, marks, posters). Loads through pending so exports wait for it. */
  image(url: string, p: { emissive?: number; color?: number; opaque?: boolean; roughness?: number } = {}) {
    const m = new T.MeshStandardMaterial({ color: p.color ?? 0xffffff, roughness: p.roughness ?? 0.6, metalness: 0, transparent: !p.opaque, alphaTest: p.opaque ? 0 : 0.05, side: T.DoubleSide });
    const load = new Promise<void>((res) => new T.TextureLoader().load(url, (t) => {
      t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
      m.map = t;
      if (p.emissive) { m.emissive = new T.Color(p.emissive); m.emissiveMap = t; m.emissiveIntensity = 1.2; }
      m.needsUpdate = true; res();
    }, undefined, () => res()));
    this.pending.push(load);
    this.used.images.add(url);
    return m;
  }

  /* ---------- motion helpers (v3) ---------- */
  /* A smooth curve through points: rides, boats, trains, crowds. */
  spline(points: T.Vector3[], closed = false, tension = 0.5) {
    return new T.CatmullRomCurve3(points, closed, 'catmullrom', tension);
  }
  /* Keep an object moving along a curve forever, nose along the tangent. speed in metres per second, or a function of height for coasters. */
  rider(obj: T.Object3D, curve: T.Curve<T.Vector3>, speed: number | ((y: number) => number), offset = 0) {
    const len = curve.getLength();
    let s = ((offset % len) + len) % len;
    const tan = new T.Vector3();
    const step = (_t: number, dt: number) => {
      const v = typeof speed === 'function' ? speed(obj.position.y) : speed;
      s = (s + v * Math.min(dt, 0.1) + len) % len;
      const u = s / len;
      curve.getPointAt(u, obj.position);
      curve.getTangentAt(u, tan);
      obj.lookAt(tan.add(obj.position));
    };
    step(0, 0);
    this.ticks.push(step);
    return obj;
  }
  /* People: instanced capsule figures walking a route in both directions, each with a colour, a height and a stride bob. */
  crowd(route: T.Vector3[], n: number, p: { seed?: number; speed?: number; spread?: number; scale?: number; colors?: number[]; animate?: boolean; closed?: boolean } = {}) {
    const { seed = 1, speed = 1.1, spread = 1.2, scale = 1, animate = true, closed = false, colors = [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x4a6a3a, 0x151517, 0xc9a25a, 0x6a4a8a, 0xe6e2da, 0x2b5f6e] } = p;
    const rnd = X.mulberry(seed);
    const curve = new T.CatmullRomCurve3(route, closed, 'catmullrom', 0.5);
    const len = curve.getLength();
    const body = new T.InstancedMesh(new T.CapsuleGeometry(0.2 * scale, 0.82 * scale, 3, 8), new T.MeshStandardMaterial({ roughness: 0.85 }), n);
    const head = new T.InstancedMesh(new T.SphereGeometry(0.125 * scale, 10, 8), new T.MeshStandardMaterial({ roughness: 0.7 }), n);
    const skins = [0xf1d3b5, 0xc8a284, 0x8d5a3b, 0x5a3a26, 0xe9c2a0, 0xa77653];
    const st = Array.from({ length: n }, () => ({ s: rnd() * len, v: speed * (0.7 + rnd() * 0.6) * (rnd() > 0.5 ? 1 : -1), off: (rnd() - 0.5) * spread, h: 0.88 + rnd() * 0.24 }));
    const c = new T.Color();
    for (let i = 0; i < n; i++) { body.setColorAt(i, c.set(colors[Math.floor(rnd() * colors.length)])); head.setColorAt(i, c.set(skins[Math.floor(rnd() * skins.length)])); }
    body.castShadow = head.castShadow = this.o.quality === 'high';
    this.add(body); this.add(head);
    const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), tan = new T.Vector3(), side = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0), lift = new T.Vector3();
    const place = (t: number, dt: number) => {
      for (let i = 0; i < n; i++) {
        const a = st[i];
        a.s = (((a.s + a.v * Math.min(dt, 0.1)) % len) + len) % len;
        const u = a.s / len;
        curve.getPointAt(u, pos); curve.getTangentAt(u, tan);
        side.set(-tan.z, 0, tan.x).normalize();
        pos.addScaledVector(side, a.off);
        const dir = Math.sign(a.v) || 1;
        q.setFromAxisAngle(up, Math.atan2(tan.x * dir, tan.z * dir));
        const bob = 1 + 0.025 * Math.sin(t * 7 + i * 1.3);
        sc.set(1, a.h * bob, 1);
        lift.set(0, 0.61 * a.h * scale * bob, 0);
        m.compose(pos.clone().add(lift), q, sc); body.setMatrixAt(i, m);
        lift.set(0, (1.22 * a.h * bob + 0.13) * scale, 0);
        sc.set(1, 1, 1);
        m.compose(pos.clone().add(lift), q, sc); head.setMatrixAt(i, m);
      }
      body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
    };
    place(0, 0);
    if (animate) this.ticks.push(place);
    return { body, head };
  }

  /* ---------- world ---------- */
  sky(p: { top: number; horizon: number; ground: number; fog?: number; sun?: { az: number; el: number; color: number; size: number }; stars?: number; haze?: number; env?: number }) {
    if (this.o.dynamic) {
      const h = this.o.hour;
      const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      this.night = Math.max(smooth(18.5, 21.5, h), 1 - smooth(4.5, 7.5, h));
      this.dusk = Math.max(smooth(16.5, 19, h) * (1 - smooth(19, 21.5, h)), smooth(4.5, 6, h) * (1 - smooth(6, 8, h)));
      const n = this.night, d = this.dusk;
      const mixc = (a: number, b: number, t: number) => new T.Color(a).lerp(new T.Color(b), t).getHex();
      p = { ...p };
      p.top = mixc(mixc(p.top, 0x9a6f8a, d * 0.5), 0x05070f, n);
      p.horizon = mixc(mixc(p.horizon, 0xf0a06a, d * 0.55), 0x121a2c, n * 0.9);
      p.ground = mixc(p.ground, 0x07090e, n * 0.8);
      p.stars = Math.max(p.stars || 0, Math.round(900 * Math.max(0, n - 0.2)));
      if (n > 0.55) p.sun = { az: 2.4, el: 0.6, color: 0xdfe8ff, size: 6 };
      else if (p.sun && d > 0) p.sun = { ...p.sun, color: mixc(p.sun.color, 0xff9a55, d), el: Math.max(0.04, p.sun.el * (1 - d * 0.7)), size: p.sun.size * (1 + d * 0.6) };
      p.env = (p.env ?? 0.55) * (1 - 0.6 * n);
      p.fog = (p.fog ?? 0.004) * (1 + 0.6 * n);
    }
    const tex = X.skyCanvas(p.top, p.horizon, p.ground, { sun: p.sun, stars: p.stars, haze: p.haze });
    this.scene.background = new T.Color(p.horizon);
    this.scene.fog = new T.FogExp2(p.horizon, p.fog ?? 0.004);
    const dome = new T.Mesh(new T.SphereGeometry(700, 48, 24), new T.MeshBasicMaterial({ map: tex, side: T.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -10;
    this.add(dome);
    this.pmrem = new T.PMREMGenerator(this.o.renderer);
    this.rt = this.pmrem.fromEquirectangular(tex);
    this.scene.environment = this.rt.texture;
    this.scene.environmentIntensity = p.env ?? 0.55;
    return tex;
  }
  hemi(skyColor: number, ground: number, intensity: number) {
    const l = new T.HemisphereLight(skyColor, ground, intensity * (1 - 0.65 * this.night));
    this.add(l);
    return l;
  }
  sun(color: number, intensity: number, x: number, y: number, z: number, shadow = true, span = 60) {
    if (this.night > 0.55) { color = 0xb8c6ff; intensity = intensity * 0.28; }
    else if (this.dusk > 0) { color = new T.Color(color).lerp(new T.Color(0xff9a55), this.dusk).getHex(); intensity *= 1 - 0.35 * this.dusk; }
    const l = new T.DirectionalLight(color, intensity * (1 - 0.5 * this.night));
    l.position.set(x, y, z);
    l.target.position.set(0, 0, -20);
    this.add(l);
    this.add(l.target);
    if (shadow && this.o.quality === 'high') {
      l.castShadow = true;
      l.shadow.mapSize.set(2048, 2048);
      l.shadow.camera.near = 1;
      l.shadow.camera.far = 260;
      l.shadow.camera.left = l.shadow.camera.bottom = -span;
      l.shadow.camera.right = l.shadow.camera.top = span;
      l.shadow.bias = -0.0008;
      l.shadow.normalBias = 0.04;
      l.shadow.radius = 3;
    }
    return l;
  }
  point(x: number, y: number, z: number, color = 0xffd9a0, intensity = 30, distance = 20, decay = 2) {
    const l = new T.PointLight(color, intensity, distance, decay);
    l.position.set(x, y, z);
    this.add(l);
    return l;
  }
  spot(x: number, y: number, z: number, tx: number, ty: number, tz: number, color = 0xfff1d6, intensity = 120, angle = 0.5, penumbra = 0.5, distance = 30) {
    const l = new T.SpotLight(color, intensity, distance, angle, penumbra, 1.6);
    l.position.set(x, y, z);
    l.target.position.set(tx, ty, tz);
    this.add(l);
    this.add(l.target);
    return l;
  }
  /* Additive light pool painted on a wall behind a work. */
  wash(x: number, y: number, z: number, rotY: number, w: number, h: number, color = 0xffffff, opacity = 0.9) {
    const m = new T.MeshBasicMaterial({ map: X.pool(), color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false });
    const o = this.mesh(new T.PlaneGeometry(w, h), m, x, y, z, true);
    o.rotation.y = rotY;
    o.renderOrder = 2;
    this.extras.push(o);
    return o;
  }

  /* Distant towers with lit windows, merged into one mesh. */
  skyline(p: { z: number; count?: number; spacing?: number; scale?: number; base?: number; seed?: number; lit?: number; warm?: boolean; tint?: number; glow?: number; spires?: boolean; x?: number; rows?: number }) {
    let { z, count = 28, spacing = 4.6, scale = 1, base = -4, seed = 1, lit = 0.35, warm = true, tint = 0x26313d, glow = 1.3, spires = true, x: x0 = 0, rows = 2 } = p;
    glow = glow * (1 + 2.2 * this.night);
    if (this.night > 0.3) lit = Math.min(0.6, lit + 0.2 * this.night);
    const r = X.mulberry(seed * 31 + 7);
    const facade = this.pbr('win' + seed + tint + lit, X.windows(seed, lit, tint, warm), 0.11, { emissive: 0xffffff, emissiveIntensity: glow, roughness: 0.6, stretch: 0.42 });
    const roof = this.flat(0x161b22, 0.2, 0.8);
    for (let row = 0; row < rows; row++)
      for (let i = 0; i < count; i++) {
        const w = (2.6 + r() * 2.4) * scale,
          h = (8 + r() * 26 + (Math.abs(i - count / 2) < 4 ? 10 : 0)) * scale,
          x = x0 + (i - count / 2) * spacing * scale + (r() - 0.5) * 2,
          zz = z - row * 14 * scale - r() * 6,
          d = (2.5 + r() * 3) * scale;
        this.box(w, h, d, x, base + h / 2, zz, facade);
        this.box(w + 0.1, 0.25, d + 0.1, x, base + h, zz, roof);
        if (spires && r() > 0.72) {
          for (let k = 1; k <= 3; k++) this.box(w - k * w * 0.22, 1.6 * scale, d - k * d * 0.22, x, base + h + k * 1.6 * scale, zz, facade);
          this.cyl(0.05 * scale, 6 * scale, x, base + h + 3 * 1.6 * scale + 3 * scale, zz, roof, 0.03, 6);
        }
      }
  }
  water(p: { y: number; color?: number; w?: number; d?: number; x?: number; z?: number; amp?: number }) {
    const { y, color = 0x2a4d63, w = 320, d = 260, x = 0, z = -70, amp = 1 } = p;
    const g = new T.PlaneGeometry(w, d, 64, 52);
    g.rotateX(-Math.PI / 2);
    const m = new T.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.3, envMapIntensity: 1.0 });
    const o = this.mesh(g, m, x, y, z, true);
    o.receiveShadow = true;
    if (!this.o.reduced) {
      const a = g.attributes.position as T.BufferAttribute,
        start = Float32Array.from(a.array as Float32Array);
      this.ticks.push((t) => {
        for (let i = 0; i < a.count; i++) {
          const px = start[i * 3],
            pz = start[i * 3 + 2];
          a.setY(i, start[i * 3 + 1] + Math.sin(px * 0.25 + t * 0.7) * 0.11 * amp + Math.cos(pz * 0.19 + t * 0.5) * 0.09 * amp + Math.sin((px + pz) * 0.12 + t * 0.35) * 0.06 * amp);
        }
        a.needsUpdate = true;
        g.computeVertexNormals();
      });
    }
    return o;
  }
  tree(x: number, y: number, z: number, p: { h?: number; r?: number; kind?: 'round' | 'palm' | 'bare' | 'column'; seed?: number; leaf?: number } = {}) {
    const { h = 4, r = 1.6, kind = 'round', seed = 1, leaf = 0x3f6b3e } = p;
    const rnd = X.mulberry(seed + Math.round(x * 13 + z * 7));
    const bark = this.pbr('bark', X.bark(), 0.7, { roughness: 1 });
    const leaves = this.flat(leaf, 0, 0.95);
    const trunkR = r * 0.09 + 0.06;
    this.lathe([[trunkR * 1.6, 0], [trunkR, h * 0.12], [trunkR * 0.75, h * 0.7], [trunkR * 0.45, h]], x, y, z, bark, 9);
    if (kind === 'palm') {
      for (let k = 0; k < 9; k++) {
        const t = (k / 9) * Math.PI * 2 + rnd(),
          dip = 0.4 + rnd() * 0.5;
        const pts = [v(x, y + h, z), v(x + Math.cos(t) * r * 0.6, y + h + r * 0.35, z + Math.sin(t) * r * 0.6), v(x + Math.cos(t) * r * 1.3, y + h - r * dip, z + Math.sin(t) * r * 1.3)];
        const frond = this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.05, 5), leaves);
        void frond;
        for (let j = 1; j < 7; j++) {
          const u = j / 7,
            p0 = new T.CatmullRomCurve3(pts).getPoint(u);
          for (const s of [-1, 1]) {
            const b = this.mesh(new T.PlaneGeometry(0.16, r * 0.55), leaves);
            b.position.copy(p0);
            b.rotation.set(-0.9 * s, -t, s * 1.3);
            b.material = this.flat(leaf, 0, 0.95, { side: T.DoubleSide });
          }
        }
      }
      return;
    }
    if (kind === 'bare') {
      for (let k = 0; k < 6; k++) {
        const t = rnd() * Math.PI * 2;
        this.beam(v(x, y + h * 0.8, z), v(x + Math.cos(t) * r, y + h + rnd() * r, z + Math.sin(t) * r), trunkR * 0.35, bark, 5);
      }
      return;
    }
    const blobs = kind === 'column' ? 5 : 4;
    for (let k = 0; k < blobs; k++) {
      const g = new T.IcosahedronGeometry(r * (kind === 'column' ? 0.55 : 0.75 + rnd() * 0.3), 1);
      const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const s = 0.82 + rnd() * 0.36;
        pa.setXYZ(i, pa.getX(i) * s, pa.getY(i) * s * (kind === 'column' ? 1.6 : 0.85), pa.getZ(i) * s);
      }
      g.computeVertexNormals();
      const ox = kind === 'column' ? 0 : (rnd() - 0.5) * r * 1.1,
        oz = kind === 'column' ? 0 : (rnd() - 0.5) * r * 1.1,
        oy = kind === 'column' ? h * 0.35 + k * r * 0.8 : h + rnd() * r * 0.6;
      this.mesh(g, leaves, x + ox, y + oy, z + oz);
    }
  }
  bench(x: number, z: number, rotY: number, slats: T.Material, frame: T.Material, len = 2.2) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const mk = (w: number, h: number, d: number, px: number, py: number, pz: number, m: T.Material) => {
      const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      o.position.set(px, py, pz);
      g.add(o);
    };
    for (let j = 0; j < 4; j++) mk(0.12, 0.05, len, j * 0.15 - 0.22, 0.62, 0, slats);
    for (let j = 0; j < 3; j++) mk(0.05, 0.13, len, 0.42 + j * 0.02, 0.85 + j * 0.15, 0, slats);
    for (const dz of [-len / 2 + 0.2, len / 2 - 0.2]) {
      mk(0.72, 0.06, 0.07, 0.05, 0.6, dz, frame);
      mk(0.06, 0.6, 0.07, -0.28, 0.3, dz, frame);
      mk(0.06, 0.6, 0.07, 0.38, 0.3, dz, frame);
      mk(0.06, 0.65, 0.07, 0.46, 0.95, dz, frame);
    }
    this.scene.add(g);
    this.dynamic.add(g);
    this.keepOut.push({ x, z, r: 0.9 });
    return g;
  }
  rail(x: number, z: number, len: number, m: T.Material, y = 1.1, along: 'z' | 'x' = 'z', posts = 1.5) {
    for (let p = -len / 2; p <= len / 2; p += posts)
      along === 'z' ? this.box(0.05, y, 0.05, x, y / 2, z + p, m) : this.box(0.05, y, 0.05, x + p, y / 2, z, m);
    for (const yy of [y, y * 0.55])
      along === 'z' ? this.box(0.07, 0.07, len, x, yy, z, m) : this.box(len, 0.07, 0.07, x, yy, z, m);
  }
  lamp(x: number, z: number, h: number, post: T.Material, color = 0xffd7a0, intensity = 28) {
    this.lathe([[0.2, 0], [0.2, 0.08], [0.1, 0.16], [0.06, h - 0.3], [0.09, h - 0.2], [0.04, h]], x, 0, z, post, 10);
    this.sphere(0.24, x, h + 0.15, z, this.glow(color), 12);
    this.point(x, h + 0.1, z, color, intensity, 16);
    this.keepOut.push({ x, z, r: 0.4 });
  }
  plinth(x: number, z: number, w: number, h: number, d: number, m: T.Material) {
    this.box(w, h, d, x, h / 2, z, m);
    this.box(w + 0.16, 0.08, d + 0.16, x, h + 0.04, z, m);
    this.keepOut.push({ x, z, r: Math.max(w, d) * 0.7 });
  }

  /* ---------- props from the enamel kit ---------- */
  prop(name: string, x: number, y: number, z: number, p: { height?: number; rotY?: number; scale?: number; keepOut?: number } = {}) {
    let load = propCache.get(name);
    if (!load) {
      load = new Promise((res, rej) => gltf.load(`assets/museum/props/${name}.glb`, (g) => res(g.scene), undefined, rej));
      propCache.set(name, load);
    }
    if (p.keepOut) this.keepOut.push({ x, z, r: p.keepOut });
    this.used.props.add(name);
    this.pending.push(load);
    return load.then((src) => {
      if (!this.live) return null;
      const o = src.clone(true);
      const bb = new T.Box3().setFromObject(o),
        size = bb.getSize(new T.Vector3());
      const s = p.height ? p.height / size.y : p.scale ?? 1.7;
      o.scale.setScalar(s);
      o.position.set(x, y - bb.min.y * s, z);
      o.rotation.y = p.rotY ?? 0;
      o.traverse((c) => {
        if (c instanceof T.Mesh) {
          // The cache owns source resources; each room disposes its own copies.
          c.geometry = c.geometry.clone();
          c.material = Array.isArray(c.material) ? c.material.map(m => m.clone()) : c.material.clone();
          for (const material of (Array.isArray(c.material) ? c.material : [c.material])) {
            for (const value of Object.values(material)) if (value instanceof T.Texture) markShared(value);
          }
          c.castShadow = c.receiveShadow = this.o.quality === 'high';
          const m = c.material as T.MeshStandardMaterial;
          if (m && 'envMapIntensity' in m) m.envMapIntensity = 1.2;
        }
      });
      this.scene.add(o);
      this.dynamic.add(o);
      return o;
    }).catch(() => null);
  }

  /* ---------- the census wall: hundreds of New Yorkers from one atlas ---------- */
  /* `indices`, when given, is an explicit list of positions in the whole census (P) to hang in
     order, from any atlas, instead of a run from `start`; one draw call per atlas touched.
     `centerLast` centres a short last row, so a count that does not fill the grid reads as
     set that way rather than as a missing tile. */
  censusWall(p: { x: number; y: number; z: number; rotY: number; cols: number; rows: number; tile: number; gap?: number; start: number; pieces: Piece[]; backing?: T.Material; tilt?: number; indices?: number[]; centerLast?: boolean }) {
    const { x, y, z, rotY, cols, rows, tile, gap = tile * 0.08, start, pieces, backing, tilt = 0, indices, centerLast = false } = p;
    const N = this.o.perAtlas,
      G = this.o.atlasGrid;
    const groups = new Map<number, { pos: number[]; uv: number[]; idx: number[] }>();
    const W = cols * (tile + gap) - gap,
      H = rows * (tile + gap) - gap;
    const total = Math.min(cols * rows, indices ? indices.length : pieces.length - start);
    const lastRow = Math.floor((total - 1) / cols), lastCount = total - lastRow * cols;
    for (let k = 0; k < total; k++) {
      const shift = centerLast && Math.floor(k / cols) === lastRow ? ((cols - lastCount) * (tile + gap)) / 2 : 0;
      const gi = indices ? indices[k] : start + k,
        a = Math.floor(gi / N),
        local = gi % N,
        col = local % G,
        row = Math.floor(local / G);
      const grp = groups.get(a) || { pos: [], uv: [], idx: [] };
      groups.set(a, grp);
      const cx = -W / 2 + shift + (k % cols) * (tile + gap) + tile / 2,
        cy = H / 2 - Math.floor(k / cols) * (tile + gap) - tile / 2,
        h2 = tile / 2;
      const u0 = col / G,
        u1 = (col + 1) / G,
        v1 = 1 - row / G,
        v0 = 1 - (row + 1) / G;
      const quad = [[-h2, h2, u0, v1], [-h2, -h2, u0, v0], [h2, -h2, u1, v0], [-h2, h2, u0, v1], [h2, -h2, u1, v0], [h2, h2, u1, v1]];
      for (const q of quad) {
        grp.pos.push(cx + q[0], cy + q[1], 0);
        grp.uv.push(q[2], q[3]);
      }
      grp.idx.push(gi);
    }
    const group = new T.Group();
    group.position.set(x, y, z);
    group.rotation.set(tilt, rotY, 0);
    if (backing) {
      const b = new T.Mesh(new T.BoxGeometry(W + gap * 4, H + gap * 4, 0.12), backing);
      b.position.z = -0.08;
      group.add(b);
    }
    for (const [a, grp] of groups) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(grp.pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(grp.uv, 2));
      g.computeVertexNormals();
      const m = new T.MeshBasicMaterial({ color: 0x1a1d24 });
      const mesh = new T.Mesh(g, m);
      mesh.userData.tiles = grp.idx;
      group.add(mesh);
      this.clickables.push(mesh);
      this.used.atlases.add(a);
      this.pending.push(this.o.atlas(a).then((t) => {
        if (!this.live) return;
        m.map = t;
        m.color.set(0xffffff);
        m.needsUpdate = true;
      }));
    }
    this.scene.add(group);
    this.dynamic.add(group);
    return group;
  }

  /* ---------- hang one work ---------- */
  hang(m: Mount, piece: Piece, style: FrameStyle, index: number, thumbUrl: string, caption: string[]) {
    const ratio = piece.ar || 1.777;
    // Fit the whole assembly to the mount, not just the picture. The frame lip, the mat and the
    // caption plate all live outside the art rectangle, so fitting the art alone pushed frames
    // past corners and door jambs and pushed caption plates through the floor.
    const depth = style === 'gilt' ? 0.22 : 0.12;
    const fullLip = style === 'none' ? 0 : style === 'gilt' ? 0.34 : style === 'oak' ? 0.22 : style === 'neon' ? 0.15 : 0.14;
    const capDrop = 0.30;                       // gap between the art and the plate
    // Solve the fit for a given lip and whether the caption is hung. Returns the art size
    // and the padding it consumed, so the frame and the plate below use the same numbers.
    const solve = (lp: number, withCap: boolean) => {
      const pw = lp * 2 + 0.04, ph = lp * 2 + 0.04;
      const aw = Math.max(0, m.width - pw), ah0 = Math.max(0, m.height - ph);
      const provW = Math.min(aw, ah0 * ratio);
      const ch = withCap ? Math.min(2.6, provW * 0.55) * 0.195 + capDrop : 0;
      const ww = Math.min(aw, Math.max(0, m.height - ph - ch) * ratio);
      return { w: ww, h: ww / ratio, padW: pw, padH: ph, capH: ch };
    };
    // Degrade in order rather than refusing to hang: full assembly, then no caption,
    // then a thinner frame. A small mount gets a smaller picture, never no picture.
    let fit = solve(fullLip, true);
    let hangPlate = true;
    if (fit.w < 0.45) { fit = solve(fullLip, false); hangPlate = false; }
    if (fit.w < 0.45) { fit = solve(Math.min(fullLip, 0.05), false); hangPlate = false; }
    const lip = (fit.padW - 0.04) / 2;
    const { w, h, padW, padH, capH } = fit;
    if (!(w > 0.15)) {
      if (AUDIT) console.warn('[audit] mount too small for any work, skipped', { index, style, mount: [m.width, m.height] });
      return null;
    }
    if (AUDIT && !hangPlate) console.warn('[audit] caption dropped to fit the mount', { index, mount: [m.width, m.height] });
    if (AUDIT) {
      const fw = w + padW, fh = h + padH + capH;
      if (fw > m.width + 1e-3 || fh > m.height + 1e-3)
        console.warn('[audit] footprint overflows mount', { index, style, mount: [m.width, m.height], footprint: [+fw.toFixed(3), +fh.toFixed(3)] });
      if (m.position.y - fh / 2 < 0)
        console.warn('[audit] assembly reaches below the floor', { index, y: m.position.y, height: +fh.toFixed(3) });
    }
    const g = new T.Group();
    g.position.copy(m.position);
    // face the viewing point: the art plane sits on local +z, so flip any mount whose normal points away from its target
    let rotY = m.rotation;
    const tdx = m.target.x - m.position.x, tdz = m.target.z - m.position.z;
    if (Math.sin(rotY) * tdx + Math.cos(rotY) * tdz < 0) rotY += Math.PI;
    g.rotation.y = rotY;
    let artZ = 0.06;
    const frameMat =
      style === 'gilt' ? this.pbr('gilt', X.gilt(), 2, { metalness: 0.85, roughness: 0.3 })
      : style === 'steel' ? this.flat(0x8c98a4, 0.9, 0.3)
      : style === 'oak' ? this.pbr('oakframe', X.planks(0x6d4b30, 3, 9), 1.5, { roughness: 0.6 })
      : style === 'white' ? this.flat(0xe9e6df, 0.05, 0.6)
      : style === 'black' ? this.flat(0x14161a, 0.3, 0.45)
      : style === 'enamel' ? this.flat(0x1b3fb3, 0.4, 0.25)
      : style === 'neon' ? this.glow(0x00e5ff)
      : null;
    if (frameMat && style !== 'neon') {
      const frame = new T.Mesh(new T.BoxGeometry(w + lip * 2, h + lip * 2, depth), frameMat);
      frame.castShadow = this.o.quality === 'high';
      g.add(frame);
      if (style === 'gilt') {
        const inner = new T.Mesh(new T.BoxGeometry(w + lip * 1.1, h + lip * 1.1, depth + 0.01), this.flat(0x2a2620, 0.2, 0.8));
        g.add(inner);
      }
      const mat = new T.Mesh(new T.BoxGeometry(w + 0.04, h + 0.04, depth + 0.02), this.flat(0x0b0c10, 0, 0.9));
      g.add(mat);
      artZ = depth / 2 + 0.03;
    } else if (style === 'neon') {
      const tube = 0.03;
      for (const [px, py, bw, bh] of [[0, h / 2 + 0.12, w + 0.3, tube], [0, -h / 2 - 0.12, w + 0.3, tube], [-w / 2 - 0.12, 0, tube, h + 0.3], [w / 2 + 0.12, 0, tube, h + 0.3]]) {
        const bar = new T.Mesh(new T.BoxGeometry(bw, bh, tube), frameMat!);
        bar.position.set(px, py, 0.05);
        g.add(bar);
      }
    }
    const artMat = new T.MeshBasicMaterial({ color: 0x0f1218, toneMapped: false });
    const art = new T.Mesh(new T.PlaneGeometry(w, h), artMat);
    art.position.z = artZ;
    art.userData.piece = piece;
    art.userData.mountIndex = index;
    g.add(art);
    this.clickables.push(art);
    this.used.thumbs.add(thumbUrl);
    const load = loadThumb(thumbUrl).then((t) => {
      if (!this.live) return;
      artMat.map = t;
      artMat.color.set(0xffffff);
      artMat.needsUpdate = true;
    }).catch(() => artMat.color.set(0x1d2430));
    this.pending.push(load);
    // caption plate under the work, in the site's plate style
    const cap = X.plate([
      { text: caption[0], color: '#00E5FF', size: 30 },
      { text: caption[1], color: '#F0F4F8', size: 34, font: '700' },
      { text: caption[2], color: '#8899AA', size: 24 },
      { text: caption[3] || 'NEW YORKERS  ·  BY MLOW', color: '#2962FF', size: 21 },
    ], 1024, 200);
    const plateW = Math.min(2.6, w * 0.55), plateH = plateW * 0.195;
    const plateY = -h / 2 - capDrop - plateH / 2;
    const plate = new T.Mesh(new T.PlaneGeometry(plateW, plateH), new T.MeshBasicMaterial({ map: cap }));
    plate.position.set(-w / 2 + plateW / 2, plateY, artZ + 0.01);
    // a plate that would sink into the floor is not hung at all
    if (hangPlate && m.position.y + plateY - plateH / 2 > 0.10) g.add(plate);
    else if (AUDIT && hangPlate) console.warn('[audit] caption plate would hit the floor, dropped', { index, y: m.position.y });
    if (m.wash !== false) {
      // clamped to the mount so the glow cannot bleed onto a neighbour or through a wall,
      // and centred on the art so the lit area reads where the picture actually is
      const washW = Math.min(w * 1.9, m.width), washH = Math.min(h * 2.4, m.height);
      const wm = new T.Mesh(new T.PlaneGeometry(washW, washH), new T.MeshBasicMaterial({ map: X.pool(), transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
      wm.position.set(0, 0, -0.02);
      wm.renderOrder = 1;
      g.add(wm);
    }
    this.scene.add(g);
    this.dynamic.add(g);
    return g;
  }

  /* ---------- merge and finish ---------- */
  batch() {
    const groups = new Map<T.Material, T.Mesh[]>();
    for (const o of this.objects) {
      if (Array.isArray(o.material)) continue;
      const a = groups.get(o.material) || [];
      a.push(o);
      groups.set(o.material, a);
    }
    const high = this.o.quality === 'high';
    for (const [m, ms] of groups) {
      const density = (m as T.MeshStandardMaterial).userData?.density as number | undefined;
      const gs = ms.map((o) => {
        o.updateMatrixWorld();
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        if (!g.attributes.uv) g.setAttribute('uv', new T.Float32BufferAttribute(new Array(g.attributes.position.count * 2).fill(0), 2));
        if (!g.attributes.normal) g.computeVertexNormals();
        g.applyMatrix4(o.matrixWorld);
        if (density) projectUV(g, density);
        return g;
      });
      const merged = gs.length > 1 ? mergeGeometries(gs) : gs[0];
      ms.forEach((o) => {
        this.scene.remove(o);
        o.geometry.dispose();
      });
      if (merged) {
        const mesh = new T.Mesh(merged, m);
        const transparent = (m as T.Material).transparent;
        mesh.castShadow = high && !transparent;
        mesh.receiveShadow = high;
        this.scene.add(mesh);
        this.extras.push(mesh);
      }
      if (gs.length > 1) gs.forEach((g) => g.dispose());
    }
    this.objects = [];
    for (const o of this.dynamic)
      o.traverse((c) => {
        if (c instanceof T.Mesh && !(c.material as T.Material).transparent) {
          c.castShadow = high;
          c.receiveShadow = high;
        }
      });
  }
  tick(t: number, dt: number) {
    for (const f of this.ticks) f(t, dt);
    for (let i = 0; i < this.eggs.length; i++) {
      const g = this.eggs[i].glint;
      if (!g || !g.visible) continue;
      const beat = 0.5 + 0.5 * Math.sin(t * 2.1 + i * 1.7);
      (g.material as T.SpriteMaterial).opacity = 0.35 + 0.6 * beat;
      (g.material as T.SpriteMaterial).rotation = t * 0.4 + i;
      g.scale.setScalar(0.42 + 0.22 * beat);
    }
  }
  /* Everything that finished loading: thumbs, props, atlases. */
  async settled() {
    let n = -1;
    while (n !== this.pending.length) {
      n = this.pending.length;
      await Promise.allSettled(this.pending);
    }
  }
  /* The whole room as one binary glTF: geometry, canvas painted materials, lights, hung works. */
  exportGLB(maxTextureSize = 1024): Promise<Blob> {
    // textures that arrived as WebP (the enamel props) would make EXT_texture_webp a required extension; re encode them as PNG
    this.scene.traverse((o) => {
      const mats = (o as T.Mesh).material;
      for (const m of Array.isArray(mats) ? mats : mats ? [mats] : []) {
        for (const v of Object.values(m as unknown as Record<string, unknown>)) {
          if (v instanceof T.Texture && v.userData && v.userData.mimeType === 'image/webp') v.userData.mimeType = 'image/png';
        }
      }
    });
    const exporter = new GLTFExporter();
    return new Promise((res, rej) => {
      exporter.parse(
        this.scene,
        (out) => (out ? res(new Blob([out as ArrayBuffer], { type: 'model/gltf-binary' })) : rej(new Error('GLTFExporter returned nothing (renderer memory)'))),
        (err) => rej(err),
        { binary: true, onlyVisible: true, maxTextureSize, includeCustomExtensions: false },
      );
    });
  }
  /* The current frame as a PNG. Render, then read back in the same tick. */
  /* Render a poster. A hidden pane can leave the canvas at zero size, so render at 1600 by 900 when the canvas is too small. */
  async poster(camera: T.Camera): Promise<Blob> {
    const r = this.o.renderer, el = r.domElement;
    const w0 = el.width, h0 = el.height, pr = r.getPixelRatio();
    const cam = camera as T.PerspectiveCamera;
    const small = w0 < 640 || h0 < 360;
    if (small) {
      r.setPixelRatio(1);
      r.setSize(1600, 900, false);
      if (cam.isPerspectiveCamera) { cam.aspect = 16 / 9; cam.updateProjectionMatrix(); }
    }
    r.render(this.scene, camera);
    try {
      return await new Promise<Blob>((res, rej) => el.toBlob((bl) => (bl ? res(bl) : rej(new Error('poster: toBlob returned null'))), 'image/png'));
    } finally {
      if (small) {
        r.setPixelRatio(pr);
        r.setSize(Math.max(1, w0 / pr), Math.max(1, h0 / pr), false);
        if (cam.isPerspectiveCamera && h0 > 0) { cam.aspect = w0 / h0; cam.updateProjectionMatrix(); }
      }
    }
  }
  dispose() {
    this.live = false;
    /* Free every texture slot, not only the colour map. The procedural surfaces keep their canvases
       in a cache and upload again if the next room reuses them, so this only returns GPU memory;
       leaving the normal and roughness maps behind stacked up a room's worth per visit on phones. */
    const free = (m: T.Material) => {
      for (const val of Object.values(m as unknown as Record<string, unknown>)) if (val instanceof T.Texture && !thumbIsShared(val)) val.dispose();
      m.dispose();
    };
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) free(m);
      } else if (o instanceof T.Sprite) free(o.material);
    });
    this.eggs = [];
    this.rt?.dispose();
    this.pmrem?.dispose();
    this.scene.environment = null;
    this.scene.clear();
  }
}

const sharedTextures = new WeakSet<T.Texture>();
export function markShared(t: T.Texture) {
  sharedTextures.add(t);
  return t;
}
function thumbIsShared(t: T.Texture) {
  return sharedTextures.has(t);
}

/* Planar projection by dominant normal axis, so every merged surface reads
   the same brick or stone at the same real scale regardless of mesh size. */
function projectUV(g: T.BufferGeometry, density: number) {
  const p = g.attributes.position,
    n = g.attributes.normal,
    uv = g.attributes.uv as T.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)),
      ny = Math.abs(n.getY(i)),
      nz = Math.abs(n.getZ(i)),
      x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, x * density, z * density);
    else if (nx >= nz) uv.setXY(i, z * density, y * density);
    else uv.setXY(i, x * density, y * density);
  }
  uv.needsUpdate = true;
}
