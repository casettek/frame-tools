import * as THREE from "three";

import { TWEEN } from "three-tween";
import { TrackballControls } from "three-trackball-controls";
import { CSS3DRenderer, CSS3DSprite } from "three-css-3d-renderer";

const cont = document.createElement("div");
cont.id = "container";
document.body.appendChild(cont);

let camera, scene, renderer;
let controls;

const particlesTotal = 512;
const positions = [];
const objects = [];
let current = 0;

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    5000
  );
  camera.position.set(600, 400, 1500);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();

  const image = document.createElement("img");
  image.addEventListener("load", function () {
    for (let i = 0; i < particlesTotal; i++) {
      const object = new CSS3DSprite(image.cloneNode());
      (object.position.x = Math.random() * 4000 - 2000),
        (object.position.y = Math.random() * 4000 - 2000),
        (object.position.z = Math.random() * 4000 - 2000);
      scene.add(object);

      objects.push(object);
    }

    transition();
  });
  image.src =
    "data:image/png;base64,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";

  // Plane

  const amountX = 16;
  const amountZ = 32;
  const separationPlane = 75;
  const offsetX = ((amountX - 1) * separationPlane) / 2;
  const offsetZ = ((amountZ - 1) * separationPlane) / 2;

  for (let i = 0; i < particlesTotal; i++) {
    const x = (i % amountX) * separationPlane;
    const z = Math.floor(i / amountX) * separationPlane;
    const y = (Math.sin(x * 0.5) + Math.sin(z * 0.5)) * 200;

    positions.push(x - offsetX, y, z - offsetZ);
  }

  // Cube

  const amount = 8;
  const separationCube = 75;
  const offset = ((amount - 1) * separationCube) / 2;

  for (let i = 0; i < particlesTotal; i++) {
    const x = (i % amount) * separationCube;
    const y = Math.floor((i / amount) % amount) * separationCube;
    const z = Math.floor(i / (amount * amount)) * separationCube;

    positions.push(x - offset, y - offset, z - offset);
  }

  // Random

  for (let i = 0; i < particlesTotal; i++) {
    positions.push(
      Math.random() * 3000 - 2000,
      Math.random() * 3000 - 2000,
      Math.random() * 3000 - 2000
    );
  }

  // Sphere

  const radius = 600;

  for (let i = 0; i < particlesTotal; i++) {
    const phi = Math.acos(-1 + (2 * i) / particlesTotal);
    const theta = Math.sqrt(particlesTotal * Math.PI) * phi;

    positions.push(
      radius * Math.cos(theta) * Math.sin(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(phi)
    );
  }

  //

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  //

  controls = new TrackballControls(camera, renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function transition() {
  const offset = current * particlesTotal * 3;
  const duration = 2000;

  for (let i = 0, j = offset; i < particlesTotal; i++, j += 3) {
    const object = objects[i];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: positions[j],
          y: positions[j + 1],
          z: positions[j + 2],
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  }

  new TWEEN.Tween(this)
    .to({}, duration * 3)
    .onComplete(transition)
    .start();

  current = (current + 1) % 4;
}

function animate() {
  requestAnimationFrame(animate);

  TWEEN.update();
  controls.update();

  const time = performance.now();

  for (let i = 0, l = objects.length; i < l; i++) {
    const object = objects[i];
    const scale =
      Math.sin((Math.floor(object.position.x) + time) * 0.002) * 0.3 + 1;
    object.scale.set(scale, scale, scale);
  }

  renderer.render(scene, camera);
}
