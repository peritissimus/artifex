/**
 * Cube Background Animation
 * Creates and animates the 3D cube grid that responds to scrolling
 */

import { debounce, passiveListener } from './utils.js';

// Configuration
const CUBE_CONFIG = {
  cubeCount: 4, // Just a few cubes
  cubeSize: 100, // Base cube size
  scrollFactor: 0.01, // Scroll sensitivity
  mouseFactor: 0.008, // Mouse sensitivity
  orbitRadius: 200, // Reduced orbit radius to stay in viewport
  depthRange: 300, // Reduced depth range to stay visible
};

let cubes = [];
let cubeGrid;
let scrollY = 0;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 60; // Starting rotation
let currentRotationY = 0;
let currentRotationZ = 45; // Starting rotation
let isInitialized = false;
let rafId = null;

/**
 * Initialize the cube background
 */
export function initCubeBackground() {
  if (isInitialized) return;

  // Create container
  const cubeContainer = document.createElement('div');
  cubeContainer.className = 'cube-bg';

  const cubeWrapper = document.createElement('div');
  cubeWrapper.className = 'cube-wrapper';

  cubeGrid = document.createElement('div');
  cubeGrid.className = 'cube-grid';

  cubeWrapper.appendChild(cubeGrid);
  cubeContainer.appendChild(cubeWrapper);
  document.body.appendChild(cubeContainer);

  // Create cubes
  createCubes();

  // Set up event listeners
  window.addEventListener('scroll', handleScroll, passiveListener);
  window.addEventListener('mousemove', debounce(handleMouseMove, 10), passiveListener);
  window.addEventListener('resize', debounce(handleResize, 200));

  // Start animation loop
  startAnimationLoop();

  isInitialized = true;
}

/**
 * Create a few cubes positioned in 3D space
 */
