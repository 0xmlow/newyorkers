# Handoff: DEPARTMENT OF UNREAL ESTATE at /unreal (2026-10-17)

MLow built this venue in ChatGPT on 2026-10-16 (venue `unreal` in the Vinext app, shipped to him inside
`NEW-YORKERS-MELT-CITY-Source.zip` on the Desktop). ChatGPT never saw it in a browser. Claude Code opened it,
found three faults, fixed them and ported the venue to its own walk repo. The twelfth gallery in `build_galleries.py`.
Nav: MORE, line N. Footer: The census column. GitHub branch `unreal-estate` pushed 2026-10-17 as a single snapshot commit (a4f27fec); update it with a commit on top, never a force push.

## What it is

Vite + TypeScript + three.js 0.185, built to `site/` (index.html, js/, art/, fonts/, shots/, art.json).
Walk repo (source of truth): `../UNREAL ESTATE WALK 2026-10-17/`. Edit there, `npm run build`, commit, rerun
`build_galleries.py`. Do not edit the ChatGPT copy in `~/.codex/.chatgpt-projects/`.

- `src/soho.ts`, `src/unreal.ts`, `src/architecture/primitives.ts`: ChatGPT's loft shell, installations and helpers.
- `src/bagel.ts`: the everything bagel (new).
- `src/main.ts`: the controller: walk, drag look, click the floor to go there, click art for its card, four viewpoints,
  four sets of twelve, POWER throttle, `window.unreal` (`go`, `jump`, `focus`, `set`), `?shot=N` for stills.
- `tools/make_art.py`: the 48 New Yorkers by set (the listing, the move, the building, the unreal), from `assets/data.js`.
- `tools/shots.sh`: the five stills in `public/shots/`, headless Chrome on the GPU (serve `site/` on 5189 first).

## The three fixes

1. The bagel was a chrome donut that looked melted. Now a baked everything bagel: squat lumpy torus, crust map
   painted in code, egg wash clearcoat, five instanced toppings seated on the surface normal. It turns slowly.
2. The Commute viewpoint put the camera 0.9 m from a painting, and the slats sat in a wall recess visible from a
   sliver of the room. Now a screen on the back wall behind the bench, two pitches over a lit acid backing.
3. The phone layout overlapped. New interface: compact header, viewpoints as one scrolling row, art strip below.

## Not verified

- Not walked end to end by a person; views checked in the app's browser pane and headless Chrome on this Mac.
- Not tried on a real phone (390 px emulation only). The bagel's clearcoat and transmission salt on mobile GPUs untested.
- Not deployed.
