/**
 * Main JavaScript file
 * Initializes all components and features
 */

// Import utility modules
import { initNavigation } from "./modules/navigation.js";
import {
  animateHeroTitle,
  initScrollAnimations,
  createParticles,
  initParallax,
  initEntranceAnimations,
} from "./modules/animations.js";
import { initCubeBackground } from "./modules/cube-bg.js"; // Import the cube background module

/**
 * Initialize the site when DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize navigation menu
  initNavigation();

  // Initialize scrolling animations
  initScrollAnimations();

  // Initialize parallax effects (Consider if this conflicts visually with cube bg)
  initParallax();

  // Animate hero section elements with slight delay for smoother loading
  setTimeout(() => {
    animateHeroTitle();
  }, 500);

  // Initialize particles effect OR Cube Background on desktop devices
  // Choose one or adjust styling if using both
  if (window.innerWidth > 768) {
    // Option 1: Only Cube Background
    initCubeBackground();

    // Option 2: Only Particles (Keep original code)
    // createParticles();

    // Option 3: Both (Ensure they don't visually clash heavily)
    // initCubeBackground();
    // createParticles(); // You might want to reduce particle count/opacity if using both
  }

  // Initialize entrance animations for sections
  initEntranceAnimations();

  // Update footer year
  updateFooterYear();
});

/**
 * Updates the current year in the footer
 */
function updateFooterYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
