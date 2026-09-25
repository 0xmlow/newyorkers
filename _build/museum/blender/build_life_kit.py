"""THE MUSEUM life kit: animals and figures the rooms keep needing and primitives do badly, built headless in Blender
and exported as small flat material GLBs, in the same lane as the institution kit.

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python build_life_kit.py -- --out ../../../assets/museum/props [--only sealion,koi]

Conventions (same as build_institution_kit.py): metres, Z up in Blender, the head or nose toward Blender +Y, which the
+Y up export turns into glTF -Z, the direction three.js lookAt and k.rider treat as forward. kit.prop() rescales by
height at placement. Flat principled materials only, no textures, so every file stays well under 100 KB.

Assets: sealion (hauled out, chest up), sealion_swim (streamlined), koi, turtle, swan, pigeon, gull (wings spread),
dog (a medium dog standing), nutcracker (a lawn size toy soldier).
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_institution_kit as K  # noqa: E402  (its module level code only parses --out and --only)
from build_institution_kit import mat, cube, cyl, sphere, cone, tube, taper, offset, smooth, bevel, join, clear, export, C  # noqa: E402
from mathutils import Vector  # noqa: E402

PI = math.pi
INK = (0.05, 0.05, 0.05)


def sealion(swim=False):
    skin = mat("sealionSkin", (0.24, 0.19, 0.15), 0, 0.32)
    dark = mat("sealionDark", (0.13, 0.1, 0.08), 0, 0.4)
    ln = 2.2
    body = sphere(1, (0, 0, 0.42), skin, 40, 20, (0.42, ln / 2, 0.4))
    # a narrow tail (t = 0), the thick chest at seven tenths, the shoulders narrowing to the neck (t = 1)
    taper(body, lambda t: 0.25 + 0.75 * (t / 0.7) ** 0.7 if t < 0.7 else 1 - 0.38 * ((t - 0.7) / 0.3) ** 1.5)
    if not swim:
        # hauled out: the front of the body rises, the belly stays on the rock
        offset(body, lambda c: Vector((0, 0, 0.42 * max(0, c.y / (ln / 2)) ** 1.6 - 0.18 * max(0, -c.y / (ln / 2)))))
    lift = 0.86 if not swim else 0.42
    neck = tube([Vector((0, 0.9, lift - 0.06)), Vector((0, 1.08, lift + 0.12)), Vector((0, 1.2, lift + 0.2))], 0.13, skin, name="neck")
    head = sphere(0.165, (0, 1.3, lift + 0.24), skin, 20, 12, (1, 1.3, 0.95))
    muzzle = sphere(0.1, (0, 1.5, lift + 0.18), dark, 12, 8, (1.05, 1.3, 0.8))
    nose = sphere(0.04, (0, 1.63, lift + 0.2), mat("eyeDark", INK, 0, 0.3), 8, 6)
    parts = [body, neck, head, muzzle, nose]
    for s in (-1, 1):
        parts.append(sphere(0.03, (s * 0.11, 1.4, lift + 0.32), mat("eyeDark", INK, 0, 0.3), 8, 6))
        # front flippers: flat, long, angled back and down
        fl = cube(0.16, 0.62, 0.05, (s * 0.44, 0.35, 0.28 if not swim else 0.34), skin, (0, s * -0.55 if not swim else 0, s * -0.35))
        taper(fl, lambda t: 0.45 + 0.55 * (1 - t))
        parts.append(fl)
        # rear flippers, fanned
        rf = cube(0.14, 0.42, 0.04, (s * 0.12, -1.18, 0.22), skin, (0, 0, s * 0.42))
        taper(rf, lambda t: 1.1 - 0.6 * t)
        parts.append(rf)
    for o in (body, neck, head, muzzle): smooth(o)
    return join(parts, "sealion_swim" if swim else "sealion")


def koi():
    white = mat("koiWhite", (0.92, 0.9, 0.86), 0, 0.35)
    orange = mat("koiOrange", (0.95, 0.42, 0.08), 0, 0.4)
    body = sphere(1, (0, 0, 0), white, 32, 16, (0.13, 0.36, 0.15))
    taper(body, lambda t: 0.3 + 0.7 * math.sin(min(1, 0.1 + t * 0.9) * PI) ** 0.7)
    parts = [body]
    # orange patches: flattened spheres sunk into the back
    for (y, z, r) in ((0.12, 0.05, 0.12), (-0.14, 0.04, 0.1), (0.02, -0.06, 0.07)):
        parts.append(sphere(r, (0.02, y, z), orange, 12, 8, (1.1, 1.2, 0.5)))
    tail = cube(0.03, 0.22, 0.2, (0, -0.44, 0), white); taper(tail, lambda t: 0.25 + 0.95 * (1 - t), axis=1); parts.append(tail)
    dorsal = cube(0.02, 0.22, 0.07, (0, -0.02, 0.15), white); taper(dorsal, lambda t: 0.3 + 0.7 * (1 - t), axis=2); parts.append(dorsal)
    for s in (-1, 1):
        pf = cube(0.12, 0.08, 0.015, (s * 0.15, 0.1, -0.05), orange, (0, s * 0.5, s * -0.3)); parts.append(pf)
    parts.append(sphere(0.018, (0.08, 0.31, 0.03), mat("eyeDark", INK, 0, 0.3), 8, 6))
    parts.append(sphere(0.018, (-0.08, 0.31, 0.03), mat("eyeDark", INK, 0, 0.3), 8, 6))
    smooth(body)
    return join(parts, "koi")


def turtle():
    shell = mat("turtleShell", (0.24, 0.3, 0.16), 0, 0.5)
    skin = mat("turtleSkin", (0.36, 0.4, 0.22), 0, 0.6)
    sh = sphere(1, (0, 0, 0.12), shell, 24, 12, (0.24, 0.31, 0.11))
    offset(sh, lambda c: Vector((0, 0, -0.06 * max(0, -c.z) * 8 if c.z < 0 else 0)))
    rim = cyl(0.27, 0.03, (0, 0, 0.06), shell, seg=24)
    taper(rim, lambda t: 1, axis=2)
    head = sphere(0.07, (0, 0.38, 0.1), skin, 12, 8, (1, 1.4, 0.9))
    neck = tube([Vector((0, 0.24, 0.08)), Vector((0, 0.34, 0.1))], 0.05, skin, name="tneck")
    parts = [sh, rim, head, neck]
    for s in (-1, 1):
        for y, a in ((0.2, 0.7), (-0.18, 2.4)):
            leg = cube(0.06, 0.16, 0.035, (s * 0.24, y, 0.03), skin, (0, 0, s * a)); parts.append(leg)
    parts.append(cone(0.03, 0.12, (0, -0.35, 0.05), skin, 6, (PI / 2, 0, 0)))
    for s in (-1, 1): parts.append(sphere(0.012, (s * 0.04, 0.44, 0.13), mat("eyeDark", INK, 0, 0.3), 6, 4))
    smooth(sh); smooth(head)
    return join(parts, "turtle")


def swan():
    white = mat("swanWhite", (0.96, 0.96, 0.94), 0, 0.5)
    body = sphere(1, (0, 0, 0.3), white, 32, 16, (0.36, 0.62, 0.32))
    taper(body, lambda t: 0.5 + 0.5 * math.sin(min(1, 0.2 + t * 0.8) * PI) ** 0.6)
    offset(body, lambda c: Vector((0, 0, 0.2 * max(0, -c.y / 0.62) ** 2)))  # the tail lifts
    for s in (-1, 1):
        w = sphere(1, (s * 0.24, -0.05, 0.42), white, 20, 10, (0.16, 0.42, 0.2)); taper(w, lambda t: 0.4 + 0.6 * math.sin(t * PI) ** 0.5); smooth(w)
    neck = tube([Vector((0, 0.5, 0.42)), Vector((0, 0.72, 0.62)), Vector((0, 0.7, 1.0)), Vector((0, 0.66, 1.3))], 0.075, white, name="sneck")
    head = sphere(0.085, (0, 0.72, 1.36), white, 14, 10, (1, 1.35, 1))
    beak = cone(0.045, 0.16, (0, 0.86, 1.34), mat("swanBeak", (0.9, 0.42, 0.1), 0, 0.5), 8, (PI / 2, 0, 0))
    knob = sphere(0.03, (0, 0.78, 1.38), mat("eyeDark", INK, 0, 0.3), 8, 6)
    smooth(body); smooth(head)
    return join([body, neck, head, beak, knob] + [o for o in C.scene.objects if o.name.startswith("Sphere") and o not in (body, head, knob)], "swan")


def pigeon():
    grey = mat("pigeonGrey", (0.5, 0.5, 0.54), 0, 0.7)
    dark = mat("pigeonDark", (0.28, 0.28, 0.33), 0, 0.7)
    sheen = mat("pigeonSheen", (0.22, 0.42, 0.36), 0.2, 0.35)
    body = sphere(1, (0, 0, 0.13), grey, 20, 10, (0.09, 0.15, 0.09))
    taper(body, lambda t: 0.45 + 0.55 * math.sin(min(1, 0.15 + t * 0.85) * PI) ** 0.6)
    neck = sphere(0.05, (0, 0.11, 0.18), sheen, 12, 8, (1, 1, 1.3))
    head = sphere(0.04, (0, 0.16, 0.24), dark, 12, 8)
    beak = cone(0.012, 0.035, (0, 0.2, 0.235), mat("pigeonBeak", (0.35, 0.3, 0.28), 0, 0.5), 6, (PI / 2, 0, 0))
    tail = cube(0.07, 0.11, 0.012, (0, -0.19, 0.13), dark); taper(tail, lambda t: 0.4 + 0.6 * (1 - t), axis=1)
    parts = [body, neck, head, beak, tail]
    for s in (-1, 1):
        w = cube(0.035, 0.17, 0.012, (s * 0.075, -0.02, 0.15), dark, (0, s * 0.25, 0)); taper(w, lambda t: 0.5 + 0.5 * (1 - t) if t > 0.5 else 1, axis=1); parts.append(w)
        parts.append(cyl(0.005, 0.06, (s * 0.02, 0.0, 0.03), mat("pigeonLeg", (0.7, 0.2, 0.2), 0, 0.6), seg=6))
        parts.append(cube(0.02, 0.035, 0.004, (s * 0.02, 0.012, 0.002), mat("pigeonLeg", (0.7, 0.2, 0.2), 0, 0.6)))
        parts.append(sphere(0.007, (s * 0.03, 0.17, 0.25), mat("eyeDark", INK, 0, 0.3), 6, 4))
    smooth(body); smooth(neck); smooth(head)
    return join(parts, "pigeon")


def gull():
    white = mat("gullWhite", (0.95, 0.95, 0.94), 0, 0.6)
    grey = mat("gullGrey", (0.62, 0.64, 0.66), 0, 0.6)
    black = mat("gullBlack", (0.1, 0.1, 0.1), 0, 0.6)
    body = sphere(1, (0, 0, 0), white, 20, 10, (0.09, 0.26, 0.09))
    taper(body, lambda t: 0.4 + 0.6 * math.sin(min(1, 0.1 + t * 0.9) * PI) ** 0.6)
    head = sphere(0.055, (0, 0.27, 0.03), white, 12, 8, (1, 1.2, 1))
    beak = cone(0.014, 0.07, (0, 0.34, 0.02), mat("gullBeak", (0.9, 0.7, 0.1), 0, 0.5), 6, (PI / 2, 0, 0))
    tail = cube(0.1, 0.12, 0.01, (0, -0.3, 0.01), white); taper(tail, lambda t: 0.5 + 0.5 * (1 - t), axis=1)
    parts = [body, head, beak, tail]
    for s in (-1, 1):
        # wings spread, a slight dihedral, black tips
        w = cube(0.62, 0.2, 0.012, (s * 0.38, 0.0, 0.05), grey, (0, s * -0.12, s * 0.1)); taper(w, lambda t: (0.55 + 0.45 * (1 - t)) if s > 0 else (0.55 + 0.45 * t), axis=0); parts.append(w)
        parts.append(cube(0.1, 0.1, 0.013, (s * 0.7, 0.03, 0.09), black, (0, s * -0.12, s * 0.16)))
        parts.append(sphere(0.008, (s * 0.035, 0.29, 0.05), mat("eyeDark", INK, 0, 0.3), 6, 4))
    smooth(body); smooth(head)
    return join(parts, "gull")


def dog():
    tan = mat("dogTan", (0.62, 0.45, 0.26), 0, 0.75)
    dark = mat("dogDark", (0.22, 0.16, 0.1), 0, 0.7)
    body = sphere(1, (0, 0, 0.5), tan, 24, 12, (0.19, 0.42, 0.21))
    taper(body, lambda t: 0.75 + 0.25 * math.sin(t * PI) ** 0.5)
    neck = tube([Vector((0, 0.34, 0.56)), Vector((0, 0.48, 0.66))], 0.11, tan, name="dneck")
    head = cube(0.2, 0.26, 0.2, (0, 0.6, 0.72), tan); bevel(head, 0.05, 2)
    snout = cube(0.12, 0.16, 0.1, (0, 0.78, 0.66), tan); bevel(snout, 0.03, 2)
    nose = sphere(0.025, (0, 0.87, 0.68), mat("eyeDark", INK, 0, 0.3), 8, 6)
    parts = [body, neck, head, snout, nose]
    for s in (-1, 1):
        parts.append(cube(0.05, 0.1, 0.13, (s * 0.1, 0.55, 0.85), dark, (0.3, s * 0.25, 0)))  # ears
        parts.append(sphere(0.018, (s * 0.06, 0.72, 0.77), mat("eyeDark", INK, 0, 0.3), 6, 4))
        for y in (0.26, -0.26):
            parts.append(tube([Vector((s * 0.12, y, 0.45)), Vector((s * 0.13, y, 0.22)), Vector((s * 0.13, y + 0.02, 0.02))], 0.04, tan, name="dleg"))
            parts.append(cube(0.08, 0.1, 0.04, (s * 0.13, y + 0.02, 0.02), dark))
    parts.append(tube([Vector((0, -0.4, 0.6)), Vector((0, -0.52, 0.72)), Vector((0, -0.56, 0.86))], 0.03, tan, name="dtail"))
    collar = K.torus(0.12, 0.018, (0, 0.44, 0.62), mat("dogCollar", (0.75, 0.12, 0.12), 0, 0.5), rot=(0.7, 0, 0), seg=24, rseg=8); parts.append(collar)
    smooth(body)
    return join(parts, "dog")


def nutcracker():
    red = mat("ncRed", (0.72, 0.08, 0.1), 0, 0.5)
    black = mat("ncBlack", (0.08, 0.08, 0.09), 0, 0.45)
    gold = mat("ncGold", (0.85, 0.68, 0.28), 0.8, 0.3)
    face = mat("ncFace", (0.92, 0.78, 0.66), 0, 0.6)
    white = mat("ncWhite", (0.93, 0.93, 0.9), 0, 0.6)
    blue = mat("ncBlue", (0.12, 0.2, 0.5), 0, 0.5)
    base = cyl(0.55, 0.14, (0, 0, 0.07), black, seg=24)
    parts = [base]
    for s in (-1, 1):
        parts.append(cyl(0.17, 0.5, (s * 0.2, 0, 0.39), black, seg=16))   # boots
        parts.append(cyl(0.15, 0.7, (s * 0.2, 0, 0.99), blue, seg=16))    # trousers
    coat = cyl(0.42, 1.0, (0, 0, 1.84), red, seg=24); parts.append(coat)
    parts.append(K.torus(0.42, 0.04, (0, 0, 1.36), gold, seg=24, rseg=8))
    parts.append(cube(0.1, 0.02, 0.9, (0, 0.42, 1.84), gold))              # the row of buttons as a gold band
    for s in (-1, 1):
        parts.append(cyl(0.11, 0.9, (s * 0.58, 0, 1.86), red, seg=12))     # arms, clear of the coat
        parts.append(sphere(0.12, (s * 0.58, 0, 1.38), white, 12, 8))     # gloves
        parts.append(cube(0.2, 0.16, 0.1, (s * 0.5, 0, 2.34), gold))      # epaulettes
    head = cyl(0.34, 0.62, (0, 0, 2.66), face, seg=24); parts.append(head)
    beard = cube(0.5, 0.2, 0.32, (0, 0.24, 2.46), white); bevel(beard, 0.05, 2); parts.append(beard)
    parts.append(cube(0.22, 0.12, 0.08, (0, 0.34, 2.7), white))            # moustache
    parts.append(cube(0.34, 0.1, 0.06, (0, 0.34, 2.86), white))            # brows
    for s in (-1, 1): parts.append(sphere(0.045, (s * 0.12, 0.33, 2.78), mat("eyeDark", INK, 0, 0.3), 8, 6))
    parts.append(cube(0.1, 0.1, 0.1, (0, 0.36, 2.66), red))                # nose
    hat = cyl(0.36, 0.9, (0, 0, 3.42), black, seg=24); parts.append(hat)
    parts.append(K.torus(0.36, 0.03, (0, 0, 2.98), gold, seg=24, rseg=8))
    parts.append(cube(0.12, 0.04, 0.5, (0, 0.36, 3.5), gold))              # hat plate
    parts.append(cone(0.05, 0.4, (0, 0.22, 4.0), red, 8))                  # plume
    return join(parts, "nutcracker")


ASSETS = {
    "sealion": lambda: sealion(False),
    "sealion_swim": lambda: sealion(True),
    "koi": koi,
    "turtle": turtle,
    "swan": swan,
    "pigeon": pigeon,
    "gull": gull,
    "dog": dog,
    "nutcracker": nutcracker,
}

if __name__ == "__main__":
    print("life kit ->", K.OUT)
    ok, bad = [], []
    for name, fn in ASSETS.items():
        if K.ONLY and name not in K.ONLY:
            continue
        try:
            clear()
            fn()
            export(name)
            ok.append(name)
        except Exception as e:  # noqa: BLE001
            import traceback
            traceback.print_exc()
            bad.append((name, str(e)))
    print(f"built {len(ok)}; failed {len(bad)}", bad)
