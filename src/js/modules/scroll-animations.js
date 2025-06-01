/**
 * Scroll-Controlled Background Animations
 * Creates different animated backgrounds for each section based on scroll position
 */

import { debounce, passiveListener } from './utils.js';

// Animation configurations for each section
const SECTION_CONFIGS = {
  home: {
    type: 'particles',
    config: {
      particleCount: 60,
      colors: ['#ffffff', '#89cffd', '#ffd646', '#4eff8a'],
      maxSize: 4,
      speed: 0.5,
      mouseInteraction: true,
      connections: true,
      connectionDistance: 120,
    }
  },
  projects: {
    type: 'geometric',
    config: {
      shapeCount: 20,
      colors: ['#ff2e2e', '#89cffd', '#ffd646', '#4eff8a', '#a855f7', '#fb925c'],
      maxSize: 80,
      rotationSpeed: 0.8,
      floatRange: 30,
      morphing: true,
    }
  },
  skills: {
    type: 'matrix',
    config: {
      gridSize: { x: 12, y: 8 },
      colors: ['#ffffff', '#89cffd', '#4eff8a'],
      pulseSpeed: 1.2,
      waveEffect: true,
      glitch: true,
    }
  },
  contact: {
    type: 'waves',
    config: {
      waveCount: 4,
      colors: ['#ff2e2e', '#89cffd', '#ffd646', '#a855f7'],
      amplitude: 50,
      frequency: 0.02,
      speed: 1.5,
      opacity: 0.6,
    }
  }
};

let currentSection = 'home';
let animationContainer;
let currentAnimation = null;
let rafId = null;
let scrollY = 0;
let mouseX = 0;
let mouseY = 0;
let isInitialized = false;

/**
 * Initialize the scroll-controlled animation system
 */
export function initScrollAnimations() {
  if (isInitialized) return;

  createAnimationContainer();
  setupEventListeners();
  startAnimationLoop();
  
  // Initialize with home section animation
  switchAnimation('home');
  
  isInitialized = true;
}

/**
 * Create the main animation container
 */
function createAnimationContainer() {
  animationContainer = document.createElement('div');
  animationContainer.className = 'scroll-animations';
  animationContainer.innerHTML = `
    <canvas class="animation-canvas"></canvas>
    <div class="animation-overlay"></div>
  `;
  document.body.appendChild(animationContainer);
}

/**
 * Setup event listeners for scroll and mouse interaction
 */
function setupEventListeners() {
  // Scroll handler with section detection
  window.addEventListener('scroll', debounce(() => {
    scrollY = window.scrollY;
    detectCurrentSection();
  }, 16), passiveListener);

  // Mouse movement for interactive effects
  window.addEventListener('mousemove', debounce((e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, 16), passiveListener);

  // Window resize
  window.addEventListener('resize', debounce(() => {
    if (currentAnimation && currentAnimation.resize) {
      currentAnimation.resize();
    }
  }, 200));
}

/**
 * Detect which section is currently in view
 */
function detectCurrentSection() {
  const sections = document.querySelectorAll('section');
  const viewportCenter = window.innerHeight / 2;
  
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
      const sectionId = section.id;
      if (sectionId !== currentSection) {
        switchAnimation(sectionId);
      }
      break;
    }
  }
}

/**
 * Switch to a different animation based on section
 */
function switchAnimation(sectionId) {
  if (!SECTION_CONFIGS[sectionId]) return;
  
  currentSection = sectionId;
  
  // Clean up current animation
  if (currentAnimation && currentAnimation.destroy) {
    currentAnimation.destroy();
  }
  
  // Create new animation
  const config = SECTION_CONFIGS[sectionId];
  currentAnimation = createAnimation(config.type, config.config);
  
  // Update container class for styling
  animationContainer.className = `scroll-animations scroll-animations--${sectionId}`;
}

/**
 * Create animation instance based on type
 */
function createAnimation(type, config) {
  const canvas = animationContainer.querySelector('.animation-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  switch (type) {
    case 'particles':
      return new ParticleAnimation(ctx, canvas, config);
    case 'geometric':
      return new GeometricAnimation(ctx, canvas, config);
    case 'matrix':
      return new MatrixAnimation(ctx, canvas, config);
    case 'waves':
      return new WaveAnimation(ctx, canvas, config);
    default:
      return new ParticleAnimation(ctx, canvas, config);
  }
}

/**
 * Particle Animation for Home section
 */
class ParticleAnimation {
  constructor(ctx, canvas, config) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.config = config;
    this.particles = [];
    this.connections = [];
    
    this.createParticles();
  }
  
  createParticles() {
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        size: Math.random() * this.config.maxSize,
        color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
  }
  
  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      // Mouse interaction
      if (this.config.mouseInteraction) {
        const mouseInfluence = 100;
        const dx = (mouseX * this.canvas.width / 2 + this.canvas.width / 2) - particle.x;
        const dy = (mouseY * this.canvas.height / 2 + this.canvas.height / 2) - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseInfluence) {
          const force = (mouseInfluence - distance) / mouseInfluence;
          particle.vx += dx * force * 0.001;
          particle.vy += dy * force * 0.001;
        }
      }
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Draw particle
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
    
    // Draw connections
    if (this.config.connections) {
      this.drawConnections();
    }
  }
  
  drawConnections() {
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.config.connectionDistance) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
    
    this.ctx.restore();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  destroy() {
    this.particles = [];
    this.connections = [];
  }
}

/**
 * Geometric Animation for Projects section
 */
class GeometricAnimation {
  constructor(ctx, canvas, config) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.config = config;
    this.shapes = [];
    this.time = 0;
    
