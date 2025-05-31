/**
 * Projects Page JavaScript
 * Handles filtering, interactions, and project detail modals
 */

document.addEventListener('DOMContentLoaded', () => {
  initProjectFilters();
  initProjectCards();
  console.log('🎨 Projects page initialized');
});

/**
 * Initialize project filtering functionality
 */
function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      
      // Update active filter button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Filter project cards
      projectCards.forEach(card => {
        const categories = card.dataset.category.toLowerCase();
        
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'block';
          // Add a small delay for staggered animation
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/**
 * Initialize project card interactions
 */
function initProjectCards() {
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach(card => {
    // Add click handler for project details
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on a link
      if (e.target.closest('.project-link')) return;
      
      const projectTitle = card.querySelector('.project-title').textContent;
      const projectDescription = card.querySelector('.project-description').textContent;
      const projectCategory = card.querySelector('.project-category').textContent;
      const projectYear = card.querySelector('.project-year').textContent;
      const techTags = Array.from(card.querySelectorAll('.tech-tag')).map(tag => tag.textContent);
      
      // You could open a modal or navigate to a detail page here
      console.log('Project clicked:', {
        title: projectTitle,
        description: projectDescription,
        category: projectCategory,
        year: projectYear,
        technologies: techTags
      });
      
      // For now, just add a visual feedback
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
    });
    
    // Handle project link clicks
    const projectLinks = card.querySelectorAll('.project-link');
    projectLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        // Add visual feedback
        link.style.transform = 'scale(1.2)';
        setTimeout(() => {
          link.style.transform = '';
        }, 150);
      });
    });
  });
}

/**
 * Add smooth scroll behavior for any anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Initialize smooth scroll
initSmoothScroll();