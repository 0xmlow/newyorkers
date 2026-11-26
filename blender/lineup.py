import bpy, sys, os, glob, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_people import person_mesh
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
m = bpy.data.materials.new('p'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'part'; cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'
cols = [(0.8, 0.55, 0.4, 1), (0.1, 0.3, 0.9, 1), (0.15, 0.15, 0.15, 1), (0.9, 0.9, 0.9, 1), (0.3, 0.15, 0.05, 1), (0.9, 0.2, 0.2, 1)]
mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'DIVIDE'; mth.inputs[1].default_value = 6
nt.links.new(at.outputs['Fac'], mth.inputs[0]); nt.links.new(mth.outputs[0], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
el = cr.color_ramp.elements; el[0].color = cols[0]; el[1].position = (5 - 0.5) / 6; el[1].color = cols[5]
for i in range(1, 5): e = el.new((i - 0.5) / 6); e.color = cols[i]
fs = sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'work', 'pose_m_*.npz')))
for i, f in enumerate(fs):
    o = bpy.data.objects.new(os.path.basename(f), person_mesh(f)); o.data.materials.append(m); sc.collection.objects.link(o); o.location = ((i % 8) * 1.2, 0, -(i // 8) * 2.6)
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); cam.location = (4.2, -14, -1.6); cam.rotation_euler = (math.radians(90), 0, 0); cam.data.type = 'ORTHO'; cam.data.ortho_scale = 10.5; sc.camera = cam
side = cam.copy(); 
l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'SUN')); l.data.energy = 3; l.rotation_euler = (0.8, 0.2, 0.5); sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 1600, 1000
sc.render.filepath = sys.argv[-1]; bpy.ops.render.render(write_still=True)
cam.location = (4.2 + 14, 0, -1.6); cam.rotation_euler = (math.radians(90), 0, math.radians(90)); sc.render.filepath = sys.argv[-1].replace('.png', '_side.png'); bpy.ops.render.render(write_still=True)
