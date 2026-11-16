"""rig_pass.py: rig a static Tripo NEW YORKER (eye flower head) for crowds, free, in headless Blender.

  Blender -b -P rig_pass.py -- name[:kind[:height]],...      (kind: auto | walker | gown | coat | seated)

For each figure:
  1. load the ON LOCATION cast GLB (read only), merge seam vertices, turn the front to three.js +Z (Blender -Y),
     scale to 1.88 m to the flower top (seated figures to their own height), feet on the origin;
  2. read the full resolution mesh in horizontal cuts (analyse.py): where the legs part (crotch), where the arms leave
     the body (armpit, hand), the narrowest point under the flower (neck line), the body's centre line;
  3. decimate to about 3,000 triangles and shrink the texture to 512 px;
  4. build the armature from those landmarks: root, hips, spine, chest, neck, head, and where the geometry has them
     thigh/shin/foot and upperarm/forearm per side (_L is the figure's left, +X), plus a skirt bone for gowns and
     long coats;
  5. weight with Blender's automatic weights (bone heat), fall back to distance weights for any vertex heat left
     empty, then clean: everything above the neck line 100% head, arm pieces that stand clear of the body only on arm
     bones (a carried prop goes with the forearm), no left leg weight on the right leg and back, coat panels off the
     thighs, the waist smoothed, at most four influences;
  6. bake two clips as glTF animations: walk (1.0 s in place loop, foot placement by two bone IK so the planted foot
     moves back at a constant speed and never goes under the floor, hip bob from the IK, arm counter swing) and idle
     (4.0 s: breath, weight shift, a slow glance). Seated figures get idle only. No look-at clip: the page turns the
     bone named "head";
  7. export a skinned GLB with a JPEG texture to out/<name>.glb and record the numbers in out/rig_manifest.json.

Written 2026-10-28 for the rigging trial (UPGRADE ALL ROOMS 2026-10-28/rig/RIG_TRIAL.md).
"""
import bpy, bmesh, os, sys, math, json
import numpy as np
from mathutils import Matrix, Vector, Quaternion

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from analyse import tris_of, slice_parts

ROOT = os.path.dirname(os.path.dirname(HERE))
# THE LIGHTINGS: the Krea Tripo cast in work/glb, rigs out to work/rig (env RIG_SRC / RIG_OUT override)
SRC = os.environ.get("RIG_SRC", os.path.join(ROOT, "work", "glb"))
OUT = os.environ.get("RIG_OUT", os.path.join(ROOT, "work", "rig"))
TRIS, TEX, FPS = 3000, 512, 30
YAW = -90.0          # every cast GLB faces Blender +X; this brings the front to -Y (three.js +Z)
# 2026-10-28: Susan's body (the doll face, the sweater front, her toes) faced Blender +Y after that turn, with her eye
# flower worn on the back of her head; MLow: "doll face forward". She takes another half turn, so her body is the front
# and the walk's planted foot and knees go her way (a half turn in the gallery would have her moonwalk on back knees).
# The other four that face off (blindwoman, hustler, lensman, tough, sally) are turned in the galleries (FACE tables).
YAW_EXTRA = {"susan": 180.0}
# 2026-10-28: figures whose eye flower hangs below the neck line: the whole flower (petals, eye, the ball behind it,
# every drip) is bound 100% to the head, found by the flower's own plane rather than by height (flower_mask()).
# The Hustler's flower is sculpted about 40 degrees to his right and hangs to the middle of his chest; by height alone
# half of it rode the neck and chest and a head turn moved it about half way. MLow: "reweight his head".
FLOWER = {"hustler"}
STAND = 1.88
NECK = {}            # name: neck line as a fraction of height, from the 4th job field

def log(*a): print("RIG", *a, flush=True)

# ---------------------------------------------------------------- load
def load(name, height):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name + ".glb"), merge_vertices=True)
    ms = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in ms: o.select_set(True)
    bpy.context.view_layer.objects.active = ms[0]
    if len(ms) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.data.transform(Matrix.Rotation(math.radians(YAW + YAW_EXTRA.get(name, 0.0)), 4, "Z"))
    vs = np.array([v.co[:] for v in ob.data.vertices])
    off = Vector(((vs[:, 0].min() + vs[:, 0].max()) / 2, (vs[:, 1].min() + vs[:, 1].max()) / 2, vs[:, 2].min()))
    ob.data.transform(Matrix.Translation(-off)); ob.data.transform(Matrix.Scale(height / (vs[:, 2].max() - off.z), 4))
    for o in list(bpy.context.scene.objects):
        if o != ob: bpy.data.objects.remove(o)
    ob.name = name; ob.data.name = name
    # the importer leaves the UV seams split (168 islands on the cabbie) and bone heat then fails on every vertex;
    # weld them so the body is one surface (the UVs stay per corner, so the texture is untouched)
    bpy.context.view_layer.objects.active = ob; bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.0005 * height); bpy.ops.object.mode_set(mode="OBJECT")
    return ob

