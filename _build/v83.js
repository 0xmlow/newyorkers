/* ================================================================
   v83 THE GULLS (2026-11-22)
   Eight herring gulls stand on bollards along the pier, white and grey with yellow beaks, turning their heads.
   Walk up to one and it takes off with a cry, wheels out over the water for a while and comes back to the same
   bollard. Clear all eight off the pier at once and the island counts it.
   ================================================================ */
const GULL = { g: [] };
window.__GULL = GULL;
(function gulls() {
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.7 }), grey = new THREE.MeshStandardMaterial({ color: 0x8e959c, roughness: 0.7 }), yellow = new THREE.MeshStandardMaterial({ color: 0xe9c43a, roughness: 0.5 }), dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
  let i = 0; for (let z = 135; z <= 177; z += 6) { const x = (i % 2 ? 2.65 : -2.65), deck = 0.55; const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.55, 10), wood); b.position.set(x, deck + 0.27, z); scene.add(b); post(x, z, 0.2, -5, 1.2);
    const g = new THREE.Group(); scene.add(g); const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), white); body.scale.set(1.5, 0.95, 0.9); body.position.y = 0.17; g.add(body);
    const head = new THREE.Group(); head.position.set(0.22, 0.32, 0); g.add(head); head.add(new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), white));
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.11, 6), yellow); beak.rotation.z = -PI / 2; beak.position.set(0.11, -0.01, 0); head.add(beak);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), dark); e.position.set(0.05, 0.03, s * 0.06); head.add(e); });
    const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(0, 0.22, s * 0.12); const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.42), grey); m.position.set(-0.04, 0, s * 0.2); w.add(m); const tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.12), dark); tip.position.set(-0.12, 0, s * 0.4); w.add(tip); g.add(w); return w; });
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.14), white); tail.position.set(-0.27, 0.18, 0); g.add(tail);
    [-0.05, 0.05].forEach(s => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), yellow); l.position.set(0, 0.0, s); g.add(l); });
    const perch = new THREE.Vector3(x, deck + 0.6, z); g.position.copy(perch); g.rotation.y = x < 0 ? 0 : PI;
    GULL.g.push({ g, head, wings, perch, ry: g.rotation.y, state: 'sit', t: Math.random() * 5, a: 0, cx: 0, cz: 0, R: 0 }); i++; }
})();
const gullSecret = secret('gulls', () => { toast('ALL EIGHT GULLS ARE IN THE AIR AND THEY ALL BLAME YOU.', 'blue'); });
function gullCry(x, z) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; const d = Math.hypot(x - P.x, z - P.z); if (d > 40) return;
  try { for (let k = 0; k < 3; k++) { const t0 = AC.currentTime + k * 0.22, o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(1500, t0); o.frequency.exponentialRampToValueAtTime(800, t0 + 0.18); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.min(0.05, 1.2 / (d + 4)), t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + 0.22); } } catch (e) { } }
function gullFrame(dt) {
  if (P.z < 90) return; let flying = 0;
  GULL.g.forEach(b => { b.t += dt; const d = Math.hypot(P.x - b.perch.x, P.z - b.perch.z);
    if (b.state === 'sit') { b.g.position.copy(b.perch); b.g.rotation.set(0, b.ry, 0); b.head.rotation.y = Math.sin(b.t * 0.7) * 0.6 * (Math.sin(b.t * 0.23) > 0 ? 1 : -0.4); b.wings.forEach(w => w.rotation.x = 0);
      if (d < 3.2) { b.state = 'fly'; b.t = 0; b.R = 14 + Math.random() * 10; b.cx = b.perch.x + (b.perch.x < 0 ? -b.R - 4 : b.R + 4); b.cz = b.perch.z + (Math.random() - 0.5) * 10; b.a = Math.atan2(b.perch.z - b.cz, b.perch.x - b.cx); b.dur = 14 + Math.random() * 10; gullCry(b.perch.x, b.perch.z); } }
    else { flying++; b.a += dt * 0.55 * (b.perch.x < 0 ? 1 : -1); const rise = Math.min(1, b.t / 1.2), home = Math.max(0, (b.t - b.dur) / 3);
      const fx = b.cx + Math.cos(b.a) * b.R, fz = b.cz + Math.sin(b.a) * b.R, fy = 4 + Math.sin(b.t * 0.4) * 1.5;
      const x = THREE.MathUtils.lerp(THREE.MathUtils.lerp(b.perch.x, fx, rise), b.perch.x, Math.min(1, home)), z = THREE.MathUtils.lerp(THREE.MathUtils.lerp(b.perch.z, fz, rise), b.perch.z, Math.min(1, home)), y = THREE.MathUtils.lerp(THREE.MathUtils.lerp(b.perch.y, fy, rise), b.perch.y, Math.min(1, home));
      const vx = x - b.g.position.x, vz = z - b.g.position.z; if (Math.abs(vx) + Math.abs(vz) > 1e-4) b.g.rotation.set(0, Math.atan2(-vz, vx), (b.perch.x < 0 ? -0.35 : 0.35) * (1 - home));
      b.g.position.set(x, y, z); const flap = Math.sin(b.t * (rise < 1 || home > 0 ? 18 : 6)) * (Math.sin(b.t * 0.5) > -0.3 ? 0.7 : 0.15); b.wings.forEach((w, k) => w.rotation.x = (k ? -1 : 1) * flap);
      if (home >= 1 && d > 3.5) { b.state = 'sit'; b.t = 0; } else if (home >= 1) { b.t = b.dur - 0.5; } } });
  if (flying === GULL.g.length) gullSecret();
}
window.__FRAMES.push(dt => { try { gullFrame(dt); } catch (e) { if (!GULL.err) { GULL.err = e; console.warn('v83 gulls', e); } } });
