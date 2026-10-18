# Architectural visualization and realism

## Establish scale and camera first

Use a documented world unit, preferably meters, and apply it consistently to assets, lights, movement, and collisions. Use measured dimensions when available; otherwise label estimates. Validate floor-to-floor height, wall thickness, door and window openings, structural spans, and art size before furnishing.

Set an eye-level camera around 1.6 m as a configurable starting point, then match the reference viewpoint. Record aspect ratio and whether field of view is vertical or horizontal; do not equate a lens focal length with field of view without sensor dimensions. For stills, preserve verticals when the reference does. Avoid ultra-wide framing that makes an implausible room appear spacious. Maintain separate camera settings for architectural stills and comfortable walking.

## Build a convincing section

A whitebox should already convey the place through room proportions, actual openings, floor levels, structural rhythm, and the view outside. Review this before expensive materials. Build visible wall returns, window reveals, slab edges, skirting, frame depth, and believable junctions. Give close silhouettes restrained bevels with appropriate normals. Do not bevel invisible geometry just to raise polygon counts.

Use measured-scale UVs. Brick courses, planks, stone slabs, and hardware should remain consistent across assets. Put variation where construction and use explain it: mortar recesses, sill runoff, floor traffic, metal edges, repairs. Avoid uniform dirt overlays, excessive damage, and identical repeated stains. Keep material boundaries and construction logic visible.

## Materials and light

Use a physically based material workflow supported by the renderer. Inspect base color, roughness, normal orientation and strength, UV seams, and repetition in neutral light. Most masonry, plaster, wood, and painted surfaces are dielectric; exposed metal and glass need their own treatment. Keep highlights readable without making every floor a mirror.

For Three.js, check the project's installed version against [color management documentation](https://threejs.org/manual/en/color-management.html). Color textures and data textures need different interpretation. Keep lighting calculations linear and apply display conversion once; test the complete postprocessing chain. Preserve source art and provide a neutral inspection view when gallery exposure or tone mapping changes its appearance.

Start with one explainable lighting condition: exterior daylight plus actual practical fixtures. Establish sun direction, opening size, exterior occlusion, exposure, and bounce before adding accents. Choose baked indirect lighting, probes, or a supported dynamic technique to fit the deliverable; an environment map alone does not establish indoor occlusion. Avoid hiding weak illumination under ambient light, heavy AO, bloom, fog, or crushed blacks.

Consult [Three.js shadows](https://threejs.org/manual/en/shadows.html) for the installed workflow. Allocate shadow detail near important contacts and openings; tune bias against both acne and detached shadows. Avoid counting the same illumination twice when combining baked and dynamic light. Check wall-floor contacts, frame shadows, window leaks, and floating props.

For offline renders, reduce noise while preserving texture and small art detail; check denoising for smears. For browser delivery, verify exported materials and lighting in the browser rather than assuming the authoring viewport transfers unchanged. Restrict costly transmission, reflection and shadow effects according to measured performance.

## Review from the visitor's position

Judge fixed camera views so iteration remains comparable. Capture an overview, entrance, window-facing view, artwork close-up, and a grazing material view where relevant. Compare with source photographs side by side. Diagnose in order: geometry and scale, camera, lighting and exposure, material response, details. Fix the largest discrepancy first.

For navigable delivery, inspect the same route on desktop and touch: spawn, turn, approach art, pass a doorway, traverse the room, return, and switch venues if supported. Verify collisions against floors and walls, stairs or ramps, near clipping, movement speed, focus, and touch controls. Keep art inspection usable without requiring precise first-person movement. Respect reduced motion and retain a non-WebGL collection route.

Select a device and resolution target before promising performance. Measure frame timing on that target after warmup, note device/pixel ratio and test route, and report limits if unavailable. Use adaptive resolution, texture compression where supported, instancing, culling, and reduced mobile effects based on measurements. Offline render quality and desktop frame rate are separate evidence.

## Completion evidence

Report briefly: intended place and fidelity; reference-backed features and assumptions; representative rendered views; navigation and performance checks actually run; remaining limitations. A build passing is not visual validation. If rendering is unavailable, deliver the work and explicit unverified items without claiming photorealism. Do not promise “best possible” as a verified quality level.
