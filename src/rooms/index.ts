import type { Ctx, Room } from '../core/room';
import type { PortalOpts } from '../core/portal';
import { buildBodega } from './bodega';
import { buildWalkup } from './walkup';
import { buildStudio } from './studio';
import { buildLaundromat, DRYERS } from './laundromat';
import { buildSubway } from './subway';
import { buildRooftop } from './rooftop';

// Every room after the block, and every doorway between rooms. a/da: the room and door you see it from;
// b/db: where it goes. both: also build the way back (the default). View only portals (walk: false) are windows.
export type Link = { a: string; da: string; b: string; db: string; opts: PortalOpts; both?: boolean; backOpts?: Partial<PortalOpts> };

export const ROOM_BUILDERS: ((ctx: Ctx) => Room)[] = [buildBodega, buildWalkup, buildStudio, buildLaundromat, buildSubway, buildRooftop];

const DOOR: PortalOpts = { w: 1.1, h: 2.3, res: 512, maxDist: 45 };
export const LINKS: Link[] = [
  // the block meets itself: walk off the far corner and you walk in at the near one
  { a: 'block', da: 'far', b: 'block', db: 'near', opts: { w: 15.9, h: 24, res: 1024, maxDist: 220 } },
  { a: 'block', da: 'bodega', b: 'bodega', db: 'street', opts: DOOR },
  { a: 'block', da: 'walkup', b: 'walkup', db: 'street', opts: DOOR },
  { a: 'block', da: 'laundromat', b: 'laundromat', db: 'street', opts: DOOR },
  { a: 'block', da: 'subway', b: 'subway', db: 'street', opts: DOOR },
  { a: 'walkup', da: 'studio', b: 'studio', db: 'walkup', opts: { ...DOOR, w: 1.0, h: 2.25 } },
  { a: 'walkup', da: 'roof', b: 'rooftop', db: 'stairs', opts: { ...DOOR, w: 1.0, h: 2.2 } },
  { a: 'laundromat', da: 'roof', b: 'rooftop', db: 'chute', opts: { ...DOOR, w: 1.0, h: 2.2 } },
  // the dryer windows: round, view only, each into another room (the last one into this laundromat)
  ...DRYERS.map((room, i) => ({ a: 'laundromat', da: `dryer${i}`, b: room, db: 'cam', both: false,
    opts: { w: 0.68, h: 0.68, res: 256, walk: false, round: true, maxDist: 12 } })),
];
