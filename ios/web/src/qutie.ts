/**
 * Qutie: a one-piece print, so a turntable — drag to spin, pinch to zoom. Lighting as on qutie.org's
 * showroom stage (JanLahmann/Qutie site/src/pages/index.astro); each model's color, finish and start
 * angle come from the page (data-color, data-metalness, data-roughness, data-rotate, from there too).
 */
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stage = document.getElementById('stage')!;
const status = document.getElementById('status')!;
let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  status.textContent = 'The 3D view needs WebGL, which is not available here.';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
stage.append(renderer.domElement);
renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000);
scene.add(new THREE.HemisphereLight(0xffffff, 0x50546a, 1.8));
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(1, 2, 1.5);
const rim = new THREE.DirectionalLight(0xffffff, 1.1);
rim.position.set(-1.5, 0.8, -1.5);
const fill = new THREE.DirectionalLight(0x0f62fe, 0.3);
fill.position.set(-1.5, -0.5, 1);
scene.add(key, rim, fill);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotateSpeed = 2.2;
controls.enableDamping = true;
controls.addEventListener('start', () => { controls.autoRotate = false; });

let radius = 0;
/** Puts the whole model in view, in portrait as in landscape (the narrower field of view decides). */
function frame() {
  if (!radius) return;
  const v = THREE.MathUtils.degToRad(camera.fov / 2);
  const h = Math.atan(Math.tan(v) * camera.aspect);
  const d = (radius * 1.15) / Math.sin(Math.min(v, h));
  camera.position.copy(new THREE.Vector3(0, 0.35, 1).normalize().multiplyScalar(d));
  controls.target.set(0, 0, 0);
  controls.minDistance = radius * 1.2;
  controls.maxDistance = d * 2;
}
const resize = () => {
  const { clientWidth: w, clientHeight: h } = stage;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  frame();
};
new ResizeObserver(resize).observe(stage);

const src = stage.dataset.src!;
new STLLoader().loadAsync(src).then((geometry) => {
  geometry.center();
  geometry.computeBoundingSphere();
  const r = geometry.boundingSphere?.radius ?? 1;
  const d = stage.dataset;
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color || '#2fa9cc'), roughness: Number(d.roughness ?? 0.55), metalness: Number(d.metalness ?? 0.05) }));
  mesh.rotation.x = -Math.PI / 2; // STL is Z-up, three.js Y-up
  mesh.rotation.z = (Number(d.rotate ?? 0) * Math.PI) / 180; // the model's start angle
  scene.add(mesh);
  radius = r;
  status.remove();
  resize();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
}).catch((e) => { console.error(e); status.textContent = 'The 3D model could not be loaded.'; });
