# Making the museum look real: a scope

2026-09-08. Everything in the baseline is measured, from the 2026-09-06 export of
all 111 rooms and from the engine as it stands. The recommendation pushes back on
the premise in one place, and that place is the whole decision, so it is up front.

---

## The short version

**Blender is not the first lever, and for most of the museum it is not the lever
at all.** The single biggest gap between how this looks and how a photograph
looks is not geometry and not materials. It is that nothing is occluded: every
surface receives the same ambient light from every direction, so nothing sits in
its own space, no corner darkens, and no object touches the floor. That reads as
CG within half a second, before a visitor has looked at any one thing.

Three 0.185, already installed, ships `GTAOPass`: ground truth ambient occlusion
as a screen space pass. It costs no assets, needs no re-authoring, and applies to
all 111 rooms and every room built after them. It is one evening of work and it
is the largest visible change available.

Blender earns its place afterwards, on the roughly two dozen rooms whose forms
are crude enough that better light only makes the crudeness clearer.

---

## The baseline, measured

From `MUSEUM EXPORTS/2026-09-06/manifest.json`, all 111 rooms:

| | min | median | p90 | max |
|---|---|---|---|---|
| draw calls | 72 | 254 | 399 | 732 |
| triangles | 11,466 | 110,688 | 304,080 | 894,356 |

32 rooms are over 300 draw calls, 42 over 150k triangles. The heaviest is
`pioneerworks` at 894k triangles and 384 calls; the lightest is `studio8h` at 11k
and 127. Only one room is loaded at a time.

Other measured facts:

- **Room load is 1.1 to 1.4 seconds and barely moves with triangle count.**
  `pioneerworks` at 894k triangles loads in 1,328 ms; `metgreathall` at 77k loads
  in 1,088 ms. Load is dominated by procedural texture generation and atlas
  fetch, not geometry. There is more headroom for geometry than for textures.
- **The lighting model is already physically based.** `MeshStandardMaterial`
  throughout, image based lighting via `PMREMGenerator` from each room's own
  procedural sky, a directional sun with a 2048 shadow map, hemisphere fill,
  point lights, ACES filmic tone mapping, sRGB output. This is not a scene that
  needs PBR added. It needs occlusion.
- **Textures are procedural.** 27 generators in `textures.ts` write albedo,
  normal and roughness onto a canvas at build time. Nothing is photographed.
- **The prop library is 56 GLBs, 29 MB, median 413 KB.** 48 distinct props are
  actually used across the museum. The median room uses 2; the p90 room uses 7.
- **Shipped museum weight is 36 MB**, separate from the 1.5 GB of piece
  thumbnails the whole site shares.
- **The low quality path already drops antialiasing, all shadows, and half the
  crowd.** Anything proposed here is high path only unless stated.

### What I could not measure

**Frame rate.** The browser pane I have runs with `requestAnimationFrame`
suspended, so no real frame renders and `renderer.info` reports nothing usable. I
have triangle and draw call counts from a real GPU render in the export, but not
milliseconds per frame on any actual device. **Every performance claim below is
an estimate until wave 0 measures it.** That is the first task for a reason.

---

## What "photorealistic" decomposes into

Five things, in order of how much they cost the look here:

1. **Occlusion and indirect light.** Missing entirely. No ambient occlusion, no
   global illumination, no contact shadows. Objects float.
2. **Edges.** Every form is a box, cylinder or extrusion with perfectly sharp
   corners. Real edges catch light along a highlight a millimetre wide, and its
   absence is one of the strongest CG tells.
3. **Material truth.** Procedural albedo is clean and even. Real surfaces are
   uneven, dirty at the bottom, worn where hands go.
4. **Post.** No bloom on the practical lights, no antialiasing on the low path,
   no depth of field.
5. **Geometric detail.** Mouldings, reveals, hardware, the depth of a window in a
   wall. Only matters up close, and the visitor is up close at every artwork.

### What Blender can and cannot do about each

Blender is an offline authoring tool. It cannot make the runtime renderer compute
light. What it can do:

| Gap | Can Blender fix it? | Notes |
|---|---|---|
| Occlusion | **Only by baking**, and baking fights this architecture | See the trap below |
| Edges | **Yes, and it is the best tool for it** | Bevel the kit's primitives, or model replacements |
| Material truth | **Yes** | Bake high poly detail into normal and roughness maps |
| Post | No | Runtime concern |
| Geometric detail | **Yes** | This is what the institution kit already does |

### The baking trap, stated plainly

