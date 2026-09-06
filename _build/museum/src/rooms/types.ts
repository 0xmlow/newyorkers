import * as T from 'three';
import type { Kit, Mount, FrameStyle } from '../kit';
import { v } from '../kit';
import type { Piece } from '../data';

export type RoomBuild = {
  mounts: Mount[];
  spawn: T.Vector3;
  look: T.Vector3;
  eye: number;
  bounds: [number, number, number, number];
  path?: T.Vector3[];
  floorY?: (x: number, z: number) => number;
  style: FrameStyle;
  ceiling?: number;
};
export type RoomCtx = {
  pieces: Piece[];
  all: Piece[];
  thumb: (p: Piece) => string;
  reduced: boolean;
  quality: 'high' | 'low';
  wallStart: (from: number, count: number) => number;
};
export type RoomDef = {
  id: string;
  name: string;
  area: string;
  mood: string;
  color: string;
  description: string;
  signatures: string;
  /* false for rooms whose hour is part of their identity (after hours, last train, midnight) */
  daylit?: boolean;
  build: (k: Kit, ctx: RoomCtx) => RoomBuild;
};

/* Standard long-gallery layout: pairs of wall mounts facing inward along z,
   and an optional pair on the end wall. */
export function corridorMounts(p: { pairs: number; x: number; z0?: number; pitch?: number; y?: number; width?: number; height?: number; inset?: number; end?: number; endZ?: number; endGap?: number; style?: FrameStyle; wash?: boolean }): Mount[] {
  const { pairs, x, z0 = 4, pitch = 6, y = 3.4, width = 5.6, height = 3.2, inset = 5.2, end = 0, endGap = 6.6, style, wash } = p;
  const mounts: Mount[] = [];
  for (let i = 0; i < pairs * 2; i++) {
    const s = i % 2 ? 1 : -1,
      z = z0 - Math.floor(i / 2) * pitch;
    mounts.push({ position: v(s * x, y, z), rotation: s < 0 ? Math.PI / 2 : -Math.PI / 2, target: v(s * (x - inset), 3, z), width, height, style, wash });
  }
  const endZ = p.endZ ?? z0 - pairs * pitch - 1.5;
  for (let i = 0; i < end; i++) {
    const ex = (i - (end - 1) / 2) * endGap;
    mounts.push({ position: v(ex, y, endZ), rotation: 0, target: v(ex, 3, endZ + inset), width, height, style, wash });
  }
  return mounts;
}
