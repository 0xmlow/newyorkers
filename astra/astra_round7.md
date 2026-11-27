The flower heads are not the problem. The environment lacks the construction detail, material variation and believable human placement needed to make them feel real. **Penn currently reads as a concrete parking garage with a train prop.** Adding more scattered garbage will not fix that.

These are ranked by damage to the overall impression. Numbers are starting values for a physically scaled scene; colours are sRGB.

1. **The station surfaces have almost no material identity. — Panels 1–3**

   **What I see:** Columns, retaining walls and ceiling share a broad, muddy concrete appearance. The platform is a nearly uniform grey sheet. Panel 3’s brown walls look like one texture covering a simple architectural shell.

   **Fix:** Give each surface its own material and mapping scale. Use concrete scans covering **2–4 m**, floor aggregate at **2–8 mm**, and separate patches **0.3–1.2 m** across. Concrete roughness: **0.75–0.95**; floor: **0.65–0.85**, with local polished areas around **0.4–0.55**. Keep bump shallow, roughly **0.3–1.5 mm**. Add low-frequency colour variation of **±8–12%**, independently of the fine texture. Big stains, medium repairs, fine grain: all three scales are needed.

2. **The station lighting is too evenly helpful. — Panels 1–3**

   **What I see:** Bright white strips sit above broadly legible grey surfaces. There is little distinction between light directly beneath a fixture, light between fixtures, and the dark track bed. Panel 3 has the illumination of an inexpensive showroom.

   **Fix:** Reduce ambient/world contribution until it stops filling every recess. Use actual fixture housings and downward-facing rectangular sources, approximately **1.2 × 0.08 m**. Start around **1,500–3,000 lumens per fixture equivalent**, then tune exposure to produce roughly **100–200 lux** on the platform. Mix predominantly **3,500–4,100 K** fixtures with a few **3,000 K** replacements. Aim for approximately **3:1** illumination variation across the platform and a track bed **1.5–2.5 stops darker**. Do not simply turn the whole image yellow.

3. **The station is missing the layers of construction that make infrastructure believable. — Panels 1–3**

   **What I see:** Huge uninterrupted ceiling planes, simple rectangular columns, flat retaining walls and a few isolated cabinets. These spaces feel freshly extruded.

   **Fix:** Add a restrained infrastructure kit: **25–75 mm** conduit, **150–400 mm** cable trays, junction boxes, brackets, access covers and structural joints. Run services along plausible routes with supports every **1.2–1.8 m**. Give columns base repairs, seams and **3–8 mm** edge bevels. Break the platform edge into concrete sections **1.5–3 m** long, with joints, chips and drainage details. Detail the nearest **15–20 m** heavily; distant geometry can stay simple.

4. **The train reads as a generic silver toy. — Panels 1–2**

   **What I see:** A broad, nearly featureless front, two bright headlights, dark horizontal slots and uniformly corrugated metal. The silhouette is doing almost all the work. The visible front lacks mechanical depth.

   **Fix:** Pick one specific commuter train type and build its recognizable front arrangement. Add recessed cab glazing, rubber seals, destination display, light housings, coupler and underbody equipment. Recess windows **30–60 mm**; give seals **15–25 mm** width. Stainless steel should use metallic **1.0**, roughness roughly **0.28–0.45**, with directional brushing and roughness variation. Reduce lower-body brightness **10–20%** with brake dust. Model fluting to the chosen vehicle’s dimensions rather than using equally strong ribs everywhere. Resolve the front before adding more carriage length.

5. **The arena crowd becomes a repeated pale texture. — Panels 4–8**

   **What I see:** The upper stands turn into white flower noise. Similar heads, similar brightness and similar spacing make the repetition obvious. Panel 4 exposes angular petals and intersecting silhouettes at close range.

   **Fix:** Create **12–20** recognizable character variants, with **4–6** seated poses and controlled clothing colour variation. Keep the single flower head and eye. Randomize overall scale only **±5–7%**, head direction **±20°**, and body lean **±8°**. Leave **5–10%** of seats empty in small clusters. Use detailed geometry within **8 m**, simpler meshes from **8–25 m**, and seated impostors beyond that. Darken the mass through clothing and lighting; do not arbitrarily grey out the flowers.

6. **Bodies do not convincingly inhabit chairs or the floor. — Panels 4–7**

   **What I see:** Courtside figures hover, perch or pass through furniture. The coach in panel 5 looks suspended above the sideline. Panel 4 has crowded body/head intersections. These errors destroy scale immediately.

   **Fix:** Generate seating from attachment points: pelvis, feet, backrest and armrests. Use seat heights around **0.43–0.47 m**, then fit the pose to each chair. Ground soles within **5 mm** of the floor and solve knees with two-bone IK. Space folding-chair centres around **0.55–0.60 m**, adjusting for the actual character envelope. Use seated flower-head collision proxies, not just human shoulder widths. Add contact shadows with a short **0.1–0.3 m** reach.

