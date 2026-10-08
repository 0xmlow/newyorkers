/* in-page capture helpers for stills and the film: deterministic frames, no rAF dependence */
window.__cap = {
  async boot(w, h) {
    const g = window.__game; await new Promise(r => { const t = setInterval(() => { if (!document.getElementById('go').disabled && window.__fontsReady) { clearInterval(t); r(); } }, 200); });
    document.getElementById('go').click(); g.state.started = true; window.__pauseLoop = true;
    ['hud', 'taskbar', 'toasts', 'cross', 'aim', 'prompt', 'startmenu', 'cc', 'dlg'].forEach(i => { const e = document.getElementById(i); if (e) e.style.visibility = 'hidden'; });
    this.size(w, h); g.SCL.range = 9999; return { gl: (() => { const gl = g.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'; })() };
  },
  size(w, h) { const g = window.__game; window.__lockSize = true; g.renderer.setPixelRatio(1); g.renderer.setSize(w, h, false); g.camera.aspect = w / h; g.camera.updateProjectionMatrix(); if (g.POST.comp) g.POST.comp.setSize(w, h); },
  async loadAll() { const g = window.__game; for (let i = 0; i < 400; i++) { g.step(1 / 60, 1); if (g.MODELS.every(s => s.state === 'ready' || s.state === 'error')) break; await new Promise(r => setTimeout(r, 120)); } return g.MODELS.filter(s => s.state === 'ready').length + '/' + g.MODELS.length; },
  prep(js) { (new Function('g', js))(window.__game); },
  settle(n) { window.__game.step(1 / 60, n || 60); },
  railAt(i, u) { const g = window.__game, r = g.TOUR[i]; g.playRail(Object.assign({}, r, { done: null })); const f = Math.max(1, Math.round(u * r.dur * 60)); g.step(r.dur / Math.max(1, Math.round(r.dur * 60)), f); return r.name; },
  at(x, y, z, yaw, pitch) { const g = window.__game; g.RAIL.on = false; g.P.x = x; g.P.y = y; g.P.z = z; g.P.yaw = yaw; g.P.pitch = pitch || 0; g.step(1 / 60, 2); },
  grab(q) { return window.__game.renderer.domElement.toDataURL('image/jpeg', q || 0.92); }
};
