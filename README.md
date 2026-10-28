# MoMLOW, The MLow Museum, after MoMA

A walkable museum for NEW YORKERS by MLow, after the Museum of Modern Art on 53rd Street. Three.js r128, self hosted,
no build step to play (`site/index.html` plus `site/js/*.js`). On the site it ships as `momlow.html` through
`NEW YORKERS SITE/_build/build_galleries.py` (copied whole into `assets/momlow/`).

It began in June 2026 as "The MLow Museum, after MoMA", a city block with empty frames you filled by upload. v2
(2026-10-12) is the real MoMA plan rebuilt for the census, hung by a curator that learned MLow's taste.

## The building (the real plan, transformed)
- **53rd Street**: the sidewalk, the crosswalk, cabs in both directions with the MLOW topper, three parked at the curb with a
  cabbie, lampposts, plane trees, a coffee cart, a hot dog cart, the newsstand, barriers, the orange cone, pigeons, a dog.
  The brownstones across the street light up at night. Midtown towers in the fog. The logo on the canopy, nothing else.
- **Ground floor**: the lobby runs through the block to the Garden Lobby, glass to the garden. The desk (admission is free,
  it always was), the guard beside his own portrait (No. 625), the hero poster, the four anchors, Manhattan and Brooklyn
  on the lobby walls, twelve of MLow's movie posters as banners from the ceiling. The store (the street posters on the
  wall, prints on the tables, MLOWTAR by the door). The Bodega, the cafe. The escalators, with the Families on the well's
  wall and a catwalk on every floor. The glass lift: stand in it and press a floor.
- **Floor 2, the atrium**: open to the skylight, 28 m. Liberty, 14 m, standing in it; a sauropod on loan from across the
  park; the Delacorte clock animals circling in the void; the subway car hanging and turning; the mobile under the glass.
  Queens, the Bronx and Staten Island on the atrium's walls. The contemporary floor: Eras XV to XIX.
- **Floors 3, 4, 5**: rings of galleries around the void. Places, Design and Builders, and the Sets on 3 (where MoMA keeps
  photography, architecture and design); Eras VI to XII on 4; the Originals and Eras II to V on 5 (where MoMA keeps
  its Starry Night). The glass bridge across the atrium on 4.
- **Floor 6**: the curator's rooms, one per theme (The Night Shift, Transit, The Counter, The City Is Watching, The
  Hustle, Faces), The Moving Pictures (sixteen loops on screens), and the terrace with the water tower.
- **The sculpture garden**: Vermont marble, two reflecting pools with slab bridges, koi, a swan, a sea lion, weeping
  willows for the beech, ginkgos; MLow's eye monument, three blossoms, the equestrian, the figure, the caryatid, the
  fountain, the armillary, the nutcracker, Noguchi's stones, the Checker cab excavated in bone and calcite; and THE
  COUNTED on the north wall, 14 m tall: every collected New Yorker, 48 across, in the order it happened. 54th Street beyond.

## The illusions and the dressing (`site/js/dress.js`)
Five illusions: a painting anamorphosed onto the atrium floor that only resolves from one eye flower on the floor 3 balcony;
a Penrose triangle on the terrace that closes from its mark; a hollow eye over the garden doors that follows you; a mirror at
the end of the escalator hall that makes them endless; and an illusion panel per floor on the north balcony (the same size,
the wall is straight, nothing is moving, there is no spiral, the lines are parallel), each with its plaque. Subway tile dado
and the site's mosaic frieze along every corridor and the lobby, the cafe wall illusion in real tile in the Bodega, the eye
flower wallpaper in the store, enamel station signs with line bullets at every lift door and landing. The Penn Station set
runs the lobby (the census desk, the taker, the stamp, the seal, the dispenser, the lamps, the luggage, the shoeshine, the
newsstand, the eagle), the Yellin lantern hangs over it, the bell by the garden doors. The ON LOCATION cast in bronze along
the atrium, the blue whale beside the sauropod, the IRT kiosk as Uncounted St on 53rd, stoops and fire escapes and water
towers across both streets, phone booths, the Central Park corner, the ferry and the tug in the pools, the Rat King's court
with the monte table, the harbour pieces, Barney Greengrass and the bartender in the Bodega, MLOWTAR and the cat in the store.

## The curator (`_build/curator.py`, `_build/taste.json`, `CURATOR.md`)
Learns what MLow likes from what he already chose (his own mints, the Keystone picks, the home page faces, the pieces he
made posters and cards for), as smoothed log odds over the words of every title and story, the family, set, borough,
neighbourhood and era, plus the hand weights in `taste.json`. Gates every piece on sharpness, contrast and mud before it
can hang (970 of 7,542 refused). Fills the theme rooms, orders every room best first with the collected pieces leading,
picks the loops. Its report is `CURATOR.md`; press C inside for the note of the room you are in. Edit `taste.json` and
rebuild to argue with it.

## Phones
`site/phone-gpu.js` loads first. On a phone it halves any image texture over 512 (1024 for the atlases and the full
works) as WebGL uploads it, so the museum asks for about 220 MB instead of 1.1 GB, which iOS Safari closed the tab
over. `?gpucap=0` turns it off. The canonical copy is the site's `assets/ui/phone-gpu.js`.

