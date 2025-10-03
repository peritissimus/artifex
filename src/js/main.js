import * as THREE from 'three';
import WebGLContent from './sketch/flow_field/WebGLContent.js';

const canvas = document.getElementById('canvas-webgl');
const resolution = new THREE.Vector2();

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('selectstart', (e) => e.preventDefault());

// Initialize the sketch
const webglContent = new WebGLContent();

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

// Start the sketch
await webglContent.start(canvas);
on();
resizeWindow();
webglContent.play();
update();
