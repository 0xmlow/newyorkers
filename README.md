# NEW YORKERS

NEW YORKERS // BY MLOW.

A character collection by **MLow**: NYC figures, each with signature canon
elements (garment, color, prop) that must ship in every appearance.

**Status:** in progress.

## Canon rules

- **Identity consistency.** Every character has a 3-image character sheet in
  `characters/<slug>/` used as Firefly style + subject references. Their
  signature garment, color and prop appear in *every* appearance.
- **Universe crossovers.** NEW YORKERS characters cameo inside STILL WAITING
  rooms as canon-linking teasers. One figure per room, maximum; the wait is
  lonely. Run cameos through the cameo-protocol pipeline only; outputs go in
  `cameos/`.
- **Never delete originals.** Add new versions; don't overwrite.

## Collection facts

| Field | Value |
|---|---|
| Supply | `[CONFIRM WITH MLOW]` |
| Chain | `[CONFIRM WITH MLOW]` |
| Contract / platform | `[CONFIRM WITH MLOW]` |
| Mint price | `[CONFIRM WITH MLOW]` |
| Drop date / status | In progress, `[CONFIRM WITH MLOW]` |

Don't publish copy that states any of these until they're confirmed.

## Layout

| Path | Role |
|------|------|
| `characters/` | One folder per character: `sheet_01..03` refs + `canon.md` |
| `characters/_TEMPLATE/canon.md` | Copy this for each new character |
| `cameos/` | STILL WAITING crossover renders (one figure per room) |
| `metadata/` | Token metadata drafts (after chain/contract are confirmed) |
| `index.html` | Landing page + X/OG card meta (tweet `https://n3wyorkers.com/`) |
| `newyorkers_poster_16x9.png` | 1200×675 card image (`twitter:image` / `og:image`) |
| `assets/` | MLOW logo + evil-eye favicon |
| `CNAME`, `.nojekyll` | GitHub Pages custom domain (`n3wyorkers.com`); serve files verbatim |

## Hosting

- **Dev site:** branch `claude/new-repo-new-yorkers-u1iphp` → https://dev.n3wyorkers.com/
  via GitHub Pages (that branch carries the `CNAME`). DNS: one `CNAME` record,
  host `dev` → `0xmlow.github.io`.
- **Live site:** https://n3wyorkers.com/ is already live on its existing host.
  `main`'s `CNAME` points at `n3wyorkers.com`. It only takes effect when
  `main` is the branch selected in Settings → Pages, and even then the live
  site keeps working until the `@`/`www` DNS records are changed.
  **Don't change those records** until you're ready to move the live site here.

Optional short link from the MLow artist site, as with bloomrun: Squarespace →
Settings → Advanced → URL Mappings: `/newyorkers -> https://n3wyorkers.com/ 301`
(gives `mlow.xyz/newyorkers`).
