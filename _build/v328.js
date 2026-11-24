/* ================================================================
   v328 FRAME RATE: A LEANER PAINTING (2026-11-24)
   The anamorphic eye (v253) laid an overlay on up to 340 surfaces, so standing near the bodega block cost hundreds of
   extra draws. It now paints the 170 nearest surfaces bigger than 30 cm across (skipping hinges, cans and fruit, which
   carried a speck of paint nobody could see), and the eye still closes from its footprints.
   ================================================================ */
window.__ANA2 = { cap: 170 };
