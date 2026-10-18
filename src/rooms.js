// Fictional civic infrastructure. Metres. Every department has an action, not just a different paint color.
export const departments = [
    ['intake', 'The Bureau of Unlicensed Miracles', 'Take a number. The number is taking you.', 'I / INTAKE'],
    ['jury', 'The International Court of Pigeon Justice', 'The jury has reviewed your sidewalk privileges.', 'I / INTAKE'],
    ['rent', 'The Apartment Bigger Than Its Lease', 'Same pigeons. Different rent. Stand on the brass eye.', 'I / INTAKE'],
    ['deli', 'The Last Bodega in the Universe', 'The refrigerator contains a city. The cat contains an opinion.', 'II / EVIDENCE'],
    ['wash', 'The Gravity Laundromat', 'Click a washer. Gravity is a delicate fabric.', 'II / EVIDENCE'],
    ['lost', 'Emotional Baggage Claim', 'Open a suitcase. You packed an entire neighborhood.', 'II / EVIDENCE'],
    ['appeals', 'The Endless Appeals Office', 'Your case is moving forward. The hallway disagrees.', 'II / EVIDENCE'],
    ['sky', 'The Sky Is Under Renovation', 'Click the water tower to fold the borough overhead.', 'III / APPEALS'],
    ['flood', 'The Department of Liquid Assets', 'The city is sinking into its own reflection.', 'III / APPEALS'],
    ['bench', 'The Central Park of Forbidden Benches', 'Click a bench. It has somewhere else to be.', 'III / APPEALS'],
    ['noise', 'The Cathedral of Noise Complaints', 'Click the radio. Watch the complaint become architecture.', 'III / APPEALS'],
    ['archive', 'The Archive of Unfinished New Yorkers', 'Walk onto the eye to assemble the scattered witness.', 'IV / AFTER HOURS'],
    ['pocket', 'The Landlord’s Coat Pocket', 'The small case holds the actual museum, live.', 'IV / AFTER HOURS'],
    ['review', 'The Museum Inside Its Own Review', 'The painting contains this room containing this painting.', 'IV / AFTER HOURS'],
    ['garden', 'The Rooftop That Refused to Be Luxury', 'The flower watches the city. Give the rooftop back.', 'V / RELEASE'],
    ['release', 'The Exit Interview With New York', 'You are approved to remain impossible. Return through the form.', 'V / RELEASE']
];
const PI = Math.PI;
const materials = new Map();
function material(c, color, roughness = .65, metalness = 0) { const key = [color, roughness, metalness].join('/'); if (!materials.has(key))
    materials.set(key, new c.THREE.MeshStandardMaterial({ color, roughness, metalness })); return materials.get(key); }
function mesh(c, g, m, x = 0, y = 0, z = 0, parent) { const o = new c.THREE.Mesh(g, m); o.position.set(x, y, z); (parent || c.g).add(o); return o; }
function text(c, s, x, y, z, w = 4, h = .5, ry = 0, bg = '#06163a', fg = '#f0f4f8') { const o = c.sign(s, { w, h, bg, fg, font: c.MONO, px: 192 }); o.position.set(x, y, z); o.rotation.y = ry; c.add(o); return o; }
function tube(c, points, r = .04, color = 0x00e5ff, parent) { const curve = new c.THREE.CatmullRomCurve3(points.map(p => new c.THREE.Vector3(...p))); return mesh(c, new c.THREE.TubeGeometry(curve, 48, r, 7, false), material(c, color, .3, .4), 0, 0, 0, parent); }
function ring(c, r, x, y, z, color = 0x00e5ff, parent) { return mesh(c, new c.THREE.TorusGeometry(r, .045, 8, 64), new c.THREE.MeshBasicMaterial({ color }), x, y, z, parent); }
function paint(c) { const t = c.tex.load('assets/generated/contour.png'); t.colorSpace = c.THREE.SRGBColorSpace; t.wrapS = t.wrapT = c.THREE.RepeatWrapping; return new c.THREE.MeshStandardMaterial({ map: t, roughness: .63, metalness: .2 }); }
function paste(c, x, y, z, w = 4, ry = 0) { const p = c.picture('generated/wheatpaste.png', w, w * 2 / 3, { basic: true }); p.position.set(x, y, z); p.rotation.y = ry; c.add(p); return p; }
function stickers(c, x, y, z, ry = 0, count = 18) { const pool = Object.keys(c.STICK); for (let i = 0; i < count; i++) {
    const q = (i * .6180339887) % 1;
    c.sticker(pool[(i * 37 + c.R.i * 61) % pool.length], x + Math.cos(ry) * (q - .5) * 2.5, y + Math.sin(i * 2.3) * .5, z - Math.sin(ry) * (q - .5) * 2.5, { ry, size: .18 + (i % 4) * .055, rot: Math.sin(i) * .22 });
} }
function eye(c, x, y, z, size = 1.5, parent) { const t = c.tex.load('assets/flower.png'); t.colorSpace = c.THREE.SRGBColorSpace; const m = new c.THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: c.THREE.DoubleSide, toneMapped: false }); return mesh(c, new c.THREE.PlaneGeometry(size, size), m, x, y, z, parent); }
function artWalls(c, width = 12, depth = 28, n = 10) { const a = c.art(n); a.forEach((p, i) => { const side = i % 2 ? 1 : -1; const z = 7 - Math.floor(i / 2) * 3.6; c.hang(p, side * (width / 2 - .13), 2.2, z, side * -PI / 2, 2.3, 'copper', { light: true }); }); }
function floor(c, w = 20, d = 30, name = 'terrazzo') { return c.box(w, .16, d, c.surf(name, 2.4), 0, -.08, 0, { collide: false }); }
function bounds(c, w = 20, d = 30) { c.wall(-w / 2, -d / 2, -w / 2, d / 2); c.wall(w / 2, -d / 2, w / 2, d / 2); c.wall(-w / 2, d / 2, w / 2, d / 2); c.wall(-w / 2, -d / 2, w / 2, -d / 2); }
function shell(c, { w = 20, d = 30, h = 8, color = 0xc4c0ae, ceiling = true } = {}) { floor(c, w, d, ({ deli: 'bodega_floor', wash: 'tile', archive: 'subway_floor', pocket: 'velvet', release: 'subway_floor', rent: 'bodega_floor', appeals: 'tile', lost: 'subway_floor' })[c.R.id] || 'terrazzo'); const wall = material(c, color); c.box(.3, h, d, wall, -w / 2 - .15, h / 2, 0); c.box(.3, h, d, wall, w / 2 + .15, h / 2, 0); for (const z of [-d / 2, d / 2])
    for (const x of [-1, 1])
        c.box(w / 2 - 2, h, .3, wall, x * (w / 4 + 1), h / 2, z); if (ceiling)
    c.box(w, .2, d, c.surf('ceiling', 3), 0, h, 0, { collide: false }); bounds(c, w, d); for (const x of [-w / 2 + .15, w / 2 - .15])
    for (const y of [.15, h - .4])
        c.add(c.slab(.12, .16, d, material(c, 0xbe854c, .35, .75), x, y, 0)); }
