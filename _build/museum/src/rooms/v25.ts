/* 182: THE ARRIVAL. MLOW INTERNATIONAL, Terminal B "BLOSSOM", MLow's airport, landed in the census as
   the room for era XII, The Arrival: every New Yorker came in through somewhere. The terminal is not
   modelled here. It is MLow's own code generated Blender build (ARCHITECT/mlow-airport-v3), loaded
   whole as one set (assets/museum/props/mlow_international.glb) with its light baked in Cycles:
   colour times direct and bounce light burned into four atlases, drawn unlit, so the rotunda reads as
   the stills did. The New York clock dims it toward its own interior light after dark, moves the sun on
   the people and the hung works, and shows in the header of the departures boards.
   THE BIG UPGRADE (2026-11-25) adds to the set and leaves the bake alone: split flap departures boards on its two
   cabinets (the extruded lettering went), scanned stone and plaster laid over the bake as detail, gate seating, belt
   queues, cases, plants and bins, airport signs, cases riding the carousels, and the anamorphic entry stamp in the
   arrivals hall. The set is merged per material and per 40 m cell so the frustum can drop what is behind you.

   Frame (the terminal's own): +z is landside (the drop off and the plaza, the spawn faces away from it),
   -z airside. The rotunda is a 30 m drum at the origin under the blue glass dome; the gallery concourse
   runs 24 m wide from z -42 to -150; the neck to -177; the blossom gate hub is a 22 m drum at z -196.
   The arrivals annex opens off the rotunda to +x (x 36 to 86) with the two art wrapped carousels.
     Hero: flight MW317 rolls down runway 09/27 behind the gate hub and takes off, again and again.
     Ticks: the MLOW blimp circling the airfield; the boards flipping and the New York time; the carousels; the sun.
     The thing to do: stand on the blossom in the middle of the gate hub and MW317 is cleared for you.
   Collision is written by hand (the checks never load the GLB): the walkable plan is rasterised into
   blocks, and 200 keep outs for the desks, benches, plinths, carousels, columns and travellers were
   read out of the Blender scene. Mount slots are the concourse's own 18 frames. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
import { fireflyPlate } from './a';
import { paintTex, fit, anamorphTex } from './f';
import { hero, heroInstances } from './heroes';
const PI = Math.PI;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => { t = clamp01(t); return t * t * (3 - 2 * t); };
type Museum = { camera?: T.Camera; kit?: unknown };
const museum = (): Museum | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __museum?: Museum }).__museum);
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined';

/* the concourse frames, read out of the Blender scene: x, y, z, normal x, normal z, width, height */
const ART: [number, number, number, number, number, number, number][] = [[-11.5,2.85,-55.0,1.0,-0.0,2.33,3.4],[11.5,2.85,-63.0,-1.0,-0.0,3.4,3.4],[-11.5,2.85,-72.0,1.0,-0.0,2.33,3.4],[11.5,2.85,-80.0,-1.0,-0.0,2.56,3.4],[-11.5,2.85,-89.0,1.0,-0.0,1.89,3.4],[11.5,2.85,-97.0,-1.0,-0.0,1.89,3.4],[-11.5,2.85,-106.0,1.0,-0.0,2.33,3.4],[11.5,2.85,-114.0,-1.0,-0.0,2.56,3.4],[-11.5,2.85,-123.0,1.0,-0.0,2.33,3.4],[11.5,2.85,-131.0,-1.0,-0.0,2.56,3.4],[-11.5,2.85,-140.0,1.0,-0.0,2.33,3.4],[11.5,2.85,-148.0,-1.0,-0.0,1.89,3.4],[44.0,2.75,-51.3,0.0,1.0,2.26,3.0],[54.0,2.75,-51.3,0.0,1.0,2.26,3.0],[64.0,2.75,-51.3,0.0,1.0,2.05,3.0],[74.0,2.75,-51.3,0.0,1.0,1.67,3.0],[85.3,2.75,-24.0,-1.0,-0.0,1.67,3.0],[85.3,2.75,-38.0,-1.0,-0.0,2.26,3.0]];
/* desks, benches, plinths, carousels, columns, travellers: x, z, radius */
const KEEP: [number, number, number][] = [[25.98,-15.0,0.42],[21.21,-21.21,0.43],[7.76,-28.98,0.39],[0.0,-30.0,0.35],[-7.76,-28.98,0.39],[-11.0,-176.95,0.4],[-3.82,-174.33,0.36],[3.82,-174.33,0.36],[11.0,-176.95,0.4],[-3.5,-170.57,0.38],[-8.62,-175.69,0.38],[-8.62,-151.44,0.38],[-3.5,-156.57,0.38],[8.62,-175.69,0.38],[3.5,-170.57,0.38],[3.5,-156.57,0.38],[8.62,-151.44,0.38],[12.73,-12.73,1.75],[12.73,-12.73,1.75],[13.86,-13.86,1.75],[-12.73,-12.73,1.75],[-12.73,-12.73,1.75],[-13.86,-13.86,1.75],[-12.73,12.73,1.75],[-12.73,12.73,1.75],[-13.86,13.86,1.75],[12.73,12.73,1.75],[12.73,12.73,1.75],[13.86,13.86,1.75],[22.55,-8.21,1.75],[-22.55,-8.21,1.75],[-22.55,8.21,1.75],[22.55,8.21,1.75],[-0.38,11.63,0.54],[-1.76,6.44,0.48],[11.74,0.01,0.53],[-1.31,8.33,0.51],[7.23,11.32,0.57],[13.71,-20.89,0.45],[-17.94,1.65,0.56],[3.29,-25.6,0.54],[-4.05,-12.62,0.47],[16.09,-8.41,0.52],[-6.73,-0.04,0.55],[15.39,17.86,0.56],[-5.87,-2.09,0.51],[-6.19,-17.71,0.56],[5.11,0.05,0.54],[7.43,3.1,0.56],[-7.07,5.36,0.56],[2.06,7.8,0.5],[-8.42,-14.33,0.54],[11.17,-9.32,0.55],[24.36,1.85,0.49],[1.67,4.87,0.56],[3.24,-11.14,0.55],[19.28,-15.54,0.45],[6.06,-10.62,0.52],[4.08,-10.32,0.57],[2.45,15.53,0.51],[2.06,23.97,0.57],[6.42,-20.75,0.5],[-12.11,7.86,0.54],[13.21,8.06,0.54],[-1.68,-15.76,0.52],[-21.38,-7.26,0.57],[4.44,-3.78,0.55],[8.31,21.88,0.45],[-12.6,21.04,0.48],[-6.49,-62.0,1.75],[6.49,-70.0,1.75],[-6.49,-84.0,1.75],[6.49,-92.0,1.75],[-6.49,-106.0,1.75],[6.49,-114.0,1.75],[-6.49,-128.0,1.75],[6.49,-136.0,1.75],[3.74,-58.72,0.48],[-7.57,-133.65,0.53],[6.84,-123.63,0.56],[-0.08,-70.98,0.57],[-6.22,-134.76,0.56],[1.26,-63.48,0.5],[8.25,-106.08,0.51],[7.02,-78.14,0.57],[3.08,-63.02,0.54],[-5.07,-76.03,0.47],[-8.74,-51.91,0.57],[-0.67,-122.04,0.54],[-2.57,-112.6,0.57],[0.54,-120.93,0.5],[0.91,-113.91,0.57],[1.97,-123.0,0.56],[0.22,-124.39,0.45],[-7.27,-53.98,0.57],[-4.86,-122.88,0.47],[-2.09,-126.28,0.47],[-3.32,-114.76,0.51],[5.04,-115.34,0.55],[1.7,-87.22,0.49],[-1.6,-65.99,0.48],[-7.74,-94.99,0.53],[-1.86,-81.14,0.46],[0.0,-205.0,1.75],[1.29,-205.0,1.45],[-7.04,-201.61,1.75],[-4.78,-201.61,0.5],[-5.75,-201.61,0.81],[-8.77,-194.0,1.75],[-7.48,-194.0,1.45],[-3.9,-187.89,1.75],[-2.27,-187.89,0.61],[-3.16,-187.89,0.61],[-2.72,-187.89,0.55],[-3.06,-187.89,0.61],[-3.95,-187.89,0.61],[-3.51,-187.89,0.55],[3.9,-187.89,1.75],[5.19,-187.89,1.45],[8.77,-194.0,1.75],[10.24,-194.0,0.96],[9.27,-194.0,0.66],[7.04,-201.61,1.75],[8.7,-201.61,0.72],[7.41,-201.61,0.9],[-16.21,-195.46,0.51],[6.76,-180.49,0.56],[7.17,-181.17,0.5],[-10.79,-200.82,0.54],[2.49,-169.3,0.56],[6.58,-201.28,0.52],[3.24,-202.34,0.56],[-4.12,-158.91,0.53],[-7.0,-191.9,0.56],[15.85,-196.11,0.48],[-10.97,-198.65,0.51],[-2.95,-205.48,0.46],[-9.3,-206.44,0.45],[1.35,-199.57,0.47],[5.94,-164.62,0.56],[50.0,-32.0,1.75],[50.0,-32.0,1.75],[50.0,-32.0,1.75],[50.0,-29.58,0.95],[54.9,-32.0,0.52],[53.06,-35.83,0.67],[48.91,-36.78,0.59],[45.59,-34.13,0.64],[45.59,-29.87,0.64],[48.91,-27.22,0.59],[53.06,-28.17,0.67],[72.0,-32.0,1.75],[72.0,-32.0,1.75],[72.0,-32.0,1.75],[72.0,-29.58,0.95],[76.9,-32.0,0.52],[75.06,-35.83,0.67],[70.91,-36.78,0.59],[67.59,-34.13,0.64],[67.59,-29.87,0.64],[70.91,-27.22,0.59],[75.06,-28.17,0.67],[44.0,-51.27,0.62],[54.0,-51.27,0.88],[64.0,-51.27,0.95],[85.27,-38.0,0.33],[47.4,-18.33,0.45],[62.83,-29.21,0.51],[68.62,-24.73,0.57],[54.97,-20.69,0.52],[51.11,-41.67,0.56],[77.95,-26.4,0.56],[73.24,-39.39,0.49],[51.57,-28.49,0.57],[56.06,-38.52,0.51],[69.97,-36.03,0.47],[57.44,-36.09,0.57],[47.24,-39.55,0.57],[49.32,-40.25,0.56],[63.48,-21.69,0.56],[8.5,-56.0,1.1],[-8.5,-74.0,1.1],[8.5,-92.0,1.1],[-8.5,-110.0,1.1],[8.5,-128.0,1.1],[25.97,-5.26,1.1],[14.64,-22.09,1.1],[-5.26,-25.97,1.1],[-22.09,-14.64,1.1],[-25.97,5.26,1.1],[-14.64,22.09,1.1],[5.26,25.97,1.1],[22.09,14.64,1.1],[17.5,-196.0,1.1],[14.16,-206.29,1.1],[5.41,-212.64,1.1],[-5.41,-212.64,1.1],[-14.16,-206.29,1.1],[-17.5,-196.0,1.1],[-14.16,-185.71,1.1],[-5.41,-179.36,1.1],[5.41,-179.36,1.1],[14.16,-185.71,1.1],[-9.62,-163.57,1.1]];
const FLOOR = 0.15, EYE = 2.4;

