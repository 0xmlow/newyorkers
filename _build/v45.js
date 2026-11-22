/* ================================================================
   v45 THE NEW TOUR (2026-11-22)
   The guided tour (TOUR on the HUD) now stops at everything built since v26: N3W Square and the view from the top,
   the chess tables, FRESH OFF THE PRESS and the live mint vitrine, THE CUT, the Witness on the north rocks with
   THE OBSERVER, a ride alongside the El, the back room under the bodega, and the night harbour where the drones fly.
   ================================================================ */
(function newTour() {
  const g = (x, z) => ground(x, z), sqTop = g(81, 10) + 48.8, br = -9 + 1.6;
  const add = [
    { name: 'n3w square', dur: 9, pos: [[60, 4, 34], [70, 3.2, 22], [74, 3, 16]], look: [[81, 14, 10], [81, 16, 6], [84, 18, 4]] },
    { name: 'top of the square', dur: 9, pos: [[78, sqTop, 13], [76, sqTop + 1, 8], [74, sqTop + 2, 2]], look: [[0, 6, 0], [-20, 4, -40], [-10, 10, -120]] },
    { name: 'chess tables', dur: 7, pos: [[66, 3, -12], [70, 2.4, -17], [72, 2.2, -19]], look: [[74, 1, -21], [74, 0.9, -22], [75, 0.9, -23]] },
    { name: 'fresh off the press', dur: 8, pos: [[0, 3, -36], [-2, 2.4, -42], [0, 2.2, -45]], look: [[-3.4, 1.4, -37.5], [0, 2, -49.6], [0, 2.2, -49.6]] },
    { name: 'the cut', dur: 8, pos: [[-33, 3, -57], [-36.5, 2.2, -61], [-38.5, 2, -64]], look: [[-42, 2.4, -69], [-42, 2.2, -69], [-43, 2, -70.5]] },
    { name: 'the observer', dur: 10, pos: [[6, 3, -128], [3, 2.6, -134], [1.5, 2.4, -135.5]], look: [[0.5, 1.8, -137.5], [0, 20, -200], [0, 40, -215]] },
    { name: 'the witness', dur: 10, pos: [[30, 30, -160], [12, 50, -185], [0, 64, -190]], look: [[0, 55, -215], [0, 62, -215], [0, 63, -215]] },
    { name: 'the el', dur: 11, ease: false, pos: [[165 * Math.cos(-0.9), 14, 165 * Math.sin(-0.9)], [165 * Math.cos(-0.5), 14, 165 * Math.sin(-0.5)], [165 * Math.cos(-0.1), 14, 165 * Math.sin(-0.1)]], look: [[150 * Math.cos(-0.6), 12, 150 * Math.sin(-0.6)], [150 * Math.cos(-0.2), 12, 150 * Math.sin(-0.2)], [150 * Math.cos(0.2), 12, 150 * Math.sin(0.2)]] },
    { name: 'the back room', dur: 9, pre: () => { BACK.g.visible = true; BACK.show = LIFE.t + 9.5; }, pos: [[21, br, 69], [17, br, 69.5], [13, br, 68]], look: [[14, br, 62], [17, br + 0.2, 61.5], [21, br, 62]] }
  ];
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
