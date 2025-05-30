/**
 * Animation functionality
 * Manages all animations throughout the site
 */

import anime from 'animejs';
import { debounce, passiveListener } from './utils.js';

/**
 * Animate hero title with staggered appearance
 */
export function animateHeroTitle() {
  const titleLines = document.querySelectorAll('.title-line');

  if (!titleLines.length) return; // Guard clause

  // Add active class to show the text with staggered timing
  titleLines.forEach((line, index) => {
    line.style.setProperty('--index', index);
    line.classList.add('active');
  });
}

/**
 * Initialize scroll-based animations using IntersectionObserver
 */
export function initScrollAnimations() {
  // Configure the intersection observer
  const options = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.1, // 10% of the element visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, options);

  // Observe elements - more specific selectors for better performance
  document
    .querySelectorAll(
      '.project-item, .about-text, .services-grid, .team-title, .skill-category, .contact-title, .contact-item, .section',
    )
    .forEach((element) => {
      observer.observe(element);
    });

  // Immediately activate visible elements on page load
  document.querySelectorAll('.project-item, .section').forEach((element) => {
    element.classList.add('active');
  });

  // Set index for staggered animations
  document.querySelectorAll('.skill-category').forEach((category, index) => {
    category.style.setProperty('--index', index);
  });

  document.querySelectorAll('.contact-item').forEach((item, index) => {
    item.style.setProperty('--index', index);
  });
}

/**
 * Create animated background particles
 * Optimized for performance with reduced DOM operations
 */
export function createParticles() {
  // Skip on mobile devices
  if (window.innerWidth <= 768) return;

  const numParticles = Math.min(15, Math.floor(window.innerWidth / 100)); // Fewer particles on smaller screens
  const container = document.createElement('div');
  container.className = 'particles-container';

  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
  `;

  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  const particles = [];

  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 3 + 1; // Slightly smaller particles

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background-color: white;
      border-radius: 50%;
      opacity: ${Math.random() * 0.2};
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
    `;

    fragment.appendChild(particle);
    particles.push(particle);
  }

  // Append all particles at once
  container.appendChild(fragment);
  document.body.appendChild(container);

  // Batch animation for better performance
  anime({
    targets: particles,
    translateX: () => anime.random(-70, 70) + 'px',
    translateY: () => anime.random(-70, 70) + 'px',
    scale: [
      { value: anime.random(1, 2), duration: anime.random(2000, 5000), easing: 'easeInOutQuad' },
      { value: 1, duration: anime.random(2000, 5000), easing: 'easeInOutQuad' },
    ],
    opacity: [
      {
        value: anime.random(0.05, 0.2),
        duration: anime.random(2000, 5000),
        easing: 'easeInOutQuad',
      },
      { value: 0, duration: anime.random(2000, 5000), easing: 'easeInOutQuad' },
    ],
    delay: anime.stagger(200),
    direction: 'alternate',
    loop: true,
  });
}

/**
 * Initialize parallax effect on mouse movement
 * Using requestAnimationFrame for smoother animations
 */
export function initParallax() {
  // Only initialize on desktop
  if (window.innerWidth <= 768) return;

  const projectImages = Array.from(document.querySelectorAll('.project-image'));

  if (!projectImages.length) return;

  let moveX = 0;
  let moveY = 0;
  let rafId = null;

  function updateParallaxElements() {
    projectImages.forEach((image) => {
      image.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    rafId = requestAnimationFrame(updateParallaxElements);
  }

  // Start animation loop
  rafId = requestAnimationFrame(updateParallaxElements);

  // Use debounce to limit calculations
  document.addEventListener(
    'mousemove',
    debounce((e) => {
      moveX = (e.clientX - window.innerWidth / 2) * 0.005; // Reduced intensity
      moveY = (e.clientY - window.innerHeight / 2) * 0.005;
    }, 10),
    passiveListener,
  );
}

/**
 * Initialize entrance animations for sections
 */
export function initEntranceAnimations() {
  // Pre-calculate all positions first to avoid forced reflow
  const sections = document.querySelectorAll('.section');

  if (!sections.length) return;

  // Use transform for animations to avoid layout shifts
  requestAnimationFrame(() => {
    anime({
      targets: '.section',
      opacity: [0, 1],
      translateY: [30, 0], // Reduced distance for better performance
      duration: 1200,
      easing: 'easeOutExpo',
      delay: anime.stagger(150),
      // Use complete callback to add active class after animation for better stability
      complete: (anim) => {
        sections.forEach((section) => section.classList.add('animation-complete'));
      },
    });
  });
}

/**
 * Initialize all animations
 */
export function initAnimations() {
  console.log('🎬 Initializing animations...');

  // Initialize all animation modules
  animateHeroTitle();
  initScrollAnimations();
  createParticles();
  initParallax();
  initEntranceAnimations();

  console.log('✅ Animations initialized');
}
