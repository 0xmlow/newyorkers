import sys, os
from PIL import Image, ImageDraw
pre = sys.argv[1]; out = sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
fs = sorted(f for f in os.listdir('shots') if f.startswith(pre) and f.endswith('.jpg'))
ims = [Image.open('shots/' + f) for f in fs]; w, h = 480, int(480 * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols; S = Image.new('RGB', (cols * w, rows * (h + 20)), (13, 13, 13)); d = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 20); S.paste(im.resize((w, h)), (x, y + 20)); d.text((x + 6, y + 4), f[len(pre):-4], fill=(255, 107, 0))
S.save(out, quality=86); print(out, S.size, ims[0].size)
