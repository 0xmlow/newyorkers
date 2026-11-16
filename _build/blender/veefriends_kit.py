"""veefriends_kit.py: thirteen VeeFriends inspired characters, built headless in Blender from primitives in the museum's
institution kit lane, in MLow's reading of the doodle: big heads, flat colours, a black marker outline (an inverted hull),
one trait accessory each. Never a copy of a drawing: a panda is a panda, an elephant an elephant. Metres, Z up in Blender,
the face toward Blender +Y (glTF -Z, three.js forward). kit.prop() rescales by height at placement.

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python veefriends_kit.py -- --out ../../work/vf_glb
"""
import math, os, sys
sys.path.insert(0, "/Users/degens/Desktop/NEW YORKERS BY MLOW/NEW YORKERS SITE/_build/museum/blender")
import build_institution_kit as K  # noqa: E402
from build_institution_kit import mat, cube, cyl, sphere, cone, tube, torus, taper, join, clear, export, C, D  # noqa: E402
from mathutils import Vector  # noqa: E402
import bpy  # noqa: E402

PI = math.pi
INK = (0.03, 0.03, 0.03)
WHITE = (0.96, 0.95, 0.92)
PURPLE = (0.42, 0.25, 0.78)
GOLD = (0.95, 0.76, 0.2)

def ink(): return mat("ink", INK, 0, 0.5)
def eyes(parts, y, z, dx=0.1, r=0.07, iris=(0.05, 0.05, 0.05)):
    for s in (-1, 1):
        parts.append(sphere(r, (s * dx, y, z), mat("eyeWhite", WHITE, 0, 0.3), 12, 8))
        parts.append(sphere(r * 0.45, (s * dx, y + r * 0.72, z + r * 0.05), mat("eyeDark", iris, 0, 0.25), 10, 6))
        parts.append(sphere(r * 0.14, (s * dx + r * 0.18, y + r * 0.95, z + r * 0.25), mat("eyeGlint", WHITE, 0, 0.2), 6, 4))
def smile(parts, y, z, w=0.14):
    parts.append(torus(w, 0.012, (0, y, z), ink(), (PI / 2, 0, 0), 24, 6))
def limbs(parts, m, body_r, h, arms=True, legs=True, leg_r=0.09, arm_r=0.07):
    if legs:
        for s in (-1, 1):
            parts.append(cyl(leg_r, 0.36, (s * body_r * 0.45, 0, 0.18), m, seg=16))
            parts.append(sphere(leg_r * 1.35, (s * body_r * 0.45, 0.03, 0.04), m, 12, 8, (1, 1.3, 0.7)))
    if arms:
        for s in (-1, 1):
            a = tube([Vector((s * body_r * 0.95, 0, h * 0.62)), Vector((s * body_r * 1.35, 0.08, h * 0.48)), Vector((s * body_r * 1.45, 0.18, h * 0.36))], arm_r, m, name="arm")
            parts.append(a); parts.append(sphere(arm_r * 1.4, (s * body_r * 1.45, 0.2, h * 0.34), m, 10, 8))
def outline(objs, width=0.018):
    """the marker line: a shell pushed out along the normals and turned inside out, black. Seen from outside only its far
    side faces the camera, so it draws as a rim around the silhouette. One layer only (a Solidify modifier keeps the
    original surface too, which z fights the body in three.js and paints the whole figure black)."""
    import bmesh
    out = []
    for o in objs:
        me = o.data.copy(); me.materials.clear(); me.materials.append(ink())
        bm = bmesh.new(); bm.from_mesh(me); bm.normal_update()
        for v in bm.verts: v.co += v.normal * width
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
        bm.to_mesh(me); bm.free()
        for poly in me.polygons: poly.material_index = 0
        d = bpy.data.objects.new(o.name + "_ink", me); d.matrix_world = o.matrix_world.copy(); C.collection.objects.link(d)
        out.append(d)
    return out