Baked lighting is the classic answer to "no GI in the browser", and it is the
wrong answer here. The rooms are not assets. They are 12,000 lines of TypeScript
that build geometry at load time, which is exactly why the daily hang, the New
York clock light, the per room GLB export and every fix made this week are
possible. Baking lightmaps means freezing each room into a static asset with
unwrapped UVs, and that would:

- **cost the daily reshuffle and the clock light**, because baked light is baked
  at one time of day with one set of works on the walls
- **blow the asset budget.** The per room GLB export already runs 31 to 103 MB.
  111 baked rooms is not a 36 MB museum any more
- **freeze the room code**, which is where every fix from this week lives

If GI is wanted later, the route is a runtime probe or irradiance volume per
room, not a bake. That is a much larger piece of work and it is not in this
scope.

---

## The waves

### Wave 0 — measure, half a day

Frame time on the real target devices: a desktop, a recent iPhone, an older
Android. Median room, p90 room, and `pioneerworks` as the worst case. Record ms
per frame, not a feeling.

**This gates everything else.** If the p90 room is already at 16 ms on a mid
phone, the whole high path budget for waves 1 and 3 is zero, and the answer
changes to "make the low path better" instead.

**Done when:** a table of ms per frame for three devices and three rooms, and a
stated per frame budget for the high path.

### Wave 1 — occlusion and post, one to two days

The largest visible change, no assets, all 111 rooms at once.

- `GTAOPass` through `EffectComposer`, half resolution, high path only
- `UnrealBloomPass` at a low threshold so the practical lights read as lights
- `SMAAPass` replacing MSAA, which the composer will cost us anyway
- a hard `?fx=off` switch and automatic fallback if frame time regresses

**Risk:** a composer adds a full screen pass and forfeits the renderer's own
MSAA. On a weak GPU this can cost more than it gives. Mitigated by the switch and
by wave 0 telling us the budget first.

**Done when:** side by side captures of six rooms, and measured frame time within
the wave 0 budget on all three devices.

### Wave 2 — edges, one to two days

Sharp corners are the second tell and the cheapest to soften, because the kit
funnels almost everything through a handful of primitives.

- add a bevel to `box`, `column` and `arch` in `kit.ts`, off by default, on for
  the forms a visitor stands next to
- a shared bevelled box geometry so the triangle cost is paid once and instanced

**Risk:** triangle counts rise across every room at once, and 42 rooms are
already over 150k. Cap it: bevel only geometry within a few metres of a mount or
a walkable path.

**Done when:** the median room is under a stated triangle ceiling and captures
show the edge highlight.

### Wave 3 — Blender, where it actually pays, one to two weeks

Now the crude forms are the limiting factor, and this is where Blender belongs.
The pipeline already exists and shipped a bench today: `build_institution_kit.py`,
`build_quiet_bench.py`, headless, GLB out.

Target the rooms that need it, not all 111. Two lists already exist:

- the **76 works flagged by `audit_rooms.mjs` as having a solid in the picture**,
  across 23 rooms. Those rooms need eyes on the geometry regardless, so this is
  the same visit
- the rooms whose forms are visibly boxes: the row houses, the institution
  interiors, the industrial sheds

Per room: replace the crudest masses with modelled, bevelled GLBs; bake high poly
detail to normal and roughness; keep the props under the 413 KB median.

**Risk:** 56 props and 29 MB today. Adding modelled masses for two dozen rooms
could double the museum's shipped weight. Budget it per room before authoring,
and hold the total under a stated ceiling.

**Done when:** the 23 flagged rooms are clean in the audit and their captures
stand next to the Great Hall without embarrassment.

### Wave 4 — materials, ongoing

Dirt, wear, and unevenness on the surfaces a visitor stands closest to. Cheapest
as additions to the existing procedural generators rather than photographic
texture sets, which would cost load time the 1.2 second budget does not have.

---

## What I would do, and what I need from you

Do wave 0 and wave 1 next, and judge the result before committing to wave 3.
Occlusion is most of the gap, it is a day, and it needs no art direction. If it
lands, the museum looks substantially more real by the end of the week and
Blender becomes a targeted tool for two dozen rooms rather than a rewrite of 111.

Two decisions are yours and I do not want to assume them:

1. **The performance floor.** What is the oldest device this has to hold 30 fps
   on? That single number decides whether wave 1 ships to everyone, ships to
   desktop only, or does not ship.
2. **Whether the daily hang and the clock light are negotiable.** They are the
   reason baking is off the table. If you would trade them for baked light, the
   scope is a different and much larger document, and I would want to argue
   against it first.

---

# Wave 0 and wave 1: results

## Wave 0, measured

