import * as THREE from 'three';

class Artifex {
  constructor() {
    this.canvas = document.getElementById('world');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    this.particles = [];
    this.particleIndex = 0;
    this.maxParticles = 50;

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

    // Create particle pool
    this.createParticles();
  }

  createParticles() {
    const geometry = new THREE.PlaneGeometry(64, 64);

    // Create particle texture (simple white circle)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < this.maxParticles; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = Math.random() * Math.PI * 2;
      mesh.scale.set(0.25, 0.25, 1);
      mesh.visible = false;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        active: false,
        opacity: 0,
        scale: 0.2,
        targetScale: 6,
      });
    }
  }

  spawnParticle(x, y) {
    const particle = this.particles[this.particleIndex];

    if (particle) {
      // Convert screen coordinates to world coordinates
      const worldX = (x - this.width / 2) * 0.5;
      const worldY = -(y - this.height / 2) * 0.5;

      particle.mesh.position.set(worldX, worldY, 0);
      particle.mesh.visible = true;
      particle.active = true;
      particle.opacity = 0.9;
      particle.scale = 0.2;
      particle.mesh.material.opacity = particle.opacity;
      particle.mesh.scale.set(particle.scale, particle.scale, 1);

      this.particleIndex = (this.particleIndex + 1) % this.maxParticles;
    }
  }

  updateParticles() {
    this.particles.forEach((particle) => {
      if (particle.active) {
        // Rotation
        particle.mesh.rotation.z += 0.02;

        // Fade out
        particle.opacity *= 0.98;
        particle.mesh.material.opacity = particle.opacity;

        // Scale up
        particle.scale = particle.scale * 0.982 + particle.targetScale * 0.018;
        particle.mesh.scale.set(particle.scale, particle.scale, 1);

        // Deactivate when fully faded
        if (particle.opacity <= 0.002) {
          particle.active = false;
          particle.mesh.visible = false;
        }
      }
    });
  }

  setupEventListeners() {
    let lastX = -1000;
    let lastY = -1000;
    let moveCount = 0;

    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = e.clientX;
      this.targetMouse.y = e.clientY;

      const deltaX = Math.abs(lastX - e.clientX);
      const deltaY = Math.abs(lastY - e.clientY);

      lastX = e.clientX;
      lastY = e.clientY;

      // Only spawn if mouse moved more than 4px
      if (deltaX < 4 && deltaY < 4) return;

      moveCount++;
      if (moveCount >= 4) {
        moveCount = 0;
        this.spawnParticle(e.clientX, e.clientY);
      }
    });

    window.addEventListener('resize', () => this.onResize());

    // Project item clicks
    document.querySelectorAll('.project-item').forEach((item) => {
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
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Smooth mouse interpolation
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.1;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.1;

    this.updateParticles();

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  new Artifex();
});
