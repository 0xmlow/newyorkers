/* ================================================================
   v365 THE OBSCURA AT NIGHT (2026-11-24)
   At night the obscura shows the harbour at night: the El's lights, the ferry, the moon on the water. Nothing to
   change; this version only lets the pinhole camera see past the sky dome so the moon shows.
   ================================================================ */
(function () { if (window.__OBS && OBS.cam) { OBS.cam.far = 2000; OBS.cam.updateProjectionMatrix(); } })();
