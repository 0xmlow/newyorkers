"""Render every GLB in a folder with Workbench and tile them into one PNG so the kit can be checked at a glance."""
import bpy, os, sys, math, glob
from mathutils import Vector
args = sys.argv[sys.argv.index("--") + 1:]
SRC = os.path.abspath(args[0]); OUT = os.path.abspath(args[1]); os.makedirs(OUT, exist_ok=True)
names = [os.path.basename(p)[:-4] for p in sorted(glob.glob(os.path.join(SRC, "*.glb")))]
if len(args) > 2: names = [n for n in names if n in args[2].split(",")]
for name in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name + ".glb"))
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in objs:
        for b in o.bound_box:
            w = o.matrix_world @ Vector(b); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    c = (lo + hi) / 2; size = max((hi - lo).length, 0.1)
    cam = bpy.data.cameras.new("c"); co = bpy.data.objects.new("c", cam); bpy.context.collection.objects.link(co)
    d = size * 1.1; co.location = c + Vector((d * 0.8, -d * 0.9, d * 0.55)); co.rotation_euler = (math.radians(63), 0, math.radians(41.5))
    direction = c - co.location; co.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = co
    sc = bpy.context.scene; sc.render.engine = "BLENDER_WORKBENCH"; sc.display.shading.light = "STUDIO"; sc.display.shading.color_type = "MATERIAL"; sc.display.shading.show_shadows = True
    sc.render.resolution_x = sc.render.resolution_y = 360; sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.86, 0.88, 0.9)
    sc.render.filepath = os.path.join(OUT, name + ".png"); bpy.ops.render.render(write_still=True)
print("rendered", len(names))
