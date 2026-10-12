"""brand_pass.py: make a CC0 model a NEW YORKERS one, in Blender.

Takes a passed GLB from work/glb_pass (a Poly Haven ph_*.glb, or any cast model), and per recipe:
  paint    repaints its base colour textures: tint (multiply toward a colour), paint (a gradient map from
           a dark to the colour, so the wear and detail stay), gild (gold, metallic) or raw factors
  stickers presses stickers from work/stickers (or a text label made on the spot) onto the real surface:
           a ray finds the face, a 9 x 9 grid is wrapped onto the mesh 2 mm proud, alpha masked
  adds     extra pieces: a disc (a nazar or eye flower standing on top), a card (a free plane anywhere)
then exports work/glb_pass/<name>.glb, with an optional preview render.

  Blender -b -P brand_pass.py -- <recipes.json> <name,name,...|all> [--force] [--preview <dir>]

A recipe:
  "nyb_trash_dsny": {"src": "ph_metal_trash_can",
     "paint": [{"op": "paint", "color": "#2f6b3a", "k": 0.85, "mat": "regex on material name"}],
     "stickers": [{"img": "label_counted_dept", "face": "-Y", "u": 0.5, "v": 0.55, "size": 0.32},
                  {"text": "MLOW CAB CO.", "bg": "#f5c542", "fg": "#0b1020", "face": "+X", "u": 0.5, "v": 0.5, "size": 0.6}],
     "adds": [{"type": "disc", "img": "nazar_die", "size": 0.18, "lift": 0.02}]}
Faces are in Blender space: -Y is the front (three.js +Z, what a model faces at ry 0), +Z is the top.
u runs left to right as you face that side, v runs bottom to top (for the top, front to back).
size is the sticker width in metres, or "fs" a fraction of the model's height.
"""
import bpy, bmesh, os, sys, json, math, re, tempfile
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
GLB = os.path.join(ROOT, "work", "glb_pass"); STK = os.path.join(ROOT, "work", "stickers")
TMP = tempfile.mkdtemp(prefix="brand_")
sys.path.insert(0, HERE)

args = sys.argv[sys.argv.index("--") + 1:]
RECIPES = json.load(open(args[0])); want = args[1]
FORCE = "--force" in args
PREVIEW = args[args.index("--preview") + 1] if "--preview" in args else None
names = list(RECIPES) if want == "all" else want.split(",")

def hexrgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)

def srgb_to_lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def base_images(mat):
    """The image nodes feeding a material's base colour, and the Principled node."""
    if not mat or not mat.use_nodes: return [], None
    nt = mat.node_tree; pr = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if not pr: return [], None
    out, seen = [], set()
    def walk(sock):
        for l in sock.links:
            n = l.from_node
            if n.type == "TEX_IMAGE" and n.image and n.name not in seen: seen.add(n.name); out.append(n)
            for s in n.inputs: walk(s)
    walk(pr.inputs["Base Color"]); return out, pr

