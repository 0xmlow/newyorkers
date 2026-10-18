# Prompt recipes

## Style transfer

```text
Use case: style-transfer
Asset type: [final use]
Input images: Image 1 is the edit target and composition anchor. Remaining images are MLow style references only.
Primary request: Translate Image 1 into MLow Impermanent Vision at [Whisper, Bloom, or Melt] intensity.
Style and medium: dark materially painted realism fused with liquid contour fields, fluid marbling, controlled paint drip, liminal architecture, black voids, electric cobalt, cyan, violet, hot pink, bone white, and restrained copper.
Narrative motif: Integrate [one dominant or several secondary] Open Eye Flowers as witnesses to [subject or action].
Spatial motif: Turn [door, bridge, corridor, stair, tunnel, or landscape feature] into a lucid threshold.
Constraints: Preserve identity, anatomy, pose, wardrobe, camera angle, composition, subject count, and narrative action. Change only the visual treatment and environmental atmosphere. No text, no letters, no logos, no watermark. Avoid generic rainbow psychedelia, cute flowers, arbitrary fractals, and soft fantasy haze.
```

## New illustration

```text
Use case: illustration-story
Asset type: [cover, panel, poster, fashion graphic, or campaign image]
Primary request: [scene and action]
Scene and backdrop: A liminal [corridor, bridge, tunnel, doorway, stair, landscape, or civic structure] opening into an impossible but coherent space.
Subject: [human witness and principal object]
Style and medium: MLow Impermanent Vision. Dense hand painted contour filaments, fluid acrylic marbling, carved relief edges, gravity drips, deep ink voids, and selective electric color.
Composition: One dominant focal structure, one human scale witness, and a clear path into the threshold.
Open Eye Flower: [role and placement]
Constraints: Material paint behavior, readable silhouettes, controlled highlights, no text, no watermark, no generic rainbow treatment.
```

## Graphic novel page

```text
Use case: style-transfer
Asset type: unlettered graphic novel page
Input images: Image 1 is the unlettered page and must retain every panel, character, action, and camera angle. Remaining images are MLow style references.
Primary request: Infuse the page with MLow Impermanent Vision at Whisper intensity. Let liquid contour fields and paint drips enter through panel edges and architectural shadows. Add one small Open Eye Flower as a witness. Preserve all faces, hands, clothing, props, panel borders, and negative space reserved for lettering.
Constraints: Do not redraw the page structure. Do not add text. Do not cover faces, hands, or intended lettering areas. Keep the narrative instantly readable.
```

## Controlled revision

```text
Keep the current image unchanged except for this single correction: [targeted change].
Repeat all invariants: preserve identity, anatomy, pose, framing, palette balance, Open Eye Flower role, and threshold structure. Add no extra elements.
```


## Environment plates and materials for a gallery (learned 2026-10-17, THE PIGEONHOLE)

Ran in Adobe Firefly, Gemini 3 (Nano Banana Pro), 2K, one style block appended to every prompt (Bloom for plates and
posters, Whisper or a flat orthographic block for materials). Lessons:

* A plate that will sit behind a 3D window, door or cooler must say so: "No glass, no door, no window frame, no
  shelves in the foreground, the view fills the entire frame". Otherwise the model paints the frame into the picture.
* Say "No real brand names, no real logos" on anything with packaging, tickets or stickers; check every output anyway
  (a fare card brand appeared on generated receipts and a sticker wall). Invented MLow brands come out legible.
* Materials: "Flat orthographic straight on view, evenly lit, filling the whole frame edge to edge" then make them tile
  with a half offset cross fade. Derived normals from colour are an approximation; say so.
* One Open Eye Flower per image is enough; the style block already asks for it.
