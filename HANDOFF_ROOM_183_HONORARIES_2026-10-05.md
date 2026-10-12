# Handoff: room 183, `honoraries`, THE HONORARIES (2026-10-05)

Every honorary New Yorker MLow has painted, hung in one room: Stanford White's Hall of Fame for Great
Americans at University Heights in the Bronx (dedicated May 30, 1901) and the Gould Memorial Library
rotunda it wraps. Built in `_build/museum/src/rooms/v26.ts`, registered in `v0.ts`, curated in
`src/data.ts`, the check scripts assert 183. Room 28 (`halloffame`, g.ts) is the early sketch of the same
place and is untouched; this is a separate room with its own id. Nothing deployed.

Working folder: `../HALL OF FAME 2026-10-05/` (RUNS.txt, raw FLORA outputs, concepts, materials sheet,
props, shots, contact sheet). FLORA project `prj_ns7aek33xqzqrqj5pyw50f02hd8fpc1j`, Creative Partner workspace.

## How the honoraries hang (new)

They are not census pieces, so they do not go through `hang_owned` or `kit.hang`:
- `_build/museum/honor_atlas.py` reads `_build/honoraries/honoraries.json` and `assets/honoraries/*l.jpg`
  and writes `assets/museum/honor/a<i>.webp` (2048, 8 by 14 tiles of 256 by 144) and `a<i>s.webp`
  (1024, phones), `hang.json` (who each slot is, with bio) and `src/honor.ts` (count and categories).
  Runs in `build_all.sh` before the bundle. **Rerun it whenever the honoraries change**, then rebuild the
  museum; the room lays itself out from `HONOR_N`. Order: MLow first, then by the page's categories.
- The room builds one gilt or walnut frame per portrait (four swept profiles, instanced), a soft contact
  shadow quad, the painting from the atlas (7 draws), brass picture lights, and within about 5 m the
  1280 px original fades in over the tile (max 8 live, 3 on phones).
- `main.ts`: `openHonor()` shows the honoree card (name, title, handle, bio, THE HONOREE link to `h/<id>`,
  WALK TO IT). `tap()` answers `userData.honor` (per quad) and `userData.honorFrames` (per frame instance).
  `openDetail()` now resets the record link text and the atlas link, which `openHonor` changes.

Capacity: the rotunda holds 519 (16 bays, tiers of 3x3, 3x4, 3x4, no first tier on the door bay). The rest
go to the colonnade, two per bay; the colonnade's radius grows with the count (today 84 bays, 168 works,
about the real 630 feet). 687 paintings of 680 honorees as of wave 23.

## Plan

Rotunda at the origin; -x west. Spawn at (5.95, 5.95) looking north west at bay 2, where MLow hangs (spawning
at the door put the kit's house banner in the middle of the passage). Passage west through the door to the
colonnade, 8 ordinary census mounts (the place hang, Bronx first). Colonnade curves round to the east, open
to the river. Outside is one photograph (Nano Banana Pro) wrapped the whole way round, reflected past its
edges; its mesh needs normals or the GTAO pass draws it black.

## The thing to do

The roll call: stand on the bronze laurel in the middle of the rotunda for 1.5 s; a beam comes down from
the laylight onto a random portrait, its original loads, and a caption names them (tap it for the card).
Another every 9 s while you stay. Verified headless (caption read "Sara Baumann").

## Spend, FLORA, settled: $3.14

14 Patina Material PBR sets (colour, normal, roughness) $1.18; panorama Nano Banana Pro 4K $0.36; Tiffany
laylight $0.18; 2 GPT Image concepts $0.11; 4 Tripo H3.1 props (capital, lamp, railing, laurel pedestal)
$0.96, through `blender/prop_pass.py`; GPT-6 Astra art direction $0.175 and critique $0.178.
Astra's critique led to: no painted cutout visitors here, matte stone and vault roughness, a darker
night river. Its bloom and exposure notes are museum wide (`fx.ts`) and were not touched.

## Numbers (headless, desktop, debug overlay)

126 to 370 calls, 0.47M to 1.0M triangles; the passage looking into the rotunda peaks at 473 calls.
Phone path: 69 calls. Payload new to this room: atlases 8.4 MB desktop (2.3 MB phones), PBR maps 6.1 MB,
props 1.6 MB.

## Not verified

- Not walked in a live browser; every view is a headless shot (`--at`). Frame rate not measured.
- Phones only one shot; the railings are 128 Tripo instances and could be dropped on `low`.
- `build_all.sh` not run; `rooms.json`, thumbnail and `museum.html` counts updated by hand.
  `new-rooms.html` and the `rooms/honoraries` page are left to `build_all.sh`.
- Museum wide audit: 163 unreachable, 130 backwards, same as before this room. This room: 8 mounts, 0, 0, 0.
- Eight eggs, all checked on 2026-10-05 against the Wikipedia pages they cite.
- `assets/museum/honor/` is generated and gitignored, like `assets/honoraries/`.

## Later the same day: names, X links, the film, the mint GLB

- Every portrait now has a bronze name plate (one canvas sheet, `namePlates()` in v26.ts); the honoree card's
  atlas link becomes ON X to their profile when the handle is a real one. The colonnade tablets were blank (the
  backing box stood in front of the lettering); fixed in ffedf82. **Not deployed yet** (live is still 60d7b5f).
- Hype film: `../HONORARIES HYPE FILM 2026-10-05/` (16:9 X cut and master, 9:16), engine in `_engine/`
  (shots.py rails recorded from this engine, build_film.py compositor, Lyria take B score from 20.29 s).
- Mint GLB: `../HALL OF FAME 2026-10-05/mint/` (10.3 MB mint file, 110.7 MB archive, poster, metadata with CID
  placeholders, viewer, checksums). Rebuild with `export_glb.py`. Nothing pinned or minted.
