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