/* the walkable plan: rotunda, concourse and neck, gate hub, the annex link and the annex */
function walkable(x: number, z: number) {
  const disc = (cx: number, cz: number, r: number) => (x - cx) ** 2 + (z - cz) ** 2 < r * r;
  return disc(0, 0, 28.6) || (Math.abs(x) < 11.0 && z < -27 && z > -176.6) || disc(0, -196, 21.0)
    || (x > 20 && x < 38.7 && z > -26.5 && z < -13.5) || (x > 36.6 && x < 85.4 && z > -51.4 && z < -14.6);
}
const BOUNDS: [number, number, number, number] = [-29.5, 86, -218, 29];

/* the sun over New York for a fractional hour, in the terminal's frame (east is -x here) */
function sunDir(h: number) {
  const s = (h - 6.6) / 11.4;
  if (s <= 0 || s >= 1) return { d: v(0.3, 0.85, 0.4).normalize(), day: 0 };
  const el = Math.sin(PI * s) * 0.72 + 0.04, a = PI * s;
  return { d: v(-Math.cos(a) * Math.cos(el), Math.sin(el), -Math.sin(a) * Math.cos(el) * 0.6).normalize(), day: smooth(Math.sin(PI * s) * 4) };
}
function floatAttr(a: T.BufferAttribute | T.InterleavedBufferAttribute, n: number) {
  const f = new Float32Array(a.count * n), get = [a.getX, a.getY, a.getZ, a.getW];   /* getX de-normalises quantised data */
  for (let i = 0; i < a.count; i++) for (let j = 0; j < n; j++) f[i * n + j] = get[j].call(a, i);
  return new T.BufferAttribute(f, n);
}

/* ---------- THE BIG UPGRADE (2026-11-25) ----------
   Everything below sits on top of MLow's bake and leaves it as it was: scanned stone and plaster (Poly Haven, CC0) as a
   detail layer in world metres, split flap boards on the set's own cabinets, airport signs in the house type, gate
   seating and hard shell cases built in Blender (props/mlowintl), Poly Haven plants, bins and suitcases, and one trick. */
const TEXD = 'assets/museum/tex/mlowintl/';
const detailTex = new Map<string, T.Texture>();
function dtex(name: string) {
  let t = detailTex.get(name);
  if (!t) {
    t = HAS_DOM ? new T.TextureLoader().load(TEXD + name) : new T.Texture();
    t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.colorSpace = T.NoColorSpace;
    detailTex.set(name, t);
  }
  return t;
}
/* The scan rides on the bake: up facing faces take the stone (a slab every 3.2 m, the joints showing), walls and
   ceilings a faint plaster. The detail maps are centred on mid grey, so they shade the baked colour, never relight it. */
