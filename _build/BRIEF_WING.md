# Builder brief: THE VEEFRIENDS WING of CLOUDS AND DIRT V2 (2026-10-22)

You are building rooms for a walkable three.js tower for Gary Vaynerchuk by MLow (NEW YORKERS). The first twelve floors exist
(`_build/src/build.js`, the `ROOM` object: read two or three of them first to learn the voice and the API). The wing is the part
of the tower that cannot exist in reality: VeeFriends IP proliferated in wacky 3D, plus the cellar, game day, the punks and the
feed. MLow's verdict on the first version: "plain jane". Your room must not be a box with a wallpaper. It needs nooks, levels,
columns, alcoves, odd ceilings, dense props, at least forty things, one named browser only trick, three to five clickable eggs
with a line in MLow's voice, and every surface a real texture.

## House rules (gate everything)
- No em dashes, no en dashes, no arrows in any string a human reads. Commas and full stops.
- No likeness of Gary or anyone; the cast have eye flower heads (the `cast()` helper loads Tripo GLBs that already do).
- No VeeFriends drawing is copied. Characters are named (verified names only, below) and shown as MLow's 3D figures
  (`vf_<name>` GLBs: panda, elephant, gorilla, goat, blackcat, bee, ant, alien, ape, pig, eagle, panther, worm).
