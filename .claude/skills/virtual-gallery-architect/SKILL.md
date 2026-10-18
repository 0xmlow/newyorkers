---
name: virtual-gallery-architect
description: Design, refine, and extend immersive Three.js art galleries, virtual museums, and architectural exhibition environments, including realistic NYC places, architectural visualization, landmark-inspired rooms, photo-and-plan reconstruction, and agent handoffs. Use for navigable 3D interiors and exhibition spaces, not ordinary flat portfolio pages.
---

# Virtual Gallery Architect

Build the exhibition itself: architecture that makes a place recognizable, artwork that remains faithful to its source, and navigation that makes the collection accessible.

## Establish the project contract

Inspect the existing entry point, renderer lifecycle, environment factory, catalog, interaction controls, and hosting configuration before editing. Preserve the framework, lockfile, artwork identifiers, source originals, and existing access level. New room concepts are proposals unless implementation is requested. Do not create a new hosted project for an existing gallery.

For a landmark-inspired room, identify the reference era and three to five spatial signatures from primary references: silhouette, structural rhythm, material, eye-level furnishing, and characteristic view. Distinguish verified reference features from artistic adaptation. A location name on a sign does not make generic architecture authentic. Never present procedural approximations as scans, exact replicas, or architectural surveys.

## Choose the fidelity and delivery mode

For NYC work, read [nyc-place-authenticity.md](references/nyc-place-authenticity.md). Default to a coherent, reference-backed place when the user asks for realism. Distinguish an exact-site reconstruction, a typology-inspired fictional venue, and a branded reinterpretation. Missing measurements may be estimated and labeled; they do not justify claiming an exact replica. If no address is specified, choose a plausible typology and state the assumption while proceeding.

For photorealistic interiors, exterior context, or archviz renders, read [archviz-realism.md](references/archviz-realism.md). Preserve an existing stack. For a new project, choose the renderer from the deliverable: navigable web gallery, authored scene, stills, or film. Do not imply an offline render proves browser quality or that a generated concept image is a navigable environment.

## Design around the artwork

Keep original artwork files immutable. Catalog stable IDs, aspect ratio, provenance, and display-copy paths. Exclude unrelated files and duplicate exports deliberately, recording the scope. Preserve the aspect ratio and sRGB appearance on every surface, including billboards. In Three.js, a tinted material multiplies its texture: use white material color for faithful art display. Avoid ambient-light dependence for the artwork itself.

Define camera position, eye height, movement bounds, artwork mount transforms, inspection targets, and view corridors together. Keep art reachable with keyboard and touch. Provide an ordinary image index as a non-WebGL route to the collection. Separate venue selection from artwork pagination; do not imply that 76 art sets are 76 unique architectural designs.

## Build architecture in layers

Read [geometry-and-performance.md](references/geometry-and-performance.md) when creating or refining geometry.

Work from massing and openings to structure, material junctions, and details visible at visitor distance. Prefer actual holes and volumes over painted substitutes where silhouettes matter. Use profiled extrusions, lathes, curved sweeps, parametric surfaces, instancing, and authored GLB assets according to the object—not arbitrary polygon count.

Keep one intelligible architectural identity per room. For an MLow commission, let portals, original motifs, and controlled electric light connect the rooms while protecting landmark recognition. Do not apply that brand to unrelated clients.

## Transformative and impossible digital exhibitions

When the user asks for playful, expansive, surreal, or online-only spatial behavior, read [impossible-worlds.md](references/impossible-worlds.md). Establish a concept and visitor action for each chamber before increasing decorative density. Preserve source artwork while applying the commissioned style to the architecture and interactions. Honor source-only and portable-code delivery explicitly.

## Expand a collection or audit existing builds

For requests to add missing venues or audit multiple builds, read [collection-audit.md](references/collection-audit.md). Inventory place names and architectural subjects across registries before selecting new venues. Respect a requested small batch or token constraint: reuse the established engine and run one broad automated pass, then inspect the changed rooms and prioritize older findings.

## Validate the experience and deliver

Check all environment factories, animation ticks, transforms, indices, asset references, and finite vertex data. Run the project's type check and production build. Measure actual renderer statistics and inspect representative desktop/touch views using available browser tools within the user’s authorized task. Do not describe a Node geometry test as visual or GPU validation.

Review artwork legibility, view obstruction, spawn clearance, navigation, reduced motion, texture loading errors, and disposal when changing rooms. Refine failed evidence rather than doing repeated arbitrary polish passes.

For dynamic NFT, GLB, standalone HTML, video, or portable-world packaging, read [dynamic-nft-delivery.md](references/dynamic-nft-delivery.md).

For a Claude Code or other-agent transfer, read [handoff-contract.md](references/handoff-contract.md). Include the exact source, lockfile, assets, reproduction steps, validation evidence, reference ledger, limitations, and prioritized next work. Exclude credentials, caches, dependencies, and unrelated private files. Preserve hosted project identity as non-secret metadata, but require fresh authorized credentials for future deployment. Use the environment's hosting workflow and existing audience; do not silently make an owner-private gallery public.

## Photo and plan reconstruction

For faithful residential interiors or existing architecture reconstructed from photographs and floor plans, read [photo-plan-reconstruction.md](references/photo-plan-reconstruction.md). Source evidence takes precedence over older renderings and stylistic adaptation.

For image-first, source-only impossible galleries, also read [portable-impossible-gallery-lessons.md](references/portable-impossible-gallery-lessons.md) for material-depth provenance, cyclic navigation checks, vendored-runtime pinning and embedded-file validation.

For live portals, looping spaces, Ames rooms, rotating rooms, folding cities or interior mapped windows, read [online-only-illusions.md](references/online-only-illusions.md) first: the recipes, the numbers that worked, and how to prove a walk through every door when the browser tab is hidden.
