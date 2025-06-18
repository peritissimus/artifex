/**
 * Main Application Class
 * Orchestrates the entire application initialization and component management
 */

import { eventBus } from './modules/eventBus.js';
import APP_CONFIG from '../config/app.config.js';

// Component imports
import { NavigationComponent } from './components/NavigationComponent.js';
import { ProjectsComponent } from './components/ProjectsComponent.js';
import { SkillsComponent } from './components/SkillsComponent.js';
import { ContactComponent } from './components/ContactComponent.js';
import { ProjectDetailComponent } from './components/ProjectDetailComponent.js';

// Module imports (legacy support during transition)
import { initAnimations } from './modules/animations.js';
import { initCubeBackground } from './modules/cube-bg.js';
import { initProjectInteractions } from './modules/projectInteractions.js';
import { themeManager } from './modules/theme.js';

export class App {
  constructor() {
    this.components = new Map();
    this.initialized = false;
    this.loading = false;
  }

  async init() {
    if (this.initialized || this.loading) return;

    this.loading = true;

    try {
      // Show loading state if needed
      this.showLoadingState();

      // Initialize components (no data loading needed for static version)
      await this.initializeComponents();

      // Initialize legacy modules (during transition)
      this.initializeLegacyModules();

      // Setup global event listeners
      this.setupGlobalEvents();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      // Mark as initialized
      this.initialized = true;
      this.loading = false;

      // Hide loading state
      this.hideLoadingState();

      // Emit app ready event
      eventBus.emit('app:ready', { app: this });

      console.log('✅ App initialized successfully');
    } catch (error) {
      this.loading = false;
      console.error('❌ Failed to initialize app:', error);
      this.handleInitializationError(error);
    }
  }

  // Removed loadData method - not needed for static version

  async initializeComponents() {
    console.log('🏗️ Initializing components...');

    const componentConfigs = [
      {
        name: 'navigation',
        component: NavigationComponent,
        element: document.querySelector('header'),
        options: {},
      },
      {
        name: 'projects',
        component: ProjectsComponent,
        element: document.querySelector('.projects-list'),
        options: { autoRender: true },
      },
      {
        name: 'skills',
        component: SkillsComponent,
        element: document.querySelector('.skills-compact'),
        options: {
          autoRender: true,
          animateOnScroll: true,
        },
      },
      {
        name: 'contact',
        component: ContactComponent,
        element: document.querySelector('#contact'),
        options: { autoRender: true },
      },
      {
        name: 'projectDetail',
        component: ProjectDetailComponent,
        element: document.querySelector('#project-detail-container'),
        options: {},
      },
    ];

    for (const config of componentConfigs) {
      try {
        if (config.element) {
          const componentInstance = new config.component(config.element, config.options);
          this.components.set(config.name, componentInstance);
          console.log(`✅ ${config.name} component initialized`);
        } else {
          console.warn(`⚠️ Element not found for ${config.name} component`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize ${config.name} component:`, error);
      }
    }
  }

  initializeLegacyModules() {
    console.log('🔄 Initializing legacy modules...');

    try {
      // Initialize theme manager
      if (themeManager) {
        themeManager.init();
        console.log('✅ Theme manager initialized');
      }

      // Initialize cube background
      initCubeBackground();
      console.log('✅ Cube background initialized');

      // Initialize animations
      initAnimations();
      console.log('✅ Animations initialized');

      // Initialize project interactions
      initProjectInteractions();
      console.log('✅ Project interactions initialized');
    } catch (error) {
      console.error('❌ Failed to initialize legacy modules:', error);
    }
  }

  setupGlobalEvents() {
    console.log('🌐 Setting up global event listeners...');

    // Window resize handler
    this.handleResize = this.debounce(() => {
      eventBus.emit('window:resize', {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, APP_CONFIG.performance.debounceTime.resize);

    window.addEventListener('resize', this.handleResize);

    // Window scroll handler
    this.handleScroll = this.debounce(() => {
      eventBus.emit('window:scroll', {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
      });
    }, APP_CONFIG.performance.debounceTime.scroll);

    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      eventBus.emit('page:visibility-change', {
        visible: !document.hidden,
      });
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Error handling
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, 'JavaScript Error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
    });
  }

  setupPerformanceMonitoring() {
    // Monitor performance if supported
    if ('performance' in window && 'PerformanceObserver' in window) {
      try {
        // Monitor largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('📊 LCP:', lastEntry.startTime);
          eventBus.emit('performance:lcp', { value: lastEntry.startTime });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor cumulative layout shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (clsValue > 0) {
            console.log('📊 CLS:', clsValue);
            eventBus.emit('performance:cls', { value: clsValue });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }

  showLoadingState() {
    const body = document.body;
    body.classList.add('app-loading');

    // Optional: Add a loading spinner or message
    const loadingElement = document.createElement('div');
    loadingElement.className = 'app-loading-overlay';
    loadingElement.innerHTML = `
      <div class="app-loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
    body.appendChild(loadingElement);
  }

  hideLoadingState() {
    const body = document.body;
    body.classList.remove('app-loading');

    const loadingElement = document.querySelector('.app-loading-overlay');
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  handleInitializationError(error) {
    console.error('App initialization failed:', error);

    // Show error message to user
    const errorElement = document.createElement('div');
    errorElement.className = 'app-error';
    errorElement.innerHTML = `
      <div class="app-error-content">
        <h2>Something went wrong</h2>
        <p>The application failed to load properly. Please refresh the page to try again.</p>
        <button onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
    document.body.appendChild(errorElement);

    // Emit error event
    eventBus.emit('app:error', { error, type: 'initialization' });
  }

  handleGlobalError(error, type) {
    console.error(`Global ${type}:`, error);
    eventBus.emit('app:error', { error, type });

    // You could send to analytics/error reporting service here
  }

  // Utility methods
  debounce(func, wait) {
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

  // Component management methods
  getComponent(name) {
    return this.components.get(name);
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  // Navigation helpers
  navigateToSection(sectionId) {
    const navigation = this.getComponent('navigation');
    if (navigation) {
      navigation.navigateToSection(sectionId);
    }
  }

  getCurrentSection() {
    const navigation = this.getComponent('navigation');
    return navigation ? navigation.getCurrentActiveSection() : null;
  }

  // Removed data management helpers - not needed for static version

  // Cleanup method
  cleanup() {
    console.log('🧹 Cleaning up application...');

    // Remove global event listeners
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }

    if (this.handleScroll) {
      window.removeEventListener('scroll', this.handleScroll);
    }

    // Destroy all components
    this.components.forEach((component, name) => {
      if (typeof component.destroy === 'function') {
        component.destroy();
        console.log(`✅ ${name} component destroyed`);
      }
    });

    // Clear components map
    this.components.clear();

    // Clear event bus
    eventBus.clear();

    console.log('✅ Application cleanup completed');
  }

  // Development helpers
  getDebugInfo() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      components: Array.from(this.components.keys()),
      config: APP_CONFIG,
    };
  }
}

// Create and export app instance
export const app = new App();

// Make app available globally for debugging
if (typeof window !== 'undefined') {
  window.app = app;
}

export default app;
