# Geometry and performance decisions

## Choose the representation by the feature

| Feature | Useful construction | Common mistake |
|---|---|---|
| Arch, door, tracery | Shape with holes, beveled ExtrudeGeometry | Solid wall behind the supposed opening |
| Cornice / profiled bench | Swept profile or stepped solids | Stacking decorative blocks without a coherent section |
| Columns, urns, clock bases | LatheGeometry with deliberate section | Cylinder-only silhouettes at close range |
| Cable bridge | Sagging main curve, vertical hangers, diagonal stays | Sine waves unrelated to tower anchors |
| Vault / glasshouse | Parametric shell plus ribs and mullions | Flat translucent roof hiding the structure |
| Leaves / grasses | Thin curved surfaces or appropriate instanced assets | Repeated large spheres for every species |
| Repeated bolts / tiles | InstancedMesh; shared geometry and material | Thousands of independent draw calls |
| Hero sculpture / statue | Authored, licensed mesh with provenance when fidelity requires it | Claiming a coarse primitive assembly is an accurate sculpture |

Use bevels where their highlights and silhouette are visible. Choose radial segments from apparent size. Keep the texture budget independent of geometry density. Skybox images and panoramic photographs should not be described as modeled surroundings.

## Lifecycle and batching

- Batch only stationary compatible meshes. Bake their world matrices before merging. Normalize attribute layouts, including UVs and normals; preserve material boundaries.
- Keep animated water, moving cabins, interactive art targets, transparent sorting-sensitive surfaces, and differing material states outside indiscriminate merges.
- Cache materials by full relevant properties, not color alone. Instance true repeats. Compute instance bounds after setting matrices.
- Dispose geometry, materials, maps, instancing resources, animation loops, events and late texture callbacks on room changes. A late-loaded texture must be disposed when its destination room is already gone.
- Prefer one active environment and bounded artwork loading. Repeated room changes must not accumulate scenes or keep rendering discarded canvases.

## Budgets and proof

Set a target for the actual device and viewport; distinguish scene mesh count from GPU draw calls. As a starting review target, a gallery might use under 250 visible draw calls and several hundred thousand visible triangles on desktop, then reduce for mobile. These are review targets, not universal pass/fail claims. Transparent layers, shadow maps, texture memory and shader complexity can dominate polygon count.

A geometry smoke check proves finite data and executable scene construction. It does not prove visibility, recognizable landmarks, correct normals, light quality, touch usability or frame rate. Record these separately. When authorized, inspect a reference view and a close-up in each room and measure renderer.info and memory behavior across repeated transitions.
