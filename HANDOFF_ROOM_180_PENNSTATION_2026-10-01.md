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
- The bundle, `museum.html` and `_build/rooms.json` were committed later the same day
  (0f1e86b), once the parallel Liberty work had been committed and the bundle carried
  nothing uncommitted.

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

## The KEYSTONE 111 and ORDER A PRINT (2026-10-02)

MLow approved hanging the founding 111 in this hall. That reverses "Why the normal hang"
above for the Keystone works only; the 552 minted census works still hang by the normal rule.

- **The pin.** `assign_hang.mjs` has a `PINNED = { pennstation: <Keystone numbers> }` table,
  read in ramp order from `_build/api/keystone_prints.json` and claimed before any scored
  offer. A pinned room is exempt from CAP and takes nothing else, so pennstation owns exactly
  the 111 and they hang in no other room; collector maps follow from `hang_owned.ts` as always.
  All 111 are leads, so `placeHang` rotates which of them sit on the 24 big mounts every New
  York day. The script also writes `src/keystone.ts` (the ordered numbers) for the room code.
  Rerun it if the Keystone list changes. Cost: 75 rooms gave up one to four works, and the
  smallest room fell from 34 to 24 works (parkeast, 15 mounts).
- **The salon wall.** The south end wall is the KEYSTONE 111 wall, signed KEYSTONE 111 / THE
  FOUNDING NEW YORKERS, built last in `v23.ts` by `keystoneWall()`. It leaves out whatever the
  mounts show on the current page (RoomCtx now carries `page`), so on the normal hang each
  Keystone work is in the hall once: 87 on the wall plus 24 on mounts, or 96 plus 15 on page 5.
  Under a collector or search hang it skips only the Keystone works on the mounts. The kit's
  `censusWall` takes `indices` (any positions in P, any atlas) and `centerLast`.
- **ORDER A PRINT** in the museum's piece panel, every room. No button unless
  `NY_PRINTS.status` is live. A Keystone work with a live product in
  `assets/keystone_prints.js` links to `https://mlow.nyc/products/<handle>`; everything else
  links to `n/<id>#orderbox`, the record page's size and surface picker. New tab.
  `museum.html` loads both scripts; `build_deploy.py` copies and hash stamps
  `keystone_prints.js`, and will refuse to build until that file exists.

Verified headless (shot_room.py, hour 14): wall 87 tiles and mounts 24, no overlap, union is
the 111; page 3 the same, page 5 is 96 and 15; a search hang gives 108 and 24; 2026-10-03
hangs different leads from 2026-10-02. The link logic was exercised with a stubbed
`NY_KEYSTONE_PRINTS` (draft, live, missing) and with `NY_PRINTS` forced to draft.

Not verified: the collector hang on this room after the change (its code path is untouched),
a real browser or phone, the real `keystone_prints.js` (it did not exist yet), and that the
n/ order block anchor scrolls into view on the live site.
