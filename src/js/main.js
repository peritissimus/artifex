// Initialize mode toggle
import('./mode-toggle.js');

// Initialize app
window.addEventListener('DOMContentLoaded', async () => {
  // Lazy load WebGL only when needed (HUMAN mode)
  if (document.body.dataset.mode === 'human') {
    // Dynamic import to avoid loading Three.js on pages that don't need it
    const { ParticleGrid } = await import('./webgl/ParticleGrid.js');
    new ParticleGrid();
  }

  // Initialize scroll glow effects
  const { ScrollGlow } = await import('./effects/ScrollGlow.js');
  new ScrollGlow();

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