7. **The grime and garbage look distributed, rather than caused. — Panels 1–2**

   **What I see:** Small white scraps are sprinkled across the platform. A few larger props sit conspicuously apart. The floor between them remains clean and uniform. The dirt does not explain where people walk, where water runs or where cleaners cannot reach.

   **Fix:** Use masks based on architecture. Put roughly **70%** of litter near column bases, wall junctions and sheltered edges; keep the main walking route comparatively clear. Per visible **20 m** of platform, start with **15–30** small scraps, **3–5** cups or containers and **2–4** larger discarded objects. Add flattened gum **10–35 mm** wide, heel scuffs, spill halos **0.2–0.8 m** across and dirt bands **50–150 mm** deep around bases. Place moisture under plausible leaks. More garbage everywhere would make this worse.

8. **The track bed looks like a clean model railway. — Panels 1–2**

   **What I see:** Repetitive brown rails and ties sit against unusually clean grey surroundings. The rail surfaces lack a convincing difference between polished running surfaces, rusty sides and accumulated track dirt.

   **Fix:** Split rail materials: polished running head, rough rust-brown web, dark greasy fasteners. Use approximately **#777B7C** for the head, **#50382B** for oxidized sides and **#252321** for dirty recesses. Add clips/plates at every modeled sleeper, irregular dust deposits and drainage/cable details appropriate to the chosen track construction. Do not automatically dump ballast into the scene. Use **10–30 mm** dirt/debris variation, not uniformly displaced gravel. Verify standard-gauge spacing at **1.435 m** if this is standard-gauge track.

9. **The wayfinding does not establish a real place. — Panels 1–3**

   **What I see:** Track/platform identification is sparse and tiny. Panel 3’s enormous dark sign and departures board contain very small information, leaving broad blank areas. The train platforms lack a convincing rhythm of operational signage.

   **Fix:** Build a consistent sign family: track numbers, directional signs, exit information, platform identifiers and safety notices. Put repeated identification every approximately **10–15 m** where sightlines justify it. Use primary characters around **100–150 mm** high for signs viewed across the space, secondary text **35–60 mm**. Generate sharp vector-derived textures at **2K–4K**. Break panel 3’s oversized blank board into proportioned sign modules. Add **2–3** functional notices near each principal stair/access point, with mounting hardware.

10. **The court contains visible unfinished geometry and weak object contact. — Panels 5–7**

    **What I see:** Panel 7 has isolated dark rectangular objects on the playing floor. Courtside chairs look thin and provisional. Several figures and objects have insufficient grounding.

    **Fix:** Remove or properly identify every stray floor object before polishing materials. Give folding-chair tubing a real **20–25 mm** diameter and slats actual thickness. In three.js, concentrate a **2K–4K** shadow map on the playable court, with a small shadow-camera volume rather than covering the whole building. Tune bias at scene scale until feet connect without acne. Add restrained contact AO; avoid black halos around every object.

11. **The arena illumination does not separate the game from the building. — Panels 4–7; panel 8 is closer**

    **What I see:** The WebGL crowd competes with the court in brightness and detail. The eye lacks a clear destination. Panel 8 has more useful contrast, but the foreground character blocks a large part of the action.

    **Fix:** Make the court approximately **1.5–2 stops brighter** than the upper seating. Use **8–12** overhead lighting groups around **4,300–5,000 K**, baking most architectural illumination and reserving live shadows for a few important sources. Reduce ambient fill. Keep the ribbon boards from lighting the entire bowl uniformly. Use one consistent tone-mapping and colour-space pipeline. Preserve the wood’s midtones instead of bleaching it to make the court appear bright.

12. **The concourse floor and arena floor lack convincing use at human scale. — Panels 3, 5–8**

    **What I see:** Panel 3’s tile pattern reads as a repeated texture. The basketball floor is broadly attractive but too uniform in reflectance, particularly in the WebGL views.

    **Fix:** For the concourse, use a measured tile module—start around **300 × 600 mm**—with **3–5 mm** grout, subtle per-tile colour changes of **±3–5%**, and occasional replacement tiles. For the court, use boards around **55–75 mm** wide with staggered lengths, roughness **0.25–0.4**, and restrained varnish reflections. Add fine shoe marks and cleaning streaks, strongest around the keys and sidelines. Neither floor needs deep bump mapping.

A convincing Penn Station track level needs **specific, accumulated infrastructure**: patched concrete; dirty platform edges; tactile warning surfaces where appropriate to the platform being represented; soot-darkened recesses; steel, conduit and service hardware; rail-head polish against dirty track components; repeated track and exit signage; mismatched replacement fixtures; and wear concentrated along real paths of movement. Your sheet has the broad enclosure and some litter, but very little of that accumulated history. Penn also varies by platform and renovation era—choose one coherent reference condition rather than combining every “gritty subway” cliché.

The three best returns for the least work:

- **Rebuild the station material hierarchy.** Separate concrete, platform, track dirt and steel; add large stains and edge-based grime. This changes almost every pixel without rebuilding the scene.
- **Rebalance lighting in both environments.** Darker track recesses, more localized station fixtures, brighter court relative to seating. Mostly parameter changes, substantial improvement.
- **Fix placement and remove obvious errors.** Ground feet, fit seated poses, resolve intersections and clear the unexplained court blocks. These defects announce “unfinished game” faster than any missing texture.