def figure(name, body_col, head_col=None, head_r=0.34, body_r=0.26, h=1.1, nose=None, extra=None, iris=INK, eye_dx=0.11):
    """the shared body: a bean body, a big head, eyes, a smile, legs and arms, then the extras"""
    bm = mat(name + "Body", body_col, 0, 0.55); hm = mat(name + "Head", head_col or body_col, 0, 0.55)
    parts = []
    body = sphere(body_r, (0, 0, 0.36 + body_r), bm, 24, 16, (1, 0.9, 1.15)); parts.append(body)
    head = sphere(head_r, (0, 0, 0.36 + body_r * 2 + head_r * 0.8), hm, 32, 20, (1.05, 1, 0.95)); parts.append(head)
    hz = 0.36 + body_r * 2 + head_r * 0.8
    eyes(parts, head_r * 0.72, hz + head_r * 0.12, eye_dx, head_r * 0.2, iris)
    smile(parts, head_r * 0.86, hz - head_r * 0.28, head_r * 0.32)
    if nose: parts.append(sphere(nose[0], (0, head_r * 0.92, hz - head_r * 0.08), mat(name + "Nose", nose[1], 0, 0.4), 12, 8, (1.2, 0.8, 0.8)))
    limbs(parts, bm, body_r, hz)
    if extra: parts += extra(parts, hz, head_r, body_r)
    for p in parts: K.smooth(p)
    ol = outline(parts)
    return join(parts + ol, name)

def panda():
    def ex(parts, hz, hr, br):
        out = []
        blk = mat("pandaBlack", (0.06, 0.06, 0.07), 0, 0.6)
        for s in (-1, 1):
            out.append(sphere(hr * 0.26, (s * hr * 0.72, -hr * 0.1, hz + hr * 0.78), blk, 12, 8))     # ears
            out.append(sphere(hr * 0.3, (s * hr * 0.33, hr * 0.78, hz + hr * 0.14), blk, 12, 8, (1, 0.5, 1.2)))   # eye patches
        return out
    return figure("panda", (0.95, 0.94, 0.9), nose=(0.05, INK), extra=ex, eye_dx=0.11)

def elephant():
    def ex(parts, hz, hr, br):
        grey = mat("elephantBody", (0.55, 0.57, 0.66), 0, 0.55); out = []
        for s in (-1, 1): out.append(sphere(hr * 0.75, (s * hr * 0.95, -hr * 0.15, hz + hr * 0.15), grey, 16, 10, (0.35, 1, 1.1)))   # ears
        trunk = tube([Vector((0, hr * 0.9, hz - hr * 0.2)), Vector((0, hr * 1.4, hz - hr * 0.5)), Vector((0, hr * 1.55, hz - hr * 1.0)), Vector((0, hr * 1.4, hz - hr * 1.4))], hr * 0.16, grey, name="trunk"); out.append(trunk)
        for s in (-1, 1): out.append(cone(0.035, 0.16, (s * hr * 0.42, hr * 0.95, hz - hr * 0.42), mat("tusk", WHITE, 0, 0.3), 12, (PI / 2, 0, 0)))
        return out
    return figure("elephant", (0.55, 0.57, 0.66), extra=ex, head_r=0.36)

def gorilla():
    def ex(parts, hz, hr, br):
        out = [sphere(hr * 0.5, (0, hr * 0.7, hz - hr * 0.25), mat("gorillaFace", (0.45, 0.38, 0.34), 0, 0.5), 16, 10, (1.3, 0.6, 0.9))]
        out.append(sphere(br * 0.8, (0, br * 0.6, 0.36 + br * 1.15), mat("gorillaChest", (0.45, 0.38, 0.34), 0, 0.5), 16, 10, (1.2, 0.5, 1.0)))
        return out
    return figure("gorilla", (0.16, 0.14, 0.15), extra=ex, head_r=0.33, body_r=0.3)

