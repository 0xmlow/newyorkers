# THE DEPARTMENT OF UNLICENSED NEW YORK
NEW YORKERS // BY MLow. Portable source edition, October 18, 2026.

A fictional municipal building that has impounded the impossible parts of New York. Sixteen authored departments, 160 original collection works, 43 discoveries, paired live door views, recursive exhibits, a live scale-model room, an anamorphic witness, a forced-perspective apartment, a gravity wash, folding architecture, and generated depth vistas.

## Run the source
Open a terminal **inside this folder**. Node 22.12 or newer (tested with Node 24):

```sh
npm ci
npm run dev
```
Open http://127.0.0.1:5198. This is a source project, not a hosted artifact. No account or credentials are needed.

```sh
npm run check
npm run build
npm run preview
```

## Open the included offline preview
The `dist/` directory includes the actual runtime and assets. No npm installation or network connection is needed to serve it:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```
Open http://127.0.0.1:8080. Do not double-click index.html; browser module restrictions require a local server.

## Controls
WASD walks; arrows walk/turn; mouse or drag looks; click or E interacts; I opens the collection index; brackets change rooms; Escape closes inspection. On touch screens, left thumb walks, right thumb looks, tap interacts. The Rooms menu is available throughout. Walk near a doorway to change departments, or click its live surface for a camera ride. Reduced-motion preference freezes continuous room motion. `collection.html` is the ordinary image route and works without WebGL.

## Hand this to Claude Code
Read `CLAUDE.md`, `docs/ROOMS.md`, and `docs/VALIDATION.md`. The source of the new rooms is `src/rooms.js`; the reused and updated portal/navigation engine is `src/engine.js`. All necessary assets are under `public/`. Never edit original art pixels. Build output is replaceable; source and asset provenance are not.

The four new ImageGen assets and final prompts are included. The source collection files are byte-identical optimized display copies inherited from the existing project; full-resolution masters are not included. A manifest records hashes and original pack lineage. Both updated MLow skills are included under `skills/`.

This is unpublished. No existing hosted gallery was modified, replaced, or made public.
