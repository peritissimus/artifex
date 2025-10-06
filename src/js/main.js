import * as THREE from 'three';
import noiseVertexShader from './shaders/noise.vert?raw';
import noiseFragmentShader from './shaders/noise.frag?raw';
import displayVertexShader from './shaders/display.vert?raw';
import displayFragmentShader from './shaders/display.frag?raw';
import blobVertexShader from './shaders/blob.vert?raw';
import blobFragmentShader from './shaders/blob.frag?raw';

// NoiseBackground class for animated wave pattern
class NoiseBackground {
  constructor(renderer) {
    this.renderer = renderer;
    this.width = 1024;
    this.height = 1024;
    this.count = 0;
    this.isRender = true;
    this.sepR = 14;
    this.sepG = 10;
    this.init();
  }

  init() {
    // Setup camera
    const aspectRatio = this.width / this.height;
    const viewSize = this.height;
    this.camera = new THREE.OrthographicCamera(
      (-aspectRatio * viewSize) / 2,
      (aspectRatio * viewSize) / 2,
      viewSize / 2,
      -viewSize / 2,
      0,
      10000
    );
    this.camera.position.set(0, 0, 100);

    // Setup scene
    this.scene = new THREE.Scene();

    // Setup render target
    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      anisotropy: 1,
    });

    // Setup shader
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    this.uniforms = {
      texture: { value: null },
      cr: { value: this.sepR },
      cg: { value: this.sepG },
      cb: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: noiseVertexShader,
      fragmentShader: noiseFragmentShader,
      uniforms: this.uniforms,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  update() {
    if (this.isRender) {
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);

      this.count += 0.002;
      this.uniforms.cb.value = this.count;
      this.isRender = false;
    } else {
      this.isRender = true;
    }
  }

  getTexture() {
    return this.renderTarget.texture;
  }
}

class Peritissimus {
  constructor() {
    this.canvas = document.getElementById('world');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.targetDistA = 0.64;
    this.targetDistB = 2.5;
    this.targetEase = 0.06;
    this.currentDistA = 0.64;
    this.currentDistB = 2.5;
    this.currentEase = 0.06;

    this.init();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Noise background
    this.noiseBackground = new NoiseBackground(this.renderer);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const aspectRatio = this.width / this.height;
    const viewSize = this.height;
    this.camera = new THREE.OrthographicCamera(
      (-aspectRatio * viewSize) / 2,
      (aspectRatio * viewSize) / 2,
      viewSize / 2,
      -viewSize / 2,
      0,
      1000
    );
    this.camera.position.set(0, 0, 100);

    // Add noise background plane to scene
    this.createBackgroundPlane();

    // Create glass blob in center
    this.createGlassBlob();
  }

  createBackgroundPlane() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);

    // Create display shader material with wave distortions
    this.displayUniforms = {
      noise: { value: this.noiseBackground.getTexture() },
      time: { value: 0 },
      ease: { value: 0.06 },
      alpha: { value: 0.85 },
      distA: { value: 0.64 },
      distB: { value: 2.5 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: displayVertexShader,
      fragmentShader: displayFragmentShader,
      uniforms: this.displayUniforms,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.backgroundMesh = new THREE.Mesh(geometry, material);
    this.backgroundMesh.position.z = -10;
    this.scene.add(this.backgroundMesh);
  }

  createGlassBlob() {
    // Create blob geometry (ellipsoid/flattened sphere for pebble)
    const geometry = new THREE.SphereGeometry(150, 64, 64);

    // Flatten and add very subtle irregularity for pebble-like shape
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Flatten on Z-axis
      const flatZ = z * 0.3;

      // Very subtle irregularity - just gentle bumps like a real pebble
      const angle = Math.atan2(y, x);
      const noise = Math.sin(angle * 5.0) * 0.015 + Math.cos(angle * 7.0) * 0.012;

      const scale = 1.0 + noise;

      positions.setX(i, x * scale);
      positions.setY(i, y * scale);
      positions.setZ(i, flatZ);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    // Create blob material with glass shader
    this.blobUniforms = {
      noiseTexture: { value: this.noiseBackground.getTexture() },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(this.width, this.height) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: blobVertexShader,
      fragmentShader: blobFragmentShader,
      uniforms: this.blobUniforms,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
    });

    this.blobMesh = new THREE.Mesh(geometry, material);
    this.blobMesh.position.set(0, 0, 0);
    this.scene.add(this.blobMesh);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());

    // Project item hover - distort field
    document.querySelectorAll('.project-item').forEach((item) => {
      item.addEventListener('mouseenter', () => {
        this.targetDistA = 0.8;
        this.targetDistB = 15;
        this.targetEase = 0.5;
      });

      item.addEventListener('mouseleave', () => {
        this.targetDistA = 0.64;
        this.targetDistB = 2.5;
        this.targetEase = 0.06;
      });

      item.addEventListener('click', () => {
        const path = item.getAttribute('data-path');
        if (path) {
          window.location.href = path;
        }
      });
    });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);

    const aspectRatio = this.width / this.height;
    const viewSize = this.height;

    this.camera.left = (-aspectRatio * viewSize) / 2;
    this.camera.right = (aspectRatio * viewSize) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    // Update background plane size
    if (this.backgroundMesh) {
      this.backgroundMesh.scale.set(this.width / 1024, this.height / 1024, 1);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update noise background
    this.noiseBackground.update();

    // Smooth interpolation for distortion values
    this.currentDistA += (this.targetDistA - this.currentDistA) * 0.1;
    this.currentDistB += (this.targetDistB - this.currentDistB) * 0.1;
    this.currentEase += (this.targetEase - this.currentEase) * 0.1;

    // Update display shader
    if (this.displayUniforms) {
      this.displayUniforms.time.value += 0.004;
      this.displayUniforms.distA.value = this.currentDistA;
      this.displayUniforms.distB.value = this.currentDistB;
      this.displayUniforms.ease.value = this.currentEase;
    }

    // Animate glass blob (subtle floating effect)
    if (this.blobMesh && this.blobUniforms) {
      this.blobUniforms.time.value += 0.01;
      this.blobMesh.rotation.z += 0.001;
      // Subtle breathing effect
      const breathe = Math.sin(this.blobUniforms.time.value * 0.5) * 0.05 + 1;
      this.blobMesh.scale.set(breathe, breathe, breathe);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  new Peritissimus();
});
