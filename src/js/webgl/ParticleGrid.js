import * as THREE from 'three';

export class ParticleGrid {
  constructor() {
    this.canvas = document.getElementById('world');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Optimize WebGL renderer for mobile
    const isMobile = window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: !isMobile, // Disable expensive antialiasing on mobile
      powerPreference: 'high-performance',
    });

    this.mouse = new THREE.Vector2();
    this.targetMouse = new THREE.Vector2();
    this.time = 0;

    this.init();
    this.createParticles();
    this.addEventListeners();
    this.animate();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Limit pixel ratio on mobile for better performance
    const isMobile = window.innerWidth < 768;
    const maxPixelRatio = isMobile ? 1 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));

    this.camera.position.z = 50;

    // Fade in canvas once loaded
    setTimeout(() => {
      this.canvas.classList.add('loaded');
    }, 100);
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();

    // Significantly reduce particle count on mobile for better performance
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 400 : 2000;

    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    // Create grid-aligned particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Align to grid (20px spacing from CSS)
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;

      scales[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Shader material for subtle effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uOpacity: { value: 0.5 },
      },
      vertexShader: `
        attribute float scale;
        uniform float uTime;
        uniform vec2 uMouse;

        varying float vScale;

        void main() {
          vScale = scale;

          vec3 pos = position;

          // Subtle wave motion
          pos.z += sin(uTime * 0.5 + position.x * 0.1) * 0.5;
          pos.z += cos(uTime * 0.3 + position.y * 0.1) * 0.5;

          // Mouse interaction (subtle)
          float dist = distance(position.xy, uMouse * 50.0);
          float force = smoothstep(10.0, 0.0, dist);
          pos.z += force * 2.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = scale * 2.0 * (50.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vScale;

        void main() {
          // Circular particles
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          float alpha = smoothstep(0.5, 0.1, dist);

          // Monochrome color matching design
          vec3 color = vec3(0.81, 0.81, 0.79); // #cfcecd

          gl_FragColor = vec4(color, alpha * uOpacity * vScale);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  addEventListeners() {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.01;

    // Smooth mouse following
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    // Update shader uniforms
    if (this.particles && this.particles.material) {
      this.particles.material.uniforms.uTime.value = this.time;
      this.particles.material.uniforms.uMouse.value = this.mouse;
    }

    // Subtle rotation
    if (this.particles) {
      this.particles.rotation.y = Math.sin(this.time * 0.1) * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
    }
    this.renderer.dispose();
  }
}