def repaint(ob, ops):
    done = {}
    for op in ops:
        rx = re.compile(op.get("mat", ".*"), re.I); k = float(op.get("k", 1.0))
        col = hexrgb(op.get("color", "#f5c542")); dark = hexrgb(op.get("dark", "#0b1020"))
        for slot in ob.material_slots:
            m = slot.material
            if not m or not rx.search(m.name): continue
            nodes, pr = base_images(m)
            if pr is None: continue
            if op["op"] == "gild":
                pr.inputs["Metallic"].default_value = op.get("metal", 1.0); pr.inputs["Roughness"].default_value = op.get("rough", 0.28)
                for l in list(pr.inputs["Metallic"].links) + list(pr.inputs["Roughness"].links): m.node_tree.links.remove(l)
            if "rough" in op and op["op"] != "gild": pr.inputs["Roughness"].default_value = op["rough"]; [m.node_tree.links.remove(l) for l in list(pr.inputs["Roughness"].links)]
            if "metal" in op and op["op"] != "gild": pr.inputs["Metallic"].default_value = op["metal"]; [m.node_tree.links.remove(l) for l in list(pr.inputs["Metallic"].links)]
            if not nodes:   # untextured: set the factor
                bc = pr.inputs["Base Color"].default_value; c0 = np.array(bc[:3])
                c1 = srgb_to_lin(col) if op["op"] != "gild" else srgb_to_lin(hexrgb("#e8b84a"))
                new = c0 * (1 - k) + (c0 * c1 * 2.2 if op["op"] == "tint" else c1) * k
                pr.inputs["Base Color"].default_value = (*np.clip(new, 0, 1), 1); continue
            for n in nodes:
                img = n.image; key = (img.name, json.dumps(op))
                if key in done: n.image = done[key]; continue
                w, h = img.size
                if not w: continue
                px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
                rgb = px[:, :3].copy()   # Blender holds a colour image's pixels linear when it is sRGB tagged
                lin = lambda c: srgb_to_lin(c).astype(np.float32)
                if op["op"] == "tint":
                    new = rgb * (1 - k) + np.clip(rgb * lin(col) * 2.6, 0, 1) * k
                elif op["op"] in ("paint", "gild"):
                    c = lin(hexrgb("#e8b84a") if op["op"] == "gild" else col); d = lin(dark)
                    L = (rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[:, None]
                    L = np.clip((L - L.min()) / max(1e-4, np.percentile(L, 98) - L.min()), 0, 1) ** op.get("gamma", 0.8)
                    hi = lin(hexrgb(op.get("hi", "#ffffff")))
                    g = np.where(L < 0.75, d + (c - d) * (L / 0.75), c + (hi - c) * ((L - 0.75) / 0.25) * op.get("sheen", 0.35))
                    new = rgb * (1 - k) + g * k
                else: continue
                px[:, :3] = np.clip(new, 0, 1)
                im2 = bpy.data.images.new(img.name + "_nyb", w, h, alpha=True)
                im2.colorspace_settings.name = img.colorspace_settings.name
                im2.pixels.foreach_set(px.ravel()); f = os.path.join(TMP, re.sub(r"\W", "_", im2.name) + ".jpg")
                im2.filepath_raw = f; im2.file_format = "JPEG"; im2.save()
                im3 = bpy.data.images.load(f); im3.colorspace_settings.name = img.colorspace_settings.name
                n.image = im3; done[key] = im3

def sticker_image(st):
    return bpy.data.images.load(os.path.join(STK, st["img"] + ".png"), check_existing=True)   # brand.py has made any text label already

def sticker_mat(img, st):
    m = bpy.data.materials.new("nyb_" + img.name); m.use_nodes = True; nt = m.node_tree
    pr = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = img
    nt.links.new(tx.outputs["Color"], pr.inputs["Base Color"])
    gt = nt.nodes.new("ShaderNodeMath"); gt.operation = "GREATER_THAN"; gt.inputs[1].default_value = 0.5
    nt.links.new(tx.outputs["Alpha"], gt.inputs[0]); nt.links.new(gt.outputs[0], pr.inputs["Alpha"])
    pr.inputs["Roughness"].default_value = st.get("rough", 0.55); pr.inputs["Metallic"].default_value = st.get("metal", 0.0)
    if st.get("glow"):
        nt.links.new(tx.outputs["Color"], pr.inputs["Emission Color"]); pr.inputs["Emission Strength"].default_value = float(st["glow"]) if not isinstance(st["glow"], bool) else 2.0
    m.use_backface_culling = False
    return m

FACES = {  # normal, right, up
    "-Y": (Vector((0, -1, 0)), Vector((1, 0, 0)), Vector((0, 0, 1))),
    "+Y": (Vector((0, 1, 0)), Vector((-1, 0, 0)), Vector((0, 0, 1))),
    "+X": (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))),
    "-X": (Vector((-1, 0, 0)), Vector((0, -1, 0)), Vector((0, 0, 1))),
    "+Z": (Vector((0, 0, 1)), Vector((1, 0, 0)), Vector((0, 1, 0))),
}

