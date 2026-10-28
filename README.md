# ON RECORD: New York on Wax

A walkable three.js gallery by MLow, the sister of ON LOCATION. Eleven rooms where New York made its music, rebuilt and
recast with NEW YORKERS: every member of the cast has an eye flower for a head, so the places are the city's, the
records belong to the people who made them, and the people are ours (no musician's likeness, no band or label logo,
no album artwork, no lyric, no recording). Each room's walls hold twelve census New Yorkers from the block the room
stands on (`HOODS` in `_build/build.py`), and each room plays its own song, synthesised note by note in the browser
(`_build/src/music.js`).

Open it: double click `Open ON RECORD.command`. On the site it is `records.html`
(`NEW YORKERS SITE/_build/build_galleries.py`, slug `records`, copies `site/` into `assets/records`).

| # | Room | Record or date | Song | The trick |
|---|---|---|---|---|
| 1 | The Record Store, Broadway | Now spinning | a lazy shuffle | the floor in the middle is a turntable: stand on it and the store turns round you; MLOWTAR picks your next room; headphones in the listening booth |
| 2 | Jones Street in the Snow | The Freewheelin' cover, 1963 | fingerpicked folk and a harmonica breath | stand on the photographer's star, face the street and hold still: the snow stops and the screen closes to a square sleeve; walk on and a girl in a green coat takes your arm |
| 3 | 96 and 98 St. Marks Place | The Physical Graffiti cover, 1975 | a heavy riff in E | a die cut facade with real holes over an inner sleeve that slides as you walk left and right: the tenants change; click a window to meet who lives there, find the band |
| 4 | Ludlow and Rivington | The Paul's Boutique cover, 1989 | a dusty breakbeat with a horn stab | a sampler on a card table: every pad chops the photograph sideways and cuts the beat; all eight in a bar for the egg |
| 5 | The Silver Loft, East 47th Street | The Velvet Underground and Nico, 1967 | one drone, one piano note, a heartbeat | foil walls, twelve silver clouds you push by walking into them, a banana you peel in three clicks, and a screen test: hold still on the mark and the picture drains to black and white |
| 6 | 315 Bowery | CBGB, 1977 | three chords, 176 bpm | the pit shoves you; the flyer wall rewrites itself every time you turn your back on it, and on the sixth rewrite MLOW TONIGHT appears |
| 7 | 1520 Sedgwick Avenue, the Rec Room | The back to school jam, 1973 | the break | two turntables: a deck plays two bars of the break, the other deck must be next before it runs out (the merry go round); the room only dances while the break plays; eight in a row for the egg |
| 8 | East 126th Street | A Great Day in Harlem, 1958 | medium swing | forty New Yorkers mill about the stoop; stand on the mark across the street and hold still and they ease into the photograph, rows on the steps and children on the curb, then the flash and sepia |
| 9 | 178 Seventh Avenue South | The Village Vanguard, 1935 | a piano trio, brushes, walking bass | the room is a wedge: walk to the point and the trio swells and you grow to 1.7 times your size; the tables shrink toward the point so the room reads twice as deep |
| 10 | 253 West 125th Street | Amateur Night at the Apollo, 1934 | the house band vamping | you are on the stage; rub the Tree of Hope stump, step into the spotlight and the meter climbs to a win; skip the stump and the house boos until the Sandman sweeps you into the wings |
| 11 | 222 West 23rd Street | The Chelsea Hotel, 1884 | a slow waltz on an upright | a salon hang (the hotel took paintings for rent) and a stairwell open through the ceiling, twelve floors of landings: stand under it and look straight up and the well stretches away (a dolly zoom) |

56 eggs, counted from the source at build time (`count_eggs` in build.py).

## How it was made

- **Engine**: ON LOCATION's (`../ON LOCATION 2026-10-10/_build/src`), forked whole: plates rebuilt as depth meshes,
  lazy rooms, the finishing pass, the power throttle, the phone guard, WAY OUT, skate mode. Changes here: `music.js`
  (new), `rooms.js` and `build.js` (new rooms; the shared helpers kept), `main.js` (the music hook, `FX.tint`, the
  rider roster, skate ramps that only exist while skating, `window.__EGGSET`).
