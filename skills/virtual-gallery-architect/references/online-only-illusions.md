# Online only illusions: working recipes (learned on BIGGER ON THE INSIDE, 2026-10-17)

Read before building a portal, a looping space, a forced perspective room or a rotating room. Every recipe here was
built, broken, fixed and checked in a browser; the numbers are the ones that worked.

## Live portals (doors that show and lead somewhere else)
- Frame A in room A with +z pointing into A; frame B in room B with +z into B. Virtual camera = B . Ry(pi) . A^-1 .
  camera. Use three's `CameraUtils.frameCorners` with the doorway corners carried through the same transform, and set
  `camera.near` to the eye's distance to the far doorway plane before calling it: that is the oblique clip for free.
- The quad then samples its render target with plain UVs (the projection frames the doorway exactly).
- Two render targets per portal, draw into the one not on screen (ping pong). Portals that see each other, or the
  same room seen through itself (a street that loops), then recurse one level per frame without feedback.
- Crossing: test the segment from last frame to this frame against the doorway rectangle in A's space; carry
  position by the matrix and yaw by B.rotY + pi - A.rotY. Push the quad about 0.45 m behind its doorway while the
  eye is within reach so the near plane never clips it.
- Clamp the quad's HDR output (about 1.1): a bare bulb through a doorway otherwise floods the room with bloom.
- Anything hanging in an aperture (paint drips, signs) is seen on both sides, because the far side draws it too.
- Budget: the two nearest visible portals every frame, the rest every sixth; view only portholes at 256 px.
- Round apertures (dryer windows, train hatches) are a discard in the quad shader; a round hatch centred on the axis
  of a rotating room stays a doorway at any angle.

## Spaces that repeat
- Penrose stair: build the floor several times (7 copies, 3 m apart). When the eye passes one floor up, move it
  down one floor (hysteresis: up at +3.0 m, down at -0.35 m) and reassign whatever must look continuous (the art on
  each copy is indexed by floors climbed + copy). Put interactive portals on one copy only.
- A street that loops: the far corner is a portal onto the near corner of the same room. Things beyond the far
  portal never render directly; place hero objects before it (an Eye Flower then repeats down the street).

## Forced perspective
- Ames room: model the ordinary rectangle, then push every vertex along its ray from the peephole E:
  P' = E + (P - E) s(x), with s = 1.15 - 0.15 x (far left 1.6x away, far right 0.7x). Subdivide planes (the warp
  is not linear in x). Regular patterns (checker floor, striped wallpaper) are what sell the rectangle. Two identical
  unscaled figures in the far corners become giant and tiny. Walking: invert x' = x s(x) (a quadratic) to find the
  floor height and to test where the visitor may stand.
- Haunted swing: rotate the room, not the visitor. Keep the eye on the rotation axis and let riders, lights and
  posters ride along.
- A city folding overhead: instance buildings on the inside of a cylinder (point on the circle, local up toward the
  axis). Check the sign so it curls in front, thin the fog until the overhead rows survive it, brighten the avenues.

## Windows full of rooms
- Interior mapping from a one point perspective image whose back wall fills the middle half of the frame: cast the
  view ray into a box behind the window, hit point at depth z maps to u = 0.5 + 0.5 (x / hx) D / (D + z). One atlas,
  one instanced draw per facade. Crops of one point perspective concept art work as interiors.

## Look and cost
- Static batching by material after a room is built (moving parts opt out with `userData.dynamic`): the block went
  from 6,225 to 1,372 draw calls a frame across all passes. Measure with `renderer.info.autoReset = false`, reset at
  frame start; otherwise the number is only the last post pass.
- GTAO draws the scene again with a normal material: hide transparent objects (steam sprites, light pools,
  stickers) during that pass or they become dark cards.
- An outdoor HDRI (a lit skyline) reflected indoors reads as haze on metal and glossy floors: set
  environmentIntensity per room (0.35 outside, 0.08 inside), also while a portal draws that room.
- Wet street: three's Reflector as an additive overlay with a noise puddle mask, ripples, a 5 tap blur and fresnel
  gives the long night reflections an environment map cannot.
- Contour lines in a shader: distance to the nearest line is `0.5 - abs(fract(g) - 0.5)`; a line is where that is
  below fwidth. Getting this backwards floods the whole surface.

## Proof
- A hidden browser tab gets no animation frames. Expose a step function (`advance(ms, key)`) that runs the world loop
  by hand and drive real walks through every door with it; check room id and position after each.
- Headless Chrome on the GPU (`--use-angle=metal --enable-gpu --virtual-time-budget=14000 --screenshot`) gives
  stills of every viewpoint; run them one or a few at a time (many in parallel crash), and keep stills out of git.
- A preview server sandbox may not read the Desktop: stage the build elsewhere with APFS clones.
- Image generation through the Codex CLI (`codex exec`) needs stdin closed (`< /dev/null`) or it waits forever.