def press(ob, st, lo, hi, H):
    n, right, up = FACES[st.get("face", "-Y")]
    u, v = st.get("u", 0.5), st.get("v", 0.5)
    def lerp(a, b, t): return a + (b - a) * t
    # the point on the bbox face plane the ray starts from, outside the model
    p = Vector((0, 0, 0))
    for ax in range(3):
        if abs(n[ax]) > 0.5: p[ax] = (hi[ax] if n[ax] > 0 else lo[ax]) + n[ax] * 0.5
        elif abs(right[ax]) > 0.5: p[ax] = lerp(lo[ax], hi[ax], u if right[ax] > 0 else 1 - u)
        else: p[ax] = lerp(lo[ax], hi[ax], v if up[ax] > 0 else 1 - v)
    ok, hit, nrm, _ = ob.ray_cast(p, -n, distance=100)
    if not ok:   # a gap (a row of cans, a hollow): look outward from the asked point until the ray lands
        span = [hi[k] - lo[k] for k in range(3)]
        for rr in (0.04, 0.08, 0.12, 0.18, 0.25, 0.33):
            for du, dv in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)):
                q = p + right * (du * rr * abs(right.dot(Vector(span)))) + up * (dv * rr * abs(up.dot(Vector(span))))
                ok, hit, nrm, _ = ob.ray_cast(q, -n, distance=100)
                if ok: break
            if ok: break
    if not ok: print("  sticker missed", st); return None
    img = sticker_image(st); w = st.get("size") or st.get("fs", 0.25) * H; asp = img.size[1] / max(1, img.size[0]); h = w * asp
    rot = math.radians(st.get("rot", 0)); r2 = right * math.cos(rot) + up * math.sin(rot); u2 = -right * math.sin(rot) + up * math.cos(rot)
    flat = st.get("flat", False); N = 1 if flat else 8; eps = st.get("off", 0.0025)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new(); grid = {}
    for i in range(N + 1):
        for j in range(N + 1):
            a, b = i / N - 0.5, j / N - 0.5
            q = hit + r2 * (a * w) + u2 * (b * h)
            if not flat:
                ok2, h2, n2, _ = ob.ray_cast(q + n * 0.4, -n, distance=0.4 + max(w, h))
                q = (h2 + n * eps) if ok2 and (h2 - q).length < max(w, h) else q + n * eps
            else: q = q + n * eps
            grid[i, j] = bm.verts.new(q)
    for i in range(N):
        for j in range(N):
            f = bm.faces.new([grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]])
            for lp, (ii, jj) in zip(f.loops, [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]): lp[uvl].uv = (ii / N, jj / N)
    me = bpy.data.meshes.new("stk"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("stk_" + img.name, me); bpy.context.scene.collection.objects.link(o); me.materials.append(sticker_mat(img, st))
    return o

def add_piece(ob, ad, lo, hi, H):
    img = sticker_image(ad); w = ad.get("size") or ad.get("fs", 0.2) * H; h = w * img.size[1] / max(1, img.size[0])
    if ad["type"] == "disc":     # stands on top, both faces
        c = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z + ad.get("lift", 0.0) + h / 2))
        if "at" in ad: c = Vector([lo[k] + (hi[k] - lo[k]) * ad["at"][k] for k in range(3)])
        yaw = math.radians(ad.get("yaw", 0))
    else:                        # card: a free plane at a bbox fraction, facing a face
        c = Vector([lo[k] + (hi[k] - lo[k]) * ad["at"][k] for k in range(3)]); yaw = {"-Y": 0, "+X": 90, "+Y": 180, "-X": -90}[ad.get("face", "-Y")]
        yaw = math.radians(yaw + ad.get("yaw", 0))
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new()
    eo = 0.0075 if ad.get("rim") else 0.0012
    for side in ((1, eo), (-1, -eo)) if ad["type"] == "disc" or ad.get("both") else ((1, 0),):
        s, off = side
        vs = [bm.verts.new((x * w / 2 * s, -off, z * h / 2)) for x, z in [(-1, -1), (1, -1), (1, 1), (-1, 1)]]
        f = bm.faces.new(vs if s > 0 else vs[::-1])
        for lp, uv in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)] if s > 0 else [(0, 1), (1, 1), (1, 0), (0, 0)]): lp[uvl].uv = uv if s > 0 else (1 - uv[0], uv[1])
    me = bpy.data.meshes.new("add"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("add_" + img.name, me); bpy.context.scene.collection.objects.link(o); me.materials.append(sticker_mat(img, ad))
    o.location = c; o.rotation_euler = (0, 0, yaw)
    if ad.get("rim"):   # a thin coloured rim behind it, so a disc reads as an object and not a decal
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=w / 2 * 1.03, depth=0.012, location=c, rotation=(math.pi / 2, 0, yaw))
        r = bpy.context.active_object; mm = bpy.data.materials.new("rim"); mm.use_nodes = True
        pr = next(n for n in mm.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); pr.inputs["Base Color"].default_value = (*srgb_to_lin(hexrgb(ad["rim"])), 1)
        pr.inputs["Metallic"].default_value = 0.8; pr.inputs["Roughness"].default_value = 0.3; r.data.materials.append(mm)
    if ad.get("pole"):  # a little pole down to the top of the model
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=w * 0.035, depth=ad.get("lift", 0.0) + 0.02, location=(c.x, c.y, hi.z + ad.get("lift", 0.0) / 2))
        pm = bpy.data.materials.new("pole"); pm.use_nodes = True; pp = next(n for n in pm.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        pp.inputs["Base Color"].default_value = (*srgb_to_lin(hexrgb(ad["pole"])), 1); pp.inputs["Metallic"].default_value = 1; pp.inputs["Roughness"].default_value = 0.35
        bpy.context.active_object.data.materials.append(pm)

def preview(path, lo, hi):
    sc = bpy.context.scene; sc.render.engine = "BLENDER_EEVEE"; sc.render.resolution_x = sc.render.resolution_y = 512
    sc.render.film_transparent = False
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.32, 0.33, 0.38, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 1.2
    sz = (hi - lo).length; c = (lo + hi) / 2
    l = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); l.data.energy = 3.5; l.rotation_euler = (0.9, 0.2, -0.6); sc.collection.objects.link(l)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 50
    d = Vector((0.55, -1.0, 0.45)).normalized(); cam.location = c + d * sz * 1.55
    cam.rotation_euler = (c - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

for name in names:
    rc = RECIPES[name]; out = os.path.join(GLB, name + ".glb")
    if os.path.exists(out) and not FORCE: print("HAVE", name); continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(GLB, rc["src"] + ".glb"))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM"); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in list(bpy.context.scene.objects):
        if o != ob: bpy.data.objects.remove(o)
    lo = Vector((min(v.co[k] for v in ob.data.vertices) for k in range(3))); hi = Vector((max(v.co[k] for v in ob.data.vertices) for k in range(3))); H = hi.z - lo.z
    repaint(ob, rc.get("paint", []))
    for st in rc.get("stickers", []): press(ob, st, lo, hi, H)
    for ad in rc.get("adds", []): add_piece(ob, ad, lo, hi, H)
    for img in bpy.data.images:   # the gallery's prop budget: no texture over 512
        if img.size[0] > 512 or img.size[1] > 512:
            k = 512 / max(img.size); img.scale(max(1, int(img.size[0] * k)), max(1, int(img.size[1] * k)))
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=80, use_selection=False)
    print(f"BRAND {name}: from {rc['src']}, {len(rc.get('stickers', []))} stickers, {len(rc.get('adds', []))} adds, {os.path.getsize(out) // 1024} KB")
    if PREVIEW: os.makedirs(PREVIEW, exist_ok=True); preview(os.path.join(PREVIEW, name + ".png"), lo, hi)

import shutil; shutil.rmtree(TMP, ignore_errors=True)   # Blender leaves its repaint JPEGs here otherwise, one folder per run