    this.createShapes();
  }
  
  createShapes() {
    for (let i = 0; i < this.config.shapeCount; i++) {
      this.shapes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 20 + Math.random() * this.config.maxSize,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * this.config.rotationSpeed,
        color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
        shape: Math.floor(Math.random() * 3), // 0: circle, 1: triangle, 2: square
        floatOffset: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.6,
      });
    }
  }
  
  update() {
    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.shapes.forEach(shape => {
      // Update rotation
      shape.rotation += shape.rotationSpeed * 0.016;
      
      // Floating motion
      const floatY = shape.y + Math.sin(this.time + shape.floatOffset) * this.config.floatRange;
      
      // Draw shape
      this.ctx.save();
      this.ctx.translate(shape.x, floatY);
      this.ctx.rotate(shape.rotation);
      this.ctx.globalAlpha = shape.alpha;
      this.ctx.fillStyle = shape.color;
      
      if (shape.shape === 0) {
        // Circle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (shape.shape === 1) {
        // Triangle
        this.ctx.beginPath();
        this.ctx.moveTo(0, -shape.size / 2);
        this.ctx.lineTo(-shape.size / 2, shape.size / 2);
        this.ctx.lineTo(shape.size / 2, shape.size / 2);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // Square
        this.ctx.fillRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
      }
      
      this.ctx.restore();
    });
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  destroy() {
    this.shapes = [];
  }
}

/**
 * Matrix Animation for Skills section
 */
class MatrixAnimation {
  constructor(ctx, canvas, config) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.config = config;
    this.grid = [];
    this.time = 0;
    
    this.createGrid();
  }
  
  createGrid() {
    const cellWidth = this.canvas.width / this.config.gridSize.x;
    const cellHeight = this.canvas.height / this.config.gridSize.y;
    
    for (let x = 0; x < this.config.gridSize.x; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.config.gridSize.y; y++) {
        this.grid[x][y] = {
          x: x * cellWidth + cellWidth / 2,
          y: y * cellHeight + cellHeight / 2,
          size: 8 + Math.random() * 12,
          pulsePhase: Math.random() * Math.PI * 2,
          color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
          active: Math.random() > 0.7,
        };
      }
    }
  }
  
  update() {
    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let x = 0; x < this.config.gridSize.x; x++) {
      for (let y = 0; y < this.config.gridSize.y; y++) {
        const cell = this.grid[x][y];
        
        if (cell.active) {
          const pulse = Math.sin(this.time * this.config.pulseSpeed + cell.pulsePhase) * 0.5 + 0.5;
          const alpha = 0.1 + pulse * 0.8;
          
          this.ctx.save();
          this.ctx.globalAlpha = alpha;
          this.ctx.fillStyle = cell.color;
          this.ctx.beginPath();
          this.ctx.arc(cell.x, cell.y, cell.size * (0.5 + pulse * 0.5), 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }
    
    // Randomly activate/deactivate cells
    if (Math.random() < 0.02) {
      const x = Math.floor(Math.random() * this.config.gridSize.x);
      const y = Math.floor(Math.random() * this.config.gridSize.y);
      this.grid[x][y].active = !this.grid[x][y].active;
    }
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createGrid();
  }
  
  destroy() {
    this.grid = [];
  }
}

/**
 * Wave Animation for Contact section
 */
class WaveAnimation {
  constructor(ctx, canvas, config) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.config = config;
    this.time = 0;
    this.waves = [];
    
    this.createWaves();
  }
  
  createWaves() {
    for (let i = 0; i < this.config.waveCount; i++) {
      this.waves.push({
        color: this.config.colors[i % this.config.colors.length],
        offset: i * 50,
        speed: this.config.speed * (0.8 + Math.random() * 0.4),
        amplitude: this.config.amplitude * (0.6 + Math.random() * 0.8),
        frequency: this.config.frequency * (0.8 + Math.random() * 0.4),
      });
    }
  }
  
  update() {
    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.waves.forEach((wave, index) => {
      this.ctx.save();
      this.ctx.globalAlpha = this.config.opacity;
      this.ctx.fillStyle = wave.color;
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.canvas.height);
      
      for (let x = 0; x <= this.canvas.width; x += 5) {
        const y = this.canvas.height / 2 + 
                 Math.sin(x * wave.frequency + this.time * wave.speed + wave.offset) * wave.amplitude +
                 Math.sin(x * wave.frequency * 2 + this.time * wave.speed * 1.5) * wave.amplitude * 0.5;
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.lineTo(this.canvas.width, this.canvas.height);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    });
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  destroy() {
    this.waves = [];
  }
}

/**
 * Main animation loop
 */
function startAnimationLoop() {
  function animate() {
    if (currentAnimation && currentAnimation.update) {
      currentAnimation.update();
    }
    rafId = requestAnimationFrame(animate);
  }
  
  rafId = requestAnimationFrame(animate);
}

/**
 * Destroy the scroll animation system
 */
export function destroyScrollAnimations() {
  if (!isInitialized) return;
  
  // Cancel animation frame
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  
  // Clean up current animation
  if (currentAnimation && currentAnimation.destroy) {
    currentAnimation.destroy();
  }
  
  // Remove container
  if (animationContainer) {
    document.body.removeChild(animationContainer);
    animationContainer = null;
  }
  
  // Remove event listeners
  window.removeEventListener('scroll', detectCurrentSection);
  window.removeEventListener('mousemove', () => {});
  window.removeEventListener('resize', () => {});
  
  // Reset state
  currentAnimation = null;
  currentSection = 'home';
  isInitialized = false;
}