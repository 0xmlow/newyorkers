# Round twelve: every set, CC0 props made ours in Blender

MLow asked (2026-10-10): take CC0 3D props related to each film, edit them in Blender to be NEW YORKERS and MLow
themed, improve every set we built, add more to each, make them extremely impressive. Read `AUDIT_2026-10-10.md`
first (a page): the later sets average 3 props, eleven have none, and not one prop in the gallery is branded.

## Where you work (and where you must not)

- You own one batch file, `_build/src/up/bN.js`, and one recipe file, `_build/brand/bN.json`. Edit nothing else
  in `_build/src` (seven other builders are working at the same time). Read `build.js` freely.
- `bN.js` exports three objects keyed by set id:
  - `PROPS`: rows `[name, x, z, { h | len, ry, y, r, egg: [hint, 'id', line], snd, spin, bob }]`, exactly the
    `PROPS` format in build.js. `name` is a Poly Haven id (`metal_trash_can`, gets `ph_`), or a full model name
    (`nyb_trash_dsny`, a cast model with `raw: true`). `h` is height in metres, `len` the longest plan side. `r` adds
    a round collider. `y` lifts it (a table top, a shelf, a wall).
  - `ROOM`: `id(c, r, g, X, K, mats) { ... }` runs after the set's own code. `g` is the set's group, so positions are
    local (x 0 to 20 west to east, z -8 at the photograph to +8 at the south wall). Colliders are world: `c.post(X(x), z, r)`,
    `c.wall(X(x1), z1, X(x2), z2)`. `K` is the kit: `K.prop(r, g, X, name, x, z, o)`, `K.decal`, `K.extra` (an eye
    flower extra, seated or standing), `K.std`, `K.basic`, `K.eyeFlower`, `K.bulbs`, `K.watcher`, `K.flyer`, `K.glowTex`, `K.steam`, `K.figure`.
    Engine (`c`): `slab`, `sign`, `canvasTex`, `glb`, `tick`, `clickable`, `egg`, `toast`, `say`, `sound`, `P`, `flash`, `shake`, `FONT`, `SERIF`, `MONO`.
  - `SWAP`: `{ id: { metal_trash_can: 'nyb_trash_dsny' } }` turns a stock prop the set already places (through
    `prop()`, i.e. its PROPS rows or `prop(c, r, g, X, ...)` calls) into a branded edit, in that set only.
- Set geometry: doors in both side walls at z 2 to 5.6 (keep x < 1.5 and x > 18.5 clear there, and a walking lane
  along z 2.5 to 5 between them). The twelve paintings hang on the south wall (z 8, y 2.1, every 2.6 m) and the side
  walls (z -6.6, -4.2, -1.8): never stand anything tall in front of them. A rope or edge keeps people about 1.2 m off the
  photograph at z -8; props may stand right up to it. Do not move or break the set's trick: read its code first.

## Making CC0 props ours (the point of the round)

1. Library: 247 Poly Haven models already passed in `work/glb_pass/ph_*.glb` (list them). More: `python3 _build/polyhaven.py id ...`
   with `PROP_TEX=512` set (catalogue: `curl -s https://api.polyhaven.com/assets?t=models`). Poly Haven only: it is CC0.
   Do not use AI image or 3D generation this round, and nothing that costs money.
2. Write recipes in `_build/brand/bN.json` (format and every option in the docstring of `_build/brand_pass.py`), then
   `python3 _build/brand.py _build/brand/bN.json -j 3 --preview <your scratch>/prev` and LOOK at every preview
   before placing it. Name edits `nyb_<set>_<thing>` so batches never clash.
   - `paint` op `paint` recolours keeping the wear (a gradient map), `tint` multiplies, `gild` makes gold.
   - stickers: fixed ones in `work/stickers` (eyeflower, eyeflower_gold, eyeflower_cyan, eyeflower_die, nazar, nazar_die,
     logo01/03/05/11/12/20, tag_mlow, tag_mlow_cyan, tag_mlow_gold, tag_n3w, counted, counted_blue, census, plate_n3w,
     plate_mlow, label_n3w, label_bymlow, label_property, label_counted_dept, neon_n3w, neon_mlow) or any text label
     `{"text": ..., "bg", "fg", "border", "eye", "glow"}`. Faces: `-Y` is the model's front (what you see at ry 0),
     `+Z` the top. Check which side is the front in the preview; many Poly Haven models ship as pairs or rows.
   - `adds`: `disc` (a nazar or eye flower standing on top, with `rim` and `pole`), `card` (a free plane: a banner, a placard).
