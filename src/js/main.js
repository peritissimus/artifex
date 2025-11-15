// Initialize app
window.addEventListener('DOMContentLoaded', () => {
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