# ---------------------------------------------------------------- analysis
def analyse(ob, kind):
    V, T = tris_of(ob); H = V[:, 2].max()
    fs = np.round(np.arange(0.02, 0.995, 0.01), 3)
    prof = {f: [p for p in slice_parts(V, T, f * H, H * 0.004) if p["n"] > 2] for f in fs}
    A = {"H": H, "prof": prof, "name": ob.name}

    def big2(f):
        ps = sorted(prof[f], key=lambda p: -p["n"])
        if len(ps) < 2 or ps[1]["n"] < 0.4 * ps[0]["n"]: return None
        a, b = ps[0], ps[1]
        if np.linalg.norm(a["c"] - b["c"]) < 0.035 * H: return None
        return (a, b) if a["c"][0] < b["c"][0] else (b, a)      # (right leg -X, left leg +X)

    legs_low = big2(0.06) is not None and kind != "seated"
    top = 0.06
    if legs_low:
        for f in fs[fs >= 0.06]:
            if big2(f) is None: break
            top = f
    A["leg_top"] = float(top)
    if kind == "auto":
        kind = "walker" if legs_low and top >= 0.25 else ("coat" if legs_low else "gown")
    A["kind"] = kind
    c0 = max(prof[round(0.5, 2)], key=lambda p: p["n"]) if prof[round(0.5, 2)] else None
    A["cx"] = float(c0["c"][0]) if c0 is not None else 0.0
    A["legtrack"] = track_legs(A, fs, top) if kind in ("walker", "coat") else {}

    def central(f):
        ps = prof[f]
        return max(ps, key=lambda p: p["n"]) if ps else None

    # arms: runs of pieces standing clear of the main body between the waist and the shoulders
    lo_f = (top + 0.02) if kind == "walker" else 0.30
    arms = {}
    for s, side in ((1, "L"), (-1, "R")):
        runs, cur = [], []
        for f in fs[(fs >= lo_f) & (fs <= 0.72)]:
            c = central(f)
            cand = [p for p in prof[f] if p is not c and (p["c"][0] - c["c"][0]) * s > 0.04 * H and p["n"] >= 4]
            if cand:
                p = max(cand, key=lambda p: p["n"]); cur.append((f, p))
            elif cur: runs.append(cur); cur = []
        if cur: runs.append(cur)
        if not runs: continue
        run = max(runs, key=lambda r: sum(p["n"] for _, p in r))
        if len(run) < 4: continue
        fb, pb = run[0]
        # free hand, or a hand resting on the body (hip, thigh): does the piece under the run reach the hand?
        below = [p for p in prof.get(round(fb - 0.01, 3), []) + prof.get(round(fb - 0.02, 3), [])]
        touching = any(p["lo"][0] - 0.004 * H <= pb["c"][0] <= p["hi"][0] + 0.004 * H and p["n"] > 3 * pb["n"] for p in below)
        up, gap = [], 0
        for f in fs[fs > run[-1][0]]:
            c = central(f)
            cand = [p for p in prof[f] if p is not c and (p["c"][0] - c["c"][0]) * s > 0.05 * H and p["n"] >= 3]
            if cand: up.append((f, max(cand, key=lambda p: p["n"]))); gap = 0
            else:
                gap += 1
                if gap > 1: break
        raised = len(up) >= 3
        allrun = run + up
        hp = up[-1][1] if raised else pb
        arms[side] = {"run": [(float(f), p["c"].tolist()) for f, p in allrun], "bottom": float(fb), "top": float(run[-1][0]),
                      "hand": [float(hp["c"][0]), float(hp["c"][1])], "hand_f": float(up[-1][0] if raised else fb - 0.015),
                      "raised": raised, "touching": bool(touching) and not raised}
    armpit = max([a["top"] for a in arms.values()], default=0.56)
    armpit = min(max(armpit, 0.50), 0.64) if kind != "seated" else 0.58   # seated: the arms wrap a guitar, so guess
    A["arms"] = arms; A["armpit"] = armpit

    # neck line: the narrowest body cut between the shoulders and the flower
    band = [f for f in fs if armpit + 0.03 <= f <= 0.84 and central(f) is not None]
    widths = [(central(f)["hi"][0] - central(f)["lo"][0], f) for f in band]
    neck = float(min(widths)[1]) + 0.01 if widths else 0.72
    if NECK.get(A.get("name")): neck = NECK[A["name"]]          # read off a profile by hand (seated on the floor)
    A["neck"] = neck
    log(f"analyse {kind}: legs to {top:.2f}, armpit {armpit:.2f}, neck {neck:.2f}, arms",
        {k: (v["bottom"], v["top"], "touching" if v["touching"] else "free") for k, v in arms.items()})
    return A

def track_legs(A, fs, top):
    """Follow each leg down from the crotch, slice by slice, by the nearest cut to where that leg was one slice up.
    Legs that cross or part front to back keep their side. Returns {f: (right_piece, left_piece)}."""
    tr, prev = {}, None
    for f in sorted([f for f in fs if f <= top + 1e-6], reverse=True):
        two = legs2(A, f, raw=True)
        if len(two) < 2: continue
        a, b = two
        if prev is None:
            r, l = (a, b) if a["c"][0] < b["c"][0] else (b, a)
        else:
            pr, pl = prev
            keep = np.linalg.norm(a["c"] - pr) + np.linalg.norm(b["c"] - pl)
            swap = np.linalg.norm(b["c"] - pr) + np.linalg.norm(a["c"] - pl)
            r, l = (a, b) if keep <= swap else (b, a)
        tr[round(float(f), 2)] = (r, l); prev = (r["c"], l["c"])
    return tr

def legs2(A, f, raw=False):
    """The two leg cuts at height f: big pieces nearest the body's centre line (a carried case can be as big as a leg)."""
    ps = A["prof"].get(round(f, 2), [])
    if len(ps) < 2: return ps
    m = max(p["n"] for p in ps); cx = A.get("cx", 0.0)
    big = [p for p in ps if p["n"] >= 0.3 * m]
    big.sort(key=lambda p: abs(p["c"][0] - cx))
    two = big[:2]
    if not raw:
        t = A.get("legtrack", {}).get(round(f, 2))
        if t: return [t[0], t[1]]                 # [right, left] from the downward track
        two.sort(key=lambda p: p["c"][0])
    return two

def centre_at(A, f):
    ps = A["prof"].get(round(min(max(f, 0.02), 0.98), 2), [])
    if not ps: return np.zeros(2)
    return max(ps, key=lambda p: p["n"])["c"]

def leg_at(A, f, s):
    ps = legs2(A, f)
    return ps[1]["c"] if s > 0 else ps[0]["c"]

