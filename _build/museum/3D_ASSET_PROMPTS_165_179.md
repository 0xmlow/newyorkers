# 3D asset prompts for rooms 165 to 179

Written 2026-09-25. The fifteen new rooms are built procedurally in the museum
engine (`_build/museum/src/rooms/v15.ts` to `v22.ts`) with the Blender life kit
(`_build/museum/blender/build_life_kit.py`: sea lion, koi, turtle, swan, pigeon,
gull, dog, nutcracker). This file lists the assets that would lift each room
further, with copy ready prompts for the three ways to make them.

## How assets enter a room

| Lane | Tool | Output | Where it goes | Rule |
|---|---|---|---|---|
| Blender headless | `build_life_kit.py`, `build_institution_kit.py` | GLB, flat materials, under 350 KB | `assets/museum/props/<name>.glb`, placed by `k.prop(name, x, y, z, { height })` | Sculpture, ornament, animals. Never rooms. |
| AI text to 3D | Krea `generate_3d`, FLORA 3D models, Meshy, Tripo, Hunyuan 3D | GLB with a baked texture | Same folder, after a Blender pass (decimate to under 20 k triangles, bake to one 1024 texture, apply `export_yup`) | One hero object per room at most. Textures are the whole GLB size; the mint export re encodes every texture at 1024. |
| AI image to 3D | Same tools from a reference still | GLB | Same | Use for real objects with a strong silhouette (a bronze animal, a lantern, a cart) never for buildings. |
| Photo textures | Nano Banana Pro or Seedream via Firefly, Krea, Dreamina, then `k.image(url, { opaque: true })` | JPG | `assets/museum/photos/<room>/` | Faces of things (a scrap pile, a produce stack, a lit house front). |

Every prop must clear the contact sheet (`blender/contact_sheet.py`) before it
is placed, and the room's triangle count on the debug overlay must stay under
about 600 k. Pass `--only <name>` when rebuilding one prop.

**House style for every AI prompt below.** Add this line at the end of any
text to 3D or image prompt: `clean low polygon game asset, single object on a
plain background, no text, no logos, no people, neutral studio light, real
world proportions, muted natural colour`. For image references that will feed
image to 3D: `orthographic three quarter view, centred, full object in frame`.

## Per room

### 165 City Hall loop
- **IRT Lo V subway car, 1904 to 1930s style, silver R62A alternative.** Text to 3D: `a New York City subway car, stainless steel body with a dark blue stripe, rounded roof, lit rectangular windows, headlights, a single car 15 metres long, {house style}`. Rig six on the loop spline with `k.rider`.
- **Guastavino tile vault segment.** Better as a procedural texture (`X.subwayTile` tinted cream and green) than a model. If a model: `a herringbone terracotta tile barrel vault segment, Guastavino style, cream and moss green glazed tiles, 4 metres wide`.
- **Brass chandelier, 1904.** Blender lathe: add to `build_institution_kit.py` as `station_chandelier` (a lathe bowl, six arms as tubes, six bulbs as small spheres with an emissive material).
- **Leaded glass skylight panel.** Canvas texture in the room file; no model needed.

### 166 Gold vault
- **The vault cylinder.** Procedural: a 2.7 m cylinder of dark steel with a door slot, turning on a tick. No AI asset needed.
- **A pallet of gold bars.** Blender: 40 bevelled bricks in a stepped stack, material `GOLD`, name `gold_pallet`. A metallic texture bakes badly; keep it flat.
- **Wrought iron lantern, Samuel Yellin style.** Text to 3D: `a wrought iron hanging lantern, Florentine Renaissance style, black iron with scrolled straps and a pointed finial, amber glass panes, 1.2 metres tall, {house style}`.
- **Hand cart.** Blender: two wheels, a bed, two handles (`gold_cart`).

### 167 Union Square
- **Greenmarket stall.** Procedural (white canopy on four poles, a table, crates). If a texture is wanted for the produce, image prompt: `a farmers market table piled with apples, squash and leafy greens, top down, flat lay, natural light, no people, no signs`, used as a `k.image` on the crate tops.
- **The equestrian Washington, plain form.** Use the existing `equestrian.glb` prop (bronze, no face). Do not generate a likeness.
- **The Metronome's steam hole and digits.** Canvas textures, no model.
- **Skateboard.** Blender: a deck and four wheels, 0.8 m, `skateboard`.

### 168 Bryant Park
- **Le Carrousel horse.** Text to 3D: `a French carousel horse, carved wood, painted cream with a red and gold saddle, legs in a gallop, on a brass pole, 1.6 metres, {house style}`. Fourteen instances on the rig from `v3.ts`.
- **Green folding bistro chair.** Blender: `bistro_chair` (a seat, a back, four legs as thin cylinders, `LEAF` green). One InstancedMesh of several hundred in the room.
- **The Lowell fountain.** Blender lathe: a granite basin on a stem, `fountain_basin`.
- **Ping pong table.** Procedural.

