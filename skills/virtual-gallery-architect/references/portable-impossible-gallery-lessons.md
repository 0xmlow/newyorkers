# Lessons from portable impossible galleries

Use for source-only impossible-world builds with mixed generated materials and user asset packs.

- For an image-first commission, generate material images and environmental inserts before scene implementation, then inventory the existing pack before making substitute geometry. Separate new environmental imagery from immutable collection art and original marks.
- Give every chamber a visitor action and a named physical or optical mechanism. State whether an infinity is a shader window, a shrinking model, a cyclic translation, or a live camera portal. These are not interchangeable implementations.
- A constructed height map is a material-relief approximation. Pair it with the actual color-map scale and inspect in grazing light before calling the pair coherent PBR. Grayscale brightness of colored paint is not physical depth. Keep generated concept images out of architectural evidence claims.
- Test production scene factories with real geometry and the actual GLTF parser when GPU access is unavailable. Explicitly exclude pixel decoding and rendering from that evidence; follow with browser checks when authorized access exists. Do not route around a browser policy denial.
- Make navigation functions shared by runtime and tests. Check occupancy, forward/reverse cyclic transitions, arrival clearance, orientation/eye-height invariants and cooldown. Collision around dynamic props is a separate acceptance item.
- In a dependency-free static handoff, preserve the vendored engine version and licenses. A package-manager lockfile does not pin vendored files: include a separate checksum manifest for them.
- Treat embedded single-file editions as additional builds. Blob URL rewriting must cover module imports, JSON fetches, image inspection links and external GLB texture dependencies. Large embedded files need their own offline/mobile memory testing; do not infer portability from successful packaging.
- When a browser review is blocked, deliver exact reproducible source, CPU evidence and a prioritized visual acceptance route. Do not turn the inability to review into a claim of photorealism or measured performance.

## Department of Unlicensed New York: observed implementation lessons (2026-10-18)

- Put the first row of a folded-city cylinder beyond the visitor platform, not at a negative angular offset that lifts foreground blocks into the entrance view. Check the default eye-level shot before adding skyline density.
- Helper asset paths are contracts: this engine's `picture()` and `anamorph()` already prepend `assets/`; its direct TextureLoader does not. Passing a prefixed path to both helpers produced doubled paths during source review. Validate helper-expanded paths in the CPU harness.
- When manually stepping a hidden-tab render loop, wrap requestAnimationFrame in `() => frame()`; its timestamp must not be interpreted as an explicit test delta. Do not schedule a second animation loop from the manual stepping branch.
- Reset renderer.info after an early frame-budget return, not before it. Otherwise reading statistics between rendered frames misleadingly reports zero calls. Include all portal and postprocessing passes with autoReset disabled.
- Cache textures as texture objects by URL, with callbacks for late consumers, rather than relying solely on image caching. Batch only explicitly marked static boxes after actions are registered; exclude clicked meshes and animated objects. Bake local transforms once in a room-local group.
- A return-route test should use the same movement and threshold code as runtime. Walking from an unobstructed threshold approach verifies transitions; it does not prove a collision-free route across every furnished chamber. Record those scopes separately.
