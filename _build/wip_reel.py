"""wip_reel.py: a vertical WIP reel of the FLORA nodes and the gallery they became, from the real outputs.
Writes work/wip/sewers_wip_9x16.mp4 (1080x1920, 30 fps, silent). No dates on any card (house rule)."""
import os, subprocess, json, math, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); J = lambda *p: os.path.join(HERE, *p)
W, H, FPS = 1080, 1920, 30
F = lambda n, s: ImageFont.truetype(J('site/fonts', n), s)
SERIF, MONO, SANS = 'Fraunces.ttf', 'IBMPlexMono-Medium.ttf', 'SpaceGrotesk.ttf'
ORDER = ['arrivals', 'slice', 'flushed', 'gator', 'fatberg', 'exchange', 'grate', 'pneumatic', 'steam', 'cityhall', 'border', 'throne']
NAMES = ['Arrivals', 'The Slice', 'Flushed', 'The Gator Room', 'The Fatberg', 'The Crumb Exchange', 'Lost Through the Grate', 'Beach Pneumatic', 'The Steam Baths', 'City Hall Loop', 'The Border', 'The Throne']
CAST = ['pizzarat', 'customs', 'goldfish', 'gator', 'cantor', 'trader', 'bodegacat', 'king']
CASTN = ['Pizza Rat', 'The Customs Rat', 'The Goldfish Broker', 'The Archive Gator', 'The Fatberg Cantor', 'The Crumb Trader', 'The Bodega Cat', 'The Sewer King']
GOLD = (245, 197, 66)

