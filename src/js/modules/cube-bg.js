/**
 * Cube Background Animation
 * Creates and animates the 3D cube grid that responds to scrolling
 */

import { debounce, passiveListener } from './utils.js';

// Configuration
const CUBE_CONFIG = {
  gridSize: { x: 6, y: 4 }, // Number of cubes in grid (reduced for performance)
  cubeSize: 60, // Size of each cube in pixels
  spacing: 150, // Spacing between cubes
  maxRotation: 0.15, // Maximum rotation value
  scrollFactor: 0.004, // How much scroll affects rotation
  mouseFactor: 0.003, // How much mouse movement affects rotation
  animationDuration: 1000, // Animation duration in ms
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
 * Create the cube grid
 */
function createCubes() {
  const { gridSize, cubeSize, spacing } = CUBE_CONFIG;
  const totalWidth = spacing * (gridSize.x - 1);
  const totalHeight = spacing * (gridSize.y - 1);

  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();

  // Create cubes
  for (let x = 0; x < gridSize.x; x++) {
    for (let y = 0; y < gridSize.y; y++) {
      // Create cube element
      const cube = document.createElement('div');
      cube.className = 'cube';

      // Set cube CSS variables
      cube.style.setProperty('--cube-size', `${cubeSize / 2}px`);

      // Position in 3D space
      const posX = x * spacing - totalWidth / 2;
      const posY = y * spacing - totalHeight / 2;
      const posZ = 0;

      cube.style.width = `${cubeSize}px`;
      cube.style.height = `${cubeSize}px`;
      cube.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px)`;

      // Add special styling to some cubes
      if (Math.random() > 0.85) {
        const accentTypes = [
          'accent',
          'accent-red',
          'accent-blue',
          'accent-yellow',
          'accent-green',
        ];
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

      // Store cube data
      cubes.push({
        element: cube,
        x,
        y,
        initialX: posX,
        initialY: posY,
        initialZ: posZ,
        depth: Math.random() * 200 - 100, // Random depth for parallax effect
      });

      fragment.appendChild(cube);
    }
  }

  // Append all cubes at once
  cubeGrid.appendChild(fragment);

  // Animate cubes in with staggered delay for initial appearance
  cubes.forEach((cube, index) => {
    setTimeout(
      () => {
        cube.element.style.opacity = 0.5 + Math.random() * 0.5;
        cube.element.style.transition = 'opacity 1s ease, transform 0.6s ease';
      },
      100 + index * 50,
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
  // Recalculate cube positions
  const { spacing, gridSize } = CUBE_CONFIG;
  const totalWidth = spacing * (gridSize.x - 1);
  const totalHeight = spacing * (gridSize.y - 1);

  cubes.forEach((cube) => {
    const posX = cube.x * spacing - totalWidth / 2;
    const posY = cube.y * spacing - totalHeight / 2;

    cube.initialX = posX;
    cube.initialY = posY;

    cube.element.style.transform = `translate3d(${posX}px, ${posY}px, ${cube.initialZ}px)`;
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
    // Calculate rotation based on scroll
    targetRotationX = 60 + scrollY * CUBE_CONFIG.scrollFactor;
    targetRotationY = mouseX * 2;

    // Smooth interpolation for rotation
    currentRotationX += (targetRotationX - currentRotationX) * 0.05;
    currentRotationY += (targetRotationY - currentRotationY) * 0.05;

    // Apply rotation to grid
    cubeGrid.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg) rotateZ(${currentRotationZ}deg)`;

    // Subtle movement for each cube
    cubes.forEach((cube) => {
      const moveZ = cube.depth + Math.sin(Date.now() * 0.001 + cube.x) * 10;
      const moveX = cube.initialX + Math.sin(Date.now() * 0.0005 + cube.y) * 5;
      const moveY = cube.initialY;

      cube.element.style.transform = `translate3d(${moveX}px, ${moveY}px, ${moveZ}px)`;
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
