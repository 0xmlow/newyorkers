# Phones: why MoMLOW crashed, and the guard every gallery now loads first (2026-10-18)

MLow: "momlow crashes on the phone. make sure each gallery is also optimized for the phone."

## What was wrong
iOS Safari closes a tab that holds much more than about a gigabyte, and on a phone the GPU shares that memory. A probe
(headless Chrome as an iPhone: 390x844, pixel ratio 3, touch, iOS user agent, every WebGL texture and buffer upload
counted) measured each gallery at its door after 60 seconds:

| Gallery | Before | After |
|---|---|---|
| MEME ISLAND | 1,173 MB | 230 MB |
| MoMLOW | 1,100 MB (1,116 after entering) | 222 MB, flat after its prop queue empties |
| BIGGER ON THE INSIDE | 790 MB | 272 MB |
| MLOW INTERNATIONAL | 563 MB | 86 MB |
| THE LAST BODEGA | 419 MB | 81 MB |
| MLOW GARDENS | 368 MB | 177 MB |
| GENTRIFYING | 263 MB | 85 MB |
| PIGEONHOLE | 219 MB | 45 MB |
| SPIRAL | 172 MB | 76 MB |
| basement, night, movies, unreal, breakglass | 93 to 133 MB | 33 to 68 MB |
| UNLICENSED NEW YORK (added the same day by another session) | not measured | 98 MB |

MoMLOW's ten 3840x2160 art atlases alone were 420 MB with mipmaps, its 86 model textures at 1024 another 456 MB. The
island had five 4096 textures and a hundred at 1024. The phone quality paths in the engines cut shadows and bloom but
never the textures.

## The fix
`assets/ui/phone-gpu.js`, one file, loaded first in every gallery's `<head>` by `_build/build_galleries.py` (copied
into `assets/<slug>/phone-gpu.js`, kept by the sync). On a phone (coarse pointer or mobile user agent) it wraps WebGL's
upload calls and halves any image texture over the cap until it fits: 512 for everything, 1024 for image URLs a
gallery marks as the art (`gpu=dict(art=r"...")` in its GALLERIES entry; MoMLOW marks `/atlas/` and `/t/`). It works
inside WebGL, so it serves three r128 and r169 to r185 alike with no engine edits. Halving keeps powers of two, so
mipmaps stay legal. Video, data arrays, compressed textures, cube maps and render targets are untouched; on WebGL2 the
`texStorage2D` allocation waits for the first upload to learn whether it is an image. Desktop is untouched.

`?gpucap=0` turns it off on a phone, `?gpucap=1024` tries another cap (and switches it on for a laptop, for testing).
`window.__GPUCAP` reports the cap, how many textures it shrank and the megabytes saved.

At phone resolution the capped and full renders look the same (side by side checks of MoMLOW inside, the gardens, the
island, inside, breakglass, spiral, bodega, airport). No textures flipped or went black.

## The main museum and MLOWTAR
`museum.html` with a room entered measured 157 MB, MLOWTAR 58 MB. They do not load the guard and do not need it.

## Not verified
- A real iPhone. Headless Chrome with an iOS user agent is not WebKit; the budgets are measured, the crash threshold is
  the commonly reported one, not one measured here. MLow should open /momlow on his phone after the deploy.
- Decoded images held on the CPU side (ImageBitmaps three keeps after upload) are not reduced by the guard.
- Walking every gallery end to end on a phone. Galleries were measured at the door and, for MoMLOW, inside over 200 s.
- Phone layout of each gallery's own interface (menus, joysticks, overlays) was not reviewed.
- The newer engines (bodega, inside, unreal, breakglass, pigeonhole, MoMLOW, MLOWTAR) still lack the POWER frame
  throttle from HANDOFF_POWER_2026-10-12.md; their pixel ratio on phones is already 1.25 to 1.75.

