# Blender -b -P far_lod.py : sculpt/*.gltf.json -> sculpt_far/*.glb at about 8k triangles, textures 512 (v401)
import bpy, os, sys, shutil, tempfile
SRC = '/Users/degens/Desktop/NEW YORKERS BY MLOW/MEME ISLAND 2026-10-07/site/assets/sculpt'
DST = '/Users/degens/Desktop/NEW YORKERS BY MLOW/MEME ISLAND 2026-10-07/site/assets/sculpt_far'
TARGET = 8000
tmp = tempfile.mkdtemp()
for f in sorted(os.listdir(SRC)):
    if not f.endswith('.gltf.json'): continue
    key = f[:-10]; out = os.path.join(DST, key + '.glb')
    if os.path.exists(out): continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    p = os.path.join(tmp, key + '.gltf'); shutil.copy(os.path.join(SRC, f), p)
    try: bpy.ops.import_scene.gltf(filepath=p)
    except Exception as e: print('FAIL import', key, e); continue
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    tris = sum(sum(len(pl.vertices) - 2 for pl in o.data.polygons) for o in meshes)
    r = min(1.0, TARGET / max(1, tris))
    for o in meshes:
        if r < 1.0:
            m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = r
            bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='dec')
    for im in bpy.data.images:
        if im.size[0] > 512: im.scale(512, max(1, int(512 * im.size[1] / im.size[0])))
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=80)
    print('OK', key, tris, '->', round(tris * r), os.path.getsize(out) // 1024, 'KB')
