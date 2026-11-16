"""tools/carousel.py: every room from its photo spot (the same framing the in-gallery camera uses, v4.part.js PHOTO), shot
headless at 2160x2160 and branded with the same card the photo booth puts on a visitor's picture. work/carousel/NN_room.jpg."""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(R, "work", "carousel"); os.makedirs(OUT, exist_ok=True)
GB = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"; GR = "/System/Library/Fonts/Supplemental/Georgia.ttf"
SPOTS = [  # room, x, z, yaw, pitch, line, setup
    ("fifth", 10, 1.2, 0, 0.1, "Fifth Avenue, the show across the street", "await sleep(1500);"),
    ("channel", 10, 3.6, 0, 0.14, "the Channel Gardens, twelve wire angels", "for (let z = 6; z > -5; z -= 0.5) { at(10, z); await sleep(120); } await sleep(1500);"),
    ("rink", 10, 7.4, 0, 0.13, "the rink, a storey down", "await sleep(26000);"),
    ("tree", 10, 3.2, 0, 0.3, "the tree, the night it was lit", "hint('The switch').userData.click(); await sleep(40000);"),
    ("top", 10, -1.55, -0.5, 0.2, "seventy floors up, one fortieth of a New Yorker", "window.LIGHTINGS.tree = true; hint('Step inside the model').userData.click(); await sleep(2500);"),
    ("menorah", 9, 1.0, -0.15, 0.24, "Fifth and Fifty Ninth", ""),
    ("market", 10, 3.4, 0, 0.1, "the holiday market, Union Square", ""),
    ("brooklyn", 10, 2.2, 0, 0.16, "Grand Army Plaza, Brooklyn", ""),
    ("window", 10, -5.9, 0, 0.15, "the answering windows", "const cs = __clickables.filter((m) => (m.userData.hint || '') === 'A candle'); for (let p = 0; p < 10; p++) for (const k of cs) { k.userData.click(); await sleep(30); } await sleep(11000);"),
    ("dyker", 10, 4.6, 0, 0.08, "Dyker Heights", "const p = hint('A projector'); for (let i = 0; i < 3; i++) { p.userData.click(); await sleep(250); } await sleep(4000);"),
]
only = sys.argv[1].split(",") if len(sys.argv) > 1 else None
WIDE = os.environ.get("WIDE") == "1"   # WIDE=1: plain 16:9 stills for the site page, site/shots/<room>.jpg, no brand band
SHOTS = os.path.join(R, "site", "shots"); os.makedirs(SHOTS, exist_ok=True)
for k, (room, x, z, yaw, pitch, line, setup) in enumerate(SPOTS):
    if only and room not in only: continue
    js = ("(async()=>{setInterval(()=>{if(window.__POWER)__POWER.blurred=false;document.querySelectorAll('#hud,#top,#rooms,#hint,#peek,#eggbox,#skate,#cross,#toast,#bars').forEach((e)=>e.style.setProperty('opacity','0','important'));},30);"
          "const sleep=(ms)=>new Promise(r=>setTimeout(r,ms)); const R=__ROOMS.find(r=>r.id==='%s'); const at=(x,z)=>{__P.x=R.x0+x;__P.z=z;}; const hint=(h)=>__clickables.find(m=>(m.userData.hint||'')===h);"
          " %s ; if('%s'!=='top'){__P.x=R.x0+%s;__P.z=%s;} __P.yaw=%s;__P.pitch=%s; await sleep(2500); return 1})()") % (room, setup, room, x, z, yaw, pitch)
    subprocess.run([sys.executable, os.path.join(R, "_build", "shot.py"), OUT, f"raw_{room}=room={room}", "--http", "4288", "--port", "9398", "--wait", "60", "--w", "1920" if WIDE else "1600", "--h", "1080" if WIDE else "1600", "--eval", js], capture_output=True, text=True)
    src = os.path.join(OUT, f"raw_{room}.png")
    if not os.path.exists(src): print("no shot", room); continue
    if WIDE: Image.open(src).convert("RGB").resize((1280, 720), Image.LANCZOS).save(os.path.join(SHOTS, f"{room}.jpg"), quality=86); os.remove(src); print("shot", room); continue
    img = Image.open(src).convert("RGB"); w, h = img.size; band = int(h * 0.1); cv = Image.new("RGB", (w, h + band), (5, 7, 12)); cv.paste(img, (0, 0)); d = ImageDraw.Draw(cv)
    d.rectangle([0, h, w, h + max(3, band // 30)], fill=(200, 160, 64))
    fl = Image.open("/Users/degens/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/782bdcfa-efbb-4f97-ac74-d97c73bc6dee/ab1a3ffb-cac2-4835-b4f4-489a319b8167/skills/apply-mlow-impermanent-vision/assets/reference-open-eye-flower.jpg").convert("RGB").resize((int(band * 0.78), int(band * 0.78)))
    cv.paste(fl, (int(band * 0.25), h + int(band * 0.11)))
    d.text((int(band * 1.25), h + int(band * 0.16)), "THE LIGHTINGS", font=ImageFont.truetype(GB, int(band * 0.34)), fill=(242, 235, 221))
    d.text((int(band * 1.25), h + int(band * 0.58)), f"{line}  ·  a walkable gallery by MLow", font=ImageFont.truetype(GR, int(band * 0.2)), fill=(154, 168, 200))
    f2 = ImageFont.truetype(GB, int(band * 0.24)); t = "N3WYORKERS.COM"; d.text((w - band * 0.35 - d.textlength(t, font=f2), h + int(band * 0.36)), t, font=f2, fill=(41, 98, 255))
    out = os.path.join(OUT, f"{k + 1:02d}_{room}.jpg"); cv.save(out, quality=90); os.remove(src); print("carousel", out)
