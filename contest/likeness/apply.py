"""Apply the likeness pass (2026-10-09): accepted edits replace contest/out/<marble>.jpg, the originals move to
contest/out_v1/. Decisions were made on the sheets in likeness/sheets (reference | before | after).

Rejected, the original stays:
- the PFP is not a face or a character, so the edit turned the rider's head into the object or the pattern:
  12 olegs13 (a silhouette), 41 AndrewRiBT (a glitch), 57 DrLumpia and 73 clay and 76 MrMeridian (abstract
  patterns), 59 alpurrt (a phone), 77 NorCal_Guy2 (a car)
- 31 MaryPat: the photo hides her face, so the edit hid the face
- 98 balon: the edit turned his painted pixel head into a realistic face, further from his honorary
OG (56) was refired with a pixel character prompt (his honorary is a pixel head, not a person).
"""
import json, os, shutil
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); C = os.path.dirname(H)
REJECT = {"12", "31", "41", "57", "59", "73", "76", "77", "98"}
got = json.load(open(f"{H}/got.json")); os.makedirs(f"{C}/out_v1", exist_ok=True)
done = {}
for m in sorted(got, key=int):
    src = f"{H}/out/{m}.jpg"
    if m in REJECT or not os.path.exists(src): done[m] = "kept original"; continue
    if not os.path.exists(f"{C}/out_v1/{m}.jpg"): shutil.move(f"{C}/out/{m}.jpg", f"{C}/out_v1/{m}.jpg")
    elif os.path.exists(f"{C}/out/{m}.jpg"): os.remove(f"{C}/out/{m}.jpg")
    Image.open(src).convert("RGB").save(f"{C}/out/{m}.jpg", "JPEG", quality=92)
    done[m] = "likeness pass " + got[m]["run"]
json.dump(done, open(f"{H}/applied.json", "w"), indent=1)
print(sum(v.startswith("likeness") for v in done.values()), "applied,", sum(v == "kept original" for v in done.values()), "kept")
