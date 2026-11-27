# load posed people (people.py npz) into Blender meshes with a 'part' attribute
import bpy, numpy as np, os
def person_mesh(path, name=None):
    d = np.load(path); v, part, lens, flat = d['v'], d['part'], d['lens'], d['flat']
    me = bpy.data.meshes.new(name or os.path.basename(path)[:-4]); me.vertices.add(len(v)); me.vertices.foreach_set('co', v.ravel())
    me.loops.add(len(flat)); me.loops.foreach_set('vertex_index', flat); me.polygons.add(len(lens))
    starts = np.concatenate([[0], np.cumsum(lens)[:-1]]); me.polygons.foreach_set('loop_start', starts); me.update()
    a = me.attributes.new('part', 'FLOAT', 'POINT'); a.data.foreach_set('value', part.astype(np.float32))
    if 'rest' in d.files: r = me.attributes.new('rest', 'FLOAT_VECTOR', 'POINT'); r.data.foreach_set('vector', d['rest'].astype(np.float32).ravel())
    me.shade_smooth(); return me

def garment_mesh(path, name=None):
    """people pass: the clothes shell (g_*) of a people.py npz, or None for an old bake"""
    d = np.load(path)
    if 'g_v' not in d.files or not len(d['g_lens']): return None
    v, part, lens, flat = d['g_v'], d['g_part'], d['g_lens'], d['g_flat']
    me = bpy.data.meshes.new((name or os.path.basename(path)[:-4]) + '_cloth'); me.vertices.add(len(v)); me.vertices.foreach_set('co', v.ravel())
    me.loops.add(len(flat)); me.loops.foreach_set('vertex_index', flat); me.polygons.add(len(lens))
    starts = np.concatenate([[0], np.cumsum(lens)[:-1]]); me.polygons.foreach_set('loop_start', starts); me.update()
    a = me.attributes.new('part', 'FLOAT', 'POINT'); a.data.foreach_set('value', part.astype(np.float32))
    r = me.attributes.new('rest', 'FLOAT_VECTOR', 'POINT'); r.data.foreach_set('vector', d['g_rest'].astype(np.float32).ravel())
    me.shade_smooth(); return me
