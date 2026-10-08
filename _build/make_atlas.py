"""NEW YORKERS census pieces for the basement: one 4096 atlas of 256x144 tiles (16 x 16 = 256 slots) + data.json."""
import json, os, re
from PIL import Image
NY = '/Users/degens/Desktop/NEW YORKERS BY MLOW/GO LIVE PACKAGE/site/assets'
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'site', 'assets')
s = open(os.path.join(NY, 'data.js')).read(); P = json.loads(s[s.index('{'):s.rindex('}') + 1])['pieces']
by = {p['n']: p for p in P}
# hand picked by title, in hanging order: the rec room, the rat court, the bagel, the pipes, the rent wall, the screens, the strays
PICK = [39, 43, 530, 548, 550, 551, 554, 556, 569, 613, 767, 770, 772, 776, 779, 780, 787, 788, 791, 806, 816, 818, 868, 877, 888, 896, 899, 908, 911, 918, 926, 928, 932, 935, 945, 971, 972, 1050, 1052,
        1071, 1073, 1075, 1092, 1095, 1110, 1111, 1116, 1122, 1144, 1145, 1152, 1154, 1246, 1277, 1308, 1315, 1345, 1423, 1481, 1482, 1486, 1487, 1507, 1539, 1541, 1549, 1565, 1577, 1584, 1612, 1634, 1635,
        1670, 1690, 1699, 1735, 1837, 1841, 1885, 1902, 1903, 1932, 1949, 1955, 2152, 2249, 2277, 2383, 2475, 2477, 2487, 2540, 2624, 2689, 2723, 2727, 2729, 2827, 2871, 2896, 3092, 3147, 3161, 3181, 3186,
        3237, 3259, 3279, 3320, 3331, 3341, 3348, 3381, 3403, 3426, 3476, 3482, 3486, 3515, 3537, 3558, 3562, 3565, 3573, 3574, 3578, 3581, 3616, 3658, 3677, 3694, 3702, 3706, 3713, 3729, 3731, 3732, 3737,
        3742, 3746, 3754, 3755, 3767, 3769, 3770, 3798, 3880, 3881, 3885, 3919, 3930, 3942, 3948, 3955, 4025, 4113, 4155, 4159, 4187, 4294, 4298, 4349, 4450, 4458, 4475, 4893, 4896, 4904, 4907, 4910,
        4977, 5014, 5021, 5024, 5036, 5096, 5117, 5121, 5126, 5131, 5136, 5146, 5156, 5178, 5222, 5237, 5296, 5299, 5309, 5361, 5365, 5370, 5430, 5454, 5462, 5542, 5549, 5561, 5567, 5585, 5693]
TW, TH, COLS, ROWS, AW, AH = 256, 144, 16, 16, 4096, 2304
items, out = [], []
for n in PICK:
    p = by.get(n)
    if not p or not p.get('st'): continue
    f = os.path.join(NY, 't', p['st'][0] + '.jpg')
    if not os.path.exists(f): print('no thumb', n); continue
    im = Image.open(f).convert('RGB'); im.thumbnail((TW, TH), Image.LANCZOS); items.append((n, im, p))
sheet = Image.new('RGB', (AW, AH), (13, 13, 13))
for i, (n, im, p) in enumerate(items[:COLS * ROWS]):
    cx, cy = (i % COLS) * TW, (i // COLS) * TH; ox, oy = cx + (TW - im.width) // 2, cy + (TH - im.height) // 2; sheet.paste(im, (ox, oy))
    out.append({'n': n, 't': p['t'], 'f': p.get('f'), 'e': p['e'], 'nb': p.get('nb') or p.get('loc') or '', 'story': re.sub(r'\s+', ' ', p.get('story', ''))[:220],
                'uv': [0, round(ox / AW, 5), round(oy / AH, 5), round((ox + im.width) / AW, 5), round((oy + im.height) / AH, 5), round(im.width / im.height, 4)]})
sheet.save(os.path.join(OUT, 'ny0.jpg'), quality=82, optimize=True, progressive=True)
json.dump({'ny': out}, open(os.path.join(OUT, 'data.json'), 'w'), separators=(',', ':'))
print(len(out), 'pieces', os.path.getsize(os.path.join(OUT, 'ny0.jpg')) // 1024, 'KB')
