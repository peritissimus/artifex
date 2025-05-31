/**
 * Blog Page JavaScript
 * Handles search, filtering, and blog post interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initBlogSearch();
  initCategoryFilters();
  initBlogPosts();
  initPagination();
  console.log('📝 Blog page initialized');
});

/**
 * Initialize blog search functionality
 */
function initBlogSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  const blogPosts = document.querySelectorAll('.blog-post');

  function performSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    blogPosts.forEach(post => {
      const title = post.querySelector('.post-title').textContent.toLowerCase();
      const excerpt = post.querySelector('.post-excerpt').textContent.toLowerCase();
      const category = post.querySelector('.post-category').textContent.toLowerCase();
      const tags = Array.from(post.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
      
      const matches = title.includes(searchTerm) || 
                     excerpt.includes(searchTerm) || 
                     category.includes(searchTerm) ||
                     tags.some(tag => tag.includes(searchTerm));
      
      if (searchTerm === '' || matches) {
        post.style.display = 'block';
        setTimeout(() => {
          post.style.opacity = '1';
          post.style.transform = 'translateY(0)';
        }, 50);
      } else {
        post.style.opacity = '0';
        post.style.transform = 'translateY(20px)';
        setTimeout(() => {
          post.style.display = 'none';
        }, 200);
      }
    });
  }

  // Search on input
  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  // Search on button click
  searchBtn.addEventListener('click', () => {
    performSearch(searchInput.value);
  });

  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(searchInput.value);
    }
  });
}

/**
 * Initialize category filtering
 */
function initCategoryFilters() {
  const categoryLinks = document.querySelectorAll('.category-link');
  const blogPosts = document.querySelectorAll('.blog-post');

  categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const category = link.textContent.split(' ')[0].toLowerCase(); // Get category name without count
      
      // Update active category
      categoryLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Filter posts
      blogPosts.forEach(post => {
        const postCategory = post.querySelector('.post-category').textContent.toLowerCase();
        
        if (category === 'all' || postCategory === category) {
          post.style.display = 'block';
          setTimeout(() => {
            post.style.opacity = '1';
            post.style.transform = 'translateY(0)';
          }, 50);
        } else {
          post.style.opacity = '0';
          post.style.transform = 'translateY(20px)';
          setTimeout(() => {
            post.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/**
 * Initialize blog post interactions
 */
function initBlogPosts() {
  const blogPosts = document.querySelectorAll('.blog-post');
  
  blogPosts.forEach(post => {
    // Add hover effects for better interaction feedback
    post.addEventListener('mouseenter', () => {
      const title = post.querySelector('.post-title a');
      if (title) {
        title.style.color = 'var(--color-primary)';
      }
    });
    
    post.addEventListener('mouseleave', () => {
      const title = post.querySelector('.post-title a');
      if (title) {
        title.style.color = '';
      }
    });
    
    // Handle tag clicks
    const tags = post.querySelectorAll('.tag');
    tags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagText = tag.textContent.toLowerCase();
        
        // Filter posts by tag
        blogPosts.forEach(p => {
          const postTags = Array.from(p.querySelectorAll('.tag')).map(t => t.textContent.toLowerCase());
          
          if (postTags.includes(tagText)) {
            p.style.display = 'block';
            setTimeout(() => {
              p.style.opacity = '1';
              p.style.transform = 'translateY(0)';
            }, 50);
          } else {
            p.style.opacity = '0';
            p.style.transform = 'translateY(20px)';
            setTimeout(() => {
              p.style.display = 'none';
            }, 200);
          }
        });
        
        // Update search input to show the filter
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.value = tagText;
        }
        
        // Visual feedback for tag click
        tag.style.transform = 'scale(1.1)';
        setTimeout(() => {
          tag.style.transform = '';
        }, 150);
      });
    });
  });
}

/**
 * Initialize pagination
 */
function initPagination() {
  const paginationNumbers = document.querySelectorAll('.pagination-number');
  const paginationBtns = document.querySelectorAll('.pagination-btn');
  
  paginationNumbers.forEach(number => {
    number.addEventListener('click', () => {
      // Update active page
      paginationNumbers.forEach(n => n.classList.remove('active'));
      number.classList.add('active');
      
      // Scroll to top of content
      const blogContent = document.querySelector('.blog-content');
      if (blogContent) {
        blogContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // In a real app, you'd load the appropriate page content here
      console.log('Page changed to:', number.textContent);
    });
  });
  
  paginationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) {
        // Handle prev/next logic here
        console.log('Pagination button clicked:', btn.textContent.trim());
      }
    });
  });
}

/**
 * Initialize archive links
 */
function initArchiveLinks() {
  const archiveLinks = document.querySelectorAll('.archive-link');
  
  archiveLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const archiveText = link.textContent.split(' ')[0] + ' ' + link.textContent.split(' ')[1]; // Month Year
      console.log('Archive clicked:', archiveText);
      
      // In a real app, you'd filter posts by date here
      // For now, just provide visual feedback
      link.style.background = 'var(--color-primary)';
      link.style.color = 'var(--color-bg-primary)';
      setTimeout(() => {
        link.style.background = '';
        link.style.color = '';
      }, 300);
    });
  });
}

// Initialize archive links
initArchiveLinks();

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