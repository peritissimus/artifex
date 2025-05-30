/**
 * Cube Background Animation
 * Creates and animates the 3D cube grid that responds to scrolling
 */

import { debounce, passiveListener } from './utils.js';

// Configuration
const CUBE_CONFIG = {
  gridSize: { x: 8, y: 6 }, // More cubes for fuller coverage
  cubeSize: 120, // Much bigger cubes
  spacing: 200, // More spacing for the bigger cubes
  maxRotation: 0.3, // More dramatic rotation
  scrollFactor: 0.008, // More scroll sensitivity
  mouseFactor: 0.006, // More mouse sensitivity
  animationDuration: 1500, // Longer animation duration
  pulseIntensity: 0.3, // How much cubes pulse in size
  driftRange: 50, // How far cubes drift from their position
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

      // Vary cube sizes for more dynamic look
      const sizeVariation = 0.6 + Math.random() * 0.8; // 60% to 140% of base size
      const actualSize = cubeSize * sizeVariation;
      
      // Set cube CSS variables
      cube.style.setProperty('--cube-size', `${actualSize / 2}px`);

      // Position in 3D space with some random offset
      const posX = x * spacing - totalWidth / 2 + (Math.random() - 0.5) * 40;
      const posY = y * spacing - totalHeight / 2 + (Math.random() - 0.5) * 40;
      const posZ = (Math.random() - 0.5) * 100; // Random Z positioning

      cube.style.width = `${actualSize}px`;
      cube.style.height = `${actualSize}px`;
      cube.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px)`;

      // Add special styling to more cubes for more drama
      if (Math.random() > 0.6) { // Increased from 0.85 to 0.6
        const accentTypes = [
          'accent',
          'accent-red',
          'accent-blue',
          'accent-yellow',
          'accent-green',
          'accent-purple',
          'accent-orange',
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
        size: actualSize,
        baseOpacity: 0.3 + Math.random() * 0.7, // Varied opacity
        rotationSpeed: 0.5 + Math.random() * 1.5, // Individual rotation speeds
        depth: Math.random() * 400 - 200, // Deeper parallax effect
        pulsePhase: Math.random() * Math.PI * 2, // Random pulse timing
      });

      fragment.appendChild(cube);
    }
  }

  // Append all cubes at once
  cubeGrid.appendChild(fragment);

  // Animate cubes in with more dramatic staggered delay
  cubes.forEach((cube, index) => {
    setTimeout(
      () => {
        cube.element.style.opacity = cube.baseOpacity;
        cube.element.style.transition = 'opacity 2s ease, transform 1.2s ease';
        cube.element.style.transform += ' scale(1)';
      },
      50 + index * 30, // Faster stagger for more cubes
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
    const time = Date.now() * 0.001; // Time in seconds
    
    // Calculate rotation based on scroll and mouse with more intensity
    targetRotationX = 60 + scrollY * CUBE_CONFIG.scrollFactor + Math.sin(time * 0.1) * 10;
    targetRotationY = mouseX * 3 + Math.cos(time * 0.15) * 5;
    currentRotationZ += 0.1; // Continuous Z rotation

    // Smooth interpolation for rotation
    currentRotationX += (targetRotationX - currentRotationX) * 0.03; // Slower, more fluid
    currentRotationY += (targetRotationY - currentRotationY) * 0.03;

    // Apply rotation to grid with more dramatic effects
    cubeGrid.style.transform = `
      rotateX(${currentRotationX}deg) 
      rotateY(${currentRotationY}deg) 
      rotateZ(${currentRotationZ}deg) 
      scale(${1 + Math.sin(time * 0.2) * 0.05})
    `;

    // Much more dynamic movement for each cube
    cubes.forEach((cube, index) => {
      const cubeTime = time + index * 0.1; // Offset timing per cube
      
      // Complex movement patterns
      const moveZ = cube.depth + 
        Math.sin(cubeTime * cube.rotationSpeed) * CUBE_CONFIG.driftRange +
        Math.cos(cubeTime * 0.5) * 20;
        
      const moveX = cube.initialX + 
        Math.sin(cubeTime * 0.7 + cube.y) * 30 +
        Math.cos(cubeTime * 0.3) * 15;
        
      const moveY = cube.initialY + 
        Math.cos(cubeTime * 0.8 + cube.x) * 25 +
        Math.sin(cubeTime * 0.4) * 10;

      // Individual cube rotation
      const rotateX = Math.sin(cubeTime * cube.rotationSpeed) * 360;
      const rotateY = Math.cos(cubeTime * cube.rotationSpeed * 0.7) * 360;
      const rotateZ = time * cube.rotationSpeed * 20;

      // Pulsing scale effect
      const pulseScale = 1 + Math.sin(cubeTime * 2 + cube.pulsePhase) * CUBE_CONFIG.pulseIntensity;

      // Apply all transformations
      cube.element.style.transform = `
        translate3d(${moveX}px, ${moveY}px, ${moveZ}px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        rotateZ(${rotateZ}deg) 
        scale(${pulseScale})
      `;

      // Dynamic opacity changes
      const opacityVariation = Math.sin(cubeTime * 1.5 + cube.pulsePhase) * 0.3;
      cube.element.style.opacity = Math.max(0.1, cube.baseOpacity + opacityVariation);
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
