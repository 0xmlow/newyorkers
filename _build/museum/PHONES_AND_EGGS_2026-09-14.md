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
