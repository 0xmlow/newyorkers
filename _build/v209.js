/* ================================================================
   v209 THE LOOK: ROOMS BEHIND THE WINDOWS (2026-11-23)
   A lit window in New York is a glimpse of a room: a ceiling light, the top of a bookcase, a plant, a lampshade,
   a curtain edge. The lit windows on the rebuilt buildings were flat orange. They now show one of three rooms,
   chosen per window, warm at the ceiling and darker toward the sill. ?rooms=0 off.
   ================================================================ */
(function rooms() {
  if (!FAC_ON || /rooms=0/.test(location.search) || !FACM.lit) return;
  const cv = document.createElement('canvas'); cv.width = 384; cv.height = 192; const c = cv.getContext('2d'); if (!c || !c.fillRect || !c.createLinearGradient) return;
  for (let r = 0; r < 3; r++) { const x0 = r * 128, g = c.createLinearGradient(0, 0, 0, 192); g.addColorStop(0, ['#ffd9a0', '#ffe8c4', '#ffc98a'][r]); g.addColorStop(0.55, ['#e8a868', '#d9b890', '#c88a54'][r]); g.addColorStop(1, '#4a3424'); c.fillStyle = g; c.fillRect(x0, 0, 128, 192);
    c.fillStyle = 'rgba(255,250,230,0.9)'; c.fillRect(x0 + 50, 6, 28, 6);
    c.fillStyle = 'rgba(40,26,16,0.85)';
    if (r === 0) { c.fillRect(x0 + 8, 90, 46, 102); for (let s = 0; s < 4; s++) c.fillRect(x0 + 8, 92 + s * 24, 46, 3); c.fillRect(x0 + 92, 120, 6, 72); if (c.ellipse) { c.beginPath(); c.ellipse(x0 + 95, 112, 16, 22, 0, 0, PI * 2); c.fill(); } }
    if (r === 1) { c.fillRect(x0 + 14, 150, 100, 42); c.fillRect(x0 + 18, 128, 30, 24); c.fillStyle = 'rgba(255,240,200,0.9)'; c.beginPath && (c.beginPath(), c.moveTo(x0 + 86, 100), c.lineTo(x0 + 110, 100), c.lineTo(x0 + 104, 82), c.lineTo(x0 + 92, 82), c.fill()); c.fillStyle = 'rgba(40,26,16,0.85)'; c.fillRect(x0 + 96, 100, 4, 50); }
    if (r === 2) { c.fillStyle = 'rgba(120,40,30,0.55)'; c.fillRect(x0, 0, 26, 192); c.fillRect(x0 + 102, 0, 26, 192); c.fillStyle = 'rgba(40,26,16,0.8)'; c.fillRect(x0 + 40, 60, 48, 36); c.fillStyle = 'rgba(60,140,180,0.6)'; c.fillRect(x0 + 44, 64, 40, 28); } }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const m = FACM.lit; m.emissiveMap = t; m.emissive.setHex(0xffffff); m.color.setHex(0x0e0b08);
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
    #ifdef USE_INSTANCING
      { vec3 ip = instanceMatrix[3].xyz; float h = fract(sin(dot(ip, vec3(12.9898, 78.233, 37.719))) * 43758.5453); vUv.x = vUv.x / 3.0 + floor(h * 3.0) / 3.0; }
    #endif`); };
  m.customProgramCacheKey = () => 'mi-rooms-v209'; m.needsUpdate = true;
})();
