/* The brand layer for the institution rooms: MLow's eye and wordmark, Blossom's blossoms, in three dimensions and on banners.
   Rules carried from the Blossom design system: the blossoms are solid black, white or one accent, never outlined, never stretched;
   BLOSSOM is set in caps with wide tracking and always beside a blossom; the MLow eye is the sovereign mark; no gradients. */
import * as T from 'three';
import { v } from '../kit';
import type { Kit } from '../kit';

const PI = Math.PI;
export const INK = 0x0d0d0d, CLOUD = 0xf0f4f8, ELECTRIC = 0x2962ff, CYAN = 0x00e5ff, MINT = 0x3dffc0, SKY = 0x7eb8ff;

/* A hanging exhibition banner on two rods: the MLow wordmark on ink, or on cloud. Museums hang these on their facades. */
export function mlowBanner(k: Kit, x: number, y: number, z: number, rotY: number, w = 4, dark = true) {
  const h = w * 1.6;
  const back = k.box(w, h, 0.06, 0, 0, 0, k.flat(dark ? INK : CLOUD, 0.05, 0.75));
  back.position.set(x, y, z); back.rotation.y = rotY;
  const logo = k.mesh(new T.PlaneGeometry(w * 0.82, w * 0.82 * (368 / 1483)), k.image(dark ? 'assets/brand/logo_white.png' : 'assets/brand/logo_black.png'), 0, 0, 0);
  logo.position.set(x + Math.sin(rotY) * 0.04, y + h * 0.28, z + Math.cos(rotY) * 0.04); logo.rotation.y = rotY;
  const eye = k.mesh(new T.PlaneGeometry(w * 0.34, w * 0.34), k.image('assets/brand/eye_truecolor.png'), 0, 0, 0);
  eye.position.set(x + Math.sin(rotY) * 0.04, y - h * 0.08, z + Math.cos(rotY) * 0.04); eye.rotation.y = rotY;
  k.sign('THE MUSEUM  ·  NEW YORKERS', w * 0.8, w * 0.09, x + Math.sin(rotY) * 0.04, y - h * 0.36, z + Math.cos(rotY) * 0.04, 'transparent', dark ? '#f0f4f8' : '#0d0d0d', 56, rotY);
  const rod = k.flat(0x8c98a4, 0.9, 0.3);
  for (const dy of [h / 2 + 0.1, -h / 2 - 0.1]) { const r = k.cyl(0.03, w + 0.4, 0, 0, 0, rod, 0.03, 8); r.position.set(x, y + dy, z); r.rotation.set(0, rotY, PI / 2); }
  return back;
}

/* A Blossom flag: one blossom, solid, on a field of ink or electric blue, with the wordmark set wide beneath. */
export function blossomFlag(k: Kit, x: number, y: number, z: number, rotY: number, w = 2.4, which: 1 | 3 | 5 | 7 = 3, field: 'ink' | 'electric' | 'cloud' = 'ink') {
  const h = w * 1.5;
  const bg = field === 'ink' ? INK : field === 'electric' ? ELECTRIC : CLOUD;
  const back = k.box(w, h, 0.04, 0, 0, 0, k.flat(bg, 0.05, 0.8)); back.position.set(x, y, z); back.rotation.y = rotY;
  /* the canonical icon set, both polarities, black on light and white on dark */
  const file = `assets/brand/blossom_0${which}_${field === 'cloud' ? 'black' : 'white'}.png`;
  const mark = k.mesh(new T.PlaneGeometry(w * 0.62, w * 0.62), k.image(file, { color: field === 'cloud' || which !== 3 ? 0xffffff : 0xffffff }), 0, 0, 0);
  if (which !== 3 && field !== 'cloud') (mark.material as T.MeshStandardMaterial).color.set(0xffffff);
  mark.position.set(x + Math.sin(rotY) * 0.03, y + h * 0.16, z + Math.cos(rotY) * 0.03); mark.rotation.y = rotY;
  k.sign('B L O S S O M', w * 0.8, w * 0.1, x + Math.sin(rotY) * 0.03, y - h * 0.3, z + Math.cos(rotY) * 0.03, 'transparent', field === 'cloud' ? '#0d0d0d' : '#f0f4f8', 60, rotY);
  return back;
}