function lamps(c, h = 6) { for (const z of [-9, 0, 9]) {
    c.glb('ph_caged_hanging_light', { h: .55, x: 0, y: h, z });
    c.light(0, h - .5, z, 0xffdab1, 32, 17);
} c.light(-6, 2, 0, 0x2962ff, 13, 14); c.light(6, 2, -7, 0x00e5ff, 13, 14); }
function doorway(c, to, x, z, back = false) { const ry = back ? PI : 0; const mat = paint(c); for (const s of [-1, 1])
    c.box(.24, 3.8, .5, mat, x + s * 1.95, 1.9, z, { collide: false }); c.box(4.15, .3, .5, mat, x, 3.8, z, { collide: false }); const q = mesh(c, new c.THREE.PlaneGeometry(3.65, 3.5), material(c, 0x06163a), x, 1.75, z); q.rotation.y = ry; const src = new c.THREE.Object3D(); src.position.copy(q.position); src.rotation.y = ry; c.add(src); c.portal({ mesh: q, src, to, at: [0, 1.75, 9, 0], k: 1, ride: true, res: .5, maxDist: 34, hint: 'Enter ' + departments.find(d => d[0] === to)[1] }); text(c, back ? 'PREVIOUS DEPARTMENT' : 'NEXT DEPARTMENT', x, 4.2, z + (back ? -.1 : .1), 3.8, .25, ry); c.door({ x, z: z + (back ? -.5 : .5), r: .85, to, at: [0, 9, 0] }); }