## Shipped
LIVE in build 20261018-051352 (another session's `deploy.sh` carried this commit; all 15 gallery copies serve the guard,
live MoMLOW measured 221 MB as an iPhone). GitHub: the MoMLOW repo carries its own copy as v2.4 (`site/phone-gpu.js`,
first in `site/index.html`, a README section), branch `momlow` at 1b2b4a8, a fast forward. build_galleries strips the
repo's tag and puts its own in, so the copy has one. Later the same day every other gallery repo and branch got it too: one local commit per repo touching only
`site/phone-gpu.js` and the `<head>` line of `site/index.html` (THE PIGEONHOLE builds site/ from source, so there it is
`src/phone-gpu.js`, `src/shell.html` and a copy step in `tools/build.py`), and a fast forward on each GitHub branch
built from that branch's own published tree. All 15 branches carry it. When the canonical copy changes, the gallery
repos' copies go stale; the site build always overwrites with the canonical one, so the live site never does.

## Where the tag lives in each gallery repo
Most galleries generate site/index.html, so the tag sits in the source the build reads: `_build/island.html` (MEME
ISLAND), the page string in `_build/build.py` (BASEMENT), `_build/shell.html` (THE MARKS night, ON LOCATION, BREAK
GLASS), `src/shell.html` plus a copy step (PIGEONHOLE), and for the Vite builds, which empty site/, the root
`index.html` plus `public/phone-gpu.js` (UNREAL, INSIDE, UNLICENSED). The rest keep a hand written site/index.html.
These source commits are on the GitHub branches too (pushed 2026-10-18 with the power commits; meme-island's
branch held an older island.html, so only the tag line was added to its copy).

## Phone layout (later the same day)
MLow: the main dropdown menu cuts things off on a phone and is lopsided; check each gallery's menus.

- The site menu (`assets/site.css`, `assets/site.js`): the open menu was a flex column with wrapping and a max height,
  so on a phone it wrapped into side by side columns, the MORE heading above the screen and PRINTS off the right. Now at
  1060 and below: one opaque panel that scrolls by itself, two even columns, MORE after a rule, PRINTS full width last;
  the page stops scrolling and `#ny-mintbar` steps aside while it is open (`body.nav-open`). Desktop unchanged.
- Every gallery audited as an iPhone (door, inside, every menu like button opened): edges, clipped text, overlapping
  controls, tap targets. Fixed, each in its own repo:
  MEME ISLAND and YOUR MOM'S BASEMENT (`#startmenu` set display:flex, which beat its hidden attribute, so the Start menu
  never closed on any screen; a phone now starts with the status window on the taskbar), MLOW INTERNATIONAL and MLOW
  GARDENS (the places list covered half the view; a PLACES button at 720 and below), THE SPIRAL (the button bar sat under
  the joystick), GENTRIFYING (8px controls in two lopsided clusters; an even grid of four, 38px tall).
- Looked fine as they were: bodega, inside, unreal, unlicensed, pigeonhole, ON LOCATION, THE MARKS night, MoMLOW,
  BREAK GLASS, MLOWTAR.
- Not checked: real iOS Safari (safe areas, the address bar), landscape, and menus not reachable by a labelled button.
- LIVE in build 20261018-070848. All six gallery branches pushed as fast forwards; meme-island, your-moms-basement and
  skelly-spiral hold older copies of these files, so the edits were applied to their own copies, nothing else changed.

## Local repos and GitHub branches reconciled (later the same day)
MLow asked what the older branches were missing. The site always builds from the local repos, so the live site already had
every local change (checked: the live gallery pages hash the same as the local copies). Only GitHub was behind:

- meme-island, your-moms-basement, skelly-spiral, mlow-international, the-marks-night: each lacked its Power commit of
  12 October. Checked line by line that the only content GitHub would lose was the pre Power version of the same lines,
  then synced. The marks bundle `site/assets/gallery.js` (generated, gitignored locally) predated Power and was refreshed
  from the local build. The marks branch keeps its own simpler `.gitignore` on purpose: it ships the generated art.
- skelly-spiral also gained the 13 October ledger rebuild (70 tournaments, 1,750 races; it was live but never committed)
  and the phone header (dark plate, readable subtitle). Its 98 generated files on the branch match the local build.
- break-glass went the other way: the branch README had a "Building from this branch" section the local repo lacked; it
  was brought down (local commit 1cfaa46).
- Left off GitHub on purpose, as the snapshots always did: ON LOCATION `work/` (1,692 generation files), the marks
  `work/` folder, gentrifying `tools/patch*.py`.
- After: no branch has a tracked file newer locally or only on GitHub, except those deliberate exclusions.
- LIVE in build 20261018-071642 (the spiral header). The ledger itself was last updated 13 October 09:03.
