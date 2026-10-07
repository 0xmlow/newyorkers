# The photoreal pass (2026-10-07)

How `DELIVERABLES/film/meme_island_photoreal.mp4` was made, and how to make it again.

1. `python3 film.py --clean` renders the 19 scenes bare (no plaque, no mark, no fades) to `DELIVERABLES/film/clean/`.
   Before this pass, eight tour rails ran the camera through sculptures that had been scaled up after the rails were written
   (arrivals started inside the Colossus). `probe_rails.py` (camera inside a mesh box) and `probe_near.py` (anything nearer
   than 2.5 m) find them; both must print nothing before a render.
2. The clean clips go up to Krea's presigned upload (`pr_upload.py`), then into FLORA by URL (`flora_create_asset` with `sources`).
3. Each scene runs through FLORA video to video with `photoreal_prompts.py`: `v2v-kling-o3-edit` ($0.84 flat per clip up to
   about 11 s, native 1080p, replaces the cartoon sky) and `v2v-flux-3-edit-video-gateway` (about $0.036 a second, 1248 x 704,
   keeps the eye moon and sky cards, more film grain). The better of the two per scene is in `photoreal_runs.json` (copied from `cache/pr_runs.json`) under `picks`.
   Lucy Edit Pro hallucinated a different scene; Krea's Flux Video Edit 500s on clips over about 5 s.
4. FLUX picks go through `video-upscaler-topaz` at 2x ($0.048) and land in `photoreal_final/`.
5. `foley_prompts.py` + `v2v-mmaudio-v2` ($0.006, caps at 8 s) give each scene its own sound; `foley_fetch.py` keeps the audio only.
6. `python3 film.py --assemble ../DELIVERABLES/film/photoreal_final --name meme_island_photoreal` lays the plaques, mark, fades,
   title and end card over the photoreal shots; `python3 film.py --mux ../DELIVERABLES/film/audio/lyria_a.mp3 --name meme_island_photoreal --foley ../DELIVERABLES/film/foley`
   adds the score with the foley bed underneath.
7. `FILM=meme_island_photoreal python3 hype.py`, then mlow-video-cuts `variants.py` into `hype/cuts_photoreal/`.

Spend: about $21.00 on FLORA (Creative Partner workspace) plus two small Krea test jobs, against a $25 budget.