def goat():
    def ex(parts, hz, hr, br):
        horn = mat("horn", (0.78, 0.7, 0.55), 0, 0.5); out = []
        for s in (-1, 1):
            out.append(tube([Vector((s * hr * 0.4, -hr * 0.2, hz + hr * 0.85)), Vector((s * hr * 0.55, -hr * 0.45, hz + hr * 1.2)), Vector((s * hr * 0.45, -hr * 0.7, hz + hr * 1.45))], 0.04, horn, name="horn"))
            out.append(sphere(hr * 0.22, (s * hr * 0.8, -hr * 0.1, hz + hr * 0.3), mat("goatBody", (0.9, 0.88, 0.82), 0, 0.6), 12, 8, (0.6, 1.3, 0.6)))
        out.append(cone(hr * 0.18, hr * 0.5, (0, hr * 0.78, hz - hr * 0.62), mat("goatBeard", (0.85, 0.82, 0.74), 0, 0.7), 10, (PI, 0, 0)))
        out.append(torus(0.16, 0.03, (0, 0, 0.36 + br * 2 - 0.02), mat("bow", (0.85, 0.2, 0.3), 0, 0.4), (0, 0, 0), 24, 8))   # the gift ribbon
        return out
    return figure("goat", (0.9, 0.88, 0.82), nose=(0.04, (0.95, 0.6, 0.65)), extra=ex)

def blackcat():
    def ex(parts, hz, hr, br):
        blk = mat("catBody", (0.07, 0.07, 0.08), 0, 0.6); out = []
        for s in (-1, 1): out.append(cone(hr * 0.26, hr * 0.5, (s * hr * 0.55, 0, hz + hr * 0.85), blk, 10))
        out.append(tube([Vector((0, -br * 0.9, 0.5)), Vector((0.1, -br * 1.6, 0.7)), Vector((0.25, -br * 1.8, 1.05))], 0.045, blk, name="tail"))
        out.append(torus(0.17, 0.025, (0, 0, 0.36 + br * 2 - 0.04), mat("collar", PURPLE, 0, 0.4), (0, 0, 0), 24, 8))
        out.append(sphere(0.045, (0, 0.2, 0.36 + br * 2 - 0.1), mat("bell", GOLD, 1, 0.3), 10, 8))
        return out
    return figure("blackcat", (0.07, 0.07, 0.08), nose=(0.03, (0.95, 0.6, 0.65)), extra=ex, iris=(0.2, 0.85, 0.35), head_r=0.32)

def bee():
    def ex(parts, hz, hr, br):
        out = []; blk = mat("beeBlack", (0.08, 0.08, 0.06), 0, 0.6)
        for k in range(3): out.append(torus(br * 1.0 - 0.01, 0.05, (0, 0, 0.36 + br * 0.5 + k * br * 0.5), blk, (0, 0, 0), 32, 8))
        wing = mat("wing", (0.85, 0.92, 1.0), 0, 0.1)
        for s in (-1, 1): out.append(sphere(0.22, (s * 0.18, -br * 0.9, 0.36 + br * 2.1), wing, 12, 8, (1.0, 1.6, 0.12)))
        for s in (-1, 1): out.append(tube([Vector((s * hr * 0.3, 0, hz + hr * 0.9)), Vector((s * hr * 0.45, 0.05, hz + hr * 1.3))], 0.015, blk, name="ant")); out.append(sphere(0.035, (s * hr * 0.45, 0.05, hz + hr * 1.32), blk, 8, 6))
        out.append(cyl(0.2, 0.08, (0, 0, hz + hr * 0.95), mat("capGreen", (0.07, 0.34, 0.25), 0, 0.6), seg=24)); out.append(cube(0.18, 0.12, 0.03, (0, hr * 0.35, hz + hr * 0.93), mat("capGreen", (0.07, 0.34, 0.25), 0, 0.6)))   # a green fitted cap
        return out
    return figure("bee", (0.98, 0.78, 0.15), extra=ex, head_r=0.3)

