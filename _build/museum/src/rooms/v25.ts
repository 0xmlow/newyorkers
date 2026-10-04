/* 182: THE ARRIVAL. MLOW INTERNATIONAL, Terminal B "BLOSSOM", MLow's airport, landed in the census as
   the room for era XII, The Arrival: every New Yorker came in through somewhere. The terminal is not
   modelled here. It is MLow's own code generated Blender build (ARCHITECT/mlow-airport-v3), loaded
   whole as one set (assets/museum/props/mlow_international.glb) with its light baked in Cycles:
   colour times direct and bounce light burned into four atlases, drawn unlit, so the rotunda reads as
   the stills did. The New York clock dims it toward its own interior light after dark, moves the sun on
   the people and the hung works, and shows on a board under the departures screen.

   Frame (the terminal's own): +z is landside (the drop off and the plaza, the spawn faces away from it),
   -z airside. The rotunda is a 30 m drum at the origin under the blue glass dome; the gallery concourse
   runs 24 m wide from z -42 to -150; the neck to -177; the blossom gate hub is a 22 m drum at z -196.
   The arrivals annex opens off the rotunda to +x (x 36 to 86) with the two art wrapped carousels.
     Hero: flight MW317 rolls down runway 09/27 behind the gate hub and takes off, again and again.
     Ticks: the MLOW blimp circling the airfield; the New York time board; the sun.
     The thing to do: stand on the blossom in the middle of the gate hub and MW317 is cleared for you.
   Collision is written by hand (the checks never load the GLB): the walkable plan is rasterised into
   blocks, and 200 keep outs for the desks, benches, plinths, carousels, columns and travellers were
   read out of the Blender scene. Mount slots are the concourse's own 18 frames. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
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
    const dim = new T.Color(1, 1, 1).lerp(new T.Color(0.42, 0.47, 0.62), k.night * 0.85);
    void Promise.resolve(k.prop('mlow_international', 0, -3.3, 0, { scale: 1 })).then((root) => {
      if (!root || !(root as T.Object3D).isObject3D) return;
      /* kit.prop seats a model by its bounding box bottom, which reads wrong on this quantised file
         (it lifted the terminal 58 m). The set is built at true size in the room's own frame: put it there */
      root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); root.scale.setScalar(1);
      root.updateMatrixWorld(true);
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
      /* merge every static mesh per material: a thousand nodes become a few dozen draws */
      const groups = new Map<string, { m: T.Material; gs: T.BufferGeometry[] }>(), drop: T.Mesh[] = [];
      root.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(root.matrixWorld).invert();
      root.traverse((o) => {
        if (!(o instanceof T.Mesh) || moving.has(o)) return;
        /* the census takes the concourse frames: the terminal's own fLOWers canvases, their title plaques
           and halos go; its frames, rails and picture lights stay */
        if (/^art[WEA]+_\d+(_ttl|_halo|_grail)?(_\d+)?$/.test(o.name || o.parent?.name || '')) { drop.push(o); return; }
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
        const key = [m.type, m.name, tex, col, (m as T.Material).side, Object.keys(g.attributes).sort().join(',')].join('|');
        if (!groups.has(key)) groups.set(key, { m, gs: [] });
        groups.get(key)!.gs.push(g.index ? g.toNonIndexed() : g);
        drop.push(o);
      });
      for (const { m, gs } of groups.values()) { const mg = mergeGeometries(gs, false); if (mg) root.add(new T.Mesh(mg, m)); }
      for (const o of drop) o.parent?.remove(o);
    });

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

    /* the New York time board under the departures screen */
    if (HAS_DOM) {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      const draw = (h: number) => {
        const g = c.getContext('2d')!, hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
        g.fillStyle = '#0d0d0d'; g.fillRect(0, 0, 1024, 256);
        g.fillStyle = '#00e5ff'; g.font = '600 64px "IBM Plex Mono", ui-monospace, monospace'; g.textAlign = 'center';
        g.fillText('NEW YORK', 512, 92);
        g.fillStyle = '#f0f4f8'; g.font = '700 112px "IBM Plex Mono", ui-monospace, monospace';
        g.fillText(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 512, 214);
        tx.needsUpdate = true;
      };
      draw(hour0);
      const board = k.mesh(new T.PlaneGeometry(3.2, 0.8), new T.MeshBasicMaterial({ map: tx, side: T.DoubleSide }), 0, 3.05, -11.5, true);
      board.rotation.y = 0;
      if (!ctx.reduced) { let acc = 0; k.ticks.push((t, dt) => { acc += dt; if (acc < 20) return; acc = 0; draw((hour0 + t / 3600) % 24); }); }
    }

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
