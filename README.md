# The Museum That Is Gentrifying Itself
NEW YORKERS by MLow · Experimental Institutions 002 · on the site at n3wyorkers.com/gentrifying

A fictional NYC industrial loft becomes luxury real estate as the visitor generates buzz. Original art is pushed into a shrinking corridor. Six tenant records unlock a cooperative ending that restores the exhibition.

## Visit
Serve `site` with a static HTTP server. No build or package install is required. Three.js is vendored. Google Fonts is optional; system fonts work offline.

Four spaces: the working floor, sales suite, basement holdouts, rooftop commons. 58 NEW YORKERS (tools/make_art.py writes assets/art.json and collection.html from the site's data.js); six clues; seven optical studies. Overview orbit and zoom, walking with collision bounds, keyboard navigation, mobile movement controls, object menus, ordinary HTML artwork index, reduced motion, and locally saved tenant discoveries.

Generate buzz is a fictional, browser-local simulation. It does not use visitor counts. Pressure resets on reload. Reset is available in Help. All artwork remains in the index throughout redevelopment.

## Sources
Artwork provenance, stable identifiers and original aspect ratios: `site/assets/art.json`. Source originals remain unmodified. Brand marks from the user's NEW YORKERS library. Brick texture reused from the prior Last Bodega ImageGen material. All architecture, object narratives and procedural materials are authored for this experience. No actual address, historical reconstruction, real tenant documents, property claims or financial claims are represented.

Three.js license: `site/vendor/LICENSE`. Visitor credits: `site/credits.html`.

## Checks
- `node --check dist/app.js`
- `node checks/scene-smoke.mjs`

`checks/report.json` records real Three.js CPU geometry checks, asset presence, navigation spawns, pressure progression and gated restoration ending. Renderer and texture decoding are mocked: this is not visual or GPU validation.

Browser QA was attempted but blocked because the browser's admin-enforced security policy could not be verified. Rendered appearance, texture decoding, mobile usability and actual GPU frame rate remain unverified. No browser workaround was used.

## Hosting
The existing site identity is in `.openai/hosting.json`. Preserve owner-private access unless the user requests a change. Use the supported Sites source/publish workflow. Never place credentials in this checkout.


## Version 2 — architectural and optical overhaul

- Eye-level cinematic opening, fully restyled subdued interface, dedicated Optical studies menu with exact viewing points.
- True window voids, interior ceilings with skylight slots, profiled column bases, metal window frames, radiators, beveled furniture/frame edges, soft shadow map and practical light fixtures.
- Three CC0 Poly Haven scanned material sets: old_wood_floor, brown_brick_02, concrete_floor_02. Fifteen texture maps (2K color, 1K normal/roughness/AO/height). Provenance and download URLs are in checks/pbr-provenance.json.
- 20-step view-dependent parallax relief mapping from measured material height maps; sRGB color and linear data-map handling. No fabricated monocular scene-depth claim.
- Screen-space ambient occlusion samples the actual camera depth/normal buffers; subtle bloom; one final OutputPass for display conversion; PMREM environment reflections.
- Six optical studies: disconnected bronze triangle, mirrored deep glass shaft, forced-perspective corridor, layered moire screen, fragmented anamorphic circle, and dual-message folded sign.
- High/light detail control disables SSAO and relief sampling and reduces resolution; coarse-pointer devices start without SSAO. Original artwork is available in a neutral HTML image viewer.

Version 2 CPU checks pass: 24 works, 52 inspectable targets, four room spawns, six optical viewpoints, finite geometry, material shader assembly, pressure stages, and clue-gated restoration. These tests do not compile shaders on a GPU. Browser testing was attempted again but blocked by the unavailable admin security-policy check. Rendered appearance, actual optical perception, shader compilation on target devices, and performance remain unverified. Photorealism is an intended direction, not a verified outcome.


## Version 3, the port (Claude Code, 2026-10-15)

Ported from ChatGPT's downstream copy and opened in a browser for the first time. `dist/` is now `site/`.

- The hang: 58 works, each framed with a gold fillet, a brass picture light and a pool of light, labelled, linked to its census page.
- The redevelopment is animated from one smoothed value: whitewash shader on the loft brick and floor, warm to clinical sun, NOW LEASING vinyl, one branded partition that rises and walls the art into a corridor, the asking rent on the meter, all reversed by the cooperative ending.
- 07 The Rebrand: an anamorphic paint job (after Felice Varini) from a projector camera with its own depth map.
- Fixes: brick tile scale, conduits through the hang, spawns facing obstacles, two viewing points inside furniture, the double promise sign hidden and overlapping, sign text overflowing, the frame budget every NEW YORKERS gallery uses.
- `tools/shots.py` renders the stills in `site/assets/shots/` and `site/assets/poster.jpg`.

Not verified: a person walking it end to end in a live browser, a real phone, shader compile on mobile GPUs. The checks/ scripts are ChatGPT's and were written for the v2 layout.
