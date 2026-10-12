import time, sys, json
from cdp import Page
res = {}
p = Page.open('http://127.0.0.1:4311/index.html?go=1&bot=1&t=golden', 1280, 800); time.sleep(2)
for _ in range(80):
    if p.eval('!!(window.__game && __game.turnObjs.length)'): break
    time.sleep(.5)
p.eval('window.g=__game; 1')
for gid, limit in [(x, {"ringer": 90, "drop": 40, "dash": 120, "skee": 70}[x]) for x in (sys.argv[1:] or ["ringer", "drop", "dash", "skee"])]:
    for run in range(2):
        p.eval(f'document.getElementById("gm").classList.remove("on"); g.SG().open("{gid}"); document.getElementById("gmPlay").click(); 1')
        t0 = time.time(); sc = None
        while time.time() - t0 < limit:
            time.sleep(2)
            if p.eval('!g.MODE() && document.getElementById("gm").classList.contains("on") && !!document.querySelector("#gm .big")'):
                sc = p.eval('document.querySelector("#gm .big").innerText'); break
        res.setdefault(gid, []).append(sc); print(gid, run, sc, round(time.time() - t0), flush=True)
        if gid == "dash" and run == 0: p.screenshot('/private/tmp/claude-501/sk/res_dash.jpg', 'jpeg', 80)
print('errors', p.eval('JSON.stringify(window.__errs)'))
p.close()
