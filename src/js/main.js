import { ParticleGrid } from './webgl/ParticleGrid.js';

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  // Initialize WebGL background (only on HUMAN mode, not on ai.html)
  if (document.body.dataset.mode === 'human') {
    new ParticleGrid();
  }

  // Project item click navigation
  document.querySelectorAll('.project-item').forEach((item) => {
    item.addEventListener('click', () => {
      const path = item.getAttribute('data-path');
      if (path) {
        window.location.href = path;
      }
    });
  });
});
