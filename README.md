# NEW YORKERS

**A living painted census of New York City, by MLow.**

Every New Yorker in the census is a painted character with a number, a name, a
story and a place on the map. The census is still being painted. It is sold in
named releases, and no New Yorker is ever sold twice.

Live at **https://n3wyorkers.com**

---

## Where the work lives

| Branch | What it is |
|---|---|
| **`Museum`** | **The real thing.** The full site source, the build pipeline, the 3D museum engine and every file the museum needs to run from a checkout. Start here. |
| `main` | This page, plus the original placeholder landing page. `characters/`, `cameos/` and `metadata/` are empty scaffolding from the repository's first day. |
| `claude/new-repo-new-yorkers-u1iphp` | The dev placeholder served by GitHub Pages at `dev.n3wyorkers.com`. |
| `mosh-lab` | MOSH LAB, MLow's glitch instrument: 60 WebGL effects, 48 presets, loop perfect GIF and MP4 export with the MLOW mark. Desktop app source, and the same files run online at [n3wyorkers.com/moshlab](https://n3wyorkers.com/moshlab). |

The working source of truth is the artist's local folder `NEW YORKERS SITE/`.
The `Museum` branch is a copy of its full history (145 commits), pushed
2026-09-29 and refreshed 2026-10-03. When the two differ, the local folder wins, and the branch should
be refreshed from it.

---

## What has been built

### The census

- **7,542 painted New Yorkers** across **19 eras**, numbered up to 7,990, with
  8,081 finished states. Numbers are assigned per era, so gaps are deliberate.
- **13 families, 160 sets, 203 monuments** (milestone numbers such as every
  hundredth piece), 5,127 story links between pieces.
- **A story for every record.** 7,542 of 7,542 have one.
- **Placed on the map.** 7,308 are located in the five boroughs by landmark,
  block, neighbourhood or subway line. Inferred placements are marked as such.
- **Motion and glitch editions.** 786 glitch editions, 400 motion variants,
  a 120 clip loop reel, 94 GIFs and 41 films attached to pieces.

The nineteen eras:

| | Era | | Era |
|---|---|---|---|
| I | The Originals | XI | The Waking |
| II | The Eye Flower Era | XII | The Arrival |
| III | The City Expands | XIII | The Deep City |
| IV | The Brand Batch | XIV | The Second Skin |
| V | The Masterworks | XV | The City That Answers Back |
| VI | The Mythos | XVI | The Twenty Houses |
| VII | The Deep City | XVII | The Ten Rooms |
| VIII | The Fabric | XVIII | The MLow Show |
| IX | The Bloom | XIX | The Trait Layer |
| X | The Look | | |

The three marks run through all of it: the **eye flower** is the city's
attention, the **evil eye** is protection, the **sigil** is community.

### The Museum

`museum.html`: **179 walkable 3D rooms of New York**, from the Bowery to the
Guggenheim ramp to the crown of the Statue of Liberty, hung with the whole
census. Every piece hangs in exactly one room.

- TypeScript and three.js engine in `_build/museum/src/` (rooms in
  `src/rooms/`, the shared kit in `kit.ts`, effects in `fx.ts`).
- Blender institution and life kits in `_build/museum/blender/`, 67 GLB props
  in `assets/museum/props/`.
- Phone controls (thumb stick, tap to walk), a guided tour, a spin for a room,
  sourced history lines, and sourced easter eggs hidden in the rooms.
- Tooling: `assign_hang.mjs` (the hang), `audit_rooms.mjs` (every room checked
  headless in about a second), `shot_room.py` (headless screenshots),
  `mint_export.py`, `mint_gifs.py` and `mint_network.py` (every room as a
  token, joined by its doors).
- Briefs and guides: `ROOM_UPGRADE_GUIDE_2026-09-23.md`,
  `NEW_ROOMS_165_179_BRIEF.md`, `PHOTOREALISM_SCOPE_2026-09-08.md`,
  `UPGRADE_LOG.md`.

