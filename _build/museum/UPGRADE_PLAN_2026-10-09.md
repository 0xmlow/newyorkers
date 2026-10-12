# The museum upgrade plan, 2026-10-09

MLow, after the hero GLBs went live: plan the next upgrades like that one, make the textures
better, make every place look more like the real place (layout, configuration, easter eggs from
the real place), make every tree look real, and upgrade everything in every gallery.

This plan sits on top of `ROOM_UPGRADE_GUIDE_2026-09-23.md` (the room standard) and
`PHOTOREALISM_SCOPE_2026-09-08.md` (the render work). It does not replace them.

## Where the museum stands (survey, 2026-10-09)

| | Now | Why it reads as fake |
|---|---|---|
| Trees | 89 of 183 rooms; every tree is 4 or 5 jittered icosahedron blobs in a flat leaf colour (`kit.ts:691`), not instanced | No leaves, no branches, no species. The single biggest tell, and it is in half the museum |
| Surfaces | 179 rooms are procedural 512 px canvases (brick, ashlar, tile, marble...) with generated normal and roughness | Clean, repeating, the same brick in Harlem and in DUMBO. Only 4 rooms use photo materials |
| Sky and light | canvas sky as the environment map, one sun, AO and bloom on desktop | No real sky light, so metal and glass reflect a painting |
| Props | 109 GLBs; 52 rooms have none; 13 rooms have AI hero props | Box built centrepieces in most rooms |
| Eggs | 458 in all; rooms 112 to 183 have 5 to 8 each; **101 rooms (the original 1 to 111) have zero** | Half the museum has nothing to find |
| Accuracy | rooms 1 to 111 were drawn from memory in a day each; 10 have been rebuilt to plan | Layouts and orientations were never checked against the real place |

## The work, in the order that lifts the most for the least

### 1. Real trees, engine wide (one change, 89 rooms)

Replace the blob canopy in `k.tree` with real trees, keeping its signature so no room code has to
change on day one.

