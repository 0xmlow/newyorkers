import fs from 'node:fs';import {departments} from '../src/rooms.js';
const effects=[
'Floating queue tickets and a lowering permit stamp; click the intake counter. Geometry animation; frozen queue motion under reduced motion.',
'Giant judge and modeled pigeon jury; click judge for a verdict. Spatial scale and interactive satire, not a camera illusion.',
'Ray-warped checker floor and walls with equal-height pigeons; stand at the brass eye. A physical forced-perspective installation protected by a collision boundary.',
'Live refrigerator view and click-to-enter shortcut into the folded rooftop; modeled shelves, groceries, register, and cat. Normal paired route remains available.',
'A rotating cage of architecture around a stationary visitor; click a washer. Eye and floor remain level. Continuous rotation disabled under reduced motion.',
'Modeled luggage on a rotating toroidal carousel; click luggage for direct room jumps. Destination jumps are explicit, not seamless scale portals. Motion freezes under reduced motion.',
'Four-level live recursive corridor view. Click the appeal sign to repeat the office. Finite render recursion, not an infinite traversable hallway.',
'Instanced building cylinder bends overhead; click the water tower to change the fold. Protected distant generated vista and actual foreground architecture.',
'Vertex-displaced water, metallic environment response, civic islands, and generated inverse-depth vista. Water is not a true planar mirror. Click duck to change the liquid ledger.',
'Benches evade rest when clicked; modeled botanical props, mounted art. Movement is eased; reduced-motion preference makes it near-instant.',
'An organ made of architectural pipes; click the radio to change their amplitude. Geometric response, not microphone analysis. Reduced motion holds pipes static.',
'Anamorphic flower assembled from 196 ray-projected fragments on depth-separated surfaces. Stand on brass marker. View-dependent alignment, not a flat billboard.',
'A box portal displays the real intake hall at scale 1:7 with a cutaway clip plane. Walk around it to inspect; click pedestal to jump inside.',
'A painting showing its own room recursively, four levels deep. Click review plaque to resize aperture. Finite live recursion and bounded render targets.',
'Watchful flower follows viewer, community bench interaction, planters, protected skyline depth. This is a rooftop exhibit, not a reconstructed address.',
'Layered rings, permit counter, downloadable text souvenir, return to intake. The entire route closes into a cycle.'
];
let s='# Room and effect map\n\nEvery room has a physical floor, side boundary, ordinary paired route, artwork inspection and a Rooms-menu escape route. Walk transitions use explicit doorway-radius triggers; clicking a live aperture uses the inherited camera-ride transform. They are different interaction paths.\n\n';
departments.forEach((d,i)=>s+=`## ${String(i+1).padStart(2,'0')} / ${d[1]}\n\n${d[2]}\n\n${effects[i]}\n\n`);
s+='## Shared rendering contract\n\nOne scene, 400m-separated local frames, one active room plus portal destination renders; six pooled point lights. Two visible portal updates per desktop frame, one on coarse-pointer devices. Self recursion is four levels on desktop and two on mobile. Targets ping-pong or render deepest-first without read/write feedback. Textures and GLB sources are cached. Static non-interactive boxes batch by material.\n\nCamera rides are click-triggered. Walk thresholds are tested in both directions. Collision is a 2D player-radius solver against walls and selected prop footprints; moving props and artwork stands are not all solid. The Rooms menu and image index remain available.\n';fs.writeFileSync(new URL('../docs/ROOMS.md',import.meta.url),s);
