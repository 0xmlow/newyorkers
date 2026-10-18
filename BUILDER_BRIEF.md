# THE PIGEONHOLE: builder brief

A walkable three.js exhibition for NEW YORKERS by MLow: **a museum inside a pigeon inside a bodega inside a dream.**
Twelve rooms at four scales. Each room is inside something in the room before it, and the last room holds the first.
MLow's ask, in his words: "the most New York exhibit ever", "way more detailed and interesting and expansive", "crazy
optical illusions that are only possible online", "more fun and playful", "everything unique", stickers and posters on
the walls, his asset pack, photoreal via depth maps, in his style. He called a previous gallery "super boring and plain".
Sparse rooms with a few props read to him as AI slop. **Dense, specific, funny, New York.**

You own one or two room files in `src/rooms/`. Do not edit `src/engine.js`, `src/main.js`, `tools/`, or other rooms.
If you need an engine change, do it locally inside your room file, or describe it in your final report.

## The line (room order, ids, how they connect)

| # | id | Scale | Room | Enter from | Leave to |
|---|---|---|---|---|---|
| 1 | car | I The dream | Last Stop, 3:33 A.M. (built) | start, and the snow globe in 12 | doors open on car 3 to platform |
| 2 | platform | I The dream | The Platform of Wrong Sizes | car | a bodega doorway in the platform wall to bodega |
| 3 | bodega | II The bodega | Pigeonhole Deli Grocery (Claude builds) | platform | cooler door to cooler; stockroom door to stairs; the counter pigeon's EYE (portal) to nave |
| 4 | cooler | II The bodega | The Cooler | bodega | back out the door to bodega `[0.6, -5.4, Math.PI]` |
| 5 | stairs | II The bodega | The Stockroom Stairs | bodega | up to bodega `[3.6, -5.4, Math.PI]`; the nest pigeon's EYE (portal) to nave |
| 6 | nave | III The pigeon | The Nave (the neck) | eye portals from bodega and stairs | far end to crop |
| 7 | crop | III The pigeon | Lost and Found (the crop) | nave | to heart |
| 8 | heart | III The pigeon | The Heart | crop | to wing |
| 9 | wing | III The pigeon | Hall of Flight (the wing) | heart | to dome |
| 10 | dome | III The pigeon | The Homing Dome (the brain) | wing | to museum |
| 11 | museum | IV The museum | The Museum of Modern Pigeon (Claude builds) | dome | to shop |
| 12 | shop | IV The museum | The Gift Shop | museum | a snow globe (portal, k small) to car, and the visitor wakes up: `c.wakeUp()` |

Every room also keeps a way back to the room before it (a door). **A room's `spawn` is where portals land**, so keep
1.5 m clear behind and around the spawn point (the arrival clip plane cuts everything behind it).

## Room module shape

```js
export default {
  id: 'nave', name: 'The Nave', scale: 'III · The pigeon', kicker: 'One line, shown under the name.',
  sound: 'nave',               // bed in src/sound.js: train platform bodega cold stairs nave crop heart wing dome museum shop
  sky: 0x05081a, fog: 0x0a1030, fogD: 0.02, hemi: [sky, ground, intensity], env: 0.4,
  post: { dream: 0..1, bloom: 0.8, vig: 0.45, sat: 1, grain: 0.12, ca: 0.003, tint: 0xffffff },
  spawn: [x, z, yaw],          // yaw 0 faces -z
  ground: (x, z) => 0,         // optional floor height in local coords (stairs, slopes)
  move: (P, nx, nz, dt) => [nx, nz],   // optional: bend or wrap the walk (assign it in build as c.R.move)
  fov: (me) => 68,             // optional
  build(c) { ... },
  onEnter(c) { ... },          // optional
};
```

Rooms are built lazily, in **local coordinates** (each room's origin is its own; rooms are 400 m apart on x, so a
plate 80 m deep never meets the next room). Only the current room is drawn, plus whatever a portal looks at.

## The context `c` (everything is local to the room)

