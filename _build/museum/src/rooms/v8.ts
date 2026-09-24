/* placeholder, replaced by the room builder */
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';

export const palmcourt: RoomDef = {
  id: 'palmcourt', name: 'An afternoon at the Plaza', area: 'THE PLAZA / THE PALM COURT', mood: 'Being built', color: '#c8b98a', daylit: true,
  description: 'Being built.', signatures: 'Being built.',
  build(k, ctx) {
    k.sky({ top: 0x6fa0d8, horizon: 0xdfe8f0, ground: 0x404040 }); k.hemi(0xffffff, 0x404040, 1.2);
    k.box(40, 0.2, 40, 0, -0.1, 0, k.flat(0x888888));
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { k.box(4, 4, 0.3, -12 + i * 5, 2, -10, k.flat(0xeeeeee)); mounts.push({ position: v(-12 + i * 5, 2.2, -9.8), rotation: 0, target: v(-12 + i * 5, 2.2, -6), width: 2.6, height: 1.8, style: 'white', wash: true }); }
    void ctx;
    return { mounts, spawn: v(0, 3, 6), look: v(0, 2.4, -10), eye: 3, bounds: [-19, 19, -19, 19], style: 'white' };
  },
};

export const chelseamarket: RoomDef = {
  id: 'chelseamarket', name: 'The biscuit factory', area: 'CHELSEA MARKET / NINTH AVENUE', mood: 'Being built', color: '#9a4a32', daylit: true,
  description: 'Being built.', signatures: 'Being built.',
  build(k, ctx) {
    k.sky({ top: 0x6fa0d8, horizon: 0xdfe8f0, ground: 0x404040 }); k.hemi(0xffffff, 0x404040, 1.2);
    k.box(40, 0.2, 40, 0, -0.1, 0, k.flat(0x888888));
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { k.box(4, 4, 0.3, -12 + i * 5, 2, -10, k.flat(0xeeeeee)); mounts.push({ position: v(-12 + i * 5, 2.2, -9.8), rotation: 0, target: v(-12 + i * 5, 2.2, -6), width: 2.6, height: 1.8, style: 'white', wash: true }); }
    void ctx;
    return { mounts, spawn: v(0, 3, 6), look: v(0, 2.4, -10), eye: 3, bounds: [-19, 19, -19, 19], style: 'white' };
  },
};
