import * as THREE from 'three';
import WebGLContent from '../../src/js/sketch/flow_field/WebGLContent';

const webglContent = new WebGLContent();
const resolution = new THREE.Vector2();
const canvas = document.getElementById('canvas-webgl');

const resizeWindow = () => {
  resolution.set(window.innerWidth, window.innerHeight);
  canvas.width = resolution.x;
  canvas.height = resolution.y;
  webglContent.resize(resolution);
};

const on = () => {
  window.addEventListener('blur', () => {
    webglContent.pause();
  });
  window.addEventListener('focus', () => {
    webglContent.play();
  });
  window.addEventListener('resize', resizeWindow);
};

const update = () => {
  webglContent.update();
  requestAnimationFrame(update);
};

const init = async () => {
  await webglContent.start(canvas);
  on();
  resizeWindow();
  webglContent.play();
  update();
};

init();