3. The shared street kit, already made (`_build/brand/common.json`, use freely): nyb_trash_dsny, nyb_hydrant_pink,
   nyb_hydrant_gold, nyb_payphone, nyb_lamp_banner, nyb_lamp_nazar, nyb_milkcrate_pink, nyb_milkcrate_cyan, nyb_barrier,
   nyb_utility_bomb, nyb_aircon, nyb_bench_plaque, nyb_chainlink, nyb_tv_eye, nyb_register_gold, nyb_barstool_pink,
   nyb_coffeecart, nyb_suitcase_bomb, nyb_seccam_counted, nyb_extinguisher, nyb_aframe_sign.

## The bar, per set

1. At least eight new objects, three or more of them your own Blender edits made for this film.
2. A **hero edit**: the film's signature object built from CC0 and branded (Big's chess set gilded with eye flower
   pawns labels, a payphone that is the film's phone, the Wall Street ticker desk, a ship's lifebuoy reading N3W FERRY),
   placed so it reads from the entrance.
3. Swap at least two stock props the set already has for branded edits (SWAP), where it has any.
4. Layers: foreground near the entrance lane, the middle of the floor (the audit's biggest gap), back by the rope,
   walls (frames, sconces, signs, air conditioners, gutters), and overhead for interiors (fans, fixtures, chandeliers).
   Period right: no flat screens in 1957.
5. One new egg (clickable, `egg: [hint, 'id', line]` or `c.egg('id', line)`), id prefixed with the set id so no two clash
   (`katz_pickle`). The line has an MLow twist and is true to the film without quoting it at length.
6. Every label is a NEW YORKERS or MLow version of the real thing (MLOW CAB CO., N3W BELL, DEPT. OF THE COUNTED).

## House rules (gates, not suggestions)

- No em dashes, no en dashes, no arrows in anything a person reads: labels, eggs, hints, comments. Commas and full stops.
- The artist is `MLow`. No real brand or studio logos, no real company names on signs, no actor likeness. People are
  NEW YORKERS: eye flower heads (`K.extra`) or the existing cast models.
- No new lights (`THREE.PointLight` etc.): every set is in one scene and lights cost every set. Use emissive materials,
  `glow` stickers and `K.glowTex` sprites for practicals.
- Budget: about 25 models per set at most, about 10 MB of new models loaded per set, triangles as the pass leaves them.
  A `tick` must be cheap and must only animate when its set is near (look at how the set's own ticks gate on the room).
- Never deploy, never push, never commit (the lead commits). Do not run `build.py` without `--out`.

## Your loop

```
python3 _build/devsite.py $SCR/site            # once, and again after new models, to link them in
python3 _build/build.py --js --out $SCR/site   # bundle your copy (fails loudly on a syntax error: fix it at once)
python3 _build/shot.py $SCR/shots a=room=<id> --site $SCR/site --http <yours> --port <yours> --wait 9
python3 _build/shot.py $SCR/shots b=room=<id> --site $SCR/site --http <yours> --port <yours> --wait 9 --eval "<move P and look>"
```

One set per shot.py run: a headless Chrome fails shader validation after about ten set loads. Look at every shot.
Console errors print at the end: there must be none from your code. `P.x`, `P.z`, `P.yaw`, `P.pitch` move the camera
(read `--eval` use in shot.py and the P object in main.js). Take at least the entrance view and a view from the rope
looking back for each set. Keep your batch file valid at every save: another builder's bundle imports it.

## Hand back

A short report: per set, what you added (hero edit named), what you swapped, the new egg id, and what you did not verify.
Leave previews in your scratch dir and say where.
