**The flower heads are not the problem. The problem is that the crowd reads as a flower texture, while the athletes read as painted mannequins.** The heads have more visual detail than the bodies supporting them, which makes the mismatch especially obvious.

These are ranked by damage to the finished images. Numbers below are starting targets for the generator, not measurements extracted from the contact sheet.

1. **The heads swallow the people. — Panels 1, 2, 4, 5**

   **What I see:** In the stands, overlapping petals erase shoulders, necks, and much of the clothing. Panel 2 reads as a floral wall with occasional legs underneath. The foreground concert crowd has the same problem.

   **Fix:** Normalize each source character against its body dimensions before scattering. Target a flower diameter around **0.85–1.05 times shoulder width**, including petals. For the worst oversized assets, try **0.7–0.8× current head scale**, uniformly, around the attachment point. Preserve the single open eye and flower silhouette. Render a seated row before changing all 13,000 instances.

2. **The athlete bodies look like articulated display mannequins. — Panels 1, 3, 5**

   **What I see:** Smooth tubular limbs, simplified shoulder transitions, mittenlike hands, and torsos with little convincing anatomy. Boxing makes this impossible to hide: the bodies occupy the foreground and have nowhere to conceal their shortcomings.

   **Fix:** **Replace the player body source.** Use a properly modeled and rigged human body with credible shoulders, clavicles, elbows, knees, hands, and pelvis. Build **three athletic proportion variants**, then pose those. Preserve volume during deformation and correct extreme shoulder/elbow poses before freezing. Subdivision will only make the current mannequin smoother.

3. **Painted body regions are being asked to impersonate clothing and equipment. — Especially panel 3; also 1 and 5**

   **What I see:** Hockey players look like blue or white bodies wearing black shorts. The goalie has two rectangular leg blocks. Basketball uniforms lack convincing separation from the body. Boxing gloves resemble inflated oval shells.

   **Fix:** Generate separate garment and equipment meshes. Basketball needs loose shorts, jersey armholes, hems, socks, and actual shoes. Offset garment surfaces roughly **8–20 mm** from the body, with more volume at shorts. Hockey needs padded torso silhouettes, bulky pants, gloves, skates with blades, and shaped shin protection. Replace the goalie blocks with tapered pads, knee breaks, straps, a blocker, and a catching glove. Preserve the flower head; fit any headgear around its attachment rather than concealing the artwork.

4. **Thirteen identities repeated at this scale become wallpaper. — Panels 2, 4, 6**

   **What I see:** The same pale flowers, hats, dark coats, and body silhouettes recur throughout the audience. Panel 6 reveals how small the vocabulary is relative to the arena.

   **Fix:** Keep the 13 identities, but bake **6–8 useful poses per identity** and **3–4 restrained clothing palettes** where materials permit. Use a seeded placement rule that rejects the same identity within the nearest **two seats** and discourages the same identity directly in adjacent rows. Vary overall scale by about **±5%**, not wildly. Pose and silhouette variation matter more than random colors.

5. **The seating disappears beneath an undifferentiated pile. — Panels 1, 2**

   **What I see:** The main aisle is legible, but individual seated occupants and rows are much harder to read. Petals merge across neighboring bodies. The crowd has density without enough individual structure.

   **Fix:** Place characters from explicit **seat anchors**, not merely points on a stepped surface. Start around **0.52–0.58 m seat spacing** and **0.85–0.95 m row pitch**, adjusted to the actual architecture. Seat pelvises on the cushions, fit knees within the row, and place feet on that row’s tread. Check neighboring head bounds and shoulder bounds. Remove occupants that cannot fit; a slightly thinner crowd will look more populated than a solid petal carpet.

6. **The action poses have no convincing weight or intention. — Panels 1, 3, 5**

   **What I see:** Basketball players have broadly raised arms and dangling feet rather than clearly differentiated game actions. Hockey players stand upright with sticks extended. The boxing exchange lacks a convincing guard, planted stance, and coordinated torso rotation.

   **Fix:** Author a small set of **whole-body action poses**, then vary within them. Hockey: start with **25–45° knee flexion** and **15–30° forward torso lean**. Basketball: distinguish shooter, defender, rebounder, and runner; give each a specific ball or opponent target. Boxing: stagger the feet, bend the knees, rotate pelvis and chest together, and keep the nonpunching glove guarding. Use foot IK and deliberate airborne poses. Do not independently randomize every joint.