### 169 Little Red Lighthouse
- **The lighthouse.** Procedural lathe in the room file (a red conical tower, a black lantern room, a gallery rail). A text to 3D version is not better than the lathe.
- **A kayak with a paddler.** Text to 3D: `a yellow sea kayak with a seated paddler in a life vest, paddle mid stroke, 4 metres, {house style}`.
- **A tug or a Circle Line boat.** Image to 3D from a side view reference: `side elevation of a small red and black Hudson River tugboat, no name on the hull, calm water, overcast`.
- **GWB tower section.** Procedural steel lattice; the bridge is too big for any asset.

### 170 Four Freedoms Park
- **The bronze head, plain form.** Blender: a bronze bust without facial features (`bust_plinth.glb` already exists; use it). Never a likeness.
- **Little leaf linden.** The engine's `k.tree` with `kind: 'column'` is enough; a custom canopy would cost more than it gives.
- **Smallpox Hospital ruin.** Procedural: two Gothic Revival walls with pointed windows from `holedWall`. If a texture: `weathered grey gneiss stone wall with ivy, ruined Gothic Revival window arch, overcast light, flat frontal view`.

### 171 Sea lion pool
- **Sea lions.** Done: `sealion.glb`, `sealion_swim.glb`.
- **The Delacorte Clock's animals.** Six bronze animals with instruments. Blender, one function each in a `build_clock_kit.py`: bear with tambourine, hippo with violin, goat with pipes, penguin with drum, kangaroo with horn, elephant with concertina. Text to 3D alternative, one prompt per animal: `a bronze sculpture of a dancing hippopotamus playing a violin, storybook style, green brown patina, 1 metre, {house style}`. Rig on the turning ring from `carousel` in `v3.ts`.
- **Penguins.** Blender: a chinstrap penguin standing (`penguin`), instanced twelve times behind the glass.
- **Snow leopard.** Skip; a poor low polygon cat reads worse than an empty enclosure with a rock.

### 172 Delacorte Theater
- **Stage light on a truss.** Blender: `stage_light` (a can on a yoke), instanced twenty times.
- **A wooden stage set piece.** Procedural flats. No AI.
- **Belvedere Castle.** Procedural in the room (it is far away; a silhouette with lit windows is enough).

### 173 Cherry Esplanade
- **Kanzan cherry in full bloom.** Text to 3D for one hero tree: `a Japanese Kanzan cherry tree in full pink double bloom, spreading crown, dark trunk, 8 metres, {house style}`, then instanced along the esplanade with per instance rotation and scale. Cheaper: the engine's `k.tree` with `leaf: 0xf2a6c2` and a larger `r`.
- **Torii.** Procedural (two posts, two beams, vermilion). No AI.
- **Stone lantern (kasuga style).** Blender lathe and cubes, `stone_lantern`.
- **Koi, turtle, swan.** Done in the life kit.
- **The viewing pavilion.** Procedural.

### 174 Brooklyn Heights Promenade
- **Ferry (NYC Ferry style).** Image to 3D from a side view: `side elevation of a modern white and blue passenger ferry with an open upper deck, no operator name, calm harbour water`. Run two on `k.rider`.
- **Dog.** Done in the life kit; pair with a walker figure.
- **Cast iron promenade lamp.** `lamppost.glb` exists.
- **Bench, hex block pavement, railing.** Procedural.

### 175 Astor Place
- **The Alamo cube.** Procedural: a 2.4 m cube with a slight edge bevel, Cor Ten material, balanced on a corner, spinning on push. No AI.
- **The IRT kiosk.** Blender: a cast iron and glass kiosk with a domed roof (`irt_kiosk`), or text to 3D: `a 1904 New York subway entrance kiosk, cast iron frame, glass panes, curved green copper roof with a finial, 4 metres tall, {house style}`.
- **41 Cooper Square skin.** Procedural: a `X.steel` face with a perforated normal, and the slot as a `holedWall`.

### 176 Queens Night Market
- **Pop up tent.** Procedural (a 3 by 3 m canopy on four poles). Instanced.
- **Grill with smoke.** Blender: `food_grill` (a steel box on legs, a hood); the smoke is `vapour()`.
- **The Hall of Science wall.** Procedural: an undulating extruded wall with a dark blue material and small cobalt glass squares as an emissive texture. Image prompt for that texture: `a wall of small dark cobalt blue glass squares set in dark concrete, undulating, lit from inside at night, frontal flat view, no people`.
- **Rocket Park rockets.** Procedural lathes (a white Atlas and a Titan with a capsule).

