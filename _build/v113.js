/* ================================================================
   v113 THE LIGHT PROBE REBAKE (2026-11-23)
   The island's reflections and soft sky light come from a light probe baked from the sky photographs. Until now it
   had no sun in it, so metal, glass, water and car paint reflected an even sky at every hour. The sun is now baked
   into the probe where it really is (a hot core and a wide warm glow, coloured by the sun's height: white at noon,
   amber at golden hour, rose at the horizon), and the probe rebakes whenever the sun moves two and a half degrees,
   not only when the weather changes. Golden hour reads as golden on every surface; noon gets crisp highlights.
   The grade follows: a touch more warmth in the highlights at golden hour and a cool lift at blue hour.
   ================================================================ */
window.__ENVSUN = c => {
  if (!SKY.sun || SKY.sun.el < -3 || !c.createRadialGradient) return; const az = SKY.sun.az * PI / 180, el = SKY.sun.el * PI / 180;
  const dx = Math.cos(el) * Math.sin(az), dy = Math.sin(el), dz = -Math.cos(el) * Math.cos(az); const u = Math.atan2(dz, dx) / (2 * PI) + 0.5, v = Math.asin(Math.max(-1, Math.min(1, dy))) / PI + 0.5;
  const x = u * 512, y = (1 - v) * 256, e = SKY.sun.el, warm = Math.max(0, Math.min(1, 1 - e / 25)), clouds = Math.min(1, (WX.wet || 0) * 1.5 + (WX.cur === 'CLOUDY' || WX.cur === 'OVERCAST' ? 0.6 : 0));
  const col = [255, Math.round(250 - 70 * warm), Math.round(235 - 140 * warm)], a = (1 - clouds * 0.85) * Math.min(1, (e + 3) / 6);
  [[60, 0.35], [18, 0.9], [6, 1]].forEach(([r, k]) => { for (const off of [0, -512, 512]) { const g = c.createRadialGradient(x + off, y, 0, x + off, y, r); g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a * k})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`); c.fillStyle = g; c.fillRect(x + off - r, y - r, r * 2, r * 2); } });
};
(function rebakeNow() { try { updateEnv(0, true); } catch (e) { } })();
window.__GRADE = u => {
  const e = (SKY.sun && SKY.sun.el) || 0;
  const golden = Math.max(0, 1 - Math.abs(e - 5) / 9), blue = Math.max(0, 1 - Math.abs(e + 5) / 4);
  u.uGain.value.r *= 1 + 0.035 * golden; u.uGain.value.b *= 1 - 0.04 * golden; u.uLift.value.b *= 1 + 0.06 * blue; u.uLift.value.r *= 1 - 0.03 * blue;
};
