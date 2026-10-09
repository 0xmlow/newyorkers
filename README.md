# SKELLY CUP, NEW YORKERS x Marble Run

Bryan Brinkman's marblerun.fun, remixed by MLow. Nothing here is live, sent, minted or launched.

| File | What it is |
|---|---|
| `PLAN.md` | The idea, the legal line, the free game, the $SKELLY draft. Read first. |
| `cast.json` | The 100 riders: one census piece per marble, with the reason, holder, and WEAK flags. Source of truth for casting. |
| `casting.html` | Contact sheet for MLow to cut: KEEP or RECAST per rider, notes, download decisions. Saves in this browser. |
| `skelly-cup.html` | The game prototype on Bryan's live feed: riders in lanes, boroughs, free picks, BLOW ON IT, points, Borough Wars, hall of fame. |
| `riders.js` | Generated from cast.json by `python3 build_riders.py`. Rerun after any recast. |
| `ledger.py` | The Seed Ledger. Archives every race, seed and champion into `ledger/`. Two requests per run. |
| `snapshot_holders.py` | Holder snapshot for any Ethereum NFT contract, with optional even or weighted token split. |
| `CHAMPIONS.md` | The original briefs for the first five champions. |
| `portraits/` | The Champion's Portraits, 2560 masters. `portraits.json` records the chosen file per tournament; `superseded/` holds the rejected first tries (lettering, or a marble that came out small). |
| `champion_queue.py` | After `ledger.py`, lists champions with no portrait yet and writes the house brief for each to `portraits/queue.json`. |
| `publish_portraits.py` | Chosen portraits and the casting into the site build (`assets/skelly`, `_build/skelly`). Then `python3 build_skelly.py` in the site's `_build`. |
| `launchd/` | A plist that runs the ledger and the queue every 30 minutes. Not installed. |
| `BRYAN.md` | Draft note for MLow to send Bryan. |
| `_cast/` | Working files: candidate search and the picks list. |

## Recast a rider

Edit `_cast/picks.txt` (marble id | piece number | reason), run `python3 _cast/build_cast.py`, then `python3 build_riders.py`. Both pages pick it up on reload.

## What is waiting on someone

- **MLow:** cut the casting in `casting.html`; send `BRYAN.md`.
- **Bryan:** yes or no on skinning his marbles, on NYC courses, and on any token.
- **Bryan:** the Brinkworks contract address, so `snapshot_holders.py` can take the 98.
- **Lawyer:** before any prize pool over $5,000 and before any token exists.
- **Built 2026-10-08 evening:** the five portraits ($1.40 on FLORA), skelly.html with a shared board (/api/skelly, D1) in the site repo, commit da291fe, not deployed. See `NEW YORKERS SITE/HANDOFF_SKELLY_2026-10-08.md`.
- **Still not built:** the museum room, MOSH states for the portraits, any token contract (lawyer first).
