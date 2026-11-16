"""analyse.py: cross-section profile of a cast figure (helper for rig_pass.py, importable from Blender).

Cuts the mesh with horizontal planes, rasterises each contour into a 4 mm grid and labels the connected pieces, so we
can see where the legs part, where the neck is narrowest and where the arms leave the body.
"""
import numpy as np
from collections import deque

def tris_of(ob):
    me = ob.data; me.calc_loop_triangles()
    V = np.array([v.co[:] for v in me.vertices]); T = np.array([t.vertices[:] for t in me.loop_triangles])
    return V, T

def slice_parts(V, T, z, cell):
    P = V[T]                                   # (n,3,3)
    zs = P[:, :, 2]; m = (zs.min(1) < z) & (zs.max(1) > z); P = P[m]
    if not len(P): return []
    pts = []
    for a, b in ((0, 1), (1, 2), (2, 0)):
        A, B = P[:, a], P[:, b]; za, zb = A[:, 2], B[:, 2]
        c = (za - z) * (zb - z) < 0
        t = (z - za[c]) / (zb[c] - za[c]); pts.append((A[c] + (B[c] - A[c]) * t[:, None])[:, :2])
    seg = np.concatenate(pts)                  # pairs are not kept; densify by sampling each triangle's crossing pair
    # rebuild pairs: each crossing triangle gives exactly two edge hits; recompute in a pairwise way
    out = []
    for tri in P:
        hits = []
        for a, b in ((0, 1), (1, 2), (2, 0)):
            za, zb = tri[a, 2], tri[b, 2]
            if (za - z) * (zb - z) < 0:
                t = (z - za) / (zb - za); hits.append(tri[a, :2] + (tri[b, :2] - tri[a, :2]) * t)
        if len(hits) == 2:
            n = max(2, int(np.linalg.norm(hits[1] - hits[0]) / (cell * 0.5)) + 1)
            for s in np.linspace(0, 1, n): out.append(hits[0] + (hits[1] - hits[0]) * s)
    if not out: return []
    Q = np.array(out); ij = np.floor(Q / cell).astype(int)
    cells = {}
    for k, key in enumerate(map(tuple, ij)): cells.setdefault(key, []).append(k)
    seen = set(); parts = []
    for c0 in cells:
        if c0 in seen: continue
        comp = []; dq = deque([c0]); seen.add(c0)
        while dq:
            c = dq.popleft(); comp.append(c)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nb = (c[0] + dx, c[1] + dy)
                    if nb in cells and nb not in seen: seen.add(nb); dq.append(nb)
        idx = [k for c in comp for k in cells[c]]; q = Q[idx]
        parts.append({"c": q.mean(0), "lo": q.min(0), "hi": q.max(0), "n": len(comp)})
    # a contour inside another (lining, inner shell) belongs to it
    parts.sort(key=lambda p: -p["n"]); keep = []
    for p in parts:
        if any((p["lo"] >= k["lo"] - cell).all() and (p["hi"] <= k["hi"] + cell).all() for k in keep): continue
        keep.append(p)
    return keep

def profile(V, T, H, step=0.01, cell=None):
    cell = cell or H * 0.004
    return [(f, slice_parts(V, T, f * H, cell)) for f in np.arange(0.02, 0.995, step)]
