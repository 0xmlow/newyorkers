# Handoff: room 180, `pennstation`, THE HALL NEW YORK LOST (2026-10-01)

The 1910 Pennsylvania Station as the census hall of THE CENSUS RELEASE, in
`_build/museum/src/rooms/v23.ts`, registered in `v0.ts` LIVE_ROOMS, curated in
`src/data.ts`, the check scripts now assert 180. Not the Moynihan room (`penn`).
Nothing deployed.

## What is where

- Seventh Avenue: pink granite Doric colonnade, the clock (real New York time) with
  faceless Day and Night groups, two granite eagles, nine brass turnstiles whose arms
  turn as you pass. Spawn is on the far pavement looking at the front.
- PAINTED: arcade, grand stair, travertine waiting room 96 by 33 m, coffered barrel
  vault, six lunettes and two thermal windows. Sun shafts and floor pools come through
  the windows on the side the real sun is on (one InstancedMesh, instance colour is
  brightness). Census wall from 1750 on the south end wall. Census desk in the middle.
- MOSH: the 1963 seam, intact south side with three works, demolished north side
  (blocked to visitors) with drums, rubble, bare steel, a swinging wrecking ball and a
  jagged crack of signal noise.
- DITHER: the concourse, Bayer dithered canvas textures in navy and bone with a warm
  base strip, steel arches, glass vaults, the glass grid's shadow moved with the sun
  (moon at night), two freestanding gallery walls.

## The two interactions

- Mosh: any of the 24 works, when the camera is within 6.6 m, in front, facing it,
  and nearly still for 1.5 s. Colour streams use the work's own pixels (thumbnail
  sampled into a 24 by 14 canvas). One InstancedMesh of 720 quads (360 on phones).
- Find mine: walk to the census desk, a small panel appears. It reads
  `api/collectors.json` and `api/c/<wallet>.json`. If the holder's works hang here
  the beam sweeps to them and the camera walks to the first. If not, it sets
  `#room=pennstation&hang=collector:<wallet>` (the museum's own collector hang), the
  hall rebuilds with their works, and the camera is carried to the desk and walked to
  the first. Mounts are sorted waiting room first so a short collection lands under
  the vault.

## Why the normal hang, not the minted works

Every piece belongs to exactly one room (`assign_hang.mjs`), and `build_collectors.py`
builds each collector's "where" and "home" from that. Claiming the 552 minted works for
one room would pull them out of every other room and collapse every collector's map to
one hall, and 552 works cannot hang on 24 mounts. The collector hang already turns any
room into a holder's gallery, so the minted works do hang here, for whoever holds them.

## Props

Thirteen FLORA Tripo GLBs passed through `_build/museum/blender/prop_pass.py`
(join, decimate, textures to 1024 JPEG, base at origin, y up), now 134 to 460 KB in
`assets/museum/props/penn_*.glb`. Repeated ones (capitals, turnstiles, lamps,
stanchions) are instanced by `propMany()` in v23. Rejected: `penn_clock` (a mantel clock
with painted hands, the station clock is procedural) and `penn_bench` (a park bench,
installed then removed; the oak benches are procedural). `penn_bench` is not in props.

## Numbers (whole frame overlay, headless Chrome, desktop, fx on)

Calls 440 to 700, triangles 340k to 600k depending on view; phone path 182 calls,
154k triangles at the spawn. The 179 room build reads 610 to 690 calls on the same
overlay for comparable rooms, so the old "under 350" target is not met here either.

## Not verified

- Nobody has walked it in a live browser; all views are headless shots with `--at`.
- The mosh trigger was seen to fire headless; how it feels while walking is untested.
- Find mine was exercised once, with mlow.eth, on the rehang path. The "already hung
  here" path and the not on the roll message were not exercised.
- Real phones, frame rate, and the eggs' glint placement were not checked.
- `_build/rooms.json`, `assets/museum/museum.js` and `museum.html` were regenerated
  but not committed, because the working tree also holds another session's
  uncommitted Liberty work (`src/rooms/index.ts`, `up6.ts`) that the bundle includes.
  Run `build_all.sh` once both are committed.

## Detail pass, same day (MLow's review)

- **Photo textures** from FLORA in `assets/museum/photos/pennstation/` (1024 JPEG, about
  1 MB together): coffer on the vault, travertine on the walls, granite retinted toward
  Milford pink on the front, demolition on the 1963 side, and the marble floor cropped to
  one clean slab because the border inlay did not meet at the seams. Loaded by
  `photoMat()` and tiled in world space by the kit's batch. Rejected: the dither floor and
  dither roof textures (the roof tiles a moon in every cell).
- **Painted cutout people** replace every capsule crowd: `figures.webp`, one 2048 by 512
  atlas of ten figures keyed from the green sheets (six 1910 travellers, the mother and
  child kept as one; four of today's visitors). `cutouts()` draws them all in one call,
  each quad turned to the camera about its own upright axis in the vertex shader, walkers
  moved by rewriting one attribute. Rejected: `fig_seated.jpg` (city behind the figures,
  no clean key) and two of the six modern figures (the bag carrier's head is a ghost in
  the source, the suited man's head sits on the city band and keys away).
- **The dither** is now a real ordered dither: `ditherize()` patches materials after
  lighting with an 8 by 8 Bayer threshold on 2 px dots to navy, bone and the warm accent,
  eased in along world z from -43 to -53, so the seam fades into the concourse. The art
  stays painted.
- **Draw calls**, whole frame overlay, headless, desktop, same views before and after
  (fx chain off in headless in both): spawn 464 to 382, stair 364 to 289, seam 348 to
  262, census desk 340 to 262, waiting room 303 to 227, concourse 276 to 204. Triangles
  fell by about a third. Done by the cutouts (one call for every person), and by turning
  off shadow casting for everything inside the waiting room and arcade once the works are
  hung (the roof keeps them in shadow all day).
- The mosh trigger distance is now 6.6 m, because the museum's own viewpoint stands a
  visitor up to 5.8 m from the big waiting room works.
- **Moving camera proof**: `CENSUS HALL 2026-10-01/captures/proof_walk_spawn_to_concourse.mp4`
  (30 s, walkTo legs from the Seventh Avenue spawn through the turnstiles, a mosh, the
  seam and into the dithered concourse) and six 8 s promo clips at 1920 by 1080 recorded
  from the canvas, so no UI: a to f in the same folder.

Still not verified: a human walking it in a real browser, any phone, and frame rate.
The find mine clip uses a collector whose work hangs here today; the hang reshuffles daily.
The proof walk grazes the jamb of the west opening on its way into the seam.
