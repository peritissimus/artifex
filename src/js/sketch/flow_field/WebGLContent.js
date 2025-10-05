import * as THREE from 'three';

import Camera from './Camera';
import Mover from './Mover';

let renderer;
const scene = new THREE.Scene();
const camera = new Camera();
const clock = new THREE.Clock({
  autoStart: false,
});

const mover = new Mover();

export default class WebGLContent {
  constructor() {}
  async start(canvas) {
    renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      canvas: canvas,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x0a0a0a, 1.0);

    // Create noise texture procedurally
    const size = 256;
    const data = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size * 4; i += 4) {
      data[i] = Math.random();
      data[i + 1] = Math.random();
      data[i + 2] = Math.random();
      data[i + 3] = 1.0;
    }

    const noiseTex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    noiseTex.wrapS = THREE.RepeatWrapping;
    noiseTex.wrapT = THREE.RepeatWrapping;
    noiseTex.minFilter = THREE.NearestFilter;
    noiseTex.magFilter = THREE.NearestFilter;
    noiseTex.needsUpdate = true;

    mover.start(renderer, noiseTex);

    scene.add(mover);

    camera.start();
  }
  play() {
    clock.start();
  }
  pause() {
    clock.stop();
  }
  update() {
    if (clock.running === false) return;

    const time = clock.getDelta();

    camera.update(time);
    mover.update(renderer, time);

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }
  resize(resolution) {
    camera.resize(resolution);
    mover.resize(resolution);
    renderer.setSize(resolution.x, resolution.y);
  }
}
