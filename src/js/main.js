/**
 * Main JavaScript file
 * Initializes the new component-based application
 */

import { app } from './app.js';
import { eventBus } from './modules/eventBus.js';

/**
 * Initialize the application when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Starting Artifex Portfolio Application...');

  try {
    // Initialize the main application
    await app.init();

    // Setup additional initialization after app is ready
    eventBus.on('app:ready', () => {
      console.log('🎉 Application is ready!');

      // Update footer year
      updateFooterYear();

      // Add any additional post-initialization logic here
      handlePostInitialization();
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});

/**
 * Updates the current year in the footer
 */
function updateFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Handle any additional logic after app initialization
 */
function handlePostInitialization() {
  // Add any additional setup that should happen after the app is fully loaded

  // Example: Setup analytics
  // setupAnalytics();

  // Example: Setup third-party integrations
  // setupThirdPartyServices();

  // Example: Setup A/B testing
  // setupABTesting();

  console.log('✅ Post-initialization setup completed');
}

/**
 * Performance monitoring
 */
if ('performance' in window) {
  window.addEventListener('load', () => {
    // Log performance metrics
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    console.log('📊 Performance Metrics:');
    console.log(`- DOM Content Loaded: ${navigation.domContentLoadedEventEnd}ms`);
    console.log(`- Load Complete: ${navigation.loadEventEnd}ms`);

    if (paint.length > 0) {
      paint.forEach((entry) => {
        console.log(`- ${entry.name}: ${entry.startTime}ms`);
      });
    }
  });
}

/**
 * Export app instance for external access
 */
export { app };

/**
 * Legacy support - maintain backwards compatibility during transition
 * Remove this section once migration is complete
 */
window.initLegacySupport = () => {
  console.warn('⚠️ Legacy support is deprecated. Please use the new component system.');

  // If needed, you can provide fallbacks here
  return {
    app,
    eventBus,
    // Add other exports as needed
  };
};
