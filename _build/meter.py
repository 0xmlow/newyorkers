import base64, io, sys, time
from cdp import Page
from PIL import Image, ImageStat
LIB = open('capture_lib.js').read()
for ls in sys.argv[1:]:
    p = Page.open('http://127.0.0.1:4208/index.html?cap=1&ls=' + ls, 960, 540); time.sleep(3); p.eval(LIB); p.eval('__cap.boot(960,540)'); p.eval('__cap.loadAll()', timeout=300)
    out = []
    for i, u in [(2, 0.45), (5, 0.95), (8, 0.45), (10, 0.5), (4, 0.5)]:
        p.eval('__cap.railAt(%d, 0); __cap.settle(20); __cap.railAt(%d, %f)' % (i, i, u)); d = p.eval('__cap.grab(0.8)')
        im = Image.open(io.BytesIO(base64.b64decode(d.split(',', 1)[1]))).convert('L'); st = ImageStat.Stat(im); h = im.histogram(); clip = sum(h[245:]) / (im.width * im.height)
        out.append('%s mean %.0f clip %.1f%%' % (['den', 'laundry', 'bagel', 'court', 'cards'][len(out)], st.mean[0], clip * 100))
    print('ls', ls, '|', ' | '.join(out), flush=True); p.close()
