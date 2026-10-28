# Handoff: BIGGER ON THE INSIDE at /inside (2026-10-17)

The next NEW YORKERS gallery, made image first: seven ImageGen concepts (ChatGPT ImageGen through the Codex CLI in
ChatGPT.app, because Krea, FLORA and the other connector had no credits that day), then a new Vite + TypeScript +
three.js engine built around illusions that only work on a screen. The thirteenth gallery in `build_galleries.py`.
Nav: MORE, line B. Footer: The census column. GitHub branch `bigger-on-the-inside` pushed 2026-10-17 as a single snapshot commit (3c842163); update it with a commit on top, never a force push.

Walk repo (source of truth): `../BIGGER ON THE INSIDE 2026-10-17/`. Read its `START-HERE.md`. Edit there,
`npm run build` (writes `site/`), commit, rerun `build_galleries.py`. Its `docs/HANDOFF.md` has the room and effect map.

## The rooms (one block, every door a live portal)

- The block: interior mapped windows from an ImageGen atlas, a wet street (planar mirror in the puddles), manhole
  steam, the Eye Flower, and a street that loops into itself (two recursive portals).
- Infinity Deli: one aisle 260 m long, instanced stock, the ImageGen aisle as a Depth Anything depth plate.
- 5 Eldridge: a stair that wraps every floor; the 64 paintings on the landings advance as you climb.
- Apartment 5A: an Ames room (every vertex pushed along its ray from the peephole).
- Suds & Space: seven dryer windows that look live into the other rooms; a vortex drum round a still bridge.
- Bigger on the Inside St: an eight car train that rolls round you (the haunted swing).
- Tar beach: two thousand buildings on a cylinder, the city folding over the sky.

## Not verified

- Not walked end to end by a person; doors, the stair and the loop were driven by script in a browser
  (`inside.advance`), views checked as headless stills on this Mac's GPU.
- Not tried on a real phone or a weak laptop. Desktop runs GTAO, bloom, a street mirror and two portal passes a
  frame; phones get no AO, no bloom, no mirror, one portal pass. Frame time on real devices is not measured.
- Not deployed.

## Free GLB swaps (2026-10-28, walk repo de75c9a)

- Bodega cat: the code loaf is now `public/glb/cat.glb` (the orange tabby from UNLICENSED and THE MARKS, 723 KB,
  24k tris), 0.36 m, turned three quarters to the aisle (`bodega.ts`). The loaf stays as the stand in, hidden on load.
- Street trees: the pack's own `tree.glb` (746 KB, 6.1k tris) at 5.2 m in the old iron guards (`block.ts`). The code
  trunk and crowns are batched in their own group and hidden on load.
- Not swapped: fire escapes. `fire_escape.glb` is one storey of balcony and a ladder with no stair; stacked it read as
  cages, its drips covered the shop signs, and the zigzag stair was lost. Kept the code version. A real multi storey
  fire escape needs a generated model.
- Shots: `UPGRADE ALL ROOMS 2026-10-28/shots/inside/`. Not verified: phones, frame time, the cat and trees seen through
  the portals (the trees should show in the loop portals as any block mesh does; not checked).

## Rigged cast (2026-10-28, walk repo b05add5)

- The seven subway riders (workgirl, editor, hustler, actress, wiseguy, clerk, cabbie) are the rigged twins from
  `UPGRADE ALL ROOMS 2026-10-28/rig/out`, copied to `public/glb/rig/` (1.7 MB for seven, 3,000 tris each against 30,000
  for the npc_ files). `src/core/rig.ts`: `castProp()` loads the rig and falls back to the npc_ prop; `?rig=off` keeps
  the static cast; `rigTick()` in `main.ts` plays the nearest 20 (8 on a phone): idle from a random start, the head bone
  turns toward the visitor within 6 m (60 degrees at most, eased), the body only past that. Speed is read in the car's
  frame, so the roll never makes anyone walk. The holders are `userData.dynamic`, so `batchStatic` leaves them alone.
- The riders were written "do not look up"; they now glance at you when you stand near. Say so if MLow wants it back.
- Left static: `npc_broker` on the block (no rigged twin, cut off above the knee), the bronzes (statues).
- Measured headless (Apple GPU, desktop 1280x720 / phone 390x844 emulation), subway: 401 / 213 draw calls, 499k / 348k
  tris, rig CPU 0.02 / 0.01 ms a frame. Film: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/inside_subway_workgirl_headturn.mp4`
  (shot with reduced motion, so the car does not roll). Not verified: a real phone, the riders seen through a portal
  (with only 7 rigged figures in the gallery, all 7 always play, wherever you stand).

## Rig facing fix (2026-10-28)

Five rig files face 90 degrees off +Z (blindwoman, hustler -90; lensman, tough, sally +90). The yaw now goes on the
skinned clone inside the root here, and the static twin was checked against it. Stills and the lineup:
`UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing/`; method in `UPGRADE ALL ROOMS 2026-10-28/rig/HEAD_TURN_FIX.md`. Not deployed.

## Hustler reweighted, Susan doll face forward (2026-10-28, later)

MLow settled the two open rig questions. The Hustler is re-rigged with his whole eye flower bound to the head
(`rig_pass.py` FLOWER), so a look turns it the full angle; his -90 face yaw stays. Susan is re-rigged facing +Z (doll
face, sweater front and toes; the flower behind), so her rig needs no gallery yaw and her look aims the doll face; her
static twins turn instead (Tripo `susan` YAW 90, `crowd_susan` and `crowd_susan_full` 180). The new files reuse the old
names, so a returning visitor may see the old GLB until the cache turns over. Stills: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing/`.
