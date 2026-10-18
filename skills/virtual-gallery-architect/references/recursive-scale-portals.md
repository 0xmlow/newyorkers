# Recursive scale portals, pockets and anamorphosis (learned on THE PIGEONHOLE, 2026-10-17)

Engine: `DOWN THE PIGEONHOLE 2026-10-17/src/engine.js` (MIT spirit, MLow's repo). Reuse it rather than rewriting.

## Rooms as pockets of one scene
Put every room in its own local frame, 400 m apart on x, and draw only the current room plus whatever a portal looks
at. Build rooms lazily, and build a portal's destination when its source room is entered. Keep the point lights in a
fixed pool (6) and reposition them per room and per portal pass; changing the light count recompiles every shader.

## Render target portals that change scale
- Source frame: an Object3D at the aperture centre, +z toward the visitor. Destination: `[x, y, z, yaw]` in the target
  room. M = dst * scale(k) * src^-1; the virtual camera is M * camera, decomposed so scale goes into near and far.
- Clip everything behind the arrival plane with `renderer.clippingPlanes` (or a custom plane: a dollhouse cutaway is
  `y <= ceiling`, which turns a portal into a live diorama of another room).
- Sample the target by screen position (`gl_FragCoord / targetSize`), so the aperture can be any shape: a disc on a
  pigeon's eye, a box (a vitrine), a sphere (snow globe, draw back faces only), a painting.
- Seamless entry: fly the camera to the aperture along its axis, shrink near to ~0.0005 on the last leg, and at the
  plane put the player exactly at the virtual camera. No fade needed. k = (width of the view you land in) / (aperture
  width): 1.5 cm eye onto a nave, k 140; a 30 cm globe onto a car, k 12.
- Height trick for recursive paintings: arrival y = EYE + k * (paintingY - EYE) makes eye height the fixed point.
- **Recursion:** screen space ping-pong feedback only works when the portal does not translate. A portal into its own
  room (an endless subway car, a painting that holds the room) must render levels deepest first: cam_n = M^n * cam,
  render level n with the aperture showing level n+1. Five levels plus fog is enough. Land the destination INSIDE the
  room (smaller k) or the far levels show the void above a cut-away building.
- Budget: the biggest portal every frame, the rest by age (whichever waited longest), 2 per frame desktop, 1 phone.
  On a phone, decorative portals onto unvisited rooms stay dark rather than build the room.

## Stencil pockets (glass bigger on the inside)
Pane writes stencil ref; the same geometry then writes depth at the far plane where ref matches (vertex shader
`z = w * 0.99999`, depthFunc Always); then the pocket contents draw with stencil Equal; then a sheen. Contents live in
room coordinates behind the wall. **Seal late arrivals:** plates and GLBs that load after the pocket is made must get
the stencil test too, or they draw over everything (or the backdrop hides them).

## Anamorphosis on real surfaces
Cut an image into a grid; raycast from the viewing spot through each cell against the room's meshes (skip art and
stickers); place the fragment on the first hit, facing the spot, scaled by distance. Aim down an open sightline (an
aisle) so fragments land at many depths; anything between spot and target that is too near hides fragments.

## Depth plates: where they fail
A plate seen from close and off axis (a side window 1.5 m from the eye) tears and smears. For windows use a curved
backdrop wall 20 to 30 m out with the image at its own aspect; keep plates for vistas seen roughly along their axis.

## Builders in parallel
One brief with the API, house rules and the bar (one named browser only illusion, 40 to 120 things, 2 to 4 eggs,
readable art, walkable, cheap), one file per room, each builder bundling into its own dev folder and shooting on its
own port. Five builders made nine rooms in about 35 minutes. Review every room's shots yourself afterwards.

## Traps
- Headless Chrome's shader and disk cache (`~/Library/Caches/Google/Chrome-headless`) filled the disk twice. Launch
  with `--disk-cache-size=1 --disable-gpu-shader-disk-cache` and a per run cache dir.
- Generated textures leak real brands (a fare card on a sticker wall and on receipts). Check every material image.
- Headless runs a few frames a second; test time based effects by forcing state.
