/**
 * Navigation functionality
 * Handles navigation menu interactions
 */

import anime from "animejs/lib/anime.es.js";
import { debounce, passiveListener } from './utils.js';

/**
 * Initialize navigation functionality
 * Handles mobile menu toggle and smooth scrolling to sections
 */
export function initNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const navLinks = document.querySelectorAll(".nav-link");
  
  if (!menuToggle || !mainNav) return; // Guard clause

  // Set initial index for staggered animations
  navLinks.forEach((link, index) => {
    link.style.setProperty("--index", index);
  });

  // After page loads, enable transitions to prevent flashing
  // Wait a bit to ensure everything is fully rendered
  setTimeout(() => {
    mainNav.classList.add("transition-enabled");
  }, 300);
  
  menuToggle.addEventListener("click", () => {
    toggleMenu(menuToggle, mainNav);
  });

  // Close menu when clicking a link
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      handleNavLinkClick(e, link, menuToggle, mainNav);
    });
  });

  // Add active class to navigation links based on scroll position - debounced for performance
  window.addEventListener("scroll", debounce(() => {
    updateActiveNavLink();
  }, 100), passiveListener);
}

/**
 * Toggle the navigation menu state
 * @param {HTMLElement} menuToggle - The menu toggle button element
 * @param {HTMLElement} mainNav - The main navigation element
 */
function toggleMenu(menuToggle, mainNav) {
  menuToggle.classList.toggle("active");
  mainNav.classList.toggle("active");
  
  // Update ARIA attributes for accessibility
  const isExpanded = mainNav.classList.contains("active");
  menuToggle.setAttribute("aria-expanded", isExpanded);

  if (isExpanded) {
    // Animate nav links when menu opens
    anime({
      targets: ".nav-link",
      translateY: [30, 0],
      opacity: [0, 1],
      duration: 800,
      delay: anime.stagger(80),
      easing: "easeOutExpo",
    });
  }
}

/**
 * Handle navigation link click
 * @param {Event} e - Click event
 * @param {HTMLElement} link - The clicked navigation link
 * @param {HTMLElement} menuToggle - The menu toggle button
 * @param {HTMLElement} mainNav - The main navigation container
 */
function handleNavLinkClick(e, link, menuToggle, mainNav) {
  e.preventDefault();

  const targetId = link.getAttribute("href");
  const targetElement = document.querySelector(targetId);
  
  if (!targetElement) return;

  // Close menu
  menuToggle.classList.remove("active");
  mainNav.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");

  // Scroll to section after menu closes
  setTimeout(() => {
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 300);
}

/**
 * Update active navigation link based on scroll position
 */
function updateActiveNavLink() {
  const scrollPosition = window.scrollY;

  // Determine which section is visible
  document.querySelectorAll("section").forEach((section) => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.offsetHeight;

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      const currentId = section.getAttribute("id");

      // Update navigation links
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentId}`) {
          link.classList.add("active");
        }
      });
    }
  });
}
