# BIGGER ON THE INSIDE · NEW YORKERS by MLow

One Lower East Side block at night where every door opens onto a room far too big for its building. Space is the
one luxury in New York; online it is free.

This folder is the whole source. It runs on its own, with no NEW YORKERS SITE needed.

1. Use Node 22 or newer. `npm ci` (or `npm install`), then `npm run dev`. Open http://localhost:5190.
2. Read `CLAUDE.md` (rules and code map) and `docs/HANDOFF.md` (every room and every illusion: how it works, what
   was checked, what was not).
3. `npm run check` type checks. `npm run build` writes the static site to `site/` (open it from any static server).
4. Useful URLs: `?room=bodega` (block, bodega, walkup, studio, laundromat, subway, rooftop), `&view=2` (a viewpoint),
   `&shot` (no interface, for stills), `&lite` (no AO or bloom).
5. In the console, `inside` is the debug object: `inside.enter('subway')`, `inside.view(1)`,
   `inside.advance(1500, 'w')` walks forward 1.5 s without the frame loop (a hidden tab gets no frames).

The first continuation task: walk it on a real phone and on a modest laptop, measure frame time, then tune.
Do not add rooms before that.

On n3wyorkers.com this is `/inside`: `NEW YORKERS SITE/_build/build_galleries.py` copies `site/` into
`assets/inside`. Deploying is MLow's call, always.