7. **The head attachment exposes the kitbash. — Panels 1, 3, 5**

   **What I see:** Rear-facing basketball heads show conspicuous bright blue rounded centers. Boxing exposes bulky green collarlike forms below flowers. Some heads read as separate props mounted onto bodies rather than characters with coherent construction.

   **Fix:** Clean the extracted heads: delete leftover donor clothing and unwanted neck fragments. Close cut boundaries, then build one consistent attachment with a short neck or intentional calyx. Rework exposed backs into a finished flower structure with appropriate petal backs and sepals. Remove accidental saturated cap materials. Test every head from **front, profile, rear, and three-quarter views** before instancing.

8. **The cast’s clothing silhouettes are too lumpy and ambiguous for close shots. — Panels 2, 6**

   **What I see:** Several coats and outfits read as irregular masses beneath the flowers. At this sheet’s resolution, I cannot certify individual mesh defects, but I can see that sleeves, lapels, hands, and torsos often fail to separate clearly.

   **Fix:** Inspect the 13 masters individually. Delete floating fragments and fused accessories; replace malformed hands and shoes with clean shared assets. Rebuild the worst jackets as simple, readable garment shells. Reserve the **best 4–6 cleaned characters** for courtside and camera-facing foreground positions. Keep rough originals in distant rows. Decimation or smoothing alone will not repair confused anatomy.

9. **Hands do not convincingly operate the props. — Panels 3, 4, 5**

   **What I see:** Hockey sticks look lightly associated with the figures rather than gripped and controlled. The band reads as characters placed behind equipment more than musicians performing. Boxing glove shapes obscure believable wrist connections.

   **Fix:** Give each prop named contact transforms and solve hands to them. Hockey needs two distinct grip positions and blades contacting the ice except during an intentional action. Keyboardists need wrists over keys; guitarists need one hand at the neck and one at the strings; singers need a microphone aligned to the flower’s implied vocal position. Build proper glove cuffs. Delete props that cannot be made to connect convincingly.

10. **Materials make skin, fabric, and equipment feel like variations of the same plastic. — Panels 1, 3, 5**

   **What I see:** Broad, clean highlights and flat color regions dominate the athletes. The boxing skin and gloves are particularly synthetic. Fine flower detail sits beside almost featureless bodies.

   **Fix:** Separate material classes. Starting roughness ranges: **skin 0.4–0.55**, **matte cloth 0.65–0.85**, **glove leather 0.3–0.45**. Add subtle roughness variation and correctly scaled fabric normals; keep weave relief around **0.1–0.3 mm**, not visible ridges. Give skin restrained color variation and subsurface response at verified scene scale. Avoid random noise as a substitute for anatomy or garment construction.

11. **The audience behaves like one repeated orientation field. — Panels 1, 2, 4**

   **What I see:** Many eyes present toward similar directions, producing a repeated front-facing motif. The audience lacks enough local conversations, leaning, watching, and event-specific reactions.

   **Fix:** Aim the majority toward meaningful targets: ball, ring center, singer, or nearby scoreboard. Use approximately **70% watching the event, 20% turning toward companions, 10% reacting elsewhere**. Add head yaw variation around **±15°** and pitch around **±8°**, constrained by the body pose. Make reaction clusters rather than evenly distributing identical raised hands. The concert foreground should show plenty of finished flower backs.

12. **The lighting hides the bodies while preserving the repetitive flowers. — Panels 1, 2, 4**

   **What I see:** Dark clothes merge into the stands, while pale petals remain visible. That selectively amplifies the exact feature already dominating the crowd. Onstage, the luminous screen overwhelms the performers’ body detail.

   **Fix:** Add broad, motivated arena or stage illumination that separates shoulders, sleeves, and legs. Test a **0.5–1 stop lift on the crowd bodies** through lighting, rather than globally raising exposure and bleaching petals. Add restrained side or rim illumination to performers. Check a grayscale render: if you cannot distinguish shoulder–torso–lap shapes, the crowd will still read as flowers stacked on shelves.

**Flower-to-body proportion:** I would start with the entire flower, including petals, at **20–24% of the character’s final standing height**, or roughly **one flower diameter to 4.2–5 character heights**. For a final height of 1.85 m, that is approximately **0.37–0.44 m**, subject to the shoulder-width constraint above. Keep the eye large enough to read. Use the lower end for athletes, where body mechanics need prominence. These are art-direction targets, not a demand for ordinary human head proportions.

**For the players’ bodies: rebuild the source, then reuse it.** Keep the NEW YORKERS heads, create clean athletic bodies underneath, dress them with actual geometry, and author sport-specific poses. The current colored base mesh can serve as a blocking dummy or distant extra. It is not a viable close-up athlete asset, and further shader polish will not make it one.

Fix **one boxer, one hockey player, and one row of twelve spectators** first. Approve those at the final camera distance before regenerating the arena.