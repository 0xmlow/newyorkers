"""Writes public/art.json: four sets of twelve New Yorkers for the twelve wall bays, themed on the listing, the move,
the building and the unreal. Reads NEW YORKERS SITE/assets/data.js for titles and stories, clones the 1000 px thumbs."""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); PUB = os.path.join(HERE, "..", "public")
SRC = os.path.join(HERE, "..", "..", "NEW YORKERS SITE", "assets")
s = open(os.path.join(SRC, "data.js")).read(); d = json.loads(s[s.index("{"):s.rindex("}") + 1])
by = {p["n"]: p for p in d["pieces"]}
SETS = [
 ("The listing", [932, 780, 971, 1113, 896, 1278, 1356, 1355, 889, 1428, 1153, 1152]),
 ("The move", [945, 1404, 943, 1421, 1423, 899, 1276, 1570, 1354, 1361, 1634, 846]),
 ("The building", [804, 1560, 782, 1309, 1258, 1046, 1541, 1581, 1380, 984, 1412, 1505]),
 ("The unreal", [1512, 1516, 1502, 1499, 1467, 1468, 1053, 1323, 1331, 579, 1545, 1040]),
]
out = []
for name, nums in SETS:
    assert len(nums) == 12, name
    for n in nums:
        p = by[n]; f = p["st"][0] + ".jpg"; dst = os.path.join(PUB, "art", f)
        if not os.path.exists(dst): subprocess.run(["cp", "-c", os.path.join(SRC, "t", f), dst], check=True)
        out.append(dict(number=n, title=p["t"], story=p.get("story", ""), aspect=p.get("ar") or 1.776,
                        file="art/" + f, set=name, place=p.get("nb") or p.get("b") or ""))
assert len({a["number"] for a in out}) == len(out)
json.dump(out, open(os.path.join(PUB, "art.json"), "w"), indent=1, ensure_ascii=False)
print(len(out), "works in", len(SETS), "sets")
