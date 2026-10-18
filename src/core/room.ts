import * as T from 'three';
import type { Manifest } from './assets';
import type { Rect } from './kit';
import type { Frame } from './portal';

// What every room gives the world. Rooms are built 1 km apart in one scene and only the room you are in (or the
// one a portal is drawing) is visible; all coordinates handed out here are world coordinates unless noted.

export type View = { name: string; note: string; at: T.Vector3; look: T.Vector3 };
export type Ctx = { scene: T.Scene; m: Manifest; still: boolean; mobile: boolean; renderer: T.WebGLRenderer };

export interface Room {
  id: string;
  name: string;            // shown in the room list
  line: string;            // one sentence, shown on entering
  origin: T.Vector3;
  group: T.Group;
  spawn: { at: T.Vector3; look: T.Vector3 };
  views: View[];           // the installation viewpoints (the "look again" list)
  doors: Record<string, Frame>;   // portal anchors: +z of the frame points into this room
  walk: Rect[]; block: Rect[];     // walkable rectangles and obstacles, in room local x/z
  stand?(lx: number, lz: number): boolean; // a room with a non rectangular floor answers this instead
  bg: T.Color; fog: T.FogExp2;
  exposure?: number;
  env?: number;            // how much of the night city HDRI shows in reflections (outdoors 0.35; rooms far less)
  /** Floor height (world y of the floor under x,z), given the current eye y for rooms with several levels. */
  floorY(x: number, z: number, eyeY: number): number;
  /** Per frame. cam is the real camera, or the portal camera when this room is drawn through a doorway. */
  tick(t: number, dt: number, cam: T.Camera, active: boolean): void;
  /** Rooms that move the visitor themselves (the stair that never ends): may shift the camera, returns a message. */
  carry?(cam: T.PerspectiveCamera): string | void;
  interact?(hit: T.Object3D): string | void;
  hud?(): string;
}

export const ORIGINS: Record<string, T.Vector3> = {
  block: new T.Vector3(0, 0, 0),
  bodega: new T.Vector3(1000, 0, 0),
  walkup: new T.Vector3(2000, 0, 0),
  studio: new T.Vector3(3000, 0, 0),
  laundromat: new T.Vector3(4000, 0, 0),
  subway: new T.Vector3(5000, 0, 0),
  rooftop: new T.Vector3(6000, 0, 0),
};
