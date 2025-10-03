import * as THREE from 'three';

import WebGLContent from './WebGLContent';
import Drag from './Drag';

export default async function(canvas) {
  const webglContent = new WebGLContent();
  const resolution = new THREE.Vector2();
  const dd = new Drag(resolution);

  const resizeWindow = () => {
    resolution.set(window.innerWidth, window.innerHeight);
    canvas.width = resolution.x;
    canvas.height = resolution.y;
    webglContent.resize(resolution);
  };

  const on = () => {
    const touchstart = (e) => {
      dd.touchStart(e);
    }
    const touchmove = (e) => {
      dd.touchMove(e);
    }
    const touchend = (e) => {
      dd.touchEnd(e);
    }
    canvas.addEventListener('mousedown', touchstart, { passive: false });
    window.addEventListener('mousemove', touchmove, { passive: false });
    window.addEventListener('mouseup', touchend);
    canvas.addEventListener('touchstart', touchstart, { passive: false });
    window.addEventListener('touchmove', touchmove, { passive: false });
    window.addEventListener('touchend', touchend);

    window.addEventListener('blur', () => {
      webglContent.pause();
    });
    window.addEventListener('focus', () => {
      webglContent.play();
    });
    window.addEventListener('resize', resizeWindow);
  };

  const update = () => {
    dd.update(resolution);
    webglContent.update(dd);
    requestAnimationFrame(update);
  };

  // Create simple procedural skull geometry
  const createSkullGeometry = () => {
    const headGeometry = new THREE.SphereGeometry(8, 32, 32);
    const jawGeometry = new THREE.SphereGeometry(4, 32, 32);

    // Deform to look more skull-like
    const headPositions = headGeometry.attributes.position;
    for (let i = 0; i < headPositions.count; i++) {
      const x = headPositions.getX(i);
      const y = headPositions.getY(i);
      const z = headPositions.getZ(i);

      // Squash and stretch
      headPositions.setXYZ(i, x * 1.1, y * 0.9, z * 1.2);
    }

    const jawPositions = jawGeometry.attributes.position;
    for (let i = 0; i < jawPositions.count; i++) {
      const x = jawPositions.getX(i);
      const y = jawPositions.getY(i);
      const z = jawPositions.getZ(i);

      jawPositions.setXYZ(i, x * 1.2, y * 0.7, z * 1.1);
    }

    headGeometry.computeVertexNormals();
    jawGeometry.computeVertexNormals();

    return {
      children: [
        { geometry: jawGeometry },
        { geometry: headGeometry }
      ]
    };
  };

  // Create noise texture
  const createNoiseTexture = () => {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  };

  const skullModel = createSkullGeometry();
  const noiseTex = createNoiseTexture();

  await webglContent.start(canvas, skullModel, noiseTex);

  on();
  resizeWindow();
  webglContent.play();
  update();
}
