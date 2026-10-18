import * as T from 'three';
import { shared } from './mlow';

// The night over the block and the roof: ink to navy, a few stars, and faint contour lines drifting across it,
// as in the concepts (the paint gets into the sky too). A shader sphere, fog off, always behind everything.

export function skyDome(parent: T.Object3D, radius = 380, lines = 0.5) {
  const m = new T.ShaderMaterial({
    uniforms: { uTime: shared.time, uLines: { value: lines } },
    side: T.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uLines; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        float y = vD.y;
        vec3 c = mix(vec3(0.03, 0.06, 0.16), vec3(0.004, 0.008, 0.03), smoothstep(-0.05, 0.6, y));
        c += vec3(0.75, 0.42, 0.2) * 0.05 * smoothstep(0.25, -0.05, y);   // copper city glow at the horizon
        vec3 q = vD * 220.0; float s = step(0.9975, h(floor(q))) * smoothstep(0.0, 0.2, y);
        c += vec3(0.8, 0.85, 1.0) * s * (0.4 + 0.6 * h(floor(q) + 3.0));
        float f = n(vD * 3.0 + vec3(0.0, uTime * 0.01, 0.0)) * 2.0 + n(vD * 7.0) * 0.6;
        float g = f * 7.0, w = fwidth(g) * 1.3 + 0.01;
        float line = 1.0 - smoothstep(w * 0.35, w, 0.5 - abs(fract(g) - 0.5));
        c += mix(vec3(0.16, 0.38, 1.0), vec3(0.0, 0.9, 1.0), fract(f)) * line * uLines * 0.22 * smoothstep(0.02, 0.35, y);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const s = new T.Mesh(new T.SphereGeometry(radius, 48, 24), m);
  s.renderOrder = -10; s.frustumCulled = false;
  parent.add(s);
  return s;
}
