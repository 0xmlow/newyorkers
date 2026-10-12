"""The tree kit: New York street and park trees as real branching skeletons with photo leaf cards.

  Blender -b --factory-startup -P build_tree_kit.py -- <src_dir> <out_dir> [species,...]

<src_dir> holds bark/<id>_diff.jpg and bark/<id>_nor.jpg (Poly Haven, CC0) and
leaves/<species>.png (a leaf spray on transparent, Krea GPT Image 2.5 Flare).
Writes <out_dir>/tree_<species>.glb holding, per variant n, four meshes:
v<n>_hi_bark, v<n>_hi_leaf, v<n>_lo_bark, v<n>_lo_leaf (y up, base at the origin,
real height in metres). The engine (kit.ts plantTrees) instances them.

Written 2026-10-09. Not text to 3D on purpose: generators return trees as solid lumps.
"""
import bpy, bmesh, os, sys, math, random
from mathutils import Vector, Matrix, Quaternion

args = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT = os.path.abspath(args[0]), os.path.abspath(args[1])
ONLY = args[2].split(",") if len(args) > 2 else None
os.makedirs(OUT, exist_ok=True)

UP = Vector((0, 0, 1))

# H total height (m); crown starts at trunk fraction cb; leader: trunk runs to the top (else it forks
# into `forks` leaders at cb); n1 main branches at angle a1 (deg from vertical) and length l1 (of H);
# shape: envelope of main branch length by height in the crown; trop: bend up (+) or droop (-);
# n2/l2/a2 and n3/l3/a3 for the next two orders; leaf: card size (m), dens: cards per twig.
SPECIES = {
    "plane":  dict(bark="bark_platanus", H=15, cb=0.26, leader=True, n1=13, a1=66, l1=0.58, shape="round", trop=0.18, n2=7, l2=0.48, a2=48, n3=4, l3=0.5, a3=45, leaf=1.15, dens=4, r0=0.42),
    "elm":    dict(bark="japanese_zelkova_bark", H=17, cb=0.25, leader=False, forks=4, n1=16, a1=35, l1=0.52, shape="vase", trop=0.05, n2=7, l2=0.42, a2=50, n3=4, l3=0.5, a3=50, leaf=1.15, dens=5, r0=0.36, droop_tips=0.35),
    "locust": dict(bark="bark_brown_01", H=13, cb=0.32, leader=False, forks=3, n1=12, a1=50, l1=0.42, shape="round", trop=0.05, n2=7, l2=0.45, a2=50, n3=3, l3=0.5, a3=45, leaf=1.25, dens=4, r0=0.26),
    "oak":    dict(bark="jolcham_oak_bark_01", H=15, cb=0.22, leader=True, n1=14, a1=78, l1=0.36, shape="pyramid", trop=-0.1, n2=6, l2=0.45, a2=50, n3=4, l3=0.5, a3=45, leaf=0.85, dens=3, r0=0.32),
    "linden": dict(bark="japanese_hackberry_bark", H=12, cb=0.18, leader=True, n1=16, a1=58, l1=0.3, shape="pyramid", trop=0.1, n2=5, l2=0.45, a2=45, n3=4, l3=0.5, a3=45, leaf=0.75, dens=4, r0=0.24),
    "ginkgo": dict(bark="chinese_hackberry_bark", H=13, cb=0.25, leader=True, n1=14, a1=45, l1=0.34, shape="column", trop=0.2, n2=5, l2=0.4, a2=40, n3=3, l3=0.45, a3=40, leaf=0.95, dens=4, r0=0.24),
    "maple":  dict(bark="trident_maple_bark", H=12, cb=0.25, leader=False, forks=3, n1=12, a1=55, l1=0.4, shape="round", trop=0.12, n2=6, l2=0.45, a2=45, n3=4, l3=0.5, a3=45, leaf=0.9, dens=4, r0=0.28),
    "cherry": dict(bark="sakura_bark", H=7, cb=0.22, leader=False, forks=4, n1=10, a1=60, l1=0.55, shape="vase", trop=0.02, n2=6, l2=0.45, a2=50, n3=4, l3=0.5, a3=45, leaf=0.95, dens=6, r0=0.22),
    "pear":   dict(bark="tree_bark_03", H=11, cb=0.22, leader=False, forks=5, n1=16, a1=30, l1=0.42, shape="oval", trop=0.25, n2=6, l2=0.42, a2=40, n3=4, l3=0.45, a3=40, leaf=0.9, dens=5, r0=0.22),
    "willow": dict(bark="bark_willow", H=12, cb=0.25, leader=False, forks=4, n1=10, a1=50, l1=0.45, shape="round", trop=0.0, n2=6, l2=0.5, a2=55, n3=0, l3=0, a3=0, leaf=2.2, dens=4, r0=0.34, weep=True),
    "pine":   dict(bark="pine_bark", H=16, cb=0.3, leader=True, n1=22, a1=82, l1=0.24, shape="cone", trop=0.05, n2=5, l2=0.45, a2=50, n3=0, l3=0, a3=0, leaf=1.0, dens=4, r0=0.3),
    "palm":   dict(bark="palm_tree_bark", H=10, palm=True, r0=0.22, leaf=3.8),
}
SIDES = [7, 5, 3, 3]


