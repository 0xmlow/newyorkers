#!/usr/bin/env python3
"""Build THE MUSEUM mint kit as a network: every room one token, every room joined to the others by doors.

  python3 mint_network.py                                   # exports and previews from MUSEUM EXPORTS/2026-09-14 MINT
  python3 mint_network.py --rooms katz,bowery               # token media for a subset (the network pages are always all rooms)
  python3 mint_network.py --skip-glb --skip-media           # pages, metadata and docs only

Reads   MUSEUM EXPORTS/<day> MINT/          new-yorkers-museum-NN-id.{glb,png,json} from mint_export.py
        MUSEUM EXPORTS/<day> MINT/previews/ NNN-id/turn/*.jpg and day/*.jpg from mint_gifs.py
        _build/rooms.json, _build/museum/mint/places.json, assets/data.js, museum.html
Writes  MUSEUM MINT NETWORK <day>/
          network/      pin as ONE directory: lobby, shared engine and art, rooms/NNN-id/index.html, web GLBs, viewer
          tokens/       per token media: room.glb, room.web.glb, poster, preview.gif/mp4, daycycle.gif/mp4, hours.jpg
          metadata/     1.json ... N.json, the walkable page as animation_url
          metadata-object/  the same tokens with the web GLB as animation_url (ERC 7160 second state, or GLB first platforms)
          collection.json, network.json, manifest.csv, pin_plan.csv, finalize.py, validate.py, 00_START_HERE.md
"""
import argparse, csv, datetime, glob, json, math, os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, "..", ".."))
ROOT = os.path.abspath(os.path.join(SITE, ".."))
ap = argparse.ArgumentParser()
ap.add_argument("--day", default="2026-09-14")
ap.add_argument("--exports", default="")
ap.add_argument("--previews", default="")
ap.add_argument("--out", default="")
ap.add_argument("--base-url", default="https://n3wyorkers.com")
ap.add_argument("--rooms", default="")
ap.add_argument("--skip-glb", action="store_true")
ap.add_argument("--skip-media", action="store_true")
ap.add_argument("--jobs", type=int, default=4)
ap.add_argument("--royalty-bps", type=int, default=750)
A = ap.parse_args()
EXP = A.exports or os.path.join(ROOT, "MUSEUM EXPORTS", f"{A.day} MINT")
PRE = A.previews or os.path.join(EXP, "previews")
OUT = A.out or os.path.join(ROOT, f"MUSEUM MINT NETWORK {A.day}")
NET, TOK = os.path.join(OUT, "network"), os.path.join(OUT, "tokens")
ONLY = set(x for x in A.rooms.split(",") if x)
BASE = A.base_url.rstrip("/")
FFMPEG = shutil.which("ffmpeg")
if not FFMPEG:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

ROOMS = sorted(json.load(open(os.path.join(SITE, "_build/rooms.json"))), key=lambda r: r["index"])
PLACES = json.load(open(os.path.join(HERE, "mint/places.json")))
N = len(ROOMS)
stem = lambda r: f"{r['index']:03d}-{r['id']}"
exp_stem = lambda r: os.path.join(EXP, f"new-yorkers-museum-{r['index']:02d}-{r['id']}")


def wing_of(r):
    for w in PLACES["wings"]:
        if w["from"] <= r["index"] <= w["to"]:
            return w
    raise SystemExit(f"no wing for room {r['index']}")


def put(src, dst, link=False):
    """Copy unless an identical sized file is already there (reruns stay fast). link=True hardlinks when it can."""
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src):
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst):
        os.remove(dst)
    if link:
        try:
            os.link(src, dst); return
        except OSError:
            pass
    shutil.copy2(src, dst)


def run(cmd):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if p.returncode:
        raise RuntimeError(" ".join(cmd[:3]) + " failed:\n" + p.stdout[-1500:])
    return p.stdout