function bakedDetail(m: T.MeshBasicMaterial, stone: boolean) {
  const out = m.clone();
  const uni = { u_top: { value: dtex('marble_01_d.webp') }, u_side: { value: dtex('grey_plaster_d.webp') }, u_topK: { value: stone ? 0.55 : 0 }, u_sideK: { value: 0.3 } };
  out.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDWP; varying vec3 vDWN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vDWN = mat3(modelMatrix) * normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vDWP; varying vec3 vDWN; uniform sampler2D u_top; uniform sampler2D u_side; uniform float u_topK; uniform float u_sideK;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec3 n = normalize(vDWN + vec3(0.0, 1e-4, 0.0)); float d = 1.0;
  if (n.y > 0.6) { float a = texture2D(u_top, vDWP.xz / 3.2).r / 0.502, b = texture2D(u_top, vDWP.xz / 23.4 + 0.37).r / 0.502; d = mix(1.0, a, u_topK) * mix(1.0, b, u_topK * 0.4); }
  else { vec2 p = abs(n.x) > abs(n.z) ? vDWP.zy : vDWP.xy; if (n.y < -0.6) p = vDWP.xz; d = mix(1.0, texture2D(u_side, p / 2.6).r / 0.502, u_sideK); }
  diffuseColor.rgb *= clamp(d, 0.55, 1.4); }`);
  };
  out.customProgramCacheKey = () => 'mlowintl-detail';
  return out;
}

/* Our props as instanced parts, one draw a part per 40 m cell, never casting shadows (the bake already has them).
   Each cell's set is culled by the frustum and hidden beyond `far`, so a seat at the far gate costs nothing at the door */
type Far = { o: T.Object3D; c: T.Vector3; r: number; far: number }[];
function glbs(k: Parameters<RoomDef['build']>[0], name: string, fit: Parameters<typeof hero>[2], at: [number, number, number, number][], cull: Far, far = 60) {
  if (!at.length) return;
  const cells = new Map<string, [number, number, number, number][]>();
  for (const a of at) { const c = `${Math.floor(a[0] / 40)},${Math.floor(a[2] / 40)}`; if (!cells.has(c)) cells.set(c, []); cells.get(c)!.push(a); }
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    const m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), one = new T.Vector3(1, 1, 1);
    for (const set of cells.values()) {
      const ins = heroInstances(k, h, set.length);
      set.forEach(([x, y, z, r], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), one)));
      ins.commit();
      for (const p of ins.parts) {
        p.im.castShadow = false; p.im.receiveShadow = false;
        p.im.computeBoundingSphere(); p.im.frustumCulled = true;
        const bs = p.im.boundingSphere!;
        cull.push({ o: p.im, c: bs.center.clone(), r: bs.radius, far });
      }
    }
  });
}

/* A split flap departures board: every character on its own flap, the remarks flip through their letters when they change. */
type Row = { t: number; flight: string; dest: string; gate: string; rem: string };
const REM_COL: Record<string, string> = { BOARDING: '#39ff88', 'FINAL CALL': '#ff2e63', 'GATE OPEN': '#00e5ff', DELAYED: '#ffe600', DEPARTED: '#8a8f99', 'SOLD OUT': '#ff7ad9', 'ON TIME': '#f3f1e8' };
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function flapBoard(k: Parameters<RoomDef['build']>[0], title: string, rows: Row[], hour0: number, faces: [number, number, number, number][], w: number, h: number, reduced: boolean) {
  if (!HAS_DOM) return;
  const W = 2048, H = Math.round((W * h) / w);
  let hour = hour0, flip: { row: number; from: number; to: string } | null = null, clock = 0;
  const hhmm = (x: number) => { const m = Math.floor((((x % 24) + 24) % 24) * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const cols = [[0, 5], [6, 6], [13, 17], [31, 3], [35, 10]] as const, CW = 42, CH = 70, X0 = 60, RY0 = 300, RG = 98;
  let tex: T.CanvasTexture | null = null;
  const paint = (g: CanvasRenderingContext2D) => {
    g.fillStyle = '#07090d'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2962ff'; g.fillRect(0, 0, W, 170);
    g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.textAlign = 'left';
    fit(g, title, 'W2 Archivo Expanded', 100, 1200); g.fillText(title, X0, 90);
    g.textAlign = 'right'; g.font = '400 92px "W2 JetBrains Mono", ui-monospace, monospace'; g.fillText(`NEW YORK ${hhmm(hour)}`, W - X0, 92);
    g.textAlign = 'left'; g.fillStyle = '#8a8f99'; g.font = '700 34px "W2 Archivo Narrow", "Helvetica Neue", Arial, sans-serif';
    ['TIME', 'FLIGHT', 'DESTINATION', 'GATE', 'REMARKS'].forEach((s, i) => g.fillText(s, X0 + cols[i][0] * CW, 236));
    g.font = '400 58px "W2 JetBrains Mono", ui-monospace, monospace'; g.textAlign = 'center';
    rows.forEach((r, ri) => {
      const y = RY0 + ri * RG;
      let rem = r.rem;
      if (flip && flip.row === ri) { const n = Math.floor((clock - flip.from) * 14); rem = r.rem.padEnd(10).split('').map((ch, i) => (i < n - 4 ? ch : ch === ' ' && i >= n ? ' ' : FLAP[(n * 7 + i * 13) % FLAP.length])).join(''); }
      const cells = [hhmm(r.t), r.flight, r.dest, r.gate, rem];
      cells.forEach((txt, ci) => {
        const [c0, n] = cols[ci], s = txt.toUpperCase().padEnd(n).slice(0, n);
        for (let i = 0; i < n; i++) {
          const x = X0 + (c0 + i) * CW;
          g.fillStyle = '#151820'; g.fillRect(x, y, CW - 5, CH);
          g.fillStyle = '#000000'; g.fillRect(x, y + CH / 2 - 1.5, CW - 5, 3);
          if (s[i] !== ' ') { g.fillStyle = ci === 4 ? REM_COL[r.rem] ?? '#f3f1e8' : ci === 1 ? '#ffe600' : '#f3f1e8'; g.fillText(s[i], x + (CW - 5) / 2, y + CH / 2 + 3); }
        }
      });
    });
    g.fillStyle = '#00e5ff'; g.textAlign = 'center'; fit(g, 'EVERY NEW YORKER CAME IN THROUGH SOMEWHERE', 'W2 Archivo Expanded', 40, W - 2 * X0); g.fillText('EVERY NEW YORKER CAME IN THROUGH SOMEWHERE', W / 2, H - 60);
  };
  tex = paintTex(W, H, (g) => paint(g), ['W2 Archivo Expanded', 'W2 JetBrains Mono', 'W2 Archivo Narrow']);
  const redraw = () => { const c = tex!.image as HTMLCanvasElement; paint(c.getContext('2d')!); tex!.needsUpdate = true; };
  const mat = new T.MeshBasicMaterial({ map: tex, toneMapped: false });
  for (const [x, y, z, r] of faces) { const o = k.mesh(new T.PlaneGeometry(w, h), mat, x, y, z, true); o.rotation.y = r; }
  if (reduced) return;
  /* the clock every 20 s; every 9 s one flight moves on: on time, gate open, boarding, final call, departed, and back
     onto the board later as the next departure */
  const NEXT: Record<string, string> = { 'ON TIME': 'GATE OPEN', 'GATE OPEN': 'BOARDING', BOARDING: 'FINAL CALL', 'FINAL CALL': 'DEPARTED', DEPARTED: 'ON TIME', DELAYED: 'ON TIME', 'SOLD OUT': 'SOLD OUT' };
  let acc = 0, step = 0, turn = 0;
  k.ticks.push((t, dt) => {
    clock = t; acc += dt; step += dt;
    if (flip) { redraw(); if (t - flip.from > 1.4) { flip = null; redraw(); } return; }
    if (step > 9) {
      step = 0; turn++;
      const ri = (turn * 3) % rows.length, r = rows[ri];
      if (r.rem === 'SOLD OUT') return;
      r.rem = NEXT[r.rem] ?? 'ON TIME';
      if (r.rem === 'ON TIME' && turn % 2) r.t += 3;   // a departed flight comes round again three hours on
      flip = { row: ri, from: t, to: r.rem };
    }
    if (acc > 20) { acc = 0; hour = (hour0 + t / 3600) % 24; redraw(); }
  });
}

/* An airport sign: black, yellow type in the house face, an arrow drawn (not typed) where the way is. Hung on two rods,
   two faced. */
function hangSign(k: Parameters<RoomDef['build']>[0], lines: string[], arrow: 'left' | 'right' | 'up' | '', w: number, h: number, x: number, y: number, z: number, rotY: number, rod = 2.2, bg = '#0b0c10', fg = '#ffcf1a') {
  if (!HAS_DOM) return;
  const W = 1024, H = Math.max(96, Math.round((W * h) / w));
  const t = paintTex(W, H, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = fg; g.strokeStyle = fg;
    const ax = arrow === 'left' ? H * 0.62 : arrow === 'right' ? W - H * 0.62 : arrow === 'up' ? H * 0.62 : 0;
    if (arrow) {
      g.save(); g.translate(ax, H / 2); g.rotate(arrow === 'left' ? Math.PI : arrow === 'up' ? -Math.PI / 2 : 0);
      const s = H * 0.3; g.beginPath(); g.moveTo(-s, -s * 0.22); g.lineTo(s * 0.15, -s * 0.22); g.lineTo(s * 0.15, -s * 0.62); g.lineTo(s, 0); g.lineTo(s * 0.15, s * 0.62); g.lineTo(s * 0.15, s * 0.22); g.lineTo(-s, s * 0.22); g.closePath(); g.fill(); g.restore();
    }
    const left = arrow === 'left' || arrow === 'up' ? H * 1.2 : H * 0.28, right = arrow === 'right' ? W - H * 1.2 : W - H * 0.28;
    g.textBaseline = 'middle'; g.textAlign = arrow === 'right' ? 'right' : 'left';
    const lh = H / (lines.length + 0.4);
    lines.forEach((s, i) => { fit(g, s, i ? 'W2 Archivo Narrow' : 'W2 Archivo Expanded', lh * (i ? 0.62 : 0.7), right - left); g.fillText(s, arrow === 'right' ? right : left, lh * (i + 0.7)); });
  }, ['W2 Archivo Expanded', 'W2 Archivo Narrow']);
  const m = new T.MeshBasicMaterial({ map: t, toneMapped: false });
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = rotY; k.add(g);
  for (const s of [0, 1]) { const p = new T.Mesh(new T.PlaneGeometry(w, h), m); p.position.z = s ? -0.04 : 0.04; p.rotation.y = s ? PI : 0; g.add(p); }
  const edge = new T.Mesh(new T.BoxGeometry(w + 0.06, h + 0.06, 0.06), new T.MeshBasicMaterial({ color: 0x1a1c22 })); g.add(edge);
  const rodM = new T.MeshBasicMaterial({ color: 0x3a3d44 });
  for (const sx of [-1, 1]) { const r = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, rod, 6), rodM); r.position.set(sx * w * 0.36, h / 2 + rod / 2, 0); g.add(r); }
}

/* ================================================================== */
/* ---------------- 182 THE ARRIVAL ---------------- */
export const mlowintl: RoomDef = {
  id: 'mlowintl',
  name: 'The arrival',
  area: 'MLOW INTERNATIONAL, TERMINAL B "BLOSSOM" / QUEENS',
  mood: 'Blue glass, a gallery concourse, and a jet taking off for you',
  color: '#2962ff',
  daylit: true,
  description: 'MLow\'s airport, landed in the census as the room for The Arrival. From the air Terminal B reads as the evil eye, an almond plaza with a blue glass dome for an iris, and its seven gate pods open like the blossom. You arrive under the dome, among check in islands and the departures board, walk the gallery concourse where the census hangs in the terminal\'s own frames, and come out in the blossom gate hub among the seven sculptures. Through the glass, MW317 rolls down the runway and climbs away. Stand on the blossom in the middle of the hub and it is cleared for you.',
  signatures: 'The blue glass dome over the rotunda with its ink oculus, the eye inlaid in the rotunda floor, four island check in desks with MLOW backwalls, the departures board listing the collections, art wrapped columns, the gallery concourse with its skylight slot and blue band, MLOW SHOP and CLOUD 9 CAFE, the neck to the blossom gate hub, seven blossom sculptures on plinths, gate signs B1 to B7, the arrivals annex with two art wrapped carousels, MLOW AIR jets with evil eye tails at the jet bridges, runway 09/27, the control tower with its eye, the MLOW blimp, the helipad, taxi 317 at the drop off.',
  build(k, ctx) {
    const hour0 = typeof k.o.hour === 'number' && Number.isFinite(k.o.hour) ? k.o.hour : 15;
    const sun0 = sunDir(hour0);
    k.sky({ top: 0x5f95d8, horizon: 0xeadfcc, ground: 0x8a8478, fog: 0.0009, sun: { az: 3.6, el: 0.3, color: 0xffe2c0, size: 8 }, haze: 0.3, env: 0.5 });
    k.hemi(0xe8e0d0, 0x8a8478, 0.72);
    /* the sun lights what the bake cannot: the hung works, the travellers, the flowers */
    const sunL = k.sun(0xffe8cc, 1.9 * (0.25 + 0.75 * sun0.day), sun0.d.x * 160, sun0.d.y * 160 + 2, sun0.d.z * 160 - 90, false, 120);
    sunL.target?.position?.set(0, 0, -90);
    if (!ctx.reduced) { let acc = 10; k.ticks.push((t, dt) => { acc += dt; if (acc < 0.5) return; acc = 0; const s = sunDir((hour0 + t / 3600) % 24); sunL.position.set(s.d.x * 160, s.d.y * 160 + 2, s.d.z * 160 - 90); sunL.intensity = 1.9 * (0.25 + 0.75 * s.day); }); }

    /* ---- collision: the plan rasterised into blocks, runs merged per row ---- */
    {
      const G = 1.5, [x0, x1, z0, z1] = BOUNDS;
      for (let z = z0; z < z1; z += G) {
        let run: number | null = null;
        for (let x = x0; x <= x1 + 1e-6; x += G) {
          const solid = x <= x1 - 1e-6 && !walkable(x + G / 2, z + G / 2);
          if (solid && run === null) run = x;
          if (!solid && run !== null) { k.block(run, x, z, Math.min(z + G, z1)); run = null; }
        }
      }
      for (const [x, z, r] of KEEP) k.keepOut.push({ x, z, r });
    }

    /* ---- the terminal: one baked set. Unlit atlases, dimmed after dark toward the interior light ---- */
    let jet: T.Group | null = null, blimp: T.Group | null = null;
    const cullFar: Far = [];
    const dim = new T.Color(1, 1, 1).lerp(new T.Color(0.42, 0.47, 0.62), k.night * 0.85);
    void Promise.resolve(k.prop('mlow_international', 0, -3.3, 0, { scale: 1 })).then((root) => {
      if (!root || !(root as T.Object3D).isObject3D) return;
      /* kit.prop seats a model by its bounding box bottom, which reads wrong on this quantised file
         (it lifted the terminal 58 m). The set is built at true size in the room's own frame: put it there */
      root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); root.scale.setScalar(1);
      root.updateMatrixWorld(true);
      /* 2026-10-28: the travellers were Blender primitives instanced in the set (a shirt coloured cylinder body, a sphere
         head, cylinder legs; six templates parked under the ground). The kit casts each where it stood as a whole cast
         character, rigged near the visitor (idle, head turned to you); the primitives hide when the cast lands. */
      const people = new Set<T.Object3D>();
      {
        /* each traveller is a node person_tmpl<k>[.nnn] (body, head and legs as its primitives); the six bare
           templates are parked under the ground */
        const srcs: T.Object3D[] = [];
        const oldCrowd = HAS_DOM && /[?&]crowd=old/.test(location.search);   // then they merge with the set as before
        if (!oldCrowd) root.traverse((o) => { if (/^person_tmpl\d/.test(o.name) && !/^person_tmpl\d/.test(o.parent?.name || '')) srcs.push(o); });
        for (const o of srcs) { o.userData.person = 'auto'; o.userData.personH = 1.0; o.userData.personMinY = -10; o.traverse((c) => people.add(c)); }   // kept out of the static merge below
        k.castLate(srcs, srcs);
      }
      const jetParts: T.Object3D[] = [], blimpParts: T.Object3D[] = [];
      root.traverse((o) => {
        if (/^MLOWAIR_taxi/.test(o.name)) jetParts.push(o);
        else if (/^blimp/.test(o.name)) blimpParts.push(o);
      });
      const rig = (parts: T.Object3D[], at: T.Vector3) => {
        const g = new T.Group(); g.position.copy(at); root.add(g); g.updateMatrixWorld(true);
        for (const p of parts) if (!parts.includes(p.parent as T.Object3D)) g.attach(p);
        return g;
      };
      if (jetParts.length) jet = rig(jetParts, v(120, 3.3, -290));
      if (blimpParts.length) blimp = rig(blimpParts, v(0, 3.3, -60));
      const moving = new Set<T.Object3D>(); jet?.traverse((o) => moving.add(o)); blimp?.traverse((o) => moving.add(o));
      /* merge every static mesh per material: a thousand nodes become a few dozen draws.
         2026-11-25 (THE BIG UPGRADE): merged per material AND per 40 m cell, so the frustum drops what is behind
         the visitor (the whole set was one draw per material and counted every triangle from every spot); the
         1,136 little flowers hide beyond 55 m and the seven blossom sculptures (365k triangles) beyond 105 m */
      const groups = new Map<string, { m: T.Material; gs: T.BufferGeometry[]; far: number }>(), drop: T.Mesh[] = [];
      root.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(root.matrixWorld).invert();
      const CELL = 40, bb = new T.Box3(), ctr = new T.Vector3();
      /* a primitive's own name is its glTF mesh's; the node that placed it is somewhere above */
      const under = (o: T.Object3D, re: RegExp) => { for (let p: T.Object3D | null = o; p && p !== root; p = p.parent) if (re.test(p.name)) return true; return false; };
      root.traverse((o) => {
        if (!(o instanceof T.Mesh) || moving.has(o) || people.has(o)) return;
        /* the census takes the concourse frames: the terminal's own fLOWers canvases, their title plaques
           and halos go; its frames, rails and picture lights stay */
        if (/^art[WEA]+_\d+(_ttl|_halo|_grail)?(_\d+)?$/.test(o.name || o.parent?.name || '')) { drop.push(o); return; }
        /* the departures boards: the lettering was extruded type (about 200k triangles for two boards); the cabinets
           stay and the split flap boards below are painted on their faces */
        if (/^fids_(rot|hub)_(hd|f|d|g|s)\d+$/.test(o.name || o.parent?.name || '')) { drop.push(o); return; }
        /* the carousels' box bags: real cases ride the belts below */
        if (/^car[12]_bag\d$/.test(o.name || o.parent?.name || '')) { drop.push(o); return; }
        o.castShadow = false; o.receiveShadow = false;
        const m = o.material as T.Material;
        if (m instanceof T.MeshBasicMaterial && m.map) m.color.copy(dim);
        if ((m as T.Material).transparent) return;
        const src = o.geometry as T.BufferGeometry, g = new T.BufferGeometry();
        g.setAttribute('position', floatAttr(src.attributes.position, 3));
        if (src.attributes.normal) g.setAttribute('normal', floatAttr(src.attributes.normal, 3));
        for (const uv of ['uv', 'uv1']) if (src.attributes[uv]) g.setAttribute(uv, floatAttr(src.attributes[uv], 2));
        if (src.index) g.setIndex(src.index.clone());
        g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
        /* kit.prop clones every material per mesh, so group by what the material is, not its uuid */
        const tex = (m as T.MeshBasicMaterial).map?.uuid ?? '', col = (m as T.MeshBasicMaterial).color?.getHexString?.() ?? '';
        const far = under(o, /^flower_tmpl/) ? 28 : under(o, /^Curve/) ? 105 : 0;
        g.computeBoundingBox(); bb.copy(g.boundingBox!).getCenter(ctr);
        const cell = `${Math.floor(ctr.x / CELL)},${Math.floor(ctr.z / CELL)}`;
        const key = [m.type, m.name, tex, col, (m as T.Material).side, Object.keys(g.attributes).sort().join(','), far].join('|');
        if (!groups.has(key)) groups.set(key, { m, gs: [], far });
        const ng = g.index ? g.toNonIndexed() : g;
        ng.userData.cell = cell;
        groups.get(key)!.gs.push(ng);
        drop.push(o);
      });
      /* a material with many triangles (the bake, the flowers, the extruded type) splits by cell so the frustum can drop
         what is behind; the hundred small ones stay one draw each */
      const parts: { m: T.Material; gs: T.BufferGeometry[]; far: number }[] = [];
      for (const gr of groups.values()) {
        const tris = gr.gs.reduce((a, g) => a + g.attributes.position.count / 3, 0);
        if (tris < 12000 && !gr.far) { parts.push(gr); continue; }
        const by = new Map<string, T.BufferGeometry[]>();
        for (const g of gr.gs) { const c = g.userData.cell as string; if (!by.has(c)) by.set(c, []); by.get(c)!.push(g); }
        for (const gs of by.values()) parts.push({ m: gr.m, gs, far: gr.far });
      }
      for (const { m, gs, far } of parts) {
        const mg = mergeGeometries(gs, false); if (!mg) continue;
        mg.computeBoundingSphere();
        let mat = m;
        /* scanned stone and plaster laid over the bake as a detail layer (the light stays MLow's) */
        if (/^baked_(int0|pod0|ext0)$/.test(m.name) && mg.attributes.normal && m instanceof T.MeshBasicMaterial) mat = bakedDetail(m, m.name !== 'baked_ext0');
        const mesh = new T.Mesh(mg, mat); root.add(mesh);
        if (far) cullFar.push({ o: mesh, c: mg.boundingSphere!.center.clone(), r: mg.boundingSphere!.radius, far });
      }
      for (const o of drop) o.parent?.remove(o);
    });
    /* hide the little things far away: checked four times a second, not per frame */
    {
      let acc = 1;
      k.ticks.push((_t, dt) => {
        acc += dt; if (acc < 0.25) return; acc = 0;
        const c = museum()?.camera; if (!c) return;
        for (const f of cullFar) f.o.visible = f.c.distanceTo(c.position) - f.r < f.far;
      });
    }

    /* hero: MW317 rolls east down 09/27, rotates and climbs out. Every 75 s, or when cleared from the hub */
    const JET_T = 75;
    let jetT = 18;
    const placeJet = (s: number) => {
      if (!jet) return;
      const roll = smooth(s / 0.55), x = -470 + 520 * roll * roll, air = clamp01((s - 0.55) / 0.45);
      const climb = air * air;
      jet.position.set(120 + x + 900 * air, 3.3 + 210 * climb, -290 - 30 * air);
      jet.rotation.set(0, 0, 0.16 * smooth(air * 4) * (1 - air * 0.5));
      jet.visible = s < 0.995;
    };
    if (!ctx.reduced) k.ticks.push((_t, dt) => { jetT = (jetT + Math.min(dt, 0.1)) % JET_T; placeJet(jetT / JET_T); });
    if (!ctx.reduced) k.ticks.push((_t, dt) => { if (blimp) blimp.rotation.y += Math.min(dt, 0.1) * 0.018; });

    /* the thing to do: stand on the blossom in the middle of the gate hub and MW317 is cleared */
    {
      let onFor = 0, cleared = -1, caption: HTMLDivElement | null = null;
      const say = (s: string) => {
        if (!HAS_DOM) return;
        if (!caption) {
          caption = document.createElement('div');
          caption.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:40;pointer-events:none;padding:10px 16px;background:rgba(10,12,18,.84);border:1px solid #2962ff;color:#f0f4f8;font:13px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;text-align:center;opacity:0;transition:opacity .5s';
          document.body.appendChild(caption);
          const watch = setInterval(() => { if (museum()?.kit !== k) { caption?.remove(); caption = null; clearInterval(watch); } }, 800);
        }
        if (s) caption.innerHTML = s;
        caption.style.opacity = s ? '1' : '0';
      };
      k.ticks.push((t, dt) => {
        const c = museum()?.camera; if (!c) return;
        const on = Math.hypot(c.position.x, c.position.z + 196) < 2.2;
        onFor = on ? onFor + dt : 0;
        if (onFor > 1.5 && (cleared < 0 || t - cleared > 30)) { cleared = t; jetT = 0; say('MW317 TO NEW YORK<br>CLEARED FOR TAKEOFF, RUNWAY 09'); }
        if (cleared >= 0 && t - cleared > 7) say('');
      });
    }

    /* the departures boards: split flap, on the set's own cabinets under the dome and in the gate hub, with the New York
       time in the header (it was a separate time board under the screen) */
    {
      const q = Math.ceil((hour0 * 60 + 5) / 15) * 15 / 60, at = (i: number) => q + i * 0.25;
      const rot: Row[] = [
        ['MW317', 'NEW YORK', 'B1', 'BOARDING'], ['MW111', 'KEYSTONE 111', 'B2', 'ON TIME'], ['MW076', 'THE MARKS', 'B3', 'GATE OPEN'],
        ['MW420', 'OPEN EYE FLOWERS', 'B4', 'ON TIME'], ['MW1111', 'THE CENSUS', 'B5', 'SOLD OUT'], ['MW023', 'IMPERMANENT LOSS', 'B6', 'DELAYED'],
        ['MW045', 'TRANSDIMENSIONAL', 'B7', 'ON TIME'], ['MW182', 'THE ARRIVAL', 'B1', 'ON TIME'], ['MW6529', 'THE MEMES', 'B4', 'ON TIME'],
      ].map(([flight, dest, gate, rem], i) => ({ t: at(i), flight, dest, gate, rem }));
      flapBoard(k, 'DEPARTURES', rot, hour0, [[0, 5.2, -11.8, 0], [0, 5.2, -12.2, PI]], 8.8, 6.3, ctx.reduced);
      const hub: Row[] = [
        ['MW317', 'NEW YORK', 'B1', 'FINAL CALL'], ['MW6529', 'THE MEMES', 'B2', 'BOARDING'], ['MW777', 'MEME ISLAND', 'B3', 'ON TIME'],
        ['MW1101', 'THE LIGHTINGS', 'B4', 'GATE OPEN'], ['MW212', 'QUEENS', 'B5', 'ON TIME'], ['MW718', 'BROOKLYN', 'B6', 'DELAYED'],
        ['MW917', 'THE BRONX', 'B7', 'ON TIME'], ['MW646', 'STATEN ISLAND', 'B2', 'ON TIME'], ['MW111', 'KEYSTONE 111', 'B3', 'ON TIME'],
      ].map(([flight, dest, gate, rem], i) => ({ t: at(i), flight, dest, gate, rem }));
      const th = -0.6113, nx = Math.sin(th) * 0.2, nz = Math.cos(th) * 0.2;
      flapBoard(k, 'GATES B1 TO B7', hub, hour0, [[-12 + nx, 4.8, -183 + nz, th], [-12 - nx, 4.8, -183 - nz, th + PI]], 7.8, 6.3, ctx.reduced);
    }

    /* ================= THE BIG UPGRADE (2026-11-25): an airport that is in use ================= */
    {
      /* a spot is free when it is on the plan and clear of every desk, plinth, column and traveller */
      const extra: [number, number, number][] = [];
      const free = (x: number, z: number, r: number) => walkable(x, z) && !KEEP.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + r) && !extra.some(([ex, ez, er]) => Math.hypot(x - ex, z - ez) < er + r);
      const claim = (x: number, z: number, r: number) => { extra.push([x, z, r]); k.keepOut.push({ x, z, r }); };

      /* gate seating, four to a beam (Blender, props/mlowintl): facing in round the rotunda, back to back down the
         concourse facing the works, facing the gates in the hub. A unit is 2.5 m; it goes in only where all of it is free */
      const seats: [number, number, number, number][] = [];
      const unit = (x: number, z: number, r: number) => {
        const ax = Math.cos(r), az = -Math.sin(r), fx = -Math.sin(r) * 0.15, fz = -Math.cos(r) * 0.15;
        const pts = [-1.05, 0, 1.05].map((s) => [x + ax * s + fx, z + az * s + fz] as const);
        if (!pts.every(([px, pz]) => free(px, pz, 0.55))) return false;
        for (const [px, pz] of pts) claim(px, pz, 0.5);
        seats.push([x, FLOOR, z, r]);
        return true;
      };
      for (const deg of [0, 180, 22, 158, -22, -158, -62, -118, 62, 118]) {
        const a = (deg * PI) / 180, R = Math.abs(deg) > 50 && Math.abs(deg) < 130 ? 23 : 21.5, x = R * Math.cos(a), z = R * Math.sin(a);
        unit(x, z, Math.atan2(x, z));
      }
      for (let z = -56; z >= -146; z -= 10) { unit(0.42, z, -PI / 2); unit(-0.42, z, PI / 2); }
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 2 * PI + 0.22, x = Math.sin(a) * 13.6, z = -196 + Math.cos(a) * 13.6;
        if (z > -186) continue;   // not across the neck, the way in
        unit(x, z, Math.atan2(-Math.sin(a), -Math.cos(a)));
      }
      glbs(k, 'mlowintl/gate_seats', { width: 2.52 }, seats, cullFar, 75);

      /* the check in queues: brass posts and velvet rope (our Blender kit's pair of posts) snaking in front of the four
         island desks, the way in left open on the outer line */
      const posts: [number, number, number, number][] = [];
      for (const [sx, sz] of [[1, -1], [-1, -1], [-1, 1], [1, 1]]) {
        const cx = sx * 12.73, cz = sz * 12.73, f = [-sx / Math.SQRT2, -sz / Math.SQRT2], t = [-sz / Math.SQRT2, sx / Math.SQRT2], r = Math.atan2(-t[1], t[0]);
        for (const [d, ss] of [[2.1, [-1.25, 1.25]], [3.5, [sx * sz > 0 ? 1.25 : -1.25]]] as const) for (const s of ss) {
          const x = cx + f[0] * d + t[0] * s, z = cz + f[1] * d + t[1] * s;
          const ends = [-1, 1].map((e) => [x + t[0] * e * 0.95, z + t[1] * e * 0.95] as const);
          if (!ends.every(([ex, ez]) => free(ex, ez, 0.2))) continue;
          posts.push([x, FLOOR, z, r]);
          for (const [ex, ez] of ends) claim(ex, ez, 0.22);
          claim(x, z, 0.2);
        }
      }
      glbs(k, 'mlowintl/rope_stanchion', { height: 0.98 }, posts, cullFar, 60);

      /* travellers' bags: a hard shell case by some of the people in the rotunda and the annex */
      const bags: [number, number, number, number][][] = [[], [], []];
      KEEP.forEach(([x, z, r], i) => {
        if (r > 0.6 || i % 3 === 1) return;
        const a = i * 2.39996, bx = x + Math.cos(a) * (r + 0.32), bz = z + Math.sin(a) * (r + 0.32);
        if (Math.hypot(bx, bz) > 27 && !(bx > 37 && bz > -50 && bz < -16)) return;
        if (!walkable(bx, bz) || extra.some(([ex, ez, er]) => Math.hypot(bx - ex, bz - ez) < er + 0.25)) return;
        extra.push([bx, bz, 0.25]);
        bags[i % 3].push([bx, FLOOR, bz, a]);
      });
      ['case_blue', 'case_coral', 'case_silver'].forEach((n, i) => glbs(k, `mlowintl/${n}`, { height: 0.72 }, bags[i], cullFar, 45));
      /* and an old leather suitcase (Poly Haven, CC0) or two waiting by the belts */
      const old: [number, number, number, number][] = [];
      for (const [x, z, r] of [[43.4, -25.5, 0.4], [58.6, -27.0, 2.2], [65.2, -38.6, 1.1], [79.0, -37.0, 2.8], [61.0, -22.5, 0.2]] as const) if (free(x, z, 0.45)) { old.push([x, FLOOR, z, r]); claim(x, z, 0.4); }
      glbs(k, 'mlowintl/ph_vintage_suitcase', { width: 0.7 }, old, cullFar, 45);

      /* plants and bins (Poly Haven, CC0) */
      const plants: [number, number, number, number][] = [], bins: [number, number, number, number][] = [];
      for (const [sx, sz] of [[1, -1], [-1, -1], [-1, 1], [1, 1]]) {
        const cx = sx * 12.73, cz = sz * 12.73, t = [-sz / Math.SQRT2, sx / Math.SQRT2];
        for (const s of [sx * sz]) {   /* one plant a desk, at its outer end */
          const x = cx + t[0] * s * 3.6 + sx * 0.8, z = cz + t[1] * s * 3.6 + sz * 0.8;
          if (free(x, z, 0.45)) { plants.push([x, FLOOR, z, s * sx]); claim(x, z, 0.45); }
        }
      }
      for (const [x, z] of [[-9.6, -27.5], [9.6, -27.5], [-9.8, -150], [9.8, -150], [39, -25], [39, -16]] as const) if (free(x, z, 0.35)) { bins.push([x, FLOOR, z, x]); claim(x, z, 0.35); }
      glbs(k, 'mlowintl/ph_potted_plant_01', { height: 1.5 }, plants, cullFar, 55);
      glbs(k, 'mlowintl/ph_metal_trash_can', { height: 0.95 }, bins, cullFar, 40);

      /* signs: black, yellow, in the house type, hung where the ways part */
      hangSign(k, ['GATES B1 TO B7', 'GALLERY CONCOURSE'], 'up', 5.0, 1.15, -8.2, 5.6, -26.2, 0);
      hangSign(k, ['MLOW SHOP', 'CLOUD 9 CAFE  ·  RESTROOMS'], 'up', 4.6, 1.15, 8.2, 5.6, -26.2, 0);
      hangSign(k, ['BAGGAGE CLAIM', 'ARRIVALS  ·  GROUND TRANSPORTATION'], 'up', 5.6, 1.15, 21.5, 5.1, -20, -PI / 2);
      hangSign(k, ['DEPARTURES', 'CHECK IN  ·  TERMINAL B'], 'left', 4.6, 1.15, 23, 5.1, -20, PI / 2);
      for (const z of [-66, -106]) hangSign(k, ['GATES B1 TO B7', 'BLOSSOM GATE HUB'], 'up', 5.4, 1.15, 0, 5.6, z, 0, 1.4);
      hangSign(k, ['ALL GATES', 'B1  B2  B3  B4  B5  B6  B7'], '', 5.2, 1.15, 0, 5.6, -160, 0, 1.4);
      for (const [cx, n] of [[50, 1], [72, 2]] as const) hangSign(k, [`CLAIM ${n}`, n === 1 ? 'MW317 NEW YORK  ·  MW182 THE ARRIVAL' : 'MW6529 THE MEMES  ·  MW111 KEYSTONE 111'], '', 3.6, 1.0, cx - 6.4, 4.3, -32, PI / 2, 1.4, '#2962ff', '#ffffff');

      /* the carousels run: cases ride both belts, lying on their backs, round and round */
      {
        const N = 12, RAD = 4.9, BELT = 0.62, cols = ['case_blue', 'case_coral', 'case_silver'];
        /* most lie on their backs as bags do on a belt; every third one stands, leaning on the one before */
        const lie = new T.Matrix4().makeTranslation(0, 0.13, 0.36).multiply(new T.Matrix4().makeRotationX(-PI / 2));
        const lean = new T.Matrix4().makeRotationZ(0.18);
        const sets: { ins: ReturnType<typeof heroInstances>; items: { cx: number; a0: number }[] }[] = [];
        cols.forEach((n, ci) => {
          const items: { cx: number; a0: number }[] = [];
          for (const cx of [50, 72]) for (let i = ci; i < N; i += 3) items.push({ cx, a0: (i / N) * 2 * PI + (cx === 72 ? 0.3 : 0) + (i % 2) * 0.12 });
          void hero(k, `mlowintl/${n}`, { height: 0.72 }).then((h) => { if (!h || !k.live) return; const ins = heroInstances(k, h, items.length); for (const pt of ins.parts) { pt.im.castShadow = pt.im.receiveShadow = false; cullFar.push({ o: pt.im, c: v(61, 1, -32), r: 17, far: 40 }); } sets.push({ ins, items }); place(lastT); });
        });
        const m = new T.Matrix4(), q = new T.Quaternion(), up = v(0, 1, 0), one = v(1, 1, 1), p = v(0, 0, 0);
        let lastT = 0;
        const place = (t: number) => {
          lastT = t;
          for (const s of sets) {
            s.items.forEach((it, i) => {
              const a = it.a0 + t * 0.09;
              p.set(it.cx + Math.cos(a) * RAD, BELT, -32 + Math.sin(a) * RAD);
              m.compose(p, q.setFromAxisAngle(up, -a), one).multiply(i % 3 === 2 ? lean : lie);
              s.ins.setAt(i, m);
            });
            s.ins.commit();
          }
        };
        if (!ctx.reduced) k.ticks.push((t) => place(t));
      }

      /* the trick: anamorphosis. Paint on the floor of the annex that, from one mark by the way in, stands up as the
         immigration stamp every arrival gets, ADMITTED, NEW YORK. From anywhere else it is a long red smear */
      if (HAS_DOM) {
        const EX = 38.2, EZ = -20, Wd = 3.6, Ht = 1.5, D = 6.5;
        const day = new Date(), mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][day.getMonth()];
        const stamp = paintTex(1024, Math.round((1024 * Ht) / Wd), (g, w, h) => {
          g.clearRect(0, 0, w, h);
          g.strokeStyle = g.fillStyle = '#c8102e';
          g.lineWidth = 16; g.beginPath(); g.roundRect(14, 14, w - 28, h - 28, 46); g.stroke();
          g.lineWidth = 5; g.beginPath(); g.roundRect(40, 40, w - 80, h - 80, 30); g.stroke();
          g.textAlign = 'center'; g.textBaseline = 'middle';
          fit(g, 'ADMITTED', 'W2 Archivo Expanded', h * 0.3, w * 0.78); g.fillText('ADMITTED', w / 2, h * 0.34);
          fit(g, 'NEW YORK', 'W2 Archivo Expanded', h * 0.2, w * 0.6); g.fillText('NEW YORK', w / 2, h * 0.6);
          g.font = `400 ${Math.round(h * 0.1)}px "W2 JetBrains Mono", ui-monospace, monospace`;
          g.fillText(`MLOW INTL  B  ${String(day.getDate()).padStart(2, '0')} ${mon} ${day.getFullYear()}`, w / 2, h * 0.8);
          /* the ink: dry patches where the stamp did not take */
          g.globalCompositeOperation = 'destination-out';
          let sd = 317; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
          for (let i = 0; i < 900; i++) { g.globalAlpha = 0.25 + rnd() * 0.6; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 5, 0, 7); g.fill(); }
          g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        }, ['W2 Archivo Expanded', 'W2 JetBrains Mono']);
        anamorphTex(k, stamp, EX, EZ, EYE + FLOOR, FLOOR, -PI / 2, D, Wd, Ht, 0.9);
        /* the mark: two yellow footprints on the spot */
        const mark = new T.MeshBasicMaterial({ color: 0xffcf1a, transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
        for (const s of [-1, 1]) { const fp = k.mesh(new T.CircleGeometry(0.13, 16), mark, EX - 0.05, FLOOR + 0.016, EZ + s * 0.14, true); fp.rotation.x = -PI / 2; fp.scale.set(0.75, 1.6, 1); fp.rotation.z = PI / 2; }
        k.egg(v(EX + 6, 1.0, EZ), { id: 'mlowintl-stamp', title: 'Anamorphosis', year: '1533', text: 'An anamorphic image is drawn so that it only resolves from one viewpoint; from anywhere else it is a stretched smear. The best known painted example is the distorted skull across the foreground of Hans Holbein the Younger\'s The Ambassadors, 1533. Here the paint on the arrivals floor stands up as an entry stamp, but only from the yellow footprints.', clue: 'The yellow footprints where the arrivals hall opens, facing in.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2.5 });
      }
    }

    /* a welcome mural for the arrivals hall's long north wall (FIREFLY_QUEUE.md): invisible until the file lands */
    fireflyPlate(k, TEXD + 'ff_mli_welcome_mural.webp', 22, 4.4, 62, 3.6, -14.56, PI, new T.MeshBasicMaterial({ visible: false }));

    /* ---- the hang: the concourse's own frames, then the census wall in the arrivals annex ---- */
    const mounts: Mount[] = [];
    for (const [x, y, z, nx, nz, w, h] of ART) {
      const r = Math.atan2(nx, nz), px = x + nx * 0.07, pz = z + nz * 0.07;
      /* stand the visitor 4 m out unless a planter or a traveller is there: try nearer, then further */
      const clear = (d: number) => !KEEP.some(([kx, kz, kr]) => Math.hypot(px + Math.sin(r) * d - kx, pz + Math.cos(r) * d - kz) < kr + 0.45);
      const d = [4, 3.2, 2.6, 5, 6].find(clear) ?? 4;
      mounts.push({ position: v(px, y, pz), rotation: r, target: v(px + Math.sin(r) * d, y, pz + Math.cos(r) * d), width: Math.min(w, 3.2), height: Math.min(h, 3.3), style: 'white', wash: true });
    }
    mounts.sort((a, b) => b.position.z - a.position.z || a.position.x - b.position.x);
    {
      const cols = 16, rows = 3, tile = 0.95, gap = 0.1, H = rows * (tile + gap) - gap;
      k.censusWall({ x: 61, y: 1.1 + H / 2 + FLOOR, z: -51.25, rotY: 0, cols, rows, tile, gap, start: ctx.wallStart(5600, cols * rows), pieces: ctx.all, backing: k.flat(0x0d0d0d, 0, 0.9) });
      /* the terminal's own BAGGAGE CLAIM, ARRIVALS sign already crowns this wall: the era line goes under it */
      k.sign('ERA XII, THE ARRIVAL. EVERY NEW YORKER CAME IN THROUGH SOMEWHERE', 14, 0.34, 61, 0.78 + FLOOR, -51.2, 'transparent', '#f0f4f8', 30);
    }

    /* ---- what the terminal knows ---- */
    const jfk = { name: 'John F. Kennedy International Airport, Wikipedia', url: 'https://en.wikipedia.org/wiki/John_F._Kennedy_International_Airport' };
    k.egg(v(0, 7.8, -11.5), { id: 'mlowintl-idlewild', title: 'Idlewild', year: '1963', text: 'New York International Airport opened in 1948 and was commonly known as Idlewild Airport. It was renamed John F. Kennedy International Airport on December 24, 1963, a month and two days after the assassination of President John F. Kennedy.', clue: 'The departures board under the dome.', source: jfk }, { r: 3 });
    k.egg(v(0, 18, 0), { id: 'mlowintl-saarinen', title: 'A building that flies', year: '1962', text: 'The TWA Flight Center at Idlewild was designed by Eero Saarinen and Associates for Trans World Airlines, and the completed terminal was dedicated on May 28, 1962. It became part of the TWA Hotel, which opened on May 15, 2019.', clue: 'Stand under the dome and look straight up.', source: { name: 'TWA Flight Center, Wikipedia', url: 'https://en.wikipedia.org/wiki/TWA_Flight_Center' } }, { r: 5 });
    k.egg(v(0, 3, -147), { id: 'mlowintl-laguardia', title: 'The Municipal Airport', year: '1939', text: 'LaGuardia Airport was dedicated on October 15, 1939, as the New York Municipal Airport, and opened for business on December 2 that year. It is named after Fiorello La Guardia, a former mayor of New York City.', clue: 'The far end of the gallery concourse.', source: { name: 'LaGuardia Airport, Wikipedia', url: 'https://en.wikipedia.org/wiki/LaGuardia_Airport' } }, { r: 2.5 });
    const build = { name: 'MLOW INTERNATIONAL, the Blender build notes', url: 'https://n3wyorkers.com/museum.html#mlowintl' };
    k.egg(v(32, 1, 52), { id: 'mlowintl-taxi317', title: 'Taxi 317', text: 'The yellow cab waiting at the drop off is number 317, the number MLow signs with. It was parked there the day the terminal was built.', clue: 'The kerb outside the front doors, through the glass.', source: build }, { r: 6 });
    k.egg(v(-12, 7.4, -183), { id: 'mlowintl-mw6529', title: 'Flight MW6529', text: 'The departures in the gate hub list MW6529, a flight that only leaves from this terminal. The number nods to 6529 and The Memes.', clue: 'The departures screen over the gate hub.', source: build }, { r: 3 });
    k.egg(v(-85, 1, -28), { id: 'mlowintl-helipad', title: 'The helipad watches back', text: 'The helipad to the west of the plaza is painted as the evil eye, so the terminal is watched from the air as well as seen from it.', clue: 'West of the rotunda, out on the field, from the glass.', source: build }, { r: 8 });

    return { mounts, spawn: v(0, EYE + FLOOR, 22), look: v(0, 6, -12), eye: EYE, floorY: () => FLOOR, bounds: BOUNDS, style: 'white' };
  },
};