- `c.THREE`, `c.EYE` (1.62), `c.MOBILE`, `c.REDUCED`, `c.FONT`/`c.SERIF`/`c.MONO`, `c.P` (player: x is WORLD, use `me` in ticks), `c.sound`, `c.R` (the room; `c.R.state` is yours)
- `c.add(obj)`; `c.group` the room group
- `c.box(w, h, d, mat, x, y, z, { rep, collide = true, ry })` a slab with metre UVs and a collider round its footprint
- `c.slab(...)` same without adding or colliding; `c.wall(x1, z1, x2, z2)`, `c.post(x, z, r)` colliders only
- `c.surf(name, rep, { tint, normal, rough, physical, params })` a generated PBR material. Names: `bodega_floor subway_floor subway_wall feather velvet crop terrazzo stickerwall tile ceiling receipts` (each has `_c _n _r`; the normal and roughness are derived from the image, an approximation)
- `c.picture('g/<name>.jpg', w, h, { emissive, basic })` a generated graphic as a plane. Graphics: `g_shelf_snacks g_shelf_cans g_shelf_home g_awning g_menu g_lotto g_metrocard g_poster_pigeon g_poster_bodega g_poster_wake` (some may still be generating; reference them anyway)
- `c.sign(text, { w, h, bg, fg, font, weight, glow, px, border, align })` canvas text plane (not added)
- `c.canvasTex(w, h, draw)`, `c.eyeFlower(ctx2d, cx, cy, R, { lid, look:[x,y], iris })` the Open Eye Flower drawn in code
- `c.plate(name, { x, y, z, ry, far, zMin, tint, eye, zscale, parent })` a depth plate: the generated photo rebuilt as geometry from its depth map. Its camera sits at (x, y, z) looking down -z (rotated by ry); geometry starts zMin metres out. Plates: `p_dream_window p_tunnel p_street p_cooler_snow p_cooler_beach p_cooler_eye p_cooler_harbor p_heart p_hall p_map` (rerolls `p_cooler_*2`, `p_dream_window2` coming: these have no frame painted in). Plates look right from near their camera; give them a backdrop (a dome or wall) for oblique views.
- `c.pocket({ mask, build: (grp) => {...}, sheen })` **glass that is bigger on the inside**. `mask` is a Mesh (a pane, any shape, merge several with `c.merge([geos])`); whatever you put in `grp` (room coordinates, put it behind the glass, inside the wall) draws only through the pane. One pass, full resolution.
- `c.portal({ mesh, src, to, at, k, ride, hint, res, maxDist, clip, recurse, onArrive, dur, glass })` a **live render target portal**. `src` is an Object3D at the centre of the aperture whose +z faces the visitor; `at` is `[x, y, z, yaw]` in room `to` (use `c.spawnOf(id)`); `k` = destination metres per source metre, roughly (width of the view you arrive in) / (width of the aperture): a 3 cm pigeon eye opening onto a 2 m wide nave is k about 66, a 25 cm snow globe opening onto a 3 m wide subway car is k about 12. With `ride: true` a click flies the camera into the aperture and swaps you seamlessly into the destination. `recurse: n` renders n levels when the destination contains the portal itself.
- `c.door({ x, z, r, to, at, off, fn })` a floor trigger (set `.off` to disable; `fn` overrides)
- `c.go(id, [x, z, yaw])`, `c.ride({ to: Vector3 (WORLD), yaw, pitch, dur, onEnd })`, `c.wakeUp()` (loop count +1), `c.loop()`
- `c.hang(piece, x, y, z, ry, w, style, { label, light })` a New Yorker in a frame, click opens its card. Styles `black gilt steel copper bone cobalt none`. `c.art(n)` hands you the next n pieces of this room's allotment (car 14, platform 12, bodega 16, cooler 10, stairs 12, nave 16, crop 14, wing 16, heart 14, dome 40, museum 14, shop 12). **Hang all of them.** Art is never covered by stickers, never tinted, aspect correct.
- `c.sticker(id, x, y, z, { ry, rx, size, rot })` one die cut vinyl sticker, slightly curled. Ids by group: `window.STICKER_GROUPS.eye | mlow | bodega | subway | museum | street` (96/32/64/64/48/64). Cluster them, overlap them, put them on doors, poles, fridges, vents, never on art.
- `c.glb(name, { h, len, x, y, z, ry, tint, emissive, onload })` a model from the asset pack (Draco), scaled to height h or length len, with a contact shadow. Click with `c.click(group, fn, hint)`. Pack: `pigeon cat rat hydrant h_subway_car pigeonlady boombox hotdog mlowtar lamppost mailbox bench gull dog popcorn` and Poly Haven CC0 props (prefix `ph_`): `CashRegister_01 Shelf_01 WetFloorSign_01 cardboard_box_01 plastic_crate_01 metal_trash_can wooden_crate_01 wall_clock Television_01 bananas food_apple_01 lemon croissant hamburger_buns cigarette_pack vintage_radio_transceiver mounted_fluorescent_lights ceiling_fan steel_frame_shelves_03 wooden_display_shelves_01 trashbag street_rat marble_bust_01 fancy_picture_frame_01 ornate_mirror_01 Chandelier_02 brass_vase_01 bronze_whale_statue gothic_statue vintage_grandfather_clock_01 potted_plant_02 Barrel_01 hand_truck metal_stool_01 rubber_duck_toy magnifying_glass_01 binoculars mantel_clock_01 modular_airduct_rectangular_01 pull_chain_light_socket industrial_wall_sconce caged_hanging_light fire_alarm korean_fire_extinguisher_01 vintage_suitcase postcard_set_01 tea_set_01 round_spectacles wicker_basket_01 yellow_onion baseball_01 boombox`. If you need a model not listed, ask in your report (the build copies only listed ones; 867 exist in `../ON LOCATION 2026-10-10/site/assets/glb`, add yours to `GLBS` in your report, do not edit tools/).
- `c.light(x, y, z, color, intensity, distance, fn(t))` up to **6** per room (a pool; more are ignored). Lean on emissive materials and the environment for the rest. No shadows.
- `c.tick((t, dt, me) => {})` per frame while you are in the room; `me` = `{ x, z, y }` local. `c.click(obj, fn, hint)`.
- `c.egg('roomId_name', 'line')` an easter egg (counted at build time from the literal `egg('...')` calls; ids unique, prefix with your room id). `c.toast(text, ms)`, `c.say(obj, text)` a speech bubble, `c.shake(a)`, `c.flash(v)`.
- `c.anamorph({ from: [x, y, z], aim: [x, y, z], image: 'g/....jpg', grid: [10, 10], size, minD, maxD })` an image cut into fragments and stuck on the room's surfaces along the rays from one spot: one picture from there, scraps from anywhere else.
- `FX.dream/sat/warp` via the room's `post`; per moment: `c.R.post.sat = 0` etc. is read every frame.

