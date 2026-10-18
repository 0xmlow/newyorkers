// THE PIGEONHOLE: twelve rooms at four scales. The order is the line: I the dream, II the bodega, III the pigeon,
// IV the museum, and the last room holds the first.
import { addRoom, start } from './engine.js';
import car from './rooms/car.js';
import platform from './rooms/platform.js';
import bodega from './rooms/bodega.js';
import cooler from './rooms/cooler.js';
import stairs from './rooms/stairs.js';
import nave from './rooms/nave.js';
import crop from './rooms/crop.js';
import heart from './rooms/heart.js';
import wing from './rooms/wing.js';
import dome from './rooms/dome.js';
import museum from './rooms/museum.js';
import shop from './rooms/shop.js';
for (const r of [car, platform, bodega, cooler, stairs, nave, crop, heart, wing, dome, museum, shop]) addRoom(r);
start('car');
