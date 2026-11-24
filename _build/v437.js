/* ================================================================
   v437 THE LOOK: A COAST, NOT A TARGET (2026-11-24)
   From the air the island still read as a bullseye: the white water at the waterline was drawn on a perfect circle
   at one radius, while the sand seen through the clear shallows ran on past it in a ragged edge, so a thin white
   ring floated a few metres off a beach that did not touch it. The waterline foam now follows a coast: its radius
   wanders in and out in coves and points (three long swells of the angle, never a circle), it breaks into patches
   of surf and slack water, and the shallows lose their glass clarity faster, so the sea goes from wet sand to
   bottle green to deep slate in the first twenty metres instead of forty, which is how New York Harbour looks
   off a real beach. ?coast=0 off.
   ================================================================ */
(function lookCoast() {
  if (!LOOK.on || /coast=0/.test(location.search)) return;
  const prev = MAT.water.onBeforeCompile;
  MAT.water.onBeforeCompile = sh => { prev(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('float oShallow = 1.0 - smoothstep(uShore - 4.0, uShore + 38.0, oR);', 'float oShallow = 1.0 - smoothstep(uShore - 4.0, uShore + 21.0, oR);')
      .replace('mix(diffuseColor.a, 0.62, oShallow)', 'mix(diffuseColor.a, 0.84, oShallow)')
      .replace('float oRoll = pow(1.0 - fract(oOut / 11.0', 'float oRoll = smoothstep(-0.2, 0.6, sin(oAng * 13.0 + oBig * 4.0)) * pow(1.0 - fract((oOut - oCove * 0.8) / 11.0')
      .replace('float oLine = smoothstep(1.8, 0.0, abs(oR - (uShore - 2.2 + oSwash',
        'float oCove = 2.6 * sin(oAng * 3.0 + 1.3) + 1.7 * sin(oAng * 7.0 - 0.7) + 0.9 * sin(oAng * 17.0 + 2.1);\n      float oLine = smoothstep(0.9, 1.7, oBig * 1.4 + 0.55 * sin(oAng * 29.0 + uTime * 0.05)) * smoothstep(1.8, 0.0, abs(oR - oCove - (uShore - 2.2 + oSwash');
  };
  MAT.water.customProgramCacheKey = () => 'mi-ocean-v437'; MAT.water.needsUpdate = true;
})();
