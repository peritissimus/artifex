/**
 * Mode Toggle System
 * Handles HUMAN/MACHINE mode switching across all pages
 */

class ModeToggle {
  constructor() {
    this.currentMode = this.getCurrentMode();
    this.init();
  }

  /**
   * Determine current mode based on URL
   */
  getCurrentMode() {
    const path = window.location.pathname;
    return path === '/ai.html' || path.endsWith('/ai.html') ? 'machine' : 'human';
  }

  /**
   * Get the corresponding page URL for the opposite mode
   */
  getOppositePageUrl() {
    const path = window.location.pathname;

    // If we're on ai.html, go to index
    if (path === '/ai.html' || path.endsWith('/ai.html')) {
      return '/';
    }

    // If we're on index, go to ai.html
    if (path === '/' || path === '/index.html' || path.endsWith('/index.html')) {
      return '/ai.html';
    }

    // For other pages (blog, about, contact, work), stay on the same page
    // but could be extended to have machine versions
    return this.currentMode === 'human' ? '/ai.html' : '/';
  }

  /**
   * Initialize mode toggle
   */
  init() {
    this.updateModeToggle();
  }

  /**
   * Update mode toggle buttons to reflect current state
   */
  updateModeToggle() {
    const modeToggle = document.querySelector('.mode-toggle');
    if (!modeToggle) return;

    const humanBtn = modeToggle.querySelector('[data-mode="human"]');
    const machineBtn = modeToggle.querySelector('[data-mode="machine"]');

    if (!humanBtn || !machineBtn) return;

    // Remove active class from both
    humanBtn.classList.remove('active');
    machineBtn.classList.remove('active');

    // Add active class to current mode
    if (this.currentMode === 'human') {
      humanBtn.classList.add('active');
    } else {
      machineBtn.classList.add('active');
    }

    // Update URLs
    const oppositeUrl = this.getOppositePageUrl();
    if (this.currentMode === 'human') {
      machineBtn.href = oppositeUrl;
    } else {
      humanBtn.href = oppositeUrl;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ModeToggle();
  });
} else {
  new ModeToggle();
}

export default ModeToggle;
