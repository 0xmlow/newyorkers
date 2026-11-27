**The biggest improvement will come from correcting visual hierarchy: a bright court, believable athletes, a darker crowd with individual behaviour, and a scoreboard that sits within the architecture.** Right now, the white flower heads and luminous scoreboard dominate almost every image. More geometry alone will not solve that.

Below is a code-oriented specification. Dimensions marked **proposed** are exact starting parameters for your model, not surveyed measurements. The exterior massing coordinates need alignment against a georeferenced site plan before you call the result an accurate reconstruction. Material values and light powers are starting values to validate in renders.

## A. Ranked critique of the sheet

“Gain” means expected perceptual improvement, not a measured percentage.

| Rank | What makes it read fake | Implement this fix | Expected gain |
|---:|---|---|---|
| **1** | **The audience becomes a continuous white floral texture.** Individual people disappear, particularly in the wides. | Seat most spectators, vary posture, preserve dark clothing and visible seat gaps, reduce bowl illumination. Aim for court-to-crowd illuminance around **10:1** during play. | **Transformative:** restores scale, depth and a recognizable arena atmosphere. |
| **2** | **The scoreboard underside is enormous, bright and visibly stretched.** It resembles a luminous funnel. | Replace with a restrained **14 × 10 × 7 m** assembly; dark underside; one **4.5 m** logo; separate planar, cylindrical and underside UVs. | **Transformative:** removes the largest visual distraction in five views. |
| **3** | **Players have mannequin anatomy and weightless poses.** | Introduce skinned athlete bodies, shoulder/hip rotation, planted feet, believable hand contact and asymmetric action poses. | **Transformative** in courtside and baseline shots. |
| **4** | **Nearly everything receives similar soft illumination.** | Replace the giant overhead source with crossed directional sports fixtures. Establish court, audience and roof as three distinct exposure zones. | **Very high:** creates photographic depth immediately. |
| **5** | **The entire crowd is standing at the same emotional intensity.** | Baseline state: **82% seated, 10% leaning, 5% standing, 3% circulating**. Trigger local reactions from plays. | **Very high:** makes the building feel occupied rather than populated by instances. |
| **6** | **White petals lose surface detail.** | Check cast textures for baked illumination; reduce excessive diffuse brightness; add subtle translucency and roughness variation. Fix lighting before recolouring canonical artwork. | **High:** recovers the defining flower-eye identity. |
| **7** | **Jerseys look like coloured body shells.** | Separate garment meshes, armhole thickness, collar binding, seams, numbers, fabric normals and restrained cloth motion. | **High:** turns generic figures into teams. |
| **8** | **The architecture repeats too uniformly.** | Add actual section breaks, vomitories, service doors, different suite fronts, structural thickness and the two suspended bridge structures. | **High:** gives the bowl a recognizable construction logic. |
| **9** | **The court reads as uniformly polished pale plastic.** | Reduce broad coating haze; use physical-size maple strips, restrained grain and local wear. Break reflections through roughness, not exaggerated bump. | **High:** especially valuable in low cameras. |
| **10** | **Logos repeat without hierarchy.** | Keep one centre mark, two baseline wordmarks and two apron marks. Reserve most ribbon content for score, section identity, artwork and short messages. | **High:** makes the branding feel commissioned. |
| **11** | **The basketball action has no clearly readable cause and effect.** | Build stills from complete actions: plant → load → release → follow-through → reaction. Position all ten players according to a play. | **High:** creates an actual sporting moment. |
| **12** | **Courtside lacks operational clutter.** | Add scorer’s equipment, towels, water bottles, cameras, monitors, cable ramps, substitution chairs and varied bench poses. | **Medium–high:** provides essential familiar scale cues. |
| **13** | **The ceiling is a smooth dark dish with repeated sticks and lights.** | Give cables, compression members, catwalks, maintenance platforms, hoists and ducts distinct profiles and attachment points. | **Medium–high**, especially for rafters and bridge views. |
| **14** | **Too many compositions use an expansive architectural viewpoint.** | Establish a **40–55 mm** broadcast master, **85–135 mm** player coverage and **24–28 mm** architecture views. Reserve ultrawide shots for deliberate spectacle. | **Medium–high:** stops athletes and props looking miniature. |
| **15** | **Surfaces are either clean or uniformly textured.** | Place wear where contact occurs: stair nosings, handrails, seat edges, tunnel corners and floor traffic paths. | **Medium:** useful after the larger corrections. |

## B. Exterior and surroundings at real size

### Coordinate contract

Use one world coordinate system:

- **Origin:** horizontal centre of the arena drum.
- **X:** east, along the Manhattan cross-street grid.
- **Y:** grid north, toward 33rd Street.
- **Z:** up; **street datum = 0 m**.
- Proposed arena playing surface: **Z = +14 m**.
- For interior specifications below, **`h` means height above the playing surface**: world `Z = 14 + h`.
- Court long axis: **X**.

This is a Manhattan-grid coordinate system. Apply a separate geographic rotation when matching maps or calculating solar positions.

