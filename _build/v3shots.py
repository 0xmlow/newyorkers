import time, sys, os
from cdp import Page
from PIL import Image, ImageDraw
OUT = '/private/tmp/claude-501/sk/v3'; os.makedirs(OUT, exist_ok=True)
V = [
 ('a_enter', None),
 ('b_street', 'g.goZone("street"); g.P.z = 40; g.P.pitch = .12'),
 ('c_lobby', 'g.P.x=0; g.P.y=0; g.P.z=19.5; g.P.yaw=Math.atan2(-1,0.0001); g.P.pitch=.02'),
 ('d_ramp', 'g.goTurn(20, 12); g.P.yaw += .9'),
 ('e_champ', 'g.goTurn(20, 25); var a=Math.atan2(g.P.z,g.P.x); g.P.x -= Math.cos(a)*1.2; g.P.z -= Math.sin(a)*1.2'),
 ('f_void', 'g.goZone("cups"); g.P.x=1; g.P.z=-1; g.P.pitch=1.1'),
 ('g_cups', 'g.goZone("cups"); g.P.x=-1; g.P.z=6.5; g.P.yaw=Math.atan2(1,6.5)+Math.PI*0; g.P.pitch=-.2'),
 ('h_crown', 'g.goZone("crown"); g.P.pitch=.15; g.P.yaw += 1.2'),
 ('i_paddock', 'g.goZone("paddock"); g.P.z -= 6; g.P.yaw = Math.PI; g.P.pitch=-.1'),
 ('j_domino', 'g.P.x=19; g.P.y=0; g.P.z=10.5; g.P.yaw=Math.atan2(-0,-(-1))+Math.PI*0.5; g.P.pitch=-.25'),
]
only = sys.argv[1:]
p = Page.open('http://127.0.0.1:4311/index.html?lock=0&t=golden', 1440, 900); time.sleep(2)
for _ in range(80):
    if p.eval('!!(window.__game && __game.turnObjs.length)'): break
    time.sleep(.5)
time.sleep(2)
for name, js in V:
    if only and not any(o in name for o in only): continue
    if js is None: p.screenshot(f'{OUT}/{name}.jpg', 'jpeg', 80); p.eval('document.getElementById("go").click(); window.g = __game; 1'); time.sleep(2); continue
    p.eval(js + '; 1'); time.sleep(4.5); p.screenshot(f'{OUT}/{name}.jpg', 'jpeg', 80)
print('errors', p.eval('JSON.stringify(window.__errs)'))
print(p.eval("JSON.stringify(g.renderer.info.memory) + ' calls ' + g.renderer.info.render.calls"))
p.close()
fs = sorted(x for x in os.listdir(OUT) if x.endswith('.jpg')); w, h = 720, 450
S = Image.new('RGB', (2 * w, ((len(fs) + 1) // 2) * (h + 18)), (13, 13, 13)); d = ImageDraw.Draw(S)
for k, f in enumerate(fs):
    cx, cy = (k % 2) * w, (k // 2) * (h + 18); S.paste(Image.open(f'{OUT}/{f}').resize((w, h)), (cx, cy + 18)); d.text((cx + 6, cy + 3), f, fill=(255, 107, 0))
S.save('/private/tmp/claude-501/sk/v3.jpg', quality=80)
