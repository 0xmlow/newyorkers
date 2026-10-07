"""MEME ISLAND, the three minute film. Every frame is the real engine, rendered headless at 1920x1080,
stepped at exactly 1/30 s, branded in PIL and piped straight into ffmpeg: nothing touches the disk but the MP4.

    python3 film.py               # whole film -> DELIVERABLES/film/meme_island_film_video.mp4
    python3 film.py --only 3      # one segment, for checking
    python3 film.py --mux music.mp3
"""
import base64, io, json, os, subprocess, sys, time
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from cdp import Page

H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'DELIVERABLES', 'film'); os.makedirs(OUT, exist_ok=True)
W, HH, FPS = 1920, 1080, 30
FF = 'ffmpeg'
HELV = lambda s, i=1: ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', s, index=i)
GEO = lambda s: ImageFont.truetype('/System/Library/Fonts/Supplemental/Georgia.ttf', s)
INK, CLOUD, BLUE, ORANGE = (13, 13, 13), (240, 244, 248), (41, 98, 255), (255, 107, 0)
D = (2026, 10, 7)
# rail name, local time, weather, prep js, title, line
SEGS = [
  ('arrivals', (*D, 17, 50), None, '', '"ARRIVALS"', 'MANHATTAN IS THE SMALL ISLAND OVER THERE.'),
  ('great wave', (*D, 17, 30), None, '', '"THE GREAT WAVE"', 'ONE OF 66 MEME SCULPTURES BY MLOW'),
  ('floor mountain', (*D, 16, 0), None, '', '"THE FLOOR"', 'ALL 527 CARDS. WATCH YOUR STEP. IT HAS REPRICED.'),
  ('sculpture rows', (*D, 15, 30), None, '', '"SEIZE"', 'THE MEMES BY 6529, NOW MONUMENTAL'),
  ('factory', (*D, 11, 0), None, 'g.seize()', '"MEMES OF PRODUCTION"', 'PULL THE LEVER. SEIZE THE MEANS.'),
  ('brain', (*D, 13, 0), None, '', '"BRAIN"', 'PLEASE REMOVE CONVICTION BEFORE ENTERING.'),
  ('lighthouse', (*D, 17, 55), None, '', '"HARDWARE WALLET LIGHTHOUSE"', 'THIS LIGHTHOUSE CANNOT RECOVER YOUR PASSWORD.'),
  ('vault', (*D, 12, 0), None, 'g.openVault()', '"THE VAULT"', 'SIX KEYS. NOT YOUR KEYS? NOW THEY ARE.'),
  ('open metaverse portal', (*D, 14, 30), None, '', '"OPEN METAVERSE"', 'DOOR SOMEHOW CLOSED.'),
  ('wagmi wheel', (*D, 18, 25), None, '', '"WAGMI"', 'PLEASE REMAIN SEATED.'),
  ('survive bunker', (*D, 12, 30), None, '', '"SURVIVE"', 'SURVIVE FIRST. REBRAND LATER.'),
  ('bank', (*D, 10, 30), None, '', '"FIRST NATIONAL BANK OF JPGs"', 'YOUR JPG IS IMPORTANT TO OUR COLLECTION.'),
  ('summer.jpg', (*D, 12, 0), None, '', '"SUMMER.JPG"', 'WEATHER UPDATES DISABLED.'),
  ('census walk', (*D, 9, 30), None, '', '"THE CENSUS WALK"', 'NEW YORKERS BY MLOW. MLOW PAINTED THE PEOPLE.'),
  ('bodega', (*D, 15, 0), None, '', '"6529 BODEGA"', 'OPEN BEFORE AND AFTER THE CYCLE.'),
  ('gm beach', (*D, 7, 0), None, '', '"GM BEACH"', 'GM IS A RENEWABLE RESOURCE.'),
  ('colossus', (*D, 17, 45), None, '', '"THE COLOSSUS OF 6529"', 'LIBERTY NOW SUPPORTS SELF CUSTODY.'),
  ('aerial', (*D, 17, 5), None, 'g.TIME.mode = "lapse"', '"LIVE NEW YORK SKY"', 'THE REAL SUN AND MOON OVER THE HARBOUR, EVERY MINUTE.'),
  ('harbour night', (2026, 10, 31, 21, 30), None, 'g.FW.show = 40', '"FIREWORKS"', 'BITCOIN WHITEPAPER DAY. THE CALENDAR IS REAL.'),
]
TITLE_S, END_S, FADE = 5.0, 7.0, 8

def rgba(path, h):
    im = Image.open(path).convert('RGBA'); return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
LOGO = rgba(os.path.join(H, 'cache', 'logo_white_full.png'), 64)
EYE = rgba(os.path.join(H, 'cache', 'eye_truecolor.png'), int(HH * 0.07))
EYE.putalpha(EYE.split()[3].point(lambda a: int(a * 0.35)))

def caption(im, title, line, k):
    """Abloh plaque, lower left: black plate, white quoted title, orange line. k is 0..1 for the slide in."""
    if k <= 0: return
    ft, fl = HELV(54), HELV(24, 0)
    d0 = ImageDraw.Draw(im); tw = max(d0.textlength(title, font=ft), d0.textlength(line, font=fl)) + 64
    plate = Image.new('RGBA', (int(tw), 132), INK + (int(225 * k),)); d = ImageDraw.Draw(plate)
    d.text((32, 20), title, font=ft, fill=(255, 255, 255, int(255 * k))); d.text((32, 88), line, font=fl, fill=ORANGE + (int(255 * k),))
    x = 72 - int((1 - k) * 40); im.alpha_composite(plate, (x, HH - 132 - 84))