The documented drum diameter is approximately **425 ft = 129.54 m**. The planning record also places the arena on the western portion of the superblock, with the eastern entrance connection passing through the adjacent office development. Preserve that arrangement. [NYC planning record](https://www.nyc.gov/assets/planning/download/pdf/applicants/env-review/eas/13dcp053m_eas.pdf)

### Proposed massing manifest

Coordinates are object centres in metres; `Z base` is the bottom elevation. These are **adjustable blockout estimates**, except the documented drum diameter.

| Object | Centre X, Y | Footprint / dimensions | Z base → top | Treatment |
|---|---:|---|---|---|
| Arena drum | **0, 0** | **Ø129.54 m** | **+3 → +46 m** | Ribbed precast shell |
| Arena podium | **0, 0** | **134 × 134 m**, trimmed to circulation | **0 → +8 m** | Concrete, service openings, glazed access |
| Arena roof | **0, 0** | **Ø126 m** | **+43 → +46 m** | Shallow structural roof; no decorative dome |
| East entrance connector | **+78, 0** | **28 × 42 m** | **0 → +14 m** | Glazed hall linking arena and eastern frontage |
| PENN 2 tower proxy | **+110, 0** | **38 × 112 m** | **0 → +125 m** | Curtain wall; verify exact height and setbacks |
| PENN 2 frontage/base proxy | **+125, 0** | **72 × 131 m** | **0 → +19 m** | Deep entrance recesses and projecting base |
| Seventh Avenue forecourt | **+166, 0** | **12 × 130 m** | **0** | Paving, entrances, queues |
| Main branded canopy | **+166, 0** | **10 × 30 m** | **+7.5 → +8.3 m** | Metal soffit, restrained LED edge |
| PENN 1 tower proxy | **+35, +130** | **62 × 58 m** | **0 → +228 m** | Northern skyline anchor; verify footprint |
| Moynihan/Farley massing proxy | **−176, 0** | **154 × 136 m** | **0 → +27 m** | Stone perimeter, roof volumes set back |
| South-side building group | **+15, −115** | **6 separate parcels**, widths **14–35 m** | **0 → +22–65 m** | Varied masonry and rooftop equipment |
| Eastern background group | **+230, +15** | **4 separate parcels**, widths **25–55 m** | **0 → +35–160 m** | Contextual proxies until mapped |

The eastern frontage should reflect the redeveloped curtain wall and substantial projecting base. Its documented blockfront is approximately **131 m** long; it should not become a freestanding arena entrance in an empty plaza. [Owner’s redevelopment description](https://www.vno.com/portfolio/development)

**Street blockout:**

- Eighth Avenue centreline: **X = −91 m**.
- Seventh Avenue centreline: **X = +184 m**.
- 31st Street centreline: **Y = −82 m**.
- 33rd Street centreline: **Y = +82 m**.
- Avenue carriageway starting width: **24 m**.
- Cross-street carriageway starting width: **18 m**.
- Sidewalk clear widths: **4–8 m**, resolved against actual frontage.

These street offsets are massing parameters, not cadastral coordinates.

### Drum construction

Generate the facade through an angular module system:

- Circumference at the documented diameter: approximately **407 m**.
- Start with **256 vertical modules**, average pitch **1.59 m**.
- Give modules **0.12–0.25 m** relief, **0.025 m** joints and **0.008 m** edge bevels.
- Interrupt the system at entrances, vents, service openings and structural joints.
- Precast base colour: **`#AFAAA1`**.
- Recesses: **`#77766F`**.
- Roughness: **0.76**.
- Aggregate normal amplitude: **0.001–0.003 m**.
- Low-frequency colour variation: **±4%**, organized by panel.
- Runoff staining: localized below joints and coping; opacity **0.04–0.12**.
- Metal frames: **`#343A40`**, metallic **0.85**, roughness **0.36**.
- Entrance glass: IOR **1.45**, roughness **0.035**, physical thickness **0.02 m**.

Keep most of the facade mineral and subdued. Blue belongs to selected entrances, light accents and information surfaces.

### Walkway around the drum

Build a **continuous pedestrian route composed of connected segments**, adapting to the podium and entrance connector.

- Initial route centre radius: **68.5 m**.
- Clear width: **5 m**, widening to **8–12 m** at gathering points.
- Maintain at least **3 m** clear through circulation pinch points in the artistic model.
- Paving modules: **0.6 × 1.2 m**.
- Paving colours: **`#858681`**, **`#6E716F`**, **`#A7A79F`**.
- Paving roughness: **0.78** dry; **0.30–0.45** for selectively damp areas.
- Drain slots: **0.025 m** wide at transitions.
- Rail height where needed: **1.1 m**.
- Handrail diameter: **0.045 m**.
- Bollards: **0.18 m diameter × 0.9 m high**, **1.5 m** centres where appropriate.
- Proposed decorative blue inlay: **0.06 m** wide, interrupted at crossings.

Do not force a perfect annulus through buildings or invent an elevated ring without supports. Where you add an MLow promenade, identify it as a creative intervention.

### Entrances, signage and Penn Station

Use separate sign hierarchies:

1. **THE GARDEN:** architectural destination.
2. **NEW YORKERS / BY MLOW:** artistic identity.
3. **PENN STATION:** transport wayfinding.
4. Entry, section and accessibility information.

**Arena signs:**

- Primary letters: **1.4 m** cap height, **0.12 m** depth.
- Secondary wordmark: **0.35 m** cap height.
- Canopy LED strip: **0.45 m** high.
- Art screens: **3 × 5 m**, maximum **4** on the main entrance sequence.
- Screen brightness target: **150–300 cd/m²** at night, **800–1,500 cd/m²** for daylight scenes.

**Proposed entrance anchors:**

| Entrance | X, Y, Z | Model |
|---|---:|---|
| Seventh Avenue / 32nd Street station access | **+166, 0, 0** | Recessed entry with escalators, stairs and lift |
| Northeast station access | **+151, +66, 0** | Glazed entrance volume |
| Southeast station access | **+153, −66, 0** | Street-level entry into south concourse |
| Northwest station access | **−70, +60, 0** | Sidewalk entrance connected underground |
| Southwest station access | **−70, −60, 0** | Secondary access proxy |

The Seventh Avenue/32nd Street entrance is a real station access point; use its documented entrance photographs to refine the blockout. [Amtrak entrance redevelopment](https://media.amtrak.com/2023/11/amtrak-and-vornado-realty-trust-transform-7th-avenue-and-32nd-street-new-york-penn-station-ada-entrance/)

**Underground model, proposed elevations:**

- Upper concourse floor: **Z = −5 m**.
- Lower concourse floor: **Z = −9 m**.
- Visible track/platform fragment: approximately **Z = −13 m**.
- Main east–west concourse: **X = −70 to +165 m**, **12 m** clear width.
- Secondary north/south corridors: **6–8 m** clear width.
- General ceiling: **3.0–3.4 m** above concourse floor.
- Selected upgraded entrance halls: **5–7 m** clear height.
- Structural columns: start at **0.8 × 0.8 m**, **8 m** bays; reconcile against a station plan.
- Stair module: **0.165 m riser / 0.30 m tread**, landings every **12 risers**.
- Escalators: **1 m** step width; model approximately **30°** incline.
- Build one **110 m** visible platform fragment with **4 tracks** for cinematic views. Extend the public concourse before modelling unseen rail infrastructure.

Align the station columns, arena supports and tower cores. Randomly placing three independent structural systems would undermine the realism.

### Street life and exterior light

For one populated **300 × 300 m** hero sector:

- **420 pedestrians:** 55% commuting, 25% arriving, 10% queueing, 10% stationary.
- Pedestrian speed: **0.8–1.6 m/s**.
- Queue spacing: **0.65–0.85 m**.
- **24 vehicles:** 8 taxis, 8 private vehicles, 4 delivery vehicles, 2 buses, 2 service vehicles.
- Vehicle speed: **0–8 m/s**, governed by signals and queues.
- **30 bicycles**, **10 moving cyclists**.
- **24 streetlights**, **18 bins**, **12 benches**, **8 bicycle racks**, **6 vendor positions**.
- Give traffic and pedestrians routes; never scatter them uniformly.

**Hero exterior:** blue hour, approximately **15–25 minutes after sunset**.

- Sky: cool environmental illumination.
- Streetlights: **3,000 K**.
- Entrance interiors: **3,500 K**.
- Sidewalk target: **15–30 lux**.
- Main entry target: **75–150 lux**.
- Use a damp surface mask over **20–30%** of pavement, concentrated around drains and worn depressions.
- Start exterior cameras at **28 mm**, height **1.65 m**; a second elevated view at **40 mm**, height **18 m**.

## C. Interior realism upgrades, in priority order

### 1. Lock the court and bowl relationship

Keep the **62 × 30 m** event floor envelope. The basketball playing rectangle should be **28.6512 × 15.24 m**, with baskets at **3.048 m** above the floor. Use the official court diagram for all markings instead of eyeballing proportions. [Official court diagram](https://cms.nba.com/wp-content/uploads/sites/4/2025/10/2025-26-NBA-Officials-Guide.pdf)

For the bowl, start with:

| Parameter | Proposed value |
|---|---:|
| Lower bowl | **20 rows** |
| Lower row pitch | **0.82 m** |
| Lower riser | **0.44 m** |
| Upper bowl | **16 rows** |
| Upper row pitch | **0.78 m** |
| Upper riser | **0.56 m** |
| Lower first tread | **h = 0.50 m** |
| Upper first tread | **h = 11.2 m** |
| Nominal seat centres | **0.52 m** |
| Club separation in plan | **1.0 m**, with concourse behind |
| Primary aisles | **1.4–1.8 m** clear |
| Vomitory openings | **2.4 × 2.5 m** |

At the largest sections, this produces an outer seating envelope around **122 × 90 m**. Trim it to the actual drum and structural envelope.

**Seat count must be an output of geometry.** Generate seats, remove aisles, portals, accessible platforms and obstructed locations, then count. Do not force a target attendance by squeezing characters closer together.

For sightlines, evaluate each row with:

- Seated eye: **1.15 m above tread**.
- Standing eye: **1.65 m above tread**.
- Target clearance over the row ahead: **0.09–0.12 m** as a design objective.
- Test near sideline, near rim and far baseline.

### 2. Seats that remain visible

- Seat width: **0.47 m**.
- Seat pan depth: **0.43 m**.
- Seat height: **0.45 m**.
- Back top: **0.86 m above tread**.
- Dark upholstery: **`#1E2938`**, **`#263449`**, **`#303B47`**.
- Roughness: **0.58–0.72**.
- Armrest edge bevel: **0.004 m**.
- Occupied seats folded down; unoccupied seats predominantly folded up.
- Show **3–7%** empty seats during ordinary play, with vacancies clustered around aisles and concessions.

### 3. Crowd as a behavioural system

Keep the 17 authored identities, but expand their presentation:

- **17 identities × 6 compatible wardrobe variants × 8 pose families = 816 combinations**.
- Wardrobe changes must preserve recognizable character features.
- **24 animation clips**, lasting **3–12 seconds**.
- Playback speed variation: **0.88–1.12×**.
- Independent phase offsets.
- Body scale variation: **±5%**, avoiding uniform scaling of every anatomical feature.
- Most flower-head widths: approximately **0.38–0.55 m** where consistent with the cast.
- Reserve larger canonical heads for aisle seats, courtside features or designated mascot positions.

Reaction timing after a score:

- Nearest fans: **0.15–0.35 s**.
- Adjacent sections: **0.3–0.8 s**.
- Far bowl: **0.6–1.4 s**.
- Peak standing participation: **45–70%** for major plays, not 100%.
- Recovery: **4–12 s**, with some fans remaining animated.

**Render tiers:**

- Hero spectators: **120**, full rigs and detailed materials.
- Midground: approximately **1,500**, reduced rigs or cached deformation.
- Background: remaining visible crowd using instanced pose caches, vertex animation or impostors.
- All tiers share the same seat IDs and reaction events.

### 4. Scoreboard and ribbon

**Proposed main board:**

- Overall body: **14 × 10 × 7 m**.
- Bottom: **h = 12 m**.
- Top: **h = 19 m**.
- Long-face screens: **12.8 × 4.8 m**.
- End screens: **8.8 × 4.8 m**.
- Underside: predominantly **`#11151A`**, roughness **0.45**.
- Underside logo: **4.5 m** wide, centred once.
- Lower fascia: **0.55 m** high.
- Four visible suspension groups; cable diameters **0.03–0.05 m**, with modeled attachment hardware.

Use **separate screen canvases per aspect ratio**. Letterbox artwork when necessary. Never stretch a rectangular logo around a conical surface.

For the ribbon:

- Height: **0.65 m**.
- Divide by architectural section, with explicit segment lengths.
- Use **8–12 m** content blocks.
- Hold information for **4–8 s**.
- Alternate artwork, score, venue name and section identity.
- Keep average screen luminance below the brightness of illuminated white jerseys.

### 5. Ceiling, bridges and rigging

- Retain the **48 radial structural divisions** as the generator framework.
- Distinguish cable elements, beams and roof ribs rather than giving all members the same cross-section.
- Primary visible members: approximately **0.25–0.60 m** deep.
- Secondary members: **0.08–0.18 m**.
- Catwalk width: **1.1 m**, with grating and toe boards.
- Two proposed bridge decks: **X = −38 to +38 m**, centred around **Y = ±24 m**, at **h = 19.5 m**.
- Bridge width: **3.2 m**; structural depth **0.8 m**.
- Adjust to preserve sightlines and connect to actual circulation.
- Add **16 hoists**, **8 speaker arrays**, **12 cable bundles**, **4 maintenance platforms**.
- Use dark charcoal materials, not absolute black.

### 6. Courtside, tunnels and broadcast infrastructure

- Scorer’s table: **12 × 0.8 × 0.85 m**.
- Two benches: **15 chairs each**.
- Two substitution chairs.
- **8 photographers**, **6 camera operators**, **6 arena staff**.
- **24 towels**, **36 bottles**, **4 equipment carts**.
- Cable ramps: **0.3 m** wide, **0.04 m** high.
- Main player tunnel: **4 × 3.4 m** clear.
- Secondary tunnel: **2.8 × 2.8 m**.
- Tunnel floor rubber roughness: **0.70**.
- Tunnel walls: **`#202733`**, with blue illumination only at selected joints.
- Backstop padding: visible seams, **0.05 m** edge radii and believable attachment straps.

## D. Players and officials

### Athlete construction

**Replace the posing method before replacing every base mesh.** A decent neutral body with a proper skeleton, corrective deformation and good motion will outperform a more detailed mesh posed by vertex manipulation.

Build **three shared body topologies**:

| Archetype | Body height before flower silhouette | Mass reference | Wingspan / height |
|---|---:|---:|---:|
| Guard | **1.85–1.98 m** | **80–95 kg** | **1.03–1.08** |
| Wing | **1.98–2.08 m** | **92–108 kg** | **1.04–1.09** |
| Centre | **2.08–2.20 m** | **108–125 kg** | **1.04–1.10** |

These are roster design ranges, not rigid rules.

- Hero body: **35,000–60,000 triangles** before render subdivision.
- Shared skeleton: approximately **80–90 bones**, including fingers.
- Separate controls for eye direction and flower motion.
- Shoulder, elbow, hip and knee corrective shapes.
- Hands with articulated fingers and a thumb that can oppose the palm.
- Neck connection concealed with an authored botanical collar or integrated transition.
- Flower secondary motion: **2–4°** lag during running; **5–8°** during hard stops.
- Do not scale bodies uniformly to create different athletes; vary limbs, torso depth and shoulder width independently.

### Jerseys and shorts

Use separate closed garment surfaces.

- Jersey body offset: **0.015–0.025 m** from the torso.
- Collar binding: **0.018 m** wide.
- Armhole binding: **0.015 m**.
- Visible fabric thickness: **0.001 m**.
- Shorts inseam: **0.18–0.23 m**.
- Shorts hem clearance from leg: **0.025–0.05 m**.
- Jersey mesh: **8,000–12,000 simulation vertices**.
- Shorts mesh: **5,000–8,000 simulation vertices**.
- Physical garment mass references: **0.16 kg jersey**, **0.20 kg shorts**; convert correctly to the chosen solver’s mass convention.
- Collision distance: **0.004 m**.
- Pin shoulder and waistband regions; allow loose hems.
- Simulate selected hero clips at **120 Hz**; cache them.

For the browser, use skinning plus **6–10 corrective cloth shapes** per garment. Full cloth simulation for every player is unnecessary.

### Two proposed team kits

These are new design proposals, not claims about existing NEW YORKERS canon.

| Feature | **NEW YORKERS — home** | **NIGHT SHIFT — away** |
|---|---|---|
| Jersey | **`#E8E5DC`** | **`#151D2C`** |
| Main lettering | **`#173B99`** | **`#F0EDE5`** |
| Primary trim | **`#2962FF`** | **`#2962FF`** |
| Secondary accent | **`#12213A`** | **`#D8B574`**, used sparingly |
| Wordmark | **NEW YORKERS** | **NIGHT SHIFT** |
| Front number height | **0.18 m** | **0.18 m** |
| Back number height | **0.25 m** | **0.25 m** |
| Name height | **0.045 m** | **0.045 m** |
| Wordmark width | **0.30–0.34 m** | **0.30–0.34 m** |
| Side treatment | **0.055 m** skyline panel | **0.04 m** blue vertical seam |
| Shorts mark | Evil eye, **0.055 m** | Skyline mark, **0.065 m** |

- Use the supplied exact logos as vector artwork.
- Keep jersey numerals simple enough to read from **20–30 m**.
- Use unique numbers within each roster.
- Make twelve fixed uniform assignments per team.
- Test wordmarks on bent torsos, not just flat UV previews.

### Shoes, accessories and skin

- Shoes: **3 base silhouettes × 4 colourways**.
- Sole thickness: **0.025–0.04 m**.
- Model laces, tongue, heel counter and separate sole materials.
- Arm sleeves on approximately **30%** of players.
- Leg sleeves on **20%**.
- Wrist tape on **25%**.
- Avoid giving every player every accessory.

Material starting values:

- Jersey roughness: **0.65–0.78**.
- Fabric sheen weight: **0.20–0.30**.
- Skin roughness: **0.43–0.55**.
- Local sweat roughness: **0.24–0.32**, limited to forehead/neck-equivalent, shoulders and upper arms.
- Sweat coat weight: **0.08–0.15**.
- Preserve existing skin tones; do not replace them with one shared colour.

### Animation library

First production library: **48 clips**.

- 8 locomotion.
- 6 dribbles.
- 6 passes/catches.
- 8 shooting finishes.
- 6 defensive actions.
- 4 rebounds.
- 4 screens/contact reactions.
- 6 celebrations.

Each clip needs contact markers:

- Left/right foot plant.
- Ball attach.
- Ball release.
- Catch.
- Rim contact.
- Landing.
- Recovery.

Use foot IK, hand IK and root-motion adjustment. Restrict routine clip time warping to **0.85–1.15×**.

**Officials:** three on court, **1.70–1.95 m** tall, grey/black shirts, clear officiating gestures and dedicated movement routes. They must follow the play without occupying player lanes.

For stills, select frames from a functioning animation sequence. That automatically produces better weight distribution and follow-through.

## E. Light, colour and texture

### Lighting targets

Professional broadcast basketball needs even illumination on the playing surface and useful light on players toward multiple camera directions. FIBA’s venue guide recommends approximately **3,000 lux average horizontal illumination** for major competitions. Use that as a reference target, not a claim about this arena’s installed system or a universal NBA requirement. [FIBA venue lighting guidance](https://www.venueguide.fiba.basketball/vanue-design)

Proposed artistic/technical targets:

| Zone | Target |
|---|---:|
| Court horizontal average | **2,500–3,000 lux** |
| Court minimum / average | **≥0.75** |
| Player vertical illumination toward primary cameras | **1,500–2,000 lux** |
| First courtside rows | **400–700 lux** |
| Lower bowl | **150–300 lux** |
| Upper bowl | **60–150 lux** |
| Roof/rigging | **10–40 lux** |
| Public concourses | **150–250 lux** |

### Exact starting rig

All positions below use **height `h` above the court**.

**48 sideline sports lights**

- Two banks at **Y = ±15 m**.
- **12 X positions** evenly spaced from **−23 to +23 m**.
- Two fixtures per position at **h = 23 and 25 m**.
- Spot lights, **40° cone**, blend **0.25**, source radius **0.12 m**.
- Starting Blender power: **250 W per fixture**.
- Colour temperature: **5,000 K**.
- Aim at distributed targets on the opposite half of the court, not all at centre.

**16 end sports lights**

- Banks at **X = ±23 m**.
- Four Y positions: **−9, −3, +3, +9 m**.
- Two fixtures per position at **h = 23 and 25 m**.
- Spot lights, **45° cone**, blend **0.30**.
- Starting Blender power: **180 W each**.
- **5,000 K**.

**48 bowl fixtures**

- Distribute by seating section.
- Starting power: **15–35 W each**.
- Broad **65–80°** beams.
- **4,000–4,500 K**.
- Aim into the seating, avoiding direct camera flare.

**32 service/architectural fixtures**

- **5–15 W each** starting power.
- **3,500–4,000 K**.
- Illuminate stairs, bridge structure and selected circulation.

That gives **144 visible fixtures**, but with meaningful roles.

**Critical unit distinction:** Blender light power is not the electrical wattage on a real luminaire’s specification. The powers above are rendering seeds. Establish lux through photometric data or an explicitly defined luminous model; do not claim a lux result from a watt setting alone.

For a photometric solver, sample a **2 m court grid** and sum each fixture’s contribution using its directional luminous intensity, distance and incidence angle. Scale fixture groups until the grid and vertical camera-facing samples meet the targets.

### Remove the flattening sources

- Disable the **36 × 20 m** overhead light during calibration.
- Disable the large global fill.
- Add either back only if a specific problem remains.
- Keep any restoration fill below approximately **5% of the court’s total illumination contribution**.
- Avoid a large luminous ceiling surface reflected across the whole floor.

### Court finish

| Property | Starting specification |
|---|---|
| Maple strip width | **0.057 m** |
| Strip lengths | **0.45–2.4 m** |
| Base palette | **`#C9A777`**, **`#D9BD91`**, **`#BFA073`** |
| Board-to-board colour variation | **±3–5%** |
| Base roughness | **0.30–0.36** |
| Coat weight | **0.30–0.40** |
| Coat roughness | **0.16–0.22** |
| IOR | **1.48** |
| Grain bump amplitude | **0.00003–0.00008 m** |
| Painted areas | Same continuous clear finish; separate base colour |
| Scuff roughness increase | **+0.03–0.07**, locally |
| Centre logo | Approximately **4.5 m** wide |

Use procedural or tiled microdetail over the 8K layout. An 8K image stretched over the event floor cannot supply close-up wood detail by itself.

Court markings should remain readable through reflections. Avoid large knot patterns and dark plank seams that make it look like residential flooring.

### Colour management and finishing

- Working render: scene-linear.
- Display transform: **AgX**.
- Start look: **Medium High Contrast**.
- Start exposure: **−0.3 EV**.
- Gamma: **1.0**.
- Establish neutral whites before creative grading.
- White balance around **4,800–5,000 K**.

Treat **`#2962FF`** as the source brand colour. A physically lit blue surface will not reproduce that exact display hex under every exposure. Overlay graphics can preserve it exactly.

**Optional LUT concept:** “Garden Broadcast.”

- **33³** creative LUT.
- Defined for the chosen display-referred output.
- Neutral skin and white jerseys.
- Slightly cooler deep shadows.
- Restrained warmth in wood.
- Global saturation adjustment no greater than **±5%**.
- No additional filmic tone curve if AgX already supplies it.

### Camera and finishing defaults

All focal lengths assume a **36 mm-wide sensor**.

| Shot | Lens | Aperture |
|---|---:|---:|
| Interior architecture | **24–28 mm** | **f/5.6–8** |
| Broadcast master | **40–55 mm** | **f/5.6–8** |
| Baseline action | **70–100 mm** | **f/2.8–4** |
| Player portrait/reaction | **100–135 mm** | **f/2.8–4** |
| Controlled rim spectacle | **18–24 mm** | **f/4–5.6** |
| Exterior pedestrian view | **28–35 mm** | **f/5.6** |

- Broadcast delivery: **60 fps**.
- Standard action shutter: **180°**, equivalent to **1/120 s at 60 fps**.
- Slow-motion acquisition: **120 or 240 fps**.
- Cinematic promo: **24 or 30 fps**, chosen per sequence.
- Depth of field follows actual lens, aperture and focus distance; avoid blurring the entire arena into miniature scenery.
- Haze extinction starting range: **0.0005–0.0015 m⁻¹**.
- Bloom: small highlight halo, approximately **2–6 pixels at 1440p**; no diffuse glow across every screen.
- Final grain: **0.3–0.6% luminance RMS** at delivery size.
- Add grain after resizing.

## F. Game simulator, tournaments and the highlight engine

### Architecture

Use this dependency chain:

**Roster + rules + seed → game events → spatial choreography → motion/ball timeline → cameras + graphics + audio → exports.**

Blender and three.js consume the **same event and motion data**. Neither independently invents the score or ball outcome.

### Data model

| Entity | Required fields |
|---|---|
| Character | Stable ID, canonical name, source asset, flower variant, eye controls |
| Athlete | Character ID, body archetype, height, wingspan, handedness, number |
| Ratings | Speed, acceleration, handle, passing, rim finishing, midrange, three-point, rebounding, interior defence, perimeter defence, stamina, composure |
| Team | ID, name, palette, kit, roster, starting five, rotation, tactical tendencies |
| Game | ID, random seed, rules version, teams, period, clocks, score, possession |
| Event | ID, time, duration, actors, location, action, result, clock changes, statistical attribution |
| Motion segment | Actor, clip, root path, time warp, contact markers, IK targets |
| Ball segment | Owner or free flight, release/catch times, trajectory, spin, collisions |
| Highlight | Event IDs, importance score, camera sequence, replay speed, graphics |
| Tournament | Format, seeds, fixtures, results, standings, tie-break rules |

Use **0–100 ratings**, with most players between **45 and 85**. Reserve **90+** for a small number of defining strengths.

Start with **8 teams × 12 roster slots**. If there are only 17 finished character identities, distinguish athlete instances by roster ID, number, body and kit; do not pretend they are 96 newly authored characters.

### Rules profile

First profile: **professional-style 5-on-5**.

- Four **12-minute** quarters.
- **24-second** shot clock.
- **14-second** resets in the applicable defined situations.
- **5-minute** overtime.
- Five active players.
- Six personal fouls before disqualification.
- Explicit foul, timeout, substitution and possession-arrow/jump-ball handling as appropriate to the selected rules.

Implement a versioned rules object. Add a shorter custom format later—such as **four 3-minute quarters**—without changing the underlying event system.

### Possession simulation

Use event-driven decisions; do not render every simulated second just to calculate a result.

For each possession:

1. Choose lineup and tactical action.
2. Generate spacing and player assignments.
3. Resolve transition, screen, pass, drive or isolation.
4. Resolve turnovers and fouls.
5. Choose shot location and contest.
6. Resolve make/miss.
7. Resolve rebound or inbound.
8. Update both clocks, fatigue and statistics.

A useful first shot model:

**`p_make = sigmoid(logit(base_zone_probability) + rating_adjustments + context_adjustments)`**

Starting uncontested zone probabilities:

- Rim: **0.66**.
- Short paint: **0.47**.
- Midrange: **0.42**.
- Corner three: **0.39**.
- Above-break three: **0.35**.
- Free throw: **0.76**.

Example log-odds adjustments:

- Shooting rating: **0.018 × (rating − 70)**.
- Contest: **−1.1 × contest**, where contest is **0–1**.
- Fatigue: **−0.6 × fatigue**, where fatigue is **0–1**.
- Well-created catch-and-shoot opportunity: **+0.12**.
- Difficult off-balance release: **−0.25**.

These are calibration defaults. Simulate **10,000 unrendered games** and tune for plausible possession counts, shot distributions, turnovers and scores. Never force the final score directly.

### Spatial choreography

Use authored tactical templates first:

- **12 half-court plays**.
- **6 transition patterns**.
- **4 baseline/sideline inbound patterns**.
- **4 late-clock patterns**.

Suggested movement bounds:

- Running speed: **4–7 m/s**.
- Short sprint peak: **8–9 m/s**.
- Lateral defence: **2–4 m/s**.
- Acceleration: **3–6 m/s²**.
- Comfortable player clearance: approximately **0.6–0.9 m**, with intentional contact exceptions.
- Offensive spacing: typically **3–5 m**.

Bake motion at **60 Hz**; evaluate ball motion and contacts at **240 Hz** where necessary.

**Ball constraints:**

- Radius: approximately **0.12 m**.
- Gravity: **9.81 m/s²**.
- Shot backspin: **2–3 revolutions/s**.
- Pass speed: **8–14 m/s**.
- Rim height: **3.048 m**.
- Rim inner diameter: **0.4572 m**.

Use ballistic flight between contacts. For a desired endpoint and flight time, solve the release velocity. For misses, aim at physically plausible rim/backboard contacts and continue with collision resolution.

If an event cannot be animated credibly, choose another compatible motion solution. Do not make the ball teleport to preserve a sampled outcome.

### Determinism and replay

- Separate random streams for gameplay, crowd, camera selection and visual effects.
- Camera edits must never change game results.
- Save immutable event IDs and ball ownership transitions.
- Replays reference the original timeline.
- Scoreboard, score bug, shot clock and statistics all read the same game state.

### Tournament formats

First two formats:

1. **Eight-team knockout:** **7 games**.
2. **Two groups of four:** **12 group games + 2 semifinals + 1 final = 15 games**.

Group tie-break sequence:

1. Wins.
2. Head-to-head where applicable.
3. Point differential capped at **±20 per game**.
4. Points scored.
5. Seeded draw.

Publish standings and bracket state directly from game records.

### Highlight selection

Score each candidate event from **0–100**:

- Shot difficulty: **0–20**.
- Late-game importance: **0–25**.
- Score/lead impact: **0–20**.
- Athletic spectacle: **0–15**.
- Character rivalry/context: **0–10**.
- Crowd response: **0–10**.

Select events above **65**, with at least **12 seconds** between ordinary selections unless they form one sequence.

### Camera grammar

| Camera | Proposed position / role | Lens |
|---|---|---:|
| Main broadcast | **(0, −22, h 9)**, tracks possession | **40–55 mm** |
| Near baseline | **(−18, −6, h 1.1)** | **85 mm** |
| Far baseline | **(+18, +6, h 1.1)** | **85 mm** |
| Sideline handheld | Moves along **Y = −10.5**, **h 1.6** | **50 mm** |
| Protected backboard camera | Behind/above backboard, clear of play | **18–24 mm** |
| Bridge overview | **(0, +24, h 20.5)** | **28–35 mm** |
| Crowd reaction | Selected aisle camera | **100–135 mm** |

For a **20-second vertical highlight**:

- **0–1.5 s:** readable visual hook and score context.
- **1.5–6 s:** uninterrupted action.
- **6–8 s:** landing and immediate reaction.
- **8–14 s:** one slow-motion replay.
- **14–18 s:** player/crowd response.
- **18–20 s:** result and restrained branding.

Keep the ball and relevant bodies visible through the decisive action. Save aggressive cuts for the replay.

### Broadcast graphics and sound

- Score bug: **`#101722`** background, **`#F2EFE8`** text, **`#2962FF`** active highlight.
- One skyline transition, lasting **0.35–0.50 s**.
- Replay marker visible throughout altered-speed footage.
- Player lower-third visible **2–3 s**.
- Give statistics clear units and avoid decorative unreadable numerals.
- Record/mix at **48 kHz**.
- Separate ball, shoe, rim, net, PA and crowd buses.
- Trigger squeaks from planted lateral foot motion.
- Apply sound propagation delay for distant crowd/PA where useful.
- Delivery audio starting target: approximately **−14 LUFS integrated**, true peak below **−1 dBTP**.

### Deliverables

| Format | Resolution | FPS | Typical duration |
|---|---:|---:|---:|
| Vertical highlight | **1080 × 1920** | **60** | **12–25 s** |
| Vertical story/promo | **1080 × 1920** | **30** | **20–40 s** |
| Square social clip | **1080 × 1080** | **30 or 60** | **8–20 s** |
| Broadcast highlight | **3840 × 2160** | **60** | **20–60 s** |
| Cinematic trailer | **3840 × 2160** | **24 or 30** | **30–60 s** |

Render aspect-specific cameras. A centre crop of the wides will repeatedly lose the ball, rim or reacting player.

### Ten viral highlights unique to this world

1. **THE BLINK:** a defender’s eye tracks the wrong direction; the ballhandler crosses over. Replay isolates the eye movement.
2. **LAST TRAIN:** final possession tied to a departure-board graphic; game clock and ball release remain exact.
3. **FULL BLOOM:** a winning dunk triggers a delayed standing wave of flower heads across the bowl.
4. **THE GARDEN GOES QUIET:** crowd sound drops during the last free throw; the net snap precedes the eruption.
5. **NIGHT SHIFT OVERTIME:** a rivalry game reaches overtime; tunnel and ribbon accents switch to the away team’s nocturnal palette during the break.
6. **PETAL CHECK:** a clean block sends the attacker’s flower into a believable secondary-motion wobble; no dismemberment or arbitrary particle explosion.
7. **ONE EYE OPEN:** a no-look pass shown first in broadcast view, then from the receiver’s perspective.
8. **FROM PENN TO THE PAINT:** a commuting fan enters the concourse, emerges at the tunnel and witnesses the winning play.
9. **THE WHOLE SECTION SAW IT:** one missed dunk, followed by a synchronized gaze turn and staggered disbelief reactions.
10. **AFTER THE BUZZER, THE ART:** a legal winner, then the scoreboard displays that character’s original MLow artwork as the arena celebrates.

Keep impossible visual transformations in clearly stylized replay or celebration sequences so the underlying game remains coherent.

## G. Fifteen unmistakably MLow design elements

| # | Element | Implementation |
|---:|---|---|
| 1 | **The Iris Oculus** | A **4.5 m** underside eye whose iris subtly follows the active basket; one slow motion system, not an all-over texture. |
| 2 | **Skyline entrance portal** | Extruded stacked-skyline geometry forming a **7 × 5 m** entrance composition. |
| 3 | **Blue route through the building** | A **0.06 m** blue inlay connects station, entrance, concourse and tunnel. |
| 4 | **Character accession plaques** | **0.25 × 0.35 m** plaques pairing cast artwork, identity and collection information at selected seats. |
| 5 | **The living ribbon** | Section-specific flower-eye animations that react to possession and crowd energy. |
| 6 | **Botanical bridge soffits** | Relief panels **0.08–0.15 m** deep under the bridges, visible in upward shots. |
| 7 | **Eye-shaped tunnel light** | A **3.5 × 2 m** aperture behind the players, with restrained blue edge illumination. |
| 8 | **Original-art scoreboard takeovers** | Full artwork shown during introductions and stoppages, with correct aspect ratios and credit. |
| 9 | **Skyline jersey seams** | The skyline becomes a cut/seam system along the body rather than another pasted logo. |
| 10 | **Petal acoustic panels** | **1.2 × 2.4 m** panels in concourses; plausible perforation and thickness, not flowers scattered on every wall. |
| 11 | **The all-seeing camera housing** | Three hero broadcast cameras with subtle eye-shaped shells, retaining real lens and mounting geometry. |
| 12 | **Character-specific seat districts** | Colour accents and artworks distinguish **8 sections** without replacing legible section numbers. |
| 13 | **The Night Garden concession** | One authored **8 × 4 m** kiosk, midnight palette and a **0.6 m** eye-shaped order indicator. |
| 14 | **Tournament growth sculpture** | A **2.4 m** lobby sculpture gains one illuminated petal per advancing team. |
| 15 | **The departure wall** | A **6 × 2 m** concourse board mixes legitimate event information with original short MLow lines. |

Allocate visual density deliberately: approximately **70% restrained architecture, 20% functional information, 10% expressive interventions**. The artwork needs quieter surroundings to retain its force.

## H. Phased build plan

Effort estimates are person-days for an experienced technical artist/developer, excluding render time and external asset procurement.

### Phase 0 — Lock the shared specification  
**1–2 days**

Create a parameter manifest for:

- Coordinate system and elevations.
- Arena geometry.
- Material palette.
- Lighting groups.
- Character and team IDs.
- Game rules.
- Camera definitions.
- Output profiles.

Retain the current eight camera views as comparison views.

**Acceptance:** the same dimensions, IDs and game state can be consumed by Blender and three.js.

### Phase 1 — Biggest visible jump  
**3–5 days**

1. Fix scoreboard scale, underside and UV mapping.
2. Rebuild the illumination hierarchy.
3. Seat the crowd and introduce posture/phase variation.
4. Reduce court coating haze and logo repetition.
5. Produce the same eight renders again.

**Acceptance:** the court is the visual focus; individual spectators are readable in close views; the scoreboard no longer dominates the architecture.

### Phase 2 — One convincing basketball possession  
**6–10 days**

- One rigged guard, wing and centre.
- Two finished kits.
- One referee.
- A **10–15 second** sequence with pass, drive, shot, rebound or score.
- Correct hand/ball and foot/floor contacts.
- One **60 fps** broadcast version and one vertical edit.

**Acceptance:** no visible foot sliding, garment penetration, ball teleportation or score-clock mismatch.

Do this before building dozens of athlete variants.

### Phase 3 — Interior construction and crowd system  
**5–8 days**

- Bowl sightline refinement.
- Seats and section portals.
- Bridges and rigging.
- Courtside operations.
- Crowd state machine.
- Three representative camera distances.

**Acceptance:** capacity comes from valid seat geometry; near, middle and distant crowd tiers survive their intended shots.

### Phase 4 — Exterior and station  
**7–12 days**

- Align site massing against a georeferenced plan.
- Drum and podium.
- Eastern office frontage and entrance connection.
- Continuous pedestrian perimeter.
- Station entrances and public concourse.
- Neighbouring massing.
- Street activity and blue-hour lighting.

**Acceptance:** one continuous camera journey works from street → station → arena entrance → bowl without impossible spatial transitions.

### Phase 5 — Deterministic games and tournaments  
**7–12 days**

- Rules/state engine.
- Ratings and tactics.
- Play templates.
- Ball/motion integration.
- Statistics.
- Tournament formats.
- **10,000-game** statistical calibration run.

**Acceptance:** saved seeds reproduce results; clocks and statistics remain consistent; animated events match the record.

### Phase 6 — Highlight production  
**4–7 days**

- Event ranking.
- Camera selection.
- Replays.
- Graphics and audio.
- Three aspect ratios.
- Ten finished example clips.

**Acceptance:** an ordinary simulated game can produce a coherent highlight package without manually rebuilding each shot.

### Phase 7 — Browser optimization and parity  
**4–7 days**

- Crowd LODs and animation textures.
- Instanced static architecture.
- Compressed textures and geometry.
- Baked ambient lighting plus limited dynamic lights.
- Shared replay timeline.
- Performance measurement on defined desktop and mobile devices.

Starting browser budgets:

- **≤2 million visible triangles** on desktop.
- **≤500,000 visible triangles** on mobile.
- **≤200 draw calls** desktop; **≤100** mobile.
- At most **2 shadow-casting dynamic lights** in the ordinary gameplay view.
- Target **60 fps desktop**, **30 fps mobile**, subject to measured device capability.

### The three highest-return changes for the least work

1. **Fix the scoreboard underside and UVs — approximately half a day to one day.**  
   Darken it, remove stretched repetition and give the central mark a single controlled placement.

2. **Replace flat illumination with court-focused lighting — approximately one to two days.**  
   Disable the giant soft sources, introduce crossed fixtures and lower bowl exposure.

3. **Change crowd posture and synchronization — approximately two to three days.**  
   Add a small seated pose library, dark body variation, empty-seat clusters and independent timing.

**The first milestone should be those three changes rendered from the existing eight cameras.** That comparison will show whether the visual foundation is working before the exterior and simulator multiply the workload.