function createCubes() {
  const { cubeCount, cubeSize, orbitRadius, depthRange } = CUBE_CONFIG;

  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();

  // Create just a few cubes positioned in 3D space
  for (let i = 0; i < cubeCount; i++) {
    // Create cube element
    const cube = document.createElement('div');
    cube.className = 'cube';

    // Vary cube sizes for depth perception
    const sizeVariation = 0.7 + Math.random() * 0.6; // 70% to 130% of base size
    const actualSize = cubeSize * sizeVariation;

    // Set cube CSS variables
    cube.style.setProperty('--cube-size', `${actualSize / 2}px`);

    // Position cubes in a 3D arrangement within viewport bounds
    const angle = (i / cubeCount) * Math.PI * 2; // Distribute around a circle
    const radiusVariation = 0.3 + Math.random() * 0.4; // Smaller variation to stay in bounds
    const posX = Math.cos(angle) * orbitRadius * radiusVariation;
    const posY = Math.sin(angle) * orbitRadius * radiusVariation * 0.5; // Keep Y movement contained
    const posZ = (Math.random() - 0.5) * depthRange; // Controlled Z positioning

    cube.style.width = `${actualSize}px`;
    cube.style.height = `${actualSize}px`;
    cube.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px)`;

    // Add accent styling to some cubes
    if (i % 2 === 0) {
      const accentTypes = ['accent', 'accent-blue'];
      const randomAccent = accentTypes[Math.floor(Math.random() * accentTypes.length)];
      cube.classList.add(`cube--${randomAccent}`);
    }

    // Create cube faces
    const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    faces.forEach((face) => {
      const cubeFace = document.createElement('div');
      cubeFace.className = `cube-face cube-face--${face}`;
      cube.appendChild(cubeFace);
    });

    // Store cube data with 3D movement parameters
    cubes.push({
      element: cube,
      index: i,
      initialX: posX,
      initialY: posY,
      initialZ: posZ,
      size: actualSize,
      baseOpacity: 0.4 + Math.random() * 0.6,
      orbitSpeed: 0.3 + Math.random() * 0.4, // Speed of 3D orbit
      rotationSpeed: 0.5 + Math.random() * 1.0,
      orbitAngle: angle, // Starting orbit angle
      orbitRadius: Math.min(orbitRadius * radiusVariation, Math.min(window.innerWidth, window.innerHeight) * 0.3),
      depthOffset: Math.random() * Math.PI * 2, // Phase offset for depth movement
    });

    fragment.appendChild(cube);
  }

  // Append all cubes at once
  cubeGrid.appendChild(fragment);

  // Animate cubes in with staggered delay
  cubes.forEach((cube, index) => {
    setTimeout(
      () => {
        cube.element.style.opacity = cube.baseOpacity;
        cube.element.style.transition = 'opacity 1.5s ease';
      },
      index * 200, // Stagger the appearance
    );
  });
}

/**
 * Handle scroll events
 */
function handleScroll() {
  scrollY = window.scrollY;
}

/**
 * Handle mouse movement
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseMove(e) {
  // Get mouse position relative to the center of the screen
  mouseX = (e.clientX - window.innerWidth / 2) * CUBE_CONFIG.mouseFactor;
  mouseY = (e.clientY - window.innerHeight / 2) * CUBE_CONFIG.mouseFactor;
}

/**
 * Handle window resize
 */
function handleResize() {
  // Recalculate orbit constraints based on new viewport size
  cubes.forEach((cube) => {
    const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
    cube.orbitRadius = Math.min(cube.orbitRadius, maxRadius);
  });
}

/**
 * Start the animation loop
 */
function startAnimationLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }

  // Calculate target rotation based on scroll and mouse position
  function updateRotation() {
    const time = Date.now() * 0.001; // Time in seconds

    // Calculate rotation based on scroll and mouse with contained movement
    targetRotationX = 60 + scrollY * CUBE_CONFIG.scrollFactor + Math.sin(time * 0.1) * 5;
    targetRotationY = mouseX * 2 + Math.cos(time * 0.15) * 3;
    currentRotationZ += 0.05; // Slower continuous Z rotation

    // Smooth interpolation for rotation
    currentRotationX += (targetRotationX - currentRotationX) * 0.03;
    currentRotationY += (targetRotationY - currentRotationY) * 0.03;

    // Apply rotation to grid with contained effects
    cubeGrid.style.transform = `
      translate(-50%, -50%)
      rotateX(${currentRotationX}deg) 
      rotateY(${currentRotationY}deg) 
      rotateZ(${currentRotationZ}deg) 
      scale(${1 + Math.sin(time * 0.2) * 0.03})
    `;

    // 3D orbital movement for each cube within viewport bounds
    cubes.forEach((cube, index) => {
      const cubeTime = time + index * 0.2; // Offset timing per cube

      // Calculate viewport-constrained movement
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const maxRadius = Math.min(viewportWidth, viewportHeight) * 0.25; // 25% of smallest viewport dimension

      // 3D orbital movement that stays within bounds
      cube.orbitAngle += cube.orbitSpeed * 0.01; // Slow orbital movement
      
      const constrainedRadius = Math.min(cube.orbitRadius, maxRadius);
      const moveX = Math.cos(cube.orbitAngle) * constrainedRadius;
      const moveY = Math.sin(cube.orbitAngle) * constrainedRadius * 0.5; // Keep Y movement smaller
      
      // Controlled Z movement to show 3D space but stay visible
      const moveZ = cube.initialZ + Math.sin(cubeTime * 0.3 + cube.depthOffset) * 150;

      // Slow, continuous rotation to show all faces
      const rotateX = cubeTime * cube.rotationSpeed * 15;
      const rotateY = cubeTime * cube.rotationSpeed * 20;
      const rotateZ = cubeTime * cube.rotationSpeed * 10;

      // Subtle scale based on Z position (perspective effect)
      const perspectiveScale = 1 + (moveZ / 1000) * 0.2;

      // Apply all transformations
      cube.element.style.transform = `
        translate3d(${moveX}px, ${moveY}px, ${moveZ}px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        rotateZ(${rotateZ}deg) 
        scale(${perspectiveScale})
      `;

      // Opacity based on Z position (depth fade)
      const depthOpacity = Math.max(0.3, cube.baseOpacity + (moveZ / 600) * 0.2);
      cube.element.style.opacity = Math.min(1, depthOpacity);
    });

    rafId = requestAnimationFrame(updateRotation);
  }

  rafId = requestAnimationFrame(updateRotation);
}

/**
 * Destroy the cube background
 */
export function destroyCubeBackground() {
  if (!isInitialized) return;

  // Clean up event listeners
  window.removeEventListener('scroll', handleScroll, passiveListener);
  window.removeEventListener('mousemove', handleMouseMove, passiveListener);
  window.removeEventListener('resize', handleResize);

  // Cancel animation frame
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Remove elements
  const cubeContainer = document.querySelector('.cube-bg');
  if (cubeContainer) {
    document.body.removeChild(cubeContainer);
  }

  // Reset variables
  cubes = [];
  cubeGrid = null;
  isInitialized = false;
}