# ---------- the graph ----------
def build_graph():
    for r in ROOMS:
        r["wing"] = wing_of(r)
        r["borough"] = PLACES["borough"].get(r["id"])
        if not r["borough"]:
            raise SystemExit(f"places.json has no borough for {r['id']}")
    pos = {r["id"]: k for k, r in enumerate(ROOMS)}
    stride = round(N * 0.382)  # the golden stride: across the city lands far round the ring, never on a neighbour
    for k, r in enumerate(ROOMS):
        back, fwd = ROOMS[k - 1], ROOMS[(k + 1) % N]
        taken = {r["id"], back["id"], fwd["id"]}
        same = [x for x in ROOMS if x["borough"] == r["borough"]]
        j = same.index(r)
        boro = next((same[(j + s) % len(same)] for s in range(1, len(same)) if same[(j + s) % len(same)]["id"] not in taken), None)
        if boro:
            taken.add(boro["id"])
        across = next(ROOMS[(k + stride + s) % N] for s in range(N) if ROOMS[(k + stride + s) % N]["id"] not in taken)
        doors = [("back", back), ("forward", fwd)] + ([("borough", boro)] if boro else []) + [("across", across)]
        r["doors"] = [{"rel": rel, "token": d["index"], "room": f"{d['index']:03d}", "id": d["id"], "name": d["name"], "area": d["area"], "href": f"rooms/{stem(d)}/index.html"} for rel, d in doors]
    edges = [{"from": r["index"], "to": d["token"], "rel": d["rel"]} for r in ROOMS for d in r["doors"]]
    return {"rooms": [{"token": r["index"], "id": r["id"], "name": r["name"], "area": r["area"], "wing": r["wing"]["name"], "borough": r["borough"], "daylit": r["daylit"], "page": f"rooms/{stem(r)}/index.html"} for r in ROOMS], "edges": edges, "wings": PLACES["wings"]}


# ---------- the network directory ----------
GUARD = """(function(){if(!/[?&]auto(=|&|$)/.test(location.search))history.replaceState(null,'',location.pathname+(location.search?location.search+'&':'?')+'auto=1'+location.hash);var f=window.fetch;window.fetch=function(u,o){var s=typeof u==='string'?u:(u&&u.url)||'';if(s.indexOf('/api/')===0||s.indexOf('api/')===0)return Promise.resolve(new Response('{}',{status:200,headers:{'content-type':'application/json'}}));return f.apply(this,arguments)};
var rs=history.replaceState.bind(history),ps=history.pushState.bind(history),fix=function(u){return typeof u==='string'&&u.charAt(0)==='#'?location.pathname+location.search+u:u};
history.replaceState=function(a,b,u){return arguments.length>2?rs(a,b,fix(u)):rs(a,b)};history.pushState=function(a,b,u){return arguments.length>2?ps(a,b,fix(u)):ps(a,b)};})();"""


def live_link(m):
    path, frag = (m.group(2).split("#", 1) + [""])[:2]
    frag = "#" + frag if frag else ""
    if path == "index.html":
        url = BASE + "/"
    elif path.endswith(".html"):
        url = f"{BASE}/{path[:-5]}"
    else:
        url = f"{BASE}/{path}"
    return f'{m.group(1)}="{url}{frag}" target="_blank" rel="noopener"'


def room_page(html, r):
    s = re.sub(r'((?:src|href)="assets/[^"?#]+)\?[^"]*"', r'\1"', html)
    s = re.sub(r'\b(href)="(?!https?:|#|assets/|mailto:|javascript:|data:|")([^"]+)"', live_link, s)
    s = s.replace('href="#"', 'href="javascript:void(0)"')
    s = s.replace('<link rel="canonical" href="', '<link rel="canonical" data-live="')
    s = re.sub(r"<title>.*?</title>", f"<title>Room {r['index']:03d} · {r['name']} · THE MUSEUM · NEW YORKERS</title>", s, count=1, flags=re.S)
    net = {"room": f"{r['index']:03d}", "token": r["index"], "id": r["id"], "wing": r["wing"]["name"], "borough": r["borough"], "count": N, "doors": r["doors"], "viewer": f"viewer.html?src=rooms/{stem(r)}/room.web.glb&room={r['index']:03d}"}
    mint = {"room": r["id"], "day": A.day, "token": r["index"]}
    head = f'<base href="../../">\n<script>window.NY_MINT={json.dumps(mint)};window.NY_NET={json.dumps(net, ensure_ascii=False)};{GUARD}</script>\n'
    assert s.count("<head>") == 1 and "</body>" in s and "</head>" in s, "museum.html markers moved"
    s = s.replace("<head>", "<head>\n" + head, 1)
    s = s.replace("</head>", '<link rel="stylesheet" href="assets/mint/network.css">\n</head>', 1)
    s = s.replace("</body>", '<script src="assets/mint/network.js"></script>\n</body>', 1)
    return s