The pane I benchmark in renders with `requestAnimationFrame` suspended, so the
canvas collapses to 1 by 1 and `renderer.info` reports nothing. The way round it
is to drive `renderer.render()` directly in a loop and force a GPU sync with
`gl.finish()`, after resizing the drawing buffer to a real size. That measures
render cost without the vsync scheduler in the way, which is what we want.

Apple M5 Pro, 1920 by 1080 at a 1.75 device pixel ratio, so a 3360 by 1890
buffer. High path, shadows on:

| room | ms per frame | draw calls | triangles |
|---|---|---|---|
| metgreathall | 0.65 | 257 | 242,658 |
| pioneerworks | 0.62 | 390 | 894,772 |
| cooperhewitt | 0.61 | 424 | 843,152 |
| noguchi | 0.57 | 292 | 786,624 |
| bowery | 0.47 | 309 | 535,320 |
| socrates | 0.42 | 314 | 674,980 |
| studio8h | 0.24 | 130 | 11,598 |

**The museum is draw call bound, not fill bound, and not triangle bound.**
Resolution scaling on one room: 0.62 ms at 640 by 360, 0.58 at 1280 by 720, 0.50
at 1920 by 1080, and only at 2560 by 1440 does it rise, to 1.31. Cost barely
tracks geometry either: `studio8h` at 11k triangles costs 0.24 ms and
`pioneerworks` at 894k costs 0.62.

Against a 16.7 ms frame that is about twenty five times more headroom than the
museum needs on this machine. The low path halves it again: `pioneerworks` goes
from 390 calls and 894k triangles to 205 and 412k.

**What this does not tell us.** This is a fast desktop GPU. A mid range Android
is roughly ten to thirty times slower for this work, which puts it near the
budget rather than far inside it, and that is exactly why the low path already
drops shadows and antialiasing. Nobody has measured a phone. That number is
still the open question.

## Wave 1, shipped behind a self measuring guard

`src/fx.ts`: `EffectComposer` with `GTAOPass`, `UnrealBloomPass` at a high
threshold so only the practical lights bloom, `SMAAPass` to replace the
multisampling a composer gives up, and `OutputPass` to apply tone mapping and
colour space at the end. High path only. `?fx=off` disables it, `?fx=ao`,
`?fx=depth` and `?fx=normal` show the buffers.

Bundle grew 1,353,270 to 1,466,131 bytes, 8.3 per cent, and no new dependency:
all of it already ships inside three 0.185.

### Two things I got wrong on the way, both worth recording

**The debug view lied.** `?fx=ao` originally rendered the occlusion buffer
through the rest of the chain, so bloom and ACES tone mapping turned a buffer of
values near 1.0 into a white blob with a radial vignette. I read that as "the
pass is doing nothing" and went looking for a depth precision bug that was not
there. A debug view has to be the raw buffer, and it is now.

**`thickness` is the parameter that matters, and it is scale dependent.** The
shader only counts an occluder when the depth difference to the sample is less
than `thickness`, whose default is 1.0. The defaults assume a unit sized scene;
this museum is in metres and its rooms are twenty to a hundred across. With a 3
metre radius and a 1 metre thickness the shader rejects nearly every occluder it
finds and the buffer comes back blank. Thickness has to be at least the radius.
Settled on radius 3, thickness 8, distanceExponent 1, scale 2.2, samples 16.

The camera near plane also moved from 0.1 to 0.5. The skyline needs the far
plane at 1200, and a 12,000 to 1 depth range leaves little precision in the
twenty metres the visitor occupies. This did not turn out to be the cause of the
blank buffer, but it is still the right setting for a pass that reads depth.

### The cost, and why there is no number here

**I could not measure the post chain reliably and I am not going to publish a
figure I do not believe.** Repeating the identical room at the identical size
with no resize and no room change gave 0.66, 14.73, 2.36, 16.13 and 16.43 ms.
The plain render path measured stably and repeatably across dozens of runs; the
multi pass path does not, and the most likely reason is that `gl.finish()` does
not fence multi target work on this ANGLE and Metal backend, compounded by a
hidden pane whose compositor is not scheduling normally.

So the museum measures itself instead. Once the chain is running it watches real
frame times, skips 45 frames of warm up, averages the next 90, and if the mean
is over 22 ms, roughly 45 fps, it drops back to plain rendering for the rest of
the session. It re-judges on every room change, because the next room may be far
heavier than the one that passed, and once off it stays off so it cannot flap.
It logs the measured figure either way, so the first line in the console on any
device is the number this document is missing.

That guard is written but **unverified**, because frames do not run in the pane I
have. Open the museum and read the console: it prints `post chain on` or `post
chain off` with the milliseconds it measured.
