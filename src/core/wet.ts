import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { shared } from './mlow';

// Wet asphalt. Under the PBR street sits a planar mirror (three's Reflector, half resolution) drawn as an additive
// overlay: strong in puddles (a noise mask), faint on damp asphalt, broken by ripples, blurred with distance, and
// stronger at grazing angles (fresnel). Signs, windows and the Eye Flower get the long night reflections the concept
// has, which an environment map alone cannot give. Main view only: hidden while portals draw (see mainOnly).

const shader = {
  name: 'WetStreet',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uTime: shared.time, uWet: { value: 1.25 } },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; varying vec3 vV;
    void main(){ vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vV = cameraPosition - w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uWet; varying vec4 vUv; varying vec3 vW; varying vec3 vV;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    void main(){
      float pud = smoothstep(0.46, 0.62, n(vW.xz * 0.35) * 0.65 + n(vW.xz * 1.3) * 0.35);
      float damp = 0.28 + 0.72 * pud;
      vec2 rip = vec2(n(vW.xz * 6.0 + uTime * 0.7), n(vW.xz * 6.0 - uTime * 0.6)) - 0.5;
      float dist = length(vV);
      vec3 vdir = normalize(vV);
      float fres = 0.18 + 0.82 * pow(1.0 - abs(vdir.y), 5.0);
      vec4 uv = vUv; uv.xy += rip.xy * (0.012 + 0.03 * (1.0 - pud)) * uv.w;
      float blur = (0.004 + 0.01 * (1.0 - pud)) * uv.w;
      vec3 c = texture2DProj(tDiffuse, uv).rgb * 0.4;
      c += texture2DProj(tDiffuse, uv + vec4(blur, 0, 0, 0)).rgb * 0.15;
      c += texture2DProj(tDiffuse, uv - vec4(blur, 0, 0, 0)).rgb * 0.15;
      c += texture2DProj(tDiffuse, uv + vec4(0, blur * 2.5, 0, 0)).rgb * 0.15;
      c += texture2DProj(tDiffuse, uv - vec4(0, blur * 2.5, 0, 0)).rgb * 0.15;
      gl_FragColor = vec4(c * damp * fres * uWet * smoothstep(120.0, 20.0, dist), 1.0);
    }`,
};

export function wetStreet(parent: T.Object3D, w: number, d: number, pos: T.Vector3, scale = 0.5) {
  const r = new Reflector(new T.PlaneGeometry(w, d), {
    textureWidth: Math.round(innerWidth * scale * Math.min(devicePixelRatio, 1.5)),
    textureHeight: Math.round(innerHeight * scale * Math.min(devicePixelRatio, 1.5)),
    clipBias: 0.003, shader,
  });
  r.rotation.x = -Math.PI / 2;
  r.position.copy(pos);
  const m = r.material as T.ShaderMaterial;
  m.transparent = true; m.blending = T.AdditiveBlending; m.depthWrite = false;
  r.renderOrder = 1;
  parent.add(r);
  return r;
}