def build_network(recs, graph):
    html = open(os.path.join(SITE, "museum.html")).read()
    shared = sorted(set(re.findall(r'(?:src|href)="(assets/[^"?#]+)', html)))
    for rel in shared:
        put(os.path.join(SITE, rel), os.path.join(NET, rel))
    for p in glob.glob(os.path.join(SITE, "assets/atlas/*")):
        put(p, os.path.join(NET, "assets/atlas", os.path.basename(p)))
    for p in glob.glob(os.path.join(SITE, "assets/museum/rooms/*.jpg")):
        put(p, os.path.join(NET, "assets/museum/rooms", os.path.basename(p)))
    thumbs, props, images = set(), set(), set()
    for rec in recs.values():
        a = rec.get("assets", {})
        thumbs.update(a.get("thumbs", [])); props.update(a.get("props", [])); images.update(a.get("images", []))
    for t in thumbs | images:
        if os.path.exists(os.path.join(SITE, t)):
            put(os.path.join(SITE, t), os.path.join(NET, t))
    for name in props:
        p = os.path.join(SITE, f"assets/museum/props/{name}.glb")
        if os.path.exists(p):
            put(p, os.path.join(NET, f"assets/museum/props/{name}.glb"))
    for f in ("network.js", "network.css", "viewer.js"):
        put(os.path.join(HERE, "mint", f), os.path.join(NET, "assets/mint", f))
    for r in ROOMS:
        d = os.path.join(NET, "rooms", stem(r))
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w").write(room_page(html, r))
    json.dump(graph, open(os.path.join(NET, "network.json"), "w"), indent=1, ensure_ascii=False)
    open(os.path.join(NET, "viewer.html"), "w").write(VIEWER)
    open(os.path.join(NET, "index.html"), "w").write(lobby(graph))
    print(f"network: {len(shared)} shared files, {len(thumbs)} thumbs, {len(props)} props, {N} room pages")


def ring_svg(graph):
    R, C = 300, 340
    col = {w["key"]: c for w, c in zip(PLACES["wings"], ["#79d4e9", "#f2c14e", "#ef6f6c", "#b9a3ff", "#7bd389", "#f5f0e6"])}
    wkey = {r["token"]: next(w["key"] for w in PLACES["wings"] if w["from"] <= r["token"] <= w["to"]) for r in graph["rooms"]}
    xy = {r["token"]: (C + R * math.sin(2 * math.pi * (r["token"] - 1) / N), C - R * math.cos(2 * math.pi * (r["token"] - 1) / N)) for r in graph["rooms"]}
    out = [f'<svg viewBox="0 0 {2*C} {2*C}" role="img" aria-label="The network: {N} rooms on a ring, back and forward doors round it, borough and across the city doors through it">']
    out.append(f'<circle cx="{C}" cy="{C}" r="{R}" fill="none" stroke="rgba(238,241,246,.18)" stroke-width="1"/>')
    for e in graph["edges"]:
        if e["rel"] in ("across", "borough"):
            (x1, y1), (x2, y2) = xy[e["from"]], xy[e["to"]]
            op = ".16" if e["rel"] == "across" else ".30"
            out.append(f'<path d="M{x1:.1f},{y1:.1f} Q{C},{C} {x2:.1f},{y2:.1f}" fill="none" stroke="{col[wkey[e["from"]]]}" stroke-opacity="{op}" stroke-width="1"/>')
    for r in graph["rooms"]:
        x, y = xy[r["token"]]
        out.append(f'<a href="{r["page"]}"><circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="{col[wkey[r["token"]]]}"><title>{r["token"]:03d} · {r["name"]}</title></circle></a>')
    out.append("</svg>")
    legend = "".join(f'<span><i style="background:{col[w["key"]]}"></i>{w["name"]}</span>' for w in PLACES["wings"])
    return "\n".join(out), legend