/* A donor wall: the museum's credit line in the institution's own lettering, MLow and Blossom marks either side. */
export function donorWall(k: Kit, x: number, y: number, z: number, rotY: number, w = 8, light = false) {
  const fg = light ? '#0d0d0d' : '#f0f4f8';
  k.sign('THE MUSEUM  ·  A NEW YORKERS PROJECT BY MLOW  ·  WITH BLOSSOM', w, w * 0.07, x, y + 0.5, z, 'transparent', fg, 58, rotY);
  k.sign('EVERY NEW YORKER COUNTED  ·  HUNG WHERE THEY WERE RECORDED  ·  ON THE NEW YORK CLOCK', w, w * 0.05, x, y, z, 'transparent', light ? '#3a4654' : '#8899aa', 44, rotY);
  const eye = k.mesh(new T.PlaneGeometry(w * 0.12, w * 0.12), k.image('assets/brand/eye_truecolor.png'), 0, 0, 0);
  eye.position.set(x - Math.cos(rotY) * w * 0.56, y + 0.3, z + Math.sin(rotY) * w * 0.56); eye.rotation.y = rotY;
  const bl = k.mesh(new T.PlaneGeometry(w * 0.12, w * 0.12), k.image(light ? 'assets/brand/blossom_03_black.png' : 'assets/brand/blossom_03_white.png'), 0, 0, 0);
  bl.position.set(x + Math.cos(rotY) * w * 0.56, y + 0.3, z - Math.sin(rotY) * w * 0.56); bl.rotation.y = rotY;
}

/* The eye set into a floor as a medallion, the way institutions set their seal in the lobby. */
export function eyeMedallion(k: Kit, x: number, y: number, z: number, r = 2.4) {
  const ring = k.mesh(new T.RingGeometry(r, r + 0.18, 64), k.flat(ELECTRIC, 0.2, 0.4), x, y + 0.012, z); ring.rotation.x = -PI / 2;
  const disc = k.mesh(new T.CircleGeometry(r, 64), k.image('assets/brand/eye_truecolor.png'), x, y + 0.01, z); disc.rotation.x = -PI / 2;
  return disc;
}

/* A garden of the seven blossoms as sculpture: the enamel blossom GLBs on low plinths, one accent colour per plinth. */
export function blossomGarden(k: Kit, cx: number, y: number, cz: number, r = 6, height = 2.2) {
  const accents = [ELECTRIC, CYAN, MINT, SKY, ELECTRIC, CYAN, MINT];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * PI * 2;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    k.box(1.2, 0.5, 1.2, x, y + 0.25, z, k.flat(accents[i], 0.1, 0.5));
    k.prop(`blossom_0${i + 1}`, x, y + 0.5, z, { height, rotY: -a + PI / 2, keepOut: 0.9 }).then((o) => { if (!o) return; o.traverse((c) => { if (c instanceof T.Mesh) { const m = (c.material as T.MeshStandardMaterial).clone(); m.color.set(i % 2 ? 0x0d0d0d : 0xf0f4f8); m.roughness = 0.35; m.metalness = 0.1; c.material = m; } }); });
  }
  k.sign('B L O S S O M', 4, 0.5, cx, y + 0.28, cz, 'transparent', '#f0f4f8', 60, 0).rotation.set(-PI / 2, 0, 0);
}

/* The MLow eye monument from the Blender kit on a lit plinth, the mark visitors photograph. */
export function eyeMonument(k: Kit, x: number, y: number, z: number, rotY = 0, height = 5.2) {
  k.prop('mlow_eye_monument', x, y, z, { height, rotY, keepOut: 1.6 });
  k.point(x + Math.sin(rotY) * 2.4, y + height * 0.55, z + Math.cos(rotY) * 2.4, CYAN, 30, 12);
}

/* The wordmark relief from the Blender kit, over a doorway or on a lobby wall. */
export function wordmarkRelief(k: Kit, x: number, y: number, z: number, rotY = 0, width = 4) {
  k.prop('mlow_wordmark_relief', x, y, z, { height: width / 3, rotY });
}

export const brandPositions = { v };
