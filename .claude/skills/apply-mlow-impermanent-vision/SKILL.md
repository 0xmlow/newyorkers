---
name: apply-mlow-impermanent-vision
description: Apply the built in MLow Impermanent Vision art language to images, graphic novels, covers, fashion graphics, environments, and branded visual systems. Use when the user requests the MLow style, Impermanent Loss, Transdimensional Trippers, trippy liminal space, Open Eye Flowers, liquid contour fields, paint drip, psychedelic infrastructure, or a new work that should feel native to MLow.
---

# Apply MLow Impermanent Vision

Create work that feels authored inside the MLow world. Preserve the subject and purpose of the requested artifact while translating its atmosphere, materials, and spatial logic.

## Begin every visual task

1. Read `references/style-language.md`.
2. Inspect the supplied subject or edit target.
3. Assign every input image a role: edit target, composition anchor, style reference, or supporting insert.
4. Choose one intensity: Whisper, Bloom, or Melt.
5. Preserve text, identity, anatomy, logos, and narrative continuity unless the user explicitly asks to change them.
6. Work non destructively. Create a new version and never replace source art by default.

## Choose the intensity

Use Whisper for text heavy pages, product layouts, and scenes where legibility leads.

Use Bloom for covers, campaign art, chapter openings, and hero moments.

Use Melt for dream sequences, portals, transitions, climaxes, and artwork where reality is allowed to fail.

## Build the image

Use ImageGen for new raster artwork, style transfer, and environmental transformation. For edits, repeat the invariants in the prompt and preserve the edit target aggressively.

Use the bundled assets as style references:

* `assets/reference-liquid-threshold.jpg`: electric contour rivers, cosmic scale, and threshold composition
* `assets/reference-brainmelt-valley.jpg`: liquid terrain, impossible skull architecture, and chromatic split
* `assets/reference-cosmic-skeleton.jpg`: vertical drip fields, surreal monument, and earthly witness
* `assets/reference-liminal-figure.jpg`: solitary figure, dark corridor, and luminous exit
* `assets/reference-open-eye-flower.jpg`: the Open Eye Flower as living witness
* `assets/reference-blue-portal.jpg`: navy void, cyan energy, and red paint current
* `assets/open-eye-flowers.png`: reusable transparent Open Eye Flower motif sheet

For controlled page treatment, use `scripts/style_page.py`. Keep generated lettering outside the raster art whenever practical.

## Require these signatures

Include at least three signatures in a finished MLow transformation:

* A liminal threshold such as a corridor, bridge, tunnel, doorway, stair, portal, or impossible opening
* Liquid contour fields that bend around forms and behave like wet topography
* Paint movement such as gravity drips, marbling, flowing veins, or pooled color
* An Open Eye Flower used as witness, warning, portal, or sovereign focal symbol
* A solitary human figure, silhouette, or observer facing an environment larger than the self
* A dark void cut by electric cobalt, cyan, violet, hot pink, bone white, and restrained copper

## Protect the MLow character

Keep the work materially painted. Make linework wrap around architecture, bodies, and terrain instead of floating as a filter.

Keep focal hierarchy clear inside dense detail.

Keep Open Eye Flowers uncanny, botanical, and watchful. Never make them cute, decorative, or cartoonish.

Avoid generic rainbow psychedelia, soft fantasy fog, festival graphics, random fractals, arbitrary skulls, and evenly distributed neon.

Avoid direct imitation of another artist. Use only the bundled MLow language and the current subject.

## Navigable environments and code

For virtual galleries and interactive worlds, read [spatial-implementation.md](references/spatial-implementation.md). Apply the language to architecture and behavior while preserving the fidelity of original artwork and supplied brand assets.

## Prompt and quality control

Read `references/prompt-recipes.md` when generating or editing images.

Before delivery, confirm:

* The original purpose and subject remain readable
* The threshold creates spatial tension
* The contour field follows form
* Paint drip feels physical
* The Open Eye Flower has a narrative role
* Blacks remain deep and highlights remain controlled
* Text and logos are untouched or rebuilt cleanly after image generation
* The result is saved as a new file