def lobby(graph):
    svg, legend = ring_svg(graph)
    cards = []
    for w in PLACES["wings"]:
        rs = [r for r in ROOMS if w["from"] <= r["index"] <= w["to"]]
        cards.append(f'<section><h2>{w["name"]} <small>{len(rs)} rooms</small></h2><div class="grid">')
        for r in rs:
            tile = f"assets/museum/rooms/{r['id']}.jpg" if os.path.exists(os.path.join(SITE, f"assets/museum/rooms/{r['id']}.jpg")) else f"assets/mint/thumbs/{stem(r)}.jpg"
            cards.append(f'<a class="card" href="rooms/{stem(r)}/index.html"><img loading="lazy" src="{tile}" alt=""><span class="no">ROOM {r["index"]:03d} · {r["borough"].upper()}</span><b>{esc(r["name"])}</b><i>{esc(r["area"])}</i></a>')
        cards.append("</div></section>")
    return LOBBY.replace("{{N}}", str(N)).replace("{{SVG}}", svg).replace("{{LEGEND}}", legend).replace("{{CARDS}}", "\n".join(cards)).replace("{{BASE}}", BASE)


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


# ---------- token media ----------
def gif(frames_glob, out, width, fps, colors=200):
    vf = f"fps={fps},scale={width}:-1:flags=lanczos"
    with tempfile.TemporaryDirectory() as td:
        pal = os.path.join(td, "p.png")
        run([FFMPEG, "-y", "-v", "error", "-framerate", str(fps), "-pattern_type", "glob", "-i", frames_glob, "-vf", f"{vf},palettegen=max_colors={colors}:stats_mode=diff", pal])
        run([FFMPEG, "-y", "-v", "error", "-framerate", str(fps), "-pattern_type", "glob", "-i", frames_glob, "-i", pal, "-lavfi", f"{vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle", "-loop", "0", out])


def gif_fit(frames_glob, out, budget_mb=15):
    # a pan changes every pixel every frame, so GIFs run heavy: all 96 frames at 480 px and 12 fps (an 8 s loop) is about 13 MB, under OpenSea's 20 MB card budget
    for width, fps, colors in ((540, 12, 160), (480, 12, 128), (400, 12, 112), (360, 12, 96)):
        gif(frames_glob, out, width, fps, colors)
        if os.path.getsize(out) <= budget_mb * 1e6:
            return width
    return width


