# Builder brief: the 100x pass on the 2026-10-30 galleries

MLow's verdict on the first version of THE WRAPPED WING (`wrapped-wing/`), N3W YORKERS SPACE PROGRAM (`space-program/`)
and TAKE A NUMBER (`take-a-number/`): "these look awful". The CLOUDS AND DIRT V2 verdict on its first wing was the same
("plain jane"), and the fix is written down. This brief is that fix, applied to these 24 rooms. Read it whole before
touching a file. The lead (the integrator) owns `_shared/`, `main.js`, `kit.js`, `fx.js`, `crowd.js` and `music.js`;
you own your gallery's `_build/src/build.js` and `_build/src/rooms.js` and nothing else.

## What is wrong (measured, not felt)

- A 20 by 16 m room with 5 to 12 objects, most against the walls. The middle of the floor is bare. Nothing overhead,
  nothing on the walls beyond the twelve census paintings and a plaque. No nook, no level, no column screen: a box.
- Stock props placed as the shop made them. The branded library (577 `nyb_*` Blender edits from ON LOCATION round
  twelve: repainted in the palette, eye flower and nazar stickers pressed on, MLow labels) sits in the vault unused.
- No hero object readable from the door. You cannot tell which room you are in before the slate.
- The extras were cylinders with a sprite head. Fixed by the lead: `extra()` now gives every one a Tripo New Yorker body
  (crowd.js), rigged and walking when near. The wall mural per room (THE MARKS method) is also in: every room has a
  `site/assets/walls/<id>.jpg` on all four walls. Look at it before you dress the room; build with it, not against it.

## The standard, per room (gates, not suggestions)

1. **Forty or more objects**, in layers: foreground near the entrance lane, the middle of the floor (the biggest gap),
   the back by the rope, the walls (frames, sconces, signs, clocks, air conditioners, shelves, posters), overhead for
   interiors (fans, fixtures, chandeliers, hanging signs, a coffered ceiling), poles and gutters outdoors.
2. **A nook**: every room ships with an alcove, a mezzanine, a column screen, a pit, a counter you walk behind, a
   coffered or vaulted ceiling, or an odd ceiling height. `fx.js` has `alcove`, `column`, `mezzanine`, `coffer`, `neon`.
   A room must not read as a box with a wallpaper.
3. **A hero**: the room's signature object, from the branded library where one fits (`nyb_wallst_quote`,
   `nyb_katz_pickles`, `nyb_natm_whale`, `nyb_rink_prometheus` and so on), placed so it reads from the door, scaled big.
4. **Branded over stock**: at least six `nyb_*` edits per room; swap the stock `ph_*` props the room already has for a
   branded edit where one exists (the shared street kit: `nyb_trash_dsny`, `nyb_hydrant_pink`, `nyb_hydrant_gold`,
   `nyb_payphone`, `nyb_lamp_banner`, `nyb_lamp_nazar`, `nyb_milkcrate_pink`, `nyb_milkcrate_cyan`, `nyb_barrier`,
   `nyb_utility_bomb`, `nyb_aircon`, `nyb_bench_plaque`, `nyb_chainlink`, `nyb_tv_eye`, `nyb_register_gold`,
   `nyb_barstool_pink`, `nyb_coffeecart`, `nyb_suitcase_bomb`, `nyb_seccam_counted`, `nyb_extinguisher`, `nyb_aframe_sign`).
   `ls _shared/vault/glb` lists all 889 (the `nyb_<set>_<thing>` names say what they are; the MARKS kit is `mk_*`, the
   sewers cast `sw_*`, Poly Haven `ph_*`, Three D Scans `tds_*` and Smithsonian `si_*` are Z up and need `rx`).
5. **Every surface a real texture.** No flat untextured box bigger than a stool. `c.surf(name, rep, tint)` names
   (all shipped by every gallery after a full build): ashlar, asphalt, boardwalk, brick, cobble, concrete, grass,
   marble, patina, pavers, planks, plaster, steel, terrazzo. A name outside that list is a 404 and a black slab; for
   velvet, leather, wood grain, tile or wallpaper draw a `c.canvasTex` and tint it, or use `decal()`.
6. **Keep the trick, feed it.** Read the room's code first. The trick stays and gets better set dressing around it; do
   not break its colliders, its tick or its egg. If the trick is weak, say so in your report, do not replace it silently.
7. **Three to five clickable eggs** per room with a line in MLow's voice (dry, specific, true to the room, a New York
   twist). Egg ids unique across the gallery, prefixed with the room id (`deli_pickle`). Eggs are counted from the
   source at build time, so `c.egg('id', line)` or `egg: ['hint', 'id', 'line']` on a prop both count.
8. **The extras are people now.** `extra(c, g, x, z, { seated, col, ry, pool })` gives a crowd body; pools are
   `walkers`, `suits`, `night`, `dressy`, `seated`, or a list of names (crowd.js). Set `r.crowd` in rooms.js for the
   room's default pool. Queues (`queue()`) already use extras. Put people where the room's story puts them.
9. **Leave the approach open**: the visitor spawns at (10, 5.8) facing north (or at `r.spawn`); keep x 8 to 12, z 1 to 6
   clear of anything taller than a knee, keep both doors (z 2 to 5.6 on the west and east walls, x under 1.5 and over
   18.5) clear, and a lane along z 2.5 to 5 between them. Never stand anything tall in front of the hung paintings
   (`SLOTS[id]` or `slotsDefault()`: the south wall at z 8 and the side walls at z -6.6, -4.2, -1.8 by default).
10. **Lights are a budget.** The engine gives each room four lights. You may add at most three more (an alcove light, a
    neon, a practical). Everything else glows with emissive materials, `glow()` sprites and `bulbs()`.

