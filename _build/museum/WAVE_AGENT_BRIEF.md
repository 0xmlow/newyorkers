# Wave agent brief (THE BIG UPGRADE, waves 7 on)

You upgrade a set of rooms in MLow's NEW YORKERS museum (Three.js, walkable New York rooms).
Working directory: `/Users/degens/Desktop/NEW YORKERS BY MLOW/NEW YORKERS SITE/_build/museum`.

## Read first
`UPGRADE_WAVES_2026-11-23.md` (from "Lessons from wave 1"), `../../AGENTS.md`, `ROOM_UPGRADE_GUIDE_2026-09-23.md`. Follow them.
`ROOM_FILES.md` maps rooms to files; room function names can differ from ids (e.g. `astor` for astorhall); check the aggregator files `src/rooms/y.ts`, `v0.ts`, `x.ts`.
Current bar: wave 6 rooms in `src/rooms/x1.ts`, `w.ts`, `v.ts`.

## Goal
In MLow's words: each room "as detailed and cool as my movies set gallery or the gallery I made Gary but even better". Real GLB centrepieces (not code built), scanned materials, built architecture, signs, one optical illusion with its own egg, Firefly requests appended to `FIREFLY_QUEUE.md` (append only; re-read before writing, others append too).
Models: our folders first (`assets/movies/assets/glb`, `assets/only`, `assets/garyvee/assets/glb`, `assets/museum/props`, rest of `assets/`), then Poly Haven CC0. Never AI image-to-3D, never Sketchfab. If no free model exists, queue a "3D PAID OK" row and keep a placeholder.
**The entrance view must change visibly.** Waves 5 and 6 left several entrances looking the same; this wave, the spawn view gets the most attention.

## Known traps
- `k.moulding` runs along z unless rotated; it has run 30 to 110 m through buildings.
- One-sided walls: from inside, the street shows through. Solid boxes hide lobbies. Stair blocks cover doors.
- Viewing spots inside props make works unreachable; works facing walls.
- Poly Haven glass uses a transmission material that makes three.js draw the room twice; prop shadows double it again. Strip transmission (plain transparency) and shadows from props on load; decimate small props in Blender.
- **Never glob across `assets/museum/props/*/` or `tex/*/`.** Only touch your own rooms' folders (`props/<id>/`, `tex/<id>/`). A wave 6 script rewrote other rooms' models.
- Keep each spawn view under about 1M triangles (debug counter). Prefer instancing.
- If you add real cars, mark that traffic as cabs (see `traffic()` in `y1.ts`), or the kit's `swapCabs` in `kit.ts` lays a second fleet of 14k-triangle shadow-casting taxis under your hidden box traffic.
- The debug counter sums every pass (shadow pass included), so it reads ~3x the scene. Big old structures casting shadows (fire escapes, water towers, crowds) are the usual cost: set castShadow=false on anything that does not need it, decimate chairs and repeated props hard (a chair can be 300 triangles), thin distant crowds. Measure per mesh at spawn before cutting.

## Shots (shared render lock, required)
Only ONE headless Chrome across all agents:
`L=/private/tmp/claude-501/-Users-degens-Desktop-NEW-YORKERS-BY-MLOW/6ec2f5d0-b483-4fb2-bf56-7edc0835b313/scratchpad/render.lock; until mkdir $L 2>/dev/null; do sleep 15; done; trap 'rmdir $L' EXIT` ... render ... release.
Batch a room's shots under one hold; never hold the lock while waiting on anything else. Keep coding while you wait.
`python3 shot_room.py <id> <out.png> --tag <tag> --port <port>` after `node build_variant.mjs <tag>`.
Before and after from the same views (spawn first), looked at by you, in `/Users/degens/Desktop/NEW YORKERS BY MLOW/MUSEUM UPGRADE 2026-11-23/<NNN-id>/` (NNN = number in ROOM_FILES.md minus one, 3 digits; if the folder exists, prefix new shots `w7-`). Plus one phone shot (`--mobile`). Note triangles before and after.

## Finish
No commit, no `npm run build`, no deploy, no edits outside your files and folders. Delete your variant bundle and html. `npm run check` and `node audit_rooms.mjs --room=<id>` pass for each room. Report per room: visible changes (entrance first), assets (count, MB, source, licence), Firefly rows, audit, triangles, not verified. If waiting on a background job, wait; do not end your turn.
