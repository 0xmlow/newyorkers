# Phones and landmark eggs, 14 September 2026

MLow asked for the new galleries to work on phones, carry more easter eggs that highlight real
New York landmarks, and be more detailed and animated. This note covers the engine side. The
room side (rooms 112 to 136) is in the room files themselves.

## Phones

- **Thumb stick** (`#stick`, `bindStick()` in main.ts) replaces the four button pad. It is analog:
  how far you push is how fast you walk, a full push runs at 1.3x. It owns its own pointer, so the
  other thumb can look around at the same time.
- **One finger looks.** The canvas tracks a single pointer id; a second finger no longer makes the
  view jump.
- **Tap the floor to walk there** (`tap()` and `walkTo()`). The first thing the tap ray meets decides
  what a tap means: an egg, a work, or the floor. Anything else in front swallows the tap, which is
  what stops an egg being found through a wall. Glass, washes, glints and particles are ignored.
  A spot you could never stand on is pulled back toward you until you could. A cyan ring marks the
  destination. `tap()` returns a reason string (`walk`, `egg <id>`, `blocked by ...`), handy in the
  console via `__museum.tap(0, -0.7)`.
- **Memory.** On the low path (touch and under 900 px wide, or four cores or fewer) procedural
  surfaces paint at half size, and after each room the texture cache and the atlas cache drop
  everything the room did not use (`textureBudget`, `beginRoom`, `trimCache` in textures.ts,
  `trimAtlases` in data.ts). iOS Safari refuses new canvases past about 384 MB, which reads as a
  room that never finishes building. `Kit.dispose()` now frees every texture slot, not only `map`.
- **Dynamic resolution.** The low path steps its pixel ratio down (1.2 to 1.0 to 0.8 at most) when a
  room cannot hold about 30 fps, and never steps back up.
- **Lost context.** If iOS drops the WebGL context the page says so and offers a rebuild (`#lost`).
- **Safe areas and landscape.** `viewport-fit=cover`, `env(safe-area-inset-*)` on the HUD, the bar
  and the stick; a `max-height:500px` landscape layout; no double tap zoom on buttons; no pinch zoom
  of the page. Fullscreen is hidden where the browser has none (iPhone).

## Landmark eggs

```ts
k.egg(objectOrPoint, { id, title, text, clue, year?, source: { name, url }, room? }, { r?, glint? })
```

- An object is pulled out of the static merge so it keeps its identity; a point gets an invisible
  tap sphere of radius `r`. Place the object before calling; the sphere is sized from its box then.
- Each unfound egg carries a pulsing glint sprite. Found eggs stop glinting. Glints are hidden for
  poster and GLB exports.
- Found eggs are stored in `localStorage.ny_landmarks` as `<room>:<id>`, apart from the site eggs
  (`ny_eggs`) so the site hunt keeps its count. The HUD chip shows found of total in the room; the
  panel lists found eggs and clues for the rest, with WALK ME CLOSER.
- The card links the source the fact was checked on, and offers a walk to another room when `room`
  is set. Every fact must be checked before it ships; drop anything that cannot be.

## Testing

- `python3 shot_room.py <id> out.png --tag <t> --mobile` emulates a 390 x 844 touch phone at 3x
  (the page takes its low path, so the debug `calls` figure is the real draw call count);
  add `--landscape` for 844 x 390. The report now lists the egg ids that registered.
- The native iOS Simulator needs `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
  on this Mac first; until then phone checks are Chrome emulation, not real WebKit.

## The rooms, and what the work turned up

All 25 rooms (112 to 136) now carry 4 to 7 landmark eggs each, 135 in all, every one checked
against a named source, plus new detail and at least three moving things. Phone draw calls run
52 to 183. Five builders worked in parallel, one per room file (x1, x2, y1, y2, y3 with z).

Corrections found on the way:
- Steam: Con Edison was formed in 1936 but acquired the New York Steam Company in 1954. The room
  fact no longer gives a date (`_build/learn` is gitignored, so that edit lives on disk only).
- Paley Park has seventeen honey locusts, not twelve. Room 130 is renamed.
- Greenacre was mirrored against TCLF's plan and now matches it.
- Kings foyer: the stair lintel moulding ran down the foyer as a black beam because
  `kit.moulding` extrudes along z at rotY 0. A cornice along a facade needs `±PI/2`.
- The steamworks stack stood about 80 m underground.

Traps:
- **The Browser pane pauses rendering while it is hidden.** Matrices go stale and CSS transitions
  freeze, so a probe there reports objects at the origin and panels half open. Probe in headless
  Chrome instead: `shot_room.py --eval "<js>"` runs a script after load; `--egg <id>` walks to an
  egg. `--turn` never worked (the loop rebuilds rotation from its own yaw).
- The GTAO pass hid points and lines but not sprites, so glints printed black squares on the
  desktop path. fx.ts now hides sprites too.
- build_deploy.py copied `assets/museum` whole, shipping every preview bundle build_variant.mjs
  left behind (47 MB; `museum.a.js` was live). It now ignores `museum.*.js`.
- One builder's duplicate `const` stopped esbuild for everyone: keep a room file compiling
  between edits when others share the bundle.
