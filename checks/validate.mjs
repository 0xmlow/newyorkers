import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { rooms, departments } from '../src/rooms.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const root = new URL('../', import.meta.url);
const path = x => new URL(x, root);
const window = {};
vm.runInNewContext(fs.readFileSync(path('public/assets/data.js'), 'utf8'), { window });
const art = [...new Map(Object.values(window.CAST).flat().map(p => [p.n, p])).values()];
assert(art.length >= 160, `Need 160 art entries, found ${art.length}`);
const assets = new Set(), results = [];
const material = new THREE.MeshStandardMaterial();
for (let i = 0; i < rooms.length; i++) {
    const R = { ...rooms[i], i, x0: i * 400, state: {}, art: art.slice(i * 10, i * 10 + 10), ticks: [], doors: [], colliders: [] };
    const g = new THREE.Group();
    const portals = [];
    let ai = i * 10;
    const track = (s) => { assets.add(s); assert(fs.existsSync(path('public/' + s)), s); };
    const add = o => (g.add(o), o);
    const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return add(o); };
    const c = { THREE, R, g, EYE: 1.62, MOBILE: false, REDUCED: true, MONO: 'monospace', STICK: window.STICKERS, add, box, slab: box, surf: (n) => { for (const s of ['c', 'n', 'r'])
            track(`assets/tex/${n}_${s}.jpg`); return material; }, tex: { load: s => { track(s); return new THREE.Texture(); } }, sign: () => new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material), canvasTex: () => new THREE.Texture(), picture: (s, w, h) => { track('assets/' + s); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), material); }, glb: (n, o = {}) => { track('assets/glb/' + n + '.glb'); const g2 = new THREE.Group(); g2.position.set(o.x || 0, o.y || 0, o.z || 0); return add(g2); }, art: n => art.slice(ai, ai += n), hang: (p, x, y, z) => { assert(p); track('assets/art/' + p.f); return box(1, 1, .1, material, x, y, z); }, sticker: () => { }, tick: f => R.ticks.push(f), click: () => { }, post: (x, z, r) => R.colliders.push({ x, z, r }), wall: (...a) => R.colliders.push(a), light: () => { }, portal: p => portals.push(p), door: d => R.doors.push(d), plate: n => { track('assets/depth/' + n + '.png'); track('assets/plates/' + n + '.jpg'); }, anamorph: o => track('assets/' + o.image), go: () => { }, toast: () => { }, egg: () => { } };
    R.build(c);
    for (const f of R.ticks)
        f(1, .016, { x: 0, y: 1.62, z: 10 });
    let vertices = 0, meshes = 0;
    g.traverse(o => { assert(o.position.toArray().every(Number.isFinite)); if (o.isMesh) {
        meshes++;
        const p = o.geometry.attributes.position;
        assert([...p.array].every(Number.isFinite));
        vertices += p.count;
    } });
    assert.equal(R.doors.length, 2);
    assert.equal(R.doors[0].to, rooms[(i + 1) % 16].id);
    assert.equal(R.doors[1].to, rooms[(i + 15) % 16].id);
    for (const p of portals) {
        assert(rooms.some(r => r.id === p.to));
        assert(p.at.every(Number.isFinite));
    }
    results.push({ id: R.id, meshesBeforeAsyncAssets: meshes, verticesBeforeAsyncAssets: vertices, portals: portals.length, ticks: R.ticks.length });
}
assert.equal(rooms.length, 16);
let id = 0;
for (let n = 0; n < 16; n++)
    id = (id + 1) % 16;
assert.equal(id, 0);
const report = { date: '2026-10-18', roomCount: 16, uniqueCatalogArt: art.length, displayedArt: 160, assetReferences: assets.size, rooms: results, scope: 'CPU scene factories and finite geometry; not GPU, texture decode or browser evidence.' };
fs.writeFileSync(path('docs/cpu-validation.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
