/* ================================================================
   v401 SMOOTH: A FAR MODEL FOR EVERY SCULPTURE (2026-11-24)
   The 61 meme sculptures were the island's biggest cost: about 60,000 triangles each, 3.8 million together, drawn
   in full however far away they stood. Each now has a third, far model (assets/sculpt_far, made with gltf-transform:
   meshoptimizer simplify to about 8,400 triangles, textures at 512, meshopt packed, 13 MB for all 66) that stands
   in beyond fifty metres, where the difference is under a pixel. Near: the full model (v177). Middle: the light
   model. Far: this. ?farlod=0 off.
   ================================================================ */
const FARL = { on: SMOOTH.on && !/farlod=0/.test(location.search), loading: 0, n: 0, t: 0 };
window.__FARL = FARL;
function farPlace(s, obj) {
  obj.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new V3()), c = bb.getCenter(new V3());
  const target = s.size * s.scale, k = s.mode === 'm' ? target / Math.max(sz.x, sz.y, sz.z) : target / Math.max(0.001, sz.y);
  const inner = new THREE.Group(); inner.add(obj); obj.position.set(-c.x, -bb.min.y, -c.z); inner.scale.setScalar(k); inner.visible = false; s.root.add(inner); s.farG = inner; FARL.n++;
  obj.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; o.userData.sculpt = s.i; const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(mt => { if (mt) { mt.envMapIntensity = 0.75; if (mt.map) mt.map.anisotropy = ANISO; } }); });
}
window.__FRAMES.push(dt => { try { if (!FARL.on || typeof SC === 'undefined' || !gltfLoader) return; FARL.t -= dt; if (FARL.t > 0) return; FARL.t = 0.25; const cp = camera.position;
  SC.forEach(s => { if (!s.root || s.state !== 'ready') return; const d = Math.hypot(cp.x - s.root.position.x, cp.z - s.root.position.z), lo = s.root.children[0];
    if (!s.farState && FARL.loading < 3) { s.farState = 'loading'; FARL.loading++; gltfLoader.load('assets/sculpt_far/' + s.key + '.glb', g => { FARL.loading--; s.farState = 'ready'; try { farPlace(s, g.scene); } catch (e) { s.farState = 'error'; } }, undefined, () => { FARL.loading--; s.farState = 'error'; }); }
    if (!s.farG) return;
    if (s.hiG && s.hiG.visible) { s.farG.visible = false; return; }
    const far = s.farG.visible ? d > 46 : d > 54; s.farG.visible = far; if (lo && lo !== s.farG && lo !== s.hiG) lo.visible = !far; }); } catch (e) { if (!FARL.err) { FARL.err = e; console.warn('v401 farlod', e); } } });