### The site

Every page below is on the `Museum` branch and live at n3wyorkers.com.

| Page | What it does |
|---|---|
| `index.html` | Home |
| `census.html` | The interactive census: five 3D formations, a filtered gallery, a story per record, loops and films |
| `museum.html` | The Museum, 179 rooms |
| `new-rooms.html` | The rooms added after the first 111 |
| `map.html` | The Atlas: every New Yorker on a map of the five boroughs |
| `keystone.html` | KEYSTONE: the founding New Yorkers on one continuous spiral ramp |
| `honoraries.html` | The Honoraries: 612 real people painted into the census, with a shareable card each |
| `counted.html` | Get Counted: six questions, no wallet, and the city tells you which New Yorker you are |
| `roll.html` | THE ROLL: paste a wallet, get a borough, an hour, an archetype and a register |
| `count.html` | The live census count |
| `whitelist.html` | The allowlist page for THE CENSUS RELEASE |
| `learn.html` | The Reading Room: 20 sourced histories of New York and 179 place records |
| `faq.html` | The FAQ |
| `press.html` | Press room: fact sheet, angles, image sheet |
| `brand.html` | Brand kit: marks, palette, type, rules, downloads |
| `vault.html` | The Vault: a free puzzle hidden in the site |
| `pigeon.html` | NO. 0000, the one New Yorker the census will not count |
| `shipping.html` | Print shipping, duty and tax estimator |
| `agents.html` | Plain facts, static JSON and stable URLs for crawlers and AI agents |
| `links.html` | Internal link and QR code builder |

Generated at build time, and not in git: one page per New Yorker (`n/`, about
7,500 pages), honoree card pages (`h/`), room pages (`rooms/`), the reading
room (`learn/`), feeds, the JSON API (`api/`), `sitemap.xml`, `llms.txt`.

### The releases

`_build/releases.json` is the only source of truth for what has been promised.
Summary as published on the site:

| Release | Size | Where |
|---|---|---|
| THE MARKS | 90 ones of one: the hundred marks and the era closers | SuperRare and Transient Labs |
| KEYSTONE | 111 and counting, open ended by design, dynamic ERC-7160 | Transient Labs, contract `0x2dbfcca230979a91863be63ebce55dd5aae2b5c9` |
| THE CENSUS RELEASE | 6,666, drawn across eras II to XIX | OpenSea |

Dates and prices are the artist's published intent. Read the JSON for the
current wording rather than copying this table.

---

## Building it

On the `Museum` branch, from `_build/`:

```
./build_all.sh           # everything: data, geo, rooms, pages, package, preflight
python3 preflight.py     # read only, must say "no problems"
python3 build_deploy.py  # writes the upload package. Does not upload
```

Museum only, from `_build/museum/`:

```
npm install
node assign_hang.mjs
node audit_rooms.mjs
npm run check && npm run build
```

To just look at the museum, serve the branch root with any static server and
open `museum.html`.

**Read `AGENTS.md` on the `Museum` branch before changing anything.** It is
short, and it explains which copy of the site actually reaches the internet.

---

## House rules

- No em dashes, no en dashes, no arrows in prose. Commas, full stops, colons.
- The artist is **MLow**.
- Never state a total supply. The collection is sold in named releases, each
  announced in advance, and no New Yorker is sold twice.
- The work is art, never a product. "Art, not an investment."
- Nothing is called confirmed or final until the artist says so.
- Never deploy from an agent session. Building the package is fine; uploading
  is the artist's call.
- Check `_build/honoraries/banned.json` before painting or naming any real
  person.

---

## Not in this repository

Kept only in the artist's local archive, and worth a second backup:

- The full resolution masters for every piece (about 22 GB with working files).
- Thumbnails outside the museum set, glitch and motion files, Keystone masters,
  films and honorary cards. They are build output here, too large for git.
- The generation rosters, prompts and cost ledgers for every era.
- The story bible, the master catalogue and the handoff folders.
