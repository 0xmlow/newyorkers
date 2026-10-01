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

- Mosh: any of the 24 works, when the camera is within 4.8 m, in front, facing it,
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
