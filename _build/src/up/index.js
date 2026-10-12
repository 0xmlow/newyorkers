// Round twelve: each batch file owns its own sets, so eight builders never edit the same file.
// Round thirteen adds c1 to c8 (graphics and one new illusion per set), which run after the b files.
import * as b1 from './b1.js'; import * as b2 from './b2.js'; import * as b3 from './b3.js'; import * as b4 from './b4.js';
import * as b5 from './b5.js'; import * as b6 from './b6.js'; import * as b7 from './b7.js'; import * as b8 from './b8.js';
import * as c1 from './c1.js'; import * as c2 from './c2.js'; import * as c3 from './c3.js'; import * as c4 from './c4.js';
import * as c5 from './c5.js'; import * as c6 from './c6.js'; import * as c7 from './c7.js'; import * as c8 from './c8.js';
// 2026-10-12: e1 is THE WRAP, the escape room set, built in the room's own file
import * as e1 from './e1.js';
export const UPGRADES = [b1, b2, b3, b4, b5, b6, b7, b8, c1, c2, c3, c4, c5, c6, c7, c8, e1];
