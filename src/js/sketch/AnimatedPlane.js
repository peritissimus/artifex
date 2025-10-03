import * as THREE from 'three';
import WebGLApp from '../utils/WebGLApp.js';
import vertexShader from '../../glsl/vertex.vert';
import fragmentShader from '../../glsl/fragment.frag';

export default class AnimatedPlane extends WebGLApp {
  constructor(canvas) {
    super(canvas);
    this.setupMesh();
    this.start();
  }

  setupMesh() {
    // Create geometry
    this.geometry = new THREE.PlaneGeometry(4, 4, 32, 32);

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(this.width, this.height) }
      },
      side: THREE.DoubleSide
    });

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  update(delta, elapsed) {
    // Update shader uniforms
    this.material.uniforms.uTime.value = elapsed;

    // Rotate the mesh slightly
    this.mesh.rotation.x = Math.sin(elapsed * 0.3) * 0.2;
    this.mesh.rotation.y = Math.cos(elapsed * 0.2) * 0.3;
  }

  onResize() {
    super.onResize();
    if (this.material) {
      this.material.uniforms.uResolution.value.set(this.width, this.height);
    }
  }

  dispose() {
    super.dispose();
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}