def envelope(shape, t):
    """Main branch length factor by height in the crown, t 0 at the crown base, 1 at the top."""
    if shape == "cone": return max(0.08, 1.0 - t)
    if shape == "pyramid": return max(0.1, 1.0 - 0.85 * t)
    if shape == "column": return 0.55 + 0.25 * math.sin(math.pi * t)
    if shape == "oval": return 0.35 + 0.65 * math.sin(math.pi * min(1, t * 1.05))
    if shape == "vase": return 0.6 + 0.4 * t
    return 0.25 + 0.75 * math.sin(math.pi * (0.15 + 0.8 * t))  # round


def perp(d):
    a = Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 1, 0))
    return d.cross(a).normalized()


class Tree:
    def __init__(self, sp, seed):
        self.p = SPECIES[sp]; self.sp = sp
        self.rng = random.Random(seed)
        self.branches = []   # (points, radii, level)
        self.twigs = []      # (point, direction, level) where leaf cards go

    def r(self, a, b): return self.rng.uniform(a, b)

    def grow(self, start, d, length, radius, level, trop, segs=None):
        segs = segs or max(3, [10, 6, 4, 3][min(level, 3)])
        pts, rad = [start.copy()], [radius]
        p = start.copy(); d = d.normalized()
        step = length / segs
        weep = self.p.get("weep") and level >= 1
        for i in range(segs):
            t = (i + 1) / segs
            wob = Vector((self.r(-1, 1), self.r(-1, 1), self.r(-1, 1))) * (0.12 if level else 0.05)
            bend = trop
            if weep: bend = -0.35 - 0.6 * t
            if self.p.get("droop_tips") and level >= 2: bend -= self.p["droop_tips"] * t
            d = (d + wob + UP * bend * 0.35).normalized()
            p = p + d * step
            pts.append(p.copy()); rad.append(radius * (1 - 0.82 * t) + 0.004)
        self.branches.append((pts, rad, level))
        return pts, rad

    def children(self, pts, rad, level, n, lrel, ang, t0=0.3):
        out = []
        total = sum((pts[i + 1] - pts[i]).length for i in range(len(pts) - 1))
        phase = self.r(0, 6.28)
        for k in range(n):
            t = t0 + (1 - t0) * (k + self.r(0.1, 0.9)) / n
            i = min(len(pts) - 2, int(t * (len(pts) - 1)))
            f = t * (len(pts) - 1) - i
            base = pts[i].lerp(pts[i + 1], f)
            pd = (pts[i + 1] - pts[i]).normalized()
            q = Quaternion(pd, phase + k * 2.39996)
            side = q @ perp(pd)
            a = math.radians(ang + self.r(-12, 12))
            d = (pd * math.cos(a) + side * math.sin(a)).normalized()
            length = total * lrel * (1.15 - 0.5 * t) * self.r(0.75, 1.15)
            radius = rad[i] * self.r(0.45, 0.65)
            out.append((base, d, length, radius))
        return out

    def build(self):
        P = self.p; H = P["H"]
        if P.get("palm"):
            return self.palm()
        cb = H * P["cb"]
        lean = Vector((self.r(-0.06, 0.06), self.r(-0.06, 0.06), 1)).normalized()
        if P["leader"]:
            tp, tr = self.grow(Vector((0, 0, 0)), lean, H * 0.92, P["r0"], 0, 0.6, segs=12)
            mains = []
            for k in range(P["n1"]):
                t = (k + self.r(0.2, 0.8)) / P["n1"]
                z = cb + t * (H * 0.9 - cb)
                i = min(len(tp) - 2, int(z / (H * 0.92) * (len(tp) - 1)))
                base = tp[i]
                az = k * 2.39996 + self.r(-0.3, 0.3)
                a = math.radians(P["a1"] * (1 - 0.35 * t) + self.r(-8, 8))
                d = Vector((math.cos(az) * math.sin(a), math.sin(az) * math.sin(a), math.cos(a)))
                L = H * P["l1"] * envelope(P["shape"], t) * self.r(0.85, 1.15)
                mains.append((base, d, L, tr[i] * self.r(0.4, 0.55)))
        else:
            tp, tr = self.grow(Vector((0, 0, 0)), lean, cb, P["r0"], 0, 0.6, segs=5)
            top, mains = tp[-1], []
            for f in range(P["forks"]):
                az = f * 6.283 / P["forks"] + self.r(-0.4, 0.4)
                a = math.radians(P["a1"] * 0.7 + self.r(-6, 6))
                d = Vector((math.cos(az) * math.sin(a), math.sin(az) * math.sin(a), math.cos(a)))
                lp, lr = self.grow(top, d, (H - cb) * 0.75, P["r0"] * 0.62, 0, 0.35, segs=8)
                per = max(1, P["n1"] // P["forks"])
                for b in self.children(lp, lr, 1, per, 0.75 * P["l1"] / 0.45, P["a1"] * 0.8, t0=0.25):
                    mains.append(b)
        for base, d, L, rad in mains:
            bp, br = self.grow(base, d, L, rad, 1, P["trop"])
            for c in self.children(bp, br, 2, P["n2"], P["l2"], P["a2"]):
                cp, cr = self.grow(c[0], c[1], c[2], c[3], 2, P["trop"] * 0.6)
                if P["n3"]:
                    for c3 in self.children(cp, cr, 3, P["n3"], P["l3"], P["a3"], t0=0.2):
                        tp3, _ = self.grow(c3[0], c3[1], c3[2], max(0.006, c3[3]), 3, 0.1)
                        self.twigs.append((tp3[-1], (tp3[-1] - tp3[-2]).normalized(), 3))
                        self.twigs.append((tp3[len(tp3) // 2], (tp3[-1] - tp3[0]).normalized(), 3))
                else:
                    for j in range(2, len(cp)):
                        self.twigs.append((cp[j], (cp[j] - cp[j - 1]).normalized(), 2))
        return self

    def palm(self):
        P = self.p; H = P["H"]
        d = Vector((self.r(-0.12, 0.12), self.r(-0.12, 0.12), 1)).normalized()
        tp, _ = self.grow(Vector((0, 0, 0)), d, H, P["r0"], 0, 0.15, segs=10)
        self.branches[-1] = (tp, [P["r0"] * (1.25 if i == 0 else 1.0 - 0.25 * i / len(tp)) for i in range(len(tp))], 0)
        self.crown = tp[-1]
        return self


def tube(bm, uvl, pts, rad, sides):
    rings = []
    vacc = 0.0
    circ = 2 * math.pi * max(rad[0], 0.02)
    prev_n = None
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        n = perp(d) if prev_n is None else (prev_n - d * prev_n.dot(d)).normalized()
        prev_n = n
        b = d.cross(n)
        if i: vacc += (pts[i] - pts[i - 1]).length
        ring = []
        for s in range(sides + 1):
            a = 2 * math.pi * s / sides
            off = (n * math.cos(a) + b * math.sin(a)) * rad[i]
            ring.append((bm.verts.new(p + off), (s / sides, vacc / circ)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for s in range(sides):
            a, b_, c, e = rings[i][s], rings[i][s + 1], rings[i + 1][s + 1], rings[i + 1][s]
            f = bm.faces.new((a[0], b_[0], c[0], e[0]))
            for loop, uv in zip(f.loops, (a[1], b_[1], c[1], e[1])): loop[uvl].uv = uv


def card(bm, uvl, center, along, normal, w, h, bend=0.0, segs=1):
    along = along.normalized(); normal = (normal - along * normal.dot(along)).normalized()
    side = along.cross(normal)
    verts = []
    for j in range(segs + 1):
        t = j / segs
        c = center + along * (h * (t - 0.5)) - normal * (bend * t * t * h)
        verts.append((bm.verts.new(c - side * w / 2), bm.verts.new(c + side * w / 2), t))
    for j in range(segs):
        (a, b, ta), (c, d, tc) = verts[j], verts[j + 1]
        f = bm.faces.new((a, b, d, c))
        for loop, uv in zip(f.loops, ((0, ta), (1, ta), (1, tc), (0, tc))): loop[uvl].uv = uv


def leaf_aspect(path):
    img = bpy.data.images.load(path, check_existing=True)
    return img.size[1] / max(1, img.size[0])


def make_mesh(name, build_fn, mat):
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    build_fn(bm, uvl)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    return ob


def materials(sp, P):
    bark = bpy.data.materials.new(sp + "_bark"); bark.use_nodes = True
    nt = bark.node_tree; bsdf = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(SRC, "bark", P["bark"] + "_diff.jpg"))
    nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    nm = nt.nodes.new("ShaderNodeTexImage"); nm.image = bpy.data.images.load(os.path.join(SRC, "bark", P["bark"] + "_nor.jpg")); nm.image.colorspace_settings.name = "Non-Color"
    nn = nt.nodes.new("ShaderNodeNormalMap"); nt.links.new(nm.outputs["Color"], nn.inputs["Color"]); nt.links.new(nn.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.92
    leaf = bpy.data.materials.new(sp + "_leaf"); leaf.use_nodes = True
    nt = leaf.node_tree; bsdf = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(SRC, "leaves", sp + ".png"))
    nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"]); nt.links.new(t.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = 0.7
    leaf.use_backface_culling = False  # alpha test and double siding are set by the engine
    return bark, leaf


def build_species(sp):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    P = SPECIES[sp]
    bark, leaf = materials(sp, P)
    asp = leaf_aspect(os.path.join(SRC, "leaves", sp + ".png"))
    tris = {}
    for v in range(2):
        tr = Tree(sp, 1000 + v * 77 + hash(sp) % 97).build()
        for lod in ("hi", "lo"):
            rng = random.Random(5 + v)
            def bark_fn(bm, uvl):
                for pts, rad, level in tr.branches:
                    if lod == "lo" and level >= 2: continue
                    if level >= 3: continue  # twigs hide inside the leaf cards; they only cost triangles
                    sides = SIDES[min(level, 3)] if lod == "hi" else max(3, SIDES[min(level, 3)] - 2)
                    if lod == "lo" and len(pts) > 4: pts, rad = pts[::2] + ([pts[-1]] if len(pts) % 2 == 0 else []), rad[::2] + ([rad[-1]] if len(rad) % 2 == 0 else [])
                    tube(bm, uvl, pts, rad, sides)
            def leaf_fn(bm, uvl):
                if P.get("palm"):
                    c = tr.crown
                    n = 26 if lod == "hi" else 14
                    for k in range(n):
                        az = k * 2.39996; up = 0.55 - 0.9 * (k % 3) / 3 + rng.uniform(-0.1, 0.1)
                        out = Vector((math.cos(az), math.sin(az), up)).normalized()
                        h = P["leaf"] * rng.uniform(0.85, 1.1)
                        normal = (UP - out * UP.dot(out)).normalized()
                        card(bm, uvl, c + out * h * 0.5, out, normal, h / asp, h, bend=0.35, segs=4 if lod == "hi" else 2)
                    return
                keep = 1.0 if lod == "hi" else 0.4
                grow = 1.0 if lod == "hi" else 1.55
                for p, d, level in tr.twigs:
                    for k in range(P["dens"]):
                        if rng.random() > keep: continue
                        s = P["leaf"] * grow * rng.uniform(0.75, 1.2)
                        if P.get("weep"):
                            along = Vector((rng.uniform(-0.15, 0.15), rng.uniform(-0.15, 0.15), -1)).normalized()
                            normal = Vector((math.cos(k * 2.1 + p.x), math.sin(k * 2.1 + p.y), 0))
                            card(bm, uvl, p + along * s * 0.5, along, normal, s / asp * 0.5, s)
                            continue
                        jitter = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))) * 0.35
                        along = (d + jitter).normalized()
                        normal = (UP * 0.8 + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.3, 1)))).normalized()
                        off = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.5, 1))) * s * 0.3
                        card(bm, uvl, p + off, along, normal, s, s * asp)
            ob1 = make_mesh(f"v{v}_{lod}_bark", bark_fn, bark)
            ob2 = make_mesh(f"v{v}_{lod}_leaf", leaf_fn, leaf)
            for ob in (ob1, ob2):
                ob.location.x = v * 40 + (0 if lod == "hi" else 20)
                tris[ob.name] = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    out = os.path.join(OUT, f"tree_{sp}.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="WEBP", export_image_quality=82, use_selection=False, export_apply=False)
    print(f"TREE {sp}: " + ", ".join(f"{k} {v}" for k, v in sorted(tris.items())) + f"; {os.path.getsize(out) // 1024} KB")


for sp in (ONLY or SPECIES):
    if not os.path.exists(os.path.join(SRC, "leaves", sp + ".png")):
        print("SKIP", sp, "no leaf card"); continue
    build_species(sp)
