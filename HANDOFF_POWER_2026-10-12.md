# Power: why the site no longer turns fans into a jet engine (2026-10-12)

A visitor wrote: "visited your site and my cooling fans went full jet engine mode." Measured, the causes were:

- Every walkable gallery drew a frame on every display refresh (120 a second on a ProMotion or 144 Hz screen), at up
  to two device pixels (four times the pixels of 1x), with bloom chains, forever, whether or not anyone touched
  anything, and kept going when the window was behind another.
- The home page, with no WebGL at all, scaled a full screen hero image forever under a sticky nav with an 18 px
  backdrop blur, so the blur was recomputed every frame at 2x, plus bobbing sprites with drop shadows.

## The policy, the same in every engine

`POWER` in each engine (`window.__POWER`, `window.__powerBudget()` where exposed):

- At most 60 frames a second (budget 15.5 ms between draws).
- 30 a second once nothing has been touched for twenty seconds (keys, mouse, touch, wheel, a gamepad). ON LOCATION
  counts skating and rides as touching, the museum counts the tour and a walk to a goal.
- About six a second while the window is not the one in front (`blur`/`focus`).
- Pixel ratio capped at 1.5 everywhere (was 2 in ON LOCATION, THE MARKS night, the airport and the spiral, 1.75 in the
  museum high path, the island and the basement). The museum's self measuring (post chain and low path pixel ratio)
  only samples full speed frames, so an idle 30 fps never reads as a slow machine.

Everything in these engines moves on dt, so the throttle changes heat, not behaviour.

Measured headless (60 Hz rAF): active 60, idle 30, blurred 6, in ON LOCATION and the museum.

Where it lives: `ON LOCATION 2026-10-10/_build/src/main.js`, `_build/museum/src/main.ts`, `THE MARKS GALLERY
2026-10-09/_build/src/main.js`, `MEME ISLAND 2026-10-07/_build/island.html`, `YOUR MOMS BASEMENT 2026-10-08/_build/
systems.js` and `engine.js`, `MLOW INTERNATIONAL WALK 2026-10-09/site/main.js`, `SKELLY SPIRAL 2026-10-11/site/
index.html`. Each gallery is rebuilt by its own build.py (the airport and the spiral have none) and then
`build_galleries.py` copies site/ in.

## The home page

- `.welcome::before` (home.css): the hero drift runs twice (52 s) and settles, instead of forever.
- `body.still` (site.js, the block at the end): the drift, the sprites, the pigeon and the marquees pause while the hero
  is off screen, the tab is hidden, or the window is not in front.
- `#nav` (site.css): backdrop blur 18 px to 12 px, background a touch more opaque to make up for it.

## Not done

- A visible FPS or "low power" switch for visitors. The throttle is automatic only.
- `prefers-reduced-motion` already stops the marquee, the drift and the pigeon; the galleries do not read it.
