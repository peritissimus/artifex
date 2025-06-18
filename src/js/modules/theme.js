/**
 * Theme Management Module
 * Handles light/dark theme switching with localStorage persistence
 */

export class ThemeManager {
  constructor() {
    this.storageKey = 'artifex-theme';
    this.themeToggle = null;
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    this.initialized = false;
  }

  /**
   * Initialize theme manager
   */
  init() {
    if (this.initialized) {
      console.log('Theme manager already initialized');
      return;
    }
    
    console.log('Initializing theme manager...');
    this.setupDOM();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
    this.initialized = true;
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
    
    console.log('Theme toggle button found:', this.themeToggle);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.themeToggle) {
      console.log('Binding click event to theme toggle button');
      this.themeToggle.addEventListener('click', (e) => {
        console.log('Theme toggle clicked!');
        e.preventDefault();
        this.toggleTheme();
      });
    } else {
      console.warn('Cannot bind events - theme toggle button not found');
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
    
    console.log('Applying theme:', theme);
    console.log('Document root:', root);
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      console.log('Set data-theme="dark" on root');
    } else {
      root.removeAttribute('data-theme');
      console.log('Removed data-theme attribute from root');
    }

    this.currentTheme = theme;
    this.updateToggleState();
    
    // Check if theme was actually applied
    console.log('Current data-theme attribute:', root.getAttribute('data-theme'));
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
    console.log('Toggle theme called, current theme:', this.currentTheme);
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    console.log('Switching to theme:', newTheme);
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