- No logos (VeeFriends, VaynerMedia, Jets, CryptoPunks, Topps, Macy's). Names as words on plaques are fine. Pixel punks are
  code drawn flower headed New Yorkers (`punkCanvas`, `voxelPunk`), never a real punk.
- Facts must be true. Use the research in `_build/RESEARCH.md` (appended when ready; if missing, use only the facts in this
  brief). Verified facts: Series 1 May 11 2021, 10,255 tokens, 268 characters, 9,400 Admission, 555 Gift Goat, 300 Access;
  Series 2 April 2022, 55,555 tokens; Spectaculars: Hologram, Lava, Bubble Gum, Diamond, Gold, Emerald (Series 2 added
  Emerald); Book Games Jan 2022, 125,000 burnable tokens, Burn Island; the TCG is Compete and Collect, attributes Aura,
  Stamina, Skill, first to seven points in one attribute wins; Macy's and Toys R Us figures Oct 2022: Practical Peacock,
  Willful Wizard, Genuine Giraffe, Adventurous Astronaut, Gratitude Gorilla, Patient Panda, Empathy Elephant, Common Sense
  Cow, Heart Trooper, Be the Bigger Person; the animated series arena is the VeeDome (Moonbug, 2024); Sunday comics in 72
  Lee Enterprises newspapers from Feb 2025; brand colour purple, mascot the Very Very Very Very Lucky Black Cat; Wine Library
  at 586 Morris Avenue, Springfield NJ, a mezzanine round the floor, founded 1983 as Shopper's Discount Liquors, winelibrary.com
  1996; Gary's number is 5; VeeCon 2022 Minneapolis. Verified character names (use any): Patient Panda, Empathy Elephant,
  Gratitude Gorilla, Gift Goat, Very Very Very Very Lucky Black Cat, Gary Bee, Accountable Ant, Adaptable Alien, Alert Ape,
  Patient Pig, Eager Eagle, Podcast Panther, Tough To Beat A Worm From The Dirt, Entrepreneur Elf, Garage Sale Yale, 5555 Fan,
  Bullish Bull, Hodl Hyena, To The Moon Meerkat, Keynote Koala, Kind Kudu, Self-Aware Hare, Shrewd Shark, Tremendous Tiger,
  Uno Unicorn, Willful Wizard, Zealous Zombie, Perspective Pigeon, Reliable Rat, Sensible Sommelier, Mentor Meeting Mongoose,
  Macro Micro, Last Glass Standing, Fuck You Monday Mole, Diamond Hands Hen, Honest Honey Bee, Humble Hedgehog, Hustling Hamster.

## The engine API (what `c` gives a room builder `(c, r, g, X, mats)`)
Room coordinates: x 0 to 20 (W), z -8 to 8 (D), y up, ceiling 6 (H_IN). The plate (the photograph) is on the north wall
(z = -8) behind a 12 m portal; the velvet rope stands at z = -6.75; the visitor spawns at (10, 5.8) facing north. Side doors
are on the west (x = 0) and east (x = 20) walls at z between 2 and 5.6. `g` is the room group (positions are local);
`X(x)` turns a local x into a world x for colliders. `r.x0` is the room's world x offset.
- `c.slab(w, h, d, mat, x, y, z)` box mesh (add to g). `c.surf(name, rep, tint)` a PBR material from `assets/tex`:
  asphalt, brick, plaster, terrazzo, concrete, marble, cobble, planks, leather, marble2, parquet, paint, grass, velvet, metal,
  rubber, rock, sand, terrazzo2, paintcrete, oldwood, blueplanks, carpet2, denim, checker (all Poly Haven CC0, photoreal).
- `c.sign(text, {w, h, bg, fg, font, weight, glow, px, pad, border})` a text plane (bg null = transparent). `c.canvasTex(w, h, draw)`.
- `c.glb(name, {h | len, x, y, z, ry, parent: g, onload(group, inner)})` lazy GLB. Names: `vf_panda` etc, Poly Haven `ph_<id>`
  (see PROPS tables in build.js for ids), cast names (`hustler`, `dad`, `boxer`, `agent`, `lensman`, `maitre`, `elf`, `tracksuit`,
  `dancer`, `broker`, `editor`, `famer`, `golfer`, `writer`, `workgirl`, `assistant`, `anchor`, `bookseller`, `clerk`, `sally`,
  `prince`, `usher`, `actress`, `bartender`, `checker` (a cab), `hotdog` (a cart), `mlowtar`), museum props (`h_taxi`, `lamppost`,
  `mailbox`, `gull`, `dog`), MARKS heroes (`cat`, `pigeon`, `rat`, `hydrant`).
- `c.wall(x1, z1, x2, z2)` a line collider in WORLD x (use X()); `c.post(X(x), z, r)` a round collider.
- `c.clickable(mesh, fn, hint)`; `c.egg(id, line)` (ids unique across the whole gallery: prefix yours with your room id);
  `c.toast(text, ms)`; `c.say(anchor, text, ms, dy)`; `c.tick((t, dt, P, ri, rdt) => ...)` runs every frame; only act when
  `ri === r.i`; `c.P` the player {x, z, yaw, pitch, scale, speed, lift}; `c.camera`; `c.lastHit.point` on click; `c.flash(v)`;
  `c.shake(a)`; `c.FX.tint / sat / warp` (reset what you set when the visitor leaves: `r.owns`); `c.music.level(v)`,
  `c.music.mute(m)`; `c.sound.<beep|click|ding|tick|thud|boom|whoosh|applause|clink|meow|bark|coo|drumroll|bell|crack|pop|
  screech|horn|chant|cheer?>()` (check sound.js); `c.ride(curve, dur, onEnd)`; `c.renderer`, `c.scene`, `c.avatar` (the visitor's
  figure on layer 1, for cameras inside the world); `c.keys`; `c.TIME.t`; `c.MOBILE`; `c.EYE` (1.62); `c.FONT/SERIF/MONO`.
- `r.move(P, nx, nz, dt)` bends the walk; `r.ground(x, z)` floor height in local x; `r.fov(P)`.
- Helpers in build.js you may call (same file): `std(c, color, opts)`, `basic(c, color)`, `decal(c, w, h, draw, px)`,
  `extra(c, g, x, z, {seated, col, ry})` a flower headed extra, `cast(c, r, g, X, name, x, z, {h, ry, line, egg, hint})`,
  `plaque(c, g, x, y, z, ry, text, who, w)`, `bulbs(c, g, x1, x2, y, z, n, col)`, `watcher(...)`, `eyeFlower(q, x, y, R)`,
  `glowTex(c, col)`, `steam(c, g, x, y, z)`, `HEAD`, `INK`, `PURPLE = 0x5a2fa0`, `GOLD = 0xf5c542`.
- fx.js (import in your file): `hologram(c)`, `lava(c)`, `bubblegum(c)`, `diamond(c)`, `gold(c)`, `emerald(c)`,
  `SPECTACULARS`, `recolor(root, mat)` (paints a vf_ figure, keeps the ink outline), `punkCanvas(c, seed, px, scale)`,
  `voxelPunk(c, seed, size)`, `halftoneMaterial(c, texture)`, `alcove(c, r, g, X, {side, at, w, d, h, mat, floorMat, light})`,
  `column(c, r, g, X, x, z, {h, rad, mat})`, `mezzanine(c, r, g, X, {y, depth, mat, stairAt})` (sets r.ground),
  `coffer(c, r, g, {nx, nz, y, mat, bulb})`, `neon(c, g, x1, y1, z1, x2, y2, z2, color)`, `cardTex(c, {name, aura, stamina, skill, rarity, col, draw})`.

## Your deliverable
One file `_build/src/wing_<yourname>.js` that exports:
```js
export const ROOMS_X = { roomId(c, r, g, X, mats) { ... }, ... };   // one builder per room you own
export const PROPS_X = { roomId: [[polyhavenId, x, z, { h | len, ry, y, r, egg: [hint, id, line] }], ...] };  // optional
export const SLOTS_X = { roomId: () => [{ x, y, z, ry, w }] };   // optional, where the twelve New Yorkers hang
```
Import what you need from `./fx.js` and `./rooms.js` (W, D, H_IN, PORTAL). You may not edit build.js, main.js or rooms.js;
if you need a helper from build.js, copy it into your file. Keep every egg id unique (prefix with the room id). Write the
tick code so it does nothing when `ri !== r.i`. Keep props off the spawn's line of sight (x 8 to 12, z 1 to 6 is the
approach to the picture; leave it open). Every room ships with a nook: an alcove, a mezzanine, a pit, a stair or a column
screen. Density: forty or more objects. Textures: use the PBR names above, never a flat untextured box for a big surface.
Check your file with `node --check` and report what you built, the trick, the eggs and anything you could not verify.
Do not run the full build or the browser; the integrator will.