## The visitors (2026-10-28)
Every visitor is a whole New Yorker from the cast we generated (the ON LOCATION Tripo characters, an eye flower head
sculpted into each, no real person's likeness): annieh, assistant, editor, rosemary, blindwoman, gown, hustler,
workgirl, oscar, wiseguy, susan, cabbie, and the Bartender (waistcoat, bow tie) as the guard by the desk. Only models with
legs to the feet: usher, agent, auggie, bookseller, broker, dad, hijacker, jeweler, sonny and tracksuit stop above the knee
and read as sunk into the floor (checked in a Blender lineup, 2026-10-28). `_build/crowd_pass.py` (Blender) cuts
each to 2,500 tris and a 512 px texture into `_build/crowd/` (committed); `build_data.py` clones them into `work/glb_raw`
and `draco.py` compresses them to about 65 KB each (`site/assets/glb/crowd_<name>_full.glb`). One mesh and one material
per character, shared by every copy. The models are not rigged, so `people.js` walks them with a bob on each step, a roll
from foot to foot, a lean and a turn into corners; a paused visitor turns the whole body to look about; the guard turns
his whole body to follow you. The old cylinder visitor is still built and hidden only once the model lands. `?crowd=old`
keeps the cylinders.

Measured in headless Chrome, main scene pass (shadow pass included), the crowd frozen at its start points:
crowd footprint 744 meshes and 26k tris (62 cylinder visitors) to 60 meshes and 150k tris (60 cast visitors). Lobby
from the garden doors, desktop: 3,089 draw calls and 4.67M tris to 2,199 and 4.83M. Phone path (`?q=low`, 390 x 844):
351 calls and 579k tris to 313 and 579k. Shots in `UPGRADE ALL ROOMS 2026-10-28/shots/crowd_rollout/momlow_*`.
To recut: `Blender -b -P _build/crowd_pass.py -- "../ON LOCATION 2026-10-10/work/glb_pass" _build/crowd name:full:2500:512[:yaw]`
(yaw -90 for most of the cast, 180 for blindwoman: check the facing in a shot).

## The visitors walk (2026-10-28, later)
MLow asked for the cast's bodies and heads rigged; `UPGRADE ALL ROOMS 2026-10-28/rig` made them (RIG_TRIAL.md). The
eleven visitor characters and the guard are copied into `_build/rig` (committed) and from there into
`site/assets/glb/rig` by `build_data.py`: 3,000 tri files and 800 tri `_lite` files, skinned, no Draco, 4.0 MB in all.
`site/js/rigcrowd.js` (r128, its own SkeletonUtils style clone) and `people.js`:
- At most 20 skinned visitors (8 on a phone, `?q=low`), re ranked every 0.3 s by distance (a figure behind you counts
  2.5 times as far): the nearest 8 (4) full, the rest of the cap lite; everyone else is the static cast with the coded bob.
- A rigged visitor moves at the speed its rig recorded (times its height, 6 percent jitter) and the walk clip's time
  scale follows the ground speed, so the planted foot stays put; idle while paused, 0.3 s crossfade, random start time.
  At a sharp corner it slows while it turns instead of walking sideways.
- Standing visitors within 7 m on your floor, and the guard within 14 m, turn the `head` bone toward you, 60 degrees at
  most (25 for the Bartender and Susan, per the rig notes), eased; the body turns only past that.
- The Blind Woman is rigged idle only (cane planted), so in rig mode she stands where she was put. The Assistant was not
  rigged and walks as the Gown. `?rig=off` brings back the static cast everywhere; `?crowd=old` the cylinders.
- Measured, headless Chrome on this Mac (Apple GPU), lobby view from (2.4, 10.4), 60 frames, static (`?rig=off`) then
  rigged: desktop 2,037 to 2,023 draw calls, 4.28M to 4.24M tris, frame CPU 6.1 to 8.7 ms, mixers 0.1 to 0.2 ms for 20
  figures; phone emulation (`?q=low`, 390 x 844) 497 to 493 calls, 526k to 521k tris, 2.1 to 3.2 ms, mixers under 0.1 ms.
- Film: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/momlow_rig.mp4`. Not checked on a real phone or by hand.

## Rebuild and check
```
python3 _build/build_data.py     # the curator, data.json, atlases, posters, loops, textures, skies, props (Draco through _build/draco.py), from the site repo
./_build/stage.sh                # stage into the scratchpad, serve on 4312, headless Chrome on 9333
python3 _build/shots.py          # the audit (every work reachable, nothing overlapping) and a 25 view contact sheet
python3 _build/shots.py phone 01 03 09
```
`?go=1` skips the door, `?lock=0` keeps the mouse free, `?audit=1` prints the audit, `?time=day|golden|night` pins the
hour, `?q=low|medium|high` pins the quality. `window.__game` exposes the player, `go(i)`, `ride(floor)`, the works,
the rooms and the audit.

## Living in it
WASD walk, Shift hurry, drag or arrows to look, E or click for the card (a work, a poster, a loop), 1 to 9 and 0 jump
(street, lobby, atrium, floors 3 to 6, garden, store, terrace), the same keys ride the lift when you stand in it, C the
curator, T time of day, Q settings (quality, time, visitors, field of view), M sound. Type `gm`, `gn`, `count`, `taxi`,
`pigeon`, `mlow`, `moma`, `free`, `liberty`, `curator`.

## Credits
CC0 photo surfaces and skies from the museum kit (Poly Haven). Props: MLow's Tripo heroes (the cabs, the clock animals,
the subway car, the carousel horse, the blossoms, the eye monument), the museum kit's CC0 props, ON LOCATION's NEW
YORKERS props (Poly Haven models edited in Blender), THE MARKS heroes (the newsstand, the cat, the rat). Fonts: Fraunces,
Space Grotesk, IBM Plex Mono (OFL).
