"""Blender: render each GLB straight on from three.js +Z (Blender -Y) and from above, to read which way Tripo faced it."""
import bpy, os, sys, math, glob
from mathutils import Vector
a = sys.argv[sys.argv.index("--") + 1:]; SRC, OUT = a[0], a[1]; os.makedirs(OUT, exist_ok=True)
for p in sorted(glob.glob(os.path.join(SRC, "*.glb"))):
    n = os.path.basename(p)[:-4]
    for view in ("front", "top"):
        bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=p)
        lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
        for o in bpy.context.scene.objects:
            if o.type == "MESH":
                for b in o.bound_box: w = o.matrix_world @ Vector(b); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
        c = (lo + hi) / 2; s = (hi - lo).length
        cam = bpy.data.objects.new("c", bpy.data.cameras.new("c")); bpy.context.collection.objects.link(cam)
        cam.location = c + (Vector((0, -s * 1.6, 0)) if view == "front" else Vector((0, -0.001, s * 1.6)))
        cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = cam
        sc = bpy.context.scene; sc.render.engine = "BLENDER_WORKBENCH"; sc.display.shading.light = "STUDIO"; sc.display.shading.color_type = "TEXTURE"
        sc.render.resolution_x = sc.render.resolution_y = 256; sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.9, 0.9, 0.9)
        sc.render.filepath = os.path.join(OUT, f"{n}_{view}.png"); bpy.ops.render.render(write_still=True)
