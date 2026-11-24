// audit_walk.js: paste-free walk audit, run in the page by _build/audit.py (headless).
// Floods a 0.2 m grid from the first room's spawn using the gallery's own colliders (player radius 0.32) and reports
// every Mark whose viewing spot (0.9 m in front of it) cannot be reached, and every room whose spawn is cut off.
(() => {
  const C = window.__colliders, R = 0.34, S = 0.2, W = 20, D = 16, N = 7;
  const nx = Math.round(W * N / S), nz = Math.round(D / S), free = new Uint8Array(nx * nz), seen = new Uint8Array(nx * nz);
  const ok = (x, z) => { for (const c of C) { if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + R) return false; continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez; let t = ((x - c.x1) * ex + (z - c.z1) * ez) / L2; t = Math.max(0, Math.min(1, t)); if (Math.hypot(x - c.x1 - ex * t, z - c.z1 - ez * t) < R) return false; } return true; };
  const cx = (i) => (i + 0.5) * S, cz = (j) => -D / 2 + (j + 0.5) * S;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) free[i * nz + j] = ok(cx(i), cz(j)) ? 1 : 0;
  const idx = (x, z) => Math.floor(x / S) * nz + Math.floor((z + D / 2) / S);
  const q = [idx(10, 5.8)]; seen[q[0]] = 1;
  while (q.length) { const k = q.pop(), i = (k / nz) | 0, j = k % nz; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const kk = ii * nz + jj; if (free[kk] && !seen[kk]) { seen[kk] = 1; q.push(kk); } } }
  const near = (x, z) => { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const k = idx(x + a * S, z + b * S); if (seen[k]) return true; } return false; };
  const bad = [], v = new THREE_V();
  function THREE_V() { return { x: 0, y: 0, z: 0 }; }
  for (const m of window.__marks) { const e = m.matrixWorld.elements, nxw = e[8], nzw = e[10], px = e[12], pz = e[14], L = Math.hypot(nxw, nzw) || 1; const x = px + nxw / L * 0.9, z = pz + nzw / L * 0.9; if (!near(x, z)) bad.push(`${m.userData.mark.t} (No. ${m.userData.mark.c}) at ${x.toFixed(1)},${z.toFixed(1)}`); }
  const rooms = []; for (let r = 0; r < N; r++) if (!near(r * W + 10, 5.8)) rooms.push(r);
  let reach = 0; for (let k = 0; k < seen.length; k++) reach += seen[k];
  return { marks: window.__marks.length, unreachable: bad, roomsCut: rooms, reachableM2: +(reach * S * S).toFixed(0) };
})()
