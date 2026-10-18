import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Procedural architectural kit. Dimensions use the gallery's metre-like scene units. */
export class Architecture {
  objects: T.Mesh[] = [];
  private materials = new Map<string, T.MeshStandardMaterial>();
  constructor(public scene: T.Scene) {}
  material(color: number, metalness = 0, roughness = 0.7) {
    const key = [color, metalness, roughness].join(':');
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new T.MeshStandardMaterial({ color, metalness, roughness }),
      );
    return this.materials.get(key)!;
  }
  mesh(g: T.BufferGeometry, m: T.Material, x = 0, y = 0, z = 0) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    this.scene.add(o);
    this.objects.push(o);
    return o;
  }
  box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) {
    return this.mesh(new T.BoxGeometry(w, h, d), m, x, y, z);
  }
  rounded(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
    r = 0.06,
  ) {
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
  lathe(
    profile: number[][],
    x: number,
    y: number,
    z: number,
    m: T.Material,
    segments = 24,
  ) {
    return this.mesh(
      new T.LatheGeometry(
        profile.map((p) => new T.Vector2(p[0], p[1])),
        segments,
      ),
      m,
      x,
      y,
      z,
    );
  }
  beam(a: T.Vector3, b: T.Vector3, width: number, m: T.Material) {
    const o = this.mesh(
      new T.CylinderGeometry(width, width, a.distanceTo(b), 7),
      m,
    );
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return o;
  }
  curve(points: T.Vector3[], r: number, m: T.Material, segments = 48) {
    return this.mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), segments, r, 6, false),
      m,
    );
  }
  torus(
    r: number,
    tube: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) {
    return this.mesh(new T.TorusGeometry(r, tube, 7, 48), m, x, y, z);
  }
  /** A genuine arched opening cut out of an extruded solid, not a painted arch. */
  arch(
    w: number,
    h: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
    pointed = false,
  ) {
    const s = new T.Shape();
    s.moveTo(-w * 0.65, 0);
    s.lineTo(w * 0.65, 0);
    s.lineTo(w * 0.65, h * 1.13);
    s.lineTo(-w * 0.65, h * 1.13);
    s.closePath();
    const hole = new T.Path();
    hole.moveTo(-w / 2, 0.05);
    hole.lineTo(-w / 2, h * 0.65);
    if (pointed) {
      hole.quadraticCurveTo(-w * 0.4, h * 0.91, 0, h);
      hole.quadraticCurveTo(w * 0.4, h * 0.91, w / 2, h * 0.65);
    } else {
      hole.absellipse(0, h * 0.65, w / 2, h * 0.35, Math.PI, 0, true);
    }
    hole.lineTo(w / 2, 0.05);
    hole.closePath();
    s.holes.push(hole);
    return this.mesh(
      new T.ExtrudeGeometry(s, {
        depth,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 2,
        curveSegments: 24,
      }),
      m,
      x,
      y,
      z,
    );
  }
  label(
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    bg = '#263a3b',
    fg = '#f4eedb',
  ) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.max(96, Math.round((1024 * h) / w));
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
    ctx.fillStyle = fg;
    ctx.font = `600 ${Math.min(c.height * 0.5, 115)}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, 512, c.height / 2, 970);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return this.mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: t, side: T.DoubleSide }),
      x,
      y,
      z,
    );
  }
  instances(g: T.BufferGeometry, m: T.Material, transforms: T.Matrix4[]) {
    const o = new T.InstancedMesh(g, m, transforms.length);
    transforms.forEach((v, i) => o.setMatrixAt(i, v));
    o.instanceMatrix.needsUpdate = true;
    o.computeBoundingSphere();
    this.scene.add(o);
    return o;
  }
  batch() {
    const groups = new Map<T.Material, T.Mesh[]>();
    for (const o of this.objects) {
      if (Array.isArray(o.material)) continue;
      const a = groups.get(o.material) || [];
      a.push(o);
      groups.set(o.material, a);
    }
    for (const [m, ms] of groups) {
      if (ms.length < 2) continue;
      const gs = ms.map((o) => {
        o.updateMatrixWorld();
        const g = o.geometry.index
          ? o.geometry.toNonIndexed()
          : o.geometry.clone();
        if (!g.attributes.uv)
          g.setAttribute(
            'uv',
            new T.Float32BufferAttribute(
              new Array(g.attributes.position.count * 2).fill(0),
              2,
            ),
          );
        return g.applyMatrix4(o.matrixWorld);
      });
      const merged = mergeGeometries(gs);
      if (merged) {
        ms.forEach((o) => {
          this.scene.remove(o);
          o.geometry.dispose();
        });
        this.scene.add(new T.Mesh(merged, m));
      }
      gs.forEach((g) => g.dispose());
    }
  }
}
