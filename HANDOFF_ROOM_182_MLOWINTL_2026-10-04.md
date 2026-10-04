# Handoff: room 182, `mlowintl`, THE ARRIVAL (2026-10-04)

MLOW INTERNATIONAL, Terminal B "BLOSSOM", MLow's own code generated Blender airport, landed in the
census as the room for era XII, The Arrival. Built in `_build/museum/src/rooms/v25.ts`, registered in
`v0.ts`, curated in `src/data.ts`, the check scripts assert 182. Nothing deployed.

Unlike every other room, the architecture is not modelled in the room source. It is one set,
`assets/museum/props/mlow_international.glb` (12.6 MB), exported from
`ARCHITECT/mlow-airport-v3` with its light baked in Cycles: colour times direct and bounce light in
four atlases (interiors, gate pods, exteriors, the ground), drawn unlit. Pipeline and rebuild steps are
in `ARCHITECT/mlow-airport-v3/web/README.md`; the set is the `--museum` output of
`web/tools/make_mint.mjs`, then resized, WebP and meshopt.

## What changed outside the room

- **`src/kit.ts`: `gltf.setMeshoptDecoder(MeshoptDecoder)`.** Meshopt compressed props need it; plain
  GLBs are unaffected. Without it `kit.prop` fails silently (its `.catch(() => null)`) and the room
  is empty.
- `assign_hang.mjs` rerun: the new room took its share, so some works moved out of other rooms
  (see the `hang_owned.ts` diff). `keystone.ts` is unchanged.
- `museum.html` copy and JSON-LD now say 182 rooms; `_build/rooms.json` regenerated (182);
  `mint/places.json` has `mlowintl: Queens`.

## Frame and plan

The terminal's own frame: +z landside (drop off, plaza), -z airside. Rotunda: a 30 m drum at the
origin under the blue glass dome (spawn `0, 2.55, 22` looking at the departures board). Gallery
concourse: 24 m wide, z -42 to -150, the 18 mount slots are the concourse's own frames (the
terminal's fLOWers canvases, plaques and halos are dropped in this room; its frames, rails and picture
lights stay). Neck to -177. Blossom gate hub: a 22 m drum at z -196. Arrivals annex off the rotunda
to +x (x 36 to 86) with the two art wrapped carousels and the census wall (16 by 3) under the
terminal's own BAGGAGE CLAIM, ARRIVALS sign.

**Collision is written by hand**, because the checks never load the GLB: `walkable()` is rasterised
into `k.block` runs at 1.5 m, and 204 keep outs (desks, benches, plinths, carousels, columns,
travellers) were read out of the Blender scene. `kit.prop` seats a model by its bounding box bottom,
which reads wrong on this quantised file (it lifted the terminal 58 m), so the room puts the set at
the origin itself. `kit.prop` also clones every material per mesh, so the room merges static meshes
by what the material is, not its uuid: 5,026 meshes become about 270 geometries.

## Moving things, the thing to do, New York time

- Hero: flight MW317 rolls east down runway 09/27 and climbs out, every 75 s.
- The MLOW blimp circles the airfield.
- Stand on the blossom in the middle of the gate hub for 1.5 s: MW317 is cleared for you, with a
  caption (a DOM element removed when the kit changes, as in 181).
- The New York clock: the sun moves on the people, flowers and hung works; a NEW YORK time board
  sits under the departures screen; after dark the baked set dims toward its interior light and
  the dome shows stars. The bake itself is one low sun; it does not move.

## Eggs (6)

Idlewild renamed JFK on December 24, 1963; the TWA Flight Center dedicated May 28, 1962 and the
TWA Hotel opened May 15, 2019; LaGuardia dedicated October 15, 1939 as New York Municipal Airport.
Those three were checked against the Wikipedia pages they cite on 2026-10-04. Taxi 317, flight
MW6529 and the helipad that watches back are MLow's own eggs in the build; their source points at
the museum.

## Numbers (headless, desktop, debug overlay)

Calls 644 at the spawn, 498 in the concourse, 196 to 254 facing a wall or the hub; 2.4M to 2.8M
triangles. **That is two to three times the other rooms**: the whole airfield comes with the set.

## Not verified

- Nobody has walked it in a live browser; views are headless shots (spawn at 14:00 and 22:00,
  concourse, a mount close up, the hub, the annex). Shots are in
  `ARCHITECT/mlow-airport-v3/promo/room182/`.
- MW317 taking off was not seen in a shot (from the hub the B1 pod hides the runway); the blimp
  orbit and the boarding interaction were not exercised.
- Phones: not checked, and at 2.8M triangles the `low` path probably needs the set decimated or
  the far field cut.
- Museum wide audit, `build_all.sh`, `new-rooms.html` (still says to 181) and the room thumbnail were
  not run or made. `mint_kit.py` still reads only `src/rooms/[a-z].ts`, so rooms in `v*.ts`,
  this one included, are missed there. `places.json` still lacks pennstation and crystalpalace,
  and rooms 180 to 182 are in no wing.
- The set is 12.6 MB, against 134 to 650 KB for other props.