function common(c, i) {
    const prev = departments[(i + 15) % 16][0], next = departments[(i + 1) % 16][0];
    doorway(c, next, 0, -13.9);
    doorway(c, prev, 0, 13.9, true);
    text(c, String(i + 1).padStart(2, '0') + ' / ' + departments[i][1].toUpperCase(), 0, 5.6, -13.5, 14, .62);
    text(c, 'NEW YORKERS // BY MLOW', 0, .25, -12.7, 4, .2);
    for (const side of [-1, 1]) {
        c.glb('ph_industrial_wall_sconce', { h: .6, x: side * 3, y: 3, z: 11, ry: PI });
        c.glb('ph_fire_alarm', { h: .28, x: side * 3, y: 2.7, z: -13 });
    }
    if (['intake', 'deli', 'wash', 'appeals', 'archive', 'release'].includes(c.R.id)) {
        const duct = material(c, 0x69747a, .6, .55);
        for (const side of [-1, 1]) {
            tube(c, [[side * 7, 5.3, 11], [side * 7, 5.3, -8], [side * 4, 5.3, -11]], .16, 0x69747a);
            for (let z = -8; z < 11; z += 2) {
                const rr = ring(c, .19, side * 7, 5.3, z, 0xbe854c);
                rr.rotation.x = PI / 2;
            }
            c.glb('ph_korean_fire_extinguisher_01', { h: .7, x: side * 8, y: .1, z: 10 });
        }
        paste(c, -4.8, 2.3, -13.5, 3.4);
        stickers(c, 4.8, 1.6, -13.45, 0, 12);
    }
    if (['sky', 'flood', 'bench', 'garden'].includes(c.R.id)) {
        const rail = material(c, 0x141e2c, .4, .7);
        for (const side of [-1, 1])
            for (let z = -12; z <= 12; z += 3) {
                c.box(.09, 1.1, .09, rail, side * 12.5, .55, z, { collide: false });
                c.box(.07, .08, 3, rail, side * 12.5, 1.1, z, { collide: false });
            }
        const a = c.R.art;
        a.forEach((p, i) => { const side = i % 2 ? 1 : -1; const z = (['flood', 'bench'].includes(c.R.id) ? 8 : 9) - Math.floor(i / 2) * 4; c.box(.12, 2.6, 2.9, paint(c), side * (c.R.id === 'flood' ? 9.2 : c.R.id === 'garden' ? 13.2 : 11.2), 1.8, z, { collide: false }); });
    }
    const pink = material(c, 0xff2e63, .2, .15);
    for (let k = 0; k < 10; k++) {
        const len = .25 + (k % 4) * .18;
        mesh(c, new c.THREE.CylinderGeometry(.016, .01, len, 7), pink, -2 + k * .45, 3.6 - len / 2, -13.62);
    }
}
function action(c, o, label, line, fn) { c.click(o, () => { fn?.(); c.egg(c.R.id + '-' + label, line); }, label); }
function vista(c) { const v = c.picture('generated/vista.png', 360, 130.9, { basic: true }); v.position.set(0, 40, -98); c.add(v); }
function colonnade(c, r = 7, h = 7, n = 12) { const m = paint(c); for (let i = 0; i < n; i++) {
    const a = i / n * PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r - 2;
    if (Math.abs(x) < 2)
        continue;
    mesh(c, new c.THREE.CylinderGeometry(.24, .4, h, 12), m, x, h / 2, z);
    mesh(c, new c.THREE.CylinderGeometry(.65, .65, .22, 12), material(c, 0xbe854c, .4, .6), x, h, z);
    c.post(x, z, .45);
} }
function buildings(c, parent, { radius = 19, rows = 9 } = {}) { const T = c.THREE; const m = c.surf('subway_wall', 2.5, { tint: 0x536078, rough: .85 }); const count = rows * 9; const b = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), m, count); const win = new T.InstancedMesh(new T.PlaneGeometry(.35, .55), new T.MeshBasicMaterial({ color: 0xffd9a0 }), count * 16); const dummy = new T.Object3D(); let k = 0, j = 0; for (let a = 0; a < rows; a++)
    for (let q = -4; q <= 4; q++) {
        const ang = a / (rows - 1) * PI * 1.25 + .15;
        const hh = 3 + ((a * 17 + q * 13 + 100) % 7);
        dummy.position.set(q * 3.1, radius - Math.cos(ang) * radius + 3, -18 - Math.sin(ang) * radius);
        dummy.rotation.set(-ang, 0, 0);
        dummy.scale.set(2.3, hh, 2.7);
        dummy.updateMatrix();
        b.setMatrixAt(k++, dummy.matrix);
        for (let u = -1; u <= 1; u += 2)
            for (let v = 0; v < 8; v++) {
                const p = new T.Vector3(u * .65, (v / 8 - .5) * hh, 1.36).applyEuler(dummy.rotation).add(dummy.position);
                const d = new T.Object3D();
                d.position.copy(p);
                d.rotation.copy(dummy.rotation);
                d.updateMatrix();
                win.setMatrixAt(j++, d.matrix);
            }
    } win.count = j; parent.add(b, win); }
