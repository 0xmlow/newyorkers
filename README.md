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
| `index.html` | Landing page + X/OG card meta (tweet `https://dev.n3wyorkers.com/`) |
| `newyorkers_poster_16x9.png` | 1200×675 card image (`twitter:image` / `og:image`) |
| `assets/` | MLOW logo + evil-eye favicon |
| `CNAME`, `.nojekyll` | GitHub Pages custom domain; serve files verbatim |

## Hosting: GitHub Pages

> **This branch (`claude/new-repo-new-yorkers-u1iphp`) is the dev site at
> https://dev.n3wyorkers.com/.** https://n3wyorkers.com/ is the live site on its existing host; don't touch its `@`/`www` DNS records.
> GitHub Pages serves one branch + one domain per repo, so whichever branch is
> selected in Settings → Pages is the one that's live.

### Dev DNS (n3wyorkers.com registrar)

`CNAME` record, host `dev` → `0xmlow.github.io`.
