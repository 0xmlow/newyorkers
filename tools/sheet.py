"""tools/sheet.py OUT.jpg img... : a contact sheet, each image 520 px high, wrapped at 2600 px wide"""
import sys
from PIL import Image
out, fs = sys.argv[1], sys.argv[2:]; H = int(__import__('os').environ.get('SH', 520)); ims = []
for f in fs:
    i = Image.open(f).convert('RGB'); ims.append(i.resize((int(i.width * H / i.height), H)))
rows, row, w = [], [], 0
for i in ims:
    if w + i.width > 2600 and row: rows.append(row); row, w = [], 0
    row.append(i); w += i.width
rows.append(row)
S = Image.new('RGB', (max(sum(i.width for i in r) for r in rows), H * len(rows)), 'white')
for y, r in enumerate(rows):
    x = 0
    for i in r: S.paste(i, (x, y * H)); x += i.width
S.save(out, quality=80); print(out, S.size)