- **A species kit of about 12 New York street and park trees**, built in Blender from code (trunk
  and branch skeleton, then alpha tested leaf cards), not text to 3D: Tripo and the like return
  trees as solid lumps. Species: London plane (the city's tree), honey locust, pin oak, little leaf
  linden, American elm (the Mall), ginkgo, Callery pear, Norway maple, Kanzan cherry, weeping
  willow, eastern white pine, and a bare winter form of each for the night and winter rooms. Palms
  stay for the interiors.
- **Leaf cards painted from photographs**: one leaf cluster atlas per species (FLORA, a cluster on
  black with alpha, 2048), plus a bark set per species (colour, normal, roughness).
- **Instanced and swaying**: one InstancedMesh per species per room (draw calls fall, not rise),
  wind in the vertex shader, three levels of detail with a billboard impostor past about 60 m.
- **Species per room** from the real place: `k.tree(x, z, { species: 'plane' })`, with today's
  `kind` mapped to a sensible default so every room upgrades at once, then a pass that names the
  real species (London planes in Bryant Park and Washington Square, elms on the Mall, honey locusts
  in Paley and Greenacre, Kanzan in the Esplanade).
- Budget: about 6k triangles per tree near, 600 far, a quad past 60 m. The phone path gets the far
  levels only.

### 2. Better surfaces, engine wide

- **Photo PBR material library**: about 40 New York materials as tiling photo sets (colour, normal,
  roughness), the way room 183 does it. Brownstone, Manhattan schist, Indiana limestone ashlar,
  Guastavino tile, white subway tile with real grout, Belgian block, bluestone flags, hex pavers,
  granite curb, patched asphalt with a manhole, cast iron in park green, oxidised copper, terrazzo,
  Carrara and Tennessee marble, oak parquet, cork, glazed terracotta, red common brick in three
  ages, painted tin ceiling, and so on. Made on FLORA as seamless squares, normal and roughness
  derived locally, about $0.15 a material.
- `k.pbr` gets a `photo` path: a room asks for `brownstone` and gets the photo set where it exists,
  the procedural one where it does not. Every room upgrades the moment a material lands.
- **Resolution**: 1024 on desktop for the procedural set (512 stays on phones).
- **Grime and wear decals**: drip stains under sills, gum on pavements, salt line on stoops, rust
  under fire escapes. Ten decal sheets used everywhere.
- **Real skies**: CC0 HDRIs (Poly Haven) as the environment map behind the painted sky, chosen by
  the room's hour and weather, so glass, water, brass and steel reflect a real sky.
- **Facade photo textures** for the far buildings that only need to read from a distance (lit
  windows, cornices), instead of the windows texture on a box.

### 3. Truth pass, room by room: layout and configuration

Each room gets a fact sheet before anyone touches it, the way the honorary likeness work goes:
reference beside output.

- **Plan**: footprint, dimensions and orientation from sources (Landmarks Preservation Commission
  designation reports, NYC Open Data building footprints, Wikipedia figures, published plans).
- **Reference photos**: six real views of the place, matched by headless shots from the same spots
  (`shot_room.py --at`), placed side by side. Anything that is in the wrong place, the wrong
  number, the wrong way round or the wrong colour is logged and fixed.
- **Configuration**: the real counts (columns, arches, benches, lamps, windows, steps), the real
  materials, the real signage where the house rules allow it.
- Output: `facts/<room>.md` with the sources, the plan, the six comparison pairs and the fix list.

### 4. Easter eggs from the real place (101 rooms at zero)

Five to six sourced eggs per room, to the standard rooms 112 to 183 already meet: something real,
documented, and findable, with a clue. Examples of the kind:

- Grand Central: the dark patch near the crab on the ceiling, left uncleaned in the 1990s
  restoration; the zodiac painted back to front; the whispering gallery outside the Oyster Bar.
- Times Square: Max Neuhaus's sound piece under the subway grate on the Broadway island between
  45th and 46th, a hum you hear and cannot see.
- Washington Square: the Hangman's Elm in the north west corner.
- Chrysler Building: the steel eagles on the 61st floor.
- Brooklyn Bridge: the Cold War supplies found in the anchorage in 2006.
- Flatiron: the narrow tip of the building at the point where Broadway crosses Fifth.

Eggs are text and placement, so they run in parallel and cheaply. Every egg carries a source URL,
checked, as today.

### 5. A hero in every room

The pipeline from today (concept, Tripo, `prop_pass`, top and front orient check, `heroes.ts`
swap) run across the museum, 52 rooms with no GLB first. One to three heroes per room: the thing
the place is known for (the Bethesda angel as a plain bronze form, the Oyster Bar's Guastavino
vault is a material not a model, the Cyclone car, the Intrepid's aircraft, the Wollman Zamboni,
the Rucker hoop). Turned into `tools/hero.py` so one command goes from a prompt to a placed,
orient checked GLB with its contact sheet.

### 6. Rebuild the weakest rooms to the standard

The upgrade guide's groups still stand: C (the plain corridor rooms 1 to 21), A (about 33 facade
rooms), B (about 22 empty plains). Steps 1 to 5 lift every room; this step rebuilds the ones that
are wrong in plan, worst first, in batches of ten with five builders in parallel, one agent per
file.

### 7. The other galleries

MEME ISLAND and YOUR MOM'S BASEMENT are separate engines (r128). They take the tree kit and the
material library once steps 1 and 2 exist; they are scheduled after the museum, not before.

## Order, cost and what MLow sees

