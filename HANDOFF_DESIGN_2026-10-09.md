# Design pass, 2026-10-09: palette from the art, the transit kit

LIVE as build 20261009-030525 (Cloudflare deployment 2e664b2b), deployed at MLow's ask.

- Colours are measured from 600 census paintings, not picked: `_build/palette_from_art.py` (`--measure`
  to reprint them, no flags to rewrite any old electric colour that creeps back). Midnight navy grounds;
  streetlight gold, amber, coral, brick, sky teal and harbor blue accents.
- `assets/site.css` TRANSIT KIT: the nav is a black enamel station sign over the yellow tactile platform
  edge, SKELLY CUP in the main stops and eight more under MORE (a station directory board), so the bar
  holds one line. Buttons are MetroCards (`.btn`, home `.primary`/`.fly-btn`), riveted enamel signs
  (`.ghost`) and brass rimmed tokens (`.pink`/`.mint`); a pointer light, a swipe on press and painted eye
  flowers on click come from `assets/site.js`. Glazed tile and a mosaic frieze painted on FLORA, cut to an
  exact repeat, in `assets/ui/` (tile.webp, mosaic.webp, mosaic-eye.webp).
- SKELLY CUP's lane colours are on the art palette; the page keeps its own world (body class `skelly`).
- Skills that carry this forward: `premium-site-design` and `new-yorkers-site` (folders and .skill zips in
  NEW YORKERS BY MLOW/). GitHub branch `skelly-cup` holds the collab code as a clean snapshot.

Not verified: real Safari and iOS, the museum and 3D galleries beyond their first frame, the README on
GitHub main (not updated; the edit needs MLow's go ahead).
