"""MEME ISLAND promo: the hook clip (MP4 master for the GIF and X) and the cover from a FLORA Seedream plate.

    python3 promo.py hook                  ->  DELIVERABLES/promo/meme_island_hook.mp4 (then mlow-video-cuts for the GIF)
    python3 promo.py cover PLATE.jpg NAME  ->  DELIVERABLES/promo/NAME.jpg (16:9) + NAME_header.jpg (1500 x 500)

The first frame already carries the hook: no fade in, the line is on screen before the viewer can scroll.
Text is only white, ink and Evil Eye Blue. Both marks are the real files, never generated.
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from film import tracked, twidth, NARROW, MONO, SERIF, INK, WHITE, BLUE, H

OUT = os.path.join(H, '..', 'DELIVERABLES', 'promo'); os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(H, '..', 'DELIVERABLES', 'film', 'photoreal_final')
W, HH, FPS = 1920, 1080, 30
def mark(path, h):
    im = Image.open(path).convert('RGBA'); return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
M6529 = os.path.join(H, 'cache', '6529_white.png'); MLOW = os.path.join(H, 'cache', 'logo_white_full.png')

def clip(seg, start, dur):
    """Frames of a photoreal shot at real speed, cover-scaled to 1920 x 1080."""
    n = int(round(dur * FPS)); vf = f'fps={FPS},scale={W}:{HH}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{HH}'
    pr = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(start), '-i', os.path.join(SRC, f'seg{seg:02d}.mp4'), '-vf', vf, '-frames:v', str(n),
                           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    last = None
    for _ in range(n):
        b = pr.stdout.read(W * HH * 3)
        if len(b) == W * HH * 3: last = Image.frombytes('RGB', (W, HH), b)
        yield last.convert('RGBA')
    pr.stdout.close(); pr.wait()

def scrim(im, y0, y1, a=150):
    """Ink falloff band so white type reads over any shot."""
    g = Image.new('L', (1, y1 - y0)); mid = (y1 - y0) / 2
    for y in range(y1 - y0): g.putpixel((0, y), int(a * max(0, 1 - abs(y - mid) / mid) ** 0.6))
    band = Image.new('RGBA', (W, y1 - y0), INK + (0,)); band.putalpha(g.resize((W, y1 - y0))); im.alpha_composite(band, (0, y0))

def headline(im, lines, size=150, y=None, k=1.0, blue_last=False):
    d = ImageDraw.Draw(im); f = NARROW(size); lh = int(size * 1.02); tot = lh * len(lines)
    y = (HH - tot) // 2 if y is None else y; scrim(im, max(0, y - 90), min(HH, y + tot + 90), int(170 * k))
    for i, t in enumerate(lines):
        col = WHITE; x = (W - twidth(d, t, f, 0.01)) / 2
        if blue_last and i == len(lines) - 1:  # blue as a rule under the payoff line; blue type dies on hazy water
            tw = twidth(d, t, f, 0.01); d.rectangle((x, y + (i + 1) * lh + 6, x + tw, y + (i + 1) * lh + 18), fill=BLUE + (int(255 * k),))
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); tracked(ImageDraw.Draw(sh), (x + 4, y + i * lh + 5), t, f, INK + (int(160 * k),), 0.01)
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); tracked(d, (x, y + i * lh), t, f, col + (int(255 * k),), 0.01)

def tag(im, text, k=1.0):
    """Lower third counter, mono, blue rule above."""
    d = ImageDraw.Draw(im); f = NARROW(96); w = twidth(d, text, f, 0.02); x = (W - w) / 2; y = HH - 250
    scrim(im, y - 60, y + 170, int(150 * k)); d.rectangle((W // 2 - 60, y - 24, W // 2 + 60, y - 18), fill=BLUE + (int(255 * k),))
    tracked(d, (x, y), text, f, WHITE + (int(255 * k),), 0.02)

def lockup(im, y, h=88, k=1.0):
    """6529 mark  x  MLow wordmark, centred, white, the real files."""
    a, b = mark(M6529, h), mark(MLOW, int(h * 0.82)); d = ImageDraw.Draw(im); fx = NARROW(int(h * 0.9))
    gap = int(h * 0.55); xw = d.textlength('×', font=fx); total = a.width + gap + xw + gap + b.width; x = (W - total) / 2
    for m, mx, my in ((a, x, y), (b, x + a.width + gap + xw + gap, y + (h - b.height) // 2)):
        m = m.copy(); m.putalpha(m.split()[3].point(lambda v: int(v * k))); im.alpha_composite(m, (int(mx), int(my)))
    d.text((x + a.width + gap + xw / 2, y + h / 2), '×', font=fx, fill=WHITE + (int(255 * k),), anchor='mm')

def end_card(bg, u):
    im = bg.copy(); dim = Image.new('RGBA', im.size, INK + (int(150 + 60 * min(1, u * 3)),)); im.alpha_composite(dim)
    k = lambda i: max(0, min(1, (u - i * 0.07) * 5)); d = ImageDraw.Draw(im)
    f = SERIF(210); s = 'MEME ISLAND'; d.text(((W - d.textlength(s, font=f)) / 2, 250 + (1 - k(0)) * 24), s, font=f, fill=WHITE + (int(255 * k(0)),))
    d.rectangle((W // 2 - 60, 520, W // 2 + 60, 526), fill=BLUE + (int(255 * k(1)),))
    tracked(d, (0, 556), 'THE MEMES BY 6529  ×  NEW YORKERS BY MLOW', NARROW(48), WHITE + (int(255 * k(1)),), 0.04, True, W)
    tracked(d, (0, 630), '527 MEMES  ·  66 SCULPTURES  ·  ONE ISLAND THAT KEEPS NEW YORK TIME', MONO(28, 600), WHITE + (int(225 * k(2)),), 0.1, True, W)
    lockup(im, 760, 96, k(3))
    return im

def hook():
    out = os.path.join(OUT, 'meme_island_hook.mp4')
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{HH}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    put = lambda im: enc.stdin.write(im.convert('RGB').tobytes())
    # beat 1, the hook: on screen from frame one
    for im in clip(0, 0.8, 1.5): headline(im, ['THIS ISLAND', 'DOES NOT EXIST.']); put(im)
    for im in clip(0, 2.3, 1.4): headline(im, ['YOU CAN STILL', 'WALK IT.'], blue_last=True); put(im)
    # beat 2, the proof: hard cuts, one counter per three shots
    shots = [(1, 3.0, '527 MEMES'), (16, 1.6, '527 MEMES'), (5, 4.0, '527 MEMES'), (7, 4.4, '66 SCULPTURES'), (9, 2.0, '66 SCULPTURES'),
             (6, 5.0, '66 SCULPTURES'), (10, 3.0, 'ONE ISLAND'), (18, 3.0, 'ONE ISLAND')]
    for seg, st, t in shots:
        for i, im in enumerate(clip(seg, st, 0.72)): tag(im, t); put(im)
    # beat 3, the name and both marks over the aerial
    n = int(3.2 * FPS)
    for i, im in enumerate(clip(17, 4.0, 3.2)): put(end_card(im, i / n))
    enc.stdin.close(); enc.wait(); print('wrote', out, os.path.getsize(out) // 1024, 'KB')

def cover(plate, name):
    base = Image.open(plate).convert('RGB'); bw, bh = base.size
    s = max(W / bw, HH / bh); base = base.resize((int(bw * s), int(bh * s)), Image.LANCZOS)
    base = base.crop(((base.width - W) // 2, (base.height - HH) // 2, (base.width - W) // 2 + W, (base.height - HH) // 2 + HH)).convert('RGBA')
    im = base.copy(); top = Image.new('L', (1, 560))
    for y in range(560): top.putpixel((0, y), int(185 * (1 - y / 560) ** 1.4))
    band = Image.new('RGBA', (W, 560), INK + (0,)); band.putalpha(top.resize((W, 560))); im.alpha_composite(band)
    d = ImageDraw.Draw(im); f = SERIF(200); t = 'MEME ISLAND'
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text(((W - d.textlength(t, font=f)) / 2 + 4, 52), t, font=f, fill=INK + (150,))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8))); d.text(((W - d.textlength(t, font=f)) / 2, 46), t, font=f, fill=WHITE + (255,))
    d.rectangle((W // 2 - 60, 290, W // 2 + 60, 296), fill=BLUE + (255,))
    bot = Image.new('L', (1, 380))  # credit line sits with the marks, so the sky above stays the picture's
    for y in range(380): bot.putpixel((0, y), int(190 * (y / 380) ** 1.2))
    band = Image.new('RGBA', (W, 380), INK + (0,)); band.putalpha(bot.resize((W, 380))); im.alpha_composite(band, (0, HH - 380))
    tracked(d, (0, HH - 236), 'THE MEMES BY 6529  ×  NEW YORKERS BY MLOW', NARROW(46), WHITE + (255,), 0.04, True, W)
    lockup(im, HH - 150, 84)
    im.convert('RGB').save(os.path.join(OUT, name + '.jpg'), quality=94)
    # X header 1500 x 500: the plate's middle band, title left, marks right (X puts the avatar bottom left)
    hb = base.resize((1500, 844), Image.LANCZOS).crop((0, 170, 1500, 670))
    d = ImageDraw.Draw(hb); R = 1500 - 70; f = SERIF(118); t = 'MEME ISLAND'  # right side: X puts the avatar bottom left
    g2 = Image.new('L', (1500, 1))
    for x in range(1500): g2.putpixel((x, 0), int(200 * max(0, (x - 650) / 850) ** 1.1))
    sh3 = Image.new('RGBA', (1500, 500), INK + (0,)); sh3.putalpha(g2.resize((1500, 500))); hb.alpha_composite(sh3); d = ImageDraw.Draw(hb)
    d.text((R - d.textlength(t, font=f), 96), t, font=f, fill=WHITE + (255,))
    d.rectangle((R - 80, 236, R, 240), fill=BLUE + (255,)); cl = 'THE MEMES BY 6529  ×  NEW YORKERS BY MLOW'; fc = NARROW(28)
    tracked(d, (R - twidth(d, cl, fc, 0.04), 258), cl, fc, WHITE + (255,), 0.04)
    a, b = mark(M6529, 60), mark(MLOW, 48); fx = NARROW(54); xw = d.textlength('×', font=fx); gx = 26
    x0 = R - (a.width + gx + xw + gx + b.width); hb.alpha_composite(a, (int(x0), 330)); d.text((x0 + a.width + gx + xw / 2, 360), '×', font=fx, fill=WHITE + (255,), anchor='mm')
    hb.alpha_composite(b, (int(R - b.width), 336))
    hb.convert('RGB').save(os.path.join(OUT, name + '_header.jpg'), quality=94)
    print('wrote', name)

if __name__ == '__main__':
    if sys.argv[1] == 'hook': hook()
    elif sys.argv[1] == 'cover': cover(sys.argv[2], sys.argv[3])
