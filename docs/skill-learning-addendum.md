
## Department of Unlicensed New York: observed implementation lessons (2026-10-18)

- Put the first row of a folded-city cylinder beyond the visitor platform, not at a negative angular offset that lifts foreground blocks into the entrance view. Check the default eye-level shot before adding skyline density.
- Helper asset paths are contracts: this engine's `picture()` and `anamorph()` already prepend `assets/`; its direct TextureLoader does not. Passing a prefixed path to both helpers produced doubled paths during source review. Validate helper-expanded paths in the CPU harness.
- When manually stepping a hidden-tab render loop, wrap requestAnimationFrame in `() => frame()`; its timestamp must not be interpreted as an explicit test delta. Do not schedule a second animation loop from the manual stepping branch.
- Reset renderer.info after an early frame-budget return, not before it. Otherwise reading statistics between rendered frames misleadingly reports zero calls. Include all portal and postprocessing passes with autoReset disabled.
- Cache textures as texture objects by URL, with callbacks for late consumers, rather than relying solely on image caching. Batch only explicitly marked static boxes after actions are registered; exclude clicked meshes and animated objects. Bake local transforms once in a room-local group.
- A return-route test should use the same movement and threshold code as runtime. Walking from an unobstructed threshold approach verifies transitions; it does not prove a collision-free route across every furnished chamber. Record those scopes separately.
