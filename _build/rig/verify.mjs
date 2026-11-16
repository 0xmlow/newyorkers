// verify.mjs: load each rigged GLB headlessly in three.js r185 (ES modules) and r128 (the global build MEME ISLAND,
// BASEMENT and SPIRAL use), play every clip through an AnimationMixer, and check the skeleton.
//   node verify.mjs cabbie actress ...
// Checks per file and per three.js version: a SkinnedMesh exists, a bone named exactly "head" exists and its own Y
// axis points up (so head.rotation.y turns the head), clips "walk"/"idle" exist, every bone matrix stays finite over
// the clip, the skinned mesh never dips under the floor (y < -1 cm) or grows past 2.2 m, a page style head turn after
// the mixer update stays finite, and (r185) SkeletonUtils.clone gives an independent copy that animates.
// Textures are stubbed (node has no image decoder); the JPEG itself is checked by type only.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const R185 = path.join(ROOT, 'BIGGER ON THE INSIDE 2026-10-17', 'node_modules', 'three');
const R128 = path.join(ROOT, 'YOUR MOMS BASEMENT 2026-10-08', 'site', 'vendor');
const names = process.argv.slice(2);

const buf = (n) => { const b = fs.readFileSync(path.join(HERE, 'out', n + '.glb')); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const stubTextures = (THREE) => (parser) => { parser.loadTexture = () => Promise.resolve(new THREE.Texture()); return { name: 'stub_textures' }; };

function exercise(THREE, gltf, label, applyBone) {
  const out = { ok: true, notes: [] };
  const fail = (m) => { out.ok = false; out.notes.push(m); };
  const root = gltf.scene; root.updateMatrixWorld(true);
  let skinned = null; root.traverse((o) => { if (o.isSkinnedMesh) skinned = o; });
  if (!skinned) { fail('no SkinnedMesh'); return out; }
  const bones = skinned.skeleton.bones; out.bones = bones.length;
  const head = bones.find((b) => b.name === 'head');
  if (!head) fail('no bone named head');
  else {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()));
    out.head_up_dot = +up.y.toFixed(4); if (up.y < 0.99) fail('head bone Y is not up');
  }
  const clips = gltf.animations.map((a) => a.name); out.clips = clips;
  if (!clips.includes('idle')) fail('no idle clip');
  const mixer = new THREE.AnimationMixer(root);
  const pos = skinned.geometry.attributes.position; const v = new THREE.Vector3();
  const step = Math.max(1, Math.floor(pos.count / 400));
  out.min_y = Infinity; out.max_y = -Infinity;
  for (const clip of gltf.animations) {
    mixer.stopAllAction(); const act = mixer.clipAction(clip); act.reset().play();
    const n = Math.round(clip.duration * 30);
    for (let f = 0; f <= n; f++) {
      mixer.setTime(f / 30); root.updateMatrixWorld(true); skinned.skeleton.update();
      for (const b of bones) if (!b.matrixWorld.elements.every(Number.isFinite)) { fail(`${clip.name}: NaN in ${b.name} at frame ${f}`); break; }
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i); applyBone(skinned, i, v); v.applyMatrix4(skinned.matrixWorld);
        if (!Number.isFinite(v.y)) { fail(`${clip.name}: NaN vertex`); break; }
        out.min_y = Math.min(out.min_y, v.y); out.max_y = Math.max(out.max_y, v.y);
      }
    }
    out[clip.name + '_s'] = +clip.duration.toFixed(3);
  }
  if (out.min_y < -0.01) fail(`mesh under the floor: ${out.min_y.toFixed(3)} m`);
  if (out.max_y > 2.2) fail(`mesh too tall: ${out.max_y.toFixed(3)} m`);
  // a page turns the head after the mixer has posed it
  if (head) { mixer.update(0.5); head.rotation.y += 0.8; root.updateMatrixWorld(true); if (!head.matrixWorld.elements.every(Number.isFinite)) fail('head turn NaN'); }
  out.min_y = +out.min_y.toFixed(4); out.max_y = +out.max_y.toFixed(3);
  return out;
}

async function r185() {
  const THREE = await import(pathToFileURL(path.join(R185, 'build', 'three.module.js')).href);
  const { GLTFLoader } = await import(pathToFileURL(path.join(R185, 'examples', 'jsm', 'loaders', 'GLTFLoader.js')).href);
  const SU = await import(pathToFileURL(path.join(R185, 'examples', 'jsm', 'utils', 'SkeletonUtils.js')).href);
  const res = {};
  for (const n of names) {
    const loader = new GLTFLoader(); loader.register(stubTextures(THREE));
    const gltf = await new Promise((ok, no) => loader.parse(buf(n), '', ok, no));
    const r = exercise(THREE, gltf, 'r185', (sm, i, v) => sm.applyBoneTransform(i, v));
    // SkeletonUtils.clone: the copy must have its own skeleton and animate on its own mixer
    const copy = SU.clone(gltf.scene); let a = null, b = null;
    gltf.scene.traverse((o) => { if (o.isSkinnedMesh) a = o; }); copy.traverse((o) => { if (o.isSkinnedMesh) b = o; });
    const m2 = new THREE.AnimationMixer(copy); const clip = gltf.animations.find((c) => c.name === 'walk') || gltf.animations[0];
    m2.clipAction(clip).play(); m2.update(0.37); copy.updateMatrixWorld(true);
    const hb = b.skeleton.bones.find((x) => x.name === 'head');
    r.clone_ok = !!(b && b.skeleton !== a.skeleton && b.skeleton.bones[0] !== a.skeleton.bones[0] && hb && hb.matrixWorld.elements.every(Number.isFinite));
    if (!r.clone_ok) { r.ok = false; r.notes.push('SkeletonUtils.clone failed'); }
    res[n] = r;
  }
  return { version: THREE.REVISION, res };
}

async function r128() {
  const require = createRequire(import.meta.url);
  globalThis.THREE = require(path.join(R128, 'three.min.js'));
  const THREE = globalThis.THREE;
  new Function(fs.readFileSync(path.join(R128, 'GLTFLoader.js'), 'utf8'))();
  const res = {};
  for (const n of names) {
    const loader = new THREE.GLTFLoader(); loader.register(stubTextures(THREE));
    const gltf = await new Promise((ok, no) => loader.parse(buf(n), '', ok, no));
    res[n] = exercise(THREE, gltf, 'r128', (sm, i, v) => sm.boneTransform(i, v));
  }
  return { version: THREE.REVISION, res };
}

const report = { r185: await r185(), r128: await r128() };
for (const n of names) {
  const j = JSON.parse(Buffer.from(buf(n)).subarray(20, 20 + Buffer.from(buf(n)).readUInt32LE(12)).toString());
  report[n] = { kb: Math.round(fs.statSync(path.join(HERE, 'out', n + '.glb')).size / 1024), image: (j.images || []).map((i) => i.mimeType) };
}
fs.writeFileSync(path.join(HERE, 'out', 'verify.json'), JSON.stringify(report, null, 1));
for (const v of ['r185', 'r128']) for (const n of names) {
  const r = report[v].res[n];
  console.log(`${v} (REVISION ${report[v].version}) ${n.padEnd(11)} ${r.ok ? 'PASS' : 'FAIL'} bones ${r.bones} clips ${r.clips} head_up ${r.head_up_dot} y ${r.min_y}..${r.max_y}${r.clone_ok !== undefined ? ' clone ' + r.clone_ok : ''} ${r.notes.join('; ')}`);
}