- **Plates**: eleven ChatGPT ImageGen images through the Codex CLI bundled with ChatGPT.app (`tools/plate.sh`,
  prompts in `tools/plates.tsv`, run with `tools/run_plates.sh`), 1536 by 1024, with the eye flower as a reference
  image. Krea had 0 credits on 2026-10-20. Jones Street and the Vanguard were refired with an empty foreground so the
  depth plate does not smear (first takes in `work/plates_v1`). Then `python3 _build/depth.py work/plates_raw/*.png`
  (Depth Anything V2 Small, local).
- **Cast and props**: no new 3D. The cast are ON LOCATION's Tripo GLBs, the props its Poly Haven CC0 models,
  read straight from `../ON LOCATION 2026-10-10/work/glb_pass` (and `glb_draco`) by build.py.
- **Build**: `python3 _build/build.py` (or `--js` to rebundle only). **Check**: `python3 _build/check_all.py work/check`
  renders every room headless and prints console errors; `work/trick_test.js` drives each room's trick through
  `shot.py --eval` (set `window.__POWER.blurred = false` first: an unfocused tab runs at a third of the speed).

## Brand check

All eleven plates looked at full size: eye flower heads everywhere, no human faces, signs say NEW YORKERS, N3W, COUNTED
or MLOW. Real street names (Ludlow, Rivington) stay. Album names appear only in the room labels as facts about the
place (which cover was shot here); no cover art is reproduced.

## Not verified

- Never touched by a person: every check was headless Chrome on this Mac with scripted positions and clicks.
- Fired by script: the platter, the Jones Street cover, the sampler chop, the clouds, the peel, the screen test, the
  pit, the merry go round, the Great Day pose, the Vanguard growth and its egg, Amateur Night, the Chelsea vertigo,
  the St. Marks windows. Not fired by script: the arm on Jones Street (needs real continuous walking), MLOW TONIGHT
  (six turns away), the Sandman's sweep (fires when you skip the stump).
- The music was never listened to. It is synthesised from scratch and its mix and levels are guesses.
- Phones: inherited from ON LOCATION, untried on a device. Frame rate on a weak laptop unmeasured.
- Spend: $0 (ImageGen through ChatGPT, CC0 and existing models, local depth).

## The crowd: whole characters from the cast (2026-10-28)

The flower headed extras become whole characters from the cast, as in ON LOCATION (MLow approved the trial for every gallery,
and ruled: the whole character with its own sculpted flower head, the sprite head hidden). `_build/src/crowd.js` is ON
LOCATION's file, copied; the 40 `crowd_*` files come from ON LOCATION's `work/glb_pass` (`_build/crowd_pass.py` there) and ship
because crowd.js names them (build.py now reads crowd.js too). `?crowd=old` brings back cylinder, box and sprite, which stay
built and hide only when a character lands.

- Harlem: the stoop and pavement draw from HARLEM (agent, broker, wiseguy, annieh, rosemary, gown, usher, editor, oscar,
  workgirl); the eight on the curb are seated characters with no table or chair (the folk singer on his stool, the man cross
  legged), kept at street level instead of dropping to the curb, since they bring their own seat. It is a famous photograph of
  real musicians: every figure stays a generic New Yorker, nothing is labelled. CBGB's pit and the Sedgwick dancers: the night
  pool. The Vanguard's seated listeners: folksinger and sally. The girl who falls into step on Jones Street: rosemary.
- Measured (headless Chrome, main scene pass, start view, old to new): Harlem 266 draw calls and 695k tris to 165 and 816k on
  desktop, 321 and 384k to 210 and 501k on the phone path; CBGB 334 and 789k to 262 and 894k; the Vanguard 194 and 586k to 174
  and 616k. Shots in `../UPGRADE ALL ROOMS 2026-10-28/shots/crowd_rollout/records_*`.
- Not verified: by hand, on a real phone, the Harlem crowd walking into its pose (the seated ones glide while it mills), the pit.
- Full length only (later the same day): agent, auggie, broker and usher were cut off above the knee and read as sunk when
  standing (the MoMLOW feet lineup), so they left every crowd pool. Harlem's pool is now clerk, bartender, wiseguy, annieh, rosemary, gown, loretta, editor, oscar, workgirl, felix. Harlem
  then: 166 draw calls and 819k tris desktop, 212 and 507k on the phone path. Shots `*_v3.jpg`.