def brand(im, t_in_film):
    im.alpha_composite(EYE, (W - EYE.width - int(W * 0.03), HH - EYE.height - int(HH * 0.03)))
    d = ImageDraw.Draw(im); d.text((72, 56), 'MEME ISLAND', font=HELV(20), fill=(255, 255, 255, 200))

def title_card(u):
    im = Image.new('RGBA', (W, HH), INK + (255,)); d = ImageDraw.Draw(im)
    a = min(1, u * 2.5) * min(1, (1 - u) * 4)
    lg = LOGO.copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * a))); im.alpha_composite(lg, ((W - lg.width) // 2, HH // 2 - 190))
    f = GEO(150); s = 'MEME ISLAND'; d.text(((W - d.textlength(s, font=f)) / 2, HH // 2 - 90), s, font=f, fill=(255, 255, 255, int(255 * a)))
    f2 = HELV(26, 0); s2 = '527 MEMES  ·  66 SCULPTURES  ·  ONE ISLAND'; d.text(((W - d.textlength(s2, font=f2)) / 2, HH // 2 + 110), s2, font=f2, fill=CLOUD + (int(230 * a),))
    return im

def end_card(u):
    im = Image.new('RGBA', (W, HH), INK + (255,)); d = ImageDraw.Draw(im); a = min(1, u * 3)
    lines = [(GEO(120), 'MEME ISLAND', (255, 255, 255), -160), (HELV(28, 0), 'THE MEMES BY 6529  ×  NEW YORKERS BY MLOW', CLOUD, 10), (HELV(24, 0), 'A WALKABLE ISLAND THAT KEEPS NEW YORK TIME', (136, 153, 170), 60), (HELV(34), 'n3wyorkers.com', BLUE, 160)]
    for i, (f, s, c, dy) in enumerate(lines):
        k = max(0, min(1, (u - i * 0.08) * 4)); d.text(((W - d.textlength(s, font=f)) / 2, HH // 2 + dy + (1 - k) * 20), s, font=f, fill=c + (int(255 * k * a),))
    lg = LOGO.copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * a))); im.alpha_composite(lg, ((W - lg.width) // 2, HH // 2 + 240))
    return im

def main():
    only = int(sys.argv[sys.argv.index('--only') + 1]) if '--only' in sys.argv else None
    name = f'seg{only:02d}' if only is not None else 'meme_island_film_video'
    out = os.path.join(OUT, name + '.mp4')
    enc = subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{HH}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    put = lambda im: enc.stdin.write(im.convert('RGB').tobytes())
    if only is None:
        for f in range(int(TITLE_S * FPS)): put(title_card(f / (TITLE_S * FPS)))
    p = Page.open('http://127.0.0.1:4207/index.html?film=1', W, HH); time.sleep(4)
    p.eval(open(os.path.join(H, 'capture_lib.js')).read()); print('boot', p.eval(f'__cap.boot({W},{HH})')); print('sculptures', p.eval('__cap.loadAll()', timeout=900))
    tour = [r['name'] for r in p.eval('__game.TOUR.map(r => ({ name: r.name, dur: r.dur }))')]
    durs = {r['name']: r['dur'] for r in p.eval('__game.TOUR.map(r => ({ name: r.name, dur: r.dur }))')}
    last = None; t_film = TITLE_S
    for si, (rail, when, wx, prep, title, line) in enumerate(SEGS):
        if only is not None and si != only: continue
        i = tour.index(rail); dur = durs[rail]; n = int(dur * FPS); t0 = time.time()
        p.eval(f'__cap.set({json.dumps(list(when))}, {json.dumps(wx)}, {json.dumps(prep)})')
        p.eval(f'__cap.railAt({i}, 0); __game.TIME.mode = {json.dumps("lapse" if "lapse" in prep else "fixed")}; __cap.settle(150)')
        if 'FW' in prep: p.eval('__cap.settle(150)')
        p.eval(f'__game.playRail(Object.assign({{}}, __game.TOUR[{i}], {{ done: null }})); __game.RAIL.dur = {dur}')
        for f in range(n):
            d = p.eval(f'__game.step({1 / FPS}, 1); __cap.grab(0.9)')
            im = Image.open(io.BytesIO(base64.b64decode(d.split(',', 1)[1]))).convert('RGBA')
            if f < FADE and last is not None: im = Image.blend(last, im, (f + 1) / (FADE + 1))
            u = f / n; k = min(1, max(0, (u - 0.08) * 5)) * min(1, max(0, (0.92 - u) * 6))
            caption(im, title, line, k); brand(im, t_film + f / FPS); put(im)
            if f == n - 1: last = im
        t_film += dur; print(f'{si:02d} {rail} {n} frames {time.time() - t0:.0f}s', flush=True)
    p.close()
    if only is None:
        for f in range(int(END_S * FPS)): put(end_card(f / (END_S * FPS)))
    enc.stdin.close(); enc.wait(); print('wrote', out, os.path.getsize(out) // 1024, 'KB')

def mux(music, start=0.0):
    v = os.path.join(OUT, 'meme_island_film_video.mp4'); o = os.path.join(OUT, 'meme_island_film.mp4')
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout)
    subprocess.run([FF, '-v', 'error', '-y', '-i', v, '-ss', str(start), '-i', music, '-filter_complex', f'[1:a]apad,afade=t=in:d=1.5,afade=t=out:st={dur - 6}:d=5.5,volume=0.95[a]',
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(dur), '-movflags', '+faststart', o], check=True)
    print('wrote', o, os.path.getsize(o) // 1024, 'KB')

if __name__ == '__main__':
    if '--mux' in sys.argv: mux(sys.argv[sys.argv.index('--mux') + 1], float(sys.argv[sys.argv.index('--start') + 1]) if '--start' in sys.argv else 0.0)
    else: main()
