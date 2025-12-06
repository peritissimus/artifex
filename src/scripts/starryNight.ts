import * as THREE from 'three';

let instance: any = null;

export function initStarryNight(): void {
  if (instance) return;

  const container = document.getElementById('world');
  if (!container) return;
  if (container.querySelector('canvas')) return;
  if (window.innerWidth < 768) return;

  instance = createBlackHoleScene(container);
}

function createBlackHoleScene(container: HTMLElement) {
  // Config
  const config = {
    starCount: 10000,
    schwarzschildRadius: 50,
    photonSphereRadius: 75,
    iscoRadius: 150,
  };

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.z = 1000;

  const renderer = new THREE.WebGLRenderer({
    antialias: false, // Disabled for performance
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Lower pixel ratio
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Tracking
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let scrollProgress = 0;
  let targetScrollProgress = 0;

  // ============ STARS ============
  const starsGeometry = new THREE.BufferGeometry();
  const count = config.starCount;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  // Combined data: [radius, angle, velocity] - fewer attributes = better perf
  const starData = new Float32Array(count * 3);

  const rs = config.schwarzschildRadius;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Simpler distribution
    const u = Math.random();
    const radius = config.iscoRadius + u * u * 1200;

    // Disk distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.8;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Store orbital data
    starData[i3] = radius;
    starData[i3 + 1] = theta;
    // Pre-compute velocity factor (avoid sqrt in shader)
    starData[i3 + 2] = (0.8 + Math.random() * 0.4) / Math.sqrt(radius / rs);

    // Simple color assignment
    const temp = Math.random();
    if (temp > 0.6) {
      colors[i3] = 0.95; colors[i3 + 1] = 0.97; colors[i3 + 2] = 1.0;
    } else if (temp > 0.25) {
      colors[i3] = 1.0; colors[i3 + 1] = 0.98; colors[i3 + 2] = 0.93;
    } else {
      colors[i3] = 1.0; colors[i3 + 1] = 0.88; colors[i3 + 2] = 0.75;
    }

    sizes[i] = 1.0 + Math.random() * 2.5;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  starsGeometry.setAttribute('starData', new THREE.BufferAttribute(starData, 3));

  // Optimized shader - removed expensive operations
  const starsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uRs: { value: config.schwarzschildRadius },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      attribute vec3 starData; // radius, angle, velocity

      varying vec3 vColor;
      varying float vFade;

      uniform float uTime;
      uniform float uProgress;
      uniform float uRs;
      uniform float uPixelRatio;

      void main() {
        float initialRadius = starData.x;
        float initialAngle = starData.y;
        float velocity = starData.z;

        // Simplified approach progress
        float progress = uProgress * uProgress;

        // Stars pulled inward
        float pullAmount = progress * (initialRadius - uRs * 2.0) * 0.5;
        float currentRadius = max(initialRadius - pullAmount, uRs * 1.2);

        // Simple time dilation approximation (avoid sqrt where possible)
        float dilationFactor = currentRadius / (currentRadius + uRs * progress * 2.0);

        // Orbital motion - always rotating, speed increases with scroll
        float baseSpeed = 0.15; // Base rotation
        float scrollBoost = progress * 2.0; // Speed up significantly on scroll
        float angularSpeed = velocity * dilationFactor * (baseSpeed + scrollBoost);
        float newAngle = initialAngle + uTime * angularSpeed;

        // Flatten to disk
        float z = position.z * (1.0 - progress * 0.7);

        vec3 pos;
        pos.x = cos(newAngle) * currentRadius;
        pos.y = sin(newAngle) * currentRadius;
        pos.z = z;

        // Simple lensing effect (no expensive pow)
        float distXY = length(pos.xy);
        float lensingZone = uRs * 3.0;
        if (distXY < lensingZone && distXY > uRs) {
          float lensStrength = (1.0 - distXY / lensingZone) * progress * 0.5;
          vec2 tangent = vec2(-pos.y, pos.x) / distXY;
          pos.xy += tangent * lensStrength * 25.0;
        }

        // Redshift approximation
        float redshiftFactor = uRs / currentRadius;
        vec3 shiftedColor = color;
        shiftedColor.b *= 1.0 - redshiftFactor * progress * 0.7;
        shiftedColor.g *= 1.0 - redshiftFactor * progress * 0.4;

        // Fade near event horizon
        vFade = smoothstep(uRs, uRs * 2.5, currentRadius);
        vColor = shiftedColor * vFade;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

        // Size calculation
        float sizeAtten = 250.0 / -mvPosition.z;
        gl_PointSize = size * uPixelRatio * sizeAtten;
        gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vFade;

      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = dot(center, center) * 4.0; // Faster than length()

        if (dist > 1.0) discard;

        // Simple glow
        float alpha = (1.0 - dist) * 0.9;
        vec3 finalColor = vColor + vec3(0.15) * (1.0 - dist);

        gl_FragColor = vec4(finalColor, alpha * vFade);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // ============ ANIMATION ============
  let lastTime = 0;

  function animate(currentTime: number) {
    requestAnimationFrame(animate);

    // Delta time for consistent speed
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    // Smooth interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;

    const progress = scrollProgress * scrollProgress;

    // Update uniforms
    starsMaterial.uniforms.uTime.value = currentTime * 0.001;
    starsMaterial.uniforms.uProgress.value = scrollProgress;

    // Camera
    camera.position.z = 1000 - progress * 800;
    camera.position.x = mouseX * 25 * (1 - progress * 0.4);
    camera.position.y = -mouseY * 18 * (1 - progress * 0.4);

    // Subtle shake near black hole
    if (progress > 0.3) {
      const shake = (progress - 0.3) * 3;
      camera.position.x += Math.sin(currentTime * 0.008) * shake;
      camera.position.y += Math.cos(currentTime * 0.01) * shake;
    }

    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);

  // ============ EVENT LISTENERS ============
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const handleMouseMove = (e: MouseEvent) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
  };

  // Track actual page scroll for rotation speed
  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
      targetScrollProgress = window.scrollY / scrollHeight;
    }
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', handleScroll, { passive: true });

  setTimeout(() => container.classList.add('loaded'), 100);

  return {
    destroy: () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      starsGeometry.dispose();
      starsMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      instance = null;
    }
  };
}