def ant():
    def ex(parts, hz, hr, br):
        red = mat("antBody", (0.55, 0.12, 0.1), 0, 0.5); out = [sphere(br * 0.9, (0, -br * 1.6, 0.36 + br * 0.9), red, 16, 10, (1, 1.3, 1))]
        for s in (-1, 1):
            for k in range(2): out.append(tube([Vector((s * br * 0.8, -br * 0.4 + k * 0.3, 0.36 + br)), Vector((s * br * 1.5, -br * 0.4 + k * 0.3, 0.36 + br * 0.5)), Vector((s * br * 1.6, -br * 0.4 + k * 0.3, 0.02))], 0.03, red, name="leg"))
            out.append(tube([Vector((s * hr * 0.3, 0, hz + hr * 0.9)), Vector((s * hr * 0.5, 0.15, hz + hr * 1.3))], 0.015, red, name="ant")); out.append(sphere(0.03, (s * hr * 0.5, 0.15, hz + hr * 1.32), red, 8, 6))
        out.append(cube(0.3, 0.2, 0.04, (0, 0, 0.36 + br * 2.05), mat("ledger", (0.1, 0.1, 0.1), 0, 0.5)))   # the ledger it carries
        return out
    return figure("ant", (0.55, 0.12, 0.1), extra=ex, head_r=0.3, body_r=0.22)

def alien():
    def ex(parts, hz, hr, br):
        grn = mat("alienBody", (0.45, 0.85, 0.4), 0, 0.5); out = []
        out.append(tube([Vector((0, 0, hz + hr * 0.9)), Vector((0.05, 0, hz + hr * 1.35))], 0.02, grn, name="ant")); out.append(sphere(0.06, (0.05, 0, hz + hr * 1.4), mat("alienGlow", (0.6, 1, 0.6), 0, 0.3, emit=(0.4, 1, 0.5), emit_strength=2), 10, 8))
        return out
    return figure("alien", (0.45, 0.85, 0.4), extra=ex, head_r=0.4, iris=(0.02, 0.02, 0.02), eye_dx=0.15)

def ape():
    def ex(parts, hz, hr, br):
        out = [sphere(hr * 0.5, (0, hr * 0.7, hz - hr * 0.25), mat("apeFace", (0.75, 0.6, 0.5), 0, 0.5), 16, 10, (1.3, 0.6, 0.9))]
        for s in (-1, 1): out.append(sphere(hr * 0.22, (s * hr * 0.9, 0, hz + hr * 0.05), mat("apeFace", (0.75, 0.6, 0.5), 0, 0.5), 12, 8))
        out.append(torus(0.05, 0.012, (0.12, hr * 0.95, hz + hr * 0.2), mat("glass", (0.1, 0.1, 0.1), 0.2, 0.3), (PI / 2, 0, 0), 16, 6)); out.append(torus(0.05, 0.012, (-0.12, hr * 0.95, hz + hr * 0.2), mat("glass", (0.1, 0.1, 0.1), 0.2, 0.3), (PI / 2, 0, 0), 16, 6))   # alert: glasses
        return out
    return figure("ape", (0.4, 0.26, 0.18), extra=ex, head_r=0.33, body_r=0.28)

def pig():
    def ex(parts, hz, hr, br):
        pink = mat("pigBody", (0.98, 0.72, 0.78), 0, 0.5); out = [cyl(hr * 0.26, hr * 0.22, (0, hr * 0.98, hz - hr * 0.15), pink, seg=20, rot=(PI / 2, 0, 0))]
        for s in (-1, 1): out.append(sphere(0.03, (s * 0.05, hr * 1.1, hz - hr * 0.15), ink(), 8, 6)); out.append(cone(hr * 0.2, hr * 0.35, (s * hr * 0.6, -hr * 0.1, hz + hr * 0.8), pink, 10, (0.3, 0, s * -0.3)))
        out.append(tube([Vector((0, -br * 0.9, 0.5)), Vector((0.08, -br * 1.2, 0.56)), Vector((-0.04, -br * 1.35, 0.5)), Vector((0.06, -br * 1.45, 0.58))], 0.025, pink, name="tail"))
        return out
    return figure("pig", (0.98, 0.72, 0.78), extra=ex, head_r=0.34)

