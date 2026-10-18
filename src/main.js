import { curate } from './catalog.js';
import { rooms } from './rooms.js';
import { addRoom, start } from './engine.js';
window.CAST = curate(window.CAST, rooms);
window.EGG_N = 43;
for (const r of rooms)
    addRoom(r);
start('intake');