# ---------- the board: every node, laid out like the canvas ----------
def board():
    cw, gap = 520, 40
    rows = [('PLATES · NANO BANANA PRO', [J('work/plates_raw', n + '.png') for n in ORDER], 6, 21 / 9),
            ('WALLS · NANO BANANA 2.1', [J('site/assets/walls', n + '.jpg') for n in ORDER], 6, 16 / 9),
            ('CAST · NANO BANANA 2.1', [J('work/cast', n + '.png') for n in CAST], 8, 1.0),
            ('3D · TRIPO H3.1', [J('work/glb_prev', n + '.png') for n in CAST], 8, 1.0)]
    tw = 6 * cw + 5 * gap; y = 260; parts = []
    for title, fs, cols, asp in rows:
        w = (tw - (cols - 1) * gap) // cols; h = round(w / asp); n = len(fs); parts.append((title, y, fs, cols, w, h)); y += 70 + math.ceil(n / cols) * (h + gap + 36) + 50
    B = Image.new('RGB', (tw + 240, y + 100), (10, 10, 12)); d = ImageDraw.Draw(B)
    for gx in range(0, B.width, 32):
        for gy in range(0, B.height, 32): d.point((gx, gy), fill=(40, 40, 46))
    d.text((120, 90), 'LIVE FROM THE SEWERS · FLORA CANVAS', font=F(MONO, 54), fill=GOLD)
    for title, y0, fs, cols, w, h in parts:
        d.text((120, y0), title, font=F(MONO, 34), fill=(200, 196, 186))
        for k, f in enumerate(fs):
            x = 120 + (k % cols) * (w + gap); yy = y0 + 70 + (k // cols) * (h + gap + 36)
            im = Image.open(f).convert('RGBA'); bg = Image.new('RGBA', im.size, (255, 255, 255, 255) if 'glb_prev' in f else (0, 0, 0, 255)); im = Image.alpha_composite(bg, im).convert('RGB')
            im = im.resize((w, round(w * im.height / im.width))); im = im.crop((0, max(0, (im.height - h) // 2), w, max(0, (im.height - h) // 2) + h))
            d.rounded_rectangle((x - 4, yy - 4, x + w + 4, yy + h + 4), 10, fill=(34, 34, 40)); B.paste(im, (x, yy))
            d.text((x, yy + h + 8), (NAMES[k] if len(fs) == 12 else CASTN[k]).upper()[:26], font=F(MONO, 22), fill=(150, 146, 136))
    return B

def cover(im, w=W, h=H):
    s = max(w / im.width, h / im.height); im = im.resize((math.ceil(im.width * s), math.ceil(im.height * s)), Image.LANCZOS)
    return im.crop(((im.width - w) // 2, (im.height - h) // 2, (im.width - w) // 2 + w, (im.height - h) // 2 + h))
def ease(u): return u * u * (3 - 2 * u)
def caption(img, top, big, small=''):
    d = ImageDraw.Draw(img); y = 1420
    d.rectangle((0, y - 40, W, H), fill=(8, 8, 10))
    fs = 86
    while fs > 40 and max(d.textlength(l, font=F(SERIF, fs)) for l in big.split('\n')) > W - 140: fs -= 4
    d.text((70, y), top, font=F(MONO, 34), fill=GOLD); d.multiline_text((70, y + 60), big, font=F(SERIF, fs), fill=(244, 234, 210), spacing=6)
    if small: d.text((70, y + 60 + (fs + 12) * (big.count('\n') + 1) + 16), small, font=F(SANS, 38), fill=(200, 196, 186))
    d.text((70, H - 90), 'n3wyorkers.com', font=F(MONO, 30), fill=(150, 146, 136))
    return img

frames = []
def hold(img, secs): frames.extend([np.asarray(img)] * int(secs * FPS))

# 1. title over the arrivals plate
pl = Image.open(J('work/plates_raw/arrivals.png')).convert('RGB')
for i in range(int(2.6 * FPS)):
    u = i / (2.6 * FPS); im = cover(pl.crop((int(400 * u), 0, pl.width - 400 + int(400 * u), pl.height)), W, H).filter(ImageFilter.GaussianBlur(2))
    im = Image.blend(im, Image.new('RGB', (W, H), 'black'), 0.35)
    caption(im, 'WIP · BUILT IN FLORA', 'LIVE FROM\nTHE SEWERS', 'Home of the Pizza Rat.'); frames.append(np.asarray(im))
# 2. the Astra brief, typed
brief = ['ART DIRECTION · GPT-6 ASTRA', '', '1  ARRIVALS: customs confiscates', '   anything useful', '2  THE SLICE: a disputed holy event', '3  FLUSHED: the Upstate Farm', '4  THE GATOR ROOM: since 1935', '5  THE FATBERG: a cathedral', '6  THE CRUMB EXCHANGE', '7  LOST THROUGH THE GRATE', '8  BEACH PNEUMATIC, 1870', '9  THE STEAM BATHS', '10 CITY HALL LOOP', '11 THE BORDER: a bodega cat', '12 THE THRONE, by the minute']
txt = '\n'.join(brief); n = int(4.2 * FPS)
for i in range(n):
    im = Image.new('RGB', (W, H), (12, 12, 14)); d = ImageDraw.Draw(im); k = int(len(txt) * min(1, i / (n * 0.8)))
    d.multiline_text((70, 260), txt[:k], font=F(MONO, 40), fill=(220, 214, 200), spacing=22); frames.append(np.asarray(im))
# 3. the canvas, panned like a screen recording
B = board(); n = int(11 * FPS); vw = 1500
path = [(0.0, 120, 120), (0.22, B.width - vw - 60, 380), (0.45, 120, 1100), (0.7, B.width - vw - 60, 2000), (1.0, 300, B.height - vw * H // W - 40)]
for i in range(n):
    u = i / (n - 1)
    for a, b in zip(path, path[1:]):
        if a[0] <= u <= b[0]: t = ease((u - a[0]) / (b[0] - a[0])); x = a[1] + (b[1] - a[1]) * t; y = a[2] + (b[2] - a[2]) * t; break
    vh = vw * H // W; y = min(max(0, y), B.height - vh); x = min(max(0, x), B.width - vw)
    frames.append(np.asarray(B.crop((int(x), int(y), int(x) + vw, int(y) + vh)).resize((W, H), Image.BILINEAR)))
# 4. concept to 3D, one by one
for k, c in enumerate(CAST):
    a = cover(Image.open(J('work/cast', c + '.png')).convert('RGB'), W, 1300); g = Image.open(J('work/glb_prev', c + '.png')).convert('RGBA')
    gb = Image.new('RGBA', g.size, (18, 20, 24, 255)); g = cover(Image.alpha_composite(gb, g).convert('RGB'), W, 1300)
    m = int(0.9 * FPS)
    for i in range(m):
        t = ease(min(1, max(0, (i / m - 0.35) / 0.4))); im = Image.new('RGB', (W, H), (8, 8, 10)); im.paste(Image.blend(a, g, t), (0, 140))
        caption(im, 'CONCEPT  >  3D' if t < 0.5 else 'TRIPO H3.1 · FLORA', CASTN[k]); frames.append(np.asarray(im))
# 5. the rooms they became
for k, r in enumerate(ORDER):
    s = Image.open(J('work/check', r + '.jpg')).convert('RGB'); m = int(0.85 * FPS)
    for i in range(m):
        u = i / m; z = 1.0 + 0.06 * u; cw = int(s.height * 1300 / W / z * W / 1300 * 0.95)
        cw = int(s.height / 1300 * W / z); x0 = int((s.width - cw) / 2 + (u - 0.5) * 60)
        crop = s.crop((x0, 0, x0 + cw, s.height)).resize((W, 1300), Image.BILINEAR)
        im = Image.new('RGB', (W, H), (8, 8, 10)); im.paste(crop, (0, 140)); caption(im, f'ROOM {k + 1} OF 12 · WALKABLE', NAMES[k]); frames.append(np.asarray(im))
# 6. end card
im = Image.new('RGB', (W, H), (8, 8, 10)); sheet = cover(Image.open(J('work/contact_v2.jpg')).convert('RGB'), W, 1300); im.paste(sheet, (0, 140))
caption(im, '12 ROOMS · 12 TRICKS · ONE PIZZA RAT', 'COMING\nSOON'); hold(im, 2.4)

out = J('work/wip/sewers_wip_9x16.mp4')
p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
for f in frames: p.stdin.write(f.astype(np.uint8).tobytes())
p.stdin.close(); p.wait(); print(out, len(frames) / FPS, 's', os.path.getsize(out) // 1024, 'KB')
