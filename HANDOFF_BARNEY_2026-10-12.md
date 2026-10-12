# Barney Greengrass room, 2026-10-12

Room 123 (`_build/museum/src/rooms/z.ts`, `barney`) was reworked in one pass: the layout now follows the
real shop, the dining room has its New Orleans wallpaper, and the merch MLow drew for the store hangs in the
front room, dithered and labelled, with Gary Greengrass's likeness corrected on the pieces MLow fixed in
ChatGPT that morning. Nothing was deployed.

## The likeness work and where it lives

MLow corrected Gary's likeness in ChatGPT (built in image edit, against `merch/_refs/people/gary_wsr_2024.jpg`).
ChatGPT worked in its downstream Codex copy and wrote to `~/.codex/.chatgpt-projects/g-p-6a6a.../outputs/`,
exactly the trap AGENTS.md warns about. Everything it produced is now filed in the collab kit:

- `BARNEY GREENGRASS COLLAB 2026-09-03/likeness_2026-10-12/corrected/` holds the seven edits that reached
  disk: merch 76, 79, 84, 85, 87, 89 and two versions of 117 (`_a` is the first, more photographic pass,
  `_b` is drawn in the cover's own painted medium; `_b` is the final).
- ChatGPT's own page claims ten (also 118, 120, 125 and 90). Those four never reached disk anywhere on this
  Mac. If MLow still has them in ChatGPT, download them into `corrected/` and rerun `barney_art.py`.
- `merch/_raw/<n>_<slug>_v3.png` is the corrected final of each, and `merch/LEDGER.json` carries `v3_file`,
  `v3_note`, the prior final as `v2_final`, and `final` now pointing at the v3.
- `likeness_2026-10-12/review/` is ChatGPT's fidelity review of the room and the model, kept for the record.
- `likeness_2026-10-12/finder-tags.json` is MLow's own pick of 43 merch graphics (his Finder tagged mock ups
  folder). That list is the hang.

## The room

Real layout, from two first hand accounts (Diner Theory's review and Gothamist), both saying the same thing:
you come in off Amsterdam Avenue to the deli case with the chalkboard behind it, a few small formica tables in
front of it, the bakery counter against the opposite wall, and the dining room through a little doorway on the
left, lined with the 1950s New Orleans wallpaper, green booths and chairs. No measured survey exists; nothing
here is a measurement. MLow's Blender model had the case on the partition and the shelves on the right wall,
so the front room was mirrored:

- `_build/museum/barney_mirror.py` rewrites `assets/museum/props/barney_greengrass.glb` in place: the case,
  its fish and jars, the chalkboards, the shelves and goods, the tables, chairs and plates swap sides; the two
  front tables stand before the case; the framed pictures and the Abloh print move to the far end of the right
  wall; the MLOW plaque goes to the back wall. The untouched model is kept at
  `BARNEY GREENGRASS COLLAB 2026-09-03/model/barney_greengrass_2026-09-13.glb`. The script refuses to run twice
  (a marker in the asset extras). To redo it, copy the kept model back and run it again.
- Traps found on the way: the model shares one index buffer between every box of the same shape, so a winding
  flip has to go on a private copy or it lands on every box that shares it (the script appends the copies). And the
  old "1.34 m below its own floor" in the room code was never geometry: it was the bounding box of a rotated lox
  slice. Baking that slice made the box exact, the kit stood the whole shop 1.8 m lower, and the case vanished
  under the floor until the prop line was changed to the sidewalk's real 0.12.
- `z.ts`: collision, keep outs, the counter line, the chalkboard spots and the FDR egg follow the mirror; the
  wall clock keeps New York time (it used to spin with animation time); the five census mounts that were on the
  right wall and the two on the back wall of the front room are gone, so the regulars now hang only in the
  dining room (14 mounts, audit clean).
- Wallpaper: `assets/museum/barney/wallpaper.jpg`, one panel painted on FLORA (Nano Banana Pro, $0.18, MLow's
  workspace, project "Barney Greengrass Merch Wave 2"), cropped free of its photographed edges, hung on the
  dining room's left wall, back wall and both halves of the partition with mirrored repeat so it never shows a
  seam, one printed panel about 3.4 m wide. The dining floor got a tan terrazzo over the model's boards.
- The merch: `_build/barney_art.py` dithers the 43 picks with the house recipe (`00_TOOLS/ditherlab`, fs32x2:
  OKLab Floyd Steinberg, 32 colours on a 2 px grid) to `assets/museum/barney/<n>.png` at 1024 wide, about
  100 KB each, and writes `src/rooms/barney_art.ts`. The room hangs them in walnut frames with a plate in the
  site's caption style (number, line, medium, "GARY, LIKENESS CORRECTED" where it applies). 22 slots exist:
  10 on the back wall of the front room, 8 behind the case under the chalkboards, 4 on the right wall past the
  case. The corrected pieces hang first, then the picks by number, so 21 of the 43 are on the walls and the
  rest are only in the kit. Phones hang the first 10. Rerun `barney_art.py` after any change to the picks or
  the corrected files, then `npm run build` in `_build/museum`.

## Verified, and not

- `npm run check`, `npm run build`, `node audit_rooms.mjs` (all rooms, barney 14 mounts, 0 unreachable),
  `preflight.py` "no problems", headless shots from eight viewpoints at 1600x900 and one phone shot.
- A freshly loaded room renders dark for a few seconds until every texture is in (44 more images than
  before); the headless shot tool catches that unless it waits on `kit.pending`. The browser pane could not
  confirm the lit state because it renders nothing while hidden.
- Not measured: whether the case really sits on the right as you enter. Two written accounts say so; no photo
  on this Mac settles it. If MLow knows otherwise, the swap is one script run away.
- Not done: booths along the dining room wall (the model has chairs there), the real tile pattern of the
  dining floor, the thumbnail poster for the museum menu (`build_room_thumbs.py` reads the 2026-09-13 export,
  which shows the old room), and the four likeness files that never reached disk.

## Round two, later the same day: the room made real

MLow asked for realistic bagels and lox, the price boards unblocked, better textures, his own characters as moving
people, and the walls laid out with the store's real signs and eggs. Done in `z.ts`, same room:

- **The price boards** were inside the dark panel after the mirror (the panel's inner face sat in front of the
  chalkboard planes). The three `chalk_*` nodes now sit at model x 5.55, in front of it; the GLB carries a second
  marker in its extras. Prices read from the counter.
- **Textures.** `retex()` in `z.ts` hangs the museum's CC0 photo surfaces (`assets/museum/surfaces`, the small
  `_s` set) on the model's flat materials by material name: terrazzo, planks, plaster, steel, marble, concrete,
  asphalt, brick, patina, with tint, roughness and normal strength per material and a repeat guessed from what the
  material covers. The table in `RETEX` is the place to tune. It also hides the model's crude fish boxes.
