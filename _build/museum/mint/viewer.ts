/* The object view of a museum token: the room as a GLB on an orbit, self hosted, no CDN.
   viewer.html?src=../rooms/NNN-id/room.web.glb  (the network page passes the path; a bare page shows a picker hint) */
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const params = new URLSearchParams(location.search);
const src = params.get('src') || '';
const host = document.getElementById('view')!;
const status = document.getElementById('status')!;

const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.outputColorSpace = T.SRGBColorSpace;
host.appendChild(renderer.domElement);

const scene = new T.Scene();
scene.background = new T.Color(0x0b0d12);
const camera = new T.PerspectiveCamera(45, 1, 0.1, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotateSpeed = 0.6;
controls.addEventListener('start', () => { controls.autoRotate = false; });
scene.add(new T.HemisphereLight(0xdfe8ff, 0x1a1c22, 1.4));
const key = new T.DirectionalLight(0xffffff, 1.6);
key.position.set(40, 80, 30);
scene.add(key);

function resize() {
  const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

/* The export carries a 700 unit sky dome; frame the room, not the sky. */
function frame(root: T.Object3D) {
  const box = new T.Box3();
  root.traverse((o) => {
    const m = o as T.Mesh;
    if (!m.isMesh) return;
    m.geometry.computeBoundingBox();
    const b = m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld);
    const size = b.getSize(new T.Vector3());
    if (Math.max(size.x, size.y, size.z) > 600) { m.visible = false; return; }
    box.union(b);
  });
  const size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  const r = Math.max(size.x, size.z, size.y * 1.4) * 0.62;
  controls.target.copy(c);
  camera.position.set(c.x + r * 0.9, c.y + r * 0.55, c.z + r * 0.9);
  camera.near = r / 200; camera.far = r * 40;
  camera.updateProjectionMatrix();
  controls.update();
}

if (!src) status.textContent = 'No model given. Open this page from a room in the network.';
else {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(src, (g) => {
    scene.add(g.scene);
    g.scene.updateMatrixWorld(true);
    frame(g.scene);
    status.hidden = true;
  }, (e) => {
    if (e.total) status.textContent = `LOADING ${Math.round((e.loaded / e.total) * 100)}%`;
  }, (err) => { status.textContent = 'The model did not load.'; console.error(err); });
}

renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
