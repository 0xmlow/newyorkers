# Handoff: room 181, `crystalpalace`, THE GLASS HOUSE (2026-10-03)

The New York Crystal Palace of 1853, the iron and glass hall of the Exhibition of the Industry
of All Nations in Reservoir Square (now Bryant Park), which burned on October 5, 1858. Built in
`_build/museum/src/rooms/v24.ts`, registered in `v0.ts`, curated in `src/data.ts`, the check
scripts assert 181. Nothing deployed.

Made with the room 180 pipeline: FLORA project `prj_ns794q28b3vft0kgxpryfed43x8fjecd` on the
Creative Partner workspace. Concepts, raw and passed props, the figure sheets and every
headless shot are in `../CRYSTAL PALACE 2026-10-02/` (run ids in `RUNS.txt`).

## Frame and plan

+z is west (Sixth Avenue, the spawn), -z east (the reservoir), +x north (42nd Street, the
Latting Observatory), -x south. Arms are 24 m wide and run 50 m from the centre; nave half
width 6.25, vault springing 13, dome springing 21, dome radius 15.25 (100 feet).

- West arm, entrance: six red damask screens on the nave, a veiled marble figure, vitrines and
  palms in the aisles. The one door is in the west end wall.
- Crossing: the stained glass dome (planar projected rosette, `dome.jpg`), 16 columns, four
  diagonal screens, the Otis platform in the middle.
- South arm, salon: four screens, the iron fountain with a point cloud of water, the big work on
  the damask end wall.
- East arm, industry: four green board screens, two works on the end wall, the beam engine with
  a procedural flywheel turning, the press and the globe in the aisles.
- North arm, 1858: four screens in the calm half, a rope at x 32.6, then the fire: flames
  (crossed additive quads, 120), embers and smoke (Points), glowing iron ribs and posts, charred
  gallery decks, falling panes, and 320 glitch quads where the vault glass was. Blocked past
  the rope.
- Outside: lawn and trees in the courtyards (seen through glass, blocked), Sixth Avenue with
  three moving carriages and one parked, houses across it, gas lamps, the Latting Observatory
  (one instanced draw of timber bars, 140 lanterns), the reservoir wall with its Egyptian gate
  and promenade walkers.

## Interactions

- **The Otis platform.** Stand on the deck for 1.6 s: it rises 13 s to 22.5 m, holds, the rope
  is cut, it drops 0.75 m, the pawls swing out, a caption says ALL SAFE, then it comes down in
  11 s. `floorY` returns the deck height inside the deck, and the tick keeps a rider on the
  deck while it is up. The caption is a DOM element removed when the kit changes.
- **The dome finds the work.** Stand still 1.2 s within 7 m in front of any work: an additive
  plane with the dome texture drifts across the picture at 0.24 opacity. It is placed at the art
  mesh's own world position, because the picture stands proud of the mount.

## Real New York time

Sun, the coloured pool the dome throws (offset by the sun, clamped to 13 m), a faint shaft,
the glazing bar shadows on the arm floors, gaslight. After dark the glass texture swaps to iron
silhouette bars and warm panes, so the house reads as a lantern.

## Numbers (whole frame overlay, headless, desktop)

Calls 709 at the spawn (outside, looking at the whole facade), 315 to 495 inside; 780k to 1.08M
triangles. Started at 1435: the screens were groups of six meshes each, now static boxes turned
to their angle so the batch merges them, and hung works, frames and props stop casting sun
shadows after 1.5 s.

## Spend on FLORA, settled

8 GPT Image 2.5 Sunburst concepts at 2K, $0.139 each ($1.11); 5 Nano Banana Pro textures $0.90;
2 GPT figure sheets $0.26; 11 Tripo H3.1 props $2.64. **$4.91.** The easel prop is unused.

## Not verified

- Nobody has walked it in a live browser; all views are headless shots with `--at`.
- The Otis ride was seen once, headless, from the deck; walking onto the deck by hand, walking
  off at the top (the tick should stop you) and the ride with a guided tour running are untested.
- Phones (the `low` quality path halves particles and flames) and frame rate were not checked.
- The carriages' facing: a horse might be pulling backwards on one direction.
- `build_all.sh` was not run; the bundle, `museum.html` and `rooms.json` were built and committed
  by hand. `new-rooms.html` was left to `build_all.sh`, which reformats it. Room thumbnail
  (`assets/museum/rooms/` is gitignored) cut from `MUSEUM EXPORTS/2026-10-03/`.
- The museum wide audit reports 163 unreachable and 130 backwards; HEAD before this room
  reported the same, so they are not from this room. Room 181 alone: 25 mounts, 0 and 0.