## House rules

- No em dashes, no en dashes, no arrows in anything a person reads: labels, eggs, hints, comments. Commas and full stops.
- The artist is MLow. No real brand or company names on signs (N3W YORKERS, MLOW, DEPT. OF THE COUNTED, NAZAR COLA,
  EYE CRUNCH are ours). No actor or real person likeness. People have eye flower heads. Never state a total supply.
- A room only undoes what it did: `P.scale`, `P.speed`, `P.lift`, `FX.*`, `TIME.target` are global; reset only what you
  set, behind a flag, when the visitor leaves (`r.onLeave`).
- Z up models (`tds_*`, `si_*`, some `nasa_*`) take `rx` (PI, PI/2, -PI/2); check the shot.
- `texture.clone()` before the image lands renders black. Share one texture, offset UVs.
- No deploys, no commits, no pushes, no PRs. The lead commits.

## The API you build with

Room builders are `ROOM[id](c, r, g, X, mats)` in `build.js`; `PROPS[id] = [[name, x, z, { h | len, ry, y, r, egg, snd,
fn, hint, spin, sway, bob, raw, rx, label }], ...]` is the prop table placed before your code; `SLOTS[id]` where the
census paintings hang. `g` is the room group, positions local (x 0 to 20 west to east, z -8 at the plate to 8 at the
south wall, y up, ceiling `r.tall || 6`); colliders are world: `c.post(X(x), z, r)`, `c.wall(X(x1), z1, X(x2), z2)`.

`kit.js` (read it, 240 lines): `shell`, `matsFor`, `eyeFlower`, `decal(c, w, h, draw)`, `glowTex`, `glow(c, g, x, y, z,
col, s)`, `bulbs(c, g, x1, x2, y, z, n, col)`, `watcher`, `extra`, `headTex`, `slate`, `rope`, `prop(c, r, g, X, name,
x, z, o)`, `cast(c, r, g, X, name, x, z, { h, ry, y, r, line, egg, hint })`, `plaque`, `notice`, `board(c, g, w, h, px)`
(a live canvas: `{ m, q, W, H, up }`), `label`, `plinth`, `queue(c, g, pts, n, { col, ry })`, `column(c, g, x, z, h, R,
col)`, `confetti`, `slotsDefault`, `slotsSouthOnly`, `slotsWestFree`, `lane`, `stanchions`, `std`, `basic`, `here(r, ri)`,
`local(r, P)`, `INK`, `DZ1`, `DZ2`, `DH`, `Reflector`.

`fx.js` (import what you use): `alcove(c, r, g, X, { side: 'w' | 'e' | 's', at, w, d, h, mat, floorMat, light })`,
`column(c, r, g, X, x, z, { h, rad, mat, cap })`, `mezzanine(c, r, g, X, { y, depth, mat, rail, stairAt })` (south wall,
sets `r.ground`), `coffer(c, r, g, { nx, nz, y, mat, bulb })`, `neon(c, g, x1, y1, z1, x2, y2, z2, color, rad)`,
`hologram(c)`, `lava(c)`, `bubblegum(c)`, `diamond(c)`, `gold(c)`, `emerald(c)` (materials), `recolor(root, mat)`,
`punkCanvas`, `voxelPunk`, `halftoneMaterial(c, texture)`.

Engine (`c`): `THREE, scene, camera, renderer, surf, slab(w, h, d, mat, x, y, z), sign(text, { w, h, bg, fg, font,
weight, glow, px, pad, border }), canvasTex(w, h, draw), glb(name, { h | len, x, y, z, ry, rx, parent, onload, shadow }),
wall, post, tick(fn(t, dt, P, ri, rdt)) (act only when ri === r.i), clickable(obj, fn, hint), hang, plate, tex, egg,
toast(text, ms), say(anchor, text, ms, dy), sound.<beep|click|ding|tick|thud|boom|whoosh|applause|clink|...>(), shake,
flash, FX, TIME, zoom, ride(curve, dur, onEnd), ray, hemi, lights, P, EYE, MOBILE, FONT, SERIF, MONO, ROOMS, cur(),
go(i)`. Room data in `rooms.js`: `floor, floorTint, wall, wallTint, ceil, ceilTint, lights [[x, y, z, col, i, dist]],
hemi, env, fog, fogD, sky, frame, post, tall, outdoor, low, noRope, edge, well, spawn, crowd, move, ground, fov, onEnter,
onLeave`. The mural is `site/assets/walls/<id>.jpg` (chosen in `_build/spec.json`; ask the lead to change it).

## Your loop

```
python3 _shared/build.py <gallery> --js                     # bundle only (a syntax error fails loudly: fix it at once)
python3 _shared/build.py <gallery>                          # full: also copies any new model you named into site/assets/glb
python3 _shared/shot.py <gallery> <gallery>/work/shots a=room=<id> --wait 12
python3 _shared/shot.py <gallery> <gallery>/work/shots b=room=<id> --wait 12 --eval "__P.x=<x>;__P.z=<z>;__P.yaw=<rad>;__P.pitch=0"
```

One or two rooms per shot run (software GL; a run with many rooms is slow). LOOK at every shot (Read the jpg). The run
prints console errors, exceptions and HTTP 404s at the end: there must be none from your code; a 404 on a model means
the name is wrong or the full build was not run. Take the entrance view and a view from the rope looking back. Props on
the spawn point or in the approach are the commonest mistake: check the entrance shot for them.

## Hand back

A short report per room: the hero, the nook, the object count, the branded edits used, the egg ids, what you changed
in rooms.js, what you did not verify. Do not commit.
