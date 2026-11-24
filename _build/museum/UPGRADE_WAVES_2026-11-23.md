# THE BIG UPGRADE, in waves (2026-11-23)

MLow, 2026-11-23: every museum room and every walkable gallery made "much better with all of the new
techniques", "as detailed and cool as my movie sets gallery (ON LOCATION, /movies) or the gallery I made
Gary (CLOUDS AND DIRT, /garyvee), but even better", with Firefly textures and wallpaper, optical
illusions, signs, real 3D GLBs from CC0 or our own assets, and **centrepiece objects not rendered with
code**, so they look real. He chose to run it in waves of four parallel agents.

This file is the brief for every wave agent. Read it in full, then `AGENTS.md` at the site root, then
`ROOM_UPGRADE_GUIDE_2026-09-23.md` (the kit API, the bar, the gates). Then work.

## Lessons from wave 1 (read these first)

- **Edit the file that is actually live.** Several rooms were rebuilt in October into `up*.ts` and the
  originals still sit, unimported, in the old letter files. Wave 1 spent three rooms of effort on dead
  copies (library, apollo, highline). `ROOM_FILES.md` maps every live room to its file; confirm against
  `src/rooms/index.ts` before you touch anything, and check your change shows in a shot before going on.
- **Draco models load now** (commit 02b8907b). The 954 movie set models, Gary's and Only in New York's
  can be copied into `assets/museum/props/<id>/` as they are; no Blender re-export needed.
- **Shoot only after the room has loaded**: wait for `window.__museum.kit.settled()` and then about 6 s
  more. Wave 1 shipped "after" shots of the landing page and of white walls with black works, because
  the shot fired before textures arrived. Look at every after shot yourself before you report it.
- **Give a surface a sensible colour until its scan arrives** (about 40 percent of its tint, and hold
  the roughness map back with the others), or phones see white walls and mirror floors for seconds.
- **Look for things that hide the work**: Times Square's 48 upper billboards were behind a dark backing
  box 1 cm in front of them; the Navy Yard dock was under a quay slab. Fixes like these were the biggest
  visible gains of the wave.
- **Centrepieces still built in code** after wave 1, for a later pass: the Met roof water tower, the
  Times Square ball, the Brooklyn Bridge, the Wonder Wheel, Cyclone and Parachute Jump. If your room has
  one and a model exists in our folders, use it.
- **The scratchpad is shared.** Keep your scripts in your own subfolder named after your tag; two wave 1
  agents overwrote each other's `shots.sh`.
- The shared dev server is threaded now and handles many clients; if a shot times out, retry once.

## What is already done for you (do not redo)

- `src/look.ts` (commit bfdbe3e6): every room now gets its own reflection probe, full anisotropy, floor
  polish and a film grade. It is engine level. **Do not edit look.ts, fx.ts, kit.ts or main.ts.**
- The lesson from MEME ISLAND and the Gary tower: engine passes are a polish; what makes a room read as
  cheap is **geometry and material**. Flat boxes with painted windows, code built centrepieces, one
  colour walls, empty ceilings. That is your job.

## Your job, per room

1. **Before shots.** `python3 shot_room.py <id> <out>/before-1.png --tag <yourtag> --hour 14 --wait 12`
   plus two or three more views (`--at=x,y,z --yaw= --pitch=`) that show the room's main axis, the
   centrepiece and the ceiling. Save to
   `/Users/degens/Desktop/NEW YORKERS BY MLOW/MUSEUM UPGRADE 2026-11-23/<NNN-id>/`.
