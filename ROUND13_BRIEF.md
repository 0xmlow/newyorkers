# Round thirteen: every set much better, better illusions, better graphics

MLow asked (2026-10-11): "some of the rooms look kind of basic and can be spruced up. make every room much much
better and better optical illusions and better graphics. everything better and more impressive." The gallery also
has to keep loading on a phone, which it now does (lead fixed the engine, commit a44861c). Do not undo that.

## What the lead already changed in the engine (do not redo)

- Sets build lazily when you come near and far sets free their GPU memory. Everything you make must live in the
  set's group `g` (or in objects the set's code already owns). Never `c.scene.add` directly.
- A finishing pass now runs in every set: bloom on anything bright (threshold 0.66 after tone mapping), a vignette,
  edge fringing, light grain. A set can tune it through its own room object: `r.post = { ...r.post, bloom: 1.2, vig: 0.5, ca: 0.005 }`
  (also the old `sat`, `heat`, `grain`). Emissive materials and `toneMapped: false` colours above 1 now GLOW. Use it:
  neon, bulbs, marquees, screens, windows at night, candles, the moon.

## Where you work

- You own one file: `_build/src/up/cN.js`. It exports `PROPS`, `ROOM`, `SWAP` keyed by set id, exactly like the b files
  (read `_build/src/up/b1.js` for the shape and `UPGRADE_BRIEF_2026-10-10.md` for the PROPS row format, the kit `K`,
  the set geometry and the doors). Your `ROOM[id](c, r, g, X, K, mats)` runs LAST, after the set's own code and its b file.
- Edit nothing else. Seven other builders work at the same time. You may read `build.js`, `main.js`, `rooms.js`, the b files.
- You can change what earlier code made by finding it in `g` (`g.traverse`, match by material colour, geometry type,
  position or `userData`), e.g. swap a flat floor material for a better one, hide a crude box, re-tint a wall.
  Never break the set's existing trick or its eggs: read the set's code in build.js (search `id: (c, r, g` or the id)
  and its b file entry before touching anything.

## The bar, per set (every one of your sets, no skipping)

1. **A new or much stronger optical illusion**, that reads in the first ten seconds, true to the film. Not a toast: a
   thing you SEE. Catalogue to pick from (do not use the same one twice in your batch; vary them):
   reverspective (Patrick Hughes: a relief painted in reverse perspective that seems to turn as you walk),
   anamorphic floor or wall art that resolves from one marked spot, trompe l'oeil holes in the floor or a wall
   (a painted pit you can walk over), an infinity mirror or tunnel (stacked emissive frames, or a render target),
   an Ames window or Ames room, a Penrose triangle or impossible staircase that closes only from one point,
   a hollow mask that follows you, forced perspective doors or corridors, Beuchet chair (a giant and a chair line up),
   a portal window with true parallax into a scene that is not there, peripheral drift (rotating snakes) texture,
   cafe wall tiles, Ponzo rails, moire curtains that move as you walk, a Necker cube or Schroder stairs sign,
   shadows that do not match their objects, a figure that is two figures (ambiguous image) by distance,
   a dolly zoom, a slit scan, a rotating hollow face, a Pepper's ghost, an afterimage flag, a size constancy hallway.
   Gate any heavy work on the set being near (`Math.abs(ri - r.i) <= 1` in the tick's 4th argument).
2. **Graphics**: the set must look rich and lit, not grey boxes. Replace or dress any flat colour slab you find
   (floors, counters, walls) with real surfaces (`c.surf(name, rep, tint)` uses `assets/tex/<name>_{c,n,r}.jpg`, list
   that folder) or canvas textures with detail (tiles, wood grain, grime, posters, signage). Add practicals that glow
   (emissive + bloom), haze or light shafts (additive cones or planes with a soft gradient, depthWrite false), motion
   (steam, dust motes, flicker, rain or snow where the film has it, fans, signs blinking), and fill the middle of the
   floor and the ceiling. At least ten new visible things per set, layered near, middle, far and overhead.
3. **One new egg** (`c.egg('<id>_<thing>', line)` on a click), id prefixed with the set id. Lines short, MLow twist.

## Budgets (a phone must still run it)

- No new lights of any kind. Emissive, glow sprites, additive geometry only.
- `c.MOBILE` is true on phones: halve particle counts, skip render targets, keep canvas textures at 1024 px or less.
- Instanced meshes for anything repeated more than ~20 times. Merge static geometry where easy.
- Each tick cheap and gated on its set being near. No allocation inside ticks.
- Poly Haven only for new models (CC0): `PROP_TEX=512 python3 _build/polyhaven.py <id>`, at most 5 per batch.
  No AI generation, nothing that costs money, no Blender this round.
- **Disk is nearly full (about 2 GB free, shared by other sessions).** Keep your scratch under 150 MB, convert shots to
  small jpg and delete the png, never copy assets (devsite.py links them).

## House rules (gates)

No em dashes, en dashes or arrows in anything a person reads (labels, eggs, hints, comments). The artist is `MLow`.
No real brand or studio logos or real company names on signs; NEW YORKERS or MLow versions instead (N3W BELL, MLOW CAB CO.).
No actor likenesses: people are eye flower New Yorkers (`K.extra`) or existing cast models. Never deploy, push or commit.

## Your loop

```
SCR=<your scratch dir>; mkdir -p $SCR
python3 _build/devsite.py $SCR/site                       # once
python3 _build/build.py --js --out $SCR/site              # after every edit; fix syntax errors at once
python3 _build/shot.py $SCR/s a=room=<id> --site $SCR/site --http <port> --port <port> --wait 12
python3 _build/shot.py $SCR/s b=room=<id> --site $SCR/site --http <port> --port <port> --wait 12 --eval "__P.z=-5.5;__P.yaw=Math.PI;1"
python3 _build/shot.py $SCR/s m=room=<id> --site $SCR/site --http <port> --port <port> --wait 12 --mobile --w 390 --h 844
```

One set per shot.py run. LOOK at every shot (Read the image) and iterate until the set is clearly, visibly better
than its before shot. Console errors print at the end of each run: none may come from your code. Take a before shot
of every set first so you can compare. `__P` moves the camera (x 0 to 20 within the set is added to the set's x0;
`__P.x = __ROOMS[i].x0 + 10`), `__P.yaw`, `__P.pitch`.

## Hand back

Per set: the illusion added (and from where it reads), the graphics changes, the egg id, anything you could not
verify. Keep it short. Leave before/after jpgs in `$SCR/s` and say where.
