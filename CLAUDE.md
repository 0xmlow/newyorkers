# BIGGER ON THE INSIDE: rules for any agent

Read `START-HERE.md`, then `docs/HANDOFF.md`. Skills for this work ship in `.claude/skills/`:
`virtual-gallery-architect` (read `references/online-only-illusions.md` before touching a portal, the stair, the
Ames room or the roll) and `apply-mlow-impermanent-vision` (the style, applied to architecture, never to the art).

## House rules (NEW YORKERS)
- No em dashes, no en dashes, no arrows in anything a person reads, commit messages included.
- The artist is `MLow`. Art, not an investment. Never a supply total. Nothing "confirmed" or "final".
- Collection art is unlit, white, sRGB, aspect correct: never tinted, displaced, cropped or repainted. Posters and
  stickers are MLow's own: paste them, curl them, never recolour them. (The Ames room warps the wall the art hangs
  on so it reads true from the peephole; the card always shows the original.)
- Never deploy. Building is fine.

## Code map
- `src/main.ts` the world: renderer, post (GTAO, bloom, grade), rooms, portals and crossing, walking, UI, POWER throttle.
- `src/core/` `assets.ts` loaders and caches; `kit.ts` metric UV geometry, signs, walkable floors, `batchStatic`;
  `portal.ts` live portals; `interior.ts` interior mapped windows; `plate.ts` depth plates; `wet.ts` the wet street;
  `mlow.ts` contour field, drips, Eye Flower; `sky.ts` the night; `hang.ts` art, posters, stickers; `room.ts` the
  Room contract and the room origins (1 km apart, one visible at a time).
- `src/rooms/` one file per room, `index.ts` lists builders and every doorway (LINKS).
- `tools/` `make_assets.py` (art by room, posters, stickers, GLBs, textures, plates, depth), `concepts.py` and
  `imagegen.sh` (every ImageGen prompt), `shot.sh`, `review.sh`, `stills.sh` (headless stills on the GPU).
- `public/` everything the page loads; `concepts/` and `plates/` the ImageGen sources.

## Traps already hit
- A doorway is a portal: anything hanging in it (paint drips) shows on the far side too. Keep geometry off apertures.
- Walkable floors are rectangles; your footprint must lie in their union (`walkable`), so doorway rectangles must
  reach past the door plane. Test every door with `inside.advance`.
- Moving things must set `userData.dynamic = true` or `batchStatic` will freeze them into a merged mesh.
- Transparent things are hidden from the AO pass (main.ts); a new effect that is see through needs `transparent: true`.
- Indoors set `env` low: the HDRI is a lit city skyline and shows up as haze on metal and glossy floors.
- The browser preview server cannot read the Desktop: stage `site/` into a scratch folder (APFS `cp -c`).
