# The shared build of the 2026-10-30 galleries

Three galleries, one engine, one vault. THE WRAPPED WING (`../wrapped-wing`), N3W YORKERS SPACE PROGRAM
(`../space-program`) and TAKE A NUMBER (`../take-a-number`) are forks of the LIVE FROM THE SEWERS engine (the ON
LOCATION lineage: THE MARKS engine, then ON RECORD, CLOUDS AND DIRT V2, the sewers), each with its own `rooms.js` and
`build.js` and a `kit.js` of room helpers shared by copy.

| File | What it does |
|---|---|
| `build.py <gallery>` | deals twelve census New Yorkers to each room, copies the surfaces, the HDRI, the Draco decoder, the models the code names, the plates and depth maps, the posters, writes `data.js`, bundles with esbuild and three r185, writes `index.html` from `shell.html` |
| `patch_main.py <gallery>` | turns the pristine `main.sewers.js` into the gallery's engine from `_build/gallery.json` (names, hooks, roster, a model tilt option, the wrap hook, `c.ROOMS`, `c.cur()`, `c.go()`) |
| `shell.py <gallery>` | writes `shell.html` from the pristine sewers shell and `_build/shell.json` (title, intro, finale, HUD extras) |
| `shot.py <gallery> <out> name=query ...` | headless screenshots with the Playwright Chromium on software GL: `shot.js` serves `site/`, opens each query, prints console errors and 404s |
| `BRIEF_100X.md` | the standard every room is built to since MLow's verdict on the first version ("these look awful"): forty objects in layers, a nook, a hero from the door, branded edits over stock, every surface textured, the trick kept, three to five eggs, people where the story puts them. The builder brief of the second pass |
| `fetch_vault.py` | fills `vault/` from the repository's branches: thumbnails and surfaces from `Museum`, plates and depth maps from the earlier worlds, cast and props from `on-location`, the MARKS kit, the sewers cast, the fonts, the SAME DIFFERENCE posters |

`vault/` and `tools/` are ignored by git. Each gallery's `site/` is committed in full (about 55 to 70 MB each), so the
galleries run from a checkout without the vault; the vault is for rebuilding.

The wrapped GLBs in `vault/wrapped` are MLow's M.Texture objects from the WRAPPED folder on his Drive, filed as
`<object>.glb` (the painting each one wears is in `wrapped_art.json` next to them). A hundred were pulled for this
session; the three galleries use 70 of them.

## The second pass (the same day)

The first version was a box with a wallpaper and six props, which is exactly what CLOUDS AND DIRT V2's brief warned
against. What fixed it, in order of effect:

1. **A wall mural per room** (THE MARKS method). 136 murals already existed across ON LOCATION, THE MARKS and CLOUDS
   AND DIRT V2 (`vault/walls/<on|ma|ct>_<set>.jpg`); `spec.json` `walls` maps a room to one and `build.py` ships it;
   `kit.js` paints it on all four walls (`WALLS` in `data.js`). The Katz's walls make the deli, the trading boards
   make mission control. Pick the mural before the props.
2. **The crowd bodies** (`crowd.js` from CLOUDS AND DIRT V2, the `crowd_*` and `rig_*` files from ON LOCATION): every
   `extra()` is a Tripo New Yorker, the nearest twenty rigged and walking. Queues of cylinders read as a diagram; queues
   of people read as a line.
3. **`fx.js`**: alcoves, columns, a mezzanine, a coffered ceiling, neon. A room needs a nook before it needs a prop.
4. **The branded library** (577 `nyb_*` Blender edits): the hero object and the layers come from there, not from stock.
5. **The brief** (`BRIEF_100X.md`), then one builder per gallery, each owning only its `build.js` and `rooms.js`, each
   verifying every room with a headless shot, the lead integrating. The ON LOCATION round twelve method.

## What was learned (for the memory charter)

- **Start from the bar, not from the engine.** The sewers engine ran, so the rooms shipped at the engine's default
  density. The standard is in writing (the CLOUDS wing brief, the ON LOCATION audit); read it before the first room,
  and measure the first room against it (objects per room, layers, a nook, a hero) before building the second.

- **The sandbox has no image generation that it can bring home.** Krea and Magnific were at zero credits, FLORA at ten
  cents, the Adobe connector has no text to image (only generative expand), and Canva generates well (a plate and a
  usable depth map from it were both proven) but the egress proxy blocks canva.com, so only a 198 px preview comes
  back. The plates therefore came from the house archive: 105 ON LOCATION depth plates plus the sewers, SAME
  DIFFERENCE, THE EVICTION, THE MARKS and ON RECORD sets, retinted per room (`spec.json`: flip, sat, tint, bright).
  Allow canva.com (or run on the Mac with the Firefly browser lane) and `build.py` takes new plates without change.
- **Depth Anything cannot run here either** (huggingface.co is blocked); the archive's depth maps carry the rooms.
- **Google Drive through the connector works for binaries**: each download lands as a blob file; match blobs to names by
  byte size against the folder listing (two Smithsonian files were byte identical and were skipped).
- **Three D Scans objects are Z up, NASA models are Y up.** The engine's `glb()` grew an `rx` tilt; a four tilt contact
  sheet (`sheet.js` with `RX=0,-1.5708,3.1416,1.5708`) settled each one before placing. The EVA suit scan is shards and
  was dropped.
- **A Reflector's camera is a clone of the visitor's at first use**: enable or disable layers on it after creating it,
  and enable the main camera's extra layer only afterwards, or the reflection sees everything (the temple pool).
- **`texture.clone()` before the image lands renders black** (again): the anamorph tiles now carry their sub rectangle
  in their UVs and share one texture.
- **Software GL needs long screenshot timeouts** (180 s) and `domcontentloaded`, not `load`, on a 70 MB site.
