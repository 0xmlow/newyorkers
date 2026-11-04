"""sheet.py: render every GLB in a folder from the front with Workbench, then tile them. Blender -b -P sheet.py -- <dir> <out.jpg>"""
import bpy, os, sys, math
args = sys.argv[sys.argv.index("--") + 1:]; SRC, OUT = os.path.abspath(args[0]), os.path.abspath(args[1])
tmp = os.path.join(SRC, "_sheet"); os.makedirs(tmp, exist_ok=True)
files = sorted(f for f in os.listdir(SRC) if f.endswith(".glb"))
for f in files:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, f))
    sc = bpy.context.scene; sc.render.engine = "BLENDER_WORKBENCH"; sc.display.shading.light = "STUDIO"; sc.display.shading.color_type = "MATERIAL"; sc.display.shading.show_backface_culling = True
    sc.render.resolution_x = 480; sc.render.resolution_y = 600; sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.92, 0.9, 0.86)
    cam = bpy.data.cameras.new("c"); co = bpy.data.objects.new("c", cam); sc.collection.objects.link(co); sc.camera = co
    co.location = (0.0, -5.2, 1.1); co.rotation_euler = (math.radians(84), 0, 0); cam.lens = 60
    sc.render.filepath = os.path.join(tmp, f[:-4] + ".png"); bpy.ops.render.render(write_still=True)
from PIL import Image
ims = [Image.open(os.path.join(tmp, f[:-4] + ".png")).convert("RGB") for f in files]
cols = 5; rows = (len(ims) + cols - 1) // cols; sheet = Image.new("RGB", (480 * cols, 600 * rows), "white")
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 480, (i // cols) * 600))
sheet.save(OUT, quality=85); print("sheet", OUT, len(ims))