# ---------------------------------------------------------------- skeleton
def joints(A, ob):
    H, kind = A["H"], A["kind"]
    V = np.array([v.co[:] for v in ob.data.vertices])
    J = {}
    if kind == "walker": pelvis = A["leg_top"] + 0.03
    elif kind == "seated":
        pelvis = A.get("seat", 0.42)
    else: pelvis = A["armpit"] - 0.20
    neck = A["neck"]; neckb = neck - 0.045; armpit = A["armpit"]
    P = lambda f, xy=None: Vector(((xy if xy is not None else centre_at(A, f))[0], (xy if xy is not None else centre_at(A, f))[1], f * H))
    J["hips"] = (P(pelvis), P(pelvis + 0.07))
    mid = (pelvis + 0.07 + neckb) / 2
    J["spine"] = (J["hips"][1], P(mid))
    J["chest"] = (J["spine"][1], P(neckb))
    J["neck"] = (J["chest"][1], P(neck))
    if "flower" in A:   # the head turns about the ball behind the eye, his real head, not a point 26 cm beside it
        J["neck"] = (J["chest"][1], Vector(A["flower"][3].tolist()))
    hb = J["neck"][1].copy()
    J["head"] = (hb, hb + Vector((0, 0, (1.0 - neck) * H)))            # dead upright: local Y is up in three.js
    if kind in ("walker", "coat"):
        top = A["leg_top"]
        for s, side in ((1, "L"), (-1, "R")):
            hipf = (top + 0.02) if kind == "walker" else pelvis - 0.02
            ft = min(top, 0.30) - 0.02
            th = leg_at(A, ft, s)
            hip = Vector((th[0] * 0.9 + centre_at(A, pelvis)[0] * 0.1, th[1], hipf * H))
            if kind == "coat":
                hip = Vector((centre_at(A, pelvis)[0] + s * 0.045 * H, centre_at(A, pelvis)[1], hipf * H))
            kf = (hipf + 0.06) / 2 if kind == "walker" else min(top, (hipf + 0.06) / 2)
            kn = leg_at(A, min(kf, top - 0.01), s)
            knee = Vector((kn[0], kn[1] - 0.008 * H, kf * H))
            an = leg_at(A, 0.07, s)
            ankle = Vector((an[0], an[1], 0.055 * H))
            near = V[(V[:, 2] < 0.035 * H) & ((V[:, 0] - an[0]) * s > -0.03 * H) & (np.abs(V[:, 0] - an[0]) < 0.06 * H)]
            toe = Vector((an[0], near[:, 1].min() + 0.01 * H if len(near) else an[1] - 0.08 * H, 0.018 * H))
            heel = Vector((an[0], near[:, 1].max() if len(near) else an[1] + 0.03 * H, 0.0))
            J["thigh_" + side] = (hip, knee); J["shin_" + side] = (knee, ankle); J["foot_" + side] = (ankle, toe)
            A.setdefault("sole", {})[side] = (heel, Vector((toe.x, toe.y, 0.0)))
    if kind in ("gown", "coat"):
        hb_ = J["hips"][0]
        J["skirt"] = (hb_.copy(), Vector((hb_.x, hb_.y, 0.04 * H)))
    if kind != "seated":
        for s, side in ((1, "L"), (-1, "R")):
            a = A["arms"].get(side)
            if not a: continue
            topr = [c for f, c in a["run"] if f >= a["top"] - 0.03]
            sx = np.mean([c[0] for c in topr]); sy = np.mean([c[1] for c in topr])
            cx = centre_at(A, armpit)[0]
            shf = min((armpit + neck) / 2 + 0.01, neck - 0.03)
            sh = Vector((cx + (sx - cx) * 0.80, sy, shf * H))
            hand = Vector((a["hand"][0], a["hand"][1], a["hand_f"] * H))
            midf = (shf + a["hand_f"]) / 2 if not a["raised"] else a["top"]
            mids = [c for f, c in a["run"] if abs(f - midf) < 0.015]
            el = Vector((mids[0][0], mids[0][1], midf * H)) if mids else (sh + hand) / 2
            el.y += 0.01 * H                                                # elbows sit a touch back
            J["upperarm_" + side] = (sh, el); J["forearm_" + side] = (el, hand)
    return J

PARENT = {"hips": "root", "spine": "hips", "chest": "spine", "neck": "chest", "head": "neck", "skirt": "hips",
          "thigh_L": "hips", "shin_L": "thigh_L", "foot_L": "shin_L", "thigh_R": "hips", "shin_R": "thigh_R", "foot_R": "shin_R",
          "upperarm_L": "chest", "forearm_L": "upperarm_L", "upperarm_R": "chest", "forearm_R": "upperarm_R"}
ORDER = ["hips", "spine", "chest", "neck", "head", "skirt", "thigh_L", "shin_L", "foot_L", "thigh_R", "shin_R", "foot_R",
         "upperarm_L", "forearm_L", "upperarm_R", "forearm_R"]

def build_armature(J):
    ad = bpy.data.armatures.new("rig"); arm = bpy.data.objects.new("rig", ad)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode="EDIT")
    eb = ad.edit_bones
    r = eb.new("root"); r.head = (0, 0, 0); r.tail = (0, 0, 0.15); r.use_deform = False
    for n in ORDER:
        if n not in J: continue
        b = eb.new(n); b.head, b.tail = J[n]
        if (b.tail - b.head).length < 0.01: b.tail = b.head + Vector((0, 0, 0.02))
        b.roll = 0.0
        b.parent = eb[PARENT[n]]
        b.use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm

# ---------------------------------------------------------------- decimate
def decimate(ob):
    now = sum(len(p.vertices) - 2 for p in ob.data.polygons); was0 = now
    bpy.context.view_layer.objects.active = ob
    for _ in range(6):
        if now <= TRIS * 1.03: break
        m = ob.modifiers.new("dec", "DECIMATE"); m.ratio = TRIS / now
        bpy.ops.object.modifier_apply(modifier="dec")
        was, now = now, sum(len(p.vertices) - 2 for p in ob.data.polygons)
        if now > was * 0.97: break
    for img in bpy.data.images:
        if img.size[0] > TEX or img.size[1] > TEX:
            s = TEX / max(img.size[0], img.size[1]); img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))
    return was0, now

