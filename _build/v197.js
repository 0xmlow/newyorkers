/* ================================================================
   v197 THE LOOK: SHADOW FILL (2026-11-23)
   v166 took the fill light down hard for contrast, and in the long autumn shadows (the pier behind the docked
   ferry, the foot of the walk up, under the market roofs) dark materials went almost black. Real shade on a
   clear day is lit by the whole blue sky. The sky fill comes back up a fifth by day, at golden hour and at dawn,
   and the ground half of the light probe a little, so shade reads as shade, with colour and texture, not as
   holes. Night is untouched. ?fill=0 off.
   ================================================================ */
(function shadowFill() {
  if (!LOOK.on || /fill=0/.test(location.search)) return;
  try { PRESETS.day.hemiI = 0.56; PRESETS.golden.hemiI = 0.53; PRESETS.dawn.hemiI = 0.53; LOOK.envGround = 0.56; } catch (e) { }
})();
