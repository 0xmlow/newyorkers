"""crowd_pass.py: turn the cast we already generated (the Tripo NEW YORKERS) into light crowd characters.

MLow, 2026-10-28: the whole character, its own sculpted eye flower head included; no sprite flower on top. Each one is
decimated whole, turned so its front is three.js +Z, centred on its feet, and written in metres (standing 1.88 m to the
top of its flower, so a hat the sets put at about 1.9 m still sits on it; seated poses at their own height). Parts:
  crowd_<name>       about 3,000 tris, 512 px texture, for extras
  crowd_<name>_lite  300 tris, 256 px, for big instanced crowds (VeeCon in CLOUDS AND DIRT)
Then `python3 _build/draco.py crowd_<name> ...` compresses them like every other model.

  Blender -b -P _build/crowd_pass.py -- name:yaw:height,...
    yaw in degrees (the turn that brings the front to +Z, read off four view renders), height in metres.
    Defaults: -90, 1.88.

Written 2026-10-28 for the crowd trial (src/crowd.js), widened the same day, and made whole on MLow's note.
"""
import bpy, os, sys, math
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "work", "glb_pass"); OUT = SRC
PARTS = {"": (3000, 512), "_lite": (300, 256)}   # lite 380 to 300 on 2026-10-28: the VeeCon crowd on a phone (V1) was +32 percent at 380

def load(name, yaw, height):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name + ".glb"))
    ms = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in ms: o.select_set(True)
    bpy.context.view_layer.objects.active = ms[0]
    if len(ms) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.data.transform(Matrix.Rotation(math.radians(yaw), 4, "Z"))
    vs = [v.co for v in ob.data.vertices]
    off = Vector(((min(v.x for v in vs) + max(v.x for v in vs)) / 2, (min(v.y for v in vs) + max(v.y for v in vs)) / 2, min(v.z for v in vs)))
    H = max(v.z for v in vs) - off.z
    ob.data.transform(Matrix.Translation(-off)); ob.data.transform(Matrix.Scale(height / H, 4))
    for o in list(bpy.context.scene.objects):
        if o != ob: bpy.data.objects.remove(o)
    return ob

for job in sys.argv[sys.argv.index("--") + 1].split(","):
    f = job.split(":") + [""] * 3
    name = f[0]; yaw = float(f[1] or -90); height = float(f[2] or 1.88)
    for suffix, (target, tex) in PARTS.items():
        ob = load(name, yaw, height)
        tris = now = sum(len(p.vertices) - 2 for p in ob.data.polygons)
        for _ in range(6):   # one collapse can stall short of a small target; go again until it lands
            if now <= target * 1.03: break
            m = ob.modifiers.new("dec", "DECIMATE"); m.ratio = target / now
            bpy.context.view_layer.objects.active = ob; bpy.ops.object.modifier_apply(modifier="dec")
            was, now = now, sum(len(p.vertices) - 2 for p in ob.data.polygons)
            if now > was * 0.97: break
        for img in bpy.data.images:
            if img.size[0] > tex or img.size[1] > tex:
                s = tex / max(img.size[0], img.size[1]); img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))
        out = os.path.join(OUT, f"crowd_{name}{suffix}.glb")
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=82)
        print(f"CROWD {name}{suffix}: {tris} to {now} tris, {height:.2f} m, {os.path.getsize(out) // 1024} KB")
