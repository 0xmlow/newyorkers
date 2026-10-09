"""Likeness pass on the SKELLY CUP holder paintings (MLow 2026-10-09: "nail the likeness to either their photos
or their pfps"). Ideogram 4.5 Precise Edit, the painting as reference 1 and the exact face as reference 2, change
ONLY the head (new-yorkers-honoraries references/likeness-pass.md). Avatar holders use their avatar; the 13 who
already had an honorary use that likeness checked portrait. Invented characters have no face to match: skipped.
Writes likeness/batch.json (rows for flora_create_generations) and likeness/keys.json (row order -> marble)."""
import json, os
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan = json.load(open(f"{H}/plan.json")); got = json.load(open(f"{H}/got.json")); hosted = json.load(open(f"{H}/hosted.json"))
WS, PRJ = "ws_qd74cjtasft9ydr6yqneqjkqax822mhs", "prj_ns765drs0xtf1d940e77ax6tq98fzkt3"
FIX = {
 "avatar": ("so it is unmistakably the character in reference 2, feature for feature: the same face shape, skin or fur or "
            "surface colour, eyes and eye colour, eyebrows, nose or snout, mouth and expression, facial hair, hair colour and "
            "style, headwear, glasses or visor, and every mark, accessory or detail on the head. If reference 2 is a cartoon, "
            "pixel, 3D or non human character, keep it that same character, not a generic human, repainted in thick oil"),
 "honoree": ("so it is unmistakably the same real person as reference 2, feature for feature: face shape and proportions, "
             "age, skin tone, eyes and eye colour, eyebrows, nose, mouth and smile, facial hair and its exact colour, hair "
             "colour, length and style, glasses and headwear if reference 2 has them"),
}
def prompt(kind):
    return ("Reference 1 is a finished oil painting. Keep everything exactly as it is: the place, the light, the crowd, the "
            "giant glass marble, the chalk lanes, the clothes, the pose, the paint texture and the signature. Change ONLY "
            "the head of the main figure " + FIX[kind] + ". Painted in the same thick oil as the rest of reference 1, not a "
            "photo, not pixel art.")
rows, keys = [], []
for e in plan:
    m = str(e["marbleId"]); k = e["kind"]
    if k not in FIX or m not in got or not got[m].get("url"): continue
    if m == "14": continue  # refired as invented after the avatar was moderated
    ref = hosted.get(e["refs"][0], e["refs"][0])
    rows.append({"workspace_id": WS, "project_id": PRJ, "type": "image", "model": "is2i-ideogram-4-5-precise-edit-is2i",
                 "prompt": prompt(k), "params": {"image_urls": [got[m]["url"], ref], "quality": "high", "seed": 11}})
    keys.append({"marble": m, "name": e["name"], "kind": k, "painting": got[m]["url"], "ref": ref})
json.dump(rows, open(f"{H}/likeness/batch.json", "w"), indent=1); json.dump(keys, open(f"{H}/likeness/keys.json", "w"), indent=1)
print(len(rows), "rows, about $%.2f" % (len(rows) * 0.105))