# ---------------------------------------------------------------- weights
def seg_dist(P, a, b):
    ab = b - a; t = np.clip(((P - a) @ ab) / max(ab @ ab, 1e-9), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def piece_of(A, v):
    """Which cross-section piece a vertex sits in: 'body', ('arm', side) or None."""
    f = round(min(max(v[2] / A["H"], 0.02), 0.98), 2)
    ps = A["prof"].get(f, [])
    if not ps: return None
    c = max(ps, key=lambda p: p["n"]); cell = 0.006 * A["H"]
    legs = legs2(A, f) if (A["kind"] in ("walker", "coat") and f <= A["leg_top"] + 0.005) else []
    for p in ps:
        if (p["lo"][0] - cell <= v[0] <= p["hi"][0] + cell) and (p["lo"][1] - cell <= v[1] <= p["hi"][1] + cell):
            if any(p is q for q in legs) or (p is c and not legs): return "body"   # below the crotch the body is the legs
            for side, a in A["arms"].items():
                if any(abs(ff - f) < 0.005 and abs(cc[0] - p["c"][0]) < 1e-6 for ff, cc in a["run"]): return ("arm", side)
            return ("other", float(p["c"][0]), float(p["c"][1]))
    return None

def flower_mask(ob, A):
    """The eye flower by its geometry, on the full resolution mesh (run() calls it before the decimate; the decimated
    mesh has too few ball vertices to fit): a plane fitted to everything above the neck line (petals and eye), the
    vertices near that plane within its radius, the ball behind the eye (a sphere fitted to what sits just behind the
    plane, near its axis), and the drips: thin cross-section pieces near the plane, then grown along the mesh into what
    hangs off them, never into a piece the cross sections call body or arm. weights() maps it to the decimated mesh by
    nearest vertex and drops anything bone heat gave mostly to an arm."""
    H = A["H"]; P = np.array([v.co[:] for v in ob.data.vertices]); z = P[:, 2]; above = z > A["neck"] * H
    up = P[above]; c = up.mean(0); n = np.linalg.svd(up - c)[2][2]
    if n @ np.array([0, -1, 0]) < 0: n = -n                       # the plane's normal points to the front (-Y)
    d = (P - c) @ n; r = np.linalg.norm(P - c - np.outer(d, n), axis=1)
    rmax = np.percentile(np.linalg.norm((up - c) - np.outer((up - c) @ n, n), axis=1), 99)
    back = (z > A["neck"] * H - 0.05) & (d < -0.08) & (r < 0.2)
    Q = P[back]; sol = np.linalg.lstsq(np.c_[2 * Q, np.ones(len(Q))], (Q ** 2).sum(1), rcond=None)[0]
    bc = sol[:3]; rb = math.sqrt(max(1e-6, sol[3] + bc @ bc))
    ball = (np.linalg.norm(P - bc, axis=1) < rb * 1.1) & (z > bc[2] - rb * 0.9)
    pieces = [piece_of(A, v) for v in P]
    thin = np.array([(isinstance(p, tuple) and p[0] == "other") or p is None for p in pieces])
    low = z > 0.5 * H
    core = above | ((np.abs(d) < 0.12) & (r < rmax * 1.4) & low) | ball
    m = core | (thin & (np.abs(d) < 0.25) & (r < rmax * 1.9) & low)
    E = np.array([e.vertices[:] for e in ob.data.edges]); ok = (np.abs(d) < 0.15) & low & thin
    for _ in range(40):
        a, b = m[E[:, 0]], m[E[:, 1]]
        add = np.zeros_like(m); add[E[a & ~b, 1]] = True; add[E[b & ~a, 0]] = True
        add &= ok & ~m
        if not add.any(): break
        m |= add
    log(f"flower plane n {np.round(n, 3).tolist()} radius {rmax:.3f}, ball {np.round(bc, 3).tolist()} r {rb:.3f}, {int(m.sum())} of {len(P)} full res vertices ({int(core.sum())} petal, eye and ball)")
    return P, m, core, bc

def weights(ob, arm, A, J):
    H = A["H"]
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    names = [n for n in ORDER if n in J]; idx = {n: i for i, n in enumerate(names)}
    me = ob.data; nv = len(me.vertices)
    W = np.zeros((nv, len(names)))
    gi = {g.index: g.name for g in ob.vertex_groups}
    for v in me.vertices:
        for g in v.groups:
            n = gi[g.group]
            if n in idx: W[v.index, idx[n]] = g.weight
    P = np.array([v.co[:] for v in me.vertices])
    empty = W.sum(1) < 1e-4
    method = "bone heat"
    if empty.mean() > 0.3: method = "distance (bone heat failed on %d%% of vertices)" % round(100 * empty.mean())
    elif empty.any(): method = "bone heat, distance fill for %d vertices" % empty.sum()
    D = np.stack([seg_dist(P, np.array(J[n][0]), np.array(J[n][1])) for n in names], 1)
    DW = 1.0 / (D + 0.01 * H) ** 4
    if empty.mean() > 0.3: W[:] = DW
    else: W[empty] = DW[empty]

    def zero(mask, bones):
        for b in bones:
            if b in idx: W[mask, idx[b]] = 0
    z = P[:, 2]
    side_of = lambda s: [b + "_" + s for b in ("thigh", "shin", "foot", "upperarm", "forearm")]
    # head: everything above the neck line, petals and all, rides the head; nothing below it does
    head_m = z > A["neck"] * H
    W[head_m] = 0; W[head_m, idx["head"]] = 1
    W[~head_m & (z < (A["neck"] - 0.06) * H), idx["head"]] = 0
    flower_m = np.zeros(nv, bool)
    if "flower" in A:
        P0, m0, c0 = A["flower"][:3]
        near = np.array([np.argmin(((P0 - p) ** 2).sum(1)) for p in P]); fm, fc = m0[near], c0[near]
        armw = sum(W[:, idx[b]] for b in idx if b.startswith(("upperarm", "forearm")))
        if isinstance(armw, np.ndarray): fm &= fc | (armw < 0.3)          # a drip, never an elbow

        W[fm] = 0; W[fm, idx["head"]] = 1
        # the seam where the flower is fused to the jacket: two rings of edges take part of the turn (a half, a
        # quarter), so a 60 degree look twists a collar's width instead of tearing one row of triangles
        Ed = np.array([e.vertices[:] for e in me.edges]); ring = fm.copy()
        for share in (0.5, 0.25):
            nb = np.zeros(nv, bool); nb[Ed[ring[Ed[:, 0]], 1]] = True; nb[Ed[ring[Ed[:, 1]], 0]] = True; nb &= ~ring
            W[nb] *= (1 - share); W[nb, idx["head"]] += share; ring |= nb
        log(f"flower: {int(fm.sum())} vertices bound to the head, {int((fm & ~head_m).sum())} of them below the neck line")
        flower_m = fm; head_m = head_m | fm          # the rules below (arm pieces, carried props, the waist smoothing) leave the flower alone
    # arm pieces clear of the body: arm bones only; props carried below the elbow go rigid with the forearm
    pieces = [piece_of(A, v) for v in P]
    for s in ("L", "R"):
        if "upperarm_" + s not in idx: continue
        m = np.array([p == ("arm", s) for p in pieces]) & ~flower_m   # a drip beside the arm stays on the flower
        keep = [idx["upperarm_" + s], idx["forearm_" + s]]
        for j in range(len(names)):
            if j not in keep: W[m, j] = 0
        el = J["forearm_" + s][0]
        low = m & ((z > el.z + 0.03 * H) if A["arms"][s].get("raised") else (z < el.z - 0.03 * H))
        W[low] = 0; W[low, idx["forearm_" + s]] = 1
        # body pieces (torso, legs) take no arm weight below the armpit
        bm = np.array([p == "body" for p in pieces]) & (z < (A["armpit"] - 0.02) * H)
        W[bm, idx["upperarm_" + s]] = 0; W[bm, idx["forearm_" + s]] = 0
    # loose pieces beside the body below the hands (a briefcase, a bag) go with the nearest forearm
    # judged by the centre of the cut piece, so a case pressed against a trouser leg still goes whole
    trunk = [n for n in ("hips", "spine", "thigh_L", "thigh_R", "shin_L", "shin_R") if n in idx]
    def clear(p, zz):
        c = np.array([[p[1], p[2], zz]])
        return min(seg_dist(c, np.array(J[n][0]), np.array(J[n][1]))[0] for n in trunk) > 0.07 * H if trunk else True
    rigid = {}
    for i, p in enumerate(pieces):
        if isinstance(p, tuple) and p[0] == "other" and not flower_m[i] and z[i] < A["armpit"] * H and z[i] > 0.12 * H and clear(p, z[i]):
            fa = [n for n in ("forearm_L", "forearm_R") if n in idx]
            if fa:
                n = min(fa, key=lambda n: np.linalg.norm(P[i] - np.array(J[n][1])))
                if np.linalg.norm(P[i] - np.array(J[n][1])) < 0.22 * H: W[i] = 0; W[i, idx[n]] = 1; rigid[i] = idx[n]
    # legs: never the other leg
    if "thigh_L" in idx:
        cx = J["hips"][0].x
        lowz = z < min(J["thigh_L"][0].z, J["thigh_R"][0].z)
        side = np.where(P[:, 0] > cx, 1, -1)
        for i in np.nonzero(lowz)[0]:
            f = round(min(max(z[i] / H, 0.02), A["leg_top"]), 2)
            ps = legs2(A, f)
            if len(ps) == 2:
                d = [np.linalg.norm(P[i, :2] - np.clip(P[i, :2], p["lo"], p["hi"])) for p in ps]
                side[i] = -1 if d[0] <= d[1] else 1        # ps is [right, left]
        zero(lowz & (side > 0), ["thigh_R", "shin_R", "foot_R"])
        zero(lowz & (side < 0), ["thigh_L", "shin_L", "foot_L"])
        # below the knees nothing but the leg itself: a sole or a hem left on the hips smears along the floor
        knee = min(J["shin_L"][0].z, J["shin_R"][0].z)
        below = z < knee
        zero(below, ["hips", "spine", "chest", "skirt", "upperarm_L", "forearm_L", "upperarm_R", "forearm_R"])
        if A["kind"] == "coat":   # the coat panels hang from the hips and the skirt, the legs move inside them
            hem = (A["leg_top"] + 0.01) * H
            coat = (z > hem) & (z < J["hips"][0].z + 0.02 * H)
            zero(coat, ["thigh_L", "thigh_R", "shin_L", "shin_R", "foot_L", "foot_R"])
            under = z <= hem
            zero(under, ["skirt", "hips", "spine"])
    if "skirt" in idx:
        zero(z > J["hips"][0].z + 0.04 * H, ["skirt"])
    DWf = DW.copy()
    if "thigh_L" in idx:                       # an emptied leg vertex refills from its own leg only
        for sd, sg in (("L", 1), ("R", -1)):
            m = below & (side == sg)
            for j, n in enumerate(names):
                if not n.endswith("_" + sd) or n.startswith(("upperarm", "forearm")): DWf[m, j] = 0
    W = np.where(W.sum(1, keepdims=True) < 1e-6, DWf, W)

    # smooth the waist and crotch (and the coat) over the mesh edges
    E = np.array([e.vertices[:] for e in me.edges])
    band = (z > J["hips"][0].z - 0.10 * H) & (z < J["spine"][1].z) & ~head_m
    sm_bones = [idx[b] for b in ("hips", "spine", "chest", "thigh_L", "thigh_R", "skirt") if b in idx]
    for _ in range(4):
        acc = np.zeros_like(W); cnt = np.zeros(nv)
        np.add.at(acc, E[:, 0], W[E[:, 1]]); np.add.at(acc, E[:, 1], W[E[:, 0]])
        np.add.at(cnt, E[:, 0], 1); np.add.at(cnt, E[:, 1], 1)
        avg = acc / np.maximum(cnt, 1)[:, None]
        for j in sm_bones: W[band, j] = 0.5 * W[band, j] + 0.5 * avg[band, j]
    for i, j in rigid.items(): W[i] = 0; W[i, j] = 1          # carried props stay rigid after the smoothing
    # four influences, normalised
    order = np.argsort(-W, 1)
    for i in range(nv): W[i, order[i, 4:]] = 0
    W /= np.maximum(W.sum(1, keepdims=True), 1e-12)        # normalise first: heat can leave a vertex only tiny weights
    W[W < 0.01] = 0
    dead = W.sum(1) < 1e-6                                   # never leave a vertex unbound (it would stay at rest)
    if dead.any():
        W[dead] = 0; W[dead, np.argmax(DWf[dead], 1)] = 1
    W /= np.maximum(W.sum(1, keepdims=True), 1e-9)
    for g in list(ob.vertex_groups): ob.vertex_groups.remove(g)
    for j, n in enumerate(names):
        g = ob.vertex_groups.new(name=n)
        for i in np.nonzero(W[:, j])[0]: g.add([int(i)], float(W[i, j]), "REPLACE")
    return method

# ---------------------------------------------------------------- animation helpers
def ease(u): return u * u * (3 - 2 * u)

def basis(arm, n, Q):
    """An armature space rotation Q (about the bone head) as the bone's local pose rotation."""
    R = arm.data.bones[n].matrix_local.to_quaternion()
    return R.inverted() @ Q @ R

def qx(a): return Quaternion((1, 0, 0), a)
def qy(a): return Quaternion((0, 1, 0), a)
def qz(a): return Quaternion((0, 0, 1), a)

def key(arm, f, rots, locs=None):
    for n, Q in rots.items():
        if n not in arm.pose.bones: continue
        pb = arm.pose.bones[n]; pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = basis(arm, n, Q); pb.keyframe_insert("rotation_quaternion", frame=f, group=n)
    for n, d in (locs or {}).items():
        pb = arm.pose.bones[n]
        R = arm.data.bones[n].matrix_local.to_3x3()
        pb.location = R.inverted() @ Vector(d); pb.keyframe_insert("location", frame=f, group=n)

def new_action(arm, name):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"    # LINEAR in glTF, a third the size of CUBICSPLINE
    act = bpy.data.actions.new(name); act.use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = act
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    return act

def linear(act):
    """Every key LINEAR, so the exporter writes LINEAR samplers (CUBICSPLINE triples the animation bytes)."""
    for layer in act.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    for kp in fc.keyframe_points: kp.interpolation = "LINEAR"

def planar(v): return math.atan2(v.z, v.y)

def leg_ik(J, side, hip_drop, ty, tz):
    """Two bone IK in the figure's side plane. ty, tz: ankle target (armature space); returns (thigh, shin) world
    angles about X and the new shin direction angle."""
    hip, knee = J["thigh_" + side]; ank = J["shin_" + side][1]
    t0, s0 = knee - hip, ank - knee
    a = math.hypot(t0.y, t0.z); b = math.hypot(s0.y, s0.z)
    hy, hz = hip.y, hip.z - hip_drop
    dy, dz = ty - hy, tz - hz
    d = min(math.hypot(dy, dz), (a + b) * 0.999)
    ang_d = math.atan2(dz, dy)
    alpha = math.acos(max(-1, min(1, (a * a + d * d - b * b) / (2 * a * d))))
    th = ang_d + alpha if True else ang_d - alpha   # knee forward (-Y): pick the side that puts the knee at lower y
    kyz = (hy + a * math.cos(ang_d + alpha), hz + a * math.sin(ang_d + alpha))
    kyz2 = (hy + a * math.cos(ang_d - alpha), hz + a * math.sin(ang_d - alpha))
    if kyz2[0] < kyz[0]: th, kyz = ang_d - alpha, kyz2
    sh = math.atan2(hz + d * math.sin(ang_d) - kyz[1], hy + d * math.cos(ang_d) - kyz[0])
    return th - math.atan2(t0.z, t0.y), sh - math.atan2(s0.z, s0.y)

# ---------------------------------------------------------------- clips
def arm_amp(A, side):
    a = A["arms"].get(side)
    if not a or a["touching"]: return 0.0
    return 0.25 if (a.get("raised") or a["bottom"] > A["armpit"] - 0.12) else 1.0     # a raised arm barely swings

def walk(arm, A, J):
    H, kind = A["H"], A["kind"]
    new_action(arm, "walk")
    N = FPS                                  # 1.0 s
    legs = "thigh_L" in J
    info = {}
    if legs:
        Lleg = (J["thigh_L"][0].z - J["shin_L"][1].z)
        S = (0.36 if kind == "walker" else 0.20) * Lleg      # half step, metres
        duty = 0.6
        lift = (0.10 if kind == "walker" else 0.06) * Lleg
        v = 2 * S / duty
        info.update(speed=round(v, 3), step=round(2 * S, 3))
    else:
        info.update(speed=0.55, step=None)
    sw = {"L": arm_amp(A, "L"), "R": arm_amp(A, "R")}
    PH = {"L": 0.0, "R": 0.5}
    for fr in range(N + 1):
        t = (fr % N) / N
        rots, locs = {}, {}
        drop = 0.0; plan = {}
        if legs:
            for s in ("L", "R"):
                p = (t - PH[s]) % 1.0
                ank = J["shin_" + s][1]; y0 = ank.y; az = ank.z
                heel, toe = A["sole"][s]; hr, tr = heel - ank, toe - ank
                # phi: foot pitch about X; negative lifts the toes (heel strike), positive lifts the heel (toe off)
                if p < duty:                     # planted: the foot moves back at a constant speed
                    u = p / duty; y = y0 - S + 2 * S * u; zb = 0.0
                    if u < 0.12: phi = -math.radians(10) * (1 - ease(u / 0.12))
                    elif u > 0.72: phi = math.radians(24) * ((u - 0.72) / 0.28) ** 1.6
                    else: phi = 0.0
                    st = True
                else:                            # swing: ease forward, lift through the middle
                    u = (p - duty) / (1 - duty)
                    y = y0 + S - 2 * S * ease(u)
                    zb = az + lift * math.sin(math.pi * u)
                    phi = math.radians(24) * (1 - ease(min(1, u / 0.45))) - math.radians(10) * ease(max(0, (u - 0.6) / 0.4))
                    st = False
                rz = lambda vv, a: vv.y * math.sin(a) + vv.z * math.cos(a)
                ry = lambda vv, a: vv.y * math.cos(a) - vv.z * math.sin(a)
                z = max(-rz(hr, phi), -rz(tr, phi))               # the sole never goes under the floor
                if not st: z += zb - az                            # and in the swing it clears it at once
                piv = tr if phi > 0 else hr                       # roll over the toes, or land on the heel
                y += piv.y - ry(piv, phi)
                plan[s] = (y, z, phi, st)
            # hips come down only as far as the planted legs need (that dip is the bob)
            for s, (y, z, phi, st) in plan.items():
                hip, knee = J["thigh_" + s]; ank = J["shin_" + s][1]
                t0, s0 = knee - hip, ank - knee
                L = (math.hypot(t0.y, t0.z) + math.hypot(s0.y, s0.z)) * 0.975
                dy = y - hip.y; need = (hip.z - z) - math.sqrt(max(L * L - dy * dy, 0))
                if st: drop = max(drop, need)
            drop = max(drop, 0.0)
            for s, (y, z, phi, st) in plan.items():
                th, sh = leg_ik(J, s, drop, y, z)
                rots["thigh_" + s] = qx(th); rots["shin_" + s] = qx(sh - th); rots["foot_" + s] = qx(phi - sh)
            locs["hips"] = (0, 0, -drop)
        else:
            locs["hips"] = (0, 0, -0.008 * H * (0.5 - 0.5 * math.cos(4 * math.pi * t)))
        c = math.cos(2 * math.pi * t)            # +1 when the left foot is forward (it lands at t = 0)
        hip_yaw = math.radians(5 if legs else 6) * c
        # with legs the pelvis stays square (a turning pelvis would drag the planted foot); the turn starts at the waist
        rots["hips"] = qz(0 if legs else -hip_yaw) @ qy(math.radians(0 if legs else 2.5) * math.sin(2 * math.pi * t))
        rots["spine"] = qx(math.radians(3)) @ qz(-hip_yaw if legs else hip_yaw * 0.6)
        rots["chest"] = qz(hip_yaw * (1.6 if legs else 0.7)) @ qy(math.radians(1.2) * math.sin(2 * math.pi * t))
        rots["neck"] = Quaternion()
        rots["head"] = qz(-hip_yaw * 0.3) @ qx(-math.radians(2.5))
        if "skirt" in J:
            rots["skirt"] = qx(math.radians(4) * math.sin(2 * math.pi * t + 0.6)) @ qy(math.radians(2.5) * c)
        for s, sg in (("L", 1), ("R", -1)):
            if "upperarm_" + s not in J: continue
            amp = sw[s]
            fwd = -sg * c                         # the left arm goes forward with the right leg
            a = math.radians(17) * fwd * amp
            rots["upperarm_" + s] = qx(-a)
            rots["forearm_" + s] = qx(-math.radians(8 + 10 * max(0, fwd)) * amp)
        key(arm, fr, rots, locs)
    return info

def idle(arm, A, J):
    H = A["H"]; new_action(arm, "idle")
    N = 4 * FPS
    seated = A["kind"] == "seated"
    for fr in range(0, N + 1, 2):              # a slow clip: a key every other frame is plenty
        t = (fr % N) / N; T2 = 2 * math.pi * t
        br = math.sin(T2 * 2)                    # two breaths in 4 s
        shift = math.sin(T2)                     # one weight shift
        # the glance: turn to the left at 0.8 s, hold, back at 2.2 s, a small look right, home by 4 s
        g = 0.0
        if 0.2 <= t < 0.35: g = ease((t - 0.2) / 0.15)
        elif 0.35 <= t < 0.55: g = 1.0
        elif 0.55 <= t < 0.7: g = 1 - ease((t - 0.55) / 0.15)
        elif 0.7 <= t < 0.82: g = -0.35 * ease((t - 0.7) / 0.12)
        elif 0.82 <= t < 0.95: g = -0.35 * (1 - ease((t - 0.82) / 0.13))
        rots = {
            "hips": qy(math.radians(0 if seated else 1.6) * shift),
            "spine": qx(math.radians(0.8) * br) @ qy(-math.radians(1.0 if seated else 2.2) * shift),
            "chest": qx(-math.radians(1.4) * br) @ qy(math.radians(0.6) * shift),
            "neck": qz(math.radians(6) * g),
            "head": qz(math.radians(22) * g) @ qx(math.radians(2) * br - math.radians(3) * abs(g)),
        }
        for s in ("L", "R"):                     # the arms hang: undo the trunk's lean, breathe a little
            if "upperarm_" + s in J and arm_amp(A, s):
                rots["upperarm_" + s] = qy(-math.radians(0.6 if seated else 1.0) * shift) @ qx(math.radians(1.0) * br)
                rots["forearm_" + s] = qx(-math.radians(2) * (1 + br) * 0.5)
        if "thigh_L" in J:                       # pelvis tilts over the legs; the feet stay put
            for s in ("L", "R"):
                rots["thigh_" + s] = qy(-math.radians(1.6) * shift)
                rots["foot_" + s] = Quaternion()
                rots["shin_" + s] = Quaternion()
        if "skirt" in J: rots["skirt"] = qy(-math.radians(1.2) * shift)
        key(arm, fr, rots, {"hips": (0, 0, -0.002 * H * (1 - math.cos(T2 * 2)) * 0.5) if not seated else (0, 0, 0)})
    return {"length": 4.0}

# ---------------------------------------------------------------- ground fit
def ground_fit(arm, ob, act_name):
    """Evaluate the skinned mesh on every key; where any of it is under the floor, lift the hips by that much.
    Returns the deepest dip found before the fix (metres, negative)."""
    act = bpy.data.actions[act_name]; arm.animation_data.action = act
    frames = sorted({int(round(k.co.x)) for layer in act.layers for st in layer.strips for cb in st.channelbags
                     for fc in cb.fcurves for k in fc.keyframe_points})
    pb = arm.pose.bones["hips"]; R = arm.data.bones["hips"].matrix_local.to_3x3()
    worst = 0.0; lifts = {}
    for fr in frames:
        bpy.context.scene.frame_set(fr)
        dg = bpy.context.evaluated_depsgraph_get(); oe = ob.evaluated_get(dg); me = oe.to_mesh()
        mz = min((oe.matrix_world @ v.co).z for v in me.vertices); oe.to_mesh_clear()
        worst = min(worst, mz)
        if mz < -0.002: lifts[fr] = -mz
    for fr, dz in lifts.items():
        bpy.context.scene.frame_set(fr)
        pb.location = pb.location + R.inverted() @ Vector((0, 0, dz)); pb.keyframe_insert("location", frame=fr, group="hips")
    linear(act)
    return round(worst, 4), len(lifts)

# ---------------------------------------------------------------- ground and slide check
def check_walk(arm, A, J, info):
    if "thigh_L" not in J: return {}
    arm.animation_data.action = bpy.data.actions["walk"]
    res = {"min_sole_z": 1e9, "max_slip": 0.0}
    track = {"L": [], "R": []}
    for fr in range(FPS + 1):
        bpy.context.scene.frame_set(fr)
        for s in ("L", "R"):
            pb = arm.pose.bones["foot_" + s]; M = pb.matrix @ arm.data.bones["foot_" + s].matrix_local.inverted()
            heel, toe = A["sole"][s]
            ph, pt = M @ heel, M @ toe
            res["min_sole_z"] = min(res["min_sole_z"], ph.z, pt.z)
            track[s].append((fr / FPS, ph, pt))
    v = info["speed"]; PH = {"L": 0.0, "R": 0.5}
    for s in ("L", "R"):
        for k in (1, 2):
            pts = [((t - PH[s]) % 1.0, P[k]) for P in track[s] for t in [P[0]] if P[k].z < 0.004 and (t - PH[s]) % 1.0 <= 0.6 + 1e-6]
            if len(pts) > 2:
                ws = [pt.y - v * tt for tt, pt in pts]
                res["max_slip"] = max(res["max_slip"], max(ws) - min(ws))
    res = {k: round(float(x), 4) for k, x in res.items()}
    return res

# ---------------------------------------------------------------- main
def run(name, kind, height):
    ob = load(name, height)
    A = analyse(ob, kind)
    if name in FLOWER: A["flower"] = flower_mask(ob, A)
    if A["kind"] == "seated":
        H = A["H"]
        # the seat: the highest cut under the armpits where the body is widest front to back (the lap)
        best = max((p["hi"][1] - p["lo"][1], f) for f, ps in A["prof"].items() if 0.25 <= f <= 0.5 for p in ps[:1])
        A["seat"] = float(best[1]) + 0.04
        A["arms"] = {}
    tri0, tri1 = decimate(ob)
    J = joints(A, ob)
    arm = build_armature(J)
    method = weights(ob, arm, A, J)
    clips = {}
    if A["kind"] != "seated": clips["walk"] = walk(arm, A, J)
    clips["idle"] = idle(arm, A, J)
    for act in bpy.data.actions: linear(act)
    dips = {c: ground_fit(arm, ob, c) for c in clips}
    chk = check_walk(arm, A, J, clips.get("walk", {})) if "walk" in clips else {}
    arm.animation_data.action = None
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.frame_start = 0; bpy.context.scene.frame_end = FPS * 4
    out = os.path.join(OUT, name + ".glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG",
                              export_jpeg_quality=80, export_skins=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_force_sampling=False,
                              export_optimize_animation_size=True, export_def_bones=False, export_morph=False,
                              export_extras=False)
    kb = os.path.getsize(out) // 1024
    rec = {"name": name, "kind": A["kind"], "height_m": round(height, 3), "tris_before": tri0, "tris": tri1, "kb": kb,
           "bones": ["root"] + [n for n in ORDER if n in J], "weights": method, "clips": clips, "floor_dips_fixed": dips, "walk_check": chk,
           "arms": {s: ("touching the body, held still" if a["touching"] else ("raised (hand rides the forearm, not the head), quarter swing" if arm_amp(A, s) < 1 else "free swing")) for s, a in A["arms"].items()},
           "landmarks": {"legs_part_below": A["leg_top"], "armpit": A["armpit"], "neck_line": A["neck"]}}
    if A["kind"] != "seated":
        rec.update(lite_export(ob, name))
    rec["file"] = name + ".glb"; rec["has_legs"] = "thigh_L" in J
    rec["walk_speed"] = clips.get("walk", {}).get("speed")
    log(json.dumps(rec))
    return rec

LITE_TRIS, LITE_TEX = 800, 256

def lite_export(ob, name):
    """The mid distance crowd part: the same skeleton, weights and clips on about 800 triangles and a 256 px texture.
    The skinned mesh is decimated in place, then every vertex takes the weights of the nearest full rig vertex (a
    collapse blends weights across a sole or a cuff and drops a foot through the floor)."""
    bpy.context.view_layer.objects.active = ob
    gn = [g.name for g in ob.vertex_groups]
    P0 = np.array([v.co[:] for v in ob.data.vertices]); W0 = np.zeros((len(P0), len(gn)))
    for v in ob.data.vertices:
        for g in v.groups: W0[v.index, g.group] = g.weight
    now = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    for _ in range(6):
        if now <= LITE_TRIS * 1.05: break
        m = ob.modifiers.new("dec", "DECIMATE"); m.ratio = LITE_TRIS / now
        bpy.ops.object.modifier_move_to_index(modifier="dec", index=0)
        bpy.ops.object.modifier_apply(modifier="dec")
        was, now = now, sum(len(p.vertices) - 2 for p in ob.data.polygons)
        if now > was * 0.97: break
    for v in ob.data.vertices:                      # the collapse can push a sole vertex under the floor
        if v.co.z < 0: v.co.z = 0.0
    P1 = np.array([v.co[:] for v in ob.data.vertices])
    near = np.array([np.argmin(((P0 - p) ** 2).sum(1)) for p in P1])
    for g in list(ob.vertex_groups): ob.vertex_groups.remove(g)
    groups = [ob.vertex_groups.new(name=n) for n in gn]
    for i, k in enumerate(near):
        for j in np.nonzero(W0[k])[0]: groups[j].add([int(i)], float(W0[k, j]), "REPLACE")
    for img in bpy.data.images:
        if img.size[0] > LITE_TEX or img.size[1] > LITE_TEX:
            s = LITE_TEX / max(img.size[0], img.size[1]); img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))
    out = os.path.join(OUT, name + "_lite.glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG",
                              export_jpeg_quality=78, export_skins=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_force_sampling=False,
                              export_optimize_animation_size=True, export_def_bones=False, export_morph=False,
                              export_extras=False)
    return {"lite_file": name + "_lite.glb", "lite_tris": now, "lite_kb": os.path.getsize(out) // 1024}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    jobs = sys.argv[sys.argv.index("--") + 1].split(",")
    man_p = os.path.join(OUT, "rig_manifest.json")
    man = json.load(open(man_p)) if os.path.exists(man_p) else {}
    for j in jobs:
        f = (j.split(":") + ["", "", ""])[:4]
        if f[3]: NECK[f[0]] = float(f[3])
        kind = f[1] or "auto"
        h = float(f[2]) if f[2] else (1.50 if kind == "seated" else STAND)
        man[f[0]] = run(f[0], kind, h)
        json.dump(man, open(man_p, "w"), indent=1)
