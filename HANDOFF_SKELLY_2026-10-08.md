# Handoff, 2026-10-08: SKELLY CUP, NEW YORKERS x Marble Run

Read `AGENTS.md` first. Built, committed, not deployed.

## What it is

Bryan Brinkman's marblerun.fun races 100 named marbles forever, five to a race, from seeds anyone can
verify. SKELLY CUP puts a painted New Yorker on every marble, turns the five lanes into the five boroughs,
and paints a portrait of every tournament champion. Players pick free before the gate and can "blow on it"
(Marble Run's own client seed endpoint). Nothing is staked. Bryan's API page says it is not a betting
product and this page holds to that.

Planning, casting, ledger and portraits live outside the repo in `../MARBLE RUN x NEW YORKERS 2026-10-08/`
(README.md there maps every file).

## In this repo

- `skelly.html` from `_build/build_skelly.py`, wired into `build_all.sh`, `build_deploy.py` (page and
  `assets/skelly`), the sitemap in `build_seo.py`, and the footer in `assets/site.js` (not the top menu;
  that is MLow's call).
- `_build/skelly/cast.json` the 100 riders, `_build/skelly/champions.json` the 5 portraits. Both are written
  by `publish_portraits.py` in the outside folder. Do not hand edit; recast there and republish.
- `assets/skelly/` portraits at 1920, 640 and 1200x630 share cards (3.2 MB), `riders.json`.
- `_build/api/functions/api/skelly.js` the free picks board. POST checks the gate with Marble Run's
  /api/next server side, so a late pick is refused. GET scores from Marble Run's /api/history: 5 winner,
  2 second, 1 when the player's blown seed is in the published clientSeeds. `hit.js` accepts kind `skelly`.

## What needs MLow

1. **Create the table** before deploy, or the board shows "opens soon" (the page still plays):
   `npx wrangler d1 execute new-yorkers --remote --file "../NEW YORKERS SITE/_build/api/schema_skelly.sql"`
   from GO LIVE PACKAGE/.
2. **Bryan's OK** to skin his marbles publicly (draft note in the outside folder, BRYAN.md). Hold the deploy until he says yes.
3. **The casting** is a draft (casting.html in the outside folder). Three picks are flagged WEAK.
4. Top menu entry, if wanted: `NAV` in `assets/site.js`.

## Not verified

- `/api/skelly` never ran on Cloudflare or against D1. The JS passes `node --check`; the gate and scoring
  logic was read, not exercised.
- The page was checked on a static local server only: live feed, lanes, riders, Borough Wars, portraits,
  the 100 riders. No extensionless routing or Functions there.
- `build_all.sh` and `preflight.py` were not run: the disk had 181 MB free and the package copy would not fit.
- Portraits passed `00_TOOLS/textgate/gate` (a floor, not proof) and a look at each.

## Later the same night: louder, and Bryan credited everywhere

- Sixth portrait: tournament 6 went to Blaze It (the rusted robot pitmaster), painted first try, $0.175.
  Nine FLORA runs in all today for the six portraits, $1.58.
- The page now runs a ticker, a gate clock with LAST CALL in the final ten seconds, tournament progress,
  STILL ALIVE (the hundred shrinking, eliminated riders greyed), crowd heat per lane (`?crowd=` on
  /api/skelly, counts only), HOT and title tags, a local streak card, finish splashes (YOU CALLED IT with
  confetti and an X share line that tags @bryanbrinkman, SO CLOSE, REKT, UPSET), a champion splash, the
  hall of fame from Marble Run, RULES OF THE STOOP, an empty frame for the next portrait, opt in sound.
- Bryan: a credit pill in the hero, a credit chip on the TV, THE ENGINE IS BRYAN'S section explaining his
  commit and reveal, beacon and client seed scheme, links to marblerun.fun, the API, the source, his hall of
  champions, @bryanbrinkman and bryanbrinkman.com, his NEW YORKERS honorary card, and isBasedOn in JSON-LD.
- Copy holds the line: no odds, no stake, no money out. The only betting words on the page are disclaimers.
- Verified live on a static preview: a real heat was called and won, the splash, streak and ticker fired.
  /api/skelly and the crowd heat still never ran on Cloudflare.

## 2026-10-09: the block at night (design pass on FLORA)

MLow asked for awwwards grade design with New York and NEW YORKERS woven through. The page is now one Brooklyn
block at night, every section a real surface painted on FLORA in the NEW YORKERS hand ($1.56, 7 runs, project
prj_ns765drs0xtf1d940e77ax6tq98fzkt3), cut by `MARBLE RUN x NEW YORKERS 2026-10-08/design/process_design.py`
into `assets/skelly/ui/` (3.2 MB):

- THE BOARD: a skully board chalked on wet asphalt (hero.jpg). Glass marbles you can drag and flick, with
  collisions, on a canvas over it. Letters drop in. Marble cursor on desktop.
- BODEGA TV: Bryan's live race inside the CRT under a sleeping orange cat (bodega.jpg, screen box in
  bodega.json found by flood fill). WATCH BIG dollies the camera into the screen; Esc or scroll backs out.
- THE GATE: chalk texture, lanes as painted bottle caps (cap-*.png, one per borough), the board as an LED scoreboard.
- STILL ALIVE: a subway tile wall with a mosaic station sign.
- THE WALL: portraits wheatpasted with tape on brick (brick.jpg), pinned and scrolled sideways on desktop.
- HALL OF FAME: a striped awning over a deli letterboard.
- THE STOOP: the rules as stoop steps over the brownstone plate (stoop.jpg).
- THE ENGINE: Bryan's scheme drawn as a subway line with stations, his honorary card as a placard.
- THE RIDERS: a hundred transit cards with tilt and shine.
- A subway line scroll map down the right edge, a ticker, film grain, a pigeon walking the footer.
- Fonts: Bungee and Bungee Shade (signage), Rock Salt (chalk) from Google Fonts, beside the house fonts.

Two traps: `overflow:hidden` on a section kills `position:sticky` inside it (use `overflow:clip`), and an
absolutely positioned canvas with inset:0 stays 300x150 unless given width and height. Checked with headless
Chrome over CDP at 1440x900 and 390x844 (the preview pane is too small to judge design). All plates passed
the text gate. Still not deployed; the D1 table and Bryan's yes are still pending.