def eagle():
    def ex(parts, hz, hr, br):
        brown = mat("eagleBody", (0.35, 0.22, 0.12), 0, 0.6); out = [cone(0.07, 0.2, (0, hr * 0.98, hz - hr * 0.05), mat("beak", (0.95, 0.72, 0.15), 0, 0.4), 10, (PI / 2, 0, 0))]
        for s in (-1, 1):
            w = sphere(0.5, (s * br * 1.5, -0.05, 0.36 + br * 1.1), brown, 16, 10, (1.2, 0.5, 0.35)); out.append(w)
        return out
    return figure("eagle", (0.35, 0.22, 0.12), head_col=(0.95, 0.93, 0.88), extra=ex, iris=(0.95, 0.7, 0.1), head_r=0.3)

def panther():
    def ex(parts, hz, hr, br):
        blk = mat("pantherBody", (0.12, 0.1, 0.16), 0, 0.5); out = []
        for s in (-1, 1): out.append(cone(hr * 0.24, hr * 0.42, (s * hr * 0.55, 0, hz + hr * 0.85), blk, 10))
        out.append(torus(hr * 1.02, 0.04, (0, 0, hz + hr * 0.5), mat("phones", PURPLE, 0.2, 0.4), (0, PI / 2, 0), 32, 8))   # the headphones
        for s in (-1, 1): out.append(cyl(0.11, 0.08, (s * hr * 1.0, 0, hz), mat("phones", PURPLE, 0.2, 0.4), seg=16, rot=(0, PI / 2, 0)))
        out.append(tube([Vector((0, -br * 0.9, 0.5)), Vector((0.15, -br * 1.6, 0.6)), Vector((0.3, -br * 1.9, 1.0))], 0.04, blk, name="tail"))
        return out
    return figure("panther", (0.12, 0.1, 0.16), extra=ex, iris=(0.95, 0.75, 0.2), head_r=0.32)

def worm():
    """tough to beat a worm from the dirt: a worm wearing a hard hat, out of a mound"""
    pink = mat("wormBody", (0.95, 0.6, 0.55), 0, 0.5); dirt = mat("dirt", (0.35, 0.24, 0.14), 0, 0.9)
    parts = [sphere(0.5, (0, 0, 0.1), dirt, 24, 12, (1.3, 1.1, 0.45))]
    body = tube([Vector((0, 0.1, 0.1)), Vector((0.05, 0.05, 0.5)), Vector((-0.08, -0.05, 0.9)), Vector((0.02, 0.05, 1.25))], 0.17, pink, seg=16, name="worm"); parts.append(body)
    head = sphere(0.24, (0.02, 0.08, 1.35), pink, 24, 16); parts.append(head)
    eyes(parts, 0.25, 1.42, 0.09, 0.055); smile(parts, 0.3, 1.28, 0.1)
    parts.append(cyl(0.22, 0.1, (0.02, 0.05, 1.58), mat("hat", GOLD, 0, 0.4), seg=24)); parts.append(sphere(0.2, (0.02, 0.05, 1.6), mat("hat", GOLD, 0, 0.4), 16, 10, (1, 1, 0.6)))
    for p in parts: K.smooth(p)
    return join(parts + outline(parts), "worm")

ASSETS = dict(panda=panda, elephant=elephant, gorilla=gorilla, goat=goat, blackcat=blackcat, bee=bee, ant=ant, alien=alien, ape=ape, pig=pig, eagle=eagle, panther=panther, worm=worm)
only = K.args[K.args.index("--only") + 1].split(",") if "--only" in K.args else list(ASSETS)
for name in only:
    clear(); ASSETS[name]()
    # the outline is an inverted hull: it must cull its front faces, or glTF exports it double sided and it swallows the figure
    for m in D.materials: m.use_backface_culling = True
    export("vf_" + name)
