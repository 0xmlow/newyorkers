# Handoff: THE PIGEONHOLE at /pigeonhole (2026-10-17)

MLow asked for the next gallery to go "100x" past the Movies and the Marks walks: image generation first, his
Impermanent Vision style, illusions that only work online, stickers and posters, his asset pack, more rooms, the most
New York exhibit ever, as code and as a package another builder can pick up. From his list of fifty concepts this is
#50: **a museum inside a pigeon inside a bodega inside a dream.** (#21, the apartment, was being built at the same time
by another session as BIGGER ON THE INSIDE.) Nav: MORE, on the 7 line. Footer: the census column. Branch named in the
entry: `the-pigeonhole`, pushed 2026-10-17 as a single snapshot commit (7a77aa47); update it with a commit on top, never a force push.

## What it is

Walk repo (source of truth): `../DOWN THE PIGEONHOLE 2026-10-17/`. Read its `README.md` (the twelve rooms and their
tricks) and `BUILDER_BRIEF.md` (the engine API). Edit there, `python3 tools/build.py --js`, commit, rerun
`build_galleries.py`.

- `src/engine.js`: three.js r185 bundled with the museum's esbuild. Render target portals with scale change and true
  recursion, stencil pockets (glass bigger on the inside), anamorphic fragments, depth plates, the sticker atlases, the
  post pass, the POWER policy.
- `src/rooms/*.js`: twelve rooms. car, bodega and museum by Claude; the other nine by five parallel builders on the
  brief, each reviewed in headless shots.
- Assets: 37 images made in Adobe Firefly (Nano Banana Pro, 2K) in MLow's Chrome, because Krea, the other image
  service and Codex ImageGen were all out on 2026-10-17. Prompts in `tools/prompts.json`. Models from the ON LOCATION
  pack. 384 stickers from the 301 to 2300 packs. 190 New Yorkers chosen by keyword, then neighbourhood.
- `tools/package.py` writes a portable zip with a checksum manifest beside the walk repo.

## Traps met

- The disk filled twice in the session: headless Chrome's shader cache (`~/Library/Caches/Google/Chrome-headless`)
  grew to 4.4 GB. It is a pure cache. `tools/shot.py` in the walk repo now runs with the disk caches off.
- A pocket's contents that load late (plates, models) must be sealed into the stencil test too (`sealUp` in the engine).
- A portal into its own room cannot recurse by screen space feedback when it translates; it renders the levels deepest
  first (`recurse: n`).
- Generated textures printed a real fare card brand (the sticker wall photo and the first receipts): both replaced.

## Not verified

- Never walked end to end by a person; every room shot headless on this Mac, the three portal rides run by script.
- Not tried on a real phone (390 px emulation only). On phones, decorative portals onto unvisited rooms stay dark.
- Deployed 2026-10-17 on MLow's word ("deploy it when they're all done").

## 2026-10-18: the resize floor

`resize()` in the engine now floors the render target at one pixel (walk repo 93d07e5). A browser pane mid resize
once reported zero height in UNLICENSED NEW YORK, which carries a copy of this engine: 258 frames drew into an incomplete
framebuffer and Chrome stopped reporting WebGL errors for the context. Same line, same fix, here.

The `the-pigeonhole` branch on GitHub is now 74d24f4, one commit on top of the snapshot 7a77aa47. The walk repo's own history is
unrelated to the snapshot, so a plain push is rejected as non fast forward. To update the branch: fetch it, then
`git commit-tree HEAD^{tree} -p FETCH_HEAD -m "..."` and push that commit id to `refs/heads/the-pigeonhole` (quote the id,
zsh reads `$C:r` as a modifier). The local tag `gh-the-pigeonhole` in the walk repo marks the pushed tip.

## 2026-10-28: the cast instead of capsules

The nine capsule figures (museum guard, token booth, stock clerk, nave, dome rail, wing reader, cashier, the CCTV "you")
and the heart's box audience are whole characters from the ON LOCATION Tripo cast, each with its own sculpted eye flower
head and nothing drawn on top (MLow: never a second head on a cast member). Walk repo 0c373a0: `src/crowd.js`,
`tools/crowd_pass.py`, models in `gen/crowd` (6,000 tris 512 px whole figures, 1,200 tris 256 px audience, about 1 MB in
all). Capsules stay built until a model lands; `?crowd=old` keeps them. The drawn heads that followed you or blinked
(attendant, clerk, nave figure, cashier, the heart's usher) went with the capsules. Walk repo 9fa90bc did the last four:
the heart's usher (Usher), the car sleeper (the Tenenbaum, lying on his side), the crop docent (Assistant) and the 15 cm
New Yorker in the cooler diorama (Susan); no capsule people are left in the gallery. README in the walk repo has the cast table and the draw call numbers. Not checked by
hand or on a real phone. Not deployed.
Later the same day (walk repo 125fd42): the Usher, Auggie, the Tenenbaum, the Agent and the Broker stop above the knee in
the Tripo source, so the museum guard is the Bartender, the heart usher the Maitre d', the reader Oscar, the sleeper the
Hustler, and the boxes seat the Disco King and the Hustler instead.

## 2026-10-28, later: the rigged cast

Walk repo 93e2edf: eight single figures (guard, attendant, clerk, nave figure, dome rail, reader, cashier, usher) load
the rigged files from `UPGRADE ALL ROOMS 2026-10-28/rig` (`gen/rig`, 1.8 MB) through `src/rig.js`: idle from a random
time, the head bone turned toward you on top (60 degrees, 25 for the Bartender), the body only past that. The eyes that
follow you are back; the cashier snaps his head round at a shake. Heart boxes, docent, sleeper, CCTV you and the cooler
miniature stay static. `?rig=off` keeps the static cast. Film: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/pigeonhole_rig.mp4`.
Not checked by hand or on a real phone. Not deployed. (MoMLOW a47a575 and MEME ISLAND 1abf0dd took the same cast walking;
their READMEs carry the notes and numbers.)
