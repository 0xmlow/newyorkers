# CLOUDS AND DIRT V2: a tower for Gary Vaynerchuk, and the wing that cannot exist

A walkable three.js gallery by MLow, built with NEW YORKERS. Version two, built on 2026-10-22 beside version one (the
folder `CLOUDS AND DIRT 2026-10-22`, never edited again). The first twelve floors are the tower: the lobby and its lift, the
dirt, Wine Library TV, Crush It, VaynerMedia floor 25, the studio, Empathy Over Park Avenue, the carousel of friends, VeeCon,
the attention exchange, the owner's box, the clouds. The thirteen floors of the wing are the part that can only exist online:
VeeFriends IP proliferated in 3D, plus the cellar, game day, the punk vault and the feed.

Open it: double click `Open CLOUDS AND DIRT V2.command`. On the site it is `garyvee.html` (n3wyorkers.com/garyvee); the first
version stays at `garyvee-v1.html`.

## What is new in V2

- **The wing**, thirteen floors (table below), each with a nook, forty plus objects, a named trick and its own song.
- **Thirteen 3D VeeFriends inspired figures** built headless in Blender from primitives (`_build/blender/veefriends_kit.py`),
  MLow's reading of the doodle: big heads, flat colours, a black marker outline, one trait accessory each. Panda, elephant,
  gorilla, goat, the lucky black cat, the bee, ant, alien, ape, pig, eagle, panther and the worm from the dirt. Never a copy of
  a drawing. They ride the vault pedestals in the six Spectacular materials, parade in the VeeDome, stand in the toy boxes,
  rise out of Burn Island.
- **Photoreal CC0 textures** from Poly Haven (`_build/polyhaven_tex.py`): leather, marble, herringbone parquet, painted
  concrete, grass, velvet, metal plate, rubber track, rock, sand, terrazzo, worn wood, painted planks, carpet, denim, checker.
- **The toolbox** `_build/src/fx.js`: the six Spectaculars (hologram with iridescence, lava with a scrolling emissive crust,
  bubble gum with clearcoat and sheen, diamond and emerald as transmission glass, gold), pixel punks drawn by code, voxel punks
  (one instanced cube per pixel), a halftone shader that prints the visitor, alcoves, columns, a mezzanine with a stair that
  sets the floor height, coffered ceilings, neon, trading cards.
- **Clip mode** (V): a 9:16 frame, a hook caption in his style and a nine second dolly through any floor, the vertical cut
  live, with the memo `VIRALITY.md` on why the tower travels.
- **Research** (`_build/RESEARCH.md`): the official TCG rules of March 2026, his punks (59 in 2021, #2140 for 1,600 ETH, the
  first one to leave through Burn Island), the Thunder Show rituals, the 2026 Jets, his content model and verbatim lines.

## The wing

| Floor | Room | Trick |
|---|---|---|
| W1 | The Doodle Room | the walls draw themselves stroke by stroke only while you are not looking |
| W2 | The Spectacular Vault | hold still at the vault door and it opens; six figures in six materials; lasers you must not cross |
| W3 | The TCG Arena | Compete and Collect at the table, the real rules: Aura, Skill, Stamina, first to seven |
| W4 | Burn Island | throw a Book Games token into the crater and the island erupts; a figure rises as the reward |
| W5 | The VeeDome | the parade of friends; keep pace with it for five seconds and you are in it |
| W6 | The Gift Goat's Room | three doors of three sizes; the smallest shrinks you to fit the Access room |
| W7 | Meet Me in the Middle | cross half court and the gym turns over, Patient Pig's end and Eager Eagle's |
| W8 | The Sunday Comics | the press prints you in halftone, page after page |
| W9 | The Toy Aisle | the ten real figures on the shelves and a claw machine that never drops a win |
| W10 | The Punk Vault | sixty code drawn punks and three voxel giants; one of them follows you |
| W11 | The Cellar | ten thousand bottles, a mezzanine, four glasses, find the sweaty sock |
| W12 | Game Day | run the route, catch it in the end zone, and the scoreboard glitches to 1969 |
| W13 | The Feed | walls of vertical screens, three live cameras, a thumb that scrolls until you stare |

## How it was made

- **Engine**: V1's, which is ON RECORD's, with V2 changes in `main.js` (clip mode on V, per room spawn points, the layer 1
  avatar kept from V1), `rooms.js` (thirteen wing rooms appended so every floor keeps its number), `music.js` (thirteen new
  styles), `build.js` (the wing files merged into ROOM, PROPS and SLOTS) and the new `fx.js`.
- **The wing** was built by four builders working in parallel from `_build/BRIEF_WING.md`, one file each: `wing_a.js`
  (doodle, vault, tcg, veedome), `wing_b.js` (burn, goat, middle, toys), `wing_c.js` (comics, punks, cellar), `wing_d.js`
  (gameday, feed), then integrated, rendered and fixed here.
- **Plates and walls**: 28 Adobe Firefly images (Nano Banana Pro, 21:9 2K plates, 16:9 2K walls) driven in Chrome as one page
  side loop; prompts in `tools/plates2.tsv` and `tools/walls2.tsv`. Two were refired after the brand check: the doodle room's
  marker read as a real marker brand and the toy boxes carried a real toy brand's badge; the first takes are kept in
  `work/ff2_plates/*_v1.png`. Depth from `_build/depth.py` (Depth Anything V2 Small, local); the wing plates are flat planes
  (`flat:`), because one point perspective halls smear as depth meshes.
- **The figures**: `_build/blender/veefriends_kit.py`, then `_build/blender/sheet.py` for a contact sheet. The marker
  outline is one shell pushed out along the normals and turned inside out, single sided. (A Solidify modifier keeps a second
  copy of the surface, which z fights the body in three.js and painted every figure black: fixed the same day.)
- **Research**: `_build/RESEARCH.md`, condensed from two research passes the same day; the official VeeFriends TCG rules of
  March 2026 decide the card game (one gem per battle won, seven gems of one attribute wins).
- **Build**: `python3 _build/build.py` (or `--js`). **Checks**: `python3 _build/check_all.py work/check` renders every floor
  headless (25 floors, 0 console errors on 2026-10-22); `work/clickall.py <rooms>` clicks everything in a room and walks it
  (0 errors in all thirteen wing rooms); `work/timed.py <rooms>` fires the timed tricks.

## Verified by script on 2026-10-22
The wall drawing caught mid stroke, the vault door after five still seconds, the six Spectacular touches and the laser alarm,
a full TCG game won to seven gems, the Burn Island eruption from a thrown token, the Gift Goat's ten presents and the Access
door, the gym flip at half court, the press printing the visitor, the ten toy names, the punk that watches you and the safe,
the sweaty sock and the bucket, the touchdown on game day, and the thumb stopping in the feed. 138 eggs are counted from the
source.

## Not verified
- No person has walked it: every check was headless Chrome on this Mac with scripted positions and clicks.
- Not fired by script: the claw winning a figure (it depends on timing the drop under a figure), the VeeDome parade (keeping
  pace with a moving figure for five seconds), three touchdowns, the punks' floor summit, the sky quote eggs.
- The music was never listened to. Phones were not tried on a device; the wing adds render target cameras in three rooms
  (25, comics, feed) that cost frame time on a phone.
- Facts on the walls are from `_build/RESEARCH.md`; anything that research marked unverified was kept off the walls or
  worded as unverified ("dozens" of punks).
- Spend: $0 (Firefly on the silan account, CC0 textures and models, Blender, local depth).