| Step | What changes on the site | Rough cost | Ships as |
|---|---|---|---|
| 0 Tooling | nothing visible: `tools/hero.py`, the material script, the side by side comparer | agent time | commit |
| 1 Trees | 89 rooms at once | about $5 of leaf and bark plates | one deploy, after shots of 10 rooms |
| 2 Surfaces and skies | every room | about $8 for 40 materials, HDRIs free | one deploy |
| 3 and 4 Truth and eggs | rooms 1 to 111, ten at a time | agent time | a deploy per ten rooms |
| 5 Heroes | every room, 52 bare ones first | about $0.80 a hero, $150 to $250 for all | a deploy per batch |
| 6 Rebuilds | groups C, A, B | agent time | a deploy per batch |
| 7 Other galleries | island, basement | small | after the museum |

Every batch ends the same way: typecheck, bundle, `audit_rooms.mjs` with the same or better counts,
preflight clean, headless shots at desktop and phone, the overlay numbers (calls and triangles)
before and after, and the shots in front of MLow before deploy.

## Guard rails

- Performance: a room stays under about 600 draw calls and 1M triangles on the desktop overlay,
  and the phone path is measured, not assumed. Trees and heroes come in instanced.
- No likeness of a real person in any model (faceless bronzes, as in Union Square).
- Brand rules on every egg and caption: no dashes, MLow by that name, nothing confirmed or final.
- FLORA's Creative Partner workspace is down to about $0.60; MLow's own has about $2.55. Steps 1,
  2 and 5 need money on one of them or on Krea.

## Decisions for MLow

1. Budget for steps 1, 2 and 5, and which account pays.
2. Rooms 1 to 111: fix in place (steps 1 to 5) or rebuild the worst to plan (step 6) as well.
3. Deploy each batch as it lands, or hold for one big reveal.

## Step 1 done: the tree kit (2026-10-09)

- **Twelve species** in `assets/museum/trees/tree_<species>.glb`: plane, elm, locust, oak, linden,
  ginkgo, maple, cherry, pear, willow, pine, palm. Two variants each, a near and a far version.
  Built by `blender/build_tree_kit.py` from code (trunk and branch skeletons), with Poly Haven CC0
  bark (`bark_platanus` for the plane, zelkova for the elm, sakura for the cherry...) and one leaf
  spray card per species from Krea (GPT Image 2.5 Flare, transparent). Sources and job ids in
  `../MUSEUM TREES 2026-10-09/SOURCES.txt`. Krea spend: 13 images.
- **Engine**: `k.tree` keeps its signature and gains `species`. It queues trees and `plantSpecies`
  instances each species in one go, alpha tested leaves, wind in the vertex shader, near version
  inside 26 m and the far one beyond (far trees cast no shadow), phones get the far version only.
  The room's `leaf` colour is kept: greens nudge the photo, autumn and red colours recolour it by
  brightness. Rooms that name no species get a street mix by seed (plane, linden, locust, oak).
  `?trees=old` brings back the blob trees; a failed load falls back to them per species.
- Four Freedoms' 120 lindens and the Esplanade's 76 Kanzan now come from the kit (old code behind
  `KIT_TREES` and `KIT_CHERRY`).
- **Cost**, same view and settings: Bow Bridge 362 calls and 398k triangles against 299 and 260k
  with the old trees; phones 112 calls and 313k against 99 and 117k. The Esplanade reads 1.25M
  triangles and Four Freedoms 946k, the heaviest two.
- **Left**: the 260 far canopy blobs over Brooklyn Bridge Park in `brooklyn` (b.ts) need an
  impostor level before they can be real trees; naming the real species room by room (step 3);
  winter rooms still use the `bare` form of a street species, not a proper winter tree.

## Step 2 done: photo surfaces, real skies, New York time, MLow cabs (2026-10-09)