- **Food.** Budget ran out on FLORA (5 cents left on MLow's workspace, the partner workspace is dry, Krea is at
  zero), so the plan of Tripo models for every item became: one Trellis image to 3D bagel plate ($0.024,
  `assets/museum/props/barney_bagel.glb`, 25k triangles, on both front tables), three GPT Image concepts on white
  ($0.165, in the collab kit's `food_2026-10-12/`), two of them cut out as alpha cards for the case (whitefish on a
  CC0 Poly Haven cutting board, the sturgeon side on a tray, `assets/museum/barney/food_*.png`), CC0 Poly Haven
  croissants on the bakery shelf (`ph_croissant.glb`, `ph_wooden_cutting_board.glb`, 1k, packed from their glTF by
  hand, sources in the collab kit's `polyhaven_cc0/SOURCES.txt`), and procedural bagel toruses beside them. When
  credits return, Tripo image to 3D on the three concepts (about $0.36 each) replaces the cards.
- **People.** The capsule crowds inside are gone. Fourteen of MLow's ON LOCATION characters (`assets/movies/
  assets/glb`, copied to `assets/museum/props/npc_*.glb`, 12 MB) stand and walk: the bartender behind the case,
  the clerk at the register, Oscar and Felix at a table, the actress and the editor in the dining room, the cabbie
  and the hustler at the sidewalk tables; the wiseguy, the broker and the workgirl shuffle the queue along the case,
  the maitre works the doorway, Annie and Sonny go in and out and up the avenue. They are not rigged, so they glide
  with a small bob (`walk()` in `z.ts`); their fronts are along x, the `face` field turns each to +z for the rider.
  Phones load three standing people and none of the walkers. Each model is 1.5 times life, like the room.
- **Signs**, all `k.sign` in the store's cream and deli red: CASH ONLY · NO RESERVATIONS over the door, the hours on
  the door glass (readable from the street, mirrored from inside, as a real door sign is), TAKE A NUMBER by the
  register, the James Beard plate by the dining doorway, MOE'S CHACHKAS over the merch wall, and a LIGHTS, CAMERA,
  STURGEON plate of the films shot in the room over the dining room's back wall.
- **Eggs**, ten new on top of the five (15 landmarks): Hitchcock's ten pounds and the Strasberg and Lansky order,
  fish straight from the smokers, the FedEx man before Yom Kippur, 550 doorsteps, Moe and the Knicks tee, the
  wallpaper's three painters, No. 541, the Beard medal, the stock room front room, take a number. Sources are West
  Side Rag 2024, Diner Theory, Wikipedia, the store's history page and n3wyorkers.com/n/541.
- **Walls.** Eighteen small frames in two rows on the panel behind the case under the boards (no plates, too
  tight), ten with plates on the back wall under the MOE'S CHACHKAS sign, four with plates on the right wall past
  the case: 32 of the 43 picks hang, the corrected likeness pieces first.

Verified: typecheck, bundle, all rooms audit, headless shots at 1 pm from thirteen viewpoints and a phone. Not
measured: frame rate on a phone with the heavier room (about 2.2 million triangles on a desktop load, 1.3 on a
phone load); the walkers' feet are 3 cm above the floor at the top of the bob by design.

## Round three, the same evening: prices, the register, bagels everywhere, the logo, three illusions

- **The price boards** are drawn in the room now (`BOARDS` and `board()` in `z.ts`), not the model's images: SMOKED FISH
  by the quarter pound, APPETIZING (herring, salads, spreads, bagels and bialys), SANDWICHES. The model's boards priced
  caviar by the ounce; these are prices a person pays at the counter in 2026, the sandwich line anchored on the
  dossier's known ones (sturgeon 25, sturgeon and sable 30, Triple Decker No. 3 29.50, open face add 2.50). glTF
  textures map with flipY off, so the canvas texture must too, or the board hangs upside down.
- **The register** is Poly Haven's CashRegister_01 (CC0, the uncompressed pass from the ON LOCATION kit, since the museum
  loader has no Draco), on the case at the door end, the clerk behind it, a CASH ONLY tent card on the counter, a red
  CASH ONLY sign over the register and the TAKE A NUMBER beside it.
- **A bagel and lox on every table**: eighteen, the five in the front room, the eight in the dining room, the five on the
  sidewalk, each a copy of the Trellis plate turned a little. Phones get four.
- **The BG logo** on the back wall moved to model x 1.133 (world 1.7), the centre of the merch wall; the upper row now
  sits two either side of it. The GLB extras carry a third marker, `logo`.
- **Three illusions.** The Sturgeon King painted on the front room floor, stretched from the gold ring just inside the
  door so he stands upright in the aisle from that one spot (`eye` in `z.ts`; the picture is a cut of merch 84,
  `assets/museum/barney/king_cutout.png`, kept on its red card, which reads as a poster standing in the room). The
  picture's top must stay under about 1.3 m or its projection runs past the back wall. An infinity mirror in a hollow
  walnut shadow box on the dining room's left wall between two of the regulars, nine gold frames fading into the wall.
  Cafe wall tiles along the foot of the shelves and the case. Two eggs for the first two: 17 landmarks.
- **GitHub**: `barney-greengrass` carries the room; `_build/push_museum_branch.sh` refreshes the public `Museum`
  snapshot from the working tree through a temporary index (it keeps the atlases the old snapshot shipped, adds every
  tracked file, drops nothing by hand, and never force pushes).

## Round four, late evening: what the live site was not showing, and the bagel wall

MLow reported the plates, the lox in the case and the register missing on the live site. A headless load of the live
room found all three in the scene, and two real faults behind what he saw:

- **The case glass was opaque.** The model's `glass` material carries its alpha in the colour factor with no alpha
  mode, so three.js drew it solid and nothing inside the case could be seen, cards or plates. `GLASSY` in `z.ts` now
  sets transparent and opacity by material name (glass, glass_cup, curtain).
- **The Trellis bagel rendered black.** The mesh had positions and UVs but no normals. A normal accessor is now
  computed into `barney_bagel.glb` from its triangles.
- The register was there all along. A museum page in a browser is cached for four hours (the Cloudflare floor), so a
  tab opened earlier in the day keeps the old bundle until a hard refresh.

Added: four plates of lox on the case deck beside the cut outs, plates on the tables grown to 0.3, and **the bagel
wall**: a walnut rack of eighteen cubbies standing proud of the bakery shelves, each heaped with eleven bagels, four
kinds (everything, sesame, plain, pumpernickel), every bagel a torus wearing a crust painted on a canvas (`crust()` in
`z.ts`: golden base, darker bloom, blistered skin, sesame and poppy and onion drawn one by one, a bump from the same
canvas), one instanced draw call per kind, 198 bagels. Price tags on every cubby, 2.50, the same as the board. The
rack's back hides the model's dry goods behind it; the goods either side stay.