### 177 Dyker Heights
- **Nutcracker.** Done in the life kit.
- **Inflatable snowman, toy soldier, reindeer, angel.** Blender: `snowman` (three spheres, a hat, a scarf), `reindeer` (a body sphere, four leg tubes, antlers as tubes), `angel` (a cone body, two wing planes, a ring). Emissive white material so they glow at night.
- **Lit house front.** The rooms build the houses; for a photo texture of a house dressed in lights: `a detached brick house at night covered in thousands of white and warm Christmas lights outlining the roof and every window, snow on the lawn, wide frontal view, no people, no signs`.

### 178 Hunts Point
- **Forklift.** Text to 3D: `a yellow warehouse forklift with a black mast and forks, an operator cage, small solid tyres, 3 metres, {house style}`. Rig on loops with a pallet as a child.
- **Tractor trailer.** Procedural (a cab box, a 16 m reefer box, wheels); `traffic()` in `v14.ts` already does cars, extend it with a trailer length.
- **Produce pallet.** Image prompt for the faces: `stacked cardboard produce cases on a wooden pallet, bananas, tomatoes and lettuce, flat frontal view, warehouse sodium light, no brand names, no text`. Apply with `k.image` on the stack faces.
- **Hand truck.** Blender: `hand_truck`.

### 179 Columbus Park
- **Pigeon.** Done in the life kit; instance a flock and lift it when the visitor walks in.
- **Xiangqi table with elders.** Procedural table; the crowd is `still()` figures from `v14.ts`.
- **Erhu.** Blender: a small drum, a neck, two tuning pegs, a bow (`erhu`), held by a seated figure.
- **The 1897 pavilion.** Procedural (a red hip roof on iron columns).

## Prompts for reference stills (Nano Banana Pro, Seedream, Firefly)

Use these to make a still to check a room against, or to feed image to 3D.
Keep the house rules: no text, no likeness, no brands.

- `City Hall subway station in 1904, curved platform, Guastavino tile vaults in cream and green, brass chandeliers, leaded glass skylights, a silver train curving through, cinematic, empty`
- `the gold vault under the Federal Reserve Bank of New York, a dim stone corridor, a cylindrical steel door turned open, cages of stacked gold bars behind mesh, cold lamplight, no people`
- `Union Square Greenmarket on a Saturday morning, white canopy stalls, apples and flowers, crowds, the Metronome facade with its digit display across 14th Street, autumn light`
- `Bryant Park at dusk from the library terrace, the lawn full of green folding chairs, plane trees, the carousel lit, Midtown towers glowing`
- `the Little Red Lighthouse under the George Washington Bridge, red conical tower on a rock by the Hudson, the steel bridge tower rising above, the Palisades across the river, late afternoon`
- `Four Freedoms Park from the top of the granite stairs, the tapering lawn between two rows of linden trees, the granite room at the tip, the East River and the United Nations beyond, quiet, no people`
- `the Central Park Zoo sea lion pool from the pergola, sea lions on the rock, glass rim, brick arcades with wisteria, the Arsenal behind, spring morning`
- `the Delacorte Theater at night, the open air bowl full, the stage lit, Turtle Pond and Belvedere Castle glowing behind the stage, fireflies`
- `the Cherry Esplanade at Brooklyn Botanic Garden in full bloom, double rows of pink Kanzan cherries over a lawn, petals in the air, people picnicking`
- `the Brooklyn Heights Promenade at sunset, the iron railing, benches, hex block pavement, Lower Manhattan across the harbour, the Brooklyn Bridge to the right`
- `Astor Place, the black Cor Ten steel cube balanced on its corner, the cast iron subway kiosk, Cooper Union brownstone and the perforated steel building, skateboarders, overcast`
- `the Queens Night Market at night, rows of white tents under string lights, grill smoke, thousands of people, the undulating dark blue wall of the Hall of Science behind`
- `Dyker Heights in December at night, detached houses covered in Christmas lights, giant nutcrackers and toy soldiers on the lawns, snow, crowds on the sidewalk`
- `Hunts Point Produce Market at three in the morning, a long loading dock with numbered doors, tractor trailers backed in, forklifts with pallets, sodium lights, breath in the cold`
- `Columbus Park in Chinatown at seven in the morning, tai chi groups on the plaza, elders around Chinese chess tables, the red roofed pavilion, tenements with fire escapes behind`

## Blender commands

```bash
cd "NEW YORKERS SITE/_build/museum/blender"
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python build_life_kit.py -- --out ../../../assets/museum/props --only pigeon,gull
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python contact_sheet.py -- ../../../assets/museum/props /tmp/sheet pigeon,gull
```

New animals and figures go in `build_life_kit.py`; ornament and sculpture in
`build_institution_kit.py`. Head or nose toward Blender +Y so the export's -Z is
forward. Review on the contact sheet before placing: the sea lion shipped only
after its taper was turned round and the nutcracker only after its arms cleared
its coat, both caught on the sheet, not in a room.
