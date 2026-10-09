# PFP likeness redo, 2026-10-09

MLow: some SKELLY CUP holder paintings (chikai first) do not look like the holders' PFPs. Use Krea and FLUX 3 for the final edit.

Cause: 45 holders were painted as "invented" characters because no avatar was found at the time (ENS and X both empty).
Their OpenSea profiles do have PFPs. `os_avatars.json` holds 79 of 98, read from opensea.io profile pages.

Chain per marble: Krea Seedream 5 Pro (the un-recoloured original from brink/originals plus the PFP as style images)
goes to k1/, then FLORA FLUX 3 Image is2i at 2k (the Krea result plus the PFP) is the final pass and goes to f3/.
Prompts: prompts.py. Books: books.json via books.py. Sheets: sheets/ (PFP vs old painting), sheet_k1_*, sheet_f3_*.

The 26 redone are listed in redo.json. Skipped: honorees (their likeness was already checked), paintings that already
match, and PFPs that are not a character (text, landscape, dice, logo, black square, glitch, photo of sod).
15 invented holders have no OpenSea PFP at all and stay invented.

## State (done 2026-10-09)
- 6 finals through FLORA FLUX 3 (78, 37, 8, 22, 34, 4). FLORA then ran out of credits.
- The other 20 were finished in Krea the same way, at MLow's call: FLUX Kontext Dev (the FLUX edit model on Krea,
  the Krea stage 1 result plus the PFP as reference), then Topaz Standard High Fidelity V2 upscale, because Kontext
  outputs about 1 MP. Two Kontext misses were refired with explicit descriptions: 24 (put a human face in the pixel
  ghost) and 83 (no mohawk). URLs in kx_urls.txt and up_urls.txt, provenance in final/source.json.
- All 26 finals (2560x1440, final/) were written into brink/originals/contest, recoloured by brink/apply.py, then
  rechain.sh, build_skelly, build_honor_cards, build_honoraries, museum honor_atlas + npm run build, build_seo,
  build_og. Site commit 18b10fe. The files they replaced are in replaced/ (out/ and originals/).
- NOT packaged: build_deploy.py was refused by the permission check in this session. MLow runs build_deploy.py and
  preflight.py, then deploys.
