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
| `index.html` | Landing page + X/OG card meta (tweet `https://newyorkers.mlow.xyz/`) |
| `newyorkers_poster_16x9.png` | 1200×675 card image (`twitter:image` / `og:image`) |
| `assets/` | MLOW logo + evil-eye favicon |
| `CNAME`, `.nojekyll` | GitHub Pages custom domain; serve files verbatim |

## Hosting: GitHub Pages on a custom subdomain

Same setup as bloomrun. Served by GitHub Pages (`main` / root) on the domain
in `CNAME`:

```
https://newyorkers.mlow.xyz/                            -> index.html (tweet this)
https://newyorkers.mlow.xyz/newyorkers_poster_16x9.png  -> card image
```

1. Repo → Settings → Pages → Source: *Deploy from a branch*, `main` / `(root)`.
2. DNS (Squarespace): `CNAME` record `newyorkers` → `0xmlow.github.io`.
3. Once the record resolves, tick **Enforce HTTPS** in Settings → Pages.

Optional short link, as with bloomrun: Squarespace → Settings → Advanced → URL
Mappings: `/newyorkers -> https://newyorkers.mlow.xyz/ 301`.
