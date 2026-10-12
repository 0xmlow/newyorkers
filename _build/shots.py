"""Contact sheet of MoMLOW from fixed views, plus the audit and the console.
python3 _build/shots.py [phone] [only...]   (serve the staged site on 4312 and Chrome on 9333 first: see stage.sh)"""
import sys, time, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Page
OUT = '/private/tmp/claude-501/mm/shots'; os.makedirs(OUT, exist_ok=True)
only = sys.argv[1:]
W, H = 1440, 900
if only and only[0].startswith('phone'): W, H = 390, 844; only = only[1:]
for f in os.listdir(OUT):
    if f.endswith('_p.jpg') == (W < 500): os.remove(os.path.join(OUT, f))
V = [
 ('01_street', 'g.go(0); g.P.x=-9; g.P.z=-13; g.P.yaw=Math.PI-0.35; g.P.pitch=0.14'),
 ('02_facade', 'g.go(0); g.P.x=14; g.P.z=-24; g.P.yaw=Math.PI+0.45; g.P.pitch=0.42'),
 ('03_lobby', 'g.go(1); g.P.pitch=0.1'),
 ('04_lobby_wall', 'g.go(1); g.P.x=-3; g.P.z=16; g.P.yaw=Math.PI/2; g.P.pitch=0.1'),
 ('05_store', 'g.go(8); g.P.x=-19; g.P.z=10; g.P.yaw=Math.PI/2+0.3; g.P.pitch=0.05'),
 ('06_cafe', 'g.go(1); g.P.x=17; g.P.z=8; g.P.yaw=-Math.PI/2; g.P.pitch=0.05'),
 ('07_escalators', 'g.go(1); g.P.x=-21; g.P.z=23; g.P.yaw=Math.PI; g.P.pitch=0.25'),
 ('08_gardenlobby', 'g.go(1); g.P.x=0; g.P.z=30; g.P.yaw=Math.PI; g.P.pitch=0.05'),
 ('09_atrium', 'g.go(2); g.P.pitch=0.3'),
 ('10_atrium_up', 'g.go(2); g.P.x=-8; g.P.z=24; g.P.yaw=Math.PI/2; g.P.pitch=1.0'),
 ('11_f2_room', 'g.go(2); g.P.x=-27; g.P.z=6.5; g.P.yaw=Math.PI/2; g.P.pitch=0.05'),
 ('12_f2_north', 'g.go(2); g.P.x=0; g.P.z=34; g.P.yaw=Math.PI; g.P.pitch=0.05'),
 ('13_f3_room', 'g.go(3); g.P.x=27; g.P.z=20; g.P.yaw=-Math.PI/2; g.P.pitch=0.05'),
 ('14_f4_bridge', 'g.go(4); g.P.x=-9; g.P.z=21; g.P.yaw=Math.PI/2; g.P.pitch=0.1'),
 ('15_f4_void', 'g.go(4); g.P.x=12.5; g.P.z=20; g.P.yaw=Math.PI/2; g.P.pitch=-0.25'),
 ('16_f5_originals', 'g.go(5); g.P.x=-27; g.P.z=6.5; g.P.yaw=Math.PI/2; g.P.pitch=0.05'),
 ('17_f6_theme', 'g.go(6); g.P.x=-27; g.P.z=6.5; g.P.yaw=Math.PI/2; g.P.pitch=0.05'),
 ('18_f6_media', 'g.go(6); g.P.x=0; g.P.z=34; g.P.yaw=Math.PI; g.P.pitch=0.05'),
 ('19_terrace', 'g.go(9); g.P.x=-4; g.P.z=7; g.P.yaw=0.4; g.P.pitch=0.1'),
 ('20_garden', 'g.go(7); g.P.x=10; g.P.z=43; g.P.yaw=Math.PI+0.3; g.P.pitch=0.12'),
 ('21_counted', 'g.go(7); g.P.x=12; g.P.z=56; g.P.yaw=Math.PI; g.P.pitch=0.25'),
 ('22_garden_back', 'g.go(7); g.P.x=20; g.P.z=62; g.P.yaw=0.3; g.P.pitch=0.2'),
 ('26_anamorph', 'g.go(3); g.P.x=0; g.P.z=31.6; g.P.yaw=0; g.P.pitch=-0.72'),
 ('27_anamorph_off', 'g.go(2); g.P.x=-8; g.P.z=27; g.P.yaw=Math.PI/2; g.P.pitch=-0.35'),
 ('28_penrose', 'g.go(9); g.P.x=6; g.P.z=1.5; g.P.yaw=Math.PI; g.P.pitch=0.0'),
 ('29_hollow_eye', 'g.go(1); g.P.x=0; g.P.z=34.5; g.P.yaw=Math.PI; g.P.pitch=0.5'),
 ('30_cast', 'g.go(2); g.P.x=-6; g.P.z=11; g.P.yaw=Math.PI+0.3; g.P.pitch=0.05'),
 ('31_kiosk', 'g.go(0); g.P.x=40; g.P.z=-12; g.P.yaw=Math.PI-0.4; g.P.pitch=0.1'),
 ('32_illusion_f4', 'g.go(4); g.P.x=7.5; g.P.z=30.6; g.P.yaw=Math.PI; g.P.pitch=0.15'),
 ('33_mirror', 'g.go(1); g.P.x=-21; g.P.z=25; g.P.yaw=Math.PI; g.P.pitch=0.1'),
 ('34_bodega_wall', 'g.go(1); g.P.x=27; g.P.z=8; g.P.yaw=Math.PI; g.P.pitch=0.1'),
 ('35_lobby_desk', 'g.go(1); g.P.x=0; g.P.z=2.5; g.P.yaw=Math.PI; g.P.pitch=0.0'),
 ('36_garden_court', 'g.go(7); g.P.x=-4; g.P.z=55; g.P.yaw=Math.PI-0.2; g.P.pitch=0.05'),
 ('23_night_street', 'g.setPreset("night", true); g.go(0); g.P.x=-9; g.P.z=-13; g.P.yaw=Math.PI-0.35; g.P.pitch=0.14'),
 ('24_golden_garden', 'g.setPreset("golden", true); g.go(7); g.P.x=20; g.P.z=62; g.P.yaw=0.3; g.P.pitch=0.2'),
 ('25_night_atrium', 'g.go(2); g.P.pitch=0.3'),
]
q = '?go=1&lock=0&audit=1&time=day'
p = Page.open(f'http://127.0.0.1:4312/index.html{q}', W, H)
p.send('Runtime.enable')
time.sleep(3)
for _ in range(120):
    if p.eval('!!(window.__game && window.__audit)'): break
    time.sleep(.5)
print('props loaded:', p.eval('__game.props.then(a => a.filter(Boolean).length)'), 'failed:', p.eval('JSON.stringify(window.__propFail || [])'))
time.sleep(3)
a = json.loads(p.eval('JSON.stringify(__audit)'))
print('audit: works', a['works'], 'counted', a['counted'], 'fails', len(a['fails']), json.dumps(a['fails'][:12])[:1500])
print('works:', p.eval('__game.works.length'), 'npcs:', p.eval('__game.npcs.length'), 'errs:', p.eval('JSON.stringify(window.__errs)'))
p.eval('window.g = __game; 1')
for name, js in V:
    if only and not any(o in name for o in only): continue
    p.eval(js + '; 1'); time.sleep(3.4)
    print(name, 'zone:', p.eval('document.getElementById("zone").innerText.replace(/\\n/g," | ")'), 'full:', p.eval('__game.loadedFull'))
    p.screenshot(f'{OUT}/{name}{"_p" if W < 500 else ""}.jpg', 'jpeg', 80)
print('errors:', p.eval('JSON.stringify(window.__errs)'))
p.close()
