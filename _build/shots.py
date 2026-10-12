"""Contact sheet of THE SPIRAL from fixed views. python3 shots.py [query] [only...]"""
import sys, time, os
from cdp import Page
from PIL import Image, ImageDraw
OUT = '/private/tmp/claude-501/sk/shots'; os.makedirs(OUT, exist_ok=True)
q = sys.argv[1] if len(sys.argv) > 1 else '&offline=1'
only = sys.argv[2:]
V = [
 ('01_street', 'g.goZone("street")'),
 ('02_ramp_T16', 'g.goTurn(15); g.P.yaw += 0.0'),
 ('03_frame_T16_heat', 'g.goTurn(15, 6)'),
 ('04_champ_T16', 'g.goTurn(15, 25)'),
 ('05_void_up', 'g.goZone("cups"); g.P.pitch = 1.25'),
 ('06_cups', 'g.goZone("cups"); g.P.x=-1; g.P.z=2.5; g.P.pitch=-.15'),
 ('07_across_void', 'g.goTurn(20); g.P.yaw += Math.PI/2; g.P.pitch=-.1'),
 ('08_paddock', 'g.goZone("paddock"); g.P.z += 10'),
 ('09_glass', 'g.goZone("crown")'),
 ('10_live_turn', 'g.goTurn(g.NT-1, 12)'),
 ('11_wet_T40', 'g.goTurn(39, 3)'),
 ('12_bodega', 'g.P.x=-14; g.P.y=0; g.P.z=27; g.P.yaw=Math.atan2(1,0); g.P.pitch=0.05'),
]
p = Page.open('http://127.0.0.1:4311/index.html?go=1&lock=0' + q, 1440, 900); time.sleep(2)
for _ in range(80):
    if p.eval('!!(window.__game && __game.turnObjs.length)'): break
    time.sleep(.5)
p.eval('window.g = __game; 1'); time.sleep(3)
for name, js in V:
    if only and not any(o in name for o in only): continue
    print(name, p.eval(js + '; "ok"')); time.sleep(3.5)
    p.screenshot(f'{OUT}/{name}.jpg', 'jpeg', 80)
    print('  ', p.eval("document.getElementById('zone').innerText.replace(/\\n/g,' | ') + ' · ' + document.getElementById('prompt').innerText"))
print(p.eval("JSON.stringify(performance.memory ? {mb: Math.round(performance.memory.usedJSHeapSize/1e6)} : {}) + ' ' + JSON.stringify(g.renderer.info.memory) + ' calls ' + g.renderer.info.render.calls"))
p.close()
fs = sorted(x for x in os.listdir(OUT) if x.endswith('.jpg')); w, h = 720, 450
S = Image.new('RGB', (2 * w, ((len(fs) + 1) // 2) * (h + 18)), (13, 13, 13)); d = ImageDraw.Draw(S)
for k, f in enumerate(fs):
    cx, cy = (k % 2) * w, (k // 2) * (h + 18); S.paste(Image.open(f'{OUT}/{f}').resize((w, h)), (cx, cy + 18)); d.text((cx + 6, cy + 3), f, fill=(255, 107, 0))
S.save('/private/tmp/claude-501/sk/contact.jpg', quality=80)
