/**
 * Theme Management Module
 * Handles light/dark theme switching with localStorage persistence
 */

export class ThemeManager {
  constructor() {
    this.storageKey = 'artifex-theme';
    this.themeToggle = null;
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.setupDOM();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
  }

  /**
   * Setup DOM references
   */
  setupDOM() {
    this.themeToggle = document.getElementById('theme-toggle');
    
    if (!this.themeToggle) {
      console.warn('Theme toggle button not found');
      return;
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only apply system theme if no stored preference
        if (!this.getStoredTheme()) {
          const systemTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(systemTheme);
        }
      });
    }
  }

  /**
   * Get stored theme from localStorage
   */
  getStoredTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('Could not access localStorage for theme:', error);
      return null;
    }
  }

  /**
   * Get system theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Store theme preference
   */
  storeTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('Could not store theme preference:', error);
    }
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    this.currentTheme = theme;
    this.updateToggleState();
  }

  /**
   * Update theme toggle button state
   */
  updateToggleState() {
    if (!this.themeToggle) return;

    const lightIcon = this.themeToggle.querySelector('.light-icon');
    const darkIcon = this.themeToggle.querySelector('.dark-icon');

    if (this.currentTheme === 'dark') {
      this.themeToggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
      this.themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme);
      return;
    }

    this.applyTheme(theme);
    this.storeTheme(theme);

    // Dispatch custom event for other modules to listen to
    const event = new CustomEvent('themeChanged', {
      detail: { theme: theme }
    });
    document.dispatchEvent(event);
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Reset to system theme
   */
  resetToSystemTheme() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Could not remove theme preference:', error);
    }

    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
  }
}

// Create and export singleton instance
export const themeManager = new ThemeManager();