def mp4(frames_glob, out, fps=16, size=900):
    run([FFMPEG, "-y", "-v", "error", "-framerate", str(fps), "-pattern_type", "glob", "-i", frames_glob, "-vf", f"scale={size}:{size}:flags=lanczos", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", out])


def day_frames(day_dir, td, hold=6, blend=10):
    from PIL import Image
    keys = sorted(glob.glob(os.path.join(day_dir, "*.jpg")))
    ims = [Image.open(k).convert("RGB") for k in keys]
    n = 0
    for i, im in enumerate(ims):
        nxt = ims[(i + 1) % len(ims)]
        for _ in range(hold):
            im.save(os.path.join(td, f"{n:04d}.jpg"), quality=94); n += 1
        for b in range(1, blend + 1):
            t = b / (blend + 1)
            Image.blend(im, nxt, t * t * (3 - 2 * t)).save(os.path.join(td, f"{n:04d}.jpg"), quality=94); n += 1
    return keys


def contact_sheet(keys, out, cell=450):
    from PIL import Image
    cols = 3
    rows = math.ceil(len(keys) / cols)
    sheet = Image.new("RGB", (cell * cols, cell * rows), (8, 10, 14))
    for i, k in enumerate(keys):
        sheet.paste(Image.open(k).convert("RGB").resize((cell, cell), Image.LANCZOS), ((i % cols) * cell, (i // cols) * cell))
    sheet.save(out, quality=90, optimize=True, progressive=True)


def poster_jpg(src, dst, width):
    from PIL import Image
    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=90, optimize=True, progressive=True)


def optimize_glb(src, dst):
    run(["npx", "-y", "@gltf-transform/cli@4", "optimize", src, dst, "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024", "--instance", "false", "--flatten", "false", "--simplify", "false"])


def token_media(r):
    s, d = exp_stem(r), os.path.join(TOK, stem(r))
    os.makedirs(d, exist_ok=True)
    put(s + ".glb", os.path.join(d, "room.glb"), link=True)
    put(s + ".png", os.path.join(d, "poster.png"), link=True)
    put(s + ".json", os.path.join(d, "room.json"))
    if not os.path.exists(os.path.join(d, "poster.jpg")):
        poster_jpg(s + ".png", os.path.join(d, "poster.jpg"), 1600)
    thumb = os.path.join(NET, "assets/mint/thumbs", stem(r) + ".jpg")
    os.makedirs(os.path.dirname(thumb), exist_ok=True)
    if not os.path.exists(thumb):
        poster_jpg(s + ".png", thumb, 480)
    notes = []
    if not A.skip_glb:
        web = os.path.join(d, "room.web.glb")
        if not os.path.exists(web) or os.path.getmtime(web) < os.path.getmtime(os.path.join(d, "room.glb")):
            optimize_glb(os.path.join(d, "room.glb"), web)
        put(web, os.path.join(NET, "rooms", stem(r), "room.web.glb"), link=True)
    if not A.skip_media:
        pre = os.path.join(PRE, stem(r))
        if not os.path.exists(os.path.join(pre, "done.json")):
            notes.append("no previews captured")
        else:
            turn = os.path.join(pre, "turn", "*.jpg")
            if not os.path.exists(os.path.join(d, "preview.gif")):
                notes.append(f"preview.gif {gif_fit(turn, os.path.join(d, 'preview.gif'))}px")
            if not os.path.exists(os.path.join(d, "preview.mp4")):
                mp4(turn, os.path.join(d, "preview.mp4"))
            if r["daylit"] and glob.glob(os.path.join(pre, "day", "*.jpg")) and not os.path.exists(os.path.join(d, "daycycle.gif")):
                with tempfile.TemporaryDirectory() as td:
                    keys = day_frames(os.path.join(pre, "day"), td)
                    gif_fit(os.path.join(td, "*.jpg"), os.path.join(d, "daycycle.gif"))
                    mp4(os.path.join(td, "*.jpg"), os.path.join(d, "daycycle.mp4"))
                    contact_sheet(keys, os.path.join(d, "hours.jpg"))
    return r["id"], notes


# ---------- metadata ----------
MIME = {".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".mp4": "video/mp4", ".json": "application/json", ".html": "text/html"}


def token_files(r):
    d = os.path.join(TOK, stem(r))
    order = ["preview.gif", "preview.mp4", "daycycle.gif", "daycycle.mp4", "hours.jpg", "poster.jpg", "poster.png", "room.web.glb", "room.glb", "room.json"]
    files = [{"uri": f"network/rooms/{stem(r)}/index.html", "type": "text/html", "role": "the walkable room"}]
    role = {"preview.gif": "preview loop", "preview.mp4": "preview loop", "daycycle.gif": "the day in this room", "daycycle.mp4": "the day in this room", "hours.jpg": "nine hours of light", "poster.jpg": "poster", "poster.png": "poster, full render", "room.web.glb": "the room as an object, compressed (meshopt, webp)", "room.glb": "the room as an object, full", "room.json": "the export record"}
    for f in order:
        p = os.path.join(d, f)
        if os.path.exists(p):
            files.append({"uri": f"tokens/{stem(r)}/{f}", "type": MIME[os.path.splitext(f)[1]], "bytes": os.path.getsize(p), "role": role[f]})
    return files


def metadata(r, rec, by_n, object_view=False):
    hang = rec.get("hang", [])
    pieces = [by_n[h["n"]] for h in hang if h.get("n") in by_n]
    fams = sorted(set(p.get("f") for p in pieces if p.get("f")))
    eras = sorted(set(p.get("e") for p in pieces if p.get("e")))
    daylit = r["daylit"]
    doors = r["doors"]
    names = ", ".join(d["name"] for d in doors[:-1]) + " and " + doors[-1]["name"]
    light = ("The light follows the New York clock, so the room you open at noon is not the room you open at midnight." if daylit
             else "The room keeps its own hour, whatever the time in New York.")
    desc = (f"{r['description']} Room {r['index']:03d} of THE MUSEUM, the walkable virtual gallery of NEW YORKERS by MLow, "
            f"with {len(hang)} works from the census on its walls. {light} "
            f"Its doors open onto {names}, and the lobby opens every room in the network. "
            f"The room also ships as a GLB for any 3D viewer.")
    attrs = [
        {"trait_type": "Room", "value": r["index"], "display_type": "number"},
        {"trait_type": "Wing", "value": r["wing"]["name"]},
        {"trait_type": "Borough", "value": r["borough"]},
        {"trait_type": "Place", "value": r["area"]},
        {"trait_type": "Mood", "value": r["mood"]},
        {"trait_type": "Light", "value": "New York clock" if daylit else "Fixed hour"},
        {"trait_type": "Works on the walls", "value": len(hang), "display_type": "number"},
        {"trait_type": "Eras on the walls", "value": len(eras), "display_type": "number"},
    ] + [{"trait_type": "Family on the walls", "value": f} for f in fams]
    files = token_files(r)
    web = f"tokens/{stem(r)}/room.web.glb"
    return {
        "name": f"THE MUSEUM · Room {r['index']:03d} · {r['name']}",
        "description": desc,
        "image": f"tokens/{stem(r)}/preview.gif",
        "animation_url": web if object_view else f"network/rooms/{stem(r)}/index.html",
        "external_url": f"{BASE}/museum#room={r['id']}",
        "background_color": r["color"].lstrip("#"),
        "attributes": attrs,
        "properties": {
            "collection": "THE MUSEUM · NEW YORKERS",
            "artist": "MLow",
            "room_id": r["id"],
            "token": r["index"],
            "wing": r["wing"]["name"],
            "borough": r["borough"],
            "view": "object" if object_view else "walkable",
            "signatures": r.get("signatures", ""),
            "network": {"lobby": "network/index.html", "graph": "network/network.json", "doors": [{k: d[k] for k in ("rel", "token", "id", "name")} for d in doors]},
            "dynamic": {
                "light": "Daylit rooms blend sky, sun, moon, fog and window glow by the hour in America/New_York." if daylit else "This room holds a fixed hour.",
                "hang": f"The token pins the hang of {A.day}; the live museum reshuffles every room's New Yorkers from the New York date seed each day.",
                "live": f"{BASE}/museum#room={r['id']}",
            },
            "hang_day": A.day,
            "poster_hour": rec.get("hour"),
            "stats": {"mounts": rec.get("mounts"), "triangles": rec.get("triangles"), "draw_calls": rec.get("calls")},
            "files": files,
            "works": [{"n": h.get("n"), "title": h.get("t")} for h in hang],
        },
    }


# ---------- collection level ----------
def covers(recs):
    from PIL import Image
    have = [r for r in ROOMS if os.path.exists(os.path.join(TOK, stem(r), "poster.jpg"))]
    if not have:
        return
    os.makedirs(os.path.join(NET, "collection"), exist_ok=True)
    pick = have[:: max(1, len(have) // 16)][:16]
    sq = Image.new("RGB", (1200, 1200), (8, 10, 14))
    for i, r in enumerate(pick):
        im = Image.open(os.path.join(TOK, stem(r), "poster.jpg")).convert("RGB")
        s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((300, 300), Image.LANCZOS)
        sq.paste(im, ((i % 4) * 300, (i // 4) * 300))
    sq.save(os.path.join(NET, "collection", "cover.jpg"), quality=90)
    pick = have[:: max(1, len(have) // 10)][:10]
    ban = Image.new("RGB", (1500, 500), (8, 10, 14))
    for i, r in enumerate(pick):
        im = Image.open(os.path.join(TOK, stem(r), "poster.jpg")).convert("RGB")
        w = 300; h = 250
        s = min(im.width / w, im.height / h)
        cw, ch = int(w * s), int(h * s)
        im = im.crop(((im.width - cw) // 2, (im.height - ch) // 2, (im.width + cw) // 2, (im.height + ch) // 2)).resize((w, h), Image.LANCZOS)
        ban.paste(im, ((i % 5) * 300, (i // 5) * 250))
    ban.save(os.path.join(NET, "collection", "banner.jpg"), quality=90)


def main():
    graph = build_graph()
    recs, missing = {}, []
    for r in ROOMS:
        s = exp_stem(r)
        if all(os.path.exists(s + e) for e in (".glb", ".png", ".json")):
            recs[r["id"]] = json.load(open(s + ".json"))
        else:
            missing.append(r["id"])
    os.makedirs(OUT, exist_ok=True)
    build_network(recs, graph)
    todo = [r for r in ROOMS if r["id"] in recs and (not ONLY or r["id"] in ONLY)]
    with ThreadPoolExecutor(A.jobs) as ex:
        for rid, notes in ex.map(token_media, todo):
            print(f"  {rid:<16} {'; '.join(notes)}", flush=True)
    raw = open(os.path.join(SITE, "assets/data.js")).read()
    by_n = {p["n"]: p for p in json.loads(raw[raw.index("{"):raw.rindex("}") + 1])["pieces"]}
    for sub in ("metadata", "metadata-object"):
        os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    manifest, plan = [], []
    for r in ROOMS:
        if r["id"] not in recs:
            continue
        for sub, obj in (("metadata", False), ("metadata-object", True)):
            json.dump(metadata(r, recs[r["id"]], by_n, obj), open(os.path.join(OUT, sub, f"{r['index']}.json"), "w"), indent=1, ensure_ascii=False)
        files = token_files(r)
        size = lambda f: next((x.get("bytes", 0) for x in files if x["uri"].endswith("/" + f)), 0)
        manifest.append({"token": r["index"], "id": r["id"], "name": r["name"], "wing": r["wing"]["name"], "borough": r["borough"], "daylit": r["daylit"], "works": len(recs[r["id"]].get("hang", [])),
                         "glb_mb": round(size("room.glb") / 1e6, 1), "web_glb_mb": round(size("room.web.glb") / 1e6, 1), "preview_gif_mb": round(size("preview.gif") / 1e6, 1), "daycycle_gif_mb": round(size("daycycle.gif") / 1e6, 1),
                         "doors": " ".join(f"{d['rel']}:{d['token']}" for d in r["doors"])})
        for f in files:
            if f["uri"].startswith("tokens/"):
                plan.append({"path": f["uri"], "pin_name": f"the-museum-{r['index']:03d}-{os.path.basename(f['uri'])}", "bytes": f["bytes"], "cid": ""})
    with open(os.path.join(OUT, "manifest.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(manifest[0].keys())); w.writeheader(); w.writerows(manifest)
    with open(os.path.join(OUT, "pin_plan.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["path", "pin_name", "bytes", "cid"]); w.writeheader(); w.writerows(plan)
    json.dump(graph, open(os.path.join(OUT, "network.json"), "w"), indent=1, ensure_ascii=False)
    covers(recs)
    collection = {
        "name": "THE MUSEUM · NEW YORKERS",
        "description": ("THE MUSEUM is the walkable virtual gallery of NEW YORKERS by MLow: New York rooms built in Three.js and hung with works from the census. "
                        "Every token is one room, a page you can walk, the room as a GLB and the record of what hung on its walls the day it was minted. "
                        "Doors in every room open onto others and the lobby opens them all, so the collection is one museum. Daylit rooms follow the New York clock."),
        "image": "network/collection/cover.jpg",
        "banner_image": "network/collection/banner.jpg",
        "external_link": f"{BASE}/museum",
        "animation_url": "network/index.html",
        "seller_fee_basis_points": A.royalty_bps,
        "fee_recipient": "SET_ROYALTY_WALLET",
    }
    json.dump(collection, open(os.path.join(OUT, "collection.json"), "w"), indent=1, ensure_ascii=False)
    shutil.copy2(os.path.join(HERE, "mint", "00_START_HERE.md"), os.path.join(OUT, "00_START_HERE.md"))
    for f in ("mint_finalize_network.py", "mint_validate.py"):
        shutil.copy2(os.path.join(HERE, "mint", f), os.path.join(OUT, {"mint_finalize_network.py": "finalize.py", "mint_validate.py": "validate.py"}[f]))
    net_mb = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(NET) for f in fs) / 1e6
    tok_mb = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(TOK) for f in fs) / 1e6
    print(f"\n{len(manifest)} tokens · network {net_mb:,.0f} MB · tokens {tok_mb:,.0f} MB · {OUT}")
    if missing:
        print("rooms without exports:", ", ".join(missing))


VIEWER = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The room as an object · THE MUSEUM · NEW YORKERS</title>
<style>html,body{margin:0;height:100%;background:#0b0d12;color:#eef1f6;font:500 11px/1.4 'Space Grotesk','Helvetica Neue',Arial,sans-serif;letter-spacing:.14em}
#view{position:fixed;inset:0}#view canvas{display:block;width:100%;height:100%;touch-action:none}
#status{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%)}
nav{position:fixed;left:16px;top:16px;display:flex;gap:8px;flex-wrap:wrap}nav a{color:#eef1f6;text-decoration:none;padding:9px 13px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(12,15,20,.72)}
.hint{position:fixed;left:16px;bottom:16px;color:rgba(238,241,246,.55)}</style></head>
<body><div id="view"></div><div id="status">LOADING</div>
<nav><a id="back" href="index.html">THE LOBBY</a><a id="walk" href="index.html" hidden>WALK THIS ROOM</a></nav>
<div class="hint">DRAG TO TURN · SCROLL OR PINCH TO ZOOM</div>
<script>(function(){var q=new URLSearchParams(location.search),s=q.get('src')||'',m=s.match(/^rooms\\/([^/]+)\\//);if(m){var w=document.getElementById('walk');w.href='rooms/'+m[1]+'/index.html';w.hidden=false}})();</script>
<script type="module" src="assets/mint/viewer.js"></script></body></html>
"""

LOBBY = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Lobby · THE MUSEUM · NEW YORKERS by MLow</title>
<meta name="description" content="{{N}} walkable New York rooms by MLow, joined by doors into one museum.">
<link rel="icon" href="assets/brand/eye_truecolor.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{--ink:#0b0d12;--card:#12161d;--line:rgba(238,241,246,.12);--txt:#eef1f6;--mute:rgba(238,241,246,.58);--eye:#79d4e9}
*{box-sizing:border-box}html{background:var(--ink)}body{margin:0;background:var(--ink);color:var(--txt);font:400 15px/1.5 'Space Grotesk','Helvetica Neue',Arial,sans-serif;padding-inline:clamp(16px,4vw,48px);padding-block:28px 64px}
header{display:flex;align-items:center;gap:14px;flex-wrap:wrap}header img{height:30px}header .k{font-size:11px;letter-spacing:.2em;color:var(--mute)}
h1{font:600 clamp(34px,6vw,64px)/1.02 Fraunces,Georgia,serif;margin:28px 0 12px;max-width:16ch}
.lede{max-width:62ch;color:var(--mute);margin:0 0 28px}
.map{display:grid;grid-template-columns:minmax(0,560px) minmax(0,1fr);gap:32px;align-items:center;margin:8px 0 40px}
.map svg{width:100%;height:auto;max-width:560px}.map svg a circle{transition:r .15s}.map svg a:hover circle{r:8}
.legend{display:grid;gap:10px;font-size:12px;letter-spacing:.12em;text-transform:uppercase}.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:10px;vertical-align:middle}
.legend p{letter-spacing:0;text-transform:none;color:var(--mute);font-size:14px;max-width:46ch}
section{margin-top:44px}h2{font:600 26px/1.1 Fraunces,Georgia,serif;margin:0 0 16px}h2 small{font:500 11px 'Space Grotesk',sans-serif;letter-spacing:.18em;color:var(--mute);margin-left:10px;text-transform:uppercase}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.card{display:block;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;color:inherit;text-decoration:none}
.card:hover,.card:focus-visible{border-color:var(--eye);outline:none}
.card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#1b2029}
.card .no{display:block;padding:10px 12px 0;font-size:10px;letter-spacing:.18em;color:var(--eye)}
.card b{display:block;padding:2px 12px 0;font:600 17px/1.2 Fraunces,Georgia,serif}
.card i{display:block;padding:4px 12px 12px;font-style:normal;font-size:11px;letter-spacing:.08em;color:var(--mute)}
footer{margin-top:56px;color:var(--mute);font-size:12px}footer a{color:var(--txt)}
@media (max-width:820px){.map{grid-template-columns:1fr}}
</style></head><body>
<header><img src="assets/brand/logo_white.png" alt="MLow"><span class="k">NEW YORKERS · THE MUSEUM · THE LOBBY</span></header>
<h1>{{N}} rooms, one museum.</h1>
<p class="lede">Every room here is a token and a place you can walk. Each one hangs works from the NEW YORKERS census, and each has doors: back and forward round the ring, one to a room in the same borough and one across the city. Daylit rooms follow the New York clock.</p>
<div class="map">{{SVG}}<div class="legend">{{LEGEND}}<p>The ring is the walk from room to room. The lines through it are the borough and across the city doors. Choose any point to go in.</p></div></div>
{{CARDS}}
<footer>THE MUSEUM keeps moving on <a href="{{BASE}}/museum">{{BASE}}/museum</a>, where the hang changes every day.</footer>
</body></html>
"""

if __name__ == "__main__":
    main()
