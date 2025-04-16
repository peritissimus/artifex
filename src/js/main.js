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

/**
 * Initialize the site when DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize navigation menu
  initNavigation();

  // Initialize scrolling animations
  initScrollAnimations();

  // Initialize parallax effects
  initParallax();

  // Animate hero section elements with slight delay for smoother loading
  setTimeout(() => {
    animateHeroTitle();
  }, 500);

  // Initialize particles effect on desktop devices
  if (window.innerWidth > 768) {
    createParticles();
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
