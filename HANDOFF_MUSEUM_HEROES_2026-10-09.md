# Handoff: hero GLBs in rooms 165 to 178 (2026-10-09)

MLow asked for the planned swap of key gallery assets for high quality GLB centrepieces. The plan
was `_build/museum/3D_ASSET_PROMPTS_165_179.md` (one hero object per room). Fourteen GLBs now
replace box built stand ins in nine rooms. Nothing deployed.

## What changed, room by room

| Room | Hero file(s) | Replaces |
|---|---|---|
| 165 `cityhallloop` | `h_subway_car` x6 on the loop | the box cars (head and tail lamps kept) |
| 166 `goldvault` | `h_yellin_lantern` x2 at the door | the box and lathe lanterns (light kept) |
| 167 `unionsquare` | `h_equestrian` | the merged box horseman; the pedestal turned to run with the horse |
| 168 `bryantpark` | `h_carousel_horse` x14 | the box horses and plain poles (riders kept) |
| 169 `lighthouse` | `h_tug` | the box tug (barge kept) |
| 170 `fourfreedoms` | `h_ferry` x2, `h_tug` | the box ferries and tug |
| 171 `sealions` | `h_clock_bear`, `_elephant`, `_goat`, `_hippo`, `_kangaroo`, `_penguin` | the box animals on the Delacorte Clock |
| 174 `promenade` | `h_ferry` x3 | the box ferries |
| 175 `astorplace` | `h_irt_kiosk` | the built kiosk (lamp light kept, signs moved to its sides) |
| 178 `huntspoint` | `h_forklift` x6, instanced | the box bodies, masts and wheels (drivers, loads, beacons kept) |

## How it works

`src/rooms/heroes.ts`: `standIn(k, mark)` pulls everything merged since `mark` out of the static
batch so it can be hidden later; `hero(k, name, fit)` loads a GLB once, fitted by height, length,
width or a `box` envelope, base at y 0, ready to clone; `heroInstances` turns one into instanced
parts for animated fleets. The stand in is always built first and hidden only when the GLB arrives,
so a failed load leaves the room exactly as it was.

## How the GLBs were made

`../MUSEUM HEROES 2026-10-09/` holds the concepts, raw and passed GLBs, contact sheets and
`RUNS.txt`. Each hero: a GPT Image 2.5 concept on white (FLORA), then Tripo H3.1 image to 3D
(FLORA at detailed quality for the seven big ones, Krea for the six animals and the horseman), then
`blender/prop_pass.py`. The pass now takes an optional yaw per job (`name:tris:yaw`) and a
`PROP_TEX` texture cap; `contact_sheet.py` takes `SHEET_COLOR=TEXTURE`. Forward is three.js +Z
(what `k.rider` and `lookAt` point), so check every model top down before placing it: Tripo
returns them facing any which way.

Calls made on taste: the horseman concept was refired twice (the first pointed backwards, the second
raised its arm high enough to read as a salute), so the shipped one holds its arm low and has no
face, per the room's rule. The subway car and the kiosk came out squat and tall respectively and
are stretched to the old envelopes; the carousel horses were cut to 1.95 m and 8k triangles after
the first pass crowded the canopy.

## Spend

FLORA: 16 concepts at $0.055 ($0.88) and 7 detailed Tripo runs at $0.72 ($5.04), $5.92, leaving the
Creative Partner workspace near zero. Krea: 7 Tripo H3.1 runs; Krea does not report a price per job
here, so that spend is not known.

## Not verified

- Headless shots only (clock, lantern at night, horseman both sides, carousel, kiosk, train, dock,
  promenade ferry). The tugs in rooms 169 and 170 and the Four Freedoms ferries load (the prop list
  shows them) but were never seen in frame; they are far out on the river.
- Bryant Park reads 950k triangles on the overlay from the carousel view. Not compared against the
  room before this change.
- Phones, frame rate, the mint export (`mint_export.py`) and `build_all.sh` were not run. The bundle,
  `museum.html`, audit (unchanged counts, nothing stuck) and preflight (no problems) were.
- The animals on the clock are only seen from below; up close they were judged on contact sheets.