- **Photo surfaces**: 14 Poly Haven CC0 sets in `assets/museum/surfaces` (brick, ashlar, planks,
  plaster, pavers, steel, concrete, grass, marble, asphalt, cobble, patina, terrazzo, boardwalk), 1k for
  desktop and 512 for phones, colour normalised to a neutral mean so each room's own tint still drives
  the hue. Every painter in `textures.ts` now tags its surface with `kind` and `tint`; `k.pbr` swaps in
  the photo set of the same kind, with a repeat that matches one procedural tile (12 brick courses...).
  Picks in `../MUSEUM MATERIALS 2026-10-09/picks.txt`. `?surfaces=old` shows the painted canvases.
  Left painted on purpose: subway tile (the photo's tiles were slivers), velvet, gilt, carpet, minton.
- **New York time in every room** (MLow: everything follows the clock, the night events included).
  `nycSun` computes the real sun over Manhattan from the date and hour (checked: sunrise about 7:05 and
  sunset about 6:25 on Oct 9, 72.7 degrees at the June solstice). Night and golden hour come from the
  sun's elevation, not fixed hours; each room's sun keeps its compass bearing and takes the real height
  (long low shadows at golden hour). Rooms painted at night (Dyker Heights, the Vanguard, Halloween)
  get a real day palette and an automatic sun by day and return to their painted night after dark.
  Street lamps (`k.lamp`) are off by day and on from dusk. The room re-times every two minutes while
  open. `?hour=` and `?fixed` still pin it.
- **Real sky light**: three Poly Haven CC0 HDRIs (`assets/museum/hdri`: Potsdamer Platz by day, Venice
  sunset, Shanghai Bund by night) light reflections for the time of day; the painted dome stays the
  visible sky. Bloom fades to a fifth at night: lit windows had fogged every night scene orange
  (that haze was already live before today).
- **MLow cabs**: `h_taxi.glb` (Tripo on Krea from MLow's own RAV4 cab photo, `mockup_taxi_2_logo.jpg`)
  with the MLOW topper cut from `MLow Taxi Specs.png` (`assets/museum/taxi/topper.jpg`): the logo and
  the painting alternate every seven seconds. The kit finds every yellow, car sized vehicle a room
  draws (about a dozen traffic helpers, instanced or not), collapses it each frame and drives an
  instanced taxi on the same path, facing the way it moves. `?cabs=old` shows the boxes.
- **Not verified**: a phone; the live re-timing over a real hour (tested by hour parameter only); every
  one of the 183 rooms at night (shots: Washington Square, Dyker Heights, Union Square, the Rose Reading
  Room, Rockefeller Center, St Patrick's, the Met Great Hall); single (non instanced) cabs, which no shot
  showed.

## Steps 3 and 4 done: truth pass and eggs for rooms 1 to 111 (2026-10-09)

Thirteen builder agents, one or two room files each, all 101 rooms that had no eggs. Each room
now has a fact sheet in `facts/<roomid>.md` (sources, the real plan, what the room has against
what is real, FIXED and LEFT), five or six sourced eggs, and the cheap accuracy fixes (counts,
heights, orientation of features, materials, missing signature pieces, named tree species).
Brief: one agent per file, never move mounts unless the audit shows them reachable after.
Museum wide audit: unreachable 163 to 150, backwards 130 to 95, still stuck 0. Shipped file by
file as agents landed, each bundle built from the commit by `bundle_committed.sh`.

**The LEFT lists are the rebuild queue (step 6).** The biggest, all in their fact sheets:
One Times Square on the wrong side of the red steps; the Brooklyn Bridge towers turned the wrong
way and the span too short; the subway's single platform (real: two islands, four tracks); the
Botanical Garden conservatory as one hall (real: a C of eleven pavilions); Grand Central's
windows on the long walls (real: the short ends); the Tram's bridge on the wrong side; Federal
Hall off Broad Street's axis; the Neue Galerie, Cooper Hewitt and the Met Great Hall facing the
wrong way; Outlook Hill at 9 m (real 21); High Bridge and the Brooklyn Bridge compressed.
Fotografiska left its building on 29 September 2024 (rename to Church Missions House is MLow's
call); the Met roof closed in October 2025 for five years; the Rubin closed its building in 2024.
