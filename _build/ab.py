import base64, json, os, sys, time
from cdp import Page
LIB = open('capture_lib.js').read()
p = Page.open('http://127.0.0.1:4207/index.html?ab=1', 1280, 720); time.sleep(4); p.eval(LIB); p.eval('__cap.boot(1280,720)'); p.eval('__cap.loadAll()', timeout=900)
p.eval('__cap.set([2026,10,7,17,45], null, "")'); p.eval('__cap.railAt(17,0,1); __cap.settle(150)'); p.eval('__cap.railAt(17,0.65)')
for on in (1, 0):
    p.eval(f'__game.setPost({on}); __cap.settle(2)'); d = p.eval('__cap.grab(0.9)')
    open(f'/tmp/ab_{on}.jpg', 'wb').write(base64.b64decode(d.split(',', 1)[1]))
p.close()
from PIL import Image
a, b = Image.open('/tmp/ab_1.jpg'), Image.open('/tmp/ab_0.jpg'); s = Image.new('RGB', (1280, 1440)); s.paste(a, (0, 0)); s.paste(b, (0, 720)); s.save('/tmp/ab.jpg', quality=85)
