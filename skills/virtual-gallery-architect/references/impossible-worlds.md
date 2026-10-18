# Impossible worlds and authored exhibition systems

Use this mode when a user asks for a transformative, playful or impossible digital exhibition. Do not silently substitute a generic photoreal loft or scatter a few optical props through an unchanged white box.

## Concept before density

Give each chamber its own architectural logic, dominant event, scale, material behavior, and visitor action. Distinguish a new spatial experience from another collection page. Connect chambers with a legible route and an accessible room selector. More props alone do not make an exhibition conceptually richer.

For MLow work, read the supplied Impermanent Vision language and inspect its references. Use architecture-following paint fields, physical drips, thresholds and a narratively significant Eye Flower. Keep original posters, stickers, artwork, and logos neutral and aspect-correct. Separate original asset fidelity from stylized venue surfaces. Avoid turning authentic sticker motifs into substitute hero sculptures.

## Digital effects need implementation contracts

For each effect record: viewer trigger, physical geometry versus shader illusion, camera transform, collision behavior, reduced-motion behavior, and rendering budget. Examples include paired render-target portals, bounded SDF raymarch windows, camera-dependent scale, gaze-responsive sculpture and geometry-displaced water. Do not call camera-independent paintings live portals or describe bump maps as reconstructed scene depth.

A portal requires tested bidirectional transforms, a defined crossing plane and aperture, destination-side clearance, cooldown, clipping, and viewport/render-target restoration. Test that crossing lands inside the destination and that near-plane clipping keeps the destination interior. Transfer camera orientation and resynchronize navigation state; constrain before/after crossing deliberately. Artwork focus between disconnected rooms should use a jump or a portal-aware route, not interpolate through hundreds of metres of empty world.

Bound offscreen work: one or two visible passes, deliberate resolution tiers and no read/write texture feedback. Explain recursion depth. A visual infinite-room shader can use a finite raymarch budget; it is not traversable space unless traversal is separately implemented.

## Asset packs and surface provenance

Inventory supplied models and images before replacing them with primitives. Record runtime path, original source, hashes, native dimensions, normalization scale, and artistic role. Cache repeated GLB loads and share geometry/material resources; cloning a mesh does not require decoding its textures again. Handle late-load disposal and report failed assets.

Build relief from appropriate height/normal/roughness inputs. Mark procedural maps as authored approximations. Keep color maps in sRGB and data maps linear. Preserve poster aspect ratio and ensure applied posters/stickers cannot cover collection artwork. Use paper geometry, curled edges, offsets and plausible clustering instead of random flat decals everywhere.

Batch only static geometry. If the batch helper bakes world transforms into geometry, establish whether its destination group is identity-transformed to avoid translating remote rooms twice. Exclude animation, shader-local coordinates requiring object-space continuity, tracked eyes, water and interaction targets when appropriate.

## Validation and handoff

Separate mathematical portal/navigation checks, source asset checks, shader-source assembly, GPU shader compilation, visual review and measured frame time. A successful TypeScript build cannot prove shader correctness. A security-policy failure in browser access is a verification limit; do not route around it or present generated concepts as browser evidence.

For source-only requests, do not deploy. Deliver the runnable source, locked dependencies, actual assets, local commands, room/effect map, source provenance, current validation, skill snapshot and checksum-verified archive. Label previous live deployments as historical and local revisions as unpublished. Update stale venue counts and continuation instructions; an otherwise valid ZIP with obsolete instructions is an incomplete handoff.
