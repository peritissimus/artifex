import anime from 'animejs/lib/anime.es.js';

document.addEventListener('DOMContentLoaded', () => {
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
  
  // Add active class to navigation links based on scroll position
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    
    // Determine which section is visible
    document.querySelectorAll('section').forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        const currentId = section.getAttribute('id');
        
        // Update navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${currentId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
});

// Custom cursor
function initCursor() {
  const cursor = document.querySelector('.cursor');
  
  document.addEventListener('mousemove', (e) => {
    anime({
      targets: cursor,
      left: e.clientX,
      top: e.clientY,
      duration: 50,
      easing: 'linear'
    });
  });
  
  // Cursor effects on hover
  document.querySelectorAll('a, button, .project-image').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '60px';
      cursor.style.height = '60px';
      cursor.style.opacity = '0.5';
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '30px';
      cursor.style.height = '30px';
      cursor.style.opacity = '1';
    });
  });
  
  // Hide cursor when leaving window
  document.addEventListener('mouseout', () => {
    cursor.style.opacity = '0';
  });
  
  document.addEventListener('mouseover', () => {
    cursor.style.opacity = '1';
  });
}

// Initialize navigation
function initNavigation() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Set initial index for staggered animations
  navLinks.forEach((link, index) => {
    link.style.setProperty('--index', index);
  });
  
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mainNav.classList.toggle('active');
    
    if (mainNav.classList.contains('active')) {
      // Animate nav links when menu opens
      anime({
        targets: '.nav-link',
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(100),
        easing: 'easeOutExpo'
      });
    }
  });
  
  // Close menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href');
      
      // Close menu
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      
      // Scroll to section after menu closes
      setTimeout(() => {
        document.querySelector(targetId).scrollIntoView({
          behavior: 'smooth'
        });
      }, 500);
    });
  });
}

// Animate hero title
function animateHeroTitle() {
  const titleLines = document.querySelectorAll('.title-line');
  
  // Set initial index for staggered animations
  titleLines.forEach((line, index) => {
    line.style.setProperty('--index', index);
    line.classList.add('active');
  });
  
  // Add magnetic effect to hero title
  const heroTitle = document.querySelector('.hero-title');
  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = heroTitle.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    const deltaX = (clientX - centerX) / (width / 2);
    const deltaY = (clientY - centerY) / (height / 2);
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 2;
    const scaleFactor = Math.min(distance / maxDistance, 1);
    
    const moveX = deltaX * 20 * scaleFactor;
    const moveY = deltaY * 10 * scaleFactor;
    
    heroTitle.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
  
  document.addEventListener('mouseleave', () => {
    heroTitle.style.transform = 'translate(0, 0)';
  });
}

// Initialize scroll animations
function initScrollAnimations() {
  // Configure the intersection observer
  const options = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.1 // 10% of the element visible
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Project items
        if (entry.target.classList.contains('project-item')) {
          entry.target.classList.add('active');
        }
        
        // About text
        if (entry.target.classList.contains('about-text')) {
          entry.target.classList.add('active');
        }
        
        // Services grid
        if (entry.target.classList.contains('services-grid')) {
          entry.target.classList.add('active');
        }
        
        // Team title
        if (entry.target.classList.contains('team-title')) {
          entry.target.classList.add('active');
        }
        
        // Skill categories
        if (entry.target.classList.contains('skill-category')) {
        entry.target.classList.add('active');
        }
        
        // Contact title
        if (entry.target.classList.contains('contact-title')) {
          entry.target.classList.add('active');
        }
        
        // Contact items
        if (entry.target.classList.contains('contact-item')) {
          entry.target.classList.add('active');
        }
        
        // Sections
        if (entry.target.classList.contains('section')) {
          entry.target.classList.add('active');
        }
      }
    });
  }, options);
  
  // Observe elements
  document.querySelectorAll('.project-item, .about-text, .services-grid, .team-title, .skill-category, .contact-title, .contact-item, .section').forEach(element => {
    observer.observe(element);
  });
  
  // Set index for staggered animations
  document.querySelectorAll('.skill-category').forEach((category, index) => {
    category.style.setProperty('--index', index);
  });
  
  document.querySelectorAll('.contact-item').forEach((item, index) => {
    item.style.setProperty('--index', index);
  });
}

// Create animated background particle effect
function createParticles() {
  const numParticles = 20;
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
  
  document.body.appendChild(container);
  
  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 1;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background-color: white;
      border-radius: 50%;
      opacity: ${Math.random() * 0.3};
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
    `;
    
    container.appendChild(particle);
    
    anime({
      targets: particle,
      translateX: anime.random(-100, 100),
      translateY: anime.random(-100, 100),
      scale: [
        { value: anime.random(1, 3), duration: anime.random(1000, 3000), easing: 'easeInOutQuad' },
        { value: 1, duration: anime.random(1000, 3000), easing: 'easeInOutQuad' }
      ],
      opacity: [
        { value: anime.random(0.1, 0.5), duration: anime.random(1000, 3000), easing: 'easeInOutQuad' },
        { value: 0, duration: anime.random(1000, 3000), easing: 'easeInOutQuad' }
      ],
      delay: anime.random(0, 2000),
      direction: 'alternate',
      loop: true
    });
  }
}

// Initialize particles on load
createParticles();

// Add parallax effect on mouse move
document.addEventListener('mousemove', (e) => {
  const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
  const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
  
  // Parallax for project images
  document.querySelectorAll('.project-image').forEach(image => {
    image.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
  
  // Parallax for hero title
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    heroTitle.style.transform = `translate(${moveX * 2}px, ${moveY * 2}px)`;
  }
});

// Smooth reveal for sections when they come into view
anime({
  targets: '.section',
  opacity: [0, 1],
  translateY: [50, 0],
  duration: 1500,
  easing: 'easeOutExpo',
  delay: anime.stagger(200)
});