- Harlem's saxophone and bass (hijacker and broker, both cut above the knee and sunk on the pavement) are now discoking and
  maitre, full length, same lines and eggs. Still cut and standing, not changed in this pass: agent (line 560), usher (the
  Apollo), bookseller (the Chelsea), and the Sedgwick b-boy tracksuit (he spins, so his legs show). Shots
  `records_lead_harlem_musicians_old/new.jpg` (crowd hidden for the shot).

## The crowd walks and looks: the rigged cast (2026-10-28, later)

MLow asked to roll the rigged cast (`../UPGRADE ALL ROOMS 2026-10-28/rig/`, rig_pass.py, free headless Blender: 26 figures at
3,000 triangles with a skeleton, `walk` and `idle` clips and a bone named `head`) into the crowds. `crowd.js` (shared by ON
LOCATION, ON RECORD and CLOUDS AND DIRT V2) now does it; `?rig=off` keeps every character static, `?crowd=old` still brings
back the cylinders.

- **Files.** The 25 rigs used are copied as `rig_<name>.glb` into ON LOCATION's `work/glb_pass` (ON RECORD and CLOUDS build
  from there), not Draco, about 6 MB; a gallery fetches one only when a near extra needs it. Sally stays static (her raised
  hands follow the head); assistant and golfer have no rig. The 18 lite rigs are not used: VeeCon stays instanced and static.
- **The cap.** Every quarter second the nearest 20 rigged extras within 30 m (8 on a phone) become skinned clones
  (`SkeletonUtils.clone`, one mixer each, a random start in the clip); the rest stay the static 3,000 triangle mesh.
- **Walk.** Each extra's path speed is read from its world position every frame and smoothed over about a second (so a bob or
  a sway in place, like a pit, does not start a walk). Over 0.25 m/s a figure with a walk clip faces its path (in its own
  frame) and plays `walk` at timeScale = speed / (walk speed x scale), so the planted foot holds; otherwise `idle`, with a
  crossfade. Idle only figures (clerk, felix, blindwoman, prince, the seated four) and figures without a rig are kept out of
  the pools whose extras walk (walkers, Harlem, CLOUDS_CROWD), since they would glide; hustler, susan, discoking and maitre
  came in as statics (crowd_pass.py) to fill them.
- **Head tricks.** `o.userData.head` is now `look`, an empty at head height: a trick turns it as it turned the sprite, and
  each frame the head bone takes up to 60 degrees of that turn (25 for bartender and susan, whose shaker hand and hair bow
  stretch past that), the body the rest; static figures turn whole, as before. The turn is about world up converted into the
  head's own frame, and the head is reset to rest before the mixer runs (HEAD_TURN_FIX.md): the head bone's rest is tilted,
  and a first pass that turned it on its own Y spun the flower edge-on and smeared it into a white sheet on the folk singer
  in Katz's. Checked with stills at 45 degrees (`rig_front_and_head45.jpg`, `rig_blindwoman_head45.jpg`,
  `rig_folksinger_head45.jpg`: the flower face toward the camera) and on film (Katz's deli). The nods (rotation.z) roll the
  head about the figure's forward axis the same way. The Annie Hall line reads the head position from `look`.
- **Static facing.** The front stills also caught three static crowd files facing backwards or sideways since the first
  pass (cabbie, writer, susan; their yaws had come from main.js's YAW table, not from renders). crowd_pass.py reran them at
  -90 degrees; they now face the way their rigs do.
- **Rig facing.** Four rig files face the wrong way (rig_pass turned every cast file the same -90 degrees): blindwoman and
  hustler face +X, lensman and tough -X (blindwoman is now noted in rig_manifest.json too). `RIG_YAW` in crowd.js turns them
  inside the rig root; the rig source was not edited (read only). Blindwoman's front still matches her static file.
- **Harlem.** The seated cast on the curb now stays at its place while the crowd mills (it cannot walk seated).
- **Measured** (headless Chrome, main scene pass, start view; frame = main thread JS per rendered frame): Harlem desktop rig off
  165 draw calls, 816k tris, 1.2 ms; rig on 166, 819k, 1.6 ms (crowd 0.23 ms, 20 skins); phone path rig off 212, 507k, 1.1 ms;
  rig on 212, 507k, 1.3 ms (8 skins). Film `../UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/records_harlem_rig.mp4`: standing on the
  mark, the crowd mills, walks into the photograph, the flash.
- **Not verified:** by hand, on a real phone, GPU time per frame.
