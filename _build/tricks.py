"""tricks.py <out_dir> [ids]: play each room's trick headless and photograph the payoff (one fresh Chrome per room, via shot.py).
Every script runs in the page after load, drives the engine's own hooks (__P, __clickables, __ROOMS) and resolves when the
payoff should be on screen. Prints what the page reported, so a trick that never fires shows up as text, not a guess."""
import os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
PRE = """(async () => { setInterval(() => { if (window.__POWER) __POWER.blurred = false; }, 30); const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const R = __ROOMS.find((r) => r.id === '%s');
  const click = (hint) => { const o = __clickables.find((m) => (m.userData.hint || '') === hint); if (!o) return 'no ' + hint; o.userData.click(); return 'ok'; };
  const clicks = (hint) => __clickables.filter((m) => (m.userData.hint || '') === hint);
  const at = (x, z, yaw = 0, pitch = 0) => { __P.x = R.x0 + x; __P.z = z; __P.yaw = yaw; __P.pitch = pitch; };
  const eggs = () => __EGGSET().join(',');
"""
T = {
  # stand on the orange X, wait for the facade show to reach its eye flower
  "fifth": "at(10, 0, 0, 0.12); await sleep(19000); return 'eggs ' + eggs();",
  # walk the channel from the south end to the north, slowly, past all twelve angels
  "channel": "for (let z = 6; z > -6.6; z -= 0.25) { at(10, z, 0, 0.05); await sleep(220); } at(10, -6, 0, 0.1); await sleep(3500); return 'eggs ' + eggs();",
  # the switch: countdown, spiral, star; look up at it from the barrier
  "tree": "at(10, 2, 0, 0.32); const a = click('The switch'); await sleep(13600); return a + ' tree ' + window.LIGHTINGS.tree + ' eggs ' + eggs();",
  # the binoculars on the plaza model (the tree is lit if the previous room lit it: set it, the way a walk would)
  "top": "window.LIGHTINGS.tree = true; at(16.4, 5.0, 0, -0.18); const gl = __clickables.find((m) => (m.userData.hint || '') === 'A snow globe'); gl && gl.userData.click(); await sleep(1600); return 'globe ' + !!gl + ' eggs ' + eggs();",
  # the bucket up the menorah, then every lamp clicked until the order takes; shot from the bucket
  "menorah": "const up = __clickables.filter((m) => /bucket|lift|ride/i.test(m.userData.hint || '')); if (up[0]) up[0].userData.click(); await sleep(9000); const ls = __clickables.filter((m) => /lamp|shamash/i.test(m.userData.hint || '')); for (let p = 0; p < 10; p++) for (const l of ls) { l.userData.click(); await sleep(60); } await sleep(2500); return 'bucket ' + (up[0] && up[0].userData.hint) + ' lamps ' + ls.length + ' eggs ' + eggs();",
  # the tape measure three times, then the dreidel
  "brooklyn": "at(10, 2, 0, 0.1); const tp = __clickables.find((m) => /tape/i.test(m.userData.hint || '')); for (let i = 0; i < 3; i++) { tp && tp.userData.click(); await sleep(2600); } const dr = __clickables.find((m) => /dreidel/i.test(m.userData.hint || '')); dr && dr.userData.click(); await sleep(5000); return 'tape ' + !!tp + ' dreidel ' + !!dr + ' eggs ' + eggs();",
  # light the menorah on the sill in order (click every candle until it takes), then stand at the glass and watch the street
  "window": "const cs = clicks('A candle'); for (let p = 0; p < 10; p++) for (const k of cs) { k.userData.click(); await sleep(40); } at(10, -5.6, 0, 0.12); await sleep(19000); return 'candles ' + cs.length + ' wins ' + JSON.stringify(R.wins.map((w) => [+w.at.toFixed(1), +w.glow.toFixed(2), w.lit])) + ' eggs ' + eggs();",
  # throw the block switch and photograph the relight wave mid way
  "dyker": "if (window.__CROWD) window.__CROWD.on = false; at(10, 6.5, 0, 0.04); const sw = __clickables.find((m) => /main|switch|block|knife/i.test(m.userData.hint || '')); sw && sw.userData.click(); await sleep(6800); return 'switch ' + (sw && sw.userData.hint) + ' eggs ' + eggs();",
  # the rink: skate a loop and look at the gold trail
  "market": "at(10, 5.5, 0, 0.12); const st = __clickables.find((m) => /stall/i.test(m.userData.hint || '')); st && st.userData.click(); await sleep(3000); return 'stall ' + !!st + ' eggs ' + eggs();",
  "rink": "for (let a = 0; a < 6.4; a += 0.12) { at(10 + Math.cos(a) * 4, -0.5 + Math.sin(a) * 3, a, 0.15); await sleep(120); } await sleep(1500); return 'eggs ' + eggs();",
}
ids = re.findall(r"\{ id: '(\w+)'", open(os.path.join(HERE, "src", "rooms.js")).read())
if len(sys.argv) > 2: ids = [i for i in ids if i in sys.argv[2].split(",")]
for k, i in enumerate(ids):
    js = PRE % i + "  " + T[i] + "\n})()"
    r = subprocess.run([sys.executable, os.path.join(HERE, "shot.py"), OUT, f"{i}=room={i}", "--http", "4280", "--port", "9390", "--wait", "12", "--eval", js], capture_output=True, text=True)
    lines = [l for l in r.stdout.splitlines() if "eval:" in l or l.startswith(("EXC", "error"))]
    print(i, " | ".join(lines)[:600], flush=True)
    p = os.path.join(OUT, i + ".png")
    if os.path.exists(p):
        from PIL import Image; Image.open(p).convert("RGB").resize((960, 540)).save(os.path.join(OUT, i + ".jpg"), quality=82); os.remove(p)
