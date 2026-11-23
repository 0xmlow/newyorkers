/* ================================================================
   v166 THE LOOK: LIGHT (2026-11-23)
   MLow: "huge upgrades to make this look really great and really premium". The island was lit evenly from every
   direction: the light probe is painted from the bright panorama, below the horizon included, so every surface
   got the same flat fill and nothing had shape. This pass relights it like a photograph:
   - the probe keeps its sky but its lower half (the ground bounce) goes dark, so undersides and shadow sides fall off;
   - the sun gets stronger and the sky fill weaker, so shadows have weight and sunlit faces glow;
   - the peach haze that filled the middle distance becomes thin aerial perspective, pushed far out and tinted by the sky;
   - a filmic grade: an S curve, cool shadows and warm highlights at golden hour, a deeper vignette;
   - night is night: dark blue ambient, the lamps and windows carry the island.
   Every number lives in window.__LOOK so it can be tuned live.
   ================================================================ */
const LOOK = window.__LOOK = { envGround: 0.45, envSky: 0.95, curve: 0.32, sat: 1.06, vig: 0.42, split: 0.05, on: !/look=0/.test(location.search) };
(function lookLight() {
  if (!LOOK.on) return;
  const P2 = { golden: { sun: 0xffb36b, sunI: 2.35, sky: 0xa8bcd6, gnd: 0x4a3c30, hemiI: 0.42, fog: 0xc6bcb4, near: 240, far: 1500, exp: 1.2, sea: 0x163640 },
    day: { sun: 0xfff3e2, sunI: 2.55, sky: 0xb4cce8, gnd: 0x5a5040, hemiI: 0.45, fog: 0xbcd0e2, near: 300, far: 1800, exp: 1.04, sea: 0x1a4654 },
    dawn: { sun: 0xff8f62, sunI: 1.5, sky: 0xc8a8c4, gnd: 0x3a3038, hemiI: 0.45, fog: 0xc2a2a6, near: 220, far: 1300, exp: 1.15, sea: 0x1e3448 },
    night: { sun: 0x8ea4dc, sunI: 0.32, sky: 0x2c4272, gnd: 0x12161f, hemiI: 0.46, fog: 0x0b111e, near: 140, far: 1000, exp: 1.12, sea: 0x061220, lamps: 1, pano: 0x2a3466 } };
  for (const k in P2) { Object.assign(PRESETS[k], P2[k]); COLOR_KEYS.forEach(c => { if (PCOL[k] && PCOL[k][c] && P2[k][c] !== undefined) PCOL[k][c].set(P2[k][c]); }); }
  // the probe: keep the sky, darken the ground bounce (drawn before v113 paints the sun in)
  const prevSun = window.__ENVSUN; window.__ENVSUN = c => { try { const H = c.canvas.height, W = c.canvas.width, g = c.createLinearGradient(0, 0, 0, H); const sk = 1 - LOOK.envSky, gr = 1 - LOOK.envGround;
      g.addColorStop(0, `rgba(0,0,0,${sk})`); g.addColorStop(0.46, `rgba(0,0,0,${sk})`); g.addColorStop(0.54, `rgba(0,0,0,${gr * 0.8})`); g.addColorStop(1, `rgba(0,0,0,${gr})`); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, W, H); } catch (e) { } if (prevSun) prevSun(c); };
  try { updateEnv(0, true); } catch (e) { }
  // the grade
  const prevG = window.__GRADE; window.__GRADE = u => { if (prevG) prevG(u); u.uCurve.value = LOOK.curve; u.uSat.value = LOOK.sat; u.uVig.value = LOOK.vig;
    const gold = SKY.w ? SKY.w.x + SKY.w.y * 0.6 : 0, s = LOOK.split * (0.4 + gold); u.uLift.value.r *= 1 - s; u.uLift.value.b *= 1 + s * 0.8; u.uGain.value.r *= 1 + s * 0.6; u.uGain.value.b *= 1 - s * 0.7; };
})();