## The style (MLow Impermanent Vision, apply it to ARCHITECTURE, never over the art)

Palette: ink void `#02040C`, midnight navy `#06163A`, electric cobalt `#2962FF`, luminous cyan `#00E5FF`, deep violet
`#6F23A8`, hot pink `#FF2E63`, bone white `#F0F4F8`, restrained copper `#BE854C`. Acid yellow, orange, green only as
brief signals. Signatures: liminal thresholds, contour lines that follow form (do them as geometry or object space
shaders that wrap the surfaces, not a screen filter), **physical paint drips as geometry** off ledges and lips (hot pink,
violet), one sovereign Open Eye Flower per room that watches something and has a job (it tracks you, blinks, opens a
door), a lone figure. Avoid rainbow psychedelia, cute flowers, decorative flower confetti, evenly spread neon.

NEW YORKERS world rules: every person is a New Yorker with an Open Eye Flower for a head. No real brand names or
logos anywhere (MLow twists: NAZAR COLA, EYE CRUNCH, TALLY CHIPS, COO COO PUFFS, 3:33 AM ENERGY, PIGEONCARD). Text in
the world is fine. The artist is `MLow`. **No em dashes, en dashes or arrows in any text anywhere**, code comments
included where a person might read them. Labels are funny and specific, written like a serious museum about absurd
things ("Everything bagel, crumb. Astoria, this morning. Gift of an unnamed tourist.").

## The bar for every room

1. **One headline illusion that only works in a browser**, named in a comment with its mechanism (portal, pocket,
   camera reactive scale, gaze reactive behaviour, look away change, non Euclidean wrap, gravity change, anamorphosis,
   forced perspective, dolly zoom, impossible loop). Not a filter. It must be the reason someone posts the room.
2. **Dense**: 40 to 120 distinct things a person could look at. Real props from the pack, stickers in clusters,
   posters, signage, the room's New Yorkers lit and labelled, paint drips as geometry, a floor that is not flat colour.
3. **Two to four easter eggs**, each a click on something specific, with a line that lands.
4. **Readable art**: paintings at eye height (centre 1.5 to 1.7 m), at least 1.2 m wide unless the room is a joke
   about scale, lit, never behind props, never under stickers.
5. **Walkable**: colliders on every wall and solid; spawn clear; a visible way out; nothing traps the visitor.
6. **Cheap**: merge static geometry, instance repeats (InstancedMesh), at most 6 lights, no shadows, textures you
   reuse. A phone must hold it.

## Verify before you report (mandatory)

Build into your own directory so builders do not overwrite each other, then shoot it headless:

```
python3 tools/build.py --js --out work/dev_<you>
python3 tools/shot.py work/shots_<you> a="room=<id>" b="room=<id>&cam=x,y,z,yaw,pitch" --site work/dev_<you> --http <your port> --port <your port + 1000> --wait 9
```

`cam=x,y,z,yaw,pitch` is local to the room. Ports: A 4301, B 4302, C 4303, D 4304, E 4305. **Look at every
screenshot** (Read the PNG) and fix what you see. Print console errors (shot.py prints them). Shoot at least four
angles per room plus the illusion working. The disk is nearly full: delete your shots folder before you finish, keep
at most three final PNGs per room in `work/final/`. Never run `tools/build.py` without `--js` (that rewrites shared assets).

Report back: what you built, the illusion and its mechanism, the eggs, the shots you checked, anything you could not
make work, models you want added.
