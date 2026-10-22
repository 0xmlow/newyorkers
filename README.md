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
