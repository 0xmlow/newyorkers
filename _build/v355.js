/* ================================================================
   v355 THE MAP: SATURDAY (2026-11-24)
   The stoop sale and the birthday go on the island map.
   ================================================================ */
(function mapSat() { if (!window.__MAP || !MAP.places) return; try { const [x, , z] = SALE.P; MAP.places.push(['THE STOOP SALE', x, z, x - 4, z]); } catch (e) { } try { const [x, , z] = BDAY.P; MAP.places.push(['THE BIRTHDAY', x, z, x + 3, z + 3]); } catch (e) { } })();