2. **Research the real place** (the room's `description` and `signatures` say what it is). The real
   materials, the real ornament, what is overhead, what is on the floor, what signs hang there.
3. **Rebuild.** In priority order:
   - **Centrepieces as real models, not code.** Every hero object a visitor walks towards (a fountain,
     a clock, a statue, a booth, a car, a water tower, a chandelier) becomes a GLB. Sources, in order:
     (a) the 3,500 GLBs we already own: `assets/movies/assets/glb` (954, many Poly Haven scans and Tripo
     cast), `assets/garyvee/assets/glb`, `assets/only`, `assets/styles`, `assets/lightings`,
     `assets/records`, `assets/stillonline`, `assets/momlow`, `assets/eviction`, `assets/pigeonhole`,
     `assets/museum/props`; (b) Poly Haven CC0 models through
     `../../../ON LOCATION 2026-10-10/_build/polyhaven.py` (api.polyhaven.com needs a User-Agent header;
     1k textures, about 0.5 MB a prop). **Copy** what you use into `assets/museum/props/<id>/` and load
     it with `k.prop('<id>/<name>', ...)` so the mint kit finds it. Check the bounding box and origin
     (the guide covers the Barney trap). **Do not generate paid 3D** (Tripo, Krea, FLORA): if a
     centrepiece has no free model, write it in the queue below and leave the existing one.
   - **Materials.** Scanned CC0 textures from Poly Haven (stone, marble, brick, terrazzo, tile, wood,
     plaster, metal), with normal and roughness maps, at 1k, in `assets/museum/tex/<id>/` as WebP or
     JPG. Real tiling scale in metres. No one colour wall survives.
   - **Architecture that is built, not painted.** Cornices, mouldings, pilasters, coffers, window
     reveals with depth, door frames, skirting, ceiling detail and fixtures (the Gary tower ceiling kit
     is the model: `../../../CLOUDS AND DIRT V2 2026-10-22`). Instance repeated parts.
   - **Signs.** Real looking signage for the place in the house fonts (Archivo / Archivo Expanded,
     JetBrains Mono, Permanent Marker; the brand canvas sign helper in the kit; leave its font option
     alone). No real brand logos, no real business names that are not the landmark itself.
   - **One optical illusion per room** (ON LOCATION's rule 9: one trick per room): anamorphic floor
     or wall type, a hollow face, a forced perspective, a Pepper's ghost, a mirror that lags. Add it to
     the room's eggs. See `virtual-architect` skill `references/film-sets-and-tricks.md`.
   - **Firefly wallpaper, murals and painted plates** cannot be made by you (one shared browser). Write
     each request into `FIREFLY_QUEUE.md` beside this file: room id, file name to produce, size and
     aspect, the prompt, and where it goes in the room. Leave a placeholder (a Poly Haven texture or the
     current material) that the result can replace by swapping the file. The main session runs the queue.
4. **Keep what must not break.** Every mount stays reachable: `node audit_rooms.mjs --room=<id>` must
   report nothing unreachable and nothing stuck. The hang, the eggs and the spawn view stay. Phones:
   the room must still load on the low path (`--mobile` shot) and new assets for one room stay under
   about 12 MB total; follow `HANDOFF_PHONE_2026-10-18.md` at the site root.
5. **After shots** from the same views, and a `NOTES.md` in the room's folder: what changed, every
   asset and its source and licence, what you could not do, what you did not verify.

## Rules for working beside three other agents

- **Edit only your own room file(s)** under `src/rooms/` and your own new folders under
  `assets/museum/props/<id>/` and `assets/museum/tex/<id>/`. Helpers stay local to your file.
- **Never** run `npm run build` (it rewrites the shared bundle), never edit shared files, never
  `git add`, `git commit`, `git stash`, `git checkout` or `git reset`. The main session commits each
  wave. Never deploy.
- Preview with your own variant: `node build_variant.mjs <yourtag>`, then `shot_room.py --tag <yourtag>`
  on your own `--port` (given in your prompt). The dev server is already on 4185; do not start another.
- `npm run check` must pass before you finish (it typechecks everything; if another agent's file
  fails, say so and do not touch it).
- The Mac disk has under 20 GB free. Delete your own Chrome profiles and scratch downloads; keep
  textures at 1k and models small.
- House rules: no em dashes, no en dashes, no arrows in any text a person might read. The artist is
  MLow.

## Report back

A short list per room: the big visible changes, the assets added (count and MB), queued Firefly items,
the audit result, and anything not verified. Put the before and after pairs in the room folder; the main
session shows them to MLow.
