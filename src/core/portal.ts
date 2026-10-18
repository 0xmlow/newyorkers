import * as T from 'three';
import { frameCorners } from 'three/addons/utils/CameraUtils.js';

// Live portals. A portal is a doorway rectangle in one room (frame A) tied to a rectangle in another (frame B).
// Its quad shows a render taken from where your eye would be if A were B: virtual camera = B . Ry(pi) . A^-1 . camera,
// with an off axis projection fitted to the doorway and the near plane laid on the far doorway (frameCorners), so
// nothing between the virtual eye and the far door is drawn. Walk through A and you are moved by the same transform.
//
// Each portal keeps two render targets and draws into the one not on screen (ping pong), so portals that can see
// each other, or themselves, recurse one level per frame instead of reading the texture they are writing.

export type Frame = { pos: T.Vector3; rotY: number };
export type PortalOpts = {
  w: number; h: number;      // aperture in metres, bottom edge at frame y
  res?: number;              // render target width in pixels
  walk?: boolean;            // can you step through (false: a window you look into)
  round?: boolean;           // a porthole (dryer windows): circular mask
  maxDist?: number;          // beyond this the view freezes on its last frame
  label?: string;
};

const flip = new T.Matrix4().makeRotationY(Math.PI);

export class Portal {
  a: Frame; b: Frame; o: Required<PortalOpts>;
  fromRoom: string; toRoom: string;
  mesh: T.Mesh; mat: T.ShaderMaterial;
  rts: T.WebGLRenderTarget[]; front = 0;
  M = new T.Matrix4(); Minv = new T.Matrix4(); A = new T.Matrix4(); B = new T.Matrix4();
  cam = new T.PerspectiveCamera(60, 1, 0.05, 400);
  lastDraw = -1; priority = 0; enabled = true;
  origin = new T.Vector3(); // the room group's offset: the quad lives in room local space

  constructor(fromRoom: string, a: Frame, toRoom: string, b: Frame, opts: PortalOpts) {
    this.fromRoom = fromRoom; this.toRoom = toRoom; this.a = a; this.b = b;
    this.o = { res: 512, walk: true, round: false, maxDist: 40, label: '', ...opts };
    this.A.compose(a.pos, new T.Quaternion().setFromEuler(new T.Euler(0, a.rotY, 0)), new T.Vector3(1, 1, 1));
    this.B.compose(b.pos, new T.Quaternion().setFromEuler(new T.Euler(0, b.rotY, 0)), new T.Vector3(1, 1, 1));
    this.M.copy(this.B).multiply(flip).multiply(this.A.clone().invert());
    this.Minv.copy(this.M).invert();
    const rh = Math.round((this.o.res * opts.h) / opts.w);
    this.rts = [0, 1].map(() => new T.WebGLRenderTarget(this.o.res, rh, { type: T.HalfFloatType, samples: 0 }));
    this.mat = new T.ShaderMaterial({
      uniforms: { map: { value: this.rts[0].texture }, round: { value: this.o.round ? 1 : 0 }, fade: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float round; uniform float fade; varying vec2 vUv;
        void main(){
          if (round > 0.5 && length(vUv - 0.5) > 0.5) discard;
          vec3 c = min(texture2D(map, vUv).rgb * fade, vec3(1.1)); // a bare bulb through a doorway should not flood the room with bloom
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new T.Mesh(new T.PlaneGeometry(opts.w, opts.h), this.mat);
    this.mesh.position.copy(a.pos).add(new T.Vector3(0, opts.h / 2, 0));
    this.mesh.rotation.y = a.rotY;
    this.mesh.userData.portal = this;
  }

  /** Is the doorway worth drawing from this camera: in front of it, near enough, in the view. */
  wants(camera: T.Camera, frustum: T.Frustum): number {
    if (!this.enabled || !this.mesh.visible) return 0;
    const local = camera.position.clone().applyMatrix4(this.A.clone().invert());
    if (local.z < -0.05) return 0;
    const d = camera.position.distanceTo(this.a.pos.clone().setY(this.a.pos.y + this.o.h / 2));
    if (d > this.o.maxDist) return 0;
    this.mesh.updateWorldMatrix(true, false);
    if (!this.mesh.geometry.boundingSphere) this.mesh.geometry.computeBoundingSphere();
    const s = this.mesh.geometry.boundingSphere!.clone().applyMatrix4(this.mesh.matrixWorld);
    if (!frustum.intersectsSphere(s)) return 0;
    return 1 / (0.5 + d);
  }

  /** Draw the far side into the back buffer, then show it. `show` sets which rooms are visible for this pass. */
  render(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera, show: (room: string) => () => void) {
    const back = 1 - this.front, rt = this.rts[back];
    // keep the quad from being clipped by our own near plane as we step through: push it behind the doorway
    const local = camera.position.clone().applyMatrix4(this.A.clone().invert());
    const inAperture = Math.abs(local.x) < this.o.w / 2 + 0.3 && local.y > -0.2 && local.y < this.o.h + 0.2;
    const push = this.o.walk && inAperture && local.z < 0.45 ? 0.45 : 0;
    this.mesh.position.copy(this.a.pos).sub(this.origin).add(new T.Vector3(0, this.o.h / 2, 0)).add(new T.Vector3(0, 0, -push).applyAxisAngle(new T.Vector3(0, 1, 0), this.a.rotY));
    this.mesh.updateWorldMatrix(true, false);
    // the corners of the quad as you see them, carried to the far side
    const hw = this.o.w / 2, hh = this.o.h / 2, mw = this.mesh.matrixWorld;
    const bl = new T.Vector3(-hw, -hh, 0).applyMatrix4(mw).applyMatrix4(this.M);
    const br = new T.Vector3(hw, -hh, 0).applyMatrix4(mw).applyMatrix4(this.M);
    const tl = new T.Vector3(-hw, hh, 0).applyMatrix4(mw).applyMatrix4(this.M);
    const eye = camera.position.clone().applyMatrix4(this.M);
    const c = this.cam;
    c.position.copy(eye);
    const n = new T.Vector3().crossVectors(br.clone().sub(bl), tl.clone().sub(bl)).normalize();
    const dist = Math.max(0.02, -bl.clone().sub(eye).dot(n));
    c.near = Math.max(0.01, dist * 0.995); c.far = 420;
    frameCorners(c, bl, br, tl, false);
    c.updateMatrixWorld(true);
    const restore = show(this.toRoom);
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, c);
    renderer.setRenderTarget(null);
    restore();
    this.front = back;
    this.mat.uniforms.map.value = this.rts[this.front].texture;
  }

  /** Did the camera just step through? Returns true and moves it (and its yaw) to the far side. */
  cross(prev: T.Vector3, now: T.Vector3): boolean {
    if (!this.o.walk || !this.enabled) return false;
    const inv = this.A.clone().invert();
    const p0 = prev.clone().applyMatrix4(inv), p1 = now.clone().applyMatrix4(inv);
    if (!(p0.z > 0 && p1.z <= 0)) return false;
    const t = p0.z / (p0.z - p1.z), hit = p0.clone().lerp(p1, t);
    if (Math.abs(hit.x) > this.o.w / 2 || hit.y < -0.5 || hit.y > this.o.h + 0.5) return false;
    now.applyMatrix4(this.M);
    return true;
  }
  /** How much yaw the crossing adds. */
  get dYaw() { return this.b.rotY + Math.PI - this.a.rotY; }

  dispose() { this.rts.forEach((r) => r.dispose()); this.mat.dispose(); this.mesh.geometry.dispose(); }
}
