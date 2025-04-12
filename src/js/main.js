import anime from "animejs/lib/anime.es.js";

// Use passive event listeners for scroll and touch events
const passiveSupported = () => {
  let passive = false;
  try {
    const options = {
      get passive() {
        passive = true;
        return true;
      }
    };
    window.addEventListener("test", null, options);
    window.removeEventListener("test", null, options);
  } catch (err) {}
  return passive;
};

const passiveListener = passiveSupported() ? { passive: true } : false;

// Debounce function to limit expensive operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize custom cursor
  initCursor();

  // Initialize navigation menu
  initNavigation();

  // Animate home section elements
  setTimeout(() => {
    animateHeroTitle();
  }, 500);

  // Initialize scrolling animations
  initScrollAnimations();

  // Add active class to navigation links based on scroll position - debounced for performance
  window.addEventListener("scroll", debounce(() => {
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
  }, 100), passiveListener);

  // Initialize particles on load - only on desktop
  if (window.innerWidth > 768) {
    createParticles();
  }
});

// Custom cursor - optimized
function initCursor() {
  const cursor = document.querySelector(".cursor");
  
  if (!cursor) return; // Guard clause
  
  // Use RAF for smoother cursor movement
  let cursorX = 0;
  let cursorY = 0;
  let requestId;

  const renderCursor = () => {
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestId = requestAnimationFrame(renderCursor);
  };
  
  requestId = requestAnimationFrame(renderCursor);

  // Optimize mousemove with RAF
  document.addEventListener("mousemove", (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }, passiveListener);

  // Cursor effects on hover - use event delegation for better performance
  document.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (target.matches("a, button, .project-image")) {
      cursor.style.width = "60px";
      cursor.style.height = "60px";
      cursor.style.opacity = "0.5";
    }
  }, passiveListener);

  document.addEventListener("mouseout", (e) => {
    const target = e.target;
    if (target.matches("a, button, .project-image")) {
      cursor.style.width = "30px";
      cursor.style.height = "30px";
      cursor.style.opacity = "1";
    }
  }, passiveListener);

  // Hide cursor when leaving window
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      cursor.style.opacity = "0";
    }
  }, passiveListener);

  document.addEventListener("mouseover", () => {
    cursor.style.opacity = "1";
  }, passiveListener);
}

// Initialize navigation
function initNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const navLinks = document.querySelectorAll(".nav-link");
  
  if (!menuToggle || !mainNav) return; // Guard clause

  // Set initial index for staggered animations
  navLinks.forEach((link, index) => {
    link.style.setProperty("--index", index);
  });

  menuToggle.addEventListener("click", () => {
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
  });

  // Close menu when clicking a link
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
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
    });
  });
}

// Animate hero title - optimized
function animateHeroTitle() {
  const titleLines = document.querySelectorAll(".title-line");
  const heroTitle = document.querySelector(".hero-title");
  
  if (!titleLines.length || !heroTitle) return; // Guard clause

  // Set initial index for staggered animations
  titleLines.forEach((line, index) => {
    line.style.setProperty("--index", index);
    line.classList.add("active");
  });

  // Use RAF for smoother animation
  let moveX = 0;
  let moveY = 0;
  let animationFrameId;

  const updateHeroPosition = () => {
    heroTitle.style.transform = `translate(${moveX}px, ${moveY}px)`;
    animationFrameId = requestAnimationFrame(updateHeroPosition);
  };

  // Only run the magnetic effect on desktop
  if (window.innerWidth > 768) {
    // Add magnetic effect to hero title with debounce
    const handleMouseMove = debounce((e) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = heroTitle.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const deltaX = (clientX - centerX) / (width / 2);
      const deltaY = (clientY - centerY) / (height / 2);

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 2;
      const scaleFactor = Math.min(distance / maxDistance, 1);

      moveX = deltaX * 20 * scaleFactor;
      moveY = deltaY * 10 * scaleFactor;
    }, 10);

    document.addEventListener("mousemove", handleMouseMove, passiveListener);

    document.addEventListener("mouseleave", () => {
      moveX = 0;
      moveY = 0;
    });

    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateHeroPosition);
  }
}

