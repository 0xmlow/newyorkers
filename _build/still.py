"""Clean stills (no HUD) for the share card and the home card."""
import time
from cdp import Page
V = [('cover', 'g.goZone("cups"); g.P.x = 1.2; g.P.z = 1.5; g.P.pitch = 1.05; g.P.yaw = 2.2'),
     ('champion', 'g.goTurn(15, 25); var q = g.P; q.x *= 1.0'),
     ('street', 'g.goZone("street"); g.P.z = 44; g.P.pitch = .22')]
p = Page.open('http://127.0.0.1:4311/index.html?go=1&lock=0&t=golden', 1920, 1080); time.sleep(2)
for _ in range(80):
    if p.eval('!!(window.__game && __game.turnObjs.length)'): break
    time.sleep(.5)
p.eval('window.g = __game; document.querySelectorAll(".hud,#bar,#joy").forEach(function(e){ e.style.visibility = "hidden"; }); 1'); time.sleep(3)
for n, js in V:
    p.eval(js + '; 1'); time.sleep(4); p.screenshot(f'../DELIVERABLES/{n}.jpg', 'jpeg', 88); print(n)
p.close()