const builders = {
    intake(c) { shell(c, { h: 11, color: 0x998e78 }); lamps(c, 8); colonnade(c, 8, 9, 14); artWalls(c, 20, 30, 10); const brass = material(c, 0xbe854c, .25, .8); const desk = c.box(8, 1.15, 1.2, paint(c), 0, .575, -5); text(c, 'COUNTER 0: UNLICENSED MIRACLES', 0, 1.35, -4.37, 5, .3); const clerk = c.glb('mlowtar', { h: 2, x: 0, z: -6.5 }); action(c, desk, 'Take a number', 'Your number is ∞. We are currently serving yesterday.', () => { c.R.state.called = !c.R.state.called; }); eye(c, 0, 4, -7, 3); for (let i = 0; i < 36; i++) {
        const a = i * .7, r = 2 + i * .1;
        const t = text(c, String(1000 + i), Math.cos(a) * r, 3 + i * .12, -5 + Math.sin(a) * r, .8, .35);
        t.userData.dynamic = true;
        c.tick((time) => { if (c.REDUCED)
            return; t.position.y = 3 + i * .12 + Math.sin(time + i) * .16; t.rotation.z = Math.sin(time * .3 + i) * .1; });
    } for (const x of [-5, 5])
        for (let z = 1; z < 10; z += 3)
            c.glb('bench', { len: 2, x, z, ry: PI / 2 }); paste(c, -9.8, 1.8, 11, 3, PI / 2); stickers(c, 9.8, 1.3, 11, -PI / 2); const stamp = mesh(c, new c.THREE.CylinderGeometry(1.2, 1.2, .3, 32), brass, 0, 7, -4); stamp.rotation.x = PI / 2; c.tick((t, dt) => { stamp.position.y += ((c.R.state.called ? 2 : 7) - stamp.position.y) * Math.min(1, dt * 3); }); },
    jury(c) { floor(c, 26, 30, 'velvet'); bounds(c, 26, 30); colonnade(c, 10, 8, 18); lamps(c, 7); const dome = mesh(c, new c.THREE.SphereGeometry(13, 40, 20, 0, PI * 2, 0, PI / 2), paint(c), 0, 7, -1); dome.material.side = c.THREE.BackSide; const judge = c.glb('pigeon', { h: 5, x: 0, y: 1.8, z: -8 }); c.box(8, 1.7, 2, material(c, 0x392419, .4), 0, .85, -8); text(c, 'THE PEOPLE v. THE PEOPLE', 0, 3, -6.95, 7, .5); action(c, judge, 'Plead your case', 'Sidewalk privileges renewed. Sentence: one bagel, time served.', () => { c.R.state.verdict = 1; }); for (let side of [-1, 1])
        for (let k = 0; k < 5; k++) {
            let x = side * (4.4 + k * .8), z = 3 - k * 1.7;
            c.box(1.4, .8, 1.2, material(c, 0x50362a), x, .4, z);
            c.glb('pigeon', { h: 1, x, y: .8, z, ry: -side * PI / 2 });
        } const a = c.art(10); a.forEach((p, i) => c.hang(p, (i % 2 ? 1 : -1) * 11, 2, 8 - Math.floor(i / 2) * 4, (i % 2 ? -1 : 1) * PI / 2, 2.4, 'gilt')); eye(c, 0, 8, -10, 3); for (let i = 0; i < 15; i++)
        tube(c, [[-12 + i * 1.7, 9, -10], [-10 + i * 1.4, 7, -5], [-7 + i, 9, 3]], .025, 0xbe854c); },
    rent(c) { shell(c, { w: 20, h: 7, color: 0xdbd4be }); lamps(c, 5); artWalls(c, 20, 30, 10); const warp = new c.THREE.Group(); c.add(warp); const E = new c.THREE.Vector3(0, 1.62, 8); const warpgeo = g => { let p = g.attributes.position; for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        let s = 1.15 - .075 * x;
        p.setXYZ(i, E.x + (x - E.x) * s, E.y + (y - E.y) * s, E.z + (z - E.z) * s);
    } g.computeVertexNormals(); return g; }; const checker = c.canvasTex(512, 512, (g) => { for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
            g.fillStyle = (x + y) % 2 ? '#13203a' : '#d8d1b3';
            g.fillRect(x * 64, y * 64, 64, 64);
        } }); const geo = new c.THREE.PlaneGeometry(13, 10, 30, 24).rotateX(-PI / 2).translate(0, 0, -4); mesh(c, warpgeo(geo), new c.THREE.MeshStandardMaterial({ map: checker, side: c.THREE.DoubleSide }), 0, 0, 0, warp); for (const [ww, hh, xx, yy, zz, rot] of [[13, 5, 0, 2.5, -9, 0], [10, 5, -6.5, 2.5, -4, PI / 2], [10, 5, 6.5, 2.5, -4, -PI / 2]]) {
        const wg = new c.THREE.PlaneGeometry(ww, hh, 32, 20);
        wg.rotateY(rot);
        wg.translate(xx, yy, zz);
        mesh(c, warpgeo(wg), new c.THREE.MeshStandardMaterial({ map: checker, side: c.THREE.DoubleSide }), 0, 0, 0, warp);
    } for (const x of [-5, 5]) {
        const k = 1.15 - .075 * x;
        c.glb('pigeon', { h: 1.6, x: x * k, y: 1.62 * (1 - k), z: 8 + (-7 - 8) * k });
    } c.post(0, -4, 5.8); text(c, 'IDENTICAL TENANTS. DIFFERENT PERSPECTIVES.', 0, 4, -11, 8, .4); const spot = ring(c, .6, 0, .03, 8, 0xbe854c); spot.rotation.x = -PI / 2; action(c, spot, 'Stand on the eye', 'Two equal-height tenants. The far corner is physically farther away.', () => c.go('rent', [0, 8, 0])); const fridge = c.glb('ph_ornate_mirror_01', { h: 2.7, x: 7, z: -8 }); action(c, fridge, 'Read the lease', 'No guests from other dimensions. Natural light billed separately.'); paste(c, -9.8, 2, 10, 3, PI / 2); },
    deli(c) {
        shell(c, { w: 20, h: 5, color: 0xc4c8ad });
        floor(c, 20, 30, 'bodega_floor');
        lamps(c, 4);
        artWalls(c, 20, 30, 10);
        for (const x of [-6, 6])
            for (const z of [-7, -2, 3]) {
                c.glb('ph_steel_frame_shelves_03', { h: 2.5, x, z });
                for (let k = 0; k < 4; k++)
                    c.glb(['ph_food_apple_01', 'ph_lemon', 'ph_bananas', 'ph_croissant'][k], { h: .22, x: x + (k - 1.5) * .4, y: 1.3, z });
                c.post(x, z, .9);
            }
        c.box(4, 1.1, 1.4, paint(c), -4, .55, 8);
        c.glb('ph_CashRegister_01', { h: .45, x: -4, y: 1.1, z: 8 });
        const cat = c.glb('cat', { h: .8, x: -2.7, y: 1.1, z: 8 });
        action(c, cat, 'Ask the manager', 'The universe ended. We stayed open. Coffee is still one dollar.');
        const silver = material(c, 0x98acb8, .26, .8);
        for (const dx of [-1.7, 1.7])
            c.box(.2, 3.7, 1.2, silver, 5 + dx, 1.85, -10, { collide: false });
        c.box(3.6, .2, 1.2, silver, 5, 3.7, -10, { collide: false });
        const cold = mesh(c, new c.THREE.PlaneGeometry(3.2, 3.4), silver, 5, 1.7, -9.5);
        const cf = new c.THREE.Object3D();
        cf.position.copy(cold.position);
        c.add(cf);
        c.portal({ mesh: cold, src: cf, to: 'sky', at: [0, 1.7, 9, 0], k: 1.3, ride: true, hint: 'Enter the refrigerator universe', res: .45, maxDist: 20 });
        text(c, 'COLD DRINKS / ENTIRE BOROUGHS', 5, 4.1, -9.45, 4, .25);
        text(c, 'END OF EVERYTHING DELI / OPEN', 0, 3.9, -12, 8, .5);
        for (let i = 0; i < 14; i++)
            ring(c, 1.9 + i * .3, 0, 1.9, -14 - i * 2, 0x00e5ff);
        paste(c, 9.8, 2, 10, 3, -PI / 2);
        stickers(c, -9.8, 1.4, 10, PI / 2);
    },
    wash(c) { shell(c, { w: 22, h: 12, color: 0xa2c6c2 }); lamps(c, 7); const cage = new c.THREE.Group(); cage.position.set(0, 4, -3); c.add(cage); const silver = material(c, 0xb8c7cf, .25, .7); for (let side of [-1, 1])
        for (let i = 0; i < 5; i++) {
            let x = side * 7, z = 6 - i * 3;
            const o = mesh(c, new c.THREE.BoxGeometry(2.5, 2.5, 2), silver, x, 1.25, z);
            const r = ring(c, .85, x, 1.25, z + 1.02, 0x00e5ff);
            mesh(c, new c.THREE.CircleGeometry(.76, 40), paint(c), x, 1.25, z + 1.04);
            const drum = mesh(c, new c.THREE.TorusGeometry(.76, .12, 12, 48), silver, x, 1.25, z + 1.08);
            text(c, 'TIME / ' + (i + 1), x, 2.2, z + 1.04, 1.5, .19);
            for (let a = 0; a < 3; a++)
                mesh(c, new c.THREE.SphereGeometry(.065, 10, 8), material(c, a === 0 ? 0xff2e63 : 0x00e5ff), x - .8 + a * .3, 2, z + 1.07);
            action(c, o, 'Wash gravity ' + i + side, 'Spin cycle approved. The room rotates; your feet stay put.', () => c.R.state.spin = !c.R.state.spin);
        } for (let j = 0; j < 4; j++) {
        const rail = mesh(c, new c.THREE.BoxGeometry(13, .15, 16), material(c, 0x06163a), 0, 0, 0, cage);
        rail.rotation.z = j * PI / 2;
        rail.position.set(Math.sin(j * PI / 2) * 6.5, Math.cos(j * PI / 2) * 6.5, 0);
    } for (let j = 0; j < 28; j++) {
        const t = text(c, ['LOST SOCK', 'FOUND MOON', 'RINSE EGO', 'DO NOT BLEACH TIME'][j % 4], 0, 0, 0, 1.3, .45);
        cage.attach(t);
        const a = j / 28 * PI * 2;
        t.position.set(Math.cos(a) * 5, Math.sin(a) * 5, (j % 5) * 2 - 4);
        t.rotation.z = a;
    } c.tick((t, dt) => { if (!c.REDUCED && c.R.state.spin)
        cage.rotation.z += dt * .25; }); artWalls(c, 22, 30, 10); text(c, 'GRAVITY / COLD WASH ONLY', 0, 5.2, -10, 7, .45); },
    lost(c) { shell(c, { w: 24, h: 8, color: 0x827f83 }); lamps(c, 6); artWalls(c, 24, 30, 10); const belt = mesh(c, new c.THREE.TorusGeometry(5, .8, 8, 80), material(c, 0x111827, .5, .5), 0, .7, -3); belt.rotation.x = PI / 2; c.post(0, -3, 5.9); const bags = []; for (let i = 0; i < 10; i++) {
        const a = i / 10 * PI * 2;
        const b = c.glb('ph_vintage_suitcase', { h: .65, x: Math.cos(a) * 5, y: 1.53, z: -3 + Math.sin(a) * 5 });
        bags.push(b);
        action(c, b, 'Claim bag ' + i, 'Contents: one whole neighborhood, never checked out.', () => c.go(['deli', 'garden', 'rent'][i % 3]));
    } c.tick((t) => { if (c.REDUCED)
        return; bags.forEach((b, i) => { let a = i / 10 * PI * 2 + t * .1; b.position.set(Math.cos(a) * 5, 1.53, -3 + Math.sin(a) * 5); b.rotation.y = -a; }); }); text(c, 'EMOTIONAL BAGGAGE / ALL CLAIMS FINAL', 0, 4.6, -10, 10, .6); c.glb('ph_hand_truck', { h: 1.3, x: -9, z: 8 }); paste(c, 11.8, 2, 10, 3, -PI / 2); },
    appeals(c) { shell(c, { w: 16, h: 7, color: 0xa7b0a4 }); lamps(c, 5); artWalls(c, 16, 30, 10); for (let i = 0; i < 10; i++) {
        for (let side of [-1, 1]) {
            c.box(.18, 5, .3, paint(c), side * 5.5, 2.5, 12 - i * 2.7, { collide: false });
            text(c, 'WINDOW ' + (i + 1) + '\nCOME BACK YESTERDAY', side * 6.9, 4, 12 - i * 2.7, 1.8, .6, side * -PI / 2);
        }
    } const mirror = mesh(c, new c.THREE.PlaneGeometry(5, 4), material(c, 0xffffff), 0, 2, -10); const src = new c.THREE.Object3D(); src.position.copy(mirror.position); c.add(src); c.portal({ mesh: mirror, src, to: 'appeals', at: [0, 2, -4, 0], k: 1, ride: false, recurse: 4, maxDist: 30 }); c.click(mirror, () => c.egg('appeals-mirror', 'Four recursive views. Your paperwork has been forwarded to itself.'), 'Check application status'); c.R.state.loops = 0; const turn = text(c, 'REPEAT THE APPEAL', -4, 1.5, 5, 2, .5); action(c, turn, 'Appeal again', 'The office has reconsidered. It remains an office.', () => { c.R.state.loops++; c.go('appeals', [0, 9, 0]); }); },
    sky(c) { vista(c); floor(c, 32, 30, 'subway_floor'); bounds(c, 32, 30); lamps(c, 6); const city = new c.THREE.Group(); c.add(city); buildings(c, city, { radius: 24, rows: 10 }); const tower = c.glb('water_tower', { h: 7, x: 10, z: -5 }); action(c, tower, 'Fold the borough', 'The sky was not load-bearing.', () => c.R.state.fold = !c.R.state.fold); c.tick((t, dt) => { if (c.REDUCED)
        return; city.rotation.x += ((c.R.state.fold ? -.45 : 0) - city.rotation.x) * Math.min(1, dt * .8); }); for (const x of [-12, 12])
        for (let z = -10; z <= 10; z += 5) {
            c.glb('lamppost', { h: 5, x, z });
            c.box(.12, 8, .12, material(c, 0xaab2bb, .4, .8), x, 4, z, { collide: false });
        } const a = c.art(10); a.forEach((p, i) => c.hang(p, (i % 2 ? 1 : -1) * 11, 2, 9 - Math.floor(i / 2) * 4, (i % 2 ? -1 : 1) * PI / 2, 2.6, 'steel')); eye(c, 0, 12, -22, 8); text(c, 'SKY CLOSED FOR ESSENTIAL NONSENSE', 0, 8, -12, 13, .7); paste(c, 15, 2, 8, 4, -PI / 2); },
    flood(c) { vista(c); floor(c, 26, 30, 'tile'); bounds(c, 26, 30); lamps(c, 6); const T = c.THREE; const g = new T.PlaneGeometry(25, 28, 70, 70).rotateX(-PI / 2); const m = new T.MeshPhysicalMaterial({ color: 0x083d5c, metalness: .75, roughness: .16, transparent: true, opacity: .78 }); const water = mesh(c, g, m, 0, .04, 0); const base = g.attributes.position.array.slice(); c.tick(t => { if (c.REDUCED)
        return; let p = g.attributes.position; for (let i = 0; i < p.count; i++)
        p.setY(i, Math.sin(base[i * 3] * 1.3 + t) * Math.cos(base[i * 3 + 2] * .8 + t * .5) * .06); p.needsUpdate = true; g.computeVertexNormals(); }); for (let side of [-1, 1])
        for (let k = 0; k < 5; k++) {
            c.box(2.8, .4, 2.2, paint(c), side * 7, .2, 8 - k * 4);
            c.glb(k % 2 ? 'mailbox' : 'hydrant', { h: 1.3, x: side * 7, y: .4, z: 8 - k * 4 });
        } const a = c.art(10); a.forEach((p, i) => { const x = (i % 2 ? 1 : -1) * 9, z = 8 - Math.floor(i / 2) * 4; c.hang(p, x, 2.6, z, (i % 2 ? -1 : 1) * PI / 2, 2.3, 'bone'); }); const coin = c.glb('ph_rubber_duck_toy', { h: 1.8, x: 0, z: -6 }); action(c, coin, 'Audit the liquid assets', 'Your assets are liquid. Your liabilities are also wet.', () => { m.color.setHex(m.color.getHex() === 0x083d5c ? 0x5b174f : 0x083d5c); }); c.plate('unlicensed', { x: 0, y: 0, z: -18, far: 90, zMin: 18, zscale: 1, fade: true }); },
    bench(c) { floor(c, 28, 30, 'crop'); bounds(c, 28, 30); lamps(c, 6); const a = c.art(10); a.forEach((p, i) => c.hang(p, (i % 2 ? 1 : -1) * 11, 2, 8 - Math.floor(i / 2) * 4, (i % 2 ? -1 : 1) * PI / 2, 2.5, 'bone')); for (let i = 0; i < 8; i++) {
        const x = (i % 2 ? 1 : -1) * (4 + (i % 3)), z = 8 - Math.floor(i / 2) * 5;
        const b = c.glb('bench', { len: 2.5, x, z });
        let target = x;
        action(c, b, 'Rest on bench ' + i, 'This bench requires three references and a guarantor.', () => target = target === x ? x + (x < 0 ? -2 : 2) : x);
        c.tick((t, dt) => { b.position.x += (target - b.position.x) * Math.min(1, dt * (c.REDUCED ? 30 : 2)); });
        c.glb('ph_potted_plant_02', { h: 2.7, x: x + (x < 0 ? -2 : 2), z: z + 1.5 });
    } eye(c, 0, 6, -8, 5); text(c, 'PLEASE DO NOT ENJOY THE PUBLIC SPACE', 0, 4.5, -10, 10, .5); paste(c, -12, 2, 11, 4, PI / 2); },
    noise(c) { floor(c, 26, 30, 'velvet'); bounds(c, 26, 30); colonnade(c, 10, 11, 16); lamps(c, 8); const organ = new c.THREE.Group(); c.add(organ); const pipes = []; for (let i = 0; i < 31; i++) {
        const h = 4 + 8 * Math.abs(Math.sin(i * .4));
        const p = mesh(c, new c.THREE.CylinderGeometry(.16, .2, h, 10), paint(c), (i - 15) * .6, h / 2, -10, organ);
        pipes.push([p, h]);
    } const radio = c.glb('ph_boombox', { h: 1, x: 0, y: 1, z: 3 }); c.box(2, 1, 1, material(c, 0x24132e), 0, .5, 3); action(c, radio, 'File a noise complaint', 'Complaint converted to a cathedral. Case closed.', () => c.R.state.loud = !c.R.state.loud); c.tick((t) => { pipes.forEach(([p, h], i) => { let k = !c.REDUCED && c.R.state.loud ? 1 + Math.sin(t * 3 + i * .5) * .2 : 1; p.scale.y = k; p.position.y = h * k / 2; }); }); const a = c.art(10); a.forEach((p, i) => c.hang(p, (i % 2 ? 1 : -1) * 11, 2.2, 9 - Math.floor(i / 2) * 3.5, (i % 2 ? -1 : 1) * PI / 2, 2.4, 'gilt')); text(c, '311 / PLEASE HOLD THE NOTE', 0, 10, -10, 9, .6); },
    archive(c) { shell(c, { w: 24, h: 11, color: 0x394656 }); lamps(c, 8); artWalls(c, 24, 30, 10); for (let side of [-1, 1])
        for (let z = -9; z < 9; z += 3) {
            c.glb('ph_steel_frame_shelves_03', { h: 4, x: side * 7, z });
            for (let y = 1; y < 4; y++)
                c.glb('ph_cardboard_box_01', { h: .65, x: side * 7, y, z });
            c.post(side * 7, z, 1);
        } for (let i = 0; i < 14; i++) {
        const x = (i % 7 - 3) * 1.4, z = -3 - Math.floor(i / 7) * 3;
        c.box(.4, 3 + (i % 3), .5, paint(c), x, 1.5 + (i % 3) / 2, z, { collide: false });
    } c.g.updateMatrixWorld(true); c.anamorph({ from: [0, 1.62, 8], aim: [0, 3, -6], image: 'flower.png', grid: [14, 14], size: 5, maxD: 25, minD: 4 }); const spot = ring(c, .65, 0, .03, 8, 0xbe854c); spot.rotation.x = -PI / 2; action(c, spot, 'Align the witness', 'The eye exists only from one place. Everywhere else it is evidence.', () => c.go('archive', [0, 8, 0, -.08])); text(c, 'UNFINISHED PEOPLE / KEEP ALL PIECES', 0, 7, -11, 11, .6); },
    pocket(c) { shell(c, { w: 24, h: 15, color: 0x342c40 }); lamps(c, 8); artWalls(c, 24, 30, 10); const T = c.THREE; for (let j = 0; j < 9; j++)
        tube(c, [[-10 + j * 2.5, 13, -12], [-8 + j * 2, 12, 0], [-10 + j * 2.5, 14, 12]], .15, 0x66527d); const base = c.box(3, 1.1, 4, paint(c), 0, .55, -3); const q = mesh(c, new T.BoxGeometry(2.8, 1.8, 3.8), material(c, 0xffffff), 0, 2.03, -3); const src = new T.Object3D(); src.position.set(0, 1.13, -3); c.add(src); c.portal({ mesh: q, src, to: 'intake', at: [0, 0, 0, 0], k: 7, ride: false, clipPlane: [0, -1, 0, 9], maxDist: 24, res: .65 }); action(c, base, 'Enter the coat pocket', 'The landlord keeps the city next to loose change.', () => c.go('intake')); text(c, 'ONE CITY / POCKET SIZE / NO DEPOSIT RETURNS', 0, 5, -10, 12, .5); for (const x of [-8, 8]) {
        const coin = mesh(c, new T.CylinderGeometry(1.7, 1.7, .25, 48), material(c, 0xbe854c, .25, .9), x, 1.8, -5);
        coin.rotation.z = PI / 2;
        c.glb('ph_round_spectacles', { len: 3, x, y: 0, z: 4 });
    } eye(c, 0, 9, -12, 5); },
    review(c) { shell(c, { w: 24, h: 9, color: 0xd9d8ca }); lamps(c, 7); artWalls(c, 24, 30, 10); const q = mesh(c, new c.THREE.PlaneGeometry(7, 4.7), material(c, 0xffffff), 0, 3.4, -9); const src = new c.THREE.Object3D(); src.position.copy(q.position); c.add(src); c.portal({ mesh: q, src, to: 'review', at: [0, 1.62 + 1.7 * (3.4 - 1.62), -2, 0], k: 1.7, ride: false, recurse: 4, maxDist: 40, res: .6 }); for (const x of [-3.7, 3.7])
        c.box(.2, 5, .3, paint(c), x, 3.4, -9, { collide: false }); text(c, 'OIL ON RECURSION / EDITION OF ITSELF', 0, .7, -8.9, 6, .3); const b = text(c, 'EDIT THE REVIEW: “SHALLOW”', 0, 1.2, 3, 5, .6); action(c, b, 'Edit the review', 'The critic called it deep. The room took that literally.', () => { c.R.state.deep = !c.R.state.deep; q.scale.x = c.R.state.deep ? 1.3 : 1; }); eye(c, -8, 5, -9, 2); paste(c, 11.8, 2, 11, 3, -PI / 2); },
    garden(c) { vista(c); floor(c, 30, 30, 'terrazzo'); bounds(c, 30, 30); lamps(c, 6); c.plate('unlicensed', { x: 0, z: -18, far: 100, zMin: 20 }); const witness = eye(c, 0, 6, -8, 8); c.tick((t, dt, me) => { witness.rotation.y = Math.atan2(me.x, me.z + 8) * .25; }); for (const x of [-9, -5, 5, 9])
        for (const z of [-6, 0, 6]) {
            c.box(2.3, .6, 2.3, paint(c), x, .3, z);
            c.glb('ph_potted_plant_02', { h: 1.8, x, y: .6, z });
        } const a = c.art(10); a.forEach((p, i) => c.hang(p, (i % 2 ? 1 : -1) * 13, 2, 9 - Math.floor(i / 2) * 4, (i % 2 ? -1 : 1) * PI / 2, 2.8, 'copper')); const b = c.glb('bench', { len: 3, x: 0, z: 4 }); action(c, b, 'Make room for someone', 'No application. No guarantor. Sit. The city is yours too.', () => { c.R.state.shared = !c.R.state.shared; witness.scale.setScalar(c.R.state.shared ? 1.12 : 1); }); text(c, 'THIS ROOFTOP IS NOT AN AMENITY', 0, 10, -11, 12, .6); },
    release(c) { shell(c, { w: 26, h: 12, color: 0x08182f }); lamps(c, 8); artWalls(c, 26, 30, 10); for (let k = 0; k < 13; k++) {
        const r = ring(c, 4.5 + k * .28, 0, 4, -4 - k * .7, k % 2 ? 0xbe854c : 0x00e5ff);
        r.scale.y = 1.25;
    } const desk = c.box(5, 1.1, 1.2, paint(c), 0, .55, 2); text(c, 'APPROVED TO REMAIN IMPOSSIBLE', 0, 1.4, 2.65, 4.6, .4); action(c, desk, 'Approve your own existence', 'Your permit has no expiration date. Take New York with you.', () => { c.R.state.approved = true; const link = document.createElement('a'); link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('NEW YORKERS // BY MLOW\nDEPARTMENT OF UNLICENSED NEW YORK\nPERMIT: APPROVED TO REMAIN IMPOSSIBLE\nNo expiration date. No fee.\n'); link.download = 'your-impossible-permit.txt'; link.click(); }); eye(c, 0, 7, -10, 4); for (const x of [-10, 10]) {
        c.glb('pigeon', { h: 2.2, x, z: 6 });
        paste(c, x, 2, -6, 4, x < 0 ? PI / 2 : -PI / 2);
    } text(c, 'THE EXIT IS ANOTHER ENTRANCE', 0, 10, -12, 12, .5); }
};
export const rooms = departments.map(([id, name, kicker, scale], i) => ({ id, name, kicker, scale, spawn: [0, 10, 0, id === 'sky' ? .2 : 0], sound: i % 3 ? 'museum' : 'bodega', fog: 0x06101d, sky: 0x02040c, fogD: .009, hemi: [0xcbdcff, 0x302328, .85], env: .12, post: { bloom: .22, vig: .18, grain: .025, ca: 0 }, build(c) { builders[id](c); common(c, i); }, onEnter(c) { c.toast(kicker, 5000); } }));