// Initialize scroll animations - optimized with IntersectionObserver
function initScrollAnimations() {
  // Configure the intersection observer
  const options = {
    root: null, // viewport
    rootMargin: "0px",
    threshold: 0.1, // 10% of the element visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  }, options);

  // Observe elements - more specific selectors for better performance
  document.querySelectorAll(
    ".project-item, .about-text, .services-grid, .team-title, .skill-category, .contact-title, .contact-item, .section"
  ).forEach((element) => {
    observer.observe(element);
  });

  // Set index for staggered animations
  document.querySelectorAll(".skill-category").forEach((category, index) => {
    category.style.setProperty("--index", index);
  });

  document.querySelectorAll(".contact-item").forEach((item, index) => {
    item.style.setProperty("--index", index);
  });
}

// Create animated background particle effect - optimized
function createParticles() {
  const numParticles = Math.min(15, Math.floor(window.innerWidth / 100)); // Fewer particles on smaller screens
  const container = document.createElement("div");
  container.className = "particles-container";

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

  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement("div");
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
  }

  // Append all particles at once
  container.appendChild(fragment);
  document.body.appendChild(container);

  // Batch animation for better performance
  anime({
    targets: container.childNodes,
    translateX: () => anime.random(-70, 70) + 'px',
    translateY: () => anime.random(-70, 70) + 'px',
    scale: [
      { value: anime.random(1, 2), duration: anime.random(2000, 5000), easing: "easeInOutQuad" },
      { value: 1, duration: anime.random(2000, 5000), easing: "easeInOutQuad" }
    ],
    opacity: [
      { value: anime.random(0.05, 0.2), duration: anime.random(2000, 5000), easing: "easeInOutQuad" },
      { value: 0, duration: anime.random(2000, 5000), easing: "easeInOutQuad" }
    ],
    delay: anime.stagger(200),
    direction: "alternate",
    loop: true
  });
}

// Add parallax effect on mouse move - optimized with debounce and RAF
const parallaxItems = { projectImages: [], heroTitle: null };

// Add requestAnimationFrame for smoother parallax
let rafId = null;
let moveX = 0;
let moveY = 0;

function updateParallaxElements() {
  if (parallaxItems.projectImages.length) {
    parallaxItems.projectImages.forEach((image) => {
      image.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  }

  if (parallaxItems.heroTitle) {
    parallaxItems.heroTitle.style.transform = `translate(${moveX * 2}px, ${moveY * 2}px)`;
  }

  rafId = requestAnimationFrame(updateParallaxElements);
}

// Cache DOM references on load
document.addEventListener("DOMContentLoaded", () => {
  parallaxItems.projectImages = Array.from(document.querySelectorAll(".project-image"));
  parallaxItems.heroTitle = document.querySelector(".hero-title");
  
  // Only start parallax on desktop
  if (window.innerWidth > 768 && 
      (parallaxItems.projectImages.length || parallaxItems.heroTitle)) {
    // Start animation loop
    rafId = requestAnimationFrame(updateParallaxElements);
  }
});

// Use debounce to limit calculations
document.addEventListener("mousemove", debounce((e) => {
  moveX = (e.clientX - window.innerWidth / 2) * 0.005; // Reduced intensity
  moveY = (e.clientY - window.innerHeight / 2) * 0.005;
}, 10), passiveListener);

// Optimize initial section reveal animation
document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    anime({
      targets: ".section",
      opacity: [0, 1],
      translateY: [30, 0], // Reduced distance for better performance
      duration: 1200,
      easing: "easeOutExpo",
      delay: anime.stagger(150),
    });
  });
});

// Update footer year
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
